"""Add gas_used, gas_price, and transaction_fee fields to activities table"""

import sqlite3
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")
DB_PATH = DATABASE_URL.replace("sqlite:///", "")


def migrate():
    """Add gas tracking fields to activities table"""

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if fields already exist
        cursor.execute("PRAGMA table_info(activities)")
        columns = [row[1] for row in cursor.fetchall()]

        fields_to_add = []
        if "gas_used" not in columns:
            fields_to_add.append(("gas_used", "BIGINT"))
        if "gas_price" not in columns:
            fields_to_add.append(("gas_price", "BIGINT"))
        if "transaction_fee" not in columns:
            fields_to_add.append(("transaction_fee", "BIGINT"))

        if not fields_to_add:
            print("✅ Gas fields already exist in activities table")
            return

        # Add new fields
        for field_name, field_type in fields_to_add:
            cursor.execute(f"ALTER TABLE activities ADD COLUMN {field_name} {field_type}")
            print(f"✅ Added {field_name} to activities table")

        conn.commit()
        print("✅ Migration completed: gas tracking fields added to activities")

    except Exception as e:
        print(f"❌ Migration error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
