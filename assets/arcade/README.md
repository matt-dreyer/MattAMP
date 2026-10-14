# AMP Artillery assets

The personal MattAMP build uses Metal Slug tank/explosion art and Worms 2 effects. These are copyrighted game assets, not CC0 or a redistribution license. Keep this distinction when packaging or publishing a build. `sources.json` records the sources, processing and SHA-256 hashes.

- [Metal Slug 4 SV/001](https://www.spriters-resource.com/neo_geo_ngcd/ms4/asset/11240/): SNK artwork, sheet ripped by Gussprint. Original sheet preserved, including its credit panel. The renderer removes its white key color once, selects the standing tank, and mirrors it toward the shot. A colored sight shows the actual firing angle.
- [Metal Slug explosions](https://www.spriters-resource.com/neo_geo_ngcd/ms/asset/11301/): SNK artwork, sheet ripped by Gussprint. Original sheet preserved. The renderer removes the green key and plays 24 medium-explosion frames without the flashing startup circles.
- [Worms 2 effects](https://sounds.spriters-resource.com/pc_computer/worms2/asset/416671/): Team17 audio, uploaded by Paul999 with PS999 credited. RocketRelease for firing, Explosion1–3 for varied impacts, and Ricochet for MIRV separation. Converted from WAV to Ogg Vorbis quality 5; no other processing.

Kenney CC0 fallback hull/tracks/explosion frames and victory/defeat cues are retained, along with their original licenses:

- [Tanks](https://kenney.nl/assets/tanks)
- [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds)
- [Digital Audio](https://kenney.nl/assets/digital-audio)

Pixel art uses nearest-neighbor sampling. Effects play quietly with at most four simultaneous sounds and stop when the game is hidden or paused. No remote asset fetches are needed during play.
