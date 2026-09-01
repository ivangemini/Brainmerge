# Brainmerge — Campaign and Meta Progression

## Current implementation snapshot
Current `main` uses canonical save **v6** and already contains a resumable isolated `CampaignRunState` plus a complete four-phase World 1 / Sneaker Garden vertical slice.

Implemented now:
- permanent world/Location/Landmark/Raid progress schema;
- active Campaign board persistence/resume;
- Stabilize, Deliver, Restore Landmark and Mastery for Sneaker Garden;
- World Restored calculation and Raid gate derivation;
- Campaign/main-board isolation;
- lifetime-discovery caps on Campaign order/supply tiers.

Still pending:
- data-driven implementation of the remaining six World 1 Locations;
- playable persistent World 1 Raid;
- actual Collection Reward claim transaction;
- actual Prestige reset/reward transaction and Brain Cell spend tree;
- proof that gameplay-earned Campaign progress survives the implemented Prestige transaction.

## Product north star
Brainmerge is not designed to end at T18. The long-term objective is to **restore the Brainverse**: persistent Locations are stabilized, supplied, rebuilt and mastered, then a persistent multi-phase World Raid closes the world.

Layered product loop:

`main T1-T18 run → Collection / Prestige → Campaign Locations → Landmarks → World Progress → World Raid → next world`

The main merge board remains the primary account-growth loop. Campaign gives that growth a long-term purpose.

The old `64 short one-shot stages / 3 stars` model is retired.

## Target Campaign macro structure
- 8 worlds;
- 7 persistent Locations per world;
- 1 persistent World Raid per world;
- 56 Locations + 8 World Raids total;
- worlds unlock sequentially;
- Campaign permanent progress survives Prestige by contract.

Working themes:
1. Backyard Brainrot Zone
2. Surreal Brainrot City
3. Meme Factory
4. Italian / Mediterranean Chaos
5. Sky Brainrot
6. Surreal Brain Lab
7. Space Brainrot
8. Brainverse Core

World names remain localization-owned and must not be baked into backgrounds.

## Location model
Each Location uses four phases:

### 1. Stabilize — 20%
Enter an isolated Campaign board and deal with the world modifier/control objective.

### 2. Deliver Orders — +25%
Create requested tiers on the Campaign board and choose whether to merge upward or deliver now for permanent progress.

### 3. Restore Landmark — +45%
Complete delivery batches that permanently restore/upgrade the Location Landmark and can unlock bounded Campaign/world perks.

### 4. Mastery — +10%
Harder rules/orders complete the final 10% without a separate star system.

Cumulative Location restoration:
- Stabilize complete: 20%;
- Deliver complete: 45%;
- Restore complete: 90%;
- Mastery complete: 100%.

## World Progress and Raid gate
World Restored % is the average restoration percentage of the seven Locations.

Initial Raid gate:
- at least **80% World Restored**;
- at least **5 restored Landmarks**.

This must remain an earned gameplay gate, not an energy wall, mandatory-ad gate or arbitrary real-time wait.

## Deliver Orders contract
- order targets are deterministic/data-driven;
- targets cannot exceed lifetime discovery in the current contract;
- delivery consumes only the Campaign-board unit;
- delivery never consumes main-board pieces;
- completed orders commit permanent progress exactly once;
- leaving/reloading may resume a run without duplicating progress.

## Campaign run isolation
`GameState` owns the ordinary persistent run and permanent meta.

`CampaignProgress` owns permanent world/Location/Landmark/Raid state.

`CampaignRunState` owns the resumable temporary Campaign encounter:
- separate 6×5 Campaign cells;
- phase;
- world modifier state;
- merge/spawn counters;
- deterministic order list/cursor;
- Campaign selection/completion.

Campaign actions must not silently alter:
- main-board cells;
- ordinary coins;
- paid Brain Box inflation;
- main-run merge counters;
- lifetime discovery beyond the merge-first account contract.

Free Campaign Supply is separate from paid Brain Box economy.

## Save v6 Campaign/meta data
Canonical save v6 currently includes:
- world unlock/clear state;
- per-Location Stabilize progress;
- per-Location Deliver progress;
- per-Location Landmark restoration progress;
- per-Location Mastery progress;
- Raid phase/progress/clear foundation;
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- optional active CampaignRunState snapshot.

Valid v1-v5 saves migrate into v6 and invalid values are deterministically sanitized/clamped.

## Implemented World 1 reference Location — Sneaker Garden
Sneaker Garden is the reusable-engine reference implementation.

### Stabilize
- isolated 6×5 Campaign board;
- six Overgrowth blockers;
- four starting T1 units;
- each successful merge clears exactly one nearest blocker;
- six clearing pulses complete and commit the phase exactly once.

### Deliver Orders
- four-order deterministic queue;
- reference max-T4 queue: `T2, T2, T3, T4`;
- each matching delivery consumes only the selected Campaign unit;
- each order commits one quarter of Deliver progress exactly once.

### Restore Landmark
- six orders in three atomic two-order batches;
- reference max-T4 queue: `T2, T2, T3, T3, T4, T4`;
- only a complete two-order batch commits permanent Landmark progress;
- batches map to Giant Sneaker Flower Bed Lv1, Lv2 and Lv3;
- Lv1/Lv2/Lv3 correspond to restore progress `1/3`, `2/3`, `1`.

