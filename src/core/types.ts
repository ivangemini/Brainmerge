export type FamilyId =
  | 'camera-dude'
  | 'toilet-buddy'
  | 'sigma-rock'
  | 'rizz-head'
  | 'shark-sneakers'
  | 'crocodile-bomber'
  | 'coffee-ballerina'
  | 'tung-wood';

export interface Unit {
  id: string;
  familyId: FamilyId;
  tier: number;
}

export type Cell = Unit | null;
export type OnboardingPhase = 'merge' | 'spawn' | 'complete';

export interface GameState {
  version: 2;
  cells: Cell[];
  coins: number;
  xp: number;
  merges: number;
  spawns: number;
  missionClaimed: boolean;
  selectedIndex: number | null;
  messageKey: string | null;
}

export interface MergeResult {
  state: GameState;
  changed: boolean;
  merged: boolean;
  reason?: 'empty-source' | 'same-cell' | 'mismatch' | 'max-tier';
}
