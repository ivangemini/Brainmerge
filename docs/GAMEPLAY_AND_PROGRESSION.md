# Brainmerge — Gameplay and Progression Baseline

## Core merge rule
Brainmerge uses one sequential character chain. Brain Box creates only the bottom character. Two identical characters merge into exactly one next character.

Current chain:
1. Toilet Buddy
2. Camera Dude
3. Sigma Rock
4. Rizz Head
5. Shark Sneakers
6. Crocodile Bomber
7. Coffee Ballerina
8. Tung Wood

Different characters never merge. T8 is terminal until the approved chain is extended.

## First-session structure
The opening board contains four T1 Toilet Buddies arranged as two immediately mergeable pairs. The onboarding teaches one merge, then one Brain Box spawn. After that, normal play takes over.

The persistent short-term loop is:
1. inspect the board;
2. merge the highest useful duplicate pair;
3. open Brain Boxes when more T1 feed is needed;
4. reveal a new character tier;
5. claim the current mission reward;
6. continue toward the next visible chain target.

## Economy baseline
- Paid Brain Box: 12 coins.
- Rewarded Brain Box: free, still T1 only.
- Merge reward: `4 × result tier` coins.
- First-discovery bonuses: T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80.
- Rescue refund: +5 coins when resolving a true deadlock.

Discovery bonuses are paid only when `maxDiscoveredTier` increases. Re-creating an already discovered tier receives only the normal merge reward.

## First-cycle mission journey
The current mission track is cumulative and sequential. Progress earned before a mission becomes active still counts, avoiding artificial grind resets.

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

The track deliberately alternates action goals and discovery milestones. It should feel like a guided first progression cycle, not a separate quest mode.

## Board pressure and deadlock
When occupancy reaches roughly 72% and the player has no active selection, the UI highlights only the highest-tier available merge pair. This prevents noisy multi-pair hinting.

A deadlock exists only when the board is full and no legal merge exists. Rescue removes a terminal T8 blocker first. If a future ruleset permits a deadlock without terminal pieces, Rescue removes the highest-tier blocker rather than sacrificing lower-tier merge potential.

## Collection contract
`maxDiscoveredTier` is persistent. Once a tier is discovered, its Collection slot remains unlocked even after every copy of that character is consumed by later merges.

Collection states:
- unlocked past tiers;
- current highest discovery;
- next undiscovered target;
- locked future tiers.

## Progression safety rules
- Do not introduce random higher-tier Brain Box drops into the base loop without an explicit economy redesign.
- Do not make cross-character merges legal.
- Do not reset cumulative mission counters between goals.
- Do not add a new currency merely to extend the current first cycle.
- Do not delete useful low-tier pieces during deadlock recovery while terminal blockers are present.
- Keep balance constants centralized and covered by deterministic smoke tests.

## Validation baseline
Automated tests must prove that a deterministic paid-only run can:
- progress from the starter board to T8;
- complete all eight first-cycle goals;
- avoid negative coins / mandatory rewarded ads;
- preserve save migration and Collection discovery;
- preserve deterministic deadlock/hint behavior.
