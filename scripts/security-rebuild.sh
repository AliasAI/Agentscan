#!/bin/bash
# security-rebuild.sh - 安全重建脚本
# 用于在发现安全漏洞后重建容器

set -e

echo "=========================================="
echo "🔒 Security Rebuild Script"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}Step 1: 停止所有容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 2: 删除旧的镜像（确保不使用被污染的缓存）...${NC}"
docker compose rm -f 2>/dev/null || true

# 删除项目相关的镜像
echo "删除项目镜像..."
docker images | grep -E "agentscan|8004scan" | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 3: 清理 Docker 构建缓存...${NC}"
docker builder prune -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 4: 重新构建镜像（不使用缓存）...${NC}"
docker compose build --no-cache

echo ""
echo -e "${YELLOW}Step 5: 启动新容器...${NC}"
docker compose up -d

echo ""
echo -e "${YELLOW}Step 6: 验证容器状态...${NC}"
sleep 5
docker compose ps

echo ""
echo -e "${YELLOW}Step 7: 检查容器内是否有可疑文件...${NC}"
FRONTEND_CONTAINER=$(docker compose ps -q frontend 2>/dev/null)
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo "检查 /tmp 目录..."
    docker exec "$FRONTEND_CONTAINER" ls -la /tmp/ 2>/dev/null || echo "无法访问 /tmp"

    echo ""
    echo "检查运行中的进程..."
    docker exec "$FRONTEND_CONTAINER" ps aux 2>/dev/null || echo "ps 命令不可用"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✅ 安全重建完成！"
echo "==========================================${NC}"
echo ""
echo "后续建议："
echo "1. 检查服务器日志，确认没有异常活动"
echo "2. 考虑更换服务器密钥/密码"
echo "3. 检查服务器其他服务是否受影响"
echo "4. 设置定期安全扫描"
