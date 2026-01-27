"""On-Chain Reader Service

Direct on-chain reads using contract view functions.
No block scanning - O(n) RPC calls where n = data count.

This is used as fallback when database cache is empty.
Returns basic info only (no feedbackURI, timestamp, etc.)

Updated: Jan 27, 2026 - ERC-8004 mainnet freeze: score → value/valueDecimals
"""

from typing import Optional
from web3 import Web3
from eth_abi import decode
import structlog

from src.core.networks_config import get_network

logger = structlog.get_logger(__name__)


class OnChainReader:
    """Service for reading data directly from contract view functions."""

    def __init__(self):
        self._web3_clients: dict[str, Web3] = {}

    def _get_web3(self, network_key: str) -> Optional[Web3]:
        """Get or create Web3 client for a network."""
        if network_key in self._web3_clients:
            return self._web3_clients[network_key]

        network = get_network(network_key)
        if not network or not network.get("rpc_url"):
            return None

        w3 = Web3(Web3.HTTPProvider(network["rpc_url"]))
        self._web3_clients[network_key] = w3
        return w3

    def _call_contract(
        self, w3: Web3, address: str, func_sig: str,
        types_in: list, args: list, types_out: list
    ):
        """Call a contract view function and decode result."""
        selector = w3.keccak(text=func_sig)[:4]
        params = w3.codec.encode(types_in, args) if args else b''
        result = w3.eth.call({"to": address, "data": selector + params})
        return decode(types_out, result)

    def get_feedback_summary(
        self, token_id: int, network_key: str = "sepolia"
    ) -> dict:
        """Get feedback summary using getSummary view function.

        Jan 27, 2026 mainnet freeze:
        - Returns (count, averageValue, valueDecimals)
        - clientAddresses MUST NOT be empty (use getClients first)
        """
        network = get_network(network_key)
        if not network:
            return {"count": 0, "average_score": 0}

        w3 = self._get_web3(network_key)
        reputation_address = network.get("contracts", {}).get("reputation")
        if not w3 or not reputation_address:
            return {"count": 0, "average_score": 0}

        try:
            # First get all clients (required for getSummary)
            clients = self._call_contract(
                w3, reputation_address,
                "getClients(uint256)",
                ["uint256"], [token_id],
                ["address[]"]
            )[0]

            if not clients:
                return {"count": 0, "average_score": 0}

            # Jan 2026 mainnet: getSummary requires non-empty clientAddresses
            count, avg_value, value_decimals = self._call_contract(
                w3, reputation_address,
                "getSummary(uint256,address[],string,string)",
                ["uint256", "address[]", "string", "string"],
                [token_id, clients, "", ""],  # Pass actual clients, not empty array
                ["uint64", "int128", "uint8"]
            )
            # Convert to float score for compatibility
            actual_value = avg_value / (10 ** value_decimals) if value_decimals else avg_value
            return {"count": int(count), "average_score": float(actual_value)}
        except Exception as e:
            logger.warning("get_summary_failed", token_id=token_id, error=str(e))
            return {"count": 0, "average_score": 0}

    def get_feedbacks(
        self, token_id: int, network_key: str = "sepolia",
        page: int = 1, page_size: int = 10
    ) -> dict:
        """Get feedbacks using view functions (basic info only).

        Jan 27, 2026: Returns value/value_decimals instead of score

        Returns:
            Dict with items, total, page info. Items only contain:
            - value, value_decimals, tag1, tag2, client_address
            - NO feedbackURI, timestamp, block_number (not available from view functions)
        """
        network = get_network(network_key)
        if not network:
            return self._empty_result(page, page_size)

        w3 = self._get_web3(network_key)
        reputation_address = network.get("contracts", {}).get("reputation")
        if not w3 or not reputation_address:
            return self._empty_result(page, page_size)

        try:
            # 1. Get all clients
            clients = self._call_contract(
                w3, reputation_address,
                "getClients(uint256)",
                ["uint256"], [token_id],
                ["address[]"]
            )[0]

            if not clients:
                return self._empty_result(page, page_size)

            # 2. Read all feedbacks from each client
            all_feedbacks = []
            for client in clients:
                index = 1
                while index <= 100:  # Safety limit per client
                    try:
                        selector = w3.keccak(text="readFeedback(uint256,address,uint64)")[:4]
                        params = w3.codec.encode(
                            ["uint256", "address", "uint64"],
                            [token_id, client, index]
                        )
                        result = w3.eth.call({
                            "to": reputation_address,
                            "data": selector + params
                        })

                        if len(result) < 64:
                            break

                        # Jan 2026 mainnet: readFeedback returns (value, valueDecimals, tag1, tag2, isRevoked)
                        value, value_decimals, tag1, tag2, is_revoked = decode(
                            ["int128", "uint8", "string", "string", "bool"], result
                        )
                        if value == 0 and not tag1:
                            break

                        # Skip revoked feedbacks in listing (or show them marked)
                        if is_revoked:
                            index += 1
                            continue

                        # Format display_value based on tag1
                        display_value = self._format_display_value(value, value_decimals, tag1)

                        all_feedbacks.append({
                            "id": f"onchain-{token_id}-{client[:10]}-{index}",
                            "value": value,
                            "value_decimals": value_decimals,
                            "display_value": display_value,
                            "client_address": client.lower(),
                            "feedback_index": index,
                            "tag1": tag1 if tag1 else None,
                            "tag2": tag2 if tag2 else None,
                            "endpoint": None,
                            "feedback_uri": None,  # Not available from view function
                            "feedback_hash": None,
                            "is_revoked": is_revoked,
                            "timestamp": None,  # Not available from view function
                            "block_number": None,
                            "transaction_hash": None,
                        })
                        index += 1
                    except Exception:
                        break

            # 3. Sort by feedback_index desc and paginate
            all_feedbacks.sort(key=lambda x: x["feedback_index"], reverse=True)
            total = len(all_feedbacks)
            start = (page - 1) * page_size
            end = start + page_size
            items = all_feedbacks[start:end]
            total_pages = (total + page_size - 1) // page_size if total > 0 else 1

            logger.info(
                "onchain_feedback_read",
                token_id=token_id,
                total=total,
                clients=len(clients)
            )

            return {
                "items": items,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
            }

        except Exception as e:
            logger.error("get_feedbacks_failed", token_id=token_id, error=str(e))
            return self._empty_result(page, page_size)

    def _format_display_value(
        self, value: int, value_decimals: int, tag1: Optional[str]
    ) -> str:
        """Format value for display based on tag1 type."""
        if value is None:
            return "N/A"

        actual = value / (10 ** value_decimals) if value_decimals else value
        tag = (tag1 or "").lower()

        if tag in ("uptime", "successrate"):
            return f"{actual:.{value_decimals}f}%"
        elif tag == "responsetime":
            return f"{int(actual)}ms"
        elif tag in ("reachable", "ownerverified"):
            return "Yes" if actual == 1 else "No"
        elif tag == "revenues":
            return f"${actual:,.0f}"
        elif tag == "tradingyield":
            sign = "+" if actual > 0 else ""
            return f"{sign}{actual:.{value_decimals}f}%"
        elif tag == "blocktimefreshness":
            return f"{int(actual)} blocks"
        elif tag == "starred":
            return f"{int(actual)}/100"
        else:
            if value_decimals > 0:
                return f"{actual:.{value_decimals}f}"
            return str(int(actual))

    def _empty_result(self, page: int, page_size: int) -> dict:
        return {
            "items": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 1,
        }


# Singleton instance
_onchain_reader: Optional[OnChainReader] = None


def get_onchain_reader() -> OnChainReader:
    """Get singleton instance of OnChainReader."""
    global _onchain_reader
    if _onchain_reader is None:
        _onchain_reader = OnChainReader()
    return _onchain_reader
