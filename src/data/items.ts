import rawContent from './items.json'
import { deepFreeze } from './freeze'
import type { CoreCombatStat, GemEffect, GradeTone, InventoryItem, InventoryItemCategory, PillEffect } from '../domain/types'

export const MARTIAL_ASCENSION_TOKEN_ID = 'martial-ascension-seal'
export const EQUIPMENT_ASCENSION_TOKEN_ID = 'equipment-ascension-seal'
export const EQUIPMENT_ESSENCE_ID = 'equipment-essence'
export const REFORGE_STONE_ID = 'equipment-reforge-stone'
export const GEM_SYNTHESIS_SUCCESS_RATES = [1, 0.9, 0.75, 0.55, 0.35] as const

const GRADE_TONES: readonly GradeTone[] = ['white', 'green', 'blue', 'purple', 'orange', 'red']
const ITEM_CATEGORIES: readonly InventoryItemCategory[] = ['growth', 'pill', 'material', 'gem']
const CORE_STATS: readonly CoreCombatStat[] = ['maxHealth', 'attack', 'defense', 'speed']
const GEM_FAMILIES = ['attack', 'maxHealth', 'defense', 'speed'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateEffect(effect: unknown, label: string, allowInnerForceRate: boolean): void {
  if (!isRecord(effect) || typeof effect.kind !== 'string' || (allowInnerForceRate ? effect.kind !== 'innerForceRate' && effect.kind !== 'combatBonus' && effect.kind !== 'combatRate' : effect.kind !== 'combatBonus' && effect.kind !== 'combatRate')) {
    throw new Error(`道具配置无效：${label}的效果类型不合法。`)
  }
  if (typeof effect.amount !== 'number' || !Number.isFinite(effect.amount) || effect.amount <= 0) throw new Error(`道具配置无效：${label}的效果数值必须大于 0。`)
  if (effect.kind !== 'innerForceRate' && !CORE_STATS.includes(effect.stat as CoreCombatStat)) throw new Error(`道具配置无效：${label}引用了不支持的属性 ${String(effect.stat)}。`)
}

function validateInventoryItems(value: unknown): readonly InventoryItem[] {
  if (!isRecord(value) || !Array.isArray(value.items)) throw new Error('道具配置无效：缺少 items 列表。')
  const ids = new Set<string>()
  value.items.forEach((item, index) => {
    const label = `items[${index}]`
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error(`道具配置无效：${label}的 ID 重复或为空。`)
    ids.add(item.id)
    if (typeof item.name !== 'string' || !item.name.trim() || typeof item.grade !== 'string' || !item.grade.trim() || !GRADE_TONES.includes(item.gradeTone as GradeTone) || !ITEM_CATEGORIES.includes(item.category as InventoryItemCategory)) throw new Error(`道具配置无效：${label}缺少基本信息或枚举值不合法。`)
    if (typeof item.description !== 'string' || !item.description.trim() || typeof item.lore !== 'string' || !item.lore.trim()) throw new Error(`道具配置无效：${label}缺少描述。`)
    if (item.usable !== undefined && typeof item.usable !== 'boolean') throw new Error(`道具配置无效：${label}.usable 必须是布尔值。`)
    if (item.usable === true && item.category !== 'pill') throw new Error(`道具配置无效：${label}只有丹药可以使用。`)
    if (item.pillEffects !== undefined) {
      if (item.category !== 'pill' || !Array.isArray(item.pillEffects) || !item.pillEffects.length) throw new Error(`道具配置无效：${label}的丹药效果不合法。`)
      item.pillEffects.forEach((effect, effectIndex) => validateEffect(effect, `${label}.pillEffects[${effectIndex}]`, true))
    }
    if (item.gemEffects !== undefined) {
      if (item.category !== 'gem' || !Array.isArray(item.gemEffects) || !item.gemEffects.length) throw new Error(`道具配置无效：${label}的宝石效果不合法。`)
      item.gemEffects.forEach((effect, effectIndex) => validateEffect(effect, `${label}.gemEffects[${effectIndex}]`, false))
    }
    if (item.category === 'gem' && (!GEM_FAMILIES.includes(item.gemFamily as typeof GEM_FAMILIES[number]) || typeof item.gemTier !== 'number' || !Number.isInteger(item.gemTier) || item.gemTier < 0 || item.gemTier > 5)) throw new Error(`道具配置无效：${label}缺少合法的宝石合成层级。`)
    if (item.category === 'pill' && (!Array.isArray(item.pillEffects) || !item.pillEffects.length)) throw new Error(`道具配置无效：${label}丹药缺少效果。`)
    if (item.category === 'gem' && (!Array.isArray(item.gemEffects) || !item.gemEffects.length)) throw new Error(`道具配置无效：${label}宝石缺少效果。`)
  })
  return value.items as readonly InventoryItem[]
}

const items = validateInventoryItems(rawContent)
export const INVENTORY_ITEMS: readonly InventoryItem[] = deepFreeze(items.map((item) => ({
  ...item,
  ...(item.pillEffects ? { pillEffects: item.pillEffects.map((effect) => ({ ...effect })) } : {}),
  ...(item.gemEffects ? { gemEffects: item.gemEffects.map((effect) => ({ ...effect })) } : {}),
  ...(item.gemFamily ? { gemFamily: item.gemFamily, gemTier: item.gemTier } : {}),
})))

const INVENTORY_ITEMS_BY_ID = new Map(INVENTORY_ITEMS.map((item) => [item.id, item] as const))

export function getInventoryItemById(id: string): InventoryItem | undefined {
  return INVENTORY_ITEMS_BY_ID.get(id)
}
