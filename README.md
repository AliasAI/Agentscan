# Agentscan - ERC-8004 AI Agent Explorer

A blockchain explorer-like web application for exploring and displaying AI agent information on the ERC-8004 protocol.

## ✨ Key Features

- 🔍 Browse and search AI agents
- 📊 Display network statistics and agent activity
- 🏷️ OASF automatic classification (Skills & Domains)
- 🌓 Dark / Light theme toggle
- 🔄 Automatic on-chain data synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- uv (Python package manager)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Start Development Environment

```bash
# Start both frontend and backend
./scripts/dev-all.sh

# Or start separately
./scripts/dev-backend.sh  # Backend (port 8000)
./scripts/dev-frontend.sh # Frontend (port 3000)
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
agentscan/
├── frontend/              # Next.js 16 + React 19 + Tailwind CSS v4
│   ├── app/              # Page routes
│   ├── components/       # React components
│   ├── lib/              # API client
│   └── types/            # TypeScript types
│
├── backend/              # FastAPI + SQLAlchemy + Web3.py
│   ├── src/
│   │   ├── api/         # API routes
│   │   ├── models/      # Database models
│   │   ├── services/    # Business logic
│   │   ├── taxonomies/  # OASF taxonomy data
│   │   └── core/        # Core configuration
│   └── logs/            # Log output
│
├── scripts/             # Run scripts
├── docs/                # Official documentation
└── discuss/             # Discussion and history
```

## 🛠️ Tech Stack

### Frontend
- Next.js 16.0.1 (App Router)
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS v4

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- Web3.py (Sepolia network)
- uv (package manager)

### Database
- SQLite (development)
- PostgreSQL (recommended for production)

## 📖 Core Features

### 🔄 Blockchain Sync

- Automatically syncs ERC-8004 contract data from Sepolia network
- Batch block processing (10,000 blocks/batch)
- Incremental sync to avoid reprocessing
- Scheduled task: sync every 5 minutes

### 🏷️ OASF Auto-Classification

Automatically labels AI Agents based on the [OASF v0.8.0](https://github.com/agntcy/oasf) specification:

- **136 Skills**: NLP, CV, Agent orchestration, Data engineering, etc.
- **204 Domains**: Technology, Finance, Healthcare, Education, etc.
- **Smart classification**: Supports DeepSeek, OpenAI, OpenRouter, Anthropic
- **Background async**: Non-blocking batch processing

Detailed documentation: [docs/oasf-classification.md](docs/oasf-classification.md)

## 🐳 Docker Deployment

```bash
# Check environment configuration
./scripts/docker-check-env.sh

# Deploy the full application
./scripts/docker-deploy.sh

# Common operations
./scripts/docker-logs.sh    # View logs
./scripts/docker-restart.sh # Restart services
./scripts/docker-stop.sh    # Stop services
```

Detailed guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Complete deployment documentation
- [OASF Classification](docs/oasf-classification.md) - Auto-classification feature
- [Background Classification](docs/background-classification-guide.md) - Async batch classification
- [Validation Rules](docs/classification-validation-rules.md) - Classification validation standards
- [Reputation Sync](docs/reputation_sync_design.md) - Reputation system design

## 🔧 Environment Variables

### Backend (backend/.env)

```env
# Required
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Optional
DATABASE_URL=sqlite:///./8004scan.db
DEBUG=true

# OASF Classification (optional)
LLM_PROVIDER=deepseek  # deepseek, openai, openrouter, anthropic
DEEPSEEK_API_KEY=sk-your-key-here
```

### Frontend (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 API Endpoints

### Statistics
- `GET /api/stats` - Overall statistics

### Agents
- `GET /api/agents` - Agent list (pagination, search, filtering)
- `GET /api/agents/featured` - Featured agents
- `GET /api/agents/{id}` - Agent details
- `POST /api/agents/{id}/classify` - Manually classify a single agent
- `POST /api/agents/classify-all` - Batch classification

### Networks
- `GET /api/networks` - Network list
- `GET /api/networks/{id}` - Network details

### Activities
- `GET /api/activities` - Recent activities

## 🎯 Code Quality Standards

- Python/TypeScript files must not exceed 300 lines
- No more than 8 files per directory
- Follow elegant architecture design principles
- Avoid code smells (rigidity, redundancy, circular dependencies, etc.)

## 📝 Development Guide

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload
```

### Database Initialization

```bash
cd backend
uv run python -m src.db.init_data
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
