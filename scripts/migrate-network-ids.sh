#!/bin/bash

# 迁移网络 ID 从 UUID 到 network_key
# 用法: ./scripts/migrate-network-ids.sh

set -e

cd "$(dirname "$0")/.."

echo "🔄 迁移网络 ID 从 UUID 到 network_key..."

cd backend
uv run python -m src.db.migrate_network_ids

echo ""
echo "✅ 迁移完成！"
