import type Game from '../core/Game.ts';
import MapRenderer from '../renderers/MapRenderer.ts';
import CombatRenderer from '../renderers/CombatRenderer.ts';
import BadgeRenderer from '../renderers/BadgeRenderer.ts';
import RewardRenderer from '../renderers/RewardRenderer.ts';
import Shop from '../data/Shop.ts';

/**
 * RenderSystem — Facade 委托器
 * 
 * 保持对外 API 不变，内部委托到场景化子渲染器。
 */
export default class RenderSystem {
    private game: Game;
    private mapRenderer: MapRenderer;
    public combatRenderer: CombatRenderer;
    private badgeRenderer: BadgeRenderer;
    private rewardRenderer: RewardRenderer;
    private shopItems: any[] = [];

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

    // ====================
    // 休息站渲染
    // ====================
    public renderRestScreen(): void {
        // 更新休息站UI中的状态信息（如果需要）
        const player = this.game.state.player;
        const healAmount = Math.floor(player.maxHp * 0.3);
        const restDesc = document.querySelector('#rest-heal .rest-desc');
        if (restDesc) restDesc.textContent = `恢复 ${healAmount} 点生命值 (30%)`;
    }

    // ====================
    // 休息站卡牌升级选择
    // ====================
    public renderRestUpgradeSelection(): void {
        const player = this.game.state.player;
        const deck = player?.deck || [];
        const upgradable = deck.filter((c: any) => c.upgrade && !c.upgraded);

        if (upgradable.length === 0) {
            this.showPassiveEffect('没有可升级的卡牌', '⚠️');
            return;
        }

        // 创建模态覆盖层
        const overlay = document.createElement('div');
        overlay.id = 'upgrade-overlay';
        overlay.className = 'upgrade-overlay';

        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';

        const title = document.createElement('h2');
        title.className = 'upgrade-title';
        title.textContent = '⬆️ 选择一张卡牌升级';
        modal.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.className = 'upgrade-subtitle';
        subtitle.textContent = '升级后的效果将永久生效';
        modal.appendChild(subtitle);

        const cardList = document.createElement('div');
        cardList.className = 'upgrade-card-list';

        const typeIcons: Record<string, string> = {
            attack: '⚔️', defense: '🛡️', skill: '✨', move: '👟', curse: '💀'
        };

        for (let i = 0; i < deck.length; i++) {
            const card = deck[i];
            if (!card.upgrade || card.upgraded) continue;

            const cardEl = this.buildFullCard(card, typeIcons);
            cardEl.classList.add('upgrade-candidate');

            // 升级预览信息
            const upgradeInfo = document.createElement('div');
            upgradeInfo.className = 'upgrade-preview';
            const previews: string[] = [];
            if (card.upgrade.damage) previews.push(`伤害→${card.upgrade.damage}`);
            if (card.upgrade.block) previews.push(`格挡→${card.upgrade.block}`);
            if (card.upgrade.description) previews.push(card.upgrade.description);
            upgradeInfo.textContent = previews.length > 0 ? `⬆ ${previews.join(' | ')}` : '⬆ 强化';
            cardEl.appendChild(upgradeInfo);

            const deckIndex = i;
            cardEl.addEventListener('click', () => {
                overlay.remove();
                this.game.executeUpgrade(deckIndex);
            });

            cardList.appendChild(cardEl);
        }

        modal.appendChild(cardList);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-pixel upgrade-cancel';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
        });
        modal.appendChild(cancelBtn);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // ====================
    // 商店渲染
    // ====================
    public renderShopScreen(): void {
        const container = document.getElementById('shop-items');
        if (!container) return;
        container.innerHTML = '';

        const player = this.game.state.player;

        // 更新商店状态栏
        const sanMaxEl = document.getElementById('shop-san-max');
        const hpMaxEl = document.getElementById('shop-hp-max');
        if (sanMaxEl) sanMaxEl.textContent = String(player.maxSanity);
        if (hpMaxEl) hpMaxEl.textContent = String(player.maxHp);

        // 生成商品
        this.shopItems = Shop.generateShop(player.badge);

        const typeIcons: Record<string, string> = {
            attack: '⚔️', defense: '🛡️', skill: '✨', move: '👟', curse: '💀'
        };

        for (let i = 0; i < this.shopItems.length; i++) {
            const item = this.shopItems[i];
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.id = `shop-item-${i}`;

            // 判断是否买得起
            let canAfford = true;
            if (item.priceType === 'sanMax' && player.maxSanity - item.price < 10) canAfford = false;
            if (item.priceType === 'hpMax' && player.maxHp - item.price < 10) canAfford = false;

            if (!canAfford) itemEl.classList.add('disabled');

            // 图标区
            const iconEl = document.createElement('div');
            iconEl.className = 'shop-item-icon';
            if (item.type === 'card') {
                iconEl.textContent = typeIcons[item.cardType] || '🎴';
            } else {
                const serviceIcons: Record<string, string> = {
                    heal: '❤️', sanity_restore: '🧠', remove_card: '🗑️', blood_altar: '🩸'
                };
                iconEl.textContent = serviceIcons[item.id] || '🔮';
            }
            itemEl.appendChild(iconEl);

            // 信息区
            const infoEl = document.createElement('div');
            infoEl.className = 'shop-item-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'shop-item-name';
            nameEl.textContent = item.name;
            if (item.type === 'card' && item.tierName) {
                const tierTag = document.createElement('span');
                tierTag.className = 'shop-tier-tag';
                tierTag.textContent = ` [${item.tierName}]`;
                nameEl.appendChild(tierTag);
            }
            infoEl.appendChild(nameEl);

            const descEl = document.createElement('div');
            descEl.className = 'shop-item-desc';
            descEl.textContent = item.description || '';
            infoEl.appendChild(descEl);

            itemEl.appendChild(infoEl);

            // 价格区
            const priceEl = document.createElement('div');
            priceEl.className = `shop-item-price ${canAfford ? 'affordable' : 'expensive'}`;
            if (item.priceType === 'free') {
                priceEl.textContent = '免费';
            } else if (item.priceType === 'sanMax') {
                priceEl.textContent = `☽ -${item.price} SAN上限`;
            } else if (item.priceType === 'hpMax') {
                priceEl.textContent = `♥ -${item.price} HP上限`;
            }
            itemEl.appendChild(priceEl);

            // 购买事件
            if (canAfford) {
                const shopIndex = i;
                itemEl.addEventListener('click', () => {
                    this.handleShopPurchase(shopIndex);
                });
            }

            container.appendChild(itemEl);
        }
    }

    private handleShopPurchase(index: number): void {
        const item = this.shopItems[index];
        if (!item) return;

        const player = this.game.state.player;
        const result = Shop.buyItem(player, item);

        if (result.success) {
            this.showPassiveEffect(result.message, '✅');
            // 标记已购买
            item._purchased = true;
            // 重新渲染商店
            this.renderShopScreen();
        } else {
            this.showPassiveEffect(result.message, '❌');
        }
    }

    // ====================
    // 牌库查看器（完整卡面版）
    // ====================
    public renderDeckViewer(fromScreen: string): void {
        const container = document.getElementById('deck-container');
        const countEl = document.getElementById('deck-count');
        if (!container) return;
        container.innerHTML = '';

        const player = this.game.state.player;
        const deck = player?.deck || [];

        if (countEl) countEl.textContent = String(deck.length);

        const typeIcons: Record<string, string> = {
            attack: '⚔️', defense: '🛡️', skill: '✨', move: '👟', curse: '💀'
        };

        for (let i = 0; i < deck.length; i++) {
            const card = deck[i];
            const cardEl = this.buildFullCard(card, typeIcons);

            // 悬浮详情 tooltip
            let hoverTimer: ReturnType<typeof setTimeout> | null = null;
            cardEl.addEventListener('mouseover', (e) => {
                const target = e.currentTarget as HTMLElement;
                hoverTimer = setTimeout(() => {
                    this.combatRenderer.showCardTooltip(card, target);
                }, 800);
            });
            cardEl.addEventListener('mouseout', () => {
                if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
                this.combatRenderer.hideCardTooltip();
            });
            // 触屏支持
            cardEl.addEventListener('touchstart', (e) => {
                this.combatRenderer.showCardTooltip(card, e.currentTarget as HTMLElement);
            });
            cardEl.addEventListener('touchend', () => {
                setTimeout(() => this.combatRenderer.hideCardTooltip(), 300);
            });

            container.appendChild(cardEl);
        }
    }

    // ====================
    // 统一的完整卡面构建方法
    // ====================
    private buildFullCard(card: any, typeIcons: Record<string, string>): HTMLElement {
        const cardEl = document.createElement('div');
        cardEl.className = `card deck-full-card ${card.type}`;
        if (card.upgraded) cardEl.classList.add('upgraded');

        // 名称栏
        const header = document.createElement('div');
        header.className = 'card-header';

        const costEl = document.createElement('div');
        costEl.className = 'card-cost';
        costEl.textContent = String(card.cost);
        header.appendChild(costEl);

        const nameEl = document.createElement('div');
        nameEl.className = 'card-name';
        nameEl.textContent = card.name;
        header.appendChild(nameEl);
        cardEl.appendChild(header);

        // 插画区
        const artArea = document.createElement('div');
        artArea.className = 'card-art';
        const cardId = card.id || card.name;
        const artImg = document.createElement('img');
        artImg.src = `cards/${cardId}.png`;
        artImg.alt = card.name;
        artImg.onerror = () => {
            artImg.remove();
            const placeholder = document.createElement('div');
            placeholder.className = 'card-art-placeholder';
            placeholder.textContent = typeIcons[card.type] || '🎴';
            artArea.appendChild(placeholder);
        };
        artArea.appendChild(artImg);
        cardEl.appendChild(artArea);

        // 描述栏
        const descArea = document.createElement('div');
        descArea.className = 'card-desc';
        descArea.textContent = card.description || '';
        cardEl.appendChild(descArea);

        // 底部信息栏
        const infoBar = document.createElement('div');
        infoBar.className = 'card-info-bar';

        if (card.sanityCost) {
            const sanEl = document.createElement('span');
            sanEl.className = 'card-sanity-cost';
            sanEl.textContent = `🧠${card.sanityCost}`;
            infoBar.appendChild(sanEl);
        }

        if (card.range) {
            const rangeEl = document.createElement('span');
            rangeEl.className = 'card-range';
            rangeEl.textContent = `射程:${card.range}`;
            infoBar.appendChild(rangeEl);
        }

        if (card.consumable) {
            const conEl = document.createElement('span');
            conEl.className = 'card-consumable-tag';
            conEl.textContent = '消耗';
            infoBar.appendChild(conEl);
        }

        // 禁忌等级
        const tier = card.forbiddenTier || 0;
        if (tier > 0) {
            const tierNames: Record<number, string> = {
                1: '不安之兆', 2: '诡秘残篇', 3: '异界低语', 4: '深渊启示', 5: '不可名状'
            };
            const tierEl = document.createElement('span');
            tierEl.className = `card-tier tier-${tier}`;
            tierEl.textContent = tierNames[tier] || '';
            infoBar.appendChild(tierEl);
        }

        cardEl.appendChild(infoBar);

        return cardEl;
    }
}
