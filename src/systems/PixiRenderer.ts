import * as PIXI from 'pixi.js';
import type Game from '../core/Game.ts';
import { createEntitySprite, createTerrainOverlay } from './PixelSpriteFactory.ts';

/**
 * PixiRenderer - PixiJS 战斗网格渲染器
 */
export default class PixiRenderer {
    private game: Game;
    private app: PIXI.Application | null = null;

    // 网格参数
    public CELL_SIZE = 64;
    public readonly ROWS = 5;
    public readonly COLS = 8;
    public get WIDTH() { return this.COLS * this.CELL_SIZE; }
    public get HEIGHT() { return this.ROWS * this.CELL_SIZE; }

    // 图层容器
    private gridLayer: PIXI.Container | null = null;
    private terrainOverlayLayer: PIXI.Container | null = null;
    private rangeLayer: PIXI.Container | null = null;
    private entityLayer: PIXI.Container | null = null;
    private effectLayer: PIXI.Container | null = null;

    // 交互映射
    private _cellSprites: PIXI.Graphics[][] = [];

    // ============================
    // 地形颜色映射
    // ============================
    private static readonly TERRAIN_COLORS: Record<string, number> = {
        'normal':    0x0a1a0f,
        'madness':   0x1a0a1f,   // 疯狂之地 — 暗紫
        'sanctuary': 0x0a2e1a,   // 避难所 — 深绿色
        'void':      0x08050f,   // 虚空
        'swamp':     0x0d2b1a,
        'ruins':     0x2d1a1a,
        'altar':     0x1a0a2e
    };

    private static readonly TERRAIN_BORDER: Record<string, number> = {
        'normal':    0x1a2b22,
        'madness':   0x3a1a40,   // 疯狂之地边框
        'sanctuary': 0x1a5e2a,   // 避难所边框
        'void':      0x120a1e,   // 虚空边框
        'swamp':     0x1d4b2a,
        'ruins':     0x4d2a2a,
        'altar':     0x3a1a4e
    };

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * 初始化 PIXI Application，挂载到指定容器
     */
    public init(containerId: string): void {
        if (this.app) return; // 已初始化

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ PixiRenderer: 找不到容器 #' + containerId);
            return;
        }

        // 动态计算 CELL_SIZE —— 让棋盘尽可能填满可用空间
        const parentEl = container.parentElement;
        if (parentEl) {
            const rect = parentEl.getBoundingClientRect();
            const availW = rect.width - 16;  // 留出少量边距
            const availH = rect.height - 16;
            const cellByW = Math.floor(availW / this.COLS);
            const cellByH = Math.floor(availH / this.ROWS);
            this.CELL_SIZE = Math.max(48, Math.min(128, cellByW, cellByH));
        }

