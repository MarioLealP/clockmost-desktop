#!/bin/bash
# Disk layout (CachyOS installer's btrfs layout, done by hand). DESTROYS $DISK.
# Usage (from the Arch live ISO, as root): DISK=/dev/nvme0n1 bash 10-disk.sh
set -euo pipefail
DISK=${DISK:?set DISK, e.g. /dev/nvme0n1}
P=$DISK; [[ $DISK == *nvme* || $DISK == *mmcblk* ]] && P=${DISK}p
sgdisk --zap-all "$DISK"
sgdisk -n1:0:+1G -t1:ef00 -c1:EFI -n2:0:0 -t2:8300 -c2:cachyos "$DISK"
partprobe "$DISK"; sleep 1
mkfs.fat -F32 -n EFI "${P}1"
mkfs.btrfs -f -L cachyos "${P}2"
mount "${P}2" /mnt
for sv in @ @home @root @srv @cache @tmp @log; do btrfs subvolume create /mnt/$sv; done
umount /mnt
O=noatime,compress=zstd:1,space_cache=v2
mount -o $O,subvol=@ "${P}2" /mnt
mkdir -p /mnt/{boot,home,root,srv,var/cache,var/tmp,var/log}
mount -o $O,subvol=@home  "${P}2" /mnt/home
mount -o $O,subvol=@root  "${P}2" /mnt/root
mount -o $O,subvol=@srv   "${P}2" /mnt/srv
mount -o $O,subvol=@cache "${P}2" /mnt/var/cache
mount -o $O,subvol=@tmp   "${P}2" /mnt/var/tmp
mount -o $O,subvol=@log   "${P}2" /mnt/var/log
mount -o umask=0077 "${P}1" /mnt/boot
findmnt -R /mnt -o TARGET,SOURCE,OPTIONS | cut -c1-110
