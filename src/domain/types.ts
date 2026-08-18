export type ViewId = 'practice' | 'journey' | 'bag' | 'lottery'
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
export type LotteryPoolId = 'equipment' | 'martial'
export type LotteryDrawCount = 1 | 10
export type DungeonTone = 'vermilion' | 'jade' | 'gold'
export type BattleKind = 'main' | 'dungeon'
export type BattleStatus = 'ready' | 'fighting' | 'won' | 'lost' | 'draw'
export type LogCategory = '习武' | '战斗' | '收获'

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
  combatBonuses?: Partial<CombatStats>
  keyword: string
  description: string
  setId?: string
}

export interface CombatPassiveEffect {
  id: string
  label: string
  description: string
  kind: 'survive-lethal' | 'battle-start-rage'
  value: number
}

export interface EquipmentSetBonus {
  pieces: 3 | 4 | 5 | 6
  description: string
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
  gems: Array<string | null>
}

export type EquipmentLoadout = Record<EquipmentSlot, EquippedEquipment | null>
export type MartialArtLoadout = Record<MartialArtSlot, string | null>

export interface MartialActiveSkill {
  id: string
  name: string
  description: string
  damageMultiplier: number
  bonusCritRate?: number
  defensePierceRate?: number
  guaranteedHit?: boolean
  stunRate?: number
  grantDodge?: number
  /** Resolved from the current weapon when combat begins; never persisted on a martial art. */
  weaponAffinityActive?: boolean
}

export interface MartialArt {
  id: string
  name: string
  category: string
  grade: string
  gradeTone: GradeTone
  level: number
  mastery: number
  kind: MartialArtKind
  affinityWeaponStyles?: readonly WeaponStyle[]
  keyword: string
  description: string
  innerForceRateBase?: number
  innerForceRatePerMastery?: number
  innerForceRateMultiplierBase?: number
  innerForceRateMultiplierPerMastery?: number
  combatBonuses?: Partial<CombatStats>
  passiveEffects?: readonly CombatPassiveEffect[]
  activeSkill?: MartialActiveSkill
}

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
  fame: number
}

export interface BattleReward extends MainStageReward {
  eliteBonus: boolean
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
  fame: number
  mastery: Record<string, number>
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
  fragments: Record<string, number>
  ownedEquipmentIds: string[]
  ownedMartialArtIds: string[]
  history: LotteryReward[]
}

export interface LotteryReward {
  id: string
  pool: LotteryPoolId
  kind: 'equipment' | 'martial' | 'fragment' | 'forge' | 'insight'
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
}

export interface CombatAction {
  sequence: number
  attacker: EncounterTurnAction
  defender: EncounterTurnAction
  outcome: 'hit' | 'dodge' | 'stunned'
  damage: number
  isCritical: boolean
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
  enemyName: string
  enemyPower: number
  playerStats: CombatStats
  playerEffects: CombatEffectState
  playerMaxHealth: number
  playerRage: number
  playerLethalGuardCharges: number
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
}
