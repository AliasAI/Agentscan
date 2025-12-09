"""On-Chain Validation Service

Fallback service for querying validation events directly from the blockchain
when Subgraph data is unavailable (e.g., for networks not indexed by the Subgraph).

Supports multiple networks: Sepolia, Base Sepolia, Linea Sepolia, etc.
"""

import asyncio
from typing import Optional
import structlog
from web3 import Web3

from src.core.networks_config import get_network

logger = structlog.get_logger(__name__)

# Batch size for scanning blocks (to avoid timeout)
BLOCKS_PER_BATCH = 50000

# Validation Registry ABI (minimal, only needed events)
VALIDATION_REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "validatorAddress", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "requestUri", "type": "string"},
            {"indexed": True, "internalType": "bytes32", "name": "requestHash", "type": "bytes32"},
        ],
        "name": "ValidationRequest",
        "type": "event",
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "validatorAddress", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": True, "internalType": "bytes32", "name": "requestHash", "type": "bytes32"},
            {"indexed": False, "internalType": "uint8", "name": "response", "type": "uint8"},
            {"indexed": False, "internalType": "string", "name": "responseUri", "type": "string"},
            {"indexed": False, "internalType": "bytes32", "name": "tag", "type": "bytes32"},
        ],
        "name": "ValidationResponse",
        "type": "event",
    },
]


