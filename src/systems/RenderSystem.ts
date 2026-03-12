import type Game from '../core/Game.ts';
import MapRenderer from '../renderers/MapRenderer.ts';
import CombatRenderer from '../renderers/CombatRenderer.ts';
import BadgeRenderer from '../renderers/BadgeRenderer.ts';
import RewardRenderer from '../renderers/RewardRenderer.ts';

/**
 * RenderSystem — Facade 委托器
 * 
 * 保持对外 API 不变，内部委托到场景化子渲染器。
 * 从 735 行瘦身到 ~80 行纯委托代码。
 */
export default class RenderSystem {
    private game: Game;
    private mapRenderer: MapRenderer;
    public combatRenderer: CombatRenderer;
    private badgeRenderer: BadgeRenderer;
    private rewardRenderer: RewardRenderer;

    constructor(game: Game) {
        this.game = game;
        this.mapRenderer = new MapRenderer(game);
        this.combatRenderer = new CombatRenderer(game);
        this.badgeRenderer = new BadgeRenderer(game);
        this.rewardRenderer = new RewardRenderer(game);

        // 注册事件监听
        this.game.eventBus.on('player:stats_changed', () => {
            this.updateCombatUI();
        });
        this.game.eventBus.on('player:damaged', (data: any) => {
            this.showDamageNumber(data.row, data.col, data.amount);
        });
        this.game.eventBus.on('game:log', () => {
            this.updateLog();
        });
    }

    // --- Map ---
    public renderMap(): void { this.mapRenderer.render(); }
    public updateMapUI(): void { this.mapRenderer.updateMapUI(); }

    // --- Combat ---
    public renderCombat(): void { this.combatRenderer.renderCombat(); }
    public renderEnemyPanel(): void { this.combatRenderer.renderEnemyPanel(); }
    public renderGrid(): void { this.combatRenderer.renderGrid(); }
    public renderEntities(): void { this.combatRenderer.renderEntities(); }
    public getCell(row: number, col: number): Element | null { return this.combatRenderer.getCell(row, col); }
    public renderMovePreview(fromRow: number, fromCol: number, toRow: number, toCol: number, dist: number): void { this.combatRenderer.renderMovePreview(fromRow, fromCol, toRow, toCol, dist); }
    public clearMovePreview(): void { this.combatRenderer.clearMovePreview(); }
    public updateCombatUI(): void { this.combatRenderer.updateCombatUI(); }
    public renderHand(): void { this.combatRenderer.renderHand(); }
    public highlightAttackRange(range: number): void { this.combatRenderer.highlightAttackRange(range); }
    public clearAttackRange(): void { this.combatRenderer.clearAttackRange(); }
    public updateLog(): void { this.combatRenderer.updateLog(); }
    public showDamageNumber(row: number, col: number, damage: number): void { this.combatRenderer.showDamageNumber(row, col, damage); }
    public showFloatingText(row: number, col: number, text: string, color?: string): void { this.combatRenderer.showFloatingText(row, col, text, color); }
    public playDeathAnimation(row: number, col: number): void { this.combatRenderer.playDeathAnimation(row, col); }
    public showCardTooltip(card: any, targetEl: HTMLElement): void { this.combatRenderer.showCardTooltip(card, targetEl); }
    public hideCardTooltip(): void { this.combatRenderer.hideCardTooltip(); }
    public showPassiveEffect(text: string, icon?: string): void { this.combatRenderer.showPassiveEffect(text, icon); }

    // --- Badge ---
    public renderBadgeSelect(): void { this.badgeRenderer.render(); }

    // --- Reward ---
    public renderRewardScreen(): void { this.rewardRenderer.render(); }

    // --- Scene-specific (delegated via game reference for now) ---
    public renderRestScreen(): void {
    }

    public renderShopScreen(): void {
    }

    public renderDeckViewer(fromScreen: string): void {
        const container = document.getElementById('deck-container');
        const countEl = document.getElementById('deck-count');
        if (!container) return;
        container.innerHTML = '';

        const player = this.game.state.player;
        const deck = player?.deck || [];

        if (countEl) countEl.textContent = String(deck.length);

        const tierColors: Record<number, string> = {
            0: '#8a9ba8', 1: '#aab4be', 2: '#6d9eeb', 3: '#9370DB', 4: '#FF6B35', 5: '#FF1744'
        };
        const tierNames: Record<number, string> = {
            0: '基础', 1: '不安之兆', 2: '诡秘残篇', 3: '异界低语', 4: '深渊启示', 5: '不可名状'
        };

        for (let i = 0; i < deck.length; i++) {
            const card = deck[i];
            const el = document.createElement('div');
            el.className = 'deck-card';
            const tier = card.forbiddenTier || 0;
            const borderColor = tierColors[tier] || '#8a9ba8';
            el.style.cssText = `border: 2px solid ${borderColor}; padding: 8px; margin: 4px; border-radius: 8px; background: rgba(0,0,0,0.4); display: inline-block; width: 120px; vertical-align: top; cursor: default;`;

            const typeBadge = card.type === 'attack' ? '⚔️' : card.type === 'defense' ? '🛡️' : card.type === 'skill' ? '✨' : '📜';
            el.innerHTML = `
                <div style="font-size: 11px; color: ${borderColor}; margin-bottom: 2px;">${tierNames[tier] || '基础'}</div>
                <div style="font-weight: bold; font-size: 13px; color: #e8d5b0;">${typeBadge} ${card.name}</div>
                <div style="font-size: 11px; color: #c9a84c;">费用: ${card.cost}</div>
                <div style="font-size: 11px; color: #999; margin-top: 4px;">${card.description || ''}</div>
            `;
            container.appendChild(el);
        }
    }
}
