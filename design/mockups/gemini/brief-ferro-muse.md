You are writing ONE animated HTML design mockup for a Linux desktop concept. Read these files in your
workspace first: CONCEPT-API.md (the hook API - follow it exactly), harness.html (the shared page your
code is inlined into: a fake 1920x1080 side screen with two windows, Firefox + Discord, split 1:1;
controls for open/close/snap 1:1|1:2|2:1/focus/HUD), and concepts/3-drafting.js + concepts/3-drafting.css
(the reference the user LOVED for smoothness - match its quality bar and reuse its approach).

Hard requirements:
- Output ONLY files, in exactly this format, nothing else before/between/after:
=== FILE: concepts/<slug>.js ===
```js
...
```
=== FILE: concepts/<slug>.css ===
```css
...
```
=== FILE: concepts/<slug>.json ===
```json
{"title": "<title>", "about": "<one line, under 200 chars>", "source": "Muse Spark 1.3"}
```
- The JS sets `window.CONCEPT = {...}` and wraps everything else in a function scope (the harness
  already declares top-level `W`, `H`, `$`, `sleep` etc. - do not redeclare them at top level).
- Drive ALL main motion from a requestAnimationFrame tween engine clocked by performance.now(), with a
  ~16-34 ms setTimeout fallback when rAF does not fire (headless screenshot checks freeze CSS
  animations/transitions and Web Animations) - like 3-drafting.js does. CSS animations only for tiny
  decoration.
- Self-contained: no external fonts, images, CDNs. CSS, inline SVG, canvas only. Smooth at 1920x1080:
  no full-screen per-frame canvas redraws; small canvases/SVG are fine.
- DARK theme but not "everything pure black"; windows stay readable; app content never obscured at
  rest; effects are transitional (nothing flickers or moves busily at rest).
- ONE coherent motion language across open, close, snap, focus, seam and HUD - the user criticised a
  previous concept because "the animations don't really match each other".
- Durations: open/close/snap 350-700 ms, focus 200-300 ms, HUD in 400-600 ms / out 300-400 ms.
- Implement every hook: wallpaper, onOpen, onClose, onMove (must call place(win, to)), onFocus, seam,
  hudShow, hudHide, plus `gap` if the seam needs space. HUD content: large clock + date, tray items,
  notifications, and a search line (data comes from the hudShow data argument).
- The user's verdicts so far: drafting table "animations smooth, genuinely amazing" (weak: its eraser
  close); black-space "sleek but generic cube windows, animations don't match"; ink/origami/afterimage
  concepts rejected as generic, light-mode, gimmicky or too black. No gimmick props.
SLUG: 7m-magnetic-anomaly   TITLE: "7m · Magnetic Anomaly (Muse)"
Concept: pitch-black ferrofluid reacting to unseen magnetic fields forms the window structures.
Motion language: spiky magnetic attraction/repulsion, liquid clustering into sharp geometric arrays.
- Open: a puddle of black fluid erupts into sharp metallic spikes that flatten instantly into a perfect
  dark mirror surface, which becomes the window.
- Close: the field cuts; the window shatters into tiny liquid beads that get pulled into the nearest
  screen edge.
- Snap: approaching the edge raises magnetic spikes; the spikes form a solid line at the new ratio
  (1:1 / 1:2 / 2:1) showing where it will settle, then the window solidifies there.
- Focus: the active window's border bristles briefly with small reactive spikes, then calms to a thin
  liquid-metal sheen; inactive windows are dull matte. Keep it calm at rest (no constant bristling).
- Seam: an interlocking zipper of fluid spikes between the two windows - subtle at rest, active when the
  split changes.
- HUD: rises from a bottom corner as a smooth liquid droplet that splits into sharp geometric shards
  holding the clock, tray, notifications and search; melts away on dismiss.
- Wallpaper: near-black with a faint magnetic field-line texture.
