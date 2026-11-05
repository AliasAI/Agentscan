"""统计数据 API"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette.concurrency import run_in_threadpool
from typing import List
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent, Network, Activity, AgentStatus, BlockchainSync, SyncStatusEnum
from src.schemas.common import (
    StatsResponse, BlockchainSyncStatus,
    NetworkSyncStatus, MultiNetworkSyncStatus
)
from src.core.networks_config import get_enabled_networks
from src.services.public_snapshot import PublicSnapshot


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
    return await stats_snapshot.get(db)


def _build_stats_response(db: Session, now: datetime) -> StatsResponse:
    """Build stats from local database state only.

    This endpoint is hit by the homepage and must not wait on chain RPC calls.
    The scheduler updates blockchain_syncs.current_block during sync runs.
    """
    total_agents = _count_rows(db, Agent)

    # Active: has reputation activity in the last 7 days OR created recently (matching agents API logic)
    seven_days_ago = now - timedelta(days=7)
    active_agents = int(
        db.query(func.count(Agent.id)).filter(
            Agent.status == AgentStatus.ACTIVE,
            (
                (Agent.reputation_last_updated >= seven_days_ago) |
                (
                    (Agent.reputation_last_updated.is_(None)) &
                    (Agent.created_at >= seven_days_ago)
                )
            )
        ).scalar() or 0
    )
    # Include external (non-EVM) implementations like Solana/SATI
    external_network_count = 1
    total_networks = _count_rows(db, Network) + external_network_count
    total_activities = _count_rows(db, Activity)

    try:
        blockchain_sync, multi_network_sync = _build_sync_status(db)
    except Exception:
        blockchain_sync, multi_network_sync = None, None

    return StatsResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        total_networks=total_networks,
        total_activities=total_activities,
        updated_at=now.isoformat(),
        blockchain_sync=blockchain_sync,
        multi_network_sync=multi_network_sync
    )


def _count_rows(db: Session, model) -> int:
    """Use a direct COUNT(id) aggregate instead of Query.count() subqueries."""
    return int(db.query(func.count(model.id)).scalar() or 0)


def _build_sync_status(
    db: Session,
) -> tuple[BlockchainSyncStatus | None, MultiNetworkSyncStatus | None]:
    """Build sync status from persisted scheduler progress."""
    enabled_networks = get_enabled_networks()
    sync_map = {
        s.network_name: s
        for s in db.query(BlockchainSync).all()
    }

    network_statuses: list[NetworkSyncStatus] = []
    blockchain_sync = None

    for network_key, config in enabled_networks.items():
        sync_tracker = sync_map.get(network_key)
        if not sync_tracker:
            continue

        start_block = config.get("start_block", 0)
        current_block = sync_tracker.last_block or start_block
        latest_block = sync_tracker.current_block or current_block
        latest_block = max(latest_block, current_block)

        total_blocks = max(latest_block - start_block, 0)
        synced_blocks = max(current_block - start_block, 0)
        sync_progress = (
            100.0
            if total_blocks == 0
            else min(100.0, synced_blocks / total_blocks * 100)
        )

        status = NetworkSyncStatus(
            network_name=config["name"],
            network_key=network_key,
            current_block=current_block,
            latest_block=latest_block,
            sync_progress=round(sync_progress, 2),
            is_syncing=sync_tracker.status == SyncStatusEnum.RUNNING,
            last_synced_at=sync_tracker.last_synced_at.isoformat()
            if sync_tracker.last_synced_at else None
        )
        network_statuses.append(status)

        # 保留 Sepolia 的向后兼容
        if network_key == "sepolia":
            blockchain_sync = BlockchainSyncStatus(
                current_block=current_block,
                latest_block=latest_block,
                sync_progress=round(sync_progress, 2),
                is_syncing=sync_tracker.status == SyncStatusEnum.RUNNING,
                last_synced_at=sync_tracker.last_synced_at.isoformat()
                if sync_tracker.last_synced_at else None
            )

    if not network_statuses:
        return blockchain_sync, None

    total_progress = sum(s.sync_progress for s in network_statuses)
    overall_progress = total_progress / len(network_statuses)
    is_any_syncing = any(s.is_syncing for s in network_statuses)

    return blockchain_sync, MultiNetworkSyncStatus(
        overall_progress=round(overall_progress, 2),
        is_syncing=is_any_syncing,
        networks=network_statuses
    )


def _build_registration_trend(db: Session, days: int) -> RegistrationTrendResponse:
    """Get agent registration trend data (grouped by day)"""

    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Query registration count grouped by date (using REGISTERED activity events)
    # SQLite uses date() function
    from src.models.activity import ActivityType

    results = db.query(
        func.date(Activity.created_at).label('date'),
        func.count().label('count')
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


stats_snapshot = PublicSnapshot("stats", 120, lambda db: _build_stats_response(db, datetime.utcnow()))
registration_trend_snapshot = PublicSnapshot(
    "registration_trend", 900, lambda db: _build_registration_trend(db, 30)
)


@router.get("/stats/registration-trend", response_model=RegistrationTrendResponse)
async def get_registration_trend(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to query"),
    db: Session = Depends(get_db),
):
    if days == 30:
        return await registration_trend_snapshot.get(db)
    return await run_in_threadpool(_build_registration_trend, db, days)
