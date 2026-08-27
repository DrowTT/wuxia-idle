import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CombatPassiveEffect } from '../src/domain/types'
import { advanceEncounter, advanceEncounterAction, createEncounter, getHitChance, grantNextAttackGuaranteedDodge, grantNextAttackGuaranteedHit } from '../src/domain/combat'
import { setAutoPractice } from '../src/domain/game'
import { EQUIPMENT, EQUIPMENT_SLOTS, INVENTORY_ITEMS, LOTTERY_GRADE_NAMES, LOTTERY_GRADE_RATES, MAX_CULTIVATION_OFFLINE_MS, MAX_DODGE_RATE, PRACTICE_PROGRESS_PER_ACTION, REALMS, accrueInnerForce, ascendEquipment, ascendMartialArt, advanceMainJourney, breakThroughRealm, canAscendEquipment, canAscendMartialArt, canBreakThrough, canClaimDailyCheckIn, canClaimDailyMaterialBounty, canClaimWeeklyMaterialBounty, canEnhanceEquipment, canEnterDungeon, canRefineEquipment, canSynthesizeGem, canUnlockEquipmentGemSlot, cancelDungeonChallenge, claimDailyCheckIn, claimDailyMaterialBounty, claimWeeklyMaterialBounty, createCombatStats, createEquipmentLoadout, createInitialGame, drawLottery, enhanceEquipment, enhanceMartialArt, enterDungeon, equipPlayerEquipment, equipPlayerMartialArt, formatCompactIntegerNumber, formatCompactNumber, formatIntegerNumber, getCombatPower, getCurrentMainStage, getDungeonAttemptsRemaining, getDungeonEnemies, getDungeonHighestCleared, getEliteEnemyCount, getEquipmentAscensionRequirement, getEquipmentCombatBonuses, getEquipmentCombatRates, getEquipmentDuplicateCount, getEquipmentEnhancementCost, getEquipmentEnhancementLevel, getEquipmentGemSocketLimit, getEquipmentRefinement, getEquipmentSetActivations, getEquippedEquipment, getEquippedMartialArts, getGemSynthesisSuccessRate, getGemSynthesisTarget, getInnerForceRate, getInnerForceRateBonus, getMainStage, getMainStageReplayReward, getMartialActiveSkill, getMartialAscensionRequirement, getMartialCombatBonuses, getMartialEnhancementCost, getMartialMastery, getPlayerCombatPassives, getPlayerCombatStats, getPlayerOuterSkills, getPlayerPower, getPracticeCost, getRealm, getRealmBaseCombatStats, getRealmInnerForceRate, getRealmInnerForceRateBonus, getSilverShopOffer, getSilverShopPurchaseRemaining, getStagesPerChapter, getVisibleMainChapters, hasMartialWeaponAffinity, isEliteMainStage, loadGame, normalizeCombatStats, normalizeRealmId, practiceOnce, prependGameLog, purchaseSilverShopProduct, recordDungeonMaterialBountyWin, refineEquipment, removeEquipmentGem, resolveDungeonReward, resolveMainStageVictory, saveGame, socketEquipmentGem, sweepDungeon, synthesizeGem, unlockEquipmentGemSlot, unequipPlayerEquipment, useInventoryItem } from '../src/domain/game'
import {
  DUNGEONS,
  COMBAT_BALANCE,
  DAILY_CHECK_IN_REWARD,
  EQUIPMENT_CATEGORIES,
  INITIAL_EQUIPMENT_LOADOUT,
  INITIAL_PLAYER_PROFILE,
  LOTTERY_DRAW_COST,
  LOTTERY_DRAW_COUNTS,
  LOTTERY_EQUIPMENT_PRIZE_IDS,
  LOTTERY_MARTIAL_PRIZE_IDS,
  MAIN_STORY_CHAPTERS,
  MAIN_STORY_CHAPTER_CONFIGS,
  MAIN_STORY_RULES,
  MARTIAL_ARTS,
  MARTIAL_ASCENSION_TOKEN_ID,
  EQUIPMENT_ASCENSION_TOKEN_ID,
  STARTER_EQUIPMENT_IDS,
  STARTER_MARTIAL_ART_IDS,
  getMainStoryStageMultiplier,
  compareEquipmentInventory,
  compareMartialArtInventory,
  SILVER_SHOP_PRODUCTS,
} from '../src/data'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('content data integrity', () => {
  it('uses unique ids and valid equipment slot definitions', () => {
    const equipmentIds = EQUIPMENT.map((equipment) => equipment.id)
    const martialArtIds = MARTIAL_ARTS.map((art) => art.id)

    expect(new Set(equipmentIds).size).toBe(equipmentIds.length)
    expect(new Set(martialArtIds).size).toBe(martialArtIds.length)
    expect(new Set(REALMS.map((realm) => realm.id)).size).toBe(REALMS.length)
    expect(EQUIPMENT_CATEGORIES).toContain('ring')
    expect(EQUIPMENT_SLOTS).toContain('ring1')
    expect(EQUIPMENT_SLOTS).toContain('ring2')
    expect(EQUIPMENT).toHaveLength(105)
    expect(MARTIAL_ARTS).toHaveLength(41)
    const gems = INVENTORY_ITEMS.filter((item) => item.category === 'gem')
    expect(gems).toHaveLength(24)
    expect(new Set(gems.map((gem) => `${gem.gemFamily}:${gem.gemTier}`)).size).toBe(24)
    for (const equipment of EQUIPMENT) {
      expect(Object.values(equipment.combatRates ?? {}).some((value) => value > 0)).toBe(true)
      for (const stat of ['maxHealth', 'attack', 'defense', 'speed'] as const) {
        expect(equipment.combatBonuses?.[stat] ?? 0).toBeLessThanOrEqual(70)
      }
    }
    for (const belt of EQUIPMENT.filter((equipment) => equipment.categoryId === 'belt')) {
      for (const stat of ['maxHealth', 'attack', 'defense', 'speed'] as const) {
        expect(belt.combatRates?.[stat] ?? 0).toBeGreaterThan(0)
      }
    }
    expect(DUNGEONS.map((dungeon) => dungeon.id)).toHaveLength(new Set(DUNGEONS.map((dungeon) => dungeon.id)).size)

    const weaponStyles = new Set(EQUIPMENT.filter((equipment) => equipment.categoryId === 'weapon').map((equipment) => equipment.weaponStyle).filter((style): style is NonNullable<typeof style> => style !== undefined))
    for (const equipment of EQUIPMENT.filter((equipment) => equipment.categoryId === 'weapon')) expect(equipment.weaponStyle).toBeDefined()
    for (const art of MARTIAL_ARTS.filter((art) => art.affinityWeaponStyles?.length)) {
      expect(art.kind).toBe('outer')
      for (const style of art.affinityWeaponStyles ?? []) expect(weaponStyles.has(style)).toBe(true)
    }
  })

  it('keeps JSON-backed content immutable at the data boundary', () => {
    expect(Object.isFrozen(EQUIPMENT)).toBe(true)
    expect(Object.isFrozen(EQUIPMENT[0])).toBe(true)
    expect(Object.isFrozen(MARTIAL_ARTS)).toBe(true)
    expect(Object.isFrozen(MARTIAL_ARTS[0])).toBe(true)
    expect(Object.isFrozen(DUNGEONS)).toBe(true)
    expect(Object.isFrozen(INVENTORY_ITEMS)).toBe(true)
    expect(Object.isFrozen(LOTTERY_EQUIPMENT_PRIZE_IDS)).toBe(true)
    expect(Object.isFrozen(LOTTERY_EQUIPMENT_PRIZE_IDS.white)).toBe(true)
  })

  it('orders inventory by quality before equipment position or martial art type', () => {
    const equipment = [...EQUIPMENT].sort(compareEquipmentInventory)
    expect(equipment[0]?.gradeTone).toBe('red')
    expect(equipment.at(-1)?.gradeTone).toBe('white')
    for (let index = 1; index < equipment.length; index += 1) {
      const previous = equipment[index - 1]!
      const current = equipment[index]!
      if (previous.gradeTone !== current.gradeTone) continue
      expect(EQUIPMENT_CATEGORIES.indexOf(previous.categoryId)).toBeLessThanOrEqual(EQUIPMENT_CATEGORIES.indexOf(current.categoryId))
    }

    const martialArts = [...MARTIAL_ARTS].sort(compareMartialArtInventory)
    expect(martialArts[0]?.gradeTone).toBe('red')
    expect(martialArts.at(-1)?.gradeTone).toBe('white')
    for (let index = 1; index < martialArts.length; index += 1) {
      const previous = martialArts[index - 1]!
      const current = martialArts[index]!
      if (previous.gradeTone !== current.gradeTone) continue
      expect(previous.kind === 'inner' || current.kind === 'outer').toBe(true)
    }
  })

  it('gives every inner art a complete cultivation rate bonus', () => {
    const innerArts = MARTIAL_ARTS.filter((art) => art.kind === 'inner')
    expect(innerArts.length).toBeGreaterThan(0)
    for (const art of innerArts) {
      const hasFlatRate = art.innerForceRateBase !== undefined && art.innerForceRatePerMastery !== undefined
      const hasRateMultiplier = art.innerForceRateMultiplierBase !== undefined && art.innerForceRateMultiplierPerMastery !== undefined
      expect(hasFlatRate || hasRateMultiplier).toBe(true)
    }
  })

  it('keeps every lottery prize and starter item resolvable in its content library', () => {
    const equipmentById = new Map(EQUIPMENT.map((equipment) => [equipment.id, equipment]))
    const martialArtsById = new Map(MARTIAL_ARTS.map((art) => [art.id, art]))

    for (const [tone, ids] of Object.entries(LOTTERY_EQUIPMENT_PRIZE_IDS)) {
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) expect(equipmentById.get(id)?.gradeTone).toBe(tone)
    }
    for (const [tone, ids] of Object.entries(LOTTERY_MARTIAL_PRIZE_IDS)) {
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) expect(martialArtsById.get(id)?.gradeTone).toBe(tone)
    }
    for (const id of STARTER_EQUIPMENT_IDS) expect(equipmentById.has(id)).toBe(true)
    for (const id of STARTER_MARTIAL_ART_IDS) expect(martialArtsById.has(id)).toBe(true)
    for (const id of Object.values(INITIAL_EQUIPMENT_LOADOUT)) expect(id === null || equipmentById.has(id)).toBe(true)
    for (const id of Object.values(INITIAL_PLAYER_PROFILE.martialLoadout)) expect(id === null || martialArtsById.has(id)).toBe(true)
    const lotteryEquipmentIds = new Set(Object.values(LOTTERY_EQUIPMENT_PRIZE_IDS).flat())
    const lotteryMartialIds = new Set(Object.values(LOTTERY_MARTIAL_PRIZE_IDS).flat())
    expect(lotteryEquipmentIds).toEqual(new Set(EQUIPMENT.map((equipment) => equipment.id)))
    expect(lotteryMartialIds).toEqual(new Set(MARTIAL_ARTS.map((art) => art.id)))
    expect(new Set(STARTER_EQUIPMENT_IDS)).toEqual(new Set(Object.values(INITIAL_EQUIPMENT_LOADOUT).filter((id): id is string => id !== null)))
  })

  it('defines valid daily-limited silver shop goods', () => {
    expect(SILVER_SHOP_PRODUCTS.length).toBeGreaterThanOrEqual(4)
    expect(new Set(SILVER_SHOP_PRODUCTS.map((product) => product.id)).size).toBe(SILVER_SHOP_PRODUCTS.length)
    for (const product of SILVER_SHOP_PRODUCTS) {
      expect(product.basePrice).toBeGreaterThan(0)
      expect(product.dailyLimit).toBeGreaterThan(0)
      expect(product.growthEveryChapters).toBeGreaterThan(0)
      expect(product.rewards.length).toBeGreaterThan(0)
      expect(product.rewards.every((reward) => reward.amount > 0)).toBe(true)
    }
  })

  it('covers all chapters exactly once and generates contiguous stage ordinals', () => {
    let previousThroughChapter = 0
    let previousOrdinal = 0
    for (const rule of MAIN_STORY_RULES) {
      expect(rule.throughChapter).toBeGreaterThan(previousThroughChapter)
      previousThroughChapter = rule.throughChapter
    }
    expect(previousThroughChapter).toBe(MAIN_STORY_CHAPTERS)

    for (let chapter = 1; chapter <= MAIN_STORY_CHAPTERS; chapter += 1) {
      const stages = getStagesPerChapter(chapter)
      expect(stages).toBeGreaterThan(0)
      for (let stage = 1; stage <= stages; stage += 1) {
        const mainStage = getMainStage(chapter, stage)
        expect(mainStage).not.toBeNull()
        expect(mainStage!.ordinal).toBe(previousOrdinal + 1)
        expect(mainStage!.enemies).toHaveLength(getEliteEnemyCount(chapter, stage))
        previousOrdinal = mainStage!.ordinal
      }
    }
    expect(getMainStage(MAIN_STORY_CHAPTERS, getStagesPerChapter(MAIN_STORY_CHAPTERS) + 1)).toBeNull()
  })

  it('uses explicit chapter baselines with only a small linear increase inside each chapter', () => {
    for (const chapter of MAIN_STORY_CHAPTER_CONFIGS) {
      expect(getMainStoryStageMultiplier(chapter.chapter, 1)).toBe(1)
      expect(getMainStoryStageMultiplier(chapter.chapter, chapter.stages)).toBeCloseTo(1 + chapter.stageGrowth)
    }

    for (let chapter = 2; chapter <= MAIN_STORY_CHAPTERS; chapter += 1) {
      const previous = getMainStage(chapter - 1, getStagesPerChapter(chapter - 1))!
      const current = getMainStage(chapter, 1)!
      const previousNormal = getMainStage(chapter - 1, Math.max(1, getStagesPerChapter(chapter - 1) - 1))!

      expect(current.enemies[0]!.stats.maxHealth).toBeGreaterThan(previousNormal.enemies[0]!.stats.maxHealth)
      expect(current.enemies[0]!.stats.attack).toBeGreaterThan(previousNormal.enemies[0]!.stats.attack)
      expect(current.enemies[0]!.stats.defense).toBeGreaterThan(previousNormal.enemies[0]!.stats.defense)
      expect(previous.enemies.length).toBeGreaterThan(0)
    }

    const lateChapterStart = getMainStage(81, 1)!
    const lateChapterEnd = getMainStage(81, lateChapterStart.stagesInChapter - 1)!
    const nextChapterStart = getMainStage(82, 1)!
    expect(lateChapterEnd.enemies[0]!.stats.maxHealth / lateChapterStart.enemies[0]!.stats.maxHealth).toBeCloseTo(1.06)
    expect(nextChapterStart.enemies[0]!.stats.maxHealth).toBeGreaterThan(lateChapterEnd.enemies[0]!.stats.maxHealth * 1.05)
  })

  it('keeps the first fifty chapters on the intended long-term combat-power curve', () => {
    const milestones = [
      { chapter: 15, minimum: 10_000, maximum: 11_500 },
      { chapter: 30, minimum: 100_000, maximum: 110_000 },
      { chapter: 40, minimum: 400_000, maximum: 440_000 },
      { chapter: 50, minimum: 1_800_000, maximum: 2_100_000 },
    ]

    let previousPower = 0
    for (const milestone of milestones) {
      const stage = getMainStage(milestone.chapter, 1)!
      const enemyPower = stage.enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0)
      expect(enemyPower).toBeGreaterThanOrEqual(milestone.minimum)
      expect(enemyPower).toBeLessThanOrEqual(milestone.maximum)
      expect(enemyPower).toBeGreaterThan(previousPower)
      previousPower = enemyPower
    }

    const chapterFifteenElite = getMainStage(15, 16)!
    const chapterFifteenStart = getMainStage(15, 1)!
    const elitePower = chapterFifteenElite.enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0)
    const startPower = chapterFifteenStart.enemies.reduce((total, enemy) => total + getCombatPower(enemy.stats), 0)
    expect(elitePower).toBeGreaterThan(startPower)
  })
})

