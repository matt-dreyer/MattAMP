MattAMP 1.1.1: bandwidth back in its decade.

- Modern now displays network throughput in **Mbps**, in both the main panel and compact status line. For example, 4940.3 Kbps becomes 4.9 Mbps.
- ’90s retains **Kbps** and //e retains **bps**. Switching appearance updates the values and labels together.
- Updated the usage documentation and Electron integration coverage for all three themes. The modem-audio check now waits for finite duration metadata before checking its length.

Validation: syntax checks and the Retro Electron integration suite passed, including theme switching, main/compact bandwidth units, playback and layouts. Release CI tests, packages and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
