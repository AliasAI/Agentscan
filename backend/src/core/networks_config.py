"""Multi-network configuration for ERC-8004"""

from typing import Dict, Any

# Network configurations
NETWORKS: Dict[str, Dict[str, Any]] = {
    "sepolia": {
        "name": "Sepolia",
        "chain_id": 11155111,
        "rpc_url": "https://dry-summer-diamond.ethereum-sepolia.quiknode.pro/a919991bab9313b5845be8362dc01e9969f3000c/",
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
        "rpc_url": "https://sepolia.base.org",
        "explorer_url": "https://sepolia.basescan.org",
        "contracts": {
            "identity": "0x8004AA63c570c570eBF15376c0dB199918BFe9Fb",
            "reputation": "0x8004bd8daB57f14Ed299135749a5CB5c42d341BF",
            "validation": "0x8004C269D0A5647E51E121FeB226200ECE932d55",
        },
        "start_block": 0,  # 需要填入实际的部署区块
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
            "identity": "0x0ddaa2de07deb24d5f0288ee29c3c57c4159dcc7",
            "reputation": "0xcf4d195db80483eff011814a52d290bbab340a77",
            "validation": "0x833984fb21688d6a409e02ac67a6e0a63a06f55a",
        },
        "start_block": 0,  # 需要填入实际的部署区块
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
