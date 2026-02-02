"""Activity 数据库模型"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship

from src.db.database import Base


class ActivityType(str, enum.Enum):
    """活动类型枚举"""

    REGISTERED = "registered"
    REPUTATION_UPDATE = "reputation_update"
    VALIDATION_COMPLETE = "validation_complete"


class Activity(Base):
    """活动记录模型"""

    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    activity_type = Column(Enum(ActivityType), nullable=False)
    description = Column(String, nullable=False)
    tx_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Gas and fee fields (for transaction cost tracking)
    gas_used = Column(BigInteger, nullable=True)  # Actual gas consumed
    gas_price = Column(BigInteger, nullable=True)  # Gas price in wei
    transaction_fee = Column(BigInteger, nullable=True)  # Total fee in wei (gas_used * gas_price)

    # 关系
    agent = relationship("Agent", back_populates="activities")
