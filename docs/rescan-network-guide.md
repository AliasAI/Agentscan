# 重新扫描网络指南

## 使用场景

当以下情况发生时，您可能需要重新扫描网络：

1. ✅ **新增网络但未添加合约地址** - 网络已添加到数据库，但 `contracts` 字段为空
2. ✅ **合约地址配置错误** - 之前配置的合约地址有误，需要重新扫描
3. ✅ **数据不完整** - 同步过程中出现错误，导致部分数据丢失
4. ✅ **测试环境重置** - 链上数据重置，需要清空本地数据并重新扫描

## 快速开始

### 方法 1：重置同步状态（推荐）

这是最安全的方法，只重置同步进度，不删除已有的 agents：

```bash
# 在服务器上执行
cd /path/to/agentscan

# 1. 重置 Base Sepolia 的同步状态
./scripts/reset-sync.sh base-sepolia

# 2. 手动触发同步（可选，否则等待定时任务）
./scripts/trigger-sync.sh base-sepolia

# 3. 查看同步进度
curl http://localhost:8000/api/stats | python3 -m json.tool
```

### 方法 2：完全重新扫描（删除所有数据）

⚠️ **警告**：这将删除该网络的所有 agents 和活动记录！

```bash
# 进入数据库
cd /path/to/agentscan/backend
sqlite3 8004scan.db

# 查看当前数据
SELECT COUNT(*) FROM agents WHERE network_id = 'base-sepolia';

# 删除该网络的所有数据（谨慎！）
DELETE FROM activities WHERE agent_id IN (SELECT id FROM agents WHERE network_id = 'base-sepolia');
DELETE FROM agents WHERE network_id = 'base-sepolia';
DELETE FROM blockchain_sync WHERE network_id = 'base-sepolia';

# 退出数据库
.quit

# 触发重新扫描
./scripts/trigger-sync.sh base-sepolia
```

## 详细步骤

### 步骤 1：确认网络配置

首先确认网络配置是否正确：

```bash
# 查看配置文件
cat backend/src/core/networks_config.py

# 确认以下信息：
# - chain_id: 84532 (Base Sepolia)
# - rpc_url: 环境变量 BASE_SEPOLIA_RPC_URL
# - contracts.identity: 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
# - contracts.reputation: 0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
# - start_block: 32481444
# - enabled: true
```

### 步骤 2：检查 RPC URL

确保 `.env` 文件中配置了 Base Sepolia RPC URL：

```bash
# 查看环境变量
grep BASE_SEPOLIA_RPC_URL backend/.env

# 如果没有，添加配置
echo "BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY" >> backend/.env
```

### 步骤 3：更新网络合约地址

如果数据库中的网络记录没有合约地址，需要更新：

```bash
# 运行网络初始化脚本（会自动更新合约地址）
cd backend
uv run python -m src.db.init_networks

# 应该看到类似输出：
# ✅ Updated contracts for Base Sepolia
```

### 步骤 4：重置同步状态

```bash
# 使用脚本重置
./scripts/reset-sync.sh base-sepolia

# 或者直接运行 Python
cd backend
uv run python -m src.db.reset_sync_status base-sepolia
```

**输出示例：**
```
📊 Connecting to database: /path/to/8004scan.db
✅ Found network: Base Sepolia (Chain ID: 84532)

📊 Current sync status:
   - Last block: 32481444
   - Current block: 32481444
   - Status: idle
   - Last synced: 2025-11-25 03:00:00

🗑️  Deleted sync status for Base Sepolia

⚠️  Found 0 existing agents for Base Sepolia
   These agents will NOT be deleted (unique constraint will prevent duplicates)

✅ Reset completed! Next sync will scan from start block.

🚀 To trigger sync manually:
   curl -X POST http://localhost:8000/api/sync/networks/base-sepolia

⏰ Or wait for the next scheduled sync (every 2 minutes)
```

### 步骤 5：触发同步

```bash
# 方法 1: 使用脚本（推荐）
./scripts/trigger-sync.sh base-sepolia

# 方法 2: 直接调用 API
curl -X POST http://localhost:8000/api/sync/networks/base-sepolia

# 方法 3: 等待定时任务（Base Sepolia 每 2 分钟同步一次）
# 下次同步时间：:01, :03, :05, :07, :09, ... 分钟
```

### 步骤 6：监控同步进度

```bash
# 查看实时日志
docker compose logs -f backend

# 或者查看统计信息
curl http://localhost:8000/api/stats | python3 -m json.tool

# 关键字段：
# - blockchain_sync.base-sepolia.last_block: 当前扫描到的区块
# - blockchain_sync.base-sepolia.status: 同步状态（idle/running/error）
```

## Docker 部署场景

如果使用 Docker Compose：

