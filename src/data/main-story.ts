import rawConfig from './main-story.json'
import type { CombatStats, MainStageReward } from '../domain/types'

export interface MainStoryChapterConfig {
  readonly chapter: number
  readonly stages: number
  readonly eliteEvery: number
  readonly eliteEnemyCount: number
  /** Total linear attribute growth from the first stage to the last stage in this chapter. */
  readonly stageGrowth: number
  readonly enemy: Readonly<{
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }>
}

interface MainStoryConfig {
  readonly version: number
  readonly enemyNames: Readonly<{
    common: readonly string[]
    elite: readonly string[]
    multiEnemySuffixes: readonly string[]
  }>
  readonly elite: Readonly<{
    totalHealthMultiplier: number
    attackShare: Readonly<{ one: number; two: number; three: number }>
    defenseMultiplier: number
    speedBonus: number
  }>
  readonly secondaryStats: Readonly<{
    baseHitRate: number
    hitRatePerChapter: number
    maxHitRate: number
    dodgeRatePerChapter: number
    maxDodgeRate: number
    baseCritRate: number
    critRatePerChapter: number
    maxCritRate: number
    eliteDodgeBonus: number
    eliteCritBonus: number
    eliteComboBase: number
    eliteComboPerChapter: number
    maxEliteComboRate: number
  }>
  readonly rewards: Readonly<{
    baseSilver: number
    stageSilverStep: number
    chapterSilverStep: number
    eliteMultiplier: number
    normalForge: number
    eliteForge: number
    forgeChapterStep: number
    normalInsight: number
    eliteInsight: number
    insightChapterStep: number
    normalFame: number
    eliteFame: number
    fameChapterStep: number
    normalLangyu: number
    eliteLangyu: number
    chapterClearLangyu: number
    replayRate: number
    eliteReplayBonusChance: number
  }>
  readonly chapters: readonly MainStoryChapterConfig[]
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`主线配置无效：${label}必须是对象。`)
  return value as Record<string, unknown>
}

function readNumber(value: unknown, label: string, min = 0, max = Number.POSITIVE_INFINITY): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`主线配置无效：${label}必须介于 ${min} 和 ${max} 之间。`)
  }
  return value
}

function readInteger(value: unknown, label: string, min = 0, max = Number.POSITIVE_INFINITY): number {
  const number = readNumber(value, label, min, max)
  if (!Number.isInteger(number)) throw new Error(`主线配置无效：${label}必须是整数。`)
  return number
}

function readStringList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(`主线配置无效：${label}必须是非空文字列表。`)
  }
  return Object.freeze(value.map((item) => (item as string).trim()))
}

function readChapter(value: unknown, index: number): MainStoryChapterConfig {
  const source = readObject(value, `chapters[${index}]`)
  const chapter = readInteger(source.chapter, `chapters[${index}].chapter`, 1)
  if (chapter !== index + 1) throw new Error('主线配置无效：章节必须从 1 起连续排列。')
  const stages = readInteger(source.stages, `第 ${chapter} 章关卡数`, 1)
  const eliteEvery = readInteger(source.eliteEvery, `第 ${chapter} 章精英间隔`, 1, stages)
  const eliteEnemyCount = readInteger(source.eliteEnemyCount, `第 ${chapter} 章精英人数`, 1, 3)
  const stageGrowth = readNumber(source.stageGrowth, `第 ${chapter} 章章节内增长`, 0, 0.25)
  const enemy = readObject(source.enemy, `第 ${chapter} 章敌人基础属性`)
  return Object.freeze({
    chapter,
    stages,
    eliteEvery,
    eliteEnemyCount,
    stageGrowth,
    enemy: Object.freeze({
      maxHealth: readNumber(enemy.maxHealth, `第 ${chapter} 章敌人生命`, 1),
      attack: readNumber(enemy.attack, `第 ${chapter} 章敌人攻击`, 1),
      defense: readNumber(enemy.defense, `第 ${chapter} 章敌人防御`, 0),
      speed: readNumber(enemy.speed, `第 ${chapter} 章敌人速度`, 1),
    }),
  })
}

