# ERC-8004 Jan 2026 Contract Update Guide

This document describes the changes and deployment steps for the ERC-8004 Jan 2026 testnet update.

## Overview

The ERC-8004 contracts have been redeployed on Ethereum Sepolia with significant changes:

- **Contract Type**: Upgraded to UUPS Upgradeable proxies
- **Storage Reset**: All previous data wiped (major changes)
- **ABI Changes**: Event parameter names and types updated
- **Network Status**: Only Sepolia deployed, other networks pending

## Contract Address Changes

### Ethereum Sepolia (Live)

| Contract | Old Address | New Address |
|----------|-------------|-------------|
| IdentityRegistry | `0x8004a6090Cd10A7288092483047B097295Fb8847` | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry | `0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5` | *Pending (TEE community discussion)* |
| Start Block | 9419801 | **9989393** |

### Other Networks (Pending Deployment)

- Base Sepolia
- Linea Sepolia
- Polygon Amoy (new)
- Hedera Testnet
- HyperEVM Testnet (new)
- SKALE Testnet (new)

## ABI Breaking Changes

### IdentityRegistry

| Change | Before | After |
|--------|--------|-------|
| Event `Registered` param | `tokenURI` | `agentURI` |
| Event name | `UriUpdated` | `URIUpdated` |
| Event `URIUpdated` param | `newUri` | `newURI` |
| Function name | `setTokenURI()` | `setAgentURI()` |
| New event | - | `MetadataSet` (on-chain metadata) |

### ReputationRegistry

| Change | Before | After |
|--------|--------|-------|
| `tag1`, `tag2` type | `bytes32` | `string` |
| New event param | - | `feedbackIndex` |
| New event param | - | `endpoint` |
| `feedbackUri` renamed | `feedbackUri` | `feedbackURI` |
| New event | - | `ResponseAppended` |

## Files Changed

### Backend

```
backend/src/core/
├── networks_config.py      # Updated contract addresses, disabled pending networks
├── blockchain_config.py    # Updated Identity ABI, start_block = 9989393
└── reputation_config.py    # Updated Reputation ABI (tag: bytes32 → string)

backend/src/services/
├── blockchain_sync.py      # Updated event parameter names
└── scheduler.py            # Disabled Base Sepolia & BSC Testnet sync jobs
```

### Frontend

```
frontend/lib/web3/
└── contracts.ts            # Updated ABI and contract addresses
```

### Documentation

```
CLAUDE.md                   # Updated contract addresses and start_block
```

## Deployment Steps

### 1. Pull Latest Code

```bash
ssh your-server
cd /path/to/agentscan
git pull origin master
```

### 2. Reset Database (Required - Storage Wiped)

Since the on-chain storage was wiped, the database must be reset:

```bash
# Docker environment (recommended)
./scripts/docker-reset-db.sh --backup --resync

# This will:
# 1. Backup current database
# 2. Drop all tables
# 3. Recreate schema
# 4. Run migrations
# 5. Initialize networks
# 6. Reset sync status
```

### 3. Restart Services

```bash
# Docker environment
docker compose down
docker compose up -d

# Or just restart backend
docker compose restart backend
```

### 4. Verify Deployment

```bash
# Check backend logs
docker compose logs -f backend | head -100

# Expected output:
# network_sync_initialized chain_id=11155111
#   identity_contract=0x8004A818BFB912233c491871b3d84c89A494BD9e
#   reputation_contract=0x8004B663056A597Dffe9eCcC1965A193B7388713
#   start_block=9989393

# Check sync status
curl http://localhost:8000/api/stats | jq .

# Expected: is_syncing: true, current_block starting from 9989393
```

### 5. Monitor Sync Progress

```bash
# Watch sync logs
docker compose logs -f backend | grep -E "sync|events_found|agent_created"

# Check agent count
curl http://localhost:8000/api/stats | jq '.total_agents'
```

## Troubleshooting

### IPFS Metadata Fetch Failures

If you see `metadata_fetch_failed` warnings:

1. **Check network connectivity to IPFS gateway**:
   ```bash
   curl -I https://ipfs.io/ipfs/QmTest123
   ```

2. **If using proxy**, ensure it's properly configured or disabled

3. **Consider alternative gateways** (edit `blockchain_config.py`):
   - `https://cloudflare-ipfs.com/ipfs/`
   - `https://dweb.link/ipfs/`
   - `https://gateway.pinata.cloud/ipfs/`

### 429 Rate Limit Errors

If you see `429 Client Error: Too Many Requests`:

1. Wait a few minutes for rate limit to reset
2. Consider using a different RPC provider
3. Check your Alchemy/Infura plan limits

### Scheduler Task Errors

If you see `Network 'xxx' not found in configuration`:

- This is expected for disabled networks (Base Sepolia, BSC Testnet)
- The scheduler has been updated to only sync Sepolia
- Restart backend to apply scheduler changes

## Rollback Procedure

If you need to rollback:

```bash
# 1. Restore database backup
cp 8004scan_backup_YYYYMMDD_HHMMSS.db 8004scan.db

# 2. Checkout previous code
git checkout HEAD~1

# 3. Restart services
docker compose restart backend
```

## Environment Variables

No new environment variables required. Existing configuration:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
```

## Post-Deployment Checklist

- [ ] Database reset completed
- [ ] Backend started without errors
- [ ] Sync started from block 9989393
- [ ] New agents appearing in database
- [ ] Frontend showing agents correctly
- [ ] No 429 rate limit errors
- [ ] Scheduler only running Sepolia sync

## References

- ERC-8004 Contracts: https://github.com/erc-8004/erc-8004-contracts
- Spec Changes Guide: https://github.com/erc-8004/erc-8004-contracts/blob/master/SpecsJan26Update.md
- New ABIs: https://github.com/erc-8004/erc-8004-contracts/tree/master/abis

---

*Last updated: Jan 10, 2026*
