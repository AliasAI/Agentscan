"""
Backfill activity records for existing agents

This script creates REGISTERED activity records for all existing agents
that don't have one yet.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.db.database import SessionLocal
from src.models import Agent, Activity, ActivityType
import structlog

logger = structlog.get_logger()


def backfill_registration_activities():
    """Create REGISTERED activity records for existing agents"""
    db = SessionLocal()

    try:
        # Get all agents
        agents = db.query(Agent).filter(Agent.token_id.isnot(None)).all()

        logger.info("backfill_started", total_agents=len(agents))

        created_count = 0
        skipped_count = 0

        for agent in agents:
            # Check if activity already exists
            existing_activity = db.query(Activity).filter(
                Activity.agent_id == agent.id,
                Activity.activity_type == ActivityType.REGISTERED
            ).first()

            if existing_activity:
                skipped_count += 1
                continue

            # Create activity record using agent's created_at time
            activity = Activity(
                agent_id=agent.id,
                activity_type=ActivityType.REGISTERED,
                description=f"Agent '{agent.name}' (#{agent.token_id}) registered on-chain",
                tx_hash=None,
                created_at=agent.created_at  # Use agent's original creation time
            )

            db.add(activity)
            created_count += 1

            logger.info(
                "activity_created",
                agent_id=agent.id,
                token_id=agent.token_id,
                agent_name=agent.name,
                created_at=agent.created_at
            )

        db.commit()

        logger.info(
            "backfill_completed",
            created=created_count,
            skipped=skipped_count,
            total=len(agents)
        )

        print(f"\n✅ Backfill completed!")
        print(f"   Created: {created_count} activities")
        print(f"   Skipped: {skipped_count} activities (already exist)")
        print(f"   Total agents: {len(agents)}\n")

    except Exception as e:
        db.rollback()
        logger.error("backfill_failed", error=str(e))
        print(f"\n❌ Backfill failed: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔄 Starting activity backfill...\n")
    backfill_registration_activities()
