#!/bin/bash

# Local development database reset script
# 完整重置数据库：备份、删除、重建、重新同步

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔄 Local Database Reset Tool"
echo "=========================================="
echo ""

# Check if we're in backend directory
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

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

# Execute reset
$CMD

echo ""
echo -e "${GREEN}✅ Database reset completed${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Restart backend: ./scripts/dev-backend.sh"
echo "   2. Blockchain sync will start automatically"
echo ""
