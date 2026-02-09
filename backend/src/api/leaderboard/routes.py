"""Leaderboard API routes

Provides ranked agent listings with composite scoring.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent
from src.services.scoring import calc_agent_score

router = APIRouter()


class LeaderboardItem(BaseModel):
    """Single leaderboard entry"""
    rank: int
    agent_id: str
    agent_name: str
    token_id: Optional[int]
    network_key: str
    score: float
    service_score: float
    usage_score: float
    quality_score: float
    profile_score: float
    reputation_score: float
    reputation_count: int
    has_working_endpoints: bool


class LeaderboardResponse(BaseModel):
    """Paginated leaderboard response"""
    items: list[LeaderboardItem]
    total: int
    page: int
    page_size: int
    total_pages: int


SORT_FIELDS = {"score", "service", "usage", "quality", "profile"}


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    network: Optional[str] = Query(default=None, description="Filter by network key"),
    sort_by: str = Query(default="score", description="Sort field"),
    db: Session = Depends(get_db),
):
    """Get ranked agent leaderboard with composite scores."""

    if sort_by not in SORT_FIELDS:
        sort_by = "score"

    # Query all agents (with optional network filter)
    query = db.query(Agent)
    if network:
        query = query.filter(Agent.network_id == network)

    agents = query.all()

    # Calculate scores for each agent
    scored = []
    for agent in agents:
        has_working = bool(
            agent.endpoint_status
            and agent.endpoint_status.get("has_working_endpoints")
        )

        scores = calc_agent_score(
            endpoint_status=agent.endpoint_status,
            feedback_count=agent.reputation_count or 0,
            reputation_score=agent.reputation_score or 0.0,
            reputation_last_updated=agent.reputation_last_updated,
            name=agent.name or "",
            description=agent.description or "",
            skills=agent.skills,
            domains=agent.domains,
        )

        scored.append({
            "agent": agent,
            "has_working": has_working,
            **scores,
        })

    # Sort by requested field
    sort_key = f"{sort_by}_score" if sort_by != "score" else "score"
    scored.sort(key=lambda x: x[sort_key], reverse=True)

    # Paginate
    total = len(scored)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = scored[start:end]

    items = [
        LeaderboardItem(
            rank=start + i + 1,
            agent_id=item["agent"].id,
            agent_name=item["agent"].name or "Unknown Agent",
            token_id=item["agent"].token_id,
            network_key=item["agent"].network_id,
            score=item["score"],
            service_score=item["service_score"],
            usage_score=item["usage_score"],
            quality_score=item["quality_score"],
            profile_score=item["profile_score"],
            reputation_score=item["agent"].reputation_score or 0.0,
            reputation_count=item["agent"].reputation_count or 0,
            has_working_endpoints=item["has_working"],
        )
        for i, item in enumerate(page_items)
    ]

    return LeaderboardResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
