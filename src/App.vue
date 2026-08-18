<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UserRound } from '@lucide/vue'
import { advanceEncounterAction, createEncounter } from './domain/combat'
import { AUTO_PRACTICE_INTERVAL_MS, accrueInnerForce, advanceMainJourney, breakThroughRealm, canBreakThrough, claimDailyCheckIn, createInitialGame, drawLottery, enhanceEquipment, enhanceMartialArt, equipPlayerEquipment, equipPlayerMartialArt, getCombatPower, getCurrentMainStage, getEquipmentEnhancementCost, getInnerForceRate, getMainStageByOrdinal, getMainStageReplayReward, getMartialEnhancementCost, getPlayerCombatPassives, getPlayerCombatStats, getPlayerOuterSkills, getPlayerPower, getRealm, hasClearedMainStage, isPracticeComplete, loadGame, practiceOnce, prependGameLog, saveGame, unequipPlayerEquipment, unequipPlayerMartialArt } from './domain/game'
import type { BattleReward, CombatAction, CombatTarget, Encounter, Equipment, EquipmentSlot, GameState, LotteryDrawCount, LotteryDrawResult, LotteryPoolId, MainStage, MainStageReward, MartialArt, MartialArtSlot, ViewId } from './domain/types'
import GameHeader from './components/GameHeader.vue'
import GameNav from './components/GameNav.vue'
import PracticeView from './components/PracticeView.vue'
import JourneyView from './components/JourneyView.vue'
import BagView from './components/BagView.vue'
import LotteryView from './components/LotteryView.vue'
import CombatModal from './components/CombatModal.vue'
import PlayerStatsModal from './components/PlayerStatsModal.vue'
import PowerChangeToast from './components/PowerChangeToast.vue'

const game = ref<GameState>(loadGame())
const activeView = ref<ViewId>('practice')
const combatModalOpen = ref(false)
const playerStatsModalOpen = ref(false)
const combatEncounter = ref<Encounter | null>(null)
const combatTarget = ref<CombatTarget | null>(null)
const combatAction = ref<CombatAction | null>(null)
const combatReward = ref<BattleReward | null>(null)
const autoBattleActive = ref(false)
const powerChange = ref<{ id: number; from: number; to: number } | null>(null)
const lotteryDrawResult = ref<LotteryDrawResult | null>(null)
let tick: ReturnType<typeof window.setInterval> | undefined
let combatTick: ReturnType<typeof window.setInterval> | undefined
let autoBattleNextTimer: ReturnType<typeof window.setTimeout> | undefined
let powerChangeTimer: ReturnType<typeof window.setTimeout> | undefined
let lastAutoPracticeAt = 0
let battleRewardGranted = false
let powerChangeId = 0

function stopCombatTimer(): void {
  if (combatTick !== undefined) {
    window.clearInterval(combatTick)
    combatTick = undefined
  }
}

function stopAutoBattle(): void {
  autoBattleActive.value = false
  if (autoBattleNextTimer !== undefined) {
    window.clearTimeout(autoBattleNextTimer)
    autoBattleNextTimer = undefined
  }
}

const viewMeta: Record<ViewId, { label: string; hint: string }> = {
  practice: { label: '修炼', hint: '内功进度' },
  journey: { label: '闯荡', hint: '关卡与秘境' },
  bag: { label: '背包', hint: '装备、道具与功法' },
  lottery: { label: '抽奖', hint: '江湖寻珍' },
}

const cultivationReady = computed(() => canBreakThrough(game.value.player, game.value.cultivation))
const playerCombatStats = computed(() => getPlayerCombatStats(game.value.player))
const playerPower = computed(() => getPlayerPower(game.value.player))

watch(playerPower, (to, from) => {
  if (to === from) return
  powerChange.value = { id: ++powerChangeId, from, to }
  window.clearTimeout(powerChangeTimer)
  powerChangeTimer = window.setTimeout(() => {
    powerChange.value = null
  }, 2400)
}, { flush: 'sync' })

