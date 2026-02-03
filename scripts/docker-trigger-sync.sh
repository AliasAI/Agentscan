#!/bin/bash

# Docker 环境下手动触发同步
# 用法: ./scripts/docker-trigger-sync.sh [network_key]
# 示例: ./scripts/docker-trigger-sync.sh polygon

set -e

NETWORK_KEY=${1:-ethereum}

echo "🚀 手动触发 ${NETWORK_KEY} 网络同步（Docker 环境）..."

# 进入后端容器执行触发操作
docker compose exec backend uv run python -c "
import sys
import asyncio
from src.services.blockchain_sync import get_sync_service
from src.core.networks_config import get_network

network_key = '${NETWORK_KEY}'

# 检查网络配置
config = get_network(network_key)
if not config:
    print(f'❌ 网络配置未找到: {network_key}')
    print('可用网络: ethereum, polygon, bsc, sepolia')
    sys.exit(1)

if not config.get('enabled', True):
    print(f'❌ 网络已禁用: {network_key}')
    sys.exit(1)

rpc_url = config.get('rpc_url', '')
if not rpc_url:
    print(f'❌ 网络 RPC URL 未配置: {network_key}')
    print('请在 .env 文件中配置对应的 RPC URL')
    sys.exit(1)

print(f'📋 网络: {config[\"name\"]} (Chain ID: {config[\"chain_id\"]})')
print(f'🔗 RPC: {rpc_url[:50]}...')
print(f'🔄 开始同步...')

try:
    sync_service = get_sync_service(network_key)
    asyncio.run(sync_service.sync())
    print(f'✅ 同步完成！')
except Exception as e:
    print(f'❌ 同步失败: {e}')
    sys.exit(1)
"

echo ""
echo "✅ 同步任务已完成！"
