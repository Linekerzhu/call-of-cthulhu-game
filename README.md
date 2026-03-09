# 🐙 深渊召唤 (The Call of Cthulhu)

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/yourusername/call-of-cthulhu-game)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-Game-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)

> "那永恒长眠的并非亡者，在诡异的万古中，即使死亡本身亦会消逝。"

一款受克苏鲁神话启发的**Roguelike卡牌战棋游戏**，融合了《杀戮尖塔》的卡牌构筑机制和战棋游戏的策略移动。

![Game Screenshot](docs/screenshot.png)

## 🎮 游戏特色

### 🃏 独特的卡牌系统
- **30+ 张独特卡牌**，分为攻击、防御、技能、移动四大类型
- **卡牌升级系统**，增强卡牌效果
- **理智值(SAN)机制**，使用强力卡牌需要付出代价

### 🏅 三大徽章职业

| 徽章 | 图标 | 类型 | 特色 |
|------|------|------|------|
| **深渊使者** | 🐙 | 攻击型 | 疯狂值系统，累积疯狂释放毁灭性攻击 |
| **旧日支配者** | 👁️ | 防御型 | 古老符文，格挡反击，坚不可摧 |
| **黄衣信徒** | 🎭 | 控制型 | 诅咒控制，恐惧敌人，操控战局 |

### 🗺️ 策略战棋
- 5×8 网格战场
- 地形系统（疯狂之地会侵蚀理智）
- 移动与攻击的权衡

### 🧠 理智值(SAN)系统
- 6级理智状态，从清醒到疯狂
- 低理智会带来负面影响：
  - 卡牌费用增加
  - 伤害降低
  - 每回合失去能量
  - 无法获得格挡

### 👹 克苏鲁风格敌人
- **Boss**: 深渊领主（克苏鲁化身）
- **精英**: 深潜者祭司、修格斯、星之眷族
- **普通**: 深潜者、食尸鬼、古老者、夜魇等

## 🚀 快速开始

### 在线游玩
👉 [点击这里在线游玩](https://yourusername.github.io/call-of-cthulhu-game/)

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/call-of-cthulhu-game.git

# 进入目录
cd call-of-cthulhu-game/src

# 启动本地服务器（任选一种）
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

然后打开浏览器访问 `http://localhost:8000`

### 使用启动脚本
```bash
cd call-of-cthulhu-game
./start-dev.sh
```

## 🎯 游戏玩法

### 基础规则
1. **选择徽章** - 开始游戏时选择你的职业
2. **探索地图** - 在分支路线中选择你的道路
3. **战斗** - 使用卡牌击败敌人
4. **收集卡牌** - 战斗胜利后获得新卡牌
5. **管理理智** - 保持理智，避免陷入疯狂
6. **击败Boss** - 通关3层深渊

### 战斗机制
- 每回合抽取5张卡牌
- 使用能量打出卡牌
- 移动需要消耗移动力
- 格挡可以抵消伤害
- 攻击会消耗理智值

### 获胜技巧
- 平衡攻击与理智管理
- 利用地形优势
- 构筑协同的卡组
- 选择合适的路线（精英路线风险更高但奖励更丰厚）

## 🛠️ 技术栈

- **纯原生 JavaScript (ES5)** - 兼容性好，无需构建
- **HTML5** - 语义化标签
- **CSS3** - 现代样式，动画效果
- **Web Audio API** - 程序化生成音效

### 项目结构
```
src/
├── core/
│   └── Game.js          # 游戏核心类
├── systems/
│   ├── CombatSystem.js  # 战斗逻辑
│   ├── RenderSystem.js  # 渲染系统
│   ├── InputSystem.js   # 输入处理
│   └── AudioSystem.js   # 音效系统
├── data/
│   ├── Cards_Cthulhu.js # 卡牌数据
│   ├── Badges_Cthulhu.js# 徽章数据
│   └── Shop.js          # 商店数据
├── css/
│   ├── main.css         # 基础样式
│   └── cthulhu-theme.css# 克苏鲁主题
└── index.html           # 游戏入口
```

## 📱 兼容性

- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Chrome for Android

## 🗺️ 开发路线图

### Phase 1: 核心框架 ✅
- [x] 游戏循环和状态管理
- [x] 渲染系统
- [x] 输入系统

### Phase 2: 战棋系统 ✅
- [x] 网格和移动
- [x] 地形效果
- [x] 敌人AI

### Phase 3: 卡牌系统 ✅
- [x] 手牌系统
- [x] 能量系统
- [x] 卡牌效果

### Phase 4: 徽章与SAN值 ✅
- [x] 三大徽章
- [x] 理智值系统
- [x] 疯狂机制

### Phase 5: 地图与流程 ✅
- [x] 地图生成
- [x] 商店系统
- [x] 休息站

### Phase 6: 完善与优化 🔄
- [ ] 更多卡牌（目标50+）
- [ ] 更多敌人
- [ ] 音效和音乐
- [ ] 动画优化

### Phase 7: 未来计划
- [ ] 成就系统
- [ ] 排行榜
- [ ] 移动端优化
- [ ] 多语言支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交规范
- 使用 ESLint 检查代码风格
- 提交前确保游戏能正常运行
- 添加必要的注释
- 更新相关文档

## 📝 开发日志

查看 [logs/](logs/) 目录获取详细开发日志。

- [Day 1](logs/day01.md) - 项目搭建
- [Day 2](logs/day02.md) - 状态管理
- [Day 3](logs/day03.md) - 战棋系统
- [Day 4](logs/day04-test.md) - 敌人系统
- [Day 5](logs/day05-balance.md) - 卡牌平衡
- [Day 6](logs/day06.md) - 战斗系统
- [Day 7](logs/day07-cthulhu.md) - 克苏鲁改造

## 📄 许可证

[MIT License](LICENSE) © 2026 深渊召唤开发团队

## 🙏 致谢

- 灵感来源：《杀戮尖塔》(Slay the Spire)、《暗黑地牢》(Darkest Dungeon)
- 克苏鲁神话：H.P. Lovecraft
- 字体：Cinzel, Noto Serif SC

## 📧 联系我们

- 问题反馈: [GitHub Issues](https://github.com/yourusername/call-of-cthulhu-game/issues)
- 电子邮件: your.email@example.com

---

**🐙 愿古神庇佑你的理智... 或者不然。**
