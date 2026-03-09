/**
 * 渲染系统 - RenderSystem (ES5 兼容版)
 */

function RenderSystem(game) {
    this.game = game;
    this.elements = {};
}

RenderSystem.prototype.renderMap = function() {
    console.log('🗺️ renderMap()');
    
    var container = document.getElementById('map-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    var map = this.game.state.map;
    if (!map) return;
    
    var mapEl = document.createElement('div');
    mapEl.className = 'map-tree';
    
    var self = this;
    
    // 按层级组织节点
    var levels = this.organizeMapLevels(map);
    
    for (var level = 0; level < levels.length; level++) {
        var levelNodes = levels[level];
        var levelEl = document.createElement('div');
        levelEl.className = 'map-level';
        
        // 分叉路提示
        if (levelNodes.length > 1) {
            var branchHint = document.createElement('div');
            branchHint.className = 'branch-hint';
            branchHint.textContent = '⚡ 分叉路：选择你的道路';
            levelEl.appendChild(branchHint);
        }
        
        var nodesContainer = document.createElement('div');
        nodesContainer.className = 'nodes-row';
        
        for (var i = 0; i < levelNodes.length; i++) {
            (function(node) {
                var nodeCard = self.createMapNodeCard(node);
                nodesContainer.appendChild(nodeCard);
            })(levelNodes[i]);
        }
        
        levelEl.appendChild(nodesContainer);
        mapEl.appendChild(levelEl);
    }
    
    container.appendChild(mapEl);
};

// 按层级组织地图节点
RenderSystem.prototype.organizeMapLevels = function(map) {
    var levels = [];
    var visited = {};
    
    // BFS分层
    var queue = [0];  // 从起点开始
    visited[0] = true;
    
    while (queue.length > 0) {
        var levelSize = queue.length;
        var currentLevel = [];
        
        for (var i = 0; i < levelSize; i++) {
            var nodeId = queue.shift();
            currentLevel.push(map.nodes[nodeId]);
            
            // 添加子节点到下一层
            var node = map.nodes[nodeId];
            if (node.children) {
                for (var j = 0; j < node.children.length; j++) {
                    var childId = node.children[j];
                    if (!visited[childId]) {
                        visited[childId] = true;
                        queue.push(childId);
                    }
                }
            }
        }
        
        levels.push(currentLevel);
    }
    
    return levels;
};

// 创建地图节点卡片
RenderSystem.prototype.createMapNodeCard = function(node) {
    var self = this;
    var card = document.createElement('div');
    card.className = 'map-node-card';
    
    if (node.visited) {
        card.classList.add('visited');
    } else if (node.available) {
        card.classList.add('available');
        if (node.isHard) {
            card.classList.add('elite-path');
        }
    } else {
        card.classList.add('locked');
    }
    
    var icon = document.createElement('div');
    icon.className = 'node-icon';
    icon.textContent = node.icon;
    card.appendChild(icon);
    
    var name = document.createElement('div');
    name.className = 'node-name';
    name.textContent = this.game.getNodeName(node.type);
    card.appendChild(name);
    
    // 精英节点特殊标记
    if (node.isHard) {
        var danger = document.createElement('div');
        danger.className = 'node-danger';
        danger.textContent = '⚠️ 高难度';
        card.appendChild(danger);
    }
    
    if (node.available && !node.visited) {
        card.addEventListener('click', function() {
            self.onMapNodeClick(node);
        });
    }
    
    return card;
};

// 地图节点点击处理
RenderSystem.prototype.onMapNodeClick = function(node) {
    console.log('🗺️ 点击节点:', node.type, node.id);
    
    // 播放选择音效
    if (this.game.audioSystem) {
        this.game.audioSystem.playSelect();
    }
    
    // 推进地图状态（标记当前节点为已访问）
    this.game.advanceMap(node.id);
    
    // 根据节点类型进入不同场景
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
        this.game.startCombat(node.type);
    } else if (node.type === 'rest') {
        this.game.showRestScreen();
    } else if (node.type === 'shop') {
        this.game.showShopScreen();
    }
};

RenderSystem.prototype.renderCombat = function() {
    console.log('⚔️ renderCombat()');
    this.renderGrid();
    this.renderEnemyPanel();
    this.updateCombatUI();
};

