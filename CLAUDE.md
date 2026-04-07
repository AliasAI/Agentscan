# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentscan (https://agentscan.info) is an ERC-8004 AI Agent Explorer, similar to a blockchain explorer, used to display and track AI agent information based on the ERC-8004 protocol. The project includes a frontend (Next.js) and a backend (FastAPI), with the backend syncing on-chain data from 21 mainnet networks via Web3.py and QuikNode RPC.

## Core Commands

### Development Environment Startup

```bash
# Backend dev server (port 8000)
./scripts/dev-backend.sh

# Frontend dev server (port 3000)
./scripts/dev-frontend.sh

# Start both frontend and backend
./scripts/dev-all.sh
```

### Database Operations

**Local Development:**

```bash
# Full database reset (backup + rebuild + resync)
./scripts/reset-db.sh --backup --resync

# Fix network_id issues only (no data deletion)
cd backend && uv run python -m src.db.migrate_network_ids

# Reset network sync state (rescan)
./scripts/reset-sync.sh base-sepolia

# Manually trigger sync
./scripts/trigger-sync.sh base-sepolia
```

**Docker Production:**

```bash
# Full database reset (backup + rebuild + resync)
./scripts/docker-reset-db.sh --backup --resync

# Fix network_id issues only (recommended for server repair)
./scripts/docker-migrate-network-ids.sh

# Reset network sync state
./scripts/docker-reset-sync.sh base-sepolia

# Manually trigger sync
./scripts/docker-trigger-sync.sh base-sepolia
```

### Backend Direct Commands

```bash
cd backend

# Install dependencies (using uv)
uv sync

# Run database migrations
uv run python -m src.db.migrate_add_contracts

# Initialize test data
uv run python -m src.db.init_data

# Start server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Direct Commands

```bash
cd frontend

# Install dependencies
npm install  # or pnpm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Architecture

### Overall Architecture

```
User Browser
    ↓
Next.js Frontend (Port 3000)
    ↓ API calls
FastAPI Backend (Port 8000)
    ↓ Read/Write
SQLite Database
    ↑ Scheduled sync
Web3.py ← Sepolia Network (ERC-8004 contracts)
```

### Backend Architecture (backend/src/)

**Core Design Principles:**
- Service layer (services/) handles business logic and external integrations
- API layer (api/) handles routing and request/response processing
- Model layer (models/) defines database table structures
- Config layer (core/) centralized configuration management

**Key Components:**

1. **Blockchain Sync Service** (services/blockchain_sync.py) [UPDATED: 2025-11-15]
   - Listens to ERC-8004 contract events from the Sepolia network
   - **Batch block processing** (BLOCKS_PER_BATCH = 1000, reduced by 90% after optimization)
   - **Incremental sync**: records last_block to avoid reprocessing
   - **Smart skip**: skips sync when no new blocks, avoiding unnecessary RPC calls
   - **Rate limiting**: 0.5s delay between event processing to avoid 429 errors
   - Automatically fetches IPFS metadata (supports HTTP, IPFS, data URI)
   - Error retry mechanism (MAX_RETRIES = 1)
   - **Integrated OASF auto-classification**: automatically classifies skills and domains on new agent registration
   - **Integrated Reputation event-driven updates**: listens to NewFeedback and FeedbackRevoked events

2. **OASF Classification Service** (services/ai_classifier.py + background_classifier.py) [UPDATED: 2025-11-14]
   - Automatically classifies agents based on OASF v1.0 specification
   - Prioritizes extraction from metadata `endpoints[].skills/domains`
   - Otherwise uses multiple LLMs (following herAI architecture) or keyword matching for auto-classification
   - **Supported LLM providers**:
     - DeepSeek (recommended): cost-effective, uses OpenAI SDK
     - OpenAI: GPT-4o-mini
     - OpenRouter: unified interface supporting multiple models
     - Anthropic Claude: backward compatible
   - Supports 136 skills and 204 domains
   - **Strict validation rules** (prefer no classification over incorrect classification):
     - Description minimum length 20 characters
     - Filters error messages and default values (e.g., "metadata fetch failed")
     - Only classifies agents with sufficient information
     - Validation rules doc: `docs/classification-validation-rules.md`
   - **Background async classification**:
     - Supports async batch classification without blocking main service
     - Real-time progress tracking, can start/view/cancel tasks
     - Script: `./classify_background.sh start [limit] [batch_size]`
     - Full guide: `docs/background-classification-guide.md`
   - Full documentation: `docs/oasf-classification.md`

