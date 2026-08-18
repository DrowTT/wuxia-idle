import {
  COMBAT_SPEED_GROWTH_EXPONENT,
  COMBAT_BALANCE,
  COMBAT_STAT_LEVEL_GROWTH,
  COMBAT_STAT_REALM_BREAKTHROUGH_BONUS,
  DEFAULT_COMBAT_STATS,
  EQUIPMENT,
  EQUIPMENT_SETS,
  EQUIPMENT_SLOTS,
  GRADE_ORDER,
  INNER_FORCE_PER_SECOND,
  LOTTERY_DRAW_COST,
  LOTTERY_DRAW_COUNTS,
  LOTTERY_DUPLICATE_REWARDS,
  LOTTERY_EQUIPMENT_PRIZE_IDS,
  LOTTERY_FRAGMENT_REQUIREMENTS,
  LOTTERY_GRADE_NAMES,
  LOTTERY_GRADE_RATES,
  LOTTERY_MARTIAL_PRIZE_IDS,
  MAIN_STORY_CHAPTERS,
  MARTIAL_ARTS,
  MAX_CULTIVATION_OFFLINE_MS,
  MAX_DODGE_RATE,
  MARTIAL_ENHANCEMENT_STEP,
  PRACTICE_FULL_LEVEL_BASE_COST,
  PRACTICE_PROGRESS_MAX,
  PRACTICE_PROGRESS_PER_ACTION,
  PRACTICE_REALM_COST_MULTIPLIER,
  REALMS,
  REALM_INNER_FORCE_RATE_MULTIPLIER,
  SMALL_REALM_COST_GROWTH,
  SMALL_REALM_INNER_FORCE_RATE_MULTIPLIER,
  STARTER_EQUIPMENT_IDS,
  STARTER_MARTIAL_ART_IDS,
  INITIAL_EQUIPMENT_LOADOUT,
  INITIAL_DAILY_CHECK_IN,
  DAILY_CHECK_IN_REWARD,
  INITIAL_GAME_LOGS,
  INITIAL_PLAYER_PROFILE,
} from '../data'
import {
  COMMON_ENEMY_NAMES,
  ELITE_ENEMY_NAMES,
  MULTI_ENEMY_SUFFIXES,
  MAIN_STAGE_REWARDS,
  getMainStoryChapterConfig,
  getMainStageEnemyStatsGrowth,
  getMainStageRewardBalance,
} from '../data/main-story'
import type {
  CultivationState,
  CombatStats,
  Equipment,
  EquipmentCategory,
  EquipmentLoadout,
  EquippedEquipment,
  EquipmentSlot,
  GradeTone,
  GameState,
  GameLog,
  MartialArt,
  MainStage,
  MainStageEnemy,
  MainStageReplayReward,
  MainStageReward,
  LotteryDrawCount,
  LotteryDrawResult,
  LotteryPoolId,
  LotteryPity,
  LotteryReward,
  LotteryState,
  Realm,
  RealmId,
  JourneyState,
  CombatPassiveEffect,
  EquipmentSet,
  MartialActiveSkill,
  MartialArtKind,
  MartialArtLoadout,
  MartialArtSlot,
  WeaponStyle,
} from './types'

export * from '../data'

const SAVE_KEY = 'shanhe-wuwen-save'
const CURRENT_GAME_VERSION = 13
const LANGYU_CURRENCY_VERSION = 11
const LEGACY_LANGYU_DRAW_COST = 1
const PRACTICE_ACTIONS_PER_LEVEL = Math.ceil(PRACTICE_PROGRESS_MAX / PRACTICE_PROGRESS_PER_ACTION)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)))
}

function migrateLangyuBalance(value: unknown, savedVersion: number, fallback: number): number {
  const balance = nonNegativeInteger(value, fallback)
  if (savedVersion >= LANGYU_CURRENCY_VERSION) return balance
  return Math.min(Number.MAX_SAFE_INTEGER, balance * (LOTTERY_DRAW_COST / LEGACY_LANGYU_DRAW_COST))
}

function dateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : null
}

function boundedText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback
  const text = value.trim()
  return text ? text.slice(0, maxLength) : fallback
}

export function normalizeCombatStats(stats: Partial<CombatStats> | undefined): CombatStats {
  const source = stats ?? {}
  return {
    maxHealth: Math.max(1, Math.round(finiteNumber(source.maxHealth, DEFAULT_COMBAT_STATS.maxHealth))),
    attack: Math.max(1, Math.round(finiteNumber(source.attack, DEFAULT_COMBAT_STATS.attack))),
    defense: Math.max(0, Math.round(finiteNumber(source.defense, DEFAULT_COMBAT_STATS.defense))),
    speed: Math.max(1, Math.round(finiteNumber(source.speed, DEFAULT_COMBAT_STATS.speed))),
    hitRate: clamp(finiteNumber(source.hitRate, DEFAULT_COMBAT_STATS.hitRate), 0, 100),
    dodgeRate: clamp(finiteNumber(source.dodgeRate, DEFAULT_COMBAT_STATS.dodgeRate), 0, MAX_DODGE_RATE),
    critRate: clamp(finiteNumber(source.critRate, DEFAULT_COMBAT_STATS.critRate), 0, 100),
    critDamage: Math.max(100, finiteNumber(source.critDamage, DEFAULT_COMBAT_STATS.critDamage)),
    comboRate: clamp(finiteNumber(source.comboRate, DEFAULT_COMBAT_STATS.comboRate), 0, 100),
    counterRate: clamp(finiteNumber(source.counterRate, DEFAULT_COMBAT_STATS.counterRate), 0, 100),
    stunRate: clamp(finiteNumber(source.stunRate, DEFAULT_COMBAT_STATS.stunRate), 0, 100),
    lifestealRate: clamp(finiteNumber(source.lifestealRate, DEFAULT_COMBAT_STATS.lifestealRate), 0, 100),
    critResist: clamp(finiteNumber(source.critResist, DEFAULT_COMBAT_STATS.critResist), 0, 100),
    comboResist: clamp(finiteNumber(source.comboResist, DEFAULT_COMBAT_STATS.comboResist), 0, 100),
    counterResist: clamp(finiteNumber(source.counterResist, DEFAULT_COMBAT_STATS.counterResist), 0, 100),
    stunResist: clamp(finiteNumber(source.stunResist, DEFAULT_COMBAT_STATS.stunResist), 0, 100),
    lifestealResist: clamp(finiteNumber(source.lifestealResist, DEFAULT_COMBAT_STATS.lifestealResist), 0, 100),
    healingBonus: Math.max(-100, finiteNumber(source.healingBonus, DEFAULT_COMBAT_STATS.healingBonus)),
    critDamageReduction: clamp(finiteNumber(source.critDamageReduction, DEFAULT_COMBAT_STATS.critDamageReduction), 0, 100),
    damageBonus: Math.max(-100, finiteNumber(source.damageBonus, DEFAULT_COMBAT_STATS.damageBonus)),
    damageReduction: clamp(finiteNumber(source.damageReduction, DEFAULT_COMBAT_STATS.damageReduction), 0, 100),
  }
}

