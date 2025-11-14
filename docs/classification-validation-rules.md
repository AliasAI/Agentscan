# 分类验证规则

## 概述

为了避免对无效或不完整的 agent 进行错误分类，8004scan 采用**两层验证策略**：

1. **基础硬性规则**：过滤明显无效的描述（错误信息、测试数据、时间戳等）
2. **LLM 语义判断**：判断描述的语义是否充分以进行准确分类

**原则**: 宁愿不分类，也不要错误分类。

## 验证规则

### 第一层：基础硬性验证

#### 1. 最小长度要求

**规则**: Description 长度至少 **20 个字符**

**原因**: 过滤极短的描述（如 "AI bot"），但不过度限制。

**示例**:
```python
# ❌ 无效 - 太短
"Code generator"  # 14 字符

# ✅ 通过基础验证（但仍需 LLM 判断语义）
"A coding bot for Python"  # 23 字符
"An AI agent that generates code"  # 33 字符
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

#### 4. 数字字符比例检查

**规则**: 数字字符不能超过描述长度的 **50%**

**原因**: 过多数字通常表示纯时间戳或无意义的序列号。

**示例**:
```python
# ❌ 无效 - 数字过多（纯时间戳）
"1761852369123456"  # 数字占 100%

# ✅ 通过（但仍需 LLM 判断）
"Agent v2.0 for data analysis"  # 数字占 9%
"Created at 1761852369 - UPDATED"  # 被 invalid_patterns 拒绝
```

### 第二层：LLM 语义判断

通过基础验证后，LLM 会进一步判断描述的**语义充分性**：

#### LLM 判断标准

1. **描述是否提供足够的语义信息**
   - 如果描述过于简短、模糊、或缺乏实质内容，LLM 会返回空数组

2. **明确性要求**
   - 必须能从描述中明确提取出功能（skills）或领域（domains）
   - 不能过于宽泛或抽象

#### 示例

**LLM 会拒绝（返回空数组）**:
```python
"AI assistant for tasks"  # 过于宽泛，缺乏具体信息
"Smart bot"  # 语义不足
"Automation tool"  # 太抽象
```

**LLM 会接受并分类**:
```python
"A coding bot for Python"
# → Skills: coding_skills, text_to_code
# → Domains: software_development

"An AI agent for cryptocurrency trading"
# → Skills: trading, market_analysis
# → Domains: finance, trading
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

## 两层验证流程图

```
Agent 描述
  ↓
【第一层：基础硬性验证】
  ├─ 长度 < 20 字符？ → ❌ 拒绝
  ├─ 包含无效模式？ → ❌ 拒绝
  ├─ 数字 > 50%？ → ❌ 拒绝
  └─ ✅ 通过
      ↓
【第二层：LLM 语义判断】
  ├─ 语义充分？
  │   ├─ 是 → ✅ 分类（2-3 skills, 1-2 domains）
  │   └─ 否 → ⏭️ 跳过（返回空数组）
```

## 配置参数

### 第一层：基础验证参数

**最小长度阈值**: **20 字符**
- 文件: `backend/src/services/ai_classifier.py`
- 文件: `backend/src/services/blockchain_sync.py`
- 变量: `MIN_DESCRIPTION_LENGTH`

**数字字符比例阈值**: **50%**
- 防止纯时间戳通过验证

### 第二层：LLM 判断参数

**分类数量限制**:
- Skills: 最多 **3 个**
- Domains: 最多 **2 个**

**语义判断原则**:
- 在 LLM Prompt 中明确要求
- 语义不足时必须返回空数组

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

### 核心原则（在 Prompt 中明确）

1. **语义充分性判断**（最重要）:
   - 仔细判断描述是否提供了足够的语义信息
   - 如果描述过于简短、模糊、或缺乏实质内容，必须返回空数组

2. **分类数量限制**:
   - Skills: 最多 2-3 个，必须是描述中明确提到的功能
   - Domains: 最多 1-2 个，必须是描述中明确提到的应用领域

3. **分类质量要求**:
   - 只选择最核心和最具体的分类
   - 避免通用标签（如 "technology/technology"）
   - 优先选择更具体的子分类

4. **避免猜测**:
   - 只基于描述中的明确信息进行分类
   - 不要根据名称或假设进行推断
   - 如果不确定，返回空数组

### Prompt 示例

Prompt 中明确给出正反例：
```
❌ "A coding bot" → 返回 {"skills": [], "domains": []}（信息不足）
❌ "AI assistant" → 返回 {"skills": [], "domains": []}（过于宽泛）
✅ "An AI agent for generating Python code from natural language" → 可以分类
```

## 实际效果对比

### 测试案例

| 描述 | 长度 | 基础验证 | LLM 判断 | 最终结果 |
|------|------|----------|----------|----------|
| "Created at 1761852369 - UPDATED" | 31 | ❌ 拒绝 | - | ❌ 不分类 |
| "AI assistant for tasks" | 22 | ✅ 通过 | ❌ 语义不足 | ❌ 不分类 |
| "A coding bot for Python" | 23 | ✅ 通过 | ✅ 语义充分 | ✅ 2 skills, 1 domain |
| "An AI agent that generates code..." | 86 | ✅ 通过 | ✅ 语义充分 | ✅ 2 skills, 1 domain |

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-11-14 | v1.0 | 初始版本，添加严格验证规则 |
| 2025-11-14 | v2.0 | 重大优化：提高最小长度到 50 字符，增加数字比例、词汇数量、平均单词长度检查，减少标签数量限制，添加通用标签过滤，优化 LLM Prompt |
| 2025-11-14 | v3.0 | 采用两层验证策略：基础验证（20 字符 + 模式过滤）+ LLM 语义判断，更加灵活和智能 |

---

**相关文档**:
- `docs/oasf-classification.md` - 分类功能总览
- `docs/background-classification-guide.md` - 后台分类使用指南
- `docs/docker-classification-guide.md` - Docker 环境使用
