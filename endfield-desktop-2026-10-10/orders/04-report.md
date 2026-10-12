# Work order 04 report — top bar + quick settings + clipboard picker

## What I built
One file: `components/ds-topbar.html` (links `ds-shell.css`, no other files touched). 1920x1080 `.stage`
with one dimmed `.win.blur` (1200x700, centred, title `PHONOGRAPH`, empty body) behind, so the bar and
panels read as an overlay. Static — states switch only via `?state=` (tiny script reads
`URLSearchParams`; no motion of any kind).

- **Top bar** (40px, `.frost`, no side borders, hairline bottom): workspace chips `01 02 03` (26px squares,
  `01` current = yellow `.sel`, `02` dim with a tiny dot = windows open), hairline divider, focused window
  title `PHONOGRAPH · GLASSY SKY` in `.label`. Centre: clock `20:41` (mono 15px, .18em, `--ink`) + date
  `MON 12 OCT` in `.micro`, the group exactly centred on the screen. Right (8px gaps): now-playing chip
  (22px lavender art + `GLASSY SKY` micro, text capped 160px), six 28px `.wb` tray buttons (clipboard,
  ethernet, volume, bluetooth, shield, bell with orange `.notif` diamond), user chip `BE` + `BENYLIN`.
- **`?state=bar`** — bar only. **`?state=quick`** (default) — 400px `.panel` under the volume icon (right
  edge 16px from screen edge, 8px below bar): head `BE` avatar + `benylin@clockmost` + micro uptime
  `UP 3D 04H · KERNEL 7.2.9-CACHYOS`, 2x3 toggle tiles (Ethernet/Connected and Bluetooth/Robin ON with
  yellow 3px left edge + yellow icon, four OFF), sliders `OUTPUT · DT 880` 70% / `MIC · USB PNP` 55%
  (`.sld`), now-playing row (44px lavender art, `Glassy Sky`/`SAPPHIRE`, prev/play/next), footer micro
  `CLOCKMOST · TANG OK · VAULT OK` + settings/lock/power buttons. Volume icon yellow.
- **`?state=clip`** — 440x600 `.panel` under the clipboard icon, its own recipe (numbered list, not the
  tile grid): head `.label` `CLIPBOARD` + micro `50 KEPT · IMAGES ON` + barcode, `.field.sm` search with
  `›››`, rows `01..08` with phonograph-style track numbers — `01` selected as a full-width yellow `.sel`
  block (git command), `02` image entry (120x68 drawn-screenshot thumbnail + `PNG · 1920×1080` micro),
  `03` git URL, `04` `192.168.10.110`, `05` pinned chat sentence (pin glyph, 2-line clamp), `06` `#FFFA00`,
  `07` journalctl line, `08` shell line. Footer keycaps `↵ PASTE · DEL REMOVE · P PIN · ESC CLOSE`.
  Clipboard icon yellow.
- **`?state=cal`** — 320px `.panel` centred under the clock: `OCTOBER 2026` + micro `WK 42`, 7-column
  Monday-first October 2026 grid (1 Oct = Thursday), today `12` yellow block, weekend columns dimmer,
  below it micro `TUE 13 · 21:00 FFXIV RAID` and `FRI 16 · BACKUP CHECK`, footer barcode + micro
  `CAL-1026 · 31 DAYS`. Clock yellow (it is the trigger).

Small print in every piece (barcodes, micro code lines, labels) kept faint per STYLE. Corner radii held to
2px plates / 6px buttons-fields / round pills. Yellow only on active/selected/trigger/`›››`. One tri-band
on the whole screen: none needed here, so none used.

## Screenshots (all looked at, no page errors printed)
- `out/shots/04-bar.png`, `out/shots/04-quick.png`, `out/shots/04-clip.png`, `out/shots/04-cal.png`
- Inspection zooms: `out/shots/04-zoom-quick.png` (panel at 2x — head/tiles/sliders/footer verified
  unclipped), `out/shots/04-zoom-clip.png` (2x, background window hidden)
- Reference shots taken first: `out/shots/04-ref-spotify.png`, `04-ref-drawer.png`,
  `04-ref-drawer-open.png`, `04-ref-chat.png`

Checked in 2 screenshot rounds (limit 3). Round 1 found one real issue: a ~40px empty gap between the last
clipboard row and its footer — fixed by row padding 12→14px so the 8 rows fill the 600px panel. Round 2
confirmed it and found nothing else: no clipped/overlapping text, nothing off screen, layout matches the
two approved pieces' language.

## What I am unsure about
- **Which workspace chip is current**: I read the order as `01` current (yellow) with `02` merely having
  the "windows open" dot. If `02` was meant to be current, it's a one-line swap.
- **"Right-aligned under the icon that opens them, 16px from the screen edge"**: I anchored quick/clip
  panels 16px from the right edge (geometry rule's hard number), so the opener icon sits above the panel
  rather than at its corner. `cal` is centred under the clock as its own spec says.
- **Clock centring**: I centred the clock+date pair on the screen centre (the order's "centre slot"
  reading), so the clock itself sits slightly left of x=960. Say the word if the clock alone should be
  dead centre.
- Toggle tiles show label and state word on two lines — `DO NOT DISTURB · OFF` on one line does not fit a
  ~180px tile at mono size.
- The background window's buttons faintly ghost through the translucent `.panel` plates near the right
  edge (the plate recipe is 93-95% opaque). It reads as "panel over a desktop" — the effect the order
  asked for — but pointing it out in case it bothers you.

## Ideas (not built)
- A tiny progress line under the bar's now-playing chip (out of scope: layout only).
- Tray buttons could get a pressed/hover variant in a states sheet later.
- The clipboard list's `06 #FFFA00` row could show a small colour swatch next to the hex.
