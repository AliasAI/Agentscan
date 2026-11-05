"""Networks API"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from src.db.database import get_db
from src.models import Network, Agent
from src.services.public_snapshot import PublicSnapshot


class ContractsInfo(BaseModel):
    """Contract addresses info"""
    identity: str
    reputation: Optional[str] = None
    validation: Optional[str] = None


class NetworkResponse(BaseModel):
    """Network response model"""
    id: str
    name: str
    chain_id: int
    rpc_url: str
    explorer_url: str
    contracts: ContractsInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NetworkWithStatsResponse(BaseModel):
    """Network response with agent count"""
    id: str
    name: str
    chain_id: int
    explorer_url: str
    agent_count: int

    model_config = {"from_attributes": True}


router = APIRouter()


@router.get("/networks", response_model=List[NetworkResponse])
async def get_networks(db: Session = Depends(get_db)):
    """Get all networks"""
    networks = db.query(Network).all()
    return networks


@router.get("/networks/stats", response_model=List[NetworkWithStatsResponse])
async def get_networks_with_stats(db: Session = Depends(get_db)):
    """Get all networks with agent count statistics"""
    return await network_stats_snapshot.get(db)


def _build_network_stats(db: Session) -> list[NetworkWithStatsResponse]:
    counts = (
        db.query(Agent.network_id, func.count().label("agent_count"))
        .group_by(Agent.network_id)
        .subquery()
    )
    results = (
        db.query(
            Network.id,
            Network.name,
            Network.chain_id,
            Network.explorer_url,
            func.coalesce(counts.c.agent_count, 0).label("agent_count"),
        )
        .outerjoin(counts, Network.id == counts.c.network_id)
        .order_by(Network.id)
        .all()
    )

    return [
        NetworkWithStatsResponse(
            id=r.id,
            name=r.name,
            chain_id=r.chain_id,
            explorer_url=r.explorer_url,
            agent_count=r.agent_count
        )
        for r in results
    ]


network_stats_snapshot = PublicSnapshot("network_stats", 300, _build_network_stats)
