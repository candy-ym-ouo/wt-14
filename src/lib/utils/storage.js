const RECORDS_KEY = 'tactical_game_records';
const CAMPAIGN_KEY = 'tactical_campaign_save';
const UNIT_POOL_KEY = 'tactical_unit_pool';
const ACHIEVEMENTS_KEY = 'tactical_achievements';
const GAME_SETTINGS_KEY = 'tactical_settings';

export function saveGameRecord(result) {
  try {
    const records = loadGameRecords();
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      winner: result.winner,
      turns: result.turns,
      redUnitsRemaining: result.redUnits,
      blueUnitsRemaining: result.blueUnits,
      levelId: result.levelId || null,
      chapterId: result.chapterId || null,
      synergies: result.synergies || [],
      classCounts: result.classCounts || {}
    };
    records.unshift(record);
    const trimmed = records.slice(0, 100);
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
  const campaign = loadCampaignProgress();
  const stats = {
    totalGames: records.length,
    redWins: 0,
    blueWins: 0,
    draws: 0,
    avgTurns: 0,
    campaignWins: 0,
    campaignLosses: 0,
    gold: campaign.gold || 0,
    recruitStats: campaign.recruitStats || {
      totalRecruited: 0,
      totalSpent: 0,
      totalRefreshed: 0,
      byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
      byClass: { scout: 0, infantry: 0, archer: 0, knight: 0, mage: 0 }
    }
  };

  if (records.length === 0) return stats;

  let totalTurns = 0;
  records.forEach(r => {
    if (r.winner === 'red') stats.redWins++;
    else if (r.winner === 'blue') stats.blueWins++;
    else stats.draws++;
    totalTurns += r.turns || 0;
    if (r.levelId) {
      if (r.winner === 'red') stats.campaignWins++;
      else if (r.winner === 'blue') stats.campaignLosses++;
    }
  });
  stats.avgTurns = Math.round(totalTurns / records.length);

  return stats;
}

export function getLevelRecords(levelId) {
  const records = loadGameRecords();
  return records.filter(r => r.levelId === levelId);
}

export function saveCampaignProgress(progress) {
  try {
    const saveData = {
      ...progress,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('保存战役进度失败:', e);
    return false;
  }
}

export function loadCampaignProgress() {
  try {
    const data = localStorage.getItem(CAMPAIGN_KEY);
    if (!data) return createDefaultCampaignProgress();
    const parsed = JSON.parse(data);
    return { ...createDefaultCampaignProgress(), ...parsed };
  } catch (e) {
    console.error('读取战役进度失败:', e);
    return createDefaultCampaignProgress();
  }
}

function createDefaultCampaignProgress() {
  return {
    currentChapterId: 'chapter_1',
    currentLevelId: null,
    completedLevels: [],
    unlockedChapters: ['chapter_1'],
    unlockedUnits: ['scout', 'infantry', 'archer'],
    gold: 100,
    totalExp: 0,
    playTime: 0,
    battleCount: 0,
    victories: 0,
    defeats: 0,
    lastSaved: null,
    recruitStats: {
      totalRecruited: 0,
      totalSpent: 0,
      totalRefreshed: 0,
      byRarity: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
      byClass: { scout: 0, infantry: 0, archer: 0, knight: 0, mage: 0 }
    }
  };
}

export function clearCampaignProgress() {
  try {
    localStorage.removeItem(CAMPAIGN_KEY);
    return true;
  } catch (e) {
    console.error('清除战役进度失败:', e);
    return false;
  }
}

export function isLevelUnlocked(levelId, prerequisites, completedLevels) {
  if (!prerequisites || prerequisites.length === 0) return true;
  return prerequisites.every(prereq => completedLevels.includes(prereq));
}

export function isChapterUnlocked(chapterId, unlockRequirement, completedLevels) {
  if (!unlockRequirement) return true;
  const chapter = CHAPTERS_DUMMY.find(c => c.id === unlockRequirement);
  if (!chapter) return false;
  const lastLevel = chapter.levels[chapter.levels.length - 1];
  return completedLevels.includes(lastLevel.id);
}

const CHAPTERS_DUMMY = [
  { id: 'chapter_1', levels: [{ id: 'level_1_3' }] },
  { id: 'chapter_2', levels: [{ id: 'level_2_3' }] }
];

export function saveUnitPool(unitPool) {
  try {
    localStorage.setItem(UNIT_POOL_KEY, JSON.stringify(unitPool));
    return true;
  } catch (e) {
    console.error('保存单位池失败:', e);
    return false;
  }
}

export function loadUnitPool() {
  try {
    const data = localStorage.getItem(UNIT_POOL_KEY);
    return data ? JSON.parse(data) : createDefaultUnitPool();
  } catch (e) {
    console.error('读取单位池失败:', e);
    return createDefaultUnitPool();
  }
}

function createDefaultUnitPool() {
  const defaultUnits = [
    {
      uid: 'pool_1',
      type: 'scout',
      name: '侦察兵·新兵',
      level: 1,
      exp: 0,
      rarity: 'common',
      maxHp: 8,
      hp: 8,
      attack: 3,
      defense: 1,
      moveRange: 4,
      attackRange: 1
    },
    {
      uid: 'pool_2',
      type: 'infantry',
      name: '步兵·新兵',
      level: 1,
      exp: 0,
      rarity: 'common',
      maxHp: 12,
      hp: 12,
      attack: 4,
      defense: 3,
      moveRange: 2,
      attackRange: 1
    },
    {
      uid: 'pool_3',
      type: 'archer',
      name: '弓箭手·新兵',
      level: 1,
      exp: 0,
      rarity: 'common',
      maxHp: 7,
      hp: 7,
      attack: 5,
      defense: 1,
      moveRange: 3,
      attackRange: 3
    },
    {
      uid: 'pool_4',
      type: 'knight',
      name: '骑士·新兵',
      level: 1,
      exp: 0,
      rarity: 'uncommon',
      maxHp: 15,
      hp: 15,
      attack: 6,
      defense: 4,
      moveRange: 3,
      attackRange: 1
    },
    {
      uid: 'pool_5',
      type: 'mage',
      name: '法师·新兵',
      level: 1,
      exp: 0,
      rarity: 'uncommon',
      maxHp: 6,
      hp: 6,
      attack: 7,
      defense: 1,
      moveRange: 2,
      attackRange: 2
    }
  ];
  
  return {
    units: defaultUnits,
    nextUnitId: 6
  };
}

export function addUnitToPool(unit) {
  const pool = loadUnitPool();
  const newUnit = {
    ...unit,
    uid: `pool_${pool.nextUnitId++}`
  };
  pool.units.push(newUnit);
  saveUnitPool(pool);
  return newUnit;
}

export function updateUnitInPool(uid, updates) {
  const pool = loadUnitPool();
  const idx = pool.units.findIndex(u => u.uid === uid);
  if (idx !== -1) {
    pool.units[idx] = { ...pool.units[idx], ...updates };
    saveUnitPool(pool);
    return pool.units[idx];
  }
  return null;
}

export function removeUnitFromPool(uid) {
  const pool = loadUnitPool();
  pool.units = pool.units.filter(u => u.uid !== uid);
  saveUnitPool(pool);
  return true;
}

export function clearUnitPool() {
  try {
    localStorage.removeItem(UNIT_POOL_KEY);
    return true;
  } catch (e) {
    console.error('清除单位池失败:', e);
    return false;
  }
}

export function saveAchievements(achievements) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return true;
  } catch (e) {
    console.error('保存成就失败:', e);
    return false;
  }
}

