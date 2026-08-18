import type { GradeTone, LotteryDrawCount, LotteryPoolId } from '../domain/types'
import { EQUIPMENT } from './equipment'
import { MARTIAL_ARTS } from './martial-arts'

export const LOTTERY_DRAW_COST = 160
export const LOTTERY_DRAW_COUNTS: readonly LotteryDrawCount[] = [1, 10]
export const LOTTERY_GRADE_RATES: Readonly<Record<GradeTone, number>> = {
  white: 43.7,
  green: 30,
  blue: 16,
  purple: 7,
  orange: 2.5,
  red: 0.8,
}
export const LOTTERY_GRADE_NAMES: Readonly<Record<GradeTone, string>> = {
  white: '普通', green: '优秀', blue: '精良', purple: '史诗', orange: '传说', red: '神话',
}
export const LOTTERY_POOL_META: Readonly<Record<LotteryPoolId, { label: string; description: string; shortDescription: string }>> = {
  equipment: { label: '兵器匣', description: '开匣可得江湖装备；传说与神话装备会化作碎片。', shortDescription: '装备与铸器残片' },
  martial: { label: '功法卷', description: '卷中藏有各路套路、心法与身法，可直接领悟。', shortDescription: '套路、心法与身法' },
}

export const GRADE_ORDER: readonly GradeTone[] = ['white', 'green', 'blue', 'purple', 'orange', 'red']
function createPrizeIds<T extends { id: string; gradeTone: GradeTone }>(items: readonly T[]): Readonly<Record<GradeTone, readonly string[]>> {
  return GRADE_ORDER.reduce((pools, tone) => {
    pools[tone] = items.filter((item) => item.gradeTone === tone).map((item) => item.id)
    return pools
  }, {} as Record<GradeTone, readonly string[]>)
}

export const LOTTERY_EQUIPMENT_PRIZE_IDS = createPrizeIds(EQUIPMENT)
export const LOTTERY_MARTIAL_PRIZE_IDS = createPrizeIds(MARTIAL_ARTS)
export const STARTER_EQUIPMENT_IDS = ['green-edge', 'bamboo-hat', 'cloud-vest', 'green-mane', 'goose-cloak', 'linen-belt', 'peace-talisman', 'jade-ring', 'iron-ring'] as const
export const STARTER_MARTIAL_ART_IDS = ['wind-sword', 'inner-breath', 'snow-step'] as const

export const LOTTERY_DUPLICATE_REWARDS: Readonly<Record<GradeTone, number>> = {
  white: 2, green: 4, blue: 7, purple: 12, orange: 20, red: 32,
}
export const LOTTERY_FRAGMENT_REQUIREMENTS: Readonly<Partial<Record<GradeTone, number>>> = { orange: 5, red: 10 }
