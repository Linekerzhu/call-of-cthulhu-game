/**
 * 输入系统 - InputSystem (ES5 兼容版)
 */

function InputSystem(game) {
    this.game = game;
    this.selectedCard = null;
    this.movePreview = null;  // 移动预览目标位置
}

InputSystem.prototype.handleCellClick = function(row, col) {
    console.log('🖱️ handleCellClick(' + row + ', ' + col + ')');
    
    var combat = this.game.state.combat;
    if (!combat) return;
    
    var player = this.game.state.player;
    var grid = combat.grid;
    
    // 如果有选中的卡牌
    if (this.selectedCard !== null) {
        var enemy = this.getEnemyAt(row, col);
        // 如果点击的是敌人，使用卡牌
        if (enemy) {
            this.useCardOnCell(this.selectedCard, row, col);
        } else {
            // 点击空地，取消选择
            console.log('❌ 取消选择');
            this.clearSelection();
            this.game.renderSystem.clearMovePreview();
        }
        return;
    }
    
    // 如果点击了非预览目标的位置，清除预览
    if (this.movePreview && (this.movePreview.row !== row || this.movePreview.col !== col)) {
        this.movePreview = null;
        this.game.renderSystem.clearMovePreview();
        // 继续处理新的点击（可能显示新的预览）
    }
    
    var dist = Utils.manhattanDistance(
        player.position.row, player.position.col,
        row, col
    );
    
    // 检查是否是同一个格子（取消预览）
    if (this.movePreview && this.movePreview.row === row && this.movePreview.col === col) {
        // 确认移动
        this.confirmMove();
        return;
    }
    
    // 使用移动力而不是能量
    if (player.movement < dist) {
        console.log('⚠️ 移动力不足，需要' + dist + '点，当前' + player.movement + '点');
        this.game.log('移动力不足！需要' + dist + '点');
        return;
    }
    
    var enemy = this.getEnemyAt(row, col);
    if (enemy) {
        console.log('⚠️ 格子上有人');
        return;
    }
    
    // 显示移动预览
    this.showMovePreview(row, col, dist);
};

InputSystem.prototype.handleCardClick = function(index) {
    console.log('🃏 handleCardClick(' + index + ')');
    
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    var card = player.hand[index];
    
    if (!card) return;
    
    // 计算实际费用（SAN状态影响）
    var actualCost = card.cost;
    var costIncrease = this.game.getSanityEffect('costIncrease');
    actualCost += costIncrease;
    
    if (player.energy < actualCost) {
        console.log('⚠️ 能量不足');
        return;
    }
    
    // 检查理智值消耗
    if (card.sanityCost && player.sanity < card.sanityCost) {
        console.log('⚠️ 理智值不足');
        this.game.log('🌀 理智值不足以释放这张卡的力量！');
        return;
    }
    
    if (card.type === 'move') {
        this.useCard(index);
    } else if (card.type === 'attack') {
        this.selectedCard = index;
        console.log('🎯 请选择攻击目标');
    } else {
        this.useCard(index);
    }
};

