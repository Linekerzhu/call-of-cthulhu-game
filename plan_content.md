# 🎨 暗影尖塔 内容设计文档

> **文档用途**：所有游戏内容的具体设计  
> **包含**：卡牌数据、敌人数据、道具数据、事件数据、台词设计  

---

## 🃏 卡牌详细设计

### 1. 基础卡（6张）

#### 【大嘴巴子】
```yaml
id: basic_attack
cost: 1
type: attack
rarity: basic
icon: 👊
name: 大嘴巴子
description: "正宗降龙十八掌第一式"
effect: 造成6点伤害
upgrade: 造成9点伤害
flavor: "打人不打脸，除非忍不住"
```

#### 【抱头蹲】
```yaml
id: basic_defend
cost: 1
type: defense
rarity: basic
icon: 🛡️
name: 抱头蹲
description: "只要我蹲得够快，伤害就追不上我"
effect: 获得5点格挡
upgrade: 获得8点格挡
flavor: "这是战术性撤退，不是怂"
```

#### 【溜了溜了】
```yaml
id: basic_move
cost: 1
type: move
rarity: basic
icon: 💨
name: 溜了溜了
description: "三十六计走为上计"
effect: 移动2格，抽1张卡
upgrade: 移动3格，抽1张卡
flavor: "我不是逃跑，是战略转移"
```

#### 【脑白金】
```yaml
id: item_heal
cost: 0
type: skill
rarity: basic
icon: 💊
name: 脑白金
description: "今年过节不收礼，收礼只收..."
effect: 恢复6HP，消耗品（每场战斗限3次）
upgrade: 恢复9HP
flavor: "补补脑子，顺便补补血"
```

#### 【零花钱】
```yaml
id: item_energy
cost: 0
type: skill
rarity: basic
icon: ⚡
name: 零花钱
description: "妈，再给点呗"
effect: 本回合+1能量，消耗品
upgrade: 本回合+2能量
flavor: "有钱能使鬼推磨"
```

#### 【来打我呀】
```yaml
id: basic_taunt
cost: 1
type: skill
rarity: basic
icon: 😛
name: 来打我呀
description: "你过来啊！"
effect: 嘲讽，所有敌人下回合必打你
upgrade: 同时获得5点格挡
flavor: "优秀的坦克要学会拉仇恨"
```

---

### 2. 暴躁鸭徽章卡（6张）

徽章效果：**怒气** - 每失去1HP获得1点怒气，怒气+5%伤害

#### 【气鼓鼓】
```yaml
id: rage_starter
cost: 0
type: skill
rarity: common
badge: 暴躁鸭
icon: 😤
name: 气鼓鼓
description: "越想越气，气死我了"
effect: 本回合每打出1张攻击卡，+1力量
upgrade: 每打出1张攻击卡，+2力量
combo: 【连环巴掌】→【抓狂】→无限攻击
```

#### 【连环巴掌】
```yaml
id: rage_combo
cost: 1
type: attack
rarity: common
badge: 暴躁鸭
icon: 👋
name: 连环巴掌
description: "左一个右一个，打到你妈都不认识"
effect: 造成4点伤害，本回合已打出2张卡则抽1张
upgrade: 造成5点伤害，已打出2张卡抽2张
combo: 配合气鼓鼓，快速过牌叠加力量
```

#### 【抓狂】
```yaml
id: rage_burst
cost: 2
type: skill
rarity: rare
badge: 暴躁鸭
icon: 🤬
name: 抓狂
description: "我不活了！你们也别想活！"
effect: 本回合所有攻击卡费用变为0
upgrade: 同时获得3点怒气
flavor: "今天谁都别拦着我"
```

#### 【鸭鸭冲击】（专属）
```yaml
id: rage_exclusive_1
cost: 1
type: attack
rarity: rare
badge: 暴躁鸭
icon: 🦆
name: 鸭鸭冲击
description: "愤怒的小鸭向前冲！"
effect: 造成8点伤害，失去3HP
upgrade: 造成12点伤害，失去3HP
flavor: "冲鸭！字面意义上的"
```

#### 【愤怒啄击】（专属）
```yaml
id: rage_exclusive_2
cost: 0
type: skill
rarity: uncommon
badge: 暴躁鸭
icon: 🐤
name: 愤怒啄击
description: "啄啄啄啄啄！"
effect: 失去5HP，获得2能量
upgrade: 失去5HP，获得3能量
flavor: "以血换蓝，血赚"
```

