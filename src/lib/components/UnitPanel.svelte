<script>
  import { campaignStore, availableUnits, currentLevel } from '$lib/stores/campaignStore.js';
  import { UNIT_TYPES } from '$lib/config/units.js';
  import { UNIT_RARITY, getExpRequired, MAX_LEVEL, calculateStatGrowth } from '$lib/config/unitGrowth.js';
  import { getLevelById } from '$lib/config/chapters.js';

  export let mode = 'manage';

  $: level = $currentLevel;
  $: units = $availableUnits;
  $: maxDeploy = level?.playerUnits?.length || 8;

  let selectedUids = new Set();

  $: if (level?.playerUnits) {
    const needed = level.playerUnits.length;
    if (selectedUids.size === 0) {
      const preset = units.slice(0, Math.min(needed, units.length));
      selectedUids = new Set(preset.map(u => u.uid));
    }
  }

  function toggleSelect(uid) {
    if (mode !== 'deploy') return;
    const next = new Set(selectedUids);
    if (next.has(uid)) {
      next.delete(uid);
    } else if (next.size < maxDeploy) {
      next.add(uid);
    } else {
      return;
    }
    selectedUids = next;
  }

  function autoSelect() {
    if (!level) return;
    const needed = level.playerUnits.length;
    const sorted = [...units].sort((a, b) => {
      const ra = UNIT_RARITY[a.rarity]?.bonus || 1;
      const rb = UNIT_RARITY[b.rarity]?.bonus || 1;
      return (b.level * rb) - (a.level * ra);
    });
    selectedUids = new Set(sorted.slice(0, Math.min(needed, sorted.length)).map(u => u.uid));
  }

  function startBattle() {
    if (!level) return;
    const selectedUnits = Array.from(selectedUids).map(uid =>
      units.find(u => u.uid === uid)
    ).filter(Boolean);

    const deployed = level.playerUnits.map((slot, idx) => {
      const poolUnit = selectedUnits[idx];
      if (!poolUnit) return null;
      return {
        ...slot,
        player: 'red',
        type: poolUnit.type,
        poolUid: poolUnit.uid,
        level: poolUnit.level,
        rarity: poolUnit.rarity,
        hp: poolUnit.maxHp,
        maxHp: poolUnit.maxHp,
        attack: poolUnit.attack,
        defense: poolUnit.defense,
        moveRange: poolUnit.moveRange,
        attackRange: poolUnit.attackRange
      };
    }).filter(Boolean);

    const fullArmy = [
      ...deployed,
      ...level.enemyUnits
    ];

    $campaignStore.deployUnits(fullArmy);
  }

  function backToMap() {
    $campaignStore.setView('chapter_map');
  }

  function backToMenu() {
    $campaignStore.setView('menu');
  }

  function addRandomUnit() {
    const unlocked = $campaignStore.progress.unlockedUnits;
    const type = unlocked[Math.floor(Math.random() * unlocked.length)];
    $campaignStore.addNewUnit(type);
  }

  function formatColor(num) {
    return '#' + num.toString(16).padStart(6, '0');
  }
</script>

