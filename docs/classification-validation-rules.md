# 分类验证规则

## 概述

为了避免对无效或不完整的 agent 进行错误分类，8004scan 实施了严格的 description 验证规则。

**原则**: 宁愿不分类，也不要错误分类。

## 验证规则

### 1. 最小长度要求

**规则**: Description 长度至少 **20 个字符**

**原因**: 少于 20 个字符的描述通常无法提供足够的上下文信息进行准确分类。

**示例**:
```python
# ❌ 无效 - 太短
"Code generator"  # 14 字符

# ✅ 有效
"An AI agent that generates high-quality code from natural language"  # 68 字符
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

### 3. 错误信息过滤

**规则**: 排除常见的错误信息和默认值

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

**示例**:
```python
# ❌ 无效 - 包含错误信息
"Metadata fetch failed"
"No description available"
"Agent from direct JSON"

# ✅ 有效
"A trading bot for cryptocurrency markets"
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

## 配置参数

### 最小长度阈值

当前设置: **20 字符**

如需调整，修改以下文件中的 `MIN_DESCRIPTION_LENGTH`:
- `backend/src/services/ai_classifier.py`
- `backend/src/services/blockchain_sync.py`

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

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2025-11-14 | v1.0 | 初始版本，添加严格验证规则 |

---

**相关文档**:
- `docs/oasf-classification.md` - 分类功能总览
- `docs/background-classification-guide.md` - 后台分类使用指南
- `docs/docker-classification-guide.md` - Docker 环境使用
