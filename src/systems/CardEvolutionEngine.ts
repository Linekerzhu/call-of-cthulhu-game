/**
 * CardEvolutionEngine — 里效果觉醒系统
 * 
 * 根据玩家当前 SAN 百分比，动态解锁卡牌的里效果：
 * - 表·常态: SAN ≥ 70%  → 正常效果
 * - 里·初窥: SAN < 70%  → 解锁第 1 个里效果
 * - 里·深陷: SAN < 40%  → 解锁第 2 个里效果
 * - 里·深渊: SAN < 15%  → 完全变异
 *
 * 知识属性影响：每点 knowledge_mod 使阈值偏移 +5%
 */

import { getKnowledgeThresholdShift } from './AttributeEngine.ts';

export interface InnerEffect {
    sanityThreshold: number;    // SAN% 低于此值时解锁
    bonusEffects?: any[];       // 附加的效果列表
    nameOverride?: string;      // 替换卡牌名称
    costOverride?: number;      // 替换费用
    descOverride?: string;      // 替换描述
    flavorText?: string;        // 觉醒风味文本
    replaceCard?: {             // 完全变异为另一张卡
        name: string;
        cost: number;
        effects: any[];
        description?: string;
    };
}

export default class CardEvolutionEngine {

    /**
     * 获取卡牌当前的觉醒状态
     * 返回觉醒级别 (0=表, 1=初窥, 2=深陷, 3=深渊)
     * @param thresholdShift 知识带来的阈值偏移（正值 = 更容易解锁）
     */
    static getAwakeningLevel(card: any, sanityRatio: number, autoAwaken: boolean = false, thresholdShift: number = 0): number {
        if (!card.innerEffects || card.innerEffects.length === 0) return 0;

        // 不可名状突变：自动最大觉醒
        if (autoAwaken) {
            return card.innerEffects.length;
        }

        let level = 0;
        for (let i = 0; i < card.innerEffects.length; i++) {
            // 知识偏移使阈值增大（更容易解锁）
            const adjustedThreshold = card.innerEffects[i].sanityThreshold + thresholdShift;
            if (sanityRatio < adjustedThreshold) {
                level = i + 1;
            }
        }
        return level;
    }

    /**
     * 获取觉醒后的卡牌展示信息（用于渲染）
     */
    static getResolvedCard(card: any, sanityRatio: number, autoAwaken: boolean = false, thresholdShift: number = 0): any {
        const level = this.getAwakeningLevel(card, sanityRatio, autoAwaken, thresholdShift);
        if (level === 0) return card;

        const innerEffects: InnerEffect[] = card.innerEffects;
        const activeInner = innerEffects[level - 1];

        // 完全变异
        if (activeInner.replaceCard) {
            return {
                ...card,
                name: activeInner.replaceCard.name,
                cost: activeInner.replaceCard.cost,
                effects: activeInner.replaceCard.effects,
                description: activeInner.replaceCard.description || card.description,
                _awakened: true,
                _awakeningLevel: level,
                _originalName: card.name,
                _flavorText: activeInner.flavorText
            };
        }

        // 部分觉醒：合并效果
        const resolved = { ...card };
        resolved._awakened = true;
        resolved._awakeningLevel = level;
        resolved._originalName = card.name;

        // 收集所有已激活的里效果
        const allBonusEffects: any[] = [];
        const flavorTexts: string[] = [];

        for (let i = 0; i < level; i++) {
            const inner = innerEffects[i];
            if (inner.bonusEffects) {
                allBonusEffects.push(...inner.bonusEffects);
            }
            if (inner.nameOverride) {
                resolved.name = inner.nameOverride;
            }
            if (inner.costOverride !== undefined) {
                resolved.cost = inner.costOverride;
            }
            if (inner.descOverride) {
                resolved.description = inner.descOverride;
            }
            if (inner.flavorText) {
                flavorTexts.push(inner.flavorText);
            }
        }

        // 合并原效果 + 里效果
        if (allBonusEffects.length > 0) {
            resolved.effects = [...(card.effects || []), ...allBonusEffects];
        }

        resolved._flavorTexts = flavorTexts;
        return resolved;
    }

