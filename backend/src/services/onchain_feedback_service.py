"""On-Chain Feedback Service

Fallback service for querying feedback events directly from the blockchain
when Subgraph data is unavailable (e.g., for agents not indexed by the Subgraph).

Supports multiple networks: Sepolia, Base Sepolia, Linea Sepolia, etc.

Updated: Jan 2026 - Uses raw log parsing to handle ABI signature mismatch
"""

import asyncio
from typing import Optional
import structlog
from web3 import Web3
from eth_abi import decode

from src.core.networks_config import get_network

logger = structlog.get_logger(__name__)

# Batch size for scanning blocks (reduced to avoid RPC limits)
BLOCKS_PER_BATCH = 5000

# NewFeedback event topic (Jan 2026 mainnet freeze)
# NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32)
# Note: has indexedTag1 (string indexed) AND tag1 (string) = 2 string params for tag1
NEWFEEDBACK_TOPIC = "0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc"


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

    def _get_reputation_address(self, network_key: str) -> Optional[str]:
        """Get reputation contract address for a network"""
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

        return reputation_address

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
        """Fetch all NewFeedback events for an agent using raw log parsing.

        Uses raw eth_getLogs instead of ABI-based event parsing to handle
        signature mismatches between our ABI and the actual on-chain contract.
        """
        feedbacks = []

        network = get_network(network_key)
        if not network:
            logger.error("network_not_found", network_key=network_key)
            return feedbacks

        w3 = self._get_web3(network_key)
        reputation_address = self._get_reputation_address(network_key)

        if not w3 or not reputation_address:
            logger.error(
                "web3_or_contract_not_available",
                network_key=network_key
            )
            return feedbacks

        # Get current block and start block
        current_block = w3.eth.block_number
        from_block = network.get("start_block", 0)

        # Encode agentId as bytes32 for topic filter
        agent_id_topic = "0x" + token_id.to_bytes(32, "big").hex()

        logger.info(
            "onchain_feedback_scan_started",
            token_id=token_id,
            network_key=network_key,
            from_block=from_block,
            to_block=current_block
        )

        # Scan in batches using raw logs
        while from_block <= current_block:
            to_block = min(from_block + BLOCKS_PER_BATCH - 1, current_block)

            try:
                # Use raw eth_getLogs with topic filters
                logs = await asyncio.to_thread(
                    w3.eth.get_logs,
                    {
                        "address": reputation_address,
                        "fromBlock": from_block,
                        "toBlock": to_block,
                        "topics": [
                            NEWFEEDBACK_TOPIC,  # Event signature
                            agent_id_topic,      # indexed agentId
                        ]
                    }
                )

                for log in logs:
                    try:
                        feedback = self._parse_raw_feedback_log(log, network_key, w3)
                        if feedback:
                            feedbacks.append(feedback)
                    except Exception as parse_err:
                        logger.warning(
                            "feedback_log_parse_error",
                            block=log.get("blockNumber"),
                            error=str(parse_err)
                        )

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

    def _parse_raw_feedback_log(self, log, network_key: str, w3: Web3) -> dict:
        """Parse a raw NewFeedback log into our response format.

        Raw log structure (Jan 2026 mainnet freeze):
        - topics[0]: Event signature hash
        - topics[1]: indexed agentId (uint256)
        - topics[2]: indexed clientAddress (address)
        - topics[3]: indexed tag1 hash (keccak256 of string)
        - data: (uint64 feedbackIndex, int128 value, uint8 valueDecimals,
                 string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)
        """
        block_number = log["blockNumber"]
        tx_hash = "0x" + log["transactionHash"].hex()
        log_index = log.get("logIndex", 0)

        # Parse indexed parameters from topics
        topics = log["topics"]
        agent_id = int.from_bytes(topics[1], "big")
        client_address = Web3.to_checksum_address("0x" + topics[2].hex()[-40:])

        # Parse non-indexed parameters from data
        data = log["data"]
        if isinstance(data, str):
            data = bytes.fromhex(data[2:] if data.startswith("0x") else data)

        # Decode: Jan 2026 mainnet freeze format
        # (uint64, int128, uint8, string, string, string, string, bytes32)
        decoded = decode(
            ["uint64", "int128", "uint8", "string", "string", "string", "string", "bytes32"],
            data
        )

        feedback_index = decoded[0]
        value = decoded[1]           # int128: supports negative and large values
        value_decimals = decoded[2]  # uint8: 0-18 decimal places
        tag1 = decoded[3]
        tag2 = decoded[4]
        endpoint = decoded[5]
        feedback_uri = decoded[6]
        feedback_hash = decoded[7]

        # Convert to score for backward compatibility (0-100 range)
        score = value / (10 ** value_decimals) if value_decimals else value

        # Get block timestamp
        timestamp = None
        try:
            block = w3.eth.get_block(block_number)
            from datetime import datetime
            timestamp = datetime.utcfromtimestamp(block.timestamp).isoformat() + "Z"
        except Exception:
            pass

        feedback_id = f"{network_key}-{block_number}-{log_index}"

        return {
            "id": feedback_id,
            "score": score,  # Backward compatible: converted from value/valueDecimals
            "value": value,  # Jan 2026: raw int128 value
            "value_decimals": value_decimals,  # Jan 2026: decimal places
            "client_address": client_address,
            "feedback_index": feedback_index,
            "tag1": tag1 if tag1 else None,
            "tag2": tag2 if tag2 else None,
            "endpoint": endpoint if endpoint else None,
            "feedback_uri": feedback_uri if feedback_uri else None,
            "feedback_hash": "0x" + feedback_hash.hex() if feedback_hash else None,
            "is_revoked": False,
            "timestamp": timestamp,
            "block_number": block_number,
            "transaction_hash": tx_hash,
        }

    def _parse_tag(self, value) -> Optional[str]:
        """Parse tag value - handles both string (Jan 2026) and bytes32 (legacy) formats"""
        if not value:
            return None
        # New format: string
        if isinstance(value, str):
            return value if value else None
        # Legacy format: bytes32
        if isinstance(value, bytes):
            decoded = value.rstrip(b'\x00').decode('utf-8', errors='ignore')
            return decoded if decoded else None
        return None

    def _bytes32_to_string(self, value) -> Optional[str]:
        """Convert bytes32 to readable string (legacy, kept for compatibility)"""
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
