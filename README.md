# Agentscan - ERC-8004 AI Agent Explorer

一个类似区块链浏览器的 Web 应用，用于探索和展示 ERC-8004 协议上的 AI 代理信息。

## ✨ 核心功能

- 🔍 查看和搜索 AI 代理
- 📊 展示网络统计数据和代理活动
- 🏷️ OASF 自动分类（Skills & Domains）
- 🌓 深色/浅色主题切换
- 🔄 自动同步链上数据

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.11+
- uv (Python 包管理器)

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 启动开发环境

```bash
# 同时启动前后端
./scripts/dev-all.sh

# 或分别启动
./scripts/dev-backend.sh  # 后端 (端口 8000)
./scripts/dev-frontend.sh # 前端 (端口 3000)
```

### 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

## 📁 项目结构

```
agentscan/
├── frontend/              # Next.js 16 + React 19 + Tailwind CSS v4
│   ├── app/              # 页面路由
│   ├── components/       # React 组件
│   ├── lib/              # API 客户端
│   └── types/            # TypeScript 类型
│
├── backend/              # FastAPI + SQLAlchemy + Web3.py
│   ├── src/
│   │   ├── api/         # API 路由
│   │   ├── models/      # 数据库模型
│   │   ├── services/    # 业务逻辑
│   │   ├── taxonomies/  # OASF 分类数据
│   │   └── core/        # 核心配置
│   └── logs/            # 日志输出
│
├── scripts/             # 运行脚本
├── docs/                # 正式文档
└── discuss/             # 讨论和历史记录
```

## 🛠️ 技术栈

### 前端
- Next.js 16.0.1 (App Router)
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS v4

### 后端
- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- Web3.py (Sepolia 网络)
- uv (包管理器)

### 数据库
- SQLite (开发环境)
- PostgreSQL (生产环境推荐)

## 📖 核心功能说明

### 🔄 区块链同步

- 自动从 Sepolia 网络同步 ERC-8004 合约数据
- 批量处理区块（10000 块/批次）
- 增量同步，避免重复处理
- 定时任务：每 5 分钟同步一次

### 🏷️ OASF 自动分类

基于 [OASF v0.8.0](https://github.com/agntcy/oasf) 规范，自动为 AI Agent 打上标签：

- **136 个 Skills**：NLP、CV、Agent 编排、数据工程等
- **204 个 Domains**：技术、金融、医疗、教育等
- **智能分类**：支持 DeepSeek、OpenAI、OpenRouter、Anthropic
- **后台异步**：不阻塞主服务，批量处理

详细文档：[docs/oasf-classification.md](docs/oasf-classification.md)

## 🐳 Docker 部署

```bash
# 检查环境配置
./scripts/docker-check-env.sh

# 部署完整应用
./scripts/docker-deploy.sh

# 常用操作
./scripts/docker-logs.sh    # 查看日志
./scripts/docker-restart.sh # 重启服务
./scripts/docker-stop.sh    # 停止服务
```

详细指南：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📚 文档

- [部署指南](docs/DEPLOYMENT.md) - 完整的部署文档
- [OASF 分类](docs/oasf-classification.md) - 自动分类功能说明
- [后台分类](docs/background-classification-guide.md) - 异步批量分类
- [验证规则](docs/classification-validation-rules.md) - 分类验证标准
- [声誉同步](docs/reputation_sync_design.md) - 声誉系统设计

## 🔧 环境变量

### 后端 (backend/.env)

```env
# 必需配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# 可选配置
DATABASE_URL=sqlite:///./8004scan.db
DEBUG=true

# OASF 分类（可选）
LLM_PROVIDER=deepseek  # deepseek, openai, openrouter, anthropic
DEEPSEEK_API_KEY=sk-your-key-here
```

### 前端 (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 API 端点

### 统计数据
- `GET /api/stats` - 整体统计

### 代理相关
- `GET /api/agents` - 代理列表（分页、搜索、筛选）
- `GET /api/agents/featured` - 精选代理
- `GET /api/agents/{id}` - 代理详情
- `POST /api/agents/{id}/classify` - 手动分类单个代理
- `POST /api/agents/classify-all` - 批量分类

### 网络相关
- `GET /api/networks` - 网络列表
- `GET /api/networks/{id}` - 网络详情

### 活动记录
- `GET /api/activities` - 最近活动

## 🎯 代码质量标准

- Python/TypeScript 文件不超过 300 行
- 每个文件夹不超过 8 个文件
- 遵循优雅的架构设计原则
- 避免代码坏味道（僵化、冗余、循环依赖等）

## 📝 开发指南

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

### 数据库初始化

```bash
cd backend
uv run python -m src.db.init_data
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
