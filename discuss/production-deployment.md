# 生产环境部署指南

## 域名配置

生产环境域名：**agentscan.info**

## 部署前准备

### 0. 多域名共存说明

**重要：一台服务器可以同时运行多个 HTTPS 应用！**

如果你的服务器已经有 Nginx 在运行，并且已经绑定了其他域名，这完全没有问题。Nginx 支持同时处理多个域名的请求，通过虚拟主机（Virtual Host）配置来实现。

**工作原理：**
- Nginx 通过 `server_name` 指令识别不同的域名
- 同一个 80/443 端口可以同时服务多个域名
- 每个域名有独立的 SSL 证书
- 不同域名的配置文件相互独立，互不影响

**示例：**
```
现有配置：example.com (监听 80/443)
新增配置：agentscan.info (监听 80/443)
两者可以同时运行，互不干扰
```

**配置文件结构：**
```
/etc/nginx/sites-available/
  ├── example.com          # 现有域名配置
  ├── agentscan.info       # 新增域名配置（本项目）
  └── other-domain.com     # 其他域名配置

/etc/nginx/sites-enabled/
  ├── example.com -> ../sites-available/example.com
  ├── agentscan.info -> ../sites-available/agentscan.info
  └── other-domain.com -> ../sites-available/other-domain.com
```

### 1. 服务器要求

- 操作系统：Ubuntu 20.04+ 或其他 Linux 发行版
- Docker 和 Docker Compose 已安装
- Nginx 已安装（可以是已有的 Nginx 实例）
- 至少 2GB RAM，20GB 磁盘空间
- 端口 80 和 443 已开放（可以与其他域名共享）

### 2. DNS 配置

确保域名的 DNS 记录已正确配置：

```
A     agentscan.info     -> 服务器公网 IP
A     www.agentscan.info -> 服务器公网 IP
```

可以使用以下命令验证 DNS 配置：

```bash
dig agentscan.info
dig www.agentscan.info
```

## 部署步骤

### 1. 克隆代码到服务器

```bash
# 登录到服务器
ssh user@your-server-ip

# 克隆项目
git clone <repository-url> /opt/8004scan
cd /opt/8004scan

# 切换到 release 分支
git checkout release
```

### 2. 配置环境变量

后端环境变量已经在 `backend/.env` 中配置好，包括：
- 生产域名的 CORS 配置
- 数据库配置
- 区块链 RPC 配置

请检查并根据需要调整 `backend/.env` 文件。

### 3. 安装 SSL 证书（Let's Encrypt）

#### 3.1 安装 Certbot

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

#### 3.2 申请 SSL 证书

**⚠️ 重要提示：如果服务器已有其他域名在运行，请按照以下步骤操作！**

**步骤 1：先检查 DNS 配置**

```bash
# 在本地计算机（不是服务器）上检查 DNS 是否生效
dig agentscan.info
# 应该解析到服务器的公网 IP

# 如果 DNS 未生效，请等待 DNS 传播（5-30 分钟）
```

**步骤 2：创建临时 HTTP 配置用于证书验证**

```bash
cd /opt/8004scan

# 创建 certbot 验证目录
sudo mkdir -p /var/www/certbot

# 使用临时 HTTP 配置（不影响现有网站）
sudo cp nginx/temp-http-only.conf /etc/nginx/sites-available/agentscan-temp.conf
sudo ln -s /etc/nginx/sites-available/agentscan-temp.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx

# 验证域名路由是否正确
curl http://agentscan.info
# 应该返回: "agentscan.info - Temporary configuration for SSL setup"
```

**步骤 3：申请证书**

```bash
# 申请 SSL 证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 如果成功，会显示：
# Successfully received certificate.
# Certificate is saved at: /etc/letsencrypt/live/agentscan.info/fullchain.pem
```

**步骤 4：删除临时配置**

```bash
# 删除临时配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf
```

#### 3.3 故障排查

**如果证书申请失败（出现 "Invalid response" 或 "unauthorized" 错误）：**

请查看详细的故障排查指南：
```bash
cat docs/ssl-certificate-troubleshooting.md
```

或在线查看：`docs/ssl-certificate-troubleshooting.md`

常见问题：
- DNS 未正确配置或未生效
- Nginx 将请求路由到了其他域名
- 验证文件无法访问

### 4. 配置 Nginx

**注意：此配置不会影响服务器上的其他域名配置！**

```bash
# 0. (推荐) 使用配置检查脚本验证当前环境
# 将项目文件传到服务器后，运行以下命令：
cd /opt/8004scan
bash scripts/check-nginx-config.sh

# 1. 查看现有的 Nginx 配置（可选，用于确认现有配置）
ls -la /etc/nginx/sites-enabled/

# 2. 复制生产环境 Nginx 配置到 sites-available
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info

# 3. 创建符号链接到 sites-enabled
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/

# 4. 测试 Nginx 配置（确保不会破坏现有配置）
sudo nginx -t

# 如果测试通过，会显示：
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 5. 重新加载 Nginx（不会中断现有服务）
sudo systemctl reload nginx

# 6. 验证所有站点都在正常运行
curl -I https://agentscan.info  # 检查新站点
# 同时检查你的其他域名是否正常
```

