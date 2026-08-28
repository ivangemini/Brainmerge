# Gameplay Code Rules

- Keep merge/progression rules deterministic and separable from rendering/UI/platform code.
- Model board state explicitly; never infer critical state from DOM/visual positions.
- Same-family/tier merge eligibility and resulting tier/form must be defined by data/rules, not scattered conditionals.
- Full-board, no-valid-merge and spawn-failure states require explicit behavior.
- Preserve backward-compatible save loading or provide migrations for schema changes.
- Critical logic changes require focused tests.