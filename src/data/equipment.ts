import rawContent from './equipment.json'
import { deepFreeze } from './freeze'
import type { Equipment, EquipmentCategory, EquipmentSet, EquipmentSlot, GradeTone } from '../domain/types'

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt', 'talisman', 'ring1', 'ring2']
export const EQUIPMENT_SET_SLOTS = new Set<string>(['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt'])
export const EQUIPMENT_CATEGORIES: readonly EquipmentCategory[] = ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt', 'talisman', 'ring']
/** Equipment categories that can receive gems. Other equipment has no gem sockets. */
export const EQUIPMENT_GEM_SOCKET_CATEGORIES: readonly EquipmentCategory[] = ['weapon', 'helmet', 'chest', 'mount', 'cloak']
export const INITIAL_EQUIPMENT_GEM_SLOTS = 2
export const MAX_EQUIPMENT_GEM_SLOTS = 4
export const EQUIPMENT_GEM_SOCKET_COST = 400
const GRADE_TONES: readonly GradeTone[] = ['white', 'green', 'blue', 'purple', 'orange', 'red']
const WEAPON_STYLES = ['sword', 'saber', 'spear', 'staff', 'fist'] as const
const COMBAT_STAT_KEYS = ['maxHealth', 'attack', 'defense', 'speed', 'hitRate', 'dodgeRate', 'critRate', 'critDamage', 'comboRate', 'counterRate', 'stunRate', 'lifestealRate', 'critResist', 'comboResist', 'counterResist', 'stunResist', 'lifestealResist', 'healingBonus', 'critDamageReduction', 'damageBonus', 'damageReduction'] as const
const PASSIVE_KINDS = ['survive-lethal', 'battle-start-rage', 'skill-rage-refund', 'battle-start-dodge', 'damage-bonus-for-rounds', 'damage-reduction-for-rounds', 'damage-immunity-for-rounds', 'combo-bonus-for-rounds', 'block-enemy-actions-for-rounds'] as const

interface EquipmentContent {
  equipment: readonly Equipment[]
  sets: readonly EquipmentSet[]
}

function assertNumericMap(value: unknown, label: string): void {
  if (value === undefined) return
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`装备配置无效：${label}必须是属性对象。`)
  for (const [key, entry] of Object.entries(value)) {
    if (!COMBAT_STAT_KEYS.includes(key as typeof COMBAT_STAT_KEYS[number]) || typeof entry !== 'number' || !Number.isFinite(entry)) throw new Error(`装备配置无效：${label}.${key}不是合法属性。`)
  }
}

function assertPassiveEffects(value: unknown, label: string): void {
  if (value === undefined) return
  if (!Array.isArray(value)) throw new Error(`装备配置无效：${label}必须是数组。`)
  value.forEach((effect, index) => {
    const effectLabel = `${label}[${index}]`
    if (typeof effect !== 'object' || effect === null || Array.isArray(effect) || typeof effect.id !== 'string' || !effect.id.trim() || typeof effect.label !== 'string' || !effect.label.trim() || typeof effect.description !== 'string' || !effect.description.trim() || !PASSIVE_KINDS.includes(effect.kind as typeof PASSIVE_KINDS[number]) || typeof effect.value !== 'number' || !Number.isFinite(effect.value) || effect.value < 0) throw new Error(`装备配置无效：${effectLabel}的被动效果不合法。`)
    if (effect.duration !== undefined && (typeof effect.duration !== 'number' || !Number.isInteger(effect.duration) || effect.duration <= 0)) throw new Error(`装备配置无效：${effectLabel}.duration 必须是正整数。`)
  })
}

