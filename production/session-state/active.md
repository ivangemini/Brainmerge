# Active Session — Brainmerge

## Current objective
Brainmerge is in post-RC retention/meta development. The long-term product objective is the Brainverse Campaign supported by Collection Rewards and Prestige, while the validated T1-T18 merge-idle board remains the core gameplay loop.

## Current production baseline
- browser-first TypeScript runtime;
- 6x5 merge board;
- one sequential T1-T18 chain;
- passive income, Brain Box economy, Brain Lab, missions, offline reward, Collection, Rescue and `Next move`;
- save v5 with Yandex/local persistence;
- board-first mobile UI with Missions / Collection / Brain Lab sheets;
- unified T1-T18 character atlas;
- EN/RU core runtime parity;
- existing CI browser/motion/accessibility/Yandex gates.

## Campaign direction
Target full campaign: 8 worlds × 8 stages = 64 stages including one boss per world.

Campaign, Collection Rewards and Prestige are specified in `docs/CAMPAIGN_AND_META_PROGRESSION.md`. Stateful campaign/meta persistence will move the save contract to v6.

## Approved Campaign Art Pack
Approved and repository-ready:
- Campaign icon;
- Prestige icon;
- Brain Cell icon;
- Normal / Challenge / Elite / Boss / Locked stage nodes;
- World 1 Backyard Brainrot Zone environment + boss;
- World 2 Surreal Brainrot City environment + boss.

Campaign environment art is now locked to **toy-like Brainmerge rendering + environment-wide surreal viral brainrot logic**. Generic cute garden/city art with isolated meme decorations is not acceptable.

## Campaign Map visual shell
Implemented as a presentation-only layer before campaign save/state lands:
- prominent Campaign entry near the header;
- full-screen responsive map;
- World 1/2 switcher;
- code-positioned semantic stage nodes;
- approved world and boss art;
- separate EN/RU Campaign-shell locale resources;
- safe-area/back/Escape behavior;
- dedicated packaged Chromium screenshots on desktop and phone.

The visual shell intentionally does **not** mutate GameState, save campaign completion, start campaign runs or fake Prestige functionality.

## Next implementation sequence
1. Collection Rewards foundation.
2. Prestige + Brain Cells + save v6.
3. Stateful Campaign definitions / `CampaignRunState`.
4. Connect map node states to persistent campaign progress.
5. Implement World 1 stages + boss.
6. Implement World 2 stages + boss.
7. Playtest first T18 -> Prestige -> Campaign persistence loop.

## Source of truth
- `docs/ROADMAP.md`
- `docs/CAMPAIGN_AND_META_PROGRESSION.md`
- `docs/GAMEPLAY_AND_PROGRESSION.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BIBLE.md`
- `docs/ASSET_MANIFEST.md`