InputSystem.prototype.useCardOnCell = function(cardIndex, row, col) {
    var card = this.game.state.player.hand[cardIndex];
    if (!card) return;
    
    // 播放卡牌使用音效
    if (this.game.audioSystem) {
        this.game.audioSystem.playCard();
    }
    
    // 清除攻击范围高亮
    this.clearAttackRange();
    
    var enemy = this.getEnemyAt(row, col);
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    
    // 处理需要选择目标的技能卡（直视深渊、疯狂释放、黄衣之王的印记）
    if (card.type === 'skill' && (card.name === '直视深渊' || card.name === '疯狂释放' || card.name === '黄衣之王的印记')) {
        if (!enemy) {
            console.log('⚠️ 目标位置没有敌人');
            this.selectedCard = null;
            return;
        }
        
        // 黄衣之王的印记：标记敌人
        if (card.name === '黄衣之王的印记') {
            if (!combat.markedEnemies) combat.markedEnemies = {};
            combat.markedEnemies[enemy.position.row + ',' + enemy.position.col] = 2;  // 下两次伤害翻倍
            this.game.log('🎭 黄衣之王的印记！' + enemy.name + '被标记，下两次伤害翻倍！');
            this.game.renderSystem.showPassiveEffect('🎭 标记！', enemy.icon);
        } else {
            // 直视深渊或疯狂释放：造成伤害
            var damage = card.damage || 10;
            enemy.hp -= damage;
            
            // 消耗理智值
            if (card.sanityCost) {
                player.sanity -= card.sanityCost;
                this.game.log('🧠 消耗' + card.sanityCost + '点理智值！');
            }
            
            // 攻击时扣除理智（技能攻击也扣2点）
            var attackSanityLoss = 2;
            player.sanity = Math.max(0, player.sanity - attackSanityLoss);
            this.game.log('🧠 攻击消耗' + attackSanityLoss + '点理智');
            
            this.game.renderSystem.renderEnemyPanel();
            this.game.renderSystem.showDamageNumber(row, col, damage);
            this.game.log('【' + card.name + '】造成' + damage + '点伤害！');
            
            if (enemy.hp <= 0) {
                enemy.hp = 0;
                this.game.renderSystem.playDeathAnimation(row, col);
                this.game.log(enemy.name + '被击败了！');
            }
        }
        
        // 更新SAN状态
        this.game.updateSanityState();
        
        // 检查理智值归零
        if (player.sanity <= 0 && !combat.madnessTriggered) {
            this.game.combatSystem.triggerMadness();
        }
    }
    else if (card.type === 'attack') {
        if (!enemy) {
            console.log('⚠️ 目标位置没有敌人');
            this.selectedCard = null;
            return;
        }
        
        var player = this.game.state.player;
        var dist = Utils.manhattanDistance(
            player.position.row, player.position.col,
            row, col
        );
        
        var range = card.range || 1;
        if (dist > range) {
            console.log('⚠️ 目标超出射程');
            this.selectedCard = null;
            return;
        }
        
        var damage;
        var combat = this.game.state.combat;
        
        // 特殊攻击卡牌处理
        if (card.name === '符文反击') {
            // 壳击：造成等同于格挡值的伤害
            damage = player.block;
            if (damage <= 0) {
                this.game.log('壳击！但没有格挡值...');
                damage = 0;
            } else {
                this.game.log('壳击！使用' + damage + '点格挡造成等量伤害！');
                player.block = 0; // 失去格挡
            }
        } else {
            // 普通攻击卡
            damage = card.damage || 6;
        }
        
        // 气鼓鼓加成
        if (combat.tempBuffs && combat.tempBuffs.attackBonus) {
            damage += combat.tempBuffs.attackBonus;
        }
        
        // 深渊使者被动：疯狂爆发
        if (player.badge === '深渊使者' && combat.madnessDoubler && combat.madnessDoubler > 0) {
            damage = damage * 2;
            combat.madnessDoubler = 0;
            this.game.log('🐙 疯狂爆发！伤害翻倍！');
            this.game.renderSystem.showPassiveEffect('💥 伤害翻倍！', '🐙');
        }
        
        // 深渊使者被动：积累疯狂值
        if (player.badge === '深渊使者') {
            if (!combat.madness) combat.madness = 0;
            combat.madness += damage;
            this.game.log('🐙 疯狂值+' + damage + ' (当前:' + combat.madness + ')');
            // 疯狂值达到10点，下次攻击翻倍
            if (combat.madness >= 10) {
                combat.madness = 0;
                combat.madnessDoubler = 1;
                this.game.log('🐙 疯狂已满！下次攻击翻倍！');
                this.game.renderSystem.showPassiveEffect('🔥 疯狂已满！', '🐙');
            }
        }
        
        // 检查黄衣之王的印记标记
        if (combat.markedEnemies) {
            var markKey = enemy.position.row + ',' + enemy.position.col;
            if (combat.markedEnemies[markKey] && combat.markedEnemies[markKey] > 0) {
                damage = damage * 2;
                combat.markedEnemies[markKey]--;
                this.game.log('🎭 黄衣之王的印记触发！伤害翻倍！');
                this.game.renderSystem.showPassiveEffect('🎭 印记触发！', '🎭');
                if (combat.markedEnemies[markKey] <= 0) {
                    delete combat.markedEnemies[markKey];
                }
            }
        }
        
        enemy.hp -= damage;
        
        // 攻击时扣除理智（每次攻击扣2点）
        var attackSanityLoss = 2;
        player.sanity = Math.max(0, player.sanity - attackSanityLoss);
        this.game.log('🧠 攻击消耗' + attackSanityLoss + '点理智');
        
        // 立即刷新敌人面板显示血量变化
        this.game.renderSystem.renderEnemyPanel();
        
        // 播放攻击音效
        if (this.game.audioSystem) {
            this.game.audioSystem.playAttack();
        }
        
        this.game.log('使用了【' + card.name + '】对' + enemy.name + '造成' + damage + '点伤害！');
        
        // 显示伤害数字飘字
        this.game.renderSystem.showDamageNumber(row, col, damage);
        
        if (enemy.hp <= 0) {
            enemy.hp = 0;
            this.game.renderSystem.playDeathAnimation(row, col);
            this.game.log(enemy.name + '被击败了！');
            
            // 击败敌人恢复1点理智
            var killSanityRestore = 1;
            player.sanity = Math.min(player.sanity + killSanityRestore, player.maxSanity);
            this.game.log('🧠 击败敌人恢复' + killSanityRestore + '点理智');
            this.game.updateSanityState();
        }
    }
    
    // 计算实际费用（疯狂状态+1）
    var actualCost = card.cost;
    if (combat && combat.madnessPenalty) {
        actualCost += 1;
    }
    
    // SAN状态：费用增加
    var costIncrease = this.game.getSanityEffect('costIncrease');
    actualCost += costIncrease;
    
    // 抓狂效果：攻击卡费用为0
    if (card.type === 'attack' && combat.tempBuffs && combat.tempBuffs.zeroCostAttacks) {
        actualCost = 0;
        this.game.log('抓狂！攻击卡费用变为0！');
    }
    
    this.game.state.player.energy -= actualCost;
    this.game.state.player.discardPile.push(card);
    this.game.state.player.hand.splice(cardIndex, 1);
    
    this.clearSelection();
    
    // 延迟重新渲染网格，让动画先播放（伤害数字动画1000ms）
    var self = this;
    setTimeout(function() {
        self.game.renderSystem.renderGrid();
    }, 1100);
    
    this.game.renderSystem.updateCombatUI();
    
    this.checkCombatEnd();
};

