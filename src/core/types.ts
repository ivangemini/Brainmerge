import type { CampaignProgress } from './campaign.js';

export type FamilyId =
  | 'toilet-buddy'
  | 'camera-dude'
  | 'sigma-rock'
  | 'rizz-head'
  | 'shark-sneakers'
  | 'crocodile-bomber'
  | 'coffee-ballerina'
  | 'tung-wood'
  | 'brr-brr-patapim'
  | 'boneca-ambalabu'
  | 'cappuccino-assassino'
  | 'frigo-camelo'
  | 'lirili-larila'
  | 'chimpanzini-bananini'
  | 'cocofanto-elefanto'
  | 'bombombini-gusini'
  | 'trippi-troppi'
  | 'la-vacca-saturno-saturnita';

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

export interface PrestigeUpgradeLevels {
  income: number;
  boxDiscount: number;
  startingCoins: number;
  offline: number;
  campaignPower: number;
}

export type PrestigeUpgradeId = keyof PrestigeUpgradeLevels;

export type VisitorObjectiveKind = 'merges' | 'boxes' | 'campaignDelivery';

export interface VisitorEventState {
  id: string;
  character: 'sneakerCourier' | 'pigeonInspector' | 'watermelonCook';
  kind: VisitorObjectiveKind;
  target: number;
  progress: number;
  remainingMs: number;
}

export interface FastEventState {
  /** Monotonic foreground gameplay time; hidden/ad time is never added. */
  activeMs: number;
  comboCount: number;
  comboExpiresAtActiveMs: number;
  feverCharge: number;
  feverRemainingMs: number;
  feverCooldownRemainingMs: number;
  nextVisitorAtActiveMs: number;
  visitorSequence: number;
  visitor: VisitorEventState | null;
}

export interface RetentionState {
  firstSeenAt: number;
  lastSessionAt: number;
  sessionCount: number;
  tier5ActiveMs: number | null;
  tier8ActiveMs: number | null;
  tier18ActiveMs: number | null;
  activeAfterT18Ms: number;
  firstPrestigeActiveMs: number | null;
  world1RaidClearActiveMs: number | null;
}

export type CampaignRunPhase = 'stabilize' | 'deliver' | 'restore' | 'mastery';

/**
 * Temporary/resumable Campaign-board state. It is intentionally isolated from
 * the main idle board: units, selection, orders and World modifier state live here.
 * Restore and Mastery intentionally reuse the v6 order cursor instead of adding a
 * new save version: permanent Landmark/Mastery truth continues to live in CampaignProgress.
 */
export interface CampaignRunState {
  worldId: number;
  locationId: string;
  phase: CampaignRunPhase;
  cells: Cell[];
  /** True entries are unusable World-modifier cells. */
  overgrowth: boolean[];
  overgrowthTotal: number;
  merges: number;
  spawns: number;
  /** Persistent deterministic order targets for Deliver/Restore/Mastery. Empty during Stabilize. */
  orderTiers: number[];
  /** Number of order targets already consumed from the Campaign board. */
  orderIndex: number;
  selectedIndex: number | null;
  completed: boolean;
}

export type CampaignRaidPhase = 1 | 2 | 3;

export interface CampaignRaidRunState {
  worldId: number;
  phase: CampaignRaidPhase;
  cells: Cell[];
  overgrowth: boolean[];
  merges: number;
  orderTiers: number[];
  orderIndex: number;
  selectedIndex: number | null;
  completed: boolean;
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
  version: 10;
  /** Monotonic persistence revision used to resolve local/cloud conflicts. */
  saveRevision: number;
  /** Wall-clock timestamp of the persisted snapshot; revision wins when available. */
  savedAt: number;
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
  /** Highest tier created in the current main-board run; resets on Prestige. */
  runMaxTier: number;
  /** Index of the active mission in the deterministic first-cycle mission track. */
  missionIndex: number;
  upgrades: UpgradeLevels;
  /** Fractional passive income carried between deterministic accrual ticks. */
  incomeRemainder: number;
  /** Last timestamp already accounted for by online/offline passive income. */
  lastAccrualAt: number;
  /** Offline production waiting for an explicit player collect action. */
  pendingOfflineCoins: number;
  /** Permanent Collection milestone ids already claimed. */
  collectionRewardClaims: string[];
  /** Number of completed Brain Reset cycles. */
  prestigeCount: number;
  /** Permanent meta currency. Never spent by the ordinary Brain Box/Brain Lab economy. */
  brainCells: number;
  prestigeUpgrades: PrestigeUpgradeLevels;
  events: FastEventState;
  retention: RetentionState;
  /** Permanent Brainverse location / landmark / raid progress. */
  campaign: CampaignProgress;
  /** Optional resumable Campaign board. Never aliases or consumes main-board cells. */
  campaignRun: CampaignRunState | null;
  /** Optional resumable World Raid board, isolated from both ordinary and Location boards. */
  raidRun: CampaignRaidRunState | null;
  selectedIndex: number | null;
  messageKey: string | null;
}

export interface MergeResult {
  state: GameState;
  changed: boolean;
  merged: boolean;
  reason?: 'empty-source' | 'same-cell' | 'mismatch' | 'max-tier';
}
