---
name: MattAMP
description: Approved modern desktop design with optional classic metal and color-computer appearances.
# Retro-prefixed tokens describe the ’90s appearance; apple2-prefixed tokens override only //e.
# The existing modern design below remains authoritative and unchanged.
colors:
  retro-shell: "#14191f"
  retro-screen: "#070d0e"
  retro-edge: "#626b79"
  retro-text: "#d4d9df"
  retro-muted: "#abb5bd"
  retro-green: "#a4e55e"
  retro-amber: "#e6bd68"
  retro-volume-fill: "#8ce430"
  apple2-black: "#000"
  apple2-edge: "#32684c"
  apple2-text: "#e6e6da"
  apple2-muted: "#a4b6a7"
  apple2-mint: "#74c7ae"
  apple2-amber: "#d5cb77"
  apple2-blue: "#193c83"
  apple2-cyan: "#329ad1"
  apple2-green: "#63c563"
  apple2-play: "#176744"
  apple2-orange: "#dd723b"
  apple2-hover: "#122b1b"
  apple2-track: "#09120d"
typography:
  apple2-body:
    fontFamily: "MattPixel, monospace"
    fontSize: "18px"
    lineHeight: 1.15
  apple2-title:
    fontFamily: "MattPixel, monospace"
    fontSize: "28px"
    lineHeight: 1
    letterSpacing: "0"
  apple2-support:
    fontFamily: "MattPixel, monospace"
    fontSize: "16px"
    lineHeight: 1.2
  apple2-source-label:
    fontFamily: "MattPixel, monospace"
    fontSize: "17px"
    lineHeight: 1
  retro-body:
    fontFamily: "'Courier New', ui-monospace, monospace"
  retro-title:
    fontFamily: "'Courier New', monospace"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  retro-source-label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "11px"
rounded:
  apple2-square: "0"
  retro-control: "1px"
  retro-shell: "3px"
  retro-screen: "0"
spacing:
  apple2-gap: "5px"
  apple2-panel-margin: "6px"
  retro-gap: "4px"
  retro-panel-margin: "6px"
components:
  apple2-display:
    backgroundColor: "{colors.apple2-black}"
    textColor: "{colors.apple2-text}"
    typography: "{typography.apple2-body}"
    rounded: "{rounded.apple2-square}"
    padding: "9px"
  apple2-play:
    backgroundColor: "{colors.apple2-play}"
    textColor: "{colors.apple2-text}"
    rounded: "{rounded.apple2-square}"
  apple2-playlist-selected:
    backgroundColor: "{colors.apple2-blue}"
    textColor: "{colors.apple2-text}"
    rounded: "{rounded.apple2-square}"
    padding: "2px 6px"
  apple2-volume-thumb:
    backgroundColor: "{colors.apple2-text}"
    rounded: "{rounded.apple2-square}"
    width: "10px"
    height: "19px"
  retro-display:
    backgroundColor: "{colors.retro-screen}"
    textColor: "{colors.retro-green}"
    rounded: "{rounded.retro-screen}"
    padding: "9px"
  retro-transport-button:
    rounded: "{rounded.retro-control}"
    padding: "5px"
  retro-volume-thumb:
    rounded: "{rounded.retro-control}"
    width: "12px"
    height: "21px"
  retro-playlist-row:
    backgroundColor: "{colors.retro-screen}"
    textColor: "{colors.retro-green}"
    rounded: "{rounded.retro-screen}"
    padding: "2px 5px"
---

# Approved MattAMP design

Preserve the approved MattAMP layout and interactions described below. The implementation in `src/` is the durable design reference.

Shell #232b34, titlebar #303b46, inset #111b23, edge #536271, foreground #e1e8ed, secondary #a8b9c7, accent #9ccab0, warning #dfb574. System font, 12–14px controls; monospace only for measurements. Compact native desktop controls. No bright panels. The user-requested optional live background is the exception to avoiding looping decoration: slow, low-contrast blue-green particle flow, water waves, a denser drifting starfield a gradual Mandelbrot zoom, or an endless vector trench behind the app controls. Density increases the number of particles, stars and wave lines without increasing their brightness. Mandelbrot uses subdued blue-green contours, randomized 150–210-second journeys across six detailed regions with horizontal/vertical glides, arcs or slowly rotating spirals. Routes meet smoothly at the wide view, avoid immediate repeats, and retain mouse parallax. Rendering stays at 18 fps and a 640-pixel render cap; no WebGL means a static fractal. The radio station card uses a 62% opaque inset tint so ambient motion can show through while its text and artwork stay fully opaque. Preserve readability and pointer access; keep provider and video surfaces unchanged. Hide and stop the effect when off, hidden, in bug mode or under reduced motion.

