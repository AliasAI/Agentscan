"""Reset blockchain sync status for a specific network

This script resets the sync status for a network, allowing it to rescan from the start block.

Usage:
    python -m src.db.reset_sync_status <network_key>

Example:
    python -m src.db.reset_sync_status base-sepolia
"""

import sys
import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


def reset_sync_status(network_key: str):
    """Reset sync status for a specific network"""

    # Get database path from environment variable or use default
    db_url = os.getenv("DATABASE_URL", "sqlite:///./8004scan.db")

    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        # Handle relative path
        if not db_path.startswith("/"):
            db_path = Path(__file__).parent.parent.parent / db_path
    else:
        print("❌ This script only works with SQLite databases")
        return

    print(f"📊 Connecting to database: {db_path}")

    db_path = Path(db_path)
    if not db_path.exists():
        print("❌ Database does not exist")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Get network info
        cursor.execute(
            "SELECT id, name, chain_id FROM networks WHERE id = ?",
            (network_key,)
        )
        network = cursor.fetchone()

        if not network:
            print(f"❌ Network '{network_key}' not found in database")
            print("\n📋 Available networks:")
            cursor.execute("SELECT id, name, chain_id FROM networks")
            for net in cursor.fetchall():
                print(f"   - {net[0]}: {net[1]} (Chain ID: {net[2]})")
            return

        network_id, network_name, chain_id = network
        print(f"✅ Found network: {network_name} (Chain ID: {chain_id})")

        # Check current sync status
        cursor.execute(
            """SELECT last_block, current_block, status, last_synced_at
               FROM blockchain_sync
               WHERE network_id = ?""",
            (network_id,)
        )
        sync_status = cursor.fetchone()

        if sync_status:
            last_block, current_block, status, last_synced = sync_status
            print(f"\n📊 Current sync status:")
            print(f"   - Last block: {last_block}")
            print(f"   - Current block: {current_block}")
            print(f"   - Status: {status}")
            print(f"   - Last synced: {last_synced}")

            # Delete sync status to trigger rescan
            cursor.execute(
                "DELETE FROM blockchain_sync WHERE network_id = ?",
                (network_id,)
            )
            print(f"\n🗑️  Deleted sync status for {network_name}")
        else:
            print(f"\n⚠️  No sync status found for {network_name} (will start fresh)")

        # Check existing agents for this network
        cursor.execute(
            "SELECT COUNT(*) FROM agents WHERE network_id = ?",
            (network_id,)
        )
        agent_count = cursor.fetchone()[0]

        if agent_count > 0:
            print(f"\n⚠️  Found {agent_count} existing agents for {network_name}")
            print("   These agents will NOT be deleted (unique constraint will prevent duplicates)")

        conn.commit()
        print(f"\n✅ Reset completed! Next sync will scan from start block.")
        print(f"\n🚀 To trigger sync manually:")
        print(f"   curl -X POST http://localhost:8000/api/sync/networks/{network_key}")
        print(f"\n⏰ Or wait for the next scheduled sync (every 2 minutes)")

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m src.db.reset_sync_status <network_key>")
        print("\nExample:")
        print("  python -m src.db.reset_sync_status base-sepolia")
        print("  python -m src.db.reset_sync_status sepolia")
        sys.exit(1)

    network_key = sys.argv[1]
    reset_sync_status(network_key)
