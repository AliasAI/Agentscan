"""Blockchain configuration"""

import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# Legacy Sepolia configuration (kept for backward compatibility)
# New multi-network configuration is in networks_config.py
SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL", "")
SEPOLIA_CHAIN_ID = 11155111

# ERC-8004 ID Registry contract (Sepolia - legacy)
# Updated: Jan 2026 Test Net deployment
REGISTRY_CONTRACT_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e"

# ERC-8004 ID Registry ABI (from IdentityRegistryUpgradeable contract)
# Updated: Jan 2026 - Event parameter names changed (tokenURI -> agentURI, UriUpdated -> URIUpdated)
REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "agentURI", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "owner", "type": "address"}
        ],
        "name": "Registered",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "newURI", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "updatedBy", "type": "address"}
        ],
        "name": "URIUpdated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": True, "internalType": "string", "name": "indexedMetadataKey", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "metadataKey", "type": "string"},
            {"indexed": False, "internalType": "bytes", "name": "metadataValue", "type": "bytes"}
        ],
        "name": "MetadataSet",
        "type": "event"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "agentURI", "type": "string"}],
        "name": "register",
        "outputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"internalType": "string", "name": "newURI", "type": "string"}
        ],
        "name": "setAgentURI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# Sync configuration
# Updated: Jan 2026 Test Net deployment block
START_BLOCK = 9989393  # Start from this block (contract deployment block)
BLOCKS_PER_BATCH = 1000  # Process 1000 blocks at a time (reduce RPC calls)
MAX_BATCHES_PER_RUN = 50  # Max batches to process in one sync run (50 batches = 50k blocks = ~5-10 mins)
# Note: Interval is now controlled by CronTrigger in scheduler.py (every 10 minutes)
# This constant is kept for reference but not actively used
SYNC_INTERVAL_MINUTES = 2  # Sync every 10 minutes (low cost, frequent updates)
MAX_RETRIES = 1  # Max retry attempts for failed operations
RETRY_DELAY_SECONDS = 5  # Delay between retries
REQUEST_DELAY_SECONDS = 0.5  # Delay between individual requests to avoid rate limiting

# IPFS gateway
IPFS_GATEWAY = "https://ipfs.io/ipfs/"
