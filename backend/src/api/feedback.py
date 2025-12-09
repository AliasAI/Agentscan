"""Feedback and Validation API

Endpoints for querying feedback (reviews) and validation history.
Uses Subgraph as primary source, with on-chain fallback for agents not indexed.
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
import structlog

from src.db.database import get_db
from src.models import Agent
from src.schemas.feedback import (
    FeedbackListResponse,
    FeedbackResponse,
    ValidationListResponse,
    ValidationResponse,
    ReputationSummaryResponse,
)
from src.services.subgraph_service import get_subgraph_service
from src.services.onchain_feedback_service import get_onchain_feedback_service

router = APIRouter()
logger = structlog.get_logger(__name__)


def _get_agent_info(agent_id: str, db: Session) -> tuple[int, str, int]:
    """
    Get agent's token_id, network_key, and reputation_count from database.

    Returns:
        Tuple of (token_id, network_key, reputation_count)

    Raises:
        HTTPException if agent not found or has no token_id
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.token_id is None:
        raise HTTPException(
            status_code=400,
            detail="Agent has no token_id, cannot query subgraph",
        )

    # Map network_id to network key for subgraph query
    network_key = "sepolia"  # Default
    if agent.network:
        # Use network key directly if available
        network_key = agent.network.id  # network.id is the key like 'sepolia'

    reputation_count = agent.reputation_count or 0

    return agent.token_id, network_key, reputation_count


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

    Returns a paginated list of feedbacks/reviews. Uses Subgraph as primary
    data source, with on-chain fallback for agents not indexed by Subgraph.
    """
    token_id, network_key, db_reputation_count = _get_agent_info(agent_id, db)

    subgraph = get_subgraph_service()

    # Check if network has subgraph support
    if not subgraph.is_network_supported(network_key):
        return FeedbackListResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=0,
            subgraph_available=False,
            data_source="none",
        )

    # Try Subgraph first
    result = await subgraph.get_agent_feedbacks(
        token_id=token_id,
        network=network_key,
        page=page,
        page_size=page_size,
    )

    # Fallback to on-chain if Subgraph returns no data but DB has reputation
    if result["total"] == 0 and db_reputation_count > 0:
        logger.info(
            "subgraph_empty_fallback_onchain",
            agent_id=agent_id,
            token_id=token_id,
            network_key=network_key,
            db_reputation_count=db_reputation_count,
        )

        onchain_service = get_onchain_feedback_service()
        result = await onchain_service.get_agent_feedbacks(
            token_id=token_id,
            network_key=network_key,
            page=page,
            page_size=page_size,
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

    return FeedbackListResponse(
        items=[FeedbackResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
        subgraph_available=True,
        data_source="subgraph",
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
    Get validation history for an agent.

    Returns a paginated list of validations from the Agent0 subgraph.
    If the network doesn't have subgraph support, returns empty list with
    subgraph_available=False.
    """
    token_id, network_key, _ = _get_agent_info(agent_id, db)

    subgraph = get_subgraph_service()

    # Check if network has subgraph support
    if not subgraph.is_network_supported(network_key):
        return ValidationListResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=0,
            subgraph_available=False,
        )

    result = await subgraph.get_agent_validations(
        token_id=token_id,
        network=network_key,
        page=page,
        page_size=page_size,
    )

    return ValidationListResponse(
        items=[ValidationResponse(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
        subgraph_available=True,
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
    Get reputation summary for an agent from subgraph.

    Returns aggregated feedback count, average score, and validation count.
    """
    token_id, network_key, _ = _get_agent_info(agent_id, db)

    subgraph = get_subgraph_service()
    result = await subgraph.get_reputation_summary(
        token_id=token_id,
        network=network_key,
    )

    return ReputationSummaryResponse(**result)
