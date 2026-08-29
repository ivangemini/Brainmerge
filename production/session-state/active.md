# Active Session — Brainmerge

## Current objective
Convert the working vertical slice from a strong prototype into a production-looking first-session experience while preserving the approved Figma direction, localization contract and multi-platform architecture.

## Completed
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge-board core;
- paid spawn, move, drag/drop and tap-to-select merge flow;
- core progression redesigned into one sequential eight-character merge chain;
- canonical chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- standard and rewarded Brain Box now feed only Tier 1 Toilet Buddy; higher characters are earned only through merging;
- successful merge now replaces two identical characters with the next character identity instead of incrementing a tier inside the same family;
- first session starts with two ready Toilet Buddy pairs for immediate readable discovery;
- persistent `maxDiscoveredTier` Collection progression added;
- save schema upgraded to version 3 with migration from legacy v1/v2 family/tier saves onto canonical chain tiers;
- coins, XP/level, collection preview and mission progress;
- EN/RU localization parity maintained and copy rewritten for sequential progression;
- two-step first-session onboarding that highlights a merge pair then Brain Box;
- claimable first-mission reward;
- true-deadlock detection and rescue that frees a cell only when no merge exists;
- platform factory + local adapter + Yandex Games adapter;
- Yandex locale, safe storage, debounced cloud save, rewarded/fullscreen ads and LoadingAPI/GameplayAPI integration;
- procedural merge/spawn/reward/rescue audio + particle feedback and mute control;
- portal packager + Yandex CI artifact with package-size gate;
- Figma first-session and deadlock/rescue production targets;
- per-character runtime presentation normalization for scale, baseline and contact shadow;
- richer material pass for board frame/tray/cells, HUD, mission/collection cards, Brain Box dock and interaction states;
- graceful missing-art fallback so corrupt assets do not render browser broken-image chrome;
- reduced-motion handling and responsive desktop/mobile layout;
- user-approved Toilet Buddy integrated as canonical Tier-1 art via `public/assets/characters/toilet-buddy-form-a.webp`;
- Toilet Buddy source cleaned to transparent background and normalized on a 256x256 runtime canvas;
- deterministic regression coverage rewritten around the sequential chain, migration, persistent discovery, deadlock and onboarding behavior;
- sequential-chain presentation pass added: persistent Best Discovery -> Next Target strip, locked/current/next Collection states and tier badges;
- new-character discovery feedback added with a short localized reveal toast plus board pulse;
- Collection atlas ordering corrected after the chain reorder so each slot matches its character identity again;
- approved standalone Toilet Buddy now renders directly on both board and Collection instead of being silently replaced by the legacy atlas crop;
- higher chain tiers receive lightweight reusable cell-value treatment without fabricating new character art;
- new presentation layer remains responsive and respects `prefers-reduced-motion`;
- CI compile regression from strict `bestFamily` typing was identified from Actions logs and fixed; subsequent `npm test` and Yandex packaging passed;
- deadlock Rescue is now chain-aware: it removes a terminal/top-tier blocker first instead of deleting the lowest-tier useful progress;
- deterministic `findBestMergePair` added to choose the highest-value available merge without mutating state;
- crowded-board guidance now highlights only that best merge pair, avoiding noisy all-pairs highlighting;
- full-board-but-solvable and true-deadlock states now have distinct copy and visual treatment;
- Rescue and crowded-board messaging updated in both EN/RU;
- regression coverage added for highest-tier merge hints and preserving lower-tier progress during deadlock rescue;
- Brain Box paid cost tuned from 10 to 12 coins so low-tier spawning has meaningful cost without breaking free progression;
- merge income centralized through `mergeRewardForTier()` at 4 coins per resulting tier;
- one-time first-discovery bonuses added from T3 upward (T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80) to make major chain reveals economically meaningful;
- discovery bonuses are paid only when `maxDiscoveredTier` advances, so repeated farming of an already-known tier receives base merge income only;
- deterministic economy smoke coverage now proves the full paid T1 -> T8 route can converge without rewarded ads or coin starvation when the first mission reward is claimed.

## Intentional limits
- Current chain ends at Tier 8 Tung Wood until more approved character identities are assigned beyond it.
- Camera Dude through Tung Wood still rely on the shared atlas source until their approved standalone runtime assets are integrated.
- Automatic interstitial placement is not enabled yet; adapter support exists, but cadence should be tuned against session flow rather than fired during active merging.
- Character normalization remains subject to real screenshot QA as approved standalone art replaces atlas entries.
- Economy tuning is intentionally simple and deterministic for the current vertical slice; no extra currencies, generators or energy system have been introduced.

## Next logical steps
1. validate the eight-tier economy pass in CI and fix any compile/test/package regressions;
2. capture the updated real browser runtime at desktop 1440x900 and compact/mobile dimensions;
3. compare chain strip, crowded-board hints, Collection states and first-session hierarchy against approved Figma targets;
4. tune clipping/scale/baseline deltas found in real captures;
5. replace Camera Dude through Tung Wood shared-atlas sources as approved standalone assets become available;
6. after runtime visual QA is clean, expand retention/meta content around the validated core chain rather than changing the merge rule again.
