<script>
  import { campaignStore } from '$lib/stores/campaignStore.js';
  import { UNIT_TYPES } from '$lib/config/units.js';
  import { UNIT_RARITY, getExpRequired, getExpToNextLevel, MAX_LEVEL } from '$lib/config/unitGrowth.js';

  $: rewards = $campaignStore.rewards;
  $: data = rewards.data;

  function handleContinue() {
    $campaignStore.dismissReward();
  }
</script>

{#if rewards.active && data}
  <div class="reward-overlay">
    <div class="reward-modal">
      <div class="reward-header">
        <div class="victory-badge">🏆</div>
        <h1 class="reward-title">战斗胜利！</h1>
        <p class="reward-subtitle">以下是本次战斗的奖励</p>
      </div>

      <div class="reward-grid">
        <div class="reward-card main">
          <div class="card-icon">💰</div>
          <div class="card-value">{data.gold}</div>
          <div class="card-label">金币</div>
        </div>
        <div class="reward-card main">
          <div class="card-icon">⭐</div>
          <div class="card-value">{data.exp}</div>
          <div class="card-label">总经验</div>
        </div>
        <div class="reward-card main">
          <div class="card-icon">🎯</div>
          <div class="card-value">{data.objectivesCompleted?.length || 0}</div>
          <div class="card-label">额外目标</div>
        </div>
      </div>

      {#if data.expByUnit?.length > 0}
        <div class="section">
          <h3 class="section-title">⚔️ 参战部队战报</h3>
          <div class="units-reward-list">
            {#each data.expByUnit as record}
              {@const unit = record.unit}
              {@const unitType = UNIT_TYPES[unit.type]}
              {@const expNeeded = unit.level < MAX_LEVEL ? getExpRequired(unit.level) : 0}
              {@const currentPct = unit.level < MAX_LEVEL ? (unit.exp / expNeeded * 100) : 100}
              {@const rarity = UNIT_RARITY[unit.rarity] || UNIT_RARITY.common}
              <div class="unit-reward-item">
                <div class="unit-portrait" style="background: #{unitType.color.toString(16).padStart(6, '0')}22">
                  <span class="portrait-type" style="color: #{unitType.color.toString(16).padStart(6, '0')}">
                    {unitType.name[0]}
                  </span>
                </div>
                <div class="unit-details">
                  <div class="unit-name-row">
                    <span class="unit-name" style="color: {rarity.color}">{unit.name}</span>
                    <span class="unit-rarity" style="background: {rarity.color}22; color: {rarity.color}">
                      {rarity.name}
                    </span>
                  </div>
                  <div class="unit-level">Lv.{unit.level}</div>
                  <div class="exp-bar-container">
                    <div class="exp-bar" style="width: {Math.min(100, currentPct)}%"></div>
                    <span class="exp-text">
                      {unit.level >= MAX_LEVEL ? '满级' : `${unit.exp}/${expNeeded}`}
                    </span>
                  </div>
                </div>
                <div class="unit-stats-gain">
                  <div class="gain-exp">+{record.exp} Exp</div>
                  {#if record.kills > 0}
                    <div class="gain-kill">💀 {record.kills} 击杀</div>
                  {/if}
                  {#if record.damage > 0}
                    <div class="gain-damage">⚡ {record.damage} 伤害</div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if data.leveledUp?.length > 0}
        <div class="section">
          <h3 class="section-title levelup">🎉 升级了！</h3>
          <div class="levelup-list">
            {#each data.leveledUp as lu}
              {@const rarity = UNIT_RARITY[lu.rarity] || UNIT_RARITY.common}
              <div class="levelup-item">
                <div class="levelup-header">
                  <span class="lu-name" style="color: {rarity.color}">{lu.name}</span>
                  <span class="lu-levels">Lv.{lu.level - lu.levelsGained} → Lv.{lu.level}</span>
                </div>
                <div class="stat-improvements">
                  <div class="stat-improve">❤️ HP: {lu.oldStats.hp} → <b>{lu.newStats.hp}</b> (+{lu.newStats.hp - lu.oldStats.hp})</div>
                  <div class="stat-improve">⚔️ 攻击: {lu.oldStats.attack} → <b>{lu.newStats.attack}</b> (+{lu.newStats.attack - lu.oldStats.attack})</div>
                  <div class="stat-improve">🛡️ 防御: {lu.oldStats.defense} → <b>{lu.newStats.defense}</b> (+{lu.newStats.defense - lu.oldStats.defense})</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if data.units?.length > 0}
        <div class="section">
          <h3 class="section-title new">🎖️ 解锁新单位！</h3>
          <div class="new-units-list">
            {#each data.units as unit}
              {@const unitType = UNIT_TYPES[unit.type]}
              {@const rarity = UNIT_RARITY[unit.rarity] || UNIT_RARITY.common}
              <div class="new-unit-card" style="border-color: {rarity.color}">
                <div class="nu-rarity-banner" style="background: {rarity.color}">{rarity.name}</div>
                <div class="nu-portrait" style="background: #{unitType.color.toString(16).padStart(6, '0')}33">
                  <span style="font-size: 48px; color: #{unitType.color.toString(16).padStart(6, '0')}">
                    {unitType.name[0]}
                  </span>
                </div>
                <div class="nu-name" style="color: {rarity.color}">{unit.name}</div>
                <div class="nu-type">{unitType.name}</div>
                <div class="nu-stats">
                  <div><span>❤️</span>{unit.maxHp}</div>
                  <div><span>⚔️</span>{unit.attack}</div>
                  <div><span>🛡️</span>{unit.defense}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="reward-footer">
        <button class="continue-btn" on:click={handleContinue}>
          继续 →
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .reward-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 900;
    padding: 20px;
    overflow-y: auto;
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .reward-modal {
    width: 100%;
    max-width: 720px;
    background: linear-gradient(180deg, rgba(30, 30, 55, 0.98), rgba(20, 20, 40, 0.98));
    border: 2px solid rgba(255, 204, 0, 0.5);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(255, 204, 0, 0.15);
    animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes popIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .reward-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .victory-badge {
    font-size: 64px;
    margin-bottom: 8px;
    animation: bounce 1s ease infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .reward-title {
    font-size: 36px;
    margin: 0 0 6px 0;
    background: linear-gradient(135deg, #ffcc00, #ff8800, #ffcc00);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s ease infinite;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .reward-subtitle {
    color: #888;
    margin: 0;
    font-size: 15px;
  }

  .reward-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .reward-card {
    background: rgba(50, 50, 80, 0.5);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
    transition: all 0.3s;
  }

  .reward-card.main {
    background: linear-gradient(180deg, rgba(80, 70, 30, 0.5), rgba(50, 40, 10, 0.5));
    border-color: rgba(255, 204, 0, 0.3);
  }

  .reward-card:hover {
    transform: translateY(-2px);
  }

  .card-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 28px;
    font-weight: 800;
    color: #ffcc00;
    margin-bottom: 4px;
  }

  .card-label {
    font-size: 13px;
    color: #aaa;
  }

  .section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 14px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(100, 100, 150, 0.2);
    color: #ddd;
  }

  .section-title.levelup {
    color: #88ff88;
    border-color: rgba(100, 255, 100, 0.3);
  }

  .section-title.new {
    color: #88ccff;
    border-color: rgba(100, 150, 255, 0.3);
  }

  .units-reward-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .unit-reward-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    background: rgba(40, 40, 70, 0.5);
    border: 1px solid rgba(100, 100, 150, 0.2);
    border-radius: 12px;
  }

  .unit-portrait {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .portrait-type {
    font-size: 28px;
    font-weight: 800;
  }

  .unit-details {
    flex: 1;
    min-width: 0;
  }

  .unit-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }

  .unit-name {
    font-weight: 700;
    font-size: 15px;
  }

  .unit-rarity {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .unit-level {
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .exp-bar-container {
    position: relative;
    height: 16px;
    background: rgba(30, 30, 50, 0.8);
    border-radius: 8px;
    overflow: hidden;
  }

  .exp-bar {
    height: 100%;
    background: linear-gradient(90deg, #66ff66, #44cc44);
    border-radius: 8px;
    transition: width 0.5s ease;
  }

  .exp-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .unit-stats-gain {
    text-align: right;
    flex-shrink: 0;
  }

  .gain-exp {
    font-weight: 700;
    color: #88ff88;
    font-size: 14px;
  }

  .gain-kill, .gain-damage {
    font-size: 11px;
    color: #aaa;
    margin-top: 2px;
  }

  .levelup-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .levelup-item {
    padding: 16px;
    background: linear-gradient(135deg, rgba(50, 100, 50, 0.4), rgba(30, 70, 30, 0.4));
    border: 1px solid rgba(100, 255, 100, 0.3);
    border-radius: 12px;
  }

  .levelup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .lu-name {
    font-size: 17px;
    font-weight: 800;
  }

  .lu-levels {
    padding: 4px 12px;
    background: rgba(100, 255, 100, 0.2);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #88ff88;
  }

  .stat-improvements {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 13px;
    color: #bbb;
  }

  .stat-improve b {
    color: #88ff88;
  }

  .new-units-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
  }

  .new-unit-card {
    position: relative;
    background: rgba(40, 40, 70, 0.6);
    border: 2px solid;
    border-radius: 16px;
    padding: 14px 12px 12px;
    text-align: center;
    overflow: hidden;
    animation: glow 2s ease infinite;
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 10px currentColor; }
    50% { box-shadow: 0 0 24px currentColor; }
  }

  .nu-rarity-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 3px 0;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }

  .nu-portrait {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    margin: 18px auto 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nu-name {
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 2px;
  }

  .nu-type {
    font-size: 12px;
    color: #888;
    margin-bottom: 10px;
  }

  .nu-stats {
    display: flex;
    justify-content: center;
    gap: 12px;
    font-size: 12px;
    color: #bbb;
  }

  .nu-stats > div {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .reward-footer {
    text-align: center;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(100, 100, 150, 0.2);
  }

  .continue-btn {
    padding: 14px 48px;
    font-size: 17px;
    font-weight: 700;
    background: linear-gradient(135deg, #cc9900, #aa7700);
    border: 1px solid rgba(255, 204, 0, 0.6);
    border-radius: 12px;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 6px 20px rgba(204, 153, 0, 0.4);
  }

  .continue-btn:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #ddaa00, #bb8800);
    box-shadow: 0 8px 28px rgba(204, 153, 0, 0.5);
  }
</style>