    /**
     * 执行卡牌时，获取实际应执行的效果列表
     * 这是主要的集成点
     */
    static resolveEffectsForPlay(card: any, player: any): { card: any; bonusLog: string[] } {
        const sanityRatio = player.sanity / 50;  // 基于标准值50计算
        const autoAwaken = !!(player.madnessMutations && player.madnessMutations.includes('unnameable'));
        const thresholdShift = getKnowledgeThresholdShift(player);

        const resolved = this.getResolvedCard(card, sanityRatio, autoAwaken, thresholdShift);
        const bonusLog: string[] = [];

        if (resolved._awakened) {
            const levelNames = ['', '里·初窥', '里·深陷', '里·深渊'];
            const levelName = levelNames[resolved._awakeningLevel] || '觉醒';

            if (resolved._originalName && resolved._originalName !== resolved.name) {
                bonusLog.push(`🌀 ${resolved._originalName} 觉醒为【${resolved.name}】！(${levelName})`);
            } else {
                bonusLog.push(`🌀 【${resolved.name}】${levelName}解锁！`);
            }

            if (resolved._flavorTexts && resolved._flavorTexts.length > 0) {
                bonusLog.push(`💭 ${resolved._flavorTexts[resolved._flavorTexts.length - 1]}`);
            }
        }

        return { card: resolved, bonusLog };
    }

    /**
     * 获取觉醒级别的显示名称
     */
    static getAwakeningDisplayName(level: number): string {
        const names = ['表·常态', '里·初窥', '里·深陷', '里·深渊'];
        return names[level] || '未知';
    }

    /**
     * 获取觉醒级别的颜色
     */
    static getAwakeningColor(level: number): string {
        const colors = ['#c9a84c', '#9370DB', '#FF4500', '#00FF88'];
        return colors[level] || '#c9a84c';
    }

    /**
     * 获取禁忌等级的显示颜色
     */
    static getForbiddenTierColor(tier: number): string {
        const colors: Record<number, string> = {
            1: '#aab4be',  // 银灰 - 不安之兆
            2: '#6d9eeb',  // 蓝色 - 诡秘残篇
            3: '#9370DB',  // 紫色 - 异界低语
            4: '#FF6B35',  // 橙红 - 深渊启示
            5: '#FF1744'   // 血红 - 不可名状
        };
        return colors[tier] || '#aab4be';
    }

    /**
     * 获取禁忌等级名称
     */
    static getForbiddenTierName(tier: number): string {
        const names: Record<number, string> = {
            1: '不安之兆',
            2: '诡秘残篇',
            3: '异界低语',
            4: '深渊启示',
            5: '不可名状'
        };
        return names[tier] || '未知';
    }

    /**
     * 生成上古乱码文本（用于未解锁的里词条）
     */
    static generateCipherText(seed: string, length: number = 12): string {
        const cipherChars = 'ŗ̴̢̛̬͎̲̰̣̠̬̈́̽̈́̑̿̋̕͝h̸̢̧̛̹̤̩̦̬̀̈́̏̿̈́̍̈̀\'̸l̷̢̛̛̗̯̲̙̘̻̂̈́̽̈́̕ÿ̸̧̧̢̛̛̝̤̗̦̤̹̈́ê̸̢̧̛̹̈́ḧ̵̛̥̦́̏';
        const glyphs = ['☠','̴̡̧̛̛̺̖̦̈́̽','̷̢̛̛̗̯̲̙̘̻̂̈́̽̈́̕','̸̢̧̛̛̤̗̦̤̹̈́','̵̛̥̦̈́̏'];
        // Use a seeded pseudo-random based on card name
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash |= 0;
        }

        const fragments = [
            'ph\'nglui', 'mglw\'nafh', 'R\'lyeh', 'wgah\'nagl',
            'fhtagn', 'Yog-Sothoth', 'Nyarlathotep', 'Shub-Niggurath',
            'iä', 'Cthulhu', 'n\'gha', 'y\'hah', 'zhro',
            'gn\'th', 'k\'yarnak', 'lloigor', 'zhar',
            'ithaqua', 'tsathoggua', 'abhoth', 'azathoth',
            'ngah', 'hai', 'gof\'nn', 'vulgtmm'
        ];

