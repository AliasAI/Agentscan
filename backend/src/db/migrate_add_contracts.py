"""Add contracts column to networks table"""

import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


def migrate():
    """Add contracts column to networks table"""

    # Get database path from environment variable or use default
    db_url = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")

    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        # Handle relative path
        if not db_path.startswith("/"):
            # Relative path, make it absolute from project root
            db_path = Path(__file__).parent.parent.parent / db_path
    else:
        print("❌ This migration only works with SQLite databases")
        return

    print(f"📊 Connecting to database: {db_path}")

    # Ensure database directory exists
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if contracts column already exists
        cursor.execute("PRAGMA table_info(networks)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'contracts' in columns:
            print("✅ 'contracts' column already exists, skipping migration")
            return

        # Add contracts column
        print("🔧 Adding 'contracts' column to networks table...")
        cursor.execute("""
            ALTER TABLE networks
            ADD COLUMN contracts TEXT
        """)

        conn.commit()
        print("✅ Successfully added 'contracts' column")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
