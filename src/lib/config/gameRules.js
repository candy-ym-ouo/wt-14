export const GAME_RULES = {
  players: ['red', 'blue'],
  startingPlayer: 'red',
  actionsPerTurn: 3,
  maxTurns: 50,
  counterAttackEnabled: true,
  counterAttackDamageRatio: 0.5
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
