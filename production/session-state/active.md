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
- permanent Collection/Prestige metadata slots in save v6;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU core runtime parity;
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

## First playable CampaignRun vertical slice
World 1 / Location 1 — **Sneaker Garden / Stabilize** is playable and CI-green.

Runtime contract:
- separate 6x5 `CampaignRunState`; never aliases main-board cells;
- six Overgrowth cells start blocked;
- four T1 Campaign units create an immediate merge decision;
- Campaign supply drops are free and never spend main-board coins or increment paid Brain Box cost;
- supply tiers are capped by lifetime `maxDiscoveredTier`;
- a successful Campaign merge clears exactly one nearest Overgrowth blocker;
- six clearing pulses complete Stabilize;
- completion commits `stabilize = 1` exactly once, making Sneaker Garden 20% restored;
- partial runs are persisted in save v6 and resume after leaving Campaign/reloading;
- completed temporary run state can be dismissed without erasing permanent Location progress;
- Campaign merge rewards do not change main-board coins, XP, main merge count or main units.

Validation status:
- 81/81 unit/integration tests pass;
- packaged runtime smoke passes;
- Campaign browser smoke starts the run, clears Overgrowth, exits, resumes and reloads the same active run;
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
1. Sneaker Garden Deliver Orders on the same isolated Campaign board.
2. Sneaker Garden Restore Landmark batches and visual restoration state.
3. Sneaker Garden Mastery rules for the final 10%.
4. Generalize Overgrowth + order/landmark progression for the remaining six World 1 Locations.
5. Build persistent 3-phase World 1 Raid.
6. Collection Rewards + Prestige integration on the same v6 meta.
7. World 2 Traffic Lock + seven Locations + Raid.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
