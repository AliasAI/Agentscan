# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

8004scan 是一个 ERC-8004 AI 代理浏览器，类似于区块链浏览器，用于展示和追踪基于 ERC-8004 协议的 AI 代理信息。项目包含前端（Next.js）和后端（FastAPI），后端通过 Web3.py 从 Sepolia 网络同步链上数据。

## Core Commands

### 开发环境启动

```bash
# 后端开发服务器（端口 8000）
./scripts/dev-backend.sh

# 前端开发服务器（端口 3000）
./scripts/dev-frontend.sh

# 同时启动前后端
./scripts/dev-all.sh
```

### 数据库操作

```bash
# 运行数据库迁移
./scripts/migrate-db.sh

# 初始化网络数据
./scripts/init-networks.sh
```

### 后端直接命令

```bash
cd backend

# 安装依赖（使用 uv）
uv sync

# 运行数据库迁移
uv run python -m src.db.migrate_add_contracts

# 初始化测试数据
uv run python -m src.db.init_data

# 启动服务器
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端直接命令

```bash
cd frontend

# 安装依赖
npm install  # 或 pnpm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## Architecture

### 整体架构

```
用户浏览器
    ↓
Next.js Frontend (Port 3000)
    ↓ API 调用
FastAPI Backend (Port 8000)
    ↓ 读写
SQLite Database
    ↑ 定时同步
Web3.py ← Sepolia Network (ERC-8004 合约)
```

### 后端架构（backend/src/）

**核心设计原则：**
- 服务层（services/）处理业务逻辑和外部集成
- API 层（api/）负责路由和请求/响应处理
- 模型层（models/）定义数据库表结构
- 配置层（core/）集中管理配置

**关键组件：**

1. **区块链同步服务**（services/blockchain_sync.py）
   - 从 Sepolia 网络监听 ERC-8004 合约事件
   - 批量处理区块（BLOCKS_PER_BATCH = 10000）
   - 增量同步：记录 last_block 避免重复处理
   - 自动获取 IPFS 元数据（支持 HTTP 和 IPFS URI）
   - 错误重试机制（MAX_RETRIES = 2）

2. **定时任务调度器**（services/scheduler.py）
   - 使用 APScheduler 管理定时任务
   - blockchain_sync：每 5 分钟同步一次
   - reputation_sync：每 30 分钟同步一次
   - 启动时立即执行首次同步

3. **数据库迁移**
   - 使用自定义迁移脚本（src/db/migrate_*.py）
   - 迁移脚本需要加载 .env 文件（使用 load_dotenv()）
   - 在 main.py 启动时自动运行迁移

4. **环境变量加载**
   - 所有配置模块需要在顶部调用 load_dotenv()
   - 特别是 blockchain_config.py、reputation_config.py
   - 必须在 import os.getenv() 之前调用

### 前端架构（frontend/）

**技术栈版本要求：**
- Next.js 强制使用 v15.4+（不要用 v14）
- React 强制使用 v19+
- Tailwind CSS 强制使用 v4（不要用 v3）

**响应式设计策略：**
- 使用 Tailwind 断点：`md:` (768px+), `lg:` (1024px+)
- 移动端优先：默认样式为移动端，使用 md: 前缀适配桌面
- 关键组件需要双版本：
  - 同步状态显示：移动端在标题下方，桌面端绝对定位右上角
  - 使用 `hidden md:flex` 和 `flex md:hidden` 切换显示

**API 集成**（lib/api/services.ts）
- 所有 API 调用集中在此文件
- 使用 fetch 封装的 apiGet、apiPost 等工具函数
- 类型定义在 types/index.ts

### 数据流

```
ERC-8004 合约事件 (Registered, UriUpdated, Transfer)
    ↓ Web3.py 监听
BlockchainSyncService 处理
    ↓ 解析事件 + 获取元数据
Agent 模型保存到数据库
    ↓ FastAPI 查询
前端通过 API 获取
    ↓ 10 秒自动刷新
用户界面展示
```

## Critical Implementation Details

### 数据库模式演进

**Agent 模型字段：**
- 基础字段：id, name, address, description, network_id
- 链上字段：token_id (索引), owner_address (索引), metadata_uri, on_chain_data (JSON)
- 同步字段：sync_status (enum: pending/synced/failed), synced_at, created_at (索引)
- 业务字段：reputation_score, status (enum: active/inactive/suspended)

**BlockchainSync 模型：**
- 追踪同步进度：last_block, current_block, status
- 每个网络+合约组合一条记录
- status: idle/running/error

**Network 模型 - contracts 字段：**
- 类型：JSON
- 存储多个合约地址：`{identity: "0x...", reputation: "0x...", validation: "0x..."}`
- 在 migrate_add_contracts.py 中添加

### 启动流程和依赖顺序

**后端启动顺序（dev-backend.sh）：**
1. 运行数据库迁移（migrate_add_contracts.py）
2. 初始化数据库表（init_data.py）- 如果已有数据则跳过
3. 启动 uvicorn 服务器

