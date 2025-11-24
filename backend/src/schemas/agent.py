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

    # Network info (from relationship)
    network_name: str | None = None

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

    # OASF taxonomy fields
    skills: list[str] | None = None
    domains: list[str] | None = None
    classification_source: str | None = None  # "metadata" or "ai"

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_network(cls, agent) -> "AgentResponse":
        """从 ORM 对象创建响应，包含网络名称"""
        data = {
            "id": agent.id,
            "name": agent.name,
            "address": agent.address,
            "description": agent.description,
            "reputation_score": agent.reputation_score,
            "status": agent.status,
            "network_id": agent.network_id,
            "network_name": agent.network.name if agent.network else None,
            "created_at": agent.created_at,
            "updated_at": agent.updated_at,
            "token_id": agent.token_id,
            "owner_address": agent.owner_address,
            "metadata_uri": agent.metadata_uri,
            "on_chain_data": agent.on_chain_data,
            "last_synced_at": agent.last_synced_at,
            "sync_status": agent.sync_status,
            "reputation_count": agent.reputation_count or 0,
            "reputation_last_updated": agent.reputation_last_updated,
            "skills": agent.skills,
            "domains": agent.domains,
            "classification_source": agent.classification_source,
        }
        return cls(**data)
