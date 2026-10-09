# Open items in the recipe

- **ShareX keybinds** (Mario 2026-10-09: "i wont live like that"): Spectacle global shortcuts ->
  `Ctrl+Print` = rectangular region capture into the annotation editor (all screenshot actions on
  Ctrl+Print), `Ctrl+Shift+Print` = start/stop region recording as GIF (or WebP). Replace the
  Plasma defaults (Meta+Shift+S / Meta+Shift+Print / Meta+Shift+R) in kglobalshortcutsrc;
  Spectacle: launch = new screenshot, mode = rectangular region, recording format = GIF.
- **Klipper needs a home** (found 2026-10-09): in Plasma 6 Klipper only exists inside the
  `org.kde.plasma.clipboard` widget (no standalone binary). Removing Plasma's panel (room for an
  anime shell) removes the system tray -> no Klipper, no Meta+V after the next shell start.
  Desktop-layer widget = visible (default 464x464 shows the full history; off-screen positions get
  clamped back into view - Mario: "gone isnt 1 of them"). **Working fix: a stub panel** - left
  edge, centered, length 32, thickness 32, hiding=autohide, holding only the clipboard widget
  (plasma script: `var p = new Panel; p.location="left"; p.height=32; p.alignment="center";
  p.minimumLength=32; p.maximumLength=32; p.hiding="autohide"; p.addWidget("org.kde.plasma.clipboard")`).
  Invisible unless the mouse hits that spot; Klipper loads. Verified by screenshot. The bootstrap
  must create it; the design track must keep Klipper loaded somewhere.
- Klipper settings (`~/.config/klipperrc` [General]): MaxClipItems=50, KeepClipboardContents=true,
  IgnoreSelection=true, SyncClipboards=false, IgnoreImages=false, PreventEmptyClipboard=true.
