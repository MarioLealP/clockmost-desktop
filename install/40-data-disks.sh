#!/bin/bash
# Data disks (metal): SN770 -> games + ~/src, Seagate -> bulk. DESTROYS both. Run as root on the installed system.
set -euo pipefail
SSD=/dev/disk/by-id/nvme-WD_BLACK_SN770_1TB_2451DW400205
HDD=/dev/disk/by-id/ata-ST1000DM010-2EP102_Z9AJZ38R
U=benylin; H=/home/$U
mk() {  # disk label subvol...
  local d=$1 l=$2; shift 2
  wipefs -a "$d"-part* >/dev/null 2>&1 || true
  sgdisk --zap-all "$d" >/dev/null
  sgdisk -n1:0:0 -t1:8300 -c1:"$l" "$d" >/dev/null
  partprobe "$d"; udevadm settle; sleep 1
  mkfs.btrfs -q -f -L "$l" "$d-part1"
  local m; m=$(mktemp -d); mount -t btrfs "$d-part1" "$m"
  for sv in "$@"; do btrfs subvolume create "$m/$sv" >/dev/null; done
  umount "$m"; rmdir "$m"
}
mk "$SSD" games @games @src
mk "$HDD" storage @storage
SU=$(blkid -s UUID -o value "$SSD-part1"); HU=$(blkid -s UUID -o value "$HDD-part1")
O=noatime,compress=zstd:1,space_cache=v2,nofail,x-gvfs-show
cp /etc/fstab /etc/fstab.pre-datadisks-2026-10-14
cat >> /etc/fstab <<FSTAB

# data disks (2026-10-14): WD SN770 1TB = games + ~/src, Seagate 1TB HDD = bulk storage
UUID=$SU	$H/Drives/Games	btrfs	$O,subvol=/@games	0 0
UUID=$SU	$H/src	btrfs	$O,subvol=/@src	0 0
UUID=$HU	$H/Drives/Storage	btrfs	$O,subvol=/@storage	0 0
FSTAB
[ -d $H/src ] && mv $H/src $H/src.pre-sn770
install -d -o $U -g $U $H/Drives $H/Drives/Games $H/Drives/Storage $H/src
systemctl daemon-reload; mount -a
chown $U:$U $H/Drives/Games $H/Drives/Storage $H/src
install -d -o $U -g $U $H/Drives/Games/SteamLibrary; chattr +C $H/Drives/Games/SteamLibrary
cp -a $H/src.pre-sn770/. $H/src/ && rm -rf $H/src.pre-sn770
findmnt -t btrfs -o TARGET,SOURCE,OPTIONS | cut -c1-120; lsattr -d $H/Drives/Games/SteamLibrary; ls $H/src
