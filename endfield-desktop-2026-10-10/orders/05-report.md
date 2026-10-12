# Work order 05 report — the dock (2026-10-12)

## What I built
`components/ds-dock.html` — one static 1920x1080 layout mock, linking `ds-shell.css`, no motion.

- **Background**: `.stage` with one dimmed `.win.blur` window (1300x760, centred slightly high, title
  `FIREFOX`, empty body, min/max/close rule-18 buttons) so the dock reads as an overlay.
- **Dock**: `.frost` plate, 72px tall, 12px above the screen bottom, bottom centre, width fits content,
  2px corners. Its own details: hairline along the top inner edge, tiny tl/br corner brackets, faint
  barcode + micro `DOCK · 09 PINNED` at the far right end.
- **Content left to right**: app-drawer button (52px tile, 2x2 grid glyph), hairline divider, 9 app tiles
  in the drawer's tile language (52px, 6px corners, dark glassy + topo texture + inset shadow, coloured
  3px underbar per app), hairline divider, downloads stack tile (tray glyph, tiny `3` badge).
- **Running state**: 4px dots under the tiles (`--ink2`), Firefox 2 dots, Discord / Phonograph / Kitty 1
  each. Firefox focused: yellow underbar instead of its colour + yellow dots.
- Discord carries the orange `.notif` diamond at its tile's top-right.
- Static hover example: `PHONOGRAPH` tooltip (dark plate, mono 11px, 6px pointer) above the Phonograph tile.
- `?state=hidden`: dock hidden, only a faint 120x4 handle at the bottom centre (read via
  `URLSearchParams`, static switch, no animation).

App marks: `firefox.svg` for Firefox; letters D / K / S / L; line glyphs for Phonograph (note), Dolphin
(folder), KeePassXC (key), Spectacle (crop marks), downloads (tray). Underbar colours for
Firefox / Discord / Phonograph / Kitty / Steam / KeePassXC match the drawer's palette; Dolphin, Spectacle
and Lutris had no drawer entry, so I picked cyan / magenta / lavender (yellow kept reserved for focus).

## Screenshots
- `out/shots/05-1.png` — default state (dock visible).
- `out/shots/05-2.png` — `?state=hidden` (handle only).
- `out/shots/05-zoom.png` — 2x zoom of the dock (inspection shot via shot.mjs evalExpr).
- `out/shots/05-ref-spotify.png`, `out/shots/05-ref-drawer.png` — the two approved reference pieces.

## How I checked
Two screenshot-and-fix rounds via `kit/shot.sh` (both states each round; zero page errors both times),
plus a 2x zoomed shot to inspect the small details. Round 1 found one defect: the KeePassXC glyph read as
a magnifying glass; I redrew it as a horizontal key (bow + toothed shaft) and re-shot — it now reads as a
key. I looked at every shot with the Read tool: no clipped or overlapping text, nothing off screen, tiles
and dots aligned, tooltip pointer points at the tile, print block sits at the far right end.

## What I'm not sure about
- The order says Firefox gets "a yellow dot"; it has 2 windows so it shows 2 dots — I made both yellow
  (the whole focused app's indicator is yellow). Easy to change to one yellow + one grey if you prefer.
- Underbar colours for Dolphin / Spectacle / Lutris are my picks (see above) — tell me if Mario has
  brand colours for them.
- The Firefox window body is empty per the order; at full size it is a large dark area. If it reads too
  bare, a faint `.dots` texture or an address-bar strip would warm it up — not built, since the order says
  empty.

## Ideas
- The downloads tray could also carry a tiny `.micro` `DL · 03` code line next to the badge, in the same
  small-print language as the dock's right end.
- A third state `?state=peek` could show just the handle pulled up ~12px with the tooltip row visible,
  between "clean" and "full dock" — only if Mario wants the reveal step documented too.
