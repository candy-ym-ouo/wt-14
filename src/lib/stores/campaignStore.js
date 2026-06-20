import { writable, derived, get } from 'svelte/store';
import { CHAPTERS, getLevelById, getChapterById, getAllLevels, CHARACTERS } from '$lib/config/chapters.js';
import { UNIT_TYPES, UNIT_CLASSES } from '$lib/config/units.js';
import {
  calculateStatGrowth, applyExp, applyRarityBonus, generateRarity,
  getExpRequired, getExpToNextLevel, MAX_LEVEL, UNIT_RARITY,
  allocateStatPoint, getAvailableStatPoints, getAllocatedStats,
  canPromote, getPromotionOptions, applyPromotion, previewGrowth,
  STAT_POINTS_PER_LEVEL, PROMOTION_LEVEL, ALLOCATABLE_STATS
} from '$lib/config/unitGrowth.js';
import { RECRUIT_RULES } from '$lib/config/gameRules.js';
import { calculateClassSynergy } from '$lib/utils/gameLogic.js';
import {
  loadCampaignProgress, saveCampaignProgress, clearCampaignProgress,
  loadUnitPool, saveUnitPool, addUnitToPool, updateUnitInPool, clearUnitPool,
  isLevelUnlocked, unlockAchievement, saveGameRecord, loadSettings
} from '$lib/utils/storage.js';

function generateShopOffer(unlockedUnits) {
  const offers = [];
  for (let i = 0; i < RECRUIT_RULES.shopSize; i++) {
    const type = unlockedUnits[Math.floor(Math.random() * unlockedUnits.length)];
    const rarity = generateRarity();
    const baseStats = calculateStatGrowth(type, 1);
    const rarityMultiplier = RECRUIT_RULES.rarityCostMultiplier[rarity] || 1.0;
    const baseCost = UNIT_TYPES[type]?.recruitCost || 50;
    const cost = Math.floor(baseCost * rarityMultiplier);

    let unit = {
      type,
      rarity,
      level: 1,
      exp: 0,
      statPoints: 0,
      allocatedStats: { hp: 0, attack: 0, defense: 0 },
      ...baseStats,
      maxHp: baseStats.hp
    };
    unit = applyRarityBonus(unit, rarity);

    offers.push({
      offerId: `offer_${Date.now()}_${i}`,
      ...unit,
      name: `${UNIT_TYPES[type].name}·新兵`,
      cost
    });
  }
  return offers;
}

function createInitialCampaignState() {
  const progress = loadCampaignProgress();
  const unitPool = loadUnitPool();
  const settings = loadSettings();

  return {
    view: 'menu',
    selectedChapterId: progress.currentChapterId,
    selectedLevelId: progress.currentLevelId,
    dialog: {
      active: false,
      type: null,
      index: 0,
      lines: [],
      levelId: null,
      chapterId: null
    },
    battle: {
      active: false,
      levelId: null,
      chapterId: null,
      deployedUnits: [],
      battleStartUnits: [],
      killedEnemies: [],
      damageDealt: [],
      objectivesCompleted: [],
      synergyEffects: null,
      activeSynergies: []
    },
    rewards: {
      active: false,
      data: null
    },
    shop: {
      offers: generateShopOffer(progress.unlockedUnits),
      refreshedThisSession: 0
    },
    ruins: {
      active: false,
      selectedUnits: [],
      startFloor: 1,
      settlement: null
    },
    progress,
    unitPool,
    settings,
    notification: null,
    isLoading: false
  };
}