<div class="unit-panel">
  <div class="panel-header">
    <button class="back-btn" on:click={mode === 'deploy' ? backToMap : backToMenu}>← 返回</button>
    <h2 class="panel-title">
      {#if mode === 'deploy'}
        ⚙️ 部署部队 - {level?.title}
      {:else}
        🎖️ 部队管理
      {/if}
    </h2>
    {#if mode === 'deploy'}
      <button class="primary-btn" on:click={startBattle} disabled={selectedUids.size === 0}>
        开始战斗 →
      </button>
    {:else}
      <button class="primary-btn" on:click={addRandomUnit}>
        🎲 招募新兵
      </button>
    {/if}
  </div>

  {#if mode === 'deploy'}
    <div class="deploy-info">
      <div class="info-row">
        <span>📋 任务: {level?.description}</span>
      </div>
      <div class="info-row stats">
        <span>⏱️ 回合上限: {level?.maxTurns}</span>
        <span>⭐ 难度: {'⭐'.repeat(level?.difficulty || 1)}</span>
        <span>💰 奖励: {level?.rewards?.gold}</span>
      </div>
      <div class="info-row selection">
        <span>已选: <b style="color: {selectedUids.size >= maxDeploy ? '#66ff66' : '#ffcc00'}">{selectedUids.size}</b> / {maxDeploy}</span>
        <button class="auto-btn" on:click={autoSelect}>一键最优配置</button>
      </div>
    </div>
  {/if}

  {#if units.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>暂无部队</h3>
      <p>{mode === 'deploy' ? '你目前还没有可用的部队！' : '通过战斗和招募获取更多单位'}</p>
      {#if mode === 'manage'}
        <button class="primary-btn" on:click={addRandomUnit}>招募第一个单位</button>
      {/if}
    </div>
  {:else}
    <div class="units-grid">
      {#each units as unit}
        {@const unitType = UNIT_TYPES[unit.type]}
        {@const rarity = UNIT_RARITY[unit.rarity] || UNIT_RARITY.common}
        {@const expNeeded = unit.level < MAX_LEVEL ? getExpRequired(unit.level) : 0}
        {@const pct = unit.level >= MAX_LEVEL ? 100 : (unit.exp / expNeeded * 100)}
        {@const isSelected = selectedUids.has(unit.uid)}
        <div
          class={`unit-card ${isSelected ? 'selected' : ''} ${mode === 'deploy' ? 'selectable' : ''}`}
          style="--rarity-color: {rarity.color}"
          on:click={() => toggleSelect(unit.uid)}
        >
          {#if mode === 'deploy'}
            <div class="select-indicator">
              {#if isSelected}
                <span class="check">✓</span>
                <span class="order">#{Array.from(selectedUids).indexOf(unit.uid) + 1}</span>
              {/if}
            </div>
          {/if}

          <div class="card-top">
            <div class="unit-portrait" style="background: {formatColor(unitType.color)}22">
              <span style="color: {formatColor(unitType.color)}; font-size: 32px; font-weight: 800;">
                {unitType.name[0]}
              </span>
            </div>
            <div class="unit-title">
              <div class="unit-name" style="color: {rarity.color}">{unit.name}</div>
              <div class="unit-type">{unitType.name}</div>
            </div>
            <div class="unit-level" title={`稀有度: ${rarity.name}`}>
              Lv.{unit.level}
              <span class="rarity-dot" style="background: {rarity.color}"></span>
            </div>
          </div>

          <div class="card-stats">
            <div class="stat"><span>❤️</span><b>{unit.maxHp}</b></div>
            <div class="stat"><span>⚔️</span><b>{unit.attack}</b></div>
            <div class="stat"><span>🛡️</span><b>{unit.defense}</b></div>
            <div class="stat"><span>👟</span><b>{unit.moveRange}</b></div>
            <div class="stat"><span>🎯</span><b>{unit.attackRange}</b></div>
          </div>

          <div class="card-exp">
            <div class="exp-label">
              <span>经验</span>
              <span>{unit.level >= MAX_LEVEL ? '满级' : `${unit.exp}/${expNeeded}`}</span>
            </div>
            <div class="exp-track">
              <div class="exp-fill" style="width: {Math.min(100, pct)}%"></div>
            </div>
          </div>

          <div class="card-footer">
            <span class="rarity-tag" style="background: {rarity.color}22; color: {rarity.color}">
              {rarity.name}
            </span>
            <span class="bonus-tag">属性 x{rarity.bonus.toFixed(2)}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .unit-panel {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    color: #e0e0e0;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: rgba(20, 20, 35, 0.9);
    border-radius: 14px;
    margin-bottom: 18px;
    border: 1px solid rgba(100, 100, 150, 0.3);
  }

  .back-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #4a4a6a, #3a3a5a);
    border: 1px solid rgba(150, 150, 200, 0.3);
    border-radius: 8px;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: linear-gradient(135deg, #5a5a7a, #4a4a6a);
    transform: translateY(-1px);
  }

  .panel-title {
    margin: 0;
    font-size: 22px;
    background: linear-gradient(135deg, #ffcc00, #ff9900);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .primary-btn {
    padding: 12px 28px;
    background: linear-gradient(135deg, #cc9900, #aa7700);
    border: 1px solid rgba(255, 204, 0, 0.6);
    border-radius: 10px;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(204, 153, 0, 0.35);
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #ddaa00, #bb8800);
    box-shadow: 0 6px 20px rgba(204, 153, 0, 0.5);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .deploy-info {
    background: rgba(30, 30, 55, 0.8);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 18px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
  }

  .info-row.stats {
    gap: 24px;
    justify-content: flex-start;
    color: #bbb;
    font-size: 14px;
    border-top: 1px solid rgba(100, 100, 150, 0.15);
    border-bottom: 1px solid rgba(100, 100, 150, 0.15);
    margin: 8px 0;
    padding: 10px 0;
  }

  .info-row.selection {
    font-size: 15px;
    padding-top: 6px;
  }

  .auto-btn {
    padding: 8px 16px;
    background: rgba(60, 60, 100, 0.6);
    border: 1px solid rgba(100, 150, 255, 0.4);
    border-radius: 8px;
    color: #aaccff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .auto-btn:hover {
    background: rgba(80, 80, 140, 0.7);
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    background: rgba(20, 20, 35, 0.7);
    border: 1px dashed rgba(100, 100, 150, 0.3);
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .empty-state h3 {
    margin: 0 0 8px 0;
    color: #aaa;
  }

  .empty-state p {
    color: #777;
    margin: 0 0 24px 0;
  }

  .units-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .unit-card {
    position: relative;
    background: linear-gradient(180deg, rgba(40, 40, 65, 0.9), rgba(25, 25, 45, 0.9));
    border: 2px solid rgba(100, 100, 150, 0.3);
    border-radius: 16px;
    padding: 16px;
    transition: all 0.25s;
  }

  .unit-card.selectable {
    cursor: pointer;
  }

  .unit-card.selectable:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 204, 0, 0.5);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .unit-card.selected {
    border-color: var(--rarity-color);
    box-shadow: 0 0 0 2px var(--rarity-color), 0 8px 24px rgba(0, 0, 0, 0.4);
    background: linear-gradient(180deg, rgba(60, 55, 30, 0.7), rgba(40, 35, 20, 0.8));
  }

  .select-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unit-card.selected .select-indicator {
    background: var(--rarity-color);
  }

  .check {
    color: #fff;
    font-size: 16px;
    font-weight: 800;
  }

  .order {
    color: #fff;
    font-size: 13px;
    font-weight: 800;
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .unit-portrait {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .unit-title {
    flex: 1;
    min-width: 0;
  }

  .unit-name {
    font-weight: 800;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unit-type {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }

  .unit-level {
    padding: 4px 10px;
    background: rgba(50, 50, 80, 0.8);
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .rarity-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .card-stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    padding: 10px;
    background: rgba(20, 20, 35, 0.5);
    border-radius: 10px;
    margin-bottom: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    color: #888;
  }

  .stat b {
    color: #e0e0e0;
    font-size: 15px;
  }

  .card-exp {
    margin-bottom: 12px;
  }

  .exp-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #888;
    margin-bottom: 5px;
  }

  .exp-track {
    height: 8px;
    background: rgba(20, 20, 35, 0.8);
    border-radius: 4px;
    overflow: hidden;
  }

  .exp-fill {
    height: 100%;
    background: linear-gradient(90deg, #66ff66, #44cc44);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid rgba(100, 100, 150, 0.15);
  }

  .rarity-tag {
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
  }

  .bonus-tag {
    font-size: 11px;
    color: #888;
  }
</style>