3. **Scheduled Task Scheduler** (services/scheduler.py) [UPDATED: 2025-11-15]
   - Uses APScheduler for task management
   - **blockchain_sync**: syncs every 10 minutes (fixed-time trigger: :00, :10, :20, :30, :40, :50)
   - **reputation_sync**: **fully event-driven** (zero periodic polling, triggered by NewFeedback/FeedbackRevoked events)
   - **Fixed-time triggers**: avoids request spikes at startup, always waits until the next fixed time point regardless of restart time
   - **RPC optimization**: requests reduced from ~686K/day to ~300K/day (56% reduction)

3. **Database Migrations**
   - Uses custom migration scripts (src/db/migrate_*.py)
   - Migration scripts need to load .env files (using load_dotenv())
   - Automatically runs migrations on main.py startup

4. **Environment Variable Loading**
   - All config modules need to call load_dotenv() at the top
   - Especially blockchain_config.py, reputation_config.py
   - Must be called before import os.getenv()

### Frontend Architecture (frontend/)

**Tech Stack Version Requirements:**
- Next.js: must use v15.4+ (do not use v14)
- React: must use v19+
- Tailwind CSS: must use v4 (do not use v3)

**Responsive Design Strategy:**
- Uses Tailwind breakpoints: `md:` (768px+), `lg:` (1024px+)
- Mobile-first: default styles are for mobile, use md: prefix for desktop
- Key components need dual versions:
  - Sync status display: below title on mobile, absolute positioned top-right on desktop
  - Use `hidden md:flex` and `flex md:hidden` to toggle display

**API Integration** (lib/api/services.ts)
- All API calls centralized in this file
- Uses fetch-wrapped utility functions: apiGet, apiPost, etc.
- Type definitions in types/index.ts

### Data Flow

```
ERC-8004 Contract Events (Registered, UriUpdated, Transfer)
    ↓ Web3.py listener
BlockchainSyncService processes
    ↓ Parse events + fetch metadata
Agent model saved to database
    ↓ FastAPI query
Frontend fetches via API
    ↓ 10-second auto-refresh
User interface display
```

## Critical Implementation Details

### Database Schema Evolution

**Agent Model Fields:**
- Base fields: id, name, address, description, network_id
- On-chain fields: token_id (indexed), owner_address (indexed), metadata_uri, on_chain_data (JSON)
- Sync fields: sync_status (enum: pending/synced/failed), synced_at, created_at (indexed)
- Business fields: reputation_score, status (enum: active/inactive/suspended)
- **OASF fields**: skills (JSON), domains (JSON) - auto-classified skill and domain tags

**BlockchainSync Model:**
- Tracks sync progress: last_block, current_block, status
- One record per network + contract combination
- status: idle/running/error

**Network Model - contracts field:**
- Type: JSON
- Stores multiple contract addresses: `{identity: "0x...", reputation: "0x...", validation: "0x..."}`
- Added in migrate_add_contracts.py

### Database Migration System [UPDATED: 2025-11-25]

**Auto-migration flow (on main.py startup):**
1. `Base.metadata.create_all()` - Create base table structures
2. `migrate_contracts()` - Add contracts field to networks table
3. `migrate_oasf()` - Add skills/domains fields to agents table
4. `migrate_classification_source()` - Add classification source field
5. `migrate_multi_network()` - Add (token_id, network_id) composite unique index
6. `migrate_network_ids()` - **Fix orphaned network_ids (UUID → network_key)**
7. `init_networks()` - Initialize/update network configuration
8. `startup_event: start_scheduler()` - Start scheduled tasks

**Key Migration Notes:**

- **migrate_network_ids**: Fixes historical data using UUID network_ids
  - Automatically detects and maps old UUIDs to new network_keys (e.g., `sepolia`)
  - Updates agents table and blockchain_syncs table
  - Ensures all agents are associated with the correct network
  - **Must be executed during server deployment**

**Manual Migration Tools:**

```bash
# Local dev: full database reset
./scripts/reset-db.sh --backup --resync

# Docker: fix network_id only (recommended for servers)
./scripts/docker-migrate-network-ids.sh

# Docker: full reset (use with caution, deletes all data)
./scripts/docker-reset-db.sh --backup --resync
```

