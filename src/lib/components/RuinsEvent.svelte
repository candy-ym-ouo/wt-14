<script>
  import { gameStore } from '$lib/stores/gameStore.js';
  import { get } from 'svelte/store';

  export let event;
  export let onResolve;

  function handleChoice(choice) {
    const game = get(gameStore);
    const currentGold = game.ruins?.currentGold || 0;

    if (choice.cost?.gold && currentGold < choice.cost.gold) {
      return;
    }

    gameStore.resolveRuinsEvent(choice);
    if (onResolve) {
      onResolve(choice);
    }
  }

  function handleDismiss() {
    gameStore.dismissRuinsEvent();
    if (onResolve) {
      onResolve(null);
    }
  }
</script>

{#if event}
  <div class="event-overlay">
    <div class="event-modal">
      <div class="event-header">
        <span class="event-icon">{event.icon}</span>
        <h2 class="event-title">{event.name}</h2>
      </div>
      
      <p class="event-description">{event.description}</p>
      
      <div class="event-choices">
        {#each event.choices as choice}
          <button 
            class="choice-btn"
            class:disabled={choice.cost?.gold && $gameStore.ruins?.currentGold < choice.cost.gold}
            on:click={() => handleChoice(choice)}
          >
            <span class="choice-text">{choice.text}</span>
            {#if choice.cost?.gold}
              <span class="choice-cost">💰 {choice.cost.gold}</span>
            {/if}
            {#if choice.cost?.hp}
              <span class="choice-cost">❤️ -{choice.cost.hp}</span>
            {/if}
          </button>
        {/each}
      </div>
      
      {#if event.choices.every(c => c.cost?.gold)}
        <button class="dismiss-btn" on:click={handleDismiss}>
          离开
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .event-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
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

  .event-modal {
    background: linear-gradient(135deg, #2a1f1a 0%, #1a1410 100%);
    border: 2px solid #8b6914;
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .event-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .event-icon {
    font-size: 64px;
    display: block;
    margin-bottom: 12px;
  }

  .event-title {
    margin: 0;
    font-size: 28px;
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .event-description {
    text-align: center;
    color: #c0b0a0;
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 28px;
  }

  .event-choices {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .choice-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #3a2f2a 0%, #2a1f1a 100%);
    border: 1px solid #5a4a3a;
    border-radius: 10px;
    color: #e0d0c0;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .choice-btn:hover:not(.disabled) {
    transform: translateX(5px);
    border-color: #ffd700;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  }

  .choice-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .choice-text {
    flex: 1;
  }

  .choice-cost {
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #ffd700;
  }

  .dismiss-btn {
    margin-top: 16px;
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid #5a4a3a;
    border-radius: 8px;
    color: #888;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dismiss-btn:hover {
    color: #ccc;
    border-color: #888;
  }
</style>
