<script>
  import { UNIT_TYPES } from '$lib/config/units.js';
</script>

<div class="unit-legend">
  <h3>单位图鉴</h3>
  <div class="units-grid">
    {#each Object.values(UNIT_TYPES) as unit}
      <div class="unit-item">
        <div class="unit-icon" style="background: #{unit.color.toString(16).padStart(6, '0')}">
          {unit.name[0]}
        </div>
        <div class="unit-details">
          <div class="unit-name">{unit.name}</div>
          <div class="unit-stats">
            HP:{unit.hp} ATK:{unit.attack} DEF:{unit.defense} MOV:{unit.moveRange} RNG:{unit.attackRange}
          </div>
          <div class="unit-desc">{unit.description}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .unit-legend {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #333;
  }
  .unit-legend h3 {
    margin: 0 0 10px 0;
    color: #e8d5b7;
    font-size: 14px;
  }
  .units-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .unit-item {
    display: flex;
    gap: 10px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
  }
  .unit-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: bold;
    font-size: 16px;
    flex-shrink: 0;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  .unit-details {
    flex: 1;
    min-width: 0;
  }
  .unit-name {
    color: #e8d5b7;
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 2px;
  }
  .unit-stats {
    color: #aaa;
    font-size: 11px;
    font-family: monospace;
    margin-bottom: 2px;
  }
  .unit-desc {
    color: #666;
    font-size: 11px;
    font-style: italic;
  }
</style>
