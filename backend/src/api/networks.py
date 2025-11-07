"""Networks API"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Network
from src.core.networks_config import NETWORKS


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


router = APIRouter()


@router.get("/networks", response_model=List[NetworkResponse])
async def get_networks(db: Session = Depends(get_db)):
    """Get all networks with contract information"""

    networks = db.query(Network).all()

    # Enrich with contract information from config
    response = []
    for network in networks:
        # Find matching network config
        network_config = None
        for key, config in NETWORKS.items():
            if config["name"] == network.name:
                network_config = config
                break

        # Build response
        network_data = NetworkResponse(
            id=network.id,
            name=network.name,
            chain_id=network.chain_id,
            rpc_url=network.rpc_url,
            explorer_url=network.explorer_url,
            contracts=ContractsInfo(**network_config["contracts"]) if network_config else None
        )
        response.append(network_data)

    return response
