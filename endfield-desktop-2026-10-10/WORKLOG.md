# Work log (append only, newest at the bottom)

## 2026-10-10 - Claude (handoff)
- Folder assembled from the clockmost-desktop repo: brief rules 1-23, refs, kit, concepts 3/11/12.
- Concept 12 = newest, built before rules 12-23; no verdict from Mario yet.
- Next: concept 13 from a copy of 12, one rule-group per step (see README "Next job").

## 2026-10-10 - Muse Spark (KISS pivot, rule 24, topo, toast)
- Paused 13-endfield-core harness work (files sit unbuilt in concepts/); pivoted to single standalone
  HTML per component in components/, no build step, per Mario.
- Added brief rule 24: Spotify = in-game phonograph (refs/phonograph-full.jpg,
  refs/phonograph-visualizer-detail.png). Queued as first per-app pass, after core components.
- Built components/topo.html: canonical topoSVG() generator (SVG contours, marching squares over seeded
  value noise). Saved 3 motifs: topo-toast-band.svg (880x170, s942), topo-card-block.svg (640x180, s361),
  topo-floor-strip.svg (1340x200, s848).
- Built components/toast.html (rule 14): band wipes L->R feathered, content fade-slides, exit static
  fade. Replaced canvas wave-strings with inlined seed-942 SVG; added right feather mask (52%->97%).
  JS syntax-checked with node --check; NOT looked at in a browser.
- How checked: node --check on extracted scripts, grep for markers. No visual check possible here.
- FIX: the topo inline surgery regex over-matched and deleted the ruler ticks, presets and enter/exit
  fns (page loaded broken; syntax check had passed). Restored verbatim, verified every id/fn resolves.
- Toast halved to 440x88 for 1920x1080 (type 20/13/7, ruler/slide/feather scaled with it).
- Ruler flipped (ticks rise, no bottom line), then saved both topo treatments: toast.html (highlight
  lines) + toast-cutout.html (lines punched transparent via canvas destination-out).

## 2026-10-11 - Muse Spark (drawer)
- Built components/drawer.html (rule 13): solid light header (tile + title + barcode + Capacity +
  rule-18 X), filter row (dark All pill, thin separators), 12-slot grid (glyph, numeral, rarity
  underbar), dark foot (sort pill, Quick Stash, 2 minis). Frosted glass over a fake desktop context
  (seed-1201 topo floor + dim windows). Wipe L->R with slots riding it, secondary fades after,
  exit static fade. JS id-checked + node --check; NOT looked at in a browser.
- Drawer v2 (de-gamed, glass fix): body/foot more translucent, blur 22px + saturate, sheen + inset
  highlight, warmer blur source (glows, lit windows). Capacity->"12 APPS · 3 RUNNING", Quick Stash
  +sort pill -> search pill + running indicator + view/settings minis.
- Drawer v3: square slots (10 cols, ~136px), 12 apps + 8 dotted empties.
- app-card.html gained ?embed=1 mode (bare card, transparent page, name/code/color/logo/state
  params); drawer slots are now iframes importing it directly — hand-mirrored copy deleted.
- Built components/app-card.html: 136px card, 9 layers (base/topo/dots/hatch/glyph/name/
  version/numeral/rail/underbar), rest/running/selected states. JS id-checked + node --check.
- Card now uses the real Firefox 2019 logo (Wikimedia, inlined with prefixed gradient ids;
  asset also saved as components/firefox.svg).
