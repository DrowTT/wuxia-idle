<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UserRound } from '@lucide/vue'
import { advanceEncounterAction, createEncounter } from './domain/combat'
import { AUTO_PRACTICE_INTERVAL_MS, accrueInnerForce, ascendEquipment, ascendMartialArt, breakThroughRealm, canBreakThrough, canEnterDungeon, cancelDungeonChallenge, claimDailyCheckIn, claimDailyMaterialBounty, claimWeeklyMaterialBounty, createInitialGame, drawLottery, enhanceEquipment, enhanceMartialArt, enterDungeon, equipPlayerEquipment, equipPlayerMartialArt, getCombatPower, getCurrentMainStage, getDungeonEnemies, getDungeonHighestCleared, getDungeonLayer, getDungeonMechanicId, getEquipmentAscensionRequirement, getEquipmentEnhancementCost, getEquipmentRefinement, getEquipmentRefinementCost, getEquipmentRefinementStatLabel, getInnerForceRate, getInventoryItemById, getMainStageByOrdinal, getMartialEnhancementCost, getPlayerCombatPassives, getPlayerCombatStats, getPlayerOuterSkills, getPlayerPower, getRealm, getSilverShopOffer, getSilverShopPurchaseRemaining, hasClearedMainStage, isPracticeComplete, loadGame, offerToIdol, practiceOnce, prependGameLog, purchaseSilverShopProduct, recordDungeonMaterialBountyWin, refineEquipment, removeEquipmentGem, resolveDungeonReward, resolveMainStageVictory, saveGame, setAutoPractice, socketEquipmentGem, sweepDungeon, synthesizeGem, unlockEquipmentGemSlot, unequipPlayerEquipment, unequipPlayerMartialArt, useInventoryItem } from './domain/game'
import { EQUIPMENT_GEM_SOCKET_COST } from './data'
import { getIdolConfig, getSilverShopProduct } from './data'
import type { BattleReward, CombatAction, CombatTarget, Encounter, Equipment, EquipmentSlot, GameState, IdolId, InventoryItem, LotteryDrawCount, LotteryDrawResult, LotteryPoolId, MainStage, MainStageReward, MartialArt, MartialArtSlot, ViewId } from './domain/types'
import GameHeader from './components/GameHeader.vue'
import GameNav from './components/GameNav.vue'
const PracticeView = defineAsyncComponent(() => import('./components/PracticeView.vue'))
const JourneyView = defineAsyncComponent(() => import('./components/JourneyView.vue'))
const DungeonView = defineAsyncComponent(() => import('./components/DungeonView.vue'))
const BagView = defineAsyncComponent(() => import('./components/BagView.vue'))
const LotteryView = defineAsyncComponent(() => import('./components/LotteryView.vue'))
const SilverShopView = defineAsyncComponent(() => import('./components/SilverShopView.vue'))
const TempleView = defineAsyncComponent(() => import('./components/TempleView.vue'))
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
const saveState = ref<'saved' | 'failed'>('saved')
let tick: ReturnType<typeof window.setInterval> | undefined
let combatTick: ReturnType<typeof window.setInterval> | undefined
let autoBattleNextTimer: ReturnType<typeof window.setTimeout> | undefined
let powerChangeTimer: ReturnType<typeof window.setTimeout> | undefined
let saveTimer: ReturnType<typeof window.setTimeout> | undefined
let lastAutoPracticeAt = 0
let battleRewardGranted = false
let powerChangeId = 0
let saveQueued = false

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
  dungeon: { label: '秘境', hint: '体力挑战' },
  temple: { label: '武庙', hint: '香火供奉' },
  bag: { label: '背包', hint: '装备、道具与功法' },
  lottery: { label: '抽奖', hint: '江湖寻珍' },
  market: { label: '商会', hint: '银两兑换' },
}

const cultivationReady = computed(() => canBreakThrough(game.value.player, game.value.cultivation))
const playerCombatStats = computed(() => getPlayerCombatStats(game.value.player, game.value.temple))
const playerPower = computed(() => getPlayerPower(game.value.player, game.value.temple))

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

function persistNow(): void {
  saveState.value = saveGame(game.value) ? 'saved' : 'failed'
}

/**
 * User actions save immediately. Passive accrual uses the queued variant below
 * so a one-second UI tick does not synchronously write localStorage forever.
 */
function persist(): void {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer)
    saveTimer = undefined
  }
  saveQueued = false
  persistNow()
}

