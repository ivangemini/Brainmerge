import type { FamilyId } from './types.js';

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
  asset: string;
  presentation: UnitPresentation;
}

export const BOARD_COLUMNS = 6;
export const BOARD_ROWS = 5;
export const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS;
export const SPAWN_COST = 10;
export const FIRST_MISSION_TARGET = 6;
export const FIRST_MISSION_REWARD = 80;
export const DEADLOCK_RESCUE_REFUND = 5;

const BASE_CHARACTER_ATLAS = './public/assets/characters/character-atlas.webp';
const TOILET_BUDDY = './public/assets/characters/toilet-buddy-form-a.webp';

/**
 * Canonical core progression. Brain Box creates only Tier 1. Two identical
 * characters merge into the next entry in this array.
 */
export const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'toilet-buddy',
    nameKey: 'character.toiletBuddy',
    tier: 1,
    asset: TOILET_BUDDY,
    presentation: { scale: 1, yPercent: 0, shadowScale: 0.9, collectionScale: 1 }
  },
  {
    id: 'camera-dude',
    nameKey: 'character.cameraDude',
    tier: 2,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.04, yPercent: 0, shadowScale: 0.9, collectionScale: 1.03 }
  },
  {
    id: 'sigma-rock',
    nameKey: 'character.sigmaRock',
    tier: 3,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 0.92, collectionScale: 1 }
  },
  {
    id: 'rizz-head',
    nameKey: 'character.rizzHead',
    tier: 4,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 0.82, collectionScale: 1 }
  },
  {
    id: 'shark-sneakers',
    nameKey: 'character.sharkSneakers',
    tier: 5,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 0.90, yPercent: 0, shadowScale: 1, collectionScale: 1.03 }
  },
  {
    id: 'crocodile-bomber',
    nameKey: 'character.crocodileBomber',
    tier: 6,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1, yPercent: 0, shadowScale: 1, collectionScale: 1 }
  },
  {
    id: 'coffee-ballerina',
    nameKey: 'character.coffeeBallerina',
    tier: 7,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 1.06, yPercent: 0, shadowScale: 0.86, collectionScale: 1.05 }
  },
  {
    id: 'tung-wood',
    nameKey: 'character.tungWood',
    tier: 8,
    asset: BASE_CHARACTER_ATLAS,
    presentation: { scale: 0.96, yPercent: 0, shadowScale: 0.82, collectionScale: 0.96 }
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
