import EnemyTemplates from '../data/Enemies.ts';
import Utils from '../core/Utils.ts';
import StatusEffectSystem from './StatusEffectSystem.ts';
import { getMovementFromSpeed, getPhysicalDamageBonus, getMagicDamageBonus, getMagicDefenseReduction } from './AttributeEngine.ts';
import type Game from '../core/Game.ts';

/**
 * 动作队列系统
 * 用于替代嵌套的 setTimeout 进行时序控制
 */
class ActionQueue {
    private queue: Array<() => Promise<void>> = [];
    private isRunning = false;

    enqueue(action: () => Promise<void> | void, delayMs = 0) {
        this.queue.push(async () => {
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            await action();
        });
        if (!this.isRunning) {
            this.run();
        }
    }

    private async run() {
        this.isRunning = true;
        while (this.queue.length > 0) {
            const action = this.queue.shift();
            if (action) await action();
        }
        this.isRunning = false;
    }

    clear() {
        this.queue = [];
        this.isRunning = false;
    }
}

/**
 * 战斗系统 - CombatSystem
 */
export default class CombatSystem {
    private game: Game;
    public actionQueue = new ActionQueue();

    constructor(game: Game) {
        this.game = game;

        // 监听理智归零事件
        this.game.eventBus.on('player:sanity_zero', () => {
            this.triggerMadness();
        });
    }

    public startCombat(enemyType: string): void {

        this.game.state.combat = {
            type: enemyType,
            turn: 1,
            phase: 'COMBAT_START',
            grid: this.generateGrid(),
            enemies: this.generateEnemies(enemyType),
            log: []
        };

        this.game.eventBus.emit('combat:phase_changed', { phase: 'COMBAT_START' });

        // 使用 store action 重置（避免直接突变失效）
        this.game.state.setPlayerStats({
            position: { row: 2, col: 0 },
            block: 0,
        });

        // 重置牌组
        const player = this.game.state.player;
        player.drawPile = Utils.shuffle(player.deck.slice());
        player.discardPile = [];
        (this.game.state.combat as any).exilePile = [];
        player.hand = [];

        this.startTurn();
    }

