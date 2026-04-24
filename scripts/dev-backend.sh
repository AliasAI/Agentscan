#!/bin/bash

# 后端开发服务器启动脚本

set -e

# 优先使用独立安装的 uv（避免 pyenv-win shim 干扰）
export PATH="/c/Users/wjj31/.local/bin:$PATH"
export PYTHONIOENCODING=utf-8
export PYTHONUTF8=1

echo "启动后端开发服务器..."

cd "$(dirname "$0")/../backend"

# 加载环境变量 (python-dotenv 会在应用内部解析 .env，此处无需 source)
if [ -f ".env" ]; then
  echo "找到 .env，交由应用层 python-dotenv 加载"
fi

# 确保虚拟环境存在
if [ ! -d ".venv" ]; then
  echo "虚拟环境不存在，正在创建..."
  uv sync
fi

# 注意：数据库表创建和迁移由 main.py 启动时自动处理
# 顺序：create_all() → migrate_*() → init_networks()
# 无需在此手动运行迁移脚本

# 确保日志目录存在
mkdir -p ../logs

# 启动开发服务器
echo "启动 FastAPI 服务器... 日志将输出到 logs/backend.log"
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee ../logs/backend.log
