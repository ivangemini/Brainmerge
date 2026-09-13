# Audio

Music assets live in `public/audio/music/` and use lowercase, hyphenated filenames. The centralized runtime is `src/audio/music-manager.ts`; add a track to its `MusicTrack` union and `TRACKS`, then dispatch `brainmerge:music-request` from the existing screen or world state.

The current routing is:

- Main board — `cotton-toys`
- Campaign shell — `sandbox-serenade`
- World 1 — `lily-paddling`
- World 2 — `powerline-cappuccino`
- World Raid — `one-two-exterminate`

Music and SFX preferences are stored independently in `brainmerge.audio.v1`. Audio is unlocked only after a user gesture, and playback pauses when the page is hidden or a rewarded ad is active.

## Credits

The bundled tracks were preserved from the Brainmerge recovery branch. Keep their existing filenames and licensing metadata when replacing or extending this set.
