# Active Session — Brainmerge

## Current objective
The project is in **repository recovery and architecture stabilization**, not normal feature expansion.

The published GitHub `main` does not match the owner-approved current product layout. In particular, published `main` still places Collection and Brain Lab in a permanent right rail, while the newer intended product moved those systems to top-level UI. Rewarded-ad boost work described by the owner is also absent from published `main`.

Do not implement more product work on top of the stale layout until the actual current local state is recovered.

## Published GitHub baseline
Before the audit branch:

`9c2dadbf9be01d424a7ba41447a4a14206524f57`

This baseline has green CI and a valid packaged runtime, but its product-layout assertions are stale.

## Unmerged work
PR #5 / `campaign-world1-data-driven-v1` remains open and diverged from current `main`.
It contains useful World 1 Campaign generalization and Toilet Pond work. Preserve it for reconciliation; do not blindly merge or reimplement it.

## P0 recovery sequence
1. On the machine containing the visually current game, inspect `git status`, branches and worktrees.
2. Commit that exact current state to `recovery/local-current-2026-09-01`.
3. Push the recovery branch without force-pushing `main`.
4. Compare recovery vs `main` vs PR #5.
5. Create a reconciliation branch from the recovered product state.
6. Remove obsolete right-rail/mobile-dock tests and CSS assumptions.
7. Integrate useful Campaign refactor work from PR #5.
8. Only then resume feature delivery.

## Confirmed audit findings
- published `main` still renders Collection + Brain Lab in `.right-rail`;
- tests explicitly protect that obsolete composition;
- rewarded boost state/card is absent from `main`;
- `GameView.render()` rebuilds the entire app DOM on normal updates;
- multiple MutationObservers and CSS override layers compensate for destructive rendering;
- CSS has heavy cross-file ownership and extensive `!important` use;
- valid same-family T8–T17 pointer merges can receive historical max-tier reject FX;
- local/Yandex fallback save keys differ;
- Yandex cloud/local load has no freshness arbitration;
- ad SDK promises have no watchdog timeout;
- Mission Claim core/wiring is correct in published `main`, but browser smoke never actually clicks the button and verifies the transaction;
- committed `build/` creates a second visible representation of authoritative TypeScript and needs a strict generated-parity policy.

## Product-layout contract for recovery
The recovered current UI must treat Collection and Brain Lab as top-level systems, not permanent right-side cards.

Do not bring `.right-rail` back merely to satisfy old tests.

Rewarded-ad boosts must be treated as a separate feature from the existing rewarded Brain Box. If the local implementation exists, recover it. If it does not, re-specify it after repository reconciliation.

## Refactor direction
Split by ownership, not arbitrary line count:
- deterministic game core;
- save/migrations;
- board/economy/missions/upgrades;
- Campaign definitions/progress/run board/orders/presentation;
- app bootstrap/lifecycle/persistence;
- feature UI for Missions, Collection, Brain Lab, Rewarded, Campaign and Prestige;
- one structural CSS owner per feature.

Avoid full-root `innerHTML` replacement for passive ticks and avoid using global MutationObservers as the primary component lifecycle.

## Verification status
The published `main` CI run passed 96 Node tests plus packaged Chromium/Yandex/Campaign/RC/motion/locale smokes. This proves that the published baseline is internally consistent, **not** that it is the latest intended game.

The full audit is recorded in `docs/REPOSITORY_AUDIT_2026-09-01.md`.

## Source-of-truth order during recovery
1. owner-approved current product behavior/layout;
2. recovered local branch once pushed;
3. deterministic core contracts that remain valid;
4. reconciled documentation/tests;
5. generated `build/` only as output, never as independent source.