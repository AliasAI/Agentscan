#!/bin/bash

# 查看 Docker 容器日志
# 用法: ./scripts/docker-logs.sh [backend|frontend|all]

set -e

SERVICE=${1:-all}

if [ "$SERVICE" = "all" ]; then
    echo "📝 查看所有容器日志..."
    docker compose logs -f
else
    echo "📝 查看 ${SERVICE} 容器日志..."
    docker compose logs -f "$SERVICE"
fi
