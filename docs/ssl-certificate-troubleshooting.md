# SSL 证书申请故障排查指南

## 问题现象

申请 SSL 证书时出现以下错误：
```
Invalid response from https://aliasai.io/.well-known/acme-challenge/...
```

这说明 Let's Encrypt 访问了错误的域名（aliasai.io 而不是 agentscan.info）。

## 原因分析

可能的原因：
1. **DNS 未正确配置或未生效**：域名还没有指向服务器 IP
2. **Nginx 默认 server 捕获请求**：现有的 Nginx 配置捕获了所有未匹配的请求
3. **验证文件无法访问**：`.well-known/acme-challenge/` 路径配置不正确

## 解决步骤

### 步骤 1：检查 DNS 配置

在**本地计算机**（不是服务器）运行以下命令：

```bash
# 检查 DNS 解析
dig agentscan.info
dig www.agentscan.info

# 或使用 nslookup
nslookup agentscan.info
nslookup www.agentscan.info

# 或直接 ping
ping agentscan.info
```

**期望结果：**
- A 记录应该指向你的服务器公网 IP
- 如果解析到其他 IP，说明 DNS 配置有问题

**如果 DNS 未生效：**
1. 登录域名注册商或 DNS 服务商
2. 添加/修改 A 记录：
   ```
   A    agentscan.info     -> 你的服务器公网IP
   A    www.agentscan.info -> 你的服务器公网IP
   ```
3. 等待 DNS 生效（通常 5-30 分钟，最长可能 24 小时）

### 步骤 2：在服务器上验证域名访问

```bash
# 在服务器上测试域名是否能访问到本机
curl -I http://agentscan.info
curl -I http://www.agentscan.info

# 检查是否返回正确的响应（而不是其他域名的内容）
```

### 步骤 3：使用临时 HTTP 配置申请证书

**方法 A：创建临时 Nginx 配置（推荐）**

```bash
# 1. 创建 certbot 验证目录
sudo mkdir -p /var/www/certbot

# 2. 复制临时 HTTP 配置
cd /opt/8004scan
sudo cp nginx/temp-http-only.conf /etc/nginx/sites-available/agentscan-temp.conf

# 3. 启用临时配置
sudo ln -s /etc/nginx/sites-available/agentscan-temp.conf /etc/nginx/sites-enabled/

# 4. 测试 Nginx 配置
sudo nginx -t

# 5. 重新加载 Nginx
sudo systemctl reload nginx

# 6. 测试域名是否正确路由
curl http://agentscan.info
# 应该返回: "agentscan.info - Temporary configuration for SSL setup"

curl http://www.agentscan.info
# 应该返回: "agentscan.info - Temporary configuration for SSL setup"

# 7. 如果上面的测试通过，申请 SSL 证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 8. 证书申请成功后，删除临时配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf

# 9. 使用完整的生产配置
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/

# 10. 测试并重新加载
sudo nginx -t
sudo systemctl reload nginx
```

**方法 B：使用 Certbot Nginx 插件（更简单）**

```bash
# 1. 先创建基本的 HTTP 配置（使用临时配置）
sudo cp nginx/temp-http-only.conf /etc/nginx/sites-available/agentscan-temp.conf
sudo ln -s /etc/nginx/sites-available/agentscan-temp.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 2. 使用 certbot nginx 插件自动配置
sudo certbot --nginx \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 3. 删除临时配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf

# 4. 使用我们的生产配置替换
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**方法 C：standalone 模式（需要临时停止 Nginx）**

如果你不介意临时停止 Nginx（会影响其他网站），可以使用：

```bash
# 1. 停止 Nginx
sudo systemctl stop nginx

# 2. 使用 standalone 模式申请证书
sudo certbot certonly --standalone \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 3. 启动 Nginx
sudo systemctl start nginx

# 4. 配置 Nginx 使用证书
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**⚠️ 注意：**方法 C 会导致服务器上的所有网站（包括 aliasai.io）短暂不可用。

## 常见问题

### Q1: curl http://agentscan.info 返回 301 重定向到其他域名

