"""Feedback and Validation API

Endpoints for querying feedback (reviews) and validation history.
Uses hybrid approach:
1. Database cache (full info, fast)
2. On-chain view functions fallback (basic info, no block scanning)
"""

import math
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import structlog

from src.db.database import get_db
from src.models import Agent, Feedback, Validation
from src.schemas.feedback import (
    FeedbackListResponse,
    FeedbackResponse,
    ValidationListResponse,
    ValidationResponse,
    ReputationSummaryResponse,
)
from src.services.onchain_reader import get_onchain_reader

router = APIRouter()
logger = structlog.get_logger(__name__)


def _get_agent(agent_id: str, db: Session) -> Agent:
    """Get agent from database or raise 404."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get(
    "/agents/{agent_id}/feedbacks",
    response_model=FeedbackListResponse,
)
async def get_agent_feedbacks(
    agent_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Get feedback history for an agent.

    Hybrid approach:
    1. First try database cache (full info including feedbackURI, timestamp)
    2. If cache empty, use on-chain view functions (basic info only)
    """
    agent = _get_agent(agent_id, db)

    # Get on-chain count to verify cache completeness
    onchain_count = 0
    if agent.token_id is not None:
        network_key = agent.network.id if agent.network else "sepolia"
        reader = get_onchain_reader()
        summary = reader.get_feedback_summary(agent.token_id, network_key)
        onchain_count = summary["count"]

    # Try database cache first
    db_count = db.query(Feedback).filter(
        Feedback.agent_id == agent_id,
        Feedback.is_revoked == False
    ).count()

    # Use cache only if it has ALL feedbacks (or more due to sync timing)
    if db_count >= onchain_count and db_count > 0:
        # Cache hit - return full info
        offset = (page - 1) * page_size
        feedbacks = db.query(Feedback).filter(
            Feedback.agent_id == agent_id,
            Feedback.is_revoked == False
        ).order_by(desc(Feedback.block_number)).offset(offset).limit(page_size).all()

        items = [FeedbackResponse(
            id=fb.id,
            score=fb.score,
            client_address=fb.client_address,
            feedback_index=fb.feedback_index,
            tag1=fb.tag1,
            tag2=fb.tag2,
            endpoint=fb.endpoint,
            feedback_uri=fb.feedback_uri,
            feedback_hash=fb.feedback_hash,
            is_revoked=fb.is_revoked,
            timestamp=fb.timestamp.isoformat() + "Z" if fb.timestamp else None,
            block_number=fb.block_number,
            transaction_hash=fb.transaction_hash,
        ) for fb in feedbacks]

        total_pages = math.ceil(db_count / page_size) if db_count > 0 else 1

        logger.info("feedback_from_cache", agent_id=agent_id, total=db_count)

        return FeedbackListResponse(
            items=items,
            total=db_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            subgraph_available=True,
            data_source="cache",
        )

    # Cache incomplete or empty - fallback to on-chain view functions
    if agent.token_id is None:
        return FeedbackListResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=1,
            subgraph_available=True,
            data_source="cache",
        )

    network_key = agent.network.id if agent.network else "sepolia"
    reader = get_onchain_reader()
    result = reader.get_feedbacks(
        token_id=agent.token_id,
        network_key=network_key,
        page=page,
        page_size=page_size
    )

    logger.info(
        "feedback_from_onchain",
        agent_id=agent_id,
        token_id=agent.token_id,
        total=result["total"]
    )

    return FeedbackListResponse(
        items=[FeedbackResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
        subgraph_available=True,
        data_source="on-chain",
    )


@router.get(
    "/agents/{agent_id}/validations",
    response_model=ValidationListResponse,
)
async def get_agent_validations(
    agent_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
):
    """
    Get validation history for an agent from database cache.

    Note: Validation contract may not have view functions for direct read,
    so we only use database cache. Returns empty if not synced yet.
    """
    agent = _get_agent(agent_id, db)

    total = db.query(Validation).filter(
        Validation.agent_id == agent_id
    ).count()

    offset = (page - 1) * page_size
    validations = db.query(Validation).filter(
        Validation.agent_id == agent_id
    ).order_by(desc(Validation.request_block)).offset(offset).limit(page_size).all()

    items = [ValidationResponse(
        id=v.id,
        request_hash=v.request_hash,
        validator_address=v.validator_address,
        response=v.response_score,
        status=v.status,
        requested_at=v.requested_at.isoformat() + "Z" if v.requested_at else None,
        completed_at=v.completed_at.isoformat() + "Z" if v.completed_at else None,
        block_number=v.request_block,
        transaction_hash=v.request_tx_hash,
    ) for v in validations]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    logger.info("validation_from_cache", agent_id=agent_id, total=total)

    return ValidationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        subgraph_available=True,
        data_source="cache",
    )


@router.get(
    "/agents/{agent_id}/reputation-summary",
    response_model=ReputationSummaryResponse,
)
async def get_agent_reputation_summary(
    agent_id: str,
    db: Session = Depends(get_db),
):
    """
    Get reputation summary for an agent.

    Hybrid approach:
    1. First try database cache (if complete)
    2. If cache incomplete or empty, use on-chain getSummary view function
    """
    agent = _get_agent(agent_id, db)

    # Get on-chain count to verify cache completeness
    onchain_count = 0
    if agent.token_id is not None:
        network_key = agent.network.id if agent.network else "sepolia"
        reader = get_onchain_reader()
        summary = reader.get_feedback_summary(agent.token_id, network_key)
        onchain_count = summary["count"]

    # Count from cache
    db_count = db.query(Feedback).filter(
        Feedback.agent_id == agent_id,
        Feedback.is_revoked == False
    ).count()

    # Use cache only if it has ALL feedbacks
    if db_count >= onchain_count and db_count > 0:
        # Calculate from cache
        result = db.query(func.avg(Feedback.score)).filter(
            Feedback.agent_id == agent_id,
            Feedback.is_revoked == False
        ).scalar()
        average_score = float(result) if result else 0.0

        validation_count = db.query(Validation).filter(
            Validation.agent_id == agent_id
        ).count()

        logger.info("reputation_from_cache", agent_id=agent_id, count=db_count)

        return ReputationSummaryResponse(
            feedback_count=db_count,
            average_score=average_score,
            validation_count=validation_count,
        )

    # Fallback to on-chain
    if agent.token_id is None:
        return ReputationSummaryResponse(
            feedback_count=0,
            average_score=0,
            validation_count=0,
        )

    # Use on-chain summary (already fetched above)
    validation_count = db.query(Validation).filter(
        Validation.agent_id == agent_id
    ).count()

    logger.info("reputation_from_onchain", agent_id=agent_id, count=summary["count"])

    return ReputationSummaryResponse(
        feedback_count=summary["count"],
        average_score=summary["average_score"],
        validation_count=validation_count,
    )
