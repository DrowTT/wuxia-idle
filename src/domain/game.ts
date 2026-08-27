import {
  DEFAULT_COMBAT_STATS,
  EQUIPMENT,
  EQUIPMENT_GEM_SOCKET_COST,
  EQUIPMENT_GEM_SOCKET_CATEGORIES,
  EQUIPMENT_SET_SLOTS,
  EQUIPMENT_SLOTS,
  GRADE_ORDER,
  LOTTERY_DRAW_COST,
  LOTTERY_EQUIPMENT_PRIZE_IDS,
  LOTTERY_GRADE_NAMES,
  MAIN_STORY_CHAPTERS,
  MARTIAL_ARTS,
  MAX_CULTIVATION_OFFLINE_MS,
  INITIAL_EQUIPMENT_GEM_SLOTS,
  MAX_EQUIPMENT_GEM_SLOTS,
  MARTIAL_ASCENSION_MAX_STAT_MULTIPLIER,
  MARTIAL_ENHANCEMENT_STEP,
  PRACTICE_PROGRESS_MAX,
  PRACTICE_PROGRESS_PER_ACTION,
  STARTER_EQUIPMENT_IDS,
  STARTER_MARTIAL_ART_IDS,
  INITIAL_EQUIPMENT_LOADOUT,
  INITIAL_DAILY_CHECK_IN,
  INITIAL_MATERIAL_BOUNTIES,
  INITIAL_SHOP_STATE,
  INITIAL_TEMPLE_STATE,
  IDOL_CONFIGS,
  IDOL_IDS,
  getIdolConfig,
  DAILY_CHECK_IN_REWARD,
  SILVER_SHOP_PRODUCTS,
  getSilverShopProduct,
  EQUIPMENT_ENHANCEMENT_MAX_LEVEL,
  EQUIPMENT_ENHANCEMENT_STAT_GROWTH,
  INITIAL_GAME_LOGS,
  INITIAL_PLAYER_PROFILE,
  MARTIAL_ASCENSION_TOKEN_ID,
  EQUIPMENT_ASCENSION_TOKEN_ID,
  EQUIPMENT_ESSENCE_ID,
  REFORGE_STONE_ID,
  GEM_SYNTHESIS_SUCCESS_RATES,
  INVENTORY_ITEMS,
  getInventoryItemById,
  DUNGEONS,
  getEquipmentById as getEquipmentConfigById,
  getEquipmentSetById as getEquipmentSetConfigById,
  getMartialArtById as getMartialArtConfigById,
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
  BattleReward,
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
  LotteryPoolId,
  LotteryPity,
  LotteryReward,
  LotteryState,
  JourneyState,
  CombatPassiveEffect,
  CombatRateBonuses,
  EquipmentSet,
  MartialActiveSkill,
  MartialArtKind,
  MartialArtLoadout,
  MartialArtSlot,
  WeaponStyle,
  CoreCombatStat,
  EquipmentRefinement,
  ShopState,
  SilverShopOffer,
  DungeonState,
  DungeonReward,
  DungeonRewardDrop,
  DungeonDrop,
  DungeonMechanicId,
  InventoryItem,
  MaterialBountyState,
  IdolId,
  TempleState,
} from './types'
import { formatCompactIntegerNumber, formatCompactNumber, formatIntegerNumber } from './number-format'
import { createCombatStats, normalizeCombatStats } from './combat-stats'
import { getCombatPower } from './combat-power'
import { dateKey, normalizeDateKey, weekKey } from './time'
import {
  canEnterDungeon,
  cancelDungeonChallenge,
  enterDungeon,
  getDungeonAttemptCount,
  getDungeonAttemptsRemaining,
  getDungeonConfig,
  getDungeonEnemies,
  getDungeonHighestCleared,
  getDungeonLayer,
  getDungeonStamina,
  getDungeonStaminaCap,
  getDungeonStaminaCost,
  getDungeonStaminaRecoveryRemainingMs,
  normalizeDungeonStateForDate,
  normalizeDungeonState,
} from './dungeon-system'
import { drawLottery, getLotteryCost, getLotteryPity } from './lottery-system'
import {
  getNextRealmId,
  getPracticeCost,
  getRealm,
  getRealmBaseCombatStats,
  getRealmInnerForceRate,
  getRealmInnerForceRateBonus,
  normalizeRealmId,
} from './realm-system'

export { formatCompactIntegerNumber, formatCompactNumber, formatIntegerNumber } from './number-format'
export { createCombatStats, normalizeCombatStats } from './combat-stats'
export { getCombatPower } from './combat-power'
export { dateKey, normalizeDateKey, weekKey } from './time'
export {
  canEnterDungeon,
  cancelDungeonChallenge,
  enterDungeon,
  getDungeonAttemptCount,
  getDungeonAttemptsRemaining,
  getDungeonConfig,
  getDungeonEnemies,
  getDungeonHighestCleared,
  getDungeonLayer,
  getDungeonStamina,
  getDungeonStaminaCap,
  getDungeonStaminaCost,
  getDungeonStaminaRecoveryRemainingMs,
  normalizeDungeonStateForDate,
  normalizeDungeonState,
} from './dungeon-system'
export { drawLottery, getLotteryCost, getLotteryPity } from './lottery-system'
export {
  getNextRealmId,
  getPracticeCost,
  getRealm,
  getRealmBaseCombatStats,
  getRealmInnerForceRate,
  getRealmInnerForceRateBonus,
  normalizeRealmId,
} from './realm-system'

export * from '../data'

const SAVE_KEY = 'shanhe-wuwen-save'
const SAVE_RECOVERY_KEY = `${SAVE_KEY}-recovery`
const CURRENT_GAME_VERSION = 21
const LANGYU_CURRENCY_VERSION = 11
const LEGACY_LANGYU_DRAW_COST = 1
const EQUIPMENT_ASCENSION_MAX_RANK = 10
const EQUIPMENT_REFINEMENT_STATS: readonly CoreCombatStat[] = ['maxHealth', 'attack', 'defense', 'speed']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return Math.max(0, Math.floor(finiteNumber(value, fallback)))
}

function addCappedInteger(current: unknown, amount: unknown): number {
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    nonNegativeInteger(current, 0) + nonNegativeInteger(amount, 0),
  )
}

function migrateLangyuBalance(value: unknown, savedVersion: number, fallback: number): number {
  // A missing currency field is not a zero-balance legacy save. Keep the
  // current default instead of multiplying it during version migration.
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const balance = nonNegativeInteger(value, fallback)
  if (savedVersion >= LANGYU_CURRENCY_VERSION) return balance
  return Math.min(Number.MAX_SAFE_INTEGER, balance * (LOTTERY_DRAW_COST / LEGACY_LANGYU_DRAW_COST))
}

function boundedText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback
  const text = value.trim()
  return text ? text.slice(0, maxLength) : fallback
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

const CORE_COMBAT_STATS: readonly CoreCombatStat[] = ['maxHealth', 'attack', 'defense', 'speed']

function addCombatRates(stats: CombatStats, rates: CombatRateBonuses | undefined): CombatStats {
  if (!rates) return stats
  const next = { ...stats }
  for (const stat of CORE_COMBAT_STATS) {
    const rate = rates[stat]
    if (typeof rate === 'number' && Number.isFinite(rate)) next[stat] *= 1 + rate / 100
  }
  // Preserve precision across independent rate zones. The complete panel is
  // normalized once after all flat bonuses have been applied.
  return next
}

function sumCombatRates(rateSources: readonly CombatRateBonuses[]): CombatRateBonuses {
  const total: CombatRateBonuses = {}
  for (const rates of rateSources) {
    for (const stat of CORE_COMBAT_STATS) {
      const rate = rates[stat]
      if (typeof rate === 'number' && Number.isFinite(rate)) total[stat] = (total[stat] ?? 0) + rate
    }
  }
  return total
}

function normalizePracticeProgress(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(PRACTICE_PROGRESS_MAX, Math.max(0, value))
}

