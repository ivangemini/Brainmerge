# Brainmerge Platform, Persistence and Localization

## Status
Published `main` has a working local/Yandex adapter boundary and green Yandex package/browser smoke, but `main` is not the latest owner-approved product state.

GitHub-side recovery hardening is isolated on draft PR #6 / `hardening/repository-recovery-2026-09-01`. Do not merge that branch into stale `main` until the current local product UI is recovered and reconciled.

## Platform abstraction
Gameplay/core code must not call portal SDKs directly.

`PlatformAdapter` owns:
- platform initialization;
- Game Ready / gameplay lifecycle;
- preferred locale;
- state load/save;
- rewarded/interstitial ads;
- future payments/leaderboards.

Current production adapters:
- local browser;
- Yandex Games.

## Boot contract
Boot order:
1. select platform adapter;
2. initialize SDK/persistence;
3. resolve locale;
4. load locale resources;
5. load and sanitize save;
6. account for elapsed time;
7. render interactive game;
8. emit platform Game Ready;
9. persist canonical state.

Game Ready must not fire before the first complete interactive render.

## Canonical save
Published schema is v6. All loaded external data must pass through `sanitizeState()` before use.

No feature should create an unversioned parallel local-storage save for authoritative gameplay/meta state.

## Safe-storage key — recovery hardening
Published `main` had a split:
- Local adapter: `brainmerge.save.v1`;
- Yandex safe storage: `brainmerge.save.v2`.

PR #6 removes that independent-key ownership:
- canonical safe key: `brainmerge.save.v2`;
- key constants live in `src/platform/storage-keys.ts`;
- Local reads canonical v2 first and falls back to legacy v1;
- Local dual-writes v2 + v1 during the recovery migration window so older browser fixtures/builds remain rollback-safe;
- Yandex uses the same canonical v2 constant;
- dedicated unit coverage verifies v2 preference, v1 fallback and synchronized migration writes.

The legacy dual-write is transitional, not the final storage architecture. Remove it only after the recovered current product and portal migration path have been verified.

## Remaining P0/P1 persistence issue — cloud/local freshness
Yandex load still prefers any cloud object over local safe storage. This can roll back a newer local snapshot if a cloud write was delayed/failed.

### Target save metadata
Add explicit freshness metadata, for example:
- monotonic `revision` incremented on authoritative transactions/persistence snapshots;
- `updatedAt` for diagnostics/tie-breaking.

On load:
1. read cloud candidate;
2. read local candidate;
3. sanitize both;
4. select the newest valid canonical snapshot;
5. reconcile/persist the winner to both stores when safe.

Do not compare unsanitized timestamps from arbitrary input as the only trust signal.

This change should be designed against the recovered current save schema rather than bolted onto stale `main` blindly.

## Autosave/lifecycle
Current periodic save plus pagehide/visibility flush strategy is valid in principle.

Requirements:
- passive accounting cursor advances exactly once;
- hide/resume cannot double-credit offline/online time;
- lifecycle flush requests latest canonical state;
- cloud debounce never causes an older queued snapshot to overwrite a newer one.

## Rewarded ads
Reward is granted only after the platform rewarded callback.

Close/error without rewarded callback must produce no gameplay reward.

Gameplay API should pause while the ad is open and resume idempotently only when the page is visible.

### Watchdog — implemented on PR #6
Published `main` depended entirely on SDK callbacks and could leave the caller awaiting forever.

PR #6 adds a 30-second watchdog for rewarded and fullscreen ads:
- no reward event + no close/error callback → resolves safely as unavailable/no reward;
- a confirmed `onRewarded` event remains valid if only the later close callback is lost;
- watchdog is cleared on normal close/error;
- gameplay resumes only when the page is visible;
- unit coverage exercises normal callbacks, lost callbacks and timeout behavior.

### GameplayAPI asynchronous rejection — implemented on PR #6
Published `main` only recovered from synchronous `start()/stop()` throws. A returned rejected promise could leave cached lifecycle state incorrect and produce an unhandled rejection.

