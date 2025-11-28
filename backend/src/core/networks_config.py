"""Multi-network configuration for ERC-8004"""

import os
from typing import Dict, Any
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Network configurations
# RPC URLs are loaded from environment variables to prevent exposure
NETWORKS: Dict[str, Dict[str, Any]] = {
    "sepolia": {
        "name": "Sepolia",
        "chain_id": 11155111,
        "rpc_url": os.getenv("SEPOLIA_RPC_URL", ""),
        "explorer_url": "https://sepolia.etherscan.io",
        "contracts": {
            "identity": "0x8004a6090Cd10A7288092483047B097295Fb8847",
            "reputation": "0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E",
            "validation": "0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5",
        },
        "start_block": 9419801,
        "blocks_per_batch": 10000,
        "enabled": True,
    },
    "base-sepolia": {
        "name": "Base Sepolia",
        "chain_id": 84532,
        "rpc_url": os.getenv("BASE_SEPOLIA_RPC_URL", ""),
        "explorer_url": "https://sepolia.basescan.org",
        "contracts": {
            "identity": "0x8004AA63c570c570eBF15376c0dB199918BFe9Fb",
            "reputation": "0x8004bd8daB57f14Ed299135749a5CB5c42d341BF",
            "validation": "0x8004C269D0A5647E51E121FeB226200ECE932d55",
        },
        "start_block": 32481444,
        "blocks_per_batch": 10000,
        "enabled": True,
    },
    "linea-sepolia": {
        "name": "Linea Sepolia",
        "chain_id": 59141,
        "rpc_url": "https://rpc.sepolia.linea.build",
        "explorer_url": "https://sepolia.lineascan.build",
        "contracts": {
            "identity": "0x8004aa7C931bCE1233973a0C6A667f73F66282e7",
            "reputation": "0x8004bd8483b99310df121c46ED8858616b2Bba02",
            "validation": "0x8004c44d1EFdd699B2A26e781eF7F77c56A9a4EB",
        },
        "start_block": 0,  # 需要填入实际的部署区块
        "blocks_per_batch": 10000,
        "enabled": True,
    },
    "hedera-testnet": {
        "name": "Hedera Testnet",
        "chain_id": 296,
        "rpc_url": "https://testnet.hashio.io/api",
        "explorer_url": "https://hashscan.io/testnet",
        "contracts": {
            "identity": "0x0dDaa2de07deb24D5F0288ee29c3c57c4159DcC7",
            "reputation": "0xcF4D195DB80483EFF011814a52D290BBAb340a77",
            "validation": "0x833984fB21688d6A409E02Ac67a6e0a63a06f55a",
        },
        "start_block": 0,  # 需要填入实际的部署区块
        "blocks_per_batch": 10000,
        "enabled": True,
    },
    "bsc-testnet": {
        "name": "BSC Testnet",
        "chain_id": 97,
        "rpc_url": os.getenv("BSC_TESTNET_RPC_URL", "https://data-seed-prebsc-1-s1.binance.org:8545"),
        "explorer_url": "https://testnet.bscscan.com",
        "contracts": {
            "identity": "0x4f8c8694eAB93bbF7616EDD522503544E61E7dB7",
            "reputation": "0xe55d10F699bCF2207573b7Be697C983C0d92c2b5",
            "validation": "0xCd40E749C64761DA2298436Fe0eA4dc23f58c1f3",
        },
        "start_block": 75120134,
        "blocks_per_batch": 10000,
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