InputSystem.prototype.useCard = function(index) {
    var player = this.game.state.player;
    var card = player.hand[index];
    var combat = this.game.state.combat;
    
    if (!card) return;
    
    // 播放卡牌使用音效
    if (this.game.audioSystem) {
        this.game.audioSystem.playCard();
    }
    
    console.log('✨ 使用【' + card.name + '】');
    
    // 基础卡牌 - 克苏鲁版本
    if (card.name === '理智屏障') {
        var blockAmount = card.block || 5;
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        this.game.log('获得' + blockAmount + '点格挡！');
    } else if (card.name === '逃离深渊') {
        // 恢复移动力（默认+2）
        var moveGain = card.movement || 2;
        player.movement = Math.min(player.movement + moveGain, player.maxMovement);
        this.game.log('逃离了深渊！恢复' + moveGain + '点移动力！');
        this.game.renderSystem.showPassiveEffect('⚡ +' + moveGain + '移动力', '🏃');
    } else if (card.name === '古神低语') {
        player.hp = Math.min(player.hp + (card.heal || 6), player.maxHp);
        this.game.log('恢复了' + (card.heal || 6) + '点生命！');
    } else if (card.name === '疯狂之源') {
        player.energy += card.energy || 1;
        this.game.log('获得' + (card.energy || 1) + '点能量！');
    }
    // 深渊使者徽章卡
    else if (card.name === '触手蔓延') {
        // 本回合每打出一张攻击卡，+1力量
        if (!combat.tempBuffs) combat.tempBuffs = {};
        if (!combat.tempBuffs.attackBonus) combat.tempBuffs.attackBonus = 0;
        combat.tempBuffs.attackBonus += 1;
        this.game.log('触手蔓延！本回合攻击卡额外+' + combat.tempBuffs.attackBonus + '伤害！');
    } else if (card.name === '疯狂鞭挞') {
        // 造成4点伤害，本回合已打出2张卡则抽1张
        var damage = card.damage || 4;
        // 如果有攻击加成
        if (combat.tempBuffs && combat.tempBuffs.attackBonus) {
            damage += combat.tempBuffs.attackBonus;
        }
        this.applyDamageToNearestEnemy(damage);
        // 检查本回合已打出卡牌数
        var playedCount = combat.turnPlayedCards || 0;
        if (playedCount >= 2) {
            this.game.combatSystem.drawCards(1);
            this.game.log('疯狂连击！抽一张卡！');
        }
    } else if (card.name === '不可名状之击') {
        // 造成8点伤害，失去3HP
        var damage = card.damage || 8;
        if (combat.tempBuffs && combat.tempBuffs.attackBonus) {
            damage += combat.tempBuffs.attackBonus;
        }
        this.applyDamageToNearestEnemy(damage);
        player.hp -= 3;
        this.game.log('不可名状之击！自己失去3点HP');
    } else if (card.name === '古神之触') {
        // 失去5HP，获得2能量
        player.hp -= 5;
        player.energy += card.energyGain || 2;
        this.game.log('古神之触！失去5HP，获得' + (card.energyGain || 2) + '点能量');
    }
    // 旧日支配者徽章卡
    else if (card.name === '古老护盾') {
        // 获得8点格挡
        var blockAmount = card.block || 8;
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        this.game.log('古老护盾！获得' + blockAmount + '点格挡！');
    } else if (card.name === '绝对屏障') {
        // 获得12点格挡
        var blockAmount = card.block || 12;
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        this.game.log('绝对屏障！获得' + blockAmount + '点格挡！');
    } else if (card.name === '诅咒反射') {
        // 获得5点格挡，被攻击时反弹3点伤害
        var blockAmount = card.block || 5;
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        if (!combat.tempBuffs) combat.tempBuffs = {};
        combat.tempBuffs.reflect = (combat.tempBuffs.reflect || 0) + (card.reflect || 3);
        this.game.log('诅咒反射！获得格挡，被攻击时反弹' + (card.reflect || 3) + '点伤害！');
    }
    // SAN值机制卡牌
    else if (card.name === '直视深渊') {
        // 需要选择目标，在useCardOnCell中处理
        this.selectedCard = index;
        console.log('🎯 直视深渊：请选择目标');
        return; // 不执行后续消耗
    } else if (card.name === '心灵护盾') {
        var blockAmount = card.block || 8;
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        // 恢复理智值
        var sanityGain = card.sanityRestore || 3;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        this.game.log('心灵护盾！获得' + blockAmount + '点格挡，恢复' + sanityGain + '点理智！');
        this.game.updateSanityState();
    } else if (card.name === '疯狂释放') {
        // 需要选择目标，在useCardOnCell中处理
        this.selectedCard = index;
        console.log('🎯 疯狂释放：请选择目标');
        return;
    } else if (card.name === '古神庇护') {
        var sanityGain = card.sanityRestore || 10;
        var healAmount = card.heal || 10;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        player.hp = Math.min(player.hp + healAmount, player.maxHp);
        this.game.log('古神庇护！恢复' + sanityGain + '点理智和' + healAmount + '点生命！');
        this.game.updateSanityState();
    } else if (card.name === '死灵之书残页') {
        // 抽取3张卡，失去3点理智值
        var drawCount = 3;
        var sanityLoss = 3;
        this.game.combatSystem.drawCards(drawCount);
        player.sanity = Math.max(0, player.sanity - sanityLoss);
        this.game.log('📖 死灵之书残页！抽取' + drawCount + '张卡，失去' + sanityLoss + '点理智！');
        this.game.updateSanityState();
    } else if (card.name === '黄衣之王的印记') {
        // 标记敌人，使其下一次伤害翻倍
        // 需要选择目标，在useCardOnCell中处理
        this.selectedCard = index;
        console.log('🎯 黄衣之王的印记：请选择目标标记');
        return;
    } else if (card.name === '疯狂漩涡') {
        // 消耗所有疯狂值，每点造成1点AOE伤害
        var madness = combat.madness || 0;
        if (madness <= 0) {
            this.game.log('🌀 疯狂漩涡！但没有疯狂值...');
        } else {
            var aoeDamage = madness;  // 每点疯狂值造成1点伤害
            combat.madness = 0;  // 清空疯狂值
            var hitCount = 0;
            for (var i = 0; i < combat.enemies.length; i++) {
                var enemy = combat.enemies[i];
                if (enemy.hp > 0) {
                    enemy.hp -= aoeDamage;
                    hitCount++;
                    this.game.renderSystem.showDamageNumber(enemy.position.row, enemy.position.col, aoeDamage);
                    if (enemy.hp <= 0) {
                        enemy.hp = 0;
                        this.game.renderSystem.playDeathAnimation(enemy.position.row, enemy.position.col);
                        this.game.log(enemy.name + '被疯狂漩涡吞噬！');
                    }
                }
            }
            this.game.log('🌀 疯狂漩涡！消耗' + madness + '点疯狂值，对所有敌人造成' + aoeDamage + '点伤害！');
        }
    } else if (card.name === '理智之泉') {
        // 恢复理智值
        var sanityGain = card.sanityRestore || 8;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        this.game.log('🧠 理智之泉涌出！恢复' + sanityGain + '点理智！');
        this.game.updateSanityState();
    } else if (card.name === '精神集中') {
        // 恢复理智值和格挡
        var sanityGain = card.sanityRestore || 5;
        var blockAmount = card.block || 5;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        player.block += blockAmount;
        this.recordBlockGain(blockAmount);
        this.game.log('🧠 精神集中！恢复' + sanityGain + '点理智，获得' + blockAmount + '点格挡！');
        this.game.updateSanityState();
    } else if (card.name === '深渊抗性') {
        // 恢复理智值和生命
        var sanityGain = card.sanityRestore || 15;
        var healAmount = card.heal || 10;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        player.hp = Math.min(player.hp + healAmount, player.maxHp);
        this.game.log('🧠 深渊抗性激活！恢复' + sanityGain + '点理智和' + healAmount + '点生命！');
        this.game.updateSanityState();
    } else if (card.name === '忘却仪式') {
        // 恢复理智值
        var sanityGain = card.sanityRestore || 10;
        player.sanity = Math.min(player.sanity + sanityGain, player.maxSanity);
        this.game.log('🧠 忘却仪式完成！恢复' + sanityGain + '点理智，负面状态已清除！');
        this.game.updateSanityState();
    } else if (card.name === '恐怖尖啸') {
        // AOE伤害
        var aoeDamage = card.aoeDamage || 8;
        var hitCount = 0;
        for (var i = 0; i < combat.enemies.length; i++) {
            var enemy = combat.enemies[i];
            if (enemy.hp > 0) {
                enemy.hp -= aoeDamage;
                hitCount++;
                this.game.renderSystem.showDamageNumber(enemy.position.row, enemy.position.col, aoeDamage);
                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    this.game.renderSystem.playDeathAnimation(enemy.position.row, enemy.position.col);
                    this.game.log(enemy.name + '被尖啸击杀！');
                }
            }
        }
        this.game.log('恐怖尖啸！' + hitCount + '个敌人受到' + aoeDamage + '点伤害！');
    } else {
        console.log('⚠️ 未实现的卡牌效果: ' + card.name);
    }
    
    // 记录本回合打出的卡牌数
    if (!combat.turnPlayedCards) combat.turnPlayedCards = 0;
    combat.turnPlayedCards++;
    
    // 处理理智值消耗（非指向性技能卡）
    if (card.sanityCost) {
        player.sanity -= card.sanityCost;
        this.game.log('🧠 消耗' + card.sanityCost + '点理智值！');
    }
    
    // 更新SAN状态
    this.game.updateSanityState();
    
    // 检查理智值归零
    if (player.sanity <= 0 && !combat.madnessTriggered) {
        this.game.combatSystem.triggerMadness();
    }
    
    // 计算实际费用（SAN状态影响）
    var actualCost = card.cost;
    var costIncrease = this.game.getSanityEffect('costIncrease');
    actualCost += costIncrease;
    
    // 抓狂效果：攻击卡费用为0
    if (card.type === 'attack' && combat.tempBuffs && combat.tempBuffs.zeroCostAttacks) {
        actualCost = 0;
        this.game.log('抓狂！攻击卡费用变为0！');
    }
    
    player.energy -= actualCost;
    player.discardPile.push(card);
    player.hand.splice(index, 1);
    
    this.game.renderSystem.updateCombatUI();
};

