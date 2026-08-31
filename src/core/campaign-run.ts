import { BOARD_COLUMNS, BOARD_SIZE, MAX_RUNTIME_TIER, FAMILIES, familyById, familyByTier, nextFamilyFor } from './catalog.js';
import {
  advanceCampaignLocationPhase,
  campaignLocationById,
  campaignWorldById,
  campaignWorldProgress,
  currentLocationPhase,
  isCampaignWorldUnlocked,
  type CampaignProgress
} from './campaign.js';
import type { CampaignRunState, Cell, FamilyId, Unit } from './types.js';

export const SNEAKER_GARDEN_LOCATION_ID = 'w1-sneaker-garden';
export const SNEAKER_GARDEN_WORLD_ID = 1;
export const SNEAKER_GARDEN_STABILIZE_OVERGROWTH = [2, 8, 14, 20, 26, 27] as const;
const SNEAKER_GARDEN_STARTING_CELLS = [0, 1, 6, 7] as const;

let campaignSequence = 0;

export interface CampaignRunMoveResult {
  run: CampaignRunState;
  changed: boolean;
  merged: boolean;
  clearedIndex: number | null;
}

export interface CampaignRunPresentationCell {
  familyId: FamilyId;
  tier: number;
}

export interface CampaignRunPresentation {
  worldId: number;
  locationId: string;
  phase: 'stabilize';
  cells: Array<CampaignRunPresentationCell | null>;
  overgrowth: boolean[];
  overgrowthTotal: number;
  overgrowthRemaining: number;
  progressPercent: number;
  merges: number;
  spawns: number;
  selectedIndex: number | null;
  completed: boolean;
}

function asRecord(candidate: unknown): Record<string, unknown> | null {
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : null;
}

function nonnegativeInt(candidate: unknown, cap = Number.MAX_SAFE_INTEGER): number {
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return 0;
  return Math.max(0, Math.min(cap, Math.floor(candidate)));
}

function createCampaignUnit(tier: number): Unit {
  const safeTier = Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(tier)));
  const family = familyByTier.get(safeTier) ?? FAMILIES[0]!;
  campaignSequence += 1;
  return {
    id: `campaign-${family.id}-${Date.now().toString(36)}-${campaignSequence.toString(36)}`,
    familyId: family.id,
    tier: family.tier
  };
}

function sanitizeCampaignUnit(candidate: unknown, maxDiscoveredTier: number): Unit | null {
  const raw = asRecord(candidate);
  if (!raw || typeof raw.id !== 'string' || typeof raw.familyId !== 'string') return null;
  const family = familyById.get(raw.familyId as FamilyId);
  if (!family || family.tier > maxDiscoveredTier) return null;
  return { id: raw.id.slice(0, 160), familyId: family.id, tier: family.tier };
}

function initialOvergrowth(): boolean[] {
  const blocked = Array.from({ length: BOARD_SIZE }, () => false);
  for (const index of SNEAKER_GARDEN_STABILIZE_OVERGROWTH) blocked[index] = true;
  return blocked;
}

function overgrowthRemaining(run: CampaignRunState): number {
  return run.overgrowth.reduce((total, blocked) => total + (blocked ? 1 : 0), 0);
}

function campaignRunProgress(run: CampaignRunState): number {
  if (run.overgrowthTotal <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - overgrowthRemaining(run) / run.overgrowthTotal));
}

function isSneakerGardenStabilizeAvailable(campaign: CampaignProgress): boolean {
  if (!isCampaignWorldUnlocked(campaign, SNEAKER_GARDEN_WORLD_ID)) return false;
  const world = campaignWorldById(SNEAKER_GARDEN_WORLD_ID);
  if (!world || !campaignLocationById(world, SNEAKER_GARDEN_LOCATION_ID)) return false;
  const progress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = progress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  return locationProgress ? currentLocationPhase(locationProgress) === 'stabilize' : false;
}