// 渲染敌人属性面板
RenderSystem.prototype.renderEnemyPanel = function() {
    var panel = document.getElementById('enemy-panel');
    if (!panel) return;
    
    var combat = this.game.state.combat;
    if (!combat || !combat.enemies) return;
    
    panel.innerHTML = '';
    
    for (var i = 0; i < combat.enemies.length; i++) {
        var enemy = combat.enemies[i];
        if (enemy.hp <= 0) continue;
        
        var card = document.createElement('div');
        card.className = 'enemy-info-card';
        
        var name = enemy.name;
        var hpText = enemy.hp + '/' + enemy.maxHp;
        var intentText = enemy.intent.type === 'attack' ? '⚔️' + (enemy.strength || enemy.intent.value) : '🛡️';
        
        // 显示敌人属性
        var statsText = '';
        if (enemy.strength) statsText += '💪' + enemy.strength + ' ';
        if (enemy.speed && enemy.speed > 1) statsText += '👟' + enemy.speed + ' ';
        if (enemy.actions && enemy.actions > 1) statsText += '⚡' + enemy.actions;
        
        card.innerHTML = 
            '<div class="enemy-info-header">' +
                '<span class="enemy-icon">' + enemy.icon + '</span>' +
                '<span class="enemy-name">' + name + '</span>' +
            '</div>' +
            '<div class="enemy-hp-bar">' +
                '<div class="enemy-hp-fill" style="width:' + (enemy.hp / enemy.maxHp * 100) + '%"></div>' +
            '</div>' +
            '<div class="enemy-stats">' + hpText + ' | 意图:' + intentText + '</div>' +
            (statsText ? '<div class="enemy-attrs">' + statsText + '</div>' : '');
        
        panel.appendChild(card);
    }
};

RenderSystem.prototype.renderGrid = function() {
    var gridEl = document.getElementById('grid');
    if (!gridEl) return;
    
    var combat = this.game.state.combat;
    if (!combat) return;
    
    gridEl.innerHTML = '';
    
    var grid = combat.grid;
    var rows = grid.length;
    var cols = grid[0].length;
    
    gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', 64px)';
    gridEl.style.gridTemplateRows = 'repeat(' + rows + ', 64px)';
    
    var self = this;
    
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            (function(row, col) {
                var cell = document.createElement('div');
                cell.className = 'grid-cell ' + grid[row][col].terrain;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', function() {
                    self.game.inputSystem.handleCellClick(row, col);
                });
                
                gridEl.appendChild(cell);
            })(r, c);
        }
    }
    
    this.renderEntities();
};

RenderSystem.prototype.renderEntities = function() {
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    
    var playerCell = this.getCell(player.position.row, player.position.col);
    if (playerCell) {
        playerCell.innerHTML = '';
        playerCell.classList.add('player');
        
        var playerEl = document.createElement('div');
        playerEl.className = 'entity player';
        playerEl.textContent = '🧙‍♂️';
        playerCell.appendChild(playerEl);
    }
    
    for (var i = 0; i < combat.enemies.length; i++) {
        var enemy = combat.enemies[i];
        if (enemy.hp > 0) {
            var cell = this.getCell(enemy.position.row, enemy.position.col);
            if (cell) {
                cell.innerHTML = '';
                cell.classList.add('enemy');
                
                var entityEl = document.createElement('div');
                entityEl.className = 'entity enemy';
                entityEl.textContent = enemy.icon;
                cell.appendChild(entityEl);
                
                var intent = document.createElement('div');
                intent.className = 'enemy-intent';
                intent.textContent = enemy.intent.type === 'attack' ? '⚔️' + enemy.intent.value : '🛡️';
                cell.appendChild(intent);
            }
        }
    }
};

RenderSystem.prototype.getCell = function(row, col) {
    return document.querySelector('.grid-cell[data-row="' + row + '"][data-col="' + col + '"]');
};

// 渲染移动预览（箭头轨迹）
RenderSystem.prototype.renderMovePreview = function(fromRow, fromCol, toRow, toCol, dist) {
    // 先清除之前的高亮
    this.clearMovePreview();
    
    // 计算路径（简单的直线近似）
    var path = this.calculatePath(fromRow, fromCol, toRow, toCol);
    
    // 高亮路径上的格子
    for (var i = 0; i < path.length; i++) {
        var cell = this.getCell(path[i].row, path[i].col);
        if (cell) {
            cell.classList.add('move-preview');
            
            // 在路径上显示箭头或数字
            if (i < path.length - 1) {
                var arrow = document.createElement('div');
                arrow.className = 'move-arrow';
                arrow.textContent = '→';
                // 根据方向旋转箭头
                var next = path[i + 1];
                var dr = next.row - path[i].row;
                var dc = next.col - path[i].col;
                var rotation = 0;
                if (dr > 0) rotation = 90;      // 下
                else if (dr < 0) rotation = -90; // 上
                else if (dc < 0) rotation = 180; // 左
                arrow.style.transform = 'rotate(' + rotation + 'deg)';
                arrow.style.webkitTransform = 'rotate(' + rotation + 'deg)';
                cell.appendChild(arrow);
            }
        }
    }
    
    // 高亮目标格子
    var targetCell = this.getCell(toRow, toCol);
    if (targetCell) {
        targetCell.classList.add('move-target');
        // 显示消耗
        var cost = document.createElement('div');
        cost.className = 'move-cost';
        cost.textContent = '-' + dist + '👟';
        targetCell.appendChild(cost);
    }
};

// 清除移动预览
RenderSystem.prototype.clearMovePreview = function() {
    var cells = document.querySelectorAll('.grid-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].classList.remove('move-preview', 'move-target');
        var arrows = cells[i].querySelectorAll('.move-arrow, .move-cost');
        for (var j = 0; j < arrows.length; j++) {
            arrows[j].parentNode.removeChild(arrows[j]);
        }
    }
};

