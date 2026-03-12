import { BadgeManager } from '../data/Badges_Cthulhu.ts';
import type Game from '../core/Game.ts';

/**
 * BadgeRenderer — 徽章选择场景渲染
 */
export default class BadgeRenderer {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public render(): void {

        const badgeList = document.getElementById('badge-list');
        if (!badgeList) {
            return;
        }

        badgeList.innerHTML = '';

        const badges = BadgeManager.getBadgeList();

        for (let i = 0; i < badges.length; i++) {
            const badge = badges[i];
            const card = document.createElement('div');
            card.className = `badge-card ${badge.type}`;

            let cardsText = '';
            if (badge.startingCards && badge.startingCards.length > 0) {
                cardsText = `起始卡牌: ${badge.startingCards.join('、')}`;
            }

            const typeNames: Record<string, string> = {
                'attack': '攻击型',
                'defense': '防御型',
                'control': '控制型'
            };
            const typeName = typeNames[badge.type] || badge.type;

            card.innerHTML =
                `<div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <div class="badge-name">${badge.name}</div>
                    <span class="badge-type ${badge.type}">${typeName}</span>
                    <div class="badge-desc">${badge.description}</div>
                    <div class="badge-passive">被动: ${badge.passive || ''}</div>
                    <div class="badge-cards">${cardsText}</div>
                </div>`;

            card.onclick = () => {
                this.game.selectBadge(badge.id);
            };

            badgeList.appendChild(card);
        }
    }
}
