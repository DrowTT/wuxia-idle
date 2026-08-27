import rawContent from './martial-arts.json'
import { deepFreeze } from './freeze'
import type { CombatPassiveEffect, CombatStats, MartialArt, GradeTone, WeaponStyle } from '../domain/types'

interface MartialArtsContent {
  martialArts: readonly MartialArt[]
}

const GRADE_TONES: readonly GradeTone[] = ['white', 'green', 'blue', 'purple', 'orange', 'red']
const WEAPON_STYLES: readonly WeaponStyle[] = ['sword', 'saber', 'spear', 'staff', 'fist']
const COMBAT_STAT_KEYS: readonly (keyof CombatStats)[] = ['maxHealth', 'attack', 'defense', 'speed', 'hitRate', 'dodgeRate', 'critRate', 'critDamage', 'comboRate', 'counterRate', 'stunRate', 'lifestealRate', 'critResist', 'comboResist', 'counterResist', 'stunResist', 'lifestealResist', 'healingBonus', 'critDamageReduction', 'damageBonus', 'damageReduction']
const PASSIVE_KINDS: readonly CombatPassiveEffect['kind'][] = ['survive-lethal', 'battle-start-rage', 'skill-rage-refund', 'battle-start-dodge', 'damage-bonus-for-rounds', 'damage-reduction-for-rounds', 'damage-immunity-for-rounds', 'combo-bonus-for-rounds', 'block-enemy-actions-for-rounds']

function assertCombatBonuses(value: unknown, label: string): void {
  if (value === undefined) return
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`功法配置无效：${label}必须是属性对象。`)
  for (const [key, amount] of Object.entries(value)) {
    if (!COMBAT_STAT_KEYS.includes(key as keyof CombatStats) || typeof amount !== 'number' || !Number.isFinite(amount)) throw new Error(`功法配置无效：${label}.${key}不是合法属性。`)
  }
}

function assertPassiveEffects(value: unknown, label: string): void {
  if (value === undefined) return
  if (!Array.isArray(value)) throw new Error(`功法配置无效：${label}必须是数组。`)
  value.forEach((effect, index) => {
    const effectLabel = `${label}[${index}]`
    if (typeof effect !== 'object' || effect === null || Array.isArray(effect) || typeof effect.id !== 'string' || !effect.id.trim() || typeof effect.label !== 'string' || !effect.label.trim() || typeof effect.description !== 'string' || !effect.description.trim() || !PASSIVE_KINDS.includes(effect.kind as CombatPassiveEffect['kind']) || typeof effect.value !== 'number' || !Number.isFinite(effect.value) || effect.value < 0) throw new Error(`功法配置无效：${effectLabel}的被动效果不合法。`)
    if (effect.duration !== undefined && (typeof effect.duration !== 'number' || !Number.isInteger(effect.duration) || effect.duration <= 0)) throw new Error(`功法配置无效：${effectLabel}.duration 必须是正整数。`)
  })
}

function assertRate(value: unknown, label: string): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) throw new Error(`功法配置无效：${label}必须介于 0 和 100 之间。`)
}

