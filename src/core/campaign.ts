export const FULL_CAMPAIGN_WORLD_COUNT = 8;
export const LOCATIONS_PER_WORLD = 7;

export const CAMPAIGN_LOCATION_PHASES = ['stabilize', 'deliver', 'restore', 'mastery'] as const;
export type CampaignLocationPhase = typeof CAMPAIGN_LOCATION_PHASES[number];
export type CampaignLocationPhaseOrComplete = CampaignLocationPhase | 'complete';

export const CAMPAIGN_PHASE_WEIGHTS: Readonly<Record<CampaignLocationPhase, number>> = {
  stabilize: 0.20,
  deliver: 0.25,
  restore: 0.45,
  mastery: 0.10
};

export interface CampaignLocationDefinition {
  id: string;
  index: number;
  nameKey: string;
  landmarkKey: string;
  modifierId: string;
  orderTierMin: number;
  orderTierMax: number;
}

export interface CampaignRaidDefinition {
  bossId: string;
  phaseCount: number;
  unlockWorldProgressPercent: number;
  unlockRestoredLandmarks: number;
}

export interface CampaignWorldDefinition {
  id: 1 | 2;
  nameKey: string;
  modifierId: string;
  locations: readonly CampaignLocationDefinition[];
  raid: CampaignRaidDefinition;
}

export interface CampaignLocationProgress {
  stabilize: number;
  deliver: number;
  restore: number;
  mastery: number;
}

export interface CampaignWorldProgress {
  locations: Record<string, CampaignLocationProgress>;
  raidProgress: number;
  raidCleared: boolean;
}

export interface CampaignProgress {
  worlds: Record<string, CampaignWorldProgress>;
}

export interface CampaignLocationPresentation {
  id: string;
  index: number;
  percent: number;
  currentPhase: CampaignLocationPhaseOrComplete;
  phases: CampaignLocationProgress;
}

export interface CampaignWorldPresentation {
  id: number;
  unlocked: boolean;
  percent: number;
  restoredLandmarks: number;
  raidProgressPercent: number;
  raidUnlocked: boolean;
  raidCleared: boolean;
  locations: CampaignLocationPresentation[];
}

export interface CampaignPresentationSnapshot {
  worlds: CampaignWorldPresentation[];
}

function location(
  id: string,
  index: number,
  nameKey: string,
  landmarkKey: string,
  modifierId: string,
  orderTierMin: number,
  orderTierMax: number
): CampaignLocationDefinition {
  return { id, index, nameKey, landmarkKey, modifierId, orderTierMin, orderTierMax };
}

export const CAMPAIGN_WORLDS: readonly CampaignWorldDefinition[] = [
  {
    id: 1,
    nameKey: 'world1Name',
    modifierId: 'overgrowth',
    locations: [
      location('w1-sneaker-garden', 1, 'w1Location1Name', 'w1Landmark1Name', 'overgrowth', 2, 4),
      location('w1-toilet-pond', 2, 'w1Location2Name', 'w1Landmark2Name', 'overgrowth', 2, 5),
      location('w1-watermelon-grill', 3, 'w1Location3Name', 'w1Landmark3Name', 'overgrowth', 3, 5),
      location('w1-hose-tunnels', 4, 'w1Location4Name', 'w1Landmark4Name', 'overgrowth', 3, 6),
      location('w1-gnome-yard', 5, 'w1Location5Name', 'w1Landmark5Name', 'overgrowth', 4, 6),
      location('w1-mushroom-field', 6, 'w1Location6Name', 'w1Landmark6Name', 'overgrowth', 4, 7),
      location('w1-backyard-core', 7, 'w1Location7Name', 'w1Landmark7Name', 'overgrowth', 5, 8)
    ],
    raid: {
      bossId: 'backyard-brainrot-boss',
      phaseCount: 3,
      unlockWorldProgressPercent: 80,
      unlockRestoredLandmarks: 5
    }
  },
  {
    id: 2,
    nameKey: 'world2Name',
    modifierId: 'traffic-lock',
    locations: [
      location('w2-sneaker-transit', 1, 'w2Location1Name', 'w2Landmark1Name', 'traffic-lock', 3, 5),
      location('w2-pigeon-plaza', 2, 'w2Location2Name', 'w2Landmark2Name', 'traffic-lock', 3, 6),
      location('w2-vending-block', 3, 'w2Location3Name', 'w2Landmark3Name', 'traffic-lock', 4, 6),
      location('w2-long-neck-junction', 4, 'w2Location4Name', 'w2Landmark4Name', 'traffic-lock', 4, 7),
      location('w2-sunglasses-strip', 5, 'w2Location5Name', 'w2Landmark5Name', 'traffic-lock', 5, 7),
      location('w2-appliance-district', 6, 'w2Location6Name', 'w2Landmark6Name', 'traffic-lock', 5, 8),
      location('w2-city-core', 7, 'w2Location7Name', 'w2Landmark7Name', 'traffic-lock', 6, 9)
    ],
    raid: {
      bossId: 'city-brainrot-boss',
      phaseCount: 3,
      unlockWorldProgressPercent: 80,
      unlockRestoredLandmarks: 5
    }
  }
] as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function asRecord(candidate: unknown): Record<string, unknown> | null {
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : null;
}

