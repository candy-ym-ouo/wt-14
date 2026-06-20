import {
  RUINS_CONFIG,
  RUINS_TERRAIN,
  RUINS_EVENT_TYPES,
  RUINS_TREASURES,
  RUINS_ENEMY_TEMPLATES,
  RUINS_DIFFICULTY,
  RUINS_MAP_TEMPLATES,
  getWeightedRandom
} from '$lib/config/ruins.js';
import { UNIT_TYPES } from '$lib/config/units.js';
import { BOARD_CONFIG } from '$lib/config/board.js';

export function generateRuinsMap(floor = 1) {
  const width = RUINS_CONFIG.width;
  const height = RUINS_CONFIG.height;
  const template = getWeightedRandom(RUINS_MAP_TEMPLATES);
  const terrainMap = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push('ruin_floor');
    }
    terrainMap.push(row);
  }

  const wallCount = Math.floor(width * height * 0.15);
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (Math.random() < 0.7) {
      terrainMap[y][x] = 'ruin_wall';
    } else {
      terrainMap[y][x] = 'ruin_pillar';
    }
  }

  const waterCount = Math.floor(width * height * 0.05);
  for (let i = 0; i < waterCount; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (terrainMap[y][x] === 'ruin_floor') {
      terrainMap[y][x] = 'water';
    }
  }

  const entranceX = Math.floor(Math.random() * 2);
  const entranceY = Math.floor(Math.random() * height);
  terrainMap[entranceY][entranceX] = 'entrance';

  const exitX = width - 1 - Math.floor(Math.random() * 2);
  const exitY = Math.floor(Math.random() * height);
  terrainMap[exitY][exitX] = 'exit';

  const specialTiles = [];

  const treasureCount = 2 + Math.floor(Math.random() * 2) + (RUINS_DIFFICULTY[floor]?.treasureBonus || 0);
  for (let i = 0; i < treasureCount; i++) {
    const pos = findEmptyTile(terrainMap, width, height);
    if (pos) {
      terrainMap[pos.y][pos.x] = 'treasure';
      specialTiles.push({ ...pos, type: 'treasure', collected: false });
    }
  }

  const trapCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < trapCount; i++) {
    const pos = findEmptyTile(terrainMap, width, height);
    if (pos) {
      terrainMap[pos.y][pos.x] = 'trap';
      specialTiles.push({ ...pos, type: 'trap', triggered: false });
    }
  }

  const eventCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < eventCount; i++) {
    const pos = findEmptyTile(terrainMap, width, height);
    if (pos) {
      terrainMap[pos.y][pos.x] = 'event';
      const eventType = getWeightedRandom(RUINS_EVENT_TYPES);
      specialTiles.push({ ...pos, type: 'event', eventType: eventType.id, triggered: false });
    }
  }

  return {
    templateId: template.id,
    templateName: template.name,
    terrainMap,
    specialTiles,
    entrance: { x: entranceX, y: entranceY },
    exit: { x: exitX, y: exitY },
    floor
  };
}

function findEmptyTile(terrainMap, width, height) {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (terrainMap[y][x] === 'ruin_floor') {
      return { x, y };
    }
  }
  return null;
}

export function generateRuinsEnemies(floor = 1) {
  const difficulty = RUINS_DIFFICULTY[floor] || RUINS_DIFFICULTY[1];
  const enemies = [];
  const availableTypes = RUINS_ENEMY_TEMPLATES.filter(t => t.count > 0);
  
  let count = difficulty.enemyCount;
  while (count > 0 && availableTypes.length > 0) {
    const template = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const level = 1 + difficulty.enemyLevelBonus + Math.floor(Math.random() * 2);
    
    const baseType = UNIT_TYPES[template.type];
    if (baseType) {
      enemies.push({
        type: template.type,
        level,
        maxHp: baseType.hp + (level - 1),
        hp: baseType.hp + (level - 1),
        attack: baseType.attack + Math.floor((level - 1) * 0.5),
        defense: baseType.defense + Math.floor((level - 1) * 0.3),
        moveRange: baseType.moveRange,
        attackRange: baseType.attackRange,
        rarity: 'common'
      });
      count--;
    }
  }
  
  return enemies;
}

