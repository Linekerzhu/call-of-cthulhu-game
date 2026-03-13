import PixiRenderer from '../systems/PixiRenderer.ts';
import CardEvolutionEngine from '../systems/CardEvolutionEngine.ts';
import type Game from '../core/Game.ts';

/**
 * CombatRenderer — 战斗场景渲染
 * 
 * 包含战斗网格、手牌区、敌人面板、状态栏、日志、伤害数字等。
 */
export default class CombatRenderer {
    private game: Game;
    public pixiRenderer: PixiRenderer | null = null;

    constructor(game: Game) {
        this.game = game;
    }

    public renderCombat(): void {
        if (!this.pixiRenderer) {
            this.pixiRenderer = new PixiRenderer(this.game);
        }
        this.pixiRenderer.init('grid');

        this.renderGrid();
        this.updateCombatUI();
    }

    public renderEnemyPanel(): void {
        // 敌人面板已移除，改为悬浮tooltip
    }

    public renderCardZones(): void {
        const player = this.game.state.player;
        const combat = this.game.state.combat;

        // 待抽区
        const drawCount = document.getElementById('draw-pile-count');
        if (drawCount) drawCount.textContent = String(player.drawPile ? player.drawPile.length : 0);

        // 墓地
        const discardCount = document.getElementById('discard-pile-count');
        if (discardCount) discardCount.textContent = String(player.discardPile ? player.discardPile.length : 0);

        // 剔除区
        const exileCount = document.getElementById('exile-count');
        const exilePile = combat && (combat as any).exilePile ? (combat as any).exilePile : [];
        if (exileCount) exileCount.textContent = String(exilePile.length);
    }

    private _enemyTooltipTimer: ReturnType<typeof setTimeout> | null = null;

    public showEnemyTooltip(enemy: any, screenX: number, screenY: number): void {
        this.hideEnemyTooltip();
        const tooltip = document.createElement('div');
        tooltip.id = 'enemy-tooltip';
        tooltip.className = 'enemy-tooltip';

        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        const intentText = enemy.intent.type === 'attack'
            ? `⚔️ 攻击 ${enemy.strength || enemy.intent.value} 伤害`
            : '🛡️ 防御';

        let statsHtml = `${enemy.hp}/${enemy.maxHp} HP`;
        if (enemy.block && enemy.block > 0) statsHtml += ` | 🛡${enemy.block}`;
        if (enemy.strength) statsHtml += `<br>💪 攻击力 ${enemy.strength}`;
        if (enemy.speed && enemy.speed > 1) statsHtml += ` | 👟 速度 ${enemy.speed}`;
        if (enemy.actions && enemy.actions > 1) statsHtml += ` | ⚡ 行动 ${enemy.actions}`;

        tooltip.innerHTML =
            `<div class="et-name">${enemy.icon} ${enemy.name}</div>` +
            `<div class="et-hp-bar"><div class="et-hp-fill" style="width:${hpPercent}%"></div></div>` +
            `<div class="et-stats">${statsHtml}</div>` +
            `<div class="et-intent">意图: ${intentText}</div>`;

        document.body.appendChild(tooltip);

        // 定位
        let top = screenY - tooltip.offsetHeight - 15;
        let left = screenX - tooltip.offsetWidth / 2;
        if (top < 0) top = screenY + 20;
        if (left < 10) left = 10;
        if (left + 200 > window.innerWidth) left = window.innerWidth - 210;

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = '1';

        // 安全网：5秒后自动消失，防止 pointerout 未触发导致残留
        this._enemyTooltipTimer = setTimeout(() => {
            this.hideEnemyTooltip();
        }, 5000);
    }

    public hideEnemyTooltip(): void {
        if (this._enemyTooltipTimer) {
            clearTimeout(this._enemyTooltipTimer);
            this._enemyTooltipTimer = null;
        }
        const tooltip = document.getElementById('enemy-tooltip');
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }

    public updateSanDistortion(): void {
        const overlay = document.getElementById('san-distortion');
        if (!overlay) return;
        const player = this.game.state.player;
        const sanRatio = player.sanity / 50;

        overlay.classList.remove('active', 'severe');
        if (sanRatio < 0.3) {
            overlay.classList.add('active', 'severe');
        } else if (sanRatio < 0.6) {
            overlay.classList.add('active');
        }
    }

