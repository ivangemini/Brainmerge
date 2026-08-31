# Brainmerge — Production Roadmap

## Product goal
Brainmerge is a browser/mobile merge-idle game with one T1 -> T18 chain, a board-first mobile runtime and a long-term reason to continue playing: **complete the Brainverse Campaign while building permanent meta progression through Collection Rewards and Prestige**.

The original release-candidate foundation is complete. Current development is the post-RC retention/meta expansion.

## Current production baseline — complete
- [x] 6x5 touch/mouse/keyboard merge board.
- [x] One canonical T1 -> T18 character chain; T18 is terminal for the current run.
- [x] Passive production, escalating paid Brain Box and optional rewarded Brain Box.
- [x] Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage.
- [x] Merge-first discovery and persistent Collection.
- [x] First-cycle missions, offline reward, `Next move`, deadlock Rescue.
- [x] Save migration through v5 and Yandex/local persistence hardening.
- [x] EN/RU production locale parity and runtime locale QA.
- [x] Unified physical 6x3 `character-atlas.webp` for T1-T18.
- [x] Board-first mobile layout with Missions / Collection / Brain Lab modal sheets.
- [x] Missions / Collection / Rewards / Brain Lab production icon set.
- [x] Desktop/compact/mobile Chromium runtime QA, motion QA, accessibility QA and Yandex adapter smoke.

## Brainverse Campaign target
- [ ] Complete campaign target: **8 worlds × 8 stages = 64 stages**, including 8 boss stages.
- [ ] Campaign progress survives Prestige.
- [ ] Stage framework is data-driven and reuses real merge primitives.
- [ ] Worlds unlock sequentially; later worlds may use Prestige gates.
- [ ] Up to 3 stars/mastery per stage for replay value.
- [ ] Bosses use merge objectives/progress, not a separate combat engine.

Detailed system contract: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Approved Campaign Art Pack — complete
The first production art pack is approved and integrated into the repository.

### Meta / navigation UI
- [x] Campaign / World Map icon.
- [x] Prestige / Brain Reset icon.
- [x] Brain Cell currency icon.

### Campaign node family
- [x] Normal stage node.
- [x] Challenge stage node.
- [x] Elite/mastery stage node.
- [x] Boss stage node.
- [x] Locked stage node.

### World 1 — Backyard Brainrot Zone
- [x] Surreal brainrot world environment, text-free and without baked stage circles.
- [x] World 1 boss — flamingo/lawn-machine/garden/sneaker surreal hybrid.

### World 2 — Surreal Brainrot City
- [x] Surreal city world environment, text-free and without baked stage circles.
- [x] World 2 boss — pigeon/vending-machine/city-sign/sneaker surreal hybrid.

Runtime optimized files are documented in `docs/ASSET_MANIFEST.md`.

## Campaign Map visual shell — complete
This is a presentation milestone, not yet the authoritative campaign state system.

- [x] Prominent Campaign entry near the main header instead of a fourth mobile dock button.
- [x] Full-screen responsive Campaign map shell.
- [x] World 1 / World 2 switcher.
- [x] Approved world backgrounds integrated.
- [x] Eight code-positioned stage nodes per world using the approved semantic node family.
- [x] Approved boss art integrated into each map.
- [x] EN/RU Campaign-shell copy resources.
- [x] Escape/back close behavior and mobile safe-area handling.
- [x] Dedicated packaged Chromium Campaign screenshot smoke on desktop and phone.
- [ ] Stage nodes do not yet own persistent completion/unlock state.
- [ ] Stage start/play flow is not yet implemented.

## P0 — Collection Rewards
Goal: make Collection permanent progression rather than only a gallery.

- [ ] Claim-once milestones at 5/18, 10/18, 15/18 and 18/18.
- [ ] Add `Rewards` section/tab inside Collection; no new mobile dock item.
- [ ] Model exact permanent reward values before locking balance.
- [ ] Persist milestone claim state through Prestige.
- [ ] Prevent duplicate claims and sanitize invalid claim state.
- [ ] EN/RU strings and desktop/mobile geometry QA.

## P0 — Prestige / Brain Reset
Goal: make first T18 completion the beginning of the long-term loop.

- [ ] Prestige unlocks after reaching T18.
- [ ] Confirmation screen explicitly shows reset vs preserved state.
- [ ] Reset run-level board/economy/Brain Lab state only.
- [ ] Preserve lifetime Collection, Collection Rewards, Campaign and permanent meta.
- [ ] Introduce Brain Cells as permanent-meta-only currency.
- [ ] Add a small data-driven permanent upgrade tree.
- [ ] First valid Prestige awards at least one Brain Cell.
- [ ] Deterministic exact reset/preserve/no-double-award tests.

## P0 — Save v6
Collection Rewards + Prestige + Campaign persistence land as one coherent schema migration.