Sidecar: media left, telemetry right. Stack: media above telemetry. DI.FM/Podcasts switch in the media panel. Full, compact and 56px bug states. Bug uses the audio-lines mark with a network dot, click to restore. Real YouTube embed retains native controls and visible viewport. Backend states drive play/error/availability labels.

Ambient effects respond gently to the mouse over MattAMP: particle flow bends around the pointer, waves form local ripples, stars shift with depth, and Mandelbrot pans slightly. Responses ease in and out, leave clicks and scrolling to the existing controls, and stop with the background under Off, hidden, Bug mode or reduced motion. Embedded provider surfaces retain their own mouse handling.

Buttons and selects use the approved dark glass treatment: translucent blue-gray fills, a restrained directional sheen, 8 px backdrop blur, and thin cool edges. Station presets use 9 px corners; other controls use 8 px, titlebar controls 6 px, and the Bug retains 16 px. Selected controls and primary playback use mint-tinted glass with fully opaque text and artwork. Hover adds definition without a bright flash. Keep opaque select menus and an opaque fallback for unavailable blur or reduced-transparency preferences.

The Game tab contains AMP Artillery: a dim navy sky, muted layered ridges and Metal Slug pixel-art tanks with team-colored aim sights, name labels and health. Composite the sky and ridges at 82% opacity over the live background; keep tanks, shots, labels and sights fully opaque. Game controls use denser glass than the media tab (66% base, 74% primary), and comic bubbles use a 94% opaque sage fill. Respect reduced-transparency with solid surface backgrounds. Use native labeled angle/power sliders, always-visible Shell/MIRV radio choices with a remaining MIRV count, and a clear Fire button; keep status and health readable outside the canvas. Angle, Power, small horizontal Shell/MIRV radios and Fire share one baseline at the normal wide and 430-pixel sizes; only container widths below 366 pixels wrap to two columns. Keep the MIRV count, with unlimited shells identified accessibly. Show a restrained amber monospace score and an expandable local arcade table. One compact pale-sage comic bubble may sit above the speaking tank, with a tail, speaker name and short quip. Clamp it inside the battlefield at narrow widths and keep it clear of the tank and aim controls. No screen shake or flashing white explosions. Game motion pauses when the panel is not visible.

The victory ceremony is an intentional Experience-mode exception to the quiet pixel-art game: an extravagant gold awards show on a dark navy stage. Use self-hosted Cormorant Garamond for “Glorious overkill.” above the score, an original metallic 3D tank and pedestal, orbiting rings, blue/gold moving light cones and dense GPU confetti. Perspective camera glides while the tank rotates. Keep the source tabs and title bar accessible, the ceremony bounded to nine seconds, and a persistent Back to scores / Esc control at the bottom. Cap render pixel ratio at 1.5. No white flash or screen shake. Reduced motion renders once; fallback retains the headline, score and dismissal. Sarcastic adult tank heckles retain the existing compact comic bubble style.

Expand/Restore sits beside Sound in the game heading. Expanded mode uses most of the current display and allows edge resizing without the content autosizer shrinking it back. Center the larger battlefield at its native 1000:540 aspect ratio, sizing it against viewport height; preserve compact controls below, readable pixel art, the source tabs and title bar.

The artillery setup includes a compact Chaos select (Off / Mixed / Unhinged), default Mixed. Keep its native dark glass styling beside skill and bots; in the stacked widget, Start gets its own row. Show the rolled terrain, gravity and wall rules in a quiet readable line before and during play. Setup terrain is the real arena, not an unrelated illustration. Solid amber side rails mean ricochet; dashed lavender rails mean wraparound. Keep the ceiling open and split trails at portals. Record arena conditions in the scoreboard with internal horizontal scrolling on narrow widgets.

# Optional Retro variant

