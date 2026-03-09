#!/bin/bash

# 深渊召唤 GitHub 推送完整脚本
# 请先编辑此文件，填入您的 GitHub 用户名

# ========== 配置区域 ==========
# 请修改下面的变量为您的 GitHub 用户名
GITHUB_USER="linekerzhu"
GITHUB_EMAIL="linekerzhu@example.com"
REPO_NAME="call-of-cthulhu-game"
# =============================

set -e

echo "🐙 深渊召唤 - GitHub 推送脚本"
echo "=============================="
echo ""

# 检查配置
if [ "$GITHUB_USER" = "YOUR_GITHUB_USERNAME" ]; then
    echo "❌ 请编辑此脚本，将 GITHUB_USER 修改为您的 GitHub 用户名"
    echo "   文件位置: $(pwd)/setup-and-push.sh"
    exit 1
fi

# 检查 Xcode 许可证
echo "🔍 检查 Xcode 许可证..."
if ! git version > /dev/null 2>&1; then
    echo "⚠️  需要先同意 Xcode 许可证"
    echo ""
    echo "请运行以下命令："
    echo "  sudo xcodebuild -license accept"
    echo ""
    echo "或者在终端中运行："
    echo "  sudo xcodebuild -license"
    echo "然后按 'q' 阅读，输入 'agree' 同意"
    exit 1
fi

# 配置 SSH
echo "🔑 配置 SSH..."
eval "$(ssh-agent -s)" > /dev/null 2>&1 || true
ssh-add ~/.ssh/id_ed25519_Cooper 2>/dev/null || true

# 测试 GitHub 连接
echo "🔗 测试 GitHub 连接..."
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -T git@github.com 2>&1 | grep -q "successfully authenticated\|Cooper"; then
    echo "✅ SSH 连接成功"
else
    echo "⚠️  SSH 连接测试失败，但会继续尝试..."
fi

# 进入项目目录
cd "$(dirname "$0")"

echo "📦 初始化 Git 仓库..."
# 初始化 git（如果尚未初始化）
if [ ! -d ".git/objects" ]; then
    git init
    git branch -m main
fi

# 配置 Git 用户信息
echo "⚙️  配置 Git..."
git config user.name "Cooper"
git config user.email "$GITHUB_EMAIL"

# 检查远程仓库
echo "🔗 配置远程仓库..."
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ 远程仓库已配置"
else
    git remote add origin "git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
    echo "✅ 已添加远程仓库"
fi

# 创建 .gitignore（如果不存在）
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# 依赖目录
node_modules/

# 操作系统文件
.DS_Store

# IDE
.vscode/
.idea/

# 日志
*.log
EOF
    echo "✅ 已创建 .gitignore"
fi

# 添加所有文件
echo "📁 添加文件到暂存区..."
git add .

# 检查是否有变更要提交
if git diff --cached --quiet; then
    echo "⚠️  没有新的变更需要提交"
else
    # 提交
    echo "💾 创建提交..."
    git commit -m "v0.2.0: 克苏鲁主题改造完成

- 完成克苏鲁主题改造，添加31张独特卡牌
- 实现三大徽章系统：深渊使者、旧日支配者、黄衣信徒
- 完善SAN值理智系统，6级理智状态
- 添加克苏鲁风格敌人：深渊领主、深潜者、修格斯等
- 创建完整项目文档：README、LICENSE、审核报告
- 准备GitHub发布"
    echo "✅ 提交完成"
fi

# 推送到 GitHub
echo ""
echo "🚀 推送到 GitHub..."
echo "=============================="
if git push -u origin main 2>&1; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🌐 您的仓库地址:"
    echo "   https://github.com/${GITHUB_USER}/${REPO_NAME}"
    echo ""
    echo "📖 启用 GitHub Pages 在线游玩:"
    echo "   1. 访问 https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
    echo "   2. Source 选择 'Deploy from a branch'"
    echo "   3. Branch 选择 'main'，文件夹选择 '/ (root)'"
    echo "   4. 点击 Save"
    echo "   5. 等待几分钟后访问:"
    echo "      https://${GITHUB_USER}.github.io/${REPO_NAME}/src/"
    echo ""
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因:"
    echo "   1. GitHub 仓库不存在 - 请先创建: https://github.com/new"
    echo "   2. SSH 密钥未添加到 GitHub"
    echo "   3. 网络连接问题"
    echo ""
    echo "请检查以上问题后重试"
    exit 1
fi
