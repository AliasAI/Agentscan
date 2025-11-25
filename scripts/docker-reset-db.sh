#!/bin/bash

# Docker environment database reset script
# 完整重置数据库：备份、删除、重建、重新同步

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔄 Docker Database Reset Tool"
echo "=========================================="
echo ""

# Check if container is running
if ! docker compose ps | grep -q "backend.*Up"; then
    echo -e "${RED}❌ Backend container is not running${NC}"
    echo "Please start the containers first with: docker compose up -d"
    exit 1
fi

# Parse arguments
BACKUP=false
RESYNC=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP=true
            shift
            ;;
        --resync)
            RESYNC=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--backup] [--resync]"
            exit 1
            ;;
    esac
done

# Show warning
echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA in the database!${NC}"
[ "$BACKUP" = true ] && echo -e "${GREEN}✓ Backup will be created${NC}"
[ "$RESYNC" = true ] && echo -e "${GREEN}✓ Blockchain sync will be reset${NC}"
echo ""

read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Reset cancelled${NC}"
    exit 0
fi

echo ""
echo "🔧 Executing database reset..."
echo ""

# Build command
CMD="uv run python -m src.db.reset_database"
[ "$BACKUP" = true ] && CMD="$CMD --backup"
[ "$RESYNC" = true ] && CMD="$CMD --resync"

# Execute reset in container
docker compose exec backend sh -c "$CMD"

# Restart backend to apply changes
echo ""
echo "🔄 Restarting backend container..."
docker compose restart backend

echo ""
echo -e "${GREEN}✅ Database reset completed${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Check logs: ./scripts/docker-logs.sh backend"
echo "   2. Monitor sync progress: docker compose exec backend uv run python -c \"from src.db.database import SessionLocal; from src.models import BlockchainSync; db = SessionLocal(); syncs = db.query(BlockchainSync).all(); [print(f'{s.network_name}: {s.current_block}/{s.latest_block}') for s in syncs]\""
echo ""
