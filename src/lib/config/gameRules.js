export const GAME_RULES = {
  players: ['red', 'blue'],
  startingPlayer: 'red',
  actionsPerTurn: 3,
  maxTurns: 50,
  counterAttackEnabled: true,
  counterAttackDamageRatio: 0.5
};

export const RECRUIT_RULES = {
  shopSize: 5,
  refreshCost: 20,
  maxRosterSize: 20,
  rarityCostMultiplier: {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.8,
    epic: 2.5,
    legendary: 4.0
  }
};

export const CLASS_SYNERGY = {
  scout_2: {
    name: '侦察小队',
    classes: { scout: 2 },
    effect: { moveRange: 1 },
    description: '2个侦察兵：全队移动+1'
  },
  infantry_3: {
    name: '步兵阵线',
    classes: { infantry: 3 },
    effect: { defense: 1 },
    description: '3个步兵：全队防御+1'
  },
  archer_2: {
    name: '箭雨齐射',
    classes: { archer: 2 },
    effect: { attack: 1 },
    description: '2个弓箭手：全队攻击+1'
  },
  knight_2: {
    name: '重盾护卫',
    classes: { knight: 2 },
    effect: { defense: 2, maxHp: 2 },
    description: '2个骑士：全队防御+2，生命+2'
  },
  mage_2: {
    name: '奥术共鸣',
    classes: { mage: 2 },
    effect: { attack: 2 },
    description: '2个法师：全队攻击+2'
  },
  balanced_4: {
    name: '均衡搭配',
    uniqueClasses: 4,
    effect: { attack: 1, defense: 1 },
    description: '4种不同职业：全队攻击+1，防御+1'
  },
  diverse_5: {
    name: '全能军团',
    uniqueClasses: 5,
    effect: { attack: 2, defense: 1, maxHp: 3 },
    description: '5种不同职业：全队攻击+2，防御+1，生命+3'
  }
};

export const WIN_CONDITIONS = {
  eliminate_all: {
    id: 'eliminate_all',
    name: '全歼敌军',
    description: '消灭所有敌方单位即获胜',
    enabled: true
  },
  capture_base: {
    id: 'capture_base',
    name: '占领基地',
    description: '占领敌方两个基地即获胜',
    captureTurnsRequired: 2,
    enabled: true
  },
  turn_limit: {
    id: 'turn_limit',
    name: '回合耗尽',
    description: '回合结束时单位数最多者获胜',
    enabled: true
  }
};

export const COMBAT_FORMULA = {
  baseDamage: (attacker, defender, terrainDefense) => {
    const rawDamage = attacker.attack - defender.defense - terrainDefense;
    return Math.max(1, rawDamage);
  },
  hitChance: 0.9
};
