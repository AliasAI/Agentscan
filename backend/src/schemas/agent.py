"""Agent Pydantic 数据模式"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any

from src.models.agent import AgentStatus, SyncStatus


class AgentBase(BaseModel):
    """Agent 基础模式"""

    name: str
    address: str
    description: str
    reputation_score: float = Field(ge=0.0, le=100.0)
    status: AgentStatus
    network_id: str


class AgentCreate(AgentBase):
    """创建 Agent 数据模式"""

    pass


class AgentUpdate(BaseModel):
    """更新 Agent 数据模式"""

    name: str | None = None
    description: str | None = None
    reputation_score: float | None = Field(None, ge=0.0, le=100.0)
    status: AgentStatus | None = None


class AgentResponse(AgentBase):
    """Agent 响应数据模式"""

    id: str
    created_at: datetime
    updated_at: datetime

    # Blockchain data fields
    token_id: int | None = None
    owner_address: str | None = None
    metadata_uri: str | None = None
    on_chain_data: dict[str, Any] | None = None
    last_synced_at: datetime | None = None
    sync_status: SyncStatus | None = None

    # Reputation data fields
    reputation_count: int = 0
    reputation_last_updated: datetime | None = None

    model_config = {"from_attributes": True}