- [ ] Collection reward claim state.
- [ ] Prestige count, Brain Cells and permanent upgrade levels.
- [ ] Campaign world/stage/star completion state.
- [ ] Decide whether active campaign runs are resumable.
- [ ] v1-v5 -> v6 migration without losing valid current state.
- [ ] Corrupt/negative meta-state sanitization.
- [ ] Yandex/local persistence coverage for v6.

## P1 — Stateful Campaign framework
The current map shell becomes a real progression surface only after this layer lands.

- [ ] Data definitions for worlds, stages, objectives, mastery conditions and rewards.
- [ ] Isolated `CampaignRunState` so campaign stages cannot destroy the main idle board.
- [ ] Stage start / restart / abandon / complete flows.
- [ ] Persistent stage completion and stars.
- [ ] Exact-once stage reward commit.
- [ ] World unlock progression.
- [ ] Map node state driven from campaign save data rather than static presentation.
- [ ] Touch/mouse/keyboard and reduced-motion coverage.

## P1 — Stage objective primitives
- [ ] Reach target tier.
- [ ] Complete N merges.
- [ ] Earn N stage coins.
- [ ] Brain Box count/limit objective.
- [ ] Limited-move challenge.
- [ ] Target-order challenge.
- [ ] Crowded-board deterministic puzzle.
- [ ] No-Box deterministic puzzle.
- [ ] Timed challenge after untimed primitives are stable.

## P1 — Boss framework
- [ ] Code-owned boss progress/HP.
- [ ] Ordinary merges contribute baseline progress.
- [ ] Target orders create larger progress hits.
- [ ] Boss art never covers board hit targets.
- [ ] Boss clear unlocks the next map segment/world.
- [ ] Deterministic boss-completion/world-unlock tests.

## P1 — Campaign content milestone
- [ ] World 1: 7 stages + boss playable end-to-end.
- [ ] World 2: 7 stages + boss playable end-to-end.
- [ ] Fresh account -> World 1/2 -> T18 -> Prestige -> Campaign persistence playtest.
- [ ] Adding a stage is primarily a data/config change.

## P2 — Full campaign expansion
After Worlds 1-2 prove pacing and architecture:
- [ ] World 3 — surreal Meme Factory.
- [ ] World 4 — surreal Mediterranean/Italian-chaos world.
- [ ] World 5 — surreal Sky world.
- [ ] World 6 — surreal Brain Lab world.
- [ ] World 7 — surreal Space Brainrot world.
- [ ] World 8 — Brainverse Core / final boss.
- [ ] Remaining content to 64 stages total.

Every future environment must follow the locked Brainmerge rule: **toy-like rendering + environment-wide viral surreal brainrot logic**, not a generic casual-game location with a few meme props pasted onto it.

## P2 — Rare / Shiny
- [ ] Rarity remains orthogonal to T1-T18 tier.
- [ ] Reuse the character atlas plus reusable frames/FX rather than 18 duplicate renders.
- [ ] Track normal/rare Collection separately if shipped.
- [ ] Preserve rarity through Prestige/Campaign state.

## P2 — Live ops
- [ ] Re-evaluate Daily Missions / streaks after Campaign + Prestige are playable.
- [ ] Events reuse merge/campaign primitives and localization.
- [ ] Avoid a bespoke art pipeline per event.

## Current missing art
No additional art is required to build the first **stateful** World 1 / World 2 campaign framework.

Defer new generation until runtime proves a concrete need. Possible later requirements:
- World Complete / mastery reward treatment if existing Rewards art is insufficient;
- Prestige confirmation illustration only if code-owned icon/layout treatment is not enough;
- Worlds 3–8 environments and bosses after the first two worlds validate the framework.

## Automated quality gates for new meta systems
- [ ] v5 -> v6 migration smoke.
- [ ] Collection reward one-time claim tests.
- [ ] Prestige reset/preserve tests.
- [ ] Brain Cell award/spend invariants.
- [ ] Campaign/main-board isolation tests.
- [ ] Deterministic stage objective/reward tests.
- [ ] Boss/world unlock tests.
- [ ] Campaign progress survives Prestige.
- [x] Campaign shell desktop/mobile screenshot smoke.
- [ ] Stateful Campaign EN/RU runtime smoke after v6 integration.

## External acceptance gates
- [ ] Approved Figma acceptance for current core UI plus Campaign/Prestige surfaces.
- [ ] Real Yandex Games Portal/debug-panel run.
- [ ] Human pacing/retention sign-off including first Prestige and Worlds 1-2.

## Guardrails
- First lifetime discovery stays merge-first.
- T1-T18 stays one readable sequential chain.
- Coins remain ordinary merge-economy currency; Brain Cells are permanent-meta-only.
- Campaign reuses core merge primitives rather than becoming an unrelated second game.
- Permanent Campaign/Collection/meta progress survives Prestige.
- No mandatory rewarded ads, energy systems or arbitrary real-time waits for progression.
- Generated world/boss art contains no baked player-facing text or stage state.
- Map nodes, objectives, stars, locks, prices and progression remain code-owned.
- Mobile default gameplay remains board-first.
