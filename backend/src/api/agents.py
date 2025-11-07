"""Agent API"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models import Agent, AgentStatus
from src.schemas.agent import AgentResponse
from src.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/agents", response_model=PaginatedResponse[AgentResponse])
async def get_agents(
    tab: str = Query("all", description="Filter tab: all, active, new, top"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    """Get agent list with tab filtering, pagination and search"""

    query = db.query(Agent)

    # Tab filtering
    if tab == "active":
        # Active in the last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(
            Agent.status == AgentStatus.ACTIVE,
            Agent.updated_at >= seven_days_ago
        )
    elif tab == "new":
        # Registered in the last 24 hours
        one_day_ago = datetime.utcnow() - timedelta(hours=24)
        query = query.filter(Agent.created_at >= one_day_ago)
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

    # Default ordering: newest first (descending by created_at)
    # Only apply if "top" tab hasn't already set ordering
    if tab != "top":
        query = query.order_by(Agent.created_at.desc())

    # Get total count before pagination
    total = query.count()
    total_pages = (total + page_size - 1) // page_size

    # Apply pagination
    items = query.offset((page - 1) * page_size).limit(page_size).all()

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

    agents = db.query(Agent).order_by(Agent.reputation_score.desc()).limit(8).all()
    return agents


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """获取代理详情"""

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