// 计算移动路径（曼哈顿路径）
RenderSystem.prototype.calculatePath = function(fromRow, fromCol, toRow, toCol) {
    var path = [];
    var currentRow = fromRow;
    var currentCol = fromCol;
    
    path.push({row: currentRow, col: currentCol});
    
    // 先沿行移动
    while (currentRow !== toRow) {
        currentRow += (toRow > currentRow) ? 1 : -1;
        path.push({row: currentRow, col: currentCol});
    }
    
    // 再沿列移动
    while (currentCol !== toCol) {
        currentCol += (toCol > currentCol) ? 1 : -1;
        path.push({row: currentRow, col: currentCol});
    }
    
    return path;
};

RenderSystem.prototype.updateCombatUI = function() {
    var player = this.game.state.player;
    
    this.updateElement('c-hp', player.hp);
    this.updateElement('c-max-hp', player.maxHp);
    this.updateElement('c-energy', player.energy);
    this.updateElement('c-movement', player.movement);
    this.updateElement('c-block', player.block);
    this.updateElement('c-gold', player.gold);
    
    // 克苏鲁主题：理智值显示
    if (player.sanity !== undefined) {
        this.updateElement('c-sanity', player.sanity);
        this.updateElement('c-max-sanity', player.maxSanity);
        
        // 深渊使者：疯狂值显示
        if (player.badge === '深渊使者') {
            var combat = this.game.state.combat;
            var madness = (combat && combat.madness) || 0;
            this.updateElement('c-madness', madness);
            var madnessDisplay = document.getElementById('madness-display');
            if (madnessDisplay) {
                madnessDisplay.style.display = 'inline';
                // 疯狂值接近10时高亮
                if (madness >= 8) {
                    madnessDisplay.style.color = '#FF4500';
                    madnessDisplay.style.animation = 'madnessPulse 0.5s infinite';
                } else {
                    madnessDisplay.style.color = '';
                    madnessDisplay.style.animation = 'none';
                }
            }
        } else {
            var madnessDisplay = document.getElementById('madness-display');
            if (madnessDisplay) {
                madnessDisplay.style.display = 'none';
            }
        }
        
        // 理智值低时警告效果
        var sanityRatio = player.sanity / player.maxSanity;
        var sanityItem = document.querySelector('.sanity-item');
        if (sanityItem) {
            if (sanityRatio < 0.3) {
                sanityItem.style.color = '#FF1493';
                sanityItem.style.animation = 'madnessPulse 1s infinite';
            } else if (sanityRatio < 0.5) {
                sanityItem.style.color = '#FF6347';
                sanityItem.style.animation = 'none';
            } else {
                sanityItem.style.color = '';
                sanityItem.style.animation = 'none';
            }
        }
        
        // 显示当前SAN状态
        if (this.game.SANITY_STATES && player.sanityLevel !== undefined) {
            var state = this.game.SANITY_STATES[player.sanityLevel];
            if (state) {
                var stateEl = document.getElementById('sanity-state');
                if (stateEl) {
                    stateEl.textContent = state.name;
                    stateEl.style.color = this.getSanityStateColor(player.sanityLevel);
                }
            }
        }
    }
    
    if (this.game.state.combat) {
        this.updateElement('c-turn', this.game.state.combat.turn);
    }
    
    this.renderHand();
};

RenderSystem.prototype.renderHand = function() {
    var handEl = document.getElementById('hand-area');
    if (!handEl) return;
    
    handEl.innerHTML = '';
    
    var hand = this.game.state.player.hand;
    var selectedCard = this.game.inputSystem.selectedCard;
    var self = this;
    
    for (var i = 0; i < hand.length; i++) {
        (function(index) {
            var card = hand[index];
            var cardEl = document.createElement('div');
            cardEl.className = 'card ' + card.type;
            
            // 如果这张卡被选中，添加选中样式
            if (selectedCard === index) {
                cardEl.classList.add('selected');
            }
            
            var costEl = document.createElement('div');
            costEl.className = 'card-cost';
            costEl.textContent = card.cost;
            cardEl.appendChild(costEl);
            
            var nameEl = document.createElement('div');
            nameEl.className = 'card-name';
            nameEl.textContent = card.name;
            cardEl.appendChild(nameEl);
            
            // 如果有射程，显示射程
            if (card.range) {
                var rangeEl = document.createElement('div');
                rangeEl.className = 'card-range';
                rangeEl.textContent = '射程:' + card.range;
                rangeEl.style.fontSize = '10px';
                rangeEl.style.color = '#666';
                cardEl.appendChild(rangeEl);
            }
            
            // 如果有理智值消耗，显示SAN消耗
            if (card.sanityCost) {
                var sanityEl = document.createElement('div');
                sanityEl.className = 'card-sanity-cost';
                sanityEl.textContent = '🧠' + card.sanityCost;
                sanityEl.style.fontSize = '10px';
                sanityEl.style.color = '#9370DB';
                sanityEl.style.fontWeight = 'bold';
                cardEl.appendChild(sanityEl);
            }
            
            cardEl.addEventListener('click', function() {
                self.onCardClick(index);
            });
            
            // 添加悬浮提示
            cardEl.addEventListener('mouseover', function(e) {
                self.showCardTooltip(card, e.target);
            });
            
            cardEl.addEventListener('mouseout', function() {
                self.hideCardTooltip();
            });
            
            // 触摸设备支持
            cardEl.addEventListener('touchstart', function(e) {
                self.showCardTooltip(card, e.target);
            });
            
            cardEl.addEventListener('touchend', function() {
                setTimeout(function() {
                    self.hideCardTooltip();
                }, 2000);
            });
            
            handEl.appendChild(cardEl);
        })(i);
    }
};

