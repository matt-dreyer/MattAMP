# AMP Artillery: field manual

[← Back to the README](../README.md) · [Setup and troubleshooting](guide.md)

## Pick a fight

Open **Game**. Enter up to three arcade initials, choose **3–5 bots**, select **Very dumb / Casual / Sharp / Human-ish**, and choose **Chaos**. The preview is the arena you'll get when you press **Start battle**.

It's untimed, last-tank-standing artillery. Craters persist, explosions cause splash damage, and tanks can take fall damage. Damage increases after round 12 to keep a battle moving. Bot aim is imperfect; higher skill improves the opposition without making every decision deterministic.

Each tank receives unlimited **Shells** and **three MIRVs**. A MIRV splits into five warheads at the top of its arc. Bot and player projectiles use the same physics.

## Aim and fire

| Input | Action |
| --- | --- |
| Left / Right arrow | Turn the barrel left / right |
| Up / Down arrow | Increase / decrease power |
| Enter | Fire |
| Click the sky | Aim toward that point |
| Wheel over Angle or Power, including its label | Adjust that value |
| Wheel over the battlefield | Adjust power |
| Shell / MIRV radio buttons | Select ammunition |
| Pause | Pause/resume the battle |
| Expand | Open the large, resizable game layout |
| Restore / Escape | Restore the widget; Escape dismisses an active victory ceremony first |

Narrow layouts wrap the controls as needed. Expanded mode keeps the title bar, source tabs, battlefield, and aiming controls available; scores and credits have their own scrolling area.

Radio or audio podcasts can continue. Game **Sound on/off** is independent. Switching tabs, opening Settings, hiding the app, or entering bug mode freezes the battle. YouTube pauses when hidden.

## Wind: sometimes a suggestion, sometimes a grudge

Each turn rolls new wind, which stays constant throughout that shot. Either direction is equally likely.

| Chance | Strength | Range |
| --- | --- | --- |
| 60% | Mild | 0–30 |
| 30% | Strong | 31–75 |
| 10% | Wild | 76–150 |

Wild gusts are highlighted in the wind readout. These are game-strength units, not mph. Even **Chaos Off** keeps the varied wind.

## Chaos arenas

**Mixed** is the default; your selection is remembered. Starting preserves the shown preview, and the next skirmish rolls a new arena.

| Mode | Terrain | Gravity / sides |
| --- | --- | --- |
| Off | Rolling hills | Normal gravity, open sides |
| Mixed | One of five styles | Changed gravity **or** special side walls |
| Unhinged | One of five styles | Changed gravity **and** special side walls |

Terrains: **rolling hills, deep valley, craggy peaks, plateaus, flatlands**.

Gravity: **Normal 1×**, **Moonshot 0.64×**, **Heavy 1.6×**.

Walls:

- **Open:** shots can leave the arena.
- **Ricochet:** solid amber sides reflect shells and MIRV fragments without adding energy.
- **Wraparound:** dashed lavender sides send projectiles through the opposite edge.

The ceiling stays open. Projectiles expire after 20 simulated seconds to prevent endless volleys. Terrain style, gravity, and wall rules stay fixed for a match, while wind changes every turn. Bots account for gravity and boundaries and consider indirect shots in special arenas.

## Bots remember

Within a battle, damage makes retaliation more attractive. Higher difficulties weigh it more strongly; Very dumb is more scatterbrained. Repeated hits increase the preference, but another target remains possible.

Across the **last three completed battles**, grudges fade with age. Winning at least two of those battles attracts extra attention. This applies to bots as well as you—being human isn't the reason everyone shoots at you. Rivalries save with local records; abandoned matches don't count.

Heckles acknowledge revenge, leaders, kills, embarrassing misses, and self-inflicted damage. They contain sarcastic profanity. The cartoon bubbles are not a family-friendly commentary track.

If you're knocked out early, stay for the carnage: surviving bots keep fighting on the battlefield, with shots, explosions, and heckles intact. Aiming controls disappear while you spectate; Pause and Sound still work. The final result and replay option appear when one tank remains (or nobody survives), and the actual winner carries their reputation into the next battle.

## Scores and another round

Completed matches save automatically. Once saving finishes, click the battlefield for another skirmish, or focus it with Tab and press Enter/Space. Disk failures show a retry control. Leaving an unfinished match records no result.

The local table keeps the **top ten**, initials, difficulty, bot count, result, and arena conditions, plus lifetime wins/completed battles. Rivalries persist too.

Score before difficulty/bot-count multipliers:

- **10 points** per point of enemy damage.
- **250 points** per knockout.
- On a win, **1,000 points + 5 per remaining HP**.

The table mixes Chaos modes and labels the conditions; Chaos doesn't add a separate multiplier. Older records load as Off / rolling hills / normal gravity / open edges. This is a personal arcade table, not an online competitive leaderboard or anti-cheat system.

Records live in `~/.config/workstation-deck/arcade-scores.json`, using atomic writes and duplicate-save protection.

## The disproportionate victory ceremony

The surviving tank gets a three-second side-to-side shuffle, hop, and wobble—bots included. It is purely visual and never changes the final score or tank position. Reduced motion skips the dance; leaving the game or starting another skirmish cancels it.

After the dance, a human victory launches nine seconds of a gold 3D tank, moving camera, lighting, 2,400 confetti pieces, and a synthesized fanfare. **Back to scores** or **Escape** skips it. Game sound off mutes the fanfare while radio continues.

Leaving the game releases the scene. Reduced motion freezes it; unavailable WebGL falls back to a static message. Score saving doesn't depend on the celebration succeeding.

## Credits

The game draws inspiration from Scorched Earth. Its retro tank/explosion sprites and effects come from Metal Slug and Worms 2, with Kenney fallback assets. Their licenses differ; the retro material is not CC0. The procedural 3D celebration uses Three.js, the bundled Cormorant Garamond font, and an original synthesized fanfare.

See [full asset credits](../assets/arcade/README.md) and the [source manifest](../assets/arcade/sources.json).