export function loadAchievements() {
  try {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : createDefaultAchievements();
  } catch (e) {
    console.error('读取成就失败:', e);
    return createDefaultAchievements();
  }
}

function createDefaultAchievements() {
  return {
    first_blood: { unlocked: false, unlockedAt: null },
    first_victory: { unlocked: false, unlockedAt: null },
    chapter_1_complete: { unlocked: false, unlockedAt: null },
    chapter_2_complete: { unlocked: false, unlockedAt: null },
    max_level_unit: { unlocked: false, unlockedAt: null },
    legendary_unit: { unlocked: false, unlockedAt: null },
    perfect_battle: { unlocked: false, unlockedAt: null },
    speed_runner: { unlocked: false, unlockedAt: null },
    all_units_unlocked: { unlocked: false, unlockedAt: null }
  };
}

export function unlockAchievement(id) {
  const achievements = loadAchievements();
  if (achievements[id] && !achievements[id].unlocked) {
    achievements[id].unlocked = true;
    achievements[id].unlockedAt = new Date().toISOString();
    saveAchievements(achievements);
    return achievements[id];
  }
  return null;
}

export function clearAchievements() {
  try {
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    return true;
  } catch (e) {
    console.error('清除成就失败:', e);
    return false;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('保存设置失败:', e);
    return false;
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(GAME_SETTINGS_KEY);
    return data ? JSON.parse(data) : createDefaultSettings();
  } catch (e) {
    console.error('读取设置失败:', e);
    return createDefaultSettings();
  }
}

function createDefaultSettings() {
  return {
    soundEnabled: true,
    musicEnabled: true,
    volume: 80,
    animationSpeed: 1,
    showGrid: true,
    showDamageNumbers: true,
    autoSave: true,
    difficulty: 'normal'
  };
}

export function clearAllData() {
  try {
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(CAMPAIGN_KEY);
    localStorage.removeItem(UNIT_POOL_KEY);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(GAME_SETTINGS_KEY);
    return true;
  } catch (e) {
    console.error('清除全部数据失败:', e);
    return false;
  }
}

export function exportAllData() {
  try {
    const data = {
      records: loadGameRecords(),
      campaign: loadCampaignProgress(),
      unitPool: loadUnitPool(),
      achievements: loadAchievements(),
      settings: loadSettings(),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('导出数据失败:', e);
    return null;
  }
}

export function importAllData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.records) localStorage.setItem(RECORDS_KEY, JSON.stringify(data.records));
    if (data.campaign) localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(data.campaign));
    if (data.unitPool) localStorage.setItem(UNIT_POOL_KEY, JSON.stringify(data.unitPool));
    if (data.achievements) localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data.achievements));
    if (data.settings) localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(data.settings));
    return true;
  } catch (e) {
    console.error('导入数据失败:', e);
    return false;
  }
}
