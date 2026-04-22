# Agentscan 改造设计：Agent Economy Discovery / Resolution / Routing Layer

> Doc version: v1.0  
> Date: 2026-04-21  
> Status: Draft  
> Scope: Virtuals ACP (`acp-cli`) / BNB Chain / BNBAgent / Coinbase AgentKit + x402 首批接入

---

## 1. 背景

Agentscan 当前的产品和代码结构，仍然主要围绕 ERC-8004 链上注册 agent 展开：

- 网站核心对象是链上注册记录
- 后端核心表是 `agents`
- 搜索、详情页、评分、端点健康、活动流，默认都基于链上 agent 实体
- MCP 对外能力也主要是“搜索和查看 agent”

这条路径已经证明了 Agentscan 可以成为 ERC-8004 agent explorer，但如果继续在同一模型上增加更多字段，产品很容易退化成“信息更多的 agent 搜索站”，而不是更高层的 agent economy 基础设施。

本次改造的目标，是将 Agentscan 升级为：

**Agentscan is the discovery and routing layer for the agent economy.**

也就是从：

- 搜索 agent

升级到：

- 解析 agent 身份
- 识别 agent 能力
- 聚合外部生态
- 判断 agent 信任度
- 提供调用与支付路径

---

## 2. 产品目标

### 2.1 新定位

Agentscan 不再只提供 “find agents”。

Agentscan 要提供以下四类能力：

1. **Discovery**
   找到不同生态中的 agent、agent endpoint、agent capability。

2. **Resolution**
   将来自不同来源的记录归一为一个可理解的 canonical agent 实体。

3. **Trust**
   展示身份、来源、活动、能力、验证状态和 freshness，而不是只给一个黑盒总分。

4. **Routing**
   告诉调用方如何连接 agent，支持什么协议，是否可支付，优先走哪条调用路径。

### 2.2 首批接入生态

首批接入以下三组生态：

1. **Virtuals ACP**
   作为 ACP commerce / offerings / resources / jobs 数据源。

2. **BNB Chain / BNBAgent**
   作为 execution / jobs / onchain execution capability source。

3. **Coinbase AgentKit + x402**
   作为 wallet / payment / payable invocation capability source。

### 2.3 MVP 目标

第一阶段不追求“完整调用编排”，只追求让生态接入后具备最小闭环：

1. 网站支持 ecosystem 标签和专题入口
2. MCP 支持 ecosystem-aware 查询
3. agent profile 展示生态来源和 capability 信息
4. 提供 unmapped opportunities 视图和查询

---

## 3. 为什么值得做

### 3.1 Virtuals ACP

Virtuals ACP 适合作为第一个外部生态数据源：

- 有更清晰的 commerce / offerings / resources / jobs 语义
- 有官方 `acp-cli` 与配套 ACP API / SDK，可作为高置信官方入口
- 有结构化的 offerings / resources / wallet / job 数据
- 可以成为 Agentscan 第一个聚焦 commerce 的 ecosystem page

在产品上，Virtuals ACP 提供的是 “发现面” 和 “商业化面”。

### 3.2 BNB Chain / BNBAgent

BNB / BNBAgent 与 Agentscan 当前叙事最接近：

- execution
- jobs
- trustless task flow
- onchain capability

在产品上，它补的是 “执行面”。

### 3.3 Coinbase AgentKit + x402

AgentKit + x402 最适合把 Agentscan 从 “发现” 推进到 “可调用 + 可付费”：

- AgentKit 代表 agent wallet / onchain action stack
- x402 代表 machine-to-machine payment / payable endpoint

在产品上，它补的是 “支付与路由面”。

---

## 4. 当前系统现状与约束

### 4.1 当前核心模型

现有系统的主表是 `agents`，其语义本质上是：

- 某条链上的 ERC-8004 注册 agent 记录

当前 `agents` 主要字段包括：

- `network_id`
- `token_id`
- `owner_address`
- `metadata_uri`
- `on_chain_data`
- `reputation_score`
- `endpoint_status`

这意味着当前系统的主语是 “链上注册记录”，而不是 “跨生态 canonical agent”。

### 4.2 当前查询模型

当前 API 与页面逻辑也围绕链上记录组织：

