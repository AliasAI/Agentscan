"""Agent Pydantic schemas"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any

from src.models.agent import AgentStatus, SyncStatus


class AgentBase(BaseModel):
    """Shared agent fields"""

    name: str
    address: str
    description: str
    reputation_score: float = 0.0
    status: AgentStatus
    network_id: str


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    reputation_score: float | None = None
    status: AgentStatus | None = None


class AgentListItem(AgentBase):
    """Lightweight schema for list endpoints (excludes heavy JSON blobs)."""

    id: str
    created_at: datetime
    updated_at: datetime
    network_name: str | None = None
    token_id: int | None = None
    owner_address: str | None = None
    reputation_count: int = 0
    skills: list[str] | None = None
    domains: list[str] | None = None
    classification_source: str | None = None
    is_active: bool | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_network(cls, agent) -> "AgentListItem":
        return cls(
            id=agent.id,
            name=agent.name,
            address=agent.address,
            description=agent.description,
            reputation_score=agent.reputation_score,
            status=agent.status,
            network_id=agent.network_id,
            network_name=agent.network.name if agent.network else None,
            created_at=agent.created_at,
            updated_at=agent.updated_at,
            token_id=agent.token_id,
            owner_address=agent.owner_address,
            reputation_count=agent.reputation_count or 0,
            skills=agent.skills,
            domains=agent.domains,
            classification_source=agent.classification_source,
            is_active=agent.is_active,
        )


class AgentResponse(AgentBase):
    """Full agent schema (detail endpoint)."""

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

    # Jan 2026 ERC-8004: agentWallet (extracted from on_chain_data for convenience)
    agent_wallet: str | None = None

    # Reputation data fields
    reputation_count: int = 0
    reputation_last_updated: datetime | None = None

    # OASF taxonomy fields
    skills: list[str] | None = None
    domains: list[str] | None = None
    classification_source: str | None = None  # "metadata" or "ai"

    # ERC-8004 active field and metadata refresh
    is_active: bool | None = None
    metadata_refreshed_at: datetime | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_network(cls, agent) -> "AgentResponse":
        """Create response from ORM object, including network name."""
        agent_wallet = None
        if agent.on_chain_data and isinstance(agent.on_chain_data, dict):
            agent_wallet = agent.on_chain_data.get("agentWallet")

        return cls(
            id=agent.id,
            name=agent.name,
            address=agent.address,
            description=agent.description,
            reputation_score=agent.reputation_score,
            status=agent.status,
            network_id=agent.network_id,
            network_name=agent.network.name if agent.network else None,
            created_at=agent.created_at,
            updated_at=agent.updated_at,
            token_id=agent.token_id,
            owner_address=agent.owner_address,
            metadata_uri=agent.metadata_uri,
            on_chain_data=agent.on_chain_data,
            last_synced_at=agent.last_synced_at,
            sync_status=agent.sync_status,
            agent_wallet=agent_wallet,
            reputation_count=agent.reputation_count or 0,
            reputation_last_updated=agent.reputation_last_updated,
            skills=agent.skills,
            domains=agent.domains,
            classification_source=agent.classification_source,
            is_active=agent.is_active,
            metadata_refreshed_at=agent.metadata_refreshed_at,
        )
