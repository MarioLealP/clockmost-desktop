# Report - work order 06 - Firefox layout mock (2026-10-12)

## What I built
`components/ds-firefox.html` - Firefox fullscreen on the main monitor: `.stage.plain` + a `.win.max` filling
1920x1080, Zen-style vertical tabs. Links `ds-shell.css`, no JS, no motion, one static state.

- **Left sidebar, 272px, `--side`**: Firefox logo 22px + `.wtitle` FIREFOX (yellow focus block from `.win.focus`) +
  micro `157.0 · PROFILE BENYLIN`; 4-column pinned grid of 48px tiles (G / P / Z / play glyph, 6px corners, `--field`
  bg); `.label` `SPACE · CLOCKMOST` with chips CLOCKMOST (yellow) / PERSONAL / GAMES; 9 tab rows at 36px
  (16px favicon + body-font title with ellipsis) - active tab is a yellow `.sel` block, one tab carries the crimson
  `.tag` `REC`, one the orange `.notif`; a FELT group (small violet chip header, two tabs indented on a thin violet
  left line - tabs reference the felt-dashboard / felt rig work); bottom: `+ NEW TAB` (plus = the X rotated 45°) and
  micro `9 TABS · 2 GROUPS` with a barcode.
- **Toolbar (right of the sidebar), 56px, hairline under**: borderless 28px back / forward / reload buttons, URL
  field centred (`.field`, 760px, lock glyph + `git.clockmost.com` in `--ink` + path in `--dim`), three bordered
  extension buttons (uBlock shield, KeePassXC key, plug for Vencord-free), then the three STYLE.md window buttons.
- **Content**: a plain dark Gitea repo page for `Benylin/clockmost-desktop` - deliberately neutral greys, not
  Endfield: repo header (name, Private chip, Star 12 / Watch 3), file table (`design`, `install`, `packages`,
  `README.md`, `TODO.md` with last commit messages + dates), README preview with a heading and two paragraphs.
- **Downloads popup** bottom-right of the content (`.panel`, 320px, brackets): `.label` DOWNLOADS, green check on
  `clockmost-desktop-recipe.tar.zst · 18.2 MB · DONE`, `cachyos-260809.iso · 2.9 GB · 64%` with a thin yellow
  progress bar, micro `DL-2608 · 2 ITEMS`.

## Screenshots
- `out/shots/06-1.png` (first pass - extension buttons were stacked, fixed)
- `out/shots/06-2.png` (extension row fixed - URL field slightly off-centre, fixed)
- `out/shots/06-3.png` (final - toolbar and field centred, all checked)
- refs I looked at first: `out/shots/06-ref-spotify.png`, `out/shots/06-ref-drawer.png`

## How I checked
`kit/shot.sh` x3 (no page errors on any run); looked at every screenshot with the Read tool. Checked against the
order: no text overflows the tab rows or the URL field; nothing clipped or off screen; chrome matches the
phonograph's language; the web page stays plain so the browser frame reads as Endfield. 3 screenshot-and-fix
rounds used, stopped there.

## Unsure about
- The order's footer micro says `9 TABS · 2 GROUPS`, but only one group (FELT) is specified - I built exactly one
  group and kept the micro text literal. If Mario wants them consistent, either a second (collapsed) group or a
  `1 GROUP` micro would fix it - his call.
- The two FELT tabs are inferred from the project's felt references (`felt-dashboard`, `#felt-dev`, "felt rig"):
  `felt-dashboard · localhost` and `felt rig checklist · Plane`. Easy to change to real ones.
- The Vencord-free extension icon is a generic plug glyph (the order says "just 3 line icons").
- The downloads panel micro `DL-2608 · 2 ITEMS` is invented small print to satisfy the house style's small-print
  rule.

## Ideas (not built)
- A faint tick ruler down the sidebar's right edge (like the phonograph list) would fill the empty middle of the
  tab column - kept out for now since rule 22 says each component gets its own recipe.
- The file table could get a branch/commit bar row above it if the page needs more Gitea furniture later.