#### 【暴走旋风】（专属）
```yaml
id: rage_finisher
cost: 2
type: attack
rarity: rare
badge: 暴躁鸭
icon: 🌪️
name: 暴走旋风
description: "我像风一样自由~"
effect: 消耗所有怒气，每点怒气造成1点AOE伤害
upgrade: 每点怒气造成1.5点AOE伤害
flavor: "怒气值MAX时的终极奥义"
```

---

### 3. 铁壳龟徽章卡（6张）

徽章效果：**守护** - 与纸片人相邻时，50%替其承伤

#### 【缩壳】
```yaml
id: turtle_defend
cost: 1
type: defense
rarity: common
badge: 铁壳龟
icon: 🐢
name: 缩壳
description: "只要我缩得够紧"
effect: 获得8点格挡
upgrade: 获得12点格挡
flavor: "龟壳是个好东西"
```

#### 【壳击】
```yaml
id: turtle_counter
cost: 1
type: attack
rarity: common
badge: 铁壳龟
icon: 🔨
name: 壳击
description: "以彼之道还施彼身"
effect: 造成等同于当前格挡值的伤害，失去格挡
upgrade: 造成格挡值×1.5的伤害
flavor: "最好的防守是防守反击"
```

#### 【反弹】
```yaml
id: turtle_reflect
cost: 2
type: defense
rarity: uncommon
badge: 铁壳龟
icon: ↩️
name: 反弹
description: "你打我也疼"
effect: 获得5点格挡，被攻击时反弹3点伤害
upgrade: 获得8点格挡，反弹5点伤害
flavor: "刺猬般的男人"
```

#### 【铁壁】（专属）
```yaml
id: turtle_exclusive_1
cost: 2
type: defense
rarity: uncommon
badge: 铁壳龟
icon: 🧱
name: 铁壁
description: "岿然不动"
effect: 获得12点格挡
upgrade: 获得18点格挡
flavor: "来啊，谁怕谁"
```

#### 【守护壳】（专属）
```yaml
id: turtle_exclusive_2
cost: 1
type: defense
rarity: uncommon
badge: 铁壳龟
icon: 🛡️
name: 守护壳
description: "我的小弟我罩着"
effect: 为相邻纸片人提供8点格挡
upgrade: 提供12点格挡，同时给自己4点
flavor: "大哥的责任"
```

#### 【绝对防御】（专属）
```yaml
id: turtle_finisher
cost: 3
type: defense
rarity: rare
badge: 铁壳龟
icon: ⭐
name: 绝对防御
description: "无敌是多么寂寞"
effect: 获得20点格挡，免疫下回合所有debuff
upgrade: 获得30点格挡，同时下回合格挡保留
flavor: "这回合谁也别想动我"
```

---

### 4. 泡泡鱼徽章卡（6张）

徽章效果：**元素精通** - 每打出3张元素卡，自动释放元素冲击（3点AOE）

#### 【吐泡泡】
```yaml
id: fish_burn
cost: 0
type: skill
rarity: common
badge: 泡泡鱼
icon: 🫧
name: 吐泡泡
description: "咕噜咕噜咕噜"
effect: 施加3层湿哒哒（回合结束-3HP，持续3回合）
upgrade: 施加5层湿哒哒
flavor: "洗洗澡，更健康"
```

#### 【结冰碴】
```yaml
id: fish_freeze
cost: 1
type: skill
rarity: common
badge: 泡泡鱼
icon: 🧊
name: 结冰碴
description: "冷冷的冰雨在脸上胡乱地拍"
effect: 造成3点伤害，冻结1回合（跳过敌人回合）
upgrade: 造成5点伤害，冻结1回合
flavor: "冻住，不许走"
```

#### 【放电鳗】
```yaml
id: fish_shock
cost: 1
type: skill
rarity: uncommon
badge: 泡泡鱼
icon: ⚡
name: 放电鳗
description: "十万伏特！"
effect: 施加麻酥酥，受到攻击时额外+2伤害
upgrade: 额外+3伤害，同时造成3点伤害
flavor: "导电性能良好"
```

#### 【泡泡盾】（专属）
```yaml
id: fish_exclusive_1
cost: 1
type: skill
rarity: uncommon
badge: 泡泡鱼
icon: 🛡️
name: 泡泡盾
description: "复制粘贴"
effect: 复制上一张元素卡的效果
upgrade: 复制上一张卡并费用-1
flavor: "Ctrl+C Ctrl+V"
```

