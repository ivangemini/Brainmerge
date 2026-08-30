# Brainmerge — Gameplay and Progression Baseline

## Product structure
Brainmerge is a merge-idle game with three progression layers:

1. **Run progression** — build the main board from T1 toward T18, improve Brain Lab and generate coins.
2. **Permanent meta** — Collection Rewards + Prestige / Brain Cells.
3. **Long-term objective** — complete the Brainverse Campaign across multiple worlds and bosses.

T18 is terminal for the current core chain, but it is no longer the final reason to play. First T18 unlocks Prestige, while Campaign progress persists across resets.

Detailed meta/campaign rules: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Core merge-idle loop
1. board characters generate coins continuously;
2. spend coins on Brain Boxes or run-level Brain Lab upgrades;
3. use Brain Box drops as feed for the board;
4. merge two identical characters into exactly one next-tier identity;
5. the merged result produces more than both source pieces combined;
6. first-time merge discoveries unlock the next character for Collection and future Brain Box rebuilding;
7. claim Collection milestones as permanent meta rewards once implemented;
8. reach T18 to unlock Prestige;
9. Prestige converts a completed run into permanent Brain Cells while preserving Collection/Campaign progress;
10. Campaign stages reuse the merge rules for directed challenges and bosses.

Coins still create the immediate decision between more board feed and future efficiency. Brain Cells are intentionally separate and only fund permanent meta upgrades.

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

Different tiers/identities never merge with each other. Two identical non-terminal units merge into exactly one next-tier unit. T18 has no ordinary T19 successor.

## Merge-first discovery contract
Brain Box may only drop tiers already discovered through merging. It can accelerate rebuilding but it cannot reveal a new character first.

Example: if T10 is the highest lifetime discovered tier, Box upgrades may rebuild only discovered tiers up to T10 and never reveal T11. First T11 must come from merging two T10 units.

Prestige must not break first-account merge-first discovery. Permanent meta may accelerate future runs, but an unseen lifetime tier cannot appear from a normal Box.

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

Current run-level `Brain Income` multiplier:
`x1.00 -> x1.15 -> x1.32 -> x1.52 -> x1.75 -> x2.00`.

Future permanent Collection/Prestige modifiers must compose deterministically with this multiplier and be simulation-tested for runaway scaling.

## Brain Box economy
Paid Brain Box price:

`price = ceil(20 × 1.045 ^ paidBoxes)`

Only successful paid purchases increase `paidBoxes`. Rewarded Brain Boxes are free and do not increase the paid price.

## Brain Lab upgrades
All current Brain Lab upgrades use coins and are expected to reset on Prestige because they belong to the run economy.

### Base Drop Tier
Raises the minimum Box tier from T1 up to T4. A level is purchasable only after its target base tier has already been discovered.

Costs: `600 / 3000 / 15000`.

### Lucky Drop
Adds a +1 tier roll while still capped to lifetime discovered content.

Chance by level: `0% / 5% / 10% / 16% / 23% / 30%`.
Costs: `200 / 500 / 1200 / 3000 / 7500`.

### Brain Income
Global passive-production multiplier.

Costs: `250 / 700 / 1800 / 5000 / 14000`.

### Offline Storage
Extends capped offline-production duration.

Cap: `2h / 4h / 6h / 8h / 12h`.
Costs: `300 / 900 / 2500 / 7000`.

## Passive-income accounting
Online production is based on elapsed time with a fractional coin remainder. Before any action changes board production or multipliers, income is settled up to the current timestamp.

When hidden/closed, elapsed time becomes `pendingOfflineCoins`, capped by Offline Storage. Offline coins require explicit collection and cannot be collected twice.

Clock rollback never moves the accounting cursor backwards.

Current persistence uses ordinary debounced cloud saves plus lifecycle flushes and periodic visible-session snapshots.

Prestige implementation must explicitly zero/reset run-level pending/fractional economy fields so old-run production cannot leak into a new run.

## Merge/discovery rewards
Current active-play rewards:

- Merge reward: `4 × result tier` coins.
- First-discovery bonuses: T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80, T9 +120, T10 +180, T11 +270, T12 +400, T13 +600, T14 +900, T15 +1350, T16 +2000, T17 +3000, T18 +5000.
- Rescue refund: +5 coins on a true deadlock.

Discovery bonuses are paid only when lifetime `maxDiscoveredTier` increases.

## First-session structure
The opening board contains four T1 Toilet Buddies arranged as two ready pairs. Onboarding teaches:

1. merge a highlighted pair;
2. see higher production;
3. open the first Brain Box;
4. understand that paid Box prices rise and Brain Lab competes for the same coins.

The first session should expose an economic decision quickly rather than attempting to finish T18 in one uninterrupted sitting.

