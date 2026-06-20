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

export const STAT_POINTS_PER_LEVEL = 2;
export const PROMOTION_LEVEL = 5;

export const ALLOCATABLE_STATS = [
  { id: 'hp', name: '生命', icon: '❤️', baseGrowth: 1 },
  { id: 'attack', name: '攻击', icon: '⚔️', baseGrowth: 1 },
  { id: 'defense', name: '防御', icon: '🛡️', baseGrowth: 1 }
];

export const PROMOTION_TREE = {
  scout: [
    {
      id: 'ranger',
      name: '游侠',
      icon: '🏹',
      description: '远程侦察兼备，机动性强',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 2, defense: 1, moveRange: 1, attackRange: 1 },
      skill: '远程攻击'
    },
    {
      id: 'assassin',
      name: '刺客',
      icon: '🗡️',
      description: '高爆发近战，暴击率高',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 4, hp: -1, defense: -1 },
      skill: '暴击'
    }
  ],
  infantry: [
    {
      id: 'swordsman',
      name: '剑士',
      icon: '⚔️',
      description: '攻防均衡的精英战士',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 2, defense: 2, hp: 2 },
      skill: '坚守'
    },
    {
      id: 'berserker',
      name: '狂战士',
      icon: '💢',
      description: '高攻击高生命，防御较低',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 4, hp: 3, defense: -1 },
      skill: '狂暴'
    }
  ],
  archer: [
    {
      id: 'sniper',
      name: '狙击手',
      icon: '🎯',
      description: '超远射程，精准打击',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 3, attackRange: 2, defense: -1 },
      skill: '精准射击'
    },
    {
      id: 'ranger_archer',
      name: '游侠弓手',
      icon: '🏃',
      description: '机动性强的弓箭手',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 2, moveRange: 2, hp: 1 },
      skill: '移动射击'
    }
  ],
  knight: [
    {
      id: 'paladin',
      name: '圣骑士',
      icon: '✨',
      description: '神圣战士，治疗盟友',
      levelReq: PROMOTION_LEVEL,
      statChanges: { defense: 3, hp: 2, attack: 1 },
      skill: '治疗光环'
    },
    {
      id: 'black_knight',
      name: '黑骑士',
      icon: '🖤',
      description: '高攻击高防御的黑暗骑士',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 3, defense: 2, hp: 1 },
      skill: '吸血攻击'
    }
  ],
  mage: [
    {
      id: 'archmage',
      name: '大法师',
      icon: '🔮',
      description: '超高魔法伤害',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: 5, attackRange: 1, hp: -1 },
      skill: '范围魔法'
    },
    {
      id: 'healer',
      name: '治疗师',
      icon: '💚',
      description: '治疗和支援单位',
      levelReq: PROMOTION_LEVEL,
      statChanges: { attack: -1, hp: 2, defense: 2 },
      skill: '治愈术'
    }
  ]
};

export const PROMOTION_UNIT_TYPES = {};
Object.entries(PROMOTION_TREE).forEach(([baseType, promotions]) => {
  promotions.forEach(promo => {
    PROMOTION_UNIT_TYPES[promo.id] = {
      ...UNIT_TYPES[baseType],
      id: promo.id,
      name: promo.name,
      icon: promo.icon,
      promoted: true,
      baseType,
      promotion: promo
    };
  });
});

export function getPromotionOptions(unitType, level) {
  const promotions = PROMOTION_TREE[unitType];
  if (!promotions) return [];
  return promotions.filter(p => level >= p.levelReq);
}

export function canPromote(unit) {
  if (unit.promoted) return false;
  const options = getPromotionOptions(unit.type, unit.level);
  return options.length > 0;
}

export function applyPromotion(unit, promotionId) {
  const promotions = PROMOTION_TREE[unit.type];
  const promo = promotions?.find(p => p.id === promotionId);
  if (!promo) return unit;

  const changes = promo.statChanges;
  return {
    ...unit,
    type: promotionId,
    promoted: true,
    baseType: unit.type,
    maxHp: Math.max(1, unit.maxHp + (changes.hp || 0)),
    hp: Math.max(1, unit.hp + (changes.hp || 0)),
    attack: Math.max(0, unit.attack + (changes.attack || 0)),
    defense: Math.max(0, unit.defense + (changes.defense || 0)),
    moveRange: Math.max(1, unit.moveRange + (changes.moveRange || 0)),
    attackRange: Math.max(1, unit.attackRange + (changes.attackRange || 0)),
    skill: promo.skill
  };
}

