<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BookOpen, Coins, Info, Sparkles, Swords, Trophy } from '@lucide/vue'
import {
  LOTTERY_DRAW_COUNTS,
  LOTTERY_GRADE_NAMES,
  LOTTERY_GRADE_RATES,
  LOTTERY_POOL_META,
  getLotteryCost,
} from '../domain/game'
import type { GameState, LotteryDrawCount, LotteryDrawResult, LotteryPoolId, LotteryReward } from '../domain/types'

const props = defineProps<{ game: GameState; drawResult: LotteryDrawResult | null }>()
const emit = defineEmits<{
  draw: [pool: LotteryPoolId, count: LotteryDrawCount]
}>()

const activePool = ref<LotteryPoolId>('equipment')
const probabilityVisible = ref(false)
const isDrawing = ref(false)
const drawingPool = ref<LotteryPoolId | null>(null)
const drawingCount = ref<LotteryDrawCount | null>(null)
const drawingResult = ref<LotteryDrawResult | null>(null)
const revealedCards = ref<Set<number>>(new Set())
const activeMeta = computed(() => LOTTERY_POOL_META[activePool.value])
const drawingCards = computed<Array<LotteryReward | null>>(() => {
  const rewards = drawingResult.value?.rewards
  if (rewards?.length) return rewards
  return Array.from({ length: drawingCount.value === 10 ? 10 : 1 }, () => null)
})
const canRepeatDraw = computed(() => {
  const count = drawingCount.value
  return count !== null && props.game.player.langyu >= getLotteryCost(count)
})

watch(() => props.drawResult, (result) => {
  if (isDrawing.value && result) {
    drawingResult.value = result
  }
})

function rewardLabel(reward: LotteryReward): string {
  if (reward.kind === 'forge' || reward.kind === 'insight' || reward.kind === 'item') return `${reward.name} +${reward.quantity}`
  return reward.name
}

function rewardTypeLabel(reward: LotteryReward): string {
  if (reward.kind === 'forge' || reward.kind === 'insight') return '材料'
  if (reward.kind === 'item') return '道具'
  return reward.pool === 'equipment' ? '装备' : '功法'
}

function selectPool(pool: string): void {
  if (isDrawing.value) return
  activePool.value = pool as LotteryPoolId
}

function startDrawing(pool: LotteryPoolId, count: LotteryDrawCount): void {
  activePool.value = pool
  probabilityVisible.value = false
  drawingPool.value = pool
  drawingCount.value = count
  drawingResult.value = null
  revealedCards.value = new Set()
  isDrawing.value = true

  // Resolve the draw before the reveal starts. The card layer is presentation
  // only, so closing it cannot leave a half-committed lottery result.
  emit('draw', pool, count)
}

function requestDraw(pool: LotteryPoolId, count: LotteryDrawCount): void {
  if (isDrawing.value || props.game.player.langyu < getLotteryCost(count)) return
  startDrawing(pool, count)
}

const allCardsRevealed = computed(() => drawingCards.value.length > 0 && revealedCards.value.size >= drawingCards.value.length)

function revealCard(index: number): void {
  if (!isDrawing.value || revealedCards.value.has(index)) return
  const next = new Set(revealedCards.value)
  next.add(index)
  revealedCards.value = next
}

function revealAllCards(): void {
  if (!isDrawing.value) return
  revealedCards.value = new Set(drawingCards.value.map((_, index) => index))
}

function closeDrawing(): void {
  isDrawing.value = false
  drawingPool.value = null
  drawingCount.value = null
  drawingResult.value = null
  revealedCards.value = new Set()
}

function repeatDraw(): void {
  const pool = drawingPool.value
  const count = drawingCount.value
  if (!pool || count === null || !canRepeatDraw.value) return
  startDrawing(pool, count)
}
</script>

