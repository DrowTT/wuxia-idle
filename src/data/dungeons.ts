import type { Dungeon } from '../domain/types'

export const DUNGEONS: readonly Dungeon[] = [
  { id: 'sword-gate', name: '百门试剑', description: '固定关卡，首次通关奖励丰厚。', progress: '4 / 10', enemy: '试剑傀儡', enemyPower: 1240, tone: 'vermilion' },
  { id: 'bamboo-realm', name: '幽篁秘境', description: '层层深入，临时招式随机出现。', progress: '第 3 层', enemy: '幽篁守关人', enemyPower: 1320, tone: 'jade' },
  { id: 'jianghu-board', name: '江湖悬榜', description: '每日更换对手，验证你的构筑。', progress: '今日未战', enemy: '悬榜客', enemyPower: 1100, tone: 'gold' },
]
