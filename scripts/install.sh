#!/usr/bin/env bash
set -euo pipefail
deck_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/128x128/apps"
cat > "$HOME/.local/bin/workstation-deck" <<EOF
#!/usr/bin/env bash
cd '$deck_root'
exec '$deck_root/node_modules/.bin/electron' '$deck_root' "\$@"
EOF
chmod +x "$HOME/.local/bin/workstation-deck"
cp "$deck_root/assets/icon.png" "$HOME/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png"
cat > "$HOME/.local/share/applications/ai.fshbwl.deck.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=DECK
Comment=Radio, podcasts and workstation monitor
Exec=$HOME/.local/bin/workstation-deck
Icon=$HOME/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png
Terminal=false
Categories=AudioVideo;Audio;System;Monitor;
StartupWMClass=workstation-deck
EOF
command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true
printf 'Installed DECK launcher. Run: %s/.local/bin/workstation-deck\n' "$HOME"
