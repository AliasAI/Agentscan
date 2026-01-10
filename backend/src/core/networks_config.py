"""Multi-network configuration for ERC-8004"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Network configurations
# RPC URLs are loaded from environment variables to prevent exposure
# Updated: Jan 2026 Test Net deployment
NETWORKS: Dict[str, Dict[str, Any]] = {
    "sepolia": {
        "name": "Sepolia",
        "chain_id": 11155111,
        "rpc_url": os.getenv("SEPOLIA_RPC_URL", ""),
        "explorer_url": "https://sepolia.etherscan.io",
        "contracts": {
            "identity": "0x8004A818BFB912233c491871b3d84c89A494BD9e",
            "reputation": "0x8004B663056A597Dffe9eCcC1965A193B7388713",
            # validation: to be deployed (under discussion with TEE community)
        },
        "start_block": 9989393,
        "blocks_per_batch": 10000,
        "enabled": True,
    },
    # === Networks pending deployment (Jan 2026) ===
    "base-sepolia": {
        "name": "Base Sepolia",
        "chain_id": 84532,
        "rpc_url": os.getenv("BASE_SEPOLIA_RPC_URL", ""),
        "explorer_url": "https://sepolia.basescan.org",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
    "linea-sepolia": {
        "name": "Linea Sepolia",
        "chain_id": 59141,
        "rpc_url": "https://rpc.sepolia.linea.build",
        "explorer_url": "https://sepolia.lineascan.build",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
    "polygon-amoy": {
        "name": "Polygon Amoy",
        "chain_id": 80002,
        "rpc_url": os.getenv("POLYGON_AMOY_RPC_URL", ""),
        "explorer_url": "https://amoy.polygonscan.com",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
    "hedera-testnet": {
        "name": "Hedera Testnet",
        "chain_id": 296,
        "rpc_url": "https://testnet.hashio.io/api",
        "explorer_url": "https://hashscan.io/testnet",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
    "hyperevm-testnet": {
        "name": "HyperEVM Testnet",
        "chain_id": 998,  # Placeholder - need actual chain ID
        "rpc_url": os.getenv("HYPEREVM_TESTNET_RPC_URL", ""),
        "explorer_url": "",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
    "skale-testnet": {
        "name": "SKALE Testnet",
        "chain_id": 0,  # Placeholder - need actual chain ID
        "rpc_url": os.getenv("SKALE_TESTNET_RPC_URL", ""),
        "explorer_url": "",
        "contracts": {
            "identity": "",  # to be deployed
            "reputation": "",  # to be deployed
        },
        "start_block": 0,
        "blocks_per_batch": 10000,
        "enabled": False,  # Disabled until deployed
    },
}

# Get enabled networks
def get_enabled_networks():
    """Get all enabled networks"""
    return {k: v for k, v in NETWORKS.items() if v.get("enabled", True)}

# Get network by key
def get_network(network_key: str):
    """Get network configuration by key"""
    return NETWORKS.get(network_key)
