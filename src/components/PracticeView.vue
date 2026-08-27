<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Backpack, CalendarCheck, Flame, Gem, Hammer, RotateCw, Sparkles, Swords, TimerReset, Trophy } from '@lucide/vue'
import { canBreakThrough, canClaimDailyCheckIn, canClaimDailyMaterialBounty, canClaimWeeklyMaterialBounty, canPractice, DAILY_CHECK_IN_REWARD, DAILY_MATERIAL_BOUNTY_REWARD, DAILY_MATERIAL_BOUNTY_WINS, formatCompactIntegerNumber, getInnerForceRate, getInnerForceRateBonus, getNextRealmId, getPracticeCost, getRealm, isPracticeComplete, WEEKLY_MATERIAL_BOUNTY_REWARD, WEEKLY_MATERIAL_BOUNTY_WINS, normalizeMaterialBountyState } from '../domain/game'
import type { GameState, ViewId } from '../domain/types'
import RollingNumber from './RollingNumber.vue'

const props = defineProps<{ game: GameState }>()
defineEmits<{
  practice: []
  breakthrough: []
  'toggle-auto': []
  'claim-daily-check-in': []
  'claim-daily-material-bounty': []
  'claim-weekly-material-bounty': []
  navigate: [view: ViewId]
}>()

const realm = computed(() => getRealm(props.game.player.realmId))
const nextRealm = computed(() => {
  const id = getNextRealmId(props.game.player.realmId)
  return id ? getRealm(id) : null
})
const practiceCost = computed(() => getPracticeCost(props.game.player.realmId, props.game.player.realmLevel))
const canPracticeNow = computed(() => canPractice(props.game.player, props.game.cultivation))
const canBreak = computed(() => canBreakThrough(props.game.player, props.game.cultivation))
const isAtRealmPeak = computed(() => props.game.player.realmLevel === 9)
const progress = computed(() => Number.isFinite(props.game.cultivation.practiceProgress) ? Math.min(100, Math.max(0, props.game.cultivation.practiceProgress)) : 0)
const isCurrentRealmComplete = computed(() => isPracticeComplete(props.game.cultivation))
const atUltimateRealm = computed(() => isAtRealmPeak.value && !nextRealm.value && isCurrentRealmComplete.value)
const canClaimToday = computed(() => canClaimDailyCheckIn(props.game.dailyCheckIn))
const materialBounties = computed(() => normalizeMaterialBountyState(props.game.materialBounties))
const canClaimDailyMaterials = computed(() => canClaimDailyMaterialBounty(materialBounties.value))
const canClaimWeeklyMaterials = computed(() => canClaimWeeklyMaterialBounty(materialBounties.value))
const dailyBountyProgress = computed(() => Math.min(DAILY_MATERIAL_BOUNTY_WINS, materialBounties.value.dailyDungeonWins))
const weeklyBountyProgress = computed(() => Math.min(WEEKLY_MATERIAL_BOUNTY_WINS, materialBounties.value.weeklyDungeonWins))
const isAutoPracticing = computed(() => props.game.cultivation.autoPractice && !isCurrentRealmComplete.value && !atUltimateRealm.value)
const progressTrack = ref<HTMLElement | null>(null)
const progressTrackWidth = ref(0)
let progressTrackObserver: ResizeObserver | undefined

const completedProgressWidth = computed(() => progressTrackWidth.value * progress.value / 100)
const isNarrowProgress = computed(() => isAutoPracticing.value && completedProgressWidth.value < 72)
const shimmerStyle = computed(() => {
  const duration = Math.max(2.8, Math.min(5.8, completedProgressWidth.value / 103.5))
  return {
    '--auto-practice-shimmer-duration': `${duration.toFixed(2)}s`,
    '--auto-practice-shimmer-travel': `${Math.ceil(completedProgressWidth.value)}px`,
  }
})

