#!/bin/bash

# Docker 部署脚本
# 用于构建和启动 Docker Compose 服务

set -e

echo "🚀 开始部署 Agentscan..."

# 进入项目根目录
cd "$(dirname "$0")/.."

# 创建必要的目录
echo "📁 创建数据和日志目录..."
mkdir -p data
mkdir -p logs/backend
mkdir -p logs/frontend

# 停止现有容器（如果有）
echo "🛑 停止现有容器..."
docker compose down 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker compose build

# 启动服务
echo "▶️  启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态："
docker compose ps

echo ""
echo "🌐 访问地址："
echo "  前端：http://localhost:3000"
echo "  后端：http://localhost:8000"
echo ""
echo "📝 查看日志："
echo "  docker compose logs -f"
echo ""