function parseMainStoryConfig(value: unknown): MainStoryConfig {
  const source = readObject(value, '根节点')
  const rawChapters = source.chapters
  if (!Array.isArray(rawChapters) || rawChapters.length !== 100) throw new Error('主线配置无效：必须恰好配置 100 个章节。')

  const enemyNames = readObject(source.enemyNames, 'enemyNames')
  const elite = readObject(source.elite, 'elite')
  const attackShare = readObject(elite.attackShare, 'elite.attackShare')
  const secondaryStats = readObject(source.secondaryStats, 'secondaryStats')
  const rewards = readObject(source.rewards, 'rewards')

  return Object.freeze({
    version: readInteger(source.version, 'version', 1),
    enemyNames: Object.freeze({
      common: readStringList(enemyNames.common, 'enemyNames.common'),
      elite: readStringList(enemyNames.elite, 'enemyNames.elite'),
      multiEnemySuffixes: readStringList(enemyNames.multiEnemySuffixes, 'enemyNames.multiEnemySuffixes'),
    }),
    elite: Object.freeze({
      totalHealthMultiplier: readNumber(elite.totalHealthMultiplier, 'elite.totalHealthMultiplier', 1),
      attackShare: Object.freeze({
        one: readNumber(attackShare.one, 'elite.attackShare.one', 0),
        two: readNumber(attackShare.two, 'elite.attackShare.two', 0),
        three: readNumber(attackShare.three, 'elite.attackShare.three', 0),
      }),
      defenseMultiplier: readNumber(elite.defenseMultiplier, 'elite.defenseMultiplier', 1),
      speedBonus: readNumber(elite.speedBonus, 'elite.speedBonus', 0),
    }),
    secondaryStats: Object.freeze({
      baseHitRate: readNumber(secondaryStats.baseHitRate, 'secondaryStats.baseHitRate', 0, 100),
      hitRatePerChapter: readNumber(secondaryStats.hitRatePerChapter, 'secondaryStats.hitRatePerChapter', 0, 100),
      maxHitRate: readNumber(secondaryStats.maxHitRate, 'secondaryStats.maxHitRate', 0, 100),
      dodgeRatePerChapter: readNumber(secondaryStats.dodgeRatePerChapter, 'secondaryStats.dodgeRatePerChapter', 0, 100),
      maxDodgeRate: readNumber(secondaryStats.maxDodgeRate, 'secondaryStats.maxDodgeRate', 0, 100),
      baseCritRate: readNumber(secondaryStats.baseCritRate, 'secondaryStats.baseCritRate', 0, 100),
      critRatePerChapter: readNumber(secondaryStats.critRatePerChapter, 'secondaryStats.critRatePerChapter', 0, 100),
      maxCritRate: readNumber(secondaryStats.maxCritRate, 'secondaryStats.maxCritRate', 0, 100),
      eliteDodgeBonus: readNumber(secondaryStats.eliteDodgeBonus, 'secondaryStats.eliteDodgeBonus', 0, 100),
      eliteCritBonus: readNumber(secondaryStats.eliteCritBonus, 'secondaryStats.eliteCritBonus', 0, 100),
      eliteComboBase: readNumber(secondaryStats.eliteComboBase, 'secondaryStats.eliteComboBase', 0, 100),
      eliteComboPerChapter: readNumber(secondaryStats.eliteComboPerChapter, 'secondaryStats.eliteComboPerChapter', 0, 100),
      maxEliteComboRate: readNumber(secondaryStats.maxEliteComboRate, 'secondaryStats.maxEliteComboRate', 0, 100),
    }),
    rewards: Object.freeze({
      baseSilver: readNumber(rewards.baseSilver, 'rewards.baseSilver', 0),
      stageSilverStep: readNumber(rewards.stageSilverStep, 'rewards.stageSilverStep', 0),
      chapterSilverStep: readNumber(rewards.chapterSilverStep, 'rewards.chapterSilverStep', 0),
      eliteMultiplier: readNumber(rewards.eliteMultiplier, 'rewards.eliteMultiplier', 1),
      normalForge: readNumber(rewards.normalForge, 'rewards.normalForge', 0),
      eliteForge: readNumber(rewards.eliteForge, 'rewards.eliteForge', 0),
      forgeChapterStep: readNumber(rewards.forgeChapterStep, 'rewards.forgeChapterStep', 1),
      normalInsight: readNumber(rewards.normalInsight, 'rewards.normalInsight', 0),
      eliteInsight: readNumber(rewards.eliteInsight, 'rewards.eliteInsight', 0),
      insightChapterStep: readNumber(rewards.insightChapterStep, 'rewards.insightChapterStep', 1),
      normalFame: readNumber(rewards.normalFame, 'rewards.normalFame', 0),
      eliteFame: readNumber(rewards.eliteFame, 'rewards.eliteFame', 0),
      fameChapterStep: readNumber(rewards.fameChapterStep, 'rewards.fameChapterStep', 1),
      normalLangyu: readNumber(rewards.normalLangyu, 'rewards.normalLangyu', 0),
      eliteLangyu: readNumber(rewards.eliteLangyu, 'rewards.eliteLangyu', 0),
      chapterClearLangyu: readNumber(rewards.chapterClearLangyu, 'rewards.chapterClearLangyu', 0),
      replayRate: readNumber(rewards.replayRate, 'rewards.replayRate', 0, 1),
      eliteReplayBonusChance: readNumber(rewards.eliteReplayBonusChance, 'rewards.eliteReplayBonusChance', 0, 1),
    }),
    chapters: Object.freeze(rawChapters.map(readChapter)),
  })
}

