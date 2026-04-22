"""Ecosystem and capability models for external agent sources."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from src.db.database import Base


class AgentEcosystemLink(Base):
    """Maps an existing agent record to an external ecosystem source."""

    __tablename__ = "agent_ecosystem_links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    ecosystem_name = Column(String, nullable=False, index=True)
    source_url = Column(Text, nullable=True)
    external_id = Column(String, nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    agent = relationship("Agent", back_populates="ecosystem_links")


class AgentCapability(Base):
    """Capabilities discovered from metadata or external ecosystems."""

    __tablename__ = "agent_capabilities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    capability_name = Column(String, nullable=False, index=True)
    value_json = Column(JSON, nullable=True)
    source = Column(String, nullable=True, index=True)
    verified = Column(Boolean, default=False, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    agent = relationship("Agent", back_populates="capabilities")


class AgentActivitySnapshot(Base):
    """External ecosystem activity snapshots for trend and freshness views."""

    __tablename__ = "agent_activity_snapshots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    ecosystem_name = Column(String, nullable=False, index=True)
    usage_7d = Column(Float, nullable=True)
    usage_30d = Column(Float, nullable=True)
    freshness = Column(Float, nullable=True)
    snapshot_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    agent = relationship("Agent", back_populates="activity_snapshots")


class IngestionRun(Base):
    """Tracks adapter ingestion execution status."""

    __tablename__ = "ingestion_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ecosystem_name = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    stats_json = Column(JSON, nullable=True)
    error_log = Column(Text, nullable=True)
