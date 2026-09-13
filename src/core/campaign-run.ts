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
  activeOrderTiers: number[];
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

function sanitizeCampaignUnit(candidate: unknown): Unit | null {
  const raw = asRecord(candidate);
  if (!raw || typeof raw.id !== 'string' || typeof raw.familyId !== 'string') return null;
  const family = familyById.get(raw.familyId as FamilyId);
  // Campaign merging may legally create tiers above lifetime discovery. This must
  // never mutate main-board discovery, but the temporary unit must survive reload.
  if (!family) return null;
  return { id: raw.id.slice(0, 160), familyId: family.id, tier: family.tier };
}

function phaseOvergrowthIndexes(phase: CampaignRunPhase, locationId = SNEAKER_GARDEN_LOCATION_ID): readonly number[] {
  const base = phase === 'stabilize'
    ? SNEAKER_GARDEN_STABILIZE_OVERGROWTH
    : phase === 'deliver'
      ? SNEAKER_GARDEN_DELIVER_OVERGROWTH
      : phase === 'restore'
        ? SNEAKER_GARDEN_RESTORE_OVERGROWTH
        : SNEAKER_GARDEN_MASTERY_OVERGROWTH;
  const world = campaignWorldById(1);
  const offset = Math.max(0, (world?.locations.find((entry) => entry.id === locationId)?.index ?? 1) - 1);
  return base.map((index) => (index + offset * 3) % BOARD_SIZE);
}

function overgrowthFromIndexes(indexes: readonly number[]): boolean[] {
  const blocked = Array.from({ length: BOARD_SIZE }, () => false);
  for (const index of indexes) {
    if (index >= 0 && index < BOARD_SIZE) blocked[index] = true;
  }
  return blocked;
}

