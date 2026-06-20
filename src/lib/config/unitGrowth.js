import { UNIT_TYPES } from './units.js';

export const MAX_LEVEL = 10;

export const EXP_PER_LEVEL = [
  0,
  100,
  250,
  450,
  700,
  1000,
  1400,
  1900,
  2500,
  3200,
  4000
];

export function getExpRequired(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return EXP_PER_LEVEL[level];
}

export function getExpToNextLevel(currentLevel, currentExp) {
  if (currentLevel >= MAX_LEVEL) return 0;
  const required = EXP_PER_LEVEL[currentLevel];
  return Math.max(0, required - currentExp);
}

export const GROWTH_TABLE = {
  scout: {
    hp: 0.4,
    attack: 0.3,
    defense: 0.1,
    moveRange: 0.0,
    attackRange: 0.0
  },
  infantry: {
    hp: 0.6,
    attack: 0.4,
    defense: 0.2,
    moveRange: 0.0,
    attackRange: 0.0
  },
  archer: {
    hp: 0.3,
    attack: 0.5,
    defense: 0.1,
    moveRange: 0.0,
    attackRange: 0.1
  },
  knight: {
    hp: 0.8,
    attack: 0.5,
    defense: 0.4,
    moveRange: 0.1,
    attackRange: 0.0
  },
  mage: {
    hp: 0.3,
    attack: 0.6,
    defense: 0.1,
    moveRange: 0.0,
    attackRange: 0.1
  }
};

export function calculateStatGrowth(unitType, level) {
  const base = UNIT_TYPES[unitType];
  const growth = GROWTH_TABLE[unitType];
  if (!base || !growth) return null;

  const levelBonus = level - 1;
  if (levelBonus <= 0) {
    return {
      hp: base.hp,
      attack: base.attack,
      defense: base.defense,
      moveRange: base.moveRange,
      attackRange: base.attackRange
    };
  }

  return {
    hp: base.hp + Math.floor(levelBonus * growth.hp),
    attack: base.attack + Math.floor(levelBonus * growth.attack),
    defense: base.defense + Math.floor(levelBonus * growth.defense),
    moveRange: base.moveRange + Math.floor(levelBonus * growth.moveRange),
    attackRange: base.attackRange + Math.floor(levelBonus * growth.attackRange)
  };
}

export const EXP_REWARD = {
  kill: {
    scout: 15,
    infantry: 25,
    archer: 30,
    knight: 50,
    mage: 45
  },
  damage: 2,
  survive: 5,
  win: 50,
  objective: 100
};

export function calculateKillExp(unitType) {
  return EXP_REWARD.kill[unitType] || 20;
}

export function calculateSurviveExp(unit) {
  const hpPercent = unit.hp / unit.maxHp;
  return Math.floor(EXP_REWARD.survive * hpPercent);
}

export function calculateBattleRewards(aliveUnits, killedEnemies, damageDealt, objectivesCompleted, won) {
  const rewards = {};

  aliveUnits.forEach(unit => {
    if (unit.player !== 'red') return;
    if (!rewards[unit.id]) {
      rewards[unit.id] = { exp: 0, kills: 0, damage: 0 };
    }
    rewards[unit.id].exp += calculateSurviveExp(unit);
  });

  killedEnemies.forEach(enemy => {
    const killerId = enemy.killedBy;
    if (killerId && rewards[killerId]) {
      rewards[killerId].exp += calculateKillExp(enemy.type);
      rewards[killerId].kills += 1;
    }
  });

  damageDealt.forEach(dmg => {
    if (rewards[dmg.unitId]) {
      rewards[dmg.unitId].exp += dmg.amount * EXP_REWARD.damage;
      rewards[dmg.unitId].damage += dmg.amount;
    }
  });

  if (won) {
    Object.keys(rewards).forEach(id => {
      rewards[id].exp += EXP_REWARD.win;
    });
  }

  objectivesCompleted.forEach(() => {
    Object.keys(rewards).forEach(id => {
      rewards[id].exp += EXP_REWARD.objective;
    });
  });

  return rewards;
}

export function applyExp(unit, expGained) {
  let currentExp = unit.exp + expGained;
  let level = unit.level;
  let leveledUp = false;
  let levelsGained = 0;

  while (level < MAX_LEVEL && currentExp >= EXP_PER_LEVEL[level]) {
    currentExp -= EXP_PER_LEVEL[level];
    level += 1;
    leveledUp = true;
    levelsGained += 1;
  }

  const newStats = calculateStatGrowth(unit.type, level);

  return {
    ...unit,
    level,
    exp: currentExp,
    maxHp: newStats.hp,
    hp: Math.min(unit.hp + (newStats.hp - (unit.maxHp || newStats.hp)), newStats.hp),
    attack: newStats.attack,
    defense: newStats.defense,
    moveRange: newStats.moveRange,
    attackRange: newStats.attackRange,
    leveledUp,
    levelsGained
  };
}

export const UNIT_RARITY = {
  common: { name: '普通', color: '#aaaaaa', bonus: 1.0 },
  uncommon: { name: '优秀', color: '#55cc55', bonus: 1.1 },
  rare: { name: '稀有', color: '#5588ff', bonus: 1.2 },
  epic: { name: '史诗', color: '#cc55cc', bonus: 1.35 },
  legendary: { name: '传说', color: '#ffcc00', bonus: 1.5 }
};

export function applyRarityBonus(unit, rarity) {
  const bonus = UNIT_RARITY[rarity]?.bonus || 1.0;
  return {
    ...unit,
    rarity,
    maxHp: Math.floor(unit.maxHp * bonus),
    hp: Math.floor(unit.hp * bonus),
    attack: Math.floor(unit.attack * bonus),
    defense: Math.floor(unit.defense * bonus)
  };
}

export function generateRarity() {
  const roll = Math.random();
  if (roll < 0.01) return 'legendary';
  if (roll < 0.05) return 'epic';
  if (roll < 0.15) return 'rare';
  if (roll < 0.40) return 'uncommon';
  return 'common';
}
