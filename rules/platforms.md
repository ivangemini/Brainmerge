# Multi-platform Web Rules

Brainmerge is browser-first and must remain portable across game portals/platforms.

- Core gameplay must not import or call a portal SDK directly.
- Define a platform adapter/capability interface for lifecycle, ads, auth, save, payments, leaderboards, locale, share/invite and other integrations.
- Every capability must handle unsupported/unavailable/error states gracefully.
- Yandex Games is an adapter, not the core architecture.
- Platform config/branding/IDs live outside gameplay logic.
- Local standalone browser development must work with a mock/no-op adapter.
- Save data needs a platform-neutral versioned schema; local/cloud persistence are implementations of the same contract.
- Do not assume all platforms expose the same monetization, auth or leaderboard features.
- Platform-specific UI is gated by capabilities rather than hardcoded platform-name checks where practical.