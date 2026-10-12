# Order 12 report - OSDs + power menu

## What I built
`components/ds-osd.html` - one static layout page on `.stage` with a dimmed `.win.blur` behind (a Firefox
window open to a real PipeWire wiki page, darkened to read as backdrop). States via `?state=`, default `osd`:

- `osd`: three `.frost` OSD plates (320x64) side by side at y ~ 900, bottom-centre, each with a faint `.micro`
  caption above (`VOLUME KEY` / `MIC KEY` / `MEDIA KEY`).
  1. VOLUME: speaker line icon, `.label` `OUTPUT · DT 880`, 20-segment level bar (13 lit `--ink`, 14th (last lit)
     yellow, 6 unlit), `70` in mono 18px.
  2. MIC MUTED: crossed mic icon in crimson, `.label` `MIC · USB PNP`, crimson `.tag` `MUTED`.
  3. MEDIA: lavender 40px art square (faint dot texture), `Glassy Sky`, `.micro` `SAPPHIRE · 01:12 / 04:20`,
     thin progress line at ~28%.
- `power`: full-screen dim `rgba(8,8,9,.7)`; centred composition: big mono `20:41`, `.micro`
  `CLOCKMOST · UP 3D 04H` + faint barcode, then a dark `.panel` plate with TL/BR brackets holding 5 square
  160px option plates (48px line icon + `.label` + `.kbd` letter): LOCK (L), SLEEP (S), LOG OUT (O), RESTART (R),
  SHUT DOWN (P) - SHUT DOWN has the yellow frame and yellow icon. Below the plate: `.micro` `ESC CANCEL`.

Linked `ds-shell.css` only, all page CSS in the page's `<style>`. No motion of any kind.

## Screenshots (looked at all of them)
- `out/shots/12-ref-spotify.png`, `out/shots/12-ref-drawer.png`, `out/shots/12-ref-drawer-open.png` - the approved
  references, used to match the house look.
- `out/shots/12-osd-1.png`, `out/shots/12-power-1.png` - round 1.
- `out/shots/12-osd-2.png`, `out/shots/12-power-2.png` - round 2 (final), after filling the backdrop page so its
  lower half is not a dead empty area.

Checked in the shots: no page errors from `kit/shot.sh`, no overlapping or clipped text, nothing off screen, the
segment bar counts (14 lit, last yellow), yellow only on the volume peak and the SHUT DOWN frame/icon, tri-band
unused (fine - at most once per screen), small print present (labels, micro lines, one barcode).

## What I am unsure about
- The order did not say where the style-required small print barcode goes on the power menu; I put it next to the
  `CLOCKMOST · UP 3D 04H` line. Easy to move or drop.
- The backdrop window (Firefox on a PipeWire wiki page) is my choice - the order only said "one dimmed
  `.win.blur` behind". It is dimmed to brightness .52.
- The media progress line is ink on a faint track (house `.sld` recipe); it could instead use the lavender accent.

## Ideas
- A fourth OSD state example for brightness / keyboard backlight would fit the same plate recipe if Mario wants it.
- The power menu could get a confirm step ("SHUT DOWN - press P again") as a separate `?state=` later.
