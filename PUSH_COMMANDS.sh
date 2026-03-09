#!/bin/bash
# 深渊召唤 GitHub 推送命令
# 请按顺序执行以下命令

echo "========== 步骤 1: 同意 Xcode 许可证 =========="
echo "请先运行: sudo xcodebuild -license accept"
echo ""
read -p "按 Enter 键继续 (同意许可证后)..."

echo ""
echo "========== 步骤 2: 配置 SSH =========="
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_Cooper
echo "✅ SSH 配置完成"

echo ""
echo "========== 步骤 3: 初始化 Git =========="
cd /Users/zhuxingyi/projects/shadow-tower
git init
git branch -m main
git config user.name "Cooper"
git config user.email "linekerzhu@example.com"
echo "✅ Git 初始化完成"

echo ""
echo "========== 步骤 4: 添加远程仓库 =========="
git remote add origin git@github.com:linekerzhu/call-of-cthulhu-game.git
echo "✅ 远程仓库配置完成"

echo ""
echo "========== 步骤 5: 提交代码 =========="
git add .
git commit -m "v0.2.0: 克苏鲁主题改造完成

- 完成克苏鲁主题改造，添加31张独特卡牌
- 实现三大徽章系统：深渊使者、旧日支配者、黄衣信徒
- 完善SAN值理智系统，6级理智状态
- 添加克苏鲁风格敌人：深渊领主、深潜者、修格斯等
- 创建完整项目文档：README、LICENSE、审核报告"
echo "✅ 提交完成"

echo ""
echo "========== 步骤 6: 推送到 GitHub =========="
git push -u origin main
echo "✅ 推送完成"

echo ""
echo "🎉 全部完成！访问: https://github.com/linekerzhu/call-of-cthulhu-game"
