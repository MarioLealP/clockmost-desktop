#!/bin/bash
# Install one or more package lists (on the running system). Usage: scripts/install-list.sh packages/x.txt ...
set -euo pipefail
cd "$(dirname "$0")/.."
sudo pacman -S --needed --noconfirm $(grep -h -v -E '^\s*(#|$)' "$@")
