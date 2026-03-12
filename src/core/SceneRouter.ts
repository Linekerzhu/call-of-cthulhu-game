import Utils from './Utils.ts';
import Cards from '../data/Cards_Cthulhu.ts';
import { BadgeManager } from '../data/Badges_Cthulhu.ts';
import type Game from './Game.ts';

/**
 * SceneRouter — 场景流转控制器
 * 
 * 管理画面切换、地图生成与推进、以及各场景入口。
 * 依赖 Game Facade 来访问子系统。
 */
export default class SceneRouter {
    private game: Game;
    public deckReturnScreen: string = 'map';

    constructor(game: Game) {
        this.game = game;
    }

    // ====================
    // 画面切换
    // ====================

    public showScreen(screenName: string): void {

        const screens = document.querySelectorAll('.screen');
        for (let i = 0; i < screens.length; i++) {
            screens[i].classList.remove('active');
        }

        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        this.game.state.phase = screenName;
    }

    // ====================
    // 游戏流程
    // ====================

    public startGame(): void {

        this.game.state.initPlayer();
        this.game.state.floor = 1;

        this.showBadgeSelect();
    }

    public showBadgeSelect(): void {
        this.showScreen('badge');
        this.game.renderSystem?.renderBadgeSelect();
    }

    public selectBadge(badgeId: string): void {

        this.game.eventBus.emit('combat:select');
        this.giveStartingDeck();
        BadgeManager.applyBadge(this.game.state.player, badgeId);

        this.game.state.player!.drawPile = Utils.shuffle(this.game.state.player!.deck.slice());
        this.game.state.player!.discardPile = [];
        this.game.state.player!.hand = [];


        this.startFloor(1);
    }

    public giveStartingDeck(): void {
        const startingCards = [
            '疯狂挥击', '疯狂挥击', '疯狂挥击',
            '理智屏障', '理智屏障',
            '逃离深渊'
        ];

        this.game.state.player!.deck = [];
        for (let i = 0; i < startingCards.length; i++) {
            const name = startingCards[i];
            const cardData = (Cards as Record<string, any>)[name];
            if (cardData) {
                const cardCopy = Utils.deepCopy(cardData);
                this.game.state.player!.deck.push(cardCopy);
            } else {
                console.error(`❌ 基础卡牌不存在: ${name}`);
            }
        }

        this.game.state.player!.drawPile = Utils.shuffle(this.game.state.player!.deck.slice());
    }

    // ====================
    // 楼层 & 地图
    // ====================

    public startFloor(floorNum: number): void {
        this.game.state.floor = floorNum;

        if (floorNum > 1) {
            const erosion = floorNum === 2 ? 5 : 10;
            this.game.state.modifyMaxSanity(-erosion, '深渊侵蚀');
        }

        this.generateMap(floorNum);
        this.showScreen('map');
        this.game.renderSystem?.renderMap();

        if (floorNum > 1) {
            const erosionMsg = floorNum === 2
                ? '🌊 深渊的低语越来越清晰... 理智上限 -5'
                : '🌊 你的理智在古神的凝视下融化... 理智上限 -10';
            this.game.renderSystem?.showPassiveEffect(erosionMsg, '🌊');
        }
    }