The sections below describe **’90s** in the saved **Appearance** selector (`retro` internally). The //e section overrides only its own optional appearance. They do not replace any modern design guidance above. Sources: `src/retro.css`, `src/retro.js`, and the theme integration in `src/app.js` and `src/index.html`.

## Overview

**Creative North Star: "Classic metal and green LED player"**

The user-approved Winamp reference supplies dark metal bevels, green inset screens and segmented LED meters. This is an optional material and typography variant of MattAMP's existing desktop layouts. Modern remains the default; the Settings Appearance selector offers Modern, ’90s and //e — even more retro, and saves the user's choice.

Retro uses opaque metal and inset surfaces. While enabled, it temporarily suppresses the ambient background without replacing the saved ambient choice. Switching the skin preserves playback and media state.

**Key Characteristics:**
- Dark metal edges, recessed screens and nearly square controls.
- Green monospace radio labels, numbered artwork playlist and LED telemetry.
- Existing Sidecar, Stack, compact, Settings, Game and Bug behavior.

## Colors

The `retro-` frontmatter tokens are scoped to this variant: Green carries radio information and selected emphasis; Amber carries keyboard focus. Shell and Screen provide the dark metal and recessed ground. Edge supplies structural dividers; Text and Muted keep labels and supporting status distinct. Live meter segments progress from green through yellow to amber; unlit segments remain dark.

**The Scoped Skin Rule.** Apply Retro tokens only while Retro mode is enabled; retain the modern palette and glass treatment otherwise.

## Typography

Use the Retro body and title roles for the classic monospace voice. Source tabs remain system sans-serif at the Retro source-label size; detailed telemetry descriptions also retain system sans-serif. Metadata and canvas captions use small readable labels (11px), while menus and playlist rows use compact labels (12px). The brand remains modest (14px), reducing in the narrowest layout (12px).

## Layout

Keep the approved Sidecar and Stack composition. Retro adds a titlebar menu row, a recessed radio display, a framed transport and a vertical station playlist with two-digit numbering and retained station artwork. Common panel margins use the Retro panel-margin token. Desktop radio artwork is square (88px); playlist artwork is small (23px). Compact mode retains its existing hidden playlist/telemetry behavior and uses the shorter spectrum (24px high instead of 44px).

At widths up to 700px the classic menus wrap below the title controls. At widths up to 550px telemetry receives equal margins; explicit Stack mode does the same. At widths up to 380px source icons stack above their labels. Bug mode suppresses the additional Retro chrome and canvases. Game preserves its battlefield, native controls and full-width layout within the themed shell; embedded provider/video content retains its own appearance.

## Elevation & Depth

Depth is structural: a ridge shell border (4px), groove screen frames (3px), and outset controls (2px). Pressed controls switch to inset borders. Retro removes glass blur and control transitions; it uses opaque metal gradients instead. Most controls have no shadow. The brushed aluminum transport is the exception: bright inset highlights and a short dark shadow make the metal keys tactile, while pressing them reverses the edge lighting and recesses the shadow. The shell has a dark inset rim (`inset 0 0 0 2px #05070a`), and open menu panels have a compact drop shadow (`3px 4px 8px #0009`). Full examples live in the optional-variant sidecar.

## Shapes

Use the Retro shell, control and screen radii from the frontmatter. Artwork is square. Recessed LED tracks use a segmented rectangular grid with dark gaps; avoid turning them into smooth rounded progress pills.

## Components

### Buttons and inputs

General metal buttons and selects retain the dark outset bevel; buttons brighten on hover and recess when pressed. Transport keys use brushed aluminum with fine horizontal grain, asymmetric lit edges and dark icons. Play retains the same tactile treatment in green. Keep the separate mute button quiet inside the volume housing. Keyboard focus remains a visible amber outline (2px, offset 2px); menu summaries place the outline inside their bounds.

The volume fader sits in a recessed dark metal faceplate with four small domed silver rivets, one in each corner. The rivets stay outside the slider hit area and never intercept input. Its thin rectangular rail (6px high) fills with the Retro volume-fill color to the current volume value; the remainder stays dark. A narrow rectangular metal thumb uses the frontmatter dimensions and a central dark grip. Preserve native range interaction and the numeric volume display; mute continues to show zero without erasing the saved volume setting. The Settings **Appearance** selector labels this variant **’90s**. Legacy `retro: true` preferences migrate to it.