onMounted(() => {
  if (!progressTrack.value) return
  progressTrackWidth.value = progressTrack.value.getBoundingClientRect().width
  progressTrackObserver = new ResizeObserver(([entry]) => {
    progressTrackWidth.value = entry?.contentRect.width ?? 0
  })
  progressTrackObserver.observe(progressTrack.value)
})

onBeforeUnmount(() => progressTrackObserver?.disconnect())
</script>

<template>
  <div class="page-grid practice-page">
    <div class="page-main-column">
      <el-card class="panel practice-hero" shadow="never" :style="{ '--realm-color': realm?.color ?? '#1E7FB7', '--realm-foreground': realm?.foreground ?? '#FFFFFF' }">
        <div>
          <span class="kicker">内功吐纳</span>
          <h1><span class="realm-title" :data-realm-tier="realm?.tier">{{ realm?.label }}</span>第{{ game.player.realmLevel }}重</h1>
          <p>{{ realm?.description }}</p>
        </div>
        <div class="practice-medallion" :data-realm-tier="realm?.tier"><div><Flame :size="24" /><strong>{{ game.player.realmLevel }}重</strong></div></div>
      </el-card>

      <el-card class="panel cultivation-panel" shadow="never">
        <div class="section-head">
          <div><span class="kicker">当前内力</span><h2><RollingNumber :value="game.cultivation.amount" compact /> <small>内力</small></h2></div>
          <div class="practice-progress-heading"><small>第{{ game.player.realmLevel }}重修炼进度</small><b>{{ progress }}%</b></div>
        </div>
        <div ref="progressTrack" class="cultivation-progress" :class="{ 'is-auto-practicing': isAutoPracticing, 'is-narrow-progress': isNarrowProgress }" :style="shimmerStyle"><el-progress :percentage="progress" color="#409EFF" :stroke-width="10.4" :show-text="false" /></div>
        <div class="cultivation-details">
          <div><small>内力吐纳速度</small><b>{{ getInnerForceRate(game.player, game.temple) }} / 秒</b><em v-if="getInnerForceRateBonus(game.player)">心法增益 +{{ getInnerForceRateBonus(game.player) }} / 秒</em></div>
          <div><small>{{ atUltimateRealm ? '境界状态' : '自动修炼' }}</small><b :class="{ active: game.cultivation.autoPractice || atUltimateRealm }">{{ atUltimateRealm ? '武道极境·绝巅' : game.cultivation.autoPractice ? '已开启' : '未开启' }}</b></div>
        </div>
        <div class="cultivation-actions">
          <el-button v-if="!atUltimateRealm" class="action-button practice-button" type="primary" :disabled="!canPracticeNow" @click="$emit('practice')"><Flame :size="15" />打坐修炼<span class="action-cost">消耗 {{ formatCompactIntegerNumber(practiceCost) }} 内力</span></el-button>
          <el-button v-if="!atUltimateRealm" class="action-button auto-button" :class="{ active: game.cultivation.autoPractice }" @click="$emit('toggle-auto')"><RotateCw :size="15" />{{ game.cultivation.autoPractice ? '停止自动修炼' : '开启自动修炼' }}</el-button>
          <div v-else class="ultimate-realm" :style="{ '--realm-color': realm?.color ?? '#C84F59', '--realm-foreground': realm?.foreground ?? '#FFFFFF' }"><Trophy :size="15" /><span class="realm-inline-label" :data-realm-tier="realm?.tier">武道极境</span>已至绝巅</div>
        </div>
        <el-button v-if="isAtRealmPeak && nextRealm" class="breakthrough-button" type="warning" :disabled="!canBreak" @click="$emit('breakthrough')">突破</el-button>
        <div class="practice-tip"><TimerReset :size="14" />每次打坐消耗内力推进当前重数；九重关隘需亲自突破。</div>
      </el-card>

      <el-card class="panel shortcut-panel" shadow="never"><div class="section-head"><div><span class="kicker">快速入局</span><h2>今天想做什么？</h2></div><el-button link type="primary" @click="$emit('navigate', 'journey')">前往闯荡</el-button></div><div class="shortcut-grid"><el-button plain @click="$emit('navigate', 'journey')"><span class="shortcut-symbol vermilion"><Swords :size="17" /></span><span><b>挑战关卡</b><small>推进章节，验证战力</small></span></el-button><el-button plain @click="$emit('navigate', 'bag')"><span class="shortcut-symbol jade"><Backpack :size="17" /></span><span><b>查看背包</b><small>整理装备，查看道具</small></span></el-button></div></el-card>
    </div>
    <aside class="page-side-column">
      <el-card class="panel daily-checkin-panel" shadow="never">
        <div class="section-head">
          <div><span class="kicker">每日活动</span><h2>每日签到</h2></div>
          <CalendarCheck :size="18" class="daily-checkin-icon" />
        </div>
        <div class="daily-checkin-reward"><span><Gem :size="18" /></span><div><b>+{{ DAILY_CHECK_IN_REWARD.toLocaleString('zh-CN') }} 琅玉</b><small>每日可领取一次</small></div></div>
        <el-button class="full daily-checkin-button" type="primary" :disabled="!canClaimToday" @click="$emit('claim-daily-check-in')">{{ canClaimToday ? '领取今日签到' : '今日已签到' }}</el-button>
      </el-card>
      <el-card class="panel material-bounty-panel" shadow="never">
        <div class="section-head">
          <div><span class="kicker">秘境回报</span><h2>资源悬赏</h2></div>
          <Hammer :size="18" class="material-bounty-icon" />
        </div>
        <div class="material-bounty-list">
          <div class="material-bounty-row">
            <div class="material-bounty-mark reforge"><Hammer :size="16" /></div>
            <div class="material-bounty-copy"><b>秘境日课</b><small>完成 1 次秘境胜利 · +{{ DAILY_MATERIAL_BOUNTY_REWARD }} 洗炼石</small><span class="material-bounty-progress">{{ dailyBountyProgress }}/{{ DAILY_MATERIAL_BOUNTY_WINS }}</span></div>
            <el-button v-if="!materialBounties.dailyClaimed" size="small" type="primary" :disabled="!canClaimDailyMaterials" @click="$emit('claim-daily-material-bounty')">领取</el-button><span v-else class="material-bounty-claimed">已领</span>
          </div>
          <div class="material-bounty-row">
            <div class="material-bounty-mark essence"><Sparkles :size="16" /></div>
            <div class="material-bounty-copy"><b>铸器周赏</b><small>本周完成 {{ WEEKLY_MATERIAL_BOUNTY_WINS }} 次秘境胜利 · +{{ WEEKLY_MATERIAL_BOUNTY_REWARD }} 装备精魄</small><span class="material-bounty-progress">{{ weeklyBountyProgress }}/{{ WEEKLY_MATERIAL_BOUNTY_WINS }}</span></div>
            <el-button v-if="!materialBounties.weeklyClaimed" size="small" type="primary" :disabled="!canClaimWeeklyMaterials" @click="$emit('claim-weekly-material-bounty')">领取</el-button><span v-else class="material-bounty-claimed">已领</span>
          </div>
        </div>
      </el-card>
      <el-card class="panel glance-panel" shadow="never"><div class="section-head"><div><span class="kicker">最近记录</span><h2>江湖一瞥</h2></div></div><div v-for="log in game.logs.slice(0, 3)" :key="log.id" class="glance-row"><span :class="`glance-icon ${log.category}`"><Flame v-if="log.category === '习武'" :size="13" /><Swords v-else-if="log.category === '战斗'" :size="13" /><Sparkles v-else :size="13" /></span><div><p>{{ log.text }}</p><small>{{ log.time }} · <b>{{ log.reward }}</b></small></div></div></el-card>
    </aside>
  </div>
</template>
