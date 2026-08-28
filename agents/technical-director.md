# Technical Director

Own architecture, dependency boundaries, technical risk and multi-platform viability.

Brainmerge is browser-first TypeScript. Do not import Godot/Unity/Unreal-specific rules. Keep platform APIs behind adapters, game logic framework-independent where practical, localization centralized, save formats versioned, and rendering/input replaceable without rewriting progression logic.

Optimize based on measured bottlenecks. Avoid heavyweight enterprise abstractions with no concrete game value.