RenderSystem.prototype.onCardClick = function(index) {
    this.game.inputSystem.handleCardClick(index);
    
    // 重新渲染手牌以显示选中状态
    this.renderHand();
    
    // 清除之前的攻击范围高亮
    this.clearAttackRange();
    
    // 如果是攻击卡，高亮攻击范围
    var card = this.game.state.player.hand[index];
    if (card && card.type === 'attack') {
        this.highlightAttackRange(card.range || 1);
    }
};

RenderSystem.prototype.highlightAttackRange = function(range) {
    // 清除之前的高亮
    var cells = document.querySelectorAll('.grid-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].classList.remove('in-range');
    }
    
    // 计算玩家位置范围内的格子
    var player = this.game.state.player;
    var combat = this.game.state.combat;
    if (!combat) return;
    
    for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 8; c++) {
            var dist = Utils.manhattanDistance(
                player.position.row, player.position.col,
                r, c
            );
            
            if (dist <= range) {
                var cell = this.getCell(r, c);
                if (cell) {
                    cell.classList.add('in-range');
                }
            }
        }
    }
};

RenderSystem.prototype.clearAttackRange = function() {
    var cells = document.querySelectorAll('.grid-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].classList.remove('in-range');
    }
};

RenderSystem.prototype.updateLog = function() {
    var logEl = document.getElementById('combat-log');
    if (!logEl) return;
    
    var combat = this.game.state.combat;
    if (!combat) return;
    
    logEl.innerHTML = '';
    
    var recentLogs = combat.log.slice(-10);
    for (var i = 0; i < recentLogs.length; i++) {
        var entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = recentLogs[i];
        logEl.appendChild(entry);
    }
    
    logEl.scrollTop = logEl.scrollHeight;
};

RenderSystem.prototype.updateMapUI = function() {
    var player = this.game.state.player;
    this.updateElement('map-hp', player.hp);
    this.updateElement('map-max-hp', player.maxHp);
    this.updateElement('map-gold', player.gold);
    this.updateElement('map-floor', this.game.state.floor);
    
    // 克苏鲁主题：理智值显示
    if (player.sanity !== undefined) {
        this.updateElement('map-sanity', player.sanity);
        this.updateElement('map-max-sanity', player.maxSanity);
    }
};

RenderSystem.prototype.updateElement = function(id, value) {
    var el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
};

// 显示伤害数字飘字
RenderSystem.prototype.showDamageNumber = function(row, col, damage) {
    console.log('💥 showDamageNumber at (' + row + ',' + col + ') damage=' + damage);
    
    var gridEl = document.getElementById('grid');
    if (!gridEl) {
        console.log('❌ grid element not found');
        return;
    }
    
    var cell = this.getCell(row, col);
    if (!cell) {
        console.log('❌ cell not found at (' + row + ',' + col + ')');
        return;
    }
    
    var damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    damageEl.textContent = '-' + damage;
    
    // 定位在格子中央（Safari需要-webkit前缀）
    damageEl.style.position = 'absolute';
    damageEl.style.left = '50%';
    damageEl.style.top = '50%';
    damageEl.style.webkitTransform = 'translate(-50%, -50%)';
    damageEl.style.transform = 'translate(-50%, -50%)';
    damageEl.style.pointerEvents = 'none';
    
    cell.appendChild(damageEl);
    
    // 动画结束后移除元素
    setTimeout(function() {
        if (damageEl.parentNode) {
            damageEl.parentNode.removeChild(damageEl);
        }
    }, 1000);
};

// 显示浮动文字（用于理智值变化等）
RenderSystem.prototype.showFloatingText = function(row, col, text, color) {
    var cell = this.getCell(row, col);
    if (!cell) return;
    
    var floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.textContent = text;
    floatEl.style.color = color || '#FFFFFF';
    floatEl.style.position = 'absolute';
    floatEl.style.left = '50%';
    floatEl.style.top = '30%';
    floatEl.style.webkitTransform = 'translate(-50%, -50%)';
    floatEl.style.transform = 'translate(-50%, -50%)';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.fontWeight = 'bold';
    floatEl.style.fontSize = '16px';
    floatEl.style.textShadow = '0 0 5px rgba(0,0,0,0.8)';
    floatEl.style.animation = 'floatUp 1s ease-out forwards';
    
    cell.appendChild(floatEl);
    
    // 动画结束后移除元素
    setTimeout(function() {
        if (floatEl.parentNode) {
            floatEl.parentNode.removeChild(floatEl);
        }
    }, 1000);
};