export function createInitialLocationProgress(): CampaignLocationProgress {
  return { stabilize: 0, deliver: 0, restore: 0, mastery: 0 };
}

export function createInitialWorldProgress(world: CampaignWorldDefinition): CampaignWorldProgress {
  const locations = Object.fromEntries(
    world.locations.map((entry) => [entry.id, createInitialLocationProgress()])
  );
  return { locations, raidProgress: 0, raidCleared: false };
}

export function createInitialCampaignProgress(): CampaignProgress {
  return {
    worlds: Object.fromEntries(
      CAMPAIGN_WORLDS.map((world) => [String(world.id), createInitialWorldProgress(world)])
    )
  };
}

export function sanitizeLocationProgress(candidate: unknown): CampaignLocationProgress {
  const raw = asRecord(candidate);
  if (!raw) return createInitialLocationProgress();
  return {
    stabilize: clamp01(typeof raw.stabilize === 'number' ? raw.stabilize : 0),
    deliver: clamp01(typeof raw.deliver === 'number' ? raw.deliver : 0),
    restore: clamp01(typeof raw.restore === 'number' ? raw.restore : 0),
    mastery: clamp01(typeof raw.mastery === 'number' ? raw.mastery : 0)
  };
}

export function sanitizeWorldProgress(
  world: CampaignWorldDefinition,
  candidate: unknown
): CampaignWorldProgress {
  const raw = asRecord(candidate);
  const rawLocations = asRecord(raw?.locations);
  const locations = Object.fromEntries(
    world.locations.map((entry) => [entry.id, sanitizeLocationProgress(rawLocations?.[entry.id])])
  );
  const raidProgress = clamp01(typeof raw?.raidProgress === 'number' ? raw.raidProgress : 0);
  return {
    locations,
    raidProgress,
    raidCleared: raw?.raidCleared === true || raidProgress >= 1
  };
}

export function sanitizeCampaignProgress(candidate: unknown): CampaignProgress {
  const raw = asRecord(candidate);
  const rawWorlds = asRecord(raw?.worlds);
  return {
    worlds: Object.fromEntries(
      CAMPAIGN_WORLDS.map((world) => [
        String(world.id),
        sanitizeWorldProgress(world, rawWorlds?.[String(world.id)])
      ])
    )
  };
}

export function locationProgressPercent(progress: CampaignLocationProgress): number {
  const weighted =
    clamp01(progress.stabilize) * CAMPAIGN_PHASE_WEIGHTS.stabilize +
    clamp01(progress.deliver) * CAMPAIGN_PHASE_WEIGHTS.deliver +
    clamp01(progress.restore) * CAMPAIGN_PHASE_WEIGHTS.restore +
    clamp01(progress.mastery) * CAMPAIGN_PHASE_WEIGHTS.mastery;
  return Math.round(weighted * 100);
}

export function currentLocationPhase(progress: CampaignLocationProgress): CampaignLocationPhaseOrComplete {
  for (const phase of CAMPAIGN_LOCATION_PHASES) {
    if (clamp01(progress[phase]) < 1) return phase;
  }
  return 'complete';
}

export function restoredLandmarkCount(
  world: CampaignWorldDefinition,
  progress: CampaignWorldProgress
): number {
  return world.locations.reduce((count, entry) => {
    return count + (clamp01(progress.locations[entry.id]?.restore ?? 0) >= 1 ? 1 : 0);
  }, 0);
}

export function worldProgressPercent(
  world: CampaignWorldDefinition,
  progress: CampaignWorldProgress
): number {
  if (world.locations.length === 0) return 0;
  const total = world.locations.reduce((sum, entry) => {
    const locationProgress = progress.locations[entry.id] ?? createInitialLocationProgress();
    return sum + locationProgressPercent(locationProgress);
  }, 0);
  return Math.round(total / world.locations.length);
}

export function isWorldRaidUnlocked(
  world: CampaignWorldDefinition,
  progress: CampaignWorldProgress
): boolean {
  return worldProgressPercent(world, progress) >= world.raid.unlockWorldProgressPercent &&
    restoredLandmarkCount(world, progress) >= world.raid.unlockRestoredLandmarks;
}

