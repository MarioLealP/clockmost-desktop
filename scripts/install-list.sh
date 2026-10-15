#!/bin/bash
# Install one or more package lists (on the running system).
# Usage: scripts/install-list.sh plasma-core apps ...  (list names, or paths like packages/x.txt)
set -euo pipefail
cd "$(dirname "$0")/.."
lists=()
for a in "$@"; do
    [ -f "$a" ] && lists+=("$a") || lists+=("packages/$a.txt")
done
sudo pacman -S --needed --noconfirm $(grep -h -v -E '^\s*(#|$)' "${lists[@]}")
