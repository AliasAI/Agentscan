# ERC-8004: Building the Trust Layer for the Agentic Web — Mainnet Launch Imminent

*How a new Ethereum standard is solving the identity crisis of AI agents, and why it matters for the future of autonomous systems.*

---

## The Problem No One Is Talking About

It's 2026, and AI agents are everywhere.

They're trading crypto on your behalf. They're booking your flights. They're negotiating deals, writing code, managing your calendar, and even making purchasing decisions. The "agentic web" that industry leaders predicted is no longer a vision — it's our daily reality.

But here's the uncomfortable truth: **we have no idea who these agents actually are.**

When you interact with an AI agent today, you're essentially trusting a black box. There's no way to verify:
- Is this agent who it claims to be?
- Has it performed well for other users?
- Is it running the code it says it's running?
- Who's accountable if something goes wrong?

This isn't a hypothetical concern. As AI agents gain more autonomy — executing transactions, accessing sensitive data, and making consequential decisions — the lack of a trust infrastructure becomes an existential problem.

**Enter ERC-8004.**

---

## What is ERC-8004? The Ethereum Standard for AI Agent Identity

ERC-8004 is the first Ethereum Improvement Proposal designed specifically for AI agents. Think of it as the foundational identity layer that Web3 has been missing for the agentic era.

The standard consists of three interconnected registries:

###  Identity Registry: Every Agent Gets a Name

Just like ENS revolutionized human-readable addresses on Ethereum, ERC-8004 gives AI agents their own on-chain identity.

**How it works:**
1. An agent owner calls `register(owner, agentURI)` on the Identity Registry contract
2. The agent receives a unique `agentId` (similar to an NFT token ID)
3. The `agentURI` points to a JSON metadata file containing the agent's details
4. Agents can claim ENS subdomains under `.8004-agent.eth` for human-readable names

**What's in the metadata:**
```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "TradingBot Alpha",
  "description": "Automated DeFi yield optimizer with 18 months track record",
  "image": "ipfs://QmAgent...",
  "endpoints": [
    {
      "type": "mcp",
      "uri": "mcp://tradingbot.example.com",
      "skills": ["defi_trading", "yield_optimization"],
      "domains": ["finance/cryptocurrency", "finance/investment"]
    }
  ],
  "supportedTrust": ["reputation", "validation"]
}
```

The beauty of this design is its flexibility. The metadata can be hosted on IPFS for immutability, on HTTPS for easy updates, or even as a `data:` URI for fully on-chain storage. The blockchain stores the pointer; the content can live anywhere.

###  Reputation Registry: Trust, But Verify

Here's where ERC-8004 gets interesting. The Reputation Registry creates a **permissionless, on-chain feedback system** for AI agents.

**The problem it solves:**
Today, if you use an AI agent and have a great (or terrible) experience, that information stays with you. There's no way to share it, aggregate it, or verify it. Every new user starts from zero trust.

**How ERC-8004 changes this:**

Any user who interacts with an agent can submit on-chain feedback:

```solidity
function giveFeedback(
    uint256 agentId,      // Which agent
    uint8 score,          // 0-100 rating
    string tag1,          // Skill category (e.g., "code_generation")
    string tag2,          // Domain category (e.g., "technology")
    string endpoint,      // Which endpoint was used
    string feedbackURI,   // Optional: detailed review on IPFS
    bytes32 feedbackHash  // Integrity verification
) external;
```

**What makes this powerful:**

1. **Granular ratings**: Not just "5 stars" — feedback includes skill tags, domain tags, and specific endpoints. An agent might be excellent at code review but mediocre at documentation.

2. **Immutable history**: Feedback lives on-chain forever. An agent can't delete bad reviews or manipulate its score.

3. **Verifiable provenance**: Every piece of feedback is tied to a wallet address. Sybil attacks become expensive and detectable.

4. **Aggregated insights**: Anyone can query the registry to get summary statistics — average scores, feedback counts, tag distributions.

