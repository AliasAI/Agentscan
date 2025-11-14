# 部署指南

本文档提供 8004scan 的完整部署指南，包括本地开发、Docker 部署和生产环境部署。

## 目录

- [本地开发](#本地开发)
- [Docker 部署](#docker-部署)
- [生产环境部署](#生产环境部署)
- [日常维护](#日常维护)
- [故障排查](#故障排查)

---

## 本地开发

### 前置要求

- Node.js 18+
- Python 3.11+
- uv (Python 包管理器)

### 安装 uv

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 启动开发环境

#### 同时启动前后端

```bash
./scripts/dev-all.sh
```

#### 分别启动

**后端**：
```bash
./scripts/dev-backend.sh
```

**前端**：
```bash
./scripts/dev-frontend.sh
```

### 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

---

## Docker 部署

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 环境配置

1. 复制环境变量模板：
   ```bash
   cp backend/.env.example backend/.env
   ```

2. 编辑 `backend/.env`，配置必需的环境变量（特别是 `SEPOLIA_RPC_URL`）

3. 检查环境配置：
   ```bash
   ./scripts/docker-check-env.sh
   ```

### 部署应用

#### 完整部署（前端 + 后端）

```bash
./scripts/docker-deploy.sh
```

部署完成后：
- **前端**：http://localhost:3000
- **后端 API**：http://localhost:8000
- **API 文档**：http://localhost:8000/docs

#### 仅部署后端

```bash
./scripts/docker-deploy-backend.sh
```

### 常用操作

```bash
# 查看服务状态
docker compose ps

# 查看日志
./scripts/docker-logs.sh              # 所有服务
./scripts/docker-logs.sh backend      # 仅后端
./scripts/docker-logs.sh frontend     # 仅前端

# 重启服务
./scripts/docker-restart.sh

# 停止服务
./scripts/docker-stop.sh

# 完全清理（包括数据）
docker compose down -v
```

### 数据持久化

Docker 部署会将以下内容持久化到宿主机：

- **数据库**：`./data/8004scan.db`
- **日志**：`./logs/backend/`

即使删除容器，这些数据也会保留。

---

## 生产环境部署

### 服务器要求

- Ubuntu 20.04+ 或其他 Linux 发行版
- Docker 和 Docker Compose
- Nginx（可以是已有的 Nginx 实例）
- 至少 2GB RAM，20GB 磁盘空间
- 端口 80 和 443 已开放

### 部署步骤

#### 1. DNS 配置

确保域名的 DNS 记录已正确配置：

```
A     yourdomain.com     -> 服务器公网 IP
A     www.yourdomain.com -> 服务器公网 IP
```

验证 DNS 配置：
```bash
dig yourdomain.com
```

#### 2. 克隆代码到服务器

```bash
# 登录到服务器
ssh user@your-server-ip

# 克隆项目
git clone <repository-url> /opt/8004scan
cd /opt/8004scan
```

#### 3. 配置环境变量

检查并配置 `backend/.env` 文件：

```env
DEBUG=false
DATABASE_URL=sqlite:///./data/8004scan.db
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### 4. 安装 SSL 证书

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos
```

#### 5. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/yourdomain.com

# 编辑配置文件，替换域名
sudo nano /etc/nginx/sites-available/yourdomain.com

# 创建符号链接
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

#### 6. 启动 Docker 容器

```bash
cd /opt/8004scan

# 构建并启动容器
docker compose up -d --build

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 7. 验证部署

访问以下 URL 验证部署是否成功：

- https://yourdomain.com - 前端页面
- https://yourdomain.com/api/health - 后端健康检查

### SSL 证书自动续期

Let's Encrypt 证书有效期为 90 天，需要定期续期：

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 日常维护

### 查看日志

**Docker 容器日志**：
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Nginx 日志**：
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**应用日志**：
```bash
tail -f logs/backend/*.log
```

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建并重启容器
docker compose down
docker compose up -d --build

# 查看容器状态
docker compose ps
```

### 备份数据

```bash
# 手动备份数据库
cp data/8004scan.db data/8004scan.db.backup.$(date +%Y%m%d_%H%M%S)

# 自动备份（添加到 crontab）
0 3 * * * cp /opt/8004scan/data/8004scan.db /opt/8004scan/backups/8004scan.db.$(date +\%Y\%m\%d)
```

---

## 故障排查

### 容器无法启动

**检查日志**：
```bash
docker compose logs backend
docker compose logs frontend
```

**常见问题**：
- 环境变量未配置：检查 `backend/.env`
- 端口已被占用：修改 `docker-compose.yml` 中的端口映射
- 权限问题：确保 `data` 和 `logs` 目录可写

### SEPOLIA_RPC_URL 未配置错误

**解决方法**：
1. 确保 `backend/.env` 文件存在
2. 检查文件中是否配置了 `SEPOLIA_RPC_URL`
3. 运行检查脚本：`./scripts/docker-check-env.sh`

### 前端无法连接后端

**检查网络**：
```bash
docker network ls
docker network inspect 8004scan_agentscan-network
```

**验证后端健康状态**：
```bash
curl http://localhost:8000/health
```

### Nginx 配置错误

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### SSL 证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --force-renewal

# 重新申请证书
sudo certbot delete --cert-name yourdomain.com
# 然后重新执行步骤 4
```

### 数据库锁定错误

SQLite 在多进程环境下可能出现锁定问题。对于生产环境，建议切换到 PostgreSQL：

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

---

## 性能优化

1. **启用 Nginx 缓存**：缓存静态资源
2. **启用 Gzip 压缩**：减少传输数据量
3. **配置 CDN**：加速静态资源访问
4. **数据库优化**：定期清理和优化数据库
5. **容器资源限制**：在 docker-compose.yml 中配置资源限制

---

## 安全建议

1. **防火墙配置**：只开放必要的端口（80、443、22）
2. **SSH 安全**：
   - 禁用密码登录，只使用 SSH 密钥
   - 修改 SSH 默认端口
   - 配置 fail2ban 防止暴力破解
3. **定期更新**：及时更新系统和 Docker 镜像
4. **数据备份**：定期备份数据库和重要文件
5. **日志审计**：定期检查日志，及时发现异常

---

## 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [FastAPI Docker 部署](https://fastapi.tiangolo.com/deployment/docker/)
