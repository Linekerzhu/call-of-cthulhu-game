import Utils from '../core/Utils.ts';
import StatusEffectSystem from './StatusEffectSystem.ts';
import CardEvolutionEngine from './CardEvolutionEngine.ts';
import { getPhysicalDamageBonus, getMagicDamageBonus } from './AttributeEngine.ts';
import type Game from '../core/Game.ts';
import * as VFX from './CardVFX.ts';

/** 获取 PixiRenderer 的 VFX 上下文（layer + ticker） */
function getVFX(ctx: any): { layer: any; ticker: any } | null {
    return ctx.game.renderSystem?.combatRenderer?.pixiRenderer?.getVFXContext?.() || null;
}
/** 获取网格坐标对应的像素坐标 */
function cellPx(ctx: any, row: number, col: number): { x: number; y: number } {
    return ctx.game.renderSystem?.combatRenderer?.pixiRenderer?.cellToPixel?.(row, col) || { x: 0, y: 0 };
}
/**
 * CardEffectEngine - 数据驱动的卡牌效果处理器
 */
const CardEffectEngine = {
    executeEffects(card: any, context: any): void {
        const effects = card.effects;
        if (!effects || effects.length === 0) {
            return;
        }

        for (let i = 0; i < effects.length; i++) {
            const effect = effects[i];
            const handler = (CardEffectEngine.handlers as any)[effect.type];
            if (handler) {
                handler(effect, context);
            } else {
            }
        }
    },

    handlers: {
        gainBlock(effect: any, ctx: any) {
            const canGainBlock = ctx.game.getSanityEffect('canGainBlock');
            if (canGainBlock === false) {
                ctx.game.log('🌀 精神崩溃！无法构筑理智屏障！');
                return;
            }
            const amount = effect.value;
            ctx.game.modifyBlock(amount);
            ctx.game.log(`获得${amount}点格挡！`);
            ctx.game.eventBus.emit('combat:block');
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxShield(v.layer, v.ticker, p.x, p.y); }
            if (ctx.player.badge === '旧日支配者') {
                if (!ctx.combat.blockGainedThisTurn) ctx.combat.blockGainedThisTurn = 0;
                ctx.combat.blockGainedThisTurn += amount;
            }
        },

        gainMovement(effect: any, ctx: any) {
            const gain = effect.value;
            ctx.game.modifyMovement(gain);
            ctx.game.log(`恢复${gain}点移动力！`);
            ctx.game.renderSystem?.showPassiveEffect(`⚡ +${gain}移动力`, '🏃');
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxMovement(v.layer, v.ticker, p.x, p.y); }
        },

        heal(effect: any, ctx: any) {
            const amount = effect.value;
            ctx.game.modifyHP(amount);
            ctx.game.log(`恢复了${amount}点生命！`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxHeal(v.layer, v.ticker, p.x, p.y); }
        },

        gainEnergy(effect: any, ctx: any) {
            ctx.game.modifyEnergy(effect.value);
            ctx.game.log(`获得${effect.value}点能量！`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxEnergy(v.layer, v.ticker, p.x, p.y); }
        },

        attackBuff(effect: any, ctx: any) {
            const bonus = effect.value;
            // 使用 buffManager 临时加成，避免永久修改卡牌 effect.value
            ctx.game.buffManager.apply('attackBonus', { value: bonus, duration: 1 });
            ctx.game.log(`🐙 触手蔓延！本回合所有攻击 +${bonus} 伤害！`);
            ctx.game.renderSystem?.showPassiveEffect(`攻击 +${bonus}`, '🐙');
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxBuff(v.layer, v.ticker, p.x, p.y, 0xff6600); }
            ctx.game.renderSystem?.renderHand();
        },

        drawCards(effect: any, ctx: any) {
            ctx.game.combatSystem.drawCards(effect.value);
            ctx.game.log(`抽取了${effect.value}张卡牌！`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxDraw(v.layer, v.ticker, p.x, p.y); }
        },

        selfDamage(effect: any, ctx: any) {
            const damage = effect.value;
            ctx.game.modifyHP(-damage);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxSelfDamage(v.layer, v.ticker, p.x, p.y); }
            if (effect._mutated) {
                ctx.game.log(`🌀 扭曲的力量反噬！受到${damage}点伤害！`);
                ctx.game.renderSystem?.showPassiveEffect(`🌀 自伤 ${damage}`, '💀');
            } else {
                ctx.game.log(`失去${damage}点HP！`);
            }

            // 自伤致死检查
            if (ctx.player.hp <= 0) {
                ctx.game.log('💀 你被自己的力量吞噬了...');
                setTimeout(() => { ctx.game.gameOver(false); }, 1000);
            }
        },

        aoe(effect: any, ctx: any) {
            const aoeDamage = effect.value;
            let hitCount = 0;
            for (let i = 0; i < ctx.combat.enemies.length; i++) {
                const enemy = ctx.combat.enemies[i];
                if (enemy.hp > 0) {
                    enemy.hp -= aoeDamage;
                    hitCount++;
                    ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, aoeDamage);
                    if (enemy.hp <= 0 && !enemy._dead) {
                        enemy.hp = 0;
                        enemy._dead = true;
                        ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                        ctx.game.log(`${enemy.name}被击杀！`);
                        ctx.game.modifySanity(1);
                    }
                }
            }
            ctx.game.log(`对${hitCount}个敌人造成${aoeDamage}点伤害！`);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxAOE(v.layer, v.ticker, p.x, p.y); }
        },

        sanityCost(effect: any, ctx: any) {
            const loss = effect.value;
            ctx.game.modifySanity(-loss);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxSanity(v.layer, v.ticker, p.x, p.y, true); }
            if (effect._mutated) {
                ctx.game.log(`🌀 扭曲！理智消散 -${loss}`);
                ctx.game.renderSystem?.showPassiveEffect(`🌀 理智 -${loss}`, '🧠');
            } else {
                ctx.game.log(`🧠 消耗${loss}点理智值！`);
            }
        },

        sanityRestore(effect: any, ctx: any) {
            const gain = effect.value;
            ctx.game.modifySanity(gain);
            ctx.game.log(`🧠 恢复${gain}点理智！`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxSanity(v.layer, v.ticker, p.x, p.y, false); }
        },

        targetDamage(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;

            let damage = effect.value;
            const attackBonus = ctx.game.buffManager.getValue('attackBonus');
            if (attackBonus > 0) damage += attackBonus;

            // === 力量调整值加成（物理伤害） ===
            const strengthBonus = getPhysicalDamageBonus(ctx.player);
            if (strengthBonus !== 0) {
                damage += strengthBonus;
                if (strengthBonus > 0) ctx.game.log(`💪 力量加成 +${strengthBonus}`);
                else ctx.game.log(`💪 力量衰弱 ${strengthBonus}`);
            }

            const damageMultiplier = ctx.game.getSanityEffect('damageMultiplier') || 1;
            damage = Math.floor(damage * damageMultiplier);

            if (ctx.player.badge === '深渊使者' && ctx.combat.madnessDoubler && ctx.combat.madnessDoubler > 0) {
                damage = damage * 2;
                ctx.combat.madnessDoubler = 0;
                ctx.game.log('🐙 疯狂爆发！伤害翻倍！');
                ctx.game.renderSystem?.showPassiveEffect('💥 伤害翻倍！', '🐙');
            }

            if (ctx.combat.markedEnemies) {
                const markKey = `${enemy.position.row},${enemy.position.col}`;
                if (ctx.combat.markedEnemies[markKey] && ctx.combat.markedEnemies[markKey] > 0) {
                    damage = damage * 2;
                    ctx.combat.markedEnemies[markKey]--;
                    ctx.game.log('🎭 黄衣之王的印记触发！伤害翻倍！');
                    ctx.game.renderSystem?.showPassiveEffect('🎭 印记触发！', '🎭');
                    if (ctx.combat.markedEnemies[markKey] <= 0) {
                        delete ctx.combat.markedEnemies[markKey];
                    }
                }
            }

            let actualDamage = damage;
            if (enemy.block && enemy.block > 0) {
                if (enemy.block >= damage) {
                    enemy.block -= damage;
                    actualDamage = 0;
                } else {
                    actualDamage = damage - enemy.block;
                    enemy.block = 0;
                }
            }

            enemy.hp -= actualDamage;
            ctx.game.modifySanity(-2);
            ctx.game.log('🧠 攻击消耗2点理智');

            if (ctx.player.badge === '深渊使者') {
                if (!ctx.combat.madness) ctx.combat.madness = 0;
                ctx.combat.madness += actualDamage;
                ctx.game.log(`🐙 疯狂值+${actualDamage} (当前:${ctx.combat.madness})`);
                if (ctx.combat.madness >= 10) {
                    ctx.combat.madness = 0;
                    ctx.combat.madnessDoubler = 1;
                    ctx.game.log('🐙 疯狂已满！下次攻击翻倍！');
                    ctx.game.renderSystem?.showPassiveEffect('🔥 疯狂已满！', '🐙');
                }
            }

            ctx.game.eventBus.emit('combat:attack');
            ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, actualDamage);
            ctx.game.renderSystem?.renderEnemyPanel();
            ctx.game.log(`对${enemy.name}造成${actualDamage}点伤害！`);
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxSlash(v.layer, v.ticker, ep.x, ep.y); }

            if (enemy.hp <= 0) {
                enemy.hp = 0;
                if (!enemy._dead) {
                    enemy._dead = true;
                    ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                    ctx.game.log(`${enemy.name}被击败了！`);
                    ctx.game.modifySanity(1);
                    ctx.game.log('🧠 击败敌人恢复1点理智');
                }
            }
        },

        markEnemy(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            if (!ctx.combat.markedEnemies) ctx.combat.markedEnemies = {};
            ctx.combat.markedEnemies[`${enemy.position.row},${enemy.position.col}`] = effect.value;
            ctx.game.log(`🎭 ${enemy.name}被标记，下${effect.value}次伤害翻倍！`);
            ctx.game.renderSystem?.showPassiveEffect('🎭 标记！', enemy.icon);
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxMark(v.layer, v.ticker, ep.x, ep.y); }
        },

        consumeMadness(effect: any, ctx: any) {
            const madness = ctx.combat.madness || 0;
            if (madness <= 0) {
                ctx.game.log('🌀 疯狂漩涡！但没有疯狂值...');
                return;
            }
            const multiplier = effect.multiplier || 1;
            const aoeDamage = Math.floor(madness * multiplier);
            ctx.combat.madness = 0;
            let hitCount = 0;
            for (let i = 0; i < ctx.combat.enemies.length; i++) {
                const enemy = ctx.combat.enemies[i];
                if (enemy.hp > 0) {
                    enemy.hp -= aoeDamage;
                    hitCount++;
                    ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, aoeDamage);
                    if (enemy.hp <= 0 && !enemy._dead) {
                        enemy.hp = 0;
                        enemy._dead = true;
                        ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                        ctx.game.log(`${enemy.name}被疯狂漩涡吞噬！`);
                    }
                }
            }
            ctx.game.log(`🌀 消耗${madness}点疯狂值，对${hitCount}个敌人造成${aoeDamage}点伤害！`);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxMadnessVortex(v.layer, v.ticker, p.x, p.y); }
        },

        zeroCostAttacks(effect: any, ctx: any) {
            ctx.game.buffManager.apply('zeroCostAttacks', { value: 1, duration: 1 });
            ctx.game.log('本回合所有攻击卡费用变为0！');
        },

        reflect(effect: any, ctx: any) {
            ctx.game.buffManager.apply('reflect', { value: effect.value, duration: 1 });
            ctx.game.log(`被攻击时反弹${effect.value}点伤害！`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxReflect(v.layer, v.ticker, p.x, p.y); }
        },

        drawOnCombo(effect: any, ctx: any) {
            const playedCount = ctx.combat.turnPlayedCards || 0;
            if (playedCount >= effect.threshold) {
                ctx.game.combatSystem.drawCards(effect.draw);
                ctx.game.log(`连击！抽${effect.draw}张卡！`);
            }
        },

        taunt(effect: any, ctx: any) {
            ctx.game.buffManager.apply('taunt', { value: 1, duration: 1 });
            ctx.game.log('🎯 献祭诱饵！下回合敌人必定攻击你！');
            ctx.game.renderSystem?.showPassiveEffect('🎯 嘲讽！', '🎭');
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxTaunt(v.layer, v.ticker, p.x, p.y); }
        },

        blockToAttack(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            let damage = ctx.player.block;
            if (effect.multiplier) {
                damage = Math.floor(damage * effect.multiplier);
            }
            if (damage <= 0) {
                ctx.game.log('符文反击！但没有格挡值...');
                return;
            }
            ctx.game.log(`符文反击！使用格挡造成${damage}点伤害！`);
            ctx.game.modifyBlock(-ctx.player.block); 

            enemy.hp -= damage;
            ctx.game.modifySanity(-2);
            ctx.game.eventBus.emit('combat:attack');

            ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, damage);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxSlash(v.layer, v.ticker, ep.x, ep.y); }

            if (enemy.hp <= 0) {
                enemy.hp = 0;
                if (!enemy._dead) {
                    enemy._dead = true;
                    ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                    ctx.game.log(`${enemy.name}被击败了！`);
                    ctx.game.modifySanity(1);
                }
            }
        },

        // ==================== 新增效果类型 ====================

        rangedDamage(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            let damage = effect.value;
            const attackBonus = ctx.game.buffManager.getValue('attackBonus');
            if (attackBonus > 0) damage += attackBonus;

            // === 力量调整值加成（远程物理伤害） ===
            const strengthBonus = getPhysicalDamageBonus(ctx.player);
            if (strengthBonus !== 0) damage += strengthBonus;

            let actualDamage = damage;
            if (enemy.block && enemy.block > 0) {
                if (enemy.block >= damage) { enemy.block -= damage; actualDamage = 0; }
                else { actualDamage = damage - enemy.block; enemy.block = 0; }
            }
            enemy.hp -= actualDamage;
            ctx.game.modifySanity(-2);
            ctx.game.log('🧠 远程攻击消耗2点理智');
            ctx.game.eventBus.emit('combat:attack');
            ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, actualDamage);
            ctx.game.renderSystem?.renderEnemyPanel();
            ctx.game.log(`远程攻击对${enemy.name}造成${actualDamage}点伤害！`);
            const v = getVFX(ctx); if (v) { const pp = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxProjectile(v.layer, v.ticker, pp.x, pp.y, ep.x, ep.y, 0x9966ff); }
            if (enemy.hp <= 0 && !enemy._dead) {
                enemy.hp = 0; enemy._dead = true;
                ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                ctx.game.log(`${enemy.name}被击败了！`);
                ctx.game.modifySanity(1);
            }
        },

        dot(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            StatusEffectSystem.apply(enemy, {
                id: effect.dotType || 'poison',
                name: effect.dotName || '中毒',
                type: 'dot',
                value: effect.dotDamage || effect.value || 2,
                duration: effect.duration || 3,
                icon: effect.dotType === 'burn' ? '🔥' : '☠️',
                stackable: true
            });
            ctx.game.log(`${enemy.name}被施加了${effect.dotName || '中毒'}！(${effect.dotDamage || effect.value}×${effect.duration}回合)`);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxPoison(v.layer, v.ticker, ep.x, ep.y); }
        },

        debuff(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            StatusEffectSystem.apply(enemy, {
                id: `weaken_${effect.stat}`,
                name: `${effect.stat}削弱`,
                type: 'debuff',
                value: effect.value,
                duration: effect.duration || 2,
                icon: '⬇️'
            });
            ctx.game.log(`${enemy.name}的${effect.stat}被削弱了！(-${effect.value}，${effect.duration}回合)`);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxDebuff(v.layer, v.ticker, ep.x, ep.y); }
        },

        pushBack(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            const player = ctx.player;
            const pushDist = effect.value || 1;
            const dr = enemy.position.row - player.position.row;
            const dc = enemy.position.col - player.position.col;
            const norm = Math.max(Math.abs(dr), Math.abs(dc)) || 1;
            const dirR = Math.round(dr / norm);
            const dirC = Math.round(dc / norm);

            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxSlash(v.layer, v.ticker, ep.x, ep.y); }

            for (let i = 0; i < pushDist; i++) {
                const newR = enemy.position.row + dirR;
                const newC = enemy.position.col + dirC;
                if (newR < 0 || newR >= 5 || newC < 0 || newC >= 8) break;
                let occupied = false;
                for (const e of ctx.combat.enemies) {
                    if (e !== enemy && e.hp > 0 && e.position.row === newR && e.position.col === newC) {
                        occupied = true; break;
                    }
                }
                if (occupied) break;
                enemy.position.row = newR;
                enemy.position.col = newC;
            }
            ctx.game.log(`${enemy.name}被击退了${pushDist}格！`);
            ctx.game.renderSystem?.renderGrid();
            ctx.game.renderSystem?.renderEnemyPanel();
        },

        pull(effect: any, ctx: any) {
            const player = ctx.player;
            const pullDist = effect.value || 2;
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, player.position.row, player.position.col); VFX.vfxMadnessVortex(v.layer, v.ticker, p.x, p.y); }
            for (const enemy of ctx.combat.enemies) {
                if (enemy.hp <= 0) continue;
                const dr = player.position.row - enemy.position.row;
                const dc = player.position.col - enemy.position.col;
                const norm = Math.max(Math.abs(dr), Math.abs(dc)) || 1;
                const dirR = Math.round(dr / norm);
                const dirC = Math.round(dc / norm);
                for (let i = 0; i < pullDist; i++) {
                    const newR = enemy.position.row + dirR;
                    const newC = enemy.position.col + dirC;
                    if (newR < 0 || newR >= 5 || newC < 0 || newC >= 8) break;
                    if (newR === player.position.row && newC === player.position.col) break;
                    enemy.position.row = newR;
                    enemy.position.col = newC;
                }
            }
            ctx.game.log(`引力漩涡！拉近所有敌人${pullDist}格！`);
            ctx.game.renderSystem?.renderGrid();
            ctx.game.renderSystem?.renderEnemyPanel();
        },

        stun(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            StatusEffectSystem.apply(enemy, {
                id: 'stun',
                name: '眩晕',
                type: 'debuff',
                value: 1,
                duration: effect.duration || 1,
                icon: '💫'
            });
            ctx.game.log(`${enemy.name}被眩晕了！下回合无法行动！`);
            ctx.game.renderSystem?.renderEnemyPanel();
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxDebuff(v.layer, v.ticker, ep.x, ep.y); }
        },

        piercingDamage(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            const damage = effect.value;
            enemy.hp -= damage;
            ctx.game.eventBus.emit('combat:attack');
            ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, damage);
            ctx.game.renderSystem?.renderEnemyPanel();
            ctx.game.log(`穿甲攻击！无视护甲对${enemy.name}造成${damage}点伤害！`);
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxPiercing(v.layer, v.ticker, ep.x, ep.y); }
            if (enemy.hp <= 0 && !enemy._dead) {
                enemy.hp = 0; enemy._dead = true;
                ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                ctx.game.log(`${enemy.name}被击败了！`);
                ctx.game.modifySanity(1);
            }
        },

        vampiric(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            const damage = effect.value;
            let actualDamage = damage;
            if (enemy.block && enemy.block > 0) {
                if (enemy.block >= damage) { enemy.block -= damage; actualDamage = 0; }
                else { actualDamage = damage - enemy.block; enemy.block = 0; }
            }
            enemy.hp -= actualDamage;
            const healAmount = Math.floor(actualDamage * (effect.healRatio || 0.5));
            ctx.game.modifyHP(healAmount);
            ctx.game.eventBus.emit('combat:attack');
            ctx.game.renderSystem?.showDamageNumber(enemy.position.row, enemy.position.col, actualDamage);
            ctx.game.renderSystem?.renderEnemyPanel();
            ctx.game.log(`吸血攻击！对${enemy.name}造成${actualDamage}伤害，恢复${healAmount}HP！`);
            const v = getVFX(ctx); if (v) { const pp = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxVampiric(v.layer, v.ticker, ep.x, ep.y, pp.x, pp.y); }
            if (enemy.hp <= 0 && !enemy._dead) {
                enemy.hp = 0; enemy._dead = true;
                ctx.game.renderSystem?.playDeathAnimation(enemy.position.row, enemy.position.col);
                ctx.game.log(`${enemy.name}被击败了！`);
                ctx.game.modifySanity(1);
            }
        },

        terrainDamage(effect: any, ctx: any) {
            const enemy = ctx.targetEnemy;
            if (!enemy) return;
            const grid = ctx.combat.grid;
            const r = enemy.position.row;
            const c = enemy.position.col;
            if (grid && grid[r] && grid[r][c]) {
                grid[r][c].terrain = effect.terrain || 'madness';
                grid[r][c].terrainDuration = effect.duration || 3;
            }
            ctx.game.log(`在${enemy.name}脚下放置了${effect.terrainName || '腐化之地'}！`);
            ctx.game.renderSystem?.renderGrid();
            const v = getVFX(ctx); if (v) { const ep = cellPx(ctx, enemy.position.row, enemy.position.col); VFX.vfxTerrainPlace(v.layer, v.ticker, ep.x, ep.y, effect.terrain === 'void' ? 0x4400aa : 0x9b30ff); }
        },

        teleport(effect: any, ctx: any) {
            // Teleport player to a random safe cell
            const grid = ctx.combat.grid;
            const safeCells: any[] = [];
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 8; c++) {
                    let occupied = false;
                    for (const e of ctx.combat.enemies) {
                        if (e.hp > 0 && e.position.row === r && e.position.col === c) {
                            occupied = true; break;
                        }
                    }
                    if (!occupied && !(r === ctx.player.position.row && c === ctx.player.position.col)) {
                        safeCells.push({ row: r, col: c });
                    }
                }
            }
            if (safeCells.length > 0) {
                const target = safeCells[Math.floor(Math.random() * safeCells.length)];
                ctx.player.position.row = target.row;
                ctx.player.position.col = target.col;
                ctx.game.log(`虚空之门！传送至(${target.row},${target.col})！`);
                ctx.game.renderSystem?.renderGrid();
                const v = getVFX(ctx); if (v) { const tp = cellPx(ctx, target.row, target.col); VFX.vfxTeleport(v.layer, v.ticker, tp.x, tp.y); }
            }
        },

        // === 属性修改效果（卡牌影响意志/威压） ===
        willBuff(effect: any, ctx: any) {
            const amount = effect.value;
            const permanent = effect.permanent || false;
            ctx.game.state.modifyAttribute('will', amount, permanent, effect.source || '卡牌效果');
            const sign = amount > 0 ? '+' : '';
            ctx.game.log(`🧠 意志 ${sign}${amount}${permanent ? '(永久)' : ''}`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxBuff(v.layer, v.ticker, p.x, p.y, 0x6688ff); }
        },

        coercionBuff(effect: any, ctx: any) {
            const amount = effect.value;
            const permanent = effect.permanent || false;
            ctx.game.state.modifyAttribute('coercion', amount, permanent, effect.source || '卡牌效果');
            const sign = amount > 0 ? '+' : '';
            ctx.game.log(`🔮 威压 ${sign}${amount}${permanent ? '(永久)' : ''}`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxBuff(v.layer, v.ticker, p.x, p.y, 0x9933ff); }
        },

        strengthBuff(effect: any, ctx: any) {
            const amount = effect.value;
            const permanent = effect.permanent || false;
            ctx.game.state.modifyAttribute('strength', amount, permanent, effect.source || '卡牌效果');
            const sign = amount > 0 ? '+' : '';
            ctx.game.log(`💪 力量 ${sign}${amount}${permanent ? '(永久)' : ''}`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxBuff(v.layer, v.ticker, p.x, p.y, 0xff6600); }
        },

        speedBuff(effect: any, ctx: any) {
            const amount = effect.value;
            const permanent = effect.permanent || false;
            ctx.game.state.modifyAttribute('speed', amount, permanent, effect.source || '卡牌效果');
            const sign = amount > 0 ? '+' : '';
            ctx.game.log(`🏃 速度 ${sign}${amount}${permanent ? '(永久)' : ''}`);
            const v = getVFX(ctx); if (v) { const p = cellPx(ctx, ctx.player.position.row, ctx.player.position.col); VFX.vfxMovement(v.layer, v.ticker, p.x, p.y); }
        }
    }
};

