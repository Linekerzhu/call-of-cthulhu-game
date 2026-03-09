# 深渊召唤 - 项目记忆文件

## 项目基本信息
- **项目名称**: 深渊召唤 (The Call of Cthulhu)
- **类型**: 克苏鲁主题战棋卡牌Roguelike游戏
- **技术栈**: 原生 JavaScript (ES5) + HTML5 + CSS3
- **版本**: v0.2.0
- **代码行数**: ~4,500 行

## 当前进度
- **已完成**: Day 7 (2026-03-08)
- **状态**: 克苏鲁主题改造完成，GitHub 发布准备完成

## 项目结构
```
shadow-tower/
├── src/                       # 源代码
│   ├── core/
│   │   └── Game.js           # 游戏核心类 (481行)
│   ├── systems/
│   │   ├── CombatSystem.js   # 战斗系统 (568行)
│   │   ├── RenderSystem.js   # 渲染系统 (1250行)
│   │   ├── InputSystem.js    # 输入系统 (877行)
│   │   └── AudioSystem.js    # 音效系统 (193行)
│   ├── data/
│   │   ├── Cards_Cthulhu.js  # 卡牌数据 (31张)
│   │   ├── Badges_Cthulhu.js # 徽章数据 (3个)
│   │   └── Shop.js           # 商店数据
│   ├── css/
│   │   ├── main.css          # 基础样式
│   │   └── cthulhu-theme.css # 克苏鲁主题
│   └── index.html            # 游戏入口
├── logs/                      # 开发日志 (day01-07)
├── docs/                      # 文档
├── README.md                  # 项目说明
├── LICENSE                    # MIT 许可证
├── .gitignore                 # Git 忽略配置
└── CODE_AUDIT.md             # 代码审核报告
```

## 核心系统

### 1. SAN值系统
- 6级理智状态: 理智清醒 → 彻底疯狂
- 理智过低会带来负面效果
- 攻击消耗理智，击败敌人恢复理智

### 2. 徽章系统
| 徽章 | 类型 | 特色 |
|------|------|------|
| 深渊使者 🐙 | 攻击型 | 疯狂值系统 |
| 旧日支配者 👁️ | 防御型 | 古老符文被动 |
| 黄衣信徒 🎭 | 控制型 | 诅咒控制 |

### 3. 卡牌系统
- 31张独特卡牌
- 4种类型: 攻击/防御/技能/移动
- 3种稀有度: 普通/稀有/传说

## 关键文件说明

### 游戏入口
```bash
./start-dev.sh              # 启动开发服务器
src/index.html              # 游戏主页面
```

### 核心逻辑
- `Game.js` - 游戏状态管理、场景切换
- `CombatSystem.js` - 战斗逻辑、敌人AI
- `InputSystem.js` - 输入处理、卡牌使用
- `RenderSystem.js` - 所有渲染逻辑

### 数据定义
- `Cards_Cthulhu.js` - 所有卡牌数据
- `Badges_Cthulhu.js` - 徽章定义和效果
- `Shop.js` - 商店商品配置

## 开发日志
- `logs/day01.md` - 项目搭建
- `logs/day02.md` - 状态管理
- `logs/day03.md` - 战棋系统
- `logs/day04-test.md` - 敌人系统
- `logs/day05-balance.md` - 卡牌平衡
- `logs/day06.md` - 战斗系统
- `logs/day07-cthulhu.md` - 克苏鲁改造

## 已知问题
1. ⚠️ 黄衣信徒被动效果需完善（20%恐惧几率）
2. ⚠️ 缺乏单元测试
3. ⚠️ 地图目前只有2层（可扩展为3层）

## GitHub 发布检查清单
- [x] README.md 完善
- [x] LICENSE 文件
- [x] .gitignore 配置
- [x] 代码注释完整
- [x] 审核报告生成
- [ ] 黄衣信徒被动完善（可选）
- [ ] 添加单元测试（可选）

## 常用命令
```bash
# 启动开发服务器
cd /Users/zhuxingyi/projects/shadow-tower && ./start-dev.sh

# 或使用 Python
python -m http.server 8000

# 查看日志
cat logs/day07-cthulhu.md
```

## 技术要点
- ES5 兼容写法（支持 Safari）
- Web Audio API 生成音效
- CSS Grid 和 Flexbox 布局
- DOM 操作优化

## 下一步开发计划
1. 完善黄衣信徒被动效果
2. 添加更多卡牌（目标50+）
3. 实现音效和背景音乐
4. 添加成就系统
5. 移动端触摸优化

---
**最后更新**: 2026-03-09  
**状态**: 已准备好 GitHub 发布
