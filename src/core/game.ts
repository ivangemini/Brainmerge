import { BOARD_SIZE, FAMILIES, MAX_RUNTIME_TIER, SPAWN_COST } from './catalog.js';
import type { Cell, FamilyId, GameState, MergeResult, Unit } from './types.js';

let sequence = 0;

function createUnit(familyId: FamilyId, tier = 1): Unit {
  sequence += 1;
  return { id: `${familyId}-${Date.now().toString(36)}-${sequence.toString(36)}`, familyId, tier };
}

export function createInitialState(): GameState {
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => null);
  const starters: FamilyId[] = [
    'shark-sneakers', 'shark-sneakers',
    'tung-wood', 'tung-wood',
    'camera-dude', 'camera-dude',
    'coffee-ballerina', 'coffee-ballerina'
  ];
  starters.forEach((familyId, index) => {
    cells[index] = createUnit(familyId);
  });
  return {
    version: 1,
    cells,
    coins: 100,
    xp: 0,
    merges: 0,
    selectedIndex: null,
    messageKey: 'message.welcome'
  };
}

export function sanitizeState(candidate: unknown): GameState | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const state = candidate as Partial<GameState>;
  if (state.version !== 1 || !Array.isArray(state.cells) || state.cells.length !== BOARD_SIZE) return null;
  if (typeof state.coins !== 'number' || typeof state.xp !== 'number' || typeof state.merges !== 'number') return null;
  const validCells = state.cells.every((cell) => {
    if (cell === null) return true;
    if (!cell || typeof cell !== 'object') return false;
    const unit = cell as Partial<Unit>;
    return typeof unit.id === 'string'
      && FAMILIES.some((family) => family.id === unit.familyId)
      && typeof unit.tier === 'number'
      && Number.isInteger(unit.tier)
      && unit.tier >= 1
      && unit.tier <= MAX_RUNTIME_TIER;
  });
  if (!validCells) return null;
  return {
    version: 1,
    cells: state.cells as Cell[],
    coins: Math.max(0, Math.floor(state.coins)),
    xp: Math.max(0, Math.floor(state.xp)),
    merges: Math.max(0, Math.floor(state.merges)),
    selectedIndex: null,
    messageKey: null
  };
}

export function spawnUnit(state: GameState, random = Math.random): GameState {
  if (state.coins < SPAWN_COST) return { ...state, messageKey: 'message.notEnoughCoins' };
  const emptyIndexes = state.cells.flatMap((cell, index) => (cell === null ? [index] : []));
  if (emptyIndexes.length === 0) return { ...state, messageKey: 'message.boardFull' };

  const familyIndex = Math.min(FAMILIES.length - 1, Math.floor(random() * FAMILIES.length));
  const family = FAMILIES[familyIndex];
  if (!family) return state;
  const target = emptyIndexes[0];
  if (target === undefined) return state;

  const cells = state.cells.slice();
  cells[target] = createUnit(family.id, 1);
  return {
    ...state,
    cells,
    coins: state.coins - SPAWN_COST,
    selectedIndex: null,
    messageKey: 'message.spawned'
  };
}

export function moveOrMerge(state: GameState, from: number, to: number): MergeResult {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= state.cells.length || to >= state.cells.length) {
    return { state, changed: false, merged: false, reason: 'empty-source' };
  }
  if (from === to) return { state: { ...state, selectedIndex: null }, changed: false, merged: false, reason: 'same-cell' };
  const source = state.cells[from];
  if (!source) return { state, changed: false, merged: false, reason: 'empty-source' };
  const target = state.cells[to] ?? null;
  const cells = state.cells.slice();

  if (target === null) {
    cells[to] = source;
    cells[from] = null;
    return {
      state: { ...state, cells, selectedIndex: null, messageKey: 'message.moved' },
      changed: true,
      merged: false
    };
  }

  if (target.familyId !== source.familyId || target.tier !== source.tier) {
    return {
      state: { ...state, selectedIndex: null, messageKey: 'message.cannotMerge' },
      changed: false,
      merged: false,
      reason: 'mismatch'
    };
  }

  if (source.tier >= MAX_RUNTIME_TIER) {
    return {
      state: { ...state, selectedIndex: null, messageKey: 'message.nextFormNeeded' },
      changed: false,
      merged: false,
      reason: 'max-tier'
    };
  }

  const nextTier = source.tier + 1;
  cells[from] = null;
  cells[to] = createUnit(source.familyId, nextTier);
  return {
    state: {
      ...state,
      cells,
      selectedIndex: null,
      merges: state.merges + 1,
      xp: state.xp + nextTier * 8,
      coins: state.coins + nextTier * 4,
      messageKey: 'message.merged'
    },
    changed: true,
    merged: true
  };
}

export function selectCell(state: GameState, index: number | null): GameState {
  if (index === null || index < 0 || index >= state.cells.length || state.cells[index] == null) return { ...state, selectedIndex: null };
  return { ...state, selectedIndex: index };
}

export function canMerge(a: Cell, b: Cell): boolean {
  return Boolean(a && b && a.familyId === b.familyId && a.tier === b.tier && a.tier < MAX_RUNTIME_TIER);
}

export function hasAnyMerge(state: GameState): boolean {
  for (let i = 0; i < state.cells.length; i += 1) {
    const a = state.cells[i];
    if (!a) continue;
    for (let j = i + 1; j < state.cells.length; j += 1) {
      if (canMerge(a, state.cells[j] ?? null)) return true;
    }
  }
  return false;
}

export function isBoardFull(state: GameState): boolean {
  return state.cells.every(Boolean);
}

export function playerLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1);
}
