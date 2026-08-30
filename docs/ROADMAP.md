# Brainmerge — Production Roadmap

## Product goal
Ship Brainmerge as a production-ready browser/mobile merge-idle game with a clear active merge loop, meaningful economy decisions, return-session retention, polished presentation, resilient save/platform behavior, complete EN/RU localization, and a validated Yandex Games package.

## Production-ready definition
Implementation is complete when every code/content/automated-QA item below is green. Two final acceptance checks depend on external systems and remain explicitly separated at the end: approved Figma comparison and a real Yandex Games Portal/debug-panel run.

## P0 — Core game foundation
- [x] 6x5 touch/mouse merge board.
- [x] One canonical T1 -> T8 character chain.
- [x] Brain Box feed, merge rewards, discovery persistence.
- [x] Deadlock detection + chain-aware Rescue.
- [x] First-cycle mission journey.
- [x] EN/RU architecture and portal adapters.
- [x] Yandex packaging + CI.

## P0 — Economy and idle-production loop
- [x] Every board character generates coins according to tier.
- [x] Merging is always production-positive: one next-tier unit produces more than two previous-tier units.
- [x] Paid Brain Box price escalates with paid purchases rather than staying flat.
- [x] Rewarded Brain Box remains free and does not inflate paid-box price.
- [x] Brain Box upgrade tree: base drop tier, Lucky +1 tier chance, global income multiplier, offline-capacity upgrade.
- [x] Brain Box can only drop already-discovered tiers; first discovery must still come from merging.
- [x] Online passive income accrual with deterministic fractional handling.
- [x] Offline income with capped duration, explicit collect flow, and save-safe timestamps.
- [x] Economy simulation/regression coverage for progression to T8; no mandatory rewarded-ad wall or negative-coin state in the deterministic smoke route.

## P0 — Economy/upgrade presentation
- [x] HUD shows current coins and production/minute.
- [x] Board units communicate individual production at gameplay scale; packaged Chromium QA confirms character art, tier badges and production labels remain visible together at desktop, compact and phone viewports.
- [x] Brain Box CTA shows dynamic price and current drop profile.
- [x] Brain Lab keeps code-owned level/effect/cost/lock/affordable/max states and uses approved upgrade artwork only as a sprite presentation layer.
- [x] Responsive composition ownership is explicit: `mobile-runtime.css` owns panel layout/order; Brain Lab art no longer decides whether Mission/Collection/Lab are visible or where they appear.
- [x] Brain Lab/Mission/Collection remain structurally reachable below 1180px; compact cards keep natural content height and phone order prioritizes Brain Lab before Collection.
- [x] Offline reward presentation is explicit, uses approved return artwork without flattening the live amount/Collect UI, and cannot be double-claimed.
- [x] Short boot/resume gaps under one minute accrue normally without surfacing a fake offline-reward banner; meaningful gaps still use explicit Collect.
- [x] All player-facing strings have EN/RU parity.

## P1 — Session and retention structure
- [x] First-session economy is simulation-tuned around an early T4/T5 active loop, first affordable upgrades and production acceleration.
- [x] Return-session loop is built around offline income plus deterministic `Next move` guidance rather than passive collection only.
- [x] Daily/return-goal decision is closed for release: deterministic return-session QA proves a useful Offline Collect -> mission reward -> active merge decision sequence, so a synthetic daily-task layer and second currency are intentionally not added without real retention data.
- [x] Prestige/rebirth has been evaluated and intentionally deferred until real-session economy data exists; it is not being added merely to lengthen progression.
- [x] Rewarded Brain Box is optional acceleration, does not inflate paid-box price, and deterministic progression tests do not require rewarded ads.