// 播放敌人死亡动画
RenderSystem.prototype.playDeathAnimation = function(row, col) {
    console.log('💀 playDeathAnimation at (' + row + ',' + col + ')');
    
    var cell = this.getCell(row, col);
    if (!cell) {
        console.log('❌ cell not found');
        return;
    }
    
    var entity = cell.querySelector('.entity.enemy');
    if (!entity) {
        console.log('❌ enemy entity not found in cell');
        return;
    }
    
    console.log('✅ adding dying class to enemy');
    entity.classList.add('dying');
    
    // 动画结束后移除敌人图标和intent
    setTimeout(function() {
        cell.innerHTML = '';
        cell.classList.remove('enemy');
    }, 500);
};

// 渲染徽章选择界面
RenderSystem.prototype.renderBadgeSelect = function() {
    console.log('🎨 renderBadgeSelect()');
    
    var badgeList = document.getElementById('badge-list');
    if (!badgeList) {
        console.log('❌ badge-list element not found');
        return;
    }
    
    badgeList.innerHTML = '';
    
    var badges = BadgeManager.getBadgeList();
    var self = this;
    
    for (var i = 0; i < badges.length; i++) {
        (function(badge) {
            var card = document.createElement('div');
            card.className = 'badge-card ' + badge.type;
            
            var cardsText = '';
            if (badge.startingCards && badge.startingCards.length > 0) {
                cardsText = '起始卡牌: ' + badge.startingCards.join('、');
            }
            
            // 徽章类型名称映射
            var typeNames = {
                'attack': '攻击型',
                'defense': '防御型', 
                'control': '控制型'
            };
            var typeName = typeNames[badge.type] || badge.type;
            
            card.innerHTML = 
                '<div class="badge-icon">' + badge.icon + '</div>' +
                '<div class="badge-info">' +
                    '<div class="badge-name">' + badge.name + '</div>' +
                    '<span class="badge-type ' + badge.type + '">' + typeName + '</span>' +
                    '<div class="badge-desc">' + badge.description + '</div>' +
                    '<div class="badge-passive">被动: ' + badge.passive + '</div>' +
                    '<div class="badge-cards">' + cardsText + '</div>' +
                '</div>';
            
            // 确保点击事件正确绑定
            card.onclick = function() {
                console.log('🏅 点击徽章: ' + badge.name);
                self.game.selectBadge(badge.id);
            };
            
            badgeList.appendChild(card);
        })(badges[i]);
    }
};

// 显示卡牌悬浮提示
RenderSystem.prototype.showCardTooltip = function(card, targetEl) {
    var existingTooltip = document.getElementById('card-tooltip');
    if (existingTooltip) {
        existingTooltip.parentNode.removeChild(existingTooltip);
    }
    
    var tooltip = document.createElement('div');
    tooltip.id = 'card-tooltip';
    tooltip.className = 'card-tooltip';
    
    // 构建提示内容
    var content = '<div class="tooltip-name">' + card.name + '</div>';
    content += '<div class="tooltip-cost">费用: ' + card.cost + '</div>';
    
    if (card.type) {
        var typeNames = { attack: '攻击', defense: '防御', skill: '技能', move: '移动' };
        content += '<div class="tooltip-type ' + card.type + '">' + (typeNames[card.type] || card.type) + '</div>';
    }
    
    if (card.description) {
        content += '<div class="tooltip-desc">' + card.description + '</div>';
    }
    
    // 详细效果
    var effects = [];
    if (card.damage) effects.push('伤害: ' + card.damage);
    if (card.block) effects.push('格挡: ' + card.block);
    if (card.range) effects.push('射程: ' + card.range);
    if (card.heal) effects.push('恢复: ' + card.heal + 'HP');
    if (card.energy) effects.push('能量: +' + card.energy);
    
    if (effects.length > 0) {
        content += '<div class="tooltip-effects">' + effects.join(' | ') + '</div>';
    }
    
    // 徽章标识
    if (card.badge) {
        content += '<div class="tooltip-badge">🏅 ' + card.badge + '专属</div>';
    }
    
    tooltip.innerHTML = content;
    document.body.appendChild(tooltip);
    
    // 计算位置
    var rect = targetEl.getBoundingClientRect();
    var tooltipHeight = tooltip.offsetHeight || 150;
    
    var top = rect.top - tooltipHeight - 10;
    var left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    
    // 边界检查
    if (top < 0) top = rect.bottom + 10;
    if (left < 10) left = 10;
    if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 10;
    }
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.style.opacity = '1';
};

// 隐藏卡牌悬浮提示
RenderSystem.prototype.hideCardTooltip = function() {
    var tooltip = document.getElementById('card-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(function() {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 200);
    }
};