- `/api/agents` 支持文本搜索、network、reputation、quality
- `/api/agents/{id}` 返回单个链上 agent 的详情
- 评分主要来自 reputation、feedback、endpoint health、metadata completeness
- 详情页主要展示 network、token id、owner、metadata、reviews

### 4.3 当前架构限制

如果直接把 Virtuals ACP / BNB / AgentKit / x402 字段继续塞进现有 `agents` 表，会产生几个问题：

1. **身份语义混乱**
   ACP-only agent 或 x402-only endpoint 并不天然对应一个 ERC-8004 token。

2. **评分失真**
   当前 score 高度偏向链上 feedback 和 endpoint health，不适用于所有生态。

3. **能力建模失真**
   AgentKit、x402、ACP、ERC-8183 是 capability，不是简单 profile 字段。

4. **后续路由能力难扩展**
   `prepare_invocation`、`resolve_agent_endpoints` 需要独立的 endpoint 与 capability 层。

结论：

**本次改造的第一刀必须是 canonical entity layer，而不是页面。**

---

## 5. 总体架构

推荐架构如下：

```text
External Sources
  - ERC-8004 registrations
  - Virtuals ACP (`acp-cli`)
  - BNB / BNBAgent
  - AgentKit capability signals
  - x402 capability signals
        |
        v
Ingestion / Adapter Layer
  - source-specific fetchers
  - normalization
  - confidence scoring
  - identity matching
        |
        v
Canonical Agent Layer
  - canonical_agents
  - identities
  - capabilities
  - endpoints
  - source links
  - activity snapshots
        |
        v
Serving Layer
  - Website
  - Existing REST API
  - Existing MCP surface
```

核心原则：

1. 不把 Virtuals ACP / BNB / AgentKit 当成平级 MCP
2. 不为每个生态单独再造一套对外 MCP
3. 所有外部生态都先归一为 internal canonical schema
4. 最终仍由 Agentscan 自己统一输出网站和 MCP

---

## 6. Canonical Agent 模型

### 6.1 设计原则

canonical agent 应该表达的是：

- 这个 agent 是谁
- 有哪些可验证身份
- 来自哪些生态
- 具备哪些能力
- 有哪些可调用入口
- 当前有哪些信任信号

它不应该等同于：

- 单个链上 token
- 单个资料页
- 单个 endpoint

### 6.2 建议的内部模型

```ts
type CanonicalAgent = {
  id: string
  primary_name: string
  aliases: string[]
  description?: string

  identities: {
    erc8004?: {
      chain_id: number
      registry: string
      agent_id: string
      agent_uri?: string
    }[]
    ens?: string[]
    did?: string[]
    wallet_addresses?: { chain: string; address: string }[]
    domains?: string[]
  }

  ecosystems: {
    virtuals_acp?: {
      profile_url?: string
      has_acp?: boolean
      has_offerings?: boolean
      has_resources?: boolean
      token_symbol?: string
      token_address?: string
      category?: string
    }
    bnbagent?: {
      profile_url?: string
      supports_erc8183?: boolean
      execution_enabled?: boolean
      chain?: string
    }
    coinbase?: {
      uses_agentkit?: boolean
      supports_x402?: boolean
      wallet_enabled?: boolean
    }
  }

  services: {
    mcp?: { endpoint: string }[]
    a2a?: { endpoint: string }[]
    oasf?: { endpoint: string; skills?: string[] }[]
    web?: { endpoint: string }[]
  }

  commerce: {
    acp?: {
      offerings_count?: number
      resources_count?: number
    }
    erc8183?: {
      enabled?: boolean
    }
    x402?: {
      supported?: boolean
      endpoints?: string[]
    }
  }

  trust: {
    agentscan_score?: number
    identity_score?: number
    capability_score?: number
    activity_score?: number
    verification_score?: number
    freshness_score?: number
  }

  activity: {
    last_seen_at?: string
    usage_7d?: number
    usage_30d?: number
  }

  tags: string[]
}
```

### 6.3 重要约束

该模型只作为 **内部 canonical schema**。

它不要求所有字段都有值：

- ACP-only 记录可以没有 ERC-8004
- ERC-8004-only 记录可以没有 x402
- x402-capable endpoint 可以暂时没有完整 profile

系统要允许“不完整但有价值”的 agent 实体存在。

---

## 7. 数据库改造建议

### 7.1 不建议直接扩展现有 `agents` 为万能表

现有 `agents` 应继续承担：

