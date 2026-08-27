<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Beaker, BookOpen, ChevronRight, Flame, Hammer, LockKeyhole, Sparkles, Swords, Trophy } from '@lucide/vue'
import { DUNGEONS } from '../data'
import { formatCompactIntegerNumber, getCombatPower, getDungeonEnemies, getDungeonHighestCleared, getDungeonStamina, getDungeonStaminaCap, getDungeonStaminaCost, getDungeonStaminaRecoveryRemainingMs } from '../domain/game'
import type { DungeonConfig, GameState } from '../domain/types'

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{ battle: [dungeonId: string, layer: number]; sweep: [dungeonId: string, layer: number] }>()
const selectedId = ref(DUNGEONS[0]?.id ?? '')
const showDropDetails = ref(false)
const now = ref(Date.now())
let timer: ReturnType<typeof window.setInterval> | undefined
const selectedDungeon = computed<DungeonConfig>(() => DUNGEONS.find((dungeon) => dungeon.id === selectedId.value) ?? DUNGEONS[0]!)
const staminaCap = computed(() => getDungeonStaminaCap(props.game.player.realmId))
const stamina = computed(() => getDungeonStamina(props.game.dungeons, props.game.player.realmId, now.value))
const recoveryRemaining = computed(() => getDungeonStaminaRecoveryRemainingMs(props.game.dungeons, props.game.player.realmId, now.value))
const recoveryLabel = computed(() => {
  if (!recoveryRemaining.value) return '体力已满'
  const seconds = Math.ceil(recoveryRemaining.value / 1000)
  return `${Math.floor(seconds / 60)}分${String(seconds % 60).padStart(2, '0')}秒后恢复`
})
const staminaPercent = computed(() => Math.min(100, Math.round(stamina.value / staminaCap.value * 100)))
const highestCleared = computed(() => getDungeonHighestCleared(props.game.dungeons, selectedDungeon.value.id))

function layerState(layer: number): 'cleared' | 'next' | 'locked' {
  if (layer <= highestCleared.value) return 'cleared'
  if (layer === highestCleared.value + 1) return 'next'
  return 'locked'
}
function layerPower(layer: number): number { return getDungeonEnemies(selectedDungeon.value.id, layer).reduce((total, enemy) => total + getCombatPower(enemy.stats), 0) }
function canChallenge(layer: number): boolean { return layerState(layer) !== 'locked' && stamina.value >= getDungeonStaminaCost(selectedDungeon.value.id, layer) }
function dropSummary(dungeon: DungeonConfig): string {
  const names = new Set<string>()
  for (const layer of dungeon.layers) for (const drop of layer.drops) {
    if (drop.kind === 'item') names.add(drop.itemId.startsWith('pill-') ? '丹药与宝石' : '养成道具')
    if (drop.kind === 'equipment') names.add('装备')
    if (drop.kind === 'martial') names.add('功法')
    if (drop.kind === 'resource') names.add(drop.resource === 'forge' ? '铸材' : drop.resource === 'insight' ? '心得' : drop.resource === 'incense' ? '香火' : '银两')
  }
  return [...names].join(' · ')
}
function selectDungeon(id: string): void { selectedId.value = id; showDropDetails.value = false }
onMounted(() => { timer = window.setInterval(() => { now.value = Date.now() }, 1000) })
onBeforeUnmount(() => { if (timer !== undefined) window.clearInterval(timer) })
</script>

