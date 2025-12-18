"""Endpoint Health Check API

Endpoints for checking agent endpoint availability and generating health reports.
"""

from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import structlog
import json
import asyncio
from threading import Lock

from src.db.database import get_db, SessionLocal
from src.models import Agent
from src.schemas.endpoint_health import (
    AgentEndpointReportResponse,
    EndpointHealthSummaryResponse,
    EndpointHealthFullResponse,
)
from src.services.endpoint_health_service import get_endpoint_health_service

router = APIRouter()
logger = structlog.get_logger(__name__)

# Global scan state storage (persists across page refreshes)
_scan_state_lock = Lock()
_scan_state = {
    "is_scanning": False,
    "checked": 0,
    "total": 0,
    "working": 0,
    "current_agent": None,
    "started_at": None,
    "network": None,
}


@router.get("/endpoint-health/scan-status")
async def get_scan_status():
    """
    Get current scan status. Used to restore progress after page refresh.
    """
    with _scan_state_lock:
        return {
            "is_scanning": _scan_state["is_scanning"],
            "checked": _scan_state["checked"],
            "total": _scan_state["total"],
            "working": _scan_state["working"],
            "current_agent": _scan_state["current_agent"],
            "started_at": _scan_state["started_at"],
            "network": _scan_state["network"],
        }


