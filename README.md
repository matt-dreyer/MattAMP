# MattAMP

A local Linux desktop player and workstation monitor, built for Matt’s 49-inch OLED. Eight DI.FM presets, five podcast favorites, live network/CPU/memory readings, and both NVIDIA GPUs in one muted desktop widget.

## Open it

Launch **MattAMP** from the application menu, or run `~/.local/bin/mattamp`. The original `workstation-deck` command remains an alias-compatible entry point.

- **X / Twitter**, beside **Podcasts**, opens the X feed. The content buttons remain visible so you can return directly to DI.FM or Podcasts.
- **DI.FM / Podcasts** switches the one active playback source.
- **Podcasts → Player** switches between a visible YouTube player and the show’s audio RSS feed. YouTube lists full podcast episodes, excluding the general Shorts/upload feed; audio feeds list podcast episodes.
- The column button switches **Sidecar / stacked** layouts. The panel button toggles **compact** view.
- The audio-lines button collapses MattAMP to a **56 × 56 bug**. Drag it to move; click to restore. Radio and audio podcasts continue. YouTube pauses when hidden, including Bug mode, Settings, and the tray.
- Drag the title bar to move the full window. The minus button hides it to the tray; **X quits MattAMP**. The tray menu restores, pauses, or quits it.
- **Details** reveals memory/VRAM/temperature readings. The network status expands router and internet probe details.
- **Dark glass controls** let the live background show through station presets, playback controls, source tabs and selects, with mint selection, subtle hover highlights and opaque labels. Reduced-transparency preferences use solid fills.
- **Settings → Live background** selects **Particle flow** (default), **Water waves**, **Starfield**, **Mandelbrot zoom**, or **Off**. The choice is remembered locally. Slow, dim blue-green motion appears inside MattAMP and leaves controls clickable. Animation stops and clears when Off, in Bug mode, hidden in the tray, or when reduced motion is enabled. The radio station card is translucent so the selected effect shows through behind its text and artwork. Flow and Starfield use denser fields of dim particles; Waves adds closely spaced lines. Starfield keeps its slow depth-based drift and gentle shimmer. Mandelbrot explores six detailed regions using randomized horizontal/vertical glides, curved approaches and slow rotating spirals. Each 2½–3½-minute pass varies its direction and depth, then smoothly returns to the wide view before the next destination. The same area or route never repeats back-to-back. Mouse parallax still works, and the palette stays dim blue-green. Its GPU renderer is capped at 18 fps and 640 pixels on the longest edge; systems without WebGL show a quiet static fractal instead. X and video retain their own backgrounds.
  Ambient effects respond gently to the mouse over MattAMP: particle flow bends around the pointer, waves form local ripples, stars shift with depth, and Mandelbrot pans slightly. Responses ease in and out, leave clicks and scrolling to the existing controls, and stop with the background under Off, hidden, Bug mode or reduced motion. Embedded provider surfaces retain their own mouse handling.

## DI.FM Premium setup

Open MattAMP **Settings → DI.FM settings**, find your **Premium Player Settings / listen key**, and paste only the key into MattAMP. Save it, close Settings, then choose a station.

MattAMP encrypts the key using Electron’s safeStorage backed by GNOME Keyring on this workstation. If a protected keyring is unavailable, the key stays in memory for the current session. The app never falls back to storing a plaintext key. **Forget key** removes the saved key and stops playback.

Official DI.FM channel artwork loads from AudioAddict’s channel catalog and image CDN, with a larger current-station cover and small preset thumbnails. Metadata is cached for a day within the running app; unavailable artwork falls back to text. The provider’s images are not bundled in this repository.

Station presets: Future Synthpop, Classic Trance, Deep House, Synthwave, Progressive, Liquid DnB, Chillout, PsyChill. Playback uses DI.FM’s Premium external-player playlists; a valid subscription and listen key are required.

## Podcasts

Favorites: Last Week in AI, AI for Humans, All-In, Dwarkesh Podcast, The a16z Show.

