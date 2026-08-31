# Brainmerge — Campaign and Meta Progression

## Product north star
Brainmerge is not designed to end at T18 and it is no longer designed around dozens of short one-shot Campaign stages.

The long-term objective is to **restore the Brainverse**: each world contains persistent Locations that take multiple sessions to stabilize, supply, rebuild and master, followed by a persistent multi-phase World Raid.

The layered product loop is:

`main T1-T18 run -> Collection / Prestige -> Campaign Locations -> Landmarks -> World Progress -> World Raid -> next world`

The main merge board remains the primary account-growth loop. Campaign gives that growth a long-term purpose.

## Campaign macro structure
Target complete Campaign:

- 8 worlds;
- 7 persistent Locations per world;
- 1 World Raid per world;
- 56 Locations + 8 World Raids total;
- Campaign progress survives Prestige;
- worlds unlock sequentially;
- later worlds may require prior raid clears plus account-level Prestige/Brain Power gates.

The old `8 short stages per world / 64 one-shot stages / 3 stars per stage` model is obsolete.

Working world themes:

1. Backyard Brainrot Zone
2. Surreal Brainrot City
3. Meme Factory
4. Italian / Mediterranean Chaos
5. Sky Brainrot
6. Surreal Brain Lab
7. Space Brainrot
8. Brainverse Core

World names remain localization-owned and must not be baked into generated backgrounds.

## Location model
Each of the first seven map nodes is a **persistent Location**, not a disposable level.

Every Location has four progression phases:

1. **Stabilize — 20%**
   - enter an isolated Campaign board;
   - deal with the world's board modifier;
   - complete control objectives that prove the player can operate in the area.

2. **Deliver Orders — 25%**
   - the Location requests specific Brainrots / tier combinations;
   - the player creates them on the Campaign board;
   - delivering a requested unit removes it from the Campaign board and commits permanent Location progress;
   - the player must decide whether to merge a valuable unit upward or deliver it now.

3. **Restore Landmark — 45%**
   - completed delivery batches rebuild and upgrade the Location's signature landmark;
   - Landmark progress is permanent;
   - Landmark levels provide bounded Campaign/world perks and visible restoration payoff;
   - exact perk values remain balance data unless explicitly locked below.

4. **Mastery — 10%**
   - harder rules / efficient orders / stronger world modifier;
   - completes the final 10% of the Location;
   - supports long-tail replay without a separate 3-star system.

A fully restored non-mastery Location reaches 90%; Mastery brings it to 100%.

## World Progress
Each world exposes one persistent `World Restored` percentage derived from its seven Locations.

Initial weighting per Location:

- Stabilize: 20%
- Deliver: 25%
- Restore Landmark: 45%
- Mastery: 10%

World Progress is the average Location restoration percentage.

The first World Raid unlock rule is:

- at least **80% World Restored**;
- at least **5 restored landmarks**.

This must remain an earned gameplay gate rather than an arbitrary real-time wait, energy wall or mandatory-ad gate.

## Landmark progression
Every Location has one signature Landmark tied to that world's surreal art direction.

World 1 examples:

- Giant Sneaker Flower Bed
- Toilet Birdbath
- Living Watermelon Grill
- Hose Creature Well
- Gnome Signal Tower
- Sneaker Mushroom Grove
- Backyard Brain Core

World 2 examples:

- Sneaker Bus Depot
- Pigeon Fountain
- Vending Tower
- Long-Neck Traffic Hub
- Sunglasses Market
- Walking Appliance Block
- Brainrot City Core

Landmark upgrades create both:

- **visible payoff** — restored/upgraded state, stronger highlight or completion treatment;
- **system payoff** — bounded Campaign modifiers such as better supply, order efficiency or raid efficiency.

Landmarks are not generic currency shops. Their main progression comes from playing their Location.

## Deliver Orders contract
Deliveries are a central Campaign decision mechanic.

- an order requests one or more tier targets;
- the player produces those targets on the isolated Campaign board;
- delivery consumes the Campaign-board unit only;
- delivery never consumes the player's main idle-board unit;
- completed orders commit permanent Location/Landmark progress exactly once;
- order difficulty rises through the world;
- orders cannot request an undiscovered lifetime tier in the current product contract.

This keeps the main T1-T18 discovery loop strategically relevant.

## World modifiers
Each world changes Campaign-board decisions instead of only changing the background.

Initial concepts:

