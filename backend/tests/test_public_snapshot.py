"""Tests for public snapshot warming and request isolation."""

import asyncio
import time
from contextlib import nullcontext
from threading import Event
from unittest import IsolatedAsyncioTestCase
from unittest.mock import Mock, patch

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.services.public_snapshot import PublicSnapshot


class PublicSnapshotTests(IsolatedAsyncioTestCase):
    async def test_cold_requests_share_one_read(self):
        loader = Mock(return_value={"total": 5})
        snapshot = PublicSnapshot("stats", 120, loader)
        session = Mock()

        results = await asyncio.gather(*(snapshot.get(session) for _ in range(8)))

        self.assertEqual(results, [{"total": 5}] * 8)
        loader.assert_called_once_with(session)

    async def test_warm_refresh_serves_stale_value_until_new_value_is_ready(self):
        request_session, worker_session = Mock(), Mock()
        release_refresh = Event()

        def load(session):
            if session is request_session:
                return 5
            if not release_refresh.wait(timeout=2):
                raise TimeoutError
            return 7

        loader = Mock(side_effect=load)
        snapshot = PublicSnapshot("stats", 120, loader)
        self.assertEqual(await snapshot.get(request_session), 5)
        snapshot._cache._store["stats"] = (time.monotonic() - 121, 5)

        with patch(
            "src.services.public_snapshot.SessionLocal", return_value=nullcontext(worker_session)
        ):
            try:
                await asyncio.wait_for(snapshot.warm(), timeout=1)
                self.assertEqual(await snapshot.get(request_session), 5)
                self.assertEqual(await snapshot.get(request_session), 5)
            finally:
                release_refresh.set()

            async with asyncio.timeout(2):
                while snapshot._cache._refreshing:
                    await asyncio.sleep(0.01)

        self.assertEqual(await snapshot.get(request_session), 7)
        self.assertEqual(loader.call_count, 2)
        self.assertIs(loader.call_args.args[0], worker_session)

    async def test_refresh_failure_preserves_last_success(self):
        snapshot = PublicSnapshot("stats", 120, Mock(side_effect=[5, RuntimeError("offline")]))
        session = Mock()
        self.assertEqual(await snapshot.get(session), 5)
        stale = (time.monotonic() - 121, 5)
        snapshot._cache._store["stats"] = stale
        with patch("src.services.public_snapshot.SessionLocal", return_value=nullcontext(session)):
            await snapshot.warm()
            async with asyncio.timeout(2):
                while snapshot._cache._refreshing:
                    await asyncio.sleep(0.01)
        self.assertEqual(snapshot._cache._store["stats"], stale)

    def test_schedule_registers_single_interval_job(self):
        snapshot = PublicSnapshot("stats", 120, Mock())
        scheduler = AsyncIOScheduler()

        snapshot.schedule(scheduler, delay=5)

        job = scheduler.get_job("snapshot_stats")
        self.assertEqual(job.max_instances, 1)
        self.assertEqual(job.trigger.interval.total_seconds(), 12)
