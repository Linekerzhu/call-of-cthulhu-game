# 🏰 暗影尖塔 (Shadow Tower) 技术升级规划

> 版本：v1.0  
> 日期：2026-03-07  
> 状态：规划中  

---

## 📋 目录

1. [项目愿景](#1-项目愿景)
2. [技术栈选型](#2-技术栈选型)
3. [架构设计](#3-架构设计)
4. [目录结构](#4-目录结构)
5. [开发规范](#5-开发规范)
6. [迁移计划](#6-迁移计划)
7. [风险评估](#7-风险评估)

---

## 1. 项目愿景

### 1.1 当前状态
- 单文件HTML游戏，1077行代码
- 快速原型验证完成
- 核心玩法已确认（战棋+卡牌+肉鸽）

### 1.2 目标状态
- **商业级代码质量**：可维护、可扩展、可测试
- **多人协作支持**：清晰的分工和代码边界
- **跨平台部署**：Web + 桌面 + 移动端
- **数据驱动**：支持Mod、关卡编辑器

### 1.3 成功标准
- [ ] 代码覆盖率 > 80%
- [ ] 构建时间 < 10秒
- [ ] 首屏加载 < 2秒
- [ ] 支持100+张卡牌不卡顿

---

## 2. 技术栈选型

### 2.1 核心框架

| 技术 | 选择 | 理由 | 替代方案 |
|------|------|------|----------|
| **语言** | TypeScript | 类型安全、IDE支持好、生态成熟 | JavaScript（放弃） |
| **前端框架** | React 18 | 组件化成熟、生态丰富、团队熟悉度 | Vue 3、Svelte |
| **构建工具** | Vite 5 | 极速HMR、现代ESM、Rollup生态 | Webpack、esbuild |
| **状态管理** | Zustand | 轻量、TypeScript友好、无样板代码 | Redux、MobX |

### 2.2 游戏引擎层

| 技术 | 选择 | 用途 |
|------|------|------|
| **渲染** | PixiJS v7 | 2D游戏渲染，比DOM操作性能高10倍+ |
| **物理** | Matter.js | 可选，需要碰撞检测时引入 |
| **音频** | Howler.js | 游戏音效管理 |

### 2.3 架构模式

| 模式 | 选择 | 理由 |
|------|------|------|
| **游戏架构** | ECS (Entity-Component-System) | 灵活组合、高性能、易扩展 |
| **状态管理** | 不可变状态 + 单向数据流 | 可预测、可时间旅行调试 |

### 2.4 开发工具链

```
开发环境
├── VS Code
│   ├── ESLint 代码规范
│   ├── Prettier 格式化
│   ├── TypeScript Hero 导入管理
│   └── GitLens 版本控制
├── 调试工具
│   ├── React DevTools
│   └── Redux DevTools (Zustand兼容)
└── 测试
    ├── Vitest 单元测试
    ├── Playwright E2E测试
    └── Storybook 组件文档
```

### 2.5 部署与运维

| 环节 | 技术 | 说明 |
|------|------|------|
| **CI/CD** | GitHub Actions | 自动化测试、构建、部署 |
| **托管** | 腾讯云COS / Vercel | 静态资源托管，CDN加速 |
| **监控** | Sentry | 错误追踪、性能监控 |
| **分析** | Google Analytics | 用户行为分析 |

---

## 3. 架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   UI组件    │  │   场景管理   │  │     动画系统        │ │
│  │ (React)     │  │             │  │     (GSAP)          │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   游戏状态   │  │   命令系统   │  │     事件总线        │ │
│  │ (Zustand)   │  │  (Command)  │  │    (EventBus)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  ECS核心    │  │   游戏系统   │  │      实体定义       │ │
│  │             │  │             │  │                     │ │
│  │ • Entity    │  │ • Combat    │  │ • Player            │ │
│  │ • Component │  │ • Movement  │  │ • Enemy             │ │
│  │ • System    │  │ • CardPlay  │  │ • Card              │ │
│  │ • World     │  │ • AI        │  │ • MapNode           │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   资源管理   │  │   存储层    │  │     网络层          │ │
│  │             │  │             │  │                     │ │
│  │ • Assets    │  │ • LocalDB   │  │ • API Client        │ │
│  │ • Loader    │  │ • Save/Load │  │ • Analytics         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 ECS (Entity-Component-System) 详解

#### 3.2.1 核心概念

```typescript
// Entity - 唯一标识符
type Entity = number;

// Component - 纯数据，无逻辑
interface Position { x: number; y: number; }
interface Health { current: number; max: number; }
interface Attack { damage: number; range: number; }

// System - 逻辑处理，无状态
class CombatSystem extends System {
  update(world: World, dt: number) {
    const entities = world.query([Attack, Position]);
    // 处理攻击逻辑
  }
}
```

#### 3.2.2 游戏实体映射

| 游戏概念 | Entity | Components |
|----------|--------|------------|
| 玩家 | Entity(1) | Player, Position, Health, Deck |
| 史莱姆 | Entity(2) | Enemy, Position, Health, AI |
| 火球术 | Entity(3) | Card, Damage, Range |
| 地图格子 | Entity(4) | GridCell, Position, Terrain |

#### 3.2.3 系统列表

```typescript
// 核心系统
const systems = [
  InputSystem,      // 处理输入
  MovementSystem,   // 处理移动
  CombatSystem,     // 处理战斗
  CardSystem,       // 处理卡牌
  AISystem,         // 处理AI
  EffectSystem,     // 处理特效
  RenderSystem,     // 渲染（对接PixiJS）
  UISystem,         // UI更新
];
```

### 3.3 状态管理

```typescript
// 使用 Zustand + Immer 实现不可变状态
interface GameState {
  // 运行状态
  phase: 'title' | 'map' | 'combat' | 'event' | 'gameover';
  turn: number;
  
  // 游戏世界
  world: World;
  
  // 玩家实体ID
  playerId: Entity;
  
  // 当前战斗
  combat?: {
    enemies: Entity[];
    grid: Grid;
    selectedCard: Entity | null;
  };
  
  // 地图
  map: {
    floor: number;
    nodes: MapNode[];
    currentNode: number;
  };
  
  // 历史记录（用于撤销/回放）
  history: GameState[];
}
```

### 3.4 命令模式（Command Pattern）

```typescript
// 所有游戏操作都封装为命令
abstract class Command {
  abstract execute(): void;
  abstract undo(): void;
  abstract redo(): void;
}

class MoveCommand extends Command {
  constructor(
    private entity: Entity,
    private from: Position,
    private to: Position
  ) {}
  
  execute() { /* 移动实体 */ }
  undo() { /* 撤销移动 */ }
}

class PlayCardCommand extends Command {
  // 打出卡牌
}

// 命令历史支持撤销/重做
class CommandHistory {
  private history: Command[] = [];
  private index = -1;
  
  execute(cmd: Command) {
    cmd.execute();
    this.history[++this.index] = cmd;
    this.history.length = this.index + 1; // 删除redo历史
  }
  
  undo() {
    if (this.index >= 0) {
      this.history[this.index--].undo();
    }
  }
}
```

---

## 4. 目录结构

```
shadow-tower/
├── 📄 README.md                 # 项目说明
├── 📄 Plan.md                   # 本规划文档
├── 📄 CHANGELOG.md              # 更新日志
├── 📄 LICENSE                   # 开源协议
│
├── 📂 .github/                  # GitHub配置
│   ├── workflows/               # CI/CD工作流
│   │   ├── ci.yml              # 持续集成
│   │   └── deploy.yml          # 自动部署
│   └── ISSUE_TEMPLATE/          # Issue模板
│
├── 📂 public/                   # 静态资源
│   ├── assets/                  # 游戏资源
│   │   ├── images/             # 图片
│   │   ├── audio/              # 音效
│   │   └── fonts/              # 字体
│   └── index.html              # HTML入口
│
├── 📂 src/                      # 源代码
│   ├── main.tsx                # 应用入口
│   ├── App.tsx                 # 根组件
│   │
│   ├── 📂 core/                 # 核心引擎
│   │   ├── ecs/                # ECS系统
│   │   │   ├── Entity.ts
│   │   │   ├── Component.ts
│   │   │   ├── System.ts
│   │   │   ├── World.ts
│   │   │   └── index.ts
│   │   ├── state/              # 状态管理
│   │   │   ├── store.ts        # Zustand store
│   │   │   ├── slices/         # 状态切片
│   │   │   │   ├── gameSlice.ts
│   │   │   │   ├── combatSlice.ts
│   │   │   │   └── playerSlice.ts
│   │   │   └── hooks.ts        # 状态钩子
│   │   └── events/             # 事件系统
│   │       └── EventBus.ts
│   │
│   ├── 📂 systems/              # 游戏系统
│   │   ├── CombatSystem.ts
│   │   ├── MovementSystem.ts
│   │   ├── CardSystem.ts
│   │   ├── AISystem.ts
│   │   ├── InputSystem.ts
│   │   ├── EffectSystem.ts
│   │   └── RenderSystem.ts
│   │
│   ├── 📂 entities/             # 实体工厂
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── Card.ts
│   │   └── GridCell.ts
│   │
│   ├── 📂 components/           # 实体组件
│   │   ├── Position.ts
│   │   ├── Health.ts
│   │   ├── Attack.ts
│   │   ├── Deck.ts
│   │   └── AI.ts
│   │
│   ├── 📂 data/                 # 游戏数据
│   │   ├── cards/              # 卡牌定义
│   │   │   ├── attackCards.ts
│   │   │   ├── defenseCards.ts
│   │   │   └── skillCards.ts
│   │   ├── enemies/            # 敌人定义
│   │   │   ├── normalEnemies.ts
│   │   │   ├── eliteEnemies.ts
│   │   │   └── bosses.ts
│   │   ├── events/             # 事件定义
│   │   └── maps/               # 地图配置
│   │
│   ├── 📂 ui/                   # UI组件
│   │   ├── common/             # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── screens/            # 屏幕组件
│   │   │   ├── TitleScreen.tsx
│   │   │   ├── MapScreen.tsx
│   │   │   ├── CombatScreen.tsx
│   │   │   └── GameOverScreen.tsx
│   │   ├── combat/             # 战斗UI
│   │   │   ├── Grid.tsx
│   │   │   ├── Hand.tsx
│   │   │   ├── CombatLog.tsx
│   │   │   └── EnemyIntent.tsx
│   │   └── hud/                # HUD元素
│   │       ├── HealthBar.tsx
│   │       ├── EnergyBar.tsx
│   │       └── BlockIndicator.tsx
│   │
│   ├── 📂 hooks/                # 自定义Hooks
│   │   ├── useGame.ts
│   │   ├── useCombat.ts
│   │   └── useAnimation.ts
│   │
│   ├── 📂 utils/                # 工具函数
│   │   ├── distance.ts
│   │   ├── random.ts
│   │   ├── pathfinding.ts
│   │   └── formatters.ts
│   │
│   ├── 📂 types/                # 类型定义
│   │   ├── game.ts
│   │   ├── combat.ts
│   │   └── index.ts
│   │
│   └── 📂 styles/               # 样式
│       ├── global.css
│       ├── variables.css
│       └── animations.css
│
├── 📂 tests/                    # 测试
│   ├── unit/                    # 单元测试
│   │   ├── systems/
│   │   ├── entities/
│   │   └── utils/
│   ├── integration/             # 集成测试
│   └── e2e/                     # E2E测试
│       └── gameplay.spec.ts
│
├── 📂 docs/                     # 文档
│   ├── architecture/            # 架构文档
│   ├── api/                     # API文档
│   └── design/                  # 设计文档
│
├── 📂 scripts/                  # 工具脚本
│   ├── migrate-data.ts          # 数据迁移
│   └── generate-sprites.ts      # 资源生成
│
├── 📂 .vscode/                  # VS Code配置
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── 📄 package.json              # 依赖配置
├── 📄 tsconfig.json             # TypeScript配置
├── 📄 vite.config.ts            # Vite配置
├── 📄 vitest.config.ts          # 测试配置
├── 📄 tailwind.config.js        # Tailwind配置
└── 📄 eslint.config.js          # ESLint配置
```

---

## 5. 开发规范

### 5.1 代码规范

```typescript
// ✅ 好的代码
interface EnemyConfig {
  readonly id: string;
  name: string;
  attackRange: number;
}

class EnemyFactory {
  create(config: EnemyConfig): Entity {
    const entity = this.world.createEntity();
    this.world.addComponent(entity, new Position(0, 0));
    this.world.addComponent(entity, new Health(config.hp));
    return entity;
  }
}

// ❌ 坏的代码
function makeEnemy(n, h) {  // 不明确
  return { name: n, hp: h };  // 无类型
}
```

### 5.2 提交规范

```bash
# 格式: <type>(<scope>): <subject>

feat(combat): 添加连击系统
fix(ai): 修复敌人卡死问题
docs(readme): 更新部署说明
style(ui): 优化卡牌动画
refactor(ecs): 重构组件系统
test(combat): 添加战斗单元测试
chore(deps): 升级React到v18
```

### 5.3 分支策略

```
main          # 生产分支
├── develop   # 开发分支
│   ├── feature/combo-system
│   ├── feature/new-cards
│   └── fix/ai-movement
├── hotfix/critical-bug
└── release/v1.0.0
```

---

## 6. 迁移计划

### 阶段1：基础设施（第1-2天）

```markdown
- [ ] 初始化项目结构
- [ ] 配置 TypeScript + Vite
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Vitest 测试框架
- [ ] 配置 CI/CD 流水线
- [ ] 创建基础组件库
```

### 阶段2：核心引擎（第3-5天）

```markdown
- [ ] 实现 ECS 核心框架
- [ ] 实现状态管理系统
- [ ] 实现事件总线
- [ ] 集成 PixiJS 渲染
- [ ] 编写单元测试
```

### 阶段3：游戏系统（第6-10天）

```markdown
- [ ] 迁移战斗系统
- [ ] 迁移卡牌系统
- [ ] 迁移移动系统
- [ ] 迁移AI系统
- [ ] 迁移UI系统
- [ ] 集成测试
```

### 阶段4：数据迁移（第11-12天）

```markdown
- [ ] 提取卡牌数据
- [ ] 提取敌人数据
- [ ] 提取事件数据
- [ ] 验证数据完整性
- [ ] 性能测试
```

### 阶段5：优化上线（第13-14天）

```markdown
- [ ] 性能优化
- [ ] 添加错误监控
- [ ] 部署到生产环境
- [ ] 灰度发布
- [ ] 全量发布
```

---

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 重构引入新bug | 高 | 高 | 完整测试覆盖、渐进式迁移 |
| 性能不如原生 | 中 | 中 | PixiJS优化、对象池、性能测试 |
| 开发时间超期 | 中 | 中 | 分阶段交付、MVP优先 |
| 学习成本 | 低 | 低 | 文档完善、代码审查 |
| 第三方库维护 | 低 | 中 | 选择成熟库、锁定版本 |

---

## 附录

### A. 参考资源

- [ECS架构指南](https://github.com/SanderMertens/ecs-faq)
- [React游戏开发](https://react.dev/)
- [PixiJS文档](https://pixijs.com/)
- [TypeScript最佳实践](https://www.typescriptlang.org/docs/)

### B. 术语表

| 术语 | 说明 |
|------|------|
| ECS | Entity-Component-System，游戏架构模式 |
| HMR | Hot Module Replacement，热模块替换 |
| CI/CD | Continuous Integration/Deployment |
| MVP | Minimum Viable Product，最小可行产品 |

---

**规划制定者**: AI Assistant  
**审核状态**: 待审核  
**下次评审**: 待定