export function createCombatStats(overrides: Partial<CombatStats> = {}): CombatStats {
  return normalizeCombatStats({ ...DEFAULT_COMBAT_STATS, ...overrides })
}

function addCombatBonuses(stats: CombatStats, bonuses: Partial<CombatStats> | undefined): CombatStats {
  if (!bonuses) return stats
  const next = { ...stats }
  for (const [key, value] of Object.entries(bonuses)) {
    const stat = key as keyof CombatStats
    if (typeof value === 'number') next[stat] += value
  }
  return normalizeCombatStats(next)
}

function normalizePracticeProgress(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(PRACTICE_PROGRESS_MAX, Math.max(0, value))
}

export function formatCompactNumber(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${formatCompactDecimal(value / 100_000_000)}亿`
  if (absolute >= 100_000) return `${formatCompactDecimal(value / 10_000)}万`
  if (absolute < 10_000 && !Number.isInteger(value)) return value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
  return Math.floor(value).toLocaleString('zh-CN')
}

export function formatIntegerNumber(value: number): string {
  return Math.floor(value).toLocaleString('zh-CN')
}

export function formatCompactIntegerNumber(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${Math.floor(value / 100_000_000)}亿`
  if (absolute >= 100_000) return `${Math.floor(value / 10_000)}万`
  return formatIntegerNumber(value)
}

function formatCompactDecimal(value: number): string {
  const digits = Math.abs(value) >= 100 ? 0 : 1
  return value.toFixed(digits).replace(/\.0$/, '')
}

function getEquipmentById(id: string): Equipment | undefined {
  return EQUIPMENT.find((item) => item.id === id)
}

export function getEquippedWeaponStyle(player: GameState['player']): WeaponStyle | null {
  const equippedWeapon = player.equippedEquipment?.weapon
  const weapon = equippedWeapon ? getEquipmentById(equippedWeapon.equipmentId) : undefined
  return weapon?.categoryId === 'weapon' && weapon.weaponStyle ? weapon.weaponStyle : null
}

export function getEquipmentForSlot(slot: EquipmentSlot): Equipment[] {
  return EQUIPMENT.filter((item) => item.categoryId === getEquipmentCategoryForSlot(slot))
}

export function getEquipmentCategoryForSlot(slot: EquipmentSlot): EquipmentCategory {
  return slot === 'ring1' || slot === 'ring2' ? 'ring' : slot
}

export function canEquipEquipmentInSlot(equipment: Equipment, slot: EquipmentSlot): boolean {
  return equipment.categoryId === getEquipmentCategoryForSlot(slot)
}

function createEquippedEquipment(equipment: Equipment, gems: unknown = []): EquippedEquipment {
  const savedGems = Array.isArray(gems) ? gems : []
  return {
    equipmentId: equipment.id,
    gems: Array.from({ length: equipment.gemSlots }, (_, index) => typeof savedGems[index] === 'string' ? savedGems[index] : null),
  }
}

export function createEquipmentLoadout(equipmentIds: Partial<Record<EquipmentSlot, string | null>> = {}): EquipmentLoadout {
  return EQUIPMENT_SLOTS.reduce((loadout, slot) => {
    const equipment = typeof equipmentIds[slot] === 'string' ? getEquipmentById(equipmentIds[slot]!) : undefined
    loadout[slot] = equipment && canEquipEquipmentInSlot(equipment, slot) ? createEquippedEquipment(equipment) : null
    return loadout
  }, {} as EquipmentLoadout)
}

export function getEquippedEquipment(player: GameState['player']): Equipment[] {
  const loadout = player.equippedEquipment && typeof player.equippedEquipment === 'object' ? player.equippedEquipment : createEquipmentLoadout()
  return EQUIPMENT_SLOTS.flatMap((slot) => {
    const equipped = loadout[slot]
    const equipment = equipped ? getEquipmentById(equipped.equipmentId) : undefined
    return equipment && canEquipEquipmentInSlot(equipment, slot) ? [equipment] : []
  })
}

function getEquipmentSetById(id: string): EquipmentSet | undefined {
  return EQUIPMENT_SETS.find((set) => set.id === id)
}

export function getEquipmentSetActivations(player: GameState['player']): Array<{ set: EquipmentSet; count: number; activeBonuses: EquipmentSet['bonuses'] }> {
  const counts = new Map<string, number>()
  for (const equipment of getEquippedEquipment(player)) {
    if (equipment.setId && ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt'].includes(equipment.categoryId)) {
      counts.set(equipment.setId, (counts.get(equipment.setId) ?? 0) + 1)
    }
  }
  return [...counts.entries()].flatMap(([setId, count]) => {
    const set = getEquipmentSetById(setId)
    if (!set) return []
    return [{ set, count, activeBonuses: set.bonuses.filter((bonus) => bonus.pieces <= count) }]
  })
}

export function getActiveEquipmentSetBonuses(player: GameState['player']): Array<Partial<CombatStats>> {
  return getEquipmentSetActivations(player).flatMap((activation) => activation.activeBonuses.flatMap((bonus) => bonus.combatBonuses ? [bonus.combatBonuses] : []))
}

export function createMartialLoadout(values: Partial<MartialArtLoadout> = {}): MartialArtLoadout {
  return { inner1: values.inner1 ?? null, inner2: values.inner2 ?? null, outer1: values.outer1 ?? null, outer2: values.outer2 ?? null }
}

function getMartialArtSlotKind(slot: MartialArtSlot): MartialArtKind {
  return slot.startsWith('inner') ? 'inner' : 'outer'
}

export function getEquippedMartialArts(player: GameState['player']): MartialArt[] {
  const loadout = player.martialLoadout ?? createMartialLoadout()
  const equippedIds = new Set<string>()
  return (['inner1', 'inner2', 'outer1', 'outer2'] as const).flatMap((slot) => {
    const id = loadout[slot]
    const art = typeof id === 'string' ? getMartialArtById(id) : undefined
    if (!art || art.kind !== getMartialArtSlotKind(slot) || equippedIds.has(art.id)) return []
    equippedIds.add(art.id)
    return [art]
  })
}

export function getEquippedInnerArts(player: GameState['player']): MartialArt[] {
  return getEquippedMartialArts(player).filter((art) => art.kind === 'inner')
}

export function getEquippedOuterArts(player: GameState['player']): MartialArt[] {
  return getEquippedMartialArts(player).filter((art) => art.kind === 'outer')
}

export function hasMartialWeaponAffinity(player: GameState['player'], art: MartialArt): boolean {
  const weaponStyle = getEquippedWeaponStyle(player)
  return art.kind === 'outer' && Boolean(weaponStyle && art.affinityWeaponStyles?.includes(weaponStyle))
}

export function getPlayerCombatPassives(player: GameState['player']): CombatPassiveEffect[] {
  const setPassives = getEquipmentSetActivations(player).flatMap(({ activeBonuses }) => activeBonuses.flatMap((bonus) => bonus.passiveEffects ?? []))
  const innerPassives = getEquippedInnerArts(player).flatMap((art) => art.passiveEffects ?? [])
  return [...setPassives, ...innerPassives].map((effect) => ({ ...effect }))
}