/**
 * 输入系统 - InputSystem
 */
export default class InputSystem {

    private game: Game;
    public selectedCard: number | null = null;
    public movePreview: any = null;

    constructor(game: Game) {
        this.game = game;
    }

    // ============================
    // Bresenham 视线(LoS)算法
    // 防止“隔山打牛”
    // ============================
    public checkLineOfSight(r0: number, c0: number, r1: number, c1: number): boolean {
        let dr = Math.abs(r1 - r0);
        let dc = Math.abs(c1 - c0);
        let sr = r0 < r1 ? 1 : -1;
        let sc = c0 < c1 ? 1 : -1;
        let err = (dr > dc ? dr : -dc) / 2;
        let err2 = 0;

        let r = r0;
        let c = c0;

        while (true) {
            // 排除起点和终点，只检查中途的格挡
            if ((r !== r0 || c !== c0) && (r !== r1 || c !== c1)) {
                if (this.getEnemyAt(r, c)) {
                    return false; // 视线被阻挡
                }
            }
            if (r === r1 && c === c1) break;
            
            err2 = err;
            if (err2 > -dr) { err -= dc; r += sr; }
            if (err2 < dc) { err += dr; c += sc; }
        }
        return true;
    }

    public handleCellClick(row: number, col: number): void {

        const combat = this.game.state.combat;
        if (!combat) return;

        const player = this.game.state.player;

        // === 卡牌选中状态下的点击 ===
        if (this.selectedCard !== null) {
            const enemy = this.getEnemyAt(row, col);
            if (enemy) {
                this.useCardOnTarget(this.selectedCard, enemy);
            } else {
                this.clearSelection();
                this.game.renderSystem?.clearMovePreview();
            }
            return;
        }

        // === 移动确认 (第二次点击同一格子) ===
        if (this.movePreview) {
            if (this.movePreview.row === row && this.movePreview.col === col) {
                this.confirmMove();
                return;
            } else {
                this.movePreview = null;
                this.game.renderSystem?.clearMovePreview();
                // 继续执行下方逻辑，尝试显示新位置的预览
            }
        }

        // === 新移动预览 (使用BFS寻路，不可穿越敌人) ===
        if (row === player.position.row && col === player.position.col) return; // 点击自身位置

        const enemy = this.getEnemyAt(row, col);
        if (enemy) return; // 目标格有敌人，不可移动到此

        const bfsPath = this.findPathBFS(player.position.row, player.position.col, row, col);
        if (!bfsPath || bfsPath.length === 0) {
            this.game.floatOnPlayer('⚠️ 路径受阻', '#ff8888');
            return;
        }

        const dist = bfsPath.length;
        if (player.movement < dist) {
            this.game.floatOnPlayer(`移动力不足`, '#ff8888');
            return;
        }

        this.showMovePreview(row, col, dist);
    }

