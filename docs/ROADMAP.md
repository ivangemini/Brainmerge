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
- [ ] Every board character generates coins according to tier.
- [ ] Merging is always production-positive: one next-tier unit produces more than two previous-tier units.
- [ ] Paid Brain Box price escalates with paid purchases rather than staying flat.
- [ ] Rewarded Brain Box remains free and does not inflate paid-box price.
- [ ] Brain Box upgrade tree: base drop tier, Lucky +1 tier chance, global income multiplier, offline-capacity upgrade.
- [ ] Brain Box can only drop already-discovered tiers; first discovery must still come from merging.
- [ ] Online passive income accrual with deterministic fractional handling.
- [ ] Offline income with capped duration, explicit collect flow, and save-safe timestamps.
- [ ] Economy simulation/regression coverage for early, mid and late progression; no accidental hard wall or runaway free-box loop.

## P0 — Economy/upgrade presentation
- [ ] HUD shows current coins and production/minute.
- [ ] Board units communicate individual production without obscuring characters.
- [ ] Brain Box CTA shows dynamic price and current drop profile.
- [ ] Upgrade Lab is readable on desktop and compact mobile, with level, effect, next cost and lock reason.
- [ ] Offline reward presentation is explicit and cannot be double-claimed.
- [ ] All new player-facing strings have EN/RU parity.

## P1 — Session and retention structure
- [ ] First-session pacing tuned around T3/T4, first upgrades and first meaningful production acceleration.
- [ ] Return-session loop built around offline income + actionable next goal, not passive collection only.
- [ ] Daily/return goals added only where they create decisions; no extra currency unless justified by simulation.
- [ ] Prestige/rebirth evaluated after the economy loop is validated; do not add it merely to lengthen progression.
- [ ] Rewarded-ad placements tied to optional acceleration/recovery, never required for core progression.

## P1 — Production visual integration
- [x] Approved standalone Toilet Buddy integrated.
- [ ] Replace shared atlas T2-T8 with approved standalone character assets as they become available.
- [ ] Real runtime screenshot QA at desktop 1440x900, compact landscape ~1024x576, and phone portrait/compact width.
- [ ] Align Mission, Collection, Upgrade Lab, Brain Box dock and HUD to approved Figma/art direction.
- [ ] Verify tier badges, income labels, merge hints, discovery/reward feedback and no clipping at gameplay scale.

## P1 — UX, accessibility and input
- [ ] Touch/mouse merge interactions regression-tested after economy UI expansion.
- [ ] Keyboard escape/shortcut behavior remains non-destructive.
- [ ] Focus states, reduced motion, readable contrast and minimum touch targets reviewed.
- [ ] Full-board/deadlock/offline/upgrade-lock states have actionable player-facing explanations.

## P1 — Save/data robustness
- [ ] Versioned migration covers every shipped schema through the current economy schema.
- [ ] Invalid timestamps, negative/corrupt currencies, invalid upgrade levels and malformed board data sanitize safely.
- [ ] Offline accrual cannot duplicate across reload, visibility changes or clock rollback.
- [ ] Platform cloud/local persistence keeps deterministic canonical state.

## P1 — Release readiness
- [ ] CI green on final HEAD: TypeScript, tests, locale check, Yandex package and artifact-size gate.
- [ ] Final package tested against Yandex lifecycle/capability behavior.
- [ ] No hardcoded player-facing copy, secrets, debug controls or placeholder/broken art exposed.
- [ ] Session-state and architecture docs match runtime behavior.
- [ ] Release candidate receives one full fresh-save and migrated-save smoke pass before publication.

## Current execution order
1. Economy and idle-production core.
2. Upgrade Lab + dynamic Brain Box + offline reward UI.
3. Economy simulations and save v5 migration hardening.
4. Runtime visual/interaction QA and responsive correction.
5. Return-session retention tuning.
6. Remaining standalone art integration.
7. Final release hardening and Yandex RC validation.

## Guardrails
- Core discovery remains merge-first: upgrades may accelerate rebuilding but cannot reveal an unseen tier.
- Keep one primary currency (coins) until data proves another currency creates a useful decision.
- Avoid energy systems or forced waits in the core loop.
- Prefer data-driven tuning tables over bespoke conditionals.
- Do not claim production readiness until all relevant gates above are actually validated.
