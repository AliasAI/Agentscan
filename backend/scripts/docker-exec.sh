#!/bin/bash

# 进入 Docker 容器执行命令
# 用法: ./scripts/docker-exec.sh [backend|frontend] [command]

set -e

CONTAINER=${1:-backend}
shift

if [ $# -eq 0 ]; then
    # 没有命令，进入交互式 shell
    echo "🐚 进入 ${CONTAINER} 容器..."
    docker compose exec "$CONTAINER" /bin/bash
else
    # 执行指定命令
    echo "⚡ 在 ${CONTAINER} 容器中执行命令..."
    docker compose exec "$CONTAINER" "$@"
fi
