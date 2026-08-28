# Active Session — Brainmerge

## Current objective
Turn the first playable board into a resilient monetization-ready vertical slice while preserving the approved art/Figma direction and multi-platform architecture.

## Completed
- dependency-light browser TypeScript runtime;
- deterministic 6x5 merge-board core;
- paid spawn, move, drag/drop and tap-to-select merge flow;
- tier 1–3 progression using the locked three-tiers-per-form art cadence;
- coins, XP/level, collection preview and mission progress;
- EN/RU localization with automated 52-key parity validation;
- version-2 save format with migration from version 1;
- two-step first-session onboarding that highlights a merge pair then Brain Box;
- claimable first-mission reward;
- true-deadlock detection and rescue that frees a cell only when no merge exists;
- platform factory + local adapter + Yandex Games adapter;
- Yandex locale, safe storage, debounced cloud save, rewarded/fullscreen ads and LoadingAPI/GameplayAPI integration;
- rewarded free Brain Box path shown only when the platform exposes rewarded ads;
- responsive board/HUD and reduced-motion handling;
- 13 deterministic logic/localization tests passing locally;
- balance smoke simulation: 5,000 greedy runs reached the first 6-merge mission in 100% of runs, averaging ~5.55 paid spawns after the starter merges.

## Intentional limits
- Tier 4+ gameplay is blocked until approved Form B art is supplied; no fake recolor/placeholder evolution is used.
- Automatic interstitial placement is not enabled yet; adapter support exists, but cadence should be tuned against session flow rather than fired during active merging.
- Runtime screenshot visual QA is not marked passed until a real browser capture is compared against Figma.

## Next logical steps
1. sync the expanded gameplay HUD/onboarding/deadlock states into the Figma source of truth;
2. integrate Form B character art as soon as approved generations arrive;
3. add merge/spawn/reward VFX and audio event layer;
4. add portal packaging/CI smoke checks and then run real browser visual QA at desktop + compact mobile viewports;
5. expand retention loop only after the core merge session is visually validated.