- **World 1 — Overgrowth:** cells are blocked; early phases can clear some blockers through merges, while harder variants may keep blockers permanent.
- **World 2 — Traffic Lock:** roadblock cells restrict usable board space / spawn lanes and can rotate through the encounter.
- **World 3 — Conveyor Mutation:** selected rows/columns shift after configured actions.
- **World 4 — Recipe Chaos:** delivery chains create temporary recipe/order constraints.
- **World 5 — Wind Lanes:** movement/spawn pressure changes across lanes.
- **World 6 — Mutation Vats:** cells gain temporary lab states that alter planning.
- **World 7 — Gravity:** pieces shift according to active gravity rules.
- **World 8 — Core Corruption:** combines proven mechanics from previous worlds.

Only Worlds 1-2 are current production targets. Future modifiers remain provisional until implemented and playtested.

## World Raids
Node 8 is a **persistent World Raid**, not a two-minute boss stage.

Raid contract:

- 3 major phases in the initial design;
- boss progress/HP persists between sessions;
- the player's Campaign board remains active throughout the raid;
- merge orders and deliveries drive boss progress;
- ordinary merges may provide small baseline progress;
- later phases intensify the world's board modifier;
- final phase requires high-value deliveries / objectives;
- completing the raid unlocks the next world;
- 100% world restoration may require both full Location mastery and raid completion.

Boss art is presentation. Boss HP, phase, objective queue, rewards and unlock logic are code-owned.

## Campaign run isolation
Campaign must never silently rewrite the player's main idle board.

Current architecture:

- `GameState` owns the persistent main merge/economy run;
- `CampaignProgress` owns permanent world/location/landmark/raid progress;
- `CampaignRunState` owns a resumable isolated Campaign board, order cursor and world-modifier state;
- entering a playable Location starts/resumes `CampaignRunState`;
- leaving the Campaign board does not discard the run;
- Campaign units never alias or consume main-board units;
- free Campaign Supply never spends ordinary coins or increases paid Brain Box inflation;
- only explicit completed Campaign rewards/permanent progress flow back to account state;
- active CampaignRunState is serialized inside canonical save v6, not a second localStorage key.

## Campaign persistent data — save v6
Save v6 currently owns:

- per-world unlock/clear state;
- per-Location Stabilize progress;
- per-Location Deliver progress;
- per-Location Landmark restoration progress;
- per-Location Mastery progress;
- World Raid phase/progress/clear state foundation;
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- optional active `CampaignRunState` snapshot.

Progress is sanitized/clamped deterministically. v1-v5 saves migrate into this schema.

## Implemented World 1 vertical slice — Sneaker Garden
Sneaker Garden is the reference implementation for the reusable Location engine.

### Stabilize
- isolated 6x5 Campaign board;
- six Overgrowth blockers;
- four starting T1 units;
- each successful merge clears exactly one nearest blocker;
- six clearing pulses complete the phase;
- completion commits the first 20% exactly once.

### Deliver Orders
- deterministic four-order queue, capped by lifetime discovery;
- reference max-T4 queue: `T2, T2, T3, T4`;
- each matching delivery consumes only the selected Campaign unit;
- each completed order commits one quarter of Deliver exactly once;
- completing the queue takes Sneaker Garden from 20% to 45%.

### Restore Landmark
- six restoration orders grouped into three two-order batches;
- only a complete two-order batch commits permanent restoration progress;
- the three batches correspond to Giant Sneaker Flower Bed levels 1, 2 and 3;
- reference max-T4 queue: `T2, T2, T3, T3, T4, T4`;
- Landmark Lv1/Lv2/Lv3 map to restore progress `1/3`, `2/3`, `1`;
- completing the Landmark takes Sneaker Garden from 45% to 90%.

Current bounded Landmark perk:

- base stronger Campaign Supply chance: **25%**;
- +5 percentage points per restored Landmark level;
- Landmark Lv3 chance: **40%**;
- perk only affects Campaign Supply and never reveals an undiscovered lifetime tier.

### Mastery
- reference max-T4 queue: `T3, T4, T4`;
- five Overgrowth cells remain blocked for the phase;
- Mastery merge pulses do **not** clear those blockers;
- the Landmark Supply perk remains active;
- completing all three orders commits the final 10% and makes Sneaker Garden 100% restored.