The January 2026 protocol update made this even more accessible by **removing the requirement for agent pre-authorization**. Previously, agents had to sign a `feedbackAuth` message to allow feedback. Now, the system is fully permissionless — anyone can review any agent.

###  Validation Registry: Cryptographic Proof of Integrity

*Note: This component is still in active development with the TEE community and will launch later in 2026.*

The Validation Registry will provide **cryptographic proof** that an AI agent is running specific, verified code in a trusted execution environment (TEE).

**Why this matters:**
- An agent claims to use GPT-4 and never store your data — how do you verify that?
- An agent says it follows certain trading rules — can you prove it?
- An agent promises to act in your interest — what's the guarantee?

With TEE-based validation, agents can generate attestations that prove:
- The exact code being executed
- The integrity of the execution environment
- That sensitive data never leaves the enclave

This is the "trust, but verify" layer that will enable truly autonomous agent-to-agent interactions without human oversight.

---

## Why the World Needs ERC-8004 Now

### The Agent Economy is Already Here

Consider what's happening right now:

- **MCP (Model Context Protocol)** has become the de facto standard for agent communication, supported by Anthropic, OpenAI, and dozens of frameworks
- **Agent-to-agent transactions** are growing exponentially — agents hiring other agents, paying for services, negotiating terms
- **Autonomous agents** are managing significant crypto portfolios, executing complex DeFi strategies
- **Enterprise adoption** is accelerating, with companies deploying internal agents for everything from HR to engineering

Yet all of this is happening without a fundamental trust layer. It's like building e-commerce in the 1990s without SSL certificates or payment verification.

### The Cost of No Identity Standard

Without ERC-8004, the agentic web faces serious challenges:

| Challenge | Impact |
|-----------|--------|
| **No accountability** | Bad actors can deploy malicious agents with no consequences |
| **Trust fragmentation** | Reputation is siloed within platforms, not portable |
| **Verification theater** | Claims of capability or safety can't be verified |
| **Friction in adoption** | Users hesitate to delegate authority to unknown agents |
| **Regulatory uncertainty** | No clear framework for agent identification and compliance |

ERC-8004 addresses all of these by providing a universal, blockchain-based identity and reputation system that works across platforms, chains, and use cases.

---

## Battle-Tested on Sepolia: Testnet Results

The Sepolia testnet has been the proving ground for ERC-8004 since the contracts were deployed. Here's what we've learned:

###  Testnet Statistics

| Metric | Value |
|--------|-------|
| **Total Registered Agents** | 324 |
| **On-Chain Feedback Records** | 16 |
| **ENS-Named Agents** | 26 |
| **Agents with Reputation** | 9 |
| **Unique Feedback Providers** | 12+ |

### Testnet Activity Highlights

The testnet has seen diverse activity patterns that helped validate the protocol design:

**Batch Registration Testing**

Multiple testers deployed agent fleets to stress-test the Identity Registry. The largest batch included 180+ agents registered in sequence, helping us:
- Validate contract performance under load
- Identify gas optimization opportunities
- Test metadata parsing with various URI formats (IPFS, HTTPS, data URI)

**Reputation System Validation**

The feedback mechanism has been actively tested with **16 on-chain reviews** across **9 agents**. Key observations:

| Pattern | Count | Insight |
|---------|-------|---------|
| High scores (80-100) | 12 | Positive feedback flow working correctly |
| Low scores (1-55) | 4 | Negative feedback properly recorded |
| Tagged feedback | 14 | Skill/domain tagging adopted by testers |

**ENS Integration**

**26 agents** have claimed `.8004-agent.eth` subdomains, demonstrating the human-readable naming system works as intended. Examples include `name-validation.8004-agent.eth` and `account-validation.8004-agent.eth`.

> **Note**: Testnet data primarily reflects protocol testing rather than production deployments. We expect to see real-world AI agent projects registering once mainnet launches.

### 🔧 Protocol Refinements from Testnet

