# Active Session — Brainmerge

## Current objective
Brainmerge is in post-RC retention/meta development. The long-term product objective is now **Brainverse world restoration**, not a ladder of short Campaign stages.

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
- save v5 with Yandex/local persistence;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU core runtime parity;
- browser/motion/accessibility/Yandex CI gates.

## New Campaign direction
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

## Implemented in this pass
- `src/core/campaign.ts` added as Campaign domain foundation;
- first two production worlds each define seven stable Location ids;
- pure Location/World progress calculations;
- restored-landmark counting;
- Raid unlock calculation;
- Campaign core tests;
- Campaign map reinterpreted as 7 Locations + World Raid;
- World Restored / Landmarks / Raid-gate summary added;
- every Location node exposes 0% persistent-progress affordance until save v6 wiring;
- Location overview shows four long-loop phases and its landmark;
- Raid overview shows three persistent phases;
- EN/RU copy updated;
- existing connected map route retained.

The shell still intentionally does **not** mutate GameState or fake persistent completion. Current 0% values are presentation defaults until v6 state lands.

## Approved Campaign Art Pack
Repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- Normal / Challenge / Elite / Boss / Locked reusable Campaign UI assets;
- World 1 Backyard Brainrot Zone environment + boss;
- World 2 Surreal Brainrot City environment + boss.

## Next implementation sequence
1. Save v6 permanent-meta foundation for Locations/Landmarks/Raids + Collection/Prestige fields.
2. Isolated `CampaignRunState`.
3. World 1 Location 1 — Sneaker Garden — playable Stabilize -> Deliver -> Restore -> Mastery vertical slice.
4. World 1 Overgrowth board modifier.
5. Generalize delivery/order and Landmark progression.
6. Author remaining six World 1 Locations mainly through data.
7. Persistent 3-phase World 1 Raid.
8. Collection Rewards + Prestige integration on the same v6 meta.
9. World 2 Traffic Lock + seven Locations + Raid.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
