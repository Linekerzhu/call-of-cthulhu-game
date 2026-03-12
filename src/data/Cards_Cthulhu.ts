/**
 * 克苏鲁风格卡牌数据 - Cards_Cthulhu.js
 * 
 * @fileOverview 深渊召唤游戏的所有卡牌定义
 * @version 0.3.0 - 数据驱动效果系统
 * 
 * 卡牌效果系统 (effects 数组):
 * - { type: 'gainBlock', value: N }          获得N点格挡
 * - { type: 'gainMovement', value: N }       恢复N点移动力
 * - { type: 'heal', value: N }               恢复N点生命
 * - { type: 'gainEnergy', value: N }         获得N点能量
 * - { type: 'attackBuff', value: N }         本回合攻击卡额外+N伤害
 * - { type: 'drawCards', value: N }          抽N张卡
 * - { type: 'selfDamage', value: N }         自己失去N点HP
 * - { type: 'aoe', value: N }               对所有敌人造成N点伤害
 * - { type: 'sanityCost', value: N }         消耗N点理智值
 * - { type: 'sanityRestore', value: N }      恢复N点理智值
 * - { type: 'targetDamage', value: N }       对选中目标造成N点伤害 (needsTarget)
 * - { type: 'markEnemy', value: N }          标记敌人，下N次伤害翻倍 (needsTarget)
 * - { type: 'consumeMadness' }               消耗所有疯狂值，每点造成AOE伤害
 * - { type: 'zeroCostAttacks' }              本回合所有攻击卡费用变为0
 * - { type: 'reflect', value: N }            被攻击时反弹N点伤害
 * - { type: 'drawOnCombo', threshold: N, draw: M }  本回合已出N张卡则抽M张
 * - { type: 'blockToAttack' }                将格挡转化为伤害 (needsTarget)
 * 
 * needsTarget: true 表示该卡牌需要选择敌人目标
 */


import { ICard } from '../types/game.ts';

