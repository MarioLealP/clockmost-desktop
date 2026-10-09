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
9. **World print vs camera HUD** (refs/world-print-03-floating.png, refs/world-print-floor-vs-hud.png): "stuff
   exists in a 3d world, so text is printed on a floor or floating, but not necessarily facing the camera ... the
   small clickable display next to the character is facing the user, so information is relayed on the world not
   forcefully facing the camera, readable but also not the main goal, while clickable things are rendered on the
   camera, like a hud". -> NON-interactive information (workspace number e.g. a huge italic "02" printed on the floor
   in perspective, window telemetry, labels, maybe the clock) lives IN the 3D world: printed on the floor plane or
   floating on its own angled plane (with X/hatch marks, barcode microtext, thin floor arcs like the refs), moving
   with the camera. INTERACTIVE things (HUD tabs, search field, tray buttons, notification cards, any button) are
   flat on the camera/screen plane, facing the user, crisp.
10. **Deep layer stacks** (refs/layer-stack-reconnect.png): "at the end of the day, layers, they layer everything":
   in that reconnect screen, top to bottom: blue strip -> spinning circle (reconnect icon) -> red strip ("//.RECON...")
   -> colourful middle stripe ("-ENDFIELD-" label, green/cyan/yellow segments) -> the logo (white line-art) ->
   the yellow motif (big chamfered vertical banner) -> a white stripe -> background overlay with texture squares (dot
   grids, hatching, binary/microtext, corner brackets, chevrons ‹‹) -> topographic lines at the very bottom. -> Every
   "screen moment" (HUD open, fullscreen transition, a workspace/state change) is a composition of ~6-9 distinct
   overlapping layers in a defined z-order, each entering on its own timing (rule 3/4 motion), so the depth reads.
