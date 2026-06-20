export const RUINS_CONFIG = {
  width: 12,
  height: 10,
  maxFloors: 5,
  startFloor: 1,
  maxUnits: 6,
  minUnits: 3,
  exitRequired: 1,
  dangerPerFloor: 0.15,
  treasurePerFloor: 0.2,
  eventPerFloor: 0.3
};

export const RUINS_TERRAIN = {
  entrance: { id: 'entrance', name: '入口', color: 0x4a90a4, moveCost: 1, defense: 0, icon: '🚪' },
  exit: { id: 'exit', name: '撤离点', color: 0x4aa44a, moveCost: 1, defense: 1, icon: '🚀' },
  treasure: { id: 'treasure', name: '宝箱', color: 0xd4af37, moveCost: 1, defense: 0, icon: '📦' },
  trap: { id: 'trap', name: '陷阱', color: 0xa44a4a, moveCost: 1, defense: 0, icon: '⚠️' },
  event: { id: 'event', name: '事件点', color: 0x904aa4, moveCost: 1, defense: 0, icon: '❓' },
  ruin_wall: { id: 'ruin_wall', name: '遗迹墙壁', color: 0x5c4033, moveCost: 999, defense: 0, icon: '🧱' },
  ruin_floor: { id: 'ruin_floor', name: '遗迹地面', color: 0x6b5344, moveCost: 1, defense: 0, icon: '' },
  ruin_pillar: { id: 'ruin_pillar', name: '石柱', color: 0x7a6a5a, moveCost: 999, defense: 2, icon: '🏛️' },
  water: { id: 'water', name: '积水', color: 0x1e4d6b, moveCost: 2, defense: 0, icon: '💧' }
};

export const RUINS_EVENT_TYPES = [
  {
    id: 'merchant',
    name: '神秘商人',
    icon: '🧙',
    description: '一位神秘的商人出现在你面前，提供交易',
    weight: 2,
    choices: [
      {
        id: 'buy_heal',
        text: '花费 30 金币，恢复所有单位 2 生命',
        cost: { gold: 30 },
        effect: { type: 'heal_all', value: 2 }
      },
      {
        id: 'buy_buff',
        text: '花费 50 金币，所有单位攻击 +1',
        cost: { gold: 50 },
        effect: { type: 'buff_all_attack', value: 1 }
      },
      {
        id: 'leave',
        text: '不交易，离开',
        cost: null,
        effect: null
      }
    ]
  },
  {
    id: 'shrine',
    name: '古老神殿',
    icon: '⛩️',
    description: '你发现了一座古老的神殿，散发着神秘的光芒',
    weight: 2,
    choices: [
      {
        id: 'pray',
        text: '祈祷（随机获得祝福或诅咒）',
        cost: null,
        effect: { type: 'random_blessing_or_curse' }
      },
      {
        id: 'sacrifice',
        text: '献祭 1 单位生命上限，获得 100 金币',
        cost: { hp: 1 },
        effect: { type: 'gain_gold', value: 100 }
      },
      {
        id: 'leave',
        text: '离开',
        cost: null,
        effect: null
      }
    ]
  },
  {
    id: 'fountain',
    name: '治愈之泉',
    icon: '⛲',
    description: '清澈的泉水从地下涌出',
    weight: 2,
    choices: [
      {
        id: 'drink',
        text: '饮用泉水（恢复 3 生命）',
        cost: null,
        effect: { type: 'heal_random', value: 3 }
      },
      {
        id: 'collect',
        text: '收集泉水（获得 20 金币）',
        cost: null,
        effect: { type: 'gain_gold', value: 20 }
      }
    ]
  },
  {
    id: 'library',
    name: '遗迹图书馆',
    icon: '📚',
    description: '布满灰尘的书架上摆满了古老的书籍',
    weight: 1,
    choices: [
      {
        id: 'study',
        text: '研究古籍（随机单位永久 +1 防御）',
        cost: null,
        effect: { type: 'permanent_buff_random_defense', value: 1 }
      },
      {
        id: 'search',
        text: '搜索宝物（50% 获得宝物）',
        cost: null,
        effect: { type: 'random_treasure' }
      }
    ]
  },
  {
    id: 'trap_event',
    name: '隐藏陷阱',
    icon: '🕳️',
    description: '你触发了一个隐藏的陷阱！',
    weight: 2,
    choices: [
      {
        id: 'dodge',
        text: '尝试躲避（50% 成功，失败受到 2 伤害）',
        cost: null,
        effect: { type: 'dodge_trap', success: { type: 'nothing' }, failure: { type: 'damage_random', value: 2 } }
      },
      {
        id: 'endure',
        text: '硬抗（受到 1 伤害，获得 30 金币）',
        cost: { hp: 1 },
        effect: { type: 'gain_gold', value: 30 }
      }
    ]
  },
  {
    id: 'rest_camp',
    name: '废弃营地',
    icon: '🏕️',
    description: '一个安全的营地，可以短暂休息',
    weight: 1,
    choices: [
      {
        id: 'rest',
        text: '休息（所有单位恢复 1 生命）',
        cost: null,
        effect: { type: 'heal_all', value: 1 }
      },
      {
        id: 'scavenge',
        text: '搜刮（获得 15 金币）',
        cost: null,
        effect: { type: 'gain_gold', value: 15 }
      }
    ]
  }
];

