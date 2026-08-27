<script setup lang="ts">
import { computed } from 'vue'
import { getMartialActiveSkill, getMartialAscensionRank, getMartialAscensionStatMultiplier, getMartialCombatBonuses, getMartialMastery, getMartialPassiveEffects, hasMartialWeaponAffinity } from '../domain/game'
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
const ascensionRank = computed(() => getMartialAscensionRank(props.player, props.art))
const passiveEffects = computed(() => getMartialPassiveEffects(props.player, props.art))
const activeSkill = computed(() => getMartialActiveSkill(props.player, props.art))
const affinityActive = computed(() => hasMartialWeaponAffinity(props.player, props.art))
const affinityStyles = computed(() => props.art.affinityWeaponStyles?.map((style) => weaponStyleLabels[style]).join(' / ') ?? '')
function formatDecimal(value: number): string {
  return Number(value.toFixed(2)).toString()
}

const martialStats = computed(() => {
  const stats = Object.entries(getMartialCombatBonuses(props.player, props.art) ?? {}).flatMap(([key, value]) => {
    if (typeof value !== 'number') return []
    const label = statLabels[key as keyof CombatStats]
    if (!label) return []
    const percentage = !['maxHealth', 'attack', 'defense', 'speed'].includes(key)
    return [{ label, value: `${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}` }]
  })
  const { innerForceRateBase, innerForceRatePerMastery, innerForceRateMultiplierBase, innerForceRateMultiplierPerMastery } = props.art
  const ascensionMultiplier = getMartialAscensionStatMultiplier(props.player, props.art)
  if (innerForceRateBase !== undefined && innerForceRatePerMastery !== undefined) {
    stats.push({ label: '吐纳速度', value: `+${formatDecimal((innerForceRateBase + mastery.value * innerForceRatePerMastery) * ascensionMultiplier)} / 秒` })
  }
  if (innerForceRateMultiplierBase !== undefined && innerForceRateMultiplierPerMastery !== undefined) {
    stats.push({ label: '吐纳倍率', value: `+${formatDecimal((innerForceRateMultiplierBase + mastery.value * innerForceRateMultiplierPerMastery) * ascensionMultiplier * 100)}%` })
  }
  return stats
})

const activeSkillEffectDescription = computed(() => {
  const skill = activeSkill.value
  if (!skill) return ''
  const effects = [`攻击造成 ${formatDecimal(skill.damageMultiplier * 100)}% 攻击伤害`]
  if (skill.bonusCritRate !== undefined) effects.push(`额外获得 ${formatDecimal(skill.bonusCritRate)}% 暴击率`)
  if (skill.defensePierceRate !== undefined) effects.push(`无视目标 ${formatDecimal(skill.defensePierceRate)}% 防御`)
  if (skill.guaranteedHit) effects.push('攻击必定命中')
  if (skill.stunRate !== undefined) effects.push(`命中后有 ${formatDecimal(skill.stunRate)}% 概率使目标眩晕`)
  if (skill.grantDodge !== undefined) effects.push('命中后使你下一次受到的攻击必定闪避')
  return `${effects.join('，')}。`
})
</script>

<template>
  <section class="equipment-tooltip">
    <header><div><small>{{ art.category }}</small><b>{{ art.name }}</b></div><el-tag size="small" class="quality-tag" :class="art.gradeTone">{{ art.grade }}</el-tag></header>
    <div class="tooltip-copy tooltip-lore"><small>背景</small><p>{{ art.keyword }} · {{ art.lore }}</p></div>
    <section v-if="activeSkill" class="martial-active-skill">
      <header><div><small>主动效果 · 外功</small><b>{{ activeSkill.name }}</b></div></header>
      <p class="martial-active-effect-copy">{{ activeSkillEffectDescription }}</p>
    </section>
    <p v-if="art.affinityWeaponStyles?.length" class="martial-affinity"><span>兵器契合：{{ affinityStyles }}</span><b :class="{ active: affinityActive }">{{ affinityActive ? '当前已契合' : '当前未契合' }}</b></p>
    <p v-if="art.affinityWeaponStyles?.length">契合时，外功伤害 x1.18；数值型招式效果 x1.25</p>
    <div v-if="passiveEffects.length" class="tooltip-copy tooltip-effect"><small>被动效果</small><p>{{ passiveEffects.map((effect) => effect.description).join(' · ') }}</p></div>
    <div v-if="art.ascension" class="martial-ascension-line"><span>升阶</span><b>{{ ascensionRank }} / {{ art.ascension.maxRank }}</b></div>
    <div v-if="martialStats.length" class="tooltip-section-label">属性效果</div>
    <dl v-if="martialStats.length"><div v-for="stat in martialStats" :key="stat.label"><dt>{{ stat.label }}</dt><dd>{{ stat.value }}</dd></div></dl>
  </section>
</template>
