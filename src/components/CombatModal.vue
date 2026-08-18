<script setup lang="ts">
import { computed } from 'vue'
import { Award, Coins, Gem, Hammer, Play, Sparkles, Swords, X } from '@lucide/vue'
import type { BattleReward, CombatAction, CombatStats, CombatTarget, Encounter, PlayerState } from '../domain/types'

const props = defineProps<{
  open: boolean
  encounter: Encounter | null
  action: CombatAction | null
  reward: BattleReward | null
  target: CombatTarget
  player: PlayerState
  playerPower: number
  playerStats: CombatStats
  autoBattle: boolean
}>()
const emit = defineEmits<{ close: []; start: [] }>()

const activePlayerStats = computed(() => props.encounter?.playerStats ?? props.playerStats)
const activeEnemies = computed(() => {
  if (props.encounter) return props.encounter.enemies
  return props.target.enemies.map((enemy) => ({ ...enemy, hp: enemy.stats.maxHealth, maxHealth: enemy.stats.maxHealth }))
})
const playerHp = computed(() => props.encounter?.playerHp ?? activePlayerStats.value.maxHealth)
const enemyCountLabel = computed(() => activeEnemies.value.length > 1 ? `敌方 ${activeEnemies.value.length} 人` : '敌方 1 人')
const playerSkillAction = computed(() => {
  const action = props.action
  if (!action?.skill || action.attacker.side !== 'player') return null
  return { sequence: action.sequence, name: action.skill.name }
})

function updateVisibility(visible: boolean): void {
  if (!visible) emit('close')
}

function healthPercentage(current: number, max: number): number {
  return max > 0 ? Math.round((current / max) * 100) : 0
}

function combatStatusLabel(encounter: Encounter): string {
  if (encounter.status === 'fighting') return '战斗进行中'
  if (encounter.status === 'won') return '胜利'
  if (encounter.status === 'lost') return '败北'
  return '平局'
}

function matchesActionTarget(target: 'player' | string, actor: CombatAction['attacker']): boolean {
  return target === 'player' ? actor.side === 'player' : actor.side === 'enemy' && actor.enemyId === target
}

function animationClass(target: 'player' | string): Record<string, boolean> {
  const action = props.action
  if (!action) return {}
  return {
    'is-attacking': action.outcome !== 'stunned' && matchesActionTarget(target, action.attacker),
    'is-hit': action.outcome === 'hit' && matchesActionTarget(target, action.defender),
    'is-dodging': action.outcome === 'dodge' && matchesActionTarget(target, action.defender),
    'is-stunned': action.outcome === 'stunned' && matchesActionTarget(target, action.attacker),
  }
}

function animationKey(target: 'player' | string): string {
  const action = props.action
  if (!action || (!matchesActionTarget(target, action.attacker) && !matchesActionTarget(target, action.defender))) return target
  return `${target}-${action.sequence}`
}

function feedbackText(target: 'player' | string): string {
  const action = props.action
  if (!action || !matchesActionTarget(target, action.defender)) return ''
  if (action.outcome === 'dodge') return '闪避'
  if (action.outcome === 'hit') return `-${action.damage}`
  return ''
}
</script>

