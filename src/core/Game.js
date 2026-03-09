/**
 * 游戏核心类 - Game.js
 * 
 * @fileOverview 深渊召唤游戏的主控制器
 * @description 管理游戏状态、玩家数据、地图生成和场景切换
 * @version 0.2.0
 * 
 * 游戏流程:
 * 1. 标题画面 -> 2. 徽章选择 -> 3. 地图探索 -> 4. 战斗/事件 -> 5. 结算
 */

/**
 * Game 构造函数
 * @constructor
 * 初始化游戏状态和各个子系统
 */
function Game() {
    console.log('🎮 Game 构造函数');
    
    /**
     * 游戏状态对象
     * @property {string} phase - 当前游戏阶段 (title/badge/map/combat/...)
     * @property {Object} player - 玩家数据
     * @property {Object} map - 当前地图数据
     * @property {Object} combat - 当前战斗数据
     * @property {number} floor - 当前层数 (1-3)
     * @property {number} turn - 当前回合数
     * @property {number} gold - 金币数量
     */
    this.state = {
        phase: 'title',
        player: null,
        map: null,
        combat: null,
        floor: 0,
        turn: 0,
        gold: 0
    };
    
    // 子系统引用
    this.renderSystem = null;
    this.inputSystem = null;
    this.combatSystem = null;
    this.audioSystem = null;
    
    this.init();
}

/**
 * 初始化游戏
 * 创建所有子系统并初始化玩家
 */
Game.prototype.init = function() {
    console.log('🔧 Game.init()');
    
    this.renderSystem = new RenderSystem(this);
    this.inputSystem = new InputSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.audioSystem = new AudioSystem(this);
    
    this.initPlayer();
};

/**
 * 初始化玩家数据
 * 设置初始属性、卡组和状态
 */
Game.prototype.initPlayer = function() {
    this.state.player = {
        // 生命值
        hp: 50,
        maxHp: 50,
        
        // 能量系统（每回合使用卡牌的资源）
        energy: 3,
        maxEnergy: 3,
        
        // 移动系统
        movement: 3,        // 当前移动力
        maxMovement: 3,     // 最大移动力
        agility: 3,         // 敏捷属性
        
        // 防御
        block: 0,
        
        // 资源
        gold: 0,
        
        // ===== 克苏鲁主题：理智值系统 =====
        sanity: 50,         // 当前理智值
        maxSanity: 50,      // 最大理智值
        madness: 0,         // 疯狂值（深渊使者徽章使用）
        sanityLevel: 5,     // 理智等级 5=正常, 4=轻微, 3=轻度, 2=中度, 1=严重, 0=疯狂
        
        // 卡组系统
        deck: [],           // 完整卡组
        hand: [],           // 当前手牌
        drawPile: [],       // 抽牌堆
        discardPile: [],    // 弃牌堆
        
        // 位置
        position: { row: 2, col: 0 },
        
        // 徽章
        badge: null
    };
};

/**
 * 切换游戏画面
 * @param {string} screenName - 画面名称
 */
Game.prototype.showScreen = function(screenName) {
    console.log('📱 显示屏幕: ' + screenName);
    
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    
    var targetScreen = document.getElementById('screen-' + screenName);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    this.state.phase = screenName;
};

/**
 * 开始新游戏
 * 重置所有状态并进入徽章选择
 */
Game.prototype.startGame = function() {
    console.log('🚀 Game.startGame()');
    
    this.initPlayer();
    this.state.floor = 1;
    this.state.gold = 0;
    
    // 显示徽章选择界面
    this.showBadgeSelect();
};

/**
 * 显示徽章选择界面
 */
Game.prototype.showBadgeSelect = function() {
    console.log('📛 显示徽章选择');
    
    this.showScreen('badge');
    this.renderSystem.renderBadgeSelect();
};

/**
 * 选择徽章
 * @param {string} badgeId - 徽章ID
 * 
 * 流程:
 * 1. 添加基础卡牌
 * 2. 应用徽章效果和专属卡牌
 * 3. 初始化抽牌堆
 * 4. 开始第一层
 */
