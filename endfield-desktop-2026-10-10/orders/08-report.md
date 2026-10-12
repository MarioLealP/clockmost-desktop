# Report - work order 08 - Dolphin layout mock (2026-10-12)

## What I built
`components/ds-dolphin.html` - Dolphin maximized on `.stage.plain` (`.win.max.focus`, full 1920x1080), Windows-
Explorer-like: sidebar with pins + folder tree + devices, DETAILS file list, info panel, status bar. Links
`ds-shell.css`, no JS, no motion, one static state. Hidden files are shown (dimmer), `~/.config` is pinned, the
data disks sit under `~/Drives/<name>` so drives live in the same tree as folders.

- **Top row (56px `.wtop`, hairline under)**: `DOLPHIN` title far left (yellow focus block from `.win.focus`),
  back / forward / up line icons (forward dim = no forward history), breadcrumb as flat chips `HOME › src ›
  clockmost-desktop` (HOME mono label chip, path segments in body font, last segment `--ink`, separators dim),
  then three view-mode buttons - icons / details / tree - with details active (yellow icon), a 280px `.field.sm`
  search (`›››` prompt), then the three STYLE.md window buttons.
- **Left sidebar 280px `--side`**: `.label` `PINS` - Home (home glyph), Desktop, Documents, Downloads, `.config`
  with a small pin glyph, Pictures; `.label` `TREE` - disclosure-triangle tree: `benylin` (home glyph) > `Drives`
  > `Data` and `Games` (drive glyphs), `src` (expanded) > `clockmost-desktop` (current = yellow block `.sel`) >
  `felt`, `.config` (collapsed), `Downloads`; `.label` `DEVICES` - `Data · 1.8 TB` and `Games · 920 GB` with thin
  usage bars (fill `--ink2`; Games at 82% is crimson) and a used/percent micro line; sidebar foot: barcode +
  micro `TR-03 · 09 NODES`.
- **Main area, DETAILS view**: column header in `.label` style - NAME, SIZE, MODIFIED (small sort arrow), TYPE;
  18 rows at 32px with very faint alternating stripes: 5 folders first (`.git`, `design`, `install`, `packages`,
  `scripts`) then 13 files (`.gitignore`, `AGENTS.md`, `CHANGELOG.md`, `CHECKLIST.md`, `LICENSE`, `Makefile`,
  `README.md`, `TODO.md`, `WORKLOG.md`, `install.sh`, `packages.txt`, `shell.conf`, `wallpaper.png`); hidden
  `.git` / `.gitignore` dimmer; line folder/file glyph per row; `README.md` + `TODO.md` are multi-selected
  (3px yellow left edge + slightly lighter row, not a full yellow block) - 7.0 KB + 4.4 KB = the status bar's
  11.4 KB.
- **Right info panel 300px** (`.panel` + `.bk.tl`/`.bk.br`, dotted bottom edge): big file-type glyph, `README.md`,
  rows `SIZE 7.0 KB`, `MODIFIED 2026-10-10 01:09`, `TYPE MARKDOWN`, `OWNER BENYLIN`, barcode + micro
  `FL-2410 · MD · REV.014` pinned at the panel bottom.
- **Bottom status bar (32px, hairline above)**: `5 FOLDERS · 13 FILES · 2 SELECTED (11.4 KB)` left; `1.2 TB FREE`
  + a 120px zoom `.sld` right. (Data at 33% used of 1.8 TB = 1.2 TB free, so the numbers agree.)

## Screenshots
- `out/shots/08-1.png` (first pass - sidebar foot micro wrapped to two lines, fixed)
- `out/shots/08-2.png` (final - foot on one line; also dropped a subline under README.md I had added beyond the
  order's panel spec)
- refs I looked at first: `out/shots/08-ref-spotify.png`, `out/shots/08-ref-drawer.png`
  (note: the drawer ref shot shows the wallpaper only - that page starts its drawer closed; I read its markup
  instead for the tile/glass language)

## How I checked
`kit/shot.sh` x2 (no page errors on either run); looked at both screenshots with the Read tool. Checked: column
headers line up with their values; no text clipped or overflowing; nothing off screen; window buttons and chrome
match the phonograph/firefox language; yellow only on active/selected/focused things; no tri-band. 2 of the
allowed 3 screenshot-and-fix rounds used.

## Unsure about
- The order puts the sort arrow on MODIFIED but lists the rows alphabetical (folders first) - I kept both as
  literally specified, so the visible order is name-sorted while the arrow claims modified-sorted. Moving the
  arrow to NAME, or sorting rows by date, would make it consistent - Mario's call.
- The 7 extra file names beyond the 6 the order lists are invented to reach 13 files (matches the status bar
  count): `AGENTS.md`, `CHANGELOG.md`, `CHECKLIST.md`, `LICENSE`, `Makefile`, `WORKLOG.md`, `shell.conf`.
- Folder rows show `—` in SIZE (Dolphin leaves folder size empty); TYPE `FOLDER`/`IGNORE`/`MAKEFILE` etc. are
  short invented type strings.
- Which device is at 82% is not specified - I put Games at 82% (crimson) and Data at 33%, so the status bar's
  `1.2 TB FREE` equals Data's free space.
- The area below the 18 rows and the lower part of the info panel are empty; that is how a real file manager
  sits at this window size, so I left them rather than padding with invented content.

## Ideas (not built)
- A faint tick ruler or dotted strip along the empty bottom of the file list (own recipe, not the phonograph's)
  if Mario wants the void textured.
- A second info-panel state (`?state=multi`) showing "2 FILES SELECTED" instead of README.md, for the multi-select
  case.
