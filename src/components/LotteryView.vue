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
  compose: [equipmentId: string]
}>()

const activePool = ref<LotteryPoolId>('equipment')
const resultVisible = ref(false)
const probabilityVisible = ref(false)
const activeMeta = computed(() => LOTTERY_POOL_META[activePool.value])

watch(() => props.drawResult?.id, (id, previous) => {
  if (id && id !== previous) resultVisible.value = true
})

function rewardLabel(reward: LotteryReward): string {
  if (reward.kind === 'fragment') return `${reward.name} x${reward.quantity}`
  if (reward.kind === 'forge' || reward.kind === 'insight') return `${reward.name} +${reward.quantity}`
  return reward.name
}

function rewardTypeLabel(reward: LotteryReward): string {
  if (reward.kind === 'fragment') return '装备碎片'
  if (reward.kind === 'forge') return '重复转化'
  if (reward.kind === 'insight') return '重复转化'
  return reward.pool === 'equipment' ? '装备' : '功法'
}

function selectPool(pool: string): void {
  activePool.value = pool as LotteryPoolId
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
          <el-tab-pane name="equipment">
            <template #label><Swords :size="15" />兵器匣</template>
          </el-tab-pane>
          <el-tab-pane name="martial">
            <template #label><BookOpen :size="15" />功法卷</template>
          </el-tab-pane>
        </el-tabs>

        <div class="lottery-pool-intro" :class="activePool">
          <span class="lottery-pool-glyph"><Swords v-if="activePool === 'equipment'" :size="28" /><BookOpen v-else :size="28" /></span>
          <div><small>{{ activeMeta.shortDescription }}</small><h2>{{ activeMeta.label }}</h2><p>{{ activeMeta.description }}</p></div>
        </div>

        <div class="lottery-draw-actions">
          <el-button v-for="count in LOTTERY_DRAW_COUNTS" :key="count" class="lottery-draw-button" :class="{ featured: count === 10 }" :disabled="game.player.langyu < getLotteryCost(count)" @click="emit('draw', activePool, count)">
            <span>{{ count === 1 ? '一抽' : `${count}抽` }}</span><small>{{ getLotteryCost(count) }} 琅玉</small>
          </el-button>
        </div>

        <div class="lottery-probability-trigger">
          <div><small>奖池说明</small><span>品质概率与碎片说明</span></div>
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

    <el-dialog v-model="resultVisible" class="lottery-result-dialog" width="min(680px, calc(100vw - 32px))" align-center :show-close="false">
      <template #header>
        <div class="lottery-result-title"><span class="lottery-result-emblem"><Sparkles :size="19" /></span><div><small>{{ drawResult?.count }} 抽结算 · 消耗 {{ drawResult?.cost }} 琅玉</small><h2>{{ drawResult?.pool === 'equipment' ? '兵器匣已开启' : '功法卷已阅尽' }}</h2></div></div>
      </template>
      <div class="lottery-result-grid" :class="{ single: drawResult?.rewards.length === 1 }">
        <div v-for="reward in drawResult?.rewards" :key="reward.id" class="lottery-result-item" :class="reward.gradeTone">
          <span class="lottery-result-glyph"><Swords v-if="reward.pool === 'equipment'" :size="20" /><BookOpen v-else :size="20" /></span>
          <b>{{ rewardLabel(reward) }}</b>
          <small>{{ rewardTypeLabel(reward) }}</small>
        </div>
      </div>
      <template #footer><el-button type="primary" @click="resultVisible = false">收下</el-button></template>
    </el-dialog>

    <el-dialog v-model="probabilityVisible" class="lottery-probability-dialog" width="min(560px, calc(100vw - 32px))" align-center :show-close="false">
      <template #header>
        <div class="lottery-probability-title"><span class="lottery-probability-emblem"><Info :size="18" /></span><div><small>{{ activeMeta.label }} · 奖池规则</small><h2>概率详情</h2></div></div>
      </template>
      <div class="lottery-probability-body">
        <p class="lottery-probability-caption">兵器匣与功法卷共用以下品质概率。</p>
        <div class="lottery-probability-grid"><span v-for="(rate, tone) in LOTTERY_GRADE_RATES" :key="tone" class="lottery-rate" :class="tone"><i>{{ LOTTERY_GRADE_NAMES[tone] }}</i><b>{{ rate }}%</b></span></div>
        <div class="lottery-detail-list">
          <div v-if="activePool === 'equipment'"><b>碎片规则</b><span>传说装备需 5 枚碎片，神话装备需 10 枚碎片合成。</span></div>
        </div>
      </div>
      <template #footer><el-button type="primary" @click="probabilityVisible = false">知道了</el-button></template>
    </el-dialog>
  </div>
</template>
