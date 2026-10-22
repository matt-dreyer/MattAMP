# Living with MattAMP

[← Back to the README](../README.md) · [Artillery rules](artillery.md) · [Development](development.md)

## Radio

DI.FM playback requires Premium external-player access and your personal listen key.

1. Open **Settings → DI.FM settings** to reach the provider's settings.
2. Find your **Premium Player Settings / listen key**.
3. Paste only the key into MattAMP, save, close Settings, and choose a station.

**Forget key** removes the saved key and stops playback. MattAMP uses Electron safeStorage with a protected system keyring when available. Without protected storage, the key lasts only for the current session; there is no plaintext fallback.

Channel art comes from AudioAddict's catalog and image CDN. Metadata is cached for a day within the running app. If artwork is unavailable, the station still has a text fallback; provider covers are not bundled with the app.

## Podcasts

Use **Podcasts → Player** to choose **YouTube** or **Audio feed**. These are separate feeds, so their episode selections and resume positions are separate too.

Open **Settings → Your podcasts**, or **Manage podcasts** below the player, to customize the lineup. **Add show** accepts a name and either a YouTube playlist/channel URL, a public HTTPS audio RSS feed, or both. The pencil edits a show; the arrows change its position; the trash button removes it, with **Undo removal** available for the most recent removal. Changes save locally and appear in the player immediately. Up to 50 shows are supported, and the original five remain until you edit or remove them.

For custom YouTube shows, use a full-episode playlist when possible. Channel URLs (including `@handle` URLs) use non-Short uploads; the parser excludes videos three minutes or shorter, but longer clips can still appear. Audio-only and video-only shows automatically select their available player. Audio links must be RSS feeds, not Apple Podcasts or Spotify listing pages. The app checks link format when saving; feed availability is checked when you select the show.

The video player has a responsive 16:9 viewport and YouTube's native controls. Four shows use dedicated full-episode playlists. AI for Humans matches non-Short uploads to podcast RSS titles to reject standalone clips. When a playlist's RSS endpoint fails, MattAMP tries that playlist's public page metadata; it does not quietly substitute an unfiltered uploads feed.

Audio supports play/pause, stop, volume/mute, seeking, 15-second rewind, 30-second forward, and speed. Preferences and positions save locally. Default speed is 1×; a manually selected speed is remembered. Settings also accepts a custom YouTube URL.

Radio and podcasts wait for Play. The startup intro is separate and plays once per launch. A browser may require you to click the YouTube player's own Play button. Individual videos may prohibit embedding or require login; MattAMP itself does not require a YouTube account.

## SkiCams

Turn on **Auto-cycle** to rotate through your saved cameras in order. Choose 1, 5, 15, 30, or 60 minutes; the default is 15. The toggle and interval are remembered. Leaving SkiCams, opening Settings, or minimizing pauses cycling; returning starts a fresh interval. Choosing a camera manually also restarts the interval. At least two saved cameras are needed.

The **SkiCams** tab sits just before Game. It starts with Sierra-at-Tahoe's Grandview and West Bowl, Heavenly's Top of Tram, and Kirkwood's Cornice Cam. Choose a view from the menu; Refresh reconnects it, and Browser opens the resort's source page. Sierra's live video IDs are resolved from its official camera list when opened, with the saved link as an offline fallback.

Open **Manage cams** or **Settings → Your SkiCams** to add, edit, reorder, or remove cameras. The latest removal can be undone. Enter a camera name, an optional resort, and a public HTTPS link. YouTube watch/live links become muted players; direct camera-player links work best. Ordinary resort pages retain their own page navigation. Provider availability, offline streams, and playback restrictions remain under the resort's control; Browser is the fallback.

Camera audio is muted while radio/audio podcasts continue. YouTube podcasts pause when hidden. Only one camera loads at a time, in an isolated sandbox without access to MattAMP's settings or credentials. Leaving SkiCams, opening Settings, hiding/minimizing the app, or entering compact/bug mode closes the camera view and stops its stream. Your camera lineup and selection persist locally, including an intentionally empty list. Up to 40 cameras are supported.

## X/Twitter

**AI circle** uses X's official Latest search, restricted to the selected authors and optionally AI keywords. Replies and reposts are excluded by the query. **For giggles** is a separate Elon Musk search. **Filters** accepts up to 12 handles and controls the topic restriction.

This is an embedded X page. X controls search matching and availability; keyword filtering can miss posts that never mention those words. Clicking around inside X can leave the search. Select **AI circle** again to return.

### Sign-in choices

| Route | Where you're signed in |
| --- | --- |
| Direct X sign-in inside MattAMP | MattAMP's isolated, persistent X session |
| **Browser**, then sign in there | Your default browser only |
| Google/Apple sign-in from the embedded view | Opens the browser; choose the provider again there to complete the flow in that browser |

