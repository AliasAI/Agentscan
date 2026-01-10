"""Task scheduler service - Multi-network support"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.services.blockchain_sync import (
    get_sync_service,
    sync_sepolia,
    sync_base_sepolia,
    sync_bsc_testnet,
)
from src.core.networks_config import get_enabled_networks
import structlog

logger = structlog.get_logger()

# Global scheduler instance
scheduler = AsyncIOScheduler()

# Endpoint scan configuration
ENDPOINT_SCAN_HOUR = 3  # UTC 03:00 daily
STARTUP_SCAN_THRESHOLD = 10  # Trigger startup scan if unchecked agents >= this


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

    async def sync_bsc_testnet_task():
        """Periodic BSC Testnet blockchain sync task"""
        try:
            logger.info("scheduler_task_started", task="bsc_testnet_sync")
            await asyncio.to_thread(_sync_network_blocking, "bsc-testnet")
            logger.info("scheduler_task_completed", task="bsc_testnet_sync")
        except Exception as e:
            logger.error(
                "scheduler_task_failed", task="bsc_testnet_sync", error=str(e)
            )

    async def endpoint_scan_task():
        """Daily endpoint health scan task"""
        try:
            logger.info("scheduler_task_started", task="endpoint_scan")
            await asyncio.to_thread(_run_endpoint_scan_blocking)
            logger.info("scheduler_task_completed", task="endpoint_scan")
        except Exception as e:
            logger.error("scheduler_task_failed", task="endpoint_scan", error=str(e))

    # Add Sepolia sync job - runs every 2 minutes
    scheduler.add_job(
        sync_sepolia_task,
        trigger=CronTrigger(minute='*/2'),
        id='sepolia_sync',
        name='Sync Sepolia blockchain data',
        replace_existing=True,
        max_instances=1
    )

    # Note: Base Sepolia and BSC Testnet sync jobs disabled (Jan 2026)
    # These networks are pending deployment of new contracts
    # Uncomment when contracts are deployed:
    #
    # scheduler.add_job(
    #     sync_base_sepolia_task,
    #     trigger=CronTrigger(minute='1-59/2'),
    #     id='base_sepolia_sync',
    #     name='Sync Base Sepolia blockchain data',
    #     replace_existing=True,
    #     max_instances=1
    # )

    # Add endpoint health scan job - runs daily at 03:00 UTC
    scheduler.add_job(
        endpoint_scan_task,
        trigger=CronTrigger(hour=ENDPOINT_SCAN_HOUR, minute=0),
        id='endpoint_scan',
        name='Daily endpoint health scan',
        replace_existing=True,
        max_instances=1
    )

    # Start scheduler
    scheduler.start()

    # Get next run times for logging
    sepolia_job = scheduler.get_job('sepolia_sync')
    endpoint_scan_job = scheduler.get_job('endpoint_scan')

    logger.info(
        "scheduler_started",
        networks=["sepolia"],  # Only Sepolia enabled (Jan 2026)
        sepolia_schedule="Every 2 minutes (:00, :02, :04, ...)",
        sepolia_next_run=sepolia_job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if sepolia_job and sepolia_job.next_run_time else 'N/A',
        endpoint_scan_schedule=f"Daily at {ENDPOINT_SCAN_HOUR:02d}:00 UTC",
        endpoint_scan_next_run=endpoint_scan_job.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if endpoint_scan_job and endpoint_scan_job.next_run_time else 'N/A',
        reputation_mode="EVENT-DRIVEN (via NewFeedback/FeedbackRevoked events)"
    )

    # Check for unchecked agents on startup and trigger scan if needed
    _check_and_trigger_startup_scan()


def _check_and_trigger_startup_scan():
    """Check if there are unchecked agents and trigger a scan if threshold is met"""
    from src.db.database import SessionLocal
    from src.models import Agent
    import threading

    try:
        db = SessionLocal()
        unchecked_count = db.query(Agent).filter(
            Agent.endpoint_checked_at.is_(None)
        ).count()
        db.close()

        if unchecked_count >= STARTUP_SCAN_THRESHOLD:
            logger.info(
                "startup_scan_triggered",
                unchecked_agents=unchecked_count,
                threshold=STARTUP_SCAN_THRESHOLD
            )
            # Run scan in background thread to not block startup
            thread = threading.Thread(target=_run_endpoint_scan_blocking, daemon=True)
            thread.start()
        else:
            logger.info(
                "startup_scan_skipped",
                unchecked_agents=unchecked_count,
                threshold=STARTUP_SCAN_THRESHOLD,
                reason="below_threshold"
            )
    except Exception as e:
        logger.error("startup_scan_check_failed", error=str(e))


def _sync_network_blocking(network_key: str):
    """Blocking wrapper for network sync - runs in thread pool"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        service = get_sync_service(network_key)
        loop.run_until_complete(service.sync())
    finally:
        loop.close()


def _run_endpoint_scan_blocking():
    """Run endpoint health scan for all unchecked agents - runs in thread pool"""
    from src.db.database import SessionLocal
    from src.models import Agent
    from src.services.endpoint_health_service import get_endpoint_health_service
    from datetime import datetime

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        db = SessionLocal()
        try:
            # Get all unchecked agents
            agents = db.query(Agent).filter(
                Agent.endpoint_checked_at.is_(None)
            ).all()

            if not agents:
                logger.info("endpoint_scan_skipped", reason="no_unchecked_agents")
                return

            logger.info("endpoint_scan_starting", total_agents=len(agents))

            service = get_endpoint_health_service()

            # Progress callback for logging
            async def log_progress(checked, total, working, agent_name, result):
                if checked % 100 == 0:  # Log every 100 agents
                    logger.info(
                        "endpoint_scan_progress",
                        checked=checked,
                        total=total,
                        working=working,
                    )

            # Run concurrent scan
            async def run_scan():
                return await service.scan_agents_concurrent(agents, log_progress)

            result = loop.run_until_complete(run_scan())

            # Save results to database
            for scan_result in result.get("results", []):
                agent_id = scan_result.get("agent_id")
                if agent_id:
                    try:
                        agent = db.query(Agent).filter(Agent.id == agent_id).first()
                        if agent:
                            # Always mark as checked, even if skipped (no metadata)
                            agent.endpoint_checked_at = datetime.utcnow()
                            # Only save endpoint_status if not skipped
                            if not scan_result.get("skipped"):
                                agent.endpoint_status = {
                                    "endpoints": scan_result.get("endpoints", []),
                                    "has_working_endpoints": scan_result.get("has_working_endpoints", False),
                                    "total_endpoints": scan_result.get("total_endpoints", 0),
                                    "healthy_endpoints": scan_result.get("healthy_endpoints", 0),
                                    "checked_at": datetime.utcnow().isoformat(),
                                }
                    except Exception as e:
                        logger.debug("db_save_failed", agent_id=agent_id, error=str(e))

            db.commit()

            logger.info(
                "endpoint_scan_completed",
                checked=result.get("checked", 0),
                working=result.get("working", 0),
            )

        finally:
            db.close()

    finally:
        loop.close()


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("scheduler_shutdown")
