"""
Migration: Add 0x prefix to transaction_hash fields

This migration fixes transaction_hash values that were stored without the 0x prefix.
Web3.py's HexBytes.hex() returns hex strings without 0x prefix.
"""

import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def migrate():
    """Add 0x prefix to all transaction_hash fields missing it."""
    db_path = Path(__file__).parent.parent.parent / "8004scan.db"

    if not db_path.exists():
        print("Database not found, skipping tx_hash prefix migration")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables_columns = [
        ("feedbacks", "transaction_hash"),
        ("activities", "tx_hash"),
        ("validations", "request_tx_hash"),
        ("validations", "response_tx_hash"),
    ]

    total_updated = 0

    for table, column in tables_columns:
        # Check if table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table,)
        )
        if not cursor.fetchone():
            print(f"  Table '{table}' not found, skipping")
            continue

        # Check if column exists
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        if column not in columns:
            print(f"  Column '{column}' not found in '{table}', skipping")
            continue

        # Count records needing fix (has value, not null, doesn't start with 0x)
        cursor.execute(f"""
            SELECT COUNT(*) FROM {table}
            WHERE {column} IS NOT NULL
            AND {column} != ''
            AND {column} NOT LIKE '0x%'
        """)
        count = cursor.fetchone()[0]

        if count > 0:
            # Update records
            cursor.execute(f"""
                UPDATE {table}
                SET {column} = '0x' || {column}
                WHERE {column} IS NOT NULL
                AND {column} != ''
                AND {column} NOT LIKE '0x%'
            """)
            conn.commit()
            print(f"  Updated {count} records in {table}.{column}")
            total_updated += count
        else:
            print(f"  {table}.{column}: no records need fixing")

    conn.close()

    if total_updated > 0:
        print(f"Migration complete: {total_updated} total records updated")
    else:
        print("Migration complete: no records needed fixing")


if __name__ == "__main__":
    migrate()
