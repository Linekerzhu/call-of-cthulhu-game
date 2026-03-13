import Cards from '../data/Cards_Cthulhu.ts';
import type Game from '../core/Game.ts';

/**
 * RewardRenderer — 奖励界面渲染（全卡面展示版）
 */
export default class RewardRenderer {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public render(): void {

        const rewardCards = document.getElementById('reward-cards');
        if (!rewardCards) return;

        rewardCards.innerHTML = '';

        const playerBadge = this.game.state.player!.badge;
        const combatType = this.game.state.combat ? this.game.state.combat.type : 'combat';

        let rareChance = 0;
        if (combatType === 'elite') rareChance = 0.3;
        else if (combatType === 'boss') rareChance = 0.6;

        const commonCards: string[] = [];
        const uncommonCards: string[] = [];
        const rareCards: string[] = [];

        for (const key in Cards as Record<string, any>) {
            if (Object.prototype.hasOwnProperty.call(Cards, key)) {
                const card = (Cards as Record<string, any>)[key];
                if (!card.badge || card.badge === playerBadge) {
                    if (card.rarity === 'common') commonCards.push(key);
                    else if (card.rarity === 'uncommon') uncommonCards.push(key);
                    else if (card.rarity === 'rare') rareCards.push(key);
                }
            }
        }

        const selectedCards: string[] = [];
        for (let i = 0; i < 3; i++) {
            const roll = Math.random();
            let pool = commonCards;

            if (roll < rareChance && rareCards.length > 0) {
                pool = rareCards;
            } else if (roll < 0.6 && uncommonCards.length > 0) {
                pool = uncommonCards;
            } else if (commonCards.length > 0) {
                pool = commonCards;
            }

            if (pool.length > 0) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                const cardName = pool[randomIndex];
                selectedCards.push(cardName);

                let idx = commonCards.indexOf(cardName);
                if (idx > -1) commonCards.splice(idx, 1);
                idx = uncommonCards.indexOf(cardName);
                if (idx > -1) uncommonCards.splice(idx, 1);
                idx = rareCards.indexOf(cardName);
                if (idx > -1) rareCards.splice(idx, 1);
            }
        }

        const typeIcons: Record<string, string> = {
            attack: '⚔️', defense: '🛡️', skill: '✨', move: '👟', curse: '💀'
        };
        const typeNames: Record<string, string> = {
            attack: '攻击', defense: '防御', skill: '技能', move: '移动', curse: '诅咒'
        };
        const rarityNames: Record<string, string> = {
            common: '普通', uncommon: '稀有', rare: '传说'
        };

        for (let j = 0; j < selectedCards.length; j++) {
            const cardName = selectedCards[j];
            const cardData = (Cards as Record<string, any>)[cardName];

            // 外层包装（包含卡牌 + 代价标注）
            const wrapper = document.createElement('div');
            wrapper.className = 'reward-card-wrapper';

            // === 构建全卡面卡牌 ===
            const cardEl = document.createElement('div');
            cardEl.className = `card reward-full-card ${cardData.type}`;
            if (cardData.rarity === 'rare') cardEl.classList.add('rare-glow');
            if (cardData.rarity === 'uncommon') cardEl.classList.add('uncommon-glow');

            // 名称栏
            const header = document.createElement('div');
            header.className = 'card-header';

            const costEl = document.createElement('div');
            costEl.className = 'card-cost';
            costEl.textContent = String(cardData.cost);
            header.appendChild(costEl);

            const nameEl = document.createElement('div');
            nameEl.className = 'card-name';
            nameEl.textContent = cardData.name;
            header.appendChild(nameEl);
            cardEl.appendChild(header);

            // 插画区
            const artArea = document.createElement('div');
            artArea.className = 'card-art';
            const cardId = cardData.id || cardData.name;
            const artImg = document.createElement('img');
            artImg.src = `cards/${cardId}.png`;
            artImg.alt = cardData.name;
            artImg.onerror = () => {
                artImg.remove();
                const placeholder = document.createElement('div');
                placeholder.className = 'card-art-placeholder';
                placeholder.textContent = typeIcons[cardData.type] || '🎴';
                artArea.appendChild(placeholder);
            };
            artArea.appendChild(artImg);
            cardEl.appendChild(artArea);

            // 描述栏
            const descArea = document.createElement('div');
            descArea.className = 'card-desc';
            descArea.textContent = cardData.description || '';
            cardEl.appendChild(descArea);

            // 底部信息栏
            const infoBar = document.createElement('div');
            infoBar.className = 'card-info-bar';

            if (cardData.sanityCost) {
                const sanEl = document.createElement('span');
                sanEl.className = 'card-sanity-cost';
                sanEl.textContent = `🧠${cardData.sanityCost}`;
                infoBar.appendChild(sanEl);
            }

            if (cardData.range) {
                const rangeEl = document.createElement('span');
                rangeEl.className = 'card-range';
                rangeEl.textContent = `射程:${cardData.range}`;
                infoBar.appendChild(rangeEl);
            }

            if (cardData.consumable) {
                const conEl = document.createElement('span');
                conEl.className = 'card-consumable-tag';
                conEl.textContent = '消耗';
                infoBar.appendChild(conEl);
            }

            cardEl.appendChild(infoBar);

            // === 代价标注区 ===
            const costTag = document.createElement('div');
            costTag.className = 'reward-cost-tag';

            const typeTag = `<span class="rct-type">${typeIcons[cardData.type] || '🎴'} ${typeNames[cardData.type] || cardData.type}</span>`;
            const rarityTag = `<span class="rct-rarity rct-${cardData.rarity || 'common'}">${rarityNames[cardData.rarity] || ''}</span>`;

            // 收集所有代价（去重：top-level sanityCost 和 effects 中的 sanityCost 只显示一次）
            const costs: string[] = [];
            let sanityCostShown = false;
            if (cardData.sanityCost) {
                costs.push(`🧠 理智 -${cardData.sanityCost}`);
                sanityCostShown = true;
            }
            // 检查 effects 中的代价
            if (cardData.effects) {
                for (const eff of cardData.effects) {
                    if (eff.type === 'sanityCost' && !sanityCostShown) {
                        costs.push(`🧠 理智 -${eff.value}`);
                        sanityCostShown = true;
                    }
                    if (eff.type === 'selfDamage') costs.push(`💔 自伤 ${eff.value}`);
                    if (eff.type === 'consumeMadness') costs.push(`🌀 消耗疯狂值`);
                }
            }
            if (cardData.badge) {
                costs.push(`🏅 ${cardData.badge}专属`);
            }

            const costHtml = costs.length > 0
                ? `<div class="rct-costs">${costs.map(c => `<span class="rct-cost-item">${c}</span>`).join('')}</div>`
                : '';

            costTag.innerHTML = `${typeTag} ${rarityTag} ${costHtml}`;

            // 事件
            wrapper.addEventListener('click', () => {
                this.game.selectRewardCard(cardName);
            });

            wrapper.appendChild(cardEl);
            wrapper.appendChild(costTag);
            rewardCards.appendChild(wrapper);
        }
    }
}
