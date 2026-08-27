# 山河问武 / Wanderer's Path

一款基于 Vue 3 和 TypeScript 构建的单主角武侠挂机游戏。玩家通过吐纳积累内力，修炼境界、养成装备与功法，并在主线闯荡、秘境和武庙供奉之间建立长期成长循环。

## 主要内容

- 修炼：内力随时间持续恢复；手动或自动打坐消耗内力推进重数，九重圆满后突破下一大境界。
- 闯荡：按章节推进主线，包含普通关、精英关、多敌人战斗、重复挑战与自动闯荡。
- 战斗：以速度决定先后手，支持命中、闪避、暴击、连击、反击、眩晕、吸血、怒气与外功施放。
- 秘境：三条主题秘境路线，共八层挑战；消耗体力进入或扫荡，掉落丹药、宝石、装备、功法和养成材料。
- 武庙：以秘境产出的香火供奉五座神像，分别提升基础生命、攻击、防御、速度与吐纳速度。
- 装备：九个穿戴槽位、品质与套装效果、强化、洗炼、升阶，以及最多四孔的宝石镶嵌。
- 功法：可装配两本内功和两本外功；内功提供属性与战斗被动，外功在怒气充足时依次施放，并支持强化与升阶。
- 抽奖：装备匣与功法卷独立奖池，支持单抽和十连；结果以翻牌形式展示，重复物品保留用于后续升阶。
- 资源循环：银两用于商会与日常养成，琅玉用于抽奖和开孔；铸材、心得、精魄、洗炼石、宝石、丹药等均可通过玩法获得。
- 本地存档：进度保存在浏览器 `localStorage`，包含版本迁移与异常存档恢复处理。

## 技术栈

- Vue 3 + TypeScript
- Vite
- Element Plus
- Lucide Vue 图标
- Vitest

## 本地开发

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

若需要固定端口，可执行：

```bash
npm run dev -- --port 5174
```

常用校验命令：

```bash
npm run typecheck
npm test
npm run build
```

生产构建产物位于 `dist/`。本项目是纯前端单页应用，不需要 Node 服务端常驻进程或数据库。

## 内容与规则

```text
src/
  components/       页面、弹窗和交互组件
  data/             JSON 游戏内容、数值配置及其校验适配层
    realms.json       境界与修炼参数
    equipment.json    装备、部位与套装配置
    martial-arts.json 功法配置
    items.json        道具、丹药、宝石与材料配置
    lottery.json      奖池、概率与抽取配置
    dungeons.json     秘境层数、敌人、掉落与体力配置
    main-story.json   主线章节、关卡、敌人与奖励配置
    silver-shop.json  商会商品配置
    temple.ts         武庙神像配置
  domain/           纯业务规则：修炼、战斗、掉落、存档和数值计算
  App.vue            游戏状态编排
  styles.css         全局视觉与响应式样式
test/
  domain.test.ts     内容完整性、数值规则、存档迁移与玩法回归测试
```

`data/` 仅保存可配置内容及其运行时校验；`domain/` 负责计算、状态推进和存档兼容。新增装备、功法、道具、关卡或秘境内容时，优先修改对应 JSON，而非将数据写入业务逻辑。

### 核心数值约定

- 秘境体力每 5 分钟恢复 1 点；上限随境界从 24 提升至 48。
- 神像属于独立基础属性乘算区：`境界基础属性 × 神像倍率 × 其他百分比倍率 + 固定属性`。
- 武庙的归息神像提供固定吐纳速度，不与百分比倍率混算。
- 抽奖使用琅玉，单抽为 160 琅玉，仅支持单抽与十连。

## 静态部署

构建后将 `dist/` 中的文件发布到任意静态 Web 服务即可。以 Nginx 为例：

```nginx
server {
  listen 80;
  server_name game.example.com;

  root /var/www/wuxia-idle;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

发布流程：

```bash
npm ci
npm run build
rsync -av --delete dist/ deploy@your-server:/var/www/wuxia-idle/
```

注意：`rsync --delete` 会删除服务器目标目录中不在本次构建产物内的文件。部署前请确认目标目录只存放本项目静态文件。

## 存档说明

游戏进度仅保存在当前浏览器和当前站点域名下。清除浏览器站点数据、更换浏览器或更换域名都会创建新的本地存档；当前版本不包含账号登录或云端存档。
