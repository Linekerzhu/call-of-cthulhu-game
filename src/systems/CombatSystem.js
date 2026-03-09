/**
 * 战斗系统 - CombatSystem (ES5 兼容版)
 */

function CombatSystem(game) {
    this.game = game;
}

CombatSystem.prototype.startCombat = function(enemyType) {
    console.log('⚔️ CombatSystem.startCombat(' + enemyType + ')');
    
    this.game.state.combat = {
        type: enemyType,
        turn: 1,
        grid: this.generateGrid(),
        enemies: this.generateEnemies(enemyType),
        log: []
    };
    
    this.game.state.player.position = { row: 2, col: 0 };
    this.game.state.player.block = 0;
    
    this.startTurn();
};

CombatSystem.prototype.generateGrid = function() {
    var rows = 5;
    var cols = 8;
    var grid = [];
    
    for (var r = 0; r < rows; r++) {
        grid[r] = [];
        for (var c = 0; c < cols; c++) {
            // 只保留疯狂之地（扣理智的格子）
            var terrain = 'madness';
            
            grid[r][c] = {
                row: r,
                col: c,
                terrain: terrain,
                entity: null
            };
        }
    }
    
    return grid;
};

CombatSystem.prototype.generateEnemies = function(type) {
    var enemies = [];
    
    if (type === 'boss') {
        // Boss：深渊领主克苏鲁化身
        enemies.push({
            name: '深渊领主',
            icon: '🐙',
            hp: 100,
            maxHp: 100,
            position: { row: 2, col: 6 },
            intent: { type: 'attack', value: 12 },
            attackRange: 2,    // Boss攻击范围更大
            strength: 12,
            speed: 1,
            actions: 2,
            remainingActions: 2,
            tentacleSummon: true,  // 特殊能力：召唤触手
            description: '来自深渊的古老存在，不可名状的恐怖'
        });
    } else if (type === 'elite') {
        // 随机选择精英类型 - 克苏鲁风格
        var eliteType = Math.floor(Math.random() * 3);
        
        if (eliteType === 0) {
            // 深潜者祭司：高速度，会使用法术
            enemies.push({
                name: '深潜者祭司',
                icon: '🧜',
                hp: 35,
                maxHp: 35,
                position: { row: 1, col: 6 },
                intent: { type: 'attack', value: 6 },
                attackRange: 2,  // 法术射程
                strength: 6,
                speed: 2,
                actions: 1,
                remainingActions: 1,
                description: '侍奉古神的深潜者，使用水元素法术'
            });
        } else if (eliteType === 1) {
            // 修格斯：高HP，会分裂
            enemies.push({
                name: '修格斯',
                icon: '🦠',
                hp: 60,
                maxHp: 60,
                position: { row: 2, col: 6 },
                intent: { type: 'attack', value: 7 },
                attackRange: 1,
                strength: 7,
                speed: 1,
                actions: 1,
                block: 8,
                regeneration: 3,  // 每回合恢复3HP
                remainingActions: 1,
                description: '无定形的原生质怪物，拥有惊人的再生能力'
            });
        } else {
            // 星之眷族：高攻击，会疯狂凝视
            enemies.push({
                name: '星之眷族',
                icon: '👁️',
                hp: 30,
                maxHp: 30,
                position: { row: 2, col: 6 },
                intent: { type: 'attack', value: 10 },
                attackRange: 1,
                strength: 10,
                speed: 2,
                actions: 2,
                sanityDrain: 5,  // 攻击时减少玩家理智
                remainingActions: 2,
                description: '来自遥远星系的恐怖生物，直视它会失去理智'
            });
        }
    } else {
        // 普通敌人：克苏鲁风格怪物
        var enemyTypes = [
            { name: '深潜者', icon: '🐟', hp: 15, strength: 5, speed: 1, desc: '被诅咒的鱼人，成群结队出现' },
            { name: '食尸鬼', icon: '💀', hp: 12, strength: 6, speed: 2, desc: '墓地中爬出的不死生物，速度极快' },
            { name: '古老者', icon: '🦑', hp: 20, strength: 4, speed: 1, desc: '来自远古的文明种族，拥有坚韧的皮肤' },
            { name: '夜魇', icon: '🦇', hp: 10, strength: 4, speed: 3, desc: '深渊中的飞行怪物，速度极快但脆弱' },
            { name: '无形之子', icon: '🦠', hp: 10, strength: 3, speed: 1, desc: '来自深渊的粘液生物，较弱但数量多' },
            { name: '迷魅鼠', icon: '🐀', hp: 8, strength: 3, speed: 2, sanityDrain: 2, desc: '被古神污染的老鼠，尖叫声侵蚀理智' },
            { name: '空鬼', icon: '👻', hp: 14, strength: 4, speed: 2, sanityDrain: 3, desc: '来自异次元的幽灵，触碰会吸取理智' }
        ];
        
        var enemyCount = 2;
        var positions = [[1, 6], [3, 6]];
        
        for (var i = 0; i < enemyCount; i++) {
            var type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            var enemyData = {
                name: type.name,
                icon: type.icon,
                hp: type.hp,
                maxHp: type.hp,
                position: { row: positions[i][0], col: positions[i][1] },
                intent: { type: 'attack', value: type.strength },
                attackRange: 1,
                strength: type.strength,
                speed: type.speed,
                actions: 1,
                remainingActions: 1,
                description: type.desc
            };
            // 复制理智吸取属性
            if (type.sanityDrain) {
                enemyData.sanityDrain = type.sanityDrain;
            }
            enemies.push(enemyData);
        }
    }
    
    return enemies;
};

