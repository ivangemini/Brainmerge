import { BOARD_SIZE, FAMILIES, MAX_RUNTIME_TIER, familyById, familyByTier, nextFamilyFor } from './catalog.js';
import { advanceCampaignRaid, campaignWorldById, campaignWorldProgress, isWorldRaidUnlocked } from './campaign.js';
import type { CampaignRaidRunState, Cell, GameState, Unit } from './types.js';

const PHASE_BLOCKERS: Readonly<Record<1 | 2 | 3, readonly number[]>> = {
  1: [2, 5, 8, 11, 14, 17, 20, 23],
  2: [1, 3, 6, 8, 11, 13, 16, 18, 21, 23, 26, 28],
  3: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29]
};
const WORLD2_PHASE_BLOCKERS: Readonly<Record<1 | 2 | 3, readonly number[]>> = {
  1: [0, 2, 4, 6, 8, 10, 12],
  2: [0, 1, 2, 6, 7, 8, 12, 13, 14, 18],
  3: [0, 1, 2, 3, 6, 7, 8, 9, 12, 13, 14, 15, 18, 19]
};
const WORLD1_RAID_ORDER_TIERS: Readonly<Record<1 | 2 | 3, readonly number[]>> = {
  1: [2, 3, 3, 4], 2: [3, 4, 4, 5, 5], 3: [4, 5, 6, 6]
};
const WORLD2_RAID_ORDER_TIERS: Readonly<Record<1 | 2 | 3, readonly number[]>> = {
  1: [3, 4, 4, 5], 2: [4, 5, 5, 6, 6], 3: [5, 6, 7, 7]
};
const PHASE_MERGES = { 1: 8, 2: 12, 3: 0 } as const;
let raidSequence = 0;

function unit(tier: number): Unit {
  const family = familyByTier.get(Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(tier)))) ?? FAMILIES[0]!;
  raidSequence += 1;
  return { id: `raid-${family.id}-${Date.now().toString(36)}-${raidSequence}`, familyId: family.id, tier: family.tier };
}

function blockers(phase: 1 | 2 | 3, worldId = 1): boolean[] {
  const set = new Set((worldId === 2 ? WORLD2_PHASE_BLOCKERS : PHASE_BLOCKERS)[phase]);
  return Array.from({ length: BOARD_SIZE }, (_, index) => set.has(index));
}

function createRun(worldId: number, phase: 1 | 2 | 3, maxTier: number): CampaignRaidRunState {
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => null);
  for (const index of [0, 4, 24, 27]) cells[index] = unit(1);
  const cap = Math.max(1, Math.min(MAX_RUNTIME_TIER, Math.floor(maxTier)));
  return {
    worldId,
    phase,
    cells,
    overgrowth: blockers(phase, worldId),
    merges: 0,
    orderTiers: phase === 3
      ? (worldId === 2 ? WORLD2_RAID_ORDER_TIERS[phase] : WORLD1_RAID_ORDER_TIERS[phase]).map((tier) => Math.min(cap, tier))
      : [],
    orderIndex: 0,
    selectedIndex: null,
    completed: false
  };
}

export function sanitizeCampaignRaidRun(candidate: unknown, state: Pick<GameState, 'campaign' | 'maxDiscoveredTier'>): CampaignRaidRunState | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const raw = candidate as Record<string, unknown>;
  if (typeof raw.worldId !== 'number' || (raw.phase !== 1 && raw.phase !== 2 && raw.phase !== 3)) return null;
  const world = campaignWorldById(raw.worldId);
  const progress = campaignWorldProgress(state.campaign, raw.worldId);
  if (!world || !progress || !isWorldRaidUnlocked(world, progress) || !Array.isArray(raw.cells) || raw.cells.length !== BOARD_SIZE) return null;
  const allowed = blockers(raw.phase, raw.worldId);
  const cells = raw.cells.map((entry, index): Cell => {
    if (allowed[index] || entry === null || !entry || typeof entry !== 'object') return null;
    const candidateUnit = entry as Partial<Unit>;
    const family = typeof candidateUnit.familyId === 'string' ? familyById.get(candidateUnit.familyId) : null;
    return family && typeof candidateUnit.id === 'string' ? { id: candidateUnit.id.slice(0, 160), familyId: family.id, tier: family.tier } : null;
  });
  const defaults = createRun(raw.worldId, raw.phase, state.maxDiscoveredTier);
  const orderTiers = Array.isArray(raw.orderTiers) && raw.orderTiers.length === defaults.orderTiers.length
    ? raw.orderTiers.map((tier) => Math.max(1, Math.min(state.maxDiscoveredTier, Number.isFinite(tier) ? Math.floor(tier) : 1)))
    : defaults.orderTiers;
  const merges = Math.max(0, Math.min(PHASE_MERGES[raw.phase], Number.isFinite(raw.merges) ? Math.floor(raw.merges as number) : 0));
  const orderIndex = Math.max(0, Math.min(orderTiers.length, Number.isFinite(raw.orderIndex) ? Math.floor(raw.orderIndex as number) : 0));
  return { worldId: raw.worldId, phase: raw.phase, cells, overgrowth: allowed, merges, orderTiers, orderIndex, selectedIndex: null, completed: raw.phase === 3 ? orderIndex >= orderTiers.length : merges >= PHASE_MERGES[raw.phase] };
}

