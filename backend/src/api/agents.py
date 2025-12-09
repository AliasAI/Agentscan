"""Agent API"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload

from src.db.database import get_db
from src.models import Agent, AgentStatus
from src.schemas.agent import AgentResponse
from src.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/agents", response_model=PaginatedResponse[AgentResponse])
async def get_agents(
    tab: str = Query("all", description="Filter tab: all, active, top"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    network: str | None = Query(None, description="Filter by network ID or 'all'"),
    reputation_min: float | None = Query(None, ge=0, le=100, description="Minimum reputation score"),
    reputation_max: float | None = Query(None, ge=0, le=100, description="Maximum reputation score"),
    db: Session = Depends(get_db),
):
    """Get agent list with tab filtering, pagination, search and network filter"""

    query = db.query(Agent).options(joinedload(Agent.network))

    # Network filtering
    if network and network != "all":
        query = query.filter(Agent.network_id == network)

    # Tab filtering
    if tab == "active":
        # Active: has reputation activity in the last 7 days OR created recently
        # Priority: reputation_last_updated > created_at (for new agents without reviews)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(
            Agent.status == AgentStatus.ACTIVE,
            (
                (Agent.reputation_last_updated >= seven_days_ago) |
                (
                    (Agent.reputation_last_updated.is_(None)) &
                    (Agent.created_at >= seven_days_ago)
                )
            )
        )
    elif tab == "top":
        # Top rated agents
        query = query.order_by(Agent.reputation_score.desc())

    # Search functionality
    if search:
        query = query.filter(
            (Agent.name.contains(search)) |
            (Agent.address.contains(search)) |
            (Agent.description.contains(search))
        )

    # Reputation score filtering
    if reputation_min is not None:
        query = query.filter(Agent.reputation_score >= reputation_min)
    if reputation_max is not None:
        query = query.filter(Agent.reputation_score <= reputation_max)

    # Default ordering: newest first (descending by created_at)
    # Only apply if "top" tab hasn't already set ordering
    if tab != "top":
        query = query.order_by(Agent.created_at.desc())

    # Get total count before pagination
    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    # Apply pagination
    agents = query.offset((page - 1) * page_size).limit(page_size).all()

    # Convert to response with network_name
    items = [AgentResponse.from_orm_with_network(agent) for agent in agents]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/agents/featured", response_model=list[AgentResponse])
async def get_featured_agents(db: Session = Depends(get_db)):
    """获取精选代理（前8个）"""

    agents = (
        db.query(Agent)
        .options(joinedload(Agent.network))
        .order_by(Agent.reputation_score.desc())
        .limit(8)
        .all()
    )
    return [AgentResponse.from_orm_with_network(agent) for agent in agents]


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """获取代理详情"""

    agent = (
        db.query(Agent)
        .options(joinedload(Agent.network))
        .filter(Agent.id == agent_id)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentResponse.from_orm_with_network(agent)
