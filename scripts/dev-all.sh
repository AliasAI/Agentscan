#!/bin/bash

# 同时启动前后端开发服务器

set -e

SCRIPT_DIR="$(dirname "$0")"

echo "同时启动前端和后端开发服务器..."

# 启动后端（后台运行）
echo "启动后端..."
"$SCRIPT_DIR/dev-backend.sh" &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
echo "启动前端..."
"$SCRIPT_DIR/dev-frontend.sh" &
FRONTEND_PID=$!

# 等待任一进程退出
wait $BACKEND_PID $FRONTEND_PID

echo "开发服务器已停止"
