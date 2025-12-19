"""Endpoint Health Check Service

This service checks if agent endpoints are reachable and collects
recent feedback/reputation data for analysis.
"""

import asyncio
import json
import base64
from datetime import datetime
from typing import Optional
from urllib.parse import unquote

import httpx
import structlog

from src.db.database import SessionLocal
from src.models import Agent, Network
from src.services.subgraph_service import get_subgraph_service
from src.services.onchain_feedback_service import get_onchain_feedback_service

logger = structlog.get_logger(__name__)

# Configuration
HEALTH_CHECK_TIMEOUT = 5  # seconds (reduced from 10 for faster scanning)
METADATA_FETCH_TIMEOUT = 5  # seconds for metadata fetch
MAX_CONCURRENT_ENDPOINTS = 5  # concurrent endpoint checks per agent
MAX_CONCURRENT_AGENTS = 30  # concurrent agent scans
BATCH_SIZE = 50  # agents per batch for progress reporting
IPFS_GATEWAY = "https://ipfs.io/ipfs/"


class EndpointInfo:
    """Parsed endpoint information"""

    def __init__(
        self,
        url: str,
        method: str = "GET",
        name: Optional[str] = None,
        description: Optional[str] = None,
    ):
        self.url = url
        self.method = method
        self.name = name or url
        self.description = description


class EndpointHealthResult:
    """Health check result for a single endpoint"""

    def __init__(
        self,
        url: str,
        is_healthy: bool,
        status_code: Optional[int] = None,
        response_time_ms: Optional[float] = None,
        error: Optional[str] = None,
        checked_at: Optional[datetime] = None,
    ):
        self.url = url
        self.is_healthy = is_healthy
        self.status_code = status_code
        self.response_time_ms = response_time_ms
        self.error = error
        self.checked_at = checked_at or datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "is_healthy": self.is_healthy,
            "status_code": self.status_code,
            "response_time_ms": self.response_time_ms,
            "error": self.error,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None,
        }


class AgentEndpointReport:
    """Complete endpoint health report for an agent"""

    def __init__(
        self,
        agent_id: str,
        agent_name: str,
        token_id: Optional[int],
        network_key: str,
        endpoints: list[EndpointHealthResult],
        recent_feedbacks: list[dict],
        reputation_score: float,
        reputation_count: int,
        metadata_uri: Optional[str] = None,
    ):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.token_id = token_id
        self.network_key = network_key
        self.endpoints = endpoints
        self.recent_feedbacks = recent_feedbacks
        self.reputation_score = reputation_score
        self.reputation_count = reputation_count
        self.metadata_uri = metadata_uri
        self.has_working_endpoints = any(e.is_healthy for e in endpoints)
        self.total_endpoints = len(endpoints)
        self.healthy_endpoints = sum(1 for e in endpoints if e.is_healthy)

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "token_id": self.token_id,
            "network_key": self.network_key,
            "metadata_uri": self.metadata_uri,
            "has_working_endpoints": self.has_working_endpoints,
            "total_endpoints": self.total_endpoints,
            "healthy_endpoints": self.healthy_endpoints,
            "endpoints": [e.to_dict() for e in self.endpoints],
            "recent_feedbacks": self.recent_feedbacks,
            "reputation_score": self.reputation_score,
            "reputation_count": self.reputation_count,
        }


