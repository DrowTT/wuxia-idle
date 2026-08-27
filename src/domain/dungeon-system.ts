import { getDungeonById, getDungeonLayer as getDungeonLayerConfig } from '../data/dungeons'
import { getRealmById } from '../data/realms'
import { MULTI_ENEMY_SUFFIXES } from '../data/main-story'
import { createCombatStats } from './combat-stats'
import { dateKey } from './time'
import type { CombatStats, DungeonConfig, DungeonLayerConfig, DungeonState, MainStageEnemy, RealmId } from './types'

export const DUNGEON_STAMINA_RECOVERY_MS = 5 * 60 * 1000

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)) }
function finiteNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback }
function nonNegativeInteger(value: unknown, fallback = 0): number { return Math.max(0, Math.floor(finiteNumber(value, fallback))) }

export function getDungeonConfig(id: string): DungeonConfig | undefined { return getDungeonById(id) }
export function getDungeonLayer(id: string, layer: number): DungeonLayerConfig | undefined { return getDungeonLayerConfig(id, layer) }

export function getDungeonStaminaCap(realmId: RealmId | string): number {
  const tier = getRealmById(realmId)?.tier ?? 1
  return 24 + Math.floor(Math.max(0, tier - 1) / 2) * 6
}

export function getDungeonStaminaCost(dungeonId: string, layer: number): number {
  const configured = getDungeonLayer(dungeonId, layer)?.staminaCost
  if (typeof configured === 'number' && Number.isFinite(configured) && configured > 0) return Math.floor(configured)
  return 3 + Math.min(2, Math.floor(Math.max(0, layer - 1) / 3))
}

function isRealmId(value: unknown): value is RealmId { return typeof value === 'string' && Boolean(getRealmById(value)) }
function resolveRealmAndNow(realmOrNow: RealmId | string | number | undefined, maybeNow: number | undefined): { realmId: RealmId; now: number } {
  if (isRealmId(realmOrNow)) return { realmId: realmOrNow, now: finiteNumber(maybeNow, Date.now()) }
  return { realmId: 'body-tempering', now: finiteNumber(realmOrNow, Date.now()) }
}

function normalizeActiveChallenge(active: DungeonState['activeChallenge']): DungeonState['activeChallenge'] | undefined {
  if (!active || typeof active.dungeonId !== 'string' || !getDungeonConfig(active.dungeonId)) return undefined
  if (!Number.isInteger(active.layer) || active.layer < 1 || !getDungeonLayer(active.dungeonId, active.layer)) return undefined
  if (!Number.isFinite(active.enteredAt)) return undefined
  return { dungeonId: active.dungeonId, layer: active.layer, enteredAt: active.enteredAt }
}

/** Calculates lazy recovery and validates runtime-only challenge state. */
export function normalizeDungeonState(state: DungeonState, realmId: RealmId | string = 'body-tempering', now = Date.now()): DungeonState {
  const safeNow = finiteNumber(now, Date.now())
  const cap = getDungeonStaminaCap(realmId)
  const rawStamina = typeof state.stamina === 'number' && Number.isFinite(state.stamina) ? clamp(Math.floor(state.stamina), 0, cap) : cap
  const rawUpdatedAt = typeof state.staminaUpdatedAt === 'number' && Number.isFinite(state.staminaUpdatedAt)
    ? Math.min(safeNow, Math.max(0, Math.floor(state.staminaUpdatedAt)))
    : safeNow
  const elapsed = Math.max(0, safeNow - rawUpdatedAt)
  const recovered = Math.floor(elapsed / DUNGEON_STAMINA_RECOVERY_MS)
  const stamina = Math.min(cap, rawStamina + recovered)
  const staminaUpdatedAt = stamina >= cap ? safeNow : rawUpdatedAt + recovered * DUNGEON_STAMINA_RECOVERY_MS
  const activeChallenge = normalizeActiveChallenge(state.activeChallenge)
  return {
    ...state,
    stamina,
    staminaUpdatedAt,
    highestCleared: { ...(state.highestCleared ?? {}) },
    ...(state.attempts ? { attempts: { ...state.attempts } } : {}),
    ...(activeChallenge ? { activeChallenge } : {}),
  }
}