function getEquipmentById(id: string): Equipment | undefined {
  return getEquipmentConfigById(id)
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

export function getEquipmentGemSocketLimit(equipment: Equipment): number {
  return EQUIPMENT_GEM_SOCKET_CATEGORIES.includes(equipment.categoryId)
    ? Math.min(MAX_EQUIPMENT_GEM_SLOTS, Math.max(0, Math.floor(equipment.gemSlots)))
    : 0
}

function createEquippedEquipment(equipment: Equipment, gems: unknown = []): EquippedEquipment {
  const savedGems = Array.isArray(gems) ? gems : []
  const socketLimit = getEquipmentGemSocketLimit(equipment)
  const openedSlots = socketLimit > 0
    ? Math.min(socketLimit, Math.max(INITIAL_EQUIPMENT_GEM_SLOTS, savedGems.length))
    : 0
  return {
    equipmentId: equipment.id,
    gems: Array.from({ length: openedSlots }, (_, index) => {
      const gemId = savedGems[index]
      const gem = typeof gemId === 'string' ? getInventoryItemById(gemId) : undefined
      return gem?.category === 'gem' ? gem.id : null
    }),
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

export function isEquipmentEquipped(player: GameState['player'], equipmentId: string): boolean {
  return EQUIPMENT_SLOTS.some((slot) => player.equippedEquipment?.[slot]?.equipmentId === equipmentId)
}

export function getEquipmentEnhancementLevel(player: GameState['player'], equipmentId: string): number {
  const value = player.equipmentEnhancements && typeof player.equipmentEnhancements === 'object'
    ? player.equipmentEnhancements[equipmentId]
    : undefined
  return clamp(Math.floor(finiteNumber(value, 0)), 0, EQUIPMENT_ENHANCEMENT_MAX_LEVEL)
}

export function getEquipmentRank(player: GameState['player'], equipmentId: string): number {
  const value = player.equipmentRanks && typeof player.equipmentRanks === 'object'
    ? player.equipmentRanks[equipmentId]
    : undefined
  return clamp(Math.floor(finiteNumber(value, 0)), 0, EQUIPMENT_ASCENSION_MAX_RANK)
}

export function getEquipmentRefinement(player: GameState['player'], equipmentId: string): EquipmentRefinement | null {
  const value = player.equipmentRefinements?.[equipmentId]
  if (!value || !EQUIPMENT_REFINEMENT_STATS.includes(value.stat) || !Number.isFinite(value.amount) || value.amount <= 0) return null
  return { stat: value.stat, amount: Math.floor(value.amount) }
}

export interface EquipmentAscensionRequirement {
  rank: number
  maxRank: number
  forge: number
  essence: number
  duplicates: number
  replacementTokens: number
}

export function getEquipmentAscensionRequirement(player: GameState['player'], equipment: Equipment): EquipmentAscensionRequirement {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return { rank: 0, maxRank: 0, forge: 0, essence: 0, duplicates: 0, replacementTokens: 0 }
  const rank = getEquipmentRank(player, knownEquipment.id)
  if (rank >= EQUIPMENT_ASCENSION_MAX_RANK) return { rank, maxRank: EQUIPMENT_ASCENSION_MAX_RANK, forge: 0, essence: 0, duplicates: 0, replacementTokens: 0 }
  const duplicates = rank >= 5 ? (rank === 9 ? 2 : 1) : 0
  return {
    rank,
    maxRank: EQUIPMENT_ASCENSION_MAX_RANK,
    forge: Math.ceil((24 + rank * 18) * (1 + GRADE_ORDER.indexOf(knownEquipment.gradeTone) * 0.35)),
    essence: rank < 5 ? rank + 1 : 0,
    duplicates,
    replacementTokens: duplicates,
  }
}

export function getEquipmentDuplicateCount(player: GameState['player'], lottery: LotteryState, equipment: Equipment): number {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return 0
  const owned = Array.isArray(lottery.ownedEquipmentIds) ? lottery.ownedEquipmentIds.filter((id) => id === knownEquipment.id).length : 0
  const equipped = EQUIPMENT_SLOTS.filter((slot) => player.equippedEquipment?.[slot]?.equipmentId === knownEquipment.id).length
  return Math.max(0, owned - equipped)
}

export function getEquipmentAscensionTokenCount(player: GameState['player']): number {
  return Math.max(0, Math.floor(finiteNumber(player.items?.[EQUIPMENT_ASCENSION_TOKEN_ID], 0)))
}

export function canAscendEquipment(player: GameState['player'], lottery: LotteryState, equipment: Equipment): boolean {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return false
  const requirement = getEquipmentAscensionRequirement(player, knownEquipment)
  return requirement.rank < requirement.maxRank
    && isEquipmentEquipped(player, knownEquipment.id)
    && player.forge >= requirement.forge
    && (player.items?.[EQUIPMENT_ESSENCE_ID] ?? 0) >= requirement.essence
    && getEquipmentDuplicateCount(player, lottery, knownEquipment) + getEquipmentAscensionTokenCount(player) >= requirement.duplicates
}

export function ascendEquipment(player: GameState['player'], lottery: LotteryState, equipment: Equipment): { player: GameState['player']; lottery: LotteryState; requirement: EquipmentAscensionRequirement } | null {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment || !canAscendEquipment(player, lottery, knownEquipment)) return null
  const requirement = getEquipmentAscensionRequirement(player, knownEquipment)
  const items = { ...(player.items ?? {}) }
  if (requirement.essence) items[EQUIPMENT_ESSENCE_ID] = Math.max(0, (items[EQUIPMENT_ESSENCE_ID] ?? 0) - requirement.essence)
  const availableDuplicates = getEquipmentDuplicateCount(player, lottery, knownEquipment)
  const consumedDuplicates = Math.min(availableDuplicates, requirement.duplicates)
  const consumedTokens = requirement.duplicates - consumedDuplicates
  if (consumedTokens) items[EQUIPMENT_ASCENSION_TOKEN_ID] = Math.max(0, getEquipmentAscensionTokenCount(player) - consumedTokens)
  let remainingDuplicates = consumedDuplicates
  const ownedEquipmentIds = (Array.isArray(lottery.ownedEquipmentIds) ? lottery.ownedEquipmentIds : []).flatMap((id) => {
    if (id === knownEquipment.id && remainingDuplicates > 0) {
      remainingDuplicates -= 1
      return []
    }
    return [id]
  })
  return {
    player: syncPlayerPower({
      ...player,
      forge: player.forge - requirement.forge,
      items,
      equipmentRanks: { ...(player.equipmentRanks ?? {}), [knownEquipment.id]: requirement.rank + 1 },
    }),
    lottery: { ...lottery, ownedEquipmentIds },
    requirement,
  }
}

export function getEquipmentRefinementStatLabel(stat: CoreCombatStat): string {
  return stat === 'maxHealth' ? '生命' : stat === 'attack' ? '攻击' : stat === 'defense' ? '防御' : '速度'
}

export function getEquipmentRefinementCost(player: GameState['player']): number {
  return 1
}

export function canRefineEquipment(player: GameState['player'], equipment: Equipment): boolean {
  return Boolean(getEquipmentById(equipment.id))
    && isEquipmentEquipped(player, equipment.id)
    && nonNegativeInteger(player.items?.[REFORGE_STONE_ID], 0) >= getEquipmentRefinementCost(player)
}

export function refineEquipment(player: GameState['player'], equipment: Equipment, random: () => number = Math.random): { player: GameState['player']; refinement: EquipmentRefinement } | null {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment || !canRefineEquipment(player, knownEquipment)) return null
  const gradeIndex = GRADE_ORDER.indexOf(knownEquipment.gradeTone)
  const stat = EQUIPMENT_REFINEMENT_STATS[Math.floor(getRandomValue(random) * EQUIPMENT_REFINEMENT_STATS.length)]!
  const baseAmount = stat === 'maxHealth' ? 70 : stat === 'attack' ? 14 : stat === 'defense' ? 10 : 4
  const amount = Math.max(1, Math.round(baseAmount * (1 + gradeIndex * 0.25) * (0.85 + getRandomValue(random) * 0.3)))
  const items = { ...(player.items ?? {}), [REFORGE_STONE_ID]: Math.max(0, (player.items?.[REFORGE_STONE_ID] ?? 0) - getEquipmentRefinementCost(player)) }
  const refinement = { stat, amount }
  return { player: syncPlayerPower({ ...player, items, equipmentRefinements: { ...(player.equipmentRefinements ?? {}), [equipment.id]: refinement } }), refinement }
}

function isPercentageCombatStat(stat: keyof CombatStats): boolean {
  return !['maxHealth', 'attack', 'defense', 'speed'].includes(stat)
}

export function getEquipmentCombatBonuses(player: GameState['player'], equipment: Equipment): Partial<CombatStats> {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return {}
  const level = getEquipmentEnhancementLevel(player, equipment.id)
  const rank = getEquipmentRank(player, equipment.id)
  const multiplier = (1 + level * EQUIPMENT_ENHANCEMENT_STAT_GROWTH) * (1 + rank * 0.06)
  const bonuses = Object.fromEntries(Object.entries(knownEquipment.combatBonuses ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const stat = key as keyof CombatStats
    const enhanced = isPercentageCombatStat(stat)
      ? Math.round(value * multiplier * 10) / 10
      : Math.round(value * multiplier)
    return [[stat, enhanced]]
  })) as Partial<CombatStats>
  const refinement = getEquipmentRefinement(player, equipment.id)
  if (refinement) bonuses[refinement.stat] = (bonuses[refinement.stat] ?? 0) + refinement.amount
  return bonuses
}

/** Core-stat multipliers scale with equipment enhancement and the realm panel. */
export function getEquipmentCombatRates(player: GameState['player'], equipment: Equipment): CombatRateBonuses {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return {}
  const level = getEquipmentEnhancementLevel(player, equipment.id)
  const rank = getEquipmentRank(player, equipment.id)
  const multiplier = (1 + level * EQUIPMENT_ENHANCEMENT_STAT_GROWTH) * (1 + rank * 0.06)
  return Object.fromEntries(CORE_COMBAT_STATS.flatMap((stat) => {
    const rate = knownEquipment.combatRates?.[stat]
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return []
    return [[stat, Math.round(rate * multiplier * 100) / 100]]
  })) as CombatRateBonuses
}

export function getEquipmentGemBonuses(equipped: EquippedEquipment | null | undefined): { bonuses: Partial<CombatStats>; rates: CombatRateBonuses } {
  const bonuses: Partial<CombatStats> = {}
  const rates: CombatRateBonuses = {}
  const gems = equipped && Array.isArray(equipped.gems) ? equipped.gems : []
  for (const gemId of gems) {
    if (typeof gemId !== 'string') continue
    const gem = getInventoryItemById(gemId)
    for (const effect of gem?.gemEffects ?? []) {
      if (effect.kind === 'combatBonus') bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.amount
      else rates[effect.stat] = (rates[effect.stat] ?? 0) + effect.amount
    }
  }
  return { bonuses, rates }
}

export function canUnlockEquipmentGemSlot(player: GameState['player'], slot: EquipmentSlot): boolean {
  const equipped = player.equippedEquipment?.[slot]
  const equipment = equipped ? getEquipmentById(equipped.equipmentId) : undefined
  const socketLimit = equipment ? getEquipmentGemSocketLimit(equipment) : 0
  return Boolean(
    equipped
      && Array.isArray(equipped.gems)
      && socketLimit > 0
      && equipped.gems.length < socketLimit
      && nonNegativeInteger(player.langyu) >= EQUIPMENT_GEM_SOCKET_COST,
  )
}

export function unlockEquipmentGemSlot(player: GameState['player'], slot: EquipmentSlot): GameState['player'] | null {
  const equipped = player.equippedEquipment?.[slot]
  const equipment = equipped ? getEquipmentById(equipped.equipmentId) : undefined
  const socketLimit = equipment ? getEquipmentGemSocketLimit(equipment) : 0
  if (!equipped || !Array.isArray(equipped.gems) || !socketLimit || equipped.gems.length >= socketLimit || nonNegativeInteger(player.langyu) < EQUIPMENT_GEM_SOCKET_COST) return null
  return syncPlayerPower({
    ...player,
    langyu: nonNegativeInteger(player.langyu) - EQUIPMENT_GEM_SOCKET_COST,
    equippedEquipment: {
      ...player.equippedEquipment,
      [slot]: { ...equipped, gems: [...equipped.gems, null] },
    },
  })
}

export interface GemSynthesisResult {
  player: GameState['player']
  source: InventoryItem
  target: InventoryItem
  success: boolean
  successRate: number
}

export function getGemSynthesisTarget(gem: InventoryItem): InventoryItem | null {
  const tier = typeof gem.gemTier === 'number' && Number.isInteger(gem.gemTier) ? gem.gemTier : null
  if (gem.category !== 'gem' || !gem.gemFamily || tier === null || tier >= 5) return null
  return INVENTORY_ITEMS.find((item) => item.category === 'gem' && item.gemFamily === gem.gemFamily && item.gemTier === tier + 1) ?? null
}

export function getGemSynthesisSuccessRate(gem: InventoryItem): number {
  const tier = typeof gem.gemTier === 'number' && Number.isInteger(gem.gemTier) ? gem.gemTier : null
  if (gem.category !== 'gem' || tier === null || tier < 0 || tier >= GEM_SYNTHESIS_SUCCESS_RATES.length) return 0
  return GEM_SYNTHESIS_SUCCESS_RATES[tier] ?? 0
}

export function canSynthesizeGem(player: GameState['player'], gem: InventoryItem): boolean {
  return gem.category === 'gem' && getGemSynthesisTarget(gem) !== null && nonNegativeInteger(player.items?.[gem.id], 0) >= 3
}

