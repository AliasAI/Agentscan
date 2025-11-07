"""Network 数据库模型"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.orm import relationship

from src.db.database import Base


class Network(Base):
    """区块链网络模型"""

    __tablename__ = "networks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    chain_id = Column(Integer, nullable=False, unique=True)
    rpc_url = Column(String, nullable=False)
    explorer_url = Column(String, nullable=False)
    contracts = Column(JSON, nullable=True)  # 合约地址 {identity, reputation, validation}
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关系
    agents = relationship("Agent", back_populates="network")
