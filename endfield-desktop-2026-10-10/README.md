# Endfield desktop — design handoff (2026-10-10)

A self-contained copy for any model or person to keep working on the desktop design. **Everything you need is in
this folder, and everything you make stays in it.** Don't write anywhere else: the originals live in Mario's
recipe repo, and this folder is a copy of them.

## What this is

Mario is moving his desktop PC back to Linux (CachyOS + KDE Plasma, custom-built "mod it till it breaks"). We're
designing the **shell's look and motion**: window open/close/focus/snap, a HUD (clock, tabs, search, tray,
notifications), an app drawer, toasts, and per-app skins (Firefox, Discord). The design language is
**Arknights: Endfield**, the game's UI. Mockups are HTML pages; nothing is built for real yet.

How he uses the screen: the main monitor is usually one fullscreen app. The side screen is split 1:1, 1:2 (two apps stacked) or (two apps stacked) 2:1 or 2:2
(drag to an edge or Win+arrows). The screen stays clean, and the essentials show up when the mouse goes over them or
he presses the Win key ("hit windows button and see a clock").

**Motion makes or breaks it.** Mario: "animations are what make and break designs". A static pretty frame counts for
nothing; how things enter, layer and settle is the point.

## Folder layout

| path | what |
|---|---|
| `brief/12-endfield-space.md` | **the spec: rules 1-24. Read all of it.** |
| `brief/11-endfield.md` | the earlier Endfield brief (base tokens) |
| `refs/` | named reference screenshots + the rewards clip (`rewards-collect.mp4`, frame sheets, notes) |
| **`src/`** | **the shared workplace - where finished parts live.** Plain JS/CSS, no build step, loaded with script tags |
| `src/core.js` | the `EF` engine: SNAP/SETTLE/SOFT curves, rAF tweens (`EF.tween`, `?slow=N`), noise, topo contours, grain |
| `src/tokens.css` | Endfield colours, chamfers, hatch, barcode, fonts as CSS variables |
| `src/apps/phonograph.*`, `src/apps/chat.*` | the phonograph (Spotify) and chat (Discord) as reusable app surfaces (`EF.phonograph()`, `EF.chat()`); each `.html` = its preview page |
| `src/assets/` | shared SVGs (topo card art, topo floor strip) |
| `desktop.html` | the future fake desktop that composes everything. **Today only a smoke test** (proves core + tokens load) |
| `components/` | standalone mockups. **`ds-app-drawer.html` = THE drawer** (Mario 10-12), with `ds-app-card.html`. Also the originals of the ported apps (`ds-spotify-v2`, `ds-chat-v2`), `toast` (stays standalone), `topo` + SVG motifs |
| `concepts/12-endfield-space.*`, `kit/` | the older harness concept: camera, mosaic fullscreen, floor. Kept as a parts bin for the compose step |
| `out/` | built harness pages; `out/shots/` = screenshots (git-ignored) |
| `_hold-2026-10-12/` | retired files (old concepts 3/11/13, early card/drawer tests, old shots, tool leftovers). Purge once nothing is missed |

Direction: every part moves into `src/` (one shared engine), then `desktop.html` composes them into one moving screen.

## Base tokens (Endfield)

- Ground `#0F0F10`, steel `#33363C`, **yellow `#FFFA00`** used structurally (bars, blocks, selected states), not
  as decoration.
- The **tri-band** (yellow -> cyan -> magenta stripe) appears **once per view**.
- Shapes: chamfered top-right and bottom-left corners, corner brackets top-left and bottom-right, diamond markers.
- Curves: SNAP `cubic-bezier(1,0,0.7,1)`, SETTLE `cubic-bezier(0.16,1,0.3,1)`. Durations 120 / 280 / 600 ms.
- Small print everywhere: thin wide-tracked labels, barcodes, microtext, hatching, dot grids, topographic lines.
- Dark is the default, but light-grey pages with dark sections are allowed (rule 23). Never pure white.

## The rules in one breath (full text in the brief)

1. Fullscreen = a 5x7 mosaic of tiles cutting over.
2. One 3D space with a camera that moves.
3. Elements appear at once and then fade-slide a short way home.
4. Small details fade in slowly afterwards.
5. Grainy 3D crystals.
6. Small print.
7. Centred tabs with pulsing orange diamond notifications.
8. A black floor with reflective contour lines.
9. Information is printed in the world (on the floor or angled plates); clickable things are a flat HUD on the camera.
10. Every screen moment is a stack of 6-9 layers, each with its own timing.
11. Crimson timer tags.
12. The reward reveal.
13. The app drawer: solid top, alpha fading into frosted glass, its own bottom bar; it wipes in left to right.
14. The location toast: wipes in left to right with a feathered right edge, content fade-slides in, a static fade out.
15. **Exits never move** (fade or cut in place).
16. Each app gets its own entrance (Firefox, Discord, workspaces...).
17. Discord looks like the in-game chat.
18. Icons: an X with an empty centre, plus = the same X rotated 45°, a split ring.
19. Vertical tab states stack (selected = yellow + dots + motif; hover = rings).
20. Soft dotted gradients finish the edges.
21. A second, different tab style.
22. **Never one blanket**: every component gets its own design, always 6-9 layers of small textured detail.
23. Light-grey pages with dark sections.

## History and verdicts (Mario's words)

| concept | verdict |
|---|---|
| 1 Suminagashi | rejected: "generic", light mode |
| 2 Origami | rejected (only the paper plane was cool) |
| **3 Drafting table** | **favourite**: "animations fucking smooth"; the close needs work |
| 4 Delayed Present | rejected |
| 5 Black-Space Survey | kept: sleek, but "generic cube", the animations don't match |
| 6 Obsidian Loom (Gemini) | rejected: "too generic" |
| 7 Magnetic Anomaly | the idea kept; the execution was rough |
| 10 Endfield (Muse) | "horrible" |
| 11 Endfield (Claude) | no verdict; Mario gave the art direction that became rules 1-11 |
| **12 Endfield II (space)** | **newest**, built before rules 12-23; **no verdict yet** |

What failed before: "generic". Flat dark boxes with a yellow accent are NOT Endfield. Depth, layers, small detail
and real motion are what make it.

## Next job

1. Port `components/ds-spotify-v2.html` into `src/` (app window surface) on the shared engine, with the same look.
2. Same for chat (done 10-12). The toast is NOT ported (Mario: "not worth it") - it stays a standalone mock.
3. Compose `desktop.html`: wallpaper + drawer + the phonograph and chat as windows entering, so Mario sees the motion together.

Show it to Mario and get his reaction before polishing. He decides one thing at a time.

## Technical traps

- Drive all motion with `requestAnimationFrame` + `performance.now()` tweens. Headless Edge
  (`--virtual-time-budget` screenshots) freezes CSS transitions and Web Animations, so CSS-only motion can't be
  checked. Concept 12 has a `?slow=N` URL parameter that slows everything N times, for mid-motion screenshots.
- Draw heavy textures (topo floor, crystals, grain) once to a canvas, not every frame.
- Keep it at 60 fps in a normal browser. It's a mockup of a compositor, and if it stutters it reads as bad design.

## Working with Mario

- Write in English, plainly. Raise one decision at a time, with a recommendation; he wants honest pushback.
- His references are **examples**. Each surface's exact look gets decided as you go.
- Don't put text or lettering on any character's clothes.
- Save every reference he gives you into `refs/` with a descriptive name, and add a rule to the brief. Don't lose
  them.
