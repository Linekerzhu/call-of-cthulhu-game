/**
 * 深渊召唤 - 游戏入口 (ES Module)
 */

import Game from './core/Game.ts';
import Cards from './data/Cards_Cthulhu.ts';

// 全局暴露（便于浏览器控制台调试）
var game = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {

    // 检查 Cards 是否定义
    if (typeof Cards === 'undefined') {
        console.error('❌ Cards 未定义！');
        alert('错误：Cards 未定义，请检查控制台');
        return;
    }

    // 初始化游戏
    try {
        game = new Game();
        (window as any).game = game; // 暴露到全局方便调试
    } catch (e) {
        console.error('❌ Game 实例创建失败:', e);
        alert('错误：' + e.message);
        return;
    }

    // 绑定UI事件
    bindUIEvents();

    // 显示标题屏幕
    game.showScreen('title');

});

// 绑定UI事件
function bindUIEvents() {

    var btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', function () {
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
        btnEndTurn.addEventListener('click', function () {
            // 印章动画
            btnEndTurn!.classList.remove('stamping');
            void btnEndTurn!.offsetWidth;
            btnEndTurn!.classList.add('stamping');
            setTimeout(() => btnEndTurn!.classList.remove('stamping'), 500);

            if (game) game.endTurn();
        });
    }

    // 牌库查看按钮 - 战斗界面
    var btnViewDeckCombat = document.getElementById('btn-view-deck');
    if (btnViewDeckCombat) {
        btnViewDeckCombat.addEventListener('click', function () {
            if (game) game.showDeckViewer('combat');
        });
    }

    // 牌库查看按钮 - 地图界面
    var btnViewDeckMap = document.getElementById('btn-view-deck-map');
    if (btnViewDeckMap) {
        btnViewDeckMap.addEventListener('click', function () {
            if (game) game.showDeckViewer('map');
        });
    }

    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', function () {
            if (game) game.restartGame();
        });
    }

    var btnMenu = document.getElementById('btn-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', function () {
            if (game) game.showScreen('title');
        });
    }

    // === 休息站按钮 ===
    var restHeal = document.getElementById('rest-heal');
    if (restHeal) {
        restHeal.addEventListener('click', function () {
            if (game) game.restHeal();
        });
    }
    var restSanity = document.getElementById('rest-sanity');
    if (restSanity) {
        restSanity.addEventListener('click', function () {
            if (game) game.restSanity();
        });
    }
    var restUpgrade = document.getElementById('rest-upgrade');
    if (restUpgrade) {
        restUpgrade.addEventListener('click', function () {
            if (game) game.restUpgrade();
        });
    }
    var btnLeaveRest = document.getElementById('btn-leave-rest');
    if (btnLeaveRest) {
        btnLeaveRest.addEventListener('click', function () {
            if (game) game.leaveRest();
        });
    }
    var btnViewDeckRest = document.getElementById('btn-view-deck-rest');
    if (btnViewDeckRest) {
        btnViewDeckRest.addEventListener('click', function () {
            if (game) game.showDeckViewer('rest');
        });
    }

    // === 奖励屏幕按钮 ===
    var btnSkipReward = document.getElementById('btn-skip-reward');
    if (btnSkipReward) {
        btnSkipReward.addEventListener('click', function () {
            if (game) game.skipReward();
        });
    }

    // === 商店按钮 ===
    var btnViewDeckShop = document.getElementById('btn-view-deck-shop');
    if (btnViewDeckShop) {
        btnViewDeckShop.addEventListener('click', function () {
            if (game) game.showDeckViewer('shop');
        });
    }
    var btnLeaveShop = document.getElementById('btn-leave-shop');
    if (btnLeaveShop) {
        btnLeaveShop.addEventListener('click', function () {
            if (game) game.leaveShop();
        });
    }

    // === 牌库查看器按钮 ===
    var btnCloseDeck = document.getElementById('btn-close-deck');
    if (btnCloseDeck) {
        btnCloseDeck.addEventListener('click', function () {
            if (game) game.closeDeckViewer();
        });
    }

}
