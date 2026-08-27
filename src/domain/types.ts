export type ViewId = 'practice' | 'journey' | 'dungeon' | 'temple' | 'bag' | 'lottery' | 'market'
export type EquipmentSlot = 'weapon' | 'helmet' | 'chest' | 'mount' | 'cloak' | 'belt' | 'talisman' | 'ring1' | 'ring2'
export type EquipmentCategory = 'weapon' | 'helmet' | 'chest' | 'mount' | 'cloak' | 'belt' | 'talisman' | 'ring'
export type EquipmentSetSlot = 'weapon' | 'helmet' | 'chest' | 'mount' | 'cloak' | 'belt'
export type WeaponStyle = 'sword' | 'saber' | 'spear' | 'staff' | 'fist'
export type MartialArtKind = 'inner' | 'outer'
export type MartialArtSlot = 'inner1' | 'inner2' | 'outer1' | 'outer2'
export type RealmId =
  | 'body-tempering'
  | 'meridian'
  | 'acquired'
  | 'innate'
  | 'aura'
  | 'master'
  | 'grandmaster'
  | 'returning'
  | 'martial-saint'
  | 'martial-pinnacle'
export type GradeTone = 'white' | 'green' | 'blue' | 'purple' | 'orange' | 'red'
export type CoreCombatStat = 'maxHealth' | 'attack' | 'defense' | 'speed'
export type CombatRateBonuses = Partial<Record<CoreCombatStat, number>>
export type LotteryPoolId = 'equipment' | 'martial'
export type LotteryDrawCount = 1 | 10
export type DungeonTone = 'vermilion' | 'jade' | 'gold'
export type DungeonMechanicId = 'counter-stance' | 'poison-mist' | 'changing-styles'
export type BattleKind = 'main' | 'dungeon'
export type BattleStatus = 'ready' | 'fighting' | 'won' | 'lost' | 'draw'
export type LogCategory = '习武' | '战斗' | '收获'
export type IdolId = 'mountain' | 'breaker' | 'aegis' | 'gale' | 'breath'

export interface Realm {
  id: RealmId
  label: string
  description: string
  tier: number
  color: string
  foreground: string
}

export interface Equipment {
  id: string
  categoryId: EquipmentCategory
  name: string
  category: string
  grade: string
  gradeTone: GradeTone
  power: number
  gemSlots: number
  weaponStyle?: WeaponStyle
  /** Percentage multipliers applied to the realm base panel. */
  combatRates?: CombatRateBonuses
  combatBonuses?: Partial<CombatStats>
  keyword: string
  /** Narrative background only. Gameplay effects come from structured fields. */
  lore: string
  setId?: string
}

export interface CombatPassiveEffect {
  id: string
  label: string
  description: string
  kind:
    | 'survive-lethal'
    | 'battle-start-rage'
    | 'skill-rage-refund'
    | 'battle-start-dodge'
    | 'damage-bonus-for-rounds'
    | 'damage-reduction-for-rounds'
    | 'damage-immunity-for-rounds'
    | 'combo-bonus-for-rounds'
    | 'block-enemy-actions-for-rounds'
  value: number
  /** Only used by round-limited effects. */
  duration?: number
}

export interface EquipmentSetBonus {
  pieces: 3 | 4 | 5 | 6
  description: string
  combatRates?: CombatRateBonuses
  combatBonuses?: Partial<CombatStats>
  passiveEffects?: readonly CombatPassiveEffect[]
}

export interface EquipmentSet {
  id: string
  name: string
  gradeTone: GradeTone
  description: string
  bonuses: readonly EquipmentSetBonus[]
}

export interface EquippedEquipment {
  equipmentId: string
  /** Opened gem sockets for this equipment instance; grows from 2 to 4. */
  gems: Array<string | null>
}

export interface EquipmentRefinement {
  stat: CoreCombatStat
  amount: number
}

export type EquipmentLoadout = Record<EquipmentSlot, EquippedEquipment | null>
export type MartialArtLoadout = Record<MartialArtSlot, string | null>

