# MattAMP

A local Linux desktop player and workstation monitor, built for Matt’s 49-inch OLED. Eight DI.FM presets, five podcast favorites, live network/CPU/memory readings, and both NVIDIA GPUs in one muted desktop widget.

## Open it

Launch **MattAMP** from the application menu, or run `~/.local/bin/mattamp`. The original `workstation-deck` command remains an alias-compatible entry point.

- **DI.FM / Podcasts** switches the one active playback source.
- **Podcasts → Player** switches between a visible YouTube player and the show’s audio RSS feed. YouTube lists full podcast episodes, excluding the general Shorts/upload feed; audio feeds list podcast episodes.
- The column button switches **Sidecar / stacked** layouts. The panel button toggles **compact** view.
- The audio-lines button collapses MattAMP to a **56 × 56 bug**. Drag it to move; click to restore. Radio and audio podcasts continue. YouTube pauses when hidden, including Bug mode, Settings, and the tray.
- Drag the title bar to move the full window. The minus button hides it to the tray; **X quits MattAMP**. The tray menu restores, pauses, or quits it.
- **Details** reveals memory/VRAM/temperature readings. The network status expands router and internet probe details.

## DI.FM Premium setup

Open MattAMP **Settings → DI.FM settings**, find your **Premium Player Settings / listen key**, and paste only the key into MattAMP. Save it, close Settings, then choose a station.

MattAMP encrypts the key using Electron’s safeStorage backed by GNOME Keyring on this workstation. If a protected keyring is unavailable, the key stays in memory for the current session. The app never falls back to storing a plaintext key. **Forget key** removes the saved key and stops playback.

Official DI.FM channel artwork loads from AudioAddict’s channel catalog and image CDN, with a larger current-station cover and small preset thumbnails. Metadata is cached for a day within the running app; unavailable artwork falls back to text. The provider’s images are not bundled in this repository.

Station presets: Future Synthpop, Classic Trance, Deep House, Synthwave, Progressive, Liquid DnB, Chillout, PsyChill. Playback uses DI.FM’s Premium external-player playlists; a valid subscription and listen key are required.

## Podcasts

Favorites: Last Week in AI, AI for Humans, All-In, Dwarkesh Podcast, The a16z Show.

The YouTube player uses a responsive 16:9 viewport and native controls. Four shows use their dedicated full-episode playlists; AI for Humans matches non-Short uploads to its podcast RSS titles to exclude standalone videos and clips. Feed failures do not fall back to unfiltered uploads. The default playback speed is 1×; a speed you choose manually is remembered. Click its Play button when the browser requires a user gesture. Individual uploads may disallow embeds or require a YouTube login; use **YouTube** to open the episode externally, or select **Audio feed**. YouTube and RSS editions are separate feeds, so their episode selection and resume positions are separate too. No YouTube account is required by MattAMP itself.

Audio controls include play/pause, stop, volume/mute, seek, 15-second rewind, 30-second forward, and playback speed. Positions and preferences save locally. Nothing autoplays at launch. A custom YouTube URL can be loaded from Settings.

## Local data and monitoring

MattAMP keeps its original internal app ID and storage paths so the rename preserves your dock pin, settings, and saved listen key.

Preferences and encrypted key: `~/.config/workstation-deck/state.json` (mode 0600). Chromium media/cache data is also in this app’s config directory. Test runs use separate temporary profiles and never touch the saved listen key.

CPU/RAM/network counters come from Linux and update every two seconds. GPU utilization, VRAM and temperature come from `nvidia-smi`. Traffic measures the default-route interface in Mbps. Every ten seconds, reachability checks the router and public internet endpoints; ICMP failure falls back to an HTTPS connectivity check. “No ping response” alone does not prove the router is down. Missing sensors are shown as unavailable, never as fabricated zero readings.

A loopback-only HTTP server supplies the UI, YouTube embed origin, and a radio relay using opaque, revocable URLs. DI.FM external-player streams include HTTP-only endpoints; the relay preserves the provider’s protocol while keeping the listen key out of the renderer. It exposes no telemetry, credentials, or control API over HTTP. Privileged calls use a sandboxed, isolated Electron preload bridge. Remote content cannot invoke that bridge. No hosted backend, recurring service fee, or API key is needed for podcasts and metrics.

## Develop / reinstall

Requires Linux, Node/npm, a graphical desktop, `ping`, and NVIDIA drivers/`nvidia-smi` for GPU readings. GNOME Keyring/libsecret supplies protected secret persistence.

```sh
npm ci
npm run check
npm test
bash scripts/install.sh
npm start
```

`node scripts/smoke.cjs` runs a live Electron smoke test against this workstation and public podcast services. It expects both RTX cards and internet access, plays muted test media, opens temporary windows, and writes screenshots under ignored `test-results/`. External provider availability can affect it.

The launcher uses this checkout and its pinned Electron installation. Keep this directory in place. There is no auto-updater or login autostart. To upgrade dependencies, update the lockfile deliberately and rerun checks.

To remove the launcher, delete only `~/.local/bin/mattamp`, `~/.local/bin/workstation-deck`, `~/.local/share/applications/ai.fshbwl.deck.desktop`, and `~/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png`. Preferences can be retained for reinstall; deleting the app’s config directory removes those too. Other desktop monitors are independent.

## Provider references

- [DI.FM Premium and external players](https://www.di.fm/premium)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube embedded-player identification requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)
