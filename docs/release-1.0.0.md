MattAMP 1.0.0: a little Winamp nostalgia, a little desktop utility, and an unreasonable amount of artillery.

- Optional **Settings → Retro mode**: dark beveled metal, green displays, a numbered station playlist, brushed-aluminum transport controls, and a rectangular metal volume fader.
- A live radio spectrum observes actual playback without rerouting audio. Segmented system meters retain real readings; a separate LED chart shows CPU history.
- Enabling Retro plays an original synthesized modem handshake. It respects volume, mute, and **Silly sound effects**; it does not replay merely because the saved theme loads at startup.
- Functional classic menus for Settings, layouts, playback, and station hopping, plus a small Help easter egg.
- Download/upload rates display in Kbps; RAM and GPU memory capacities display in MiB.
- Modern mode keeps the lighter icon-and-text navigation, translucent pinned tab strip, and bare title-bar controls.
- Radio, configurable podcasts, SkiCams, filtered X browsing, workstation monitoring, and AMP Artillery remain together in one app.
- Updated README previews and usage notes. Opening Settings while YouTube initializes no longer throws a player-readiness error.

The Retro preference is saved locally. Switching skins preserves audio playback and the current battle; switching back restores the chosen ambient background. Active spectrum work pauses when hidden, outside the radio view, in Settings/Bug mode, and under reduced motion.

Validation before release: 91 unit tests, focused Electron checks for Retro and pinned controls, and local Linux packaging verification passed. Release CI builds and verifies Linux x64, Windows x64, Intel Mac, and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
