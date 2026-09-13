# Brainmerge — Code Audit and Retention Implementation Plan

This document records the code and retention audit approved on 2026-09-05. It is the implementation source of truth alongside the project design documents. Completed work must be checked here only after its verification passes.

## Product targets

- First T18 in about 90 minutes of active play, with an ordinary no-ad route capped at 120 minutes.
- A hybrid rhythm: useful 5–10 minute sessions, persistent Campaign progress and offline income between sessions.
- Faster rewards and transitions, escalating merge feedback, automatic Fever windows, absurd visitors and optional event objectives.
- T18 leads into Collection Rewards, Prestige and Campaign rather than ending progression.
- EN/RU parity, touch/mouse/keyboard support, browser portability and one canonical T1–T18 chain remain mandatory.

## Audit findings and priorities

### P0 — data loss and progression blockers

- Campaign units legally created above lifetime discovery are removed by save sanitization.
- A saved T1 Campaign order can become impossible after account discovery increases because Campaign Supply stops producing T1.
- Yandex loading always prefers any cloud object, even when the local save is newer or the cloud object is invalid.
- Runtime timers and lifecycle handlers can save the initial state before asynchronous save restoration finishes.
- Brain Box cost grows without a safe upper bound and eventually reaches unusable values and `Infinity`.
- The current Box tier ceiling makes the requested 90–120 minute first-T18 target impossible without thousands of low-tier boxes.

### P1 — interaction, meta and retention gaps

- The five-second income render replaces the board DOM and drops keyboard focus; it can also interrupt pointer capture.
- Campaign modal focus is repeatedly moved and background focus is not consistently contained.
- Several numeric save fields accept `NaN` or `Infinity`.
- Campaign lacks a recoverable restart for a deadlocked or damaged temporary run.
- Rounded percentages are used near Campaign completion and Raid gates instead of exact progress.
- Missions stop at T8; Collection reward fields and Prestige fields exist, but neither system has playable transactions.
- Only Sneaker Garden is playable. The remaining World 1 Locations and Raid are presentation/foundation only.

### P2 — maintainability and measurement

- Campaign controllers are split across untyped `public/*.js` files with broad mutation observers.
- Some architecture/localization documents still describe save v5 despite the v6 runtime.
- There is no provider-neutral gameplay analytics boundary for measuring the retention funnel.

## Implementation phases

### Phase 1 — save integrity and confirmed Campaign defects

- [x] Preserve every legal Campaign merge result through save/reload without granting main-board discovery.
- [x] Make Campaign Supply capable of fulfilling every persisted active order, including T1.
- [x] Reject or clamp all non-finite core economy/progression values during save sanitization.
- [x] Add canonical save ordering metadata and select the newest valid local/cloud snapshot.
- [x] Serialize cloud writes so an older in-flight request cannot overwrite a newer snapshot.
- [x] Prevent autosave/lifecycle writes until boot has restored or initialized canonical state.
- [x] Add deterministic regression tests for all Phase 1 defects.
- [x] Run typecheck, unit/integration tests and relevant Yandex/Campaign smoke checks.

Phase 1 completed on 2026-09-05. Verified with 101 passing tests, Yandex package/integrity/release audit, Campaign smoke, RC smoke and Yandex browser smoke.

Phase 1 is ready when a reload cannot remove valid Campaign units, active orders remain constructible, invalid numeric saves cannot poison runtime math, and the newest valid save wins without boot-time overwrite.

### Phase 2 — stable input and UI lifecycle

- [x] Stop rebuilding the board for passive HUD-only updates; preserve focus, selection and pointer capture.
- [x] Make main and Campaign dialogs trap/restore focus and keep hidden surfaces inert.
- [x] Pause audio and active timers during hidden-page and advertising lifecycle states.
- [x] Add Campaign phase restart/recovery without erasing committed orders or Landmark batches.
- [x] Verify touch, mouse, keyboard, reduced motion, EN/RU and narrow viewports.

Phase 2 completed on 2026-09-05. Verified with 102 tests, Campaign/Restore/Mastery, motion, RC and RU runtime Chromium smokes, including keyboard focus preservation across a passive income tick.

Phase 2 is ready when income ticks, locale updates and modal transitions never cancel a valid gesture or lose keyboard position.

### Phase 3 — first-run economy and T18 pacing

- [x] Replace purchase-count price inflation with a bounded price derived from current Box base tier.
- [x] Add run-specific maximum tier so lifetime discovery cannot skip post-Prestige progression.
- [x] Extend Base Drop Tier through T14, discovery gated and normally four tiers behind the current run maximum.
- [x] Start tuning with `ceil(20 × 2.25^(baseTier−1))`; price base-tier upgrades from production-equivalent costs.
- [x] Retune Lucky Drop and Brain Income so acceleration helps without trivializing the run.
- [x] Extend immutable mission ids from T9 through T18 and reward roughly one current base-tier Box.
- [x] Add deterministic cautious/normal/optimized T1–T18 simulations with 2/4/6-second action cadence.

Phase 3 is ready when the median modeled no-ad route is 80–100 active minutes, a cautious route is at most 120 minutes, and no path requires waiting without another useful objective.

Phase 3 completed on 2026-09-05. Save v8 separates lifetime discovery from current-run progress. Deterministic no-ad pacing covers 2/4/6-second atomic input and a 12-second normal scan/decision cadence; the modeled normal route is within 80–100 minutes and all fast/cautious routes remain below 120 minutes.

### Phase 4 — Collection Rewards and Prestige

