<script>
  import { loadGameRecords, getStats, clearGameRecords } from '$lib/utils/storage.js';

  export let show = false;
  export let onClose;

  let records = [];
  let stats = { totalGames: 0, redWins: 0, blueWins: 0, draws: 0, avgTurns: 0 };

  $: {
    if (show) {
      records = loadGameRecords();
      stats = getStats();
    }
  }

  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleClear() {
    if (confirm('确定要清除所有历史记录吗？')) {
      clearGameRecords();
      records = [];
      stats = { totalGames: 0, redWins: 0, blueWins: 0, draws: 0, avgTurns: 0 };
    }
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={onClose}>
    <div class="modal" on:click={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>游戏历史</h2>
        <button class="close-btn" on:click={onClose}>×</button>
      </div>
      <div class="modal-body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{stats.totalGames}</div>
            <div class="stat-label">总局数</div>
          </div>
          <div class="stat-card red">
            <div class="stat-value">{stats.redWins}</div>
            <div class="stat-label">红方胜</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-value">{stats.blueWins}</div>
            <div class="stat-label">蓝方胜</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{stats.draws}</div>
            <div class="stat-label">平局</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{stats.avgTurns}</div>
            <div class="stat-label">平均回合</div>
          </div>
        </div>

        <div class="records-list">
          <h3>对战记录</h3>
          {#if records.length === 0}
            <div class="no-records">暂无对战记录</div>
          {:else}
            <div class="records-header">
              <span>时间</span>
              <span>结果</span>
              <span>回合</span>
              <span>红方剩余</span>
              <span>蓝方剩余</span>
            </div>
            <div class="records-scroll">
              {#each records as record}
                <div class="record-row">
                  <span>{formatDate(record.timestamp)}</span>
                  <span class:red={record.winner === 'red'} class:blue={record.winner === 'blue'}>
                    {record.winner === 'red' ? '红方胜' : record.winner === 'blue' ? '蓝方胜' : '平局'}
                  </span>
                  <span>{record.turns}</span>
                  <span class="red">{record.redUnitsRemaining}</span>
                  <span class="blue">{record.blueUnitsRemaining}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-clear" on:click={handleClear}>清除记录</button>
        <button class="btn-close" on:click={onClose}>关闭</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid #444;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #333;
  }
  .modal-header h2 {
    margin: 0;
    color: #e8d5b7;
    font-size: 20px;
  }
  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .close-btn:hover {
    color: #fff;
  }
  .modal-body {
    padding: 16px 20px;
    overflow-y: auto;
    flex: 1;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 12px 8px;
    text-align: center;
    border: 1px solid #333;
  }
  .stat-card.red { border-color: #ff6b6b; }
  .stat-card.blue { border-color: #4dabf7; }
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #e8d5b7;
    margin-bottom: 4px;
  }
  .stat-card.red .stat-value { color: #ff6b6b; }
  .stat-card.blue .stat-value { color: #4dabf7; }
  .stat-label {
    font-size: 12px;
    color: #888;
  }
  .records-list h3 {
    color: #e8d5b7;
    font-size: 16px;
    margin: 0 0 12px 0;
  }
  .no-records {
    text-align: center;
    color: #666;
    padding: 30px;
    font-style: italic;
  }
  .records-header, .record-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 0.6fr 0.8fr 0.8fr;
    gap: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }
  .records-header {
    background: rgba(255, 255, 255, 0.05);
    color: #888;
    font-weight: bold;
    border-radius: 4px 4px 0 0;
  }
  .records-scroll {
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #333;
    border-radius: 0 0 4px 4px;
  }
  .record-row {
    color: #ccc;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .record-row:last-child {
    border-bottom: none;
  }
  .record-row:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  .red { color: #ff6b6b; }
  .blue { color: #4dabf7; }
  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid #333;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .btn-clear, .btn-close {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-clear {
    background: #8b0000;
    color: #fff;
  }
  .btn-clear:hover {
    background: #a52a2a;
  }
  .btn-close {
    background: #444;
    color: #e8d5b7;
  }
  .btn-close:hover {
    background: #555;
  }
</style>
