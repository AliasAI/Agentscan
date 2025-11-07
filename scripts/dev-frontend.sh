#!/bin/bash

# 前端开发服务器启动脚本

set -e

echo "启动前端开发服务器..."

cd "$(dirname "$0")/../frontend"

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
  echo "依赖未安装，正在安装..."
  npm install
fi

# 启动开发服务器
echo "启动 Next.js 开发服务器..."
npm run dev
