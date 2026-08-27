import type { EquipmentSlot, GameLog, RealmId } from '../domain/types'

export const INITIAL_PLAYER_PROFILE = {
  name: '沈孤鸿',
  title: '无名游侠',
  realmId: 'body-tempering' as RealmId,
  realmLevel: 1,
  silver: 1840,
  langyu: 1600,
  forge: 68,
  insight: 22,
  incense: 0,
  fame: 135,
  pillInnerForceRateBonus: 0,
  pillCombatBonuses: {},
  pillCombatRates: {},
  equipmentEnhancements: {},
  equipmentRanks: {},
  equipmentRefinements: {},
  mastery: { 'wind-sword': 58, 'inner-breath': 36, 'snow-step': 18 },
  martialRanks: {},
  items: {},
  martialLoadout: { inner1: 'inner-breath', inner2: null, outer1: 'wind-sword', outer2: 'snow-step' },
} as const

export const INITIAL_DAILY_CHECK_IN = {
  lastClaimedDate: null,
} as const

export const INITIAL_MATERIAL_BOUNTIES = {
  dailyDate: null,
  dailyDungeonWins: 0,
  dailyClaimed: false,
  weeklyKey: null,
  weeklyDungeonWins: 0,
  weeklyClaimed: false,
} as const

export const INITIAL_SHOP_STATE = {
  purchaseDate: null,
  purchaseCounts: {},
} as const

export const INITIAL_TEMPLE_STATE = {
  ranks: { mountain: 0, breaker: 0, aegis: 0, gale: 0, breath: 0 },
} as const

export const INITIAL_EQUIPMENT_LOADOUT: Readonly<Record<EquipmentSlot, string | null>> = {
  weapon: 'green-edge',
  helmet: 'bamboo-hat',
  chest: 'cloud-vest',
  mount: 'green-mane',
  cloak: 'goose-cloak',
  belt: 'linen-belt',
  talisman: 'peace-talisman',
  ring1: 'jade-ring',
  ring2: 'iron-ring',
}

export const INITIAL_GAME_LOGS: readonly GameLog[] = [
  { id: 'seed-practice', category: '习武', time: '刚才', text: '一次吐纳行气已毕，内力渐增。', reward: '+280 内力' },
  { id: 'seed-battle', category: '战斗', time: '昨天', text: '你在断雁关击退了三名山匪。', reward: '+46 银两' },
  { id: 'seed-forge', category: '收获', time: '昨天', text: '从旧铁匠铺寻得一块寒铁。', reward: '+12 铸材' },
]