export function isWorldFullyRestored(
  world: CampaignWorldDefinition,
  progress: CampaignWorldProgress
): boolean {
  return worldProgressPercent(world, progress) === 100 && progress.raidCleared;
}

export function campaignWorldById(id: number): CampaignWorldDefinition | null {
  return CAMPAIGN_WORLDS.find((world) => world.id === id) ?? null;
}

export function campaignLocationById(
  world: CampaignWorldDefinition,
  locationId: string
): CampaignLocationDefinition | null {
  return world.locations.find((entry) => entry.id === locationId) ?? null;
}

export function campaignWorldProgress(
  progress: CampaignProgress,
  worldId: number
): CampaignWorldProgress | null {
  const world = campaignWorldById(worldId);
  if (!world) return null;
  return sanitizeWorldProgress(world, progress.worlds[String(worldId)]);
}

export function isCampaignWorldUnlocked(progress: CampaignProgress, worldId: number): boolean {
  if (worldId <= 1) return true;
  const previous = campaignWorldById(worldId - 1);
  if (!previous) return false;
  const previousProgress = campaignWorldProgress(progress, previous.id);
  return previousProgress?.raidCleared === true;
}

function earlierPhasesComplete(progress: CampaignLocationProgress, phase: CampaignLocationPhase): boolean {
  const targetIndex = CAMPAIGN_LOCATION_PHASES.indexOf(phase);
  return CAMPAIGN_LOCATION_PHASES.slice(0, targetIndex).every((entry) => clamp01(progress[entry]) >= 1);
}

export function advanceCampaignLocationPhase(
  campaign: CampaignProgress,
  worldId: number,
  locationId: string,
  phase: CampaignLocationPhase,
  delta: number
): CampaignProgress {
  if (!Number.isFinite(delta) || delta <= 0 || !isCampaignWorldUnlocked(campaign, worldId)) return campaign;
  const world = campaignWorldById(worldId);
  if (!world || !campaignLocationById(world, locationId)) return campaign;
  const worldProgress = campaignWorldProgress(campaign, worldId);
  if (!worldProgress) return campaign;
  const locationProgress = worldProgress.locations[locationId] ?? createInitialLocationProgress();
  if (!earlierPhasesComplete(locationProgress, phase) || locationProgress[phase] >= 1) return campaign;

  const nextLocation: CampaignLocationProgress = {
    ...locationProgress,
    [phase]: clamp01(locationProgress[phase] + delta)
  };
  const nextWorld: CampaignWorldProgress = {
    ...worldProgress,
    locations: { ...worldProgress.locations, [locationId]: nextLocation }
  };
  return {
    worlds: { ...campaign.worlds, [String(worldId)]: nextWorld }
  };
}

export function advanceCampaignRaid(
  campaign: CampaignProgress,
  worldId: number,
  delta: number
): CampaignProgress {
  if (!Number.isFinite(delta) || delta <= 0 || !isCampaignWorldUnlocked(campaign, worldId)) return campaign;
  const world = campaignWorldById(worldId);
  const worldProgress = campaignWorldProgress(campaign, worldId);
  if (!world || !worldProgress || worldProgress.raidCleared || !isWorldRaidUnlocked(world, worldProgress)) return campaign;
  const raidProgress = clamp01(worldProgress.raidProgress + delta);
  const nextWorld: CampaignWorldProgress = {
    ...worldProgress,
    raidProgress,
    raidCleared: raidProgress >= 1
  };
  return {
    worlds: { ...campaign.worlds, [String(worldId)]: nextWorld }
  };
}

export function campaignPresentationSnapshot(campaign: CampaignProgress): CampaignPresentationSnapshot {
  return {
    worlds: CAMPAIGN_WORLDS.map((world) => {
      const progress = campaignWorldProgress(campaign, world.id) ?? createInitialWorldProgress(world);
      return {
        id: world.id,
        unlocked: isCampaignWorldUnlocked(campaign, world.id),
        percent: worldProgressPercent(world, progress),
        restoredLandmarks: restoredLandmarkCount(world, progress),
        raidProgressPercent: Math.round(clamp01(progress.raidProgress) * 100),
        raidUnlocked: isWorldRaidUnlocked(world, progress),
        raidCleared: progress.raidCleared,
        locations: world.locations.map((entry) => {
          const locationProgress = progress.locations[entry.id] ?? createInitialLocationProgress();
          return {
            id: entry.id,
            index: entry.index,
            percent: locationProgressPercent(locationProgress),
            currentPhase: currentLocationPhase(locationProgress),
            phases: { ...locationProgress }
          };
        })
      };
    })
  };
}
