"""Thin live proxy for Virtuals ACP Scan public endpoints.

Does not persist anything — fetches overview data from acpx.virtuals.io with a
short in-memory TTL cache so we don't hammer their API on every pageview.

Endpoints mirrored:
  GET /api/metrics/four-metrics           -> overall aGDP / revenue / jobs / wallets
  GET /api/metrics/agents?...             -> top agents leaderboard
  GET /api/interactions?...mode=...       -> recent agent-to-agent transactions
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
import structlog

logger = structlog.get_logger()

ACPX_BASE_URL = "https://acpx.virtuals.io"
CACHE_TTL_SECONDS = 4 * 60 * 60  # 4 hours


class _TTLCache:
    def __init__(self, ttl: float) -> None:
        self._ttl = ttl
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def get_or_set(self, key: str, loader):
        async with self._lock:
            now = time.monotonic()
            cached = self._store.get(key)
            if cached and now - cached[0] < self._ttl:
                return cached[1]
            value = await loader()
            self._store[key] = (now, value)
            return value


_cache = _TTLCache(CACHE_TTL_SECONDS)


async def _get_json(client: httpx.AsyncClient, path: str) -> Any:
    response = await client.get(path)
    response.raise_for_status()
    return response.json()


def _latest_and_delta_30d(series: list[dict[str, Any]]) -> tuple[float | None, float | None]:
    """Return (latest_value, pct_change_vs_30d_ago) for an ordered time series."""
    if not series:
        return None, None
    try:
        latest = float(series[-1]["value"])
    except (KeyError, TypeError, ValueError):
        return None, None

    baseline: float | None = None
    if len(series) >= 2:
        try:
            baseline = float(series[0]["value"])
        except (KeyError, TypeError, ValueError):
            baseline = None

    if baseline is None or baseline == 0:
        return latest, None
    return latest, ((latest - baseline) / baseline) * 100.0


def _transform_four_metrics(payload: dict[str, Any]) -> dict[str, Any]:
    """Shape acpx's four-metrics response into a compact structure."""
    result = ((payload or {}).get("data") or {}).get("result") or {}

    # The API returns multiple buckets (e.g. 1D, 30D) keyed by window. Prefer 30D if
    # present for the "delta vs 30d ago" story, falling back to the longest series.
    def pick_series(entry: Any) -> list[dict[str, Any]]:
        if isinstance(entry, dict):
            if "30D" in entry and entry["30D"]:
                return entry["30D"]
            # choose the longest bucket available
            best: list[dict[str, Any]] = []
            for v in entry.values():
                if isinstance(v, list) and len(v) > len(best):
                    best = v
            return best
        if isinstance(entry, list):
            return entry
        return []

    def metric(key: str) -> dict[str, Any]:
        series = pick_series(result.get(key))
        latest, delta = _latest_and_delta_30d(series)
        return {
            "value": latest,
            "delta_pct_30d": delta,
            "points": len(series),
        }

    # acpx keys: GAV (Gross Agentic Value = aGDP), REVENUE, JOB, USER
    return {
        "total_agdp": metric("GAV"),
        "total_revenue": metric("REVENUE"),
        "total_jobs": metric("JOB"),
        "total_active_wallets": metric("USER"),
    }


def _transform_top_agents(payload: dict[str, Any], limit: int) -> list[dict[str, Any]]:
    rows = (payload or {}).get("data") or []
    return [
        {
            "id": row.get("id"),
            "name": row.get("name"),
            "profile_pic": row.get("profilePic"),
            "is_virtual_agent": row.get("isVirtualAgent"),
            "virtual_agent_id": row.get("virtualAgentId"),
            "agdp": row.get("grossAgenticAmount"),
            "volume": row.get("volume"),
            "revenue": row.get("revenue"),
            "memo_count": row.get("memoCount"),
            "successful_jobs": row.get("successfulJobCount"),
            "unique_buyers": row.get("uniqueBuyerCount"),
            "success_rate": row.get("successRate"),
            "last_active_at": row.get("lastActiveAt"),
            "tag": row.get("tag"),
        }
        for row in rows[:limit]
    ]


def _transform_interactions(payload: dict[str, Any], limit: int) -> list[dict[str, Any]]:
    rows = (payload or {}).get("data") or []
    shaped: list[dict[str, Any]] = []
    for row in rows[:limit]:
        shaped.append({
            "id": row.get("id"),
            "created_at": row.get("createdAt"),
            "tx_hash": row.get("txHash"),
            "type": row.get("type"),
            "content": row.get("content"),
            "from_agent": _short_agent(row.get("fromAgent")),
            "to_agent": _short_agent(row.get("toAgent")),
        })
    return shaped


def _short_agent(agent: Any) -> dict[str, Any] | None:
    if not isinstance(agent, dict):
        return None
    return {
        "id": agent.get("id"),
        "name": agent.get("name"),
        "profile_pic": agent.get("profilePic"),
    }


async def fetch_scan_overview(top_agents_limit: int = 10, tx_limit: int = 10) -> dict[str, Any]:
    """Return aggregated scan overview, cached for CACHE_TTL_SECONDS."""

    cache_key = f"scan:{top_agents_limit}:{tx_limit}"

    async def _load() -> dict[str, Any]:
        async with httpx.AsyncClient(
            base_url=ACPX_BASE_URL,
            timeout=15.0,
            headers={
                "User-Agent": "agentscan/1.0 (+https://agentscan.info)",
                "Accept": "application/json",
            },
            follow_redirects=True,
        ) as client:
            metrics_task = _get_json(client, "/api/metrics/four-metrics")
            top_agents_task = _get_json(
                client,
                f"/api/metrics/agents?page=1&pageSize={top_agents_limit}"
                "&sortBy=volume&sortOrder=desc",
            )
            interactions_task = _get_json(
                client,
                f"/api/interactions?pagination[page]=1&pagination[pageSize]={tx_limit}"
                "&sort=createdAt:desc&mode=agent-to-agent",
            )

            try:
                metrics_raw, top_agents_raw, interactions_raw = await asyncio.gather(
                    metrics_task, top_agents_task, interactions_task
                )
            except Exception as exc:  # noqa: BLE001
                logger.error("virtuals_acp_scan_fetch_failed", error=str(exc))
                raise

        return {
            "source": "acpx.virtuals.io",
            "fetched_at": time.time(),
            "metrics": _transform_four_metrics(metrics_raw),
            "top_agents": _transform_top_agents(top_agents_raw, top_agents_limit),
            "recent_transactions": _transform_interactions(interactions_raw, tx_limit),
        }

    return await _cache.get_or_set(cache_key, _load)