export function createSneakerGardenStabilizeRun(maxDiscoveredTier: number): CampaignRunState {
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => null);
  for (const index of SNEAKER_GARDEN_STARTING_CELLS) cells[index] = createCampaignUnit(1);
  const overgrowth = initialOvergrowth();
  return {
    worldId: SNEAKER_GARDEN_WORLD_ID,
    locationId: SNEAKER_GARDEN_LOCATION_ID,
    phase: 'stabilize',
    cells,
    overgrowth,
    overgrowthTotal: SNEAKER_GARDEN_STABILIZE_OVERGROWTH.length,
    merges: 0,
    spawns: 0,
    selectedIndex: null,
    completed: false
  };
}

export function sanitizeCampaignRunState(
  candidate: unknown,
  campaign: CampaignProgress,
  maxDiscoveredTier: number
): CampaignRunState | null {
  if (candidate === null || candidate === undefined) return null;
  const raw = asRecord(candidate);
  if (!raw || raw.worldId !== SNEAKER_GARDEN_WORLD_ID || raw.locationId !== SNEAKER_GARDEN_LOCATION_ID || raw.phase !== 'stabilize') return null;
  if (!Array.isArray(raw.cells) || raw.cells.length !== BOARD_SIZE || !Array.isArray(raw.overgrowth) || raw.overgrowth.length !== BOARD_SIZE) return null;

  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress) return null;
  const permanentStabilized = locationProgress.stabilize >= 1;

  const overgrowth = raw.overgrowth.map((entry) => entry === true);
  const cells: Cell[] = raw.cells.map((entry, index) => {
    if (overgrowth[index]) return null;
    if (entry === null) return null;
    return sanitizeCampaignUnit(entry, Math.max(1, maxDiscoveredTier));
  });
  const completed = overgrowth.every((entry) => !entry);

  if (!completed && (permanentStabilized || !isSneakerGardenStabilizeAvailable(campaign))) return null;
  if (completed && !permanentStabilized && !isSneakerGardenStabilizeAvailable(campaign)) return null;

  return {
    worldId: SNEAKER_GARDEN_WORLD_ID,
    locationId: SNEAKER_GARDEN_LOCATION_ID,
    phase: 'stabilize',
    cells,
    overgrowth,
    overgrowthTotal: SNEAKER_GARDEN_STABILIZE_OVERGROWTH.length,
    merges: nonnegativeInt(raw.merges, 100_000),
    spawns: nonnegativeInt(raw.spawns, 100_000),
    selectedIndex: null,
    completed
  };
}

export function startCampaignRun(
  current: CampaignRunState | null,
  campaign: CampaignProgress,
  maxDiscoveredTier: number,
  worldId: number,
  locationId: string
): CampaignRunState | null {
  if (current) {
    return current.worldId === worldId && current.locationId === locationId ? current : current;
  }
  if (worldId !== SNEAKER_GARDEN_WORLD_ID || locationId !== SNEAKER_GARDEN_LOCATION_ID) return null;
  if (!isSneakerGardenStabilizeAvailable(campaign)) return null;
  return createSneakerGardenStabilizeRun(maxDiscoveredTier);
}

export function selectCampaignRunCell(run: CampaignRunState, index: number | null): CampaignRunState {
  if (index === null) return run.selectedIndex === null ? run : { ...run, selectedIndex: null };
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE || run.overgrowth[index]) return run;
  return { ...run, selectedIndex: run.selectedIndex === index ? null : index };
}

export function spawnCampaignSupply(
  run: CampaignRunState,
  maxDiscoveredTier: number,
  random = Math.random
): CampaignRunState {
  if (run.completed) return run;
  const target = run.cells.findIndex((cell, index) => cell === null && !run.overgrowth[index]);
  if (target < 0) return { ...run, selectedIndex: null };

  const maxTier = Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(maxDiscoveredTier)));
  const baseTier = Math.min(2, maxTier);
  const luckyTier = random() < 0.25 ? baseTier + 1 : baseTier;
  const tier = Math.max(1, Math.min(maxTier, luckyTier));
  const cells = run.cells.slice();
  cells[target] = createCampaignUnit(tier);
  return { ...run, cells, spawns: run.spawns + 1, selectedIndex: null };
}

