"""Analytics API - Transaction and activity statistics"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from src.db.database import get_db
from src.models import Agent, Activity, ActivityType, Feedback, Network
from src.core.networks_config import get_enabled_networks


router = APIRouter()


class TransactionStats(BaseModel):
    """Transaction statistics"""
    total_transactions: int
    total_agents_with_tx: int
    transactions_by_type: dict[str, int]
    avg_tx_per_agent: float
    total_gas_used: int
    total_fees_wei: int
    total_fees_eth: float
    avg_fee_per_tx_eth: float


class AgentTxRanking(BaseModel):
    """Agent transaction ranking"""
    agent_id: str
    agent_name: str
    token_id: Optional[int]
    network_key: str
    total_transactions: int
    registered_count: int
    reputation_update_count: int
    validation_count: int


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
    top_agents: list[AgentTxRanking]
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

    # Calculate gas and fee statistics
    fee_stats = (
        activity_query
        .with_entities(
            func.sum(Activity.gas_used).label('total_gas'),
            func.sum(Activity.transaction_fee).label('total_fees')
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
        transactions_by_type=transactions_by_type,
        avg_tx_per_agent=round(avg_tx_per_agent, 2),
        total_gas_used=total_gas_used,
        total_fees_wei=total_fees_wei,
        total_fees_eth=round(total_fees_eth, 6),
        avg_fee_per_tx_eth=round(avg_fee_per_tx_eth, 8)
    )

    # 2. Top agents by transaction count
    agent_tx_stats = (
        db.query(
            Agent.id,
            Agent.name,
            Agent.token_id,
            Agent.network_id,
            func.count(Activity.id).label('total_tx'),
            func.sum(case((Activity.activity_type == ActivityType.REGISTERED, 1), else_=0)).label('registered'),
            func.sum(case((Activity.activity_type == ActivityType.REPUTATION_UPDATE, 1), else_=0)).label('reputation'),
            func.sum(case((Activity.activity_type == ActivityType.VALIDATION_COMPLETE, 1), else_=0)).label('validation')
        )
        .join(Activity, Agent.id == Activity.agent_id)
        .group_by(Agent.id, Agent.name, Agent.token_id, Agent.network_id)
        .order_by(func.count(Activity.id).desc())
        .limit(limit)
        .all()
    )

    top_agents = [
        AgentTxRanking(
            agent_id=row.id,
            agent_name=row.name,
            token_id=row.token_id,
            network_key=row.network_id,
            total_transactions=row.total_tx,
            registered_count=row.registered or 0,
            reputation_update_count=row.reputation or 0,
            validation_count=row.validation or 0
        )
        for row in agent_tx_stats
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

    # 4. Network-level statistics
    network_stats_results = (
        db.query(
            Agent.network_id,
            func.count(func.distinct(Agent.id)).label('agent_count'),
            func.count(Activity.id).label('tx_count')
        )
        .outerjoin(Activity, Agent.id == Activity.agent_id)
        .group_by(Agent.network_id)
        .all()
    )

    # Get network names
    enabled_networks = get_enabled_networks()

    network_stats = []
    for row in network_stats_results:
        network_config = enabled_networks.get(row.network_id)
        if not network_config:
            continue

        network_stats.append(NetworkTxStats(
            network_key=row.network_id,
            network_name=network_config.get('name', row.network_id),
            total_transactions=row.tx_count or 0,
            total_agents=row.agent_count or 0,
            avg_tx_per_agent=round((row.tx_count or 0) / row.agent_count, 2) if row.agent_count > 0 else 0
        ))

    return AnalyticsResponse(
        stats=stats,
        top_agents=top_agents,
        trend_data=trend_data,
        network_stats=network_stats
    )


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
