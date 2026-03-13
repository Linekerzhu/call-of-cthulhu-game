/**
 * Protagonists — 主角数据
 *
 * 主角代表角色身份，决定六围基础属性。
 * 与徽章（Badge）分离：徽章 = 探索流派 + 起始卡牌，主角 = 身份 + 基础属性。
 *
 * 基准值：10（普通人），总点数 64 = 60基准 + 4特色点
 */

export interface ProtagonistData {
    id: string;
    name: string;
    icon: string;
    avatar: string;          // 头像图片路径
    title: string;           // 职业/身份
    description: string;     // 背景描述
    backstory: string;       // 一句话故事
    stats: {
        physique: number;    // 体格
        speed: number;       // 速度
        strength: number;    // 力量
        will: number;        // 意志
        knowledge: number;   // 知识
        coercion: number;    // 威压
    };
}

const Protagonists: Record<string, ProtagonistData> = {
    // ====================
    // 小报记者 — 敏捷调查型
    // ====================
    '记者': {
        id: '记者',
        name: '艾伦·怀特',
        icon: '📰',
        avatar: 'protagonists/reporter.png',
        title: '小报记者',
        description: '一个追踪超自然事件的小报记者，敏锐、机警，擅长收集情报。',
        backstory: '"真相不会自己浮出水面，得有人伸手把它从深渊里捞出来。"',
        stats: {
            physique: 8,     // 体弱
            speed: 14,       // 灵活敏捷
            strength: 8,     // 力量平庸
            will: 10,        // 意志中等
            knowledge: 14,   // 博闻强识
            coercion: 10,    // 威压中等
        }
    },

    // ====================
    // 考古学教授 — 博学意志型
    // ====================
    '教授': {
        id: '教授',
        name: '玛格丽特·霍华德',
        icon: '📚',
        avatar: 'protagonists/professor.png',
        title: '考古学教授',
        description: '米斯卡托尼克大学的考古学教授，对古代文明有着深刻的理解。',
        backstory: '"这些古老的符号……它们不是装饰，是警告。"',
        stats: {
            physique: 8,     // 学者体质
            speed: 8,        // 行动迟缓
            strength: 8,     // 力量薄弱
            will: 14,        // 意志坚定
            knowledge: 16,   // 学识渊博
            coercion: 10,    // 威压中等
        }
    },

    // ====================
    // 黑帮流氓 — 暴力威压型
    // ====================
    '流氓': {
        id: '流氓',
        name: '维克托·"铁拳"·罗西',
        icon: '🔪',
        avatar: 'protagonists/gangster.png',
        title: '黑帮流氓',
        description: '因为欠下赌债而卷入神秘事件的街头混混，粗暴但狡猾。',
        backstory: '"我跟人打架不需要理由，跟怪物打架……也一样。"',
        stats: {
            physique: 14,    // 身体强壮
            speed: 10,       // 速度中等
            strength: 14,    // 力大无穷
            will: 8,         // 意志薄弱
            knowledge: 6,    // 知识匮乏
            coercion: 12,    // 街头威慑
        }
    },
};

/**
 * 主角管理器
 */
export const ProtagonistManager = {
    getAll: function(): ProtagonistData[] {
        return Object.values(Protagonists);
    },

    get: function(id: string): ProtagonistData | null {
        return Protagonists[id] || null;
    },

    /**
     * 将主角属性应用到玩家
     */
    applyProtagonist: function(player: any, protagonistId: string): boolean {
        const p = Protagonists[protagonistId];
        if (!p) return false;

        // 设置六围基础属性
        player.physique = p.stats.physique;
        player.basePhysique = p.stats.physique;
        player.speed = p.stats.speed;
        player.baseSpeed = p.stats.speed;
        player.strength = p.stats.strength;
        player.baseStrength = p.stats.strength;
        player.will = p.stats.will;
        player.baseWill = p.stats.will;
        player.knowledge = p.stats.knowledge;
        player.baseKnowledge = p.stats.knowledge;
        player.coercion = p.stats.coercion;
        player.baseCoercion = p.stats.coercion;

        return true;
    }
};

export default Protagonists;
