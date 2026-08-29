# Brainmerge Architecture — Browser Vertical Slice

## Decision
Use dependency-light browser TypeScript + DOM/CSS for the current playable slice. Keep pure gameplay rules independent from rendering and portal SDKs.

## Boundaries
- `src/core/` — deterministic merge/progression/economy/save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD/mission rendering and pointer/touch interaction.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters and capability detection.
- `public/assets/` — runtime art derived from approved character assets.
- `public/chain-polish.css` — sequential-chain presentation states.
- `public/mission-journey.css` — first-cycle mission journey presentation.

## Save model
Current save schema is **version 4**. `sanitizeState()` accepts legacy v1/v2/v3 saves and migrates them onto the current sequential-chain model.

Migration guarantees:
- old family IDs are preserved but normalized to their canonical chain tier;
- v3 `maxDiscoveredTier` is preserved and clamped to the runtime chain;
- old v2/v3 `missionClaimed=true` maps to `missionIndex=1`, preserving completion of the original first mission;
- v4 `missionIndex` is clamped to the current mission-track length;
- runtime-only selection/message state is never restored from a save.

## Platform model
The common runtime depends only on `PlatformAdapter`. Local development uses `LocalPlatformAdapter`. Yandex Games uses `YandexPlatformAdapter` for SDK initialization, locale signal, safe/local persistence, debounced cloud save, rewarded/fullscreen ads and GameplayAPI/LoadingAPI lifecycle reporting.

The common `index.html` uses an `auto` platform hint. A distribution package may explicitly set `brainmerge-platform=yandex` or use `?platform=yandex` for integration testing. Other portals add adapters rather than branching gameplay code.

## Current gameplay slice
- 6x5 board;
- one canonical T1 -> T8 character chain;
- Brain Box feeds only T1 Toilet Buddy;
- two identical characters merge into the next character identity;
- paid and rewarded Brain Box spawn paths;
- first-session two-step onboarding;
- persistent Collection discovery;
- eight-step first-cycle mission journey driven by cumulative merges, spawns and discovery milestones;
- one-time first-discovery coin bonuses plus deterministic merge rewards;
- crowded-board best-merge hint;
- chain-aware full-board deadlock rescue;
- versioned save migration through v4;
- responsive touch/mouse UI and reduced-motion handling.

## Current content boundary
The canonical runtime chain currently ends at T8 Tung Wood. Camera Dude through Tung Wood still use the shared character atlas until approved standalone production assets replace them. Extending the chain is content work; it does not require changing the core merge rule or mission architecture.
