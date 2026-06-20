<script>
  import { CHAPTERS } from '$lib/config/chapters.js';
  import { campaignStore, chapterProgress, levelStatusMap } from '$lib/stores/campaignStore.js';
  import { UNIT_RARITY } from '$lib/config/unitGrowth.js';

  $: progress = $chapterProgress;
  $: statusMap = $levelStatusMap;
  $: currentChapter = CHAPTERS.find(c => c.id === $campaignStore.selectedChapterId);

  function selectChapter(chapterId) {
    $campaignStore.selectChapter(chapterId);
  }

  function selectLevel(levelId) {
    $campaignStore.selectLevel(levelId);
  }

  function backToMenu() {
    $campaignStore.setView('menu');
  }

  function goToUnits() {
    $campaignStore.setView('units');
  }
</script>

<div class="chapter-map">
  <div class="top-bar">
    <button class="back-btn" on:click={backToMenu}>← 返回主菜单</button>
    <div class="stats">
      <span class="stat">💰 {$campaignStore.progress.gold}</span>
      <span class="stat">⭐ {$campaignStore.progress.totalExp}</span>
      <span class="stat">🏆 {$campaignStore.progress.victories}/{$campaignStore.progress.battleCount}</span>
    </div>
    <button class="units-btn" on:click={goToUnits}>🎖️ 部队管理</button>
  </div>

  <div class="chapter-tabs">
    {#each CHAPTERS as chapter}
      <button
        class={`chapter-tab ${chapter.id === $campaignStore.selectedChapterId ? 'active' : ''} ${!progress[chapter.id]?.isUnlocked ? 'locked' : ''}`}
        on:click={() => selectChapter(chapter.id)}
        disabled={!progress[chapter.id]?.isUnlocked}
      >
        <span class="chapter-icon">{chapter.icon}</span>
        <span class="chapter-title">{chapter.title}</span>
        {#if !progress[chapter.id]?.isUnlocked}
          <span class="lock-icon">🔒</span>
        {:else}
          <span class="progress-pill">{progress[chapter.id]?.completed}/{progress[chapter.id]?.total}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if currentChapter}
    <div class="chapter-content">
      <div class="chapter-header">
        <h1 class="chapter-title-large">{currentChapter.icon} {currentChapter.title}</h1>
        <p class="chapter-subtitle">{currentChapter.subtitle}</p>
        <p class="chapter-description">{currentChapter.description}</p>
        <div class="chapter-progress-bar">
          <div class="progress-fill" style="width: {progress[currentChapter.id]?.percentage || 0}%"></div>
          <span class="progress-text">{progress[currentChapter.id]?.percentage || 0}%</span>
        </div>
      </div>

      <div class="levels-map">
        <svg class="connections-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
          {#each currentChapter.levels as level, i}
            {#if i < currentChapter.levels.length - 1}
              <line
                x1={level.mapX}
                y1={level.mapY}
                x2={currentChapter.levels[i + 1].mapX}
                y2={currentChapter.levels[i + 1].mapY}
                stroke={statusMap[level.id]?.completed ? '#ffcc00' : '#444'}
                stroke-width="0.5"
                stroke-dasharray={statusMap[level.id]?.completed ? 'none' : '1,1'}
              />
            {/if}
          {/each}
        </svg>

        {#each currentChapter.levels as level}
          {@const status = statusMap[level.id]}
          <div
            class={`level-node ${status?.completed ? 'completed' : ''} ${!status?.unlocked ? 'locked' : ''}`}
            style="left: {level.mapX}%; top: {level.mapY}%"
            on:click={() => status?.unlocked && selectLevel(level.id)}
          >
            <div class="level-node-inner">
              {#if status?.completed}
                <span class="node-icon">✓</span>
              {:else if !status?.unlocked}
                <span class="node-icon">🔒</span>
              {:else}
                <span class="node-icon">{level.difficulty}</span>
              {/if}
            </div>
            <div class="level-tooltip">
              <h4>{level.title}</h4>
              <p class="tooltip-desc">{level.description}</p>
              <div class="tooltip-stats">
                <span>难度: {'⭐'.repeat(level.difficulty)}</span>
                <span>回合上限: {level.maxTurns}</span>
              </div>
              <div class="tooltip-rewards">
                <span>💰 {level.rewards.gold}</span>
                <span>⭐ {level.rewards.exp}</span>
                {#if level.rewards.unlockUnits?.length}
                  <span>🎖️ 解锁新单位</span>
                {/if}
              </div>
              {#if !status?.unlocked && level.prerequisites?.length}
                <p class="locked-hint">需先完成前置关卡</p>
              {/if}
            </div>
            <div class="level-label">{level.title}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .chapter-map {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    color: #e0e0e0;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: rgba(20, 20, 30, 0.9);
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid rgba(100, 100, 150, 0.3);
  }

  .back-btn, .units-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #4a4a6a, #3a3a5a);
    border: 1px solid rgba(150, 150, 200, 0.3);
    border-radius: 8px;
    color: #e0e0e0;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover, .units-btn:hover {
    background: linear-gradient(135deg, #5a5a7a, #4a4a6a);
    transform: translateY(-1px);
  }

  .stats {
    display: flex;
    gap: 24px;
  }

  .stat {
    font-size: 16px;
    font-weight: 600;
    padding: 6px 14px;
    background: rgba(60, 60, 90, 0.5);
    border-radius: 20px;
  }

  .chapter-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .chapter-tab {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: rgba(30, 30, 50, 0.8);
    border: 2px solid rgba(100, 100, 150, 0.3);
    border-radius: 12px;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .chapter-tab:hover:not(:disabled) {
    border-color: rgba(200, 180, 100, 0.6);
    background: rgba(50, 50, 80, 0.8);
  }

  .chapter-tab.active {
    border-color: #ffcc00;
    background: rgba(60, 55, 20, 0.6);
    box-shadow: 0 0 20px rgba(255, 204, 0, 0.2);
  }

  .chapter-tab.locked, .chapter-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chapter-icon {
    font-size: 28px;
  }

  .chapter-title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    text-align: left;
  }

  .lock-icon {
    font-size: 18px;
  }

  .progress-pill {
    padding: 4px 12px;
    background: rgba(255, 204, 0, 0.2);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #ffcc00;
  }

  .chapter-content {
    background: rgba(20, 20, 35, 0.85);
    border-radius: 16px;
    padding: 28px;
    border: 1px solid rgba(100, 100, 150, 0.25);
  }

  .chapter-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .chapter-title-large {
    font-size: 32px;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #ffcc00, #ffaa00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chapter-subtitle {
    font-size: 18px;
    color: #aaa;
    margin: 0 0 12px 0;
    letter-spacing: 2px;
  }

  .chapter-description {
    font-size: 15px;
    color: #bbb;
    max-width: 600px;
    margin: 0 auto 20px;
    line-height: 1.6;
  }

  .chapter-progress-bar {
    width: 300px;
    height: 24px;
    background: rgba(50, 50, 80, 0.6);
    border-radius: 12px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffcc00, #ff8800);
    border-radius: 12px;
    transition: width 0.5s ease;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .levels-map {
    position: relative;
    width: 100%;
    height: 420px;
    background:
      radial-gradient(circle at 20% 30%, rgba(100, 80, 40, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(40, 80, 100, 0.15) 0%, transparent 50%),
      linear-gradient(135deg, rgba(30, 30, 50, 0.6), rgba(20, 20, 40, 0.8));
    border-radius: 16px;
    border: 1px solid rgba(100, 100, 150, 0.2);
    overflow: hidden;
  }

  .connections-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .level-node {
    position: absolute;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 10;
  }

  .level-node.locked {
    cursor: not-allowed;
  }

  .level-node-inner {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4a4a7a, #3a3a5a);
    border: 3px solid rgba(150, 150, 200, 0.4);
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  }

  .level-node:not(.locked):hover .level-node-inner {
    transform: scale(1.15);
    border-color: #ffcc00;
    box-shadow: 0 0 24px rgba(255, 204, 0, 0.5);
  }

  .level-node.completed .level-node-inner {
    background: linear-gradient(135deg, #4a7a4a, #3a5a3a);
    border-color: #66cc66;
  }

  .level-node.locked .level-node-inner {
    background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
    border-color: rgba(100, 100, 100, 0.3);
    opacity: 0.6;
  }

  .node-icon {
    font-size: 22px;
    font-weight: 700;
  }

  .level-node.completed .node-icon {
    color: #66ff66;
  }

  .level-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 6px;
  }

  .level-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 240px;
    padding: 14px;
    background: rgba(15, 15, 25, 0.98);
    border: 1px solid rgba(255, 204, 0, 0.3);
    border-radius: 10px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    pointer-events: none;
    margin-bottom: 16px;
    z-index: 100;
  }

  .level-node:not(.locked):hover .level-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .level-tooltip h4 {
    margin: 0 0 8px 0;
    color: #ffcc00;
    font-size: 15px;
  }

  .tooltip-desc {
    font-size: 13px;
    color: #bbb;
    margin: 0 0 10px 0;
    line-height: 1.4;
  }

  .tooltip-stats, .tooltip-rewards {
    display: flex;
    gap: 12px;
    font-size: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .tooltip-rewards {
    padding-top: 8px;
    border-top: 1px solid rgba(100, 100, 150, 0.3);
    color: #ffcc00;
  }

  .locked-hint {
    margin: 8px 0 0 0;
    padding: 6px;
    background: rgba(200, 50, 50, 0.2);
    border-radius: 4px;
    font-size: 12px;
    color: #ff8888;
    text-align: center;
  }
</style>
