#!/bin/bash

# Docker environment network_id migration script
# 修复 agents 表中使用旧 UUID 的 network_id（不删除任何数据）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔧 Network ID Migration (Docker)"
echo "=========================================="
echo ""

# Check if container is running
if ! docker compose ps | grep -q "backend.*Up"; then
    echo -e "${RED}❌ Backend container is not running${NC}"
    echo "Please start the containers first with: docker compose up -d"
    exit 1
fi

echo "This script will fix orphaned network_id references in the agents table."
echo "No data will be deleted, only network_id values will be updated."
echo ""

# Execute migration in container
echo "🔧 Running migration..."
docker compose exec backend sh -c "cd /app && uv run python -m src.db.migrate_network_ids"

echo ""
echo -e "${GREEN}✅ Migration completed${NC}"
echo ""
echo "📋 Verification:"
docker compose exec backend sh -c "cd /app && uv run python -c \"
from src.db.database import SessionLocal
from src.models import Agent, Network

db = SessionLocal()
try:
    # Count agents by network
    result = db.execute('''
        SELECT n.name, COUNT(a.id) as count
        FROM networks n
        LEFT JOIN agents a ON n.id = a.network_id
        GROUP BY n.id
        ORDER BY count DESC
    ''')

    print('Agents per network:')
    for name, count in result:
        print(f'  {name}: {count} agents')

    # Check for orphaned agents
    orphaned = db.execute('''
        SELECT COUNT(*)
        FROM agents a
        WHERE a.network_id NOT IN (SELECT id FROM networks)
    ''').scalar()

    if orphaned > 0:
        print(f'\n⚠️  Warning: {orphaned} orphaned agents found')
    else:
        print('\n✅ No orphaned agents')

finally:
    db.close()
\""

echo ""
echo "📋 Next steps:"
echo "   1. Restart backend if needed: docker compose restart backend"
echo "   2. Check frontend to verify all networks are visible"
echo ""
