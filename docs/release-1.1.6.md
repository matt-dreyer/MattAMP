MattAMP 1.1.6: a little planetarium on your desktop.

- **Sky** gets its own mode beside SkiCams and Game, with a resizable workspace and full-screen exploration. Radio keeps playing underneath.
- Real stars, constellation figures, the Milky Way, Moon phases and planets follow your saved approximate location. Device location requires permission; manual coordinates and Forget location are available inside Sky.
- A gentle default camera scan brings the sky to life. Find an object to settle the view, or use **Two-week drift** to explore the previous and coming week. Reduced-motion settings are respected.
- Optional Starlink tracks use cached orbital predictions. They indicate predicted positions, not guaranteed optical visibility, and pause during time travel.
- **Meteor watch** shows the next seven real days of selected annual showers, approximate peaks, suggested dark viewing hours and moonlight interference. A small dot on Sky highlights a suitable upcoming peak. The offline seasonal catalog is based on IMO's 2026 calendar; it is not a weather or meteor-count forecast.
- Mode navigation is now **icons only**, with names on hover and keyboard focus. Large click targets, all three themes and the meteor indicator are retained.
- Updated the README, guide, data provenance and Sky screenshots.

Validation: 122 unit tests, syntax checks, isolated Electron Sky interactions and icon-navigation checks passed locally. Release CI tests, packages and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
