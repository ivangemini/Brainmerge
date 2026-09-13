# Brainmerge State Gap Analysis

## Сравниваемые state-модели

- Historical max: `02e38af83611eeb6b5e94eea90c1049bb84d878c` (также `e195b42b` и `1ef9c70d`).
- Canonical base: `9536cfc6b3f8be2529519e1a9bd4e30d1aa2abb2`.

## Реальные gaps в canonical HEAD

| Gap | Historical evidence | Current evidence | Решение |
| --- | --- | --- | --- |
| Clicker activity counter | `src/core/types.ts`: `clicks`; `src/core/game.ts`: `tapUnit` | В `GameState`, `game.ts`, `main.ts` и UI отсутствуют click state/action | Восстановить как additive save-v10-compatible field и typed action |
| Clicker payout | Historical `tapRewardForTier`, `clickCritChanceForLevel`, coin-boost aware critical payout | Нет tap function и click reward catalog functions | Перенести минимальные pure catalog/game functions, сохранив current ad boost and state model |
| Brain Lab click upgrades | Historical `clickPower`/`clickCrit`, bounded costs and localized effects | Current `UpgradeLevels` and `UPGRADE_DEFINITIONS` содержат только 4 upgrades | Добавить две upgrades в current catalog; не менять существующие costs/architecture |
| Click missions | Historical `MissionKind: clicks`, `click-25`, `click-100` | Current MissionKind только merges/discover/spawns | Добавить click kind and post-existing-track missions, чтобы не перенумеровывать current save mission indexes |

## Не gaps (намеренно не переносить)

- `world1-campaign-run.ts`, `campaign-run-world1-ui.js`, `collection-rewards.ts`, `prestige.ts`: current typed unified modules preserve the relevant Campaign/Collection/Prestige behavior and add save-v10/raid isolation. Old split modules would regress architecture.
- Historical 7 World 1/7 World 2 location definitions and raid phases: configuration and behavior are present in current `campaign-run.ts` and `campaign-raid.ts`; no missing production location was found.
- Historical standalone character renders and `offline-brain-box.png`: `docs/ART_BIBLE.md` and `docs/ASSET_MANIFEST.md` require one physical 6x3 `character-atlas.webp`; old assets conflict with that contract and are not better evidence of current runtime quality.
- Historical extra smoke scripts: current combined smoke scripts cover the same current architecture; old scripts import removed split modules and cannot be copied unchanged.
- Historical save v6: current v10 migration, revisions, retention, cloud/Yandex reconciliation and typed raid fields are strictly newer. Do not downgrade or replace them.

## Dependency chain for the selective recovery

1. Extend `types.ts` (`MissionKind`, `UpgradeId`, `UpgradeLevels`, `GameState.clicks`, `TapResult`).
2. Extend `catalog.ts` with click constants, two upgrade definitions, and click missions while keeping the first eight mission IDs stable.
3. Extend `game.ts` defaults/sanitization, `tapUnit`, click mission accounting and click upgrade effects. Existing save versions migrate with zero clicks/levels.
4. Add EN/RU keys and a touch/mouse-accessible clicker button in the existing spawn dock; wire through `main.ts` and current analytics/audio feedback boundaries.
5. Add deterministic tests for payout, criticals, save migration, click missions and localization parity; run build, unit tests and relevant smokes.

## Canonical final state after recovery

Canonical remains `9536cfc6` architecture plus the additive clicker slice. No historical branch is merged, no refs are deleted, and no old split Campaign or atlas implementation is restored.
