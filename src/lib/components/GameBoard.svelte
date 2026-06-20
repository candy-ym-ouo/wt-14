<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import * as PIXI from 'pixi.js';
  import { BOARD_CONFIG, TERRAIN_MAP } from '$lib/config/board.js';
  import { UNIT_TYPES } from '$lib/config/units.js';
  import { 
    gameStore, 
    getEffectiveAttack, 
    getEffectiveDefense 
  } from '$lib/stores/gameStore.js';
  import { 
    getValidMoveTiles, 
    getValidAttackTiles, 
    calculateCombat, 
    checkEliminationOnly
  } from '$lib/utils/gameLogic.js';
  import { saveGameRecord } from '$lib/utils/storage.js';

  export let onCombatLog;

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

  const TERRAIN_NAMES = {
    plain: '平原',
    forest: '森林',
    mountain: '山脉',
    water: '水域',
    ruin: '遗迹',
    base_red: '红方基地',
    base_blue: '蓝方基地'
  };

  function createTileSprite(x, y, terrain) {
    const size = BOARD_CONFIG.tileSize;
    const graphics = new PIXI.Graphics();
    const color = BOARD_CONFIG.terrainColors[terrain] || 0x333333;
    
    graphics.beginFill(color);
    graphics.lineStyle(1, BOARD_CONFIG.gridColor, 1);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    graphics.x = x * size;
    graphics.y = y * size;
    graphics.interactive = true;
    graphics.buttonMode = true;
    
    const terrainSymbol = getTerrainSymbol(terrain);
    if (terrainSymbol) {
      const text = new PIXI.Text(terrainSymbol, {
        fontSize: 20,
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

  function getTerrainSymbol(terrain) {
    const symbols = {
      forest: '🌲',
      mountain: '⛰',
      water: '🌊',
      ruin: '🏛',
      base_red: '🚩',
      base_blue: '🏳️'
    };
    return symbols[terrain] || null;
  }

  function createUnitSprite(unit) {
    const size = BOARD_CONFIG.tileSize;
    const baseType = UNIT_TYPES[unit.type];
    const container = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    const playerColor = unit.player === 'red' ? 0xcc2222 : 0x2222cc;
    bg.beginFill(playerColor, 0.85);
    bg.lineStyle(2, 0x000000, 1);
    bg.drawCircle(size / 2, size / 2, size / 2 - 6);
    bg.endFill();
    container.addChild(bg);
    
    const typeText = new PIXI.Text(baseType.name[0], {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff
    });
    typeText.anchor.set(0.5);
    typeText.x = size / 2;
    typeText.y = size / 2 - 4;
    container.addChild(typeText);
    
    const hpBar = new PIXI.Graphics();
    const hpRatio = unit.hp / unit.maxHp;
    const barWidth = size - 16;
    const barHeight = 5;
    hpBar.beginFill(0x333333);
    hpBar.drawRect(8, size - 10, barWidth, barHeight);
    hpBar.endFill();
    hpBar.beginFill(hpRatio > 0.5 ? 0x33cc33 : hpRatio > 0.25 ? 0xcccc33 : 0xcc3333);
    hpBar.drawRect(8, size - 10, barWidth * hpRatio, barHeight);
    hpBar.endFill();
    container.addChild(hpBar);

    if (unit.hasMoved && unit.hasAttacked) {
      const dim = new PIXI.Graphics();
      dim.beginFill(0x000000, 0.4);
      dim.drawCircle(size / 2, size / 2, size / 2 - 6);
      dim.endFill();
      container.addChild(dim);
    }

    container.x = unit.x * size;
    container.y = unit.y * size;
    container.interactive = true;
    container.buttonMode = true;
    
    container.on('pointerdown', (e) => {
      e.stopPropagation();
      handleUnitClick(unit.id);
    });

    return container;
  }

  function showHoverHighlight(x, y) {
    hideHoverHighlight();
    const size = BOARD_CONFIG.tileSize;
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.drawRect(0, 0, size, size);
    graphics.x = x * size;
    graphics.y = y * size;
    highlightLayer.addChild(graphics);
    highlightSprites.push(graphics);
  }

  function hideHoverHighlight() {
    highlightSprites.forEach(s => s.destroy());
    highlightSprites = [];
  }

  function showMoveHighlights(tiles) {
    const size = BOARD_CONFIG.tileSize;
    tiles.forEach(tile => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x33cc33, 0.4);
      graphics.lineStyle(2, 0x66ff66, 0.8);
      graphics.drawRect(2, 2, size - 4, size - 4);
      graphics.endFill();
      graphics.x = tile.x * size;
      graphics.y = tile.y * size;
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.on('pointerdown', () => {
        handleMoveTo(tile.x, tile.y);
      });
      highlightLayer.addChild(graphics);
      highlightSprites.push(graphics);
    });
  }

  function showAttackHighlights(tiles) {
    const size = BOARD_CONFIG.tileSize;
    tiles.forEach(tile => {
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xcc3333, 0.4);
      graphics.lineStyle(2, 0xff6666, 0.8);
      graphics.drawRect(2, 2, size - 4, size - 4);
      graphics.endFill();
      graphics.x = tile.x * size;
      graphics.y = tile.y * size;
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.on('pointerdown', () => {
        handleAttackAt(tile.x, tile.y, tile.targetId);
      });
      highlightLayer.addChild(graphics);
      highlightSprites.push(graphics);
    });
  }

  function clearHighlights() {
    highlightSprites.forEach(s => s.destroy());
    highlightSprites = [];
    gameStore.setValidMoves([]);
    gameStore.setValidAttacks([]);
  }

  function handleUnitClick(unitId) {
    const game = get(gameStore);
    if (game.gameOver) return;
    
    const clickedUnit = game.units.find(u => u.id === unitId);
    if (!clickedUnit) return;

    if (game.selectedUnitId && game.validAttackTiles.some(t => t.targetId === unitId)) {
      handleAttackAt(clickedUnit.x, clickedUnit.y, unitId);
      return;
    }

    if (clickedUnit.player !== game.currentPlayer) return;
    if (game.actionsRemaining <= 0) return;

    clearHighlights();
    gameStore.selectUnit(unitId);

    const moveTiles = clickedUnit.hasMoved ? [] : getValidMoveTiles(clickedUnit, game.units, game.movementLimit);
    const attackTiles = clickedUnit.hasAttacked ? [] : getValidAttackTiles(clickedUnit, game.units);

    gameStore.setValidMoves(moveTiles);
    gameStore.setValidAttacks(attackTiles);

    showMoveHighlights(moveTiles);
    showAttackHighlights(attackTiles);
  }

  function handleTileClick(x, y) {
    const game = get(gameStore);
    if (game.gameOver) return;

    if (game.selectedUnitId && game.validMoveTiles.some(t => t.x === x && t.y === y)) {
      handleMoveTo(x, y);
      return;
    }

    const unit = game.units.find(u => u.x === x && u.y === y);
    if (unit) {
      handleUnitClick(unit.id);
      return;
    }

    clearHighlights();
    gameStore.deselectUnit();
  }

  function handleMoveTo(x, y) {
    const game = get(gameStore);
    if (!game.selectedUnitId || game.actionsRemaining <= 0) return;

    const unit = game.units.find(u => u.id === game.selectedUnitId);
    if (!unit || unit.hasMoved) return;

    gameStore.moveUnit(unit.id, x, y);
    gameStore.useAction();
    onCombatLog?.(`${UNIT_TYPES[unit.type].name} 移动到 (${x + 1}, ${y + 1})`);

    const newGame = get(gameStore);
    const movedUnit = newGame.units.find(u => u.id === unit.id);
    clearHighlights();
    
    if (movedUnit && !movedUnit.hasAttacked) {
      const attackTiles = getValidAttackTiles(movedUnit, newGame.units);
      if (attackTiles.length > 0) {
        gameStore.setValidAttacks(attackTiles);
        showAttackHighlights(attackTiles);
      } else {
        gameStore.deselectUnit();
      }
    } else {
      gameStore.deselectUnit();
    }

    checkEndConditions();
  }

  function handleAttackAt(x, y, targetId) {
    const game = get(gameStore);
    if (!game.selectedUnitId || game.actionsRemaining <= 0) return;

    const attacker = game.units.find(u => u.id === game.selectedUnitId);
    const defender = game.units.find(u => u.id === targetId);
    if (!attacker || !defender || attacker.hasAttacked) return;

    const result = calculateCombat(attacker, defender);
    
    const attackerName = UNIT_TYPES[attacker.type].name;
    const defenderName = UNIT_TYPES[defender.type].name;

    if (result.attackerHit) {
      onCombatLog?.(`${attackerName} 攻击 ${defenderName}，造成 ${result.defenderDamage} 点伤害`);
      gameStore.applyDamage(defender.id, result.defenderDamage);
    } else {
      onCombatLog?.(`${attackerName} 攻击 ${defenderName}，未命中`);
    }

    if (result.attackerDamage > 0) {
      onCombatLog?.(`${defenderName} 反击，造成 ${result.attackerDamage} 点伤害`);
      gameStore.applyDamage(attacker.id, result.attackerDamage);
    }

    gameStore.markAttacked(attacker.id);
    gameStore.useAction();
    clearHighlights();
    gameStore.deselectUnit();
    checkEndConditions();
  }

  function checkEndConditions() {
    const game = get(gameStore);
    const winner = checkEliminationOnly(game.units);
    if (winner) {
      gameStore.setWinner(winner);
      const redUnits = game.units.filter(u => u.player === 'red').length;
      const blueUnits = game.units.filter(u => u.player === 'blue').length;
      saveGameRecord({
        winner,
        turns: game.turn,
        redUnits,
        blueUnits
      });
      const winnerName = winner === 'red' ? '红方' : winner === 'blue' ? '蓝方' : '平局';
      onCombatLog?.(`🏆 战斗结束！${winnerName} 全歼敌军，获得胜利！`);
    }
  }

  function renderBoard() {
    tileSprites.forEach(s => s.destroy());
    tileSprites = [];

    for (let y = 0; y < BOARD_CONFIG.height; y++) {
      for (let x = 0; x < BOARD_CONFIG.width; x++) {
        const terrain = TERRAIN_MAP[y][x];
        const sprite = createTileSprite(x, y, terrain);
        boardLayer.addChild(sprite);
        tileSprites.push(sprite);
      }
    }
  }

  function renderUnits() {
    Object.values(unitSprites).forEach(s => s.destroy());
    unitSprites = {};

    get(gameStore).units.forEach(unit => {
      const sprite = createUnitSprite(unit);
      unitsLayer.addChild(sprite);
      unitSprites[unit.id] = sprite;
    });
  }

  let unsubscribe;

  onMount(() => {
    const canvasWidth = BOARD_CONFIG.width * BOARD_CONFIG.tileSize;
    const canvasHeight = BOARD_CONFIG.height * BOARD_CONFIG.tileSize;

    app = new PIXI.Application({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: BOARD_CONFIG.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    container.appendChild(app.view);

    boardLayer = new PIXI.Container();
    unitsLayer = new PIXI.Container();
    highlightLayer = new PIXI.Container();
    uiLayer = new PIXI.Container();

    app.stage.addChild(boardLayer);
    app.stage.addChild(unitsLayer);
    app.stage.addChild(highlightLayer);
    app.stage.addChild(uiLayer);

    renderBoard();
    renderUnits();

    unsubscribe = gameStore.subscribe(() => {
      renderUnits();
    });
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
    if (app) app.destroy(true);
  });
</script>

<div bind:this={container} class="board-container"></div>

<style>
  .board-container {
    display: inline-block;
    border: 3px solid #5c4033;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
</style>
