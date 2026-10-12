#!/usr/bin/env bash
# kit/shot.sh <page.html[?query]> <out.png> [waitMs=3000] [evalExpr]
# Real-time screenshot via Windows Edge over CDP (WSL Chromium lacks system libs). Prints page errors.
set -euo pipefail
page="${1%%\?*}"; query=""; [[ "$1" == *\?* ]] && query="?${1#*\?}"
win=$(wslpath -w "$(realpath "$page")")
url="file:///$(printf '%s' "$win" | sed 's#\\#/#g; s# #%20#g')$query"
mkdir -p "$(dirname "$2")"; out=$(wslpath -w "$(realpath -m "$2")")
here=$(wslpath -w "$(dirname "$(realpath "$0")")/shot.mjs")
exec node.exe "$here" "$url" "$out" "${3:-3000}" "${4:-}"