const MAIN_STORY_CONFIG = parseMainStoryConfig(rawConfig)

export const MAIN_STORY_CHAPTERS = MAIN_STORY_CONFIG.chapters.length
export const MAIN_STORY_CHAPTER_CONFIGS = MAIN_STORY_CONFIG.chapters
export const COMMON_ENEMY_NAMES = MAIN_STORY_CONFIG.enemyNames.common
export const ELITE_ENEMY_NAMES = MAIN_STORY_CONFIG.enemyNames.elite
export const MULTI_ENEMY_SUFFIXES = MAIN_STORY_CONFIG.enemyNames.multiEnemySuffixes
export const MAIN_STAGE_REWARDS = MAIN_STORY_CONFIG.rewards

const CHAPTERS_BY_NUMBER = new Map(MAIN_STORY_CHAPTER_CONFIGS.map((chapter) => [chapter.chapter, chapter]))

/** Compatibility summary for callers that only need the chapter-rule breakpoints. */
export const MAIN_STORY_RULES = Object.freeze(MAIN_STORY_CHAPTER_CONFIGS.reduce<Array<{
  throughChapter: number
  stagesPerChapter: number
  eliteEvery: number
  eliteEnemyCount: number
}>>((rules, chapter) => {
  const previous = rules.at(-1)
  if (
    previous
    && previous.stagesPerChapter === chapter.stages
    && previous.eliteEvery === chapter.eliteEvery
    && previous.eliteEnemyCount === chapter.eliteEnemyCount
  ) {
    previous.throughChapter = chapter.chapter
    return rules
  }
  rules.push({
    throughChapter: chapter.chapter,
    stagesPerChapter: chapter.stages,
    eliteEvery: chapter.eliteEvery,
    eliteEnemyCount: chapter.eliteEnemyCount,
  })
  return rules
}, []).map((rule) => Object.freeze(rule)))

export function getMainStoryChapterConfig(chapter: number): MainStoryChapterConfig | undefined {
  return CHAPTERS_BY_NUMBER.get(chapter)
}