<template>
  <div class="dungeon-page dungeon-page-rebuilt">
    <section class="dungeon-hero dungeon-stamina-hero">
      <div class="dungeon-hero-copy"><span class="kicker">养成材料 · 体力挑战</span><h2>秘境</h2><p>每次挑战消耗体力，胜利可获得香火、丹药与各类养成材料。通关层数越深，稀有掉落越集中。</p></div>
      <div class="dungeon-stamina-card">
        <div class="dungeon-stamina-heading"><span>当前体力</span><strong>{{ stamina }}<small>/ {{ staminaCap }}</small></strong></div>
        <div class="dungeon-stamina-bar"><i :style="{ width: `${staminaPercent}%` }" /></div>
        <small class="dungeon-stamina-recovery"><Flame :size="13" />{{ recoveryLabel }} · 每5分钟恢复1点</small>
      </div>
    </section>

    <div class="dungeon-layout">
      <el-card class="panel dungeon-list-panel" shadow="never">
        <div class="section-head"><div><span class="kicker">江湖异境</span><h2>选择秘境</h2></div><Trophy :size="17" /></div>
        <button v-for="dungeon in DUNGEONS" :key="dungeon.id" class="dungeon-choice" :class="[dungeon.tone, { active: selectedId === dungeon.id }]" type="button" @click="selectDungeon(dungeon.id)">
          <span class="dungeon-choice-icon"><Swords v-if="dungeon.id === 'sword-gate'" :size="18" /><Beaker v-else-if="dungeon.id === 'bamboo-realm'" :size="18" /><BookOpen v-else :size="18" /></span>
          <span><b>{{ dungeon.name }}</b><small>{{ dungeon.description }}</small></span><ChevronRight :size="16" />
        </button>
      </el-card>

      <el-card class="panel dungeon-detail-panel" :class="selectedDungeon.tone" shadow="never">
        <div class="dungeon-detail-heading"><div><span class="kicker">{{ selectedDungeon.name }}</span><h2>逐层深入</h2><p>{{ selectedDungeon.strategy }}</p><p class="dungeon-mechanic"><strong>{{ selectedDungeon.mechanic.name }}</strong> · {{ selectedDungeon.mechanic.description }}</p></div><el-button class="dungeon-drop-summary" text type="primary" @click="showDropDetails = !showDropDetails"><Sparkles :size="15" />掉落详情</el-button></div>
        <div v-if="showDropDetails" class="dungeon-drop-details"><div><b>稳定产出</b><span>香火、{{ selectedDungeon.themeDropLabel }}，每次胜利都会获得</span></div><div><b>额外掉落</b><span>{{ dropSummary(selectedDungeon) }}</span></div><div><b>深层奖励</b><span>层数越深，高品质丹药、装备与功法权重越高</span></div><div><b>首通奖励</b><span>额外获得银两、铸材、心得与香火</span></div></div>
        <div class="dungeon-layer-grid">
          <div v-for="layer in selectedDungeon.layers" :key="layer.layer" class="dungeon-layer-card" :class="layerState(layer.layer)">
            <button class="dungeon-layer-main" type="button" :disabled="!canChallenge(layer.layer)" @click="emit('battle', selectedDungeon.id, layer.layer)">
              <span class="dungeon-layer-index"><LockKeyhole v-if="layerState(layer.layer) === 'locked'" :size="15" /><Trophy v-else-if="layerState(layer.layer) === 'cleared'" :size="15" /><b v-else>{{ layer.layer }}</b></span>
              <span class="dungeon-layer-copy"><b>{{ layer.name }}</b><small>{{ layer.enemyCount && layer.enemyCount > 1 ? `${layer.enemyCount} 名敌人` : '单人守关' }} · 战力 {{ formatCompactIntegerNumber(layerPower(layer.layer)) }}</small></span>
              <span class="dungeon-layer-action">{{ layerState(layer.layer) === 'cleared' ? '再战' : layerState(layer.layer) === 'next' ? `挑战 · ${getDungeonStaminaCost(selectedDungeon.id, layer.layer)}体力` : '未解锁' }}<ChevronRight v-if="layerState(layer.layer) !== 'locked'" :size="14" /></span>
            </button>
            <button v-if="layerState(layer.layer) === 'cleared'" class="dungeon-sweep-button" type="button" :disabled="!canChallenge(layer.layer)" @click="emit('sweep', selectedDungeon.id, layer.layer)">扫荡 · {{ getDungeonStaminaCost(selectedDungeon.id, layer.layer) }}体力</button>
          </div>
        </div>
        <footer class="dungeon-detail-footer"><span><Flame :size="14" />每次胜利稳定获得香火</span><span><Hammer :size="14" />挑战与扫荡均消耗对应体力</span><span><Sparkles :size="14" />失败也会消耗体力，但不影响已通关层数</span></footer>
      </el-card>
    </div>
  </div>
</template>
