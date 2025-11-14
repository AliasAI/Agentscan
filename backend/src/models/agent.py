"""Agent database model"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Enum, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import relationship
import enum

from src.db.database import Base


class AgentStatus(str, enum.Enum):
    """Agent status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    VALIDATING = "validating"


class SyncStatus(str, enum.Enum):
    """Blockchain sync status"""

    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"


class Agent(Base):
    """AI Agent model"""

    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False, index=True)  # Owner address, can have multiple agents
    description = Column(String, nullable=False)
    reputation_score = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(AgentStatus), nullable=False, default=AgentStatus.ACTIVE)
    network_id = Column(String, ForeignKey("networks.id"), nullable=False)

    # Blockchain data fields
    token_id = Column(Integer, nullable=True, unique=True, index=True)
    owner_address = Column(String, nullable=True, index=True)
    metadata_uri = Column(Text, nullable=True)
    on_chain_data = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    sync_status = Column(Enum(SyncStatus), default=SyncStatus.SYNCING)

    # Reputation data fields
    reputation_count = Column(Integer, nullable=False, default=0)  # Number of feedbacks
    reputation_last_updated = Column(DateTime, nullable=True)  # Last reputation sync time

    # OASF taxonomy fields (auto-classified from description if not in metadata)
    skills = Column(JSON, nullable=True)  # List of skill slugs: ["skill_category/skill_name"]
    domains = Column(JSON, nullable=True)  # List of domain slugs: ["domain_category/domain_name"]

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    network = relationship("Network", back_populates="agents")
    activities = relationship("Activity", back_populates="agent")