    public renderGrid(): void {
        const combat = this.game.state.combat;
        if (!combat) return;
        if (this.pixiRenderer) {
            this.pixiRenderer.renderGrid(combat.grid);
            this.renderEntities();
        }
    }

    public renderEntities(): void {
        const player = this.game.state.player;
        const combat = this.game.state.combat;
        if (!combat) return;
        if (this.pixiRenderer) {
            this.pixiRenderer.renderEntities(player, combat.enemies);
        }
    }

    public getCell(row: number, col: number): Element | null {
        return document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    }

    public renderMovePreview(fromRow: number, fromCol: number, toRow: number, toCol: number, dist: number): void {
        if (this.pixiRenderer) {
            const path = this.calculatePath(fromRow, fromCol, toRow, toCol);
            this.pixiRenderer.showMovePreview(path, toRow, toCol, dist);
        }
    }

    public clearMovePreview(): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.clearMovePreview();
        }
    }

    private calculatePath(fromRow: number, fromCol: number, toRow: number, toCol: number): any[] {
        const path: any[] = [];
        let currentRow = fromRow;
        let currentCol = fromCol;

        path.push({ row: currentRow, col: currentCol });

        while (currentRow !== toRow) {
            currentRow += (toRow > currentRow) ? 1 : -1;
            path.push({ row: currentRow, col: currentCol });
        }

        while (currentCol !== toCol) {
            currentCol += (toCol > currentCol) ? 1 : -1;
            path.push({ row: currentRow, col: currentCol });
        }

        return path;
    }

    public updateCombatUI(): void {
        const player = this.game.state.player!;

        this.updateElement('c-hp', player.hp);
        this.updateElement('c-max-hp', player.maxHp);
        this.updateElement('c-energy', player.energy);
        this.updateElement('c-movement', player.movement);
        this.updateElement('c-block', player.block);

        if (player.sanity !== undefined) {
            this.updateElement('c-sanity', player.sanity);
            this.updateElement('c-max-sanity', player.maxSanity);

            if (player.badge === '深渊使者') {
                const combat = this.game.state.combat;
                const madness = (combat && (combat as any).madness) || 0;
                this.updateElement('c-madness', madness);
                const madnessDisplay = document.getElementById('madness-display');
                if (madnessDisplay) {
                    madnessDisplay.style.display = 'inline';
                    if (madness >= 8) {
                        madnessDisplay.style.color = '#FF4500';
                        madnessDisplay.style.animation = 'madnessPulse 0.5s infinite';
                    } else {
                        madnessDisplay.style.color = '';
                        madnessDisplay.style.animation = 'none';
                    }
                }
            } else {
                const madnessDisplay = document.getElementById('madness-display');
                if (madnessDisplay) {
                    madnessDisplay.style.display = 'none';
                }
            }

            const sanityRatio = player.sanity / 50;  // 基于标准值50
            const sanityItem = document.querySelector('.sanity-item') as HTMLElement;
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

            if (this.game.SANITY_STATES && player.sanityLevel !== undefined) {
                const state = this.game.SANITY_STATES[player.sanityLevel];
                if (state) {
                    const stateEl = document.getElementById('sanity-state');
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

        this.renderCardZones();
        this.updateSanDistortion();
        this.renderHand();
    }

    public renderHand(): void {
        // 清除可能残留的 tooltip（DOM 重建前清理）
        this.hideCardTooltip();
        this.hideEnemyTooltip();

        const handEl = document.getElementById('hand-area');
        if (!handEl) return;

        handEl.innerHTML = '';

        const player = this.game.state.player!;
        const hand = player.hand;
        const selectedCard = (this.game.inputSystem as any).selectedCard;
        const sanityRatio = player.sanity / 50;
        const autoAwaken = !!(player.madnessMutations && player.madnessMutations.includes('unnameable'));

        // 类型默认图标
        const typeIcons: Record<string, string> = {
            attack: '⚔️', defense: '🛡️', skill: '✨', move: '👟', curse: '💀'
        };

        for (let i = 0; i < hand.length; i++) {
            const originalCard = hand[i];
            const displayCard = CardEvolutionEngine.getResolvedCard(originalCard, sanityRatio, autoAwaken);

            const cardEl = document.createElement('div');
            cardEl.className = `card ${originalCard.type}`;

            if (originalCard.mutated) cardEl.classList.add('mutated');

            // 觉醒视觉效果
            if (displayCard._awakened) {
                cardEl.classList.add('awakened');
                const awakeLevel = displayCard._awakeningLevel || 1;
                cardEl.setAttribute('data-awaken-level', String(awakeLevel));
                const glowColor = CardEvolutionEngine.getAwakeningColor(awakeLevel);
                cardEl.style.setProperty('--awaken-color', glowColor);
                cardEl.style.borderColor = glowColor;
            }

            if (selectedCard === i) cardEl.classList.add('selected');

            // === 名称栏 ===
            const header = document.createElement('div');
            header.className = 'card-header';

            const costEl = document.createElement('div');
            costEl.className = 'card-cost';
            costEl.textContent = String(displayCard.cost);
            header.appendChild(costEl);

            const nameEl = document.createElement('div');
            nameEl.className = 'card-name';
            nameEl.textContent = displayCard.name;
            if (displayCard._awakened) {
                nameEl.style.color = CardEvolutionEngine.getAwakeningColor(displayCard._awakeningLevel || 1);
            }
            header.appendChild(nameEl);
            cardEl.appendChild(header);

            // === 插画区 ===
            const artArea = document.createElement('div');
            artArea.className = 'card-art';

            // 尝试加载卡牌插画，失败则显示占位图标
            const cardId = originalCard.id || originalCard.name;
            const artImg = document.createElement('img');
            artImg.src = `cards/${cardId}.png`;
            artImg.alt = displayCard.name;
            artImg.onerror = () => {
                // 无插画时显示类型占位图标
                artImg.remove();
                const placeholder = document.createElement('div');
                placeholder.className = 'card-art-placeholder';
                placeholder.textContent = typeIcons[originalCard.type] || '🎴';
                artArea.appendChild(placeholder);
            };
            artArea.appendChild(artImg);
            cardEl.appendChild(artArea);

            // === 描述栏（含增减益内嵌着色）===
            const descArea = document.createElement('div');
            descArea.className = 'card-desc';
            const desc = displayCard.description || originalCard.description || '';
            const truncDesc = desc.length > 24 ? desc.substring(0, 24) + '…' : desc;

            // 收集 buff/debuff 修正
            const pAny = player as any;
            const attackBonus = this.game.buffManager.getValue('attackBonus');
            let atkStatusMod = 0;
            let blockStatusMod = 0;
            if (pAny.statusEffects && pAny.statusEffects.length > 0) {
                for (const se of pAny.statusEffects) {
                    if (se.type === 'debuff' && se.id === 'weaken_attack') atkStatusMod -= se.value;
                    if (se.type === 'buff' && se.id === 'buff_attack') atkStatusMod += se.value;
                    if (se.type === 'debuff' && se.id === 'weaken_defense') blockStatusMod -= se.value;
                    if (se.type === 'buff' && se.id === 'buff_defense') blockStatusMod += se.value;
                }
            }
            const dmgMod = attackBonus + atkStatusMod;
            const blkMod = blockStatusMod;

            // 构建 base值→{modified值, css类} 的替换映射
            const replacements: Array<{base: number; modified: number; cls: string}> = [];
            if (displayCard.effects && (dmgMod !== 0 || blkMod !== 0)) {
                for (const eff of displayCard.effects) {
                    if ((eff.type === 'targetDamage' || eff.type === 'rangedDamage' ||
                         eff.type === 'piercingDamage' || eff.type === 'aoe') && dmgMod !== 0) {
                        replacements.push({
                            base: eff.value,
                            modified: Math.max(0, eff.value + dmgMod),
                            cls: dmgMod > 0 ? 'stat-buffed' : 'stat-debuffed'
                        });
                    }
                    if (eff.type === 'gainBlock' && blkMod !== 0) {
                        replacements.push({
                            base: eff.value,
                            modified: Math.max(0, eff.value + blkMod),
                            cls: blkMod > 0 ? 'stat-buffed' : 'stat-debuffed'
                        });
                    }
                }
            }

            // 在描述文本中替换数值为着色版本
            if (replacements.length > 0) {
                let htmlDesc = truncDesc;
                // 用标记避免重复替换同一个数字
                for (const r of replacements) {
                    const baseStr = String(r.base);
                    // 替换描述中第一次出现的 base 数值
                    const idx = htmlDesc.indexOf(baseStr);
                    if (idx !== -1) {
                        htmlDesc = htmlDesc.substring(0, idx)
                            + `<span class="${r.cls}">${r.modified}</span>`
                            + htmlDesc.substring(idx + baseStr.length);
                    }
                }
                descArea.innerHTML = htmlDesc;
            } else {
                descArea.textContent = truncDesc;
            }
            cardEl.appendChild(descArea);

            // === 底部信息栏 ===
            const infoBar = document.createElement('div');
            infoBar.className = 'card-info-bar';

            if (originalCard.sanityCost) {
                const sanEl = document.createElement('span');
                sanEl.className = 'card-sanity-cost';
                sanEl.textContent = `🧠${originalCard.sanityCost}`;
                infoBar.appendChild(sanEl);
            }

            if (displayCard.range || originalCard.range) {
                const rangeEl = document.createElement('span');
                rangeEl.className = 'card-range';
                rangeEl.textContent = `射程:${displayCard.range || originalCard.range}`;
                infoBar.appendChild(rangeEl);
            }

            // 觉醒标记
            if (displayCard._awakened) {
                const awLabel = document.createElement('span');
                awLabel.style.color = CardEvolutionEngine.getAwakeningColor(displayCard._awakeningLevel || 1);
                awLabel.style.fontSize = '7px';
                awLabel.textContent = CardEvolutionEngine.getAwakeningDisplayName(displayCard._awakeningLevel || 1);
                infoBar.appendChild(awLabel);
            }

            cardEl.appendChild(infoBar);

            // === 事件 ===
            cardEl.addEventListener('click', () => {
                this.hideCardTooltip();  // 出牌时立即清除tooltip
                this.onCardClick(i);
            });

            let cardHoverTimer: ReturnType<typeof setTimeout> | null = null;
            cardEl.addEventListener('mouseover', (e) => {
                const target = e.target as HTMLElement;
                cardHoverTimer = setTimeout(() => {
                    this.showCardTooltip(originalCard, target);
                }, 2000);
            });

            cardEl.addEventListener('mouseout', () => {
                if (cardHoverTimer) { clearTimeout(cardHoverTimer); cardHoverTimer = null; }
                this.hideCardTooltip();
            });

            cardEl.addEventListener('touchstart', (e) => {
                this.showCardTooltip(originalCard, e.target as HTMLElement);
            });

            cardEl.addEventListener('touchend', () => {
                setTimeout(() => {
                    this.hideCardTooltip();
                }, 300);
            });

            handEl.appendChild(cardEl);
        }
    }

    private onCardClick(index: number): void {
        (this.game.inputSystem as any).handleCardClick(index);
    }

    public highlightAttackRange(range: number): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.highlightRange(this.game.state.player!.position, range);
        }
    }

    public clearAttackRange(): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.clearRange();
        }
    }

    public updateLog(): void {
        const logEl = document.getElementById('combat-log');
        if (!logEl) return;

        const combat = this.game.state.combat;
        if (!combat) return;

        logEl.innerHTML = '';

        const recentLogs = combat.log.slice(-10);
        for (let i = 0; i < recentLogs.length; i++) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = recentLogs[i];
            logEl.appendChild(entry);
        }

        logEl.scrollTop = logEl.scrollHeight;
    }

    public showDamageNumber(row: number, col: number, damage: number): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.showDamageNumber(row, col, damage);
        }
    }

    public showFloatingText(row: number, col: number, text: string, color?: string): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.showFloatingText(row, col, text, color);
        }
    }

    public playDeathAnimation(row: number, col: number): void {
        if (this.pixiRenderer) {
            this.pixiRenderer.playDeathAnimation(row, col);
        }
    }

    private _cardTooltipTimer: ReturnType<typeof setTimeout> | null = null;

    public showCardTooltip(card: any, targetEl: HTMLElement): void {
        this.hideCardTooltip();

        const tooltip = document.createElement('div');
        tooltip.id = 'card-tooltip';
        tooltip.className = 'card-tooltip';

        let content = `<div class="tooltip-name">${card.name}</div>`;
        content += `<div class="tooltip-cost">费用: ${card.cost}</div>`;

        if (card.type) {
            const typeNames: Record<string, string> = { attack: '攻击', defense: '防御', skill: '技能', move: '移动' };
            content += `<div class="tooltip-type ${card.type}">${typeNames[card.type] || card.type}</div>`;
        }

        if (card.description) {
            content += `<div class="tooltip-desc">${card.description}</div>`;
        }

        // 计算当前增减益修正（供tooltip显示）
        const ttPlayer = this.game.state.player;
        const ttPAny = ttPlayer as any;
        const ttAtkBonus = this.game.buffManager.getValue('attackBonus');
        let ttAtkStatus = 0, ttBlkStatus = 0;
        if (ttPAny.statusEffects && ttPAny.statusEffects.length > 0) {
            for (const se of ttPAny.statusEffects) {
                if (se.type === 'debuff' && se.id === 'weaken_attack') ttAtkStatus -= se.value;
                if (se.type === 'buff' && se.id === 'buff_attack') ttAtkStatus += se.value;
                if (se.type === 'debuff' && se.id === 'weaken_defense') ttBlkStatus -= se.value;
                if (se.type === 'buff' && se.id === 'buff_defense') ttBlkStatus += se.value;
            }
        }
        const ttDmgMod = ttAtkBonus + ttAtkStatus;
        const ttBlkMod = ttBlkStatus;

        const effectTexts: string[] = [];
        if (card.effects && card.effects.length > 0) {
            for (let ei = 0; ei < card.effects.length; ei++) {
                const eff = card.effects[ei];
                switch (eff.type) {
                    case 'targetDamage':
                    case 'rangedDamage':
                    case 'piercingDamage':
                        if (ttDmgMod !== 0) {
                            const modCls = ttDmgMod > 0 ? 'stat-buffed' : 'stat-debuffed';
                            const sign = ttDmgMod > 0 ? '+' : '';
                            effectTexts.push(`伤害: ${eff.value}（<span class="${modCls}">${sign}${ttDmgMod}</span>）`);
                        } else {
                            effectTexts.push(`伤害: ${eff.value}`);
                        }
                        break;
                    case 'gainBlock':
                        if (ttBlkMod !== 0) {
                            const modCls = ttBlkMod > 0 ? 'stat-buffed' : 'stat-debuffed';
                            const sign = ttBlkMod > 0 ? '+' : '';
                            effectTexts.push(`格挡: ${eff.value}（<span class="${modCls}">${sign}${ttBlkMod}</span>）`);
                        } else {
                            effectTexts.push(`格挡: ${eff.value}`);
                        }
                        break;
                    case 'aoe':
                        if (ttDmgMod !== 0) {
                            const modCls = ttDmgMod > 0 ? 'stat-buffed' : 'stat-debuffed';
                            const sign = ttDmgMod > 0 ? '+' : '';
                            effectTexts.push(`AOE: ${eff.value}（<span class="${modCls}">${sign}${ttDmgMod}</span>）`);
                        } else {
                            effectTexts.push(`AOE: ${eff.value}`);
                        }
                        break;
                    case 'heal': effectTexts.push(`恢复: ${eff.value}HP`); break;
                    case 'gainEnergy': effectTexts.push(`能量: +${eff.value}`); break;
                    case 'gainMovement': effectTexts.push(`移动力: +${eff.value}`); break;
                    case 'drawCards': effectTexts.push(`抽卡: ${eff.value}`); break;
                    case 'selfDamage': effectTexts.push(`自伤: ${eff.value}`); break;
                    case 'sanityCost': effectTexts.push(`🧠-${eff.value}`); break;
                    case 'sanityRestore': effectTexts.push(`🧠+${eff.value}`); break;
                }
            }
        }
        if (card.range) effectTexts.push(`射程: ${card.range}`);

        if (effectTexts.length > 0) {
            content += `<div class="tooltip-effects">${effectTexts.join(' | ')}</div>`;
        }

        if (card.badge) {
            content += `<div class="tooltip-badge">🏅 ${card.badge}专属</div>`;
        }

        // === 里词条觉醒层展示 ===
        if (card.innerEffects && card.innerEffects.length > 0) {
            const player = this.game.state.player;
            const sanityRatio = player.sanity / 50;  // 基于标准值50
            const autoAwaken = !!(player.madnessMutations && player.madnessMutations.includes('unnameable'));
            const display = CardEvolutionEngine.getInnerEffectDisplay(card, sanityRatio, autoAwaken);

            content += `<div class="tooltip-inner-divider">── 里·觉醒 ──</div>`;

            for (const tier of display.tiers) {
                if (tier.unlocked) {
                    content += `<div class="tooltip-inner-tier unlocked" style="border-left: 3px solid ${tier.color}; padding-left: 6px; margin: 4px 0;">`;
                    content += `<div style="color: ${tier.color}; font-weight: bold; font-size: 11px;">🔓 ${tier.tierName} (SAN&lt;${tier.threshold}%)</div>`;
                    content += `<div style="color: #e0e0e0; font-size: 10px;">${tier.text}</div>`;
                    if (tier.flavorText) {
                        content += `<div style="color: #888; font-style: italic; font-size: 9px;">「${tier.flavorText}」</div>`;
                    }
                    content += `</div>`;
                } else {
                    content += `<div class="tooltip-inner-tier locked" style="border-left: 3px solid #444; padding-left: 6px; margin: 4px 0; opacity: 0.7;">`;
                    content += `<div style="color: #666; font-weight: bold; font-size: 11px;">🔒 ${tier.tierName} (SAN&lt;${tier.threshold}%)</div>`;
                    content += `<div style="color: #555; font-size: 10px; font-family: serif; letter-spacing: 2px;">${tier.text}</div>`;
                    content += `</div>`;
                }
            }
        }

        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);

        const rect = targetEl.getBoundingClientRect();
        const tooltipHeight = tooltip.offsetHeight || 150;

        let top = rect.top - tooltipHeight - 10;
        let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;

        if (top < 0) top = rect.bottom + 10;
        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = window.innerWidth - tooltip.offsetWidth - 10;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = '1';

        // 安全网：6秒后自动消失，防止 mouseout 未触发导致残留
        this._cardTooltipTimer = setTimeout(() => {
            this.hideCardTooltip();
        }, 6000);
    }

    public hideCardTooltip(): void {
        if (this._cardTooltipTimer) {
            clearTimeout(this._cardTooltipTimer);
            this._cardTooltipTimer = null;
        }
        const tooltip = document.getElementById('card-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    }

    public showPassiveEffect(text: string, icon?: string): void {
        const effectEl = document.createElement('div');
        effectEl.className = 'passive-effect';
        effectEl.innerHTML = `<div class="passive-icon">${icon || '✨'}</div><div class="passive-text">${text}</div>`;

        // 计算已有通知的偏移量，实现堆叠
        const existing = document.querySelectorAll('.passive-effect');
        const offset = existing.length * 36;
        effectEl.style.top = `${10 + offset}px`;

        document.body.appendChild(effectEl);

        setTimeout(() => {
            if (effectEl.parentNode) {
                effectEl.parentNode.removeChild(effectEl);
            }
        }, 1800);
    }

    private getSanityStateColor(level: number): string {
        const colors: Record<number, string> = {
            5: '#9370DB', 4: '#FFD700', 3: '#FF8C00',
            2: '#FF6347', 1: '#FF1493', 0: '#8B0000'
        };
        return colors[level] || '#9370DB';
    }

    private updateElement(id: string, value: any): void {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = String(value);
        }
    }
}
