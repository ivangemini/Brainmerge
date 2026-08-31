# Active Session — Brainmerge

## Current objective
Brainmerge is in post-RC retention/meta development. The long-term product objective is **Brainverse world restoration**, not a ladder of short Campaign stages.

Each Campaign world contains:
- 7 persistent Locations;
- 1 persistent multi-phase World Raid;
- a World Restored percentage;
- Location landmarks;
- four Location phases: Stabilize -> Deliver Orders -> Restore Landmark -> Mastery.

The validated T1-T18 merge-idle board remains the primary account-growth loop.

## Current production baseline
- browser-first TypeScript runtime;
- 6x5 main merge board;
- one sequential T1-T18 chain;
- passive income, Brain Box economy, Brain Lab, missions, offline reward, Collection, Rescue and `Next move`;
- canonical save v6 with Yandex/local persistence and v1-v5 migration;
- permanent Campaign Location / Landmark / Raid progress in save v6;
- resumable isolated `CampaignRunState` in the same canonical save;
- permanent Collection/Prestige metadata slots in save v6;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU runtime parity;
- browser/motion/accessibility/Yandex CI gates.

## Campaign direction
The obsolete `8 short stages per world / 64 one-shot stages / 3 stars` plan is retired.

Target full Campaign:
- 8 worlds;
- 7 persistent Locations per world;
- 1 World Raid per world;
- 56 Locations + 8 Raids;
- Campaign progress survives Prestige.

Initial Location phase weighting:
- Stabilize 20%;
- Deliver Orders 25%;
- Restore Landmark 45%;
- Mastery 10%.

Initial World Raid gate:
- >=80% World Restored;
- >=5 restored landmarks.

World Raids are persistent 3-phase bosses whose progress survives sessions.

## Implemented Campaign foundation
- `src/core/campaign.ts` owns persistent Campaign domain state;
- first two production worlds each define seven stable Location ids;
- pure Location/World progress calculations;
- restored-landmark counting;
- Raid unlock calculation;
- Campaign map reads canonical save-v6 presentation snapshots;
- World Restored / Landmarks / Raid-gate summary;
- Location overview with four persistent phases and landmark;
- Raid overview with three persistent phases;
- EN/RU Campaign copy;
- browser smoke verifies Campaign progress survives a clean storage handoff.

## First complete Campaign Location vertical slice
World 1 / Location 1 — **Sneaker Garden** now has all four playable phases on one isolated 6x5 Campaign board.

### Stabilize — 20%
- six Overgrowth cells start blocked;
- four T1 Campaign units create an immediate merge decision;
- free Campaign Supply never spends main-board coins or paid Brain Box inflation;
- supply tiers are capped by lifetime `maxDiscoveredTier`;
- each successful merge clears exactly one nearest Overgrowth blocker;
- six clearing pulses commit `stabilize = 1` exactly once.

### Deliver Orders — +25%
- deterministic four-order queue `[T2, T2, T3, T4]`, capped by lifetime discovery;
- delivery consumes only the matching Campaign-board unit;
- each order commits one quarter of Deliver exactly once;
- partial order cursor survives exit/reload;
- completing all four raises Sneaker Garden from 20% to 45%.

### Restore Landmark — +45%
- six restoration orders are grouped into three two-order batches;
- only a completed two-order batch commits permanent Landmark progress;
- batches map to Giant Sneaker Flower Bed levels 1, 2 and 3;
- Landmark level permanently increases stronger Campaign Supply chance from 25% baseline up to 40% at level 3;
- completing all three levels raises Sneaker Garden from 45% to 90%.

### Mastery — +10%
- three final high-pressure orders;
- stronger five-cell Overgrowth remains locked during the phase and cannot be cleared by merge pulses;
- Landmark Supply bonus remains active;
- completing all Mastery orders commits the final 10%, taking Sneaker Garden to 100%.

### Isolation / persistence contract
- Campaign board never aliases or consumes main-board cells;
- Campaign actions do not change main-board coins, XP, main merge count or paid Brain Box inflation;
- active Stabilize/Deliver/Restore/Mastery runs are persisted in save v6 and resume after reload;
- completed temporary run state can be dismissed without erasing permanent Location progress.

Validation status:
- unit/integration suite covers Stabilize, Deliver, Restore batch atomicity, Landmark perk and Mastery completion;
- packaged runtime smoke passes;
- Campaign shell smoke covers save/reload + Stabilize/Deliver resume;
- dedicated Restore + Mastery Chromium smoke verifies Landmark Lv1 persistence and final 100% completion;
- packaged RC, motion, RU runtime and Yandex adapter smokes pass;
- package/release audit passes.

## Approved Campaign Art Pack
Repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- Normal / Challenge / Elite / Boss / Locked reusable Campaign UI assets;
- World 1 Backyard Brainrot Zone environment + boss;
- World 2 Surreal Brainrot City environment + boss.

## Next implementation sequence
1. Generalize the proven Sneaker Garden phase engine into data-driven World 1 Location configs.
2. Make Toilet Pond playable using the same phase framework with Location-specific goals/landmark identity.
3. Implement Watermelon Grill, Hose Tunnels, Gnome Yard, Mushroom Field and Backyard Core.
4. Build persistent 3-phase World 1 Raid using the same isolated Campaign board/state boundary.
5. Collection Rewards + Prestige integration on the same v6 meta.
6. World 2 Traffic Lock + seven Locations + Raid.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`