function schedulePersist(): void {
  saveQueued = true
  if (saveTimer !== undefined) return
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined
    if (!saveQueued) return
    saveQueued = false
    persistNow()
  }, 1500)
}

function flushPendingSave(): void {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer)
    saveTimer = undefined
  }
  if (!saveQueued) return
  saveQueued = false
  persistNow()
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') flushPendingSave()
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

function claimDailyMaterialBountyReward(): void {
  const result = claimDailyMaterialBounty(game.value.player, game.value.materialBounties)
  if (!result) {
    notify('完成一次秘境挑战后，才能领取今日洗炼石。')
    return
  }
  game.value.player = result.player
  game.value.materialBounties = result.materialBounties
  game.value.logs = prependGameLog(game.value.logs, {
    id: `material-daily-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: '你完成今日秘境悬赏，获得一枚洗炼石。',
    reward: '+1 洗炼石',
  })
  persist()
  notify('已领取今日悬赏，获得 1 个洗炼石。')
}

function claimWeeklyMaterialBountyReward(): void {
  const result = claimWeeklyMaterialBounty(game.value.player, game.value.materialBounties)
  if (!result) {
    notify('本周完成 5 次秘境胜利后，才能领取装备精魄。')
    return
  }
  game.value.player = result.player
  game.value.materialBounties = result.materialBounties
  game.value.logs = prependGameLog(game.value.logs, {
    id: `material-weekly-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: '你完成本周铸器悬赏，获得三枚装备精魄。',
    reward: '+3 装备精魄',
  })
  persist()
  notify('已领取本周悬赏，获得 3 个装备精魄。')
}

