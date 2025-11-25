# 🚀 服务器运维快速指南

## 当前需要执行的操作（Base Sepolia 重新扫描）

```bash
# 1️⃣ SSH 登录服务器
ssh user@your-server

# 2️⃣ 进入项目目录
cd /path/to/agentscan

# 3️⃣ 拉取最新代码
git pull

# 4️⃣ 更新网络合约地址
docker compose exec backend python -m src.db.init_networks

# 5️⃣ 运行数据库迁移（添加联合唯一索引）
docker compose restart backend

# 6️⃣ 重置 Base Sepolia 同步状态（Docker 环境）
./scripts/docker-reset-sync.sh base-sepolia

# 7️⃣ 手动触发同步（Docker 环境）
./scripts/docker-trigger-sync.sh base-sepolia

# 8️⃣ 监控同步进度
docker compose logs -f backend | grep -E "base-sepolia|base_sepolia"
```

---

## 常用操作命令

### 服务管理

```bash
# 查看服务状态
docker compose ps

# 重启所有服务
./scripts/docker-restart.sh

# 重启后端
docker compose restart backend

# 重启前端
docker compose restart frontend

# 停止服务
./scripts/docker-stop.sh

# 查看日志
./scripts/docker-logs.sh

# 实时日志
docker compose logs -f backend
```

### 数据库操作

```bash
# 进入数据库
sqlite3 backend/8004scan.db

# 查看所有网络
SELECT id, name, chain_id FROM networks;

# 查看同步状态
SELECT network_id, last_block, current_block, status FROM blockchain_sync;

# 查看 agents 数量
SELECT network_id, COUNT(*) FROM agents GROUP BY network_id;

# 退出数据库
.quit
```

### 同步管理

```bash
# Docker 环境：重置特定网络同步
./scripts/docker-reset-sync.sh <network_key>

# Docker 环境：手动触发同步
./scripts/docker-trigger-sync.sh <network_key>

# 本地开发：重置同步
./scripts/reset-sync.sh <network_key>

# 本地开发：触发同步
./scripts/trigger-sync.sh <network_key>

# 查看同步统计
curl http://localhost:8000/api/stats | python3 -m json.tool

# 监控同步日志
docker compose logs -f backend | grep -E "sync_started|events_found|agent_created"
```

### 网络配置

```bash
# 查看网络列表
curl http://localhost:8000/api/networks | python3 -m json.tool

# 初始化/更新网络配置
docker compose exec backend python -m src.db.init_networks

# 检查环境变量
docker compose exec backend env | grep RPC_URL
```

---

## 故障排查

### 检查服务健康

```bash
# 检查后端 API
curl http://localhost:8000/api/stats

# 检查前端
curl http://localhost:3000

# 检查数据库大小
ls -lh backend/8004scan.db
```

### 查看错误日志

```bash
# 后端错误
docker compose logs backend | grep -i error

# 前端错误
docker compose logs frontend | grep -i error

# Nginx 错误（如果有）
docker compose logs nginx | grep -i error
```

### RPC 连接测试

```bash
# 测试 Sepolia RPC
curl -X POST https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 测试 Base Sepolia RPC
curl -X POST https://base-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 备份与恢复

### 数据库备份

```bash
# 手动备份
cp backend/8004scan.db backend/8004scan.db.backup.$(date +%Y%m%d_%H%M%S)

# 自动备份（添加到 crontab）
0 2 * * * cd /path/to/agentscan && cp backend/8004scan.db backend/backups/8004scan.db.$(date +\%Y\%m\%d)
```

### 恢复数据库

```bash
# 停止服务
docker compose stop backend

# 恢复备份
cp backend/backups/8004scan.db.20251125 backend/8004scan.db

# 启动服务
docker compose start backend
```

---

## 性能监控

### 资源使用

```bash
# Docker 容器资源
docker stats

# 磁盘使用
df -h

# 数据库大小
du -sh backend/8004scan.db

# 日志大小
du -sh backend/logs/
```

### 同步性能

```bash
# 查看最近 100 条同步日志
docker compose logs --tail=100 backend | grep sync

# 统计每小时同步次数
docker compose logs backend | grep sync_started | awk '{print $1" "$2}' | cut -c1-13 | uniq -c

# 查看 RPC 请求错误
docker compose logs backend | grep -i "429\|rate limit"
```

---

## 更新部署

### 标准更新流程

```bash
# 1. 拉取代码
git pull

# 2. 重启服务（自动运行迁移）
./scripts/docker-restart.sh

# 3. 验证服务
curl http://localhost:8000/api/stats
```

### 强制重建

```bash
# 重建并重启（更新依赖时使用）
docker compose up -d --build

# 清理旧镜像
docker image prune -f
```

---

## 网络特定操作

### Sepolia

```bash
# Docker 环境：重置同步
./scripts/docker-reset-sync.sh sepolia

# Docker 环境：触发同步
./scripts/docker-trigger-sync.sh sepolia

# 查看 agents
curl "http://localhost:8000/api/agents?network=sepolia" | python3 -m json.tool
```

### Base Sepolia

```bash
# Docker 环境：重置同步
./scripts/docker-reset-sync.sh base-sepolia

# Docker 环境：触发同步
./scripts/docker-trigger-sync.sh base-sepolia

# 查看 agents
curl "http://localhost:8000/api/agents?network=base-sepolia" | python3 -m json.tool
```

---

## 文档索引

- 📖 [完整部署文档](docs/DEPLOYMENT.md)
- 🔄 [重新扫描网络指南](docs/rescan-network-guide.md)
- 🔧 [服务器更新指南](docs/server-update-guide.md)
- 🏗️ [OASF 分类说明](docs/oasf-classification.md)
- ⚡ [RPC 优化文档](docs/rpc-optimization-final.md)
- 📋 [项目说明](CLAUDE.md)

---

## 紧急联系

如遇紧急问题：
1. 查看实时日志：`docker compose logs -f`
2. 检查服务状态：`docker compose ps`
3. 查看完整文档：`docs/` 目录
4. 提交 Issue：https://github.com/your-repo/issues
