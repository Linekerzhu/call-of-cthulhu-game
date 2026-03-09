/**
 * 卡牌数据 - Cards
 */

console.log('📦 Cards.js 开始加载');

var Cards = {
    // ====================
    // 基础卡
    // ====================
    
    '大嘴巴子': {
        name: '大嘴巴子',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        damage: 6,
        range: 1,
        description: '造成6点伤害',
        upgrade: {
            damage: 9,
            description: '造成9点伤害'
        }
    },
    
    '抱头蹲': {
        name: '抱头蹲',
        cost: 1,
        type: 'defense',
        rarity: 'basic',
        block: 5,
        description: '获得5点格挡',
        upgrade: {
            block: 8,
            description: '获得8点格挡'
        }
    },
    
    '溜了溜了': {
        name: '溜了溜了',
        cost: 1,
        type: 'move',
        rarity: 'basic',
        movement: 2,  // 恢复2点移动力
        description: '恢复2点移动力',
        upgrade: {
            movement: 3,
            description: '恢复3点移动力'
        }
    },
    
    '脑白金': {
        name: '脑白金',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        heal: 6,
        consumable: true,
        description: '恢复6点生命（消耗品）',
        upgrade: {
            heal: 9,
            description: '恢复9点生命（消耗品）'
        }
    },
    
    '零花钱': {
        name: '零花钱',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        energy: 1,
        consumable: true,
        description: '获得1点能量（消耗品）',
        upgrade: {
            energy: 2,
            description: '获得2点能量（消耗品）'
        }
    },
    
    '来打我呀': {
        name: '来打我呀',
        cost: 1,
        type: 'skill',
        rarity: 'basic',
        description: '嘲讽，敌人下回合必打你',
        upgrade: {
            description: '嘲讽，获得5点格挡'
        }
    },
    
    // ====================
    // 暴躁鸭徽章卡
    // ====================
    
    '气鼓鼓': {
        name: '气鼓鼓',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        badge: '暴躁鸭',
        description: '本回合每打出一张攻击卡，该卡伤害+1',
        upgrade: {
            description: '本回合每打出一张攻击卡，该卡伤害+2'
        }
    },
    
    '连环巴掌': {
        name: '连环巴掌',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        badge: '暴躁鸭',
        damage: 4,
        range: 1,
        description: '造成4点伤害，本回合已打出2张卡则抽1张',
        upgrade: {
            damage: 5,
            description: '造成5点伤害，本回合已打出2张卡抽2张'
        }
    },
    
    '抓狂': {
        name: '抓狂',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        badge: '暴躁鸭',
        description: '本回合所有攻击卡费用变为0',
        upgrade: {
            description: '本回合所有攻击卡费用变为0，获得3力量'
        }
    },
    
    '鸭鸭冲击': {
        name: '鸭鸭冲击',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        badge: '暴躁鸭',
        damage: 8,
        range: 1,
        selfDamage: 3,
        description: '造成8点伤害，失去3HP（专属）',
        upgrade: {
            damage: 12,
            description: '造成12点伤害，失去3HP（专属）'
        }
    },
    
    '愤怒啄击': {
        name: '愤怒啄击',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        badge: '暴躁鸭',
        selfDamage: 5,
        energyGain: 2,
        description: '失去5HP，获得2能量（专属）',
        upgrade: {
            energyGain: 3,
            description: '失去5HP，获得3能量（专属）'
        }
    },
    
    '暴走旋风': {
        name: '暴走旋风',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        badge: '暴躁鸭',
        description: '消耗所有怒气，每点怒气造成1点AOE伤害（专属）',
        upgrade: {
            description: '消耗所有怒气，每点怒气造成1.5点AOE伤害（专属）'
        }
    },
    
    // ====================
    // 铁壳龟徽章卡
    // ====================
    
    '缩壳': {
        name: '缩壳',
        cost: 1,
        type: 'defense',
        rarity: 'common',
        badge: '铁壳龟',
        block: 8,
        description: '获得8点格挡',
        upgrade: {
            block: 12,
            description: '获得12点格挡'
        }
    },
    
    '壳击': {
        name: '壳击',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        badge: '铁壳龟',
        description: '造成等同于格挡值的伤害，失去格挡',
        upgrade: {
            description: '造成格挡值×1.5的伤害，失去格挡'
        }
    },
    
    '反弹': {
        name: '反弹',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        badge: '铁壳龟',
        block: 5,
        reflect: 3,
        description: '获得5点格挡，被攻击时反弹3点伤害',
        upgrade: {
            block: 8,
            reflect: 5,
            description: '获得8点格挡，被攻击时反弹5点伤害'
        }
    },
    
    '铁壁': {
        name: '铁壁',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        badge: '铁壳龟',
        block: 12,
        description: '获得12点格挡（专属）',
        upgrade: {
            block: 18,
            description: '获得18点格挡（专属）'
        }
    },
    
    '守护壳': {
        name: '守护壳',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        badge: '铁壳龟',
        block: 8,
        description: '为相邻友军提供8点格挡（专属）',
        upgrade: {
            block: 12,
            description: '为相邻友军提供12点格挡，同时给自己4点（专属）'
        }
    },
    
    '绝对防御': {
        name: '绝对防御',
        cost: 3,
        type: 'defense',
        rarity: 'rare',
        badge: '铁壳龟',
        block: 20,
        description: '获得20点格挡，免疫下回合所有debuff（专属）',
        upgrade: {
            block: 30,
            description: '获得30点格挡，下回合格挡保留（专属）'
        }
    }
};

// 导出（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cards;
}

console.log('✅ Cards.js 加载完成，Cards =', typeof Cards);
