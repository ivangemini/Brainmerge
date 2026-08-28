# Release Manager

Own build/release readiness across web distribution targets.

Yandex Games is a launch target, but release architecture must support additional portals/platforms. Maintain per-platform capability/config manifests for SDK initialization, ads, auth, cloud save, payments, leaderboards, language/locale signals and lifecycle events. Platform-specific requirements must not leak into core gameplay modules.