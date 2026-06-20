<script>
  import { UNIT_RARITY } from '$lib/config/unitGrowth.js';

  export let treasure;
  export let onClose;

  const rarityColors = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  };

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }
</script>

{#if treasure}
  <div class="reward-overlay" on:click={handleClose}>
    <div class="reward-modal" on:click|stopPropagation>
      <div class="reward-header">
        <span class="reward-icon">{treasure.icon}</span>
        <div 
          class="rarity-badge"
          style="background: {rarityColors[treasure.rarity]};"
        >
          {UNIT_RARITY[treasure.rarity]?.name || treasure.rarity}
        </div>
      </div>
      
      <h2 class="reward-title">{treasure.name}</h2>
      <p class="reward-description">{treasure.description}</p>
      
      <div class="reward-effect">
        <span class="effect-icon">✨</span>
        <span class="effect-text">已生效</span>
      </div>
      
      <button class="close-btn" on:click={handleClose}>
        继续探索
      </button>
    </div>
  </div>
{/if}

<style>
  .reward-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .reward-modal {
    background: linear-gradient(135deg, #2a1f1a 0%, #1a1410 100%);
    border: 2px solid #d4af37;
    border-radius: 16px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(212, 175, 55, 0.3);
    animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes bounceIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .reward-header {
    position: relative;
    margin-bottom: 20px;
  }

  .reward-icon {
    font-size: 72px;
    display: block;
    margin-bottom: 12px;
    animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .rarity-badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .reward-title {
    margin: 0 0 12px 0;
    font-size: 28px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .reward-description {
    color: #c0b0a0;
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .reward-effect {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.5);
    border-radius: 24px;
    margin-bottom: 24px;
  }

  .effect-icon {
    font-size: 18px;
  }

  .effect-text {
    color: #2ecc71;
    font-size: 14px;
    font-weight: 600;
  }

  .close-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #d4af37, #b8941f);
    border: none;
    border-radius: 10px;
    color: #1a1410;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
  }

  .close-btn:active {
    transform: translateY(0);
  }
</style>
