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

router = APIRouter()


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
    if top_k < 1 or top_k > 500:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 500")
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
