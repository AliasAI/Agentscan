#!/bin/bash

# 后端开发服务器启动脚本

set -e

echo "启动后端开发服务器..."

cd "$(dirname "$0")/../backend"

# 确保虚拟环境存在
if [ ! -d ".venv" ]; then
  echo "虚拟环境不存在，正在创建..."
  uv sync
fi

# 初始化数据库（如果需要）
echo "初始化数据库..."
uv run python -m src.db.init_data

# 启动开发服务器
echo "启动 FastAPI 服务器..."
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