export function synthesizeGem(player: GameState['player'], gem: InventoryItem, random: () => number = Math.random): GemSynthesisResult | null {
  const target = getGemSynthesisTarget(gem)
  const successRate = getGemSynthesisSuccessRate(gem)
  if (!target || !canSynthesizeGem(player, gem)) return null
  const items = { ...(player.items ?? {}), [gem.id]: nonNegativeInteger(player.items?.[gem.id], 0) - 3 }
  const success = getRandomValue(random) < successRate
  if (success) items[target.id] = addCappedInteger(items[target.id], 1)
  return { player: syncPlayerPower({ ...player, items }), source: gem, target, success, successRate }
}

export function socketEquipmentGem(player: GameState['player'], slot: EquipmentSlot, gemIndex: number, gemId: string): GameState['player'] | null {
  const equipped = player.equippedEquipment?.[slot]
  const equipment = equipped ? getEquipmentById(equipped.equipmentId) : undefined
  const gem = getInventoryItemById(gemId)
  const gemCount = nonNegativeInteger(player.items?.[gemId], 0)
  const socketLimit = equipment ? getEquipmentGemSocketLimit(equipment) : 0
  const alreadySocketedFamily = Boolean(
    gem?.gemFamily
      && equipped
      && Array.isArray(equipped.gems)
      && equipped.gems.some((existingGemId) => getInventoryItemById(existingGemId ?? '')?.gemFamily === gem.gemFamily),
  )
  if (!equipped || !Array.isArray(equipped.gems) || !socketLimit || equipped.gems.length > socketLimit || !gem || gem.category !== 'gem' || !gem.gemEffects?.length || !Number.isInteger(gemIndex) || gemIndex < 0 || gemIndex >= equipped.gems.length || equipped.gems[gemIndex] !== null || gemCount < 1 || alreadySocketedFamily) return null
  const items = { ...(player.items ?? {}), [gemId]: gemCount - 1 }
  const gems = [...equipped.gems]
  gems[gemIndex] = gemId
  return syncPlayerPower({ ...player, items, equippedEquipment: { ...player.equippedEquipment, [slot]: { ...equipped, gems } } })
}

export function removeEquipmentGem(player: GameState['player'], slot: EquipmentSlot, gemIndex: number): GameState['player'] | null {
  const equipped = player.equippedEquipment?.[slot]
  if (!equipped || !Array.isArray(equipped.gems) || !Number.isInteger(gemIndex) || gemIndex < 0 || gemIndex >= equipped.gems.length) return null
  const gemId = equipped?.gems?.[gemIndex]
  if (typeof gemId !== 'string' || getInventoryItemById(gemId)?.category !== 'gem') return null
  const gems = [...equipped.gems]
  gems[gemIndex] = null
  const items = { ...(player.items ?? {}), [gemId]: addCappedInteger(player.items?.[gemId], 1) }
  return syncPlayerPower({ ...player, items, equippedEquipment: { ...player.equippedEquipment, [slot]: { ...equipped, gems } } })
}

const EQUIPMENT_ENHANCEMENT_GRADE_COST: Record<GradeTone, number> = {
  white: 1,
  green: 1.3,
  blue: 1.7,
  purple: 2.2,
  orange: 2.9,
  red: 3.7,
}

export function getEquipmentEnhancementCost(player: GameState['player'], equipment: Equipment): number {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment) return Number.POSITIVE_INFINITY
  const level = getEquipmentEnhancementLevel(player, equipment.id)
  return Math.max(1, Math.ceil((6 + level * 2) * EQUIPMENT_ENHANCEMENT_GRADE_COST[knownEquipment.gradeTone]))
}

export function canEnhanceEquipment(player: GameState['player'], equipment: Equipment): boolean {
  return Boolean(getEquipmentById(equipment.id))
    && isEquipmentEquipped(player, equipment.id)
    && getEquipmentEnhancementLevel(player, equipment.id) < EQUIPMENT_ENHANCEMENT_MAX_LEVEL
    && player.forge >= getEquipmentEnhancementCost(player, equipment)
}

export function enhanceEquipment(player: GameState['player'], equipment: Equipment): GameState['player'] | null {
  if (!canEnhanceEquipment(player, equipment)) return null
  const level = getEquipmentEnhancementLevel(player, equipment.id)
  const cost = getEquipmentEnhancementCost(player, equipment)
  const enhancements = player.equipmentEnhancements && typeof player.equipmentEnhancements === 'object'
    ? player.equipmentEnhancements
    : {}
  return syncPlayerPower({
    ...player,
    forge: player.forge - cost,
    equipmentEnhancements: { ...enhancements, [equipment.id]: level + 1 },
  })
}

function getEquipmentSetById(id: string): EquipmentSet | undefined {
  return getEquipmentSetConfigById(id)
}

