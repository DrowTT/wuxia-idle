import type { Equipment, EquipmentCategory, EquipmentSet, EquipmentSlot } from '../domain/types'

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt', 'talisman', 'ring1', 'ring2']
export const EQUIPMENT_SET_SLOTS = new Set(['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt'])
export const EQUIPMENT_CATEGORIES: readonly EquipmentCategory[] = ['weapon', 'helmet', 'chest', 'mount', 'cloak', 'belt', 'talisman', 'ring']

const RAW_EQUIPMENT_SETS: readonly EquipmentSet[] = [
  {
    id: 'rimebound', name: '踏雪行旅', gradeTone: 'purple', description: '北地旧侠的行装，轻灵如雪，来去无痕。',
    bonuses: [
      { pieces: 3, description: '生命 +280，防御 +24，速度 +10', combatBonuses: { maxHealth: 280, defense: 24, speed: 10 } },
      { pieces: 4, description: '攻击 +38，暴击 +3%', combatBonuses: { attack: 38, critRate: 3 } },
      { pieces: 5, description: '伤害加成 +7%，闪避 +2%', combatBonuses: { damageBonus: 7, dodgeRate: 2 } },
      { pieces: 6, description: '开战后前 2 次受到攻击必定闪避', passiveEffects: [{ id: 'rimebound-snow-trace', label: '踏雪无痕', description: '开战后前 2 次受到攻击必定闪避。', kind: 'battle-start-dodge', value: 2 }] },
    ],
  },
  {
    id: 'ironwall', name: '玄甲镇岳', gradeTone: 'orange', description: '军中镇阵的重甲遗制，稳若山岳，百战不摧。',
    bonuses: [
      { pieces: 3, description: '生命 +520，防御 +46', combatBonuses: { maxHealth: 520, defense: 46 } },
      { pieces: 4, description: '伤害减免 +5%，暴击抵抗 +4%', combatBonuses: { damageReduction: 5, critResist: 4 } },
      { pieces: 5, description: '攻击 +64，生命 +420', combatBonuses: { attack: 64, maxHealth: 420 } },
      { pieces: 6, description: '首回合免疫所有伤害', passiveEffects: [{ id: 'ironwall-immovable', label: '不动如山', description: '首回合免疫所有伤害。', kind: 'damage-immunity-for-rounds', value: 1, duration: 1 }] },
    ],
  },
  {
    id: 'sunfire', name: '赤霄逐日', gradeTone: 'red', description: '传说中逐日剑客的遗装，气血如焰，锋芒贯日。',
    bonuses: [
      { pieces: 3, description: '生命 +720，攻击 +105', combatBonuses: { maxHealth: 720, attack: 105 } },
      { pieces: 4, description: '速度 +32，暴击 +8%，伤害加成 +12%', combatBonuses: { speed: 32, critRate: 8, damageBonus: 12 } },
      { pieces: 5, description: '生命 +800，防御 +70，伤害减免 +6%', combatBonuses: { maxHealth: 800, defense: 70, damageReduction: 6 } },
      { pieces: 6, description: '首回合伤害提高 80%', passiveEffects: [{ id: 'sunfire-rising-sun', label: '赤霄贯日', description: '首回合伤害提高 80%。', kind: 'damage-bonus-for-rounds', value: 80, duration: 1 }] },
    ],
  },
  {
    id: 'windchaser', name: '青岚游侠', gradeTone: 'purple', description: '山岚间的游侠行装，步落无声，剑起如风。',
    bonuses: [
      { pieces: 3, description: '生命 +260，防御 +20，速度 +12', combatBonuses: { maxHealth: 260, defense: 20, speed: 12 } },
      { pieces: 4, description: '攻击 +32，命中 +3%，暴击 +3%', combatBonuses: { attack: 32, hitRate: 3, critRate: 3 } },
      { pieces: 5, description: '闪避 +2%，连击 +6%', combatBonuses: { dodgeRate: 2, comboRate: 6 } },
      { pieces: 6, description: '前三回合连击率 +18%', passiveEffects: [{ id: 'windchaser-gale-chain', label: '乘风连斩', description: '前三回合连击率 +18%。', kind: 'combo-bonus-for-rounds', value: 18, duration: 3 }] },
    ],
  },
  {
    id: 'tideguard', name: '沧澜定海', gradeTone: 'orange', description: '海防名将的旧制战装，静则如渊，动则如潮。',
    bonuses: [
      { pieces: 3, description: '生命 +560，防御 +44', combatBonuses: { maxHealth: 560, defense: 44 } },
      { pieces: 4, description: '攻击 +56，伤害加成 +6%，连击 +5%', combatBonuses: { attack: 56, damageBonus: 6, comboRate: 5 } },
      { pieces: 5, description: '速度 +18，命中 +4%，暴击 +4%', combatBonuses: { speed: 18, hitRate: 4, critRate: 4 } },
      { pieces: 6, description: '前三回合伤害减免 +35%', passiveEffects: [{ id: 'tideguard-tidal-guard', label: '沧澜守势', description: '前三回合伤害减免 +35%。', kind: 'damage-reduction-for-rounds', value: 35, duration: 3 }] },
    ],
  },
  {
    id: 'skyward', name: '苍穹问鼎', gradeTone: 'red', description: '问鼎之战后遗落的御制甲胄，意在凌云，不惧强敌。',
    bonuses: [
      { pieces: 3, description: '生命 +840，攻击 +110', combatBonuses: { maxHealth: 840, attack: 110 } },
      { pieces: 4, description: '防御 +60，速度 +26，伤害加成 +10%', combatBonuses: { defense: 60, speed: 26, damageBonus: 10 } },
      { pieces: 5, description: '暴击 +6%，暴击伤害 +18%，闪避 +2%', combatBonuses: { critRate: 6, critDamage: 18, dodgeRate: 2 } },
      { pieces: 6, description: '首回合敌方无法行动', passiveEffects: [{ id: 'skyward-suppress', label: '问鼎压阵', description: '首回合敌方无法行动。', kind: 'block-enemy-actions-for-rounds', value: 1, duration: 1 }] },
    ],
  },
]