    public handleCardClick(index: number): void {

        const player = this.game.state.player;
        const combat = this.game.state.combat;
        const card = player.hand[index];

        if (!card) return;

        const actualCost = this.calculateCardCost(card);

        if (player.energy < actualCost) {
            return;
        }

        let totalSanityCost = 0;
        if (card.effects) {
            for (let ei = 0; ei < card.effects.length; ei++) {
                const eff = card.effects[ei];
                if (eff.type === 'sanityCost') totalSanityCost += eff.value;
                if (eff.type === 'targetDamage' || eff.type === 'blockToAttack') totalSanityCost += 2;
            }
        }
        if (totalSanityCost > 0 && player.sanity < totalSanityCost) {
            this.game.floatOnPlayer('🌀 理智不足', '#9370DB');
            return;
        }

        if (card.needsTarget) {
            this.selectedCard = index;
            this.game.renderSystem?.highlightAttackRange(card.range || 99);
            return;
        }

        this.useCard(index);
    }

    public calculateCardCost(card: any): number {
        const combat = this.game.state.combat;
        const player = this.game.state.player;
        let actualCost = card.cost;

        const costIncrease = this.game.getSanityEffect('costIncrease') || 0;
        actualCost += (costIncrease as number);

        // 肉体崩解突变：攻击卡费用-1
        if (card.type === 'attack' && player.madnessMutations) {
            const attackReduction = this.game.getSanityEffect('attackCostReduction') || 0;
            actualCost -= (attackReduction as number);
        }

        if (combat && combat.madnessPenalty) {
            actualCost += 1;
        }

        if (card.type === 'attack' && combat && this.game.buffManager.has('zeroCostAttacks')) {
            actualCost = 0;
        }

        return Math.max(0, actualCost);
    }

