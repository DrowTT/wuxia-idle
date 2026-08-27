import rawContent from './dungeons.json'
import { deepFreeze } from './freeze'
import { EQUIPMENT } from './equipment'
import { getInventoryItemById } from './items'
import { MARTIAL_ARTS } from './martial-arts'
import type { DungeonConfig, DungeonDrop, DungeonLayerConfig } from '../domain/types'

interface DungeonContent { dungeons: readonly DungeonConfig[] }
const DUNGEON_TONES = ['vermilion', 'jade', 'gold'] as const
const MECHANIC_IDS = ['counter-stance', 'poison-mist', 'changing-styles'] as const
const COMBAT_STAT_KEYS = ['maxHealth', 'attack', 'defense', 'speed', 'hitRate', 'dodgeRate', 'critRate', 'critDamage', 'comboRate', 'counterRate', 'stunRate', 'lifestealRate', 'critResist', 'comboResist', 'counterResist', 'stunResist', 'lifestealResist', 'healingBonus', 'critDamageReduction', 'damageBonus', 'damageReduction'] as const

function validateDrop(drop: DungeonDrop, label: string): void {
  if (!['item', 'equipment', 'martial', 'resource'].includes(drop.kind)) throw new Error(`秘境配置无效：${label}的掉落类型不合法。`)
  if (!Number.isFinite(drop.weight) || drop.weight <= 0) throw new Error(`秘境配置无效：${label}的掉落权重必须大于 0。`)
  if ((drop.kind === 'item' || drop.kind === 'equipment' || drop.kind === 'martial') && typeof drop.itemId !== 'string') throw new Error(`秘境配置无效：${label}缺少道具 ID。`)
  if (drop.kind === 'item' && !getInventoryItemById(drop.itemId)) throw new Error(`秘境配置无效：${label}引用了不存在的道具 ${drop.itemId}。`)
  if (drop.kind === 'equipment' && !EQUIPMENT.some((item) => item.id === drop.itemId)) throw new Error(`秘境配置无效：${label}引用了不存在的装备 ${drop.itemId}。`)
  if (drop.kind === 'martial' && !MARTIAL_ARTS.some((item) => item.id === drop.itemId)) throw new Error(`秘境配置无效：${label}引用了不存在的功法 ${drop.itemId}。`)
  if (drop.kind === 'resource' && (!['forge', 'insight', 'silver', 'incense'].includes(drop.resource) || !Number.isFinite(drop.amount) || drop.amount <= 0)) throw new Error(`秘境配置无效：${label}的资源配置不合法。`)
  if (drop.kind === 'item' && drop.quantity !== undefined && (!Number.isInteger(drop.quantity) || drop.quantity <= 0)) throw new Error(`秘境配置无效：${label}的道具数量必须是正整数。`)
}

function validateLayer(layer: DungeonLayerConfig, dungeonIndex: number, layerIndex: number): void {
  const label = `第 ${dungeonIndex + 1} 个秘境第 ${layerIndex + 1} 层`
  if (layer.layer !== layerIndex + 1) throw new Error(`秘境配置无效：${label}的层数必须连续。`)
  if (layer.staminaCost !== undefined && (!Number.isInteger(layer.staminaCost) || layer.staminaCost < 1)) throw new Error(`秘境配置无效：${label}的体力消耗必须是正整数。`)
  if (!layer.name.trim() || !layer.enemyName.trim()) throw new Error(`秘境配置无效：${label}缺少名称。`)
  if (!Number.isInteger(layer.enemyCount ?? 1) || (layer.enemyCount ?? 1) < 1 || (layer.enemyCount ?? 1) > 3) throw new Error(`秘境配置无效：${label}的敌人数必须介于 1 和 3 之间。`)
  for (const key of ['maxHealth', 'attack', 'defense', 'speed'] as const) {
    const value = layer.enemyStats[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < (key === 'defense' ? 0 : 1)) throw new Error(`秘境配置无效：${label}缺少合法的敌人${key}属性。`)
  }
  for (const [stat, value] of Object.entries(layer.enemyStats)) {
    if (!COMBAT_STAT_KEYS.includes(stat as typeof COMBAT_STAT_KEYS[number]) || typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`秘境配置无效：${label}的敌人属性 ${stat} 不合法。`)
  }
  if (!layer.drops.length || !layer.drops.some((drop) => drop.weight > 0)) throw new Error(`秘境配置无效：${label}没有可抽取的掉落。`)
  layer.drops.forEach((drop, index) => validateDrop(drop, `${label}掉落 ${index + 1}`))
  layer.guaranteedDrops?.forEach((drop, index) => validateDrop(drop, `${label}保底掉落 ${index + 1}`))
  if (layer.dropQualityBonus !== undefined && (!Number.isFinite(layer.dropQualityBonus) || layer.dropQualityBonus < 0)) throw new Error(`秘境配置无效：${label}的品质加成不合法。`)
  for (const [resource, amount] of Object.entries(layer.firstClear ?? {})) {
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`秘境配置无效：${label}的首通${resource}奖励不合法。`)
  }
}

function validateDungeonContent(value: unknown): readonly DungeonConfig[] {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as Partial<DungeonContent>).dungeons)) throw new Error('秘境配置无效：缺少 dungeons 列表。')
  const dungeons = (value as DungeonContent).dungeons
  const ids = new Set<string>()
  dungeons.forEach((dungeon, dungeonIndex) => {
    if (!dungeon.id?.trim() || ids.has(dungeon.id)) throw new Error(`秘境配置无效：秘境 ID 重复或为空（${dungeon.id ?? ''}）。`)
    ids.add(dungeon.id)
    if (!dungeon.name?.trim() || !dungeon.description?.trim() || !dungeon.strategy?.trim() || !dungeon.themeDropLabel?.trim() || !DUNGEON_TONES.includes(dungeon.tone as typeof DUNGEON_TONES[number]) || !dungeon.mechanic?.id || !MECHANIC_IDS.includes(dungeon.mechanic.id as typeof MECHANIC_IDS[number]) || !dungeon.mechanic.name?.trim() || !dungeon.mechanic.description?.trim()) throw new Error(`秘境配置无效：${dungeon.id}缺少展示信息或机制枚举不合法。`)
    if (dungeon.dailyAttempts !== undefined && (!Number.isInteger(dungeon.dailyAttempts) || dungeon.dailyAttempts < 0)) throw new Error(`秘境配置无效：${dungeon.id}的兼容次数配置不合法。`)
    if (!dungeon.layers.length) throw new Error(`秘境配置无效：${dungeon.id}没有层级配置。`)
    dungeon.layers.forEach((layer, layerIndex) => validateLayer(layer, dungeonIndex, layerIndex))
  })
  return dungeons
}

export const DUNGEONS: readonly DungeonConfig[] = deepFreeze(validateDungeonContent(rawContent))

const DUNGEONS_BY_ID = new Map(DUNGEONS.map((dungeon) => [dungeon.id, dungeon] as const))

export function getDungeonById(id: string): DungeonConfig | undefined {
  return DUNGEONS_BY_ID.get(id)
}

export function getDungeonLayer(dungeonId: string, layer: number): DungeonLayerConfig | undefined {
  return getDungeonById(dungeonId)?.layers.find((entry) => entry.layer === layer)
}
