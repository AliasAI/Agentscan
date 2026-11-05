"""Local Agentscan x402 adoption signals."""

from __future__ import annotations

import base64
import json
from typing import Any
from urllib.parse import unquote

from sqlalchemy import distinct, func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.models import AgentCapability, AgentEcosystemLink, X402EcosystemSnapshot

SIGNALS = ("x402", "agentkit", "payable")


def read_local_x402_snapshot(db: Session) -> dict[str, Any]:
    """Serve the last published metadata counts without scanning the registry."""
    counts = {"coinbase_linked_agents": _distinct_link_count(db, "coinbase")}
    try:
        row = db.execute(text(
            "SELECT x402, agentkit, payable FROM x402_rollup_state WHERE id = 1 AND ready = 1"
        )).one_or_none()
    except SQLAlchemyError:
        db.rollback()
        row = None
    if row is not None:
        counts.update({f"{signal}_capability_agents": value for signal, value in zip(SIGNALS, row)})
        return counts

    latest = db.query(X402EcosystemSnapshot).order_by(
        X402EcosystemSnapshot.snapshot_time.desc()
    ).first()
    for signal in SIGNALS:
        key = f"{signal}_capability_agents"
        cached_count = getattr(latest, key, None)
        counts[key] = cached_count if cached_count is not None else len(_capability_agent_ids(db, signal))
    return counts


def x402_signal_mask(metadata_uri: str | None, on_chain_data: Any, description: str | None) -> int:
    uri = metadata_uri or _agent_uri(on_chain_data)
    payload = _parse_metadata_uri(uri)
    parts = [description or "", uri or ""]
    if isinstance(on_chain_data, dict):
        parts.append(json.dumps(on_chain_data, ensure_ascii=False))
    elif on_chain_data:
        parts.append(str(on_chain_data))
    if payload:
        parts.append(json.dumps(payload, ensure_ascii=False))

    searchable = " ".join(parts).lower()
    supports_x402 = _has_x402_signal(payload)
    return (
        (1 if supports_x402 or "x402" in searchable else 0)
        | (2 if "agentkit" in searchable else 0)
        | (4 if supports_x402 or "payment" in searchable else 0)
    )


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
