import Utils from '../core/Utils.ts';
import Cards from '../data/Cards_Cthulhu.ts';
import type Game from '../core/Game.ts';

/**
 * NightmareSystem — 噩梦事件系统
 * 
 * 管理休息站噩梦事件、禁忌知识侵蚀。
 * 从 Game.ts 中提取为独立模块。
 */
export default class NightmareSystem {
    private game: Game;
    public _pendingAbyssGaze: boolean = false;

    public readonly NIGHTMARES: any[] = [
        {
            id: 'abyss_gaze',
            icon: '👁️',
            title: '深渊凝视',
            desc: '你在梦中看见了深渊...深渊也在看你。那双眼睛将永远刻在你的记忆中。',
            effect: '正常恢复，但理智上限永久 -3',
            apply: (game: Game, healAmount: number) => {
                game.nightmareSystem._pendingAbyssGaze = true;
                game.renderSystem?.showPassiveEffect('👁️ 深渊在凝视你！理智上限 -3', '🧠');
                return true;
            }
        },
        {
            id: 'false_peace',
            icon: '💤',
            title: '虚假安宁',
            desc: '你以为自己休息了很久，但睁开眼才发现只过了一瞬。那不是休息，只是另一个噩梦的间隙。',
            effect: '只恢复一半效果',
            apply: (game: Game, healAmount: number) => {
                return false;
            }
        },
        {
            id: 'tentacle_whisper',
            icon: '🐙',
            title: '触手低语',
            desc: '耳边传来细碎的低语，像是无数触手在你的记忆中翻搅。醒来后，某些记忆已经...不一样了。',
            effect: '正常恢复，但卡组中随机一张卡被永久扭曲',
            apply: (game: Game, healAmount: number) => {
                const deck = game.state.player!.deck;
                const candidates: number[] = [];
                for (let i = 0; i < deck.length; i++) {
                    if (deck[i].rarity !== 'basic' && !deck[i].mutated) {
                        candidates.push(i);
                    }
                }
                if (candidates.length > 0) {
                    const idx = candidates[Math.floor(Math.random() * candidates.length)];
                    const card = deck[idx];
                    card.mutated = true;
                    card.originalName = card.name;
                    card.name = '扭曲·' + card.name;
                    game.combatSystem?.applyMutation(card);
                    game.renderSystem?.showPassiveEffect(`🐙 ${card.originalName} 被扭曲了`, '🌀');
                }
                return true;
            }
        },
        {
            id: 'forbidden_revelation',
            icon: '📖',
            title: '禁忌启示',
            desc: '梦中一本古老的典籍向你展开，你看到了不应被凡人知晓的力量...代价是你的一部分心智。',
            effect: '获得一张随机稀有卡，但理智 -10',
            apply: (game: Game, healAmount: number) => {
                const rareCards: string[] = [];
                for (const name in Cards as Record<string, any>) {
                    if ((Cards as Record<string, any>)[name].rarity === 'rare' || (Cards as Record<string, any>)[name].rarity === 'uncommon') {
                        rareCards.push(name);
                    }
                }
                if (rareCards.length > 0) {
                    const cardName = rareCards[Math.floor(Math.random() * rareCards.length)];
                    const cardCopy = Utils.deepCopy((Cards as Record<string, any>)[cardName]);
                    game.state.player!.deck.push(cardCopy);
                    const discardCopy = Utils.deepCopy((Cards as Record<string, any>)[cardName]);
                    game.state.player!.discardPile.push(discardCopy);
                    game.nightmareSystem.applyForbiddenKnowledge(cardCopy);
                    game.renderSystem?.showPassiveEffect(`📖 获得 ${cardName}`, '📕');
                }
                game.state.modifySanity(-10, '禁忌启示');
                game.state.modifyMaxSanity(-5, '禁忌启示');
                return true;
            }
        }
    ];

    constructor(game: Game) {
        this.game = game;
    }

    public applyForbiddenKnowledge(card: any, isUpgrade?: boolean): void {
        const player = this.game.state.player!;
        let sanLoss = 0;

        if (isUpgrade) {
            sanLoss = 2;
        } else {
            const costTable: Record<string, number> = { basic: 0, common: 2, uncommon: 4, rare: 7 };
            sanLoss = costTable[card.rarity] || 0;
        }

        if (sanLoss > 0) {
            this.game.state.modifyMaxSanity(-sanLoss);

            const msg = isUpgrade
                ? `📕 打磨知识灼烧心智... 理智上限 -${sanLoss}`
                : `📕 禁忌知识！理智上限永久 -${sanLoss}`;

            if (this.game.state.combat) {
                this.game.state.log(msg);
            }
            this.game.renderSystem?.showPassiveEffect(`📕 理智上限 -${sanLoss}`, '🧠');
        }
    }

    public rollNightmare(): any {
        const level = this.game.state.player!.sanityLevel;
        const nightmareChance: Record<number, number> = { 5: 0, 4: 0.15, 3: 0.30, 2: 0.50, 1: 0.70, 0: 0.70 };
        const chance = nightmareChance[level] || 0;

        if (Math.random() >= chance) return null;

        return this.NIGHTMARES[Math.floor(Math.random() * this.NIGHTMARES.length)];
    }

    public showNightmare(nightmare: any, callback?: () => void): void {
        const overlay = document.createElement('div');
        overlay.className = 'nightmare-overlay';
        overlay.innerHTML =
            `<div class="nightmare-modal">
                <div class="nightmare-icon">${nightmare.icon}</div>
                <div class="nightmare-title">${nightmare.title}</div>
                <div class="nightmare-desc">${nightmare.desc}</div>
                <div class="nightmare-effect">⚠️ ${nightmare.effect}</div>
                <button class="nightmare-btn">...醒来</button>
            </div>`;

        document.body.appendChild(overlay);

        (overlay.querySelector('.nightmare-btn') as HTMLElement).onclick = () => {
            document.body.removeChild(overlay);
            if (callback) callback();
        };
    }
}
