# 深渊召唤 - 立即执行计划

> **当前版本**: v0.2.0  
> **目标版本**: v0.3.0-alpha  
> **时间规划**: 立即开始

---

## 🎯 本阶段目标

完成 TypeScript 迁移的基础配置，建立现代化开发环境。

---

## 📋 任务清单

### Phase 1: 环境搭建 (第 1 天)

#### Task 1.1: 初始化 npm 项目
```bash
cd /Users/zhuxingyi/projects/shadow-tower
npm init -y
```

#### Task 1.2: 安装依赖
```bash
# TypeScript 核心
npm install -D typescript @types/node

# 构建工具
npm install -D vite

# 测试
npm install -D jest @types/jest ts-jest

# 代码质量
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

#### Task 1.3: 配置文件
- [ ] `tsconfig.json` - TypeScript 配置
- [ ] `vite.config.ts` - 构建配置
- [ ] `jest.config.js` - 测试配置
- [ ] `.eslintrc.json` - 代码规范

---

### Phase 2: 类型定义 (第 2-3 天)

#### Task 2.1: 核心类型定义
```typescript
// src/types/game.ts

interface Player {
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    sanity: number;
    maxSanity: number;
    // ...
}

interface Card {
    id: string;
    name: string;
    cost: number;
    type: 'attack' | 'defense' | 'skill' | 'move';
    // ...
}

interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    position: Position;
    // ...
}
```

#### Task 2.2: 事件类型定义
```typescript
// src/types/events.ts

type GameEvent =
    | { type: 'CARD_PLAYED'; card: Card; target?: Enemy }
    | { type: 'DAMAGE_DEALT'; source: Entity; target: Entity; amount: number }
    | { type: 'TURN_END'; turn: number }
    // ...;
```

---

### Phase 3: 核心迁移 (第 4-7 天)

#### Task 3.1: 数据层迁移 (风险低)
- [ ] `Cards_Cthulhu.js` → `Cards_Cthulhu.ts`
- [ ] `Badges_Cthulhu.js` → `Badges_Cthulhu.ts`
- [ ] `Shop.js` → `Shop.ts`

#### Task 3.2: 系统层迁移 (风险中)
- [ ] `AudioSystem.js` → `AudioSystem.ts`
- [ ] `Game.js` → `Game.ts`

#### Task 3.3: 复杂系统迁移 (风险高)
- [ ] `CombatSystem.js` → `CombatSystem.ts`
- [ ] `InputSystem.js` → `InputSystem.ts`
- [ ] `RenderSystem.js` → `RenderSystem.ts`

---

### Phase 4: 测试与验证 (第 8-10 天)

#### Task 4.1: 单元测试
```typescript
// __tests__/combat.test.ts

describe('CombatSystem', () => {
    test('should deal damage correctly', () => {
        const combat = new CombatSystem(game);
        const enemy = createMockEnemy({ hp: 100 });
        
        combat.dealDamage(enemy, 10);
        
        expect(enemy.hp).toBe(90);
    });
    
    test('should trigger sanity effects', () => {
        // ...
    });
});
```

#### Task 4.2: 集成测试
- [ ] 完整战斗流程测试
- [ ] 地图流程测试
- [ ] 存档/读档测试

#### Task 4.3: 构建验证
```bash
npm run build    # 生产构建
npm run test     # 运行测试
npm run lint     # 代码检查
```

---

## 🗓️ 详细时间表

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1 | 环境搭建 | package.json, 配置文件 |
| Day 2 | 类型定义 | types/*.ts |
| Day 3 | 类型定义+数据层 | Cards.ts, Badges.ts |
| Day 4 | Audio + Game 迁移 | AudioSystem.ts, Game.ts |
| Day 5 | CombatSystem 迁移 | CombatSystem.ts |
| Day 6 | InputSystem 迁移 | InputSystem.ts |
| Day 7 | RenderSystem 迁移 | RenderSystem.ts |
| Day 8 | 单元测试 | __tests__/*.ts |
| Day 9 | 集成测试 | 测试报告 |
| Day 10 | 修复+优化 | 修复记录 |

---

## 🚀 启动命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

---

## 📊 成功标准

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| TypeScript 覆盖率 | 100% | `tsc --noEmit` 无错误 |
| 单元测试覆盖率 | >60% | Jest 报告 |
| 构建时间 | <5s | `time npm run build` |
| 游戏可玩性 | 无回归 | 手动测试 |

---

## ⚠️ 风险与应对

| 风险 | 应对策略 |
|------|----------|
| 迁移过程中引入 Bug | 每完成一个模块立即测试 |
| TypeScript 编译错误过多 | 先使用宽松配置，逐步严格 |
| 第三方库类型缺失 | 使用 @types 或自定义声明 |

---

## ✅ 开始执行

准备好了吗？回复 **"开始执行"** 我将立即：
1. 初始化 npm 项目
2. 安装所有依赖
3. 创建配置文件
4. 开始 TypeScript 迁移

---

*文档版本: 1.0*  
*最后更新: 2026-03-09*