export function getAllocatedStats(unit) {
  return unit.allocatedStats || { hp: 0, attack: 0, defense: 0 };
}

export function getAvailableStatPoints(unit) {
  if (unit.statPoints !== undefined) return unit.statPoints;
  return 0;
}

export function allocateStatPoint(unit, statId) {
  const available = getAvailableStatPoints(unit);
  if (available <= 0) return unit;

  const allocated = { ...getAllocatedStats(unit) };
  allocated[statId] = (allocated[statId] || 0) + 1;

  let newUnit = {
    ...unit,
    statPoints: available - 1,
    allocatedStats: allocated
  };

  if (statId === 'hp') {
    newUnit.maxHp = unit.maxHp + 1;
    newUnit.hp = unit.hp + 1;
  } else if (statId === 'attack') {
    newUnit.attack = unit.attack + 1;
  } else if (statId === 'defense') {
    newUnit.defense = unit.defense + 1;
  }

  return newUnit;
}

export function calculateStatGrowthWithAllocation(unitType, level, allocatedStats = {}) {
  const baseStats = calculateStatGrowth(unitType, level);
  if (!baseStats) return null;

  return {
    ...baseStats,
    hp: baseStats.hp + (allocatedStats.hp || 0),
    attack: baseStats.attack + (allocatedStats.attack || 0),
    defense: baseStats.defense + (allocatedStats.defense || 0)
  };
}

export function previewGrowth(unit, targetLevel) {
  const currentLevel = unit.level;
  const levelsToGain = Math.max(0, targetLevel - currentLevel);
  const baseType = unit.baseType || unit.type;
  const growth = GROWTH_TABLE[baseType];
  if (!growth) return null;

  const currentAllocated = getAllocatedStats(unit);
  const futureAllocated = {
    hp: currentAllocated.hp + levelsToGain * STAT_POINTS_PER_LEVEL,
    attack: currentAllocated.attack,
    defense: currentAllocated.defense
  };

  const currentStats = calculateStatGrowthWithAllocation(unit.type, currentLevel, currentAllocated);
  const futureStats = calculateStatGrowthWithAllocation(unit.type, targetLevel, futureAllocated);

  return {
    currentLevel,
    targetLevel,
    levelsToGain,
    statPointsToGain: levelsToGain * STAT_POINTS_PER_LEVEL,
    currentStats,
    futureStats,
    growth: {
      hp: futureStats.hp - currentStats.hp,
      attack: futureStats.attack - currentStats.attack,
      defense: futureStats.defense - currentStats.defense,
      moveRange: futureStats.moveRange - currentStats.moveRange,
      attackRange: futureStats.attackRange - currentStats.attackRange
    },
    canPromoteAtTarget: targetLevel >= PROMOTION_LEVEL && !unit.promoted && PROMOTION_TREE[baseType]
  };
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

  const baseType = unit.baseType || unit.type;
  const newStats = calculateStatGrowth(baseType, level);
  const allocatedStats = unit.allocatedStats || { hp: 0, attack: 0, defense: 0 };
  const currentStatPoints = unit.statPoints || 0;
  const newStatPoints = currentStatPoints + levelsGained * STAT_POINTS_PER_LEVEL;

  const finalHp = newStats.hp + allocatedStats.hp;
  const finalAttack = newStats.attack + allocatedStats.attack;
  const finalDefense = newStats.defense + allocatedStats.defense;

  const hpIncrease = finalHp - (unit.maxHp || newStats.hp);

  return {
    ...unit,
    level,
    exp: currentExp,
    statPoints: newStatPoints,
    allocatedStats,
    maxHp: finalHp,
    hp: Math.min(unit.hp + Math.max(0, hpIncrease), finalHp),
    attack: finalAttack,
    defense: finalDefense,
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
