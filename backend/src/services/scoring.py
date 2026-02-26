"""Agent scoring service for Leaderboard

Calculates a composite AgentScore (0-100) from four dimensions:
  - Service   (15%): endpoint reachability
  - Usage     (60%): feedback volume + reputation score
  - Freshness (15%): feedback recency (linear decay 30-90 days)
  - Profile   (10%): metadata completeness

Feedback effective weight = W_USAGE × USAGE_FEEDBACK_W = 0.60 × 0.70 = 42%
"""

import math
from datetime import datetime, timedelta
from typing import Optional

# Weights — feedback provenance is the highest-weight single signal
W_SERVICE = 0.15
W_USAGE = 0.60
W_FRESHNESS = 0.15
W_PROFILE = 0.10

# Usage sub-weights (feedback volume dominates over reputation score)
USAGE_FEEDBACK_W = 0.70
USAGE_REPUTATION_W = 0.30

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
    """Usage score: log-normalized feedback count + reputation score.

    reputation_score may exceed 100 (e.g. revenues=590, responseTime=560)
    due to ERC-8004 value/valueDecimals format. We normalize it:
    - Values 0-100: kept as-is (standard 'starred' ratings)
    - Values > 100: log-compressed toward 100 (gives ranking boost)
    - Negative values: treated as 0
    """
    # Feedback: log normalization
    if feedback_count > 0:
        feedback_norm = min(
            math.log(1 + feedback_count) / math.log(1 + FEEDBACK_LOG_CAP) * 100,
            100.0,
        )
    else:
        feedback_norm = 0.0

    # Reputation: piecewise normalization
    # 0-100 linear (starred ratings), >100 log compression
    if reputation_score <= 0:
        rep_norm = 0.0
    elif reputation_score <= 100:
        rep_norm = reputation_score
    else:
        # log compression: 200→~87, 500→~93, 1000→~96
        rep_norm = min(
            100.0,
            100.0 * math.log(1 + reputation_score) / math.log(1 + 1000),
        )

    score = USAGE_FEEDBACK_W * feedback_norm + USAGE_REPUTATION_W * rep_norm
    return round(score, 1)


def calc_freshness_score(
    reputation_last_updated: Optional[datetime],
) -> float:
    """Freshness score: feedback recency, linear decay over 30-90 days."""
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

    Returns dict with score, service_score, usage_score, freshness_score, profile_score.
    """
    service = calc_service_score(endpoint_status)
    usage = calc_usage_score(feedback_count, reputation_score)
    freshness = calc_freshness_score(reputation_last_updated)
    profile = calc_profile_score(name, description, skills, domains)

    total = (
        W_SERVICE * service
        + W_USAGE * usage
        + W_FRESHNESS * freshness
        + W_PROFILE * profile
    )

    return {
        "score": round(total, 1),
        "service_score": service,
        "usage_score": usage,
        "freshness_score": freshness,
        "profile_score": profile,
    }
