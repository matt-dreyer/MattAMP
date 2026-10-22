MattAMP 1.1.4: go with the flow.

- **Particle Flow** now curls through moving eddies with longer, fading trails and layered speeds. Cyan, mint and muted-blue tracers bring more depth while keeping the controls readable.
- Move your mouse over the widget to stir a local whirlpool and outward wake.
- Particle counts and trail lengths stay bounded at the existing 24 fps cap. Off, reduced motion, hidden-window and Bug mode pausing, plus classic-theme suppression, are preserved.
- Updated the README screenshot and background guide.

Validation: syntax checks, all 103 unit tests and the Electron Particle Flow integration check passed. Release CI tests, packages and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