function gridDistance(a: number, b: number): number {
  const ax = a % BOARD_COLUMNS;
  const ay = Math.floor(a / BOARD_COLUMNS);
  const bx = b % BOARD_COLUMNS;
  const by = Math.floor(b / BOARD_COLUMNS);
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function clearNearestOvergrowth(overgrowth: boolean[], mergeIndex: number): { overgrowth: boolean[]; clearedIndex: number | null } {
  const blocked = overgrowth.flatMap((entry, index) => entry ? [index] : []);
  if (blocked.length === 0) return { overgrowth, clearedIndex: null };
  blocked.sort((a, b) => gridDistance(a, mergeIndex) - gridDistance(b, mergeIndex) || a - b);
  const clearedIndex = blocked[0] ?? null;
  if (clearedIndex === null) return { overgrowth, clearedIndex: null };
  const next = overgrowth.slice();
  next[clearedIndex] = false;
  return { overgrowth: next, clearedIndex };
}

export function moveOrMergeCampaignRun(run: CampaignRunState, from: number, to: number): CampaignRunMoveResult {
  if (run.completed || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= BOARD_SIZE || to >= BOARD_SIZE || run.overgrowth[from] || run.overgrowth[to]) {
    return { run, changed: false, merged: false, clearedIndex: null };
  }
  if (from === to) return { run: { ...run, selectedIndex: null }, changed: false, merged: false, clearedIndex: null };
  const source = run.cells[from];
  if (!source) return { run, changed: false, merged: false, clearedIndex: null };
  const target = run.cells[to];
  const cells = run.cells.slice();

  if (!target) {
    cells[from] = null;
    cells[to] = source;
    return {
      run: { ...run, cells, selectedIndex: null },
      changed: true,
      merged: false,
      clearedIndex: null
    };
  }

  if (target.familyId !== source.familyId) {
    return { run: { ...run, selectedIndex: null }, changed: false, merged: false, clearedIndex: null };
  }
  const nextFamily = nextFamilyFor(source.familyId);
  if (!nextFamily) {
    return { run: { ...run, selectedIndex: null }, changed: false, merged: false, clearedIndex: null };
  }

  cells[from] = null;
  cells[to] = createCampaignUnit(nextFamily.tier);
  const cleared = clearNearestOvergrowth(run.overgrowth, to);
  const completed = cleared.overgrowth.every((entry) => !entry);
  return {
    run: {
      ...run,
      cells,
      overgrowth: cleared.overgrowth,
      merges: run.merges + 1,
      selectedIndex: null,
      completed
    },
    changed: true,
    merged: true,
    clearedIndex: cleared.clearedIndex
  };
}

export function commitCampaignRunCompletion(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (!run.completed || run.worldId !== SNEAKER_GARDEN_WORLD_ID || run.locationId !== SNEAKER_GARDEN_LOCATION_ID || run.phase !== 'stabilize') return campaign;
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress || locationProgress.stabilize >= 1) return campaign;
  return advanceCampaignLocationPhase(campaign, SNEAKER_GARDEN_WORLD_ID, SNEAKER_GARDEN_LOCATION_ID, 'stabilize', 1);
}

export function campaignRunPresentationSnapshot(run: CampaignRunState | null): CampaignRunPresentation | null {
  if (!run) return null;
  return {
    worldId: run.worldId,
    locationId: run.locationId,
    phase: run.phase,
    cells: run.cells.map((cell) => cell ? { familyId: cell.familyId, tier: cell.tier } : null),
    overgrowth: run.overgrowth.slice(),
    overgrowthTotal: run.overgrowthTotal,
    overgrowthRemaining: overgrowthRemaining(run),
    progressPercent: Math.round(campaignRunProgress(run) * 100),
    merges: run.merges,
    spawns: run.spawns,
    selectedIndex: run.selectedIndex,
    completed: run.completed
  };
}
