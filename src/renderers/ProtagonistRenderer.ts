import type Game from '../core/Game.ts';
import { ProtagonistManager } from '../data/Protagonists.ts';
import type { ProtagonistData } from '../data/Protagonists.ts';
import { getModifier } from '../systems/AttributeEngine.ts';

/**
 * ProtagonistRenderer — 主角选择界面渲染
 */
export default class ProtagonistRenderer {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public render(): void {
        const container = document.getElementById('protagonist-list');
        if (!container) return;
        container.innerHTML = '';

        const protagonists = ProtagonistManager.getAll();

        for (const p of protagonists) {
            const card = this.createProtagonistCard(p);
            container.appendChild(card);
        }
    }

    private createProtagonistCard(p: ProtagonistData): HTMLElement {
        const card = document.createElement('div');
        card.className = 'protagonist-card';

        // 头部：图标 + 名字 + 职业
        const header = document.createElement('div');
        header.className = 'protagonist-header';
        
        const icon = document.createElement('div');
        icon.className = 'protagonist-icon';

        // 使用头像图片，失败则显示emoji
        const avatarImg = document.createElement('img');
        avatarImg.src = p.avatar;
        avatarImg.alt = p.name;
        avatarImg.className = 'protagonist-avatar-img';
        avatarImg.onerror = () => {
            avatarImg.remove();
            icon.textContent = p.icon;
        };
        icon.appendChild(avatarImg);
        header.appendChild(icon);

        const info = document.createElement('div');
        info.className = 'protagonist-info';

        const nameEl = document.createElement('h3');
        nameEl.className = 'protagonist-name';
        nameEl.textContent = p.name;
        info.appendChild(nameEl);

        const titleEl = document.createElement('div');
        titleEl.className = 'protagonist-title';
        titleEl.textContent = p.title;
        info.appendChild(titleEl);

        header.appendChild(info);
        card.appendChild(header);

        // 描述
        const descEl = document.createElement('div');
        descEl.className = 'protagonist-desc';
        descEl.textContent = p.description;
        card.appendChild(descEl);

        // 六围展示
        const statsEl = document.createElement('div');
        statsEl.className = 'protagonist-stats';

        const physicalStats = [
            { label: '体格', value: p.stats.physique, icon: '💪' },
            { label: '速度', value: p.stats.speed, icon: '🏃' },
            { label: '力量', value: p.stats.strength, icon: '⚔️' },
        ];
        const mentalStats = [
            { label: '意志', value: p.stats.will, icon: '🧠' },
            { label: '知识', value: p.stats.knowledge, icon: '📖' },
            { label: '威压', value: p.stats.coercion, icon: '🔮' },
        ];

        const physGroup = document.createElement('div');
        physGroup.className = 'stat-group physical';
        const physLabel = document.createElement('div');
        physLabel.className = 'stat-group-label';
        physLabel.textContent = '肉体';
        physGroup.appendChild(physLabel);

        for (const s of physicalStats) {
            physGroup.appendChild(this.createStatBar(s.label, s.value, s.icon));
        }
        statsEl.appendChild(physGroup);

        const mentalGroup = document.createElement('div');
        mentalGroup.className = 'stat-group mental';
        const mentalLabel = document.createElement('div');
        mentalLabel.className = 'stat-group-label';
        mentalLabel.textContent = '精神';
        mentalGroup.appendChild(mentalLabel);

        for (const s of mentalStats) {
            mentalGroup.appendChild(this.createStatBar(s.label, s.value, s.icon));
        }
        statsEl.appendChild(mentalGroup);
        card.appendChild(statsEl);

        // 底部：背景故事
        const backstory = document.createElement('div');
        backstory.className = 'protagonist-backstory';
        backstory.textContent = p.backstory;
        card.appendChild(backstory);

        // 点击选择
        card.addEventListener('click', () => {
            this.game.selectProtagonist(p.id);
        });

        return card;
    }

    private createStatBar(label: string, value: number, icon: string): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'stat-bar-item';

        const mod = getModifier(value);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
        
        // 判断强弱
        let strength = 'normal';
        if (value >= 14) strength = 'strong';
        else if (value >= 12) strength = 'good';
        else if (value <= 6) strength = 'weak';
        else if (value <= 8) strength = 'low';

        const labelEl = document.createElement('span');
        labelEl.className = 'stat-label';
        labelEl.textContent = `${icon} ${label}`;
        wrapper.appendChild(labelEl);

        const barOuter = document.createElement('div');
        barOuter.className = 'stat-bar-outer';

        const barInner = document.createElement('div');
        barInner.className = `stat-bar-inner ${strength}`;
        // 归一化到 0-20 范围内展示（6是最低，16是最高）
        const pct = Math.min(100, Math.max(10, ((value - 4) / 14) * 100));
        barInner.style.width = `${pct}%`;
        barOuter.appendChild(barInner);
        wrapper.appendChild(barOuter);

        const valueEl = document.createElement('span');
        valueEl.className = `stat-value ${strength}`;
        valueEl.textContent = `${value} (${modStr})`;
        wrapper.appendChild(valueEl);

        return wrapper;
    }
}
