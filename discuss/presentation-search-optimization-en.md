# Agentscan Search Optimization - Presentation Script (English)

---

Thank you for leading the development of the ERC-8004 ecosystem.

Agentscan, as the browser for the 8004 protocol, currently indexes over 5000 agents. But honestly, the search experience is still very basic. Users struggle to quickly find the right agent. This is a problem for the ecosystem's usability.

We plan to optimize the search. The goal is to help users find the agent they need within 3 seconds. We want to make the 8004 ecosystem easier to use.

---

From user feedback and data, we see four main problems.

First, search is slow. No autocomplete. Users need to type the full name to find an agent.

Second, categories are not usable. OASF skills and domains are only for display. You cannot filter by them.

Third, no discovery mechanism. No recommendations. No category navigation. New users don't know where to start.

Fourth, conversion is low. Click rate from search results to detail pages is not good.

The core issue is: as a browser, we need better indexing and navigation. Not just a search box.

---

Our solution has three directions: smarter search, clearer navigation, and better discovery.

---

**First, make search smarter.**

Smart suggestions when you type. Shows matching agents, skills, domains, and history.

Hot queries when search box is empty. Keyword highlighting in results.

---

**Second, make category navigation usable.**

Turn OASF taxonomy into interactive navigation. 15 skill clusters and 10 domains. Each shows agent count.

Advanced filters: Network, Skills, Domains, Reputation, Created time, Status. All can combine. URLs are shareable.

---

**Third, help users discover agents.**

Homepage quick entry for hot categories. Like NLP, DeFi, Gaming, Code, Vision.

Multiple sorting options: Comprehensive, Hot, Newest, Highest Reputation.

Two views: Card view and List view. List view allows multi-select for comparison.

Recommendation: "For You" on homepage, "Similar Agents" on detail page.

---

A few more ideas: Agent Timeline for on-chain history. Network Comparison for multi-chain agents. API Explorer for developers. Custom Dashboard for advanced users.

---

Performance targets: autocomplete under 100 milliseconds, search results under 300 milliseconds, first screen under 2 seconds.

We will roll out in phases.

---

There is one more important direction I want to discuss.

We found Agentscan actually faces two types of users. Human users and AI Agents.

What I just described is mainly for humans. But recently we observed GPT, Claude, these AIs also use keyword-based web fetch when querying information. For example, Opus 4.5 uses keyword search when looking for agent info.

So we are considering splitting Agentscan into two product lines.

**First line: Human-Facing Interface.**

The search, navigation, recommendations I just described. Visual interface designed for human users.

**Second line: Agent-Facing API.**

Query interface optimized for AI Agents. This line has several features.

First is query optimization. AI Agents typically use keyword queries. They don't browse like humans. We need SEO optimization for this query pattern. Structured meta tags, JSON-LD schema, sitemap for agents.

Second is response format. Return standardized JSON. Complete 8004 metadata: agent's skills, domains, endpoints, reputation summary, on-chain proof. AI needs structured data, not HTML.

Third is on-chain verification. When an AI Agent queries another agent, it needs to quickly verify on-chain status. We provide fast verification interface. Input agent ID or address. Return latest on-chain state, owner, reputation score, whether active.

Fourth is batch query. AI might need to query multiple agents at once for comparison. We provide batch API. One request queries multiple agents. Returns standardized comparison data.

Fifth is smart filtering. AI describes needs in natural language. Like "find DeFi agents on Base with reputation greater than 80". We convert natural language to structured query. Return matching results.

Last is webhook and subscription. AI Agents can subscribe to agents matching specific conditions. Get notified when new agents register or existing agents update.

---

For 8004's on-chain characteristics, we will focus on:

On-chain proof. Each query result includes block number, transaction hash. AI can verify itself.

Multi-chain support. Clearly return which chains the agent is deployed on. Each chain's state might differ.

Reputation transparency. Not just return the score. Also return feedback sources, voter addresses, timestamps. AI can judge credibility itself.

State freshness. Clearly tell data freshness. Last synced block number. AI knows how fresh the data is.

---

Expected results:

For human users, find agent within 3 seconds. Lower barrier. 30% conversion increase.

For AI Agents, become their standard interface for querying 8004 agents. Improve ecosystem interoperability.

This way Agentscan is not just a browser. It's also the Agent Discovery Layer for the 8004 ecosystem.

---

I want to hear your thoughts.

First, does this dual-track strategy, Human-Facing and Agent-Facing in parallel, align with your expectations for the 8004 ecosystem?

Second, for Agent-to-Agent discovery and verification scenarios, what other key capabilities do you think are needed?

Third, regarding using on-chain data, what should we pay special attention to?

Fourth, about the Validation mechanism, what is the current progress? From agent registration, validation, to being discovered and used, has a complete closed loop formed in process and logic? When we design the Agent Discovery Layer, how should we better integrate the Validation mechanism?
