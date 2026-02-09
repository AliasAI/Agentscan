"""Agent scoring service for Leaderboard

Calculates a composite AgentScore (0-100) from four dimensions:
  - Service  (20%): endpoint reachability
  - Usage    (50%): feedback volume + reputation score
  - Quality  (20%): feedback freshness (recency)
  - Profile  (10%): metadata completeness
"""

import math
from datetime import datetime, timedelta
from typing import Optional

# Weights (adjusted from real data: service was too binary at 30%)
W_SERVICE = 0.20
W_USAGE = 0.50
W_QUALITY = 0.20
W_PROFILE = 0.10

# Usage sub-weights
USAGE_FEEDBACK_W = 0.60
USAGE_REPUTATION_W = 0.40

# For log normalization: agents with this many feedbacks get ~100
# Raised from 50 to 500 — with cap=50, agents at 50 fb scored same as 1500 fb
FEEDBACK_LOG_CAP = 500


def calc_service_score(endpoint_status: Optional[dict]) -> float:
    """Service score: healthy endpoints ratio (0-100)."""
    if not endpoint_status:
        return 0.0

    total = endpoint_status.get("total_endpoints", 0)
    healthy = endpoint_status.get("healthy_endpoints", 0)

    if total == 0:
        return 0.0

    return round(healthy / total * 100, 1)


def calc_usage_score(
    feedback_count: int,
    reputation_score: float,
) -> float:
    """Usage score: log-normalized feedback count + reputation score."""
    # Log normalization: log(1 + count) / log(1 + cap) * 100, capped at 100
    if feedback_count > 0:
        feedback_norm = min(
            math.log(1 + feedback_count) / math.log(1 + FEEDBACK_LOG_CAP) * 100,
            100.0,
        )
    else:
        feedback_norm = 0.0

    # Reputation score is already 0-100 range
    rep_norm = min(max(reputation_score, 0), 100)

    score = USAGE_FEEDBACK_W * feedback_norm + USAGE_REPUTATION_W * rep_norm
    return round(score, 1)


def calc_quality_score(
    reputation_last_updated: Optional[datetime],
) -> float:
    """Quality score: feedback freshness, linear decay over 30-90 days."""
    if not reputation_last_updated:
        return 0.0

    now = datetime.utcnow()
    days_ago = (now - reputation_last_updated).total_seconds() / 86400

    if days_ago <= 30:
        return 100.0
    if days_ago >= 90:
        return 0.0

    # Linear decay between 30 and 90 days
    return round((90 - days_ago) / 60 * 100, 1)


def calc_profile_score(
    name: str,
    description: str,
    skills: Optional[list],
    domains: Optional[list],
) -> float:
    """Profile score: metadata completeness (4 × 25 points)."""
    score = 0.0

    if name and name not in ("Unknown Agent", "Unknown", "Untitled"):
        score += 25.0
    if description and len(description) >= 20:
        score += 25.0
    if skills and len(skills) > 0:
        score += 25.0
    if domains and len(domains) > 0:
        score += 25.0

    return score


def calc_agent_score(
    endpoint_status: Optional[dict],
    feedback_count: int,
    reputation_score: float,
    reputation_last_updated: Optional[datetime],
    name: str,
    description: str,
    skills: Optional[list],
    domains: Optional[list],
) -> dict:
    """Calculate composite AgentScore and all sub-scores.

    Returns dict with score, service_score, usage_score, quality_score, profile_score.
    """
    service = calc_service_score(endpoint_status)
    usage = calc_usage_score(feedback_count, reputation_score)
    quality = calc_quality_score(reputation_last_updated)
    profile = calc_profile_score(name, description, skills, domains)

    total = (
        W_SERVICE * service
        + W_USAGE * usage
        + W_QUALITY * quality
        + W_PROFILE * profile
    )

    return {
        "score": round(total, 1),
        "service_score": service,
        "usage_score": usage,
        "quality_score": quality,
        "profile_score": profile,
    }