// 对最近的敌人造成伤害（用于非指向性攻击卡）
InputSystem.prototype.applyDamageToNearestEnemy = function(damage) {
    var combat = this.game.state.combat;
    var player = this.game.state.player;
    
    if (!combat || !combat.enemies || combat.enemies.length === 0) return;
    
    // 找到最近的存活敌人
    var nearestEnemy = null;
    var minDist = 999;
    
    for (var i = 0; i < combat.enemies.length; i++) {
        var enemy = combat.enemies[i];
        if (enemy.hp > 0) {
            var dist = Utils.manhattanDistance(
                player.position.row, player.position.col,
                enemy.position.row, enemy.position.col
            );
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
            }
        }
    }
    
    if (nearestEnemy) {
        // 应用SAN状态伤害效果
        var damageMultiplier = this.game.getSanityEffect('damageMultiplier');
        damage = Math.floor(damage * damageMultiplier);
        if (damageMultiplier < 1) {
            this.game.log('🌀 恐惧削弱了攻击力！');
        }
        
        // 检查黄衣之王的印记标记
        if (combat.markedEnemies) {
            var markKey = nearestEnemy.position.row + ',' + nearestEnemy.position.col;
            if (combat.markedEnemies[markKey] && combat.markedEnemies[markKey] > 0) {
                damage = damage * 2;
                combat.markedEnemies[markKey]--;
                this.game.log('🎭 黄衣之王的印记触发！伤害翻倍！');
                this.game.renderSystem.showPassiveEffect('🎭 印记触发！', '🎭');
                if (combat.markedEnemies[markKey] <= 0) {
                    delete combat.markedEnemies[markKey];
                }
            }
        }
        
        // 计算实际伤害（考虑敌人格挡）
        var actualDamage = damage;
        var blockedDamage = 0;
        
        // 如果敌人有格挡
        if (nearestEnemy.block && nearestEnemy.block > 0) {
            if (nearestEnemy.block >= damage) {
                // 格挡完全吸收伤害
                blockedDamage = damage;
                nearestEnemy.block -= damage;
                actualDamage = 0;
            } else {
                // 格挡部分吸收
                blockedDamage = nearestEnemy.block;
                actualDamage = damage - nearestEnemy.block;
                nearestEnemy.block = 0;
            }
        }
        
        // 应用实际伤害
        nearestEnemy.hp -= actualDamage;
        
        // 攻击时扣除理智（自动攻击也扣2点）
        var attackSanityLoss = 2;
        player.sanity = Math.max(0, player.sanity - attackSanityLoss);
        this.game.log('🧠 攻击消耗' + attackSanityLoss + '点理智');
        this.game.updateSanityState();
        
        // 立即刷新敌人面板显示血量变化
        this.game.renderSystem.renderEnemyPanel();
        
        // 播放攻击音效
        if (this.game.audioSystem) {
            this.game.audioSystem.playAttack();
        }
        
        // 显示伤害信息
        if (blockedDamage > 0 && actualDamage > 0) {
            // 部分格挡
            this.game.log('对' + nearestEnemy.name + '造成' + actualDamage + '点伤害（格挡抵消' + blockedDamage + '）！');
            this.game.renderSystem.showDamageNumber(nearestEnemy.position.row, nearestEnemy.position.col, actualDamage);
        } else if (blockedDamage > 0 && actualDamage === 0) {
            // 完全格挡
            this.game.log(nearestEnemy.name + '完全格挡了攻击！');
            this.game.renderSystem.showDamageNumber(nearestEnemy.position.row, nearestEnemy.position.col, 0);
        } else {
            // 无格挡
            this.game.log('对' + nearestEnemy.name + '造成' + damage + '点伤害！');
            this.game.renderSystem.showDamageNumber(nearestEnemy.position.row, nearestEnemy.position.col, damage);
        }
        
        if (nearestEnemy.hp <= 0) {
            nearestEnemy.hp = 0;
            this.game.renderSystem.playDeathAnimation(nearestEnemy.position.row, nearestEnemy.position.col);
            this.game.log(nearestEnemy.name + '被击败了！');
            
            // 击败敌人恢复1点理智
            var killSanityRestore = 1;
            player.sanity = Math.min(player.sanity + killSanityRestore, player.maxSanity);
            this.game.log('🧠 击败敌人恢复' + killSanityRestore + '点理智');
            this.game.updateSanityState();
        }
    }
};

