# Codex Progress - 2026-04-21

## Scope

Current workstream: expand `agentscan` from a registry-first explorer into a denser agent index with ecosystem-aware discovery, while keeping `ERC-8004` as the primary anchor.

This document captures implementation status, not target-state design. For the broader architecture and product plan, see:

- [agent-economy-upgrade-design.md](/Users/ouzm/Code/work-repo/agentscan/docs/agent-economy-upgrade-design.md)

## Completed

### Backend foundation

- Added ecosystem-oriented data models:
  - `agent_ecosystem_links`
  - `agent_capabilities`
  - `agent_activity_snapshots`
  - `ingestion_runs`
- Added migration support for the new ecosystem tables.
- Extended `/api/agents` so list/detail responses include:
  - `ecosystems`
  - `capabilities`
- Added ecosystem-aware filtering for:
  - `ecosystem`
  - `capability`
- Added ecosystem summary API:
  - `GET /api/ecosystems/summary`

### Virtuals ACP ingestion

- Researched `acp-cli` and confirmed:
  - CLI `browse` is not the right server-side ingestion path
  - underlying public ACP search is the usable discovery source
- Implemented `Virtuals ACP` ingestion against the ACP public search API.
- Added ingestion service:
  - [virtuals_acp_ingestion.py](/Users/ouzm/Code/work-repo/agentscan/backend/src/services/virtuals_acp_ingestion.py)
- Added manual runner:
  - [ingest_virtuals_acp.py](/Users/ouzm/Code/work-repo/agentscan/backend/src/scripts/ingest_virtuals_acp.py)
- Added ingestion endpoints:
  - `POST /api/ecosystems/virtuals-acp/ingest`
  - `GET /api/ecosystems/virtuals-acp/ingest/status`
- Confirmed a real ingestion run succeeds and writes ACP-linked agents plus capability/activity records.

### Frontend structure

- Added top-level `Ecosystems` entry in site navigation.
- Added ecosystem landing page.
- Added dedicated `Virtuals ACP` page:
  - `/ecosystems/virtuals-acp`
- Added ecosystem/capability filters to the `Agents` page.
- Fixed `quality=basic` interaction so ecosystem-filtered pages do not appear empty.

### Frontend density and index-style UI

- Reworked `Agents` into a denser list/table view.
- Added local row ordering controls on `Agents`:
  - `Updated`
  - `Trust`
  - `Name`
- Added visible-column toggles on `Agents`.
- Reworked homepage away from sparse cards into:
  - main list
  - side panels
  - denser index-style layout
- Reworked `Leaderboard`, `Networks`, and `Insights` with:
  - compact metric rows
  - side panels
  - denser comparison surfaces
- Reworked `Virtuals ACP` roster from cards into a denser table.

### Content and terminology cleanup

- Removed explicit `CMC` wording from user-visible UI.
- Replaced the ambiguous `Surface` label in primary tables with `Signals`.
- Restored blockchain/network icons in key browsing paths:
  - homepage table
  - homepage side panels
  - `Agents` list
- Fixed empty `Signals` for pure `ERC-8004` agents by adding registry-native signals:
  - `ERC-8004`
  - `Agent Wallet`
  - `Active` (when present)

## Current product state

### What the site does well now

- Shows `ERC-8004` agents plus linked ecosystem data in one UI.
- Supports ecosystem-aware browsing and filtering.
- Has a real ACP ecosystem page instead of only generic filtered search.
- Uses denser list/table layouts that fit an index-style product better.

### What is still true

- `ERC-8004` remains the primary anchor.
- ACP is currently the only ecosystem with actual ingestion implemented.
- Some scoring/trust surfaces are still sparse or incomplete.
- Ecosystem capability signals are observed/mapped signals, not guaranteed runtime verification.

## Not completed yet

### Data/model

- No full canonical-agent layer yet.
- Identity merge remains lightweight.
- No strong cross-source resolution across:
  - `ERC-8004`
  - `ACP`
  - future `BNB`
  - future `AgentKit/x402`

### Ingestion

- No scheduler-based recurring ACP ingestion yet.
- ACP ingestion is query-seed based discovery, not full marketplace sync.
- No BNB ingestion yet.
- No AgentKit/x402 ingestion yet.

### MCP / API evolution

- MCP v2 tools described in the design doc are not fully implemented yet.
- Actionability endpoints such as `prepare_invocation` are not built yet.
- `find_unmapped_agents` is not built yet.

### Frontend / UX

- Homepage copy and layout still need another cleanup pass for consistency.
- Some labels remain slightly abstract.
- Trust-related views should be de-emphasized where data coverage is still weak.
- There is no strong provenance UI yet for explaining where each signal came from.

## Risks / caveats

- ACP public search is useful for discovery but is not a guaranteed full-fidelity source.
- Current rankings can look more authoritative than the underlying data coverage justifies.
- Mixing registry-native and ecosystem-ingested rows in one index is useful, but the merge logic is still shallow.
- WalletConnect is emitting repeated init warnings in dev; this does not block UI work, but it should be cleaned up separately.

## Recommended next steps

### P0

- Add recurring scheduler support for ACP ingestion.
- Build `unmapped opportunities` based on ACP vs `ERC-8004`.
- Continue tightening homepage and list copy so every major label is literal and low-ambiguity.

### P1

- Introduce stronger canonical-agent resolution.
- Implement first-pass `BNB` capability ingestion.
- Implement first-pass `AgentKit/x402` capability ingestion.

### P2

- Add provenance UI for each signal.
- Build `get_agent_profile`, `resolve_agent_endpoints`, and `compare_agents`.
- Add invocation/payment preparation surfaces after capability data is reliable enough.

## Verification

Verified during this workstream:

- `Virtuals ACP` ingestion runs successfully.
- Frontend `npm run type-check` passes after the current UI changes.
- Local frontend is running and hot-reloading on:
  - `http://localhost:3002`
- Local backend is running on:
  - `http://localhost:8000`
