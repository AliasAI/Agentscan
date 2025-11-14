# 分类来源追踪功能

## 概述

8004scan 现已支持追踪 OASF 分类的来源，可区分哪些分类是从 Agent metadata 中提取的（Agent 自带），哪些是由 AI 自动分类的。

**更新时间**: 2025-11-14

---

## 功能特性

### 1. 来源标识

每个 Agent 的 OASF 分类（skills 和 domains）现在都会记录其来源：

- **`metadata`** - 从 Agent metadata 的 `endpoints[].skills/domains` 中直接提取（Agent 自带，符合 OASF 标准格式）
- **`ai`** - 由 AI 服务自动分析 Agent description 并分类
- **`null`** - 未分类或分类被跳过（如描述信息不足）

### 2. 前端展示

#### 列表页（AgentCard）

在 Agent 卡片的标签区域，会显示一个来源徽章：

- **🤖 Agent自带** - 绿色徽章，表示从 metadata 提取
- **🧠 AI分类** - 琥珀色徽章，表示 AI 自动分类

#### 详情页（OASFDetailTags）

在 OASF Taxonomy 卡片顶部，会显示更详细的来源信息：

- **🤖 Agent自带**: 从 Agent metadata 中提取的 OASF 标准分类
- **🧠 AI分类**: 由 AI 自动分析并分类

---

## 技术实现

### 数据库架构

#### 新增字段

```sql
-- agents 表
classification_source VARCHAR(20) -- 可选值: 'metadata', 'ai', NULL
```

#### 迁移脚本

`backend/src/db/migrate_add_classification_source.py`

```bash
# 运行迁移
cd backend
uv run python src/db/migrate_add_classification_source.py
```

### 后端实现

#### 1. 区块链同步服务 (blockchain_sync.py)

在 `_extract_oasf_data()` 方法中设置来源：

```python
# 优先级 1: 从 metadata 提取
if skills or domains:
    return {
        "skills": list(set(skills))[:5],
        "domains": list(set(domains))[:3],
        "source": "metadata"  # Agent 自带
    }

# 优先级 2: AI 分类
if self._is_valid_description(description):
    classification = await ai_classifier_service.classify_agent(name, description)
    classification["source"] = "ai"  # AI 分类
    return classification

# 无效描述，跳过分类
return {"skills": [], "domains": [], "source": None}
```

创建或更新 Agent 时保存来源：

```python
agent.skills = oasf_data.get('skills')
agent.domains = oasf_data.get('domains')
agent.classification_source = oasf_data.get('source')  # 新增
```

#### 2. 后台分类服务 (background_classifier.py)

后台异步分类全部标记为 AI 分类：

```python
agent.skills = classification.get("skills", [])
agent.domains = classification.get("domains", [])
agent.classification_source = "ai"  # 后台分类全部为 AI
```

#### 3. 分类 API (classification.py)

手动触发的分类端点也标记为 AI 分类：

```python
# POST /api/agents/{agent_id}/classify
agent.skills = classification.get("skills", [])
agent.domains = classification.get("domains", [])
agent.classification_source = "ai"  # 手动触发也是 AI 分类
```

#### 4. API 响应 (schemas/agent.py)

在 `AgentResponse` 中包含来源字段：

```python
class AgentResponse(AgentBase):
    # ...
    skills: list[str] | None = None
    domains: list[str] | None = None
    classification_source: str | None = None  # 新增
```

### 前端实现

#### 1. 类型定义 (types/index.ts)

```typescript
export interface Agent {
  // ...
  skills?: string[];
  domains?: string[];
  classification_source?: string | null;  // 新增
}
```

#### 2. 标签组件 (components/agent/OASFTags.tsx)

**OASFTags（列表页简化版）**:

```tsx
<OASFTags
  skills={agent.skills}
  domains={agent.domains}
  maxDisplay={3}
  classificationSource={agent.classification_source}  // 新增
/>
```

显示一个小徽章：
- 绿色 "🤖 Agent自带" (metadata)
- 琥珀色 "🧠 AI分类" (ai)

**OASFDetailTags（详情页完整版）**:

```tsx
<OASFDetailTags
  skills={agent.skills}
  domains={agent.domains}
  classificationSource={agent.classification_source}  // 新增
/>
```

在卡片顶部显示详细说明：
- 来源徽章 + 说明文字
- 用分隔线与标签内容分开

---

## 使用场景

### 场景 1: 新 Agent 注册（区块链同步）

