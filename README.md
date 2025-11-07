# 8004scan - ERC-8004 AI 代理浏览器

一个类似区块链浏览器的 Web 应用，用于探索和展示 ERC-8004 协议上的 AI 代理信息。

## 项目概述

8004scan 是一个全栈 Web 应用，包含前端展示界面和后端 API 服务，用于：
- 查看和搜索 AI 代理
- 追踪代理活动记录
- 展示网络统计数据
- 提供深色/浅色主题切换

## 技术栈

### 前端
- **Next.js 16.0.1** (App Router)
- **React 19.2.0**
- **TypeScript 5.x**
- **Tailwind CSS v4**

### 后端
- **Python 3.11+**
- **FastAPI**
- **SQLAlchemy 2.x**
- **Pydantic v2**
- **uv** (包管理器)

### 数据库
- **SQLite** (开发环境)
- **PostgreSQL** (生产环境，可选)

## 项目结构

```
8004scan/
├── frontend/              # Next.js 前端项目
│   ├── app/              # 页面和路由
│   ├── components/       # React 组件
│   ├── lib/              # 工具库和 API 客户端
│   └── types/            # TypeScript 类型定义
│
├── backend/              # FastAPI 后端项目
│   ├── src/
│   │   ├── api/         # API 路由
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic 数据模式
│   │   ├── db/          # 数据库配置
│   │   └── core/        # 核心配置
│   └── logs/            # 日志目录
│
├── scripts/             # 运行脚本
├── docs/                # 正式文档
└── discuss/             # 讨论和方案
```

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- uv (Python 包管理器)

### 安装 uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 启动开发环境

#### 方式一：同时启动前后端

```bash
./scripts/dev-all.sh
```

#### 方式二：分别启动

**启动后端：**
```bash
./scripts/dev-backend.sh
```

**启动前端：**
```bash
./scripts/dev-frontend.sh
```

### 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 主要功能

### 首页
- 整体统计数据（总代理数、活跃代理、网络数、活动数）
- 搜索功能
- 精选代理展示（8个）
- 最近活动记录

### 代理列表
- 所有代理列表
- 分页和搜索
- 代理状态筛选

### 代理详情
- 代理完整信息
- 活动历史
- 相关数据

### 网络信息
- 支持的区块链网络
- 网络统计数据

## API 接口

### 统计数据
- `GET /api/stats` - 获取整体统计数据

### 代理相关
- `GET /api/agents` - 获取代理列表（支持分页和搜索）
- `GET /api/agents/featured` - 获取精选代理
- `GET /api/agents/{id}` - 获取代理详情

### 网络相关
- `GET /api/networks` - 获取网络列表
- `GET /api/networks/{id}` - 获取网络详情

### 活动记录
- `GET /api/activities` - 获取最近活动记录

## 开发指南

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload
```

### 初始化数据库

```bash
cd backend
uv run python -m src.db.init_data
```

## 环境变量

### 后端 (.env)

```env
DEBUG=true
DATABASE_URL=sqlite:///./8004scan.db
```

### 前端 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 代码质量标准

- TypeScript/Python 文件不超过 300 行
- 每个文件夹不超过 8 个文件
- 遵循优雅的架构设计原则
- 避免代码坏味道（僵化、冗余、循环依赖等）

## 测试数据

项目包含测试数据初始化脚本，会创建：
- 3 个区块链网络（Ethereum、Polygon、Arbitrum）
- 8 个 AI 代理
- 40+ 个活动记录

## 后续计划

- [ ] 实现代理列表页和详情页
- [ ] 实现网络列表页和详情页
- [ ] 添加更多搜索和筛选功能
- [ ] 集成真实的区块链数据
- [ ] 添加用户认证
- [ ] 部署到生产环境

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
