<script>
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import GameBoard from '$lib/components/GameBoard.svelte';
  import GameInfo from '$lib/components/GameInfo.svelte';
  import EventCards from '$lib/components/EventCards.svelte';
  import CombatLog from '$lib/components/CombatLog.svelte';
  import GameRecords from '$lib/components/GameRecords.svelte';
  import UnitLegend from '$lib/components/UnitLegend.svelte';
  import ChapterMap from '$lib/components/ChapterMap.svelte';
  import DialogBox from '$lib/components/DialogBox.svelte';
  import RewardModal from '$lib/components/RewardModal.svelte';
  import UnitPanel from '$lib/components/UnitPanel.svelte';
  import { gameStore } from '$lib/stores/gameStore.js';
  import { campaignStore, currentLevel } from '$lib/stores/campaignStore.js';
  import { checkWinConditions as _checkWinConditions, updateBaseCaptureProgress } from '$lib/utils/gameLogic.js';
  import { saveGameRecord, getStats } from '$lib/utils/storage.js';
  import { GAME_RULES } from '$lib/config/gameRules.js';
  import { CHAPTERS } from '$lib/config/chapters.js';

  let combatLogs = [];
  let showRecords = false;
  let firstInit = true;
  let menuStats = { totalGames: 0, redWins: 0, blueWins: 0, draws: 0, avgTurns: 0 };

  $: campaignView = $campaignStore.view;
  $: level = $currentLevel;
  $: game = $gameStore;
  $: mode = game.mode;

  function addLog(msg) {
    combatLogs = [...combatLogs, msg];
    if (combatLogs.length > 100) {
      combatLogs = combatLogs.slice(-100);
    }
  }

  function startSkirmish() {
    gameStore.reset();
    combatLogs = [];
    addLog('自由对战开始！红方先行动。');
  }

  function startCampaign() {
    $campaignStore.setView('chapter_map');
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

    const maxTurns = game.maxTurns || GAME_RULES.maxTurns;
    const winner = checkWinConditions(game.units, game.turn, captureProgress, maxTurns);
    if (winner) {
      handleBattleEnd(winner, captureProgress, game);
      return;
    }

    gameStore.endTurn();

    setTimeout(() => {
      const newGame = get(gameStore);
      addLog(`=== 第 ${newGame.turn} 回合 - ${newGame.currentPlayer === 'red' ? '红方' : '蓝方'} 行动 ===`);
    }, 100);
  }

  function checkWinConditions(units, turn, baseCaptureProgress, maxTurns) {
    const redUnits = units.filter(u => u.player === 'red');
    const blueUnits = units.filter(u => u.player === 'blue');

    if (redUnits.length === 0) return 'blue';
    if (blueUnits.length === 0) return 'red';

    if (baseCaptureProgress?.red?.base_blue >= 2) return 'red';
    if (baseCaptureProgress?.blue?.base_red >= 2) return 'blue';

    if (turn > maxTurns) {
      if (redUnits.length > blueUnits.length) return 'red';
      if (blueUnits.length > redUnits.length) return 'blue';
      return 'draw';
    }

    return null;
  }

  function handleBattleEnd(winner, captureProgress, game) {
    gameStore.setWinner(winner);
    const redUnits = game.units.filter(u => u.player === 'red').length;
    const blueUnits = game.units.filter(u => u.player === 'blue').length;

    let reason = '';
    if (captureProgress?.red?.base_blue >= 2 || captureProgress?.blue?.base_red >= 2) {
      reason = '，占领基地获胜';
    } else if (game.turn > (game.maxTurns || GAME_RULES.maxTurns)) {
      reason = '，回合耗尽，单位数较多方获胜';
    } else {
      reason = '，全歼敌军获胜';
    }

    const winnerName = winner === 'red' ? '红方' : winner === 'blue' ? '蓝方' : '平局';
    addLog(`🏆 游戏结束！${winnerName}${reason}！`);

    if (game.mode === 'campaign') {
      const battleStats = gameStore.getBattleStats();
      const deployedUnits = $campaignStore.battle.deployedUnits;
      const synergies = $campaignStore.battle.activeSynergies || [];
      const classCounts = $campaignStore.battle.classCounts || {};
      $campaignStore.recordBattleData(battleStats);
      $campaignStore.completeBattle({
        winner,
        turns: game.turn,
        redUnits,
        blueUnits,
        synergies: synergies.map(s => s.name),
        classCounts
      });
    } else {
      saveGameRecord({
        winner,
        turns: game.turn,
        redUnits,
        blueUnits
      });
    }
  }

  function handleReset() {
    if (mode === 'campaign') {
      $campaignStore.setView('chapter_map');
    } else {
      startSkirmish();
    }
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

  function initCampaignGame() {
    if (!level) return;

    gameStore.startCampaignBattle({
      levelId: level.id,
      chapterId: level.chapterId,
      units: $campaignStore.battle.deployedUnits,
      maxTurns: level.maxTurns,
      winCondition: level.winCondition
    });

    combatLogs = [];
    addLog(`【${level.title}】战斗开始！`);
    addLog(`目标: ${level.description}`);
    addLog('红方先行动。');
  }

  $: if (campaignView === 'battle' && firstInit === false) {
    if (game.mode !== 'campaign' || !game.levelId) {
      initCampaignGame();
    }
  }

  onMount(() => {
    firstInit = false;
    menuStats = getStats();
    if (browser) {
      addLog('欢迎来到失落遗迹 - 战术推演');
    }
  });

  $: if (campaignView === 'menu') {
    menuStats = getStats();
  }
</script>

<svelte:head>
  <title>失落遗迹 - 战术推演</title>
</svelte:head>

{#if campaignView === 'menu'}
  <div class="main-menu">
    <div class="menu-bg"></div>
    <div class="menu-content">
      <div class="title-area">
        <h1 class="game-title">失落遗迹</h1>
        <h2 class="game-subtitle">战术推演</h2>
        <p class="game-desc">基于 SvelteKit + PixiJS 的冷门桌游风格 H5 战术游戏</p>
      </div>

      <div class="menu-buttons">
        <button class="menu-btn primary" on:click={startCampaign}>
          <span class="btn-icon">⚔️</span>
          <span class="btn-text">
            <span class="btn-title">开始战役</span>
            <span class="btn-subtitle">剧情模式 · 章节关卡 · 单位成长</span>
          </span>
        </button>

        <button class="menu-btn" on:click={startSkirmish}>
          <span class="btn-icon">🎯</span>
          <span class="btn-text">
            <span class="btn-title">自由对战</span>
            <span class="btn-subtitle">标准模式 · 快速开始</span>
          </span>
        </button>

        <button class="menu-btn" on:click={() => $campaignStore.setView('units')}>
          <span class="btn-icon">🎖️</span>
          <span class="btn-text">
            <span class="btn-title">部队管理</span>
            <span class="btn-subtitle">查看单位 · 招募新兵</span>
          </span>
        </button>

        <button class="menu-btn" on:click={handleShowRecords}>
          <span class="btn-icon">📜</span>
          <span class="btn-text">
            <span class="btn-title">战报记录</span>
            <span class="btn-subtitle">历史战绩 · 数据统计</span>
          </span>
        </button>
      </div>

      <div class="menu-stats">
        <div class="stat-item">
          <span class="stat-num">{menuStats.totalGames}</span>
          <span class="stat-label">总场次</span>
        </div>
        <div class="stat-item">
          <span class="stat-num win">{menuStats.redWins}</span>
          <span class="stat-label">胜利</span>
        </div>
        <div class="stat-item">
          <span class="stat-num lose">{menuStats.blueWins}</span>
          <span class="stat-label">失败</span>
        </div>
        {#if menuStats.totalGames > 0}
          <div class="stat-item">
            <span class="stat-num">{Math.round(menuStats.redWins / menuStats.totalGames * 100)}%</span>
            <span class="stat-label">胜率</span>
          </div>
        {/if}
      </div>

      <div class="menu-footer">
        <button class="ghost-btn" on:click={() => $campaignStore.save()}>💾 保存进度</button>
        <button class="ghost-btn" on:click={() => {
          if (confirm('确定要重置所有战役进度吗？此操作不可恢复！')) {
            $campaignStore.resetProgress();
          }
        }}>🔄 重置进度</button>
      </div>
    </div>
  </div>

{:else if campaignView === 'chapter_map'}
  <ChapterMap />

{:else if campaignView === 'units'}
  <UnitPanel mode="manage" />

{:else if campaignView === 'unit_deploy'}
  <UnitPanel mode="deploy" />

{:else if campaignView === 'battle'}
  <div class="game-container">
    <header class="game-header">
      {#if mode === 'campaign' && level}
        <div class="campaign-header-info">
          <button class="back-btn" on:click={handleReset}>← 放弃战斗</button>
          <div class="level-info">
            <h1>{level.title}</h1>
            <p class="level-desc">{level.description}</p>
          </div>
          <div class="battle-stats">
            <span>回合: {game.turn}/{game.maxTurns || GAME_RULES.maxTurns}</span>
          </div>
        </div>
      {:else}
        <h1>失落遗迹 - 自由对战</h1>
        <p class="subtitle">标准模式</p>
      {/if}
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
{/if}

<DialogBox />
<RewardModal />
<GameRecords show={showRecords} onClose={handleCloseRecords} />

{#if $campaignStore.notification}
  <div class="notification {$campaignStore.notification.type}">
    {$campaignStore.notification.message}
  </div>
{/if}

<style>
  .main-menu {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
  }

  .menu-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at top, rgba(60, 40, 20, 0.3) 0%, transparent 60%),
      radial-gradient(ellipse at bottom, rgba(20, 40, 80, 0.3) 0%, transparent 60%),
      linear-gradient(180deg, #0a0a14 0%, #141420 100%);
  }

  .menu-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(255, 200, 100, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(100, 150, 255, 0.05) 0%, transparent 40%);
  }

  .menu-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    width: 100%;
    text-align: center;
  }

  .title-area {
    margin-bottom: 48px;
  }

  .game-title {
    font-size: 56px;
    margin: 0;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 8px;
    animation: shimmer 4s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .game-subtitle {
    font-size: 24px;
    margin: 8px 0 0 0;
    color: #a0a0c0;
    letter-spacing: 12px;
  }

  .game-desc {
    color: #707090;
    font-size: 13px;
    margin-top: 16px;
  }

  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 40px;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 18px 24px;
    background: linear-gradient(135deg, rgba(40, 40, 70, 0.9), rgba(25, 25, 50, 0.9));
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 14px;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    text-align: left;
  }

  .menu-btn:hover {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(255, 204, 0, 0.5);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 204, 0, 0.1);
  }

  .menu-btn.primary {
    background: linear-gradient(135deg, rgba(80, 60, 20, 0.95), rgba(60, 40, 10, 0.95));
    border-color: rgba(255, 204, 0, 0.5);
    box-shadow: 0 4px 20px rgba(204, 153, 0, 0.2);
  }

  .menu-btn.primary:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 204, 0, 0.25);
  }

  .btn-icon {
    font-size: 32px;
    width: 48px;
    text-align: center;
    flex-shrink: 0;
  }

  .btn-text {
    flex: 1;
  }

  .btn-title {
    display: block;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .btn-subtitle {
    display: block;
    font-size: 12px;
    color: #888;
  }

  .menu-stats {
    display: flex;
    justify-content: center;
    gap: 28px;
    padding: 20px;
    background: rgba(30, 30, 50, 0.6);
    border-radius: 14px;
    margin-bottom: 24px;
    border: 1px solid rgba(100, 100, 150, 0.2);
  }

  .stat-item {
    text-align: center;
  }

  .stat-num {
    display: block;
    font-size: 24px;
    font-weight: 800;
    color: #ccc;
  }

  .stat-num.win { color: #66ff66; }
  .stat-num.lose { color: #ff6666; }

  .stat-label {
    font-size: 11px;
    color: #777;
  }

  .menu-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .ghost-btn {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 8px;
    color: #888;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ghost-btn:hover {
    color: #ccc;
    border-color: rgba(150, 150, 200, 0.5);
  }

  .game-container {
    min-height: 100vh;
    padding: 16px;
  }

  .game-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .campaign-header-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 20px;
    background: rgba(20, 20, 35, 0.8);
    border-radius: 14px;
    border: 1px solid rgba(255, 204, 0, 0.25);
  }

  .campaign-header-info h1 {
    margin: 0;
    font-size: 22px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .level-info {
    flex: 1;
  }

  .level-desc {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #aaa;
  }

  .back-btn {
    padding: 10px 18px;
    background: linear-gradient(135deg, #5a3a3a, #4a2a2a);
    border: 1px solid rgba(200, 100, 100, 0.3);
    border-radius: 8px;
    color: #ffaaaa;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: linear-gradient(135deg, #6a4a4a, #5a3a3a);
  }

  .battle-stats {
    padding: 8px 16px;
    background: rgba(50, 50, 80, 0.6);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #ffcc66;
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

  .notification {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 28px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    z-index: 2000;
    animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }

  .notification.info {
    background: linear-gradient(135deg, #3a5a8a, #2a4a7a);
    border: 1px solid rgba(100, 150, 255, 0.4);
    color: #aaccff;
  }

  .notification.success {
    background: linear-gradient(135deg, #3a7a4a, #2a6a3a);
    border: 1px solid rgba(100, 255, 150, 0.4);
    color: #aaffbb;
  }

  .notification.warning {
    background: linear-gradient(135deg, #7a6a3a, #6a5a2a);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffddaa;
  }

  .notification.error {
    background: linear-gradient(135deg, #7a3a3a, #6a2a2a);
    border: 1px solid rgba(255, 100, 100, 0.4);
    color: #ffaabb;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -30px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
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
    .campaign-header-info {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
