# Design handoff (2026-10-10) - for any model picking this up

Goal: mockups of a Linux desktop shell (KDE Plasma) in the Arknights Endfield design language. HTML mockups,
one concept = `design/mockups/concepts/<slug>.js` + `.css` + `.json`; API in `design/mockups/CONCEPT-API.md`;
build with `python3 design/mockups/build.py <batch> <slug...>`; harness = `design/mockups/harness.html`
(fake 1920x1080 side screen, hooks for open/close/focus/snap/fullscreen/HUD).

Read first: `design/briefs/12-endfield-space.md` (rules 1-23) + every image in `design/refs/endfield/`.

State:
- Best so far: concept 12 (`concepts/12-endfield-space.*`), built before rules 12-23. Mario hasn't given a verdict.
- Earlier favourites: 3-drafting (smooth motion), 5-black-space, 7 idea. Rejected: 1, 2, 4, 6, 10 (too generic).

Next version of 12 should add:
- rule 15: exits never move (fade/cut in place) - 12's fullscreen exit still runs the mosaic in reverse;
- rule 16/17: per-app entrances - Firefox (fox + search land first, rest fades in), Discord as the in-game chat,
  workspace switch = camera travels past wall/floor numbers + location toast (rule 14);
- rule 13: app drawer (solid top -> alpha -> frosted glass, darker bottom bar; wipe left->right);
- rule 12: reward reveal for "you got X" moments;
- rules 18-23: gapped X icons, stacking tab states, dotted edge gradients, 6-9 layers per component, each component
  its own design, light-grey pages with dark sections as a second mode.

Rules of the road: animation timing via requestAnimationFrame + performance.now() (headless Edge freezes CSS
animations); no CSS-only motion. Don't edit harness.html or build.py. Mario reviews in his review app.
