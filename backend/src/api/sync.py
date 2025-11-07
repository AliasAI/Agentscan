"""Blockchain sync status API"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models import BlockchainSync

router = APIRouter()


@router.get("/sync/status")
async def get_sync_status(db: Session = Depends(get_db)):
    """Get blockchain synchronization status"""

    sync = db.query(BlockchainSync).filter(
        BlockchainSync.network_name == "sepolia"
    ).first()

    if not sync:
        return {
            "network": "sepolia",
            "last_block": 0,
            "current_block": 0,
            "status": "not_started",
            "last_synced_at": None,
            "error_message": None
        }

    return {
        "network": sync.network_name,
        "contract_address": sync.contract_address,
        "last_block": sync.last_block,
        "current_block": sync.current_block or 0,
        "sync_lag": (sync.current_block or 0) - sync.last_block if sync.current_block else 0,
        "status": sync.status.value,
        "last_synced_at": sync.last_synced_at.isoformat() if sync.last_synced_at else None,
        "error_message": sync.error_message
    }
