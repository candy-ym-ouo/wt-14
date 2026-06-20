<script>
  import { derived } from 'svelte/store';
  import { campaignStore } from '$lib/stores/campaignStore.js';
  import { UNIT_TYPES, UNIT_CLASSES } from '$lib/config/units.js';
  import {
    UNIT_RARITY, getExpRequired, MAX_LEVEL,
    ALLOCATABLE_STATS, STAT_POINTS_PER_LEVEL,
    canPromote, getPromotionOptions, PROMOTION_LEVEL,
    PROMOTION_UNIT_TYPES
  } from '$lib/config/unitGrowth.js';
  import GrowthPreview from './GrowthPreview.svelte';
  import ClassPromotion from './ClassPromotion.svelte';

  export let uid;
  export let onClose;

  let activeTab = 'stats';

  const unit = derived(campaignStore, $campaign =>
    $campaign.unitPool.units.find(u => u.uid === uid) || null
  );

  $: unitType = $unit
    ? UNIT_TYPES[$unit.baseType || $unit.type] || PROMOTION_UNIT_TYPES[$unit.type]
    : null;
  $: rarity = $unit ? UNIT_RARITY[$unit.rarity] || UNIT_RARITY.common : UNIT_RARITY.common;
  $: expNeeded = $unit && $unit.level < MAX_LEVEL ? getExpRequired($unit.level) : 0;
  $: expPct = $unit && $unit.level >= MAX_LEVEL ? 100 : ($unit?.exp / expNeeded * 100) || 0;
  $: statPoints = $unit?.statPoints || 0;
  $: allocatedStats = $unit?.allocatedStats || { hp: 0, attack: 0, defense: 0 };
  $: canPromoteNow = $unit ? canPromote($unit) : false;
  $: promotionOptions = $unit ? getPromotionOptions($unit.baseType || $unit.type, $unit.level) : [];
  $: baseType = $unit?.baseType || $unit?.type || '';
  $: className = UNIT_CLASSES[UNIT_TYPES[baseType]?.unitClass]?.name || baseType;

  function handleAllocate(statId) {
    if (!$unit) return;
    campaignStore.allocateStat($unit.uid, statId);
  }

  function handlePromotion(promotionId) {
    if (!$unit) return;
    campaignStore.promoteUnit($unit.uid, promotionId);
  }

  function formatColor(num) {
    return '#' + num.toString(16).padStart(6, '0');
  }

  function getClassIcon(cls) {
    return UNIT_CLASSES[cls]?.icon || '⚔️';
  }
</script>

