# Brainmerge — Production Roadmap

## Product goal
Ship Brainmerge as a production-ready browser/mobile merge-idle game with a **clear long-term purpose**: complete the Brainverse Campaign, strengthen a permanent meta through Collection Rewards and Prestige, and keep the existing T1-T18 merge board as the core moment-to-moment loop.

The release-candidate foundation is already built. The next roadmap is not another polish-only pass; it is the post-RC retention/meta expansion.

## Current production baseline — complete
- [x] 6x5 touch/mouse/keyboard merge board.
- [x] One canonical T1 -> T18 character chain; T18 terminal for the current run.
- [x] Passive production, escalating paid Brain Box, optional rewarded Brain Box.
- [x] Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage.
- [x] Merge-first discovery and persistent Collection.
- [x] First-cycle missions, offline reward, `Next move`, deadlock Rescue.
- [x] Save migration through v5 and Yandex/local persistence hardening.
- [x] EN/RU parity and runtime locale QA.
- [x] Unified physical 6x3 `character-atlas.webp` for T1-T18 on board and Collection.
- [x] Board-first mobile composition with Missions / Collection / Brain Lab in modal sheets.
- [x] Production Missions / Collection / Rewards / Brain Lab icon set integrated.
- [x] Desktop/compact/mobile Chromium runtime QA, motion QA, accessibility QA and Yandex adapter smoke.
- [x] Yandex package/raster integrity/release audit in CI.

## New product north star — Brainverse Campaign
- [ ] Campaign becomes the main long-term objective rather than T18 being the final reason to play.
- [ ] Target complete structure: **8 worlds × 8 stages = 64 stages**, including 8 boss stages.
- [ ] Stage framework is data-driven and reuses the real merge board.
- [ ] Campaign progress survives Prestige.
- [ ] Worlds unlock sequentially; later worlds may require Prestige milestones.
- [ ] Stage stars/mastery create replayability without requiring more character tiers.
- [ ] Bosses use merge objectives/progress, not a separate combat engine.

Detailed source of truth: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## P0 — Collection Rewards
Goal: turn Collection from an informational gallery into permanent progression.

- [ ] Add claim-once milestones for 5/18, 10/18, 15/18 and 18/18 discovered.
- [ ] Add a Collection `Rewards` section/tab; do not add another mobile dock button.
- [ ] Reward types may include permanent income, Box discount, offline-cap bonus, Brain Cells and cosmetics.
- [ ] Model exact reward values before locking balance.
- [ ] Persist claimed milestones through Prestige.
- [ ] Guard against duplicate claims and corrupted claim state.
- [ ] Localize all new strings in EN/RU.
- [ ] Add Collection Rewards runtime/geometry screenshots on desktop and phone.

## P0 — Prestige / Brain Reset
Goal: make first T18 completion the beginning of the meta loop rather than the endpoint.

- [ ] Prestige unlocks after reaching T18.
- [ ] Add explicit confirmation UI showing what resets and what is preserved.
- [ ] Reset run-level board/economy state only.
- [ ] Preserve lifetime Collection, Collection Rewards, Campaign progress and permanent meta.
- [ ] Introduce Brain Cells as a dedicated permanent meta currency.
- [ ] Coins remain the only ordinary merge-economy spend currency.
- [ ] Add a small data-driven permanent upgrade tree.
- [ ] First eligible Prestige always awards at least one Brain Cell.
- [ ] Prestige never bypasses first-account merge-first discovery.
- [ ] Add deterministic reset/preserve invariants and no-double-award tests.

## P0 — Save v6 migration
Collection Rewards + Prestige + Campaign require one coherent schema migration.

- [ ] Add save v6 fields for collection reward claims.
- [ ] Add Prestige count, Brain Cells and permanent upgrade levels.
- [ ] Add campaign stage/star/world completion state.
- [ ] Decide whether active campaign runs are resumable; if yes, version their snapshot explicitly.
- [ ] Migrate v1-v5 -> v6 without losing current board/economy/discovery data.
- [ ] Sanitize negative/corrupt meta values and invalid campaign indices.
- [ ] Extend Yandex/local persistence tests to the new schema.

## P1 — Campaign framework
Goal: build the reusable system before authoring the full campaign.

- [ ] Add data definitions for worlds, stages, objectives, mastery conditions and rewards.
- [ ] Add isolated `CampaignRunState` so campaign stages cannot destroy the main idle board.
- [ ] Add campaign navigation/map destination.
- [ ] Keep mobile board-first; Campaign gets a prominent goal/map CTA rather than a fourth cramped dock item by default.
- [ ] Implement stage start / restart / abandon / complete flows.
- [ ] Implement up-to-3-star mastery results.
- [ ] Implement stage reward commit exactly once.
- [ ] Implement world unlock progression.
- [ ] Add touch/mouse/keyboard and reduced-motion coverage.
- [ ] Localize all campaign UI and keep generated environment art text-free.

## P1 — Campaign stage primitives
- [ ] Reach target tier.
- [ ] Complete N merges.
- [ ] Earn N stage coins.
- [ ] Brain Box count/limit objective.
- [ ] Limited-move challenge.
- [ ] Target-order challenge.
- [ ] Crowded-board deterministic puzzle.
- [ ] No-Box deterministic puzzle.
- [ ] Timed challenge only after untimed objectives are stable.

Stage creation must remain configuration-first; avoid world-specific gameplay conditionals.

## P1 — Boss framework
- [ ] Boss progress/HP is code-owned and localized.
- [ ] Ordinary merges contribute baseline progress.
- [ ] Rotating target orders create larger progress hits.
- [ ] Boss render never covers board hit targets.
- [ ] Boss defeat grants a world-completion reward and unlocks the next map segment.
- [ ] Boss presentation remains playful/toy-like; no gore or separate combat simulation.
- [ ] Add deterministic boss completion/world unlock tests.

