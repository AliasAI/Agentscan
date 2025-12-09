"""On-Chain Feedback Service

Fallback service for querying feedback events directly from the blockchain
when Subgraph data is unavailable (e.g., for agents not indexed by the Subgraph).

Supports multiple networks: Sepolia, Base Sepolia, Linea Sepolia, etc.
"""

import asyncio
from typing import Optional
import structlog
from web3 import Web3

from src.core.networks_config import get_network
from src.core.reputation_config import REPUTATION_REGISTRY_ABI

logger = structlog.get_logger(__name__)

# Batch size for scanning blocks (to avoid timeout)
BLOCKS_PER_BATCH = 50000


class OnChainFeedbackService:
    """Service for querying feedback directly from blockchain events"""

    def __init__(self):
        """Initialize the on-chain feedback service"""
        self._web3_clients: dict[str, Web3] = {}
        self._contracts: dict[str, any] = {}
        logger.info("onchain_feedback_service_initialized")

    def _get_web3(self, network_key: str) -> Optional[Web3]:
        """Get or create Web3 client for a network"""
        if network_key in self._web3_clients:
            return self._web3_clients[network_key]

        network = get_network(network_key)
        if not network or not network.get("rpc_url"):
            logger.warning(
                "network_not_configured",
                network_key=network_key
            )
            return None

        w3 = Web3(Web3.HTTPProvider(network["rpc_url"]))
        self._web3_clients[network_key] = w3
        return w3

    def _get_contract(self, network_key: str):
        """Get or create contract instance for a network"""
        if network_key in self._contracts:
            return self._contracts[network_key]

        network = get_network(network_key)
        if not network:
            return None

        reputation_address = network.get("contracts", {}).get("reputation")
        if not reputation_address:
            logger.warning(
                "reputation_contract_not_configured",
                network_key=network_key
            )
            return None

        w3 = self._get_web3(network_key)
        if not w3:
            return None

        contract = w3.eth.contract(
            address=reputation_address,
            abi=REPUTATION_REGISTRY_ABI
        )
        self._contracts[network_key] = contract
        return contract

    async def get_agent_feedbacks(
        self,
        token_id: int,
        network_key: str = "sepolia",
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        """
        Get feedback history for an agent from on-chain events.

        Args:
            token_id: The agent's token ID
            network_key: Network identifier (sepolia, base-sepolia, etc.)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dict with feedbacks list and pagination info
        """
        try:
            # Get all NewFeedback events for this agent
            feedbacks = await self._fetch_feedback_events(token_id, network_key)

            # Sort by block number descending (newest first)
            feedbacks.sort(key=lambda x: x["block_number"], reverse=True)

            # Apply pagination
            total = len(feedbacks)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated = feedbacks[start_idx:end_idx]

            total_pages = (total + page_size - 1) // page_size if total > 0 else 1

            return {
                "items": paginated,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "data_source": "on-chain",
            }

        except Exception as e:
            logger.error(
                "onchain_feedback_query_failed",
                token_id=token_id,
                network_key=network_key,
                error=str(e)
            )
            return {
                "items": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 1,
                "data_source": "on-chain",
            }

    async def _fetch_feedback_events(
        self,
        token_id: int,
        network_key: str
    ) -> list[dict]:
        """Fetch all NewFeedback events for an agent from specified network"""
        feedbacks = []

        network = get_network(network_key)
        if not network:
            logger.error("network_not_found", network_key=network_key)
            return feedbacks

        w3 = self._get_web3(network_key)
        contract = self._get_contract(network_key)

        if not w3 or not contract:
            logger.error(
                "web3_or_contract_not_available",
                network_key=network_key
            )
            return feedbacks

        # Get current block and start block
        current_block = w3.eth.block_number
        from_block = network.get("start_block", 0)

        logger.info(
            "onchain_feedback_scan_started",
            token_id=token_id,
            network_key=network_key,
            from_block=from_block,
            to_block=current_block
        )

        # Scan in batches
        while from_block <= current_block:
            to_block = min(from_block + BLOCKS_PER_BATCH - 1, current_block)

            try:
                events = await asyncio.to_thread(
                    contract.events.NewFeedback.get_logs,
                    from_block=from_block,
                    to_block=to_block,
                    argument_filters={"agentId": token_id}
                )

                for event in events:
                    feedback = self._parse_feedback_event(event, network_key)
                    feedbacks.append(feedback)

            except Exception as e:
                logger.warning(
                    "onchain_feedback_batch_error",
                    token_id=token_id,
                    network_key=network_key,
                    from_block=from_block,
                    to_block=to_block,
                    error=str(e)
                )

            from_block = to_block + 1

        logger.info(
            "onchain_feedback_scan_completed",
            token_id=token_id,
            network_key=network_key,
            feedback_count=len(feedbacks)
        )

        return feedbacks

    def _parse_feedback_event(self, event, network_key: str) -> dict:
        """Parse a NewFeedback event into our response format"""
        args = event["args"]
        block_number = event["blockNumber"]
        tx_hash = event["transactionHash"].hex()

        # Convert bytes32 tags to string
        tag1 = self._bytes32_to_string(args.get("tag1"))
        tag2 = self._bytes32_to_string(args.get("tag2"))

        # Create unique ID from network + block + log index
        log_index = event.get("logIndex", 0)
        feedback_id = f"{network_key}-{block_number}-{log_index}"

        return {
            "id": feedback_id,
            "score": args.get("score", 0),
            "client_address": args.get("clientAddress", ""),
            "tag1": tag1,
            "tag2": tag2,
            "feedback_uri": args.get("feedbackUri"),
            "feedback_hash": self._bytes32_to_hex(args.get("feedbackHash")),
            "is_revoked": False,  # We'd need to check FeedbackRevoked events
            "timestamp": None,  # Block timestamp would require additional call
            "block_number": block_number,
            "transaction_hash": tx_hash,
        }

    def _bytes32_to_string(self, value) -> Optional[str]:
        """Convert bytes32 to readable string"""
        if not value:
            return None
        if isinstance(value, bytes):
            # Remove trailing null bytes and decode
            decoded = value.rstrip(b'\x00').decode('utf-8', errors='ignore')
            return decoded if decoded else None
        return None

    def _bytes32_to_hex(self, value) -> Optional[str]:
        """Convert bytes32 to hex string"""
        if not value:
            return None
        if isinstance(value, bytes):
            return "0x" + value.hex()
        return None


# Singleton instance
_onchain_service: Optional[OnChainFeedbackService] = None


def get_onchain_feedback_service() -> OnChainFeedbackService:
    """Get singleton instance of OnChainFeedbackService"""
    global _onchain_service
    if _onchain_service is None:
        _onchain_service = OnChainFeedbackService()
    return _onchain_service
