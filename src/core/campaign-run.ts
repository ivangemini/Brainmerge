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
import type { CampaignRunPhase, CampaignRunState, Cell, FamilyId, GameState, Unit } from './types.js';

export const SNEAKER_GARDEN_LOCATION_ID = 'w1-sneaker-garden';
export const SNEAKER_GARDEN_WORLD_ID = 1;
export const SNEAKER_GARDEN_STABILIZE_OVERGROWTH = [2, 8, 14, 20, 26, 27] as const;
export const SNEAKER_GARDEN_DELIVER_OVERGROWTH = [8, 20, 27] as const;
export const SNEAKER_GARDEN_RESTORE_OVERGROWTH = [14, 27] as const;
export const SNEAKER_GARDEN_MASTERY_OVERGROWTH = [2, 8, 14, 20, 27] as const;
export const SNEAKER_GARDEN_DELIVERY_ORDER_COUNT = 4;
export const SNEAKER_GARDEN_RESTORE_ORDER_COUNT = 6;
export const SNEAKER_GARDEN_RESTORE_BATCH_SIZE = 2;
export const SNEAKER_GARDEN_LANDMARK_LEVELS = 3;
export const SNEAKER_GARDEN_MASTERY_ORDER_COUNT = 3;
export const CAMPAIGN_SUPPLY_BASE_LUCKY_CHANCE = 0.25;
export const CAMPAIGN_SUPPLY_LANDMARK_LUCKY_STEP = 0.05;
const SNEAKER_GARDEN_STARTING_CELLS = [0, 1, 6, 7] as const;

let campaignSequence = 0;

export interface CampaignRunMoveResult {
  run: CampaignRunState;
  changed: boolean;
  merged: boolean;
  clearedIndex: number | null;
}

export interface CampaignRunDeliveryResult {
  run: CampaignRunState;
  changed: boolean;
  orderCompleted: boolean;
}

export interface CampaignGameMoveResult {
  state: GameState;
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
  phase: CampaignRunPhase;
  cells: Array<CampaignRunPresentationCell | null>;
  overgrowth: boolean[];
  overgrowthTotal: number;
  overgrowthRemaining: number;
  progressPercent: number;
  merges: number;
  spawns: number;
  orderTiers: number[];
  orderIndex: number;
  orderTotal: number;
  activeOrderTier: number | null;
  selectedUnitTier: number | null;
  canDeliverSelected: boolean;
  restoreBatchIndex: number;
  restoreBatchTotal: number;
  restoreBatchOrderIndex: number;
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

function safeMaxDiscoveredTier(candidate: number): number {
  if (!Number.isFinite(candidate)) return 1;
  return Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(candidate)));
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

function phaseOvergrowthIndexes(phase: CampaignRunPhase): readonly number[] {
  if (phase === 'stabilize') return SNEAKER_GARDEN_STABILIZE_OVERGROWTH;
  if (phase === 'deliver') return SNEAKER_GARDEN_DELIVER_OVERGROWTH;
  if (phase === 'restore') return SNEAKER_GARDEN_RESTORE_OVERGROWTH;
  return SNEAKER_GARDEN_MASTERY_OVERGROWTH;
}

function overgrowthFromIndexes(indexes: readonly number[]): boolean[] {
  const blocked = Array.from({ length: BOARD_SIZE }, () => false);
  for (const index of indexes) {
    if (index >= 0 && index < BOARD_SIZE) blocked[index] = true;
  }
  return blocked;
}

function sanitizeOvergrowth(candidate: unknown[], phase: CampaignRunPhase): boolean[] {
  const allowed = new Set(phaseOvergrowthIndexes(phase));
  return Array.from({ length: BOARD_SIZE }, (_, index) => {
    if (!allowed.has(index)) return false;
    if (phase === 'mastery') return true;
    return candidate[index] === true;
  });
}

function initialCampaignCells(): Cell[] {
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => null);
  for (const index of SNEAKER_GARDEN_STARTING_CELLS) cells[index] = createCampaignUnit(1);
  return cells;
}

function overgrowthRemaining(run: CampaignRunState): number {
  return run.overgrowth.reduce((total, blocked) => total + (blocked ? 1 : 0), 0);
}

function capLocationOrderTier(maxDiscoveredTier: number): number {
  return Math.max(1, Math.min(4, safeMaxDiscoveredTier(maxDiscoveredTier)));
}