class OnChainValidationService:
    """Service for querying validations directly from blockchain events"""

    def __init__(self):
        """Initialize the on-chain validation service"""
        self._web3_clients: dict[str, Web3] = {}
        self._contracts: dict[str, any] = {}
        logger.info("onchain_validation_service_initialized")

    def _get_web3(self, network_key: str) -> Optional[Web3]:
        """Get or create Web3 client for a network"""
        if network_key in self._web3_clients:
            return self._web3_clients[network_key]

        network = get_network(network_key)
        if not network or not network.get("rpc_url"):
            logger.warning("network_not_configured", network_key=network_key)
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

        validation_address = network.get("contracts", {}).get("validation")
        if not validation_address:
            logger.warning(
                "validation_contract_not_configured",
                network_key=network_key,
            )
            return None

        w3 = self._get_web3(network_key)
        if not w3:
            return None

        contract = w3.eth.contract(
            address=validation_address, abi=VALIDATION_REGISTRY_ABI
        )
        self._contracts[network_key] = contract
        return contract

    async def get_agent_validations(
        self,
        token_id: int,
        network_key: str = "sepolia",
        page: int = 1,
        page_size: int = 10,
    ) -> dict:
        """
        Get validation history for an agent from on-chain events.

        Args:
            token_id: The agent's token ID
            network_key: Network identifier (sepolia, base-sepolia, etc.)
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Dict with validations list and pagination info
        """
        try:
            # Get all validation events for this agent
            validations = await self._fetch_validation_events(token_id, network_key)

            # Sort by block number descending (newest first)
            validations.sort(key=lambda x: x["block_number"], reverse=True)

            # Apply pagination
            total = len(validations)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated = validations[start_idx:end_idx]

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
                "onchain_validation_query_failed",
                token_id=token_id,
                network_key=network_key,
                error=str(e),
            )
            return {
                "items": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 1,
                "data_source": "on-chain",
            }

    async def _fetch_validation_events(
        self, token_id: int, network_key: str
    ) -> list[dict]:
        """Fetch all validation events for an agent from specified network"""
        network = get_network(network_key)
        if not network:
            logger.error("network_not_found", network_key=network_key)
            return []

        w3 = self._get_web3(network_key)
        contract = self._get_contract(network_key)

        if not w3 or not contract:
            logger.error(
                "web3_or_contract_not_available",
                network_key=network_key,
            )
            return []

        # Get current block and start block
        current_block = w3.eth.block_number
        from_block = network.get("start_block", 0)

        logger.info(
            "onchain_validation_scan_started",
            token_id=token_id,
            network_key=network_key,
            from_block=from_block,
            to_block=current_block,
        )

        # Fetch requests and responses separately
        requests = await self._fetch_requests(
            contract, token_id, from_block, current_block, network_key
        )
        responses = await self._fetch_responses(
            contract, token_id, from_block, current_block, network_key
        )

        # Merge requests and responses by requestHash
        validations = self._merge_requests_responses(requests, responses, network_key)

        logger.info(
            "onchain_validation_scan_completed",
            token_id=token_id,
            network_key=network_key,
            validation_count=len(validations),
        )

        return validations

    async def _fetch_requests(
        self, contract, token_id: int, from_block: int, to_block: int, network_key: str
    ) -> dict[str, dict]:
        """Fetch ValidationRequest events"""
        requests: dict[str, dict] = {}

        while from_block <= to_block:
            batch_to = min(from_block + BLOCKS_PER_BATCH - 1, to_block)

            try:
                events = await asyncio.to_thread(
                    contract.events.ValidationRequest.get_logs,
                    from_block=from_block,
                    to_block=batch_to,
                    argument_filters={"agentId": token_id},
                )

                for event in events:
                    args = event["args"]
                    request_hash = args.get("requestHash", b"").hex()
                    requests[request_hash] = {
                        "request_hash": "0x" + request_hash,
                        "request_uri": args.get("requestUri"),
                        "validator_address": args.get("validatorAddress", ""),
                        "block_number": event["blockNumber"],
                        "transaction_hash": event["transactionHash"].hex(),
                    }

            except Exception as e:
                logger.warning(
                    "onchain_validation_request_batch_error",
                    network_key=network_key,
                    from_block=from_block,
                    to_block=batch_to,
                    error=str(e),
                )

            from_block = batch_to + 1

        return requests

    async def _fetch_responses(
        self, contract, token_id: int, from_block: int, to_block: int, network_key: str
    ) -> dict[str, dict]:
        """Fetch ValidationResponse events"""
        responses: dict[str, dict] = {}

        while from_block <= to_block:
            batch_to = min(from_block + BLOCKS_PER_BATCH - 1, to_block)

            try:
                events = await asyncio.to_thread(
                    contract.events.ValidationResponse.get_logs,
                    from_block=from_block,
                    to_block=batch_to,
                    argument_filters={"agentId": token_id},
                )

                for event in events:
                    args = event["args"]
                    request_hash = args.get("requestHash", b"").hex()
                    # Use latest response for each request_hash
                    responses[request_hash] = {
                        "response": args.get("response"),
                        "response_uri": args.get("responseUri"),
                        "response_hash": None,
                        "tag": self._bytes32_to_string(args.get("tag")),
                        "completed_block": event["blockNumber"],
                    }

            except Exception as e:
                logger.warning(
                    "onchain_validation_response_batch_error",
                    network_key=network_key,
                    from_block=from_block,
                    to_block=batch_to,
                    error=str(e),
                )

            from_block = batch_to + 1

        return responses

    def _merge_requests_responses(
        self, requests: dict, responses: dict, network_key: str
    ) -> list[dict]:
        """Merge request and response data into validation records"""
        validations = []

        for req_hash, req_data in requests.items():
            resp_data = responses.get(req_hash, {})

            # Determine status
            if resp_data:
                status = "COMPLETED"
            else:
                status = "PENDING"

            validation_id = f"{network_key}-{req_data['block_number']}-{req_hash[:8]}"

            validations.append(
                {
                    "id": validation_id,
                    "request_hash": req_data["request_hash"],
                    "request_uri": req_data.get("request_uri"),
                    "validator_address": req_data["validator_address"],
                    "response": resp_data.get("response"),
                    "response_uri": resp_data.get("response_uri"),
                    "response_hash": resp_data.get("response_hash"),
                    "tag": resp_data.get("tag"),
                    "status": status,
                    "requested_at": None,  # Would need block timestamp
                    "completed_at": None,
                    "block_number": req_data["block_number"],
                    "transaction_hash": req_data["transaction_hash"],
                }
            )

        return validations

    def _bytes32_to_string(self, value) -> Optional[str]:
        """Convert bytes32 to readable string"""
        if not value:
            return None
        if isinstance(value, bytes):
            # Check if all zeros
            if all(b == 0 for b in value):
                return None
            # Remove trailing null bytes and decode
            decoded = value.rstrip(b"\x00").decode("utf-8", errors="ignore")
            return decoded if decoded else None
        return None


# Singleton instance
_onchain_validation_service: Optional[OnChainValidationService] = None


def get_onchain_validation_service() -> OnChainValidationService:
    """Get singleton instance of OnChainValidationService"""
    global _onchain_validation_service
    if _onchain_validation_service is None:
        _onchain_validation_service = OnChainValidationService()
    return _onchain_validation_service