function synthesizeGemItem(gem: InventoryItem): void {
  const result = synthesizeGem(game.value.player, gem)
  if (!result) {
    notify('需要至少 3 枚同级宝石才能合成。')
    return
  }
  game.value.player = result.player
  game.value.logs = prependGameLog(game.value.logs, {
    id: `gem-synthesis-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: result.success ? `你将三枚${result.source.name}淬炼为${result.target.name}。` : `${result.source.name}合成失败，灵光散尽。`,
    reward: result.success ? `+1 ${result.target.name}` : '合成失败',
  })
  persist()
  notify(result.success ? `合成成功，获得 1 枚${result.target.name}。` : `合成失败，${result.source.name}消耗殆尽。`)
}

function addPracticeLog(text: string, reward: string): void {
  game.value.logs = prependGameLog(game.value.logs, { id: `cultivation-${Date.now()}`, category: '习武', time: '刚才', text, reward })
}

function practiceCultivation(manual = true): void {
  const previousRate = getInnerForceRate(game.value.player, game.value.temple)
  const result = practiceOnce(game.value.player, game.value.cultivation)
  if (!result) {
    if (manual) notify(isPracticeComplete(game.value.cultivation) ? '当前重数已至圆满，请先突破境界。' : '内力不足，暂时无法打坐。')
    return
  }
  game.value.player = result.player
  game.value.cultivation = result.cultivation
  if (result.advanced) {
    const realm = getRealm(result.player.realmId)
    const rateGain = Math.max(0, Math.round((getInnerForceRate(result.player, game.value.temple) - previousRate) * 100) / 100)
    addPracticeLog(
      manual ? `你稳住气机，踏入${realm?.label ?? '下一重'}第${result.player.realmLevel}重。` : `自动修炼完成，当前为${realm?.label ?? ''}第${result.player.realmLevel}重。`,
      rateGain ? `+境界提升 · 吐纳 +${rateGain}/秒` : '+境界提升',
    )
    if (manual) notify(`已提升至${realm?.label ?? ''}第${result.player.realmLevel}重，吐纳速度 +${rateGain}/秒。`)
  } else if (manual) {
    notify(isPracticeComplete(result.cultivation) ? '当前重数已至圆满，可以突破境界。' : `打坐完成，修炼进度 ${result.cultivation.practiceProgress}%。`)
  }
  if (manual) persist()
  else schedulePersist()
}

function breakThroughCultivation(): void {
  const previousRealm = getRealm(game.value.player.realmId)
  const previousRate = getInnerForceRate(game.value.player, game.value.temple)
  const result = breakThroughRealm(game.value.player, game.value.cultivation)
  if (!result) {
    notify('当前重数尚未修炼圆满。')
    return
  }
  game.value.player = result.player
  game.value.cultivation = result.cultivation
  const realm = getRealm(result.player.realmId)
  const rateGain = Math.max(0, Math.round((getInnerForceRate(result.player, game.value.temple) - previousRate) * 100) / 100)
  addPracticeLog(`你贯通关隘，从${previousRealm?.label ?? '当前境界'}突破至${realm?.label ?? '下一境界'}。`, `+大境界突破 · 吐纳 +${rateGain}/秒`)
  persist()
  notify(`突破成功，已至${realm?.label ?? ''}第一重，吐纳速度 +${rateGain}/秒。`)
}

function toggleAutoCultivation(): void {
  game.value.cultivation = setAutoPractice(game.value.cultivation, !game.value.cultivation.autoPractice)
  lastAutoPracticeAt = 0
  if (game.value.cultivation.autoPractice) practiceCultivation(false)
  persist()
  notify(game.value.cultivation.autoPractice ? '已开启自动修炼，内力足够时会每秒打坐一次。' : '已停止自动修炼。')
}

function accrueAndPractice(): void {
  const now = Date.now()
  const previousCultivation = game.value.cultivation
  const accruedCultivation = accrueInnerForce(previousCultivation, game.value.player, now, game.value.temple)
  const accrualChanged = accruedCultivation.amount !== previousCultivation.amount
    || accruedCultivation.lastAccruedAt !== previousCultivation.lastAccruedAt
  game.value.cultivation = accruedCultivation
  if (game.value.cultivation.autoPractice && now - lastAutoPracticeAt >= AUTO_PRACTICE_INTERVAL_MS) {
    lastAutoPracticeAt = now
    const beforePractice = game.value.cultivation
    const beforePlayer = game.value.player
    practiceCultivation(false)
    // A successful practice already persists its transaction. If there was
    // only passive accrual, persist once; idle ticks with no state change do
    // not synchronously write to localStorage.
    const practiceChanged = game.value.player !== beforePlayer
      || game.value.cultivation.amount !== beforePractice.amount
      || game.value.cultivation.practiceProgress !== beforePractice.practiceProgress
    if (accrualChanged && !practiceChanged) schedulePersist()
    return
  }
  if (accrualChanged) schedulePersist()
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

function openDungeonBattle(dungeonId: string, layerNumber: number): void {
  stopAutoBattle()
  stopCombatTimer()
  const layer = getDungeonLayer(dungeonId, layerNumber)
  const enemies = getDungeonEnemies(dungeonId, layerNumber)
  if (!layer || !enemies.length) return
  if (!canEnterDungeon(game.value.dungeons, dungeonId, layerNumber, game.value.player.realmId)) {
    notify('体力不足，或该层尚未解锁。')
    return
  }
  const highest = getDungeonHighestCleared(game.value.dungeons, dungeonId)
  const nextState = enterDungeon(game.value.dungeons, dungeonId, layerNumber, game.value.player.realmId)
  if (!nextState) return
  game.value.dungeons = nextState
  combatTarget.value = {
    name: `${layer.name}`,
    power: enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0),
    enemies,
    kind: 'dungeon',
    dungeonId,
    dungeonLayer: layerNumber,
    dungeonMechanic: getDungeonMechanicId(dungeonId),
    isReplay: layerNumber <= highest,
  }
  battleRewardGranted = false
  combatEncounter.value = null
  combatAction.value = null
  combatReward.value = null
  combatModalOpen.value = true
  persist()
  startBattle()
}

function sweepDungeonLayer(dungeonId: string, layerNumber: number): void {
  const result = sweepDungeon(game.value.player, game.value.lottery, game.value.dungeons, dungeonId, layerNumber)
  if (!result) {
    notify('扫荡需要已通关该层，并且体力充足。')
    return
  }
  game.value.player = result.player
  game.value.lottery = result.lottery
  game.value.dungeons = result.dungeons
  game.value.materialBounties = recordDungeonMaterialBountyWin(game.value.materialBounties)
  const rewardLabel = [formatMainStageReward(result.reward), ...result.reward.drops.map((drop) => `+${drop.quantity} ${drop.name}`)].filter(Boolean).join(' · ')
  game.value.logs = prependGameLog(game.value.logs, { id: `dungeon-sweep-${Date.now()}`, category: '收获', time: '刚才', text: `你扫荡了${getDungeonLayer(dungeonId, layerNumber)?.name ?? '秘境关卡'}。`, reward: rewardLabel || '暂无额外奖励' })
  persist()
  notify(`扫荡完成，${rewardLabel || '获得主题掉落'}。`)
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

function formatMainStageReward(reward: MainStageReward): string {
  const items = [
    reward.silver ? `+${reward.silver} 银两` : '',
    reward.langyu ? `+${reward.langyu} 琅玉` : '',
    reward.forge ? `+${reward.forge} 铸材` : '',
    reward.insight ? `+${reward.insight} 心得` : '',
    reward.incense ? `+${reward.incense} 香火` : '',
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
      dungeonMechanic: combatTarget.value.dungeonMechanic,
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
    if (encounter.kind === 'dungeon' && target?.dungeonId && target.dungeonLayer) {
      game.value.dungeons = cancelDungeonChallenge(game.value.dungeons, target.dungeonId, target.dungeonLayer)
      persist()
    }
    if (autoBattleActive.value) {
      stopAutoBattle()
      notify(`自动战斗已止步于${target?.name ?? '当前关卡'}。`)
    }
    return
  }
  if (battleRewardGranted) return
  if (encounter.kind === 'dungeon') {
    const target = combatTarget.value
    if (!target?.dungeonId || !target.dungeonLayer) return
    const result = resolveDungeonReward(game.value.player, game.value.lottery, game.value.dungeons, target.dungeonId, target.dungeonLayer)
    if (!result) {
      // A stale or malformed challenge must not leave the daily attempt in a
      // permanently active state after the battle has already ended.
      game.value.dungeons = cancelDungeonChallenge(game.value.dungeons, target.dungeonId, target.dungeonLayer)
      persist()
      notify('秘境奖励结算失败，本次挑战已结束。')
      return
    }
    battleRewardGranted = true
    game.value.player = result.player
    game.value.lottery = result.lottery
    game.value.dungeons = result.dungeons
    game.value.materialBounties = recordDungeonMaterialBountyWin(game.value.materialBounties)
    combatReward.value = result.reward
    const rewardLabel = [formatMainStageReward(result.reward), ...result.reward.drops.map((drop) => `+${drop.quantity} ${drop.name}`)].filter(Boolean).join(' · ')
    game.value.logs = prependGameLog(game.value.logs, { id: `dungeon-${Date.now()}`, category: '收获', time: '刚才', text: `你深入${target.name}，击败了守关敌人。`, reward: rewardLabel || '暂无额外奖励' })
    persist()
    notify(result.reward.firstClear ? `秘境首通，${rewardLabel}。` : `秘境再战，${rewardLabel}。`)
    return
  }
  if (encounter.kind !== 'main') return
  if (!target?.stageOrdinal) return
  const stage = getMainStageByOrdinal(target.stageOrdinal)
  if (!stage) return

  const result = resolveMainStageVictory(game.value.player, game.value.journey, stage, Boolean(target.isReplay))
  if (!result) return
  battleRewardGranted = true
  game.value.journey = result.journey
  game.value.player = result.player
  combatReward.value = result.reward
  if (target.isReplay) {
    const rewardLabel = `${formatMainStageReward(result.reward)}${result.reward.eliteBonus ? ' · 精英掉落' : ''}`
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

  game.value.logs = prependGameLog(game.value.logs, {
    id: `battle-${Date.now()}`,
    category: '战斗',
    time: '刚才',
    text: `你闯过了第${stage.chapter}章第${stage.stage}关，击败${encounter.enemyName}。`,
    reward: formatMainStageReward(result.reward),
  })
  persist()
  scheduleNextAutoBattle()
}

function closeCombatModal(): void {
  const target = combatTarget.value
  if (target?.kind === 'dungeon' && target.dungeonId && target.dungeonLayer && combatEncounter.value?.status !== 'won') {
    game.value.dungeons = cancelDungeonChallenge(game.value.dungeons, target.dungeonId, target.dungeonLayer)
    persist()
  }
  stopAutoBattle()
  stopCombatTimer()
  combatAction.value = null
  combatModalOpen.value = false
}

function equipEquipment(slot: EquipmentSlot, equipment: Equipment): void {
  if (game.value.player.equippedEquipment[slot]?.equipmentId === equipment.id) return
  game.value.player = equipPlayerEquipment(game.value.player, slot, equipment, game.value.lottery.ownedEquipmentIds)
  persist()
}

function unequipEquipment(slot: EquipmentSlot): void {
  if (!game.value.player.equippedEquipment[slot]) return
  game.value.player = unequipPlayerEquipment(game.value.player, slot)
  persist()
}

function equipMartialArt(slot: MartialArtSlot, art: MartialArt): void {
  game.value.player = equipPlayerMartialArt(game.value.player, slot, art, game.value.lottery.ownedMartialArtIds)
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
  notify(art.kind === 'inner'
    ? `${art.name}强化成功，吐纳效率已提高。`
    : `${art.name}强化成功，主动招式效果已提高。`)
}

function ascendMartial(art: MartialArt): void {
  const result = ascendMartialArt(game.value.player, art, game.value.lottery.ownedMartialArtIds)
  if (!result) {
    notify('升阶材料不足，先积累心得、同名功法或心法残印。')
    return
  }
  game.value.player = result.player
  game.value.lottery = { ...game.value.lottery, ownedMartialArtIds: result.ownedMartialArtIds }
  addPracticeLog(`你为${art.name}升阶，功法威势更上一层。`, result.consumedTokens ? `消耗${result.consumedTokens}枚心法残印` : '功法火候提升')
  persist()
  notify(`${art.name}升至第${result.player.martialRanks[art.id]}阶。`)
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

function ascendEquipmentItem(equipment: Equipment): void {
  const requirement = getEquipmentAscensionRequirement(game.value.player, equipment)
  const result = ascendEquipment(game.value.player, game.value.lottery, equipment)
  if (!result) {
    notify('装备升阶材料不足，先去秘境、商会或抽奖积累。')
    return
  }
  game.value.player = result.player
  game.value.lottery = result.lottery
  addPracticeLog(`你为${equipment.name}升阶，装备威势更上一层。`, `消耗 ${requirement.forge} 铸材${requirement.essence ? `、${requirement.essence} 装备精魄` : ''}${requirement.duplicates ? `、${requirement.duplicates} 件同名装备` : ''}`)
  persist()
  notify(`${equipment.name}升至第${result.player.equipmentRanks[equipment.id]}阶。`)
}

function refineEquipmentItem(equipment: Equipment): void {
  const result = refineEquipment(game.value.player, equipment)
  if (!result) {
    notify('洗炼石不足，或该装备尚未装备。')
    return
  }
  game.value.player = result.player
  addPracticeLog(`你重新洗炼${equipment.name}，获得${getEquipmentRefinementStatLabel(result.refinement.stat)}词条。`, `+${result.refinement.amount} ${getEquipmentRefinementStatLabel(result.refinement.stat)}`)
  persist()
  notify(`${equipment.name}洗炼完成。`)
}

function socketGem(slot: EquipmentSlot, gemIndex: number, gemId: string): void {
  const result = socketEquipmentGem(game.value.player, slot, gemIndex, gemId)
  if (!result) {
    notify('该宝石无法镶嵌到此槽位。')
    return
  }
  game.value.player = result
  persist()
  notify('宝石镶嵌成功。')
}

function unlockGemSlot(slot: EquipmentSlot): void {
  const result = unlockEquipmentGemSlot(game.value.player, slot)
  if (!result) {
    notify(`需要装备可开孔且拥有至少 ${EQUIPMENT_GEM_SOCKET_COST} 琅玉。`)
    return
  }
  game.value.player = result
  addPracticeLog('你为装备开启了一枚宝石孔。', `-${EQUIPMENT_GEM_SOCKET_COST} 琅玉`)
  persist()
  notify('宝石孔开启成功。')
}

function removeGem(slot: EquipmentSlot, gemIndex: number): void {
  const result = removeEquipmentGem(game.value.player, slot, gemIndex)
  if (!result) return
  game.value.player = result
  persist()
  notify('宝石已取下并放回背包。')
}

function useItem(itemId: string): void {
  const result = useInventoryItem(game.value.player, itemId)
  if (!result) {
    notify('该道具暂时无法使用。')
    return
  }
  game.value.player = result.player
  addPracticeLog(`你服下${result.item.name}，药力融入周身。`, result.item.description)
  persist()
  notify(`${result.item.name}使用成功，永久效果已生效。`)
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

function purchaseShopProduct(productId: string): void {
  const product = getSilverShopProduct(productId)
  const offer = getSilverShopOffer(game.value.journey, productId)
  if (!product || !offer) return
  if (getSilverShopPurchaseRemaining(game.value.shop, productId) < 1) {
    notify('今日限购已满，明日再来。')
    return
  }
  if (game.value.player.silver < offer.price) {
    notify('银两不足，继续闯荡积累。')
    return
  }
  const result = purchaseSilverShopProduct(game.value.player, game.value.cultivation, game.value.journey, game.value.shop, productId)
  if (!result) return
  game.value.player = result.player
  game.value.cultivation = result.cultivation
  game.value.shop = result.shop
  const reward = result.offer.rewards.map((entry) => `+${entry.amount} ${entry.type === 'forge' ? '铸材' : entry.type === 'insight' ? '心得' : entry.type === 'innerForce' ? '内力' : getInventoryItemById(entry.itemId ?? '')?.name ?? '道具'}`).join(' · ')
  game.value.logs = prependGameLog(game.value.logs, {
    id: `shop-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: `你在江湖商会购得${product.name}。`,
    reward: `-${result.offer.price} 银两 · ${reward}`,
  })
  persist()
  notify(`购入${product.name}，${reward}。`)
}

