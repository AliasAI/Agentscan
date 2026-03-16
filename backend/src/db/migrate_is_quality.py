"""Migration: Add is_quality column with backfill and composite indexes.

Pre-computes quality status so the agents list API can filter with a simple
index scan instead of 10+ LIKE conditions per request.
"""

import sqlite3

import structlog
from src.core.config import settings
from src.utils.quality import INVALID_NAMES, INVALID_DESCRIPTION_PATTERNS, MIN_DESCRIPTION_LENGTH

logger = structlog.get_logger()


def migrate():
    """Add is_quality column, backfill, and create composite indexes."""
    conn = sqlite3.connect(settings.database_url.replace("sqlite:///", ""))
    cursor = conn.cursor()

    try:
        cursor.execute("PRAGMA table_info(agents)")
        columns = {col[1] for col in cursor.fetchall()}

        if "is_quality" in columns:
            logger.debug("migrate_is_quality_skipped", reason="column_exists")
            _ensure_indexes(cursor, conn)
            return

        # 1. Add column
        cursor.execute("ALTER TABLE agents ADD COLUMN is_quality BOOLEAN DEFAULT 0")
        logger.info("migrate_is_quality_column_added")

        # 2. Backfill — mark quality agents
        #    Mirrors compute_is_quality(): valid name + valid description
        name_conditions = " AND ".join(
            f"name != '{n}'" for n in INVALID_NAMES
        )
        desc_conditions = " AND ".join(
            f"LOWER(description) NOT LIKE '%{p}%'" for p in INVALID_DESCRIPTION_PATTERNS
        )

        sql = f"""
            UPDATE agents SET is_quality = 1
            WHERE name IS NOT NULL
              AND name != ''
              AND {name_conditions}
              AND description IS NOT NULL
              AND LENGTH(description) >= {MIN_DESCRIPTION_LENGTH}
              AND {desc_conditions}
        """
        cursor.execute(sql)
        backfilled = cursor.rowcount
        conn.commit()
        logger.info("migrate_is_quality_backfilled", count=backfilled)

        # 3. Create composite indexes
        _ensure_indexes(cursor, conn)

    except Exception as e:
        logger.error("migrate_is_quality_failed", error=str(e))
        raise
    finally:
        conn.close()


def _ensure_indexes(cursor, conn):
    """Create composite indexes for common query patterns (idempotent)."""
    indexes = [
        ("ix_agents_quality_network", "is_quality, network_id"),
        ("ix_agents_quality_created", "is_quality, created_at DESC"),
        ("ix_agents_quality_reputation", "is_quality, reputation_score DESC"),
    ]
    for name, cols in indexes:
        cursor.execute(
            f"CREATE INDEX IF NOT EXISTS {name} ON agents({cols})"
        )
    conn.commit()
    logger.debug("migrate_is_quality_indexes_ensured")
