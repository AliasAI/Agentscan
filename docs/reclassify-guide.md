# 重新分类已有 Agents 指南

## 背景

在实施了严格验证规则后，之前基于无效描述（如 "Metadata fetch failed"）的分类应该被清除。

## 方案选择

### 方案 1: 只清除无效描述的分类（推荐）⭐

**适用场景**: 你想保留基于有效描述的分类，只清除错误的

**优点**:
- ✅ 保留有效的分类结果
- ✅ 只清除错误的分类
- ✅ 节省 API 调用成本

**缺点**:
- 需要逐个验证现有分类

---

### 方案 2: 清除所有分类，重新开始

**适用场景**: 你想从零开始，确保所有分类都基于新规则

**优点**:
- ✅ 完全干净的开始
- ✅ 确保一致性

**缺点**:
- ❌ 会清除所有已有分类（包括有效的）
- ❌ 需要重新分类所有 agents

---

### 方案 3: 只重新分类未分类的

**适用场景**: 保留现有分类，只处理未分类的

**优点**:
- ✅ 不影响已有分类
- ✅ 快速补充未分类的

**缺点**:
- ❌ 不会清除错误的分类

---

## 操作步骤

### 步骤 1: 检查当前状态

```bash
# 在容器内或宿主机
cd /path/to/8004scan/backend

# 查看统计
uv run python check_classified.py
```

输出示例:
```
📊 数据库统计:
  总 Agents: 1737
  ✅ 已分类: 34
  ❌ 未分类: 1703
  进度: 1.96%
```

---

### 步骤 2: 清除无效分类（推荐）

#### 方式 A: 使用清理脚本

```bash
# 本地环境
cd backend
uv run python clean_invalid_classifications.py
```

**Docker 环境**:
```bash
# 在宿主机执行
docker exec -it agentscan-backend python /app/clean_invalid_classifications.py
```

输出示例:
```
📊 总共找到 34 个已分类的 agents
检查哪些分类基于无效描述...

❌ 清除: Unknown Agent (Token ID: 1744)
   原因: 无效描述
   描述: 'Metadata fetch failed' (21 字符)
   之前的分类: 5 skills, 3 domains

❌ 清除: Test Agent (Token ID: 1234)
   原因: 无效描述
   描述: 'No description' (14 字符)
   之前的分类: 3 skills, 2 domains

====================================================================
清理完成！
  ✅ 保留有效分类: 20
  ❌ 清除无效分类: 14
  📊 总计: 34
====================================================================
```

#### 方式 B: 使用重新分类脚本

```bash
# 本地环境
cd backend
uv run python reclassify_agents.py invalid-only
```

**Docker 环境**:
```bash
docker exec -it agentscan-backend python /app/reclassify_agents.py invalid-only
```

---

### 步骤 3: 重新分类有效的 Agents

清除无效分类后，使用后台分类任务重新分类：

#### 本地环境

```bash
cd backend
./classify_background.sh start 1737 20
```

#### Docker 环境

```bash
# 在宿主机
./classify_docker.sh start 1737 20

# 查看进度
./classify_docker.sh status
```

---

## 详细方案说明

### 方案 1: 只清除无效分类（推荐）

#### 本地环境

```bash
# 1. 检查当前状态
uv run python check_classified.py

# 2. 清除无效分类
uv run python clean_invalid_classifications.py

# 3. 重新分类
./classify_background.sh start 1737 20

# 4. 查看进度
./classify_background.sh status
```

#### Docker 环境

```bash
# 1. 检查当前状态
docker exec agentscan-backend python /app/check_classified.py

# 2. 清除无效分类
docker exec -it agentscan-backend python /app/clean_invalid_classifications.py

# 3. 重新分类
./classify_docker.sh start 1737 20

# 4. 查看进度
./classify_docker.sh status
```

---

### 方案 2: 清除所有分类

⚠️ **警告**: 这会清除所有已有分类（包括有效的）

#### 本地环境

```bash
# 1. 清除所有分类
uv run python reclassify_agents.py all

# 2. 重新分类所有
./classify_background.sh start 1737 20
```

#### Docker 环境

