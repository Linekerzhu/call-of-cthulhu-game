/**
 * AttributeEngine — 多主角属性计算引擎
 *
 * DND 风格调整值系统：每 2 点属性产生 1 点 modifier
 * 肉体属性受 HP 比率影响（临时衰减）
 * 精神属性受 SAN 比率影响（意志正比、威压反比）
 */

import {
    BASE_ATTRIBUTE,
    BASE_MAX_HP,
    HP_PER_PHYSIQUE_MOD,
    KNOWLEDGE_SAN_COST,
    WILL_SAN_SCALE,
    COERCION_SAN_SCALE,
    HP_WEAKNESS_LIGHT,
    HP_WEAKNESS_SEVERE,
    HP_WEAKNESS_LIGHT_PENALTY,
    HP_WEAKNESS_SEVERE_PENALTY,
    STANDARD_SANITY,
    BASE_AGILITY,
} from '../core/GameConstants.ts';

// ============================================================
// 基础工具
// ============================================================

/**
 * DND 风格调整值：每 2 点偏离基准产生 ±1 modifier
 * @example getModifier(10) → 0, getModifier(14) → +2, getModifier(6) → -2
 */
export function getModifier(attrValue: number): number {
    return Math.floor((attrValue - BASE_ATTRIBUTE) / 2);
}

// ============================================================
// 肉体属性 (Physical) — 受 HP 影响
// ============================================================

/**
 * 根据当前 HP 比率，返回肉体属性的临时惩罚值
 * HP ≥ 50%: 0（无惩罚）
 * HP 25–49%: -2（轻度虚弱）
 * HP < 25%: -4（重度虚弱）
 */
export function getHpWeaknessPenalty(player: any): number {
    if (player.maxHp <= 0) return 0;
    const ratio = player.hp / player.maxHp;
    if (ratio < HP_WEAKNESS_SEVERE) return HP_WEAKNESS_SEVERE_PENALTY;
    if (ratio < HP_WEAKNESS_LIGHT) return HP_WEAKNESS_LIGHT_PENALTY;
    return 0;
}

/**
 * 有效体格值（含 HP 衰减）
 */
export function getEffectivePhysique(player: any): number {
    const base = player.physique ?? BASE_ATTRIBUTE;
    const penalty = getHpWeaknessPenalty(player);
    // 体格在重度虚弱时受 penalty/2 影响（设计上体格衰减较轻）
    return Math.max(1, base - Math.floor(penalty / 2));
}

/**
 * 有效速度值（含 HP 衰减）
 */
export function getEffectiveSpeed(player: any): number {
    const base = player.speed ?? BASE_ATTRIBUTE;
    const penalty = getHpWeaknessPenalty(player);
    return Math.max(1, base - penalty);
}

/**
 * 有效力量值（含 HP 衰减）
 */
export function getEffectiveStrength(player: any): number {
    const base = player.strength ?? BASE_ATTRIBUTE;
    const penalty = getHpWeaknessPenalty(player);
    return Math.max(1, base - penalty);
}

/**
 * 由体格计算的 maxHp
 * maxHp = BASE_MAX_HP + physique_mod × HP_PER_PHYSIQUE_MOD
 */
export function getMaxHpFromPhysique(player: any): number {
    const physique = player.basePhysique ?? player.physique ?? BASE_ATTRIBUTE;
    const mod = getModifier(physique);
    return Math.max(10, BASE_MAX_HP + mod * HP_PER_PHYSIQUE_MOD);
}

/**
 * 由速度计算的基础移动力
 * movement = BASE_AGILITY + speed_mod
 */
export function getMovementFromSpeed(player: any): number {
    const effective = getEffectiveSpeed(player);
    const mod = getModifier(effective);
    return Math.max(1, BASE_AGILITY + mod);
}

/**
 * 力量带来的物理伤害加值
 */
export function getPhysicalDamageBonus(player: any): number {
    const effective = getEffectiveStrength(player);
    return getModifier(effective);
}

// ============================================================
// 精神属性 (Mental) — 受 SAN 影响
// ============================================================

/**
 * 计算 SAN 比率（基于标准 SAN 值 50）
 */
function getSanRatio(player: any): number {
    const sanity = player.sanity ?? 0;
    return Math.max(0, Math.min(1, sanity / STANDARD_SANITY));
}

/**
 * 有效意志值（含 SAN 正比联动）
 * effectiveWill = baseWill + floor(sanRatio × WILL_SAN_SCALE - WILL_SAN_SCALE/2)
 * 
 * SAN=100% → +4, SAN=50% → 0, SAN=0% → -4
 */
export function getEffectiveWill(player: any): number {
    const base = player.will ?? BASE_ATTRIBUTE;
    const sanRatio = getSanRatio(player);
    const sanBonus = Math.floor(sanRatio * WILL_SAN_SCALE - WILL_SAN_SCALE / 2);
    return Math.max(1, base + sanBonus);
}

/**
 * 有效威压值（含 SAN 反比联动）
 * effectiveCoercion = baseCoercion + floor((1 - sanRatio) × COERCION_SAN_SCALE - COERCION_SAN_SCALE/2)
 * 
 * SAN=100% → -4, SAN=50% → 0, SAN=0% → +4
 */