// 记录格挡获得（用于旧日支配者被动）
InputSystem.prototype.recordBlockGain = function(amount) {
    var combat = this.game.state.combat;
    var player = this.game.state.player;
    
    // 检查SAN状态：精神崩溃时无法获得格挡
    var canGainBlock = this.game.getSanityEffect('canGainBlock');
    if (!canGainBlock) {
        this.game.log('🌀 精神崩溃！无法构筑理智屏障！');
        return;
    }
    
    // 播放格挡音效
    if (this.game.audioSystem) {
        this.game.audioSystem.playBlock();
    }
    
    if (player.badge === '旧日支配者') {
        if (!combat.blockGainedThisTurn) combat.blockGainedThisTurn = 0;
        combat.blockGainedThisTurn += amount;
        console.log('👁️ 本回合格挡+' + amount + ' (累计:' + combat.blockGainedThisTurn + ')');
    }
};

InputSystem.prototype.getEnemyAt = function(row, col) {
    var combat = this.game.state.combat;
    if (!combat) return null;
    
    for (var i = 0; i < combat.enemies.length; i++) {
        var e = combat.enemies[i];
        if (e.hp > 0 && e.position.row === row && e.position.col === col) {
            return e;
        }
    }
    return null;
};

InputSystem.prototype.checkCombatEnd = function() {
    var combat = this.game.state.combat;
    
    var aliveEnemies = [];
    for (var i = 0; i < combat.enemies.length; i++) {
        if (combat.enemies[i].hp > 0) {
            aliveEnemies.push(combat.enemies[i]);
        }
    }
    
    if (aliveEnemies.length === 0) {
        this.game.log('战斗胜利！');
        
        // 根据战斗类型给予金币奖励
        var goldReward = 10;
        if (combat.type === 'elite') {
            goldReward = 20;
        } else if (combat.type === 'boss') {
            goldReward = 50;
        }
        this.game.state.player.gold += goldReward;
        this.game.log('获得' + goldReward + '金币！');
        
        // 战斗胜利后恢复理智
        var sanityRestore = 5;  // 基础恢复5点
        if (combat.type === 'elite') sanityRestore = 10;
        if (combat.type === 'boss') sanityRestore = 15;
        
        var player = this.game.state.player;
        if (player.sanity < player.maxSanity) {
            player.sanity = Math.min(player.sanity + sanityRestore, player.maxSanity);
            this.game.log('🧠 战斗胜利恢复' + sanityRestore + '点理智！');
            this.game.updateSanityState();
        }
        
        var self = this;
        setTimeout(function() {
            // 显示奖励选择
            self.game.showRewardScreen();
        }, 1500);
    }
};

