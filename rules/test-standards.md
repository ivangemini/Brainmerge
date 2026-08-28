# Test Standards

- Tests should be deterministic and descriptive.
- Pure merge/progression/save logic should have unit coverage around invariants and edge cases.
- Meaningful gameplay/save/data bug fixes should receive a regression test when practical.
- Cosmetic-only fixes do not require artificial regression tests.
- Integration tests clean up state and avoid real external SDK/network dependencies.
- Platform adapters use mocks/fakes in automated tests.
- Visual/UI work also requires actual screenshot/interaction review; unit tests alone are insufficient.