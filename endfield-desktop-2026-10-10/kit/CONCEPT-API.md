# Concept API (design/mockups)

A concept = `concepts/<slug>.js` (+ optional `<slug>.css`, `<slug>.json` {"title","about"}).
`build.py <batch> <slug>` inlines it into `harness.html` -> `E:/Felt/review/<batch>/pending/<slug>.html`.

The JS defines `window.CONCEPT = { ... }` (runs BEFORE the harness). All hooks optional; async hooks
return Promises the harness awaits.

| hook | when | notes |
|---|---|---|
| `gap` (number) | layout | px between the two side-by-side windows (default 0) |
| `wallpaper(wallEl)` | once | build the background in `#wall` (static or animated) |
| `ready(ctx)` | after first layout | ctx = {state, screen, wins, seam, hud, wall, W, H, sleep} |
| `onOpen(win)` | window opened | `win.el` already at its final rect (`win.rect` {x,y,w,h}); animate IN |
| `onClose(win)` | before removal | animate OUT; harness removes `win.el` after the Promise |
| `onMove(win, from, to, place)` | snap / neighbour opens/closes | MUST call `place(win, to)` (sets left/top/width/height + win.rect); animate around it |
| `onFocus(win, prev)` | focus change | harness toggles `.focused` on `win.el` |
| `seam(s)` | layout settles / changes | s = {visible, seam (the #seam el), x, w, h, changing, left, right}; `#seam` is positioned between the windows (width = gap) |
| `onFullscreen(win, on, from, to, place, others)` | F key: focused window to/from fullscreen | MUST `place(win, to)`; hide/show `others` (their `el`); harness tracks `state.full` and adds `.fullscreen` to `win.el` |
| `hudShow(hudEl, data)` | H / hover top edge | data = {time, date, tray[], notes[]}; `#hud` is a full-screen layer above everything |
| `hudHide(hudEl)` | H / Esc / mouse leaves | animate out, then clear |

Windows: `.win.<kind>` (`firefox`, `discord`, `kitty`) with `.titlebar` > `.title` and `.content`.
Screen is 1920x1080 logical px (scaled to fit). Self-contained only: no external fonts/CDNs.

Headless check (Edge on Windows, from WSL):
`"/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu
--hide-scrollbars --window-size=1400,860 --virtual-time-budget=<ms> --screenshot='F:\VMs\x.png'
'file:///E:/Felt/review/<batch>/pending/<slug>.html?auto=hud'` - `?auto=` runs actions (open, close,
r11, r12, r21, focus, full, hud) 300 ms apart after load; the screenshot is taken when the virtual time
budget runs out, so pick a budget that lands mid-animation to check it.
