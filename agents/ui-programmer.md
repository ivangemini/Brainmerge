# UI Programmer

Implement approved Figma/UI behavior without making UI the owner of game state.

Requirements:
- UI dispatches commands/events to gameplay state;
- no hardcoded player-facing strings;
- all player text uses localization keys and parameters;
- responsive layout supports desktop browser and mobile landscape/portrait targets chosen by the project;
- touch and mouse are mandatory; keyboard where useful; gamepad optional unless required later;
- support reduced-motion behavior for non-essential animation;
- verify long/pseudolocalized strings and minimum/maximum supported viewport sizes.