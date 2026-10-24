MattAMP 1.1.5: changing weather.

- **Windy** joins Settings → Live background as a separate effect. **Particle Flow stays unchanged**, including its long trails, moving eddies and default selection.
- Windy mixes long, fading wind-map trails with passing hurricane eyes and subtle color shading. Storms enter, cross the widget and move away again.
- Seeded three-minute chapters vary storm direction, size and rotation, with broad currents between passes and some entirely storm-free chapters. Transitions blend smoothly.
- Both effects respond to the mouse and respect Off, reduced motion, hidden windows, Bug mode and classic themes. Windy is locally generated scenery, not live weather.
- Updated the background guide and added a separate Windy screenshot.

Validation: syntax checks, all 107 unit tests and the Electron checks for both Windy and Particle Flow passed. Release CI tests, packages and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
