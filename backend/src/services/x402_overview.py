"""Live overview for the x402 payment ecosystem."""

from __future__ import annotations

import asyncio
import re
import time
from collections import Counter
from typing import Any
from urllib.parse import urlparse

import httpx
import structlog
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from src.db.database import SessionLocal
from src.services.stale_cache import StaleWhileRevalidateCache
from src.services.x402_agent_signals import read_local_x402_snapshot
from src.services.x402_history import get_x402_history, record_x402_snapshot
from src.services.x402_pricing import amount_usd, price_distribution

logger = structlog.get_logger()

X402_HOME_URL = "https://www.x402.org/"
CDP_DISCOVERY_URL = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
CACHE_TTL_SECONDS = 30 * 60
DISCOVERY_PAGE_SIZE = 20
DISCOVERY_SAMPLE_PAGES = 10

_cache = StaleWhileRevalidateCache(
    CACHE_TTL_SECONDS,
    lambda value: _has_discovery_data(value),
)


async def fetch_x402_overview(db: Session, resources_limit: int = 8) -> dict[str, Any]:
    """Return x402 overview data for the ecosystems page."""

    cache_key = f"x402:{resources_limit}"

    async def _load(load_db: Session) -> dict[str, Any]:
        local = await run_in_threadpool(read_local_x402_snapshot, load_db)
        async with httpx.AsyncClient(
            timeout=6.0,
            headers={
                "User-Agent": "agentscan/1.0 (+https://agentscan.info)",
                "Accept": "application/json,text/html",
            },
            follow_redirects=True,
        ) as client:
            home_task = _safe_text(client, X402_HOME_URL, "x402_home")
            discovery_task = _safe_discovery(client, resources_limit)
            try:
                home_html, discovery = await asyncio.wait_for(
                    asyncio.gather(home_task, discovery_task),
                    timeout=8.0,
                )
            except TimeoutError:
                logger.warning("x402_overview_timeout")
                home_html, discovery = "", _empty_discovery()

        overview = {
            "source": {
                "official_stats": "x402.org",
                "discovery": "api.cdp.coinbase.com/platform/v2/x402/discovery/resources",
                "agentscan": "local_database",
            },
            "fetched_at": time.time(),
            "cache_ttl_seconds": CACHE_TTL_SECONDS,
            "official_stats": _parse_official_stats(home_html),
            "official_ecosystem": _empty_ecosystem(),
            "discovery": discovery,
            "agentscan": local,
            "maturity": _maturity(local, discovery),
        }
        overview["history"] = await run_in_threadpool(_record_and_get_history, load_db, overview)
        return overview

    async def _refresh_load() -> dict[str, Any]:
        refresh_db = SessionLocal()
        try:
            return await _load(refresh_db)
        finally:
            refresh_db.close()

    overview = await _cache.get_or_set(
        cache_key,
        lambda: _load(db),
        refresh_loader=_refresh_load,
    )
    local = await run_in_threadpool(read_local_x402_snapshot, db)
    return {
        **overview,
        "agentscan": local,
        "maturity": _maturity(local, overview["discovery"]),
    }


def _record_and_get_history(db: Session, overview: dict[str, Any]) -> list[dict[str, Any]]:
    record_x402_snapshot(db, overview)
    return get_x402_history(db)


async def _safe_text(client: httpx.AsyncClient, url: str, label: str) -> str:
    try:
        response = await client.get(url)
        response.raise_for_status()
        return response.text
    except Exception as exc:  # noqa: BLE001
        logger.warning("x402_text_fetch_failed", source=label, error=str(exc))
        return ""


async def _safe_discovery(client: httpx.AsyncClient, resources_limit: int) -> dict[str, Any]:
    try:
        return await _fetch_discovery(client, resources_limit)
    except Exception as exc:  # noqa: BLE001
        logger.warning("x402_discovery_fetch_failed", error=str(exc))
        return _empty_discovery()


def _empty_discovery() -> dict[str, Any]:
    return {
        "status": "unavailable",
        "total_resources": None,
        "sampled_resources": 0,
        "priced_resources": 0,
        "x402_version": None,
        "networks": [],
        "schemes": [],
        "assets": [],
        "price_distribution": [],
        "recent_resources": [],
    }


