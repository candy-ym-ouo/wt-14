<script>
  import { get } from 'svelte/store';
  import { gameStore } from '$lib/stores/gameStore.js';
  import { EVENT_CARD_CONFIG } from '$lib/config/eventCards.js';

  export let onCardPlayed;

  function handlePlayCard(index, card) {
    const game = get(gameStore);
    if (game.gameOver) return;
    if (game.cardsPlayedThisTurn >= EVENT_CARD_CONFIG.playPerTurn) return;
    
    gameStore.applyEventCardEffect(card);
    gameStore.playEventCard(index);
    onCardPlayed?.(card);
  }

  const rarityColors = {
    common: 'border-gray-400 bg-gray-700',
    rare: 'border-blue-400 bg-blue-900',
    legendary: 'border-yellow-400 bg-yellow-900'
  };

  const typeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-300'
  };
</script>

<div class="event-cards-panel">
  <div class="panel-header">
    <h3>事件卡</h3>
    <span class="card-count">
      {$gameStore.cardsPlayedThisTurn}/{EVENT_CARD_CONFIG.playPerTurn} 已使用
    </span>
  </div>
  <div class="cards-container">
    {#if $gameStore.eventHand.length === 0}
      <div class="no-cards">暂无手牌</div>
    {/if}
    {#each $gameStore.eventHand as card, index}
      <div 
        class="event-card {rarityColors[card.rarity]}"
        class:disabled={$gameStore.cardsPlayedThisTurn >= EVENT_CARD_CONFIG.playPerTurn || $gameStore.gameOver}
        on:click={() => handlePlayCard(index, card)}
      >
        <div class="card-name {typeColors[card.type]}">{card.name}</div>
        <div class="card-desc">{card.description}</div>
        <div class="card-footer">
          <span class="rarity-badge">{card.rarity === 'common' ? '普通' : card.rarity === 'rare' ? '稀有' : '传说'}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .event-cards-panel {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #333;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #444;
  }
  .panel-header h3 {
    margin: 0;
    color: #e8d5b7;
    font-size: 16px;
  }
  .card-count {
    color: #aaa;
    font-size: 12px;
  }
  .cards-container {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .event-card {
    width: 140px;
    min-height: 160px;
    border: 2px solid;
    border-radius: 8px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
  }
  .event-card:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  .event-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .card-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 8px;
    text-align: center;
  }
  .card-desc {
    color: #ccc;
    font-size: 12px;
    flex: 1;
    line-height: 1.4;
  }
  .card-footer {
    margin-top: 8px;
    text-align: center;
  }
  .rarity-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.4);
    font-size: 11px;
    color: #ddd;
  }
  .no-cards {
    color: #666;
    font-style: italic;
    padding: 20px;
  }
</style>
