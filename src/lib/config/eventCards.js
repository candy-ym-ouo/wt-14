export const EVENT_CARDS = [
  {
    id: 'ambush',
    name: '伏击',
    description: '敌方随机一支部队受到2点伤害',
    type: 'negative',
    effect: 'damage_random_enemy',
    value: 2,
    rarity: 'common',
    weight: 3
  },
  {
    id: 'reinforce',
    name: '增援',
    description: '我方随机一支部队恢复2点生命',
    type: 'positive',
    effect: 'heal_random_ally',
    value: 2,
    rarity: 'common',
    weight: 3
  },
  {
    id: 'morale_boost',
    name: '士气高涨',
    description: '我方所有部队本回合攻击力+1',
    type: 'positive',
    effect: 'buff_all_attack',
    value: 1,
    rarity: 'rare',
    weight: 2
  },
  {
    id: 'fog_of_war',
    name: '迷雾',
    description: '敌方所有部队本回合移动力-1',
    type: 'negative',
    effect: 'debuff_all_enemy_move',
    value: 1,
    rarity: 'rare',
    weight: 2
  },
  {
    id: 'treasure',
    name: '发现宝藏',
    description: '随机一支部队永久+1攻击力',
    type: 'positive',
    effect: 'permanent_buff_attack',
    value: 1,
    rarity: 'rare',
    weight: 1
  },
  {
    id: 'ancient_trap',
    name: '远古陷阱',
    description: '随机一支部队受到3点伤害',
    type: 'negative',
    effect: 'damage_random',
    value: 3,
    rarity: 'common',
    weight: 2
  },
  {
    id: 'relic',
    name: '神秘遗物',
    description: '我方所有部队永久+1防御力',
    type: 'positive',
    effect: 'permanent_buff_all_defense',
    value: 1,
    rarity: 'legendary',
    weight: 1
  },
  {
    id: 'earthquake',
    name: '地震',
    description: '所有部队受到1点伤害',
    type: 'neutral',
    effect: 'damage_all',
    value: 1,
    rarity: 'rare',
    weight: 1
  },
  {
    id: 'scout_report',
    name: '侦察报告',
    description: '查看敌方所有部队状态（仅显示）',
    type: 'positive',
    effect: 'reveal_enemy',
    value: 0,
    rarity: 'common',
    weight: 2
  },
  {
    id: 'supply_cache',
    name: '补给点',
    description: '下一回合可多行动一个单位',
    type: 'positive',
    effect: 'extra_action',
    value: 1,
    rarity: 'common',
    weight: 2
  },
  {
    id: 'cursed_ground',
    name: '诅咒之地',
    description: '所有部队本回合无法移动超过2格',
    type: 'neutral',
    effect: 'limit_all_movement',
    value: 2,
    rarity: 'rare',
    weight: 1
  },
  {
    id: 'healing_spring',
    name: '治愈之泉',
    description: '我方所有部队恢复1点生命',
    type: 'positive',
    effect: 'heal_all_ally',
    value: 1,
    rarity: 'rare',
    weight: 2
  }
];

export const EVENT_CARD_CONFIG = {
  drawPerTurn: 1,
  handLimit: 3,
  playPerTurn: 1
};
