"""Feedback database model

Stores on-chain feedback/review data for fast retrieval.
Synced from NewFeedback events during blockchain sync.

Updated: Jan 27, 2026 - ERC-8004 mainnet freeze
  - score (uint8) → value (int128) + value_decimals (uint8)
  - Supports decimals, negative numbers, and values > 100
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean, DateTime,
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

    # Feedback content (Jan 2026 update: score → value/value_decimals)
    # value: int128 on-chain, supports negative numbers and large values
    # value_decimals: number of decimal places (0-18)
    # Example: 99.77% uptime → value=9977, value_decimals=2
    value = Column(BigInteger, nullable=False)  # int128 as BigInteger
    value_decimals = Column(Integer, nullable=False, default=0)  # 0-18
    tag1 = Column(String(100), nullable=True)  # Standard tags: starred, uptime, etc.
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

    @property
    def display_value(self) -> str:
        """Format value for display based on tag1 type"""
        if self.value is None:
            return "N/A"

        # Calculate actual value with decimals
        actual = self.value / (10 ** self.value_decimals) if self.value_decimals else self.value

        # Format based on tag1 type
        tag = (self.tag1 or "").lower()

        if tag in ("uptime", "successrate"):
            return f"{actual:.{self.value_decimals}f}%"
        elif tag == "responsetime":
            return f"{int(actual)}ms"
        elif tag in ("reachable", "ownerverified"):
            return "Yes" if actual == 1 else "No"
        elif tag == "revenues":
            return f"${actual:,.0f}"
        elif tag == "tradingyield":
            sign = "+" if actual > 0 else ""
            return f"{sign}{actual:.{self.value_decimals}f}%"
        elif tag == "blocktimefreshness":
            return f"{int(actual)} blocks"
        elif tag == "starred":
            return f"{int(actual)}/100"
        else:
            # Default: show raw value with decimals
            if self.value_decimals > 0:
                return f"{actual:.{self.value_decimals}f}"
            return str(int(actual))

    def to_dict(self) -> dict:
        """Convert to API response format"""
        return {
            "id": self.id,
            "value": self.value,
            "value_decimals": self.value_decimals,
            "display_value": self.display_value,
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
