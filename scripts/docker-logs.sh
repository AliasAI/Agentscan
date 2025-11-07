#!/bin/bash

# Docker 日志查看脚本
# 用于查看 Docker Compose 服务日志

# 进入项目根目录
cd "$(dirname "$0")/.."

# 如果有参数，查看指定服务的日志；否则查看所有服务
if [ $# -eq 0 ]; then
    echo "📝 查看所有服务日志（Ctrl+C 退出）..."
    docker compose logs -f
else
    echo "📝 查看 $1 服务日志（Ctrl+C 退出）..."
    docker compose logs -f "$1"
fi