**应用启动顺序（main.py）：**
1. Base.metadata.create_all() - 创建表
2. migrate() - 运行迁移
3. init_networks() - 初始化网络数据
4. startup_event: start_scheduler() - 启动定时任务

### 区块链配置（backend/src/core/blockchain_config.py）

**必须配置的环境变量：**
- SEPOLIA_RPC_URL：必填，否则启动失败
- 从 .env 文件加载（需要 load_dotenv()）

**同步配置参数：**
- START_BLOCK = 9419801（合约部署区块）
- BLOCKS_PER_BATCH = 10000（批量大小）
- SYNC_INTERVAL_MINUTES = 5（同步间隔）
- MAX_RETRIES = 2
- RETRY_DELAY_SECONDS = 3

**合约地址：**
- Identity Registry: 0x8004a6090Cd10A7288092483047B097295Fb8847
- Reputation Registry: 0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E

### API 设计模式

**分页和筛选：**
```python
# agents.py
GET /api/agents?tab={all|active|new|top}&page=1&page_size=20&search=query
```

**Tab 筛选逻辑：**
- all: 所有代理
- active: created_at 在最近 7 天内
- new: created_at 在最近 24 小时内
- top: 按 reputation_score 降序排序

**统计数据缓存：**
- /api/stats 包含 blockchain_sync 字段
- 前端每 10 秒刷新（useEffect interval）

## Common Patterns

### 添加新的 API 端点

1. 在 `backend/src/api/` 创建或修改路由文件
2. 使用 APIRouter 定义路由
3. 在 `main.py` 中 include_router
4. 数据模型在 `models/`，响应模式在 `schemas/`（如果需要）

### 添加新的前端页面

1. 在 `frontend/app/` 创建目录和 `page.tsx`
2. 使用 "use client" 指令（如果需要客户端状态）
3. 在 `lib/api/services.ts` 添加 API 调用函数
4. 类型定义在 `types/index.ts`

### 添加新的数据库迁移

1. 在 `backend/src/db/` 创建 `migrate_*.py`
2. 使用 sqlite3 直接操作（ALTER TABLE 等）
3. 实现 migrate() 函数
4. 在 `main.py` 中调用

### 响应式组件实现

```tsx
{/* 桌面版 */}
<div className="hidden md:flex ...">...</div>

{/* 移动版 */}
<div className="flex md:hidden ...">...</div>
```

## Development Workflow

### 添加新功能的标准流程

1. 后端：定义数据模型（models/）
2. 后端：实现业务逻辑（services/ 或直接在 API）
3. 后端：创建 API 端点（api/）
4. 前端：定义 TypeScript 类型（types/）
5. 前端：添加 API 调用（lib/api/services.ts）
6. 前端：实现 UI 组件（components/）
7. 前端：创建或更新页面（app/）

### 数据库模型修改流程

1. 修改 models/*.py 中的模型定义
2. 创建迁移脚本 migrate_*.py
3. 在 dev-backend.sh 或 main.py 中调用迁移
4. 测试迁移的幂等性（多次运行不出错）

### 环境变量修改流程

1. 更新 backend/.env.example
2. 更新 backend/.env
3. 在相关 config.py 中添加 load_dotenv()
4. 更新 README.md 中的环境变量文档

## Known Issues and Solutions

### 数据库迁移失败

**问题：** 迁移脚本无法找到 .env 文件中的 DATABASE_URL
**解决：** 在迁移脚本顶部添加：
```python
from dotenv import load_dotenv
load_dotenv()
```

### 后端启动时 SEPOLIA_RPC_URL 未定义

**问题：** blockchain_config.py 在 .env 加载之前被 import
**解决：** 在 blockchain_config.py 顶部添加 load_dotenv()

### 移动端同步状态重叠

**问题：** 绝对定位的同步状态与标题重叠
**解决：** 创建两个版本，移动端使用正常文档流，桌面端使用绝对定位

### Docker 镜像拉取失败

**问题：** Docker Hub 连接问题（中国大陆常见）
**解决：** 使用本地开发环境（./scripts/dev-backend.sh）而不是 Docker

## File Organization Rules

- Python 文件不超过 300 行
- TypeScript/JavaScript 文件不超过 300 行
- 每层文件夹中的文件不超过 8 个
- 文档放在 docs/（正式文档）或 discuss/（方案讨论）

## API Documentation

后端 API 文档自动生成，启动服务后访问：
- http://localhost:8000/docs（Swagger UI）
- http://localhost:8000/redoc（ReDoc）

## External Dependencies

### 区块链相关
- Web3.py：与 Ethereum 网络交互
- Sepolia 测试网：ERC-8004 合约部署网络
- IPFS：元数据存储（通过公共网关访问）

### 后端关键依赖
- FastAPI：Web 框架
- SQLAlchemy 2.x：ORM
- APScheduler：定时任务
- structlog：结构化日志
- uv：包管理器（替代 pip/poetry）

### 前端关键依赖
- Next.js 16.0.1（App Router，不是 Pages Router）
- React 19.2.0
- Tailwind CSS v4
- TypeScript 5.x
