<script>
  import {
    MAX_LEVEL, previewGrowth, STAT_POINTS_PER_LEVEL,
    PROMOTION_LEVEL, PROMOTION_TREE
  } from '$lib/config/unitGrowth.js';
  import { UNIT_TYPES } from '$lib/config/units.js';

  export let unit;

  let targetLevel = Math.min(unit.level + 3, MAX_LEVEL);

  $: baseType = unit.baseType || unit.type;
  $: preview = previewGrowth(unit, targetLevel);
  $: canPromoteAtTarget = targetLevel >= PROMOTION_LEVEL && !unit.promoted && PROMOTION_TREE[baseType];
  $: levelOptions = [];
  $: {
    const options = [];
    for (let i = unit.level; i <= MAX_LEVEL; i++) {
      if (i === unit.level || i === PROMOTION_LEVEL || i === MAX_LEVEL || (i - unit.level) % 3 === 0) {
        options.push(i);
      }
    }
    levelOptions = options;
  }

  function setPreviewLevel(level) {
    targetLevel = level;
  }

  function formatStatChange(value) {
    if (value > 0) return `+${value}`;
    if (value < 0) return `${value}`;
    return '0';
  }

  function getStatChangeClass(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  }
</script>

<div class="growth-preview">
  <div class="preview-header">
    <span class="preview-title">成长预览</span>
    <div class="level-selector">
      {#each levelOptions as level}
        <button
          class="level-btn {targetLevel === level ? 'active' : ''}"
          on:click={() => setPreviewLevel(level)}
        >
          Lv.{level}
        </button>
      {/each}
    </div>
  </div>

  {#if preview}
    <div class="preview-summary">
      <div class="summary-item">
        <div class="summary-label">等级提升</div>
        <div class="summary-value positive">+{preview.levelsToGain}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">获得属性点</div>
        <div class="summary-value gold">+{preview.statPointsToGain}</div>
      </div>
    </div>

    <div class="stats-comparison">
      <div class="stats-column current">
        <div class="column-header">当前 Lv.{preview.currentLevel}</div>
        <div class="stat-item">
          <span class="stat-icon">❤️</span>
          <span class="stat-label">生命</span>
          <span class="stat-value">{preview.currentStats.hp}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚔️</span>
          <span class="stat-label">攻击</span>
          <span class="stat-value">{preview.currentStats.attack}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🛡️</span>
          <span class="stat-label">防御</span>
          <span class="stat-value">{preview.currentStats.defense}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👟</span>
          <span class="stat-label">移动</span>
          <span class="stat-value">{preview.currentStats.moveRange}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">射程</span>
          <span class="stat-value">{preview.currentStats.attackRange}</span>
        </div>
      </div>

      <div class="stats-arrow">→</div>

      <div class="stats-column future">
        <div class="column-header">目标 Lv.{preview.targetLevel}</div>
        <div class="stat-item">
          <span class="stat-icon">❤️</span>
          <span class="stat-label">生命</span>
          <span class="stat-value">{preview.futureStats.hp}</span>
          <span class="stat-change {getStatChangeClass(preview.growth.hp)}">
            {formatStatChange(preview.growth.hp)}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⚔️</span>
          <span class="stat-label">攻击</span>
          <span class="stat-value">{preview.futureStats.attack}</span>
          <span class="stat-change {getStatChangeClass(preview.growth.attack)}">
            {formatStatChange(preview.growth.attack)}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🛡️</span>
          <span class="stat-label">防御</span>
          <span class="stat-value">{preview.futureStats.defense}</span>
          <span class="stat-change {getStatChangeClass(preview.growth.defense)}">
            {formatStatChange(preview.growth.defense)}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👟</span>
          <span class="stat-label">移动</span>
          <span class="stat-value">{preview.futureStats.moveRange}</span>
          <span class="stat-change {getStatChangeClass(preview.growth.moveRange)}">
            {formatStatChange(preview.growth.moveRange)}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">射程</span>
          <span class="stat-value">{preview.futureStats.attackRange}</span>
          <span class="stat-change {getStatChangeClass(preview.growth.attackRange)}">
            {formatStatChange(preview.growth.attackRange)}
          </span>
        </div>
      </div>
    </div>

    {#if canPromoteAtTarget}
      <div class="promotion-hint">
        <div class="hint-icon">⚔️</div>
        <div class="hint-content">
          <div class="hint-title">达到 Lv.{PROMOTION_LEVEL} 可转职！</div>
          <div class="hint-desc">
            {PROMOTION_TREE[baseType].length} 个转职方向可选
          </div>
        </div>
      </div>
    {/if}

    {#if unit.level >= MAX_LEVEL}
      <div class="max-level-hint">
        🌟 已达到最高等级！
      </div>
    {/if}
  {/if}
</div>

<style>
  .growth-preview {
    padding: 4px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .preview-title {
    font-weight: 700;
    font-size: 15px;
    color: #e0e0e0;
  }

  .level-selector {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .level-btn {
    padding: 6px 10px;
    background: rgba(40, 40, 70, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.3);
    border-radius: 6px;
    color: #aaa;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .level-btn:hover {
    background: rgba(60, 60, 100, 0.6);
    color: #ccc;
  }

  .level-btn.active {
    background: linear-gradient(135deg, rgba(204, 153, 0, 0.3), rgba(170, 119, 0, 0.4));
    color: #ffcc00;
    border-color: rgba(255, 204, 0, 0.4);
  }

  .preview-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .summary-item {
    text-align: center;
    padding: 12px;
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.25);
    border-radius: 10px;
  }

  .summary-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 6px;
  }

  .summary-value {
    font-size: 24px;
    font-weight: 800;
  }

  .summary-value.positive {
    color: #66ff66;
  }

  .summary-value.gold {
    color: #ffcc00;
  }

  .stats-comparison {
    display: flex;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 18px;
  }

  .stats-column {
    flex: 1;
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.25);
    border-radius: 10px;
    padding: 12px;
  }

  .column-header {
    text-align: center;
    font-weight: 700;
    font-size: 12px;
    color: #aaa;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(100, 100, 150, 0.2);
  }

  .stats-column.future .column-header {
    color: #ffcc00;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    font-size: 12px;
  }

  .stat-icon {
    width: 18px;
    text-align: center;
    font-size: 14px;
  }

  .stat-label {
    flex: 1;
    color: #888;
  }

  .stat-value {
    font-weight: 700;
    color: #e0e0e0;
  }

  .stat-change {
    font-size: 10px;
    font-weight: 700;
    min-width: 28px;
    text-align: right;
  }

  .stat-change.positive {
    color: #66ff66;
  }

  .stat-change.negative {
    color: #ff6666;
  }

  .stat-change.neutral {
    color: #666;
  }

  .stats-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #666;
    font-weight: 700;
  }

  .promotion-hint {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: linear-gradient(135deg, rgba(100, 60, 30, 0.4), rgba(70, 40, 20, 0.5));
    border: 1px solid rgba(255, 150, 50, 0.3);
    border-radius: 10px;
    margin-bottom: 12px;
  }

  .hint-icon {
    font-size: 28px;
  }

  .hint-title {
    font-weight: 700;
    font-size: 14px;
    color: #ffaa55;
    margin-bottom: 2px;
  }

  .hint-desc {
    font-size: 12px;
    color: #aa8866;
  }

  .max-level-hint {
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 204, 0, 0.1), rgba(255, 153, 0, 0.15));
    border: 1px solid rgba(255, 204, 0, 0.3);
    border-radius: 10px;
    color: #ffcc00;
    font-weight: 700;
    font-size: 14px;
  }
</style>
