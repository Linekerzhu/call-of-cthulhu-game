/**
 * 敌人模板数据 - Enemies.js
 *
 * @fileOverview 所有敌人类型的配置定义
 * @description 新增怪物只需在对应数组中添加一条配置，零修改 CombatSystem.js
 *
 * 敌人属性说明:
 *   name         - 敌人名称
 *   icon         - Emoji 图标
 *   hp           - 生命值
 *   strength     - 攻击力
 *   speed        - 移动速度（每回合移动格数）
 *   attackRange  - 攻击范围（曼哈顿距离，默认 1）
 *   actions      - 每回合行动次数（默认 1）
 *   description  - 描述文字
 *
 * 可选特殊属性:
 *   sanityDrain  - 攻击时额外扣除玩家理智值
 *   block        - 初始护盾值
 *   regeneration - 每回合恢复 HP 量
 *   tentacleSummon - Boss 特殊能力：召唤触手
 */

const EnemyTemplates: Record<string, any[]> = {

    // ====================
    // 普通敌人
    // ====================
    normal: [
        {
            name: '深潜者',
            icon: '🐟',
            hp: 15,
            strength: 5,
            speed: 1,
            description: '被诅咒的鱼人，成群结队出现'
        },
        {
            name: '食尸鬼',
            icon: '💀',
            hp: 12,
            strength: 6,
            speed: 2,
            description: '墓地中爬出的不死生物，速度极快'
        },
        {
            name: '古老者',
            icon: '🦑',
            hp: 20,
            strength: 4,
            speed: 1,
            description: '来自远古的文明种族，拥有坚韧的皮肤'
        },
        {
            name: '夜魇',
            icon: '🦇',
            hp: 10,
            strength: 4,
            speed: 3,
            description: '深渊中的飞行怪物，速度极快但脆弱'
        },
        {
            name: '无形之子',
            icon: '🦠',
            hp: 10,
            strength: 3,
            speed: 1,
            description: '来自深渊的粘液生物，较弱但数量多'
        },
        {
            name: '迷魅鼠',
            icon: '🐀',
            hp: 8,
            strength: 3,
            speed: 2,
            sanityDrain: 2,
            description: '被古神污染的老鼠，尖叫声侵蚀理智'
        },
        {
            name: '空鬼',
            icon: '👻',
            hp: 14,
            strength: 4,
            speed: 2,
            sanityDrain: 3,
            description: '来自异次元的幽灵，触碰会吸取理智'
        },
        // === 新增普通敌人 ===
        {
            name: '暗影猎手',
            icon: '🗡️',
            hp: 11,
            strength: 7,
            speed: 3,
            description: '高速刺客，穿甲攻击忽视护盾',
            abilities: [
                { type: 'debuff', target: 'player', stat: 'speed', value: 1, duration: 1 }
            ]
        },
        {
            name: '诅咒编织者',
            icon: '🕷️',
            hp: 12,
            strength: 3,
            speed: 1,
            description: '远程施法者，释放诅咒和毒素',
            abilities: [
                { type: 'rangedAttack', range: 3, damage: 4 },
                { type: 'applyDot', dotType: 'poison', dotName: '蛛毒', value: 2, duration: 3 },
                { type: 'debuff', target: 'player', stat: 'strength', value: 2, duration: 2 }
            ]
        },
        {
            name: '深海护卫',
            icon: '🛡️',
            hp: 25,
            strength: 3,
            speed: 1,
            block: 5,
            regeneration: 2,
            description: '高甲坦克，保护友军并缓慢再生',
            abilities: [
                { type: 'shield', value: 5 },
                { type: 'buff', stat: 'strength', value: 2, duration: 2 }
            ]
        },
        {
            name: '腐化触手',
            icon: '🦑',
            hp: 8,
            strength: 2,
            speed: 0,
            description: '不移动的DOT光环，周围格子持续伤害',
            abilities: [
                { type: 'applyDot', dotType: 'poison', dotName: '腐化', value: 2, duration: 2 },
                { type: 'curse', sanityCost: 3 }
            ]
        }
    ],

    // ====================
    // 精英敌人
    // ====================
    elite: [
        {
            name: '深潜者祭司',
            icon: '🧜',
            hp: 35,
            strength: 6,
            speed: 2,
            attackRange: 2,
            description: '侍奉古神的深潜者，使用水元素法术',
            abilities: [
                { type: 'rangedAttack', range: 3, damage: 5 },
                { type: 'applyDot', dotType: 'poison', dotName: '深海诅咒', value: 3, duration: 3 },
                { type: 'buff', stat: 'strength', value: 3, duration: 2 }
            ]
        },
        {
            name: '修格斯',
            icon: '🦠',
            hp: 60,
            strength: 7,
            speed: 1,
            block: 8,
            regeneration: 3,
            description: '无定形的原生质怪物，拥有惊人的再生能力',
            abilities: [
                { type: 'shield', value: 8 },
                { type: 'buff', stat: 'strength', value: 2, duration: 3 }
            ]
        },
        {
            name: '星之眷族',
            icon: '👁️',
            hp: 30,
            strength: 10,
            speed: 2,
            actions: 2,
            sanityDrain: 5,
            description: '来自遥远星系的恐怖生物，直视它会失去理智',
            abilities: [
                { type: 'rangedAttack', range: 3, damage: 6 },
                { type: 'curse', sanityCost: 8 },
                { type: 'debuff', target: 'player', stat: 'strength', value: 3, duration: 2 }
            ]
        }
    ],

    // ====================
    // Boss
    // ====================
    boss: [
        {
            name: '深渊领主',
            icon: '🐙',
            hp: 100,
            strength: 12,
            speed: 1,
            attackRange: 2,
            actions: 2,
            tentacleSummon: true,
            description: '来自深渊的古老存在，不可名状的恐怖',
            abilities: [
                { type: 'shield', value: 10 },
                { type: 'summon', template: '腐化触手' },
                { type: 'curse', sanityCost: 10 },
                { type: 'applyDot', dotType: 'burn', dotName: '深渊灼烧', value: 4, duration: 3 }
            ]
        }
    ]
};

export default EnemyTemplates;
