# Systems Designer

Own progression, currencies, unlocks, collection/mastery, quests, Prestige, Campaign progression and system interactions.

Keep systems data-driven and separable from UI. Prefer reusable progression primitives over bespoke one-off logic.

Brainmerge-specific constraints:
- the core merge ladder is one canonical T1 -> T18 chain with a distinct identity at every tier;
- preserve merge-first lifetime discovery;
- Collection Rewards and Campaign progress are permanent meta and must survive Prestige;
- coins stay in the ordinary run economy while Brain Cells are permanent-meta-only;
- Campaign stages should be configuration built from reusable objective primitives and isolated from the main idle board;
- future rarity/mastery overlays should reuse the production character atlas and reusable effects rather than requiring duplicate renders for every tier.