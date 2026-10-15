MattAMP 0.3.0 gives AMP Artillery more personality, better controls, and an easier place to start. Radio, podcasts, SkiCams, the X feed, and system monitoring are all still here.

- Watch the bots finish the battle after your tank goes down, followed by the winner’s ridiculous dance and occasional wheelie.
- A shared leaderboard tracks humans and bots. Your arcade initials label your tank; every tank has its own matching color.
- Very dumb bots now guess their shots, rarely use MIRVs, and hold much weaker grudges. Higher difficulties retain their aim.
- More varied procedural hills, valleys, ridges, and plateaus. Chaos Off holds wind constant for the entire battle.
- Refined power scaling and optional bot angle/power readouts, with sharper, less profane heckling.
- Game preserves your chosen window size through resets, Settings, and temporary hiding. Native maximize/restore and expanded play keep the controls usable.
- Title bar, mode tabs, and Game’s Expand/Sound controls stay pinned while scrolling. Click the battlefield to start a battle or set up another round.
- SkiCams gets a slower, deeper female stock “Send it!” greeting.
- Updated README, screenshots, and artillery field manual.

Validation: 91 unit tests and focused Electron checks cover game flow, scoring, beginner balance, window sizing, pinned controls, embedded views, and tab audio. Release CI builds and verifies all four platform/architecture combinations.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
