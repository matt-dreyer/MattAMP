#!/usr/bin/env bash
# Build a shareable archive from committed source and clean production dependencies.
set -euo pipefail
mattamp_root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$mattamp_root"
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'This builder targets Linux x86-64.' >&2; exit 1; }
git diff --quiet && git diff --cached --quiet || { echo 'Commit tracked changes before packaging.' >&2; exit 1; }
mattamp_version=$(node -p 'require("./package-lock.json").packages["node_modules/electron"].version')
[[ -r node_modules/electron/dist/version && $(cat node_modules/electron/dist/version) == "$mattamp_version" ]] || { echo 'Run npm ci to install the pinned Electron runtime first.' >&2; exit 1; }
mattamp_output="${1:-$mattamp_root/dist}"
mkdir -p "$mattamp_output"
mattamp_output=$(realpath "$mattamp_output")
mattamp_stage=$(mktemp -d "${TMPDIR:-/tmp}/mattamp-package.XXXXXX")
trap 'rm -rf -- "$mattamp_stage"' EXIT
mattamp_commit=$(git rev-parse --short HEAD)
mattamp_name="MattAMP-linux-x64-$mattamp_commit"
mkdir "$mattamp_stage/MattAMP"
git archive HEAD | tar -x -C "$mattamp_stage/MattAMP"
(
 cd "$mattamp_stage/MattAMP"
 npm ci --omit=dev --ignore-scripts --no-audit --no-fund --prefer-offline
)
cp -a node_modules/electron/dist "$mattamp_stage/MattAMP/node_modules/electron/"
printf 'MattAMP Linux x86-64\nSource commit: %s\nElectron: %s\n' "$(git rev-parse HEAD)" "$mattamp_version" > "$mattamp_stage/MattAMP/BUILD.txt"
(
 cd "$mattamp_stage"
 zip -qr -y "$mattamp_name.zip" MattAMP
)
mv "$mattamp_stage/$mattamp_name.zip" "$mattamp_output/$mattamp_name.zip"
git archive --format=zip --prefix=MattAMP/ --output="$mattamp_output/MattAMP-source-$mattamp_commit.zip" HEAD
(
 cd "$mattamp_output"
 sha256sum "$mattamp_name.zip" "MattAMP-source-$mattamp_commit.zip" > "$mattamp_name.sha256"
)
printf 'Ready to share: %s/%s.zip\n' "$mattamp_output" "$mattamp_name"