Enabling Retro explicitly plays a short original synthesized modem handshake (6.4 seconds) through the existing tab-sound channel. Respect volume, mute and **Silly sound effects**; cap the cue volume at 65%. Disabling Retro, hiding the app or entering Bug mode stops the cue. Restoring a saved Retro preference at startup does not replay it.

### Navigation

File, View, Options and Presets menus invoke existing application actions; Help carries the MP3-folder joke. Opening one menu closes the others; outside click closes them, and Escape closes them and restores focus. Keep these menus outside the draggable titlebar region. Source tabs retain recognizable icons, labels and selected state with a green face and contrasting border.

### Playlist

Use a single vertical list with two-digit row numbers, official station artwork and names. Highlight the selected row with a green inset surface and a thin green outline. Preserve station selection and previous/next controls; previous/next are disabled for podcasts.

### Spectrum and telemetry

The audio spectrum uses actual same-origin radio audio analysis, with 40 LED columns and a maximum drawing rate of 20 fps. It observes playback without replacing the audio output. Label live, idle, unavailable, radio-only and reduced-motion states honestly. Hidden, Settings, Bug and reduced-motion states stop active spectrum work; unavailable or paused audio never receives invented animated levels.

CPU history is a separate, explicitly labeled measurement chart: 60 samples from the existing two-second telemetry cadence, covering the last two minutes. Missing readings remain unlit. Hardware meters retain real CPU, memory and GPU values; their segmented treatment is visual only. Modern bandwidth uses Mbps; ’90s uses Kbps; //e uses bps. This also applies to compact status. RAM/GPU memory amounts use MiB across appearances. Keep the unit beside the amount; utilization remains a percentage.

## Do's and Don'ts

### Do:
- **Do** keep Retro optional, persisted and off by default.
- **Do** preserve media playback, current layout, provider content and the saved ambient choice when switching skins.
- **Do** label live audio analysis and CPU history separately and expose unavailable readings honestly.

### Don't:
- **Don't** apply these tokens or bevels to the modern default.
- **Don't** animate fabricated spectrum data or run active spectrum work while hidden or under reduced motion.
- **Don't** replace actual menu actions or station controls with decorative imitations.


# Optional //e variant

The following scoped extension applies only to **//e — even more retro** (`apple2` internally). It preserves the Modern and ’90s guidance above. Implementation sources: `src/apple2.css`, `src/apple2.js`, `src/app.js`, `src/retro.js`, `src/appearance.cjs` and `src/main.cjs`.

## Overview

**Creative North Star: "Color-computer radio desk"**

The user-approved color Apple IIe homage adds a third optional appearance without replacing Modern or ’90s. Black surfaces, subdued green outlines, off-white bitmap-inspired type and blue selection keep the utility readable while coarse color artwork supplies the period character. This is a visual homage, not hardware emulation.

Both classic appearances suspend the saved ambient effect. //e keeps the established desktop layouts, live readings, playback and provider rendering. Its static scanlines are an independent saved option, off by default.

**Key Characteristics:**
- Black panels and subdued green rules; off-white labels and blue selected rows.
- Locally bundled bitmap-inspired type and ordered-dithered color station art.
- Real multicolor segmented telemetry, optional static scanlines and a user-triggered original greeting.

## Colors

The `apple2-` frontmatter tokens are normative for this appearance. Black grounds the surfaces; Edge provides subdued green structural rules. Text and Muted separate primary and supporting copy. Blue marks selected sources and playlist rows, with Cyan outlining selection; Mint carries provider labels and utility actions. Amber carries focus and measurements. Blue/cyan, Green, Amber and Orange form the live meter progression; Play supplies the green transport action.

Station images use the distinct 16-entry display-inspired palette in `src/apple2.js`. Its two gray entries intentionally match. A 4×4 ordered-dither matrix quantizes a 64×64 image before pixelated enlargement; this is not a composite-video simulation. Keep the interface tokens separate from the image palette.

**The Green Rule Rule.** //e structure uses subdued green rules; off-white belongs to readable text and the volume thumb, not bright panel outlines.

## Typography