## P1 — Production visual integration
- [x] All eight canonical character visuals are present in runtime: Toilet Buddy uses the approved standalone WebP and T2-T8 use the existing production character atlas. Splitting the atlas into standalone files is not a release requirement by itself.
- [x] Packaged-runtime screenshot/geometry QA runs in Chromium at desktop 1440x900, compact landscape 1024x576 and phone 390x844; screenshots are retained as CI artifacts and reviewed after layout changes.
- [x] Technical visual-state matrix covers T1-T8, crowded guidance, deadlock/Rescue, offline reward, mission-ready/completed, locked/affordable/maxed upgrades and T8 discovery without overflow, broken images or missing sprite geometry.
- [x] Runtime-capture review corrected character perceived-mass normalization toward the Art Bible 72–82% useful-occupancy target without changing hitboxes or gameplay rules.
- [x] Runtime-capture review removed duplicated discovery feedback and moved the fixed phone audio control out of production-card content.
- [x] Art-Bible-guided finish pass aligns board/HUD/Mission/Collection/Brain Lab/Brain Box into one toy-like cream/purple/cyan/orange production language while preserving live DOM state and code-owned controls.
- [x] Mobile visual finish keeps the board first, preserves Mission clearance, compacts Brain Lab into a 2x2 upgrade layout and keeps Collection reachable below it.
- [x] Code-driven game-feel animation layer covers family-specific idle motion, live drag, merge/move flights, reject feedback, Brain Box spawn-energy choreography, coin trails, discovery/T8 treatment, Collection unlock, reward/upgrade/Rescue response, CTA microinteraction and Mission/level/`Next move` progression feedback.
- [x] Game-feel motion respects `prefers-reduced-motion`; event particles, flight ghosts, spawn energy and progression choreography are suppressed/collapsed while gameplay remains fully functional.
- [x] Packaged motion smoke exercises real pointer drag, merge, ordinary move, invalid merge, tactile Brain Box activation, mission/`Next move` progression, discovery/Collection unlock, coin trails and spawn-energy choreography; it validates state preservation, emitted motion states, cleanup and equivalent reduced-motion gameplay.
- [x] Packaged RU visual runtime gate verifies real EN->RU switching on desktop and phone, no horizontal overflow, non-empty critical labels, panel-header clearance and unchanged 30-cell gameplay surface.
- [x] `visual-finish.css` is guarded as presentation-only: it cannot re-own production-panel ordering, grid rows or fixed visibility.

## P1 — UX, accessibility and input
- [x] Packaged-runtime mouse merge is exercised at desktop and compact viewports through the real pointer handlers.
- [x] Packaged-runtime touch merge is exercised in a touch-capable phone Chromium context through the real pointer handlers.
- [x] Keyboard runtime behavior is non-destructive: Enter/Space on focused board cells reuse select/move/merge, arrows move focus, focus survives code-driven rerenders, Escape clears selection, and global Space cannot silently buy a Brain Box.
- [x] Packaged RC smoke verifies keyboard Tab reaches the merge board with a visible >=3px focus ring, reduced-motion collapses attention animations to <=1 ms, and visible coarse-pointer controls remain at least 44x44 on the 390px phone viewport.
- [x] Internal artistic readability/focus review is complete against the Art Bible and current runtime captures; desktop/mobile/RU geometry and focus behavior are automated. Exact approved-Figma matching remains an external acceptance check, not implementation debt.
- [x] UI ownership regression tests guard stylesheet order, responsive panel reachability, code-owned Brain Lab state/actions, visual-finish ownership, shared/standalone character sprite contracts and discovery-feedback deduplication.
- [x] Full-board/deadlock/offline/upgrade-lock states have localized actionable explanations.

## P1 — Save/data robustness
- [x] Versioned migration covers every shipped schema through current save v5.
- [x] Invalid timestamps, negative/corrupt currencies and invalid upgrade levels sanitize safely; malformed board data is rejected.
- [x] Offline accrual is idempotent across persisted hide/resume/reload boundaries and clock rollback in deterministic lifecycle tests.
- [x] Platform persistence uses periodic foreground snapshots plus explicit lifecycle flush; Yandex debounce/latest-snapshot/cloud-first/local-fallback behavior has automated coverage.

