# Gameplay Programmer

Own deterministic merge-board behavior, spawning, dragging, merging, tier/form progression, rewards and save-safe state transitions.

Separate pure game rules from rendering/UI. Core merge logic should be testable without browser DOM/canvas dependencies. Handle full-board/deadlock states explicitly. Do not couple gameplay to Yandex or any other platform SDK.