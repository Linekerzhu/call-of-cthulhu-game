/**
 * 徽章数据 - Badges (ES5兼容版)
 * MVP包含2个徽章：暴躁鸭、铁壳龟
 */

console.log('📛 Badges.js 开始加载');

var Badges = {
    // ====================
    // 暴躁鸭 - 攻击型徽章
    // ====================
    '暴躁鸭': {
        id: '暴躁鸭',
        name: '暴躁鸭',
        icon: '🦆',
        type: 'attack',
        description: '越打越生气的鸭子，擅长连续攻击',
        passive: '怒气系统：每造成1点伤害获得1点怒气，怒气达到10点时下一张攻击卡伤害翻倍',
        startingCards: ['气鼓鼓', '连环巴掌', '鸭鸭冲击'],
        stats: {
            hpBonus: 0,
            energyBonus: 0
        }
    },
    
    // ====================
    // 铁壳龟 - 防御型徽章
    // ====================
    '铁壳龟': {
        id: '铁壳龟',
        name: '铁壳龟',
        icon: '🐢',
        type: 'defense',
        description: '坚硬的龟壳，擅长防守反击',
        passive: '龟壳守护：每获得8点格挡，下回合开始时自动获得2点格挡',
        startingCards: ['缩壳', '壳击', '铁壁'],
        stats: {
            hpBonus: 10,
            energyBonus: 0
        }
    }
};

// 徽章管理器
var BadgeManager = {
    // 获取徽章列表
    getBadgeList: function() {
        var list = [];
        for (var key in Badges) {
            if (Badges.hasOwnProperty(key)) {
                list.push(Badges[key]);
            }
        }
        return list;
    },
    
    // 获取徽章数据
    getBadge: function(badgeId) {
        return Badges[badgeId] || null;
    },
    
    // 应用徽章效果到玩家
    applyBadge: function(player, badgeId) {
        var badge = this.getBadge(badgeId);
        if (!badge) {
            console.log('❌ 徽章不存在: ' + badgeId);
            return false;
        }
        
        console.log('✅ 应用徽章: ' + badge.name);
        
        // 设置玩家徽章
        player.badge = badgeId;
        
        // 应用属性加成
        if (badge.stats.hpBonus) {
            player.maxHp += badge.stats.hpBonus;
            player.hp += badge.stats.hpBonus;
        }
        if (badge.stats.energyBonus) {
            player.maxEnergy += badge.stats.energyBonus;
        }
        
        // 添加起始卡牌到卡组
        if (badge.startingCards && badge.startingCards.length > 0) {
            for (var i = 0; i < badge.startingCards.length; i++) {
                var cardName = badge.startingCards[i];
                if (Cards[cardName]) {
                    // 创建卡牌副本
                    var cardCopy = {};
                    for (var key in Cards[cardName]) {
                        cardCopy[key] = Cards[cardName][key];
                    }
                    player.deck.push(cardCopy);
                    // 同时添加到抽牌堆（因为giveStartingDeck已经设置了drawPile）
                    if (player.drawPile) {
                        player.drawPile.push(cardCopy);
                    }
                    console.log('   添加徽章卡牌: ' + cardName);
                } else {
                    console.log('   ❌ 卡牌不存在: ' + cardName);
                }
            }
        }
        
        console.log('📊 徽章应用完成，卡组:' + player.deck.length + '张, 抽牌堆:' + (player.drawPile ? player.drawPile.length : 0) + '张');
        
        return true;
    },
    
    // 获取徽章专属卡牌列表
    getBadgeCards: function(badgeId) {
        var badge = this.getBadge(badgeId);
        if (!badge || !badge.startingCards) {
            return [];
        }
        
        var cards = [];
        for (var i = 0; i < badge.startingCards.length; i++) {
            var cardName = badge.startingCards[i];
            if (Cards[cardName]) {
                cards.push(Cards[cardName]);
            }
        }
        return cards;
    }
};

console.log('✅ Badges.js 加载完成');
