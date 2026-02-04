"""Multi-network configuration for ERC-8004"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Network configurations
# RPC URLs are loaded from environment variables to prevent exposure
# Updated: Jan 2026 Mainnet deployment
NETWORKS: Dict[str, Dict[str, Any]] = {
    # === Ethereum Mainnet (Production) ===
    "ethereum": {
        "name": "Ethereum Mainnet",
        "chain_id": 1,
        "rpc_url": os.getenv("ETHEREUM_RPC_URL", ""),
        "explorer_url": "https://etherscan.io",
        "contracts": {
            "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
            # validation: to be deployed (under discussion with TEE community)
        },
        "start_block": 24339871,  # Contract deployment block (Jan 29, 2026 10:20:23 UTC)
        "blocks_per_batch": 2000,  # Mainnet has faster blocks
        "enabled": True,  # Keep Ethereum enabled
    },
    # === Polygon Mainnet ===
    "polygon": {
        "name": "Polygon Mainnet",
        "chain_id": 137,
        "rpc_url": os.getenv("POLYGON_RPC_URL", ""),
        "explorer_url": "https://polygonscan.com",
        "contracts": {
            "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
            # validation: to be deployed (under discussion with TEE community)
        },
        "start_block": 82458484,  # Contract deployment block (Feb 2, 2026)
        "blocks_per_batch": 5000,  # Polygon has fast blocks (~2s)
        "enabled": True,
    },
    # === Base Mainnet ===
    "base": {
        "name": "Base",
        "chain_id": 8453,
        "rpc_url": os.getenv("BASE_RPC_URL", "https://dark-divine-pool.base-mainnet.quiknode.pro/1901fe0d2ad4caa6cf9ab68c628bcab7be99f665"),
        "explorer_url": "https://basescan.org",
        "contracts": {
            "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
            # validation: to be deployed (under discussion with TEE community)
        },
        "start_block": 41663783,  # Contract deployment block (Feb 4, 2026)
        "blocks_per_batch": 5000,  # Base has fast blocks (~2s, similar to Polygon)
        "enabled": True,
    },
    # === Testnets ===
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
        "enabled": False,  # Keep disabled for now
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
    # === BSC Mainnet 1 (CREATE2 deterministic deployment) ===
    "bsc-1": {
        "name": "BNB Smart Chain 1",
        "chain_id": 56,
        "rpc_url": os.getenv("BSC_RPC_URL", "https://dark-divine-pool.bsc.quiknode.pro/1901fe0d2ad4caa6cf9ab68c628bcab7be99f665"),
        "explorer_url": "https://bscscan.com",
        "contracts": {
            "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
        },
        "start_block": 49200000,  # Approximate deployment block
        "blocks_per_batch": 1000,
        "enabled": True,
    },
    # === BSC Mainnet 2 (Vanity deployment) - Disabled for now ===
    "bsc-2": {
        "name": "BNB Smart Chain 2",
        "chain_id": 56,
        "rpc_url": os.getenv("BSC_RPC_URL", "https://dark-divine-pool.bsc.quiknode.pro/1901fe0d2ad4caa6cf9ab68c628bcab7be99f665"),
        "explorer_url": "https://bscscan.com",
        "contracts": {
            "identity": os.getenv("BSC_IDENTITY_CONTRACT", "0x8004c274E3770d32dc1883ab5108b0eA28A854D5"),
            "reputation": os.getenv("BSC_REPUTATION_CONTRACT", "0x8004e9D54904EaAFc724A743Fea4387Fa632dc2D"),
        },
        "start_block": 79090000,  # Skip to near first registration (~79096984)
        "blocks_per_batch": 1000,
        "enabled": False,
    },
    # === Monad Mainnet ===
    "monad": {
        "name": "Monad",
        "chain_id": 143,
        "rpc_url": os.getenv("MONAD_RPC_URL", "https://dark-divine-pool.monad-mainnet.quiknode.pro/1901fe0d2ad4caa6cf9ab68c628bcab7be99f665"),
        "explorer_url": "https://monadscan.com",
        "contracts": {
            "identity": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
            "reputation": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
            # validation: to be deployed (under discussion with TEE community)
        },
        "start_block": 52952790,  # Contract deployment block (Feb 4, 2026)
        "blocks_per_batch": 5000,  # Monad has fast blocks (~1s)
        "enabled": True,
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
