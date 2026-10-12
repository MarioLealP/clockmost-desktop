# Order 07 report - Kitty terminal (layout mock)

## What I built
`components/ds-kitty.html` - one static page on `.stage`, linking `ds-shell.css`:

- One focused Kitty window (`.win.focus`, 1500x860, centred) with `.wtitle` `KITTY` + dim lowercase path
  `· ~/src/clockmost-desktop`, and the three rule-18 window buttons.
- Kitty's tab bar (34px, `--rail`) under the title bar: flat segments `1 FISH` (active = yellow block, dark text),
  `2 SSH CLOCKMOST-ADMIN` with a small orange `.notif` (activity), `3 BTOP`; `.micro` `KITTY 0.49 · 3 TABS` at the right end.
- Terminal body (`#0d0d0e`, 15px `--mono`, lh 1.5, padding 18/22) with an Endfield 16-colour ANSI palette written
  as CSS variables (`--an-*` + `--an-br*`) and used throughout: fish prompt (cyan user@host, ink path, yellow `main`
  branch, ink `>`), `git status` (2 modified + 1 untracked in red, hints dim), `ls -la` (dirs blue, executable green,
  hidden dim, plain file white), `paru -Syu` excerpt (cyan `::` headers, 3 upgrade lines with old -> new), ending on
  a prompt with a yellow block cursor (static). Faint 3px scrollbar thumb at the right edge, at the bottom.
- On the stage below the window: the palette legend - `.label` `ENDFIELD ANSI 16`, barcode + `.micro`
  `ANS-16 · TERM THEME · KITTY 0.49`, and 16 swatches with their hex in `.micro` under each.

## Screenshots
- `out/shots/07-1.png` - first look (hex labels under the swatches were crowded).
- `out/shots/07-2.png` - after widening the swatch gap; this is the final one.
- Reference shots taken for comparison: `out/shots/07-ref-spotify.png`, `out/shots/07-ref-drawer.png`,
  `out/shots/07-ref-drawer-open.png`.

## Checks
`kit/shot.sh` reported no page errors. I looked at both screenshots: no overlapping or clipped text, no line
overflows the window (longest line ~60 chars vs ~170 that fit), nothing off screen, terminal content fills the
body with the last prompt at the bottom. Two screenshot-and-fix rounds used.

## What I'm unsure about
- The title bar shows the path lowercase (`text-transform: lowercase` on the title span) even though `.wtitle` is
  uppercase by house style - the order wrote the path in lowercase and a path reads wrong uppercased. Easy to flip
  if Mario prefers it uniform.
- Bright-yellow and the other bright ANSI variants are my picks (the order only fixed the 8 base colours).
- `git status` in the mock lists `ds-shell.css` and `STYLE.md` as modified for flavour; the repo is clean.

## Ideas
- A `?state=btop` or `?state=ssh` variant of the same window (tab 2 / tab 3 content) if Mario wants the tabs shown
  one at a time later.
