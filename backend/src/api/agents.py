"""Agent API"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload, defer
from sqlalchemy import func

from src.db.database import get_db
from src.models import Agent
from src.schemas.agent import AgentResponse, AgentListItem
from src.schemas.common import PaginatedResponse
from src.services.metadata_processor import refresh_agent_metadata

router = APIRouter()


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
    reputation_min: float | None = Query(None, ge=0),
    reputation_max: float | None = Query(None, ge=0),
    has_reputation: bool | None = Query(None, description="Filter agents with reputation activity"),
    quality: str = Query("all", description="Quality filter: all, basic, verified"),
    sort_field: str = Query("created_at", description="Sort field: created_at, name, reputation_score"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(get_db),
):
    """Get agent list with sorting, filtering, pagination and search"""

    # Defer heavy JSON columns not needed in list view
    query = db.query(Agent).options(
        joinedload(Agent.network),
        defer(Agent.on_chain_data),
        defer(Agent.endpoint_status),
    )

    # Quality filtering (uses composite index)
    query = apply_quality_filter(query, quality)

    # Network filtering
    if network and network != "all":
        query = query.filter(Agent.network_id == network)

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
    total = query.with_entities(func.count(Agent.id)).order_by(None).scalar()
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
    """Get trending agents for homepage: top_ranked, featured, trending.

    All lists are filtered to show only quality agents (with name + description).
    """

    def base_query():
        return apply_quality_filter(
            db.query(Agent).options(
                joinedload(Agent.network),
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


@router.get("/agents/featured", response_model=list[AgentListItem])
async def get_featured_agents(db: Session = Depends(get_db)):
    """Get featured agents (top 8 by reputation)"""

    agents = (
        db.query(Agent)
        .options(
            joinedload(Agent.network),
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
        .options(joinedload(Agent.network))
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