11. **Timer tag** (refs/timer-tag.png): a small crimson/red tag (#D91E36-ish, slightly angled/chamfered) with a white
   clock icon + a compact duration in bold sans ("2d", "3h", "12m"). Use for time remaining / age: notification age,
   pending update or backup countdown, timed states.
12. **Reward reveal** (Mario's clip `refs/endfield/rewards-collect.mp4`, sheets `rewards-contact-1/2.png`, 10 fps sheets, 4.7 s; Gemini notes in
   `rewards-gemini-breakdown.md`, corrected by me against the frames): "the way rewards are collected, it's hard to
   describe". Sequence, 30 fps:
   - t0: the whole screen behind goes heavy frosted blur + darkens in ~1 frame (no slide, the world just defocuses).
   - +0.1 s: a hairline horizontal rule wipes out from the centre to both screen edges; the header (small icon +
     "Rewards Acquired") sits on it, mid-screen.
   - ~0.5 s hold, then the rule + header TRAVEL UP together to the top band (SETTLE ease) - the reveal "opens" the
     stage under it. Thin vertical hairlines appear at the far left/right edges, a faint ring behind centre, a
     tri-band streak at the top-right corner, a round confirm button at the bottom.
   - the item cards deal in one by one, left to right, ~0.1 s apart, each a quick scale-pop in place (no slide),
     rarity colour on the card; then everything holds still.
   - exit on click: the overlay is gone in ~1-2 frames and the blur snaps back to sharp.
   Use for: anything "you got X" - finished download, update applied, backup done, screenshot saved.
13. **Backpack / app drawer** (refs/drawer-backpack-depot.png, Mario 2026-10-10): "backpack is a frosted glass gradient overlay, this would be great for a app drawer
   style thing. The window opens left to right, slots with the 'icons' along with it, then the minor icons and
   text like the capacity, the two on the bottom right, etc". -> App drawer = a wide panel whose MATERIAL is a vertical
   gradient (refs/drawer-gradient-detail.png; Mario: "the top of the bag is solid color, and it gradients as alpha
   into frost glass ... with a different color 'bottom'"): solid light grey-white at the top (header), alpha
   falling off downward so the lower body is frosted glass with the world blurred through it, then a separate
   darker grey bottom bar. Spatial, not a transition - it does not 'turn into' glass over time, header bar with a square icon tile + title + tiny barcode
   microtext, a filter row of category glyphs separated by thin bars (active one = dark pill), a grid of square
   slots: dark-steel tile, the app icon large, a big white numeral bottom-centre (use: open windows / badge), and a
   thin rarity-colour underbar (use: app category or state). Motion: the panel reveals LEFT -> RIGHT (clip wipe), the
   slots + icons ride in with that same wipe (part of it, not after it), THEN the secondary layer fades in: counters
   ("Capacity 13/40"), filter glyphs, the bottom bar (sort pill, Quick-Stash style pill, the two small glyph
   buttons bottom-right).
14. **Location toast** (refs/toast-location.png, Mario 2026-10-10: "toast notification with 'location' can be
   something else for us"): a dark translucent band across the left of the screen that fades out to the right
   (horizontal gradient, no hard right edge), faint topo contour lines inside it, a ruler scale (10..160 ticks)
   along its bottom edge. Three lines of text: big white title, yellow subtitle, small grey data line with a precise
   number ("Depth 0.1254±0.0054"). For us = a "you are now here" toast: workspace switched ("Workspace 02" /
   yellow "Gaming" / grey "3 windows · 1:2 split"), network/VPN change, game launched, Felt mode change. Motion (Mario: "it goes left to
   right, feathering the right side, fade slides in, static fade out"): the band reveals left->right with a soft
   feathered leading edge on the right (not a hard wipe line), the content fade-slides in, and the exit is a plain
   fade in place - nothing moves on the way out.
15. **Exits don't move** (Mario 2026-10-10, "yes sounds good", from the reward reveal + location toast refs): all
   the motion goes into ENTRANCES. Anything leaving (window close, HUD close, toast, reward overlay, drawer) fades
   or cuts out in place - no slide, no scale, no camera move on exit. Quick and quiet.
16. **Each app/window type gets its own entrance** (Mario 2026-10-10: "we use the endfield design language, but we
   dont need the exact same blanket across every app and every window"; "very open to the idea of different window
   types react different also or are colored different"). One shared language (tokens, rules 1-15), but each type
   has its own motion and colour:
   - **App drawer**: solid colour at the top, alpha-gradient into frosted glass downward, different-colour bottom bar (rule 13 layout: wipe left->right, slots
     ride the wipe, minor layer after).
   - **Workspaces**: switching = the camera travels through the 3D world to the other workspace, using the huge
     numbers on the walls and floor (rule 9 world print) as landmarks; the location toast (rule 14) names it.
   - **Discord**: skinned/entered like the in-game messaging app (rule 17).
   - **Firefox**: opens on its new tab - the fixed fox mark + search bar land first, then the rest of the elements
     fade in around them.
   - Others: decide per app; a type may also carry its own accent colour.
17. **Discord = the in-game messaging app** (refs/chat-empty-choose-dialog.png, refs/chat-conversation.png).
   - Top: breadcrumb "// BAKER / TASKS" top-left (for us "// DISCORD / <server>"), the centred tab strip (rule 7,
     Q/E keys, active = yellow block), round X close top-right; tiny ping + UID telemetry bottom-left.
   - Left column = conversation cards (DMs/channels): dark steel card, square avatar, a thin vertical accent bar
     (green/yellow/blue = state, e.g. unread / muted / mention), two-line preview, a faint glyph watermark in a
     triangle at top-right. Selected card = solid yellow with black text and a chevron cut. White "Show All" filter
     pill at the bottom.
   - Nothing selected: a small dark plate "- Choose dialog -" centred over a dim diamond-grid glyph with "EMPTY"
     and thin connector lines, faint telemetry microtext at the panel's top-left.
   - Open chat: a header bar with a yellow notch at the left edge + the name, a yellow pattern block on the right
     (hatching, dot grid, glyph) with a thin tri-band underline; dark rounded bubbles, incoming left with round
     avatar, outgoing right with avatar on the right; reactions sit inside the bubble (emoji + name); the composer
     is one wide white pill at the bottom (in-game it's a reply choice).
   (Mario: these refs are examples - each surface's exact look gets specified as we go.)