- [x] Add claim-once Collection milestones at 5/10/15/18, each granting permanent +5% income.
- [x] Implement T18-in-current-run Prestige eligibility, confirmation and exact-once Brain Cell award.
- [x] First balance: 3 Brain Cells per completed run; permanent upgrades cost 1/2/3/4/5 cells.
- [x] Implement the five existing upgrade categories: income, Box discount, starting coins, offline cap and Campaign power.
- [x] Reset run board/economy/Lab/missions/events; preserve Collection, claims, Campaign, active Campaign run and permanent meta.
- [x] Verify old saved upgrade levels remain readable and effects are bounded by the new tables.

Phase 4 is ready when T18 reliably starts a faster second run and reload/retry cannot duplicate any permanent reward.

Phase 4 completed on 2026-09-05. Collection claims and Brain Reset are atomic core transactions, permanent effects are capped at five levels, and the production UI exposes all claims/upgrades with EN/RU parity and a destructive-reset confirmation.

### Phase 5 — faster feedback and automatic events

- [x] Add merge combos with an eight-second continuation window and rewards at 3/6/10 merges.
- [x] Add automatic 30-second Fever after T5, charged by 24 merges and limited to once per four active minutes.
- [x] During Fever, apply 25% Box discount and ×2 merge coins; pause countdown when gameplay is inactive.
- [ ] Add one persisted automatic visitor every 4–6 active minutes after T5, with a feasible 90-second objective.
- [ ] Initial objectives: six merges, three Boxes or one Campaign delivery; reward two current Boxes in coins.
- [ ] Prevent visitors/Fever from opening over ads, dialogs or active drag, and prevent reload reward duplication.

Phase 5 implementation note (2026-09-05): combo and Fever are production-enabled through save v9 and active-time lifecycle accounting. Persisted visitor scheduling/objectives/rewards are implemented and tested, but production scheduling remains intentionally disabled until the three required visitor art sets exist; therefore visitor checkboxes and the phase gate remain open.

Phase 5 is ready when each 5–10 minute session exposes a meaningful short objective without mandatory ads, punishment, energy or lost progress.

### Phase 6 — World 1 and persistent Raid

- [x] Generalize the Sneaker Garden engine into data-driven Location configurations.
- [x] Implement the remaining six World 1 Locations using existing art and the four approved phases.
- [x] Offer two stable delivery choices where configured and keep order requirements within discovered tiers.
- [x] Implement a persistent three-phase World 1 Raid with exact progress, escalating Overgrowth and final deliveries.
- [x] Unlock the Raid at exact >=80% World restoration and >=5 restored Landmarks; clear it exactly once to unlock World 2.

Phase 6 is ready when World 1 takes multiple resumable sessions, the Raid survives reload and its clear unlocks World 2 through gameplay.

Phase 6 completed on 2026-09-05. Save v10 adds an isolated resumable Raid board. The exact gate launches three committed phases (8-blocker Break In, 12-blocker Chaos and three-tier Final Delivery), final acknowledgement clears the Raid once and unlocks World 2. Later Location delivery queues expose two stable choices without exceeding lifetime discovery.

### Phase 7 — analytics, validation and later content

- [x] Add a privacy-conscious provider-neutral analytics interface for tier, upgrade, wait, Campaign, order, visitor, Fever, reward and Prestige events.
- [ ] Measure active time separately from hidden/idle time and analyze D1/D7 plus time to T5/T8/T18 and post-T18 continuation.
- [ ] Validate World 1 and Prestige before implementing World 2; validate Worlds 1–2 before Worlds 3–8 or Daily streak systems.
- [ ] Move touched Campaign controllers toward typed ownership and narrow mutation observers.
- [x] Update roadmap, architecture and session state after each completed phase.

Phase 7 implementation note (2026-09-05): the typed provider-neutral analytics boundary is implemented without player/device identifiers, with browser-event and no-op sinks. Tier, upgrade, Campaign, order, Fever, reward and Prestige integration points are wired; persisted foreground `activeMs` is distinct from idle/hidden time. The full World 1 Raid loop is playable; funnel validation and later-world decisions now wait on real cohort evidence.

Phase 7 measurement update (2026-09-05): retention state now records session count, D1/D7 elapsed-day eligibility, one-time active clocks for T5/T8/T18, active continuation after T18, first Prestige and World 1 Raid clear. The provider event exposes only these aggregates. The analysis checkbox remains open until real cohorts exist; instrumentation alone is not presented as a retention result.

Latest verification (2026-09-05): typecheck, EN/RU parity (181 keys), 115 unit/integration tests, local package integrity and release audit, World 1 Raid browser smoke, packaged RC smoke and packaged Yandex browser smoke all pass.

## Required assets

Do not create visual placeholders. Visitor gameplay remains disabled in production until its required art exists.

- Three transparent visitor characters at 1024×1024, each with waiting and success states: sneaker courier, pigeon inspector and watermelon cook.
- Sneaker Garden Landmark states aligned to the World 1 environment: damaged and levels 1/2/3.
- Short spawn, merge and delivery sounds; escalating combo layers; Fever start/end; visitor arrival; Landmark restoration.
- Landmark states for later Locations only after the Sneaker Garden set passes runtime validation.

## Global verification and release criteria

- Every meaningful bug fix receives a focused deterministic regression test.
- TypeScript, unit/integration, package, release audit and relevant Chromium smokes pass.
- Save migration covers all supported versions, corrupted data, clock rollback and platform capability failure.
- UI verification covers desktop, compact and phone; touch, mouse and keyboard; EN/RU and text expansion; reduced motion.
- No release claim is made for real Yandex Portal behavior until tested in its debug/portal environment.
- Technical findings, completed checkboxes and measured balance results remain synchronized in this document and `production/session-state/active.md`.
