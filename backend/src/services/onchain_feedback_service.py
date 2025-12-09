"""On-Chain Feedback Service

Fallback service for querying feedback events directly from the blockchain
when Subgraph data is unavailable (e.g., for agents not indexed by the Subgraph).
"""

import asyncio
from typing import Optional
from datetime import datetime
import structlog
from web3 import Web3

from src.core.reputation_config import (
    REPUTATION_REGISTRY_ADDRESS,
    REPUTATION_REGISTRY_ABI,
    REPUTATION_START_BLOCK,
)
from src.core.blockchain_config import SEPOLIA_RPC_URL

logger = structlog.get_logger(__name__)

# Batch size for scanning blocks (to avoid timeout)
BLOCKS_PER_BATCH = 50000


class OnChainFeedbackService:
    """Service for querying feedback directly from blockchain events"""

    def __init__(self):
        """Initialize the on-chain feedback service"""
        self.w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_URL))
        self.contract = self.w3.eth.contract(
            address=REPUTATION_REGISTRY_ADDRESS,
            abi=REPUTATION_REGISTRY_ABI
        )
        logger.info("onchain_feedback_service_initialized")

    async def get_agent_feedbacks(
        self,
        token_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        """
        Get feedback history for an agent from on-chain events.

        Args:
            token_id: The agent's token ID
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dict with feedbacks list and pagination info
        """
        try:
            # Get all NewFeedback events for this agent
            feedbacks = await self._fetch_feedback_events(token_id)

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

    async def _fetch_feedback_events(self, token_id: int) -> list[dict]:
        """Fetch all NewFeedback events for an agent"""
        feedbacks = []

        # Get current block (block_number is a property, not a method)
        current_block = self.w3.eth.block_number
        from_block = REPUTATION_START_BLOCK

        logger.info(
            "onchain_feedback_scan_started",
            token_id=token_id,
            from_block=from_block,
            to_block=current_block
        )

        # Scan in batches
        while from_block <= current_block:
            to_block = min(from_block + BLOCKS_PER_BATCH - 1, current_block)

            try:
                # Note: Web3.py uses from_block/to_block (snake_case), not fromBlock/toBlock
                events = await asyncio.to_thread(
                    self.contract.events.NewFeedback.get_logs,
                    from_block=from_block,
                    to_block=to_block,
                    argument_filters={"agentId": token_id}
                )

                for event in events:
                    feedback = self._parse_feedback_event(event)
                    feedbacks.append(feedback)

            except Exception as e:
                logger.warning(
                    "onchain_feedback_batch_error",
                    token_id=token_id,
                    from_block=from_block,
                    to_block=to_block,
                    error=str(e)
                )

            from_block = to_block + 1

        logger.info(
            "onchain_feedback_scan_completed",
            token_id=token_id,
            feedback_count=len(feedbacks)
        )

        return feedbacks

    def _parse_feedback_event(self, event) -> dict:
        """Parse a NewFeedback event into our response format"""
        args = event["args"]
        block_number = event["blockNumber"]
        tx_hash = event["transactionHash"].hex()

        # Convert bytes32 tags to string
        tag1 = self._bytes32_to_string(args.get("tag1"))
        tag2 = self._bytes32_to_string(args.get("tag2"))

        # Create unique ID from block + log index
        log_index = event.get("logIndex", 0)
        feedback_id = f"{block_number}-{log_index}"

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
