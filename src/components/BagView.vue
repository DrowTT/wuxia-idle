<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookOpen, CircleDot, Crown, Hammer, Hand, Shield, Shirt, Sparkles, Swords, Trophy } from '@lucide/vue'
import { EQUIPMENT_ENHANCEMENT_MAX_LEVEL } from '../data'
import { EQUIPMENT, EQUIPMENT_CATEGORIES, EQUIPMENT_SETS, EQUIPMENT_SLOTS, MARTIAL_ARTS, canEnhanceEquipment, canEnhanceMartialArt, canEquipEquipmentInSlot, getEquipmentCombatBonuses, getEquipmentCombatRates, getEquipmentEnhancementCost, getEquipmentEnhancementLevel, getEquipmentForSlot, getEquipmentSetActivations, getEquippedMartialArts, getMartialEnhancementCost, getMartialMastery, isMartialArtEnhanceable } from '../domain/game'
import { compareEquipmentInventory, compareMartialArtInventory } from '../data/inventory-sorting'
import MartialArtTooltip from './MartialArtTooltip.vue'
import type { CombatStats, Equipment, EquipmentCategory, EquipmentSlot, GameState, MartialArt, MartialArtSlot } from '../domain/types'

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{
  'equip-equipment': [slot: EquipmentSlot, equipment: Equipment]
  'unequip-equipment': [slot: EquipmentSlot]
  'enhance-equipment': [equipment: Equipment]
  'equip-martial': [slot: MartialArtSlot, art: MartialArt]
  'unequip-martial': [slot: MartialArtSlot]
  'enhance-art': [art: MartialArt]
}>()

type SlotMeta = { label: string; icon: typeof Swords }
type EquipmentFilter = 'all' | EquipmentCategory
type MartialFilter = 'all' | 'inner' | 'outer'
type LoadoutMode = 'loadout' | 'growth'
type EquipmentGrowthOperation = 'enhance' | 'gems' | 'reforge' | 'ascend'
type MartialGrowthOperation = 'enhance' | 'ascend'

const MIN_ITEM_SLOTS = 15

const slotMeta: Record<EquipmentSlot, SlotMeta> = {
  weapon: { label: '武器', icon: Swords },
  helmet: { label: '头盔', icon: Crown },
  chest: { label: '胸甲', icon: Shield },
  mount: { label: '坐骑', icon: Trophy },
  cloak: { label: '披风', icon: Shirt },
  belt: { label: '腰带', icon: Hand },
  talisman: { label: '护符', icon: Sparkles },
  ring1: { label: '戒指一', icon: CircleDot },
  ring2: { label: '戒指二', icon: CircleDot },
}

const martialSlotMeta: Record<MartialArtSlot, { label: string; hint: string }> = {
  inner1: { label: '内功一', hint: '被动心法' },
  inner2: { label: '内功二', hint: '被动心法' },
  outer1: { label: '外功一', hint: '主动招式' },
  outer2: { label: '外功二', hint: '主动招式' },
}

const categoryLabels: Record<EquipmentCategory, string> = {
  weapon: '武器', helmet: '头盔', chest: '胸甲', mount: '坐骑', cloak: '披风', belt: '腰带', talisman: '护符', ring: '戒指',
}

const statLabels: Partial<Record<keyof CombatStats, string>> = {
  maxHealth: '生命', attack: '攻击', defense: '防御', speed: '速度', hitRate: '命中', dodgeRate: '闪避',
  critRate: '暴击', critDamage: '暴伤', comboRate: '连击', counterRate: '反击', stunRate: '眩晕', lifestealRate: '吸血',
  critResist: '暴抗', comboResist: '连抗', counterResist: '反抗', stunResist: '晕抗', lifestealResist: '吸抗',
  healingBonus: '治疗', critDamageReduction: '暴伤减免', damageBonus: '伤害加成', damageReduction: '伤害减免',
}

