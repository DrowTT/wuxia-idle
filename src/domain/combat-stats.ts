import { DEFAULT_COMBAT_STATS, MAX_DODGE_RATE } from '../data/balance'
import type { CombatStats } from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Normalizes all combat inputs at the domain boundary. */
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
