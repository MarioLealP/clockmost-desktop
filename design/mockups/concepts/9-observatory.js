// 9 · Observatory (night sky): windows are long exposures. They constellate open as
// border stars connect with hairlines, collapse shut into black holes, re-triangulate on
// snap with a sextant arc, and meet at a telescope reticle; H opens the ephemeris panel.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 26;
  const NS = "http://www.w3.org/2000/svg";
  let ctx = null;
  let ov = null;
  let hudGen = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eIn = (t) => t * t * t;
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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
  function fade(el, ms, delay = 0) {
    const o0 = parseFloat(getComputedStyle(el).opacity);
    const base = Number.isFinite(o0) ? o0 : 1;
    setTimeout(() => tween(ms, (t) => (el.style.opacity = base * (1 - eOut(t)))).then(() => el.remove()), delay);
  }
  // n points evenly spaced around the border of r
  function periPoints(r, n) {
    const edges = [
      [r.x, r.y, r.x + r.w, r.y],
      [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
      [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
      [r.x, r.y + r.h, r.x, r.y],
    ];
    const lens = edges.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      let d = (i / n) * total;
      for (let e = 0; e < 4; e++) {
        if (d <= lens[e] || e === 3) {
          const f = clamp(d / (lens[e] || 1));
          pts.push([lerp(edges[e][0], edges[e][2], f), lerp(edges[e][1], edges[e][3], f)]);
          break;
        }
        d -= lens[e];
      }
    }
    return pts;
  }

  function buildOverlay(screen) {
    if (ov) return;
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "ob-ov", viewBox: `0 0 ${SW} ${SH}` });
    ov.innerHTML = `<defs>
      <radialGradient id="ob-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#eaf2ff" stop-opacity=".95"/>
        <stop offset=".35" stop-color="#9db8e8" stop-opacity=".45"/>
        <stop offset="1" stop-color="#9db8e8" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="ob-hole" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#000" stop-opacity="1"/>
        <stop offset=".7" stop-color="#05070f" stop-opacity=".9"/>
        <stop offset="1" stop-color="#05070f" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ob-arc" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffd479" stop-opacity=".1"/>
        <stop offset=".5" stop-color="#ffd479" stop-opacity=".95"/>
        <stop offset="1" stop-color="#ffd479" stop-opacity=".1"/>
      </linearGradient>
    </defs>`;
    screen.insertBefore(ov, hud);
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    let far = "", near = "";
    for (let i = 0; i < 130; i++) {
      const x = (rnd(i, 91) * SW).toFixed(0);
      const y = (rnd(i, 93) * SH).toFixed(0);
      const r = (0.7 + rnd(i, 95) * 1.1).toFixed(1);
      if (i % 4 === 0) near += `<circle cx="${x}" cy="${y}" r="${(r * 1.5).toFixed(1)}" style="--d:${(rnd(i, 97) * 6).toFixed(1)}s"/>`;
      else far += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
    }
    const constel = [
      [[420, 210], [500, 170], [560, 230], [540, 320], [460, 300]],
      [[1230, 700], [1310, 660], [1380, 720], [1330, 800]],
      [[820, 820], [900, 780], [960, 850], [880, 900]],
    ].map((pts) => {
      const lines = pts.slice(1).map((p, i) => `M${pts[i][0]} ${pts[i][1]}L${p[0]} ${p[1]}`).join(" ");
      const dots = pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`).join("");
      return `<g class="cons"><path d="${lines}"/>${dots}</g>`;
    }).join("");
    wallEl.innerHTML = `<svg class="ob-wall" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">` +
      `<g class="stars far">${far}</g><g class="stars near">${near}</g>${constel}</svg>` +
      `<div class="ob-milky"></div>` +
      `<div class="ob-walltag">OBSERVATORY · NIGHT SKY · 9</div>`;
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach(ensureTag);
  }
  function ensureTag(win) {
    let t = win.el.querySelector(".ob-tag");
    if (!t) {
      t = document.createElement("span");
      t.className = "ob-tag";
      win.el.querySelector(".titlebar").appendChild(t);
    }
    if (win.rect) t.textContent = `✦ ${Math.round(win.rect.w)} × ${win.rect.h}`;
    return t;
  }

  // ---- OPEN: constellate — border stars pop and connect, the pane exposes like film ----
  async function onOpen(win) {
    ensureTag(win);
    const el = win.el;
    const r = { ...win.rect };
    el.classList.add("ob-exposing");
    el.style.opacity = "0";
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const g = S("g", { class: "ob-open" }, ov);
    const N = 18;
    const pts = periPoints(r, N);
    const stars = pts.map(([x, y], i) => ({
      e: S("circle", { cx: x.toFixed(1), cy: y.toFixed(1), fill: "url(#ob-glow)" }, g),
      base: 3 + rnd(i, 101) * 4,
      at: i * 0.022,
    }));
    const web = S("path", { class: "ob-web" }, g);
    const rl = S("g", { class: "ob-retflash" }, g);
    S("line", { x1: cx - 34, y1: cy, x2: cx + 34, y2: cy }, rl);
    S("line", { x1: cx, y1: cy - 34, x2: cx, y2: cy + 34 }, rl);
    S("circle", { cx, cy, r: 12 }, rl);
    await tween(700, (t) => {
      const done = Math.floor(seg(t, 0.02, 0.62) * N);
      let d = "";
      stars.forEach((s, i) => {
        const p = eOut(seg(t, s.at, s.at + 0.2));
        s.e.setAttribute("r", (s.base * p).toFixed(1));
        s.e.style.opacity = String(p * (1 - seg(t, 0.78, 1)));
        const [x, y] = pts[i];
        d += (i === 0 ? "M" : "L") + `${x.toFixed(1)} ${y.toFixed(1)} `;
        if (i > done) return;
      });
      web.setAttribute("d", d);
      web.style.opacity = String(0.85 * seg(t, 0.02, 0.2) * (1 - seg(t, 0.72, 0.95)));
      rl.style.opacity = String(seg(t, 0.3, 0.42) * (1 - seg(t, 0.55, 0.8)));
      const ex = eOut(seg(t, 0.35, 0.95));
      el.style.opacity = String(ex);
      el.style.filter = ex >= 1 ? "" :
        `brightness(${(1.7 - 0.7 * ex).toFixed(2)}) blur(${((1 - ex) * 6).toFixed(1)}px)`;
    });
    el.style.opacity = el.style.filter = "";
    el.classList.remove("ob-exposing");
    g.remove();
  }

  // ---- CLOSE: black hole — the pane spirals into a collapsing accretion ring ----
  async function onClose(win) {
    const el = win.el;
    const r = { ...win.rect };
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const g = S("g", { class: "ob-close" }, ov);
    const shade = S("circle", { cx, cy, fill: "url(#ob-hole)" }, g);
    const ring = S("circle", { cx, cy, class: "ob-ring" }, g);
    const swirl = S("circle", { cx, cy, r: 84, class: "ob-swirl", pathLength: 1 }, g);
    el.style.transformOrigin = "50% 50%";
    await tween(560, (t) => {
      const w = eInOut(t);
      el.style.opacity = String(1 - w);
      el.style.transform = `scale(${(1 - 0.85 * w).toFixed(3)}) rotate(${(10 * w).toFixed(1)}deg)`;
      el.style.filter = `brightness(${(1 - 0.7 * w).toFixed(2)}) blur(${(w * 5).toFixed(1)}px)`;
      const grow = eOut(seg(t, 0, 0.4));
      const fall = eIn(seg(t, 0.45, 1));
      const rr = lerp(8, 72, grow) * (1 - fall) + 0.5;
      ring.setAttribute("r", rr.toFixed(1));
      ring.style.opacity = String(0.9 * Math.sin(Math.PI * clamp(grow * (1 - fall * 0.5))));
      swirl.style.opacity = String(0.8 * (1 - fall));
      swirl.style.strokeDashoffset = String(-t * 2);
      shade.setAttribute("r", (rr * 2.2).toFixed(1));
      shade.style.opacity = String(0.75 * Math.sin(Math.PI * seg(t, 0.1, 0.95)));
    });
    el.style.visibility = "hidden";
    el.style.opacity = el.style.transform = el.style.filter = el.style.transformOrigin = "";
    g.remove();
  }

  // ---- SNAP: re-triangulate — a sextant arc swings to the new split with star dust ----
  async function onMove(win, from, to, place) {
    place(win, to);
    ensureTag(win);
    const el = win.el;
    const tag = el.querySelector(".ob-tag");
    const two = ctx && ctx.state.list.length === 2;
    const isLeft = two && to.x === 0;
    const seamEl = ctx && ctx.seam;
    const g = S("g", { class: "ob-snap" }, ov);
    const x1 = from.x + from.w / 2, y1 = from.y + from.h / 2;
    const x2 = to.x + to.w / 2, y2 = to.y + to.h / 2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 130;
    const arc = S("path", {
      class: "ob-arc", pathLength: 1,
      d: `M${x1.toFixed(0)} ${y1.toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}`,
    }, g);
    const dust = [];
    for (let i = 0; i < 6; i++) {
      const f = 0.15 + i * 0.14;
      const px = lerp(lerp(x1, mx, f), lerp(mx, x2, f), f);
      const py = lerp(lerp(y1, my, f), lerp(my, y2, f), f);
      dust.push({ e: S("circle", { cx: px.toFixed(0), cy: py.toFixed(0), r: (2 + rnd(i, 103) * 2.5).toFixed(1), fill: "url(#ob-glow)" }, g), f });
    }
    const lab = S("g", { class: "ob-wlab" }, g);
    const lr = S("rect", { height: 24 }, lab);
    const lt = S("text", {}, lab);
    let last = "";
    const run = tween(540, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e);
      const w = lerp(from.w, to.w, e);
      el.style.left = `${x.toFixed(1)}px`;
      el.style.width = `${w.toFixed(1)}px`;
      tag.textContent = `✦ ${Math.round(w)} × ${to.h}`;
      arc.style.strokeDashoffset = String(1 - eOut(seg(t, 0.05, 0.7)));
      arc.style.opacity = String(seg(t, 0.05, 0.2) * (1 - seg(t, 0.7, 1)));
      dust.forEach((du, i) => {
        const p = seg(t, du.f * 0.5, du.f * 0.5 + 0.4);
        du.e.style.opacity = String(0.9 * Math.sin(Math.PI * p));
      });
      const txt = `${Math.round(w)} px · ${(w < to.h ? "portrait" : "landscape")}`;
      if (txt !== last) {
        lt.textContent = txt;
        lr.setAttribute("width", txt.length * 7.4 + 18);
        last = txt;
      }
      const lw = txt.length * 7.4 + 18;
      lr.setAttribute("x", mx - lw / 2);
      lr.setAttribute("y", my - 12);
      lt.setAttribute("x", mx);
      lt.setAttribute("y", my + 1);
      lab.style.opacity = String(seg(t, 0.15, 0.3) * (1 - seg(t, 0.75, 1)));
      if (seamEl && isLeft) seamEl.style.left = `${x + w}px`;
    }).then(() => {
      place(win, to);
      ensureTag(win);
      fade(g, 500, 200);
    });
    // when a neighbour is about to expose, hand over early so the arcs overlap
    const opening = ctx && ctx.state.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    if (opening) await Promise.race([run, ctx.sleep(330)]);
    else await run;
  }

  // ---- FOCUS: reticle blink — corner brackets and a centre cross flash on the pane ----
  function onFocus(win) {
    if (!ov || !win.rect) return;
    const r = { ...win.rect };
    const B = 30, O = 8;
    const g = S("g", { class: "ob-focus" }, ov);
    const x = r.x, y = r.y, x2 = r.x + r.w, y2 = r.y + r.h;
    S("path", {
      d: `M${x + O} ${y + O + B}V${y + O}H${x + O + B} ` +
        `M${x2 - O - B} ${y + O}H${x2 - O}V${y + O + B} ` +
        `M${x2 - O} ${y2 - O - B}V${y2 - O}H${x2 - O - B} ` +
        `M${x + O + B} ${y2 - O}H${x + O}V${y2 - O - B}`,
    }, g);
    const cx = x + r.w / 2, cy = y + r.h / 2;
    S("path", { d: `M${cx - 26} ${cy}H${cx + 26} M${cx} ${cy - 26}V${cy + 26}` }, g);
    S("circle", { cx, cy, r: 7 }, g);
    tween(300, (t) => {
      g.style.opacity = String(0.9 * Math.sin(Math.PI * t));
    }).then(() => g.remove());
  }

  // ---- SEAM: telescope reticle — hairline, ticks, finder circle, declination label ----
  function seamHook(s) {
    const el = s.seam;
    if (!el.querySelector(".ob-ret")) {
      let ticks = "";
      for (let y = 60; y < SH; y += 110) ticks += `<line class="tk" x1="${GAP / 2 - 6}" y1="${y}" x2="${GAP / 2 + 6}" y2="${y}"/>`;
      el.innerHTML = `<svg class="ob-ret" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">` +
        `<line class="hair" x1="${GAP / 2}" y1="10" x2="${GAP / 2}" y2="${SH - 10}"/>${ticks}` +
        `<circle class="finder" cx="${GAP / 2}" cy="${SH / 2}" r="9"/></svg>` +
        `<div class="ob-seam-lab"><span>1:1</span></div>`;
    }
    Object.assign(el.style, { display: "block", width: `${GAP}px`, transition: "opacity .3s" });
    if (!s.visible) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    el.classList.toggle("ob-chg", !!s.changing);
    const r = ctx ? ctx.state.ratio : [1, 1];
    el.querySelector(".ob-seam-lab span").textContent = `δ ${r[0]}:${r[1]}`;
  }

  // ---- HUD: the ephemeris panel ----
  function hudPanel(data) {
    const bodies = ["#ffd479", "#ff9d6e", "#8fce6e", "#a9c8ff", "#d8b0a0"];
    const tray = data.tray.slice(0, 5).map((t, i) =>
      `<div class="row" style="--d:${300 + i * 60}ms"><span class="bod" style="background:${bodies[i % bodies.length]}"></span>` +
      `<span class="nm">${esc(t)}</span><span class="mag">+${(1 + rnd(i, 107) * 4).toFixed(1)}</span></div>`).join("");
    const objs = ["M31", "M42", "M13"];
    const notes = data.notes.slice(0, 3).map((n, i) => {
      const at = n.indexOf(":");
      const a = at > 0 ? n.slice(0, at) : "Log";
      const b = at > 0 ? n.slice(at + 1).trim() : n;
      return `<div class="row log" style="--d:${420 + i * 60}ms"><span class="obj">${objs[i] || "M87"}</span>` +
        `<span class="nm"><b>${esc(a)}</b> — ${esc(b)}</span></div>`;
    }).join("");
    return `<div class="ob-wash"></div><div class="ob-card">` +
      `<div class="chead"><span>OBSERVATORY · EPHEMERIS</span><span class="cno">No. 9</span></div>` +
      `<div class="clock">${esc(data.time)}</div><div class="cdate">${esc(data.date)} · SIDEREAL</div>` +
      `<div class="sec">VISIBLE BODIES — TRAY</div>${tray}` +
      `<div class="sec">OBSERVER'S LOG</div>${notes}</div>`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    hudEl.innerHTML = `<div class="ob-hud">${hudPanel(data)}</div>`;
    const root = hudEl.firstElementChild;
    root.getBoundingClientRect();
    tick(() => { if (gen === hudGen) root.classList.add("in"); });
    await new Promise((r) => setTimeout(r, 640));
  }
  async function hudHide(hudEl) {
    ++hudGen;
    const root = hudEl.querySelector(".ob-hud");
    if (!root) {
      hudEl.innerHTML = "";
      return;
    }
    root.classList.add("out");
    await new Promise((r) => setTimeout(r, 320));
    hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
