<script>
  import { onMount, tick } from 'svelte';

  export let logs = [];
  let logContainer;

  $: {
    if (logs.length > 0 && logContainer) {
      tick().then(() => {
        logContainer.scrollTop = logContainer.scrollHeight;
      });
    }
  }
</script>

<div class="combat-log">
  <div class="log-header">
    <h3>战斗日志</h3>
  </div>
  <div class="log-container" bind:this={logContainer}>
    {#if logs.length === 0}
      <div class="empty-log">游戏开始... 请选择单位进行操作</div>
    {/if}
    {#each logs as log, index}
      <div class="log-entry" class:is-combat={log.includes('攻击') || log.includes('伤害')}>
        <span class="log-time">[{index + 1}]</span>
        <span class="log-text">{log}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .combat-log {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 8px;
    border: 1px solid #333;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 200px;
  }
  .log-header {
    padding: 10px 12px;
    border-bottom: 1px solid #333;
  }
  .log-header h3 {
    margin: 0;
    color: #e8d5b7;
    font-size: 14px;
  }
  .log-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
  }
  .log-container::-webkit-scrollbar {
    width: 6px;
  }
  .log-container::-webkit-scrollbar-track {
    background: #1a1a2e;
  }
  .log-container::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
  }
  .log-entry {
    padding: 4px 0;
    font-size: 12px;
    color: #aaa;
    line-height: 1.5;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  }
  .log-entry.is-combat {
    color: #ffd700;
  }
  .log-time {
    color: #666;
    margin-right: 6px;
  }
  .empty-log {
    color: #555;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }
</style>