function notify(message: string): void {
  ElMessage({ message, type: 'info', grouping: true, offset: 76 })
}

function persist(): void {
  saveGame(game.value)
}

function setView(view: ViewId): void {
  activeView.value = view
}

function claimDailyCheckInReward(): void {
  const result = claimDailyCheckIn(game.value.player, game.value.dailyCheckIn)
  if (!result) {
    notify('今日已经签到，明日再来。')
    return
  }
  game.value.player = result.player
  game.value.dailyCheckIn = result.dailyCheckIn
  game.value.logs = prependGameLog(game.value.logs, {
    id: `check-in-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: '你完成了每日签到，琅玉入囊。',
    reward: '+1600 琅玉',
  })
  persist()
  notify('签到成功，获得 1600 琅玉。')
}

function addPracticeLog(text: string, reward: string): void {
  game.value.logs = prependGameLog(game.value.logs, { id: `cultivation-${Date.now()}`, category: '习武', time: '刚才', text, reward })
}

function practiceCultivation(manual = true): void {
  const previousRate = getInnerForceRate(game.value.player)
  const result = practiceOnce(game.value.player, game.value.cultivation)
  if (!result) {
    if (manual) notify(isPracticeComplete(game.value.cultivation) ? '当前重数已至圆满，请先突破境界。' : '内力不足，暂时无法打坐。')
    return
  }
  game.value.player = result.player
  game.value.cultivation = result.cultivation
  if (result.advanced) {
    const realm = getRealm(result.player.realmId)
    const rateGain = Math.max(0, Math.round((getInnerForceRate(result.player) - previousRate) * 100) / 100)
    addPracticeLog(
      manual ? `你稳住气机，踏入${realm?.label ?? '下一重'}第${result.player.realmLevel}重。` : `自动修炼完成，当前为${realm?.label ?? ''}第${result.player.realmLevel}重。`,
      rateGain ? `+境界提升 · 吐纳 +${rateGain}/秒` : '+境界提升',
    )
    if (manual) notify(`已提升至${realm?.label ?? ''}第${result.player.realmLevel}重，吐纳速度 +${rateGain}/秒。`)
  } else if (manual) {
    notify(isPracticeComplete(result.cultivation) ? '当前重数已至圆满，可以突破境界。' : `打坐完成，修炼进度 ${result.cultivation.practiceProgress}%。`)
  }
  persist()
}

function breakThroughCultivation(): void {
  const previousRealm = getRealm(game.value.player.realmId)
  const previousRate = getInnerForceRate(game.value.player)
  const result = breakThroughRealm(game.value.player, game.value.cultivation)
  if (!result) {
    notify('当前重数尚未修炼圆满。')
    return
  }
  game.value.player = result.player
  game.value.cultivation = result.cultivation
  const realm = getRealm(result.player.realmId)
  const rateGain = Math.max(0, Math.round((getInnerForceRate(result.player) - previousRate) * 100) / 100)
  addPracticeLog(`你贯通关隘，从${previousRealm?.label ?? '当前境界'}突破至${realm?.label ?? '下一境界'}。`, `+大境界突破 · 吐纳 +${rateGain}/秒`)
  persist()
  notify(`突破成功，已至${realm?.label ?? ''}第一重，吐纳速度 +${rateGain}/秒。`)
}

function toggleAutoCultivation(): void {
  game.value.cultivation.autoPractice = !game.value.cultivation.autoPractice
  lastAutoPracticeAt = 0
  if (game.value.cultivation.autoPractice) practiceCultivation(false)
  persist()
  notify(game.value.cultivation.autoPractice ? '已开启自动修炼，内力足够时会每秒打坐一次。' : '已停止自动修炼。')
}

function accrueAndPractice(): void {
  const now = Date.now()
  game.value.cultivation = accrueInnerForce(game.value.cultivation, game.value.player, now)
  if (game.value.cultivation.autoPractice && now - lastAutoPracticeAt >= AUTO_PRACTICE_INTERVAL_MS) {
    lastAutoPracticeAt = now
    practiceCultivation(false)
  }
  persist()
}

function openMainBattle(requestedStage?: MainStage, preserveAutoBattle = false): boolean {
  if (!preserveAutoBattle) stopAutoBattle()
  stopCombatTimer()
  const currentStage = getCurrentMainStage(game.value.journey)
  const stage = requestedStage ?? currentStage
  if (!stage) {
    notify('没有可挑战的主线关卡。')
    return false
  }
  const isReplay = currentStage?.ordinal !== stage.ordinal
  if (isReplay && !hasClearedMainStage(game.value.journey, stage)) {
    notify('该关卡尚未解锁。')
    return false
  }
  combatTarget.value = {
    name: `第 ${stage.chapter} 章 · 第 ${stage.stage} 关`,
    power: stage.enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0),
    enemies: stage.enemies,
    kind: 'main',
    stageOrdinal: stage.ordinal,
    isReplay,
  }
  battleRewardGranted = false
  combatEncounter.value = null
  combatAction.value = null
  combatReward.value = null
  combatModalOpen.value = true
  return true
}

function startMainBattle(requestedStage?: MainStage): void {
  if (openMainBattle(requestedStage)) startBattle()
}

function scheduleNextAutoBattle(): void {
  if (!autoBattleActive.value) return
  if (autoBattleNextTimer !== undefined) window.clearTimeout(autoBattleNextTimer)
  autoBattleNextTimer = window.setTimeout(() => {
    autoBattleNextTimer = undefined
    if (!autoBattleActive.value) return
    if (!getCurrentMainStage(game.value.journey)) {
      stopAutoBattle()
      notify('主线已全部通关，自动战斗结束。')
      return
    }
    if (!openMainBattle(undefined, true)) {
      stopAutoBattle()
      return
    }
    startBattle()
  }, 1_000)
}

function toggleAutoBattle(): void {
  if (autoBattleActive.value) {
    stopAutoBattle()
    closeCombatModal()
    notify('已停止自动战斗。')
    return
  }
  if (!getCurrentMainStage(game.value.journey)) {
    notify('主线已全部通关。')
    return
  }
  autoBattleActive.value = true
  if (!openMainBattle(undefined, true)) {
    stopAutoBattle()
    return
  }
  startBattle()
}

function grantMainStageReward(reward: MainStageReward): void {
  game.value.player.silver += reward.silver
  game.value.player.langyu += reward.langyu
  game.value.player.forge += reward.forge
  game.value.player.insight += reward.insight
  game.value.player.fame += reward.fame
}

function formatMainStageReward(reward: MainStageReward): string {
  const items = [
    reward.silver ? `+${reward.silver} 银两` : '',
    reward.langyu ? `+${reward.langyu} 琅玉` : '',
    reward.forge ? `+${reward.forge} 铸材` : '',
    reward.insight ? `+${reward.insight} 心得` : '',
    reward.fame ? `+${reward.fame} 声名` : '',
  ].filter(Boolean)
  return items.join(' · ')
}

function startBattle(): void {
  if (!combatTarget.value) return
  combatAction.value = null
  combatEncounter.value = {
    ...createEncounter({
      enemyName: combatTarget.value.enemies.map((enemy) => enemy.name).join('、'),
      enemies: combatTarget.value.enemies,
      playerStats: playerCombatStats.value,
      playerPassives: getPlayerCombatPassives(game.value.player),
      playerOuterSkills: getPlayerOuterSkills(game.value.player),
      kind: combatTarget.value.kind,
    }),
    status: 'fighting',
  }
  stopCombatTimer()
  combatTick = window.setInterval(() => {
    if (!combatEncounter.value || combatEncounter.value.status !== 'fighting') return
    const step = advanceEncounterAction(combatEncounter.value)
    combatEncounter.value = step.encounter
    combatAction.value = step.action
    if (combatEncounter.value.status !== 'fighting') finishBattle(combatEncounter.value)
  }, 720)
}

function finishBattle(encounter: Encounter): void {
  stopCombatTimer()
  const target = combatTarget.value
  if (encounter.status !== 'won') {
    if (autoBattleActive.value) {
      stopAutoBattle()
      notify(`自动战斗已止步于${target?.name ?? '当前关卡'}。`)
    }
    return
  }
  if (battleRewardGranted || encounter.kind !== 'main') return
  if (!target?.stageOrdinal) return
  const stage = getMainStageByOrdinal(target.stageOrdinal)
  if (!stage) return

  battleRewardGranted = true
  if (target.isReplay) {
    const reward = getMainStageReplayReward(stage)
    grantMainStageReward(reward)
    combatReward.value = reward
    const rewardLabel = `${formatMainStageReward(reward)}${reward.eliteBonus ? ' · 精英掉落' : ''}`
    game.value.logs = prependGameLog(game.value.logs, {
      id: `replay-${Date.now()}`,
      category: '战斗',
      time: '刚才',
      text: `你再战第${stage.chapter}章第${stage.stage}关，击败${encounter.enemyName}。`,
      reward: rewardLabel,
    })
    persist()
    notify(`再战获胜，${rewardLabel}。`)
    return
  }

  const currentStage = getCurrentMainStage(game.value.journey)
  if (!currentStage || currentStage.ordinal !== stage.ordinal) return
  const nextJourney = advanceMainJourney(game.value.journey, stage)
  if (!nextJourney) return

  game.value.journey = nextJourney
  grantMainStageReward(stage.reward)
  combatReward.value = { ...stage.reward, eliteBonus: false }
  game.value.logs = prependGameLog(game.value.logs, {
    id: `battle-${Date.now()}`,
    category: '战斗',
    time: '刚才',
    text: `你闯过了第${stage.chapter}章第${stage.stage}关，击败${encounter.enemyName}。`,
    reward: formatMainStageReward(stage.reward),
  })
  persist()
  scheduleNextAutoBattle()
}

function closeCombatModal(): void {
  stopAutoBattle()
  stopCombatTimer()
  combatAction.value = null
  combatModalOpen.value = false
}

function equipEquipment(slot: EquipmentSlot, equipment: Equipment): void {
  if (game.value.player.equippedEquipment[slot]?.equipmentId === equipment.id) return
  game.value.player = equipPlayerEquipment(game.value.player, slot, equipment)
  persist()
}

function unequipEquipment(slot: EquipmentSlot): void {
  if (!game.value.player.equippedEquipment[slot]) return
  game.value.player = unequipPlayerEquipment(game.value.player, slot)
  persist()
}

function equipMartialArt(slot: MartialArtSlot, art: MartialArt): void {
  game.value.player = equipPlayerMartialArt(game.value.player, slot, art)
  persist()
}

function unequipMartialArt(slot: MartialArtSlot): void {
  game.value.player = unequipPlayerMartialArt(game.value.player, slot)
  persist()
}

function enhanceMartial(art: MartialArt): void {
  const cost = getMartialEnhancementCost(game.value.player, art)
  const result = enhanceMartialArt(game.value.player, art)
  if (!result) {
    notify(game.value.player.insight < cost ? '功法心得不足，先去闯荡积累。' : '这门功法已强化至满级。')
    return
  }
  game.value.player = result
  addPracticeLog(`你强化${art.name}，功法火候有所精进。`, `-${cost} 心得`)
  persist()
  notify(`${art.name}强化成功，吐纳效率已提高。`)
}

function enhanceEquipmentItem(equipment: Equipment): void {
  const cost = getEquipmentEnhancementCost(game.value.player, equipment)
  const result = enhanceEquipment(game.value.player, equipment)
  if (!result) {
    notify(game.value.player.forge < cost ? '铸材不足，先去闯荡积累。' : '这件装备已强化至满级。')
    return
  }
  game.value.player = result
  addPracticeLog(`你淬炼${equipment.name}，装备锋芒更盛。`, `-${cost} 铸材`)
  persist()
  notify(`${equipment.name}强化成功。`)
}

function startLotteryDraw(pool: LotteryPoolId, count: LotteryDrawCount): void {
  const outcome = drawLottery(game.value.player, game.value.lottery, pool, count)
  if (!outcome) {
    notify('琅玉不足，暂时无法开启。')
    return
  }
  game.value.player = outcome.player
  game.value.lottery = outcome.lottery
  lotteryDrawResult.value = outcome.result
  persist()
}

function resetLocalSave(): void {
  stopAutoBattle()
  stopCombatTimer()
  combatModalOpen.value = false
  combatTarget.value = null
  combatEncounter.value = null
  combatAction.value = null
  combatReward.value = null
  battleRewardGranted = false
  game.value = createInitialGame()
  persist()
  notify('已创建新的江湖行记。')
}

onMounted(() => {
  accrueAndPractice()
  tick = window.setInterval(() => {
    accrueAndPractice()
  }, 1000)
})

onBeforeUnmount(() => {
  stopAutoBattle()
  window.clearInterval(tick)
  stopCombatTimer()
  window.clearTimeout(powerChangeTimer)
})
</script>

<template>
  <div class="app-shell">
    <GameHeader :game="game" :player-power="playerPower">
      <GameNav :active="activeView" :cultivation-ready="cultivationReady" @change="setView" />
    </GameHeader>
    <div class="app-body">
      <main class="content">
        <header class="view-heading"><div><span class="kicker">{{ viewMeta[activeView].hint }}</span><h1>{{ viewMeta[activeView].label }}</h1></div><span class="save-state">● 本地习武记录已保存</span></header>
        <PracticeView v-if="activeView === 'practice'" :game="game" @practice="practiceCultivation" @breakthrough="breakThroughCultivation" @toggle-auto="toggleAutoCultivation" @claim-daily-check-in="claimDailyCheckInReward" @navigate="setView" />
        <JourneyView v-else-if="activeView === 'journey'" :game="game" :player-power="playerPower" :player-stats="playerCombatStats" :auto-battle-active="autoBattleActive" @battle-main="openMainBattle" @start-battle-main="startMainBattle" @toggle-auto-battle="toggleAutoBattle" />
        <BagView v-else-if="activeView === 'bag'" :game="game" @equip-equipment="equipEquipment" @unequip-equipment="unequipEquipment" @enhance-equipment="enhanceEquipmentItem" @equip-martial="equipMartialArt" @unequip-martial="unequipMartialArt" @enhance-art="enhanceMartial" />
        <LotteryView v-else :game="game" :draw-result="lotteryDrawResult" @draw="startLotteryDraw" />
      </main>
    </div>
    <CombatModal v-if="combatTarget" :open="combatModalOpen" :encounter="combatEncounter" :action="combatAction" :reward="combatReward" :target="combatTarget" :player="game.player" :player-power="playerPower" :player-stats="playerCombatStats" :auto-battle="autoBattleActive" @close="closeCombatModal" @start="startBattle" />
    <PowerChangeToast v-if="powerChange" :key="powerChange.id" :from="powerChange.from" :to="powerChange.to" />
    <el-tooltip content="人物属性" placement="left">
      <el-button class="player-stats-trigger" circle type="primary" aria-label="打开人物属性" @click="playerStatsModalOpen = true"><UserRound :size="19" /></el-button>
    </el-tooltip>
    <PlayerStatsModal :open="playerStatsModalOpen" :player="game.player" :stats="playerCombatStats" :power="playerPower" @close="playerStatsModalOpen = false" />
    <el-button class="reset-save" text type="primary" size="small" title="重置本地存档" @click="resetLocalSave">重新开始</el-button>
  </div>
</template>
