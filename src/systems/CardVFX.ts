import * as PIXI from 'pixi.js';

/**
 * CardVFX — 卡牌视觉特效系统
 *
 * 在 PixiJS 的 effectLayer 上绘制各类卡牌使用特效。
 * 所有特效都是自驱动的（通过 PIXI.Ticker），播放完毕后自动清理。
 */

// ============================
// 通用粒子
// ============================

interface Particle {
    g: PIXI.Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    gravity?: number;
    fadeOut?: boolean;
    shrink?: boolean;
}

function spawnParticles(
    layer: PIXI.Container,
    ticker: PIXI.Ticker,
    x: number, y: number,
    count: number,
    color: number,
    opts: {
        speedMin?: number; speedMax?: number;
        sizeMin?: number; sizeMax?: number;
        life?: number; gravity?: number;
        spread?: number; // 角度范围 (radians)
        angle?: number;  // 中心角度
        alpha?: number;
        fadeOut?: boolean;
        shrink?: boolean;
    } = {}
): void {
    const {
        speedMin = 1, speedMax = 3,
        sizeMin = 2, sizeMax = 4,
        life = 30, gravity = 0,
        spread = Math.PI * 2, angle = 0,
        alpha = 0.8, fadeOut = true, shrink = false,
    } = opts;

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
        const size = sizeMin + Math.random() * (sizeMax - sizeMin);
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const dir = angle - spread / 2 + Math.random() * spread;

        const g = new PIXI.Graphics();
        g.beginFill(color, alpha);
        g.drawRect(-size / 2, -size / 2, size, size);
        g.endFill();
        g.x = x + (Math.random() - 0.5) * 6;
        g.y = y + (Math.random() - 0.5) * 6;

        layer.addChild(g);
        particles.push({
            g,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed,
            life: life + Math.floor(Math.random() * 10),
            maxLife: life + 10,
            gravity,
            fadeOut,
            shrink,
        });
    }

    const onTick = () => {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.g.x += p.vx;
            p.g.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life--;
            const progress = 1 - p.life / p.maxLife;
            if (p.fadeOut) p.g.alpha = 1 - progress;
            if (p.shrink) p.g.scale.set(1 - progress * 0.8);
            if (p.life <= 0) {
                if (p.g.parent) p.g.parent.removeChild(p.g);
                particles.splice(i, 1);
            }
        }
        if (particles.length === 0) {
            ticker.remove(onTick);
        }
    };
    ticker.add(onTick);
}

