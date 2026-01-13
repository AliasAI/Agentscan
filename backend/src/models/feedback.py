"""Feedback database model

Stores on-chain feedback/review data for fast retrieval.
Synced from NewFeedback events during blockchain sync.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship

from src.db.database import Base


class Feedback(Base):
    """On-chain feedback/review record"""

    __tablename__ = "feedbacks"

    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relations
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False, index=True)
    network_id = Column(String, ForeignKey("networks.id"), nullable=False)

    # On-chain identifiers
    token_id = Column(Integer, nullable=False)  # Agent's token_id for reference
    feedback_index = Column(Integer, nullable=False)  # Per-client feedback index
    client_address = Column(String(42), nullable=False, index=True)

    # Feedback content
    score = Column(Integer, nullable=False)  # 0-100
    tag1 = Column(String(100), nullable=True)
    tag2 = Column(String(100), nullable=True)
    endpoint = Column(String(500), nullable=True)
    feedback_uri = Column(Text, nullable=True)  # IPFS URI
    feedback_hash = Column(String(66), nullable=True)  # bytes32 as hex

    # Status
    is_revoked = Column(Boolean, nullable=False, default=False)

    # Blockchain metadata
    block_number = Column(Integer, nullable=False, index=True)
    transaction_hash = Column(String(66), nullable=False)
    timestamp = Column(DateTime, nullable=True)  # Block timestamp

    # Database metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    agent = relationship("Agent", backref="feedbacks")
    network = relationship("Network")

    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_feedback_agent_block', 'agent_id', 'block_number'),
        Index('ix_feedback_network_token', 'network_id', 'token_id'),
        # Unique constraint: one feedback per client per index per agent
        Index('ix_feedback_unique', 'network_id', 'token_id', 'client_address', 'feedback_index', unique=True),
    )

    def to_dict(self) -> dict:
        """Convert to API response format"""
        return {
            "id": self.id,
            "score": self.score,
            "client_address": self.client_address,
            "feedback_index": self.feedback_index,
            "tag1": self.tag1,
            "tag2": self.tag2,
            "endpoint": self.endpoint,
            "feedback_uri": self.feedback_uri,
            "feedback_hash": self.feedback_hash,
            "is_revoked": self.is_revoked,
            "timestamp": self.timestamp.isoformat() + "Z" if self.timestamp else None,
            "block_number": self.block_number,
            "transaction_hash": self.transaction_hash,
        }
