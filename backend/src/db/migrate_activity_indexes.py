"""Migration: Add indexes to activities table.

The activities table (160K+ rows) had zero indexes beyond the primary key,
causing full table scans on every JOIN, GROUP BY, and filtered aggregation.
"""

import sqlite3

import structlog
from src.core.config import settings

logger = structlog.get_logger()


def migrate():
    """Create indexes on activities for common query patterns (idempotent)."""
    conn = sqlite3.connect(settings.database_url.replace("sqlite:///", ""))
    cursor = conn.cursor()

    try:
        indexes = [
            # Speeds up JOIN Activity → Agent (used by analytics, recent activities)
            ("ix_activities_agent_id", "agent_id"),
            # Speeds up trend date grouping and ORDER BY created_at DESC
            ("ix_activities_created_at", "created_at"),
            # Speeds up filtered aggregations (e.g. COUNT WHERE activity_type = X)
            ("ix_activities_type_created", "activity_type, created_at"),
        ]
        for name, cols in indexes:
            cursor.execute(
                f"CREATE INDEX IF NOT EXISTS {name} ON activities({cols})"
            )
        conn.commit()
        logger.info("migrate_activity_indexes_done")

    except Exception as e:
        logger.error("migrate_activity_indexes_failed", error=str(e))
        raise
    finally:
        conn.close()
