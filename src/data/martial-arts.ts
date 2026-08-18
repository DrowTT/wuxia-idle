import type { MartialArt } from '../domain/types'

export const MARTIAL_ARTS: readonly MartialArt[] = [
  {
    id: 'river-fist', name: '趟水拳', category: '外功 · 拳掌', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['fist'], keyword: '稳劲', description: '招式朴实，重在站稳下盘与收束劲力。',
    combatBonuses: { attack: 8, defense: 6 }, activeSkill: { id: 'river-fist-wave', name: '趟水借力', description: '借势递进，造成略高于普通攻击的伤害。', damageMultiplier: 1.16, stunRate: 5 },
  },
  {
    id: 'breathing-scroll', name: '吐纳诀', category: '内功 · 心法', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'inner', keyword: '调息', description: '最基础的吐纳法，令内息增长更加稳定。',
    innerForceRateBase: 0.25, innerForceRatePerMastery: 0.025, combatBonuses: { maxHealth: 45, defense: 3 },
  },
  {
    id: 'wind-sword', name: '听风剑诀', category: '外功 · 剑法', grade: '优秀', gradeTone: 'green', level: 3, mastery: 58, kind: 'outer', affinityWeaponStyles: ['sword'], keyword: '连击', description: '连续命中后有机会追加一次轻击。',
    combatBonuses: { attack: 18, hitRate: 2, critRate: 2, comboRate: 8 }, activeSkill: { id: 'wind-sword-listen', name: '听风九转', description: '剑随风转，命中后更容易打出连招。', damageMultiplier: 1.3, bonusCritRate: 5 },
  },
  {
    id: 'greenwood-meridian', name: '青木养元功', category: '内功 · 心法', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'inner', keyword: '养元', description: '气息绵长，适合长途闯荡与持续作战。',
    innerForceRateBase: 0.45, innerForceRatePerMastery: 0.035, combatBonuses: { maxHealth: 120, healingBonus: 3 },
  },
  {
    id: 'swallow-blade', name: '燕回刀法', category: '外功 · 刀法', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'outer', affinityWeaponStyles: ['saber'], keyword: '回锋', description: '一进一退如燕回檐，攻守衔接十分流畅。',
    combatBonuses: { attack: 25, speed: 5, counterRate: 4 }, activeSkill: { id: 'swallow-return', name: '燕回斩', description: '回身一斩，命中后提升下一次闪避。', damageMultiplier: 1.28, grantDodge: 1 },
  },
  {
    id: 'snow-step', name: '踏雪无痕', category: '外功 · 身法', grade: '精良', gradeTone: 'blue', level: 1, mastery: 18, kind: 'outer', keyword: '先手', description: '步法飘忽，提升速度与闪避。',
    combatBonuses: { speed: 20, dodgeRate: 8 }, activeSkill: { id: 'snow-step-three', name: '踏雪三叠', description: '连续三步化去来势，出手后下一次攻击必定闪避。', damageMultiplier: 1.22, grantDodge: 1 },
  },
  {
    id: 'returning-breath', name: '回风归息', category: '内功 · 心法', grade: '精良', gradeTone: 'blue', level: 2, mastery: 0, kind: 'inner', keyword: '回气', description: '气机回旋不绝，受创后仍能迅速稳住根基。',
    innerForceRateBase: 0.65, innerForceRatePerMastery: 0.04, combatBonuses: { maxHealth: 190, defense: 12, healingBonus: 5 },
  },
  {
    id: 'plum-spear', name: '折梅枪', category: '外功 · 枪法', grade: '精良', gradeTone: 'blue', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['spear'], keyword: '穿透', description: '枪尖如折梅，专挑敌方架势薄弱处。',
    combatBonuses: { attack: 36, hitRate: 3, defense: 5 }, activeSkill: { id: 'plum-spear-thrust', name: '折梅穿云', description: '枪芒穿云，部分无视敌方防御。', damageMultiplier: 1.42, defensePierceRate: 24 },
  },
  {
    id: 'inner-breath', name: '抱元守一', category: '内功 · 心法', grade: '史诗', gradeTone: 'purple', level: 2, mastery: 36, kind: 'inner', keyword: '吐纳', description: '装配后可提升内力吐纳和续战能力。',
    innerForceRateBase: 0.7, innerForceRatePerMastery: 0.05, combatBonuses: { maxHealth: 160, defense: 14, healingBonus: 5 },
  },
  {
    id: 'mysterious-water', name: '玄水真经', category: '内功 · 心法', grade: '史诗', gradeTone: 'purple', level: 1, mastery: 0, kind: 'inner', keyword: '化劲', description: '以柔化刚，敌人的爆发越强，越难伤到根本。',
    combatBonuses: { maxHealth: 260, defense: 24, damageReduction: 3, critDamageReduction: 5 },
  },
  {
    id: 'seven-star-sword', name: '七星剑阵', category: '外功 · 剑法', grade: '史诗', gradeTone: 'purple', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['sword'], keyword: '锁势', description: '七星连缀，出招角度变化莫测。',
    combatBonuses: { attack: 48, speed: 9, critRate: 5 }, activeSkill: { id: 'seven-star-lock', name: '七星锁魂', description: '剑势锁住敌方退路，命中后有机会令其下一击迟滞。', damageMultiplier: 1.58, bonusCritRate: 8, stunRate: 10 },
  },
  {
    id: 'golden-bell', name: '金钟罩', category: '内功 · 护体', grade: '传说', gradeTone: 'orange', level: 1, mastery: 0, kind: 'inner', keyword: '护体', description: '内息沉入周身，受击时更能稳住架势。',
    combatBonuses: { maxHealth: 320, defense: 34, damageReduction: 5, critResist: 4 }, passiveEffects: [{ id: 'golden-bell-guard', label: '金钟护体', description: '本场战斗第一次受到致命伤时保留1点生命。', kind: 'survive-lethal', value: 1 }],
  },
  {
    id: 'immortal-body', name: '不灭金身', category: '内功 · 护体', grade: '传说', gradeTone: 'orange', level: 1, mastery: 0, kind: 'inner', keyword: '不灭', description: '气血如炉，硬受重击也能很快重整旗鼓。',
    combatBonuses: { maxHealth: 460, defense: 42, damageReduction: 4, healingBonus: 8 },
  },
  {
    id: 'army-breaker', name: '破军刀诀', category: '外功 · 刀法', grade: '传说', gradeTone: 'orange', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['saber'], keyword: '破阵', description: '以一往无前的刀势破开敌阵，专克高防对手。',
    combatBonuses: { attack: 76, critDamage: 18, damageBonus: 8 }, activeSkill: { id: 'army-breaker-slash', name: '破军断阵', description: '一刀破阵，重创并削弱敌方防御。', damageMultiplier: 1.82, defensePierceRate: 35, bonusCritRate: 8 },
  },
  {
    id: 'one-sword', name: '一剑归元', category: '外功 · 剑法', grade: '神话', gradeTone: 'red', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['sword'], keyword: '归一', description: '一剑蓄势，招式返本归元，威势尽归锋芒。',
    combatBonuses: { attack: 88, speed: 12, hitRate: 5, critRate: 8, critDamage: 24, damageBonus: 12 }, activeSkill: { id: 'one-sword-return', name: '归元一剑', description: '蓄满怒气的一剑，必中并大幅穿透防御。', damageMultiplier: 2.15, defensePierceRate: 45, guaranteedHit: true, bonusCritRate: 12 },
  },
  {
    id: 'nirvana-heart', name: '涅槃心经', category: '内功 · 心法', grade: '神话', gradeTone: 'red', level: 1, mastery: 0, kind: 'inner', keyword: '涅槃', description: '濒死时护住最后一线生机，是不讲道理的强对策内功。',
    combatBonuses: { maxHealth: 620, defense: 52, damageReduction: 7, critResist: 8 }, passiveEffects: [{ id: 'nirvana-last-stand', label: '涅槃余生', description: '本场战斗第一次受到致命伤时保留1点生命。', kind: 'survive-lethal', value: 1 }],
  },
  {
    id: 'nine-heavens', name: '九霄断岳', category: '外功 · 绝技', grade: '神话', gradeTone: 'red', level: 1, mastery: 0, kind: 'outer', keyword: '断岳', description: '九霄落势，舍弃花巧，只求一击定胜负。',
    combatBonuses: { attack: 118, speed: 14, critRate: 10, critDamage: 30, damageBonus: 16 }, activeSkill: { id: 'nine-heavens-break', name: '九霄断岳', description: '极限爆发，伤害随溢出怒气提升，重创强敌。', damageMultiplier: 2.45, defensePierceRate: 52, bonusCritRate: 16, guaranteedHit: true },
  },
  {
    id: 'tiger-crouch-fist', name: '伏虎拳', category: '外功 · 拳掌', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['fist'], keyword: '沉势', description: '拳路朴拙沉稳，先守住身形再伺机反制。',
    combatBonuses: { attack: 9, defense: 7, counterRate: 2 }, activeSkill: { id: 'tiger-crouch-strike', name: '伏虎沉击', description: '沉肩坠肘，以稳劲震开敌方架势。', damageMultiplier: 1.18, stunRate: 8 },
  },
  {
    id: 'circulating-breath', name: '行气篇', category: '内功 · 心法', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'inner', keyword: '导气', description: '循经导气的入门法门，令吐纳节奏更为平和。',
    innerForceRateBase: 0.2, innerForceRatePerMastery: 0.02, combatBonuses: { maxHealth: 50, defense: 4 },
  },
  {
    id: 'moonhook-saber', name: '弦月刀法', category: '外功 · 刀法', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'outer', affinityWeaponStyles: ['saber'], keyword: '回月', description: '刀走弧线，如弦月回照，专寻破绽。',
    combatBonuses: { attack: 11, speed: 3, hitRate: 1 }, activeSkill: { id: 'moonhook-return', name: '弦月回斩', description: '回锋斩向对手空门，更容易打出暴击。', damageMultiplier: 1.2, bonusCritRate: 4 },
  },
  {
    id: 'stone-gate-qigong', name: '石门桩功', category: '内功 · 护体', grade: '普通', gradeTone: 'white', level: 1, mastery: 0, kind: 'inner', keyword: '扎根', description: '以桩功守住气息与重心，适合初入江湖时打牢根基。',
    innerForceRateMultiplierBase: 0.01, innerForceRateMultiplierPerMastery: 0.001, combatBonuses: { maxHealth: 70, defense: 5 },
  },

  {
    id: 'flying-swallow-kick', name: '飞燕腿', category: '外功 · 腿法', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'outer', keyword: '掠身', description: '借地势掠起，如飞燕穿檐，最擅抢占身位。',
    combatBonuses: { attack: 16, speed: 8, dodgeRate: 2 }, activeSkill: { id: 'flying-swallow-sweep', name: '飞燕回旋', description: '旋身连踢后撤，避开接下来的一次攻击。', damageMultiplier: 1.26, grantDodge: 1 },
  },
  {
    id: 'hundred-herbs-manual', name: '百草回春诀', category: '内功 · 心法', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'inner', keyword: '养息', description: '以绵长内息温养周身，久战时愈见从容。',
    innerForceRateBase: 0.4, innerForceRatePerMastery: 0.03, combatBonuses: { maxHealth: 100, healingBonus: 4, lifestealResist: 1 },
  },
  {
    id: 'tide-staff', name: '伏波棍法', category: '外功 · 棍法', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'outer', affinityWeaponStyles: ['staff'], keyword: '拦江', description: '棍势如江潮横推，进可压敌，退可护身。',
    combatBonuses: { attack: 20, defense: 12, counterRate: 7 }, activeSkill: { id: 'tide-staff-surge', name: '伏波横江', description: '横棍封路，重击之下有机会震得对手失衡。', damageMultiplier: 1.24, stunRate: 12 },
  },
  {
    id: 'still-mountain-art', name: '静岳功', category: '内功 · 护体', grade: '优秀', gradeTone: 'green', level: 2, mastery: 0, kind: 'inner', keyword: '稳脉', description: '气沉丹田，面对连番攻势也能守住架势。',
    innerForceRateMultiplierBase: 0.02, innerForceRateMultiplierPerMastery: 0.0015, combatBonuses: { maxHealth: 140, defense: 14, damageReduction: 1 },
  },

  {
    id: 'silk-capture', name: '缠丝擒拿手', category: '外功 · 擒拿', grade: '精良', gradeTone: 'blue', level: 3, mastery: 0, kind: 'outer', affinityWeaponStyles: ['fist'], keyword: '锁腕', description: '指掌如丝，缠住关节便连敌方的反手也能借来。',
    combatBonuses: { attack: 28, hitRate: 4, counterRate: 5, stunRate: 3 }, activeSkill: { id: 'silk-capture-lock', name: '缠丝锁腕', description: '锁住腕脉，令对手短暂失去出手机会。', damageMultiplier: 1.42, stunRate: 16 },
  },
  {
    id: 'iron-vest-art', name: '铁衣功', category: '内功 · 护体', grade: '精良', gradeTone: 'blue', level: 3, mastery: 0, kind: 'inner', keyword: '横练', description: '内息凝于肌骨之间，硬接强攻时更见效果。',
    innerForceRateBase: 0.55, innerForceRatePerMastery: 0.035, combatBonuses: { maxHealth: 230, defense: 20, damageReduction: 2 },
  },
  {
    id: 'shocking-swan-step', name: '惊鸿掠影', category: '外功 · 身法', grade: '精良', gradeTone: 'blue', level: 3, mastery: 0, kind: 'outer', keyword: '幻步', description: '步走轻灵，如惊鸿掠水，常在一线间避开杀招。',
    combatBonuses: { attack: 24, speed: 16, dodgeRate: 4 }, activeSkill: { id: 'shocking-swan-veil', name: '惊鸿留影', description: '身影一分为二，下一次受到攻击时必定闪避。', damageMultiplier: 1.38, grantDodge: 1 },
  },
  {
    id: 'cold-pool-heart', name: '寒潭心诀', category: '内功 · 心法', grade: '精良', gradeTone: 'blue', level: 3, mastery: 0, kind: 'inner', keyword: '澄心', description: '心如寒潭，不为外物所扰，最能化解骤起的杀机。',
    innerForceRateMultiplierBase: 0.04, innerForceRateMultiplierPerMastery: 0.002, combatBonuses: { maxHealth: 220, defense: 16, critResist: 3 },
  },

  {
    id: 'drifting-cloud-sword', name: '流云剑歌', category: '外功 · 剑法', grade: '史诗', gradeTone: 'purple', level: 4, mastery: 0, kind: 'outer', affinityWeaponStyles: ['sword'], keyword: '随云', description: '剑势飘逸不拘一格，越是变化越令人难测。',
    combatBonuses: { attack: 58, speed: 12, dodgeRate: 2, critRate: 4 }, activeSkill: { id: 'drifting-cloud-break', name: '流云破晓', description: '云开见日的一剑，暴击时威势尤盛。', damageMultiplier: 1.65, bonusCritRate: 9 },
  },
  {
    id: 'scarlet-yang-force', name: '赤阳劲', category: '内功 · 心法', grade: '史诗', gradeTone: 'purple', level: 4, mastery: 0, kind: 'inner', keyword: '炽息', description: '内息如炉火运转，吐纳与出招都更具爆发。',
    innerForceRateBase: 0.8, innerForceRatePerMastery: 0.05, combatBonuses: { maxHealth: 240, attack: 35, damageBonus: 3 },
  },
  {
    id: 'demon-subduing-staff', name: '伏魔棍', category: '外功 · 棍法', grade: '史诗', gradeTone: 'purple', level: 4, mastery: 0, kind: 'outer', affinityWeaponStyles: ['staff'], keyword: '镇煞', description: '棍势刚猛沉重，一式压下便能令敌方难以喘息。',
    combatBonuses: { attack: 54, defense: 18, hitRate: 3, stunRate: 6 }, activeSkill: { id: 'demon-subduing-press', name: '伏魔镇煞', description: '重棍压顶，命中后很可能令对手眩晕。', damageMultiplier: 1.62, stunRate: 22 },
  },
  {
    id: 'returning-treasury-manual', name: '归藏心经', category: '内功 · 心法', grade: '史诗', gradeTone: 'purple', level: 4, mastery: 0, kind: 'inner', keyword: '归藏', description: '纳外息为己用，越在持久交手中越能显出根基。',
    innerForceRateMultiplierBase: 0.06, innerForceRateMultiplierPerMastery: 0.0035, combatBonuses: { maxHealth: 310, defense: 28, healingBonus: 7 },
  },

  {
    id: 'heavenly-gang-manual', name: '天罡战诀', category: '内功 · 战诀', grade: '传说', gradeTone: 'orange', level: 5, mastery: 0, kind: 'inner', keyword: '战意', description: '以刚烈气机催动战意，开局便能抢得攻势。',
    innerForceRateBase: 1.1, innerForceRatePerMastery: 0.065, combatBonuses: { maxHealth: 410, attack: 38, damageBonus: 4 }, passiveEffects: [{ id: 'heavenly-gang-rage', label: '天罡战意', description: '开战时获得 25 怒气。', kind: 'battle-start-rage', value: 25 }],
  },
  {
    id: 'eight-wastes-halberd', name: '八荒戟法', category: '外功 · 戟法', grade: '传说', gradeTone: 'orange', level: 5, mastery: 0, kind: 'outer', affinityWeaponStyles: ['spear'], keyword: '横绝', description: '大开大阖，戟刃所至能将厚重守势一并劈开。',
    combatBonuses: { attack: 82, speed: 8, critDamage: 20, damageBonus: 9 }, activeSkill: { id: 'eight-wastes-cleave', name: '八荒裂阵', description: '戟锋横扫，强行撕开敌方防御。', damageMultiplier: 1.88, defensePierceRate: 39, stunRate: 10 },
  },
  {
    id: 'dragon-slaying-sword', name: '斩龙剑典', category: '外功 · 剑法', grade: '传说', gradeTone: 'orange', level: 5, mastery: 0, kind: 'outer', affinityWeaponStyles: ['sword'], keyword: '断势', description: '剑意直指要害，专在强敌起势前一剑断之。',
    combatBonuses: { attack: 78, hitRate: 6, critRate: 8, damageBonus: 8 }, activeSkill: { id: 'dragon-slaying-cut', name: '斩龙截势', description: '截断对手起势的一剑，必中且无视部分防御。', damageMultiplier: 1.95, defensePierceRate: 30, guaranteedHit: true },
  },
  {
    id: 'great-vast-manual', name: '浩然正气功', category: '内功 · 心法', grade: '传说', gradeTone: 'orange', level: 5, mastery: 0, kind: 'inner', keyword: '浩然', description: '气机浩荡正大，面对暴烈攻势时更能守住本心。',
    innerForceRateMultiplierBase: 0.09, innerForceRateMultiplierPerMastery: 0.0045, combatBonuses: { maxHealth: 480, defense: 38, critResist: 5, damageReduction: 4 },
  },

  {
    id: 'formless-heaven-manual', name: '太虚无极功', category: '内功 · 心法', grade: '神话', gradeTone: 'red', level: 6, mastery: 0, kind: 'inner', keyword: '无极', description: '吐纳与气机浑然一体，静时深藏，动时无穷。',
    innerForceRateBase: 1.35, innerForceRatePerMastery: 0.075, combatBonuses: { maxHealth: 700, defense: 58, damageReduction: 6 }, passiveEffects: [{ id: 'formless-heaven-rage', label: '无极先机', description: '开战时获得 50 怒气。', kind: 'battle-start-rage', value: 50 }],
  },
  {
    id: 'celestial-demon-fist', name: '天魔拳经', category: '外功 · 拳掌', grade: '神话', gradeTone: 'red', level: 6, mastery: 0, kind: 'outer', affinityWeaponStyles: ['fist'], keyword: '裂空', description: '拳意裂空而至，刚猛中又藏着难测变招。',
    combatBonuses: { attack: 115, speed: 18, hitRate: 5, critRate: 12, critDamage: 26, damageBonus: 14 }, activeSkill: { id: 'celestial-demon-shatter', name: '天魔裂空', description: '一拳裂空，穿透防御并有机会震晕对手。', damageMultiplier: 2.28, defensePierceRate: 42, bonusCritRate: 14, stunRate: 12 },
  },
  {
    id: 'thousand-shadow-step', name: '千影绝踪', category: '外功 · 身法', grade: '神话', gradeTone: 'red', level: 6, mastery: 0, kind: 'outer', keyword: '千影', description: '身法快到仿佛千影并行，杀招往往从意料之外落下。',
    combatBonuses: { attack: 84, speed: 30, dodgeRate: 8, hitRate: 4, critRate: 7 }, activeSkill: { id: 'thousand-shadow-kill', name: '千影绝杀', description: '残影尽收为一击，命中后避开下一次攻击。', damageMultiplier: 1.96, bonusCritRate: 10, grantDodge: 1 },
  },
  {
    id: 'dragon-vein-manual', name: '龙脉真解', category: '内功 · 心法', grade: '神话', gradeTone: 'red', level: 6, mastery: 0, kind: 'inner', keyword: '龙脉', description: '以内息贯通百脉，持久战中气血与劲力皆不易枯竭。',
    innerForceRateMultiplierBase: 0.13, innerForceRateMultiplierPerMastery: 0.006, combatBonuses: { maxHealth: 760, defense: 62, healingBonus: 10, lifestealRate: 3 },
  },
]