export function getPlayerOuterSkills(player: GameState['player']): MartialActiveSkill[] {
  return getEquippedOuterArts(player).flatMap((art) => art.activeSkill
    ? [{ ...art.activeSkill, weaponAffinityActive: hasMartialWeaponAffinity(player, art) }]
    : [])
}

export function equipPlayerMartialArt(player: GameState['player'], slot: MartialArtSlot, art: MartialArt): GameState['player'] {
  if (art.kind !== getMartialArtSlotKind(slot)) return player
  const loadout = createMartialLoadout(player.martialLoadout)
  for (const candidate of Object.keys(loadout) as MartialArtSlot[]) {
    if (loadout[candidate] === art.id) loadout[candidate] = null
  }
  loadout[slot] = art.id
  return syncPlayerPower({ ...player, martialLoadout: loadout })
}

export function unequipPlayerMartialArt(player: GameState['player'], slot: MartialArtSlot): GameState['player'] {
  return syncPlayerPower({ ...player, martialLoadout: { ...createMartialLoadout(player.martialLoadout), [slot]: null } })
}

export function equipPlayerEquipment(player: GameState['player'], slot: EquipmentSlot, equipment: Equipment): GameState['player'] {
  if (!canEquipEquipmentInSlot(equipment, slot)) return player
  return syncPlayerPower({
    ...player,
    equippedEquipment: {
      ...player.equippedEquipment,
      [slot]: createEquippedEquipment(equipment),
    },
  })
}

export function unequipPlayerEquipment(player: GameState['player'], slot: EquipmentSlot): GameState['player'] {
  return syncPlayerPower({
    ...player,
    equippedEquipment: {
      ...player.equippedEquipment,
      [slot]: null,
    },
  })
}

function createLotteryPity(): LotteryPity {
  return { noPurpleDraws: 0, noOrangeDraws: 0 }
}

function createInitialLottery(): LotteryState {
  return {
    pity: { equipment: createLotteryPity(), martial: createLotteryPity() },
    fragments: {},
    ownedEquipmentIds: [...STARTER_EQUIPMENT_IDS],
    ownedMartialArtIds: [...STARTER_MARTIAL_ART_IDS],
    history: [],
  }
}

function getMartialArtById(id: string): MartialArt | undefined {
  return MARTIAL_ARTS.find((art) => art.id === id)
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

function pickPrizeId(ids: readonly string[], random: () => number): string {
  return ids[Math.min(ids.length - 1, Math.floor(getRandomValue(random) * ids.length))]!
}

function duplicateForgeReward(tone: GradeTone): number {
  return LOTTERY_DUPLICATE_REWARDS[tone]
}

function duplicateInsightReward(tone: GradeTone): number {
  return LOTTERY_DUPLICATE_REWARDS[tone]
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

export function getLotteryFragmentRequirement(tone: GradeTone): number {
  return LOTTERY_FRAGMENT_REQUIREMENTS[tone] ?? 0
}

export function getLotteryFragmentTargets(): Equipment[] {
  return ['orange', 'red'].flatMap((tone) => LOTTERY_EQUIPMENT_PRIZE_IDS[tone as 'orange' | 'red'])
    .flatMap((id) => {
      const equipment = getEquipmentById(id)
      return equipment ? [equipment] : []
    })
}

export function getLotteryFragmentCount(lottery: LotteryState, equipmentId: string): number {
  const amount = lottery?.fragments?.[equipmentId]
  return typeof amount === 'number' && Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
}

export function getOwnedLotteryFragmentTargets(lottery: LotteryState): Equipment[] {
  return getLotteryFragmentTargets().filter((equipment) => getLotteryFragmentCount(lottery, equipment.id) > 0)
}

export function canComposeLotteryEquipment(lottery: LotteryState, equipmentId: string): boolean {
  const equipment = getEquipmentById(equipmentId)
  const required = equipment ? getLotteryFragmentRequirement(equipment.gradeTone) : 0
  const ownedEquipmentIds = Array.isArray(lottery?.ownedEquipmentIds) ? lottery.ownedEquipmentIds : []
  return Boolean(required && !ownedEquipmentIds.includes(equipmentId) && getLotteryFragmentCount(lottery, equipmentId) >= required)
}

export function composeLotteryEquipment(player: GameState['player'], lottery: LotteryState, equipmentId: string): { player: GameState['player']; lottery: LotteryState; equipment: Equipment } | null {
  const equipment = getEquipmentById(equipmentId)
  if (!equipment || !canComposeLotteryEquipment(lottery, equipmentId)) return null
  const required = getLotteryFragmentRequirement(equipment.gradeTone)
  const remainingFragments = getLotteryFragmentCount(lottery, equipmentId) - required
  const fragments = { ...(lottery.fragments ?? {}) }
  if (remainingFragments > 0) fragments[equipmentId] = remainingFragments
  else delete fragments[equipmentId]
  return {
    player,
    lottery: {
      ...lottery,
      fragments,
      ownedEquipmentIds: [...new Set([...lottery.ownedEquipmentIds, equipmentId])],
    },
    equipment,
  }
}

export function drawLottery(
  player: GameState['player'],
  lottery: LotteryState,
  pool: LotteryPoolId,
  count: LotteryDrawCount,
  random: () => number = Math.random,
  now = Date.now(),
): { player: GameState['player']; lottery: LotteryState; result: LotteryDrawResult } | null {
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
    fragments: { ...(lottery.fragments ?? {}) },
    ownedEquipmentIds: Array.isArray(lottery.ownedEquipmentIds) ? [...lottery.ownedEquipmentIds] : [],
    ownedMartialArtIds: Array.isArray(lottery.ownedMartialArtIds) ? [...lottery.ownedMartialArtIds] : [],
  }
  const rewards: LotteryReward[] = []

  for (let index = 0; index < count; index += 1) {
    const pity = nextLottery.pity[pool]
    const tone = pity.noOrangeDraws >= 49 ? 'orange' : pity.noPurpleDraws >= 9 ? 'purple' : pickGradeTone(random)
    nextLottery.pity[pool] = {
      noPurpleDraws: isPurpleOrBetter(tone) ? 0 : pity.noPurpleDraws + 1,
      noOrangeDraws: isOrangeOrBetter(tone) ? 0 : pity.noOrangeDraws + 1,
    }
    const id = pool === 'equipment'
      ? pickPrizeId(LOTTERY_EQUIPMENT_PRIZE_IDS[tone], random)
      : pickPrizeId(LOTTERY_MARTIAL_PRIZE_IDS[tone], random)
    const source = pool === 'equipment' ? getEquipmentById(id) : getMartialArtById(id)
    if (!source) continue

    const rewardId = `${now}-${pool}-${nextLottery.history.length + index}`
    if (pool === 'equipment' && getLotteryFragmentRequirement(tone)) {
      nextLottery.fragments[id] = (nextLottery.fragments[id] ?? 0) + 1
      rewards.push({ id: rewardId, pool, kind: 'fragment', itemId: id, name: `${source.name}碎片`, grade: source.grade, gradeTone: tone, quantity: 1 })
      continue
    }

    const owned = pool === 'equipment' ? nextLottery.ownedEquipmentIds : nextLottery.ownedMartialArtIds
    if (owned.includes(id)) {
      const quantity = pool === 'equipment' ? duplicateForgeReward(tone) : duplicateInsightReward(tone)
      if (pool === 'equipment') nextPlayer = { ...nextPlayer, forge: nextPlayer.forge + quantity }
      else nextPlayer = { ...nextPlayer, insight: nextPlayer.insight + quantity }
      rewards.push({
        id: rewardId,
        pool,
        kind: pool === 'equipment' ? 'forge' : 'insight',
        name: pool === 'equipment' ? '铸材' : '功法心得',
        grade: source.grade,
        gradeTone: tone,
        quantity,
      })
      continue
    }

    if (pool === 'equipment') nextLottery.ownedEquipmentIds.push(id)
    else nextLottery.ownedMartialArtIds.push(id)
    rewards.push({ id: rewardId, pool, kind: pool, itemId: id, name: source.name, grade: source.grade, gradeTone: tone, quantity: 1 })
  }

  const history = [...rewards.slice().reverse(), ...nextLottery.history].slice(0, 24)
  nextLottery = { ...nextLottery, history }
  return { player: nextPlayer, lottery: nextLottery, result: { id: now, pool, count, cost: getLotteryCost(count), rewards } }
}

export function getStagesPerChapter(chapter: number): number {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > MAIN_STORY_CHAPTERS) return 0
  return getMainStoryChapterConfig(chapter)?.stages ?? 0
}

