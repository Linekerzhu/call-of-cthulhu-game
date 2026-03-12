import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import type { IPlayerState, ICombatState, IMapState } from '../types/game.ts';

// ====================
// 默认玩家初始值
// ====================
export const STANDARD_SANITY = 50;  // 标准理智基准值（所有百分比计算以此为基准）
const DEFAULT_PLAYER: IPlayerState = {
    hp: 50, maxHp: 50,
    energy: 3, maxEnergy: 3, baseMaxEnergy: 3,
    movement: 3, maxMovement: 3, agility: 3,
    block: 0,
    sanity: 50, maxSanity: 50, madness: 0, sanityLevel: 5,
    madnessMutations: [],
    deck: [], hand: [], drawPile: [], discardPile: [],
    position: { row: 2, col: 0 },
    badge: null,
};

// ====================
// Store 类型定义
// ====================
export interface GameStoreState {
    // --- 核心状态切片 ---
    phase: string;
    player: IPlayerState;
    combat: ICombatState | null;
    map: IMapState | null;
    floor: number;
    combatLog: string[];

    // --- Actions ---
    initPlayer: () => void;
    setPlayer: (partial: Partial<IPlayerState>) => void;
    setCombat: (combat: ICombatState | null) => void;
    setMap: (map: IMapState | null) => void;
    setPhase: (phase: string) => void;
    setFloor: (floor: number) => void;

    // --- 属性修改器（带 clamp + 日志） ---
    modifyHP: (amount: number, source?: string) => number;
    modifySanity: (amount: number, source?: string) => number;
    modifyMaxSanity: (amount: number, source?: string) => void;
    modifyEnergy: (amount: number) => number;
    modifyBlock: (amount: number) => number;
    modifyMaxHP: (amount: number, source?: string) => void;
    modifyMovement: (amount: number) => number;
    damagePlayerThroughBlock: (rawDamage: number, source?: string) => number;

    // --- 日志 ---
    pushLog: (message: string) => void;
}

// ====================
// SAN 等级 & 疯狂突变系统
// ====================
export const SANITY_STATES: Record<number, {
    name: string; level: number; threshold: number;
    desc: string; effect?: string;
}> = {
    5: { name: '理智清醒', level: 5, threshold: 1.0, desc: '你的思维清晰，行动如常' },
    4: { name: '超感知觉', level: 4, threshold: 0.8, desc: '你开始感知到常人看不见的东西…攻击+2' },
    3: { name: '扭曲之力', level: 3, threshold: 0.6, desc: '力量在扭曲中觉醒——攻击+3 范围+1 移动-1' },
    2: { name: '深渊共鸣', level: 2, threshold: 0.4, desc: '深渊在回应你——伤害+50% 每回合-2SAN' },
    1: { name: '肉体崩解', level: 1, threshold: 0.2, desc: '你的肉体开始瓦解——攻击卡费用-1 每回合-2HP' },
    0: { name: '不可名状', level: 0, threshold: 0.0, desc: '你已超越人类——卡牌自动觉醒 无法治疗' },
};

// 疯狂突变定义（不可逆）
export interface MadnessMutation {
    id: string;
    name: string;
    triggerLevel: number;       // 触发时的 sanityLevel
    positive: string;           // 正面效果描述
    negative: string;           // 负面效果描述
    icon: string;
}

export const MADNESS_MUTATIONS: MadnessMutation[] = [
    { id: 'hypersense', name: '超感知觉', triggerLevel: 4, icon: '👁️',
      positive: '攻击+2', negative: '—' },
    { id: 'twisted_power', name: '扭曲之力', triggerLevel: 3, icon: '🌀',
      positive: '攻击+3 射程+1', negative: '移动力-1' },
    { id: 'abyss_resonance', name: '深渊共鸣', triggerLevel: 2, icon: '🔮',
      positive: '所有伤害+50%', negative: '每回合失去2SAN' },
    { id: 'flesh_decay', name: '肉体崩解', triggerLevel: 1, icon: '💀',
      positive: '攻击卡费用-1', negative: '每回合失去2HP' },
    { id: 'unnameable', name: '不可名状', triggerLevel: 0, icon: '🐙',
      positive: '卡牌自动深渊觉醒', negative: '无法治疗 视觉干扰' },
];

// ====================
// 辅助：计算 SAN 等级
// ====================
function calcSanityLevel(sanity: number, _maxSanity: number): number {
    if (STANDARD_SANITY <= 0) return 0;
    const ratio = sanity / STANDARD_SANITY;
    if (ratio <= 0) return 0;
    if (ratio < 0.2) return 1;
    if (ratio < 0.4) return 2;
    if (ratio < 0.6) return 3;
    if (ratio < 0.8) return 4;
    return 5;
}