const activeTab = ref('equipment')
const activeFilter = ref<EquipmentFilter>('all')
const activeMartialFilter = ref<MartialFilter>('all')
const equipmentMode = ref<LoadoutMode>('loadout')
const martialMode = ref<LoadoutMode>('loadout')
const equipmentGrowthOperation = ref<EquipmentGrowthOperation>('enhance')
const martialGrowthOperation = ref<MartialGrowthOperation>('enhance')
const selectedEquipmentSlot = ref<EquipmentSlot | null>(null)
const selectedMartialSlot = ref<MartialArtSlot | null>(null)
const equippedCount = computed(() => EQUIPMENT_SLOTS.filter((slot) => props.game.player.equippedEquipment[slot]).length)
const equipmentSetActivations = computed(() => getEquipmentSetActivations(props.game.player))
const emptyItemSlotCount = MIN_ITEM_SLOTS
const filteredEquipment = computed(() => EQUIPMENT
  .filter((equipment) => (
    (activeFilter.value === 'all' || equipment.categoryId === activeFilter.value)
    && availableEquipmentCount(equipment) > 0
  ))
  .sort(compareEquipmentInventory))
const equippedMartialIds = computed(() => new Set(getEquippedMartialArts(props.game.player).map((art) => art.id)))
const filteredMartialArts = computed(() => MARTIAL_ARTS
  .filter((art) => (
    (activeMartialFilter.value === 'all' || art.kind === activeMartialFilter.value)
    && props.game.lottery.ownedMartialArtIds.includes(art.id)
    && !equippedMartialIds.value.has(art.id)
  ))
  .sort(compareMartialArtInventory))

function equipmentAt(slot: EquipmentSlot): Equipment | null {
  const equipped = props.game.player.equippedEquipment[slot]
  return equipped ? getEquipmentForSlot(slot).find((equipment) => equipment.id === equipped.equipmentId) ?? null : null
}

function equippedSlots(equipment: Equipment): EquipmentSlot[] {
  return EQUIPMENT_SLOTS.filter((slot) => props.game.player.equippedEquipment[slot]?.equipmentId === equipment.id)
}

function ownedEquipmentCount(equipment: Equipment): number {
  return props.game.lottery.ownedEquipmentIds.filter((id) => id === equipment.id).length
}

function availableEquipmentCount(equipment: Equipment): number {
  return Math.max(0, ownedEquipmentCount(equipment) - equippedSlots(equipment).length)
}

function clickEquipmentSlot(slot: EquipmentSlot): void {
  if (!equipmentAt(slot)) return
  if (equipmentMode.value === 'growth') {
    selectEquipmentForGrowth(slot)
    return
  }
  emit('unequip-equipment', slot)
}

function slotIconQuality(slot: EquipmentSlot): string {
  const equipment = equipmentAt(slot)
  return equipment ? `quality-${equipment.gradeTone}` : 'quality-empty'
}

function selectFilter(filter: EquipmentFilter): void {
  activeFilter.value = filter
}

function equipEquipment(equipment: Equipment): void {
  const matchingSlots = EQUIPMENT_SLOTS.filter((slot) => canEquipEquipmentInSlot(equipment, slot))
  const targetSlot = matchingSlots.find((slot) => !props.game.player.equippedEquipment[slot]) ?? matchingSlots[0]
  if (!targetSlot) return
  emit('equip-equipment', targetSlot, equipment)
}

function equipmentStats(equipment: Equipment, enhanced = false): Array<{ label: string; value: string }> {
  const bonuses = enhanced ? getEquipmentCombatBonuses(props.game.player, equipment) : equipment.combatBonuses
  const rates = enhanced ? getEquipmentCombatRates(props.game.player, equipment) : equipment.combatRates
  const rateStats = Object.entries(rates ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const label = statLabels[key as keyof CombatStats]
    return label ? [{ label, value: `${value > 0 ? '+' : ''}${value}%` }] : []
  })
  const fixedStats = Object.entries(bonuses ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const stat = key as keyof CombatStats
    const label = statLabels[stat]
    if (!label) return []
    const percentage = !['maxHealth', 'attack', 'defense', 'speed'].includes(stat)
    return [{ label, value: `${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}` }]
  })
  return [...rateStats, ...fixedStats]
}

function equipmentEffectDescription(equipment: Equipment, enhanced = false): string {
  const stats = equipmentStats(equipment, enhanced)
  return stats.length ? `装备后获得：${stats.map((stat) => `${stat.label} ${stat.value}`).join('、')}。` : '装备后暂无额外属性。'
}

const selectedEquipment = computed(() => {
  const selectedSlot = selectedEquipmentSlot.value
  if (selectedSlot) {
    const equipment = equipmentAt(selectedSlot)
    if (equipment) return { slot: selectedSlot, equipment }
  }
  const fallbackSlot = EQUIPMENT_SLOTS.find((slot) => equipmentAt(slot))
  return fallbackSlot ? { slot: fallbackSlot, equipment: equipmentAt(fallbackSlot)! } : null
})