// ============================
// 斩击效果（近战攻击）
// ============================
export function vfxSlash(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    // 弧形斩击线
    const slash = new PIXI.Graphics();
    slash.lineStyle(3, 0xff4444, 0.9);
    slash.arc(x, y, 20, -Math.PI * 0.6, Math.PI * 0.3, false);
    layer.addChild(slash);

    // 火花粒子
    spawnParticles(layer, ticker, x, y, 8, 0xff6633, {
        speedMin: 2, speedMax: 5, life: 15,
        spread: Math.PI * 0.8, angle: -Math.PI * 0.2,
        sizeMin: 2, sizeMax: 4,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        slash.alpha = 1 - elapsed / 12;
        slash.scale.set(1 + elapsed * 0.03);
        if (elapsed >= 12) {
            ticker.remove(onTick);
            if (slash.parent) slash.parent.removeChild(slash);
        }
    };
    ticker.add(onTick);
}

// ============================
// 远程射击效果（投射物飞行）
// ============================
export function vfxProjectile(
    layer: PIXI.Container, ticker: PIXI.Ticker,
    fromX: number, fromY: number, toX: number, toY: number,
    color: number = 0x9966ff
): void {
    const projectile = new PIXI.Graphics();
    projectile.beginFill(color, 0.9);
    projectile.drawCircle(0, 0, 4);
    projectile.endFill();
    // 拖尾光晕
    const glow = new PIXI.Graphics();
    glow.beginFill(color, 0.3);
    glow.drawCircle(0, 0, 8);
    glow.endFill();

    projectile.x = fromX;
    projectile.y = fromY;
    glow.x = fromX;
    glow.y = fromY;
    layer.addChild(glow);
    layer.addChild(projectile);

    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.max(dist / 15, 4);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    let elapsed = 0;
    const maxFrames = Math.ceil(dist / speed) + 5;

    const onTick = () => {
        elapsed++;
        projectile.x += vx;
        projectile.y += vy;
        glow.x = projectile.x;
        glow.y = projectile.y;

        // 拖尾粒子
        if (elapsed % 2 === 0) {
            spawnParticles(layer, ticker, projectile.x, projectile.y, 1, color, {
                speedMin: 0.3, speedMax: 0.8, life: 8,
                sizeMin: 1, sizeMax: 3, alpha: 0.5,
            });
        }

        if (elapsed >= maxFrames) {
            ticker.remove(onTick);
            if (projectile.parent) projectile.parent.removeChild(projectile);
            if (glow.parent) glow.parent.removeChild(glow);
            // 落点爆炸
            spawnParticles(layer, ticker, toX, toY, 10, color, {
                speedMin: 1, speedMax: 4, life: 12,
                sizeMin: 2, sizeMax: 5,
            });
        }
    };
    ticker.add(onTick);
}

// ============================
// 护盾效果（格挡）
// ============================
export function vfxShield(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const shield = new PIXI.Graphics();
    shield.lineStyle(2, 0x4488ff, 0.8);
    shield.beginFill(0x4488ff, 0.15);
    shield.drawCircle(0, 0, 22);
    shield.endFill();
    shield.x = x;
    shield.y = y;
    layer.addChild(shield);

    spawnParticles(layer, ticker, x, y, 6, 0x66aaff, {
        speedMin: 0.5, speedMax: 1.5, life: 20,
        spread: Math.PI * 2, sizeMin: 2, sizeMax: 3, alpha: 0.6,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        shield.scale.set(1 + elapsed * 0.02);
        shield.alpha = 0.8 - (elapsed / 25);
        if (elapsed >= 25) {
            ticker.remove(onTick);
            if (shield.parent) shield.parent.removeChild(shield);
        }
    };
    ticker.add(onTick);
}

// ============================
// 治疗效果（绿色上升光点）
// ============================
export function vfxHeal(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    spawnParticles(layer, ticker, x, y, 12, 0x00ff66, {
        speedMin: 0.5, speedMax: 2, life: 30,
        spread: Math.PI * 0.6, angle: -Math.PI / 2, // 往上
        sizeMin: 2, sizeMax: 4, gravity: -0.05, alpha: 0.7,
    });

    // 十字符号
    const cross = new PIXI.Graphics();
    cross.beginFill(0x00ff66, 0.8);
    cross.drawRect(-1, -6, 3, 12);
    cross.drawRect(-6, -1, 12, 3);
    cross.endFill();
    cross.x = x;
    cross.y = y;
    layer.addChild(cross);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        cross.y -= 0.8;
        cross.alpha = 1 - elapsed / 25;
        if (elapsed >= 25) {
            ticker.remove(onTick);
            if (cross.parent) cross.parent.removeChild(cross);
        }
    };
    ticker.add(onTick);
}

// ============================
// AOE 爆炸效果
// ============================
export function vfxAOE(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    // 冲击波环
    const ring = new PIXI.Graphics();
    ring.lineStyle(3, 0xff3333, 0.9);
    ring.drawCircle(0, 0, 5);
    ring.x = x;
    ring.y = y;
    layer.addChild(ring);

    // 碎片粒子
    spawnParticles(layer, ticker, x, y, 20, 0xff4444, {
        speedMin: 2, speedMax: 6, life: 20,
        sizeMin: 2, sizeMax: 5, alpha: 0.8,
    });
    spawnParticles(layer, ticker, x, y, 8, 0xffaa00, {
        speedMin: 1, speedMax: 3, life: 15,
        sizeMin: 1, sizeMax: 3, alpha: 0.6,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        const scale = 1 + elapsed * 0.15;
        ring.scale.set(scale);
        ring.alpha = 1 - elapsed / 18;
        if (elapsed >= 18) {
            ticker.remove(onTick);
            if (ring.parent) ring.parent.removeChild(ring);
        }
    };
    ticker.add(onTick);
}

// ============================
// 自伤效果（暗红色内爆）
// ============================
export function vfxSelfDamage(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    spawnParticles(layer, ticker, x, y, 8, 0x880000, {
        speedMin: 0.5, speedMax: 2, life: 18,
        sizeMin: 2, sizeMax: 4, alpha: 0.7,
    });

    const flash = new PIXI.Graphics();
    flash.beginFill(0xff0000, 0.3);
    flash.drawCircle(0, 0, 18);
    flash.endFill();
    flash.x = x;
    flash.y = y;
    layer.addChild(flash);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        flash.alpha = 0.3 * (1 - elapsed / 10);
        if (elapsed >= 10) {
            ticker.remove(onTick);
            if (flash.parent) flash.parent.removeChild(flash);
        }
    };
    ticker.add(onTick);
}

// ============================
// Buff 效果（金色光环上升）
// ============================
export function vfxBuff(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number, color: number = 0xffd700): void {
    spawnParticles(layer, ticker, x, y, 10, color, {
        speedMin: 0.3, speedMax: 1.5, life: 25,
        spread: Math.PI * 2, sizeMin: 2, sizeMax: 3,
        alpha: 0.7, gravity: -0.03,
    });

    const aura = new PIXI.Graphics();
    aura.lineStyle(2, color, 0.6);
    aura.drawCircle(0, 0, 16);
    aura.x = x;
    aura.y = y;
    layer.addChild(aura);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        aura.scale.set(1 + elapsed * 0.03);
        aura.alpha = 0.6 - elapsed / 30;
        if (elapsed >= 20) {
            ticker.remove(onTick);
            if (aura.parent) aura.parent.removeChild(aura);
        }
    };
    ticker.add(onTick);
}