## P1 — Campaign content milestone 1
**World 1 + World 2 are the proof of the complete retention loop.**

- [ ] World 1: 7 normal/challenge stages + boss.
- [ ] World 2: 7 normal/challenge stages + boss.
- [ ] Production world art for both worlds.
- [ ] Production boss art for both worlds.
- [ ] Production stage-node/map icon kit.
- [ ] Campaign rewards tied into coins/Collection/Brain Cells without runaway inflation.
- [ ] Playtest fresh account -> campaign -> T18 -> Prestige -> campaign persistence.
- [ ] Validate that adding a new stage is primarily a data change.

## P2 — Campaign expansion
After Worlds 1-2 prove the framework and pacing:

- [ ] World 3 — Meme Factory.
- [ ] World 4 — Italian Chaos.
- [ ] World 5 — Sky Kingdom.
- [ ] World 6 — Neon Brain Lab.
- [ ] World 7 — Space Brainrot.
- [ ] World 8 — Brainverse Core / final boss.
- [ ] Author remaining stages to reach 64 total.
- [ ] Tune Prestige gates so they create goals without hard walls.
- [ ] Add world-level star rewards/cosmetics where useful.

Working theme names remain provisional until art/content approval.

## P2 — Rare / Shiny compatibility
Rare/Shiny remains a later retention layer already compatible with the architecture.

- [ ] Rarity is orthogonal to T1-T18 tier.
- [ ] Reuse current character atlas plus reusable rarity frames/FX; do not create 18 duplicate character renders.
- [ ] Track normal/rare Collection separately if shipped.
- [ ] Preserve rarity through Prestige and campaign save state.
- [ ] Add only after Campaign + Prestige has a stable economy.

## P2 — Live-ops hooks
Daily systems and limited events remain optional follow-up retention, not a substitute for the campaign.

- [ ] Re-evaluate Daily Missions/7-day streak after the main meta loop is playable.
- [ ] Event content should reuse campaign/merge primitives and localization.
- [ ] Avoid a bespoke art pipeline for every event.

## Asset dependencies
### Required before Campaign milestone 1 can look production-ready
- [ ] Campaign / World Map icon — transparent 512×512 source.
- [ ] Prestige / Brain Reset icon — transparent 512×512 source.
- [ ] Brain Cell currency icon — transparent 512×512 source.
- [ ] Stage-node icon family — Normal, Challenge, Elite, Boss, Locked/Completed; transparent 512×512 sources or one approved sprite sheet.
- [ ] World 1 environment/banner — 1536×864, text-free, center-safe for responsive crop.
- [ ] World 2 environment/banner — 1536×864, text-free, center-safe for responsive crop.
- [ ] World 1 boss — transparent 1024×1024.
- [ ] World 2 boss — transparent 1024×1024.
- [ ] Optional World 1/2 emblems — transparent 512×512 if the map needs compact world identity.

### Already available; do not regenerate
- [x] Missions icon.
- [x] Collection icon.
- [x] Rewards icon.
- [x] Brain Lab icon.
- [x] Brain Box / upgrade atlas art.
- [x] T1-T18 canonical character visuals.
- [x] Generic reward/gift art.

### Later full-campaign art
- [ ] 6 additional world environment/banner assets.
- [ ] 6 additional boss renders.
- [ ] Up to 6 additional world emblems if the map uses them.

## Automated quality gates for the new systems
- [ ] v5 -> v6 migration smoke.
- [ ] Collection reward one-time claim tests.
- [ ] Prestige reset/preserve tests.
- [ ] Brain Cell award/spend invariants.
- [ ] Campaign/main-board isolation tests.
- [ ] Deterministic stage objective/reward tests.
- [ ] Boss/world unlock tests.
- [ ] Campaign progress survives Prestige.
- [ ] EN/RU locale parity remains 100%.
- [ ] Desktop 1440×900 / compact 1024×576 / phone 390×844 campaign screenshots.
- [ ] No horizontal overflow/broken image/page errors.
- [ ] Touch/mouse/keyboard campaign flow.
- [ ] Reduced-motion campaign/boss behavior.
- [ ] Yandex package integrity includes all new raster assets.

## External acceptance gates
- [ ] **Approved Figma acceptance:** compare current HUD/board/Missions/Collection/Brain Lab/Brain Box/mobile dock plus new Campaign/Prestige surfaces against approved targets. Current file key: `lIFT4QEPhnsFfSrRD8WFad`.
- [ ] **Real Yandex Games Portal acceptance:** run the final package inside the actual portal/debug panel and confirm Game Ready/Gameplay indicators, rewarded callbacks, visibility lifecycle and cloud storage.
- [ ] **Human pacing/retention sign-off:** play fresh account, World 1-2, first T18, first Prestige and a return session. Simulation is necessary but not a substitute for this.

## Guardrails
- Core first-account discovery remains merge-first.
- T1-T18 remains one readable sequential chain.
- Coins remain the only ordinary merge-economy currency; Brain Cells are permanent-meta-only.
- Campaign stages reuse core merge primitives rather than becoming a second unrelated game.
- Campaign progress and permanent rewards survive Prestige.
- No mandatory rewarded ads, energy systems or arbitrary real-time waits for campaign progression.
- Generated world/boss art contains no baked player-facing text.
- Raster art decorates code-owned state/hit areas; progression, prices, stars, objectives and localization remain runtime data.
- Mobile default remains board-first; do not return to a long vertical pile of full production panels.
- Prefer data tables/configuration over bespoke stage/world conditionals.