// 显示被动效果动画
RenderSystem.prototype.showPassiveEffect = function(text, icon) {
    var effectEl = document.createElement('div');
    effectEl.className = 'passive-effect';
    effectEl.innerHTML = '<div class="passive-icon">' + (icon || '✨') + '</div><div class="passive-text">' + text + '</div>';
    
    document.body.appendChild(effectEl);
    
    // 动画结束后移除
    setTimeout(function() {
        if (effectEl.parentNode) {
            effectEl.parentNode.removeChild(effectEl);
        }
    }, 2000);
};

// 获取SAN状态颜色
RenderSystem.prototype.getSanityStateColor = function(level) {
    var colors = {
        5: '#9370DB',  // 正常 - 紫色
        4: '#FFD700',  // 轻微 - 金色
        3: '#FF8C00',  // 轻度 - 橙色
        2: '#FF6347',  // 中度 - 番茄红
        1: '#FF1493',  // 严重 - 深粉
        0: '#8B0000'   // 疯狂 - 深红
    };
    return colors[level] || '#9370DB';
};

// 渲染奖励选择界面
RenderSystem.prototype.renderRewardScreen = function() {
    console.log('🎨 renderRewardScreen()');
    
    var rewardCards = document.getElementById('reward-cards');
    if (!rewardCards) return;
    
    rewardCards.innerHTML = '';
    
    // 获取当前玩家徽章和战斗类型
    var playerBadge = this.game.state.player.badge;
    var combatType = this.game.state.combat ? this.game.state.combat.type : 'combat';
    console.log('玩家徽章:', playerBadge, '战斗类型:', combatType);
    
    // 根据战斗类型确定稀有度概率
    var rareChance = 0;
    if (combatType === 'elite') rareChance = 0.3;  // 精英战30%概率出稀有
    else if (combatType === 'boss') rareChance = 0.6;  // Boss战60%概率出稀有
    
    // 分类卡牌
    var commonCards = [];
    var uncommonCards = [];
    var rareCards = [];
    
    for (var key in Cards) {
        if (Cards.hasOwnProperty(key)) {
            var card = Cards[key];
            // 检查徽章限制：只能获得自己徽章的卡牌或中立卡牌
            if (!card.badge || card.badge === playerBadge) {
                if (card.rarity === 'common') commonCards.push(key);
                else if (card.rarity === 'uncommon') uncommonCards.push(key);
                else if (card.rarity === 'rare') rareCards.push(key);
            }
        }
    }
    
    console.log('可用奖励卡牌 - 普通:', commonCards.length, '稀有:', uncommonCards.length, '传说:', rareCards.length);
    
    // 生成3张奖励卡
    var selectedCards = [];
    for (var i = 0; i < 3; i++) {
        var roll = Math.random();
        var pool = commonCards;
        
        if (roll < rareChance && rareCards.length > 0) {
            pool = rareCards;
        } else if (roll < 0.6 && uncommonCards.length > 0) {
            pool = uncommonCards;
        } else if (commonCards.length > 0) {
            pool = commonCards;
        }
        
        if (pool.length > 0) {
            var randomIndex = Math.floor(Math.random() * pool.length);
            var cardName = pool[randomIndex];
            selectedCards.push(cardName);
            
            // 从所有池中移除已选卡牌，避免重复
            var idx = commonCards.indexOf(cardName);
            if (idx > -1) commonCards.splice(idx, 1);
            idx = uncommonCards.indexOf(cardName);
            if (idx > -1) uncommonCards.splice(idx, 1);
            idx = rareCards.indexOf(cardName);
            if (idx > -1) rareCards.splice(idx, 1);
        }
    }
    
    var self = this;
    
    for (var j = 0; j < selectedCards.length; j++) {
        (function(cardName) {
            var cardData = Cards[cardName];
            
            var cardEl = document.createElement('div');
            cardEl.className = 'reward-card';
            
            var badgeText = cardData.badge ? '<div class="reward-card-badge">🏅 ' + cardData.badge + '专属</div>' : '';
            
            cardEl.innerHTML = 
                '<div class="reward-card-cost">' + cardData.cost + '</div>' +
                '<div class="reward-card-info">' +
                    '<div class="reward-card-name">' + cardData.name + '</div>' +
                    '<div class="reward-card-desc">' + cardData.description + '</div>' +
                    badgeText +
                '</div>';
            
            cardEl.addEventListener('click', function() {
                self.game.selectRewardCard(cardName);
            });
            
            rewardCards.appendChild(cardEl);
        })(selectedCards[j]);
    }
    
    // 跳过按钮
    var skipBtn = document.getElementById('btn-skip-reward');
    if (skipBtn) {
        skipBtn.onclick = function() {
            self.game.skipReward();
        };
    }
};