const RAW_EQUIPMENT: readonly Equipment[] = [
  { id: 'nameless', categoryId: 'weapon', name: '无名旧剑', category: '长剑', grade: '普通', gradeTone: 'white', power: 94, gemSlots: 2, weaponStyle: 'sword', keyword: '旧物 · 未锋', lore: '剑锋未利，但出手仍比徒手可靠。', combatBonuses: { attack: 8, speed: 3, hitRate: 1 } },
  { id: 'willow-staff', categoryId: 'weapon', name: '柳木长棍', category: '长棍', grade: '普通', gradeTone: 'white', power: 88, gemSlots: 2, weaponStyle: 'staff', keyword: '守拙 · 稳势', lore: '棍身韧而不折，适合以守待攻。', combatBonuses: { attack: 6, defense: 8, counterRate: 2 } },
  { id: 'rough-iron-helm', categoryId: 'helmet', name: '粗铁护额', category: '头盔', grade: '普通', gradeTone: 'white', power: 48, gemSlots: 1, keyword: '简陋 · 守要', lore: '一块弯铁片，至少能护住眉骨。', combatBonuses: { maxHealth: 34, defense: 3 } },
  { id: 'traveler-vest', categoryId: 'chest', name: '行脚短褂', category: '胸甲', grade: '普通', gradeTone: 'white', power: 54, gemSlots: 1, keyword: '耐磨 · 轻便', lore: '寻常粗布短褂，耐磨而便于赶路。', combatBonuses: { maxHealth: 48, defense: 3, speed: 2 } },
  { id: 'pack-mule', categoryId: 'mount', name: '驮行骡', category: '坐骑', grade: '普通', gradeTone: 'white', power: 42, gemSlots: 1, keyword: '负重 · 安稳', lore: '脚力谈不上快，胜在山路里从不失蹄。', combatBonuses: { maxHealth: 38, defense: 2 } },
  { id: 'reed-cloak', categoryId: 'cloak', name: '蓑衣披肩', category: '披风', grade: '普通', gradeTone: 'white', power: 39, gemSlots: 1, keyword: '避雨 · 藏形', lore: '雨中赶路的旧蓑衣，亦能遮掩身形。', combatBonuses: { defense: 2, dodgeRate: 1 } },
  { id: 'hemp-belt', categoryId: 'belt', name: '麻绳腰带', category: '腰带', grade: '普通', gradeTone: 'white', power: 36, gemSlots: 0, keyword: '束衣 · 定势', lore: '朴素的麻绳，束紧时也能稳住腰腹。', combatBonuses: { maxHealth: 32, attack: 3, defense: 4, speed: 2, stunResist: 1 } },
  { id: 'wooden-talisman', categoryId: 'talisman', name: '桃木符', category: '护符', grade: '普通', gradeTone: 'white', power: 35, gemSlots: 0, keyword: '安神 · 避祟', lore: '刻着浅纹的桃木牌，贴身带着总觉心安。', combatBonuses: { maxHealth: 28, lifestealResist: 1 } },
  { id: 'bronze-ring', categoryId: 'ring', name: '铜环', category: '戒指', grade: '普通', gradeTone: 'white', power: 31, gemSlots: 0, keyword: '握劲 · 习拳', lore: '练拳时常戴的铜环，磨得发亮。', combatBonuses: { attack: 4, hitRate: 1 } },

  { id: 'green-edge', categoryId: 'weapon', name: '青锋', category: '长剑', grade: '优秀', gradeTone: 'green', power: 182, gemSlots: 2, weaponStyle: 'sword', keyword: '轻灵 · 连击', lore: '剑势轻灵，连续命中后更易追加一击。', combatBonuses: { attack: 16, speed: 7, hitRate: 1, comboRate: 6 } },
  { id: 'bamboo-hat', categoryId: 'helmet', name: '青竹斗笠', category: '头盔', grade: '优秀', gradeTone: 'green', power: 76, gemSlots: 1, keyword: '轻甲 · 回避', lore: '竹篾编成的斗笠，挡雨遮目，行走江湖颇为自在。', combatBonuses: { maxHealth: 70, defense: 6, dodgeRate: 1 } },
  { id: 'cloud-vest', categoryId: 'chest', name: '云纹软甲', category: '胸甲', grade: '优秀', gradeTone: 'green', power: 112, gemSlots: 1, keyword: '柔韧 · 护身', lore: '内衬细密锁甲，不妨碍腾挪，亦能卸去数分劲力。', combatBonuses: { maxHealth: 130, defense: 10, damageReduction: 1 } },
  { id: 'green-mane', categoryId: 'mount', name: '青鬃马', category: '坐骑', grade: '优秀', gradeTone: 'green', power: 88, gemSlots: 1, keyword: '疾行 · 先手', lore: '性情温顺而脚程不俗，穿行山道时尤见灵便。', combatBonuses: { maxHealth: 45, speed: 7, dodgeRate: 1 } },
  { id: 'goose-cloak', categoryId: 'cloak', name: '雁翎披风', category: '披风', grade: '优秀', gradeTone: 'green', power: 70, gemSlots: 1, keyword: '游身 · 闪转', lore: '披风落肩如雁翎，转身之间颇能迷惑来敌。', combatBonuses: { defense: 5, speed: 3, dodgeRate: 1 } },
  { id: 'linen-belt', categoryId: 'belt', name: '百纳腰封', category: '腰带', grade: '优秀', gradeTone: 'green', power: 72, gemSlots: 0, keyword: '蓄力 · 守势', lore: '层层缝制的腰封稳住腰胯，发力时更有根基。', combatBonuses: { maxHealth: 75, attack: 6, defense: 6, speed: 3, stunResist: 1 } },
  { id: 'peace-talisman', categoryId: 'talisman', name: '平安符', category: '护符', grade: '优秀', gradeTone: 'green', power: 58, gemSlots: 0, keyword: '定心 · 守元', lore: '随身护符虽旧，危急时总能让人心神一稳。', combatBonuses: { maxHealth: 65, healingBonus: 2, lifestealResist: 1 } },
  { id: 'jade-ring', categoryId: 'ring', name: '青玉扳指', category: '戒指', grade: '优秀', gradeTone: 'green', power: 64, gemSlots: 0, keyword: '凝神 · 准星', lore: '温润玉色养人心神，扣弦出掌都更见沉稳。', combatBonuses: { attack: 7, hitRate: 1, critRate: 1 } },

  { id: 'cold-iron', categoryId: 'weapon', name: '寒铁刀', category: '单刀', grade: '精良', gradeTone: 'blue', power: 228, gemSlots: 2, weaponStyle: 'saber', keyword: '蓄力 · 破甲', lore: '刀势沉稳，强攻时更容易撕开防御。', combatBonuses: { attack: 30, defense: 8, speed: -4, critRate: 2, damageBonus: 4 } },
  { id: 'black-iron-helm', categoryId: 'helmet', name: '乌铁兜鍪', category: '头盔', grade: '精良', gradeTone: 'blue', power: 108, gemSlots: 1, keyword: '沉稳 · 护体', lore: '旧军制式的兜鍪，虽有划痕，仍能护住要害。', combatBonuses: { maxHealth: 110, defense: 11, critResist: 2 } },
  { id: 'river-leather', categoryId: 'chest', name: '渡江皮甲', category: '胸甲', grade: '精良', gradeTone: 'blue', power: 154, gemSlots: 1, keyword: '坚韧 · 反震', lore: '以江鳄背革鞣制，厚实坚韧，适合硬桥硬马的打法。', combatBonuses: { maxHealth: 190, defense: 16, counterResist: 2 } },
  { id: 'storm-hoof', categoryId: 'mount', name: '追风骓', category: '坐骑', grade: '精良', gradeTone: 'blue', power: 136, gemSlots: 1, keyword: '疾驰 · 压阵', lore: '奔走如风的良驹，冲阵时能为主人抢得先机。', combatBonuses: { maxHealth: 85, attack: 7, speed: 12 } },
  { id: 'night-cloak', categoryId: 'cloak', name: '夜行斗篷', category: '披风', grade: '精良', gradeTone: 'blue', power: 102, gemSlots: 1, keyword: '藏锋 · 会心', lore: '墨色斗篷吞没身形，出手前总能多藏一分杀机。', combatBonuses: { defense: 7, critRate: 2, critDamageReduction: 2 } },
  { id: 'tiger-belt', categoryId: 'belt', name: '伏虎革带', category: '腰带', grade: '精良', gradeTone: 'blue', power: 104, gemSlots: 0, keyword: '束劲 · 坚守', lore: '厚革制成的革带，能将周身劲力收束一处。', combatBonuses: { maxHealth: 120, attack: 10, defense: 10, speed: 5, damageReduction: 1 } },
  { id: 'returning-pendant', categoryId: 'talisman', name: '归元佩', category: '护符', grade: '精良', gradeTone: 'blue', power: 94, gemSlots: 0, keyword: '归元 · 护脉', lore: '古玉佩贴身温润，行气时可护住胸腹要穴。', combatBonuses: { maxHealth: 100, defense: 7, healingBonus: 4 } },
  { id: 'iron-ring', categoryId: 'ring', name: '寒星指环', category: '戒指', grade: '精良', gradeTone: 'blue', power: 96, gemSlots: 0, keyword: '锋芒 · 暴击', lore: '寒铁打成的指环，指上力道透出一丝锐意。', combatBonuses: { attack: 12, critRate: 2, critDamage: 8 } },

  { id: 'violet-edge', categoryId: 'weapon', name: '紫电长剑', category: '长剑', grade: '史诗', gradeTone: 'purple', power: 356, gemSlots: 2, weaponStyle: 'sword', keyword: '惊雷 · 破势', lore: '剑身隐有紫纹，起势如电，专破守势未稳之敌。', combatBonuses: { attack: 52, speed: 10, critRate: 4, damageBonus: 6 } },
  { id: 'frostwind-sword', categoryId: 'weapon', name: '霜行剑', category: '长剑', grade: '史诗', gradeTone: 'purple', power: 392, gemSlots: 2, weaponStyle: 'sword', setId: 'rimebound', keyword: '踏雪行旅 · 剑', lore: '剑脊微寒，雪夜挥出时不见半点滞涩。', combatBonuses: { attack: 58, speed: 12, dodgeRate: 2 } },
  { id: 'snowcap-helm', categoryId: 'helmet', name: '寒鸦兜帽', category: '头盔', grade: '史诗', gradeTone: 'purple', power: 218, gemSlots: 2, setId: 'rimebound', keyword: '踏雪行旅 · 盔', lore: '边沿缀着白貂绒，能隔北地凛风。', combatBonuses: { maxHealth: 180, defense: 20, critResist: 3 } },
  { id: 'frostscale-armor', categoryId: 'chest', name: '霜鳞软甲', category: '胸甲', grade: '史诗', gradeTone: 'purple', power: 276, gemSlots: 2, setId: 'rimebound', keyword: '踏雪行旅 · 甲', lore: '层层细鳞如冰面，受力时将劲道卸往四方。', combatBonuses: { maxHealth: 280, defense: 27, damageReduction: 2 } },
  { id: 'white-horse', categoryId: 'mount', name: '照夜白', category: '坐骑', grade: '史诗', gradeTone: 'purple', power: 232, gemSlots: 2, setId: 'rimebound', keyword: '踏雪行旅 · 骑', lore: '踏霜而行的白马，夜路中也能抢得先手。', combatBonuses: { maxHealth: 125, speed: 22, hitRate: 2 } },
  { id: 'snowwing-cloak', categoryId: 'cloak', name: '雪翎披风', category: '披风', grade: '史诗', gradeTone: 'purple', power: 204, gemSlots: 2, setId: 'rimebound', keyword: '踏雪行旅 · 披', lore: '披风翻起如白羽，转折之间极难捉摸。', combatBonuses: { defense: 16, speed: 8, dodgeRate: 3 } },
  { id: 'icecord-belt', categoryId: 'belt', name: '冰蚕束带', category: '腰带', grade: '史诗', gradeTone: 'purple', power: 210, gemSlots: 1, setId: 'rimebound', keyword: '踏雪行旅 · 腰', lore: '冰蚕丝织成，令行气与步法衔接得更紧。', combatBonuses: { maxHealth: 170, attack: 14, defense: 16, speed: 9, comboResist: 3 } },
  { id: 'moon-shadow-pendant', categoryId: 'talisman', name: '月影坠', category: '护符', grade: '史诗', gradeTone: 'purple', power: 190, gemSlots: 0, keyword: '月华 · 养息', lore: '夜色下温润如月，令伤势恢复得更从容。', combatBonuses: { maxHealth: 210, healingBonus: 8, damageReduction: 2 } },
  { id: 'seven-star-ring', categoryId: 'ring', name: '七星戒', category: '戒指', grade: '史诗', gradeTone: 'purple', power: 186, gemSlots: 0, keyword: '星斗 · 会神', lore: '戒面暗刻七星，出招时心念尤为专注。', combatBonuses: { attack: 25, hitRate: 3, critRate: 4 } },

  { id: 'town-mountain-saber', categoryId: 'weapon', name: '镇岳宝刀', category: '单刀', grade: '传说', gradeTone: 'orange', power: 572, gemSlots: 3, weaponStyle: 'saber', keyword: '沉岳 · 断甲', lore: '名匠以百炼寒铁锻成，刀势如山，专擅正面破阵。', combatBonuses: { maxHealth: 260, attack: 84, defense: 28, critDamage: 18, damageBonus: 9 } },
  { id: 'stonebreaker-saber', categoryId: 'weapon', name: '裂碑战刀', category: '单刀', grade: '传说', gradeTone: 'orange', power: 624, gemSlots: 3, weaponStyle: 'saber', setId: 'ironwall', keyword: '玄甲镇岳 · 刀', lore: '厚背长刀，落势沉重如崩石。', combatBonuses: { maxHealth: 330, attack: 98, defense: 32, damageBonus: 8 } },
  { id: 'black-tiger-helm', categoryId: 'helmet', name: '玄虎战盔', category: '头盔', grade: '传说', gradeTone: 'orange', power: 362, gemSlots: 3, setId: 'ironwall', keyword: '玄甲镇岳 · 盔', lore: '盔顶如伏虎之首，重击之下也不失阵脚。', combatBonuses: { maxHealth: 350, defense: 38, critResist: 5 } },
  { id: 'mountain-armor', categoryId: 'chest', name: '镇岳重铠', category: '胸甲', grade: '传说', gradeTone: 'orange', power: 468, gemSlots: 3, setId: 'ironwall', keyword: '玄甲镇岳 · 甲', lore: '甲叶层叠相扣，攻守之间自成一体。', combatBonuses: { maxHealth: 520, defense: 52, damageReduction: 4 } },
  { id: 'iron-hoof', categoryId: 'mount', name: '铁蹄乌骓', category: '坐骑', grade: '传说', gradeTone: 'orange', power: 350, gemSlots: 3, setId: 'ironwall', keyword: '玄甲镇岳 · 骑', lore: '冲阵时蹄声如雷，主人气势也随之高涨。', combatBonuses: { maxHealth: 260, attack: 24, defense: 20, speed: 10 } },
  { id: 'battle-cloak', categoryId: 'cloak', name: '铁幕战披', category: '披风', grade: '传说', gradeTone: 'orange', power: 316, gemSlots: 3, setId: 'ironwall', keyword: '玄甲镇岳 · 披', lore: '厚实披风覆在肩背，能遮住兵刃来路。', combatBonuses: { maxHealth: 230, defense: 28, damageReduction: 3 } },
  { id: 'tiger-cinch', categoryId: 'belt', name: '玄虎束腰', category: '腰带', grade: '传说', gradeTone: 'orange', power: 320, gemSlots: 2, setId: 'ironwall', keyword: '玄甲镇岳 · 腰', lore: '锁扣如虎首，束紧一刻，周身劲力浑然一体。', combatBonuses: { maxHealth: 245, attack: 24, defense: 25, speed: 12, stunResist: 4 } },
  { id: 'tiger-soul-pendant', categoryId: 'talisman', name: '虎魄符', category: '护符', grade: '传说', gradeTone: 'orange', power: 284, gemSlots: 0, keyword: '虎魄 · 不退', lore: '古符温热，危局中能激出胸中一口硬气。', combatBonuses: { maxHealth: 300, defense: 22, counterRate: 5, damageReduction: 2 } },
  { id: 'sea-vault-ring', categoryId: 'ring', name: '沧海戒', category: '戒指', grade: '传说', gradeTone: 'orange', power: 276, gemSlots: 0, keyword: '沧海 · 藏锋', lore: '戒面深蓝如海，令招式沉稳而后劲绵长。', combatBonuses: { attack: 45, defense: 14, critDamage: 16, comboResist: 4 } },

  { id: 'scarlet-sky-sword', categoryId: 'weapon', name: '赤霄神剑', category: '长剑', grade: '神话', gradeTone: 'red', power: 818, gemSlots: 3, weaponStyle: 'sword', setId: 'sunfire', keyword: '赤霄逐日 · 剑', lore: '古剑锋芒内敛，出鞘时有一往无前之势。', combatBonuses: { maxHealth: 360, attack: 120, defense: 34, speed: 18, critRate: 7, damageBonus: 13 } },
  { id: 'sun-crown', categoryId: 'helmet', name: '曜阳冠', category: '头盔', grade: '神话', gradeTone: 'red', power: 492, gemSlots: 3, setId: 'sunfire', keyword: '赤霄逐日 · 冠', lore: '冠沿镶着赤金细纹，仿佛将晨光引在额前。', combatBonuses: { maxHealth: 470, defense: 46, critResist: 6, hitRate: 3 } },
  { id: 'red-sun-mail', categoryId: 'chest', name: '赤日神甲', category: '胸甲', grade: '神话', gradeTone: 'red', power: 658, gemSlots: 3, setId: 'sunfire', keyword: '赤霄逐日 · 甲', lore: '鳞甲泛着炽色，受劲时如日轮般层层荡开。', combatBonuses: { maxHealth: 760, defense: 72, damageReduction: 5 } },
  { id: 'dragon-scale-steed', categoryId: 'mount', name: '龙鳞天驹', category: '坐骑', grade: '神话', gradeTone: 'red', power: 486, gemSlots: 3, setId: 'sunfire', keyword: '赤霄逐日 · 骑', lore: '鬃毛曳火，疾驰时如一道掠过原野的赤光。', combatBonuses: { maxHealth: 360, attack: 48, speed: 35, critRate: 3 } },
  { id: 'flame-cloak', categoryId: 'cloak', name: '焚云大氅', category: '披风', grade: '神话', gradeTone: 'red', power: 448, gemSlots: 3, setId: 'sunfire', keyword: '赤霄逐日 · 披', lore: '大氅迎风如焰，出手时气势压得人难以喘息。', combatBonuses: { maxHealth: 320, defense: 36, speed: 18, damageBonus: 6 } },
  { id: 'heaven-sash', categoryId: 'belt', name: '天火腰绦', category: '腰带', grade: '神话', gradeTone: 'red', power: 452, gemSlots: 2, setId: 'sunfire', keyword: '赤霄逐日 · 腰', lore: '绦带收束丹田之气，使每一招都更为凌厉。', combatBonuses: { maxHealth: 350, attack: 38, defense: 30, speed: 16, comboRate: 5 } },
  { id: 'tianwu-pendant', categoryId: 'talisman', name: '天武令', category: '护符', grade: '神话', gradeTone: 'red', power: 420, gemSlots: 0, keyword: '天武 · 破限', lore: '传承久远的令牌，握在掌中便觉武意沸腾。', combatBonuses: { maxHealth: 420, attack: 62, critRate: 6, damageBonus: 7 } },
  { id: 'bloodjade-ring', categoryId: 'ring', name: '血玉戒', category: '戒指', grade: '神话', gradeTone: 'red', power: 408, gemSlots: 0, keyword: '血玉 · 绝杀', lore: '玉色如血，愈在险处愈显锋锐。', combatBonuses: { attack: 68, critRate: 7, critDamage: 28, lifestealRate: 4 } },

  { id: 'iron-ruler', categoryId: 'weapon', name: '铁尺', category: '短兵', grade: '普通', gradeTone: 'white', power: 86, gemSlots: 2, weaponStyle: 'staff', keyword: '量势 · 守中', lore: '短尺沉手，攻守转换间自有分寸。', combatBonuses: { attack: 7, defense: 5, hitRate: 2 } },
  { id: 'leather-cap', categoryId: 'helmet', name: '旧皮护盔', category: '头盔', grade: '普通', gradeTone: 'white', power: 50, gemSlots: 1, keyword: '护额 · 挺身', lore: '牛皮缝制的护盔，雨打风吹后仍算结实。', combatBonuses: { maxHealth: 40, defense: 4, stunResist: 1 } },
  { id: 'cloth-mail', categoryId: 'chest', name: '布面护心衣', category: '胸甲', grade: '普通', gradeTone: 'white', power: 58, gemSlots: 1, keyword: '贴身 · 护心', lore: '布层里压着薄铁片，护得住胸口要害。', combatBonuses: { maxHealth: 62, defense: 4 } },
  { id: 'sorrel-horse', categoryId: 'mount', name: '枣红马', category: '坐骑', grade: '普通', gradeTone: 'white', power: 49, gemSlots: 1, keyword: '耐走 · 赶路', lore: '跑不出惊人脚程，却能陪人走过长路。', combatBonuses: { maxHealth: 42, speed: 4 } },
  { id: 'worn-cloak', categoryId: 'cloak', name: '旧斗篷', category: '披风', grade: '普通', gradeTone: 'white', power: 43, gemSlots: 1, keyword: '遮风 · 藏拙', lore: '边角已有磨损，仍足以遮住来路风尘。', combatBonuses: { defense: 3, hitRate: 1 } },
  { id: 'oxhide-belt', categoryId: 'belt', name: '牛皮腰封', category: '腰带', grade: '普通', gradeTone: 'white', power: 46, gemSlots: 0, keyword: '束腹 · 定步', lore: '厚皮收束腰腹，练拳时格外踏实。', combatBonuses: { maxHealth: 45, attack: 4, defense: 4, speed: 3 } },
  { id: 'red-cord-knot', categoryId: 'talisman', name: '红绳结', category: '护符', grade: '普通', gradeTone: 'white', power: 38, gemSlots: 0, keyword: '守念 · 安心', lore: '家人系上的红绳，危急时总让人多一分定力。', combatBonuses: { maxHealth: 34, healingBonus: 1 } },
  { id: 'ebony-ring', categoryId: 'ring', name: '乌木指环', category: '戒指', grade: '普通', gradeTone: 'white', power: 36, gemSlots: 0, keyword: '凝握 · 反制', lore: '乌木打磨成环，贴手而不碍出拳。', combatBonuses: { attack: 5, defense: 1, counterRate: 1 } },

  { id: 'hundredfold-dagger', categoryId: 'weapon', name: '百炼短刀', category: '短刀', grade: '优秀', gradeTone: 'green', power: 176, gemSlots: 2, weaponStyle: 'saber', keyword: '短促 · 锋回', lore: '刀身不长，却最擅长贴身抢攻。', combatBonuses: { attack: 18, speed: 5, critRate: 2 } },
  { id: 'willow-helm', categoryId: 'helmet', name: '柳叶盔', category: '头盔', grade: '优秀', gradeTone: 'green', power: 82, gemSlots: 1, keyword: '贴面 · 凝神', lore: '盔沿似柳叶微垂，既护眉眼也不遮视线。', combatBonuses: { maxHealth: 82, defense: 7, hitRate: 1 } },
  { id: 'vine-armor', categoryId: 'chest', name: '青藤甲', category: '胸甲', grade: '优秀', gradeTone: 'green', power: 118, gemSlots: 1, keyword: '柔韧 · 卸劲', lore: '藤丝与软革交织，受力时能略卸锋芒。', combatBonuses: { maxHealth: 118, defense: 9, dodgeRate: 1 } },
  { id: 'chestnut-horse', categoryId: 'mount', name: '枣骝马', category: '坐骑', grade: '优秀', gradeTone: 'green', power: 94, gemSlots: 1, keyword: '快蹄 · 追击', lore: '善走碎石险路，一旦起速便极难追上。', combatBonuses: { maxHealth: 52, speed: 8, critRate: 1 } },
  { id: 'cloud-cloak', categoryId: 'cloak', name: '流云斗篷', category: '披风', grade: '优秀', gradeTone: 'green', power: 78, gemSlots: 1, keyword: '借风 · 游身', lore: '轻纱随风而动，令人难辨下一步去向。', combatBonuses: { defense: 6, speed: 4, dodgeRate: 1 } },
  { id: 'rhino-belt', categoryId: 'belt', name: '犀角腰封', category: '腰带', grade: '优秀', gradeTone: 'green', power: 80, gemSlots: 0, keyword: '收劲 · 不乱', lore: '角扣锁住腰胯，连番出招也不失重心。', combatBonuses: { maxHealth: 86, attack: 7, defense: 7, speed: 4, comboResist: 1 } },
  { id: 'focus-pendant', categoryId: 'talisman', name: '凝神佩', category: '护符', grade: '优秀', gradeTone: 'green', power: 70, gemSlots: 0, keyword: '观隙 · 定心', lore: '佩中细纹如水波，令出手时心念更为澄澈。', combatBonuses: { maxHealth: 74, hitRate: 2, critResist: 1 } },
  { id: 'emerald-ring', categoryId: 'ring', name: '碧玉戒', category: '戒指', grade: '优秀', gradeTone: 'green', power: 72, gemSlots: 0, keyword: '碧色 · 追势', lore: '玉色清润，追招时总能多添几分锐意。', combatBonuses: { attack: 9, critRate: 2, comboRate: 2 } },

  { id: 'blazing-spear', categoryId: 'weapon', name: '流火枪', category: '长枪', grade: '精良', gradeTone: 'blue', power: 244, gemSlots: 2, weaponStyle: 'spear', keyword: '长驱 · 夺隙', lore: '枪缨如火，最擅在对手换势时长驱直入。', combatBonuses: { attack: 32, speed: 5, hitRate: 3, critRate: 2 } },
  { id: 'bronze-helm', categoryId: 'helmet', name: '玄铜护盔', category: '头盔', grade: '精良', gradeTone: 'blue', power: 124, gemSlots: 1, keyword: '玄铜 · 镇首', lore: '铜色深沉，能抗下重击而不乱耳目。', combatBonuses: { maxHealth: 130, defense: 13, critResist: 2 } },
  { id: 'scale-mail', categoryId: 'chest', name: '锁子鱼鳞甲', category: '胸甲', grade: '精良', gradeTone: 'blue', power: 168, gemSlots: 1, keyword: '环扣 · 护身', lore: '细环层叠如鳞，既有韧性也能分散来力。', combatBonuses: { maxHealth: 210, defense: 15, damageReduction: 1 } },
  { id: 'dark-cloud-steed', categoryId: 'mount', name: '墨云驹', category: '坐骑', grade: '精良', gradeTone: 'blue', power: 148, gemSlots: 1, keyword: '掠影 · 先机', lore: '通体乌黑如云，急驰时只余一道残影。', combatBonuses: { maxHealth: 90, speed: 14, hitRate: 2 } },
  { id: 'moon-cloak', categoryId: 'cloak', name: '逐月氅', category: '披风', grade: '精良', gradeTone: 'blue', power: 116, gemSlots: 1, keyword: '追月 · 闪身', lore: '披风外沿缀着银线，转身时能乱人目光。', combatBonuses: { defense: 8, speed: 6, dodgeRate: 2 } },
  { id: 'azure-scale-belt', categoryId: 'belt', name: '青鳞腰甲', category: '腰带', grade: '精良', gradeTone: 'blue', power: 118, gemSlots: 0, keyword: '护腰 · 抗震', lore: '细鳞贴合腰腹，能抵去暗劲余波。', combatBonuses: { maxHealth: 135, attack: 11, defense: 11, speed: 6, stunResist: 2 } },
  { id: 'clear-mind-jade', categoryId: 'talisman', name: '明心玉', category: '护符', grade: '精良', gradeTone: 'blue', power: 108, gemSlots: 0, keyword: '明澈 · 守意', lore: '玉色澄净，令人在乱战中仍能看清破绽。', combatBonuses: { maxHealth: 130, hitRate: 2, damageReduction: 1 } },
  { id: 'glimmer-ring', categoryId: 'ring', name: '流光戒', category: '戒指', grade: '精良', gradeTone: 'blue', power: 112, gemSlots: 0, keyword: '流光 · 连势', lore: '戒面流光一闪，招式衔接愈发圆融。', combatBonuses: { attack: 15, critRate: 3, comboRate: 3 } },

  { id: 'dragon-roam-sword', categoryId: 'weapon', name: '游龙剑', category: '长剑', grade: '史诗', gradeTone: 'purple', power: 416, gemSlots: 2, weaponStyle: 'sword', setId: 'windchaser', keyword: '青岚游侠 · 剑', lore: '剑路灵动如游龙，最适合在山风间抢占先机。', combatBonuses: { attack: 62, speed: 15, hitRate: 3, dodgeRate: 2 } },
  { id: 'azure-mist-hood', categoryId: 'helmet', name: '青岚巾', category: '头盔', grade: '史诗', gradeTone: 'purple', power: 224, gemSlots: 2, setId: 'windchaser', keyword: '青岚游侠 · 巾', lore: '青巾轻覆额前，奔走时不扰视线。', combatBonuses: { maxHealth: 190, defense: 18, speed: 6, dodgeRate: 1 } },
  { id: 'windward-armor', categoryId: 'chest', name: '逐风轻甲', category: '胸甲', grade: '史诗', gradeTone: 'purple', power: 286, gemSlots: 2, setId: 'windchaser', keyword: '青岚游侠 · 甲', lore: '甲片极薄，身随意动而不失护持。', combatBonuses: { maxHealth: 250, defense: 24, speed: 10, damageReduction: 1 } },
  { id: 'cloud-stepper', categoryId: 'mount', name: '踏云骢', category: '坐骑', grade: '史诗', gradeTone: 'purple', power: 248, gemSlots: 2, setId: 'windchaser', keyword: '青岚游侠 · 骑', lore: '蹄声轻若踏云，翻山越岭亦不减速。', combatBonuses: { maxHealth: 145, speed: 25, hitRate: 2 } },
  { id: 'mist-cloak', categoryId: 'cloak', name: '流岚披风', category: '披风', grade: '史诗', gradeTone: 'purple', power: 216, gemSlots: 2, setId: 'windchaser', keyword: '青岚游侠 · 披', lore: '青岚拂肩，转折之际只留一片残影。', combatBonuses: { defense: 14, speed: 11, dodgeRate: 4 } },
  { id: 'drifting-sash', categoryId: 'belt', name: '流云束带', category: '腰带', grade: '史诗', gradeTone: 'purple', power: 218, gemSlots: 1, setId: 'windchaser', keyword: '青岚游侠 · 腰', lore: '束带如云纹回转，使步法与出招连为一气。', combatBonuses: { maxHealth: 155, attack: 16, defense: 14, speed: 10, comboRate: 4, comboResist: 2 } },
  { id: 'wave-pendant', categoryId: 'talisman', name: '凌波佩', category: '护符', grade: '史诗', gradeTone: 'purple', power: 210, gemSlots: 0, keyword: '凌波 · 化影', lore: '佩光浮动如水，来势越急越容易借步避开。', combatBonuses: { maxHealth: 190, speed: 11, dodgeRate: 2, damageReduction: 1 } },
  { id: 'sunset-ring', categoryId: 'ring', name: '流霞双环', category: '戒指', grade: '史诗', gradeTone: 'purple', power: 208, gemSlots: 0, keyword: '流霞 · 追锋', lore: '双环映光如霞，追击时锋芒更盛。', combatBonuses: { attack: 27, critRate: 3, counterRate: 3 } },

  { id: 'sea-suppressing-spear', categoryId: 'weapon', name: '沧澜枪', category: '长枪', grade: '传说', gradeTone: 'orange', power: 662, gemSlots: 3, weaponStyle: 'spear', setId: 'tideguard', keyword: '沧澜定海 · 枪', lore: '枪身沉如铁锚，横扫时自有定海之势。', combatBonuses: { maxHealth: 280, attack: 102, defense: 26, hitRate: 4, damageBonus: 7 } },
  { id: 'sea-guard-helm', categoryId: 'helmet', name: '定海盔', category: '头盔', grade: '传说', gradeTone: 'orange', power: 372, gemSlots: 3, setId: 'tideguard', keyword: '沧澜定海 · 盔', lore: '盔脊如浪，重击临头也不失方寸。', combatBonuses: { maxHealth: 380, defense: 40, critResist: 4, stunResist: 2 } },
  { id: 'tide-armor', categoryId: 'chest', name: '玄潮重甲', category: '胸甲', grade: '传说', gradeTone: 'orange', power: 486, gemSlots: 3, setId: 'tideguard', keyword: '沧澜定海 · 甲', lore: '甲面暗纹似潮，受劲后层层散去。', combatBonuses: { maxHealth: 560, defense: 50, damageReduction: 3 } },
  { id: 'wave-runner', categoryId: 'mount', name: '踏浪龙驹', category: '坐骑', grade: '传说', gradeTone: 'orange', power: 368, gemSlots: 3, setId: 'tideguard', keyword: '沧澜定海 · 骑', lore: '鬃毛如浪翻卷，冲锋时稳得惊人。', combatBonuses: { maxHealth: 280, attack: 28, defense: 18, speed: 15 } },
  { id: 'tide-cloak', categoryId: 'cloak', name: '沧涛战氅', category: '披风', grade: '传说', gradeTone: 'orange', power: 332, gemSlots: 3, setId: 'tideguard', keyword: '沧澜定海 · 披', lore: '大氅厚而不滞，能将背后劲风尽数卸开。', combatBonuses: { maxHealth: 240, defense: 30, damageReduction: 3, counterResist: 3 } },
  { id: 'tide-belt', categoryId: 'belt', name: '镇潮腰甲', category: '腰带', grade: '传说', gradeTone: 'orange', power: 334, gemSlots: 2, setId: 'tideguard', keyword: '沧澜定海 · 腰', lore: '腰甲扣紧，出招时如立潮头而不摇。', combatBonuses: { maxHealth: 260, attack: 28, defense: 26, speed: 13, comboRate: 4, stunResist: 3 } },
  { id: 'war-banner-talisman', categoryId: 'talisman', name: '定军符', category: '护符', grade: '传说', gradeTone: 'orange', power: 310, gemSlots: 0, keyword: '定军 · 不退', lore: '旧军旗一角制成的符牌，危局中尤能安定心气。', combatBonuses: { maxHealth: 280, defense: 23, stunResist: 4, damageReduction: 2 } },
  { id: 'dawn-ring', categoryId: 'ring', name: '破晓戒', category: '戒指', grade: '传说', gradeTone: 'orange', power: 308, gemSlots: 0, keyword: '破晓 · 振锋', lore: '晨光映入戒面，久战之后锋势反而更盛。', combatBonuses: { attack: 48, speed: 5, critRate: 6, comboRate: 3 } },

  { id: 'skyward-sword', categoryId: 'weapon', name: '天衡剑', category: '长剑', grade: '神话', gradeTone: 'red', power: 858, gemSlots: 3, weaponStyle: 'sword', setId: 'skyward', keyword: '苍穹问鼎 · 剑', lore: '剑脊如天衡贯空，挥落时气势不容人退。', combatBonuses: { maxHealth: 380, attack: 132, defense: 30, speed: 22, hitRate: 5, critRate: 6, damageBonus: 11 } },
  { id: 'heaven-crown', categoryId: 'helmet', name: '昊天冠', category: '头盔', grade: '神话', gradeTone: 'red', power: 508, gemSlots: 3, setId: 'skyward', keyword: '苍穹问鼎 · 冠', lore: '冠纹如星河垂落，镇定心神而不失锐气。', combatBonuses: { maxHealth: 500, defense: 48, speed: 8, critResist: 5 } },
  { id: 'heaven-armor', categoryId: 'chest', name: '镇天神甲', category: '胸甲', grade: '神话', gradeTone: 'red', power: 676, gemSlots: 3, setId: 'skyward', keyword: '苍穹问鼎 · 甲', lore: '重甲不显笨拙，仿佛能将来势尽数镇回。', combatBonuses: { maxHealth: 820, defense: 76, damageReduction: 5 } },
  { id: 'heaven-steed', categoryId: 'mount', name: '玄天麟驹', category: '坐骑', grade: '神话', gradeTone: 'red', power: 502, gemSlots: 3, setId: 'skyward', keyword: '苍穹问鼎 · 骑', lore: '鳞纹随步明灭，冲阵时如有雷音相随。', combatBonuses: { maxHealth: 390, attack: 52, speed: 38, critRate: 2 } },
  { id: 'sky-cloak', categoryId: 'cloak', name: '天游战袍', category: '披风', grade: '神话', gradeTone: 'red', power: 462, gemSlots: 3, setId: 'skyward', keyword: '苍穹问鼎 · 披', lore: '袍袖展开如云海覆天，能压住敌方攻势。', combatBonuses: { maxHealth: 340, defense: 40, speed: 16, damageReduction: 3 } },
  { id: 'cosmos-belt', categoryId: 'belt', name: '乾坤玉带', category: '腰带', grade: '神话', gradeTone: 'red', power: 468, gemSlots: 2, setId: 'skyward', keyword: '苍穹问鼎 · 腰', lore: '玉带收束周天，蓄势一击格外雄浑。', combatBonuses: { maxHealth: 370, attack: 42, defense: 28, speed: 18, comboRate: 6, counterRate: 3 } },
  { id: 'firmament-token', categoryId: 'talisman', name: '玄穹令', category: '护符', grade: '神话', gradeTone: 'red', power: 438, gemSlots: 0, keyword: '玄穹 · 不坠', lore: '令牌沉静如夜空，最能压住临阵杂念。', combatBonuses: { maxHealth: 450, defense: 32, critResist: 5, damageReduction: 4 } },
  { id: 'heavenly-ring', categoryId: 'ring', name: '问天指环', category: '戒指', grade: '神话', gradeTone: 'red', power: 424, gemSlots: 0, keyword: '问天 · 破锋', lore: '指环边缘锋锐，出手时仿佛要问天借势。', combatBonuses: { attack: 72, hitRate: 6, critRate: 7, critDamage: 20 } },
  { id: 'leather-wraps', categoryId: 'weapon', name: '牛皮护拳', category: '拳套', grade: '普通', gradeTone: 'white', power: 90, gemSlots: 2, weaponStyle: 'fist', keyword: '贴身 · 固腕', lore: '粗皮裹住拳锋，出拳时更不伤筋骨。', combatBonuses: { attack: 9, defense: 4, counterRate: 1 } },
  { id: 'vine-gauntlets', categoryId: 'weapon', name: '青藤拳套', category: '拳套', grade: '优秀', gradeTone: 'green', power: 184, gemSlots: 2, weaponStyle: 'fist', keyword: '缠劲 · 灵变', lore: '藤丝柔韧贴手，擒拿与变招都更自如。', combatBonuses: { attack: 19, speed: 4, hitRate: 2, counterRate: 3 } },
  { id: 'steel-knuckles', categoryId: 'weapon', name: '乌钢护拳', category: '拳套', grade: '精良', gradeTone: 'blue', power: 236, gemSlots: 2, weaponStyle: 'fist', keyword: '震骨 · 碎劲', lore: '乌钢环扣护住拳骨，短距离爆发尤见凌厉。', combatBonuses: { attack: 32, defense: 9, critRate: 2, stunRate: 2 } },
  { id: 'silkworm-gauntlets', categoryId: 'weapon', name: '天蚕手甲', category: '拳套', grade: '史诗', gradeTone: 'purple', power: 382, gemSlots: 2, weaponStyle: 'fist', keyword: '蚕丝 · 缠锁', lore: '内衬天蚕丝，刚柔并济，最适合近身缠斗。', combatBonuses: { attack: 56, speed: 9, hitRate: 3, counterRate: 5, comboRate: 3 } },
  { id: 'dragon-grip-gauntlets', categoryId: 'weapon', name: '擒龙手甲', category: '拳套', grade: '传说', gradeTone: 'orange', power: 604, gemSlots: 3, weaponStyle: 'fist', keyword: '擒龙 · 裂甲', lore: '甲片如龙爪扣合，擒住便能撕开对手防势。', combatBonuses: { maxHealth: 220, attack: 90, defense: 22, critRate: 5, damageBonus: 7 } },
  { id: 'heaven-shaking-gauntlets', categoryId: 'weapon', name: '撼天拳甲', category: '拳套', grade: '神话', gradeTone: 'red', power: 838, gemSlots: 3, weaponStyle: 'fist', keyword: '撼天 · 裂空', lore: '拳甲沉如山岳，挥动时仿佛连空气也会崩裂。', combatBonuses: { maxHealth: 330, attack: 126, defense: 32, speed: 14, critRate: 7, damageBonus: 11 } },
]

