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
    """区块链同步状态"""

    current_block: int
    latest_block: int
    sync_progress: float  # 0-100
    is_syncing: bool
    last_synced_at: str | None = None


class StatsResponse(BaseModel):
    """统计数据响应模式"""

    total_agents: int
    active_agents: int
    total_networks: int
    total_activities: int
    updated_at: str
    blockchain_sync: BlockchainSyncStatus | None = None
