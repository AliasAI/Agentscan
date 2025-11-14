# 分类验证规则

## 概述

为了避免对无效或不完整的 agent 进行错误分类，8004scan 实施了严格的 description 验证规则。

**原则**: 宁愿不分类，也不要错误分类。

## 验证规则

### 1. 最小长度要求

**规则**: Description 长度至少 **50 个字符**（已提高要求）

**原因**: 少于 50 个字符的描述通常无法提供足够的语义信息进行准确分类。

**示例**:
```python
# ❌ 无效 - 太短
"Code generator"  # 14 字符
"An AI coding assistant"  # 22 字符

# ✅ 有效
"An AI agent that generates high-quality code from natural language descriptions"  # 81 字符
```

### 2. 非空检查

**规则**: Description 不能为空或 None

**示例**:
```python
# ❌ 无效
""
None

# ✅ 有效
"A comprehensive AI agent description"
```

### 3. 错误信息和无效模式过滤

**规则**: 排除常见的错误信息、默认值、测试数据和占位符

**无效描述模式**（不区分大小写）:
- `no metadata`
- `metadata fetch failed`
- `no description`
- `unknown agent`
- `agent from direct json`
- `no metadata uri provided`
- `failed to fetch`
- `error fetching`
- `not available`
- `n/a`
- `test agent`（测试数据）
- `created at`（时间戳标记）
- `updated`（更新标记）
- `lorem ipsum`（占位符文本）
- `todo`
- `placeholder`
- `example`
- `demo agent`

**示例**:
```python
# ❌ 无效 - 包含错误信息或测试标记
"Metadata fetch failed"
"No description available"
"Test Agent 123"
"Created at 1761852369 - UPDATED"

# ✅ 有效
"A trading bot for cryptocurrency markets with real-time analysis"
```

### 4. 数字字符比例检查

**规则**: 数字字符不能超过描述长度的 **30%**

**原因**: 过多数字通常表示时间戳或无意义的序列号。

**示例**:
```python
# ❌ 无效 - 数字过多
"Created at 1761852369 - UPDATED"  # 数字占 32%

# ✅ 有效
"Agent v2.0 for data analysis"  # 数字占 9%
```

### 5. 有意义词汇数量检查

**规则**: 描述必须包含至少 **5 个英文单词**

**原因**: 确保有足够的语义信息进行分类。

**示例**:
```python
# ❌ 无效 - 词汇太少
"AI bot 123"  # 只有 2 个单词

# ✅ 有效
"An advanced AI agent for automated trading strategies"  # 8 个单词
```

### 6. 平均单词长度检查

**规则**: 平均单词长度必须至少 **3 个字符**

**原因**: 过短的词汇（如大量的 "a", "is", "to"）可能缺乏实质信息。

**示例**:
```python
# ❌ 无效 - 单词过短
"An AI is ok to go"  # 平均 2.3 字符

# ✅ 有效
"An advanced AI agent for trading"  # 平均 4.7 字符
```

## 行为逻辑

### 自动分类流程

```
Agent 注册
  ↓
提取 metadata
  ↓
检查 endpoints[].skills/domains
  ├─ 有 OASF 数据 → 直接使用 ✅
  └─ 无 OASF 数据 → 验证 description
                    ├─ 有效 → AI 分类 ✅
                    └─ 无效 → 跳过分类 ⏭️
```

### 日志输出

**无效描述被跳过时**:
```
2025-11-14 16:41:30 [debug] invalid_description_skipped
  description_preview='Metadata fetch failed'
  name='Unknown Agent'
```

**有效描述成功分类时**:
```
2025-11-14 16:41:37 [info] llm_classification_success
  domains_count=3
  model=deepseek-chat
  name='CodeGen'
  skills_count=5
```

**区块链同步时跳过分类**:
```
2025-11-14 16:42:00 [info] oasf_classification_skipped
  name='Test Agent'
  reason='insufficient_description'
  description_preview='No metadata'
```

## 实际案例

### 案例 1: Metadata Fetch 失败

**场景**: Agent #1744 的 metadata URI 无法访问

```json
{
  "name": "Unknown Agent",
  "description": "Metadata fetch failed"
}
```

**结果**: ❌ 跳过分类，skills 和 domains 为空

**原因**: Description 包含错误信息 "metadata fetch failed"

---

### 案例 2: 空描述

**场景**: Agent 没有提供任何描述

```json
{
  "name": "My Agent",
  "description": ""
}
```

**结果**: ❌ 跳过分类

**原因**: Description 为空

---

### 案例 3: 描述太短

**场景**: Agent 描述只有几个单词

```json
{
  "name": "Bot",
  "description": "Trading bot"
}
```

**结果**: ❌ 跳过分类

**原因**: Description 只有 11 个字符（< 20）

---

### 案例 4: 有效描述（成功分类）

