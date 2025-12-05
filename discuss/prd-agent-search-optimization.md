# PRD: Agent Search Optimization (Agent0 SDK-Aligned)

> **Doc version**: v1.1 (rewrite)  
> **Date**: 2025-12-05  
> **Status**: Draft for review  
> **Benchmarks**: Taobao/JD search UX, OpenSea discovery, Hugging Face tag search

---

## 1. Context & Goals

### 1.1 Background
Agentscan is an ERC-8004 agent explorer. With 5000+ agents registered, users need faster, more guided discovery across identities, MCP tools, A2A skills, OASF taxonomies, and on-chain reputation. Agent0 SDK v0.31 already provides:
- `searchAgents` with name/attribute filters and multi-chain support (Sepolia, Base Sepolia, Polygon Amoy, or `chains: all`)
- Reputation-aware discovery via `searchAgentsByReputation` and `getReputationSummary`
- OASF skill/domain taxonomies packaged in `src/taxonomies/all_skills.json` and `all_domains.json`
- Capability extraction from MCP/A2A endpoints for tooling and skill signals
- Chain-agnostic IDs (`chainId:agentId`) and x402 awareness for payments

### 1.2 Current Search (baseline)
- Basic text search: name/address/description
- Tabs: All/Active/New/Top
- Network filters (Sepolia, Base Sepolia, etc.)
- Reputation score range filter
- OASF labels displayed (skills/domains)

### 1.3 Pain Points
- No search history or hot terms
- No autocomplete or suggestions
- OASF taxonomy not usable as filters
- No multi-dimensional recommendations
- No keyword highlighting
- Navigation feels unlike “e-commerce grade” category browsing

### 1.4 Objectives
Upgrade discovery to an “AI Agent marketplace”:
1. Find the right agent within 3 seconds of typing (measured from first keystroke to suggestion click/load).
2. Increase discovery: higher engagement with taxonomy filters and recommendations.
3. Lower onboarding cost: first-time users can filter without learning ERC-8004 jargon.
4. Conversion: +30% uplift from search results to agent detail views.

---

## 2. Users & Scenarios

### 2.1 Personas
| Type | Traits | Core needs |
| --- | --- | --- |
| Developer | Integrates agents into products | Precise skill/domain and chain filters; MCP tool awareness |
| Investor | Evaluates value/risk | Sort by reputation, activity, on-chain history |
| End-user | Tries AI services | Hot trends, quick category browse |
| Researcher | Ecosystem insights | Multi-chain stats, taxonomy slices |

### 2.2 Scenarios
- Precision search: “DeFi trading agent” → suggestions → finance domain prefilter → multi-chain results.
- Category browse: land on “NLP” or “Blockchain” skill clusters directly.
- Trend discovery: “What’s new and hot this week?” → hot searches + recently registered + top reputation.
- Side-by-side comparison: compare 2–4 trading bots on chain, reputation, skills, MCP tools, and domains.

---

## 3. Feature Requirements

### 3.1 Search Box Enhancements
#### 3.1.1 Smart Suggestions (Autocomplete)
- Suggest agents (by name/description), OASF skills, domains, and recent history while typing.
- Debounce 150 ms; max: 5 agents + 4 tags + 3 history; keyboard navigation.
- Source: `searchAgents` (with `highlight=true`), taxonomy files, local history.

#### 3.1.2 Hot Search
- On focus with empty input, surface hot queries and hot skills/domains.
- Data: last 7-day top queries + operator-curated seeds; fallback to `searchAgents` top results by reputation/activity.

#### 3.1.3 Search History
- Store last 20 queries in `localStorage`; per-entry `query`, `timestamp`, `resultCount`.
- Optional signed-in sync to backend; allow delete single/clear all.

### 3.2 Taxonomy Navigation
#### 3.2.1 Primary Nav (skills/domains)
- Map OASF skills (15 clusters) and domains (top 10 by usage) into a horizontal or left rail nav.
- Uses SDK taxonomy files for labels; counts from `taxonomy/stats` (see API).

#### 3.2.2 Secondary Panel
- Hover/expand shows subcategories with counts and hot agents (from `searchAgents` filtered by skill/domain, sorted by reputation + recency).

#### 3.2.3 Active Filter Chips
- Chips show applied filters (network, skills, domains, reputation, status, chain scope); one-click removal; “Clear all”.

### 3.3 Advanced Filters
#### 3.3.1 Filter Panel
- Network: All / Sepolia / Base Sepolia / Polygon Amoy / custom chain list.
- Skills & Domains: multi-select (OR logic), searchable; show counts.
- Reputation slider: min/max (integrates with `searchAgentsByReputation` for high-accuracy sorting).
- Created time: presets (24h/7d/30d/custom).
- Status: Active / Inactive / Validating.
- Actions: Reset / Apply; URL-synced.

#### 3.3.2 Tag Selector Modal
- Searchable tree for skills/domains; shows per-tag agent counts; confirm to apply.

### 3.4 Results Experience
#### 3.4.1 Sorting
- Options: Comprehensive (default), Hot, Newest, Highest Reputation, Name A–Z.
- Comprehensive formula:
```
score = 0.35 * reputation_normalized
      + 0.25 * activity_recency
      + 0.25 * text_relevance
      + 0.15 * taxonomy_coverage
```
- `reputation_normalized` from SDK reputation endpoints; `taxonomy_coverage` from MCP/A2A-extracted skills/tools presence.

#### 3.4.2 Keyword Highlight
- Return highlight snippets for name/description/skills; show matched MCP tools and OASF tags.

#### 3.4.3 View Modes
- Card view (current) and list view (compact, selectable rows).
- Bulk actions: compare selected (2–4), export CSV of current result slice.

