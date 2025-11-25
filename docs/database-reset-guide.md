# 数据库完整重置和重新同步指南

本指南提供完整的数据库重置流程，适用于需要从头开始重新同步所有网络数据的场景。

## 📋 适用场景

- 数据库结构发生重大变更
- 需要清理所有历史数据重新开始
- 数据库损坏或出现严重错误
- 合约地址更新需要重新扫描

## ⚠️ 重要提醒

**此操作将删除所有现有数据，包括：**
- 所有 agents 数据
- 所有同步状态
- 所有活动记录
- 保留网络配置（会自动重建）

**操作前请确保：**
1. 已备份重要数据（如果需要）
2. 了解重新同步可能需要的时间
3. 在维护窗口期间执行

## 🚀 完整操作流程（Docker 环境）

### 第一步：备份现有数据库（可选）

```bash
cd ~/Agentscan

# 创建备份目录
mkdir -p backups

# 备份当前数据库
cp data/8004scan.db backups/8004scan.db.backup.$(date +%Y%m%d_%H%M%S)

# 验证备份
ls -lh backups/
```

### 第二步：停止服务

```bash
# 停止所有容器
docker compose down

# 验证所有容器已停止
docker compose ps
```

### 第三步：删除数据库文件

```bash
# 删除数据库文件
rm -f data/8004scan.db

# 确认删除
ls -la data/
```

### 第四步：拉取最新代码

```bash
# 拉取最新代码（包含最新的迁移和修复）
git pull

# 查看最近的提交
git log --oneline -5
```

### 第五步：启动服务（自动创建表和初始化网络）

```bash
# 启动所有服务
docker compose up -d

# 等待容器完全启动
sleep 10

# 查看启动日志
docker compose logs --tail=100 backend
```

### 第六步：验证数据库初始化

```bash
# 检查所有表是否创建
docker compose exec backend uv run python -c "
import sqlite3
conn = sqlite3.connect('/app/data/8004scan.db')
cursor = conn.cursor()
cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\")
tables = cursor.fetchall()
print('📋 数据库表列表:')
for table in tables:
    print(f'  ✓ {table[0]}')
conn.close()
"

# 验证网络数据
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import Network

db = SessionLocal()
networks = db.query(Network).all()
print('\n📋 网络列表:')
for n in networks:
    contracts = '✓' if n.contracts else '✗'
    print(f'  ID: {n.id:20s} | Name: {n.name:25s} | Chain: {n.chain_id:10d} | Contracts: {contracts}')
db.close()
"
```

**预期输出：**
```
📋 数据库表列表:
  ✓ agents
  ✓ blockchain_syncs
  ✓ networks

📋 网络列表:
  ID: sepolia              | Name: Sepolia                    | Chain: 11155111    | Contracts: ✓
  ID: base-sepolia         | Name: Base Sepolia               | Chain: 84532       | Contracts: ✓
  ID: linea-sepolia        | Name: Linea Sepolia              | Chain: 59141       | Contracts: ✓
  ID: hedera-testnet       | Name: Hedera Testnet             | Chain: 296         | Contracts: ✓
```

### 第七步：触发首次同步

```bash
# 方法 1：等待自动同步（推荐）
# 定时任务每10分钟在固定时间（:00, :10, :20, :30, :40, :50）触发
# 无需任何操作，等待即可

# 方法 2：手动触发同步（立即开始）
# 触发 base-sepolia 同步
./scripts/docker-trigger-sync.sh base-sepolia

# 触发 sepolia 同步
./scripts/docker-trigger-sync.sh sepolia

# 触发 linea-sepolia 同步
./scripts/docker-trigger-sync.sh linea-sepolia
```

### 第八步：监控同步进度

```bash
# 实时查看所有同步日志
docker compose logs -f backend | grep -E "sync_started|events_found|agent_created|reputation_updated"

# 只看 base-sepolia
docker compose logs -f backend | grep base-sepolia

# 只看错误日志
docker compose logs -f backend | grep -i error

# 查看同步统计（另开一个终端）
watch -n 5 'curl -s http://localhost:8000/api/stats | python3 -m json.tool'
```