/**
 * Equipment uses a grade budget for its four core attributes. The old data
 * values are retained as a migration source: their relative weights decide
 * which core attributes receive the budget, while a small grade-scaled flat
 * portion and all secondary attributes remain additive. This keeps the data
 * readable and makes new items use the same balance rule without hand-tuning
 * every realm.
 */
const CORE_COMBAT_STATS = ['maxHealth', 'attack', 'defense', 'speed'] as const
const GRADE_CORE_RATE_BUDGET: Record<Equipment['gradeTone'], number> = {
  white: 1,
  green: 2,
  blue: 3.5,
  purple: 5,
  orange: 7,
  red: 9,
}
const EQUIPMENT_SLOT_RATE_WEIGHT: Record<Equipment['categoryId'], number> = {
  weapon: 1.15,
  helmet: 1,
  chest: 1.1,
  mount: 1,
  cloak: 1,
  belt: 0.9,
  talisman: 0.8,
  ring: 0.8,
}
const CORE_VALUE_REFERENCE: Record<(typeof CORE_COMBAT_STATS)[number], number> = {
  maxHealth: 250,
  attack: 30,
  defense: 20,
  speed: 10,
}
const FIXED_CORE_RETAIN_RATIO: Record<Equipment['gradeTone'], number> = {
  white: 0.25,
  green: 0.2,
  blue: 0.15,
  purple: 0.12,
  orange: 0.1,
  red: 0.08,
}