{#if $unit}
<div class="growth-overlay" on:click={onClose}>
  <div class="growth-panel" on:click|stopPropagation>
    <div class="panel-header">
      <button class="close-btn" on:click={onClose}>✕</button>
      <h2 class="panel-title">单位成长</h2>
    </div>

    <div class="unit-summary">
      <div class="unit-portrait" style="background: {formatColor(unitType.color)}22">
        <span style="color: {formatColor(unitType.color)}; font-size: 48px; font-weight: 800;">
          {unitType.name[0]}
        </span>
      </div>
      <div class="unit-info">
        <div class="unit-name" style="color: {rarity.color}">{$unit.name}</div>
        <div class="unit-type">
          {getClassIcon(UNIT_TYPES[baseType]?.unitClass)} {unitType.name}
          {#if $unit.promoted}
            <span class="promoted-badge">★ 已转职</span>
          {/if}
        </div>
        <div class="unit-level-row">
          <span class="level-badge">Lv.{$unit.level}</span>
          <span class="rarity-tag" style="background: {rarity.color}22; color: {rarity.color}">
            {rarity.name}
          </span>
        </div>
      </div>
      <div class="exp-section">
        <div class="exp-label">
          <span>经验值</span>
          <span>{$unit.level >= MAX_LEVEL ? '已满级' : `${$unit.exp} / ${expNeeded}`}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" style="width: {Math.min(100, expPct)}%"></div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn {activeTab === 'stats' ? 'active' : ''}" on:click={() => activeTab = 'stats'}>
        📊 属性分配
      </button>
      <button class="tab-btn {activeTab === 'preview' ? 'active' : ''}" on:click={() => activeTab = 'preview'}>
        🔮 成长预览
      </button>
      <button class="tab-btn {activeTab === 'promotion' ? 'active' : ''}" on:click={() => activeTab = 'promotion'}>
        ⚔️ 职业转职
      </button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'stats'}
        <div class="stats-allocation">
          <div class="points-info">
            <div class="points-available">
              <span class="points-label">可用属性点</span>
              <span class="points-value">{statPoints}</span>
            </div>
            <div class="points-hint">
              每升一级获得 {STAT_POINTS_PER_LEVEL} 点属性点
            </div>
          </div>

          <div class="stats-list">
            {#each ALLOCATABLE_STATS as stat}
              <div class="stat-row">
                <div class="stat-icon">{stat.icon}</div>
                <div class="stat-info">
                  <div class="stat-name">{stat.name}</div>
                  <div class="stat-detail">
                    基础: {$unit[stat.id] - (allocatedStats[stat.id] || 0)}
                    {#if allocatedStats[stat.id] > 0}
                      <span class="allocated-bonus"> +{allocatedStats[stat.id]}</span>
                    {/if}
                    <span class="stat-total"> = {$unit[stat.id]}</span>
                  </div>
                </div>
                <button
                  class="allocate-btn"
                  on:click={() => handleAllocate(stat.id)}
                  disabled={statPoints <= 0}
                  title={statPoints <= 0 ? '没有可用属性点' : `分配 1 点${stat.name}`}
                >
                  +
                </button>
              </div>
            {/each}
          </div>

          <div class="all-stats-grid">
            <div class="stat-card">
              <div class="stat-card-icon">👟</div>
              <div class="stat-card-name">移动</div>
              <div class="stat-card-value">{$unit.moveRange}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon">🎯</div>
              <div class="stat-card-name">射程</div>
              <div class="stat-card-value">{$unit.attackRange}</div>
            </div>
          </div>

          {#if $unit.skill}
            <div class="skill-section">
              <div class="skill-title">✨ 职业技能</div>
              <div class="skill-name">{$unit.skill}</div>
            </div>
          {/if}
        </div>
      {:else if activeTab === 'preview'}
        <GrowthPreview unit={$unit} />
      {:else if activeTab === 'promotion'}
        <ClassPromotion unit={$unit} onPromote={handlePromotion} />
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  .growth-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .growth-panel {
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(180deg, rgba(35, 35, 60, 0.98), rgba(20, 20, 40, 0.98));
    border: 2px solid rgba(100, 100, 150, 0.4);
    border-radius: 20px;
    padding: 24px;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .panel-header {
    position: relative;
    text-align: center;
    margin-bottom: 20px;
  }

  .close-btn {
    position: absolute;
    top: 0;
    right: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(100, 100, 150, 0.2);
    border: 1px solid rgba(150, 150, 200, 0.3);
    color: #aaa;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(200, 80, 80, 0.3);
    color: #ff8888;
    border-color: rgba(255, 100, 100, 0.4);
  }

  .panel-title {
    margin: 0;
    font-size: 22px;
    background: linear-gradient(135deg, #ffcc00, #ff9900);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .unit-summary {
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 18px;
  }

  .unit-portrait {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  .unit-info {
    text-align: center;
    margin-bottom: 14px;
  }

  .unit-name {
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .unit-type {
    font-size: 13px;
    color: #aaa;
    margin-bottom: 8px;
  }

  .promoted-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 2px 8px;
    background: linear-gradient(135deg, rgba(255, 204, 0, 0.2), rgba(255, 153, 0, 0.2));
    border: 1px solid rgba(255, 204, 0, 0.4);
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    color: #ffcc00;
  }

  .unit-level-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .level-badge {
    padding: 4px 14px;
    background: rgba(60, 60, 100, 0.8);
    border-radius: 10px;
    font-weight: 700;
    font-size: 14px;
  }

  .rarity-tag {
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
  }

  .exp-section {
    margin-top: 14px;
  }

  .exp-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .exp-bar {
    height: 10px;
    background: rgba(20, 20, 35, 0.8);
    border-radius: 5px;
    overflow: hidden;
  }

  .exp-fill {
    height: 100%;
    background: linear-gradient(90deg, #66ff66, #44cc44);
    border-radius: 5px;
    transition: width 0.3s;
  }

  .tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;
    background: rgba(20, 20, 35, 0.5);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(100, 100, 150, 0.2);
  }

  .tab-btn {
    flex: 1;
    padding: 10px 8px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #888;
    font-size: 12px;
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

  .tab-content {
    min-height: 280px;
  }

  .points-info {
    text-align: center;
    margin-bottom: 18px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(60, 55, 30, 0.4), rgba(40, 35, 20, 0.5));
    border: 1px solid rgba(255, 204, 0, 0.2);
    border-radius: 12px;
  }

  .points-label {
    font-size: 13px;
    color: #aaa;
    display: block;
    margin-bottom: 6px;
  }

  .points-value {
    font-size: 36px;
    font-weight: 800;
    color: #ffcc00;
    display: block;
  }

  .points-hint {
    font-size: 11px;
    color: #666;
    margin-top: 6px;
  }

  .stats-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 18px;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.25);
    border-radius: 10px;
  }

  .stat-icon {
    font-size: 24px;
    width: 36px;
    text-align: center;
  }

  .stat-info {
    flex: 1;
  }

  .stat-name {
    font-weight: 700;
    font-size: 14px;
    color: #e0e0e0;
    margin-bottom: 2px;
  }

  .stat-detail {
    font-size: 12px;
    color: #888;
  }

  .allocated-bonus {
    color: #66ff66;
    font-weight: 600;
  }

  .stat-total {
    color: #ffcc00;
    font-weight: 700;
  }

  .allocate-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a8a4a, #3a7a3a);
    border: 1px solid rgba(100, 255, 100, 0.4);
    color: #aaffaa;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .allocate-btn:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(100, 255, 100, 0.4);
  }

  .allocate-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .all-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .stat-card {
    text-align: center;
    padding: 12px;
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.25);
    border-radius: 10px;
  }

  .stat-card-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .stat-card-name {
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
  }

  .stat-card-value {
    font-size: 20px;
    font-weight: 700;
    color: #e0e0e0;
  }

  .skill-section {
    text-align: center;
    padding: 14px;
    background: linear-gradient(135deg, rgba(100, 60, 120, 0.3), rgba(80, 40, 100, 0.4));
    border: 1px solid rgba(180, 100, 220, 0.3);
    border-radius: 10px;
  }

  .skill-title {
    font-size: 12px;
    color: #ccaaff;
    margin-bottom: 4px;
  }

  .skill-name {
    font-size: 16px;
    font-weight: 700;
    color: #ddbbff;
  }
</style>
