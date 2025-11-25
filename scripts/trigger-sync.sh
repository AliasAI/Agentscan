#!/bin/bash

# Manually trigger blockchain sync for a specific network
# 手动触发特定网络的区块链同步

set -e

if [ -z "$1" ]; then
    echo "❌ 请指定网络 ID"
    echo ""
    echo "用法: $0 <network_key> [api_url]"
    echo ""
    echo "示例:"
    echo "  $0 base-sepolia                          # 本地触发（http://localhost:8000）"
    echo "  $0 base-sepolia http://your-server:8000  # 远程触发"
    echo "  $0 sepolia                               # 触发 Sepolia 同步"
    echo ""
    exit 1
fi

NETWORK_KEY="$1"
API_URL="${2:-http://localhost:8000}"

echo "🚀 触发 $NETWORK_KEY 网络同步..."
echo "   API: $API_URL"
echo ""

# Trigger sync via API
response=$(curl -s -X POST "$API_URL/api/sync/networks/$NETWORK_KEY" -w "\n%{http_code}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ 同步已触发"
    echo ""
    echo "📊 响应:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    echo "💡 查看同步进度:"
    echo "   curl $API_URL/api/stats | python3 -m json.tool"
else
    echo "❌ 触发失败 (HTTP $http_code)"
    echo "$body"
    exit 1
fi