function normalizeEquipment(item: Equipment): Equipment {
  const source = item.combatBonuses ?? {}
  const weights = CORE_COMBAT_STATS.flatMap((stat) => {
    const value = source[stat]
    if (typeof value !== 'number' || value <= 0) return []
    return [[stat, value / CORE_VALUE_REFERENCE[stat]] as const]
  })
  const totalWeight = weights.reduce((sum, [, value]) => sum + value, 0)
  const totalRate = GRADE_CORE_RATE_BUDGET[item.gradeTone] * EQUIPMENT_SLOT_RATE_WEIGHT[item.categoryId]
  const combatRates = totalWeight > 0
    ? Object.fromEntries(weights.map(([stat, value]) => [stat, Math.round((totalRate * value / totalWeight) * 100) / 100]))
    : undefined
  const retainedCoreBonuses = Object.fromEntries(CORE_COMBAT_STATS.flatMap((stat) => {
    const value = source[stat]
    if (typeof value !== 'number' || value <= 0) return []
    return [[stat, Math.max(1, Math.round(value * FIXED_CORE_RETAIN_RATIO[item.gradeTone]))]]
  }))
  const otherBonuses = Object.fromEntries(Object.entries(source).filter(([key, value]) => (
    !CORE_COMBAT_STATS.includes(key as (typeof CORE_COMBAT_STATS)[number]) || (typeof value === 'number' && value < 0)
  )))
  const combatBonuses = { ...retainedCoreBonuses, ...otherBonuses }
  return {
    ...item,
    combatRates,
    combatBonuses: Object.keys(combatBonuses).length ? combatBonuses : undefined,
  }
}