export function placeEnemyUnits(enemies, terrainMap) {
  const width = terrainMap[0].length;
  const height = terrainMap.length;
  const placedEnemies = [];
  const usedPositions = new Set();

  enemies.forEach((enemy, index) => {
    let attempts = 0;
    while (attempts < 50) {
      const x = width - 2 - Math.floor(Math.random() * Math.floor(width / 2));
      const y = Math.floor(Math.random() * height);
      const key = `${x},${y}`;
      
      if (terrainMap[y][x] === 'ruin_floor' && !usedPositions.has(key)) {
        usedPositions.add(key);
        placedEnemies.push({
          ...enemy,
          id: `ruin_enemy_${index}`,
          player: 'blue',
          x,
          y,
          hasMoved: false,
          hasAttacked: false,
          tempBuffs: { attack: 0, defense: 0, moveRange: 0 }
        });
        break;
      }
      attempts++;
    }
  });

  return placedEnemies;
}

export function placePlayerUnits(units, terrainMap) {
  const width = terrainMap[0].length;
  const height = terrainMap.length;
  const placedUnits = [];
  const usedPositions = new Set();

  units.forEach((unit, index) => {
    let attempts = 0;
    while (attempts < 50) {
      const x = 1 + Math.floor(Math.random() * Math.floor(width / 4));
      const y = Math.floor(Math.random() * height);
      const key = `${x},${y}`;
      
      if (terrainMap[y][x] === 'ruin_floor' && !usedPositions.has(key)) {
        usedPositions.add(key);
        placedUnits.push({
          ...unit,
          id: `ruin_player_${index}`,
          poolUid: unit.uid || unit.poolUid,
          player: 'red',
          x,
          y,
          hasMoved: false,
          hasAttacked: false,
          tempBuffs: { attack: 0, defense: 0, moveRange: 0 }
        });
        break;
      }
      attempts++;
    }
  });

  return placedUnits;
}

export function handleTileEffect(tileType, unit, gameState, tileData = null) {
  const result = {
    success: true,
    messages: [],
    stateChanges: {},
    showEvent: false,
    eventData: null
  };

  switch (tileType) {
    case 'trap':
      if (tileData && !tileData.triggered) {
        const damage = 1 + Math.floor(Math.random() * 2);
        result.messages.push(`${unit.name || '单位'} 触发了陷阱，受到 ${damage} 点伤害！`);
        result.stateChanges.trapTriggered = true;
        result.stateChanges.damage = { targetId: unit.id, amount: damage };
      }
      break;

    case 'treasure':
      if (tileData && !tileData.collected) {
        const treasure = getWeightedRandom(RUINS_TREASURES);
        result.messages.push(`发现了 ${treasure.icon} ${treasure.name}！`);
        result.stateChanges.treasureCollected = true;
        result.stateChanges.treasure = treasure;
      }
      break;

    case 'event':
      if (tileData && !tileData.triggered) {
        const eventType = RUINS_EVENT_TYPES.find(e => e.id === tileData.eventType);
        if (eventType) {
          result.showEvent = true;
          result.eventData = eventType;
          result.stateChanges.eventTriggered = true;
        }
      }
      break;

    case 'exit':
      result.messages.push('到达撤离点！可以选择撤离或继续探索。');
      result.stateChanges.atExit = true;
      break;
  }

  return result;
}