A successful browser login cannot transfer its session back into MattAMP. For the embedded pane, use direct X sign-in with an authentication method its Chromium view supports. Settings → **Forget X sign-in** clears the app's local session. MattAMP does not import your browser cookies or collect your password, and no X API key is needed.

The reader hides X's desktop navigation rail and trends to fit the narrow pane. A direct login returning to Home resumes the selected filter. Login dialogs keep X's own layout.

X runs in a sandboxed WebContentsView without Node or the app's preload bridge. Camera, microphone, notifications, and downloads are denied. X media is muted so it doesn't fight your radio. The pane hides in compact/bug modes and Settings. Opening it does not follow accounts, publish posts, or create lists.

## Window and playback behavior

Drag the title bar to move the window. The layout, compact, and bug buttons change its footprint. Drag the bug to move it; click it to restore. Minimize hides to the tray. The close button quits. The tray menu can restore, pause, or quit.

| When you… | Radio / audio podcast | YouTube | Artillery |
| --- | --- | --- | --- |
| Open X or Game | Continues | Pauses while hidden | Runs when Game is visible |
| Open Settings | Continues | Pauses | Pauses |
| Hide to tray / enter bug mode | Continues | Pauses | Pauses |
| Quit | Stops | Stops | Stops |

Leaving an unfinished battle earns no score or rivalry record.

## Backgrounds and accessibility

Choose **Settings → Live background**: Particle flow (default), Water waves, Starfield, Mandelbrot zoom, Trench Run, or Off. The selection saves locally. Effects stay inside MattAMP; they do not change your desktop wallpaper.

Particle flow uses long, fading trails at varied speeds through moving swirls; the pointer stirs a local whirlpool and outward wake. Waves ripple, stars shift with depth, the fractal pans gently, and Trench Run banks toward the pointer. Embedded X/video surfaces handle their own pointer input and retain their own backgrounds.

Mandelbrot explores six regions in randomized 2½–3½-minute passes: horizontal/vertical glides, curved approaches, and slow spirals, returning to a wide view between destinations. Consecutive destinations/routes differ. Its GPU renderer is capped at 18 fps and 640 pixels on the longest edge; without WebGL it uses a static fractal.

Trench Run flies an endless procedural vector trench with occasional sharp 60–90° turns, variable-width passages, mechanical wall panels, recessed floor shafts and dim paired bolts from wall cannons. Narrow sections trigger knife-edge banks or full barrel rolls about once a minute. Only the background rotates; text and controls stay upright. A fresh route is seeded at launch; scenery is generated ahead with a fixed geometry budget, 24 fps cap and no downloaded assets.

Animation stops when Off, hidden, in bug mode, or under reduced motion. Reduced transparency uses solid control fills. The victory ceremony also respects reduced motion and has a static fallback.

## Workstation meters

- **CPU / RAM / network:** Linux counters every two seconds. Network traffic is measured on the default-route interface: Mbps in Modern, Kbps in ’90s, and bps in //e. RAM and GPU memory capacities display in MiB.
- **GPU:** NVIDIA utilization, VRAM, and temperature via `nvidia-smi`, for detected cards. NVIDIA hardware is optional; these are not general AMD/Intel GPU sensors.
- **Details:** expanded memory/VRAM/temperature readings.
- **Network status:** router and public-internet probes every ten seconds. ICMP failure falls back to HTTPS connectivity checks; a missing ping response alone doesn't establish an outage.

Missing sensors display as unavailable rather than an invented zero.

## Troubleshooting

| Symptom | Try this |
| --- | --- |
| Ubuntu refuses to launch; user namespace / SUID helper error | From the app folder, run `bash scripts/install-sandbox-profile.sh`, approve the desktop administrator prompt, and retry as your normal user. Rerun after moving the folder. Keep sandboxing enabled. |
| Dock icon does nothing after moving the app | Run `./MattAMP` from its new location to see any error, then rerun `bash scripts/install.sh`. On affected Ubuntu systems, rerun the sandbox-profile script too. |
| `./MattAMP` is not executable after extraction | From the extracted folder, run `chmod +x MattAMP`, then `./MattAMP`. Extract the whole runtime archive with permissions intact. |
| Missing Linux shared library | Install the missing Electron desktop dependency through your distro's package manager. The ZIP bundles Electron, not every system library. |
| Radio will not play | Confirm Premium external-player access and that you pasted only the listen key. Save again and try another station. Provider/network failures can also interrupt a stream. |
| App opens, but the saved radio key is locked | Unlock the desktop keyring in **Passwords and Keys**, then select **Settings → Retry saved key**. Keyring access runs in the background so it cannot freeze startup. |
| Listen key disappears after restart | A protected system keyring was unavailable. Enable/unlock the desktop keyring for encrypted persistence, or enter the key each session. |
| Podcast feed is unavailable / returns HTTP 404 | Use the episode refresh button, try another show, or choose **Audio feed**. Provider changes can break feed discovery; MattAMP keeps the full-episode filter rather than showing Shorts. |
| YouTube frame is blank, blocked, or won't start | Click the embedded player's Play button. If the upload disallows embedding or needs login, use **YouTube** to open it externally, or choose **Audio feed**. |
| Browser X login succeeds but MattAMP remains signed out | These are separate sessions. Use direct X sign-in in MattAMP, or read the filtered feed in your browser. |
| X shows Home instead of the selected people | Click **AI circle** or **For giggles** again. Navigation within X can leave the filtered search. |
| No GPU meters | Check whether `nvidia-smi` works. Other GPU vendors and missing NVIDIA drivers do not provide these readings. |
| Live background doesn't move | Check the selected effect and OS reduced-motion preference. Hidden/bug mode deliberately stops animation. |
| Finished match hasn't enabled replay | Wait for score saving. If it reports a disk error, use the save retry button and check available space/permissions. |

