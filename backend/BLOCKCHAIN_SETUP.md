# Blockchain Setup Guide

## Overview

This guide explains how to configure the blockchain synchronization service to fetch real ERC-8004 agent data from the Sepolia test network.

## Prerequisites

1. **Infura Account** (or other Ethereum node provider)
   - Sign up at https://infura.io
   - Create a new project
   - Get your Project ID

2. **ERC-8004 Contract Address**
   - Obtain the official ERC-8004 ID Registry contract address on Sepolia
   - Contact the ERC-8004 team or check official documentation

## Configuration Steps

### 1. Update RPC URL

Edit `src/core/blockchain_config.py`:

```python
# Replace YOUR_PROJECT_ID with your actual Infura project ID
SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/YOUR_ACTUAL_PROJECT_ID"
```

**Alternative providers:**
- Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- Ankr: `https://rpc.ankr.com/eth_sepolia`
- Public RPC: `https://sepolia.publicnode.com`

### 2. Update Contract Address

Edit `src/core/blockchain_config.py`:

```python
# Replace with actual ERC-8004 ID Registry contract address
REGISTRY_CONTRACT_ADDRESS = "0xACTUAL_CONTRACT_ADDRESS_HERE"
```

### 3. Update Contract ABI (if needed)

The current ABI is a simplified version. If the actual contract has additional methods or events, update the `REGISTRY_ABI` in `src/core/blockchain_config.py`.

To get the actual ABI:
1. Go to https://sepolia.etherscan.io
2. Search for the contract address
3. Navigate to the "Contract" tab
4. Copy the ABI JSON

### 4. Set Starting Block (Optional)

By default, the sync starts from block 0. To start from a specific block:

Edit `src/services/blockchain_sync.py`:

```python
def _get_sync_tracker(self, db: Session) -> BlockchainSync:
    if not sync:
        sync = BlockchainSync(
            network_name="sepolia",
            contract_address=REGISTRY_CONTRACT_ADDRESS,
            last_block=5000000,  # Start from this block instead of 0
            status=SyncStatusEnum.IDLE
        )
```

## Environment Variables (Recommended)

For production, use environment variables instead of hardcoding values:

1. Create `.env` file:

```env
INFURA_PROJECT_ID=your_project_id_here
REGISTRY_CONTRACT_ADDRESS=0xActualContractAddress
IPFS_GATEWAY=https://ipfs.io/ipfs/
SYNC_INTERVAL_MINUTES=5
```

2. Update `src/core/blockchain_config.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

SEPOLIA_RPC_URL = f"https://sepolia.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}"
REGISTRY_CONTRACT_ADDRESS = os.getenv('REGISTRY_CONTRACT_ADDRESS')
SYNC_INTERVAL_MINUTES = int(os.getenv('SYNC_INTERVAL_MINUTES', '5'))
```

## Testing the Connection

Test if your configuration works:

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://sepolia.infura.io/v3/YOUR_PROJECT_ID"))

# Test connection
print(f"Connected: {w3.is_connected()}")
print(f"Current block: {w3.eth.block_number}")

# Test contract
contract = w3.eth.contract(address="0xYourContractAddress", abi=REGISTRY_ABI)
print(f"Contract address: {contract.address}")
```

## Sync Configuration

### Adjust Sync Parameters

Edit `src/core/blockchain_config.py`:

```python
BLOCKS_PER_BATCH = 1000       # Blocks to process per sync (lower for slower networks)
SYNC_INTERVAL_MINUTES = 5     # How often to sync (in minutes)
MAX_RETRIES = 3               # Max retry attempts for failed operations
RETRY_DELAY_SECONDS = 5       # Delay between retries
```

### Recommendations:

- **Development**:
  - `BLOCKS_PER_BATCH`: 1000-5000
  - `SYNC_INTERVAL_MINUTES`: 1-5

- **Production**:
  - `BLOCKS_PER_BATCH`: 1000-2000 (to avoid rate limits)
  - `SYNC_INTERVAL_MINUTES`: 5-15

## Starting the Sync Service

The sync service starts automatically when you run the FastAPI server:

```bash
./scripts/dev-backend.sh
```

Or manually:

```bash
uv run uvicorn src.main:app --reload
```

## Monitoring

### Check Sync Status

```bash
curl http://localhost:8000/api/sync/status
```

### View Logs

The service uses structured logging. Check the logs for sync progress:

```
INFO: scheduler_task_started task=blockchain_sync
INFO: sync_started from_block=5000 to_block=6000
INFO: events_found count=5
INFO: agent_created token_id=123 name="AI Agent"
INFO: sync_completed last_block=6000
```

## Troubleshooting

### Connection Issues

**Error**: `HTTPError: 429 Too Many Requests`
- **Solution**: Reduce `BLOCKS_PER_BATCH` or increase `SYNC_INTERVAL_MINUTES`

**Error**: `ConnectionError: Unable to connect to Ethereum node`
- **Solution**: Check your RPC URL and API key

### Contract Issues

**Error**: `ABIFunctionNotFound`
- **Solution**: Update the ABI to match the actual contract

**Error**: `BadFunctionCallOutput`
- **Solution**: Verify the contract address is correct

### Metadata Issues

**Error**: `HTTPError: 404 Not Found` (when fetching metadata)
- **Solution**: The metadata URI might be invalid or the IPFS content doesn't exist

## IPFS Configuration

If agents use IPFS for metadata:

### Use Different IPFS Gateway

Edit `src/core/blockchain_config.py`:

```python
IPFS_GATEWAY = "https://ipfs.io/ipfs/"              # Default
# or
IPFS_GATEWAY = "https://cloudflare-ipfs.com/ipfs/" # Cloudflare
# or
IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/" # Pinata
```

### Run Local IPFS Node

```bash
ipfs daemon
```

Then use:
```python
IPFS_GATEWAY = "http://localhost:8080/ipfs/"
```

## Production Deployment

1. Use environment variables for all sensitive data
2. Set up proper logging and monitoring
3. Use a managed Ethereum node service (Infura, Alchemy, QuickNode)
4. Consider rate limiting and caching
5. Set up error alerting
6. Use a production-grade database (PostgreSQL)

## Support

For issues specific to ERC-8004:
- Check official ERC-8004 documentation
- Join the ERC-8004 community Discord/Telegram
- Review the contract source code on Etherscan

For this application:
- Check logs in `/backend/logs/`
- Review database state
- Test individual components