function sanitizeOvergrowth(candidate: unknown[], phase: CampaignRunPhase, locationId: string): boolean[] {
  const allowed = new Set(phaseOvergrowthIndexes(phase, locationId));
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

function capLocationOrderTier(maxDiscoveredTier: number, locationId = SNEAKER_GARDEN_LOCATION_ID): number {
  const world = campaignWorldById(1);
  const cap = world?.locations.find((entry) => entry.id === locationId)?.orderTierMax ?? 4;
  return Math.max(1, Math.min(cap, safeMaxDiscoveredTier(maxDiscoveredTier)));
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

function defaultOrderTiers(phase: CampaignRunPhase, maxDiscoveredTier: number, locationId = SNEAKER_GARDEN_LOCATION_ID): number[] {
  const maxTier = capLocationOrderTier(maxDiscoveredTier, locationId);
  const world = campaignWorldById(1);
  const minTier = Math.min(maxTier, world?.locations.find((entry) => entry.id === locationId)?.orderTierMin ?? 2);
  if (phase === 'deliver') {
    const locationIndex = world?.locations.find((entry) => entry.id === locationId)?.index ?? 1;
    return locationIndex > 1
      ? [minTier, Math.min(maxTier, minTier + 1), minTier, maxTier]
      : [minTier, minTier, Math.min(maxTier, minTier + 1), maxTier];
  }
  if (phase === 'restore') return [minTier, minTier, Math.min(maxTier, minTier + 1), Math.min(maxTier, minTier + 1), maxTier, maxTier];
  if (phase === 'mastery') return [Math.min(maxTier, minTier + 1), maxTier, maxTier];
  return [];
}

function sanitizeOrderTiers(candidate: unknown, phase: CampaignRunPhase, maxDiscoveredTier: number, locationId: string): number[] {
  const expectedCount = expectedOrderCount(phase);
  if (expectedCount === 0) return [];
  const maxTier = safeMaxDiscoveredTier(maxDiscoveredTier);
  if (!Array.isArray(candidate) || candidate.length !== expectedCount) return defaultOrderTiers(phase, maxTier, locationId);
  const tiers = candidate.map((entry) => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) return 0;
    return Math.floor(entry);
  });
  if (tiers.some((tier) => tier < 1 || tier > maxTier)) return defaultOrderTiers(phase, maxTier, locationId);
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

function locationCurrentPhase(campaign: CampaignProgress, worldId: number, locationId: string): CampaignRunPhase | null {
  if (!isCampaignWorldUnlocked(campaign, worldId)) return null;
  const world = campaignWorldById(worldId);
  if (!world || !campaignLocationById(world, locationId)) return null;
  const progress = campaignWorldProgress(campaign, worldId);
  const locationProgress = progress?.locations[locationId];
  if (!locationProgress) return null;
  const phase = currentLocationPhase(locationProgress);
  return phase === 'stabilize' || phase === 'deliver' || phase === 'restore' || phase === 'mastery' ? phase : null;
}

function createLocationRun(phase: CampaignRunPhase, maxDiscoveredTier: number, worldId = 1, locationId = SNEAKER_GARDEN_LOCATION_ID): CampaignRunState {
  const indexes = phaseOvergrowthIndexes(phase, locationId);
  return {
    worldId,
    locationId,
    phase,
    cells: initialCampaignCells(),
    overgrowth: overgrowthFromIndexes(indexes),
    overgrowthTotal: indexes.length,
    merges: 0,
    spawns: 0,
    orderTiers: defaultOrderTiers(phase, maxDiscoveredTier, locationId),
    orderIndex: 0,
    selectedIndex: null,
    completed: false
  };
}

export function createSneakerGardenStabilizeRun(maxDiscoveredTier: number): CampaignRunState {
  return createLocationRun('stabilize', maxDiscoveredTier);
}

export function createSneakerGardenDeliverRun(maxDiscoveredTier: number): CampaignRunState {
  return createLocationRun('deliver', maxDiscoveredTier);
}

export function createSneakerGardenRestoreRun(maxDiscoveredTier: number): CampaignRunState {
  return createLocationRun('restore', maxDiscoveredTier);
}

export function createSneakerGardenMasteryRun(maxDiscoveredTier: number): CampaignRunState {
  return createLocationRun('mastery', maxDiscoveredTier);
}

function phasePermanentProgress(campaign: CampaignProgress, worldId: number, locationId: string, phase: CampaignRunPhase): number | null {
  const worldProgress = campaignWorldProgress(campaign, worldId);
  const locationProgress = worldProgress?.locations[locationId];
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
  if (!raw || typeof raw.worldId !== 'number' || typeof raw.locationId !== 'string') return null;
  const world = campaignWorldById(raw.worldId);
  if (!world || !campaignLocationById(world, raw.locationId)) return null;
  const phase: CampaignRunPhase | null = raw.phase === 'stabilize' || raw.phase === 'deliver' || raw.phase === 'restore' || raw.phase === 'mastery'
    ? raw.phase
    : null;
  if (!phase || !Array.isArray(raw.cells) || raw.cells.length !== BOARD_SIZE || !Array.isArray(raw.overgrowth) || raw.overgrowth.length !== BOARD_SIZE) return null;

  const worldProgress = campaignWorldProgress(campaign, raw.worldId);
  const locationProgress = worldProgress?.locations[raw.locationId];
  if (!locationProgress) return null;
  const currentPhase = currentLocationPhase(locationProgress);
  const maxTier = safeMaxDiscoveredTier(maxDiscoveredTier);
  const overgrowth = sanitizeOvergrowth(raw.overgrowth, phase, raw.locationId);
  const cells: Cell[] = raw.cells.map((entry, index) => {
    if (overgrowth[index]) return null;
    if (entry === null) return null;
    return sanitizeCampaignUnit(entry);
  });

  if (phase === 'stabilize') {
    const completed = overgrowth.every((entry) => !entry);
    if (!completed && currentPhase !== 'stabilize') return null;
    if (completed && currentPhase !== 'stabilize' && locationProgress.stabilize < 1) return null;
    return {
      worldId: raw.worldId,
      locationId: raw.locationId,
      phase,
      cells,
      overgrowth,
      overgrowthTotal: phaseOvergrowthIndexes(phase, raw.locationId).length,
      merges: nonnegativeInt(raw.merges, 100_000),
      spawns: nonnegativeInt(raw.spawns, 100_000),
      orderTiers: [],
      orderIndex: 0,
      selectedIndex: null,
      completed
    };
  }

  const orderTiers = sanitizeOrderTiers(raw.orderTiers, phase, maxTier, raw.locationId);
  const orderIndex = nonnegativeInt(raw.orderIndex, orderTiers.length);
  const completed = orderTiers.length > 0 && orderIndex >= orderTiers.length;
  const permanentProgress = phasePermanentProgress(campaign, raw.worldId, raw.locationId, phase) ?? 0;
  if (!completed && currentPhase !== phase) return null;
  if (completed && currentPhase !== phase && permanentProgress < 1) return null;
  return {
    worldId: raw.worldId,
    locationId: raw.locationId,
    phase,
    cells,
    overgrowth,
    overgrowthTotal: phaseOvergrowthIndexes(phase, raw.locationId).length,
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
  const world = campaignWorldById(worldId);
  if (!world || !campaignLocationById(world, locationId)) return null;
  const phase = locationCurrentPhase(campaign, worldId, locationId);
  if (!phase) return null;
  return createLocationRun(phase, maxDiscoveredTier, worldId, locationId);
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

function locationLandmarkLevel(campaign: CampaignProgress, worldId: number, locationId: string): number {
  const restore = campaignWorldProgress(campaign, worldId)?.locations[locationId]?.restore ?? 0;
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
  const pendingOrderFloor = run.phase === 'stabilize'
    ? maxTier
    : Math.min(...run.orderTiers.slice(run.orderIndex), maxTier);
  // A persisted low-tier order must remain constructible after lifetime discovery
  // grows and ordinary Supply would otherwise start above it.
  const baseTier = Math.max(1, Math.min(2, maxTier, pendingOrderFloor));
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
  const world = campaignWorldById(run.worldId);
  const locationIndex = world?.locations.find((entry) => entry.id === run.locationId)?.index ?? 1;
  const choiceCount = run.phase === 'deliver' && locationIndex > 1 ? 2 : 1;
  const choices = run.orderTiers.slice(run.orderIndex, run.orderIndex + choiceCount);
  const targetTier = run.orderTiers[run.orderIndex];
  const unit = run.cells[index];
  const selectedChoice = unit ? choices.indexOf(unit.tier) : -1;
  if (!targetTier || !unit || selectedChoice < 0) {
    return { run: { ...run, selectedIndex: null }, changed: false, orderCompleted: false };
  }

  const cells = run.cells.slice();
  cells[index] = null;
  const orderTiers = run.orderTiers.slice();
  if (selectedChoice > 0) {
    [orderTiers[run.orderIndex], orderTiers[run.orderIndex + selectedChoice]] = [orderTiers[run.orderIndex + selectedChoice]!, orderTiers[run.orderIndex]!];
  }
  const orderIndex = Math.min(run.orderTiers.length, run.orderIndex + 1);
  const completed = orderIndex >= run.orderTiers.length;
  return {
    run: {
      ...run,
      cells,
      orderTiers,
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
  const worldProgress = campaignWorldProgress(campaign, run.worldId);
  const locationProgress = worldProgress?.locations[run.locationId];
  if (!locationProgress || locationProgress.stabilize < 1) return campaign;
  const desired = Math.max(0, Math.min(1, run.orderIndex / run.orderTiers.length));
  const delta = desired - locationProgress.deliver;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, run.worldId, run.locationId, 'deliver', delta);
}

function commitCampaignRestoreProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase !== 'restore' || run.orderTiers.length === 0) return campaign;
  const worldProgress = campaignWorldProgress(campaign, run.worldId);
  const locationProgress = worldProgress?.locations[run.locationId];
  if (!locationProgress || locationProgress.deliver < 1) return campaign;
  const completedBatches = Math.floor(run.orderIndex / SNEAKER_GARDEN_RESTORE_BATCH_SIZE);
  const desired = Math.max(0, Math.min(1, completedBatches / SNEAKER_GARDEN_LANDMARK_LEVELS));
  const delta = desired - locationProgress.restore;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, run.worldId, run.locationId, 'restore', delta);
}

function commitCampaignMasteryProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase !== 'mastery' || run.orderTiers.length === 0) return campaign;
  const worldProgress = campaignWorldProgress(campaign, run.worldId);
  const locationProgress = worldProgress?.locations[run.locationId];
  if (!locationProgress || locationProgress.restore < 1) return campaign;
  const desired = Math.max(0, Math.min(1, run.orderIndex / run.orderTiers.length));
  const delta = desired - locationProgress.mastery;
  if (delta <= 0) return campaign;
  return advanceCampaignLocationPhase(campaign, run.worldId, run.locationId, 'mastery', delta);
}