```bash
# 1. 清除所有分类
docker exec -it agentscan-backend python /app/reclassify_agents.py all

# 2. 重新分类所有
./classify_docker.sh start 1737 20
```

---

### 方案 3: 只处理未分类的

```bash
# 本地环境
./classify_background.sh start 1737 20

# Docker 环境
./classify_docker.sh start 1737 20
```

这个方案不会清除任何现有分类，只会分类那些 `skills` 为空的 agents。

---

## 直接使用 SQL（高级）

如果你熟悉 SQL，可以直接操作数据库：

### 清除所有分类

```sql
-- 清除所有 skills 和 domains
UPDATE agents
SET skills = '[]', domains = '[]';
```

### 只清除描述太短的分类

```sql
-- 清除描述少于 20 字符的 agents 的分类
UPDATE agents
SET skills = '[]', domains = '[]'
WHERE LENGTH(description) < 20;
```

### 清除包含错误信息的分类

```sql
-- 清除描述包含 "metadata fetch failed" 的 agents 的分类
UPDATE agents
SET skills = '[]', domains = '[]'
WHERE description LIKE '%metadata%fetch%failed%'
   OR description LIKE '%no description%'
   OR description LIKE '%no metadata%';
```

**Docker 环境执行 SQL**:
```bash
# 进入容器
docker exec -it agentscan-backend bash

# 使用 sqlite3（如果使用 SQLite）
sqlite3 /app/data/8004scan.db

# 执行 SQL
sqlite> UPDATE agents SET skills = '[]', domains = '[]' WHERE LENGTH(description) < 20;
sqlite> .exit
```

---

## 监控重新分类进度

### 实时查看状态

```bash
# 本地环境
watch -n 30 ./classify_background.sh status

# Docker 环境
watch -n 30 ./classify_docker.sh status
```

### 查看日志

```bash
# 本地环境
tail -f logs/app.log | grep classification

# Docker 环境
docker logs -f agentscan-backend | grep classification
```

### 统计数据

```bash
# 本地环境
uv run python check_classified.py

# Docker 环境
docker exec agentscan-backend python /app/check_classified.py
```

---

## 常见问题

### Q1: 清除分类后，会自动重新分类吗？
**A**: 不会。你需要手动运行后台分类任务：
```bash
./classify_docker.sh start 1737 20
```

### Q2: 重新分类会覆盖现有的分类吗？
**A**: 后台分类任务只处理 `skills` 为空的 agents。如果要覆盖现有分类，需要先清除。

### Q3: 如何确认哪些 agents 会被清除？
**A**: 运行清理脚本时会显示详细列表：
```bash
uv run python clean_invalid_classifications.py
```

### Q4: 清除操作可以撤销吗？
**A**: 不能直接撤销。但可以重新运行后台分类任务恢复（前提是描述有效）。

### Q5: 新注册的 agents 会自动应用新规则吗？
**A**: 是的。区块链同步时会自动使用新的验证规则，只对有效描述的 agents 进行分类。

---

## 推荐流程（生产环境）

```bash
# 1. 在服务器上（Docker 环境）
ssh user@your-server
cd /path/to/8004scan

# 2. 检查当前状态
docker exec agentscan-backend python /app/check_classified.py

# 3. 清除无效分类（推荐）
docker exec -it agentscan-backend python /app/clean_invalid_classifications.py

# 4. 使用 screen 保持会话
screen -S reclassify

# 5. 启动后台重新分类
./classify_docker.sh start 1737 20

# 6. 监控进度
watch -n 30 ./classify_docker.sh status

# 7. 分离会话（Ctrl+A, D）
# 稍后重新连接: screen -r reclassify
```

---

## 脚本总结

| 脚本 | 功能 | 推荐 |
|------|------|------|
| `clean_invalid_classifications.py` | 只清除无效描述的分类 | ⭐ 推荐 |
| `reclassify_agents.py invalid-only` | 同上，带确认 | ⭐ 推荐 |
| `reclassify_agents.py all` | 清除所有分类 | ⚠️ 谨慎使用 |
| `reclassify_agents.py failed-only` | 只处理未分类的 | 一般 |
| `check_classified.py` | 查看统计 | ✅ 常用 |

---

**更新时间**: 2025-11-14
**版本**: v1.0