CombatSystem.prototype.startTurn = function() {
    var combat = this.game.state.combat;
    var player = this.game.state.player;
    console.log('🔄 开始第' + combat.turn + '回合');
    
    // 玩家回合开始时清零格挡（保留到敌人回合结束）
    if (player.block > 0) {
        this.game.log('格挡值清零');
        player.block = 0;
    }
    
    // 重置回合临时buff
    combat.turnPlayedCards = 0;
    combat.tempBuffs = {};
    
    // 重置疯狂状态
    if (combat.madnessTriggered) {
        combat.madnessTriggered = false;
        combat.madnessPenalty = false;
        this.game.log('🧠 理智逐渐恢复...');
    }
    
    // 每回合开始时恢复1点理智（基础恢复）
    if (player.sanity < player.maxSanity) {
        var sanityRegen = 1;
        player.sanity = Math.min(player.sanity + sanityRegen, player.maxSanity);
        this.game.log('🧠 回合开始恢复' + sanityRegen + '点理智');
    }
    
    // 旧日支配者被动：古老符文
    if (player.badge === '旧日支配者') {
        if (!combat.ancientRunes) combat.ancientRunes = 0;
        // 检查上回合获得的格挡
        if (combat.lastTurnBlock && combat.lastTurnBlock >= 8) {
            var bonusBlock = 2;
            player.block += bonusBlock;
            this.game.log('👁️ 古老符文触发！获得' + bonusBlock + '点格挡！');
            this.game.renderSystem.showPassiveEffect('古老符文 +' + bonusBlock + '格挡', '👁️');
        }
    }
    
    // 深渊使者被动：疯狂值效果检查
    if (player.badge === '深渊使者') {
        if (combat.madnessDoubler && combat.madnessDoubler > 0) {
            this.game.log('🐙 疯狂爆发！下一张攻击卡伤害翻倍！');
            this.game.renderSystem.showPassiveEffect('疯狂爆发！攻击翻倍', '🐙');
        }
    }
    
    // 更新SAN状态
    this.game.updateSanityState();
    
    // SAN状态效果：幻觉困扰 - 每回合失去能量
    var energyLoss = this.game.getSanityEffect('energyLoss');
    if (energyLoss > 0) {
        player.maxEnergy = Math.max(1, player.maxEnergy - energyLoss);
        this.game.log('🌀 幻觉困扰！最大能量-' + energyLoss + '！');
    } else {
        // 恢复最大能量
        player.maxEnergy = 3;
    }
    
    this.drawCards(5);
    player.energy = player.maxEnergy;
    player.movement = player.maxMovement;  // 重置移动力
    this.game.renderSystem.updateCombatUI();
    this.game.log('第' + combat.turn + '回合开始！');
};

CombatSystem.prototype.drawCards = function(count) {
    var player = this.game.state.player;
    
    for (var i = 0; i < count; i++) {
        if (player.hand.length >= 10) break;
        
        if (player.drawPile.length === 0) {
            if (player.discardPile.length === 0) break;
            player.drawPile = Utils.shuffle(player.discardPile);
            player.discardPile = [];
        }
        
        var card = player.drawPile.pop();
        player.hand.push(card);
    }
};

CombatSystem.prototype.endTurn = function() {
    console.log('⏹️ 结束回合');
    
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    
    // 保存本回合数据供下回合使用
    if (combat.blockGainedThisTurn) {
        combat.lastTurnBlock = combat.blockGainedThisTurn;
        console.log('🐢 本回合总格挡:' + combat.blockGainedThisTurn);
    }
    
    player.discardPile = player.discardPile.concat(player.hand);
    player.hand = [];
    // 注意：格挡值不在此处清零，保留到敌人回合结束
    
    var self = this;
    setTimeout(function() {
        self.enemyTurn();
    }, 500);
};

