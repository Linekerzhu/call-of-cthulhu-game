#!/bin/bash
# 暗影尖塔 - 开发服务器启动脚本

echo "🏰 暗影尖塔开发服务器"
echo "======================"

# 进入项目目录
cd "$(dirname "$0")/src"

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "🐍 使用 Python 3 启动服务器..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "🐍 使用 Python 启动服务器..."
    python -m http.server 8080
else
    echo "❌ 未找到 Python，请安装 Python 3"
    exit 1
fi
