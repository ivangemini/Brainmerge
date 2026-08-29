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
  assetByForm: Partial<Record<number, string>>;
  presentation: UnitPresentation;
}

export const BOARD_COLUMNS = 6;
export const BOARD_ROWS = 5;
export const BOARD_SIZE = BOARD_COLUMNS * BOARD_ROWS;
export const MAX_RUNTIME_TIER = 3;
export const SPAWN_COST = 10;
export const FIRST_MISSION_TARGET = 6;
export const FIRST_MISSION_REWARD = 80;
export const DEADLOCK_RESCUE_REFUND = 5;

const BASE_CHARACTER_ATLAS = './public/assets/characters/character-atlas.webp';

export const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'camera-dude',
    nameKey: 'character.cameraDude',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1.04, yPercent: 0, shadowScale: 0.9, collectionScale: 1.03 }
  },
  {
    id: 'toilet-buddy',
    nameKey: 'character.toiletBuddy',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1, yPercent: 0, shadowScale: 0.9, collectionScale: 1 }
  },
  {
    id: 'sigma-rock',
    nameKey: 'character.sigmaRock',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 0.92, collectionScale: 1 }
  },
  {
    id: 'rizz-head',
    nameKey: 'character.rizzHead',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1.02, yPercent: 0, shadowScale: 0.82, collectionScale: 1 }
  },
  {
    id: 'shark-sneakers',
    nameKey: 'character.sharkSneakers',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 0.90, yPercent: 0, shadowScale: 1, collectionScale: 1.03 }
  },
  {
    id: 'crocodile-bomber',
    nameKey: 'character.crocodileBomber',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1, yPercent: 0, shadowScale: 1, collectionScale: 1 }
  },
  {
    id: 'coffee-ballerina',
    nameKey: 'character.coffeeBallerina',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 1.06, yPercent: 0, shadowScale: 0.86, collectionScale: 1.05 }
  },
  {
    id: 'tung-wood',
    nameKey: 'character.tungWood',
    assetByForm: { 1: BASE_CHARACTER_ATLAS },
    presentation: { scale: 0.96, yPercent: 0, shadowScale: 0.82, collectionScale: 0.96 }
  }
] as const;

export const familyById = new Map(FAMILIES.map((family) => [family.id, family]));

export function visualFormForTier(tier: number): number {
  return Math.floor((Math.max(1, tier) - 1) / 3) + 1;
}

export function assetForUnit(familyId: FamilyId, tier: number): string | null {
  const family = familyById.get(familyId);
  if (!family) return null;
  return family.assetByForm[visualFormForTier(tier)] ?? null;
}
