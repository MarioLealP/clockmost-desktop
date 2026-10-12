# Rule checklist (fill one table per concept: done / partly done / not done + why)

## 13-<name> (harness concept - parked, see README)
| rule | status | note |
|---|---|---|
| 1 fullscreen mosaic | | |
| 2 moving camera | | |
| 3 short fade-slide entrances | | |
| 4 slow fade small details | | |
| 5 grainy crystals | | |
| 6 small print | | |
| 7 centred tabs + orange diamonds | | |
| 8 reflective topo floor | | |
| 9 world print vs HUD | | |
| 10 deep layer stacks | | |
| 11 timer tags | | |
| 12 reward reveal | | |
| 13 app drawer | | |
| 14 location toast | | |
| 15 exits don't move | | |
| 16 per-app entrances | | |
| 17 Discord = in-game chat | | |
| 18 icon glyphs | | |
| 19 stacking tab states | | |
| 20 dotted edge gradients | | |
| 21 second tab style | | |
| 22 own design per component, 6-9 layers | | |
| 23 light-grey pages with dark sections | | |
| 24 Spotify = phonograph | | |

## components/toast.html + toast-cutout.html (rule 14, single-HTML)
| rule | status | note |
|---|---|---|
| 3 short fade-slide entrances | done | band wipes L->R 420ms SETTLE, content fade-slide 120-540ms |
| 4 slow fade small details | partly done | ruler/microtext ride the wipe; no separate slow layer yet |
| 6 small print | partly done | ruler 10-160 + microtext; no barcode on toast itself |
| 8 reflective topo floor (motif) | done | inlined seed-942 SVG contours, static, feathered right |
| 14 location toast | done | 3-line layout, topo, ruler, feathered wipe in, static fade out; needs Mario eyeball |
| 15 exits don't move | done | exit is opacity-only 280ms, no transform, no camera |
| 22 own design, 6-9 layers | partly done | band/topo/ticks/3 text lines/microtext = ~6; thin, could use more texture |
| everything else | not done | out of scope for a single component |

## components/drawer.html (rule 13, single-HTML)
| rule | status | note |
|---|---|---|
| 3 short fade-slide entrances | done | panel wipes L->R 480ms SETTLE, slots ride the wipe |
| 4 slow fade small details | done | capacity/filters/foot fade SOFT after the wipe |
| 6 small print | done | barcode, Capacity 13/40, slot names, sort/stash labels |
| 13 app drawer | done | solid light top -> frosted glass, dark foot; needs Mario eyeball |
| 15 exits don't move | done | exit is opacity-only 240ms, X + Esc + button |
| 18 icon glyphs | partly done | X has the 4-arm empty-centre cut; no split ring yet |
| 22 own design, 6-9 layers | done | header/filters/grid/foot/microtext/blur-source/topo = 7+ |
| everything else | not done | out of scope for a single component |

## ds-spotify-v2 (left album deck)
| rule | status | note |
|---|---|---|
| 1-2 | n/a | no fullscreen/camera in this component |
| 3 short fade-slide entrances | done | main layers 280ms SETTLE, 14-22px travel (verified mid-flight) |
| 4 slow fade small details | done | 600ms fade after 280ms+ delay (verified: details at 0 mid-flight) |
| 5 crystals | n/a | not in the phonograph ref |
| 6 small print | done | micro codes, barcodes, micro labels on card, plate foot, minis |
| 7-11 | n/a | tabs/notify/floor/world-print/timer belong to other surfaces |
| 12-14 | n/a | reward/drawer/toast are other components |
| 15 exits never move | done | leave() animates opacity only, in place |
| 16-17 | n/a | app entrances / Discord skin |
| 18 icon glyphs | n/a | no close/plus/ring in this column |
| 19 tab states glyph | partly | square-with-diagonal badge on minis is the rule-19 glyph |
| 20 dotted edge gradients | done | dotted gradient finishes the playlist panel bottom edge; dot-grid masks on the art |
| 21 | n/a | second tab style |
| 22 own design, 6-9 layers | done | card = 8 layers, ext plate/motif/foot are their own stack |
| 23 light pages | n/a | dark ground here |
| 24 Spotify = phonograph | done (left column) | bar + right list inherited from v1 unchanged |

## components/ds-chat.html (rule 17, chat & Discord skin)
| rule | status | note |
|---|---|---|
| 3 short fade-slide entrances | done | conversation rows slide-fade in with staggered SETTLE delay |
| 6 small print | done | service mark, telemetry, UID, channel telemetry, status plates |
| 7 centred tabs + orange diamonds | done | diagonal-hatch band, Q/E keycaps, active yellow block with topo drop, pulsing orange diamond |
| 10 deep layer stacks | done | backdrop, grid, frosted shell, cards, header watermark, pattern block, tri-band |
| 15 exits don't move | done | in-place opacity fades, no slide |
| 17 Discord = in-game chat | done | 2-column layout, conversation cards, selected yellow state, header notch + tri-band underline, reaction pills, dialog reply pill, toggleable empty state |
| 18 icon glyphs | done | round close-X with 4 thick square-cut arms and empty center gap |
| 22 own design, 6-9 layers | done | dedicated chat architecture, 8+ visual layers |
| everything else | n/a | component scope (not whole shell/camera) |

## ds-chat (step 1: shell + dialogs + empty state)
| rule | status | note |
|---|---|---|
| 3/4 entrances + slow details | done | rAF SETTLE tweens, staggered cards, late micro fade |
| 7 centred tabs + orange diamond | done | hatched band, yellow active tab, pulsing notify diamond (rAF) |
| 15 exits don't move | done | selection swap fades in place |
| 17 Discord = in-game chat | partly | column + empty state done; open chat (bubbles/composer) = step 2 |
| 22 own recipe, layers | partly | cards = bg/hatch/accent/av/text/watermark; stage furniture own stack |
