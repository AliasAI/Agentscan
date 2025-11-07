"""
Backfill activity records with real blockchain timestamps

This script queries the blockchain to get the actual registration time
for each agent and creates activity records with the correct timestamp.
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.database import SessionLocal
from src.models import Agent, Activity, ActivityType
from src.core.blockchain_config import SEPOLIA_RPC_URL, REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI
from web3 import Web3
import structlog

logger = structlog.get_logger()


def get_registration_timestamp(w3: Web3, contract, token_id: int):
    """Get the registration timestamp for a token from blockchain events"""
    try:
        # Query Registered events for this specific token
        events = contract.events.Registered.get_logs(
            fromBlock=0,
            toBlock='latest',
            argument_filters={'agentId': token_id}
        )

        if not events:
            logger.warning("no_event_found", token_id=token_id)
            return None

        # Get the first (should be only) event
        event = events[0]
        block_number = event['blockNumber']

        # Get block timestamp
        block = w3.eth.get_block(block_number)
        timestamp = datetime.utcfromtimestamp(block['timestamp'])

        logger.debug(
            "timestamp_found",
            token_id=token_id,
            block_number=block_number,
            timestamp=timestamp
        )

        return timestamp

    except Exception as e:
        logger.error("timestamp_fetch_failed", token_id=token_id, error=str(e))
        return None


def backfill_activities_from_chain():
    """Backfill activities with real blockchain timestamps"""

    # Initialize Web3
    w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
    contract = w3.eth.contract(
        address=REGISTRY_CONTRACT_ADDRESS,
        abi=REGISTRY_ABI
    )

    logger.info("web3_initialized", connected=w3.is_connected())

    db = SessionLocal()

    try:
        # First, delete all existing REGISTERED activities to start fresh
        deleted_count = db.query(Activity).filter(
            Activity.activity_type == ActivityType.REGISTERED
        ).delete()
        db.commit()

        logger.info("existing_activities_deleted", count=deleted_count)

        # Get all agents with token_id
        agents = db.query(Agent).filter(Agent.token_id.isnot(None)).order_by(Agent.token_id).all()

        logger.info("backfill_started", total_agents=len(agents))

        created_count = 0
        failed_count = 0

        for i, agent in enumerate(agents, 1):
            if i % 50 == 0:
                logger.info("progress", processed=i, total=len(agents))

            # Get real registration timestamp from blockchain
            timestamp = get_registration_timestamp(w3, contract, agent.token_id)

            if not timestamp:
                failed_count += 1
                # Fallback to database created_at if blockchain query fails
                timestamp = agent.created_at

            # Create activity record with real timestamp
            activity = Activity(
                agent_id=agent.id,
                activity_type=ActivityType.REGISTERED,
                description=f"Agent '{agent.name}' (#{agent.token_id}) registered on-chain",
                tx_hash=None,
                created_at=timestamp
            )

            db.add(activity)
            created_count += 1

        db.commit()

        logger.info(
            "backfill_completed",
            created=created_count,
            failed=failed_count,
            total=len(agents)
        )

        print(f"\n✅ Backfill completed!")
        print(f"   Created: {created_count} activities")
        print(f"   Failed to get timestamp: {failed_count} (used fallback)")
        print(f"   Total agents: {len(agents)}\n")

    except Exception as e:
        db.rollback()
        logger.error("backfill_failed", error=str(e))
        print(f"\n❌ Backfill failed: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔄 Starting activity backfill from blockchain...\n")
    print("⚠️  This may take several minutes as it queries blockchain for each agent.\n")
    backfill_activities_from_chain()
