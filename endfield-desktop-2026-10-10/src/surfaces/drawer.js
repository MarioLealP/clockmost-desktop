// EF drawer — rule 13 (app launcher / backpack). Requires core.js + atoms/app-card.js.
//   EF.drawer({ title, apps, cols, capacity, running, filters }) -> el
//   el.open() / el.close() / el.toggle()   el.cards = EF.appGrid result
// Motion (rule 13): panel wipes L->R via clip-path, everything inside rides it,
// the secondary layer (capacity, filters, foot) fades in after.
// Exit (rule 15): static fade in place, nothing moves.
(() => {
  "use strict";
  const EF = (window.EF = window.EF || {});
  if (typeof EF.appGrid !== "function") throw new Error("drawer needs atoms/app-card.js");

  // rule 18 · glyph family (kept local until the icon atom lands)
  const I = (p) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="square">${p}</svg>`;
  const ICON_X = I(`<path d="M13 13 L27 27 M37 37 L51 51 M51 13 L37 27 M27 37 L13 51"/>`);
  const ICON_GRID = I(`<path d="M12 12 H28 V28 H12 Z M36 12 H52 V28 H36 Z M12 36 H28 V52 H12 Z M36 36 H52 V52 H36 Z"/>`);
  const ICON_FILTER = I(`<path d="M12 14 H52 L37 33 V50 L27 45 V33 Z"/>`);
  const ICON_GEAR = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="6"><circle cx="32" cy="32" r="9"/><path d="M32 9 V16 M32 48 V55 M9 32 H16 M48 32 H55 M15 15 L20 20 M44 44 L49 49 M49 15 L44 20 M20 44 L15 49"/></svg>`;

  function drawer(opts = {}) {
    const o = {
      title: opts.title ?? "Applications",
      apps: opts.apps || [],
      cols: opts.cols ?? 10,
      capacity: opts.capacity ?? "",
      running: opts.running ?? 0,
      filters: opts.filters || ["All", "Net", "Media", "Sys", "Doc", "Dev"],
    };

    const el = EF.D("ef-drawer");
    const panel = EF.D("panel", el);
    const plate = EF.D("plate", panel);

    /* header — solid light bar */
    const head = EF.D("head", plate);
    EF.D("tile", head, ICON_GRID);
    EF.D("ti", head, EF.esc(o.title));
    EF.D("bc", head);
    const cap = EF.D("cap", head, EF.esc(o.capacity));
    const ex = EF.D("ex", head, ICON_X);
    ex.title = "Close";

    /* filter row */
    const filters = EF.D("filters", plate);
    o.filters.forEach((f, i) => {
      if (i) filters.appendChild(document.createElement("i"));
      const s = document.createElement("span");
      s.textContent = f;
      if (i === 0) s.className = "on";
      filters.appendChild(s);
    });

    /* slot grid (mock: clips, not scrollable yet — the thumb is decorative) */
    const gridWrap = EF.D("grid", plate);
    const cards = EF.appGrid(o.apps, { cols: o.cols });
    gridWrap.appendChild(cards.grid);
    EF.D("thumb", gridWrap);

    /* foot — separate darker bar */
    const foot = EF.D("foot", plate);
    EF.D("search", foot, `<b>›››</b> SEARCH`);
    EF.D("run", foot, EF.esc(`${o.running} RUNNING`));
    EF.D("mini", foot, ICON_FILTER);
    EF.D("mini", foot, ICON_GEAR);

    /* glass sheen */
    EF.D("sheen", plate);

    const second = [cap, filters, foot];
    let opened = false;
    panel.style.setProperty("--w", "0%"); // starts wiped out

    function open() {
      opened = true;
      const alive = EF.claim(el, "_t");
      el.style.opacity = "1";
      return EF.tween(780, (e) => {
        panel.style.setProperty("--w", (EF.P(e, 0, 470, EF.SETTLE) * 100).toFixed(2) + "%");
        panel.style.opacity = String(EF.lerp(0.3, 1, EF.P(e, 0, 260)));
        second.forEach((s, i) => { s.style.opacity = String(EF.P(e, 460 + i * 45, 260, EF.SOFT)); });
      }, alive).then((done) => {
        if (!done) return false;
        panel.style.setProperty("--w", "100%");
        panel.style.opacity = "";
        second.forEach((s) => { s.style.opacity = ""; });
        return true;
      });
    }

    function close() {
      opened = false;
      const alive = EF.claim(el, "_t");
      return EF.tween(240, (e) => { el.style.opacity = String(1 - EF.P(e, 0, 240, EF.SNAP)); }, alive).then((done) => {
        if (done) {
          panel.style.setProperty("--w", "0%");
          el.style.opacity = "";
        }
        return done;
      });
    }

    el.open = open;
    el.close = close;
    el.toggle = () => (opened ? close() : open());
    el.panel = panel;
    el.cards = cards;
    ex.addEventListener("click", close);

    return el;
  }

  EF.drawer = drawer;
  EF.drawer.ICON_X = ICON_X;
})();
