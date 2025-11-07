"""Networks API"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from src.db.database import get_db
from src.models import Network


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


router = APIRouter()


@router.get("/networks", response_model=List[NetworkResponse])
async def get_networks(db: Session = Depends(get_db)):
    """Get all networks"""
    networks = db.query(Network).all()
    return networks
