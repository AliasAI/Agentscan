# 更新日志

## 2025-12-09 - Trust & Reputation History

### What's New

Agent 详情页新增 **Trust & Reputation** 区域，完整展示链上信誉数据：

- **Reviews Tab** - 查看所有用户对 Agent 的评价
  - 评分可视化（0-100 圆环，红/黄/绿动态颜色）
  - 评价者地址、时间、标签
  - 撤销状态标记

- **Validations Tab** - 查看 Agent 的验证历史
  - 状态徽章（Pending / Completed / Expired）
  - 验证者地址和响应分数
  - 请求/完成时间

### Architecture

**数据架构设计**：混合数据源，各取所长

| 数据类型 | 来源 | 说明 |
|---------|------|------|
| Agent 基本信息 | 链上事件 → 本地 DB | 定时同步，支持搜索 |
| reputation_count | 链上事件驱动 | 实时更新，显示在卡片 |
| Reviews/Validations 列表 | **Agent0 Subgraph** | 按需查询，完整历史 |

**为什么这样设计？**
- 聚合数据（count/score）访问频繁 → 本地缓存
- 历史明细（列表）按需访问 → Subgraph 实时查询
- 两者数据源相同（链上事件），保证一致性

### Technical Details

**后端**
- 新增 `SubgraphService` - 异步 GraphQL 客户端（httpx）
- 新增 API：`/agents/{id}/feedbacks`、`/validations`、`/reputation-summary`
- 使用 The Graph Gateway 正式端点

**前端**
- 新增 `TrustTabs` - Tab 切换容器
- 新增 `FeedbackList` / `ValidationList` - 分页列表组件
- 继承黑白灰极简设计系统

### Data Source

- **Subgraph**: Agent0 Sepolia via The Graph Gateway
- **Real-time**: 直接查询，无本地缓存
- **Pagination**: 支持分页浏览历史记录

---

## 2025-11-04 - Initial Release

### 已完成
- 初始化项目结构
- 前端项目（Next.js 16 + React 19 + Tailwind CSS v4）
- 后端项目（Python + FastAPI + SQLAlchemy）
- 数据库模型和 API 接口
- 首页完整实现
- 运行脚本
- 测试数据初始化

### 技术栈
- Next.js 16.0.1
- React 19.2.0
- Tailwind CSS v4
- FastAPI
- SQLAlchemy 2.x
- Python 3.11+

### 使用方法

```bash
# 启动后端
./scripts/dev-backend.sh

# 启动前端
./scripts/dev-frontend.sh
```

访问：
- 前端：http://localhost:3000
- 后端：http://localhost:8000
- API文档：http://localhost:8000/docs
