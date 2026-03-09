/**
 * 暗影尖塔 - 游戏入口 (Safari 兼容版)
 */

// 全局变量
var game = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 暗影尖塔 - 初始化开始');
    
    // 检查 Cards 是否定义
    if (typeof Cards === 'undefined') {
        console.error('❌ Cards 未定义！');
        alert('错误：Cards 未定义，请检查控制台');
        return;
    }
    console.log('✅ Cards 已定义');
    
    // 初始化游戏
    try {
        game = new Game();
        console.log('✅ Game 实例创建成功');
    } catch (e) {
        console.error('❌ Game 实例创建失败:', e);
        alert('错误：' + e.message);
        return;
    }
    
    // 绑定UI事件
    bindUIEvents();
    
    // 显示标题屏幕
    game.showScreen('title');
    
    console.log('✅ 游戏初始化完成');
});

// 绑定UI事件
function bindUIEvents() {
    console.log('🔧 绑定UI事件');
    
    var btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', function() {
            console.log('🎯 点击开始游戏');
            if (game && game.startGame) {
                game.startGame();
            } else {
                console.error('❌ game 未定义');
            }
        });
    } else {
        console.error('❌ 未找到开始游戏按钮');
    }
    
    var btnEndTurn = document.getElementById('btn-end-turn');
    if (btnEndTurn) {
        btnEndTurn.addEventListener('click', function() {
            console.log('⏹️ 结束回合');
            if (game) game.endTurn();
        });
    }
    
    // 牌库查看按钮 - 战斗界面
    var btnViewDeckCombat = document.getElementById('btn-view-deck');
    if (btnViewDeckCombat) {
        btnViewDeckCombat.addEventListener('click', function() {
            console.log('🎴 战斗中查看牌库');
            if (game) game.showDeckViewer('combat');
        });
    }
    
    // 牌库查看按钮 - 地图界面
    var btnViewDeckMap = document.getElementById('btn-view-deck-map');
    if (btnViewDeckMap) {
        btnViewDeckMap.addEventListener('click', function() {
            console.log('🎴 地图中查看牌库');
            if (game) game.showDeckViewer('map');
        });
    }
    
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', function() {
            console.log('🔄 重新开始');
            if (game) game.restartGame();
        });
    }
    
    var btnMenu = document.getElementById('btn-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', function() {
            console.log('📋 返回主菜单');
            if (game) game.showScreen('title');
        });
    }
    
    console.log('✅ UI事件绑定完成');
}

// 工具函数
var Utils = {
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomChoice: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    shuffle: function(array) {
        var newArray = array.slice();
        for (var i = newArray.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = newArray[i];
            newArray[i] = newArray[j];
            newArray[j] = temp;
        }
        return newArray;
    },
    
    manhattanDistance: function(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    },
    
    sleep: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }
};
