# 11 · Endfield (layered) - brief (Claude build, 2026-10-09)

Mario: "everything is beautifully layed in endfield, stuff slides on top of each other etc. we need those
pristine beautiful endfield animations". Source of truth for tokens: E:\Felt\felt-dashboard\src\styles\endfield.css
(v1.1). Brand rules: memory clockmost-endfield-design-language (tri-band = yellow -> thin cyan -> thin magenta,
yellow ~75%, ONCE per view; yellow is structural - frames, rails, active state - rarely fills or text).

## Tokens (inline these; no external fonts)
ground #0F0F10 · surface #17181A · surface-2 #1E2024 · well #0A0A0B · steel line #33363C · line-2 #4A4E56 ·
ink #F0F0F2 / #A8ABB2 / #6C6F76 / #44474D · yellow #FFFA00 (hot #FDFD1F) · cyan #00FFA2 · magenta #FF1AAC ·
notify orange #FF7A1A. Radius 0; chamfer top-right + bottom-left (cut 10px / 16px large). Rail 3px. Brackets TL+BR,
14px, 2px, yellow 55%. Fonts (Windows-available stand-ins): display = Bahnschrift (condensed/semibold, wide
tracking for labels), body = Segoe UI / system-ui, data = Consolas. Easing: SNAP cubic-bezier(1,0,0.7,1),
SETTLE cubic-bezier(0.16,1,0.3,1). Durations 120 / 280 / 600 ms. Glow: 0 0 .55rem rgba(255,250,0,.4).

## The core idea: LAYERS
Every element is a stack of plates that travel on STAGGERED timings, so during motion you see layers slide over
one another and shear apart; at rest they lock into one clean, aligned stack. Exits run the layers in reverse
(last in, first out), faster than entries.
Window stack (back to front): steel back-plate (offset ~8px down-right, translucent steel) -> surface (chamfered)
-> title band (yellow 3px leading rail on its left edge when focused, diamond marker, title in Bahnschrift caps,
micro telemetry on the right: e.g. "WIN-02 · 1280×1080 · ▸▸▸") -> content.

## Choreography
- OPEN (~600 ms total): a thin yellow rail draws across the target's top edge (120 ms, SNAP) -> the back-plate
  slides in from the left (~80 px, 280 ms, SETTLE) -> 60 ms later the surface slides over it with a clip-path wipe
  from the left (280 ms, SETTLE) -> title band wipes in, diamond fills, title text wipes -> content fades/wipes
  in with a few px of rise -> TL/BR brackets snap onto the corners (from 1.25x, SNAP). The layers are visibly
  offset mid-motion and click into alignment at the end.
- CLOSE (~320 ms, SNAP-heavy): content cuts out -> title band retracts left -> surface wipes off to the right ->
  back-plate lingers ~60 ms then collapses into the yellow rail -> rail shrinks to a diamond -> gone.
- SNAP / RATIO CHANGE: plates move with ~40 ms stagger (back-plate leads, content trails) so the stack shears
  while sliding and re-locks on arrival; along the top edge a yellow measuring rail slides to the new boundary with
  a Consolas readout ("1 : 2", "2 : 1", "1 : 1") and a chevron run ››› pointing the direction of travel; it wipes
  away after settling.
- FOCUS (~200-280 ms): the yellow rail slides down the focused window's left edge (top -> bottom, SNAP), its
  diamond fills with glow, brackets snap on; the previous window's rail retracts upward, diamond goes hollow,
  title dims to ink-3. Quiet - no flashing.
- SEAM: a steel hairline gap with a vertical data-strip (barcode texture) and tick marks; when the split changes, a
  short yellow segment runs along it and the ratio readout appears mid-seam, then fades. Calm at rest.
- HUD (H / top edge, ~600 ms in, ~300 ms out): layered panels slide in from the RIGHT edge with stagger, each over the
  previous: (1) full-height dark translucent plate with fading dot-matrix, (2) the clock card - huge Bahnschrift
  digits with the glitch-echo motif + date strip; the tri-band rail on top of this card is the view's ONE triband
  moment, (3) tray row with diamond markers, (4) notification cards stacking in one by one (orange notify square,
  source in mono, text), (5) a search field with a chevron prompt. Dismiss = reverse order, panels retract right,
  SNAP, fast. Optional: the whole HUD layer gives the screen a slight dim + 1-2 px shift of the windows (depth).
- WALLPAPER: ground #0F0F10, faint dot-matrix fading off the edges, a few microtext telemetry blocks and thin
  steel guide lines; still. (Not pure black.)
- APP TOUCHES: Firefox tabs chamfered, active tab with yellow underline rail + filled diamond; Discord channel rows
  with hollow/filled diamonds; kitty prompt line with a yellow rail.
