# Install (no clicks)

1. Boot the official Arch ISO with a cloud-init seed (`cidata` volume: `meta-data`, `user-data` with
   root's SSH key) -> sshd up with the key. In the VM: a second CD image; on metal: a USB stick.
2. In the live system: `cachyos-repo.sh` (official, from mirror.cachyos.org/cachyos-repo.tar.xz) adds
   the CachyOS key (882DCFE4...8DB35A47) + repos (x86-64-v3 on the Ryzen 3600). Its own live
   upgrade fails for lack of space - not needed. `mount -o remount,size=4G /run/archiso/cowspace`.
3. `DISK=/dev/nvme0n1 bash install/10-disk.sh` - GPT, 1 GiB EFI, btrfs @ @home @root @srv @cache
   @tmp @log, zstd:1, mounted on /mnt.
4. `VM=1 bash install/20-base.sh` - pacstrap packages/base.txt (+ vm.txt), fstab.
5. `arch-chroot /mnt env HOST=... SSHKEY=... VM=1 bash install/30-configure.sh` - locale/time,
   user benylin + key, Limine (limine-entry-tool, /etc/default/limine), snapper root config,
   services.
6. `umount -R /mnt`, power off, detach the ISO, boot from disk.

VM gotchas (VMware Workstation 26H1u1): the .vmx needs pciBridge0/4-7 with slot numbers or the
NIC gets "No PCIe slot"; the side-channel-mitigation hint blocks power-on until clicked once
(tick "don't show again"); disable floppy0.
