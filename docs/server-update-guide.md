# 服务器更新指南

## 更新内容

本次更新包含：

1. **数据库迁移**：添加 `(token_id, network_id)` 联合唯一索引
   - 支持多网络部署（同一个 token_id 可以存在于不同网络）
   - 防止单个网络内的重复 token_id

2. **日志优化**：将并发插入冲突从 `warning` 改为 `info` 级别
   - 这是正常的并发控制行为，不是错误

## 更新步骤

### 方法 1：Docker 部署（推荐）

如果您使用 Docker Compose 部署，执行以下步骤：

```bash
# 1. SSH 登录服务器
ssh user@your-server

# 2. 进入项目目录
cd /path/to/agentscan

# 3. 拉取最新代码
git pull

# 4. 重启服务（会自动运行迁移）
./scripts/docker-restart.sh

# 或者手动重启
docker compose restart backend

# 5. 查看日志确认迁移成功
docker compose logs backend | grep -i migration
```

**自动迁移说明**：
- Docker 容器重启时，`main.py` 会自动运行所有迁移脚本
- 迁移脚本是幂等的（多次运行不会出错）
- 如果索引已存在，会跳过迁移

### 方法 2：手动运行迁移脚本

如果您需要在不重启服务的情况下运行迁移：

```bash
# 1. 进入项目目录
cd /path/to/agentscan

# 2. 运行迁移脚本
./scripts/migrate-multi-network.sh
```

### 方法 3：直接 Python 命令

```bash
cd /path/to/agentscan/backend
uv run python -m src.db.migrate_multi_network
```

## 验证迁移

### 检查日志

```bash
# Docker 部署
docker compose logs backend | grep -E "migration|constraint"

# 应该看到类似输出：
# ✅ Composite unique constraint already exists, skipping migration
# 或
# ✅ Migration completed successfully!
```

### 检查数据库约束

```bash
# 进入数据库
sqlite3 backend/8004scan.db

# 查看索引
PRAGMA index_list(agents);

# 应该看到 uq_agent_token_network
```

### 确认服务正常

```bash
# 检查服务状态
docker compose ps

# 检查 API 是否正常
curl http://localhost:8000/api/stats
```

## 回滚方案（如果需要）

如果迁移出现问题，可以回滚：

```bash
# 1. 停止服务
docker compose stop backend

# 2. 恢复数据库备份（如果有）
cp backup/8004scan.db backend/8004scan.db

# 3. 回退代码
git reset --hard <previous-commit>

# 4. 重启服务
docker compose start backend
```

## 常见问题

### Q: 迁移会丢失数据吗？

A: 不会。迁移脚本会：
1. 创建新表 `agents_new`
2. 复制所有数据
3. 删除旧表
4. 重命名新表
5. 重建索引

整个过程是原子操作，如果失败会回滚。

### Q: 迁移需要多长时间？

A: 取决于数据量：
- < 1000 agents: 几秒钟
- 1000-10000 agents: 几十秒
- > 10000 agents: 可能需要几分钟

在迁移期间，服务会短暂不可用。

### Q: 如何确认迁移成功？

A: 检查日志中是否有：
```
✅ Migration completed successfully!
或
✅ Composite unique constraint already exists, skipping migration
```

### Q: 迁移后仍然看到 agent_insert_conflict？

A: 不会了，因为：
1. 日志级别改为 `info`（不再是警告）
2. 消息改为 `agent_insert_skipped`
3. 这是正常的并发控制，不是错误

## 技术细节

### 联合唯一索引

```sql
UNIQUE(token_id, network_id)
```

**含义**：
- 同一个 token_id 可以在不同 network_id 上存在
- 同一个 network_id 上的 token_id 必须唯一

**例子**：
```
✅ 允许：token_id=1, network_id=sepolia
✅ 允许：token_id=1, network_id=base-sepolia
❌ 禁止：token_id=1, network_id=sepolia（已存在）
```

### 迁移流程（SQLite）

SQLite 不支持 `DROP CONSTRAINT`，所以需要重建表：

1. `CREATE TABLE agents_new` - 创建新表（带正确约束）
2. `INSERT INTO agents_new ... SELECT FROM agents` - 复制数据
3. `DROP TABLE agents` - 删除旧表
4. `ALTER TABLE agents_new RENAME TO agents` - 重命名
5. `CREATE INDEX ...` - 重建索引

## 相关文件

- 迁移脚本：`backend/src/db/migrate_multi_network.py`
- 执行脚本：`scripts/migrate-multi-network.sh`
- 模型定义：`backend/src/models/agent.py`
- 主程序：`backend/src/main.py`

## 联系支持

如果遇到问题：
1. 检查日志：`docker compose logs backend`
2. 查看数据库：`sqlite3 backend/8004scan.db`
3. 提交 Issue：https://github.com/your-repo/issues
