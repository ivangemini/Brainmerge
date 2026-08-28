# Brainmerge Architecture — Browser Vertical Slice

## Decision
Use dependency-light browser TypeScript + DOM/CSS for the current playable slice. Keep pure gameplay rules independent from rendering and portal SDKs.

## Boundaries
- `src/core/` — deterministic merge/progression/save rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD rendering and pointer/touch interaction.
- `src/i18n/` + `locales/` — EN/RU localization and locale normalization.
- `src/platform/` — portal adapters and capability detection.
- `public/assets/` — runtime art derived from approved character assets.

## Save model
Current save schema is version 2. `sanitizeState()` migrates version-1 saves by preserving board/currency/XP/merge state and adding safe defaults for new fields. Runtime-only selection/message state is never restored from a save.

## Platform model
The common runtime depends only on `PlatformAdapter`. Local development uses `LocalPlatformAdapter`. Yandex Games uses `YandexPlatformAdapter` for SDK initialization, locale signal, safe/local persistence, debounced cloud save, rewarded/fullscreen ads and GameplayAPI/LoadingAPI lifecycle reporting.

The common `index.html` uses an `auto` platform hint. A distribution package may explicitly set `brainmerge-platform=yandex` or use `?platform=yandex` for integration testing. Other portals add adapters rather than branching gameplay code.

## Current gameplay slice
- 6x5 board;
- deterministic move/merge rules;
- tiers 1–3 using Form A art;
- paid and rewarded Brain Box spawn paths;
- first-session two-step onboarding;
- first mission with claimable coin reward;
- explicit full-board deadlock rescue;
- versioned save migration;
- responsive touch/mouse UI.

Tier 4+ remains blocked until approved Form B art is available. Core tier-to-form mapping already supports later 3-tier visual bands.
