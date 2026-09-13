# Complete branch audit

Audited on 2026-09-13 from the local repository refs. The normalized build is based on `codex/recovery-full-build-20260913`; no existing branch was deleted, force-updated, or reset.

## All named branch refs

| Ref(s) | Tip | Classification | Result |
| --- | --- | --- | --- |
| `main`, `origin/main`, `codex/22` | `d5a2b29` | Same published baseline | Recovery preserved the working copy on top of this baseline. |
| `codex/local-publication-ae19273` | `ae19273` | Publication-only snapshot | Package/build adjustments reviewed; current package scripts and audits retained. |
| `codex/recovery-full-build-20260913` | `ca39fb2` | Recovery snapshot | Canonical preserved base: save v10, Raid, retention, analytics and current Campaign engine. |
| `codex/normalized-full-build-20260913` | `HEAD` | Final normalized build | Current development version containing the merged feature set. |
| `codex/world1-location-completion` | `1ef9c70` | Fullest historical feature branch | Audio, rewarded boosts, World 1/2 slices, visual polish, high-resolution Campaign art and browser coverage were audited and selectively ported. |
| `origin/campaign-run-sneaker-garden`, `origin/campaign-run-sneaker-garden-v2`, `origin/campaign-run-sneaker-garden-v5`, `origin/campaign-run-sneaker-garden-v6` | `1c03f56` | Exact duplicate refs | No unique content between these refs. Stabilize work is already represented by the current engine. |
| `origin/campaign-run-sneaker-garden-v7` | `df108ff` | Stabilize UI/CI slice | Presentation, touch-target, launcher-loop and smoke hardening reviewed; current generic Campaign UI is retained. |
| `origin/campaign-run-sneaker-garden-v7-ci` | `0f2e4cc` | Stabilize transaction/test slice | Save-v6 isolated-run behavior reviewed and covered by current save-v10 Campaign tests. |
| `origin/campaign-run-sneaker-garden-v7-copy` | `4e01968` | Earlier transaction slice | Same behavior as the v7 CI predecessor; no separate engine copied. |
| `origin/campaign-sneaker-garden-deliver-v1` | `34cf699` | Deliver Orders slice | Deliver persistence and browser resume behavior retained in current Campaign engine/tests. |
| `origin/campaign-sneaker-garden-restore-mastery-v1` | `0a67ca3` | Restore/Mastery slice | Restore batching, Landmark progress and Mastery behavior retained in current Campaign engine/tests. |
| `origin/campaign-world1-data-driven-v1` | `a3a36db` | Data-driven World 1 slice | Seven-location data and regression behavior ported into `src/core/campaign-run.ts`; the old parallel engine was not reintroduced. |
| `origin/tmp-gift-crisp`, `origin/tmp-gift-crisp-2`, `origin/tmp-gift-crisp-3`, `origin/tmp-gift-crisp-4`, `origin/tmp-gift-crisp-5` | `fb32ccc` | Exact duplicate refs | No unique content. |

`origin/HEAD` is only a symbolic alias of `origin/main`, not another feature branch.

## Unique feature audit

The historical World 1 completion line contained more than music. Its unique functional slices were:

- all seven World 1 Location layouts and World 2 Traffic Lock layouts;
- World 1/2-specific Landmark Perks, including Supply Luck, Clearing Pulse, Starter Cache, Supply Tier, Supply Cache, Mastery Paths and their World 2 variants;
- World 2 Campaign/Raid behavior and permanent meta interaction;
- safe Campaign-run abandon behavior;
- collection rewards and Brain Reset behavior, already represented by the current `GameState` implementation rather than duplicated modules;
- high-resolution Campaign backgrounds;
- audio manager, five tracks and audio settings;
- rewarded-ad boosts and daily/cooldown handling;
- visual/runtime and browser smoke coverage.

The normalized build now contains the missing typed behavior for Landmark Perks and abandon flow in addition to the previously ported audio, boosts and World 2 engines. High-resolution Campaign backgrounds are used by the current map. Old `world1-campaign-run.ts`, `collection-rewards.ts` and `prestige.ts` modules remain historical references only because they would create duplicate engines; their behavior is covered by the current typed modules.

## Deliberately excluded historical material

- generated `dist/`, old generated `build/` trees and checked-in dependency snapshots are not sources of truth;
- duplicate Campaign engines are not copied back into the repository;
- standalone character-art routing that conflicts with the approved single T1→T18 atlas contract is not reintroduced;
- duplicate temporary branches are kept as refs, but their identical content is not duplicated in the final source.

The complete normalized source and generated `build/` output are committed on `codex/normalized-full-build-20260913`.