export function getMainStoryStageMultiplier(chapter: number, stage: number): number {
  const config = getMainStoryChapterConfig(chapter)
  if (!config || !Number.isInteger(stage) || stage < 1 || stage > config.stages) return 1
  const progress = config.stages === 1 ? 0 : (stage - 1) / (config.stages - 1)
  return 1 + config.stageGrowth * progress
}

function eliteAttackShare(enemyCount: number): number {
  if (enemyCount === 1) return MAIN_STORY_CONFIG.elite.attackShare.one
  if (enemyCount === 2) return MAIN_STORY_CONFIG.elite.attackShare.two
  return MAIN_STORY_CONFIG.elite.attackShare.three
}

export function getMainStageEnemyStatsGrowth(input: {
  chapter: number
  stage: number
  enemyCount: number
  isElite: boolean
  enemyIndex: number
}): Partial<CombatStats> {
  const chapter = getMainStoryChapterConfig(input.chapter)
  if (!chapter) throw new RangeError(`不存在第 ${input.chapter} 章主线配置。`)

  const stageMultiplier = getMainStoryStageMultiplier(input.chapter, input.stage)
  const defenseMultiplier = 1 + (stageMultiplier - 1) * 0.55
  const healthShare = input.isElite ? MAIN_STORY_CONFIG.elite.totalHealthMultiplier / input.enemyCount : 1
  const attackShare = input.isElite ? eliteAttackShare(input.enemyCount) : 1
  const secondary = MAIN_STORY_CONFIG.secondaryStats
  const chapterOffset = input.chapter - 1

  return {
    maxHealth: chapter.enemy.maxHealth * stageMultiplier * healthShare,
    attack: chapter.enemy.attack * stageMultiplier * attackShare,
    defense: chapter.enemy.defense * defenseMultiplier * (input.isElite ? MAIN_STORY_CONFIG.elite.defenseMultiplier : 1),
    speed: chapter.enemy.speed + input.enemyIndex * 4 + (input.isElite ? MAIN_STORY_CONFIG.elite.speedBonus : 0),
    hitRate: Math.min(secondary.maxHitRate, secondary.baseHitRate + chapterOffset * secondary.hitRatePerChapter),
    dodgeRate: Math.min(secondary.maxDodgeRate, chapterOffset * secondary.dodgeRatePerChapter + (input.isElite ? secondary.eliteDodgeBonus : 0)),
    critRate: Math.min(secondary.maxCritRate, secondary.baseCritRate + chapterOffset * secondary.critRatePerChapter + (input.isElite ? secondary.eliteCritBonus : 0)),
    comboRate: input.isElite
      ? Math.min(secondary.maxEliteComboRate, secondary.eliteComboBase + chapterOffset * secondary.eliteComboPerChapter)
      : 0,
  }
}

export function getMainStageRewardBalance(ordinal: number, chapter: number, stage: number, isElite: boolean): MainStageReward {
  const rewards = MAIN_STORY_CONFIG.rewards
  const chapterConfig = getMainStoryChapterConfig(chapter)
  const eliteMultiplier = isElite ? rewards.eliteMultiplier : 1
  return {
    silver: Math.round((rewards.baseSilver + ordinal * rewards.stageSilverStep + chapter * rewards.chapterSilverStep) * eliteMultiplier),
    langyu: isElite
      ? rewards.eliteLangyu + (chapterConfig?.stages === stage ? rewards.chapterClearLangyu : 0)
      : rewards.normalLangyu,
    forge: (isElite ? rewards.eliteForge : rewards.normalForge) + Math.floor(chapter / rewards.forgeChapterStep),
    insight: (isElite ? rewards.eliteInsight : rewards.normalInsight) + Math.floor(chapter / rewards.insightChapterStep),
    fame: (isElite ? rewards.eliteFame : rewards.normalFame) + Math.floor(chapter / rewards.fameChapterStep),
  }
}