function createCampaignStore() {
  const { subscribe, set, update } = writable(createInitialCampaignState());

  function showNotification(message, type = 'info') {
    update(state => ({
      ...state,
      notification: { message, type, id: Date.now() }
    }));
    setTimeout(() => {
      update(state => ({ ...state, notification: null }));
    }, 3000);
  }

  function autoSave(state) {
    if (state.settings.autoSave) {
      saveCampaignProgress(state.progress);
      saveUnitPool(state.unitPool);
    }
  }

  return {
    subscribe,

    setView: (view) => update(state => ({ ...state, view })),

    selectChapter: (chapterId) => update(state => {
      const chapter = getChapterById(chapterId);
      if (!chapter) return state;
      const isUnlocked = state.progress.unlockedChapters.includes(chapterId);
      if (!isUnlocked) {
        showNotification('该章节尚未解锁', 'warning');
        return state;
      }
      return {
        ...state,
        selectedChapterId: chapterId,
        view: 'chapter_map'
      };
    }),

    selectLevel: (levelId) => update(state => {
      const levelData = getLevelById(levelId);
      if (!levelData) return state;

      const unlocked = isLevelUnlocked(levelId, levelData.prerequisites, state.progress.completedLevels);
      if (!unlocked) {
        showNotification('该关卡尚未解锁，请先完成前置关卡', 'warning');
        return state;
      }

      return {
        ...state,
        selectedLevelId: levelId,
        dialog: {
          active: true,
          type: 'pre',
          index: 0,
          lines: levelData.preDialog || [],
          levelId,
          chapterId: levelData.chapterId
        }
      };
    }),

    nextDialogLine: () => update(state => {
      if (!state.dialog.active) return state;

      const { index, lines, type, levelId, chapterId } = state.dialog;

      if (index < lines.length - 1) {
        return {
          ...state,
          dialog: { ...state.dialog, index: index + 1 }
        };
      }

      if (type === 'pre') {
        return {
          ...state,
          dialog: { ...state.dialog, active: false },
          view: 'unit_deploy'
        };
      }

      if (type === 'post') {
        const levelData = getLevelById(levelId);
        const chapter = getChapterById(chapterId);
        const levelIdx = chapter.levels.findIndex(l => l.id === levelId);

        if (levelIdx === chapter.levels.length - 1 && chapter.chapterEndDialog) {
          return {
            ...state,
            dialog: {
              active: true,
              type: 'chapter_end',
              index: 0,
              lines: chapter.chapterEndDialog,
              levelId: null,
              chapterId
            }
          };
        }

        return {
          ...state,
          dialog: { ...state.dialog, active: false },
          view: 'chapter_map',
          rewards: { active: false, data: null }
        };
      }

      if (type === 'chapter_end') {
        const allLevels = getAllLevels();
        const chapter = getChapterById(chapterId);
        const lastLevel = chapter.levels[chapter.levels.length - 1];
        const lastLevelIdx = allLevels.findIndex(l => l.id === lastLevel.id);
        const hasNextChapter = lastLevelIdx < allLevels.length - 1;

        if (hasNextChapter) {
          const nextLevel = allLevels[lastLevelIdx + 1];
          const nextChapter = getChapterById(nextLevel.chapterId);
          const newUnlocked = [...new Set([...state.progress.unlockedChapters, nextChapter.id])];

          return {
            ...state,
            dialog: { ...state.dialog, active: false },
            view: 'chapter_map',
            selectedChapterId: nextChapter.id,
            progress: { ...state.progress, unlockedChapters: newUnlocked },
            rewards: { active: false, data: null }
          };
        }

        return {
          ...state,
          dialog: { ...state.dialog, active: false },
          view: 'chapter_map',
          rewards: { active: false, data: null }
        };
      }

      return { ...state, dialog: { ...state.dialog, active: false } };
    }),

    skipDialog: () => update(state => {
      if (!state.dialog.active) return state;

      const { type, levelId, chapterId } = state.dialog;

      if (type === 'pre') {
        return {
          ...state,
          dialog: { ...state.dialog, active: false },
          view: 'unit_deploy'
        };
      }

      if (type === 'post') {
        const levelData = getLevelById(levelId);
        const chapter = getChapterById(chapterId);
        const levelIdx = chapter.levels.findIndex(l => l.id === levelId);

        if (levelIdx === chapter.levels.length - 1 && chapter.chapterEndDialog) {
          return {
            ...state,
            dialog: {
              active: true,
              type: 'chapter_end',
              index: 0,
              lines: chapter.chapterEndDialog,
              levelId: null,
              chapterId
            }
          };
        }

        return {
          ...state,
          dialog: { ...state.dialog, active: false },
          view: 'chapter_map',
          rewards: { active: false, data: null }
        };
      }

      return {
        ...state,
        dialog: { ...state.dialog, active: false },
        view: 'chapter_map',
        rewards: { active: false, data: null }
      };
    }),

    deployUnits: (selectedUnits) => update(state => {
      const levelData = getLevelById(state.selectedLevelId);
      if (!levelData) return state;

      const synergy = calculateClassSynergy(selectedUnits);

      const buffedUnits = selectedUnits.map(unit => {
        if (unit.player !== 'red') return unit;
        return {
          ...unit,
          attack: unit.attack + (synergy.effects.attack || 0),
          defense: unit.defense + (synergy.effects.defense || 0),
          maxHp: unit.maxHp + (synergy.effects.maxHp || 0),
          hp: Math.min(unit.hp + (synergy.effects.maxHp || 0), unit.maxHp + (synergy.effects.maxHp || 0)),
          moveRange: unit.moveRange + (synergy.effects.moveRange || 0)
        };
      });

      return {
        ...state,
        view: 'battle',
        battle: {
          active: true,
          levelId: state.selectedLevelId,
          chapterId: levelData.chapterId,
          deployedUnits: buffedUnits,
          battleStartUnits: JSON.parse(JSON.stringify(buffedUnits)),
          killedEnemies: [],
          damageDealt: [],
          objectivesCompleted: [],
          synergyEffects: synergy.effects,
          activeSynergies: synergy.synergies,
          classCounts: synergy.classCounts
        }
      };
    }),

    recordBattleData: (data) => update(state => {
      if (!state.battle.active) return state;

      return {
        ...state,
        battle: {
          ...state.battle,
          killedEnemies: data.killedEnemies || state.battle.killedEnemies,
          damageDealt: data.damageDealt || state.battle.damageDealt,
          objectivesCompleted: data.objectivesCompleted || state.battle.objectivesCompleted
        }
      };
    }),

    completeBattle: (result) => update(state => {
      if (!state.battle.active) return state;

      const levelData = getLevelById(state.battle.levelId);
      const chapter = getChapterById(state.battle.chapterId);
      const won = result.winner === 'red';

      saveGameRecord({
        ...result,
        levelId: state.battle.levelId,
        chapterId: state.battle.chapterId
      });

      const newProgress = { ...state.progress };
      newProgress.battleCount += 1;
      if (won) {
        newProgress.victories += 1;
        if (!newProgress.completedLevels.includes(state.battle.levelId)) {
          newProgress.completedLevels.push(state.battle.levelId);
        }
        newProgress.gold += levelData.rewards.gold;
        newProgress.totalExp += levelData.rewards.exp;
        if (newProgress.victories === 1) unlockAchievement('first_victory');

        const lastLevel = chapter.levels[chapter.levels.length - 1];
        if (lastLevel.id === state.battle.levelId) {
          if (chapter.id === 'chapter_1') unlockAchievement('chapter_1_complete');
          if (chapter.id === 'chapter_2') unlockAchievement('chapter_2_complete');
        }
      } else {
        newProgress.defeats += 1;
      }

      const levelUnits = state.battle.deployedUnits;
      const killedEnemies = state.battle.killedEnemies;
      const damageDealt = state.battle.damageDealt;
      const objectivesCompleted = state.battle.objectivesCompleted;

      const expByUnit = {};
      levelUnits.forEach(unit => {
        if (unit.player !== 'red') return;
        expByUnit[unit.poolUid] = expByUnit[unit.poolUid] || { exp: 0, kills: 0, damage: 0 };
      });

      killedEnemies.forEach(enemy => {
        const killerUid = enemy.killedByPoolUid;
        if (killerUid && expByUnit[killerUid]) {
          const killExp = { scout: 15, infantry: 25, archer: 30, knight: 50, mage: 45 }[enemy.type] || 20;
          expByUnit[killerUid].exp += killExp;
          expByUnit[killerUid].kills += 1;
        }
      });

      damageDealt.forEach(dmg => {
        if (expByUnit[dmg.poolUid]) {
          expByUnit[dmg.poolUid].exp += dmg.amount * 2;
          expByUnit[dmg.poolUid].damage += dmg.amount;
        }
      });

      if (won) {
        Object.keys(expByUnit).forEach(uid => {
          expByUnit[uid].exp += 50 + 100 * objectivesCompleted.length;
        });
      }

      const newUnitPool = { ...state.unitPool };
      const leveledUpUnits = [];

      newUnitPool.units = newUnitPool.units.map(poolUnit => {
        if (!expByUnit[poolUnit.uid]) return poolUnit;

        const expGain = expByUnit[poolUnit.uid].exp;
        let currentExp = (poolUnit.exp || 0) + expGain;
        let level = poolUnit.level || 1;
        let levelsGained = 0;

        while (level < MAX_LEVEL && currentExp >= getExpRequired(level)) {
          currentExp -= getExpRequired(level);
          level += 1;
          levelsGained += 1;
        }

        const newStats = calculateStatGrowth(poolUnit.type, level);
        const leveled = levelsGained > 0;

        if (leveled) {
          leveledUpUnits.push({
            ...poolUnit,
            level,
            levelsGained,
            oldStats: {
              hp: poolUnit.maxHp,
              attack: poolUnit.attack,
              defense: poolUnit.defense
            },
            newStats
          });
          if (level >= MAX_LEVEL) unlockAchievement('max_level_unit');
        }

        return {
          ...poolUnit,
          level,
          exp: currentExp,
          maxHp: newStats.hp,
          attack: newStats.attack,
          defense: newStats.defense,
          moveRange: newStats.moveRange,
          attackRange: newStats.attackRange
        };
      });

      const newUnlockedUnits = [...newProgress.unlockedUnits];
      const newRewardUnits = [];

      if (won && levelData.rewards.unlockUnits && levelData.rewards.unlockUnits.length > 0) {
        levelData.rewards.unlockUnits.forEach(unitType => {
          if (!newUnlockedUnits.includes(unitType)) {
            newUnlockedUnits.push(unitType);

            const baseStats = calculateStatGrowth(unitType, 1);
            const rarity = generateRarity();
            let newUnit = {
              uid: null,
              type: unitType,
              name: `${UNIT_TYPES[unitType].name}·新兵`,
              level: 1,
              exp: 0,
              rarity,
              ...baseStats,
              maxHp: baseStats.hp
            };
            newUnit = applyRarityBonus(newUnit, rarity);

            newUnit.uid = `pool_${newUnitPool.nextUnitId++}`;
            newUnitPool.units.push(newUnit);
            newRewardUnits.push(newUnit);

            if (rarity === 'legendary') unlockAchievement('legendary_unit');
          }
        });

        if (newUnlockedUnits.length >= Object.keys(UNIT_TYPES).length) {
          unlockAchievement('all_units_unlocked');
        }
      }

      newProgress.unlockedUnits = newUnlockedUnits;

      if (won && result.turns <= Math.floor(levelData.maxTurns / 2)) {
        unlockAchievement('speed_runner');
      }

      if (won && result.redUnits === state.battle.battleStartUnits.filter(u => u.player === 'red').length) {
        unlockAchievement('perfect_battle');
      }

      const newState = {
        ...state,
        progress: newProgress,
        unitPool: newUnitPool,
        battle: { ...state.battle, active: false },
        rewards: {
          active: won,
          data: won ? {
            exp: levelData.rewards.exp,
            gold: levelData.rewards.gold,
            units: newRewardUnits,
            leveledUp: leveledUpUnits,
            objectivesCompleted,
            expByUnit: Object.keys(expByUnit).map(uid => ({
              uid,
              ...expByUnit[uid],
              unit: newUnitPool.units.find(u => u.uid === uid)
            })).filter(r => r.unit)
          } : null
        }
      };

      if (won) {
        newState.dialog = {
          active: true,
          type: 'post',
          index: 0,
          lines: levelData.postDialog || [],
          levelId: state.battle.levelId,
          chapterId: state.battle.chapterId
        };
      }

      autoSave(newState);
      if (won) showNotification(`胜利！获得 ${levelData.rewards.exp} 经验，${levelData.rewards.gold} 金币`, 'success');
      else showNotification('战斗失败，再接再厉！', 'error');

      return newState;
    }),

    addNewUnit: (unitType, options = {}) => update(state => {
      if (!state.progress.unlockedUnits.includes(unitType)) {
        showNotification('该单位尚未解锁', 'warning');
        return state;
      }

      if (state.unitPool.units.length >= RECRUIT_RULES.maxRosterSize) {
        showNotification(`阵容已满（上限${RECRUIT_RULES.maxRosterSize}），请先解散一些单位`, 'warning');
        return state;
      }

      const baseStats = calculateStatGrowth(unitType, 1);
      const rarity = options.rarity || generateRarity();
      let newUnit = {
        type: unitType,
        name: options.name || `${UNIT_TYPES[unitType].name}·新兵`,
        level: 1,
        exp: 0,
        statPoints: 0,
        allocatedStats: { hp: 0, attack: 0, defense: 0 },
        rarity,
        ...baseStats,
        maxHp: baseStats.hp
      };
      newUnit = applyRarityBonus(newUnit, rarity);

      newUnit.uid = `pool_${state.unitPool.nextUnitId++}`;
      const newPool = {
        ...state.unitPool,
        units: [...state.unitPool.units, newUnit]
      };

      autoSave({ ...state, unitPool: newPool });
      showNotification(`获得新单位：${newUnit.name}（${UNIT_RARITY[rarity].name}）`, 'success');

      return { ...state, unitPool: newPool };
    }),

    refreshShop: () => update(state => {
      if (state.progress.gold < RECRUIT_RULES.refreshCost) {
        showNotification(`金币不足，刷新需要 ${RECRUIT_RULES.refreshCost} 金币`, 'warning');
        return state;
      }

      const newProgress = { ...state.progress };
      newProgress.gold -= RECRUIT_RULES.refreshCost;
      newProgress.recruitStats = {
        ...newProgress.recruitStats,
        totalRefreshed: (newProgress.recruitStats?.totalRefreshed || 0) + 1,
        totalSpent: (newProgress.recruitStats?.totalSpent || 0) + RECRUIT_RULES.refreshCost
      };

      const newState = {
        ...state,
        progress: newProgress,
        shop: {
          offers: generateShopOffer(newProgress.unlockedUnits),
          refreshedThisSession: state.shop.refreshedThisSession + 1
        }
      };

      autoSave(newState);
      showNotification(`商店已刷新（消耗 ${RECRUIT_RULES.refreshCost} 金币）`, 'info');
      return newState;
    }),

    recruitUnit: (offerId) => update(state => {
      const offer = state.shop.offers.find(o => o.offerId === offerId);
      if (!offer) {
        showNotification('该招募已失效', 'warning');
        return state;
      }

      if (state.progress.gold < offer.cost) {
        showNotification(`金币不足，需要 ${offer.cost} 金币`, 'warning');
        return state;
      }

      if (state.unitPool.units.length >= RECRUIT_RULES.maxRosterSize) {
        showNotification(`阵容已满（上限${RECRUIT_RULES.maxRosterSize}），请先解散一些单位`, 'warning');
        return state;
      }

      const newUnit = {
        uid: `pool_${state.unitPool.nextUnitId++}`,
        type: offer.type,
        name: offer.name,
        level: offer.level,
        exp: offer.exp,
        statPoints: offer.statPoints || 0,
        allocatedStats: offer.allocatedStats || { hp: 0, attack: 0, defense: 0 },
        rarity: offer.rarity,
        maxHp: offer.maxHp,
        hp: offer.maxHp,
        attack: offer.attack,
        defense: offer.defense,
        moveRange: offer.moveRange,
        attackRange: offer.attackRange
      };

      const newPool = {
        ...state.unitPool,
        units: [...state.unitPool.units, newUnit]
      };

      const newProgress = { ...state.progress };
      newProgress.gold -= offer.cost;
      newProgress.recruitStats = {
        ...newProgress.recruitStats,
        totalRecruited: (newProgress.recruitStats?.totalRecruited || 0) + 1,
        totalSpent: (newProgress.recruitStats?.totalSpent || 0) + offer.cost,
        byRarity: {
          ...newProgress.recruitStats?.byRarity,
          [offer.rarity]: (newProgress.recruitStats?.byRarity?.[offer.rarity] || 0) + 1
        },
        byClass: {
          ...newProgress.recruitStats?.byClass,
          [UNIT_TYPES[offer.type].unitClass]: (newProgress.recruitStats?.byClass?.[UNIT_TYPES[offer.type].unitClass] || 0) + 1
        }
      };

      const newOffers = state.shop.offers.filter(o => o.offerId !== offerId);

      const newState = {
        ...state,
        progress: newProgress,
        unitPool: newPool,
        shop: { ...state.shop, offers: newOffers }
      };

      autoSave(newState);
      showNotification(`招募成功：${newUnit.name}（${UNIT_RARITY[offer.rarity].name}）`, 'success');

      if (offer.rarity === 'legendary') unlockAchievement('legendary_unit');

      return newState;
    }),

    dismissUnit: (uid) => update(state => {
      const unit = state.unitPool.units.find(u => u.uid === uid);
      if (!unit) {
        showNotification('单位不存在', 'warning');
        return state;
      }

      const baseCost = UNIT_TYPES[unit.type]?.recruitCost || 30;
      const refund = Math.floor(baseCost * 0.3 * (unit.level || 1));

      const newPool = {
        ...state.unitPool,
        units: state.unitPool.units.filter(u => u.uid !== uid)
      };

      const newProgress = { ...state.progress };
      newProgress.gold += refund;

      const newState = {
        ...state,
        progress: newProgress,
        unitPool: newPool
      };

      autoSave(newState);
      showNotification(`已解散 ${unit.name}，返还 ${refund} 金币`, 'info');
      return newState;
    }),

    allocateStat: (uid, statId) => update(state => {
      const unitIndex = state.unitPool.units.findIndex(u => u.uid === uid);
      if (unitIndex === -1) {
        showNotification('单位不存在', 'warning');
        return state;
      }

      const unit = state.unitPool.units[unitIndex];
      const available = getAvailableStatPoints(unit);
      if (available <= 0) {
        showNotification('没有可用的属性点', 'warning');
        return state;
      }

      const newUnit = allocateStatPoint(unit, statId);
      const newUnits = [...state.unitPool.units];
      newUnits[unitIndex] = newUnit;

      const newState = {
        ...state,
        unitPool: { ...state.unitPool, units: newUnits }
      };

      autoSave(newState);
      const statInfo = ALLOCATABLE_STATS.find(s => s.id === statId);
      showNotification(`已分配 1 点${statInfo?.name || statId}`, 'success');
      return newState;
    }),

    promoteUnit: (uid, promotionId) => update(state => {
      const unitIndex = state.unitPool.units.findIndex(u => u.uid === uid);
      if (unitIndex === -1) {
        showNotification('单位不存在', 'warning');
        return state;
      }

      const unit = state.unitPool.units[unitIndex];
      if (!canPromote(unit)) {
        showNotification('该单位无法转职', 'warning');
        return state;
      }

      const options = getPromotionOptions(unit.type, unit.level);
      const promo = options.find(p => p.id === promotionId);
      if (!promo) {
        showNotification('无效的转职选项', 'warning');
        return state;
      }

      const newUnit = applyPromotion(unit, promotionId);
      const newUnits = [...state.unitPool.units];
      newUnits[unitIndex] = newUnit;

      const newState = {
        ...state,
        unitPool: { ...state.unitPool, units: newUnits }
      };

      autoSave(newState);
      showNotification(`${unit.name} 转职为 ${promo.name}！`, 'success');
      return newState;
    }),

    getUnitGrowthPreview: (uid, targetLevel) => {
      const state = get(campaignStore);
      const unit = state.unitPool.units.find(u => u.uid === uid);
      if (!unit) return null;
      return previewGrowth(unit, targetLevel);
    },

    getRosterSynergy: () => {
      const state = get(campaignStore);
      return calculateClassSynergy(state.unitPool.units);
    },

    dismissReward: () => update(state => ({
      ...state,
      rewards: { active: false, data: null }
    })),

    resetProgress: () => {
      clearUnitPool();
      clearCampaignProgress();
      set(createInitialCampaignState());
      showNotification('战役进度已重置', 'info');
    },

    save: () => {
      const state = get(campaignStore);
      saveCampaignProgress(state.progress);
      saveUnitPool(state.unitPool);
      showNotification('存档成功', 'success');
    },

    load: () => {
      set(createInitialCampaignState());
      showNotification('读档成功', 'success');
    },

    startRuinsMode: () => update(state => {
      const availableUnits = state.unitPool.units.filter(u => 
        state.progress.unlockedUnits.includes(u.type)
      );
      const defaultSelected = availableUnits.slice(0, 3).map(u => u.uid);
      
      return {
        ...state,
        view: 'ruins_deploy',
        ruins: {
          ...state.ruins,
          active: true,
          selectedUnits: defaultSelected,
          startFloor: 1,
          settlement: null
        }
      };
    }),

    toggleRuinsUnit: (unitUid) => update(state => {
      const selected = [...state.ruins.selectedUnits];
      const idx = selected.indexOf(unitUid);
      
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        if (selected.length >= 6) {
          showNotification('最多只能选择 6 个单位', 'warning');
          return state;
        }
        selected.push(unitUid);
      }

      return {
        ...state,
        ruins: {
          ...state.ruins,
          selectedUnits: selected
        }
      };
    }),

    setRuinsStartFloor: (floor) => update(state => {
      return {
        ...state,
        ruins: {
          ...state.ruins,
          startFloor: Math.max(1, Math.min(5, floor))
        }
      };
    }),

    startRuinsExploration: () => update(state => {
      if (state.ruins.selectedUnits.length < 3) {
        showNotification('至少需要选择 3 个单位', 'warning');
        return state;
      }

      const selectedUnits = state.unitPool.units.filter(u => 
        state.ruins.selectedUnits.includes(u.uid)
      );

      return {
        ...state,
        view: 'ruins_battle',
        battle: {
          ...state.battle,
          active: true,
          deployedUnits: selectedUnits,
          battleStartUnits: JSON.parse(JSON.stringify(selectedUnits))
        }
      };
    }),

    completeRuinsExploration: (result) => update(state => {
      const newProgress = { ...state.progress };
      newProgress.ruinsRuns = (newProgress.ruinsRuns || 0) + 1;
      newProgress.gold += result.gold.total;
      newProgress.totalExp += result.exp;
      newProgress.ruinsBestFloor = Math.max(newProgress.ruinsBestFloor || 0, result.floorsCleared);

      const expPerUnit = Math.floor(result.exp / Math.max(1, result.units.length));
      const expByUnit = {};
      result.units.forEach(unit => {
        const poolUid = unit.poolUid || unit.uid;
        if (poolUid) {
          expByUnit[poolUid] = expPerUnit;
        }
      });

      const newUnitPool = { ...state.unitPool, units: [...state.unitPool.units] };
      const leveledUpUnits = [];

      newUnitPool.units = newUnitPool.units.map(poolUnit => {
        if (!expByUnit[poolUnit.uid]) return poolUnit;

        const expGain = expByUnit[poolUnit.uid];
        let currentExp = (poolUnit.exp || 0) + expGain;
        let level = poolUnit.level || 1;
        let levelsGained = 0;

        while (level < MAX_LEVEL && currentExp >= getExpRequired(level)) {
          currentExp -= getExpRequired(level);
          level += 1;
          levelsGained += 1;
        }

        const newStats = calculateStatGrowth(poolUnit.type, level);
        const leveled = levelsGained > 0;

        if (leveled) {
          leveledUpUnits.push({
            ...poolUnit,
            level,
            levelsGained,
            oldStats: {
              hp: poolUnit.maxHp,
              attack: poolUnit.attack,
              defense: poolUnit.defense
            },
            newStats
          });
        }

        return {
          ...poolUnit,
          level,
          exp: currentExp,
          maxHp: newStats.hp,
          hp: newStats.hp,
          attack: newStats.attack,
          defense: newStats.defense,
          moveRange: newStats.moveRange,
          attackRange: newStats.attackRange
        };
      });

      const classCounts = {};
      result.units.forEach(u => {
        classCounts[u.type] = (classCounts[u.type] || 0) + 1;
      });

      saveGameRecord({
        winner: result.success ? 'red' : 'blue',
        turns: result.turns || 0,
        redUnits: result.survivedUnits,
        blueUnits: result.units ? 0 : 0,
        mode: 'ruins',
        synergies: [],
        classCounts,
        ruins: {
          floorsCleared: result.floorsCleared,
          totalUnits: result.totalUnits,
          survivedUnits: result.survivedUnits,
          killedEnemies: result.killedEnemies,
          treasuresCollected: result.treasuresCollected,
          gold: result.gold.total,
          exp: result.exp,
          success: result.success
        }
      });

      saveCampaignProgress(newProgress);
      saveUnitPool(newUnitPool);

      const newState = {
        ...state,
        progress: newProgress,
        unitPool: newUnitPool,
        view: 'ruins_settlement',
        ruins: {
          ...state.ruins,
          active: false,
          settlement: {
            ...result,
            leveledUp: leveledUpUnits
          }
        },
        battle: { ...state.battle, active: false }
      };

      autoSave(newState);
      if (result.success) {
        showNotification(`遗迹探索成功！获得 ${result.gold.total} 金币`, 'success');
      } else {
        showNotification(`遗迹探索结束，获得 ${result.gold.total} 金币`, 'info');
      }

      return newState;
    }),

    exitRuinsMode: () => update(state => {
      return {
        ...state,
        view: 'menu',
        ruins: {
          active: false,
          selectedUnits: [],
          startFloor: 1,
          settlement: null
        }
      };
    }),

    _autoSave: autoSave,
    _showNotification: showNotification
  };
}