describe('silver shop', () => {
  const today = new Date(2026, 7, 19, 12).getTime()

  it('deducts silver, grants configured resources, and enforces the daily limit atomically', () => {
    const game = createInitialGame()
    const product = SILVER_SHOP_PRODUCTS.find((entry) => entry.id === 'cold-iron-supply')!
    const offer = getSilverShopOffer(game.journey, product.id)!
    const first = purchaseSilverShopProduct(game.player, game.cultivation, game.journey, game.shop, product.id, today)!

    expect(first.player.silver).toBe(game.player.silver - offer.price)
    expect(first.player.forge).toBe(game.player.forge + offer.rewards.find((reward) => reward.type === 'forge')!.amount)
    expect(first.cultivation).toEqual(game.cultivation)
    expect(getSilverShopPurchaseRemaining(first.shop, product.id, today)).toBe(product.dailyLimit - 1)

    let latest = first
    for (let count = 1; count < product.dailyLimit; count += 1) {
      latest = purchaseSilverShopProduct({ ...latest.player, silver: 99_999 }, latest.cultivation, game.journey, latest.shop, product.id, today)!
    }
    expect(getSilverShopPurchaseRemaining(latest.shop, product.id, today)).toBe(0)
    expect(purchaseSilverShopProduct({ ...latest.player, silver: 99_999 }, latest.cultivation, game.journey, latest.shop, product.id, today)).toBeNull()
  })

  it('resets a daily limit by date, scales with chapter progression, and credits inner force to cultivation', () => {
    const game = createInitialGame()
    const product = SILVER_SHOP_PRODUCTS.find((entry) => entry.id === 'nourishing-qi-pill')!
    const startOffer = getSilverShopOffer(game.journey, product.id)!
    const laterJourney = { ...game.journey, currentChapter: 4 }
    const laterOffer = getSilverShopOffer(laterJourney, product.id)!
    const result = purchaseSilverShopProduct({ ...game.player, silver: 99_999 }, game.cultivation, game.journey, game.shop, product.id, today)!
    const nextDay = today + 24 * 60 * 60 * 1000

    expect(laterOffer.price).toBeGreaterThan(startOffer.price)
    expect(laterOffer.rewards[0]!.amount).toBeGreaterThan(startOffer.rewards[0]!.amount)
    expect(result.cultivation.amount).toBe(game.cultivation.amount + startOffer.rewards[0]!.amount)
    expect(getSilverShopPurchaseRemaining(result.shop, product.id, nextDay)).toBe(product.dailyLimit)
  })
})

describe('lottery', () => {
  it('uses traditional quality names and normalized rates', () => {
    expect(LOTTERY_DRAW_COST).toBe(160)
    expect(LOTTERY_DRAW_COUNTS).toEqual([1, 10])
    expect(LOTTERY_GRADE_NAMES).toEqual({ white: '普通', green: '优秀', blue: '精良', purple: '史诗', orange: '传说', red: '神话' })
    expect(LOTTERY_GRADE_RATES.orange).toBe(2.5)
    expect(LOTTERY_GRADE_RATES.red).toBe(0.8)
    expect(Object.values(LOTTERY_GRADE_RATES).reduce((total, rate) => total + rate, 0)).toBeCloseTo(100)
  })

  it('keeps pool pity separate and guarantees purple quality on the tenth miss', () => {
    const game = createInitialGame()
    const result = drawLottery(game.player, game.lottery, 'equipment', 10, () => 0, 100)

    expect(result?.result.rewards.at(-1)?.gradeTone).toBe('purple')
    expect(result?.lottery.pity.equipment.noPurpleDraws).toBe(0)
    expect(result?.lottery.pity.martial).toEqual({ noPurpleDraws: 0, noOrangeDraws: 0 })
    expect(result?.player.langyu).toBe(game.player.langyu - LOTTERY_DRAW_COST * 10)
  })

  it('uses a weighted legendary or mythic result for high-grade pity', () => {
    const game = createInitialGame()
    const lotteryAtHighGradePity = {
      ...game.lottery,
      pity: {
        equipment: { noPurpleDraws: 9, noOrangeDraws: 49 },
        martial: { noPurpleDraws: 0, noOrangeDraws: 0 },
      },
    }

    const mythic = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST }, lotteryAtHighGradePity, 'equipment', 1, () => .05, 101)
    const legendary = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST }, lotteryAtHighGradePity, 'equipment', 1, () => .5, 102)

    expect(mythic?.result.rewards[0]?.gradeTone).toBe('red')
    expect(legendary?.result.rewards[0]?.gradeTone).toBe('orange')
    expect(mythic?.lottery.pity.equipment).toEqual({ noPurpleDraws: 0, noOrangeDraws: 0 })
    expect(legendary?.lottery.pity.equipment).toEqual({ noPurpleDraws: 0, noOrangeDraws: 0 })
  })

  it('grants red equipment directly from the equipment pool', () => {
    const game = createInitialGame()
    const result = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST }, game.lottery, 'equipment', 1, () => .9999, 200)
    const redPrizeId = LOTTERY_EQUIPMENT_PRIZE_IDS.red.at(-1)!

    expect(result?.lottery.ownedEquipmentIds).toContain(redPrizeId)
    expect(result?.result.rewards).toEqual([expect.objectContaining({ kind: 'equipment', itemId: redPrizeId, name: EQUIPMENT.find((equipment) => equipment.id === redPrizeId)?.name })])
  })

  it('keeps duplicate equipment as additional inventory copies', () => {
    const game = createInitialGame()
    const first = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST * 2 }, game.lottery, 'equipment', 1, () => .9999, 200)!
    const second = drawLottery(first.player, first.lottery, 'equipment', 1, () => .9999, 201)!
    const redPrizeId = LOTTERY_EQUIPMENT_PRIZE_IDS.red.at(-1)!

    expect(second.lottery.ownedEquipmentIds.filter((id) => id === redPrizeId)).toHaveLength(2)
    expect(second.result.rewards).toEqual([expect.objectContaining({ kind: 'equipment', itemId: redPrizeId })])
    expect(second.player.forge).toBe(game.player.forge)
  })

  it('awards the martial ascension item from an independent legendary chance', () => {
    const game = createInitialGame()
    let call = 0
    const result = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST }, game.lottery, 'martial', 1, () => call++ === 0 ? .98 : .05, 300)

    expect(result?.result.rewards[0]).toMatchObject({ kind: 'item', itemId: MARTIAL_ASCENSION_TOKEN_ID, gradeTone: 'orange' })
    expect(result?.player.items[MARTIAL_ASCENSION_TOKEN_ID]).toBe(1)
  })

  it('awards the equipment ascension item from the equipment pool', () => {
    const game = createInitialGame()
    let call = 0
    const result = drawLottery({ ...game.player, langyu: LOTTERY_DRAW_COST }, game.lottery, 'equipment', 1, () => call++ === 0 ? .98 : .05, 301)

    expect(result?.result.rewards[0]).toMatchObject({ kind: 'item', itemId: EQUIPMENT_ASCENSION_TOKEN_ID, gradeTone: 'orange' })
    expect(result?.player.items[EQUIPMENT_ASCENSION_TOKEN_ID]).toBe(1)
  })
})