**Migration Script Locations:**
- `backend/src/db/migrate_*.py` - Individual migrations
- `backend/src/db/reset_database.py` - Full reset tool
- `scripts/docker-migrate-network-ids.sh` - Docker quick fix
- `scripts/docker-reset-db.sh` - Docker full reset

### Startup Flow and Dependency Order

**Backend Startup Order (dev-backend.sh):**
1. Run database migrations (auto-executes all migrate_*.py)
2. Initialize network data (init_networks)
3. Start uvicorn server

**Application Startup Order (main.py):**
1. Base.metadata.create_all() - Create tables
2. migrate_*() - Run all migrations (including network_id fix)
3. init_networks() - Initialize network data
4. startup_event: start_scheduler() - Start scheduled tasks

### Blockchain Configuration (backend/src/core/blockchain_config.py) [UPDATED: 2026-01-12]

**Required Environment Variables:**
- SEPOLIA_RPC_URL: required, startup fails without it
- Loaded from .env file (requires load_dotenv())

**Sync Configuration Parameters (post-RPC optimization):**
- START_BLOCK = 9989393 (contract deployment block, updated Jan 2026)
- BLOCKS_PER_BATCH = 1000 (batch size, reduced 90% from 10000)
- SYNC_INTERVAL_MINUTES = 10 (sync interval, actually controlled by CronTrigger)
- MAX_RETRIES = 1 (reduced from 2, fewer failed retries)
- RETRY_DELAY_SECONDS = 5 (increased from 3, avoids rapid retries)
- REQUEST_DELAY_SECONDS = 0.5 (new: delay between event processing)

**Scheduled Execution Timetable:**
- Blockchain Sync: runs at :00, :10, :20, :30, :40, :50 every hour (144 times/day)
- Reputation Sync: event-driven (listens to NewFeedback/FeedbackRevoked events, zero periodic polling)

### ERC-8004 Jan 2026 Spec Update [UPDATED: 2026-01-27]

> **Mainnet is live**: ERC-8004 officially launched on Ethereum Mainnet on Jan 30, 2026!
>
> **Update History:**
> - Jan 9: Major spec update (feedbackAuth removal, agentWallet verification, etc.)
> - **Jan 27: Mainnet freeze version** (score → value/valueDecimals, tag1 standardization, endpoints → services)
>
> References:
> - Latest Specs: https://eips.ethereum.org/EIPS/eip-8004
> - Registration Best Practices: https://github.com/erc-8004/best-practices/blob/main/Registration.md
> - Reputation Best Practices: https://github.com/erc-8004/best-practices/blob/main/Reputation.md

#### Most Important Changes

**1. Reputation Feedback No Longer Requires Agent Signature Pre-authorization (`feedbackAuth`)**

| Item | Old Version | New Version |
|------|-------------|-------------|
| Interface | `giveFeedback(..., bytes feedbackAuth)` | `giveFeedback(..., string endpoint, ...)` |
| Authorization | Agent must sign feedbackAuth to authorize client | Any clientAddress can submit directly |
| Spam prevention | On-chain pre-authorization | Off-chain filtering + EIP-7702 |

```solidity
// Old interface
giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2,
             string fileuri, bytes32 filehash, bytes feedbackAuth)

// New interface
giveFeedback(uint256 agentId, uint8 score, string tag1, string tag2,
             string endpoint, string feedbackURI, bytes32 feedbackHash)
```

**2. Agent Wallet Address Becomes an On-chain Verifiable Property**

- New reserved metadata key: `agentWallet`
- Cannot be set via `setMetadata()` or `register()`
- Initial value is the owner address
- Updates require **EIP-712 signature** (EOA) or **ERC-1271** (contract wallet) verification
- Resets to zero address after transfer, new owner must re-verify

#### Identity Registry Changes

**Terminology Renames:**
- `tokenId` → `agentId`
- `tokenURI` → `agentURI`
- `agentRegistry` format: `{namespace}:{chainId}:{identityRegistry}`

**New Interfaces:**
- `setAgentURI(uint256 agentId, string agentURI)` - Update Agent URI
- `URIUpdated(uint256 agentId, string agentURI)` - URI update event

