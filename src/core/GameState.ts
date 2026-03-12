import EventBus from './EventBus.ts';
import { gameStore, SANITY_STATES, MADNESS_MUTATIONS, getSanityEffect as _getSanityEffect } from './store.ts';
import type { IPlayerState, ICombatState, IMapState } from '../types/game.ts';

/**
 * GameState — EventBus 桥接层
 * 
 * 内部状态已迁移到 Zustand Store (`core/store.ts`)。
 * 本类保留 EventBus 通知机制以兼容现有子系统，
 * 同时通过 `subscribe` 自动将 Store 变更转发到 EventBus。
 */
export default class GameState {
    private eventBus: EventBus;

    /** @deprecated 直接使用 store 中的 SANITY_STATES */
    public readonly SANITY_STATES = SANITY_STATES;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this._setupBridge();
    }

    // ====================
    // Store → EventBus 桥接
    // ====================

    private _setupBridge(): void {
        // player 变更 → EventBus 通知
        gameStore.subscribe(
            (s) => s.player,
            (player, prevPlayer) => {
                this.eventBus.emit('player:stats_changed', { player });

                // HP归零检测
                if (player.hp <= 0 && prevPlayer.hp > 0) {
                    this.eventBus.emit('player:died');
                }

                // SAN等级变化检测 + 疯狂突变触发
                if (player.sanityLevel !== prevPlayer.sanityLevel) {
                    const direction = player.sanityLevel < prevPlayer.sanityLevel ? 'down' : 'up';
                    const state = SANITY_STATES[player.sanityLevel];
                    if (state) {
                        this.eventBus.emit('sanity:level_changed', {
                            level: player.sanityLevel,
                            name: state.name,
                            direction,
                        });
                    }

                    // === 不可逆疯狂突变 ===
                    if (direction === 'down') {
                        this.checkAndApplyMutations(player.sanityLevel);
                    }
                }

                // 理智归零检测（疯狂触发）
                if (player.sanity <= 0 && prevPlayer.sanity > 0) {
                    const combat = gameStore.getState().combat;
                    if (combat && !combat.madnessTriggered) {
                        this.eventBus.emit('player:sanity_zero');
                    }
                }
            }
        );

        // 日志变更 → EventBus 通知
        gameStore.subscribe(
            (s) => s.combatLog,
            () => {
                this.eventBus.emit('game:log');
            }
        );
    }

    // ====================
    // 属性代理（读取直接从 Store）
    // ====================

    get player(): IPlayerState {
        return gameStore.getState().player;
    }
    set player(val: IPlayerState | null) {
        if (val) gameStore.setState({ player: val });
    }

    get combat(): ICombatState | null {
        return gameStore.getState().combat;
    }
    set combat(val: ICombatState | null) {
        gameStore.setState({ combat: val });
    }

    get map(): IMapState | null {
        return gameStore.getState().map;
    }
    set map(val: IMapState | null) {
        gameStore.setState({ map: val });
    }

    get phase(): string {
        return gameStore.getState().phase;
    }
    set phase(val: string) {
        gameStore.setState({ phase: val });
    }

    get floor(): number {
        return gameStore.getState().floor;
    }
    set floor(val: number) {
        gameStore.setState({ floor: val });
    }

    // ====================
    // 委托到 Store Actions
    // ====================

    public setPlayerStats(partial: Partial<IPlayerState>): void {
        gameStore.getState().setPlayer(partial);
    }

    public initPlayer(): void {
        gameStore.getState().initPlayer();
    }

    public modifyHP(amount: number, source?: string): number {
        return gameStore.getState().modifyHP(amount, source);
    }

    public modifySanity(amount: number, source?: string): number {
        return gameStore.getState().modifySanity(amount, source);
    }

    public modifyMaxSanity(amount: number, source?: string): void {
        gameStore.getState().modifyMaxSanity(amount, source);
    }

    public modifyEnergy(amount: number): number {
        return gameStore.getState().modifyEnergy(amount);
    }

    public modifyBlock(amount: number): number {
        return gameStore.getState().modifyBlock(amount);
    }

    public modifyMaxHP(amount: number, source?: string): void {
        gameStore.getState().modifyMaxHP(amount, source);
    }

    public modifyMovement(amount: number): number {
        return gameStore.getState().modifyMovement(amount);
    }

    public damagePlayerThroughBlock(rawDamage: number, source?: string): number {
        return gameStore.getState().damagePlayerThroughBlock(rawDamage, source);
    }

    public updateSanityState(): void {
        // SAN等级现在由 store 内部自动计算，此方法保留兼容
        const p = gameStore.getState().player;
        const sanityRatio = p.sanity / 50;  // 基于标准值50
        let newLevel = 5;
        if (sanityRatio <= 0) newLevel = 0;
        else if (sanityRatio < 0.2) newLevel = 1;
        else if (sanityRatio < 0.4) newLevel = 2;
        else if (sanityRatio < 0.6) newLevel = 3;
        else if (sanityRatio < 0.8) newLevel = 4;

        if (newLevel !== p.sanityLevel) {
            gameStore.getState().setPlayer({ sanityLevel: newLevel });
        }
    }

    public getSanityEffect(effectType: string): number | boolean | null {
        const p = gameStore.getState().player;
        return _getSanityEffect(effectType, p.sanityLevel, p.madnessMutations);
    }

    /**
     * 检查并应用不可逆的疯狂突变
     */
    public checkAndApplyMutations(newLevel: number): void {
        const p = gameStore.getState().player;
        const mutations = [...(p.madnessMutations || [])];
        let changed = false;

        for (const mutation of MADNESS_MUTATIONS) {
            if (newLevel <= mutation.triggerLevel && !mutations.includes(mutation.id)) {
                mutations.push(mutation.id);
                changed = true;
                gameStore.getState().pushLog(`🌀 疯狂突变：${mutation.icon} ${mutation.name}`);
                gameStore.getState().pushLog(`  ⬆️ ${mutation.positive}`);
                if (mutation.negative !== '—') {
                    gameStore.getState().pushLog(`  ⬇️ ${mutation.negative}`);
                }
            }
        }

        if (changed) {
            gameStore.getState().setPlayer({ madnessMutations: mutations });
        }
    }

    public log(message: string): void {
        gameStore.getState().pushLog(message);
    }
}