    public useCardOnTarget(cardIndex: number, targetEnemy: any): void {
        const card = this.game.state.player.hand[cardIndex];
        if (!card) return;

        const player = this.game.state.player;
        const combat = this.game.state.combat;

        if (!combat) return;

        if (card.range) {
            const dist = Utils.manhattanDistance(player.position.row, player.position.col, targetEnemy.position.row, targetEnemy.position.col);
            if (dist > card.range) {
                this.clearSelection();
                return;
            }

            // ============================
            // Bresenham 视线 (LoS) 校验
            // 防止远程攻击隔山打牛 (穿透自身之外的其他敌人)
            // 如果卡牌有 'piercing' 穿透效果则无视遮挡
            // ============================
            const isPiercing = card.effects?.some((e: any) => e.type === 'piercing');
            
            if (!isPiercing && dist > 1) { // 距离1属于近战，必定有视线
                const hasLoS = this.checkLineOfSight(player.position.row, player.position.col, targetEnemy.position.row, targetEnemy.position.col);
                if (!hasLoS) {
                    this.game.floatOnPlayer('🚫 视线受阻', '#888888');
                    this.clearSelection();
                    return;
                }
            }
        }

        this.clearAttackRange();
        this.playCardInternal(cardIndex, targetEnemy);
        this.clearSelection();

        setTimeout(() => {
            this.game.renderSystem?.renderGrid();
        }, 1100);
    }

