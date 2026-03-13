import EventBus from './EventBus.ts';
import BuffManager from './BuffManager.ts';
import GameState from './GameState.ts';
import SceneRouter from './SceneRouter.ts';
import AudioSystem from '../systems/AudioSystem.ts';
import RenderSystem from '../systems/RenderSystem.ts';
import InputSystem from '../systems/InputSystem.ts';
import CombatSystem from '../systems/CombatSystem.ts';
import NightmareSystem from '../systems/NightmareSystem.ts';

/**
 * Game — Facade 注入壳
 * 
 * 组合所有子系统，提供统一的对外 API。
 * 核心逻辑已由 GameState、SceneRouter、NightmareSystem 各自承担。
 */
export default class Game {
    // 核心层
    public eventBus: EventBus;
    public state: GameState;
    public buffManager: BuffManager;

    // 场景路由
    public router: SceneRouter;

    // 子系统
    public renderSystem: RenderSystem | null = null;
    public inputSystem: InputSystem | null = null;
    public combatSystem: CombatSystem | null = null;
    public audioSystem: AudioSystem | null = null;
    public nightmareSystem: NightmareSystem;

    constructor() {

        this.eventBus = new EventBus();
        this.state = new GameState(this.eventBus);
        this.buffManager = new BuffManager(this);
        this.router = new SceneRouter(this);
        this.nightmareSystem = new NightmareSystem(this);

        this.init();
    }

    private init(): void {

        this.renderSystem = new RenderSystem(this);
        this.inputSystem = new InputSystem(this);
        this.combatSystem = new CombatSystem(this);
        this.audioSystem = new AudioSystem(this);

        this.eventBus.on('player:died', () => {
            this.router.gameOver(false);
        });

        // SAN 等级变化 → 渲染被动效果
        this.eventBus.on('sanity:level_changed', (data: any) => {
            if (data.direction === 'down') {
                this.renderSystem?.showPassiveEffect(`🌀 ${data.name}`, '🧠');
            }
        });

        this.state.initPlayer();
    }

    // ====================
    // Facade 委托 — 保持外部 API 不变
    // ====================

    // --- GameState 委托 ---
    public modifyHP(amount: number, source?: string): number { return this.state.modifyHP(amount, source); }
    public modifySanity(amount: number, source?: string): number { return this.state.modifySanity(amount, source); }
    public modifyMaxSanity(amount: number, source?: string): void { this.state.modifyMaxSanity(amount, source); }
    public modifyEnergy(amount: number): number { return this.state.modifyEnergy(amount); }
    public modifyBlock(amount: number): number { return this.state.modifyBlock(amount); }
    public modifyMaxHP(amount: number, source?: string): void { this.state.modifyMaxHP(amount, source); }
    public modifyMovement(amount: number): number { return this.state.modifyMovement(amount); }
    public damagePlayerThroughBlock(rawDamage: number, source?: string): number { return this.state.damagePlayerThroughBlock(rawDamage, source); }
    public updateSanityState(): void { this.state.updateSanityState(); }
    public getSanityEffect(effectType: string): number | boolean | null { return this.state.getSanityEffect(effectType); }
    public log(message: string): void { this.state.log(message); }

    /** 在指定网格坐标显示飘字 */
    public combatFloat(row: number, col: number, text: string, color: string = '#ffffff'): void {
        this.renderSystem?.showFloatingText(row, col, text, color);
    }

    /** 在玩家头顶显示飘字 */
    public floatOnPlayer(text: string, color: string = '#00ff88'): void {
        const p = this.state.player?.position;
        if (p) this.combatFloat(p.row, p.col, text, color);
    }

    /** 在敌人头顶显示飘字 */
    public floatOnEnemy(enemy: any, text: string, color: string = '#ff6666'): void {
        if (enemy?.position) this.combatFloat(enemy.position.row, enemy.position.col, text, color);
    }
    public initPlayer(): void { this.state.initPlayer(); }

    // --- SceneRouter 委托 ---
    public showScreen(screenName: string): void { this.router.showScreen(screenName); }
    public startGame(): void { this.router.startGame(); }
    public showBadgeSelect(): void { this.router.showBadgeSelect(); }
    public selectProtagonist(protagonistId: string): void { this.router.selectProtagonist(protagonistId); }
    public selectBadge(badgeId: string): void { this.router.selectBadge(badgeId); }
    public startFloor(floorNum: number): void { this.router.startFloor(floorNum); }
    public startCombat(enemyType: string): void { this.router.startCombat(enemyType); }
    public showRewardScreen(): void { this.router.showRewardScreen(); }
    public showRestScreen(): void { this.router.showRestScreen(); }
    public showShopScreen(): void { this.router.showShopScreen(); }
    public showDeckViewer(fromScreen: string): void { this.router.showDeckViewer(fromScreen); }
    public closeDeckViewer(): void {
        const returnTo = this.router.deckReturnScreen || 'map';
        this.router.showScreen(returnTo);
        if (returnTo === 'map') this.renderSystem?.renderMap();
    }
    public selectRewardCard(cardName: string): void { this.router.selectRewardCard(cardName); }
    public skipReward(): void { this.router.skipReward(); }
    public restHeal(): void { this.router.restHeal(); }
    public restSanity(): void { this.router.restSanity(); }
    public restUpgrade(): void { this.router.restUpgrade(); }
    public executeUpgrade(cardIndex: number): void { this.router.executeUpgrade(cardIndex); }
    public leaveRest(): void { this.router.leaveRest(); }
    public leaveShop(): void {
        this.router.returnToMap();
    }
    public endTurn(): void { this.router.endTurn(); }
    public gameOver(victory: boolean): void { this.router.gameOver(victory); }
    public restartGame(): void { this.router.restartGame(); }
    public advanceMap(nodeIndex: number, skipDisplay: boolean = false): void { this.router.advanceMap(nodeIndex, skipDisplay); }
    public generateMap(floor: number): void { this.router.generateMap(floor); }
    public getNodeIcon(type: string, isHard?: boolean): string { return this.router.getNodeIcon(type, isHard); }
    public getNodeName(type: string): string { return this.router.getNodeName(type); }
    public giveStartingDeck(): void { this.router.giveStartingDeck(); }

    // --- NightmareSystem 委托 ---
    public applyForbiddenKnowledge(card: any, isUpgrade?: boolean): void { this.nightmareSystem.applyForbiddenKnowledge(card, isUpgrade); }
    public rollNightmare(): any { return this.nightmareSystem.rollNightmare(); }
    public showNightmare(nightmare: any, callback?: () => void): void { this.nightmareSystem.showNightmare(nightmare, callback); }

    // --- 兼容性桥接 ---
    /** @deprecated 使用 this.state.SANITY_STATES 替代 */
    public get SANITY_STATES() { return this.state.SANITY_STATES; }
    /** @deprecated 使用 this.nightmareSystem.NIGHTMARES 替代 */
    public get NIGHTMARES() { return this.nightmareSystem.NIGHTMARES; }
}