#### 【水溅跃】（专属）
```yaml
id: fish_exclusive_2
cost: 0
type: skill
rarity: uncommon
badge: 泡泡鱼
icon: 💦
name: 水溅跃
description: "并没有什么效果...等等好像有？"
effect: 失去3HP，本回合元素卡伤害+50%
upgrade: 失去3HP，元素卡伤害+75%
flavor: "自残是一种艺术"
```

#### 【海啸】（专属）
```yaml
id: fish_finisher
cost: 3
type: attack
rarity: rare
badge: 泡泡鱼
icon: 🌊
name: 海啸
description: "让暴风雨来得更猛烈些吧"
effect: 对所有敌人造成10点伤害
upgrade: 造成15点伤害，并施加2层湿哒哒
flavor: "大海无量"
```

---

### 5. 跳跳兔徽章卡（6张）

徽章效果：**灵动** - 每移动2格，抽1张卡（每回合最多3次）

#### 【蹦跶】
```yaml
id: rabbit_move
cost: 0
type: move
rarity: common
badge: 跳跳兔
icon: 🐰
name: 蹦跶
description: "兔子跳，跳跳跳"
effect: 移动3格，抽1张卡
upgrade: 移动3格，抽2张卡
flavor: "移动=过牌=无限可能"
```

#### 【路过踩一脚】
```yaml
id: rabbit_pass
cost: 1
type: attack
rarity: common
badge: 跳跳兔
icon: 👟
name: 路过踩一脚
description: "我就路过，顺便踩一脚"
effect: 移动后使用：对路径上所有敌人造成5点伤害
upgrade: 造成7点伤害
flavor: "此路是我开，此树是我栽"
```

#### 【后跳踢】
```yaml
id: rabbit_kick
cost: 1
type: attack
rarity: common
badge: 跳跳兔
icon: 🦶
name: 后跳踢
description: "佛山无影脚"
effect: 后退2格，造成6点伤害
upgrade: 后退2格，造成9点伤害
flavor: "以退为进"
```

#### 【兔子蹬鹰】（专属）
```yaml
id: rabbit_exclusive_1
cost: 2
type: attack
rarity: uncommon
badge: 跳跳兔
icon: 🥋
name: 兔子蹬鹰
description: "兔子急了也会咬人"
effect: 瞬移到任意位置，造成10点伤害
upgrade: 造成14点伤害，下回合+1移动力
flavor: "闪现！你没看错"
```

#### 【疾跑】（专属）
```yaml
id: rabbit_exclusive_2
cost: 0
type: move
rarity: uncommon
badge: 跳跳兔
icon: 💨
name: 疾跑
description: "脚底抹油"
effect: 本回合移动力+3
upgrade: 移动力+3，抽1张卡
flavor: "一溜烟就没影了"
```

#### 【三连跳】（专属）
```yaml
id: rabbit_finisher
cost: 2
type: attack
rarity: rare
badge: 跳跳兔
icon: 🦘
name: 三连跳
description: "蹦蹦蹦"
effect: 瞬移3次，每次落点对周围造成4点AOE伤害
upgrade: 瞬移3次，每次造成6点AOE
flavor: "全场乱窜，你抓不到我"
```

---

## 👹 敌人详细设计

### 普通敌人（6种）

#### 【果冻怪】
```yaml
name: 果冻怪
icon: 🟢
hp: 15
attack: 5
moves:
  - 撞击: 造成5点伤害
  - 弹弹弹: 获得3点格挡
flavor: "Q弹可口，但别真的吃"
intent_pattern: [撞击, 撞击, 弹弹弹]
```

#### 【吵吵怪】
```yaml
name: 吵吵怪
icon: 👺
hp: 20
attack: 6
moves:
  - 吵闹: 造成6点伤害
  - 大喊: 施加1层虚弱
flavor: "啊啊啊啊啊啊啊！"
dialogue: ["我要吵死你！", "听不见听不见！", "啦啦啦啦啦！"]
```

#### 【骨头架子】
```yaml
name: 骨头架子
icon: 💀
hp: 18
attack: 7
moves:
  - 骨刺: 造成7点伤害
  - 散架: 死亡后有30%概率复活（10HP）
flavor: "瘦得只剩骨头了"
```

#### 【绿皮怪】
```yaml
name: 绿皮怪
icon: 👹
hp: 25
attack: 8
moves:
  - 猛击: 造成8点伤害
  - 乱砸: 造成5点伤害×2
flavor: "好久没洗澡了"
```

#### 【倒挂怪】
```yaml
name: 倒挂怪
icon: 🦇
hp: 12
attack: 5
moves:
  - 俯冲: 造成5点伤害
  - 吸血: 造成3点伤害，恢复3HP
special: 可以飞过障碍物
flavor: "其实有点晕"
```

