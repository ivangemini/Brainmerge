# Brainmerge — Production Roadmap

## Product goal
Brainmerge is a browser/mobile merge-idle game with one T1→T18 chain and a board-first mobile runtime. Long-term play is organized around restoring the Brainverse through persistent Campaign Locations, Landmarks and multi-session World Raids, with Collection Rewards and Prestige providing permanent account growth.

The previous `8 short stages per world / 64 one-shot stages / 3 stars` Campaign model is retired.

## Current repository baseline — 2026-09-01
Published game-build baseline before this documentation refresh: `d5a2b291b59a781c28bff4fb642ab89488693348` (`chore: publish current game build`).

That publication commit did **not** introduce new `src/` gameplay logic relative to `429b2b1`; it synchronized repository/runtime infrastructure by adding the compiled `build/`, `package-lock.json`, `.gitignore`, and making `npm run serve` rebuild before serving.

Current source baseline already contains save v6 and the complete four-phase Sneaker Garden vertical slice.

## Current production baseline — implemented
- [x] 6×5 touch/mouse/keyboard merge board.
- [x] One canonical T1→T18 character chain; T18 is terminal for the current run.
- [x] Passive production, escalating paid Brain Box and optional rewarded Brain Box.
- [x] Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage.
- [x] Merge-first discovery and persistent Collection.
- [x] First-cycle missions, offline reward, `Next move`, deadlock Rescue.
- [x] Canonical save migration through **v6** with local/Yandex persistence.
- [x] EN/RU production locale parity architecture.
- [x] Unified physical 6×3 `character-atlas.webp` for T1-T18.
- [x] Board-first mobile layout with Missions / Collection / Brain Lab modal sheets.
- [x] Production Missions / Collection / Rewards / Brain Lab icon set.
- [x] Browser/runtime/package/Yandex QA infrastructure.
- [x] Generated `build/` published in repository; TypeScript source remains authoritative.

## Brainverse Campaign north star
Target complete Campaign:
- [ ] 8 worlds completed.
- [ ] 7 persistent Locations per world.
- [ ] 1 persistent World Raid per world.
- [ ] 56 Locations + 8 World Raids total.
- [x] Standard Location contract: Stabilize → Deliver Orders → Restore Landmark → Mastery.
- [x] World Progress derived from Location restoration.
- [x] Initial Raid gate: ≥80% World Restored + ≥5 restored Landmarks.
- [ ] Persistent 3-phase World Raid gameplay.
- [ ] Campaign progress proven to survive the actual Prestige transaction.
- [ ] Meaningful board modifier implemented for every production world.

Detailed contract: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Campaign foundation — implemented
- [x] Prominent Campaign entry outside the mobile three-item dock.
- [x] Responsive full-screen Campaign map.
- [x] World 1 / World 2 definitions and art.
- [x] Connected route with seven Location nodes + one Raid node.
- [x] World Restored / Landmark count / Raid gate summary.
- [x] Four-phase Location overview.
- [x] Three-phase Raid overview shell.
- [x] EN/RU Campaign resources.
- [x] Core Campaign domain in `src/core/campaign.ts`.
- [x] Canonical save-v6 Campaign state drives presentation snapshots.
- [x] Isolated resumable `CampaignRunState` in canonical save v6.
- [x] Campaign/main-board isolation.
- [x] Lifetime-discovery caps for Campaign orders/supply.
- [x] Sneaker Garden playable through all four phases.

## Save v6 permanent-meta foundation — implemented
- [x] Per-world unlock/clear state.
- [x] Per-Location Stabilize progress.
- [x] Per-Location Deliver progress.
- [x] Per-Location Landmark restoration progress.
- [x] Per-Location Mastery progress.
- [x] World Raid progress/clear storage foundation.
- [x] Collection Reward claim-id storage.
- [x] Prestige count, Brain Cells and permanent upgrade-level fields.
- [x] v1-v5 → v6 migration/sanitization.
- [x] Active CampaignRunState persistence/resume.

## World 1 / Location 1 — Sneaker Garden — proven vertical slice
### Stabilize
- [x] Six Overgrowth blockers.
- [x] Four starting T1 Campaign units.
- [x] Successful merges clear one nearest blocker.
- [x] Exact-once phase commit.

### Deliver
- [x] Deterministic 4-order queue, lifetime-discovery capped.
- [x] Reference max-T4 queue `T2, T2, T3, T4`.
- [x] Delivery consumes Campaign unit only.
- [x] Exact-once quarter-progress commits.

### Restore Landmark
- [x] Six orders in three atomic two-order batches.
- [x] Reference max-T4 queue `T2, T2, T3, T3, T4, T4`.
- [x] Giant Sneaker Flower Bed Lv1→Lv3.
- [x] Landmark Supply perk: 25% base, +5 percentage points per level, 40% at Lv3.

### Mastery
- [x] Reference max-T4 queue `T3, T4, T4`.
- [x] Five non-clearing Overgrowth cells.
- [x] Final 10% commit to 100% Location restoration.

### Still missing around the Location engine
- [ ] Explicit abandon/restart UX with confirmation.
- [ ] Generalized data-driven Location definitions.
- [ ] Human pacing/decision-quality tuning across multiple Locations.

## P0 — Generalize World 1 Locations — next implementation target
Do not clone Sneaker Garden into six bespoke handlers.