InputSystem.prototype.clearAttackRange = function() {
    var cells = document.querySelectorAll('.grid-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].classList.remove('in-range');
    }
};

InputSystem.prototype.clearSelection = function() {
    this.selectedCard = null;
    this.movePreview = null;
    this.clearAttackRange();
    this.game.renderSystem.renderHand();
};

// 显示移动预览
InputSystem.prototype.showMovePreview = function(targetRow, targetCol, dist) {
    var player = this.game.state.player;
    
    // 计算移动路径
    var path = this.calculateMovePath(
        player.position.row, player.position.col,
        targetRow, targetCol
    );
    
    // 保存预览目标和路径
    this.movePreview = {
        row: targetRow,
        col: targetCol,
        dist: dist,
        path: path  // 保存路径上的所有格子
    };
    
    console.log('👁️ 移动预览: (' + targetRow + ', ' + targetCol + ') 消耗' + dist + '移动力');
    this.game.log('再次点击确认移动到该位置（消耗' + dist + '移动力）');
    
    // 渲染预览路径
    this.game.renderSystem.renderMovePreview(
        player.position.row, player.position.col,
        targetRow, targetCol, dist
    );
};

// 计算移动路径
InputSystem.prototype.calculateMovePath = function(startRow, startCol, targetRow, targetCol) {
    var path = [];
    var currentRow = startRow;
    var currentCol = startCol;
    
    // 使用简单的贪心算法计算路径
    while (currentRow !== targetRow || currentCol !== targetCol) {
        var dr = targetRow - currentRow;
        var dc = targetCol - currentCol;
        
        // 优先移动距离更大的方向
        if (Math.abs(dr) >= Math.abs(dc)) {
            currentRow += dr > 0 ? 1 : -1;
        } else {
            currentCol += dc > 0 ? 1 : -1;
        }
        
        path.push({ row: currentRow, col: currentCol });
    }
    
    return path;
};

