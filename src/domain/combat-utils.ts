import { COMBAT_BALANCE } from '../data'
import { createCombatStats } from './combat-stats'
import type { CombatEffectState, CombatPassiveEffect, CombatStats, Encounter } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function randomValue(random: () => number): number {
  const value = random()
  return Number.isFinite(value) ? clamp(value, 0, 0.999999999) : 0
}

export function randomFactor(random: () => number): number {
  return COMBAT_BALANCE.randomDamageMinimum + randomValue(random) * COMBAT_BALANCE.randomDamageRange
}

export function createEffects(): CombatEffectState {
  return { guaranteedHit: 0, guaranteedDodge: 0, stunnedFor: 0 }
}

export function isSupportedPlayerPassive(effect: CombatPassiveEffect | undefined): effect is CombatPassiveEffect {
  if (!effect) return false
  return effect.kind === 'survive-lethal'
    || effect.kind === 'battle-start-rage'
    || effect.kind === 'skill-rage-refund'
    || effect.kind === 'battle-start-dodge'
    || effect.kind === 'damage-bonus-for-rounds'
    || effect.kind === 'damage-reduction-for-rounds'
    || effect.kind === 'damage-immunity-for-rounds'
    || effect.kind === 'combo-bonus-for-rounds'
    || effect.kind === 'block-enemy-actions-for-rounds'
}

export function passiveRounds(effect: CombatPassiveEffect): number {
  return Number.isFinite(effect.duration) ? Math.max(0, Math.floor(effect.duration!)) : 0
}

export function passiveValue(effect: CombatPassiveEffect): number {
  return Number.isFinite(effect.value) ? Math.max(0, effect.value) : 0
}

export function activeRoundPassiveValue(encounter: Encounter, kind: CombatPassiveEffect['kind']): number {
  if (encounter.round <= 0) return 0
  return encounter.playerPassives.reduce((total, effect) => {
    if (effect.kind !== kind || encounter.round > passiveRounds(effect)) return total
    return total + passiveValue(effect)
  }, 0)
}

export function hasActiveRoundPassive(encounter: Encounter, kind: CombatPassiveEffect['kind']): boolean {
  return encounter.round > 0 && encounter.playerPassives.some((effect) => effect.kind === kind && encounter.round <= passiveRounds(effect))
}

export function legacyStatsFromPower(power: number): CombatStats {
  const scale = Math.max(COMBAT_BALANCE.legacyPowerMinimumScale, power / COMBAT_BALANCE.legacyPowerReference)
  return createCombatStats({ maxHealth: 1_000 * scale, attack: 100 * scale, defense: 80 * scale, speed: 100 })
}

export function getHitChance(attacker: CombatStats, defender: CombatStats): number {
  const hitRate = Number.isFinite(attacker.hitRate) ? attacker.hitRate : 0
  const dodgeRate = Number.isFinite(defender.dodgeRate) ? defender.dodgeRate : 0
  return clamp(hitRate - dodgeRate, COMBAT_BALANCE.minHitRate, COMBAT_BALANCE.maxHitRate)
}

export function grantNextAttackGuaranteedHit(effects: CombatEffectState, count = 1): CombatEffectState {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  return { ...effects, guaranteedHit: (Number.isFinite(effects.guaranteedHit) ? Math.max(0, effects.guaranteedHit) : 0) + safeCount }
}

export function grantNextAttackGuaranteedDodge(effects: CombatEffectState, count = 1): CombatEffectState {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  return { ...effects, guaranteedDodge: (Number.isFinite(effects.guaranteedDodge) ? Math.max(0, effects.guaranteedDodge) : 0) + safeCount }
}
