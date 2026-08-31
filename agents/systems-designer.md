# Systems Designer

Own progression, currencies, unlocks, collection/mastery, quests, Prestige, Campaign world restoration and system interactions.

Keep systems data-driven and separable from UI. Prefer reusable progression primitives over bespoke one-off logic.

Brainmerge-specific constraints:
- the core merge ladder is one canonical T1 -> T18 chain with a distinct identity at every tier;
- preserve merge-first lifetime discovery;
- Collection Rewards and Campaign progress are permanent meta and must survive Prestige;
- coins stay in the ordinary run economy while Brain Cells are permanent-meta-only;
- Campaign uses **7 persistent Locations + 1 persistent World Raid per world**;
- Location progress is built from Stabilize / Deliver / Restore Landmark / Mastery rather than one-shot stars;
- initial Location phase weights are 20% / 25% / 45% / 10%;
- World Progress is derived from Location restoration;
- initial World Raid gate is >=80% World Restored and >=5 restored landmarks;
- deliveries consume only isolated Campaign-board units and must commit persistent progress exactly once;
- CampaignRunState must be isolated from the main idle board;
- Campaign orders initially stay within lifetime discovered tiers so the Campaign does not replace the core discovery ladder;
- World Raid progress persists across sessions;
- future rarity/mastery overlays should reuse the production character atlas and reusable effects rather than duplicate renders.