The testnet period led to significant protocol improvements:

1. **Removed `feedbackAuth` requirement** — Feedback is now fully permissionless
2. **Changed tag types from `bytes32` to `string`** — Human-readable tags for better UX
3. **Added `feedbackIndex` field** — Efficient retrieval of feedback history
4. **Introduced `endpoint` parameter** — Granular, service-level feedback
5. **Agent Wallet verification** — EIP-712/ERC-1271 signature support

---

## The January 2026 Protocol Upgrade: What's New

The ERC-8004 specification underwent a major revision on January 9, 2026, incorporating lessons from testnet and community feedback. Here's what changed:

### Identity Registry Changes

**Before:**
```
- tokenId, tokenURI terminology
- Basic registration only
```

**After:**
```
- agentId, agentURI terminology (clearer semantics)
- setAgentURI() for metadata updates
- agentWallet as reserved metadata key
- EIP-712/ERC-1271 wallet verification
```

The `agentWallet` feature is particularly significant. It allows agents to have a **verified on-chain wallet address** that:
- Cannot be set via simple `setMetadata()` calls
- Requires cryptographic proof of ownership
- Resets to zero address on ownership transfer
- Enables agents to sign transactions and hold assets with verified identity

### Reputation Registry Changes

**Before:**
```solidity
giveFeedback(
    uint256 agentId,
    uint8 score,
    bytes32 tag1,      // Hard to read
    bytes32 tag2,
    string fileuri,
    bytes32 filehash,
    bytes feedbackAuth // Required agent signature
)
```

**After:**
```solidity
giveFeedback(
    uint256 agentId,
    uint8 score,
    string tag1,       // Human-readable
    string tag2,
    string endpoint,   // NEW: specific service
    string feedbackURI,
    bytes32 feedbackHash
    // No feedbackAuth — permissionless!
)
```

### Metadata Schema Updates

The registration JSON now supports OASF (Open Agent Service Framework) v0.8.0:

```json
{
  "endpoints": [
    {
      "type": "mcp",
      "uri": "mcp://agent.example.com",
      "skills": ["text_generation", "code_review", "data_analysis"],
      "domains": ["technology/software_development", "finance/data_analytics"],
      "capabilities": [],
      "active": true
    },
    {
      "type": "web",
      "uri": "https://agent.example.com/chat",
      "skills": ["conversation", "customer_support"]
    },
    {
      "type": "email",
      "uri": "mailto:agent@example.com"
    }
  ],
  "x402Support": true
}
```

New endpoint types (`web`, `email`) support human-agent interaction patterns, while `x402Support` enables payment protocol integration.

---

## Multi-Chain Strategy: Beyond Ethereum

ERC-8004 is designed to be chain-agnostic. While Ethereum mainnet is the primary deployment, we're committed to bringing verifiable agent identity to every major blockchain.

### Launch Phase: Ethereum + BSC

| Network | Standard | Status | Contract Deployment |
|---------|----------|--------|---------------------|
| **Ethereum Mainnet** | ERC-8004 | 🟢 Imminent | Days away |
| **BNB Smart Chain** | BEP-620 | 🟢 Synchronized | Deploying with mainnet |

**BEP-620** is our BSC-native implementation of the ERC-8004 standard. Key characteristics:
- Full compatibility with ERC-8004 metadata schemas
- Cross-chain agent identity resolution
- Lower gas costs for high-volume deployments
- Native BNB Chain ecosystem integration

### Post-Launch Expansion

| Network | Target | Notes |
|---------|--------|-------|
| **Base** | Q1 2026 | Optimized for consumer agents |
| **Linea** | Q1 2026 | zkEVM compatibility |
| **Polygon** | Q1 2026 | High-throughput use cases |
| **Arbitrum** | Q2 2026 | DeFi agent ecosystem |
| **Optimism** | Q2 2026 | Public goods focus |

### Future Research: Non-EVM Chains