<template>
  <el-dialog class="combat-modal" :model-value="open" width="720px" :show-close="false" :close-on-click-modal="true" @update:model-value="updateVisibility">
    <template #header>
      <header class="modal-title">
        <div>
          <span class="kicker">{{ autoBattle ? '自动闯关' : '战斗' }}</span>
          <h2>{{ encounter ? (encounter.status === 'fighting' ? '交手正酣' : encounter.status === 'won' ? '胜利' : encounter.status === 'lost' ? '败北' : '暂且罢手') : '准备出招' }}</h2>
        </div>
        <el-button text circle aria-label="关闭战斗窗口" @click="emit('close')"><X :size="17" /></el-button>
      </header>
    </template>

    <template v-if="!encounter">
      <div class="battle-setup">
        <div><small>你的战力</small><b>{{ playerPower.toLocaleString() }}</b></div>
        <span>VS</span>
        <div><small>对手战力</small><b class="enemy-text">{{ target.power.toLocaleString() }}</b></div>
      </div>
      <div class="selected-opponent"><span>{{ target.name }}</span><strong>{{ target.isReplay ? '再战' : enemyCountLabel }}</strong></div>
      <div class="battle-stat-compare" aria-label="双方基础属性">
        <section class="player-stat-summary">
          <small>你</small>
          <span>生命 {{ activePlayerStats.maxHealth.toLocaleString() }}</span>
          <span>攻击 {{ activePlayerStats.attack }}</span>
          <span>防御 {{ activePlayerStats.defense }}</span>
          <span>速度 {{ activePlayerStats.speed }}</span>
        </section>
        <section class="enemy-stat-summary">
          <small>对手</small>
          <div v-for="enemy in activeEnemies" :key="enemy.id" class="enemy-stat-line">
            <b>{{ enemy.name }}</b>
            <span>生命 {{ enemy.maxHealth.toLocaleString() }} · 攻击 {{ enemy.stats.attack }} · 防御 {{ enemy.stats.defense }} · 速度 {{ enemy.stats.speed }}</span>
          </div>
        </section>
      </div>
      <el-button class="full" type="primary" @click="emit('start')"><Play :size="15" />{{ autoBattle ? '开始自动战斗' : '开始战斗' }}</el-button>
    </template>

    <template v-else>
      <div class="round-head">
        <span>第 {{ encounter.round || 1 }} / {{ encounter.maxRounds }} 回合</span>
        <el-tag size="small" :type="encounter.status === 'won' ? 'success' : encounter.status === 'lost' ? 'danger' : 'primary'">{{ combatStatusLabel(encounter) }}</el-tag>
      </div>
      <div class="combat-board" :class="{ 'multi-enemy': activeEnemies.length > 1 }">
        <div class="fighter player-fighter">
          <strong>{{ player.name }}</strong>
          <span class="fighter-avatar-wrap">
            <span :key="animationKey('player')" class="fighter-avatar player" :class="animationClass('player')">沈</span>
            <span v-if="playerSkillAction" :key="`skill-${playerSkillAction.sequence}`" class="combat-skill-bubble"><Swords :size="12" /><b>{{ playerSkillAction.name }}</b></span>
          </span>
          <span v-if="feedbackText('player')" :key="`feedback-${animationKey('player')}`" class="combat-feedback" :class="{ critical: action?.isCritical }">{{ feedbackText('player') }}</span>
          <div class="fighter-health progress-meter" :aria-label="`生命 ${playerHp} / ${encounter.playerMaxHealth}`"><el-progress :percentage="healthPercentage(playerHp, encounter.playerMaxHealth)" :show-text="false" :stroke-width="8" /><span class="progress-meter-value">{{ playerHp.toLocaleString() }} / {{ encounter.playerMaxHealth.toLocaleString() }}</span></div>
          <div class="fighter-rage" :aria-label="`怒气 ${encounter.playerRage} / 100`"><div class="progress-meter"><el-progress :percentage="Math.min(100, encounter.playerRage)" :show-text="false" :stroke-width="6" color="#e49a35" /><span class="progress-meter-value">{{ encounter.playerRage }} / 100</span></div></div>
        </div>
        <div class="combat-vs"><Swords :size="20" /><span>VS</span></div>
        <div class="enemy-team" :aria-label="enemyCountLabel">
          <div v-for="enemy in activeEnemies" :key="enemy.id" class="fighter enemy-fighter" :class="{ defeated: enemy.hp <= 0 }">
            <strong>{{ enemy.name }}</strong>
            <span :key="animationKey(enemy.id)" class="fighter-avatar enemy" :class="animationClass(enemy.id)">敌</span>
            <span v-if="feedbackText(enemy.id)" :key="`feedback-${animationKey(enemy.id)}`" class="combat-feedback" :class="{ critical: action?.isCritical }">{{ feedbackText(enemy.id) }}</span>
            <div class="fighter-health progress-meter" :aria-label="`生命 ${enemy.hp} / ${enemy.maxHealth}`"><el-progress class="enemy-hp" :percentage="healthPercentage(enemy.hp, enemy.maxHealth)" :show-text="false" :stroke-width="8" /><span class="progress-meter-value">{{ enemy.hp.toLocaleString() }} / {{ enemy.maxHealth.toLocaleString() }}</span></div>
          </div>
        </div>
      </div>
      <section v-if="encounter.status === 'won' && reward" class="battle-reward" aria-label="本次战果">
        <header>
          <strong>本次战果</strong>
          <span>{{ target.isReplay ? '再战奖励' : '首通奖励' }}</span>
        </header>
        <div class="battle-reward-list">
          <span v-if="reward.silver"><Coins :size="15" /><b>+{{ reward.silver }}</b><small>银两</small></span>
          <span v-if="reward.langyu"><Gem :size="15" /><b>+{{ reward.langyu }}</b><small>琅玉</small></span>
          <span v-if="reward.forge"><Hammer :size="15" /><b>+{{ reward.forge }}</b><small>铸材</small></span>
          <span v-if="reward.insight"><Sparkles :size="15" /><b>+{{ reward.insight }}</b><small>心得</small></span>
          <span v-if="reward.fame"><Award :size="15" /><b>+{{ reward.fame }}</b><small>江湖声名</small></span>
        </div>
        <p v-if="reward.eliteBonus"><Sparkles :size="13" />精英额外掉落</p>
      </section>
      <div class="combat-log"><p v-for="(line, index) in encounter.logs" :key="`${line}-${index}`">{{ line }}</p></div>
      <el-button v-if="encounter.status !== 'fighting' && !autoBattle" class="full" type="primary" @click="emit('close')">收下战果</el-button>
    </template>
  </el-dialog>
</template>