### Persistence / QA
- partial runs resume after leaving Campaign and after browser reload;
- Restore commits are atomic per two-order Landmark batch;
- completed temporary run state can be acknowledged without erasing permanent progress;
- Chromium gates cover Stabilize/Deliver resume, Restore Lv1 persistence and Mastery -> 100% completion;
- core tests cover main-board isolation, lifetime-tier caps, exact-once transactions, Landmark perk and corrupted save sanitization.

## Campaign ↔ main T1-T18 progression
Campaign reinforces the main merge loop instead of replacing it.

- lifetime discovery still comes from main merge progression;
- Campaign orders are capped to lifetime discovered tiers;
- higher lifetime tiers unlock harder/more valuable Campaign orders;
- Campaign rewards improve long-term Campaign/account power;
- Prestige will accelerate future main runs while preserving Campaign progress;
- Campaign progress must survive Prestige once the reset transaction is implemented.

## Collection Rewards
Collection becomes permanent progression rather than only a gallery.

Initial normal-collection milestones:

- 5 / 18 discovered;
- 10 / 18 discovered;
- 15 / 18 discovered;
- 18 / 18 discovered.

Each milestone is claimable once and persists across Prestige.

Reward categories may include permanent income, Brain Box discount, offline-cap bonus, Brain Cells and bounded Campaign bonuses/cosmetics.

## Prestige / Brain Reset
Prestige remains an approved core meta system.

### Unlock
First Prestige becomes available after reaching T18.

### Reset
Expected run-level reset:

- main board units;
- coins;
- paid Brain Box inflation counter;
- run-level Brain Lab levels;
- run-level passive-income remainder/pending state.

### Preserve
Permanent account data preserved:

- lifetime Collection discovery;
- claimed Collection Rewards;
- Campaign Worlds / Locations / Landmarks / Raids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades;
- localization/settings/platform-safe account data.

## Brain Cells
Brain Cells are permanent-meta-only currency and remain separate from ordinary coins.

Initial permanent upgrade categories may include permanent income, Brain Box cost reduction, early-run acceleration, offline-cap extension and Campaign efficiency.

Permanent upgrades must not reveal unseen lifetime tiers automatically.

## UX / navigation
Campaign is a primary long-term destination.

- mobile remains board-first;
- Missions / Collection / Brain Lab remain in the existing three-item dock;
- Campaign retains a prominent top-level map entry;
- map nodes 1-7 represent Locations and expose restoration percentage;
- node 8 represents the World Raid;
- map header exposes World Restored %, restored Landmark count and Raid gate;
- selecting a Location shows its four phases and Landmark;
- active playable phase exposes Start/Resume and opens the isolated Campaign board;
- all persistent values come from save/core snapshots, not presentation defaults.

## Delivery strategy from here
Do not author 56 bespoke mini-games.

1. **Done:** persistent Location domain model + save v6.
2. **Done:** isolated CampaignRunState + complete Sneaker Garden four-phase vertical slice.
3. Generalize Sneaker Garden into data-driven Location definitions.
4. Author the remaining six World 1 Locations mostly through configuration and bounded mechanic variants.
5. Implement the persistent three-phase World 1 Raid.
6. Connect Collection Rewards + Prestige to the same permanent meta schema.
7. Implement World 2 Traffic Lock and seven Locations + Raid.
8. Playtest duration/retention before expanding Worlds 3-8.

The first major Campaign milestone succeeds when World 1 takes multiple sessions, progress visibly persists, deliveries create real merge decisions, Landmarks visibly grow, and the World Raid feels like a substantial goal rather than a short stage.

## Validation requirements
Automated coverage must include:

- [x] v1-v5 -> v6 migration and corrupt meta sanitization;
- [x] Location phase percentage calculations;
- [x] World Progress and restored-landmark counting;
- [x] World Raid unlock gate;
- [x] delivery consuming Campaign units only;
- [x] exact-once Deliver/Landmark progress commit;
- [x] Campaign/main-board isolation;
- [x] active CampaignRun persistence/resume;
- [x] Restore Landmark browser persistence;
- [x] Mastery browser completion through 100% Location;
- [ ] Campaign progress surviving an actual Prestige transaction;
- [ ] persistent Raid phase/HP across reload/session boundaries;
- [ ] World Raid clear unlocking the next world through gameplay;
- [ ] dedicated RU CampaignRun interaction smoke;
- [x] general EN/RU locale parity;
- [x] desktop/mobile Campaign map and Location geometry;
- [x] touch/mouse/keyboard support in existing Campaign/main runtime;
- [x] no mandatory ad/energy/time gate.
