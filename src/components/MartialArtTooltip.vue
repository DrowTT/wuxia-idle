<script setup lang="ts">
import { computed } from 'vue'
import { getMartialMastery, hasMartialWeaponAffinity } from '../domain/game'
import type { CombatStats, GameState, MartialArt, WeaponStyle } from '../domain/types'

const props = defineProps<{
  art: MartialArt
  player: GameState['player']
}>()

const statLabels: Partial<Record<keyof CombatStats, string>> = {
  maxHealth: '生命', attack: '攻击', defense: '防御', speed: '速度', hitRate: '命中', dodgeRate: '闪避',
  critRate: '暴击', critDamage: '暴伤', comboRate: '连击', counterRate: '反击', stunRate: '眩晕', lifestealRate: '吸血',
  critResist: '暴抗', comboResist: '连抗', counterResist: '反抗', stunResist: '晕抗', lifestealResist: '吸抗',
  healingBonus: '治疗', critDamageReduction: '暴伤减免', damageBonus: '伤害加成', damageReduction: '伤害减免',
}

const weaponStyleLabels: Record<WeaponStyle, string> = {
  sword: '长剑', saber: '刀', spear: '枪戟', staff: '棍', fist: '拳套',
}

const mastery = computed(() => getMartialMastery(props.player, props.art.id))
const affinityActive = computed(() => hasMartialWeaponAffinity(props.player, props.art))
const affinityStyles = computed(() => props.art.affinityWeaponStyles?.map((style) => weaponStyleLabels[style]).join(' / ') ?? '')
const gradeTagType = computed<'success' | 'primary' | 'info'>(() => {
  if (props.art.gradeTone === 'green') return 'success'
  if (props.art.gradeTone === 'blue') return 'primary'
  return 'info'
})

function formatDecimal(value: number): string {
  return Number(value.toFixed(2)).toString()
}

const martialStats = computed(() => {
  const stats = Object.entries(props.art.combatBonuses ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const label = statLabels[key as keyof CombatStats]
    if (!label) return []
    const percentage = !['maxHealth', 'attack', 'defense', 'speed'].includes(key)
    return [{ label, value: `${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}` }]
  })
  const { innerForceRateBase, innerForceRatePerMastery, innerForceRateMultiplierBase, innerForceRateMultiplierPerMastery } = props.art
  if (innerForceRateBase !== undefined && innerForceRatePerMastery !== undefined) {
    stats.push({ label: '吐纳速度', value: `+${formatDecimal(innerForceRateBase + mastery.value * innerForceRatePerMastery)} / 秒` })
  }
  if (innerForceRateMultiplierBase !== undefined && innerForceRateMultiplierPerMastery !== undefined) {
    stats.push({ label: '吐纳倍率', value: `+${formatDecimal((innerForceRateMultiplierBase + mastery.value * innerForceRateMultiplierPerMastery) * 100)}%` })
  }
  return stats
})
</script>

<template>
  <section class="equipment-tooltip">
    <header><div><small>{{ art.category }}</small><b>{{ art.name }}</b></div><el-tag size="small" :type="gradeTagType">{{ art.grade }}</el-tag></header>
    <p>{{ art.keyword }} · {{ art.description }}</p>
    <p v-if="art.activeSkill"><b>{{ art.activeSkill.name }}</b>：{{ art.activeSkill.description }}</p>
    <p v-if="art.affinityWeaponStyles?.length" class="martial-affinity"><span>兵器契合：{{ affinityStyles }}</span><b :class="{ active: affinityActive }">{{ affinityActive ? '当前已契合' : '当前未契合' }}</b></p>
    <p v-if="art.affinityWeaponStyles?.length">契合时，外功伤害 x1.18；数值型招式效果 x1.25</p>
    <p v-if="art.passiveEffects?.length"><b>内功特效</b>：{{ art.passiveEffects.map((effect) => effect.description).join(' · ') }}</p>
    <dl><div v-for="stat in martialStats" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
  </section>
</template>
