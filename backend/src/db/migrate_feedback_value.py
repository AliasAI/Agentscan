"""Database migration: Feedback score → value/value_decimals

ERC-8004 Mainnet Freeze Update (Jan 27, 2026):
- score (uint8, 0-100) → value (int128) + value_decimals (uint8)
- Supports decimals, negative numbers, and values > 100

Migration logic:
1. Add value and value_decimals columns if not exist
2. Copy score to value (score is equivalent to value with decimals=0)
3. Drop score column (SQLite requires table recreation)
"""

import sqlite3
import structlog
from dotenv import load_dotenv

load_dotenv()

logger = structlog.get_logger(__name__)


def migrate():
    """Run the migration"""
    conn = sqlite3.connect("8004scan.db")
    cursor = conn.cursor()

    try:
        # Check if migration is needed
        cursor.execute("PRAGMA table_info(feedbacks)")
        columns = {col[1] for col in cursor.fetchall()}

        # If value column already exists, migration is done
        if "value" in columns and "value_decimals" in columns:
            if "score" not in columns:
                logger.info("feedback_value_migration_already_done")
                return

        logger.info("feedback_value_migration_starting")

        # SQLite doesn't support DROP COLUMN easily, need to recreate table
        # Check if we need to migrate from score to value
        if "score" in columns and "value" not in columns:
            # Step 1: Create new table with updated schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feedbacks_new (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    network_id TEXT NOT NULL,
                    token_id INTEGER NOT NULL,
                    feedback_index INTEGER NOT NULL,
                    client_address TEXT NOT NULL,
                    value INTEGER NOT NULL,
                    value_decimals INTEGER NOT NULL DEFAULT 0,
                    tag1 TEXT,
                    tag2 TEXT,
                    endpoint TEXT,
                    feedback_uri TEXT,
                    feedback_hash TEXT,
                    is_revoked INTEGER NOT NULL DEFAULT 0,
                    block_number INTEGER NOT NULL,
                    transaction_hash TEXT NOT NULL,
                    timestamp TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (agent_id) REFERENCES agents(id),
                    FOREIGN KEY (network_id) REFERENCES networks(id)
                )
            """)

            # Step 2: Copy data, converting score to value
            cursor.execute("""
                INSERT INTO feedbacks_new (
                    id, agent_id, network_id, token_id, feedback_index,
                    client_address, value, value_decimals, tag1, tag2,
                    endpoint, feedback_uri, feedback_hash, is_revoked,
                    block_number, transaction_hash, timestamp, created_at
                )
                SELECT
                    id, agent_id, network_id, token_id, feedback_index,
                    client_address, score, 0, tag1, tag2,
                    endpoint, feedback_uri, feedback_hash, is_revoked,
                    block_number, transaction_hash, timestamp, created_at
                FROM feedbacks
            """)

            migrated_count = cursor.rowcount
            logger.info("feedback_data_migrated", count=migrated_count)

            # Step 3: Drop old table and rename new
            cursor.execute("DROP TABLE feedbacks")
            cursor.execute("ALTER TABLE feedbacks_new RENAME TO feedbacks")

            # Step 4: Recreate indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_feedbacks_agent_id
                ON feedbacks(agent_id)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_feedbacks_client_address
                ON feedbacks(client_address)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_feedbacks_block_number
                ON feedbacks(block_number)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_feedback_agent_block
                ON feedbacks(agent_id, block_number)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_feedback_network_token
                ON feedbacks(network_id, token_id)
            """)
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_feedback_unique
                ON feedbacks(network_id, token_id, client_address, feedback_index)
            """)

            conn.commit()
            logger.info(
                "feedback_value_migration_completed",
                migrated_rows=migrated_count
            )

        elif "value" not in columns:
            # Fresh table without score - just add columns
            cursor.execute("""
                ALTER TABLE feedbacks ADD COLUMN value INTEGER NOT NULL DEFAULT 0
            """)
            cursor.execute("""
                ALTER TABLE feedbacks ADD COLUMN value_decimals INTEGER NOT NULL DEFAULT 0
            """)
            conn.commit()
            logger.info("feedback_value_columns_added")

        else:
            logger.info("feedback_value_migration_not_needed")

    except Exception as e:
        conn.rollback()
        logger.error("feedback_value_migration_failed", error=str(e))
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
