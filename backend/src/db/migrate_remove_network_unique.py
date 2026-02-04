"""Remove UNIQUE constraint from networks.chain_id and networks.name

SQLite doesn't support ALTER TABLE DROP CONSTRAINT, so we need to recreate the table.
"""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()


def migrate():
    """Remove UNIQUE constraint from chain_id and name columns"""
    db_path = os.getenv("DATABASE_URL", "8004scan.db").replace("sqlite:///", "")
    print(f"📊 Connecting to database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if unique constraint exists on chain_id
        cursor.execute("PRAGMA index_list(networks)")
        indexes = cursor.fetchall()

        has_chain_id_unique = False
        for idx in indexes:
            idx_name = idx[1]
            cursor.execute(f"PRAGMA index_info({idx_name})")
            cols = cursor.fetchall()
            for col in cols:
                if col[2] == "chain_id" and "unique" in idx_name.lower():
                    has_chain_id_unique = True
                    break

        # Also check via table_info for inline UNIQUE
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='networks'")
        create_sql = cursor.fetchone()
        if create_sql and "chain_id" in create_sql[0]:
            if "UNIQUE" in create_sql[0]:
                has_chain_id_unique = True

        if not has_chain_id_unique:
            print("✅ chain_id UNIQUE constraint already removed, skipping")
            return

        print("🔄 Removing UNIQUE constraints from networks table...")

        # Step 1: Create new table without UNIQUE constraints
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS networks_new (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                chain_id INTEGER NOT NULL,
                rpc_url VARCHAR NOT NULL,
                explorer_url VARCHAR NOT NULL,
                contracts JSON,
                created_at DATETIME NOT NULL
            )
        """)

        # Step 2: Copy data
        cursor.execute("""
            INSERT INTO networks_new (id, name, chain_id, rpc_url, explorer_url, contracts, created_at)
            SELECT id, name, chain_id, rpc_url, explorer_url, contracts, created_at
            FROM networks
        """)

        # Step 3: Drop old table
        cursor.execute("DROP TABLE networks")

        # Step 4: Rename new table
        cursor.execute("ALTER TABLE networks_new RENAME TO networks")

        # Step 5: Recreate index on name (without UNIQUE)
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_networks_name ON networks (name)")

        conn.commit()
        print("✅ Successfully removed UNIQUE constraints from networks table")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
