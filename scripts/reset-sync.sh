#!/bin/bash

# Reset blockchain sync status script
# 重置区块链同步状态脚本

set -e

cd "$(dirname "$0")/../backend"

if [ -z "$1" ]; then
    echo "❌ 请指定网络 ID"
    echo ""
    echo "用法: $0 <network_key>"
    echo ""
    echo "示例:"
    echo "  $0 base-sepolia   # 重置 Base Sepolia 同步状态"
    echo "  $0 sepolia        # 重置 Sepolia 同步状态"
    echo ""
    exit 1
fi

NETWORK_KEY="$1"

echo "🔄 重置 $NETWORK_KEY 网络的同步状态..."
echo ""

uv run python -m src.db.reset_sync_status "$NETWORK_KEY"
