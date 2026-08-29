export type FamilyId =
  | 'toilet-buddy'
  | 'camera-dude'
  | 'sigma-rock'
  | 'rizz-head'
  | 'shark-sneakers'
  | 'crocodile-bomber'
  | 'coffee-ballerina'
  | 'tung-wood';

export interface Unit {
  id: string;
  familyId: FamilyId;
  /** Position in the single core merge chain. Each tier has exactly one character identity. */
  tier: number;
}

export type Cell = Unit | null;
export type OnboardingPhase = 'merge' | 'spawn' | 'complete';

export interface GameState {
  version: 3;
  cells: Cell[];
  coins: number;
  xp: number;
  merges: number;
  spawns: number;
  /** Highest core merge tier ever created; keeps Collection discovery persistent. */
  maxDiscoveredTier: number;
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