export function applyTreasureEffect(treasure, units, currentGold) {
  const result = {
    units: JSON.parse(JSON.stringify(units)),
    gold: currentGold,
    message: ''
  };

  const effect = treasure.effect;
  const redUnits = result.units.filter(u => u.player === 'red');

  const getRandomUnit = () => redUnits[Math.floor(Math.random() * redUnits.length)];

  switch (effect.type) {
    case 'buff_attack':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.attack += effect.value;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，攻击 +${effect.value}`;
        }
      }
      break;

    case 'buff_defense':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.defense += effect.value;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，防御 +${effect.value}`;
        }
      }
      break;

    case 'buff_maxHp':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.maxHp += effect.value;
          unit.hp += effect.value;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，生命上限 +${effect.value}`;
        }
      }
      break;

    case 'buff_moveRange':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.moveRange += effect.value;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，移动力 +${effect.value}`;
        }
      }
      break;

    case 'buff_attack_defense':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.attack += effect.attack;
          unit.defense += effect.defense;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，攻击 +${effect.attack}，防御 +${effect.defense}`;
        }
      }
      break;

    case 'buff_all_maxHp':
      redUnits.forEach(target => {
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.maxHp += effect.value;
          unit.hp += effect.value;
        }
      });
      result.message = `所有单位获得 ${treasure.name}，生命上限 +${effect.value}`;
      break;

    case 'buff_all_attack':
      redUnits.forEach(target => {
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.attack += effect.value;
        }
      });
      result.message = `所有单位获得 ${treasure.name}，攻击 +${effect.value}`;
      break;

    case 'permanent_buff_attack_defense':
      if (effect.target === 'random' && redUnits.length > 0) {
        const target = getRandomUnit();
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.attack += effect.attack;
          unit.defense += effect.defense;
          result.message = `${unit.name || '单位'} 获得 ${treasure.name}，永久攻击 +${effect.attack}，防御 +${effect.defense}`;
        }
      }
      break;

    case 'gain_gold':
      result.gold += effect.value;
      result.message = `获得 ${effect.value} 金币！`;
      break;
  }

  return result;
}

export function applyEventChoice(event, choice, units, currentGold) {
  const result = {
    units: JSON.parse(JSON.stringify(units)),
    gold: currentGold,
    message: '',
    success: true
  };

  if (choice.cost) {
    if (choice.cost.gold && currentGold < choice.cost.gold) {
      result.success = false;
      result.message = '金币不足！';
      return result;
    }
    if (choice.cost.hp) {
      const redUnits = result.units.filter(u => u.player === 'red');
      if (redUnits.length > 0) {
        const target = redUnits[Math.floor(Math.random() * redUnits.length)];
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.maxHp -= choice.cost.hp;
          unit.hp = Math.min(unit.hp, unit.maxHp);
        }
      }
    }
  }

  if (choice.cost?.gold) {
    result.gold -= choice.cost.gold;
  }

  if (choice.effect) {
    const effectResult = applyEffect(choice.effect, result.units, result.gold);
    result.units = effectResult.units;
    result.gold = effectResult.gold;
    result.message = effectResult.message;
  }

  return result;
}

function applyEffect(effect, units, gold) {
  const result = {
    units: JSON.parse(JSON.stringify(units)),
    gold,
    message: ''
  };

  const redUnits = result.units.filter(u => u.player === 'red');

  switch (effect.type) {
    case 'heal_all':
      redUnits.forEach(target => {
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.hp = Math.min(unit.maxHp, unit.hp + effect.value);
        }
      });
      result.message = `所有单位恢复 ${effect.value} 生命`;
      break;

    case 'heal_random':
      if (redUnits.length > 0) {
        const target = redUnits[Math.floor(Math.random() * redUnits.length)];
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.hp = Math.min(unit.maxHp, unit.hp + effect.value);
          result.message = `${unit.name || '单位'} 恢复 ${effect.value} 生命`;
        }
      }
      break;

    case 'buff_all_attack':
      redUnits.forEach(target => {
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.attack += effect.value;
        }
      });
      result.message = `所有单位攻击 +${effect.value}`;
      break;

    case 'gain_gold':
      result.gold += effect.value;
      result.message = `获得 ${effect.value} 金币`;
      break;

    case 'damage_random':
      if (redUnits.length > 0) {
        const target = redUnits[Math.floor(Math.random() * redUnits.length)];
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.hp = Math.max(1, unit.hp - effect.value);
          result.message = `${unit.name || '单位'} 受到 ${effect.value} 点伤害`;
        }
      }
      break;

    case 'permanent_buff_random_defense':
      if (redUnits.length > 0) {
        const target = redUnits[Math.floor(Math.random() * redUnits.length)];
        const unit = result.units.find(u => u.id === target.id);
        if (unit) {
          unit.defense += effect.value;
          result.message = `${unit.name || '单位'} 防御永久 +${effect.value}`;
        }
      }
      break;

    case 'random_blessing_or_curse':
      if (Math.random() < 0.5) {
        redUnits.forEach(target => {
          const unit = result.units.find(u => u.id === target.id);
          if (unit) {
            unit.attack += 1;
          }
        });
        result.message = '获得祝福！所有单位攻击 +1';
      } else {
        if (redUnits.length > 0) {
          const target = redUnits[Math.floor(Math.random() * redUnits.length)];
          const unit = result.units.find(u => u.id === target.id);
          if (unit) {
            unit.hp = Math.max(1, unit.hp - 2);
            result.message = '受到诅咒！随机单位受到 2 点伤害';
          }
        }
      }
      break;

    case 'dodge_trap':
      if (Math.random() < 0.5) {
        result.message = '成功躲避陷阱！';
        if (effect.success?.type === 'nothing') {
        }
      } else {
        if (effect.failure?.type === 'damage_random' && redUnits.length > 0) {
          const target = redUnits[Math.floor(Math.random() * redUnits.length)];
          const unit = result.units.find(u => u.id === target.id);
          if (unit) {
            unit.hp = Math.max(1, unit.hp - effect.failure.value);
            result.message = `躲避失败！${unit.name || '单位'} 受到 ${effect.failure.value} 点伤害`;
          }
        }
      }
      break;

    case 'random_treasure':
      if (Math.random() < 0.5) {
        const treasure = getWeightedRandom(RUINS_TREASURES);
        const treasureResult = applyTreasureEffect(treasure, result.units, result.gold);
        result.units = treasureResult.units;
        result.gold = treasureResult.gold;
        result.message = treasureResult.message;
      } else {
        result.message = '没有发现宝物';
      }
      break;
  }

  return result;
}

export function calculateRuinsSettlement(ruinsState, units, battleStats, turns = 0) {
  const redUnits = units.filter(u => u.player === 'red');
  const survivingUnits = redUnits.length;
  const totalUnits = ruinsState.initialPlayerCount || redUnits.length;
  
  const floorBonus = ruinsState.currentFloor * 20;
  const survivalBonus = Math.floor((survivingUnits / Math.max(1, totalUnits)) * 100);
  const killBonus = (battleStats?.killedEnemies?.length || 0) * 15;
  const treasureBonus = (ruinsState.treasuresCollected?.length || 0) * 30;

  const totalGold = floorBonus + survivalBonus + killBonus + treasureBonus + (ruinsState.currentGold || 0);
  const totalExp = floorBonus + killBonus + treasureBonus;

  return {
    floorsCleared: ruinsState.currentFloor,
    survivedUnits: survivingUnits,
    totalUnits,
    killedEnemies: battleStats?.killedEnemies?.length || 0,
    treasuresCollected: ruinsState.treasuresCollected?.length || 0,
    turns,
    gold: {
      floor: floorBonus,
      survival: survivalBonus,
      kills: killBonus,
      treasures: treasureBonus,
      carried: ruinsState.currentGold || 0,
      total: totalGold
    },
    exp: totalExp,
    success: ruinsState.evacuated || (ruinsState.currentFloor >= RUINS_CONFIG.maxFloors),
    units: redUnits
  };
}

export function getRuinsTerrainColor(terrainId) {
  const terrain = RUINS_TERRAIN[terrainId];
  if (terrain) return terrain.color;
  return BOARD_CONFIG.terrainColors[terrainId] || 0x6b5344;
}

export function getRuinsMoveCost(terrainId) {
  const terrain = RUINS_TERRAIN[terrainId];
  if (terrain) return terrain.moveCost;
  return BOARD_CONFIG.terrainMoveCost[terrainId] || 1;
}

export function getRuinsTerrainDefense(terrainId) {
  const terrain = RUINS_TERRAIN[terrainId];
  if (terrain) return terrain.defense;
  return BOARD_CONFIG.terrainDefense[terrainId] || 0;
}
