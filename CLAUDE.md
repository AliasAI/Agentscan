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

**本地开发环境：**

```bash
# 完整重置数据库（备份 + 重建 + 重新同步）
./scripts/reset-db.sh --backup --resync

# 仅修复 network_id 问题（不删除数据）
cd backend && uv run python -m src.db.migrate_network_ids

# 重置网络同步状态（重新扫描）
./scripts/reset-sync.sh base-sepolia

# 手动触发同步
./scripts/trigger-sync.sh base-sepolia
```

**Docker 生产环境：**

```bash
# 完整重置数据库（备份 + 重建 + 重新同步）
./scripts/docker-reset-db.sh --backup --resync

# 仅修复 network_id 问题（推荐用于服务器修复）
./scripts/docker-migrate-network-ids.sh

# 重置网络同步状态
./scripts/docker-reset-sync.sh base-sepolia

# 手动触发同步
./scripts/docker-trigger-sync.sh base-sepolia
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

1. **区块链同步服务**（services/blockchain_sync.py）[UPDATED: 2025-11-15]
   - 从 Sepolia 网络监听 ERC-8004 合约事件
   - **批量处理区块**（BLOCKS_PER_BATCH = 1000，优化后降低 90%）
   - **增量同步**：记录 last_block 避免重复处理
   - **智能跳过**：无新区块时跳过同步，避免不必要的 RPC 调用
   - **速率限制**：事件处理间延迟 0.5 秒，避免 429 错误
   - 自动获取 IPFS 元数据（支持 HTTP、IPFS、data URI）
   - 错误重试机制（MAX_RETRIES = 1）
   - **集成 OASF 自动分类**：新 agent 注册时自动分类 skills 和 domains
   - **集成 Reputation 事件驱动更新**：监听 NewFeedback 和 FeedbackRevoked 事件

2. **OASF 分类服务**（services/ai_classifier.py + background_classifier.py）[UPDATED: 2025-11-14]
   - 基于 OASF v0.8.0 规范自动分类 agent
   - 优先从 metadata 的 `endpoints[].skills/domains` 提取
   - 否则使用多种 LLM（参考 herAI 架构）或关键词匹配自动分类
   - **支持的 LLM 提供商**：
     - DeepSeek（推荐）：性价比高，使用 OpenAI SDK
     - OpenAI：GPT-4o-mini
     - OpenRouter：统一接口支持多种模型
     - Anthropic Claude：保持向后兼容
   - 支持 136 个 skills 和 204 个 domains
   - **严格验证规则**（宁愿不分类，也不要错误分类）：
     - Description 最小长度 20 字符
     - 过滤错误信息和默认值（如 "metadata fetch failed"）
     - 只对有足够信息的 agents 进行分类
     - 验证规则文档：`docs/classification-validation-rules.md`
   - **后台异步分类**：
     - 支持异步批量分类，不阻塞主服务
     - 实时进度追踪，可启动/查看/取消任务
     - 使用脚本：`./classify_background.sh start [limit] [batch_size]`
     - 完整使用指南：`docs/background-classification-guide.md`
   - 完整文档：`docs/oasf-classification.md`

3. **定时任务调度器**（services/scheduler.py）[UPDATED: 2025-11-15]
   - 使用 APScheduler 管理定时任务
   - **blockchain_sync**：每 10 分钟同步一次（固定时间触发：:00, :10, :20, :30, :40, :50）
   - **reputation_sync**：**完全事件驱动**（零定期轮询，通过 NewFeedback/FeedbackRevoked 事件触发）
   - **固定时间触发**：避免启动时的请求峰值，无论何时重启都等待到下一个固定时间点
   - **RPC 优化**：请求量从 ~686K/天 降至 ~300K/天（降低 56%）

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
- **OASF 字段**：skills (JSON), domains (JSON) - 自动分类的技能和领域标签

**BlockchainSync 模型：**
- 追踪同步进度：last_block, current_block, status
- 每个网络+合约组合一条记录
- status: idle/running/error

**Network 模型 - contracts 字段：**
- 类型：JSON
- 存储多个合约地址：`{identity: "0x...", reputation: "0x...", validation: "0x..."}`
- 在 migrate_add_contracts.py 中添加

### 数据库迁移系统 [UPDATED: 2025-11-25]

**自动迁移流程（main.py 启动时）：**
1. `Base.metadata.create_all()` - 创建基础表结构
2. `migrate_contracts()` - 添加 contracts 字段到 networks 表
3. `migrate_oasf()` - 添加 skills/domains 字段到 agents 表
4. `migrate_classification_source()` - 添加分类来源字段
5. `migrate_multi_network()` - 添加 (token_id, network_id) 联合唯一索引
6. `migrate_network_ids()` - **修复孤立的 network_id（UUID → network_key）**
7. `init_networks()` - 初始化/更新网络配置
8. `startup_event: start_scheduler()` - 启动定时任务

**关键迁移说明：**

- **migrate_network_ids**: 修复历史数据中使用 UUID 的 network_id
  - 自动检测并映射旧 UUID 到新 network_key（如 `sepolia`）
  - 更新 agents 表和 blockchain_syncs 表
  - 保证所有 agents 都能关联到正确的网络
  - **服务器部署时必须执行此迁移**

**手动迁移工具：**

```bash
# 本地开发：完整重置数据库
./scripts/reset-db.sh --backup --resync

