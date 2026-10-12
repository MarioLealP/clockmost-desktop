# House style + worker rules for the layout mocks (2026-10-12)

Read this whole file, then your work order. You build ONE static layout page.

## What this is
Mario's future Linux desktop (KDE Plasma + a custom shell), designed in the language of the game Arknights: Endfield,
but as **real functional apps, not game screens**. Mario's words about an earlier attempt: "you basically just copy
pasted the game... this is not the game, but an actual functional app". So: Endfield is the skin (type, small print,
structural yellow, plates, brackets, glass), the content is a real desktop.

**Layout only.** Mario: "just want the general layout for everything so we know how everything will look like".
No animations, no transitions, no hover effects, no JS motion. Static pages. Show states side by side or via a
`?state=` URL parameter (read with `new URLSearchParams(location.search)`), never by animating.

## Look at these first (the two approved pieces - your page must look like it belongs with them)
Take a screenshot of each and LOOK at it (Read tool shows images):
- `components/ds-spotify-v2.html` - the phonograph (Spotify). Top bar, search field, window buttons, list panel.
- `components/ds-app-drawer.html` - the app drawer (frosted glass). Mario: "this is the correct one".
(`components/ds-chat-v2.html` - Discord - is NOT approved; it is being redone. Don't copy it.)
Screenshot: `kit/shot.sh components/ds-chat-v2.html out/shots/<yourslug>-ref-chat.png 2500`

## The shared stylesheet - USE IT
Every page links `ds-shell.css` (same folder as your page, `components/`):
`<link rel="stylesheet" href="ds-shell.css">` and uses its classes: `.stage`, `.win` + `.wtop` + `.wtitle` + `.wctl`
+ `.wb` + `.wbody` (window frame), `.field` (search/input), `.pill`, `.chip`, `.kbd`, `.tgl`, `.sld`, `.panel` +
`.bk.tl/.bk.br`, `.glass`, `.frost`, `.dots`, `.hr`, `.micro`, `.label`, `.barcode`, `.notif`, `.tag`, `.triband`,
`.sel`, and its colour variables (`--ground`, `--ink`, `--dim`, `--yellow`...). Read the file - it is short.
Do not copy its rules into your page and do not edit it. Your own CSS goes in your page's `<style>`.

## Rules of the look
- Screen = 1920x1080. Body = `<div class="stage">` (calm Endfield ground, the default), `<div class="stage wall">` (darkened screenshot of Mario's busy desktop - only if glass needs content behind it) or `<div class="stage plain">`.
- Titles and labels: `var(--mono)` (Consolas), UPPERCASE, wide letter-spacing (.14-.22em). Readable content
  (messages, file names, page text): `var(--body)` (Segoe UI), normal case.
- Yellow `#FFFA00` only for: active / selected / focused / the search prompt `›››`. Never as decoration.
- Notifications = THE shared diamond, never a custom one: `<span class="notif"></span>` inline in a row, or `<span class="notif pin"></span>` inside a position:relative host (sits on its top-right corner). One size everywhere. Urgent / timer = crimson `.tag`.
- Tri-band stripe: at most ONCE per screen.
- Colour: be generous (Mario: "be a bit more wild with the colors") - app colours as flat washes, corner cuts, strips, bars. **No glows** (no text-shadow / drop-shadow halos) - Mario took them out of the dock.
- Small print in every component: a barcode, a micro code line (e.g. `SR-1415 · 33 RPM · SIDE A`), a label.
  Keep it faint (`--faint` / `--ghost`), it is texture, not content.
- Corners: 2px on plates and windows, 6px on fields and buttons, pills round. No other radii.
- Real content, Mario's world: user `benylin`, host `clockmost`, apps Firefox / Discord / Phonograph (Spotify) /
  Kitty / Dolphin / Steam / KeePassXC / Spectacle. No lorem ipsum. No text on characters' clothes (no characters).
- Icons: simple line icons as inline SVG, stroke = currentColor, stroke-width ~2.4-3.2, square caps. The window
  buttons use exactly these (24x24 viewBox):
  - minimize: `<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`
  - maximize: `<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14"/></svg>`
  - close (rule 18 X - four arms, EMPTY centre): `<svg viewBox="0 0 24 24"><path d="M5 5l5 5M14 14l5 5M19 5l-5 5M10 14l-5 5"/></svg>`
  - plus = the same X rotated 45 degrees.
- Real app logos: only `components/firefox.svg` exists. For other apps use a letter tile or a simple line glyph.
  Do not download anything (network is blocked).

## Worker rules
- You may CREATE only the file(s) your order names, plus `orders/<your order number>-report.md`.
  Do not edit any other file. Screenshots go to `out/shots/<yourslug>-*.png`.
- Allowed commands: `kit/shot.sh`, `node --check`, `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `sed -n`, `diff`,
  `mkdir -p`, `git status/diff/log`. Everything else is blocked on purpose; do not look for workarounds.
- Check your page: `kit/shot.sh components/<file>.html out/shots/<slug>-1.png 2500` (it prints page errors - there
  must be none), then LOOK at the screenshot with the Read tool. Check for: overlapping or clipped text, things off
  screen, empty areas that look broken, anything that does not match the reference pieces.
  Fix what is wrong. **At most 3 screenshot-and-fix rounds**, then stop and report.
- Do not build anything the order does not ask for. Ideas go in the report under "Ideas", not in the page.
- Report (`orders/<number>-report.md`, and the same as your final message, short): what you built, the screenshot
  file(s), what you are unsure about, ideas.

## Desktop geometry (shared by every part - keep to it so the pieces fit together)
- How Mario uses the screens: the main monitor usually shows ONE fullscreen app; the side monitor is split.
  **The desktop stays clean: the top bar and the dock are hidden and appear when he presses the Win key or moves the
  mouse to that edge.** Mocks show them in their visible state.
- **Top bar**: full width, 40px tall, at the very top, `.frost` without side borders, hairline at its bottom edge.
- **Dock**: floating, bottom centre, 72px tall plate, 12px above the screen bottom.
- **Panels that drop from the top bar** (quick settings, clipboard, calendar, notifications): 8px below the bar,
  right-aligned under the icon that opens them, 16px from the screen edge.
- **Tiled windows** (side monitor): 8px gaps between windows and 8px from the screen edges.
- **Window frame**: always `.win` + `.wtop` (56px title bar) from ds-shell.css; a maximized/fullscreen app uses
  `.win.max` filling the screen (its title bar is the app's own top row).
- Window buttons: min / max / close, always top right, always the three icons above.
