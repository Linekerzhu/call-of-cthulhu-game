import type Game from './Game.ts';

/**
 * BuffManager - 集中式增减益管理器
 */

export interface BuffOptions {
    value?: number;
    duration?: number;
    stackable?: boolean;
}

export interface ActiveBuff {
    id: string;
    value: number;
    duration: number;
    stackable: boolean;
}

export default class BuffManager {
    private game: Game;
    private _buffs: Record<string, ActiveBuff> = {};

    constructor(game: Game) {
        this.game = game;
        // buff 生命周期由 CombatSystem.startTurn() 中显式 clear() 管理
        // 不再自动监听 TURN_START 事件，避免与 clear() 冲突
    }

    /**
     * 施加 buff
     */
    public apply(id: string, opts: BuffOptions = {}): void {
        const value = opts.value !== undefined ? opts.value : 0;
        const duration = opts.duration !== undefined ? opts.duration : 1;
        const stackable = opts.stackable !== undefined ? opts.stackable : true;

        if (this._buffs[id] && stackable) {
            this._buffs[id].value += value;
            this._buffs[id].duration = Math.max(this._buffs[id].duration, duration);
        } else {
            this._buffs[id] = { id, value, duration, stackable };
        }
    }

    /**
     * 获取 buff 的当前数值总和
     */
    public getValue(id: string): number {
        return this._buffs[id] ? this._buffs[id].value : 0;
    }

    /**
     * 检查 buff 是否存在
     */
    public has(id: string): boolean {
        return !!this._buffs[id];
    }

    /**
     * 移除指定 buff
     */
    public remove(id: string): void {
        delete this._buffs[id];
    }

    /**
     * 清除所有 buff
     */
    public clear(): void {
        this._buffs = {};
    }

    /**
     * 回合递减
     */
    public tick(): void {
        const keys = Object.keys(this._buffs);
        for (const key of keys) {
            const buff = this._buffs[key];
            if (buff.duration === -1) continue; 
            buff.duration--;
            if (buff.duration <= 0) {
                delete this._buffs[key];
            }
        }
    }

    /**
     * 获取所有活跃 buff
     */
    public getAll(): ActiveBuff[] {
        return Object.values(this._buffs);
    }
}