CombatSystem.prototype.enemyTurn = function() {
    var combat = this.game.state.combat;
    console.log('👹 敌人回合');
    
    var player = this.game.state.player;
    var self = this;
    
    // 收集所有存活的敌人
    var aliveEnemies = [];
    for (var i = 0; i < combat.enemies.length; i++) {
        if (combat.enemies[i].hp > 0) {
            aliveEnemies.push(combat.enemies[i]);
        }
    }
    
    // 如果没有敌人，直接结束
    if (aliveEnemies.length === 0) {
        combat.turn++;
        setTimeout(function() {
            self.startTurn();
        }, 1000);
        return;
    }
    
    // 递归处理每个敌人的行动，添加延迟让玩家看到动画
    function processEnemyActions(enemyIndex) {
        if (enemyIndex >= aliveEnemies.length) {
            // 所有敌人行动完成
            combat.turn++;
            self.game.renderSystem.renderEnemyPanel();
            setTimeout(function() {
                self.startTurn();
            }, 1000);
            return;
        }
        
        var enemy = aliveEnemies[enemyIndex];
        enemy.remainingActions = enemy.actions;
        
        // 黄衣信徒被动：疯狂诅咒 - 20%几率恐惧敌人
        if (player.badge === '黄衣信徒' && Math.random() < 0.2) {
            self.game.log('🎭 黄衣之王的诅咒！' + enemy.name + '陷入恐惧，跳过行动！');
            self.game.renderSystem.showPassiveEffect('🎭 恐惧！', enemy.icon);
            // 跳过此敌人，处理下一个
            setTimeout(function() {
                processEnemyActions(enemyIndex + 1);
            }, 800);
            return;
        }
        
        function doNextAction() {
            if (enemy.remainingActions <= 0) {
                // 当前敌人行动完成，处理下一个敌人
                setTimeout(function() {
                    processEnemyActions(enemyIndex + 1);
                }, 500);
                return;
            }
            
            var dist = Utils.manhattanDistance(
                enemy.position.row, enemy.position.col,
                player.position.row, player.position.col
            );
            
            if (dist <= enemy.attackRange) {
                // 在攻击范围内，进行攻击
                var damage = enemy.strength || enemy.intent.value;
                self.damagePlayer(damage, enemy);
                self.game.log(enemy.name + ' 攻击造成' + damage + '点伤害！');
                enemy.remainingActions--;
                
                // 攻击后延迟再执行下一个行动
                setTimeout(doNextAction, 600);
            } else {
                // 不在攻击范围内，根据速度移动
                var moved = self.moveEnemyWithSpeed(enemy);
                if (!moved) {
                    // 无法移动，跳过剩余行动
                    enemy.remainingActions = 0;
                    setTimeout(function() {
                        processEnemyActions(enemyIndex + 1);
                    }, 500);
                    return;
                }
                
                // 移动后立即渲染，让玩家看到位置变化
                self.game.renderSystem.renderGrid();
                self.game.renderSystem.renderEnemyPanel();
                enemy.remainingActions--;
                
                // 移动后检查是否在射程内，如果在则攻击
                var newDist = Utils.manhattanDistance(
                    enemy.position.row, enemy.position.col,
                    player.position.row, player.position.col
                );
                
                if (newDist <= enemy.attackRange && enemy.remainingActions > 0) {
                    // 移动后进入射程，继续执行以进行攻击
                    setTimeout(doNextAction, 500);
                } else {
                    // 移动后仍不在射程内或无行动点，结束回合
                    setTimeout(function() {
                        processEnemyActions(enemyIndex + 1);
                    }, 500);
                }
            }
        }
        
        // 开始当前敌人的行动
        doNextAction();
    }
    
    // 开始处理第一个敌人
    processEnemyActions(0);
};

// 新移动方法：根据速度移动多格
CombatSystem.prototype.moveEnemyWithSpeed = function(enemy) {
    var player = this.game.state.player;
    var speed = enemy.speed || 1;
    var moved = false;
    
    for (var step = 0; step < speed; step++) {
        var dr = player.position.row - enemy.position.row;
        var dc = player.position.col - enemy.position.col;
        
        // 如果已经在攻击范围内，停止移动
        if (Math.abs(dr) + Math.abs(dc) <= enemy.attackRange) {
            break;
        }
        
        var newRow = enemy.position.row;
        var newCol = enemy.position.col;
        
        // 选择距离更大的方向移动
        if (Math.abs(dr) > Math.abs(dc)) {
            newRow += dr > 0 ? 1 : -1;
        } else {
            newCol += dc > 0 ? 1 : -1;
        }
        
        // 检查边界
        if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 8) {
            enemy.position.row = newRow;
            enemy.position.col = newCol;
            moved = true;
        } else {
            // 无法继续移动
            break;
        }
    }
    
    if (moved) {
        this.game.log(enemy.name + ' 移动了' + (speed > 1 ? speed + '格' : ''));
    }
    
    return moved;
};

