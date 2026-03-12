import Cards from './Cards_Cthulhu.ts';
import Utils from '../core/Utils.ts';

/**
 * 深渊商店 - Shop (SAN上限定价系统)
 * 
 * 金钱已被废除。一切以理智上限（或生命上限）为代价。
 * 禁忌等级 I-V 对应 1-5 点 SAN 上限扣减。
 */


declare var game: any;

// 禁忌等级名称
const FORBIDDEN_TIER_NAMES: Record<number, string> = {
    1: '不安之兆',
    2: '诡秘残篇',
    3: '异界低语',
    4: '深渊启示',
    5: '不可名状'
};

// 禁忌等级对应的 SAN 上限代价
const FORBIDDEN_TIER_COST: Record<number, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5
};

var Shop: any = {
    FORBIDDEN_TIER_NAMES,
    FORBIDDEN_TIER_COST,

    // 商店服务（用理智或生命作为代价）
    items: {
        services: [
            {
                id: 'heal',
                type: 'service',
                name: '深渊治愈',
                description: '恢复20点HP（代价：2 SAN上限）',
                price: 2,      // SAN上限代价
                priceType: 'sanMax',
                effect: function (player: any) {
                    if (typeof game !== 'undefined') {
                        game.modifyHP(20);
                    } else {
                        player.hp = Math.min(player.hp + 20, player.maxHp);
                    }
                }
            },
            {
                id: 'sanity_restore',
                type: 'service',
                name: '遗忘仪式',
                description: '恢复15点当前理智（代价：3HP上限）',
                price: 3,
                priceType: 'hpMax',
                effect: function (player: any) {
                    if (typeof game !== 'undefined') {
                        game.modifySanity(15);
                    } else {
                        player.sanity = Math.min(player.sanity + 15, player.maxSanity);
                    }
                }
            },
            {
                id: 'remove_card',
                type: 'service',
                name: '遗忘仪式·弃卡',
                description: '删除一张卡牌，恢复该卡50%的SAN上限代价',
                price: 0,
                priceType: 'free',
                effect: null
            },
            {
                id: 'blood_altar',
                type: 'service',
                name: '献血祭坛',
                description: 'HP上限-10，获得一张禁忌等级III的随机卡牌',
                price: 10,
                priceType: 'hpMax',
                effect: null   // 特殊处理
            }
        ]
    },

    // 生成商店商品
    generateShop: function (playerBadge: string) {
        var shopItems: any[] = [];

        // 按禁忌等级分类卡牌
        var tierCards: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        for (var key in Cards) {
            if (Cards.hasOwnProperty(key)) {
                var card = (Cards as any)[key];
                if (!card.badge || card.badge === playerBadge) {
                    var tier = card.forbiddenTier || 1;
                    if (tier >= 1 && tier <= 5) {
                        tierCards[tier].push({
                            type: 'card',
                            id: key,
                            name: card.name,
                            price: FORBIDDEN_TIER_COST[tier],
                            priceType: 'sanMax',
                            forbiddenTier: tier,
                            tierName: FORBIDDEN_TIER_NAMES[tier],
                            description: card.description
                        });
                    }
                }
            }
        }

        // 随机选择 3-4 张卡牌（倾向低禁忌等级）
        var cardCount = 3 + Math.floor(Math.random() * 2);
        var weightedPools = [
            { tier: 1, weight: 35 },
            { tier: 2, weight: 30 },
            { tier: 3, weight: 20 },
            { tier: 4, weight: 10 },
            { tier: 5, weight: 5 }
        ];

        for (var i = 0; i < cardCount; i++) {
            // 加权随机选择禁忌等级
            var totalWeight = 0;
            for (var w of weightedPools) totalWeight += (tierCards[w.tier].length > 0 ? w.weight : 0);
            if (totalWeight === 0) break;

            var roll = Math.random() * totalWeight;
            var cumulative = 0;
            var selectedTier = 1;
            for (var wp of weightedPools) {
                if (tierCards[wp.tier].length === 0) continue;
                cumulative += wp.weight;
                if (roll <= cumulative) { selectedTier = wp.tier; break; }
            }

            var pool = tierCards[selectedTier];
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
                priceType: service.priceType,
                description: service.description
            });
            availableServices.splice(sIdx, 1);
        }

        return shopItems;
    },

    // 购买商品（SAN上限 或 HP上限 作为代价）
    buyItem: function (player: any, item: any) {
        var priceType = item.priceType || 'sanMax';
        var price = item.price || 0;

        // 检查是否支付得起
        if (priceType === 'sanMax' && player.maxSanity - price < 10) {
            return { success: false, message: '理智上限不足！再这样下去会彻底疯掉...' };
        }
        if (priceType === 'hpMax' && player.maxHp - price < 10) {
            return { success: false, message: '生命上限不足！你的身体承受不住了...' };
        }

        // 支付代价
        if (price > 0) {
            if (typeof game !== 'undefined') {
                if (priceType === 'sanMax') {
                    game.modifyMaxSanity(-price, '深渊商店');
                } else if (priceType === 'hpMax') {
                    game.modifyMaxHP(-price, '献血祭坛');
                }
            } else {
                if (priceType === 'sanMax') {
                    player.maxSanity = Math.max(10, player.maxSanity - price);
                    player.sanity = Math.min(player.sanity, player.maxSanity);
                } else if (priceType === 'hpMax') {
                    player.maxHp = Math.max(10, player.maxHp - price);
                    player.hp = Math.min(player.hp, player.maxHp);
                }
            }
        }

        if (item.type === 'card') {
            if ((Cards as any)[item.id]) {
                var cardCopy = Utils.deepCopy((Cards as any)[item.id]);
                player.deck.push(cardCopy);
                var discardCopy = Utils.deepCopy((Cards as any)[item.id]);
                player.discardPile.push(discardCopy);
                var tierName = FORBIDDEN_TIER_NAMES[item.forbiddenTier || 1];
                return { success: true, message: `获得【${tierName}】卡牌：${item.name}（SAN上限-${price}）` };
            }
        } else if (item.type === 'service') {
            if (item.id === 'remove_card') {
                return { success: true, message: '请选择要遗忘的卡牌', action: 'remove_card' };
            }
            if (item.id === 'blood_altar') {
                // 从禁忌等级III随机选一张卡
                var tier3Cards: string[] = [];
                for (var key in Cards) {
                    var c = (Cards as any)[key];
                    if ((c.forbiddenTier || 1) === 3 && (!c.badge || c.badge === player.badge)) {
                        tier3Cards.push(key);
                    }
                }
                if (tier3Cards.length > 0) {
                    var rKey = tier3Cards[Math.floor(Math.random() * tier3Cards.length)];
                    var cc = Utils.deepCopy((Cards as any)[rKey]);
                    player.deck.push(cc);
                    player.discardPile.push(Utils.deepCopy((Cards as any)[rKey]));
                    return { success: true, message: `献血祭坛！获得【异界低语】：${cc.name}` };
                }
                return { success: false, message: '没有可获取的卡牌' };
            }
            var service = this.getService(item.id);
            if (service && service.effect) {
                service.effect(player);
                return { success: true, message: item.name + ' 生效！' };
            }
        }

        return { success: true, message: '交易完成！' };
    },

    getService: function (id: string) {
        for (var i = 0; i < this.items.services.length; i++) {
            if (this.items.services[i].id === id) {
                return this.items.services[i];
            }
        }
        return null;
    },

    // 获取卡牌遗忘返还的SAN上限
    getForgetRefund: function (card: any): number {
        var tier = card.forbiddenTier || 1;
        var cost = FORBIDDEN_TIER_COST[tier] || 1;
        return Math.floor(cost * 0.5);
    }
};


export default Shop;
