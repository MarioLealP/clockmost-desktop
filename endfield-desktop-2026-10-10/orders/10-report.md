# Report - work order 10 (notifications)

## What I built
`components/ds-notify.html` - one static 1920x1080 layout page, links `ds-shell.css`, no motion. Background:
`.stage` with one dimmed `.win.blur` behind (Dolphin prop: Places sidebar + 8 file rows + faint barcode/micro
footer). Top bar: plain 40px `.frost` strip (no side borders, hairline bottom edge) with a bell icon at the right;
the bell goes yellow in `center` state (it is the active icon there). States via `?state=` (default `popups`),
read with `URLSearchParams` - a static show/hide, no animation. Tiny `.mock-note` bottom-left names the state.

- **`popups`** - 3 popups in a top-right flex stack: 16px from right, first 8px under the bar, 10px gaps, 380px
  each, dark plates with 2px corners, a 3px left colour edge per app, 32px letter tile, app name `.label` + time
  `.micro`, title in body/`--ink`, one-line body in `--ink2`, small rule-18 X top-right, micro code line as small
  print. Each its own interior recipe:
  1. Discord (blue edge): orange `.notif` diamond in the head, `muse in #felt-dev` / `can you look at the mockups
     when you get a minute?`, chips `REPLY` + `MARK READ`, micro `NTF-01 · MSG · P2`.
  2. Downloads (green edge): `Download finished` / `cachyos-260809.iso · 2.9 GB`, a full-width finished progress
     bar (its own motif), chip `OPEN FOLDER`, micro `DL-2608 · SHA256 OK`.
  3. Spectacle (violet edge): `Screenshot saved` / `~/Pictures/Screenshots/2026-10-12_20-41.png` with a 96x54
     thumbnail at the right (tiny drawn desktop: top strip, framed window with title bar and content lines, dock),
     micro `SHOT-04 · PNG · 1920×1080`.
- **`center`** - notification center dropped from the bell: right-aligned 420px, 760px tall, `.panel` + `.bk`
  brackets, 8px under the bar, 16px from the screen edge. Head `NOTIFICATIONS` + `.micro` `7 UNREAD`, hairline,
  `DO NOT DISTURB` row with `.tgl` (off) and `OFF` micro, hairline. Groups (`.label` + count `.micro` + `CLEAR`
  link): DISCORD (3), CLOCKMOST / ZABBIX (2 - the `Disk usage 82% on /mnt/data` item carries the crimson `.tag`
  `HIGH`), DOWNLOADS (1), SPECTACLE (1). Each item = one line title + `.micro` time (newest item in `--ink`, the
  rest `--ink2`). After the groups a faint `END OF LIST · 7 ENTRIES` mark, then barcode + micro
  `NC-07 · CLOCKMOST · 4 GROUPS`, then the full-width 36px dark `CLEAR ALL` button.

## Screenshots (all looked at with the Read tool)
- `out/shots/10-popups.png`, `out/shots/10-center.png` - final, after the last edit.
- `out/shots/10-ref-spotify.png`, `out/shots/10-ref-drawer.png` - the two approved reference pieces.
- `out/shots/10-zoom.png` - 3x zoom check of the popups + window buttons (via the shot script's eval): rule-18 X
  icons render as four arms with an empty centre, chips and bar are clean.
- `kit/shot.sh` reported no page errors. 3 screenshot-and-fix rounds used. Round 1 found the three popups all at
  `top: 48px` overlapping each other (fixed with a flex stack, 10px gaps) and the background window being a tall
  void (fixed: shortened to 560px, 2 more rows). Round 2 found a stale `6 ITEMS` micro (now 8) and a mushy
  thumbnail (brightened). Round 3 confirmed both states clean: no clipped or overlapping text, everything on
  screen.

## What I checked / didn't check
Checked: both states at full size and the popup internals at 3x - placement (16px/8px/10px, 380px/420px/760px),
colour edges, typography split (mono labels vs body content), small print present in every piece, no pure white,
no tri-band, yellow only on the active bell. Didn't check (and not built): any hover/animation behaviour, real
notification behaviour, other states of the toggle.

## Unsure about
- **Times**: the order gave `NOW` / `2 MIN` as the time examples but three popups need three times - I used
  `NOW` (Discord), `2 MIN` (Downloads), `5 MIN` (Spectacle). Easy to change.
- **Green progress bar**: the 100% green bar in the Downloads popup is the loudest colour area on the screen.
  I kept it because "download finished" is its signal, but if Mario finds it loud it can shrink to a short bar
  next to the chip instead.
- **CLEAR links** are `--blue` (the shell's "links" colour). If they should read as plain dim text, one line.
- **Center items** for Downloads/Spectacle combine title and filename with `·` on one line, since the order says
  each item is one line title + time.

## Ideas (not built)
- A third state `?state=dnd` with the toggle on and the popups suppressed, to show the quiet mode.
- Badge count on the bell (`7`) in center state.
- Per-group collapse carets in the center.