| Network | Status | Challenge |
|---------|--------|-----------|
| **Solana** | 🔬 Research | Different account model requires protocol adaptation |
| **Cosmos** | 📋 Planned | IBC integration for cross-chain identity |
| **Aptos/Sui** | 📋 Planned | Move language implementation |

Our goal is a truly universal agent identity standard. An agent registered on Ethereum should be recognizable and verifiable on any chain.

---

## Developer Guide: Building with ERC-8004

Ready to register your agent? Here's everything you need to know.

### Step 1: Prepare Your Metadata

Create a JSON file following the ERC-8004 registration schema:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Your Agent Name",
  "description": "A detailed description of what your agent does, its capabilities, and intended use cases. Be specific — this helps users and other agents understand how to interact with you.",
  "image": "ipfs://QmYourAgentAvatar...",
  "endpoints": [
    {
      "type": "mcp",
      "uri": "mcp://your-agent.example.com",
      "name": "Primary MCP Endpoint",
      "skills": [
        "text_generation",
        "code_review",
        "data_analysis"
      ],
      "domains": [
        "technology/software_development",
        "technology/artificial_intelligence"
      ],
      "capabilities": [],
      "active": true
    }
  ],
  "registrations": [
    {
      "agentId": 0,
      "agentRegistry": "eip155:1:0x8004A818BFB912233c491871b3d84c89A494BD9e"
    }
  ],
  "supportedTrust": ["reputation", "validation"]
}
```

### Step 2: Host Your Metadata

**Option A: IPFS (Recommended for immutability)**
```bash
ipfs add agent-metadata.json
# Returns: QmYourMetadataHash...
# Use: ipfs://QmYourMetadataHash...
```

**Option B: HTTPS (Recommended for updateability)**
```
https://your-domain.com/agent-metadata.json
```

**Option C: Data URI (Fully on-chain)**
```
data:application/json;base64,eyJ0eXBlIjoi...
```

### Step 3: Register On-Chain

**Using ethers.js:**
```javascript
const identityRegistry = new ethers.Contract(
  "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  identityRegistryABI,
  signer
);

const tx = await identityRegistry.register(
  ownerAddress,                              // Agent owner
  "ipfs://QmYourMetadataHash..."            // Agent URI
);

const receipt = await tx.wait();
const agentId = receipt.logs[0].args.agentId;
console.log(`Registered agent with ID: ${agentId}`);
```

### Step 4: Claim Your ENS Name (Optional)

Register a subdomain under `.8004-agent.eth` for a human-readable identity:

```
your-agent-name.8004-agent.eth → agentId: 42
```

### Step 5: Set Up Agent Wallet (Optional)

For agents that handle funds, verify wallet ownership:

```javascript
// Sign with the agent's private key
const signature = await agentWallet.signTypedData(
  domain,
  types,
  { agentId, wallet: agentWalletAddress }
);

// Submit verification
await identityRegistry.setAgentWallet(agentId, agentWalletAddress, signature);
```

### Step 6: Monitor Your Reputation

Query your feedback:

```javascript
const reputationRegistry = new ethers.Contract(
  "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  reputationRegistryABI,
  provider
);

// Get summary statistics
const summary = await reputationRegistry.getSummary(
  agentId,
  "code_review",  // skill tag (or empty string for all)
  "technology"    // domain tag (or empty string for all)
);

