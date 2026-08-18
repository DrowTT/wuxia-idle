<script setup lang="ts">
import { computed, ref } from 'vue'
import { BookOpen, CircleDot, Crown, Hand, Shield, Shirt, Sparkles, Swords, Trophy } from '@lucide/vue'
import { EQUIPMENT, EQUIPMENT_CATEGORIES, EQUIPMENT_SETS, EQUIPMENT_SLOTS, MARTIAL_ARTS, canComposeLotteryEquipment, canEnhanceMartialArt, canEquipEquipmentInSlot, getEquipmentForSlot, getEquipmentSetActivations, getEquippedMartialArts, getInnerForceRateBonus, getLotteryFragmentCount, getLotteryFragmentRequirement, getMartialEnhancementCost, getMartialMastery, getOwnedLotteryFragmentTargets, hasMartialWeaponAffinity, isMartialArtEnhanceable } from '../domain/game'
import type { CombatStats, Equipment, EquipmentCategory, EquipmentSlot, GameState, MartialArt, MartialArtSlot, WeaponStyle } from '../domain/types'

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{
  'equip-equipment': [slot: EquipmentSlot, equipment: Equipment]
  'unequip-equipment': [slot: EquipmentSlot]
  'compose-fragment': [equipmentId: string]
  'equip-martial': [slot: MartialArtSlot, art: MartialArt]
  'unequip-martial': [slot: MartialArtSlot]
  'enhance-art': [art: MartialArt]
}>()

type SlotMeta = { label: string; icon: typeof Swords }
type EquipmentFilter = 'all' | EquipmentCategory
type MartialFilter = 'all' | 'inner' | 'outer'

const ITEM_GRID_COLUMNS = 5
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

