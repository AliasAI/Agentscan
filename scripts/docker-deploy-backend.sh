#!/bin/bash

# Docker 后端部署脚本
# 仅部署后端服务（不包含前端）

set -e

echo "🚀 开始部署 Agentscan 后端..."

# 进入项目根目录
cd "$(dirname "$0")/.."

# 检查环境变量
if [ ! -f backend/.env ]; then
    echo "❌ 错误：backend/.env 文件不存在"
    echo "请先复制 backend/.env.example 并配置环境变量"
    exit 1
fi

# 检查 SEPOLIA_RPC_URL
if ! grep -q "SEPOLIA_RPC_URL=" backend/.env || grep -q "SEPOLIA_RPC_URL=YOUR_NEW_RPC_URL_HERE" backend/.env; then
    echo "❌ 错误：SEPOLIA_RPC_URL 未配置"
    echo "请在 backend/.env 中配置有效的 SEPOLIA_RPC_URL"
    exit 1
fi

# 创建必要的目录
echo "📁 创建数据和日志目录..."
mkdir -p data
mkdir -p logs/backend

# 停止现有容器（如果有）
echo "🛑 停止现有容器..."
docker compose -f docker-compose.backend-only.yml down 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker compose -f docker-compose.backend-only.yml build

# 启动服务
echo "▶️  启动服务..."
docker compose -f docker-compose.backend-only.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态："
docker compose -f docker-compose.backend-only.yml ps

echo ""
echo "🌐 访问地址："
echo "  后端 API：http://localhost:8000"
echo "  API 文档：http://localhost:8000/docs"
echo ""
echo "📝 查看日志："
echo "  docker compose -f docker-compose.backend-only.yml logs -f"
echo ""
