# Open items in the recipe

- **ShareX keybinds** (Mario 2026-10-09: "i wont live like that"): Spectacle global shortcuts ->
  `Ctrl+Print` = rectangular region capture into the annotation editor (all screenshot actions on
  Ctrl+Print), `Ctrl+Shift+Print` = start/stop region recording as GIF (or WebP). Replace the
  Plasma defaults (Meta+Shift+S / Meta+Shift+Print / Meta+Shift+R) in kglobalshortcutsrc;
  Spectacle: launch = new screenshot, mode = rectangular region, recording format = GIF.
- **Klipper needs a home** (found 2026-10-09): in Plasma 6 Klipper only exists inside the
  `org.kde.plasma.clipboard` widget (no standalone binary). Removing Plasma's panel (to make room
  for an anime shell) removes the system tray -> no Klipper, no Meta+V after the next shell start.
  Current fix: the clipboard widget sits on the desktop containment
  (`desktops()[0].addWidget("org.kde.plasma.clipboard")`), **placed off-screen** (containment
  `ItemGeometries*=Applet-N:-4000,-4000,32,32,0;`, applet `UserBackgroundHints=NoBackground`): at its
  default 464x464 it shows the full history permanently (Mario: "the clipboard history hasn't
  closed"), and any visible icon is unacceptable (Mario: "i'm not gonna spend hours weebfying and
  having to live with that"). Klipper still loads off-screen. Fallback if Plasma ever clamps it:
  a hidden panel holding only the system tray. The bootstrap must do this; the
  design track must keep it (hidden/invisible is fine).
- Klipper settings (`~/.config/klipperrc` [General]): MaxClipItems=50, KeepClipboardContents=true,
  IgnoreSelection=true, SyncClipboards=false, IgnoreImages=false, PreventEmptyClipboard=true.
