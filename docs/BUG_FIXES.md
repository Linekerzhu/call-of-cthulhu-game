# 深渊召唤 - Bug 修复清单

> **修复日期**: 2026-03-09  
> **当前版本**: v0.2.0  
> **目标**: 累积修复后推送 v0.2.1

---

## 🐛 Bug 列表

### 🔴 严重 Bug (影响游戏平衡)

#### Bug 1: 黄衣信徒被动未实现
**描述**: 徽章描述"敌人每回合开始时有20%几率陷入恐惧，跳过行动"未在代码中实现

**位置**: `src/systems/CombatSystem.js` enemyTurn() 方法

**修复方案**:
```javascript
// 在 processEnemyActions 函数开头添加
if (player.badge === '黄衣信徒' && Math.random() < 0.2) {
    this.game.log('🎭 黄衣之王的诅咒！' + enemy.name + '陷入恐惧，跳过行动！');
    this.game.renderSystem.showPassiveEffect('恐惧！', '🎭');
    setTimeout(function() {
        processEnemyActions(enemyIndex + 1);
    }, 800);
    return;
}
```

---

#### Bug 2: 地图只有2层而非3层
**描述**: 游戏在第2层Boss战后直接结束，应该有3层

**位置**: `src/core/Game.js` 第361行

**当前代码**:
```javascript
if (this.state.floor < 2) {
```

**修复方案**:
```javascript
if (this.state.floor < 3) {
```

---

#### Bug 3: 深渊使者疯狂值系统不完整
**描述**: 疯狂漩涡卡牌需要消耗疯狂值，但 UI 不显示当前疯狂值

**位置**: `src/systems/RenderSystem.js` updateCombatUI()

**修复方案**: 在战斗 UI 添加疯狂值显示

---

### 🟡 中等 Bug (影响体验)

#### Bug 4: 部分卡牌效果未实现
**描述**: 
- `献祭诱饵` 嘲讽效果未实现
- `符文反击` 实际效果与描述不符

**位置**: `src/systems/InputSystem.js` useCard() 方法

---

#### Bug 5: 敌人死亡后意图图标未清除
**描述**: 敌人被击败后，意图图标还留在格子上

**位置**: `src/systems/RenderSystem.js` playDeathAnimation()

---

#### Bug 6: 休息站升级卡牌后名称显示问题
**描述**: 卡牌升级后名称为"卡牌名+"，但 tooltip 还是旧名称

**位置**: `src/systems/RenderSystem.js` showCardTooltip()

---

### 🟢 轻微 Bug (可延后)

#### Bug 7: 控制台日志过多
**描述**: 开发日志过多，影响性能

**修复方案**: 添加日志级别控制

---

## 🔧 修复计划

### 阶段 1: 严重 Bug (立即修复)
- [x] Bug 1: 黄衣信徒被动
- [x] Bug 2: 地图层数
- [x] Bug 3: 疯狂值显示

### 阶段 2: 中等 Bug (本次修复)
- [ ] Bug 4: 卡牌效果
- [ ] Bug 5: 意图图标
- [ ] Bug 6: 升级显示

### 阶段 3: 轻微 Bug (延后)
- [ ] Bug 7: 日志控制

---

## ✅ 修复验证

修复后需要测试:
1. 选择黄衣信徒徽章，确认敌人有20%几率跳过行动
2. 通关第3层Boss后才显示胜利
3. 疯狂值在 UI 正确显示
4. 所有卡牌效果正常工作

---

*创建于: 2026-03-09*
