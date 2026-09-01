# Brainmerge — Gameplay and Progression Baseline

## Product structure
Brainmerge currently has three progression layers:

1. **Run progression** — build the main board from T1 toward T18, improve Brain Lab and generate coins.
2. **Permanent meta foundation** — Collection Reward claims, Prestige count, Brain Cells and permanent upgrade slots live in save v6; the actual reward/reset/spend transactions are still pending.
3. **Long-term objective** — restore the Brainverse through persistent Campaign Locations, Landmarks and World Raids.

T18 is terminal for the current core chain. The intended first Prestige unlock is T18, while Campaign/Collection permanent progress is preserved by contract.

The old `8 short Campaign stages per world / 64 one-shot stages / 3 stars` model is obsolete.

Detailed Campaign/meta rules: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Core merge-idle loop
1. board characters generate coins continuously;
2. spend coins on Brain Boxes or run-level Brain Lab upgrades;
3. use Box drops as board feed;
4. merge two identical characters into exactly one next-tier identity;
5. merged result produces more than both source pieces combined;
6. first-time merge discoveries raise lifetime discovery;
7. continue through the T1→T18 run;
8. use lifetime discovery to unlock harder Campaign order targets;
9. once Prestige is implemented, T18 completion will convert a run into permanent meta growth while preserving Collection/Campaign state.

## Canonical T1-T18 chain
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

Campaign follows the same account boundary: current Campaign order/supply logic is capped by lifetime discovery, so Campaign cannot bypass the T1→T18 discovery chain.

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

Current Brain Income multiplier:
`x1.00 → x1.15 → x1.32 → x1.52 → x1.75 → x2.00`.

## Brain Box economy
Paid Brain Box price:

`price = ceil(20 × 1.045 ^ paidBoxes)`

Only successful paid purchases increase `paidBoxes`. Rewarded Brain Boxes are free and do not increase paid price.

## Brain Lab
Current run-level upgrades use coins and are intended to reset on Prestige.

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

Campaign opening must not duplicate or erase main-board elapsed-time accounting. Future Prestige must normalize old-run passive fields so a reset cannot inherit unaccounted elapsed time from the previous run.

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

The first session is not expected to finish T18 or the Campaign.

## First-cycle missions
Mission indices remain stable in canonical save v6:

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
Approved permanent milestones:
- 5/18;
- 10/18;
- 15/18;
- 18/18.

Save v6 already stores claim ids. Reward definitions, claim transaction/UI and no-double-claim behavior still need implementation.

## Prestige / Brain Reset
Target first unlock: reaching T18.

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

Save v6 already contains `prestigeCount`, `brainCells` and permanent upgrade-level fields. The actual eligibility/reset/reward/spend transactions are still pending.

# Brainverse Campaign

## Macro loop
Each target world contains **7 persistent Locations + 1 persistent World Raid**.

`enter Location → Stabilize → Deliver Orders → Restore Landmark → Mastery → raise World Restored % → unlock World Raid → clear persistent Raid → next world`

World 1 and World 2 definitions exist. The target complete Campaign is eight worlds.

## Location phase weights
- Stabilize: 20%
- Deliver Orders: +25% (45% cumulative)
- Restore Landmark: +45% (90% cumulative)
- Mastery: +10% (100% cumulative)

World Restored % is derived from the seven Location restoration values.

Initial World Raid gate:
- at least 80% World Restored;
- at least 5 restored Landmarks.

## Campaign/main-board isolation
Campaign uses a separate 6×5 `CampaignRunState` stored inside save v6.

Campaign actions cannot silently:
- consume main-board pieces;
- spend ordinary main-board coins;
- increase paid Brain Box inflation;
- mutate main-run merge counters;
- reveal an undiscovered lifetime tier.

Permanent Campaign progress flows through explicit deterministic commits only.

## Implemented Location 1 — Sneaker Garden
Sneaker Garden is fully playable through all four phases and is the reference implementation for future data-driven Locations.

### Stabilize
- six Overgrowth blockers;
- four starting T1 Campaign units;
- each successful merge clears exactly one nearest blocker;
- six clearing pulses commit Stabilize exactly once.

### Deliver Orders
- deterministic 4-order queue capped by lifetime discovery;
- max-T4 reference: `T2, T2, T3, T4`;
- matching delivery consumes only the selected Campaign unit;
- each order commits one quarter of Deliver progress exactly once.

### Restore Landmark
- six orders in three atomic two-order batches;
- max-T4 reference: `T2, T2, T3, T3, T4, T4`;
- batches restore Giant Sneaker Flower Bed Lv1→Lv3;
- incomplete batches do not commit partial permanent Landmark levels;
- stronger Campaign Supply chance starts at 25% and gains +5 percentage points per Landmark level, reaching 40% at Lv3.

### Mastery
- max-T4 reference: `T3, T4, T4`;
- five Overgrowth cells remain blocked throughout the phase;
- Mastery merge pulses do not clear those blockers;
- Landmark Supply perk remains active;
- completion commits the final 10% and reaches 100% Sneaker Garden restoration.

### Persistence
- active Stabilize/Deliver/Restore/Mastery run state resumes after leaving/reload;
- permanent Location/Landmark progress is separate from the temporary board snapshot;
- completed temporary run state can be acknowledged without erasing permanent progress.

## World modifiers
Current implemented reference:
- **World 1 — Overgrowth** in Sneaker Garden.

Next planned production modifier:
- **World 2 — Traffic Lock**.

Future modifiers must remain readable, deterministic and data-driven; they must not fork the main merge identity rules.

## World Raids
Permanent Raid state/storage and gate/unlock derivation exist as foundation. Full playable Raid phases are not implemented yet.

Target structure:
- three phases;
- progress persists between sessions;
- merge/order objectives drive progress;
- later phases intensify the world modifier;
- final phase uses high-value deliveries;
- clear unlocks the next world exactly once.

## Progression safety rules
- first-account new-tier discovery remains merge-first;
- rewarded ads remain optional acceleration;
- coins remain ordinary run currency;
- Brain Cells remain permanent-meta-only;
- merge remains production-positive;
- Campaign and Collection permanent progress survive Prestige by contract;
- delivery consumes Campaign units only;
- progress commits are exact-once/idempotent where required;
- no mandatory ad, energy gate or arbitrary real-time wait is required.

## Immediate next gameplay milestone
Generalize the proven Sneaker Garden phase engine into data-driven World 1 Location definitions, then author the remaining six World 1 Locations and the first persistent three-phase World 1 Raid.
