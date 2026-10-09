# Open items in the recipe

- **ShareX keybinds** (Mario 2026-10-09: "i wont live like that"): Spectacle global shortcuts ->
  `Ctrl+Print` = rectangular region capture into the annotation editor (all screenshot actions on
  Ctrl+Print), `Ctrl+Shift+Print` = start/stop region recording as GIF (or WebP). Replace the
  Plasma defaults (Meta+Shift+S / Meta+Shift+Print / Meta+Shift+R) in kglobalshortcutsrc;
  Spectacle: launch = new screenshot, mode = rectangular region, recording format = GIF.
- **Klipper needs a home** (found 2026-10-09): in Plasma 6 Klipper only exists inside the
  `org.kde.plasma.clipboard` widget (no standalone binary). Removing Plasma's panel (room for an
  anime shell) removes the system tray -> no Klipper, no Meta+V after the next shell start.
  Desktop-layer widget = visible (default 464x464 shows the full history; off-screen positions get
  clamped back into view - Mario: "gone isnt 1 of them"). **Working fix: a stub panel** - left
  edge, centered, length 32, thickness 32, hiding=autohide, holding only the clipboard widget
  (plasma script: `var p = new Panel; p.location="left"; p.height=32; p.alignment="center";
  p.minimumLength=32; p.maximumLength=32; p.hiding="autohide"; p.addWidget("org.kde.plasma.clipboard")`).
  Invisible unless the mouse hits that spot; Klipper loads. Verified by screenshot. The bootstrap
  must create it; the design track must keep Klipper loaded somewhere.
- Klipper settings (`~/.config/klipperrc` [General]): MaxClipItems=50, KeepClipboardContents=true,
  IgnoreSelection=true, SyncClipboards=false, IgnoreImages=false, PreventEmptyClipboard=true.
- **Keyring = KeePassXC** (bootstrap step): mask KWallet's D-Bus activation in
  `~/.local/share/dbus-1/services/` (`/dev/null` symlinks for `org.kde.kwalletd6`,
  `org.kde.secretservicecompat`, `org.kde.secretprompter`,
  `org.freedesktop.impl.portal.desktop.kwallet` .service), `kwalletrc [Wallet] Enabled=false`, kill
  ksecretd/kwalletd6, then KeePassXC `[FdoSecrets] Enabled=true` + pick the exposed group in its
  GUI (Settings -> Secret Service Integration). On the real machine: the database
  (`Passwords.kdbx`, on Google Drive today) needs a Linux sync path (pick) + the tang auto-unlock
  with native clevis (clockmost phase).
- **Headphone EQ (carry-over, "same system as last time")**: EasyEffects + lsp-plugins-lv2, preset
  `DT880 oratory1990` built from `dotfiles/home/.local/share/easyeffects/output/DT880 oratory1990.apo.txt`
  (AutoEq tag 2.0.0, oratory1990 harman_over-ear_2018, DT 880 250 Ohm, preamp -5.6 dB, 10 PEQ
  bands - the exact profile used 2026-09). Needs the APO -> EasyEffects JSON converter again (the old
  `~/.local/bin/apo2easyeffects` was lost with the Linux backup); silent autostart
  (`easyeffects --hide-window --service-mode`, `showTrayIcon=false`, `noWindowAfterStarting=true`).
  Details: runbooks/desktop-headphone-eq.md (historical).
- **Carry-overs assumed solved (Mario 2026-10-09)**: Google Drive sync of `Passwords.kdbx` etc. and
  the KeePassXC tang auto-unlock - redo as last time on the real machine.
- **Audio devices: whitelist only** (Mario 2026-10-09: "disabled all sources input and output except
  this, cuz i know screens like to get added, dont. and just accept once i connect the robin through
  bluetooth"). On Windows today: output = **Realtek onboard analog** ("Speakers", DT 880 jack),
  input = **USB PnP Audio Device** mic. Disable everything else: AMD GPU HDMI/DP audio (both MSI
  monitors; Linux card name usually "HDA ATI HDMI"), Realtek digital/S/PDIF (iec958) and its analog
  mic inputs, "AMD Streaming Audio". Bluetooth: allowed when paired (the "robin" device). Implement
  on metal as WirePlumber 0.5 rules in `~/.config/wireplumber/wireplumber.conf.d/51-clockmost-audio.conf`
  (`monitor.alsa.rules`: device.disabled / node.disabled by the real `alsa_card.*` / node names,
  checked with `wpctl status`), default sink = Realtek analog (EasyEffects EQ on it), default source =
  USB mic.
- **Package BoilR in the clockmost pkgs repo** (Mario: "if we can build it ourselves, we go for it,
  and we can let Trivy sniff it"): Rust, upstream PhilipK/BoilR v1.11.0 (2026-10-02); include a
  Trivy scan of the package (Cargo.lock deps) in that pipeline. Then XIVLauncher added to Steam once
  as a non-Steam game (art via SGDBoop); Battle.net games via Lutris -> BoilR syncs them.
- **clockmost block** (Mario 2026-10-09: "agents yes, backups yes, updates yes, renewers yes ...
  the rest yes"), all mirrors of what exists today:
  - **Zabbix agent 2**: host `clockmost-windows` becomes a Linux host (template "Linux by Zabbix
    agent active" + SMART + systemd); keep zbx6-desktop-quiet (no page on power-off); status files
    for the backup/updates like the server's job-status pattern.
  - **Wazuh agent**: re-enroll the desktop (same agent name), FIM paths for Linux (~/.ssh, /etc/sudoers.d).
  - **restic**: same repo + password + excludes as `C:\Users\lealm\.restic\desktop-backup.ps1`
    (paths re-mapped: ~/.ssh, ~/.config, runbooks/Projects, Felt, F:\VMs\installers equivalents),
    systemd timer + staleness status for Zabbix (zbx17 desktop-backup).
  - **Updates**: replaces the choco auto-patch task - a weekly `paru -Syu` (+ snapper pre/post
    snapshots via snap-pac) with a status file for Zabbix, never an unattended reboot.
  - **Vault renewers** for `tray` + `felt-animation`: Linux installer like the laptop's
    (`projects/openbao/offhost/install-laptop.sh`), renewer accounts + timers; same off-host roles.
  - **Keys**: SSH aliases + keys (Gitea, server, laptop, router), carried from WSL ~/.ssh.
- **PIT STOP: Claude Code on the Linux desktop** (Mario: "about claude code, we need a pit stop
  there"): how/where it runs, and the agent's admin path (today: ClaudeElevated allowlist on
  Windows; claude-admin on server/laptop). Discuss before building.