// 旧移动方法（保留兼容）
CombatSystem.prototype.moveEnemy = function(enemy) {
    var player = this.game.state.player;
    var dr = player.position.row - enemy.position.row;
    var dc = player.position.col - enemy.position.col;
    
    var newRow = enemy.position.row;
    var newCol = enemy.position.col;
    
    if (Math.abs(dr) > Math.abs(dc)) {
        newRow += dr > 0 ? 1 : -1;
    } else {
        newCol += dc > 0 ? 1 : -1;
    }
    
    if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 8) {
        enemy.position.row = newRow;
        enemy.position.col = newCol;
        this.game.log(enemy.name + ' 移动了！');
    }
    
    this.game.renderSystem.renderGrid();
};

CombatSystem.prototype.damagePlayer = function(amount, attacker) {
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    var actualDamage = amount;
    
    if (player.block > 0) {
        if (player.block >= amount) {
            player.block -= amount;
            actualDamage = 0;
        } else {
            actualDamage -= player.block;
            player.block = 0;
        }
    }
    
    player.hp -= actualDamage;
    
    // 显示伤害数字
    if (actualDamage > 0) {
        this.game.renderSystem.showDamageNumber(player.position.row, player.position.col, actualDamage);
    }
    
    // 理智值吸取：攻击者可能有sanityDrain属性
    if (attacker && attacker.sanityDrain && player.sanity > 0) {
        var sanityLoss = attacker.sanityDrain;
        player.sanity = Math.max(0, player.sanity - sanityLoss);
        this.game.log('🧠 ' + attacker.name + '的凝视使你失去' + sanityLoss + '点理智！');
        this.game.renderSystem.showFloatingText(player.position.row, player.position.col, '-' + sanityLoss + '🧠', '#9370DB');
        // 更新SAN状态
        this.game.updateSanityState();
    }
    
    // 反弹效果：如果被攻击且有反弹buff，对攻击者造成伤害
    if (attacker && combat.tempBuffs && combat.tempBuffs.reflect && combat.tempBuffs.reflect > 0) {
        var reflectDamage = combat.tempBuffs.reflect;
        attacker.hp -= reflectDamage;
        this.game.log('👁️ 反弹！' + attacker.name + '受到' + reflectDamage + '点反弹伤害！');
        this.game.renderSystem.showDamageNumber(attacker.position.row, attacker.position.col, reflectDamage);
        
        if (attacker.hp <= 0) {
            attacker.hp = 0;
            this.game.renderSystem.playDeathAnimation(attacker.position.row, attacker.position.col);
            this.game.log(attacker.name + '被反弹击杀了！');
        }
    }
    
    // 检查理智值归零
    if (player.sanity <= 0 && !combat.madnessTriggered) {
        this.triggerMadness();
    }
    
    if (player.hp <= 0) {
        player.hp = 0;
        this.game.gameOver(false);
    }
    
    this.game.renderSystem.updateCombatUI();
};

// 触发疯狂状态
CombatSystem.prototype.triggerMadness = function() {
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    
    combat.madnessTriggered = true;
    this.game.log('🌀 你的理智已经崩溃！陷入疯狂状态！');
    this.game.renderSystem.showPassiveEffect('疯狂！所有卡牌费用+1', '🌀');
    
    // 疯狂效果：本回合所有卡牌费用+1
    combat.madnessPenalty = true;
};

CombatSystem.prototype.checkEnd = function() {
    var combat = this.game.state.combat;
    var aliveEnemies = [];
    
    for (var i = 0; i < combat.enemies.length; i++) {
        if (combat.enemies[i].hp > 0) {
            aliveEnemies.push(combat.enemies[i]);
        }
    }
    
    if (aliveEnemies.length === 0) {
        this.game.log('战斗胜利！');
        this.game.state.player.gold += 10;
        
        var self = this;
        setTimeout(function() {
            self.endCombat();
        }, 2000);
        
        return true;
    }
    
    return false;
};

CombatSystem.prototype.endCombat = function() {
    this.game.showScreen('map');
    this.game.state.combat = null;
    
    var map = this.game.state.map;
    var currentNode = map.currentNode;
    
    if (currentNode < map.nodes.length) {
        map.nodes[currentNode].visited = true;
    }
    
    map.currentNode++;
    if (map.currentNode < map.nodes.length) {
        map.nodes[map.currentNode].available = true;
        this.game.renderSystem.renderMap();
    } else {
        if (this.game.state.floor < 2) {
            this.game.startFloor(this.game.state.floor + 1);
        } else {
            this.game.gameOver(true);
        }
    }
};

console.log('✅ CombatSystem.js (ES5) 加载完成');