const weaponStyleLabels: Record<WeaponStyle, string> = {
  sword: '长剑',
  saber: '刀',
  spear: '枪戟',
  staff: '棍',
  fist: '拳套',
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
const equippedCount = computed(() => EQUIPMENT_SLOTS.filter((slot) => props.game.player.equippedEquipment[slot]).length)
const equipmentSetActivations = computed(() => getEquipmentSetActivations(props.game.player))
const fragmentTargets = computed(() => getOwnedLotteryFragmentTargets(props.game.lottery))
const emptyItemSlotCount = computed(() => {
  const slotCount = Math.max(MIN_ITEM_SLOTS, Math.ceil(fragmentTargets.value.length / ITEM_GRID_COLUMNS) * ITEM_GRID_COLUMNS)
  return slotCount - fragmentTargets.value.length
})
const filteredEquipment = computed(() => EQUIPMENT.filter((equipment) => (
  (activeFilter.value === 'all' || equipment.categoryId === activeFilter.value)
  && props.game.lottery.ownedEquipmentIds.includes(equipment.id)
  && !equippedSlots(equipment).length
)))
const equippedMartialIds = computed(() => new Set(getEquippedMartialArts(props.game.player).map((art) => art.id)))
const filteredMartialArts = computed(() => MARTIAL_ARTS.filter((art) => (
  (activeMartialFilter.value === 'all' || art.kind === activeMartialFilter.value)
  && props.game.lottery.ownedMartialArtIds.includes(art.id)
  && !equippedMartialIds.value.has(art.id)
)))

function equipmentAt(slot: EquipmentSlot): Equipment | null {
  const equipped = props.game.player.equippedEquipment[slot]
  return equipped ? getEquipmentForSlot(slot).find((equipment) => equipment.id === equipped.equipmentId) ?? null : null
}

function equippedSlots(equipment: Equipment): EquipmentSlot[] {
  return EQUIPMENT_SLOTS.filter((slot) => props.game.player.equippedEquipment[slot]?.equipmentId === equipment.id)
}

function clickEquipmentSlot(slot: EquipmentSlot): void {
  if (equipmentAt(slot)) emit('unequip-equipment', slot)
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

function gradeTagType(equipment: Pick<Equipment, 'gradeTone'>): 'success' | 'primary' | 'info' {
  if (equipment.gradeTone === 'green') return 'success'
  if (equipment.gradeTone === 'blue') return 'primary'
  return 'info'
}

function equipmentStats(equipment: Equipment): Array<{ label: string; value: string }> {
  return Object.entries(equipment.combatBonuses ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const stat = key as keyof CombatStats
    const label = statLabels[stat]
    if (!label) return []
    const percentage = !['maxHealth', 'attack', 'defense', 'speed'].includes(stat)
    return [{ label, value: `${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}` }]
  })
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

function fragmentCount(equipment: Equipment): number {
  return getLotteryFragmentCount(props.game.lottery, equipment.id)
}

function canCompose(equipment: Equipment): boolean {
  return canComposeLotteryEquipment(props.game.lottery, equipment.id)
}

function martialAt(slot: MartialArtSlot): MartialArt | null {
  const id = props.game.player.martialLoadout?.[slot]
  return typeof id === 'string' ? MARTIAL_ARTS.find((art) => art.id === id && art.kind === (slot.startsWith('inner') ? 'inner' : 'outer')) ?? null : null
}

function clickMartialSlot(slot: MartialArtSlot): void {
  if (martialAt(slot)) emit('unequip-martial', slot)
}

function equipMartialArt(art: MartialArt): void {
  const slots = art.kind === 'inner' ? (['inner1', 'inner2'] as const) : (['outer1', 'outer2'] as const)
  const slot = slots.find((candidate) => !props.game.player.martialLoadout?.[candidate]) ?? slots[0]
  emit('equip-martial', slot, art)
}

function martialStats(art: MartialArt): Array<{ label: string; value: string }> {
  return Object.entries(art.combatBonuses ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const label = statLabels[key as keyof CombatStats]
    if (!label) return []
    const percentage = !['maxHealth', 'attack', 'defense', 'speed'].includes(key)
    return [{ label, value: `${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}` }]
  })
}

function martialAffinityStyles(art: MartialArt): string {
  return art.affinityWeaponStyles?.map((style) => weaponStyleLabels[style]).join(' / ') ?? ''
}

function martialAffinityActive(art: MartialArt): boolean {
  return hasMartialWeaponAffinity(props.game.player, art)
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
                <el-popover v-for="slot in EQUIPMENT_SLOTS" :key="slot" trigger="hover" placement="right" :width="250" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                  <template #reference>
                    <el-button class="inventory-slot" :class="{ empty: !equipmentAt(slot) }" :aria-label="equipmentAt(slot) ? `卸下${equipmentAt(slot)?.name}` : `${slotMeta[slot].label}未装备`" @click="clickEquipmentSlot(slot)">
                      <component :is="slotMeta[slot].icon" :size="20" :class="slotIconQuality(slot)" />
                      <span>{{ slotMeta[slot].label }}</span>
                      <b v-if="equipmentAt(slot)">{{ equipmentAt(slot)?.name }}</b>
                      <i v-else>未装备</i>
                    </el-button>
                  </template>
                  <section v-if="equipmentAt(slot)" class="equipment-tooltip">
                    <header><div><small>{{ slotMeta[slot].label }}</small><b>{{ equipmentAt(slot)?.name }}</b></div><el-tag size="small" :type="gradeTagType(equipmentAt(slot)!)">{{ equipmentAt(slot)?.grade }}</el-tag></header>
                    <p>{{ equipmentAt(slot)?.category }} · {{ equipmentAt(slot)?.keyword }}</p>
                    <dl><div v-for="stat in equipmentStats(equipmentAt(slot)!)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
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

            <section class="inventory-panel" aria-label="背包装备">
              <header class="inventory-panel-heading"><div><h2>背包装备</h2></div><span>{{ filteredEquipment.length }} 件</span></header>
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
                      <i v-if="equippedSlots(equipment).length">已装备</i>
                    </el-button>
                  </template>
                  <section class="equipment-tooltip">
                    <header><div><small>{{ equipment.category }}</small><b>{{ equipment.name }}</b></div><el-tag size="small" :type="gradeTagType(equipment)">{{ equipment.grade }}</el-tag></header>
                    <p>{{ equipment.keyword }} · 战力 {{ equipment.power }}</p>
                    <p class="tooltip-description">{{ equipment.description }}</p>
                    <dl><div v-for="stat in equipmentStats(equipment)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
                    <section v-if="equipment.setId" class="equipment-set-tooltip"><b>{{ equipmentSetName(equipment) }} · {{ equipmentSetPieceCount(equipment) }} / 6</b><span v-for="bonus in equipmentSetBonuses(equipment)" :key="bonus.pieces" :class="{ active: equipmentSetPieceCount(equipment) >= bonus.pieces }">{{ bonus.pieces }} 件：{{ bonus.description }}</span></section>
                    <div v-if="equipment.gemSlots" class="tooltip-gems"><span>宝石孔</span><i v-for="index in equipment.gemSlots" :key="index" /></div>
                  </section>
                </el-popover>
              </div>
            </section>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="道具" name="items">
        <section class="inventory-page item-inventory-page" aria-label="道具背包">
          <span class="item-inventory-count">已收集 {{ fragmentTargets.length }} 类</span>
          <section class="inventory-panel item-inventory-panel">
            <div class="item-grid">
              <div v-for="equipment in fragmentTargets" :key="equipment.id" class="item-card" :class="equipment.gradeTone">
                <span class="item-glyph"><Swords :size="20" /></span>
                <div><b>{{ equipment.name }}碎片</b><small>数量：{{ fragmentCount(equipment) }} / {{ getLotteryFragmentRequirement(equipment.gradeTone) }}</small><el-button size="small" :disabled="!canCompose(equipment)" @click="$emit('compose-fragment', equipment.id)">合成</el-button></div>
              </div>
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
              <header><div><h2>功法槽</h2><span>内功为被动效果，外功按回合轮换施放</span></div></header>
              <div class="martial-slot-groups">
                <div class="martial-slot-group"><small>内功 · 被动</small><div class="martial-slot-grid">
                  <el-popover v-for="slot in ['inner1', 'inner2'] as MartialArtSlot[]" :key="slot" trigger="hover" placement="right" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                    <template #reference><div class="martial-slot-control"><el-button class="martial-slot" :class="{ empty: !martialAt(slot), enhanceable: martialAt(slot) && isMartialArtEnhanceable(martialAt(slot)!), [martialAt(slot)?.gradeTone ?? 'empty']: true }" :aria-label="martialAt(slot) ? `卸下${martialAt(slot)?.name}` : `${martialSlotMeta[slot].label}未装配`" @click="clickMartialSlot(slot)"><span class="martial-slot-glyph"><BookOpen :size="21" /></span><b v-if="martialAt(slot)">{{ martialAt(slot)?.name }}</b><i v-else>{{ martialSlotMeta[slot].label }}</i><small>{{ martialAt(slot)?.keyword ?? martialSlotMeta[slot].hint }}</small></el-button><el-button v-if="martialAt(slot) && isMartialArtEnhanceable(martialAt(slot)!)" class="martial-enhance-button" type="primary" size="small" :disabled="!canEnhanceMartial(martialAt(slot)!)" @click.stop="$emit('enhance-art', martialAt(slot)!)">{{ martialEnhancementLabel(martialAt(slot)!) }}</el-button></div></template>
                    <section v-if="martialAt(slot)" class="equipment-tooltip"><header><div><small>{{ martialAt(slot)?.category }}</small><b>{{ martialAt(slot)?.name }}</b></div><el-tag size="small" :type="gradeTagType({ gradeTone: martialAt(slot)!.gradeTone } as Equipment)">{{ martialAt(slot)?.grade }}</el-tag></header><p>{{ martialAt(slot)?.keyword }} · {{ martialAt(slot)?.description }}</p><dl><div v-for="stat in martialStats(martialAt(slot)!)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl><p v-if="martialAt(slot)?.activeSkill">怒气达到100后，于后续回合施放：{{ martialAt(slot)?.activeSkill?.name }}</p><p v-if="martialAt(slot)?.passiveEffects?.length">{{ martialAt(slot)?.passiveEffects?.map((effect) => effect.description).join(' · ') }}</p></section><section v-else class="equipment-tooltip empty-tooltip"><b>{{ martialSlotMeta[slot].label }}</b><p>点击右侧功法装配</p></section>
                  </el-popover>
                </div></div>
                <div class="martial-slot-group"><small>外功 · 主动</small><div class="martial-slot-grid">
                  <el-popover v-for="slot in ['outer1', 'outer2'] as MartialArtSlot[]" :key="slot" trigger="hover" placement="right" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                    <template #reference><div class="martial-slot-control"><el-button class="martial-slot" :class="{ empty: !martialAt(slot), enhanceable: martialAt(slot) && isMartialArtEnhanceable(martialAt(slot)!), [martialAt(slot)?.gradeTone ?? 'empty']: true }" :aria-label="martialAt(slot) ? `卸下${martialAt(slot)?.name}` : `${martialSlotMeta[slot].label}未装配`" @click="clickMartialSlot(slot)"><span class="martial-slot-glyph"><Swords :size="21" /></span><b v-if="martialAt(slot)">{{ martialAt(slot)?.name }}</b><i v-else>{{ martialSlotMeta[slot].label }}</i><small>{{ martialAt(slot)?.activeSkill?.name ?? martialSlotMeta[slot].hint }}</small></el-button><el-button v-if="martialAt(slot) && isMartialArtEnhanceable(martialAt(slot)!)" class="martial-enhance-button" type="primary" size="small" :disabled="!canEnhanceMartial(martialAt(slot)!)" @click.stop="$emit('enhance-art', martialAt(slot)!)">{{ martialEnhancementLabel(martialAt(slot)!) }}</el-button></div></template>
                    <section v-if="martialAt(slot)" class="equipment-tooltip"><header><div><small>{{ martialAt(slot)?.category }}</small><b>{{ martialAt(slot)?.name }}</b></div><el-tag size="small" :type="gradeTagType({ gradeTone: martialAt(slot)!.gradeTone } as Equipment)">{{ martialAt(slot)?.grade }}</el-tag></header><p>{{ martialAt(slot)?.keyword }} · {{ martialAt(slot)?.description }}</p><p v-if="martialAt(slot)?.activeSkill">{{ martialAt(slot)?.activeSkill?.name }}：{{ martialAt(slot)?.activeSkill?.description }}</p><p v-if="martialAt(slot)?.affinityWeaponStyles?.length" class="martial-affinity"><span>兵器契合：{{ martialAffinityStyles(martialAt(slot)!) }}</span><b :class="{ active: martialAffinityActive(martialAt(slot)!) }">{{ martialAffinityActive(martialAt(slot)!) ? '当前已契合' : '当前未契合' }}</b></p><p v-if="martialAt(slot)?.affinityWeaponStyles?.length">契合时，外功伤害 x1.18；数值型招式效果 x1.25</p><dl><div v-for="stat in martialStats(martialAt(slot)!)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl></section><section v-else class="equipment-tooltip empty-tooltip"><b>{{ martialSlotMeta[slot].label }}</b><p>点击右侧功法装配</p></section>
                  </el-popover>
                </div></div>
              </div>
              <div class="rage-note"><Swords :size="15" /><span>外功规则：攻击获得50怒气，受击获得25怒气；怒气超过100时，招式按当前怒气倍率增强。</span></div>
            </section>
            <section class="inventory-panel martial-library-panel" aria-label="背包功法">
              <header class="inventory-panel-heading"><div><h2>背包功法</h2><span>已拥有 {{ game.lottery.ownedMartialArtIds.length }} 门</span></div><span>{{ filteredMartialArts.length }} 门可装配</span></header>
              <el-tabs :model-value="activeMartialFilter" class="equipment-filter-tabs" @tab-change="selectMartialFilter($event as MartialFilter)"><el-tab-pane label="全部" name="all" /><el-tab-pane label="内功" name="inner" /><el-tab-pane label="外功" name="outer" /></el-tabs>
              <div class="martial-library-grid">
                <el-popover v-for="art in filteredMartialArts" :key="art.id" trigger="hover" placement="left" :width="270" :enterable="false" :show-after="0" :hide-after="0" transition="none" popper-class="equipment-popover">
                  <template #reference><div class="martial-library-card" :class="art.gradeTone" role="button" tabindex="0" :aria-label="`装配${art.name}`" @click="equipMartialArt(art)" @keydown.enter="equipMartialArt(art)"><span class="martial-library-glyph"><BookOpen v-if="art.kind === 'inner'" :size="21" /><Swords v-else :size="21" /></span><div><b>{{ art.name }}</b><small>{{ art.kind === 'inner' ? '内功 · 被动' : '外功 · 主动' }} · {{ art.keyword }}</small><em>{{ art.grade }}</em></div><el-button v-if="isMartialArtEnhanceable(art)" class="martial-enhance-button art-enhance-button" type="primary" size="small" :disabled="!canEnhanceMartial(art)" @click.stop="$emit('enhance-art', art)">{{ martialEnhancementLabel(art) }}</el-button></div></template>
                  <section class="equipment-tooltip"><header><div><small>{{ art.category }}</small><b>{{ art.name }}</b></div><el-tag size="small" :type="gradeTagType({ gradeTone: art.gradeTone } as Equipment)">{{ art.grade }}</el-tag></header><p>{{ art.keyword }} · {{ art.description }}</p><p v-if="art.activeSkill"><b>{{ art.activeSkill.name }}</b>：{{ art.activeSkill.description }}</p><p v-if="art.affinityWeaponStyles?.length" class="martial-affinity"><span>兵器契合：{{ martialAffinityStyles(art) }}</span><b :class="{ active: martialAffinityActive(art) }">{{ martialAffinityActive(art) ? '当前已契合' : '当前未契合' }}</b></p><p v-if="art.affinityWeaponStyles?.length">契合时，外功伤害 x1.18；数值型招式效果 x1.25</p><p v-if="art.passiveEffects?.length"><b>内功特效</b>：{{ art.passiveEffects.map((effect) => effect.description).join(' · ') }}</p><dl><div v-for="stat in martialStats(art)" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl><p v-if="art.innerForceRateBase !== undefined">当前吐纳增益：+{{ (art.innerForceRateBase + artMastery(art) * (art.innerForceRatePerMastery ?? 0)).toFixed(2) }} / 秒</p></section>
                </el-popover>
              </div>
            </section>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
