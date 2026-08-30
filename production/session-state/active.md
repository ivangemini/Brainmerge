# Active Session — Brainmerge

## Objective
Brainmerge has moved from release-candidate-only hardening into the next product phase: **retention/meta progression**.

The active product north star is:

**complete the Brainverse Campaign while building permanent Collection/Prestige power; T1-T18 remains the core merge-idle loop.**

Implementation priority:
1. Collection Rewards;
2. Prestige / Brain Reset + Brain Cells;
3. coherent save v6 migration;
4. Campaign framework/navigation;
5. World 1 + World 2 including bosses;
6. validate the complete fresh-run -> T18 -> Prestige -> persistent Campaign loop;
7. expand to Worlds 3-8.

Source of truth: `docs/CAMPAIGN_AND_META_PROGRESSION.md` + `docs/ROADMAP.md`.

## Current production gameplay truth
- browser-first TypeScript;
- 6×5 merge board;
- one sequential T1-T18 chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood -> Brr Brr Patapim -> Boneca Ambalabu -> Cappuccino Assassino -> Frigo Camelo -> Lirili Larila -> Chimpanzini Bananini -> Cocofanto Elefanto -> Bombombini Gusini -> Trippi Troppi -> La Vacca Saturno Saturnita;
- two identical non-terminal characters -> one next-tier character;
- T18 is terminal for the current core chain;
- first lifetime discovery remains merge-only;
- Brain Box upgrades rebuild only already-discovered content;
- passive production remains merge-positive;
- paid Brain Box price escalates; rewarded Box is optional/free and does not inflate paid price;
- Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage;
- capped offline reward, save v5, first-cycle missions, Collection, `Next move`, Rescue.

## Current art / UI truth
All T1-T18 production characters use one physical 6×3 `public/assets/characters/character-atlas.webp` on both board and Collection.

Current approved standalone UI icons:
- `icon-missions.webp`;
- `icon-collection.webp`;
- `icon-rewards.webp`;
- `icon-brain-lab.webp`.

They are integrated into the production dock/panel/reward surfaces. Do not regenerate them without an explicit replacement pass.

Phone composition is board-first. Main board + Brain Box stay in flow. Missions / Collection / Brain Lab open from a fixed three-button bottom dock as modal sheets. Campaign should receive a prominent map/goal entry outside this three-item dock by default rather than making the dock cramped again.

The latest UI icon/alignment production pass is commit `ef0cbd23318b9049c3a11da216561f7a8c6d2b7f`; CI run #257 completed successfully across tests, package, Chromium runtime, RC, motion, RU and Yandex adapter smoke before the documentation-only product-direction updates.

## New approved permanent systems
### Collection Rewards
- thresholds start at 5/18, 10/18, 15/18, 18/18;
- claim once;
- survive Prestige;
- exact values are balance data and must be simulated before lock;
- UI belongs inside Collection rather than a new mobile dock destination.

### Prestige / Brain Reset
- first unlock after reaching T18;
- resets run-level board/economy/Brain Lab state;
- preserves lifetime Collection, claimed Collection Rewards, Campaign progress, Prestige count, Brain Cells and permanent meta upgrades;
- Brain Cells are a permanent-meta-only currency and explicit exception to the old one-currency rule;
- first eligible Prestige must award at least one Brain Cell;
- exact reward/permanent-upgrade curves remain data-driven.

### Save v6
The next implementation should migrate Collection Rewards + Prestige + Campaign state in one coherent v6 schema. Do not land unrelated unversioned localStorage meta fields.

## New approved Campaign direction
Target complete campaign:
- 8 worlds;
- 8 stages each;
- 64 total stages;
- stage 8 of each world is a boss;
- up to 3 mastery stars per stage;
- Campaign progress survives Prestige;
- Worlds 1-2 are the framework proof milestone;
- later worlds may require prior boss completion + Prestige progress.

Campaign stages reuse the 6×5 merge rules through data-defined objectives rather than a separate gameplay engine.

Initial objective primitives:
- reach tier;
- merge count;
- earn stage coins;
- Brain Box count/limit;
- limited moves;
- target orders;
- crowded-board puzzle;
- no-Box puzzle;
- timed challenges later;
- boss objective sets.

Campaign stage state must be isolated from the persistent main idle board.

## Boss direction
Bosses are not a separate combat game.

- large playful boss render;
- code-owned progress/HP;
- ordinary merges contribute progress;
- requested target orders contribute larger progress;
- completion unlocks the next world/map segment;
- no gore/realistic combat UI;
- boss art cannot contain health bars/text or cover board hit targets.

## Immediate asset dependencies
Generate before the first production Campaign milestone:
1. Campaign / World Map icon — 512×512 transparent.
2. Prestige / Brain Reset icon — 512×512 transparent.
3. Brain Cell currency icon — 512×512 transparent.
4. Stage node family: Normal / Challenge / Elite / Boss / Locked — 512×512 transparent sources.
5. World 1 Backyard/Meme Yard environment — 1536×864, no text, center-safe.
6. World 2 Brainrot City environment — 1536×864, no text, center-safe.
7. World 1 boss — 1024×1024 transparent.
8. World 2 boss — 1024×1024 transparent.
9. Optional World 1/2 emblems — 512×512 transparent only if map UX proves needed.

Full art spec and later World 3-8 queue live in `docs/ASSET_MANIFEST.md`.

## Persistence / lifecycle truth
Current production runtime remains save v5 until meta implementation begins.

Existing guarantees stay mandatory:
- v1-v5 migration/sanitization;
- deterministic online/offline accrual;
- no duplicate resume/clock rollback credit;
- autosave + lifecycle flush;
- Yandex latest-snapshot/cloud/local fallback behavior;
- LoadingAPI/GamePlay lifecycle correctness;
- rewarded ad reward only after `onRewarded`;
- hidden-page ad close cannot incorrectly resume gameplay.

New v6 work must extend rather than bypass this persistence path.

## Validation required for the next slice
- Collection reward one-time/no-double-claim tests;
- Prestige eligibility + exact reset/preserve tests;
- Brain Cell award/spend invariants;
- v5 -> v6 migration/sanitization;
- Campaign/main-board isolation;
- stage objective/reward/star tests;
- boss/world unlock tests;
- Campaign progress surviving Prestige;
- EN/RU parity;
- desktop/compact/phone Campaign/Prestige screenshots;
- touch/mouse/keyboard + reduced-motion Campaign flow;
- Yandex package raster integrity for new assets.

## External acceptance gates
Still external:
1. approved Figma comparison;
2. real Yandex Games Portal/debug-panel run;
3. human pacing/retention sign-off.

Human retention sign-off should now explicitly include World 1-2 + first T18 + first Prestige, not only the old offline-return loop.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MANIFEST.md`
- `docs/ART_BIBLE.md`
- `docs/PLATFORM_AND_LOCALIZATION.md`
