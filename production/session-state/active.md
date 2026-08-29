# Active Session — Brainmerge

## Current objective
Turn the validated sequential merge core into a production-looking, self-guided first progression cycle with clear short-term goals, stable economy, save migration and strong browser/mobile presentation.

## Completed
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge-board core;
- paid spawn, move, drag/drop and tap-to-select merge flow;
- one sequential eight-character core chain: Toilet Buddy -> Camera Dude -> Sigma Rock -> Rizz Head -> Shark Sneakers -> Crocodile Bomber -> Coffee Ballerina -> Tung Wood;
- standard and rewarded Brain Box feed only T1 Toilet Buddy; higher characters are earned only through merging;
- successful merge replaces two identical characters with the next character identity;
- first session starts with two ready Toilet Buddy pairs for immediate readable discovery;
- persistent `maxDiscoveredTier` Collection progression;
- save schema upgraded to version 4 with migration from legacy v1/v2/v3 saves;
- legacy family/tier cells normalize onto canonical chain tiers;
- old `missionClaimed=true` maps to mission step 2 so the original first-mission reward is not lost on migration;
- coins, XP/level, Collection preview and deterministic progression state;
- EN/RU localization parity maintained;
- two-step first-session onboarding that highlights a merge pair then Brain Box;
- eight-step cumulative first-cycle mission journey added: 6 merges -> T4 -> 12 spawns -> T5 -> 30 merges -> T6 -> T7 -> T8;
- mission rewards tuned at 80 / 100 / 90 / 130 / 150 / 190 / 260 / 400 coins;
- mission progress earned before a mission activates still counts, avoiding artificial counter resets;
- mission panel now shows goal X/8, journey dots, current progress, reward-ready state and final completion state;
- localized mission-advance and full-journey completion feedback added;
- first-cycle mission presentation isolated in `public/mission-journey.css`, responsive and reduced-motion safe;
- true-deadlock detection and chain-aware Rescue that frees a terminal/top-tier blocker first;
- deterministic `findBestMergePair` chooses the highest-value available merge;
- crowded-board guidance highlights only that best merge pair;
- full-board-but-solvable and true-deadlock states have distinct copy and visual treatment;
- platform factory + local adapter + Yandex Games adapter;
- Yandex locale, safe storage, debounced cloud save, rewarded/fullscreen ads and LoadingAPI/GameplayAPI integration;
- procedural merge/spawn/reward/rescue audio + particle feedback and mute control;
- portal packager + Yandex CI artifact with package-size gate;
- Figma first-session and deadlock/rescue production targets;
- per-character runtime presentation normalization for scale, baseline and contact shadow;
- richer material pass for board frame/tray/cells, HUD, mission/collection cards, Brain Box dock and interaction states;
- graceful missing-art fallback;
- reduced-motion handling and responsive desktop/mobile layout;
- approved Toilet Buddy integrated as canonical standalone Tier-1 art via `public/assets/characters/toilet-buddy-form-a.webp`;
- Collection atlas ordering corrected after chain reorder;
- standalone Toilet Buddy actually wins over the legacy atlas crop on board and Collection;
- higher chain tiers receive lightweight reusable value treatment without fabricated art;
- Brain Box paid cost tuned to 12 coins;
- merge income centralized at 4 coins per resulting tier;
- one-time first-discovery bonuses: T3 +8, T4 +12, T5 +20, T6 +32, T7 +48, T8 +80;
- first-discovery messaging is distinct from ordinary repeat merges;
- comprehensive deterministic tests cover chain order, merge identity, spawn rules, discovery bonuses, best-merge hints, deadlock Rescue, onboarding, localization, save migration, mission progression and economy;
- full-cycle smoke test now requires a paid-only run to reach T8 AND complete all eight mission goals without rewarded ads or negative coins;
- canonical gameplay/economy/mission contract documented in `docs/GAMEPLAY_AND_PROGRESSION.md`;
- architecture documentation updated to current save v4 and sequential progression boundaries.

## Intentional limits
- Current chain ends at T8 Tung Wood until more approved character identities are assigned.
- Camera Dude through Tung Wood still rely on the shared atlas until approved standalone runtime assets are integrated.
- Automatic interstitial cadence remains disabled; adapter support exists, but placement should follow real session QA rather than fire during active merging.
- Character normalization remains subject to real screenshot QA as standalone art replaces atlas entries.
- No extra currency, generator, energy system, random high-tier drops or cross-character merges were introduced.
- The eight-step mission journey is the current first-cycle baseline, not an infinite quest/live-ops system.

## Next logical steps
1. validate the complete save-v4 / mission-journey / full-cycle economy pass in CI and fix every regression;
2. perform real browser screenshot QA at desktop 1440x900, compact landscape and narrow mobile;
3. compare mission journey, chain strip, crowded-board guidance, Collection and first-session hierarchy against approved Figma targets;
4. correct real clipping/scale/baseline/touch-layout deltas found by runtime capture;
5. integrate approved standalone Camera Dude through Tung Wood art as available;
6. only after runtime visual QA is clean, add the next retention layer (return-session goals / daily structure) without destabilizing the core chain.