export function getEffectiveCoercion(player: any): number {
    const base = player.coercion ?? BASE_ATTRIBUTE;
    const sanRatio = getSanRatio(player);
    const sanBonus = Math.floor((1 - sanRatio) * COERCION_SAN_SCALE - COERCION_SAN_SCALE / 2);
    return Math.max(1, base + sanBonus);
}

/**
 * 知识带来的卡牌里效果阈值偏移（百分比，正数 = 更容易解锁）
 * 每 1 knowledge_mod → +5% (0.05)
 * @returns 阈值偏移量（如 +0.10 表示原本 SAN<70% 变为 SAN<80%）
 */
export function getKnowledgeThresholdShift(player: any): number {
    const knowledge = player.knowledge ?? BASE_ATTRIBUTE;
    const mod = getModifier(knowledge);
    return mod * 0.05;
}

/**
 * 知识带来的 maxSanity 降低量
 * 每 1 knowledge_mod → -KNOWLEDGE_SAN_COST maxSanity
 */
export function getKnowledgeSanityCost(player: any): number {
    const knowledge = player.baseKnowledge ?? player.knowledge ?? BASE_ATTRIBUTE;
    const mod = getModifier(knowledge);
    return Math.max(0, mod * KNOWLEDGE_SAN_COST);
}

/**
 * 威压带来的法术伤害加值
 */
export function getMagicDamageBonus(player: any): number {
    const effective = getEffectiveCoercion(player);
    return getModifier(effective);
}

/**
 * 意志带来的魔法伤害减免
 * 正值 = 减少受到的魔法伤害
 */
export function getMagicDefenseReduction(player: any): number {
    const effective = getEffectiveWill(player);
    return getModifier(effective);
}

// ============================================================
// 汇总：获取所有计算后的属性（用于 UI 展示）
// ============================================================

export interface ComputedAttributes {
    // 肉体
    physique: number;
    effectivePhysique: number;
    physiqueMod: number;
    speed: number;
    effectiveSpeed: number;
    speedMod: number;
    strength: number;
    effectiveStrength: number;
    strengthMod: number;
    // 精神
    will: number;
    effectiveWill: number;
    willMod: number;
    knowledge: number;
    knowledgeMod: number;
    coercion: number;
    effectiveCoercion: number;
    coercionMod: number;
    // 衍生值
    maxHpFromPhysique: number;
    movementFromSpeed: number;
    physicalDmgBonus: number;
    magicDmgBonus: number;
    magicDefReduction: number;
    knowledgeThresholdShift: number;
    knowledgeSanityCost: number;
    hpWeaknessPenalty: number;
}

/**
 * 一次性计算所有属性（适合 UI 渲染面板使用）
 */
export function computeAllAttributes(player: any): ComputedAttributes {
    const effPhys = getEffectivePhysique(player);
    const effSpd = getEffectiveSpeed(player);
    const effStr = getEffectiveStrength(player);
    const effWill = getEffectiveWill(player);
    const effCoer = getEffectiveCoercion(player);

    return {
        physique: player.physique ?? BASE_ATTRIBUTE,
        effectivePhysique: effPhys,
        physiqueMod: getModifier(effPhys),
        speed: player.speed ?? BASE_ATTRIBUTE,
        effectiveSpeed: effSpd,
        speedMod: getModifier(effSpd),
        strength: player.strength ?? BASE_ATTRIBUTE,
        effectiveStrength: effStr,
        strengthMod: getModifier(effStr),
        will: player.will ?? BASE_ATTRIBUTE,
        effectiveWill: effWill,
        willMod: getModifier(effWill),
        knowledge: player.knowledge ?? BASE_ATTRIBUTE,
        knowledgeMod: getModifier(player.knowledge ?? BASE_ATTRIBUTE),
        coercion: player.coercion ?? BASE_ATTRIBUTE,
        effectiveCoercion: effCoer,
        coercionMod: getModifier(effCoer),
        maxHpFromPhysique: getMaxHpFromPhysique(player),
        movementFromSpeed: getMovementFromSpeed(player),
        physicalDmgBonus: getPhysicalDamageBonus(player),
        magicDmgBonus: getMagicDamageBonus(player),
        magicDefReduction: getMagicDefenseReduction(player),
        knowledgeThresholdShift: getKnowledgeThresholdShift(player),
        knowledgeSanityCost: getKnowledgeSanityCost(player),
        hpWeaknessPenalty: getHpWeaknessPenalty(player),
    };
}

// 导出引擎作为命名空间对象（方便旧代码引用）
const AttributeEngine = {
    getModifier,
    getHpWeaknessPenalty,
    getEffectivePhysique,
    getEffectiveSpeed,
    getEffectiveStrength,
    getMaxHpFromPhysique,
    getMovementFromSpeed,
    getPhysicalDamageBonus,
    getEffectiveWill,
    getEffectiveCoercion,
    getKnowledgeThresholdShift,
    getKnowledgeSanityCost,
    getMagicDamageBonus,
    getMagicDefenseReduction,
    computeAllAttributes,
};

export default AttributeEngine;