export interface MartialActiveSkill {
  id: string
  name: string
  damageMultiplier: number
  bonusCritRate?: number
  defensePierceRate?: number
  guaranteedHit?: boolean
  stunRate?: number
  grantDodge?: number
  /** Resolved from the current weapon when combat begins; never persisted on a martial art. */
  weaponAffinityActive?: boolean
}

export interface MartialAscensionConfig {
  maxRank: number
}

export interface InnerMartialAscensionConfig extends MartialAscensionConfig {
  /** Optional inner-art opening resource bonus. */
  rageAtBattleStart?: { base: number; max: number }
}

interface MartialArtBase {
  id: string
  name: string
  category: string
  grade: string
  gradeTone: GradeTone
  level: number
  mastery: number
  keyword: string
  /** Narrative background only. Gameplay effects come from structured fields. */
  lore: string
}

export interface InnerMartialArt extends MartialArtBase {
  kind: 'inner'
  innerForceRateBase?: number
  innerForceRatePerMastery?: number
  innerForceRateMultiplierBase?: number
  innerForceRateMultiplierPerMastery?: number
  combatBonuses?: Partial<CombatStats>
  passiveEffects?: readonly CombatPassiveEffect[]
  ascension?: InnerMartialAscensionConfig
  affinityWeaponStyles?: never
  activeSkill?: never
}

export interface OuterMartialArt extends MartialArtBase {
  kind: 'outer'
  affinityWeaponStyles?: readonly WeaponStyle[]
  activeSkill: MartialActiveSkill
  ascension?: MartialAscensionConfig
  innerForceRateBase?: never
  innerForceRatePerMastery?: never
  innerForceRateMultiplierBase?: never
  innerForceRateMultiplierPerMastery?: never
  combatBonuses?: never
  passiveEffects?: never
}

export type MartialArt = InnerMartialArt | OuterMartialArt

export interface CombatStats {
  maxHealth: number
  attack: number
  defense: number
  speed: number
  hitRate: number
  dodgeRate: number
  critRate: number
  critDamage: number
  comboRate: number
  counterRate: number
  stunRate: number
  lifestealRate: number
  critResist: number
  comboResist: number
  counterResist: number
  stunResist: number
  lifestealResist: number
  healingBonus: number
  critDamageReduction: number
  damageBonus: number
  damageReduction: number
}

export interface CombatEffectState {
  guaranteedHit: number
  guaranteedDodge: number
  stunnedFor: number
}

export interface MainStageEnemy {
  id: string
  name: string
  stats: CombatStats
}

export interface MainStageReward {
  silver: number
  langyu: number
  forge: number
  insight: number
  incense?: number
  fame: number
}

export type InventoryItemCategory = 'growth' | 'pill' | 'material' | 'gem'
export type PillEffect =
  | { kind: 'innerForceRate'; amount: number }
  | { kind: 'combatBonus'; stat: CoreCombatStat; amount: number }
  | { kind: 'combatRate'; stat: CoreCombatStat; amount: number }

export interface InventoryItem {
  id: string
  name: string
  grade: string
  gradeTone: GradeTone
  category: InventoryItemCategory
  description: string
  lore: string
  usable?: boolean
  pillEffects?: readonly PillEffect[]
  gemEffects?: readonly GemEffect[]
  /** Gem synthesis family and quality tier (0 = white, 5 = red). */
  gemFamily?: 'attack' | 'maxHealth' | 'defense' | 'speed'
  gemTier?: number
}

export interface GemEffect {
  kind: 'combatBonus' | 'combatRate'
  stat: CoreCombatStat
  amount: number
}

export type DungeonDrop =
  | { kind: 'item'; itemId: string; weight: number; quantity?: number }
  | { kind: 'equipment'; itemId: string; weight: number }
  | { kind: 'martial'; itemId: string; weight: number }
  | { kind: 'resource'; resource: 'forge' | 'insight' | 'silver' | 'incense'; amount: number; weight: number }

export interface DungeonMechanic {
  id: DungeonMechanicId
  name: string
  description: string
}

export interface DungeonLayerConfig {
  layer: number
  name: string
  enemyName: string
  enemyCount?: number
  enemyStats: Partial<CombatStats>
  staminaCost?: number
  firstClear?: { silver?: number; forge?: number; insight?: number; langyu?: number; incense?: number }
  drops: readonly DungeonDrop[]
  /** A guaranteed theme drop, resolved before the independent bonus pool. */
  guaranteedDrops?: readonly DungeonDrop[]
  /** Added to high-grade drop weights as the layer gets deeper. */
  dropQualityBonus?: number
}

