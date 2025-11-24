"""通用数据模式"""

from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应模式"""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class BlockchainSyncStatus(BaseModel):
    """区块链同步状态（单网络）- 保留向后兼容"""

    current_block: int
    latest_block: int
    sync_progress: float  # 0-100
    is_syncing: bool
    last_synced_at: str | None = None


class NetworkSyncStatus(BaseModel):
    """单个网络的同步状态"""

    network_name: str
    network_key: str
    current_block: int
    latest_block: int
    sync_progress: float  # 0-100
    is_syncing: bool
    last_synced_at: str | None = None


class MultiNetworkSyncStatus(BaseModel):
    """多网络聚合同步状态"""

    overall_progress: float  # 所有网络的平均进度
    is_syncing: bool  # 任一网络正在同步则为 True
    networks: list[NetworkSyncStatus]


class StatsResponse(BaseModel):
    """统计数据响应模式"""

    total_agents: int
    active_agents: int
    total_networks: int
    total_activities: int
    updated_at: str
    blockchain_sync: BlockchainSyncStatus | None = None  # 保留向后兼容
    multi_network_sync: MultiNetworkSyncStatus | None = None  # 新增多网络状态