export function getEquipmentSetActivations(player: GameState['player']): Array<{ set: EquipmentSet; count: number; activeBonuses: EquipmentSet['bonuses'] }> {
  const counts = new Map<string, number>()
  for (const equipment of getEquippedEquipment(player)) {
    if (equipment.setId && EQUIPMENT_SET_SLOTS.has(equipment.categoryId)) {
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

export function getActiveEquipmentSetRates(player: GameState['player']): CombatRateBonuses[] {
  return getEquipmentSetActivations(player).flatMap((activation) => activation.activeBonuses.flatMap((bonus) => bonus.combatRates ? [bonus.combatRates] : []))
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
  const martialPassives = getEquippedInnerArts(player).flatMap((art) => getMartialPassiveEffects(player, art))
  return [...setPassives, ...martialPassives].map((effect) => ({ ...effect }))
}

export function getPlayerOuterSkills(player: GameState['player']): MartialActiveSkill[] {
  return getEquippedOuterArts(player).flatMap((art) => {
    const skill = getMartialActiveSkill(player, art)
    return skill ? [{ ...skill, weaponAffinityActive: hasMartialWeaponAffinity(player, art) }] : []
  })
}

export function equipPlayerMartialArt(
  player: GameState['player'],
  slot: MartialArtSlot,
  art: MartialArt,
  ownedMartialArtIds?: readonly string[],
): GameState['player'] {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt || knownArt.kind !== getMartialArtSlotKind(slot)) return player
  if (ownedMartialArtIds && !ownedMartialArtIds.includes(knownArt.id)) return player
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

export function equipPlayerEquipment(
  player: GameState['player'],
  slot: EquipmentSlot,
  equipment: Equipment,
  ownedEquipmentIds?: readonly string[],
): GameState['player'] {
  const knownEquipment = getEquipmentById(equipment.id)
  if (!knownEquipment || !canEquipEquipmentInSlot(knownEquipment, slot)) return player
  if (ownedEquipmentIds) {
    const ownedCopies = ownedEquipmentIds.filter((id) => id === knownEquipment.id).length
    const equippedCopies = EQUIPMENT_SLOTS.filter((candidate) => (
      candidate !== slot && player.equippedEquipment?.[candidate]?.equipmentId === knownEquipment.id
    )).length
    if (ownedCopies <= equippedCopies) return player
  }
  return syncPlayerPower({
    ...player,
    equippedEquipment: {
      ...player.equippedEquipment,
      [slot]: createEquippedEquipment(knownEquipment),
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
    ownedEquipmentIds: [...STARTER_EQUIPMENT_IDS],
    ownedMartialArtIds: [...STARTER_MARTIAL_ART_IDS],
    history: [],
  }
}

function createInitialDungeonState(): DungeonState {
  return { date: null, attempts: {}, stamina: 24, staminaUpdatedAt: Date.now(), highestCleared: {} }
}

function createInitialTempleState(): TempleState {
  return { ranks: { ...INITIAL_TEMPLE_STATE.ranks } }
}

function getMartialArtById(id: string): MartialArt | undefined {
  return getMartialArtConfigById(id)
}

function getRandomValue(random: () => number): number {
  const value = random()
  return Number.isFinite(value) ? Math.min(.999999999, Math.max(0, value)) : 0
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
  const scaled = Math.max(0, finiteNumber(amount, 0)) * MAIN_STAGE_REWARDS.replayRate
  const whole = Math.floor(scaled)
  return whole + (getRandomValue(random) < scaled - whole ? 1 : 0)
}

export function getMainStageReplayReward(stage: MainStage, random: () => number = Math.random): MainStageReplayReward {
  const eliteBonus = stage.isElite && getRandomValue(random) < MAIN_STAGE_REWARDS.eliteReplayBonusChance
  return {
    silver: scaleReplayReward(stage.reward.silver, random),
    langyu: 0,
    forge: scaleReplayReward(stage.reward.forge, random) + (eliteBonus ? 1 : 0),
    insight: scaleReplayReward(stage.reward.insight, random) + (eliteBonus ? 1 : 0),
    fame: scaleReplayReward(stage.reward.fame, random),
    eliteBonus,
  }
}

/** Applies a main-story reward as one bounded domain operation. */
export function applyMainStageReward(player: GameState['player'], reward: MainStageReward): GameState['player'] {
  return {
    ...player,
    silver: addCappedInteger(player.silver, reward.silver),
    langyu: addCappedInteger(player.langyu, reward.langyu),
    forge: addCappedInteger(player.forge, reward.forge),
    insight: addCappedInteger(player.insight, reward.insight),
    fame: addCappedInteger(player.fame, reward.fame),
  }
}

/**
 * Resolves a main-story victory as one domain transaction. A first-clear
 * victory advances the journey and grants its reward atomically; a replay
 * requires the stage to have already been cleared and only grants replay
 * rewards. The UI can therefore render the result without owning progression
 * rules or risking a partial update.
 */
export function resolveMainStageVictory(
  player: GameState['player'],
  journey: JourneyState,
  stage: MainStage,
  isReplay: boolean,
  random: () => number = Math.random,
): { player: GameState['player']; journey: JourneyState; reward: BattleReward } | null {
  const canonicalStage = getMainStageByOrdinal(stage.ordinal)
  if (
    !canonicalStage
    || canonicalStage.chapter !== stage.chapter
    || canonicalStage.stage !== stage.stage
  ) return null
  stage = canonicalStage

  if (isReplay) {
    if (!hasClearedMainStage(journey, stage)) return null
    const reward = getMainStageReplayReward(stage, random)
    return { player: applyMainStageReward(player, reward), journey, reward }
  }

  const currentStage = getCurrentMainStage(journey)
  if (!currentStage || currentStage.ordinal !== stage.ordinal) return null
  const nextJourney = advanceMainJourney(journey, stage)
  if (!nextJourney) return null
  return {
    player: applyMainStageReward(player, stage.reward),
    journey: nextJourney,
    reward: { ...stage.reward, eliteBonus: false },
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

export function getTempleRank(temple: TempleState | undefined, idolId: IdolId): number {
  const config = getIdolConfig(idolId)
  if (!config) return 0
  return clamp(Math.floor(finiteNumber(temple?.ranks?.[idolId], 0)), 0, config.maxRank)
}

export function getTempleIdolEffect(temple: TempleState | undefined, idolId: IdolId): number {
  const config = getIdolConfig(idolId)
  return config ? Math.round(getTempleRank(temple, idolId) * config.ratePerRank * 100) / 100 : 0
}

export function getTempleOfferingCost(temple: TempleState | undefined, idolId: IdolId): number {
  const config = getIdolConfig(idolId)
  if (!config) return 0
  const rank = getTempleRank(temple, idolId)
  if (rank >= config.maxRank) return 0
  return Math.ceil(50 * Math.pow(1.18, rank))
}

export function canOfferToIdol(player: GameState['player'], temple: TempleState | undefined, idolId: IdolId): boolean {
  const config = getIdolConfig(idolId)
  const cost = getTempleOfferingCost(temple, idolId)
  return Boolean(config && cost > 0 && player.incense >= cost)
}

export function offerToIdol(player: GameState['player'], temple: TempleState, idolId: IdolId): { player: GameState['player']; temple: TempleState; idol: IdolId; rank: number; effect: number } | null {
  if (!canOfferToIdol(player, temple, idolId)) return null
  const cost = getTempleOfferingCost(temple, idolId)
  const rank = getTempleRank(temple, idolId) + 1
  const nextTemple = { ranks: { ...temple.ranks, [idolId]: rank } }
  return { player: { ...player, incense: Math.max(0, player.incense - cost) }, temple: nextTemple, idol: idolId, rank, effect: getTempleIdolEffect(nextTemple, idolId) }
}

function getTempleCombatRates(temple: TempleState | undefined): CombatRateBonuses {
  const rates: CombatRateBonuses = {}
  for (const config of IDOL_CONFIGS) {
    if (config.stat === 'innerForceRate') continue
    const effect = getTempleIdolEffect(temple, config.id)
    if (effect > 0) rates[config.stat] = effect
  }
  return rates
}

export function getPlayerCombatStats(player: GameState['player'], temple?: TempleState): CombatStats {
  const equipment = getEquippedEquipment(player)
  const equipmentSetActivations = getEquipmentSetActivations(player)
  const activeSetBonuses = equipmentSetActivations.flatMap(({ activeBonuses }) => activeBonuses.flatMap((bonus) => bonus.combatBonuses ? [bonus.combatBonuses] : []))
  const activeSetRates = equipmentSetActivations.flatMap(({ activeBonuses }) => activeBonuses.flatMap((bonus) => bonus.combatRates ? [bonus.combatRates] : []))
  const gemBonuses = EQUIPMENT_SLOTS.map((slot) => getEquipmentGemBonuses(player.equippedEquipment?.[slot]))
  let stats = getRealmBaseCombatStats(player)

  // The temple is its own multiplier zone: it grows the realm foundation
  // before equipment, set, and gem percentages are applied.
  stats = addCombatRates(stats, getTempleCombatRates(temple))
  stats = addCombatRates(stats, sumCombatRates([
    ...equipment.map((item) => getEquipmentCombatRates(player, item)),
    ...activeSetRates,
    ...gemBonuses.map((gems) => gems.rates),
    player.pillCombatRates,
  ]))

  // Fixed bonuses stay outside the two foundation multiplier zones.
  for (const item of equipment) {
    stats = addCombatBonuses(stats, getEquipmentCombatBonuses(player, item))
  }
  for (const gems of gemBonuses) stats = addCombatBonuses(stats, gems.bonuses)
  for (const bonuses of activeSetBonuses) stats = addCombatBonuses(stats, bonuses)
  for (const art of getEquippedInnerArts(player)) stats = addCombatBonuses(stats, getMartialCombatBonuses(player, art))
  stats = addCombatBonuses(stats, player.pillCombatBonuses)
  return normalizeCombatStats(stats)
}

export function getPlayerPower(player: GameState['player'], temple?: TempleState): number {
  return getCombatPower(getPlayerCombatStats(player, temple))
}

export function syncPlayerPower(player: GameState['player'], temple?: TempleState): GameState['player'] {
  return { ...player, power: getPlayerPower(player, temple) }
}

export function createInitialGame(): GameState {
  const now = Date.now()
  const player = {
    ...INITIAL_PLAYER_PROFILE,
    power: 0,
    equipmentEnhancements: { ...INITIAL_PLAYER_PROFILE.equipmentEnhancements },
    equipmentRanks: { ...INITIAL_PLAYER_PROFILE.equipmentRanks },
    equipmentRefinements: { ...INITIAL_PLAYER_PROFILE.equipmentRefinements },
    pillCombatBonuses: { ...INITIAL_PLAYER_PROFILE.pillCombatBonuses },
    pillCombatRates: { ...INITIAL_PLAYER_PROFILE.pillCombatRates },
    mastery: { ...INITIAL_PLAYER_PROFILE.mastery },
    martialRanks: { ...INITIAL_PLAYER_PROFILE.martialRanks },
    items: { ...INITIAL_PLAYER_PROFILE.items },
    equippedEquipment: createEquipmentLoadout(INITIAL_EQUIPMENT_LOADOUT),
    martialLoadout: createMartialLoadout(INITIAL_PLAYER_PROFILE.martialLoadout),
  }
  return {
    version: CURRENT_GAME_VERSION,
    player: syncPlayerPower(player),
    cultivation: { amount: 0, practiceProgress: 0, lastAccruedAt: now, autoPractice: false },
    dailyCheckIn: { ...INITIAL_DAILY_CHECK_IN },
    materialBounties: { ...INITIAL_MATERIAL_BOUNTIES },
    shop: { purchaseDate: INITIAL_SHOP_STATE.purchaseDate, purchaseCounts: { ...INITIAL_SHOP_STATE.purchaseCounts } },
    dungeons: createInitialDungeonState(),
    temple: createInitialTempleState(),
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
    player: { ...player, langyu: addCappedInteger(player.langyu, DAILY_CHECK_IN_REWARD) },
    dailyCheckIn: { lastClaimedDate: dateKey(now) },
  }
}

export const DAILY_MATERIAL_BOUNTY_WINS = 1
export const DAILY_MATERIAL_BOUNTY_REWARD = 1
export const WEEKLY_MATERIAL_BOUNTY_WINS = 5
export const WEEKLY_MATERIAL_BOUNTY_REWARD = 3

export function normalizeMaterialBountyState(state: MaterialBountyState, now = Date.now()): MaterialBountyState {
  const today = dateKey(now)
  const currentWeek = weekKey(now)
  const dailyDate = normalizeDateKey(state.dailyDate)
  const weeklyKey = normalizeDateKey(state.weeklyKey)
  return {
    dailyDate: today,
    dailyDungeonWins: dailyDate === today ? nonNegativeInteger(state.dailyDungeonWins) : 0,
    dailyClaimed: dailyDate === today && state.dailyClaimed === true,
    weeklyKey: currentWeek,
    weeklyDungeonWins: weeklyKey === currentWeek ? nonNegativeInteger(state.weeklyDungeonWins) : 0,
    weeklyClaimed: weeklyKey === currentWeek && state.weeklyClaimed === true,
  }
}

export function recordDungeonMaterialBountyWin(state: MaterialBountyState, now = Date.now()): MaterialBountyState {
  const current = normalizeMaterialBountyState(state, now)
  return {
    ...current,
    dailyDungeonWins: current.dailyDungeonWins + 1,
    weeklyDungeonWins: current.weeklyDungeonWins + 1,
  }
}

export function canClaimDailyMaterialBounty(state: MaterialBountyState, now = Date.now()): boolean {
  const current = normalizeMaterialBountyState(state, now)
  return !current.dailyClaimed && current.dailyDungeonWins >= DAILY_MATERIAL_BOUNTY_WINS
}

export function claimDailyMaterialBounty(
  player: GameState['player'],
  state: MaterialBountyState,
  now = Date.now(),
): { player: GameState['player']; materialBounties: MaterialBountyState } | null {
  const current = normalizeMaterialBountyState(state, now)
  if (!canClaimDailyMaterialBounty(current, now)) return null
  return {
    player: { ...player, items: { ...(player.items ?? {}), [REFORGE_STONE_ID]: addCappedInteger(player.items?.[REFORGE_STONE_ID], DAILY_MATERIAL_BOUNTY_REWARD) } },
    materialBounties: { ...current, dailyClaimed: true },
  }
}

export function canClaimWeeklyMaterialBounty(state: MaterialBountyState, now = Date.now()): boolean {
  const current = normalizeMaterialBountyState(state, now)
  return !current.weeklyClaimed && current.weeklyDungeonWins >= WEEKLY_MATERIAL_BOUNTY_WINS
}

export function claimWeeklyMaterialBounty(
  player: GameState['player'],
  state: MaterialBountyState,
  now = Date.now(),
): { player: GameState['player']; materialBounties: MaterialBountyState } | null {
  const current = normalizeMaterialBountyState(state, now)
  if (!canClaimWeeklyMaterialBounty(current, now)) return null
  return {
    player: { ...player, items: { ...(player.items ?? {}), [EQUIPMENT_ESSENCE_ID]: addCappedInteger(player.items?.[EQUIPMENT_ESSENCE_ID], WEEKLY_MATERIAL_BOUNTY_REWARD) } },
    materialBounties: { ...current, weeklyClaimed: true },
  }
}

function getShopProgressChapter(journey: JourneyState): number {
  if (journey.completed) return MAIN_STORY_CHAPTERS
  return clamp(Math.floor(finiteNumber(journey.currentChapter, 1)), 1, MAIN_STORY_CHAPTERS)
}

/** Resolves a data-defined shop offer at the player's current main-story chapter. */
export function getSilverShopOffer(journey: JourneyState, productId: string): SilverShopOffer | null {
  const product = getSilverShopProduct(productId)
  if (!product) return null
  const progressBands = Math.floor((getShopProgressChapter(journey) - 1) / product.growthEveryChapters)
  const price = Math.max(1, Math.round(product.basePrice * Math.pow(1 + product.priceGrowthRate, progressBands)))
  const rewards = product.rewards.map((reward) => ({
    type: reward.type,
    amount: Math.max(1, Math.floor(reward.amount * Math.pow(1 + product.rewardGrowthRate, progressBands))),
    itemId: reward.itemId,
  }))
  return { productId: product.id, price, rewards }
}

export function getSilverShopPurchaseCount(shop: ShopState, productId: string, now = Date.now()): number {
  if (!getSilverShopProduct(productId) || shop.purchaseDate !== dateKey(now)) return 0
  return nonNegativeInteger(shop.purchaseCounts?.[productId], 0)
}

export function getSilverShopPurchaseRemaining(shop: ShopState, productId: string, now = Date.now()): number {
  const product = getSilverShopProduct(productId)
  if (!product) return 0
  return Math.max(0, product.dailyLimit - getSilverShopPurchaseCount(shop, productId, now))
}

/**
 * Performs the complete silver-store transaction. UI code cannot grant an
 * item or deduct silver independently, which keeps balance checks atomic.
 */
export function purchaseSilverShopProduct(
  player: GameState['player'],
  cultivation: CultivationState,
  journey: JourneyState,
  shop: ShopState,
  productId: string,
  now = Date.now(),
): { player: GameState['player']; cultivation: CultivationState; shop: ShopState; offer: SilverShopOffer } | null {
  const product = getSilverShopProduct(productId)
  const offer = getSilverShopOffer(journey, productId)
  const silver = nonNegativeInteger(player.silver)
  if (!product || !offer || silver < offer.price || getSilverShopPurchaseRemaining(shop, productId, now) < 1) return null

  let nextPlayer: GameState['player'] = { ...player, silver: silver - offer.price }
  let nextCultivation: CultivationState = {
    ...cultivation,
    amount: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, finiteNumber(cultivation.amount, 0))),
  }
  for (const reward of offer.rewards) {
    if (reward.type === 'innerForce') {
      nextCultivation = { ...nextCultivation, amount: Math.min(Number.MAX_SAFE_INTEGER, nextCultivation.amount + reward.amount) }
    } else if (reward.type === 'item' && reward.itemId && getInventoryItemById(reward.itemId)) {
      nextPlayer = { ...nextPlayer, items: { ...(nextPlayer.items ?? {}), [reward.itemId]: addCappedInteger(nextPlayer.items?.[reward.itemId], reward.amount) } }
    } else if (reward.type === 'item') {
      continue
    } else {
      nextPlayer = {
        ...nextPlayer,
        [reward.type]: addCappedInteger(nextPlayer[reward.type], reward.amount),
      }
    }
  }
  const today = dateKey(now)
  const currentCount = getSilverShopPurchaseCount(shop, productId, now)
  const purchaseCounts = shop.purchaseDate === today ? { ...shop.purchaseCounts } : {}
  purchaseCounts[productId] = currentCount + 1
  return { player: nextPlayer, cultivation: nextCultivation, shop: { purchaseDate: today, purchaseCounts }, offer }
}

export function getMartialMastery(player: GameState['player'], artId: string): number {
  const art = getMartialArtConfigById(artId)
  const savedMastery = player.mastery && typeof player.mastery === 'object' ? player.mastery[artId] : undefined
  const fallback = art?.mastery ?? 0
  return clamp(Math.floor(finiteNumber(savedMastery, fallback)), 0, 100)
}

const MARTIAL_ASCENSION_INSIGHT_BASE_COST = 50
const MARTIAL_ASCENSION_INSIGHT_STEP = 25
const MARTIAL_ASCENSION_MAX_RANK = 10

export function getMartialAscensionRank(player: GameState['player'], art: MartialArt): number {
  const maxRank = Math.max(1, Math.floor(art.ascension?.maxRank ?? MARTIAL_ASCENSION_MAX_RANK))
  return clamp(Math.floor(finiteNumber(player.martialRanks?.[art.id], 0)), 0, maxRank)
}

export function getMartialAscensionRequirement(player: GameState['player'], art: MartialArt): { rank: number; maxRank: number; insight: number; duplicates: number } {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt) return { rank: 0, maxRank: 0, insight: 0, duplicates: 0 }
  const maxRank = Math.max(1, Math.floor(knownArt.ascension?.maxRank ?? MARTIAL_ASCENSION_MAX_RANK))
  const rank = getMartialAscensionRank(player, knownArt)
  if (rank >= maxRank) return { rank, maxRank, insight: 0, duplicates: 0 }
  if (rank < 5) return { rank, maxRank, insight: MARTIAL_ASCENSION_INSIGHT_BASE_COST + rank * MARTIAL_ASCENSION_INSIGHT_STEP, duplicates: 0 }
  return { rank, maxRank, insight: 0, duplicates: rank === maxRank - 1 ? 2 : 1 }
}

export function getMartialAscensionDuplicateCount(player: GameState['player'], art: MartialArt, ownedMartialArtIds: readonly string[]): number {
  const equippedCopies = Object.values(player.martialLoadout ?? {}).filter((id) => id === art.id).length
  return Math.max(0, ownedMartialArtIds.filter((id) => id === art.id).length - equippedCopies)
}

export function getMartialAscensionTokenCount(player: GameState['player']): number {
  return Math.max(0, Math.floor(finiteNumber(player.items?.[MARTIAL_ASCENSION_TOKEN_ID], 0)))
}

export function canAscendMartialArt(player: GameState['player'], art: MartialArt, ownedMartialArtIds: readonly string[] = []): boolean {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt) return false
  const requirement = getMartialAscensionRequirement(player, knownArt)
  if (requirement.rank >= requirement.maxRank) return false
  if (requirement.insight > 0) return player.insight >= requirement.insight
  return getMartialAscensionDuplicateCount(player, art, ownedMartialArtIds) + getMartialAscensionTokenCount(player) >= requirement.duplicates
}

export function ascendMartialArt(player: GameState['player'], art: MartialArt, ownedMartialArtIds: readonly string[] = []): { player: GameState['player']; ownedMartialArtIds: string[]; consumedDuplicates: number; consumedTokens: number } | null {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt || !canAscendMartialArt(player, knownArt, ownedMartialArtIds)) return null
  const requirement = getMartialAscensionRequirement(player, knownArt)
  let consumedDuplicates = 0
  let consumedTokens = 0
  let nextPlayer = player
  let nextOwnedIds = [...ownedMartialArtIds]
  if (requirement.insight > 0) {
    nextPlayer = { ...nextPlayer, insight: nextPlayer.insight - requirement.insight }
  } else {
    const availableDuplicates = getMartialAscensionDuplicateCount(player, art, ownedMartialArtIds)
    consumedDuplicates = Math.min(availableDuplicates, requirement.duplicates)
    consumedTokens = requirement.duplicates - consumedDuplicates
    let equippedCopies = Object.values(player.martialLoadout ?? {}).filter((id) => id === art.id).length
    nextOwnedIds = ownedMartialArtIds.filter((id) => {
      if (id !== art.id) return true
      if (equippedCopies > 0) { equippedCopies -= 1; return true }
      if (consumedDuplicates > 0) { consumedDuplicates -= 1; return false }
      return true
    })
    consumedDuplicates = requirement.duplicates - consumedTokens
    const items = { ...(nextPlayer.items ?? {}) }
    items[MARTIAL_ASCENSION_TOKEN_ID] = getMartialAscensionTokenCount(nextPlayer) - consumedTokens
    nextPlayer = { ...nextPlayer, items }
  }
  const currentRank = requirement.rank
  const martialRanks = { ...(nextPlayer.martialRanks ?? {}), [art.id]: currentRank + 1 }
  return { player: syncPlayerPower({ ...nextPlayer, martialRanks }), ownedMartialArtIds: nextOwnedIds, consumedDuplicates, consumedTokens }
}

function ascensionProgress(player: GameState['player'], art: MartialArt): number {
  const maxRank = Math.max(1, Math.floor(art.ascension?.maxRank ?? MARTIAL_ASCENSION_MAX_RANK))
  return getMartialAscensionRank(player, art) / maxRank
}

export function getMartialAscensionStatMultiplier(player: GameState['player'], art: MartialArt): number {
  const knownArt = getMartialArtById(art.id)
  return knownArt ? 1 + ascensionProgress(player, knownArt) * (MARTIAL_ASCENSION_MAX_STAT_MULTIPLIER - 1) : 1
}

function interpolateAscensionValue(player: GameState['player'], art: MartialArt, values: { base: number; max: number }): number {
  return Math.round((values.base + (values.max - values.base) * ascensionProgress(player, art)) * 100) / 100
}

export function getMartialPassiveEffects(player: GameState['player'], art: MartialArt): CombatPassiveEffect[] {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt || knownArt.kind !== 'inner') return []
  art = knownArt
  const ascensionMultiplier = getMartialAscensionStatMultiplier(player, art)
  const defaultEffects: CombatPassiveEffect[] = []
  if (art.gradeTone === 'purple') {
    defaultEffects.push({ id: `default-${art.id}-skill-rage`, label: '紫气回流', description: '每次释放主动技能后，返还25怒气。', kind: 'skill-rage-refund', value: 25 })
  }
  if (art.gradeTone === 'orange') {
    defaultEffects.push(
      { id: `default-${art.id}-opening-rage`, label: '橙阶先机', description: '开局获得50怒气。', kind: 'battle-start-rage', value: 50 },
      { id: `default-${art.id}-skill-rage`, label: '橙阶回气', description: '每次释放主动技能后，返还50怒气。', kind: 'skill-rage-refund', value: 50 },
    )
  }
  if (art.gradeTone === 'red') {
    defaultEffects.push(
      { id: `default-${art.id}-opening-rage`, label: '赤阶先机', description: '开局获得150怒气。', kind: 'battle-start-rage', value: 150 },
      { id: `default-${art.id}-skill-rage`, label: '赤阶回气', description: '每次释放主动技能后，返还75怒气。', kind: 'skill-rage-refund', value: 75 },
    )
  }
  return [...defaultEffects, ...(art.passiveEffects ?? [])].map((effect) => {
    let value = effect.value
    let description = effect.description
    const isDefaultRageEffect = effect.id.startsWith(`default-${art.id}-`)
    if (effect.kind === 'battle-start-rage' && art.ascension?.rageAtBattleStart) {
      value = interpolateAscensionValue(player, art, art.ascension.rageAtBattleStart)
      description = `开战时获得${value}怒气。`
    } else if (isDefaultRageEffect && (effect.kind === 'battle-start-rage' || effect.kind === 'skill-rage-refund')) {
      value = Math.max(0, Math.round(effect.value * ascensionMultiplier))
      description = effect.kind === 'battle-start-rage'
        ? `开战时获得${value}怒气。`
        : `每次释放主动技能后，返还${value}怒气。`
    }
    return { ...effect, value, description }
  })
}

export function getMartialCombatBonuses(player: GameState['player'], art: MartialArt): Partial<CombatStats> | undefined {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt || knownArt.kind !== 'inner' || !knownArt.combatBonuses) return undefined
  const multiplier = getMartialAscensionStatMultiplier(player, knownArt)
  return Object.fromEntries(Object.entries(knownArt.combatBonuses).map(([key, value]) => [key, Math.round((value as number) * multiplier)])) as Partial<CombatStats>
}

