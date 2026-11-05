"""Local Agentscan x402 adoption signals."""

from __future__ import annotations

import base64
import json
from typing import Any
from urllib.parse import unquote

from sqlalchemy import distinct, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.models import Agent, AgentCapability, AgentEcosystemLink, X402EcosystemSnapshot


def read_local_x402_snapshot(db: Session) -> dict[str, Any]:
    """Serve the last published metadata counts without scanning the registry."""
    latest = db.query(X402EcosystemSnapshot).order_by(
        X402EcosystemSnapshot.snapshot_time.desc()
    ).first()
    counts = {"coinbase_linked_agents": _distinct_link_count(db, "coinbase")}
    for signal in ("x402", "agentkit", "payable"):
        key = f"{signal}_capability_agents"
        cached_count = getattr(latest, key, None)
        counts[key] = cached_count if cached_count is not None else len(_capability_agent_ids(db, signal))
    return counts


def local_x402_snapshot(db: Session) -> dict[str, Any]:
    """Return local x402 adoption counts from capabilities and agent metadata."""
    linked_agents = _distinct_link_count(db, "coinbase")
    x402_agents = _capability_agent_ids(db, "x402")
    agentkit_agents = _capability_agent_ids(db, "agentkit")
    payable_agents = _capability_agent_ids(db, "payable")

    extra_x402 = extra_agentkit = extra_payable = 0
    try:
        for agent_id, payload, text in _metadata_payloads(db):
            supports_x402 = _has_x402_signal(payload)
            if agent_id not in x402_agents and (supports_x402 or "x402" in text):
                extra_x402 += 1
            if agent_id not in agentkit_agents and "agentkit" in text:
                extra_agentkit += 1
            if agent_id not in payable_agents and (supports_x402 or "payment" in text):
                extra_payable += 1
    except SQLAlchemyError:
        db.rollback()
        extra_x402 = extra_agentkit = extra_payable = 0

    return {
        "coinbase_linked_agents": linked_agents,
        "x402_capability_agents": len(x402_agents) + extra_x402,
        "agentkit_capability_agents": len(agentkit_agents) + extra_agentkit,
        "payable_capability_agents": len(payable_agents) + extra_payable,
    }


def _metadata_payloads(db: Session):
    rows = db.query(Agent.id, Agent.metadata_uri, Agent.on_chain_data, Agent.description).yield_per(1000)
    for agent_id, metadata_uri, on_chain_data, description in rows:
        uri = metadata_uri or _agent_uri(on_chain_data)
        payload = _parse_metadata_uri(uri)
        text_parts = [description or "", uri or ""]
        if isinstance(on_chain_data, dict):
            text_parts.append(json.dumps(on_chain_data, ensure_ascii=False))
        elif on_chain_data:
            text_parts.append(str(on_chain_data))
        if payload:
            text_parts.append(json.dumps(payload, ensure_ascii=False))
        yield str(agent_id), payload, " ".join(text_parts).lower()


def _has_x402_signal(value: Any) -> bool:
    if isinstance(value, dict):
        for key, item in value.items():
            lowered = str(key).lower()
            if lowered in {"x402support", "x402_supported"} and item is True:
                return True
            if lowered == "x402" and (item is True or _truthy_supported(item)):
                return True
            if lowered in {"payment", "payments"} and _payment_uses_x402(item):
                return True
            if lowered in {"services", "endpoints", "capabilities", "tags", "categories"}:
                if _collection_mentions_x402(item):
                    return True
            if _has_x402_signal(item):
                return True
    if isinstance(value, list):
        return any(_has_x402_signal(item) for item in value)
    if isinstance(value, str):
        return value.lower() == "x402"
    return False


def _truthy_supported(value: Any) -> bool:
    return isinstance(value, dict) and (
        value.get("supported") is True or value.get("x402_supported") is True
    )


def _payment_uses_x402(value: Any) -> bool:
    if isinstance(value, dict):
        return str(value.get("protocol", "")).lower() == "x402" or _has_x402_signal(value)
    return isinstance(value, str) and value.lower() == "x402"


def _collection_mentions_x402(value: Any) -> bool:
    if isinstance(value, list):
        return any(_collection_mentions_x402(item) for item in value)
    if isinstance(value, dict):
        name = str(value.get("name") or value.get("id") or value.get("protocol") or "").lower()
        return name == "x402" or _has_x402_signal(value)
    return isinstance(value, str) and value.lower() == "x402"


def _agent_uri(on_chain_data: Any) -> str | None:
    if isinstance(on_chain_data, dict):
        value = on_chain_data.get("agentURI") or on_chain_data.get("metadata_uri")
        return str(value) if value else None
    return None


def _parse_metadata_uri(uri: str | None) -> dict[str, Any] | None:
    if not uri:
        return None
    try:
        if uri.startswith("{"):
            payload = json.loads(uri)
        elif uri.startswith("data:") and "base64," in uri:
            payload = json.loads(base64.b64decode(uri.split("base64,", 1)[1]).decode("utf-8"))
        elif uri.startswith("data:") and "," in uri:
            payload = json.loads(unquote(uri.split(",", 1)[1]))
        else:
            return None
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _capability_agent_ids(db: Session, capability_name: str) -> set[str]:
    try:
        rows = (
            db.query(AgentCapability.agent_id)
            .filter(AgentCapability.capability_name == capability_name)
            .distinct()
            .all()
        )
        return {str(row[0]) for row in rows}
    except SQLAlchemyError:
        db.rollback()
        return set()


def _distinct_link_count(db: Session, ecosystem_name: str) -> int:
    try:
        return int(
            db.query(func.count(distinct(AgentEcosystemLink.agent_id)))
            .filter(AgentEcosystemLink.ecosystem_name == ecosystem_name)
            .scalar()
            or 0
        )
    except SQLAlchemyError:
        db.rollback()
        return 0
