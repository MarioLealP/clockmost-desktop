# Order 11 report - Discord, redesigned (layout mock)

## What I built
`components/ds-discord.html` (new file; `ds-chat-v2.html` untouched). Fullscreen `.stage.plain` + `.win.max`,
links `ds-shell.css`, page CSS only in its own `<style>`. Static layout, no motion; `?state=empty` swaps the
right panel via `URLSearchParams`.

- **Top row**: `.wtitle` `// DISCORD / CLOCKMOST`; centred server tab strip on a diagonal hatch band - 52px
  square tabs `CM` (active: solid yellow + faint hatch) / `FL` (orange `.notif`) / `PK` / `DM`, tiny `.kbd` `Q`
  `E` at the strip's ends; window buttons right (close = rule 18 X).
- **Left card list (~400px)**: CHANNELS / VOICE / DIRECT `.label` dividers over 76px cards - 52px tile, colour
  rail (green active / white idle), name + ellipsised preview, faint big watermark glyph (# / speaker / person).
  Selected `# felt-dev` = solid yellow, dark text, chevron cut on its right edge. Voice card: 2 tiny avatars +
  `2 IN VOICE`. Bottom: light `SHOW ALL` pill with filter glyph, `.micro` `42ms · UID 6349456094`.
- **Conversation panel**: framed plate (1px light border, 2px corners). Header: yellow corner slashes, `felt-dev`
  + topic in `.micro`, yellow pattern block right (diagonal hatch + dot grid + grid glyph) with the screen's ONE
  tri-band under it and the house barcode at the edge. 9 messages (felt rig, desktop mockups, backup check):
  dark rounded incoming bubbles left with round avatars, light outgoing right; name in its colour + time above
  incoming groups; one reaction chip (`🔑 2`); one reply with a quote line above the bubble; one image message
  (320x180 drawn screenshot + micro caption); thin `NEW` divider with crimson `.tag` before the last 2 messages.
  Composer: wide light pill `Message #felt-dev` with attach (rotated rule-18 X) and emoji glyphs inside its ends.
- **`?state=empty`**: right panel becomes the ref's empty state - diamond lattice + two big faint diamond
  outlines, centred `- Choose a conversation -` with flanking hairlines, `EMPTY` micro.

## Screenshots
- `out/shots/11-1.png`, `out/shots/11-1-empty.png` (round 1)
- `out/shots/11-2.png`, `out/shots/11-2-empty.png` (round 2)
- `out/shots/11-3.png`, `out/shots/11-3-empty.png` (final, both states)
- References taken for comparison: `out/shots/11-ref-spotify.png`, `out/shots/11-ref-drawer.png`,
  `out/shots/11-ref-chat.png`

Checked with `kit/shot.sh` three rounds (limit respected). No page errors. Looked at every screenshot next to
`refs/chat-conversation.png` and `refs/chat-empty-choose-dialog.png`. Fixed along the way: messages clipping
behind the composer, the empty state leaving a ghost conversation frame beside it, header barcode overlapping
the pattern block, preview text colliding with the card watermark, slack at the bottom of the card list.

## What I checked / didn't check
Checked: both states visually at 1920x1080, no errors, order's layout list item by item. Didn't check (and it's
out of scope for a static mock): any interaction, the Q/E tab switching, scrolling the list or messages.

## Unsure about
- **Chevron cut direction**: the ref's selected card is small; I cut the right edge inward (arrowhead caved
  into the card). If the ref means a protruding tip, it's a one-line clip-path flip.
- **Bubble radius**: 12px, following the order ("rounded bubbles ... like the ref"); STYLE's corner list only
  has 2px / 6px / pills.
- **`?state=empty` deselects the card list too** (order only mandates the right panel): the ref's empty screen
  shows no yellow card, and "Choose a conversation" with a selected card read wrong. Easy to revert.
- The header barcode at the far right renders a bit taller in the screenshots than the 11px house `.barcode`;
  it reads like the ref's white barcode block, but I couldn't zoom in to verify the exact height.

## Ideas (not built)
- Member list strip on the right edge of the panel (real Discord has one; the ref has no equivalent).
- Typing indicator line above the composer.
- Voice-card selected state with participant rows (would need a third `?state=`).
