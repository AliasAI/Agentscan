"""Multi-network configuration for ERC-8004"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


# === Shared contract addresses (CREATE2 deterministic deployment) ===
_MAINNET_CONTRACTS = {
    "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
}
_TESTNET_CONTRACTS = {
    "identity": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    "reputation": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
}


# === QuikNode multi-chain RPC ===
_QN_POOL = "twilight-ultra-road"
_QN_KEY = "3345a665f2ebd66c8a604714984ee0612448c28a"


def _qn(slug: str = "", suffix: str = "") -> str:
    """Build QuikNode endpoint URL from network slug"""
    host = f"{_QN_POOL}.{slug}.quiknode.pro" if slug else f"{_QN_POOL}.quiknode.pro"
    return f"https://{host}/{_QN_KEY}{suffix}"


def _rpc(env: str, slug: str | None = None, suffix: str = "") -> str:
    """Get RPC URL: env var > QuikNode fallback > empty string"""
    url = os.getenv(env, "")
    if url:
        return url
    if slug is not None:
        return _qn(slug, suffix)
    return ""


# === Network configurations ===
# All mainnet networks use CREATE2 deterministic deployment (same contract addresses)
# QuikNode multi-chain RPC: same pool/key, different network slugs
NETWORKS: Dict[str, Dict[str, Any]] = {
    # --- Mainnet networks (21) ---
    "abstract": {
        "name": "Abstract", "chain_id": 2741,
        "rpc_url": _rpc("ABSTRACT_RPC_URL", "abstract-mainnet"),
        "explorer_url": "https://abscan.org",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 39596871, "blocks_per_batch": 2000, "enabled": True,
    },
    "arbitrum": {
        "name": "Arbitrum", "chain_id": 42161,
        "rpc_url": _rpc("ARBITRUM_RPC_URL", "arbitrum-mainnet"),
        "explorer_url": "https://arbiscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 428895443, "blocks_per_batch": 5000, "enabled": True,
    },
    "avalanche": {
        "name": "Avalanche", "chain_id": 43114,
        "rpc_url": _rpc("AVALANCHE_RPC_URL", "avalanche-mainnet", "/ext/bc/C/rpc"),
        "explorer_url": "https://snowscan.xyz",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 77389000, "blocks_per_batch": 2000, "enabled": True,
    },
    "base": {
        "name": "Base", "chain_id": 8453,
        "rpc_url": _rpc("BASE_RPC_URL", "base-mainnet"),
        "explorer_url": "https://basescan.org",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 41663783, "blocks_per_batch": 5000, "enabled": True,
    },
    "bsc-1": {
        "name": "BNB Smart Chain", "chain_id": 56,
        "rpc_url": _rpc("BSC_RPC_URL", "bsc"),
        "explorer_url": "https://bscscan.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 79027286, "blocks_per_batch": 1000, "enabled": True,
    },
    "celo": {
        "name": "Celo", "chain_id": 42220,
        "rpc_url": _rpc("CELO_RPC_URL", "celo-mainnet"),
        "explorer_url": "https://celoscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 58396724, "blocks_per_batch": 2000, "enabled": True,
    },
    "ethereum": {
        "name": "Ethereum", "chain_id": 1,
        "rpc_url": _rpc("ETHEREUM_RPC_URL", ""),
        "explorer_url": "https://etherscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 24339871, "blocks_per_batch": 2000, "enabled": True,
    },
    "gnosis": {
        "name": "Gnosis", "chain_id": 100,
        "rpc_url": _rpc("GNOSIS_RPC_URL", "xdai"),
        "explorer_url": "https://gnosisscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 44505010, "blocks_per_batch": 2000, "enabled": True,
    },
    "goat": {
        "name": "GOAT Network", "chain_id": 2345,
        "rpc_url": _rpc("GOAT_RPC_URL"),
        "explorer_url": "https://explorer.goat.network",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 10129146, "blocks_per_batch": 2000, "enabled": True,
    },
    "linea": {
        "name": "Linea", "chain_id": 59144,
        "rpc_url": _rpc("LINEA_RPC_URL", "linea-mainnet"),
        "explorer_url": "https://lineascan.build",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 28662553, "blocks_per_batch": 2000, "enabled": True,
    },
    "mantle": {
        "name": "Mantle", "chain_id": 5000,
        "rpc_url": _rpc("MANTLE_RPC_URL", "mantle-mainnet"),
        "explorer_url": "https://mantlescan.xyz",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 91333846, "blocks_per_batch": 2000, "enabled": True,
    },
    "megaeth": {
        "name": "MegaETH", "chain_id": 4326,
        "rpc_url": _rpc("MEGAETH_RPC_URL", "megaeth-mainnet"),
        "explorer_url": "https://megaeth.blockscout.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 7833805, "blocks_per_batch": 2000, "enabled": True,
    },
    "metis": {
        "name": "Metis", "chain_id": 1088,
        "rpc_url": _rpc("METIS_RPC_URL"),
        "explorer_url": "https://andromeda-explorer.metis.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 22161525, "blocks_per_batch": 2000, "enabled": True,
    },
    "monad": {
        "name": "Monad", "chain_id": 143,
        "rpc_url": _rpc("MONAD_RPC_URL", "monad-mainnet"),
        "explorer_url": "https://monadscan.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 52952790, "blocks_per_batch": 1000, "enabled": True,
    },
    "optimism": {
        "name": "Optimism", "chain_id": 10,
        "rpc_url": _rpc("OPTIMISM_RPC_URL", "optimism"),
        "explorer_url": "https://optimistic.etherscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 147514947, "blocks_per_batch": 5000, "enabled": True,
    },
    "polygon": {
        "name": "Polygon", "chain_id": 137,
        "rpc_url": _rpc("POLYGON_RPC_URL", "matic"),
        "explorer_url": "https://polygonscan.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 82458484, "blocks_per_batch": 5000, "enabled": True,
    },
    "scroll": {
        "name": "Scroll", "chain_id": 534352,
        "rpc_url": _rpc("SCROLL_RPC_URL", "scroll-mainnet"),
        "explorer_url": "https://scrollscan.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 29432417, "blocks_per_batch": 2000, "enabled": True,
    },
    "skale": {
        "name": "SKALE", "chain_id": 1187947933,
        "rpc_url": _rpc("SKALE_RPC_URL"),
        "explorer_url": "https://skale-base-explorer.skalenodes.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 689195, "blocks_per_batch": 5000, "enabled": True,
    },
    "soneium": {
        "name": "Soneium", "chain_id": 1868,
        "rpc_url": _rpc("SONEIUM_RPC_URL", "soneium-mainnet"),
        "explorer_url": "https://soneium.blockscout.com",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 19710954, "blocks_per_batch": 2000, "enabled": True,
    },
    "taiko": {
        "name": "Taiko", "chain_id": 167000,
        "rpc_url": _rpc("TAIKO_RPC_URL"),
        "explorer_url": "https://taikoscan.io",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 4305747, "blocks_per_batch": 2000, "enabled": True,
    },
    "xlayer": {
        "name": "XLayer", "chain_id": 196,
        "rpc_url": _rpc("XLAYER_RPC_URL", "xlayer-mainnet"),
        "explorer_url": "https://www.oklink.com/xlayer",
        "contracts": _MAINNET_CONTRACTS,
        "start_block": 51947237, "blocks_per_batch": 2000, "enabled": True,
    },
    # --- Testnet (disabled, kept for historical data) ---
    "sepolia": {
        "name": "Sepolia", "chain_id": 11155111,
        "rpc_url": _rpc("SEPOLIA_RPC_URL", "ethereum-sepolia"),
        "explorer_url": "https://sepolia.etherscan.io",
        "contracts": _TESTNET_CONTRACTS,
        "start_block": 9989393, "blocks_per_batch": 10000, "enabled": False,
    },
}


def get_enabled_networks() -> Dict[str, Dict[str, Any]]:
    """Get all enabled networks"""
    return {k: v for k, v in NETWORKS.items() if v.get("enabled", True)}


def get_network(network_key: str) -> Dict[str, Any] | None:
    """Get network configuration by key"""
    return NETWORKS.get(network_key)
