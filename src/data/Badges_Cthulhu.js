/**
 * 克苏鲁风格徽章数据 - Badges_Cthulhu
 * 🐙 疯狂的古神信徒
 */

console.log('🐙 Badges_Cthulhu.js 开始加载');

var Badges = {
    // ====================
    // 深渊使者 - 疯狂攻击型
    // ====================
    '深渊使者': {
        id: '深渊使者',
        name: '深渊使者',
        icon: '🐙',
        type: 'attack',
        description: '你已经聆听过深渊的低语，获得了触手的力量',
        passive: '疯狂值系统：每造成1点伤害获得1点疯狂值，10点疯狂值时下一次攻击翻倍并获得触手缠绕效果',
        startingCards: ['触手蔓延', '疯狂鞭挞', '不可名状之击'],
        stats: {
            hpBonus: 0,
            energyBonus: 0,
            sanity: 50  // 理智值上限
        }
    },
    
    // ====================
    // 旧日支配者 - 古神防御型
    // ====================
    '旧日支配者': {
        id: '旧日支配者',
        name: '旧日支配者',
        icon: '👁️',
        type: 'defense',
        description: '你侍奉着远古的存在，获得了古神的庇护',
        passive: '古老符文：每获得8点格挡，下回合开始时自动获得2点格挡并反弹2点伤害',
        startingCards: ['古老护盾', '符文反击', '绝对屏障'],
        stats: {
            hpBonus: 10,
            energyBonus: 0,
            sanity: 60
        }
    },
    
    // ====================
    // 黄衣信徒 - 诅咒控制型（新增）
    // ====================
    '黄衣信徒': {
        id: '黄衣信徒',
        name: '黄衣信徒',
        icon: '🎭',
        type: 'control',
        description: '哈斯塔的信徒，擅长诅咒与控制',
        passive: '疯狂诅咒：敌人每回合开始时有20%几率陷入恐惧，跳过行动',
        startingCards: ['黄衣之王的印记', '死灵之书残页', '疯狂漩涡'],
        stats: {
            hpBonus: 5,
            energyBonus: 1,
            sanity: 45
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
        if (badge.stats.sanity) {
            player.maxSanity = badge.stats.sanity;
            player.sanity = badge.stats.sanity;
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
                    console.log('   添加徽章卡牌: ' + cardName);
                } else {
                    console.log('   ❌ 卡牌不存在: ' + cardName);
                }
            }
        }
        
        console.log('📊 徽章应用完成，当前卡组: ' + player.deck.length + '张');
        
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

console.log('✅ Badges_Cthulhu.js 加载完成');
