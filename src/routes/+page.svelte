<script>
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import GameBoard from '$lib/components/GameBoard.svelte';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import EventCards from '$lib/components/EventCards.svelte';
  import CombatLog from '$lib/components/CombatLog.svelte';
  import GameRecords from '$lib/components/GameRecords.svelte';
  import UnitLegend from '$lib/components/UnitLegend.svelte';
  import { gameStore } from '$lib/stores/gameStore.js';
  import { checkWinConditions, updateBaseCaptureProgress } from '$lib/utils/gameLogic.js';
  import { saveGameRecord } from '$lib/utils/storage.js';
  import { GAME_RULES } from '$lib/config/gameRules.js';

  let combatLogs = [];
  let showRecords = false;

  function addLog(msg) {
    combatLogs = [...combatLogs, msg];
    if (combatLogs.length > 100) {
      combatLogs = combatLogs.slice(-100);
    }
  }

  function handleEndTurn() {
    const game = get(gameStore);
    if (game.gameOver) return;

    const endingPlayer = game.currentPlayer;
    addLog(`--- ${endingPlayer === 'red' ? '红方' : '蓝方'} 回合结束 ---`);

    const captureProgress = updateBaseCaptureProgress(game.units, game.baseCaptureProgress);
    gameStore.updateBaseCapture(captureProgress);

    if (captureProgress.red.base_blue > 0) {
      addLog(`红方占领蓝方基地进度: ${captureProgress.red.base_blue}/2`);
    }
    if (captureProgress.blue.base_red > 0) {
      addLog(`蓝方占领红方基地进度: ${captureProgress.blue.base_red}/2`);
    }

    const winner = checkWinConditions(game.units, game.turn, captureProgress);
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
      let reason = '';
      if (captureProgress.red.base_blue >= 2 || captureProgress.blue.base_red >= 2) {
        reason = '，占领基地获胜';
      } else if (game.turn > GAME_RULES.maxTurns) {
        reason = '，回合耗尽，单位数较多方获胜';
      }
      const winnerName = winner === 'red' ? '红方' : winner === 'blue' ? '蓝方' : '平局';
      addLog(`🏆 游戏结束！${winnerName}${reason}！`);
      return;
    }

    gameStore.endTurn();

    setTimeout(() => {
      const newGame = get(gameStore);
      addLog(`=== 第 ${newGame.turn} 回合 - ${newGame.currentPlayer === 'red' ? '红方' : '蓝方'} 行动 ===`);
    }, 100);
  }

  function handleReset() {
    gameStore.reset();
    combatLogs = [];
    addLog('新游戏开始！红方先行动。');
  }

  function handleCardPlayed(card) {
    addLog(`使用事件卡: ${card.name} - ${card.description}`);
  }

  function handleShowRecords() {
    showRecords = true;
  }

  function handleCloseRecords() {
    showRecords = false;
  }

  if (browser) {
    addLog('游戏启动！红方先行动。');
  }
</script>

<div class="game-container">
  <header class="game-header">
    <h1>失落遗迹 - 战术推演</h1>
    <p class="subtitle">基于 SvelteKit + PixiJS 的冷门桌游风格 H5 战术游戏</p>
  </header>

  <main class="game-main">
    <aside class="left-panel">
      <GameInfo 
        onEndTurn={handleEndTurn}
        onReset={handleReset}
        onShowRecords={handleShowRecords}
      />
      <UnitLegend />
    </aside>

    <section class="center-panel">
      <div class="board-wrapper">
        <GameBoard onCombatLog={addLog} />
      </div>
      <CombatLog logs={combatLogs} />
    </section>

    <aside class="right-panel">
      <EventCards onCardPlayed={handleCardPlayed} />
      <div class="help-panel">
        <h3>操作指南</h3>
        <ul>
          <li>点击己方单位选中</li>
          <li>绿色区域为可移动范围</li>
          <li>红色区域为可攻击目标</li>
          <li>每回合 3 个行动点</li>
          <li>移动和攻击各消耗 1 点</li>
          <li>占领敌方基地 2 回合获胜</li>
        </ul>
      </div>
    </aside>
  </main>
</div>

<GameRecords show={showRecords} onClose={handleCloseRecords} />

<style>
  .game-container {
    min-height: 100vh;
    padding: 16px;
  }
  .game-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .game-header h1 {
    margin: 0;
    font-size: 28px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
  }
  .subtitle {
    margin: 6px 0 0 0;
    color: #888;
    font-size: 13px;
  }
  .game-main {
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .left-panel {
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .center-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .board-wrapper {
    display: flex;
    justify-content: center;
  }
  .right-panel {
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .help-panel {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 14px;
    border: 1px solid #333;
  }
  .help-panel h3 {
    margin: 0 0 10px 0;
    color: #e8d5b7;
    font-size: 14px;
  }
  .help-panel ul {
    margin: 0;
    padding-left: 18px;
    color: #aaa;
    font-size: 12px;
    line-height: 1.8;
  }
  .help-panel li {
    margin-bottom: 2px;
  }
  @media (max-width: 1200px) {
    .game-main {
      flex-direction: column;
      align-items: center;
    }
    .left-panel, .right-panel {
      width: 100%;
      max-width: 700px;
    }
    .right-panel {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .right-panel > :global(*) {
      flex: 1;
      min-width: 300px;
    }
  }
</style>