    public useCard(index: number): void {
        const combat = this.game.state.combat;
        if (!combat) return;

        const card = this.game.state.player.hand[index];
        if (!card) return;

        this.playCardInternal(index, null);
    }

    /**
     * 通用卡牌使用逻辑（消除 useCard / useCardOnTarget 的代码重复）
     */
    private playCardInternal(cardIndex: number, targetEnemy: any): void {
        // 每次从 store 读取最新引用（避免读到过期对象）
        let player = this.game.state.player;
        const card = player.hand[cardIndex];
        const combat = this.game.state.combat;

        if (!card || !combat) return;

        this.game.eventBus.emit('combat:card_played');

        // === 触发卡牌进入墓地的缩小动画 ===
        const handArea = document.getElementById('hand-area');
        if (handArea) {
            const cardEls = handArea.querySelectorAll('.card');
            const targetEl = cardEls[cardIndex] as HTMLElement;
            if (targetEl) {
                targetEl.classList.add('card-to-grave');
            }
        }

        const context = {
            game: this.game,
            player: player,
            combat: combat,
            targetEnemy: targetEnemy,
            inputSystem: this
        };

        // === 里效果觉醒 ===
        const { card: resolvedCard, bonusLog } = CardEvolutionEngine.resolveEffectsForPlay(card, player);
        for (const msg of bonusLog) {
            this.game.log(msg);
        }

        this.game.floatOnPlayer(`✨ ${resolvedCard.name}`, '#FFD700');
        CardEffectEngine.executeEffects(resolvedCard, context);

        if (!combat.turnPlayedCards) combat.turnPlayedCards = 0;
        combat.turnPlayedCards++;

        const actualCost = this.calculateCardCost(card);
        this.game.modifyEnergy(-actualCost);

        // 延迟更新手牌状态，等待动画完成
        setTimeout(() => {
            // 重新获取最新的 player
            player = this.game.state.player;

            if (card.consumable) {
                const deckCopy = [...player.deck];
                for (let i = 0; i < deckCopy.length; i++) {
                    if (deckCopy[i].name === card.name) {
                        deckCopy.splice(i, 1);
                        break;
                    }
                }
                const newHand = [...player.hand];
                newHand.splice(cardIndex, 1);
                this.game.state.setPlayerStats({ deck: deckCopy, hand: newHand });
                this.game.floatOnPlayer(`💨 ${card.name}消耗`, '#aaaaaa');
            } else {
                const newDiscard = [...player.discardPile, card];
                const newHand = [...player.hand];
                newHand.splice(cardIndex, 1);
                this.game.state.setPlayerStats({ hand: newHand, discardPile: newDiscard });
            }

            this.game.renderSystem?.updateCombatUI();
        }, 400);

        this.checkCombatEnd();
    }