```
Agent metadata 包含 OASF 格式的 endpoints[].skills/domains
  ↓
直接提取，classification_source = "metadata"
  ↓
前端显示 "🤖 Agent自带" 绿色徽章
```

### 场景 2: 新 Agent 注册（无 OASF metadata）

```
Agent description 有效且足够详细 (>= 20字符，无错误信息)
  ↓
AI 自动分类，classification_source = "ai"
  ↓
前端显示 "🧠 AI分类" 琥珀色徽章
```

### 场景 3: 新 Agent 注册（描述无效）

```
Agent description 无效 (< 20字符 或包含 "metadata fetch failed")
  ↓
跳过分类，classification_source = null
  ↓
前端不显示任何徽章
```

### 场景 4: 后台批量分类

```
用户运行: ./classify_docker.sh start 1737 20
  ↓
对未分类的 Agent 进行 AI 分类
  ↓
所有分类的 classification_source = "ai"
  ↓
前端显示 "🧠 AI分类" 琥珀色徽章
```

### 场景 5: 手动触发分类

```
API 调用: POST /api/agents/{agent_id}/classify
  ↓
AI 重新分类
  ↓
classification_source = "ai"
  ↓
前端显示 "🧠 AI分类" 琥珀色徽章
```

---

## 验证方法

### 1. 检查数据库

```bash
cd backend
uv run python

from src.db.database import SessionLocal
from src.models.agent import Agent

db = SessionLocal()

# 查看各来源的统计
from sqlalchemy import func
stats = db.query(
    Agent.classification_source,
    func.count(Agent.id).label('count')
).group_by(Agent.classification_source).all()

for source, count in stats:
    print(f"{source or 'unclassified'}: {count}")
```

### 2. 查看 API 响应

```bash
# 获取单个 Agent
curl http://localhost:8000/api/agents/{agent_id} | jq '.classification_source'

# 输出示例:
# "metadata"  -- Agent 自带
# "ai"        -- AI 分类
# null        -- 未分类
```

### 3. 前端界面检查

- **列表页**: 查看 Agent 卡片底部的标签区域，应该能看到来源徽章
- **详情页**: 查看 OASF Taxonomy 卡片，顶部应该显示来源说明

---

## 日志示例

### 从 metadata 提取（Agent 自带）

```
[info] oasf_extracted_from_metadata
  name=MyAgent
  skills_count=5
  domains_count=3
  source=metadata
```

### AI 自动分类

```
[info] oasf_auto_classified
  name=MyAgent
  skills_count=5
  domains_count=3
  source=ai
```

### 跳过分类（描述无效）

```
[info] oasf_classification_skipped
  name='Unknown Agent'
  reason=insufficient_description
  description_preview='Metadata fetch failed'
```

---

## 相关文档

- [OASF 分类指南](./oasf-classification.md)
- [分类验证规则](./classification-validation-rules.md)
- [后台分类使用指南](./background-classification-guide.md)
- [重新分类指南](./reclassify-guide.md)

---

## 常见问题

### Q1: 如何修改已有 Agent 的来源标记？

**A**: 不建议直接修改。如果需要重新分类，使用：

```bash
# 重新分类单个 Agent
curl -X POST http://localhost:8000/api/agents/{agent_id}/classify

# 批量重新分类
./classify_docker.sh start 1737 20
```

所有重新分类都会被标记为 `ai`。

### Q2: Agent 更新 metadata 后，来源会变吗？

**A**: 会。如果 Agent 的 metadata URI 更新（UriUpdated 事件），区块链同步服务会重新提取 OASF 数据：

- 如果新 metadata 包含 OASF 格式 → `source = "metadata"`
- 如果没有且描述有效 → `source = "ai"`
- 如果描述无效 → `source = null`

### Q3: 可以禁用来源徽章显示吗？

**A**: 可以。在前端组件中不传递 `classificationSource` prop 即可：

```tsx
<OASFTags skills={agent.skills} domains={agent.domains} />
```

### Q4: 来源标记影响分类的准确性吗？

**A**: 不影响。来源标记只是记录分类的来源，不改变分类逻辑。无论来源如何，分类规则和验证都是一致的。

---

## 未来增强

1. **来源统计**: 在统计页面显示各来源的占比
2. **筛选功能**: 允许用户按来源筛选 Agents
3. **置信度标记**: 为 AI 分类添加置信度分数
4. **审核机制**: 允许用户标记和修正错误的分类

---

**版本**: v1.0
**作者**: Claude & User
**最后更新**: 2025-11-14
