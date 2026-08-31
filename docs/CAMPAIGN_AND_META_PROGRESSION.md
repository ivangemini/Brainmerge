# Brainmerge — Campaign and Meta Progression

## Product north star
Brainmerge is not designed to end at T18 and it is no longer designed around dozens of short one-shot Campaign stages.

The long-term objective is to **restore the Brainverse**: each world contains persistent locations that take multiple sessions to stabilize, supply, rebuild and master, followed by a persistent multi-phase World Raid.

The layered product loop is:

`main T1-T18 run -> Collection / Prestige -> Campaign Locations -> Landmarks -> World Progress -> World Raid -> next world`

The main merge board remains the primary account-growth loop. Campaign gives that growth a long-term purpose.

## Campaign macro structure
Target complete campaign:

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
   - landmark progress is permanent;
   - landmark levels provide Campaign/world perks and visible restoration payoff;
   - exact perk numbers remain balance data.

4. **Mastery — 10%**
   - optional harder rules / efficient orders / stronger world modifier;
   - completes the final 10% of the Location;
   - supports long-tail replay without requiring a separate 3-star stage system.

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

This rule means the player must meaningfully engage with most of the world before reaching the boss, while full 100% restoration remains a stronger completionist goal.

The raid gate is data-driven and may be tuned by playtest, but it must remain based on earned progression rather than arbitrary real-time waits or mandatory ads.

## Landmark progression
Every Location has one signature landmark tied to that world's surreal art direction.

Examples for World 1:

- Giant Sneaker Flower Bed
- Toilet Birdbath
- Living Watermelon Grill
- Hose Creature Well
- Gnome Signal Tower
- Sneaker Mushroom Grove
- Backyard Brain Core

Examples for World 2:

- Sneaker Bus Depot
- Pigeon Fountain
- Vending Tower
- Long-Neck Traffic Hub
- Sunglasses Market
- Walking Appliance Block
- Brainrot City Core

Landmark upgrades should create both:

- **visible map payoff** — restored/upgraded state, stronger highlight, completion treatment;
- **system payoff** — Campaign modifiers such as better order rewards, easier world mechanics, boss/raid efficiency, Campaign income/box benefits or other bounded bonuses.

Do not make landmarks another generic currency shop. Their progress should primarily come from playing and delivering within their Location.

## Deliver Orders
Deliveries are a central Campaign decision mechanic.

Contract:

- an order requests one or more tier targets;
- the player produces those targets on the isolated Campaign board;
- delivery consumes the Campaign-board unit;
- delivery never consumes the player's main idle-board unit;
- completed orders commit permanent Location/Landmark progress exactly once;
- order difficulty rises through the world;
- orders must not request an undiscovered lifetime tier unless the product explicitly allows Campaign to become a discovery path.

First implementation keeps Campaign orders within the player's lifetime discovered tier so the main T1-T18 progression remains strategically relevant.

## World modifiers
Each world should change how the Campaign board plays instead of only changing the background.

Initial concepts:

- **World 1 — Overgrowth:** selected cells become overgrown/blocked and are cleared through nearby merges or Location objectives.
- **World 2 — Traffic Lock:** roadblock cells temporarily restrict usable board space / spawn lanes and rotate through the encounter.
- **World 3 — Conveyor Mutation:** selected rows/columns shift after configured actions.
- **World 4 — Recipe Chaos:** delivery chains create temporary recipe/order constraints.
- **World 5 — Wind Lanes:** movement/spawn pressure changes across lanes.
- **World 6 — Mutation Vats:** cells can gain temporary lab states that alter merge planning.
- **World 7 — Gravity:** pieces shift according to the active gravity rule.
- **World 8 — Core Corruption:** combines proven mechanics from previous worlds.

Only Worlds 1-2 are current production targets. Future modifiers remain provisional until implemented and playtested.

World modifiers must change decisions without making the merge rules unreadable or requiring a separate physics/action game.

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

No separate combat engine, weapons simulation, gore or real-time 3D battle is required.

## Campaign run isolation
Campaign must never silently rewrite the player's main idle board.

Architecture target:

- `GameState` owns the persistent main merge/economy run;
- `CampaignProgress` owns permanent world/location/landmark/raid progress;
- `CampaignRunState` owns a temporary Campaign board, stage-local counters, active orders and world modifier state;
- entering a Location or Raid starts/resumes CampaignRunState;
- abandon/restart cannot consume main-board units or coins;
- only explicit completed Campaign rewards may flow back to permanent account state;
- passive main-board income behavior while Campaign is open must be deterministic in core logic.

