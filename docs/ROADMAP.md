# Brainmerge — Production Roadmap

## Product goal
Brainmerge is a browser/mobile merge-idle game with one T1 -> T18 chain and a board-first mobile runtime. The long-term reason to play is now **restore the Brainverse** through persistent Campaign Locations, landmarks and multi-session World Raids, while Collection Rewards and Prestige provide permanent account growth.

The previous `8 short stages per world / 64 one-shot stages / 3 stars` Campaign model is retired.

## Current production baseline — complete
- [x] 6x5 touch/mouse/keyboard merge board.
- [x] One canonical T1 -> T18 character chain; T18 is terminal for the current run.
- [x] Passive production, escalating paid Brain Box and optional rewarded Brain Box.
- [x] Brain Lab: Base Drop Tier, Lucky Drop, Brain Income, Offline Storage.
- [x] Merge-first discovery and persistent Collection.
- [x] First-cycle missions, offline reward, `Next move`, deadlock Rescue.
- [x] Canonical save migration through **v6** and Yandex/local persistence hardening.
- [x] EN/RU production locale parity and runtime locale QA.
- [x] Unified physical 6x3 `character-atlas.webp` for T1-T18.
- [x] Board-first mobile layout with Missions / Collection / Brain Lab modal sheets.
- [x] Production Missions / Collection / Rewards / Brain Lab icon set.
- [x] Desktop/compact/mobile Chromium runtime QA, motion QA, accessibility QA and Yandex adapter smoke.

## Brainverse Campaign north star
Target complete Campaign:

- [ ] **8 worlds**.
- [ ] **7 persistent Locations per world**.
- [ ] **1 persistent World Raid per world**.
- [ ] 56 Locations + 8 World Raids total.
- [x] Every Location uses the proven Stabilize -> Deliver Orders -> Restore Landmark -> Mastery phase contract.
- [x] World Progress is derived from Location restoration.
- [x] Initial Raid gate: >=80% World Restored + >=5 restored landmarks.
- [ ] World Raids are persistent 3-phase bosses with gameplay progress surviving sessions.
- [ ] Campaign progress survives Prestige — persistence fields are ready; reset transaction still pending.
- [ ] Each world has a meaningful board modifier, not only different art.

Detailed contract: `docs/CAMPAIGN_AND_META_PROGRESSION.md`.

## Approved Campaign Art Pack — complete
### Meta / navigation UI
- [x] Campaign / World Map icon.
- [x] Prestige / Brain Reset icon.
- [x] Brain Cell currency icon.

### Reusable Campaign UI family
- [x] Normal node art — used for persistent Locations.
- [x] Challenge node art — reusable for Deliver/Challenge phase treatment.
- [x] Elite/mastery node art — reusable for Landmark/Mastery treatment.
- [x] Boss node art — World Raid node / raid phase treatment.
- [x] Locked node art — locked phase treatment.

### World 1 — Backyard Brainrot Zone
- [x] Surreal brainrot world environment, text-free and without baked node circles.
- [x] World 1 boss — flamingo/lawn-machine/garden/sneaker surreal hybrid.

### World 2 — Surreal Brainrot City
- [x] Surreal city world environment, text-free and without baked node circles.
- [x] World 2 boss — pigeon/vending-machine/city-sign/sneaker surreal hybrid.

## Campaign foundation — implemented
- [x] Prominent Campaign entry outside the cramped mobile dock.
- [x] Full-screen responsive Campaign map shell.
- [x] World 1 / World 2 switcher.
- [x] Approved world backgrounds and bosses.
- [x] Connected map route 1 -> 8 with desktop/mobile geometry.
- [x] Map semantics changed from 8 short stages to **7 Locations + World Raid**.
- [x] World summary surface: World Restored %, landmarks, Raid gate.
- [x] Location overview shows four persistent phases and landmark identity.
- [x] Raid overview shows the three-phase persistent-boss loop.
- [x] EN/RU Campaign copy for new model.
- [x] Core Campaign domain in `src/core/campaign.ts`.
- [x] Canonical v6 Campaign state drives map percentages/status through a one-way presentation snapshot.
- [x] Chromium Campaign smoke verifies progress survives save/reload.
- [x] First isolated `CampaignRunState` vertical slice is production-playable through all four Sneaker Garden phases.