describe('martial ascension', () => {
  it('keeps outer arts out of panel attributes while scaling their active skill', () => {
    const game = createInitialGame()
    const outer = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const inner = MARTIAL_ARTS.find((item) => item.id === 'nirvana-heart')!
    const basePlayer = { ...game.player, martialRanks: {}, martialLoadout: { ...game.player.martialLoadout, inner1: inner.id, outer1: outer.id } }
    const maxPlayer = { ...basePlayer, martialRanks: { [outer.id]: 10, [inner.id]: 10 } }

    expect(getMartialCombatBonuses(maxPlayer, outer)).toBeUndefined()
    expect(getMartialActiveSkill(maxPlayer, outer)?.damageMultiplier).toBeGreaterThan(getMartialActiveSkill(basePlayer, outer)?.damageMultiplier ?? 0)
    const enhancedOuter = enhanceMartialArt({ ...basePlayer, insight: 100 }, outer)
    expect(enhancedOuter).not.toBeNull()
    expect(getMartialActiveSkill(enhancedOuter!, outer)?.damageMultiplier).toBeGreaterThan(getMartialActiveSkill(basePlayer, outer)?.damageMultiplier ?? 0)
    expect(getInnerForceRateBonus(maxPlayer)).toBeCloseTo(inner.innerForceRateBase! * 2)

    const unmastered = { ...basePlayer, mastery: { ...basePlayer.mastery, [outer.id]: 0 } }
    const maxRank = { ...unmastered, martialRanks: { [outer.id]: 10 } }
    expect(getMartialActiveSkill(maxRank, outer)?.damageMultiplier).toBeCloseTo(outer.activeSkill!.damageMultiplier * 2)
  })

  it('takes opening rage only from equipped inner arts', () => {
    const game = createInitialGame()
    const outer = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const inner = MARTIAL_ARTS.find((item) => item.id === 'nirvana-heart')!
    const player = { ...game.player, martialLoadout: { ...game.player.martialLoadout, inner1: inner.id, outer1: outer.id } }
    const encounter = createEncounter({
      playerStats: createCombatStats({ attack: 10, speed: 100 }),
      enemyStats: createCombatStats({ maxHealth: 100_000, speed: 1 }),
      playerPassives: getPlayerCombatPassives(player),
      playerOuterSkills: [],
    })

    expect(encounter.playerRage).toBe(150)
  })

  it('uses insight for the first five ranks and scales the outer active skill to max rank', () => {
    const game = createInitialGame()
    const art = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const player = { ...game.player, insight: 50, martialRanks: {}, martialLoadout: { ...game.player.martialLoadout, outer1: art.id, outer2: null } }
    expect(getMartialAscensionRequirement(player, art)).toMatchObject({ rank: 0, insight: 50, duplicates: 0 })
    const first = ascendMartialArt(player, art, [art.id])
    expect(first?.player.martialRanks[art.id]).toBe(1)
    expect(first?.player.insight).toBe(0)

    const maxPlayer = { ...player, martialRanks: { [art.id]: 9 }, items: { [MARTIAL_ASCENSION_TOKEN_ID]: 2 } }
    const maxed = ascendMartialArt(maxPlayer, art, [art.id])
    expect(maxed?.player.martialRanks[art.id]).toBe(10)
    expect(maxed?.player.items[MARTIAL_ASCENSION_TOKEN_ID]).toBe(0)
    expect(maxed?.consumedTokens).toBe(2)
    expect(getPlayerCombatPassives(maxed!.player)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'skill-rage-refund', value: 25 }),
    ]))
    expect(getMartialActiveSkill(maxed!.player, art)?.damageMultiplier).toBeGreaterThan(art.activeSkill!.damageMultiplier)
    expect(canAscendMartialArt(maxed!.player, art, maxed!.ownedMartialArtIds)).toBe(false)
  })

  it('stacks quality-based inner rage effects and refunds rage immediately after a skill', () => {
    const game = createInitialGame()
    const orange = MARTIAL_ARTS.find((item) => item.id === 'great-vast-manual')!
    const red = MARTIAL_ARTS.find((item) => item.id === 'nirvana-heart')!
    const outer = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const player = { ...game.player, martialLoadout: { inner1: orange.id, inner2: red.id, outer1: outer.id, outer2: null } }
    const passives = getPlayerCombatPassives(player)
    const encounter = createEncounter({
      playerStats: createCombatStats({ attack: 10, speed: 200, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 100_000, speed: 1 }),
      playerPassives: passives,
      playerOuterSkills: getPlayerOuterSkills(player),
      random: () => 0.5,
    })
    expect(encounter.playerRage).toBe(200)
    encounter.status = 'fighting'
    const firstSkill = advanceEncounterAction(encounter)
    expect(firstSkill.action?.skill).toBeDefined()
    // The orange and red inner arts both refund rage after the same skill.
    expect(firstSkill.encounter.playerRage).toBe(125)

    const maxRed = { ...player, martialRanks: { [red.id]: 10 } }
    const maxedEncounter = createEncounter({
      playerStats: createCombatStats({ attack: 10, speed: 200, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 100_000, speed: 1 }),
      playerPassives: getPlayerCombatPassives(maxRed),
      playerOuterSkills: [],
    })
    expect(maxedEncounter.playerRage).toBe(350)
  })

  it('applies the purple inner art skill refund after a skill', () => {
    const game = createInitialGame()
    const purple = MARTIAL_ARTS.find((item) => item.id === 'inner-breath')!
    const outer = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const player = { ...game.player, martialLoadout: { inner1: purple.id, inner2: null, outer1: outer.id, outer2: null } }
    const encounter = createEncounter({
      playerStats: createCombatStats({ attack: 10, speed: 200, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 100_000, speed: 1 }),
      playerPassives: getPlayerCombatPassives(player),
      playerOuterSkills: getPlayerOuterSkills(player),
      random: () => 0.5,
    })
    encounter.status = 'fighting'
    encounter.playerRage = 100

    const step = advanceEncounterAction(encounter)

    expect(step.action?.skill).toBeDefined()
    expect(step.encounter.playerRage).toBe(25)
  })

  it('does not grant rage from an outer skill before the rage threshold', () => {
    const game = createInitialGame()
    const art = MARTIAL_ARTS.find((item) => item.id === 'one-sword')!
    const player = { ...game.player, martialLoadout: { ...game.player.martialLoadout, outer1: art.id, outer2: null } }
    const encounter = createEncounter({ playerStats: createCombatStats({ attack: 10, speed: 100 }), enemyStats: createCombatStats({ maxHealth: 100_000, speed: 1 }), playerPassives: getPlayerCombatPassives(player), playerOuterSkills: getPlayerOuterSkills(player) })
    encounter.status = 'fighting'
    const step = advanceEncounterAction(encounter)
    expect(step.action?.skill).toBeUndefined()
    expect(step.encounter.playerRage).toBe(50)
  })
})

describe('inner force and practice', () => {
  it('changes auto-practice through a domain operation', () => {
    const game = createInitialGame()
    const enabled = setAutoPractice(game.cultivation, true)

    expect(enabled).toMatchObject({ autoPractice: true, amount: game.cultivation.amount })
    expect(game.cultivation.autoPractice).toBe(false)
  })

  it('accrues passively from timestamps and caps offline time', () => {
    const game = createInitialGame()
    const cultivation = { ...game.cultivation, amount: 0, lastAccruedAt: 1_000 }
    const afterOneMinute = accrueInnerForce(cultivation, game.player, 61_000)

    expect(afterOneMinute.amount).toBeCloseTo(60 * getInnerForceRate(game.player))
    expect(afterOneMinute.practiceProgress).toBe(0)
    expect(accrueInnerForce(cultivation, game.player, 1_000 + MAX_CULTIVATION_OFFLINE_MS * 2).amount).toBeCloseTo(MAX_CULTIVATION_OFFLINE_MS / 1000 * getInnerForceRate(game.player))
  })

  it('retains sub-second accrual time between high-frequency settlements', () => {
    const game = createInitialGame()
    const cultivation = { ...game.cultivation, amount: 0, lastAccruedAt: 1_000 }
    const halfSecond = accrueInnerForce(cultivation, game.player, 1_500)
    expect(halfSecond.amount).toBe(0)
    expect(halfSecond.lastAccruedAt).toBe(1_000)
    const fullSecond = accrueInnerForce(halfSecond, game.player, 2_000)
    expect(fullSecond.amount).toBeCloseTo(getInnerForceRate(game.player))
    expect(fullSecond.lastAccruedAt).toBe(2_000)
  })

  it('spends inner force per practice, advances small realms automatically, and reserves breakthroughs for manual action', () => {
    const game = createInitialGame()
    const cost = getPracticeCost(game.player.realmId, game.player.realmLevel)
    const cultivation = { ...game.cultivation, amount: cost, practiceProgress: 100 - PRACTICE_PROGRESS_PER_ACTION }
    const result = practiceOnce(game.player, cultivation)

    expect(result?.player.realmLevel).toBe(game.player.realmLevel + 1)
    expect(result?.cultivation.amount).toBe(0)
    expect(result?.cultivation.practiceProgress).toBe(0)
    expect(result?.advanced).toBe(true)

    const peakPlayer = { ...game.player, realmLevel: 9 }
    const peakCultivation = { ...game.cultivation, amount: getPracticeCost(peakPlayer.realmId, peakPlayer.realmLevel), practiceProgress: 100 - PRACTICE_PROGRESS_PER_ACTION }
    const peakPractice = practiceOnce(peakPlayer, peakCultivation)
    expect(peakPractice?.player.realmLevel).toBe(9)
    expect(peakPractice?.cultivation.practiceProgress).toBe(100)
    expect(canBreakThrough(peakPlayer, peakPractice!.cultivation)).toBe(true)
    expect(breakThroughRealm(peakPlayer, peakPractice!.cultivation)).toMatchObject({ player: { realmId: 'meridian', realmLevel: 1 }, cultivation: { practiceProgress: 0 } })
  })

  it('uses 3% progress steps with the configured higher inner-force costs', () => {
    const actionsPerLevel = Math.ceil(100 / PRACTICE_PROGRESS_PER_ACTION)

    expect(PRACTICE_PROGRESS_PER_ACTION).toBe(3)
    expect(getPracticeCost('acquired', 1)).toBe(126)
    expect(getPracticeCost('acquired', 9)).toBe(544)
    expect(getPracticeCost('acquired', 1) * actionsPerLevel).toBe(4284)
  })

  it('raises the base inner-force panel for every small realm and keeps a 1.8x large-realm curve', () => {
    const game = createInitialGame()
    const afterSmallRealm = { ...game.player, realmLevel: 2 }
    const afterBreakthrough = { ...game.player, realmId: 'meridian' as const, realmLevel: 1 }
    const realmStartRates = REALMS.map((realm) => getInnerForceRate({ ...game.player, martialLoadout: { inner1: null, inner2: null, outer1: null, outer2: null }, realmId: realm.id, realmLevel: 1 }))

    expect(getRealmInnerForceRateBonus(afterSmallRealm)).toBe(0.03)
    expect(getRealmInnerForceRateBonus(afterBreakthrough)).toBe(1.04)
    expect(getInnerForceRate(afterSmallRealm)).toBeGreaterThan(getInnerForceRate(game.player))
    expect(getInnerForceRate(afterBreakthrough)).toBeGreaterThan(getInnerForceRate({ ...game.player, realmLevel: 9 }))
    realmStartRates.slice(1).forEach((rate, index) => expect(rate / realmStartRates[index]!).toBeCloseTo(1.8, 2))

    const finalRealm = { ...game.player, realmId: 'martial-pinnacle' as const, realmLevel: 9 }
    expect(getInnerForceRate(finalRealm)).toBeGreaterThan(300)
    expect(getInnerForceRate(finalRealm)).toBeLessThan(400)
    expect(getInnerForceRateBonus(finalRealm)).toBe(getInnerForceRateBonus(game.player))
    expect(getInnerForceRate(finalRealm)).toBe(getRealmInnerForceRate(finalRealm) + getInnerForceRateBonus(game.player))
  })

  it('repairs an invalid saved practice progress on the next practice action', () => {
    const game = createInitialGame()
    const cost = getPracticeCost(game.player.realmId, game.player.realmLevel)
    const result = practiceOnce(game.player, { ...game.cultivation, amount: cost, practiceProgress: Number.NaN })

    expect(result).toMatchObject({ cultivation: { amount: 0, practiceProgress: PRACTICE_PROGRESS_PER_ACTION }, advanced: false })
  })
})

describe('compact number formatting', () => {
  it('uses stable Chinese units for large resource totals', () => {
    expect(formatCompactNumber(71.5)).toBe('71.5')
    expect(formatCompactNumber(99_999)).toBe('99,999')
    expect(formatCompactNumber(100_000)).toBe('10万')
    expect(formatCompactNumber(123_456)).toBe('12.3万')
    expect(formatCompactNumber(100_000_000)).toBe('1亿')
    expect(formatCompactNumber(123_456_789)).toBe('1.2亿')
  })

  it('rounds displayed inner-force values down to stable integers', () => {
    expect(formatIntegerNumber(983.5)).toBe('983')
    expect(formatIntegerNumber(100_000.9)).toBe('100,000')
  })

  it('uses integer Chinese units for high inner-force costs', () => {
    expect(formatCompactIntegerNumber(99_999.9)).toBe('99,999')
    expect(formatCompactIntegerNumber(1_299_999)).toBe('129万')
    expect(formatCompactIntegerNumber(123_456_789)).toBe('1亿')
  })

  it('creates a late-game bottleneck that heart-method enhancement can ease', () => {
    const game = createInitialGame()
    const baseRate = getInnerForceRate({ ...game.player, martialLoadout: { inner1: null, inner2: null, outer1: null, outer2: null } })
    const startingRate = getInnerForceRate(game.player)
    const heartMethod = { id: 'inner-breath', name: '抱元守一', category: '内功心法', grade: '史诗', gradeTone: 'purple' as const, level: 2, mastery: 36, kind: 'inner' as const, keyword: '吐纳', lore: '', innerForceRateBase: 0.7, innerForceRatePerMastery: 0.05 }
    const studied = enhanceMartialArt({ ...game.player, insight: 100 }, heartMethod)

    expect(startingRate).toBeGreaterThan(baseRate)
    expect(studied?.mastery['inner-breath']).toBe(40)
    expect(studied?.insight).toBe(100 - getMartialEnhancementCost({ ...game.player, insight: 100 }, heartMethod))
    expect(getInnerForceRate(studied!)).toBeGreaterThan(startingRate)
    const finalRealm = { ...studied!, realmId: 'martial-pinnacle' as const, realmLevel: 9 }
    expect(getPracticeCost(finalRealm.realmId, finalRealm.realmLevel) * Math.ceil(100 / PRACTICE_PROGRESS_PER_ACTION)).toBeGreaterThan(getInnerForceRate(finalRealm) * MAX_CULTIVATION_OFFLINE_MS / 1000)
  })
})

describe('realm configuration', () => {
  it('keeps combat power increasing when crossing a realm boundary', () => {
    const game = createInitialGame()

    for (let index = 1; index < REALMS.length; index += 1) {
      const previousRealm = { ...game.player, realmId: REALMS[index - 1]!.id, realmLevel: 9 }
      const nextRealm = { ...game.player, realmId: REALMS[index]!.id, realmLevel: 1 }
      expect(getPlayerPower(nextRealm)).toBeGreaterThan(getPlayerPower(previousRealm))
    }
  })

  it('raises all four basic stats with each level and breakthrough', () => {
    const game = createInitialGame()
    const levelOne = getRealmBaseCombatStats({ ...game.player, realmLevel: 1 })
    const levelTwo = getRealmBaseCombatStats({ ...game.player, realmLevel: 2 })
    const previousPeak = getRealmBaseCombatStats({ ...game.player, realmId: 'body-tempering', realmLevel: 9 })
    const nextRealm = getRealmBaseCombatStats({ ...game.player, realmId: 'meridian', realmLevel: 1 })

    for (const key of ['maxHealth', 'attack', 'defense', 'speed'] as const) {
      expect(levelTwo[key]).toBeGreaterThan(levelOne[key])
      expect(nextRealm[key]).toBeGreaterThan(previousPeak[key])
    }
  })

  it('uses the configured color for every realm and preserves celestial saves through migration', () => {
    expect(Object.fromEntries(REALMS.map((realm) => [realm.label, realm.color]))).toEqual({
      炼体境: '#B0B8C0', 通脉境: '#D6DCE3', 后天境: '#55AF6B', 先天境: '#2F9FA3', 罡气境: '#3B82D0',
      宗师境: '#5969C9', 大宗师境: '#8C58C9', 归真境: '#E07B42', 武圣境: '#D5A63C', 武道极境: '#C84F59',
    })
    expect(getRealm('returning')).toMatchObject({ label: '归真境', tier: 8, color: '#E07B42', foreground: '#FFFFFF' })
    expect(normalizeRealmId('celestial')).toBe('returning')
  })
})

