import type { FamilyId, MissionDefinition, UpgradeDefinition, UpgradeId } from './types.js';

export interface UnitPresentation {
  /** Perceived runtime size relative to the Shark Sneakers baseline. */
  scale: number;
  /** Small vertical correction in percent of the visual wrapper. Positive moves down. */
  yPercent: number;
  /** Elliptical contact-shadow width multiplier. */
  shadowScale: number;
  /** Collection-thumbnail scale, kept separate from board readability. */
  collectionScale: number;
}

export interface FamilyDefinition {
  id: FamilyId;
  nameKey: string;
  /** Fixed position in the one core merge chain. */
  tier: number;
  /** Base passive production before the global income upgrade multiplier. */
  incomePerMinute: number;
  asset: string;
  presentation: UnitPresentation;
}

export const BOARD_COLUMNS = 6;
export const BOARD_ROWS = 5;
export const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS;

/** Paid Brain Box economy. Rewarded boxes never increment paidBoxes. */
export const BASE_BOX_COST = 20;
export const BOX_COST_GROWTH = 1.045;
/** Compatibility alias for older code/tests; new code should use brainBoxCostForPurchases(). */
export const SPAWN_COST = BASE_BOX_COST;
export const DEADLOCK_RESCUE_REFUND = 5;

/**
 * Passive production is deliberately >2x per tier so merging two equal units
 * always increases production instead of punishing the player for merging.
 */
export const INCOME_PER_MINUTE_BY_TIER: Readonly<Record<number, number>> = {
  1: 3,
  2: 7,
  3: 16,
  4: 36,
  5: 82,
  6: 185,
  7: 420,
  8: 950,
  9: 2150,
  10: 4850,
  11: 10950,
  12: 24700,
  13: 55700,
  14: 125500,
  15: 283000,
  16: 638000,
  17: 1438000,
  18: 3242000
};

export const LUCKY_DROP_CHANCE_BY_LEVEL = [0, 0.05, 0.10, 0.16, 0.23, 0.30] as const;
export const INCOME_MULTIPLIER_BY_LEVEL = [1, 1.15, 1.32, 1.52, 1.75, 2] as const;
export const OFFLINE_HOURS_BY_LEVEL = [2, 4, 6, 8, 12] as const;
/** Level 0 = T1 base, level 3 = T4 base. Spawn is always capped to already-discovered tiers. */
export const MAX_BOX_BASE_TIER_LEVEL = 3;

export const UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  {
    id: 'boxBaseTier',
    titleKey: 'upgrade.boxBaseTier.title',
    descriptionKey: 'upgrade.boxBaseTier.description',
    costs: [600, 3000, 15000]
  },
  {
    id: 'luckyDrop',
    titleKey: 'upgrade.luckyDrop.title',
    descriptionKey: 'upgrade.luckyDrop.description',
    costs: [200, 500, 1200, 3000, 7500]
  },
  {
    id: 'income',
    titleKey: 'upgrade.income.title',
    descriptionKey: 'upgrade.income.description',
    costs: [250, 700, 1800, 5000, 14000]
  },
  {
    id: 'offline',
    titleKey: 'upgrade.offline.title',
    descriptionKey: 'upgrade.offline.description',
    costs: [300, 900, 2500, 7000]
  }
] as const;

export const upgradeById = new Map(UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, upgrade]));

/**
 * Deterministic first-cycle goals. Keep the original eight entries stable so
 * existing save-v5 missionIndex values retain their exact meaning.
 */
export const MISSION_TRACK: readonly MissionDefinition[] = [
  { id: 'merge-6', kind: 'merges', target: 6, reward: 80, titleKey: 'mission.merge6.title', textKey: 'mission.merge6.text' },
  { id: 'discover-4', kind: 'discover', target: 4, reward: 100, titleKey: 'mission.discover4.title', textKey: 'mission.discover4.text' },
  { id: 'spawn-12', kind: 'spawns', target: 12, reward: 90, titleKey: 'mission.spawn12.title', textKey: 'mission.spawn12.text' },
  { id: 'discover-5', kind: 'discover', target: 5, reward: 130, titleKey: 'mission.discover5.title', textKey: 'mission.discover5.text' },
  { id: 'merge-30', kind: 'merges', target: 30, reward: 150, titleKey: 'mission.merge30.title', textKey: 'mission.merge30.text' },
  { id: 'discover-6', kind: 'discover', target: 6, reward: 190, titleKey: 'mission.discover6.title', textKey: 'mission.discover6.text' },
  { id: 'discover-7', kind: 'discover', target: 7, reward: 260, titleKey: 'mission.discover7.title', textKey: 'mission.discover7.text' },
  { id: 'discover-8', kind: 'discover', target: 8, reward: 400, titleKey: 'mission.discover8.title', textKey: 'mission.discover8.text' }
] as const;