    public generateMap(floor: number): void {
        this.game.state.map = {
            floor: floor,
            nodes: [],
            currentNode: 0,
            branches: []
        };

        // 10层地图结构, 底部起点 → 顶部Boss
        // 层0: 起点
        // 层1: 分支 (战斗 / 事件)
        // 层2: 战斗
        // 层3: 分支 (精英 / 商店 / 事件)
        // 层4: 战斗
        // 层5: 休息
        // 层6: 分支 (战斗 / 事件)
        // 层7: 精英
        // 层8: 分支 (休息 / 商店)
        // 层9: Boss

        const r = () => Math.random();

        // 层0: 起点
        this.addMapNode(0, 'start', [], [1, 2]);

        // 层1: 分支 — 战斗 vs 随机事件
        this.addMapNode(1, 'combat', [0], [3]);
        this.addMapNode(2, r() < 0.5 ? 'event' : 'combat', [0], [4]);

        // 层2: 战斗 (合并或继续分支)
        this.addMapNode(3, 'combat', [1], [5, 6]);
        this.addMapNode(4, 'combat', [2], [6, 7]);

        // 层3: 三岔路 — 精英/商店/事件
        this.addMapNode(5, floor >= 2 ? 'elite' : 'combat', [3], [8], true);
        this.addMapNode(6, r() < 0.4 ? 'shop' : 'event', [3, 4], [8, 9]);
        this.addMapNode(7, 'combat', [4], [9]);

        // 层4: 战斗
        this.addMapNode(8, 'combat', [5, 6], [10]);
        this.addMapNode(9, r() < 0.3 ? 'event' : 'combat', [6, 7], [10, 11]);

        // 层5: 休息/商店 分支
        this.addMapNode(10, 'rest', [8, 9], [12]);
        this.addMapNode(11, floor >= 2 ? 'shop' : 'rest', [9], [12, 13]);

        // 层6: 精英前战斗
        this.addMapNode(12, 'combat', [10, 11], [14]);
        this.addMapNode(13, r() < 0.5 ? 'event' : 'combat', [11], [14]);

        // 层7: 精英战
        this.addMapNode(14, 'elite', [12, 13], [15, 16], true);

        // 层8: Boss前分支 — 最后补给
        this.addMapNode(15, 'rest', [14], [17]);
        this.addMapNode(16, 'shop', [14], [17]);

        // 层9: Boss
        this.addMapNode(17, 'boss', [15, 16], []);

        // 起点标记已访问，下层可用
        this.game.state.map!.nodes[0].visited = true;
        this.game.state.map!.nodes[1].available = true;
        this.game.state.map!.nodes[2].available = true;
    }

    public addMapNode(id: number, type: string, parentIds: number[], childIds: number[], isHard?: boolean): void {
        this.game.state.map!.nodes.push({
            id: id,
            type: type,
            parents: parentIds || [],
            children: childIds || [],
            visited: false,
            available: false,
            isHard: isHard || false,
            icon: this.getNodeIcon(type, isHard)
        });
    }

    public getNodeIcon(type: string, isHard?: boolean): string {
        const icons: Record<string, string> = {
            'start': '🕯️', 'combat': '⚔️', 'elite': '👁️',
            'rest': '🏕️', 'shop': '📿', 'boss': '🐙',
            'event': '🔮'
        };
        return icons[type] || '❓';
    }

    public getNodeName(type: string): string {
        const names: Record<string, string> = {
            'start': '入口', 'combat': '遭遇', 'elite': '恐怖',
            'rest': '喘息', 'shop': '祭坛', 'boss': '古神',
            'event': '征兆'
        };
        return names[type] || type;
    }

    public advanceMap(nodeIndex: number, skipDisplay: boolean = false): void {
        const map = this.game.state.map!;
        if (nodeIndex < 0 || nodeIndex >= map.nodes.length) {
            console.error(`❌ advanceMap: 无效节点索引 ${nodeIndex}`);
            return;
        }
        const node = map.nodes[nodeIndex];

        node.visited = true;
        map.currentNode = nodeIndex;

        for (let i = 0; i < map.nodes.length; i++) {
            if (i !== nodeIndex && map.nodes[i].available && !map.nodes[i].visited) {
                let isChild = false;
                for (let j = 0; j < node.children.length; j++) {
                    if (node.children[j] === i) {
                        isChild = true;
                        break;
                    }
                }
                if (!isChild) {
                    map.nodes[i].available = false;
                }
            }
        }

        if (node.children && node.children.length > 0) {
            for (let k = 0; k < node.children.length; k++) {
                const childId = node.children[k];
                map.nodes[childId].available = true;
            }
        }

        if (node.type === 'boss') {
            if (this.game.state.floor < 3) {
                this.startFloor(this.game.state.floor + 1);
            } else {
                this.gameOver(true);
            }
        } else if (!skipDisplay) {
            this.showScreen('map');
            this.game.renderSystem?.renderMap();
        }
    }

    // ====================
    // 场景入口
    // ====================

    public startCombat(enemyType: string): void {
        this.game.combatSystem?.startCombat(enemyType);
        this.showScreen('combat');
        this.game.renderSystem?.renderCombat();
    }

    public showRewardScreen(): void {
        this.game.eventBus.emit('combat:victory');
        this.showScreen('reward');
        this.game.renderSystem?.renderRewardScreen();
    }

    public showRestScreen(): void {
        this.showScreen('rest');
        this.game.renderSystem?.renderRestScreen();
    }

    public showShopScreen(): void {
        this.showScreen('shop');
        this.game.renderSystem?.renderShopScreen();
    }

