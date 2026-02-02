# BSC 主网部署状态

**更新时间**: 2026-01-30
**状态**: ⏳ 待部署合约

---

## 部署者账户信息

| 项目 | 值 |
|------|-----|
| 地址 | `0x247D283b6101cf27e26548aA28FBB139F9D346d5` |
| 当前余额 | 0.16 BNB ✅ |
| BSCScan | [查看](https://bscscan.com/address/0x247D283b6101cf27e26548aA28FBB139F9D346d5) |
| 状态 | ✅ 余额充足，可以部署 |

---

## 网络配置

| 配置项 | 值 |
|--------|-----|
| Network ID | `bsc` |
| Network Name | BNB Smart Chain |
| Chain ID | 56 |
| RPC URL | QuickNode (已配置) ✅ |
| Explorer | https://bscscan.com |
| 区块时间 | ~3 秒 |
| Batch Size | 5,000 blocks |

**RPC 测试结果**:
```
✅ BSC RPC 连接成功
Chain ID: 56
当前区块: 78,270,033
✅ 确认是 BSC 主网
```

---

## 待部署合约

### Identity Registry

- ⏳ 状态: 待部署
- 预计 Gas: ~3,500,000
- 预计成本: ~0.02 BNB

### Reputation Registry

- ⏳ 状态: 待部署
- 预计 Gas: ~3,000,000
- 预计成本: ~0.015 BNB

**总预计成本**: ~0.035 BNB (含 buffer: 0.05 BNB)

---

## 部署步骤

### 1. 部署合约（使用官方仓库）

```bash
# 克隆官方合约仓库
git clone https://github.com/erc-8004/erc-8004-contracts.git
cd erc-8004-contracts

# 配置环境
cat > .env << EOF
BSC_RPC_URL=https://dark-divine-pool.bsc.quiknode.pro/1901fe0d2ad4caa6cf9ab68c628bcab7be99f665
PRIVATE_KEY=d0c5c9cb5fc95a779c0ab32348c3a5bb484c17bf0144e43958b2cf1c207bf41b
CHAIN_ID=56
EOF

# 部署（使用 Foundry 或 Hardhat）
forge script script/Deploy.s.sol:Deploy --rpc-url $BSC_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify

# 或使用 Hardhat
npx hardhat run scripts/deploy.js --network bsc
```

### 2. 更新 Agentscan 配置

部署完成后，更新 `backend/.env`:

```bash
BSC_IDENTITY_CONTRACT=0x<IDENTITY_PROXY_ADDRESS>
BSC_REPUTATION_CONTRACT=0x<REPUTATION_PROXY_ADDRESS>
```

更新 `backend/src/core/networks_config.py`:

```python
"bsc": {
    ...
    "start_block": <DEPLOYMENT_BLOCK_NUMBER>,
    ...
}
```

### 3. 初始化数据库

```bash
# 本地环境
cd backend
uv run python -c "
from src.db.init_networks import init_networks
from src.db.database import SessionLocal
db = SessionLocal()
init_networks(db)
db.close()
"

# Docker 环境
docker compose exec backend uv run python -c "
from src.db.init_networks import init_networks
from src.db.database import SessionLocal
db = SessionLocal()
init_networks(db)
db.close()
"
```

### 4. 启动同步

```bash
# 本地
./scripts/dev-backend.sh

# Docker
docker compose restart backend
docker compose logs -f backend | grep -E "bsc|BSC"
```

---

## Agentscan 配置状态

### 已完成 ✅

- [x] BSC 网络配置添加到 `networks_config.py`
- [x] BSC RPC URL 配置 (QuickNode)
- [x] 部署者私钥安全存储（`.env`）
- [x] 禁用其他网络（Ethereum, Sepolia）
- [x] 网络图标配置（待添加）

### 待完成 ⏳

- [ ] 部署 Identity Registry 合约
- [ ] 部署 Reputation Registry 合约
- [ ] 更新合约地址到配置
- [ ] 设置起始区块号
- [ ] 初始化数据库网络配置
- [ ] 验证合约代码（BSCScan）
- [ ] 测试同步功能
- [ ] 添加 BSC 网络图标到前端

---

## 安全检查清单

### 部署前 ✅

- [x] 私钥存储在 `.env` 文件中（不提交到 git）
- [x] `.env` 文件已加入 `.gitignore`
- [x] 部署地址余额充足（0.16 BNB > 0.1 BNB）
- [x] RPC 连接测试通过
- [x] 确认网络是 BSC 主网（Chain ID 56）

### 部署后 ⏳

- [ ] 合约地址已记录
- [ ] 合约代码已验证（BSCScan）
- [ ] 私钥已从 `.env` 删除（或转移到安全存储）
- [ ] 剩余 BNB 已转移到安全钱包
- [ ] 合约所有权已转移到多签钱包（可选）

---

## 预期结果

部署并配置完成后：

1. **前端**: BSC 网络出现在网络选择器
2. **同步**: 自动从部署区块开始同步
3. **功能**: 可以浏览 BSC 上的 ERC-8004 agents
4. **性能**: 每 10 分钟同步一次，批量大小 5,000 blocks

---

## 参考文档

- 详细部署指南: `docs/bsc-deployment-guide.md`
- 主网合约检查: `docs/mainnet-contract-check-2026-01-30.md`
- ERC-8004 官方合约: https://github.com/erc-8004/erc-8004-contracts
- BSC 文档: https://docs.bnbchain.org/

---

**下一步**: 使用官方合约仓库部署 Identity 和 Reputation Registry 到 BSC 主网

## 2026-01-30 Update: Analytics Fix Deployed

### Issue
Analytics API endpoint returning integer overflow error when calculating gas and fee statistics.

### Solution
Modified `backend/src/api/analytics.py` to cast BigInteger fields to Float before aggregation:
```python
func.sum(cast(Activity.gas_used, Float))
func.sum(cast(Activity.transaction_fee, Float))
```

### Deployment
- Rebuilt backend Docker image
- Recreated container with updated code
- Verified both internal (8001) and public (8080) endpoints

### Status
✅ **Deployed and verified** - Analytics endpoint now returns correct statistics for 22,790+ transactions with ~43.36 ETH total fees.