    public generateGrid(): any[][] {
        const rows = 5;
        const cols = 8;
        const grid: any[][] = [];

        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                let terrain = 'normal';
                const roll = Math.random();

                if (c > 0 && c < cols - 1) {
                    if (roll < 0.15) {
                        terrain = 'madness';    
                    } else if (roll < 0.22) {
                        terrain = 'sanctuary';  
                    } else if (roll < 0.28) {
                        terrain = 'void';       
                    }
                }

                grid[r][c] = {
                    row: r,
                    col: c,
                    terrain: terrain,
                    entity: null
                };
            }
        }

        return grid;
    }

    public generateEnemies(type: string): any[] {
        const templates = (EnemyTemplates as any)[type] || (EnemyTemplates as any).normal;

        const selected: any[] = [];
        if (type === 'boss') {
            selected.push(Utils.deepCopy(templates[0]));
        } else if (type === 'elite') {
            const idx = Math.floor(Math.random() * templates.length);
            selected.push(Utils.deepCopy(templates[idx]));
        } else {
            const count = 2;
            for (let i = 0; i < count; i++) {
                const idx = Math.floor(Math.random() * templates.length);
                selected.push(Utils.deepCopy(templates[idx]));
            }
        }

        const positions = type === 'boss'
            ? [[2, 6]]
            : type === 'elite'
                ? [[1, 6]]
                : [[1, 6], [3, 6]];

        const enemies: any[] = [];
        for (let i = 0; i < selected.length; i++) {
            const e = selected[i];
            e.position = { row: positions[i][0], col: positions[i][1] };
            e.maxHp = e.hp;
            e.attackRange = e.attackRange || 1;
            e.actions = e.actions || 1;
            e.remainingActions = e.actions;
            e.statusEffects = [];
            e.abilities = e.abilities || [];
            e.intent = this.generateIntent(e);
            enemies.push(e);
        }

        return enemies;
    }

    /**
     * 根据敌人能力生成下一回合意图
     */
    public generateIntent(enemy: any): any {
        // 如果有能力列表，随机选择一个（优先攻击）
        if (enemy.abilities && enemy.abilities.length > 0) {
            const roll = Math.random();
            // 60% 普通攻击，40% 使用能力
            if (roll < 0.4) {
                const ability = enemy.abilities[Math.floor(Math.random() * enemy.abilities.length)];
                return { ...ability, isAbility: true };
            }
        }
        return { type: 'attack', value: enemy.strength };
    }

    public startTurn(): void {
        const combat = this.game.state.combat;
        const player = this.game.state.player;

        combat.phase = 'TURN_START';
        this.game.eventBus.emit('combat:phase_changed', { phase: 'TURN_START', turn: combat.turn });

        if (player.block > 0) {
            this.game.modifyBlock(-player.block);
        }

        combat.turnPlayedCards = 0;
        this.game.buffManager.clear();

        if (combat.madnessTriggered) {
            combat.madnessTriggered = false;
            combat.madnessPenalty = false;
            this.game.floatOnPlayer('🧠 理智恢复', '#9370DB');
        }

        if (player.sanity < player.maxSanity) {
            this.game.modifySanity(1);
            this.game.floatOnPlayer('+1🧠', '#9370DB');
        }

        if (player.badge === '旧日支配者') {
            if (!combat.ancientRunes) combat.ancientRunes = 0;
            if (combat.lastTurnBlock && combat.lastTurnBlock >= 8) {
                const bonusBlock = 2;
                this.game.modifyBlock(bonusBlock);
                this.game.floatOnPlayer(`👁️ +${bonusBlock}格挡`, '#FFD700');
                this.game.renderSystem?.showPassiveEffect(`古老符文 +${bonusBlock}格挡`, '👁️');
            }
        }

        if (player.badge === '深渊使者') {
            if (combat.madnessDoubler && combat.madnessDoubler > 0) {
                this.game.floatOnPlayer('🐙 攻击翻倍！', '#ff4444');
                this.game.renderSystem?.showPassiveEffect('疯狂爆发！攻击翻倍', '🐙');
            }
        }

        // SAN等级由 store.modifySanity() 内部自动更新，无需手动调用

        // === 疯狂突变回合效果 ===
        const sanDrain = this.game.getSanityEffect('sanityDrainPerTurn') as number || 0;
        if (sanDrain > 0) {
            this.game.modifySanity(-sanDrain);
            this.game.floatOnPlayer(`🔮 -${sanDrain}🧠`, '#9370DB');
        }
        const hpDrain = this.game.getSanityEffect('hpDrainPerTurn') as number || 0;
        if (hpDrain > 0) {
            this.game.modifyHP(-hpDrain);
            this.game.floatOnPlayer(`💀 -${hpDrain}HP`, '#ff3333');
        }

        // 重新获取 player（上面的 modifySanity/modifyHP 会替换 store 中的 player 对象）
        const freshPlayer = this.game.state.player;

        const movePenalty = this.game.getSanityEffect('movementPenalty') as number || 0;
        const speedBasedMove = getMovementFromSpeed(freshPlayer);
        const newMaxMove = movePenalty > 0
            ? Math.max(1, speedBasedMove - movePenalty)
            : speedBasedMove;

        if (movePenalty > 0) {
            this.game.floatOnPlayer(`🌀 移动-${movePenalty}`, '#cc88ff');
        }

        const baseEnergy = freshPlayer.baseMaxEnergy || 3;

        // 通过 gameStore setPlayer 提交回合开始属性重置
        this.game.state.setPlayerStats({
            maxMovement: newMaxMove,
            movement: newMaxMove,
            maxEnergy: baseEnergy,
            energy: baseEnergy,
        });

        this.drawCards(3);
        this.discardExcessHand();
        this.game.renderSystem?.updateCombatUI();
        this.game.combatFloat(2, 4, `第${combat.turn}回合`, '#FFD700');

        combat.phase = 'PLAYER_ACTION';
        this.game.eventBus.emit('combat:phase_changed', { phase: 'PLAYER_ACTION', turn: combat.turn });
    }

    /** 弃掉超出8张上限的手牌 */
    private discardExcessHand(): void {
        let player = this.game.state.player;
        const maxHand = 8;
        if (player.hand.length <= maxHand) return;

        const excess = player.hand.length - maxHand;
        const discarded = player.hand.slice(0, excess);
        const kept = player.hand.slice(excess);

        // 触发弃牌动画
        this.showDiscardAnimation(discarded);

        this.game.state.setPlayerStats({
            hand: kept,
            discardPile: [...player.discardPile, ...discarded]
        });
        this.game.floatOnPlayer(`🃏 ${excess}张弃牢`, '#aaaaaa');
    }

    /** 展示弃牌进入墓地的动画（真实卡面缩小飞出） */
    private showDiscardAnimation(cards: any[]): void {
        const handArea = document.getElementById('hand-area');
        if (!handArea) return;

        const cardEls = handArea.querySelectorAll('.card');
        for (let i = 0; i < Math.min(cards.length, cardEls.length); i++) {
            const el = cardEls[i] as HTMLElement;
            el.classList.add('card-to-grave');
        }
    }

    public drawCards(count: number): void {
        let player = this.game.state.player;

        for (let i = 0; i < count; i++) {
            if (player.hand.length >= 8) break;

            if (player.drawPile.length === 0) {
                if (player.discardPile.length === 0) break;

                // 显示重洗动画 — 使用真实卡面
                this.showReshuffleAnimation(player.discardPile);

                const reshuffled = Utils.shuffle([...player.discardPile]);
                this.game.state.setPlayerStats({
                    drawPile: reshuffled,
                    discardPile: []
                });
                player = this.game.state.player;
                this.game.floatOnPlayer('♻️ 洗牌', '#00ccff');
            }

            const newDraw = [...player.drawPile];
            let card = newDraw.pop()!;
            card = this.checkCardMutation(card);
            const newHand = [...player.hand, card];
            this.game.state.setPlayerStats({ drawPile: newDraw, hand: newHand });
            player = this.game.state.player;
        }
    }

    /** 重洗动画 — 使用真实卡面缩略图 */
    private showReshuffleAnimation(cards: any[]): void {
        const overlay = document.createElement('div');
        overlay.className = 'reshuffle-overlay';

        const text = document.createElement('div');
        text.className = 'reshuffle-text';
        text.textContent = '♻️ 墓地重洗';

        const cardsLayer = document.createElement('div');
        cardsLayer.className = 'reshuffle-cards';

        // 类型颜色映射
        const typeColors: Record<string, string> = {
            attack: '#5fd4d4', defense: '#6a9fd4', skill: '#c9a84c',
            move: '#7ec87e', curse: '#b44040'
        };

        // 展示真实卡面缩略图（最多8张）
        const flyCount = Math.min(cards.length, 8);
        for (let i = 0; i < flyCount; i++) {
            const card = cards[i];
            const flyCard = document.createElement('div');
            flyCard.className = 'reshuffle-card-fly';

            // 真实卡面：背景色 + 卡名
            const color = typeColors[card.type] || '#888';
            flyCard.style.borderColor = color;
            flyCard.style.boxShadow = `0 0 6px ${color}40`;

            const miniName = document.createElement('span');
            miniName.className = 'reshuffle-card-name';
            miniName.textContent = card.name ? card.name.substring(0, 3) : '?';
            miniName.style.color = color;
            flyCard.appendChild(miniName);

            // 从底部随机位置飞向上方（抽牌堆方向）
            flyCard.style.left = `${30 + Math.random() * 40}%`;
            flyCard.style.bottom = `${15 + Math.random() * 20}%`;
            flyCard.style.setProperty('--fly-x', `${-60 + Math.random() * 120}px`);
            flyCard.style.setProperty('--fly-y', `${-250 + Math.random() * -50}px`);
            flyCard.style.animationDelay = `${i * 0.1}s`;
            cardsLayer.appendChild(flyCard);
        }

        overlay.appendChild(cardsLayer);
        overlay.appendChild(text);
        document.body.appendChild(overlay);

        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 1200);
    }

    public checkCardMutation(card: any): any {
        const level = this.game.state.player.sanityLevel;
        const mutationChance: Record<number, number> = { 3: 0.15, 2: 0.25, 1: 0.40, 0: 0.60 };
        const chance = mutationChance[level];

        if (!chance || Math.random() >= chance) return card;
        if (card.rarity === 'basic') return card;
        if (card.mutated) return card;
        if (!card.effects || card.effects.length === 0) return card;

        const mutated = Utils.deepCopy(card);
        mutated.mutated = true;
        mutated.originalName = mutated.name;
        mutated.name = '扭曲·' + mutated.name;

        this.applyMutation(mutated);

        this.game.floatOnPlayer(`🌀 ${card.name}扭曲`, '#ff66cc');
        this.game.renderSystem?.showPassiveEffect('🌀 卡牌变异！', '🌀');
        return mutated;
    }

    public applyMutation(card: any): void {
        if (!card.effects) {
            card.effects = [];
            return;
        }
        const newEffects = [];

        for (let i = 0; i < card.effects.length; i++) {
            const eff = card.effects[i];
            switch (eff.type) {
                case 'targetDamage':
                    newEffects.push({ type: 'selfDamage', value: eff.value, _mutated: true });
                    card.description = `🌀 扭曲！对自己造成${eff.value}点伤害`;
                    card.needsTarget = false;
                    break;
                case 'gainBlock':
                    card.description = '🌀 扭曲！护盾化为虚无...';
                    break;
                case 'heal':
                    newEffects.push({ type: 'selfDamage', value: eff.value, _mutated: true });
                    card.description = `🌀 扭曲！治愈变为折磨，失去${eff.value}点HP`;
                    break;
                case 'gainMovement':
                    newEffects.push({ type: 'sanityCost', value: 3, _mutated: true });
                    card.description = '🌀 扭曲！双腿无法移动，理智消散...';
                    break;
                default:
                    newEffects.push(eff);
                    break;
            }
        }

        card.effects = newEffects;
    }

    public endTurn(): void {

        const combat = this.game.state.combat;

        combat.phase = 'TURN_END';
        this.game.eventBus.emit('combat:phase_changed', { phase: 'TURN_END', turn: combat.turn });

        const player = this.game.state.player;

        if (combat.blockGainedThisTurn) {
            combat.lastTurnBlock = combat.blockGainedThisTurn;
        } else {
            combat.lastTurnBlock = 0;  
        }
        combat.blockGainedThisTurn = 0;  

        // 未使用的手牌保留到下回合（不再丢弃）

        setTimeout(() => {
            this.startEnemyTurn();
        }, 500);
    }

    public startEnemyTurn(): void {
        const combat = this.game.state.combat;
        const player = this.game.state.player;
        if (!combat) return;

        combat.phase = 'ENEMY_ACTION';
        this.game.eventBus.emit('combat:phase_changed', { phase: 'ENEMY_ACTION', turn: combat.turn });

        const aliveEnemies = combat.enemies.filter((e: any) => e.hp > 0);
        
        if (aliveEnemies.length === 0) {
            this.actionQueue.enqueue(() => {
                this.game.inputSystem?.checkCombatEnd();
            }, 500);
            return;
        }

        // 统一清空所有敌人的格挡
        for (const e of aliveEnemies) {
            if (e.block > 0) e.block = 0;
        }

        const handleTurnEnd = () => {
            // === 回合结束：递减状态效果 ===
            for (const e of aliveEnemies) {
                const endLogs = StatusEffectSystem.processTurnEnd(e);
                for (const msg of endLogs) {
                    this.game.floatOnEnemy(e, msg.replace(e.name, '').substring(0, 10), '#ffcc44');
                }
            }
            // 处理玩家状态效果
            const freshPlayer = this.game.state.player;
            if ((freshPlayer as any).statusEffects) {
                const playerDotLogs = StatusEffectSystem.processTurnStart(freshPlayer as any);
                for (const msg of playerDotLogs) {
                    this.game.floatOnPlayer(msg.substring(0, 12), '#ff8866');
                }
                const playerEndLogs = StatusEffectSystem.processTurnEnd(freshPlayer as any);
                for (const msg of playerEndLogs) {
                    this.game.floatOnPlayer(msg.substring(0, 12), '#ffcc44');
                }
            }

            // 检查敌人回合结束后是否所有敌人都已死亡（DOT击杀）
            let anyAlive = false;
            for (const e of combat.enemies) {
                if (e.hp > 0) { anyAlive = true; break; }
            }
            if (!anyAlive) {
                this.game.inputSystem?.checkCombatEnd();
                return;
            }

            const freshCombat = this.game.state.combat;
            if (freshCombat) {
                freshCombat.turn++;
            }
            this.game.renderSystem?.renderEnemyPanel();
            this.actionQueue.enqueue(() => {
                this.startTurn(); // 开始下一轮玩家回合
            }, 1000);
        };

        const processEnemy = (enemyIndex: number) => {
            if (enemyIndex >= aliveEnemies.length) {
                handleTurnEnd();
                return;
            }

            const enemy = aliveEnemies[enemyIndex];
            enemy.remainingActions = enemy.actions;

            // === 状态效果回合开始结算 ===
            const dotLogs = StatusEffectSystem.processTurnStart(enemy);
            for (const msg of dotLogs) {
                this.game.floatOnEnemy(enemy, msg.replace(enemy.name, '').substring(0, 10), '#ff8866');
            }
            if (enemy.hp <= 0 && !enemy._dead) {
                enemy.hp = 0;
                enemy._dead = true;
                this.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                this.game.floatOnEnemy(enemy, '💀 击杀', '#ff3333');
                this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 500);
                return;
            }

            // === 再生能力 ===
            if (enemy.regeneration && enemy.hp < enemy.maxHp) {
                const regen = Math.min(enemy.regeneration, enemy.maxHp - enemy.hp);
                enemy.hp += regen;
                this.game.floatOnEnemy(enemy, `+${regen}HP`, '#00ff88');
            }

            // === 眩晕检查 ===
            if (StatusEffectSystem.isStunned(enemy)) {
                this.game.floatOnEnemy(enemy, '💫 眩晕', '#ffff00');
                StatusEffectSystem.remove(enemy, 'stun');
                this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 600);
                return;
            }

            if (player.badge === '黄衣信徒' && Math.random() < 0.2) {
                this.game.floatOnEnemy(enemy, '🎭 恐惧', '#9370DB');
                this.game.renderSystem?.showPassiveEffect('🎭 恐惧！', enemy.icon);
                this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 800);
                return;
            }

            const doNextAction = () => {
                if (enemy.remainingActions <= 0) {
                    this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 500);
                    return;
                }

                const dist = Utils.manhattanDistance(
                    enemy.position.row, enemy.position.col,
                    player.position.row, player.position.col
                );

                const effectiveStrength = StatusEffectSystem.getEffectiveStrength(enemy);

                // === 检查是否有远程能力 ===
                const intent = enemy.intent;
                if (intent && intent.isAbility) {
                    this.executeEnemyAbility(enemy, intent);
                    enemy.remainingActions--;
                    enemy.intent = this.generateIntent(enemy);
                    this.actionQueue.enqueue(doNextAction, 600);
                    return;
                }

                // 检查远程攻击能力
                const rangedAbility = (enemy.abilities || []).find(
                    (a: any) => a.type === 'rangedAttack' && dist <= (a.range || 3)
                );

                if (dist <= enemy.attackRange) {
                    // 近战攻击
                    const damage = effectiveStrength;
                    this.damagePlayer(damage, enemy);
                    this.game.floatOnPlayer(`-${damage}`, '#ff3333');
                    enemy.remainingActions--;
                    this.actionQueue.enqueue(doNextAction, 600);
                } else if (rangedAbility && dist <= rangedAbility.range) {
                    // 远程攻击 - 需要视线校验
                    const hasLoS = this.checkLineOfSight(enemy.position.row, enemy.position.col, player.position.row, player.position.col);
                    if (hasLoS) {
                        const damage = rangedAbility.damage || effectiveStrength;
                        this.damagePlayer(damage, enemy);
                        this.game.floatOnPlayer(`-${damage}🏹`, '#ff6644');
                        enemy.remainingActions--;
                        this.actionQueue.enqueue(doNextAction, 600);
                    } else {
                        // 视线受阻，尝试移动找角度
                        this.game.floatOnEnemy(enemy, '🚫 视线受阻', '#888888');
                        const moved = this.moveEnemyWithSpeed(enemy);
                        if (!moved) {
                            enemy.remainingActions = 0;
                            this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 500);
                            return;
                        }
                        this.game.renderSystem?.renderGrid();
                        this.game.renderSystem?.renderEnemyPanel();
                        enemy.remainingActions--;
                        this.actionQueue.enqueue(doNextAction, 600);
                    }
                } else {
                    const moved = this.moveEnemyWithSpeed(enemy);
                    if (!moved) {
                        enemy.remainingActions = 0;
                        this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 500);
                        return;
                    }

                    this.game.renderSystem?.renderGrid();
                    this.game.renderSystem?.renderEnemyPanel();
                    enemy.remainingActions--;

                    const newDist = Utils.manhattanDistance(
                        enemy.position.row, enemy.position.col,
                        player.position.row, player.position.col
                    );

                    if (newDist <= enemy.attackRange && enemy.remainingActions > 0) {
                        this.actionQueue.enqueue(doNextAction, 500);
                    } else {
                        this.actionQueue.enqueue(() => processEnemy(enemyIndex + 1), 500);
                    }
                }
            };

            // 开始这个敌人的第一个行动
            this.actionQueue.enqueue(doNextAction, 100);
        };

        // 启动队列，从索引 0 开始
        this.actionQueue.enqueue(() => processEnemy(0), 100);
    }

    /**
     * 执行敌人特殊能力
     */
    public executeEnemyAbility(enemy: any, ability: any): void {
        const player = this.game.state.player;

        switch (ability.type) {
            case 'rangedAttack': {
                const dmg = ability.damage || enemy.strength;
                this.damagePlayer(dmg, enemy);
                this.game.floatOnPlayer(`-${dmg}🏹`, '#ff6644');
                break;
            }
            case 'applyDot': {
                StatusEffectSystem.apply(player as any, {
                    id: ability.dotType || 'poison',
                    name: ability.dotName || '中毒',
                    type: 'dot',
                    value: ability.value || 2,
                    duration: ability.duration || 3,
                    icon: ability.dotType === 'burn' ? '🔥' : '☠️',
                    stackable: true
                });
                this.game.floatOnPlayer(`☠️ ${ability.dotName || '中毒'}`, '#00cc44');
                break;
            }
            case 'buff': {
                // Buff all allies
                const combat = this.game.state.combat;
                for (const ally of combat.enemies) {
                    if (ally.hp > 0 && ally !== enemy) {
                        StatusEffectSystem.apply(ally, {
                            id: `buff_${ability.stat}`,
                            name: `${ability.stat}提升`,
                            type: 'buff',
                            value: ability.value || 2,
                            duration: ability.duration || 2,
                            icon: '⬆️'
                        });
                    }
                }
                this.game.floatOnEnemy(enemy, '⬆️ 增益', '#ffcc00');
                break;
            }
            case 'shield': {
                if (!enemy.block) enemy.block = 0;
                enemy.block += ability.value || 5;
                this.game.floatOnEnemy(enemy, `+${ability.value}🛡️`, '#6688ff');
                break;
            }
            case 'debuff': {
                StatusEffectSystem.apply(player as any, {
                    id: `weaken_${ability.stat}`,
                    name: `${ability.stat}削弱`,
                    type: 'debuff',
                    value: ability.value || 1,
                    duration: ability.duration || 2,
                    icon: '⬇️'
                });
                this.game.floatOnPlayer(`⬇️ ${ability.stat}-${ability.value}`, '#ff8888');
                break;
            }
            case 'summon': {
                this.summonEnemy(enemy, ability.template || '触手');
                break;
            }
            case 'curse': {
                const sanLoss = ability.sanityCost || 5;
                this.game.modifySanity(-sanLoss);
                this.game.floatOnPlayer(`🧠 -${sanLoss}`, '#9370DB');
                break;
            }
            default:
                this.game.floatOnEnemy(enemy, `✨ ${ability.type}`, '#ccccff');
        }
    }

    /**
     * 召唤敌方单位
     */
    public summonEnemy(summoner: any, templateName: string): void {
        const combat = this.game.state.combat;
        const templates = (EnemyTemplates as any).normal || [];
        const template = templates.find((t: any) => t.name === templateName);

        if (!template) {
            // 创建简单触手
            const tentacle: any = {
                name: '召唤触手',
                icon: '🦑',
                hp: 8,
                maxHp: 8,
                strength: 3,
                speed: 0,
                attackRange: 1,
                actions: 1,
                remainingActions: 1,
                statusEffects: [],
                abilities: [],
                intent: { type: 'attack', value: 3 },
                position: this.findEmptyCell(summoner.position),
                _summoned: true
            };
            if (tentacle.position) {
                combat.enemies.push(tentacle);
                this.game.floatOnEnemy(tentacle, '🦑 召唤', '#cc88ff');
            }
        } else {
            const e = Utils.deepCopy(template);
            e.maxHp = e.hp;
            e.attackRange = e.attackRange || 1;
            e.actions = e.actions || 1;
            e.remainingActions = e.actions;
            e.statusEffects = [];
            e.abilities = e.abilities || [];
            e.intent = this.generateIntent(e);
            e.position = this.findEmptyCell(summoner.position);
            if (e.position) {
                combat.enemies.push(e);
                this.game.floatOnEnemy(e, `🔮 召唤`, '#cc88ff');
            }
        }
    }

    // ============================
    // 空间哈希网格 & A*寻路
    // ============================

    /**
     * 构建当前回合所有存活敌人的空间网格分布
     * 用于 O(1) 的位置碰撞检测
     */
    private getEnemyGridCache(): Map<string, any> {
        const combat = this.game.state.combat;
        const grid = new Map<string, any>();
        if (!combat) return grid;

        for (let i = 0; i < combat.enemies.length; i++) {
            const e = combat.enemies[i];
            if (e.hp > 0) {
                grid.set(`${e.position.row},${e.position.col}`, e);
            }
        }
        return grid;
    }

    /** O(1) 获取指定坐标的敌人 */
    private getEnemyAtPos(row: number, col: number, gridCache: Map<string, any>): any | null {
        return gridCache.get(`${row},${col}`) || null;
    }

    /**
     * Bresenham 视线(LoS)算法
     */
    private checkLineOfSight(r0: number, c0: number, r1: number, c1: number): boolean {
        let dr = Math.abs(r1 - r0);
        let dc = Math.abs(c1 - c0);
        let sr = r0 < r1 ? 1 : -1;
        let sc = c0 < c1 ? 1 : -1;
        let err = (dr > dc ? dr : -dc) / 2;
        let err2 = 0;

        let r = r0;
        let c = c0;
        const enemyMap = this.getEnemyGridCache();

        while (true) {
            // 排除起点和终点，只检查中途的格挡 (其他敌人占据)
            if ((r !== r0 || c !== c0) && (r !== r1 || c !== c1)) {
                if (this.getEnemyAtPos(r, c, enemyMap)) {
                    return false; // 视线被阻挡
                }
            }
            if (r === r1 && c === c1) break;
            
            err2 = err;
            if (err2 > -dr) { err -= dc; r += sr; }
            if (err2 < dc) { err += dr; c += sc; }
        }
        return true;
    }

    /**
     * A* 寻路算法
     * 自动避开其他敌人障碍物，寻找通往目标的最短可走路径。
     */
    private findPathAStar(startRow: number, startCol: number, targetRow: number, targetCol: number, enemyMap: Map<string, any>, currentEnemy: any): any[] | null {
        const ROWS = 5;
        const COLS = 8;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        const openSet = new Set<string>();
        const closedSet = new Set<string>();
        const gScore = new Map<string, number>();
        const fScore = new Map<string, number>();
        const cameFrom = new Map<string, string>();

        const startKey = `${startRow},${startCol}`;
        const targetKey = `${targetRow},${targetCol}`;

        const heuristic = (r1: number, c1: number, r2: number, c2: number) => Math.abs(r1 - r2) + Math.abs(c1 - c2);

        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, heuristic(startRow, startCol, targetRow, targetCol));

        while (openSet.size > 0) {
            // 找 fScore 最小的节点
            let current = '';
            let minF = Infinity;
            for (const key of openSet) {
                const score = fScore.get(key) || Infinity;
                if (score < minF) {
                    minF = score;
                    current = key;
                }
            }

            if (current === targetKey) {
                // 回溯路径
                const path: any[] = [];
                let curr = current;
                while (cameFrom.has(curr)) {
                    const [r, c] = curr.split(',').map(Number);
                    path.unshift({ row: r, col: c });
                    curr = cameFrom.get(curr)!;
                }
                return path;
            }

            openSet.delete(current);
            closedSet.add(current);

            const [r, c] = current.split(',').map(Number);

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const nKey = `${nr},${nc}`;

                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (closedSet.has(nKey)) continue;

                // 检查障碍物 (其他敌人)，目标点(玩家位置)允许通过因为在攻击判定中会被处理
                // 如果是起点，自己当然不会挡住自己
                if (nKey !== targetKey) {
                    const obstacle = this.getEnemyAtPos(nr, nc, enemyMap);
                    if (obstacle && obstacle !== currentEnemy) {
                        continue;
                    }
                }

                const tentativeG = (gScore.get(current) || 0) + 1;

                if (!openSet.has(nKey)) {
                    openSet.add(nKey);
                } else if (tentativeG >= (gScore.get(nKey) || Infinity)) {
                    continue;
                }

                cameFrom.set(nKey, current);
                gScore.set(nKey, tentativeG);
                fScore.set(nKey, tentativeG + heuristic(nr, nc, targetRow, targetCol));
            }
        }

        return null;
    }

    // ============================

    /**
     * 找到召唤者附近的空格
     */
    private findEmptyCell(origin: { row: number; col: number }): { row: number; col: number } | null {
        const combat = this.game.state.combat;
        const player = this.game.state.player;
        const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];

        for (const [dr, dc] of offsets) {
            const r = origin.row + dr;
            const c = origin.col + dc;
            if (r < 0 || r >= 5 || c < 0 || c >= 8) continue;
            if (r === player.position.row && c === player.position.col) continue;
            let occupied = false;
            for (const e of combat.enemies) {
                if (e.hp > 0 && e.position.row === r && e.position.col === c) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) return { row: r, col: c };
        }
        return null;
    }

    public moveEnemyWithSpeed(enemy: any): boolean {
        const player = this.game.state.player;
        const speed = StatusEffectSystem.getEffectiveSpeed(enemy);
        let moved = false;

        const enemyMap = this.getEnemyGridCache();

        // 使用 A* 寻找通往玩家的完整路径
        const path = this.findPathAStar(enemy.position.row, enemy.position.col, player.position.row, player.position.col, enemyMap, enemy);

        if (!path || path.length === 0) {
            return false; // 无法到达
        }

        // 沿路径移动 speed 步
        for (let step = 0; step < speed; step++) {
            // 距离目标的曼哈顿距离
            const dist = Utils.manhattanDistance(enemy.position.row, enemy.position.col, player.position.row, player.position.col);
            if (dist <= enemy.attackRange) {
                break; // 已经进入攻击范围
            }

            if (step >= path.length) break;

            const nextPos = path[step];
            
            // A*保证了这步不被其他敌人占据(排除目标格)，但最后安全起见做一层校验
            if (nextPos.row === player.position.row && nextPos.col === player.position.col) {
                break;
            }

            // 更新映射表（O(1)位移维护）
            enemyMap.delete(`${enemy.position.row},${enemy.position.col}`);
            enemy.position.row = nextPos.row;
            enemy.position.col = nextPos.col;
            enemyMap.set(`${enemy.position.row},${enemy.position.col}`, enemy);

            moved = true;
        }

        if (moved) {
            // 敌人移动无需飘字提示
        }

        return moved;
    }

    public damagePlayer(amount: number, attacker?: any): void {
        const player = this.game.state.player;
        let actualDamage = amount;

        if (player.block > 0) {
            if (player.block >= amount) {
                this.game.modifyBlock(-amount);
                actualDamage = 0;
            } else {
                actualDamage -= player.block;
                this.game.modifyBlock(-player.block);
            }
        }

        if (actualDamage > 0) {
            this.game.modifyHP(-actualDamage);
            this.game.renderSystem?.showDamageNumber(player.position.row, player.position.col, actualDamage);
        }

        if (attacker && attacker.sanityDrain && player.sanity > 0) {
            const sanityLoss = attacker.sanityDrain;
            this.game.modifySanity(-sanityLoss); 
            this.game.floatOnPlayer(`-${sanityLoss}🧠`, '#9370DB');
        }

        const reflectValue = this.game.buffManager.getValue('reflect');
        if (attacker && reflectValue > 0) {
            const reflectDamage = reflectValue;
            attacker.hp -= reflectDamage;
            this.game.floatOnEnemy(attacker, `👁️ -${reflectDamage}`, '#ff66ff');

            if (attacker.hp <= 0 && !attacker._dead) {
                attacker.hp = 0;
                attacker._dead = true;
                this.game.renderSystem?.playDeathAnimation(attacker.position.row, attacker.position.col);
                this.game.floatOnEnemy(attacker, '💀 反弹击杀', '#ff3333');
                // 反弹击杀后检查胜利
                this.game.inputSystem?.checkCombatEnd();
            }
        }
    }

    public triggerMadness(): void {
        const combat = this.game.state.combat;
        if (!combat) return;

        combat.madnessTriggered = true;
        this.game.floatOnPlayer('🌀 理智崩溃！', '#ff1493');
        this.game.renderSystem?.showPassiveEffect('🌀 彻底疯狂！卡牌费用大幅提升', '🌀');

        combat.madnessPenalty = true;
    }
}
