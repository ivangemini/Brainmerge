# Brainmerge — Gameplay and Progression Baseline

## Product structure
Brainmerge has three progression layers:

1. **Run progression** — build the main board from T1 toward T18, improve Brain Lab and generate coins.
2. **Permanent meta** — Collection Rewards + Prestige / Brain Cells.
3. **Long-term objective** — restore the Brainverse through persistent Campaign Locations, Landmarks and World Raids.

T18 is terminal for the current core chain, but it is not the final reason to play. First T18 unlocks Prestige, while Campaign progress persists across resets.

The old `8 short Campaign stages per world / 64 one-shot stages / 3 stars` model is obsolete.

Detailed Campaign/meta rules: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Core merge-idle loop
1. board characters generate coins continuously;
2. spend coins on Brain Boxes or run-level Brain Lab upgrades;
3. use Box drops as board feed;
4. merge two identical characters into exactly one next-tier identity;
5. merged result produces more than both source pieces combined;
6. first-time merge discoveries unlock the next character for Collection/future rebuilding;
7. claim Collection milestones once implemented;
8. reach T18 to unlock Prestige;
9. Prestige converts a completed run into permanent Brain Cells while preserving Collection/Campaign progress;
10. use lifetime discovery and permanent power to push deeper into Campaign Locations and World Raids.

## Canonical T1-T18 character chain
1. T1 Toilet Buddy
2. T2 Camera Dude
3. T3 Sigma Rock
4. T4 Rizz Head
5. T5 Shark Sneakers
6. T6 Crocodile Bomber
7. T7 Coffee Ballerina
8. T8 Tung Wood
9. T9 Brr Brr Patapim
10. T10 Boneca Ambalabu
11. T11 Cappuccino Assassino
12. T12 Frigo Camelo
13. T13 Lirili Larila
14. T14 Chimpanzini Bananini
15. T15 Cocofanto Elefanto
16. T16 Bombombini Gusini
17. T17 Trippi Troppi
18. T18 La Vacca Saturno Saturnita

Different identities do not merge. Two identical non-terminal units merge into exactly one next-tier unit. T18 has no ordinary T19 successor.

## Merge-first discovery
Brain Box may only drop tiers already discovered through merging. It accelerates rebuilding but cannot reveal a new lifetime character first.

Campaign initially follows the same account rule: Campaign orders cannot require an unseen lifetime tier. This keeps the main T1-T18 progression relevant instead of letting Campaign replace it.

## Passive production
Base production per board unit:

| Tier | Coins/min |
| --- | ---: |
| T1 | 3 |
| T2 | 7 |
| T3 | 16 |
| T4 | 36 |
| T5 | 82 |
| T6 | 185 |
| T7 | 420 |
| T8 | 950 |
| T9 | 2,150 |
| T10 | 4,850 |
| T11 | 10,950 |
| T12 | 24,700 |
| T13 | 55,700 |
| T14 | 125,500 |
| T15 | 283,000 |
| T16 | 638,000 |
| T17 | 1,438,000 |
| T18 | 3,242,000 |

Every next tier produces more than twice the previous tier, so a normal merge is production-positive.

Current run-level Brain Income multiplier:
`x1.00 -> x1.15 -> x1.32 -> x1.52 -> x1.75 -> x2.00`.

## Brain Box economy
Paid Brain Box price:

`price = ceil(20 × 1.045 ^ paidBoxes)`

Only successful paid purchases increase `paidBoxes`. Rewarded Brain Boxes are free and do not increase paid price.

## Brain Lab
Current run-level upgrades use coins and are expected to reset on Prestige.

### Base Drop Tier
Raises minimum Box tier from T1 up to T4, discovery-gated.

Costs: `600 / 3000 / 15000`.

### Lucky Drop
Adds a +1 tier roll while capped to lifetime discovered content.

Chance: `0% / 5% / 10% / 16% / 23% / 30%`.
Costs: `200 / 500 / 1200 / 3000 / 7500`.

