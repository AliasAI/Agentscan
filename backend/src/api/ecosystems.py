"""Ecosystem summary and discovery API."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.models import AgentCapability, AgentEcosystemLink, IngestionRun
from src.schemas.ecosystem import EcosystemSummaryItem, EcosystemSummaryResponse
from src.services.virtuals_acp_ingestion import (
    DEFAULT_QUERY_SEEDS,
    virtuals_acp_ingestion_service,
)
from src.services.bnb_agent_overview import fetch_bnb_agent_overview
from src.services.virtuals_acp_overview import fetch_scan_overview

router = APIRouter()


@router.get("/ecosystems/virtuals-acp/scan")
async def get_virtuals_acp_scan(
    top_agents_limit: int = 10,
    tx_limit: int = 10,
):
    """Live overview of the Virtuals ACP ecosystem (proxied from acpx.virtuals.io).

    Returns aggregated metrics, top agents, and recent agent-to-agent transactions.
    Cached for 4 hours to avoid hammering the upstream public API.
    """
    if not 1 <= top_agents_limit <= 50:
        raise HTTPException(status_code=400, detail="top_agents_limit must be 1..50")
    if not 1 <= tx_limit <= 50:
        raise HTTPException(status_code=400, detail="tx_limit must be 1..50")
    try:
        return await fetch_scan_overview(top_agents_limit, tx_limit)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"upstream_error: {exc}") from exc


@router.get("/ecosystems/bnb-agent/scan")
async def get_bnb_agent_scan(
    events_limit: int = 6,
    blocks_limit: int = 4,
    commits_limit: int = 5,
    db: Session = Depends(get_db),
):
    """Live overview of the BNB Agent stack.

    Combines local Agentscan ERC-8004 counts, NfaSCAN BAP-578 telemetry,
    BNBAgent SDK repository activity, and BSC testnet APEX/8183 contract state.
    Cached for 10 minutes by the service layer.
    """
    if not 1 <= events_limit <= 20:
        raise HTTPException(status_code=400, detail="events_limit must be 1..20")
    if not 1 <= blocks_limit <= 20:
        raise HTTPException(status_code=400, detail="blocks_limit must be 1..20")
    if not 1 <= commits_limit <= 10:
        raise HTTPException(status_code=400, detail="commits_limit must be 1..10")
    try:
        return await fetch_bnb_agent_overview(
            db,
            events_limit=events_limit,
            blocks_limit=blocks_limit,
            commits_limit=commits_limit,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"upstream_error: {exc}") from exc


@router.get("/ecosystems/summary", response_model=EcosystemSummaryResponse)
async def get_ecosystem_summary(db: Session = Depends(get_db)):
    """Return external ecosystem counts for website and MCP discovery surfaces."""

    ecosystem_counts = {
        row.ecosystem_name: int(row.agent_count or 0)
        for row in (
            db.query(
                AgentEcosystemLink.ecosystem_name,
                func.count(distinct(AgentEcosystemLink.agent_id)).label("agent_count"),
            )
            .group_by(AgentEcosystemLink.ecosystem_name)
            .all()
        )
    }

    capability_counts = {
        row.capability_name: int(row.agent_count or 0)
        for row in (
            db.query(
                AgentCapability.capability_name,
                func.count(distinct(AgentCapability.agent_id)).label("agent_count"),
            )
            .group_by(AgentCapability.capability_name)
            .all()
        )
    }

    ordered_ecosystems = ["virtuals_acp", "bnbagent", "coinbase"]
    items = [
        EcosystemSummaryItem(
            ecosystem=name,
            agent_count=ecosystem_counts.get(name, 0),
            capability_count=sum(
                count
                for capability_name, count in capability_counts.items()
                if _capability_matches_ecosystem(name, capability_name)
            ),
        )
        for name in ordered_ecosystems
    ]

    return EcosystemSummaryResponse(items=items)


def _capability_matches_ecosystem(ecosystem: str, capability_name: str) -> bool:
    if ecosystem == "virtuals_acp":
        return capability_name in {"acp", "payable"}
    if ecosystem == "bnbagent":
        return capability_name in {"erc8183", "execution", "job_execution"}
    if ecosystem == "coinbase":
        return capability_name in {"x402", "agentkit", "payable"}
    return False


@router.post("/ecosystems/virtuals-acp/ingest")
async def ingest_virtuals_acp(
    background_tasks: BackgroundTasks,
    queries: str | None = None,
    top_k: int = 100,
):
    """Start a background Virtuals ACP discovery ingestion run."""
    if top_k < 1 or top_k > 2000:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 2000")
    if virtuals_acp_ingestion_service.is_running:
        return {
            "status": "already_running",
            "service_status": virtuals_acp_ingestion_service.get_status(),
        }

    query_list = _parse_query_list(queries)
    background_tasks.add_task(
        virtuals_acp_ingestion_service.run,
        query_list,
        top_k,
    )
    return {
        "status": "started",
        "ecosystem": "virtuals_acp",
        "queries": query_list,
        "top_k": top_k,
    }


@router.get("/ecosystems/virtuals-acp/ingest/status")
async def get_virtuals_acp_ingestion_status(db: Session = Depends(get_db)):
    """Return runtime state and recent persisted runs for ACP ingestion."""
    recent_runs = (
        db.query(IngestionRun)
        .filter(IngestionRun.ecosystem_name == "virtuals_acp")
        .order_by(IngestionRun.started_at.desc())
        .limit(5)
        .all()
    )
    status = virtuals_acp_ingestion_service.get_status()
    status["recent_runs"] = [
        {
            "id": run.id,
            "status": run.status,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "ended_at": run.ended_at.isoformat() if run.ended_at else None,
            "stats": run.stats_json,
            "error_log": run.error_log,
        }
        for run in recent_runs
    ]
    return status


def _parse_query_list(queries: str | None) -> list[str]:
    if not queries:
        return list(DEFAULT_QUERY_SEEDS)
    return [query.strip() for query in queries.split(",") if query.strip()]
