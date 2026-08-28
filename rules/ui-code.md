# UI Code Rules

- UI displays state and dispatches intents; it does not directly own core game rules.
- All player-facing strings go through localization.
- Touch and mouse are mandatory. Keyboard support where useful. Gamepad optional unless a platform requirement is added later.
- Interactive targets must be touch-friendly and must not require hover.
- Critical states cannot rely on color alone.
- Non-essential animation must support reduced-motion behavior.
- Verify approved desktop/mobile viewport targets and pseudolocalized strings.
- Match approved Figma visual targets; do not replace production art with generic developer panels.