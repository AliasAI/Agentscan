"""Activity Pydantic 数据模式"""

from datetime import datetime
from pydantic import BaseModel

from src.models.activity import ActivityType
from src.schemas.agent import AgentResponse


class ActivityBase(BaseModel):
    """Activity 基础模式"""

    agent_id: str
    activity_type: ActivityType
    description: str
    tx_hash: str | None = None


class ActivityCreate(ActivityBase):
    """创建 Activity 数据模式"""

    pass


class ActivityResponse(ActivityBase):
    """Activity 响应数据模式"""

    id: str
    created_at: datetime
    agent: AgentResponse | None = None

    model_config = {"from_attributes": True}
