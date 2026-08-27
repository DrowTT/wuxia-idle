import {
  COMBAT_SPEED_GROWTH_EXPONENT,
  COMBAT_STAT_LEVEL_GROWTH,
  COMBAT_STAT_REALM_BREAKTHROUGH_BONUS,
  DEFAULT_COMBAT_STATS,
  INNER_FORCE_PER_SECOND,
  PRACTICE_FULL_LEVEL_BASE_COST,
  PRACTICE_PROGRESS_MAX,
  PRACTICE_PROGRESS_PER_ACTION,
  PRACTICE_REALM_COST_MULTIPLIER,
  REALM_INNER_FORCE_RATE_MULTIPLIER,
  SMALL_REALM_COST_GROWTH,
  SMALL_REALM_INNER_FORCE_RATE_MULTIPLIER,
} from '../data'
import { getRealmById, REALMS } from '../data/realms'
import { createCombatStats } from './combat-stats'
import type { CombatStats, GameState, Realm, RealmId } from './types'

const PRACTICE_ACTIONS_PER_LEVEL = Math.ceil(PRACTICE_PROGRESS_MAX / PRACTICE_PROGRESS_PER_ACTION)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function getRealm(id: RealmId): Realm | undefined {
  return getRealmById(id)
}

export function normalizeRealmId(value: unknown): RealmId {
  if (value === 'celestial') return 'returning'
  return typeof value === 'string' ? getRealmById(value)?.id ?? 'body-tempering' : 'body-tempering'
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