<template>
  <div class="lottery-page">
    <section class="lottery-hero">
      <div>
        <h2>开匣得器，阅卷悟招</h2>
        <p>琅玉可开启兵器匣与功法卷，各奖池独立结算。</p>
      </div>
      <div class="lottery-ticket-balance"><Coins :size="19" /><span>琅玉</span><strong>{{ game.player.langyu.toLocaleString('zh-CN') }}</strong></div>
    </section>

    <div class="lottery-layout">
      <section class="panel lottery-draw-panel" aria-label="抽奖奖池">
        <el-tabs :model-value="activePool" class="lottery-pool-tabs" @tab-change="selectPool">
          <el-tab-pane name="equipment" :disabled="isDrawing">
            <template #label><Swords :size="15" />兵器匣</template>
          </el-tab-pane>
          <el-tab-pane name="martial" :disabled="isDrawing">
            <template #label><BookOpen :size="15" />功法卷</template>
          </el-tab-pane>
        </el-tabs>

        <div class="lottery-pool-intro" :class="activePool">
          <span class="lottery-pool-glyph"><Swords v-if="activePool === 'equipment'" :size="28" /><BookOpen v-else :size="28" /></span>
          <div><small>{{ activeMeta.shortDescription }}</small><h2>{{ activeMeta.label }}</h2><p>{{ activeMeta.description }}</p></div>
        </div>

        <div class="lottery-draw-actions">
          <el-button v-for="count in LOTTERY_DRAW_COUNTS" :key="count" class="lottery-draw-button" :class="{ featured: count === 10 }" :disabled="isDrawing || game.player.langyu < getLotteryCost(count)" @click="requestDraw(activePool, count)">
            <span>{{ count === 1 ? '一抽' : `${count}抽` }}</span><small>{{ getLotteryCost(count) }} 琅玉</small>
          </el-button>
        </div>

        <div class="lottery-probability-trigger">
          <div><small>奖池说明</small><span>品质概率与奖池规则</span></div>
          <el-button text type="primary" @click="probabilityVisible = true"><Info :size="15" />概率详情</el-button>
        </div>
      </section>

      <aside class="lottery-side-column">
        <section class="panel lottery-history-panel">
          <header><div><span class="kicker">近期所得</span><h2>寻珍记录</h2></div><Sparkles :size="17" /></header>
          <div v-if="game.lottery.history.length" class="lottery-history-list">
            <div v-for="reward in game.lottery.history.slice(0, 6)" :key="reward.id" class="lottery-history-row">
              <span :class="['lottery-history-glyph', reward.gradeTone]"><Swords v-if="reward.pool === 'equipment'" :size="13" /><BookOpen v-else :size="13" /></span>
              <span><b>{{ rewardLabel(reward) }}</b><small>{{ rewardTypeLabel(reward) }}</small></span>
              <i :class="reward.gradeTone">{{ reward.grade }}</i>
            </div>
          </div>
          <div v-else class="lottery-empty-history"><Trophy :size="17" /><span>尚未寻得新物</span></div>
        </section>
      </aside>
    </div>

    <div v-if="isDrawing" class="lottery-drawing-overlay" role="dialog" aria-modal="true" aria-live="polite" aria-label="抽卡揭示中">
      <div class="lottery-drawing-stage" :class="{ 'is-ten': drawingCount === 10, martial: drawingPool === 'martial' }">
        <div class="lottery-drawing-heading">
          <small class="lottery-drawing-kicker">{{ drawingCount === 10 ? '十连寻珍' : '寻珍启匣' }}</small>
          <h2>{{ drawingPool === 'equipment' ? '兵器匣已开启' : '功法卷已展开' }}</h2>
          <p>{{ drawingCount === 10 ? '灵签正在逐一揭示' : '灵签正在揭示' }}</p>
        </div>
        <div class="lottery-reveal-cards" :class="{ single: drawingCount === 1 }">
          <button v-for="(reward, index) in drawingCards" :key="reward?.id ?? `pending-${index}`" type="button" class="lottery-reveal-card" :class="[reward?.gradeTone ?? 'pending', { 'is-revealed': revealedCards.has(index) }]" :disabled="revealedCards.has(index)" :aria-label="revealedCards.has(index) ? `${reward?.name ?? '奖励'}已揭示` : '点击揭示奖励'" @click="revealCard(index)">
            <div class="lottery-reveal-card-inner">
              <div class="lottery-reveal-card-face lottery-reveal-card-back" aria-hidden="true">
                <span class="lottery-reveal-card-seal"><Swords v-if="drawingPool === 'equipment'" :size="22" /><BookOpen v-else :size="22" /></span>
                <b class="lottery-reveal-card-grade">{{ reward?.grade ?? '品质判定中' }}</b>
                <small>点击揭示</small>
              </div>
              <div class="lottery-reveal-card-face lottery-reveal-card-front">
                <span class="lottery-reveal-card-glyph"><Swords v-if="reward?.pool === 'equipment'" :size="20" /><BookOpen v-else :size="20" /></span>
                <b>{{ reward ? rewardLabel(reward) : '灵光凝聚中' }}</b>
                <small>{{ reward ? `${reward.grade} · ${rewardTypeLabel(reward)}` : '揭示中' }}</small>
              </div>
            </div>
          </button>
        </div>
        <div class="lottery-drawing-status">已揭示 {{ revealedCards.size }} / {{ drawingCards.length }}</div>
        <div class="lottery-drawing-actions">
          <el-button v-if="allCardsRevealed" @click="closeDrawing">收下</el-button>
          <el-button v-if="!allCardsRevealed" type="primary" @click="revealAllCards">全部打开</el-button>
          <el-button v-else type="primary" :disabled="!canRepeatDraw" @click="repeatDraw">再来{{ drawingCount ?? 1 }}抽</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="probabilityVisible" class="lottery-probability-dialog" width="min(560px, calc(100vw - 32px))" align-center :show-close="false">
      <template #header>
        <div class="lottery-probability-title"><span class="lottery-probability-emblem"><Info :size="18" /></span><div><small>{{ activeMeta.label }} · 奖池规则</small><h2>概率详情</h2></div></div>
      </template>
      <div class="lottery-probability-body">
        <p class="lottery-probability-caption">兵器匣与功法卷共用以下品质概率。</p>
        <div class="lottery-probability-grid"><span v-for="(rate, tone) in LOTTERY_GRADE_RATES" :key="tone" class="lottery-rate" :class="tone"><i>{{ LOTTERY_GRADE_NAMES[tone] }}</i><b>{{ rate }}%</b></span></div>
        <div class="lottery-detail-list">
          <div><b>传说档位</b><span>{{ activePool === 'martial' ? '传说功法之外，有机会获得心法残印。' : '传说装备之外，有机会获得名器残印。' }}</span></div>
          <div><b>保底机制</b><span>本奖池设有保底机制。</span></div>
        </div>
      </div>
      <template #footer><el-button type="primary" @click="probabilityVisible = false">知道了</el-button></template>
    </el-dialog>
  </div>
</template>
