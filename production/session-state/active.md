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
- deterministic regression coverage rewritten around the sequential chain, migration, persistent discovery, deadlock and onboarding behavior.

## Intentional limits
- Current chain ends at Tier 8 Tung Wood until more approved character identities are assigned beyond it.
- Camera Dude through Tung Wood still rely on the shared atlas source until their approved standalone runtime assets are integrated.
- Automatic interstitial placement is not enabled yet; adapter support exists, but cadence should be tuned against session flow rather than fired during active merging.
- Character normalization remains subject to real screenshot QA as approved standalone art replaces atlas entries.

## Next logical steps
1. validate the sequential-chain refactor in CI and fix any compile/test/package regressions;
2. capture the updated real browser runtime at desktop 1440x900 and compact/mobile dimensions;
3. verify that each merge visibly reveals the expected next identity and that Collection discovery persists;
4. replace remaining shared-atlas character sources with already-approved standalone art where available;
5. compare runtime against Figma and adjust the largest remaining visual/game-feel deltas before expanding retention/meta content.
