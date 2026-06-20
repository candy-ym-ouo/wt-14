import { writable, derived, get } from 'svelte/store';
import { BOARD_CONFIG, TERRAIN_MAP } from '$lib/config/board.js';
import { UNIT_TYPES, INITIAL_UNITS } from '$lib/config/units.js';
import { EVENT_CARDS, EVENT_CARD_CONFIG } from '$lib/config/eventCards.js';
import { GAME_RULES, WIN_CONDITIONS } from '$lib/config/gameRules.js';

let unitIdCounter = 0;

function createUnit(type, player, x, y) {
  const baseType = UNIT_TYPES[type];
  return {
    id: `unit_${++unitIdCounter}`,
    type,
    player,
    x,
    y,
    hp: baseType.hp,
    maxHp: baseType.hp,
    attack: baseType.attack,
    defense: baseType.defense,
    moveRange: baseType.moveRange,
    attackRange: baseType.attackRange,
    hasMoved: false,
    hasAttacked: false,
    tempBuffs: { attack: 0, defense: 0, moveRange: 0 }
  };
}

function createInitialState() {
  unitIdCounter = 0;
  const units = [];
  
  INITIAL_UNITS.red.forEach(u => {
    units.push(createUnit(u.type, 'red', u.x, u.y));
  });
  INITIAL_UNITS.blue.forEach(u => {
    units.push(createUnit(u.type, 'blue', u.x, u.y));
  });

  return {
    units,
    currentPlayer: GAME_RULES.startingPlayer,
    turn: 1,
    actionsRemaining: GAME_RULES.actionsPerTurn,
    selectedUnitId: null,
    validMoveTiles: [],
    validAttackTiles: [],
    eventHand: [],
    eventDeck: shuffleDeck([...EVENT_CARDS]),
    cardsPlayedThisTurn: 0,
    baseCaptureProgress: {
      red: { base_blue: 0 },
      blue: { base_red: 0 }
    },
    gameOver: false,
    winner: null,
    turnHistory: [],
    extraActions: 0,
    movementLimit: null,
    revealEnemy: false
  };
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createGameStore() {
  const { subscribe, set, update } = writable(createInitialState());

  return {
    subscribe,
    selectUnit: (unitId) => update(state => {
      if (state.gameOver) return state;
      const unit = state.units.find(u => u.id === unitId);
      if (!unit || unit.player !== state.currentPlayer) return state;
      return { ...state, selectedUnitId: unitId };
    }),
    deselectUnit: () => update(state => ({
      ...state,
      selectedUnitId: null,
      validMoveTiles: [],
      validAttackTiles: []
    })),
    setValidMoves: (tiles) => update(state => ({
      ...state,
      validMoveTiles: tiles
    })),
    setValidAttacks: (tiles) => update(state => ({
      ...state,
      validAttackTiles: tiles
    })),
    moveUnit: (unitId, newX, newY) => update(state => {
      const units = state.units.map(u => 
        u.id === unitId ? { ...u, x: newX, y: newY, hasMoved: true } : u
      );
      return {
        ...state,
        units,
        selectedUnitId: unitId,
        validMoveTiles: []
      };
    }),
    applyDamage: (targetId, damage) => update(state => {
      let units = state.units.map(u => {
        if (u.id === targetId) {
          return { ...u, hp: Math.max(0, u.hp - damage) };
        }
        return u;
      });
      units = units.filter(u => u.hp > 0);
      return { ...state, units };
    }),
    healUnit: (targetId, amount) => update(state => {
      const units = state.units.map(u => {
        if (u.id === targetId) {
          return { ...u, hp: Math.min(u.maxHp, u.hp + amount) };
        }
        return u;
      });
      return { ...state, units };
    }),
    markAttacked: (unitId) => update(state => {
      const units = state.units.map(u =>
        u.id === unitId ? { ...u, hasAttacked: true } : u
      );
      return { ...state, units, validAttackTiles: [] };
    }),
    useAction: () => update(state => ({
      ...state,
      actionsRemaining: Math.max(0, state.actionsRemaining - 1)
    })),
    endTurn: () => update(state => {
      const nextPlayer = state.currentPlayer === 'red' ? 'blue' : 'red';
      const newTurn = state.currentPlayer === 'blue' ? state.turn + 1 : state.turn;
      
      const units = state.units.map(u => ({
        ...u,
        hasMoved: false,
        hasAttacked: false,
        tempBuffs: { attack: 0, defense: 0, moveRange: 0 }
      }));

      let eventHand = [...state.eventHand];
      let eventDeck = [...state.eventDeck];
      for (let i = 0; i < EVENT_CARD_CONFIG.drawPerTurn; i++) {
        if (eventHand.length < EVENT_CARD_CONFIG.handLimit && eventDeck.length > 0) {
          eventHand.push(eventDeck.shift());
        }
        if (eventDeck.length === 0) {
          eventDeck = shuffleDeck([...EVENT_CARDS]);
        }
      }

      return {
        ...state,
        units,
        currentPlayer: nextPlayer,
        turn: newTurn,
        actionsRemaining: GAME_RULES.actionsPerTurn + state.extraActions,
        extraActions: 0,
        selectedUnitId: null,
        validMoveTiles: [],
        validAttackTiles: [],
        cardsPlayedThisTurn: 0,
        eventHand,
        eventDeck,
        movementLimit: null,
        revealEnemy: false
      };
    }),
    applyEventCardEffect: (card, targetId) => update(state => {
      let newState = { ...state };
      const currentUnits = [...state.units];
      
      switch (card.effect) {
        case 'damage_random_enemy': {
          const enemies = currentUnits.filter(u => u.player !== state.currentPlayer);
          if (enemies.length > 0) {
            const target = enemies[Math.floor(Math.random() * enemies.length)];
            newState.units = currentUnits.map(u => 
              u.id === target.id ? { ...u, hp: Math.max(0, u.hp - card.value) } : u
            ).filter(u => u.hp > 0);
          }
          break;
        }
        case 'heal_random_ally': {
          const allies = currentUnits.filter(u => u.player === state.currentPlayer && u.hp < u.maxHp);
          if (allies.length > 0) {
            const target = allies[Math.floor(Math.random() * allies.length)];
            newState.units = currentUnits.map(u => 
              u.id === target.id ? { ...u, hp: Math.min(u.maxHp, u.hp + card.value) } : u
            );
          }
          break;
        }
        case 'buff_all_attack': {
          newState.units = currentUnits.map(u => 
            u.player === state.currentPlayer 
              ? { ...u, tempBuffs: { ...u.tempBuffs, attack: u.tempBuffs.attack + card.value } }
              : u
          );
          break;
        }
        case 'debuff_all_enemy_move': {
          newState.units = currentUnits.map(u => 
            u.player !== state.currentPlayer 
              ? { ...u, tempBuffs: { ...u.tempBuffs, moveRange: u.tempBuffs.moveRange - card.value } }
              : u
          );
          break;
        }
        case 'permanent_buff_attack': {
          const allies = currentUnits.filter(u => u.player === state.currentPlayer);
          if (allies.length > 0) {
            const target = allies[Math.floor(Math.random() * allies.length)];
            newState.units = currentUnits.map(u => 
              u.id === target.id ? { ...u, attack: u.attack + card.value } : u
            );
          }
          break;
        }
        case 'damage_random': {
          if (currentUnits.length > 0) {
            const target = currentUnits[Math.floor(Math.random() * currentUnits.length)];
            newState.units = currentUnits.map(u => 
              u.id === target.id ? { ...u, hp: Math.max(0, u.hp - card.value) } : u
            ).filter(u => u.hp > 0);
          }
          break;
        }
        case 'permanent_buff_all_defense': {
          newState.units = currentUnits.map(u => 
            u.player === state.currentPlayer 
              ? { ...u, defense: u.defense + card.value }
              : u
          );
          break;
        }
        case 'damage_all': {
          newState.units = currentUnits.map(u => ({
            ...u,
            hp: Math.max(0, u.hp - card.value)
          })).filter(u => u.hp > 0);
          break;
        }
        case 'reveal_enemy': {
          newState.revealEnemy = true;
          break;
        }
        case 'extra_action': {
          newState.extraActions = (newState.extraActions || 0) + card.value;
          break;
        }
        case 'limit_all_movement': {
          newState.movementLimit = card.value;
          break;
        }
        case 'heal_all_ally': {
          newState.units = currentUnits.map(u => 
            u.player === state.currentPlayer 
              ? { ...u, hp: Math.min(u.maxHp, u.hp + card.value) }
              : u
          );
          break;
        }
      }

      return newState;
    }),
    playEventCard: (cardIndex, targetId) => update(state => {
      if (state.cardsPlayedThisTurn >= EVENT_CARD_CONFIG.playPerTurn) return state;
      const card = state.eventHand[cardIndex];
      if (!card) return state;
      
      const newHand = [...state.eventHand];
      newHand.splice(cardIndex, 1);
      
      return {
        ...state,
        eventHand: newHand,
        cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1
      };
    }),
    setWinner: (winner) => update(state => ({
      ...state,
      gameOver: true,
      winner
    })),
    updateBaseCapture: (captureProgress) => update(state => ({
      ...state,
      baseCaptureProgress: captureProgress
    })),
    addTurnHistory: (entry) => update(state => ({
      ...state,
      turnHistory: [...state.turnHistory, entry]
    })),
    reset: () => set(createInitialState())
  };
}

export const gameStore = createGameStore();

export const selectedUnit = derived(gameStore, $game => {
  if (!$game.selectedUnitId) return null;
  return $game.units.find(u => u.id === $game.selectedUnitId) || null;
});

export const playerUnits = (player) => derived(gameStore, $game => 
  $game.units.filter(u => u.player === player)
);

export const getEffectiveAttack = (unit) => {
  return unit.attack + (unit.tempBuffs?.attack || 0);
};

export const getEffectiveDefense = (unit) => {
  return unit.defense + (unit.tempBuffs?.defense || 0);
};

export const getEffectiveMoveRange = (unit, movementLimit) => {
  let range = unit.moveRange + (unit.tempBuffs?.moveRange || 0);
  if (movementLimit !== null && movementLimit !== undefined) {
    range = Math.min(range, movementLimit);
  }
  return Math.max(0, range);
};

export const getTerrainAt = (x, y) => {
  if (x < 0 || x >= BOARD_CONFIG.width || y < 0 || y >= BOARD_CONFIG.height) return null;
  return TERRAIN_MAP[y][x];
};
