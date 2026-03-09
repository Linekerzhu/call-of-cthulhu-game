#!/bin/bash
# 同步本地代码到服务器

SERVER="root@111.229.65.135"
REMOTE_PATH="/opt/html5-games/roguelike.html"
LOCAL_FILE="$HOME/projects/shadow-tower/src/index.html"

echo "🚀 正在同步到服务器..."
echo "📂 本地: $LOCAL_FILE"
echo "🌐 服务器: $SERVER:$REMOTE_PATH"
echo ""

# 使用 scp 同步
scp -i ~/.ssh/Cooperzxy "$LOCAL_FILE" "$SERVER:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 同步成功!"
    echo "🎮 游戏地址: http://$SERVER/roguelike.html"
else
    echo ""
    echo "❌ 同步失败"
    exit 1
fi
