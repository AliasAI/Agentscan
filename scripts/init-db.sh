#!/bin/bash

# Initialize database tables and networks
# 初始化数据库表和网络数据

set -e

cd "$(dirname "$0")/.."

echo "🗄️ Initializing database..."

# Enter backend directory
cd backend

# Make sure we're using uv
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install uv first."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️ Warning: .env file not found"
fi

# Step 1: Create database tables using SQLAlchemy
echo "📋 Creating database tables..."
uv run python -c "
from src.db.database import Base, engine
from src.models import Network, Agent, BlockchainSync  # Import all models

print('Creating tables...')
Base.metadata.create_all(bind=engine)
print('✅ Tables created successfully!')
"

# Step 2: Initialize networks data
echo ""
echo "🌐 Initializing networks data..."
uv run python -m src.db.init_networks

echo ""
echo "✅ Database initialization completed!"
