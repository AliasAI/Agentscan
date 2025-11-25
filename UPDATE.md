# 🚀 服务器更新指南 - Base Sepolia 重新扫描

## ⚠️ 重要说明

您的错误 `No module named src.db.reset_sync_status` 是因为：
1. 容器内的代码可能不是最新的
2. 我创建了新的脚本，使用**内联 Python 代码**而不是依赖模块文件

## 📋 更新步骤（在服务器上执行）

```bash
# 1️⃣ 进入项目目录
cd ~/Agentscan

# 2️⃣ 拉取最新代码（包含新的 Docker 脚本）
git pull

# 3️⃣ 重启后端容器（加载最新代码和运行迁移）
docker compose restart backend

# 4️⃣ 等待容器启动完成
sleep 5

# 5️⃣ 验证容器运行正常
docker compose ps

# 6️⃣ 查看启动日志（确认迁移成功）
docker compose logs --tail=50 backend | grep -E "migration|network"

# 7️⃣ 重置 Base Sepolia 同步状态（使用新脚本）
./scripts/docker-reset-sync.sh base-sepolia

# 8️⃣ 手动触发同步（可选，否则等待定时任务）
./scripts/docker-trigger-sync.sh base-sepolia

# 9️⃣ 监控同步进度
docker compose logs -f backend | grep -E "base-sepolia|base_sepolia"
```

## 🔧 新增的 Docker 脚本

### 1. **docker-reset-sync.sh** - 重置同步状态

```bash
# 重置 base-sepolia 网络同步（从起始区块重新扫描）
./scripts/docker-reset-sync.sh base-sepolia

# 重置 sepolia 网络同步
./scripts/docker-reset-sync.sh sepolia
```

**工作原理：**
- 在容器内执行内联 Python 代码
- 不依赖 `src.db.reset_sync_status` 模块
- 直接使用 SQLAlchemy ORM 操作数据库

### 2. **docker-trigger-sync.sh** - 手动触发同步

```bash
# 手动触发 base-sepolia 同步
./scripts/docker-trigger-sync.sh base-sepolia
```

**工作原理：**
- 在容器内直接调用 `BlockchainSyncService`
- 立即执行一次完整的同步周期
- 适合测试或紧急同步需求

### 3. **docker-exec.sh** - 容器命令执行

```bash
# 进入后端容器交互式 shell
./scripts/docker-exec.sh backend

# 在容器内执行命令
./scripts/docker-exec.sh backend env | grep RPC_URL
./scripts/docker-exec.sh backend uv run python -c "print('hello')"
```

### 4. **docker-logs.sh** - 查看日志（已有，更新说明）

```bash
# 查看所有容器日志
./scripts/docker-logs.sh

# 只看后端日志
./scripts/docker-logs.sh backend

# 只看前端日志
./scripts/docker-logs.sh frontend
```

## 🔍 验证同步是否正常

### 检查同步状态

```bash
# 方法 1：通过 API 检查
curl http://localhost:8000/api/stats | python3 -m json.tool

# 方法 2：查看数据库（进入容器）
./scripts/docker-exec.sh backend uv run python -c "
from src.db.database import SessionLocal
from src.models import BlockchainSync, Agent

db = SessionLocal()
sync = db.query(BlockchainSync).filter(BlockchainSync.network_id == 'base-sepolia').first()
if sync:
    print(f'Last Block: {sync.last_block}')
    print(f'Current Block: {sync.current_block}')
    print(f'Status: {sync.status}')

agent_count = db.query(Agent).filter(Agent.network_id == 'base-sepolia').count()
print(f'Total Agents: {agent_count}')
db.close()
"
```

### 监控同步日志

```bash
# 实时查看同步日志
docker compose logs -f backend | grep -E "sync_started|events_found|agent_created|reputation_updated"

# 查看 base-sepolia 相关日志
docker compose logs -f backend | grep -i "base.sepolia"

# 查看错误日志
docker compose logs -f backend | grep -i error
```

## 📊 预期结果

执行 `docker-reset-sync.sh base-sepolia` 后，您应该看到：

```
🔄 重置 base-sepolia 网络的同步状态（Docker 环境）...
📋 网络: Base Sepolia Testnet (Chain ID: 84532)
✅ 同步状态已重置
   从区块 XXXXX 重置到 21145984
✅ 重置完成！
💡 提示：后端定时任务会在下一个同步周期（每10分钟的固定时间）自动开始同步
```

然后在日志中看到：

```
sync_started network=base-sepolia from_block=21145984 to_block=XXXXX
events_found network=base-sepolia event_type=Registered count=X
agent_created network=base-sepolia agent_id=xxx name="Agent Name"
```

## ⚠️ 故障排查

### 问题 1：脚本不存在

```bash
# 确保拉取了最新代码
git pull

# 检查脚本是否存在
ls -la scripts/docker-reset-sync.sh
```

### 问题 2：容器未运行

```bash
# 检查容器状态
docker compose ps

# 如果没运行，启动容器
docker compose up -d

# 查看启动错误
docker compose logs backend
```

### 问题 3：环境变量未配置

```bash
# 检查 BASE_SEPOLIA_RPC_URL
./scripts/docker-exec.sh backend env | grep BASE_SEPOLIA_RPC_URL

# 如果未配置，编辑 backend/.env
vim backend/.env
# 添加: BASE_SEPOLIA_RPC_URL=https://your-rpc-url

# 重启容器
docker compose restart backend
```

### 问题 4：数据库权限问题

```bash
# 检查数据库文件权限
ls -la data/8004scan.db

# 如果权限不对，修复
sudo chown -R $USER:$USER data/
```

## 📚 相关文档

- **SERVER_OPS.md** - 完整的服务器运维指南
- **CLAUDE.md** - 项目技术文档和架构说明
- **docs/DEPLOYMENT.md** - 部署指南
- **docs/rpc-optimization-final.md** - RPC 优化说明

## 🆘 紧急联系

如果遇到问题：
1. 查看实时日志：`docker compose logs -f backend`
2. 检查容器状态：`docker compose ps`
3. 进入容器调试：`./scripts/docker-exec.sh backend`
4. 查看数据库状态：使用上面的验证命令
