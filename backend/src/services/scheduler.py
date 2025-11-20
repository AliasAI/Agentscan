"""Task scheduler service"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.services.blockchain_sync import blockchain_sync_service
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

    # Add blockchain sync job - runs every 10 minutes (low cost, needs frequent updates)
    # This ensures sync runs at predictable times regardless of when the server starts
    scheduler.add_job(
        sync_blockchain,
        trigger=CronTrigger(minute='*/1'),  # Run every 10 minutes
        id='blockchain_sync',
        name='Sync blockchain data',
        replace_existing=True,
        max_instances=1  # Only allow one instance to run at a time
    )

    # Reputation sync is now EVENT-DRIVEN (via NewFeedback/FeedbackRevoked events)
    # No need for periodic full sync - reputation updates happen automatically when feedback is given
    #
    # Optional: Add a weekly full sync as a safety net to catch any missed events
    # scheduler.add_job(
    #     sync_reputation,
    #     trigger=CronTrigger(day_of_week='sun', hour='2', minute='0'),  # Sunday 2:00 AM
    #     id='reputation_sync',
    #     name='Sync reputation scores (weekly safety net)',
    #     replace_existing=True,
    #     max_instances=1
    # )

    # Start scheduler
    scheduler.start()

    # Get next run times for logging
    blockchain_job = scheduler.get_job('blockchain_sync')

    logger.info(
        "scheduler_started",
        blockchain_schedule="Every 10 minutes",
        blockchain_next_run=blockchain_job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if blockchain_job.next_run_time else 'N/A',
        reputation_mode="EVENT-DRIVEN (via NewFeedback/FeedbackRevoked events)",
        note="Blockchain sync uses fixed time triggers; Reputation updates happen automatically on-chain events"
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


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("scheduler_shutdown")