export function sneakerGardenDeliveryOrderTiers(maxDiscoveredTier: number): number[] {
  const maxTier = capLocationOrderTier(maxDiscoveredTier);
  const baseTier = Math.min(2, maxTier);
  return [baseTier, baseTier, Math.min(maxTier, baseTier + 1), maxTier];
}

export function sneakerGardenRestoreOrderTiers(maxDiscoveredTier: number): number[] {
  const maxTier = capLocationOrderTier(maxDiscoveredTier);
  const baseTier = Math.min(2, maxTier);
  const middleTier = Math.min(maxTier, baseTier + 1);
  return [baseTier, baseTier, middleTier, middleTier, maxTier, maxTier];
}

export function sneakerGardenMasteryOrderTiers(maxDiscoveredTier: number): number[] {
  const maxTier = capLocationOrderTier(maxDiscoveredTier);
  const middleTier = Math.min(maxTier, 3);
  return [middleTier, maxTier, maxTier];
}

function expectedOrderCount(phase: CampaignRunPhase): number {
  if (phase === 'deliver') return SNEAKER_GARDEN_DELIVERY_ORDER_COUNT;
  if (phase === 'restore') return SNEAKER_GARDEN_RESTORE_ORDER_COUNT;
  if (phase === 'mastery') return SNEAKER_GARDEN_MASTERY_ORDER_COUNT;
  return 0;
}

function defaultOrderTiers(phase: CampaignRunPhase, maxDiscoveredTier: number): number[] {
  if (phase === 'deliver') return sneakerGardenDeliveryOrderTiers(maxDiscoveredTier);
  if (phase === 'restore') return sneakerGardenRestoreOrderTiers(maxDiscoveredTier);
  if (phase === 'mastery') return sneakerGardenMasteryOrderTiers(maxDiscoveredTier);
  return [];
}

function sanitizeOrderTiers(candidate: unknown, phase: CampaignRunPhase, maxDiscoveredTier: number): number[] {
  const expectedCount = expectedOrderCount(phase);
  if (expectedCount === 0) return [];
  const maxTier = safeMaxDiscoveredTier(maxDiscoveredTier);
  if (!Array.isArray(candidate) || candidate.length !== expectedCount) return defaultOrderTiers(phase, maxTier);
  const tiers = candidate.map((entry) => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) return 0;
    return Math.floor(entry);
  });
  if (tiers.some((tier) => tier < 1 || tier > maxTier)) return defaultOrderTiers(phase, maxTier);
  return tiers;
}

function campaignRunProgress(run: CampaignRunState): number {
  if (run.phase !== 'stabilize') {
    if (run.orderTiers.length === 0) return run.completed ? 1 : 0;
    return Math.max(0, Math.min(1, run.orderIndex / run.orderTiers.length));
  }
  if (run.overgrowthTotal <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - overgrowthRemaining(run) / run.overgrowthTotal));
}

function sneakerGardenCurrentPhase(campaign: CampaignProgress): CampaignRunPhase | null {
  if (!isCampaignWorldUnlocked(campaign, SNEAKER_GARDEN_WORLD_ID)) return null;
  const world = campaignWorldById(SNEAKER_GARDEN_WORLD_ID);
  if (!world || !campaignLocationById(world, SNEAKER_GARDEN_LOCATION_ID)) return null;
  const progress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = progress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress) return null;
  const phase = currentLocationPhase(locationProgress);
  return phase === 'stabilize' || phase === 'deliver' || phase === 'restore' || phase === 'mastery' ? phase : null;
}

function createSneakerGardenRun(phase: CampaignRunPhase, maxDiscoveredTier: number): CampaignRunState {
  const indexes = phaseOvergrowthIndexes(phase);
  return {
    worldId: SNEAKER_GARDEN_WORLD_ID,
    locationId: SNEAKER_GARDEN_LOCATION_ID,
    phase,
    cells: initialCampaignCells(),
    overgrowth: overgrowthFromIndexes(indexes),
    overgrowthTotal: indexes.length,
    merges: 0,
    spawns: 0,
    orderTiers: defaultOrderTiers(phase, maxDiscoveredTier),
    orderIndex: 0,
    selectedIndex: null,
    completed: false
  };
}

export function createSneakerGardenStabilizeRun(maxDiscoveredTier: number): CampaignRunState {
  return createSneakerGardenRun('stabilize', maxDiscoveredTier);
}

export function createSneakerGardenDeliverRun(maxDiscoveredTier: number): CampaignRunState {
  return createSneakerGardenRun('deliver', maxDiscoveredTier);
}

export function createSneakerGardenRestoreRun(maxDiscoveredTier: number): CampaignRunState {
  return createSneakerGardenRun('restore', maxDiscoveredTier);
}