@router.get(
    "/agents/{agent_id}/endpoint-health",
    response_model=AgentEndpointReportResponse,
)
async def check_agent_endpoint_health(
    agent_id: str,
    include_feedbacks: bool = Query(True, description="Include recent feedbacks"),
    db: Session = Depends(get_db),
):
    """
    Check endpoint health for a specific agent.

    Returns health status for all endpoints found in the agent's metadata,
    along with recent feedback history.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    service = get_endpoint_health_service()
    report = await service.check_agent_endpoints(
        agent, include_feedbacks=include_feedbacks
    )

    return AgentEndpointReportResponse(**report.to_dict())


@router.get("/endpoint-health/quick-stats")
async def get_quick_stats(
    network: str = Query(None, description="Filter by network key"),
    db: Session = Depends(get_db),
):
    """
    Get statistics from database. Super fast - pure SQL queries.
    Includes both endpoint health and reputation overview.
    """
    from sqlalchemy import text, func, desc

    # Base filter (use parameterized query for safety)
    if network:
        count_result = db.execute(
            text("SELECT COUNT(*) FROM agents WHERE network_id = :network"),
            {"network": network}
        ).scalar()
        scanned_result = db.execute(
            text("SELECT COUNT(*) FROM agents WHERE network_id = :network AND endpoint_status IS NOT NULL"),
            {"network": network}
        ).scalar()
        feedback_result = db.execute(
            text("SELECT COUNT(*) FROM agents WHERE network_id = :network AND reputation_count > 0"),
            {"network": network}
        ).scalar()
        # Reputation stats
        rep_stats = db.execute(
            text("""
                SELECT
                    COALESCE(SUM(reputation_count), 0) as total_feedbacks,
                    COALESCE(AVG(CASE WHEN reputation_count > 0 THEN reputation_score END), 0) as avg_score
                FROM agents WHERE network_id = :network
            """),
            {"network": network}
        ).fetchone()
    else:
        count_result = db.execute(text("SELECT COUNT(*) FROM agents")).scalar()
        scanned_result = db.execute(
            text("SELECT COUNT(*) FROM agents WHERE endpoint_status IS NOT NULL")
        ).scalar()
        feedback_result = db.execute(
            text("SELECT COUNT(*) FROM agents WHERE reputation_count > 0")
        ).scalar()
        # Reputation stats
        rep_stats = db.execute(
            text("""
                SELECT
                    COALESCE(SUM(reputation_count), 0) as total_feedbacks,
                    COALESCE(AVG(CASE WHEN reputation_count > 0 THEN reputation_score END), 0) as avg_score
                FROM agents
            """)
        ).fetchone()

    total_agents = count_result or 0
    agents_scanned = scanned_result or 0
    agents_with_feedbacks = feedback_result or 0
    total_feedbacks = int(rep_stats[0]) if rep_stats else 0
    avg_reputation_score = round(float(rep_stats[1]), 1) if rep_stats and rep_stats[1] else 0

    # Get top 20 scanned agents quickly
    if network:
        scanned_agents = db.query(Agent).filter(
            Agent.endpoint_status.isnot(None),
            Agent.network_id == network
        ).order_by(Agent.reputation_count.desc()).limit(20).all()
    else:
        scanned_agents = db.query(Agent).filter(
            Agent.endpoint_status.isnot(None)
        ).order_by(Agent.reputation_count.desc()).limit(20).all()

    # Get top agents by reputation (regardless of endpoint status)
    if network:
        top_reputation_agents = db.query(Agent).filter(
            Agent.reputation_count > 0,
            Agent.network_id == network
        ).order_by(desc(Agent.reputation_count)).limit(10).all()
    else:
        top_reputation_agents = db.query(Agent).filter(
            Agent.reputation_count > 0
        ).order_by(desc(Agent.reputation_count)).limit(10).all()

    # Calculate stats
    agents_with_working = 0
    total_endpoints = 0
    healthy_endpoints = 0
    working_list = []

    for agent in scanned_agents:
        if agent.endpoint_status:
            status = agent.endpoint_status
            total_endpoints += status.get("total_endpoints", 0)
            healthy_endpoints += status.get("healthy_endpoints", 0)
            if status.get("has_working_endpoints"):
                agents_with_working += 1
                working_list.append(agent)

    return {
        "summary": {
            "total_agents": total_agents,
            "agents_scanned": agents_scanned,
            "agents_with_working_endpoints": agents_with_working,
            "agents_with_feedbacks": agents_with_feedbacks,
            "total_endpoints": total_endpoints,
            "healthy_endpoints": healthy_endpoints,
            "endpoint_health_rate": (
                round(healthy_endpoints / total_endpoints * 100, 1)
                if total_endpoints > 0
                else 0
            ),
            # Reputation stats
            "total_feedbacks": total_feedbacks,
            "avg_reputation_score": avg_reputation_score,
        },
        "working_agents": [
            {
                "agent_id": a.id,
                "agent_name": a.name,
                "token_id": a.token_id,
                "network_key": a.network_id,
                "reputation_score": a.reputation_score,
                "reputation_count": a.reputation_count,
                "has_working_endpoints": True,
                "total_endpoints": a.endpoint_status.get("total_endpoints", 0) if a.endpoint_status else 0,
                "healthy_endpoints": a.endpoint_status.get("healthy_endpoints", 0) if a.endpoint_status else 0,
                "endpoints": a.endpoint_status.get("endpoints", []) if a.endpoint_status else [],
                "checked_at": a.endpoint_status.get("checked_at") if a.endpoint_status else None,
            }
            for a in working_list
        ],
        # Top agents by reputation count
        "top_reputation_agents": [
            {
                "agent_id": a.id,
                "agent_name": a.name,
                "token_id": a.token_id,
                "network_key": a.network_id,
                "reputation_score": a.reputation_score,
                "reputation_count": a.reputation_count,
                "has_working_endpoints": (
                    a.endpoint_status.get("has_working_endpoints", False)
                    if a.endpoint_status else False
                ),
            }
            for a in top_reputation_agents
        ],
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get(
    "/endpoint-health/summary",
    response_model=EndpointHealthSummaryResponse,
)
async def get_endpoint_health_summary(
    network: str = Query(None, description="Filter by network key (e.g., 'sepolia')"),
    limit: int = Query(20, ge=1, le=100, description="Limit agents to check"),
):
    """
    Get summary report of endpoint health across agents.

    WARNING: This endpoint performs real-time HTTP checks and can be slow.
    Use /endpoint-health/quick-stats for fast database-only statistics.
    Use /endpoint-health/stream for real-time streaming results.
    """
    service = get_endpoint_health_service()

    # Only check limited number of agents for faster response
    reports = await service.check_all_agents(
        network_key=network,
        only_with_endpoints=False,
        include_feedbacks=True,
        limit=limit,
    )

    working = [r for r in reports if r.has_working_endpoints]
    total_endpoints = sum(r.total_endpoints for r in reports)
    healthy_endpoints = sum(r.healthy_endpoints for r in reports)

    result = {
        "summary": {
            "total_agents": len(reports),
            "agents_with_endpoints": sum(1 for r in reports if r.total_endpoints > 0),
            "agents_with_working_endpoints": len(working),
            "agents_with_feedbacks": sum(1 for r in reports if r.reputation_count > 0),
            "total_endpoints": total_endpoints,
            "healthy_endpoints": healthy_endpoints,
            "endpoint_health_rate": (
                round(healthy_endpoints / total_endpoints * 100, 1)
                if total_endpoints > 0
                else 0
            ),
        },
        "working_agents": [r.to_dict() for r in working[:20]],
        "generated_at": datetime.utcnow().isoformat(),
    }

    return EndpointHealthSummaryResponse(
        summary=result["summary"],
        working_agents=result["working_agents"],
        generated_at=result["generated_at"],
    )


@router.get(
    "/endpoint-health/full-report",
    response_model=EndpointHealthFullResponse,
)
async def get_full_endpoint_health_report(
    network: str = Query(None, description="Filter by network key"),
    limit: int = Query(None, ge=1, le=500, description="Limit number of agents"),
):
    """
    Get full endpoint health report for all agents.

    Warning: This endpoint may be slow for large numbers of agents.
    Use the summary endpoint for quick overview.
    """
    service = get_endpoint_health_service()
    result = await service.generate_summary_report(network_key=network)

    return EndpointHealthFullResponse(
        summary=result["summary"],
        working_agents=result["working_agents"],
        all_reports=result["all_reports"][:limit] if limit else result["all_reports"],
        generated_at=result["generated_at"],
    )


@router.get("/endpoint-health/scan-stream")
async def stream_endpoint_scan(
    network: str = Query(None, description="Filter by network key"),
    limit: int = Query(None, ge=1, le=1000, description="Limit agents to scan"),
    force: bool = Query(False, description="Re-scan already checked agents"),
):
    """
    Start endpoint scan and stream progress in real-time.

    Results are saved to database as they complete.
    Use this for the frontend scan button.
    """
    from src.db.migrate_add_endpoint_status import migrate

    def update_scan_state(**kwargs):
        """Thread-safe update of scan state."""
        with _scan_state_lock:
            _scan_state.update(kwargs)

    async def generate():
        # Run migration first
        migrate()

        db = SessionLocal()
        try:
            query = db.query(Agent)

            if network:
                query = query.filter(Agent.network_id == network)

            if not force:
                query = query.filter(Agent.endpoint_checked_at.is_(None))

            if limit:
                query = query.limit(limit)

            agents = query.all()
            total = len(agents)

            if total == 0:
                update_scan_state(is_scanning=False)
                yield f"data: {json.dumps({'type': 'complete', 'total': 0, 'checked': 0, 'working': 0, 'message': 'No agents to scan'})}\n\n"
                return

            # Initialize scan state
            update_scan_state(
                is_scanning=True,
                checked=0,
                total=total,
                working=0,
                current_agent=None,
                started_at=datetime.utcnow().isoformat(),
                network=network,
            )

            yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"

            service = get_endpoint_health_service()
            checked = 0
            working = 0

            for agent in agents:
                try:
                    # Update current agent being scanned
                    update_scan_state(current_agent=agent.name)

                    report = await service.check_agent_endpoints(agent, include_feedbacks=False)

                    # Save to database
                    endpoint_status = {
                        "endpoints": [ep.to_dict() for ep in report.endpoints],
                        "has_working_endpoints": report.has_working_endpoints,
                        "total_endpoints": report.total_endpoints,
                        "healthy_endpoints": report.healthy_endpoints,
                        "checked_at": datetime.utcnow().isoformat(),
                    }
                    agent.endpoint_status = endpoint_status
                    agent.endpoint_checked_at = datetime.utcnow()
                    db.commit()

                    checked += 1
                    if report.has_working_endpoints:
                        working += 1

                    # Update global state
                    update_scan_state(checked=checked, working=working)

                    yield f"data: {json.dumps({'type': 'progress', 'checked': checked, 'total': total, 'working': working, 'agent_name': agent.name, 'has_working': report.has_working_endpoints})}\n\n"

                except Exception as e:
                    checked += 1
                    update_scan_state(checked=checked)
                    yield f"data: {json.dumps({'type': 'error', 'checked': checked, 'total': total, 'agent_name': agent.name, 'error': str(e)[:100]})}\n\n"

                await asyncio.sleep(0.05)

            # Mark scan as complete
            update_scan_state(is_scanning=False, current_agent=None)
            yield f"data: {json.dumps({'type': 'complete', 'total': total, 'checked': checked, 'working': working})}\n\n"

        finally:
            db.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/endpoint-health/working-agents")
async def get_working_agents(
    network: str = Query(None, description="Filter by network key"),
    min_reputation: int = Query(0, ge=0, description="Minimum reputation count"),
    limit: int = Query(20, ge=1, le=100, description="Maximum agents to return"),
):
    """
    Get agents with working endpoints, sorted by activity.

    Quick endpoint to find active, reachable agents.
    """
    service = get_endpoint_health_service()
    reports = await service.check_all_agents(
        network_key=network, only_with_endpoints=True, include_feedbacks=True
    )

    # Filter and sort
    working = [r for r in reports if r.has_working_endpoints]
    if min_reputation > 0:
        working = [r for r in working if r.reputation_count >= min_reputation]

    working.sort(key=lambda x: (-x.reputation_count, -x.reputation_score))

    return {
        "total_working": len(working),
        "agents": [r.to_dict() for r in working[:limit]],
    }