**场景**: Agent 有完整的描述

```json
{
  "name": "CodeGen Pro",
  "description": "An AI agent that generates high-quality code from natural language descriptions. Supports Python, JavaScript, TypeScript, and more."
}
```

**结果**: ✅ 成功分类

```json
{
  "skills": [
    "analytical_skills/coding_skills/text_to_code",
    "analytical_skills/coding_skills/coding_skills",
    "..."
  ],
  "domains": [
    "technology/software_engineering/software_development",
    "..."
  ]
}
```

## API 行为

### 手动分类 API

```bash
POST /api/agents/{agent_id}/classify
```

**行为**: 遵循相同的验证规则。如果 description 无效，返回空的 skills 和 domains。

**响应示例**（无效描述）:
```json
{
  "agent_id": "xxx",
  "skills": [],
  "domains": []
}
```

### 后台批量分类

```bash
POST /api/agents/classify-background?limit=100
```

**行为**: 自动跳过无效描述的 agents，只处理有效的 agents。

**状态响应**:
```json
{
  "is_running": true,
  "total_agents": 100,
  "processed": 50,
  "classified": 35,  // 只有 35 个有效描述
  "failed": 0
}
```

## 标签数量限制

**Skills**: 最多 **3 个**（之前是 5 个）
**Domains**: 最多 **2 个**（之前是 3 个）

**原因**: 更加克制，只返回最核心和最相关的分类。

## 通用标签过滤

**规则**: 自动过滤以下类型的标签：
1. 重复模式（如 `technology/technology`, `ai/ai`）
2. 单层标签（如 `ai`, `technology`）

**原因**: 优先保留更具体的子分类，避免过于宽泛的标签。

**示例**:
```python
# ❌ 会被过滤
"technology/technology"
"natural_language_processing/natural_language_processing"
"ai"  # 单层标签

# ✅ 会被保留
"natural_language_processing/summarization"
"technology/software_engineering/software_development"
```

## 配置参数

### 最小长度阈值

当前设置: **50 字符**（已从 20 提高到 50）

如需调整，修改以下文件中的 `MIN_DESCRIPTION_LENGTH`:
- `backend/src/services/ai_classifier.py`
- `backend/src/services/blockchain_sync.py`

### 数字字符比例阈值

当前设置: **30%**

### 最少单词数量

当前设置: **5 个单词**

### 平均单词长度阈值

当前设置: **3 个字符**

### 无效模式列表

在以下文件中的 `invalid_patterns` 列表:
- `backend/src/services/ai_classifier.py`
- `backend/src/services/blockchain_sync.py`

## 最佳实践

### 对于 Agent 开发者

✅ **推荐做法**:
1. 提供详细的 agent 描述（至少 50 个字符）
2. 使用 OASF 标准格式在 metadata 中直接提供 skills/domains
3. 确保 metadata URI 可访问

❌ **避免**:
1. 空描述或太短的描述
2. 使用错误信息或占位符作为描述
3. Metadata URI 失效

### 对于系统管理员

✅ **监控**:
1. 定期检查日志中的 `oasf_classification_skipped` 事件
2. 统计有多少 agents 因描述无效而未分类
3. 考虑联系 agent owner 更新 metadata

```bash
# 查看被跳过的分类
docker logs agentscan-backend | grep "classification_skipped"

# 统计未分类的 agents
./classify_docker.sh check
```

## 统计查询

### 查询未分类的 agents

```sql
SELECT COUNT(*) as unclassified
FROM agents
WHERE (skills IS NULL OR skills = '[]')
  AND (domains IS NULL OR domains = '[]');
```

### 查询描述无效的 agents

```sql
SELECT name, description, LENGTH(description) as desc_length
FROM agents
WHERE LENGTH(description) < 20
   OR description LIKE '%metadata%fetch%failed%'
   OR description LIKE '%no description%';
```

## LLM Prompt 优化

### 更加保守的分类原则

LLM 现在遵循以下原则进行分类：

1. **宁愿不分类，也不要错误分类**
2. 最多选择 2-3 个 Skills，必须是描述中明确提到的功能
3. 最多选择 1-2 个 Domains，必须是描述中明确提到的领域
4. 只选择最核心和最具体的分类
5. 如果描述信息不足或不清晰，返回空数组
6. 避免猜测，只基于明确信息分类
7. 优先选择更具体的子分类

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-11-14 | v1.0 | 初始版本，添加严格验证规则 |
| 2025-11-14 | v2.0 | 重大优化：提高最小长度到 50 字符，增加数字比例、词汇数量、平均单词长度检查，减少标签数量限制，添加通用标签过滤，优化 LLM Prompt |

---

**相关文档**:
- `docs/oasf-classification.md` - 分类功能总览
- `docs/background-classification-guide.md` - 后台分类使用指南
- `docs/docker-classification-guide.md` - Docker 环境使用