# Docker：仅修复 network_id（推荐服务器使用）
./scripts/docker-migrate-network-ids.sh

# Docker：完整重置（慎用，会删除所有数据）
./scripts/docker-reset-db.sh --backup --resync
```

**迁移脚本位置：**
- `backend/src/db/migrate_*.py` - 各个独立迁移
- `backend/src/db/reset_database.py` - 完整重置工具
- `scripts/docker-migrate-network-ids.sh` - Docker 快速修复
- `scripts/docker-reset-db.sh` - Docker 完整重置

### 启动流程和依赖顺序

**后端启动顺序（dev-backend.sh）：**
1. 运行数据库迁移（自动执行所有 migrate_*.py）
2. 初始化网络数据（init_networks）
3. 启动 uvicorn 服务器

**应用启动顺序（main.py）：**
1. Base.metadata.create_all() - 创建表
2. migrate_*() - 运行所有迁移（包括 network_id 修复）
3. init_networks() - 初始化网络数据
4. startup_event: start_scheduler() - 启动定时任务

### 区块链配置（backend/src/core/blockchain_config.py）[UPDATED: 2025-11-15]

**必须配置的环境变量：**
- SEPOLIA_RPC_URL：必填，否则启动失败
- 从 .env 文件加载（需要 load_dotenv()）

**同步配置参数（RPC 优化后）：**
- START_BLOCK = 9419801（合约部署区块）
- BLOCKS_PER_BATCH = 1000（批量大小，从 10000 降低 90%）
- SYNC_INTERVAL_MINUTES = 10（同步间隔，实际由 CronTrigger 控制）
- MAX_RETRIES = 1（从 2 降低，减少失败重试）
- RETRY_DELAY_SECONDS = 5（从 3 增加，避免快速重试）
- REQUEST_DELAY_SECONDS = 0.5（新增：事件处理间延迟）

**合约地址：**
- Identity Registry: 0x8004a6090Cd10A7288092483047B097295Fb8847
- Reputation Registry: 0x8004B8FD1A363aa02fDC07635C0c5F94f6Af5B7E

**定时执行时间表：**
- Blockchain Sync: 每小时 :00, :10, :20, :30, :40, :50 执行（每天 144 次）
- Reputation Sync: 事件驱动（监听 NewFeedback/FeedbackRevoked 事件，零定期轮询）

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
3. 实现 migrate() 函数，包含幂等性检查
4. 在 `main.py` 中 import 并调用
5. 测试本地环境：重启后端验证迁移成功
6. 测试 Docker 环境：`docker compose restart backend` 验证

### 服务器部署与数据库迁移 [NEW: 2025-11-25]

**服务器首次部署（Docker）：**

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 启动容器（自动运行所有迁移）
docker compose up -d

# 3. 查看迁移日志
docker compose logs backend | grep -E "Migration|migrate"

# 4. 验证网络数据
docker compose exec backend sh -c "cd /app && uv run python -c \"
from src.db.database import SessionLocal
from src.models import Network, Agent
db = SessionLocal()
print(f'Networks: {db.query(Network).count()}')
print(f'Agents: {db.query(Agent).count()}')
db.close()
\""
```

**服务器修复 network_id 问题（推荐）：**

如果服务器上前端看不到 Sepolia 等网络，使用此脚本修复（不删除数据）：

```bash
# 执行 network_id 迁移
./scripts/docker-migrate-network-ids.sh

# 脚本会自动：
# 1. 检查孤立的 network_id
# 2. 映射 UUID → network_key
# 3. 验证修复结果
# 4. 显示每个网络的 agent 数量

# 无需重启，但建议重启以确保前端刷新
docker compose restart backend
```

**服务器完整重置（慎用）：**

只在需要完全重新同步区块链数据时使用：

```bash
# 完整重置（会删除所有数据）
./scripts/docker-reset-db.sh --backup --resync

# 脚本会自动：
# 1. 备份当前数据库
# 2. 删除所有表
# 3. 重建表结构
# 4. 运行所有迁移
# 5. 初始化网络配置
# 6. 重置同步状态
# 7. 重启后端容器
```