export const campaignStore = createCampaignStore();

export const currentChapter = derived(campaignStore, $campaign => {
  return getChapterById($campaign.selectedChapterId) || null;
});

export const currentLevel = derived(campaignStore, $campaign => {
  return getLevelById($campaign.selectedLevelId) || null;
});

export const currentDialogLine = derived(campaignStore, $campaign => {
  if (!$campaign.dialog.active) return null;
  const line = $campaign.dialog.lines[$campaign.dialog.index];
  if (!line) return null;
  const character = CHARACTERS[line.character] || CHARACTERS.narrator;
  return { ...line, character };
});

export const availableUnits = derived(campaignStore, $campaign => {
  return $campaign.unitPool.units.filter(u =>
    $campaign.progress.unlockedUnits.includes(u.type)
  );
});

export const getUnitByUid = (uid) => derived(campaignStore, $campaign =>
  $campaign.unitPool.units.find(u => u.uid === uid) || null
);

export const chapterProgress = derived(campaignStore, $campaign => {
  const result = {};
  CHAPTERS.forEach(chapter => {
    const total = chapter.levels.length;
    const completed = chapter.levels.filter(l =>
      $campaign.progress.completedLevels.includes(l.id)
    ).length;
    result[chapter.id] = {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      isUnlocked: $campaign.progress.unlockedChapters.includes(chapter.id)
    };
  });
  return result;
});

export const levelStatusMap = derived(campaignStore, $campaign => {
  const map = {};
  getAllLevels().forEach(level => {
    const completed = $campaign.progress.completedLevels.includes(level.id);
    const unlocked = isLevelUnlocked(level.id, level.prerequisites, $campaign.progress.completedLevels);
    map[level.id] = { completed, unlocked };
  });
  return map;
});

export const rosterSynergy = derived(campaignStore, $campaign => {
  return calculateClassSynergy($campaign.unitPool.units);
});

export const shopOffers = derived(campaignStore, $campaign => {
  return $campaign.shop.offers;
});
