# Agentscan Docker 部署指南

## 概述

本项目使用 Docker Compose 进行容器化部署，简化了部署流程。

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+

## 快速开始

### 1. 部署服务

```bash
./scripts/docker-deploy.sh
```

此脚本会：
- 创建必要的数据和日志目录
- 停止现有容器（如果有）
- 构建 Docker 镜像
- 启动所有服务

### 2. 访问服务

部署完成后，可以通过以下地址访问：

- **前端**：http://localhost:3000
- **后端 API**：http://localhost:8000

## 管理脚本

### 停止服务

```bash
./scripts/docker-stop.sh
```

### 重启服务

```bash
./scripts/docker-restart.sh
```

### 查看日志

查看所有服务日志：
```bash
./scripts/docker-logs.sh
```

查看特定服务日志：
```bash
./scripts/docker-logs.sh backend   # 查看后端日志
./scripts/docker-logs.sh frontend  # 查看前端日志
```

## 目录结构

```
.
├── backend/              # 后端服务
│   ├── Dockerfile       # 后端镜像定义
│   └── .dockerignore    # 后端构建忽略文件
├── frontend/            # 前端服务
│   ├── Dockerfile       # 前端镜像定义
│   └── .dockerignore    # 前端构建忽略文件
├── docker-compose.yml   # Docker Compose 配置
├── data/                # SQLite 数据库文件（持久化）
├── logs/                # 应用日志（持久化）
│   ├── backend/        # 后端日志
│   └── frontend/       # 前端日志
└── scripts/             # 部署脚本
    ├── docker-deploy.sh   # 部署脚本
    ├── docker-stop.sh     # 停止脚本
    ├── docker-restart.sh  # 重启脚本
    └── docker-logs.sh     # 日志查看脚本
```

## 数据持久化

以下数据会持久化到主机：

- **数据库**：`./data/8004scan.db` - SQLite 数据库文件
- **日志**：`./logs/` - 应用日志文件

即使删除容器，这些数据也会保留。

## 端口配置

默认端口映射：

- 前端：`3000:3000`
- 后端：`8000:8000`

如需修改端口，编辑 `docker-compose.yml` 文件中的 `ports` 配置。

## 环境变量

可以通过修改 `docker-compose.yml` 文件中的 `environment` 部分来配置环境变量。

### 后端环境变量

- `DATABASE_URL`：数据库连接 URL（默认：`sqlite:///./data/8004scan.db`）
- `CORS_ORIGINS`：允许的 CORS 源（默认：`http://localhost:3000,http://frontend:3000`）

### 前端环境变量

- `NEXT_PUBLIC_API_URL`：后端 API 地址（默认：`http://localhost:8000`）

## 故障排查

### 查看容器状态

```bash
docker compose ps
```

### 查看详细日志

```bash
docker compose logs -f
```

### 重新构建镜像

如果代码有更新，需要重新构建镜像：

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 清理所有数据

⚠️ **警告**：此操作会删除所有数据，包括数据库和日志。

```bash
docker compose down -v
rm -rf data logs
```

## 生产环境建议

1. **使用 HTTPS**：配置反向代理（如 Nginx）并启用 SSL
2. **修改端口**：避免使用默认端口
3. **数据备份**：定期备份 `data/` 目录
4. **日志轮转**：配置日志轮转以避免日志文件过大
5. **资源限制**：在 `docker-compose.yml` 中添加资源限制

## 更新部署

1. 拉取最新代码
2. 重新部署：
   ```bash
   ./scripts/docker-deploy.sh
   ```

这会自动重新构建镜像并重启服务。
