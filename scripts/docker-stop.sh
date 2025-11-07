#!/bin/bash

# Docker 停止脚本
# 用于停止 Docker Compose 服务

set -e

echo "🛑 停止 Agentscan 服务..."

# 进入项目根目录
cd "$(dirname "$0")/.."

# 停止服务
docker compose down

echo "✅ 服务已停止"
