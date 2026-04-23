# Ecosystem 数据不准确问题分析与修复方案

## 问题诊断

### Virtuals ACP 数据差异

| 指标 | 我们数据库 | ACP 真实数据 | 差距 |
|---|---|---|---|
| Agent 总数 | 10 | **1,182** | 差 **118 倍** |
| Offerings 总数 | (未统计) | **1,527** | - |
| Resources 总数 | (未统计) | **202** | - |
| 有评分的 Agent | 0 | **35** | - |
| Chain IDs | `[8453]` | `[1, 56, 97, 8453, 84532]` | 少了 4 条链 |
| Clusters | 无统计 | `OPENCLAW: 815, none: 365, hedgefund: 2` | - |

### 根因分析

1. **Ingestion 策略太弱**：当前使用 `search` API + 10 个关键词种子（agent, ai, assistant...），每次 `topK=100`，去重后只拿到约 10 个 agent
2. **搜索覆盖不足**：ACP 的 search API 是语义搜索，每个 query 返回的结果集有大量重叠，但只用 10 个种子词根本覆盖不到 1182 个 agent
3. **未使用通配搜索**：`query=*` 可返回 257 个，单字符 a-z, 0-3 各返回 210-290 个，需要大量组合查询才能接近全量
4. **没有定时增量同步**：ingestion 只有手动触发，没有定期运行

### 后端 summary API 的问题

`/api/ecosystems/summary` 当前仅从 `agent_ecosystem_links` 表统计，但该表只有 ingestion 写入的 10 条记录。

## 修复方案

### 第一步：修复 Virtuals ACP Ingestion（核心）

**目标**：将覆盖率从 10 → 1182+

策略：
1. 扩大 query 种子：使用 a-z, 0-9 共 36 个单字符 + 通配符 `*` + 两字符组合
2. 提高 topK 到 500（API 允许的上限）
3. 合并去重逻辑（已有，只是输入量不够）
4. 增加定时自动同步（每 6 小时一次）

### 第二步：丰富 summary API 返回数据

当前 summary 太简单，只有 `agent_count` 和 `capability_count`。应补充：
- `total_offerings`: 总服务数量
- `total_resources`: 总资源数
- `active_agents`: 活跃 Agent 数
- `rated_agents`: 有评分的 Agent 数
- `clusters`: 集群分布

### 第三步：前端展示升级

利用丰富后的数据，Ecosystem Overview 页面才能真实反映生态规模。

### 待确认

bnbagent 和 coinbase (x402/AgentKit) 的数据源需要您提供更多信息——它们各自的 API 是什么？目前先修好 Virtuals ACP。