## Campaign persistent data
The planned v6 save must replace obsolete stage/star fields with persistent Location data.

Required categories:

- per-world unlock/clear state;
- per-Location Stabilize progress;
- per-Location delivery/order progress;
- per-Location landmark restoration/level;
- per-Location Mastery progress;
- derived or safely stored World Progress;
- current World Raid phase/progress;
- World Raid cleared state;
- exact-once Campaign reward claim markers where needed;
- optional active CampaignRunState snapshot if resume is supported.

Progress must sanitize/clamp invalid values deterministically.

## Campaign ↔ main T1-T18 progression
Campaign should reinforce the main merge loop instead of replacing it.

Initial relationship:

- lifetime discovery still comes from merge progression;
- Campaign orders are capped to lifetime discovered tiers;
- reaching higher lifetime tiers unlocks harder/more valuable Campaign orders;
- Campaign rewards improve long-term account/Campaign power;
- Prestige accelerates future main runs and later Campaign progression;
- Campaign progress survives Prestige.

This creates a reason to continue both systems rather than abandoning the main board once Campaign opens.

## Collection Rewards
Collection becomes permanent progression rather than only a gallery.

Initial normal-collection milestones remain:

- 5 / 18 discovered;
- 10 / 18 discovered;
- 15 / 18 discovered;
- 18 / 18 discovered.

Each milestone is claimable once and persists across Prestige.

Reward categories may include:

- permanent global income modifier;
- Brain Box discount;
- offline-cap bonus;
- Brain Cells;
- bounded Campaign bonuses/cosmetics.

Exact values remain simulation/playtest balance data.

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

Initial permanent upgrade categories may include:

- permanent income bonus;
- permanent Brain Box cost reduction;
- early-run acceleration;
- offline-cap extension;
- Campaign order/landmark/raid efficiency.

Permanent upgrades must not reveal unseen lifetime tiers automatically.

## UX / navigation
Campaign is a primary long-term destination.

- mobile remains board-first;
- Missions / Collection / Brain Lab remain in the existing three-item dock;
- Campaign retains a prominent top-level map entry;
- map nodes 1-7 represent Locations and expose Location restoration percentage;
- node 8 represents the World Raid;
- map header exposes World Restored %, restored landmark count and raid gate;
- selecting a Location shows its four-phase progression and landmark;
- selecting the raid shows its multi-phase persistent structure;
- all persistent values must eventually come from save/core state, not presentation defaults.

## Current implementation boundary
The current repository now contains the first domain model in `src/core/campaign.ts` and a Campaign shell redesigned around:

- 7 Locations + 1 Raid per world;
- Location progress semantics;
- World restoration summary;
- Landmark identity;
- four Location phases;
- three Raid phases;
- connected map route.

The visual shell currently displays default 0% progression until v6 state wiring lands. It must not fake completion or mutate the main GameState.

## Delivery strategy
Do not author 56 bespoke mini-games.

1. Lock the persistent Location domain model and validation.
2. Add v6 Campaign/Collection/Prestige persistence.
3. Implement isolated `CampaignRunState`.
4. Make **World 1 Location 1** playable end-to-end through Stabilize -> Deliver -> Restore -> Mastery.
5. Generalize order delivery and World 1 Overgrowth modifier.
6. Author all seven World 1 Locations mostly through data.
7. Implement the persistent three-phase World 1 Raid.
8. Connect Collection Rewards + Prestige to the same permanent meta schema.
9. Implement World 2 Traffic Lock and seven Locations + Raid.
10. Playtest duration/retention before expanding Worlds 3-8.

The first major Campaign milestone succeeds when World 1 takes multiple sessions, progress visibly persists, deliveries create real merge decisions, landmarks visibly grow, and the World Raid feels like a substantial goal rather than a short stage.

## Validation requirements
Automated coverage must include:

- v5 -> v6 migration and corrupted meta sanitization;
- Location phase percentage calculations;
- World Progress and restored-landmark counting;
- World Raid unlock gate;
- delivery consuming Campaign units only;
- exact-once order/Landmark progress commit;
- Campaign/main-board isolation;
- Campaign progress surviving Prestige;
- persistent Raid phase/HP across reload/session boundaries;
- World Raid clear unlocking the next world;
- EN/RU parity;
- desktop/mobile map + Location overview + Raid overview geometry;
- touch/mouse/keyboard interactions;
- no mandatory ad/energy/time gate.
