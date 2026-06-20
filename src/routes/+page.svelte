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
  import RuinsMap from '$lib/components/RuinsMap.svelte';
  import RuinsEvent from '$lib/components/RuinsEvent.svelte';
  import RuinsReward from '$lib/components/RuinsReward.svelte';
  import RuinsSettlement from '$lib/components/RuinsSettlement.svelte';
  import { gameStore } from '$lib/stores/gameStore.js';
  import { campaignStore, currentLevel } from '$lib/stores/campaignStore.js';
  import { checkWinConditions as _checkWinConditions, updateBaseCaptureProgress, checkEliminationOnly } from '$lib/utils/gameLogic.js';
  import { calculateRuinsSettlement } from '$lib/utils/ruinsLogic.js';
  import { saveGameRecord, getStats } from '$lib/utils/storage.js';
  import { GAME_RULES } from '$lib/config/gameRules.js';
  import { CHAPTERS } from '$lib/config/chapters.js';
  import { UNIT_TYPES, UNIT_CLASSES } from '$lib/config/units.js';
  import { RUINS_CONFIG, RUINS_TERRAIN } from '$lib/config/ruins.js';

  let combatLogs = [];
  let ruinsLogs = [];
  let showRecords = false;
  let firstInit = true;
  let menuStats = { totalGames: 0, redWins: 0, blueWins: 0, draws: 0, avgTurns: 0 };
  let ruinsBoardRef = null;
  let showTreasureModal = false;
  let currentTreasure = null;

  $: campaignView = $campaignStore.view;
  $: level = $currentLevel;
  $: game = $gameStore;
  $: mode = game.mode;
  $: ruinsState = game.ruins;
  $: pendingEvent = ruinsState?.pendingEvent;
  $: atExit = ruinsState?.atExit;
  $: currentFloor = ruinsState?.currentFloor;
  $: currentGold = ruinsState?.currentGold || 0;
  $: treasuresCollected = ruinsState?.treasuresCollected || [];
  $: ruinsSettlement = $campaignStore.ruins?.settlement;

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
    campaignStore.setView('chapter_map');
  }

  function startRuinsMode() {
    campaignStore.startRuinsMode();
  }

  function addRuinsLog(msg) {
    ruinsLogs = [...ruinsLogs, msg];
    if (ruinsLogs.length > 100) {
      ruinsLogs = ruinsLogs.slice(-100);
    }
  }

  function handleRuinsTileEffect(unitId, x, y) {
    gameStore.handleRuinsTileEffect(unitId, x, y);
    
    const game = get(gameStore);
    const treasures = game.ruins?.treasuresCollected || [];
    if (treasures.length > treasuresCollected.length) {
      const newTreasure = treasures[treasures.length - 1];
      currentTreasure = newTreasure;
      showTreasureModal = true;
    }

    const logs = game.ruinsLog || [];
    if (logs.length > ruinsLogs.length) {
      logs.slice(ruinsLogs.length).forEach(msg => addRuinsLog(msg));
    }
  }

  function handleRuinsEventResolve(choice) {
    if (choice) {
      addRuinsLog(`选择了: ${choice.text}`);
    }
  }

  function handleTreasureClose() {
    showTreasureModal = false;
    currentTreasure = null;
  }

  function handleRuinsEndTurn() {
    const game = get(gameStore);
    if (game.gameOver) return;

    const endingPlayer = game.currentPlayer;
    addRuinsLog(`--- ${endingPlayer === 'red' ? '我方' : '敌方'} 回合结束 ---`);

    const winner = checkEliminationOnly(game.units);
    if (winner) {
      handleRuinsBattleEnd(winner, 'elimination');
      return;
    }

    const redUnits = game.units.filter(u => u.player === 'red');
    if (redUnits.length === 0) {
      handleRuinsBattleEnd('blue', 'elimination');
      return;
    }

    gameStore.endTurn();

    setTimeout(() => {
      const newGame = get(gameStore);
      addRuinsLog(`=== 第 ${newGame.turn} 回合 - ${newGame.currentPlayer === 'red' ? '我方' : '敌方'} 行动 ===`);
    }, 100);
  }

  function handleRuinsBattleEnd(winner, endReason) {
    const game = get(gameStore);
    if (game.gameOver && !game._battleEndHandled) {
      gameStore.setWinner(winner);
      game._battleEndHandled = true;
    }

    const battleStats = gameStore.getBattleStats();
    const settlement = calculateRuinsSettlement(game.ruins, game.units, battleStats, game.turn);
    
    campaignStore.completeRuinsExploration(settlement);
  }

  function handleNextFloor() {
    gameStore.nextRuinsFloor();
    addRuinsLog(`=== 进入第 ${ruinsState.currentFloor + 1} 层 ===`);
    
    setTimeout(() => {
      if (ruinsBoardRef?.refreshBoard) {
        ruinsBoardRef.refreshBoard();
      }
    }, 100);
  }

  function handleEvacuate() {
    if (confirm('确定要撤离吗？将结算本次探索奖励。')) {
      gameStore.evacuateRuins();
      handleRuinsBattleEnd('red', 'evacuation');
    }
  }

  function initRuinsGame() {
    const selectedUnits = $campaignStore.ruins.selectedUnits;
    const units = $campaignStore.unitPool.units.filter(u => selectedUnits.includes(u.uid));
    const startFloor = $campaignStore.ruins.startFloor;
    
    campaignStore.startRuinsExploration();
    gameStore.startRuinsExploration(units, startFloor);
    
    ruinsLogs = [];
    addRuinsLog(`【遗迹探索】开始！第 ${startFloor} 层`);
    addRuinsLog('目标：消灭敌人，收集宝物，到达撤离点');
    addRuinsLog('🚪 入口  📦 宝箱  ❓ 事件  ⚠️ 陷阱  🚀 撤离点');
  }

  function toggleRuinsUnit(unitUid) {
    campaignStore.toggleRuinsUnit(unitUid);
  }

  function setRuinsFloor(floor) {
    campaignStore.setRuinsStartFloor(floor);
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
      let endReason = 'elimination';
      if (captureProgress?.red?.base_blue >= 2 || captureProgress?.blue?.base_red >= 2) {
        endReason = 'capture';
      } else if (game.turn > maxTurns) {
        endReason = 'turn_limit';
      }
      handleBattleEnd(winner, captureProgress, game, endReason);
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

  function handleBattleBoardEnd(winner, endReason) {
    const game = get(gameStore);
    if (game.gameOver && !game._battleEndHandled) {
      game._battleEndHandled = true;
      const captureProgress = game.baseCaptureProgress;
      handleBattleEnd(winner, captureProgress, game, endReason);
    }
  }

  function handleBattleEnd(winner, captureProgress, game, endReason) {
    if (!game._battleEndHandled) {
      gameStore.setWinner(winner);
      game._battleEndHandled = true;
    }
    const redUnits = game.units.filter(u => u.player === 'red').length;
    const blueUnits = game.units.filter(u => u.player === 'blue').length;

    let reason = '';
    if (endReason === 'elimination') {
      reason = '，全歼敌军获胜';
    } else if (captureProgress?.red?.base_blue >= 2 || captureProgress?.blue?.base_red >= 2) {
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
      const synergies = $campaignStore.battle.activeSynergies || [];
      const classCounts = $campaignStore.battle.classCounts || {};
      campaignStore.recordBattleData(battleStats);
      campaignStore.completeBattle({
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
      campaignStore.setView('chapter_map');
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

  $: if (campaignView === 'ruins_battle' && firstInit === false) {
    if (game.mode !== 'ruins' || !game.ruins) {
      initRuinsGame();
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

        <button class="menu-btn" on:click={() => campaignStore.setView('units')}>
          <span class="btn-icon">🎖️</span>
          <span class="btn-text">
            <span class="btn-title">部队管理</span>
            <span class="btn-subtitle">查看单位 · 招募新兵</span>
          </span>
        </button>

        <button class="menu-btn" on:click={startRuinsMode}>
          <span class="btn-icon">🏛️</span>
          <span class="btn-text">
            <span class="btn-title">遗迹探索</span>
            <span class="btn-subtitle">随机地图 · 事件分支 · 宝物掉落</span>
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
        <button class="ghost-btn" on:click={() => campaignStore.save()}>💾 保存进度</button>
        <button class="ghost-btn" on:click={() => {
          if (confirm('确定要重置所有战役进度吗？此操作不可恢复！')) {
            campaignStore.resetProgress();
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
          <GameBoard onCombatLog={addLog} onBattleEnd={handleBattleBoardEnd} />
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
{:else if campaignView === 'ruins_deploy'}
  <div class="ruins-deploy">
    <div class="ruins-deploy-header">
      <button class="back-btn" on:click={() => campaignStore.exitRuinsMode()}>← 返回</button>
      <h1>🏛️ 遗迹探索 - 部队选择</h1>
      <div></div>
    </div>

    <div class="ruins-deploy-content">
      <div class="deploy-section">
        <h2>选择出战单位 ({ $campaignStore.ruins.selectedUnits.length}/{RUINS_CONFIG.maxUnits})</h2>
        <p class="deploy-hint">至少选择 {RUINS_CONFIG.minUnits} 个单位，最多 {RUINS_CONFIG.maxUnits} 个单位</p>
        
        <div class="unit-select-grid">
          {#each $campaignStore.unitPool.units as unit}
            {#if $campaignStore.progress.unlockedUnits.includes(unit.type)}
              <div 
                class="unit-select-card"
                class:selected={$campaignStore.ruins.selectedUnits.includes(unit.uid)}
                on:click={() => toggleRuinsUnit(unit.uid)}
              >
                <span class="unit-icon">{UNIT_TYPES[unit.type]?.icon || '?'}</span>
                <div class="unit-info">
                  <span class="unit-name">{unit.name}</span>
                  <div class="unit-stats">
                    <span>Lv {unit.level}</span>
                    <span>❤️ {unit.maxHp}</span>
                    <span>⚔️ {unit.attack}</span>
                    <span>🛡️ {unit.defense}</span>
                  </div>
                </div>
                {#if $campaignStore.ruins.selectedUnits.includes(unit.uid)}
                  <span class="selected-badge">✓</span>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <div class="deploy-sidebar">
        <div class="floor-select">
          <h3>选择起始楼层</h3>
          <div class="floor-buttons">
            {#each [1, 2, 3, 4, 5] as floor}
              <button 
                class="floor-btn"
                class:active={$campaignStore.ruins.startFloor === floor}
                on:click={() => setRuinsFloor(floor)}
              >
                {floor}F
              </button>
            {/each}
          </div>
          <p class="floor-desc">更高楼层敌人更强，奖励更丰厚</p>
        </div>

        <div class="ruins-legend">
          <h3>地图图例</h3>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-icon">🚪</span>
              <span>入口</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🚀</span>
              <span>撤离点</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">📦</span>
              <span>宝箱</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">❓</span>
              <span>事件</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">⚠️</span>
              <span>陷阱</span>
            </div>
          </div>
        </div>

        <button 
          class="start-ruins-btn"
          class:disabled={$campaignStore.ruins.selectedUnits.length < RUINS_CONFIG.minUnits}
          on:click={initRuinsGame}
        >
          开始探索
        </button>
      </div>
    </div>
  </div>

{:else if campaignView === 'ruins_battle'}
  <div class="game-container">
    <header class="game-header">
      <div class="ruins-header-info">
        <button class="back-btn" on:click={handleEvacuate}>← 撤离</button>
        <div class="level-info">
          <h1>🏛️ 遗迹探索 - 第 {currentFloor} 层</h1>
          <p class="level-desc">{ruinsState?.ruinsMap?.templateName || '未知遗迹'}</p>
        </div>
        <div class="ruins-stats">
          <span>💰 {currentGold}</span>
          <span>📦 {treasuresCollected.length}</span>
          <span>回合: {game.turn}</span>
        </div>
      </div>
    </header>

    <main class="game-main">
      <aside class="left-panel">
        <div class="ruins-controls">
          <h3>遗迹控制</h3>
          <button 
            class="control-btn end-turn" 
            on:click={handleRuinsEndTurn}
            disabled={game.gameOver || game.currentPlayer !== 'red'}
          >
            结束回合
          </button>
          {#if atExit}
            <button 
              class="control-btn next-floor"
              on:click={handleNextFloor}
              disabled={currentFloor >= RUINS_CONFIG.maxFloors}
            >
              {currentFloor >= RUINS_CONFIG.maxFloors ? '已到达顶层' : '前往下一层 →'}
            </button>
          {/if}
          <button class="control-btn evacuate" on:click={handleEvacuate}>
            🚀 撤离遗迹
          </button>
        </div>
        <UnitLegend />
      </aside>

      <section class="center-panel">
        <div class="board-wrapper">
          <RuinsMap 
            bind:this={ruinsBoardRef}
            onCombatLog={addRuinsLog} 
            onBattleEnd={handleRuinsBattleEnd}
            onTileEffect={handleRuinsTileEffect}
          />
        </div>
        <CombatLog logs={ruinsLogs} title="探索日志" />
      </section>

      <aside class="right-panel">
        <div class="ruins-status">
          <h3>探索进度</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {(currentFloor / RUINS_CONFIG.maxFloors) * 100}%"></div>
          </div>
          <p class="progress-text">{currentFloor} / {RUINS_CONFIG.maxFloors} 层</p>
          
          <div class="collected-treasures">
            <h4>已收集宝物</h4>
            {#if treasuresCollected.length > 0}
              <div class="treasure-list">
                {#each treasuresCollected as treasure}
                  <div class="treasure-item" title={treasure.description}>
                    <span>{treasure.icon}</span>
                    <span class="treasure-name">{treasure.name}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="empty-text">还没有收集到宝物</p>
            {/if}
          </div>
        </div>
        <div class="help-panel">
          <h3>探索指南</h3>
          <ul>
            <li>🚪 入口是你的起始位置</li>
            <li>📦 移动到宝箱上获得宝物</li>
            <li>❓ 事件点会触发随机事件</li>
            <li>⚠️ 小心隐藏的陷阱</li>
            <li>🚀 到达撤离点可选择继续或撤离</li>
            <li>消灭所有敌人也可以继续探索</li>
            <li>单位死亡将永久失去</li>
          </ul>
        </div>
      </aside>
    </main>
  </div>
{/if}

<DialogBox />
<RewardModal />
<GameRecords show={showRecords} onClose={handleCloseRecords} />
<RuinsEvent event={pendingEvent} onResolve={handleRuinsEventResolve} />
<RuinsReward treasure={showTreasureModal ? currentTreasure : null} onClose={handleTreasureClose} />
<RuinsSettlement settlement={ruinsSettlement} onClose={() => { campaignStore.exitRuinsMode(); }} />

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

  .ruins-header-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 20px;
    background: rgba(30, 20, 10, 0.8);
    border-radius: 14px;
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .ruins-header-info h1 {
    margin: 0;
    font-size: 22px;
    background: linear-gradient(135deg, #d4af37, #b8860b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ruins-stats {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    background: rgba(50, 40, 20, 0.6);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #ffd700;
  }

  .ruins-controls {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 14px;
    border: 1px solid #333;
  }

  .ruins-controls h3 {
    margin: 0 0 10px 0;
    color: #e8d5b7;
    font-size: 14px;
  }

  .control-btn {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 8px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .control-btn.end-turn {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
  }

  .control-btn.end-turn:hover:not(:disabled) {
    background: linear-gradient(135deg, #5dade2, #3498db);
    transform: translateY(-2px);
  }

  .control-btn.next-floor {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: white;
  }

  .control-btn.next-floor:hover:not(:disabled) {
    background: linear-gradient(135deg, #58d68d, #2ecc71);
    transform: translateY(-2px);
  }

  .control-btn.evacuate {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
  }

  .control-btn.evacuate:hover:not(:disabled) {
    background: linear-gradient(135deg, #ec7063, #e74c3c);
    transform: translateY(-2px);
  }

  .ruins-status {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 14px;
    border: 1px solid #333;
  }

  .ruins-status h3 {
    margin: 0 0 10px 0;
    color: #e8d5b7;
    font-size: 14px;
  }

  .ruins-status h4 {
    margin: 12px 0 8px 0;
    color: #d4af37;
    font-size: 13px;
  }

  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #d4af37, #ffd700);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    color: #888;
    font-size: 12px;
    margin: 0 0 8px 0;
  }

  .collected-treasures {
    margin-top: 12px;
  }

  .treasure-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .treasure-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(212, 175, 55, 0.1);
    border-radius: 6px;
    font-size: 12px;
    color: #d4af37;
  }

  .treasure-name {
    flex: 1;
  }

  .empty-text {
    color: #666;
    font-size: 12px;
    text-align: center;
    padding: 8px;
  }

  .ruins-deploy {
    min-height: 100vh;
    padding: 20px;
  }

  .ruins-deploy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto 24px auto;
    padding: 16px 24px;
    background: rgba(30, 20, 10, 0.8);
    border-radius: 14px;
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  .ruins-deploy-header h1 {
    margin: 0;
    font-size: 28px;
    background: linear-gradient(135deg, #d4af37, #b8860b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .ruins-deploy-content {
    display: flex;
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    align-items: flex-start;
  }

  .deploy-section {
    flex: 1;
    background: rgba(20, 20, 30, 0.6);
    border-radius: 14px;
    padding: 24px;
    border: 1px solid rgba(100, 100, 150, 0.2);
  }

  .deploy-section h2 {
    margin: 0 0 8px 0;
    color: #e8d5b7;
    font-size: 20px;
  }

  .deploy-hint {
    color: #888;
    font-size: 13px;
    margin: 0 0 20px 0;
  }

  .unit-select-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }

  .unit-select-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: rgba(40, 40, 60, 0.6);
    border: 2px solid rgba(100, 100, 150, 0.3);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .unit-select-card:hover {
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateY(-2px);
  }

  .unit-select-card.selected {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.15);
  }

  .unit-select-card .unit-icon {
    font-size: 36px;
    flex-shrink: 0;
  }

  .unit-select-card .unit-info {
    flex: 1;
  }

  .unit-select-card .unit-name {
    display: block;
    font-weight: 600;
    color: #fff;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .unit-select-card .unit-stats {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: #aaa;
  }

  .selected-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: #d4af37;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1410;
    font-weight: 700;
    font-size: 14px;
  }

  .deploy-sidebar {
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .floor-select, .ruins-legend {
    background: rgba(20, 20, 30, 0.6);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid rgba(100, 100, 150, 0.2);
  }

  .floor-select h3, .ruins-legend h3 {
    margin: 0 0 12px 0;
    color: #e8d5b7;
    font-size: 16px;
  }

  .floor-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .floor-btn {
    flex: 1;
    padding: 12px;
    background: rgba(40, 40, 60, 0.6);
    border: 2px solid rgba(100, 100, 150, 0.3);
    border-radius: 8px;
    color: #aaa;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .floor-btn:hover {
    border-color: rgba(212, 175, 55, 0.5);
    color: #d4af37;
  }

  .floor-btn.active {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.2);
    color: #ffd700;
  }

  .floor-desc {
    color: #888;
    font-size: 12px;
    margin: 0;
    text-align: center;
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #c0b0a0;
  }

  .legend-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .start-ruins-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #d4af37, #b8860b);
    border: none;
    border-radius: 12px;
    color: #1a1410;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .start-ruins-btn:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
  }

  .start-ruins-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    .campaign-header-info, .ruins-header-info {
      flex-direction: column;
      text-align: center;
    }
    .ruins-deploy-content {
      flex-direction: column;
    }
    .deploy-sidebar {
      width: 100%;
    }
  }
</style>
