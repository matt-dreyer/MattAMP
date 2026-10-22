MattAMP 1.1.3: stay on target.

- **Trench Run** joins Settings → Live background: an endless procedural vector canyon with sharp turns, changing widths, vertical walls, sparse floor shafts and occasional enemy cannon fire.
- Narrow sections bring knife-edge banks and a full barrel roll about once a minute, starting after the first minute of flight. Your text and controls stay upright.
- The background saves across restarts, responds to the mouse, and respects Off, reduced motion, hidden windows and Bug mode. Classic themes keep their own appearance.
- **AMP Artillery:** wind direction and strength now sit beside the aiming controls, with gravity alongside. The score multiplier moves next to the points total. Physics and scoring are unchanged.
- Updated the README, background screenshot and usage guide.

Validation: syntax checks, 101 unit tests and the Electron Trench Run integration check passed. Release CI tests, packages and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
