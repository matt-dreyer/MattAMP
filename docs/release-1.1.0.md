MattAMP 1.1.0: let’s get serial.

An Apple IIe-inspired desktop skin joins the ’90s player and modern glass. Your workstation can now report its bandwidth in bits per second and tell you how many 300-bps acoustic-coupler modems it would take to keep up.

- **Settings → Appearance → //e — even more retro:** black surfaces, subdued green outlines, blue selections, locally bundled bitmap-inspired lettering, and station art dithered into a 16-entry display palette.
- **Real meters, old-school colors:** colorful segmented radio spectrum and system readings, plus a separately labeled CPU history. The spectrum follows actual audio.
- **Optional nostalgia:** subtle scanlines, an original coupler-inspired chirp and robotic “MattAMP ready. Let’s get serial.” greeting, and clickable Havre-to-Boston BBS/RadioShack messages. The greeting obeys Silly sound effects, volume and mute; restoring a saved theme does not replay it.
- **Normal window stacking by default:** MattAMP no longer starts pinned above every other app on a fresh installation. “Keep MattAMP above other windows” remains optional and applies immediately. Existing saved pin choices are preserved; uncheck it in Settings if your upgraded copy still floats above other apps.
- **Your other decades are still here:** Modern and ’90s remain selectable. Existing Retro preferences migrate to ’90s; appearance changes retain radio playback, layout and battle state. YouTube, X and camera content keep their native rendering.
- Updated README screenshot, usage instructions, asset provenance and design documentation.

This is a visual and sound homage, not an Apple II or Echo II+ emulator. Radio, configurable podcasts, SkiCams, filtered X browsing, workstation monitoring and AMP Artillery remain together in one app.

Validation: 94 unit tests, syntax checks, focused Electron checks for both classic appearances and native pin/unpin persistence, and local Linux packaging/launch checks passed. Release CI rebuilds and verifies Linux x64, Windows x64, Intel Mac and Apple Silicon Mac before publishing downloads.

## Choose a download

- **Ubuntu/Debian:** `.deb` installer (recommended on Ubuntu 24.04+ for sandbox setup).
- **Other x64 Linux:** `.AppImage`, or `.tar.gz` containing the `mattamp` executable. Make the AppImage executable first. A working Electron sandbox and standard desktop libraries are required; do not run as root or disable the sandbox.
- **Windows x64:** `windows-x64-setup.exe`, or the `win-x64.zip` portable folder containing `MattAMP.exe`.
- **Apple Silicon Mac:** `mac-arm64.dmg` or `.zip`.
- **Intel Mac:** `mac-x64.dmg` or `.zip`.

Windows builds are unsigned. Mac builds are ad-hoc signed, not Apple-notarized; operating-system trust prompts are expected. On macOS, move MattAMP to Applications and use System Settings → Privacy & Security → Open Anyway if Gatekeeper blocks your verified download. Organization policies may still prevent opening unsigned software.

No Node.js installation is required. Quit the old app before installing/replacing it. Preferences, scores, and account sessions live outside the app and are retained. There is no auto-updater.

`SHA256SUMS.txt` contains the checksums for the release downloads. Bundled retro artwork/audio retain their original rights; see the repository's asset credits.
