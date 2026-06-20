<script>
  import { campaignStore, currentDialogLine } from '$lib/stores/campaignStore.js';

  $: line = $currentDialogLine;
  $: dialog = $campaignStore.dialog;
  $: progress = dialog.lines.length > 0 ? ((dialog.index + 1) / dialog.lines.length * 100) : 0;

  let displayText = '';
  let isTyping = false;
  let typeInterval = null;

  $: if (line?.text) {
    startTypewriter(line.text);
  }

  function startTypewriter(text) {
    if (typeInterval) clearInterval(typeInterval);
    displayText = '';
    isTyping = true;
    let i = 0;
    typeInterval = setInterval(() => {
      if (i < text.length) {
        displayText += text[i];
        i++;
      } else {
        clearInterval(typeInterval);
        isTyping = false;
      }
    }, 30);
  }

  function skipTyping() {
    if (isTyping && line) {
      if (typeInterval) clearInterval(typeInterval);
      displayText = line.text;
      isTyping = false;
    } else {
      $campaignStore.nextDialogLine();
    }
  }

  function handleSkip() {
    if (typeInterval) clearInterval(typeInterval);
    $campaignStore.skipDialog();
  }

  function handleKeydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      skipTyping();
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if line}
  <div class="dialog-overlay" on:click={skipTyping}>
    <div class="dialog-container" on:click|stopPropagation>
      {#if dialog.type === 'chapter_end'}
        <div class="chapter-banner">
          <span class="banner-icon">📖</span>
          <span class="banner-text">章节结语</span>
        </div>
      {:else if dialog.type === 'post'}
        <div class="chapter-banner post">
          <span class="banner-icon">🎊</span>
          <span class="banner-text">战后叙谈</span>
        </div>
      {:else}
        <div class="chapter-banner pre">
          <span class="banner-icon">⚔️</span>
          <span class="banner-text">战前 briefing</span>
        </div>
      {/if}

      <div class="dialog-progress">
        <div class="progress-bar" style="width: {progress}%"></div>
        <span class="progress-label">{dialog.index + 1} / {dialog.lines.length}</span>
      </div>

      <div class="dialog-content">
        <div class="character-avatar" style="border-color: {line.character.color}">
          <span class="avatar-icon">{line.character.avatar}</span>
        </div>

        <div class="dialog-main">
          <div class="character-info">
            <span class="character-name" style="color: {line.character.color}">
              {line.character.name}
            </span>
            {#if line.character.title}
              <span class="character-title">{line.character.title}</span>
            {/if}
          </div>
          <p class="dialog-text">{displayText}{#if isTyping}<span class="cursor">▋</span>{/if}</p>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn-skip" on:click={handleSkip}>跳过 (Esc)</button>
        <button class="btn-next" on:click={skipTyping}>
          {#if isTyping}
            跳过文字
          {:else if dialog.index < dialog.lines.length - 1}
            下一句 →
          {:else}
            {dialog.type === 'pre' ? '开始部署 →' : '继续 →'}
          {/if}
        </button>
      </div>

      <div class="hint-bar">
        <span>💡 点击对话框任意位置或按空格键继续</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding-bottom: 40px;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .dialog-container {
    width: 90%;
    max-width: 900px;
    background: linear-gradient(180deg, rgba(25, 25, 45, 0.98), rgba(15, 15, 30, 0.98));
    border: 2px solid rgba(255, 204, 0, 0.4);
    border-radius: 20px;
    padding: 24px 32px 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 204, 0, 0.1);
    animation: slideUp 0.4s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .chapter-banner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: linear-gradient(135deg, rgba(100, 80, 40, 0.8), rgba(80, 60, 20, 0.8));
    border: 1px solid rgba(255, 204, 0, 0.5);
    border-radius: 20px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    color: #ffcc00;
  }

  .chapter-banner.post {
    background: linear-gradient(135deg, rgba(40, 100, 80, 0.8), rgba(20, 80, 60, 0.8));
    border-color: rgba(100, 255, 150, 0.5);
    color: #88ffaa;
  }

  .chapter-banner.pre {
    background: linear-gradient(135deg, rgba(100, 60, 40, 0.8), rgba(80, 40, 20, 0.8));
    border-color: rgba(255, 150, 100, 0.5);
    color: #ffaa88;
  }

  .banner-icon {
    font-size: 16px;
  }

  .dialog-progress {
    position: relative;
    height: 6px;
    background: rgba(60, 60, 90, 0.5);
    border-radius: 3px;
    margin-bottom: 20px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #ffcc00, #ff8800);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-label {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: 11px;
    color: #888;
    font-weight: 600;
  }

  .dialog-content {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
  }

  .character-avatar {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid;
    background: linear-gradient(135deg, rgba(50, 50, 80, 0.8), rgba(30, 30, 50, 0.8));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .avatar-icon {
    font-size: 36px;
  }

  .dialog-main {
    flex: 1;
    min-width: 0;
  }

  .character-info {
    margin-bottom: 10px;
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .character-name {
    font-size: 20px;
    font-weight: 700;
  }

  .character-title {
    font-size: 13px;
    color: #888;
    padding: 2px 8px;
    background: rgba(60, 60, 90, 0.4);
    border-radius: 4px;
  }

  .dialog-text {
    font-size: 17px;
    line-height: 1.7;
    color: #e0e0e0;
    margin: 0;
    min-height: 80px;
  }

  .cursor {
    animation: blink 0.8s infinite;
    color: #ffcc00;
    margin-left: 2px;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .dialog-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(100, 100, 150, 0.2);
  }

  .btn-skip {
    padding: 10px 20px;
    background: rgba(60, 60, 90, 0.5);
    border: 1px solid rgba(150, 150, 200, 0.3);
    border-radius: 8px;
    color: #aaa;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-skip:hover {
    background: rgba(80, 80, 120, 0.6);
    color: #ddd;
  }

  .btn-next {
    padding: 12px 28px;
    background: linear-gradient(135deg, #cc9900, #aa7700);
    border: 1px solid rgba(255, 204, 0, 0.6);
    border-radius: 8px;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(204, 153, 0, 0.3);
  }

  .btn-next:hover {
    background: linear-gradient(135deg, #ddaa00, #bb8800);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(204, 153, 0, 0.4);
  }

  .hint-bar {
    text-align: center;
    padding-top: 12px;
    font-size: 12px;
    color: #666;
  }
</style>
