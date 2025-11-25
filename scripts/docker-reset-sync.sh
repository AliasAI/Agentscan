#!/bin/bash

# Docker 环境下重置网络同步状态
# 用法: ./scripts/docker-reset-sync.sh [network_key]

set -e

NETWORK_KEY=${1:-base-sepolia}

echo "🔄 重置 ${NETWORK_KEY} 网络的同步状态（Docker 环境）..."

# 进入后端容器执行重置操作（使用内联 Python 代码）
docker compose exec backend uv run python -c "
import sys
from src.db.database import SessionLocal
from src.models import Network, BlockchainSync

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

    # 获取起始区块（从 networks_config）
    from src.core.networks_config import NETWORKS
    network_config = NETWORKS.get(network_key)
    start_block = network_config.get('start_block', 0) if network_config else 0

    # 查找同步记录（使用 network_name 字段）
    sync = db.query(BlockchainSync).filter(
        BlockchainSync.network_name == network_key
    ).first()

    if sync:
        old_block = sync.last_block
        sync.last_block = start_block
        sync.current_block = start_block
        sync.status = 'idle'
        db.commit()
        print(f'✅ 同步状态已重置')
        print(f'   从区块 {old_block} 重置到 {start_block}')
    else:
        print(f'⚠️  该网络还没有同步记录')
        print(f'💡 提示: 首次同步会自动创建记录')
    
finally:
    db.close()
"

echo ""
echo "✅ 重置完成！"
echo "💡 提示：后端定时任务会在下一个同步周期（每10分钟的固定时间）自动开始同步"
