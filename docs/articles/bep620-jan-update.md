# BEP-620: Bringing AI Agent Identity to BNB Smart Chain

*The BSC-native implementation of the ERC-8004 standard — enabling verifiable AI agent identity with the speed and cost-efficiency of BNB Chain.*

---

## Introduction: Why BNB Chain Needs Agent Identity

As AI agents become integral to the Web3 ecosystem, BNB Smart Chain is emerging as a natural home for agent-based applications. With over **$5B in TVL**, **4M+ daily transactions**, and one of the most active developer communities in Web3, BSC is perfectly positioned to become a hub for AI agent deployment.

But there's a challenge: **how do you trust an agent you've never met?**

This is where **BEP-620** comes in — the BNB Chain native implementation of the ERC-8004 AI Agent Identity Standard.

---

## What is BEP-620?

BEP-620 is the **official BSC implementation** of the ERC-8004 standard, designed to provide:

- **Verifiable Identity**: On-chain registration for AI agents with unique `agentId`
- **Portable Reputation**: Immutable feedback records that follow agents across platforms
- **Cross-Chain Compatibility**: Seamless identity resolution with Ethereum and other ERC-8004 networks
- **BSC-Optimized**: Leveraging BNB Chain's low fees and fast finality

### The Three Pillars of BEP-620

| Registry | Function | Key Features |
|----------|----------|--------------|
| **Identity** | Agent Registration | Metadata URI, Wallet Verification, Domain Verification |
| **Reputation** | Feedback System | Permissionless Reviews, Skill/Domain Tags, Endpoint-level |
| **Validation** | TEE Attestation | Code Verification (Coming 2026 H2) |

---

## January 2026 Protocol Upgrade: What's New

The ERC-8004 specification underwent a **major revision on January 9, 2026**, and BEP-620 inherits all these improvements.

### 1. Permissionless Feedback (Biggest Change!)

Agents **no longer need to pre-authorize feedback**. The `feedbackAuth` parameter has been completely removed.

| Aspect | Before (Oct 2025) | After (Jan 2026) |
|--------|-------------------|------------------|
| Authorization | Agent must sign for each client | Any address can submit directly |
| Anti-spam | On-chain pre-authorization | Off-chain filtering + address tracking |
| Gas Cost | Higher (signature verification) | Lower |

**Only `agentId` and `score` are required** — all other fields (tags, endpoint, feedbackURI) are optional.

### 2. Human-Readable Tags

Tags changed from cryptic `bytes32` to clear `string` format:

| Before | After |
|--------|-------|
| `0x636f64655f726576696577...` | `"code_review"` |
| Hard to decode | Clear and readable |

### 3. New Feedback Index System

Every feedback now has a unique `feedbackIndex` per client:

| Feature | Benefit |
|---------|---------|
| Per-client indexing | Efficient retrieval of specific feedback |
| `readAllFeedback()` returns `feedbackIndexes[]` | Easy batch processing |
| `includeRevoked` parameter | Control whether to include revoked feedback |

### 4. Agent Wallet Verification (On-Chain)

Agent wallet addresses moved from off-chain to **reserved on-chain metadata** with cryptographic verification:

| Property | Detail |
|----------|--------|
| Initial value | Set to owner's address |
| Update method | EIP-712 signatures (EOA) or ERC-1271 (smart contracts) |
| On transfer | Resets to zero address, requires re-verification |
| Security | Cannot be set via `setMetadata()` or `register()` |

### 5. Endpoint-Level Granularity

New `endpoint` parameter allows **service-specific feedback**:

- An agent might have multiple endpoints (trading, analytics, chat)
- Users can rate each endpoint separately
- More precise reputation data

### 6. New Endpoint Types

| Type | Use Case |
|------|----------|
| `mcp` | Machine-to-machine via MCP protocol |
| `web` | Human interaction via browser (NEW) |
| `email` | Human interaction via email (NEW) |
| `api` | Traditional REST API |

### 7. Domain Verification (Optional)

Agents can now prove endpoint domain ownership:

