import { deepFreeze } from './freeze'
import type { IdolConfig, IdolId } from '../domain/types'

/** The five statues share one resource but specialize in one foundation stat. */
export const IDOL_CONFIGS: readonly IdolConfig[] = deepFreeze([
  { id: 'mountain', name: '镇岳神像', description: '山岳不移，供奉后根基更稳。', effectLabel: '基础生命', stat: 'maxHealth', ratePerRank: 1.2, maxRank: 20, iconTone: 'gold' },
  { id: 'breaker', name: '破军神像', description: '锋芒出鞘，将吐纳所得化为攻势。', effectLabel: '基础攻击', stat: 'attack', ratePerRank: 1, maxRank: 20, iconTone: 'vermilion' },
  { id: 'aegis', name: '玄甲神像', description: '玄甲护身，抵住每一次正面冲击。', effectLabel: '基础防御', stat: 'defense', ratePerRank: 1, maxRank: 20, iconTone: 'blue' },
  { id: 'gale', name: '逐风神像', description: '身随风起，先手与周旋都更从容。', effectLabel: '基础速度', stat: 'speed', ratePerRank: 0.6, maxRank: 20, iconTone: 'jade' },
  { id: 'breath', name: '归息神像', description: '归息守一，让每次吐纳更有效率。', effectLabel: '吐纳速度', stat: 'innerForceRate', ratePerRank: 0.75, maxRank: 20, iconTone: 'purple' },
] as const)

export const IDOL_IDS: readonly IdolId[] = IDOL_CONFIGS.map((idol) => idol.id)

export function getIdolConfig(id: IdolId): IdolConfig | undefined {
  return IDOL_CONFIGS.find((idol) => idol.id === id)
}