function validateMartialArts(value: unknown): readonly MartialArt[] {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as Partial<MartialArtsContent>).martialArts)) throw new Error('功法配置无效：缺少 martialArts 列表。')
  const arts = (value as MartialArtsContent).martialArts
  const ids = new Set<string>()
  const skillIds = new Set<string>()
  arts.forEach((art, index) => {
    const label = `martialArts[${index}]`
    if (!art || !art.id || ids.has(art.id)) throw new Error(`功法配置无效：${label}的 ID 重复或为空。`)
    ids.add(art.id)
    if (!art.name?.trim() || !art.category?.trim() || !art.keyword?.trim() || !art.lore?.trim() || !GRADE_TONES.includes(art.gradeTone)) throw new Error(`功法配置无效：${label}缺少基本信息或品质不合法。`)
    if (!Number.isInteger(art.level) || art.level < 1 || !Number.isInteger(art.mastery) || art.mastery < 0 || art.mastery > 100) throw new Error(`功法配置无效：${label}的等级或熟练度不合法。`)
    if (art.kind === 'inner') {
      const hasFlatRate = art.innerForceRateBase !== undefined || art.innerForceRatePerMastery !== undefined
      const hasMultiplierRate = art.innerForceRateMultiplierBase !== undefined || art.innerForceRateMultiplierPerMastery !== undefined
      if (hasFlatRate && (typeof art.innerForceRateBase !== 'number' || typeof art.innerForceRatePerMastery !== 'number')) throw new Error(`功法配置无效：${label}的固定吐纳字段必须成对出现。`)
      if (hasMultiplierRate && (typeof art.innerForceRateMultiplierBase !== 'number' || typeof art.innerForceRateMultiplierPerMastery !== 'number')) throw new Error(`功法配置无效：${label}的倍率吐纳字段必须成对出现。`)
      if (!hasFlatRate && !hasMultiplierRate) throw new Error(`功法配置无效：${label}缺少吐纳效果。`)
      for (const [key, amount] of Object.entries({ innerForceRateBase: art.innerForceRateBase, innerForceRatePerMastery: art.innerForceRatePerMastery, innerForceRateMultiplierBase: art.innerForceRateMultiplierBase, innerForceRateMultiplierPerMastery: art.innerForceRateMultiplierPerMastery })) {
        if (amount !== undefined && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)) throw new Error(`功法配置无效：${label}.${key}必须是非负有限数字。`)
      }
      assertCombatBonuses(art.combatBonuses, `${label}.combatBonuses`)
      assertPassiveEffects(art.passiveEffects, `${label}.passiveEffects`)
    } else if (art.kind === 'outer') {
      if (!art.activeSkill || !art.activeSkill.id || !art.activeSkill.name?.trim() || !Number.isFinite(art.activeSkill.damageMultiplier) || art.activeSkill.damageMultiplier <= 0) throw new Error(`功法配置无效：${label}缺少有效主动招式。`)
      if (skillIds.has(art.activeSkill.id)) throw new Error(`功法配置无效：主动招式 ID 重复（${art.activeSkill.id}）。`)
      skillIds.add(art.activeSkill.id)
      if (art.affinityWeaponStyles !== undefined && (!Array.isArray(art.affinityWeaponStyles) || art.affinityWeaponStyles.length === 0 || art.affinityWeaponStyles.some((style) => !WEAPON_STYLES.includes(style)))) throw new Error(`功法配置无效：${label}的兵器适配类型不合法。`)
      assertRate(art.activeSkill.bonusCritRate, `${label}.activeSkill.bonusCritRate`)
      assertRate(art.activeSkill.defensePierceRate, `${label}.activeSkill.defensePierceRate`)
      assertRate(art.activeSkill.stunRate, `${label}.activeSkill.stunRate`)
      if (art.activeSkill.guaranteedHit !== undefined && typeof art.activeSkill.guaranteedHit !== 'boolean') throw new Error(`功法配置无效：${label}.activeSkill.guaranteedHit 必须是布尔值。`)
      if (art.activeSkill.grantDodge !== undefined && (!Number.isInteger(art.activeSkill.grantDodge) || art.activeSkill.grantDodge < 0)) throw new Error(`功法配置无效：${label}.activeSkill.grantDodge 必须是非负整数。`)
    } else {
      throw new Error(`功法配置无效：${label}的 kind 不合法。`)
    }
    if (art.ascension && (!Number.isInteger(art.ascension.maxRank) || art.ascension.maxRank < 1)) throw new Error(`功法配置无效：${label}的升阶上限不合法。`)
    if (art.ascension && 'rageAtBattleStart' in art.ascension) {
      const rage = art.ascension.rageAtBattleStart
      if (!rage || !Number.isFinite(rage.base) || !Number.isFinite(rage.max) || rage.base < 0 || rage.max < rage.base) throw new Error(`功法配置无效：${label}的开局怒气升阶配置不合法。`)
    }
  })
  return arts
}

export const MARTIAL_ARTS: readonly MartialArt[] = deepFreeze(validateMartialArts(rawContent))

const MARTIAL_ARTS_BY_ID = new Map(MARTIAL_ARTS.map((art) => [art.id, art] as const))

export function getMartialArtById(id: string): MartialArt | undefined {
  return MARTIAL_ARTS_BY_ID.get(id)
}
