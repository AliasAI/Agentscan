"""Reputation Registry Configuration"""
# Updated: Jan 2026 Test Net deployment

# Sepolia Reputation Registry Contract
REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713"

# Reputation Registry ABI (from ReputationRegistryUpgradeable contract)
# Updated: Jan 2026 - tag parameters changed from bytes32 to string, added feedbackIndex and endpoint
REPUTATION_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"internalType": "address[]", "name": "clientAddresses", "type": "address[]"},
            {"internalType": "string", "name": "tag1", "type": "string"},
            {"internalType": "string", "name": "tag2", "type": "string"}
        ],
        "name": "getSummary",
        "outputs": [
            {"internalType": "uint64", "name": "count", "type": "uint64"},
            {"internalType": "uint8", "name": "averageScore", "type": "uint8"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "clientAddress", "type": "address"},
            {"indexed": False, "internalType": "uint64", "name": "feedbackIndex", "type": "uint64"},
            {"indexed": False, "internalType": "uint8", "name": "score", "type": "uint8"},
            {"indexed": True, "internalType": "string", "name": "tag1", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "tag2", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "endpoint", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "feedbackURI", "type": "string"},
            {"indexed": False, "internalType": "bytes32", "name": "feedbackHash", "type": "bytes32"}
        ],
        "name": "NewFeedback",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "clientAddress", "type": "address"},
            {"indexed": True, "internalType": "uint64", "name": "feedbackIndex", "type": "uint64"}
        ],
        "name": "FeedbackRevoked",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "clientAddress", "type": "address"},
            {"indexed": False, "internalType": "uint64", "name": "feedbackIndex", "type": "uint64"},
            {"indexed": True, "internalType": "address", "name": "responder", "type": "address"},
            {"indexed": False, "internalType": "string", "name": "responseURI", "type": "string"},
            {"indexed": False, "internalType": "bytes32", "name": "responseHash", "type": "bytes32"}
        ],
        "name": "ResponseAppended",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getIdentityRegistry",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "agentId", "type": "uint256"}],
        "name": "getClients",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Sync Configuration
# Updated: Jan 2026 Test Net deployment block
REPUTATION_START_BLOCK = 9989393  # Same as identity registry
REPUTATION_BLOCKS_PER_BATCH = 10000
