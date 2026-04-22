"""Virtuals ACP discovery ingestion via the public search API."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

import httpx
import structlog

from src.db.database import SessionLocal
from src.models import (
    Agent,
    AgentActivitySnapshot,
    AgentCapability,
    AgentEcosystemLink,
    AgentStatus,
    IngestionRun,
    Network,
    SyncStatus,
)

logger = structlog.get_logger()


ACP_API_BASE_URL = "https://api.acp.virtuals.io"
ACP_DISCOVERY_ENDPOINT = "/agents/search"
VIRTUALS_ACP_NETWORK_ID = "virtuals-acp"
VIRTUALS_ACP_ECOSYSTEM = "virtuals_acp"
DEFAULT_QUERY_SEEDS = [
    "agent",
    "ai",
    "assistant",
    "data",
    "research",
    "trading",
    "market",
    "crypto",
    "image",
    "analysis",
]


class VirtualsAcpIngestionService:
    """Fetch ACP search results and map them into the local agent index."""

    def __init__(self) -> None:
        self.is_running = False
        self.last_error: str | None = None
        self.last_run_id: str | None = None

    async def run(
        self,
        queries: list[str] | None = None,
        top_k: int = 100,
    ) -> dict[str, Any]:
        """Run one ingestion cycle."""
        if self.is_running:
            raise RuntimeError("Virtuals ACP ingestion is already running")

        self.is_running = True
        self.last_error = None

        db = SessionLocal()
        run = IngestionRun(
            ecosystem_name=VIRTUALS_ACP_ECOSYSTEM,
            status="running",
            stats_json={"queries": queries or DEFAULT_QUERY_SEEDS, "top_k": top_k},
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        self.last_run_id = run.id

        stats = {
            "queries": queries or DEFAULT_QUERY_SEEDS,
            "top_k": top_k,
            "query_count": 0,
            "fetched_records": 0,
            "unique_external_agents": 0,
            "created_agents": 0,
            "updated_agents": 0,
            "created_links": 0,
            "updated_links": 0,
            "created_capabilities": 0,
            "updated_capabilities": 0,
            "activity_snapshots": 0,
        }

        try:
            network = self._ensure_virtuals_network(db)
            records = await self._fetch_union(queries or DEFAULT_QUERY_SEEDS, top_k)
            stats["query_count"] = len(queries or DEFAULT_QUERY_SEEDS)
            stats["fetched_records"] = sum(len(batch) for batch in records["raw_batches"])
            stats["unique_external_agents"] = len(records["agents"])

            for item in records["agents"].values():
                counters = self._upsert_agent_bundle(db, network.id, item)
                for key, value in counters.items():
                    stats[key] += value

            run.status = "completed"
            run.ended_at = datetime.utcnow()
            run.stats_json = stats
            db.commit()

            logger.info("virtuals_acp_ingestion_completed", **stats)
            return stats
        except Exception as exc:
            db.rollback()
            self.last_error = str(exc)
            run.status = "failed"
            run.ended_at = datetime.utcnow()
            run.error_log = str(exc)[:4000]
            run.stats_json = stats
            db.commit()
            logger.error("virtuals_acp_ingestion_failed", error=str(exc))
            raise
        finally:
            db.close()
            self.is_running = False

    def get_status(self) -> dict[str, Any]:
        """Return lightweight runtime status plus last persisted run."""
        db = SessionLocal()
        try:
            latest = (
                db.query(IngestionRun)
                .filter(IngestionRun.ecosystem_name == VIRTUALS_ACP_ECOSYSTEM)
                .order_by(IngestionRun.started_at.desc())
                .first()
            )
            return {
                "is_running": self.is_running,
                "last_error": self.last_error,
                "last_run_id": self.last_run_id,
                "latest_run": self._serialize_run(latest) if latest else None,
            }
        finally:
            db.close()

    async def _fetch_union(
        self,
        queries: list[str],
        top_k: int,
    ) -> dict[str, Any]:
        headers = {"Accept": "application/json", "User-Agent": "agentscan-ingestion/1.0"}
        unique_agents: dict[str, dict[str, Any]] = {}
        raw_batches: list[list[dict[str, Any]]] = []

        async with httpx.AsyncClient(
            base_url=ACP_API_BASE_URL,
            headers=headers,
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            for query in queries:
                query = query.strip()
                if not query:
                    continue

                response = await client.get(
                    ACP_DISCOVERY_ENDPOINT,
                    params={"query": query, "topK": top_k},
                )
                response.raise_for_status()
                payload = response.json()
                batch = payload.get("data", []) or []
                raw_batches.append(batch)

                for item in batch:
                    external_id = item.get("id")
                    if not external_id:
                        continue
                    if external_id in unique_agents:
                        unique_agents[external_id] = self._merge_search_records(
                            unique_agents[external_id], item
                        )
                    else:
                        unique_agents[external_id] = item

                await asyncio.sleep(0.1)

        return {"agents": unique_agents, "raw_batches": raw_batches}

    def _upsert_agent_bundle(
        self,
        db,
        network_id: str,
        item: dict[str, Any],
    ) -> dict[str, int]:
        counters = {
            "created_agents": 0,
            "updated_agents": 0,
            "created_links": 0,
            "updated_links": 0,
            "created_capabilities": 0,
            "updated_capabilities": 0,
            "activity_snapshots": 0,
        }

        external_id = item["id"]
        wallet_address = (item.get("walletAddress") or "").lower()
        agent = self._find_existing_agent(db, external_id, network_id, wallet_address)
        if agent is None:
            agent = Agent(
                name=item.get("name") or "Unknown ACP Agent",
                address=wallet_address or external_id,
                description=item.get("description") or "Virtuals ACP agent",
                reputation_score=float(item.get("rating") or 0.0),
                status=AgentStatus.ACTIVE,
                network_id=network_id,
                owner_address=wallet_address or None,
                on_chain_data=self._build_agent_payload(item),
                last_synced_at=datetime.utcnow(),
                sync_status=SyncStatus.SYNCED,
                is_active=not bool(item.get("isHidden")),
                metadata_refreshed_at=datetime.utcnow(),
                endpoint_status=self._build_endpoint_status(item),
            )
            db.add(agent)
            db.flush()
            counters["created_agents"] += 1
        else:
            agent.name = item.get("name") or agent.name
            agent.address = wallet_address or agent.address
            agent.description = item.get("description") or agent.description
            agent.reputation_score = float(item.get("rating") or 0.0)
            agent.owner_address = wallet_address or agent.owner_address
            agent.on_chain_data = self._build_agent_payload(item)
            agent.last_synced_at = datetime.utcnow()
            agent.sync_status = SyncStatus.SYNCED
            agent.is_active = not bool(item.get("isHidden"))
            agent.metadata_refreshed_at = datetime.utcnow()
            agent.endpoint_status = self._build_endpoint_status(item)
            counters["updated_agents"] += 1

        created_link, updated_link = self._upsert_ecosystem_link(db, agent, item)
        counters["created_links"] += int(created_link)
        counters["updated_links"] += int(updated_link)

        for capability_name, capability_value in self._extract_capabilities(item):
            created_cap, updated_cap = self._upsert_capability(
                db, agent, capability_name, capability_value
            )
            counters["created_capabilities"] += int(created_cap)
            counters["updated_capabilities"] += int(updated_cap)

        db.add(
            AgentActivitySnapshot(
                agent_id=agent.id,
                ecosystem_name=VIRTUALS_ACP_ECOSYSTEM,
                freshness=self._compute_freshness(item),
                snapshot_time=datetime.utcnow(),
            )
        )
        counters["activity_snapshots"] += 1
        db.flush()

        return counters

    def _find_existing_agent(self, db, external_id: str, network_id: str, wallet_address: str):
        link = (
            db.query(AgentEcosystemLink)
            .filter(
                AgentEcosystemLink.ecosystem_name == VIRTUALS_ACP_ECOSYSTEM,
                AgentEcosystemLink.external_id == external_id,
            )
            .first()
        )
        if link:
            return db.query(Agent).filter(Agent.id == link.agent_id).first()

        if wallet_address:
            return (
                db.query(Agent)
                .filter(
                    Agent.network_id == network_id,
                    Agent.address == wallet_address,
                )
                .first()
            )
        return None

    def _upsert_ecosystem_link(self, db, agent: Agent, item: dict[str, Any]) -> tuple[bool, bool]:
        link = (
            db.query(AgentEcosystemLink)
            .filter(
                AgentEcosystemLink.agent_id == agent.id,
                AgentEcosystemLink.ecosystem_name == VIRTUALS_ACP_ECOSYSTEM,
            )
            .first()
        )
        metadata = {
            "cluster": item.get("cluster"),
            "tag": item.get("tag"),
            "wallet_address": item.get("walletAddress"),
            "image_url": item.get("imageUrl"),
            "chains": item.get("chains", []),
            "offerings_count": len(item.get("offerings", []) or []),
            "resources_count": len(item.get("resources", []) or []),
            "last_active_at": item.get("lastActiveAt"),
            "updated_at": item.get("updatedAt"),
        }
        if link is None:
            db.add(
                AgentEcosystemLink(
                    agent_id=agent.id,
                    ecosystem_name=VIRTUALS_ACP_ECOSYSTEM,
                    source_url=None,
                    external_id=item.get("id"),
                    metadata_json=metadata,
                    confidence_score=0.85,
                )
            )
            return True, False

        link.external_id = item.get("id")
        link.metadata_json = metadata
        link.confidence_score = 0.85
        link.updated_at = datetime.utcnow()
        return False, True

    def _upsert_capability(
        self,
        db,
        agent: Agent,
        capability_name: str,
        capability_value: dict[str, Any],
    ) -> tuple[bool, bool]:
        capability = (
            db.query(AgentCapability)
            .filter(
                AgentCapability.agent_id == agent.id,
                AgentCapability.capability_name == capability_name,
            )
            .first()
        )
        if capability is None:
            db.add(
                AgentCapability(
                    agent_id=agent.id,
                    capability_name=capability_name,
                    value_json=capability_value,
                    source=VIRTUALS_ACP_ECOSYSTEM,
                    verified=True,
                )
            )
            return True, False

        capability.value_json = capability_value
        capability.source = VIRTUALS_ACP_ECOSYSTEM
        capability.verified = True
        capability.updated_at = datetime.utcnow()
        return False, True

    def _extract_capabilities(self, item: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
        offerings = item.get("offerings", []) or []
        resources = item.get("resources", []) or []
        chains = item.get("chains", []) or []

        capabilities = [
            (
                "acp",
                {
                    "offerings_count": len(offerings),
                    "resources_count": len(resources),
                    "chain_ids": sorted(
                        {
                            chain.get("chainId")
                            for chain in chains
                            if chain.get("chainId") is not None
                        }
                    ),
                    "cluster": item.get("cluster"),
                    "tag": item.get("tag"),
                },
            )
        ]

        if offerings:
            capabilities.append(
                (
                    "payable",
                    {
                        "payment_type": "acp_escrow",
                        "offerings_count": len(offerings),
                    },
                )
            )

        if resources:
            capabilities.append(
                (
                    "web",
                    {
                        "resource_count": len(resources),
                        "resource_urls": [
                            resource.get("url")
                            for resource in resources
                            if resource.get("url")
                        ][:10],
                    },
                )
            )

        return capabilities

    def _build_agent_payload(self, item: dict[str, Any]) -> dict[str, Any]:
        return {
            "source": VIRTUALS_ACP_ECOSYSTEM,
            "external_id": item.get("id"),
            "wallet_address": item.get("walletAddress"),
            "sol_wallet_address": item.get("solWalletAddress"),
            "cluster": item.get("cluster"),
            "tag": item.get("tag"),
            "image_url": item.get("imageUrl"),
            "chains": item.get("chains", []),
            "offerings": item.get("offerings", []),
            "resources": item.get("resources", []),
            "builder_code": item.get("builderCode"),
            "last_active_at": item.get("lastActiveAt"),
            "updated_at": item.get("updatedAt"),
        }

    def _build_endpoint_status(self, item: dict[str, Any]) -> dict[str, Any]:
        resources = item.get("resources", []) or []
        endpoints = [
            {
                "type": "web",
                "url": resource.get("url"),
                "name": resource.get("name"),
                "description": resource.get("description"),
            }
            for resource in resources
            if resource.get("url")
        ]
        return {
            "source": VIRTUALS_ACP_ECOSYSTEM,
            "endpoints": endpoints,
            "has_working_endpoints": bool(endpoints),
            "total_endpoints": len(endpoints),
            "healthy_endpoints": len(endpoints),
            "checked_at": datetime.utcnow().isoformat(),
        }

    def _compute_freshness(self, item: dict[str, Any]) -> float | None:
        candidate = item.get("lastActiveAt") or item.get("updatedAt")
        if not candidate:
            return None

        try:
            seen_at = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
        except ValueError:
            return None

        age_days = max(
            0.0,
            (datetime.now(timezone.utc) - seen_at.astimezone(timezone.utc)).total_seconds()
            / 86400,
        )
        return round(max(0.0, 1.0 - min(age_days, 30.0) / 30.0), 4)

    def _ensure_virtuals_network(self, db) -> Network:
        network = db.query(Network).filter(Network.id == VIRTUALS_ACP_NETWORK_ID).first()
        if network:
            return network

        network = Network(
            id=VIRTUALS_ACP_NETWORK_ID,
            name="Virtuals ACP",
            chain_id=0,
            rpc_url=ACP_API_BASE_URL,
            explorer_url="https://app.virtuals.io/acp",
            contracts=None,
        )
        db.add(network)
        db.commit()
        db.refresh(network)
        return network

    def _merge_search_records(
        self,
        current: dict[str, Any],
        incoming: dict[str, Any],
    ) -> dict[str, Any]:
        merged = dict(current)
        for key in [
            "name",
            "description",
            "imageUrl",
            "walletAddress",
            "solWalletAddress",
            "cluster",
            "tag",
            "lastActiveAt",
            "updatedAt",
            "builderCode",
        ]:
            if incoming.get(key):
                merged[key] = incoming[key]

        merged["offerings"] = self._merge_by_id(
            current.get("offerings", []), incoming.get("offerings", [])
        )
        merged["resources"] = self._merge_by_id(
            current.get("resources", []), incoming.get("resources", [])
        )
        merged["chains"] = self._merge_by_id(
            current.get("chains", []), incoming.get("chains", [])
        )
        return merged

    def _merge_by_id(
        self,
        left: list[dict[str, Any]],
        right: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for item in (left or []) + (right or []):
            key = str(item.get("id") or item.get("url") or item.get("name"))
            merged[key] = item
        return list(merged.values())

    def _serialize_run(self, run: IngestionRun | None) -> dict[str, Any] | None:
        if run is None:
            return None
        return {
            "id": run.id,
            "ecosystem_name": run.ecosystem_name,
            "status": run.status,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "ended_at": run.ended_at.isoformat() if run.ended_at else None,
            "stats": run.stats_json,
            "error_log": run.error_log,
        }


virtuals_acp_ingestion_service = VirtualsAcpIngestionService()
