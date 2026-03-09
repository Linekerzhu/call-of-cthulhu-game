# 🏰 暗影尖塔 (Shadow Tower) - 项目完整存档

> **版本**: v0.1.0 MVP  
> **状态**: ✅ 已完成  
> **存档时间**: 2026-03-08  
> **用途**: 系统重启后恢复开发状态

---

## 📁 项目结构

```
shadow-tower/
├── src/                          # 源代码目录
│   ├── index.html               # 主入口文件 (加载所有脚本)
│   ├── main.js                  # 程序入口 (初始化游戏)
│   ├── core/                    # 核心引擎
│   │   └── Game.js              # 游戏主类,状态管理,流程控制
│   ├── systems/                 # 游戏系统
│   │   ├── RenderSystem.js      # 渲染系统 (DOM操作,UI更新)
│   │   ├── InputSystem.js       # 输入系统 (点击,卡牌使用)
│   │   ├── CombatSystem.js      # 战斗系统 (回合,敌人AI)
│   │   └── AudioSystem.js       # 音效系统 (Web Audio API)
│   ├── data/                    # 游戏数据
│   │   ├── Cards.js             # 30张卡牌定义
│   │   └── Badges.js            # 2个徽章定义 + BadgeManager
│   └── css/
│       └── main.css             # 完整样式表 (含动画)
├── logs/                        # 开发日志
│   ├── day01.md                 # Day 1: 项目搭建
│   ├── day02.md                 # Day 2: 核心功能
│   ├── day03.md                 # Day 3: 功能完善
│   └── day04-test.md            # Day 4: 测试优化
├── docs/
│   └── PLAN_FINAL.md            # 最终开发计划
├── ARCHIVE.md                   # 本存档文件
└── start-dev.sh                 # 开发服务器脚本 (python3 -m http.server 8080)
```

---

## 🎮 核心功能清单

### ✅ 已实现系统

| 系统 | 功能描述 | 状态 |
|------|---------|------|
| **徽章系统** | 2个徽章(暴躁鸭/铁壳龟),被动技能,专属卡牌 | ✅ |
| **卡牌系统** | 30张卡牌,攻击/防御/技能/移动类型 | ✅ |
| **战斗系统** | 5x8网格,回合制,敌人AI | ✅ |
| **资源系统** | HP/能量/移动力/格挡/金币 | ✅ |
| **动画系统** | 伤害数字,死亡动画,被动效果弹窗 | ✅ |
| **音效系统** | 6种音效,Web Audio API合成 | ✅ |
| **奖励系统** | 战斗胜利选卡或金币 | ✅ |
| **UI系统** | 卡牌悬浮提示,攻击范围高亮 | ✅ |

### 🎯 游戏流程

```
开始游戏 → 徽章选择 → 地图探索 → 遭遇敌人 → 战斗
                                           ↓
游戏结束 ← 击败Boss ← 层数推进 ← 奖励选择 ← 胜利
```

---

## 🔧 技术栈与兼容性

### 技术规格
- **前端**: 纯HTML5/CSS3/JavaScript (ES5)
- **音频**: Web Audio API
- **样式**: CSS3动画 + 变量
- **兼容性**: Safari 9+, Chrome, Firefox

