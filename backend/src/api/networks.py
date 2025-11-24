"""Networks API"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from datetime import datetime

from src.db.database import get_db
from src.models import Network, Agent


class ContractsInfo(BaseModel):
    """Contract addresses info"""
    identity: str
    reputation: str
    validation: str


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
    # Query networks with agent count
    results = (
        db.query(
            Network.id,
            Network.name,
            Network.chain_id,
            Network.explorer_url,
            func.count(Agent.id).label('agent_count')
        )
        .outerjoin(Agent, Network.id == Agent.network_id)
        .group_by(Network.id)
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