describe('wuxia terminology migration', () => {
  it('rewrites legacy cultivation logs as inner-force practice logs', () => {
    const game = createInitialGame()
    const { autoPractice: _, ...legacyCultivation } = game.cultivation
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({
        ...game,
        cultivation: { ...legacyCultivation, autoAdvance: true },
        logs: [{ id: 'legacy', category: '修行', time: '刚才', text: '小周天运气完成一轮，修为渐稳。', reward: '+280 修为' }],
      }),
      setItem: () => undefined,
    })

    const loaded = loadGame()
    expect(loaded.logs[0]).toMatchObject({ category: '习武', text: '一次吐纳行气已毕，内力渐增。', reward: '+280 内力' })
    expect(loaded.cultivation).toMatchObject({ practiceProgress: 0, autoPractice: true })
  })

  it('resets a non-finite saved practice progress', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, cultivation: { ...game.cultivation, practiceProgress: null } }),
      setItem: () => undefined,
    })

    expect(loadGame().cultivation.practiceProgress).toBe(0)
  })

  it('reports whether browser storage accepted a save', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', { setItem: () => undefined })
    expect(saveGame(game)).toBe(true)

    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota exceeded') } })
    expect(saveGame(game)).toBe(false)
  })

  it('keeps a recovery copy when the local save cannot be parsed', () => {
    let recoveryKey = ''
    let recoveryValue = ''
    vi.stubGlobal('localStorage', {
      getItem: () => '{malformed-save',
      setItem: (key: string, value: string) => {
        recoveryKey = key
        recoveryValue = value
      },
    })

    expect(loadGame().version).toBeGreaterThan(0)
    expect(recoveryKey).toBe('shanhe-wuwen-save-recovery')
    expect(recoveryValue).toBe('{malformed-save')
  })

  it('normalizes malformed saved resources, progress, journey, and collections at the load boundary', () => {
    const game = createInitialGame()
    const { martialLoadout: _, ...legacyPlayer } = game.player
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({
        ...game,
        player: {
          ...legacyPlayer,
          name: '  ',
          silver: -10,
          langyu: 'bad',
          forge: 4.9,
          realmId: 'unknown',
          realmLevel: 99,
          mastery: { 'wind-sword': 999, unknown: 10 },
          equippedArts: ['unknown', 'wind-sword', 'inner-breath', 'snow-step'],
          equippedEquipment: { weapon: { equipmentId: 'unknown', gems: ['bad'] } },
        },
        cultivation: { amount: -5, practiceProgress: 999, lastAccruedAt: 9_999_999_999_999, autoPractice: true },
        journey: { currentChapter: 100, currentStage: 1, completed: true },
        lottery: {
          ...game.lottery,
          fragments: { 'green-edge': 4, 'scarlet-sky-sword': 3 },
          pity: { equipment: { noPurpleDraws: 99, noOrangeDraws: -2 }, martial: { noPurpleDraws: 4.9, noOrangeDraws: 5 } },
        },
      }),
      setItem: () => undefined,
    })

    const loaded = loadGame()
    expect(loaded.player.name).toBe(game.player.name)
    expect(loaded.player.silver).toBe(0)
    expect(loaded.player.langyu).toBe(game.player.langyu)
    expect(loaded.player.forge).toBe(4)
    expect(loaded.player.realmId).toBe('body-tempering')
    expect(loaded.player.realmLevel).toBe(9)
    expect(loaded.player.mastery).toMatchObject({ 'wind-sword': 100 })
    expect(loaded.player.martialLoadout).toEqual({ inner1: 'inner-breath', inner2: null, outer1: 'wind-sword', outer2: 'snow-step' })
    expect(loaded.player.equippedEquipment.weapon?.equipmentId).toBe(game.player.equippedEquipment.weapon?.equipmentId)
    expect(loaded.cultivation).toMatchObject({ amount: 0, practiceProgress: 100, autoPractice: true })
    expect(loaded.cultivation.lastAccruedAt).toBeLessThanOrEqual(Date.now())
    expect(loaded.journey).toEqual({ currentChapter: 100, currentStage: 64, completed: true })
    expect(loaded.lottery).not.toHaveProperty('fragments')
    expect(loaded.lottery.ownedEquipmentIds).toContain('scarlet-sky-sword')
    expect(loaded.lottery.pity.equipment).toEqual({ noPurpleDraws: 9, noOrangeDraws: 0 })
  })

  it('does not carry unknown save fields into the live aggregate', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, staleRuntimeField: { shouldNotLoad: true } }),
      setItem: () => undefined,
    })

    expect(loadGame()).not.toHaveProperty('staleRuntimeField')
  })

  it('does not resurrect zero-count items or duplicate an owned equipment copy while loading', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({
        ...game,
        player: {
          ...game.player,
          items: { 'pill-condensing-qi': 0, 'gem-ruby': -4 },
          equippedEquipment: {
            ...game.player.equippedEquipment,
            ring1: { equipmentId: 'jade-ring', gems: [] },
            ring2: { equipmentId: 'jade-ring', gems: [] },
            weapon: { equipmentId: 'green-edge', gems: ['pill-condensing-qi', 'gem-ruby'] },
          },
        },
      }),
      setItem: () => undefined,
    })

    const loaded = loadGame()
    expect(loaded.player.items['pill-condensing-qi']).toBe(0)
    expect(loaded.player.items['gem-ruby']).toBe(0)
    expect(loaded.player.equippedEquipment.ring1?.equipmentId).toBe('jade-ring')
    expect(loaded.player.equippedEquipment.ring2).toBeNull()
    expect(loaded.player.equippedEquipment.weapon?.gems).toEqual([null, 'gem-ruby'])
  })

  it('migrates prior premium-currency keys and preserves legacy draw value', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, version: 10, player: { ...game.player, langyu: undefined, yuanbao: 23 } }),
      setItem: () => undefined,
    })

    expect(loadGame().player.langyu).toBe(23 * LOTTERY_DRAW_COST)

    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, version: 10, player: { ...game.player, langyu: undefined, silverTickets: 17 } }),
      setItem: () => undefined,
    })
    expect(loadGame().player.langyu).toBe(17 * LOTTERY_DRAW_COST)

    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, player: { ...game.player, langyu: 160 } }),
      setItem: () => undefined,
    })
    expect(loadGame().player.langyu).toBe(160)

    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, version: 10, player: { ...game.player, langyu: undefined, yuanbao: undefined, silverTickets: undefined } }),
      setItem: () => undefined,
    })
    expect(loadGame().player.langyu).toBe(game.player.langyu)
  })

  it('bounds runtime log history before it can bloat the save', () => {
    const log = { id: 'new', category: '习武' as const, time: '刚才', text: '测试', reward: '+1' }
    const logs = Array.from({ length: 100 }, (_, index) => ({ ...log, id: `old-${index}` }))

    expect(prependGameLog(logs, log)).toHaveLength(100)
    expect(prependGameLog(logs, log)[0]).toEqual(log)
  })
})