export function createSneakerGardenMasteryRun(maxDiscoveredTier: number): CampaignRunState {
  return createSneakerGardenRun('mastery', maxDiscoveredTier);
}

function phasePermanentProgress(campaign: CampaignProgress, phase: CampaignRunPhase): number | null {
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress) return null;
  return locationProgress[phase];
}

export function sanitizeCampaignRunState(
  candidate: unknown,
  campaign: CampaignProgress,
  maxDiscoveredTier: number
): CampaignRunState | null {
  if (candidate === null || candidate === undefined) return null;
  const raw = asRecord(candidate);
  if (!raw || raw.worldId !== SNEAKER_GARDEN_WORLD_ID || raw.locationId !== SNEAKER_GARDEN_LOCATION_ID) return null;
  const phase: CampaignRunPhase | null = raw.phase === 'stabilize' || raw.phase === 'deliver' || raw.phase === 'restore' || raw.phase === 'mastery'
    ? raw.phase
    : null;
  if (!phase || !Array.isArray(raw.cells) || raw.cells.length !== BOARD_SIZE || !Array.isArray(raw.overgrowth) || raw.overgrowth.length !== BOARD_SIZE) return null;

  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress) return null;
  const currentPhase = currentLocationPhase(locationProgress);
  const maxTier = safeMaxDiscoveredTier(maxDiscoveredTier);
  const overgrowth = sanitizeOvergrowth(raw.overgrowth, phase);
  const cells: Cell[] = raw.cells.map((entry, index) => {
    if (overgrowth[index]) return null;
    if (entry === null) return null;
    return sanitizeCampaignUnit(entry, maxTier);
  });

  if (phase === 'stabilize') {
    const completed = overgrowth.every((entry) => !entry);
    if (!completed && currentPhase !== 'stabilize') return null;
    if (completed && currentPhase !== 'stabilize' && locationProgress.stabilize < 1) return null;
    return {
      worldId: SNEAKER_GARDEN_WORLD_ID,
      locationId: SNEAKER_GARDEN_LOCATION_ID,
      phase,
      cells,
      overgrowth,
      overgrowthTotal: phaseOvergrowthIndexes(phase).length,
      merges: nonnegativeInt(raw.merges, 100_000),
      spawns: nonnegativeInt(raw.spawns, 100_000),
      orderTiers: [],
      orderIndex: 0,
      selectedIndex: null,
      completed
    };
  }

  const orderTiers = sanitizeOrderTiers(raw.orderTiers, phase, maxTier);
  const orderIndex = nonnegativeInt(raw.orderIndex, orderTiers.length);
  const completed = orderTiers.length > 0 && orderIndex >= orderTiers.length;
  const permanentProgress = phasePermanentProgress(campaign, phase) ?? 0;
  if (!completed && currentPhase !== phase) return null;
  if (completed && currentPhase !== phase && permanentProgress < 1) return null;
  return {
    worldId: SNEAKER_GARDEN_WORLD_ID,
    locationId: SNEAKER_GARDEN_LOCATION_ID,
    phase,
    cells,
    overgrowth,
    overgrowthTotal: phaseOvergrowthIndexes(phase).length,
    merges: nonnegativeInt(raw.merges, 100_000),
    spawns: nonnegativeInt(raw.spawns, 100_000),
    orderTiers,
    orderIndex,
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
  if (current) return current;
  if (worldId !== SNEAKER_GARDEN_WORLD_ID || locationId !== SNEAKER_GARDEN_LOCATION_ID) return null;
  const phase = sneakerGardenCurrentPhase(campaign);
  if (!phase) return null;
  return createSneakerGardenRun(phase, maxDiscoveredTier);
}

export function selectCampaignRunCell(run: CampaignRunState, index: number | null): CampaignRunState {
  if (index === null) return run.selectedIndex === null ? run : { ...run, selectedIndex: null };
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE || run.overgrowth[index]) return run;
  return { ...run, selectedIndex: run.selectedIndex === index ? null : index };
}

export function sneakerGardenLandmarkLevel(campaign: CampaignProgress): number {
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const restore = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID]?.restore ?? 0;
  if (restore >= 1) return 3;
  if (restore >= 2 / 3) return 2;
  if (restore >= 1 / 3) return 1;
  return 0;
}