Game.prototype.selectBadge = function(badgeId) {
    console.log('🏅 选择徽章: ' + badgeId);
    
    // 播放选择音效
    if (this.audioSystem) {
        this.audioSystem.playSelect();
    }
    
    // 先添加基础卡牌
    this.giveStartingDeck();
    
    // 再应用徽章效果（添加专属卡牌）
    BadgeManager.applyBadge(this.state.player, badgeId);
    
    // 重新初始化抽牌堆（包含职业专属牌）
    this.state.player.drawPile = Utils.shuffle(this.state.player.deck.slice());
    this.state.player.discardPile = [];
    this.state.player.hand = [];
    
    console.log('📊 最终卡组数量: ' + this.state.player.deck.length);
    console.log('📊 抽牌堆数量: ' + this.state.player.drawPile.length);
    
    // 开始第一层
    this.startFloor(1);
};

/**
 * 给予初始卡组
 * 克苏鲁版本的基础卡牌
 */
Game.prototype.giveStartingDeck = function() {
    var startingCards = [
        '疯狂挥击', '疯狂挥击', '疯狂挥击',
        '理智屏障', '理智屏障',
        '逃离深渊'
    ];
    
    this.state.player.deck = [];
    for (var i = 0; i < startingCards.length; i++) {
        var name = startingCards[i];
        var cardData = Cards[name];
        if (cardData) {
            this.state.player.deck.push({
                name: name,
                cost: cardData.cost,
                type: cardData.type,
                damage: cardData.damage,
                block: cardData.block,
                range: cardData.range,
                description: cardData.description
            });
        } else {
            console.error('❌ 基础卡牌不存在: ' + name);
        }
    }
    
    this.state.player.drawPile = Utils.shuffle(this.state.player.deck.slice());
};

/**
 * 开始新楼层
 * @param {number} floorNum - 楼层编号 (1-3)
 */
Game.prototype.startFloor = function(floorNum) {
    console.log('🏰 开始第' + floorNum + '层');
    this.state.floor = floorNum;
    this.generateMap(floorNum);
    this.showScreen('map');
    this.renderSystem.renderMap();
};

/**
 * 生成地图
 * @param {number} floor - 楼层编号
 * 
 * 地图结构:
 * - 第0层: 起点
 * - 第1层: 分叉路（普通/精英）
 * - 第2层: 休息/商店
 * - 第3层: 战斗/精英
 * - 第4层: Boss
 */
Game.prototype.generateMap = function(floor) {
    this.state.map = {
        floor: floor,
        nodes: [],
        currentNode: 0,
        branches: []
    };
    
    // 创建节点树结构
    this.addMapNode(0, 'start', [], [1, 2]);      // 起点
    this.addMapNode(1, 'combat', [0], [3]);       // 普通路
    this.addMapNode(2, 'elite', [0], [3], true);  // 精英路（高难度）
    this.addMapNode(3, floor === 1 ? 'rest' : 'shop', [1, 2], [4]);
    this.addMapNode(4, floor === 1 ? 'combat' : 'elite', [3], [5]);
    this.addMapNode(5, 'boss', [4], []);
    
    // 标记起点和第一个可用节点
    this.state.map.nodes[0].visited = true;
    this.state.map.nodes[1].available = true;
    this.state.map.nodes[2].available = true;
};

/**
 * 添加地图节点
 * @param {number} id - 节点ID
 * @param {string} type - 节点类型
 * @param {number[]} parentIds - 父节点ID数组
 * @param {number[]} childIds - 子节点ID数组
 * @param {boolean} isHard - 是否高难度路线
 */
Game.prototype.addMapNode = function(id, type, parentIds, childIds, isHard) {
    this.state.map.nodes.push({
        id: id,
        type: type,
        parents: parentIds || [],
        children: childIds || [],
        visited: false,
        available: false,
        isHard: isHard || false,
        icon: this.getNodeIcon(type, isHard)
    });
};

/**
 * 获取节点图标
 * @param {string} type - 节点类型
 * @param {boolean} isHard - 是否高难度
 * @returns {string} 图标字符
 */
Game.prototype.getNodeIcon = function(type, isHard) {
    var icons = {
        'start': '🏠',
        'combat': '⚔️',
        'elite': '💀',
        'rest': '🏕️',
        'shop': '🏪',
        'boss': '👑'
    };
    return icons[type] || '❓';
};

/**
 * 获取节点显示名称
 * @param {string} type - 节点类型
 * @returns {string} 节点名称
 */