- [ ] Extract data-driven Location configuration for phase goals.
- [ ] Data-drive order queues/pressure.
- [ ] Data-drive Overgrowth layouts/variants.
- [ ] Data-drive Landmark identity/perk parameters within bounded rules.
- [ ] Toilet Pond.
- [ ] Watermelon Grill.
- [ ] Hose Tunnels.
- [ ] Gnome Yard.
- [ ] Mushroom Field.
- [ ] Backyard Core.
- [ ] Preserve one shared CampaignRunState engine.

## P0 — World 1 persistent Raid
Foundation exists; playable Raid does not.

- [ ] Three playable Raid phases.
- [x] Persistent Raid progress/clear storage foundation.
- [x] Core Raid gate and World 2 unlock derivation.
- [ ] Merge/order contributions to Raid progress.
- [ ] Stronger Overgrowth pressure in later phases.
- [ ] High-tier final deliveries.
- [ ] Reload/session persistence gameplay test.
- [ ] Raid clear → World 2 unlock gameplay test.

## P0 — Collection Rewards
- [ ] Claim-once milestones at 5/18, 10/18, 15/18 and 18/18.
- [ ] Rewards section inside Collection; no new mobile dock item.
- [ ] Permanent bounded reward data.
- [x] Claim-id persistence field exists in v6.
- [ ] Transactional no-double-claim behavior/tests.

## P0 — Prestige / Brain Reset
- [ ] Unlock after first T18.
- [ ] Confirmation clearly shows reset vs preserved state.
- [ ] Reset run board/economy/Brain Lab/passive run fields only.
- [ ] Preserve Collection + Campaign + permanent meta.
- [x] Prestige count / Brain Cell / permanent-upgrade fields exist in v6.
- [ ] Brain Cell award transaction; first valid reset awards at least one.
- [ ] Data-driven permanent upgrade tree/spend transactions.
- [ ] Deterministic reset/preserve/no-double-award coverage.
- [ ] Prove gameplay-earned Campaign progress survives Prestige.

## P1 — World 2
- [ ] Traffic Lock board modifier.
- [ ] Sneaker Transit.
- [ ] Pigeon Plaza.
- [ ] Vending Block.
- [ ] Long-Neck Junction.
- [ ] Sunglasses Strip.
- [ ] Appliance District.
- [ ] City Core.
- [ ] Persistent three-phase World 2 Raid.
- [ ] Validate T18 → Prestige → World 1 → World 2 long loop.

## P2 — Worlds 3–8
Only after Worlds 1–2 prove duration, decision quality and retention.

- [ ] World 3 — Meme Factory.
- [ ] World 4 — Italian / Mediterranean Chaos.
- [ ] World 5 — Sky Brainrot.
- [ ] World 6 — Surreal Brain Lab.
- [ ] World 7 — Space Brainrot.
- [ ] World 8 — Brainverse Core / final Raid.

Future worlds should add one readable board modifier each. Do not create 56 bespoke gameplay branches.

## P2 — Rare / Shiny
- [ ] Rarity remains orthogonal to T1-T18 tier.
- [ ] Reuse base atlas + reusable effects instead of 18 duplicate renders.
- [ ] Separate normal/rare Collection state only if shipped.
- [ ] Preserve rarity through Prestige/Campaign by explicit contract.

## P2 — Live ops
- [ ] Re-evaluate Daily Missions / streaks after the long Campaign loop is playable.
- [ ] Events reuse Location/order/Raid primitives.
- [ ] Avoid bespoke gameplay/art pipelines per event.

## Art status
Approved and repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- reusable Location/phase/Raid marker family;
- World 1 environment + boss;
- World 2 environment + boss.

No new generated art is required to generalize the World 1 Location engine. Use code-owned restoration/phase treatment first; generate Landmark-state overlays only if playtesting demonstrates a real readability/payoff problem.

## Automated quality-gate status in repository
Existing coverage includes:
- main runtime deterministic tests;
- save migration/sanitization;
- Campaign percentage / Landmark count / Raid gate;
- Campaign/main-board isolation;
- active run resume;
- Deliver exact-once behavior;
- Restore batch atomicity/persistence;
- Landmark Supply perk;
- Mastery completion to 100%;
- browser Campaign/runtime smoke infrastructure;
- EN/RU parity tooling;
- package/release/Yandex smoke infrastructure.

Still required:
- gameplay-earned Raid persistence/world unlock;
- Collection one-time claims;
- Prestige reset/preserve/no-double-award;
- Campaign-survives-Prestige proof;
- dedicated RU CampaignRun interaction smoke.

Do not infer a gate passed merely because the script exists; run it for the relevant change.

## External acceptance gates
- [ ] Approved Figma acceptance for core UI plus Campaign/Prestige surfaces.
- [ ] Real Yandex Games Portal/debug-panel run.
- [ ] Human pacing/retention sign-off: multiple World 1 Locations, World 1 Raid, first Prestige and World 2 entry.

## Guardrails
- First lifetime discovery stays merge-first.
- Campaign orders/supply do not reveal unseen lifetime tiers.
- T1-T18 remains one readable sequential chain.
- Coins remain ordinary run currency; Brain Cells remain permanent-meta-only.
- CampaignRunState remains isolated from the main board.
- Delivery consumes Campaign-board units only.
- Permanent Campaign/Collection/meta data survives Prestige by contract.
- No mandatory ads, energy gates or arbitrary real-time waits.
- World/Landmark/Raid state is code-owned; generated art does not bake progression UI.
- Mobile default gameplay remains board-first.
