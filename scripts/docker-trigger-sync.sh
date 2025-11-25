#!/bin/bash

# Docker 环境下手动触发同步
# 用法: ./scripts/docker-trigger-sync.sh [network_key]

set -e

NETWORK_KEY=${1:-base-sepolia}

echo "🚀 手动触发 ${NETWORK_KEY} 网络同步（Docker 环境）..."

# 进入后端容器执行触发操作（使用内联 Python 代码）
docker compose exec backend uv run python -c "
import sys
import asyncio
from src.db.database import SessionLocal
from src.models import Network
from src.services.blockchain_sync import BlockchainSyncService

network_key = '${NETWORK_KEY}'
db = SessionLocal()

try:
    # 查找网络
    network = db.query(Network).filter(Network.id == network_key).first()
    if not network:
        print(f'❌ 网络未找到: {network_key}')
        print('可用网络: sepolia, base-sepolia')
        sys.exit(1)
    
    print(f'📋 网络: {network.name} (Chain ID: {network.chain_id})')
    print(f'🔄 开始同步...')
    
    # 创建同步服务并执行同步
    sync_service = BlockchainSyncService(network_key)
    asyncio.run(sync_service.sync())
    
    print(f'✅ 同步完成！')
    
except Exception as e:
    print(f'❌ 同步失败: {e}')
    sys.exit(1)
finally:
    db.close()
"

echo ""
echo "✅ 同步任务已完成！"