Game.prototype.getNodeName = function(type) {
    var names = {
        'start': '起点',
        'combat': '战斗',
        'elite': '精英',
        'rest': '休息',
        'shop': '商店',
        'boss': 'Boss'
    };
    return names[type] || type;
};

/**
 * 推进地图
 * @param {number} nodeIndex - 目标节点索引
 */
Game.prototype.advanceMap = function(nodeIndex) {
    var map = this.state.map;
    var node = map.nodes[nodeIndex];
    
    node.visited = true;
    map.currentNode = nodeIndex;
    
    // 禁用所有其他available节点
    for (var i = 0; i < map.nodes.length; i++) {
        if (i !== nodeIndex && map.nodes[i].available && !map.nodes[i].visited) {
            var isChild = false;
            for (var j = 0; j < node.children.length; j++) {
                if (node.children[j] === i) {
                    isChild = true;
                    break;
                }
            }
            if (!isChild) {
                map.nodes[i].available = false;
            }
        }
    }
    
    // 解锁子节点
    if (node.children && node.children.length > 0) {
        for (var i = 0; i < node.children.length; i++) {
            var childId = node.children[i];
            map.nodes[childId].available = true;
        }
    }
    
    // 检查是否到达终点
    if (node.type === 'boss') {
        if (this.state.floor < 2) {
            this.startFloor(this.state.floor + 1);
        } else {
            this.gameOver(true);
        }
    } else {
        this.renderSystem.renderMap();
    }
};

/**
 * 开始战斗
 * @param {string} enemyType - 敌人类型 (combat/elite/boss)
 */
Game.prototype.startCombat = function(enemyType) {
    console.log('⚔️ 开始战斗: ' + enemyType);
    this.combatSystem.startCombat(enemyType);
    this.showScreen('combat');
    this.renderSystem.renderCombat();
};

/**
 * 显示战斗奖励界面
 */
Game.prototype.showRewardScreen = function() {
    console.log('🎁 显示战斗奖励');
    
    if (this.audioSystem) {
        this.audioSystem.playVictory();
    }
    
    this.showScreen('reward');
    this.renderSystem.renderRewardScreen();
};

/**
 * 显示休息站界面
 */
Game.prototype.showRestScreen = function() {
    console.log('🏕️ 显示休息站');
    this.showScreen('rest');
    this.renderSystem.renderRestScreen();
};

/**
 * 显示商店界面
 */
Game.prototype.showShopScreen = function() {
    console.log('🏪 显示商店');
    this.showScreen('shop');
    this.renderSystem.renderShopScreen();
};

/**
 * 显示牌库界面
 * @param {string} fromScreen - 返回的目标画面
 */
Game.prototype.showDeckViewer = function(fromScreen) {
    console.log('🎴 显示牌库');
    this.showScreen('deck');
    this.renderSystem.renderDeckViewer(fromScreen);
};

/**
 * 选择奖励卡牌
 * @param {string} cardName - 卡牌名称
 */
Game.prototype.selectRewardCard = function(cardName) {
    console.log('🎁 选择奖励: ' + cardName);
    
    if (this.audioSystem) {
        this.audioSystem.playSelect();
    }
    
    if (Cards[cardName]) {
        var cardCopy = {};
        for (var key in Cards[cardName]) {
            cardCopy[key] = Cards[cardName][key];
        }
        this.state.player.deck.push(cardCopy);
        
        if (this.state.combat && this.state.combat.active) {
            this.state.player.drawPile.push(cardCopy);
            this.log(cardName + ' 已加入卡组并进入抽牌堆！');
        } else {
            this.state.player.discardPile.push(cardCopy);
            this.log(cardName + ' 已加入卡组并进入弃牌堆！');
        }
    }
    
    this.showScreen('map');
    this.advanceMap(this.state.map.currentNode + 1);
};

/**
 * 跳过奖励
 */
Game.prototype.skipReward = function() {
    console.log('⏭️ 跳过奖励');
    this.state.player.gold += 15;
    this.log('获得15金币！');
    this.showScreen('map');
    this.advanceMap(this.state.map.currentNode + 1);
};

/**
 * 结束回合
 */
Game.prototype.endTurn = function() {
    this.combatSystem.endTurn();
};

/**
 * 游戏结束
 * @param {boolean} victory - 是否胜利
 */
