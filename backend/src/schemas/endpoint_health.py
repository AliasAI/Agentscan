"""Endpoint Health Check Schemas

Data models for endpoint health check reports.
"""

from pydantic import BaseModel
from typing import Optional


class EndpointHealthResponse(BaseModel):
    """Single endpoint health check result"""

    url: str
    is_healthy: bool
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    error: Optional[str] = None
    checked_at: Optional[str] = None


class AgentEndpointReportResponse(BaseModel):
    """Complete endpoint health report for an agent"""

    agent_id: str
    agent_name: str
    token_id: Optional[int] = None
    network_key: str
    metadata_uri: Optional[str] = None
    has_working_endpoints: bool
    total_endpoints: int
    healthy_endpoints: int
    endpoints: list[EndpointHealthResponse]
    recent_feedbacks: list[dict]
    reputation_score: float
    reputation_count: int


class EndpointSummary(BaseModel):
    """Summary statistics for endpoint health"""

    total_agents: int
    agents_with_endpoints: int
    agents_with_working_endpoints: int
    agents_with_feedbacks: int
    total_endpoints: int
    healthy_endpoints: int
    endpoint_health_rate: float


class EndpointHealthSummaryResponse(BaseModel):
    """Full endpoint health summary report"""

    summary: EndpointSummary
    working_agents: list[AgentEndpointReportResponse]
    generated_at: str


class EndpointHealthFullResponse(BaseModel):
    """Full endpoint health report with all agents"""

    summary: EndpointSummary
    working_agents: list[AgentEndpointReportResponse]
    all_reports: list[AgentEndpointReportResponse]
    generated_at: str