**Registration JSON Example Updates:**
- New `web` and `email` endpoint types (supports human-agent interaction)
- MCP `capabilities` changed from `{}` to `[]`
- OASF endpoint version upgraded from `0.7` to `0.8`
- New optional fields: `skills[]`, `domains[]`, `x402Support`, `active`

**Optional: Endpoint Domain Verification**
- Agents can host verification files at `https://{endpoint-domain}/.well-known/agent-registration.json`
- Verifiers can check `registrations` entries match `agentRegistry` + `agentId`

#### Reputation Registry Changes

**New Jan 27 Mainnet Freeze: score → value/valueDecimals**

| Item | Old Version | New Version |
|------|-------------|-------------|
| Score field | `uint8 score` (0-100) | `int128 value` + `uint8 valueDecimals` |
| Supported range | Only 0-100 integers | Decimals, negatives, values > 100 |
| getSummary returns | `(count, averageScore)` | `(count, averageValue, valueDecimals)` |

**Why This Change Matters:**

| Scenario | Old Version | New Version (value, decimals) |
|----------|-------------|-------------------------------|
| Success rate 99.77% | Can only approximate as 100 | (9977, 2) |
| Trading yield -3.2% | Negatives not supported | (-32, 1) |
| Cumulative revenue $556,000 | Max 100 | (556000, 0) |
| Response time 560ms | Out of range | (560, 0) |

**Standardized tag1 Values (Best Practices):**

| tag1 | Measurement Type | Example | value | valueDecimals |
|------|-----------------|---------|-------|---------------|
| `starred` | Quality score (0-100) | 87/100 | 87 | 0 |
| `reachable` | Reachability (binary) | true | 1 | 0 |
| `ownerVerified` | Owner verification | true | 1 | 0 |
| `uptime` | Uptime | 99.77% | 9977 | 2 |
| `successRate` | Success rate | 89% | 89 | 0 |
| `responseTime` | Response time (ms) | 560ms | 560 | 0 |
| `blocktimeFreshness` | Block delay | 4 blocks | 4 | 0 |
| `revenues` | Cumulative revenue | $560 | 560 | 0 |
| `tradingYield` | Trading yield | -3.2% | -32 | 1 |

**Field Type Changes:**
- `tag1`, `tag2`: `bytes32` → `string`
- `fileuri` → `feedbackURI`
- `filehash` → `feedbackHash`
- New `endpoint` parameter

**NewFeedback Event (Mainnet Freeze Version):**
```solidity
event NewFeedback(
    uint256 indexed agentId,
    address indexed clientAddress,
    uint64 feedbackIndex,      // Per-client feedback index
    int128 value,              // New: replaces uint8 score
    uint8 valueDecimals,       // New: decimal places (0-18)
    string indexed tag1,       // string type
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
);
```

**Read API Changes:**
- `getSummary(...)` returns `(count, averageValue, valueDecimals)` instead of `(count, averageScore)`
- `readFeedback(...)` parameter `index` → `feedbackIndex`
- `readAllFeedback(...)` new return value `uint64[] feedbackIndexes`

**Off-chain Feedback JSON Changes:**
- Removed required field: `feedbackAuth`
- Renamed: `proof_of_payment` → `proofOfPayment`
- New optional: `endpoint`, `domain` (OASF defined)

#### Registration File Changes

**New Jan 27 Mainnet Freeze: endpoints → services**

To avoid confusion with the `endpoint` field in feedback (a single route), `endpoints` in Registration JSON has been renamed to `services`:

```json
// Old version
{
  "endpoints": [...]  // Easily confused with feedback endpoint
}

// New version (mainnet)
{
  "services": [...]  // Clearly represents services provided by the agent
}
```

#### Validation Registry Status

> **Note**: The Validation Registry is still under active discussion with the TEE community and will receive follow-up updates later this year.

#### Current Network Status [UPDATED: 2026-03-09]

All 21 mainnet networks use CREATE2 deterministic deployment (same contract addresses).
QuikNode multi-chain RPC covers 17/21 networks; 4 require dedicated RPC env vars.