    public showDeckViewer(fromScreen: string): void {
        this.deckReturnScreen = fromScreen;
        this.showScreen('deck');
        this.game.renderSystem?.renderDeckViewer(fromScreen);
    }

    public selectRewardCard(cardName: string): void {

        this.game.eventBus.emit('combat:select');

        if ((Cards as Record<string, any>)[cardName]) {
            const cardCopy = Utils.deepCopy((Cards as Record<string, any>)[cardName]);
            this.game.state.player!.deck.push(cardCopy);

            this.game.nightmareSystem.applyForbiddenKnowledge(cardCopy);

            const pileCopy = Utils.deepCopy((Cards as Record<string, any>)[cardName]);
            if (this.game.state.combat && this.game.state.combat.active) {
                this.game.state.player!.drawPile.push(pileCopy);
            } else {
                this.game.state.player!.discardPile.push(pileCopy);
            }
        }

        this.showScreen('map');
        this.advanceToNextNode();
    }

    public skipReward(): void {
        this.game.modifySanity(5);
        this.game.state.log('🧠 选择遗忘，恢复5点理智');
        this.showScreen('map');
        this.advanceToNextNode();
    }

    // ====================
    // 休息站
    // ====================

    public restHeal(): void {
        const canHeal = this.game.getSanityEffect('canHeal');
        if (canHeal === false) {
            this.game.renderSystem?.showPassiveEffect('🐙 不可名状之力阻止了治疗', '🚫');
            return;
        }
        const player = this.game.state.player;
        const healAmount = Math.floor(player.maxHp * 0.3);
        this.game.modifyHP(healAmount, '休息恢复');
        this.game.renderSystem?.showPassiveEffect(`恢复${healAmount}点HP`, '❤️');
        this.leaveRest();
    }

    public restSanity(): void {
        this.game.modifySanity(20);
        this.game.renderSystem?.showPassiveEffect('恢复20点理智', '🧠');
        this.leaveRest();
    }

    public restUpgrade(): void {
        const player = this.game.state.player;
        // 找到第一张可升级的攻击卡
        const upgradable = player.deck.filter((c: any) => c.upgrade && !c.upgraded);
        if (upgradable.length === 0) {
            this.game.renderSystem?.showPassiveEffect('没有可升级的卡牌', '⚠️');
            return;
        }
        // 随机升级一张
        const target = upgradable[Math.floor(Math.random() * upgradable.length)];
        const oldName = target.name;
        if (target.upgrade) {
            if (target.upgrade.damage) target.damage = target.upgrade.damage;
            if (target.upgrade.block) target.block = target.upgrade.block;
            if (target.upgrade.effects) target.effects = target.upgrade.effects;
            if (target.upgrade.description) target.description = target.upgrade.description;
            target.upgraded = true;
            target.name = target.name + '+';
        }
        this.game.renderSystem?.showPassiveEffect(`${oldName} 升级为 ${target.name}`, '⬆️');
        this.leaveRest();
    }

    public leaveRest(): void {
        this.showScreen('map');
        this.advanceToNextNode();
    }

    /**
     * 安全地推进到下一个地图节点（使用子节点而非盲目+1）
     */
    public advanceToNextNode(): void {
        const map = this.game.state.map!;
        const currentNode = map.nodes[map.currentNode];
        if (currentNode.children && currentNode.children.length > 0) {
            this.advanceMap(currentNode.children[0]);
        } else {
            this.game.renderSystem?.renderMap();
        }
    }

    public endTurn(): void {
        const combat = this.game.state.combat;
        if (!combat || combat.ended) return;
        this.game.combatSystem?.endTurn();
    }

    public gameOver(victory: boolean): void {

        if (victory) {
            this.game.eventBus.emit('combat:victory');
        } else {
            this.game.eventBus.emit('combat:defeat');
        }

        this.showScreen('gameover');

        const title = document.getElementById('gameover-title');
        const message = document.getElementById('gameover-message');

        if (title && message) {
            if (victory) {
                title.textContent = '🎉 你抵抗住了疯狂！';
                message.textContent = '古神在你的意志面前退却了...';
            } else {
                title.textContent = '💀 你已陷入疯狂...';
                message.textContent = '深渊最终吞噬了你的理智...';
            }
        }
    }

    public restartGame(): void {
        this.startGame();
    }
}