// 渲染休息站界面
RenderSystem.prototype.renderRestScreen = function() {
    var self = this;
    var player = this.game.state.player;
    
    // 恢复生命选项
    var healOption = document.getElementById('rest-heal');
    if (healOption) {
        healOption.onclick = function() {
            if (healOption.classList.contains('used')) return;
            
            var healAmount = Math.floor(player.maxHp * 0.3);
            player.hp = Math.min(player.hp + healAmount, player.maxHp);
            self.game.log('休息了片刻，恢复' + healAmount + '点生命值！');
            
            healOption.classList.add('used');
            document.getElementById('rest-sanity').classList.add('used');
            document.getElementById('rest-upgrade').classList.add('used');
            // 隐藏卡牌选择
            var deckContainer = document.getElementById('rest-deck');
            if (deckContainer) deckContainer.style.display = 'none';
        };
    }
    
    // 恢复理智选项
    var sanityOption = document.getElementById('rest-sanity');
    if (sanityOption) {
        sanityOption.onclick = function() {
            if (sanityOption.classList.contains('used')) return;
            
            var sanityAmount = 20;
            player.sanity = Math.min(player.sanity + sanityAmount, player.maxSanity);
            self.game.log('🧠 冥想恢复了' + sanityAmount + '点理智值！');
            self.game.updateSanityState();
            
            sanityOption.classList.add('used');
            document.getElementById('rest-heal').classList.add('used');
            document.getElementById('rest-upgrade').classList.add('used');
            // 隐藏卡牌选择
            var deckContainer = document.getElementById('rest-deck');
            if (deckContainer) deckContainer.style.display = 'none';
        };
    }
    
    // 升级卡牌选项
    var upgradeOption = document.getElementById('rest-upgrade');
    if (upgradeOption) {
        upgradeOption.onclick = function() {
            if (upgradeOption.classList.contains('used')) return;
            
            // 显示牌库让玩家选择
            self.showRestDeckSelect();
        };
    }
    
    // 离开按钮
    var leaveBtn = document.getElementById('btn-leave-rest');
    if (leaveBtn) {
        leaveBtn.onclick = function() {
            // 已经在进入休息站时调用过 advanceMap，这里只需返回地图
            self.game.showScreen('map');
            self.game.renderSystem.renderMap();
        };
    }
    
    // 查看牌库按钮
    var viewDeckBtn = document.getElementById('btn-view-deck-rest');
    if (viewDeckBtn) {
        viewDeckBtn.onclick = function() {
            self.game.showDeckViewer('rest');
        };
    }
};

// 显示休息站牌库选择
RenderSystem.prototype.showRestDeckSelect = function() {
    var self = this;
    var player = this.game.state.player;
    
    var container = document.getElementById('rest-deck');
    if (!container) {
        // 创建容器
        container = document.createElement('div');
        container.id = 'rest-deck';
        container.className = 'rest-deck-container';
        
        var title = document.createElement('div');
        title.className = 'rest-deck-title';
        title.textContent = '选择一张卡牌升级（伤害/格挡+2）';
        container.appendChild(title);
        
        var grid = document.createElement('div');
        grid.className = 'rest-deck-grid';
        container.appendChild(grid);
        
        var restScreen = document.querySelector('.rest-options');
        if (restScreen) {
            restScreen.parentNode.insertBefore(container, restScreen.nextSibling);
        }
    }
    
    container.style.display = 'block';
    var grid = container.querySelector('.rest-deck-grid');
    grid.innerHTML = '';
    
    // 显示所有可升级的卡牌
    var hasUpgradeable = false;
    for (var i = 0; i < player.deck.length; i++) {
        (function(card, index) {
            // 可以升级的卡牌：有damage或block属性且未升级
            var canUpgrade = (card.damage || card.block) && !card.upgraded;
            
            var cardEl = document.createElement('div');
            cardEl.className = 'rest-deck-card' + (canUpgrade ? '' : ' disabled');
            
            var upgradeText = '';
            if (canUpgrade) {
                if (card.damage) upgradeText = '伤害+' + (card.damage + 2);
                if (card.block) upgradeText = '格挡+' + (card.block + 2);
                hasUpgradeable = true;
            } else if (card.upgraded) {
                upgradeText = '已升级';
            } else {
                upgradeText = '不可升级';
            }
            
            cardEl.innerHTML = 
                '<div class="rest-deck-card-name">' + card.name + '</div>' +
                '<div class="rest-deck-card-type">' + (card.type || 'skill') + '</div>' +
                '<div class="rest-deck-card-upgrade">' + upgradeText + '</div>';
            
            if (canUpgrade) {
                cardEl.onclick = function() {
                    // 执行升级
                    if (card.damage) card.damage += 2;
                    if (card.block) card.block += 2;
                    card.upgraded = true;
                    card.name += '+';
                    
                    self.game.log('打磨了【' + card.name + '】！');
                    
                    // 禁用选项
                    document.getElementById('rest-heal').classList.add('used');
                    document.getElementById('rest-sanity').classList.add('used');
                    document.getElementById('rest-upgrade').classList.add('used');
                    container.style.display = 'none';
                };
            }
            
            grid.appendChild(cardEl);
        })(player.deck[i], i);
    }
    
    if (!hasUpgradeable) {
        var msg = document.createElement('div');
        msg.className = 'rest-deck-empty';
        msg.textContent = '没有可以升级的卡牌了';
        grid.appendChild(msg);
    }
};

