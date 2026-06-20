<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import * as PIXI from 'pixi.js';
  import { BOARD_CONFIG } from '$lib/config/board.js';
  import { UNIT_TYPES } from '$lib/config/units.js';
  import { RUINS_TERRAIN } from '$lib/config/ruins.js';
  import { 
    gameStore, 
    getEffectiveAttack, 
    getEffectiveDefense,
    getEffectiveMoveRange
  } from '$lib/stores/gameStore.js';
  import { 
    getValidMoveTiles, 
    getValidAttackTiles, 
    calculateCombat, 
    checkEliminationOnly
  } from '$lib/utils/gameLogic.js';
  import {
    getRuinsTerrainColor,
    getRuinsMoveCost,
    getRuinsTerrainDefense
  } from '$lib/utils/ruinsLogic.js';
  
  export let onCombatLog;
  export let onBattleEnd;
  export let onTileEffect;

  let container;
  let app;
  let boardLayer;
  let unitsLayer;
  let highlightLayer;
  let uiLayer;
  let tileSprites = [];
  let unitSprites = {};
  let highlightSprites = [];
  let hoveredTile = null;

  function getCurrentTerrainMap() {
    const game = get(gameStore);
    if (game.mode === 'ruins' && game.ruins) {
      return game.ruins.ruinsMap.terrainMap;
    }
    return null;
  }

  function getTerrainAt(x, y) {
    const terrainMap = getCurrentTerrainMap();
    if (terrainMap && terrainMap[y]) {
      return terrainMap[y][x];
    }
    return null;
  }

  function createTileSprite(x, y, terrain) {
    const size = BOARD_CONFIG.tileSize;
    const graphics = new PIXI.Graphics();
    const color = getRuinsTerrainColor(terrain);
    
    graphics.beginFill(color);
    graphics.lineStyle(1, BOARD_CONFIG.gridColor, 1);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    graphics.x = x * size;
    graphics.y = y * size;
    graphics.interactive = true;
    graphics.buttonMode = true;
    
    const terrainData = RUINS_TERRAIN[terrain];
    if (terrainData?.icon) {
      const text = new PIXI.Text(terrainData.icon, {
        fontSize: 24,
        fill: 0xffffff,
        align: 'center'
      });
      text.anchor.set(0.5);
      text.x = size / 2;
      text.y = size / 2;
      graphics.addChild(text);
    }

    graphics.on('pointerover', () => {
      hoveredTile = { x, y, terrain };
      showHoverHighlight(x, y);
    });

    graphics.on('pointerout', () => {
      hoveredTile = null;
      hideHoverHighlight();
    });

    graphics.on('pointerdown', () => {
      handleTileClick(x, y);
    });

    return graphics;
  }

  function createUnitSprite(unit) {
    const size = BOARD_CONFIG.tileSize;
    const unitType = UNIT_TYPES[unit.type];
    const graphics = new PIXI.Graphics();
    
    const color = unit.player === 'red' ? 0xe74c3c : 0x3498db;
    const borderColor = unit.hasMoved && unit.hasAttacked ? 0x666666 : 0xffffff;
    
    graphics.beginFill(color);
    graphics.lineStyle(2, borderColor, 1);
    graphics.drawRoundedRect(4, 4, size - 8, size - 8, 4);
    graphics.endFill();
    
    const icon = new PIXI.Text(unitType?.icon || '?', {
      fontSize: 20,
      fill: 0xffffff,
      align: 'center'
    });
    icon.anchor.set(0.5);
    icon.x = size / 2;
    icon.y = size / 2 - 8;
    graphics.addChild(icon);
    
    const hpBar = new PIXI.Graphics();
    const hpPercent = unit.hp / Math.max(1, unit.maxHp);
    hpBar.beginFill(0x333333);
    hpBar.drawRect(6, size - 12, size - 12, 6);
    hpBar.endFill();
    hpBar.beginFill(hpPercent > 0.5 ? 0x2ecc71 : hpPercent > 0.25 ? 0xf1c40f : 0xe74c3c);
    hpBar.drawRect(6, size - 12, (size - 12) * hpPercent, 6);
    hpBar.endFill();
    graphics.addChild(hpBar);
    
    const levelText = new PIXI.Text(`Lv${unit.level || 1}`, {
      fontSize: 10,
      fill: 0xffd700,
      align: 'center'
    });
    levelText.anchor.set(0.5);
    levelText.x = size / 2;
    levelText.y = size - 2;
    graphics.addChild(levelText);
    
    graphics.x = unit.x * size;
    graphics.y = unit.y * size;
    graphics.interactive = true;
    graphics.buttonMode = true;
    
    graphics.on('pointerover', () => {
      showUnitInfo(unit);
    });
    
    graphics.on('pointerout', () => {
      hideUnitInfo();
    });
    
    graphics.on('pointerdown', () => {
      handleUnitClick(unit);
    });
    
    return graphics;
  }

  function showUnitInfo(unit) {
    // Can be expanded to show tooltip
  }

  function hideUnitInfo() {
    // Hide tooltip
  }

  function showHoverHighlight(x, y) {
    const size = BOARD_CONFIG.tileSize;
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff, 0.2);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    graphics.x = x * size;
    graphics.y = y * size;
    highlightLayer.addChild(graphics);
    highlightSprites.push(graphics);
  }

  function hideHoverHighlight() {
    highlightSprites.forEach(s => s.destroy());
    highlightSprites = [];
  }

  function showValidMoves(tiles) {
    clearHighlights();
    const size = BOARD_CONFIG.tileSize;
    tiles.forEach(tile => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x2ecc71, 0.4);
      graphics.drawRect(0, 0, size, size);
      graphics.endFill();
      graphics.x = tile.x * size;
      graphics.y = tile.y * size;
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.on('pointerdown', () => handleMoveClick(tile));
      highlightLayer.addChild(graphics);
      highlightSprites.push(graphics);
    });
  }

  function showValidAttacks(tiles) {
    const size = BOARD_CONFIG.tileSize;
    tiles.forEach(tile => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xe74c3c, 0.4);
      graphics.drawRect(0, 0, size, size);
      graphics.endFill();
      graphics.x = tile.x * size;
      graphics.y = tile.y * size;
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.on('pointerdown', () => handleAttackClick(tile));
      highlightLayer.addChild(graphics);
      highlightSprites.push(graphics);
    });
  }

  function clearHighlights() {
    highlightSprites.forEach(s => s.destroy());
    highlightSprites = [];
  }

  function handleTileClick(x, y) {
    const game = get(gameStore);
    if (game.gameOver) return;
    
    const terrain = getTerrainAt(x, y);
    onCombatLog?.(`点击 (${x}, ${y}) - ${RUINS_TERRAIN[terrain]?.name || terrain}`);
  }

  function handleUnitClick(unit) {
    const game = get(gameStore);
    if (game.gameOver) return;
    
    if (unit.player !== game.currentPlayer) {
      const selectedUnit = get(gameStore).selectedUnitId;
      if (selectedUnit) {
        const attackTiles = getValidAttackTiles(
          game.units.find(u => u.id === selectedUnit),
          game.units
        );
        const targetTile = attackTiles.find(t => t.x === unit.x && t.y === unit.y);
        if (targetTile) {
          handleAttackClick(targetTile);
        }
      }
      return;
    }
    
    gameStore.selectUnit(unit.id);
    
    const validMoves = getValidMoveTiles(unit, game.units, game.movementLimit);
    const validAttacks = getValidAttackTiles(unit, game.units);
    
    gameStore.setValidMoves(validMoves);
    gameStore.setValidAttacks(validAttacks);
    
    showValidMoves(validMoves);
    showValidAttacks(validAttacks);
    
    onCombatLog?.(`选中 ${UNIT_TYPES[unit.type]?.name || unit.type}`);
  }

  function handleMoveClick(tile) {
    const game = get(gameStore);
    const selectedUnit = game.units.find(u => u.id === game.selectedUnitId);
    if (!selectedUnit || game.gameOver) return;
    if (game.actionsRemaining <= 0) {
      onCombatLog?.('行动点不足！');
      return;
    }
    
    const oldX = selectedUnit.x;
    const oldY = selectedUnit.y;
    
    gameStore.moveUnit(selectedUnit.id, tile.x, tile.y);
    gameStore.useAction();
    
    onCombatLog?.(`${UNIT_TYPES[selectedUnit.type]?.name} 移动到 (${tile.x}, ${tile.y})`);
    
    if (onTileEffect) {
      onTileEffect(selectedUnit.id, tile.x, tile.y);
    }
    
    const newGame = get(gameStore);
    const newUnit = newGame.units.find(u => u.id === selectedUnit.id);
    if (newUnit) {
      const newValidAttacks = getValidAttackTiles(newUnit, newGame.units);
      gameStore.setValidAttacks(newValidAttacks);
      showValidAttacks(newValidAttacks);
    }
  }

  function handleAttackClick(tile) {
    const game = get(gameStore);
    const selectedUnit = game.units.find(u => u.id === game.selectedUnitId);
    const targetUnit = game.units.find(u => u.id === tile.targetId);
    
    if (!selectedUnit || !targetUnit || game.gameOver) return;
    if (selectedUnit.hasAttacked) {
      onCombatLog?.('该单位本回合已攻击！');
      return;
    }
    if (game.actionsRemaining <= 0) {
      onCombatLog?.('行动点不足！');
      return;
    }
    
    const combatResult = calculateCombat(selectedUnit, targetUnit);
    
    if (combatResult.attackerHit) {
      gameStore.applyDamage(targetUnit.id, combatResult.defenderDamage, selectedUnit.id);
      onCombatLog?.(`${UNIT_TYPES[selectedUnit.type]?.name} 对 ${UNIT_TYPES[targetUnit.type]?.name} 造成 ${combatResult.defenderDamage} 点伤害！`);
    } else {
      onCombatLog?.(`${UNIT_TYPES[selectedUnit.type]?.name} 攻击未命中！`);
    }
    
    if (combatResult.defenderHit && combatResult.attackerDamage > 0) {
      gameStore.applyDamage(selectedUnit.id, combatResult.attackerDamage, targetUnit.id);
      onCombatLog?.(`${UNIT_TYPES[targetUnit.type]?.name} 反击造成 ${combatResult.attackerDamage} 点伤害！`);
    }
    
    gameStore.markAttacked(selectedUnit.id);
    gameStore.useAction();
    
    clearHighlights();
    
    setTimeout(() => {
      const newGame = get(gameStore);
      const winner = checkEliminationOnly(newGame.units);
      if (winner) {
        onBattleEnd?.(winner, 'elimination');
      }
    }, 100);
  }

  function renderBoard() {
    const game = get(gameStore);
    const terrainMap = getCurrentTerrainMap();
    const width = BOARD_CONFIG.width;
    const height = BOARD_CONFIG.height;
    
    tileSprites.forEach(s => s.destroy());
    tileSprites = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrain = terrainMap ? terrainMap[y][x] : 'plain';
        const sprite = createTileSprite(x, y, terrain);
        boardLayer.addChild(sprite);
        tileSprites.push(sprite);
      }
    }
  }

  function renderUnits() {
    const game = get(gameStore);
    
    Object.values(unitSprites).forEach(s => s.destroy());
    unitSprites = {};
    
    game.units.forEach(unit => {
      const sprite = createUnitSprite(unit);
      unitsLayer.addChild(sprite);
      unitSprites[unit.id] = sprite;
    });
  }

  function updateUnitPositions() {
    const game = get(gameStore);
    const size = BOARD_CONFIG.tileSize;
    
    game.units.forEach(unit => {
      const sprite = unitSprites[unit.id];
      if (sprite) {
        sprite.x = unit.x * size;
        sprite.y = unit.y * size;
      }
    });
  }

  let unsubscribe;

  onMount(() => {
    const width = BOARD_CONFIG.width * BOARD_CONFIG.tileSize;
    const height = BOARD_CONFIG.height * BOARD_CONFIG.tileSize;
    
    app = new PIXI.Application({ width, height, backgroundColor: BOARD_CONFIG.backgroundColor });
    container.appendChild(app.view);
    
    boardLayer = new PIXI.Container();
    unitsLayer = new PIXI.Container();
    highlightLayer = new PIXI.Container();
    uiLayer = new PIXI.Container();
    
    app.stage.addChild(boardLayer);
    app.stage.addChild(highlightLayer);
    app.stage.addChild(unitsLayer);
    app.stage.addChild(uiLayer);
    
    renderBoard();
    renderUnits();
    
    unsubscribe = gameStore.subscribe(() => {
      updateUnitPositions();
      renderUnits();
      
      const game = get(gameStore);
      if (!game.selectedUnitId) {
        clearHighlights();
      }
    });
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
    if (app) app.destroy();
  });

  export function refreshBoard() {
    renderBoard();
    renderUnits();
  }
</script>

<div bind:this={container} class="ruins-board"></div>

<style>
  .ruins-board {
    display: inline-block;
    border: 3px solid #5c4033;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  }
</style>