        const wordCount = 2 + Math.abs(hash % 3);
        const result: string[] = [];
        for (let i = 0; i < wordCount; i++) {
            const idx = Math.abs((hash + i * 7) % fragments.length);
            result.push(fragments[idx]);
        }
        return result.join(' ');
    }

    /**
     * 获取卡牌里词条的展示信息（用于tooltip和牌库查看器）
     * 返回每一层级的显示状态：cipher(加密) 或 revealed(已解锁)
     */
    static getInnerEffectDisplay(card: any, sanityRatio: number, autoAwaken: boolean = false, thresholdShift: number = 0): {
        level: number;
        tiers: Array<{
            tierIndex: number;
            tierName: string;
            threshold: number;
            unlocked: boolean;
            text: string;
            flavorText?: string;
            color: string;
        }>;
    } {
        const level = this.getAwakeningLevel(card, sanityRatio, autoAwaken, thresholdShift);
        const tiers: any[] = [];

        if (!card.innerEffects || card.innerEffects.length === 0) {
            return { level, tiers };
        }

        const tierNames = ['里·初窥', '里·深陷', '里·深渊'];
        const tierColors = ['#9370DB', '#FF4500', '#00FF88'];

        for (let i = 0; i < card.innerEffects.length; i++) {
            const inner = card.innerEffects[i];
            const unlocked = autoAwaken || (sanityRatio < (inner.sanityThreshold + thresholdShift));
            const tierName = tierNames[i] || `里·第${i + 1}层`;
            const thresholdPercent = Math.floor(inner.sanityThreshold * 100);

            let text: string;
            if (unlocked) {
                // 已解锁 — 显示真实内容
                if (inner.replaceCard) {
                    text = `⚡ 变异为【${inner.replaceCard.name}】— ${inner.replaceCard.description || '???'}`;
                } else {
                    const parts: string[] = [];
                    if (inner.nameOverride) parts.push(`改名→${inner.nameOverride}`);
                    if (inner.descOverride) parts.push(inner.descOverride);
                    else if (inner.bonusEffects) {
                        const effDescs: string[] = [];
                        for (const eff of inner.bonusEffects) {
                            switch (eff.type) {
                                case 'targetDamage': case 'rangedDamage': case 'piercingDamage':
                                    effDescs.push(`+${eff.value}伤害`); break;
                                case 'gainBlock': effDescs.push(`+${eff.value}格挡`); break;
                                case 'heal': effDescs.push(`+${eff.value}HP`); break;
                                case 'aoe': effDescs.push(`+${eff.value}全体`); break;
                                case 'drawCards': effDescs.push(`抽${eff.value}张`); break;
                                case 'reflect': effDescs.push(`+${eff.value}反伤`); break;
                                case 'gainEnergy': effDescs.push(`+${eff.value}能量`); break;
                                case 'gainMovement': effDescs.push(`+${eff.value}移动`); break;
                                case 'sanityRestore': effDescs.push(`+${eff.value}SAN`); break;
                                case 'sanityCost': effDescs.push(`-${eff.value}SAN`); break;
                                case 'selfDamage': effDescs.push(`-${eff.value}HP`); break;
                                case 'attackBuff': effDescs.push(`攻击+${eff.value}`); break;
                                case 'dot': effDescs.push(`中毒`); break;
                                case 'stun': effDescs.push(`眩晕`); break;
                                case 'vampiric': effDescs.push(`+${eff.value}吸血`); break;
                                case 'pull': effDescs.push(`拉近${eff.value}`); break;
                                case 'pushBack': effDescs.push(`击退${eff.value}`); break;
                                case 'teleport': effDescs.push(`传送`); break;
                                case 'terrainDamage': effDescs.push(`放置陷阱`); break;
                                case 'markEnemy': effDescs.push(`标记x${eff.value}`); break;
                                default: effDescs.push(eff.type);
                            }
                        }
                        parts.push(effDescs.join(' '));
                    }
                    text = parts.join(' | ') || '???';
                }
            } else {
                // 未解锁 — 生成上古乱码
                text = this.generateCipherText(card.name + i, 12);
            }

            tiers.push({
                tierIndex: i,
                tierName,
                threshold: thresholdPercent,
                unlocked,
                text,
                flavorText: unlocked ? inner.flavorText : undefined,
                color: tierColors[i] || '#9370DB'
            });
        }

        return { level, tiers };
    }
}
