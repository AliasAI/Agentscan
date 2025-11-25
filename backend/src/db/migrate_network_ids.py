"""Migrate network IDs from UUID to network_key

This migration updates existing networks to use meaningful IDs like 'base-sepolia'
instead of auto-generated UUIDs.
"""

import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Network key mapping (chain_id -> network_key)
NETWORK_KEY_MAPPING = {
    11155111: "sepolia",
    84532: "base-sepolia",
    59141: "linea-sepolia",
    296: "hedera-testnet",
}


def migrate():
    """Migrate network IDs from UUID to network_key"""

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
        print("❌ Database does not exist")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check current network IDs
        cursor.execute("SELECT id, chain_id, name FROM networks")
        networks = cursor.fetchall()

        print("\n📋 Current networks:")
        for net_id, chain_id, name in networks:
            print(f"  ID: {net_id} | Chain: {chain_id} | Name: {name}")

        # Check if migration is needed
        needs_migration = any(len(net_id) > 20 for net_id, _, _ in networks)
        if not needs_migration:
            print("\n✅ Network IDs already migrated to network_key format")
            return

        print("\n🔧 Starting migration...")

        # For each network with UUID id
        for old_id, chain_id, name in networks:
            if len(old_id) <= 20:
                print(f"⏭️  Skipping {name} (already migrated)")
                continue

            new_id = NETWORK_KEY_MAPPING.get(chain_id)
            if not new_id:
                print(f"⚠️  No mapping found for {name} (chain_id: {chain_id}), skipping")
                continue

            print(f"\n📝 Migrating {name}:")
            print(f"   Old ID: {old_id}")
            print(f"   New ID: {new_id}")

            # Step 1: Update related tables (agents, blockchain_syncs)
            cursor.execute(
                "UPDATE agents SET network_id = ? WHERE network_id = ?",
                (new_id, old_id)
            )
            agents_updated = cursor.rowcount
            print(f"   ✅ Updated {agents_updated} agents")

            cursor.execute(
                "UPDATE blockchain_syncs SET network_name = ? WHERE network_name = ?",
                (new_id, old_id)
            )
            sync_updated = cursor.rowcount
            print(f"   ✅ Updated {sync_updated} blockchain_syncs records")

            # Step 2: Create new network record with new ID
            cursor.execute(
                """
                INSERT INTO networks (id, name, chain_id, rpc_url, explorer_url, contracts, created_at)
                SELECT ?, name, chain_id, rpc_url, explorer_url, contracts, created_at
                FROM networks
                WHERE id = ?
                """,
                (new_id, old_id)
            )
            print(f"   ✅ Created new network record with ID: {new_id}")

            # Step 3: Delete old network record
            cursor.execute("DELETE FROM networks WHERE id = ?", (old_id,))
            print(f"   ✅ Deleted old network record")

        conn.commit()

        # Verify migration
        print("\n📋 Networks after migration:")
        cursor.execute("SELECT id, chain_id, name FROM networks")
        networks = cursor.fetchall()
        for net_id, chain_id, name in networks:
            print(f"  ID: {net_id:20s} | Chain: {chain_id:10d} | Name: {name}")

        print("\n✅ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