export interface DungeonConfig {
  id: string
  name: string
  description: string
  strategy: string
  tone: DungeonTone
  mechanic: DungeonMechanic
  themeDropLabel: string
  /** Kept for save/config compatibility; no longer used to gate entries. */
  dailyAttempts?: number
  layers: readonly DungeonLayerConfig[]
}

export interface DungeonState {
  /** @deprecated retained only so old saves can be migrated safely. */
  date?: string | null
  /** @deprecated daily attempts are no longer used. */
  attempts?: Record<string, number>
  stamina: number
  staminaUpdatedAt: number
  highestCleared: Record<string, number>
  /** A consumed attempt that is waiting for the active battle to settle. */
  activeChallenge?: {
    dungeonId: string
    layer: number
    enteredAt: number
  }
}

export interface DungeonRewardDrop {
  kind: 'item' | 'equipment' | 'martial' | 'resource'
  itemId?: string
  name: string
  grade?: string
  gradeTone?: GradeTone
  resource?: 'forge' | 'insight' | 'silver' | 'incense'
  quantity: number
}

export interface DungeonReward extends MainStageReward {
  eliteBonus: boolean
  firstClear: boolean
  drops: DungeonRewardDrop[]
}

export interface BattleReward extends MainStageReward {
  eliteBonus: boolean
  firstClear?: boolean
  drops?: DungeonRewardDrop[]
}

export interface MainStageReplayReward extends BattleReward {}

export interface MainStage {
  ordinal: number
  chapter: number
  stage: number
  stagesInChapter: number
  isElite: boolean
  enemies: MainStageEnemy[]
  reward: MainStageReward
}

export interface JourneyState {
  currentChapter: number
  currentStage: number
  completed: boolean
}

export interface Dungeon {
  id: string
  name: string
  description: string
  progress: string
  enemy: string
  enemyPower: number
  tone: DungeonTone
}

export interface PlayerState {
  name: string
  title: string
  realmId: RealmId
  realmLevel: number
  power: number
  silver: number
  langyu: number
  forge: number
  insight: number
  incense: number
  fame: number
  /** Permanent growth from consumed pills. */
  pillInnerForceRateBonus: number
  pillCombatBonuses: Partial<Record<CoreCombatStat, number>>
  pillCombatRates: Partial<Record<CoreCombatStat, number>>
  equipmentEnhancements: Record<string, number>
  equipmentRanks: Record<string, number>
  equipmentRefinements: Record<string, EquipmentRefinement>
  mastery: Record<string, number>
  /** Martial art ascension rank, from 0 to the art's configured maximum. */
  martialRanks: Record<string, number>
  /** Stackable inventory items keyed by their stable item id. */
  items: Record<string, number>
  equippedEquipment: EquipmentLoadout
  martialLoadout: MartialArtLoadout
}

export interface CultivationState {
  amount: number
  practiceProgress: number
  lastAccruedAt: number
  autoPractice: boolean
}

export interface DailyCheckInState {
  lastClaimedDate: string | null
}

export interface MaterialBountyState {
  dailyDate: string | null
  dailyDungeonWins: number
  dailyClaimed: boolean
  weeklyKey: string | null
  weeklyDungeonWins: number
  weeklyClaimed: boolean
}

export interface IdolConfig {
  id: IdolId
  name: string
  description: string
  effectLabel: string
  stat: CoreCombatStat | 'innerForceRate'
  ratePerRank: number
  maxRank: number
  iconTone: 'gold' | 'vermilion' | 'blue' | 'jade' | 'purple'
}

export interface TempleState {
  ranks: Record<IdolId, number>
}

export type ShopRewardType = 'forge' | 'insight' | 'innerForce' | 'item'

export interface ShopReward {
  type: ShopRewardType
  amount: number
  itemId?: string
}