### Brain Income
Global passive-production multiplier.

Costs: `250 / 700 / 1800 / 5000 / 14000`.

### Offline Storage
Offline cap: `2h / 4h / 6h / 8h / 12h`.
Costs: `300 / 900 / 2500 / 7000`.

## Passive-income accounting
Online production is elapsed-time based with fractional remainder. Offline income is capped, explicit to collect and cannot be double-claimed. Clock rollback never moves accounting backwards.

Prestige must reset/normalize old-run passive fields so old elapsed time cannot be credited into a new run.

Campaign opening must not duplicate or erase main-board passive accounting.

## Merge/discovery rewards
- Merge reward: `4 × result tier` coins.
- First-discovery bonuses: T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80, T9 +120, T10 +180, T11 +270, T12 +400, T13 +600, T14 +900, T15 +1350, T16 +2000, T17 +3000, T18 +5000.
- Rescue refund: +5 coins on a true deadlock.

Discovery bonuses pay only when lifetime `maxDiscoveredTier` increases.

## First-session structure
Opening board contains four T1 Toilet Buddies as two ready pairs.

Onboarding teaches:
1. merge;
2. higher production;
3. first Brain Box;
4. Box-vs-Brain-Lab economic decision.

The first session should not attempt to finish T18 or the Campaign.

## Pacing guardrails
- T4 reachable without passive waiting;
- meaningful Brain Lab tradeoff appears by T4;
- T5 remains early active loop;
- T8 remains meaningful first-cycle checkpoint;
- T9-T18 are long-tail run progression;
- later Prestige cycles materially accelerate rebuilding without making Campaign orders trivial.

## First-cycle mission journey
Current save-v5 mission indices remain stable:

| Goal | Requirement | Reward |
| --- | --- | ---: |
| 1 | 6 total merges | 80 coins |
| 2 | Discover T4 | 100 coins |
| 3 | 12 total Brain Box spawns | 90 coins |
| 4 | Discover T5 | 130 coins |
| 5 | 30 total merges | 150 coins |
| 6 | Discover T6 | 190 coins |
| 7 | Discover T7 | 260 coins |
| 8 | Discover T8 | 400 coins |

This remains onboarding, not permanent Campaign content.

## Collection Rewards
Approved permanent account milestones:
- 5/18;
- 10/18;
- 15/18;
- 18/18.

Each reward is claimed once and survives Prestige. Exact reward values remain balance data.

## Prestige / Brain Reset
First Prestige unlocks after reaching T18.

Expected reset:
- main board;
- coins;
- paid Box inflation;
- Brain Lab run upgrades;
- run-level passive remainder/pending state.

Expected preserve:
- lifetime Collection discovery;
- claimed Collection Rewards;
- Campaign Worlds/Locations/Landmarks/Raids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades.

Brain Cells are permanent-meta-only.

# Brainverse Campaign

## Macro loop
Each world contains **7 persistent Locations + 1 World Raid**.

The Campaign loop is:

`enter Location -> stabilize -> create/deliver requested Brainrots -> restore Landmark -> mastery -> raise World Restored % -> unlock World Raid -> defeat persistent raid -> next world`

The first two production worlds are:
- World 1 — Backyard Brainrot Zone;
- World 2 — Surreal Brainrot City.

Target complete Campaign is eight worlds.

## Persistent Location phases
Every Location uses the same four-phase structure:

### 1. Stabilize — 20%
Deal with the world's board modifier and establish control.

### 2. Deliver Orders — 25%
Create requested Brainrots on the isolated Campaign board and deliver them.

A delivered unit disappears from the Campaign board. This intentionally creates a decision:

`merge this unit upward` **vs** `deliver it now for permanent Location progress`.

### 3. Restore Landmark — 45%
Order batches restore/upgrade the Location's signature landmark. Landmark progress persists across sessions and Prestige.

### 4. Mastery — 10%
Optional harder rules complete the final 10% of the Location.

