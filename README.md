<p align="center">
  <img src="assets/icon.png" width="96" alt="MattAMP bug logo">
</p>

# MattAMP

**Reclaim your desktop. Lose an evening.**

Remember when your computer had a personality? Winamp was playing, Fractint was doing something hypnotic, and “one more round” of Scorched Earth was a perfectly reasonable use of the next three hours?

MattAMP started with a much smaller ambition: replace a few desktop widgets and get some screen space back. Then came the radio presets. The podcasts. The glass buttons. The drifting fractals. Then came mountain webcams—because checking the snow is also a desktop essential. Then somebody said “MIRVs,” and here we are.

It's a small, slightly ridiculous desktop app for Linux, Windows, and macOS: **music, podcasts, SkiCams, a filtered X feed, system stats, and an artillery game with bots that hold grudges.** It even does the llama intro.

[Screenshots](#take-a-look-around) · [Retro modes](#even-more-retro-e) · [Get running](#get-running) · [SkiCams](#skicams-send-it) · [Play artillery](#tiny-tanks-questionable-decisions) · [Music & podcasts](#something-good-in-your-ears) · [Controls](#make-yourself-at-home) · [Troubleshooting](docs/guide.md#troubleshooting) · [Development](docs/development.md)

![MattAMP's icon-and-text tabs on a translucent bar, Synthwave radio art, wave background, and live workstation meters](docs/images/desktop.png)

## What's in the little box?

| The useful stuff | The entirely reasonable additions |
| --- | --- |
| Eight DI.FM presets with official channel art | Scorched Earth–inspired tank battles and MIRVs |
| Your podcast lineup: YouTube episodes or audio | Sarcastic bots with three-match grudges |
| SkiCams with your own favorites and automatic rotation | Optional “Send it!” and other silly tab greetings |
| A filtered X/Twitter pane | Ricochet walls, wraparound shots, and occasional absurd wind |
| Live CPU, memory, network, and NVIDIA GPU meters | Mouse-reactive particles, waves, stars, and Mandelbrot glides |
| Stacked, sidecar, compact, and tiny bug layouts | A wildly unnecessary 3D victory ceremony |
| Optional Retro skin with real audio spectrum and LED meters | Brushed aluminum, corner rivets, and a modem greeting |

Built for a Linux workstation and a large OLED, with dark glass, muted color, and enough contrast to find the window. The effects are optional. The silliness is more fundamental.

## Take a look around

Browse the tabs, layouts, and backgrounds below, or jump to the new [Retro previews](#back-to-1997). These are captures of the running app using isolated profiles; Twitter shows its signed-out screen. Click any image for the full-size view. Animated backgrounds are frozen mid-frame here.

<details>
<summary>All five tabs — including both podcast players</summary>

| DI.FM radio | Podcasts · YouTube |
| --- | --- |
| ![DI.FM radio with station artwork, presets, and meters](docs/images/desktop.png) | ![YouTube podcast player with a full Last Week in AI episode and show favorites](docs/images/podcasts-youtube.png) |
| **Podcasts · Audio feed** | **Twitter · signed out** |
| ![Audio podcast player with episode selection, seek, skip, and speed controls](docs/images/podcasts-audio.png) | ![Twitter tab with AI circle and For giggles filters above the X sign-in page](docs/images/twitter.png) |
| **SkiCams** | **Game · widget size** |
| ![Heavenly Top of Tram camera and automatic camera rotation](docs/images/skicams.png) | ![AMP Artillery running inside the normal widget](docs/images/game-widget.png) |

</details>

<details>
<summary>Four desktop layouts, plus the expanded battlefield</summary>

| Sidecar · meters alongside | Stacked · meters below |
| --- | --- |
| ![Sidecar layout with the radio and meters beside each other](docs/images/desktop.png) | ![Tall stacked radio layout with meters below the presets](docs/images/stacked.png) |
| **Compact · player and a status strip** | **Bug · actual 56 × 56 size** |
| ![Compact radio player with a single line of system statistics](docs/images/compact.png) | <img src="docs/images/bug.png" width="56" height="56" alt="Tiny draggable MattAMP bug"> |

**Expanded Game** keeps the controls together while giving the battlefield more room:

![Expanded artillery battlefield and aiming controls](docs/images/artillery.png)

</details>

<details>
<summary>Backgrounds — particles, waves, stars, fractals, or none</summary>

| Particle flow | Water waves |
| --- | --- |
| ![Particle flow background behind the radio and meters](docs/images/background-flow.png) | ![Water wave background behind the radio and meters](docs/images/desktop.png) |
| **Starfield** | **Mandelbrot zoom** |
| ![Starfield background behind the radio and meters](docs/images/background-stars.png) | ![Mandelbrot fractal background behind the radio and meters](docs/images/background-mandelbrot.png) |

**Off**, when you'd rather sit still:

![MattAMP with background animation switched off](docs/images/background-off.png)

</details>

<details>
<summary>Make it yours — podcast and camera favorites</summary>

**Your podcasts:** add YouTube or RSS links, edit favorites, and put them in your order.

![Podcast settings with add, reorder, edit, and remove controls](docs/images/podcasts-settings.png)

**Your SkiCams:** build your own mountain lineup.

![Camera settings with the four default views and favorite-management controls](docs/images/skicams-settings.png)

</details>

## Get running

### Install a packaged release

Get the current installers and portable apps from **[GitHub Releases](https://github.com/matt-dreyer/MattAMP/releases/latest)**. No Node.js or npm required.

| Your machine | Download |
| --- | --- |
| Ubuntu/Debian x64 | `.deb` installer; includes sandbox integration |
| Other Linux x64 | `.AppImage` or portable `.tar.gz` |
| Windows x64 | `windows-x64-setup.exe` or portable `win-x64.zip` |
| Apple Silicon Mac | `mac-arm64.dmg` or `.zip` |
| Intel Mac | `mac-x64.dmg` or `.zip` |

Windows packages are unsigned; Mac packages are ad-hoc signed and not notarized. See the [release notes](docs/release-1.1.1.md) for first-launch instructions and platform limitations. Check downloads against the release's `SHA256SUMS.txt`.

<details>
<summary>Earlier Linux bundle (before SkiCams)</summary>

This older build predates SkiCams and configurable favorites. Use **GitHub Releases above** for the current packaged app.

**[Download the Linux x64 runtime ZIP](https://drive.google.com/file/d/1c_W4ALm0PoKuRQJ8SB-4nG0fc_SfvX7J/view)** — shared build `cb2d469`.

1. Extract the **whole folder** somewhere permanent, such as `~/Apps/MattAMP`.
2. Open a terminal in the extracted `MattAMP` folder and run:

   ```sh
   ./MattAMP
   ```

3. Click **Game**, choose your bots and difficulty, and hit **Start battle**. Chaos starts on **Mixed**.

The runtime ZIP includes Electron and its dependencies. **No Node.js, npm, account, subscription, or internet connection is needed to play artillery.** This download is a fixed build, not an auto-updating installer; the source instructions below get the current code.

Want it in your application menu and dock? From the same folder:

```sh
bash scripts/install.sh
```

Launch **MattAMP** from the application menu, then pin it using your desktop's usual controls. Keep the extracted folder in place: the launcher points to it.

**Requirements:** 64-bit Intel/AMD Linux, a graphical desktop, and the usual Electron desktop libraries. NVIDIA hardware is optional. The shared bundle is not an ARM, Windows, or macOS build; compatibility has not been tested on every Linux distribution.

<details>
<summary>Ubuntu sandbox error, or want to verify the download?</summary>

If Ubuntu reports a user-namespace or SUID sandbox-helper error, run this from the extracted folder and approve the administrator prompt:

```sh
bash scripts/install-sandbox-profile.sh
```

It installs an AppArmor profile for this folder's Electron executable. Run it again if you move the folder. Launch MattAMP as your normal user; keep Electron's sandbox enabled.

SHA-256 for `MattAMP-linux-x64-cb2d469.zip`:

```text
7e0a1cf4719cfa88e4fc91f2a255de70c0cef817281c5c0239134e9a3d8fbb58
```

Compare with `sha256sum MattAMP-linux-x64-cb2d469.zip` before extracting. More help: [troubleshooting](docs/guide.md#troubleshooting).

</details>

</details>

### Run the current source

The repository is public. With Git, Node.js, and npm installed:

```sh
git clone https://github.com/matt-dreyer/MattAMP.git
cd MattAMP
npm ci
npm start
```

A GitHub **Download ZIP** contains source only; it still needs `npm ci`. The runtime download above already includes what it needs. See the [development guide](docs/development.md) for checks, packaging, and project layout.

## SkiCams. Send it.

A little window onto the mountain while your music keeps playing. Check the summit, watch the weather move in, or leave your favorite views rotating beside your work. The **SkiCams** tab lives right before **Game**—conditions first, questionable decisions second.

![MattAMP SkiCams showing Heavenly Top of Tram, automatic camera rotation, and workstation meters](docs/images/skicams.png)

The starting lineup:

| Resort | Cameras |
| --- | --- |
| Sierra-at-Tahoe | Grandview · West Bowl |
| Heavenly | Top of Tram |
| Kirkwood | Cornice Cam |

**Make it your mountains:** choose **Manage cams** (or **Settings → Your SkiCams**), then **Add camera**. Give it a name, optionally a resort, and paste a public HTTPS camera link. YouTube live links and direct camera players fit best; resort pages work too, with their own navigation. Edit, reorder, or remove favorites, with undo for removals.

**Let it roam:** turn on **Auto-cycle** and choose **1, 5, 15, 30, or 60 minutes**. It starts off, with 15 minutes selected. Rotation follows your saved order while SkiCams is visible, pauses when you leave, and restarts the interval when you choose a camera manually.

Cameras stay muted so DI.FM or an audio podcast can keep playing. Hidden YouTube podcasts pause. Streams, weather, daylight, and uptime belong to the resort; **Refresh** reconnects, and **Browser** opens the provider page if an embed won't cooperate.

<details>
<summary>Your camera lineup, in Settings</summary>

![SkiCams settings with the four default cameras and controls to add, edit, reorder, or remove them](docs/images/skicams-settings.png)

Your favorites and rotation preferences stay on your machine. No MattAMP account or API key is needed for the included public cameras.

</details>

## Tiny tanks. Questionable decisions.

**AMP Artillery** is an untimed, last-tank-standing skirmish against **3–5 bots**. Pick a skill from **Very dumb** to **Human-ish**, enter your three-letter arcade initials, and start rearranging the landscape. Your initials also name your tank on the battlefield and health roster.

![Expanded AMP Artillery battlefield with five tanks labeled with arcade names and aiming controls](docs/images/artillery.png)

Power now uses a gentler **1–100%** scale, starting at **50%**, so close shots have room on the dial. Bot shots briefly show the shooter’s angle and power; toggle this in **Settings → Game**.

You get unlimited shells and **three MIRVs**, each splitting into five warheads. Terrain deforms, splash damage hurts, falling hurts, and wind occasionally decides that your carefully calculated shot belongs in another postcode.

**New in v0.3.0:** getting knocked out puts you in spectator mode. The bots finish their fight on-screen, and the survivor does a dumb little victory dance—occasionally a wheelie. Scores and grudges use the actual final result.

The bots have opinions. They can return fire, remember who hurt them across three completed battles, and gang up on a repeat winner—including another bot. Good hits and spectacular misses earn dry, sarcastic cartoon heckles.

### The controls

| Do this | With this |
| --- | --- |
| Start a battle | Click the preview battlefield or **Start battle** |
| Aim left / right | **← / →**, the Angle slider, or click the sky |
| Increase / decrease power | **↑ / ↓** or the Power slider |
| Adjust precisely with the wheel | Hover **Angle** or **Power**; wheel over the battlefield changes power |
| Choose ammunition | **Shell / MIRV** buttons |
| Fire | **Enter** or **Fire!** |
| Make room for destruction | **Expand**, then resize; your size stays through new battles until you change tabs |
| Fill the screen | Title-bar **Maximize** beside minimize; click it again to restore your previous size |
| Return from expanded play | **Restore** or **Esc** |
| Play another match | Click the finished battlefield; keyboard users can focus it and press **Enter / Space** |

### Choose your chaos

| Mode | What the next arena throws at you |
| --- | --- |
| **Off** | Rolling hills, normal gravity, open sides. Wind stays fixed for the entire battle. |
| **Mixed — default** | One of five terrains, plus altered gravity **or** special walls. |
| **Unhinged** | Varied terrain, altered gravity **and** special walls. |

Moonshot gravity floats your shots. Heavy gravity brings them home early. Ricochet walls bounce them back; wraparound walls send them through the other side. Each terrain type rolls fresh heights, widths, slopes, and asymmetry; even normal rolling hills get a new silhouette. Tank pads blend into the landscape. The preview shows the actual arena you'll play. With Chaos Off, wind is rolled once for the battle; Mixed and Unhinged change it each turn. Terrain style, gravity, and wall rules stay fixed for that match.

**Humans and bots share a local top-ten leaderboard**, using the same scoring rules. Bots are marked by name; your lifetime wins stay separate. Existing human scores remain, and bot entries begin with newly completed battles. There is no turn timer. Radio or an audio podcast can keep playing. Leaving the game pauses the battle.

<details>
<summary>And if you win? We may have overdone it.</summary>

![MattAMP's gold 3D tank trophy, orbiting rings, and confetti celebration](docs/images/victory.png)

Nine seconds of a GPU-rendered gold tank, moving camera, lights, 2,400 pieces of confetti, and a fanfare. An entirely proportionate response to defeating Floppy.

**Back to scores** or **Esc** skips it. Reduced motion gives you a still scene; a WebGL failure falls back to a static victory message. Your score saves independently of the spectacle.

</details>

[Game rules, scoring, wind, and rivalries →](docs/artillery.md)

## Something good in your ears

### DI.FM

**Future Synthpop · Classic Trance · Deep House · Synthwave · Progressive · Liquid DnB · Chillout · PsyChill**

Bring your own **DI.FM Premium subscription with external-player access**. Open MattAMP's **Settings → DI.FM settings**, find your Premium listen key, paste only the key into MattAMP, save, and choose a station. Covers load from DI.FM's provider catalog.

The key is encrypted when a protected system keyring is available. Otherwise it stays in memory for that session; MattAMP does not save a plaintext fallback.

### Podcasts

**Last Week in AI · AI for Humans · All-In · Dwarkesh Podcast · The a16z Show**

Those are the starting favorites. In **Settings → Your podcasts**, add your own YouTube channel/playlist or RSS feed links, then edit, reorder, or remove shows. A full-episode playlist gives the most control over what appears.

Choose **YouTube** for full video episodes or **Audio feed** for RSS audio. The YouTube selection filters out Shorts and clips, and starts at **1×** unless you've saved another speed. Audio gets seek, skip, speed, and resume controls. Only one radio/podcast source plays at a time.

Radio and audio can follow you into SkiCams, the game, X, or tiny bug mode. **YouTube pauses when its player is hidden.** Some uploads block embedding; the external **YouTube** button and **Audio feed** are your alternatives.

## A little signal from X

**AI circle** filters X's Latest search to Boris Cherny, Peter Steinberger, Andrej Karpathy, Simon Willison, and Chamath, with AI-topic filtering. **For giggles** gives Elon his own lane. **Filters** lets you change the handles and topic restriction.

Sign in on X's own page inside the app. The session stays in MattAMP. **Browser** opens the same search using your normal browser's login; Google/Apple sign-in stays there and does **not** sign in the embedded pane. See [X sign-in and limitations](docs/guide.md#xtwitter).

## Make yourself at home

**A lighter navigation bar:** DI.FM, Podcasts, Twitter, SkiCams, and Game are icons and text, with a soft hover highlight and mint for the active tab. The strip is 70% opaque with a subtle blur, so the live background can show through. It stays pinned as you scroll, along with the bare title-bar icons. Keyboard focus rings and full click targets remain.

The navigation refresh and optional Retro skin are included in [MattAMP 1.0.0](docs/release-1.0.0.md). Upgrading from v0.3.0 preserves your saved settings and scores.

| Control | What happens |
| --- | --- |
| Layout button | Switch between sidecar and stacked layouts |
| Compact button | Trim the player down |
| Bug button | Collapse to a draggable **56 × 56** logo; click it to restore |
| Maximize / Restore | Fill the screen, then return to your previous size |
| Settings | Your podcasts, SkiCams, radio setup, live background, and other preferences |
| Minimize **−** | Hide to the tray |
| Close **×** | Quit MattAMP |
| **Details** under the meters | Show memory, VRAM, and GPU temperatures |

### Back to 1997

**Introduced in [MattAMP 1.0.0](docs/release-1.0.0.md); now choose Settings → Appearance → ’90s** (the 1.0 release calls it Retro mode). The modern glass skin remains the default. Choose ’90s for dark beveled metal, lime-green displays, numbered station rows, and the kind of controls that look like they ought to weigh something.

![Retro MattAMP with numbered radio presets, an active audio spectrum, segmented system meters, and CPU history](docs/images/retro.png)

Brushed-aluminum transport keys, a green volume rail, a rectangular metal fader, and four tiny corner rivets. Yes, we spent time on the rivets.

![Close-up of Retro playback controls and the recessed volume faceplate with four metallic corner rivets](docs/images/retro-controls.png)

- **Meters with a job:** the radio spectrum follows actual audio. CPU, memory, and GPU segments show real utilization; the lower chart tracks the last two minutes of CPU samples. Network speeds read in **Kbps**, and RAM/VRAM capacities in **MiB**.
- **Menus that do things:** File, View, Options, and Presets provide Settings, layout, playback, and station shortcuts. Help has opinions about your missing MP3 folder.
- **The sound of getting online:** enabling Retro plays an original synthesized modem handshake. It obeys volume, mute, and **Silly sound effects**. Loading a saved Retro preference at startup does not replay it.
- **A skin change, mid-session:** your music and battle continue. The preference is saved locally; switching back restores your chosen live background.

The spectrum is radio-only and rests when playback stops. It pauses when hidden or under reduced motion; YouTube and remote podcast audio keep their usual playback path. These two previews use an isolated demo profile with synthetic test audio to exercise the real spectrum and live workstation readings. No Premium key or personal account is included.

### Even more retro: //e

**New in [MattAMP 1.1.0](docs/release-1.1.0.md): Settings → Appearance → //e — even more retro.**
The Apple IIe-inspired sibling to ’90s mode: black screen, green outlines,
bitmap lettering, blue selections, and station artwork dithered into a
16-entry display palette. No floppy swapping required.

![MattAMP //e with green outlines, dithered station artwork, blue selected preset, and colorful live meters](docs/images/apple2.png)

Bandwidth reads in **bps**, with your download speed compared against a
**300-bps acoustic-coupler modem**. The numbers are still real. Click the modem
message for a little Havre-to-Boston BBS nostalgia: the software is free;
the phone bill is not.

Choosing //e plays a short original coupler-inspired chirp and robotic
“MattAMP ready. Let's get serial.” greeting. **Silly sound effects**, mute,
and volume control it; restarting in a saved theme does not replay it.
**Subtle scanlines** is a separate, optional setting, off by default.

This is a usable modern player wearing an old computer's colors, not an Apple II
or Echo II+ emulator. Video, camera and X content keep their native rendering.
The radio spectrum observes real audio; CPU history is separately labeled.
The screenshot uses an isolated profile with synthetic test audio and actual
workstation telemetry. Install version 1.1.0 or later to use //e.

### More ways to make it yours

**Optional nonsense:** “Send it!” for SkiCams, an action-hero “Hell yeah!” for Game, “Meh” for Podcasts/Twitter, and a long “Yeeeeah” for DI.FM. Switch **Silly sound effects** off in Settings whenever civilization requires it.

**Live backgrounds:** Particle flow, Water waves, Starfield, Mandelbrot zoom, or Off. They react gently to the mouse. Mandelbrot wanders through different regions with glides, curves, and spirals—a little Fractint affection, without turning the room into a flashlight. Animation pauses when hidden or in bug mode and respects reduced motion.

CPU, memory, and network readings update every two seconds. Download and upload rates display in Mbps in Modern, Kbps in ’90s, and bps in //e, including compact mode. RAM and GPU memory readouts use MiB. NVIDIA GPU readings use `nvidia-smi`; absent sensors show as unavailable. Expand network status for router/internet checks.

## Bonus disk: the 300 bps edition

There is now an actual [Applesoft BASIC companion](extras/apple-iie/README.md) in the repo: a colorful, silent radio/modem demo and a playable four-tank artillery game. Green borders, chunky graphics, three bots, and `1250000 BPS = 4167 OLD MODEMS!`

[Load the BASIC listing](extras/apple-iie/MATTAMP.bas) in a browser interpreter or transfer it to your Apple II setup. This is a separate offline adaptation; the modern app and its streaming features stay right here in the present.

## The practical bits

- **Local data:** settings, playback positions, X sessions, and arcade scores stay under `~/.config/workstation-deck/`. The old internal name preserves existing installs. [Storage and privacy](docs/guide.md#local-data-and-privacy)
- **Updates:** manual. There is no auto-updater or automatic launch at login. [Update and uninstall](docs/development.md#updating-and-uninstalling)
- **Trouble:** [launch errors, radio, YouTube feeds, X login, and missing meters](docs/guide.md#troubleshooting).
- **Credits:** Winamp and Fractint supplied the nostalgia; Scorched Earth inspired the artillery. Bundled retro artwork and audio retain their original copyrights. This repo does **not** grant a blanket license to redistribute them. See [asset credits](assets/arcade/README.md) and [startup audio provenance](docs/guide.md#startup-audio-and-credits).

A fun personal app that escaped the desktop. Bring headphones. Blame the wind.