function offerIdol(idolId: IdolId): void {
  const result = offerToIdol(game.value.player, game.value.temple, idolId)
  if (!result) {
    notify('香火不足，或这座神像已供奉至圆满。')
    return
  }
  game.value.player = result.player
  game.value.temple = result.temple
  game.value.player = getPlayerPower(game.value.player, game.value.temple) === game.value.player.power
    ? game.value.player
    : { ...game.value.player, power: getPlayerPower(game.value.player, game.value.temple) }
  game.value.logs = prependGameLog(game.value.logs, {
    id: `idol-${Date.now()}`,
    category: '收获',
    time: '刚才',
    text: `你向武庙供奉香火，${getIdolConfig(result.idol)?.name ?? '神像'}有所回应。`,
    reward: `供奉${getIdolConfig(result.idol)?.name ?? '神像'} · ${result.rank}级`,
  })
  persist()
  notify(`${getIdolConfig(result.idol)?.name ?? '神像'}已供奉至${result.rank}级。`)
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
  document.addEventListener('visibilitychange', handleVisibilityChange)
  accrueAndPractice()
  tick = window.setInterval(() => {
    accrueAndPractice()
  }, 1000)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopAutoBattle()
  window.clearInterval(tick)
  stopCombatTimer()
  window.clearTimeout(powerChangeTimer)
  flushPendingSave()
})
</script>