    public getEnemyAt(row: number, col: number): any {
        const combat = this.game.state.combat;
        if (!combat) return null;

        for (let i = 0; i < combat.enemies.length; i++) {
            const e = combat.enemies[i];
            if (e.hp > 0 && e.position.row === row && e.position.col === col) {
                return e;
            }
        }
        return null;
    }

    public checkCombatEnd(): void {
        const combat = this.game.state.combat;

        const aliveEnemies = [];
        for (let i = 0; i < combat.enemies.length; i++) {
            if (combat.enemies[i].hp > 0) {
                aliveEnemies.push(combat.enemies[i]);
            }
        }

        if (aliveEnemies.length === 0) {
            if (combat.ended) return;
            combat.ended = true;

            this.game.combatFloat(2, 4, '🌟 战斗胜利！', '#FFD700');

            // 战斗胜利恢复少量理智上限
            let sanMaxRestore = 1;
            if (combat.type === 'elite') sanMaxRestore = 2;
            else if (combat.type === 'boss') sanMaxRestore = 3;
            this.game.modifyMaxSanity(sanMaxRestore, '战斗胜利');

            let sanityRestore = 5;
            if (combat.type === 'elite') sanityRestore = 10;
            if (combat.type === 'boss') sanityRestore = 15;

            const player = this.game.state.player;
            if (player.sanity < player.maxSanity) {
                this.game.modifySanity(sanityRestore);
                this.game.floatOnPlayer(`+${sanityRestore}🧠`, '#9370DB');
            }

            setTimeout(() => {
                this.game.showRewardScreen();
            }, 1500);
        }
    }