- All four component pages now use wallpaper.png (1920x1080, Mario's real desktop) as the backdrop
  instead of the fake gradient/windows context.

## 2026-10-11 - Plan: src/ workplace (atomic parts -> fake desktop)
- Mario: raw HTML makes reuse hard; want a proper workplace. Keep it simple — no React/Vue.
- Layout: `src/` plain files attaching to an `EF` namespace, loaded in order from `desktop.html`
  via script tags (works from file://, no build step). Atomic parts first, then surfaces, then compose.
- This step (T1): `src/core.js` (tween engine SNAP/SETTLE/SOFT, noise, contours, canvas, rng)
  + `src/tokens.css` (Endfield variables: colours, chamfers, hatch, barcode, fonts).
  Lifted from concepts/12-endfield-space — no behaviour change, just a shared base.
- Check: node --check on core.js; open desktop.html (once it exists) or a tiny core test page.
- Later steps (each its own entry): atoms (icons/small-print/timer/diamond/brackets) -> patterns
  (topo/crystals/layer-stack) -> surfaces (toast/drawer/app-card/window) -> desktop compose.
- Existing `components/*.html` stay untouched; new code lives under `src/`.

## 2026-10-11 - T1 shared core done
- Built `src/core.js` (EF namespace: SNAP/SETTLE/SOFT tweens, claim/tween, noise2, contours,
  canvas, grainTexture, topoTexture) and `src/tokens.css` (Endfield variables + chamfers/hatch/barcode).
- Built `desktop.html` smoke shell (1920x1080) that loads both and runs one live tween.
- Checked: `node --check src/core.js` OK; headless Edge screenshot of `desktop.html` shows
  CORE OK / SNAP/SETTLE/SOFT / noise+contours / tokens Y=#fffa00 / tween OK on the barcode boot line.
- Next (T2): atoms — rule 18 icons, small-print, timer-tag, notify-diamond, brackets.

## Ideas

## 2026-10-11 - Pi (app-card polish + colour gallery)
- Mario: "get the app-card finished, final goal is the app launcher / drawer... look at it alone with the
  default background so we can have multiple colors on the background, then have it as part of the drawer".
- Reworked `src/atoms/app-card.html` from the busy `wallpaper.png` backdrop to the **default Endfield
  ground**: `#0a0a0b` + one-time contour canvas (EF.contours) + soft vignette + framing rules. Now it is a
  gallery: 9 category colours, 9 live apps, 5 states, a 2x detail card, and the layer legend.
- `src/atoms/app-card.css` fixes/polish:
  - BUG: full-bleed layers (wash/motif/dots) were not clipped to the chamfer -> category tint leaked into the
    cut corners. All full-bleed layers now share the TR/BL chamfer clip.
  - wash 20% over 58% (muddied the plate) -> 15% rim over 34%; colour now lives mainly in the underbar.
  - topo 0.28 -> 0.24, masked off the icon centre (was hairball-busy at 2x).
  - base gained a diagonal sheen + inner bottom shadow; icon 64 -> 72px; numeral 22 -> 26px.
  - added a real hover state (brighter plate + white ring + white brackets); selected keeps yellow and now
    overrides hover; selected outer glow moved to `.ef-card { filter: drop-shadow }` so it follows the chamfer
    (the old outer `box-shadow` on `.l-base` was being clipped away).
  - empty slot: plain dark tile + faint dot grid (rule 20).
- Checked: headless Edge 1920x1080 screenshots -> `out/shots/appcard-gallery-01/02.png` (before/after).
  Location is the only open question: page is at `src/atoms/app-card.html`, card API is `EF.appCard()`.
- NEXT: fold this card into the half-built drawer; decide hover/press motion for the slot (drawer context).

## 2026-10-11 - Pi (drawer remade in src/ + app-card folded in)
- Mario: "you can fold into the drawer, tho that has to be remade since it's currently sitting in the old
  system where it was just an html". Old `components/drawer.html` = standalone page, its own copy of the
  tween engine, iframes to `components/app-card.html`.
- New surface: `src/surfaces/drawer.js` (`EF.drawer({title,apps,cols,capacity,running,filters})` -> el with
  `.open()/.close()/.toggle()`, `el.cards`), `src/surfaces/drawer.css`, preview `src/surfaces/drawer.html`.
  Built on `core.js` + `tokens.css` + `atoms/app-card.css/js`; **no iframes** — the grid is `EF.appGrid()`.
- Added the missing `.ef-grid` rule to `atoms/app-card.css` (appGrid referenced it but it was never styled).
- Structure: `.panel` (wipe clip) > `.plate` (TR/BL chamfer + material gradient + blur/saturate) > head /
  filters / grid / foot, + sheen. Motion = rule 13 (panel reveals by clip-path, slots ride it because they
  are inside it, secondary = cap/filters/foot fades at 460ms+); exit = rule 15 static fade.
- DESIGN CHANGE (flag): panel is now **content-height** (hugs its rows) instead of the old full-height
  1568x968, which sat ~60% empty. Also chamfered the plate (TR/BL). Preview sits on the default ground with
  a dim world behind the glass (windows + a huge "02" world number) so the frosting reads.
- DEBUG: page appended `d.el` but `EF.drawer()` returns the element itself -> TypeError, blank drawer.
  Fixed. Captured a mid-wipe frame to prove the wipe rides (drawer-wipe-mid.png).
- Checked: node --check on drawer.js/app-card.js; headless Edge still + mid-motion -> out/shots/
  drawer-new-02.png, drawer-wipe-mid.png.
- NEXT (decision): keep content-height 2-row launcher, or grow it (more real apps / empty inventory slots)?

## 2026-10-11 - Pi (drawer: 6 rows, scroll mocked)
- Mario: "we display lets say 5-6 rows of apps, then scroll search etc, but for now we mocking the design,
  not actual functionality".
- Panel is now near-full-height (`inset: 20px 176px 48px`) with `.plate { height: 100% }`; `.grid` is
  `flex:1; min-height:0; overflow:hidden` so it shows ~5 rows and CLIPS the 6th (implies scroll, not wired).
- Added a decorative `.thumb` (mock scrollbar) inside the grid. Drawer mock apps grew to 56 (6 rows' worth);
  capacity reads "56 APPS · 6 RUNNING". Head/filters/foot padding trimmed to fit the rows.
- Preview: control bar is now a thin 44px strip so it no longer covers the drawer foot; the rule note moved
  to the top-left. Checked headless Edge -> out/shots/drawer-6rows-final.png.
- OPEN: the shared card shows a big white "0" on every app with no windows open — noisy at 56 tiles. Proposal:
  hide the numeral when it is 0 (keep underbar + micro code); only apps with open windows show a number.

## 2026-10-10 - Test: ds-app-card (fresh file, not a copy)
- Built components/ds-app-card.html: standalone 136px card, own design (not a copy of components/app-card.html).
  9 layers (topo arcs, dots, hatch, brackets, split-ring mark + monogram, name, micro code, diamond, underbar).
  Chamfer TR/BL via clip-path on one plate, so every layer is clipped to the cut.
  States: rest / running / selected. Entrance: fast layers slide 8px home (280ms), detail layers fade in after 240ms (600ms). Replay button.
- Checked: JS syntax via node --check on the extracted script. NOT looked at in a browser (no headless browser run yet).
- Simplified ds-app-card.html to a plain card per Mario: Firefox logo (components/firefox.svg), name, code, underbar. Chamfer TR/BL kept. No layers/motion/states. Not looked at in a browser.

## 2026-10-11 - Spotify skin (rule 24), step 1: now-playing bar
- Mario: rebuild the Spotify app fully (Spicetify-style restyle is the other model's job). We design in HTML first.
- Plan for step 1: `components/ds-spotify.html` = the bottom now-playing bar only (rule 24, bottom paragraph).
  Faint visualizer as the bar's top edge (no progress bar), black timer tag, title/subtitle, "Current Room Vinyl" pill,
  microtext. Visualizer is simulated (no audio access). Later steps: album column, track list, page chrome.
- Check: node --check on extracted script; headless Edge screenshot (mid-motion + settled). Not yet looked at.

## 2026-10-11 - Spotify skin v1 (phonograph, rule 24) - marked v1
- Mario signed off the look. Frozen copy: `components/ds-spotify-v1.html` (copy of `ds-spotify-bg-f2d.html`).
- Contents: top search bar with PHONOGRAPH MKV-I title; left column (previous, current cover with a light purple
  plate running right, title/artist/divider/lyric lines, up next, small up next); right column (playlist strip on top,
  sort-by pill, 8-row track list with selected-row state); bottom bar (timer on the seam, lyric line, transport,
  volume, devices icon); background = dot grid masked out inside ten topo rings from the left, A+B mix with the
  glow blobs.
- Known placeholders: track names/artists/lengths and lyric lines are copied or invented; playlist strip names
  are placeholders; sort and dates are mock only; visualizer is simulated (no audio access).
- Frosted glass not used anywhere in the background. Other background variants kept as separate files.
- Checked: headless Edge 1920x1080 screenshots, looked at each. Not yet checked in a live browser session.
- Next: the real build (Spotify via Spicetify / big-brain model), fairy-light glow later (see ideas).

## 2026-10-11 - Pi (spotify v2: left album deck)
- Mario: "pick up from spotify, it's not finished... make a copy of the html to work on... the left side needs
  some work, so surprise me". Working copy = `components/ds-spotify-v2.html` (v1 stays frozen). Right track list
  + bottom bar untouched.
- Rebuild the left column as the ref's album deck (rules 24 + 22): prev/up-next mini covers (chamfered, corner
  badge glyph, micro code), featured album = light-purple chamfered card with its own layers (topo art, dot grid,
  drifting RGB prism beam, grain, yellow NEW tag, compass mark, barcode + micro print) and the right extension
  plate (title, artist, dark COLLECTED plate, hairline, lyric lines) over a faint giant play-triangle motif +
  dot grid, tri-band + barcode at the plate foot (once per view), pagination rail dots at the far left.
- Motion (rules 3/4/15): rAF tweens with SNAP/SETTLE curves. Entrance = all layers appear at once near final,
  fade-slide 16-24px home; small print fades in 600ms after. Click a mini (or arrow keys) swaps the featured
  album: old fades out in PLACE (no move), new content cuts in and text fade-slides home. Ambient: slow beam
  drift + motif breathe. `?slow=N` kept.
- Check: `node --check` on the script; headless Edge 1920x1080 screenshots (settled + `?slow=10` mid-motion) to
  out/shots/, look at each. Lyrics/artists on non-current albums are placeholders.

## 2026-10-11 - Chat / Discord mockup (rule 17, in-game messaging app)
- Mario: references to a chat app in refs/ (`chat-empty-choose-dialog.png`, `chat-conversation.png`); design mockup in HTML/CSS in components/.
- Plan: `components/ds-chat.html` standalone mockup.
  - Covers Rule 17 (in-game messaging skin for Discord), Rule 7 (centered tab strip, Q/E shortcuts, orange notify diamonds), Rule 18 (Endfield round close X with open centre), Rule 10 & 22 (layer stack, tri-band underline on header pattern block, topo / hatch textures).
  - Top chrome: breadcrumb `// BAKER / TASKS` (toggle `// DISCORD / CLOCKMOST`), diagonal-hatch tab band, Q/E navigation, active yellow tab, round X close.
  - Left column: conversation cards (dark steel, square avatars, vertical status rails, watermark corner emblems, solid yellow selected card with chevron), white "Show All" filter pill.
  - Right panel: header with yellow notch, stencil watermark, yellow pattern block with tri-band underline; conversation history with incoming dark bubbles & outgoing light bubbles, reaction pill, white dialog reply pill / composer; toggleable "- Choose dialog -" empty state with diamond grid & telemetry. Bottom telemetry: `43ms UID: 6349456094`.
- Check: `node --check` on script; headless Edge 1920x1080 screenshots (conversation + empty state) into `out/shots/chat-*.png`.

## 2026-10-11 - Pi (spotify v2: left album deck - built + checked)
- Built in `components/ds-spotify-v2.html` as planned (v1 untouched): the left column is now the ref's album
  deck. Featured album = 400px chamfered purple card (8 layers: gradient base, topo art hue-per-album, dot
  grid mask, drifting RGB prism beam, grain, yellow NEW tag, compass mark, barcode + micro code) + fading
  extension plate (title, artist, dark COLLECTED|NN plate, hairline, lyric lines with yellow marker bar) over
  the play-triangle motif + dot grid, foot row = tri-band (the one tri-band of the view) + barcode + micro.
  Minis = chamfered cover + purple underbar + text stack + micro code + square-diagonal badge (rule 19 glyph).
  Pagination rail dots at the far left. Right list + bottom bar untouched from v1.
- Motion (rAF + SNAP/SETTLE bez tweens): entrance = main layers appear near final and fade-slide home (280ms),
  small print fades in 600ms after (rules 3/4); click a mini or arrow keys swaps the featured album - old
  content fades out IN PLACE (rule 15), art cuts, text fade-slides home, details re-fade. ?slow=N kept, ?feat=N
  starts on another album (test hook). Albums/lyrics/collected counts are placeholders.
- HOW CHECKED (important - two tooling findings):
  1. One-shot headless Edge (`--screenshot`/`--dump-dom` + `--virtual-time-budget`) does NOT tick requestAnimationFrame
     (with or without `--run-all-compositor-stages-before-draw`): every tween freezes after one frame at ~0.
     The README's "rAF works under --virtual-time-budget" claim is wrong on this Edge build - the older shots
     like drawer-wipe-mid.png that were assumed mid-motion may actually be frozen frame-1 states. Fix = drive
     Edge over CDP (script at `C:\Users\lealm\AppData\Local\Temp\shot.mjs`, run with node.exe, Edge on
     `--remote-debugging-port=9222`): rAF ticks normally, real-time waits give settled/mid frames.
  2. The pi image-display tool in my session showed the wrong picture for every file I read (always a strip of
     refs/phonograph-full.jpg - proven with a solid-red test image). I could NOT visually eyeball anything.
- Verified programmatically instead (all in out/shots/, script outputs above): DOM dump (node --check + Edge
  --dump-dom) shows render() correct for ?feat=2 and the queue wrapping (prev/next indices + titles); pixel
  assertions on cdp-settled.png: NEW tag 897 yellow px, tri-band 220/220/220, compass 547 ink px, barcode+micro
  505 px, title text at y316-350. cdp-entmid/cdp-swapmid (slow=10 mid-flight): main layers present, small print
  at 0 -> the delayed-details layering works. cdp-swapdone: swapTo(2) lands identical content to ?feat=2
  (title rows 317-342, diff vs settled 212 in the title area = the title actually changed).
- NOT checked: the actual look (no human or working image viewer has seen it), 60fps feel, hover states, live
  click feel. Mario needs to open `components/ds-spotify-v2.html` in a browser and react before any polishing.

## 2026-10-11 - Pi (v2 left deck: Mario's first reactions - strip the game cosplay)
- Mario: "solid progress" but "you basically just copy pasted the game... this is not the game, but an actual
  functional app". STANDING NOTE: the Endfield language is the skin; the content must read as Mario's functional
  app, not a 1:1 game UI lift. Game-only props don't belong.
- This step (removals only, in v2): remove the two pagination dots left of the playing card, the pink/white/blue
  prism beam on the cover, the compass mark, the NEW tag, the COLLECTED|NN plate; center the play-triangle motif
  (with its dot grid) in the extension plate.
- Check: node --check; CDP screenshot + pixel/geometry asserts (no yellow tag / beam hues / compass ink; tri
  bbox centred on the ext plate).

## 2026-10-11 - Pi (v2 left deck: removals done)
- Removed from v2: pagination dots, prism beam (CSS + ambient JS), compass mark, NEW tag, COLLECTED plate
  (markup, CSS, render()/tween lists, `coll` data). Play-triangle motif + dot grid now centred in the ext plate
  (tri bbox 706,474 = ext centre, exact). Card keeps base/topo/dots/grain/barcode/micro; ext keeps title/artist/
  rule/lyrics + centred motif + tri-band foot.
- Checked: grep clean of the removed hooks; node --check both scripts OK; CDP settled shot out/shots/
  cdp-v2c-settled.png - pixel asserts: yellow tag 0, beam cyan/magenta 0 (were hundreds), card purple intact,
  title text intact. DOM eval: beam/compass/newTag/cplate/rail all absent.
- Awaiting Mario's look at v2 before the next step.

## 2026-10-11 - Pi (v2: the gradient includes the picture)
- Mario: "the gradient was supposed to include the actual picture, instead of starting only after it".
- Change: one shared purple slab behind the WHOLE feature block (artwork + text), fading left->right across
  both. Card becomes a lighter translucent veil + topo art on that slab (its chamfer cuts show the slab
  through), the ext-only wash goes away, dead 26px rail indent removed.
- Check: CDP shot + pixel asserts - brightness fades smoothly across the old seam (no step at the card edge),
  wash spans the art, gone by the right edge.

## 2026-10-11 - Pi (v2: gradient slab done)
- Done as planned: `.feat::before` one slab (light lavender at the art's left edge -> transparent at the feature's
  right edge), card bg -> translucent white veil so the slab flows through the picture, `.fext::before` removed,
  dead rail indent gone. Card chamfer cuts now reveal the slab behind, like the ref.
- Checked: CDP shot out/shots/cdp-v2e-settled.png; brightness profile y=476 runs smoothly across the old seam
  (400->430: 171->152, no step; art veil adds a faint lift like the ref's art square), wash covers the art
  (left edge 204,196,226), ground reached by x=920, title text intact (1387 white px).
- Awaiting Mario's look.

## 2026-10-11 - Pi (v2: art floats over a bigger slab)
- Mario: "make it [the slab] a bit bigger than the art, so the art looks like it's laying over it, maybe give the
  art some shadow that casts over the gradient highlight".
- Change: art slot 372x372 inside the 400px slab (slab overhangs top/bottom 14px, left 18px), and the art gets
  a chamfer-following drop shadow (filter: drop-shadow on the wrapper - the trick from the app-card fix, since
  box-shadow gets eaten by clip-path) falling right/down onto the bright part of the gradient.
- Check: CDP shot - slab visible as strips around the art, shadow pixels darker than slab baseline near the
  art's right/bottom edges, no step in the gradient behind.

## 2026-10-11 - Pi (v2: art floats over the slab, done)
- Art slot 372x372 in the 400px slab (14px top/bottom, 18px left overhang), art plate back to OPAQUE light
  lavender (topo/dots/grain/barcode on top), drop-shadow wrapper as planned.
- GOTCHA (twice-bitten): `filter: drop-shadow()` paints the element's ALPHA SILHOUETTE - the translucent-veil
  art had almost no silhouette, so the shadow was invisible while computed style showed the filter fine. Fix =
  give the floating object an opaque background. Pair with the older gotcha: box-shadow is eaten by clip-path,
  so shadow goes on a wrapper via filter. (Also: a mid-entrance probe at 1.5s showed the tween still at ~26% -
  headless rAF timestamps lag wall clock; use 3s waits for settled shots.)
- Checked: CDP cdp-v2h-settled.png - art 225 brighter than slab 175; contact shadow from the art edge 77-81
  recovering to slab brightness over 14-30px on bottom, right and the chamfer; gradient tail fades past the
  shadow; title intact. Awaiting Mario's look.

## 2026-10-11 - Pi (v2: rounded corners)
- Mario: "round the corners a bit". Art card = 14px radius (chamfer clip dropped), slab = 18px radius.
  drop-shadow now follows the radius automatically. Minis/covers still chamfered - ask if those should follow.
- Check: CDP + corner pixel probes (corner cut shows slab/shadow through).

## 2026-10-11 - Pi (v2: rounded corners done)
- Done: .fcard border-radius 14px (clip-path removed), .feat::before border-radius 18px.
- Checked: computed style 14px/18px; corner probes show slab/ground through the cuts (TL 50,291 = 180 slab vs
  225 art interior; slab TL corner 34 = ground), shadow hugs the radius (92 at the edge vs 213 art), title
  intact. out/shots/cdp-v2i-settled.png.

## 2026-10-11 - Pi (v2: art chamfers back, slab stays rounded)
- Mario: "keep the art as it was, just the highlight rounded". .fcard clip-path chamfers restored, slab keeps
  border-radius 18px. Minis keep chamfers (he didn't ask to change them).
- Checked (cdp-v2j-settled.png): computed clip=polygon / radius 0 on art; art TL corner square (231), TR/BL
  chamfer cuts show slab+shadow (151/147), slab TL rounded to ground (34), shadow hugs the chamfer, title OK.

## 2026-10-11 - Pi (v2: highlight alpha 80%)
- Mario: "change the alpha to like 80%" - applied to the gradient highlight slab (.feat::before opacity .8;
  stated explicitly in case he meant the art plate instead). Checked: slab 182 -> 164, art unchanged, title OK.

## 2026-10-11 - Pi (v2: top chrome - separator + window controls)
- Mario: "add a separator under the search and title bar and next to the search on the top right add placeholder
  minimize maximize close buttons".
- Change: hairline rule under the whole top bar (28px insets), 3 placeholder window buttons at top right (30px,
  dark plate like the search field): minimize bar, maximize square, close = the rule-18 X (four arms, empty
  centre). No behaviour - placeholders. Hover = brighter plate.
- Check: CDP + DOM eval (3 buttons) + pixel probes (hairline row, glyphs, layout intact).

## 2026-10-11 - Pi (v2: top chrome done)
- Done: hairline under the top bar (.top::after, 28px insets, y=85 measured - a single bright row across the
  full width), 3 placeholder buttons top-right (.wctl at 1782,29 110x30; min bar / max square / rule-18 X with
  empty centre; hover brightens). Checked via DOM eval (3 buttons, topBottom 86) + pixel probes (glyph strokes
  present in each button, title 312 px, feature title 1274 px, layout intact). out/shots/cdp-v2l-settled.png.

## 2026-10-11 - Pi (v2: playlist gets its own panel)
- Mario: "make the dots not cover the playlist area, or somehow separate the playlist area, cuz it feels tacked
  on right now". The right-side page dots (html::before) run through the .list column.
- Change: .list = its own panel - rounded 18px dark plate (near-opaque, so the page dots are excluded), faint
  top-edge highlight, rule-20 dotted gradient finishing the bottom edge, 22/24/18px padding so the strip,
  sort pill and rows sit INSIDE the plate. Panel 660px wide at the same right margin.
- Check: CDP + pixel probes - no dot bumps between rows inside the panel, plate edge visible against the page,
  rows/strip/sort intact.

## 2026-10-11 - Pi (v2: playlist panel done)
- Done as planned (.list::before dark plate + top highlight + ::after dotted bottom edge, isolation/z-index so
  content paints above the plate). Panel = 1232..1892 x 105..965.
- Checked (cdp-v2m-settled.png, band probes after two column probes proved blind to the 1px/14px dot lattice):
  inside panel dot spread 6 (excluded) vs outside 16 (texture alive); left edge jump 15->20 at x1234; rows/strip/
  sort intact (3011 white px); dotted bottom band present.
- Note for next session: probe pixel lattices with BANDS not single columns - 1px dots at 14px pitch vanish
  between samples.

## 2026-10-11 - Pi (v2: spice up the playlist panel)
- Mario: "can we try to spice it up a bit?" (the panel). It's currently a flat dark box = the failure mode.
- Change (the panel's own recipe, functional not game props): corner brackets TL/BR, tick ruler fading down the
  left inner edge, row index numerals (01..08, yellow on the playing row), barcode + "RL-08 / 08 TRACKS / 32:27"
  micro block in the empty top-right corner of the panel. All in a .pmark furniture layer between plate and rows.
- Check: DOM (pmark + 8 numerals) + pixel bands (bracket, ruler ticks, barcode, yellow numeral) + rows intact.

## 2026-10-11 - Pi (v2: panel spice done)
- Done as planned: .pmark furniture layer (between plate and rows) = TL/BR corner brackets, fading tick ruler
  down the left edge, barcode + "RL-08 · 08 TRACKS · 32:27" micro readout top-right; rows gained index numerals
  (yellow on the playing row). Panel now its own recipe: plate + highlight + dotted edge + brackets + ruler +
  numerals + micro block.
- Checked (cdp-v2n-settled.png): DOM pmark + 8 numerals; pixel bands TL 78 / ruler 153 / barcode 149 / micro 97 /
  numerals 168 / yellow numeral 27 px / BR 74; rows text 2873 white px intact. CHECKLIST rule 20 -> done.

## 2026-10-11 - Pi (v2: panel - sharp corners, spacing, readout relocated)
- Mario: "round 2px instead of so round, since it has the brackets giving sharpness"; "need spacing all around,
  everything is clumped"; "the rl-08 etc looks great but that space will get covered by actual playlists
  (expect more than 4 covers)".
- Change: panel radius 18 -> 2px; spacing pass (padding 26/28/24, strip gap 18 + margin 26, sort margin 22,
  rows indent 44 with numeral at 10); covers 104 -> 88 to fund the spacing within the ~898px window height;
  strip gets overflow clip + right fade so future covers can't reach the corner; barcode + RL-08 readout moves
  to the bottom-left band (above the dotted edge, left of the BR bracket).
- Check: DOM rect height (~866 <= 898), corner pixel (radius ~2), readout bottom-left present, top-right corner
  empty, numerals + rows intact.

## 2026-10-11 - Pi (v2: panel sharp + spaced + readout moved)
- Done: radius 2px (corner pixel 35 = filled plate+highlight, sharp), spacing pass (panel 870 in the 898 band,
  14px margins; covers 88 + gap 18 + strip fade; rows indented 44), readout (barcode + RL-08 line) now bottom-left
  band above the dotted edge (max 130), top-right corner free for future playlist covers (strip clips + fades).
- Note: pixel probe of the "empty" top-right found the v1 page hatch (body::after, window corner) showing over the
  panel corner at max 60 - pre-existing texture, left as is. rows 2882 white px, numerals + yellow numeral OK.

## 2026-10-11 - Pi (v2: rebalance the panel sides)
- Mario: "left side of the thing is very crowded, but right side has a big empty space cuz of the notch on the
  bottom right... something to fill the side or remove the notch". Chose to fill:
  - tick ruler moves from the left inner edge to the right (ticks hang right) - declutters the left, gives the
    right side texture next to the BR bracket;
  - rows gain a visible "date added" column between title and length (from the existing data-added attributes,
    filled via JS so no duplication) - functional fill for the row's empty right half.
- Check: DOM (8 .rd), pixel bands - ruler now on the right, left strip clear, date column present, rows intact.

## 2026-10-11 - Pi (v2: panel rebalanced, done)
- Done as planned: ruler right-edge (ticks hang right), rows show date added (8 .rd cells filled from
  data-added via JS, e.g. "2026-10-09") between title and length (grid 1fr auto auto).
- Checked (cdp-v2p-settled.png): ruler max 152 on the right; left strip clear (max 23); date column + row text
  intact (2882 white px); BR bracket 65. node --check OK.

## 2026-10-11 - Pi (chat app step 1: shell + dialog column + empty state)
- Mario: "lets try the chat app / discord replacement next". Rule 17 + refs/chat-empty-choose-dialog.png and
  chat-conversation.png (image viewer works again - it was showing stale images earlier this session).
- STEP 1 = `components/ds-chat.html` (new file, self-contained): window chrome (breadcrumb "// DISCORD /
  CLOCKMOST", centred rule-7 tab strip with Q/E hints + pulsing orange notify diamond, our min/max/close window
  buttons, hairline), left dialog column (8 cards: accent state bar, avatar monogram, name + 2-line preview,
  watermark glyph in a corner triangle, selected = yellow + black + chevron cut, white "Show All" pill),
  right stage = the "- Choose dialog -" empty state (diamond marks + dot grid, connector lines, EMPTY label,
  corner telemetry microtext) over a faint topo backdrop. Motion: rule 3/4 entrances (rAF SNAP/SETTLE tweens),
  ambient notify-diamond pulse, click swaps selection (fade in place, no movement).
- STEP 2 (after Mario's look): open chat - header with yellow notch + pattern block + tri-band underline,
  bubbles with avatars/reactions, white reply-pill composer.
- Check: node --check; CDP screenshots settled + ?slow mid + selected state, LOOK at them (viewer recovered);
  pixel asserts as backup.

## 2026-10-11 - Pi (chat step 1 built + looked at)
- Built `components/ds-chat.html` as planned. LOOKED at both frames (viewer recovered):
  out/shots/chat-settled.png + chat-selected.png. Shell/column/empty state all read like the ref: breadcrumb +
  hatched tab band (yellow active tab + orange notify diamond) + our window controls; 8 dialog cards with state
  bars (green/blue/yellow/grey), monogram avatars, 2-line previews, corner watermark glyphs; white SHOW ALL pill;
  "- Choose dialog -" plate with wires + diamonds + dot grid + EMPTY; corner telemetry + bottom-left ping bar.
  Selected card = solid yellow + black text + chevron cut (verified visually) - selection fades in place (rule 15).
  Also fixed pre-render: enter() clobbers CSS transform - .tabs/.plate re-centred via margin auto instead of
  translateX(-50%).
- Honest nits I can see: the empty-state diamonds read as three triangles (an M) vs the ref's two offset
  diamonds; stage backdrop could carry a bit more presence. Not blocking - waiting for Mario's verdict before
  step 2 (open chat: header yellow notch + pattern block + tri-band underline, bubbles + avatars + reactions,
  white reply-pill composer).

## 2026-10-11 - Pi (chat redirect: standard Discord layout)
- Mario: "stick to a more standard discord layout" - the game's dialog-card column + choose-dialog stage is
  another game copy. Redirect: Discord's real skeleton, Endfield skin on top.
- `components/ds-chat-v2.html` (v1 kept for history): window chrome (title + our window controls + hairline),
  SERVER RAIL (tiles, active yellow + edge pill, mention badge), CHANNEL SIDEBAR (server header, categories,
  channel rows with # glyph / active pill / unread dot / orange mention diamond, user panel at the bottom with
  mic/headphones/gear), MAIN (channel header # felt-dev + topic + search, message list with day divider, NEW
  divider (crimson), reply reference, reaction chips, message groups), composer pill with + and emoji glyphs.
  Motion: rule 3/4 entrances staggered, selection fades in place, ?slow=N.
- Check: node --check; CDP settled + selected-channel shots; LOOK at them (viewer works).

## 2026-10-11 - Pi (chat v2: standard Discord layout done)
- Built as planned in `components/ds-chat-v2.html`. LOOKED at renders (out/shots/chat2-settled.png,
  chat2b-switched.png): server rail (CM active yellow + edge pill, FL mention badge, + tile), channel sidebar
  (categories, # rows, active yellow bar + pill, unread dots, orange mention badge, voice row, user panel with
  mic/headphone/gear), chat column (header # + topic + search, messages with avatars/names/times, day divider,
  crimson NEW divider, reply reference, reaction chips incl. mine state, composer pill). Verified: channel click
  updates active row + header + composer placeholder + user status ("in # music-share"), reaction chip toggles
  mine (2->3).
- Fixed while building: reply reference was a flex sibling of the avatar (pushed avatars right) -> moved into
  the message body; channel-name extraction reads the text node (badge digits were leaking in); reaction counter
  got its own .cnt element.
- TOOLING GOTCHA: an edit() call with one unmatched oldText is rejected AS A WHOLE - the 3 matched edits did
  not apply either, while a later call pointed JS at the not-added markup (null .cnt). If an edit call errors,
  re-check that NONE of its edits landed before continuing.

## 2026-10-11 - Pi (chat v2: Endfield skin pass done)
- Skinned the standard skeleton in place (LOOKED at out/shots/chat2skin.png + chat2skin2.png):
  - server rail: chamfered tiles, yellow active block + dot texture + ink edge pill, orange chamfered mention
    badge, dotted green "+" slot (rule 23 empty-slot fill), hatch texture on the rail;
  - sidebar: tracked CLOCKMOST wordmark + barcode + "SRV.002 - 12 CH" micro, category hairline rules, active
    channel = yellow chamfered block + dot texture + diagonal motif (rule 19 language) + dark mention plate,
    unread bars/dots kept (Discord semantics);
  - channel header: rule-17 yellow pattern block (hatch + dots + rule-18 X glyph) with THE tri-band underline
    (once per view) + SEARCH pill; crimson NEW timer-tag plate (rule 11 family); chamfered avatars + reaction
    chips; faint topo backdrop behind the messages; user status carries "42ms" small print.
- Fixed: the active rail tile lost its yellow when "on" moved to the wrapper (CSS still targeted .tile.on) -
  now .tw.on .tile. Renders verified visually end to end.

## 2026-10-11 - Pi (chat v2: rule-7 notify diamonds)
- Mario: "change the notification to the diamond with blinking outwards thing" (refs/notify-diamond-a/b).
- Done: notification badges are now the orange diamond with dark outline; the outline blinks OUTWARD as a
  concentric diamond (scale 1->2.15, opacity .8->0, 1.6s rAF loop). Rail FL tile = diamond at the corner;
  channel row = diamond + mention count in small print (kept for function; dark count on the yellow active row).
  Unread white dots kept as standard Discord.
- Checked: node --check OK; render (out/shots/chat2notif.png) shows the diamond + mid-blink expanded outline on
  the FL tile and the diamond + "3" on felt-dev - matches ref b's expanded state.

## 2026-10-11 - Pi (chat v2: notify diamond tweaks)
- Mario: top-right placement, no dark border, 2/3 size. Done: .notif 14 -> 9px, dark outline removed (plain
  orange diamond), ring kept (thin orange, blinking outward); rail badge bottom-right -> top-right, channel-row
  diamond + count pinned to the row's top-right corner. Checked in out/shots/chat2notif2.png.

## 2026-10-11 - (unlogged) chat v2
- `components/ds-chat-v2.html` appeared late 10-11 with no worklog entry (shots chat2*.png): a Discord-style
  layout (server rail, channel list with yellow active row + orange diamond, message list, composer). Logged
  here after the fact by Claude on 10-12.

## 2026-10-12 - Claude (cleanup)
- Mario pruned `components/` himself (bg variants, backups, copies, old drawer/app-card/toast-cutout, ds-chat v1).
- Snapshot commit `41db4a0` in the recipe repo before anything moved (shots + .mimocode git-ignored).
- Moved to `_hold-2026-10-12/`: components/ds-app-card + ds-app-drawer (replaced by src/), concepts 3/11/13 +
  their out/ pages, out/shots (49 stale PNGs, some were frozen frame-1 captures), .mimocode/, opencode.json.
- README: folder layout now explains src/ and the direction (everything into src/, compose in desktop.html);
  Next job rewritten (port phonograph -> chat -> toast, then compose).
- Working model from here: Claude writes bounded work orders, Pi (MiMo) does the long mechanical passes,
  Claude reviews diff + screenshots before anything is accepted.

## 2026-10-12 - Pi (order 01: phonograph port)
- Built: `src/apps/phonograph.css` (all page CSS scoped under `.ef-phonograph`), `src/apps/phonograph.js`
  (`EF.phonograph({ albums, tracks, feat })` -> el with enter/swapTo/leave/destroy), `src/apps/phonograph.html`
  (1920x1080 preview, reads ?feat=N, exposes window.ph). Nothing else touched; components/ds-spotify-v2.html
  untouched as reference.
- Checks: node --check OK; all shots clean (no page errors); pixel diff vs out/baseline (UV...python -I kit/imgdiff.py):
  settled 544 px (0.026%), mid slow=10 244 px (0.012%), feat=2 516 px (0.025%), swap2 341 px (0.016%) - all under
  0.05%. Residual diffs are only the live visualizer band (simulated noise, capture-time dependent) and mid-tween
  interpolation on the slow shot. Repeat run of settled diffs to 0 px (deterministic). Baseline sanity: re-shot
  components/ds-spotify-v2.html -> 0.000% vs its baseline (harness/baselines confirmed exact).
- Not mapped 1:1 (say-so list):
  1. Artwork/assets: `topo-floor-strip.svg` / `ds-topo-card.svg` referenced from `components/` by relative path
     (`../../components/...`) - copying them would have exceeded the file list. Values unchanged.
  2. `will-change: transform` added to the three bg layers (.bg-dot/.bg-rings/.bg-hatch). The page's fixed
     pseudo-layers were composited; `position: absolute` divs are not, and text rasterization flipped from the
     page's grayscale AA to LCD subpixel (and flaked run-to-run, ~350px). Restoring the composited layer context
     makes every text pixel identical to the baseline - it is the one added CSS value in the port.
  3. Canvas sizing: the factory runs before the root is mounted, so `size()` saw clientWidth 0 and the visualizer
     bitmap stayed 0x0. `frame()` now re-sizes when the bitmap doesn't match the CSS size. Same output once mounted.
  4. Motion: EF.SNAP / EF.SETTLE / EF.tween / EF.SLOW used via a thin `tween(dur, ease, step)` adapter (the page's
     signature); `wait(ms, fn)` kept local (setTimeout x S has no EF equivalent). Curves/timing identical.
  5. `el.leave()` is the page's own rule-15 leave() (120ms SNAP fade in place) applied to the root - the page had
     no whole-surface exit. No other new behaviour.
- Not done / notes: nothing outstanding in the order's scope. Known look issue (chevron motif overlapping lyrics)
  left as is per the stop rules. Probe/experiment screenshots kept in out/shots/01-*.png, diff images in
  out/shots/diff/.

## 2026-10-12 - Claude (review of order 01)
- Accepted. Pi/MiMo: 65 tool calls, $0.22, ~35 min. Stayed inside the file list (only probe shots in out/shots).
- Re-checked independently: node --check OK, no page errors, diffs settled 0.011% / feat2 0.016% /
  swap2 0.011% / mid 0.023% - the settled ones differ only in the live visualizer strip (y 950-977).
- Code review: scoped to the root, listeners removed in destroy(), keys only while connected. Good.
- Fixed one bug myself: artwork paths were page-relative (`../../components/...`), so mounting from any
  other folder broke them. SVGs copied to `src/assets/`; JS resolves ART against its own script URL, CSS uses
  `../assets/`. Verified by mounting from the folder root: 0.020%.

## 2026-10-12 - Claude (order 02: chat port - worker run + review)
- Worker: `claude-worker` (Claude Code, locked-down profile) on xiaomi/mimo-v2.6-pro via OpenRouter. $0.18.
  Port done in ~9 min (src/apps/chat.{css,js,html}); then ~35 min chasing a ~40 ms capture-timing offset in the
  slow-motion shot. Claude stopped it; it never wrote its own worklog entry.
- Accepted. Re-checked: node --check OK; settled / channel switch / reaction diff exactly 0.000%; mounted from the
  folder root 0.000% (asset path already right this time). Mid-motion 0.144% = elements a few px further along the
  same slide (timing), not a look difference. Listeners removed in destroy(), scoped to the root.
- Lesson (Claude's): pixel thresholds only for settled shots. Mid-motion shots are timing-sensitive - check them by
  eye or with a loose bar (~0.5%), never the strict one, or the worker burns time on milliseconds.

## 2026-10-12 - Claude (restore)
- components/ds-app-drawer.html + ds-app-card.html moved back out of _hold (Mario is using ds-app-drawer as the
  drawer - Claude had wrongly called it superseded by src/surfaces/drawer).

## 2026-10-12 - Claude (one drawer)
- Mario: components/ds-app-drawer.html is THE drawer. Retired src/surfaces/drawer.* + src/atoms/app-card.* (Pi's
  darker rebuild) to _hold-2026-10-12/src/. README updated. Mocks are layout-only from now on (no animation work).

## 2026-10-12 - Claude (layout pass: 11 mocks via claude-worker, 3 waves)
- Mario (before dinner): "write a comprehensive design for each, and spawn multiple mimos to build each part".
  Claude wrote components/ds-shell.css (house style distilled from phonograph + drawer + chat: frame, fields,
  pills, panels, glass, frost, small print; calm Endfield .stage = ground + glows + faint topo floor) and
  orders/STYLE.md (look rules, desktop geometry, worker rules), then one order per part (03-13).
- Waves of parallel claude-worker runs (MiMo): 1 = window, top bar, dock, Firefox; 2 = Kitty, Dolphin, Alt+Tab,
  notifications, Discord redo; 3 = OSD/power, lock. All stayed in scope; each wrote orders/NN-report.md.
- Reviewed every state by screenshot. Only fix needed: power-menu backdrop too light (text showed through) ->
  .88 + blur, done by Claude. Found: src/assets/topo-floor-strip.svg lacks xmlns (never rendered as an image);
  added src/assets/topo-floor.svg with it for the stage (phonograph left untouched).
- components/index.html = overview gallery. Total credit used for the 11 pages: ~$1.
