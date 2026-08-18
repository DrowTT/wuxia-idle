import type { Realm } from '../domain/types'

export const REALMS: readonly Realm[] = [
  { id: 'body-tempering', label: '炼体境', description: '锤炼皮肉筋骨，奠定武道根基。', tier: 1, color: '#B0B8C0', foreground: '#25313B' },
  { id: 'meridian', label: '通脉境', description: '疏通经络，内息开始周行。', tier: 2, color: '#D6DCE3', foreground: '#26313B' },
  { id: 'acquired', label: '后天境', description: '打熬筋骨，温养内息。', tier: 3, color: '#55AF6B', foreground: '#FFFFFF' },
  { id: 'innate', label: '先天境', description: '贯通经脉，内息自生。', tier: 4, color: '#2F9FA3', foreground: '#FFFFFF' },
  { id: 'aura', label: '罡气境', description: '内息凝罡，举手投足皆有劲力。', tier: 5, color: '#3B82D0', foreground: '#FFFFFF' },
  { id: 'master', label: '宗师境', description: '气劲外放，自成一派。', tier: 6, color: '#5969C9', foreground: '#FFFFFF' },
  { id: 'grandmaster', label: '大宗师境', description: '融会诸艺，登临绝顶。', tier: 7, color: '#8C58C9', foreground: '#FFFFFF' },
  { id: 'returning', label: '归真境', description: '返璞归真，功法融入本能。', tier: 8, color: '#E07B42', foreground: '#FFFFFF' },
  { id: 'martial-saint', label: '武圣境', description: '百艺归一，威势可镇一方。', tier: 9, color: '#D5A63C', foreground: '#2A210D' },
  { id: 'martial-pinnacle', label: '武道极境', description: '穷尽武道变化，终见自身。', tier: 10, color: '#C84F59', foreground: '#FFFFFF' },
]

export const INNER_FORCE_PER_SECOND = 1.3
export const MAX_CULTIVATION_OFFLINE_MS = 12 * 60 * 60 * 1000
export const PRACTICE_PROGRESS_PER_ACTION = 3
export const AUTO_PRACTICE_INTERVAL_MS = 1_000
export const REALM_INNER_FORCE_RATE_MULTIPLIER = 1.8
export const SMALL_REALM_INNER_FORCE_RATE_MULTIPLIER = 1.025
export const COMBAT_STAT_LEVEL_GROWTH = 1.06
export const COMBAT_STAT_REALM_BREAKTHROUGH_BONUS = 1.12
export const COMBAT_SPEED_GROWTH_EXPONENT = 0.35

export const PRACTICE_PROGRESS_MAX = 100
export const PRACTICE_FULL_LEVEL_BASE_COST = 420
export const PRACTICE_REALM_COST_MULTIPLIER = 3.2
export const SMALL_REALM_COST_GROWTH = 1.2
/** Current enhancement advances a martial art's mastery by four points. */
export const MARTIAL_ENHANCEMENT_STEP = 4
export const EQUIPMENT_ENHANCEMENT_MAX_LEVEL = 20
export const EQUIPMENT_ENHANCEMENT_STAT_GROWTH = 0.05