export function getMartialActiveSkill(player: GameState['player'], art: MartialArt): MartialActiveSkill | undefined {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt || knownArt.kind !== 'outer' || !knownArt.activeSkill) return undefined
  const masteryMultiplier = 1 + getMartialMastery(player, knownArt.id) * 0.001
  const ascensionMultiplier = getMartialAscensionStatMultiplier(player, knownArt)
  const multiplier = masteryMultiplier * ascensionMultiplier
  const skill = { ...knownArt.activeSkill, damageMultiplier: Math.round(knownArt.activeSkill.damageMultiplier * multiplier * 1000) / 1000 }
  for (const key of ['bonusCritRate', 'defensePierceRate', 'stunRate'] as const) {
    if (skill[key] !== undefined) skill[key] = Math.round(skill[key]! * multiplier * 100) / 100
  }
  if (skill.grantDodge !== undefined) skill.grantDodge = Math.max(0, Math.round(skill.grantDodge * multiplier))
  return skill
}

export function getInnerForceRateBonus(player: GameState['player']): number {
  const equippedInnerIds = new Set(getEquippedInnerArts(player).map((art) => art.id))
  return Math.round(MARTIAL_ARTS.reduce((total, art) => {
    if (art.kind !== 'inner' || !equippedInnerIds.has(art.id) || art.innerForceRateBase === undefined || art.innerForceRatePerMastery === undefined) return total
    return total + (art.innerForceRateBase + getMartialMastery(player, art.id) * art.innerForceRatePerMastery) * getMartialAscensionStatMultiplier(player, art)
  }, 0) * 100) / 100 + Math.max(0, finiteNumber(player.pillInnerForceRateBonus, 0))
}