export function getSanityEffect(effectType: string, sanityLevel: number, mutations?: string[]): number | boolean | null {
    const hasMutation = (id: string) => mutations ? mutations.includes(id) : false;

    switch (effectType) {
        case 'costIncrease':
            // 肉体崩解: 攻击卡费用-1 (handled separately for attack cards)
            if (sanityLevel === 0) return 1;
            return 0;
        case 'attackCostReduction':
            return hasMutation('flesh_decay') ? 1 : 0;
        case 'attackBonus':
            let bonus = 0;
            if (hasMutation('hypersense')) bonus += 2;
            if (hasMutation('twisted_power')) bonus += 3;
            return bonus;
        case 'rangeBonus':
            return hasMutation('twisted_power') ? 1 : 0;
        case 'damageMultiplier':
            if (hasMutation('abyss_resonance')) return 1.5;
            return 1.0;
        case 'movementPenalty':
            return hasMutation('twisted_power') ? 1 : 0;
        case 'sanityDrainPerTurn':
            return hasMutation('abyss_resonance') ? 2 : 0;
        case 'hpDrainPerTurn':
            return hasMutation('flesh_decay') ? 2 : 0;
        case 'canHeal':
            return !hasMutation('unnameable');
        case 'autoAwaken':
            return hasMutation('unnameable');
        case 'energyLoss':
            return 0;
        case 'canGainBlock':
            return true;
        default:
            return null;
    }
}

// ====================
// 创建 Store（Vanilla — 不依赖 React）
// ====================
export const gameStore = createStore<GameStoreState>()(
    subscribeWithSelector((set, get) => ({
        // --- 初始状态 ---
        phase: 'title',
        player: { ...DEFAULT_PLAYER },
        combat: null,
        map: null,
        floor: 0,
        combatLog: [],

        // --- 基础 setters ---
        initPlayer: () => set({ player: { ...DEFAULT_PLAYER } }),
        setPlayer: (partial) => set((s) => ({ player: { ...s.player, ...partial } })),
        setCombat: (combat) => set({ combat }),
        setMap: (map) => set({ map }),
        setPhase: (phase) => set({ phase }),
        setFloor: (floor) => set({ floor }),

        // --- 属性修改器 ---
        modifyHP: (amount, source?) => {
            const p = { ...get().player };
            const before = p.hp;
            p.hp = Math.max(0, Math.min(p.hp + amount, p.maxHp));
            const delta = p.hp - before;

            if (delta !== 0 && source) {
                const msg = delta > 0
                    ? `${source} 恢复${delta}点生命`
                    : `${source} 失去${-delta}点HP`;
                get().pushLog(msg);
            }

            set({ player: p });
            return delta;
        },

        modifySanity: (amount, source?) => {
            const p = { ...get().player };
            const before = p.sanity;
            p.sanity = Math.max(0, Math.min(p.sanity + amount, p.maxSanity));
            const delta = p.sanity - before;

            if (delta !== 0 && source) {
                const msg = delta > 0
                    ? `🧠 ${source} 恢复${delta}点理智`
                    : `🧠 ${source} 消耗${-delta}点理智`;
                get().pushLog(msg);
            }

            // 更新 SAN 等级
            const newLevel = calcSanityLevel(p.sanity, p.maxSanity);
            p.sanityLevel = newLevel;

            set({ player: p });
            return delta;
        },

        modifyMaxSanity: (amount, source?) => {
            const p = { ...get().player };
            p.maxSanity = Math.max(10, p.maxSanity + amount);
            p.sanity = Math.min(p.sanity, p.maxSanity);

            if (source) {
                get().pushLog(`🧠 ${source}（理智上限${amount > 0 ? '+' : ''}${amount}）`);
            }

            p.sanityLevel = calcSanityLevel(p.sanity, p.maxSanity);
            set({ player: p });
        },

        modifyEnergy: (amount) => {
            const p = { ...get().player };
            const before = p.energy;
            p.energy = Math.max(0, Math.min(p.energy + amount, p.maxEnergy));
            const delta = p.energy - before;
            if (delta !== 0) set({ player: p });
            return delta;
        },

        modifyBlock: (amount) => {
            const p = { ...get().player };
            const before = p.block;
            p.block = Math.max(0, Math.min(p.block + amount, 99));
            const delta = p.block - before;
            if (delta !== 0) set({ player: p });
            return delta;
        },

        modifyMaxHP: (amount, source?) => {
            const p = { ...get().player };
            p.maxHp = Math.max(5, p.maxHp + amount);
            p.hp = Math.min(p.hp, p.maxHp);
            if (source) {
                get().pushLog(`💉 ${source}（生命上限${amount > 0 ? '+' : ''}${amount}）`);
            }
            set({ player: p });
        },

        modifyMovement: (amount) => {
            const p = { ...get().player };
            const before = p.movement;
            p.movement = Math.max(0, Math.min(p.movement + amount, p.maxMovement));
            const delta = p.movement - before;
            if (delta !== 0) set({ player: p });
            return delta;
        },

        damagePlayerThroughBlock: (rawDamage, source?) => {
            const p = { ...get().player };
            let actualDamage = rawDamage;

            if (p.block > 0) {
                if (p.block >= rawDamage) {
                    p.block -= rawDamage;
                    actualDamage = 0;
                } else {
                    actualDamage -= p.block;
                    p.block = 0;
                }
            }

            if (actualDamage > 0) {
                p.hp = Math.max(0, p.hp - actualDamage);
            }

            set({ player: p });
            return actualDamage;
        },

        // --- 日志 ---
        pushLog: (message) => {
            const combat = get().combat;
            if (combat) {
                const newLog = [...combat.log, message];
                set({
                    combat: { ...combat, log: newLog },
                    combatLog: newLog
                });
            }
        },
    }))
);

// ====================
// 便捷访问器
// ====================
export const getState = gameStore.getState;
export const setState = gameStore.setState;
export const subscribe = gameStore.subscribe;
