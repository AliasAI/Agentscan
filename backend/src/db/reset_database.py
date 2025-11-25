"""Complete database reset and initialization

This script provides a complete database reset solution:
1. Backup current database (optional)
2. Drop all tables
3. Recreate schema
4. Run all migrations
5. Initialize networks
6. Resync blockchain data

Usage:
    python -m src.db.reset_database [--backup] [--resync]
"""

import os
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Import migrations
from src.db.migrate_add_contracts import migrate as migrate_contracts
from src.db.migrate_add_oasf_fields import migrate as migrate_oasf
from src.db.migrate_add_classification_source import migrate as migrate_classification_source
from src.db.migrate_multi_network import migrate as migrate_multi_network
from src.db.migrate_network_ids import migrate as migrate_network_ids
from src.db.init_networks import init_networks


def get_db_path():
    """Get database path from environment"""
    db_url = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")

    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        if not db_path.startswith("/"):
            db_path = Path(__file__).parent.parent.parent / db_path
        return Path(db_path)
    else:
        raise ValueError("This script only works with SQLite databases")


def backup_database(db_path: Path):
    """Backup current database"""
    if not db_path.exists():
        print("⚠️  No database to backup")
        return None

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = db_path.parent / f"{db_path.stem}_backup_{timestamp}.db"

    print(f"📦 Backing up database to: {backup_path}")
    shutil.copy2(db_path, backup_path)
    print(f"✅ Backup created successfully")

    return backup_path


def drop_all_tables(db_path: Path):
    """Drop all tables in database"""
    if not db_path.exists():
        print("⚠️  Database does not exist, skipping drop")
        return

    print("🗑️  Dropping all tables...")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        # Drop all tables
        for table in tables:
            print(f"   - Dropping table: {table}")
            cursor.execute(f"DROP TABLE IF EXISTS {table}")

        conn.commit()
        print("✅ All tables dropped")

    except Exception as e:
        print(f"❌ Failed to drop tables: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


def create_schema():
    """Create database schema"""
    print("🔨 Creating database schema...")

    from src.db.database import engine, Base
    Base.metadata.create_all(bind=engine)

    print("✅ Schema created successfully")


def run_all_migrations():
    """Run all database migrations"""
    print("\n🔧 Running all migrations...")

    migrations = [
        ("contracts", migrate_contracts),
        ("OASF fields", migrate_oasf),
        ("classification source", migrate_classification_source),
        ("multi-network", migrate_multi_network),
        ("network IDs", migrate_network_ids),
    ]

    for name, migrate_func in migrations:
        try:
            print(f"\n📝 Running migration: {name}")
            migrate_func()
        except Exception as e:
            print(f"⚠️  Migration '{name}' warning: {e}")

    print("\n✅ All migrations completed")


def reset_sync_status():
    """Reset blockchain sync status"""
    print("\n🔄 Resetting blockchain sync status...")

    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Delete all blockchain_syncs records
        cursor.execute("DELETE FROM blockchain_syncs")
        deleted = cursor.rowcount

        conn.commit()
        print(f"✅ Reset {deleted} sync records")

    except Exception as e:
        print(f"⚠️  Failed to reset sync status: {e}")
        conn.rollback()

    finally:
        conn.close()


def main(backup: bool = False, resync: bool = False):
    """Main reset function"""
    print("=" * 60)
    print("🔄 DATABASE RESET TOOL")
    print("=" * 60)
    print()

    db_path = get_db_path()
    print(f"📊 Database: {db_path}")
    print()

    # Step 1: Backup (optional)
    if backup:
        backup_database(db_path)
        print()

    # Step 2: Drop all tables
    drop_all_tables(db_path)
    print()

    # Step 3: Create schema
    create_schema()
    print()

    # Step 4: Run migrations
    run_all_migrations()
    print()

    # Step 5: Initialize networks
    print("🌐 Initializing networks...")
    init_networks()
    print()

    # Step 6: Reset sync status (optional)
    if resync:
        reset_sync_status()
        print()

    print("=" * 60)
    print("✅ DATABASE RESET COMPLETED")
    print("=" * 60)
    print()
    print("📋 Next steps:")
    print("   1. Restart the backend server")
    print("   2. Blockchain sync will start automatically")
    if resync:
        print("   3. All data will be resynced from blockchain")
    print()


if __name__ == "__main__":
    import sys

    # Parse arguments
    backup = "--backup" in sys.argv
    resync = "--resync" in sys.argv

    # Confirm reset
    print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
    if backup:
        print("✓ Backup will be created")
    if resync:
        print("✓ Blockchain sync will be reset")
    print()

    response = input("Are you sure you want to continue? (yes/no): ")

    if response.lower() == "yes":
        main(backup=backup, resync=resync)
    else:
        print("❌ Reset cancelled")