/** Data-defined, silver-only goods. Rewards are resolved in the domain layer. */
export interface SilverShopProduct {
  id: string
  name: string
  description: string
  lore: string
  dailyLimit: number
  basePrice: number
  /** Every N cleared-to chapter bands increase the price and reward together. */
  growthEveryChapters: number
  priceGrowthRate: number
  rewardGrowthRate: number
  rewards: readonly ShopReward[]
}

export interface ShopState {
  /** Local calendar date for which purchaseCounts applies. */
  purchaseDate: string | null
  purchaseCounts: Record<string, number>
}

export interface SilverShopOffer {
  productId: string
  price: number
  rewards: ShopReward[]
}

export interface GameLog {
  id: string
  category: LogCategory
  time: string
  text: string
  reward: string
}

export interface LotteryPity {
  noPurpleDraws: number
  noOrangeDraws: number
}

export interface LotteryState {
  pity: Record<LotteryPoolId, LotteryPity>
  ownedEquipmentIds: string[]
  ownedMartialArtIds: string[]
  history: LotteryReward[]
}

export interface LotteryReward {
  id: string
  pool: LotteryPoolId
  kind: 'equipment' | 'martial' | 'item' | 'forge' | 'insight'
  itemId?: string
  name: string
  grade: string
  gradeTone: GradeTone
  quantity: number
}

export interface LotteryDrawResult {
  id: number
  pool: LotteryPoolId
  count: LotteryDrawCount
  cost: number
  rewards: LotteryReward[]
}

export interface GameState {
  version: number
  player: PlayerState
  cultivation: CultivationState
  dailyCheckIn: DailyCheckInState
  materialBounties: MaterialBountyState
  shop: ShopState
  dungeons: DungeonState
  temple: TempleState
  journey: JourneyState
  lottery: LotteryState
  logs: GameLog[]
}

export interface EncounterInput {
  enemyName?: string
  enemyPower?: number
  playerStats?: CombatStats
  playerPassives?: readonly CombatPassiveEffect[]
  playerOuterSkills?: readonly MartialActiveSkill[]
  enemyStats?: CombatStats
  enemies?: MainStageEnemy[]
  kind?: BattleKind
  dungeonMechanic?: DungeonMechanicId
  /** Runtime-only random source, useful for deterministic simulations and tests. */
  random?: () => number
}

export interface EncounterEnemy {
  id: string
  name: string
  stats: CombatStats
  effects: CombatEffectState
  maxHealth: number
  hp: number
}

export interface EncounterTurnAction {
  side: 'player' | 'enemy'
  enemyId?: string
  targetEnemyId?: string
  isCounter: boolean
  isCombo?: boolean
}

export interface CombatAction {
  sequence: number
  attacker: EncounterTurnAction
  defender: EncounterTurnAction
  outcome: 'hit' | 'dodge' | 'immune' | 'stunned'
  damage: number
  isCritical: boolean
  isCombo?: boolean
  skill?: {
    id: string
    name: string
    rageSpent: number
    multiplier: number
    weaponAffinityActive: boolean
    weaponAffinityDamageMultiplier: number
    weaponAffinityEffectMultiplier: number
  }
}

export interface Encounter {
  kind: BattleKind
  dungeonMechanic?: DungeonMechanicId
  enemyName: string
  enemyPower: number
  playerStats: CombatStats
  /** Snapshot of the player's structured passives for this battle. */
  playerPassives: CombatPassiveEffect[]
  playerEffects: CombatEffectState
  playerMaxHealth: number
  playerRage: number
  playerLethalGuardCharges: number
  /** Enemy actions are resolved as stunned until this round (inclusive). */
  enemyActionBlockedUntilRound: number
  playerOuterSkills: MartialActiveSkill[]
  nextOuterSkillIndex: number
  round: number
  maxRounds: number
  playerHp: number
  enemies: EncounterEnemy[]
  actionQueue: EncounterTurnAction[]
  actionSequence: number
  status: BattleStatus
  logs: string[]
  /** Runtime-only random source; encounters are never persisted. */
  random?: () => number
}

export interface CombatTarget {
  name: string
  power: number
  enemies: MainStageEnemy[]
  kind: BattleKind
  stageOrdinal?: number
  isReplay?: boolean
  dungeonId?: string
  dungeonLayer?: number
  dungeonMechanic?: DungeonMechanicId
}