export function getInnerForceRateMultiplierBonus(player: GameState['player']): number {
  const equippedInnerIds = new Set(getEquippedInnerArts(player).map((art) => art.id))
  return Math.round(MARTIAL_ARTS.reduce((total, art) => {
    if (art.kind !== 'inner' || !equippedInnerIds.has(art.id) || art.innerForceRateMultiplierBase === undefined || art.innerForceRateMultiplierPerMastery === undefined) return total
    return total + (art.innerForceRateMultiplierBase + getMartialMastery(player, art.id) * art.innerForceRateMultiplierPerMastery) * getMartialAscensionStatMultiplier(player, art)
  }, 0) * 10_000) / 10_000
}

export function getInnerForceRate(player: GameState['player'], temple?: TempleState): number {
  const templeBonus = getTempleIdolEffect(temple, 'breath')
  return Math.round((
    getRealmInnerForceRate(player) * (1 + getInnerForceRateMultiplierBonus(player))
    + getInnerForceRateBonus(player)
    + templeBonus
  ) * 100) / 100
}

function dungeonDropGradeTone(drop: DungeonDrop): GradeTone | null {
  if (drop.kind === 'item') return getInventoryItemById(drop.itemId)?.gradeTone ?? null
  if (drop.kind === 'equipment') return getEquipmentConfigById(drop.itemId)?.gradeTone ?? null
  if (drop.kind === 'martial') return getMartialArtConfigById(drop.itemId)?.gradeTone ?? null
  return null
}

function chooseDungeonDrop(drops: readonly DungeonDrop[], random: () => number, qualityBonus = 0): DungeonDrop | null {
  const valid = drops.filter((drop) => Number.isFinite(drop.weight) && drop.weight > 0)
  const total = valid.reduce((sum, drop) => {
    const tone = dungeonDropGradeTone(drop)
    const rank = tone ? GRADE_ORDER.indexOf(tone) : -1
    const qualityMultiplier = rank < 0 ? 1 : 1 + Math.max(0, qualityBonus) * Math.max(0, rank)
    return sum + drop.weight * qualityMultiplier
  }, 0)
  if (!total) return null
  let cursor = getRandomValue(random) * total
  for (const drop of valid) {
    const tone = dungeonDropGradeTone(drop)
    const rank = tone ? GRADE_ORDER.indexOf(tone) : -1
    const qualityMultiplier = rank < 0 ? 1 : 1 + Math.max(0, qualityBonus) * Math.max(0, rank)
    cursor -= drop.weight * qualityMultiplier
    if (cursor < 0) return drop
  }
  return valid.at(-1) ?? null
}

function getDungeonDropResult(drop: DungeonDrop, quantity: number): DungeonRewardDrop | null {
  const safeQuantity = clamp(Math.floor(finiteNumber(quantity, 1)), 1, Number.MAX_SAFE_INTEGER)
  if (drop.kind === 'resource') {
    const amount = finiteNumber(drop.amount, 1) * safeQuantity
    return {
      kind: 'resource',
      resource: drop.resource,
      name: drop.resource === 'forge' ? '铸材' : drop.resource === 'insight' ? '心得' : drop.resource === 'incense' ? '香火' : '银两',
      quantity: clamp(Math.floor(finiteNumber(amount, 1)), 1, Number.MAX_SAFE_INTEGER),
    }
  }
  if (drop.kind === 'item') {
    const item = getInventoryItemById(drop.itemId)
    const quantityMultiplier = item?.category === 'gem' && (item.gemTier ?? 0) <= 1 ? 2 : 1
    return item ? { kind: 'item', itemId: item.id, name: item.name, grade: item.grade, gradeTone: item.gradeTone, quantity: Math.min(Number.MAX_SAFE_INTEGER, safeQuantity * quantityMultiplier) } : null
  }
  if (drop.kind === 'equipment') {
    const equipment = getEquipmentById(drop.itemId)
    return equipment ? { kind: 'equipment', itemId: equipment.id, name: equipment.name, grade: equipment.grade, gradeTone: equipment.gradeTone, quantity: 1 } : null
  }
  const art = getMartialArtById(drop.itemId)
  return art ? { kind: 'martial', itemId: art.id, name: art.name, grade: art.grade, gradeTone: art.gradeTone, quantity: 1 } : null
}

/**
 * Only concrete collection drops can collide with a guaranteed drop. Resource
 * rewards are intentionally allowed to appear in both guaranteed and bonus
 * rolls, so they must not share a synthetic empty key.
 */
function getDungeonDropKey(drop: DungeonDrop): string | null {
  if (drop.kind === 'item' || drop.kind === 'equipment' || drop.kind === 'martial') {
    return `${drop.kind}:${drop.itemId}`
  }
  return null
}

export function resolveDungeonReward(
  player: GameState['player'],
  lottery: LotteryState,
  dungeonState: DungeonState,
  dungeonId: string,
  layerNumber: number,
  random: () => number = Math.random,
  now = Date.now(),
): { player: GameState['player']; lottery: LotteryState; dungeons: DungeonState; reward: DungeonReward } | null {
  const dungeon = getDungeonConfig(dungeonId)
  const layer = getDungeonLayer(dungeonId, layerNumber)
  if (!dungeon || !layer) return null
  const currentDungeonState = normalizeDungeonStateForDate(dungeonState, now)
  const active = currentDungeonState.activeChallenge
  if (!active || active.dungeonId !== dungeonId || active.layer !== layerNumber) return null
  const previousHighest = getDungeonHighestCleared(currentDungeonState, dungeonId)
  // The active marker is persisted separately from the runtime encounter. Do
  // not trust it to bypass the normal sequential layer gate.
  if (layerNumber > previousHighest + 1) return null
  const firstClear = layerNumber > previousHighest
  const { activeChallenge: _activeChallenge, ...stateWithoutChallenge } = currentDungeonState
  const currentState = { ...stateWithoutChallenge, highestCleared: { ...currentDungeonState.highestCleared } }
  currentState.highestCleared[dungeonId] = Math.max(previousHighest, layerNumber)
  const drops: DungeonRewardDrop[] = []
  for (const guaranteed of layer.guaranteedDrops ?? []) {
    const result = getDungeonDropResult(guaranteed, guaranteed.kind === 'item' ? (guaranteed.quantity ?? 1) : 1)
    if (result) drops.push(result)
  }
  const guaranteedKeys = new Set(
    (layer.guaranteedDrops ?? [])
      .map(getDungeonDropKey)
      .filter((key): key is string => key !== null),
  )
  const bonusPool = layer.drops.filter((drop) => {
    const key = getDungeonDropKey(drop)
    return key === null || !guaranteedKeys.has(key)
  })
  const selected = chooseDungeonDrop(bonusPool, random, layer.dropQualityBonus ?? 0)
  if (selected) {
    const quantity = selected.kind === 'item' ? (selected.quantity ?? 1) : 1
    const result = getDungeonDropResult(selected, quantity)
    if (result) drops.push(result)
  }
  let nextPlayer = {
    ...player,
    silver: nonNegativeInteger(player.silver),
    langyu: nonNegativeInteger(player.langyu),
    forge: nonNegativeInteger(player.forge),
    insight: nonNegativeInteger(player.insight),
    fame: nonNegativeInteger(player.fame),
    items: { ...(player.items ?? {}) },
  }
  let nextLottery = {
    ...lottery,
    ownedEquipmentIds: Array.isArray(lottery.ownedEquipmentIds) ? [...lottery.ownedEquipmentIds] : [],
    ownedMartialArtIds: Array.isArray(lottery.ownedMartialArtIds) ? [...lottery.ownedMartialArtIds] : [],
  }
  const reward: DungeonReward = {
    silver: nonNegativeInteger(layer.firstClear?.silver),
    langyu: nonNegativeInteger(layer.firstClear?.langyu),
    forge: nonNegativeInteger(layer.firstClear?.forge),
    insight: nonNegativeInteger(layer.firstClear?.insight),
    incense: 12 + Math.max(0, layerNumber - 1) * 4 + (firstClear ? 30 + layerNumber * 10 + nonNegativeInteger(layer.firstClear?.incense) : 0),
    fame: 0,
    eliteBonus: false,
    firstClear,
    drops,
  }
  if (!firstClear) { reward.silver = 0; reward.langyu = 0; reward.forge = 0; reward.insight = 0 }
  nextPlayer.silver = addCappedInteger(nextPlayer.silver, reward.silver)
  nextPlayer.langyu = addCappedInteger(nextPlayer.langyu, reward.langyu)
  nextPlayer.forge = addCappedInteger(nextPlayer.forge, reward.forge)
  nextPlayer.insight = addCappedInteger(nextPlayer.insight, reward.insight)
  nextPlayer.incense = addCappedInteger(nextPlayer.incense, reward.incense)
  for (const drop of drops) {
    if (drop.kind === 'item' && drop.itemId) nextPlayer.items[drop.itemId] = addCappedInteger(nextPlayer.items[drop.itemId], drop.quantity)
    if (drop.kind === 'equipment' && drop.itemId) nextLottery.ownedEquipmentIds.push(drop.itemId)
    if (drop.kind === 'martial' && drop.itemId) nextLottery.ownedMartialArtIds.push(drop.itemId)
    if (drop.kind === 'resource' && drop.resource) nextPlayer[drop.resource] = addCappedInteger(nextPlayer[drop.resource], drop.quantity)
  }
  return { player: syncPlayerPower(nextPlayer), lottery: nextLottery, dungeons: currentState, reward }
}

/** Resolve a cleared layer without opening the battle modal. It consumes stamina just like a battle. */
export function sweepDungeon(
  player: GameState['player'],
  lottery: LotteryState,
  dungeonState: DungeonState,
  dungeonId: string,
  layerNumber: number,
  now = Date.now(),
  random: () => number = Math.random,
): { player: GameState['player']; lottery: LotteryState; dungeons: DungeonState; reward: DungeonReward } | null {
  const dungeon = getDungeonConfig(dungeonId)
  if (!dungeon || layerNumber < 1 || layerNumber > dungeon.layers.length || layerNumber > getDungeonHighestCleared(dungeonState, dungeonId)) return null
  const entered = enterDungeon(dungeonState, dungeonId, layerNumber, player.realmId, now)
  if (!entered) return null
  return resolveDungeonReward(player, lottery, entered, dungeonId, layerNumber, random, now)
}

export function getDungeonMechanicId(dungeonId: string): DungeonMechanicId | undefined {
  return getDungeonConfig(dungeonId)?.mechanic.id
}