export const RUINS_TREASURES = [
  {
    id: 'sword',
    name: '锋利短剑',
    icon: '🗡️',
    description: '攻击 +2',
    rarity: 'common',
    weight: 5,
    effect: { type: 'buff_attack', value: 2, target: 'random' }
  },
  {
    id: 'shield',
    name: '坚固盾牌',
    icon: '🛡️',
    description: '防御 +2',
    rarity: 'common',
    weight: 5,
    effect: { type: 'buff_defense', value: 2, target: 'random' }
  },
  {
    id: 'helmet',
    name: '铁盔',
    icon: '⛑️',
    description: '生命上限 +3',
    rarity: 'common',
    weight: 4,
    effect: { type: 'buff_maxHp', value: 3, target: 'random' }
  },
  {
    id: 'boots',
    name: '疾风之靴',
    icon: '👢',
    description: '移动力 +1',
    rarity: 'uncommon',
    weight: 3,
    effect: { type: 'buff_moveRange', value: 1, target: 'random' }
  },
  {
    id: 'ring',
    name: '力量戒指',
    icon: '💍',
    description: '攻击 +3，防御 +1',
    rarity: 'rare',
    weight: 2,
    effect: { type: 'buff_attack_defense', attack: 3, defense: 1, target: 'random' }
  },
  {
    id: 'amulet',
    name: '生命护符',
    icon: '📿',
    description: '所有单位生命 +2',
    rarity: 'rare',
    weight: 2,
    effect: { type: 'buff_all_maxHp', value: 2 }
  },
  {
    id: 'ancient_scroll',
    name: '远古卷轴',
    icon: '📜',
    description: '随机单位永久 +1 攻击，+1 防御',
    rarity: 'epic',
    weight: 1,
    effect: { type: 'permanent_buff_attack_defense', attack: 1, defense: 1, target: 'random' }
  },
  {
    id: 'gold_pile',
    name: '金币堆',
    icon: '💰',
    description: '获得 80 金币',
    rarity: 'common',
    weight: 6,
    effect: { type: 'gain_gold', value: 80 }
  },
  {
    id: 'gold_chest',
    name: '黄金宝箱',
    icon: '💎',
    description: '获得 150 金币',
    rarity: 'uncommon',
    weight: 3,
    effect: { type: 'gain_gold', value: 150 }
  },
  {
    id: 'legendary_sword',
    name: '传说之剑',
    icon: '⚔️',
    description: '所有单位攻击 +2',
    rarity: 'legendary',
    weight: 1,
    effect: { type: 'buff_all_attack', value: 2 }
  }
];

export const RUINS_ENEMY_TEMPLATES = [
  { type: 'scout', level: 1, count: 2 },
  { type: 'infantry', level: 1, count: 3 },
  { type: 'archer', level: 1, count: 2 },
  { type: 'knight', level: 1, count: 1 },
  { type: 'mage', level: 1, count: 1 }
];

export const RUINS_DIFFICULTY = {
  1: { enemyLevelBonus: 0, enemyCount: 2, treasureBonus: 0 },
  2: { enemyLevelBonus: 0, enemyCount: 3, treasureBonus: 1 },
  3: { enemyLevelBonus: 1, enemyCount: 3, treasureBonus: 1 },
  4: { enemyLevelBonus: 1, enemyCount: 4, treasureBonus: 2 },
  5: { enemyLevelBonus: 2, enemyCount: 4, treasureBonus: 2 }
};

export const RUINS_MAP_TEMPLATES = [
  {
    id: 'forest_ruins',
    name: '森林遗迹',
    description: '被茂密森林覆盖的古老遗迹',
    terrainWeights: {
      ruin_floor: 60, ruin_wall: 15, ruin_pillar: 10, water: 10, forest: 5
    }
  },
  {
    id: 'mountain_ruins',
    name: '山脉遗迹',
    description: '深藏于山脉中的神秘遗迹',
    terrainWeights: {
      ruin_floor: 50, ruin_wall: 25, ruin_pillar: 15, mountain: 10
    }
  },
  {
    id: 'underground_ruins',
    name: '地下遗迹',
    description: '黑暗的地下迷宫遗迹',
    terrainWeights: {
      ruin_floor: 70, ruin_wall: 20, water: 5, ruin_pillar: 5
    }
  }
];

export function getWeightedRandom(items, weightKey = 'weight') {
  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= (item[weightKey] || 1);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}