export function isEliteMainStage(chapter: number, stage: number): boolean {
  const stagesInChapter = getStagesPerChapter(chapter)
  if (!stagesInChapter || !Number.isInteger(stage) || stage < 1 || stage > stagesInChapter) return false
  const config = getMainStoryChapterConfig(chapter)
  return Boolean(config && stage % config.eliteEvery === 0)
}

export function getEliteEnemyCount(chapter: number, stage: number): number {
  if (!isEliteMainStage(chapter, stage)) return 1
  return getMainStoryChapterConfig(chapter)?.eliteEnemyCount ?? 1
}

export function getMainStageOrdinal(chapter: number, stage: number): number | null {
  const stagesInChapter = getStagesPerChapter(chapter)
  if (!stagesInChapter || !Number.isInteger(stage) || stage < 1 || stage > stagesInChapter) return null
  let ordinal = stage
  for (let currentChapter = 1; currentChapter < chapter; currentChapter += 1) ordinal += getStagesPerChapter(currentChapter)
  return ordinal
}

export function getMainStagePosition(ordinal: number): { chapter: number; stage: number } | null {
  if (!Number.isInteger(ordinal) || ordinal < 1) return null
  let remaining = ordinal
  for (let chapter = 1; chapter <= MAIN_STORY_CHAPTERS; chapter += 1) {
    const stagesInChapter = getStagesPerChapter(chapter)
    if (remaining <= stagesInChapter) return { chapter, stage: remaining }
    remaining -= stagesInChapter
  }
  return null
}

function getMainStageEnemyStats(chapter: number, stage: number, enemyCount: number, isElite: boolean, enemyIndex: number): CombatStats {
  return createCombatStats(getMainStageEnemyStatsGrowth({ chapter, stage, enemyCount, isElite, enemyIndex }))
}

function getMainStageEnemies(ordinal: number, chapter: number, stage: number, isElite: boolean): MainStageEnemy[] {
  const enemyCount = getEliteEnemyCount(chapter, stage)
  return Array.from({ length: enemyCount }, (_, index) => {
    const names = isElite ? ELITE_ENEMY_NAMES : COMMON_ENEMY_NAMES
    const baseName = names[(ordinal + index * 3) % names.length]!
    const name = enemyCount > 1 ? `${baseName}${MULTI_ENEMY_SUFFIXES[index] ?? index + 1}` : baseName
    return {
      id: `main-${ordinal}-enemy-${index + 1}`,
      name,
      stats: getMainStageEnemyStats(chapter, stage, enemyCount, isElite, index),
    }
  })
}

function getMainStageReward(ordinal: number, chapter: number, stage: number, isElite: boolean): MainStageReward {
  return getMainStageRewardBalance(ordinal, chapter, stage, isElite)
}

function scaleReplayReward(amount: number, random: () => number): number {
  const scaled = amount * MAIN_STAGE_REWARDS.replayRate
  const whole = Math.floor(scaled)
  return whole + (random() < scaled - whole ? 1 : 0)
}

export function getMainStageReplayReward(stage: MainStage, random: () => number = Math.random): MainStageReplayReward {
  const eliteBonus = stage.isElite && random() < MAIN_STAGE_REWARDS.eliteReplayBonusChance
  return {
    silver: scaleReplayReward(stage.reward.silver, random),
    langyu: 0,
    forge: scaleReplayReward(stage.reward.forge, random) + (eliteBonus ? 1 : 0),
    insight: scaleReplayReward(stage.reward.insight, random) + (eliteBonus ? 1 : 0),
    fame: scaleReplayReward(stage.reward.fame, random),
    eliteBonus,
  }
}

export function getMainStage(chapter: number, stage: number): MainStage | null {
  const ordinal = getMainStageOrdinal(chapter, stage)
  if (!ordinal) return null
  const stagesInChapter = getStagesPerChapter(chapter)
  const isElite = isEliteMainStage(chapter, stage)
  return {
    ordinal,
    chapter,
    stage,
    stagesInChapter,
    isElite,
    enemies: getMainStageEnemies(ordinal, chapter, stage, isElite),
    reward: getMainStageReward(ordinal, chapter, stage, isElite),
  }
}

export function getMainStageByOrdinal(ordinal: number): MainStage | null {
  const position = getMainStagePosition(ordinal)
  return position ? getMainStage(position.chapter, position.stage) : null
}

export function getCurrentMainStage(journey: JourneyState): MainStage | null {
  if (journey.completed) return null
  return getMainStage(journey.currentChapter, journey.currentStage)
}

export function getVisibleMainChapters(journey: JourneyState): Array<{ chapter: number; stages: MainStage[] }> {
  const visibleThroughChapter = journey.completed ? MAIN_STORY_CHAPTERS : journey.currentChapter
  const chapters: Array<{ chapter: number; stages: MainStage[] }> = []
  for (let chapter = 1; chapter <= visibleThroughChapter; chapter += 1) {
    const visibleThroughStage = journey.completed || chapter < journey.currentChapter
      ? getStagesPerChapter(chapter)
      : journey.currentStage
    const stages: MainStage[] = []
    for (let stage = 1; stage <= visibleThroughStage; stage += 1) {
      const mainStage = getMainStage(chapter, stage)
      if (mainStage) stages.push(mainStage)
    }
    if (stages.length) chapters.push({ chapter, stages })
  }
  return chapters
}

