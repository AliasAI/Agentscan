"""统计数据 API"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from web3 import Web3
from typing import List
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent, Network, Activity, AgentStatus, BlockchainSync, SyncStatusEnum
from src.schemas.common import StatsResponse, BlockchainSyncStatus
from src.core.blockchain_config import SEPOLIA_RPC_URL, START_BLOCK


class RegistrationTrendData(BaseModel):
    """Registration trend data point"""
    date: str
    count: int


class RegistrationTrendResponse(BaseModel):
    """Registration trend response"""
    data: List[RegistrationTrendData]

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """获取整体统计数据"""

    total_agents = db.query(Agent).count()
    active_agents = (
        db.query(Agent).filter(Agent.status == AgentStatus.ACTIVE).count()
    )
    total_networks = db.query(Network).count()
    total_activities = db.query(Activity).count()

    # 获取区块链同步状态
    blockchain_sync = None
    sync_tracker = db.query(BlockchainSync).filter(
        BlockchainSync.network_name == "sepolia"
    ).first()

    if sync_tracker:
        try:
            # 获取最新块高
            w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
            latest_block = w3.eth.block_number

            # 计算同步进度
            current_block = sync_tracker.last_block
            total_blocks = latest_block - START_BLOCK
            synced_blocks = current_block - START_BLOCK

            sync_progress = min(100.0, (synced_blocks / total_blocks * 100) if total_blocks > 0 else 100.0)

            blockchain_sync = BlockchainSyncStatus(
                current_block=current_block,
                latest_block=latest_block,
                sync_progress=round(sync_progress, 2),
                is_syncing=sync_tracker.status == SyncStatusEnum.RUNNING,
                last_synced_at=sync_tracker.last_synced_at.isoformat() if sync_tracker.last_synced_at else None
            )
        except Exception as e:
            # 如果获取失败，返回 None
            pass

    return StatsResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        total_networks=total_networks,
        total_activities=total_activities,
        updated_at=datetime.utcnow().isoformat(),
        blockchain_sync=blockchain_sync
    )


@router.get("/stats/registration-trend", response_model=RegistrationTrendResponse)
async def get_registration_trend(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to query"),
    db: Session = Depends(get_db)
):
    """Get agent registration trend data (grouped by day)"""

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Query registration count grouped by date (using REGISTERED activity events)
    # SQLite uses date() function
    from src.models.activity import ActivityType

    results = db.query(
        func.date(Activity.created_at).label('date'),
        func.count(Activity.id).label('count')
    ).filter(
        Activity.activity_type == ActivityType.REGISTERED,
        Activity.created_at >= start_date
    ).group_by(
        func.date(Activity.created_at)
    ).order_by(
        func.date(Activity.created_at)
    ).all()

    # Build complete date range data (including dates with no registrations)
    date_counts = {row.date: row.count for row in results}

    trend_data = []
    current_date = start_date.date()
    end_date_only = end_date.date()

    while current_date <= end_date_only:
        date_str = current_date.strftime('%Y-%m-%d')
        count = date_counts.get(date_str, 0)
        trend_data.append(RegistrationTrendData(date=date_str, count=count))
        current_date += timedelta(days=1)

    return RegistrationTrendResponse(data=trend_data)
