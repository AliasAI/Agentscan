"""统计数据 API"""

import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from web3 import Web3
from typing import List, Dict, Any
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent, Network, Activity, AgentStatus, BlockchainSync, SyncStatusEnum
from src.schemas.common import (
    StatsResponse, BlockchainSyncStatus,
    NetworkSyncStatus, MultiNetworkSyncStatus
)
from src.core.networks_config import NETWORKS, get_enabled_networks


class RegistrationTrendData(BaseModel):
    """Registration trend data point"""
    date: str
    count: int


class RegistrationTrendResponse(BaseModel):
    """Registration trend response"""
    data: List[RegistrationTrendData]


# 缓存 latest_block，避免每次请求都调用 RPC
_block_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 60  # 缓存 60 秒

router = APIRouter()


def _get_cached_latest_block(network_key: str, rpc_url: str) -> int | None:
    """获取缓存的 latest_block，如果缓存过期则返回 None"""
    cache_entry = _block_cache.get(network_key)
    if cache_entry:
        cached_at = cache_entry.get("cached_at")
        if cached_at and (datetime.utcnow() - cached_at).total_seconds() < CACHE_TTL_SECONDS:
            return cache_entry.get("latest_block")
    return None


def _update_block_cache(network_key: str, latest_block: int) -> None:
    """更新 latest_block 缓存"""
    _block_cache[network_key] = {
        "latest_block": latest_block,
        "cached_at": datetime.utcnow()
    }


async def _fetch_latest_block(network_key: str, rpc_url: str) -> tuple[str, int | None]:
    """异步获取网络的 latest_block（带缓存）"""
    # 先检查缓存
    cached = _get_cached_latest_block(network_key, rpc_url)
    if cached is not None:
        return (network_key, cached)

    # 缓存未命中，发起 RPC 请求
    try:
        loop = asyncio.get_event_loop()
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        latest_block = await loop.run_in_executor(None, lambda: w3.eth.block_number)
        _update_block_cache(network_key, latest_block)
        return (network_key, latest_block)
    except Exception:
        return (network_key, None)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """获取整体统计数据"""

    total_agents = db.query(Agent).count()
    active_agents = (
        db.query(Agent).filter(Agent.status == AgentStatus.ACTIVE).count()
    )
    total_networks = db.query(Network).count()
    total_activities = db.query(Activity).count()

    # 获取多网络同步状态
    multi_network_sync = None
    blockchain_sync = None  # 保留向后兼容（Sepolia）

    try:
        enabled_networks = get_enabled_networks()

        # 收集需要查询的网络信息
        networks_to_query: list[tuple[str, dict, BlockchainSync]] = []
        for network_key, config in enabled_networks.items():
            sync_tracker = db.query(BlockchainSync).filter(
                BlockchainSync.network_name == network_key
            ).first()

            if not sync_tracker:
                continue

            rpc_url = config.get("rpc_url", "")
            if not rpc_url:
                continue

            networks_to_query.append((network_key, config, sync_tracker))

        # 并行获取所有网络的 latest_block（带缓存）
        if networks_to_query:
            tasks = [
                _fetch_latest_block(network_key, config.get("rpc_url", ""))
                for network_key, config, _ in networks_to_query
            ]
            results = await asyncio.gather(*tasks)
            latest_blocks = {k: v for k, v in results if v is not None}

            # 构建网络状态列表
            network_statuses: list[NetworkSyncStatus] = []
            for network_key, config, sync_tracker in networks_to_query:
                latest_block = latest_blocks.get(network_key)
                if latest_block is None:
                    continue

                start_block = config.get("start_block", 0)
                current_block = sync_tracker.last_block

                total_blocks = latest_block - start_block
                synced_blocks = current_block - start_block
                sync_progress = min(100.0, (synced_blocks / total_blocks * 100) if total_blocks > 0 else 100.0)

                status = NetworkSyncStatus(
                    network_name=config["name"],
                    network_key=network_key,
                    current_block=current_block,
                    latest_block=latest_block,
                    sync_progress=round(sync_progress, 2),
                    is_syncing=sync_tracker.status == SyncStatusEnum.RUNNING,
                    last_synced_at=sync_tracker.last_synced_at.isoformat() if sync_tracker.last_synced_at else None
                )
                network_statuses.append(status)

                # 保留 Sepolia 的向后兼容
                if network_key == "sepolia":
                    blockchain_sync = BlockchainSyncStatus(
                        current_block=current_block,
                        latest_block=latest_block,
                        sync_progress=round(sync_progress, 2),
                        is_syncing=sync_tracker.status == SyncStatusEnum.RUNNING,
                        last_synced_at=sync_tracker.last_synced_at.isoformat() if sync_tracker.last_synced_at else None
                    )

            if network_statuses:
                total_progress = sum(s.sync_progress for s in network_statuses)
                overall_progress = total_progress / len(network_statuses)
                is_any_syncing = any(s.is_syncing for s in network_statuses)

                multi_network_sync = MultiNetworkSyncStatus(
                    overall_progress=round(overall_progress, 2),
                    is_syncing=is_any_syncing,
                    networks=network_statuses
                )
    except Exception:
        pass

    return StatsResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        total_networks=total_networks,
        total_activities=total_activities,
        updated_at=datetime.utcnow().isoformat(),
        blockchain_sync=blockchain_sync,
        multi_network_sync=multi_network_sync
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