function selectEquipmentForGrowth(slot: EquipmentSlot): void {
  if (equipmentAt(slot)) selectedEquipmentSlot.value = slot
}

function isSelectedEquipmentSlot(slot: EquipmentSlot): boolean {
  return selectedEquipment.value?.slot === slot
}

function equipmentEnhancementLevel(equipment: Equipment): number {
  return getEquipmentEnhancementLevel(props.game.player, equipment.id)
}

function equipmentEnhancementCost(equipment: Equipment): number {
  return getEquipmentEnhancementCost(props.game.player, equipment)
}

function canEnhanceEquipmentItem(equipment: Equipment): boolean {
  return canEnhanceEquipment(props.game.player, equipment)
}

function equipmentSetName(equipment: Equipment): string {
  return equipment.setId ? EQUIPMENT_SETS.find((set) => set.id === equipment.setId)?.name ?? '' : ''
}

function equipmentSetBonuses(equipment: Equipment) {
  return equipment.setId ? EQUIPMENT_SETS.find((set) => set.id === equipment.setId)?.bonuses ?? [] : []
}

function equipmentSetPieceCount(equipment: Equipment): number {
  return equipment.setId ? equipmentSetActivations.value.find(({ set }) => set.id === equipment.setId)?.count ?? 0 : 0
}

function martialAt(slot: MartialArtSlot): MartialArt | null {
  const id = props.game.player.martialLoadout?.[slot]
  return typeof id === 'string' ? MARTIAL_ARTS.find((art) => art.id === id && art.kind === (slot.startsWith('inner') ? 'inner' : 'outer')) ?? null : null
}

function clickMartialSlot(slot: MartialArtSlot): void {
  if (!martialAt(slot)) return
  if (martialMode.value === 'growth') {
    selectMartialForGrowth(slot)
    return
  }
  emit('unequip-martial', slot)
}

const selectedMartial = computed(() => {
  const selectedSlot = selectedMartialSlot.value
  if (selectedSlot) {
    const art = martialAt(selectedSlot)
    if (art) return { slot: selectedSlot, art }
  }
  const fallbackSlot = (['inner1', 'inner2', 'outer1', 'outer2'] as MartialArtSlot[]).find((slot) => martialAt(slot))
  return fallbackSlot ? { slot: fallbackSlot, art: martialAt(fallbackSlot)! } : null
})

function selectMartialForGrowth(slot: MartialArtSlot): void {
  if (martialAt(slot)) selectedMartialSlot.value = slot
}

function isSelectedMartialSlot(slot: MartialArtSlot): boolean {
  return selectedMartial.value?.slot === slot
}

function equipMartialArt(art: MartialArt): void {
  const slots = art.kind === 'inner' ? (['inner1', 'inner2'] as const) : (['outer1', 'outer2'] as const)
  const slot = slots.find((candidate) => !props.game.player.martialLoadout?.[candidate]) ?? slots[0]
  emit('equip-martial', slot, art)
}

function artEnhancementCost(art: MartialArt): number { return getMartialEnhancementCost(props.game.player, art) }
function artMastery(art: MartialArt): number { return getMartialMastery(props.game.player, art.id) }
function canEnhanceMartial(art: MartialArt): boolean { return canEnhanceMartialArt(props.game.player, art) }
function martialEnhancementLabel(art: MartialArt): string { return artMastery(art) >= 100 ? '已强化至满级' : `强化 ${artEnhancementCost(art)} 心得` }
function martialCount(kind: 'inner' | 'outer'): number {
  return getEquippedMartialArts(props.game.player).filter((art) => art.kind === kind).length
}
function selectMartialFilter(filter: MartialFilter): void { activeMartialFilter.value = filter }
</script>

