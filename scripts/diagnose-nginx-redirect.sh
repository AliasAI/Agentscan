#!/bin/bash
# Nginx 重定向问题诊断脚本

echo "=========================================="
echo "Nginx 重定向问题诊断"
echo "=========================================="
echo ""

TARGET_DOMAIN="agentscan.info"
REDIRECT_TO="aliasai.io"

echo "问题: $TARGET_DOMAIN 被重定向到 $REDIRECT_TO"
echo ""

# 检查所有 Nginx 配置文件中的重定向规则
echo "1. 查找包含重定向到 $REDIRECT_TO 的配置..."
echo ""

if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "=== 在 sites-enabled 中搜索 ==="
    sudo grep -rn "$REDIRECT_TO" /etc/nginx/sites-enabled/ 2>/dev/null || echo "未找到直接引用"
    echo ""
fi

if [ -d "/etc/nginx/conf.d" ]; then
    echo "=== 在 conf.d 中搜索 ==="
    sudo grep -rn "$REDIRECT_TO" /etc/nginx/conf.d/ 2>/dev/null || echo "未找到直接引用"
    echo ""
fi

# 查找包含 301 重定向的配置
echo "2. 查找所有 301 重定向规则..."
echo ""

if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "=== sites-enabled 中的 301 重定向 ==="
    sudo grep -rn "301" /etc/nginx/sites-enabled/ 2>/dev/null || echo "未找到 301 重定向"
    echo ""
fi

# 查找 default_server 配置
echo "3. 查找 default_server 配置..."
echo ""
sudo grep -rn "default_server" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null || echo "未找到 default_server"
echo ""

# 检查所有 server_name 配置
echo "4. 列出所有 server_name 配置..."
echo ""
if [ -d "/etc/nginx/sites-enabled" ]; then
    for site in /etc/nginx/sites-enabled/*; do
        if [ -f "$site" ]; then
            echo "--- $(basename $site) ---"
            sudo grep -n "server_name" "$site" 2>/dev/null | head -5
            echo ""
        fi
    done
fi

# 列出所有启用的配置文件
echo "5. 所有启用的 Nginx 配置文件..."
echo ""
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

echo ""
echo "=========================================="
echo "诊断建议"
echo "=========================================="
echo ""
echo "可能的原因："
echo "1. 某个配置文件中有明确的 'return 301' 或 'rewrite' 规则"
echo "2. default_server 配置捕获了所有未匹配的域名"
echo "3. 通配符 server_name 配置（如 '_' 或 '*'）"
echo ""
echo "解决方案："
echo "1. 检查上面输出中提到的配置文件"
echo "2. 查找并修改或注释掉导致重定向的规则"
echo "3. 或者在 agentscan.info 的配置中明确指定优先级"
echo ""
echo "下一步："
echo "1. 查看完整的可疑配置文件内容"
echo "2. 备份原配置后修改"
echo "3. 测试配置: sudo nginx -t"
echo "4. 重新加载: sudo systemctl reload nginx"
