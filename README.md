# clockmost-desktop

The recipe for my Linux desktop: CachyOS (Arch-based) installed with no desktop, then KDE Plasma 6 on Wayland
with our own Endfield shell on top. Built and tried in a VMware VM first, then installed on the real machine
(2026-10-14). The reasoning, decision log and the machine's full install log live in my private notes; this repo is the
public, reproducible part.

Rule: every part is picked on purpose and written down here. If it's not in this repo, it isn't part of the build.

| path | what |
|---|---|
| `install/` | the scripted install from the Arch ISO (disk, pacstrap, configure, data disks) - steps in `install/README.md` |
| `packages/` | package lists, one file per layer: base, plasma-core, login, gpu-amd [metal], apps, gaming, clockmost, dev, vm [VM]; `clockmost-repo.txt` = our own `[clockmost]` packages (shell, skins, desktop glue). Each pick has its reason as a comment |
| `scripts/` | `install-list.sh`: installs package lists by name (`scripts/install-list.sh apps gaming`) |
| `dotfiles/` | config files the setup doesn't write itself (Firefox policies, SDDM, kitty, KeePassXC, Spectacle, EQ profile) |
| `TODO.md` | what isn't done yet (and a Done list) |

Per-user settings (dark mode, Xwayland scale, KeePassXC as the keyring, screenshot keys, ...) come from the
`[clockmost]` packages' `clockmost-desktop-setup` steps, not from here.

Safety net: btrfs + snapper snapshots (snap-pac before/after every pacman run, limine-snapper-sync puts them in the
boot menu): boot an older snapshot if a change breaks the system.