    public clearAttackRange(): void {
        // 使用 PixiRenderer 清除范围高亮（已从 DOM 迁移到 PixiJS）
        this.game.renderSystem?.combatRenderer?.pixiRenderer?.clearRange();
    }

    public clearSelection(): void {
        this.selectedCard = null;
        this.movePreview = null;
        this.clearAttackRange();
        this.game.renderSystem?.renderHand();
    }

    public showMovePreview(targetRow: number, targetCol: number, dist: number): void {
        const player = this.game.state.player;

        const path = this.calculateMovePath(player.position.row, player.position.col, targetRow, targetCol);

        this.movePreview = {
            row: targetRow,
            col: targetCol,
            dist: dist,
            path: path
        };

        this.game.floatOnPlayer(`👟 -${dist}移动力`, '#00ff88');

        this.game.renderSystem?.renderMovePreview(player.position.row, player.position.col, targetRow, targetCol, dist);
    }

    public calculateMovePath(startRow: number, startCol: number, targetRow: number, targetCol: number): any[] {
        const path = this.findPathBFS(startRow, startCol, targetRow, targetCol);
        return path || [];
    }

    /** BFS寻路 — 敌人占据的格子视为不可通过的障碍物 */
    public findPathBFS(startRow: number, startCol: number, targetRow: number, targetCol: number): any[] | null {
        const ROWS = 5;
        const COLS = 8;

        // 构建敌人占据位置集合
        const blocked = new Set<string>();
        const combat = this.game.state.combat;
        if (combat && combat.enemies) {
            for (let i = 0; i < combat.enemies.length; i++) {
                const e = combat.enemies[i];
                if (e.hp > 0) {
                    blocked.add(`${e.position.row},${e.position.col}`);
                }
            }
        }

        // BFS
        const visited = new Set<string>();
        const parent: Record<string, string | null> = {};
        const queue: [number, number][] = [[startRow, startCol]];
        const startKey = `${startRow},${startCol}`;
        visited.add(startKey);
        parent[startKey] = null;

        const dirs = [[0,1],[0,-1],[1,0],[-1,0]]; // 四方向

        while (queue.length > 0) {
            const [r, c] = queue.shift()!;

            if (r === targetRow && c === targetCol) {
                // 回溯路径
                const path: any[] = [];
                let key = `${targetRow},${targetCol}`;
                while (parent[key] !== null) {
                    const [pr, pc] = key.split(',').map(Number);
                    path.unshift({ row: pr, col: pc });
                    key = parent[key]!;
                }
                return path;
            }

            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                const nKey = `${nr},${nc}`;

                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (visited.has(nKey)) continue;
                if (blocked.has(nKey) && !(nr === targetRow && nc === targetCol)) continue;

                visited.add(nKey);
                parent[nKey] = `${r},${c}`;
                queue.push([nr, nc]);
            }
        }