## Pacing guardrails
The existing deterministic baseline remains useful for the opening:

- T4 should be reachable without passive waiting;
- by T4, meaningful Brain Lab purchases should compete with another Box;
- T5 remains part of the early active loop;
- T8 remains a meaningful midgame/first-cycle checkpoint;
- T9-T18 are the long-tail chain and must be tuned together with Prestige/campaign progression rather than treated as an isolated exponential grind.

Once Prestige is implemented, balance must be reviewed by **cycle number**, not only by a fresh save. Later runs should feel materially faster without making Campaign stage objectives trivial.

## Return-session guidance
Current `Next move` priority:

1. collect pending offline production;
2. claim a ready first-cycle mission reward;
3. recover a true deadlock;
4. take a free merge;
5. surface affordable Brain Lab upgrades;
6. open a Brain Box when affordable;
7. otherwise show approximate wait to the next Box;
8. after current-chain completion, surface the next meaningful meta objective rather than implying another T19 exists.

As Campaign/Prestige lands, the terminal-state hint should evolve to point at eligible Prestige, Collection Rewards or Campaign progress.

`Next move` stays advisory and must never auto-spend.

## First-cycle mission journey
Current mission indices remain stable for save-v5 compatibility:

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

This is an onboarding/first-cycle journey, not the permanent Campaign system. Prestige must not ambiguously reset/reuse these historical mission indices. Any future Prestige-cycle tasks should use separate data/state.

## Collection Rewards — approved next system
Collection milestones are permanent account progression.

Initial checkpoints:
- 5/18;
- 10/18;
- 15/18;
- 18/18.

Each milestone is claimed once. Rewards can include permanent economy modifiers, Brain Cells or cosmetics. Exact numbers remain balance data until simulation/playtest approval.

Collection Rewards survive Prestige.

## Prestige / Brain Reset — approved next system
First Prestige unlocks after reaching T18.

Expected reset:
- main board;
- coins;
- paid Box inflation;
- Brain Lab run upgrades;
- run-level passive-income remainder/pending state.

Expected preserve:
- lifetime discovered Collection;
- claimed Collection Rewards;
- campaign progress/stars;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrades.

Brain Cells are a permanent-meta-only currency. They are not spent on ordinary Boxes or run-level Brain Lab.

## Brainverse Campaign — approved long-term objective
Target full structure: 8 worlds × 8 stages = 64 stages, with one boss at the end of each world.

Campaign reuses the merge board through data-driven stage objectives such as:
- reach tier;
- merge count;
- earn stage coins;
- Box-count limit;
- limited moves;
- requested target orders;
- crowded-board puzzles;
- no-Box puzzles;
- boss objective sets.

Campaign stage boards are isolated from the main idle board. Permanent stage completion/stars survive Prestige.

Worlds 1-2 are the first implementation milestone. Later worlds may require prior boss clears and Prestige progress.

## Boss gameplay
Bosses do not introduce a separate combat system.

A boss stage displays a large playful boss render and code-owned progress/HP while the player completes merge objectives. Ordinary merges contribute baseline progress; requested target orders can contribute larger progress hits. Completing the configured progress target wins the stage and unlocks the next world segment.

## Board pressure and deadlock
A deadlock exists only when the main board is full and no legal merge exists. Rescue prioritizes terminal T18 blockers before useful lower-tier progress.

Campaign puzzle stages may define their own deterministic fail/restart conditions, but they must not mutate main-board state.

## Save contract
Current runtime schema is **v5**.

The next coherent meta implementation is planned as **v6** with:
- Collection Reward claims;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- Campaign world/stage/star progress;
- optional active campaign-run state if resume is supported.

Do not land partially versioned meta fields. v1-v5 migration must preserve all currently valid player progress.

## Progression safety rules
- First-account discovery of a new tier remains merge-only.
- Rewarded ads are optional acceleration and never mandatory progression.
- Coins are the ordinary merge-economy currency; Brain Cells are permanent-meta-only.
- Merge remains production-positive.
- Collection/Campaign permanent progress survives Prestige.
- Prestige cannot double-award Brain Cells from one reset.
- Campaign rewards commit exactly once.
- Campaign stage state cannot consume main-board units by accident.
- No energy gate or arbitrary real-time wait is required for Campaign progression.
- Economy/meta tables remain centralized and deterministic.

## Validation baseline
Automated tests must continue covering all current core/save/platform invariants and add:

- v5 -> v6 migration/sanitization;
- Collection reward one-time claim;
- Prestige eligibility/reset/preserve/no-double-award;
- Brain Cell spend invariants;
- campaign/main-board isolation;
- stage objectives/rewards/stars;
- boss completion/world unlock;
- campaign progress surviving Prestige;
- EN/RU parity and responsive runtime QA for all new surfaces.
