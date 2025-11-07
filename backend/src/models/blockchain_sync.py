"""Blockchain sync tracking model"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Enum, DateTime

from src.db.database import Base


class SyncStatusEnum(str, enum.Enum):
    """Sync status enumeration"""

    RUNNING = "running"
    IDLE = "idle"
    ERROR = "error"


class BlockchainSync(Base):
    """Blockchain synchronization tracker"""

    __tablename__ = "blockchain_syncs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    network_name = Column(String, nullable=False, unique=True, index=True)
    contract_address = Column(String, nullable=False)
    last_block = Column(Integer, nullable=False, default=0)
    current_block = Column(Integer, nullable=True)
    status = Column(Enum(SyncStatusEnum), nullable=False, default=SyncStatusEnum.IDLE)
    error_message = Column(String, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
