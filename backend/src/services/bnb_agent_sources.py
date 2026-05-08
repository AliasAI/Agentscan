"""Data-source helpers for the BNB Agent ecosystem overview."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import httpx
from sqlalchemy import func
from sqlalchemy.orm import Session
from web3 import Web3

from src.models import Agent, BlockchainSync

BSC_NETWORK_ID = "bsc-1"
BSC_TESTNET_CHAIN_ID = 97
BSC_TESTNET_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/"
APEX_ERC8183_ADDRESS = "0xf8b6921fea71dfca3482a4a69576198d2072d188"
APEX_EVALUATOR_ADDRESS = "0xd707433ca1343759ccc127402b18cfdae3f0e10b"
APEX_PAYMENT_TOKEN_ADDRESS = "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565"


def local_agentscan_snapshot(db: Session) -> dict[str, Any]:
    total_agents = int(db.query(func.count(Agent.id)).scalar() or 0)
    bnb_agents = _count(db, Agent.network_id == BSC_NETWORK_ID)
    quality_agents = _count(
        db,
        Agent.network_id == BSC_NETWORK_ID,
        Agent.is_quality.is_(True),
    )
    reputation_agents = _count(
        db,
        Agent.network_id == BSC_NETWORK_ID,
        Agent.reputation_count > 0,
    )
    unique_owners = int(
        db.query(func.count(func.distinct(Agent.owner_address)))
        .filter(Agent.network_id == BSC_NETWORK_ID)
        .scalar()
        or 0
    )
    unique_agent_addresses = int(
        db.query(func.count(func.distinct(Agent.address)))
        .filter(Agent.network_id == BSC_NETWORK_ID)
        .scalar()
        or 0
    )
    first_seen, last_seen = (
        db.query(func.min(Agent.created_at), func.max(Agent.created_at))
        .filter(Agent.network_id == BSC_NETWORK_ID)
        .one()
    )
    sync = (
        db.query(BlockchainSync)
        .filter(BlockchainSync.network_name == BSC_NETWORK_ID)
        .first()
    )

    return {
        "network_id": BSC_NETWORK_ID,
        "network_name": "BNB Smart Chain",
        "agent_count": bnb_agents,
        "total_agents": total_agents,
        "share_pct": _pct(bnb_agents, total_agents),
        "quality_agents": quality_agents,
        "quality_pct": _pct(quality_agents, bnb_agents),
        "reputation_agents": reputation_agents,
        "reputation_pct": _pct(reputation_agents, bnb_agents),
        "unique_owners": unique_owners,
        "unique_agent_addresses": unique_agent_addresses,
        "first_seen_at": _iso(first_seen),
        "last_seen_at": _iso(last_seen),
        "sync": {
            "last_block": sync.last_block if sync else None,
            "current_block": sync.current_block if sync else None,
            "status": sync.status.value if sync else None,
            "last_synced_at": _iso(sync.last_synced_at if sync else None),
            "updated_at": _iso(sync.updated_at if sync else None),
        },
    }


async def fetch_execution_state(client: httpx.AsyncClient) -> dict[str, Any]:
    address = Web3.to_checksum_address(APEX_ERC8183_ADDRESS)
    latest_hex, code_hex = await _gather_rpc(
        client,
        ("eth_blockNumber", []),
        ("eth_getCode", [address, "latest"]),
    )
    calls = await _gather_rpc(
        client,
        ("eth_call", [_call(address, "jobCounter()"), "latest"]),
        ("eth_call", [_call(address, "paused()"), "latest"]),
        ("eth_call", [_call(address, "paymentToken()"), "latest"]),
        ("eth_call", [_call(address, "platformFeeBP()"), "latest"]),
        ("eth_call", [_call(address, "evaluatorFeeBP()"), "latest"]),
        return_exceptions=True,
    )

    return {
        "network": "BSC Testnet",
        "chain_id": BSC_TESTNET_CHAIN_ID,
        "latest_block": _hex_to_int(latest_hex),
        "erc8183_contract": address,
        "apex_evaluator": Web3.to_checksum_address(APEX_EVALUATOR_ADDRESS),
        "payment_token_default": Web3.to_checksum_address(APEX_PAYMENT_TOKEN_ADDRESS),
        "code_bytes": max((len(code_hex or "0x") - 2) // 2, 0),
        "job_counter": _decode_uint(calls[0]),
        "paused": _decode_bool(calls[1]),
        "payment_token": _decode_address(calls[2]),
        "platform_fee_bp": _decode_uint(calls[3]),
        "evaluator_fee_bp": _decode_uint(calls[4]),
        "mainnet_status": "preconfigured_not_deployed",
    }


def _count(db: Session, *criteria) -> int:
    return int(db.query(func.count(Agent.id)).filter(*criteria).scalar() or 0)


def _pct(part: int, total: int) -> float | None:
    return (part / total * 100.0) if total else None


async def _gather_rpc(client: httpx.AsyncClient, *calls, return_exceptions=False):
    import asyncio

    return await asyncio.gather(
        *[_rpc(client, method, params) for method, params in calls],
        return_exceptions=return_exceptions,
    )


async def _rpc(client: httpx.AsyncClient, method: str, params: list[Any]) -> Any:
    response = await client.post(
        BSC_TESTNET_RPC_URL,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
    )
    response.raise_for_status()
    payload = response.json()
    if "error" in payload:
        raise RuntimeError(payload["error"])
    return payload.get("result")


def _call(address: str, signature: str) -> dict[str, str]:
    selector = Web3.keccak(text=signature).hex()[:8]
    return {"to": address, "data": f"0x{selector}"}


def _decode_uint(value: Any) -> int | None:
    if isinstance(value, Exception) or not isinstance(value, str):
        return None
    return int(value, 16)


def _decode_bool(value: Any) -> bool | None:
    decoded = _decode_uint(value)
    return None if decoded is None else bool(decoded)


def _decode_address(value: Any) -> str | None:
    if isinstance(value, Exception) or not isinstance(value, str) or len(value) < 42:
        return None
    return Web3.to_checksum_address(f"0x{value[-40:]}")


def _hex_to_int(value: Any) -> int | None:
    return int(value, 16) if isinstance(value, str) else None


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()
