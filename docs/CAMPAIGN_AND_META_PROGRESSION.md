# Brainmerge — Campaign and Meta Progression

## Product north star
Brainmerge is no longer designed as a merge chain that simply ends when the player reaches T18. The long-term objective is to **complete the Brainverse Campaign** while improving a permanent account-level meta through Collection Rewards and Prestige.

The systems are intentionally layered:

`merge board -> T1-T18 progression -> Collection -> Prestige -> Campaign progression -> harder worlds`

The core board remains the moment-to-moment game. Campaign, Collection Rewards and Prestige provide reasons to keep playing after the first chain completion.

## Campaign structure
Target launch structure for the complete campaign:

- 8 worlds;
- 8 stages per world;
- 64 stages total;
- the eighth stage of every world is a boss stage;
- campaign progress survives Prestige;
- worlds unlock sequentially, with later worlds allowed to require Prestige milestones in addition to the previous boss clear.

Working world themes are provisional until their visual package is approved:

1. Backyard / Meme Yard
2. Brainrot City
3. Meme Factory
4. Italian Chaos
5. Sky Kingdom
6. Neon Brain Lab
7. Space Brainrot
8. Brainverse Core

World names are player-facing content and must not be baked into generated art.

## Stage model
Campaign stages reuse the real 6x5 merge rules instead of introducing a separate combat game.

Supported stage objectives should be data-driven primitives:

- reach a target tier;
- complete N merges;
- earn N coins inside the stage;
- open at most / exactly N Brain Boxes;
- limited-move challenge;
- target order: create a requested set of tiers;
- crowded-board puzzle with a deterministic starting layout;
- no-Box puzzle using only the supplied starting board;
- timed challenge after the untimed framework is stable;
- boss objective set.

A stage definition owns its starting board, allowed actions, primary objective, optional mastery conditions and reward table. New stages should be content/configuration, not bespoke gameplay branches.

## Campaign run isolation
Campaign must not destroy or silently rewrite the player's main idle board.

Architecture target:

- `GameState` continues to own the persistent main merge/economy state;
- permanent campaign progress is stored separately inside the versioned save;
- an active `CampaignRunState` owns the temporary stage board/counters/rules;
- entering a stage snapshots/pauses the main board presentation rather than converting it into campaign state;
- leaving/restarting a stage cannot spend or mutate main-board units unless the stage reward is explicitly committed;
- passive main-board economy behavior during a campaign run must be deterministic and decided in core logic, not in UI code.

For the first implementation, campaign stages may restart on explicit abandon, but completion progress and earned rewards must persist safely.

## Stage stars / mastery
Each stage supports up to three stars:

- 1 star — complete the primary objective;
- 2 stars — complete one efficiency/mastery condition;
- 3 stars — complete the highest mastery condition.

Stars are permanent campaign completion data and provide replay value without requiring new character tiers. A world boss clear unlocks the next world; star thresholds may unlock bonus rewards, but ordinary world progression must not require perfect 3-star clears.

## Boss stages
Bosses are a presentation and objective layer on top of the merge board, not a separate battle engine.

Boss stage contract:

- a large boss render is presented above/behind the campaign board without covering hit targets;
- boss HP/progress is code-owned;
- ordinary merges can charge baseline boss progress;
- requested target orders produce larger progress hits;
- boss stages may rotate objective cards such as `Create T4`, `Create T6`, `Complete 8 merges`;
- the player wins by completing the configured boss progress requirement;
- no real-world weapons, gore or combat simulation is needed; the tone remains playful and toy-like.

Boss completion grants a meaningful world-completion reward and unlocks the next map segment.

## Collection Rewards
Collection is becoming a permanent progression system rather than an informational gallery.

Initial normal-collection milestones:

- 5 / 18 discovered;
- 10 / 18 discovered;
- 15 / 18 discovered;
- 18 / 18 discovered.

Each milestone is claimable once and persists across Prestige. Reward categories may include:

- permanent global income modifier;
- permanent Brain Box discount;
- permanent offline-cap bonus;
- Brain Cell reward;
- campaign reward modifier or cosmetic unlock.

Exact percentages/cost impact are **balance data, not locked art direction**. They must be simulation-tested before implementation is considered complete.

The existing Collection panel should gain a `Rewards` section/tab rather than a new top-level mobile dock button.

## Prestige / Brain Reset
Prestige is now an approved core meta system.

### Unlock
The first Prestige becomes available after the player reaches T18. This makes first T18 completion a meaningful milestone instead of an endpoint.