// ============================
// 能量获取效果（蓝色脉冲）
// ============================
export function vfxEnergy(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    spawnParticles(layer, ticker, x, y, 6, 0x6666ff, {
        speedMin: 0.5, speedMax: 2, life: 20,
        spread: Math.PI * 2, sizeMin: 2, sizeMax: 4, alpha: 0.6,
    });

    const pulse = new PIXI.Graphics();
    pulse.beginFill(0x6666ff, 0.2);
    pulse.drawCircle(0, 0, 12);
    pulse.endFill();
    pulse.x = x;
    pulse.y = y;
    layer.addChild(pulse);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        pulse.scale.set(1 + elapsed * 0.04);
        pulse.alpha = 0.2 * (1 - elapsed / 15);
        if (elapsed >= 15) {
            ticker.remove(onTick);
            if (pulse.parent) pulse.parent.removeChild(pulse);
        }
    };
    ticker.add(onTick);
}

// ============================
// 理智消耗效果（紫色漩涡）
// ============================
export function vfxSanity(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number, isLoss: boolean): void {
    const color = isLoss ? 0x9b30ff : 0x00ff88;
    spawnParticles(layer, ticker, x, y, 8, color, {
        speedMin: 0.3, speedMax: 1.5, life: 22,
        spread: Math.PI * 2, sizeMin: 2, sizeMax: 3,
        alpha: 0.6, gravity: isLoss ? 0.02 : -0.03,
    });
}

// ============================
// 抽牌效果（白色卡片飞入）
// ============================
export function vfxDraw(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
        const card = new PIXI.Graphics();
        card.beginFill(0xffffff, 0.7);
        card.drawRoundedRect(-3, -5, 6, 10, 1);
        card.endFill();
        card.x = x - 30 + i * 10;
        card.y = y + 40;
        layer.addChild(card);

        const targetX = x - 10 + i * 10;
        const targetY = y;
        const dx = targetX - card.x;
        const dy = targetY - card.y;
        let elapsed = 0;

        const onTick = () => {
            elapsed++;
            const t = elapsed / 15;
            card.x += dx / 15;
            card.y += dy / 15;
            card.alpha = t < 0.5 ? t * 2 : 2 - t * 2;
            card.rotation = (1 - t) * 0.3;
            if (elapsed >= 15) {
                ticker.remove(onTick);
                if (card.parent) card.parent.removeChild(card);
            }
        };
        // 延迟每张卡
        setTimeout(() => ticker.add(onTick), i * 80);
    }
}

// ============================
// 标记效果（黄色十字标记）
// ============================
export function vfxMark(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const mark = new PIXI.Graphics();
    mark.lineStyle(2, 0xffd700, 0.9);
    // X形标记
    mark.moveTo(-10, -10); mark.lineTo(10, 10);
    mark.moveTo(10, -10); mark.lineTo(-10, 10);
    // 外圈
    mark.drawCircle(0, 0, 14);
    mark.x = x;
    mark.y = y;
    layer.addChild(mark);

    spawnParticles(layer, ticker, x, y, 6, 0xffd700, {
        speedMin: 0.5, speedMax: 1.5, life: 18,
        sizeMin: 2, sizeMax: 3, alpha: 0.6,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        mark.alpha = 1 - elapsed / 25;
        mark.rotation += 0.05;
        if (elapsed >= 25) {
            ticker.remove(onTick);
            if (mark.parent) mark.parent.removeChild(mark);
        }
    };
    ticker.add(onTick);
}

// ============================
// 移动力效果（绿色速度线）
// ============================
export function vfxMovement(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
        const line = new PIXI.Graphics();
        line.beginFill(0x00ff88, 0.7);
        line.drawRect(0, -1, 12 + Math.random() * 8, 2);
        line.endFill();
        line.x = x - 15;
        line.y = y - 8 + i * 5;
        layer.addChild(line);

        let elapsed = 0;
        const onTick = () => {
            elapsed++;
            line.x += 2;
            line.alpha = 1 - elapsed / 12;
            if (elapsed >= 12) {
                ticker.remove(onTick);
                if (line.parent) line.parent.removeChild(line);
            }
        };
        setTimeout(() => ticker.add(onTick), i * 40);
    }
}