## P0 — Save v6 permanent-meta foundation — complete
- [x] Per-world unlock/clear state derived from prior Raid clears.
- [x] Per-Location Stabilize progress.
- [x] Per-Location Deliver/order progress bucket.
- [x] Per-Location Landmark restoration progress.
- [x] Per-Location Mastery progress.
- [x] World Raid progress/clear state.
- [x] Collection reward claim state foundation.
- [x] Prestige count, Brain Cells and permanent upgrade-level foundation.
- [x] v1-v5 -> v6 migration without losing valid current run/discovery state.
- [x] Clamp/sanitize corrupt Campaign/meta values.
- [x] Campaign progress serialized through the existing local/Yandex `GameState` persistence boundary.
- [x] Browser smoke mutates v6 Campaign progress, reloads and verifies restored UI state.
- [x] Active `CampaignRunState` is persisted/resumed in canonical v6 save.

## P0 — Stateful Location engine — first implementation proven
Goal: make a Location a multi-session merge objective instead of a short level.

- [x] Isolated `CampaignRunState` with its own 6x5 board/counters/orders/modifier state.
- [x] Start / resume / leave-and-resume Location flow.
- [ ] Explicit abandon/restart UX with confirmation.
- [x] Main board remains untouched by Campaign actions.
- [x] Stabilize phase objective framework.
- [x] Deliver Orders framework: requested Campaign unit is consumed on delivery.
- [x] Exact-once persistent order progress commit.
- [x] Landmark restoration/upgrade transition.
- [x] Mastery phase framework.
- [x] Location restoration % wired to map node and World Progress.
- [x] Lifetime-discovery gating so Campaign does not bypass the main T1-T18 chain.
- [x] Permanent Landmark perk can modify bounded Campaign supply behavior without affecting main economy.

## P0 — World 1 vertical slice
Prove the whole new loop before authoring the rest of the world.

### Location 1 — Sneaker Garden — playable end-to-end
- [x] World 1 Overgrowth board modifier.
- [x] Stabilize objectives playable.
- [x] Multi-order delivery sequence playable.
- [x] Giant Sneaker Flower Bed restoration progression: 3 levels / 6 orders / atomic two-order batches.
- [x] Landmark gameplay perk: stronger Campaign Supply chance rises from 25% to 40% by Landmark Lv3.
- [x] Mastery rules: three final orders with stronger non-clearing Overgrowth.
- [x] Persistent Location/active-run storage and reload.
- [ ] Progress earned through gameplay survives Prestige — requires Prestige transaction implementation.
- [x] Shared desktop/mobile layout, EN/RU copy parity and Chromium gameplay QA.

Current phase weights are proven in code for Location 1:
- Stabilize -> 20%;
- Deliver -> 45% cumulative;
- Landmark Restore -> 90% cumulative;
- Mastery -> 100%.

Next product task is no longer to invent another one-off mini-game. Generalize this proven phase engine into data-driven World 1 Location configs and tune duration/decision quality during authoring.

## P0 — World 1 full restoration loop
After Location 1 proves the engine:

- [ ] Toilet Pond.
- [ ] Watermelon Grill.
- [ ] Hose Tunnels.
- [ ] Gnome Yard.
- [ ] Mushroom Field.
- [ ] Backyard Core.
- [ ] Data-driven Location definitions for phase goals, order queues, Overgrowth layouts and Landmark perks.
- [ ] Data-driven order pressure increases across Locations.
- [x] >=80% + 5-landmark Raid gate implemented in core.
- [ ] Visible Landmark/restoration evolution beyond numeric node state if playtest proves it necessary.

## P0 — World 1 persistent Raid
- [ ] Three playable Raid phases.
- [x] Persistent Raid progress/clear storage foundation.
- [ ] Merge/order contributions to Raid progress.
- [ ] Stronger Overgrowth pressure in later phases.
- [ ] High-tier final deliveries.
- [x] World 2 unlock rule derived from World 1 Raid clear.
- [x] World 1 100% completion rule in core.

## P0 — Collection Rewards
Still approved and now has v6 persistent claim storage.