- ERC-8004 链上注册记录缓存
- reputation、activity、metadata 同步结果

但不应继续承担：

- 所有生态的统一实体层

建议保留现有 `agents`，新增 canonical 层。

### 7.2 建议新增表

#### 1. `canonical_agents`

主实体表。

字段建议：

- `id`
- `primary_name`
- `description`
- `status`
- `primary_source`
- `agentscan_score`
- `identity_score`
- `capability_score`
- `activity_score`
- `verification_score`
- `freshness_score`
- `last_seen_at`
- `created_at`
- `updated_at`

#### 2. `agent_source_records`

记录 canonical agent 与外部来源的映射关系。

字段建议：

- `id`
- `canonical_agent_id`
- `source_name`
- `source_url`
- `external_id`
- `raw_payload_json`
- `normalized_payload_json`
- `confidence_score`
- `source_updated_at`
- `created_at`
- `updated_at`

#### 3. `agent_identity_claims`

存储用于 merge / resolve 的 identity claim。

字段建议：

- `id`
- `canonical_agent_id`
- `claim_type`
- `claim_value`
- `chain`
- `source_name`
- `verified`
- `confidence_score`
- `created_at`
- `updated_at`

`claim_type` 示例：

- `erc8004`
- `wallet_address`
- `ens`
- `did`
- `domain`
- `profile_url`

#### 4. `agent_capabilities`

能力层。

字段建议：

- `id`
- `canonical_agent_id`
- `capability_name`
- `value_json`
- `source_name`
- `verified`
- `confidence_score`
- `updated_at`

`capability_name` 示例：

- `mcp`
- `a2a`
- `oasf`
- `x402`
- `erc8183`
- `acp`
- `agentkit`
- `payable`

#### 5. `agent_endpoints`

独立的可调用入口层。

字段建议：

- `id`
- `canonical_agent_id`
- `protocol`
- `endpoint_url`
- `method`
- `metadata_json`
- `health_status`
- `health_checked_at`
- `payment_type`
- `requires_wallet`
- `updated_at`

#### 6. `agent_activity_snapshots`

用于 usage / freshness / ecosystem activity。

字段建议：

- `id`
- `canonical_agent_id`
- `ecosystem_name`
- `usage_7d`
- `usage_30d`
- `freshness`
- `snapshot_time`

#### 7. `ingestion_runs`

用于同步可观测性和失败诊断。

字段建议：

- `id`
- `ecosystem_name`
- `status`
- `started_at`
- `ended_at`
- `stats_json`
- `error_log`

### 7.3 与现有表的关系

`agents` 和 `canonical_agents` 的关系建议如下：

- 一个 `canonical_agent` 可以关联零到多个 ERC-8004 `agents`
- 一个 ERC-8004 `agents` 记录应通过 source record / identity claim 映射到 canonical agent

这层映射不要硬写在 `agents` 表里，避免把旧模型强耦合进新实体语义。

---

## 8. Ingestion / Adapter 设计

### 8.1 原则

每个生态都实现自己的 adapter，但统一产出：

- source record
- identity claims
- capabilities
- endpoints
- activity snapshot

### 8.2 推荐接口

```python
class EcosystemAdapter(Protocol):
    source_name: str

    async def fetch_records(self) -> list[dict]:
        ...

    async def normalize_record(self, raw: dict) -> dict:
        ...

    async def extract_identities(self, normalized: dict) -> list[dict]:
        ...

    async def extract_capabilities(self, normalized: dict) -> list[dict]:
        ...

    async def extract_endpoints(self, normalized: dict) -> list[dict]:
        ...

    async def extract_activity(self, normalized: dict) -> dict | None:
        ...
```

### 8.3 三个生态的首批策略

#### Virtuals ACP

首批建议：

- 优先通过官方 ACP API / SDK 拉取全局 `agent search / offering / resource / job` 相关结构化数据
- `acp-cli` 作为调试和数据 shape 验证工具，不作为服务端 ingestion 主入口
- 首批聚焦 offerings、resources、jobs、wallet、supported chains、activity hints
- 不先追求完整 Virtuals profile 镜像
- 不做 Virtuals MCP bridge
- 由 Agentscan 自己归一化并对外输出

首批范围约束：