// 确认移动
InputSystem.prototype.confirmMove = function() {
    if (!this.movePreview) return;
    
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    var targetRow = this.movePreview.row;
    var targetCol = this.movePreview.col;
    var dist = this.movePreview.dist;
    var path = this.movePreview.path;
    
    // 执行移动
    player.position.row = targetRow;
    player.position.col = targetCol;
    player.movement -= dist;
    
    // 播放移动音效
    if (this.game.audioSystem) {
        this.game.audioSystem.playMove();
    }
    
    console.log('✅ 移动到 (' + targetRow + ', ' + targetCol + ')，消耗 ' + dist + ' 移动力');
    this.game.log('移动消耗' + dist + '点移动力');
    
    // 检查路径上所有格子的地形效果 - 疯狂之地扣理智
    var totalSanityLoss = 0;
    var sanityLossPerCell = 3;  // 每个疯狂之地扣3点理智
    
    for (var i = 0; i < path.length; i++) {
        var cellRow = path[i].row;
        var cellCol = path[i].col;
        var cell = combat.grid[cellRow][cellCol];
        
        if (cell && cell.terrain === 'madness') {
            totalSanityLoss += sanityLossPerCell;
            // 显示每个格子的扣理智效果
            this.game.renderSystem.showFloatingText(cellRow, cellCol, '-' + sanityLossPerCell + '🧠', '#00FF00');
        }
    }
    
    // 应用总理智损失
    if (totalSanityLoss > 0) {
        player.sanity = Math.max(0, player.sanity - totalSanityLoss);
        if (path.length > 1) {
            this.game.log('🌀 深渊侵蚀！经过' + path.length + '个疯狂之地，失去' + totalSanityLoss + '点理智！');
        } else {
            this.game.log('🌀 深渊侵蚀！失去' + totalSanityLoss + '点理智！');
        }
        this.game.updateSanityState();
    }
    
    // 清除预览
    this.movePreview = null;
    
    this.game.renderSystem.renderGrid();
    this.game.renderSystem.updateCombatUI();
};

console.log('✅ InputSystem.js (ES5) 加载完成');
