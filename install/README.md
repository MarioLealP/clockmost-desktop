# Install (no clicks)

1. Boot the official Arch ISO with a cloud-init seed (`cidata` volume: `meta-data`, `user-data` with
   root's SSH key) -> sshd up with the key. In the VM: a second CD image; on metal: a USB stick.
2. In the live system: `cachyos-repo.sh` (official, from mirror.cachyos.org/cachyos-repo.tar.xz) adds
   the CachyOS key (882DCFE4...8DB35A47) + repos (x86-64-v3 on the Ryzen 3600). Remount first:
   `mount -o remount,size=4G /run/archiso/cowspace` (without it the script's live upgrade fails for
   lack of space - harmless). **When the live upgrade succeeds it replaces the running kernel's
   modules** (`mount /mnt/boot` -> "unknown filesystem type vfat"): copy them back right after,
   `cp -a /run/archiso/airootfs/usr/lib/modules/$(uname -r) /usr/lib/modules/ && modprobe vfat`.
3. `DISK=/dev/nvme0n1 bash install/10-disk.sh` - GPT, 1 GiB EFI, btrfs @ @home @root @srv @cache
   @tmp @log, zstd:1, mounted on /mnt.
4. `VM=1 bash install/20-base.sh` - pacstrap packages/base.txt (+ vm.txt), fstab.
5. `arch-chroot /mnt env HOST=... SSHKEY=... VM=1 bash install/30-configure.sh` - locale/time,
   user benylin + key, Limine (limine-entry-tool, /etc/default/limine), snapper root config,
   services.
6. `umount -R /mnt`, power off, detach the ISO, boot from disk.
# Install (no clicks)

1. Boot the official Arch ISO with a cloud-init seed (`cidata` volume: `meta-data`, `user-data` with
   root's SSH key) -> sshd up with the key. In the VM: a second CD image; on metal: a USB stick.
2. In the live system: `cachyos-repo.sh` (official, from mirror.cachyos.org/cachyos-repo.tar.xz) adds
   the CachyOS key (882DCFE4...8DB35A47) + repos (x86-64-v3 on the Ryzen 3600). Remount first:
   `mount -o remount,size=4G /run/archiso/cowspace` (without it the script's live upgrade fails for
   lack of space - harmless). **When the live upgrade succeeds it replaces the running kernel's
   modules** (`mount /mnt/boot` -> "unknown filesystem type vfat"): copy them back right after,
   `cp -a /run/archiso/airootfs/usr/lib/modules/$(uname -r) /usr/lib/modules/ && modprobe vfat`.
3. `DISK=/dev/nvme0n1 bash install/10-disk.sh` - GPT, 1 GiB EFI, btrfs @ @home @root @srv @cache
   @tmp @log, zstd:1, mounted on /mnt.
4. `VM=1 bash install/20-base.sh` - pacstrap packages/base.txt (+ vm.txt), fstab.
5. `arch-chroot /mnt env HOST=... SSHKEY=... VM=1 bash install/30-configure.sh` - locale/time,
   user benylin + key, Limine (limine-entry-tool, /etc/default/limine), snapper root config,
   services.
6. `umount -R /mnt`, power off, detach the ISO, boot from disk.
7. Metal only (no `VM=1` above): `bash install/40-data-disks.sh` from the installed system - the
   SN770 (`~/Drives/Games`, `~/src`) and Seagate (`~/Drives/Storage`), btrfs, by serial.
8. Layers + our packages: `scripts/install-list.sh plasma-core login gpu-amd apps gaming clockmost dev`, then enable the
   `[clockmost]` repo and install `packages/clockmost-repo.txt` (see that file), then `clockmost-desktop-setup` as the
   user, then the AUR packages listed in `apps.txt`/`gaming.txt`/`clockmost.txt` (paru). Per-machine steps after that (agents' server/host names, Wazuh enrolment, keys, workspace scripts + user
   units): the workspace `runbooks/desktop-linux-install-log.md`.

VM gotchas (VMware Workstation 26H1u1): the .vmx needs pciBridge0/4-7 with slot numbers or the
NIC gets "No PCIe slot"; the side-channel-mitigation hint blocks power-on until clicked once
(tick "don't show again"); disable floppy0.
 `bash install/40-data-disks.sh` from the installed system - the
   SN770 (`~/Drives/Games`, `~/src`) and Seagate (`~/Drives/Storage`), btrfs, by serial.
8. Layers + our packages: `scripts/install-list.sh plasma-core login gpu-amd apps gaming clockmost dev`, then enable the
   `[clockmost]` repo and install `packages/clockmost-repo.txt` (see that file), then `clockmost-desktop-setup` as the
   user, then the AUR packages listed in `apps.txt`/`gaming.txt`/`clockmost.txt` (paru). Per-machine steps after that (agents' server/host names, Wazuh enrolment, keys, workspace scripts + user
   units): the workspace `runbooks/desktop-linux-install-log.md`.

VM gotchas (VMware Workstation 26H1u1): the .vmx needs pciBridge0/4-7 with slot numbers or the
NIC gets "No PCIe slot"; the side-channel-mitigation hint blocks power-on until clicked once
(tick "don't show again"); disable floppy0.
