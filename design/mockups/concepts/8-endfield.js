// 8 · Endfield Protocol (industrial): windows are prefab modules on a deployment deck.
// They crane-drop open with a shockwave, decommission into a lockdown hoist, relocate with
// guide chevrons, and meet at a striped safety barrier; H opens the control console.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 28;
  const NS = "http://www.w3.org/2000/svg";
  let ctx = null;
  let ov = null;
  let fx = null;
  let hudGen = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eIn = (t) => t * t * t;
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eOutBack = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rnd = (i, s) => {
    const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // rAF in a real browser; headless virtual time starves rAF, so tick on timers there.
  const tick = /Headless/.test(navigator.userAgent) ? (f) => setTimeout(f, 16) : (f) => requestAnimationFrame(f);
  function tween(ms, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = () => {
        const t = clamp((performance.now() - t0) / ms);
        fn(t);
        if (t < 1) tick(step);
        else res();
      };
      tick(step);
    });
  }
  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function D(cls, parent) {
    const e = document.createElement("div");
    e.className = cls;
    parent.appendChild(e);
    return e;
  }
  function fade(el, ms, delay = 0) {
    const o0 = parseFloat(getComputedStyle(el).opacity);
    const base = Number.isFinite(o0) ? o0 : 1;
    setTimeout(() => tween(ms, (t) => (el.style.opacity = base * (1 - eOut(t)))).then(() => el.remove()), delay);
  }
  // chevron triangle pointing +1 (right) or -1 (left), centred on (x, y)
  function chevD(x, y, s, dir) {
    if (dir >= 0) return `M${x - s / 2} ${y - s} L${x + s / 2} ${y} L${x - s / 2} ${y + s} L${x - s / 6} ${y} Z`;
    return `M${x + s / 2} ${y - s} L${x - s / 2} ${y} L${x + s / 2} ${y + s} L${x + s / 6} ${y} Z`;
  }

  function buildOverlay(screen) {
    if (ov) return;
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "ef-ov", viewBox: `0 0 ${SW} ${SH}` });
    ov.innerHTML = `<defs>
      <pattern id="ef-hatch" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="20" height="20" fill="#14161c"/><rect width="10" height="20" fill="#ffb000"/>
      </pattern>
      <linearGradient id="ef-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity=".9"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="ef-blast" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#ffb000" stop-opacity=".55"/>
        <stop offset="1" stop-color="#ffb000" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
    fx = document.createElement("div");
    fx.className = "ef-fx";
    screen.insertBefore(ov, hud);
    screen.insertBefore(fx, hud);
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    wallEl.innerHTML = `<svg class="ef-wall" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">` +
      `<text class="ef-giant" x="${SW - 60}" y="${SH - 120}">08</text>` +
      `<g class="ef-gantry"><line x1="0" y1="64" x2="${SW}" y2="64"/><line x1="0" y1="78" x2="${SW}" y2="78"/>` +
      [240, 720, 1200, 1680].map((x) =>
        `<rect x="${x - 8}" y="40" width="16" height="62"/><circle cx="${x - 8}" cy="109" r="3"/><circle cx="${x + 8}" cy="109" r="3"/>`).join("") +
      `</g>` +
      `<circle class="ef-beacon" cx="240" cy="132" r="9"/><circle class="ef-beacon b2" cx="1680" cy="132" r="9"/>` +
      `<rect class="ef-hazbar" x="0" y="${SH - 44}" width="${SW}" height="26"/>` +
      `<line class="ef-amberline" x1="0" y1="${SH - 52}" x2="${SW}" y2="${SH - 52}"/>` +
      `</svg><div class="ef-scan"></div>` +
      `<div class="ef-walltag">ENDFIELD // DEPLOYMENT SECTOR 08</div>`;
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach(ensureTag);
  }
  function ensureTag(win) {
    let t = win.el.querySelector(".ef-tag");
    if (!t) {
      t = document.createElement("span");
      t.className = "ef-tag";
      win.el.querySelector(".titlebar").appendChild(t);
    }
    if (win.rect) t.textContent = `▸ ${Math.round(win.rect.w)}×${win.rect.h}`;
    return t;
  }

  // ---- OPEN: module drop — crane-slammed prefab, shockwave ring, chevron frame, sparks ----
  async function onOpen(win) {
    ensureTag(win);
    const el = win.el;
    const r = { ...win.rect };
    el.classList.add("ef-dropping");
    el.style.opacity = "0";
    const g = S("g", { class: "ef-open" }, ov);
    const blast = S("ellipse", { cx: r.x + r.w / 2, cy: r.y + r.h - 10, rx: r.w * 0.42, ry: 30, fill: "url(#ef-blast)" }, g);
    const frame = S("rect", { x: r.x - 7, y: r.y - 7, width: r.w + 14, height: r.h + 14, fill: "none", stroke: "url(#ef-hatch)", "stroke-width": 9 }, g);
    const ring = S("rect", { fill: "none", class: "ef-ring" }, g);
    const rivets = [[r.x + 14, r.y + 14], [r.x + r.w - 14, r.y + 14], [r.x + 14, r.y + r.h - 14], [r.x + r.w - 14, r.y + r.h - 14]]
      .map(([x, y]) => S("circle", { cx: x, cy: y, r: 5, class: "ef-rivet" }, g));
    const sheen = S("rect", { fill: "url(#ef-sheen)" }, g);
    const sparks = [];
    for (let i = 0; i < 8; i++) {
      sparks.push({
        e: S("circle", { r: (2 + rnd(i, 301) * 2.5).toFixed(1), fill: i % 3 ? "#ffb000" : "#fff3d0" }, g),
        x0: r.x + rnd(i, 303) * r.w,
        y0: r.y + r.h - 4,
        vx: (rnd(i, 305) - 0.5) * 420,
        vy: -(120 + rnd(i, 307) * 320),
      });
    }
    await tween(620, (t) => {
      const drop = eOutBack(seg(t, 0, 0.5));
      const y = lerp(-150, 0, clamp(drop, -0.2, 1));
      el.style.opacity = String(seg(t, 0, 0.08));
      el.style.transform = `translateY(${y.toFixed(1)}px)`;
      const hit = seg(t, 0.44, 0.52);
      blast.style.opacity = String(0.9 * hit * (1 - seg(t, 0.52, 0.85)));
      frame.style.opacity = String(seg(t, 0.44, 0.5) * (1 - seg(t, 0.62, 0.85)));
      const rk = eOut(seg(t, 0.5, 0.8));
      ring.setAttribute("x", r.x - 7 - rk * 60);
      ring.setAttribute("y", r.y - 7 - rk * 60);
      ring.setAttribute("width", r.w + 14 + rk * 120);
      ring.setAttribute("height", r.h + 14 + rk * 120);
      ring.style.opacity = String(0.8 * (1 - rk));
      rivets.forEach((rv, i) => {
        const p = eOutBack(seg(t, 0.48 + i * 0.05, 0.8));
        rv.setAttribute("r", (5 * clamp(p, 0, 1.3)).toFixed(1));
        rv.style.opacity = String(seg(t, 0.48 + i * 0.05, 0.56));
      });
      const sp = seg(t, 0.5, 0.92);
      const sx = lerp(r.x - 120, r.x + r.w + 120, sp);
      sheen.setAttribute("x", sx - 60);
      sheen.setAttribute("y", r.y);
      sheen.setAttribute("width", 120);
      sheen.setAttribute("height", r.h);
      sheen.style.opacity = String(0.5 * Math.sin(Math.PI * sp));
      sparks.forEach((s) => {
        const p = seg(t, 0.46, 1);
        s.e.setAttribute("cx", (s.x0 + s.vx * p).toFixed(1));
        s.e.setAttribute("cy", (s.y0 + s.vy * p + 340 * p * p).toFixed(1));
        s.e.style.opacity = String(0.95 * (1 - p));
      });
      g.style.opacity = String(1 - seg(t, 0.9, 1));
    });
    el.style.opacity = el.style.transform = "";
    el.classList.remove("ef-dropping");
    g.remove();
  }

  // ---- CLOSE: decommission — lockdown strobe, hazard shutters, crane hoist out ----
  async function onClose(win) {
    const el = win.el;
    const r = { ...win.rect };
    const g = S("g", { class: "ef-close" }, ov);
    const strobe = S("rect", { x: r.x, y: r.y, width: r.w, height: r.h, class: "ef-lock" }, g);
    const shutT = S("rect", { x: r.x, y: r.y, width: r.w, height: 0, fill: "url(#ef-hatch)" }, g);
    const shutB = S("rect", { x: r.x, y: r.y + r.h, width: r.w, height: 0, fill: "url(#ef-hatch)" }, g);
    const cabA = S("line", { class: "ef-cable" }, g);
    const cabB = S("line", { class: "ef-cable" }, g);
    const ax = r.x + 60, bx = r.x + r.w - 60;
    await tween(600, (t) => {
      const bl = t < 0.35 ? (((t * 9) % 1 < 0.55) ? 0.5 : 0.04) : 0;
      strobe.style.opacity = String(bl);
      const sh = eInOut(seg(t, 0.35, 0.68));
      const hh = (r.h / 2) * sh;
      shutT.setAttribute("height", hh.toFixed(1));
      shutB.setAttribute("y", (r.y + r.h - hh).toFixed(1));
      shutB.setAttribute("height", hh.toFixed(1));
      const shOp = seg(t, 0.35, 0.42) * (1 - seg(t, 0.85, 1));
      shutT.style.opacity = String(shOp);
      shutB.style.opacity = String(shOp);
      const ho = eIn(seg(t, 0.55, 1));
      const lift = ho * (r.y + r.h + 120);
      el.style.transform = `translateY(${(-lift).toFixed(1)}px)`;
      el.style.opacity = String(1 - seg(t, 0.55, 1));
      const cop = seg(t, 0.55, 0.64) * (1 - seg(t, 0.9, 1));
      [[cabA, ax], [cabB, bx]].forEach(([ln, lx]) => {
        ln.setAttribute("x1", lx);
        ln.setAttribute("y1", 0);
        ln.setAttribute("x2", lx);
        ln.setAttribute("y2", Math.max(0, r.y - lift));
        ln.style.opacity = String(cop);
      });
    });
    el.style.visibility = "hidden";
    el.style.opacity = el.style.transform = "";
    fade(g, 400, 100);
  }

  // ---- SNAP: relocate — guide chevrons lead the glide, ghost trails, stencil readout ----
  async function onMove(win, from, to, place) {
    place(win, to);
    ensureTag(win);
    const el = win.el;
    const tag = el.querySelector(".ef-tag");
    const two = ctx && ctx.state.list.length === 2;
    const isLeft = two && to.x === 0;
    const seamEl = ctx && ctx.seam;
    const g = S("g", { class: "ef-snap" }, ov);
    const dir = Math.sign(to.x + to.w / 2 - (from.x + from.w / 2)) || 1;
    const ghost = S("rect", { x: from.x, y: from.y, width: from.w, height: from.h, class: "ef-ghost" }, g);
    const cy = to.y - 40;
    const ccx = to.x + to.w / 2;
    const chevs = [-1, 0, 1].map((k) => S("path", { d: chevD(ccx + k * 40 * dir, cy, 22, dir), class: "ef-chev" }, g));
    const lab = S("g", { class: "ef-wlab" }, g);
    const lr = S("rect", { height: 26 }, lab);
    const lt = S("text", {}, lab);
    let last = "";
    const run = tween(500, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e);
      const w = lerp(from.w, to.w, e);
      el.style.left = `${x.toFixed(1)}px`;
      el.style.width = `${w.toFixed(1)}px`;
      tag.textContent = `▸ ${Math.round(w)}×${to.h}`;
      ghost.style.opacity = String(0.35 * (1 - e));
      chevs.forEach((c, i) => {
        const ph = (t * 2 - i * 0.18 + (dir < 0 ? 0.36 : 0)) % 1;
        c.style.opacity = String((0.25 + 0.75 * (ph < 0 ? ph + 1 : ph)) * seg(t, 0, 0.25) * (1 - seg(t, 0.72, 1)));
      });
      const txt = `${Math.round(w)} PX`;
      if (txt !== last) {
        lt.textContent = txt;
        lr.setAttribute("width", txt.length * 9 + 26);
        last = txt;
      }
      const lw = txt.length * 9 + 26;
      const mx = x + w / 2;
      const my = to.y + to.h / 2;
      lr.setAttribute("x", (mx - lw / 2).toFixed(1));
      lr.setAttribute("y", my - 13);
      lt.setAttribute("x", mx.toFixed(1));
      lt.setAttribute("y", (my + 1).toFixed(1));
      lab.style.opacity = String(seg(t, 0.12, 0.28) * (1 - seg(t, 0.72, 1)));
      if (seamEl && isLeft) seamEl.style.left = `${x + w}px`;
    }).then(() => {
      place(win, to);
      ensureTag(win);
      fade(g, 450, 180);
    });
    // when a neighbour is about to drop, hand over early so the slam overlaps the glide
    const opening = ctx && ctx.state.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    if (opening) await Promise.race([run, ctx.sleep(300)]);
    else await run;
  }

  // ---- FOCUS: target lock — chamfered brackets snap on, scanline sweeps ----
  function onFocus(win) {
    if (!ov || !win.rect) return;
    const r = { ...win.rect };
    const B = 34, O = 10, C = 12;
    const g = S("g", { class: "ef-focus" }, ov);
    const x = r.x, y = r.y, x2 = r.x + r.w, y2 = r.y + r.h;
    S("path", {
      d: `M${x + O + B} ${y + O} L${x + O + C} ${y + O} L${x + O} ${y + O + C} L${x + O} ${y + O + B} ` +
        `M${x2 - O - B} ${y + O} L${x2 - O - C} ${y + O} L${x2 - O} ${y + O + C} L${x2 - O} ${y + O + B} ` +
        `M${x2 - O} ${y2 - O - B} L${x2 - O} ${y2 - O - C} L${x2 - O - C} ${y2 - O} L${x2 - O - B} ${y2 - O} ` +
        `M${x + O + B} ${y2 - O} L${x + O + C} ${y2 - O} L${x + O} ${y2 - O - C} L${x + O} ${y2 - O - B}`,
    }, g);
    const scan = S("rect", { x, width: r.w, height: 3, class: "ef-scanline" }, g);
    tween(320, (t) => {
      const e = eOut(t);
      g.style.opacity = String(Math.sin(Math.PI * clamp(t * 1.1)));
      scan.setAttribute("y", lerp(y, y2 - 3, e).toFixed(1));
      g.setAttribute("transform", `translate(0 ${(1 - eOut(seg(t, 0, 0.4))) * -6})`);
    }).then(() => g.remove());
  }

  // ---- SEAM: safety barrier — striped post, base plate, strobing beacon, stencil tag ----
  function seamHook(s) {
    const el = s.seam;
    if (!el.querySelector(".ef-barrier")) {
      el.innerHTML = `<svg class="ef-barrier" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">` +
        `<rect class="ef-base" x="2" y="${SH - 60}" width="${GAP - 4}" height="52"/>` +
        `<rect class="ef-post" x="${GAP / 2 - 6}" y="70" width="12" height="${SH - 140}"/>` +
        `<rect class="ef-stripes" x="${GAP / 2 - 6}" y="70" width="12" height="${SH - 140}"/>` +
        `<rect class="ef-cap" x="${GAP / 2 - 9}" y="58" width="18" height="12"/>` +
        `<circle class="ef-beacon" cx="${GAP / 2}" cy="44" r="8"/></svg>` +
        `<div class="ef-seam-lab"><span>1:1</span></div>`;
    }
    Object.assign(el.style, { display: "block", width: `${GAP}px`, transition: "opacity .3s" });
    if (!s.visible) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    el.classList.toggle("ef-hot", !!s.changing);
    const r = ctx ? ctx.state.ratio : [1, 1];
    el.querySelector(".ef-seam-lab span").textContent = `${r[0]}:${r[1]}`;
  }

  // ---- HUD: the control console ----
  function hudConsole(data) {
    const leds = ["g", "g", "a", "g", "r"];
    const sys = data.tray.slice(0, 5).map((t, i) =>
      `<div class="srow" style="--d:${320 + i * 60}ms"><span class="led ${leds[i % leds.length]}"></span>` +
      `<span class="snm">${esc(t).toUpperCase()}</span>` +
      `<span class="meter"><i style="width:${(30 + rnd(i, 401) * 65).toFixed(0)}%"></i></span></div>`).join("");
    const sevs = [["INFO", "info"], ["WARN", "warn"], ["ALRT", "alrt"]];
    const log = data.notes.slice(0, 3).map((n, i) => {
      const at = n.indexOf(":");
      const b = at > 0 ? n.slice(at + 1).trim() : n;
      const [txt, cls] = sevs[i % sevs.length];
      return `<div class="srow log" style="--d:${460 + i * 60}ms"><span class="sev ${cls}">${txt}</span>` +
        `<span class="snm">${esc(b).toUpperCase()}</span></div>`;
    }).join("");
    return `<svg class="ef-alert" viewBox="0 0 ${SW} ${SH}">` +
      [[14, 14, 1, 1], [SW - 14, 14, -1, 1], [SW - 14, SH - 14, -1, -1], [14, SH - 14, 1, -1]].map(([x, y, sx, sy]) =>
        `<path d="M${x + 70 * sx} ${y} L${x} ${y} L${x} ${y + 70 * sy}"/>`).join("") +
      `</svg><div class="ef-console"><div class="ef-haztop"></div>` +
      `<div class="cgrid"><div class="cleft"><div class="clock">${esc(data.time)}</div>` +
      `<div class="cdate">${esc(data.date).toUpperCase()}</div>` +
      `<div class="cstatus"><span class="led g"></span>SECTOR 08 // ALL SYSTEMS NOMINAL</div></div>` +
      `<div class="cmid"><div class="chead">SYSTEMS — TRAY</div>${sys}</div>` +
      `<div class="cright"><div class="chead">ALERT LOG</div>${log}</div></div></div>`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    hudEl.innerHTML = `<div class="ef-hud">${hudConsole(data)}</div>`;
    const root = hudEl.firstElementChild;
    root.getBoundingClientRect();
    tick(() => { if (gen === hudGen) root.classList.add("in"); });
    await new Promise((r) => setTimeout(r, 660));
  }
  async function hudHide(hudEl) {
    ++hudGen;
    const root = hudEl.querySelector(".ef-hud");
    if (!root) {
      hudEl.innerHTML = "";
      return;
    }
    root.classList.add("out");
    await new Promise((r) => setTimeout(r, 300));
    hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
