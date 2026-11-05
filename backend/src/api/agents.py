"""Agent API"""

from datetime import datetime
from functools import partial

from anyio import CapacityLimiter, to_thread
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload, defer, selectinload
from sqlalchemy import func
from starlette.concurrency import run_in_threadpool

from src.db.database import get_db
from src.models import Agent
from src.schemas.agent import AgentResponse, AgentListItem
from src.schemas.common import PaginatedResponse
from src.services.metadata_processor import refresh_agent_metadata
from src.services.public_snapshot import PublicSnapshot

router = APIRouter()
_agent_list_limiter = CapacityLimiter(4)


def apply_quality_filter(query, quality: str):
    """Apply quality filtering to agent query.

    Quality levels:
    - 'all': No filtering
    - 'basic': Pre-computed is_quality flag (real name + meaningful description)
    - 'verified': Basic + has reputation (score > 0 or count > 0)
    """
    if quality == "all":
        return query

    query = query.filter(Agent.is_quality == True)  # noqa: E712

    if quality == "verified":
        query = query.filter(
            (Agent.reputation_score > 0) | (Agent.reputation_count > 0)
        )

    return query


# If metadata was refreshed more than this many seconds ago, refresh on detail view
METADATA_STALE_SECONDS = 3600  # 1 hour

ALLOWED_SORT_FIELDS = {"created_at", "name", "reputation_score"}


@router.get("/agents", response_model=PaginatedResponse[AgentListItem])
async def get_agents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    network: str | None = Query(None, description="Filter by network ID or 'all'"),
    ecosystem: str | None = Query(None, description="Filter by ecosystem name"),
    capability: str | None = Query(None, description="Filter by capability name"),
    reputation_min: float | None = Query(None, ge=0),
    reputation_max: float | None = Query(None, ge=0),
    has_reputation: bool | None = Query(None, description="Filter agents with reputation activity"),
    quality: str = Query("all", description="Quality filter: all, basic, verified"),
    sort_field: str = Query("created_at", description="Sort field: created_at, name, reputation_score"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
):
    """Get agent list with sorting, filtering, pagination and search"""
    if (
        page == 1 and page_size == 8 and quality == "basic"
        and sort_field == "created_at" and sort_order == "desc"
        and network in (None, "", "all")
        and not (search or ecosystem or capability or has_reputation)
        and reputation_min is None and reputation_max is None
    ):
        return await recent_agents_snapshot.get(db)
    load = partial(
        _list_agents, db, page, page_size, search=search, network=network,
        ecosystem=ecosystem, capability=capability, reputation_min=reputation_min,
        reputation_max=reputation_max, has_reputation=has_reputation, quality=quality,
        sort_field=sort_field, sort_order=sort_order,
    )
    return await to_thread.run_sync(load, limiter=_agent_list_limiter)


def _list_agents(
    db: Session,
    page: int,
    page_size: int,
    *,
    search: str | None = None,
    network: str | None = None,
    ecosystem: str | None = None,
    capability: str | None = None,
    reputation_min: float | None = None,
    reputation_max: float | None = None,
    has_reputation: bool | None = None,
    quality: str = "all",
    sort_field: str = "created_at",
    sort_order: str = "desc",
) -> PaginatedResponse[AgentListItem]:
    # Defer heavy JSON columns not needed in list view
    query = db.query(Agent).select_from(Agent).options(
        joinedload(Agent.network),
        selectinload(Agent.ecosystem_links),
        selectinload(Agent.capabilities),
        defer(Agent.on_chain_data),
        defer(Agent.endpoint_status),
    )

    # Quality filtering (uses composite index)
    query = apply_quality_filter(query, quality)

    # Network filtering
    if network and network != "all":
        query = query.filter(Agent.network_id == network)

    if ecosystem:
        query = query.filter(Agent.ecosystem_links.any(ecosystem_name=ecosystem))

    if capability:
        query = query.filter(Agent.capabilities.any(capability_name=capability))

    # Case-insensitive search
    if search:
        term = search.lower()
        query = query.filter(
            (func.lower(Agent.name).contains(term))
            | (Agent.address.contains(search))
            | (func.lower(Agent.description).contains(term))
        )

    # Reputation score filtering
    if reputation_min is not None:
        query = query.filter(Agent.reputation_score >= reputation_min)
    if reputation_max is not None:
        query = query.filter(Agent.reputation_score <= reputation_max)

    # Has reputation filter (agents with any feedback activity)
    if has_reputation is True:
        query = query.filter(
            (Agent.reputation_score > 0) | (Agent.reputation_count > 0)
        )

    # Sorting
    field = sort_field if sort_field in ALLOWED_SORT_FIELDS else "created_at"
    column = getattr(Agent, field)
    query = query.order_by(column.asc() if sort_order == "asc" else column.desc())

    # Optimized COUNT: strip ORDER BY and skip ORM hydration
    total = query.with_entities(func.count()).order_by(None).scalar()
    total_pages = (total + page_size - 1) // page_size

    # Apply pagination
    agents = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [AgentListItem.from_orm_with_network(agent) for agent in agents]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/agents/trending")
