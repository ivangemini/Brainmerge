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
export type MissionKind = 'merges' | 'discover' | 'spawns';

export interface MissionDefinition {
  id: string;
  kind: MissionKind;
  target: number;
  reward: number;
  titleKey: string;
  textKey: string;
}

export type UpgradeId = 'boxBaseTier' | 'luckyDrop' | 'income' | 'offline';

export interface UpgradeLevels {
  boxBaseTier: number;
  luckyDrop: number;
  income: number;
  offline: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  titleKey: string;
  descriptionKey: string;
  costs: readonly number[];
}

export type NextActionKind = 'offline' | 'mission' | 'rescue' | 'merge' | 'upgrade' | 'box' | 'wait' | 'complete';

export interface NextActionHint {
  kind: NextActionKind;
  amount?: number;
  cost?: number;
  minutes?: number;
  upgradeCount?: number;
  nextTier?: number;
}

export interface GameState {
  version: 5;
  cells: Cell[];
  coins: number;
  xp: number;
  merges: number;
  /** All Brain Box openings, including rewarded. Used by mission progress. */
  spawns: number;
  /** Paid Brain Box purchases only. Drives escalating paid-box price. */
  paidBoxes: number;
  /** Highest core merge tier ever created; keeps Collection discovery persistent. */
  maxDiscoveredTier: number;
  /** Index of the active mission in the deterministic first-cycle mission track. */
  missionIndex: number;
  upgrades: UpgradeLevels;
  /** Fractional passive income carried between deterministic accrual ticks. */
  incomeRemainder: number;
  /** Last timestamp already accounted for by online/offline passive income. */
  lastAccrualAt: number;
  /** Offline production waiting for an explicit player collect action. */
  pendingOfflineCoins: number;
  selectedIndex: number | null;
  messageKey: string | null;
}

export interface MergeResult {
  state: GameState;
  changed: boolean;
  merged: boolean;
  reason?: 'empty-source' | 'same-cell' | 'mismatch' | 'max-tier';
}