- 默认以 `Virtual-Protocol/acp-cli` 所使用的官方 ACP API / SDK 作为主要数据入口
- 先不为了补 profile 展示字段而并行接入额外 Virtuals source
- 先验证全局 `/agents/search` 与 offering / resource / job 的真实输出能否支撑 canonical schema

#### BNB / BNBAgent

首批建议：

- 先识别 execution / job / ERC-8183 元信息
- 先作为 capability source 纳入
- 后续再深化 profile integration

#### AgentKit + x402

首批建议：

- 不作为独立 agent directory
- 只补 capability：
  - `supports_x402`
  - `wallet_stack=agentkit`
  - `payable=true`
- 让 MCP 与网站可以查询 payable agent / payable endpoint

### 8.4 不建议复用现有链同步器

现有 `blockchain_sync` 适合 EVM network sync，不适合承载：

- Virtuals ACP external ingestion
- capability scanners
- x402 endpoint inspection

建议新建：

- `backend/src/services/ingestion/`
- `backend/src/services/adapters/`

由 scheduler 统一调度，而不是继续塞进现有链同步服务。

---

## 9. Identity Resolution 与 Merge 规则

### 9.1 目标

同一个 agent 在不同生态里可能有多份记录：

- ERC-8004 注册
- Virtuals ACP agent / offering / resource
- web profile
- x402 payable endpoint
- AgentKit wallet capability

系统需要做的是“可信归并”，而不是“尽量合并”。

### 9.2 基本原则

1. 不要只按名字合并
2. 先 identity，再 capability，再 profile similarity
3. 所有 merge 结果保留来源和置信度
4. 支持 “暂不合并”

### 9.3 推荐规则

高置信度合并：

- 相同 wallet address
- 明确互相引用的 domain / profile_url / metadata URI
- ERC-8004 metadata 与外部 profile 明确声明同一身份

中置信度合并：

- 相同 domain + 相同 endpoint
- 相同 wallet + 相近 name
- 相同 ENS / DID

低置信度，仅作为候选：

- 名称相同
- 描述相似
- 类别相似

### 9.4 输出要求

每个生态映射关系与 merge 结果都需要暴露：

- `source`
- `confidence_score`
- `verified`

这是后续 trust layer 的基础。

---

## 10. 能力与信任建模

### 10.1 Capability Layer

首批关注以下能力：

- `mcp`
- `a2a`
- `oasf`
- `acp`
- `erc8183`
- `x402`
- `agentkit`
- `payable`

这些能力应支持：

- 筛选
- 详情展示
- MCP 查询
- 后续 prepare_invocation

### 10.2 Trust Layer

当前系统已有 reputation 与 endpoint health，但接入外部生态后，trust 需要更细化。

建议拆成多个维度：

1. `identity_score`
   身份完整度和身份一致性。

2. `capability_score`
   capability 是否明确、是否可验证、是否可调用。

3. `activity_score`
   使用量、最近活动、跨生态活跃度。

4. `verification_score`
   domain、wallet、profile、endpoint 是否被验证。

5. `freshness_score`
   最近一次抓取、最近一次活动、最近一次验证。

### 10.3 不建议第一阶段做单一总分

原因：

- 三个生态的数据形态不同
- score 的解释成本很高
- 早期误导风险大

第一阶段建议：

- 先展示维度分
- 总分只作为内部预留字段或辅助排序字段

---

## 11. 网站改造建议

### 11.1 导航层

新增一级导航：

- `Ecosystems`

路径建议：

- `/ecosystems`
- `/ecosystems/virtuals-acp`
- `/ecosystems/bnb`
- `/ecosystems/payments`

### 11.2 Agent Profile 模块

每个 agent 详情页新增以下区块：

1. `External Ecosystems`
2. `Capabilities`
3. `Invocation`
4. `Trust Signals`

字段建议：

- Found on
- Endpoints
- Payments
- Wallet stack
- Job protocol
- Commerce
- Verified domain
- Freshness
- Usage
- Profile completeness

### 11.3 Unmapped Opportunities

新增增长页：

- `/opportunities/unmapped`

首批场景：

1. Virtuals ACP agents without ERC-8004 registration
2. ERC-8004 agents without MCP endpoint
3. x402-capable agents without payment metadata
4. high-usage agents with stale profiles

### 11.4 设计上的边界

网站层先做 “可见性升级”，不在第一阶段承诺：

