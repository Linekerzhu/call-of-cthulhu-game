/**
 * 商店系统 - Shop (ES5兼容版)
 */

console.log('🛒 Shop.js 开始加载');

var Shop = {
    // 商店商品类型
    items: {
        // 卡牌商品 - 克苏鲁版本
        cards: [
            { id: '疯狂挥击', type: 'card', price: 50, rarity: 'common' },
            { id: '理智屏障', type: 'card', price: 50, rarity: 'common' },
            { id: '古神低语', type: 'card', price: 80, rarity: 'uncommon' },
            { id: '疯狂之源', type: 'card', price: 60, rarity: 'common' }
        ],
        
        // 服务商品
        services: [
            { id: 'heal', type: 'service', name: '恢复生命', description: '恢复20点HP', price: 30, effect: function(player) { player.hp = Math.min(player.hp + 20, player.maxHp); } },
            { id: 'sanity', type: 'service', name: '恢复理智', description: '恢复15点理智值', price: 40, effect: function(player) { player.sanity = Math.min(player.sanity + 15, player.maxSanity); } },
            { id: 'remove_card', type: 'service', name: '删除卡牌', description: '从卡组中删除一张卡牌', price: 75, effect: null },
            { id: 'max_hp', type: 'service', name: '最大生命+5', description: '最大HP+5，当前HP+5', price: 100, effect: function(player) { player.maxHp += 5; player.hp += 5; } }
        ]
    },
    
    // 生成商店商品
    generateShop: function(playerBadge) {
        var shopItems = [];
        
        // 从所有卡牌中筛选可用卡牌
        var commonCards = [];
        var uncommonCards = [];
        
        for (var key in Cards) {
            if (Cards.hasOwnProperty(key)) {
                var card = Cards[key];
                // 检查徽章限制
                if (!card.badge || card.badge === playerBadge) {
                    if (card.rarity === 'common' || card.rarity === 'uncommon') {
                        var price = card.rarity === 'common' ? 50 : 80;
                        if (card.rarity === 'uncommon') price = 80;
                        if (card.rarity === 'rare') price = 120;
                        
                        if (card.rarity === 'common') {
                            commonCards.push({
                                type: 'card',
                                id: key,
                                name: card.name,
                                price: price,
                                description: card.description
                            });
                        } else if (card.rarity === 'uncommon') {
                            uncommonCards.push({
                                type: 'card',
                                id: key,
                                name: card.name,
                                price: price,
                                description: card.description
                            });
                        }
                    }
                }
            }
        }
        
        // 随机选择2-3张卡牌
        var cardCount = 2 + Math.floor(Math.random() * 2);
        
        for (var i = 0; i < cardCount; i++) {
            var pool = Math.random() < 0.6 && commonCards.length > 0 ? commonCards : uncommonCards;
            if (pool.length === 0) pool = commonCards.length > 0 ? commonCards : uncommonCards;
            
            if (pool.length > 0) {
                var idx = Math.floor(Math.random() * pool.length);
                shopItems.push(pool[idx]);
                pool.splice(idx, 1);
            }
        }
        
        // 随机选择1-2个服务
        var serviceCount = 1 + Math.floor(Math.random() * 2);
        var availableServices = this.items.services.slice();
        
        for (var j = 0; j < serviceCount && availableServices.length > 0; j++) {
            var sIdx = Math.floor(Math.random() * availableServices.length);
            var service = availableServices[sIdx];
            shopItems.push({
                type: 'service',
                id: service.id,
                name: service.name,
                price: service.price,
                description: service.description
            });
            availableServices.splice(sIdx, 1);
        }
        
        return shopItems;
    },
    
    // 购买商品
    buyItem: function(player, item) {
        if (player.gold < item.price) {
            return { success: false, message: '金币不足！' };
        }
        
        player.gold -= item.price;
        
        if (item.type === 'card') {
            // 添加卡牌到卡组
            if (Cards[item.id]) {
                var cardCopy = {};
                for (var key in Cards[item.id]) {
                    cardCopy[key] = Cards[item.id][key];
                }
                player.deck.push(cardCopy);
                // 购买的卡牌进入弃牌堆，这样下次洗牌时可以抽到
                player.discardPile.push(cardCopy);
                return { success: true, message: '获得卡牌：' + item.name };
            }
        } else if (item.type === 'service') {
            // 执行服务效果
            var service = this.getService(item.id);
            if (service && service.effect) {
                service.effect(player);
                return { success: true, message: item.name + ' 生效！' };
            }
        }
        
        return { success: true, message: '购买成功！' };
    },
    
    // 获取服务定义
    getService: function(id) {
        for (var i = 0; i < this.items.services.length; i++) {
            if (this.items.services[i].id === id) {
                return this.items.services[i];
            }
        }
        return null;
    }
};

console.log('✅ Shop.js 加载完成');
