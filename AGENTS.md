# 深渊召唤 - 项目记忆文件

## 项目基本信息
- **项目名称**: 深渊召唤 (The Call of Cthulhu)
- **类型**: 克苏鲁主题战棋卡牌Roguelike游戏
- **技术栈**: 原生 JavaScript (ES5) + HTML5 + CSS3
- **版本**: v0.3.0

## 项目结构
```
call-of-cthulhu-game/
├── src/                       # 源代码
│   ├── core/
│   │   └── Game.js           # 游戏核心类
│   ├── systems/
│   │   ├── CombatSystem.js   # 战斗系统
│   │   ├── RenderSystem.js   # 渲染系统
│   │   ├── InputSystem.js    # 输入系统 + CardEffectEngine
│   │   └── AudioSystem.js    # 音效系统
│   ├── data/
│   │   ├── Cards_Cthulhu.js  # 卡牌数据 (数据驱动 effects 数组)
│   │   ├── Badges_Cthulhu.js # 徽章数据 (3个) + BadgeManager
│   │   └── Shop.js           # 商店数据
│   ├── css/
│   │   ├── main.css          # 基础样式
│   │   └── cthulhu-theme.css # 克苏鲁主题
│   ├── main.js               # 程序入口 + Utils 工具函数
│   └── index.html            # 游戏入口
├── docs/
│   └── changelog.md          # 变更日志
├── scripts/
│   ├── dev-server.py         # 开发服务器
│   └── sync.sh               # 同步脚本
├── README.md                  # 项目说明
├── LICENSE                    # MIT 许可证
├── .gitignore                 # Git 忽略配置
└── start-dev.sh               # 启动开发服务器
```

## 核心系统

### 1. 卡牌效果引擎 (CardEffectEngine)
- 数据驱动的卡牌效果处理器，位于 `InputSystem.js`
- 卡牌效果定义在 `effects` 数组中，由引擎自动执行
- 支持 18+ 种效果类型（targetDamage, gainBlock, heal, aoe 等）

### 2. SAN值系统
- 6级理智状态: 理智清醒 → 彻底疯狂
- 理智过低会带来负面效果（费用增加、伤害降低等）
- 攻击消耗理智，击败敌人恢复理智

### 3. 徽章系统
| 徽章 | 类型 | 特色 |
|------|------|------|
| 深渊使者 🐙 | 攻击型 | 疯狂值系统 |
| 旧日支配者 👁️ | 防御型 | 古老符文被动 |
| 黄衣信徒 🎭 | 控制型 | 诅咒控制（20%恐惧） |

## 关键文件说明

### 游戏入口
```bash
./start-dev.sh              # 启动开发服务器
src/index.html              # 游戏主页面
```

### 核心逻辑
- `Game.js` - 游戏状态管理、场景切换、SAN值系统
- `CombatSystem.js` - 战斗逻辑、敌人AI、碰撞检测
- `InputSystem.js` - 输入处理、CardEffectEngine、卡牌使用
- `RenderSystem.js` - 所有渲染逻辑

### 数据定义
- `Cards_Cthulhu.js` - 所有卡牌数据（数据驱动 effects 数组）
- `Badges_Cthulhu.js` - 徽章定义和效果
- `Shop.js` - 商店商品配置

## 已知问题
1. ⚠️ `献祭诱饵` 卡牌嘲讽效果未实现（effects 为空）
2. ⚠️ 缺乏自动化测试
3. ⚠️ RenderSystem 文件过大，可考虑拆分

## 常用命令
```bash
# 启动开发服务器
python -m http.server 8000

# 或使用启动脚本
./start-dev.sh
```

## 技术要点
- ES5 兼容写法（支持 Safari）
- Web Audio API 生成音效
- CSS Grid 和 Flexbox 布局
- 数据驱动卡牌效果系统 (CardEffectEngine)
- Utils.deepCopy 实现卡牌深拷贝

---
**最后更新**: 2026-03-10
