#!/usr/bin/env python3
"""
Endpoint Scanner Script

Scans all agents' endpoints and saves results to database.
Shows real-time progress during scanning.

Usage:
    uv run python -m src.scripts.scan_endpoints [options]

Options:
    --network NETWORK    Filter by network (e.g., sepolia)
    --limit N            Limit number of agents to scan
    --force              Re-scan agents that were already checked
    --batch-size N       Number of concurrent checks (default: 5)
"""

import asyncio
import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv

load_dotenv()

from src.db.database import SessionLocal
from src.models import Agent
from src.services.endpoint_health_service import EndpointHealthService
from src.db.migrate_add_endpoint_status import migrate


class ProgressTracker:
    """Track and display progress"""

    def __init__(self, total: int):
        self.total = total
        self.checked = 0
        self.working = 0
        self.failed = 0
        self.skipped = 0
        self.start_time = datetime.now()

    def update(self, has_working: bool, skipped: bool = False):
        self.checked += 1
        if skipped:
            self.skipped += 1
        elif has_working:
            self.working += 1
        else:
            self.failed += 1
        self._print_progress()

    def _print_progress(self):
        elapsed = (datetime.now() - self.start_time).total_seconds()
        rate = self.checked / elapsed if elapsed > 0 else 0
        remaining = (self.total - self.checked) / rate if rate > 0 else 0

        # Progress bar
        pct = self.checked / self.total * 100
        bar_len = 30
        filled = int(bar_len * self.checked / self.total)
        bar = "█" * filled + "░" * (bar_len - filled)

        # Status line
        status = (
            f"\r[{bar}] {pct:5.1f}% | "
            f"{self.checked}/{self.total} | "
            f"✅ {self.working} | ❌ {self.failed} | ⏭️  {self.skipped} | "
            f"⏱️  {remaining:.0f}s left"
        )
        print(status, end="", flush=True)

    def finish(self):
        elapsed = (datetime.now() - self.start_time).total_seconds()
        print()
        print()
        print("=" * 60)
        print("📊 SCAN COMPLETE")
        print("=" * 60)
        print(f"  Total agents:      {self.total}")
        print(f"  Checked:           {self.checked}")
        print(f"  Working endpoints: {self.working}")
        print(f"  No endpoints:      {self.failed}")
        print(f"  Skipped:           {self.skipped}")
        print(f"  Time elapsed:      {elapsed:.1f}s")
        print("=" * 60)


async def scan_agent(
    service: EndpointHealthService, agent: Agent, db, include_feedbacks: bool = False
) -> dict:
    """Scan a single agent and return results"""
    report = await service.check_agent_endpoints(
        agent, include_feedbacks=include_feedbacks
    )

    # Prepare endpoint status for database
    endpoint_status = {
        "endpoints": [ep.to_dict() for ep in report.endpoints],
        "has_working_endpoints": report.has_working_endpoints,
        "total_endpoints": report.total_endpoints,
        "healthy_endpoints": report.healthy_endpoints,
        "checked_at": datetime.utcnow().isoformat(),
    }

    # Update agent in database
    agent.endpoint_status = endpoint_status
    agent.endpoint_checked_at = datetime.utcnow()
    db.commit()

    return {
        "has_working": report.has_working_endpoints,
        "total": report.total_endpoints,
        "healthy": report.healthy_endpoints,
    }


async def main():
    parser = argparse.ArgumentParser(description="Scan agent endpoints")
    parser.add_argument("--network", help="Filter by network key")
    parser.add_argument("--limit", type=int, help="Limit number of agents")
    parser.add_argument(
        "--force", action="store_true", help="Re-scan already checked agents"
    )
    parser.add_argument(
        "--batch-size", type=int, default=5, help="Concurrent checks (default: 5)"
    )

    args = parser.parse_args()

    # Run migration first
    print("🔧 Running database migration...")
    migrate()
    print()

    # Get agents to scan
    db = SessionLocal()
    query = db.query(Agent)

    if args.network:
        query = query.filter(Agent.network_id == args.network)

    if not args.force:
        # Only scan agents that haven't been checked yet
        query = query.filter(Agent.endpoint_checked_at.is_(None))

    if args.limit:
        query = query.limit(args.limit)

    agents = query.all()
    total = len(agents)

    if total == 0:
        print("✅ No agents to scan (all already checked or no agents found)")
        print("   Use --force to re-scan checked agents")
        db.close()
        return

    print(f"🔍 Starting endpoint scan for {total} agents...")
    print(f"   Network filter: {args.network or 'all'}")
    print(f"   Batch size: {args.batch_size}")
    print()

    # Initialize service and progress tracker
    service = EndpointHealthService()
    progress = ProgressTracker(total)
    semaphore = asyncio.Semaphore(args.batch_size)

    async def scan_with_semaphore(agent):
        async with semaphore:
            try:
                result = await scan_agent(service, agent, db)
                progress.update(result["has_working"])
            except Exception as e:
                print(f"\n⚠️  Error scanning {agent.name}: {e}")
                progress.update(False, skipped=True)

    # Scan all agents
    await asyncio.gather(*[scan_with_semaphore(agent) for agent in agents])

    progress.finish()
    db.close()


if __name__ == "__main__":
    asyncio.run(main())
