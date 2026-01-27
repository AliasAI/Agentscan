# BSC 主网 ERC-8004 合约部署文档

> 最后更新: 2026-01-22

## 部署概览

| 项目 | 值 |
|------|-----|
| 网络 | BNB Smart Chain (BSC) Mainnet |
| Chain ID | 56 |
| 部署者 | `0x1832EB84bcF7a97aA9C1c58329Fa47Ff3C9DA41d` |
| 合约版本 | ERC-8004 v2.0.0 (Jan 2026 规范) |
| 部署时间 | 2026-01-22 |
| 起始区块 | 76742171 |

## 当前状态: ⚠️ 部分完成

### ✅ 已部署 - 实现合约

实现合约已成功部署，可以复用：

| 合约 | 地址 | 状态 |
|------|------|------|
| IdentityRegistryUpgradeable | `0x01087213e3934bc156194e0d8a9c00f09874c572` | ✅ 已部署 |
| ReputationRegistryUpgradeable | `0xe55d10f699bcf2207573b7be697c983c0d92c2b5` | ✅ 已部署 |

### ⚠️ 需要重新部署 - 代理合约

首次部署的代理合约因 owner 未正确设置，无法初始化：

| 合约 | 地址 | 问题 |
|------|------|------|
| Identity Proxy (旧) | `0xd2184d4377b2dc4fcc9ad8f2f0b9842bf6f1a19f` | owner=0x0，无法调用 initialize() |
| Reputation Proxy (旧) | `0xcd40e749c64761da2298436fe0ea4dc23f58c1f3` | owner=0x0，无法调用 initialize() |

**原因分析：** 官方 ERC-8004 合约的 `initialize()` 函数使用 `reinitializer(2) onlyOwner` 修饰符，设计用于升级场景。全新部署需要先通过 MinimalUUPS 设置 owner。

## 完成部署所需步骤

### 1. 充值 BNB

向部署者地址充值约 **0.01 BNB**：
```
0x1832EB84bcF7a97aA9C1c58329Fa47Ff3C9DA41d
```

### 2. 运行完整部署脚本

```bash
cd contracts
npx hardhat run scripts/deploy-full.ts --network bscMainnet
```

该脚本会：
1. 部署 MinimalUUPS 实现（用于设置 owner）
2. 部署 Identity Proxy（调用 initialize 设置 owner）
3. 部署 Reputation Proxy（调用 initialize 设置 owner 和关联 Identity）
4. 升级 Identity Proxy 到 IdentityRegistryUpgradeable
5. 升级 Reputation Proxy 到 ReputationRegistryUpgradeable

### 3. 验证合约（可选）

```bash
# 获取 BscScan API Key: https://bscscan.com/myapikey
# 添加到 contracts/.env: BSCSCAN_API_KEY=xxx

npx hardhat run scripts/verify.ts --network bscMainnet
```

## 官方合约来源

合约代码来自官方仓库：
- **仓库**: https://github.com/erc-8004/erc-8004-contracts
- **合约目录**: https://github.com/erc-8004/erc-8004-contracts/tree/master/contracts
- **ABI 目录**: https://github.com/erc-8004/erc-8004-contracts/tree/master/abis

### 使用的合约文件

| 文件 | 说明 |
|------|------|
| IdentityRegistryUpgradeable.sol | 身份注册表（ERC-721 + UUPS） |
| ReputationRegistryUpgradeable.sol | 声誉注册表（UUPS） |
| ERC1967Proxy.sol | 标准代理合约 |
| MinimalUUPS.sol | 最小化 UUPS（用于初始化 owner） |

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      BSC Mainnet (Chain ID: 56)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │ Identity Proxy  │         │ Reputation Proxy│           │
│  │   (ERC1967)     │         │   (ERC1967)     │           │
│  └────────┬────────┘         └────────┬────────┘           │
│           │ delegatecall              │ delegatecall       │
│           ▼                           ▼                     │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │IdentityRegistry │         │ReputationRegistry│          │
│  │  Upgradeable    │◄────────│  Upgradeable     │          │
│  │ Implementation  │ linked  │  Implementation  │          │
│  └─────────────────┘         └─────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 环境配置

### contracts/.env

```bash
# 部署者私钥（不带 0x 前缀）
DEPLOYER_PRIVATE_KEY=your_private_key_here

# BSC RPC URLs
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org/

# BscScan API Key（合约验证用）
BSCSCAN_API_KEY=your_api_key_here
```

## Gas 费用参考

| 操作 | 预估 Gas | 预估费用 (3 gwei) |
|------|----------|-------------------|
| 部署 IdentityRegistryUpgradeable | ~5,000,000 | ~0.015 BNB |
| 部署 ReputationRegistryUpgradeable | ~6,000,000 | ~0.018 BNB |
| 部署 MinimalUUPS | ~500,000 | ~0.0015 BNB |
| 部署 ERC1967Proxy (x2) | ~400,000 | ~0.0012 BNB |
| upgradeToAndCall (x2) | ~100,000 | ~0.0003 BNB |
| **总计（完整部署）** | ~12,000,000 | **~0.036 BNB** |
| **续部署（复用实现）** | ~1,000,000 | **~0.003 BNB** |

## 部署后集成

完成部署后，需要更新 Agentscan 后端和前端配置：

### 1. 后端配置

编辑 `backend/src/core/networks_config.py`，添加 BSC 主网：

```python
NetworkConfig(
    id="bsc-mainnet",
    name="BNB Smart Chain",
    chain_id=56,
    rpc_url=os.getenv("BSC_MAINNET_RPC_URL", "https://bsc-dataseed.binance.org/"),
    explorer_url="https://bscscan.com",
    contracts={
        "identity": "0x...",  # 新的 Identity Proxy 地址
        "reputation": "0x...",  # 新的 Reputation Proxy 地址
    },
    start_block=76742171,  # 部署区块
    enabled=True,
)
```

### 2. 前端配置

编辑 `frontend/lib/web3/contracts.ts`：

```typescript
export const IDENTITY_CONTRACTS: Record<number, Address> = {
  11155111: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // Sepolia
  56: '0x...', // BSC Mainnet - 新的 Identity Proxy 地址
}

export const REPUTATION_CONTRACTS: Record<number, Address> = {
  11155111: '0x8004B663056A597Dffe9eCcC1965A193B7388713', // Sepolia
  56: '0x...', // BSC Mainnet - 新的 Reputation Proxy 地址
}
```

## 相关文档

- [ERC-8004 规范](https://eips.ethereum.org/EIPS/eip-8004)
- [CLAUDE.md - ERC-8004 Jan 2026 规范更新](../CLAUDE.md)
- [Agentscan 部署文档](../../docs/DEPLOYMENT.md)