export function hasClearedMainStage(journey: JourneyState, stage: MainStage): boolean {
  if (journey.completed) return true
  if (stage.chapter !== journey.currentChapter) return stage.chapter < journey.currentChapter
  return stage.stage < journey.currentStage
}

export function advanceMainJourney(journey: JourneyState, clearedStage: MainStage): JourneyState | null {
  const expectedStage = getMainStage(journey.currentChapter, journey.currentStage)
  if (
    journey.completed
    || !expectedStage
    || clearedStage.chapter !== journey.currentChapter
    || clearedStage.stage !== journey.currentStage
    || clearedStage.ordinal !== expectedStage.ordinal
    || clearedStage.stagesInChapter !== expectedStage.stagesInChapter
  ) return null
  if (clearedStage.stage < clearedStage.stagesInChapter) {
    return { ...journey, currentStage: clearedStage.stage + 1 }
  }
  if (clearedStage.chapter < MAIN_STORY_CHAPTERS) {
    return { ...journey, currentChapter: clearedStage.chapter + 1, currentStage: 1 }
  }
  return { ...journey, completed: true }
}

export function getRealmBaseCombatStats(player: GameState['player']): CombatStats {
  const realmIndex = Math.max(0, REALMS.findIndex((realm) => realm.id === player.realmId))
  const realmLevel = clamp(Math.floor(finiteNumber(player.realmLevel, 1)), 1, 9)
  const growthStep = realmIndex * 9 + realmLevel - 1
  const growth = Math.pow(COMBAT_STAT_LEVEL_GROWTH, growthStep) * Math.pow(COMBAT_STAT_REALM_BREAKTHROUGH_BONUS, realmIndex)
  const speedGrowth = Math.pow(growth, COMBAT_SPEED_GROWTH_EXPONENT)

  return createCombatStats({
    maxHealth: DEFAULT_COMBAT_STATS.maxHealth * growth,
    attack: DEFAULT_COMBAT_STATS.attack * growth,
    defense: DEFAULT_COMBAT_STATS.defense * growth,
    speed: DEFAULT_COMBAT_STATS.speed * speedGrowth,
  })
}

export function getPlayerCombatStats(player: GameState['player']): CombatStats {
  let stats = getRealmBaseCombatStats(player)
  for (const equipment of getEquippedEquipment(player)) {
    stats = addCombatBonuses(stats, equipment.combatBonuses)
  }
  for (const bonuses of getActiveEquipmentSetBonuses(player)) stats = addCombatBonuses(stats, bonuses)
  for (const art of getEquippedMartialArts(player)) stats = addCombatBonuses(stats, art.combatBonuses)
  return normalizeCombatStats(stats)
}

export function getCombatPower(stats: CombatStats): number {
  const safeStats = normalizeCombatStats(stats)
  const expectedDamage = safeStats.attack
    * (safeStats.hitRate / 100)
    * (1 + (safeStats.critRate / 100) * ((safeStats.critDamage - 100) / 100))
    * (1 + (safeStats.comboRate / 100) * 0.45)
    * (1 + safeStats.damageBonus / 100)
  const effectiveHealth = safeStats.maxHealth
    * (1 + safeStats.defense / COMBAT_BALANCE.powerDefenseDivisor)
    * (1 + safeStats.dodgeRate / 100)
    * (1 + safeStats.damageReduction / 100)
  return Math.max(1, Math.round(
    expectedDamage * COMBAT_BALANCE.powerExpectedDamageWeight
    + effectiveHealth * COMBAT_BALANCE.powerEffectiveHealthWeight
    + safeStats.speed * COMBAT_BALANCE.powerSpeedWeight,
  ))
}

export function getPlayerPower(player: GameState['player']): number {
  return getCombatPower(getPlayerCombatStats(player))
}

export function syncPlayerPower(player: GameState['player']): GameState['player'] {
  return { ...player, power: getPlayerPower(player) }
}

export function createInitialGame(): GameState {
  const now = Date.now()
  const player = {
    ...INITIAL_PLAYER_PROFILE,
    power: 0,
    mastery: { ...INITIAL_PLAYER_PROFILE.mastery },
    equippedEquipment: createEquipmentLoadout(INITIAL_EQUIPMENT_LOADOUT),
    martialLoadout: createMartialLoadout(INITIAL_PLAYER_PROFILE.martialLoadout),
  }
  return {
    version: CURRENT_GAME_VERSION,
    player: syncPlayerPower(player),
    cultivation: { amount: 0, practiceProgress: 0, lastAccruedAt: now, autoPractice: false },
    dailyCheckIn: { ...INITIAL_DAILY_CHECK_IN },
    journey: { currentChapter: 1, currentStage: 1, completed: false },
    lottery: createInitialLottery(),
    logs: INITIAL_GAME_LOGS.map((log) => ({ ...log })),
  }
}

export function canClaimDailyCheckIn(state: GameState['dailyCheckIn'], now = Date.now()): boolean {
  return state.lastClaimedDate !== dateKey(now)
}

export function claimDailyCheckIn(
  player: GameState['player'],
  state: GameState['dailyCheckIn'],
  now = Date.now(),
): { player: GameState['player']; dailyCheckIn: GameState['dailyCheckIn'] } | null {
  if (!canClaimDailyCheckIn(state, now)) return null
  return {
    player: { ...player, langyu: Math.min(Number.MAX_SAFE_INTEGER, player.langyu + DAILY_CHECK_IN_REWARD) },
    dailyCheckIn: { lastClaimedDate: dateKey(now) },
  }
}

export function getRealm(id: RealmId): Realm | undefined {
  return REALMS.find((realm) => realm.id === id)
}

export function normalizeRealmId(value: unknown): RealmId {
  if (value === 'celestial') return 'returning'
  return REALMS.find((realm) => realm.id === value)?.id ?? 'body-tempering'
}

export function getPracticeCost(realmId: RealmId, realmLevel: number): number {
  const realmIndex = Math.max(0, REALMS.findIndex((realm) => realm.id === realmId))
  const level = clamp(Math.floor(finiteNumber(realmLevel, 1)), 1, 9)
  const fullLevelCost = PRACTICE_FULL_LEVEL_BASE_COST
    * Math.pow(PRACTICE_REALM_COST_MULTIPLIER, realmIndex)
    * Math.pow(SMALL_REALM_COST_GROWTH, level - 1)
  return Math.max(1, Math.round(fullLevelCost / PRACTICE_ACTIONS_PER_LEVEL))
}

export function getNextRealmId(realmId: RealmId): RealmId | null {
  const index = REALMS.findIndex((realm) => realm.id === realmId)
  return REALMS[index + 1]?.id ?? null
}

export function getMartialMastery(player: GameState['player'], artId: string): number {
  const art = MARTIAL_ARTS.find((item) => item.id === artId)
  const savedMastery = player.mastery && typeof player.mastery === 'object' ? player.mastery[artId] : undefined
  const fallback = art?.mastery ?? 0
  return clamp(Math.floor(finiteNumber(savedMastery, fallback)), 0, 100)
}

