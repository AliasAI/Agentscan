"""Analytics API - Transaction and activity statistics"""

import time
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, cast, Float, text
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent, Activity, ActivityType, Feedback, Network
from src.core.networks_config import get_enabled_networks


router = APIRouter()

# --- Cache (2-min TTL, keyed by (days, network)) ---
_ANALYTICS_CACHE_TTL = 120  # seconds
_analytics_cache: dict[str, dict] = {}


class TransactionStats(BaseModel):
    """Transaction statistics"""
    total_transactions: int
    total_agents_with_tx: int
    # Quality metrics
    active_agents: int  # Agents with reputation or working endpoints
    agents_with_reputation: int
    agents_with_working_endpoints: int
    quality_rate: float  # Percentage of truly active agents
    transactions_by_type: dict[str, int]
    avg_tx_per_agent: float
    total_gas_used: int
    total_fees_wei: int
    total_fees_eth: float
    avg_fee_per_tx_eth: float


class RecentActivityItem(BaseModel):
    """Recent on-chain activity item"""
    id: str
    agent_id: str
    agent_name: str
    token_id: Optional[int]
    network_key: str
    activity_type: str
    description: str
    tx_hash: Optional[str]
    created_at: str


class TxTrendData(BaseModel):
    """Transaction trend data point"""
    date: str
    total: int
    registered: int
    reputation_update: int
    validation_complete: int


class NetworkTxStats(BaseModel):
    """Network-level transaction statistics"""
    network_key: str
    network_name: str
    total_transactions: int
    total_agents: int
    avg_tx_per_agent: float


class AnalyticsResponse(BaseModel):
    """Analytics overview response"""
    stats: TransactionStats
    recent_activities: list[RecentActivityItem]
    trend_data: list[TxTrendData]
    network_stats: list[NetworkTxStats]