### Reset scope
Prestige is expected to reset run-level economy:

- main board units;
- coins;
- paid Brain Box inflation counter;
- run-level Brain Lab upgrade levels;
- fractional/pending run income state as required for deterministic accounting.

Prestige must preserve permanent account progress:

- lifetime Collection discovery;
- Collection Rewards already claimed;
- campaign stage/stars/world progress;
- Prestige count;
- Brain Cells and permanent Prestige upgrades;
- localization/settings and platform-safe account data.

First-cycle onboarding/mission-history semantics must not be accidentally replayed or corrupted. If later Prestige-cycle missions are desired, they must be a separate system rather than reusing old save-v5 mission indices ambiguously.

### Brain Cells
Prestige introduces **Brain Cells** as a dedicated permanent meta currency. This is an explicit exception to the previous one-currency rule: coins remain the only spend currency in the ordinary merge economy, while Brain Cells are used only for permanent Prestige/meta upgrades.

The first T18 Prestige must always award at least one Brain Cell. The final reward curve remains data-driven and must be modeled before shipping.

Initial permanent-upgrade categories may include:

- permanent income bonus;
- permanent Brain Box cost reduction;
- starting-coin / early-run acceleration;
- permanent offline-cap extension;
- campaign boss/progress bonus.

Do not let permanent upgrades bypass merge-first discovery on a fresh account or directly spawn an unseen character tier.

## Campaign ↔ Prestige relationship
Campaign gives Prestige a purpose and Prestige gives the campaign a long-term power curve.

Recommended gating:

- Worlds 1-2 are available without Prestige;
- World 3+ may introduce the first Prestige requirement;
- later worlds may require a combination of prior boss completion and account-level Prestige progress;
- no world should require an arbitrary real-time wait or mandatory rewarded ad.

Exact gates belong in data and are tuned from playtests; the architecture must support them without hardcoded world-specific branches.

## Rare / Shiny compatibility
Rare/Shiny remains a compatible later retention layer, but it is not required to build the first campaign milestone.

If added:

- rarity is orthogonal to tier;
- Collection can track normal/rare completion separately;
- rarity rendering should reuse the existing T1-T18 atlas plus reusable effects/frames rather than requiring 18 duplicate character renders;
- Prestige and campaign saves must preserve rarity collection data.

## UX/navigation
The campaign is a primary destination, not another long card below the board.

Target navigation principles:

- mobile default remains board-first;
- Missions / Collection / Brain Lab stay in the existing bottom dock;
- Campaign gets a prominent map/goal entry point near the main progression/header layer or another equally visible top-level CTA, not a fourth cramped dock item by default;
- Prestige appears only when eligible and must clearly preview `reset` versus `kept` state before confirmation;
- Collection Rewards live inside Collection;
- all campaign/prestige modal surfaces must preserve safe-area, keyboard/focus and reduced-motion contracts.

## Save/versioning target
Campaign + Collection Rewards + Prestige require a new versioned save schema. The next implementation should move from v5 to **v6** in one coherent migration rather than landing partially versioned fields.

Planned persistent categories:

- collection reward claim state;
- prestige count;
- Brain Cell balance;
- permanent prestige-upgrade levels;
- campaign world/stage completion;
- campaign star totals;
- optional active campaign-run snapshot if resume is supported.

Migration from v1-v5 must preserve every currently valid board/economy/discovery value and initialize new meta fields deterministically.

## Validation requirements
New automated coverage must include:

- v5 -> v6 migration and corrupted meta-state sanitization;
- collection reward one-time claiming/no double claim;
- Prestige eligibility, exact reset scope and exact preserve scope;
- Brain Cell award/spend invariants;
- campaign stage isolation from the main board;
- deterministic stage objectives and rewards;
- boss completion and world unlocks;
- campaign progress surviving Prestige;
- EN/RU parity for all new player-facing content;
- mobile/desktop campaign and Prestige geometry;
- touch/mouse/keyboard campaign interactions;
- no mandatory ad dependency.

## Delivery strategy
Do not build all 64 levels before proving the framework.

1. Collection Rewards foundation.
2. Prestige + save v6.
3. Campaign framework + map/navigation.
4. World 1 with 7 stages + boss.
5. World 2 with 7 stages + boss.
6. Validate pacing/replay/Prestige interaction.
7. Expand the same data-driven framework to Worlds 3-8.

The first campaign milestone is successful when two complete worlds can be played end-to-end using production UI/art, save safely, survive Prestige correctly and add new stages primarily through data.