MattPixel is the local CSS alias for VT323, bundled under the SIL Open Font License in `assets/fonts/VT323-OFL.txt`. Use the frontmatter body, title, support and source-label roles. The brand uses 22px type; spectrum captions use 15px, Settings prose uses 17px, and game support labels use the 16px support role. The redundant game eyebrow is hidden only in //e. Do not shrink support text to imitate low-resolution hardware at the expense of reading it.

## Layout

Preserve Sidecar, Stack, compact, Settings, Game and Bug behavior. //e hides the ’90s menu row and brand icon, retaining the title controls and source navigation. The radio display has a 6px margin and 9px padding; main artwork displays at 100px square, playlist artwork at 24px, and compact artwork at 72px. At widths up to 380px, source icons hide, labels use 16px, artwork becomes 80px and the title becomes 25px. Embedded providers keep native rendering; the game canvas and its behavior remain intact.

## Elevation & Depth

Use flat opaque black panels, square edges and thin green rules. Remove metal bevels, rivets, shadows and backdrop blur from //e chrome. The shell has a 2px border; panels and controls generally have 1px borders. Optional scanlines are a static three-pixel repeating overlay at 0.35 opacity, never animated; they do not receive pointer events and disappear in Bug mode.

## Shapes

Use square controls, artwork and scrollbar thumbs. Meter tracks are rectangular, 12px high, with three-pixel lit segments separated by two-pixel black gaps. Keep the native range interaction; the volume thumb uses the frontmatter dimensions and a black border, over a cyan fill.

## Components

### Controls and selection

Controls use black fills and green borders; hover uses the dark green Hover token. Selected sources, playlist rows, podcast/X choices and ammunition use Blue, with off-white text. Play and Fire use Play green. Keyboard focus uses a 2px Amber outline with a 1px offset. Preserve text labels, keyboard controls and accessible names. The Appearance selector saves one of Modern, ’90s and //e; it replaces the former Retro checkbox.

### Station artwork and meters

Use coarse ordered-dithered station art only while //e is active; retain original artwork for other appearances and fall back to it on conversion failure. The spectrum and CPU history retain the existing real-data sources and honest idle/unavailable labels. Spectrum work remains suspended while hidden, in Settings/Bug or under reduced motion. The multicolor segments are visual styling of actual values, not synthetic signal activity.

### Modem console and sound

Show measured bandwidth in bps, including compact status. The comparison uses the current actual download rate divided by 300 bps, rounded to an integer multiplier; it is not a speed-test maximum. Missing data says it is waiting. The clickable message cycles original “Let's get serial,” Havre, Montana–Boston pirate-BBS and RadioShack phone-bill jokes.

Explicit selection of //e may play the original coupler-inspired cue and robotic greeting, governed by Silly sound effects, volume and mute, with the existing 65% volume cap. Startup preference restoration never replays it. Appearance changes, hiding and Bug mode stop the cue. Do not describe the sound as Apple speech-hardware or modem emulation.

## Do's and Don'ts

### Do:
- **Do** scope //e styling and artwork conversion to the apple2 appearance.
- **Do** preserve clear focus, readable support text, native provider rendering and actual measurement states.
- **Do** keep scanlines off by default and restore the saved ambient choice on returning to Modern.

### Don't:
- **Don't** replace green rules with bright white outlines or turn the entire interface monochrome green.
- **Don't** fabricate live spectrum or bandwidth data, replay the greeting on preference restore, or claim hardware emulation.
- **Don't** apply //e typography or artwork processing to Modern, ’90s or embedded provider content.

### Trench Run

Star Wars vector-arcade-inspired geometric canyon, not a city skyline: gridded floor, stepped panel walls and low rim machinery. Use muted cyan #79b9cd and mint #9ccab0 at 4.5–27% opacity over the existing shell #232b34; preserve text #e1e8ed and secondary #a8b9c7. Keep existing typography and layouts. The vanishing point stays near center with gentle banking/parallax. Seeded, smooth procedural bends extend continuously with no short timed loop; distant lines fade into the shell. Render with bounded Canvas geometry and twelve batched strokes at the existing 24 fps cap. Occasional seeded wall-cannon volleys use short amber-red #da8b6a traces at at most 35.1% opacity; no flashes, impact effects or sound. No glow, textures, downloaded assets or camera shake. Preserve pointer access and the shared off/hidden/bug/reduced-motion pause behavior. Both classic themes continue to suppress the saved background.
