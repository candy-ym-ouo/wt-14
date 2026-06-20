<script>
  import {
    PROMOTION_TREE, PROMOTION_LEVEL, canPromote, getPromotionOptions
  } from '$lib/config/unitGrowth.js';
  import { UNIT_TYPES, UNIT_CLASSES } from '$lib/config/units.js';

  export let unit;
  export let onPromote;

  $: baseType = unit.baseType || unit.type;
  $: promotions = PROMOTION_TREE[baseType] || [];
  $: canPromoteNow = canPromote(unit);
  $: availablePromotions = getPromotionOptions(baseType, unit.level);

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

  function handlePromote(promotionId) {
    if (!canPromoteNow) return;
    if (confirm(`确定要转职为 ${promotions.find(p => p.id === promotionId)?.name} 吗？转职后无法更改！`)) {
      onPromote(promotionId);
    }
  }
</script>

<div class="class-promotion">
  {#if unit.promoted}
    <div class="already-promoted">
      <div class="promoted-icon">⭐</div>
      <div class="promoted-title">已转职</div>
      <div class="promoted-desc">
        你已经选择了职业方向
      </div>
      {#if unit.skill}
        <div class="current-skill">
          <span class="skill-label">当前技能</span>
          <span class="skill-name">{unit.skill}</span>
        </div>
      {/if}
    </div>
  {:else if unit.level < PROMOTION_LEVEL}
    <div class="promotion-locked">
      <div class="lock-icon">🔒</div>
      <div class="lock-title">转职未解锁</div>
      <div class="lock-desc">
        达到 Lv.{PROMOTION_LEVEL} 后可进行转职
      </div>
      <div class="level-progress">
        <span>当前等级: Lv.{unit.level}</span>
        <span>距离转职还需: {PROMOTION_LEVEL - unit.level} 级</span>
      </div>

      <div class="preview-title">预览转职方向</div>
      <div class="promotion-list">
        {#each promotions as promo}
          <div class="promotion-card preview">
            <div class="promo-header">
              <span class="promo-icon">{promo.icon}</span>
              <span class="promo-name">{promo.name}</span>
            </div>
            <div class="promo-desc">{promo.description}</div>
            <div class="promo-skill">
              <span class="skill-badge">✨</span>
              <span>{promo.skill}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="promotion-available">
      <div class="available-header">
        <span class="available-icon">⚔️</span>
        <span class="available-title">选择转职方向</span>
      </div>
      <div class="available-desc">
        选择一个职业方向进行转职，转职后将获得新的属性和技能
      </div>

      <div class="promotion-list">
        {#each availablePromotions as promo}
          <div class="promotion-card available">
            <div class="promo-header">
              <span class="promo-icon">{promo.icon}</span>
              <span class="promo-name">{promo.name}</span>
            </div>
            <div class="promo-desc">{promo.description}</div>

            <div class="stat-changes">
              <div class="stat-change-item">
                <span>❤️ 生命</span>
                <span class={getStatChangeClass(promo.statChanges.hp || 0)}>
                  {formatStatChange(promo.statChanges.hp || 0)}
                </span>
              </div>
              <div class="stat-change-item">
                <span>⚔️ 攻击</span>
                <span class={getStatChangeClass(promo.statChanges.attack || 0)}>
                  {formatStatChange(promo.statChanges.attack || 0)}
                </span>
              </div>
              <div class="stat-change-item">
                <span>🛡️ 防御</span>
                <span class={getStatChangeClass(promo.statChanges.defense || 0)}>
                  {formatStatChange(promo.statChanges.defense || 0)}
                </span>
              </div>
              <div class="stat-change-item">
                <span>👟 移动</span>
                <span class={getStatChangeClass(promo.statChanges.moveRange || 0)}>
                  {formatStatChange(promo.statChanges.moveRange || 0)}
                </span>
              </div>
              <div class="stat-change-item">
                <span>🎯 射程</span>
                <span class={getStatChangeClass(promo.statChanges.attackRange || 0)}>
                  {formatStatChange(promo.statChanges.attackRange || 0)}
                </span>
              </div>
            </div>

            <div class="promo-skill">
              <span class="skill-badge">✨</span>
              <span>技能: {promo.skill}</span>
            </div>

            <button
              class="promote-btn"
              on:click={() => handlePromote(promo.id)}
              disabled={!canPromoteNow}
            >
              转职
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .class-promotion {
    padding: 4px;
  }

  .already-promoted {
    text-align: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, rgba(60, 55, 30, 0.4), rgba(40, 35, 20, 0.5));
    border: 1px solid rgba(255, 204, 0, 0.3);
    border-radius: 12px;
  }

  .promoted-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  .promoted-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffcc00;
    margin-bottom: 6px;
  }

  .promoted-desc {
    font-size: 13px;
    color: #aa8866;
    margin-bottom: 16px;
  }

  .current-skill {
    display: inline-block;
    padding: 10px 20px;
    background: rgba(100, 60, 120, 0.3);
    border: 1px solid rgba(180, 100, 220, 0.3);
    border-radius: 10px;
  }

  .skill-label {
    display: block;
    font-size: 11px;
    color: #aa88cc;
    margin-bottom: 4px;
  }

  .skill-name {
    font-size: 16px;
    font-weight: 700;
    color: #ddbbff;
  }

  .promotion-locked {
    text-align: center;
  }

  .lock-icon {
    font-size: 48px;
    margin-bottom: 10px;
    opacity: 0.6;
  }

  .lock-title {
    font-size: 18px;
    font-weight: 700;
    color: #888;
    margin-bottom: 6px;
  }

  .lock-desc {
    font-size: 13px;
    color: #666;
    margin-bottom: 16px;
  }

  .level-progress {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 12px;
    background: rgba(30, 30, 55, 0.6);
    border-radius: 8px;
    font-size: 12px;
    color: #aaa;
    margin-bottom: 20px;
  }

  .preview-title {
    text-align: left;
    font-size: 14px;
    font-weight: 700;
    color: #aaa;
    margin-bottom: 12px;
  }

  .promotion-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .promotion-card {
    background: rgba(30, 30, 55, 0.6);
    border: 1px solid rgba(100, 100, 150, 0.25);
    border-radius: 12px;
    padding: 14px;
    transition: all 0.2s;
  }

  .promotion-card.preview {
    opacity: 0.7;
  }

  .promotion-card.available:hover {
    border-color: rgba(255, 150, 50, 0.4);
    background: linear-gradient(135deg, rgba(60, 45, 25, 0.5), rgba(40, 30, 15, 0.6));
  }

  .promo-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .promo-icon {
    font-size: 28px;
  }

  .promo-name {
    font-size: 16px;
    font-weight: 700;
    color: #ffaa55;
  }

  .promo-desc {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 10px;
    line-height: 1.5;
  }

  .stat-changes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 10px;
    padding: 10px;
    background: rgba(20, 20, 35, 0.5);
    border-radius: 8px;
  }

  .stat-change-item {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #888;
  }

  .stat-change-item .positive {
    color: #66ff66;
    font-weight: 700;
  }

  .stat-change-item .negative {
    color: #ff6666;
    font-weight: 700;
  }

  .stat-change-item .neutral {
    color: #666;
  }

  .promo-skill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(80, 50, 100, 0.2);
    border-radius: 6px;
    font-size: 12px;
    color: #ccaaff;
    margin-bottom: 12px;
  }

  .skill-badge {
    font-size: 14px;
  }

  .promote-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #cc7700, #aa5500);
    border: 1px solid rgba(255, 150, 50, 0.5);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .promote-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(204, 119, 0, 0.4);
  }

  .promote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .promotion-available {
    text-align: center;
  }

  .available-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .available-icon {
    font-size: 24px;
  }

  .available-title {
    font-size: 17px;
    font-weight: 700;
    color: #ffaa55;
  }

  .available-desc {
    font-size: 12px;
    color: #888;
    margin-bottom: 16px;
  }
</style>