| Network | Chain ID | QuikNode Slug | Notes |
|---------|----------|---------------|-------|
| **Abstract** | 2741 | `abstract-mainnet` | |
| **Arbitrum** | 42161 | `arbitrum-mainnet` | |
| **Avalanche** | 43114 | `avalanche-mainnet` | Needs `/ext/bc/C/rpc` suffix |
| **Base** | 8453 | `base-mainnet` | |
| **BNB Smart Chain** | 56 | `bsc` | |
| **Celo** | 42220 | `celo-mainnet` | |
| **Ethereum** | 1 | `""` (root) | Mainnet live (Jan 30, 2026) |
| **Gnosis** | 100 | `xdai` | |
| **GOAT Network** | 2345 | - | Needs `GOAT_RPC_URL` |
| **Linea** | 59144 | `linea-mainnet` | |
| **Mantle** | 5000 | `mantle-mainnet` | |
| **MegaETH** | 4326 | `megaeth-mainnet` | |
| **Metis** | 1088 | - | Needs `METIS_RPC_URL` |
| **Monad** | 143 | `monad-mainnet` | |
| **Optimism** | 10 | `optimism` | |
| **Polygon** | 137 | `matic` | |
| **Scroll** | 534352 | `scroll-mainnet` | |
| **SKALE** | 1187947933 | - | Needs `SKALE_RPC_URL` |
| **Soneium** | 1868 | `soneium-mainnet` | |
| **Taiko** | 167000 | - | Needs `TAIKO_RPC_URL` |
| **XLayer** | 196 | `xlayer-mainnet` | |
| Sepolia | 11155111 | `ethereum-sepolia` | Testnet, disabled |

**Unified Mainnet Contract Addresses (CREATE2 Deterministic Deployment):**
- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Validation Registry: Pending deployment

**Sepolia Testnet Contract Addresses (Development Only):**
- Identity Registry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

#### Code Adaptation Checklist [UPDATED: 2026-01-27]

**Jan 9 Update (Completed):**
- [x] Updated ABI files: Identity and Reputation Registry ABIs updated
- [x] Updated `getSummary()` calls: tag1/tag2 parameters changed from `bytes32` to `string`
- [x] Updated feedback event parsing: supports both old and new tag formats
- [x] Added `endpoint` and `feedbackIndex` field support
- [x] Compatible with `feedbackURI` (new) and `feedbackUri` (old) field names

**Jan 27 Mainnet Freeze Update (Completed):**
- [x] Updated Reputation ABI: NewFeedback event score → value/valueDecimals
- [x] Updated Reputation ABI: getSummary returns (count, averageValue, valueDecimals)
- [x] Updated Feedback database model: score → value/value_decimals fields
- [x] Created database migration script: `migrate_feedback_value.py`
- [x] Updated blockchain_sync.py: event parsing adapted for new format
- [x] Updated reputation_sync.py: getSummary result processing
- [x] Updated frontend type definitions: Feedback interface with value/value_decimals
- [x] Updated frontend components: FeedbackList supports formatted display for multiple tag1 types

**Pending:**
- [ ] Consider supporting `agentWallet` verification flow (EIP-712/ERC-1271)
- [ ] Optional: implement Endpoint Domain Verification
- [x] Support `services` field in Registration (backward compatible with `endpoints`)

**Command to Disable Other Networks (Production):**
```bash
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import Network

db = SessionLocal()
deleted = db.query(Network).filter(Network.id != 'sepolia').delete()
db.commit()
print(f'Deleted {deleted} networks, keeping Sepolia only')
db.close()
"
```

**Configuration File Locations:**
- Network config: `backend/src/core/networks_config.py`
- Network initialization: `backend/src/db/init_networks.py`
- API Schema: `backend/src/api/networks.py`
- ABI files: `backend/src/abi/` (need to be updated to match new interfaces)

### API Design Patterns

**Pagination and Filtering:**
```python
# agents.py
GET /api/agents?tab={all|active|new|top}&page=1&page_size=20&search=query
```

**Tab Filtering Logic:**
- all: All agents
- active: created_at within the last 7 days
- new: created_at within the last 24 hours
- top: Sorted by reputation_score descending

**Statistics Caching:**
- /api/stats includes blockchain_sync field
- Frontend refreshes every 10 seconds (useEffect interval)

## Common Patterns

### Adding a New API Endpoint

1. Create or modify a route file in `backend/src/api/`
2. Define routes using APIRouter
3. Include the router in `main.py`
4. Data models in `models/`, response schemas in `schemas/` (if needed)

### Adding a New Frontend Page

