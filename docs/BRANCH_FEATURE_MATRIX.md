# Branch feature matrix

The recovery snapshot is the canonical base for the normalized build. Existing branches remain untouched; this document records which unique slices were evaluated and where they now live.

| Source branch | Unique slice | Decision | Normalized location |
| --- | --- | --- | --- |
| `codex/recovery-full-build-20260913` | Save v10, Raid, retention, analytics, combo/fever/visitor, current Campaign engine | Keep as canonical base | `src/core/game.ts`, `src/core/campaign*.ts`, `src/analytics/`, `src/main.ts` |
| `codex/world1-location-completion` (`1ef9c70`) | Five music tracks and audio settings | Port and adapt | `src/audio/music-manager.ts`, `public/audio/music/`, `public/audio-settings.css`, `docs/AUDIO_CREDITS.md` |
| `codex/world1-location-completion` (`1ef9c70`) | Rewarded coin boost, Golden Brain Box, Mutation Charge, Free Upgrade | Port with additive save-v10 defaults | `src/core/game.ts`, `src/core/types.ts`, `src/core/daily-reset.ts`, `src/ui/reward-boosts.ts` |
| `codex/world1-location-completion` (`1ef9c70`) | Full World 1 layouts, World 2 Traffic Lock, World 2 locations and raid layouts | Port behavior into the current typed engines | `src/core/campaign-run.ts`, `src/core/campaign-raid.ts` |
| `origin/campaign-world1-data-driven-v1` | Earlier data-driven Campaign behavior and regression cases | Reference only; current engine is newer | `tests/campaign*.test.mjs` |
| `origin/campaign-run-sneaker-garden-*`, `deliver-v1`, `restore-mastery-v1` | Historical Campaign phase snapshots | Regression/reference only | Current Campaign tests and save sanitizers |
| `codex/local-publication-ae19273` | Publication/package adjustments | Not an engine source | Current package scripts and release audits |
| `origin/tmp-gift-crisp*` | Duplicate snapshots at one commit | No unique feature | No port required |

## Compatibility rules

- Save schema remains v10; `adBoosts` is additive and missing fields receive safe defaults.
- Main-board units and coins are never consumed by Campaign or Raid supply.
- There is one T1→T18 chain, one current Campaign engine, and one current Raid engine.
- Music is requested through `brainmerge:music-request`; UI components do not own audio instances.
- EN and RU player-facing keys are kept in parity by the locale build check.
