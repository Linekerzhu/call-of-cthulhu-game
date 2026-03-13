import PixiRenderer from '../systems/PixiRenderer.ts';
import CardEvolutionEngine from '../systems/CardEvolutionEngine.ts';
import FogCanvas from '../systems/FogCanvas.ts';
import Protagonists from '../data/Protagonists.ts';
import { BadgeManager } from '../data/Badges_Cthulhu.ts';
import type Game from '../core/Game.ts';

/**
 * CombatRenderer — 战斗场景渲染
 * 
 * 包含战斗网格、手牌区、敌人面板、状态栏、日志、伤害数字等。
 */
export default class CombatRenderer {
    private game: Game;
    public pixiRenderer: PixiRenderer | null = null;
    private fogCanvas: FogCanvas | null = null;

    constructor(game: Game) {
        this.game = game;
    }

    public renderCombat(): void {
        if (!this.pixiRenderer) {
            this.pixiRenderer = new PixiRenderer(this.game);
        }
        this.pixiRenderer.init('grid');

        // 初始化背景雾气
        if (!this.fogCanvas) {
            this.fogCanvas = new FogCanvas();
        }
        this.fogCanvas.init('screen-combat');

        this.renderSidebar();
        this.renderGrid();
        this.updateCombatUI();

        // 初始化卡牌瞄准引导线
        this.initTargetingGuide();
    }

    /**
     * 初始化卡牌瞄准引导线（贝塞尔曲线）
     */
    private _targetingGuideInit = false;
    private initTargetingGuide(): void {
        if (this._targetingGuideInit) return;
        this._targetingGuideInit = true;

        const combatScreen = document.getElementById('screen-combat');
        const guidePath = document.getElementById('targeting-guide-path');
        const guideDot = document.getElementById('targeting-guide-dot');
        if (!combatScreen || !guidePath || !guideDot) return;

        combatScreen.addEventListener('mousemove', (e: MouseEvent) => {
            const selectedCard = (this.game.inputSystem as any).selectedCard;
            if (selectedCard === null || selectedCard === undefined || selectedCard < 0) {
                guidePath.setAttribute('opacity', '0');
                guideDot.setAttribute('opacity', '0');
                return;
            }

            // 找到选中卡牌的DOM元素位置
            const handArea = document.getElementById('hand-area');
            const cards = handArea?.querySelectorAll('.card');
            if (!cards || !cards[selectedCard]) {
                guidePath.setAttribute('opacity', '0');
                guideDot.setAttribute('opacity', '0');
                return;
            }

            const cardRect = cards[selectedCard].getBoundingClientRect();
            const screenRect = combatScreen.getBoundingClientRect();

            const startX = cardRect.left + cardRect.width / 2 - screenRect.left;
            const startY = cardRect.top - screenRect.top;
            const endX = e.clientX - screenRect.left;
            const endY = e.clientY - screenRect.top;

            // 贝塞尔曲线控制点 — 从卡牌向上弯曲
            const cpY = Math.min(startY, endY) - 60;
            const cpX1 = startX + (endX - startX) * 0.3;
            const cpX2 = startX + (endX - startX) * 0.7;

            const d = `M ${startX} ${startY} C ${cpX1} ${cpY}, ${cpX2} ${cpY}, ${endX} ${endY}`;
            guidePath.setAttribute('d', d);
            guidePath.setAttribute('opacity', '0.7');
            guideDot.setAttribute('cx', String(endX));
            guideDot.setAttribute('cy', String(endY));
            guideDot.setAttribute('opacity', '0.8');
        });
    }