export const EQUIPMENT: readonly Equipment[] = RAW_EQUIPMENT.map(normalizeEquipment)

const SET_RATE_BUDGET: Record<Equipment['gradeTone'], Record<3 | 4 | 5, number>> = {
  white: { 3: 2, 4: 2.5, 5: 3 },
  green: { 3: 2.5, 4: 3, 5: 3.5 },
  blue: { 3: 3, 4: 3.5, 5: 4 },
  purple: { 3: 4, 4: 5, 5: 6 },
  orange: { 3: 5, 4: 6, 5: 7 },
  red: { 3: 6, 4: 7, 5: 8 },
}

function normalizeSet(set: EquipmentSet): EquipmentSet {
  const coreLabels: Record<(typeof CORE_COMBAT_STATS)[number], string> = { maxHealth: '生命', attack: '攻击', defense: '防御', speed: '速度' }
  const secondaryLabels: Record<string, string> = {
    hitRate: '命中', dodgeRate: '闪避', critRate: '暴击', critDamage: '暴伤', comboRate: '连击', counterRate: '反击', stunRate: '眩晕', lifestealRate: '吸血',
    critResist: '暴抗', comboResist: '连抗', counterResist: '反抗', stunResist: '晕抗', lifestealResist: '吸抗', healingBonus: '治疗',
    critDamageReduction: '暴伤减免', damageBonus: '伤害加成', damageReduction: '伤害减免',
  }
  const bonuses = set.bonuses.map((bonus) => {
    const source = bonus.combatBonuses ?? {}
    const weights = CORE_COMBAT_STATS.flatMap((stat) => {
      const value = source[stat]
      if (typeof value !== 'number' || value <= 0) return []
      return [[stat, value / CORE_VALUE_REFERENCE[stat]] as const]
    })
    const totalWeight = weights.reduce((sum, [, value]) => sum + value, 0)
    const totalRate = bonus.pieces === 6 ? 0 : SET_RATE_BUDGET[set.gradeTone][bonus.pieces]
    const combatRates = totalWeight > 0 && totalRate > 0
      ? Object.fromEntries(weights.map(([stat, value]) => [stat, Math.round((totalRate * value / totalWeight) * 100) / 100]))
      : undefined
    const combatBonuses = Object.fromEntries(Object.entries(source).filter(([key, value]) => (
      !CORE_COMBAT_STATS.includes(key as (typeof CORE_COMBAT_STATS)[number]) || (typeof value === 'number' && value < 0)
    )))
    const rateDescription = Object.entries(combatRates ?? {}).flatMap(([stat, value]) => {
      const label = coreLabels[stat as (typeof CORE_COMBAT_STATS)[number]]
      return label && typeof value === 'number' ? `${label} +${value}%` : []
    })
    const fixedDescription = Object.entries(combatBonuses).flatMap(([stat, value]) => {
      const label = secondaryLabels[stat] ?? coreLabels[stat as (typeof CORE_COMBAT_STATS)[number]]
      if (!label || typeof value !== 'number') return []
      const percentage = !CORE_COMBAT_STATS.includes(stat as (typeof CORE_COMBAT_STATS)[number])
      return `${label} ${value > 0 ? '+' : ''}${value}${percentage ? '%' : ''}`
    })
    const description = [...rateDescription, ...fixedDescription].join('，') || bonus.description
    return {
      ...bonus,
      description,
      combatRates,
      combatBonuses: Object.keys(combatBonuses).length ? combatBonuses : undefined,
    }
  })
  return { ...set, bonuses }
}

export const EQUIPMENT_SETS: readonly EquipmentSet[] = RAW_EQUIPMENT_SETS.map(normalizeSet)
