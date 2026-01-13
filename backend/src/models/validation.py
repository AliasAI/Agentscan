"""Validation database model

Stores on-chain validation data for fast retrieval.
Synced from ValidationRequest and ValidationResponse events during blockchain sync.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship

from src.db.database import Base


class Validation(Base):
    """On-chain validation record"""

    __tablename__ = "validations"

    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relations
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    network_id = Column(String, ForeignKey("networks.id"), nullable=False)

    # On-chain identifiers
    token_id = Column(Integer, nullable=False)  # Agent's token_id for reference
    request_hash = Column(String(66), nullable=False)  # bytes32 as hex
    validator_address = Column(String(42), nullable=False, index=True)

    # Request data
    request_uri = Column(Text, nullable=True)
    request_block = Column(Integer, nullable=False)
    request_tx_hash = Column(String(66), nullable=False)
    requested_at = Column(DateTime, nullable=True)  # Block timestamp

    # Response data (null if pending)
    response_score = Column(Integer, nullable=True)  # 0-100
    response_uri = Column(Text, nullable=True)
    response_tag = Column(String(100), nullable=True)
    response_block = Column(Integer, nullable=True)
    response_tx_hash = Column(String(66), nullable=True)
    completed_at = Column(DateTime, nullable=True)  # Block timestamp

    # Status
    status = Column(String(20), nullable=False, default="PENDING")  # PENDING, COMPLETED

    # Database metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", backref="validations")
    network = relationship("Network")

    # Composite indexes for efficient queries
    __table_args__ = (
        Index('ix_validation_agent_block', 'agent_id', 'request_block'),
        Index('ix_validation_network_token', 'network_id', 'token_id'),
        # Unique constraint: one validation per request_hash per network
        Index('ix_validation_unique', 'network_id', 'request_hash', unique=True),
    )

    def to_dict(self) -> dict:
        """Convert to API response format"""
        return {
            "id": self.id,
            "request_hash": self.request_hash,
            "request_uri": self.request_uri,
            "validator_address": self.validator_address,
            "response": self.response_score,
            "response_uri": self.response_uri,
            "tag": self.response_tag,
            "status": self.status,
            "requested_at": self.requested_at.isoformat() + "Z" if self.requested_at else None,
            "completed_at": self.completed_at.isoformat() + "Z" if self.completed_at else None,
            "block_number": self.request_block,
            "transaction_hash": self.request_tx_hash,
        }
