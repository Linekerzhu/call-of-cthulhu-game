#!/bin/bash

# 深渊召唤 - GitHub 推送脚本
# 使用 Cooper SSH 密钥

set -e

echo "🐙 深渊召唤 GitHub 推送脚本"
echo "============================"

# 配置
REPO_NAME="call-of-cthulhu-game"
GITHUB_USER="YOUR_GITHUB_USERNAME"  # 请修改为您的GitHub用户名

# 检查是否修改了用户名
if [ "$GITHUB_USER" = "YOUR_GITHUB_USERNAME" ]; then
    echo "❌ 错误: 请先修改脚本中的 GITHUB_USER 变量为您的GitHub用户名"
    exit 1
fi

# 启动 SSH agent 并添加密钥
echo "🔑 配置 SSH 密钥..."
eval "$(ssh-agent -s)" > /dev/null
ssh-add ~/.ssh/id_ed25519_Cooper 2>/dev/null || true

# 测试 SSH 连接
echo "🔗 测试 GitHub 连接..."
ssh -o StrictHostKeyChecking=no -T git@github.com 2>&1 || true

# 进入项目目录
cd "$(dirname "$0")"

# 初始化 Git（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git branch -m main
fi

# 配置 Git 用户信息（如果尚未配置）
if ! git config user.name > /dev/null; then
    git config user.name "Cooper"
    echo "✅ 已设置 Git 用户名: Cooper"
fi

if ! git config user.email > /dev/null; then
    git config user.email "cooper@example.com"
    echo "✅ 已设置 Git 邮箱: cooper@example.com"
fi

# 添加远程仓库（如果不存在）
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 添加远程仓库..."
    git remote add origin "git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
fi

# 添加所有文件
echo "📁 添加文件到暂存区..."
git add .

# 提交
echo "💾 创建提交..."
git commit -m "v0.2.0: 克苏鲁主题改造完成，添加完整文档

- 完成克苏鲁主题改造
- 添加31张独特卡牌
- 实现三大徽章系统
- 完善SAN值理智系统
- 添加完整项目文档
- 准备GitHub发布" || echo "⚠️ 没有需要提交的新文件"

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "✅ 推送完成！"
echo "🌐 访问地址: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""
echo "📖 下一步建议:"
echo "   1. 在 GitHub 启用 GitHub Pages"
echo "   2. 设置分支为 'main'"
echo "   3. 选择 '/ (root)' 作为发布源"
echo ""