export const FIRST_MISSION_TARGET = MISSION_TRACK[0]!.target;
export const FIRST_MISSION_REWARD = MISSION_TRACK[0]!.reward;

/** One-time rewards for first discovering a tier. Tier 2 is effectively gifted by the starter board. */
export const DISCOVERY_BONUS_BY_TIER: Readonly<Record<number, number>> = {
  2: 0,
  3: 8,
  4: 12,
  5: 20,
  6: 32,
  7: 48,
  8: 80,
  9: 120,
  10: 180,
  11: 270,
  12: 400,
  13: 600,
  14: 900,
  15: 1350,
  16: 2000,
  17: 3000,
  18: 5000
};

const BASE_CHARACTER_ATLAS = './public/assets/characters/character-atlas.webp';
const TOILET_BUDDY = './public/assets/characters/toilet-buddy-form-a.webp';
const characterAsset = (name: string) => `./public/assets/characters/${name}.webp`;

/**
 * Canonical core progression. First discovery of every tier above T1 must come
 * from merging. Brain Box upgrades only accelerate rebuilding of discovered tiers.
 *
 * T1-T8 preserve the established production art. T9-T18 use approved standalone
 * character renders normalized to the same runtime cell anchor.
 */
export const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'toilet-buddy', nameKey: 'character.toiletBuddy', tier: 1,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[1]!, asset: TOILET_BUDDY,
    presentation: { scale: 1.08, yPercent: 0, shadowScale: 0.94, collectionScale: 1.04 }
  },
  {
    id: 'camera-dude', nameKey: 'character.cameraDude', tier: 2,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[2]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.14, yPercent: 0, shadowScale: 0.95, collectionScale: 1.08 }
  },
  {
    id: 'sigma-rock', nameKey: 'character.sigmaRock', tier: 3,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[3]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.08, yPercent: 0, shadowScale: 0.96, collectionScale: 1.03 }
  },
  {
    id: 'rizz-head', nameKey: 'character.rizzHead', tier: 4,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[4]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.09, yPercent: 0, shadowScale: 0.86, collectionScale: 1.03 }
  },
  {
    id: 'shark-sneakers', nameKey: 'character.sharkSneakers', tier: 5,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[5]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 0.96, yPercent: 0, shadowScale: 1.04, collectionScale: 1.06 }
  },
  {
    id: 'crocodile-bomber', nameKey: 'character.crocodileBomber', tier: 6,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[6]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.05, yPercent: 0, shadowScale: 1.04, collectionScale: 1.03 }
  },
  {
    id: 'coffee-ballerina', nameKey: 'character.coffeeBallerina', tier: 7,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[7]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.12, yPercent: 0, shadowScale: 0.9, collectionScale: 1.08 }
  },
  {
    id: 'tung-wood', nameKey: 'character.tungWood', tier: 8,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[8]!, asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.03, yPercent: 0, shadowScale: 0.88, collectionScale: 1.01 }
  },
  {
    id: 'brr-brr-patapim', nameKey: 'character.brrBrrPatapim', tier: 9,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[9]!, asset: characterAsset('brr-brr-patapim'),
    presentation: { scale: 1.03, yPercent: 0, shadowScale: 0.9, collectionScale: 1.03 }
  },
  {
    id: 'boneca-ambalabu', nameKey: 'character.bonecaAmbalabu', tier: 10,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[10]!, asset: characterAsset('boneca-ambalabu'),
    presentation: { scale: 1.04, yPercent: 0, shadowScale: 0.94, collectionScale: 1.03 }
  },
  {
    id: 'cappuccino-assassino', nameKey: 'character.cappuccinoAssassino', tier: 11,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[11]!, asset: characterAsset('cappuccino-assassino'),
    presentation: { scale: 1.03, yPercent: 0, shadowScale: 0.88, collectionScale: 1.02 }
  },
  {
    id: 'frigo-camelo', nameKey: 'character.frigoCamelo', tier: 12,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[12]!, asset: characterAsset('frigo-camelo'),
    presentation: { scale: 1.05, yPercent: 0, shadowScale: 0.96, collectionScale: 1.04 }
  },
  {
    id: 'lirili-larila', nameKey: 'character.liriliLarila', tier: 13,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[13]!, asset: characterAsset('lirili-larila'),
    presentation: { scale: 1.03, yPercent: 0, shadowScale: 0.92, collectionScale: 1.03 }
  },
  {
    id: 'chimpanzini-bananini', nameKey: 'character.chimpanziniBananini', tier: 14,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[14]!, asset: characterAsset('chimpanzini-bananini'),
    presentation: { scale: 1.05, yPercent: 0, shadowScale: 0.9, collectionScale: 1.04 }
  },
  {
    id: 'cocofanto-elefanto', nameKey: 'character.cocofantoElefanto', tier: 15,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[15]!, asset: characterAsset('cocofanto-elefanto'),
    presentation: { scale: 1.03, yPercent: 0, shadowScale: 0.94, collectionScale: 1.03 }
  },
  {
    id: 'bombombini-gusini', nameKey: 'character.bombombiniGusini', tier: 16,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[16]!, asset: characterAsset('bombombini-gusini'),
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 1.04, collectionScale: 1.02 }
  },
  {
    id: 'trippi-troppi', nameKey: 'character.trippiTroppi', tier: 17,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[17]!, asset: characterAsset('trippi-troppi'),
    presentation: { scale: 1.04, yPercent: 0, shadowScale: 0.94, collectionScale: 1.03 }
  },
  {
    id: 'la-vacca-saturno-saturnita', nameKey: 'character.laVaccaSaturnoSaturnita', tier: 18,
    incomePerMinute: INCOME_PER_MINUTE_BY_TIER[18]!, asset: characterAsset('la-vacca-saturno-saturnita'),
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 1.02, collectionScale: 1.02 }
  }
] as const;

