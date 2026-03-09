/**
 * 克苏鲁风格卡牌数据 - Cards_Cthulhu.js
 * 
 * @fileOverview 深渊召唤游戏的所有卡牌定义
 * @author 深渊召唤开发团队
 * @version 0.2.0
 * 
 * 卡牌类型说明:
 * - attack: 攻击卡，需要对敌人使用
 * - defense: 防御卡，提供格挡
 * - skill: 技能卡，各种特殊效果
 * - move: 移动卡，恢复移动力
 * 
 * 稀有度说明:
 * - basic: 基础卡（初始卡组）
 * - common: 普通卡（白色）
 * - uncommon: 稀有卡（蓝色）
 * - rare: 传说卡（金色）
 * 
 * 特殊属性:
 * - badge: 专属徽章限制
 * - sanityCost: 理智值消耗
 * - sanityRestore: 理智值恢复
 * - consumable: 消耗品（使用后从卡组移除）
 */

console.log('🐙 Cards_Cthulhu.js 开始加载');

var Cards = {
    // ====================
    // 基础卡 - 调查员求生技能
    // 所有玩家初始卡组都包含这些卡牌
    // ====================
    
    /**
     * 疯狂挥击 - 基础攻击卡
     * 最基础的攻击手段，在绝望中挥舞武器
     */
    '疯狂挥击': {
        name: '疯狂挥击',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        damage: 6,
        range: 1,
        description: '在绝望中疯狂挥舞武器，造成6点伤害',
        upgrade: {
            damage: 9,
            description: '在绝望中疯狂挥舞武器，造成9点伤害'
        }
    },
    
    /**
     * 理智屏障 - 基础防御卡
     * 使用残存的理智构筑护盾
     */
    '理智屏障': {
        name: '理智屏障',
        cost: 1,
        type: 'defense',
        rarity: 'basic',
        block: 5,
        description: '用残存的理智构筑护盾，获得5点格挡',
        upgrade: {
            block: 8,
            description: '用残存的理智构筑护盾，获得8点格挡'
        }
    },
    
    /**
     * 逃离深渊 - 基础移动卡
     * 恢复移动力，逃离恐怖
     */
    '逃离深渊': {
        name: '逃离深渊',
        cost: 1,
        type: 'move',
        rarity: 'basic',
        movement: 2,
        description: '逃离那不可名状的恐怖，恢复2点移动力',
        upgrade: {
            movement: 3,
            description: '逃离那不可名状的恐怖，恢复3点移动力'
        }
    },
    
    /**
     * 古神低语 - 基础治疗卡
     * 消耗品，使用后被移除
     */
    '古神低语': {
        name: '古神低语',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        heal: 6,
        consumable: true,
        description: '聆听深渊的治愈低语，恢复6点生命（消耗品）',
        upgrade: {
            heal: 9,
            description: '聆听深渊的治愈低语，恢复9点生命（消耗品）'
        }
    },
    
    /**
     * 疯狂之源 - 基础能量卡
     * 消耗品，提供额外能量
     */
    '疯狂之源': {
        name: '疯狂之源',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        energy: 1,
        consumable: true,
        description: '从疯狂中汲取力量，获得1点能量（消耗品）',
        upgrade: {
            energy: 2,
            description: '从疯狂中汲取力量，获得2点能量（消耗品）'
        }
    },
    
    /**
     * 献祭诱饵 - 基础嘲讽卡
     * 引诱敌人攻击自己
     */
    '献祭诱饵': {
        name: '献祭诱饵',
        cost: 1,
        type: 'skill',
        rarity: 'basic',
        description: '引诱敌人攻击，下回合敌人必攻击你',
        upgrade: {
            description: '引诱敌人攻击，获得5点格挡，下回合敌人必攻击你'
        }
    },
    
    // ====================
    // 深渊使者徽章卡 - 疯狂与触手 🐙
    // 攻击型徽章专属卡牌
    // ====================
    
    /**
     * 触手蔓延 - 深渊使者普通卡
     * 每打出一张攻击卡，伤害增加
     */
    '触手蔓延': {
        name: '触手蔓延',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        badge: '深渊使者',
        description: '本回合每打出一张攻击卡，该卡伤害+1（触手缠绕）',
        upgrade: {
            description: '本回合每打出一张攻击卡，该卡伤害+2（触手缠绕）'
        }
    },
    
    /**
     * 疯狂鞭挞 - 深渊使者攻击卡
     * 连击机制，本回合打出2张卡后抽牌
     */
    '疯狂鞭挞': {
        name: '疯狂鞭挞',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        badge: '深渊使者',
        damage: 4,
        range: 1,
        description: '触手疯狂抽打，造成4点伤害，本回合已打出2张卡则抽1张',
        upgrade: {
            damage: 5,
            description: '触手疯狂抽打，造成5点伤害，本回合已打出2张卡抽2张'
        }
    },
    
    /**
     * 深渊凝视·狂 - 深渊使者稀有技能卡
     * 本回合所有攻击卡0费
     */
    '深渊凝视·狂': {
        name: '深渊凝视·狂',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        badge: '深渊使者',
        description: '本回合所有攻击卡费用变为0（古神注视）',
        upgrade: {
            description: '本回合所有攻击卡费用变为0，获得3力量（古神注视）'
        }
    },
    
    /**
     * 不可名状之击 - 深渊使者稀有攻击卡
     * 高伤害但有自伤代价
     */
    '不可名状之击': {
        name: '不可名状之击',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        badge: '深渊使者',
        damage: 8,
        range: 1,
        selfDamage: 3,
        description: '召唤深渊之力造成8点伤害，失去3HP（专属）',
        upgrade: {
            damage: 12,
            description: '召唤深渊之力造成12点伤害，失去3HP（专属）'
        }
    },
    
    /**
     * 理智献祭 - 深渊使者非普通卡
     * 以生命换取能量
     */
    '理智献祭': {
        name: '理智献祭',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        badge: '深渊使者',
        selfDamage: 5,
        energyGain: 2,
        description: '失去5HP，获得2能量，聆听古神的疯狂呓语（专属）',
        upgrade: {
            energyGain: 3,
            description: '失去5HP，获得3能量，聆听古神的疯狂呓语（专属）'
        }
    },
    
    /**
     * 疯狂漩涡 - 深渊使者稀有AOE卡
     * 消耗所有疯狂值造成范围伤害
     */
    '疯狂漩涡': {
        name: '疯狂漩涡',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        badge: '深渊使者',
        description: '消耗所有疯狂值，每点造成1点AOE伤害（专属）',
        upgrade: {
            description: '消耗所有疯狂值，每点造成1.5点AOE伤害（专属）'
        }
    },
    
    // ====================
    // 旧日支配者徽章卡 - 古神之力 👁️
    // 防御型徽章专属卡牌
    // ====================
    
    /**
     * 古老护盾 - 旧日支配者普通防御卡
     * 提供大量格挡
     */
    '古老护盾': {
        name: '古老护盾',
        cost: 1,
        type: 'defense',
        rarity: 'common',
        badge: '旧日支配者',
        block: 8,
        description: '召唤古老符文护盾，获得8点格挡',
        upgrade: {
            block: 12,
            description: '召唤古老符文护盾，获得12点格挡'
        }
    },
    
    /**
     * 符文反击 - 旧日支配者普通攻击卡
     * 将格挡转化为攻击
     */
    '符文反击': {
        name: '符文反击',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        badge: '旧日支配者',
        description: '将护盾转化为攻击，造成等同于格挡值的伤害，失去格挡',
        upgrade: {
            description: '将护盾转化为攻击，造成格挡值×1.5的伤害，失去格挡'
        }
    },
    
    /**
     * 深渊反弹 - 旧日支配者非普通防御卡
     * 格挡+反弹伤害
     */
    '深渊反弹': {
        name: '深渊反弹',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        badge: '旧日支配者',
        block: 5,
        reflect: 3,
        description: '获得5点格挡，被攻击时反弹3点伤害（古老诅咒）',
        upgrade: {
            block: 8,
            reflect: 5,
            description: '获得8点格挡，被攻击时反弹5点伤害（古老诅咒）'
        }
    },
    
    /**
     * 绝对屏障 - 旧日支配者非普通防御卡
     * 高额格挡
     */
    '绝对屏障': {
        name: '绝对屏障',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        badge: '旧日支配者',
        block: 12,
        description: '召唤旧日支配者的绝对防御，获得12点格挡（专属）',
        upgrade: {
            block: 18,
            description: '召唤旧日支配者的绝对防御，获得18点格挡（专属）'
        }
    },
    
    /**
     * 深渊庇护 - 旧日支配者非普通防御卡
     * 为自己和队友提供格挡
     */
    '深渊庇护': {
        name: '深渊庇护',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        badge: '旧日支配者',
        block: 8,
        description: '为同伴提供深渊庇护，获得8点格挡，同时给自己4点（专属）',
        upgrade: {
            block: 12,
            description: '为同伴提供深渊庇护，获得12点格挡，同时给自己4点（专属）'
        }
    },
    
    // ====================
    // 特殊诅咒卡
    // 高风险高回报的强力卡牌
    // ====================
    
    /**
     * 克苏鲁的呼唤 - 传说攻击卡
     * 极高伤害，高费用
     */
    '克苏鲁的呼唤': {
        name: '克苏鲁的呼唤',
        cost: 3,
        type: 'attack',
        rarity: 'rare',
        damage: 20,
        range: 2,
        description: '召唤克苏鲁的恐怖力量，造成20点伤害（诅咒卡）',
        upgrade: {
            damage: 30,
            description: '召唤克苏鲁的恐怖力量，造成30点伤害（诅咒卡）'
        }
    },
    
    /**
     * 黄衣之王的印记 - 非普通技能卡
     * 标记敌人使其受到伤害翻倍
     */
    '黄衣之王的印记': {
        name: '黄衣之王的印记',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '标记敌人，使其受到的下一次伤害翻倍',
        upgrade: {
            description: '标记敌人，使其受到的下两次伤害翻倍'
        }
    },
    
    /**
     * 死灵之书残页 - 黄衣信徒专属卡
     * 抽卡但失去理智
     */
    '死灵之书残页': {
        name: '死灵之书残页',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        badge: '黄衣信徒',
        description: '抽取3张卡，失去3点理智值',
        upgrade: {
            description: '抽取4张卡，失去2点理智值'
        }
    },
    
    // ====================
    // SAN值机制卡牌
    // 与理智值系统交互的特殊卡牌
    // ====================
    
    /**
     * 直视深渊 - 非普通技能卡
     * 高伤害但需要消耗理智
     * 注意：与深渊凝视·狂不同，这是伤害技能
     */
    '直视深渊': {
        name: '直视深渊',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        sanityCost: 5,
        damage: 15,
        description: '直视深渊的力量，造成15点伤害，消耗5点理智值',
        upgrade: {
            damage: 22,
            description: '直视深渊的力量，造成22点伤害，消耗5点理智值'
        }
    },
    
    /**
     * 心灵护盾 - 非普通防御卡
     * 格挡+理智恢复
     */
    '心灵护盾': {
        name: '心灵护盾',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        block: 8,
        sanityRestore: 3,
        description: '恢复3点理智值，获得8点格挡',
        upgrade: {
            block: 12,
            sanityRestore: 5,
            description: '恢复5点理智值，获得12点格挡'
        }
    },
    
    /**
     * 疯狂释放 - 稀有攻击卡
     * 0费高伤害但大量消耗理智
     */
    '疯狂释放': {
        name: '疯狂释放',
        cost: 0,
        type: 'attack',
        rarity: 'rare',
        damage: 10,
        sanityCost: 8,
        description: '释放内心的疯狂，造成10点伤害，消耗8点理智值',
        upgrade: {
            damage: 16,
            sanityCost: 6,
            description: '释放内心的疯狂，造成16点伤害，消耗6点理智值'
        }
    },
    
    /**
     * 古神庇护 - 稀有恢复卡
     * 同时恢复理智和生命
     */
    '古神庇护': {
        name: '古神庇护',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        sanityRestore: 10,
        heal: 10,
        description: '获得古神的庇护，恢复10点理智值和10点生命',
        upgrade: {
            sanityRestore: 15,
            heal: 15,
            description: '获得古神的庇护，恢复15点理智值和15点生命'
        }
    },
    
    /**
     * 恐怖尖啸 - 非普通AOE卡
     * 消耗理智的群体攻击
     */
    '恐怖尖啸': {
        name: '恐怖尖啸',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        sanityCost: 3,
        aoeDamage: 8,
        description: '发出非人的尖啸，对所有敌人造成8点伤害，消耗3点理智值',
        upgrade: {
            aoeDamage: 12,
            description: '发出非人的尖啸，对所有敌人造成12点伤害，消耗3点理智值'
        }
    },
    
    // ====================
    // 恢复理智专用卡牌
    // 用于管理和恢复理智值
    // ====================
    
    /**
     * 理智之泉 - 普通恢复卡
     * 基础理智恢复
     */
    '理智之泉': {
        name: '理智之泉',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        sanityRestore: 8,
        description: '恢复8点理智值',
        upgrade: {
            sanityRestore: 12,
            description: '恢复12点理智值'
        }
    },
    
    /**
     * 精神集中 - 非普通恢复卡
     * 理智+格挡
     */
    '精神集中': {
        name: '精神集中',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        sanityRestore: 5,
        block: 5,
        description: '恢复5点理智值，获得5点格挡',
        upgrade: {
            sanityRestore: 8,
            block: 8,
            description: '恢复8点理智值，获得8点格挡'
        }
    },
    
    /**
     * 深渊抗性 - 稀有恢复卡
     * 大量理智恢复+生命恢复
     */
    '深渊抗性': {
        name: '深渊抗性',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        sanityRestore: 15,
        heal: 10,
        description: '恢复15点理智值和10点生命',
        upgrade: {
            sanityRestore: 20,
            heal: 15,
            description: '恢复20点理智值和15点生命'
        }
    },
    
    /**
     * 忘却仪式 - 非普通恢复卡
     * 理智恢复+清除负面状态
     */
    '忘却仪式': {
        name: '忘却仪式',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        sanityRestore: 10,
        description: '恢复10点理智值，移除所有负面状态',
        upgrade: {
            sanityRestore: 15,
            description: '恢复15点理智值，移除所有负面状态'
        }
    }
};

// 统计并输出卡牌数量
var cardCount = Object.keys(Cards).length;
var badgeCards = Object.values(Cards).filter(function(c) { return c.badge; }).length;
var sanityCards = Object.values(Cards).filter(function(c) { return c.sanityCost || c.sanityRestore; }).length;

console.log('✅ Cards_Cthulhu.js 加载完成');
console.log('   📊 总计: ' + cardCount + ' 张卡牌');
console.log('   🏅 徽章专属: ' + badgeCards + ' 张');
console.log('   🧠 SAN相关: ' + sanityCards + ' 张');