### ES5兼容要求
- ❌ 不使用 `const`, `let`, `class`, 箭头函数
- ❌ 不使用模板字符串 `` ` ``
- ❌ 不使用 `Object.assign()` (用循环复制)
- ✅ 使用 `var`, `function`, 字符串拼接
- ✅ CSS添加 `-webkit-` 前缀

---

## 📊 关键代码位置

### 游戏初始化
```javascript
// src/core/Game.js
function Game() {
    this.state = { phase: 'title', player: null, map: null, combat: null, floor: 0 };
    this.renderSystem = new RenderSystem(this);
    this.inputSystem = new InputSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.audioSystem = new AudioSystem(this);
}
```

### 玩家状态
```javascript
// src/core/Game.js: initPlayer()
player = {
    hp: 50, maxHp: 50,
    energy: 3, maxEnergy: 3,
    movement: 3, maxMovement: 3,  // 移动力
    agility: 3,
    block: 0,
    gold: 0,
    deck: [], hand: [], drawPile: [], discardPile: [],
    position: { row: 2, col: 0 },
    badge: null  // '暴躁鸭' 或 '铁壳龟'
}
```

### 卡牌数据结构
```javascript
// src/data/Cards.js
Cards = {
    '大嘴巴子': {
        name: '大嘴巴子',
        cost: 1,
        type: 'attack',
        damage: 6,
        range: 1,
        description: '造成6点伤害'
    }
    // ... 共30张
}
```

### 徽章数据结构
```javascript
// src/data/Badges.js
Badges = {
    '暴躁鸭': {
        id: '暴躁鸭',
        name: '暴躁鸭',
        icon: '🦆',
        type: 'attack',
        passive: '怒气系统',
        startingCards: ['气鼓鼓', '连环巴掌', '鸭鸭冲击']
    },
    '铁壳龟': {
        id: '铁壳龟',
        name: '铁壳龟',
        icon: '🐢',
        type: 'defense',
        passive: '龟壳守护',
        startingCards: ['缩壳', '壳击', '铁壁'],
        stats: { hpBonus: 10 }
    }
}
```

---

## 🎨 UI界面说明

### 屏幕结构
1. **screen-title** - 标题界面 (开始游戏)
2. **screen-badge** - 徽章选择
3. **screen-map** - 地图探索
4. **screen-combat** - 战斗界面
5. **screen-reward** - 战斗奖励
6. **screen-gameover** - 游戏结束

### 战斗界面元素
```html
<div class="combat-header">
    ❤️ HP / ⚡ 能量 / 👟 移动力 / 🛡️ 格挡 / 💰 金币 / 回合
</div>
<div id="grid">5x8网格</div>
<div id="combat-log">战斗日志</div>
<div id="hand-area">手牌区域</div>
<button id="btn-end-turn">结束回合</button>
```

---

## 🔊 音效事件绑定

| 事件 | 方法 | 音效类型 |
|------|------|---------|
| 攻击敌人 | `audioSystem.playAttack()` | 方波下降 |
| 移动 | `audioSystem.playMove()` | 正弦上升 |
| 使用卡牌 | `audioSystem.playCard()` | 三角波短音 |
| 获得格挡 | `audioSystem.playBlock()` | 锯齿波厚重 |
| 战斗胜利 | `audioSystem.playVictory()` | 上行和弦 |
| 游戏失败 | `audioSystem.playDefeat()` | 下行音阶 |
| 选择 | `audioSystem.playSelect()` | 高频短音 |

---

## 🐛 已知限制

1. **存档功能**: 尚未实现,刷新页面会丢失进度
2. **Boss战**: 敌人AI较简单,只有基础攻击
3. **商店系统**: 金币目前只能用于跳过奖励
4. **多语言**: 仅支持中文
5. **网络**: 纯单机,无多人功能

---

## 🚀 启动方式

```bash
# 方法1: 使用脚本
cd /Users/zhuxingyi/projects/shadow-tower
./start-dev.sh

# 方法2: 手动启动
cd /Users/zhuxingyi/projects/shadow-tower/src
python3 -m http.server 8080

# 浏览器访问
http://localhost:8080
```

---

## 📝 后续开发建议

### 高优先级
- [ ] 添加存档/读档功能 (localStorage)
- [ ] 完善Boss AI (增加技能)
- [ ] 实现商店系统
- [ ] 添加更多敌人种类

### 中优先级
- [ ] 成就系统
- [ ] 统计数据
- [ ] 新手引导
- [ ] 音效开关

### 低优先级
- [ ] 背景音乐
- [ ] 更多徽章 (4个→8个)
- [ ] 更多卡牌 (30张→50张)
- [ ] 多语言支持

---

## 💾 重启后恢复步骤

1. **启动服务器**
   ```bash
   cd /Users/zhuxingyi/projects/shadow-tower
   ./start-dev.sh
   ```

2. **浏览器访问**
   ```
   http://localhost:8080
   ```

3. **检查控制台**
   - 确保所有脚本加载成功
   - 检查是否有报错

4. **测试核心功能**
   - 开始游戏 → 选徽章 → 战斗 → 胜利

---

## 📞 问题排查

### 如果音效不工作
- 检查 Safari 是否允许自动播放
- 首次点击页面后才能播放音频

### 如果动画不显示
- 检查 CSS 是否加载
- 确认 `-webkit-` 前缀存在

### 如果卡牌无法打出
- 检查 Cards.js 是否先加载
- 查看控制台错误信息

---

**存档完成！可以安全重启系统。**

*项目路径: /Users/zhuxingyi/projects/shadow-tower*
