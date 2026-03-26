"""Task scheduler service - Multi-network support"""

import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.services.blockchain_sync import get_sync_service
from src.core.networks_config import get_enabled_networks, get_network
import structlog

logger = structlog.get_logger()

# Global scheduler instance
scheduler = AsyncIOScheduler()

# Endpoint scan configuration
ENDPOINT_SCAN_HOUR = 3  # UTC 03:00 daily
STARTUP_SCAN_THRESHOLD = 10  # Trigger startup scan if unchecked agents >= this

# Network sync intervals (minutes) - all networks at 5 minutes
# Rationale: catch-up is complete; event volume is low; 2-3min intervals wasted RPC budget
NETWORK_SYNC_INTERVALS = {
    "ethereum": 5, "polygon": 5, "base": 5, "monad": 5,
    "arbitrum": 5, "optimism": 5, "linea": 5, "scroll": 5,
    "avalanche": 5, "celo": 5, "gnosis": 5, "taiko": 5, "megaeth": 5,
    "bsc-1": 5, "sepolia": 5,
}


def _create_network_sync_task(network_key: str):
    """Factory function to create a sync task for a specific network"""
    async def sync_task():
        try:
            logger.info("scheduler_task_started", task=f"{network_key}_sync")
            await asyncio.to_thread(_sync_network_blocking, network_key)
            logger.info("scheduler_task_completed", task=f"{network_key}_sync")
        except Exception as e:
            logger.error(
                "scheduler_task_failed",
                task=f"{network_key}_sync",
                error=str(e)
            )
    return sync_task


def start_scheduler():
    """Start the background task scheduler with multi-network support"""

    async def endpoint_scan_task():
        """Daily endpoint health scan task"""
        try:
            logger.info("scheduler_task_started", task="endpoint_scan")
            await asyncio.to_thread(_run_endpoint_scan_blocking)
            logger.info("scheduler_task_completed", task="endpoint_scan")
        except Exception as e:
            logger.error("scheduler_task_failed", task="endpoint_scan", error=str(e))

    # Dynamically add sync jobs for all enabled networks
    enabled_networks = get_enabled_networks()
    scheduled_networks = []

    for network_key, config in enabled_networks.items():
        # Skip networks without RPC URL configured
        rpc_url = config.get("rpc_url", "")
        if not rpc_url:
            logger.warning(
                "network_sync_skipped",
                network=network_key,
                reason="no_rpc_url_configured"
            )
            continue

        # Get sync interval (default 5 minutes)
        interval = NETWORK_SYNC_INTERVALS.get(network_key, 5)

        # Create and add sync job
        sync_task = _create_network_sync_task(network_key)
        scheduler.add_job(
            sync_task,
            trigger=CronTrigger(minute=f'*/{interval}'),
            id=f'{network_key}_sync',
            name=f'Sync {config["name"]} blockchain data',
            replace_existing=True,
            max_instances=1
        )
        scheduled_networks.append(network_key)
        logger.info(
            "network_sync_scheduled",
            network=network_key,
            name=config["name"],
            interval_minutes=interval
        )

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

    # Log summary
    endpoint_scan_job = scheduler.get_job('endpoint_scan')
    logger.info(
        "scheduler_started",
        networks=scheduled_networks,
        total_networks=len(scheduled_networks),
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