    /**
     * 渲染侧边栏：头像 + 名字
     */
    public renderSidebar(): void {
        const player = this.game.state.player;
        const protagonistId = (player as any).protagonist;
        const pData = protagonistId ? Protagonists[protagonistId] : null;

        // 头像
        const avatarImg = document.getElementById('sidebar-avatar') as HTMLImageElement;
        if (avatarImg && pData) {
            avatarImg.src = pData.avatar;
            avatarImg.alt = pData.name;
        }

        // 名字
        const nameEl = document.getElementById('sidebar-name');
        if (nameEl) nameEl.textContent = pData ? pData.name : '调查员';

        // 徽章图标
        const badgeId = player.badge;
        if (badgeId) {
            const badge = BadgeManager.getBadge(badgeId);
            if (badge) {
                const badgeIcon = document.getElementById('badge-icon');
                if (badgeIcon) badgeIcon.textContent = badge.icon;

                const badgeOverlay = document.getElementById('badge-overlay');
                const badgeTooltip = document.getElementById('badge-tooltip');
                const tooltipName = document.getElementById('badge-tooltip-name');
                const tooltipDesc = document.getElementById('badge-tooltip-desc');

                if (tooltipName) tooltipName.textContent = badge.icon + ' ' + badge.name;
                if (tooltipDesc) tooltipDesc.textContent = badge.description;

                // 点击切换徽章说明
                if (badgeOverlay && badgeTooltip) {
                    badgeOverlay.onclick = (e) => {
                        e.stopPropagation();
                        badgeTooltip.style.display = badgeTooltip.style.display === 'none' ? 'block' : 'none';
                    };
                    // 点击其他地方关闭
                    document.addEventListener('click', () => {
                        if (badgeTooltip) badgeTooltip.style.display = 'none';
                    }, { once: false });
                }
            }
        }

        // 初始化雷达图
        this.updateRadarChart();
    }