- 完整 agent invocation orchestration
- 自动支付流执行
- 复杂多跳路由

---

## 12. MCP v2 改造建议

### 12.1 原则

MCP v2 仍然由 Agentscan 自己统一输出。

不要为：

- Virtuals ACP
- BNBAgent
- AgentKit / x402

分别暴露独立的对外 MCP。

### 12.2 Discovery 工具

- `search_agents(query, ecosystem?, capability?, network?)`
- `list_ecosystem_agents(ecosystem)`
- `list_agents_by_capability(capability)`
- `list_agents_by_network(network)`

### 12.3 Resolution / Verification 工具

- `get_agent_profile(agent_id)`
- `resolve_agent_endpoints(agent_id)`
- `compare_agents(agent_ids[])`
- `verify_agent_domain(agent_id)`
- `explain_agent_score(agent_id)`

### 12.4 Actionability 工具

- `find_unmapped_agents(source, missing_field)`
- `find_payable_agents(payment_type="x402")`
- `find_commerce_agents(protocol="acp" | "erc8183")`
- `prepare_invocation(agent_id, task_type?)`

### 12.5 高频问题覆盖

Virtuals ACP：

- 找 ACP 上最活跃的 agents
- 找 ACP 中未映射到 ERC-8004 的 agents
- 找有 ACP offerings/resources 的 agents

BNB：

- 找支持 ERC-8183 / job flows 的 agents
- 找 BNB 上可执行任务的 onchain agents

AgentKit / x402：

- 找支持 x402 支付的 agents
- 找带 wallet / cdp / agentkit capability 的 agents
- 找可直接 machine-to-machine 付费调用的 endpoint

---

## 13. 分阶段实施计划

### Phase 1

目标：

先让三大生态 “可见”。

交付：

- canonical schema
- ingestion adapter interface
- ecosystem / capability 数据入库
- 网站 ecosystem badges
- agent profile 新增 ecosystem / capability 模块
- MCP 支持 ecosystem / capability filter

### Phase 2

目标：

从搜索升级到解析。

交付：

- `get_agent_profile`
- `compare_agents`
- `verify_agent_domain`
- `explain_agent_score`
- `/ecosystems/virtuals-acp`
- `/ecosystems/bnb`
- `/ecosystems/payments`

### Phase 3

目标：

从解析升级到行动入口。

交付：

- `resolve_agent_endpoints`
- `prepare_invocation`
- `find_payable_agents`
- `find_commerce_agents`
- `find_unmapped_agents`
- `Unmapped Opportunities` 页面

---

## 14. 执行优先级

### P0

- canonical schema
- adapter interface
- canonical storage layer
- ecosystem / capability filters in API / MCP
- profile ecosystem badges

### P1

- Virtuals ACP ingestion
- `/ecosystems/virtuals-acp`
- `/ecosystems/bnb`
- payable / x402 filters
- `get_agent_profile`
- `find_unmapped_agents`

### P2

- `resolve_agent_endpoints`
- `compare_agents`
- `prepare_invocation`
- trust / verification layer

### 推荐实际落地顺序

从工程投入与产出比看，建议顺序是：

1. Virtuals ACP
2. AgentKit + x402
3. BNB / BNBAgent

原因：

- Virtuals ACP 最适合先做完整 ecosystem page + source ingestion
- AgentKit + x402 最容易体现 “可调用 + 可付费” 升级
- BNB execution 深化价值高，但建模复杂度更大

---

## 15. 风险与需要避免的坑

1. 不要把 token 热度直接等同于 agent 活跃度
2. 不要只按名称做 merge
3. 所有外部字段都要保留来源和置信度
4. 不要在第一阶段做黑盒总分
5. 不要为每个生态单独再造对外 MCP
6. 不要把外部 ingestion 继续堆进现有 `blockchain_sync`
7. 不要假设所有 agent 都有链上注册记录

---

## 16. 验收标准

### Phase 1 验收

满足以下条件即可视为 MVP 完成：

1. 系统可以入库并展示 Virtuals ACP / BNB / x402 相关生态数据
2. `/api/agents` 或新 canonical 查询接口支持 ecosystem / capability 过滤
3. agent 详情页能展示来源生态和能力标签
4. MCP 能回答：
   - 哪些 agent 支持 x402
   - 哪些 agent 在 ACP 上有 offerings / resources
   - 哪些 agent 支持 ERC-8183