The YouTube player uses a responsive 16:9 viewport and native controls. Four shows use their dedicated full-episode playlists; AI for Humans matches non-Short uploads to its podcast RSS titles to exclude standalone videos and clips. If YouTube’s playlist RSS endpoint fails, MattAMP reads the same playlist’s public page metadata instead, excluding Shorts, unknown-duration entries and videos outside that playlist. AI for Humans still requires podcast-title matching. Feed failures do not fall back to unfiltered uploads. The default playback speed is 1×; a speed you choose manually is remembered. Click its Play button when the browser requires a user gesture. Individual uploads may disallow embeds or require a YouTube login; use **YouTube** to open the episode externally, or select **Audio feed**. YouTube and RSS editions are separate feeds, so their episode selection and resume positions are separate too. No YouTube account is required by MattAMP itself.

Audio controls include play/pause, stop, volume/mute, seek, 15-second rewind, 30-second forward, and playback speed. Positions and preferences save locally. Radio and podcasts wait for Play. The classic Winamp intro plays once per app launch at your saved volume; starting playback or pressing Stop/Pause cuts it short. Restoring the window or launching a second instance does not replay it. A custom YouTube URL can be loaded from Settings.

## X feed

Click **X / Twitter** beside **Podcasts**. **AI circle** uses X’s official Latest search, limited to `@bcherny`, `@steipete`, `@karpathy`, `@simonw`, and `@chamath`, plus AI-related keywords. Replies and reposts are excluded by the search query. **For giggles** is a separate Elon Musk lane, so high post volume cannot flood the AI circle. Filters edits the account list (up to 12 handles) and AI-topic restriction. Search matching and result availability are controlled by X; keyword filtering can miss relevant posts that do not mention those terms. This is a filtered X page, not a custom ranked feed, and navigating inside X can leave the filter; click AI circle to return.

Sign in directly on X’s own page with your usual account, then click AI circle. X’s login form may use its own light theme. The session is remembered only in MattAMP’s isolated `persist:mattamp-x` Chromium partition; the app does not import browser cookies, collect your password, or require an X API key. Settings → Forget X sign-in clears this local session. **Browser** opens the same filtered search in your default browser using that browser’s existing login (it does not transfer the session back into MattAMP). Google/Apple sign-in attempts open a fresh filtered X page in your browser; choose the provider again there so the entire login stays in one browser session. MattAMP does not forward the in-app provider callback to Chrome: that callback belongs to the in-app X session and cannot reconnect from another browser. For the embedded pane, use direct X sign-in with an authentication method supported by its Chromium view.

The embedded reader hides X’s desktop navigation rail and trends column, giving the timeline the full pane width. Direct sign-in returning to Home automatically resumes the selected author filter. Login dialogs retain X’s layout.

X runs in a sandboxed WebContentsView without Node or MattAMP’s preload bridge. Remote content cannot access app IPC or the DI.FM key; camera, microphone, notifications and downloads are denied. X media stays muted so radio/audio podcasts can continue; switching to X pauses YouTube. The X pane hides in compact/bug modes and while Settings is open. Loading X does not automatically follow anyone, publish posts, or create lists. Direct sign-in with an X backup code and an authenticated embedded timeline have been confirmed by the user. Google/Apple browser sign-in still does not transfer into the embedded session.

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

On Ubuntu with restricted unprivileged user namespaces, run `bash scripts/install-sandbox-profile.sh` once after installation. It uses the desktop administrator prompt to install `/etc/apparmor.d/mattamp`, scoped to this checkout’s Electron executable, with the `userns` permission Electron needs to build its sandbox. It does not disable sandboxing or change system-wide namespace restrictions. Rerun it if the install path changes. This fixes dock launches that abort with the “SUID sandbox helper … not configured correctly” error. The launcher invokes the bundled Electron executable directly, without relying on an interactive shell’s Node setup.

The launcher uses this checkout and its pinned Electron installation. Keep this directory in place. There is no auto-updater or login autostart. To upgrade dependencies, update the lockfile deliberately and rerun checks.