export function getPlayerPillBonuses(player: GameState['player']): { innerForceRate: number; combatBonuses: Partial<Record<CoreCombatStat, number>>; combatRates: Partial<Record<CoreCombatStat, number>> } {
  return { innerForceRate: Math.max(0, finiteNumber(player.pillInnerForceRateBonus, 0)), combatBonuses: { ...(player.pillCombatBonuses ?? {}) }, combatRates: { ...(player.pillCombatRates ?? {}) } }
}

export function useInventoryItem(player: GameState['player'], itemId: string): { player: GameState['player']; item: InventoryItem } | null {
  const item = getInventoryItemById(itemId)
  const count = nonNegativeInteger(player.items?.[itemId], 0)
  if (!item || !item.usable || !count || item.category !== 'pill') return null
  const nextItems = { ...(player.items ?? {}), [itemId]: count - 1 }
  let nextPlayer = { ...player, items: nextItems }
  for (const effect of item.pillEffects ?? []) {
    if (effect.kind === 'innerForceRate') nextPlayer.pillInnerForceRateBonus = Math.min(Number.MAX_SAFE_INTEGER, Math.round((Math.max(0, finiteNumber(nextPlayer.pillInnerForceRateBonus, 0)) + effect.amount) * 100) / 100)
    if (effect.kind === 'combatBonus') nextPlayer.pillCombatBonuses = { ...(nextPlayer.pillCombatBonuses ?? {}), [effect.stat]: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, finiteNumber(nextPlayer.pillCombatBonuses?.[effect.stat], 0)) + effect.amount) }
    if (effect.kind === 'combatRate') nextPlayer.pillCombatRates = { ...(nextPlayer.pillCombatRates ?? {}), [effect.stat]: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, finiteNumber(nextPlayer.pillCombatRates?.[effect.stat], 0)) + effect.amount) }
  }
  return { player: syncPlayerPower(nextPlayer), item }
}

export function getMartialEnhancementCost(player: GameState['player'], art: MartialArt): number {
  if (!getMartialArtById(art.id)) return Number.POSITIVE_INFINITY
  return 4 + Math.floor(getMartialMastery(player, art.id) / 10)
}

export function isMartialArtEnhanceable(art: MartialArt): boolean {
  const knownArt = getMartialArtById(art.id)
  if (!knownArt) return false
  art = knownArt
  if (art.kind === 'outer') return Boolean(art.activeSkill)
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

export function accrueInnerForce(cultivation: CultivationState, player: GameState['player'], now = Date.now(), temple?: TempleState): CultivationState {
  const safeNow = finiteNumber(now, Date.now())
  const safeLastAccruedAt = finiteNumber(cultivation.lastAccruedAt, safeNow)
  const rawElapsed = Math.max(0, safeNow - safeLastAccruedAt)
  const elapsed = Math.min(rawElapsed, MAX_CULTIVATION_OFFLINE_MS)
  const wholeSeconds = Math.floor(elapsed / 1000)
  const amount = Math.max(0, finiteNumber(cultivation.amount, 0))
  if (safeNow < safeLastAccruedAt || !wholeSeconds) {
    return { ...cultivation, amount, lastAccruedAt: safeNow < safeLastAccruedAt ? safeNow : Math.max(0, safeLastAccruedAt) }
  }
  return {
    ...cultivation,
    amount: Math.min(Number.MAX_SAFE_INTEGER, amount + wholeSeconds * getInnerForceRate(player, temple)),
    lastAccruedAt: rawElapsed > MAX_CULTIVATION_OFFLINE_MS ? safeNow : safeLastAccruedAt + wholeSeconds * 1000,
  }
}

/** Updates the automation flag without letting the UI mutate cultivation state directly. */
export function setAutoPractice(cultivation: CultivationState, enabled: boolean): CultivationState {
  return { ...cultivation, autoPractice: Boolean(enabled) }
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

/** Persists the current state and reports whether the browser accepted it. */
export function saveGame(game: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game))
    return true
  } catch {
    // Storage can be unavailable or full; gameplay state remains usable in memory.
    return false
  }
}

function preserveUnusableSave(raw: string | null): void {
  if (!raw) return
  try {
    // Keep one recoverable copy. A timestamped key would eventually become a
    // second unbounded save history and could recreate the quota problem.
    localStorage.setItem(SAVE_RECOVERY_KEY, raw)
  } catch {
    // Recovery is best-effort; the caller still receives a valid new state.
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
      amount: Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, savedCultivation.amount!)),
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

function loadMaterialBounties(saved: unknown, initial: GameState['materialBounties']): GameState['materialBounties'] {
  if (typeof saved !== 'object' || saved === null) return { ...initial }
  const source = saved as Partial<MaterialBountyState>
  return {
    dailyDate: normalizeDateKey(source.dailyDate),
    dailyDungeonWins: nonNegativeInteger(source.dailyDungeonWins),
    dailyClaimed: source.dailyClaimed === true,
    weeklyKey: normalizeDateKey(source.weeklyKey),
    weeklyDungeonWins: nonNegativeInteger(source.weeklyDungeonWins),
    weeklyClaimed: source.weeklyClaimed === true,
  }
}

function loadShopState(saved: unknown, initial: GameState['shop']): GameState['shop'] {
  if (typeof saved !== 'object' || saved === null) return { purchaseDate: initial.purchaseDate, purchaseCounts: { ...initial.purchaseCounts } }
  const source = saved as Partial<ShopState>
  const purchaseDate = normalizeDateKey(source.purchaseDate)
  const rawCounts = typeof source.purchaseCounts === 'object' && source.purchaseCounts !== null
    ? source.purchaseCounts as Record<string, unknown>
    : {}
  const purchaseCounts: Record<string, number> = {}
  for (const product of SILVER_SHOP_PRODUCTS) {
    const amount = rawCounts[product.id]
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      purchaseCounts[product.id] = clamp(Math.floor(amount), 0, product.dailyLimit)
    }
  }
  return { purchaseDate, purchaseCounts }
}

function loadPillBonuses(value: unknown, initial: Partial<Record<CoreCombatStat, number>>): Partial<Record<CoreCombatStat, number>> {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const result: Partial<Record<CoreCombatStat, number>> = {}
  for (const stat of CORE_COMBAT_STATS) {
    const amount = source[stat]
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) result[stat] = Math.floor(amount)
    else if (typeof initial[stat] === 'number') result[stat] = initial[stat]
  }
  return result
}

function loadDungeonState(value: unknown, initial: DungeonState, realmId: GameState['player']['realmId']): DungeonState {
  if (typeof value !== 'object' || value === null) {
    // Keep the legacy object shape enumerable for old diagnostics while still
    // exposing the migrated values to the new domain API.
    const legacy = { date: null, attempts: {}, highestCleared: {} } as DungeonState
    Object.defineProperties(legacy, {
      stamina: { value: getDungeonStaminaCap(realmId), enumerable: false, writable: true, configurable: true },
      staminaUpdatedAt: { value: Date.now(), enumerable: false, writable: true, configurable: true },
    })
    return legacy
  }
  const saved = value as Partial<DungeonState>
  const attempts: Record<string, number> = {}
  const highestCleared: Record<string, number> = {}
  for (const dungeon of DUNGEONS) {
    const attempt = saved.attempts?.[dungeon.id]
    const highest = saved.highestCleared?.[dungeon.id]
    if (typeof attempt === 'number' && Number.isFinite(attempt) && attempt > 0) attempts[dungeon.id] = clamp(Math.floor(attempt), 0, dungeon.dailyAttempts ?? Number.MAX_SAFE_INTEGER)
    if (typeof highest === 'number' && Number.isFinite(highest) && highest > 0) highestCleared[dungeon.id] = clamp(Math.floor(highest), 0, dungeon.layers.length)
  }
  const rawStamina = typeof saved.stamina === 'number' && Number.isFinite(saved.stamina) ? saved.stamina : getDungeonStaminaCap(realmId)
  const rawUpdatedAt = typeof saved.staminaUpdatedAt === 'number' && Number.isFinite(saved.staminaUpdatedAt) ? saved.staminaUpdatedAt : Date.now()
  // Battles are runtime-only. A saved active challenge has no corresponding
  // encounter after reload, so discard the marker instead of soft-locking the dungeon.
  return normalizeDungeonState({ date: normalizeDateKey(saved.date), attempts, stamina: rawStamina, staminaUpdatedAt: rawUpdatedAt, highestCleared }, realmId, Date.now())
}

