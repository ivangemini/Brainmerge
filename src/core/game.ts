import {
  BOARD_SIZE,
  DEADLOCK_RESCUE_REFUND,
  FAMILIES,
  FIRST_MISSION_REWARD,
  FIRST_MISSION_TARGET,
  MAX_RUNTIME_TIER,
  SPAWN_COST
} from './catalog.js';
import type { Cell, FamilyId, GameState, MergeResult, OnboardingPhase, Unit } from './types.js';

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
    version: 2,
    cells,
    coins: 100,
    xp: 0,
    merges: 0,
    spawns: 0,
    missionClaimed: false,
    selectedIndex: null,
    messageKey: 'message.welcome'
  };
}

export function sanitizeState(candidate: unknown): GameState | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const state = candidate as Record<string, unknown>;
  if ((state.version !== 1 && state.version !== 2) || !Array.isArray(state.cells) || state.cells.length !== BOARD_SIZE) return null;
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

  const spawns = state.version === 2 && typeof state.spawns === 'number' ? Math.max(0, Math.floor(state.spawns)) : 0;
  const missionClaimed = state.version === 2 && state.missionClaimed === true;

  return {
    version: 2,
    cells: state.cells as Cell[],
    coins: Math.max(0, Math.floor(state.coins)),
    xp: Math.max(0, Math.floor(state.xp)),
    merges: Math.max(0, Math.floor(state.merges)),
    spawns,
    missionClaimed,
    selectedIndex: null,
    messageKey: null
  };
}

export function spawnUnit(state: GameState, random = Math.random, free = false): GameState {
  const cost = free ? 0 : SPAWN_COST;
  if (state.coins < cost) return { ...state, messageKey: 'message.notEnoughCoins' };
  const emptyIndexes = state.cells.flatMap((cell, index) => (cell === null ? [index] : []));
  if (emptyIndexes.length === 0) return { ...state, messageKey: 'message.boardFull' };

  const familyIndex = Math.min(FAMILIES.length - 1, Math.floor(random() * FAMILIES.length));
  const family = FAMILIES[familyIndex];
  const target = emptyIndexes[0];
  if (!family || target === undefined) return state;

  const cells = state.cells.slice();
  cells[target] = createUnit(family.id, 1);
  return {
    ...state,
    cells,
    coins: state.coins - cost,
    spawns: state.spawns + 1,
    selectedIndex: null,
    messageKey: free ? 'message.rewardedSpawn' : 'message.spawned'
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

export function findFirstMergePair(state: GameState): readonly [number, number] | null {
  for (let i = 0; i < state.cells.length; i += 1) {
    const a = state.cells[i];
    if (!a) continue;
    for (let j = i + 1; j < state.cells.length; j += 1) {
      if (canMerge(a, state.cells[j] ?? null)) return [i, j] as const;
    }
  }
  return null;
}

export function hasAnyMerge(state: GameState): boolean {
  return findFirstMergePair(state) !== null;
}

export function isBoardFull(state: GameState): boolean {
  return state.cells.every(Boolean);
}

export function isDeadlocked(state: GameState): boolean {
  return isBoardFull(state) && !hasAnyMerge(state);
}

export function rescueDeadlock(state: GameState): GameState {
  if (!isDeadlocked(state)) return state;
  let lowestTier = Number.POSITIVE_INFINITY;
  let targetIndex = -1;
  state.cells.forEach((cell, index) => {
    if (cell && cell.tier < lowestTier) {
      lowestTier = cell.tier;
      targetIndex = index;
    }
  });
  if (targetIndex < 0) return state;
  const cells = state.cells.slice();
  cells[targetIndex] = null;
  return {
    ...state,
    cells,
    coins: state.coins + DEADLOCK_RESCUE_REFUND,
    selectedIndex: null,
    messageKey: 'message.rescued'
  };
}

export function canClaimFirstMission(state: GameState): boolean {
  return state.merges >= FIRST_MISSION_TARGET && !state.missionClaimed;
}

export function claimFirstMission(state: GameState): GameState {
  if (!canClaimFirstMission(state)) return state;
  return {
    ...state,
    coins: state.coins + FIRST_MISSION_REWARD,
    missionClaimed: true,
    messageKey: 'message.missionClaimed'
  };
}

export function onboardingPhase(state: GameState): OnboardingPhase {
  if (state.merges === 0) return 'merge';
  if (state.spawns === 0) return 'spawn';
  return 'complete';
}

export function xpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return 40 * (safeLevel - 1) ** 2;
}

export function playerLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1);
}

export function playerLevelProgress(xp: number): number {
  const level = playerLevel(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next <= current) return 0;
  return Math.max(0, Math.min(1, (Math.max(0, xp) - current) / (next - current)));
}
