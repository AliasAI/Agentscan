"""Task scheduler service - Multi-network support"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.services.blockchain_sync import (
    get_sync_service,
    sync_sepolia,
    sync_base_sepolia,
)
from src.core.networks_config import get_enabled_networks
import structlog

logger = structlog.get_logger()

# Global scheduler instance
scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the background task scheduler with multi-network support"""

    async def sync_sepolia_task():
        """Periodic Sepolia blockchain sync task"""
        try:
            logger.info("scheduler_task_started", task="sepolia_sync")
            await asyncio.to_thread(_sync_network_blocking, "sepolia")
            logger.info("scheduler_task_completed", task="sepolia_sync")
        except Exception as e:
            logger.error("scheduler_task_failed", task="sepolia_sync", error=str(e))

    async def sync_base_sepolia_task():
        """Periodic Base Sepolia blockchain sync task"""
        try:
            logger.info("scheduler_task_started", task="base_sepolia_sync")
            await asyncio.to_thread(_sync_network_blocking, "base-sepolia")
            logger.info("scheduler_task_completed", task="base_sepolia_sync")
        except Exception as e:
            logger.error(
                "scheduler_task_failed", task="base_sepolia_sync", error=str(e)
            )

    # Add Sepolia sync job - runs every 2 minutes
    scheduler.add_job(
        sync_sepolia_task,
        trigger=CronTrigger(minute='*/2'),
        id='sepolia_sync',
        name='Sync Sepolia blockchain data',
        replace_existing=True,
        max_instances=1
    )

    # Add Base Sepolia sync job - runs every 2 minutes (offset by 1 minute to avoid overlap)
    scheduler.add_job(
        sync_base_sepolia_task,
        trigger=CronTrigger(minute='1-59/2'),  # Runs at 1, 3, 5, ... minutes
        id='base_sepolia_sync',
        name='Sync Base Sepolia blockchain data',
        replace_existing=True,
        max_instances=1
    )

    # Start scheduler
    scheduler.start()

    # Get next run times for logging
    sepolia_job = scheduler.get_job('sepolia_sync')
    base_sepolia_job = scheduler.get_job('base_sepolia_sync')

    logger.info(
        "scheduler_started",
        networks=["sepolia", "base-sepolia"],
        sepolia_schedule="Every 2 minutes (:00, :02, :04, ...)",
        sepolia_next_run=sepolia_job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if sepolia_job and sepolia_job.next_run_time else 'N/A',
        base_sepolia_schedule="Every 2 minutes (:01, :03, :05, ...)",
        base_sepolia_next_run=base_sepolia_job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if base_sepolia_job and base_sepolia_job.next_run_time else 'N/A',
        reputation_mode="EVENT-DRIVEN (via NewFeedback/FeedbackRevoked events)"
    )


def _sync_network_blocking(network_key: str):
    """Blocking wrapper for network sync - runs in thread pool"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        service = get_sync_service(network_key)
        loop.run_until_complete(service.sync())
    finally:
        loop.close()


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("scheduler_shutdown")
