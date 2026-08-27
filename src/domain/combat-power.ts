import { COMBAT_BALANCE } from '../data/balance'
import { normalizeCombatStats } from './combat-stats'
import type { CombatStats } from './types'

/**
 * Converts a normalized combat panel into a comparison value for UI and
 * encounter previews. It is intentionally separate from battle resolution:
 * power describes expected output and survivability, never win/loss logic.
 */
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
