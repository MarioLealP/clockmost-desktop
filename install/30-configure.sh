#!/bin/bash
# Configure the installed base. Run INSIDE the target: arch-chroot /mnt env ... bash 30-configure.sh
# Env: HOST (hostname), SSHKEY (public key for benylin), VM=1 inside VMware,
# SYSLANG (default en_GB.UTF-8), KEYMAP (console, default pt-latin1), XKB (default pt).
# Mario 2026-10-14: pt keyboard, Europe/Lisbon, UK English. en_GB + en_US + pt_PT generated.
set -euo pipefail
# 32-bit repo (Steam/Wine need it; CachyOS's installer enables it too)
sed -i '/^#\[multilib\]/{s/^#//;n;s/^#//}' /etc/pacman.conf
HOST=${HOST:?}; SSHKEY=${SSHKEY:?}
SYSLANG=${SYSLANG:-en_GB.UTF-8}; KEYMAP=${KEYMAP:-pt-latin1}; XKB=${XKB:-pt}
ln -sf /usr/share/zoneinfo/Europe/Lisbon /etc/localtime; hwclock --systohc
sed -i -E 's/^#((en_GB|en_US|pt_PT)\.UTF-8 UTF-8)/\1/' /etc/locale.gen; locale-gen >/dev/null
echo "LANG=$SYSLANG" > /etc/locale.conf
echo "KEYMAP=$KEYMAP" > /etc/vconsole.conf
# X11/Wayland default layout (SDDM, new Plasma users); localectl needs a running systemd, so by hand
install -d /etc/X11/xorg.conf.d
printf 'Section "InputClass"\n  Identifier "system-keyboard"\n  MatchIsKeyboard "on"\n  Option "XkbLayout" "%s"\nEndSection\n' "$XKB" > /etc/X11/xorg.conf.d/00-keyboard.conf
echo "$HOST" > /etc/hostname
id benylin >/dev/null 2>&1 || useradd -m -G wheel -s /bin/bash benylin  # login shell -> fish in the bootstrap (pick #3)
install -d -m 700 -o benylin -g benylin /home/benylin/.ssh
printf '%s\n' "$SSHKEY" > /home/benylin/.ssh/authorized_keys
chown benylin:benylin /home/benylin/.ssh/authorized_keys; chmod 600 /home/benylin/.ssh/authorized_keys
passwd -l root >/dev/null
# passwordless sudo for wheel, VM and metal (Mario 2026-10-14: "passwordless, i cba")
echo '%wheel ALL=(ALL:ALL) NOPASSWD: ALL' > /etc/sudoers.d/10-wheel; chmod 440 /etc/sudoers.d/10-wheel
if [[ ${VM:-0} == 1 ]]; then
  systemctl enable vmtoolsd.service vmware-vmblock-fuse.service
fi
visudo -c >/dev/null
# boot menu: Limine via CachyOS's limine-entry-tool
ROOT_UUID=$(findmnt -no UUID /)
cp /etc/limine-entry-tool.conf /etc/default/limine; echo >> /etc/default/limine  # file lacks a final newline
cat >> /etc/default/limine <<CONF
ESP_PATH=/boot
KERNEL_CMDLINE[default]="root=UUID=$ROOT_UUID rootflags=subvol=/@ rw quiet nowatchdog"
CONF
limine-install --fallback
limine-mkinitcpio
# snapshots: snapper config for / (creates /.snapshots); limine-snapper-sync adds them to the menu
snapper --no-dbus -c root create-config /
systemctl enable NetworkManager.service sshd.service systemd-timesyncd.service snapper-cleanup.timer limine-snapper-sync.service
echo "configured $HOST"