        return null; // 无法到达
    }

    public confirmMove(): void {
        if (!this.movePreview) return;

        const combat = this.game.state.combat;
        if (!combat) return;

        const target = this.movePreview;

        // 先消耗移动力（这会创建新的player对象）
        this.game.modifyMovement(-target.dist);
        this.game.eventBus.emit('combat:move');

        // 通过 setPlayerStats 更新位置（避免直接修改被替换的旧对象）
        this.game.state.setPlayerStats({
            position: { row: target.row, col: target.col }
        });

        // 地形效果（需要重新获取最新的 player 引用）
        if (combat.grid) {
            const cell = combat.grid[target.row]?.[target.col];
            if (cell) {
                switch (cell.terrain) {
                    case 'madness':
                        this.game.modifySanity(-2);
                        this.game.floatOnPlayer('🌀 -2🧠', '#ff6666');
                        break;
                    case 'sanctuary':
                        this.game.modifySanity(3);
                        this.game.floatOnPlayer('🏠 +3🧠', '#00ff88');
                        break;
                    case 'void':
                        if (this.game.state.player.energy > 0) {
                            this.game.modifyEnergy(-1);
                            this.game.floatOnPlayer('🕳️ -1⭐', '#ff8888');
                        }
                        break;
                }
            }
        }

        // 移动已执行，无需额外飘字

        this.movePreview = null;
        this.game.renderSystem?.clearMovePreview();
        this.game.renderSystem?.renderGrid();
        this.game.renderSystem?.updateCombatUI();
    }
}