function validateEquipmentContent(value: unknown): EquipmentContent {
  if (typeof value !== 'object' || value === null) throw new Error('装备配置无效：根节点必须是对象。')
  const source = value as Partial<EquipmentContent>
  if (!Array.isArray(source.equipment) || !Array.isArray(source.sets)) throw new Error('装备配置无效：缺少 equipment 或 sets。')
  const equipmentIds = new Set<string>()
  source.equipment.forEach((equipment, index) => {
    const label = `equipment[${index}]`
    if (!equipment || !equipment.id || equipmentIds.has(equipment.id)) throw new Error(`装备配置无效：${label}的 ID 重复或为空。`)
    equipmentIds.add(equipment.id)
    if (!equipment.name?.trim() || !equipment.category?.trim() || !equipment.keyword?.trim() || !equipment.lore?.trim() || !EQUIPMENT_CATEGORIES.includes(equipment.categoryId)) throw new Error(`装备配置无效：${label}缺少有效的基本信息。`)
    if (!GRADE_TONES.includes(equipment.gradeTone) || !equipment.grade?.trim()) throw new Error(`装备配置无效：${label}品质不合法。`)
    if (!Number.isFinite(equipment.power) || equipment.power < 0 || !Number.isInteger(equipment.gemSlots) || equipment.gemSlots < 0) throw new Error(`装备配置无效：${label}的战力或宝石槽不合法。`)
    if (equipment.categoryId === 'weapon' && !WEAPON_STYLES.includes(equipment.weaponStyle as typeof WEAPON_STYLES[number])) throw new Error(`装备配置无效：${label}武器的 weaponStyle 不合法。`)
    if (equipment.categoryId !== 'weapon' && equipment.weaponStyle !== undefined) throw new Error(`装备配置无效：${label}非武器不应配置 weaponStyle。`)
    assertNumericMap(equipment.combatRates, `${label}.combatRates`)
    assertNumericMap(equipment.combatBonuses, `${label}.combatBonuses`)
    if (equipment.setId && (typeof equipment.setId !== 'string' || !equipment.setId.trim())) throw new Error(`装备配置无效：${label}.setId 不合法。`)
  })
  const sets = source.sets as readonly EquipmentSet[]
  const setIds = new Set<string>()
  sets.forEach((set, index) => {
    const label = `sets[${index}]`
    if (!set || !set.id || setIds.has(set.id)) throw new Error(`装备配置无效：${label}的 ID 重复或为空。`)
    setIds.add(set.id)
    if (!set.name?.trim() || !GRADE_TONES.includes(set.gradeTone) || !Array.isArray(set.bonuses) || !set.bonuses.length) throw new Error(`装备配置无效：${label}缺少有效套装信息。`)
    const pieces = new Set<number>()
    set.bonuses.forEach((bonus, bonusIndex) => {
      if (![3, 4, 5, 6].includes(bonus.pieces) || !bonus.description?.trim()) throw new Error(`装备配置无效：${label}.bonuses[${bonusIndex}]不合法。`)
      if (pieces.has(bonus.pieces)) throw new Error(`装备配置无效：${label}重复配置 ${bonus.pieces} 件效果。`)
      pieces.add(bonus.pieces)
      assertNumericMap(bonus.combatRates, `${label}.bonuses[${bonusIndex}].combatRates`)
      assertNumericMap(bonus.combatBonuses, `${label}.bonuses[${bonusIndex}].combatBonuses`)
      assertPassiveEffects(bonus.passiveEffects, `${label}.bonuses[${bonusIndex}].passiveEffects`)
    })
  })
  for (const equipment of source.equipment) {
    if (equipment.setId && !setIds.has(equipment.setId)) throw new Error(`装备配置无效：${equipment.id}引用了不存在的套装 ${equipment.setId}。`)
  }
  return {
    // `gemSlots` in the data file is kept as a legacy input field. Runtime
    // equipment uses a single, explicit four-slot ceiling for socketable
    // categories, while the equipped instance owns its currently opened slots.
    equipment: source.equipment.map((equipment) => ({
      ...equipment,
      gemSlots: EQUIPMENT_GEM_SOCKET_CATEGORIES.includes(equipment.categoryId) ? MAX_EQUIPMENT_GEM_SLOTS : 0,
    })),
    sets,
  }
}

const content = validateEquipmentContent(rawContent)
export const EQUIPMENT: readonly Equipment[] = deepFreeze(content.equipment)
export const EQUIPMENT_SETS: readonly EquipmentSet[] = deepFreeze(content.sets)

const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map((equipment) => [equipment.id, equipment] as const))
const EQUIPMENT_SETS_BY_ID = new Map(EQUIPMENT_SETS.map((set) => [set.id, set] as const))

export function getEquipmentById(id: string): Equipment | undefined {
  return EQUIPMENT_BY_ID.get(id)
}

export function getEquipmentSetById(id: string): EquipmentSet | undefined {
  return EQUIPMENT_SETS_BY_ID.get(id)
}
