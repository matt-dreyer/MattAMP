MattAMP 0.2.0 brings the mountain to your desktop, adds a few questionable voice greetings, and makes your media lineup yours.

- SkiCams for Sierra Grandview/West Bowl, Heavenly Top of Tram, and Kirkwood Cornice, plus your own camera links.
- Optional camera rotation every 1, 5, 15, 30, or 60 minutes.
- Add, edit, remove, and reorder podcasts in Settings using YouTube or RSS links.
- Optional offline tab greetings: “Hell yeah!”, “Send it!”, “Meh”, and “Yeeeeah”.
- Volume wheel controls, full-width tabs, and a startup fix for locked desktop keyrings.
- Native packages for Linux, Windows, and Intel/Apple Silicon Macs. CPU, memory, network status, and network traffic support all three platforms. GPU meters require NVIDIA's `nvidia-smi`; Apple/integrated GPU utilization is not available.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
