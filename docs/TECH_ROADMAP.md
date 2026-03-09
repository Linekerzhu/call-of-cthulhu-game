# 深渊召唤 - 技术栈演进与开发路线图

> **规划版本**: v0.3.0 / v0.4.0 / v1.0  
> **规划日期**: 2026-03-09  
> **目标**: 从 MVP 到生产级游戏

---

## 1. 技术栈演进规划

### 1.1 当前技术栈 (v0.2.x)

```
┌────────────────────────────────────────┐
│  原生 JavaScript (ES5)                  │
│  HTML5 + CSS3                           │
│  Web Audio API                          │
│  无构建工具                             │
└────────────────────────────────────────┘
优点: 零依赖、浏览器兼容性好、部署简单
缺点: 缺乏类型安全、无模块化、难以维护
```

### 1.2 目标技术栈演进

#### Phase 1: 现代化 JavaScript (v0.3.0)

```
┌────────────────────────────────────────┐
│  TypeScript 5.x                         │
│  ES6 Modules                            │
│  Vite (构建工具)                         │
│  Jest (测试)                            │
└────────────────────────────────────────┘
迁移成本: 中等 (5-7天)
收益: 类型安全、IDE支持、代码质量
```

#### Phase 2: 游戏引擎化 (v0.4.0)

```
┌────────────────────────────────────────┐
│  PixiJS v7 (2D渲染)                     │
│  GSAP (动画)                            │
│  Tone.js (音频)                         │
│  自定义 ECS 架构                         │
└────────────────────────────────────────┘
迁移成本: 高 (10-14天)
收益: 60fps流畅渲染、丰富特效、专业音频
```

#### Phase 3: 生产级架构 (v1.0)

```
┌────────────────────────────────────────┐
│  WebGL 自定义着色器                      │
│  本地存储 / IndexedDB                   │
│ Service Worker (离线)                   │
│  数据统计 (可选)                         │
└────────────────────────────────────────┘
```

---

## 2. 详细演进计划

### 2.1 v0.3.0 - 代码现代化 (预计 2 周)

#### Week 1: TypeScript 迁移

| 任务 | 工时 | 产出 |
|------|------|------|
| 配置 TypeScript + Vite | 1天 | tsconfig.json, vite.config.ts |
| 类型定义编写 | 2天 | types/*.d.ts |
| Game.js 迁移 | 1天 | core/Game.ts |
| Data 层迁移 | 1天 | data/*.ts |

#### Week 2: 测试与重构

| 任务 | 工时 | 产出 |
|------|------|------|
| 配置 Jest | 0.5天 | jest.config.js |
| 单元测试编写 | 2天 | __tests__/*.test.ts |
| CombatSystem 重构 | 1.5天 | 拆分逻辑 |
| 代码审查 | 1天 | 修复问题 |

**v0.3.0 关键指标**:
- TypeScript 覆盖率: 100%
- 单元测试覆盖率: >60%
- 构建时间: <2s
- 类型错误: 0

---

### 2.2 v0.4.0 - 渲染引擎升级 (预计 3 周)

#### Week 1: PixiJS 基础

```
架构变更:
RenderSystem (DOM) → PixiRenderer (WebGL)
├─ GridLayer      (网格渲染)
├─ EntityLayer    (角色/敌人)
├─ EffectLayer    (特效)
└─ UILayer        (UI界面)
```

| 任务 | 工时 |
|------|------|
| PixiJS 项目配置 | 1天 |
| GridLayer 实现 | 2天 |
| EntityLayer 实现 | 2天 |

#### Week 2: 动画与特效

| 任务 | 工时 |
|------|------|
| GSAP 集成 | 1天 |
| 卡牌动画 | 2天 |
| 伤害数字动画 | 1天 |
| 特效系统 | 1天 |

#### Week 3: 音频与优化

| 任务 | 工时 |
|------|------|
| Tone.js 集成 | 2天 |
| BGM 系统 | 1天 |
| 性能优化 | 2天 |

**v0.4.0 关键指标**:
- FPS: 稳定 60
- 首屏加载: <3s
- 内存占用: <200MB

---

### 2.3 v1.0 - 生产发布 (预计 2 周)

#### Week 1: 功能完善

- [ ] 存档系统 (LocalStorage + IndexedDB)
- [ ] 成就系统
- [ ] 统计面板
- [ ] 多语言支持 (i18n)

#### Week 2: 发布准备

- [ ] PWA 支持
- [ ] 离线游戏
- [ ] 性能监控
- [ ] 文档完善

---

## 3. 架构重构计划

### 3.1 ECS 架构引入 (v0.4.0)

```javascript
// 当前: 面向对象
class Enemy {
    update() { ... }
    render() { ... }
}

// 目标: ECS 架构
// Entity: 唯一ID
// Component: 纯数据
// System: 纯逻辑

const enemy = entityManager.create();
entityManager.addComponent(enemy, 'health', { hp: 100, maxHp: 100 });
entityManager.addComponent(enemy, 'position', { x: 0, y: 0 });
entityManager.addComponent(enemy, 'render', { sprite: 'enemy.png' });

// System 处理
healthSystem.update();
movementSystem.update();
renderSystem.update();
```

**ECS 优势**:
- 数据驱动，易于序列化
- 系统独立，便于测试
- 性能友好，缓存友好

### 3.2 状态管理升级

```javascript
// 当前: 直接修改
this.state.player.hp -= damage;

// 目标: Redux-like 状态管理
store.dispatch({
    type: 'PLAYER_TAKE_DAMAGE',
    payload: { damage: 10, source: 'enemy' }
});

// 可预测、可回放、可调试
```

---

## 4. 功能路线图

### v0.3.0 功能清单
- [ ] TypeScript 全代码迁移
- [ ] 完整单元测试
- [ ] 修复黄衣信徒被动
- [ ] 敌人意图系统完善
- [ ] 卡牌平衡调整

### v0.4.0 功能清单
- [ ] PixiJS 渲染引擎
- [ ] 流畅动画系统
- [ ] 音效与背景音乐
- [ ] 粒子特效
- [ ] 新徽章: 死灵法师

### v1.0 功能清单
- [ ] 50+ 张卡牌
- [ ] 10+ 种敌人
- [ ] 完整 3 层地图
- [ ] 成就系统
- [ ] 存档系统
- [ ] PWA 支持

---

## 5. 风险评估

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|----------|
| TypeScript 迁移复杂 | 中 | 高 | 分模块逐步迁移 |
| PixiJS 学习曲线 | 中 | 中 | 预留学习时间 |
| 性能不达标 | 低 | 高 | 持续性能测试 |
| 浏览器兼容性 | 低 | 中 | 保持降级方案 |

---

## 6. 决策记录

### Decision 1: TypeScript 迁移策略
**决策**: 全量迁移，而非渐进式  
**理由**: 项目规模适中，全量迁移成本可控，收益更明显

### Decision 2: PixiJS vs Canvas API
**决策**: 使用 PixiJS  
**理由**: 成熟的 2D 渲染引擎，社区活跃，性能优秀

### Decision 3: 是否引入游戏引擎 (Phaser/Unity WebGL)
**决策**: 使用 PixiJS + 自定义架构，不使用完整引擎  
**理由**: 项目不需要完整引擎的复杂功能，自定义更灵活

---

*下一章节: 立即执行计划 (Next Actions)*
