"""Reputation Registry Configuration"""

# Sepolia Reputation Registry Contract
REPUTATION_REGISTRY_ADDRESS = "0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E"

# Reputation Registry ABI (minimal, only needed functions)
REPUTATION_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "agentId", "type": "uint256"},
            {"internalType": "address[]", "name": "clientAddresses", "type": "address[]"},
            {"internalType": "bytes32", "name": "tag1", "type": "bytes32"},
            {"internalType": "bytes32", "name": "tag2", "type": "bytes32"}
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
            {"indexed": False, "internalType": "uint8", "name": "score", "type": "uint8"},
            {"indexed": True, "internalType": "bytes32", "name": "tag1", "type": "bytes32"},
            {"indexed": False, "internalType": "bytes32", "name": "tag2", "type": "bytes32"},
            {"indexed": False, "internalType": "string", "name": "feedbackUri", "type": "string"},
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
        "inputs": [],
        "name": "getIdentityRegistry",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Sync Configuration
REPUTATION_START_BLOCK = 9419801  # Same as identity registry for now
REPUTATION_BLOCKS_PER_BATCH = 10000