async def get_trending_agents(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    if limit == 5:
        return await trending_snapshot.get(db)
    return await run_in_threadpool(_build_trending_agents, db, limit)


def _build_trending_agents(db: Session, limit: int):
    """Get trending agents for homepage: top_ranked, featured, trending.

    All lists are filtered to show only quality agents (with name + description).
    """

    def base_query():
        return apply_quality_filter(
            db.query(Agent).options(
                joinedload(Agent.network),
                selectinload(Agent.ecosystem_links),
                selectinload(Agent.capabilities),
                defer(Agent.on_chain_data),
                defer(Agent.endpoint_status),
            ),
            "basic",
        )

    # Top Ranked: highest reputation score (must have reviews)
    top_ranked = (
        base_query()
        .filter(Agent.reputation_score > 0)
        .order_by(Agent.reputation_score.desc())
        .limit(limit)
        .all()
    )

    # Featured: most reviews (reputation_count)
    featured = (
        base_query()
        .filter(Agent.reputation_count > 0)
        .order_by(Agent.reputation_count.desc())
        .limit(limit)
        .all()
    )

    # Trending: newest quality agents
    trending = (
        base_query()
        .order_by(Agent.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "top_ranked": [AgentListItem.from_orm_with_network(a) for a in top_ranked],
        "featured": [AgentListItem.from_orm_with_network(a) for a in featured],
        "trending": [AgentListItem.from_orm_with_network(a) for a in trending],
    }


trending_snapshot = PublicSnapshot("trending_agents", 300, lambda db: _build_trending_agents(db, 5))
recent_agents_snapshot = PublicSnapshot(
    "recent_agents", 300, lambda db: _list_agents(db, 1, 8, quality="basic")
)


@router.get("/agents/featured", response_model=list[AgentListItem])
async def get_featured_agents(db: Session = Depends(get_db)):
    """Get featured agents (top 8 by reputation)"""

    agents = (
        db.query(Agent)
        .options(
            joinedload(Agent.network),
            selectinload(Agent.ecosystem_links),
            selectinload(Agent.capabilities),
            defer(Agent.on_chain_data),
            defer(Agent.endpoint_status),
        )
        .order_by(Agent.reputation_score.desc())
        .limit(8)
        .all()
    )
    return [AgentListItem.from_orm_with_network(agent) for agent in agents]


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get agent detail (triggers on-demand metadata refresh if stale)"""

    agent = (
        db.query(Agent)
        .options(
            joinedload(Agent.network),
            selectinload(Agent.ecosystem_links),
            selectinload(Agent.capabilities),
        )
        .filter(Agent.id == agent_id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # On-demand metadata refresh if stale
    needs_refresh = (
        agent.metadata_uri
        and (
            agent.metadata_refreshed_at is None
            or (datetime.utcnow() - agent.metadata_refreshed_at).total_seconds()
            > METADATA_STALE_SECONDS
        )
    )
    if needs_refresh:
        await refresh_agent_metadata(db, agent)

    return AgentResponse.from_orm_with_network(agent)
