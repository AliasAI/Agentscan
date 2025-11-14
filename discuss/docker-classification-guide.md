# Docker 环境下的后台分类使用指南

## 环境说明

- **容器名称**: `agentscan-backend`
- **端口映射**: 宿主机 `8001` → 容器 `8000`
- **数据持久化**: `./data` (数据库) 和 `./logs/backend` (日志)
- **环境变量**: 从 `./backend/.env` 加载

## 方法 1: 直接通过 API 调用（推荐）⭐

这是最简单的方法，直接在宿主机上调用容器的 API。

### 1. 启动后台分类任务

```bash
# 在服务器宿主机上执行
# 处理 100 个，每批 10 个
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=100&batch_size=10"

# 处理全部，每批 20 个
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=1737&batch_size=20"
```

### 2. 查看任务状态

```bash
# 在宿主机上执行
curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool
```

输出示例:
```json
{
    "is_running": true,
    "total_agents": 100,
    "processed": 45,
    "classified": 44,
    "failed": 1,
    "progress": 45.0,
    "started_at": "2025-11-14T16:24:05.539093",
    "finished_at": null,
    "current_agent": "My AI Agent",
    "error": null
}
```

### 3. 取消任务

```bash
curl -X POST http://localhost:8001/api/agents/classify-background/cancel
```

### 4. 便捷脚本（宿主机使用）

创建一个宿主机脚本 `classify_docker.sh`:

```bash
#!/bin/bash
# Docker 环境分类管理脚本

API_BASE="http://localhost:8001/api"

function start_classification() {
    local limit=$1
    local batch_size=${2:-10}

    echo "启动后台分类任务..."
    echo "  Limit: ${limit:-全部}"
    echo "  Batch Size: $batch_size"

    if [ -z "$limit" ]; then
        curl -s -X POST "$API_BASE/agents/classify-background?batch_size=$batch_size" | python3 -m json.tool
    else
        curl -s -X POST "$API_BASE/agents/classify-background?limit=$limit&batch_size=$batch_size" | python3 -m json.tool
    fi
}

function show_status() {
    response=$(curl -s "$API_BASE/agents/classify-background/status")
    echo "$response" | python3 -m json.tool

    # 提取进度
    is_running=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['is_running'])")
    if [ "$is_running" = "True" ]; then
        progress=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['progress'])")
        processed=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['processed'])")
        total=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['total_agents'])")
        echo ""
        echo "任务运行中: $processed/$total ($progress%)"
    fi
}

function cancel_task() {
    echo "取消后台分类任务..."
    curl -s -X POST "$API_BASE/agents/classify-background/cancel" | python3 -m json.tool
}

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
    *)
        echo "用法: ./classify_docker.sh [start|status|cancel] [limit] [batch_size]"
        echo ""
        echo "示例:"
        echo "  ./classify_docker.sh start 100 10   # 分类 100 个"
        echo "  ./classify_docker.sh status         # 查看状态"
        echo "  ./classify_docker.sh cancel         # 取消任务"
        exit 1
        ;;
esac
```

使用方法:
```bash
# 添加执行权限
chmod +x classify_docker.sh

# 启动分类
./classify_docker.sh start 100 10

# 查看状态
./classify_docker.sh status

# 取消任务
./classify_docker.sh cancel
```

---

## 方法 2: 在容器内执行脚本

如果你想使用容器内的脚本，需要通过 `docker exec` 进入容器。

### 1. 进入容器

```bash
docker exec -it agentscan-backend bash
```

### 2. 在容器内执行分类脚本

```bash
# 在容器内执行
cd /app
./classify_background.sh start 100 10
```

### 3. 查看状态

```bash
# 在容器内
./classify_background.sh status
```

### 4. 退出容器

```bash
exit
```

---

## 方法 3: 一键执行（推荐用于自动化）

直接通过 `docker exec` 执行命令，无需进入容器：

```bash
# 在宿主机上执行，直接调用容器内的脚本
docker exec agentscan-backend /app/classify_background.sh start 100 10

# 查看状态
docker exec agentscan-backend /app/classify_background.sh status

# 取消任务
docker exec agentscan-backend /app/classify_background.sh cancel
```

---

## 监控任务进度

### 1. 定期查询状态（宿主机）

```bash
# 每 30 秒查询一次
watch -n 30 'curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool'
```

### 2. 查看容器日志

```bash
# 实时查看容器日志
docker logs -f agentscan-backend

# 只查看分类相关日志
docker logs -f agentscan-backend 2>&1 | grep -E "(classification|classified)"
```

### 3. 查看持久化日志

