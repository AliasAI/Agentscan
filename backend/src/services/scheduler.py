"""Task scheduler service"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.core.blockchain_config import SYNC_INTERVAL_MINUTES
from src.core.reputation_config import REPUTATION_SYNC_INTERVAL_MINUTES
from src.services.blockchain_sync import blockchain_sync_service
from src.services.reputation_sync import reputation_sync_service
import structlog

logger = structlog.get_logger()

# Global scheduler instance
scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the background task scheduler"""

    async def sync_blockchain():
        """Periodic blockchain sync task - runs in background thread to avoid blocking"""
        try:
            logger.info("scheduler_task_started", task="blockchain_sync")
            # Run in thread pool to avoid blocking the main event loop
            await asyncio.to_thread(_sync_blockchain_blocking)
            logger.info("scheduler_task_completed", task="blockchain_sync")
        except Exception as e:
            logger.error("scheduler_task_failed", task="blockchain_sync", error=str(e))

    async def sync_reputation():
        """Periodic reputation sync task - runs in background thread to avoid blocking"""
        try:
            logger.info("scheduler_task_started", task="reputation_sync")
            # Run in thread pool to avoid blocking the main event loop
            await asyncio.to_thread(_sync_reputation_blocking)
            logger.info("scheduler_task_completed", task="reputation_sync")
        except Exception as e:
            logger.error("scheduler_task_failed", task="reputation_sync", error=str(e))

    # Add blockchain sync job - run immediately on startup
    scheduler.add_job(
        sync_blockchain,
        trigger=IntervalTrigger(minutes=SYNC_INTERVAL_MINUTES),
        id='blockchain_sync',
        name='Sync blockchain data',
        replace_existing=True,
        max_instances=1,  # Only allow one instance to run at a time
        next_run_time=datetime.now(timezone.utc)  # Run immediately on startup
    )

    # Add reputation sync job - wait for interval before first run
    scheduler.add_job(
        sync_reputation,
        trigger=IntervalTrigger(minutes=REPUTATION_SYNC_INTERVAL_MINUTES),
        id='reputation_sync',
        name='Sync reputation scores',
        replace_existing=True,
        max_instances=1  # Only allow one instance to run at a time
    )

    # Start scheduler
    scheduler.start()
    logger.info(
        "scheduler_started",
        blockchain_interval_minutes=SYNC_INTERVAL_MINUTES,
        reputation_interval_minutes=REPUTATION_SYNC_INTERVAL_MINUTES,
        note="Initial sync will run immediately"
    )


def _sync_blockchain_blocking():
    """Blocking wrapper for blockchain sync - runs in thread pool"""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(blockchain_sync_service.sync())
    finally:
        loop.close()


def _sync_reputation_blocking():
    """Blocking wrapper for reputation sync - runs in thread pool"""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(reputation_sync_service.sync())
    finally:
        loop.close()


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("scheduler_shutdown")