1. Create a directory and `page.tsx` in `frontend/app/`
2. Use "use client" directive (if client-side state is needed)
3. Add API call functions in `lib/api/services.ts`
4. Type definitions in `types/index.ts`

### Adding a New Database Migration

1. Create `migrate_*.py` in `backend/src/db/`
2. Use sqlite3 directly (ALTER TABLE, etc.)
3. Implement a migrate() function with idempotency checks
4. Import and call it in `main.py`
5. Test locally: restart backend to verify migration success
6. Test Docker: `docker compose restart backend` to verify

### Server Deployment and Database Migration [NEW: 2025-11-25]

**First Server Deployment (Docker):**

```bash
# 1. Pull latest code
git pull origin master

# 2. Start containers (automatically runs all migrations)
docker compose up -d

# 3. View migration logs
docker compose logs backend | grep -E "Migration|migrate"

# 4. Verify network data
docker compose exec backend sh -c "cd /app && uv run python -c \"
from src.db.database import SessionLocal
from src.models import Network, Agent
db = SessionLocal()
print(f'Networks: {db.query(Network).count()}')
print(f'Agents: {db.query(Agent).count()}')
db.close()
\""
```

**Fix network_id Issues on Server (Recommended):**

If the frontend can't see networks like Sepolia on the server, use this script to fix (without deleting data):

```bash
# Run network_id migration
./scripts/docker-migrate-network-ids.sh

# The script automatically:
# 1. Checks for orphaned network_ids
# 2. Maps UUID → network_key
# 3. Verifies fix results
# 4. Shows agent count per network

# No restart required, but recommended to ensure frontend refresh
docker compose restart backend
```

**Full Server Reset (Use with Caution):**

Only use when a complete re-sync of blockchain data is needed:

```bash
# Full reset (deletes all data)
./scripts/docker-reset-db.sh --backup --resync

# The script automatically:
# 1. Backs up current database
# 2. Drops all tables
# 3. Rebuilds table structures
# 4. Runs all migrations
# 5. Initializes network configuration
# 6. Resets sync state
# 7. Restarts backend container
```

**Troubleshooting:**

```bash
# Check container status
docker compose ps

# View backend logs
docker compose logs -f backend

# Enter container for manual inspection
docker compose exec backend sh

# View database table structure
docker compose exec backend uv run python -c "
import sqlite3
conn = sqlite3.connect('8004scan.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(agents)')
print([col[1] for col in cursor.fetchall()])
"

# Check network-agent associations
docker compose exec backend sh -c "cd /app && uv run python -c \"
from src.db.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
result = db.execute(text('''
    SELECT n.name, COUNT(a.id)
    FROM networks n
    LEFT JOIN agents a ON n.id = a.network_id
    GROUP BY n.id
'''))
for name, count in result:
    print(f'{name}: {count} agents')
db.close()
\""
```

### Responsive Component Implementation

```tsx
{/* Desktop version */}
<div className="hidden md:flex ...">...</div>

{/* Mobile version */}
<div className="flex md:hidden ...">...</div>
```

## Development Workflow

### Standard Flow for Adding New Features

1. Backend: Define data models (models/)
2. Backend: Implement business logic (services/ or directly in API)
3. Backend: Create API endpoints (api/)
4. Frontend: Define TypeScript types (types/)
5. Frontend: Add API calls (lib/api/services.ts)
6. Frontend: Implement UI components (components/)
7. Frontend: Create or update pages (app/)

### Database Model Modification Flow

