#!/bin/bash

# Docker 环境变量检查脚本
# 检查所有必需的环境变量是否已配置

set -e

echo "🔍 检查 Docker 部署环境..."
echo ""

# 进入项目根目录
cd "$(dirname "$0")/.."

# 检查 backend/.env 文件
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env 文件不存在"
    echo "   请复制 backend/.env.example 并配置环境变量"
    exit 1
else
    echo "✅ backend/.env 文件存在"
fi

# 检查 SEPOLIA_RPC_URL
if grep -q "SEPOLIA_RPC_URL=" backend/.env; then
    if grep -q "SEPOLIA_RPC_URL=YOUR_NEW_RPC_URL_HERE" backend/.env || grep -q 'SEPOLIA_RPC_URL=""' backend/.env; then
        echo "❌ SEPOLIA_RPC_URL 未正确配置"
        echo "   当前值为占位符，请配置真实的 RPC URL"
        exit 1
    else
        echo "✅ SEPOLIA_RPC_URL 已配置"
    fi
else
    echo "❌ SEPOLIA_RPC_URL 未设置"
    echo "   请在 backend/.env 中添加 SEPOLIA_RPC_URL"
    exit 1
fi

# 检查 DATABASE_URL（可选，因为有默认值）
if grep -q "DATABASE_URL=" backend/.env; then
    echo "✅ DATABASE_URL 已配置"
else
    echo "⚠️  DATABASE_URL 未设置（将使用默认值：sqlite:///./8004scan.db）"
fi

echo ""
echo "✅ 环境检查通过！可以开始部署"
echo ""
