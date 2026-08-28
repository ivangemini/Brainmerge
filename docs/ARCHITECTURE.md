# Brainmerge Architecture — Vertical Slice

## Decision
Use dependency-free browser TypeScript + DOM/CSS for the first playable slice.

## Why
- fastest path to a small, portable web build;
- deterministic merge rules remain independent from rendering;
- no portal SDK is coupled to gameplay;
- no framework/runtime dependency cost for Yandex and other web portals;
- approved character renders can be used directly as lightweight WebP sprites;
- architecture can later move the board renderer to Canvas/WebGL without rewriting the core rules, save model, localization or platform adapters.

## Boundaries
- `src/core/` — pure gameplay/data rules; no DOM or platform SDKs.
- `src/ui/` — board/HUD rendering and pointer interaction.
- `src/i18n/` + `locales/` — EN/RU localization with parity validation.
- `src/platform/` — portal capability adapters; local adapter is the default development target.
- `public/assets/` — runtime art derived from approved assets.

## Current slice scope
The runtime currently exposes tiers 1–3 because the approved Form B (tiers 4–6) art is still being produced. Core tier-to-form mapping already supports unlimited 3-tier visual bands.
