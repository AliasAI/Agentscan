"""Leaderboard API routes

Provides ranked agent listings with composite scoring.
Streams source rows and caches compact scores for five minutes.
"""

import time
from collections import OrderedDict
from operator import attrgetter
from anyio import CapacityLimiter, to_thread
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import NamedTuple, Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent
from src.services.scoring import calc_agent_score

router = APIRouter()

CACHE_TTL = 300  # 5 minutes
MAX_CACHED_SCOPES = 4
SCORE_BATCH_SIZE = 1000


class ScoredAgent(NamedTuple):
    id: str
    name: str
    token_id: Optional[int]
    network_id: str
    reputation_score: float
    reputation_count: int
    has_working: bool
    score: float
    service_score: float
    usage_score: float
    freshness_score: float
    profile_score: float


_score_cache: OrderedDict[str | None, tuple[float, list[ScoredAgent]]] = OrderedDict()
_leaderboard_limiter = CapacityLimiter(1)


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
    freshness_score: float
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


SORT_FIELDS = {"score", "service", "usage", "freshness", "profile"}


MIN_SCORE_THRESHOLD = 10  # Profile alone reaches this only with all four fields.


def _build_scored_list(db: Session, network: Optional[str]) -> list[ScoredAgent]:
    """Score candidates in batches using only the fields needed for ranking."""
    total_endpoints = Agent.endpoint_status["total_endpoints"].as_integer()
    healthy_endpoints = Agent.endpoint_status["healthy_endpoints"].as_integer()
    query = db.query(
        Agent.id,
        Agent.name,
        Agent.token_id,
        Agent.network_id,
        total_endpoints.label("total_endpoints"),
        healthy_endpoints.label("healthy_endpoints"),
        Agent.endpoint_status["has_working_endpoints"].as_boolean().label("has_working"),
        Agent.reputation_count,
        Agent.reputation_score,
        Agent.reputation_last_updated,
        Agent.description,
        Agent.skills,
        Agent.domains,
    )
    # Without service, usage, or freshness, all four profile fields are
    # needed to meet the score threshold. Leave exact scoring to Python.
    query = query.filter(or_(
        healthy_endpoints != 0,
        Agent.reputation_count > 0,
        Agent.reputation_score > 0,
        Agent.reputation_last_updated.is_not(None),
        (Agent.skills != "[]") & (Agent.domains != "[]"),
    ))
    if network:
        query = query.filter(Agent.network_id == network)

    scored = []
    for row in query.yield_per(SCORE_BATCH_SIZE):
        scores = calc_agent_score(
            endpoint_status={
                "total_endpoints": row.total_endpoints or 0,
                "healthy_endpoints": row.healthy_endpoints or 0,
            },
            feedback_count=row.reputation_count or 0,
            reputation_score=row.reputation_score or 0.0,
            reputation_last_updated=row.reputation_last_updated,
            name=row.name or "",
            description=row.description or "",
            skills=row.skills,
            domains=row.domains,
        )
        if scores["score"] >= MIN_SCORE_THRESHOLD:
            scored.append(ScoredAgent(
                id=row.id,
                name=row.name or "Unknown Agent",
                token_id=row.token_id,
                network_id=row.network_id,
                reputation_score=row.reputation_score or 0.0,
                reputation_count=row.reputation_count or 0,
                has_working=bool(row.has_working),
                **scores,
            ))

    return scored


def _get_scored_list(db: Session, network: Optional[str]) -> list[ScoredAgent]:
    """Reuse scores while fresh and evict old scopes."""
    network = network or None
    now = time.monotonic()
    for key, (expires, _) in list(_score_cache.items()):
        if expires <= now:
            del _score_cache[key]
    if network in _score_cache:
        _score_cache.move_to_end(network)
        return _score_cache[network][1]

    items = _build_scored_list(db, network)
    _score_cache[network] = (time.monotonic() + CACHE_TTL, items)
    if len(_score_cache) > MAX_CACHED_SCOPES:
        _score_cache.popitem(last=False)
    return items


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    network: Optional[str] = Query(default=None, description="Filter by network key"),
    sort_by: str = Query(default="score", description="Sort field"),
    db: Session = Depends(get_db),
):
    """Get ranked agent leaderboard with composite scores."""
    return await to_thread.run_sync(
        _get_leaderboard, db, network, sort_by, page, page_size,
        limiter=_leaderboard_limiter,
    )


def _get_leaderboard(
    db: Session, network: Optional[str], sort_by: str, page: int, page_size: int
) -> LeaderboardResponse:
    if sort_by not in SORT_FIELDS:
        sort_by = "score"

    scored = _get_scored_list(db, network)

    # Sort by requested field
    sort_key = f"{sort_by}_score" if sort_by != "score" else "score"
    scored_sorted = sorted(scored, key=attrgetter(sort_key), reverse=True)

    # Paginate
    total = len(scored_sorted)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    page_items = scored_sorted[start:start + page_size]

    items = [
        LeaderboardItem(
            rank=start + i + 1,
            agent_id=item.id,
            agent_name=item.name,
            token_id=item.token_id,
            network_key=item.network_id,
            score=item.score,
            service_score=item.service_score,
            usage_score=item.usage_score,
            freshness_score=item.freshness_score,
            profile_score=item.profile_score,
            reputation_score=item.reputation_score,
            reputation_count=item.reputation_count,
            has_working_endpoints=item.has_working,
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
