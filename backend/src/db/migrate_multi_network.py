"""Migration to support multi-network agents

Changes:
1. Remove unique constraint on token_id column
2. Add composite unique constraint on (token_id, network_id)
"""

import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


def migrate():
    """Update agents table to support multi-network"""

    # Get database path from environment variable or use default
    db_url = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")

    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        # Handle relative path
        if not db_path.startswith("/"):
            db_path = Path(__file__).parent.parent.parent / db_path
    else:
        print("❌ This migration only works with SQLite databases")
        return

    print(f"📊 Connecting to database: {db_path}")

    db_path = Path(db_path)
    if not db_path.exists():
        print("⚠️ Database does not exist yet, skipping migration")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if composite unique constraint already exists
        # SQLite creates auto-indexes for UNIQUE constraints named "sqlite_autoindex_<table>_<n>"
        cursor.execute("PRAGMA index_list(agents)")
        indexes = cursor.fetchall()

        # Check for any sqlite_autoindex on agents table (indicates UNIQUE constraint exists)
        # Also need to verify it's a composite index on (token_id, network_id)
        for idx in indexes:
            idx_name = idx[1]
            # Check index columns
            cursor.execute(f"PRAGMA index_info({idx_name})")
            idx_cols = cursor.fetchall()
            col_names = [col[2] for col in idx_cols]

            # If we find an index on both token_id and network_id, constraint exists
            if 'token_id' in col_names and 'network_id' in col_names and len(col_names) == 2:
                print(f"✅ Composite unique constraint already exists ({idx_name}), skipping migration")
                return

        # SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
        # First, check current schema
        cursor.execute("PRAGMA table_info(agents)")
        columns = cursor.fetchall()
        print(f"📋 Current columns: {[col[1] for col in columns]}")

        # Step 1: Create new table with correct constraints
        print("🔧 Creating new agents table with composite unique constraint...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agents_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                description TEXT NOT NULL,
                reputation_score REAL NOT NULL DEFAULT 0.0,
                status TEXT NOT NULL DEFAULT 'active',
                network_id TEXT NOT NULL REFERENCES networks(id),
                token_id INTEGER,
                owner_address TEXT,
                metadata_uri TEXT,
                on_chain_data TEXT,
                last_synced_at TIMESTAMP,
                sync_status TEXT DEFAULT 'syncing',
                reputation_count INTEGER NOT NULL DEFAULT 0,
                reputation_last_updated TIMESTAMP,
                skills TEXT,
                domains TEXT,
                classification_source TEXT,
                endpoint_status TEXT,
                endpoint_checked_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                UNIQUE(token_id, network_id)
            )
        """)

        # Step 2: Copy data from old table
        print("📦 Copying data to new table...")
        cursor.execute("""
            INSERT INTO agents_new (
                id, name, address, description, reputation_score, status,
                network_id, token_id, owner_address, metadata_uri, on_chain_data,
                last_synced_at, sync_status, reputation_count, reputation_last_updated,
                skills, domains, classification_source,
                endpoint_status, endpoint_checked_at,
                created_at, updated_at
            )
            SELECT
                id, name, address, description, reputation_score, status,
                network_id, token_id, owner_address, metadata_uri, on_chain_data,
                last_synced_at, sync_status, reputation_count, reputation_last_updated,
                skills, domains, classification_source,
                endpoint_status, endpoint_checked_at,
                created_at, updated_at
            FROM agents
        """)

        # Step 3: Drop old table
        print("🗑️ Dropping old table...")
        cursor.execute("DROP TABLE agents")

        # Step 4: Rename new table
        print("✨ Renaming new table...")
        cursor.execute("ALTER TABLE agents_new RENAME TO agents")

        # Step 5: Recreate indexes
        print("📇 Recreating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_agents_name ON agents(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_agents_address ON agents(address)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_agents_token_id ON agents(token_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_agents_owner_address ON agents(owner_address)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_agents_created_at ON agents(created_at)")

        conn.commit()
        print("✅ Migration completed successfully!")

        # Verify
        cursor.execute("PRAGMA index_list(agents)")
        new_indexes = cursor.fetchall()
        print(f"📋 New indexes: {[idx[1] for idx in new_indexes]}")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