1. Modify model definitions in models/*.py
2. Create migration script migrate_*.py
3. Call migration in dev-backend.sh or main.py
4. Test migration idempotency (multiple runs without errors)

### Environment Variable Modification Flow

1. Update backend/.env.example
2. Update backend/.env
3. Add load_dotenv() in the relevant config.py
4. Update environment variable documentation in README.md

## Known Issues and Solutions

### Database Migration Failure

**Problem:** Migration script cannot find DATABASE_URL from .env file
**Solution:** Add at the top of the migration script:
```python
from dotenv import load_dotenv
load_dotenv()
```

### SEPOLIA_RPC_URL Undefined on Backend Startup

**Problem:** blockchain_config.py is imported before .env is loaded
**Solution:** Add load_dotenv() at the top of blockchain_config.py

### Mobile Sync Status Overlap

**Problem:** Absolute-positioned sync status overlaps with the title
**Solution:** Create two versions - mobile uses normal document flow, desktop uses absolute positioning

### Docker Image Pull Failure

**Problem:** Docker Hub connection issues (common in mainland China)
**Solution:** Use local development environment (./scripts/dev-backend.sh) instead of Docker

## File Organization Rules

- Python files must not exceed 300 lines
- TypeScript/JavaScript files must not exceed 300 lines
- No more than 8 files per directory level
- Documentation goes in docs/ (official docs) or discuss/ (discussions and history)

## Documentation Structure

### docs/ - Official Documentation

- **DEPLOYMENT.md** - Complete deployment guide (local dev, Docker deployment, production)
- **erc8004-mainnet-freeze-update.md** - ERC-8004 mainnet freeze update doc [NEW: 2026-01-27]
- **oasf-classification.md** - OASF auto-classification feature docs
- **background-classification-guide.md** - Async batch classification usage guide
- **classification-validation-rules.md** - Classification validation rules and standards
- **reputation_sync_design.md** - Reputation system design doc
- **rpc-optimization-final.md** - Complete RPC request optimization doc (event-driven architecture)

### discuss/ - Discussions and History

- Archived deployment docs (DOCKER_DEPLOYMENT.md, production-deployment.md)
- Historical summary docs (oasf-upgrade-summary.md, implementation-summary.md)
- Test records (llm-classification-test-results.md)
- Temporary troubleshooting docs (ssl-certificate-troubleshooting.md, etc.)

### scripts/ - Run Scripts

**Core Development Scripts:**
- dev-backend.sh - Start backend dev server
- dev-frontend.sh - Start frontend dev server
- dev-all.sh - Start both frontend and backend
- init-networks.sh - Initialize network data
- migrate-db.sh - Run database migrations

**Docker Deployment Scripts:**
- docker-deploy.sh - Deploy full application
- docker-check-env.sh - Check environment configuration
- docker-logs.sh - View container logs
- docker-restart.sh - Restart services
- docker-stop.sh - Stop services

**Utilities:**
- check-nginx-config.sh - Nginx config check (production helper)

**Archived Scripts:**
- scripts/archive/ - Temporary diagnostic scripts (diagnose-nginx-redirect.sh, etc.)

## API Documentation

Backend API docs are auto-generated. After starting the service, visit:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## OASF Classification (NEW - 2025-11-14)

### Overview

Agentscan now integrates the complete OASF v1.0 taxonomy system, automatically labeling AI Agents with skills and domains tags.

### Key Features

1. **Complete OASF v1.0 Specification**
   - **136 Skills**: Covering NLP, CV, Agent orchestration, Data engineering, and 15 other major categories
   - **204 Domains**: Covering Technology, Finance, Healthcare, Education, and 25 other major fields
   - Data source: https://github.com/agent0lab/agent0-py

2. **Smart Classification Strategy**
   - **Priority 1**: Extract directly from metadata `endpoints[].skills/domains` (OASF standard format)
   - **Priority 2**: Use LLM to intelligently analyze agent description
     - DeepSeek (recommended): cost-effective
     - OpenAI: GPT-4o-mini
     - OpenRouter: unified interface supporting multiple models
     - Anthropic Claude: backward compatible
   - **Priority 3**: Simple keyword-based classification (no API key needed)

3. **Automation Flow**
   - Automatic classification on new agent registration
   - Re-classification on metadata updates
   - Supports manual trigger for single or batch classification

### Core Files

```
backend/src/
├── taxonomies/
│   ├── all_skills.json        # 136 skills (46KB, from agent0-py)
│   ├── all_domains.json       # 204 domains (73KB, from agent0-py)
│   └── oasf_taxonomy.py       # Python module (dynamically loads JSON)
├── services/
│   └── ai_classifier.py       # AI classification service
└── api/
    └── classification.py      # Classification API endpoints

frontend/
├── components/agent/
│   └── OASFTags.tsx           # Tag display component
└── types/index.ts             # Agent type definitions (includes skills/domains)
```

### API Endpoints

```bash
# Manually classify a single agent
POST /api/agents/{agent_id}/classify

# Batch classify all unclassified agents
POST /api/agents/classify-all?limit=100

# Get all available skills/domains
GET /api/taxonomy/skills
GET /api/taxonomy/domains
```

### Frontend Display

- **List page**: Agent cards show up to 3 tags (skills in blue, domains in purple)
- **Detail page**: Separate "OASF Taxonomy" card with full display grouped by category

### Configuration (Optional)

Configure LLM provider in `backend/.env` to enable smart classification:

```bash
# Choose provider: deepseek, openai, openrouter, anthropic
LLM_PROVIDER=deepseek

# Configure the API key for your chosen provider
DEEPSEEK_API_KEY=sk-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# OPENROUTER_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

If no API key is configured, the system falls back to keyword-based basic classification.

### Related Documentation

- Full feature documentation: `docs/oasf-classification.md`
- Background classification guide: `docs/background-classification-guide.md`
- Validation rules: `docs/classification-validation-rules.md`
- Upgrade summary: `discuss/oasf-upgrade-summary.md` (historical)
- OASF specification: https://github.com/agntcy/oasf

## External Dependencies

### Blockchain
- Web3.py: Multi-chain interaction (21 mainnet networks)
- QuikNode: Multi-chain RPC provider (17/21 networks)
- IPFS: Metadata storage (accessed via public gateways)

### AI & Classification
- LLM providers (optional): DeepSeek, OpenAI, OpenRouter, Anthropic Claude
- OASF v1.0: Open Agent Service Framework standard (agntcy/oasf)

### Backend Key Dependencies
- FastAPI: Web framework
- SQLAlchemy 2.x: ORM
- APScheduler: Scheduled tasks
- structlog: Structured logging
- httpx: Async HTTP client
- uv: Package manager (replaces pip/poetry)

### Frontend Key Dependencies
- Next.js 16.0.1 (App Router, not Pages Router)
- React 19.2.0
- Tailwind CSS v4
- TypeScript 5.x

## RPC Optimization and Event-Driven Architecture (NEW - 2025-11-15)

### Background

Issues before optimization:
- Daily RPC requests reached 686K
- 328K 429 errors (too many requests)
- Reputation polled all agents every 30 minutes (1777+ agents x 48 times/day = 85K times/day)

### Revolutionary Improvement: Event-Driven Reputation

**Before (Full Polling):**
- Queried all agents' reputation every 30 minutes
- 85,296 getSummary() calls per day
- 99% of requests were wasted (most agents had no new feedback)

**After (Event-Driven):**
- Listens to on-chain `NewFeedback` and `FeedbackRevoked` events
- **Zero periodic polling**
- Only queries the corresponding agent when new feedback arrives
- ~50-100 getSummary() calls per day
- **99.88% reduction**

### Optimization Results

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Blockchain sync | 288/day | 144/day | 50% |
| Reputation sync | 48/day | 0/day (event-driven) | 100% |
| Reputation requests | 85,296/day | ~100/day | 99.88% |
| **Total requests** | **~686K/day** | **~300K/day** | **56%** |
| 429 error rate | 32.8% | < 0.1% | 99% |
| **Credit cost** | **$X/day** | **$0.44X/day** | **56%** |

### Core Implementation

**File**: `backend/src/services/blockchain_sync.py`

```python
# Listen to reputation events during blockchain sync
feedback_events = self.reputation_contract.events.NewFeedback.get_logs(
    from_block=from_block,
    to_block=to_block
)

# Only update agents with new feedback
for event in feedback_events:
    await self._process_feedback_event(db, event)
```

**File**: `backend/src/services/scheduler.py`

```python
# Blockchain sync: every 10 minutes (fixed-time trigger)
scheduler.add_job(
    sync_blockchain,
    trigger=CronTrigger(minute='*/10'),
    ...
)

# Reputation sync: completely removed, now event-driven
# No scheduled task needed
```

### Architecture Advantages

1. **Excellent scalability**: Reputation cost remains nearly constant as agent count grows
2. **Better real-time performance**: Update latency reduced from 30 min → 10 min
3. **Zero waste**: Every request is meaningful, no useless polling
4. **Fixed-time triggers**: Avoids request spikes at startup

### Related Documentation

Full optimization documentation: `docs/rpc-optimization-final.md`

### Monitoring Commands

```bash
# View sync tasks
tail -f backend/logs/*.log | grep -E 'sync_started|events_found|reputation_updated_from_event'

# View reputation event statistics
tail -f backend/logs/*.log | grep 'NewFeedback\|FeedbackRevoked'
```