export function campaignSupplyLuckyChanceForLandmarkLevel(level: number): number {
  const safeLevel = Math.max(0, Math.min(SNEAKER_GARDEN_LANDMARK_LEVELS, Math.floor(Number.isFinite(level) ? level : 0)));
  return CAMPAIGN_SUPPLY_BASE_LUCKY_CHANCE + safeLevel * CAMPAIGN_SUPPLY_LANDMARK_LUCKY_STEP;
}

export function spawnCampaignSupply(
  run: CampaignRunState,
  maxDiscoveredTier: number,
  random = Math.random,
  landmarkLevel = 0
): CampaignRunState {
  if (run.completed) return run;
  const target = run.cells.findIndex((cell, index) => cell === null && !run.overgrowth[index]);
  if (target < 0) return { ...run, selectedIndex: null };

  const maxTier = safeMaxDiscoveredTier(maxDiscoveredTier);
  const baseTier = Math.min(2, maxTier);
  const luckyTier = random() < campaignSupplyLuckyChanceForLandmarkLevel(landmarkLevel) ? baseTier + 1 : baseTier;
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
  const cleared = run.phase === 'mastery'
    ? { overgrowth: run.overgrowth, clearedIndex: null }
    : clearNearestOvergrowth(run.overgrowth, to);
  const completed = run.phase === 'stabilize'
    ? cleared.overgrowth.every((entry) => !entry)
    : run.completed;
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

export function deliverCampaignRunUnit(run: CampaignRunState, index: number): CampaignRunDeliveryResult {
  if (run.phase === 'stabilize' || run.completed || !Number.isInteger(index) || index < 0 || index >= BOARD_SIZE || run.overgrowth[index]) {
    return { run, changed: false, orderCompleted: false };
  }
  const targetTier = run.orderTiers[run.orderIndex];
  const unit = run.cells[index];
  if (!targetTier || !unit || unit.tier !== targetTier) {
    return { run: { ...run, selectedIndex: null }, changed: false, orderCompleted: false };
  }

  const cells = run.cells.slice();
  cells[index] = null;
  const orderIndex = Math.min(run.orderTiers.length, run.orderIndex + 1);
  const completed = orderIndex >= run.orderTiers.length;
  return {
    run: {
      ...run,
      cells,
      orderIndex,
      selectedIndex: null,
      completed
    },
    changed: true,
    orderCompleted: true
  };
}

function commitCampaignDeliverProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase !== 'deliver' || run.orderTiers.length === 0) return campaign;
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress || locationProgress.stabilize < 1) return campaign;
  const desired = Math.max(0, Math.min(1, run.orderIndex / run.orderTiers.length));
  const delta = desired - locationProgress.deliver;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, SNEAKER_GARDEN_WORLD_ID, SNEAKER_GARDEN_LOCATION_ID, 'deliver', delta);
}

function commitCampaignRestoreProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase !== 'restore' || run.orderTiers.length === 0) return campaign;
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress || locationProgress.deliver < 1) return campaign;
  const completedBatches = Math.floor(run.orderIndex / SNEAKER_GARDEN_RESTORE_BATCH_SIZE);
  const desired = Math.max(0, Math.min(1, completedBatches / SNEAKER_GARDEN_LANDMARK_LEVELS));
  const delta = desired - locationProgress.restore;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, SNEAKER_GARDEN_WORLD_ID, SNEAKER_GARDEN_LOCATION_ID, 'restore', delta);
}

function commitCampaignMasteryProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase !== 'mastery' || run.orderTiers.length === 0) return campaign;
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress || locationProgress.restore < 1) return campaign;
  const desired = Math.max(0, Math.min(1, run.orderIndex / run.orderTiers.length));
  const delta = desired - locationProgress.mastery;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, SNEAKER_GARDEN_WORLD_ID, SNEAKER_GARDEN_LOCATION_ID, 'mastery', delta);
}

function commitCampaignOrderProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase === 'deliver') return commitCampaignDeliverProgress(campaign, run);
  if (run.phase === 'restore') return commitCampaignRestoreProgress(campaign, run);
  if (run.phase === 'mastery') return commitCampaignMasteryProgress(campaign, run);
  return campaign;
}

export function commitCampaignRunCompletion(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (!run.completed || run.worldId !== SNEAKER_GARDEN_WORLD_ID || run.locationId !== SNEAKER_GARDEN_LOCATION_ID) return campaign;
  const worldProgress = campaignWorldProgress(campaign, SNEAKER_GARDEN_WORLD_ID);
  const locationProgress = worldProgress?.locations[SNEAKER_GARDEN_LOCATION_ID];
  if (!locationProgress) return campaign;
  if (run.phase !== 'stabilize') return commitCampaignOrderProgress(campaign, run);
  if (locationProgress.stabilize >= 1) return campaign;
  return advanceCampaignLocationPhase(campaign, SNEAKER_GARDEN_WORLD_ID, SNEAKER_GARDEN_LOCATION_ID, 'stabilize', 1);
}

