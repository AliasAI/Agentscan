#!/bin/bash
# Docker 环境分类管理脚本（在宿主机上执行）

API_BASE="http://localhost:8001/api"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function show_usage() {
    echo "用法: ./classify_docker.sh [command] [options]"
    echo ""
    echo "命令:"
    echo "  start [limit] [batch_size]  启动后台分类任务"
    echo "  status                       查看任务状态"
    echo "  cancel                       取消正在运行的任务"
    echo "  logs                         查看容器日志"
    echo "  check                        检查数据库统计"
    echo ""
    echo "示例:"
    echo "  ./classify_docker.sh start 100 10    # 分类 100 个，每批 10 个"
    echo "  ./classify_docker.sh start 1737 20   # 分类全部，每批 20 个"
    echo "  ./classify_docker.sh status          # 查看进度"
    echo "  ./classify_docker.sh cancel          # 取消任务"
    echo "  ./classify_docker.sh logs            # 查看容器日志"
    echo "  ./classify_docker.sh check           # 检查数据库统计"
}

function start_classification() {
    local limit=$1
    local batch_size=${2:-10}

    if [ -z "$limit" ]; then
        echo -e "${YELLOW}提示: 未指定 limit，将处理所有未分类的 agents${NC}"
        read -p "是否继续？(y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "已取消"
            exit 0
        fi
    fi

    echo -e "${GREEN}启动后台分类任务...${NC}"
    echo "  Limit: ${limit:-全部}"
    echo "  Batch Size: $batch_size"
    echo ""

    if [ -z "$limit" ]; then
        response=$(curl -s -X POST "$API_BASE/agents/classify-background?batch_size=$batch_size")
    else
        response=$(curl -s -X POST "$API_BASE/agents/classify-background?limit=$limit&batch_size=$batch_size")
    fi

    echo "$response" | python3 -m json.tool

    echo ""
    echo -e "${GREEN}任务已启动！使用以下命令查看进度：${NC}"
    echo "  ./classify_docker.sh status"
}

function show_status() {
    response=$(curl -s "$API_BASE/agents/classify-background/status")

    # 美化 JSON 输出
    echo "$response" | python3 -m json.tool

    # 提取关键信息
    is_running=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['is_running'])" 2>/dev/null)

    if [ "$is_running" = "True" ]; then
        progress=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['progress'])" 2>/dev/null)
        processed=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['processed'])" 2>/dev/null)
        total=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['total_agents'])" 2>/dev/null)

        echo ""
        echo -e "${YELLOW}任务运行中: $processed/$total ($progress%)${NC}"
    fi
}

function cancel_task() {
    echo -e "${RED}取消后台分类任务...${NC}"

    response=$(curl -s -X POST "$API_BASE/agents/classify-background/cancel")
    echo "$response" | python3 -m json.tool
}

function show_logs() {
    echo -e "${GREEN}显示容器日志（最近 50 行，包含分类相关）...${NC}"
    echo ""
    docker logs --tail 50 agentscan-backend 2>&1 | grep -E "(classification|classified|llm_)" || \
    docker logs --tail 50 agentscan-backend
}

function check_stats() {
    echo -e "${GREEN}检查数据库统计...${NC}"
    echo ""
    docker exec agentscan-backend uv run python /app/check_classified.py
}

# 主逻辑
case "$1" in
    start)
        start_classification "$2" "$3"
        ;;
    status)
        show_status
        ;;
    cancel)
        cancel_task
        ;;
    logs)
        show_logs
        ;;
    check)
        check_stats
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
