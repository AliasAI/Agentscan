"""Subgraph Service

This service queries the Agent0 Subgraph for feedback and validation data.
Uses the agent0-sdk for simplified access to the deployed subgraph.
"""

from typing import Optional
from datetime import datetime
import structlog
import httpx

logger = structlog.get_logger(__name__)

# Subgraph endpoints for different networks (The Graph Gateway)
# Reference: https://sdk.ag0.xyz/4-subgraph/4-1-intro/
SUBGRAPH_URLS = {
    "sepolia": "https://gateway.thegraph.com/api/00a452ad3cd1900273ea62c1bf283f93/subgraphs/id/6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT",
    # base-sepolia, bsc-testnet, etc. coming soon per SDK docs
}

# Networks that have subgraph support
SUPPORTED_NETWORKS = set(SUBGRAPH_URLS.keys())

# Chain IDs mapping
CHAIN_IDS = {
    "sepolia": 11155111,
    "base-sepolia": 84532,
}


class SubgraphService:
    """Service for querying Agent0 Subgraph data"""

    def __init__(self):
        """Initialize the subgraph service"""
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info("subgraph_service_initialized")

    def is_network_supported(self, network: str) -> bool:
        """Check if a network has subgraph support"""
        return network in SUPPORTED_NETWORKS

    def get_supported_networks(self) -> list[str]:
        """Get list of networks with subgraph support"""
        return list(SUPPORTED_NETWORKS)

    async def _query_subgraph(
        self, network: str, query: str, variables: dict
    ) -> dict:
        """Execute a GraphQL query against the subgraph"""
        url = SUBGRAPH_URLS.get(network)
        if not url:
            logger.warning("unknown_network", network=network)
            return {"data": None}

        try:
            response = await self.client.post(
                url,
                json={"query": query, "variables": variables},
            )
            response.raise_for_status()
            result = response.json()
            if result.get("errors"):
                logger.warning(
                    "subgraph_query_errors",
                    network=network,
                    errors=result.get("errors"),
                )
            return result
        except httpx.HTTPError as e:
            logger.error("subgraph_query_failed", network=network, error=str(e))
            return {"data": None}

    async def get_agent_feedbacks(
        self,
        token_id: int,
        network: str = "sepolia",
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        """
        Get feedback history for an agent from the subgraph.

        Args:
            token_id: The agent's token ID
            network: Network identifier (sepolia, base-sepolia)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dict with feedbacks list and pagination info
        """
        chain_id = CHAIN_IDS.get(network, 11155111)
        agent_id = f"{chain_id}:{token_id}"
        skip = (page - 1) * page_size

        # Note: Field names match Agent0 Subgraph schema
        # - createdAt (not timestamp)
        # - No blockNumber/transactionHash in current schema
        query = """
        query GetAgentFeedbacks($agentId: String!, $first: Int!, $skip: Int!) {
            feedbacks(
                where: { agent: $agentId }
                orderBy: createdAt
                orderDirection: desc
                first: $first
                skip: $skip
            ) {
                id
                score
                clientAddress
                tag1
                tag2
                feedbackUri
                feedbackHash
                isRevoked
                createdAt
            }
        }
        """

        variables = {
            "agentId": agent_id,
            "first": page_size,
            "skip": skip,
        }

        result = await self._query_subgraph(network, query, variables)
        data = result.get("data") or {}

        feedbacks = data.get("feedbacks") or []
        # Calculate total from returned feedbacks (subgraph doesn't have feedbackCount on agent)
        total = len(feedbacks) if page == 1 else (page - 1) * page_size + len(feedbacks)

        # Transform feedbacks to our format
        items = []
        for fb in feedbacks:
            items.append({
                "id": fb.get("id"),
                "score": fb.get("score", 0),
                "client_address": fb.get("clientAddress"),
                "tag1": self._bytes32_to_string(fb.get("tag1")),
                "tag2": self._bytes32_to_string(fb.get("tag2")),
                "feedback_uri": fb.get("feedbackUri"),
                "feedback_hash": fb.get("feedbackHash"),
                "is_revoked": fb.get("isRevoked", False),
                "timestamp": self._parse_timestamp(fb.get("createdAt")),
                "block_number": None,
                "transaction_hash": None,
            })

        # Estimate total pages (we don't have exact count from subgraph)
        has_more = len(feedbacks) == page_size
        total_pages = page + 1 if has_more else page

        return {
            "items": items,
            "total": total if not has_more else total + 1,  # Indicate there might be more
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_agent_validations(
        self,
        token_id: int,
        network: str = "sepolia",
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        """
        Get validation history for an agent from the subgraph.

        Args:
            token_id: The agent's token ID
            network: Network identifier (sepolia, base-sepolia)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dict with validations list and pagination info
        """
        chain_id = CHAIN_IDS.get(network, 11155111)
        agent_id = f"{chain_id}:{token_id}"
        skip = (page - 1) * page_size

        # Note: Field names match Agent0 Subgraph schema
        # - createdAt/updatedAt (not requestedAt/completedAt)
        # - agent field accepts agent ID string directly
        # - Agent type doesn't have validationCount, we estimate from returned results
        query = """
        query GetAgentValidations($agentId: String!, $first: Int!, $skip: Int!) {
            validations(
                where: { agent: $agentId }
                orderBy: createdAt
                orderDirection: desc
                first: $first
                skip: $skip
            ) {
                id
                requestHash
                requestUri
                validatorAddress
                response
                responseUri
                responseHash
                tag
                status
                createdAt
                updatedAt
            }
        }
        """

        variables = {
            "agentId": agent_id,
            "first": page_size,
            "skip": skip,
        }

        result = await self._query_subgraph(network, query, variables)
        data = result.get("data") or {}

        validations = data.get("validations") or []
        # Estimate total from returned validations (no validationCount field on Agent)
        total = len(validations) if page == 1 else (page - 1) * page_size + len(validations)

        # Transform validations to our format
        items = []
        for val in validations:
            items.append({
                "id": val.get("id"),
                "request_hash": val.get("requestHash"),
                "request_uri": val.get("requestUri"),
                "validator_address": val.get("validatorAddress"),
                "response": val.get("response"),
                "response_uri": val.get("responseUri"),
                "response_hash": val.get("responseHash"),
                "tag": self._bytes32_to_string(val.get("tag")),
                "status": val.get("status", "PENDING"),
                "requested_at": self._parse_timestamp(val.get("createdAt")),
                "completed_at": self._parse_timestamp(val.get("updatedAt")),
            })

        # Estimate total pages (we don't have exact count from subgraph)
        has_more = len(validations) == page_size
        total_pages = page + 1 if has_more else page

        return {
            "items": items,
            "total": total if not has_more else total + 1,  # Indicate there might be more
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    async def get_reputation_summary(
        self, token_id: int, network: str = "sepolia"
    ) -> dict:
        """
        Get reputation summary for an agent.

        Args:
            token_id: The agent's token ID
            network: Network identifier

        Returns:
            Dict with average score and feedback count
        """
        chain_id = CHAIN_IDS.get(network, 11155111)
        agent_id = f"{chain_id}:{token_id}"

        query = """
        query GetReputationSummary($agentId: String!) {
            agent(id: $agentId) {
                feedbackCount
                averageScore
                validationCount
            }
        }
        """

        result = await self._query_subgraph(network, query, {"agentId": agent_id})
        data = result.get("data") or {}
        agent_data = data.get("agent") or {}

        return {
            "feedback_count": agent_data.get("feedbackCount", 0),
            "average_score": agent_data.get("averageScore", 0),
            "validation_count": agent_data.get("validationCount", 0),
        }

    def _bytes32_to_string(self, value: Optional[str]) -> Optional[str]:
        """
        Process bytes32 tag value from subgraph.

        The subgraph returns bytes32 as decoded binary strings (not hex).
        Per ERC-8004, tags are bytes32 hashes for on-chain filtering.

        Strategy:
        - If value is all zeros or empty, return None
        - If value contains only printable ASCII, return as-is (human-readable tag)
        - Otherwise, convert to hex format for display (0x...)
        """
        if not value:
            return None

        # Check if it's a hex string format (0x...)
        if value.startswith("0x"):
            # Check for all zeros
            if value == "0x" + "0" * 64:
                return None
            # Return truncated hex for display
            return value[:10] + "..." + value[-6:] if len(value) > 20 else value

        # Subgraph returns decoded binary - check if it's all null bytes
        if all(c == "\x00" for c in value):
            return None

        # Check if the string is human-readable (printable ASCII only)
        # Valid printable ASCII range: 0x20 (space) to 0x7E (~)
        is_readable = all(0x20 <= ord(c) <= 0x7E for c in value.rstrip("\x00"))

        if is_readable:
            return value.rstrip("\x00")

        # Not readable - convert to hex format for display
        try:
            hex_value = "0x" + value.encode("latin-1").hex()
            # Truncate for display if too long
            if len(hex_value) > 20:
                return hex_value[:10] + "..." + hex_value[-6:]
            return hex_value
        except (UnicodeEncodeError, ValueError):
            # Fallback: return None for unprocessable values
            return None

    def _parse_timestamp(self, value: Optional[str]) -> Optional[str]:
        """Parse Unix timestamp to ISO format"""
        if not value:
            return None
        try:
            ts = int(value)
            return datetime.utcfromtimestamp(ts).isoformat() + "Z"
        except (ValueError, TypeError):
            return value

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_subgraph_service: Optional[SubgraphService] = None


def get_subgraph_service() -> SubgraphService:
    """Get or create the subgraph service singleton"""
    global _subgraph_service
    if _subgraph_service is None:
        _subgraph_service = SubgraphService()
    return _subgraph_service
