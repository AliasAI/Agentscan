#!/bin/bash

# Initialize networks data
# 初始化网络数据

cd "$(dirname "$0")/.."

echo "🚀 Initializing networks..."
cd backend && python -m src.db.init_networks
