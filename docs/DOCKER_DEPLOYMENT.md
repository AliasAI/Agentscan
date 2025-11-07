# Docker 部署指南

本文档介绍如何使用 Docker 部署 8004scan 项目。

## 📋 前提条件

1. **安装 Docker 和 Docker Compose**
   - Docker Engine 20.10+
   - Docker Compose 2.0+

2. **配置环境变量**
   - 复制 `backend/.env.example` 为 `backend/.env`
   - 配置必需的环境变量（特别是 `SEPOLIA_RPC_URL`）

## 🚀 快速开始

### 1. 检查环境配置

在部署之前，先检查环境变量是否正确配置：

```bash
./scripts/docker-check-env.sh
```

### 2. 部署完整应用（前端 + 后端）

```bash
./scripts/docker-deploy.sh
```

部署完成后：
- **前端**：http://localhost:3000
- **后端 API**：http://localhost:8000
- **API 文档**：http://localhost:8000/docs

### 3. 仅部署后端

如果只需要部署后端服务（例如，前端单独部署或在开发环境运行）：

```bash
./scripts/docker-deploy-backend.sh
```

## 🛠️ 常用操作

### 查看服务状态

```bash
docker compose ps
```

### 查看日志

```bash
# 查看所有服务日志
./scripts/docker-logs.sh

# 查看后端日志
./scripts/docker-logs.sh backend

# 查看前端日志
./scripts/docker-logs.sh frontend
```

### 重启服务

```bash
./scripts/docker-restart.sh
```

### 停止服务

```bash
./scripts/docker-stop.sh
```

### 完全清理（包括数据卷）

```bash
docker compose down -v
```

## 📁 目录结构

Docker 部署会创建以下目录：

```
8004scan/
├── data/              # SQLite 数据库持久化目录
├── logs/              # 日志目录
│   ├── backend/       # 后端日志
│   └── frontend/      # 前端日志（如需要）
└── docker-compose.yml # Docker Compose 配置
```

## 🔧 配置说明

### 环境变量

`docker-compose.yml` 会从 `backend/.env` 文件读取以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `SEPOLIA_RPC_URL` | Sepolia 网络 RPC URL | ✅ |
| `DATABASE_URL` | 数据库连接 URL | ❌（有默认值） |
| `DEBUG` | 调试模式 | ❌ |
| `CORS_ORIGINS` | CORS 允许的源 | ❌（配置在 compose 文件中） |

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|----------|----------|------|
| Backend | 8000 | 8000 | FastAPI 服务 |
| Frontend | 3000 | 3000 | Next.js 应用 |

如需修改主机端口，编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # 将后端映射到 8001
```

### 数据持久化

默认配置会将以下内容持久化到宿主机：

- **数据库**：`./data/8004scan.db`
- **日志**：`./logs/backend/`

即使删除容器，这些数据也会保留。如需完全清理：

```bash
docker compose down -v
rm -rf data logs
```

## 🔄 更新部署

### 更新代码后重新部署

1. 停止现有服务：
   ```bash
   ./scripts/docker-stop.sh
   ```

2. 重新构建并启动：
   ```bash
   ./scripts/docker-deploy.sh
   ```

或者使用一条命令：
```bash
docker compose down && docker compose build && docker compose up -d
```

### 仅重启服务（不重新构建）

如果只修改了配置文件（如 `.env`），无需重新构建：

```bash
./scripts/docker-restart.sh
```

## 🐛 故障排查

### 1. 容器无法启动

**检查日志**：
```bash
docker compose logs backend
docker compose logs frontend
```

**常见问题**：
- 环境变量未配置：检查 `backend/.env`
- 端口已被占用：修改 `docker-compose.yml` 中的端口映射
- 权限问题：确保 `data` 和 `logs` 目录可写

### 2. 后端报错：SEPOLIA_RPC_URL 未配置

**解决方法**：
1. 确保 `backend/.env` 文件存在
2. 检查文件中是否配置了 `SEPOLIA_RPC_URL`
3. 运行检查脚本：`./scripts/docker-check-env.sh`

### 3. 前端无法连接后端

**检查网络**：
```bash
docker network ls
docker network inspect 8004scan_agentscan-network
```

**验证后端健康状态**：
```bash
curl http://localhost:8000/health
```

### 4. 数据库锁定错误

SQLite 在多进程环境下可能出现锁定问题。对于生产环境，建议：

1. 切换到 PostgreSQL：
   ```yaml
   # docker-compose.yml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_DB: 8004scan
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: your_password
       volumes:
         - postgres_data:/var/lib/postgresql/data

     backend:
       environment:
         - DATABASE_URL=postgresql://postgres:your_password@postgres:5432/8004scan
       depends_on:
         - postgres
   ```

## 🌐 生产环境部署

### 使用 Nginx 反向代理

推荐在生产环境中使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/sites-available/8004scan
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 启用 HTTPS

使用 Let's Encrypt：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 设置自动启动

```bash
# 创建 systemd 服务
sudo tee /etc/systemd/system/8004scan.service > /dev/null <<EOF
[Unit]
Description=8004scan Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/8004scan
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl enable 8004scan
sudo systemctl start 8004scan
```

## 📊 监控和维护

### 查看容器资源使用

```bash
docker stats
```

### 定期清理未使用的镜像

```bash
docker image prune -a
```

### 备份数据

```bash
# 备份数据库
cp data/8004scan.db backup/8004scan-$(date +%Y%m%d).db

# 或使用脚本自动备份
cat > scripts/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
cp data/8004scan.db "$BACKUP_DIR/8004scan-$(date +%Y%m%d-%H%M%S).db"
echo "✅ 备份完成：$BACKUP_DIR/8004scan-$(date +%Y%m%d-%H%M%S).db"
EOF

chmod +x scripts/backup.sh
```

## ❓ 常见问题

**Q: Docker 镜像很大怎么办？**

A: 使用多阶段构建和 Alpine 基础镜像已经优化了镜像大小。如需进一步优化，可以使用 `docker-slim`。

**Q: 如何在 Docker 中运行数据库迁移？**

A:
```bash
docker compose exec backend uv run alembic upgrade head
```

**Q: 如何进入容器调试？**

A:
```bash
# 进入后端容器
docker compose exec backend /bin/bash

# 进入前端容器
docker compose exec frontend /bin/sh
```

**Q: Docker Compose V1 和 V2 的区别？**

A: 本项目使用 V2 语法（`docker compose`，不是 `docker-compose`）。如果你使用的是旧版本，需要升级或将命令改为 `docker-compose`。

## 📚 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Docker 部署](https://fastapi.tiangolo.com/deployment/docker/)
