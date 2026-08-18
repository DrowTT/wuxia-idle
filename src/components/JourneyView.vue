<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronRight, Play, Repeat2, Swords, Trophy, Zap } from '@lucide/vue'
import { formatIntegerNumber, getCombatPower, getCurrentMainStage, getVisibleMainChapters, hasClearedMainStage } from '../domain/game'
import type { CombatStats, GameState, MainStage } from '../domain/types'

const props = defineProps<{ game: GameState; playerPower: number; playerStats: CombatStats; autoBattleActive: boolean }>()
const emit = defineEmits<{ 'battle-main': [stage?: MainStage]; 'start-battle-main': []; 'toggle-auto-battle': [] }>()

const currentStage = computed(() => getCurrentMainStage(props.game.journey))
const visibleChapters = computed(() => getVisibleMainChapters(props.game.journey))
const selectedChapter = ref(props.game.journey.currentChapter)
const selectedChapterData = computed(() => {
  const chapters = visibleChapters.value
  return chapters.find((chapter) => chapter.chapter === selectedChapter.value) ?? chapters[chapters.length - 1]
})
const currentEnemyPower = computed(() => currentStage.value?.enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0) ?? 0)
const progressLabel = computed(() => {
  if (props.game.journey.completed) return '百章已尽'
  return `第 ${props.game.journey.currentChapter} 章 · 第 ${props.game.journey.currentStage} 关`
})

watch(
  () => props.game.journey.currentChapter,
  (chapter) => {
    selectedChapter.value = chapter
  },
)

function isCleared(stage: MainStage): boolean {
  return hasClearedMainStage(props.game.journey, stage)
}

function enemySummary(stage: MainStage): string {
  const names = stage.enemies.map((enemy) => enemy.name).join('、')
  return stage.enemies.length > 1 ? `${names} · 敌方 ${stage.enemies.length} 人` : names
}

function enemyStatSummary(stage: MainStage): string {
  return stage.enemies.map((enemy) => `${enemy.name}：生命 ${formatIntegerNumber(enemy.stats.maxHealth)} · 攻击 ${enemy.stats.attack} · 防御 ${enemy.stats.defense} · 速度 ${enemy.stats.speed}`).join('；')
}
</script>

<template>
  <div class="page-grid journey-page">
    <div class="page-main-column">
      <el-card class="panel journey-hero" shadow="never">
        <div>
          <span class="kicker">主线闯关</span>
          <h1>{{ progressLabel }}</h1>
          <p>{{ currentStage ? '战力只作概览，胜负取决于属性与构筑。' : '江湖路已走到尽头。' }}</p>
        </div>
        <div class="power-readout">
          <small>当前战力</small>
          <strong>{{ playerPower.toLocaleString() }}</strong>
          <span><Zap :size="13" />{{ currentStage ? '前路未尽' : '主线完成' }}</span>
        </div>
      </el-card>

      <el-card class="panel stage-panel" shadow="never">
        <div class="section-head">
          <div>
            <span class="kicker">主线关卡</span>
            <h2>行走江湖</h2>
          </div>
          <el-select v-model="selectedChapter" class="chapter-select" aria-label="选择章节">
            <el-option
              v-for="chapter in visibleChapters"
              :key="chapter.chapter"
              :label="`第 ${chapter.chapter} 章`"
              :value="chapter.chapter"
            />
          </el-select>
        </div>

        <section v-if="selectedChapterData" class="chapter-stage-group">
          <header class="chapter-stage-heading">
            <h3>第 {{ selectedChapterData.chapter }} 章</h3>
            <span>{{ selectedChapterData.stages.every(isCleared) ? '已通关' : '进行中' }}</span>
          </header>
          <div class="stage-list">
            <button
              v-for="stage in selectedChapterData.stages"
              :key="stage.ordinal"
              class="stage-row"
              :class="{ cleared: isCleared(stage), current: !isCleared(stage) }"
              type="button"
              @click="emit('battle-main', stage)"
            >
              <span class="stage-number">{{ String(stage.stage).padStart(2, '0') }}</span>
              <span class="stage-copy">
                <b>第 {{ stage.stage }} 关 <el-tag v-if="stage.isElite" class="elite-stage-tag" size="small" type="danger" effect="plain">精英</el-tag></b>
                <small>{{ enemySummary(stage) }}</small>
              </span>
              <span class="stage-action">
                <template v-if="isCleared(stage)"><Check :size="15" />再战 <ChevronRight :size="15" /></template>
                <template v-else>挑战 <ChevronRight :size="15" /></template>
              </span>
            </button>
          </div>
        </section>

        <el-button class="full journey-battle-button" type="primary" :disabled="!currentStage" @click="emit('battle-main')">
          <Swords :size="15" />{{ currentStage ? '挑战当前关卡' : '主线已完成' }}
        </el-button>
      </el-card>
    </div>

    <aside class="page-side-column">
      <el-card class="panel current-stage-panel" shadow="never">
        <header class="current-stage-heading">
          <div><span class="kicker">当前关卡</span><h2>{{ currentStage ? `第 ${currentStage.chapter} 章 · 第 ${currentStage.stage} 关` : '主线已完成' }}</h2></div>
          <Trophy v-if="currentStage?.isElite" :size="16" class="current-stage-trophy" />
        </header>
        <template v-if="currentStage">
          <div class="current-stage-enemy">
            <small>对手</small>
            <strong>{{ enemySummary(currentStage) }}</strong>
            <span v-if="currentStage.isElite">精英关卡 · 首通奖励更高</span>
          </div>
          <div class="current-stage-power">
            <div><small>我方战力</small><b>{{ playerPower.toLocaleString() }}</b></div>
            <span>VS</span>
            <div><small>敌方战力</small><b>{{ currentEnemyPower.toLocaleString() }}</b></div>
          </div>
          <div class="current-stage-stats">
            <section>
              <small>我方属性</small>
              <p>生命 {{ formatIntegerNumber(playerStats.maxHealth) }} · 攻击 {{ playerStats.attack }}</p>
              <p>防御 {{ playerStats.defense }} · 速度 {{ playerStats.speed }}</p>
            </section>
            <section>
              <small>敌方属性</small>
              <p>{{ enemyStatSummary(currentStage) }}</p>
            </section>
          </div>
          <div class="current-stage-actions">
            <el-button class="current-stage-button" type="primary" @click="emit('start-battle-main')"><Play :size="15" />直接挑战</el-button>
            <el-button class="current-stage-button" :type="autoBattleActive ? 'danger' : 'default'" @click="emit('toggle-auto-battle')">
              <Repeat2 :size="15" />{{ autoBattleActive ? '停止自动战斗' : '自动战斗' }}
            </el-button>
          </div>
        </template>
        <p v-else class="current-stage-complete">百章主线已全部通关。</p>
      </el-card>
      <el-card class="panel quote-panel" shadow="never"><span>“</span><p>江湖不是一条路。<br />是你每次拔剑时，选择站在哪一边。</p><small>— 旧日手札</small></el-card>
    </aside>
  </div>
</template>