To remove the launcher, delete only `~/.local/bin/mattamp`, `~/.local/bin/workstation-deck`, `~/.local/share/applications/ai.fshbwl.deck.desktop`, and `~/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png`. Preferences can be retained for reinstall; deleting the app’s config directory removes those too. Other desktop monitors are independent.

## Startup sound

`assets/startup.mp3` is the original DJ Mike Llama “Llama Whippin’ Intro” (Winamp 2.91), preserved in [Webamp’s example](https://github.com/captbaritone/webamp/blob/master/examples/minimal/index.html). Source: [pinned audio asset](https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3). Winamp and the sample audio belong to their respective rights holders; the clip is not covered by Webamp’s code license. Bundled for this personal desktop app so startup works offline.

## Provider references

- [DI.FM Premium and external players](https://www.di.fm/premium)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube embedded-player identification requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)

## AMP Artillery

Open **Game** for an untimed skirmish against 3–5 bots. Enter up to three arcade initials, select Very dumb / Casual / Sharp / Human-ish, and start. Click the sky or adjust Angle, set Power, and Fire. Every tank gets unlimited shells and three MIRVs, which split into five warheads at the top of the arc. Craters, splash damage and falls persist through the battle. Wind changes each turn; damage increases after round 12. Bots use imperfect aim and choose among all opponents.

Radio/audio can keep playing. Switching away, opening Settings, hiding the app or entering Bug mode freezes the game. YouTube pauses when hidden. **Sound on/off** controls the game effects independently. Leaving an unfinished match earns no record; completed results save automatically with a retry button if disk access fails.

Local records live in `arcade-scores.json` in Electron’s `workstation-deck` user-data directory (normally `~/.config/workstation-deck/` on Linux). It keeps the top ten, initials, skill, bot count, result and lifetime wins/completed battles. Scoring: 10 per enemy damage + 250 per knockout + a win bonus of 1,000 + 5 per remaining HP, multiplied by difficulty and bot count. Records use atomic writes and duplicate-save protection; they are personal scores, not an online anti-cheat system.

Metal Slug sprites, Worms 2 effects, and Kenney fallbacks are in `assets/arcade/` with per-source provenance. The retro game assets retain their original copyrights; the Kenney CC0 license does not cover them. `npm test` covers game physics, MIRVs, damage, turn order and records; `npm run test:arcade` runs the isolated Electron integration check without using the real radio key or X session.

### Artillery victory lap

Wins trigger a nine-second GPU-rendered gold tank ceremony with 2,400 tumbling confetti pieces, a moving camera, lights and a synthesized fanfare. **Back to scores** or **Escape** skips it. Game Sound off mutes the fanfare; radio keeps playing. Leaving the game stops and releases the scene. Reduced motion freezes the 3D scene, and WebGL failure leaves a static victory message. Score saving runs independently. Tank heckles include sarcastic profanity for kills, awful misses and self damage.

`npm run test:victory` exercises real WebGL rendering, wide/narrow layouts, win-only activation, dismissal, timed cleanup, reduced motion, context loss, sound cleanup and radio/score continuity in an isolated Electron profile.

### Aim, rivalries and a bigger battlefield

- **Left/Right** turns the barrel left/right; **Up/Down** changes power; **Enter** fires. Scroll over **Angle** or **Power** (including the labels) to change that value. Scrolling over the battlefield still adjusts power.
- **Shell / MIRV** are compact radio choices alongside the sliders and Fire, with the remaining MIRV count. Very narrow windows wrap the controls.
- **Expand** beside Sound opens a large game window. Drag its edges to resize; **Restore** or **Escape** returns to the widget. Leaving the game also restores the normal size. Escape dismisses a victory ceremony first.
- Bots remember damage for the last **three completed battles**, fading older grudges. Anyone winning at least two of those battles draws extra fire, including bots. Revenge and leader-targeting taunts name their target. Rivalries persist with local scores; abandoned games do not count. If you lose early, the remaining bots finish offscreen to determine the actual winner, reported in the results.