| Step | Action |
|------|--------|
| 1 | Host verification file at `https://{domain}/.well-known/agent-registration.json` |
| 2 | Include `registrations` array with `agentRegistry` + `agentId` |
| 3 | Verifiers can check domain ownership cryptographically |

### 8. OASF v0.8.0 Support

Full support for the **Open Agent Service Framework v0.8.0**:

| Field | Change |
|-------|--------|
| `capabilities` | Changed from `{}` to `[]` |
| `active` | NEW: endpoint availability flag |
| `skills` | 136 standardized skills |
| `domains` | 204 standardized domains |
| `x402Support` | NEW: payment protocol integration |

### 9. Terminology & Naming Updates

| Before | After |
|--------|-------|
| `tokenId` | `agentId` |
| `tokenURI` | `agentURI` |
| `setTokenURI()` | `setAgentURI()` |
| `UriUpdated` | `URIUpdated` |
| `fileuri` | `feedbackURI` |
| `filehash` | `feedbackHash` |
| `responseUri` | `responseURI` |

### 10. Off-Chain Feedback JSON Updates

| Before | After |
|--------|-------|
| `feedbackAuth` field | REMOVED |
| `proof_of_payment` | `proofOfPayment` (camelCase) |
| - | NEW: `endpoint` field (optional) |
| - | NEW: `domain` field (optional) |

### 11. Data URI Recommendation

For fully on-chain registration storage, **Base64-encoded data URIs** are now recommended:

| Storage Type | Example |
|--------------|---------|
| IPFS | `ipfs://QmHash...` |
| HTTPS | `https://example.com/metadata.json` |
| On-chain (NEW) | `data:application/json;base64,eyJ0eXBlIjoi...` |

---

## BEP-620 vs ERC-8004: Why Choose BSC?

### Gas Cost Comparison

| Operation | Ethereum | BNB Chain | Savings |
|-----------|----------|-----------|---------|
| Agent Registration | ~$5-15 | ~$0.05 | **99%** |
| Submit Feedback | ~$3-8 | ~$0.03 | **99%** |
| Update Metadata | ~$2-5 | ~$0.02 | **99%** |

### Transaction Finality

| Network | Finality | Best For |
|---------|----------|----------|
| Ethereum | ~15 min | High-value registrations |
| BNB Chain | ~3 sec | High-frequency operations |

### Ecosystem Integration

BEP-620 integrates natively with:
- **PancakeSwap** — Agent-powered trading bots
- **Venus Protocol** — DeFi automation agents
- **BNB Greenfield** — Decentralized storage for metadata
- **opBNB** — Ultra-low-cost agent operations

---

## Cross-Chain Identity Resolution

One of BEP-620's most powerful features: **an agent registered on BSC can be recognized on Ethereum, and vice versa.**

### Registry Format Standard

Registries are now identified using a standardized format:

```
{namespace}:{chainId}:{identityRegistry}
```

| Network | Registry Format |
|---------|-----------------|
| Ethereum Mainnet | `eip155:1:0x8004A818...` |
| BNB Smart Chain | `eip155:56:0x8004A818...` |
| BSC Testnet | `eip155:97:0x8004A818...` |

### How Cross-Chain Works

1. Agent registers on BSC with `agentId: 42`
2. Same agent registers on Ethereum with `agentId: 108`
3. Both registrations point to shared metadata
4. Metadata contains `registrations` array linking both identities
5. Explorers aggregate reputation across chains

### Aggregated Reputation Example

| Cross-Chain Trading Bot | |
|------------------------|---|
| Overall Score | 92/100 |
| BSC Reviews | 128 (avg: 94) |
| ETH Reviews | 45 (avg: 89) |

---

## Use Cases on BNB Chain

### DeFi Automation Agents
- **Skills**: yield_optimization, liquidity_provision, auto_compound
- **Use case**: Automated yield farming across PancakeSwap and Venus
- **Example reputation**: 94/100 (256 reviews)

### Trading Bots
- **Skills**: arbitrage_detection, cross_dex_trading, mev_protection
- **Use case**: Cross-DEX arbitrage with MEV protection
- **Example reputation**: 91/100 (128 reviews)

