# Order 13 report - SDDM lock / login screen (layout mock)

## What I built
`components/ds-lock.html` (new file). `.stage` (default Endfield ground, no windows), links `ds-shell.css`,
page CSS only in its own `<style>`. Static layout, no motion; `?state=login` swaps the state block via
`URLSearchParams` (default `lock`).

- **`lock`**: left third - big clock `20:41` (mono 120px, weight 300, letter-spacing .06em, `--ink`), `.label`
  date `MONDAY · 12 OCTOBER 2026`, the screen's ONE `.triband`, then the `.micro` status block
  (`CLOCKMOST.COM · TANG OK · VAULT OK` / `NOW PLAYING · GLASSY SKY`).
  Centre-right (420px) user plate: `.panel` + `.bk.tl/.bk.br` brackets, 72px square avatar tile `BE`,
  `benylin` (body 22px) with `.micro` `LOCKED 20:39 · 2 MIN`, password `.field` with yellow `›››` prompt +
  6 typed dots, row with `.kbd` `↵` + `.micro` `UNLOCK` and crimson `.tag` `CAPS LOCK` (state demo) at its
  right end, hairline, then small print (`.barcode` + `.micro` `LK-2039 · GREETER · TTY2`).
- **`login`**: same backdrop; clock block moves to top-centre at 64px with date + tri-band under it. Centre:
  two `.panel` user cards (280px) - `benylin` selected with a 2px yellow frame, `guest` dimmed to .55 -
  password `.field` (`›››` + `PASSWORD`) under the selected card, session chip row centred below
  (`.chip.on` `PLASMA (WAYLAND)`, `.chip` `PLASMA (X11)`), small print (`SDDM · GREETER 0.21 · SEAT0`).
- **Screen chrome (both states)**: bottom-left `.micro` `CACHYOS · PLASMA 6.8` (with the house `.mock-note`
  state line stacked under it), bottom-right three 28px `.wb` buttons: `US` (keyboard layout), network
  (wifi line glyph), power (line glyph).

## Screenshots
- `out/shots/13-1.png`, `out/shots/13-1-login.png` (round 1)
- `out/shots/13-2.png`, `out/shots/13-2-login.png` (round 2, final, both states)
- References taken for comparison: `out/shots/13-ref-spotify.png`, `out/shots/13-ref-drawer.png`,
  `out/shots/13-ref-drawer-open.png`

Checked with `kit/shot.sh` two rounds (limit 3 respected). No page errors. Looked at every screenshot against
the two approved pieces. Fixed in round 2: the selected login card was olive-tinted because my class name `sel`
collided with the house `.sel` (solid yellow background) - renamed to `.picked`; the `↵` glyph in the keycap
was too small (bumped to 13px inside the 22px `.kbd`).

## What I checked / didn't check
Checked: both states visually at 1920x1080 - no overlapping or clipped text, nothing off screen, no empty
broken areas, order's layout list item by item, one tri-band per screen, yellow only for selection/prompt.
Didn't check (and it's out of scope for a static mock): typing, unlocking, switching users or sessions,
the CAPS LOCK tag actually reacting to a key.

## Unsure about
- **Login drops the `.micro` status block** (`CLOCKMOST.COM ...` / `NOW PLAYING ...`): the order only says the
  big clock moves to top-centre, so I moved clock + date + tri-band and left the lock-glance status lines off
  the login screen. Easy to move them under the date if you want them there.
- **Bottom chrome in both states**: the order lists `CACHYOS · PLASMA 6.8` and the US/network/power buttons
  under `lock` only; I kept them on `login` too since they're greeter furniture (power to shut down). Say the
  word and I'll strip them from `login`.
- **Login password field is empty** (`›››` + `PASSWORD` placeholder); only the lock field shows the 6 typed
  dots the order specifies.
- **Session chip row placement**: centred under the picker (the order doesn't pin it); it's wider than one
  card so it can't sit inside the selected card's column.
- **Tri-band position**: between the date and the status lines (i.e. under the clock block), reading the
  order's "may sit under the clock" as the clock block.

## Ideas (not built)
- A key/token hint on the plate ("PRESS TANG KEY") - `TANG OK` in the status block suggests one exists.
- A second `?state=` with the CAPS LOCK tag hidden, to show the tag is a state demo and not furniture.
- Fingerprint icon button next to the password field on machines with a reader.
