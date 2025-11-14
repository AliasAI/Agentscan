# 分类验证规则更新总结

## 问题

之前的系统对所有 agents 进行分类，包括：
- ❌ Metadata fetch 失败的 agents（如 Agent #1744）
- ❌ Description 为空或太短的 agents
- ❌ Description 包含错误信息的 agents

**结果**: 产生了不准确的分类标签

## 解决方案

实施了严格的验证规则，遵循原则：**宁愿不分类，也不要错误分类**

### 新增验证规则

1. **最小长度要求**: Description 至少 20 个字符
2. **非空检查**: Description 不能为空或 None
3. **错误信息过滤**: 排除常见的错误信息和默认值

### 无效描述模式（自动跳过）

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

## 影响范围

### ✅ 有效场景（会进行分类）

```json
{
  "name": "CodeGen Pro",
  "description": "An AI agent that generates high-quality code from natural language descriptions"
}
```

**结果**: 正常分类，返回 skills 和 domains

### ❌ 无效场景（跳过分类）

```json
{
  "name": "Unknown Agent",
  "description": "Metadata fetch failed"
}
```

**结果**: 跳过分类，skills 和 domains 为空

## 修改文件

| 文件 | 变更 |
|------|------|
| `backend/src/services/ai_classifier.py` | 添加 `_is_valid_description()` 验证方法 |
| `backend/src/services/blockchain_sync.py` | 在自动分类前验证 description |
| `docs/classification-validation-rules.md` | 📝 新增验证规则完整文档 |
| `CLAUDE.md` | 更新说明 |

## 行为变化

### 之前

```
所有 agents → 尝试分类 → 可能产生错误分类
```

### 现在

```
所有 agents → 验证 description
              ├─ 有效 → AI 分类 ✅
              └─ 无效 → 跳过分类 ⏭️
```

## 日志输出

### 跳过分类

```
2025-11-14 [debug] invalid_description_skipped
  name='Unknown Agent'
  description_preview='Metadata fetch failed'
```

### 成功分类

```
2025-11-14 [info] llm_classification_success
  name='CodeGen'
  model=deepseek-chat
  skills_count=5
  domains_count=3
```

## 测试结果

| Description | 长度 | 验证结果 | 原因 |
|-------------|------|----------|------|
| `""` | 0 | ❌ 无效 | 空字符串 |
| `"No metadata"` | 11 | ❌ 无效 | 错误信息 |
| `"Metadata fetch failed"` | 21 | ❌ 无效 | 错误信息 |
| `"Short desc"` | 10 | ❌ 无效 | 太短 |
| `"A comprehensive AI agent..."` | 69 | ✅ 有效 | 符合所有规则 |

## 对现有数据的影响

### 后台分类任务

后台分类任务会自动跳过无效描述的 agents：

```bash
# 启动后台分类
./classify_docker.sh start 1737 20

# 状态示例
{
  "total_agents": 1737,
  "processed": 1000,
  "classified": 650,  // 只有 650 个有有效描述
  "failed": 0
}
```

**注意**: `classified` 数量可能少于 `total_agents`，这是正常的，因为部分 agents 描述无效被跳过。

### 手动分类 API

```bash
# 对无效描述的 agent 调用分类 API
curl -X POST http://localhost:8001/api/agents/{agent_id}/classify

# 返回
{
  "agent_id": "xxx",
  "skills": [],
  "domains": []
}
```

## 推荐操作

### 对于系统管理员

1. **重新分类**（可选）: 之前已分类但描述无效的 agents 会在下次同步时被清除分类
2. **监控日志**: 查看有多少 agents 因描述无效被跳过
   ```bash
   docker logs agentscan-backend | grep "classification_skipped"
   ```
3. **统计分析**: 定期检查未分类的 agents 数量
   ```bash
   ./classify_docker.sh check
   ```

### 对于 Agent 开发者

✅ **推荐**:
- 提供详细的 agent 描述（至少 50 个字符）
- 使用 OASF 标准格式直接提供 skills/domains
- 确保 metadata URI 可访问

❌ **避免**:
- 空描述或太短的描述
- 使用占位符或错误信息

## 配置

如需调整验证规则，修改以下文件中的参数：

```python
# backend/src/services/ai_classifier.py
MIN_DESCRIPTION_LENGTH = 20  # 最小长度

invalid_patterns = [
    'no metadata',
    'metadata fetch failed',
    # ... 添加更多无效模式
]
```

## 相关文档

- 📖 **完整验证规则**: `docs/classification-validation-rules.md`
- 📖 **分类功能总览**: `docs/oasf-classification.md`
- 📖 **后台分类指南**: `docs/background-classification-guide.md`
- 📖 **Docker 使用指南**: `docs/docker-classification-guide.md`

---

**更新时间**: 2025-11-14
**版本**: v1.1（添加验证规则）
**影响**: 提高分类准确性，减少错误分类
