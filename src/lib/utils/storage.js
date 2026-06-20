const RECORDS_KEY = 'tactical_game_records';

export function saveGameRecord(result) {
  try {
    const records = loadGameRecords();
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      winner: result.winner,
      turns: result.turns,
      redUnitsRemaining: result.redUnits,
      blueUnitsRemaining: result.blueUnits
    };
    records.unshift(record);
    const trimmed = records.slice(0, 50);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(trimmed));
    return record;
  } catch (e) {
    console.error('保存记录失败:', e);
    return null;
  }
}

export function loadGameRecords() {
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取记录失败:', e);
    return [];
  }
}

export function clearGameRecords() {
  try {
    localStorage.removeItem(RECORDS_KEY);
    return true;
  } catch (e) {
    console.error('清除记录失败:', e);
    return false;
  }
}

export function getStats() {
  const records = loadGameRecords();
  const stats = {
    totalGames: records.length,
    redWins: 0,
    blueWins: 0,
    draws: 0,
    avgTurns: 0
  };
  
  if (records.length === 0) return stats;
  
  let totalTurns = 0;
  records.forEach(r => {
    if (r.winner === 'red') stats.redWins++;
    else if (r.winner === 'blue') stats.blueWins++;
    else stats.draws++;
    totalTurns += r.turns || 0;
  });
  stats.avgTurns = Math.round(totalTurns / records.length);
  
  return stats;
}
