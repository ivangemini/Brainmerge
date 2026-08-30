# Brainmerge — Production Roadmap

## Product goal
Ship Brainmerge as a production-ready browser/mobile merge-idle game with a clear active merge loop, meaningful economy decisions, return-session retention, polished presentation, resilient save/platform behavior, complete EN/RU localization, and a validated Yandex Games package.

## Production-ready definition
The project is ready only when all P0/P1 blocks below are complete and validated. A block is not complete because code exists; it must pass deterministic tests, save compatibility checks, localization parity, mobile/desktop UX review, and relevant package/CI gates.

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
- [x] Short boot/resume gaps under one minute accrue normally without surfacing a fake offline-reward banner; meaningful return gaps still use explicit Collect.
- [x] All new player-facing strings have EN/RU parity.

## P1 — Session and retention structure
- [x] First-session economy is simulation-tuned around an early T4/T5 active loop, first affordable upgrades and production acceleration; real human playtest remains part of final product QA.
- [x] Return-session loop is built around offline income plus deterministic `Next move` guidance rather than passive collection only.
- [ ] Daily/return goals are added only if real-session QA shows they create a useful decision; no second currency is justified by the current model.
- [x] Prestige/rebirth has been evaluated and intentionally deferred until real-session economy data exists; it is not being added merely to lengthen progression.
- [x] Rewarded Brain Box is optional acceleration, does not inflate paid-box price, and deterministic progression tests do not require rewarded ads.

## P1 — Production visual integration
- [x] All eight canonical character visuals are present in runtime: Toilet Buddy uses the approved standalone WebP and T2-T8 use the existing production character atlas. Splitting the atlas into standalone files is not a release requirement by itself.
- [x] Packaged-runtime screenshot/geometry QA runs in Chromium at desktop 1440x900, compact landscape 1024x576 and phone 390x844; screenshots are retained as CI artifacts and reviewed after layout changes.
- [x] Technical visual-state matrix covers T1-T8, crowded guidance, deadlock/Rescue, offline reward, mission-ready/completed, locked/affordable/maxed upgrades and T8 discovery without overflow, broken images or missing sprite geometry.
- [x] Runtime-capture review corrected character perceived-mass normalization toward the Art Bible 72–82% useful-occupancy target without changing hitboxes or gameplay rules.
- [x] Runtime-capture review removed duplicated discovery feedback and moved the fixed phone audio control out of production-card content.
- [x] Code-driven game-feel animation layer adds asynchronous character idle motion, selected/merge-target lift, spawn pop, merge overshoot + particle burst, reward/HUD feedback, upgrade response and Rescue response without requiring new raster animation assets or changing gameplay state.
- [x] Game-feel motion respects `prefers-reduced-motion`; event particles/floating values are short-lived presentation nodes and are disabled for reduced motion.
- [x] Packaged motion smoke exercises real merge and Brain Box actions, validates merge/spawn animation names and transient classes, verifies particle cleanup, and confirms reduced-motion suppresses particle creation while gameplay still completes.
- [ ] Align Mission, Collection, Brain Box dock and HUD to approved Figma/art direction in the complete runtime; technical browser QA is green but artistic target matching remains a separate gate.
- [ ] Final approved-target visual acceptance remains pending because current Figma MCP read quota does not permit deeper node inspection; do not treat technical screenshots as a substitute.

## P1 — UX, accessibility and input
- [x] Packaged-runtime mouse merge is exercised at desktop and compact viewports through the real pointer handlers.
- [x] Packaged-runtime touch merge is exercised in a touch-capable phone Chromium context through the real pointer handlers.
- [x] Keyboard runtime behavior is non-destructive: Enter/Space on focused board cells reuse select/move/merge, arrows move focus, focus survives code-driven rerenders, Escape clears selection, and global Space cannot silently buy a Brain Box.
- [x] Packaged RC smoke verifies keyboard Tab reaches the merge board with a visible >=3px focus ring, reduced-motion collapses attention animations to <=1 ms, and visible coarse-pointer controls remain at least 44x44 on the 390px phone viewport.
- [ ] Final artistic contrast/focus review against approved Figma direction remains pending; automated accessibility geometry does not substitute for approved-target visual acceptance.
- [x] UI ownership regression tests guard stylesheet order, responsive panel reachability, code-owned Brain Lab state/actions, shared/standalone character sprite contracts and discovery-feedback deduplication.
- [x] Full-board/deadlock/offline/upgrade-lock states have localized actionable explanations.

