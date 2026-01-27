"""Reputation Registry Configuration

Updated: Jan 27, 2026 - ERC-8004 Mainnet Freeze
- ABI loaded from official GitHub: https://github.com/erc-8004/erc-8004-contracts/tree/master/abis
- score (uint8) → value (int128) + valueDecimals (uint8)
- Supports decimals, negative numbers, and values > 100
"""

import json
from pathlib import Path

# Sepolia Reputation Registry Contract
REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713"

# Load ABI from JSON file (official version from erc-8004-contracts)
_ABI_DIR = Path(__file__).parent.parent / "abi"
_REPUTATION_ABI_PATH = _ABI_DIR / "ReputationRegistry.json"

with open(_REPUTATION_ABI_PATH, "r") as f:
    REPUTATION_REGISTRY_ABI = json.load(f)

# Sync Configuration
# Updated: Jan 2026 Test Net deployment block
REPUTATION_START_BLOCK = 9989393  # Same as identity registry
REPUTATION_BLOCKS_PER_BATCH = 10000
