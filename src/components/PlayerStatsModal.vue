<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { getEquippedEquipment, getEquippedMartialArts, getRealm, getRealmBaseCombatStats } from '../domain/game'
import type { CombatStats, PlayerState } from '../domain/types'

type StatKey = keyof CombatStats

interface StatRow {
  key: StatKey
  label: string
  percentage?: boolean
}

const props = defineProps<{
  open: boolean
  player: PlayerState
  stats: CombatStats
  power: number
}>()
const emit = defineEmits<{ close: [] }>()

const basicStats: readonly StatRow[] = [
  { key: 'maxHealth', label: '生命值' },
  { key: 'attack', label: '攻击力' },
  { key: 'defense', label: '防御力' },
  { key: 'speed', label: '速度' },
]

const battleStats: readonly StatRow[] = [
  { key: 'hitRate', label: '命中率', percentage: true },
  { key: 'dodgeRate', label: '闪避率', percentage: true },
  { key: 'critRate', label: '暴击率', percentage: true },
  { key: 'critDamage', label: '暴击伤害', percentage: true },
  { key: 'comboRate', label: '连击率', percentage: true },
  { key: 'counterRate', label: '反击率', percentage: true },
  { key: 'stunRate', label: '眩晕率', percentage: true },
  { key: 'lifestealRate', label: '吸血率', percentage: true },
]

const advancedStats: readonly StatRow[] = [
  { key: 'critResist', label: '暴击抵抗', percentage: true },
  { key: 'comboResist', label: '连击抵抗', percentage: true },
  { key: 'counterResist', label: '反击抵抗', percentage: true },
  { key: 'stunResist', label: '眩晕抵抗', percentage: true },
  { key: 'lifestealResist', label: '吸血抵抗', percentage: true },
  { key: 'healingBonus', label: '治疗效果', percentage: true },
  { key: 'critDamageReduction', label: '暴击伤害减免', percentage: true },
  { key: 'damageBonus', label: '伤害加成', percentage: true },
  { key: 'damageReduction', label: '伤害减免', percentage: true },
]

const visibleAdvancedStats = computed(() => advancedStats.filter(({ key }) => props.stats[key] !== 0))
const realm = computed(() => getRealm(props.player.realmId))

const statSources = computed(() => {
  const realmStats = getRealmBaseCombatStats(props.player)
  const equipment = getEquippedEquipment(props.player)
  const arts = getEquippedMartialArts(props.player)
  return [
    { name: `${realm.value?.label ?? '当前境界'} 第${props.player.realmLevel}重`, bonuses: realmStats, base: true },
    ...equipment.map((item) => ({ name: item.name, bonuses: item.combatBonuses, base: false })),
    ...arts.map((art) => ({ name: art.name, bonuses: art.combatBonuses, base: false })),
  ]
})

function updateVisibility(visible: boolean): void {
  if (!visible) emit('close')
}

function valueFor(row: StatRow): string {
  const value = props.stats[row.key]
  return row.percentage ? `${value}%` : value.toLocaleString()
}

function sourceSummary(bonuses: Partial<CombatStats> | undefined, base: boolean): string {
  if (!bonuses) return '暂无属性加成'
  const rows = basicStats.flatMap(({ key, label }) => {
    const value = bonuses[key]
    if (!value) return []
    return `${label} ${base ? value.toLocaleString() : `${value > 0 ? '+' : ''}${value}`}`
  })
  const rates = [...battleStats, ...advancedStats].flatMap(({ key, label }) => {
    const value = bonuses[key]
    if (!value || base) return []
    return `${label} ${value > 0 ? '+' : ''}${value}%`
  })
  const summary = [...rows, ...rates]
  return summary.length ? summary.join(' · ') : '暂无属性加成'
}
</script>

<template>
  <el-dialog class="player-stats-modal" :model-value="open" width="680px" :show-close="false" :close-on-click-modal="true" @update:model-value="updateVisibility">
    <template #header>
      <header class="modal-title player-stats-title">
        <div>
          <span class="kicker">人物属性</span>
          <h2>{{ player.name }} <small>{{ realm?.label }} 第{{ player.realmLevel }}重</small></h2>
        </div>
        <div class="player-power"><small>战力</small><b>{{ power.toLocaleString() }}</b></div>
        <el-button text circle aria-label="关闭人物属性" @click="emit('close')"><X :size="17" /></el-button>
      </header>
    </template>

    <section class="attribute-section">
      <h3>基础属性</h3>
      <dl class="attribute-grid basic-attribute-grid">
        <div v-for="row in basicStats" :key="row.key"><dt>{{ row.label }}</dt><dd>{{ valueFor(row) }}</dd></div>
      </dl>
    </section>

    <section class="attribute-section">
      <h3>战斗属性</h3>
      <dl class="attribute-grid">
        <div v-for="row in battleStats" :key="row.key"><dt>{{ row.label }}</dt><dd>{{ valueFor(row) }}</dd></div>
      </dl>
    </section>

    <section class="attribute-section">
      <h3>高级属性</h3>
      <dl v-if="visibleAdvancedStats.length" class="attribute-grid">
        <div v-for="row in visibleAdvancedStats" :key="row.key"><dt>{{ row.label }}</dt><dd>{{ valueFor(row) }}</dd></div>
      </dl>
      <p v-else class="empty-attribute-state">暂未获得高级属性</p>
    </section>

    <section class="attribute-section attribute-source-section">
      <h3>属性来源</h3>
      <ul class="attribute-sources">
        <li v-for="source in statSources" :key="source.name"><b>{{ source.name }}</b><span>{{ sourceSummary(source.bonuses, source.base) }}</span></li>
      </ul>
    </section>
  </el-dialog>
</template>
