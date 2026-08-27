import {
  EQUIPMENT_ASCENSION_TOKEN_ID,
  LOTTERY_ASCENSION_TOKEN_ORANGE_RATE,
  LOTTERY_DRAW_COUNTS,
  LOTTERY_DRAW_COST,
  LOTTERY_EQUIPMENT_PRIZE_IDS,
  LOTTERY_GRADE_RATES,
  LOTTERY_HIGH_GRADE_PITY_MYTHIC_RATE,
  LOTTERY_MARTIAL_PRIZE_IDS,
  MARTIAL_ASCENSION_TOKEN_ID,
  getEquipmentById,
  getInventoryItemById,
  getMartialArtById,
} from '../data'
import { GRADE_ORDER } from '../data/lottery'
import type { GradeTone, LotteryDrawCount, LotteryDrawResult, LotteryPity, LotteryPoolId, LotteryReward, LotteryState, PlayerState } from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
}

function getRandomValue(random: () => number): number {
  const value = random()
  return Number.isFinite(value) ? Math.min(.999999999, Math.max(0, value)) : 0
}

function pickGradeTone(random: () => number): GradeTone {
  let progress = 0
  const value = getRandomValue(random) * 100
  for (const tone of GRADE_ORDER) {
    progress += LOTTERY_GRADE_RATES[tone]
    if (value < progress) return tone
  }
  return 'red'
}

function pickHighGradePityTone(random: () => number): Extract<GradeTone, 'orange' | 'red'> {
  return getRandomValue(random) < LOTTERY_HIGH_GRADE_PITY_MYTHIC_RATE / 100 ? 'red' : 'orange'
}

function pickPrizeId(ids: readonly string[], random: () => number): string {
  return ids[Math.min(ids.length - 1, Math.floor(getRandomValue(random) * ids.length))]!
}

function isPurpleOrBetter(tone: GradeTone): boolean {
  return GRADE_ORDER.indexOf(tone) >= GRADE_ORDER.indexOf('purple')
}

function isOrangeOrBetter(tone: GradeTone): boolean {
  return GRADE_ORDER.indexOf(tone) >= GRADE_ORDER.indexOf('orange')
}

export function getLotteryCost(count: LotteryDrawCount): number {
  return count * LOTTERY_DRAW_COST
}

export function getLotteryPity(lottery: LotteryState, pool: LotteryPoolId): LotteryPity {
  const pity = lottery?.pity?.[pool]
  return {
    noPurpleDraws: typeof pity?.noPurpleDraws === 'number' && Number.isFinite(pity.noPurpleDraws) ? clamp(Math.floor(pity.noPurpleDraws), 0, 9) : 0,
    noOrangeDraws: typeof pity?.noOrangeDraws === 'number' && Number.isFinite(pity.noOrangeDraws) ? clamp(Math.floor(pity.noOrangeDraws), 0, 49) : 0,
  }
}

export function drawLottery(
  player: PlayerState,
  lottery: LotteryState,
  pool: LotteryPoolId,
  count: LotteryDrawCount,
  random: () => number = Math.random,
  now = Date.now(),
): { player: PlayerState; lottery: LotteryState; result: LotteryDrawResult } | null {
  if (
    (pool !== 'equipment' && pool !== 'martial')
    || !LOTTERY_DRAW_COUNTS.includes(count)
    || !Number.isFinite(player.langyu)
    || player.langyu < getLotteryCost(count)
  ) return null

  let nextPlayer = { ...player, langyu: player.langyu - getLotteryCost(count) }
  let nextLottery: LotteryState = {
    ...lottery,
    pity: {
      equipment: { ...getLotteryPity(lottery, 'equipment') },
      martial: { ...getLotteryPity(lottery, 'martial') },
    },
    ownedEquipmentIds: Array.isArray(lottery.ownedEquipmentIds) ? [...lottery.ownedEquipmentIds] : [],
    ownedMartialArtIds: Array.isArray(lottery.ownedMartialArtIds) ? [...lottery.ownedMartialArtIds] : [],
    history: Array.isArray(lottery.history) ? [...lottery.history] : [],
  }
  const rewards: LotteryReward[] = []

  for (let index = 0; index < count; index += 1) {
    const pity = nextLottery.pity[pool]
    const tone = pity.noOrangeDraws >= 49 ? pickHighGradePityTone(random) : pity.noPurpleDraws >= 9 ? 'purple' : pickGradeTone(random)
    nextLottery.pity[pool] = {
      noPurpleDraws: isPurpleOrBetter(tone) ? 0 : pity.noPurpleDraws + 1,
      noOrangeDraws: isOrangeOrBetter(tone) ? 0 : pity.noOrangeDraws + 1,
    }
    const rewardId = `${now}-${pool}-${nextLottery.history.length + index}`
    const prizeIds = pool === 'equipment' ? LOTTERY_EQUIPMENT_PRIZE_IDS[tone] : LOTTERY_MARTIAL_PRIZE_IDS[tone]
    if (!prizeIds?.length) continue
    const tokenId = pool === 'equipment' ? EQUIPMENT_ASCENSION_TOKEN_ID : MARTIAL_ASCENSION_TOKEN_ID
    const ascensionTokenDraw = tone === 'orange' && getRandomValue(random) < LOTTERY_ASCENSION_TOKEN_ORANGE_RATE / 100
    if (ascensionTokenDraw) {
      const items = { ...(nextPlayer.items ?? {}) }
      items[tokenId] = Math.min(Number.MAX_SAFE_INTEGER, nonNegativeInteger(items[tokenId]) + 1)
      nextPlayer = { ...nextPlayer, items }
      const token = getInventoryItemById(tokenId)
      rewards.push({ id: rewardId, pool, kind: 'item', itemId: tokenId, name: token?.name ?? '升阶残印', grade: token?.grade ?? '传说', gradeTone: token?.gradeTone ?? 'orange', quantity: 1 })
      continue
    }
    const id = pickPrizeId(prizeIds, random)
    const source = pool === 'equipment' ? getEquipmentById(id) : getMartialArtById(id)
    if (!source) continue
    if (pool === 'equipment') nextLottery.ownedEquipmentIds.push(id)
    else nextLottery.ownedMartialArtIds.push(id)
    rewards.push({ id: rewardId, pool, kind: pool, itemId: id, name: source.name, grade: source.grade, gradeTone: tone, quantity: 1 })
  }

  const history = [...rewards.slice().reverse(), ...nextLottery.history].slice(0, 24)
  nextLottery = { ...nextLottery, history }
  return { player: nextPlayer, lottery: nextLottery, result: { id: now, pool, count, cost: getLotteryCost(count), rewards } }
}