Current Landmark perk:
- stronger Campaign Supply chance base: **25%**;
- +5 percentage points per restored Landmark level;
- Lv3: **40%**;
- never reveals an undiscovered lifetime tier.

### Mastery
- reference max-T4 queue: `T3, T4, T4`;
- five Overgrowth cells remain blocked;
- Mastery merge pulses do not clear those blockers;
- Landmark Supply perk remains active;
- all three orders commit the final 10% and reach 100%.

### Persistence/QA contract
- partial runs resume after leaving Campaign/reload;
- Restore commits are atomic per two-order batch;
- completed temporary run state can be acknowledged without erasing permanent progress;
- permanent truth remains in CampaignProgress, not UI presentation state.

## World modifiers
Worlds must alter Campaign board decisions, not only art.

Current reference:
- **World 1 — Overgrowth** implemented in Sneaker Garden.

Next production target:
- **World 2 — Traffic Lock**.

Future provisional concepts:
- World 3 — Conveyor Mutation;
- World 4 — Recipe Chaos;
- World 5 — Wind Lanes;
- World 6 — Mutation Vats;
- World 7 — Gravity;
- World 8 — Core Corruption combining proven mechanics.

Modifiers remain deterministic, touch-readable and isolated from the main board.

## Landmarks
Every Location owns one signature surreal Landmark.

World 1 identities:
- Giant Sneaker Flower Bed;
- Toilet Birdbath;
- Living Watermelon Grill;
- Hose Creature Well;
- Gnome Signal Tower;
- Sneaker Mushroom Grove;
- Backyard Brain Core.

World 2 identities:
- Sneaker Bus Depot;
- Pigeon Fountain;
- Vending Tower;
- Long-Neck Traffic Hub;
- Sunglasses Market;
- Walking Appliance Block;
- Brainrot City Core.

Landmarks provide visible restoration payoff and bounded system payoff. They are not generic currency-shop upgrades.

## World Raids
Node 8 is a persistent World Raid, not a short boss stage.

Current foundation:
- Raid state exists in permanent Campaign schema;
- Raid gate derivation exists;
- next-world unlock derivation exists.

Playable Raid gameplay is still pending.

Target Raid contract:
- three phases;
- progress survives sessions;
- merge/order contributions are deterministic;
- later phases intensify the world modifier;
- final phase uses high-value deliveries;
- clear unlocks the next world exactly once.

Boss art is presentation only; HP/phase/orders/rewards/unlocks remain code-owned.

## Campaign ↔ main T1-T18 progression
- lifetime discovery comes from main merge progression;
- Campaign order/supply tiers are capped by lifetime discovery;
- higher lifetime tiers unlock harder Campaign requests;
- Campaign rewards/meta may improve long-term power without replacing the main merge loop;
- permanent Campaign progress must survive Prestige.

## Collection Rewards
Approved milestones:
- 5/18;
- 10/18;
- 15/18;
- 18/18.

Save v6 already stores claimed ids. Actual reward data/claim transaction/UI are still pending.

## Prestige / Brain Reset
Target first unlock: T18.

Expected reset:
- main board;
- coins;
- paid Brain Box inflation;
- Brain Lab run upgrades;
- run-level passive remainder/pending state.

Expected preserve:
- lifetime Collection discovery;
- claimed Collection Rewards;
- Campaign Worlds/Locations/Landmarks/Raids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades.

Save v6 already stores permanent meta fields; actual reset/reward/spend transactions are pending.

## UX/navigation contract
- mobile remains board-first;
- Missions / Collection / Brain Lab remain in the three-item dock;
- Campaign is a prominent top-level map destination;
- map nodes 1–7 represent Locations;
- node 8 represents World Raid;
- header exposes World Restored %, Landmark count and Raid gate;
- Location detail exposes four phases and Landmark;
- active playable phase exposes Start/Resume and opens isolated Campaign board;
- persistent values come from core/save snapshots, never presentation defaults.

## Delivery strategy from here
1. **Done:** persistent Campaign domain + save v6.
2. **Done:** isolated CampaignRunState + complete Sneaker Garden four-phase slice.
3. **Next:** generalize the phase engine into data-driven World 1 Location definitions.
4. Author the remaining six World 1 Locations mostly through configuration.
5. Implement the persistent three-phase World 1 Raid.
6. Implement Collection Reward + Prestige transactions on the existing permanent-meta schema.
7. Implement World 2 Traffic Lock + seven Locations + Raid.
8. Playtest duration/retention before expanding Worlds 3–8.

## Validation requirements
Existing repository coverage targets/contains checks for:
- v1-v5 → v6 migration/sanitization;
- Location phase percentage calculations;
- World Progress / restored-Landmark count / Raid gate;
- Campaign/main-board isolation;
- active CampaignRun resume;
- delivery consumption/exact-once commit;
- Restore batch atomicity/persistence;
- Mastery completion to 100%;
- EN/RU parity and browser Campaign geometry/runtime smoke.

Still required before the long loop is complete:
- gameplay-earned Raid persistence/world unlock;
- Collection no-double-claim transaction;
- Prestige reset/preserve/no-double-award;
- Campaign progress surviving actual Prestige;
- dedicated RU CampaignRun interaction smoke.

A listed script/check is not proof of a passing run; verification must be run for the relevant revision.
