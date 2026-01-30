#!/bin/bash

# 后端开发服务器启动脚本

set -e

echo "启动后端开发服务器..."

cd "$(dirname "$0")/../backend"

# 加载环境变量
if [ -f ".env" ]; then
  echo "加载环境变量..."
  set -a
  source .env
  set +a
fi

# 确保虚拟环境存在
if [ ! -d ".venv" ]; then
  echo "虚拟环境不存在，正在创建..."
  uv sync
fi

# 注意：数据库表创建和迁移由 main.py 启动时自动处理
# 顺序：create_all() → migrate_*() → init_networks()
# 无需在此手动运行迁移脚本

# 启动开发服务器
echo "启动 FastAPI 服务器..."
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
