"""Feedback and Validation Schemas

Data models for feedback (reviews) and validation history from the subgraph.

Updated: Jan 27, 2026 - ERC-8004 mainnet freeze: score → value/value_decimals
"""

from pydantic import BaseModel
from typing import Optional


class FeedbackResponse(BaseModel):
    """Single feedback/review response

    Jan 27, 2026: ERC-8004 mainnet freeze
    - score (uint8) → value (int128) + value_decimals (uint8)
    - Supports decimals, negative numbers, and values > 100
    """

    id: str
    # Jan 2026 mainnet freeze: value/value_decimals replaces score
    # Note: Subgraph returns BigDecimal (float), on-chain returns int128
    value: float  # int128 on-chain, BigDecimal from subgraph
    value_decimals: int = 0  # 0-18 decimal places
    display_value: Optional[str] = None  # Pre-formatted value (e.g., "99.77%")
    client_address: str
    feedback_index: Optional[int] = None  # Per-client feedback index
    tag1: Optional[str] = None  # Standard tags: starred, uptime, successRate, etc.
    tag2: Optional[str] = None
    endpoint: Optional[str] = None  # Endpoint URI for this feedback
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
    data_source: str = "subgraph"  # "subgraph" or "on-chain"


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
    data_source: str = "subgraph"  # "subgraph" or "on-chain"


class ReputationSummaryResponse(BaseModel):
    """Reputation summary from subgraph"""

    feedback_count: int = 0
    average_score: float = 0
    validation_count: int = 0