export function beginCampaignRaid(state: GameState, worldId: number): GameState {
  if (state.campaignRun || state.raidRun) return state;
  const world = campaignWorldById(worldId);
  const progress = campaignWorldProgress(state.campaign, worldId);
  if (!world || !progress || !isWorldRaidUnlocked(world, progress) || progress.raidCleared) return state;
  const phase = Math.min(3, Math.floor(progress.raidProgress * 3) + 1) as 1 | 2 | 3;
  return { ...state, raidRun: createRun(worldId, phase, state.maxDiscoveredTier) };
}

export function spawnCampaignRaidSupply(state: GameState): GameState {
  const run = state.raidRun;
  if (!run || run.completed) return state;
  const index = run.cells.findIndex((cell, i) => !cell && !run.overgrowth[i]);
  if (index < 0) return state;
  const cells = run.cells.slice();
  cells[index] = unit(run.phase === 3 ? Math.max(1, Math.min(...run.orderTiers.slice(run.orderIndex)) - 2) : 1);
  return { ...state, raidRun: { ...run, cells } };
}

export function selectCampaignRaidCell(state: GameState, index: number | null): GameState {
  const run = state.raidRun;
  if (!run) return state;
  if (index === null || !Number.isInteger(index) || index < 0 || index >= BOARD_SIZE || run.overgrowth[index] || !run.cells[index]) return { ...state, raidRun: { ...run, selectedIndex: null } };
  return { ...state, raidRun: { ...run, selectedIndex: run.selectedIndex === index ? null : index } };
}

export function moveOrMergeCampaignRaid(state: GameState, from: number, to: number): GameState {
  const run = state.raidRun;
  if (!run || run.completed || run.overgrowth[from] || run.overgrowth[to]) return state;
  const source = run.cells[from];
  if (!source) return state;
  const cells = run.cells.slice();
  const target = cells[to];
  if (!target) { cells[from] = null; cells[to] = source; return { ...state, raidRun: { ...run, cells, selectedIndex: null } }; }
  if (target.familyId !== source.familyId) return { ...state, raidRun: { ...run, selectedIndex: null } };
  const next = nextFamilyFor(source.familyId);
  if (!next) return state;
  cells[from] = null; cells[to] = unit(next.tier);
  const merges = run.merges + 1;
  return { ...state, raidRun: { ...run, cells, merges, selectedIndex: null, completed: run.phase < 3 && merges >= PHASE_MERGES[run.phase] } };
}

export function deliverCampaignRaidUnit(state: GameState, index: number): GameState {
  const run = state.raidRun;
  if (!run || run.phase !== 3 || run.completed) return state;
  const target = run.orderTiers[run.orderIndex];
  if (!target || run.cells[index]?.tier !== target) return state;
  const cells = run.cells.slice(); cells[index] = null;
  const orderIndex = run.orderIndex + 1;
  return { ...state, raidRun: { ...run, cells, orderIndex, selectedIndex: null, completed: orderIndex >= run.orderTiers.length } };
}

export function acknowledgeCampaignRaidPhase(state: GameState): GameState {
  const run = state.raidRun;
  if (!run?.completed) return state;
  const campaign = advanceCampaignRaid(state.campaign, run.worldId, 1 / 3);
  const clearedWorld1 = run.worldId === 1 && campaign.worlds['1']?.raidCleared;
  return {
    ...state,
    campaign,
    raidRun: null,
    retention: clearedWorld1 && state.retention.world1RaidClearActiveMs === null
      ? { ...state.retention, world1RaidClearActiveMs: state.events.activeMs }
      : state.retention
  };
}

export function campaignRaidPresentation(run: CampaignRaidRunState | null) {
  if (!run) return null;
  const target = run.phase === 3 ? run.orderTiers[run.orderIndex] ?? null : null;
  const progress = run.phase === 3 ? run.orderIndex / Math.max(1, run.orderTiers.length) : run.merges / PHASE_MERGES[run.phase];
  return { ...run, cells: run.cells.map((cell) => cell ? { familyId: cell.familyId, tier: cell.tier } : null), targetTier: target, progressPercent: Math.round(Math.min(1, progress) * 100) };
}
