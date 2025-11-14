# 快速修复：agentscan.info 被重定向到 aliasai.io

## 问题描述

执行 `curl -I http://agentscan.info` 返回：
```
HTTP/1.1 301 Moved Permanently
Location: https://aliasai.io/
```

## 问题原因

现有的 Nginx 配置 `/etc/nginx/sites-enabled/empath` 中的 HTTP server block 会捕获所有未匹配的请求，并重定向到 `https://aliasai.io`。

当 Nginx 收到对 `agentscan.info` 的请求时，由于没有匹配的 server block，它会使用第一个 server block（aliasai.io 的配置），然后执行重定向。

## 解决方案（两种方法）

### 方法 1：添加 agentscan.info 配置（推荐）

**优点：** 不影响现有的 aliasai.io 网站

**步骤：**

```bash
# 1. 进入项目目录
cd /opt/8004scan

# 2. 创建 certbot 验证目录
sudo mkdir -p /var/www/certbot

# 3. 添加临时 HTTP 配置（用于 SSL 验证）
sudo cp nginx/temp-http-only.conf /etc/nginx/sites-available/agentscan-temp.conf

# 4. 启用配置
sudo ln -s /etc/nginx/sites-available/agentscan-temp.conf /etc/nginx/sites-enabled/

# 5. 测试配置
sudo nginx -t

# 6. 重新加载 Nginx
sudo systemctl reload nginx

# 7. 验证是否修复（应该返回 200 OK，不再是 301）
curl -I http://agentscan.info

# 如果看到 "HTTP/1.1 200 OK"，说明配置生效！

# 8. 申请 SSL 证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d agentscan.info \
  -d www.agentscan.info \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 9. 证书申请成功后，删除临时配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf

# 10. 使用完整的生产配置
sudo cp nginx/production-nginx.conf /etc/nginx/sites-available/agentscan.info
sudo ln -s /etc/nginx/sites-available/agentscan.info /etc/nginx/sites-enabled/

# 11. 测试并重新加载
sudo nginx -t
sudo systemctl reload nginx

# 12. 启动 Docker 容器
docker-compose up -d --build

# 13. 验证部署
curl -I https://agentscan.info
```

### 方法 2：Standalone 模式（简单但会影响现有网站）

**优点：** 操作简单
**缺点：** 需要临时停止 Nginx，aliasai.io 会短暂不可用（1-2 分钟）

**步骤：**

```bash
# 1. 停止 Nginx（aliasai.io 将暂时不可用）
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

# 5. 测试并重新加载
sudo nginx -t
sudo systemctl reload nginx

# 6. 启动 Docker 容器
docker-compose up -d --build

# 7. 验证部署
curl -I https://agentscan.info
```

## 工作原理说明

### 为什么会发生重定向？

当前的 Nginx 配置结构：
```
/etc/nginx/sites-enabled/
  └── empath  (配置了 aliasai.io)
```

当请求到达时：
1. 请求: `GET http://agentscan.info/`
2. Nginx 查找匹配 `server_name agentscan.info` 的 server block
3. 没找到匹配的配置
4. 使用第一个 server block（empath 配置）
5. 执行 `return 301 https://aliasai.io$request_uri;`
6. 结果：被重定向到 aliasai.io

### 添加配置后如何工作？

添加配置后的结构：
```
/etc/nginx/sites-enabled/
  ├── empath             (配置了 aliasai.io)
  └── agentscan-temp.conf (配置了 agentscan.info)
```

当请求到达时：
1. 请求: `GET http://agentscan.info/`
2. Nginx 查找匹配 `server_name agentscan.info` 的 server block
3. **找到了！** 使用 agentscan-temp.conf 的配置
4. 返回正常响应（用于 SSL 验证）
5. 结果：不再重定向

### 多个 server block 监听同一端口？

**是的！这是完全正常和推荐的做法。**

```nginx
# 第一个 server block
server {
    listen 80;
    server_name aliasai.io www.aliasai.io;
    # ...
}

# 第二个 server block（可以监听同一端口）
server {
    listen 80;
    server_name agentscan.info www.agentscan.info;
    # ...
}
```

Nginx 会根据 `Host` 头（域名）来选择对应的 server block。

## 验证步骤

### 1. 验证 HTTP 访问正常
```bash
curl -I http://agentscan.info
# 期望: HTTP/1.1 200 OK
```

### 2. 验证 SSL 证书申请成功
```bash
sudo certbot certificates
# 应该看到 agentscan.info 的证书
```

### 3. 验证 HTTPS 访问正常
```bash
curl -I https://agentscan.info
# 期望: HTTP/2 200 OK
```

### 4. 验证证书详情
```bash
echo | openssl s_client -connect agentscan.info:443 -servername agentscan.info 2>/dev/null | openssl x509 -noout -dates
# 应该显示证书的有效期
```

### 5. 验证 Docker 容器运行
```bash
docker-compose ps
# 应该看到 frontend 和 backend 都在运行
```

### 6. 验证 aliasai.io 仍然正常
```bash
curl -I https://aliasai.io
# 确保现有网站没有受影响
```

## 常见问题

### Q: 为什么不直接修改 empath 配置？

**A:** 修改现有配置可能会影响 aliasai.io 的运行，而且需要深入理解现有配置的逻辑。添加新配置是更安全的方式。

### Q: 两个 server block 监听同一端口不会冲突吗？

**A:** 不会！这是 Nginx 的标准用法。Nginx 会根据 `Host` 头自动路由请求。

### Q: 如果方法 1 不工作怎么办？

**A:** 使用方法 2（standalone 模式）。虽然会导致短暂停机，但更可靠。

### Q: 如何回滚？

**A:**
```bash
# 删除 agentscan 配置
sudo rm /etc/nginx/sites-enabled/agentscan-temp.conf
sudo rm /etc/nginx/sites-enabled/agentscan.info
sudo rm /etc/nginx/sites-available/agentscan-temp.conf
sudo rm /etc/nginx/sites-available/agentscan.info

# 重新加载 Nginx
sudo nginx -t
sudo systemctl reload nginx

# 删除证书（可选）
sudo certbot delete --cert-name agentscan.info
```

## 总结

推荐使用**方法 1**，因为：
- ✅ 不影响现有的 aliasai.io 网站
- ✅ 配置独立，易于管理
- ✅ 符合 Nginx 多域名最佳实践
- ✅ 可以随时回滚

现在可以开始执行方法 1 的步骤了！
