# Active Session — Brainmerge

## Current objective
Convert the working vertical slice from a strong prototype into a production-looking first-session experience while preserving the approved Figma direction, localization contract and multi-platform architecture.

## Completed
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge-board core;
- paid spawn, move, drag/drop and tap-to-select merge flow;
- tier 1–3 progression using the locked three-tiers-per-form art cadence;
- coins, XP/level, collection preview and mission progress;
- EN/RU localization with automated 54-key parity validation;
- version-2 save format with migration from version 1;
- two-step first-session onboarding that highlights a merge pair then Brain Box;
- claimable first-mission reward;
- true-deadlock detection and rescue that frees a cell only when no merge exists;
- platform factory + local adapter + Yandex Games adapter;
- Yandex locale, safe storage, debounced cloud save, rewarded/fullscreen ads and LoadingAPI/GameplayAPI integration;
- rewarded free Brain Box path shown only when the platform exposes rewarded ads;
- procedural merge/spawn/reward/rescue audio + particle feedback and mute control;
- portal packager + Yandex CI artifact with package-size gate;
- Figma first-session and deadlock/rescue production targets;
- per-family runtime presentation normalization for scale, baseline and contact shadow;
- richer material pass for board frame/tray/cells, HUD, mission/collection cards, Brain Box dock and interaction states;
- graceful missing-art fallback so corrupt assets do not render browser broken-image chrome;
- reduced-motion handling and responsive desktop/mobile layout;
- 14 deterministic logic/localization/presentation tests expected after this pass;
- balance smoke simulation: 5,000 greedy runs reached the first 6-merge mission in 100% of runs, averaging ~5.55 paid spawns after the starter merges.

## Intentional limits
- Tier 4+ gameplay is blocked until approved Form B art is supplied; no fake recolor/placeholder evolution is used.
- Automatic interstitial placement is not enabled yet; adapter support exists, but cadence should be tuned against session flow rather than fired during active merging.
- Character normalization is tuned from current Form A assets and remains subject to screenshot QA as new art arrives.

## Next logical steps
1. run CI and capture the updated real browser runtime at desktop 1440x900;
2. compare runtime against Figma and adjust the largest remaining visual deltas;
3. fix/replace any corrupt runtime character source (notably Toilet Buddy if its WebP remains invalid);
4. integrate approved Form B character art as soon as Gemini generations arrive;
5. only then expand retention/meta content beyond the validated core merge session.
