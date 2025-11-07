"""Activity API"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload

from src.db.database import get_db
from src.models.activity import Activity
from src.models.agent import Agent
from src.schemas.activity import ActivityResponse
from src.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/activities", response_model=PaginatedResponse[ActivityResponse])
async def get_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get activity list with pagination"""

    # Get total count
    total = db.query(Activity).count()

    # Get paginated activities with agent info
    activities = (
        db.query(Activity)
        .options(joinedload(Activity.agent))
        .order_by(Activity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        items=activities,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/activities/agent/{agent_id}", response_model=list[ActivityResponse])
async def get_agent_activities(
    agent_id: str,
    db: Session = Depends(get_db),
):
    """Get activities for a specific agent"""

    # Verify agent exists
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get agent's activities
    activities = (
        db.query(Activity)
        .options(joinedload(Activity.agent))
        .filter(Activity.agent_id == agent_id)
        .order_by(Activity.created_at.desc())
        .all()
    )

    return activities
