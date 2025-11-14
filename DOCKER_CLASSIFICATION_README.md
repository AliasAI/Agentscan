# Docker 环境后台分类快速开始

## 🚀 一键使用（推荐）

在服务器宿主机上直接使用脚本管理分类任务：

```bash
# 1. 启动小规模测试（20 个）
./classify_docker.sh start 20 5

# 2. 查看任务状态
./classify_docker.sh status

# 3. 确认无误后，启动大规模分类（全部 1737 个）
./classify_docker.sh start 1737 20

# 4. 定期查看进度
watch -n 30 ./classify_docker.sh status

# 5. 查看容器日志
./classify_docker.sh logs

# 6. 检查数据库统计
./classify_docker.sh check

# 7. 如需取消
./classify_docker.sh cancel
```

## 📋 可用命令

```bash
./classify_docker.sh start [limit] [batch_size]  # 启动分类
./classify_docker.sh status                      # 查看状态
./classify_docker.sh cancel                      # 取消任务
./classify_docker.sh logs                        # 查看日志
./classify_docker.sh check                       # 数据库统计
```

## ⚙️ 环境配置

### 1. 确认 .env 文件已配置

编辑 `./backend/.env`，确保包含：

```bash
# AI 分类配置
LLM_PROVIDER=deepseek
LLM_MODEL_NAME=deepseek-chat
DEEPSEEK_API_KEY=sk-fbfe33b8420a4a28b3606f02366a9324
```

### 2. 重启容器使环境变量生效

```bash
docker-compose restart backend
```

### 3. 验证环境变量

```bash
docker exec agentscan-backend env | grep -E "(LLM|DEEPSEEK)"
```

应该看到:
```
LLM_PROVIDER=deepseek
LLM_MODEL_NAME=deepseek-chat
DEEPSEEK_API_KEY=sk-xxx
```

## 📊 监控进度

### 方式 1: 使用脚本（推荐）

```bash
# 每 30 秒自动刷新状态
watch -n 30 ./classify_docker.sh status
```

### 方式 2: 实时日志

```bash
# 查看容器日志
docker logs -f agentscan-backend | grep -E "(classification|classified)"
```

### 方式 3: 数据库统计

```bash
# 查看已分类/未分类数量
./classify_docker.sh check
```

## 🔄 使用 screen/tmux 保持会话

```bash
# 创建新会话
screen -S classification

# 启动分类任务
./classify_docker.sh start 1737 20

# 监控进度
watch -n 30 ./classify_docker.sh status

# 分离会话: Ctrl+A, D
# 重新连接: screen -r classification
```

## 📦 直接使用 API（可选）

如果不想用脚本，也可以直接调用 API：

```bash
# 启动分类
curl -X POST "http://localhost:8001/api/agents/classify-background?limit=100&batch_size=10"

# 查看状态
curl -s http://localhost:8001/api/agents/classify-background/status | python3 -m json.tool

# 取消任务
curl -X POST http://localhost:8001/api/agents/classify-background/cancel
```

**注意**: 端口是 `8001`（Docker Compose 配置的宿主机端口）

## 🐛 故障排查

### 问题 1: 脚本提示 "command not found"
```bash
# 添加执行权限
chmod +x ./classify_docker.sh
```

### 问题 2: API 连接失败
```bash
# 检查容器是否运行
docker ps | grep agentscan-backend

# 检查端口映射
docker port agentscan-backend

# 测试 API
curl http://localhost:8001/api/stats
```

### 问题 3: 环境变量未生效
```bash
# 1. 确认 .env 文件存在
ls -la ./backend/.env

# 2. 重启容器
docker-compose restart backend

# 3. 验证环境变量
docker exec agentscan-backend env | grep DEEPSEEK
```

### 问题 4: 查看错误日志
```bash
# 查看容器日志
docker logs agentscan-backend --tail 100

# 查看持久化日志
tail -f ./logs/backend/app.log
```

## 📈 性能建议

| 场景 | 推荐配置 | 预计时间 |
|------|----------|----------|
| 小规模测试 | `start 20 5` | 2-3 分钟 |
| 中等规模 | `start 200 10` | 15-20 分钟 |
| 大规模（全部） | `start 1737 20` | 2-3 小时 |

**注意**:
- `batch_size` 建议 10-20，避免 API 限流
- 长时间任务建议使用 screen/tmux

## 💰 成本估算

- **DeepSeek API**: 极低成本
- **全部 1737 个 agents**: 约 $0.52
- **单次分类**: 约 $0.0003

## 📚 完整文档

- **Docker 使用指南**: `docs/docker-classification-guide.md`
- **通用使用指南**: `docs/background-classification-guide.md`
- **分类文档**: `docs/oasf-classification.md`

---

**问题反馈**: 如有问题，请查看容器日志或联系管理员
