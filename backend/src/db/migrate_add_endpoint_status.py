"""Migration: Add endpoint_status field to agents table

Stores endpoint health check results in database for fast retrieval.
"""

import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def migrate():
    """Add endpoint_status JSON field to agents table"""
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

    db_path = Path(db_path)
    if not db_path.exists():
        print(f"⚠️ Database does not exist yet: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if column exists
    cursor.execute("PRAGMA table_info(agents)")
    columns = [col[1] for col in cursor.fetchall()]

    if "endpoint_status" not in columns:
        print("Adding endpoint_status column...")
        cursor.execute(
            "ALTER TABLE agents ADD COLUMN endpoint_status TEXT"
        )  # JSON stored as TEXT
        conn.commit()
        print("✅ endpoint_status column added")
    else:
        print("✅ endpoint_status column already exists")

    if "endpoint_checked_at" not in columns:
        print("Adding endpoint_checked_at column...")
        cursor.execute("ALTER TABLE agents ADD COLUMN endpoint_checked_at DATETIME")
        conn.commit()
        print("✅ endpoint_checked_at column added")
    else:
        print("✅ endpoint_checked_at column already exists")

    conn.close()


if __name__ == "__main__":
    migrate()