Game.prototype.gameOver = function(victory) {
    console.log('🏁 游戏结束: ' + (victory ? '胜利' : '失败'));
    
    if (this.audioSystem) {
        if (victory) {
            this.audioSystem.playVictory();
        } else {
            this.audioSystem.playDefeat();
        }
    }
    
    this.showScreen('gameover');
    
    var title = document.getElementById('gameover-title');
    var message = document.getElementById('gameover-message');
    
    if (victory) {
        title.textContent = '🎉 你抵抗住了疯狂！';
        message.textContent = '古神在你的意志面前退却了...';
    } else {
        title.textContent = '💀 你已陷入疯狂...';
        message.textContent = '深渊最终吞噬了你的理智...';
    }
};

/**
 * 重新开始游戏
 */
Game.prototype.restartGame = function() {
    this.startGame();
};

/**
 * 添加战斗日志
 * @param {string} message - 日志消息
 */
Game.prototype.log = function(message) {
    if (this.state.combat) {
        this.state.combat.log.push(message);
        this.renderSystem.updateLog();
    }
};

// ====================
// SAN值状态系统
// ====================

/**
 * SAN值状态定义
 * 理智等级从5（正常）到0（疯狂）
 */
Game.prototype.SANITY_STATES = {
    5: { name: '理智清醒', level: 5, threshold: 1.0, desc: '你的思维清晰，行动如常' },
    4: { name: '轻微不安', level: 4, threshold: 0.8, desc: '一种莫名的不安笼罩着你，卡牌费用+1', effect: 'costPlus1' },
    3: { name: '恐惧蔓延', level: 3, threshold: 0.6, desc: '恐惧开始侵蚀你的判断力，伤害-20%', effect: 'damageMinus20' },
    2: { name: '幻觉困扰', level: 2, threshold: 0.4, desc: '幻象开始干扰你的感知，每回合失去1能量', effect: 'energyLoss' },
    1: { name: '精神崩溃', level: 1, threshold: 0.2, desc: '理智濒临崩溃，无法获得格挡', effect: 'noBlock' },
    0: { name: '彻底疯狂', level: 0, threshold: 0.0, desc: '你已经陷入疯狂！所有卡牌费用+2', effect: 'madness' }
};

/**
 * 检查并更新SAN值状态
 * 根据当前理智值比例更新理智等级
 */
Game.prototype.updateSanityState = function() {
    var player = this.state.player;
    var sanityRatio = player.sanity / player.maxSanity;
    var newLevel = 5;
    
    // 根据SAN值比例确定等级
    if (sanityRatio <= 0) {
        newLevel = 0;
    } else if (sanityRatio < 0.2) {
        newLevel = 1;
    } else if (sanityRatio < 0.4) {
        newLevel = 2;
    } else if (sanityRatio < 0.6) {
        newLevel = 3;
    } else if (sanityRatio < 0.8) {
        newLevel = 4;
    }
    
    // 如果等级下降（状态恶化），显示警告
    if (newLevel < player.sanityLevel) {
        var state = this.SANITY_STATES[newLevel];
        this.log('🌀 【' + state.name + '】' + state.desc);
        this.renderSystem.showPassiveEffect('🌀 ' + state.name, '🧠');
    }
    
    // 如果等级上升（恢复理智），显示恢复信息
    if (newLevel > player.sanityLevel) {
        var state = this.SANITY_STATES[newLevel];
        this.log('🧠 理智恢复：【' + state.name + '】');
    }
    
    player.sanityLevel = newLevel;
};

/**
 * 获取当前SAN状态效果
 * @param {string} effectType - 效果类型
 * @returns {number|boolean} 效果值
 * 
 * 效果类型:
 * - costIncrease: 费用增加
 * - damageMultiplier: 伤害倍数
 * - energyLoss: 每回合能量损失
 * - canGainBlock: 是否能获得格挡
 */
Game.prototype.getSanityEffect = function(effectType) {
    var player = this.state.player;
    var level = player.sanityLevel;
    
    switch (effectType) {
        case 'costIncrease':
            if (level === 0) return 2;
            if (level === 4) return 1;
            return 0;
            
        case 'damageMultiplier':
            if (level <= 3) return 0.8;
            return 1.0;
            
        case 'energyLoss':
            return level <= 2 ? 1 : 0;
            
        case 'canGainBlock':
            return level > 1;
            
        default:
            return null;
    }
};

console.log('✅ Game.js (ES5) 加载完成');
