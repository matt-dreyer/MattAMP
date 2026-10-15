# Developing and packaging MattAMP

[← Back to the README](../README.md) · [User guide](guide.md) · [Artillery rules](artillery.md)

## Run from source

Use Linux with a graphical desktop, Git, Node.js, and npm. Install the versions pinned by `package-lock.json` rather than upgrading dependencies incidentally.

```sh
git clone https://github.com/matt-dreyer/MattAMP.git
cd MattAMP
npm ci
npm run check
npm test
npm start
```

`./MattAMP` is another entry point; it invokes the installed Electron binary directly. `ping` supports network probes, `nvidia-smi` supplies NVIDIA metrics, and a protected desktop keyring provides encrypted listen-key persistence. Their absence does not prevent playing the offline game.

Optional menu/dock integration:

```sh
bash scripts/install.sh
```

This writes the launcher, desktop entry, and icon under `~/.local/`. It does not create login autostart. The command is `~/.local/bin/mattamp`; the original `workstation-deck` command remains as a compatibility entry point.

On Ubuntu with restricted unprivileged user namespaces, run:

```sh
bash scripts/install-sandbox-profile.sh
```

The desktop administrator prompt installs `/etc/apparmor.d/mattamp`, scoped to this checkout's Electron executable. It grants the `userns` permission needed to create Electron's sandbox without disabling sandboxing or changing system-wide namespace restrictions. Rerun after changing the install path.

## Project map

| Path | Responsibility |
| --- | --- |
| `src/main.cjs`, `src/preload.cjs` | Electron lifecycle, state, windows, isolated IPC bridge |
| `src/app.js`, `src/index.html`, `src/style.css` | Player, controls, layouts, settings |
| `src/services.cjs` | Provider data and workstation metrics |
| `src/radio-relay.cjs` | Local radio relay with opaque stream URLs |
| `src/youtube-playlist.cjs` | Full-episode playlist discovery and filtering |
| `src/x-feed.cjs` | Isolated X reader, search filters, navigation |
| `src/ambient.js` | Live backgrounds and pointer response |
| `src/artillery.js` | Battle simulation, bots, wind, terrain, chaos rules |
| `src/artillery-ui.js`, `src/artillery.css` | Game rendering and controls |
| `src/arcade-store.cjs` | Local scores and rivalry history |
| `src/victory.js` | Three.js victory ceremony and cleanup |
| `assets/arcade/` | Game assets, licenses, source provenance |
| `test/`, `scripts/*smoke.cjs` | Unit and Electron integration tests |

The package name remains `workstation-deck` to preserve user-data paths and existing installs; the displayed product name is MattAMP.

## Checks

```sh
npm run check
npm test
```

Syntax checks and Node unit tests cover the local modules. For changes involving the desktop UI, run the relevant integration check in a graphical session:

| Command | Coverage |
| --- | --- |
| `npm run test:arcade` | Game controls, sprites, MIRVs, pause, layouts, audio continuity, persistence |
| `npm run test:heckles` | Cartoon commentary |
| `npm run test:victory` | Real WebGL, dismissal/cleanup, narrow layouts, reduced motion, context loss |
| `npm run test:settings-game` | Settings interaction in Game mode |
| `npm run test:expanded` | Expanded layouts at 2200×1200, 1000×820, and 640×480; restoration |
| `npm run test:chaos` | Defaults, persisted selection, preview/start consistency, conditions and saved records |
| `npm run test:smoke` | Original workstation and live-provider smoke test |

Integration scripts launch temporary Electron profiles, keeping the real listen key, X session, and scores separate. Captures go to temporary locations or ignored `test-results/`, depending on the script.

**`test:smoke` is workstation-specific:** it expects the original two RTX cards and internet access, plays muted test media, and depends on public podcast services. It is not a portable, offline CI gate. Other rendering checks still need a suitable graphical environment. Do not disable Electron's sandbox to make a test pass.

## Build a shareable Linux ZIP

On Linux x86-64, from a clean, committed checkout:

```sh
npm ci
bash scripts/package-linux.sh "$HOME/Downloads"
```

The output directory receives:

| File | Contents |
| --- | --- |
| `MattAMP-linux-x64-<commit>.zip` | Committed app source, production dependencies, pinned Electron runtime, notices, and `BUILD.txt` |
| `MattAMP-source-<commit>.zip` | Committed source; recipients must run `npm ci` |
| `MattAMP-linux-x64-<commit>.sha256` | SHA-256 checksums for both archives |

The script uses `git archive HEAD`: uncommitted/untracked files are not included, and dirty tracked files make it stop. It installs clean production dependencies and copies the matching local Electron runtime. User profiles, listen keys, X cookies, preferences, scores, and unrelated workspace files are never copied.

The runtime ZIP requires no Node/npm installation on the receiving machine. It still needs the host's Electron system libraries. It is not a distro package, AppImage, ARM build, or cross-platform installer. Keep all bundled licenses and asset notices with it; see [asset rights](../assets/arcade/README.md).

[START-HERE.txt](../START-HERE.txt) is the short recipient guide. The README's shared download points to a fixed build; when publishing a replacement, update its build identifier and checksum alongside the link.

## Updating and uninstalling

There is no auto-updater. For a clean source checkout, quit MattAMP and update explicitly:

```sh
git pull --ff-only
npm ci
npm run check
npm test
./MattAMP
```

If you have local changes, preserve them before updating. For a runtime bundle, extract the replacement to its permanent location and reinstall the launcher if its path changes. Settings remain in the separate user-data directory. Dependency upgrades should deliberately update the lockfile and run the relevant checks.

To remove menu/dock integration, remove these app-owned files:

- `~/.local/bin/mattamp`
- `~/.local/bin/workstation-deck`
- `~/.local/share/applications/ai.fshbwl.deck.desktop`
- `~/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png`

Unpin any stale dock entry and remove the extracted app/source folder if no longer needed. If you installed the Ubuntu AppArmor profile, `/etc/apparmor.d/mattamp` is also app-specific and can be removed with your system's profile-management tools.

Keep `~/.config/workstation-deck/` to retain settings, sessions, and scores for reinstall. Deleting it removes those too. Other desktop monitors are independent of MattAMP.
