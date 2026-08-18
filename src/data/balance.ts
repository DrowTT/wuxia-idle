import type { CombatStats } from '../domain/types'

export const MAX_DODGE_RATE = 20

export const DEFAULT_COMBAT_STATS: CombatStats = {
  maxHealth: 1_000,
  attack: 100,
  defense: 80,
  speed: 100,
  hitRate: 95,
  dodgeRate: 5,
  critRate: 5,
  critDamage: 150,
  comboRate: 0,
  counterRate: 0,
  stunRate: 0,
  lifestealRate: 0,
  critResist: 0,
  comboResist: 0,
  counterResist: 0,
  stunResist: 0,
  lifestealResist: 0,
  healingBonus: 0,
  critDamageReduction: 0,
  damageBonus: 0,
  damageReduction: 0,
}

export const COMBAT_BALANCE = {
  minHitRate: 15,
  maxHitRate: 98,
  baseMaxRounds: 10,
  additionalRoundsPerEnemy: 2,
  randomDamageMinimum: 0.95,
  randomDamageRange: 0.1,
  legacyPowerMinimumScale: 0.35,
  legacyPowerReference: 1_250,
  defenseDamageDenominator: 700,
  baseDamageMultiplier: 1.15,
  weaponAffinityDamageMultiplier: 1.18,
  weaponAffinityEffectMultiplier: 1.25,
  comboDamageMultiplier: 0.55,
  powerExpectedDamageWeight: 5,
  powerEffectiveHealthWeight: 0.35,
  powerSpeedWeight: 1.5,
  powerDefenseDivisor: 650,
} as const
