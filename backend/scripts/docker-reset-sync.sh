#!/bin/bash

# Docker 环境下重置网络同步状态
# 用法: ./scripts/docker-reset-sync.sh [network_key]

set -e

NETWORK_KEY=${1:-base-sepolia}

echo "🔄 重置 ${NETWORK_KEY} 网络的同步状态（Docker 环境）..."

# 进入后端容器执行重置脚本
docker compose exec backend uv run python -m src.db.reset_sync_status "$NETWORK_KEY"

echo ""
echo "✅ 同步状态已重置！"
echo "💡 提示：后端定时任务会在下一个同步周期（每10分钟）自动开始同步"
