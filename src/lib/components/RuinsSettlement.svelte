<script>
  import { campaignStore } from '$lib/stores/campaignStore.js';
  import { UNIT_TYPES } from '$lib/config/units.js';

  export let settlement;
  export let onClose;

  function handleReturn() {
    if (onClose) {
      onClose();
    }
    campaignStore.exitRuinsMode();
  }
</script>

{#if settlement}
  <div class="settlement-overlay">
    <div class="settlement-modal">
      <div class="settlement-header">
        <div class="result-badge" class:success={settlement.success}>
          {settlement.success ? '🏆 探索成功' : '📦 探索结束'}
        </div>
        <h1 class="settlement-title">遗迹探索结算</h1>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">🏛️</span>
          <span class="stat-value">{settlement.floorsCleared}</span>
          <span class="stat-label">探索层数</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <span class="stat-value">{settlement.survivedUnits}/{settlement.totalUnits}</span>
          <span class="stat-label">存活单位</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⚔️</span>
          <span class="stat-value">{settlement.killedEnemies}</span>
          <span class="stat-label">击杀敌人</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <span class="stat-value">{settlement.treasuresCollected}</span>
          <span class="stat-label">收集宝物</span>
        </div>
      </div>

      <div class="rewards-section">
        <h2 class="section-title">💰 获得奖励</h2>
        <div class="reward-details">
          <div class="reward-item">
            <span class="reward-name">楼层奖励</span>
            <span class="reward-value">+{settlement.gold.floor}</span>
          </div>
          <div class="reward-item">
            <span class="reward-name">生存奖励</span>
            <span class="reward-value">+{settlement.gold.survival}</span>
          </div>
          <div class="reward-item">
            <span class="reward-name">击杀奖励</span>
            <span class="reward-value">+{settlement.gold.kills}</span>
          </div>
          <div class="reward-item">
            <span class="reward-name">宝物奖励</span>
            <span class="reward-value">+{settlement.gold.treasures}</span>
          </div>
          <div class="reward-item">
            <span class="reward-name">携带金币</span>
            <span class="reward-value">+{settlement.gold.carried}</span>
          </div>
          <div class="reward-total">
            <span class="reward-name">总计金币</span>
            <span class="reward-value gold">+{settlement.gold.total}</span>
          </div>
          <div class="reward-item">
            <span class="reward-name">总计经验</span>
            <span class="reward-value exp">+{settlement.exp}</span>
          </div>
        </div>
      </div>

      {#if settlement.leveledUp?.length > 0}
        <div class="levelup-section">
          <h2 class="section-title">⬆️ 单位升级</h2>
          <div class="levelup-list">
            {#each settlement.leveledUp as unit}
              <div class="levelup-item">
                <span class="unit-icon">{UNIT_TYPES[unit.type]?.icon || '?'}</span>
                <div class="unit-info">
                  <span class="unit-name">{unit.name}</span>
                  <span class="level-text">Lv {unit.level - unit.levelsGained} → Lv {unit.level}</span>
                </div>
                <div class="stat-gains">
                  <span class="gain hp">❤️ +{unit.newStats.hp - unit.oldStats.hp}</span>
                  <span class="gain atk">⚔️ +{unit.newStats.attack - unit.oldStats.attack}</span>
                  <span class="gain def">🛡️ +{unit.newStats.defense - unit.oldStats.defense}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="survivors-section">
        <h2 class="section-title">🎖️ 存活单位</h2>
        <div class="survivors-list">
          {#each settlement.units as unit}
            <div class="survivor-card">
              <span class="unit-icon">{UNIT_TYPES[unit.type]?.icon || '?'}</span>
              <div class="unit-details">
                <span class="unit-name">{UNIT_TYPES[unit.type]?.name || unit.type}</span>
                <div class="unit-stats">
                  <span>Lv {unit.level || 1}</span>
                  <span>❤️ {unit.hp}/{unit.maxHp}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <button class="return-btn" on:click={handleReturn}>
        返回主菜单
      </button>
    </div>
  </div>
{/if}

<style>
  .settlement-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settlement-modal {
    background: linear-gradient(135deg, #2a1f1a 0%, #1a1410 100%);
    border: 2px solid #8b6914;
    border-radius: 16px;
    padding: 32px;
    max-width: 700px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settlement-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .result-badge {
    display: inline-block;
    padding: 8px 24px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
  }

  .result-badge.success {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
  }

  .settlement-title {
    margin: 0;
    font-size: 32px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .stat-icon {
    font-size: 28px;
    display: block;
    margin-bottom: 8px;
  }

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #ffd700;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #888;
  }

  .section-title {
    margin: 0 0 16px 0;
    font-size: 20px;
    color: #e8d5b7;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
  }

  .rewards-section, .levelup-section, .survivors-section {
    margin-bottom: 24px;
  }

  .reward-details {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
    padding: 16px;
  }

  .reward-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    color: #c0b0a0;
  }

  .reward-total {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    margin-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 700;
    color: #fff;
  }

  .reward-value.gold {
    color: #ffd700;
    font-size: 18px;
  }

  .reward-value.exp {
    color: #9b59b6;
    font-size: 18px;
  }

  .levelup-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .levelup-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid rgba(46, 204, 113, 0.3);
    border-radius: 10px;
    padding: 12px 16px;
  }

  .unit-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .unit-info {
    flex: 1;
  }

  .unit-name {
    display: block;
    font-weight: 600;
    color: #fff;
  }

  .level-text {
    font-size: 13px;
    color: #2ecc71;
  }

  .stat-gains {
    display: flex;
    gap: 12px;
  }

  .gain {
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    font-size: 12px;
  }

  .gain.hp { color: #e74c3c; }
  .gain.atk { color: #f39c12; }
  .gain.def { color: #3498db; }

  .survivors-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .survivor-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px;
  }

  .unit-details {
    flex: 1;
  }

  .unit-details .unit-name {
    font-size: 14px;
  }

  .unit-stats {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #888;
    margin-top: 4px;
  }

  .return-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #d4af37, #b8941f);
    border: none;
    border-radius: 10px;
    color: #1a1410;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 20px;
  }

  .return-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
  }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .settlement-modal {
      padding: 20px;
    }
  }
</style>
