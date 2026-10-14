#!/usr/bin/env bash
# Ubuntu 24.04+ desktop launches need permission to create Electron's sandbox.
set -euo pipefail
if [[ $EUID -ne 0 ]]; then
  exec pkexec /bin/bash "$(realpath "$0")"
fi
mattamp_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
mattamp_binary="$mattamp_root/node_modules/electron/dist/electron"
[[ -x "$mattamp_binary" ]] || { echo 'Install Electron dependencies first.' >&2; exit 1; }
[[ "$mattamp_binary" != *'"'* && "$mattamp_binary" != *$'\n'* && "$mattamp_binary" != *'{'* && "$mattamp_binary" != *'*'* && "$mattamp_binary" != *'?'* && "$mattamp_binary" != *'['* ]] || exit 1
mattamp_profile=$(mktemp)
trap 'rm -f "$mattamp_profile"' EXIT
cat > "$mattamp_profile" <<EOF
abi <abi/4.0>,
include <tunables/global>
profile mattamp "$mattamp_binary" flags=(unconfined) {
  userns,
}
EOF
apparmor_parser --skip-kernel-load "$mattamp_profile"
install -o root -g root -m 644 "$mattamp_profile" /etc/apparmor.d/mattamp
apparmor_parser -r /etc/apparmor.d/mattamp
printf 'MattAMP sandbox profile installed.\n'
