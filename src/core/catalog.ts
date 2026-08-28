import type { FamilyId } from './types.js';

export interface FamilyDefinition {
  id: FamilyId;
  nameKey: string;
  assetByForm: Partial<Record<number, string>>;
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
  { id: 'camera-dude', nameKey: 'character.cameraDude', assetByForm: { 1: './public/assets/characters/camera-dude.webp' } },
  { id: 'toilet-buddy', nameKey: 'character.toiletBuddy', assetByForm: { 1: './public/assets/characters/toilet-buddy.webp' } },
  { id: 'sigma-rock', nameKey: 'character.sigmaRock', assetByForm: { 1: './public/assets/characters/sigma-rock.webp' } },
  { id: 'rizz-head', nameKey: 'character.rizzHead', assetByForm: { 1: './public/assets/characters/rizz-head.webp' } },
  { id: 'shark-sneakers', nameKey: 'character.sharkSneakers', assetByForm: { 1: './public/assets/characters/shark-sneakers.webp' } },
  { id: 'crocodile-bomber', nameKey: 'character.crocodileBomber', assetByForm: { 1: './public/assets/characters/crocodile-bomber.webp' } },
  { id: 'coffee-ballerina', nameKey: 'character.coffeeBallerina', assetByForm: { 1: './public/assets/characters/coffee-ballerina.webp' } },
  { id: 'tung-wood', nameKey: 'character.tungWood', assetByForm: { 1: './public/assets/characters/tung-wood.webp' } }
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