@router.get("/analytics/overview", response_model=AnalyticsResponse)
async def get_analytics_overview(
    days: int = Query(default=30, ge=1, le=365, description="Number of days for trend"),
    limit: int = Query(default=10, ge=1, le=100, description="Top agents limit"),
    network: Optional[str] = Query(default=None, description="Filter by network key"),
    db: Session = Depends(get_db),
):
    """Get comprehensive analytics overview including transaction stats and trends"""

    # Check cache
    cache_key = f"{days}:{network or '__all__'}"
    entry = _analytics_cache.get(cache_key)
    if entry and (time.time() - entry["ts"]) < _ANALYTICS_CACHE_TTL:
        return entry["data"]

    # Build base query with network filter
    activity_query = db.query(Activity)
    agent_query = db.query(Agent)

    if network:
        # Filter by network
        agent_ids = db.query(Agent.id).filter(Agent.network_id == network).subquery()
        activity_query = activity_query.filter(Activity.agent_id.in_(agent_ids))
        agent_query = agent_query.filter(Agent.network_id == network)

    # 1. Overall transaction stats
    total_transactions = activity_query.count()

    # Count agents with at least one transaction
    total_agents_with_tx = (
        db.query(func.count(func.distinct(Activity.agent_id)))
        .select_from(Activity)
        .scalar()
    ) or 0

    # Transactions by type
    tx_by_type = (
        activity_query
        .with_entities(
            Activity.activity_type,
            func.count(Activity.id).label('count')
        )
        .group_by(Activity.activity_type)
        .all()
    )

    transactions_by_type = {
        tx_type.value: count for tx_type, count in tx_by_type
    }

    # Average transactions per agent
    total_agents = agent_query.count()
    avg_tx_per_agent = total_transactions / total_agents if total_agents > 0 else 0

    # Quality metrics — single combined query instead of 4 separate COUNTs
    quality_sql = """
        SELECT
            SUM(CASE WHEN reputation_count > 0 THEN 1 ELSE 0 END),
            SUM(CASE WHEN endpoint_status IS NOT NULL
                 AND json_extract(endpoint_status, '$.has_working_endpoints') = 1
                 THEN 1 ELSE 0 END),
            SUM(CASE WHEN reputation_count > 0
                 OR (endpoint_status IS NOT NULL
                     AND json_extract(endpoint_status, '$.has_working_endpoints') = 1)
                 THEN 1 ELSE 0 END)
        FROM agents
    """
    params = {}
    if network:
        quality_sql += " WHERE network_id = :network"
        params["network"] = network

    qrow = db.execute(text(quality_sql), params).first()
    agents_with_reputation = qrow[0] or 0
    agents_with_working = qrow[1] or 0
    active_agents = qrow[2] or 0

    quality_rate = round((active_agents / total_agents * 100), 2) if total_agents > 0 else 0

    # Calculate gas and fee statistics
    # Use CAST to REAL to avoid integer overflow in SQLite
    fee_stats = (
        activity_query
        .with_entities(
            func.sum(cast(Activity.gas_used, Float)).label('total_gas'),
            func.sum(cast(Activity.transaction_fee, Float)).label('total_fees')
        )
        .first()
    )

    total_gas_used = int(fee_stats.total_gas) if fee_stats.total_gas else 0
    total_fees_wei = int(fee_stats.total_fees) if fee_stats.total_fees else 0
    total_fees_eth = total_fees_wei / 1e18  # Convert wei to ETH
    avg_fee_per_tx_eth = total_fees_eth / total_transactions if total_transactions > 0 else 0

    stats = TransactionStats(
        total_transactions=total_transactions,
        total_agents_with_tx=total_agents_with_tx,
        active_agents=active_agents,
        agents_with_reputation=agents_with_reputation,
        agents_with_working_endpoints=agents_with_working,
        quality_rate=quality_rate,
        transactions_by_type=transactions_by_type,
        avg_tx_per_agent=round(avg_tx_per_agent, 2),
        total_gas_used=total_gas_used,
        total_fees_wei=total_fees_wei,
        total_fees_eth=round(total_fees_eth, 6),
        avg_fee_per_tx_eth=round(avg_fee_per_tx_eth, 8)
    )

    # 2. Recent activities
    recent_query = (
        db.query(Activity, Agent.name, Agent.token_id, Agent.network_id)
        .join(Agent, Activity.agent_id == Agent.id)
    )

    if network:
        recent_query = recent_query.filter(Agent.network_id == network)

    recent_query = recent_query.order_by(Activity.created_at.desc()).limit(limit)

    recent_activities = [
        RecentActivityItem(
            id=activity.id,
            agent_id=activity.agent_id,
            agent_name=agent_name or "Unknown Agent",
            token_id=token_id,
            network_key=network_id or "",
            activity_type=activity.activity_type.value,
            description=activity.description,
            tx_hash=activity.tx_hash,
            created_at=activity.created_at.isoformat(),
        )
        for activity, agent_name, token_id, network_id in recent_query.all()
    ]

    # 3. Transaction trend over time
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    trend_results = (
        activity_query
        .filter(Activity.created_at >= start_date)
        .with_entities(
            func.date(Activity.created_at).label('date'),
            func.count(Activity.id).label('total'),
            func.sum(case((Activity.activity_type == ActivityType.REGISTERED, 1), else_=0)).label('registered'),
            func.sum(case((Activity.activity_type == ActivityType.REPUTATION_UPDATE, 1), else_=0)).label('reputation'),
            func.sum(case((Activity.activity_type == ActivityType.VALIDATION_COMPLETE, 1), else_=0)).label('validation')
        )
        .group_by(func.date(Activity.created_at))
        .order_by(func.date(Activity.created_at))
        .all()
    )

    # Build complete date range (fill missing dates with zeros)
    date_counts = {row.date: row for row in trend_results}
    trend_data = []
    current_date = start_date.date()
    end_date_only = end_date.date()

    while current_date <= end_date_only:
        date_str = current_date.strftime('%Y-%m-%d')
        row = date_counts.get(date_str)

        trend_data.append(TxTrendData(
            date=date_str,
            total=row.total if row else 0,
            registered=row.registered if row else 0,
            reputation_update=row.reputation if row else 0,
            validation_complete=row.validation if row else 0
        ))
        current_date += timedelta(days=1)

    # 4. Network-level statistics — two fast indexed queries instead of OUTERJOIN
    agent_counts = dict(
        db.query(Agent.network_id, func.count(Agent.id))
        .group_by(Agent.network_id)
        .all()
    )

    tx_counts = dict(
        db.query(Agent.network_id, func.count(Activity.id))
        .join(Activity, Agent.id == Activity.agent_id)
        .group_by(Agent.network_id)
        .all()
    )

    enabled_networks = get_enabled_networks()

    network_stats = []
    for net_key, agent_count in agent_counts.items():
        network_config = enabled_networks.get(net_key)
        if not network_config:
            continue

        tx_count = tx_counts.get(net_key, 0)
        network_stats.append(NetworkTxStats(
            network_key=net_key,
            network_name=network_config.get('name', net_key),
            total_transactions=tx_count,
            total_agents=agent_count,
            avg_tx_per_agent=round(tx_count / agent_count, 2) if agent_count > 0 else 0
        ))

    result = AnalyticsResponse(
        stats=stats,
        recent_activities=recent_activities,
        trend_data=trend_data,
        network_stats=network_stats
    )
    _analytics_cache[cache_key] = {"ts": time.time(), "data": result}
    return result


@router.get("/analytics/agent/{agent_id}/transactions")
async def get_agent_transaction_details(
    agent_id: str,
    db: Session = Depends(get_db),
):
    """Get detailed transaction breakdown for a specific agent"""

    # Get agent
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return {"error": "Agent not found"}

    # Get all activities for this agent
    activities = (
        db.query(Activity)
        .filter(Activity.agent_id == agent_id)
        .order_by(Activity.created_at.desc())
        .all()
    )

    # Group by type
    tx_by_type = {}
    for activity in activities:
        tx_type = activity.activity_type.value
        if tx_type not in tx_by_type:
            tx_by_type[tx_type] = []
        tx_by_type[tx_type].append({
            "id": activity.id,
            "description": activity.description,
            "tx_hash": activity.tx_hash,
            "created_at": activity.created_at.isoformat()
        })

    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "total_transactions": len(activities),
        "transactions_by_type": tx_by_type,
        "first_activity": activities[-1].created_at.isoformat() if activities else None,
        "latest_activity": activities[0].created_at.isoformat() if activities else None
    }
