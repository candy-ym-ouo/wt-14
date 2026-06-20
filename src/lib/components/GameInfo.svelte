<script>
  import { gameStore, selectedUnit, getEffectiveAttack, getEffectiveDefense } from '$lib/stores/gameStore.js';
  import { UNIT_TYPES } from '$lib/config/units.js';
  import { BOARD_CONFIG, TERRAIN_MAP } from '$lib/config/board.js';
  import { GAME_RULES, WIN_CONDITIONS } from '$lib/config/gameRules.js';

  export let onEndTurn;
  export let onReset;
  export let onShowRecords;

  const TERRAIN_NAMES = {
    plain: '平原',
    forest: '森林',
    mountain: '山脉',
    water: '水域',
    ruin: '遗迹',
    base_red: '红方基地',
    base_blue: '蓝方基地'
  };

  function getTerrainAt(x, y) {
    if (x < 0 || x >= BOARD_CONFIG.width || y < 0 || y >= BOARD_CONFIG.height) return null;
    return TERRAIN_MAP[y][x];
  }
</script>

<div class="game-info">
  <div class="info-section turn-info">
    <div class="current-turn">
      <span class="label">回合</span>
      <span class="value">{$gameStore.turn} / {GAME_RULES.maxTurns}</span>
    </div>
    <div class="current-player {$gameStore.currentPlayer}">
      <span class="label">当前方</span>
      <span class="value">{$gameStore.currentPlayer === 'red' ? '红方' : '蓝方'}</span>
    </div>
    <div class="actions">
      <span class="label">行动点</span>
      <span class="value">{$gameStore.actionsRemaining}</span>
    </div>
  </div>

  <div class="info-section units-count">
    <div class="count red">
      <span class="dot"></span>
      红方: {$gameStore.units.filter(u => u.player === 'red').length}
    </div>
    <div class="count blue">
      <span class="dot"></span>
      蓝方: {$gameStore.units.filter(u => u.player === 'blue').length}
    </div>
  </div>

  {#if $gameStore.gameOver}
    <div class="game-over">
      <div class="winner {$gameStore.winner}">
        {#if $gameStore.winner === 'draw'}
          平局！
        {:else}
          {$gameStore.winner === 'red' ? '红方' : '蓝方'} 获胜！
        {/if}
      </div>
      <button class="btn-reset" on:click={onReset}>重新开始</button>
    </div>
  {/if}

  {#if $selectedUnit}
    <div class="info-section unit-info">
      <h4>选中单位</h4>
      <div class="unit-name {$selectedUnit.player}">
        {UNIT_TYPES[$selectedUnit.type].name}
      </div>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">生命:</span>
          <span class="stat-value">{$selectedUnit.hp}/{$selectedUnit.maxHp}</span>
        </div>
        <div class="stat">
          <span class="stat-label">攻击:</span>
          <span class="stat-value">{getEffectiveAttack($selectedUnit)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">防御:</span>
          <span class="stat-value">{getEffectiveDefense($selectedUnit)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">移动:</span>
          <span class="stat-value">{$selectedUnit.moveRange}</span>
        </div>
        <div class="stat">
          <span class="stat-label">射程:</span>
          <span class="stat-value">{$selectedUnit.attackRange}</span>
        </div>
      </div>
      <div class="unit-terrain">
        地形: {TERRAIN_NAMES[getTerrainAt($selectedUnit.x, $selectedUnit.y)]}
        (+{BOARD_CONFIG.terrainDefense[getTerrainAt($selectedUnit.x, $selectedUnit.y)]} 防御)
      </div>
      <div class="unit-status">
        {#if $selectedUnit.hasMoved}
          <span class="status-tag moved">已移动</span>
        {/if}
        {#if $selectedUnit.hasAttacked}
          <span class="status-tag attacked">已攻击</span>
        {/if}
      </div>
    </div>
  {/if}

  <div class="info-section capture-info">
    <h4>占领进度</h4>
    <div class="capture-row">
      <span class="capture-label red">红方占蓝基:</span>
      <div class="progress-bar">
        <div class="progress red" style="width: {$gameStore.baseCaptureProgress.red.base_blue * 50}%"></div>
      </div>
      <span class="capture-value">{$gameStore.baseCaptureProgress.red.base_blue}/2</span>
    </div>
    <div class="capture-row">
      <span class="capture-label blue">蓝方占红基:</span>
      <div class="progress-bar">
        <div class="progress blue" style="width: {$gameStore.baseCaptureProgress.blue.base_red * 50}%"></div>
      </div>
      <span class="capture-value">{$gameStore.baseCaptureProgress.blue.base_red}/2</span>
    </div>
  </div>

  <div class="info-section controls">
    <button 
      class="btn-end-turn" 
      on:click={onEndTurn}
      disabled={$gameStore.gameOver}
    >
      结束回合
    </button>
    <button class="btn-secondary" on:click={onShowRecords}>
      历史记录
    </button>
    <button class="btn-secondary" on:click={onReset}>
      重新开始
    </button>
  </div>
</div>

<style>
  .game-info {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #333;
    min-width: 240px;
  }
  .info-section {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #333;
  }
  .info-section:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .info-section h4 {
    margin: 0 0 10px 0;
    color: #e8d5b7;
    font-size: 14px;
  }
  .turn-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .current-turn, .current-player, .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .label {
    color: #888;
    font-size: 13px;
  }
  .value {
    color: #e8d5b7;
    font-weight: bold;
    font-size: 16px;
  }
  .current-player.red .value { color: #ff6b6b; }
  .current-player.blue .value { color: #4dabf7; }

  .units-count {
    display: flex;
    gap: 16px;
    font-size: 14px;
  }
  .count {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .count.red { color: #ff6b6b; }
  .count.blue { color: #4dabf7; }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
  .count.red .dot { background: #ff6b6b; }
  .count.blue .dot { background: #4dabf7; }

  .game-over {
    text-align: center;
    padding: 16px;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 8px;
    border: 1px solid #ffd700;
    margin-bottom: 16px;
  }
  .winner {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 12px;
  }
  .winner.red { color: #ff6b6b; }
  .winner.blue { color: #4dabf7; }

  .unit-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .unit-name.red { color: #ff6b6b; }
  .unit-name.blue { color: #4dabf7; }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
  }
  .stat {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }
  .stat-label { color: #888; }
  .stat-value { color: #e8d5b7; }
  .unit-terrain {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 8px;
  }
  .unit-status {
    display: flex;
    gap: 6px;
  }
  .status-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
  }
  .status-tag.moved { background: #666; color: #fff; }
  .status-tag.attacked { background: #8b0000; color: #fff; }

  .capture-info { }
  .capture-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
  }
  .capture-label { min-width: 80px; }
  .capture-label.red { color: #ff6b6b; }
  .capture-label.blue { color: #4dabf7; }
  .progress-bar {
    flex: 1;
    height: 8px;
    background: #333;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress { height: 100%; transition: width 0.3s; }
  .progress.red { background: #ff6b6b; }
  .progress.blue { background: #4dabf7; }
  .capture-value { color: #aaa; min-width: 30px; text-align: right; }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-end-turn {
    background: linear-gradient(135deg, #d4a574, #8b6914);
    color: #1a1a2e;
  }
  .btn-end-turn:hover:not(:disabled) {
    background: linear-gradient(135deg, #e8b584, #a67c1a);
    transform: translateY(-1px);
  }
  .btn-end-turn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-secondary {
    background: #333;
    color: #e8d5b7;
  }
  .btn-secondary:hover {
    background: #444;
  }
  .btn-reset {
    padding: 8px 16px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    color: #1a1a2e;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }
</style>