// ============================
// 传送效果（紫色闪烁消失+出现）
// ============================
export function vfxTeleport(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    // 消失粒子
    spawnParticles(layer, ticker, x, y, 15, 0x9966ff, {
        speedMin: 1, speedMax: 4, life: 20,
        sizeMin: 2, sizeMax: 5, alpha: 0.8,
    });

    // 出现闪光
    const flash = new PIXI.Graphics();
    flash.beginFill(0xffffff, 0.6);
    flash.drawCircle(0, 0, 25);
    flash.endFill();
    flash.x = x;
    flash.y = y;
    layer.addChild(flash);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        flash.scale.set(1 - elapsed / 10);
        flash.alpha = 0.6 - elapsed / 15;
        if (elapsed >= 10) {
            ticker.remove(onTick);
            if (flash.parent) flash.parent.removeChild(flash);
        }
    };
    ticker.add(onTick);
}

// ============================
// 反弹/反伤效果（蓝色锯齿盾）
// ============================
export function vfxReflect(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const reflect = new PIXI.Graphics();
    reflect.lineStyle(2, 0x4488ff, 0.8);
    // 锯齿盾
    const pts = 8;
    for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const r = i % 2 === 0 ? 18 : 12;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) reflect.moveTo(px, py);
        else reflect.lineTo(px, py);
    }
    reflect.closePath();
    reflect.x = x;
    reflect.y = y;
    layer.addChild(reflect);

    spawnParticles(layer, ticker, x, y, 5, 0x66aaff, {
        speedMin: 1, speedMax: 2.5, life: 15,
        sizeMin: 2, sizeMax: 3, alpha: 0.5,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        reflect.alpha = 1 - elapsed / 20;
        reflect.rotation += 0.08;
        reflect.scale.set(1 + elapsed * 0.02);
        if (elapsed >= 20) {
            ticker.remove(onTick);
            if (reflect.parent) reflect.parent.removeChild(reflect);
        }
    };
    ticker.add(onTick);
}

// ============================
// 吸血效果（红色粒子飞回玩家）
// ============================
export function vfxVampiric(
    layer: PIXI.Container, ticker: PIXI.Ticker,
    fromX: number, fromY: number, toX: number, toY: number
): void {
    for (let i = 0; i < 6; i++) {
        const p = new PIXI.Graphics();
        p.beginFill(0xff2222, 0.8);
        p.drawCircle(0, 0, 2 + Math.random() * 2);
        p.endFill();
        p.x = fromX + (Math.random() - 0.5) * 20;
        p.y = fromY + (Math.random() - 0.5) * 20;
        layer.addChild(p);

        const dx = toX - p.x;
        const dy = toY - p.y;
        let elapsed = 0;
        const duration = 20 + i * 3;

        const onTick = () => {
            elapsed++;
            p.x += dx / duration;
            p.y += dy / duration;
            p.alpha = elapsed < duration * 0.7 ? 0.8 : 0.8 * (1 - (elapsed - duration * 0.7) / (duration * 0.3));
            if (elapsed >= duration) {
                ticker.remove(onTick);
                if (p.parent) p.parent.removeChild(p);
            }
        };
        setTimeout(() => ticker.add(onTick), i * 50);
    }
}

// ============================
// DOT/中毒效果（绿色冒泡）
// ============================
export function vfxPoison(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    spawnParticles(layer, ticker, x, y, 6, 0x00cc44, {
        speedMin: 0.3, speedMax: 1, life: 25,
        spread: Math.PI * 0.4, angle: -Math.PI / 2,
        sizeMin: 2, sizeMax: 4, alpha: 0.6, gravity: -0.04,
    });
}

