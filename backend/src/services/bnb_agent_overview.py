"""Live overview for the BNB Agent ecosystem.

Aggregates local Agentscan ERC-8004 data, NfaSCAN BAP-578 telemetry, and
BNBAgent SDK/APEX execution readiness signals behind a short TTL cache.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx
import structlog
from sqlalchemy.orm import Session

from src.services.bnb_agent_sources import (
    fetch_execution_state,
    local_agentscan_snapshot,
)

logger = structlog.get_logger()

NFASCAN_BASE_URL = "https://nfascan.net"
GITHUB_API_BASE_URL = "https://api.github.com"
CACHE_TTL_SECONDS = 10 * 60


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


async def fetch_bnb_agent_overview(
    db: Session,
    events_limit: int = 6,
    blocks_limit: int = 4,
    commits_limit: int = 5,
) -> dict[str, Any]:
    """Return BNB Agent overview data for the ecosystems page."""

    cache_key = f"bnb:{events_limit}:{blocks_limit}:{commits_limit}"

    async def _load() -> dict[str, Any]:
        agentscan = local_agentscan_snapshot(db)

        async with httpx.AsyncClient(
            timeout=15.0,
            headers={
                "User-Agent": "agentscan/1.0 (+https://agentscan.info)",
                "Accept": "application/json",
            },
            follow_redirects=True,
        ) as client:
            nfascan_task = _fetch_nfascan(client, events_limit, blocks_limit)
            github_task = _fetch_github(client, commits_limit)
            execution_task = fetch_execution_state(client)
            nfascan, github, execution = await asyncio.gather(
                nfascan_task,
                github_task,
                execution_task,
            )

        return {
            "source": {
                "agentscan": "local_database",
                "nfascan": "nfascan.net",
                "github": "github.com/bnb-chain/bnbagent-sdk",
                "execution_rpc": "bsc_testnet_public_rpc",
            },
            "fetched_at": time.time(),
            "cache_ttl_seconds": CACHE_TTL_SECONDS,
            "agentscan": agentscan,
            "nfascan": nfascan,
            "sdk": github,
            "execution": execution,
            "maturity": _maturity(agentscan, nfascan, github, execution),
        }

    return await _cache.get_or_set(cache_key, _load)

async def _fetch_nfascan(
    client: httpx.AsyncClient,
    events_limit: int,
    blocks_limit: int,
) -> dict[str, Any]:
    paths = {
        "stats": "/api/stats",
        "bap578": "/api/bap578/stats",
        "health": "/api/index/health",
        "contract": "/api/bap578/contract",
        "events": f"/api/events?limit={events_limit}",
        "blocks": f"/api/blocks?limit={blocks_limit}",
    }
    try:
        responses = await asyncio.gather(
            *[
                _get_json(client, f"{NFASCAN_BASE_URL}{path}")
                for path in paths.values()
            ]
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("nfascan_fetch_failed", error=str(exc))
        raise

    data = dict(zip(paths.keys(), responses, strict=True))
    return {
        "stats": data["stats"],
        "bap578": data["bap578"],
        "health": data["health"],
        "contract": data["contract"],
        "recent_events": (data["events"] or {}).get("data") or [],
        "recent_blocks": (data["blocks"] or {}).get("data") or [],
    }


async def _fetch_github(client: httpx.AsyncClient, commits_limit: int) -> dict[str, Any]:
    repo_path = "/repos/bnb-chain/bnbagent-sdk"
    repo, releases, commits, pulls = await asyncio.gather(
        _get_json(client, f"{GITHUB_API_BASE_URL}{repo_path}"),
        _get_json(client, f"{GITHUB_API_BASE_URL}{repo_path}/releases?per_page=5"),
        _get_json(
            client,
            f"{GITHUB_API_BASE_URL}{repo_path}/commits?per_page={commits_limit}",
        ),
        _get_json(client, f"{GITHUB_API_BASE_URL}{repo_path}/pulls?state=open&per_page=10"),
    )

    return {
        "repo": {
            "full_name": repo.get("full_name"),
            "html_url": repo.get("html_url"),
            "description": repo.get("description"),
            "stars": repo.get("stargazers_count"),
            "forks": repo.get("forks_count"),
            "open_issues": repo.get("open_issues_count"),
            "pushed_at": repo.get("pushed_at"),
            "updated_at": repo.get("updated_at"),
        },
        "latest_release": _first_release(releases),
        "recent_commits": [
            {
                "sha": commit.get("sha", "")[:7],
                "message": ((commit.get("commit") or {}).get("message") or "").split("\n")[0],
                "date": ((commit.get("commit") or {}).get("author") or {}).get("date"),
                "url": commit.get("html_url"),
            }
            for commit in commits
        ],
        "open_pull_requests": [
            {
                "number": pr.get("number"),
                "title": pr.get("title"),
                "updated_at": pr.get("updated_at"),
                "url": pr.get("html_url"),
            }
            for pr in pulls
        ],
    }

async def _get_json(client: httpx.AsyncClient, url: str) -> Any:
    response = await client.get(url)
    response.raise_for_status()
    return response.json()

def _first_release(releases: Any) -> dict[str, Any] | None:
    if not isinstance(releases, list) or not releases:
        return None
    release = releases[0]
    return {
        "tag_name": release.get("tag_name"),
        "name": release.get("name"),
        "published_at": release.get("published_at"),
        "url": release.get("html_url"),
    }


def _maturity(
    agentscan: dict[str, Any],
    nfascan: dict[str, Any],
    github: dict[str, Any],
    execution: dict[str, Any],
) -> dict[str, Any]:
    return {
        "identity_layer": {
            "status": "live",
            "evidence": f"{agentscan['agent_count']} local ERC-8004 agents on BNB",
        },
        "bap578_layer": {
            "status": "live_indexed",
            "evidence": (
                f"{(nfascan.get('bap578') or {}).get('bap578Agents')} "
                "BAP-578 agents from NfaSCAN"
            ),
        },
        "execution_layer": {
            "status": "testnet_active_development",
            "evidence": (
                f"jobCounter={execution.get('job_counter')}, "
                f"latest release={(github.get('latest_release') or {}).get('tag_name')}"
            ),
        },
    }
