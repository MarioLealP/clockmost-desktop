# Open items in the recipe

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
- **clockmost block** (Mario 2026-10-09: "agents yes, backups yes, updates yes, renewers yes ...
  the rest yes") - still open (Zabbix, Wazuh, restic, keys are done - below):
  - **Updates**: replaces the choco auto-patch task - a weekly `paru -Syu` (+ snapper pre/post
    snapshots via snap-pac) with a status file for Zabbix, never an unattended reboot.
  - **Vault renewers** for `tray` + `felt-animation`: Linux installer like the laptop's
    (`projects/openbao/offhost/install-laptop.sh`), renewer accounts + timers; same off-host roles.
- **Agents on the desktop (pit stop done 2026-10-09, plan only)**: Claude Code + a local agent
  harness side by side, both reading the same AGENTS.md/runbooks/memory (provider-neutral). The admin
  path is agent-neutral (one account for any agent). Local model + harness picked when the extra
  8 GB card arrives. See runbooks/desktop-linux-return.md.

## Done (first metal install 2026-10-14/15 - detail in the workspace `runbooks/desktop-linux-install-log.md`)

- Headphone EQ (2026-10-16): `dotfiles/home/.local/bin/apo2easyeffects` (APO -> EasyEffects 8.3 preset, bands in
  "APO (DR)" mode) builds `DT880 oratory1990.json` from the kept `.apo.txt`; hidden autostart
  `dotfiles/home/.config/autostart/easyeffects-service.desktop`; `easyeffectsrc` [Window] showTrayIcon=false,
  noWindowAfterStarting=true (set only while EE is quit).
- ShareX keys (Spectacle), keyring = KeePassXC (KDE Wallet off was enough - no D-Bus masking needed), the tang
  auto-unlock + Drive sync carry-overs, one KeePassXC at login (session restore excluded): clockmost-desktop-config
  setup step 50; the unlock/backup/sync scripts + their user units live in the workspace.
- Zabbix agent 2 (host clockmost-desktop, zbx23), Wazuh agent (AUR, enrolled as 004), restic (workspace
  `scripts/desktop-backup.sh`, daily timer, status for Zabbix), keys (restored as needed).
- BoilR: upstream's own build in ~/Applications instead of a clockmost package (packages/gaming.txt).
