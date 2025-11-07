#!/bin/bash

# Docker 重启脚本
# 用于重启 Docker Compose 服务

set -e

echo "🔄 重启 Agentscan 服务..."

# 进入项目根目录
cd "$(dirname "$0")/.."

# 重启服务
docker compose restart

echo ""
echo "✅ 服务已重启"
echo ""
echo "📊 服务状态："
docker compose ps
