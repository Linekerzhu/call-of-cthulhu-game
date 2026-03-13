/**
 * GameConstants — 全局常量定义
 *
 * @fileOverview 集中管理游戏中的魔法数字，提高可维护性
 */

/** 战斗网格尺寸 */
export const GRID_ROWS = 5;
export const GRID_COLS = 8;

/** 标准理智值（用于 SAN 比率计算） */
export const STANDARD_SANITY = 50;

/** 手牌上限 */
export const MAX_HAND_SIZE = 10;

/** 抽牌数（每回合开始） */
export const DRAW_PER_TURN = 5;

/** 默认基础能量 */
export const BASE_ENERGY = 3;

/** 默认移动力 */
export const BASE_AGILITY = 3;

/** 格挡上限 */
export const MAX_BLOCK = 99;

// === 属性系统常量 ===
/** 普通人基准属性值 */
export const BASE_ATTRIBUTE = 10;

/** 基础生命上限 */
export const BASE_MAX_HP = 50;

/** 每点体格调整值对应的 HP 增量 */
export const HP_PER_PHYSIQUE_MOD = 5;

/** 每点知识 mod 降低的 maxSanity */
export const KNOWLEDGE_SAN_COST = 2;

/** 意志 SAN 正比缩放系数 */
export const WILL_SAN_SCALE = 8;

/** 威压 SAN 反比缩放系数 */
export const COERCION_SAN_SCALE = 8;

/** HP 虚弱阈值 — 轻度 */
export const HP_WEAKNESS_LIGHT = 0.5;

/** HP 虚弱阈值 — 重度 */
export const HP_WEAKNESS_SEVERE = 0.25;

/** 轻度虚弱减值 */
export const HP_WEAKNESS_LIGHT_PENALTY = 2;

/** 重度虚弱减值 */
export const HP_WEAKNESS_SEVERE_PENALTY = 4;