/** Starts or resumes a Campaign run without mutating the main board/economy. */
export function beginCampaignRun(state: GameState, worldId: number, locationId: string): GameState {
  const campaignRun = startCampaignRun(state.campaignRun, state.campaign, state.maxDiscoveredTier, worldId, locationId);
  if (campaignRun === state.campaignRun) return state;
  return { ...state, campaignRun };
}

/** Free Campaign-only supply; ordinary coins and paid-box inflation are untouched. */
export function spawnCampaignRunSupply(state: GameState, random = Math.random): GameState {
  if (!state.campaignRun) return state;
  const landmarkLevel = sneakerGardenLandmarkLevel(state.campaign);
  const campaignRun = spawnCampaignSupply(state.campaignRun, state.maxDiscoveredTier, random, landmarkLevel);
  if (campaignRun === state.campaignRun) return state;
  return { ...state, campaignRun };
}

export function selectCampaignBoardCell(state: GameState, index: number | null): GameState {
  if (!state.campaignRun) return state;
  const campaignRun = selectCampaignRunCell(state.campaignRun, index);
  if (campaignRun === state.campaignRun) return state;
  return { ...state, campaignRun };
}

export function moveOrMergeCampaignBoard(state: GameState, from: number, to: number): CampaignGameMoveResult {
  if (!state.campaignRun) return { state, changed: false, merged: false, clearedIndex: null };
  const result = moveOrMergeCampaignRun(state.campaignRun, from, to);
  if (result.run === state.campaignRun) return { state, changed: result.changed, merged: result.merged, clearedIndex: result.clearedIndex };
  const campaign = result.run.completed
    ? commitCampaignRunCompletion(state.campaign, result.run)
    : state.campaign;
  return {
    state: { ...state, campaignRun: result.run, campaign },
    changed: result.changed,
    merged: result.merged,
    clearedIndex: result.clearedIndex
  };
}

/** Consumes only a matching Campaign-board unit and commits that order/batch exactly once. */
export function deliverCampaignBoardUnit(state: GameState, index: number): GameState {
  if (!state.campaignRun) return state;
  const result = deliverCampaignRunUnit(state.campaignRun, index);
  if (!result.changed) {
    if (result.run === state.campaignRun) return state;
    return { ...state, campaignRun: result.run };
  }
  const campaign = commitCampaignOrderProgress(state.campaign, result.run);
  return { ...state, campaignRun: result.run, campaign };
}

/** Clears only the completed temporary board; permanent phase progress remains. */
export function acknowledgeCampaignRunCompletion(state: GameState): GameState {
  if (!state.campaignRun?.completed) return state;
  const campaign = commitCampaignRunCompletion(state.campaign, state.campaignRun);
  return { ...state, campaign, campaignRun: null };
}

export function campaignRunPresentationSnapshot(run: CampaignRunState | null): CampaignRunPresentation | null {
  if (!run) return null;
  const activeOrderTier = run.phase !== 'stabilize' && !run.completed
    ? run.orderTiers[run.orderIndex] ?? null
    : null;
  const selectedUnitTier = run.selectedIndex === null ? null : run.cells[run.selectedIndex]?.tier ?? null;
  const restoreBatchIndex = run.phase === 'restore'
    ? Math.min(SNEAKER_GARDEN_LANDMARK_LEVELS, Math.floor(run.orderIndex / SNEAKER_GARDEN_RESTORE_BATCH_SIZE))
    : 0;
  const restoreBatchOrderIndex = run.phase === 'restore'
    ? run.orderIndex % SNEAKER_GARDEN_RESTORE_BATCH_SIZE
    : 0;
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
    orderTiers: run.orderTiers.slice(),
    orderIndex: run.orderIndex,
    orderTotal: run.orderTiers.length,
    activeOrderTier,
    selectedUnitTier,
    canDeliverSelected: activeOrderTier !== null && selectedUnitTier === activeOrderTier,
    restoreBatchIndex,
    restoreBatchTotal: run.phase === 'restore' ? SNEAKER_GARDEN_LANDMARK_LEVELS : 0,
    restoreBatchOrderIndex,
    selectedIndex: run.selectedIndex,
    completed: run.completed
  };
}
