import rawContent from './lottery.json'
import { EQUIPMENT } from './equipment'
import { deepFreeze } from './freeze'
import { MARTIAL_ARTS } from './martial-arts'
import type { GradeTone, LotteryDrawCount, LotteryPoolId } from '../domain/types'

interface LotteryPoolMeta { label: string; description: string; shortDescription: string }
interface LotteryContent {
  drawCost: number
  drawCounts: readonly number[]
  highGradePityMythicRate: number
  ascensionTokenOrangeRate: number
  gradeRates: Readonly<Record<GradeTone, number>>
  gradeNames: Readonly<Record<GradeTone, string>>
  poolMeta: Readonly<Record<LotteryPoolId, LotteryPoolMeta>>
  gradeOrder: readonly GradeTone[]
}

const EXPECTED_GRADES: readonly GradeTone[] = ['white', 'green', 'blue', 'purple', 'orange', 'red']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPoolMeta(value: unknown, label: string): LotteryPoolMeta {
  if (!isRecord(value) || typeof value.label !== 'string' || !value.label.trim() || typeof value.description !== 'string' || !value.description.trim() || typeof value.shortDescription !== 'string' || !value.shortDescription.trim()) throw new Error(`抽奖配置无效：奖池 ${label} 的展示信息不完整。`)
  return { label: value.label, description: value.description, shortDescription: value.shortDescription }
}

function validateLotteryContent(value: unknown): LotteryContent {
  if (!isRecord(value)) throw new Error('抽奖配置无效：根节点必须是对象。')
  const gradeRates = value.gradeRates
  const gradeNames = value.gradeNames
  const poolMeta = value.poolMeta
  if (!isRecord(gradeRates) || !isRecord(gradeNames) || !isRecord(poolMeta)) throw new Error('抽奖配置无效：缺少品质或奖池配置。')
  const drawCost = value.drawCost
  const drawCounts = value.drawCounts
  if (typeof drawCost !== 'number' || !Number.isFinite(drawCost) || drawCost <= 0 || !Number.isInteger(drawCost)) throw new Error('抽奖配置无效：单抽价格必须是正整数。')
  if (!Array.isArray(drawCounts) || drawCounts.length !== 2 || drawCounts.some((count) => !Number.isInteger(count) || count <= 0) || !drawCounts.includes(1) || !drawCounts.includes(10)) throw new Error('抽奖配置无效：抽奖次数必须包含 1 抽和 10 抽。')
  const validatedRates = {} as Record<GradeTone, number>
  const validatedNames = {} as Record<GradeTone, string>
  for (const grade of EXPECTED_GRADES) {
    const rate = gradeRates[grade]
    const name = gradeNames[grade]
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || typeof name !== 'string' || !name.trim()) throw new Error(`抽奖配置无效：品质 ${grade} 的概率或名称不合法。`)
    validatedRates[grade] = rate
    validatedNames[grade] = name
  }
  const totalRate = EXPECTED_GRADES.reduce((total, grade) => total + validatedRates[grade], 0)
  if (Math.abs(totalRate - 100) > 0.0001) throw new Error(`抽奖配置无效：品质概率总和必须为 100，目前为 ${totalRate}。`)
  const validatedPoolMeta = { equipment: readPoolMeta(poolMeta.equipment, 'equipment'), martial: readPoolMeta(poolMeta.martial, 'martial') }
  const highGradePityMythicRate = value.highGradePityMythicRate
  const ascensionTokenOrangeRate = value.ascensionTokenOrangeRate
  if (typeof highGradePityMythicRate !== 'number' || !Number.isFinite(highGradePityMythicRate) || highGradePityMythicRate < 0 || highGradePityMythicRate > 100 || typeof ascensionTokenOrangeRate !== 'number' || !Number.isFinite(ascensionTokenOrangeRate) || ascensionTokenOrangeRate < 0 || ascensionTokenOrangeRate > 100) throw new Error('抽奖配置无效：保底或升阶材料概率必须介于 0 和 100 之间。')
  const gradeOrder = value.gradeOrder
  if (!Array.isArray(gradeOrder) || gradeOrder.length !== EXPECTED_GRADES.length || gradeOrder.some((grade, index) => grade !== EXPECTED_GRADES[index])) throw new Error('抽奖配置无效：品质顺序不合法。')
  return { drawCost, drawCounts, highGradePityMythicRate, ascensionTokenOrangeRate, gradeRates: validatedRates, gradeNames: validatedNames, poolMeta: validatedPoolMeta, gradeOrder: gradeOrder as GradeTone[] }
}

const content = validateLotteryContent(rawContent)
export const LOTTERY_DRAW_COST = content.drawCost
export const LOTTERY_DRAW_COUNTS: readonly LotteryDrawCount[] = content.drawCounts as readonly LotteryDrawCount[]
/** Applied only when the 50-draw high-grade pity is triggered. */
export const LOTTERY_HIGH_GRADE_PITY_MYTHIC_RATE = content.highGradePityMythicRate
/** Share of legendary results reserved for an ascension replacement material. */
export const LOTTERY_ASCENSION_TOKEN_ORANGE_RATE = content.ascensionTokenOrangeRate
export const LOTTERY_GRADE_RATES: Readonly<Record<GradeTone, number>> = Object.freeze({ ...content.gradeRates })
export const LOTTERY_GRADE_NAMES: Readonly<Record<GradeTone, string>> = Object.freeze({ ...content.gradeNames })
export const LOTTERY_POOL_META: Readonly<Record<LotteryPoolId, LotteryPoolMeta>> = Object.freeze({
  equipment: Object.freeze({ ...content.poolMeta.equipment }),
  martial: Object.freeze({ ...content.poolMeta.martial }),
})
export const GRADE_ORDER: readonly GradeTone[] = Object.freeze([...content.gradeOrder])

function createPrizeIds<T extends { id: string; gradeTone: GradeTone }>(items: readonly T[]): Readonly<Record<GradeTone, readonly string[]>> {
  return GRADE_ORDER.reduce((pools, tone) => {
    pools[tone] = items.filter((item) => item.gradeTone === tone).map((item) => item.id)
    return pools
  }, {} as Record<GradeTone, readonly string[]>)
}

export const LOTTERY_EQUIPMENT_PRIZE_IDS = deepFreeze(createPrizeIds(EQUIPMENT))
export const LOTTERY_MARTIAL_PRIZE_IDS = deepFreeze(createPrizeIds(MARTIAL_ARTS))
export const STARTER_EQUIPMENT_IDS = ['green-edge', 'bamboo-hat', 'cloud-vest', 'green-mane', 'goose-cloak', 'linen-belt', 'peace-talisman', 'jade-ring', 'iron-ring'] as const
export const STARTER_MARTIAL_ART_IDS = ['wind-sword', 'inner-breath', 'snow-step'] as const
