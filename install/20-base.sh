#!/bin/bash
# Install the base onto /mnt (after 10-disk.sh), from the Arch live ISO with the CachyOS repos
# added to the live pacman.conf (cachyos-repo.sh). Usage: VM=1 bash 20-base.sh < (lists on stdin? no: run from the repo dir)
set -euo pipefail
cd "$(dirname "$0")/.."
pkgs() { grep -v -E '^\s*(#|$)' "$1"; }
LIST=$(pkgs packages/base.txt); [[ ${VM:-0} == 1 ]] && LIST+=$'\n'$(pkgs packages/vm.txt)
pacstrap -K -P /mnt $LIST
genfstab -U /mnt > /mnt/etc/fstab
