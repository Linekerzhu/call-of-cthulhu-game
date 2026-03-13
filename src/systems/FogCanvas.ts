/**
 * FogCanvas — 战斗场景背景雾气动画层
 * 
 * 使用 simplex noise 变体生成缓慢蠕动的像素化墨绿/暗紫色雾气，
 * 增强克苏鲁深渊氛围感。性能友好：低分辨率渲染 + 低帧率更新。
 */

export default class FogCanvas {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private animationId: number = 0;
    private time: number = 0;
    private destroyed: boolean = false;

    // 低分辨率渲染（每个"像素"实际是 pixelScale x pixelScale 的方块）
    private readonly pixelScale = 6;
    private cols: number = 0;
    private rows: number = 0;

    // Simplex noise 置换表
    private perm: number[] = [];

    constructor() {
        // 生成置换表
        const p: number[] = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        this.perm = [...p, ...p]; // 512 entries
    }

    /**
     * 初始化并挂载到指定元素
     */
    public init(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 查找已有的canvas或创建新的
        let canvas = container.querySelector('.fog-canvas') as HTMLCanvasElement;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'fog-canvas';
            container.insertBefore(canvas, container.firstChild);
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (!this.ctx) return;

        this.resize();
        this.destroyed = false;
        this.animate();

        // 监听窗口大小变化
        window.addEventListener('resize', this._onResize);
    }

    private _onResize = (): void => {
        this.resize();
    };

    private resize(): void {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (!parent) return;

        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.cols = Math.ceil(this.canvas.width / this.pixelScale);
        this.rows = Math.ceil(this.canvas.height / this.pixelScale);
    }

    /**
     * 简易 2D value noise
     */
    private noise2D(x: number, y: number): number {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        // Fade curves
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const aa = this.perm[this.perm[xi] + yi];
        const ab = this.perm[this.perm[xi] + yi + 1];
        const ba = this.perm[this.perm[xi + 1] + yi];
        const bb = this.perm[this.perm[xi + 1] + yi + 1];

        const x1 = aa / 255 + u * (ba / 255 - aa / 255);
        const x2 = ab / 255 + u * (bb / 255 - ab / 255);

        return x1 + v * (x2 - x1);
    }

    private animate = (): void => {
        if (this.destroyed) return;

        this.time += 0.003; // 极慢移动
        this.drawFog();

        // 低帧率：约 8fps
        setTimeout(() => {
            this.animationId = requestAnimationFrame(this.animate);
        }, 120);
    };

    private drawFog(): void {
        const ctx = this.ctx;
        if (!ctx || !this.canvas) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const ps = this.pixelScale;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const nx = c * 0.04;
                const ny = r * 0.04;

                // 两层雾：墨绿 + 暗紫，不同频率和偏移
                const n1 = this.noise2D(nx + this.time * 0.8, ny + this.time * 0.3);
                const n2 = this.noise2D(nx * 1.5 + 100 + this.time * 0.5, ny * 1.5 + 100 - this.time * 0.2);

                // 墨绿层 (#0a1a0f)
                const alpha1 = Math.max(0, n1 * 0.35 - 0.08);
                if (alpha1 > 0.01) {
                    ctx.fillStyle = `rgba(10, 26, 15, ${alpha1.toFixed(3)})`;
                    ctx.fillRect(c * ps, r * ps, ps, ps);
                }

                // 暗紫层 (#1a0a1f)
                const alpha2 = Math.max(0, n2 * 0.25 - 0.06);
                if (alpha2 > 0.01) {
                    ctx.fillStyle = `rgba(26, 10, 31, ${alpha2.toFixed(3)})`;
                    ctx.fillRect(c * ps, r * ps, ps, ps);
                }
            }
        }
    }

    public destroy(): void {
        this.destroyed = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        window.removeEventListener('resize', this._onResize);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
    }
}
