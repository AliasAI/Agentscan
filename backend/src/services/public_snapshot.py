"""Periodic refresh for fixed, public database responses."""

from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from functools import partial
from time import monotonic
from typing import Generic, TypeVar

import structlog
from anyio import CapacityLimiter, to_thread
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from src.db.database import SessionLocal
from src.services.stale_cache import StaleWhileRevalidateCache

T = TypeVar("T")
_read_limiter = CapacityLimiter(2)
logger = structlog.get_logger()


class PublicSnapshot(Generic[T]):
    def __init__(
        self,
        name: str,
        ttl: int,
        loader: Callable[[Session], T],
        limiter: CapacityLimiter = _read_limiter,
    ) -> None:
        self.name = name
        self.ttl = ttl
        self._loader = loader
        self._limiter = limiter
        self._cache = StaleWhileRevalidateCache(ttl)

    async def get(self, db: Session) -> T:
        return await self._cache.get_or_set(self.name, partial(self._load, db), self._load)

    async def _load(self, db: Session | None = None) -> T:
        def read() -> T:
            if db is not None:
                return self._loader(db)
            with SessionLocal() as session:
                return self._loader(session)

        started = monotonic()
        value = await to_thread.run_sync(read, limiter=self._limiter)
        logger.info("public_snapshot_refreshed", snapshot=self.name, seconds=round(monotonic() - started, 2))
        return value

    async def warm(self) -> None:
        await self._cache.get_or_set(self.name, self._load)

    def schedule(self, scheduler: AsyncIOScheduler, delay: int) -> None:
        # Checks are cheap. The cache TTL controls when SQLite is read.
        scheduler.add_job(
            self.warm,
            trigger="interval",
            seconds=max(10, self.ttl // 10),
            next_run_time=datetime.now(timezone.utc) + timedelta(seconds=delay),
            id=f"snapshot_{self.name}",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