// ============================
// 嘲讽效果（红色感叹号）
// ============================
export function vfxTaunt(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const excl = new PIXI.Graphics();
    excl.beginFill(0xff4444, 0.9);
    excl.drawRect(-2, -12, 4, 16);
    excl.drawCircle(0, 9, 2);
    excl.endFill();
    excl.x = x;
    excl.y = y - 10;
    layer.addChild(excl);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        excl.y -= 0.5;
        excl.alpha = 1 - elapsed / 25;
        excl.scale.set(1 + Math.sin(elapsed * 0.3) * 0.1);
        if (elapsed >= 25) {
            ticker.remove(onTick);
            if (excl.parent) excl.parent.removeChild(excl);
        }
    };
    ticker.add(onTick);
}

// ============================
// 穿甲效果（白色贯穿线）
// ============================
export function vfxPiercing(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const pierce = new PIXI.Graphics();
    pierce.lineStyle(3, 0xffffff, 0.9);
    pierce.moveTo(-20, 0);
    pierce.lineTo(20, 0);
    pierce.x = x;
    pierce.y = y;
    layer.addChild(pierce);

    spawnParticles(layer, ticker, x, y, 6, 0xffffff, {
        speedMin: 2, speedMax: 5, life: 10,
        spread: Math.PI * 0.3, angle: 0,
        sizeMin: 1, sizeMax: 3, alpha: 0.7,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        pierce.alpha = 1 - elapsed / 10;
        pierce.scale.x = 1 + elapsed * 0.05;
        if (elapsed >= 10) {
            ticker.remove(onTick);
            if (pierce.parent) pierce.parent.removeChild(pierce);
        }
    };
    ticker.add(onTick);
}

// ============================
// 疯狂漩涡消耗效果（紫色螺旋）
// ============================
export function vfxMadnessVortex(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    spawnParticles(layer, ticker, x, y, 15, 0x9b30ff, {
        speedMin: 1, speedMax: 4, life: 25,
        sizeMin: 2, sizeMax: 5, alpha: 0.7,
    });
    spawnParticles(layer, ticker, x, y, 8, 0xff00ff, {
        speedMin: 0.5, speedMax: 2, life: 20,
        sizeMin: 1, sizeMax: 3, alpha: 0.5,
    });

    const vortex = new PIXI.Graphics();
    vortex.lineStyle(2, 0x9b30ff, 0.7);
    vortex.arc(0, 0, 15, 0, Math.PI * 1.5);
    vortex.x = x;
    vortex.y = y;
    layer.addChild(vortex);

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        vortex.rotation += 0.15;
        vortex.scale.set(1 + elapsed * 0.04);
        vortex.alpha = 0.7 - elapsed / 25;
        if (elapsed >= 20) {
            ticker.remove(onTick);
            if (vortex.parent) vortex.parent.removeChild(vortex);
        }
    };
    ticker.add(onTick);
}

// ============================
// 地形放置效果（扩散波纹）
// ============================
export function vfxTerrainPlace(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number, color: number = 0x9b30ff): void {
    const ring = new PIXI.Graphics();
    ring.lineStyle(2, color, 0.7);
    ring.drawCircle(0, 0, 8);
    ring.x = x;
    ring.y = y;
    layer.addChild(ring);

    spawnParticles(layer, ticker, x, y, 8, color, {
        speedMin: 0.5, speedMax: 2, life: 18,
        sizeMin: 2, sizeMax: 4, alpha: 0.5,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        ring.scale.set(1 + elapsed * 0.08);
        ring.alpha = 0.7 - elapsed / 20;
        if (elapsed >= 18) {
            ticker.remove(onTick);
            if (ring.parent) ring.parent.removeChild(ring);
        }
    };
    ticker.add(onTick);
}

// ============================
// Debuff效果（暗色下坠箭头）
// ============================
export function vfxDebuff(layer: PIXI.Container, ticker: PIXI.Ticker, x: number, y: number): void {
    const arrow = new PIXI.Graphics();
    arrow.beginFill(0x8844aa, 0.8);
    arrow.moveTo(0, 8);
    arrow.lineTo(-5, -2);
    arrow.lineTo(5, -2);
    arrow.closePath();
    arrow.endFill();
    arrow.x = x;
    arrow.y = y - 15;
    layer.addChild(arrow);

    spawnParticles(layer, ticker, x, y, 5, 0x6633aa, {
        speedMin: 0.3, speedMax: 1, life: 15,
        spread: Math.PI * 0.4, angle: Math.PI / 2,
        sizeMin: 2, sizeMax: 3, alpha: 0.5,
    });

    let elapsed = 0;
    const onTick = () => {
        elapsed++;
        arrow.y += 1;
        arrow.alpha = 1 - elapsed / 18;
        if (elapsed >= 18) {
            ticker.remove(onTick);
            if (arrow.parent) arrow.parent.removeChild(arrow);
        }
    };
    ticker.add(onTick);
}