**现象：**
```bash
curl -I http://agentscan.info
# 返回: HTTP/1.1 301 Moved Permanently
# Location: https://aliasai.io/
```

**原因：**
现有的 Nginx 配置中，某个 server block 将所有未匹配的请求重定向到了另一个域名。

**示例问题配置：**
```nginx
server {
    listen 80;
    server_name aliasai.io www.aliasai.io;
    return 301 https://aliasai.io$request_uri;  # 这会捕获所有未匹配的请求！
}
```

**解决方案：**

**方法 1：添加独立的 agentscan.info 配置（推荐，不影响现有配置）**

```bash
# 1. 创建 agentscan.info 的临时 HTTP 配置
cd /opt/8004scan
sudo cp nginx/temp-http-only.conf /etc/nginx/sites-available/agentscan-temp.conf
sudo ln -s /etc/nginx/sites-available/agentscan-temp.conf /etc/nginx/sites-enabled/

# 2. 测试配置
sudo nginx -t

# 3. 重新加载 Nginx
sudo systemctl reload nginx

# 4. 验证（应该返回 200 OK）
curl -I http://agentscan.info

# 5. 继续申请 SSL 证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 6. 成功后删除临时配置，使用完整配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**方法 2：使用 Certbot standalone 模式（需要临时停止 Nginx）**

如果方法 1 不起作用，可以临时停止 Nginx：

```bash
# 1. 停止 Nginx（会导致所有网站暂时不可用）
sudo systemctl stop nginx

# 2. 使用 standalone 模式申请证书
sudo certbot certonly --standalone \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 3. 启动 Nginx
sudo systemctl start nginx

# 4. 添加完整的 HTTPS 配置
cd /opt/8004scan
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**⚠️ 注意：**方法 2 会导致服务器上所有网站短暂不可用（1-2 分钟）。

### Q2: DNS 已配置但还是解析不到

**原因：**DNS 传播需要时间。

**解决：**
```bash
# 使用不同的 DNS 服务器查询
dig @8.8.8.8 agentscan.info  # Google DNS
dig @1.1.1.1 agentscan.info  # Cloudflare DNS

# 清除本地 DNS 缓存后重试
# Linux:
sudo systemd-resolve --flush-caches

# 等待 10-30 分钟后重试
```

### Q3: 证书申请成功但 HTTPS 访问失败

**检查：**
```bash
# 验证证书文件存在
sudo ls -la /etc/letsencrypt/live/agentscan.info/

# 应该看到：
# - fullchain.pem
# - privkey.pem
# - cert.pem
# - chain.pem

# 检查 Nginx 配置中的证书路径
sudo grep "ssl_certificate" /etc/nginx/sites-enabled/agentscan.info

# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## 推荐方案

对于有多个域名的服务器，推荐使用**方法 A（临时 HTTP 配置）**：
1. ✅ 不影响现有网站运行
2. ✅ 过程清晰可控
3. ✅ 易于调试

## 验证成功

证书申请成功后，应该能够：

```bash
# 1. 访问 HTTPS 网站
curl -I https://agentscan.info

# 2. 检查证书信息
echo | openssl s_client -connect agentscan.info:443 -servername agentscan.info 2>/dev/null | openssl x509 -noout -dates

# 3. 在浏览器中访问
# https://agentscan.info
# 应该看到绿色的锁图标（证书有效）
```

## 获取帮助

如果仍然遇到问题，请提供以下信息：

```bash
# 收集诊断信息
echo "=== DNS 解析 ==="
dig agentscan.info

echo "=== Nginx 配置测试 ==="
sudo nginx -t

echo "=== 启用的站点 ==="
ls -la /etc/nginx/sites-enabled/

echo "=== server_name 配置 ==="
sudo grep -r "server_name" /etc/nginx/sites-enabled/

echo "=== 端口监听 ==="
sudo netstat -tlnp | grep -E ':80|:443'

echo "=== Certbot 日志 ==="
sudo tail -100 /var/log/letsencrypt/letsencrypt.log
```