## P1 — Release readiness
- [x] Internal release-candidate CI is green: TypeScript, deterministic tests, locale parity, Yandex package/integrity/release audit, desktop/compact/mobile runtime smoke, RC accessibility/migration smoke, motion smoke, RU visual runtime smoke, Yandex adapter smoke and artifact upload.
- [x] Yandex adapter separates SDK initialization from Game Ready: `LoadingAPI.ready()` and `GameplayAPI.start()` are emitted only after locale/save restoration and the first interactive render, with deterministic idempotence coverage.
- [x] GameplayAPI transitions are idempotent across duplicate lifecycle events.
- [x] Rewarded/fullscreen ad edge cases are covered: reward is granted only after `onRewarded`, close-without-reward/error gives no free box, ad close while hidden does not restart GameplayAPI, and later visibility resume starts it exactly once.
- [x] Packaged Yandex-adapter browser smoke runs the actual `YandexPlatformAdapter` behind an instrumented SDK contract and verifies SDK init, preferred locale before Game Ready, 30-cell render before `LoadingAPI.ready()`, rewarded success/no-reward/error paths, hidden-page ad lifecycle and pagehide cloud flush of canonical save v5.
- [x] Package integrity validates referenced files plus structural integrity of packaged WebP/PNG raster assets, preventing truncated art from passing the portal gate.
- [x] CI browser gate opens the actual packaged `dist/`, checks key production panels, horizontal overflow, broken images/page errors, compact/mobile geometry, shared-atlas sprite geometry and mouse/touch/keyboard merge paths.
- [x] Packaged release audit rejects TODO/FIXME/HACK markers, placeholder/sample copy, debug-only attributes/flags and common private/API token formats; it is part of both local and Yandex packaging commands.
- [x] No hardcoded debug controls, placeholder/sample copy or common secret markers are exposed in the currently packaged build.
- [x] Packaged RC smoke validates a fresh accessibility path plus a real legacy v2 localStorage payload migrating through boot to canonical persisted v5 with T5 discovery, Collection progress, mission compatibility and stale-selection cleanup.
- [x] Session-state, architecture, progression, asset manifest and roadmap docs track the current production runtime baseline.

## Autonomous implementation status
1. [x] Economy and idle-production core.
2. [x] Persistence/autosave + lifecycle hardening.
3. [x] First-session pacing + return-session guidance.
4. [x] Brain Lab/offline artwork integration.
5. [x] UI ownership + keyboard/touch/mouse hardening.
6. [x] Desktop/compact/mobile packaged runtime QA.
7. [x] Complete game-feel animation pass.
8. [x] Motion-event + Yandex-adapter browser hardening.
9. [x] Art-Bible production visual finish and responsive cleanup.
10. [x] EN/RU visual/readability/accessibility runtime acceptance.
11. [x] Internal release-candidate package/CI validation.

## External acceptance gates
These are not code tasks and cannot be honestly marked complete without the external systems themselves.

- [ ] **Approved Figma acceptance:** compare Mission, Collection, Brain Box, HUD and overall composition against the approved Figma nodes once the authenticated Starter-plan MCP read quota allows node inspection. Current file key: `lIFT4QEPhnsFfSrRD8WFad`.
- [ ] **Real Yandex Games Portal acceptance:** run the final package inside the actual portal/debug panel and confirm real Game Ready/Gameplay indicators, rewarded-ad callbacks, visibility lifecycle and cloud storage behavior. The automated adapter contract is intentionally not mislabeled as a portal run.
- [ ] **Human pacing/retention sign-off:** play a fresh save and at least one real return session. This can tune economy/retention after release-candidate validation, but it is not replaced by simulation.

## Guardrails
- Core discovery remains merge-first: upgrades may accelerate rebuilding but cannot reveal an unseen tier.
- Keep one primary currency (coins) until data proves another currency creates a useful decision.
- Avoid energy systems or forced waits in the core loop.
- Prefer data-driven tuning tables over bespoke conditionals.
- `Next move` is advisory derived state and must never auto-spend or create hidden progression.
- Raster art decorates code-driven UI; prices, levels, locks, progress, localized text and hit areas remain runtime state/components rather than flattened images.
- Presentation-art CSS must not own responsive panel visibility or ordering; responsive composition belongs to `mobile-runtime.css`.
- Game-feel CSS/particles may animate live components but must not own game state, prices, progression, persistence or responsive layout.
- Keyboard shortcuts must not spend currency unless the user is explicitly activating the corresponding focused purchase control.
- Automated browser smoke is a technical/runtime acceptance gate, not a substitute for approved Figma comparison, human pacing review or the real Yandex portal.