describe('equipment loadout', () => {
  it('creates nine equipment slots with two opened sockets and a four-socket ceiling where supported', () => {
    const game = createInitialGame()

    expect(EQUIPMENT_SLOTS).toHaveLength(9)
    expect(getEquippedEquipment(game.player)).toHaveLength(9)
    for (const slot of EQUIPMENT_SLOTS) {
      const entry = game.player.equippedEquipment[slot]
      const equipment = EQUIPMENT.find((item) => item.id === entry?.equipmentId)
      expect(equipment).toBeDefined()
      expect(entry?.gems).toHaveLength(equipment!.gemSlots > 0 ? 2 : 0)
      expect(getEquipmentGemSocketLimit(equipment!)).toBe(equipment!.gemSlots)
    }
  })

  it('does not equip a second copy without an owned inventory copy', () => {
    const game = createInitialGame()
    const ring = EQUIPMENT.find((item) => item.id === 'jade-ring')!
    const empty = { ...game.player, equippedEquipment: createEquipmentLoadout() }
    const first = equipPlayerEquipment(empty, 'ring1', ring, [ring.id])
    const blocked = equipPlayerEquipment(first, 'ring2', ring, [ring.id])

    expect(blocked.equippedEquipment.ring1?.equipmentId).toBe(ring.id)
    expect(blocked.equippedEquipment.ring2).toBeNull()
  })

  it('applies equipment core rates to the realm panel and removes them when unequipped', () => {
    const game = createInitialGame()
    const unarmed = { ...game.player, equippedEquipment: createEquipmentLoadout() }
    const coldIron = EQUIPMENT.find((item) => item.id === 'cold-iron')!
    const equipped = equipPlayerEquipment(unarmed, 'weapon', coldIron)

    const realm = getRealmBaseCombatStats(unarmed)
    const rates = getEquipmentCombatRates(unarmed, coldIron)
    const unarmedStats = getPlayerCombatStats(unarmed)
    const equippedStats = getPlayerCombatStats(equipped)

    expect(coldIron.combatBonuses?.attack).toBeGreaterThan(0)
    expect(coldIron.combatRates).toMatchObject({ attack: expect.any(Number), defense: expect.any(Number) })
    expect(equippedStats.attack).toBe(Math.round(realm.attack * (1 + (rates.attack ?? 0) / 100)) + unarmedStats.attack - realm.attack + (coldIron.combatBonuses?.attack ?? 0))
    expect(equippedStats.defense).toBe(Math.round(realm.defense * (1 + (rates.defense ?? 0) / 100)) + unarmedStats.defense - realm.defense + (coldIron.combatBonuses?.defense ?? 0))
    expect(unequipPlayerEquipment(equipped, 'weapon').equippedEquipment.weapon).toBeNull()
    expect(getPlayerCombatStats(unequipPlayerEquipment(equipped, 'weapon')).attack).toBe(getPlayerCombatStats(unarmed).attack)
  })

  it('applies temple rates before the independent equipment rate zone', () => {
    const game = createInitialGame()
    const coldIron = EQUIPMENT.find((item) => item.id === 'cold-iron')!
    const unarmed = {
      ...game.player,
      equippedEquipment: createEquipmentLoadout(),
      martialLoadout: { inner1: null, inner2: null, outer1: null, outer2: null },
      pillCombatBonuses: {},
      pillCombatRates: { attack: 10 },
    }
    const equipped = equipPlayerEquipment(unarmed, 'weapon', coldIron)
    const temple = { ...game.temple, ranks: { ...game.temple.ranks, breaker: 20 } }
    const realm = getRealmBaseCombatStats(equipped)
    const equipmentAttackRate = getEquipmentCombatRates(equipped, coldIron).attack ?? 0
    const fixedAttack = getEquipmentCombatBonuses(equipped, coldIron).attack ?? 0

    expect(getPlayerCombatStats(equipped, temple).attack).toBe(
      Math.round(realm.attack * 1.2 * (1 + (equipmentAttackRate + 10) / 100)) + fixedAttack,
    )
  })

  it('keeps equipment contribution proportional across realms and scales it with enhancement', () => {
    const game = createInitialGame()
    const coldIron = EQUIPMENT.find((item) => item.id === 'cold-iron')!
    const emptyLoadout = createEquipmentLoadout()
    const early = { ...game.player, equippedEquipment: emptyLoadout, realmId: 'body-tempering' as const, realmLevel: 1 }
    const late = { ...game.player, equippedEquipment: emptyLoadout, realmId: 'martial-saint' as const, realmLevel: 9 }
    const earlyEquipped = equipPlayerEquipment(early, 'weapon', coldIron)
    const lateEquipped = equipPlayerEquipment(late, 'weapon', coldIron)

    const earlyContribution = getPlayerCombatStats(earlyEquipped).attack - getPlayerCombatStats(early).attack
    const lateContribution = getPlayerCombatStats(lateEquipped).attack - getPlayerCombatStats(late).attack
    expect(lateContribution).toBeGreaterThan(earlyContribution)
    const attackRate = getEquipmentCombatRates(early, coldIron).attack ?? 0
    const earlyBaseAttack = getRealmBaseCombatStats(early).attack
    const lateBaseAttack = getRealmBaseCombatStats(late).attack
    const earlyRateContribution = Math.round(earlyBaseAttack * (1 + attackRate / 100)) - earlyBaseAttack
    const lateRateContribution = Math.round(lateBaseAttack * (1 + attackRate / 100)) - lateBaseAttack
    expect(lateRateContribution / lateBaseAttack).toBeCloseTo(earlyRateContribution / earlyBaseAttack, 2)

    const enhanced = { ...earlyEquipped, equipmentEnhancements: { [coldIron.id]: 10 } }
    expect(getEquipmentCombatRates(enhanced, coldIron).attack).toBeGreaterThan(getEquipmentCombatRates(earlyEquipped, coldIron).attack ?? 0)
    expect(getPlayerCombatStats(enhanced).attack).toBeGreaterThan(getPlayerCombatStats(earlyEquipped).attack)
  })

  it('migrates a legacy equipped weapon and supplies the remaining default slots', () => {
    const game = createInitialGame()
    const { equippedEquipment: _, ...legacyPlayer } = game.player
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...game, version: 7, player: { ...legacyPlayer, equippedWeapon: 'cold-iron' } }),
      setItem: () => undefined,
    })

    const loaded = loadGame()
    expect(loaded.player.equippedEquipment.weapon).toMatchObject({ equipmentId: 'cold-iron', gems: [null, null] })
    expect(loaded.player.equippedEquipment.helmet?.equipmentId).toBe('bamboo-hat')
    expect(loaded.player.equippedEquipment.ring1?.equipmentId).toBe('jade-ring')
    expect(loaded.player.equippedEquipment.ring2?.equipmentId).toBe('iron-ring')
  })

  it('moves a previous single-ring loadout into the first ring slot', () => {
    const game = createInitialGame()
    const { ring1: _, ring2: __, ...previousSlots } = game.player.equippedEquipment
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({
        ...game,
        version: 8,
        player: {
          ...game.player,
          equippedEquipment: { ...previousSlots, ring: { equipmentId: 'jade-ring', gems: [] } },
        },
      }),
      setItem: () => undefined,
    })

    const loaded = loadGame()
    expect(loaded.player.equippedEquipment.ring1?.equipmentId).toBe('jade-ring')
    expect(loaded.player.equippedEquipment.ring2?.equipmentId).toBe('iron-ring')
  })

  it('respects an explicit empty ring slot instead of falling back to the legacy ring field', () => {
    const game = createInitialGame()
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({
        ...game,
        player: {
          ...game.player,
          equippedEquipment: { ...game.player.equippedEquipment, ring1: null, ring: { equipmentId: 'jade-ring', gems: [] } },
        },
      }),
      setItem: () => undefined,
    })

    expect(loadGame().player.equippedEquipment.ring1).toBeNull()
  })

  it('keeps the two ring slots independent while sharing the ring equipment category', () => {
    const game = createInitialGame()
    const unarmed = { ...game.player, equippedEquipment: createEquipmentLoadout() }
    const jadeRing = EQUIPMENT.find((item) => item.id === 'jade-ring')!
    const ironRing = EQUIPMENT.find((item) => item.id === 'iron-ring')!
    const dualRings = equipPlayerEquipment(equipPlayerEquipment(unarmed, 'ring1', jadeRing), 'ring2', ironRing)

    expect(dualRings.equippedEquipment.ring1?.equipmentId).toBe('jade-ring')
    expect(dualRings.equippedEquipment.ring2?.equipmentId).toBe('iron-ring')
    expect(equipPlayerEquipment(unarmed, 'weapon', jadeRing)).toBe(unarmed)
  })

  it('only enhances currently equipped gear and applies the upgraded bonuses to combat power', () => {
    const game = createInitialGame()
    const equippedWeapon = EQUIPMENT.find((equipment) => equipment.id === game.player.equippedEquipment.weapon?.equipmentId)!
    const unequippedWeapon = EQUIPMENT.find((equipment) => equipment.id === 'cold-iron')!
    const player = { ...game.player, forge: 10_000 }

    expect(canEnhanceEquipment(player, unequippedWeapon)).toBe(false)
    expect(enhanceEquipment(player, unequippedWeapon)).toBeNull()

    const beforeAttack = getPlayerCombatStats(player).attack
    const cost = getEquipmentEnhancementCost(player, equippedWeapon)
    const enhanced = enhanceEquipment(player, equippedWeapon)
    expect(enhanced).not.toBeNull()
    expect(getEquipmentEnhancementLevel(enhanced!, equippedWeapon.id)).toBe(1)
    expect(enhanced!.forge).toBe(player.forge - cost)
    expect(getPlayerCombatStats(enhanced!).attack).toBeGreaterThanOrEqual(beforeAttack)
    expect(getPlayerPower(enhanced!)).toBeGreaterThan(getPlayerPower(player))
  })

  it('uses canonical equipment data instead of trusting a caller-supplied grade', () => {
    const game = createInitialGame()
    const weapon = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const forged = { ...weapon, gradeTone: 'red' as const }

    expect(getEquipmentEnhancementCost(game.player, forged)).toBe(getEquipmentEnhancementCost(game.player, weapon))
    expect(getEquipmentCombatBonuses(game.player, { ...weapon, combatBonuses: { attack: 999_999 } })).toEqual(getEquipmentCombatBonuses(game.player, weapon))
  })

  it('closes the equipment growth loop with gems, refinement and ascension', () => {
    const game = createInitialGame()
    const weapon = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const equipped = equipPlayerEquipment({ ...game.player, forge: 100_000, items: { 'equipment-essence': 10, 'equipment-reforge-stone': 2, 'gem-ruby': 1 } }, 'weapon', weapon)
    const beforeGem = getPlayerCombatStats(equipped).attack
    const socketed = socketEquipmentGem(equipped, 'weapon', 0, 'gem-ruby')!
    expect(socketed.items['gem-ruby']).toBe(0)
    expect(socketed.equippedEquipment.weapon?.gems[0]).toBe('gem-ruby')
    expect(getPlayerCombatStats(socketed).attack).toBeGreaterThan(beforeGem)
    const removed = removeEquipmentGem(socketed, 'weapon', 0)!
    expect(removed.items['gem-ruby']).toBe(1)

    expect(canRefineEquipment(removed, weapon)).toBe(true)
    const refined = refineEquipment(removed, weapon, () => 0)!
    expect(refined.player.items['equipment-reforge-stone']).toBe(1)
    expect(getEquipmentRefinement(refined.player, weapon.id)).toEqual(refined.refinement)

    const requirement = getEquipmentAscensionRequirement(refined.player, weapon)
    expect(requirement.essence).toBe(1)
    expect(canAscendEquipment(refined.player, { ...game.lottery, ownedEquipmentIds: [...game.lottery.ownedEquipmentIds, weapon.id] }, weapon)).toBe(true)
    const ascended = ascendEquipment(refined.player, { ...game.lottery, ownedEquipmentIds: [...game.lottery.ownedEquipmentIds, weapon.id] }, weapon)!
    expect(ascended.player.equipmentRanks[weapon.id]).toBe(1)
    expect(ascended.player.items['equipment-essence']).toBe(9)
    expect(getPlayerPower(ascended.player)).toBeGreaterThan(getPlayerPower(refined.player))
  })

  it('opens gem sockets for 400 langyu up to four and rejects unsupported slots', () => {
    const game = createInitialGame()
    const player = { ...game.player, langyu: 800 }
    expect(canUnlockEquipmentGemSlot(player, 'weapon')).toBe(true)
    const opened = unlockEquipmentGemSlot(player, 'weapon')!
    expect(opened.langyu).toBe(400)
    expect(opened.equippedEquipment.weapon?.gems).toHaveLength(3)
    const fullyOpened = unlockEquipmentGemSlot(opened, 'weapon')!
    expect(fullyOpened.langyu).toBe(0)
    expect(fullyOpened.equippedEquipment.weapon?.gems).toHaveLength(4)
    expect(unlockEquipmentGemSlot(fullyOpened, 'weapon')).toBeNull()
    expect(unlockEquipmentGemSlot(fullyOpened, 'belt')).toBeNull()
  })

  it('allows only one gem family on an equipment item', () => {
    const game = createInitialGame()
    const weapon = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const player = equipPlayerEquipment({ ...game.player, items: { 'gem-ruby': 1, 'gem-azure-flare': 1, 'gem-jade': 1 } }, 'weapon', weapon)
    const attackSocketed = socketEquipmentGem(player, 'weapon', 0, 'gem-ruby')!
    expect(socketEquipmentGem(attackSocketed, 'weapon', 1, 'gem-azure-flare')).toBeNull()
    expect(socketEquipmentGem(attackSocketed, 'weapon', 1, 'gem-jade')).not.toBeNull()
  })

  it('rejects invalid gem categories and out-of-range gem slots', () => {
    const game = createInitialGame()
    const weapon = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const player = equipPlayerEquipment({ ...game.player, items: { 'pill-condensing-qi': 1, 'gem-ruby': 1 } }, 'weapon', weapon)
    expect(socketEquipmentGem(player, 'weapon', 0, 'pill-condensing-qi')).toBeNull()
    expect(socketEquipmentGem(player, 'weapon', 99, 'gem-ruby')).toBeNull()
    expect(removeEquipmentGem(player, 'weapon', -1)).toBeNull()
    expect(removeEquipmentGem(player, 'weapon', 99)).toBeNull()
  })

  it('treats malformed equipped gem storage as empty during stat reads', () => {
    const game = createInitialGame()
    const malformed = {
      ...game.player,
      equippedEquipment: {
        ...game.player.equippedEquipment,
        weapon: { equipmentId: 'green-edge', gems: {} as never },
      },
    } as typeof game.player

    expect(() => getPlayerCombatStats(malformed)).not.toThrow()
    expect(getPlayerCombatStats(malformed)).toEqual(getPlayerCombatStats(game.player))
  })

  it('uses an equipment ascension item as a replacement for a duplicate', () => {
    const game = createInitialGame()
    const weapon = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const player = {
      ...game.player,
      forge: 100_000,
      equipmentRanks: { [weapon.id]: 5 },
      items: { [EQUIPMENT_ASCENSION_TOKEN_ID]: 1 },
    }
    expect(canAscendEquipment(player, game.lottery, weapon)).toBe(true)
    const result = ascendEquipment(player, game.lottery, weapon)
    expect(result?.player.equipmentRanks[weapon.id]).toBe(6)
    expect(result?.player.items[EQUIPMENT_ASCENSION_TOKEN_ID]).toBe(0)
  })
})

describe('martial art loadout and equipment sets', () => {
  it('keeps inner and outer data responsibilities separate', () => {
    for (const art of MARTIAL_ARTS) {
      if (art.kind === 'inner') {
        expect(art.activeSkill).toBeUndefined()
      } else {
        expect(art.activeSkill).toBeDefined()
        expect(art.combatBonuses).toBeUndefined()
        expect(art.passiveEffects).toBeUndefined()
      }
    }
  })

  it('activates cumulative 3 / 4 / 5 / 6 piece set bonuses', () => {
    const game = createInitialGame()
    const setPieces = EQUIPMENT.filter((equipment) => equipment.setId === 'rimebound')
    const setSlots = ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt'] as const

    for (const count of [3, 4, 5, 6]) {
      let player = { ...game.player, equippedEquipment: createEquipmentLoadout() }
      for (const [index, equipment] of setPieces.slice(0, count).entries()) {
        player = equipPlayerEquipment(player, setSlots[index]!, equipment)
      }
      const [activation] = getEquipmentSetActivations(player)
      expect(activation?.count).toBe(count)
      expect(activation?.activeBonuses.map((bonus) => bonus.pieces)).toEqual(Array.from({ length: count - 2 }, (_, index) => index + 3))
      expect(getPlayerCombatStats(player).maxHealth).toBeGreaterThan(getPlayerCombatStats({ ...game.player, equippedEquipment: createEquipmentLoadout() }).maxHealth)
    }

    let completePlayer = { ...game.player, equippedEquipment: createEquipmentLoadout() }
    for (const [index, equipment] of setPieces.entries()) completePlayer = equipPlayerEquipment(completePlayer, setSlots[index]!, equipment)
    expect(getPlayerCombatPassives(completePlayer)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'rimebound-snow-trace', kind: 'battle-start-dodge', value: 2 }),
    ]))
  })

  it('enforces inner and outer slots and prevents duplicate equipped arts', () => {
    const game = createInitialGame()
    const inner = MARTIAL_ARTS.find((art) => art.id === 'inner-breath')!
    const outer = MARTIAL_ARTS.find((art) => art.id === 'wind-sword')!
    const emptyPlayer = { ...game.player, martialLoadout: { inner1: null, inner2: null, outer1: null, outer2: null } }

    expect(equipPlayerMartialArt(emptyPlayer, 'outer1', inner)).toBe(emptyPlayer)
    const first = equipPlayerMartialArt(emptyPlayer, 'inner1', inner)
    const moved = equipPlayerMartialArt(first, 'inner2', inner)
    const equipped = { ...moved, martialLoadout: { ...moved.martialLoadout, inner1: inner.id, outer1: outer.id } }

    expect(moved.martialLoadout).toMatchObject({ inner1: null, inner2: inner.id })
    expect(getEquippedMartialArts(equipped).filter((art) => art.id === inner.id)).toHaveLength(1)
  })

  it('keeps outer arts usable with every weapon and only grants affinity for matching weapons', () => {
    const game = createInitialGame()
    const windSword = MARTIAL_ARTS.find((art) => art.id === 'wind-sword')!
    const greenEdge = EQUIPMENT.find((equipment) => equipment.id === 'green-edge')!
    const coldIron = EQUIPMENT.find((equipment) => equipment.id === 'cold-iron')!
    const emptyPlayer = {
      ...game.player,
      equippedEquipment: createEquipmentLoadout(),
      martialLoadout: { inner1: null, inner2: null, outer1: null, outer2: null },
    }
    const matchedPlayer = equipPlayerMartialArt(equipPlayerEquipment(emptyPlayer, 'weapon', greenEdge), 'outer1', windSword)
    const mismatchedPlayer = equipPlayerEquipment(matchedPlayer, 'weapon', coldIron)

    expect(hasMartialWeaponAffinity(matchedPlayer, windSword)).toBe(true)
    expect(getPlayerOuterSkills(matchedPlayer)).toEqual([expect.objectContaining({ id: windSword.activeSkill!.id, weaponAffinityActive: true })])
    expect(mismatchedPlayer.martialLoadout.outer1).toBe(windSword.id)
    expect(hasMartialWeaponAffinity(mismatchedPlayer, windSword)).toBe(false)
    expect(getPlayerOuterSkills(mismatchedPlayer)).toEqual([expect.objectContaining({ id: windSword.activeSkill!.id, weaponAffinityActive: false })])
    const noOuter = { ...matchedPlayer, martialLoadout: { ...matchedPlayer.martialLoadout, outer1: null } }
    expect(getPlayerCombatStats(matchedPlayer)).toEqual(getPlayerCombatStats(noOuter))
  })
})

