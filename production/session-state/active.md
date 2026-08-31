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

Location phase weighting:
- Stabilize 20%;
- Deliver Orders 25%;
- Restore Landmark 45%;
- Mastery 10%.

World Raid gate:
- >=80% World Restored;
- >=5 restored landmarks.

World Raids are persistent 3-phase bosses whose progress survives sessions.

## Implemented Campaign foundation
- `src/core/campaign.ts` owns persistent Campaign domain state;
- `src/core/world1-campaign-run.ts` owns the data-driven World 1 run engine;
- all seven World 1 Locations have stable run configs, Location-specific Overgrowth layouts and order-tier pressure;
- pure Location/World progress calculations and restored-landmark counting;
- Raid unlock calculation;
- Campaign map reads canonical save-v6 presentation snapshots;
- World Restored / Landmarks / Raid-gate summary;
- Location overview with four persistent phases and landmark;
- Raid overview with three persistent phases;
- generic World 1 CampaignRun UI binds the same isolated 6x5 board to whichever unlocked Location owns the active run;
- EN/RU Campaign copy is parameterized by Location/Landmark identity;
- browser smoke verifies Campaign progress and active runs survive clean reload/storage handoff.

## World 1 route contract
- Location 1 starts unlocked;
- Location N unlocks when Location N-1 completes **Restore Landmark** (`restore = 1` / 90% cumulative Location restoration);
- Mastery is optional for forward route progression but required for that Location's 100% completion;
- locked route nodes use locked art, expose `aria-disabled=true`, and cannot launch a Campaign run;
- first lifetime discovery remains main-chain merge-first; Campaign orders are capped by `maxDiscoveredTier`.

## Location 1 — Sneaker Garden — complete 0 -> 100%
### Stabilize — 20%
- six Overgrowth cells start blocked;
- four T1 Campaign units create an immediate merge decision;
- free Campaign Supply never spends main-board coins or paid Brain Box inflation;
- each successful merge clears exactly one nearest Overgrowth blocker.

### Deliver Orders — +25%
- deterministic four-order queue `[T2, T2, T3, T4]`, capped by lifetime discovery;
- delivery consumes only the matching Campaign-board unit;
- partial order cursor survives exit/reload.

### Restore Landmark — +45%
- six restoration orders are grouped into three atomic two-order batches;
- batches map to Giant Sneaker Flower Bed levels 1, 2 and 3;
- Landmark level raises stronger Campaign Supply chance from 25% baseline up to 40% at level 3.

### Mastery — +10%
- three final high-pressure orders;
- stronger five-cell Overgrowth stays locked during Mastery;
- completion takes Sneaker Garden to 100%.

## Location 2 — Toilet Pond — first generic-location validation complete
- unlocks after Sneaker Garden Landmark reaches Restore=100%; Sneaker Mastery is not required;
- starts a separate Toilet Pond Stabilize run on the same generic 6x5 Campaign engine;
- Toilet Pond Stabilize uses seven Location-specific Overgrowth blockers;
- order ranges are data-driven from the Location definition and remain lifetime-discovery capped;
- main board/economy remains untouched;
- active Toilet Pond run persists in save v6 and resumes after reload;
- Chromium World 1 smoke verifies route locking, launch, merge/blocker progress and reload/resume on mobile.

## Locations 3–7 — engine/config ready, content validation pending
The generic runtime already supports:
- Watermelon Grill;
- Hose Tunnels;
- Gnome Yard;
- Mushroom Field;
- Backyard Core.

Each has its own Overgrowth layouts and increasing order-tier range, but these five Locations are **not yet pacing/content-sign-off complete**. Validate them through the same browser/runtime path rather than creating bespoke gameplay branches.

## Isolation / persistence contract
- Campaign board never aliases or consumes main-board cells;
- Campaign actions do not change main-board coins, XP, main merge count or paid Brain Box inflation;
- active Stabilize/Deliver/Restore/Mastery runs persist in save v6 and resume after reload;
- completed temporary run state can be dismissed without erasing permanent Location progress.

## Current validation status
- unit/integration suite covers Sneaker Garden end-to-end plus generic World 1 unlock/order/isolation/persistence behavior;
- packaged runtime smoke passes;
- Campaign shell smoke covers save/reload + Stabilize/Deliver resume;
- Restore + Mastery Chromium smoke verifies Landmark persistence and 100% Sneaker Garden completion;
- World 1 Chromium smoke verifies Toilet Pond unlock/locked-next-node semantics and active-run reload;
- packaged RC, motion, RU runtime and Yandex adapter smokes remain required gates;
- package/release audit remains required.

## Approved Campaign Art Pack
Repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- Normal / Challenge / Elite / Boss / Locked reusable Campaign UI assets;
- World 1 Backyard Brainrot Zone environment + boss;
- World 2 Surreal Brainrot City environment + boss.

## Next implementation sequence
1. Validate/tune Watermelon Grill, Hose Tunnels, Gnome Yard, Mushroom Field and Backyard Core through the generic World 1 engine.
2. Complete enough World 1 Locations to naturally satisfy the >=80% + 5 Landmark Raid gate.
3. Build persistent 3-phase World 1 Raid on the isolated Campaign state boundary.
4. Collection Rewards + Prestige integration on save v6 meta.
5. World 2 Traffic Lock + seven Locations + Raid.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