PR #6 catches asynchronous GameplayAPI rejection and resets the cached lifecycle state so a later signal can retry. Dedicated unit coverage verifies retryability.

## Rewarded feature policy
Rewarded Brain Box and timed rewarded boosts are separate transactions.

Published `main` supports rewarded Brain Box only.

The owner-described timed boost system is not present in any GitHub branch inspected; recover local work before rebuilding it.

Timed boosts must:
- persist absolute expiry in canonical save;
- derive remaining time from `now`, not decrement a mutable counter as authority;
- survive reload/background transitions;
- never extend/duplicate from repeated render ticks unless the explicit transaction says so;
- expose available/loading/active/unavailable presentation states.

## Local development / visual fixtures
Production Local adapter should not fake portal rewards.

However, hiding all rewarded UI when `rewardedAds=false` makes local visual QA impossible.

Use a deliberate fixture/dev presentation path, such as query/config test mode, that can:
- render rewarded controls/cards;
- simulate success/failure in browser tests;
- remain impossible to confuse with production capability;
- avoid writing fake production reward state unless the fixture explicitly tests that transaction.

## Build/source parity
`src/` is authoritative and `build/` is generated. Because generated JS is currently committed, PR #6 adds a CI gate after TypeScript compilation:

```bash
git diff --exit-code -- build/
```

A source change that is not reflected in committed generated output now fails CI instead of leaving two contradictory code versions in the repository.

Longer-term preference: stop committing `build/` if publication requirements allow it.

## Yandex package
Yandex package must:
- set platform hint to `yandex`;
- include `/sdk.js` loader;
- retain only relative packaged references except the SDK loader;
- pass asset/import integrity checks;
- remain below portal size limits;
- signal LoadingAPI/Game Ready at the correct time.

Packaged release audit on PR #6 also scans CSS, not only HTML/JS/JSON, for debug/placeholder/secret markers.

## Localization
Production locales:
- English;
- Russian.

Main runtime uses `locales/en.json` / `locales/ru.json`.
Campaign runtime currently also has `campaign-en.json` / `campaign-ru.json` resources.

### Parity
The main locale checker validates EN/RU main keys. Campaign parity is currently validated by Campaign tests.

Preferred consolidation:
- one locale validation script that checks all production locale domains;
- fail on missing keys in either language;
- optionally detect obviously unused/unknown keys in code-owned domains.

## Identity rule
Stable gameplay/domain identity must never depend on translated display text.

Campaign/UI elements should carry explicit stable ids such as `data-location-id` and communicate through typed IDs/snapshots. Localized text is presentation only.

Published Campaign run presentation still contains a localized-title comparison as part of Location selection/launcher discovery; remove this during Campaign reconciliation.

## Error/fallback policy
When portal services are unavailable:
- gameplay remains playable where possible;
- rewarded controls report unavailable without granting reward;
- safe local persistence remains coherent with the same canonical key/schema;
- failure must not silently switch to an unrelated save slot;
- no platform error may corrupt canonical in-memory state.

## Current recovery regressions
PR #6 adds/extends coverage for:
1. canonical local v2 preference and legacy v1 fallback;
2. synchronized local migration writes;
3. rewarded success → one reward;
4. close/error without reward → zero reward;
5. no ad callbacks → watchdog resolves safely;
6. `onRewarded` followed by lost close → confirmed reward preserved and gameplay released;
7. hidden-page ad close → gameplay remains stopped until visible;
8. asynchronous GameplayAPI rejection → later lifecycle signal retries;
9. real Mission Claim browser transaction;
10. valid T8→T9 pointer merge with no false max-tier reject FX;
11. generated build/source parity.

## Required tests after local-product recovery
1. Yandex cloud newer than local → cloud wins.
2. Local newer than cloud → local wins and reconciles.
3. Corrupt cloud + valid local → local wins.
4. Yandex init failure → fallback still sees canonical safe-local progress.
5. Timed boost activation/reload/expiry uses absolute time.
6. Timed boost success/error/watchdog behavior on the recovered current UI.
7. EN/RU main + Campaign parity in one gate.
8. Recovered top-level Collection/Brain Lab layout on desktop and mobile.
