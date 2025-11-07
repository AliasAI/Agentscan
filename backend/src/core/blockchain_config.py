"""Blockchain configuration"""

import os

# Sepolia network configuration
SEPOLIA_RPC_URL = os.getenv("SEPOLIA_RPC_URL", "")
if not SEPOLIA_RPC_URL:
    raise ValueError("SEPOLIA_RPC_URL environment variable is required")
SEPOLIA_CHAIN_ID = 11155111

# ERC-8004 ID Registry contract (replace with actual contract address)
REGISTRY_CONTRACT_ADDRESS = "0x8004a6090Cd10A7288092483047B097295Fb8847"  

# ERC-8004 ID Registry ABI (from IdentityRegistry contract)
REGISTRY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "tokenURI", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "owner", "type": "address"}
        ],
        "name": "Registered",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "newUri", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "updatedBy", "type": "address"}
        ],
        "name": "UriUpdated",
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
    }
]

# Sync configuration
START_BLOCK = 9419801  # Start from this block (contract deployment block)
BLOCKS_PER_BATCH = 10000  # Process 10000 blocks at a time (faster sync)
SYNC_INTERVAL_MINUTES = 5  # Sync every 5 minutes (avoid blocking API)
MAX_RETRIES = 2  # Max retry attempts for failed operations
RETRY_DELAY_SECONDS = 3  # Delay between retries

# IPFS gateway
IPFS_GATEWAY = "https://ipfs.io/ipfs/"
