import {
  BOARD_SIZE,
  DEADLOCK_RESCUE_REFUND,
  FAMILIES,
  FIRST_MISSION_REWARD,
  FIRST_MISSION_TARGET,
  MAX_RUNTIME_TIER,
  SPAWN_COST,
  familyById,
  familyByTier,
  nextFamilyFor
} from './catalog.js';
import type { Cell, FamilyId, GameState, MergeResult, OnboardingPhase, Unit } from './types.js';

let sequence = 0;

function createUnit(familyId: FamilyId): Unit {
  const family = familyById.get(familyId);
  if (!family) throw new Error(`Unknown family: ${familyId}`);
  sequence += 1;
  return { id: `${familyId}-${Date.now().toString(36)}-${sequence.toString(36)}`, familyId, tier: family.tier };
}

function normalizeLegacyUnit(candidate: unknown): Unit | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const unit = candidate as Partial<Unit>;
  if (typeof unit.id !== 'string' || typeof unit.familyId !== 'string') return null;
  const family = FAMILIES.find((entry) => entry.id === unit.familyId);
  if (!family) return null;
  return { id: unit.id, familyId: family.id, tier: family.tier };
}

export function createInitialState(): GameState {
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => null);
  // Two ready Tier-1 pairs make the first session immediately understandable.
  for (let index = 0; index < 4; index += 1) cells[index] = createUnit('toilet-buddy');
  return {
    version: 3,
    cells,
    coins: 100,
    xp: 0,
    merges: 0,
    spawns: 0,
    maxDiscoveredTier: 1,
    missionClaimed: false,
    selectedIndex: null,
    messageKey: 'message.welcome'
  };
}

export function sanitizeState(candidate: unknown): GameState | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const state = candidate as Record<string, unknown>;
  if ((state.version !== 1 && state.version !== 2 && state.version !== 3)
    || !Array.isArray(state.cells)
    || state.cells.length !== BOARD_SIZE) return null;
  if (typeof state.coins !== 'number' || typeof state.xp !== 'number' || typeof state.merges !== 'number') return null;

  const cells: Cell[] = [];
  for (const cell of state.cells) {
    if (cell === null) {
      cells.push(null);
      continue;
    }
    const normalized = normalizeLegacyUnit(cell);
    if (!normalized) return null;
    cells.push(normalized);
  }

  const discoveredFromBoard = cells.reduce((highest, cell) => Math.max(highest, cell?.tier ?? 1), 1);
  const savedDiscovered = state.version === 3 && typeof state.maxDiscoveredTier === 'number'
    ? Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(state.maxDiscoveredTier)))
    : discoveredFromBoard;
  const spawns = (state.version === 2 || state.version === 3) && typeof state.spawns === 'number'
    ? Math.max(0, Math.floor(state.spawns))
    : 0;
  const missionClaimed = (state.version === 2 || state.version === 3) && state.missionClaimed === true;

  return {
    version: 3,
    cells,
    coins: Math.max(0, Math.floor(state.coins)),
    xp: Math.max(0, Math.floor(state.xp)),
    merges: Math.max(0, Math.floor(state.merges)),
    spawns,
    maxDiscoveredTier: Math.max(discoveredFromBoard, savedDiscovered),
    missionClaimed,
    selectedIndex: null,
    messageKey: null
  };
}

export function spawnUnit(state: GameState, _random = Math.random, free = false): GameState {
  const cost = free ? 0 : SPAWN_COST;
  if (state.coins < cost) return { ...state, messageKey: 'message.notEnoughCoins' };
  const emptyIndexes = state.cells.flatMap((cell, index) => (cell === null ? [index] : []));
  if (emptyIndexes.length === 0) return { ...state, messageKey: 'message.boardFull' };

  const target = emptyIndexes[0];
  if (target === undefined) return state;

  const cells = state.cells.slice();
  // Core Brain Box always feeds the bottom of the chain. Higher characters are earned by merging.
  cells[target] = createUnit('toilet-buddy');
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

  if (target.familyId !== source.familyId) {
    return {
      state: { ...state, selectedIndex: null, messageKey: 'message.cannotMerge' },
      changed: false,
      merged: false,
      reason: 'mismatch'
    };
  }

  const nextFamily = nextFamilyFor(source.familyId);
  if (!nextFamily) {
    return {
      state: { ...state, selectedIndex: null, messageKey: 'message.nextFormNeeded' },
      changed: false,
      merged: false,
      reason: 'max-tier'
    };
  }

  cells[from] = null;
  cells[to] = createUnit(nextFamily.id);
  return {
    state: {
      ...state,
      cells,
      selectedIndex: null,
      merges: state.merges + 1,
      xp: state.xp + nextFamily.tier * 8,
      coins: state.coins + nextFamily.tier * 4,
      maxDiscoveredTier: Math.max(state.maxDiscoveredTier, nextFamily.tier),
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
  return Boolean(a && b && a.familyId === b.familyId && nextFamilyFor(a.familyId));
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

/**
 * Returns the highest-tier merge currently available. This is presentation-safe:
 * it does not mutate state and gives the UI a deterministic pair to hint when the
 * board is crowded or the player stalls.
 */
export function findBestMergePair(state: GameState): readonly [number, number] | null {
  let best: readonly [number, number] | null = null;
  let bestTier = -1;
  for (let i = 0; i < state.cells.length; i += 1) {
    const a = state.cells[i];
    if (!a) continue;
    for (let j = i + 1; j < state.cells.length; j += 1) {
      const b = state.cells[j] ?? null;
      if (!canMerge(a, b)) continue;
      if (a.tier > bestTier) {
        best = [i, j] as const;
        bestTier = a.tier;
      }
    }
  }
  return best;
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

  // In a sequential chain, terminal pieces are the actual deadlock blockers:
  // they can occupy cells forever but can never merge. Preserve lower-tier
  // pieces whenever possible because they still carry future merge potential.
  const terminalIndex = state.cells.findIndex((cell) => cell?.tier === MAX_RUNTIME_TIER);
  let targetIndex = terminalIndex;

  // Defensive fallback for a future ruleset where a deadlock could exist
  // without terminal pieces: clear the highest tier, not the weakest progress.
  if (targetIndex < 0) {
    let highestTier = Number.NEGATIVE_INFINITY;
    state.cells.forEach((cell, index) => {
      if (cell && cell.tier > highestTier) {
        highestTier = cell.tier;
        targetIndex = index;
      }
    });
  }

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
