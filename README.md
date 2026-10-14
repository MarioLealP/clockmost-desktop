# clockmost-desktop

The recipe for Mario's Linux desktop (CachyOS, no desktop at install, then KDE Plasma + an
anime layer we build ourselves). Built and tried in a VMware VM first, then re-run on the real
machine. The reasoning, decisions and phases live in `F:\workspace\runbooks\desktop-linux-return.md`.

Rule: every part is picked on purpose and written down here. If it's not in this repo, it isn't
part of the build.

| path | what |
|---|---|
| `install/` | the choices made in the CachyOS installer (the one manual step) |
| `packages/` | package lists, one file per layer (base, plasma-core, login, gpu-amd [metal], apps, gaming, clockmost) |
| `scripts/` | `bootstrap.sh`: installs the package lists and links the dotfiles; safe to re-run |
| `dotfiles/` | config files, linked into `~` and `/etc` by the bootstrap |

Safety net: btrfs + snapper snapshots (CachyOS installer default); boot an older snapshot from
the boot menu if a change breaks the system.
