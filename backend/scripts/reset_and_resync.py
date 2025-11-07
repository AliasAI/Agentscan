"""
Reset database and trigger full resync with real blockchain timestamps

This script:
1. Deletes all agents and activities
2. Resets blockchain sync tracker
3. Lets the blockchain sync service re-fetch everything with correct timestamps
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.database import SessionLocal
from src.models import Agent, Activity, BlockchainSync
from src.core.blockchain_config import START_BLOCK
import structlog

logger = structlog.get_logger()


def reset_database():
    """Reset database for fresh sync"""
    db = SessionLocal()

    try:
        print("\n⚠️  WARNING: This will delete all agents and activities!")
        print("The blockchain sync service will re-fetch everything with correct timestamps.\n")

        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("\n❌ Operation cancelled.\n")
            return

        # Delete all activities
        activity_count = db.query(Activity).delete()
        logger.info("activities_deleted", count=activity_count)

        # Delete all agents
        agent_count = db.query(Agent).delete()
        logger.info("agents_deleted", count=agent_count)

        # Reset blockchain sync tracker
        sync_tracker = db.query(BlockchainSync).filter(
            BlockchainSync.network_name == "sepolia"
        ).first()

        if sync_tracker:
            sync_tracker.last_block = START_BLOCK - 1
            sync_tracker.error_message = None
            logger.info("sync_tracker_reset", last_block=sync_tracker.last_block)
        else:
            logger.warning("sync_tracker_not_found")

        db.commit()

        print(f"\n✅ Database reset completed!")
        print(f"   Deleted {agent_count} agents")
        print(f"   Deleted {activity_count} activities")
        print(f"   Reset sync tracker to block {START_BLOCK - 1}")
        print(f"\n📌 Next steps:")
        print(f"   The blockchain sync service will automatically re-fetch all data")
        print(f"   with correct blockchain timestamps on next sync cycle.\n")

    except Exception as e:
        db.rollback()
        logger.error("reset_failed", error=str(e))
        print(f"\n❌ Reset failed: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔄 Database Reset Tool\n")
    reset_database()
