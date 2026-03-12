/**
 * StatusEffectSystem — 统一状态效果管理器
 * 
 * 管理玩家和敌人身上的持续效果：DOT、debuff、buff
 * 每回合自动结算，与 CombatSystem 集成
 */

export interface StatusEffect {
    id: string;
    name: string;
    type: 'dot' | 'debuff' | 'buff';
    value: number;           // 效果数值（DOT伤害/debuff数值/buff数值）
    duration: number;        // 剩余持续回合
    icon: string;            // 显示图标
    source?: string;         // 来源标识
    stackable?: boolean;     // 是否可叠加
    stacks?: number;         // 当前层数
}

export interface StatusEffectTarget {
    statusEffects: StatusEffect[];
    hp: number;
    maxHp?: number;
    strength?: number;
    speed?: number;
    position?: { row: number; col: number };
    name?: string;
}

export default class StatusEffectSystem {

    /**
     * 给目标添加状态效果
     */
    static apply(target: StatusEffectTarget, effect: Omit<StatusEffect, 'stacks'>): void {
        if (!target.statusEffects) {
            target.statusEffects = [];
        }

        // 查找已存在的同ID效果
        const existing = target.statusEffects.find(e => e.id === effect.id);

        if (existing) {
            if (effect.stackable) {
                existing.stacks = (existing.stacks || 1) + 1;
                existing.value += effect.value;
                existing.duration = Math.max(existing.duration, effect.duration);
            } else {
                // 不可叠加：刷新持续时间，取较高值
                existing.duration = Math.max(existing.duration, effect.duration);
                existing.value = Math.max(existing.value, effect.value);
            }
        } else {
            target.statusEffects.push({
                ...effect,
                stacks: effect.stackable ? 1 : undefined
            });
        }
    }

    /**
     * 移除目标的指定状态效果
     */
    static remove(target: StatusEffectTarget, effectId: string): void {
        if (!target.statusEffects) return;
        target.statusEffects = target.statusEffects.filter(e => e.id !== effectId);
    }

    /**
     * 清除目标所有状态效果
     */
    static clearAll(target: StatusEffectTarget): void {
        target.statusEffects = [];
    }

    /**
     * 清除特定类型的状态
     */
    static clearType(target: StatusEffectTarget, type: 'dot' | 'debuff' | 'buff'): void {
        if (!target.statusEffects) return;
        target.statusEffects = target.statusEffects.filter(e => e.type !== type);
    }

    /**
     * 查询目标是否有某个效果
     */
    static has(target: StatusEffectTarget, effectId: string): boolean {
        return !!target.statusEffects?.find(e => e.id === effectId);
    }

    /**
     * 获取效果的当前数值
     */
    static getValue(target: StatusEffectTarget, effectId: string): number {
        const eff = target.statusEffects?.find(e => e.id === effectId);
        return eff ? eff.value : 0;
    }

    /**
     * 获取所有debuff对某属性的总修正值
     * 例如: getStatModifier(enemy, 'strength') 返回攻击力修正
     */
    static getStatModifier(target: StatusEffectTarget, stat: string): number {
        if (!target.statusEffects) return 0;
        let mod = 0;
        for (const eff of target.statusEffects) {
            if (eff.type === 'debuff' && eff.id === `weaken_${stat}`) {
                mod -= eff.value;
            }
            if (eff.type === 'buff' && eff.id === `buff_${stat}`) {
                mod += eff.value;
            }
        }
        return mod;
    }

    /**
     * 回合开始结算：处理 DOT 伤害，返回日志消息数组
     */
    static processTurnStart(target: StatusEffectTarget): string[] {
        const logs: string[] = [];
        if (!target.statusEffects) return logs;

        const name = target.name || '目标';

        for (const eff of target.statusEffects) {
            if (eff.type === 'dot') {
                const dmg = eff.value;
                target.hp -= dmg;
                logs.push(`${eff.icon} ${name}受到${eff.name}效果${dmg}点伤害！`);
            }
        }

        return logs;
    }

    /**
     * 回合结束结算：递减持续时间，移除到期效果，返回日志
     */
    static processTurnEnd(target: StatusEffectTarget): string[] {
        const logs: string[] = [];
        if (!target.statusEffects) return logs;

        const name = target.name || '目标';
        const remaining: StatusEffect[] = [];

        for (const eff of target.statusEffects) {
            eff.duration--;
            if (eff.duration <= 0) {
                logs.push(`${name}的${eff.name}效果已消退`);
            } else {
                remaining.push(eff);
            }
        }

        target.statusEffects = remaining;
        return logs;
    }

    /**
     * 检查目标是否被眩晕
     */
    static isStunned(target: StatusEffectTarget): boolean {
        return StatusEffectSystem.has(target, 'stun');
    }

    /**
     * 获取目标的有效攻击力（含 debuff/buff 修正）
     */
    static getEffectiveStrength(target: StatusEffectTarget): number {
        const base = (target as any).strength || 0;
        const mod = StatusEffectSystem.getStatModifier(target, 'strength');
        return Math.max(0, base + mod);
    }

    /**
     * 获取目标的有效速度（含 debuff 修正）
     */
    static getEffectiveSpeed(target: StatusEffectTarget): number {
        const base = (target as any).speed || 1;
        const mod = StatusEffectSystem.getStatModifier(target, 'speed');
        return Math.max(0, base + mod);
    }

    /**
     * 格式化显示目标上的所有状态效果
     */
    static formatEffects(target: StatusEffectTarget): string {
        if (!target.statusEffects || target.statusEffects.length === 0) return '';
        return target.statusEffects
            .map(e => `${e.icon}${e.stacks && e.stacks > 1 ? `×${e.stacks}` : ''}(${e.duration})`)
            .join(' ');
    }
}