        this.app = new PIXI.Application({
            width: this.WIDTH,
            height: this.HEIGHT,
            backgroundColor: 0x040a06,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // 将 canvas 插入容器
        container.innerHTML = '';
        container.appendChild(this.app.view as HTMLCanvasElement);

        // 响应式缩放 — 当容器空间不足时自动缩小棋盘
        const gridContainerEl = container;
        const wrapEl = container.parentElement?.parentElement; // combat-grid-wrap
        if (wrapEl) {
            const fitGrid = () => {
                const wr = wrapEl.getBoundingClientRect();
                const canvasW = this.WIDTH;
                const canvasH = this.HEIGHT;
                const scaleX = (wr.width - 8) / canvasW;
                const scaleY = (wr.height - 8) / canvasH;
                const scale = Math.min(1, scaleX, scaleY);
                // 合并透视倾斜 + 缩放
                gridContainerEl.style.transform = `rotateX(6deg) scale(${scale.toFixed(3)})`;
                gridContainerEl.style.transformOrigin = 'center 60%';
            };
            const resizeObs = new ResizeObserver(fitGrid);
            resizeObs.observe(wrapEl);
            // 初始调用
            requestAnimationFrame(fitGrid);
        }

        // 初始化图层（渲染顺序：底 → 顶）
        this.gridLayer = new PIXI.Container();
        this.terrainOverlayLayer = new PIXI.Container();
        this.terrainOverlayLayer.eventMode = 'none';
        this.terrainOverlayLayer.interactiveChildren = false;
        this.rangeLayer = new PIXI.Container();
        this.rangeLayer.eventMode = 'none';          // 不拦截鼠标事件，允许点击穿透到gridLayer
        this.rangeLayer.interactiveChildren = false;  // 子元素也不拦截
        this.entityLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();
        this.effectLayer.eventMode = 'none';
        this.effectLayer.interactiveChildren = false;

        this.app.stage.addChild(this.gridLayer);
        this.app.stage.addChild(this.terrainOverlayLayer);
        this.app.stage.addChild(this.rangeLayer);
        this.app.stage.addChild(this.entityLayer);
        this.app.stage.addChild(this.effectLayer);

    }

    /**
     * 获取 VFX 上下文 (effectLayer + ticker)，供 CardVFX 使用
     */
    public getVFXContext(): { layer: PIXI.Container; ticker: PIXI.Ticker } | null {
        if (!this.app || !this.effectLayer) return null;
        return { layer: this.effectLayer, ticker: this.app.ticker };
    }

    /**
     * 将网格坐标转换为 effectLayer 中的像素坐标
     */
    public cellToPixel(row: number, col: number): { x: number; y: number } {
        return {
            x: col * this.CELL_SIZE + this.CELL_SIZE / 2,
            y: row * this.CELL_SIZE + this.CELL_SIZE / 2,
        };
    }

    // ============================
    // 网格渲染
    // ============================
    public renderGrid(grid: any[][]): void {
        if (!this.app || !this.gridLayer) return;

        this.gridLayer.removeChildren();
        this._cellSprites = [];

        // 清理地形动画覆盖层
        if (this.terrainOverlayLayer) {
            for (const child of this.terrainOverlayLayer.children) {
                if ((child as any)._terrainCleanup) (child as any)._terrainCleanup();
            }
            this.terrainOverlayLayer.removeChildren();
        }

        for (let r = 0; r < this.ROWS; r++) {
            this._cellSprites[r] = [];
            for (let c = 0; c < this.COLS; c++) {
                const terrain = (grid && grid[r] && grid[r][c]) ? grid[r][c].terrain : 'normal';
                const fillColor = PixiRenderer.TERRAIN_COLORS[terrain] || 0x1a1a2e;
                const borderColor = PixiRenderer.TERRAIN_BORDER[terrain] || 0x2a2a4e;

                const cell = new PIXI.Graphics();
                cell.lineStyle(1, borderColor, 0.6);
                cell.beginFill(fillColor);
                cell.drawRect(0, 0, this.CELL_SIZE, this.CELL_SIZE);
                cell.endFill();

                // 石板纹理变体 — 用 seeded 伪随机画几条微弱的纹路线
                const seed = r * 31 + c * 17;
                const lineCount = 2 + (seed % 3); // 2-4 lines per tile
                for (let li = 0; li < lineCount; li++) {
                    const lseed = seed * 7 + li * 13;
                    const isHorizontal = (lseed % 2) === 0;
                    const pos = 8 + ((lseed * 3) % (this.CELL_SIZE - 16));
                    const len = 12 + ((lseed * 5) % 24);
                    const start = 4 + ((lseed * 11) % (this.CELL_SIZE - len - 4));
                    const alpha = 0.06 + ((lseed % 5) * 0.015);
                    const shade = (lseed % 2 === 0) ? 0xffffff : 0x000000;
                    cell.lineStyle(1, shade, alpha);
                    if (isHorizontal) {
                        cell.moveTo(start, pos);
                        cell.lineTo(start + len, pos);
                    } else {
                        cell.moveTo(pos, start);
                        cell.lineTo(pos, start + len);
                    }
                }

                // 角落石板接缝点
                const dotAlpha = 0.04 + ((seed % 4) * 0.01);
                cell.lineStyle(0);
                cell.beginFill(0x000000, dotAlpha);
                cell.drawCircle(1, 1, 1);
                cell.drawCircle(this.CELL_SIZE - 1, 1, 1);
                cell.drawCircle(1, this.CELL_SIZE - 1, 1);
                cell.drawCircle(this.CELL_SIZE - 1, this.CELL_SIZE - 1, 1);
                cell.endFill();

                cell.x = c * this.CELL_SIZE;
                cell.y = r * this.CELL_SIZE;

                // 使格子可交互
                cell.eventMode = 'static';
                cell.cursor = 'pointer';
                cell.hitArea = new PIXI.Rectangle(0, 0, this.CELL_SIZE, this.CELL_SIZE);

                // 点击事件通过闭包绑定 row/col
                cell.on('pointertap', () => {
                    this.game.inputSystem.handleCellClick(r, c);
                });

                this.gridLayer.addChild(cell);
                this._cellSprites[r][c] = cell;

                // === 特殊地形像素动画覆盖 ===
                if (terrain !== 'normal' && this.terrainOverlayLayer && this.app) {
                    const overlay = createTerrainOverlay(terrain, this.CELL_SIZE, this.app.ticker);
                    if (overlay) {
                        overlay.x = c * this.CELL_SIZE;
                        overlay.y = r * this.CELL_SIZE;
                        this.terrainOverlayLayer.addChild(overlay);
                    }
                }
            }
        }

        // === 环境装饰物 sprite ===
        this.renderEnvironmentDecorations(grid);
    }

    /**
     * 在部分格子上绘制环境装饰物（骨头、蘑菇、裂缝、蜡烛等）
     */
    private renderEnvironmentDecorations(grid: any[][]): void {
        if (!this.gridLayer) return;

        const decorTypes = ['crack', 'bone', 'mushroom', 'candle', 'rune'];

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const terrain = (grid && grid[r] && grid[r][c]) ? grid[r][c].terrain : 'normal';
                if (terrain !== 'normal') continue;

                // ~18% 的格子有装饰
                const seed = r * 37 + c * 53 + 7;
                if (seed % 6 !== 0) continue;

                const decorIdx = seed % decorTypes.length;
                const deco = new PIXI.Graphics();
                const cx = c * this.CELL_SIZE;
                const cy = r * this.CELL_SIZE;
                // 在格子内随机偏移
                const ox = 10 + ((seed * 3) % (this.CELL_SIZE - 20));
                const oy = 10 + ((seed * 7) % (this.CELL_SIZE - 20));

                switch (decorTypes[decorIdx]) {
                    case 'crack':
                        // 细裂缝线
                        deco.lineStyle(1, 0x000000, 0.12);
                        deco.moveTo(cx + ox, cy + oy);
                        deco.lineTo(cx + ox + 8, cy + oy + 5);
                        deco.lineTo(cx + ox + 6, cy + oy + 10);
                        deco.moveTo(cx + ox + 8, cy + oy + 5);
                        deco.lineTo(cx + ox + 14, cy + oy + 3);
                        break;
                    case 'bone':
                        // 小骨头碎片
                        deco.lineStyle(0);
                        deco.beginFill(0xd4c8a0, 0.15);
                        deco.drawRect(cx + ox, cy + oy, 6, 2);
                        deco.drawCircle(cx + ox, cy + oy + 1, 1.5);
                        deco.drawCircle(cx + ox + 6, cy + oy + 1, 1.5);
                        deco.endFill();
                        break;
                    case 'mushroom':
                        // 小蘑菇
                        deco.lineStyle(0);
                        deco.beginFill(0x4a3060, 0.2);
                        deco.drawCircle(cx + ox + 3, cy + oy, 3);
                        deco.endFill();
                        deco.beginFill(0x3a2050, 0.18);
                        deco.drawRect(cx + ox + 2, cy + oy, 2, 5);
                        deco.endFill();
                        break;
                    case 'candle':
                        // 蜡烛火焰
                        deco.lineStyle(0);
                        deco.beginFill(0x8b7040, 0.15);
                        deco.drawRect(cx + ox + 1, cy + oy + 2, 2, 5);
                        deco.endFill();
                        deco.beginFill(0xffaa33, 0.12);
                        deco.drawCircle(cx + ox + 2, cy + oy + 1, 2);
                        deco.endFill();
                        break;
                    case 'rune':
                        // 地面符文圆
                        deco.lineStyle(0.5, 0x5a3d8a, 0.08);
                        deco.drawCircle(cx + ox + 4, cy + oy + 4, 4);
                        deco.moveTo(cx + ox + 1, cy + oy + 4);
                        deco.lineTo(cx + ox + 7, cy + oy + 4);
                        deco.moveTo(cx + ox + 4, cy + oy + 1);
                        deco.lineTo(cx + ox + 4, cy + oy + 7);
                        break;
                }

                this.gridLayer.addChild(deco);
            }
        }
    }

    // ============================
    // 实体渲染
    // ============================
    public renderEntities(player: any, enemies: any[]): void {
        if (!this.app || !this.entityLayer) return;

        // 清理旧的动画回调
        for (const child of this.entityLayer.children) {
            if ((child as any)._pixelAnimCleanup) (child as any)._pixelAnimCleanup();
            // 递归检查子容器
            if (child instanceof PIXI.Container) {
                for (const subChild of child.children) {
                    if ((subChild as any)._pixelAnimCleanup) (subChild as any)._pixelAnimCleanup();
                }
            }
        }
        this.entityLayer.removeChildren();

        // 玩家 — 像素精灵
        if (player) {
            const playerSprite = createEntitySprite('player', true, this.CELL_SIZE, this.app.ticker, player.protagonist);
            playerSprite.x = player.position.col * this.CELL_SIZE + this.CELL_SIZE / 2;
            playerSprite.y = player.position.row * this.CELL_SIZE + this.CELL_SIZE / 2;
            this.entityLayer.addChild(playerSprite);
        }

        // 敌人 — 像素精灵
        if (enemies) {
            for (const e of enemies) {
                if (e.hp <= 0) continue;

                const enemyContainer = new PIXI.Container();
                enemyContainer.x = e.position.col * this.CELL_SIZE + this.CELL_SIZE / 2;
                enemyContainer.y = e.position.row * this.CELL_SIZE + this.CELL_SIZE / 2;

                // 像素风格敌人精灵
                const enemySprite = createEntitySprite(e.name, false, this.CELL_SIZE, this.app.ticker);
                enemyContainer.addChild(enemySprite);

                // HP条背景
                const hpBarWidth = 48;
                const hpBarHeight = 4;
                const hpBg = new PIXI.Graphics();
                hpBg.beginFill(0x000000, 0.5);
                hpBg.drawRoundedRect(-hpBarWidth / 2, 20, hpBarWidth, hpBarHeight, 2);
                hpBg.endFill();
                enemyContainer.addChild(hpBg);

                // HP条填充
                const hpFillWidth = Math.max(0, (e.hp / e.maxHp) * hpBarWidth);
                const hpFill = new PIXI.Graphics();
                const hpColor = e.hp / e.maxHp > 0.5 ? 0xe74c3c : (e.hp / e.maxHp > 0.25 ? 0xff6b35 : 0xff0000);
                hpFill.beginFill(hpColor);
                hpFill.drawRoundedRect(-hpBarWidth / 2, 20, hpFillWidth, hpBarHeight, 2);
                hpFill.endFill();
                enemyContainer.addChild(hpFill);

                // 意图标签（像素风格文字）
                const intentValue = e.strength !== undefined ? e.strength : (e.intent ? e.intent.value : 0);
                const intentStr = e.intent && e.intent.type === 'attack' ? '⚔' + intentValue : '🛡';
                const intentText = new PIXI.Text(intentStr, {
                    fontSize: 10,
                    fill: e.intent && e.intent.type === 'attack' ? '#ff6666' : '#6699ff',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                });
                intentText.anchor.set(0.5, 0);
                intentText.x = this.CELL_SIZE / 2 - 14;
                intentText.y = -this.CELL_SIZE / 2 + 2;
                enemyContainer.addChild(intentText);

                // 交互区域 (透明矩形)
                const hitArea = new PIXI.Graphics();
                hitArea.beginFill(0x000000, 0.001);
                hitArea.drawRect(-this.CELL_SIZE / 2, -this.CELL_SIZE / 2, this.CELL_SIZE, this.CELL_SIZE);
                hitArea.endFill();
                hitArea.eventMode = 'static';
                hitArea.cursor = 'pointer';
                enemyContainer.addChild(hitArea);

                // Hover events
                const enemyRef = e;
                const gameRef = this.game;
                const canvasEl = this.app?.view;
                const eRow = e.position.row;
                const eCol = e.position.col;

                let hoverTimer: ReturnType<typeof setTimeout> | null = null;
                hitArea.on('pointerover', (event: PIXI.FederatedPointerEvent) => {
                    const canvasRect = canvasEl ? (canvasEl as HTMLCanvasElement).getBoundingClientRect() : { left: 0, top: 0 };
                    const screenX = event.global.x + canvasRect.left;
                    const screenY = event.global.y + canvasRect.top;
                    hoverTimer = setTimeout(() => {
                        gameRef.renderSystem.combatRenderer.showEnemyTooltip(enemyRef, screenX, screenY);
                    }, 1500);
                });
                hitArea.on('pointerout', () => {
                    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
                    gameRef.renderSystem.combatRenderer.hideEnemyTooltip();
                });
                hitArea.on('pointertap', () => {
                    gameRef.inputSystem.handleCellClick(eRow, eCol);
                });

                this.entityLayer.addChild(enemyContainer);
            }
        }
    }

    // ============================
    // 移动预览
    // ============================
    public showMovePreview(path: any[], targetRow: number, targetCol: number, dist: number): void {
        this.clearMovePreview();
        if (!this.app || !this.rangeLayer) return;

        const g = new PIXI.Graphics();
        const half = this.CELL_SIZE / 2;

        // 路径线段
        if (path && path.length > 1) {
            g.lineStyle(3, 0x00ff88, 0.7);
            g.moveTo(path[0].col * this.CELL_SIZE + half, path[0].row * this.CELL_SIZE + half);
            for (let i = 1; i < path.length; i++) {
                g.lineTo(path[i].col * this.CELL_SIZE + half, path[i].row * this.CELL_SIZE + half);
            }
        }

        // 路径格子半透明高亮 + 路径点
        for (const p of path) {
            const px = p.col * this.CELL_SIZE;
            const py = p.row * this.CELL_SIZE;
            g.lineStyle(0);
            g.beginFill(0x00ff88, 0.12);
            g.drawRect(px, py, this.CELL_SIZE, this.CELL_SIZE);
            g.endFill();

            // 路径中心点标记
            g.beginFill(0x00ff88, 0.35);
            g.drawCircle(px + half, py + half, 2.5);
            g.endFill();
        }

        // 目标格高亮 — 发光边框 + 中心标记
        g.lineStyle(2, 0x00ff88, 1);
        g.beginFill(0x00ff88, 0.25);
        g.drawRect(targetCol * this.CELL_SIZE, targetRow * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        g.endFill();

        // 目标中心较大标记
        g.lineStyle(0);
        g.beginFill(0x00ff88, 0.5);
        g.drawCircle(targetCol * this.CELL_SIZE + half, targetRow * this.CELL_SIZE + half, 4);
        g.endFill();

        // 消耗文字
        const costText = new PIXI.Text('-' + dist + '👟', {
            fontSize: 12,
            fill: '#00ff88',
            fontWeight: 'bold'
        });
        costText.anchor.set(0.5);
        costText.x = targetCol * this.CELL_SIZE + half;
        costText.y = targetRow * this.CELL_SIZE + this.CELL_SIZE - 10;
        this.rangeLayer.addChild(costText);

        this.rangeLayer.addChild(g);
    }

    public clearMovePreview(): void {
        if (this.rangeLayer) {
            this.rangeLayer.removeChildren();
        }
    }

    // ============================
    // 攻击范围高亮
    // ============================
    public highlightRange(playerPos: any, range: number): void {
        this.clearRange();
        if (!this.app || !this.rangeLayer) return;

        const g = new PIXI.Graphics();

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const dist = Math.abs(r - playerPos.row) + Math.abs(c - playerPos.col);
                if (dist <= range) {
                    const cx = c * this.CELL_SIZE;
                    const cy = r * this.CELL_SIZE;
                    const half = this.CELL_SIZE / 2;

                    // 范围填充
                    g.lineStyle(1.5, 0xff4444, 0.6);
                    g.beginFill(0xff4444, 0.10);
                    g.drawRect(cx, cy, this.CELL_SIZE, this.CELL_SIZE);
                    g.endFill();

                    // 中心标记点
                    g.lineStyle(0);
                    g.beginFill(0xff4444, 0.3);
                    g.drawCircle(cx + half, cy + half, 3);
                    g.endFill();
                }
            }
        }

        this.rangeLayer.addChild(g);
    }

    public clearRange(): void {
        if (this.rangeLayer) {
            this.rangeLayer.removeChildren();
        }
    }

    // ============================
    // 伤害飘字
    // ============================
    public showDamageNumber(row: number, col: number, damage: number): void {
        if (!this.app || !this.effectLayer) return;

        const half = this.CELL_SIZE / 2;
        const text = new PIXI.Text('-' + damage, {
            fontSize: 22,
            fill: '#ff3333',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.anchor.set(0.5);
        text.x = col * this.CELL_SIZE + half;
        text.y = row * this.CELL_SIZE + half;

        this.effectLayer.addChild(text);

        const startY = text.y;
        let elapsed = 0;
        const duration = 60; // 帧数 (~1秒)

        const onTick = () => {
            elapsed++;
            text.y = startY - (elapsed / duration) * 40;
            text.alpha = 1 - (elapsed / duration);
            if (elapsed >= duration) {
                if (this.app) this.app.ticker.remove(onTick);
                if (text.parent) text.parent.removeChild(text);
                text.destroy();
            }
        };
        this.app.ticker.add(onTick);
    }

    // ============================
    // 通用浮动文字
    // ============================
    public showFloatingText(row: number, col: number, textStr: string, color: string = '#ffffff'): void {
        if (!this.app || !this.effectLayer) return;

        const half = this.CELL_SIZE / 2;
        const text = new PIXI.Text(textStr, {
            fontSize: 16,
            fill: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.anchor.set(0.5);
        text.x = col * this.CELL_SIZE + half;
        text.y = row * this.CELL_SIZE + half - 10;

        this.effectLayer.addChild(text);

        const startY = text.y;
        let elapsed = 0;
        const duration = 60;
        const onTick = () => {
            elapsed++;
            text.y = startY - (elapsed / duration) * 30;
            text.alpha = 1 - (elapsed / duration);
            if (elapsed >= duration) {
                if (this.app) this.app.ticker.remove(onTick);
                if (text.parent) text.parent.removeChild(text);
                text.destroy();
            }
        };
        this.app.ticker.add(onTick);
    }

    // ============================
    // 死亡动画
    // ============================
    public playDeathAnimation(row: number, col: number): void {
        if (!this.app || !this.effectLayer) return;

        const half = this.CELL_SIZE / 2;
        const skull = new PIXI.Text('💀', {
            fontSize: 32,
            fill: '#ffffff'
        });
        skull.anchor.set(0.5);
        skull.x = col * this.CELL_SIZE + half;
        skull.y = row * this.CELL_SIZE + half;

        this.effectLayer.addChild(skull);

        let elapsed = 0;
        const duration = 30; // ~0.5秒
        const onTick = () => {
            elapsed++;
            const progress = elapsed / duration;
            skull.alpha = 1 - progress;
            skull.scale.set(1 + progress * 0.5);
            if (elapsed >= duration) {
                if (this.app) this.app.ticker.remove(onTick);
                if (skull.parent) skull.parent.removeChild(skull);
                skull.destroy();
            }
        };
        this.app.ticker.add(onTick);
    }

    // ============================
    // 销毁
    // ============================
    public destroy(): void {
        if (this.app) {
            // 清理动画回调
            if (this.entityLayer) {
                for (const child of this.entityLayer.children) {
                    if ((child as any)._pixelAnimCleanup) (child as any)._pixelAnimCleanup();
                    if (child instanceof PIXI.Container) {
                        for (const sub of child.children) {
                            if ((sub as any)._pixelAnimCleanup) (sub as any)._pixelAnimCleanup();
                        }
                    }
                }
            }
            if (this.terrainOverlayLayer) {
                for (const child of this.terrainOverlayLayer.children) {
                    if ((child as any)._terrainCleanup) (child as any)._terrainCleanup();
                }
            }
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null;
            this.gridLayer = null;
            this.terrainOverlayLayer = null;
            this.rangeLayer = null;
            this.entityLayer = null;
            this.effectLayer = null;
            this._cellSprites = [];
        }
    }
}
