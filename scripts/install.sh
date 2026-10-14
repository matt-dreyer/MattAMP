#!/usr/bin/env bash
set -euo pipefail
deck_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/128x128/apps"
cat > "$HOME/.local/bin/workstation-deck" <<EOF
#!/usr/bin/env bash
set -e
cd '$deck_root'
exec '$deck_root/node_modules/electron/dist/electron' '$deck_root' "\$@"
EOF
chmod +x "$HOME/.local/bin/workstation-deck"
ln -sfn workstation-deck "$HOME/.local/bin/mattamp"
cp "$deck_root/assets/icon.png" "$HOME/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png"
cat > "$HOME/.local/share/applications/ai.fshbwl.deck.desktop" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=MattAMP
Comment=Radio, podcasts and workstation monitor
Exec=$HOME/.local/bin/mattamp
Icon=$HOME/.local/share/icons/hicolor/128x128/apps/ai.fshbwl.deck.png
Terminal=false
Categories=AudioVideo;Audio;System;Monitor;
StartupWMClass=ai.fshbwl.deck
EOF
command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true
printf 'Installed MattAMP launcher. Run: %s/.local/bin/mattamp\n' "$HOME"

if [[ -r /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]] && [[ $(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns) == 1 ]]; then
  printf 'Ubuntu sandbox setup (once per checkout path): %s/scripts/install-sandbox-profile.sh\n' "$deck_root"
fi