export function getInnerForceRateBonus(player: GameState['player']): number {
  return Math.round(MARTIAL_ARTS.reduce((total, art) => {
    if (art.kind !== 'inner' || !getEquippedInnerArts(player).some((equipped) => equipped.id === art.id) || art.innerForceRateBase === undefined || art.innerForceRatePerMastery === undefined) return total
    return total + art.innerForceRateBase + getMartialMastery(player, art.id) * art.innerForceRatePerMastery
  }, 0) * 100) / 100
}

export function getInnerForceRateMultiplierBonus(player: GameState['player']): number {
  return Math.round(MARTIAL_ARTS.reduce((total, art) => {
    if (art.kind !== 'inner' || !getEquippedInnerArts(player).some((equipped) => equipped.id === art.id) || art.innerForceRateMultiplierBase === undefined || art.innerForceRateMultiplierPerMastery === undefined) return total
    return total + art.innerForceRateMultiplierBase + getMartialMastery(player, art.id) * art.innerForceRateMultiplierPerMastery
  }, 0) * 10_000) / 10_000
}

export function getRealmInnerForceRate(player: GameState['player']): number {
  const realmIndex = Math.max(0, REALMS.findIndex((realm) => realm.id === player.realmId))
  const level = clamp(Math.floor(finiteNumber(player.realmLevel, 1)), 1, 9)
  return Math.round((
    INNER_FORCE_PER_SECOND
    * Math.pow(REALM_INNER_FORCE_RATE_MULTIPLIER, realmIndex)
    * Math.pow(SMALL_REALM_INNER_FORCE_RATE_MULTIPLIER, level - 1)
  ) * 100) / 100
}

export function getRealmInnerForceRateBonus(player: GameState['player']): number {
  return Math.round((getRealmInnerForceRate(player) - INNER_FORCE_PER_SECOND) * 100) / 100
}

export function getInnerForceRate(player: GameState['player']): number {
  return Math.round((
    getRealmInnerForceRate(player) * (1 + getInnerForceRateMultiplierBonus(player))
    + getInnerForceRateBonus(player)
  ) * 100) / 100
}

export function getMartialEnhancementCost(player: GameState['player'], art: MartialArt): number {
  return 4 + Math.floor(getMartialMastery(player, art.id) / 10)
}

export function isMartialArtEnhanceable(art: MartialArt): boolean {
  const hasFlatBonus = art.innerForceRateBase !== undefined && art.innerForceRatePerMastery !== undefined
  const hasMultiplierBonus = art.innerForceRateMultiplierBase !== undefined && art.innerForceRateMultiplierPerMastery !== undefined
  return hasFlatBonus || hasMultiplierBonus
}

export function canEnhanceMartialArt(player: GameState['player'], art: MartialArt): boolean {
  return isMartialArtEnhanceable(art)
    && getMartialMastery(player, art.id) < 100
    && player.insight >= getMartialEnhancementCost(player, art)
}

export function enhanceMartialArt(player: GameState['player'], art: MartialArt): GameState['player'] | null {
  if (!isMartialArtEnhanceable(art)) return null
  const mastery = getMartialMastery(player, art.id)
  const cost = getMartialEnhancementCost(player, art)
  if (!canEnhanceMartialArt(player, art)) return null
  return syncPlayerPower({
    ...player,
    insight: player.insight - cost,
    mastery: { ...player.mastery, [art.id]: Math.min(100, mastery + MARTIAL_ENHANCEMENT_STEP) },
  })
}

export function accrueInnerForce(cultivation: CultivationState, player: GameState['player'], now = Date.now()): CultivationState {
  const safeNow = finiteNumber(now, Date.now())
  const safeLastAccruedAt = finiteNumber(cultivation.lastAccruedAt, safeNow)
  const rawElapsed = Math.max(0, safeNow - safeLastAccruedAt)
  const elapsed = Math.min(rawElapsed, MAX_CULTIVATION_OFFLINE_MS)
  const wholeSeconds = Math.floor(elapsed / 1000)
  const amount = Math.max(0, finiteNumber(cultivation.amount, 0))
  if (!wholeSeconds) return { ...cultivation, amount, lastAccruedAt: Math.min(safeNow, Math.max(0, safeLastAccruedAt)) }
  return {
    ...cultivation,
    amount: amount + wholeSeconds * getInnerForceRate(player),
    lastAccruedAt: rawElapsed > MAX_CULTIVATION_OFFLINE_MS ? safeNow : safeLastAccruedAt + wholeSeconds * 1000,
  }
}

export function isPracticeComplete(cultivation: CultivationState): boolean {
  return normalizePracticeProgress(cultivation.practiceProgress) >= PRACTICE_PROGRESS_MAX
}

export function canBreakThrough(player: GameState['player'], cultivation: CultivationState): boolean {
  return player.realmLevel === 9 && getNextRealmId(player.realmId) !== null && isPracticeComplete(cultivation)
}

export function canPractice(player: GameState['player'], cultivation: CultivationState): boolean {
  return !isPracticeComplete(cultivation) && Number.isFinite(cultivation.amount) && cultivation.amount >= getPracticeCost(player.realmId, player.realmLevel)
}

export function practiceOnce(player: GameState['player'], cultivation: CultivationState): { player: GameState['player']; cultivation: CultivationState; advanced: boolean } | null {
  if (!canPractice(player, cultivation)) return null
  const cost = getPracticeCost(player.realmId, player.realmLevel)
  const progress = Math.min(PRACTICE_PROGRESS_MAX, normalizePracticeProgress(cultivation.practiceProgress) + PRACTICE_PROGRESS_PER_ACTION)
  if (progress === PRACTICE_PROGRESS_MAX && player.realmLevel < 9) {
    return {
      player: syncPlayerPower({ ...player, realmLevel: player.realmLevel + 1 }),
      cultivation: { ...cultivation, amount: cultivation.amount - cost, practiceProgress: 0 },
      advanced: true,
    }
  }
  return { player, cultivation: { ...cultivation, amount: cultivation.amount - cost, practiceProgress: progress }, advanced: false }
}

export function breakThroughRealm(player: GameState['player'], cultivation: CultivationState): { player: GameState['player']; cultivation: CultivationState } | null {
  if (!canBreakThrough(player, cultivation)) return null
  const nextRealmId = getNextRealmId(player.realmId)
  if (!nextRealmId) return null
  return { player: syncPlayerPower({ ...player, realmId: nextRealmId, realmLevel: 1 }), cultivation: { ...cultivation, practiceProgress: 0 } }
}

export function saveGame(game: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game))
  } catch {
    // Storage can be unavailable or full; gameplay state remains usable in memory.
  }
}

export function prependGameLog(logs: readonly GameLog[], log: GameLog, maxEntries = 100): GameLog[] {
  const safeLimit = Math.max(1, Math.floor(finiteNumber(maxEntries, 100)))
  return [log, ...logs].slice(0, safeLimit)
}

