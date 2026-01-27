# ERC-8004 Mainnet Freeze Update (Jan 27, 2026)

## Overview

ERC-8004 规范已于 2026 年 1 月 27 日正式冻结，主网上线预计在本周四（~2026-01-30）9 AM ET。

本文档记录了 Agentscan 为适配主网冻结版本所做的所有更新。

## Key Changes Summary

### 1. Reputation 评分系统：score → value/valueDecimals

**这是最重大的变更！**

| 项目 | 旧版本 | 新版本 |
|------|--------|--------|
| 评分字段 | `uint8 score` (0-100) | `int128 value` + `uint8 valueDecimals` |
| 支持范围 | 仅 0-100 整数 | 小数、负数、大于 100 的值 |
| getSummary 返回 | `(count, averageScore)` | `(count, summaryValue, summaryValueDecimals)` |
| readFeedback 返回 | `(score, tag1, tag2)` | `(value, valueDecimals, tag1, tag2, isRevoked)` |

**为什么需要这个变更：**

| 场景 | 旧版本无法表示 | 新版本 (value, decimals) |
|------|--------------|-------------------------|
| 成功率 99.77% | ❌ 只能近似为 100 | ✅ (9977, 2) |
| 交易收益 -3.2% | ❌ 不支持负数 | ✅ (-32, 1) |
| 累计收入 $556,000 | ❌ 最大 100 | ✅ (556000, 0) |
| 响应时间 560ms | ❌ 超出范围 | ✅ (560, 0) |

### 2. 标准化 tag1 值（Best Practices）

| tag1 | 测量类型 | 示例 | value | valueDecimals |
|------|---------|------|-------|---------------|
| `starred` | 质量评分 (0-100) | 87/100 | 87 | 0 |
| `reachable` | 可达性 (二进制) | true | 1 | 0 |
| `ownerVerified` | 所有者验证 | true | 1 | 0 |
| `uptime` | 正常运行时间 | 99.77% | 9977 | 2 |
| `successRate` | 成功率 | 89% | 89 | 0 |
| `responseTime` | 响应时间 (ms) | 560ms | 560 | 0 |
| `blocktimeFreshness` | 区块延迟 | 4 blocks | 4 | 0 |
| `revenues` | 累计收入 | $560 | 560 | 0 |
| `tradingYield` | 交易收益率 | -3.2% | -32 | 1 |

### 3. getSummary 要求 clientAddresses 非空

**旧版本：**
```python
getSummary(agentId, [], "", "")  # 空数组表示所有 clients
```

**新版本（主网冻结）：**
```python
clients = getClients(agentId)  # 先获取 clients 列表
getSummary(agentId, clients, "", "")  # 传入实际 clients
```

### 4. NewFeedback 事件结构

```solidity
event NewFeedback(
    uint256 indexed agentId,
    address indexed clientAddress,
    uint64 feedbackIndex,
    int128 value,              // 🆕 替代 uint8 score
    uint8 valueDecimals,       // 🆕 小数位数
    string indexed indexedTag1, // 用于过滤的 keccak256 哈希
    string tag1,               // 实际 tag1 字符串
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
);
```

### 5. Registration 文件：endpoints → services

为避免与 feedback 中的 `endpoint` 字段混淆：

```json
// 旧版本
{ "endpoints": [...] }

// 新版本（主网）
{ "services": [...] }
```

## Code Changes

### Backend Files Modified

| 文件 | 变更说明 |
|-----|---------|
| `src/abi/ReputationRegistry.json` | 🆕 官方 ABI 文件（从 GitHub 下载） |
| `src/core/reputation_config.py` | 从 JSON 文件加载 ABI |
| `src/models/feedback.py` | score → value/value_decimals 字段 |
| `src/db/migrate_feedback_value.py` | 🆕 数据库迁移脚本 |
| `src/main.py` | 添加迁移调用 |
| `src/services/blockchain_sync.py` | 事件解析 + getSummary 调用更新 |
| `src/services/reputation_sync.py` | getSummary 调用更新 |
| `src/services/onchain_reader.py` | readFeedback/getSummary 更新 |
| `src/api/feedback.py` | API 响应格式更新 |
| `src/schemas/feedback.py` | FeedbackResponse schema 更新 |

### Frontend Files Modified

| 文件 | 变更说明 |
|-----|---------|
| `types/index.ts` | Feedback 接口更新 |
| `components/agent/FeedbackList.tsx` | ValueDisplay 组件支持多种 tag 类型 |

## Database Migration

迁移脚本 `migrate_feedback_value.py` 自动处理：

1. 将 `score` 列重命名/转换为 `value` (BigInteger)
2. 新增 `value_decimals` 列 (Integer, 默认 0)
3. 现有数据：`score=100` → `value=100, value_decimals=0`

迁移在后端启动时自动执行。

## API Response Format

### Before (旧格式)
```json
{
  "score": 100,
  "tag1": "starred",
  ...
}
```

### After (新格式)
```json
{
  "value": 100,
  "value_decimals": 0,
  "display_value": "100",
  "tag1": "starred",
  ...
}
```

## Frontend Display Logic

`ValueDisplay` 组件根据 `tag1` 类型自动格式化显示：

- `starred`: 环形进度条 (0-100)
- `uptime/successRate`: 百分比 (e.g., "99.77%")
- `responseTime`: 毫秒 (e.g., "560ms")
- `reachable/ownerVerified`: Yes/No
- `revenues`: 金额 (e.g., "$560")
- `tradingYield`: 带符号百分比 (e.g., "-3.2%")

## Contract Addresses (Unchanged)

| 合约 | Sepolia 地址 |
|------|-------------|
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## References

- **ERC-8004 Specs**: https://eips.ethereum.org/EIPS/eip-8004
- **Official Contracts**: https://github.com/erc-8004/erc-8004-contracts
- **Official ABIs**: https://github.com/erc-8004/erc-8004-contracts/tree/master/abis
- **Registration Best Practices**: https://github.com/erc-8004/best-practices/blob/main/Registration.md
- **Reputation Best Practices**: https://github.com/erc-8004/best-practices/blob/main/Reputation.md

## Testing

```bash
# 重启后端（自动运行迁移）
./scripts/dev-backend.sh

# 验证 API 响应
curl -s "http://localhost:8000/api/agents/{agent_id}/feedbacks" | jq

# 检查迁移状态
tail -f backend/logs/*.log | grep -E 'feedback_value_migration|feedback_from_cache'
```

## Changelog

- **2026-01-27**: 初始版本 - 适配 ERC-8004 主网冻结
  - 实现 value/valueDecimals 支持
  - 更新所有 getSummary 调用（先获取 clients）
  - 添加官方 ABI 文件
  - 前端 ValueDisplay 组件支持多种 tag 类型