#### 【阿飘】
```yaml
name: 阿飘
icon: 👻
hp: 16
attack: 6
moves:
  - 吓唬: 造成6点伤害
  - 穿墙: 无视地形移动
special: 50%闪避物理攻击
flavor: " Boo！吓到你了吧"
```

### 精英敌人（2种）

#### 【中二病】
```yaml
name: 中二病
icon: 🧛
hp: 35
attack: 10
moves:
  - 黑暗之力: 蓄力（下回合伤害×2）
  - 毁灭吧: 造成10点伤害（蓄力后20点）
  - 诅咒: 施加易伤
flavor: "吾乃暗夜之主...算了太羞耻了"
```

#### 【铁桶头】
```yaml
name: 铁桶头
icon: 🗡️
hp: 40
attack: 9
moves:
  - 重劈: 造成9点伤害
  - 铁壁: 获得15点格挡
  - 反击: 下回合被攻击时反击
flavor: "头铁，真的铁"
```

### Boss（3种）

#### 【大果冻】（第1层Boss）
```yaml
name: 大果冻
icon: 👑
hp: 60
phases: 2
phase_1:
  moves:
    - 弹跳: 造成8点伤害
    - 碾压: 造成12点伤害
  threshold: 70% HP
phase_2:
  description: "分裂成3个小果冻（各20HP）"
  moves:
    - 集体冲撞: 每个小果冻造成5点伤害
  mechanic: 必须同时击杀，否则复活
flavor: "一家人就要整整齐齐"
```

#### 【喷火娃】（第2层Boss）
```yaml
name: 喷火娃
icon: 🐉
hp: 80
phases: 2
phase_1:
  description: "在天上飞"
  special: 只能远程攻击命中
  moves:
    - 龙息: 直线3格范围，造成10点伤害
    - 火球: 随机位置投掷，造成8点伤害
  threshold: 50% HP
phase_2:
  description: "降落到地面"
  moves:
    - 龙爪: 造成15点伤害
    - 甩尾: 周围2格AOE，造成10点伤害
    - 飞天: 3回合后飞回天上
flavor: "其实只是个会喷火的大蜥蜴"
```

#### 【老不死】（第3层Boss）
```yaml
name: 老不死
icon: 💀
hp: 100
phases: 3
phase_1:
  moves:
    - 死亡一指: 造成12点伤害
    - 召唤小弟: 召唤2个骨头架子
  threshold: 70% HP
phase_2:
  description: "获得护盾"
  special: 获得20点格挡，必须先破盾
  moves:
    - 生命吸取: 造成10点伤害，恢复10HP
  threshold: 40% HP
phase_3:
  description: "狂暴"
  special: 伤害+50%，但受到的伤害+50%
  moves:
    - 毁天灭地: 全场AOE，造成15点伤害
flavor: "活了几百年，该歇歇了"
```

---

## 💬 蠢萌台词设计

### 玩家受伤时
- "哎哟！"
- "疼疼疼..."
- "你给我等着！"
- "这仇我记下了"
- "哎呀我的老腰"

### 打出高伤害时
- "吃我一招！"
- "看招！"
- "这就是实力！"
- "大意了吧~"
- "没想到吧！"

### 敌人被打败时
- "我还会回来的~"
- "啊我死了..."
- "下次再算账！"
- "出师不利..."
- "这是意外！"

### 使用道具时
- "脑白金，好吃！"
- "充个电先~"
- "有钱任性！"
- "留着青山在..."

### 开始战斗时
- "来了老弟~"
- "让我会会你！"
- "准备接招！"
- "今天运势不错~"

---

## 📦 道具设计

### 消耗品

#### 【脑白金】
```yaml
name: 脑白金
effect: 恢复6HP
max_carry: 3
shop_price: 25
description: "补脑又补血"
```

#### 【红牛】
```yaml
name: 红牛
effect: 本回合+1能量
max_carry: 3
shop_price: 20
description: "你的能量超乎你想象"
```

#### 【炸弹】
```yaml
name: 二踢脚
effect: 对单个敌人造成15点伤害
max_carry: 2
shop_price: 35
description: "一点就炸"
```

### 金币
```yaml
name: 零花钱
icon: 🪙
description: "可以买糖吃"
```

---

**文档版本**：v1.0  
**内容数量**：30张卡，8种普通敌人，2种精英，3个Boss，3种道具  
**状态**：待开发实现
