"""Feedback and Validation Schemas

Data models for feedback (reviews) and validation history from the subgraph.
"""

from pydantic import BaseModel
from typing import Optional


class FeedbackResponse(BaseModel):
    """Single feedback/review response"""

    id: str
    score: int  # 0-100
    client_address: str
    tag1: Optional[str] = None
    tag2: Optional[str] = None
    feedback_uri: Optional[str] = None
    feedback_hash: Optional[str] = None
    is_revoked: bool = False
    timestamp: Optional[str] = None
    block_number: Optional[int] = None
    transaction_hash: Optional[str] = None


class FeedbackListResponse(BaseModel):
    """Paginated feedback list response"""

    items: list[FeedbackResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    subgraph_available: bool = True  # False if network doesn't have subgraph support


class ValidationResponse(BaseModel):
    """Single validation response"""

    id: str
    request_hash: Optional[str] = None
    validator_address: str
    response: Optional[int] = None  # 0-100 score
    status: str  # PENDING, COMPLETED, EXPIRED
    requested_at: Optional[str] = None
    completed_at: Optional[str] = None
    block_number: Optional[int] = None
    transaction_hash: Optional[str] = None


class ValidationListResponse(BaseModel):
    """Paginated validation list response"""

    items: list[ValidationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    subgraph_available: bool = True  # False if network doesn't have subgraph support


class ReputationSummaryResponse(BaseModel):
    """Reputation summary from subgraph"""

    feedback_count: int = 0
    average_score: float = 0
    validation_count: int = 0