**预期日志输出：**
```
sync_started network=base-sepolia from_block=32481444 to_block=32491444
events_found network=base-sepolia event_type=Registered count=15
agent_created network=base-sepolia agent_id=base-sepolia-xxx name="Example Agent"
reputation_updated_from_event network=base-sepolia agent_id=xxx reputation_count=5
blocks_processed network=base-sepolia processed=10000 total_events=15
sync_completed network=base-sepolia duration=45.2s
```

### 第九步：验证同步结果

```bash
# 检查数据库中的数据
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import Agent, BlockchainSync

db = SessionLocal()

# 查看各网络的 agent 数量
print('📊 Agents 统计:')
for network_id in ['sepolia', 'base-sepolia', 'linea-sepolia']:
    count = db.query(Agent).filter(Agent.network_id == network_id).count()
    print(f'  {network_id:20s}: {count:5d} agents')

print('\n📊 同步进度:')
syncs = db.query(BlockchainSync).all()
for sync in syncs:
    print(f'  {sync.network_name:20s}: Block {sync.last_block:10d} | Status: {sync.status}')

db.close()
"

# 通过 API 检查
curl http://localhost:8000/api/stats | python3 -m json.tool
```

## 🔧 常见问题排查

### 问题 1：容器启动失败

```bash
# 查看错误日志
docker compose logs backend

# 检查环境变量
docker compose exec backend env | grep -E "RPC_URL|DATABASE_URL"

# 检查 .env 文件
cat backend/.env
```

### 问题 2：网络数据未初始化

```bash
# 手动初始化网络
docker compose exec backend uv run python -m src.db.init_networks

# 验证
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import Network
db = SessionLocal()
print(f'Networks count: {db.query(Network).count()}')
db.close()
"
```

### 问题 3：同步未启动

```bash
# 检查定时任务是否运行
docker compose logs backend | grep -i scheduler

# 手动触发同步
./scripts/docker-trigger-sync.sh base-sepolia

# 查看同步状态
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import BlockchainSync
db = SessionLocal()
syncs = db.query(BlockchainSync).all()
for s in syncs:
    print(f'{s.network_name}: {s.status} - Block {s.last_block}')
db.close()
"
```

### 问题 4：RPC 请求过多（429 错误）

```bash
# 查看 RPC 错误
docker compose logs backend | grep -i "429\|rate limit"

# 检查 RPC 配置
docker compose exec backend env | grep RPC_URL

# 解决方案：
# 1. 使用私有 RPC URL（推荐）
# 2. 降低批量大小（在 networks_config.py 中调整 blocks_per_batch）
# 3. 增加同步间隔（在 scheduler.py 中调整）
```

## 📊 同步时间估算

根据网络和数据量不同，同步时间会有所差异：

| 网络 | 起始区块 | 预计 Agents | 预计时间 |
|------|----------|------------|----------|
| Sepolia | 9,419,801 | ~1,800 | 2-4 小时 |
| Base Sepolia | 32,481,444 | ~500 | 1-2 小时 |
| Linea Sepolia | 0 | TBD | TBD |
| Hedera Testnet | 0 | TBD | TBD |

**影响因素：**
- RPC URL 的速率限制
- 网络延迟
- 批量大小配置（blocks_per_batch）
- 链上事件数量

## 🔄 如果需要重置特定网络

如果只需要重置某个网络而不是全部：

```bash
# 1. 删除该网络的所有 agents
docker compose exec backend uv run python -c "
from src.db.database import SessionLocal
from src.models import Agent

network_id = 'base-sepolia'
db = SessionLocal()
deleted = db.query(Agent).filter(Agent.network_id == network_id).delete()
db.commit()
print(f'✅ 删除了 {deleted} 个 agents')
db.close()
"

# 2. 重置同步状态
./scripts/docker-reset-sync.sh base-sepolia

# 3. 触发同步
./scripts/docker-trigger-sync.sh base-sepolia

# 4. 监控
docker compose logs -f backend | grep base-sepolia
```

## 📚 相关文档

- **SERVER_OPS.md** - 服务器日常运维指南
- **UPDATE.md** - 服务器更新操作指南
- **docs/rpc-optimization-final.md** - RPC 优化文档
- **CLAUDE.md** - 项目完整技术文档

## 🆘 需要帮助？

如果遇到问题：
1. 查看实时日志：`docker compose logs -f backend`
2. 检查容器状态：`docker compose ps`
3. 进入容器调试：`./scripts/docker-exec.sh backend`
4. 查看数据库状态：使用上面的验证命令
