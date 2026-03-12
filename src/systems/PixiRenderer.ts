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
    public readonly CELL_SIZE = 64;
    public readonly ROWS = 5;
    public readonly COLS = 8;
    public readonly WIDTH = this.COLS * this.CELL_SIZE;
    public readonly HEIGHT = this.ROWS * this.CELL_SIZE;

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
        'normal':    0x1a1a2e,
        'madness':   0x2e0a2e,   // 疯狂之地 — 紫红暗色
        'sanctuary': 0x0a2e1a,   // 避难所 — 深绿色
        'void':      0x0a0018,   // 虚空
        'swamp':     0x0d2b1a,
        'ruins':     0x2d1a1a,
        'altar':     0x1a0a2e
    };

    private static readonly TERRAIN_BORDER: Record<string, number> = {
        'normal':    0x2a2a4e,
        'madness':   0x5e1a5e,   // 疯狂之地边框
        'sanctuary': 0x1a5e2a,   // 避难所边框
        'void':      0x1a0028,   // 虚空边框
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

        this.app = new PIXI.Application({
            width: this.WIDTH,
            height: this.HEIGHT,
            backgroundColor: 0x0a0a1a,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // 将 canvas 插入容器
        container.innerHTML = '';
        container.appendChild(this.app.view as HTMLCanvasElement);

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
            const playerSprite = createEntitySprite('player', true, this.CELL_SIZE, this.app.ticker);
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
                const hpBarWidth = 40;
                const hpBarHeight = 4;
                const hpBg = new PIXI.Graphics();
                hpBg.beginFill(0x000000, 0.5);
                hpBg.drawRoundedRect(-hpBarWidth / 2, 18, hpBarWidth, hpBarHeight, 2);
                hpBg.endFill();
                enemyContainer.addChild(hpBg);

                // HP条填充
                const hpFillWidth = Math.max(0, (e.hp / e.maxHp) * hpBarWidth);
                const hpFill = new PIXI.Graphics();
                const hpColor = e.hp / e.maxHp > 0.5 ? 0xe74c3c : (e.hp / e.maxHp > 0.25 ? 0xff6b35 : 0xff0000);
                hpFill.beginFill(hpColor);
                hpFill.drawRoundedRect(-hpBarWidth / 2, 18, hpFillWidth, hpBarHeight, 2);
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

        // 路径格子半透明高亮
        for (const p of path) {
            g.lineStyle(0);
            g.beginFill(0x00ff88, 0.15);
            g.drawRect(p.col * this.CELL_SIZE, p.row * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
            g.endFill();
        }

        // 目标格高亮
        g.lineStyle(2, 0x00ff88, 1);
        g.beginFill(0x00ff88, 0.3);
        g.drawRect(targetCol * this.CELL_SIZE, targetRow * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
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
                    g.lineStyle(1, 0xff4444, 0.5);
                    g.beginFill(0xff4444, 0.12);
                    g.drawRect(c * this.CELL_SIZE, r * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
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
