"""Metadata API - Real-time metadata fetching and parsing"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models import Agent
from src.services.metadata_service import metadata_service

router = APIRouter()


class MetadataResponse(BaseModel):
    """Response model for metadata endpoint"""

    raw_uri: str
    resolved_url: str
    uri_type: str  # 'ipfs' | 'data' | 'http' | 'json' | 'empty'
    metadata: dict[str, Any] | None
    success: bool
    error: str | None = None
    fetch_time_ms: int = 0

    model_config = {"from_attributes": True}


@router.get("/agents/{agent_id}/metadata", response_model=MetadataResponse)
async def get_agent_metadata(agent_id: str, db: Session = Depends(get_db)):
    """
    Fetch and parse agent's metadata JSON in real-time.

    This endpoint resolves the agent's metadata_uri and returns
    the parsed JSON content. Supports IPFS, Data URI, HTTP, and
    direct JSON formats.

    Args:
        agent_id: The agent's UUID

    Returns:
        MetadataResponse with parsed metadata or error details
    """
    # Query agent from database
    agent = db.query(Agent).filter(Agent.id == agent_id).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if agent has metadata_uri
    if not agent.metadata_uri:
        return MetadataResponse(
            raw_uri="",
            resolved_url="",
            uri_type="empty",
            metadata=None,
            success=False,
            error="No metadata URI available for this agent",
            fetch_time_ms=0,
        )

    # Fetch and parse metadata
    result = await metadata_service.fetch_and_parse(agent.metadata_uri)

    return MetadataResponse(**result)