async def _fetch_discovery(client: httpx.AsyncClient, resources_limit: int) -> dict[str, Any]:
    results = await asyncio.gather(
        *[
            _get_json(
                client,
                f"{CDP_DISCOVERY_URL}?limit={DISCOVERY_PAGE_SIZE}&offset={offset}",
            )
            for offset in range(0, DISCOVERY_PAGE_SIZE * DISCOVERY_SAMPLE_PAGES, DISCOVERY_PAGE_SIZE)
        ],
        return_exceptions=True,
    )
    pages = [page for page in results if isinstance(page, dict)]
    for result in results:
        if isinstance(result, Exception):
            logger.warning("x402_discovery_page_failed", error=str(result))
    if not pages:
        raise RuntimeError("all discovery pages failed")
    first_page = pages[0] if pages else {}
    items = [item for page in pages for item in (page.get("items") or [])]
    accepts = [accept for item in items for accept in (item.get("accepts") or [])]

    distribution = price_distribution(items)
    return {
        "status": "live",
        "total_resources": (first_page.get("pagination") or {}).get("total"),
        "sampled_resources": len(items),
        "priced_resources": sum(bucket["count"] for bucket in distribution),
        "x402_version": first_page.get("x402Version"),
        "networks": _top_counts(accept.get("network") for accept in accepts),
        "schemes": _top_counts(accept.get("scheme") for accept in accepts),
        "assets": _top_counts(_asset_label(accept.get("asset")) for accept in accepts),
        "price_distribution": distribution,
        "recent_resources": [_resource_summary(item) for item in items[:resources_limit]],
    }


async def _get_json(client: httpx.AsyncClient, url: str) -> Any:
    response = await client.get(url)
    response.raise_for_status()
    return response.json()


def _parse_official_stats(html: str) -> dict[str, Any]:
    pairs = re.findall(
        r'<div class="text-3xl[^>]*>([^<]+)</div><div class="text-xs[^>]*>'
        r"(Transactions|Volume|Buyers|Sellers)</div>",
        html,
    )
    stats: dict[str, Any] = {"window": "Last 30 days"}
    for display, label in pairs[:4]:
        key = label.lower()
        stats[key] = {"display": display, "value": _parse_compact(display)}
    return stats


def _empty_ecosystem() -> dict[str, Any]:
    return {
        "premier_members": 0,
        "general_members": 0,
        "foundation_members": 0,
        "integration_count": 0,
        "category_breakdown": [],
    }


def _resource_summary(item: dict[str, Any]) -> dict[str, Any]:
    accepts = item.get("accepts") or []
    resource_url = item.get("resource") or item.get("url") or ""
    info = (((item.get("extensions") or {}).get("bazaar") or {}).get("info") or {})
    input_info = info.get("input") or {}
    networks = sorted({accept.get("network") for accept in accepts if accept.get("network")})
    prices = [amount_usd(accept) for accept in accepts]
    prices = [price for price in prices if price is not None]
    return {
        "resource": resource_url,
        "host": urlparse(resource_url).netloc,
        "description": item.get("description"),
        "method": input_info.get("method"),
        "accepts_count": len(accepts),
        "networks": networks[:4],
        "min_price_usd": min(prices) if prices else None,
    }


def _top_counts(values, limit: int = 6) -> list[dict[str, Any]]:
    counter = Counter(value for value in values if value)
    return [{"name": name, "count": count} for name, count in counter.most_common(limit)]


def _asset_label(asset: Any) -> str | None:
    if not isinstance(asset, str):
        return None
    lookup = {
        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC Base",
        "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": "USDC Polygon",
        "0x036cbd53842c5426634e7929541ec2318f3dcf7e": "USDC Base Sepolia",
        "epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwyt1v": "USDC Solana",
    }
    return lookup.get(asset.lower(), asset[:10])


def _parse_compact(value: str) -> float | None:
    cleaned = value.replace("$", "").replace(",", "").strip()
    multiplier = 1
    if cleaned.endswith("B"):
        multiplier = 1_000_000_000
        cleaned = cleaned[:-1]
    elif cleaned.endswith("M"):
        multiplier = 1_000_000
        cleaned = cleaned[:-1]
    elif cleaned.endswith("K"):
        multiplier = 1_000
        cleaned = cleaned[:-1]
    try:
        return float(cleaned) * multiplier
    except ValueError:
        return None


def _maturity(local: dict[str, Any], discovery: dict[str, Any]) -> dict[str, Any]:
    total_resources = discovery.get("total_resources")
    return {
        "payment_layer": {
            "status": "live",
            "evidence": f"{total_resources or 0} public Bazaar resources",
        },
        "agent_readiness": {
            "status": "metadata_indexed" if local.get("x402_capability_agents") else "watching",
            "evidence": f"{local.get('x402_capability_agents', 0)} Agentscan agents tagged x402",
        },
        "settlement_layer": {
            "status": "multi_network",
            "evidence": "Discovery resources advertise accepted networks and exact payment schemes.",
        },
    }


def _has_discovery_data(value: dict[str, Any]) -> bool:
    discovery = value.get("discovery") or {}
    return discovery.get("status") == "live" or bool(discovery.get("recent_resources"))
