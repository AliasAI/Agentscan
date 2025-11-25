#!/bin/bash

# Docker 环境下手动触发同步
# 用法: ./scripts/docker-trigger-sync.sh [network_key]

set -e

NETWORK_KEY=${1:-base-sepolia}

echo "🚀 手动触发 ${NETWORK_KEY} 网络同步（Docker 环境）..."

# 进入后端容器执行触发脚本
docker compose exec backend uv run python -m src.db.trigger_sync "$NETWORK_KEY"

echo ""
echo "✅ 同步已触发！"
