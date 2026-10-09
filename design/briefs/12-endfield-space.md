# 12 · Endfield II (space) - brief (2026-10-10)

Evolution of 11-endfield (keep its tokens, chamfers, brackets, diamonds, layered plates, SNAP/SETTLE curves).
Mario's art direction, verbatim where possible, with reference images in design/refs/endfield/:

1. **Fullscreen transitions**: "divide the screen 5 vertical tiles and 7 horizontal so 35 total, and each gets
   randomly replaced with the section of the app" -> when a window goes fullscreen (F) or a fullscreen window
   leaves, the screen is a 5 x 7 grid (5 columns, 7 rows); tiles flip/cut over to the new content in a random
   order (fast, ~25-40 ms stagger between tiles, each tile a short SNAP cut/slide), until the whole app is shown.
2. **One space, moving camera**: "Everything exists in the same space but the camera shifts, rotating around the
   main focal point" -> windows and HUD live in ONE 3D space (CSS perspective on the screen, a world container);
   transitions (focus change, snap, HUD, fullscreen) move the CAMERA - a small rotation (a few degrees) + slight
   dolly around the focal element - instead of flying elements around. Subtle, smooth, SETTLE eased.
3. **Static background, short entries**: "background is always static but main elements slide into place, not
   from off screen, lets say vertical banner style, they get displayed in 1 go, but then fade slide to place" ->
   the wallpaper never moves (it is outside the camera). Main elements (windows, HUD cards, banners) appear all at
   once close to their final spot (offset ~24-60 px, low opacity), then fade + slide the remaining short distance
   into place. Vertical banner style = tall plates/strips.
4. **Small elements**: "smaller elements, like frames or small text, slow fade into the place" -> brackets,
   frames, microtext, labels fade in slowly (600-900 ms) after the main element lands.
5. **Static 3D models with heavy grain** (refs/3d-crystals-grain.png): amber/yellow crystalline objects with
   glowing yellow glyphs inside, soft light, HEAVY film grain. Use them as decoration: in the HUD and the wallpaper
   corners (a few, static, no spinning). In HTML: canvas-rendered faceted polyhedra (flat/gradient shading, amber,
   inner glyph glow) + an SVG feTurbulence grain overlay; render once to a canvas, never animate per frame.
6. **Small Endfield details** (refs/small-print-details.png): thin wide-tracked wordmark ("CLOCKMOST" in the
   ENDFIELD style), tiny labels, long thin rules, a hatched block, barcode-like strips, grey on grey.
7. **Tabs** (refs/tabs-centered.png): a centered tab strip with surrounding area (diagonal-hatch backdrop band);
   round-ish icon buttons; the ACTIVE tab is a yellow block with a faint topographic line texture that drops below
   the strip. **Notifications** (refs/notify-diamond-a.png, -b.png): orange diamonds (dark outline) on a tab's
   corner whose outline blinks and expands (a pulsing expanding ring/diamond), the "notification status". Use this
   for: the HUD's app switcher / workspace tabs, and Firefox's tab strip skin; Discord unread = orange diamond.
8. **Topographic floor** (refs/topo-floor-reflective.png): "a lot of topology map imagery, but doesn't get painted
   other color, it's a black floor, with the elevation lines being reflective, and that's where the color contrast
   comes from" -> the wallpaper is a black floor with contour lines that read as glossy/specular (light grey-white
   highlights with soft falloff, slight sheen), no colour fills. Static (rendered once).

Keep: dark ground, yellow structural, tri-band once per view, readable windows, nothing busy at rest.