#### 3.4.4 Agent Comparison
- Columns: network(s), reputation (score + count), status, created time, MCP tools, A2A skills, OASF domains, owner.
- Support mixed chains via `chainId:agentId`.

### 3.5 Homepage Entry
- Hero search with hot terms; quick-launch tiles for top categories (e.g., NLP, DeFi, Gaming, Code, Vision, Tools, RAG, NFT).
- Mobile: carousel for categories; desktop: grid tiles.

### 3.6 Recommendations
#### 3.6.1 “For You”
- Lightweight collaborative filtering using viewed agents and search history:
  - Extract preferred skills/domains/tools from history.
  - Query `searchAgents` with overlaps, exclude viewed; sort by reputation + recency.

#### 3.6.2 “Similar Agents”
- On detail page, list agents sharing skills/domains/MCP tools via `searchAgents` filters.

---

## 4. API & Data Requirements

### 4.1 New/Extended Endpoints
- `GET /api/search/suggestions?q={query}&limit=10`  
  - Returns agents (with highlights), skills, domains, history hints.
- `GET /api/search/hot?limit=10`  
  - Returns hot queries/skills/domains; merges 7d stats + curated seeds.
- `GET /api/taxonomy/stats`  
  - Returns skill/domain counts (by category) sourced from OASF taxonomies + agent counts.
- `GET /api/agents/recommendations?based_on={agent_id}&limit=10`  
  - For “similar agents” (shared skills/domains/tools).
- `GET /api/agents` (enhanced)  
  - New params: `skills`, `domains`, `created_after`, `created_before`, `sort=comprehensive|hot|newest|reputation|name`, `highlight=true`, `chains` (array or `all`), `status`, `limit`, `cursor`.
- `GET /api/agents/reputation`  
  - Wrapper around SDK `searchAgentsByReputation` for server-side scoring.

### 4.2 Data Models
- `SearchLog`: query, user/session, result_count, clicked_agent_id, created_at (drives hot search and cold-start fallback).
- `UserPreference` (optional): user_id, preferred_skills/domains, viewed_agent_ids, updated_at (for “For You”).

### 4.3 SDK Alignment
- Use SDK taxonomy JSON for skills/domains to avoid drift.
- Use `searchAgents` for suggestions, listings, multi-chain queries, and `searchAgentsByReputation` for high-trust ordering.
- Store and display chain scope: show successful/failed chains from SDK meta to explain partial results.
- Respect chain-agnostic IDs and x402 capability flags in result cards and filters.

---

## 5. UX Principles
- Keep monochrome tech aesthetic; add highlight color `#fef08a` for matches, `#fecaca` for hot tags, and `#0a0a0a` for selected states.
- Responsive:
  - Mobile: horizontal nav for categories, full-screen suggestions, bottom drawer filters, 2-column comparison max.
  - Desktop: full nav rail, inline suggestions, side filter panel, up to 4-way comparison.
- Motion: suggestion dropdown fade + slide (150 ms), filter panel slide (200 ms), highlight pulse (300 ms), skeleton shimmer for loading.

---

## 6. Technical Approach

### 6.1 Frontend
- Framework: existing stack (Next/React); React Query for data + caching.
- Debounce 150 ms on typeahead; keep last query cache for back/forward nav.
- State: Zustand for search/filter state; URL sync via `next/navigation` or `nuqs`.
- Virtualization: `@tanstack/react-virtual` for large result sets.
- Highlight rendering from `highlight=true` payload; fallback client-side substring match.

### 6.2 Backend
- Search: current DB with FTS (SQLite FTS5 or PostgreSQL). Keep ES migration path.
- Hot terms: Redis sliding window counters fed by `SearchLog`.
- Recommendations: tag-overlap collaborative filtering; exclude viewed agents.
- Multi-chain: proxy SDK `searchAgents`/`searchAgentsByReputation` with `chains` support; surface meta for partial successes.
- Taxonomy: load OASF JSON once; cache counts; expose via `taxonomy/stats`.

### 6.3 Performance Targets
| Metric | Target |
| --- | --- |
| Suggestions API | < 100 ms |
| Results API | < 300 ms |
| First contentful render | < 2 s |
| Filter apply latency | < 200 ms |

### 6.4 Subgraph vs. Local Database
- Subgraph strengths: ready multi-chain indexing, fast reads, consistent on-chain truth, no local ETL; ideal for chain metadata, registrations, ownership, status, and reputation summaries when indexed; exposes meta for successful/failed chains.
- Subgraph limits: basic text relevance and highlighting; autocomplete/hot search/recommendations not on-chain; taxonomy coverage requires explicit indexing; complex joins can be slower.
- Local DB strengths: flexible FTS/highlight, custom scoring (comprehensive score), easy joins with MCP tools/A2A skills/taxonomy stats and user signals (history, clicks, preferences); better for hot terms, suggestions, and recommendations.
- Local DB limits: sync/ingestion overhead; freshness depends on cadence; ops to maintain.
- Recommended hybrid: treat subgraph as source of truth and multi-chain fetch layer; ingest into local search index (SQLite FTS5/Postgres) via schedule or events; use local index for relevance, highlights, taxonomy counts, hot terms, and recs; surface subgraph meta to explain partial-chain results.


## 7. Phased Delivery
- **Phase 1 (2 wks)**: Autocomplete, history, hot search, multi-select skills/domains API, highlight support.
- **Phase 2 (2 wks)**: Category nav + secondary panels, filter chips, taxonomy stats API.
- **Phase 3 (1.5 wks)**: Sorting revamp, list view, URL sync, comparison baseline.
- **Phase 4 (1.5 wks)**: Similar/for-you recommendations, homepage hero tiles, mobile polish.