function commitCampaignOrderProgress(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (run.phase === 'deliver') return commitCampaignDeliverProgress(campaign, run);
  if (run.phase === 'restore') return commitCampaignRestoreProgress(campaign, run);
  if (run.phase === 'mastery') return commitCampaignMasteryProgress(campaign, run);
  return campaign;
}

export function commitCampaignRunCompletion(campaign: CampaignProgress, run: CampaignRunState): CampaignProgress {
  if (!run.completed) return campaign;
  const worldProgress = campaignWorldProgress(campaign, run.worldId);
  const locationProgress = worldProgress?.locations[run.locationId];
  if (!locationProgress) return campaign;
  if (run.phase !== 'stabilize') return commitCampaignOrderProgress(campaign, run);
  if (locationProgress.stabilize >= 1) return campaign;
  return advanceCampaignLocationPhase(campaign, run.worldId, run.locationId, 'stabilize', 1);
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
  const landmarkLevel = locationLandmarkLevel(state.campaign, state.campaignRun.worldId, state.campaignRun.locationId) + state.prestigeUpgrades.campaignPower;
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

/** Rebuilds only the temporary phase board and keeps every already committed objective. */
export function restartCampaignRunPhase(state: GameState): GameState {
  const current = state.campaignRun;
  if (!current || current.completed) return state;
  const fresh = createLocationRun(current.phase, state.maxDiscoveredTier, current.worldId, current.locationId);
  const progress = campaignWorldProgress(state.campaign, current.worldId)?.locations[current.locationId];
  if (!progress) return state;
  let orderIndex = 0;
  if (current.phase === 'deliver') orderIndex = Math.floor(progress.deliver * SNEAKER_GARDEN_DELIVERY_ORDER_COUNT + 1e-9);
  if (current.phase === 'restore') orderIndex = Math.floor(progress.restore * SNEAKER_GARDEN_LANDMARK_LEVELS + 1e-9) * SNEAKER_GARDEN_RESTORE_BATCH_SIZE;
  if (current.phase === 'mastery') orderIndex = Math.floor(progress.mastery * SNEAKER_GARDEN_MASTERY_ORDER_COUNT + 1e-9);
  return { ...state, campaignRun: { ...fresh, orderTiers: current.orderTiers.slice(), orderIndex } };
}

export function campaignRunPresentationSnapshot(run: CampaignRunState | null): CampaignRunPresentation | null {
  if (!run) return null;
  const activeOrderTier = run.phase !== 'stabilize' && !run.completed
    ? run.orderTiers[run.orderIndex] ?? null
    : null;
  const world = campaignWorldById(run.worldId);
  const locationIndex = world?.locations.find((entry) => entry.id === run.locationId)?.index ?? 1;
  const activeOrderTiers = run.phase !== 'stabilize' && !run.completed
    ? run.orderTiers.slice(run.orderIndex, run.orderIndex + (run.phase === 'deliver' && locationIndex > 1 ? 2 : 1))
    : [];
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
    activeOrderTiers,
    selectedUnitTier,
    canDeliverSelected: selectedUnitTier !== null && activeOrderTiers.includes(selectedUnitTier),
    restoreBatchIndex,
    restoreBatchTotal: run.phase === 'restore' ? SNEAKER_GARDEN_LANDMARK_LEVELS : 0,
    restoreBatchOrderIndex,
    selectedIndex: run.selectedIndex,
    completed: run.completed
  };
}