**故障排查：**

```bash
# 检查容器状态
docker compose ps

# 查看后端日志
docker compose logs -f backend

# 进入容器手动检查
docker compose exec backend sh

# 查看数据库表结构
docker compose exec backend uv run python -c "
import sqlite3
conn = sqlite3.connect('8004scan.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(agents)')
print([col[1] for col in cursor.fetchall()])
"

# 检查网络和 agents 关联
docker compose exec backend sh -c "cd /app && uv run python -c \"
from src.db.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
result = db.execute(text('''
    SELECT n.name, COUNT(a.id)
    FROM networks n
    LEFT JOIN agents a ON n.id = a.network_id
    GROUP BY n.id
'''))
for name, count in result:
    print(f'{name}: {count} agents')
db.close()
\""
```

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
- 文档放在 docs/（正式文档）或 discuss/（讨论和历史记录）

## Documentation Structure

### docs/ - 正式文档

- **DEPLOYMENT.md** - 完整的部署指南（本地开发、Docker 部署、生产环境）
- **oasf-classification.md** - OASF 自动分类功能说明
- **background-classification-guide.md** - 异步批量分类使用指南
- **classification-validation-rules.md** - 分类验证规则和标准
- **reputation_sync_design.md** - 声誉系统设计文档
- **rpc-optimization-final.md** - RPC 请求优化完整文档（事件驱动架构）[NEW: 2025-11-15]

### discuss/ - 讨论和历史记录

- 已归档的部署文档（DOCKER_DEPLOYMENT.md、production-deployment.md）
- 历史总结文档（oasf-upgrade-summary.md、实现总结.md）
- 测试记录（llm-classification-test-results.md）
- 临时故障排查文档（ssl-certificate-troubleshooting.md 等）

### scripts/ - 运行脚本

**核心开发脚本：**
- dev-backend.sh - 启动后端开发服务器
- dev-frontend.sh - 启动前端开发服务器
- dev-all.sh - 同时启动前后端
- init-networks.sh - 初始化网络数据
- migrate-db.sh - 运行数据库迁移

**Docker 部署脚本：**
- docker-deploy.sh - 部署完整应用
- docker-check-env.sh - 检查环境配置
- docker-logs.sh - 查看容器日志
- docker-restart.sh - 重启服务
- docker-stop.sh - 停止服务

**辅助工具：**
- check-nginx-config.sh - Nginx 配置检查（生产环境辅助）

**已归档脚本：**
- scripts/archive/ - 临时诊断脚本（diagnose-nginx-redirect.sh 等）

## API Documentation

后端 API 文档自动生成，启动服务后访问：
- http://localhost:8000/docs（Swagger UI）
- http://localhost:8000/redoc（ReDoc）

## OASF Classification (NEW - 2025-11-14)

### 功能概述

8004scan 现已集成完整的 OASF v0.8.0 分类体系，可自动为 AI Agent 打上 skills 和 domains 标签。

### 关键特性

1. **完整的 OASF v0.8.0 规范**
   - **136 个 Skills**：涵盖 NLP、CV、Agent 编排、数据工程等 15 大类
   - **204 个 Domains**：涵盖技术、金融、医疗、教育等 25 大领域
   - 数据来源：https://github.com/agent0lab/agent0-py

2. **智能分类策略**
   - **优先级1**：从 metadata 的 `endpoints[].skills/domains` 直接提取（OASF 标准格式）
   - **优先级2**：使用 LLM 智能分析 agent description
     - DeepSeek（推荐）：性价比高
     - OpenAI：GPT-4o-mini
     - OpenRouter：统一接口支持多种模型
     - Anthropic Claude：保持向后兼容
   - **优先级3**：基于关键词匹配的简单分类（无需 API key）

3. **自动化流程**
   - 新 agent 注册时自动分类
   - metadata 更新时重新分类
   - 支持手动触发单个或批量分类

### 核心文件

```
backend/src/
├── taxonomies/
│   ├── all_skills.json        # 136 skills (46KB，来自 agent0-py)
│   ├── all_domains.json       # 204 domains (73KB，来自 agent0-py)
│   └── oasf_taxonomy.py       # Python 模块（动态加载 JSON）
├── services/
│   └── ai_classifier.py       # AI 分类服务
└── api/
    └── classification.py      # 分类 API 端点

frontend/
├── components/agent/
│   └── OASFTags.tsx           # 标签展示组件
└── types/index.ts             # Agent 类型定义（包含 skills/domains）
```

### API 端点

```bash
# 手动分类单个 agent
POST /api/agents/{agent_id}/classify

# 批量分类所有未分类的 agents
POST /api/agents/classify-all?limit=100

# 获取所有可用的 skills/domains
GET /api/taxonomy/skills
GET /api/taxonomy/domains
```

