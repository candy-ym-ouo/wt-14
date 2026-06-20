import { BOARD_CONFIG, TERRAIN_MAP } from '$lib/config/board.js';
import { COMBAT_FORMULA, GAME_RULES } from '$lib/config/gameRules.js';
import { getTerrainAt, getEffectiveMoveRange, getEffectiveAttack, getEffectiveDefense } from '$lib/stores/gameStore.js';

export function getValidMoveTiles(unit, units, movementLimit) {
  const maxRange = getEffectiveMoveRange(unit, movementLimit);
  const validTiles = [];
  const visited = new Set();
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  const occupiedPositions = new Set(
    units.filter(u => u.id !== unit.id).map(u => `${u.x},${u.y}`)
  );

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);

    if (current.cost > 0 && !occupiedPositions.has(key)) {
      validTiles.push({ x: current.x, y: current.y, cost: current.cost });
    }

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nkey = `${nx},${ny}`;
      
      if (visited.has(nkey)) continue;
      if (nx < 0 || nx >= BOARD_CONFIG.width || ny < 0 || ny >= BOARD_CONFIG.height) continue;
      
      const terrain = TERRAIN_MAP[ny][nx];
      const moveCost = BOARD_CONFIG.terrainMoveCost[terrain] || 999;
      
      if (moveCost >= 999) continue;
      
      const totalCost = current.cost + moveCost;
      if (totalCost <= maxRange) {
        queue.push({ x: nx, y: ny, cost: totalCost });
      }
    }
  }

  return validTiles;
}

export function getValidAttackTiles(unit, units) {
  const validTiles = [];
  const range = unit.attackRange;

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance === 0 || distance > range) continue;
      
      const nx = unit.x + dx;
      const ny = unit.y + dy;
      
      if (nx < 0 || nx >= BOARD_CONFIG.width || ny < 0 || ny >= BOARD_CONFIG.height) continue;
      
      const target = units.find(u => u.x === nx && u.y === ny && u.player !== unit.player);
      if (target) {
        validTiles.push({ x: nx, y: ny, targetId: target.id });
      }
    }
  }

  return validTiles;
}

export function calculateCombat(attacker, defender) {
  const terrain = getTerrainAt(defender.x, defender.y);
  const terrainDefense = BOARD_CONFIG.terrainDefense[terrain] || 0;
  
  const effectiveAttacker = {
    ...attacker,
    attack: getEffectiveAttack(attacker)
  };
  const effectiveDefender = {
    ...defender,
    defense: getEffectiveDefense(defender)
  };

  const hits = Math.random() < COMBAT_FORMULA.hitChance;
  let damage = 0;
  
  if (hits) {
    damage = COMBAT_FORMULA.baseDamage(effectiveAttacker, effectiveDefender, terrainDefense);
  }

  const result = {
    attackerDamage: 0,
    defenderDamage: damage,
    attackerHit: hits
  };

  if (GAME_RULES.counterAttackEnabled && damage < defender.hp) {
    const counterHits = Math.random() < COMBAT_FORMULA.hitChance * GAME_RULES.counterAttackDamageRatio;
    if (counterHits) {
      const attackerTerrain = getTerrainAt(attacker.x, attacker.y);
      const attackerTerrainDef = BOARD_CONFIG.terrainDefense[attackerTerrain] || 0;
      const counterDamage = Math.max(1, Math.floor(
        COMBAT_FORMULA.baseDamage(effectiveDefender, effectiveAttacker, attackerTerrainDef) * 
        GAME_RULES.counterAttackDamageRatio
      ));
      result.attackerDamage = counterDamage;
      result.defenderHit = true;
    }
  }

  return result;
}

export function checkWinConditions(units, turn, baseCaptureProgress) {
  const redUnits = units.filter(u => u.player === 'red');
  const blueUnits = units.filter(u => u.player === 'blue');

  if (redUnits.length === 0) return 'blue';
  if (blueUnits.length === 0) return 'red';

  if (baseCaptureProgress?.red?.base_blue >= 2) return 'red';
  if (baseCaptureProgress?.blue?.base_red >= 2) return 'blue';

  if (turn > GAME_RULES.maxTurns) {
    if (redUnits.length > blueUnits.length) return 'red';
    if (blueUnits.length > redUnits.length) return 'blue';
    return 'draw';
  }

  return null;
}

export function checkEliminationOnly(units) {
  const redUnits = units.filter(u => u.player === 'red');
  const blueUnits = units.filter(u => u.player === 'blue');
  if (redUnits.length === 0) return 'blue';
  if (blueUnits.length === 0) return 'red';
  return null;
}

export function updateBaseCaptureProgress(units, currentProgress) {
  const progress = JSON.parse(JSON.stringify(currentProgress));
  
  const redBases = [];
  const blueBases = [];
  
  for (let y = 0; y < TERRAIN_MAP.length; y++) {
    for (let x = 0; x < TERRAIN_MAP[y].length; x++) {
      if (TERRAIN_MAP[y][x] === 'base_red') redBases.push({ x, y });
      if (TERRAIN_MAP[y][x] === 'base_blue') blueBases.push({ x, y });
    }
  }

  let redOnBlueBase = 0;
  let blueOnRedBase = 0;

  units.forEach(u => {
    if (u.player === 'red') {
      blueBases.forEach(b => {
        if (u.x === b.x && u.y === b.y) redOnBlueBase++;
      });
    } else {
      redBases.forEach(b => {
        if (u.x === b.x && u.y === b.y) blueOnRedBase++;
      });
    }
  });

  if (redOnBlueBase > 0 && blueOnRedBase === 0) {
    progress.red.base_blue = (progress.red.base_blue || 0) + 1;
  } else {
    progress.red.base_blue = 0;
  }

  if (blueOnRedBase > 0 && redOnBlueBase === 0) {
    progress.blue.base_red = (progress.blue.base_red || 0) + 1;
  } else {
    progress.blue.base_red = 0;
  }

  return progress;
}