var Cards: Record<string, ICard | any> = {
    // ====================
    // 基础卡 - 调查员求生技能
    // ====================

    '疯狂挥击': {
        name: '疯狂挥击',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        forbiddenTier: 0,
        damage: 6,
        range: 1,
        needsTarget: true,
        description: '在绝望中疯狂挥舞武器，造成6点伤害',
        effects: [
            { type: 'targetDamage', value: 6 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'dot', dotType: 'poison', dotName: '狂乱之毒', dotDamage: 1, duration: 2 }],
                flavorText: '你的攻击中带上了某种不该存在的力量...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '疯狂乱舞',
                bonusEffects: [{ type: 'aoe', value: 3 }],
                descOverride: '疯狂挥舞造成6点伤害+3点全体溅射',
                flavorText: '理智崩塌，攻击变得毫无章法却更加致命'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '不可名状之击',
                    cost: 0,
                    effects: [
                        { type: 'targetDamage', value: 15 },
                        { type: 'aoe', value: 8 },
                        { type: 'selfDamage', value: 5 }
                    ],
                    description: '你不再挥击——你就是武器本身（15伤害+8溅射+5自伤）'
                },
                flavorText: '你的手臂已经不再是手臂了'
            }
        ],
        upgrade: {
            damage: 9,
            description: '在绝望中疯狂挥舞武器，造成9点伤害',
            effects: [{ type: 'targetDamage', value: 9 }]
        }
    },

    '理智屏障': {
        name: '理智屏障',
        cost: 1,
        type: 'defense',
        rarity: 'basic',
        forbiddenTier: 0,
        block: 5,
        description: '用残存的理智构筑护盾，获得5点格挡',
        effects: [
            { type: 'gainBlock', value: 5 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'reflect', value: 2 }],
                flavorText: '护盾上浮现出不可名状的纹路...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊之壁',
                bonusEffects: [{ type: 'reflect', value: 4 }, { type: 'gainBlock', value: 3 }],
                descOverride: '获得8点格挡+4反伤',
                flavorText: '从深渊处借来的屏障比理智更加坚固'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '虚无护盾',
                    cost: 0,
                    effects: [
                        { type: 'gainBlock', value: 12 },
                        { type: 'reflect', value: 6 },
                        { type: 'heal', value: 3 }
                    ],
                    description: '虚无即是最好的防御（12格挡+6反伤+3治疗）'
                },
                flavorText: '在彻底的虚无中，没有什么能伤害你'
            }
        ],
        upgrade: {
            block: 8,
            description: '用残存的理智构筑护盾，获得8点格挡',
            effects: [{ type: 'gainBlock', value: 8 }]
        }
    },

    '逃离深渊': {
        name: '逃离深渊',
        cost: 1,
        type: 'move',
        rarity: 'basic',
        movement: 2,
        description: '逃离那不可名状的恐怖，恢复2点移动力',
        effects: [
            { type: 'gainMovement', value: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 3 }],
                flavorText: '恐惧让你的脚步更加谨慎'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '穿越裂隙',
                bonusEffects: [{ type: 'gainMovement', value: 1 }, { type: 'gainBlock', value: 5 }],
                descOverride: '恢复3移动力+5格挡（空间在你眼中扭曲）',
                flavorText: '你看见了空间的裂缝——穿过去！'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '虚空步',
                    cost: 0,
                    effects: [
                        { type: 'teleport' },
                        { type: 'gainBlock', value: 8 }
                    ],
                    description: '瞬移到随机安全位置+8格挡（你已融入虚空）'
                },
                flavorText: '距离？空间？那些概念对你已毫无意义'
            }
        ],
        upgrade: {
            movement: 3,
            description: '逃离那不可名状的恐怖，恢复3点移动力',
            effects: [{ type: 'gainMovement', value: 3 }]
        }
    },

    '古神低语': {
        name: '古神低语',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        heal: 6,
        consumable: true,
        description: '聆听深渊的治愈低语，恢复6点生命（消耗品）',
        effects: [
            { type: 'heal', value: 6 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityRestore', value: 2 }],
                flavorText: '低语中似乎蕴含着安抚之力...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊回音',
                bonusEffects: [{ type: 'heal', value: 4 }, { type: 'sanityRestore', value: 3 }],
                descOverride: '恢复10HP+3SAN（深渊的回馈）',
                flavorText: '你越疯狂，古神越愿意赐予你力量'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '古神的恩赐',
                    cost: 0,
                    effects: [
                        { type: 'heal', value: 15 },
                        { type: 'drawCards', value: 2 }
                    ],
                    description: '恢复15HP+抽2张（但你已不再需要治疗了...）'
                },
                flavorText: '低语变成了咆哮——是恩赐还是诅咒？'
            }
        ],
        upgrade: {
            heal: 9,
            description: '聆听深渊的治愈低语，恢复9点生命（消耗品）',
            effects: [{ type: 'heal', value: 9 }]
        }
    },

    '疯狂之源': {
        name: '疯狂之源',
        cost: 0,
        type: 'skill',
        rarity: 'basic',
        energy: 1,
        consumable: true,
        description: '从疯狂中汲取力量，获得1点能量（消耗品）',
        effects: [
            { type: 'gainEnergy', value: 1 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'attackBuff', value: 1 }],
                flavorText: '疯狂赋予你额外的力量...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '混沌源泉',
                bonusEffects: [{ type: 'gainEnergy', value: 1 }, { type: 'attackBuff', value: 1 }],
                descOverride: '抽1+2能量-3HP+手牌攻击+1',
                flavorText: '混沌的力量源源不断涌入你的身体'
            }
        ],
        upgrade: {
            energy: 2,
            description: '从疯狂中汲取力量，获得2点能量（消耗品）',
            effects: [{ type: 'gainEnergy', value: 2 }]
        }
    },

    '献祭诱饵': {
        name: '献祭诱饵',
        cost: 1,
        type: 'skill',
        rarity: 'basic',
        forbiddenTier: 2,
        description: '引诱敌人攻击，下回合敌人必攻击你',
        effects: [
            { type: 'taunt' }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 3 }],
                flavorText: '恐惧让献祭更加坚定'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊献祭',
                bonusEffects: [{ type: 'reflect', value: 3 }, { type: 'gainBlock', value: 5 }],
                descOverride: '嘲讽+13格挡+3反伤',
                flavorText: '你的身体开始散发令怪物疯狂的气息'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '活体诱饵',
                    cost: 0,
                    effects: [
                        { type: 'taunt' },
                        { type: 'gainBlock', value: 15 },
                        { type: 'reflect', value: 8 },
                        { type: 'selfDamage', value: 5 }
                    ],
                    description: '15格挡+8反伤+嘲讽-5HP（你已成为深渊的容器）'
                },
                flavorText: '你不再是诱饵——你就是深渊本身'
            }
        ],
        upgrade: {
            description: '引诱敌人攻击，获得5点格挡，下回合敌人必攻击你',
            effects: [{ type: 'gainBlock', value: 5 }, { type: 'taunt' }]
        }
    },

    // ====================
    // 深渊使者徽章卡 - 疯狂与触手 🐙
    // ====================

    '触手蔓延': {
        name: '触手蔓延',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        forbiddenTier: 1,
        badge: '深渊使者',
        description: '触手缠绕！手牌中所有攻击效果+1伤害',
        effects: [
            { type: 'attackBuff', value: 1 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '触手在阴暗处疯狂生长...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '触手风暴',
                bonusEffects: [{ type: 'attackBuff', value: 1 }, { type: 'drawCards', value: 1 }],
                descOverride: '手牌攻击+2+抽1张（触手已无处不在）',
                flavorText: '触手不只是武器——它们有自己的意志'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '万触之主',
                    cost: 0,
                    effects: [
                        { type: 'attackBuff', value: 3 },
                        { type: 'drawCards', value: 2 },
                        { type: 'aoe', value: 3 }
                    ],
                    description: '手牌攻击+3+抽2张+3全体伤害（你就是触手之主）'
                },
                flavorText: '无数触手从你体内涌出，吞噬一切'
            }
        ],
        upgrade: {
            description: '触手狂舞！手牌中所有攻击效果+2伤害',
            effects: [{ type: 'attackBuff', value: 2 }]
        }
    },

    '疯狂鞭挞': {
        name: '疯狂鞭挞',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        forbiddenTier: 1,
        badge: '深渊使者',
        damage: 4,
        range: 1,
        needsTarget: true,
        description: '触手疯狂抽打，造成4点伤害，本回合已打出2张卡则抽1张',
        effects: [
            { type: 'targetDamage', value: 4 },
            { type: 'drawOnCombo', threshold: 2, draw: 1 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'selfDamage', value: 1, _mutated: true }],
                flavorText: '鞭挞越来越疯狂，你也开始受伤...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '狂乱鞭笞',
                bonusEffects: [{ type: 'targetDamage', value: 3 }, { type: 'selfDamage', value: 2, _mutated: true }],
                descOverride: '造成7点伤害-2HP+combo抽牌',
                flavorText: '触手不分敌我地抽打着一切'
            }
        ],
        upgrade: {
            damage: 5,
            description: '触手疯狂抽打，造成5点伤害，本回合已打出2张卡抽2张',
            effects: [
                { type: 'targetDamage', value: 5 },
                { type: 'drawOnCombo', threshold: 2, draw: 2 }
            ]
        }
    },

    '深渊凝视·狂': {
        name: '深渊凝视·狂',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 3,
        badge: '深渊使者',
        description: '本回合所有攻击卡费用变为0（古神注视）',
        effects: [
            { type: 'zeroCostAttacks' }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '古神的注视中蕴含着知识...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '古神的馈赠',
                bonusEffects: [{ type: 'attackBuff', value: 2 }, { type: 'drawCards', value: 1 }],
                descOverride: '攻击卡免费+手牌攻击+2+抽1张',
                flavorText: '你已读懂了古神的意志'
            }
        ],
        upgrade: {
            description: '本回合所有攻击卡费用变为0，攻击+3（古神注视）',
            effects: [
                { type: 'zeroCostAttacks' },
                { type: 'attackBuff', value: 3 }
            ]
        }
    },

    '不可名状之击': {
        name: '不可名状之击',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 2,
        badge: '深渊使者',
        damage: 8,
        range: 1,
        needsTarget: true,
        selfDamage: 3,
        description: '召唤深渊之力造成8点伤害，失去3HP（专属）',
        effects: [
            { type: 'targetDamage', value: 8 },
            { type: 'selfDamage', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'targetDamage', value: 2 }],
                flavorText: '深渊的力量在你拳中凝聚...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊毁灭',
                bonusEffects: [{ type: 'targetDamage', value: 4 }, { type: 'aoe', value: 3 }],
                descOverride: '造成12点伤害+3溅射-3HP',
                flavorText: '你的拳头已非血肉之躯'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '万物终结',
                    cost: 0,
                    effects: [
                        { type: 'targetDamage', value: 20 },
                        { type: 'aoe', value: 10 },
                        { type: 'selfDamage', value: 8 }
                    ],
                    description: '20点伤害+10溅射-8HP（一击灭世）'
                },
                flavorText: '你挥出的不是攻击——那是终结本身'
            }
        ],
        upgrade: {
            damage: 12,
            description: '召唤深渊之力造成12点伤害，失去3HP（专属）',
            effects: [
                { type: 'targetDamage', value: 12 },
                { type: 'selfDamage', value: 3 }
            ]
        }
    },

    '理智献祭': {
        name: '理智献祭',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        badge: '深渊使者',
        selfDamage: 5,
        energyGain: 2,
        description: '失去5HP，获得2能量，聆听古神的疯狂呓语（专属）',
        effects: [
            { type: 'selfDamage', value: 5 },
            { type: 'gainEnergy', value: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '献祭中你窥见了forbidden知识...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '血肉祭坛',
                costOverride: 0,
                bonusEffects: [{ type: 'gainEnergy', value: 1 }, { type: 'drawCards', value: 1 }],
                descOverride: '失去5HP，获得3能量+抽1张',
                flavorText: '你的血肉成为了通往深渊的祭品'
            }
        ],
        upgrade: {
            energyGain: 3,
            description: '失去5HP，获得3能量，聆听古神的疯狂呓语（专属）',
            effects: [
                { type: 'selfDamage', value: 5 },
                { type: 'gainEnergy', value: 3 }
            ]
        }
    },

    '疯狂漩涡': {
        name: '疯狂漩涡',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 2,
        badge: '深渊使者',
        description: '消耗所有疯狂值，每点造成1点AOE伤害（专属）',
        effects: [
            { type: 'consumeMadness' }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityCost', value: 3, _mutated: true }],
                flavorText: '漩涡中传来疯狂的低语...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊漩涡',
                bonusEffects: [{ type: 'aoe', value: 5 }, { type: 'sanityCost', value: 5, _mutated: true }],
                descOverride: '消耗疯狂值AOE+额外5全体伤害-5SAN',
                flavorText: '漩涡已不受控制——它在吞噬一切'
            }
        ],
        upgrade: {
            description: '消耗所有疯狂值，每点造成1.5点AOE伤害（专属）',
            effects: [{ type: 'consumeMadness', multiplier: 1.5 }]
        }
    },

    // ====================
    // 旧日支配者徽章卡 - 古神之力 👁️
    // ====================

    '古老护盾': {
        name: '古老护盾',
        cost: 1,
        type: 'defense',
        rarity: 'common',
        forbiddenTier: 1,
        badge: '旧日支配者',
        block: 8,
        description: '召唤古老符文护盾，获得8点格挡',
        effects: [
            { type: 'gainBlock', value: 8 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 2 }],
                flavorText: '符文开始自行发光...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '远古符文盾',
                bonusEffects: [{ type: 'gainBlock', value: 4 }, { type: 'sanityRestore', value: 2 }],
                descOverride: '获得12格挡+2SAN恢复',
                flavorText: '远古的符文正在保护你的理智'
            }
        ],
        upgrade: {
            block: 12,
            description: '召唤古老符文护盾，获得12点格挡',
            effects: [{ type: 'gainBlock', value: 12 }]
        }
    },

    '符文反击': {
        name: '符文反击',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        forbiddenTier: 3,
        badge: '旧日支配者',
        needsTarget: true,
        description: '将护盾转化为攻击，造成等同于格挡值的伤害，失去格挡',
        effects: [
            { type: 'blockToAttack' }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 3 }],
                flavorText: '反击前，符文先为你增添防御...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '符文爆裂',
                bonusEffects: [{ type: 'aoe', value: 3 }],
                descOverride: '格挡→伤害+3全体溅射',
                flavorText: '符文碎裂时释放出毁灭性的能量'
            }
        ],
        upgrade: {
            description: '将护盾转化为攻击，造成格挡值×1.5的伤害，失去格挡',
            effects: [{ type: 'blockToAttack', multiplier: 1.5 }]
        }
    },

    '深渊反弹': {
        name: '深渊反弹',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        forbiddenTier: 2,
        badge: '旧日支配者',
        block: 5,
        reflect: 3,
        description: '获得5点格挡，被攻击时反弹3点伤害（古老诅咒）',
        effects: [
            { type: 'gainBlock', value: 5 },
            { type: 'reflect', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'reflect', value: 2 }],
                flavorText: '诅咒的力量在增强...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '诅咒回响',
                bonusEffects: [{ type: 'reflect', value: 3 }, { type: 'gainBlock', value: 3 }],
                descOverride: '获得8格挡+6反弹伤害',
                flavorText: '每一次反弹都带着诅咒的回响'
            }
        ],
        upgrade: {
            block: 8,
            reflect: 5,
            description: '获得8点格挡，被攻击时反弹5点伤害（古老诅咒）',
            effects: [
                { type: 'gainBlock', value: 8 },
                { type: 'reflect', value: 5 }
            ]
        }
    },

    '绝对屏障': {
        name: '绝对屏障',
        cost: 2,
        type: 'defense',
        rarity: 'uncommon',
        forbiddenTier: 2,
        badge: '旧日支配者',
        block: 12,
        description: '召唤旧日支配者的绝对防御，获得12点格挡（专属）',
        effects: [
            { type: 'gainBlock', value: 12 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 3 }],
                flavorText: '屏障似乎在吸收周围的恐惧...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '旧日之壁',
                bonusEffects: [{ type: 'gainBlock', value: 5 }, { type: 'reflect', value: 4 }],
                descOverride: '获得17格挡+4反伤',
                flavorText: '旧日支配者的意志化为你的护盾'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '不朽城墙',
                    cost: 1,
                    effects: [
                        { type: 'gainBlock', value: 25 },
                        { type: 'reflect', value: 8 },
                        { type: 'sanityCost', value: 5 }
                    ],
                    description: '25格挡+8反伤-5SAN（以理智为代价的绝对防御）'
                },
                flavorText: '拉莱耶的城墙从海底升起'
            }
        ],
        upgrade: {
            block: 18,
            description: '召唤旧日支配者的绝对防御，获得18点格挡（专属）',
            effects: [{ type: 'gainBlock', value: 18 }]
        }
    },

    '深渊庇护': {
        name: '深渊庇护',
        cost: 1,
        type: 'defense',
        rarity: 'uncommon',
        forbiddenTier: 1,
        badge: '旧日支配者',
        block: 8,
        description: '为同伴提供深渊庇护，获得8点格挡（专属）',
        effects: [
            { type: 'gainBlock', value: 8 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityRestore', value: 2 }],
                flavorText: '庇护中你感到一丝宁静...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '旧日庇护',
                bonusEffects: [{ type: 'gainBlock', value: 4 }, { type: 'sanityRestore', value: 3 }],
                descOverride: '获得12格挡+3SAN恢复',
                flavorText: '旧日支配者的羽翼笼罩着你'
            }
        ],
        upgrade: {
            block: 12,
            description: '为同伴提供深渊庇护，获得12点格挡（专属）',
            effects: [{ type: 'gainBlock', value: 12 }]
        }
    },

    // ====================
    // 特殊诅咒卡
    // ====================

    '克苏鲁的呼唤': {
        name: '克苏鲁的呼唤',
        cost: 3,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 5,
        damage: 20,
        range: 2,
        needsTarget: true,
        description: '召唤克苏鲁的恐怖力量，造成20点伤害（诅咒卡）',
        effects: [
            { type: 'targetDamage', value: 20 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'aoe', value: 5 }],
                flavorText: '呼唤回荡在虚空之中...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '克苏鲁的咆哮',
                bonusEffects: [{ type: 'aoe', value: 10 }, { type: 'sanityCost', value: 5, _mutated: true }],
                descOverride: '造成20点+10全体溅射-5SAN',
                flavorText: '沉睡者在梦中翻身——世界都在颤抖'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '克苏鲁觉醒',
                    cost: 2,
                    effects: [
                        { type: 'targetDamage', value: 35 },
                        { type: 'aoe', value: 15 },
                        { type: 'selfDamage', value: 10 }
                    ],
                    description: '35伤害+15全体-10HP（克苏鲁从拉莱耶苏醒）'
                },
                flavorText: 'Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn'
            }
        ],
        upgrade: {
            damage: 30,
            description: '召唤克苏鲁的恐怖力量，造成30点伤害（诅咒卡）',
            effects: [{ type: 'targetDamage', value: 30 }]
        }
    },

    '黄衣之王的印记': {
        name: '黄衣之王的印记',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        needsTarget: true,
        description: '标记敌人，使其受到的下一次伤害翻倍',
        effects: [
            { type: 'markEnemy', value: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '黄衣之王的标记在发光...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '黄衣之王的烙印',
                bonusEffects: [{ type: 'markEnemy', value: 1 }],
                descOverride: '标记敌人x3次伤害翻倍',
                flavorText: '哈斯塔的诅咒在目标身上蔓延'
            }
        ],
        upgrade: {
            description: '标记敌人，使其受到的下两次伤害翻倍',
            effects: [{ type: 'markEnemy', value: 3 }]
        }
    },

    '死灵之书残页': {
        name: '死灵之书残页',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 2,
        badge: '黄衣信徒',
        description: '抽取3张卡，失去3点理智值',
        effects: [
            { type: 'drawCards', value: 3 },
            { type: 'sanityCost', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '残页上的文字在自行蠕动...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '死灵之书·禁章',
                bonusEffects: [{ type: 'drawCards', value: 1 }, { type: 'gainEnergy', value: 1 }],
                descOverride: '抽5张+1能量-3SAN（禁忌的知识涌入脑海）',
                flavorText: '你读到了不该读的那一页'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '死灵之书·完本',
                    cost: 1,
                    effects: [
                        { type: 'drawCards', value: 5 },
                        { type: 'gainEnergy', value: 2 },
                        { type: 'attackBuff', value: 3 },
                        { type: 'sanityCost', value: 8 }
                    ],
                    description: '抽5张+2能量+攻击+3-8SAN（你读完了整本死灵之书）'
                },
                flavorText: '阿尔哈兹莱德写下的一切，你已全部理解'
            }
        ],
        upgrade: {
            description: '抽取4张卡，失去2点理智值',
            effects: [
                { type: 'drawCards', value: 4 },
                { type: 'sanityCost', value: 2 }
            ]
        }
    },

    // ====================
    // SAN值机制卡牌
    // ====================

    '直视深渊': {
        name: '直视深渊',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 3,
        sanityCost: 5,
        damage: 15,
        needsTarget: true,
        description: '直视深渊的力量，造成15点伤害，消耗5点理智值',
        effects: [
            { type: 'targetDamage', value: 15 },
            { type: 'sanityCost', value: 5 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'targetDamage', value: 3 }],
                flavorText: '深渊也在注视着你...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊回望',
                bonusEffects: [{ type: 'targetDamage', value: 5 }, { type: 'drawCards', value: 1 }],
                descOverride: '造成20点伤害+抽1张-5SAN',
                flavorText: '当你凝视深渊时，深渊也在凝视你'
            }
        ],
        upgrade: {
            damage: 22,
            description: '直视深渊的力量，造成22点伤害，消耗5点理智值',
            effects: [
                { type: 'targetDamage', value: 22 },
                { type: 'sanityCost', value: 5 }
            ]
        }
    },

    '心灵护盾': {
        name: '心灵护盾',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 1,
        block: 8,
        sanityRestore: 3,
        description: '恢复3点理智值，获得8点格挡',
        effects: [
            { type: 'gainBlock', value: 8 },
            { type: 'sanityRestore', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 2 }],
                flavorText: '心灵的壁垒在加固...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '心灵堡垒',
                bonusEffects: [{ type: 'gainBlock', value: 4 }, { type: 'sanityRestore', value: 2 }],
                descOverride: '获得12格挡+5SAN恢复',
                flavorText: '你的心灵已足够坚强来抵御深渊'
            }
        ],
        upgrade: {
            block: 12,
            sanityRestore: 5,
            description: '恢复5点理智值，获得12点格挡',
            effects: [
                { type: 'gainBlock', value: 12 },
                { type: 'sanityRestore', value: 5 }
            ]
        }
    },

    '疯狂释放': {
        name: '疯狂释放',
        cost: 0,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 4,
        damage: 10,
        sanityCost: 8,
        needsTarget: true,
        description: '释放内心的疯狂，造成10点伤害，消耗8点理智值',
        effects: [
            { type: 'targetDamage', value: 10 },
            { type: 'sanityCost', value: 8 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'targetDamage', value: 3 }],
                flavorText: '疯狂的力量在膨胀...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '疯狂倾泻',
                bonusEffects: [{ type: 'targetDamage', value: 5 }, { type: 'aoe', value: 5 }],
                descOverride: '造成15点+5全体-8SAN（无法遏制的疯狂）',
                flavorText: '疯狂如决堤的洪水般倾泻而出'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '彻底癫狂',
                    cost: 0,
                    effects: [
                        { type: 'targetDamage', value: 25 },
                        { type: 'aoe', value: 10 },
                        { type: 'selfDamage', value: 10 }
                    ],
                    description: '25伤害+10全体-10HP（你已彻底癫狂——但从未如此强大）'
                },
                flavorText: '这不是攻击——这是你灵魂的终极绽放'
            }
        ],
        upgrade: {
            damage: 16,
            sanityCost: 6,
            description: '释放内心的疯狂，造成16点伤害，消耗6点理智值',
            effects: [
                { type: 'targetDamage', value: 16 },
                { type: 'sanityCost', value: 6 }
            ]
        }
    },

    '古神庇护': {
        name: '古神庇护',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 3,
        sanityRestore: 10,
        heal: 10,
        description: '获得古神的庇护，恢复10点理智值和10点生命',
        effects: [
            { type: 'sanityRestore', value: 10 },
            { type: 'heal', value: 10 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 5 }],
                flavorText: '古神的慈悲降临于你...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '古神的怜悯',
                bonusEffects: [{ type: 'heal', value: 5 }, { type: 'gainBlock', value: 5 }],
                descOverride: '恢复15SAN+15HP+5格挡',
                flavorText: '你已足够疯狂，古神开始怜悯你'
            }
        ],
        upgrade: {
            sanityRestore: 15,
            heal: 15,
            description: '获得古神的庇护，恢复15点理智值和15点生命',
            effects: [
                { type: 'sanityRestore', value: 15 },
                { type: 'heal', value: 15 }
            ]
        }
    },

    '恐怖尖啸': {
        name: '恐怖尖啸',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        sanityCost: 3,
        aoeDamage: 8,
        description: '发出非人的尖啸，对所有敌人造成8点伤害，消耗3点理智值',
        effects: [
            { type: 'aoe', value: 8 },
            { type: 'sanityCost', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'aoe', value: 2 }],
                flavorText: '尖啸中混入了不属于人类的频率...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊嚎叫',
                bonusEffects: [{ type: 'aoe', value: 4 }, { type: 'stun', duration: 1 }],
                descOverride: '12AOE+眩晕1回合-3SAN',
                flavorText: '你的尖叫声已足以撕裂现实'
            }
        ],
        upgrade: {
            aoeDamage: 12,
            description: '发出非人的尖啸，对所有敌人造成12点伤害，消耗3点理智值',
            effects: [
                { type: 'aoe', value: 12 },
                { type: 'sanityCost', value: 3 }
            ]
        }
    },

    // ====================
    // 恢复理智专用卡牌
    // ====================

    '理智之泉': {
        name: '理智之泉',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        forbiddenTier: 1,
        sanityRestore: 8,
        description: '恢复8点理智值',
        effects: [
            { type: 'sanityRestore', value: 8 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'heal', value: 3 }],
                flavorText: '泉水中似乎还蕴含着治愈之力...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '遗忘之泉',
                bonusEffects: [{ type: 'sanityRestore', value: 4 }, { type: 'gainBlock', value: 5 }],
                descOverride: '恢复12SAN+5格挡（遗忘带来宁静）',
                flavorText: '你开始遗忘那些可怕的记忆...'
            }
        ],
        upgrade: {
            sanityRestore: 12,
            description: '恢复12点理智值',
            effects: [{ type: 'sanityRestore', value: 12 }]
        }
    },

    '精神集中': {
        name: '精神集中',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 1,
        sanityRestore: 5,
        block: 5,
        description: '恢复5点理智值，获得5点格挡',
        effects: [
            { type: 'sanityRestore', value: 5 },
            { type: 'gainBlock', value: 5 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '集中精神时，你似乎看到了更多...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '超感专注',
                bonusEffects: [{ type: 'gainEnergy', value: 1 }, { type: 'drawCards', value: 1 }],
                descOverride: '5SAN+5格挡+1能量+抽1张',
                flavorText: '你的精神已超越常人的极限'
            }
        ],
        upgrade: {
            sanityRestore: 8,
            block: 8,
            description: '恢复8点理智值，获得8点格挡',
            effects: [
                { type: 'sanityRestore', value: 8 },
                { type: 'gainBlock', value: 8 }
            ]
        }
    },

    '深渊抗性': {
        name: '深渊抗性',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 4,
        sanityRestore: 15,
        heal: 10,
        description: '恢复15点理智值和10点生命',
        effects: [
            { type: 'sanityRestore', value: 15 },
            { type: 'heal', value: 10 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 5 }],
                flavorText: '深渊的力量反而在治愈你...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊共生',
                bonusEffects: [{ type: 'heal', value: 5 }, { type: 'sanityRestore', value: 5 }, { type: 'gainBlock', value: 8 }],
                descOverride: '恢复20SAN+15HP+8格挡（与深渊共生）',
                flavorText: '你不再抵抗深渊——你与它达成了共生'
            }
        ],
        upgrade: {
            sanityRestore: 20,
            heal: 15,
            description: '恢复20点理智值和15点生命',
            effects: [
                { type: 'sanityRestore', value: 20 },
                { type: 'heal', value: 15 }
            ]
        }
    },

    '忘却仪式': {
        name: '忘却仪式',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 1,
        sanityRestore: 10,
        description: '恢复10点理智值，移除所有负面状态',
        effects: [
            { type: 'sanityRestore', value: 10 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityRestore', value: 3 }],
                flavorText: '仪式之中，遗忘带来安宁...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '记忆净化',
                bonusEffects: [{ type: 'sanityRestore', value: 5 }, { type: 'heal', value: 5 }],
                descOverride: '恢复15SAN+5HP（净化所有痛苦的记忆）',
                flavorText: '你选择遗忘——这是最后的慈悲'
            }
        ],
        upgrade: {
            sanityRestore: 15,
            description: '恢复15点理智值，移除所有负面状态',
            effects: [{ type: 'sanityRestore', value: 15 }]
        }
    },

    // ====================
    // 远程攻击卡
    // ====================

    '虚空射线': {
        name: '虚空射线',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        forbiddenTier: 1,
        damage: 5,
        range: 3,
        needsTarget: true,
        description: '发射一束虚空能量，对目标造成5点伤害（射程3）',
        effects: [
            { type: 'rangedDamage', value: 5 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'rangedDamage', value: 2 }],
                flavorText: '射线中掺杂了虚空的力量...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '虚空裂隙',
                bonusEffects: [{ type: 'rangedDamage', value: 3 }, { type: 'sanityCost', value: 2, _mutated: true }],
                descOverride: '造成8远程伤害-2SAN（射线撕裂了空间）',
                flavorText: '每一束射线都在现实中留下裂缝'
            }
        ],
        upgrade: {
            damage: 8,
            description: '发射一束虚空能量，对目标造成8点伤害（射程3）',
            effects: [{ type: 'rangedDamage', value: 8 }]
        }
    },

    '星界箭矢': {
        name: '星界箭矢',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        forbiddenTier: 2,
        damage: 8,
        range: 4,
        needsTarget: true,
        description: '射出星界箭矢，造成8点伤害并击退1格（射程4）',
        effects: [
            { type: 'rangedDamage', value: 8 },
            { type: 'pushBack', value: 1 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'pushBack', value: 1 }],
                flavorText: '箭矢似乎有了自己的引力...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '星辰陨落',
                bonusEffects: [{ type: 'rangedDamage', value: 4 }, { type: 'aoe', value: 3 }],
                descOverride: '12远程+3溅射+击退2（星辰从天而降）',
                flavorText: '那已不是箭矢——那是坠落的星辰'
            }
        ],
        upgrade: {
            damage: 12,
            description: '射出星界箭矢，造成12点伤害并击退2格（射程4）',
            effects: [
                { type: 'rangedDamage', value: 12 },
                { type: 'pushBack', value: 2 }
            ]
        }
    },

    '精神侵蚀': {
        name: '精神侵蚀',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        forbiddenTier: 1,
        damage: 3,
        range: 3,
        needsTarget: true,
        description: '侵蚀目标精神，造成3点伤害+中毒(2×3回合)（射程3）',
        effects: [
            { type: 'rangedDamage', value: 3 },
            { type: 'dot', dotType: 'poison', dotName: '精神腐蚀', dotDamage: 2, duration: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityCost', value: 1, _mutated: true }],
                flavorText: '侵蚀的力量也在腐蚀你的理智...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '灵魂吞噬',
                bonusEffects: [{ type: 'rangedDamage', value: 3 }, { type: 'dot', dotType: 'poison', dotName: '灵魂腐蚀', dotDamage: 3, duration: 3 }],
                descOverride: '6远程+毒(3×3)+额外灵魂腐蚀',
                flavorText: '你不只侵蚀肉体——你在吞噬灵魂'
            }
        ],
        upgrade: {
            description: '侵蚀目标精神，造成5点伤害+中毒(3×3回合)（射程3）',
            effects: [
                { type: 'rangedDamage', value: 5 },
                { type: 'dot', dotType: 'poison', dotName: '精神腐蚀', dotDamage: 3, duration: 3 }
            ]
        }
    },

    '深渊炮击': {
        name: '深渊炮击',
        cost: 3,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 3,
        damage: 12,
        range: 5,
        needsTarget: true,
        description: '从深渊召唤毁灭力量，造成12点伤害+周围4点溅射（射程5）',
        effects: [
            { type: 'rangedDamage', value: 12 },
            { type: 'aoe', value: 4 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'aoe', value: 2 }],
                flavorText: '炮击的余波在扩散...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊湮灭',
                bonusEffects: [{ type: 'rangedDamage', value: 5 }, { type: 'aoe', value: 5 }],
                descOverride: '17远程+9溅射（毁灭性轰炸）',
                flavorText: '你召唤的不是炮弹——而是深渊本身的碎片'
            }
        ],
        upgrade: {
            description: '从深渊召唤毁灭力量，造成18点伤害+周围6点溅射（射程5）',
            effects: [
                { type: 'rangedDamage', value: 18 },
                { type: 'aoe', value: 6 }
            ]
        }
    },

    // ====================
    // 控制/策略卡
    // ====================

    '暗影束缚': {
        name: '暗影束缚',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        range: 2,
        needsTarget: true,
        description: '暗影束缚目标，眩晕1回合（射程2）',
        effects: [
            { type: 'stun', duration: 1 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 3 }],
                flavorText: '暗影也在保护你...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '暗影牢笼',
                bonusEffects: [{ type: 'stun', duration: 1 }, { type: 'sanityCost', value: 2, _mutated: true }],
                descOverride: '眩晕2回合-2SAN（暗影的笼罩）',
                flavorText: '暗影已化为牢笼，困住一切'
            }
        ],
        upgrade: {
            description: '暗影束缚目标，眩晕1回合+减速2（射程2）',
            effects: [
                { type: 'stun', duration: 1 },
                { type: 'debuff', stat: 'speed', value: 2, duration: 2 }
            ]
        }
    },

    '引力漩涡': {
        name: '引力漩涡',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 3,
        description: '释放引力场，拉近所有敌人2格',
        effects: [
            { type: 'pull', value: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'aoe', value: 3 }],
                flavorText: '漩涡中的引力在碾碎一切...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '空间崩塌',
                bonusEffects: [{ type: 'pull', value: 1 }, { type: 'aoe', value: 5 }],
                descOverride: '拉近3格+5全体伤害（空间正在崩塌）',
                flavorText: '引力已足以扭曲时空本身'
            }
        ],
        upgrade: {
            description: '释放引力场，拉近所有敌人3格',
            effects: [{ type: 'pull', value: 3 }]
        }
    },

    '恐怖凝视': {
        name: '恐怖凝视',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        range: 3,
        needsTarget: true,
        sanityCost: 2,
        description: '凝视使目标减攻3，持续2回合（射程3，消耗2SAN）',
        effects: [
            { type: 'debuff', stat: 'strength', value: 3, duration: 2 },
            { type: 'sanityCost', value: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'sanityCost', value: 1, _mutated: true }],
                flavorText: '你的双眼开始闪烁诡异的光...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '深渊之眼',
                bonusEffects: [{ type: 'rangedDamage', value: 5 }],
                descOverride: '减攻3+5伤害-2SAN（射程3）',
                flavorText: '你的目光已具备了杀伤力'
            }
        ],
        upgrade: {
            description: '凝视使目标减攻5，持续3回合（射程3，消耗2SAN）',
            effects: [
                { type: 'debuff', stat: 'strength', value: 5, duration: 3 },
                { type: 'sanityCost', value: 2 }
            ]
        }
    },

    '虚空陷阱': {
        name: '虚空陷阱',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        range: 2,
        needsTarget: true,
        description: '在目标脚下放置虚空陷阱（射程2）',
        effects: [
            { type: 'terrainDamage', terrain: 'void', terrainName: '虚空陷阱', duration: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 2 }],
                flavorText: '陷阱的力量在溢出...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '空间裂缝',
                bonusEffects: [{ type: 'terrainDamage' }, { type: 'sanityCost', value: 2, _mutated: true }],
                descOverride: '双层陷阱-2SAN（空间本身就是武器）',
                flavorText: '你在空间中撕开了裂缝'
            }
        ],
        upgrade: {
            description: '在目标脚下放置虚空陷阱+减速1（射程2）',
            effects: [
                { type: 'terrainDamage', terrain: 'void', terrainName: '虚空陷阱', duration: 4 },
                { type: 'debuff', stat: 'speed', value: 1, duration: 2 }
            ]
        }
    },

    // ====================
    // 地形/战术卡
    // ====================

    '虚空之门': {
        name: '虚空之门',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        forbiddenTier: 3,
        description: '打开虚空之门，传送到随机安全位置',
        effects: [
            { type: 'teleport' }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'gainBlock', value: 5 }],
                flavorText: '虚空之门也给予你保护...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '次元通道',
                bonusEffects: [{ type: 'gainMovement', value: 3 }, { type: 'gainBlock', value: 8 }],
                descOverride: '传送+3移动力+8格挡',
                flavorText: '你打开的不只是门——而是次元的通道'
            }
        ],
        upgrade: {
            description: '打开虚空之门，传送到随机安全位置并恢复2移动力',
            effects: [
                { type: 'teleport' },
                { type: 'gainMovement', value: 2 }
            ]
        }
    },

    '腐化之地': {
        name: '腐化之地',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        range: 3,
        needsTarget: true,
        sanityCost: 3,
        description: '将目标脚下化为毒地+中毒(2×3)（射程3，消耗3SAN）',
        effects: [
            { type: 'terrainDamage', terrain: 'madness', terrainName: '腐化之地', duration: 3 },
            { type: 'dot', dotType: 'poison', dotName: '地面腐蚀', dotDamage: 2, duration: 3 },
            { type: 'sanityCost', value: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'aoe', value: 2 }],
                flavorText: '腐化在蔓延到更广的范围...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '末日荒原',
                bonusEffects: [{ type: 'aoe', value: 4 }, { type: 'dot', dotType: 'poison', dotName: '深渊腐败', dotDamage: 3, duration: 2 }],
                descOverride: '毒地+中毒+4全体+深渊腐败-3SAN',
                flavorText: '你所到之处，大地都在腐烂'
            }
        ],
        upgrade: {
            description: '将目标脚下化为毒地+中毒(3×4)（射程3，消耗3SAN）',
            effects: [
                { type: 'terrainDamage', terrain: 'madness', terrainName: '腐化之地', duration: 4 },
                { type: 'dot', dotType: 'poison', dotName: '地面腐蚀', dotDamage: 3, duration: 4 },
                { type: 'sanityCost', value: 3 }
            ]
        }
    },

    // ====================
    // debuff/DOT 卡
    // ====================

    '灵魂腐蚀': {
        name: '灵魂腐蚀',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        forbiddenTier: 1,
        damage: 3,
        range: 2,
        needsTarget: true,
        description: '腐蚀灵魂，造成3点伤害+中毒(2×3)（射程2）',
        effects: [
            { type: 'rangedDamage', value: 3 },
            { type: 'dot', dotType: 'poison', dotName: '灵魂腐蚀', dotDamage: 2, duration: 3 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'rangedDamage', value: 1 }],
                flavorText: '腐蚀之力在增强...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '灵魂摧毁',
                bonusEffects: [{ type: 'rangedDamage', value: 3 }, { type: 'dot', dotType: 'poison', dotName: '灵魂碎裂', dotDamage: 2, duration: 2 }],
                descOverride: '6远程+毒+额外灵魂碎裂',
                flavorText: '你的攻击在瓦解目标的存在本身'
            }
        ],
        upgrade: {
            description: '腐蚀灵魂，造成5点伤害+中毒(3×3)（射程2）',
            effects: [
                { type: 'rangedDamage', value: 5 },
                { type: 'dot', dotType: 'poison', dotName: '灵魂腐蚀', dotDamage: 3, duration: 3 }
            ]
        }
    },

    '诅咒之触': {
        name: '诅咒之触',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        forbiddenTier: 1,
        range: 1,
        needsTarget: true,
        description: '诅咒触碰目标，减速2持续2回合（射程1）',
        effects: [
            { type: 'debuff', stat: 'speed', value: 2, duration: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'dot', dotType: 'poison', dotName: '诅咒', dotDamage: 1, duration: 2 }],
                flavorText: '触碰带来了额外的诅咒...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '诅咒蔓延',
                bonusEffects: [{ type: 'aoe', value: 2 }, { type: 'sanityCost', value: 1, _mutated: true }],
                descOverride: '减速+诅咒+2全体-1SAN（诅咒在蔓延）',
                flavorText: '你的触碰已足以诅咒整个世界'
            }
        ],
        upgrade: {
            description: '诅咒触碰目标，减速3持续3回合（射程1）',
            effects: [{ type: 'debuff', stat: 'speed', value: 3, duration: 3 }]
        }
    },

    '虚弱诅咒': {
        name: '虚弱诅咒',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        range: 2,
        needsTarget: true,
        description: '使目标攻击力降低3，持续2回合（射程2）',
        effects: [
            { type: 'debuff', stat: 'strength', value: 3, duration: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '诅咒的力量让你看到了更多...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '力量掠夺',
                bonusEffects: [{ type: 'attackBuff', value: 2 }],
                descOverride: '减攻3+手牌攻击+2（窃取敌人的力量）',
                flavorText: '你不只削弱敌人——你在窃取他们的力量'
            }
        ],
        upgrade: {
            description: '使目标攻击力降低5，持续3回合（射程2）',
            effects: [{ type: 'debuff', stat: 'strength', value: 5, duration: 3 }]
        }
    },

    '吸血触手': {
        name: '吸血触手',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        forbiddenTier: 2,
        damage: 6,
        range: 1,
        needsTarget: true,
        badge: '深渊使者',
        description: '触手吸取生命，造成6点伤害并恢复50%HP（射程1）',
        effects: [
            { type: 'vampiric', value: 6, healRatio: 0.5 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'heal', value: 2 }],
                flavorText: '触手在贪婪地汲取更多生命力...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '生命吞噬',
                bonusEffects: [{ type: 'vampiric', value: 4, healRatio: 0.5 }],
                descOverride: '10吸血攻击+额外4吸血',
                flavorText: '触手已成为永不满足的寄生兽'
            },
            {
                sanityThreshold: 0.15,
                replaceCard: {
                    name: '灵魂汲取',
                    cost: 1,
                    effects: [
                        { type: 'vampiric', value: 15, healRatio: 0.8 },
                        { type: 'sanityCost', value: 5 }
                    ],
                    description: '15吸血(80%回复)-5SAN（汲取灵魂而非血肉）'
                },
                flavorText: '你不再需要血——你吸食的是灵魂'
            }
        ],
        upgrade: {
            damage: 10,
            description: '触手吸取生命，造成10点伤害并恢复50%HP（射程1）',
            effects: [{ type: 'vampiric', value: 10, healRatio: 0.5 }]
        }
    },

    '穿甲射击': {
        name: '穿甲射击',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        forbiddenTier: 3,
        damage: 8,
        range: 3,
        needsTarget: true,
        description: '无视护甲造成8点伤害（射程3）',
        effects: [
            { type: 'piercingDamage', value: 8 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'piercingDamage', value: 2 }],
                flavorText: '射击穿透了更深的东西...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '维度穿刺',
                bonusEffects: [{ type: 'piercingDamage', value: 4 }, { type: 'aoe', value: 3 }],
                descOverride: '12穿甲+3溅射（射穿了维度的壁障）',
                flavorText: '你的射击穿越了维度的界限'
            }
        ],
        upgrade: {
            damage: 12,
            description: '无视护甲造成12点伤害（射程3）',
            effects: [{ type: 'piercingDamage', value: 12 }]
        }
    },

    // ====================
    // 黄衣信徒专属卡扩展
    // ====================

    '黄衣诅咒': {
        name: '黄衣诅咒',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        badge: '黄衣信徒',
        range: 3,
        needsTarget: true,
        description: '施加黄衣之王的诅咒，减攻3+中毒(2×2)（射程3）',
        effects: [
            { type: 'debuff', stat: 'strength', value: 3, duration: 2 },
            { type: 'dot', dotType: 'poison', dotName: '黄衣诅咒', dotDamage: 2, duration: 2 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'dot', dotType: 'poison', dotName: '黄印', dotDamage: 1, duration: 2 }],
                flavorText: '黄衣之王的诅咒在加深...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '哈斯塔之怒',
                bonusEffects: [{ type: 'aoe', value: 3 }, { type: 'sanityCost', value: 2, _mutated: true }],
                descOverride: '减攻3+中毒+3全体+黄印-2SAN',
                flavorText: '哈斯塔的怒火通过你降临于世'
            }
        ],
        upgrade: {
            description: '施加黄衣之王的诅咒，减攻5+中毒(3×3)（射程3）',
            effects: [
                { type: 'debuff', stat: 'strength', value: 5, duration: 3 },
                { type: 'dot', dotType: 'poison', dotName: '黄衣诅咒', dotDamage: 3, duration: 3 }
            ]
        }
    },

    '知识窃取': {
        name: '知识窃取',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        forbiddenTier: 2,
        badge: '黄衣信徒',
        range: 2,
        needsTarget: true,
        description: '窃取目标力量，对其减攻4+自己获得4格挡（射程2）',
        effects: [
            { type: 'debuff', stat: 'strength', value: 4, duration: 2 },
            { type: 'gainBlock', value: 4 }
        ],
        innerEffects: [
            {
                sanityThreshold: 0.7,
                bonusEffects: [{ type: 'drawCards', value: 1 }],
                flavorText: '窃取的知识中蕴含着更多...'
            },
            {
                sanityThreshold: 0.4,
                nameOverride: '灵魂剥离',
                bonusEffects: [{ type: 'gainBlock', value: 4 }, { type: 'attackBuff', value: 1 }],
                descOverride: '减攻4+8格挡+手牌攻击+1',
                flavorText: '你不再窃取知识——你在剥离灵魂'
            }
        ],
        upgrade: {
            description: '窃取目标力量，对其减攻6+自己获得6格挡（射程2）',
            effects: [
                { type: 'debuff', stat: 'strength', value: 6, duration: 3 },
                { type: 'gainBlock', value: 6 }
            ]
        }
    }
};

// 统计并输出卡牌数量
var cardCount = Object.keys(Cards).length;
var badgeCards = Object.values(Cards).filter(function (c: any) { return c.badge; }).length;
var sanityCards = Object.values(Cards).filter(function (c: any) { return c.sanityCost || c.sanityRestore; }).length;


export default Cards;