### Phase 2 验收

1. 能返回 canonical agent profile
2. 能解释来源、能力、分数维度和信任信号
3. 网站有独立 ecosystems 页面

### Phase 3 验收

1. 能返回候选 invocation 路径
2. 能查询 payable / commerce / unmapped agents
3. 能把 discovery 和 actionability 串起来

---

## 17. CMC 化的数据源分层

如果 Agentscan 的长期目标是做成类似 CoinMarketCap 的 agent economy 网站，那么数据策略不能只依赖单一 source，而要做分层。

推荐按以下五层理解：

### 17.1 官方高置信源

作用：

- 提供结构化、可信、适合 ingestion 的协议原生数据

当前对应：

- Virtuals ACP `acp-cli`
- ERC-8004 官方/链上注册数据
- 官方 capability SDK / protocol metadata

特点：

- 准确性高
- 字段稳定性通常更好
- 适合做 canonical schema 的主输入

限制：

- 覆盖面不一定完整
- 未必包含丰富的展示型 profile 字段

### 17.2 目录发现源

作用：

- 扩大生态覆盖，发现更多 agent / project / service

当前对应：

- 各生态目录页
- marketplace 列表页
- 生态 showcase / registry

特点：

- 覆盖面广
- 有利于做榜单和 discovery

限制：

- 准确性通常低于官方协议源
- 字段可能不稳定、易变化

### 17.3 链上身份源

作用：

- 作为 identity anchor，帮助归一和验证

当前对应：

- ERC-8004
- wallet address
- ENS
- DID
- contract / registry records

特点：

- 最适合做 merge 的高置信依据
- 是 trust layer 的底座

限制：

- 信息密度不一定高
- 不能单独表达完整 capability

### 17.4 Capability 源

作用：

- 描述 agent 能做什么、怎么调用、怎么付费

当前对应：

- BNB AgentKit / BNBAgent
- AgentKit
- x402
- ACP offerings / resources
- MCP / A2A / OASF metadata

特点：

- 最适合支撑 routing / invocation / actionable discovery

限制：

- 不一定能单独提供完整 agent profile

### 17.5 活跃度与排名源

作用：

- 支撑类似 CMC 的榜单、趋势、活跃度、热度

当前对应：

- job counts
- usage snapshots
- endpoint health
- reputation / feedback
- freshness / update cadence

特点：

- 适合做排行、趋势、推荐

限制：

- 容易误导
- 必须和身份、来源、置信度一起展示

### 17.6 对 `acp-cli` 的正确定位

从 CMC 目标看，`Virtual-Protocol/acp-cli` 应被定位为：

- 一层非常好的官方高置信源
- 同时也是 commerce / capability 源
- 一个很适合做字段验证和手工调试的官方工具

但它不应被误认为：

- 整个 agent 生态的完整镜像
- 唯一目录源
- 唯一排名依据

补充说明：

- `acp browse` 在当前 CLI 实现里会先创建 active agent context，因此没有 active agent 时会报 `No active agent set`
- 但底层 `AgentApi.browse()` 实际调用的是全局 `GET /agents/search`
- 实测这个接口在未登录状态也能返回全局 agent 搜索结果
- 因此，Agentscan 正确的 ingestion 方式不是依赖 CLI 交互命令，而是直接调用 ACP API / SDK 的全局搜索接口

因此，首期用 `acp-cli` 收敛范围是正确的，因为它优先保证准确性；但真正的服务端接入应走 ACP API / SDK，而不是直接依赖 `acp browse` 命令。

但长期产品上，Agentscan 仍然需要多源组合，才能做成真正的 agent economy “CMC”。

---

## 18. 最终结论

这次改造值得做，但不能按“在现有 agent 表上继续堆字段”的方式做。

正确的工程路线是：

1. 先建立 canonical entity layer
2. 再接入 Virtuals ACP / BNB / AgentKit + x402 作为 external sources
3. 再通过网站和 MCP 统一输出 discovery / resolution / routing 能力

如果不先做 canonical layer，后续会遇到：

- 身份模型混乱
- 评分失真
- 能力表达失真
- 调用路由无法扩展

如果先做 canonical layer，本次三大生态接入不仅合理，而且会把 Agentscan 从 ERC-8004 explorer 升级为真正的 agent economy 基础设施层。