## P1 — Save/data robustness
- [x] Versioned migration covers every shipped schema through current save v5.
- [x] Invalid timestamps, negative/corrupt currencies and invalid upgrade levels sanitize safely; malformed board data is rejected.
- [x] Offline accrual is idempotent across persisted hide/resume/reload boundaries and clock rollback in deterministic lifecycle tests.
- [x] Platform persistence uses periodic foreground snapshots plus explicit lifecycle flush; Yandex debounce/latest-snapshot/cloud-first/local-fallback behavior has automated coverage.

## P1 — Release readiness
- [ ] CI green on final release-candidate HEAD: TypeScript, deterministic tests, locale check, Yandex package/integrity, packaged Chromium smoke and artifact upload.
- [ ] Final package tested against real Yandex portal lifecycle/capability behavior; automated mock-SDK coverage does not substitute for the portal/debug panel.
- [x] Yandex adapter separates SDK initialization from Game Ready: `LoadingAPI.ready()` and `GameplayAPI.start()` are emitted only after locale/save restoration and the first interactive render, with deterministic idempotence coverage.
- [x] Packaged Yandex-adapter browser smoke runs the actual `YandexPlatformAdapter` behind an instrumented SDK contract and verifies SDK init, preferred locale before Game Ready, 30-cell render before `LoadingAPI.ready()`, Gameplay start/stop around rewarded ads, rewarded spawn delivery and pagehide cloud flush of canonical save v5.
- [x] Package integrity validates referenced files plus structural integrity of packaged WebP/PNG raster assets, preventing truncated art from passing the portal gate.
- [x] CI browser gate opens the actual packaged `dist/`, checks 30 cells/key production panels, horizontal overflow, broken images/page errors, compact/mobile panel geometry, shared-atlas sprite geometry and mouse/touch/keyboard merge paths.
- [x] Packaged release audit rejects TODO/FIXME/HACK markers, placeholder/sample copy, debug-only attributes/flags and common private/API token formats; it is part of both local and Yandex packaging commands.
- [x] No hardcoded debug controls, placeholder/sample copy or common secret markers are exposed in the currently packaged build.
- [x] Packaged RC smoke validates a fresh accessibility path plus a real legacy v2 localStorage payload migrating through boot to canonical persisted v5 with T5 discovery, Collection progress, mission compatibility and stale-selection cleanup.
- [x] Session-state, architecture, progression, asset manifest and roadmap docs track the current economy/UI runtime baseline.

## Current execution order
1. [x] Economy and idle-production core.
2. [x] Persistence/autosave + lifecycle hardening for time-based economy.
3. [x] First-session simulation pacing + return-session guidance.
4. [x] Approved Brain Lab/offline artwork integrated into existing code-driven components.
5. [x] UI-layer responsibility cleanup + source-level keyboard/input hardening.
6. [x] Packaged desktop/compact/mobile Chromium screenshot + mouse/touch/keyboard runtime QA and responsive correction.
7. [x] Code-driven game-feel animation pass for board/action/reward feedback.
8. [x] Packaged motion-event and Yandex-adapter browser hardening.
9. [ ] Full approved-Figma/art-direction alignment and final visual acceptance.
10. [ ] Final artistic contrast/visual QA against approved targets.
11. [ ] Real Yandex portal SDK/capability smoke and final RC validation.

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
- Automated browser smoke is a technical runtime gate, not a substitute for approved Figma/art-direction comparison, human pacing review or real Yandex portal validation.
- Do not claim production readiness until all relevant gates above are actually validated.
