#!/bin/bash
# Configure the installed base. Run INSIDE the target: arch-chroot /mnt env ... bash 30-configure.sh
# Env: HOST (hostname), SSHKEY (public key for benylin), VM=1 inside VMware.
# Temporary defaults, each an open decision (runbook): LANG en_US + pt_PT generated, keymap us,
# shell bash, hostname, VM-only passwordless sudo for wheel.
set -euo pipefail
HOST=${HOST:?}; SSHKEY=${SSHKEY:?}
ln -sf /usr/share/zoneinfo/Europe/Lisbon /etc/localtime; hwclock --systohc
sed -i -E 's/^#(en_US\.UTF-8 UTF-8)/\1/; s/^#(pt_PT\.UTF-8 UTF-8)/\1/' /etc/locale.gen; locale-gen >/dev/null
echo LANG=en_US.UTF-8 > /etc/locale.conf
echo KEYMAP=us > /etc/vconsole.conf
echo "$HOST" > /etc/hostname
id benylin >/dev/null 2>&1 || useradd -m -G wheel -s /bin/bash benylin
install -d -m 700 -o benylin -g benylin /home/benylin/.ssh
printf '%s\n' "$SSHKEY" > /home/benylin/.ssh/authorized_keys
chown benylin:benylin /home/benylin/.ssh/authorized_keys; chmod 600 /home/benylin/.ssh/authorized_keys
passwd -l root >/dev/null
if [[ ${VM:-0} == 1 ]]; then
  echo '%wheel ALL=(ALL:ALL) NOPASSWD: ALL' > /etc/sudoers.d/10-vm-wheel; chmod 440 /etc/sudoers.d/10-vm-wheel
  systemctl enable vmtoolsd.service vmware-vmblock-fuse.service
fi
visudo -c >/dev/null
# boot menu: Limine via CachyOS's limine-entry-tool
ROOT_UUID=$(findmnt -no UUID /)
cp /etc/limine-entry-tool.conf /etc/default/limine
cat >> /etc/default/limine <<CONF
ESP_PATH=/boot
KERNEL_CMDLINE[default]="root=UUID=$ROOT_UUID rootflags=subvol=/@ rw quiet nowatchdog"
CONF
limine-install --fallback
limine-mkinitcpio
# snapshots: snapper config for / (creates /.snapshots); limine-snapper-sync adds them to the menu
snapper --no-dbus -c root create-config /
systemctl enable NetworkManager.service sshd.service snapper-cleanup.timer limine-snapper-sync.service
echo "configured $HOST"
