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

export interface GameState {
  version: 1;
  cells: Cell[];
  coins: number;
  xp: number;
  merges: number;
  selectedIndex: number | null;
  messageKey: string | null;
}

export interface MergeResult {
  state: GameState;
  changed: boolean;
  merged: boolean;
  reason?: 'empty-source' | 'same-cell' | 'mismatch' | 'max-tier';
}
