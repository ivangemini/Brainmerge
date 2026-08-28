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

export const FAMILIES: readonly FamilyDefinition[] = [
  {
    id: 'camera-dude',
    nameKey: 'character.cameraDude',
    assetByForm: { 1: './public/assets/characters/camera-dude.webp' },
    presentation: { scale: 1.2, yPercent: 4, shadowScale: 0.78, collectionScale: 1.16 }
  },
  {
    id: 'toilet-buddy',
    nameKey: 'character.toiletBuddy',
    assetByForm: { 1: './public/assets/characters/toilet-buddy.webp' },
    presentation: { scale: 1.06, yPercent: 3, shadowScale: 0.86, collectionScale: 1.06 }
  },
  {
    id: 'sigma-rock',
    nameKey: 'character.sigmaRock',
    assetByForm: { 1: './public/assets/characters/sigma-rock.webp' },
    presentation: { scale: 1.18, yPercent: 4, shadowScale: 0.88, collectionScale: 1.12 }
  },
  {
    id: 'rizz-head',
    nameKey: 'character.rizzHead',
    assetByForm: { 1: './public/assets/characters/rizz-head.webp' },
    presentation: { scale: 1.2, yPercent: 2, shadowScale: 0.74, collectionScale: 1.13 }
  },
  {
    id: 'shark-sneakers',
    nameKey: 'character.sharkSneakers',
    assetByForm: { 1: './public/assets/characters/shark-sneakers.webp' },
    presentation: { scale: 1, yPercent: 5, shadowScale: 1, collectionScale: 1 }
  },
  {
    id: 'crocodile-bomber',
    nameKey: 'character.crocodileBomber',
    assetByForm: { 1: './public/assets/characters/crocodile-bomber.webp' },
    presentation: { scale: 1.08, yPercent: 4, shadowScale: 1.02, collectionScale: 1.04 }
  },
  {
    id: 'coffee-ballerina',
    nameKey: 'character.coffeeBallerina',
    assetByForm: { 1: './public/assets/characters/coffee-ballerina.webp' },
    presentation: { scale: 1.16, yPercent: 2, shadowScale: 0.72, collectionScale: 1.13 }
  },
  {
    id: 'tung-wood',
    nameKey: 'character.tungWood',
    assetByForm: { 1: './public/assets/characters/tung-wood.webp' },
    presentation: { scale: 0.74, yPercent: 9, shadowScale: 0.72, collectionScale: 0.84 }
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
