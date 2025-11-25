#!/bin/bash

# Multi-network database migration script
# 多网络数据库迁移脚本（添加 token_id + network_id 联合唯一索引）

set -e

cd "$(dirname "$0")/../backend"

echo "🔧 运行多网络数据库迁移..."
echo "📋 此迁移将添加 (token_id, network_id) 联合唯一索引"
echo ""

uv run python -m src.db.migrate_multi_network

echo ""
echo "✅ 迁移完成"