// 渲染商店界面
RenderSystem.prototype.renderShopScreen = function() {
    var self = this;
    var player = this.game.state.player;
    
    // 更新金币显示
    var goldEl = document.getElementById('shop-gold-amount');
    if (goldEl) {
        goldEl.textContent = player.gold;
    }
    
    // 生成商店商品
    var shopItems = Shop.generateShop(player.badge);
    var container = document.getElementById('shop-items');
    if (container) {
        container.innerHTML = '';
        
        for (var i = 0; i < shopItems.length; i++) {
            (function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'shop-item';
                
                var canAfford = player.gold >= item.price;
                if (!canAfford) {
                    itemEl.classList.add('disabled');
                }
                
                var icon = item.type === 'card' ? '🃏' : '✨';
                
                itemEl.innerHTML = 
                    '<div class="shop-item-icon">' + icon + '</div>' +
                    '<div class="shop-item-info">' +
                        '<div class="shop-item-name">' + item.name + '</div>' +
                        '<div class="shop-item-desc">' + item.description + '</div>' +
                    '</div>' +
                    '<div class="shop-item-price ' + (canAfford ? 'affordable' : 'expensive') + '">' +
                        item.price + '💰' +
                    '</div>';
                
                itemEl.onclick = function() {
                    if (!canAfford) {
                        self.game.log('金币不足！');
                        return;
                    }
                    
                    var result = Shop.buyItem(player, item);
                    if (result.success) {
                        self.game.log(result.message);
                        itemEl.classList.add('disabled');
                        if (goldEl) {
                            goldEl.textContent = player.gold;
                        }
                    }
                };
                
                container.appendChild(itemEl);
            })(shopItems[i]);
        }
    }
    
    // 离开按钮
    var leaveBtn = document.getElementById('btn-leave-shop');
    if (leaveBtn) {
        leaveBtn.onclick = function() {
            // 已经在进入商店时调用过 advanceMap，这里只需返回地图
            self.game.showScreen('map');
            self.game.renderSystem.renderMap();
        };
    }
    
    // 查看牌库按钮
    var viewDeckBtn = document.getElementById('btn-view-deck-shop');
    if (viewDeckBtn) {
        viewDeckBtn.onclick = function() {
            self.game.showDeckViewer('shop');
        };
    }
};

// 渲染牌库查看界面
RenderSystem.prototype.renderDeckViewer = function(fromScreen) {
    var self = this;
    var player = this.game.state.player;
    
    // 更新信息
    var countEl = document.getElementById('deck-count');
    var goldEl = document.getElementById('deck-gold');
    if (countEl) countEl.textContent = player.deck.length;
    if (goldEl) goldEl.textContent = player.gold;
    
    // 渲染卡牌
    var container = document.getElementById('deck-container');
    if (container) {
        container.innerHTML = '';
        
        for (var i = 0; i < player.deck.length; i++) {
            (function(card) {
                var cardEl = document.createElement('div');
                cardEl.className = 'deck-card' + (card.upgraded ? ' upgraded' : '');
                
                var typeClass = card.type || 'skill';
                var typeNames = { attack: '攻击', defense: '防御', skill: '技能', move: '移动' };
                
                var statsText = '';
                if (card.damage) statsText += '⚔️' + card.damage + ' ';
                if (card.block) statsText += '🛡️' + card.block + ' ';
                if (card.range) statsText += '🎯' + card.range;
                
                cardEl.innerHTML = 
                    '<div class="deck-card-cost">' + card.cost + '</div>' +
                    '<div class="deck-card-name">' + card.name + '</div>' +
                    '<span class="deck-card-type ' + typeClass + '">' + (typeNames[typeClass] || typeClass) + '</span>' +
                    '<div class="deck-card-stats">' + statsText + '</div>' +
                    (card.badge ? '<div class="deck-card-badge">🏅 ' + card.badge + '</div>' : '');
                
                container.appendChild(cardEl);
            })(player.deck[i]);
        }
    }
    
    // 返回按钮
    var closeBtn = document.getElementById('btn-close-deck');
    if (closeBtn) {
        closeBtn.onclick = function() {
            // 隐藏休息站的牌库选择（如果在休息站）
            var restDeck = document.getElementById('rest-deck');
            if (restDeck) restDeck.style.display = 'none';
            
            if (fromScreen === 'combat') {
                self.game.showScreen('combat');
            } else if (fromScreen === 'map') {
                self.game.showScreen('map');
            } else if (fromScreen === 'shop') {
                self.game.showScreen('shop');
            } else if (fromScreen === 'rest') {
                self.game.showScreen('rest');
            } else {
                self.game.showScreen('map');
            }
        };
    }
};

console.log('✅ RenderSystem.js (ES5) 加载完成');
