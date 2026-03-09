# 🎨 暗影尖塔 UI设计规划

> **风格定位**：像素风 + 呆萌可爱  
> **设计理念**：蠢萌不恐怖，轻松上手  
> **技术约束**：响应式布局，网页优先  

---

## 📋 目录

1. [设计原则](#1-设计原则)
2. [视觉风格](#2-视觉风格)
3. [响应式布局](#3-响应式布局)
4. [屏幕设计](#4-屏幕设计)
5. [蠢萌命名规范](#5-蠢萌命名规范)
6. [组件规范](#6-组件规范)

---

## 1. 设计原则

### 1.1 核心原则

```
┌─────────────────────────────────────────┐
│  🎯 蠢萌可爱 > 暗黑恐怖                 │
│  🎯 清晰易懂 > 炫酷复杂                 │
│  🎯 响应流畅 > 固定布局                 │
│  🎯  emoji  过渡 > 等待美术             │
└─────────────────────────────────────────┘
```

### 1.2 情绪板

```
参考风格：
- 《像素地牢》（Pixel Dungeon）的简洁
- 《星露谷物语》的温暖色调
- 《猫咪大战争》的蠢萌角色
- 《杀戮尖塔》的信息层级

避免：
- 血腥、骷髅、暗黑元素
- 过于复杂的装饰
- 恐怖氛围
```

---

## 2. 视觉风格

### 2.1 色彩系统

```css
/* 主色调 */
--color-primary: #FF6B6B;        /* 珊瑚红 - 热情活力 */
--color-secondary: #4ECDC4;      /* 薄荷绿 - 清新治愈 */
--color-accent: #FFE66D;         /* 柠檬黄 - 高亮强调 */

/* 背景色 */
--color-bg-dark: #2C3E50;        /* 深蓝灰 - 主背景 */
--color-bg-medium: #34495E;      /* 中蓝灰 - 次级背景 */
--color-bg-light: #ECF0F1;       /* 浅灰 - 卡片背景 */

/* 功能色 */
--color-hp: #E74C3C;             /* 红心 - 生命值 */
--color-energy: #F39C12;         /* 闪电黄 - 能量 */
--color-block: #3498DB;          /* 盾牌蓝 - 格挡 */
--color-gold: #F1C40F;           /* 金币黄 - 货币 */

/* 地形色 */
--color-forest: #27AE60;         /* 森林绿 */
--color-fire: #E74C3C;           /* 火焰红 */
--color-ice: #AED6F1;            /* 冰霜蓝 */
--color-poison: #9B59B6;         /* 毒紫 */
```

### 2.2 字体系统

```css
/* 中文标题 */
font-family: 'ZCOOL KuaiLe', '站酷快乐体', cursive;

/* 正文 */
font-family: 'Noto Sans SC', '微软雅黑', sans-serif;

/* 数字/英文 */
font-family: 'Press Start 2P', monospace;

/* Emoji 作为图标补充 */
```

### 2.3 像素风格实现

```css
/* 像素边框 */
.pixel-border {
  border: 4px solid var(--color-primary);
  border-image: url('pixel-border.png') 4 stretch;
  box-shadow: 
    4px 4px 0 rgba(0,0,0,0.3),
    inset -2px -2px 0 rgba(0,0,0,0.2),
    inset 2px 2px 0 rgba(255,255,255,0.2);
}

/* 像素圆角（8-bit风格） */
.pixel-rounded {
  border-radius: 0;  /* 像素风不用圆角 */
  /* 或者用阶梯式 */
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px),
    calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 4px),
    0 calc(100% - 4px)
  );
}

/* 像素动画 */
@keyframes pixel-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

### 2.4 Emoji 使用规范

**作为临时美术资源，Emoji 使用原则：**

```
✅ 使用场景：
- 角色图标（玩家、敌人）
- 状态图标（中毒、燃烧、冰冻）
- 地形图标（森林、火坑）
- 物品图标（血瓶、金币）

❌ 不使用场景：
- UI按钮（用文字或CSS绘制）
- 背景装饰（用CSS图案）
- 大场景元素（用纯色块）

⚠️ 注意事项：
- Emoji 在不同平台显示不同，最终需要替换为像素画
- 统一使用 Emoji 14.0 版本，确保兼容性
- 避免使用肤色变体，保持简洁
```

---

## 3. 响应式布局

### 3.1 断点设计

```css
/* 移动端优先 */

/* 小屏手机 */
@media (max-width: 375px) {
  /* iPhone SE 等 */
}

/* 标准手机 */
@media (min-width: 376px) and (max-width: 428px) {
  /* iPhone 12/13/14/15 */
}

/* 大屏手机 */
@media (min-width: 429px) and (max-width: 767px) {
  /* iPhone Pro Max */
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1024px) {
  /* iPad 横竖屏 */
}

/* 小桌面 */
@media (min-width: 1025px) and (max-width: 1366px) {
  /* 笔记本 */
}

/* 大桌面 */
@media (min-width: 1367px) {
  /* 外接显示器 */
}
```

### 3.2 战斗界面响应式策略

```
布局核心：战棋网格固定比例，UI元素自适应

【手机竖屏】(375px-428px宽度)
┌─────────────────────────────┐
│  状态栏 (HP/能量/金币)       │  ← 高度: 60px
├─────────────────────────────┤
│                             │
│      战棋网格区域            │  ← 正方形，宽度100%
│      (5×8 或自适应缩放)      │
│                             │
├─────────────────────────────┤
│  战斗日志 (折叠/展开)        │  ← 高度: 80px
├─────────────────────────────┤
│      手牌区域               │  ← 高度: 140px
│   (横向滑动查看)             │
└─────────────────────────────┘

【平板横屏】(768px+宽度)
┌──────────────────┬──────────┐
│                  │ 状态栏    │
│   战棋网格区域    ├──────────┤
│   (居中显示)      │ 战斗日志  │
│                  │          │
│                  ├──────────┤
│                  │ 手牌区域  │
├──────────────────┴──────────┤
│        操作按钮栏            │
└─────────────────────────────┘

【桌面端】(1024px+宽度)
┌──────────┬──────────────────┬──────────┐
│          │                  │          │
│  战斗日志 │   战棋网格区域    │  敌人信息 │
│  (详细)   │   (最大显示)      │  (意图)   │
│          │                  │          │
├──────────┼──────────────────┼──────────┤
│          │    手牌区域       │          │
│  玩家状态 │   (完全展示)      │  地图信息 │
│          │                  │          │
└──────────┴──────────────────┴──────────┘
```

### 3.3 网格自适应算法

```typescript
// 计算最佳格子大小
function calculateCellSize(containerWidth: number, containerHeight: number, cols: number, rows: number) {
  const padding = 16;  // 边距
  const availableWidth = containerWidth - padding * 2;
  const availableHeight = containerHeight - padding * 2 - 200;  // 预留手牌区域
  
  const cellWidth = Math.floor(availableWidth / cols);
  const cellHeight = Math.floor(availableHeight / rows);
  
  // 取小值保持正方形
  const cellSize = Math.min(cellWidth, cellHeight, 72);  // 最大72px
  
  return cellSize;
}
```

---

## 4. 屏幕设计

### 4.1 标题屏幕

```
┌─────────────────────────────────────────────┐
│                                             │
│               ☁️ ☁️ ☁️                       │
│                                             │
│              🏰                             │
│         ╔═══════════════╗                   │
│         ║  暗影尖塔     ║  ← 站酷快乐体    │
│         ║ Shadow Tower ║  ← Press Start 2P │
│         ╚═══════════════╝                   │
│                                             │
│              🧙‍♂️  (玩家角色，待机动画)       │
│                                             │
│         [ 开始冒险 ]  ← 像素按钮           │
│                                             │
│    [继续]  [图鉴]  [设置]  [排行榜]         │
│                                             │
│              🌲 🌲 🌲  (像素森林背景)        │
│                                             │
└─────────────────────────────────────────────┘

背景：深色渐变 + 像素星星闪烁动画
音乐：轻快的8-bit背景音乐
```

### 4.2 地图屏幕

```
┌─────────────────────────────────────────────┐
│ 第1层  💰150  🧪3瓶药水                      │  ← 状态栏
├─────────────────────────────────────────────┤
│                                             │
│           🎪 Boss                            │
│            │                                 │
│      🏠───┴───⚔️                             │
│                │                             │
│          🌲───┴───🏥                         │
│                │                             │
│               🧙 你在这                      │
│                                             │
│  图例：🧙 玩家  ⚔️ 战斗  🏥 休息  🏠 事件    │
│        🎪 Boss  🎁 商店  ❓ 随机            │
└─────────────────────────────────────────────┘

节点设计：
- 已访问：灰色 + 对勾 ✓
- 当前：闪烁黄色光环
- 可前往：亮白色，可点击
- 未解锁：半透明
```

### 4.3 战斗屏幕（核心）

```
【手机版】
┌─────────────────────────────────────────────┐
│ ❤️45/50  ⚡3/3  🛡️5  💰150  回合3           │  ← 顶栏
├─────────────────────────────────────────────┤
│                                             │
│    ┌───┬───┬───┬───┬───┬───┬───┬───┐      │
│    │ 🟢│   │   │   │   │   │   │   │      │  ← 敌人
│    ├───┼───┼───┼───┼───┼───┼───┼───┤      │
│    │   │   │   │🌲 │   │   │   │   │      │  ← 森林地形
│    ├───┼───┼───┼───┼───┼───┼───┼───┤      │
│    │   │   │   │   │   │   │   │   │      │
│    ├───┼───┼───┼───┼───┼───┼───┼───┤      │
│    │   │   │   │   │   │   │   │   │      │
│    ├───┼───┼───┼───┼───┼───┼───┼───┤      │
│    │   │   │   │   │   │   │   │   │      │
│    ├───┼───┼───┼───┼───┼───┼───┼───┤      │
│    │🧙 │   │   │   │   │   │   │   │      │  ← 玩家
│    └───┴───┴───┴───┴───┴───┴───┴───┘      │
│                                             │
│  吵吵怪🟢  意图: ⚔️5  范围: 🟥🟥🟥          │  ← 敌人信息
│  "我要吵死你！"                             │  ← 蠢萌台词
├─────────────────────────────────────────────┤
│ 💬 你使用了【大嘴巴子】造成8点伤害！         │  ← 战斗日志
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │⚔️   │  │🛡️   │  │🏃   │  │💊   │       │  ← 手牌
│  │打击 │  │防御 │  │疾步 │  │脑白金│       │
│  │  1  │  │  1  │  │  0  │  │  0  │       │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
│                                             │
│         [ 结束回合 ]                        │
└─────────────────────────────────────────────┘
```

### 4.4 卡牌设计

```
┌─────────────────────┐
│  💎 1               │  ← 费用（左上角）
│                     │
│      ⚔️             │  ← 大图标（居中）
│                     │
│    大嘴巴子          │  ← 卡名
│                     │
│  "打脸专用"         │  ← 蠢萌描述
│                     │
│  造成8点伤害        │  ← 效果
│  👊 近战            │  ← 标签
└─────────────────────┘

卡牌样式：
- 攻击卡：红色边框 (#E74C3C)
- 防御卡：蓝色边框 (#3498DB)
- 技能卡：绿色边框 (#27AE60)
- 移动卡：黄色边框 (#F1C40F)
- 传说卡：紫色边框 + 金色闪光动画
```

### 4.5 游戏结束屏幕

```
【胜利】
┌─────────────────────────────────────────────┐
│                                             │
│              🎉 🎊 🎉                        │
│                                             │
│           ╔═══════════╗                     │
│           ║  胜利！   ║                     │
│           ╚═══════════╝                     │
│                                             │
│              🏆                             │
│                                             │
│         用时: 12分34秒                      │
│         分数: 12,580                        │
│         排名: 第3名                         │
│                                             │
│    ┌─────────────────────────────┐         │
│    │  统计                       │         │
│    │  击败敌人: 15               │         │
│    │  打出卡牌: 89               │         │
│    │  最高伤害: 24               │         │
│    │  无伤战斗: 3                │         │
│    └─────────────────────────────┘         │
│                                             │
│       [再来一局]  [分享]  [返回主菜单]      │
│                                             │
└─────────────────────────────────────────────┘

【失败】
┌─────────────────────────────────────────────┐
│                                             │
│              💀 👻 💀                        │
│                                             │
│           ╔═══════════╗                     │
│           ║  战败...  ║                     │
│           ╚═══════════╝                     │
│                                             │
│     "下次一定会更强的！"                     │
│                                             │
│     你倒在了第2层的暗影巨龙面前             │
│                                             │
│     解锁: 死灵法师徽章（经典模式到达第3层） │
│                                             │
│       [再来一局]  [查看回放]  [主菜单]      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. 蠢萌命名规范

### 5.1 命名原则

```
┌─────────────────────────────────────────────┐
│  😂 要让人会心一笑                           │
│  🚫 不要低俗或冒犯                           │
│  🎯 要暗示功能或特点                         │
│  🎨 要符合像素呆萌风格                       │
└─────────────────────────────────────────────┘
```

### 5.2 物品命名

| 类型 | 原名 | 蠢萌名 | 理由 |
|------|------|--------|------|
| 血瓶 | 治疗药水 | **脑白金** | 补脑（补血），广告梗 |
| 能量药水 | 能量药水 | ** Red Bull** / **牛磺酸** | 功能饮料梗 |
| 金币 | 金币 | **零花钱** / **钢镚儿** | 亲切可爱 |
| 药水 | 药水 | **快乐水** | 可乐梗 |
| 炸弹 | 炸弹 | **二踢脚** | 传统鞭炮 |
| 护盾 | 护盾 | **锅盖** / **脸盆** | 日常用品 |

### 5.3 敌人命名

| 原名 | 蠢萌名 | 特点描述 | Emoji |
|------|--------|----------|-------|
| 史莱姆 | **果冻怪** / **QQ糖** | 弹弹的，可爱 | 🟢 |
| 哥布林 | **吵吵怪** | 叽叽喳喳 | 👺 |
| 骷髅兵 | **骨头架子** / **排骨精** | 瘦瘦的 | 💀 |
| 兽人 | **绿皮怪** / **没洗澡** | 臭臭的 | 👹 |
| 蝙蝠 | **黑黑** / **倒挂怪** | 倒挂着 | 🦇 |
| 幽灵 | **阿飘** / **没腿怪** | 飘着的 | 👻 |
| 邪教徒 | **中二病** / **cosplayer** | 很入戏 | 🧛 |
| 黑骑士 | **铁桶头** / **罐头精** | 全身盔甲 | 🗡️ |
| 巫妖 | **老不死** / **冻龄怪** | 活了很久 | 💀 |
| 暗影巨龙 | **大蜥蜴** / **喷火娃** | 其实是蜥蜴 | 🐉 |

### 5.4 卡牌命名

| 原名 | 蠢萌名 | 效果描述 |
|------|--------|----------|
| 打击 | **大嘴巴子** / **打脸** | 近战攻击 |
| 防御 | **举高高** / **抱头蹲** | 获得格挡 |
| 火球术 | **烤红薯** / **纵火** | 火焰伤害 |
| 冰冻 | **冻冰棍** / **急冻** | 冰冻控制 |
| 旋风斩 | **转圈圈** / **大风车** | AOE攻击 |
| 冲锋 | **莽过去** / **头铁** | 移动+伤害 |
| 治疗 | **贴创可贴** / **吹吹** | 回血 |
| 嘲讽 | **你来打我呀** / **略略略** | 吸引仇恨 |

### 5.5 地形命名

| 原名 | 蠢萌名 | 效果 |
|------|--------|------|
| 森林 | **躲猫猫林** | +防御 |
| 火坑 | **烤火区** / **温泉** | 持续伤害 |
| 毒沼 | **臭水沟** / **泥潭** | 减速+伤害 |
| 高地 | **高处不胜寒** | 射程优势 |
| 冰面 | **溜冰场** | 滑倒 |

### 5.6 UI元素命名

| 原名 | 蠢萌名 |
|------|--------|
| 开始游戏 | **开整** / **冲鸭** |
| 设置 | **调调** |
| 退出 | **溜了溜了** |
| 确定 | **欧了** / **搞起** |
| 取消 | **算了算了** |
| 背包 | **口袋** / **兜儿** |
| 地图 | **去哪儿** |
| 商店 | **买买买** / **小卖部** |

---

## 6. 组件规范

### 6.1 按钮组件

```css
/* 基础像素按钮 */
.btn-pixel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 18px;
  color: white;
  background: var(--color-primary);
  border: 4px solid rgba(0,0,0,0.3);
  box-shadow: 
    0 4px 0 rgba(0,0,0,0.3),
    inset -2px -2px 0 rgba(0,0,0,0.2),
    inset 2px 2px 0 rgba(255,255,255,0.2);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-pixel:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 0 rgba(0,0,0,0.3),
    inset -2px -2px 0 rgba(0,0,0,0.2),
    inset 2px 2px 0 rgba(255,255,255,0.2);
}

.btn-pixel:active {
  transform: translateY(2px);
  box-shadow: 
    0 2px 0 rgba(0,0,0,0.3),
    inset -2px -2px 0 rgba(0,0,0,0.2),
    inset 2px 2px 0 rgba(255,255,255,0.2);
}

/* 按钮变体 */
.btn-pixel--secondary { background: var(--color-secondary); }
.btn-pixel--accent { background: var(--color-accent); color: var(--color-bg-dark); }
.btn-pixel--danger { background: var(--color-hp); }
.btn-pixel--disabled { 
  background: #95A5A6; 
  cursor: not-allowed;
  opacity: 0.6;
}
```

### 6.2 卡片组件

```css
/* 游戏卡牌 */
.card-game {
  width: 120px;
  height: 160px;
  background: var(--color-bg-light);
  border: 4px solid;
  border-radius: 0;  /* 像素风无圆角 */
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

/* 费用徽章 */
.card-cost {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 32px;
  height: 32px;
  background: var(--color-energy);
  border: 3px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

/* 类型颜色 */
.card-game--attack { border-color: var(--color-hp); }
.card-game--defense { border-color: var(--color-block); }
.card-game--skill { border-color: var(--color-secondary); }
.card-game--move { border-color: var(--color-accent); }
.card-game--rare { 
  border-color: #9B59B6; 
  animation: rare-glow 2s infinite;
}

@keyframes rare-glow {
  0%, 100% { box-shadow: 0 0 5px #9B59B6; }
  50% { box-shadow: 0 0 20px #9B59B6, 0 0 30px #E74C3C; }
}
```

### 6.3 网格格子组件

```css
/* 战棋格子 */
.grid-cell {
  width: 64px;
  height: 64px;
  background: #34495E;
  border: 2px solid #2C3E50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  position: relative;
}

/* 地形样式 */
.grid-cell--forest { background: #27AE60; }
.grid-cell--fire { background: #E74C3C; animation: fire-flicker 1s infinite; }
.grid-cell--ice { background: #AED6F1; }
.grid-cell--high { 
  background: #D5DBDB;
  box-shadow: inset 0 -4px 0 rgba(0,0,0,0.2);  /* 高度感 */
}

/* 可移动标记 */
.grid-cell--reachable::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px dashed var(--color-secondary);
  animation: pulse 1s infinite;
}

/* 危险范围标记 */
.grid-cell--danger::before {
  content: '⚠️';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
}
```

### 6.4 动画规范

```css
/* 待机动画 */
@keyframes idle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 受伤抖动 */
@keyframes damage-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* 出现弹出 */
@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  80% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

/* 闪烁提示 */
@keyframes hint-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 浮动文字 */
@keyframes float-up {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
}

/* 使用 */
.entity-idle { animation: idle-bounce 2s infinite; }
.entity-damage { animation: damage-shake 0.3s; }
.card-draw { animation: pop-in 0.3s; }
.cell-hint { animation: hint-blink 1s infinite; }
.damage-number { animation: float-up 1s forwards; }
```

---

**文档版本**：v1.0  
**最后更新**：2026-03-07  
**下一步**：基于此UI规范，开始具体卡牌/物品/人物设计