function isPartialGame(value: unknown): value is Partial<GameState> & { player?: Partial<GameState['player']> } {
  return typeof value === 'object' && value !== null
}

function loadCultivation(saved: Partial<GameState> & { player?: Partial<GameState['player']> }, initial: GameState): CultivationState {
  const savedCultivation = saved.cultivation as (Partial<CultivationState> & { autoAdvance?: unknown }) | undefined
  if (savedCultivation && Number.isFinite(savedCultivation.amount) && Number.isFinite(savedCultivation.lastAccruedAt)) {
    const now = Date.now()
    return {
      amount: Math.max(0, savedCultivation.amount!),
      practiceProgress: normalizePracticeProgress(savedCultivation.practiceProgress),
      lastAccruedAt: Math.min(now, Math.max(0, Math.floor(savedCultivation.lastAccruedAt!))),
      autoPractice: typeof savedCultivation.autoPractice === 'boolean' ? savedCultivation.autoPractice : Boolean(savedCultivation.autoAdvance),
    }
  }
  const legacyPlayer = saved.player as (Partial<GameState['player']> & { qi?: unknown }) | undefined
  const legacyQi = Number.isFinite(legacyPlayer?.qi) ? Math.max(0, legacyPlayer!.qi as number) : initial.cultivation.amount
  return { amount: legacyQi, practiceProgress: 0, lastAccruedAt: Date.now(), autoPractice: false }
}

function loadDailyCheckIn(saved: unknown, initial: GameState['dailyCheckIn']): GameState['dailyCheckIn'] {
  if (typeof saved !== 'object' || saved === null) return { ...initial }
  return { lastClaimedDate: normalizeDateKey((saved as Partial<GameState['dailyCheckIn']>).lastClaimedDate) }
}

function loadJourney(saved: Partial<GameState>, initial: GameState): JourneyState {
  const journey = saved.journey as Partial<JourneyState> | undefined
  const currentChapter = Number.isFinite(journey?.currentChapter) ? Math.floor(journey!.currentChapter as number) : initial.journey.currentChapter
  const stagesInChapter = getStagesPerChapter(currentChapter)
  const currentStage = Number.isFinite(journey?.currentStage) ? Math.floor(journey!.currentStage as number) : initial.journey.currentStage
  if (!stagesInChapter || currentStage < 1 || currentStage > stagesInChapter) return initial.journey
  if (journey?.completed === true) {
    return { currentChapter: MAIN_STORY_CHAPTERS, currentStage: getStagesPerChapter(MAIN_STORY_CHAPTERS), completed: true }
  }
  return {
    currentChapter,
    currentStage,
    completed: false,
  }
}

function normalizeWuxiaCopy(value: string): string {
  return value
    .replaceAll('小周天运气完成一轮', '一次吐纳行气已毕')
    .replaceAll('修为渐稳', '内力渐增')
    .replaceAll('修为', '内力')
    .replaceAll('修行', '习武')
}

function loadLogs(value: unknown, fallback: GameLog[]): GameLog[] {
  if (!Array.isArray(value)) return fallback
  const logs = value.flatMap((entry): GameLog[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const log = entry as Partial<GameLog> & { category?: unknown }
    if (typeof log.id !== 'string' || typeof log.time !== 'string' || typeof log.text !== 'string' || typeof log.reward !== 'string') return []
    return [{
      id: boundedText(log.id, `log-${Date.now()}`, 96),
      category: log.category === '战斗' || log.category === '收获' ? log.category : '习武',
      time: boundedText(log.time, '刚才', 32),
      text: normalizeWuxiaCopy(log.text).slice(0, 240),
      reward: normalizeWuxiaCopy(log.reward).slice(0, 160),
    }]
  }).slice(0, 100)
  return logs.length ? logs : fallback
}

function loadEquippedEquipment(value: unknown, legacyWeapon: unknown, fallback: EquipmentLoadout): EquipmentLoadout {
  const savedLoadout = typeof value === 'object' && value !== null
    ? value as Partial<Record<EquipmentSlot | 'ring', unknown>>
    : undefined
  return EQUIPMENT_SLOTS.reduce((loadout, slot) => {
    const savedEntry = savedLoadout?.[slot] ?? (slot === 'ring1' ? savedLoadout?.ring : undefined)
    if (savedEntry === null) {
      loadout[slot] = null
      return loadout
    }
    if (typeof savedEntry === 'object' && savedEntry !== null) {
      const entry = savedEntry as Partial<EquippedEquipment>
      const equipment = typeof entry.equipmentId === 'string' ? getEquipmentById(entry.equipmentId) : undefined
      if (equipment && canEquipEquipmentInSlot(equipment, slot)) {
        loadout[slot] = createEquippedEquipment(equipment, entry.gems)
        return loadout
      }
    }
    if (!savedLoadout && slot === 'weapon' && typeof legacyWeapon === 'string') {
      const legacyEquipment = getEquipmentById(legacyWeapon)
      if (legacyEquipment?.categoryId === 'weapon') {
        loadout[slot] = createEquippedEquipment(legacyEquipment)
        return loadout
      }
    }
    loadout[slot] = fallback[slot]
    return loadout
  }, {} as EquipmentLoadout)
}

function loadLotteryPity(value: unknown): LotteryPity {
  const pity = typeof value === 'object' && value !== null ? value as Partial<LotteryPity> : undefined
  return {
    noPurpleDraws: typeof pity?.noPurpleDraws === 'number' && Number.isFinite(pity.noPurpleDraws) ? clamp(Math.floor(pity.noPurpleDraws), 0, 9) : 0,
    noOrangeDraws: typeof pity?.noOrangeDraws === 'number' && Number.isFinite(pity.noOrangeDraws) ? clamp(Math.floor(pity.noOrangeDraws), 0, 49) : 0,
  }
}

