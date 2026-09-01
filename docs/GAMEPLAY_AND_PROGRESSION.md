# Brainmerge Gameplay and Progression Contract

## Status note
This document records gameplay contracts that remain valid across repository recovery. UI placement in published `main` is **not** authoritative: the owner-approved newer product moved Collection and Brain Lab to top-level UI, while published `main` still shows them in a right rail.

See `REPOSITORY_AUDIT_2026-09-01.md` before changing layout or tests.

## Core merge loop
- main board: 6 columns × 5 rows;
- one canonical sequential T1→T18 chain;
- only two identical non-terminal identities merge;
- T18 is terminal for ordinary merging;
- first lifetime discovery comes from merging, not from Brain Box luck;
- moving to an empty cell is free;
- successful main-board merges grant XP and coin reward;
- first discovery grants an additional one-time discovery bonus.

Canonical chain:
1. Toilet Buddy
2. Camera Dude
3. Sigma Rock
4. Rizz Head
5. Shark Sneakers
6. Crocodile Bomber
7. Coffee Ballerina
8. Tung Wood
9. Brr Brr Patapim
10. Boneca Ambalabu
11. Cappuccino Assassino
12. Frigo Camelo
13. Lirili Larila
14. Chimpanzini Bananini
15. Cocofanto Elefanto
16. Bombombini Gusini
17. Trippi Troppi
18. La Vacca Saturno Saturnita

## Production/economy
Every unit produces passive coins. A merge must remain production-positive relative to the consumed pair.

Main-board passive income is deterministic from board contents and Brain Lab income multiplier.

Offline production:
- uses the same production model;
- is capped by the Offline Storage upgrade;
- accumulates into explicit pending offline coins;
- requires an explicit collect action;
- cannot be double-claimed.

## Brain Box
Paid Brain Box:
- consumes current coin price;
- price escalates with paid purchases;
- base/lucky drop upgrades may rebuild already-discovered tiers;
- a Box never reveals a tier above lifetime `maxDiscoveredTier`.

Rewarded Brain Box:
- requires platform rewarded-ad capability;
- costs no coins;
- does not increase paid-box inflation;
- grants only after the platform rewarded callback.

Rewarded Brain Box is **not** the same feature as the newer timed rewarded-boost system described by the owner.

## Rewarded timed boosts — recovery contract
A separate rewarded-boost system/card is expected in the newer product state but is absent from published `main`.

Before reimplementation, recover the local version if it exists.

Minimum timed-income contract when implemented/recovered:
- successful rewarded ad activates x2 passive income and click/clicker income for 15 minutes where click income exists in the recovered game;
- canonical save stores absolute expiry time;
- reload preserves remaining duration;
- UI shows remaining time and active/available/loading/unavailable state;
- no reward on failed/closed-without-reward ad;
- ad callback watchdog prevents permanent busy state;
- ad boost remains optional for progression.

Other previously discussed rewarded options such as higher-tier Box, mutation/next-spawn benefit and free upgrade should be specified as separate transactions with explicit cooldown/limits before implementation.

## Brain Lab
Published baseline contains four bounded run upgrades:
- Base Drop Tier;
- Lucky Drop;
- Brain Income;
- Offline Storage.

Gameplay state remains code-owned regardless of UI placement.

The owner-approved current product treats Brain Lab as a top-level system rather than a permanent right-side card. Tests must follow the recovered current UI.

## Missions
Missions are cumulative first-cycle goals based on merge count, spawn count or lifetime discovery tier.

Claim contract:
- only current active mission can be claimed;
- it becomes claimable once its cumulative signal reaches target;
- claim adds exactly its reward;
- claim advances mission index exactly once;
- already-consumed reward cannot be duplicated.

Published core implements this correctly. The missing protection is a browser test that actually clicks Claim Reward and verifies state/UI transition in the recovered current composition.

## Collection
Collection discovery is lifetime account/run progression based on `maxDiscoveredTier`, not current board occupancy.

Consuming low-tier units does not relock discovered entries.

Published save v6 also has Collection Reward claim-id storage, but the real Collection Reward claim transaction/UI is still pending unless recovered local code proves otherwise.

Collection is a top-level system in the owner-approved newer UI and must not be forced back into a permanent right rail by historical tests.

## Deadlock / Rescue
If the board is full and no valid merge exists, Rescue removes a blocking highest/terminal unit according to deterministic rules and grants the defined refund. Spending recommendations must not outrank a true deadlock.

## Onboarding / next action
Fresh state begins with an immediately available merge.

Onboarding progresses through:
1. merge;
2. Brain Box spawn;
3. normal loop.

Next-action guidance prioritizes useful free/claimable actions before spending where appropriate:
- offline collection;
- claimable mission;
- deadlock rescue;
- available merge;
- affordable upgrade;
- paid Box/wait depending state.

## Save/meta baseline
Published canonical save is v6 and includes:
- main run state;
- mission cursor;
- Brain Lab;
- offline accounting;
- Collection Reward claim ids;
- Prestige count;
- Brain Cells;
- permanent Prestige upgrade levels;
- Campaign permanent progress;
- resumable Campaign run.

Storage fields do not imply complete product transactions.

## Prestige status
Published baseline has storage/foundation but not the full product transaction:
- eligibility UI/logic;
- confirmation;
- reset/reward transaction;
- Brain Cell spend tree;
- full proof of Campaign preservation through actual Prestige.

Do not surface fake functional controls solely because art/storage fields exist.

## Campaign relation to main progression
Campaign uses isolated board state and permanent Location/world progress.

Campaign actions must not silently consume or mutate:
- main board cells;
- main-board coins;
- main XP;
- main merge count;
- paid Brain Box inflation.

Campaign Supply may use lifetime discovery as a cap/reference without unlocking unseen main-chain tiers.

See `CAMPAIGN_AND_META_PROGRESSION.md`.

## Current known gameplay/feedback defect
The published pointer FX layer contains a historical `sourceTier >= 8` max-tier rejection assumption. T8 is no longer terminal; T18 is.

Valid T8→T9 through T17→T18 pointer merges can therefore receive wrong reject feedback even though core merge succeeds.

Fix this using catalog/next-family truth and add browser regression coverage.

## Product correctness rule
A green unit test is insufficient when the failure is interaction/layout-sensitive.

For claims, rewarded boosts, top-level navigation and Campaign actions, browser tests must perform the real user action and assert the resulting canonical state plus visible next UI.