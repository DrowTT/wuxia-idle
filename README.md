# 山河问武 / Wanderer's Path

基于 Vue 3 + TypeScript 的单主角武侠挂机游戏前端 MVP。玩家通过修炼积累内力和养成资源，再用完整但简洁呈现的回合战斗挑战关卡与秘境。

## 当前能力

- 常驻修炼：在线与离线均持续积累内力
- 境界成长：打坐消耗内力推进当前重数，进度满后自动提升小境界
- 自动修炼：内力足够时每秒自动打坐一次，九重后手动突破大境界
- 基于时间戳的离线进度和本地存档
- 主线关卡、秘境、自动回合战斗和奖励结算
- 兵器切换、功法装配、资源与记录页面
- 货币分为常规的银两与稀缺的琅玉：银两用于日常养成，琅玉用于兵器匣和功法卷抽取
- 桌面与移动端响应式布局

## 开发

```bash
npm install
npm run dev
```

类型检查、规则测试与生产构建：

```bash
npm run typecheck
npm test
npm run build
```

## 目录

```text
src/
  components/     页面和交互组件
  data/           可编辑的游戏内容与数值配置
    realms.ts       境界、修炼成长参数
    equipment.ts    装备槽位与装备定义
    martial-arts.ts 功法定义
    lottery.ts      奖池、概率、碎片与初始拥有内容
    main-story.json 逐章敌人基础属性、关卡规则与奖励参数
    main-story.ts   JSON 配置的校验、查询与派生适配层
    dungeons.ts     秘境内容
    balance.ts      战斗与基础属性数值
    initial-state.ts 新档初始角色、穿戴和日志
  domain/         修炼、存档、战斗等纯业务规则
  App.vue         应用状态编排
  styles.css      项目视觉与响应式样式
```

`data/` 只承载可配置内容和数值；`domain/` 只负责计算、校验、状态推进和存档兼容。主线的每一章均在 `main-story.json` 中直接定义，章节内只做该章配置的轻微线性增长。前端仍可从 `domain/game.ts` 导入既有常量，保持现有调用不变；新增功能应优先直接依赖 `data/` 中对应模块。

参考项目只用于分析放置游戏的闭环。本项目没有复用其组件、状态结构、数值配置或页面代码。
