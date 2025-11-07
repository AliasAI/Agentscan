#!/bin/bash
# Nginx 多域名配置检查脚本

echo "=========================================="
echo "Nginx 多域名配置检查"
echo "=========================================="
echo ""

# 检查 nginx 是否安装
echo "1. 检查 Nginx 安装状态..."
if command -v nginx &> /dev/null; then
    echo "   ✓ Nginx 已安装"
    nginx -v 2>&1
else
    echo "   ✗ Nginx 未安装"
    exit 1
fi
echo ""

# 检查 nginx 服务状态
echo "2. 检查 Nginx 服务状态..."
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx 服务正在运行"
else
    echo "   ✗ Nginx 服务未运行"
    echo "   提示: 运行 'sudo systemctl start nginx' 启动服务"
fi
echo ""

# 检查端口监听
echo "3. 检查端口监听情况..."
echo "   监听 80 端口的进程:"
sudo netstat -tlnp 2>/dev/null | grep ':80 ' || echo "   无进程监听 80 端口"
echo ""
echo "   监听 443 端口的进程:"
sudo netstat -tlnp 2>/dev/null | grep ':443 ' || echo "   无进程监听 443 端口"
echo ""

# 列出所有启用的站点
echo "4. 列出所有启用的站点配置..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    SITES=$(ls -1 /etc/nginx/sites-enabled/ 2>/dev/null)
    if [ -n "$SITES" ]; then
        echo "   已启用的站点:"
        ls -1 /etc/nginx/sites-enabled/ | sed 's/^/   - /'
    else
        echo "   无启用的站点"
    fi
else
    echo "   /etc/nginx/sites-enabled 目录不存在"
fi
echo ""

# 检查 server_name 配置
echo "5. 检查所有站点的 server_name 配置..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "   域名配置列表:"
    for site in /etc/nginx/sites-enabled/*; do
        if [ -f "$site" ]; then
            sitename=$(basename "$site")
            domains=$(grep -E "^\s*server_name" "$site" 2>/dev/null | sed 's/server_name//g' | sed 's/;//g' | tr -d '\n')
            if [ -n "$domains" ]; then
                echo "   - $sitename: $domains"
            fi
        fi
    done
else
    echo "   /etc/nginx/sites-enabled 目录不存在"
fi
echo ""

# 测试 nginx 配置
echo "6. 测试 Nginx 配置文件语法..."
if sudo nginx -t 2>&1; then
    echo "   ✓ 配置文件语法正确"
else
    echo "   ✗ 配置文件存在语法错误"
fi
echo ""

# 检查 SSL 证书
echo "7. 检查 SSL 证书..."
if command -v certbot &> /dev/null; then
    echo "   ✓ Certbot 已安装"
    echo ""
    echo "   已安装的证书:"
    sudo certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains|Expiry Date" | sed 's/^/   /'
else
    echo "   ✗ Certbot 未安装"
    echo "   提示: 运行 'sudo apt install certbot python3-certbot-nginx' 安装"
fi
echo ""

# 检查 Docker 容器端口
echo "8. 检查 Docker 容器端口占用..."
if command -v docker &> /dev/null; then
    echo "   检查端口 3000 (前端):"
    sudo netstat -tlnp 2>/dev/null | grep ':3000 ' || echo "   端口 3000 未被占用"

    echo "   检查端口 8001 (后端):"
    sudo netstat -tlnp 2>/dev/null | grep ':8001 ' || echo "   端口 8001 未被占用"
else
    echo "   ✗ Docker 未安装"
fi
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
echo ""
echo "提示："
echo "- 多个域名可以共享同一个 80/443 端口"
echo "- Nginx 通过 server_name 来区分不同域名"
echo "- 确保每个站点的 server_name 不要重复"
echo "- 修改配置后记得运行 'sudo nginx -t' 测试"
echo "- 使用 'sudo systemctl reload nginx' 重新加载配置"