describe('combat', () => {
  it('normalizes non-finite combat inputs to safe defaults', () => {
    const stats = normalizeCombatStats({ maxHealth: Number.NaN, attack: Number.POSITIVE_INFINITY, dodgeRate: 999 } as never)

    expect(stats.maxHealth).toBe(1_000)
    expect(stats.attack).toBe(100)
    expect(stats.dodgeRate).toBe(MAX_DODGE_RATE)
  })

  it('uses an encounter random source instead of the global random generator', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const playerStats = createCombatStats({ maxHealth: 500, attack: 80, speed: 200, hitRate: 0 })
    const enemyStats = createCombatStats({ maxHealth: 500, attack: 1, speed: 1 })
    let encounter = createEncounter({ enemyName: '试剑傀儡', playerStats, enemyStats, random: () => 0.99 })
    encounter.status = 'fighting'

    const step = advanceEncounterAction(encounter)
    expect(step.action?.outcome).toBe('dodge')
  })

  it('renders a triggered combo as a separate follow-up attack', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 100, speed: 200, hitRate: 100, comboRate: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 1, speed: 100, hitRate: 100 })
    let encounter = createEncounter({ playerStats, enemyStats, random: () => 0.5 })
    encounter.status = 'fighting'

    const firstStep = advanceEncounterAction(encounter)
    expect(firstStep.action).toMatchObject({ attacker: { side: 'player' }, outcome: 'hit' })
    expect(firstStep.action?.isCombo).toBeFalsy()
    expect(firstStep.encounter.actionQueue[0]).toMatchObject({ side: 'player', isCombo: true })

    const comboStep = advanceEncounterAction(firstStep.encounter)
    expect(comboStep.action).toMatchObject({ attacker: { side: 'player' }, outcome: 'hit', isCombo: true })
    expect(comboStep.action?.sequence).toBeGreaterThan(firstStep.action!.sequence)
    expect(comboStep.encounter.enemies[0]!.hp).toBeLessThan(firstStep.encounter.enemies[0]!.hp)
  })

  it('applies six-piece opening passives without changing their duration semantics', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 100, speed: 200, hitRate: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 100, speed: 100, hitRate: 100 })
    const create = (passive: CombatPassiveEffect) => {
      const encounter = createEncounter({ playerStats, enemyStats, playerPassives: [passive], random: () => 0.5 })
      encounter.status = 'fighting'
      return encounter
    }

    const baseline = advanceEncounterAction(create({ id: 'baseline', label: '', description: '', kind: 'survive-lethal', value: 0 })).action!
    const boosted = advanceEncounterAction(create({ id: 'sunfire', label: '', description: '', kind: 'damage-bonus-for-rounds', value: 80, duration: 1 })).action!
    expect(boosted.damage).toBeGreaterThan(baseline.damage)

    const immuneEncounter = create({ id: 'ironwall', label: '', description: '', kind: 'damage-immunity-for-rounds', value: 1, duration: 1 })
    immuneEncounter.playerStats = createCombatStats({ maxHealth: 1_000, attack: 1, speed: 1, hitRate: 100 })
    immuneEncounter.enemies[0]!.stats = createCombatStats({ maxHealth: 10_000, attack: 10_000, speed: 200, hitRate: 100 })
    immuneEncounter.status = 'fighting'
    const immuneStep = advanceEncounterAction(immuneEncounter)
    expect(immuneStep.action?.outcome).toBe('immune')
    expect(immuneStep.encounter.playerHp).toBe(immuneStep.encounter.playerMaxHealth)

    const blocked = create({ id: 'skyward', label: '', description: '', kind: 'block-enemy-actions-for-rounds', value: 1, duration: 1 })
    blocked.playerStats = createCombatStats({ maxHealth: 1_000, attack: 1, speed: 1, hitRate: 100 })
    blocked.enemies[0]!.stats = createCombatStats({ maxHealth: 10_000, attack: 1, speed: 200, hitRate: 100 })
    blocked.status = 'fighting'
    expect(advanceEncounterAction(blocked).action?.outcome).toBe('stunned')
  })

  it('consumes opening guaranteed dodges one attack at a time', () => {
    const encounter = createEncounter({
      playerStats: createCombatStats({ maxHealth: 1_000, attack: 1, speed: 1, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 10_000, attack: 100, speed: 200, hitRate: 100 }),
      playerPassives: [{ id: 'snow', label: '', description: '', kind: 'battle-start-dodge', value: 2 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    const first = advanceEncounterAction(encounter)
    expect(first.action?.outcome).toBe('dodge')
    const second = advanceEncounterAction(first.encounter)
    const third = advanceEncounterAction(second.encounter)
    expect(third.action?.outcome).toBe('dodge')
    expect(third.encounter.playerEffects.guaranteedDodge).toBe(0)
  })

  it('does not grant受击 rage when an enemy attack is dodged', () => {
    const encounter = createEncounter({
      playerStats: createCombatStats({ maxHealth: 1_000, attack: 1, speed: 1, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 10_000, attack: 100, speed: 200, hitRate: 100 }),
      playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 0 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'
    encounter.playerEffects.guaranteedDodge = 1

    const step = advanceEncounterAction(encounter)

    expect(step.action?.outcome).toBe('dodge')
    expect(step.encounter.playerRage).toBe(0)
  })

  it('grants受击 rage when an enemy attack is connected but immune', () => {
    const encounter = createEncounter({
      playerStats: createCombatStats({ maxHealth: 1_000, attack: 1, speed: 1, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 10_000, attack: 100, speed: 200, hitRate: 100 }),
      playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 0 }, { id: 'guard', label: '护体', description: '', kind: 'damage-immunity-for-rounds', value: 1, duration: 1 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    const step = advanceEncounterAction(encounter)

    expect(step.action?.outcome).toBe('immune')
    expect(step.encounter.playerRage).toBe(25)
  })

  it('expires round-limited damage reduction after its configured rounds', () => {
    let encounter = createEncounter({
      playerStats: createCombatStats({ maxHealth: 100_000, attack: 1, speed: 1, hitRate: 100 }),
      enemyStats: createCombatStats({ maxHealth: 100_000, attack: 100, speed: 200, hitRate: 100 }),
      playerPassives: [{ id: 'tide', label: '', description: '', kind: 'damage-reduction-for-rounds', value: 35, duration: 3 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    let firstEnemyAction = advanceEncounterAction(encounter)
    const reducedDamage = firstEnemyAction.action?.damage ?? 0
    encounter = advanceEncounterAction(firstEnemyAction.encounter).encounter
    for (let round = 2; round <= 3; round += 1) {
      const enemyAction = advanceEncounterAction(encounter)
      encounter = advanceEncounterAction(enemyAction.encounter).encounter
    }
    const fourthEnemyAction = advanceEncounterAction(encounter)
    expect(fourthEnemyAction.action?.damage).toBeGreaterThan(reducedDamage)
  })

  it('uses all overflow rage as the active skill multiplier and clears it after casting', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 10, speed: 100, hitRate: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 10, speed: 200, hitRate: 100 })
    let encounter = createEncounter({
      playerStats,
      enemyStats,
      playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 100 }],
      playerOuterSkills: [{ id: 'test-skill', name: '试招', damageMultiplier: 2 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    encounter = advanceEncounterAction(encounter).encounter
    expect(encounter.playerRage).toBe(125)
    const skillStep = advanceEncounterAction(encounter)
    expect(skillStep.action?.skill).toMatchObject({ id: 'test-skill', rageSpent: 125, multiplier: 1.25 })
    expect(skillStep.encounter.playerRage).toBe(0)
  })

  it('alternates outer skills only after rage is rebuilt by a normal attack', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 1, speed: 200, hitRate: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 1, speed: 100, hitRate: 100 })
    let encounter = createEncounter({
      playerStats,
      enemyStats,
      playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 100 }],
      playerOuterSkills: [
        { id: 'first', name: '第一式', damageMultiplier: 1.5 },
        { id: 'second', name: '第二式', damageMultiplier: 1.5 },
      ],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    const firstSkill = advanceEncounterAction(encounter)
    expect(firstSkill.action?.skill?.id).toBe('first')
    expect(firstSkill.encounter.playerRage).toBe(0)

    const enemyAfterFirstSkill = advanceEncounterAction(firstSkill.encounter)
    expect(enemyAfterFirstSkill.encounter.playerRage).toBe(25)

    const normalAttack = advanceEncounterAction(enemyAfterFirstSkill.encounter)
    expect(normalAttack.action?.skill).toBeUndefined()
    expect(normalAttack.encounter.playerRage).toBe(75)

    const enemyAfterNormalAttack = advanceEncounterAction(normalAttack.encounter)
    expect(enemyAfterNormalAttack.encounter.playerRage).toBe(100)

    const secondSkill = advanceEncounterAction(enemyAfterNormalAttack.encounter)
    expect(secondSkill.action?.skill?.id).toBe('second')
    expect(secondSkill.encounter.playerRage).toBe(0)
  })

  it('applies weapon affinity only to active skill damage', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 1_000, defense: 0, speed: 200, hitRate: 100, critRate: 0 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 1, defense: 0, speed: 1, dodgeRate: 0, critResist: 0 })
    const resolveDamage = (weaponAffinityActive: boolean) => {
      const encounter = createEncounter({
        playerStats,
        enemyStats,
        playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 100 }],
        playerOuterSkills: [{ id: 'affinity-strike', name: '试招', damageMultiplier: 1, weaponAffinityActive }],
        random: () => 0.5,
      })
      encounter.status = 'fighting'
      return advanceEncounterAction(encounter).action!
    }

    const unmatched = resolveDamage(false)
    const matched = resolveDamage(true)

    expect(unmatched.skill).toMatchObject({ weaponAffinityActive: false, weaponAffinityDamageMultiplier: 1, weaponAffinityEffectMultiplier: 1 })
    expect(matched.skill).toMatchObject({ weaponAffinityActive: true, weaponAffinityDamageMultiplier: COMBAT_BALANCE.weaponAffinityDamageMultiplier, weaponAffinityEffectMultiplier: COMBAT_BALANCE.weaponAffinityEffectMultiplier })
    expect(matched.damage).toBeCloseTo(unmatched.damage * COMBAT_BALANCE.weaponAffinityDamageMultiplier, 0)
  })

  it('amplifies numeric active-skill effects when weapon affinity is active', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 100, defense: 0, speed: 200, hitRate: 100, critRate: 0, stunRate: 0 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 1, defense: 0, speed: 1, dodgeRate: 0, critResist: 0, stunResist: 0 })
    const resolveStun = (weaponAffinityActive: boolean) => {
      const encounter = createEncounter({
        playerStats,
        enemyStats,
        playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 100 }],
        playerOuterSkills: [{ id: 'affinity-stun', name: '试招', damageMultiplier: 1, stunRate: 40, weaponAffinityActive }],
        random: () => 0.45,
      })
      encounter.status = 'fighting'
      return advanceEncounterAction(encounter).encounter
    }

    expect(resolveStun(false).enemies[0]?.effects.stunnedFor).toBe(0)
    expect(resolveStun(true).enemies[0]?.effects.stunnedFor).toBe(1)
  })

  it('alternates outer skills without skipping a skill when the player is stunned', () => {
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 1, speed: 200, hitRate: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 1, speed: 100, hitRate: 100 })
    let encounter = createEncounter({
      playerStats,
      enemyStats,
      playerPassives: [{ id: 'opening-rage', label: '先机', description: '', kind: 'battle-start-rage', value: 100 }],
      playerOuterSkills: [
        { id: 'first', name: '第一式', damageMultiplier: 1.5 },
        { id: 'second', name: '第二式', damageMultiplier: 1.5 },
      ],
      random: () => 0.5,
    })
    encounter.status = 'fighting'
    encounter.playerEffects.stunnedFor = 1

    const stunnedStep = advanceEncounterAction(encounter)
    expect(stunnedStep.action?.outcome).toBe('stunned')
    expect(stunnedStep.encounter.nextOuterSkillIndex).toBe(0)

    const enemyStep = advanceEncounterAction(stunnedStep.encounter)
    const skillStep = advanceEncounterAction(enemyStep.encounter)
    expect(skillStep.action?.skill?.id).toBe('first')
  })

  it('turns a lethal guard into exactly one point of health only once per battle', () => {
    const playerStats = createCombatStats({ maxHealth: 100, attack: 1, speed: 100 })
    const enemyStats = createCombatStats({ maxHealth: 10_000, attack: 100_000, speed: 200, hitRate: 100 })
    let encounter = createEncounter({
      playerStats,
      enemyStats,
      playerPassives: [{ id: 'guard', label: '护体', description: '', kind: 'survive-lethal', value: 1 }],
      random: () => 0.5,
    })
    encounter.status = 'fighting'

    encounter = advanceEncounterAction(encounter).encounter
    expect(encounter.playerHp).toBe(1)
    expect(encounter.playerLethalGuardCharges).toBe(0)

    encounter = advanceEncounterAction(encounter).encounter
    encounter = advanceEncounterAction(encounter).encounter
    expect(encounter.status).toBe('lost')
    expect(encounter.playerHp).toBe(0)
  })

  it('deduplicates enemy ids so target references remain unambiguous', () => {
    const stats = createCombatStats({ maxHealth: 100, attack: 1 })
    const encounter = createEncounter({ enemies: [
      { id: 'same', name: '甲', stats },
      { id: 'same', name: '乙', stats },
    ] })

    expect(encounter.enemies.map((enemy) => enemy.id)).toEqual(['same', 'same-2'])
  })

  it('ends at the configured round limit without creating an extra round', () => {
    const stats = createCombatStats({ maxHealth: 1_000_000, attack: 1, speed: 100 })
    let encounter = createEncounter({ playerStats: stats, enemyStats: stats, random: () => 0.5 })
    encounter.status = 'fighting'

    for (let round = 0; round < encounter.maxRounds + 2 && encounter.status === 'fighting'; round += 1) {
      encounter = advanceEncounter(encounter)
    }

    expect(encounter.status).toBe('draw')
    expect(encounter.round).toBe(encounter.maxRounds)
  })

  it('resolves actions one at a time in speed order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const playerStats = createCombatStats({ maxHealth: 500, attack: 80, speed: 80 })
    const enemyStats = createCombatStats({ maxHealth: 500, attack: 80, speed: 160 })
    let encounter = createEncounter({ enemyName: '快刀客', playerStats, enemyStats })
    encounter.status = 'fighting'

    const firstStep = advanceEncounterAction(encounter)
    expect(firstStep.action).toMatchObject({ attacker: { side: 'enemy' }, defender: { side: 'player' }, outcome: 'hit' })
    expect(firstStep.encounter.playerHp).toBeLessThan(firstStep.encounter.playerMaxHealth)
    expect(firstStep.encounter.enemies[0]!.hp).toBe(firstStep.encounter.enemies[0]!.maxHealth)

    const secondStep = advanceEncounterAction(firstStep.encounter)
    expect(secondStep.action).toMatchObject({ attacker: { side: 'player' }, defender: { side: 'enemy' }, outcome: 'hit' })
    expect(secondStep.encounter.enemies[0]!.hp).toBeLessThan(secondStep.encounter.enemies[0]!.maxHealth)
  })

  it('advances through independent round states', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let encounter = createEncounter({ enemyName: '试剑傀儡', enemyPower: 900 })
    encounter.status = 'fighting'

    encounter = advanceEncounter(encounter, 1_250)

    expect(encounter.round).toBe(1)
    expect(encounter.playerHp).toBeLessThan(encounter.playerMaxHealth)
    expect(encounter.enemies[0]!.hp).toBeLessThan(encounter.enemies[0]!.maxHealth)
    expect(encounter.logs).toHaveLength(3)
  })

  it('keeps realm growth on the four basic attributes while combat defaults stay stable', () => {
    const game = createInitialGame()
    const current = getPlayerCombatStats(game.player)
    const advanced = getPlayerCombatStats({ ...game.player, realmLevel: 2 })

    expect(advanced.maxHealth).toBeGreaterThan(current.maxHealth)
    expect(advanced.attack).toBeGreaterThan(current.attack)
    expect(advanced.defense).toBeGreaterThan(current.defense)
    expect(advanced.speed).toBeGreaterThan(current.speed)
    expect(advanced.hitRate).toBe(current.hitRate)
    expect(advanced.dodgeRate).toBe(current.dodgeRate)
    expect(advanced.lifestealRate).toBe(0)
  })

  it('caps normal dodge at 20% and never lets hit chance reach zero', () => {
    const attacker = createCombatStats({ hitRate: 5 })
    const defender = createCombatStats({ dodgeRate: 99 })

    expect(defender.dodgeRate).toBe(MAX_DODGE_RATE)
    expect(getHitChance(attacker, defender)).toBe(15)
  })

  it('reserves one-shot guaranteed hit and dodge effects with deterministic defensive priority', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const playerStats = createCombatStats({ maxHealth: 500, attack: 100, speed: 200, hitRate: 0 })
    const enemyStats = createCombatStats({ maxHealth: 500, attack: 1, speed: 1, hitRate: 0 })

    let encounter = createEncounter({ enemyName: '试剑傀儡', playerStats, enemyStats })
    encounter.status = 'fighting'
    encounter.playerEffects = grantNextAttackGuaranteedHit(encounter.playerEffects)
    encounter = advanceEncounter(encounter)
    expect(encounter.enemies[0]!.hp).toBeLessThan(encounter.enemies[0]!.maxHealth)
    expect(encounter.playerEffects.guaranteedHit).toBe(0)

    encounter = createEncounter({ enemyName: '试剑傀儡', playerStats, enemyStats })
    encounter.status = 'fighting'
    encounter.playerEffects = grantNextAttackGuaranteedHit(encounter.playerEffects)
    encounter.enemies[0]!.effects = grantNextAttackGuaranteedDodge(encounter.enemies[0]!.effects)
    encounter = advanceEncounter(encounter)
    expect(encounter.enemies[0]!.hp).toBe(encounter.enemies[0]!.maxHealth)
    expect(encounter.playerEffects.guaranteedHit).toBe(0)
    expect(encounter.enemies[0]!.effects.guaranteedDodge).toBe(0)
    expect(encounter.logs.some((line) => line.includes('必中'))).toBe(true)
  })

  it('records a defeat once even when a turn ends immediately', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const playerStats = createCombatStats({ attack: 500, speed: 200 })
    const enemyStats = createCombatStats({ maxHealth: 10, attack: 1, speed: 1 })
    let encounter = createEncounter({ enemyName: '山匪喽啰', playerStats, enemyStats })
    encounter.status = 'fighting'

    encounter = advanceEncounter(encounter)

    expect(encounter.status).toBe('won')
    expect(encounter.logs.filter((line) => line.includes('败退'))).toHaveLength(1)
  })

  it('requires every enemy in an elite team to be defeated', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const playerStats = createCombatStats({ maxHealth: 1_000, attack: 500, speed: 200 })
    const enemyStats = createCombatStats({ maxHealth: 40, attack: 1, speed: 1 })
    let encounter = createEncounter({
      enemyName: '双煞',
      playerStats,
      enemies: [
        { id: 'one', name: '甲', stats: enemyStats },
        { id: 'two', name: '乙', stats: enemyStats },
      ],
    })
    encounter.status = 'fighting'

    encounter = advanceEncounter(encounter)
    expect(encounter.status).toBe('fighting')
    expect(encounter.enemies.map((enemy) => enemy.hp)).toEqual([0, enemyStats.maxHealth])

    encounter = advanceEncounter(encounter)
    expect(encounter.status).toBe('won')
    expect(encounter.enemies.every((enemy) => enemy.hp === 0)).toBe(true)
  })
})