/** Backwards-compatible name; it no longer resets anything by date. */
export function normalizeDungeonStateForDate(state: DungeonState, now = Date.now()): DungeonState {
  const current = normalizeDungeonState(state, 'body-tempering', now)
  const today = dateKey(now)
  if (current.date === today) return current
  return { ...current, date: today, attempts: {} }
}
export function getDungeonStamina(state: DungeonState, realmId: RealmId | string = 'body-tempering', now = Date.now()): number { return normalizeDungeonState(state, realmId, now).stamina }
export function getDungeonStaminaRecoveryRemainingMs(state: DungeonState, realmId: RealmId | string = 'body-tempering', now = Date.now()): number {
  const current = normalizeDungeonState(state, realmId, now)
  if (current.stamina >= getDungeonStaminaCap(realmId)) return 0
  return Math.max(0, DUNGEON_STAMINA_RECOVERY_MS - (now - current.staminaUpdatedAt))
}

/** Deprecated display helpers retained for old saves; they are not entry gates. */
export function getDungeonAttemptCount(state: DungeonState, dungeonId: string, now = Date.now()): number { return nonNegativeInteger(normalizeDungeonStateForDate(state, now).attempts?.[dungeonId], 0) }
export function getDungeonAttemptsRemaining(state: DungeonState, dungeonId: string, now = Date.now()): number {
  const dungeon = getDungeonConfig(dungeonId)
  return dungeon?.dailyAttempts ? Math.max(0, dungeon.dailyAttempts - getDungeonAttemptCount(state, dungeonId, now)) : 0
}
export function getDungeonHighestCleared(state: DungeonState, dungeonId: string): number {
  const dungeon = getDungeonConfig(dungeonId)
  return dungeon ? clamp(nonNegativeInteger(state.highestCleared?.[dungeonId], 0), 0, dungeon.layers.length) : 0
}

export function canEnterDungeon(state: DungeonState, dungeonId: string, layer: number, realmOrNow: RealmId | string | number = 'body-tempering', maybeNow?: number): boolean {
  const dungeon = getDungeonConfig(dungeonId)
  if (!dungeon || !Number.isInteger(layer) || layer < 1 || layer > dungeon.layers.length) return false
  const { realmId, now } = resolveRealmAndNow(realmOrNow, maybeNow)
  const current = normalizeDungeonState(state, realmId, now)
  if (current.activeChallenge) return false
  if (current.stamina < getDungeonStaminaCost(dungeonId, layer)) return false
  return layer <= getDungeonHighestCleared(current, dungeonId) + 1
}

export function enterDungeon(state: DungeonState, dungeonId: string, layer: number, realmOrNow: RealmId | string | number = 'body-tempering', maybeNow?: number): DungeonState | null {
  const { realmId, now } = resolveRealmAndNow(realmOrNow, maybeNow)
  if (!canEnterDungeon(state, dungeonId, layer, realmId, now)) return null
  const current = normalizeDungeonState(state, realmId, now)
  return {
    ...current,
    date: dateKey(now),
    attempts: { ...(current.attempts ?? {}), [dungeonId]: nonNegativeInteger(current.attempts?.[dungeonId]) + 1 },
    stamina: current.stamina - getDungeonStaminaCost(dungeonId, layer),
    activeChallenge: { dungeonId, layer, enteredAt: now },
  }
}

/** Abandons an unfinished battle without refunding consumed stamina. */
export function cancelDungeonChallenge(state: DungeonState, dungeonId: string, layer: number): DungeonState {
  const active = state.activeChallenge
  if (!active || active.dungeonId !== dungeonId || active.layer !== layer) return state
  const { activeChallenge: _activeChallenge, ...rest } = state
  return rest
}

export function getDungeonEnemies(dungeonId: string, layerNumber: number): MainStageEnemy[] {
  const layer = getDungeonLayer(dungeonId, layerNumber)
  const dungeon = getDungeonConfig(dungeonId)
  if (!layer) return []
  const count = Math.max(1, Math.floor(layer.enemyCount ?? 1))
  return Array.from({ length: count }, (_, index) => {
    const variation = index === 0 ? 1 : 1 + index * 0.06
    const baseStats = Object.fromEntries(Object.entries(layer.enemyStats).map(([key, value]) => [key, typeof value === 'number' ? value * variation : value])) as Partial<CombatStats>
    if (dungeon?.mechanic.id === 'counter-stance') baseStats.counterRate = (baseStats.counterRate ?? 0) + 12
    if (dungeon?.mechanic.id === 'changing-styles') {
      const attackBias = (layerNumber + index) % 2 === 0
      if (attackBias) baseStats.attack = Math.round((baseStats.attack ?? 0) * 1.08)
      else baseStats.speed = Math.round((baseStats.speed ?? 0) * 1.1)
    }
    const stats = createCombatStats(baseStats)
    return { id: `dungeon-${dungeonId}-${layerNumber}-enemy-${index + 1}`, name: count > 1 ? `${layer.enemyName}${MULTI_ENEMY_SUFFIXES[index] ?? index + 1}` : layer.enemyName, stats }
  })
}
