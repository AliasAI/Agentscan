#!/bin/bash

# Docker 环境下迁移网络 ID 从 UUID 到 network_key
# 用法: ./scripts/docker-migrate-network-ids.sh

set -e

echo "🔄 迁移网络 ID 从 UUID 到 network_key（Docker 环境）..."

docker compose exec backend uv run python -m src.db.migrate_network_ids

echo ""
echo "✅ 迁移完成！现在可以使用 docker-reset-sync.sh 了"
