# Work order 01 - port the phonograph into src/ (2026-10-12)

From: Claude (reviewer). To: the worker. Read this whole order before touching anything.
You do NOT need to read the brief, refs/, concepts/ or kit/harness.html for this job. This is a mechanical port,
not a design job.

## Goal
Move `components/ds-spotify-v2.html` (one 485-line standalone page, look approved by Mario) into the shared
`src/` workplace as a reusable app surface, with **identical pixels and identical motion**.

## Files
You may CREATE only these (nothing else, anywhere):
- `src/apps/phonograph.css` - all of the page's CSS, scoped under the root class `.ef-phonograph`
- `src/apps/phonograph.js`  - `EF.phonograph(opts) -> el` (pattern: read `src/surfaces/drawer.js` first)
- `src/apps/phonograph.html` - 1920x1080 preview page (pattern: read `src/surfaces/drawer.html` first)
You may APPEND to `WORKLOG.md` (one entry at the end). Do not modify ANY other file, including
`components/ds-spotify-v2.html` (it stays as the reference), `src/core.js`, `src/tokens.css`, kit/, out/baseline/.

## How
1. `phonograph.css`: move every style block from the page. Selectors become scoped under `.ef-phonograph`.
   The page paints backgrounds on `html`, `html::before`, `body`, `body::before`, `body::after` and uses
   `position: fixed` - turn those into layers inside the root (e.g. `<div class="bg bg-a">` children or the
   root's own pseudo-elements) with `position: absolute`. The root is `position: relative; width: 100%;
   height: 100%; overflow: hidden` so it can later live inside a desktop window. Keep every value as is.
2. `phonograph.js`: an IIFE like drawer.js. `EF.phonograph({ albums, tracks, feat })` builds the same DOM
   (markup as a template string), and returns the root element with methods:
   `el.enter()` (the entrance), `el.swapTo(i)` (album swap), `el.leave()` (exit fade in place),
   `el.destroy()` (stops the visualizer/ambient rAF loops). The page's current data (albums, track rows,
   lyrics) becomes the default for `opts`. Query elements inside the root only (no `document.querySelector`,
   no ids that would clash with a second instance - classes are fine). Keyboard arrows: keep, but listen
   only while the element is connected.
   Use the shared engine from `src/core.js` where it maps 1:1: `EF.SNAP`, `EF.SETTLE`, `EF.tween`, `EF.SLOW`
   (it already reads `?slow=N`). The page's own `bez()`/`tween()` uses the same curves; if a timing or
   signature can't be mapped exactly, keep a small local helper and say so in the worklog. Do NOT edit core.js.
3. `phonograph.html`: loads `../tokens.css`, `phonograph.css`, `../core.js`, `phonograph.js`, mounts one
   instance full screen, reads `?feat=N` into opts, calls `el.enter()`, and exposes it as `window.ph` (so the
   check below can run `ph.swapTo(2)`).

## Check (must all pass before you report)
Screenshots (real-time, Windows Edge over CDP): `kit/shot.sh <page[?query]> <out.png> [waitMs] [evalExpr]`.
Pixel diff: `UV_PROJECT_ENVIRONMENT=/tmp/uvenv-pi uv run -q --no-project --with pillow python -I kit/imgdiff.py <baseline> <new> <diff.png>`.
Write all new screenshots to `out/shots/01-*.png`.
- `node --check src/apps/phonograph.js`
- shot.sh must print no "page errors".
- Compare each against its baseline in `out/baseline/` (made from the original page, deterministic:
  two runs of the original diff to exactly 0):
  | new shot | command | baseline |
  |---|---|---|
  | settled | `kit/shot.sh src/apps/phonograph.html out/shots/01-settled.png 3000` | `phono-settled.png` |
  | mid-motion | `kit/shot.sh "src/apps/phonograph.html?slow=10" out/shots/01-mid.png 2500` | `phono-mid-slow10.png` |
  | ?feat=2 | `kit/shot.sh "src/apps/phonograph.html?feat=2" out/shots/01-feat2.png 3000` | `phono-feat2.png` |
  | swap | `kit/shot.sh src/apps/phonograph.html out/shots/01-swap2.png 3000 "ph.swapTo(2)"` | `phono-swap2.png` |
- **Done when every diff is under 0.05%.** If a diff is higher, open the diff png bbox, find the cause, fix.
  Do not "fix" by changing the baseline or the reference page.

## Stop rules
- Same failure after 2 fix attempts: stop, write what you tried in WORKLOG.md, report.
- Do not improve, redesign, tidy or "fix" anything in the look (e.g. the chevron motif overlapping the lyrics is
  a known issue - leave it). No new features, no new files beyond the three, no refactors of other code.

## Report (your final message, short)
Files created; the four diff percentages; anything you could not map 1:1; anything left undone.
Append the same as a dated WORKLOG.md entry headed `## 2026-10-12 - Pi (order 01: phonograph port)`.
