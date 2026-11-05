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
from starlette.concurrency import run_in_threadpool

from src.db.database import SessionLocal
from src.services.bnb_agent_sources import (
    APEX_ERC8183_ADDRESS,
    APEX_EVALUATOR_ADDRESS,
    APEX_PAYMENT_TOKEN_ADDRESS,
    BSC_TESTNET_CHAIN_ID,
    fetch_execution_state,
    local_agentscan_snapshot,
)
from src.services.stale_cache import StaleWhileRevalidateCache

logger = structlog.get_logger()

NFASCAN_BASE_URL = "https://nfascan.net"
GITHUB_API_BASE_URL = "https://api.github.com"
CACHE_TTL_SECONDS = 10 * 60


_cache = StaleWhileRevalidateCache(
    CACHE_TTL_SECONDS,
    lambda value: _has_external_data(value),
)


async def fetch_bnb_agent_overview(
    db: Session,
    events_limit: int = 6,
    blocks_limit: int = 4,
    commits_limit: int = 5,
) -> dict[str, Any]:
    """Return BNB Agent overview data for the ecosystems page."""

    cache_key = f"bnb:{events_limit}:{blocks_limit}:{commits_limit}"

    async def _load(load_db: Session) -> dict[str, Any]:
        agentscan = await run_in_threadpool(local_agentscan_snapshot, load_db)

        async with httpx.AsyncClient(
            timeout=6.0,
            headers={
                "User-Agent": "agentscan/1.0 (+https://agentscan.info)",
                "Accept": "application/json",
            },
            follow_redirects=True,
        ) as client:
            nfascan_task = _fetch_nfascan(client, events_limit, blocks_limit)
            github_task = _fetch_github(client, commits_limit)
            execution_task = fetch_execution_state(client)
            try:
                nfascan, github, execution = await asyncio.wait_for(
                    asyncio.gather(
                        nfascan_task,
                        github_task,
                        execution_task,
                        return_exceptions=True,
                    ),
                    timeout=6.0,
                )
                nfascan = _result_or_default(nfascan, _empty_nfascan(), "nfascan_overview_failed")
                github = _result_or_default(github, _empty_github(), "bnb_github_fetch_failed")
                execution = _result_or_default(execution, _empty_execution(), "bnb_execution_fetch_failed")
            except TimeoutError:
                logger.warning("bnb_overview_timeout")
                nfascan, github, execution = _empty_nfascan(), _empty_github(), _empty_execution()

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

    async def _refresh_load() -> dict[str, Any]:
        refresh_db = SessionLocal()
        try:
            return await _load(refresh_db)
        finally:
            refresh_db.close()

    return await _cache.get_or_set(
        cache_key,
        lambda: _load(db),
        refresh_loader=_refresh_load,
    )

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
    responses = await asyncio.gather(
        *[_get_json(client, f"{NFASCAN_BASE_URL}{path}") for path in paths.values()],
        return_exceptions=True,
    )
    data = {}
    defaults = _empty_nfascan()
    for key, response in zip(paths.keys(), responses, strict=True):
        if isinstance(response, Exception):
            logger.warning("nfascan_fetch_failed", endpoint=key, error=str(response))
            data[key] = None
        else:
            data[key] = response

    return {
        "stats": data["stats"] or defaults["stats"],
        "bap578": data["bap578"] or defaults["bap578"],
        "health": data["health"] or defaults["health"],
        "contract": data["contract"] or defaults["contract"],
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


def _result_or_default(result: Any, default: dict[str, Any], event: str) -> dict[str, Any]:
    if isinstance(result, Exception):
        logger.warning(event, error=str(result))
        return default
    return result


def _empty_nfascan() -> dict[str, Any]:
    return {
        "stats": dict(totalAgents=0, totalEvents=0, totalReceipts=0, totalBlocks=0, latestBlock=0),
        "bap578": {
            "bap578Agents": 0, "merkleLearningAgents": 0,
            "jsonLightAgents": 0, "erc8004Registered": 0, "indexedContracts": 0,
            "learningModelBreakdown": {},
            "chainCoverage": {},
        },
        "health": {
            "status": "unavailable", "lastSyncedBlock": 0,
            "lastSyncTime": None, "syncAgeSec": 0, "isLive": False,
            "syncMode": "unavailable",
        },
        "contract": {
            "mintFeeBNB": None, "paused": None, "treasury": None,
            "proxy": None, "implementation": None, "compiler": None,
            "verified": False, "sourcify": None,
        },
        "recent_events": [],
        "recent_blocks": [],
    }


def _empty_github() -> dict[str, Any]:
    return {
        "repo": {
            "full_name": "bnb-chain/bnbagent-sdk",
            "html_url": "https://github.com/bnb-chain/bnbagent-sdk",
            "description": None, "stars": 0, "forks": 0,
            "open_issues": 0, "pushed_at": None, "updated_at": None,
        },
        "latest_release": None,
        "recent_commits": [],
        "open_pull_requests": [],
    }


def _empty_execution() -> dict[str, Any]:
    return {
        "network": "BSC Testnet",
        "chain_id": BSC_TESTNET_CHAIN_ID,
        "latest_block": None,
        "erc8183_contract": APEX_ERC8183_ADDRESS,
        "apex_evaluator": APEX_EVALUATOR_ADDRESS,
        "payment_token_default": APEX_PAYMENT_TOKEN_ADDRESS,
        "code_bytes": 0, "job_counter": None, "paused": None,
        "payment_token": None, "platform_fee_bp": None, "evaluator_fee_bp": None,
        "mainnet_status": "unavailable",
    }

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


def _has_external_data(value: dict[str, Any]) -> bool:
    nfascan = value.get("nfascan") or {}
    sdk = value.get("sdk") or {}
    execution = value.get("execution") or {}
    return (
        (nfascan.get("health") or {}).get("status") != "unavailable"
        or bool(sdk.get("recent_commits"))
        or execution.get("job_counter") is not None
    )
