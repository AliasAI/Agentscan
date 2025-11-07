# Reputation Score 同步设计

## 合约分析

ReputationRegistry 合约提供以下关键功能：

### 事件
- `NewFeedback`: 新反馈提交时触发（包含 agentId, score, tags 等）
- `FeedbackRevoked`: 反馈被撤销时触发
- `ResponseAppended`: agent 回应反馈时触发

### 读取函数
- `getSummary(agentId, clientAddresses[], tag1, tag2)`: 返回 (count, averageScore)
- `readAllFeedback(...)`: 读取所有反馈详情
- `getClients(agentId)`: 获取给该 agent 提供过反馈的所有客户地址

## 同步方案

### 方案 1: 事件驱动增量同步（推荐）

**优点**: 实时性好，资源消耗低
**适用**: 生产环境

#### 实现步骤：

1. **监听 NewFeedback 事件**
   - 当检测到新反馈时，立即更新对应 agent 的评分
   - 使用 `getSummary(agentId, [], 0, 0)` 获取最新平均分

2. **监听 FeedbackRevoked 事件**
   - 反馈被撤销时重新计算评分

3. **数据库字段扩展**
   ```python
   # 在 Agent 模型中添加
   reputation_score: float          # 当前分数 (0-100)
   reputation_count: int            # 反馈数量
   reputation_last_updated: datetime # 最后更新时间
   ```

4. **更新逻辑**
   ```python
   async def update_reputation(agent_id: int):
       # 调用合约的 getSummary
       count, average_score = await reputation_contract.getSummary(agent_id)

       # 更新数据库
       agent.reputation_score = average_score
       agent.reputation_count = count
       agent.reputation_last_updated = datetime.utcnow()
   ```

### 方案 2: 定期批量同步

**优点**: 实现简单，适合初期开发
**缺点**: 延迟较高，RPC 调用多

#### 实现步骤：

1. **定时任务**（如每 10 分钟）
   - 遍历所有 agents
   - 调用 `getSummary(agentId)` 获取最新评分
   - 批量更新数据库

2. **优化策略**
   - 只更新近期活跃的 agents
   - 使用缓存减少重复调用
   - 错误重试机制

### 方案 3: 混合模式（最佳实践）

结合方案 1 和 2：
- 实时监听事件，立即更新受影响的 agent
- 每天凌晨全量同步一次，确保数据一致性
- 对于新注册的 agent，首次同步获取初始评分

## 评分展示策略

### 1. **评分可信度指标**

```python
def get_reputation_display(agent):
    if agent.reputation_count == 0:
        return {
            "score": None,
            "display": "No reviews yet",
            "confidence": "none"
        }
    elif agent.reputation_count < 5:
        return {
            "score": agent.reputation_score,
            "display": f"{agent.reputation_score:.1f}/100",
            "confidence": "low",
            "badge": "New"
        }
    elif agent.reputation_count < 20:
        return {
            "score": agent.reputation_score,
            "display": f"{agent.reputation_score:.1f}/100",
            "confidence": "medium",
            "count": agent.reputation_count
        }
    else:
        return {
            "score": agent.reputation_score,
            "display": f"{agent.reputation_score:.1f}/100",
            "confidence": "high",
            "count": agent.reputation_count
        }
```

### 2. **前端展示**

```tsx
<div className="reputation">
  <div className="score">{score}/100</div>
  <div className="meta">
    <span className="count">{count} reviews</span>
    {confidence === 'low' && <span className="badge">Few reviews</span>}
  </div>
</div>
```

## 技术实现

### 需要的信息

在开始实现前，需要确认：

1. **ReputationRegistry 合约地址**（Sepolia 测试网）
2. **起始区块号**（合约部署区块）
3. **是否已有反馈数据**（可先查询测试）

### 代码结构

```
backend/src/
├── services/
│   ├── blockchain_sync.py           # 现有的 agent 同步
│   └── reputation_sync.py           # 新增：reputation 同步
├── models/
│   └── agent.py                     # 扩展字段
└── core/
    └── reputation_config.py         # reputation 配置
```

## 后续优化

1. **加权评分**：根据评价者的声誉加权
2. **时间衰减**：较新的评价权重更高
3. **标签过滤**：按不同 tag 展示细分评分
4. **趋势分析**：展示评分变化趋势

## 测试计划

1. **单元测试**：测试评分计算逻辑
2. **集成测试**：测试事件监听和数据库更新
3. **压力测试**：大量 agents 的同步性能