    /**
     * SVG 六维雷达图渲染
     */
    public updateRadarChart(): void {
        const svg = document.getElementById('radar-chart');
        if (!svg) return;

        const player = this.game.state.player as any;
        const stats = [
            { key: '体格', val: player.physique || 10, max: 20 },
            { key: '速度', val: player.speed || 10, max: 20 },
            { key: '力量', val: player.strength || 10, max: 20 },
            { key: '意志', val: player.will || 10, max: 20 },
            { key: '知识', val: player.knowledge || 10, max: 20 },
            { key: '威压', val: player.coercion || 10, max: 20 },
        ];

        const cx = 80, cy = 70, maxR = 50;
        const n = stats.length;
        const angleStep = (Math.PI * 2) / n;
        const startAngle = -Math.PI / 2;

        // 计算各顶点
        const getPoint = (i: number, ratio: number) => {
            const a = startAngle + i * angleStep;
            return {
                x: cx + Math.cos(a) * maxR * ratio,
                y: cy + Math.sin(a) * maxR * ratio
            };
        };

        let html = '';

        // 背景网格 (3层)
        for (const level of [0.33, 0.66, 1.0]) {
            const pts = stats.map((_, i) => getPoint(i, level));
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
            html += `<path d="${d}" fill="none" stroke="rgba(201,168,76,${0.08 + level * 0.08})" stroke-width="0.5"/>`;
        }

        // 轴线
        for (let i = 0; i < n; i++) {
            const p = getPoint(i, 1);
            html += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(201,168,76,0.12)" stroke-width="0.5"/>`;
        }

        // 数据多边形
        const dataPts = stats.map((s, i) => getPoint(i, Math.min(s.val / s.max, 1)));
        const dataD = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        html += `<path d="${dataD}" fill="rgba(147,112,219,0.15)" stroke="rgba(147,112,219,0.7)" stroke-width="1.5"/>`;

        // 顶点圆点 + 标签
        for (let i = 0; i < n; i++) {
            const dp = dataPts[i];
            const lp = getPoint(i, 1.22);
            const mod = Math.floor((stats[i].val - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            const modColor = mod > 0 ? '#4ec9a0' : mod < 0 ? '#e06060' : 'rgba(200,195,180,0.5)';

            // 数据点
            html += `<circle cx="${dp.x.toFixed(1)}" cy="${dp.y.toFixed(1)}" r="2" fill="rgba(147,112,219,0.9)"/>`;

            // 标签
            html += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="rgba(200,195,180,0.65)" font-family="monospace">${stats[i].key}</text>`;
            html += `<text x="${lp.x.toFixed(1)}" y="${(lp.y + 9).toFixed(1)}" text-anchor="middle" font-size="7" fill="${modColor}" font-family="monospace" font-weight="bold">${stats[i].val}(${modStr})</text>`;
        }

        svg.innerHTML = html;
    }

    /**
     * 更新HP/SAN状态条
     */
    private updateStatBars(): void {
        const player = this.game.state.player;

        const hpBar = document.getElementById('bar-hp');
        if (hpBar) {
            const pct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
            hpBar.style.width = pct + '%';
        }

        const sanBar = document.getElementById('bar-san');
        if (sanBar) {
            const pct = Math.max(0, Math.min(100, (player.sanity / player.maxSanity) * 100));
            sanBar.style.width = pct + '%';
        }
    }

    /**
     * 显示 Buff/Debuff 状态效果
     */
    private updateBuffDisplay(): void {
        const list = document.getElementById('buffs-list');
        if (!list) return;

        list.innerHTML = '';
        const player = this.game.state.player as any;

        // 从 buffManager 获取
        const atkBonus = this.game.buffManager.getValue('attackBonus');
        if (atkBonus > 0) this.appendBuff(list, '⚔', `攻+${atkBonus}`, 'buff');
        if (atkBonus < 0) this.appendBuff(list, '⚔', `攻${atkBonus}`, 'debuff');

        // 从 statusEffects 获取
        if (player.statusEffects && player.statusEffects.length > 0) {
            for (const se of player.statusEffects) {
                const icon = se.type === 'buff' ? '✨' : '☠️';
                const label = se.id.replace('_', ' ');
                this.appendBuff(list, icon, `${label} ${se.value}`, se.type);
            }
        }

        // 疯狂突变
        if (player.madnessMutations && player.madnessMutations.length > 0) {
            for (const m of player.madnessMutations) {
                this.appendBuff(list, '🌀', m, 'debuff');
            }
        }

        // 无状态时显示提示
        if (list.children.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'font-size:9px;color:rgba(200,195,180,0.3);text-align:center;';
            empty.textContent = '— 无 —';
            list.appendChild(empty);
        }
    }

    private appendBuff(container: HTMLElement, icon: string, text: string, type: string): void {
        const badge = document.createElement('div');
        badge.className = `buff-badge is-${type}`;
        badge.innerHTML = `<span class="buff-icon">${icon}</span><span class="buff-value">${text}</span>`;
        container.appendChild(badge);
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
                    madnessDisplay.style.display = 'inline-flex';
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

        // 更新侧边栏
        this.updateStatBars();
        this.updateRadarChart();
        this.updateBuffDisplay();

        this.renderCardZones();
        this.updateSanDistortion();

        // 理智关联视觉腐蚀效果
        this.updateSanityCorruption();

        // 更新回合卷轴 Banner
        this.updateTurnBanner();

        this.renderHand();
    }

    /**
     * 更新棋盘顶部回合卷轴 Banner
     */
    private _lastTurn: number = 0;
    private updateTurnBanner(): void {
        const combat = this.game.state.combat;
        if (!combat) return;

        const turnNum = document.getElementById('turn-number');
        const turnPhase = document.getElementById('turn-phase');
        const banner = document.getElementById('turn-scroll-banner');

        if (turnNum) turnNum.textContent = String(combat.turn || 1);
        if (turnPhase) {
            turnPhase.textContent = combat.phase === 'enemy'
                ? '深渊潮涌' : '玄入者行动';
        }

        // 回合切换闪烁
        if (banner && combat.turn !== this._lastTurn) {
            this._lastTurn = combat.turn;
            banner.classList.remove('flash');
            void banner.offsetWidth; // force reflow
            banner.classList.add('flash');
        }
    }

    /**
     * 根据理智值切换视觉腐蚀CSS类
     */
    private updateSanityCorruption(): void {
        const player = this.game.state.player;
        const sanRatio = player.sanity / (player.maxSanity || 50);

        const sidebar = document.getElementById('combat-sidebar');
        const sanBar = document.getElementById('bar-san');
        const handArea = document.getElementById('hand-area');

        if (sidebar) {
            sidebar.classList.toggle('san-low', sanRatio < 0.6);
        }
        if (sanBar) {
            sanBar.classList.toggle('san-critical', sanRatio < 0.3);
        }
        if (handArea) {
            handArea.classList.toggle('san-severe', sanRatio < 0.3);
        }
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

        // === 扇形布局参数 ===
        const totalCards = hand.length;
        const fanAngle = totalCards <= 3 ? 4 : totalCards <= 5 ? 3.5 : totalCards <= 7 ? 3 : 2.5; // 每张牌的角度
        const cardSpacing = totalCards <= 3 ? 90 : totalCards <= 5 ? 75 : totalCards <= 7 ? 65 : 55;
        const arcFactor = totalCards <= 3 ? 4 : totalCards <= 5 ? 5 : 6; // 弧线下沉系数

        const cardElements: HTMLElement[] = [];

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

            // === 扇形布局 Transform ===
            const offset = i - (totalCards - 1) / 2;
            const rotation = offset * fanAngle;
            const yShift = Math.abs(offset) * arcFactor;
            cardEl.style.setProperty('--fan-rotation', `${rotation}deg`);
            cardEl.style.setProperty('--fan-y', `${yShift}px`);
            cardEl.style.transform = `translateY(${yShift}px) rotate(${rotation}deg)`;
            cardEl.style.zIndex = String(50 + i);
            // 调整间距
            if (totalCards > 1) {
                cardEl.style.marginLeft = i === 0 ? '0' : `-${120 - cardSpacing}px`;
            }

            // === 事件 ===
            cardEl.addEventListener('click', () => {
                this.hideCardTooltip();  // 出牌时立即清除tooltip
                this.onCardClick(i);
            });

            // === 扇形 Hover 交互 ===
            const cardIndex = i;
            cardEl.addEventListener('mouseenter', () => {
                // 悬浮卡牌：上浮 + 放大 + 去除旋转
                cardEl.style.transform = 'translateY(-40px) scale(1.25) rotate(0deg)';
                cardEl.style.zIndex = '200';
                cardEl.classList.add('fan-hover');

                // 邻牌避让
                if (cardIndex > 0 && cardElements[cardIndex - 1]) {
                    const prevOffset = (cardIndex - 1) - (totalCards - 1) / 2;
                    const prevRot = prevOffset * fanAngle;
                    const prevY = Math.abs(prevOffset) * arcFactor;
                    cardElements[cardIndex - 1].style.transform =
                        `translateX(-20px) translateY(${prevY}px) rotate(${prevRot}deg)`;
                }
                if (cardIndex < totalCards - 1 && cardElements[cardIndex + 1]) {
                    const nextOffset = (cardIndex + 1) - (totalCards - 1) / 2;
                    const nextRot = nextOffset * fanAngle;
                    const nextY = Math.abs(nextOffset) * arcFactor;
                    cardElements[cardIndex + 1].style.transform =
                        `translateX(20px) translateY(${nextY}px) rotate(${nextRot}deg)`;
                }
            });

            cardEl.addEventListener('mouseleave', () => {
                // 恢复扇形原位
                cardEl.style.transform = `translateY(${yShift}px) rotate(${rotation}deg)`;
                cardEl.style.zIndex = String(50 + cardIndex);
                cardEl.classList.remove('fan-hover');

                // 恢复邻牌
                if (cardIndex > 0 && cardElements[cardIndex - 1]) {
                    const prevOffset = (cardIndex - 1) - (totalCards - 1) / 2;
                    const prevRot = prevOffset * fanAngle;
                    const prevY = Math.abs(prevOffset) * arcFactor;
                    cardElements[cardIndex - 1].style.transform =
                        `translateY(${prevY}px) rotate(${prevRot}deg)`;
                }
                if (cardIndex < totalCards - 1 && cardElements[cardIndex + 1]) {
                    const nextOffset = (cardIndex + 1) - (totalCards - 1) / 2;
                    const nextRot = nextOffset * fanAngle;
                    const nextY = Math.abs(nextOffset) * arcFactor;
                    cardElements[cardIndex + 1].style.transform =
                        `translateY(${nextY}px) rotate(${nextRot}deg)`;
                }
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

            cardElements.push(cardEl);
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