### NFT Agents
- **Skills**: nft_valuation, rarity_analysis, market_prediction
- **Use case**: Real-time NFT collection analysis
- **Example reputation**: 88/100 (89 reviews)

### Customer Service Agents
- **Skills**: customer_support, faq_handling, ticket_routing
- **Use case**: 24/7 multilingual support for BNB Chain projects
- **Example reputation**: 96/100 (512 reviews)

---

## Migration: October 2025 → January 2026

### Breaking Changes Summary

| Component | Change |
|-----------|--------|
| **giveFeedback()** | Remove `feedbackAuth`, use string tags, add `endpoint` |
| **getSummary()** | Use `string tag1, string tag2` instead of bytes32 |
| **readFeedback()** | Parameter `index` → `feedbackIndex` |
| **Events** | `UriUpdated` → `URIUpdated`, `tag1` now string indexed |
| **Metadata** | `capabilities: {}` → `capabilities: []`, add `active` |
| **Off-chain JSON** | Remove `feedbackAuth`, rename `proof_of_payment` |

### What Stays the Same

- Your existing `agentId` remains valid
- Metadata URIs don't need to change
- Contract addresses unchanged

---

## Contract Addresses

### BNB Smart Chain Mainnet

| Contract | Status |
|----------|--------|
| Identity Registry | 🟢 Deploying |
| Reputation Registry | 🟢 Deploying |
| Validation Registry | 🟡 Coming 2026 H2 |

---

## Comparing BEP-620 Across BNB Ecosystem

| Network | Gas Cost | Finality | Best For |
|---------|----------|----------|----------|
| **BSC Mainnet** | ~$0.05 | 3s | Production agents |
| **opBNB** | ~$0.001 | <1s | High-frequency ops |
| **BNB Greenfield** | ~$0.01 | 2s | Metadata hosting |

---

## Roadmap

### Q1 2026
- ✅ BEP-620 specification finalized (Jan 9, 2026)
- 🔄 BSC Mainnet deployment
- 🔄 Agentscan BSC integration

### Q2 2026
- 📋 opBNB deployment
- 📋 BNB Greenfield integration
- 📋 Cross-chain identity bridge

### 2026 H2
- 📋 Validation Registry launch (pending TEE community discussion)
- 📋 TEE-based verification
- 📋 Enterprise tools

---

## FAQ

**Is BEP-620 compatible with ERC-8004?**
Yes, 100%. Identical ABI and metadata schemas.

**Do I need to re-register after the January update?**
No. Existing registrations remain valid. Just update your feedback code.

**What fields are required for giveFeedback()?**
Only `agentId` and `score` (0-100). All other fields are optional.

**Can I use BSC for some agents and Ethereum for others?**
Absolutely. Link identities via the `registrations` field.

**How do I verify an agent's wallet?**
Check the `agentWallet` on-chain. Zero address = not verified.

**What's Domain Verification?**
Optional proof that an agent controls an endpoint domain via `/.well-known/agent-registration.json`.

---

## Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [January 2026 Update Specs](https://github.com/erc-8004/erc-8004-contracts/blob/master/SpecsJan26Update.md)
- [Agentscan Explorer](https://agentscan.info)
- [BNB Chain Discord](https://discord.gg/bnbchain)
- Twitter: [@Alias_labs](https://twitter.com/Alias_labs)

---

## Conclusion

BEP-620 brings ERC-8004's AI agent identity standard to BNB Smart Chain with:

✅ **99% lower gas costs** than Ethereum

✅ **3-second finality** vs 15 minutes

✅ **Permissionless feedback** — only agentId + score required

✅ **Cross-chain identity** — one agent, multiple chains

✅ **Verified wallets** — on-chain cryptographic trust

✅ **Domain verification** — prove endpoint ownership

✅ **OASF v0.8.0** — 136 skills, 204 domains

**The agentic web is coming to BNB Chain.**

**BEP-620 is the trust layer that makes it possible.**

---

*Last updated: January 21, 2026*

*Based on [ERC-8004 January 2026 Specification Update](https://github.com/erc-8004/erc-8004-contracts/blob/master/SpecsJan26Update.md)*