```bash
# 日志保存在宿主机的 logs/backend 目录
tail -f ./logs/backend/app.log | grep classification
```

### 4. 检查数据库统计

```bash
# 在容器内执行统计脚本
docker exec agentscan-backend python /app/check_classified.py
```

---

## 环境变量配置

### 1. 确认环境变量已加载

```bash
# 查看容器内的环境变量
docker exec agentscan-backend env | grep -E "(LLM|DEEPSEEK|OPENAI)"
```

应该看到:
```
LLM_PROVIDER=deepseek
LLM_MODEL_NAME=deepseek-chat
DEEPSEEK_API_KEY=sk-xxx
```

### 2. 如果环境变量未加载

编辑 `./backend/.env` 文件，确保包含:
```bash
# AI 分类配置
LLM_PROVIDER=deepseek
LLM_MODEL_NAME=deepseek-chat
DEEPSEEK_API_KEY=sk-your-key-here
```

然后重启容器:
```bash
docker-compose restart backend
```

---

## 完整使用流程（推荐）

### 步骤 1: 确认服务运行

```bash
# 检查容器状态
docker ps | grep agentscan

# 检查 API 是否可用
curl http://localhost:8001/api/stats
```

### 步骤 2: 启动小规模测试

```bash
# 先测试 20 个
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=20&batch_size=5"
```

### 步骤 3: 查看状态

```bash
# 等待几秒后查看状态
sleep 5
curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool
```

### 步骤 4: 确认无误后启动大规模分类

```bash
# 处理全部 1737 个
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=1737&batch_size=20"
```

### 步骤 5: 使用 tmux/screen 保持会话

```bash
# 创建新会话
screen -S classification

# 定期查看进度
watch -n 30 'curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool'

# 分离会话: Ctrl+A, D
# 重新连接: screen -r classification
```

---

## Docker Compose 集成（可选）

如果想要在 Docker Compose 中添加一次性分类任务：

在 `docker-compose.yml` 中添加一个一次性服务:

```yaml
services:
  # ... 现有服务 ...

  # 一次性分类任务（手动运行）
  classifier:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: agentscan-classifier
    volumes:
      - ./data:/app/data
      - ./logs/backend:/app/logs
    env_file:
      - ./backend/.env
    networks:
      - agentscan-network
    command: python /app/classify_agents.py 1737
    profiles:
      - tools  # 只在指定 profile 时运行
```

使用方法:
```bash
# 运行一次性分类任务
docker-compose --profile tools run --rm classifier
```

---

## 常见问题（Docker 环境）

### Q1: API 调用端口是多少？
**A**: 宿主机端口 `8001`，容器内部端口 `8000`。从宿主机调用使用 `http://localhost:8001`。

### Q2: 数据库文件在哪里？
**A**: 宿主机 `./data/8004scan.db`，容器内 `/app/data/8004scan.db`。

### Q3: 如何查看分类日志？
**A**:
- 容器日志: `docker logs -f agentscan-backend`
- 持久化日志: `tail -f ./logs/backend/app.log`

### Q4: 环境变量修改后需要重启吗？
**A**: 是的，修改 `.env` 后需要重启容器:
```bash
docker-compose restart backend
```

### Q5: 可以在容器外直接访问数据库吗？
**A**: 可以，数据库持久化在 `./data/8004scan.db`，可以用 SQLite 客户端直接访问。

### Q6: 如何确认分类任务在运行？
**A**: 三种方式：
1. 查看 API 状态: `curl http://localhost:8001/api/agents/classify-background/status`
2. 查看容器日志: `docker logs agentscan-backend | tail -20`
3. 查看容器 CPU 使用: `docker stats agentscan-backend`

---

## 推荐方案总结

### 小规模测试（< 50 个）
```bash
# 宿主机上执行
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=20&batch_size=5"

# 查看状态
curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool
```

### 大规模处理（全部 1737 个）
```bash
# 使用 screen 保持会话
screen -S classification

# 启动分类
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=1737&batch_size=20"

# 监控进度
watch -n 30 'curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool'

# 分离会话: Ctrl+A, D
# 稍后重新连接: screen -r classification
```

---

## 性能与成本（Docker 环境）

- **平均速度**: ~5-6 秒/agent（与非 Docker 环境相同）
- **网络开销**: 容器内部调用 LLM API，无额外延迟
- **资源占用**: CPU ~10-20%，内存 ~200-300MB
- **成本**: DeepSeek 全部 1737 个约 $0.52

---

**更新时间**: 2025-11-14
**Docker 版本**: 兼容 Docker Compose v2.x
