# Agentscan Update - November 17, 2025

## 核心亮点

本次更新的最大特色是**智能 3 层分类系统**，优先尊重 agent 的原生 OASF 字段声明：

1. **优先级 1 - 原生字段优先**：如果 agent 的 metadata 中包含 OASF 标准的 `endpoints[].skills/domains` 字段，直接使用（不会被 AI 覆盖）
2. **优先级 2 - 多 LLM 智能分析**：对于没有原生 OASF 字段的 agent，使用 DeepSeek/OpenAI/OpenRouter/Claude 进行智能分析
3. **优先级 3 - 关键词兜底**：基础的关键词匹配作为可靠兜底方案

**设计理念**：尊重 agent 开发者的自主声明，AI 只作为辅助工具填补空白，而不是替代或覆盖原始数据。

---

## Twitter Thread Content

### Tweet 1 (Main Announcement)
🚀 Major Update to Agentscan!

We've integrated the complete OASF v0.8.0 taxonomy for AI agent classification!

✨ 136 Skills across 15 categories
🏢 204 Domains across 25 industries
🤖 AI-powered auto-classification
⚡ Real-time agent tagging

Better discover & explore ERC-8004 agents!

#Web3 #AIAgents #ERC8004

---

### Tweet 2 (Technical Details)
🔧 What's new in this update:

• Complete OASF v0.8.0 integration
• Auto-classify agents by skills & domains
• Smart 3-tier classification system:
  1️⃣ Native OASF fields (from metadata)
  2️⃣ Multi-LLM AI analysis (DeepSeek/OpenAI/Claude)
  3️⃣ Keyword matching fallback
• Beautiful tag display in agent cards

Data source: @agent0lab's official taxonomy 📊

---

### Tweet 2.5 (Smart Classification Priority)
🧠 How our smart classification works:

1️⃣ **Native First**: If agent has OASF fields in metadata, we use them directly (no AI needed!)

2️⃣ **AI Assist**: For agents without OASF fields, multi-LLM analysis kicks in

3️⃣ **Keyword Fallback**: Basic matching for edge cases

Result: Accurate + Respectful of agent's own declarations! ✅

---

### Tweet 3 (User Benefits)
🎯 Why this matters for users:

✓ Find agents by specific skills (NLP, CV, blockchain, etc.)
✓ Discover agents in your industry
✓ Better understand agent capabilities at a glance
✓ Respect native OASF metadata (no AI override!)
✓ Standardized taxonomy = better interoperability

All automatically tagged as agents register! 🏷️

---

### Tweet 4 (Additional Improvements)
Plus more improvements:

🕐 Fixed timezone issues (UTC display)
👤 Agent name & NFT ID in activity feed
📱 Enhanced mobile responsiveness
📚 Complete documentation

Try it now: [Your 8004scan URL]

Built with ❤️ for the ERC-8004 community

---

## Alternative: Single Tweet Version

🚀 Agentscan just got a major upgrade!

Now featuring complete OASF v0.8.0 taxonomy integration:
• 136 Skills & 204 Domains auto-classification
• 3-tier smart classification (Native OASF → AI → Keywords)
• Multi-LLM support (DeepSeek/OpenAI/Claude)
• Better discovery & filtering
• Enhanced UI/UX

Plus timezone fixes & activity improvements!

Explore smarter 👉 [Your URL]

#ERC8004 #Web3 #AIAgents

---

## LinkedIn Post Version

**Agentscan Introduces OASF v0.8.0 Integration for Enhanced AI Agent Discovery**

We're excited to announce a major update to Agentscan, the ERC-8004 AI agent explorer!

**Key Features:**

🎯 **Complete OASF v0.8.0 Taxonomy**
- 136 standardized skills across 15 categories (NLP, Computer Vision, Agent Orchestration, Data Engineering, etc.)
- 204 industry domains across 25 sectors (Technology, Finance, Healthcare, Education, etc.)

🤖 **Intelligent 3-Tier Classification System**
- **Priority 1**: Extract from native OASF metadata fields (`endpoints[].skills/domains`)
- **Priority 2**: Multi-LLM AI analysis (DeepSeek/OpenAI/OpenRouter/Claude)
- **Priority 3**: Keyword-based fallback for reliable coverage
- Respects agent-declared capabilities (no AI override of native fields)

✨ **Enhanced User Experience**
- Visual tags on agent cards (skills in blue ⚡, domains in purple 🏢)
- Detailed taxonomy breakdown on agent detail pages
- Mobile-responsive design

🔧 **Additional Improvements**
- Fixed UTC timezone display issues
- Added agent name & NFT ID to activity timeline
- Comprehensive API documentation

**Technical Highlights:**
- Built on official agent0_sdk taxonomy
- Full backward compatibility
- Open-source implementation
- RESTful API endpoints for classification

This update aligns Agentscan with industry standards, making it easier for developers and users to discover, compare, and integrate AI agents based on their specific capabilities and domains.

**Try it today:** [Your Agentscan URL]

**Learn more:**
- OASF Specification: https://github.com/agntcy/oasf
- agent0_sdk: https://github.com/agent0lab/agent0-py

#ERC8004 #AIAgents #Web3 #OpenStandards #OASF #Blockchain

---

## Medium/Blog Post Title Ideas

1. "Introducing OASF Classification in Agentscan: 340+ Categories for AI Agent Discovery"
2. "How We Integrated OASF v0.8.0 Taxonomy into Agentscan"
3. "Agentscan November Update: AI-Powered Agent Classification"
4. "Better AI Agent Discovery with Standardized Taxonomy"
5. "From 0 to 340: Building a Comprehensive Agent Classification System"

---

## Key Hashtags

Primary:
#ERC8004 #AIAgents #Web3 #OASF #AgentExplorer

Secondary:
#Blockchain #AI #MachineLearning #OpenStandards #DeveloperTools

Technology:
#FastAPI #NextJS #Python #TypeScript #OpenSource

---

## Key Metrics to Highlight

- 136 Skills
- 204 Domains
- 15 Skill Categories
- 25 Domain Industries
- 340+ Total Classifications
- 3-Tier Classification System (Native OASF → Multi-LLM AI → Keywords)
- 4 LLM Providers Supported (DeepSeek, OpenAI, OpenRouter, Claude)
- 100% OASF v0.8.0 Compliant
- Priority: Native metadata fields ALWAYS take precedence over AI classification

---

## Visual Content Suggestions

1. **Before/After Screenshot**: Agent card without tags vs. with OASF tags
2. **Classification Source Indicator**: Side-by-side comparison showing:
   - Agent with native OASF fields (marked as "From Metadata")
   - Agent with AI-classified fields (marked as "AI Classified")
3. **Classification Breakdown**: Pie chart showing skill/domain distribution
4. **3-Tier System Flowchart**: Visual diagram showing Native → AI → Keywords priority
5. **Agent Detail View**: Highlighting the new OASF Taxonomy section
6. **Mobile View**: Showing responsive tag display
7. **API Demo**: GIF showing auto-classification in action

---

## Call-to-Action Options

1. "Explore agents by skills & domains →"
2. "Try the smart 3-tier classification →"
3. "Discover agents in your field →"
4. "See how we respect native OASF metadata →"
5. "Check out the docs →"
6. "Star us on GitHub →"