<template>
  <div class="bag-page">
    <el-tabs v-model="activeTab" class="bag-tabs">
      <el-tab-pane label="装备" name="equipment">
        <section class="inventory-page" aria-label="装备背包">
          <header class="equipment-heading">
            <div><span class="kicker">人物装束</span><h1>装备</h1></div>
            <span class="equipped-count">已装备 {{ equippedCount }} / {{ EQUIPMENT_SLOTS.length }}</span>
          </header>

          <div class="equipment-columns">
            <section class="equipment-slots-panel" aria-label="装备槽">
              <header><h2>装备槽</h2></header>
              <div class="equipment-slot-grid">
                <el-popover v-for="slot in EQUIPMENT_SLOTS" :key="slot" trigger="hover" placement="right" :width="250" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover" :disabled="equipmentMode === 'growth'">
                  <template #reference>
                    <el-button class="inventory-slot" :class="{ empty: !equipmentAt(slot), selected: equipmentMode === 'growth' && isSelectedEquipmentSlot(slot) }" :aria-label="equipmentAt(slot) ? equipmentMode === 'growth' ? `选择${equipmentAt(slot)?.name}` : `卸下${equipmentAt(slot)?.name}` : `${slotMeta[slot].label}未装备`" @click="clickEquipmentSlot(slot)">
                      <component :is="slotMeta[slot].icon" :size="20" :class="slotIconQuality(slot)" />
                      <span>{{ slotMeta[slot].label }}</span>
                      <b v-if="equipmentAt(slot)">{{ equipmentAt(slot)?.name }}</b>
                      <i v-else>未装备</i>
                    </el-button>
                  </template>
                  <section v-if="equipmentAt(slot)" class="equipment-tooltip">
                    <header><div><small>{{ slotMeta[slot].label }}</small><b>{{ equipmentAt(slot)?.name }}</b></div><el-tag size="small" class="quality-tag" :class="equipmentAt(slot)?.gradeTone">{{ equipmentAt(slot)?.grade }}</el-tag></header>
                    <div class="tooltip-copy tooltip-lore"><small>背景</small><p>{{ equipmentAt(slot)?.keyword }} · {{ equipmentAt(slot)?.lore }}</p></div>
                    <div class="tooltip-copy tooltip-effect"><small>装备效果</small><p>{{ equipmentEffectDescription(equipmentAt(slot)!, true) }}</p></div>
                    <dl><div v-for="stat in equipmentStats(equipmentAt(slot)!, true)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
                    <section v-if="equipmentAt(slot)?.setId" class="equipment-set-tooltip"><b>{{ equipmentSetName(equipmentAt(slot)!) }} · {{ equipmentSetPieceCount(equipmentAt(slot)!) }} / 6</b><span v-for="bonus in equipmentSetBonuses(equipmentAt(slot)!)" :key="bonus.pieces" :class="{ active: equipmentSetPieceCount(equipmentAt(slot)!) >= bonus.pieces }">{{ bonus.pieces }} 件：{{ bonus.description }}</span></section>
                    <div v-if="equipmentAt(slot)?.gemSlots" class="tooltip-gems"><span>宝石孔</span><i v-for="index in equipmentAt(slot)?.gemSlots" :key="index" /></div>
                  </section>
                  <section v-else class="equipment-tooltip empty-tooltip"><b>{{ slotMeta[slot].label }}</b><p>未装备</p></section>
                </el-popover>
              </div>
              <div v-if="equipmentSetActivations.length" class="equipment-set-status" aria-label="已装备套装进度">
                <div v-for="activation in equipmentSetActivations" :key="activation.set.id" class="equipment-set-line" :class="activation.set.gradeTone">
                  <b>{{ activation.set.name }} · {{ activation.count }} / 6</b>
                  <span v-if="activation.activeBonuses.length">已激活 {{ activation.activeBonuses.at(-1)?.pieces }} 件效果</span>
                  <span v-else>集齐 3 件激活</span>
                </div>
              </div>
            </section>

            <section class="inventory-panel equipment-side-panel" :aria-label="equipmentMode === 'growth' ? '装备养成' : '背包装备'">
              <header class="inventory-panel-heading side-panel-heading">
                <el-tabs v-model="equipmentMode" class="side-mode-tabs"><el-tab-pane label="背包装备" name="loadout" /><el-tab-pane label="养成" name="growth" /></el-tabs>
                <span>{{ equipmentMode === 'growth' ? '选择左侧装备' : `${filteredEquipment.length} 件` }}</span>
              </header>
              <template v-if="equipmentMode === 'loadout'">
                <el-tabs :model-value="activeFilter" class="equipment-filter-tabs" @tab-change="selectFilter($event as EquipmentFilter)">
                  <el-tab-pane label="全部" name="all" />
                  <el-tab-pane v-for="category in EQUIPMENT_CATEGORIES" :key="category" :label="categoryLabels[category]" :name="category" />
                </el-tabs>
                <div class="inventory-equipment-grid">
                  <el-popover v-for="equipment in filteredEquipment" :key="equipment.id" trigger="hover" placement="right" :width="250" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                    <template #reference>
                      <el-button class="inventory-equipment" :class="[equipment.gradeTone, { equipped: equippedSlots(equipment).length }]" :aria-label="`装备${equipment.name}`" @click="equipEquipment(equipment)">
                        <span class="inventory-equipment-glyph">{{ equipment.name.slice(-1) }}</span>
                        <b>{{ equipment.name }}</b>
                        <small>{{ equipment.category }}</small>
                        <i v-if="ownedEquipmentCount(equipment) > 1">x{{ availableEquipmentCount(equipment) }}</i>
                      </el-button>
                    </template>
                    <section class="equipment-tooltip">
                      <header><div><small>{{ equipment.category }}</small><b>{{ equipment.name }}</b></div><el-tag size="small" class="quality-tag" :class="equipment.gradeTone">{{ equipment.grade }}</el-tag></header>
                      <p>{{ equipment.keyword }}</p>
                      <div class="tooltip-copy tooltip-lore"><small>背景</small><p>{{ equipment.lore }}</p></div>
                      <div class="tooltip-copy tooltip-effect"><small>装备效果</small><p>{{ equipmentEffectDescription(equipment) }}</p></div>
                      <dl><div v-for="stat in equipmentStats(equipment)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
                      <section v-if="equipment.setId" class="equipment-set-tooltip"><b>{{ equipmentSetName(equipment) }} · {{ equipmentSetPieceCount(equipment) }} / 6</b><span v-for="bonus in equipmentSetBonuses(equipment)" :key="bonus.pieces" :class="{ active: equipmentSetPieceCount(equipment) >= bonus.pieces }">{{ bonus.pieces }} 件：{{ bonus.description }}</span></section>
                      <div v-if="equipment.gemSlots" class="tooltip-gems"><span>宝石孔</span><i v-for="index in equipment.gemSlots" :key="index" /></div>
                    </section>
                  </el-popover>
                </div>
              </template>
              <section v-else-if="selectedEquipment" class="growth-detail-content" aria-label="装备养成详情">
                <header class="growth-detail-heading"><div><small>{{ slotMeta[selectedEquipment.slot].label }} · {{ selectedEquipment.equipment.grade }}</small><h2>{{ selectedEquipment.equipment.name }}</h2></div><span class="growth-detail-glyph" :class="selectedEquipment.equipment.gradeTone">{{ selectedEquipment.equipment.name.slice(-1) }}</span></header>
                <p class="growth-lore">{{ selectedEquipment.equipment.keyword }} · {{ selectedEquipment.equipment.lore }}</p>
                <el-tabs v-model="equipmentGrowthOperation" class="growth-operation-tabs">
                  <el-tab-pane label="强化" name="enhance">
                    <div class="growth-operation-content">
                      <div class="growth-level-line"><span>强化等级</span><b>+{{ equipmentEnhancementLevel(selectedEquipment.equipment) }} <small>/ {{ EQUIPMENT_ENHANCEMENT_MAX_LEVEL }}</small></b></div>
                      <div class="tooltip-copy tooltip-effect"><small>强化效果</small><p>{{ equipmentEffectDescription(selectedEquipment.equipment, true) }}</p></div>
                      <dl class="growth-stat-list"><div v-for="stat in equipmentStats(selectedEquipment.equipment, true)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
                      <div class="growth-cost-line"><span>本次消耗</span><b><Hammer :size="15" /> {{ equipmentEnhancementCost(selectedEquipment.equipment) }} 铸材</b></div>
                      <el-button type="primary" class="growth-action-button" :disabled="!canEnhanceEquipmentItem(selectedEquipment.equipment)" @click="$emit('enhance-equipment', selectedEquipment.equipment)"><Hammer :size="15" />强化</el-button>
                      <small v-if="equipmentEnhancementLevel(selectedEquipment.equipment) >= EQUIPMENT_ENHANCEMENT_MAX_LEVEL" class="growth-limit-hint">已达到强化上限</small>
                      <small v-else-if="!canEnhanceEquipmentItem(selectedEquipment.equipment)" class="growth-limit-hint">铸材不足，暂时无法强化</small>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="镶嵌宝石" name="gems" disabled />
                  <el-tab-pane label="洗炼" name="reforge" disabled />
                  <el-tab-pane label="升阶" name="ascend" disabled />
                </el-tabs>
              </section>
              <section v-else class="growth-detail-content growth-empty-state" aria-label="装备养成提示"><Hammer :size="30" /><h2>暂无可养成装备</h2><p>先装备一件装备</p></section>
            </section>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="道具" name="items">
        <section class="inventory-page item-inventory-page" aria-label="道具背包">
          <section class="inventory-panel item-inventory-panel">
            <div class="item-grid">
              <div v-for="index in emptyItemSlotCount" :key="`empty-item-${index}`" class="item-card item-empty" aria-hidden="true">
                <span class="item-glyph item-placeholder-glyph" />
              </div>
            </div>
          </section>
        </section>
      </el-tab-pane>

      <el-tab-pane label="功法" name="martial">
        <section class="inventory-page martial-inventory-page" aria-label="功法背包">
          <header class="equipment-heading">
            <div><span class="kicker">战术构筑</span><h1>功法</h1></div>
            <span class="equipped-count">内功 {{ martialCount('inner') }} / 2 · 外功 {{ martialCount('outer') }} / 2</span>
          </header>
          <div class="martial-columns">
            <section class="martial-slots-panel" aria-label="功法槽">
              <header><div><h2>功法槽</h2><span>{{ martialMode === 'growth' ? '选择已装配功法进行养成' : '内功为被动效果，外功按回合轮换施放' }}</span></div></header>
              <div class="martial-slot-groups">
                <div class="martial-slot-group"><small>内功 · 被动</small><div class="martial-slot-grid">
                  <el-popover v-for="slot in ['inner1', 'inner2'] as MartialArtSlot[]" :key="slot" trigger="hover" placement="right" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover" :disabled="martialMode === 'growth'">
                    <template #reference><div class="martial-slot-control"><el-button class="martial-slot" :class="{ empty: !martialAt(slot), selected: martialMode === 'growth' && isSelectedMartialSlot(slot), [martialAt(slot)?.gradeTone ?? 'empty']: true }" :aria-label="martialAt(slot) ? martialMode === 'growth' ? `选择${martialAt(slot)?.name}` : `卸下${martialAt(slot)?.name}` : `${martialSlotMeta[slot].label}未装配`" @click="clickMartialSlot(slot)"><span class="martial-slot-glyph"><BookOpen :size="21" /></span><b v-if="martialAt(slot)">{{ martialAt(slot)?.name }}</b><i v-else>{{ martialSlotMeta[slot].label }}</i><small>{{ martialAt(slot)?.keyword ?? martialSlotMeta[slot].hint }}</small></el-button></div></template>
                    <MartialArtTooltip v-if="martialAt(slot)" :art="martialAt(slot)!" :player="game.player" /><section v-else class="equipment-tooltip empty-tooltip"><b>{{ martialSlotMeta[slot].label }}</b><p>点击右侧功法装配</p></section>
                  </el-popover>
                </div></div>
                <div class="martial-slot-group"><small>外功 · 主动</small><div class="martial-slot-grid">
                  <el-popover v-for="slot in ['outer1', 'outer2'] as MartialArtSlot[]" :key="slot" trigger="hover" placement="right" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover" :disabled="martialMode === 'growth'">
                    <template #reference><div class="martial-slot-control"><el-button class="martial-slot" :class="{ empty: !martialAt(slot), selected: martialMode === 'growth' && isSelectedMartialSlot(slot), [martialAt(slot)?.gradeTone ?? 'empty']: true }" :aria-label="martialAt(slot) ? martialMode === 'growth' ? `选择${martialAt(slot)?.name}` : `卸下${martialAt(slot)?.name}` : `${martialSlotMeta[slot].label}未装配`" @click="clickMartialSlot(slot)"><span class="martial-slot-glyph"><Swords :size="21" /></span><b v-if="martialAt(slot)">{{ martialAt(slot)?.name }}</b><i v-else>{{ martialSlotMeta[slot].label }}</i><small>{{ martialAt(slot) ? `主动 · ${martialAt(slot)?.activeSkill?.name ?? '招式'}` : martialSlotMeta[slot].hint }}</small></el-button></div></template>
                    <MartialArtTooltip v-if="martialAt(slot)" :art="martialAt(slot)!" :player="game.player" /><section v-else class="equipment-tooltip empty-tooltip"><b>{{ martialSlotMeta[slot].label }}</b><p>点击右侧功法装配</p></section>
                  </el-popover>
                </div></div>
              </div>
              <div class="rage-note"><Swords :size="15" /><span>外功规则：攻击获得50怒气，受击获得25怒气；怒气超过100时，招式按当前怒气倍率增强。</span></div>
            </section>
            <section class="inventory-panel martial-library-panel martial-side-panel" :aria-label="martialMode === 'growth' ? '功法养成' : '背包功法'">
              <header class="inventory-panel-heading side-panel-heading">
                <el-tabs v-model="martialMode" class="side-mode-tabs"><el-tab-pane label="背包功法" name="loadout" /><el-tab-pane label="养成" name="growth" /></el-tabs>
                <span>{{ martialMode === 'growth' ? '选择左侧功法' : `${filteredMartialArts.length} 门可装配` }}</span>
              </header>
              <template v-if="martialMode === 'loadout'">
                <el-tabs :model-value="activeMartialFilter" class="equipment-filter-tabs" @tab-change="selectMartialFilter($event as MartialFilter)"><el-tab-pane label="全部" name="all" /><el-tab-pane label="内功" name="inner" /><el-tab-pane label="外功" name="outer" /></el-tabs>
                <div class="martial-library-grid">
                  <el-popover v-for="art in filteredMartialArts" :key="art.id" trigger="hover" placement="left" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                    <template #reference><div class="martial-library-card" :class="art.gradeTone" role="button" tabindex="0" :aria-label="`装配${art.name}`" @click="equipMartialArt(art)" @keydown.enter="equipMartialArt(art)"><span class="martial-library-glyph"><BookOpen v-if="art.kind === 'inner'" :size="21" /><Swords v-else :size="21" /></span><div><b>{{ art.name }}</b><small>{{ art.kind === 'inner' ? '内功 · 被动' : '外功 · 主动' }} · {{ art.keyword }}</small><em>{{ art.grade }}</em></div></div></template>
                    <MartialArtTooltip :art="art" :player="game.player" />
                  </el-popover>
                </div>
              </template>
              <section v-else-if="selectedMartial" class="growth-detail-content martial-growth-detail" aria-label="功法养成详情">
                <header class="growth-detail-heading"><div><small>{{ martialSlotMeta[selectedMartial.slot].label }} · {{ selectedMartial.art.grade }}</small><h2>{{ selectedMartial.art.name }}</h2></div><span class="growth-detail-glyph" :class="selectedMartial.art.gradeTone"><BookOpen :size="21" /></span></header>
                <el-tabs v-model="martialGrowthOperation" class="growth-operation-tabs">
                  <el-tab-pane label="强化" name="enhance">
                    <div class="growth-operation-content">
                      <MartialArtTooltip :art="selectedMartial.art" :player="game.player" />
                      <div v-if="isMartialArtEnhanceable(selectedMartial.art)" class="growth-level-line"><span>强化等级</span><b>{{ artMastery(selectedMartial.art) }} <small>/ 100</small></b></div>
                      <div v-if="isMartialArtEnhanceable(selectedMartial.art)" class="growth-cost-line"><span>本次消耗</span><b><Sparkles :size="15" /> {{ artEnhancementCost(selectedMartial.art) }} 心得</b></div>
                      <el-button v-if="isMartialArtEnhanceable(selectedMartial.art)" type="primary" class="growth-action-button" :disabled="!canEnhanceMartial(selectedMartial.art)" @click="$emit('enhance-art', selectedMartial.art)"><Hammer :size="15" />强化</el-button>
                      <small v-if="!isMartialArtEnhanceable(selectedMartial.art)" class="growth-limit-hint">该功法暂不支持强化</small>
                      <small v-else-if="artMastery(selectedMartial.art) >= 100" class="growth-limit-hint">已达到强化上限</small>
                      <small v-else-if="!canEnhanceMartial(selectedMartial.art)" class="growth-limit-hint">心得不足，暂时无法强化</small>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="升阶" name="ascend" disabled />
                </el-tabs>
              </section>
              <section v-else class="growth-detail-content growth-empty-state" aria-label="功法养成提示"><BookOpen :size="30" /><h2>暂无可养成功法</h2><p>先装配一本功法</p></section>
            </section>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
