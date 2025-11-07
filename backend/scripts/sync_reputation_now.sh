#!/bin/bash

# Reputation 同步脚本
# 立即执行一次 reputation 同步

set -e

echo "🚀 启动 Reputation 同步..."

# 进入后端目录
cd "$(dirname "$0")/.."

# 执行同步
uv run python scripts/sync_reputation_now.py
