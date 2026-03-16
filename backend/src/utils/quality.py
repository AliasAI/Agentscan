"""Consolidated quality-check constants and helpers.

Used by agents API (list filtering) and sync pipeline (is_quality column).
"""

MIN_DESCRIPTION_LENGTH = 20

INVALID_NAMES = ["Unknown Agent", "Unknown", "Untitled", "Test", "test"]

# Merged from agents.py + metadata_processor.py — single source of truth
INVALID_DESCRIPTION_PATTERNS = [
    "fetch failed",
    "metadata fetch",
    "no metadata",
    "error",
    "failed to",
    "not found",
    "undefined",
    "null",
    "no description",
    "unknown agent",
    "agent from direct json",
    "no metadata uri provided",
    "error fetching",
    "not available",
    "n/a",
    "test agent",
    "lorem ipsum",
    "todo",
    "placeholder",
    "example",
    "demo agent",
]


def is_valid_description(description: str | None) -> bool:
    """Check if description is meaningful (not a placeholder or error)."""
    if not description or not isinstance(description, str):
        return False

    description = description.strip()
    if len(description) < MIN_DESCRIPTION_LENGTH:
        return False

    description_lower = description.lower()
    for pattern in INVALID_DESCRIPTION_PATTERNS:
        if pattern in description_lower:
            return False

    digit_count = sum(c.isdigit() for c in description)
    if digit_count / len(description) > 0.5:
        return False

    return True


def compute_is_quality(name: str | None, description: str | None) -> bool:
    """Determine if an agent meets the 'basic quality' bar.

    True when the agent has a real name and a meaningful description.
    """
    if not name or name in INVALID_NAMES:
        return False
    return is_valid_description(description)
