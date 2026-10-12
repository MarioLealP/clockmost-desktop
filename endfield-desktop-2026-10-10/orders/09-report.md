# Order 09 report - Alt+Tab switcher (layout mock)

## What I built
`components/ds-alttab.html` - the Alt+Tab switcher held open, static HTML/CSS only (no JS), on `.stage`
with `ds-shell.css` linked (all page CSS in the page's own `<style>`):
- 3 dimmed windows behind (`FIREFOX · ENDFIELD WIKI`, `DOLPHIN · HOME`, `KITTY · ~/src/clockmost-desktop`),
  simple `.win.blur` frames with block/mono-line bodies.
- Full-screen dim layer `rgba(8,8,9,.55)` over them.
- Centred `.frost` plate (24px padding, `.bk.tl`/`.bk.br` brackets) with `.label`
  `WINDOWS · 5 OPEN · ALL WORKSPACES` at the top and a barcode + `SW-09 · HELD · SR-1415` micro print beside it.
- Row of 5 window cards, each 300x200 preview + caption (22px app tile, `.label` title, `.micro` `WS 02`):
  Firefox (sidebar + content blocks), Discord (rail + list + bubbles), Phonograph (lavender square + list
  lines), Kitty (mono text lines), Dolphin (sidebar + rows).
- Selected card = Discord (2nd): yellow 2px frame on the preview, caption title in `--ink`, small yellow
  block under the caption. Others: 1px faint frame, `--dim` captions.
- Under the row, centred: `.kbd` `ALT` `.kbd` `TAB` NEXT / `.kbd` `SHIFT` BACK / RELEASE TO SWITCH in `.micro`.

## Screenshots
- `out/shots/09-1.png` - final state (2 screenshot-and-fix rounds; no page errors from `kit/shot.sh`).
- `out/shots/09-ref-spotify.png`, `out/shots/09-ref-drawer.png` - the two approved references I looked at
  (drawer needed `?open` - it starts closed).

## Fixes made after looking
1. The selected-card class `sel` collided with ds-shell's `.sel` (yellow fill) and painted the whole
   caption slab yellow - renamed to `on`.
2. Miniature previews had empty lower halves - filled them out (more bars/rows/text lines, spread to height),
   and nowrap + shorter lines in the Kitty miniature so its text doesn't wrap out of the preview.

## What I checked / didn't check
Checked: screenshot at 2500ms with zero page errors, then looked at it - no overlaps, no clipping, captions
fit on one line, yellow appears only on the selected card, plate is centred and on screen. Static page, so
there is no motion to check (correct for these mocks).
Not checked: nothing else in scope. I did not touch any file besides the page and this report.

## Unsure about
- All captions say `WS 02` (the order's literal text); if Mario wants the "ALL WORKSPACES" label to show
  mixed workspaces, the captions could say WS 01/02/03.
- The caption app tiles use letters (D / P / K / D) - Dolphin and Discord both get `D`, titles disambiguate.

## Ideas (not built)
- A second `?state=` with a smaller switcher (icons-only row) for the "many windows" case.
- A miniature variant with a live-looking Firefox tab strip in the preview.
