import { createCombatStats, getCombatPower, normalizeCombatStats } from './game'
import { COMBAT_BALANCE } from '../data'
import type { CombatAction, CombatEffectState, CombatPassiveEffect, CombatStats, Encounter, EncounterEnemy, EncounterInput, EncounterTurnAction, MainStageEnemy, MartialActiveSkill } from './types'

type CombatantRef = { side: 'player' } | { side: 'enemy'; enemyIndex: number }

interface AttackResolution {
  action: CombatAction
  counterRequested: boolean
  comboRequested: boolean
}

export interface EncounterStep {
  encounter: Encounter
  action: CombatAction | null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomValue(random: () => number): number {
  const value = random()
  return Number.isFinite(value) ? clamp(value, 0, 0.999999999) : 0
}

function randomFactor(random: () => number): number {
  return COMBAT_BALANCE.randomDamageMinimum + randomValue(random) * COMBAT_BALANCE.randomDamageRange
}

function createEffects(): CombatEffectState {
  return { guaranteedHit: 0, guaranteedDodge: 0, stunnedFor: 0 }
}

function isSupportedPlayerPassive(effect: CombatPassiveEffect | undefined): effect is CombatPassiveEffect {
  if (!effect) return false
  return effect.kind === 'survive-lethal'
    || effect.kind === 'battle-start-rage'
    || effect.kind === 'battle-start-dodge'
    || effect.kind === 'damage-bonus-for-rounds'
    || effect.kind === 'damage-reduction-for-rounds'
    || effect.kind === 'damage-immunity-for-rounds'
    || effect.kind === 'combo-bonus-for-rounds'
    || effect.kind === 'block-enemy-actions-for-rounds'
}

function passiveRounds(effect: CombatPassiveEffect): number {
  return Number.isFinite(effect.duration) ? Math.max(0, Math.floor(effect.duration!)) : 0
}

function passiveValue(effect: CombatPassiveEffect): number {
  return Number.isFinite(effect.value) ? Math.max(0, effect.value) : 0
}

function activeRoundPassiveValue(encounter: Encounter, kind: CombatPassiveEffect['kind']): number {
  if (encounter.round <= 0) return 0
  return encounter.playerPassives.reduce((total, effect) => {
    if (effect.kind !== kind || encounter.round > passiveRounds(effect)) return total
    return total + passiveValue(effect)
  }, 0)
}

function hasActiveRoundPassive(encounter: Encounter, kind: CombatPassiveEffect['kind']): boolean {
  return encounter.round > 0 && encounter.playerPassives.some((effect) => effect.kind === kind && encounter.round <= passiveRounds(effect))
}

function legacyStatsFromPower(power: number): CombatStats {
  const scale = Math.max(COMBAT_BALANCE.legacyPowerMinimumScale, power / COMBAT_BALANCE.legacyPowerReference)
  return createCombatStats({
    maxHealth: 1_000 * scale,
    attack: 100 * scale,
    defense: 80 * scale,
    speed: 100,
  })
}

function normalizeEncounterEnemy(enemy: MainStageEnemy, index: number): EncounterEnemy {
  const stats = normalizeCombatStats(enemy.stats)
  return {
    id: typeof enemy.id === 'string' && enemy.id.trim() ? enemy.id.trim() : `enemy-${index + 1}`,
    name: typeof enemy.name === 'string' && enemy.name.trim() ? enemy.name.trim().slice(0, 48) : `对手${index + 1}`,
    stats,
    effects: createEffects(),
    maxHealth: stats.maxHealth,
    hp: stats.maxHealth,
  }
}

function cloneEncounterEnemy(enemy: EncounterEnemy): EncounterEnemy {
  return { ...enemy, stats: { ...enemy.stats }, effects: { ...enemy.effects } }
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

export function createEncounter({ enemyName, enemyPower = 0, playerStats, playerPassives = [], playerOuterSkills = [], enemyStats, enemies, kind = 'main', random = Math.random }: EncounterInput): Encounter {
  const resolvedPlayerStats = normalizeCombatStats(playerStats ?? legacyStatsFromPower(1_250))
  const sourceEnemies = enemies?.length
    ? enemies
    : [{
      id: 'legacy-enemy-1',
      name: enemyName ?? '无名对手',
      stats: normalizeCombatStats(enemyStats ?? legacyStatsFromPower(enemyPower || 900)),
    }]
  const seenEnemyIds = new Set<string>()
  const resolvedEnemies = sourceEnemies.map((enemy, index) => {
    const normalized = normalizeEncounterEnemy(enemy, index)
    let id = normalized.id
    let suffix = 2
    while (seenEnemyIds.has(id)) id = `${normalized.id}-${suffix++}`
    seenEnemyIds.add(id)
    return { ...normalized, id }
  })
  const passiveEffects = playerPassives.filter(isSupportedPlayerPassive).map((effect) => ({ ...effect }))
  const startingRage = passiveEffects.reduce((total, effect) => total + (effect.kind === 'battle-start-rage' ? passiveValue(effect) : 0), 0)
  const startingDodge = passiveEffects.reduce((total, effect) => total + (effect.kind === 'battle-start-dodge' ? Math.floor(passiveValue(effect)) : 0), 0)
  const enemyActionBlockedUntilRound = passiveEffects.reduce((latest, effect) => effect.kind === 'block-enemy-actions-for-rounds' ? Math.max(latest, passiveRounds(effect)) : latest, 0)
  return {
    kind,
    enemyName: enemyName ?? resolvedEnemies.map((enemy) => enemy.name).join('、'),
    enemyPower: resolvedEnemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0),
    playerStats: resolvedPlayerStats,
    playerPassives: passiveEffects,
    playerEffects: { ...createEffects(), guaranteedDodge: startingDodge },
    playerMaxHealth: resolvedPlayerStats.maxHealth,
    playerRage: startingRage,
    playerLethalGuardCharges: passiveEffects.filter((effect) => effect.kind === 'survive-lethal').reduce((total, effect) => total + Math.floor(passiveValue(effect)), 0),
    enemyActionBlockedUntilRound,
    playerOuterSkills: playerOuterSkills.map((skill) => ({ ...skill })),
    nextOuterSkillIndex: 0,
    round: 0,
    maxRounds: COMBAT_BALANCE.baseMaxRounds + Math.max(0, resolvedEnemies.length - 1) * COMBAT_BALANCE.additionalRoundsPerEnemy,
    playerHp: resolvedPlayerStats.maxHealth,
    enemies: resolvedEnemies,
    actionQueue: [],
    actionSequence: 0,
    status: 'ready',
    logs: ['你踏入场中，双方相距七步。'],
    random,
  }
}

function statsFor(encounter: Encounter, combatant: CombatantRef): CombatStats {
  return combatant.side === 'player' ? encounter.playerStats : encounter.enemies[combatant.enemyIndex]!.stats
}

function effectsFor(encounter: Encounter, combatant: CombatantRef): CombatEffectState {
  return combatant.side === 'player' ? encounter.playerEffects : encounter.enemies[combatant.enemyIndex]!.effects
}

function hpFor(encounter: Encounter, combatant: CombatantRef): number {
  return combatant.side === 'player' ? encounter.playerHp : encounter.enemies[combatant.enemyIndex]!.hp
}

function maxHpFor(encounter: Encounter, combatant: CombatantRef): number {
  return combatant.side === 'player' ? encounter.playerMaxHealth : encounter.enemies[combatant.enemyIndex]!.maxHealth
}

function setHp(encounter: Encounter, combatant: CombatantRef, value: number): void {
  const hp = clamp(Math.round(value), 0, maxHpFor(encounter, combatant))
  if (combatant.side === 'player') encounter.playerHp = hp
  else encounter.enemies[combatant.enemyIndex]!.hp = hp
}

function applyDamage(encounter: Encounter, combatant: CombatantRef, amount: number): void {
  setHp(encounter, combatant, hpFor(encounter, combatant) - Math.max(0, amount))
  if (combatant.side === 'player' && encounter.playerHp <= 0 && encounter.playerLethalGuardCharges > 0) {
    encounter.playerLethalGuardCharges -= 1
    encounter.playerHp = 1
    encounter.logs.push('护体真意在生死关头被触发，你保留了1点生命。')
  }
}

function displayName(encounter: Encounter, combatant: CombatantRef): string {
  return combatant.side === 'player' ? '你' : encounter.enemies[combatant.enemyIndex]!.name
}

function firstAliveEnemy(encounter: Encounter): CombatantRef | null {
  const enemyIndex = encounter.enemies.findIndex((enemy) => enemy.hp > 0)
  return enemyIndex >= 0 ? { side: 'enemy', enemyIndex } : null
}

function isAlive(encounter: Encounter, combatant: CombatantRef): boolean {
  return hpFor(encounter, combatant) > 0
}

function toTurnAction(encounter: Encounter, combatant: CombatantRef, isCounter = false, isCombo = false): EncounterTurnAction {
  return combatant.side === 'player'
    ? { side: 'player', isCounter, ...(isCombo ? { isCombo: true } : {}) }
    : { side: 'enemy', enemyId: encounter.enemies[combatant.enemyIndex]!.id, isCounter, ...(isCombo ? { isCombo: true } : {}) }
}

function toCombatantRef(encounter: Encounter, action: EncounterTurnAction): CombatantRef | null {
  if (action.side === 'player') return { side: 'player' }
  const enemyIndex = encounter.enemies.findIndex((enemy) => enemy.id === action.enemyId)
  return enemyIndex >= 0 ? { side: 'enemy', enemyIndex } : null
}

function counterTurnAction(encounter: Encounter, counterAttacker: CombatantRef, originalAttacker: CombatantRef): EncounterTurnAction {
  const action = toTurnAction(encounter, counterAttacker, true)
  if (counterAttacker.side === 'player' && originalAttacker.side === 'enemy') {
    action.targetEnemyId = encounter.enemies[originalAttacker.enemyIndex]!.id
  }
  return action
}

function comboTurnAction(encounter: Encounter, attacker: CombatantRef, defender: CombatantRef): EncounterTurnAction {
  const action = toTurnAction(encounter, attacker, false, true)
  if (attacker.side === 'player' && defender.side === 'enemy') {
    action.targetEnemyId = encounter.enemies[defender.enemyIndex]!.id
  }
  return action
}

function targetForTurnAction(encounter: Encounter, action: EncounterTurnAction, attacker: CombatantRef): CombatantRef | null {
  if (attacker.side === 'enemy') return { side: 'player' }
  if (action.targetEnemyId) {
    const enemyIndex = encounter.enemies.findIndex((enemy) => enemy.id === action.targetEnemyId && enemy.hp > 0)
    if (enemyIndex >= 0) return { side: 'enemy', enemyIndex }
  }
  return firstAliveEnemy(encounter)
}

function resolveHit(attacker: CombatStats, defender: CombatStats, attackerEffects: CombatEffectState, defenderEffects: CombatEffectState, random: () => number, guaranteedHit = false): { hit: boolean; guaranteed: boolean } {
  // Defensive certainty takes priority. Consuming both effects makes the collision deterministic.
  if (defenderEffects.guaranteedDodge > 0) {
    defenderEffects.guaranteedDodge -= 1
    if (attackerEffects.guaranteedHit > 0) attackerEffects.guaranteedHit -= 1
    return { hit: false, guaranteed: true }
  }
  if (attackerEffects.guaranteedHit > 0) {
    attackerEffects.guaranteedHit -= 1
    return { hit: true, guaranteed: true }
  }
  if (guaranteedHit) return { hit: true, guaranteed: true }
  return { hit: randomValue(random) * 100 < getHitChance(attacker, defender), guaranteed: false }
}

function canTrigger(rate: number, random: () => number): boolean {
  return rate > 0 && randomValue(random) * 100 < rate
}

function finishIfDefeated(encounter: Encounter): boolean {
  if (encounter.status !== 'fighting') return true
  if (encounter.playerHp <= 0) {
    encounter.status = 'lost'
    encounter.logs.push('你收剑退开，伤势并不严重。')
    return true
  }
  if (!firstAliveEnemy(encounter)) {
    encounter.status = 'won'
    encounter.logs.push(`${encounter.enemyName}败退，江湖声名有所增长。`)
    return true
  }
  return false
}

function createCombatAction(encounter: Encounter, attacker: CombatantRef, defender: CombatantRef, outcome: CombatAction['outcome'], damage: number, isCritical: boolean, isCounter: boolean, skill?: CombatAction['skill'], isCombo = false): CombatAction {
  encounter.actionSequence += 1
  return {
    sequence: encounter.actionSequence,
    attacker: toTurnAction(encounter, attacker, isCounter),
    defender: toTurnAction(encounter, defender),
    outcome,
    damage,
    isCritical,
    ...(isCombo ? { isCombo: true } : {}),
    ...(skill ? { skill } : {}),
  }
}

function performAttack(encounter: Encounter, attackerRef: CombatantRef, defenderRef: CombatantRef, isCounter: boolean, random: () => number, skill?: MartialActiveSkill, isCombo = false): AttackResolution {
  const attacker = statsFor(encounter, attackerRef)
  const defender = statsFor(encounter, defenderRef)
  const attackerEffects = effectsFor(encounter, attackerRef)
  const defenderEffects = effectsFor(encounter, defenderRef)
  const attackerName = displayName(encounter, attackerRef)
  const defenderName = displayName(encounter, defenderRef)
  const rageBeforeSkill = skill && attackerRef.side === 'player' && !isCounter && encounter.playerRage >= 100 ? encounter.playerRage : 0
  const rageMultiplier = rageBeforeSkill >= 100 ? rageBeforeSkill / 100 : 1

  if (attackerEffects.stunnedFor > 0) {
    attackerEffects.stunnedFor -= 1
    encounter.logs.push(`${attackerName}陷入眩晕，无法出手。`)
    return { action: createCombatAction(encounter, attackerRef, defenderRef, 'stunned', 0, false, isCounter, undefined, isCombo), counterRequested: false, comboRequested: false }
  }

  if (attackerRef.side === 'enemy' && encounter.round <= encounter.enemyActionBlockedUntilRound) {
    encounter.logs.push(`${attackerName}被压制，无法行动。`)
    return { action: createCombatAction(encounter, attackerRef, defenderRef, 'stunned', 0, false, isCounter, undefined, isCombo), counterRequested: false, comboRequested: false }
  }

  const activeSkill = skill && rageBeforeSkill >= 100 ? skill : undefined
  const weaponAffinityActive = Boolean(activeSkill?.weaponAffinityActive)
  const weaponAffinityDamageMultiplier = weaponAffinityActive ? COMBAT_BALANCE.weaponAffinityDamageMultiplier : 1
  const weaponAffinityEffectMultiplier = weaponAffinityActive ? COMBAT_BALANCE.weaponAffinityEffectMultiplier : 1
  const skillAction: CombatAction['skill'] = activeSkill
    ? {
      id: activeSkill.id,
      name: activeSkill.name,
      rageSpent: rageBeforeSkill,
      multiplier: Math.round(rageMultiplier * 100) / 100,
      weaponAffinityActive,
      weaponAffinityDamageMultiplier,
      weaponAffinityEffectMultiplier,
    }
    : undefined
  if (skillAction) {
    encounter.playerRage = 0
    encounter.logs.push(`${attackerName}施展${skillAction.name}，怒气倍率 x${skillAction.multiplier.toFixed(2)}。`)
    if (skillAction.weaponAffinityActive) encounter.logs.push('所持兵器与外功相契，招式威力更盛。')
  }

  const hit = resolveHit(attacker, defender, attackerEffects, defenderEffects, random, Boolean(activeSkill?.guaranteedHit))
  if (!hit.hit) {
    encounter.logs.push(hit.guaranteed ? `${defenderName}身形一晃，避开了${attackerName}的必中一击。` : `${attackerName}一招落空，被${defenderName}闪开。`)
    return { action: createCombatAction(encounter, attackerRef, defenderRef, 'dodge', 0, false, isCounter, skillAction, isCombo), counterRequested: false, comboRequested: false }
  }

  if (defenderRef.side === 'player' && hasActiveRoundPassive(encounter, 'damage-immunity-for-rounds')) {
    encounter.logs.push(`${defenderName}护体无伤，化解了${attackerName}的攻势。`)
    return { action: createCombatAction(encounter, attackerRef, defenderRef, 'immune', 0, false, isCounter, skillAction, isCombo), counterRequested: false, comboRequested: false }
  }

  const effectiveCritRate = clamp(attacker.critRate + (skillAction ? (skill?.bonusCritRate ?? 0) * weaponAffinityEffectMultiplier : 0) - defender.critResist, 0, 100)
  const critical = canTrigger(effectiveCritRate, random)
  const defensePierceRate = skillAction ? clamp((skill?.defensePierceRate ?? 0) * weaponAffinityEffectMultiplier, 0, 100) : 0
  const effectiveDefense = defender.defense * (1 - defensePierceRate / 100)
  const defenseMultiplier = COMBAT_BALANCE.defenseDamageDenominator / (COMBAT_BALANCE.defenseDamageDenominator + effectiveDefense)
  const criticalMultiplier = critical
    ? 1 + ((attacker.critDamage - 100) / 100) * (1 - defender.critDamageReduction / 100)
    : 1
  const roundDamageBonus = attackerRef.side === 'player' ? activeRoundPassiveValue(encounter, 'damage-bonus-for-rounds') : 0
  const roundDamageReduction = defenderRef.side === 'player' ? activeRoundPassiveValue(encounter, 'damage-reduction-for-rounds') : 0
  const effectiveDamageBonus = attacker.damageBonus + roundDamageBonus
  const effectiveDamageReduction = clamp(defender.damageReduction + roundDamageReduction, 0, 100)
  const damageMultiplier = (1 + effectiveDamageBonus / 100) * (1 - effectiveDamageReduction / 100)
    * (skillAction ? (skill?.damageMultiplier ?? 1) * rageMultiplier * weaponAffinityDamageMultiplier : 1)
    * (isCombo ? COMBAT_BALANCE.comboDamageMultiplier : 1)
  const baseDamage = Math.max(1, Math.round(attacker.attack * COMBAT_BALANCE.baseDamageMultiplier * defenseMultiplier * criticalMultiplier * damageMultiplier * randomFactor(random)))
  let totalDamage = baseDamage
  applyDamage(encounter, defenderRef, baseDamage)
  encounter.logs.push(`${isCounter ? '反击：' : ''}${attackerName}${skillAction ? `以${skillAction.name}` : ''}命中，造成 ${baseDamage} 点伤害${critical ? '（暴击）' : ''}。`)

  const roundComboBonus = attackerRef.side === 'player' ? activeRoundPassiveValue(encounter, 'combo-bonus-for-rounds') : 0
  const comboRate = clamp(attacker.comboRate + roundComboBonus - defender.comboResist, 0, 100)
  const comboRequested = !isCombo && isAlive(encounter, defenderRef) && canTrigger(comboRate, random)
  if (comboRequested) encounter.logs.push(`${attackerName}连击得手，准备再次攻击。`)

  const lifestealRate = clamp(attacker.lifestealRate - defender.lifestealResist, 0, 100)
  if (lifestealRate > 0) {
    const healing = Math.round(totalDamage * (lifestealRate / 100) * (1 + attacker.healingBonus / 100))
    if (healing > 0) {
      setHp(encounter, attackerRef, hpFor(encounter, attackerRef) + healing)
      encounter.logs.push(`${attackerName}恢复了 ${healing} 点生命。`)
    }
  }

  const stunRate = clamp(attacker.stunRate - defender.stunResist, 0, 100)
  const skillStunRate = skillAction ? (skill?.stunRate ?? 0) * weaponAffinityEffectMultiplier : 0
  if (isAlive(encounter, defenderRef) && canTrigger(stunRate + skillStunRate, random)) {
    defenderEffects.stunnedFor = Math.max(defenderEffects.stunnedFor, 1)
    encounter.logs.push(`${defenderName}陷入眩晕。`)
  }

  const counterRate = clamp(defender.counterRate - attacker.counterResist, 0, 100)
  const counterRequested = !isCounter && !isCombo && isAlive(encounter, defenderRef) && canTrigger(counterRate, random)
  if (counterRequested) encounter.logs.push(`${defenderName}抓住空隙，发动反击。`)
  if (activeSkill?.grantDodge) attackerEffects.guaranteedDodge += Math.max(0, Math.floor(activeSkill.grantDodge))
  return { action: createCombatAction(encounter, attackerRef, defenderRef, 'hit', totalDamage, critical, isCounter, skillAction, isCombo), counterRequested, comboRequested }
}

function getTurnOrder(encounter: Encounter): EncounterTurnAction[] {
  const combatants: Array<{ combatant: CombatantRef; speed: number; tieBreaker: number }> = [
    { combatant: { side: 'player' }, speed: encounter.playerStats.speed, tieBreaker: -1 },
    ...encounter.enemies
      .map((enemy, enemyIndex) => ({ enemy, enemyIndex }))
      .filter(({ enemy }) => enemy.hp > 0)
      .map(({ enemy, enemyIndex }) => ({ combatant: { side: 'enemy' as const, enemyIndex }, speed: enemy.stats.speed, tieBreaker: enemyIndex })),
  ]
  return combatants
    .sort((left, right) => right.speed - left.speed || left.tieBreaker - right.tieBreaker)
    .map(({ combatant }) => toTurnAction(encounter, combatant))
}

function cloneForStep(encounter: Encounter, playerStats?: CombatStats | number, enemyStats?: CombatStats): Encounter {
  const resolvedPlayerStats = typeof playerStats === 'number'
    ? legacyStatsFromPower(playerStats)
    : normalizeCombatStats(playerStats ?? encounter.playerStats)
  const next: Encounter = {
    ...encounter,
    playerStats: resolvedPlayerStats,
    playerPassives: encounter.playerPassives.map((effect) => ({ ...effect })),
    playerEffects: { ...encounter.playerEffects },
    playerOuterSkills: encounter.playerOuterSkills.map((skill) => ({ ...skill })),
    enemies: encounter.enemies.map(cloneEncounterEnemy),
    actionQueue: encounter.actionQueue.map((action) => ({ ...action })),
    logs: [...encounter.logs],
    random: encounter.random,
  }
  next.playerMaxHealth = resolvedPlayerStats.maxHealth
  next.playerHp = clamp(next.playerHp, 0, next.playerMaxHealth)
  if (enemyStats && next.enemies[0]) {
    next.enemies[0].stats = normalizeCombatStats(enemyStats)
    next.enemies[0].maxHealth = next.enemies[0].stats.maxHealth
    next.enemies[0].hp = Math.min(next.enemies[0].hp, next.enemies[0].maxHealth)
  }
  return next
}

function selectPlayerSkill(encounter: Encounter, attacker: CombatantRef, isCounter: boolean, isCombo: boolean): MartialActiveSkill | undefined {
  if (attacker.side !== 'player' || isCounter || isCombo || encounter.playerEffects.stunnedFor > 0 || encounter.playerRage < 100 || !encounter.playerOuterSkills.length) return undefined
  const index = encounter.nextOuterSkillIndex % encounter.playerOuterSkills.length
  encounter.nextOuterSkillIndex = (index + 1) % encounter.playerOuterSkills.length
  return encounter.playerOuterSkills[index]
}

function grantRageAfterAction(encounter: Encounter, attacker: CombatantRef, defender: CombatantRef, action: CombatAction): void {
  if (action.outcome === 'stunned') return
  if (action.isCombo) return
  if (attacker.side === 'player' && !action.skill) encounter.playerRage += 50
  if (defender.side === 'player') encounter.playerRage += 25
}

export function advanceEncounterAction(encounter: Encounter, playerStats?: CombatStats | number, enemyStats?: CombatStats): EncounterStep {
  if (encounter.status !== 'fighting') return { encounter, action: null }
  const next = cloneForStep(encounter, playerStats, enemyStats)
  const random = next.random ?? Math.random

  if (finishIfDefeated(next)) return { encounter: next, action: null }

  while (next.status === 'fighting') {
    if (!next.actionQueue.length) {
      if (next.round >= next.maxRounds) {
        next.status = 'draw'
        next.logs.push(`${next.maxRounds} 回合已过，双方暂且罢手。`)
        break
      }
      next.round += 1
      next.actionQueue = getTurnOrder(next)
    }
    const turnAction = next.actionQueue.shift()
    if (!turnAction) break
    const attackerRef = toCombatantRef(next, turnAction)
    if (!attackerRef || !isAlive(next, attackerRef)) continue
    const defenderRef = targetForTurnAction(next, turnAction, attackerRef)
    if (!defenderRef || !isAlive(next, defenderRef)) {
      finishIfDefeated(next)
      break
    }

    const resolution = performAttack(next, attackerRef, defenderRef, turnAction.isCounter, random, selectPlayerSkill(next, attackerRef, turnAction.isCounter, Boolean(turnAction.isCombo)), Boolean(turnAction.isCombo))
    grantRageAfterAction(next, attackerRef, defenderRef, resolution.action)
    const finished = finishIfDefeated(next)
    if (!finished && resolution.counterRequested) next.actionQueue.unshift(counterTurnAction(next, defenderRef, attackerRef))
    if (!finished && resolution.comboRequested) next.actionQueue.unshift(comboTurnAction(next, attackerRef, defenderRef))
    if (!finished && !next.actionQueue.length && next.round >= next.maxRounds) {
      next.status = 'draw'
      next.logs.push(`${next.maxRounds} 回合已过，双方暂且罢手。`)
    }
    return { encounter: next, action: resolution.action }
  }

  return { encounter: next, action: null }
}

export function advanceEncounter(encounter: Encounter, playerStats?: CombatStats | number, enemyStats?: CombatStats): Encounter {
  if (encounter.status !== 'fighting') return encounter
  const targetRound = encounter.actionQueue.length ? encounter.round : encounter.round + 1
  let next = encounter
  do {
    next = advanceEncounterAction(next, playerStats, enemyStats).encounter
  } while (next.status === 'fighting' && (next.round < targetRound || next.actionQueue.length > 0))
  return next
}