**配置说明：**
- `nginx -t` 会测试所有配置文件，包括现有的和新增的
- `systemctl reload nginx` 是热重载，不会中断现有连接
- 如果配置有误，reload 会失败并保持原有配置
- 多个 server block 可以同时监听 80 和 443 端口

### 5. 启动 Docker 容器

```bash
# 构建并启动容器
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 6. 验证部署

访问以下 URL 验证部署是否成功：

- https://agentscan.info - 前端页面
- https://agentscan.info/api/health - 后端健康检查（如果有的话）

## SSL 证书自动续期

Let's Encrypt 证书有效期为 90 天，需要定期续期。

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 添加定时任务自动续期
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet && systemctl reload nginx
```

## 日常维护

### 查看日志

```bash
# 查看 Docker 容器日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/agentscan_access.log
sudo tail -f /var/log/nginx/agentscan_error.log

# 查看应用日志
tail -f logs/backend/*.log
```

### 更新代码

```bash
# 拉取最新代码
git pull origin release

# 重新构建并重启容器
docker-compose down
docker-compose up -d --build

# 查看容器状态
docker-compose ps
```

### 备份数据

```bash
# 备份数据库
cp data/8004scan.db data/8004scan.db.backup.$(date +%Y%m%d_%H%M%S)

# 或者使用定时任务自动备份
# 添加到 crontab
0 3 * * * cp /opt/8004scan/data/8004scan.db /opt/8004scan/data/8004scan.db.backup.$(date +\%Y\%m\%d)
```

### 停止服务

```bash
# 停止容器
docker-compose down

# 停止并删除所有数据
docker-compose down -v
```

## 监控和告警

建议配置以下监控：

1. **服务器监控**：CPU、内存、磁盘使用率
2. **应用监控**：容器运行状态、日志错误
3. **SSL 证书监控**：证书过期时间
4. **网站可用性监控**：定期检查网站是否可访问

可以使用以下工具：
- Prometheus + Grafana（性能监控）
- Uptime Robot（可用性监控）
- CloudWatch 或其他云监控服务

## 安全建议

1. **防火墙配置**：只开放必要的端口（80、443、22）
2. **SSH 安全**：
   - 禁用密码登录，只使用 SSH 密钥
   - 修改 SSH 默认端口
   - 配置 fail2ban 防止暴力破解
3. **定期更新**：及时更新系统和 Docker 镜像
4. **数据备份**：定期备份数据库和重要文件
5. **日志审计**：定期检查日志，及时发现异常

## 故障排查

### 多域名配置相关问题

#### 问题：担心端口冲突

**情况说明：**
- Nginx 的多个 server block 可以同时监听同一个端口（80/443）
- 这不是端口冲突，而是 Nginx 的正常工作方式
- Nginx 会根据请求的 `Host` 头（域名）来路由到不同的 server block

**验证方法：**
```bash
# 查看当前监听 80 和 443 端口的进程
sudo netstat -tlnp | grep -E ':80|:443'

# 应该只看到一个 nginx 进程，但它可以处理多个域名
# 示例输出：
# tcp  0  0  0.0.0.0:80   0.0.0.0:*  LISTEN  12345/nginx
# tcp  0  0  0.0.0.0:443  0.0.0.0:*  LISTEN  12345/nginx

# 查看所有启用的站点配置
ls -la /etc/nginx/sites-enabled/

# 测试配置文件语法
sudo nginx -t
```

#### 问题：现有域名配置被影响

**解决方法：**
```bash
# 1. 检查所有 server block 的 server_name 是否唯一
sudo grep -r "server_name" /etc/nginx/sites-enabled/

# 2. 确保每个域名都有唯一的 server_name
# 正确示例：
# /etc/nginx/sites-enabled/example.com:    server_name example.com www.example.com;
# /etc/nginx/sites-enabled/agentscan.info: server_name agentscan.info www.agentscan.info;

# 3. 如果发现冲突，编辑配置文件修正
sudo nano /etc/nginx/sites-available/agentscan.info

# 4. 重新测试并加载
sudo nginx -t && sudo systemctl reload nginx
```

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查后端和前端容器端口占用（注意：这些是容器映射到宿主机的端口）
sudo netstat -tlnp | grep -E '3000|8001'

# 如果 3000 或 8001 端口被占用，可以修改 docker-compose.yml 中的端口映射
# 例如：将 "8001:8000" 改为 "8002:8000"

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
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
sudo certbot delete --cert-name agentscan.info
# 然后重新执行步骤 3
```

## 性能优化

1. **启用 Nginx 缓存**：缓存静态资源
2. **启用 Gzip 压缩**：减少传输数据量
3. **配置 CDN**：加速静态资源访问
4. **数据库优化**：定期清理和优化数据库
5. **容器资源限制**：在 docker-compose.yml 中配置资源限制

## 联系支持

如有问题，请：
1. 查看项目文档
2. 查看 GitHub Issues
3. 联系开发团队
