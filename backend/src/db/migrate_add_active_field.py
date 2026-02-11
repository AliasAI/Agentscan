"""Migration: Add is_active and metadata_refreshed_at to agents table

Supports ERC-8004 off-chain active field and on-demand metadata refresh.
"""

import sqlite3

import structlog
from src.core.config import settings

logger = structlog.get_logger()


def migrate():
    """Add is_active (BOOLEAN) and metadata_refreshed_at (DATETIME) to agents"""
    conn = sqlite3.connect(settings.database_url.replace("sqlite:///", ""))
    cursor = conn.cursor()

    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(agents)")
        columns = {col[1] for col in cursor.fetchall()}

        added = []

        if "is_active" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN is_active BOOLEAN")
            added.append("is_active")

        if "metadata_refreshed_at" not in columns:
            cursor.execute("ALTER TABLE agents ADD COLUMN metadata_refreshed_at DATETIME")
            added.append("metadata_refreshed_at")

        conn.commit()

        if added:
            logger.info("migration_add_active_field", added_columns=added)
        else:
            logger.debug("migration_add_active_field_skipped", reason="columns_exist")

    except Exception as e:
        logger.error("migration_add_active_field_failed", error=str(e))
        raise
    finally:
        conn.close()