function loadTempleState(value: unknown, initial: TempleState): TempleState {
  const source = typeof value === 'object' && value !== null ? value as Partial<TempleState> : {}
  const rawRanks = typeof source.ranks === 'object' && source.ranks !== null ? source.ranks as Record<string, unknown> : {}
  const ranks = { ...initial.ranks }
  for (const idolId of IDOL_IDS) {
    const config = getIdolConfig(idolId)
    const value = rawRanks[idolId]
    if (config && typeof value === 'number' && Number.isFinite(value)) ranks[idolId] = clamp(Math.floor(value), 0, config.maxRank)
  }
  return { ranks }
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

function loadEquippedEquipment(value: unknown, legacyWeapon: unknown, fallback: EquipmentLoadout, ownedEquipmentIds: readonly string[]): EquipmentLoadout {
  const savedLoadout = typeof value === 'object' && value !== null
    ? value as Partial<Record<EquipmentSlot | 'ring', unknown>>
    : undefined
  const ownedCounts = new Map<string, number>()
  for (const id of ownedEquipmentIds) ownedCounts.set(id, (ownedCounts.get(id) ?? 0) + 1)
  const equippedCounts = new Map<string, number>()
  const claim = (equipment: Equipment, slot: EquipmentSlot, gems?: unknown): EquippedEquipment | null => {
    if (!canEquipEquipmentInSlot(equipment, slot)) return null
    const used = equippedCounts.get(equipment.id) ?? 0
    if (used >= (ownedCounts.get(equipment.id) ?? 0)) return null
    equippedCounts.set(equipment.id, used + 1)
    return createEquippedEquipment(equipment, gems)
  }
  return EQUIPMENT_SLOTS.reduce((loadout, slot) => {
    const hasSavedSlot = Boolean(savedLoadout && Object.prototype.hasOwnProperty.call(savedLoadout, slot))
    const hasLegacyRing = slot === 'ring1' && Boolean(savedLoadout && Object.prototype.hasOwnProperty.call(savedLoadout, 'ring'))
    const savedEntry = hasSavedSlot
      ? savedLoadout![slot]
      : hasLegacyRing ? savedLoadout!.ring : undefined
    if (savedEntry === null) {
      loadout[slot] = null
      return loadout
    }
    if (typeof savedEntry === 'object' && savedEntry !== null) {
      const entry = savedEntry as Partial<EquippedEquipment>
      const equipment = typeof entry.equipmentId === 'string' ? getEquipmentById(entry.equipmentId) : undefined
      if (equipment && canEquipEquipmentInSlot(equipment, slot)) {
        loadout[slot] = claim(equipment, slot, entry.gems)
        return loadout
      }
    }
    if (!savedLoadout && slot === 'weapon' && typeof legacyWeapon === 'string') {
      const legacyEquipment = getEquipmentById(legacyWeapon)
      if (legacyEquipment?.categoryId === 'weapon') {
        loadout[slot] = claim(legacyEquipment, slot)
        return loadout
      }
    }
    const fallbackEntry = fallback[slot]
    const fallbackEquipment = fallbackEntry ? getEquipmentById(fallbackEntry.equipmentId) : undefined
    loadout[slot] = fallbackEquipment ? claim(fallbackEquipment, slot) : null
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
  const saved = value as Partial<LotteryState> & { fragments?: unknown }
  const savedPity = typeof saved.pity === 'object' && saved.pity !== null ? saved.pity : undefined
  const knownEquipment = new Set(EQUIPMENT.map((equipment) => equipment.id))
  const knownMartialArts = new Set(MARTIAL_ARTS.map((art) => art.id))
  const legacyFragmentEquipmentIds = new Set([
    ...LOTTERY_EQUIPMENT_PRIZE_IDS.orange,
    ...LOTTERY_EQUIPMENT_PRIZE_IDS.red,
  ])
  const savedFragments = typeof saved.fragments === 'object' && saved.fragments !== null ? saved.fragments : {}
  // Equipment drawn under the retired collection rule becomes available immediately.
  const migratedEquipmentIds = Object.entries(savedFragments).flatMap(([id, amount]) => (
    legacyFragmentEquipmentIds.has(id) && typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? [id] : []
  ))
  const savedEquipmentIds = Array.isArray(saved.ownedEquipmentIds)
    ? saved.ownedEquipmentIds.filter((id): id is string => typeof id === 'string' && knownEquipment.has(id)).slice(0, 10_000)
    : initial.ownedEquipmentIds
  const ownedEquipmentIds = [...savedEquipmentIds, ...migratedEquipmentIds]
  const ownedMartialArtIds = Array.isArray(saved.ownedMartialArtIds)
    ? saved.ownedMartialArtIds.filter((id): id is string => typeof id === 'string' && knownMartialArts.has(id)).slice(0, 10_000)
    : initial.ownedMartialArtIds
  const history = Array.isArray(saved.history)
    ? saved.history.flatMap((entry): LotteryReward[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const reward = entry as Omit<Partial<LotteryReward>, 'kind'> & { kind?: LotteryReward['kind'] | 'fragment' }
      const validPool = reward.pool === 'equipment' || reward.pool === 'martial'
      const kind = reward.kind === 'fragment' ? 'equipment' : reward.kind
      const validKind = kind === 'equipment' || kind === 'martial' || kind === 'item' || kind === 'forge' || kind === 'insight'
      const validTone = GRADE_ORDER.includes(reward.gradeTone as GradeTone)
      const source = typeof reward.itemId === 'string'
        ? (kind === 'item' ? getInventoryItemById(reward.itemId) : reward.pool === 'equipment' ? getEquipmentById(reward.itemId) : getMartialArtById(reward.itemId))
        : undefined
      const validItem = kind === 'equipment' || kind === 'martial' || kind === 'item' ? Boolean(source) : true
      const validLegacyFragment = reward.kind !== 'fragment' || (reward.pool === 'equipment' && Boolean(source) && legacyFragmentEquipmentIds.has(reward.itemId ?? ''))
      if (!validPool || !validKind || !validTone || !validItem || !validLegacyFragment || typeof reward.id !== 'string' || typeof reward.name !== 'string' || typeof reward.grade !== 'string' || typeof reward.quantity !== 'number' || !Number.isFinite(reward.quantity)) return []
      return [{
        id: boundedText(reward.id, `reward-${Date.now()}`, 96), pool: reward.pool as LotteryPoolId, kind, itemId: typeof reward.itemId === 'string' ? reward.itemId : undefined,
        name: reward.kind === 'fragment' && source ? source.name : boundedText(reward.name, '未知奖励', 80), grade: reward.kind === 'fragment' && source ? source.grade : boundedText(reward.grade, LOTTERY_GRADE_NAMES[reward.gradeTone as GradeTone], 20), gradeTone: reward.kind === 'fragment' && source ? source.gradeTone : reward.gradeTone as GradeTone, quantity: Math.max(1, Math.floor(reward.quantity)),
      }]
    }).slice(0, 24)
    : []
  return {
    pity: {
      equipment: loadLotteryPity(savedPity?.equipment),
      martial: loadLotteryPity(savedPity?.martial),
    },
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

function loadMartialRanks(value: unknown, fallback: Record<string, number>): Record<string, number> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const ranks = { ...fallback }
  if (!saved) return ranks
  for (const [id, amount] of Object.entries(saved)) {
    const art = getMartialArtConfigById(id)
    if (art && typeof amount === 'number' && Number.isFinite(amount)) ranks[id] = clamp(Math.floor(amount), 0, art.ascension?.maxRank ?? MARTIAL_ASCENSION_MAX_RANK)
  }
  return ranks
}

function loadInventoryItems(value: unknown, fallback: Record<string, number>): Record<string, number> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const items = { ...fallback }
  if (!saved) return items
  for (const [id, amount] of Object.entries(saved)) {
    if (getInventoryItemById(id) && typeof amount === 'number' && Number.isFinite(amount)) items[id] = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(amount)))
  }
  return items
}

function loadEquipmentEnhancements(value: unknown, fallback: Record<string, number>): Record<string, number> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const knownIds = new Set(EQUIPMENT.map((equipment) => equipment.id))
  const enhancements = { ...fallback }
  if (!saved) return enhancements
  for (const [id, amount] of Object.entries(saved)) {
    if (knownIds.has(id) && typeof amount === 'number' && Number.isFinite(amount)) {
      enhancements[id] = clamp(Math.floor(amount), 0, EQUIPMENT_ENHANCEMENT_MAX_LEVEL)
    }
  }
  return enhancements
}

function loadEquipmentRanks(value: unknown, fallback: Record<string, number>): Record<string, number> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const knownIds = new Set(EQUIPMENT.map((equipment) => equipment.id))
  const ranks = { ...fallback }
  if (!saved) return ranks
  for (const [id, amount] of Object.entries(saved)) {
    if (knownIds.has(id) && typeof amount === 'number' && Number.isFinite(amount)) ranks[id] = clamp(Math.floor(amount), 0, EQUIPMENT_ASCENSION_MAX_RANK)
  }
  return ranks
}

function loadEquipmentRefinements(value: unknown, fallback: Record<string, EquipmentRefinement>): Record<string, EquipmentRefinement> {
  const saved = typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
  const knownIds = new Set(EQUIPMENT.map((equipment) => equipment.id))
  const refinements = { ...fallback }
  if (!saved) return refinements
  for (const [id, raw] of Object.entries(saved)) {
    if (!knownIds.has(id) || typeof raw !== 'object' || raw === null) continue
    const entry = raw as Partial<EquipmentRefinement>
    if (typeof entry.stat === 'string' && EQUIPMENT_REFINEMENT_STATS.includes(entry.stat as CoreCombatStat) && typeof entry.amount === 'number' && Number.isFinite(entry.amount) && entry.amount > 0) {
      refinements[id] = { stat: entry.stat as CoreCombatStat, amount: Math.floor(entry.amount) }
    }
  }
  return refinements
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
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initial
    const saved: unknown = JSON.parse(raw)
    if (!isPartialGame(saved)) {
      preserveUnusableSave(raw)
      return initial
    }
    const savedVersion = nonNegativeInteger(saved.version, 0)
    const legacyPlayer = saved.player as (Partial<GameState['player']> & { level?: unknown; equippedWeapon?: unknown; equippedArts?: unknown; yuanbao?: unknown; silverTickets?: unknown }) | undefined
    const { equippedEquipment, equippedWeapon, ...playerValues } = legacyPlayer ?? {}
    let lottery = loadLottery(saved.lottery, initial.lottery)
    // Older saves stored the equipped weapon separately and did not include
    // it in the collection. Preserve that valid legacy item before validating
    // the new slot loadout against owned copies.
    const legacyWeaponId = typeof equippedWeapon === 'string' ? equippedWeapon : undefined
    const legacyWeapon = legacyWeaponId ? getEquipmentById(legacyWeaponId) : undefined
    if (legacyWeapon?.categoryId === 'weapon' && !lottery.ownedEquipmentIds.includes(legacyWeapon.id)) {
      lottery = { ...lottery, ownedEquipmentIds: [...lottery.ownedEquipmentIds, legacyWeapon.id] }
    }
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
      incense: nonNegativeInteger(playerValues.incense, initial.player.incense),
      fame: nonNegativeInteger(playerValues.fame, initial.player.fame),
      pillInnerForceRateBonus: Math.max(0, finiteNumber(playerValues.pillInnerForceRateBonus, initial.player.pillInnerForceRateBonus)),
      pillCombatBonuses: loadPillBonuses(playerValues.pillCombatBonuses, initial.player.pillCombatBonuses),
      pillCombatRates: loadPillBonuses(playerValues.pillCombatRates, initial.player.pillCombatRates),
      equipmentEnhancements: loadEquipmentEnhancements(playerValues.equipmentEnhancements, initial.player.equipmentEnhancements),
      equipmentRanks: loadEquipmentRanks(playerValues.equipmentRanks, initial.player.equipmentRanks),
      equipmentRefinements: loadEquipmentRefinements(playerValues.equipmentRefinements, initial.player.equipmentRefinements),
      mastery: loadMastery(playerValues.mastery, initial.player.mastery),
      martialRanks: loadMartialRanks(playerValues.martialRanks, initial.player.martialRanks),
      items: loadInventoryItems(playerValues.items, initial.player.items),
      martialLoadout: loadMartialLoadout(playerValues.martialLoadout, legacyPlayer?.equippedArts, initial.player.martialLoadout, lottery.ownedMartialArtIds),
      equippedEquipment: loadEquippedEquipment(equippedEquipment, equippedWeapon, initial.player.equippedEquipment, lottery.ownedEquipmentIds),
    })
    // Rebuild the aggregate explicitly instead of spreading the untrusted
    // save object. This prevents stale runtime fields or arbitrary JSON keys
    // from becoming part of the live game state after a load.
    return {
      version: CURRENT_GAME_VERSION,
      player,
      cultivation: loadCultivation(saved, initial),
      dailyCheckIn: loadDailyCheckIn(saved.dailyCheckIn, initial.dailyCheckIn),
      materialBounties: loadMaterialBounties(saved.materialBounties, initial.materialBounties),
      shop: loadShopState(saved.shop, initial.shop),
      dungeons: loadDungeonState(saved.dungeons, initial.dungeons, normalizeRealmId(legacyPlayer?.realmId)),
      temple: loadTempleState(saved.temple, initial.temple),
      journey: loadJourney(saved, initial),
      lottery,
      logs: loadLogs(saved.logs, initial.logs),
    }
  } catch {
    preserveUnusableSave(raw)
    return initial
  }
}