export const MAX_RUNTIME_TIER = FAMILIES.length;
export const familyById = new Map(FAMILIES.map((family) => [family.id, family]));
export const familyByTier = new Map(FAMILIES.map((family) => [family.tier, family]));

export function nextFamilyFor(familyId: FamilyId): FamilyDefinition | null {
  const family = familyById.get(familyId);
  if (!family) return null;
  return familyByTier.get(family.tier + 1) ?? null;
}

export function assetForUnit(familyId: FamilyId): string | null {
  return familyById.get(familyId)?.asset ?? null;
}

export function mergeRewardForTier(tier: number): number {
  return Math.max(0, Math.floor(tier)) * 4;
}

export function discoveryBonusForTier(tier: number): number {
  return DISCOVERY_BONUS_BY_TIER[Math.floor(tier)] ?? 0;
}

export function brainBoxCostForPurchases(paidBoxes: number): number {
  const safePurchases = Math.max(0, Math.floor(paidBoxes));
  return Math.max(BASE_BOX_COST, Math.ceil(BASE_BOX_COST * BOX_COST_GROWTH ** safePurchases));
}

export function luckyDropChanceForLevel(level: number): number {
  const index = Math.max(0, Math.min(LUCKY_DROP_CHANCE_BY_LEVEL.length - 1, Math.floor(level)));
  return LUCKY_DROP_CHANCE_BY_LEVEL[index]!;
}

export function incomeMultiplierForLevel(level: number): number {
  const index = Math.max(0, Math.min(INCOME_MULTIPLIER_BY_LEVEL.length - 1, Math.floor(level)));
  return INCOME_MULTIPLIER_BY_LEVEL[index]!;
}

export function offlineHoursForLevel(level: number): number {
  const index = Math.max(0, Math.min(OFFLINE_HOURS_BY_LEVEL.length - 1, Math.floor(level)));
  return OFFLINE_HOURS_BY_LEVEL[index]!;
}

export function maxUpgradeLevel(id: UpgradeId): number {
  return upgradeById.get(id)?.costs.length ?? 0;
}

export function upgradeCost(id: UpgradeId, currentLevel: number): number | null {
  const upgrade = upgradeById.get(id);
  if (!upgrade) return null;
  const level = Math.max(0, Math.floor(currentLevel));
  return upgrade.costs[level] ?? null;
}