## Local data and privacy

The original internal app name, `workstation-deck`, is retained so existing settings and dock pins survive the MattAMP rename.

| Data | Default Linux location |
| --- | --- |
| Preferences, media positions, encrypted listen key | `~/.config/workstation-deck/state.json` (mode 0600) |
| Leaderboard, lifetime totals, rivalries | `~/.config/workstation-deck/arcade-scores.json` |
| Chromium cache and isolated X session | Within `~/.config/workstation-deck/` |

The X partition is `persist:mattamp-x`. Runtime bundles contain none of the author's keys, browser sessions, preferences, or scores. Tests use isolated temporary profiles.

A loopback-only HTTP server serves the UI, supplies a YouTube embed origin, and relays radio through opaque, revocable URLs. The relay keeps the DI.FM key out of the renderer. Some provider stream endpoints are HTTP-only; the relay preserves their protocol. It exposes no telemetry, credential, or control API over HTTP. Privileged app calls use the isolated, sandboxed preload bridge, which remote content cannot access.

Media and X still contact their respective providers; local storage doesn't make those services offline or private from their operators. Podcasts and system metrics need no MattAMP hosted backend, recurring service fee, or API key.

## Tab sound effects

**Settings → Silly sound effects** turns the four navigation voice clips on or off (on by default): DI.FM says “Yeeeeah,” Podcasts and Twitter say “Meh,” SkiCams says “Send it!” in a deep, full female voice, and Game says “Hell yeah!” in a male voice. The choice is saved. These bundled clips work offline, follow the player volume/mute, and replace each other when you switch tabs quickly. The game greeting also respects Game’s Sound off button. Automatic camera cycling is silent. These are synthetic stock voices, not recordings or imitations of a named person.

## Startup audio and credits

`assets/startup.mp3` is DJ Mike Llama's original **“Llama Whippin' Intro” (Winamp 2.91)**, preserved in [Webamp's example](https://github.com/captbaritone/webamp/blob/master/examples/minimal/index.html). [Pinned audio source](https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3).

It plays once per app launch at your saved volume. Starting playback or pressing Stop/Pause interrupts it. Restoring the window or starting a second instance doesn't replay it.

Winamp and the sample belong to their respective rights holders; Webamp's code license does not cover the clip. Likewise, Metal Slug and Worms assets retain their original copyrights. Kenney fallback assets have their own CC0 licenses. See the [arcade asset credits](../assets/arcade/README.md) and [source manifest](../assets/arcade/sources.json) for attribution and processing details. There is no project-wide license granting blanket rights to these materials.

### Provider references

- [DI.FM Premium and external players](https://www.di.fm/premium)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube embedded-player requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)

## //e appearance (1.1.0+)

Open Settings → Appearance → **//e — even more retro**. Modern and ’90s
remain available, and old Retro preferences migrate to ’90s automatically.
Toggle **Subtle scanlines** separately; leave it off for the cleanest text.
The optional robotic modem greeting obeys **Silly sound effects**, mute and
volume. It plays when selecting the skin, not on restart. Click the modem
message below the system readings for the next BBS joke.

Artwork uses a small cached, 16-entry palette conversion; unavailable artwork
falls back gracefully. The palette evokes a color Apple II display; it does
not emulate analog artifact colors. Network rates are shown in bits per second
and compared against 300 bps. All metrics and the radio spectrum remain real.
Remote YouTube, X and ski-camera content is not recolored or downsampled.

### Normal window stacking

MattAMP follows normal desktop window ordering by default. To keep it visible
above other apps, enable **Settings → Keep MattAMP above other windows**.
Unchecking it takes effect immediately and persists after restarting. Existing
explicit pin preferences are preserved when upgrading.