<template>
  <div class="app-shell">
    <GameHeader :game="game" :player-power="playerPower">
      <GameNav :active="activeView" :cultivation-ready="cultivationReady" @change="setView" />
    </GameHeader>
    <div class="app-body">
      <main class="content">
        <header class="view-heading"><div><span class="kicker">{{ viewMeta[activeView].hint }}</span><h1>{{ viewMeta[activeView].label }}</h1></div><span class="save-state" :class="{ failed: saveState === 'failed' }" aria-live="polite">{{ saveState === 'saved' ? '● 本地习武记录已保存' : '● 保存失败，仅保留当前会话' }}</span></header>
        <PracticeView v-if="activeView === 'practice'" :game="game" @practice="practiceCultivation" @breakthrough="breakThroughCultivation" @toggle-auto="toggleAutoCultivation" @claim-daily-check-in="claimDailyCheckInReward" @claim-daily-material-bounty="claimDailyMaterialBountyReward" @claim-weekly-material-bounty="claimWeeklyMaterialBountyReward" @navigate="setView" />
        <JourneyView v-else-if="activeView === 'journey'" :game="game" :player-power="playerPower" :player-stats="playerCombatStats" :auto-battle-active="autoBattleActive" @battle-main="openMainBattle" @start-battle-main="startMainBattle" @toggle-auto-battle="toggleAutoBattle" />
        <DungeonView v-else-if="activeView === 'dungeon'" :game="game" @battle="openDungeonBattle" @sweep="sweepDungeonLayer" />
        <TempleView v-else-if="activeView === 'temple'" :game="game" @offer="offerIdol" />
        <BagView v-else-if="activeView === 'bag'" :game="game" @equip-equipment="equipEquipment" @unequip-equipment="unequipEquipment" @enhance-equipment="enhanceEquipmentItem" @ascend-equipment="ascendEquipmentItem" @refine-equipment="refineEquipmentItem" @socket-gem="socketGem" @remove-gem="removeGem" @unlock-gem-slot="unlockGemSlot" @equip-martial="equipMartialArt" @unequip-martial="unequipMartialArt" @enhance-art="enhanceMartial" @ascend-art="ascendMartial" @use-item="useItem" @synthesize-gem="synthesizeGemItem" />
        <LotteryView v-else-if="activeView === 'lottery'" :game="game" :draw-result="lotteryDrawResult" @draw="startLotteryDraw" />
        <SilverShopView v-else :game="game" @purchase="purchaseShopProduct" />
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