A fully restored Location without Mastery reaches 90%; Mastery reaches 100%.

## World Progress
World Restored % is the average restoration percentage of the seven Locations.

Initial World Raid gate:
- >=80% World Restored;
- >=5 restored landmarks.

This makes the Raid a major world goal while 100% remains completionist progression.

## World modifiers
Campaign worlds must change board decisions.

First production modifiers:
- **World 1 — Overgrowth:** Campaign cells can become overgrown/blocked and must be cleared through merge/location play.
- **World 2 — Traffic Lock:** roadblock cells temporarily reduce usable board/spawn space.

Future world modifiers are data-driven concepts and must stay readable on touch screens.

## Deliver Orders safety
- order targets are data-driven;
- deliveries consume Campaign-board units only;
- main-board units/coins are never silently consumed;
- order completion commits persistent progress exactly once;
- orders initially stay <= lifetime max discovered tier;
- leaving/restarting Campaign cannot mutate the main board.

## Landmarks
Every Location has one signature surreal landmark.

Landmark progression provides visible restoration payoff and bounded Campaign/world perks. Exact perk values require simulation/playtest.

World 1 examples:
- Giant Sneaker Flower Bed;
- Toilet Birdbath;
- Living Watermelon Grill;
- Hose Creature Well;
- Gnome Signal Tower;
- Sneaker Mushroom Grove;
- Backyard Brain Core.

## World Raids
World Raid is persistent and multi-session, not a short stage.

Initial structure:
- 3 phases;
- progress/HP persists between sessions;
- merge/order objectives drive progress;
- later phases intensify the world modifier;
- final phase requires high-value deliveries;
- clear unlocks the next world exactly once.

No separate combat engine is introduced.

## Campaign/main-board isolation
Campaign uses an isolated `CampaignRunState` and its own temporary 6x5 board.

Campaign can influence permanent account/meta only through explicit deterministic reward/progress commits. It cannot consume main-board pieces accidentally.

## Current implementation state
Implemented:
- `src/core/campaign.ts` domain foundation;
- seven stable Location definitions for Worlds 1-2;
- Location phase weighting;
- World Progress calculation;
- restored Landmark counting;
- Raid gate calculation;
- Campaign map with World Progress summary;
- seven Location nodes + Raid node;
- four-phase Location overview;
- three-phase Raid overview;
- EN/RU shell parity;
- automated core/shell tests.

Not yet implemented:
- save v6 Campaign persistence;
- real CampaignRunState;
- playable Stabilize/Deliver/Restore/Mastery flow;
- actual Landmark perks;
- persistent Raid HP.

The next playable vertical slice is **World 1 Location 1 — Sneaker Garden**.

## Save contract
Current production schema is **v5**.

Next coherent **v6** must include:
- Collection Reward claims;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades;
- world unlock/clear state;
- Location phase progress;
- Landmark restoration/level;
- Raid phase/progress/clear state;
- optional active CampaignRunState snapshot if resume is supported.

Do not add ad-hoc unversioned Campaign localStorage.

## Progression safety rules
- First-account new-tier discovery remains merge-first.
- Rewarded ads remain optional acceleration.
- Coins remain ordinary run currency; Brain Cells remain permanent-meta-only.
- Merge remains production-positive.
- Campaign/Collection permanent progress survives Prestige.
- Delivery consumes Campaign units only.
- Campaign rewards/progress commit exactly once.
- No arbitrary real-time or energy gate is required.
- Economy/meta tables remain centralized and deterministic.

## Validation baseline
Automated coverage must include:
- v5 -> v6 migration/sanitization;
- Collection one-time claim;
- Prestige reset/preserve/no-double-award;
- Campaign/main-board isolation;
- Location phase calculation;
- World Progress / Landmark count / Raid gate;
- delivery consumption and exact-once progress;
- persistent Raid state/world unlock;
- Campaign progress surviving Prestige;
- EN/RU parity;
- responsive Location/Raid runtime QA.
