export const UNIT_CLASSES = {
  scout: { id: 'scout', name: '侦察', icon: '👁️' },
  infantry: { id: 'infantry', name: '步兵', icon: '⚔️' },
  archer: { id: 'archer', name: '远程', icon: '🏹' },
  knight: { id: 'knight', name: '重装', icon: '🛡️' },
  mage: { id: 'mage', name: '法术', icon: '✨' }
};

export const UNIT_TYPES = {
  scout: {
    id: 'scout',
    name: '侦察兵',
    unitClass: 'scout',
    hp: 3,
    attack: 2,
    defense: 0,
    moveRange: 4,
    attackRange: 1,
    cost: 2,
    recruitCost: 30,
    color: 0x66cc66,
    description: '移动力强，适合探索'
  },
  infantry: {
    id: 'infantry',
    name: '步兵',
    unitClass: 'infantry',
    hp: 5,
    attack: 3,
    defense: 1,
    moveRange: 2,
    attackRange: 1,
    cost: 3,
    recruitCost: 40,
    color: 0xcc6666,
    description: '基础作战单位'
  },
  archer: {
    id: 'archer',
    name: '弓箭手',
    unitClass: 'archer',
    hp: 3,
    attack: 4,
    defense: 0,
    moveRange: 2,
    attackRange: 3,
    cost: 4,
    recruitCost: 60,
    color: 0x6666cc,
    description: '远程攻击，脆弱'
  },
  knight: {
    id: 'knight',
    name: '骑士',
    unitClass: 'knight',
    hp: 7,
    attack: 4,
    defense: 2,
    moveRange: 3,
    attackRange: 1,
    cost: 5,
    recruitCost: 100,
    color: 0xcccc66,
    description: '重装近战，攻防兼备'
  },
  mage: {
    id: 'mage',
    name: '法师',
    unitClass: 'mage',
    hp: 4,
    attack: 5,
    defense: 0,
    moveRange: 2,
    attackRange: 2,
    cost: 5,
    recruitCost: 100,
    color: 0xcc66cc,
    description: '高伤害魔法攻击'
  }
};

export const INITIAL_UNITS = {
  red: [
    { type: 'infantry', x: 0, y: 0 },
    { type: 'infantry', x: 1, y: 0 },
    { type: 'archer', x: 0, y: 1 },
    { type: 'scout', x: 1, y: 1 },
    { type: 'knight', x: 0, y: 9 },
    { type: 'mage', x: 1, y: 9 },
    { type: 'infantry', x: 0, y: 8 },
    { type: 'scout', x: 1, y: 8 }
  ],
  blue: [
    { type: 'infantry', x: 11, y: 0 },
    { type: 'infantry', x: 10, y: 0 },
    { type: 'archer', x: 11, y: 1 },
    { type: 'scout', x: 10, y: 1 },
    { type: 'knight', x: 11, y: 9 },
    { type: 'mage', x: 10, y: 9 },
    { type: 'infantry', x: 11, y: 8 },
    { type: 'scout', x: 10, y: 8 }
  ]
};