console.log(`Average score: ${summary.averageScore}`);
console.log(`Feedback count: ${summary.feedbackCount}`);
```

---

## The Agentscan Explorer: Your Window into the Agentic Web

**Agentscan** is the official explorer for ERC-8004 — think Etherscan, but designed specifically for AI agents.

### Features

🔍 **Agent Discovery**
- Browse all registered agents across networks
- Search by name, skills, domains, or address
- Filter by reputation score, activity, and more

📊 **Reputation Analytics**
- View detailed feedback history for any agent
- Analyze score distributions and trends
- Compare agents by capability

🏷️ **OASF Taxonomy**
- Automatic classification using 136 skills and 204 domains
- Standardized tagging for consistent agent discovery
- Based on the Open Agent Service Framework v0.8.0

⚡ **Real-Time Sync**
- Event-driven architecture for instant updates
- Sub-minute latency on new registrations and feedback
- Multi-network support

### Coming to Mainnet

As ERC-8004 launches on mainnet, Agentscan will be ready with:
- Mainnet agent tracking from block 0
- BSC/BEP-620 integration
- Enhanced analytics dashboards
- API access for developers

---

## Frequently Asked Questions

### Is ERC-8004 only for AI agents?

While designed for AI agents, ERC-8004 can be used for any autonomous software system that needs verifiable identity and reputation. This includes bots, automated systems, and even IoT devices.

### How much does it cost to register an agent?

Registration requires a single transaction on the target network. On Ethereum mainnet, expect ~50,000-100,000 gas. On L2s and BSC, costs are significantly lower.

### Can I update my agent's metadata after registration?

Yes! Use `setAgentURI(agentId, newURI)` to update your metadata. The change is recorded on-chain with a `URIUpdated` event.

### What prevents fake reviews?

Several mechanisms:
1. **Economic cost**: Every feedback requires a transaction
2. **Wallet tracking**: Sybil patterns become visible
3. **Community monitoring**: Suspicious activity is flagged
4. **Future: Validation Registry**: TEE-based verification of interactions

### How does cross-chain identity work?

Agents can register on multiple chains and link their identities via the `registrations` field in metadata. Agentscan and other explorers can aggregate cross-chain reputation.

### Is my agent's code visible?

No. ERC-8004 doesn't require code disclosure. The Validation Registry (coming later) will enable optional TEE-based attestations for agents that want to prove their code integrity.

---

## The Road Ahead

ERC-8004 mainnet launch is just the beginning. Here's what's coming:

### 2026 Q1
- ✅ Ethereum mainnet deployment
- ✅ BSC/BEP-620 deployment
- 🔄 L2 expansion (Base, Linea, Polygon)
- 🔄 Agentscan public launch

### 2026 Q2
- 📋 Validation Registry beta
- 📋 Cross-chain identity resolution
- 📋 Agent SDK release
- 📋 MCP integration toolkit

### 2026 H2
- 📋 TEE-based validation mainnet
- 📋 Non-EVM chain support
- 📋 Enterprise deployment tools
- 📋 Governance framework

---

## Join the Movement

The agentic web is here. The question is: will it be built on a foundation of trust, or will we repeat the mistakes of the early internet — anonymous, unaccountable, and vulnerable?

ERC-8004 offers a different path. A future where:
- Every agent has a verifiable identity
- Reputation is portable and permanent
- Trust is earned, not assumed
- Accountability is the default

**This is our chance to get it right.**

### Get Involved

📖 **Read the Specification**
[ERC-8004 on Ethereum EIPs](https://eips.ethereum.org/EIPS/eip-8004)

🔍 **Explore Testnet Agents**
[Agentscan Explorer](https://agentscan.info)

💻 **Deploy Your Agent**
Start on Sepolia testnet today — mainnet is days away

🗣️ **Join the Discussion**
[Ethereum Magicians Forum](https://ethereum-magicians.org)

🐦 **Follow Updates**
Twitter: @Alias_labs 

---

## Conclusion

ERC-8004 isn't just another token standard. It's the trust infrastructure for the next era of the internet — an era where AI agents are first-class citizens of the digital economy.

With **324 agents already registered** on testnet, **multiple production-ready projects** battle-testing the protocol, and **mainnet deployment imminent**, the foundation is set.

The future of AI trust is on-chain.

**And it starts now.**

---

*This article was prepared using live data from Agentscan, the ERC-8004 AI Agent Explorer. Current testnet statistics: 324 registered agents, 16 on-chain feedback records, 26 ENS-named projects.*

*ERC-8004 is an open standard developed by the Ethereum community. Join us in building the trust layer for the agentic web.*
