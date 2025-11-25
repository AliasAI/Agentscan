# 服务器运维指南

## 数据库初始化

### 问题：no such table: networks

如果遇到 `no such table: networks` 错误,说明数据库还没有初始化。

### 解决步骤

#### 1. 首次初始化（服务器上）

```bash
# 在服务器上执行
cd ~/Agentscan

# 初始化数据库表和网络数据
./scripts/init-db.sh
```

这个脚本会：
1. 使用 SQLAlchemy 创建所有数据库表（networks, agents, blockchain_sync 等）
2. 从配置文件初始化网络数据（sepolia, base-sepolia 等）

#### 2. 验证数据库初始化

```bash
cd backend

# 检查数据库文件是否存在
ls -lh 8004scan.db

# 验证 networks 表
uv run python -c "
from src.db.database import SessionLocal
from src.models import Network

db = SessionLocal()
networks = db.query(Network).all()
print(f'Found {len(networks)} networks:')
for n in networks:
    print(f'  - {n.name} (Chain ID: {n.chain_id})')
db.close()
"
```

#### 3. 然后再运行重置同步

```bash
# 现在可以正常使用
./scripts/reset-sync.sh base-sepolia
```

## 启动服务

### 开发环境

```bash
# 启动后端
./scripts/dev-backend.sh

# 启动前端
./scripts/dev-frontend.sh

# 同时启动前后端
./scripts/dev-all.sh
```

### 生产环境（Docker）

```bash
# 首次部署
./scripts/docker-deploy.sh

# 重启服务
./scripts/docker-restart.sh

# 查看日志
./scripts/docker-logs.sh

# 停止服务
./scripts/docker-stop.sh
```

## 常见运维任务

### 重置网络同步状态

```bash
# 重置某个网络的同步状态（将从起始区块重新扫描）
./scripts/reset-sync.sh sepolia
./scripts/reset-sync.sh base-sepolia
```

### 手动触发同步

```bash
# 手动触发某个网络的同步
./scripts/trigger-sync.sh base-sepolia
```

### 数据库迁移

```bash
# 运行多网络支持迁移
./scripts/migrate-multi-network.sh

# 或手动运行迁移
cd backend
uv run python -m src.db.migrate_multi_network
```

### 查看日志

```bash
# 查看后端日志
tail -f backend/logs/*.log

# 查看同步日志
tail -f backend/logs/*.log | grep -E 'sync_started|events_found|reputation_updated'

# 查看错误日志
tail -f backend/logs/*.log | grep -i error
```

### 环境变量检查

```bash
# 检查 .env 文件
cat backend/.env

# 必需的环境变量
# - SEPOLIA_RPC_URL: Sepolia RPC URL（必填）
# - BASE_SEPOLIA_RPC_URL: Base Sepolia RPC URL（如果使用 base-sepolia）
# - DATABASE_URL: 数据库路径（默认：sqlite:///./8004scan.db）
```

## 故障排查

### 1. 数据库表不存在

**错误**: `no such table: networks`

**解决**: 运行 `./scripts/init-db.sh`

### 2. RPC URL 未配置

**错误**: `SEPOLIA_RPC_URL is not configured`

**解决**: 在 `backend/.env` 中添加：
```
SEPOLIA_RPC_URL=https://your-rpc-url
```

### 3. uv 命令未找到

**错误**: `uv: command not found`

**解决**: 安装 uv
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 4. 端口已被占用

**错误**: `Address already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8000  # 后端
lsof -i :3000  # 前端

# 杀死进程
kill -9 <PID>
```

## 数据库备份与恢复

### 备份

```bash
cd backend

# 创建备份
cp 8004scan.db 8004scan.db.backup.$(date +%Y%m%d_%H%M%S)

# 压缩备份
tar -czf backups/8004scan_$(date +%Y%m%d_%H%M%S).tar.gz 8004scan.db
```

### 恢复

```bash
cd backend

# 停止服务
# (Docker) docker-compose down
# (开发) 按 Ctrl+C

# 恢复备份
cp 8004scan.db.backup.YYYYMMDD_HHMMSS 8004scan.db

# 重启服务
```

## 性能监控

### 检查 RPC 请求量

```bash
# 查看同步统计
tail -f backend/logs/*.log | grep -E 'sync_started|blocks_processed|events_found'

# 统计每小时的同步次数
grep 'sync_started' backend/logs/*.log | awk '{print $1" "$2}' | cut -d: -f1 | uniq -c
```

### 检查数据库大小

```bash
cd backend

# 查看数据库大小
du -h 8004scan.db

# 查看各表记录数
uv run python -c "
from src.db.database import SessionLocal
from src.models import Network, Agent, BlockchainSync

db = SessionLocal()
print(f'Networks: {db.query(Network).count()}')
print(f'Agents: {db.query(Agent).count()}')
print(f'BlockchainSync: {db.query(BlockchainSync).count()}')
db.close()
"
```

## 安全建议

1. **环境变量**: 永远不要提交 `.env` 文件到 Git
2. **RPC URL**: 使用私有 RPC URL,避免速率限制
3. **数据库备份**: 每天自动备份数据库
4. **日志轮转**: 配置日志轮转,避免磁盘空间耗尽
5. **监控**: 设置监控告警（RPC 错误率、同步延迟等）
