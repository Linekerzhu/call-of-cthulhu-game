/**
 * 调试脚本 - 追踪徽章卡牌问题
 */

// 监控卡组变化
function monitorDeck() {
    if (!window.game || !window.game.state || !window.game.state.player) {
        console.log('游戏未初始化');
        return;
    }
    
    var player = window.game.state.player;
    var deck = player.deck;
    var badge = player.badge;
    
    console.log('=== 卡组诊断 ===');
    console.log('当前徽章:', badge);
    console.log('卡组总数:', deck.length);
    
    var badgeCards = {};
    var noBadgeCards = [];
    
    for (var i = 0; i < deck.length; i++) {
        var card = deck[i];
        if (card.badge) {
            if (!badgeCards[card.badge]) {
                badgeCards[card.badge] = [];
            }
            badgeCards[card.badge].push(card.name);
        } else {
            noBadgeCards.push(card.name);
        }
    }
    
    console.log('\n专属卡牌分布:');
    for (var badgeName in badgeCards) {
        var isCurrentPlayer = badgeName === badge;
        console.log('  ' + badgeName + (isCurrentPlayer ? ' (✓ 当前)' : ' (✗ 不属于你!)') + ':', badgeCards[badgeName]);
    }
    
    console.log('\n中立卡牌:', noBadgeCards.length, '张');
    
    // 检查是否有问题
    var hasError = false;
    for (var badgeName in badgeCards) {
        if (badgeName !== badge) {
            console.error('❌ 错误：卡组中出现了其他徽章的专属卡！');
            hasError = true;
        }
    }
    
    if (!hasError) {
        console.log('✅ 卡组检查通过');
    }
    
    return { badgeCards, noBadgeCards, hasError };
}

// 监控商店商品
function monitorShop() {
    if (!window.Shop) {
        console.log('商店系统未加载');
        return;
    }
    
    var playerBadge = window.game ? window.game.state.player.badge : null;
    console.log('=== 商店诊断 ===');
    console.log('当前徽章:', playerBadge);
    
    var shopItems = window.Shop.generateShop(playerBadge);
    console.log('\n商店商品:');
    for (var i = 0; i < shopItems.length; i++) {
        var item = shopItems[i];
        if (item.type === 'card') {
            var card = window.Cards[item.id];
            var isWrongBadge = card.badge && card.badge !== playerBadge;
            console.log('  ' + item.name + (card.badge ? ' [' + card.badge + ']' : ' [中立]') + (isWrongBadge ? ' ❌ 错误!' : ''));
        }
    }
    
    return shopItems;
}

// 监控奖励卡牌
function monitorRewards() {
    if (!window.game || !window.game.state) {
        console.log('游戏未初始化');
        return;
    }
    
    var playerBadge = window.game.state.player.badge;
    console.log('=== 奖励卡牌诊断 ===');
    console.log('当前徽章:', playerBadge);
    
    // 模拟奖励卡牌生成逻辑
    var commonCards = [];
    var uncommonCards = [];
    var rareCards = [];
    
    for (var key in window.Cards) {
        if (window.Cards.hasOwnProperty(key)) {
            var card = window.Cards[key];
            if (!card.badge || card.badge === playerBadge) {
                if (card.rarity === 'common') commonCards.push(key);
                else if (card.rarity === 'uncommon') uncommonCards.push(key);
                else if (card.rarity === 'rare') rareCards.push(key);
            }
        }
    }
    
    console.log('\n可用奖励卡牌:');
    console.log('  普通:', commonCards.length, '张');
    console.log('  稀有:', uncommonCards.length, '张');
    console.log('  传说:', rareCards.length, '张');
    
    // 检查是否有其他徽章的卡
    var wrongCards = [];
    for (var key in window.Cards) {
        var card = window.Cards[key];
        if (card.badge && card.badge !== playerBadge) {
            wrongCards.push(card.name + '[' + card.badge + ']');
        }
    }
    
    if (wrongCards.length > 0) {
        console.log('\n被正确过滤掉的卡牌:', wrongCards.length, '张');
        console.log('  ', wrongCards.slice(0, 5).join(', ') + (wrongCards.length > 5 ? '...' : ''));
    }
    
    return { commonCards, uncommonCards, rareCards };
}

// 导出到全局
window.debugTools = {
    monitorDeck,
    monitorShop,
    monitorRewards,
    fullCheck: function() {
        console.clear();
        console.log('🔍 完整诊断开始...\n');
        monitorDeck();
        console.log('');
        monitorShop();
        console.log('');
        monitorRewards();
        console.log('\n✅ 诊断完成');
    }
};

console.log('调试工具已加载。使用 debugTools.fullCheck() 运行完整诊断');