- [ ] Claim-once milestones at 5/18, 10/18, 15/18 and 18/18.
- [ ] `Rewards` section inside Collection; no new mobile dock item.
- [ ] Permanent bounded reward data.
- [x] Claim-state persistence field exists in v6.
- [ ] Prevent double claim in reward transaction.
- [ ] Campaign-relevant rewards may exist, but must not trivialize Locations/Raids.

## P0 — Prestige / Brain Reset
Still approved and now has v6 permanent-meta storage.

- [ ] Unlock after first T18.
- [ ] Confirmation clearly shows reset vs preserved state.
- [ ] Reset run-level board/economy/Brain Lab only.
- [ ] Preserve Collection + Locations + Landmarks + Raids.
- [x] Brain Cell / Prestige count / permanent-upgrade fields exist in v6.
- [ ] Data-driven permanent upgrade tree and spend transactions.
- [ ] First valid Prestige always awards at least one Brain Cell.
- [ ] Deterministic reset/preserve/no-double-award tests.

## P1 — World 2
- [ ] World 2 Traffic Lock board modifier.
- [ ] Sneaker Transit.
- [ ] Pigeon Plaza.
- [ ] Vending Block.
- [ ] Long-Neck Junction.
- [ ] Sunglasses Strip.
- [ ] Appliance District.
- [ ] City Core.
- [ ] Persistent three-phase World 2 Raid gameplay.
- [ ] Validate first T18 -> Prestige -> World 1 -> World 2 long loop.

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
- [ ] Reuse character atlas + effects instead of 18 duplicate renders.
- [ ] Track normal/rare Collection separately if shipped.
- [ ] Preserve rarity through Prestige/Campaign state.

## P2 — Live ops
- [ ] Re-evaluate Daily Missions / streaks after the long Campaign loop is playable.
- [ ] Events reuse Location/order/Raid primitives.
- [ ] Avoid bespoke gameplay/art pipelines per event.

## Current missing art
No new generated art is required for the **stateful World 1 Location engine**.

Use existing world art and code-owned visual restoration treatments first. Generate additional Landmark-state art only after the first playable Location proves that static-map treatment is insufficient.

Potential later art:
- upgraded Landmark overlays/states if code-owned treatment is not expressive enough;
- World Complete treatment;
- Worlds 3–8 environments/bosses after Worlds 1–2 validation.

## Automated quality gates
- [x] Campaign shell desktop/mobile screenshot smoke.
- [x] 7 Location + 1 Raid semantic shell smoke.
- [x] Campaign core percentage/Raid-gate unit tests.
- [x] v1-v5 -> v6 migration coverage.
- [x] Location/Raid progress sanitization tests.
- [x] Browser save/reload Campaign persistence smoke.
- [x] Campaign/main-board isolation tests.
- [x] Delivery consumes Campaign unit only.
- [x] Exact-once Deliver and Landmark batch progress tests.
- [x] Active Stabilize/Deliver run browser resume tests.
- [x] Restore Landmark browser persistence smoke.
- [x] Mastery browser completion smoke through 100% Sneaker Garden.
- [ ] Gameplay-earned Raid progress persistence/world-unlock tests.
- [ ] Collection reward one-time claim tests.
- [ ] Prestige reset/preserve tests.
- [ ] Campaign progress survives Prestige.
- [ ] Dedicated RU CampaignRun interaction smoke; locale resource parity and global RU runtime smoke are already green.

## External acceptance gates
- [ ] Approved Figma acceptance for core UI plus Campaign/Prestige surfaces.
- [ ] Real Yandex Games Portal/debug-panel run.
- [ ] Human pacing/retention sign-off: Location 1, World 1 Raid, first Prestige and World 2 entry.

## Guardrails
- First lifetime discovery stays merge-first.
- Campaign orders initially cannot request an unseen lifetime tier.
- T1-T18 remains one readable sequential chain.
- Coins remain ordinary run currency; Brain Cells remain permanent-meta-only.
- CampaignRunState remains isolated from the main board.
- Delivery consumes only Campaign-board units.
- Persistent Campaign/Collection/meta progress survives Prestige by contract; reset implementation must preserve it.
- No mandatory ads, energy gates or arbitrary real-time waits.
- World/landmark/raid state is code-owned; generated art does not bake progression UI.
- Mobile default gameplay remains board-first.