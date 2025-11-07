# 多网络支持设置指南

## 当前状态

✅ **已完成**：
1. 网络配置文件已创建（`src/core/networks_config.py`）
2. 数据库中已初始化 4 个测试网（已清理旧的主网配置）
3. Networks API 端点已创建（`/api/networks`）
4. 前端 Networks 页面可以显示所有网络及合约地址
5. 数据库清理：已删除 Ethereum Mainnet、Polygon、Arbitrum 三个主网配置

## 配置的网络

### 1. Sepolia (当前同步中)
- Chain ID: 11155111
- Identity: `0x8004a6090Cd10A7288092483047B097295Fb8847`
- Reputation: `0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E`
- Validation: `0x8004CB39f29c09145F24Ad9dDe2A108C1A2cdfC5`

### 2. Base Sepolia
- Chain ID: 84532
- Identity: `0x8004AA63c570c570eBF15376c0dB199918BFe9Fb`
- Reputation: `0x8004bd8daB57f14Ed299135749a5CB5c42d341BF`
- Validation: `0x8004C269D0A5647E51E121FeB226200ECE932d55`

### 3. Linea Sepolia
- Chain ID: 59141
- Identity: `0x8004aa7C931bCE1233973a0C6A667f73F66282e7`
- Reputation: `0x8004bd8483b99310df121c46ED8858616b2Bba02`
- Validation: `0x8004c44d1EFdd699B2A26e781eF7F77c56A9a4EB`

### 4. Hedera Testnet
- Chain ID: 296
- Identity: `0x0ddaa2de07deb24d5f0288ee29c3c57c4159dcc7`
- Reputation: `0xcf4d195db80483eff011814a52d290bbab340a77`
- Validation: `0x833984fb21688d6a409e02ac67a6e0a63a06f55a`

## ⚠️ 需要解决的问题

### 数据库约束问题

当前 `agents` 表的 `token_id` 字段有 `UNIQUE` 约束，这会导致：
- 不同网络上相同 ID 的 agents 会冲突
- 无法同时同步多个网络

### 解决方案

需要修改数据库 schema，将 unique 约束从 `token_id` 改为 `(token_id, network_id)` 的组合约束。

#### 方案 1：创建数据库迁移（推荐）

```python
# 使用 Alembic 创建迁移
# 1. 移除 token_id 的 unique 约束
# 2. 添加复合 unique 约束 (token_id, network_id)
```

#### 方案 2：重置数据库（开发环境）

```bash
# 1. 备份数据
# 2. 删除数据库
# 3. 修改 Agent 模型
# 4. 重新初始化数据库
# 5. 重新同步数据
```

## 启用多网络同步的步骤

### 1. 更新 Agent 模型

修改 `src/models/agent.py`:

```python
class Agent(Base):
    # ...
    token_id = Column(Integer, nullable=True, index=True)  # 移除 unique=True

    # 添加复合 unique 约束
    __table_args__ = (
        UniqueConstraint('token_id', 'network_id', name='uq_agent_token_network'),
    )
```

### 2. 更新 blockchain_sync.py

修改检查逻辑，同时检查 `token_id` 和 `network_id`:

```python
existing_agent = db.query(Agent).filter(
    Agent.token_id == token_id,
    Agent.network_id == network_id  # 添加网络过滤
).first()
```

### 3. 为每个网络创建同步服务

在 `src/services/scheduler.py` 中为每个网络创建独立的同步任务。

### 4. 更新起始区块配置

在 `networks_config.py` 中填入各网络的实际起始区块号（合约部署区块）。

## 测试

```bash
# 1. 初始化网络
uv run python scripts/init_networks.py

# 2. 清理旧的主网配置（如需要）
uv run python scripts/remove_mainnets.py

# 3. 访问 Networks 页面
http://localhost:3000/networks

# 4. 查看 API 响应
curl http://localhost:8000/api/networks
```

## 后续工作

1. ✅ 网络配置已完成
2. ⏳ 数据库 schema 更新（需要迁移）
3. ⏳ 多网络同步服务（依赖步骤 2）
4. ⏳ 前端区分不同网络的 agents
