import rawContent from './realms.json'
import { deepFreeze } from './freeze'
import type { Realm, RealmId } from '../domain/types'

interface RealmContent { realms: readonly Realm[] }
const REALM_IDS: readonly RealmId[] = ['body-tempering', 'meridian', 'acquired', 'innate', 'aura', 'master', 'grandmaster', 'returning', 'martial-saint', 'martial-pinnacle']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateRealms(value: unknown): readonly Realm[] {
  if (!isRecord(value) || !Array.isArray(value.realms) || value.realms.length !== 10) throw new Error('境界配置无效：必须恰好配置 10 个境界。')
  const ids = new Set<string>()
  value.realms.forEach((realm, index) => {
    const label = `realms[${index}]`
    if (!isRecord(realm) || typeof realm.id !== 'string' || !REALM_IDS.includes(realm.id as RealmId) || !realm.id.trim() || ids.has(realm.id) || typeof realm.label !== 'string' || !realm.label.trim() || typeof realm.description !== 'string' || !realm.description.trim()) throw new Error(`境界配置无效：${label}的基本信息不合法。`)
    if (realm.tier !== index + 1 || !Number.isInteger(realm.tier)) throw new Error(`境界配置无效：${label}的 tier 必须从 1 连续排列。`)
    if (typeof realm.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(realm.color) || typeof realm.foreground !== 'string' || !/^#[0-9a-f]{6}$/i.test(realm.foreground)) throw new Error(`境界配置无效：${label}的颜色必须是六位十六进制值。`)
    ids.add(realm.id)
  })
  return value.realms as readonly Realm[]
}

const realms = validateRealms(rawContent)
export const REALMS: readonly Realm[] = deepFreeze(realms.map((realm) => ({ ...realm })))

const REALMS_BY_ID = new Map<string, Realm>(REALMS.map((realm) => [realm.id, realm]))

export function getRealmById(id: string): Realm | undefined {
  return REALMS_BY_ID.get(id)
}

export const INNER_FORCE_PER_SECOND = 1.3
export const MAX_CULTIVATION_OFFLINE_MS = 12 * 60 * 60 * 1000
export const PRACTICE_PROGRESS_PER_ACTION = 3
export const AUTO_PRACTICE_INTERVAL_MS = 1_000
export const REALM_INNER_FORCE_RATE_MULTIPLIER = 1.8
export const SMALL_REALM_INNER_FORCE_RATE_MULTIPLIER = 1.025
export const COMBAT_STAT_LEVEL_GROWTH = 1.06
export const COMBAT_STAT_REALM_BREAKTHROUGH_BONUS = 1.12
export const COMBAT_SPEED_GROWTH_EXPONENT = 0.35

export const PRACTICE_PROGRESS_MAX = 100
export const PRACTICE_FULL_LEVEL_BASE_COST = 420
export const PRACTICE_REALM_COST_MULTIPLIER = 3.2
export const SMALL_REALM_COST_GROWTH = 1.2
/** Current enhancement advances a martial art's mastery by four points. */
export const MARTIAL_ENHANCEMENT_STEP = 4
export const EQUIPMENT_ENHANCEMENT_MAX_LEVEL = 20
export const EQUIPMENT_ENHANCEMENT_STAT_GROWTH = 0.05
