# Brainmerge — Gameplay and Progression Baseline

## Core loop
Brainmerge is a merge-idle game, not a pure merge ladder. The current canonical loop is:

1. board characters generate coins continuously;
2. spend coins on Brain Boxes or permanent Brain Lab upgrades;
3. use Brain Box drops as feed for the board;
4. merge two identical characters into exactly one next-tier identity;
5. the merged result produces more than both source pieces combined;
6. first-time merge discoveries unlock the next character for Collection and future Brain Box rebuilding;
7. return later to collect capped offline production and continue the same economy loop.

The key player decision is no longer only "what can I merge?". Coins can be spent either on more immediate board feed or on upgrades that improve future efficiency.

## Canonical character chain
1. T1 Toilet Buddy
2. T2 Camera Dude
3. T3 Sigma Rock
4. T4 Rizz Head
5. T5 Shark Sneakers
6. T6 Crocodile Bomber
7. T7 Coffee Ballerina
8. T8 Tung Wood

Different characters never merge. T8 is terminal until the approved chain is extended.

## Merge-first discovery contract
Brain Box may only drop tiers already discovered through merging. It can accelerate rebuilding but it cannot reveal a new character first.

Example: if T4 is the highest discovered tier, Box upgrades may produce T1-T4 depending on the current base tier and Lucky Drop roll, but never T5. The first T5 must still be created by merging two T4 units.

This preserves the reveal value of the merge chain while allowing the economy to become faster over time.

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

Every next tier produces more than twice the previous tier. Therefore merging two equal pieces is always production-positive instead of temporarily lowering income.

The `Brain Income` upgrade multiplies the whole board:
`x1.00 -> x1.15 -> x1.32 -> x1.52 -> x1.75 -> x2.00`.

## Brain Box economy
Paid Brain Box price is no longer flat.

`price = ceil(20 × 1.045 ^ paidBoxes)`

Only successful paid Box purchases increase `paidBoxes`. Rewarded Brain Boxes are free and do not increase the paid price.

This makes repeated feed progressively more expensive and gives passive production/upgrades an actual economic role.

## Brain Lab upgrades
All upgrades use the same primary coin currency.

### Base Drop Tier
Levels raise the minimum Brain Box tier from T1 up to T4. A level is purchasable only after its target base tier has already been discovered.

Costs: `600 / 3000 / 15000`.

### Lucky Drop
Adds a +1 tier roll to every Brain Box, still capped to the highest discovered tier.

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
Online production is accrued from elapsed time with a fractional coin remainder so frequent ticks do not lose value.

When the app is hidden/closed, the next resume/load converts elapsed time into `pendingOfflineCoins`, capped by Offline Storage. Offline coins require an explicit collect action and cannot be collected twice.

The accounting cursor never moves backwards during a runtime clock rollback, preventing duplicate elapsed-time credit.

## Merge/discovery rewards
Passive production is the long-running economy, but active play still has immediate rewards:

- Merge reward: `4 × result tier` coins.
- First-discovery bonuses: T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80.
- Rescue refund: +5 coins on a true deadlock.

Discovery bonuses are paid only when `maxDiscoveredTier` increases.

## First-session structure
The opening board contains four T1 Toilet Buddies arranged as two ready pairs. The onboarding teaches:

1. merge a highlighted pair;
2. see that the result has higher production than the two sources;
3. open the first Brain Box;
4. understand that paid Box prices rise and coins can later be spent in Brain Lab.

The target is to reach an early meaningful economic choice quickly, not to race to T8 in one uninterrupted session.

## First-cycle mission journey
The mission track remains cumulative and sequential:

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

Mission rewards accelerate decisions but are no longer the sole mechanism keeping paid spawns affordable; passive production supplies the persistent economy.

## Board pressure and deadlock
At high occupancy the UI highlights only the highest-tier available merge pair.

A deadlock exists only when the board is full and no legal merge exists. Rescue removes a terminal T8 blocker first. If a future ruleset permits a deadlock without terminal pieces, Rescue removes the highest-tier blocker rather than sacrificing lower-tier merge potential.

## Save contract
Current schema: v5.

Persistent economy state includes:
- `paidBoxes`;
- upgrade levels;
- fractional income remainder;
- last accounted timestamp;
- pending offline coins.

Legacy v1-v4 saves migrate to v5 with safe economy defaults. Legacy users start at zero paid-box inflation because older saves cannot reliably distinguish paid and rewarded Box history.

## Progression safety rules
- First discovery of a new tier remains merge-only.
- Rewarded ads are optional acceleration and cannot be required for core progression.
- Keep one primary currency until another currency is shown to create a useful decision.
- Do not make merge production-negative.
- Do not reset cumulative mission counters between goals.
- Do not delete useful low-tier pieces during deadlock recovery while terminal blockers are present.
- Keep economy tables centralized and deterministic.
- Prestige/rebirth is deferred until this economy loop is validated in real sessions.

## Validation baseline
Automated tests must cover:
- production-positive merge ladder;
- escalating paid Box price and non-inflating rewarded Box;
- discovery-capped Box upgrades;
- upgrade costs/locks/max levels;
- online fractional income;
- capped explicit offline collection and no double claim;
- clock rollback behavior;
- save v1-v5 migration/sanitization;
- deterministic progression from fresh save to T8 with simulated production time and no mandatory ads;
- mission, Collection, deadlock and hint regressions.
