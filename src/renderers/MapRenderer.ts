import type Game from '../core/Game.ts';

/**
 * MapRenderer — 地图场景渲染（底部→顶部的克苏鲁深渊路径）
 */
export default class MapRenderer {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public render(): void {
        const container = document.getElementById('map-container');
        if (!container) return;

        container.innerHTML = '';

        const map = this.game.state.map;
        if (!map) return;

        const mapEl = document.createElement('div');
        mapEl.className = 'map-tree';

        const levels = this.organizeMapLevels(map);

        // 反转层级顺序：底部为起点，顶部为Boss
        const reversedLevels = [...levels].reverse();

        for (let i = 0; i < reversedLevels.length; i++) {
            const levelNodes = reversedLevels[i];
            const isFirst = i === reversedLevels.length - 1; // 原始第0层 = 起点
            const isLast = i === 0; // 原始最后层 = Boss

            const levelEl = document.createElement('div');
            levelEl.className = 'map-level';

            // 层间连线
            if (i > 0) {
                const connEl = document.createElement('div');
                connEl.className = 'map-connector';
                // 根据节点数量调整连线
                if (levelNodes.length > 1) {
                    connEl.classList.add('branch-connector');
                }
                levelEl.appendChild(connEl);
            }

            // 分叉提示
            if (levelNodes.length > 1) {
                const branchHint = document.createElement('div');
                branchHint.className = 'branch-hint';
                branchHint.textContent = '选择你的道路';
                levelEl.appendChild(branchHint);
            }

            const nodesContainer = document.createElement('div');
            nodesContainer.className = 'nodes-row';

            for (let j = 0; j < levelNodes.length; j++) {
                const nodeCard = this.createMapNodeCard(levelNodes[j]);
                nodesContainer.appendChild(nodeCard);
            }

            levelEl.appendChild(nodesContainer);
            mapEl.appendChild(levelEl);
        }

        container.appendChild(mapEl);

        // 滚动到底部（起点位置）
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

    private organizeMapLevels(map: any): any[][] {
        const levels: any[][] = [];
        const visited: Record<number, boolean> = {};

        const queue: number[] = [0];
        visited[0] = true;

        while (queue.length > 0) {
            const levelSize = queue.length;
            const currentLevel: any[] = [];

            for (let i = 0; i < levelSize; i++) {
                const nodeId = queue.shift() as number;
                currentLevel.push(map.nodes[nodeId]);

                const node = map.nodes[nodeId];
                if (node.children) {
                    for (let j = 0; j < node.children.length; j++) {
                        const childId = node.children[j];
                        if (!visited[childId]) {
                            visited[childId] = true;
                            queue.push(childId);
                        }
                    }
                }
            }

            levels.push(currentLevel);
        }

        return levels;
    }

    private createMapNodeCard(node: any): HTMLElement {
        const card = document.createElement('div');
        card.className = `map-node-card node-${node.type}`;

        if (node.visited) {
            card.classList.add('visited');
        } else if (node.available) {
            card.classList.add('available');
            if (node.isHard) {
                card.classList.add('elite-path');
            }
        } else {
            card.classList.add('locked');
        }

        // 节点光环
        const glow = document.createElement('div');
        glow.className = 'node-glow';
        card.appendChild(glow);

        const icon = document.createElement('div');
        icon.className = 'node-icon';
        icon.textContent = node.icon;
        card.appendChild(icon);

        const name = document.createElement('div');
        name.className = 'node-name';
        name.textContent = this.game.getNodeName(node.type);
        card.appendChild(name);

        if (node.isHard) {
            const danger = document.createElement('div');
            danger.className = 'node-danger';
            danger.textContent = '⚠ 危险';
            card.appendChild(danger);
        }

        if (node.available && !node.visited) {
            card.addEventListener('click', () => {
                this.onMapNodeClick(node);
            });
        }

        return card;
    }

    private onMapNodeClick(node: any): void {
        this.game.eventBus.emit('combat:select');

        if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
            this.game.advanceMap(node.id, true);
            this.game.startCombat(node.type);
        } else if (node.type === 'rest') {
            this.game.advanceMap(node.id, true);
            this.game.showRestScreen();
        } else if (node.type === 'shop') {
            this.game.advanceMap(node.id, true);
            this.game.showShopScreen();
        } else if (node.type === 'event') {
            this.game.advanceMap(node.id, true);
            this.triggerRandomEvent();
        }
    }

    private triggerRandomEvent(): void {
        const events = [
            { text: '🔮 你发现了一个古老的祭品…恢复5点理智', effect: () => this.game.modifySanity(5) },
            { text: '📜 翻阅禁忌典籍…失去3点理智但获得1点最大能量', effect: () => { this.game.modifySanity(-3); this.game.state.setPlayerStats({ baseMaxEnergy: (this.game.state.player.baseMaxEnergy || 3) + 1 }); } },
            { text: '🩸 在血迹斑驳的墙壁上发现了治愈符文…恢复10点HP', effect: () => this.game.modifyHP(10) },
            { text: '👁️ 深渊凝视着你…失去5点理智上限', effect: () => this.game.modifyMaxSanity(-5, '深渊凝视') },
            { text: '💎 捡到一块奇异的宝石…恢复8点HP和3点理智', effect: () => { this.game.modifyHP(8); this.game.modifySanity(3); } },
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();
        this.game.log(event.text);
        this.game.renderSystem?.showPassiveEffect(event.text, '🔮');

        // 回到地图
        setTimeout(() => {
            (this.game as any).router.returnToMap();
        }, 1500);
    }

    public updateMapUI(): void {
        const player = this.game.state.player!;
        this.updateElement('map-hp', player.hp);
        this.updateElement('map-max-hp', player.maxHp);
        this.updateElement('map-floor', this.game.state.floor);

        if (player.sanity !== undefined) {
            this.updateElement('map-sanity', player.sanity);
            this.updateElement('map-max-sanity', player.maxSanity);
        }
    }

    private updateElement(id: string, value: any): void {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = String(value);
        }
    }
}