describe('gem synthesis', () => {
  it('provides a complete six-tier gem ladder with configured success rates', () => {
    const attackGem = INVENTORY_ITEMS.find((item) => item.id === 'gem-sand-attack')!
    expect(getGemSynthesisTarget(attackGem)?.id).toBe('gem-ruby')
    expect(getGemSynthesisSuccessRate(attackGem)).toBe(1)
    expect(getGemSynthesisSuccessRate(INVENTORY_ITEMS.find((item) => item.id === 'gem-ruby')!)).toBe(0.9)
    expect(getGemSynthesisSuccessRate(INVENTORY_ITEMS.find((item) => item.id === 'gem-legend-ember')!)).toBe(0.35)
    expect(getGemSynthesisTarget(INVENTORY_ITEMS.find((item) => item.id === 'gem-mythic-sun')!)).toBeNull()
  })

  it('consumes three gems atomically and only grants the target on success', () => {
    const game = createInitialGame()
    const source = INVENTORY_ITEMS.find((item) => item.id === 'gem-sand-attack')!
    const player = { ...game.player, items: { [source.id]: 6 } }
    expect(canSynthesizeGem(player, source)).toBe(true)
    const failed = synthesizeGem(player, source, () => 0.99)!
    expect(failed.success).toBe(true)
    expect(failed.player.items[source.id]).toBe(3)
    expect(failed.player.items['gem-ruby']).toBe(1)

    const sourceGreen = INVENTORY_ITEMS.find((item) => item.id === 'gem-ruby')!
    const failedUpgrade = synthesizeGem({ ...failed.player, items: { 'gem-ruby': 3 } }, sourceGreen, () => 0.95)!
    expect(failedUpgrade.success).toBe(false)
    expect(failedUpgrade.player.items['gem-ruby']).toBe(0)
    expect(failedUpgrade.player.items['gem-azure-flare']).toBeUndefined()
  })
})