```bash
# 1. 进入容器执行重置
docker compose exec backend python -m src.db.reset_sync_status base-sepolia

# 2. 或者在宿主机上执行（推荐）
./scripts/reset-sync.sh base-sepolia

# 3. 触发同步
./scripts/trigger-sync.sh base-sepolia http://localhost:8000

# 4. 查看日志
docker compose logs -f backend | grep -E "base-sepolia|base_sepolia"
```

## 故障排查

### 问题 1：Network not found

```
❌ Network 'base-sepolia' not found in database
```

**解决方案**：
```bash
# 运行网络初始化
cd backend
uv run python -m src.db.init_networks
```

### 问题 2：RPC URL not configured

日志显示：
```
ValueError: BASE_SEPOLIA_RPC_URL is not configured
```

**解决方案**：
```bash
# 添加 RPC URL 到 .env
echo "BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY" >> backend/.env

# 重启服务
docker compose restart backend
```

### 问题 3：同步一直 idle

**原因**：
- 定时任务未启动
- 网络配置 `enabled: false`
- RPC URL 无效

**解决方案**：
```bash
# 检查定时任务日志
docker compose logs backend | grep scheduler

# 应该看到：
# scheduler_started networks=['sepolia', 'base-sepolia']

# 手动触发一次同步
./scripts/trigger-sync.sh base-sepolia

# 查看错误日志
docker compose logs backend | grep -i error
```

### 问题 4：大量 agent_insert_skipped

日志显示：
```
agent_insert_skipped token_id=1 reason="Agent already exists"
```

**这是正常的**！说明：
- 数据库中已有这些 agents
- 唯一约束正常工作，防止重复插入
- 同步会继续处理新的 agents

如果您想强制重新插入，需要先删除数据（见"方法 2：完全重新扫描"）。

## 同步性能

### Base Sepolia 同步参数

```python
"start_block": 32481444,      # 合约部署区块
"blocks_per_batch": 10000,    # 每批处理 10000 个区块
```

### 预估时间

假设当前区块高度为 33000000：

```
总区块数 = 33000000 - 32481444 = 518556
批次数 = 518556 / 10000 = 52 批
每批处理时间 ≈ 5-10 秒（取决于事件数量）
总时间 ≈ 52 * 7.5 = 390 秒 ≈ 6.5 分钟
```

**实际时间取决于**：
- RPC 提供商的速率限制
- 链上事件数量
- 网络延迟
- 服务器性能

## 最佳实践

### 1. 定期备份数据库

```bash
# 在重置前备份
cp backend/8004scan.db backend/8004scan.db.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. 使用重置而不是删除

优先使用 `reset-sync.sh`，而不是手动删除数据：
- ✅ 保留已有数据
- ✅ 唯一约束防止重复
- ✅ 只更新新增的 agents

### 3. 监控同步状态

```bash
# 创建一个监控脚本
watch -n 5 'curl -s http://localhost:8000/api/stats | jq ".blockchain_sync"'
```

### 4. 批量重置多个网络

```bash
# 重置所有网络
for network in sepolia base-sepolia; do
    ./scripts/reset-sync.sh $network
    sleep 2
done

# 等待 30 秒后检查状态
sleep 30
curl http://localhost:8000/api/stats | python3 -m json.tool
```

## API 参考

### 触发同步

```bash
POST /api/sync/networks/{network_key}
```

**示例**：
```bash
curl -X POST http://localhost:8000/api/sync/networks/base-sepolia
```

**响应**：
```json
{
  "message": "Sync initiated",
  "network": "base-sepolia"
}
```

### 查看同步状态

```bash
GET /api/stats
```

**响应**：
```json
{
  "blockchain_sync": {
    "base-sepolia": {
      "last_block": 32500000,
      "current_block": 33000000,
      "status": "running"
    }
  }
}
```

## 相关文件

- 配置文件：`backend/src/core/networks_config.py`
- 同步服务：`backend/src/services/blockchain_sync.py`
- 重置脚本：`backend/src/db/reset_sync_status.py`
- Shell 脚本：
  - `scripts/reset-sync.sh` - 重置同步状态
  - `scripts/trigger-sync.sh` - 手动触发同步
  - `scripts/init-networks.sh` - 初始化网络配置

## 总结

重新扫描 Base Sepolia 网络的完整流程：

```bash
# 1️⃣ 确认配置
grep BASE_SEPOLIA_RPC_URL backend/.env

# 2️⃣ 更新合约地址（如果需要）
cd backend && uv run python -m src.db.init_networks

# 3️⃣ 重置同步状态
./scripts/reset-sync.sh base-sepolia

# 4️⃣ 触发同步
./scripts/trigger-sync.sh base-sepolia

# 5️⃣ 监控进度
docker compose logs -f backend | grep base-sepolia
```

就这么简单！🎉