class EndpointHealthService:
    """Service for checking agent endpoint health"""

    def __init__(self):
        self.subgraph = get_subgraph_service()

    async def _fetch_metadata(self, uri: str) -> dict:
        """Fetch and parse metadata from URI"""
        if not uri or uri.strip() == "":
            return {}

        # Handle direct JSON string
        if uri.startswith("{") or uri.startswith("["):
            try:
                metadata = json.loads(uri)
                if isinstance(metadata, list) and len(metadata) > 0:
                    metadata = metadata[0]
                return metadata if isinstance(metadata, dict) else {}
            except Exception:
                return {}

        # Handle data URI
        if uri.startswith("data:"):
            try:
                if "base64," in uri:
                    base64_data = uri.split("base64,")[1]
                    json_data = base64.b64decode(base64_data).decode("utf-8")
                    metadata = json.loads(json_data)
                elif "," in uri:
                    json_data = uri.split(",", 1)[1]
                    json_data = unquote(json_data)
                    metadata = json.loads(json_data)
                else:
                    return {}

                if isinstance(metadata, list) and len(metadata) > 0:
                    metadata = metadata[0]
                return metadata if isinstance(metadata, dict) else {}
            except Exception:
                return {}

        # Handle IPFS URI
        if uri.startswith("ipfs://"):
            url = f"{IPFS_GATEWAY}{uri[7:]}"
        else:
            url = uri

        # Fetch from HTTP/HTTPS URL
        try:
            async with httpx.AsyncClient(timeout=METADATA_FETCH_TIMEOUT) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    data = data[0]
                return data if isinstance(data, dict) else {}
        except Exception as e:
            logger.debug("metadata_fetch_failed", url=url, error=str(e))
            return {}

    def _extract_endpoints(self, metadata: dict) -> list[EndpointInfo]:
        """Extract endpoint URLs from metadata"""
        endpoints = []

        # Standard OASF format: endpoints array
        if "endpoints" in metadata and isinstance(metadata["endpoints"], list):
            for ep in metadata["endpoints"]:
                if isinstance(ep, dict):
                    url = ep.get("url") or ep.get("uri") or ep.get("endpoint")
                    if url and isinstance(url, str):
                        endpoints.append(
                            EndpointInfo(
                                url=url,
                                method=ep.get("method", "GET"),
                                name=ep.get("name"),
                                description=ep.get("description"),
                            )
                        )

        # Alternative format: single endpoint field
        if "endpoint" in metadata and isinstance(metadata["endpoint"], str):
            endpoints.append(EndpointInfo(url=metadata["endpoint"]))

        # Alternative format: api_url field
        if "api_url" in metadata and isinstance(metadata["api_url"], str):
            endpoints.append(EndpointInfo(url=metadata["api_url"], name="API"))

        # Alternative format: url field
        if "url" in metadata and isinstance(metadata["url"], str):
            url = metadata["url"]
            # Skip if it's a metadata/info URL (not an actual endpoint)
            if not url.endswith(".json"):
                endpoints.append(EndpointInfo(url=url))

        return endpoints

    async def _check_endpoint_health(self, endpoint: EndpointInfo) -> EndpointHealthResult:
        """Check if an endpoint is reachable"""
        start_time = datetime.utcnow()

        try:
            async with httpx.AsyncClient(timeout=HEALTH_CHECK_TIMEOUT) as client:
                if endpoint.method.upper() == "POST":
                    # For POST endpoints, send an empty or minimal request
                    response = await client.post(endpoint.url, json={})
                else:
                    response = await client.get(endpoint.url)

                end_time = datetime.utcnow()
                response_time_ms = (end_time - start_time).total_seconds() * 1000

                # Consider 2xx, 3xx, and some 4xx as "reachable"
                # 400/422 might mean the endpoint exists but expects parameters
                is_healthy = response.status_code < 500

                return EndpointHealthResult(
                    url=endpoint.url,
                    is_healthy=is_healthy,
                    status_code=response.status_code,
                    response_time_ms=round(response_time_ms, 2),
                    checked_at=end_time,
                )

        except httpx.TimeoutException:
            return EndpointHealthResult(
                url=endpoint.url,
                is_healthy=False,
                error="Connection timeout",
                checked_at=datetime.utcnow(),
            )
        except httpx.ConnectError as e:
            return EndpointHealthResult(
                url=endpoint.url,
                is_healthy=False,
                error=f"Connection failed: {str(e)[:100]}",
                checked_at=datetime.utcnow(),
            )
        except Exception as e:
            return EndpointHealthResult(
                url=endpoint.url,
                is_healthy=False,
                error=str(e)[:100],
                checked_at=datetime.utcnow(),
            )

    async def _get_recent_feedbacks(
        self, token_id: int, network_key: str, limit: int = 5
    ) -> list[dict]:
        """Get recent feedbacks for an agent"""
        try:
            # Try subgraph first
            if self.subgraph.is_network_supported(network_key):
                result = await self.subgraph.get_agent_feedbacks(
                    token_id=token_id, network=network_key, page=1, page_size=limit
                )
                return result.get("items", [])

            # Fallback to on-chain
            onchain_service = get_onchain_feedback_service()
            result = await onchain_service.get_agent_feedbacks(
                token_id=token_id, network_key=network_key, page=1, page_size=limit
            )
            return result.get("items", [])

        except Exception as e:
            logger.debug(
                "feedback_fetch_failed",
                token_id=token_id,
                network_key=network_key,
                error=str(e),
            )
            return []

    async def check_agent_endpoints(
        self, agent: Agent, include_feedbacks: bool = True
    ) -> AgentEndpointReport:
        """Check all endpoints for a single agent"""
        network_key = agent.network.id if agent.network else "sepolia"

        # Fetch and parse metadata
        metadata = await self._fetch_metadata(agent.metadata_uri)
        endpoints_info = self._extract_endpoints(metadata)

        # Check endpoint health
        endpoint_results = []
        if endpoints_info:
            # Check endpoints with concurrency limit
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_ENDPOINTS)

            async def check_with_semaphore(ep: EndpointInfo) -> EndpointHealthResult:
                async with semaphore:
                    return await self._check_endpoint_health(ep)

            endpoint_results = await asyncio.gather(
                *[check_with_semaphore(ep) for ep in endpoints_info]
            )

        # Get recent feedbacks
        recent_feedbacks = []
        if include_feedbacks and agent.token_id is not None:
            recent_feedbacks = await self._get_recent_feedbacks(
                token_id=agent.token_id, network_key=network_key
            )

        return AgentEndpointReport(
            agent_id=agent.id,
            agent_name=agent.name,
            token_id=agent.token_id,
            network_key=network_key,
            endpoints=list(endpoint_results),
            recent_feedbacks=recent_feedbacks,
            reputation_score=agent.reputation_score or 0.0,
            reputation_count=agent.reputation_count or 0,
            metadata_uri=agent.metadata_uri,
        )

    async def check_all_agents(
        self,
        network_key: Optional[str] = None,
        only_with_endpoints: bool = False,
        include_feedbacks: bool = True,
        limit: Optional[int] = None,
    ) -> list[AgentEndpointReport]:
        """Check endpoints for all agents"""
        db = SessionLocal()
        try:
            query = db.query(Agent)

            if network_key:
                query = query.filter(Agent.network_id == network_key)

            if limit:
                query = query.limit(limit)

            agents = query.all()

            reports = []
            for agent in agents:
                report = await self.check_agent_endpoints(
                    agent, include_feedbacks=include_feedbacks
                )

                # Filter out agents without endpoints if requested
                if only_with_endpoints and report.total_endpoints == 0:
                    continue

                reports.append(report)

            return reports

        finally:
            db.close()

    async def generate_summary_report(
        self, network_key: Optional[str] = None
    ) -> dict:
        """Generate a summary report of all agent endpoints"""
        reports = await self.check_all_agents(
            network_key=network_key, include_feedbacks=True
        )

        total_agents = len(reports)
        agents_with_endpoints = sum(1 for r in reports if r.total_endpoints > 0)
        agents_with_working_endpoints = sum(
            1 for r in reports if r.has_working_endpoints
        )
        agents_with_feedbacks = sum(1 for r in reports if r.reputation_count > 0)

        total_endpoints = sum(r.total_endpoints for r in reports)
        healthy_endpoints = sum(r.healthy_endpoints for r in reports)

        # Sort by working endpoints and reputation
        working_agents = [r for r in reports if r.has_working_endpoints]
        working_agents.sort(key=lambda x: (-x.reputation_count, -x.reputation_score))

        return {
            "summary": {
                "total_agents": total_agents,
                "agents_with_endpoints": agents_with_endpoints,
                "agents_with_working_endpoints": agents_with_working_endpoints,
                "agents_with_feedbacks": agents_with_feedbacks,
                "total_endpoints": total_endpoints,
                "healthy_endpoints": healthy_endpoints,
                "endpoint_health_rate": (
                    round(healthy_endpoints / total_endpoints * 100, 1)
                    if total_endpoints > 0
                    else 0
                ),
            },
            "working_agents": [r.to_dict() for r in working_agents[:20]],
            "all_reports": [r.to_dict() for r in reports],
            "generated_at": datetime.utcnow().isoformat(),
        }

    async def check_agent_fast(self, agent: Agent) -> dict:
        """Fast endpoint check for a single agent (no feedbacks, minimal data)"""
        try:
            # Skip agents without metadata
            if not agent.metadata_uri or agent.metadata_uri.strip() == "":
                return {
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "has_working_endpoints": False,
                    "total_endpoints": 0,
                    "healthy_endpoints": 0,
                    "endpoints": [],
                    "skipped": True,
                }

            # Fetch and parse metadata
            metadata = await self._fetch_metadata(agent.metadata_uri)
            endpoints_info = self._extract_endpoints(metadata)

            if not endpoints_info:
                return {
                    "agent_id": agent.id,
                    "agent_name": agent.name,
                    "has_working_endpoints": False,
                    "total_endpoints": 0,
                    "healthy_endpoints": 0,
                    "endpoints": [],
                    "skipped": False,
                }

            # Check endpoints concurrently
            semaphore = asyncio.Semaphore(MAX_CONCURRENT_ENDPOINTS)

            async def check_with_semaphore(ep: EndpointInfo) -> EndpointHealthResult:
                async with semaphore:
                    return await self._check_endpoint_health(ep)

            endpoint_results = await asyncio.gather(
                *[check_with_semaphore(ep) for ep in endpoints_info],
                return_exceptions=True
            )

            # Filter out exceptions
            valid_results = [
                r for r in endpoint_results
                if isinstance(r, EndpointHealthResult)
            ]

            has_working = any(r.is_healthy for r in valid_results)
            healthy_count = sum(1 for r in valid_results if r.is_healthy)

            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "has_working_endpoints": has_working,
                "total_endpoints": len(valid_results),
                "healthy_endpoints": healthy_count,
                "endpoints": [r.to_dict() for r in valid_results],
                "skipped": False,
            }

        except Exception as e:
            logger.debug("agent_check_failed", agent_id=agent.id, error=str(e))
            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "has_working_endpoints": False,
                "total_endpoints": 0,
                "healthy_endpoints": 0,
                "endpoints": [],
                "error": str(e)[:100],
                "skipped": False,
            }

    async def scan_agents_concurrent(
        self,
        agents: list[Agent],
        progress_callback=None,
    ) -> dict:
        """
        Scan multiple agents concurrently with progress reporting.

        Args:
            agents: List of Agent objects to scan
            progress_callback: Optional async callback(checked, total, working, agent_name)

        Returns:
            Summary dict with results
        """
        total = len(agents)
        if total == 0:
            return {"checked": 0, "total": 0, "working": 0, "results": []}

        # Use semaphore to limit concurrent agent scans
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_AGENTS)
        checked = 0
        working = 0
        results = []
        lock = asyncio.Lock()

        async def scan_one(agent: Agent) -> dict:
            nonlocal checked, working
            async with semaphore:
                result = await self.check_agent_fast(agent)

                async with lock:
                    checked += 1
                    if result.get("has_working_endpoints"):
                        working += 1
                    results.append(result)

                    # Report progress
                    if progress_callback:
                        await progress_callback(
                            checked, total, working, agent.name, result
                        )

                return result

        # Run all scans concurrently
        await asyncio.gather(
            *[scan_one(agent) for agent in agents],
            return_exceptions=True
        )

        return {
            "checked": checked,
            "total": total,
            "working": working,
            "results": results,
        }


# Singleton instance
_endpoint_health_service: Optional[EndpointHealthService] = None


def get_endpoint_health_service() -> EndpointHealthService:
    """Get singleton instance of EndpointHealthService"""
    global _endpoint_health_service
    if _endpoint_health_service is None:
        _endpoint_health_service = EndpointHealthService()
    return _endpoint_health_service