describe('dungeon progression and pills', () => {
  it('defines layered, themed dungeon pools with only excellent-or-better pill rewards', () => {
    const itemById = new Map(INVENTORY_ITEMS.map((item) => [item.id, item]))
    expect(DUNGEONS).toHaveLength(3)
    for (const dungeon of DUNGEONS) {
      expect(dungeon.dailyAttempts).toBeGreaterThan(0)
      expect(dungeon.layers).toHaveLength(8)
      for (const [index, layer] of dungeon.layers.entries()) {
        expect(layer.layer).toBe(index + 1)
        expect(layer.drops.length).toBeGreaterThan(0)
        expect(layer.enemyStats.maxHealth).toBeGreaterThan(0)
        for (const drop of layer.drops) {
          if (drop.kind !== 'item') continue
          const item = itemById.get(drop.itemId)
          expect(item).toBeDefined()
          expect(['pill', 'material', 'gem']).toContain(item?.category)
          expect(['green', 'blue', 'purple', 'orange', 'red']).toContain(item?.gradeTone)
        }
      }
    }
    expect(getDungeonEnemies('bamboo-realm', 6)).toHaveLength(2)
  })

  it('gates layers and resets limited dungeon attempts on the next local day', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    expect(canEnterDungeon(game.dungeons, 'sword-gate', 1, now)).toBe(true)
    expect(canEnterDungeon(game.dungeons, 'sword-gate', 2, now)).toBe(false)

    let state = enterDungeon(game.dungeons, 'sword-gate', 1, now)!
    expect(getDungeonAttemptsRemaining(state, 'sword-gate', now)).toBe(2)
    state = cancelDungeonChallenge(state, 'sword-gate', 1)
    state = { ...state, highestCleared: { 'sword-gate': 1 } }
    expect(canEnterDungeon(state, 'sword-gate', 2, now)).toBe(true)
    state = enterDungeon(state, 'sword-gate', 2, now)!
    state = cancelDungeonChallenge(state, 'sword-gate', 2)
    state = enterDungeon(state, 'sword-gate', 1, now)!
    expect(getDungeonAttemptsRemaining(state, 'sword-gate', now)).toBe(0)
    expect(canEnterDungeon(state, 'sword-gate', 1, now)).toBe(false)
    expect(getDungeonAttemptsRemaining(state, 'sword-gate', new Date(2026, 7, 20).getTime())).toBe(3)
  })

  it('normalizes invalid dungeon timestamps at the domain boundary', () => {
    const game = createInitialGame()
    const entered = enterDungeon(game.dungeons, 'sword-gate', 1, Number.NaN)
    expect(entered?.activeChallenge?.enteredAt).toBeTypeOf('number')
    expect(Number.isFinite(entered?.activeChallenge?.enteredAt)).toBe(true)
  })

  it('awards a selected dungeon drop and grants first-clear resources exactly once', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    const entered = enterDungeon(game.dungeons, 'bamboo-realm', 1, now)!
    const first = resolveDungeonReward(game.player, game.lottery, entered, 'bamboo-realm', 1, () => 0, now)!
    expect(first.reward.firstClear).toBe(true)
    expect(first.reward.drops[0]).toMatchObject({ kind: 'item', itemId: 'pill-condensing-qi', quantity: 1 })
    expect(first.player.items['pill-condensing-qi']).toBe(1)
    expect(first.player.silver).toBeGreaterThan(game.player.silver)

    const replayState = enterDungeon(first.dungeons, 'bamboo-realm', 1, now)!
    const replay = resolveDungeonReward(first.player, first.lottery, replayState!, 'bamboo-realm', 1, () => 0, now)!
    expect(replay.reward.firstClear).toBe(false)
    expect(replay.reward.silver).toBe(0)
    expect(replay.reward.forge).toBe(0)
    expect(replay.player.items['pill-condensing-qi']).toBe(2)
    expect(getDungeonHighestCleared(replay.dungeons, 'bamboo-realm')).toBe(1)
  })

  it('requires an active dungeon challenge and settles it only once', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    expect(resolveDungeonReward(game.player, game.lottery, game.dungeons, 'sword-gate', 1, () => 0, now)).toBeNull()
    const entered = enterDungeon(game.dungeons, 'sword-gate', 1, now)!
    const settled = resolveDungeonReward(game.player, game.lottery, entered, 'sword-gate', 1, () => 0, now)!
    expect(settled.dungeons.activeChallenge).toBeUndefined()
    expect(resolveDungeonReward(settled.player, settled.lottery, settled.dungeons, 'sword-gate', 1, () => 0, now)).toBeNull()
  })

  it('does not let a malformed active challenge skip dungeon layers', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    const forgedState = {
      ...game.dungeons,
      date: '2026-08-19',
      attempts: { 'sword-gate': 1 },
      activeChallenge: { dungeonId: 'sword-gate', layer: 8, enteredAt: now },
    }

    expect(resolveDungeonReward(game.player, game.lottery, forgedState, 'sword-gate', 8, () => 0, now)).toBeNull()
  })

  it('keeps the dungeon reward contract layered and makes deeper layers more valuable', () => {
    for (const dungeon of DUNGEONS) {
      expect(dungeon.layers[0]!.guaranteedDrops?.length).toBeGreaterThan(0)
      expect(dungeon.layers.at(-1)!.dropQualityBonus).toBeGreaterThan(dungeon.layers[0]!.dropQualityBonus ?? 0)
    }
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    const entered = enterDungeon(game.dungeons, 'sword-gate', 1, now)!
    const result = resolveDungeonReward(game.player, game.lottery, entered, 'sword-gate', 1, () => 0.99, now)!
    expect(result.reward.drops.length).toBeGreaterThanOrEqual(2)
    expect(result.reward.drops[0]!.kind).toBe('item')
    expect(result.reward.drops.at(-1)).toMatchObject({ kind: 'resource', resource: 'silver', quantity: 240 })
  })

  it('sweeps a cleared layer through the same reward path and consumes one attempt', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 19, 9).getTime()
    const state = { ...game.dungeons, date: '2026-08-19', highestCleared: { 'sword-gate': 1 } }
    const result = sweepDungeon(game.player, game.lottery, state, 'sword-gate', 1, now, () => 0.5)!
    expect(result.reward.firstClear).toBe(false)
    expect(getDungeonAttemptsRemaining(result.dungeons, 'sword-gate', now)).toBe(2)
    expect(result.reward.drops.length).toBeGreaterThanOrEqual(2)
  })

  it('unlocks daily wash stones and weekly equipment essence from dungeon wins', () => {
    const game = createInitialGame()
    const monday = new Date(2026, 7, 17, 9).getTime()
    let bounty = game.materialBounties
    expect(canClaimDailyMaterialBounty(bounty, monday)).toBe(false)
    expect(canClaimWeeklyMaterialBounty(bounty, monday)).toBe(false)

    bounty = recordDungeonMaterialBountyWin(bounty, monday)
    expect(canClaimDailyMaterialBounty(bounty, monday)).toBe(true)
    expect(canClaimWeeklyMaterialBounty(bounty, monday)).toBe(false)
    const daily = claimDailyMaterialBounty(game.player, bounty, monday)!
    expect(daily.player.items['equipment-reforge-stone']).toBe(1)
    expect(claimDailyMaterialBounty(daily.player, daily.materialBounties, monday)).toBeNull()

    for (let index = 1; index < 5; index += 1) bounty = recordDungeonMaterialBountyWin(bounty, monday)
    expect(canClaimWeeklyMaterialBounty(bounty, monday)).toBe(true)
    const weekly = claimWeeklyMaterialBounty(game.player, bounty, monday)!
    expect(weekly.player.items['equipment-essence']).toBe(3)
    expect(claimWeeklyMaterialBounty(weekly.player, weekly.materialBounties, monday)).toBeNull()

    const nextWeek = new Date(2026, 7, 24, 9).getTime()
    expect(canClaimDailyMaterialBounty(weekly.materialBounties, nextWeek)).toBe(false)
    expect(canClaimWeeklyMaterialBounty(weekly.materialBounties, nextWeek)).toBe(false)
    const reset = recordDungeonMaterialBountyWin(weekly.materialBounties, nextWeek)
    expect(canClaimDailyMaterialBounty(reset, nextWeek)).toBe(true)
  })

  it('consumes pills once and applies their permanent cultivation and combat growth', () => {
    const game = createInitialGame()
    const baselineRate = getInnerForceRate(game.player)
    const baselineStats = getPlayerCombatStats(game.player)
    const player = { ...game.player, items: { 'pill-nine-turns': 1 } }
    const result = useInventoryItem(player, 'pill-nine-turns')!

    expect(result.player.items['pill-nine-turns']).toBe(0)
    expect(result.player.pillInnerForceRateBonus).toBe(5)
    expect(getInnerForceRate(result.player)).toBe(baselineRate + 5)
    expect(getPlayerCombatStats(result.player).maxHealth).toBe(baselineStats.maxHealth + 80)
    expect(getPlayerPower(result.player)).toBeGreaterThan(getPlayerPower(game.player))
    expect(useInventoryItem(result.player, 'pill-nine-turns')).toBeNull()
  })

  it('migrates saves without dungeon or pill fields to a valid empty dungeon state', () => {
    const game = createInitialGame()
    const { dungeons: _dungeons, materialBounties: _materialBounties, ...legacyGame } = game
    const { pillInnerForceRateBonus: _rate, pillCombatBonuses: _bonuses, pillCombatRates: _rates, ...legacyPlayer } = game.player
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ ...legacyGame, player: legacyPlayer }),
      setItem: () => undefined,
    })
    const loaded = loadGame()
    expect(loaded.dungeons).toEqual({ date: null, attempts: {}, highestCleared: {} })
    expect(loaded.materialBounties).toEqual({ dailyDate: null, dailyDungeonWins: 0, dailyClaimed: false, weeklyKey: null, weeklyDungeonWins: 0, weeklyClaimed: false })
    expect(loaded.player.pillInnerForceRateBonus).toBe(0)
    expect(loaded.player.pillCombatBonuses).toEqual({})
  })
})

describe('main story progression', () => {
  it('settles first-clear progression and reward atomically', () => {
    const game = createInitialGame()
    const stage = getCurrentMainStage(game.journey)!
    const result = resolveMainStageVictory(game.player, game.journey, stage, false)

    expect(result?.journey.currentStage).toBe(2)
    expect(result?.player.silver).toBe(game.player.silver + stage.reward.silver)
    expect(resolveMainStageVictory(result!.player, result!.journey, stage, false)).toBeNull()
  })

  it('only permits replay rewards after the stage is already cleared', () => {
    const game = createInitialGame()
    const stage = getMainStage(1, 1)!
    expect(resolveMainStageVictory(game.player, game.journey, stage, true)).toBeNull()

    const clearedJourney = { ...game.journey, currentStage: 2 }
    const result = resolveMainStageVictory(game.player, clearedJourney, stage, true, () => 0.5)
    expect(result?.journey).toEqual(clearedJourney)
    expect(result?.reward.langyu).toBe(0)
  })

  it('scales forge material and insight rewards together every three chapters', () => {
    expect(getMainStage(1, 1)!.reward.forge).toBe(5)
    expect(getMainStage(1, 1)!.reward.insight).toBe(1)
    expect(getMainStage(1, 16)!.reward.forge).toBe(16)
    expect(getMainStage(1, 16)!.reward.insight).toBe(3)
    expect(getMainStage(10, 1)!.reward.forge).toBe(8)
    expect(getMainStage(10, 1)!.reward.insight).toBe(4)
    expect(getMainStage(10, 32)!.reward.forge).toBe(19)
    expect(getMainStage(10, 32)!.reward.insight).toBe(6)
    expect(getMainStage(100, 1)!.reward.forge).toBe(38)
    expect(getMainStage(100, 1)!.reward.insight).toBe(34)
  })

  it('grants reduced repeat rewards and reserves an extra drop chance for elite stages', () => {
    const stage = getMainStage(1, 1)!
    const reward = getMainStageReplayReward({ ...stage, reward: { silver: 100, langyu: 4, forge: 10, insight: 10, fame: 10 } }, () => 0.99)
    expect(reward).toEqual({ silver: 30, langyu: 0, forge: 3, insight: 3, fame: 3, eliteBonus: false })

    const eliteStage = getMainStage(1, 16)!
    const eliteReward = getMainStageReplayReward({ ...eliteStage, reward: { silver: 100, langyu: 4, forge: 10, insight: 10, fame: 10 } }, () => 0)
    expect(eliteReward).toEqual({ silver: 30, langyu: 0, forge: 4, insight: 4, fame: 3, eliteBonus: true })
  })

  it('awards langyu on first clears with an elite premium', () => {
    expect(getMainStage(1, 1)!.reward.langyu).toBe(160)
    expect(getMainStage(1, 15)!.reward.langyu).toBe(160)
    expect(getMainStage(1, 16)!.reward.langyu).toBe(320)
    expect(getMainStage(6, 16)!.reward.langyu).toBe(240)
    expect(getMainStageReplayReward(getMainStage(1, 16)!, () => 0).langyu).toBe(0)
  })

  it('allows one daily check-in per local calendar day', () => {
    const game = createInitialGame()
    const now = new Date(2026, 7, 17, 9).getTime()
    expect(canClaimDailyCheckIn(game.dailyCheckIn, now)).toBe(true)
    const claimed = claimDailyCheckIn(game.player, game.dailyCheckIn, now)
    expect(claimed?.player.langyu).toBe(game.player.langyu + DAILY_CHECK_IN_REWARD)
    expect(claimed?.dailyCheckIn.lastClaimedDate).toBe('2026-08-17')
    expect(canClaimDailyCheckIn(claimed!.dailyCheckIn, now + 6 * 60 * 60 * 1000)).toBe(false)
    expect(claimDailyCheckIn(claimed!.player, claimed!.dailyCheckIn, now)).toBeNull()
    expect(canClaimDailyCheckIn(claimed!.dailyCheckIn, new Date(2026, 7, 18, 0).getTime())).toBe(true)
  })

  it('uses the configured chapter lengths, elite rhythm, and team sizes', () => {
    expect(getStagesPerChapter(1)).toBe(16)
    expect(getStagesPerChapter(5)).toBe(16)
    expect(getStagesPerChapter(6)).toBe(32)
    expect(getStagesPerChapter(20)).toBe(32)
    expect(getStagesPerChapter(21)).toBe(48)
    expect(getStagesPerChapter(40)).toBe(48)
    expect(getStagesPerChapter(41)).toBe(64)
    expect(getStagesPerChapter(100)).toBe(64)
    expect(isEliteMainStage(5, 16)).toBe(true)
    expect(isEliteMainStage(6, 16)).toBe(true)
    expect(isEliteMainStage(6, 32)).toBe(true)
    expect(isEliteMainStage(21, 8)).toBe(true)
    expect(isEliteMainStage(41, 4)).toBe(true)
    expect(getEliteEnemyCount(20, 16)).toBe(1)
    expect(getEliteEnemyCount(21, 8)).toBe(2)
    expect(getEliteEnemyCount(50, 4)).toBe(3)
    expect(getEliteEnemyCount(51, 4)).toBe(3)
    expect(getMainStage(51, 4)?.enemies).toHaveLength(3)
  })

  it('stores progress as chapter and stage coordinates and reveals only passed stages plus the next one', () => {
    const game = createInitialGame()
    expect(game.journey).toEqual({ currentChapter: 1, currentStage: 1, completed: false })
    expect(getVisibleMainChapters(game.journey)).toEqual([
      expect.objectContaining({ chapter: 1, stages: [expect.objectContaining({ stage: 1 })] }),
    ])

    const firstStage = getCurrentMainStage(game.journey)!
    const afterFirst = advanceMainJourney(game.journey, firstStage)!
    expect(afterFirst).toEqual({ currentChapter: 1, currentStage: 2, completed: false })
    expect(getVisibleMainChapters(afterFirst)[0]!.stages.map((stage) => stage.stage)).toEqual([1, 2])

    const chapterEnd = { currentChapter: 5, currentStage: 16, completed: false }
    expect(advanceMainJourney(chapterEnd, getCurrentMainStage(chapterEnd)!)).toEqual({ currentChapter: 6, currentStage: 1, completed: false })
  })

  it('completes only after the final canonical stage and rejects forged stage metadata', () => {
    const finalJourney = { currentChapter: 100, currentStage: 64, completed: false }
    const finalStage = getCurrentMainStage(finalJourney)!

    expect(advanceMainJourney(finalJourney, { ...finalStage, ordinal: finalStage.ordinal + 1 })).toBeNull()
    expect(advanceMainJourney(finalJourney, finalStage)).toEqual({ currentChapter: 100, currentStage: 64, completed: true })
  })
})