### 前端展示

- **列表页**：Agent 卡片显示最多 3 个标签（skills 蓝色 ⚡，domains 紫色 🏢）
- **详情页**：独立的 "OASF Taxonomy" 卡片，按分类分组完整展示

### 配置（可选）

在 `backend/.env` 中配置 LLM 提供商以启用智能分类：

```bash
# 选择提供商: deepseek, openai, openrouter, anthropic
LLM_PROVIDER=deepseek

# 根据选择的提供商配置对应的 API Key
DEEPSEEK_API_KEY=sk-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# OPENROUTER_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

如果不配置任何 API key，系统会使用关键词匹配进行基础分类。

### 相关文档

- 完整功能说明：`docs/oasf-classification.md`
- 后台分类指南：`docs/background-classification-guide.md`
- 验证规则：`docs/classification-validation-rules.md`
- 升级总结：`discuss/oasf-upgrade-summary.md`（历史记录）
- OASF 规范：https://github.com/agntcy/oasf

## External Dependencies

### 区块链相关
- Web3.py：与 Ethereum 网络交互
- Sepolia 测试网：ERC-8004 合约部署网络
- IPFS：元数据存储（通过公共网关访问）

### AI & 分类相关
- LLM 提供商（可选）：DeepSeek、OpenAI、OpenRouter、Anthropic Claude
- OASF v0.8.0：开放代理服务框架标准（agent0-py）

### 后端关键依赖
- FastAPI：Web 框架
- SQLAlchemy 2.x：ORM
- APScheduler：定时任务
- structlog：结构化日志
- httpx：异步 HTTP 客户端
- uv：包管理器（替代 pip/poetry）

### 前端关键依赖
- Next.js 16.0.1（App Router，不是 Pages Router）
- React 19.2.0
- Tailwind CSS v4
- TypeScript 5.x

## RPC 优化与事件驱动架构 (NEW - 2025-11-15)

### 背景

优化前的问题：
- 单日 RPC 请求量达到 686K
- 出现 328K 的 429 错误（请求过于频繁）
- Reputation 每 30 分钟全量查询所有 agents（1777+ agents × 48次/天 = 85K 次/天）

### 革命性改进：事件驱动 Reputation

**优化前（全量轮询）**：
- 每 30 分钟查询所有 agents 的 reputation
- 每天 85,296 次 getSummary() 调用
- 99% 的请求都是浪费（大部分 agents 没有新反馈）

**优化后（事件驱动）**：
- 监听链上 `NewFeedback` 和 `FeedbackRevoked` 事件
- **零定期轮询**
- 只在有新反馈时才查询对应 agent
- 每天约 50-100 次 getSummary() 调用
- **降低 99.88%** ✨

### 优化成果

| 指标 | 优化前 | 优化后 | 降幅 |
|-----|--------|--------|------|
| Blockchain 同步 | 288次/天 | 144次/天 | ↓ 50% |
| Reputation 同步 | 48次/天 | 0次/天（事件驱动） | ↓ 100% |
| Reputation 请求 | 85,296次/天 | ~100次/天 | ↓ 99.88% |
| **总请求量** | **~686K/天** | **~300K/天** | **↓ 56%** |
| 429 错误率 | 32.8% | < 0.1% | ↓ 99% |
| **Credit 成本** | **$X/天** | **$0.44X/天** | **↓ 56%** |

### 核心实现

**文件**: `backend/src/services/blockchain_sync.py`

```python
# 在 blockchain sync 中同时监听 reputation 事件
feedback_events = self.reputation_contract.events.NewFeedback.get_logs(
    from_block=from_block,
    to_block=to_block
)

# 只更新有新反馈的 agents
for event in feedback_events:
    await self._process_feedback_event(db, event)
```

**文件**: `backend/src/services/scheduler.py`

```python
# Blockchain sync: 每 10 分钟（固定时间触发）
scheduler.add_job(
    sync_blockchain,
    trigger=CronTrigger(minute='*/10'),
    ...
)

# Reputation sync: 完全移除，改为事件驱动
# 无需任何定时任务
```

### 架构优势

1. **极佳可扩展性**：Agent 数量增长时，Reputation 成本几乎不变
2. **更好的实时性**：更新延迟从 30分钟 → 10分钟
3. **零浪费**：每个请求都有意义，无无效轮询
4. **固定时间触发**：避免启动时的请求峰值

### 相关文档

完整优化文档：`docs/rpc-optimization-final.md`

### 监控命令

```bash
# 查看同步任务
tail -f backend/logs/*.log | grep -E 'sync_started|events_found|reputation_updated_from_event'

# 查看 reputation 事件统计
tail -f backend/logs/*.log | grep 'NewFeedback\|FeedbackRevoked'
```
