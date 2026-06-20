<script>
  import { campaignStore, availableUnits, currentLevel, rosterSynergy, shopOffers } from '$lib/stores/campaignStore.js';
  import { UNIT_TYPES, UNIT_CLASSES } from '$lib/config/units.js';
  import { UNIT_RARITY, getExpRequired, MAX_LEVEL, calculateStatGrowth } from '$lib/config/unitGrowth.js';
  import { RECRUIT_RULES, CLASS_SYNERGY } from '$lib/config/gameRules.js';
  import { getLevelById } from '$lib/config/chapters.js';

  export let mode = 'manage';

  let activeTab = 'roster';

  $: level = $currentLevel;
  $: units = $availableUnits;
  $: synergy = $rosterSynergy;
  $: offers = $shopOffers;
  $: gold = $campaignStore.progress.gold;
  $: maxDeploy = level?.playerUnits?.length || 8;
  $: rosterSize = units.length;

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

  function refreshShop() {
    $campaignStore.refreshShop();
  }

  function recruitUnit(offerId) {
    $campaignStore.recruitUnit(offerId);
  }

  function dismissUnit(uid) {
    if (confirm('确定要解散这个单位吗？将返还部分金币。')) {
      $campaignStore.dismissUnit(uid);
    }
  }

  function formatColor(num) {
    return '#' + num.toString(16).padStart(6, '0');
  }

  function getClassName(cls) {
    return UNIT_CLASSES[cls]?.name || cls;
  }

  function getClassIcon(cls) {
    return UNIT_CLASSES[cls]?.icon || '⚔️';
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
    {:else if mode === 'manage'}
      <div class="header-gold">💰 {gold} 金币</div>
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

      {#if synergy.synergies.length > 0}
        <div class="synergy-bar">
          <span class="synergy-label">🌟 已激活协同:</span>
          {#each synergy.synergies as s}
            <span class="synergy-tag active" title={s.description}>{s.name}</span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if mode === 'manage'}
    <div class="tabs">
      <button class="tab-btn {activeTab === 'roster' ? 'active' : ''}" on:click={() => activeTab = 'roster'}>
        部队名册 ({rosterSize}/{RECRUIT_RULES.maxRosterSize})
      </button>
      <button class="tab-btn {activeTab === 'shop' ? 'active' : ''}" on:click={() => activeTab = 'shop'}>
        🏪 招募商店
      </button>
      <button class="tab-btn {activeTab === 'synergy' ? 'active' : ''}" on:click={() => activeTab = 'synergy'}>
        ⚡ 职业搭配
      </button>
    </div>
  {/if}

  {#if mode === 'manage' && activeTab === 'shop'}
    <div class="shop-panel">
      <div class="shop-header">
        <div class="shop-info">
          <span>💰 当前金币: <b class="gold-text">{gold}</b></span>
          <span>🔄 刷新费用: <b>{RECRUIT_RULES.refreshCost}</b> 金币</span>
        </div>
        <button class="refresh-btn" on:click={refreshShop} disabled={gold < RECRUIT_RULES.refreshCost}>
          🔄 刷新商店
        </button>
      </div>

      {#if offers.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <h3>商店暂无商品</h3>
          <p>点击刷新按钮获取新的招募机会</p>
        </div>
      {:else}
        <div class="units-grid">
          {#each offers as offer}
            {@const unitType = UNIT_TYPES[offer.type]}
            {@const rarity = UNIT_RARITY[offer.rarity] || UNIT_RARITY.common}
            {@const canAfford = gold >= offer.cost}
            {@const rosterFull = rosterSize >= RECRUIT_RULES.maxRosterSize}
            <div class="unit-card shop-card" style="--rarity-color: {rarity.color}">
              <div class="cost-badge" class:affordable={canAfford}>
                💰 {offer.cost}
              </div>

              <div class="card-top">
                <div class="unit-portrait" style="background: {formatColor(unitType.color)}22">
                  <span style="color: {formatColor(unitType.color)}; font-size: 32px; font-weight: 800;">
                    {unitType.name[0]}
                  </span>
                </div>
                <div class="unit-title">
                  <div class="unit-name" style="color: {rarity.color}">{offer.name}</div>
                  <div class="unit-type">{getClassIcon(unitType.unitClass)} {unitType.name}</div>
                </div>
                <div class="unit-level" title={`稀有度: ${rarity.name}`}>
                  Lv.{offer.level}
                  <span class="rarity-dot" style="background: {rarity.color}"></span>
                </div>
              </div>

              <div class="card-stats">
                <div class="stat"><span>❤️</span><b>{offer.maxHp}</b></div>
                <div class="stat"><span>⚔️</span><b>{offer.attack}</b></div>
                <div class="stat"><span>🛡️</span><b>{offer.defense}</b></div>
                <div class="stat"><span>👟</span><b>{offer.moveRange}</b></div>
                <div class="stat"><span>🎯</span><b>{offer.attackRange}</b></div>
              </div>

              <div class="card-footer">
                <span class="rarity-tag" style="background: {rarity.color}22; color: {rarity.color}">
                  {rarity.name}
                </span>
                <button
                  class="recruit-btn"
                  on:click={() => recruitUnit(offer.offerId)}
                  disabled={!canAfford || rosterFull}
                  title={!canAfford ? '金币不足' : rosterFull ? '阵容已满' : '招募此单位'}
                >
                  {rosterFull ? '阵容已满' : canAfford ? '招募' : '金币不足'}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if mode === 'manage' && activeTab === 'synergy'}
    <div class="synergy-panel">
      <div class="synergy-summary">
        <h3>🌟 当前阵容协同效果</h3>
        {#if synergy.synergies.length === 0}
          <div class="no-synergy">暂无激活的协同效果，尝试调整阵容搭配！</div>
        {:else}
          <div class="active-synergies">
            {#each synergy.synergies as s}
              <div class="synergy-card active">
                <div class="synergy-name">{s.name}</div>
                <div class="synergy-desc">{s.description}</div>
                <div class="synergy-effect">
                  {#if s.effect.attack}+{s.effect.attack} 攻击 {/if}
                  {#if s.effect.defense}+{s.effect.defense} 防御 {/if}
                  {#if s.effect.maxHp}+{s.effect.maxHp} 生命 {/if}
                  {#if s.effect.moveRange}+{s.effect.moveRange} 移动 {/if}
                </div>
              </div>
            {/each}
          </div>
          <div class="total-bonus">
            <h4>总加成</h4>
            <div class="bonus-row">
              {#if synergy.effects.attack}<span>⚔️ +{synergy.effects.attack}</span>{/if}
              {#if synergy.effects.defense}<span>🛡️ +{synergy.effects.defense}</span>{/if}
              {#if synergy.effects.maxHp}<span>❤️ +{synergy.effects.maxHp}</span>{/if}
              {#if synergy.effects.moveRange}<span>👟 +{synergy.effects.moveRange}</span>{/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="synergy-list">
        <h3>📖 所有协同效果</h3>
        <div class="all-synergies">
          {#each Object.values(CLASS_SYNERGY) as s}
            {@const isActive = synergy.synergies.some(a => a.name === s.name)}
            <div class="synergy-card {isActive ? 'active' : ''}">
              <div class="synergy-name">{isActive ? '✅ ' : '⬜ '}{s.name}</div>
              <div class="synergy-desc">{s.description}</div>
            </div>
          {/each}
        </div>
      </div>

      <div class="class-breakdown">
        <h3>👥 职业分布</h3>
        <div class="class-counts">
          {#each Object.entries(UNIT_CLASSES) as [cls, info]}
            <div class="class-item">
              <span class="class-icon">{info.icon}</span>
              <span class="class-name">{info.name}</span>
              <span class="class-count">{synergy.classCounts[cls] || 0}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if (mode === 'manage' && activeTab === 'roster') || mode === 'deploy'}
    {#if units.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>暂无部队</h3>
        <p>{mode === 'deploy' ? '你目前还没有可用的部队！' : '前往招募商店招募你的第一个单位'}</p>
        {#if mode === 'manage'}
          <button class="primary-btn" on:click={() => activeTab = 'shop'}>前往招募</button>
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
            {:else if mode === 'manage'}
              <button class="dismiss-btn" on:click|stopPropagation={() => dismissUnit(unit.uid)} title="解散单位">
                ✕
              </button>
            {/if}

            <div class="card-top">
              <div class="unit-portrait" style="background: {formatColor(unitType.color)}22">
                <span style="color: {formatColor(unitType.color)}; font-size: 32px; font-weight: 800;">
                  {unitType.name[0]}
                </span>
              </div>
              <div class="unit-title">
                <div class="unit-name" style="color: {rarity.color}">{unit.name}</div>
                <div class="unit-type">{getClassIcon(unitType.unitClass)} {unitType.name}</div>
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

  .header-gold {
    font-size: 18px;
    font-weight: 700;
    color: #ffcc00;
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

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
    background: rgba(20, 20, 35, 0.6);
    padding: 6px;
    border-radius: 12px;
    border: 1px solid rgba(100, 100, 150, 0.2);
  }

  .tab-btn {
    flex: 1;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #888;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #ccc;
    background: rgba(60, 60, 100, 0.4);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, rgba(204, 153, 0, 0.3), rgba(170, 119, 0, 0.3));
    color: #ffcc00;
    border: 1px solid rgba(255, 204, 0, 0.3);
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

  .synergy-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid rgba(100, 100, 150, 0.15);
    margin-top: 10px;
  }

  .synergy-label {
    font-size: 13px;
    color: #aaa;
  }

  .synergy-tag {
    padding: 4px 10px;
    background: rgba(60, 60, 100, 0.4);
    border-radius: 6px;
    font-size: 12px;
    color: #888;
  }

  .synergy-tag.active {
    background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 153, 0, 0.2));
    color: #ffcc00;
    border: 1px solid rgba(255, 204, 0, 0.3);
  }

  .shop-panel {
    margin-bottom: 18px;
  }

  .shop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: rgba(30, 30, 55, 0.8);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 14px;
    margin-bottom: 18px;
  }

  .shop-info {
    display: flex;
    gap: 24px;
    font-size: 14px;
    color: #bbb;
  }

  .gold-text {
    color: #ffcc00;
  }

  .refresh-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #3a5a7a, #2a4a6a);
    border: 1px solid rgba(100, 150, 255, 0.4);
    border-radius: 8px;
    color: #aaccff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4a6a8a, #3a5a7a);
    transform: translateY(-1px);
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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

  .dismiss-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(139, 0, 0, 0.6);
    border: 1px solid rgba(255, 100, 100, 0.4);
    color: #ffaaaa;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .dismiss-btn:hover {
    background: rgba(180, 40, 40, 0.8);
    transform: scale(1.1);
  }

  .cost-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 12px;
    background: rgba(40, 40, 30, 0.9);
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    color: #ff6666;
    border: 1px solid rgba(255, 100, 100, 0.3);
  }

  .cost-badge.affordable {
    color: #66ff66;
    border-color: rgba(100, 255, 100, 0.3);
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

  .recruit-btn {
    padding: 6px 16px;
    background: linear-gradient(135deg, #2a7a4a, #1a6a3a);
    border: 1px solid rgba(100, 255, 150, 0.4);
    border-radius: 6px;
    color: #aaffbb;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .recruit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #3a8a5a, #2a7a4a);
    transform: translateY(-1px);
  }

  .recruit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .synergy-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .synergy-summary,
  .synergy-list,
  .class-breakdown {
    background: rgba(30, 30, 55, 0.8);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 14px;
    padding: 18px;
  }

  .synergy-panel h3 {
    margin: 0 0 14px 0;
    color: #e8d5b7;
    font-size: 16px;
  }

  .no-synergy {
    color: #777;
    font-size: 13px;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }

  .active-synergies {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .all-synergies {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .synergy-card {
    padding: 12px;
    background: rgba(20, 20, 35, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(100, 100, 150, 0.15);
    transition: all 0.2s;
  }

  .synergy-card.active {
    background: linear-gradient(135deg, rgba(60, 55, 30, 0.6), rgba(40, 35, 20, 0.7));
    border-color: rgba(255, 204, 0, 0.3);
  }

  .synergy-name {
    font-weight: 700;
    font-size: 14px;
    color: #e8d5b7;
    margin-bottom: 4px;
  }

  .synergy-card.active .synergy-name {
    color: #ffcc00;
  }

  .synergy-desc {
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .synergy-effect {
    font-size: 12px;
    color: #66ff66;
    font-weight: 600;
  }

  .total-bonus {
    padding-top: 14px;
    border-top: 1px solid rgba(100, 100, 150, 0.2);
  }

  .total-bonus h4 {
    margin: 0 0 10px 0;
    color: #aaa;
    font-size: 13px;
  }

  .bonus-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .bonus-row span {
    padding: 6px 12px;
    background: rgba(100, 255, 100, 0.1);
    border-radius: 6px;
    color: #66ff66;
    font-weight: 700;
    font-size: 14px;
  }

  .class-breakdown {
    grid-column: span 2;
  }

  .class-counts {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  .class-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    background: rgba(20, 20, 35, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(100, 100, 150, 0.15);
  }

  .class-icon {
    font-size: 28px;
  }

  .class-name {
    font-size: 13px;
    color: #aaa;
  }

  .class-count {
    font-size: 22px;
    font-weight: 800;
    color: #ffcc00;
  }

  @media (max-width: 900px) {
    .synergy-panel {
      grid-template-columns: 1fr;
    }

    .class-breakdown {
      grid-column: span 1;
    }

    .class-counts {
      grid-template-columns: repeat(3, 1fr);
    }

    .all-synergies {
      grid-template-columns: 1fr;
    }
  }
</style>