function loadLottery(value: unknown, initial: LotteryState): LotteryState {
  if (typeof value !== 'object' || value === null) return initial
  const saved = value as Partial<LotteryState>
  const savedPity = typeof saved.pity === 'object' && saved.pity !== null ? saved.pity : undefined
  const knownEquipment = new Set(EQUIPMENT.map((equipment) => equipment.id))
  const knownMartialArts = new Set(MARTIAL_ARTS.map((art) => art.id))
  const knownFragmentIds = new Set(getLotteryFragmentTargets().map((equipment) => equipment.id))
  const savedFragments = typeof saved.fragments === 'object' && saved.fragments !== null ? saved.fragments : {}
  const fragments = Object.entries(savedFragments).reduce<Record<string, number>>((result, [id, amount]) => {
    if (knownFragmentIds.has(id) && typeof amount === 'number' && Number.isFinite(amount) && amount > 0) result[id] = Math.floor(amount)
    return result
  }, {})
  const ownedEquipmentIds = Array.isArray(saved.ownedEquipmentIds)
    ? [...new Set(saved.ownedEquipmentIds.filter((id): id is string => typeof id === 'string' && knownEquipment.has(id)))]
    : initial.ownedEquipmentIds
  const ownedMartialArtIds = Array.isArray(saved.ownedMartialArtIds)
    ? [...new Set(saved.ownedMartialArtIds.filter((id): id is string => typeof id === 'string' && knownMartialArts.has(id)))]
    : initial.ownedMartialArtIds
  const history = Array.isArray(saved.history)
    ? saved.history.flatMap((entry): LotteryReward[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const reward = entry as Partial<LotteryReward>
      const validPool = reward.pool === 'equipment' || reward.pool === 'martial'
      const validKind = reward.kind === 'equipment' || reward.kind === 'martial' || reward.kind === 'fragment' || reward.kind === 'forge' || reward.kind === 'insight'
      const validTone = GRADE_ORDER.includes(reward.gradeTone as GradeTone)
      const source = typeof reward.itemId === 'string'
        ? (reward.pool === 'equipment' ? getEquipmentById(reward.itemId) : getMartialArtById(reward.itemId))
        : undefined
      const validItem = reward.kind === 'fragment' || reward.kind === 'equipment' || reward.kind === 'martial' ? Boolean(source) : true
      if (!validPool || !validKind || !validTone || !validItem || typeof reward.id !== 'string' || typeof reward.name !== 'string' || typeof reward.grade !== 'string' || typeof reward.quantity !== 'number' || !Number.isFinite(reward.quantity)) return []
      return [{
        id: boundedText(reward.id, `reward-${Date.now()}`, 96), pool: reward.pool as LotteryPoolId, kind: reward.kind as LotteryReward['kind'], itemId: typeof reward.itemId === 'string' ? reward.itemId : undefined,
        name: boundedText(reward.name, '未知奖励', 80), grade: boundedText(reward.grade, LOTTERY_GRADE_NAMES[reward.gradeTone as GradeTone], 20), gradeTone: reward.gradeTone as GradeTone, quantity: Math.max(1, Math.floor(reward.quantity)),
      }]
    }).slice(0, 24)
    : []
  return {
    pity: {
      equipment: loadLotteryPity(savedPity?.equipment),
      martial: loadLotteryPity(savedPity?.martial),
    },
    fragments,
    ownedEquipmentIds,
    ownedMartialArtIds,
    history,
  }
}

function loadMastery(value: unknown, fallback: Record<string, number>): Record<string, number> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const knownIds = new Set(MARTIAL_ARTS.map((art) => art.id))
  const mastery = { ...fallback }
  if (!saved) return mastery
  for (const [id, amount] of Object.entries(saved)) {
    if (knownIds.has(id) && typeof amount === 'number' && Number.isFinite(amount)) mastery[id] = clamp(Math.floor(amount), 0, 100)
  }
  return mastery
}

function loadMartialLoadout(value: unknown, legacyValue: unknown, fallback: MartialArtLoadout, ownedIds: readonly string[]): MartialArtLoadout {
  const knownIds = new Set(ownedIds)
  const validArtForSlot = (id: unknown, slot: MartialArtSlot): string | null => {
    if (typeof id !== 'string' || !knownIds.has(id)) return null
    const art = getMartialArtById(id)
    return art?.kind === getMartialArtSlotKind(slot) ? art.id : null
  }
  if (typeof value === 'object' && value !== null) {
    const saved = value as Partial<MartialArtLoadout>
    const loadout = createMartialLoadout()
    const equippedIds = new Set<string>()
    for (const slot of ['inner1', 'inner2', 'outer1', 'outer2'] as const) {
      const id = saved[slot] === null ? null : validArtForSlot(saved[slot], slot)
      loadout[slot] = id && !equippedIds.has(id) ? id : null
      if (loadout[slot]) equippedIds.add(loadout[slot])
    }
    return loadout
  }
  if (Array.isArray(legacyValue)) {
    const ids = [...new Set(legacyValue.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))].flatMap((id) => {
      const art = getMartialArtById(id)
      return art ? [art] : []
    })
    const inner = ids.filter((art) => art.kind === 'inner').slice(0, 2)
    const outer = ids.filter((art) => art.kind === 'outer').slice(0, 2)
    return createMartialLoadout({ inner1: inner[0]?.id ?? null, inner2: inner[1]?.id ?? null, outer1: outer[0]?.id ?? null, outer2: outer[1]?.id ?? null })
  }
  return createMartialLoadout(fallback)
}

export function loadGame(): GameState {
  const initial = createInitialGame()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initial
    const saved: unknown = JSON.parse(raw)
    if (!isPartialGame(saved)) return initial
    const savedVersion = nonNegativeInteger(saved.version, 0)
    const legacyPlayer = saved.player as (Partial<GameState['player']> & { level?: unknown; equippedWeapon?: unknown; equippedArts?: unknown; yuanbao?: unknown; silverTickets?: unknown }) | undefined
    const { equippedEquipment, equippedWeapon, ...playerValues } = legacyPlayer ?? {}
    const lottery = loadLottery(saved.lottery, initial.lottery)
    const savedRealmLevel = typeof legacyPlayer?.realmLevel === 'number'
      ? legacyPlayer.realmLevel
      : typeof legacyPlayer?.level === 'number' ? legacyPlayer.level : initial.player.realmLevel
    const player = syncPlayerPower({
      ...initial.player,
      name: boundedText(playerValues.name, initial.player.name, 32),
      title: boundedText(playerValues.title, initial.player.title, 32),
      realmId: normalizeRealmId(legacyPlayer?.realmId),
      realmLevel: Number.isFinite(savedRealmLevel) ? clamp(Math.floor(savedRealmLevel), 1, 9) : initial.player.realmLevel,
      silver: nonNegativeInteger(playerValues.silver, initial.player.silver),
      // Preserve old draw purchasing power after changing from 1 to 160 琅玉 per draw.
      langyu: migrateLangyuBalance(playerValues.langyu ?? legacyPlayer?.yuanbao ?? legacyPlayer?.silverTickets, savedVersion, initial.player.langyu),
      forge: nonNegativeInteger(playerValues.forge, initial.player.forge),
      insight: nonNegativeInteger(playerValues.insight, initial.player.insight),
      fame: nonNegativeInteger(playerValues.fame, initial.player.fame),
      mastery: loadMastery(playerValues.mastery, initial.player.mastery),
      martialLoadout: loadMartialLoadout(playerValues.martialLoadout, legacyPlayer?.equippedArts, initial.player.martialLoadout, lottery.ownedMartialArtIds),
      equippedEquipment: loadEquippedEquipment(equippedEquipment, equippedWeapon, initial.player.equippedEquipment),
    })
    return {
      ...initial,
      ...saved,
      version: CURRENT_GAME_VERSION,
      player,
      cultivation: loadCultivation(saved, initial),
      dailyCheckIn: loadDailyCheckIn(saved.dailyCheckIn, initial.dailyCheckIn),
      journey: loadJourney(saved, initial),
      lottery,
      logs: loadLogs(saved.logs, initial.logs),
    }
  } catch {
    return initial
  }
}
