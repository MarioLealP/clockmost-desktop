# Report - work order 03 (window frame + tiling layouts)

## What I built
`components/ds-window.html` - one static layout page, 1920x1080 `.stage`, house frame from `ds-shell.css`
(`.win` / `.wtop` / `.wtitle` / `.wctl` / `.wb` / `.wbody`, `.win.focus` yellow title block, `.win.blur` dimming,
`.win.max` for fullscreen). States picked with `?state=`, default `stack`:

- `float` - Kitty focused (~1100x680) over Dolphin blur (~800x520, offset up-left); titles with app + context,
  three window buttons, hairline under the bar.
- `halves` - Kitty + Dolphin, each half the screen, 8px gaps and edges.
- `stack` - Kitty left half; Dolphin top-right, Discord bottom-right (1 + 2).
- `quad` - Kitty / Dolphin / Phonograph mini / Discord mini, 2x2.
- `full` - Dolphin `.win.max` filling the screen, title bar on top.
- `snap` - the halves desktop with the left half as snap-zone preview (1px yellow border at 60%, ~6% yellow fill,
  `.micro` "SNAP · LEFT HALF" centred), the dragged Kitty smaller at 70% opacity under a cursor arrow.

Placeholder content per the order: Kitty = fish prompt + `git status` in muted colours + yellow block cursor
(10 lines); Dolphin = Places sidebar (Home... Drives/Data, Home selected) + 10 file rows (name/size/date);
Phonograph mini = 3 track rows, first highlighted lavender `rgba(207,198,244,.12)`; Discord mini = 5 chat lines
(names in colours). Every window carries faint small print (barcode / micro code line). Tiled states show exactly
one focused window. Tiny state switcher bottom-left (`.micro` links, active state in yellow). No motion, no
transitions - the page only reads `URLSearchParams`.

## Screenshots (all looked at with the Read tool)
- `out/shots/03-float.png`, `03-halves.png`, `03-stack.png`, `03-quad.png`, `03-full.png`, `03-snap.png`,
  `03-default.png` (no param = stack) - all shot after the final edit.
- References also shot: `03-ref-spotify.png`, `03-ref-drawer.png`, `03-ref-drawer-open.png`.
- `kit/shot.sh` reported no page errors on any shot. 3 screenshot-and-fix rounds used; round 1 found the window
  footers colliding with the state switcher in `full`, fixed by right-aligning footer small print and clearing the
  switcher band in the sidebar.

## What I checked / didn't check
Checked: every state visually - frames, focus/blur, 8px geometry, snap zone colours and label, no clipped or
overlapping text, switcher legibility. Didn't check (and not built): hover states, any motion, real app content,
multi-monitor side-monitor framing (tiled states fill the whole 1920x1080 as the order's geometry implies).

## Unsure about
- Snap: the order said "the halves desktop" while dragging - I left Dolphin tiled in the right half and drew the
  dragged Kitty over the centre-left with a cursor arrow. If Mario wants the dragged window to already replace the
  right window (both tiles occupied, only the zone showing the target), that's a one-line change.
- Kitty/Discord bodies have empty space below their few lines (terminal / chat read, not broken) - looks right to
  me but easy to pad if Mario wants denser placeholders.

## Ideas (not built)
- A `?state=tiling-hint` variant showing KWin-style gap numbers (8px) as faint measurement marks - only useful if
  Mario wants the geometry documented on the mock itself.
