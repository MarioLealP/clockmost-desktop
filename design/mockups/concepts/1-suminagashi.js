// 1 · Suminagashi (ink on water)
// Windows are ink dropped on rice-paper water: they bloom open as concentric ink rings, dissolve
// back into marbling on close, keep a wet glossy rim while focused (dry/matte otherwise), and meet
// their neighbour in a thin drifting marbled seam. The HUD is a drop that unfurls a paper blot.
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#101114";
  const INK2 = "#2a2c33";
  const PAPER = "#ece6d7";
  const VERM = "#b23a2a";
  const INDIGO = "#34507c";
  const GAP = 12;
  let defs = null;
  let ripples = null;
  let ctx = null;
  let uid = 0;
  let hudToken = 0;

  const clamp = (v) => Math.max(0, Math.min(1, v));
  const E = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    glide: (t) => 1 - Math.pow(1 - t, 4),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  };

  // next frame: rAF, with a timer fallback (headless virtual time does not pump rAF)
  function frame(cb) {
    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      cb();
    };
    requestAnimationFrame(go);
    setTimeout(go, 20);
  }

  function tween(ms, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = () => {
        const t = clamp((performance.now() - t0) / ms);
        fn(t);
        if (t < 1) frame(step);
        else res();
      };
      frame(step);
    });
  }

  // WAAPI .finished can stall under headless virtual time; race it against a timer
  function done(anim, ms) {
    return Promise.race([anim.finished.catch(() => {}), new Promise((r) => setTimeout(r, ms + 30))]);
  }

  function svg(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function div(cls, parent, style) {
    const e = document.createElement("div");
    e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  }

  // a "bleed" filter: fractal noise displaces the edge (ink feathering into paper fibres)
  function bleed(freq, scale, blur, region) {
    const id = "sm-f" + ++uid;
    const r = region || { x: "-25%", y: "-25%", width: "150%", height: "150%" };
    const f = svg("filter", { id, ...r, "color-interpolation-filters": "sRGB" }, defs);
    const turb = svg("feTurbulence", { type: "fractalNoise", baseFrequency: freq, numOctaves: 3, seed: uid * 7, result: "n" }, f);
    const disp = svg("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale, xChannelSelector: "R", yChannelSelector: "G", result: "d" }, f);
    const gb = svg("feGaussianBlur", { in: "d", stdDeviation: blur || 0 }, f);
    return { id, url: `url(#${id})`, turb, disp, gb, kill: () => f.remove() };
  }

  // ---- wallpaper: rice paper over slow water ------------------------------------------------
  function paperTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 384;
    const g = c.getContext("2d");
    g.fillStyle = PAPER;
    g.fillRect(0, 0, 384, 384);
    const img = g.getImageData(0, 0, 384, 384);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n * 0.9;
    }
    g.putImageData(img, 0, 0);
    // kozo fibres
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 384;
      const y = Math.random() * 384;
      const a = Math.random() * Math.PI * 2;
      const l = 8 + Math.random() * 34;
      g.strokeStyle = `rgba(${110 + Math.random() * 30},${96 + Math.random() * 20},${70},${0.05 + Math.random() * 0.08})`;
      g.lineWidth = 0.4 + Math.random() * 0.7;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    return c.toDataURL();
  }

  function ripple(x, y, o) {
    const opt = { size: 520, n: 3, dur: 2600, stagger: 260, alpha: 0.5, layer: ripples, ...o };
    for (let i = 0; i < opt.n; i++) {
      const r = div("sm-ring", opt.layer, {
        left: x - opt.size / 2 + "px",
        top: y - opt.size / 2 + "px",
        width: opt.size + "px",
        height: opt.size + "px",
      });
      const a = r.animate(
        [
          { transform: "scale(.04)", opacity: 0 },
          { opacity: opt.alpha, offset: 0.15 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: opt.dur, delay: i * opt.stagger, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" },
      );
      done(a, opt.dur + i * opt.stagger).then(() => r.remove());
    }
  }

  // ---- window rim: wet (focused, glossy, feathered) vs dry (matte, grainy) ------------------
  function decorate(win) {
    if (win.sm) return win.sm;
    const region = { filterUnits: "userSpaceOnUse", x: -40, y: -40, width: 2100, height: 1200 };
    const wet = bleed("0.045", 4, 0.9, region);
    const dry = bleed("0.4", 3, 0, region);
    const rim = div("sm-rim", win.el);
    for (const side of ["t", "r", "b", "l"]) {
      const e = div("sm-e " + side, rim);
      div("wet", e).style.filter = wet.url;
      div("dry", e).style.filter = dry.url;
      if (side === "t" || side === "l") div("gl", e);
    }
    win.sm = { wet, dry, rim };
    return win.sm;
  }

  function rimRipple(win, ms, amp) {
    const s = decorate(win);
    return tween(ms, (t) => {
      const k = Math.sin(t * Math.PI);
      s.wet.disp.setAttribute("scale", 5 + amp * k);
      s.dry.disp.setAttribute("scale", 3 + amp * 0.6 * k);
      s.wet.turb.setAttribute("baseFrequency", (0.045 - 0.02 * k).toFixed(4));
    });
  }

  function glint(win) {
    const s = decorate(win);
    s.rim.classList.remove("glint");
    void s.rim.offsetWidth;
    s.rim.classList.add("glint");
  }

  // ---- seam: two inks meeting as a drifting marbled line -------------------------------------
  let seamWrap = null;
  let seamAnims = [];
  let lastBump = 0;

  function buildSeam(el, h) {
    seamWrap = div("sm-seam", el);
    const w = 60;
    const s = svg("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, seamWrap);
    const f = bleed("0.02 0.004", 3, 0.2);
    const g = svg("g", { filter: f.url }, s);
    const lines = [
      { amp: 2.6, P: 420, col: INK, sw: 2.2, op: 0.9, dur: 26000, ph: 0 },
      { amp: 3.4, P: 300, col: VERM, sw: 1.3, op: 0.75, dur: 19000, ph: 1.7 },
      { amp: 2.0, P: 540, col: INDIGO, sw: 1.1, op: 0.8, dur: 33000, ph: 3.1 },
    ];
    for (const L of lines) {
      let d = "";
      for (let y = -L.P; y <= h + L.P; y += 6) {
        const a = (y / L.P) * Math.PI * 2 + L.ph;
        const x = w / 2 + L.amp * Math.sin(a) + L.amp * 0.45 * Math.sin(2 * a + 1.3) + L.amp * 0.25 * Math.sin(3 * a + 0.4);
        d += (d ? "L" : "M") + x.toFixed(2) + "," + y;
      }
      const p = svg("path", { d, fill: "none", stroke: L.col, "stroke-width": L.sw, "stroke-opacity": L.op, "stroke-linecap": "round" }, g);
      seamAnims.push(
        p.animate([{ transform: `translateY(${-L.P}px)` }, { transform: "translateY(0px)" }], { duration: L.dur, iterations: Infinity }),
      );
    }
  }

  function seamBump() {
    const now = performance.now();
    if (!seamWrap || now - lastBump < 1400) return;
    lastBump = now;
    // swell (fast) then settle (slow); drift speeds up and calms back down
    tween(1100, (t) => {
      const k = t < 0.3 ? E.out(t / 0.3) : 1 - E.inOut((t - 0.3) / 0.7);
      seamWrap.style.transform = `scaleX(${1 + 2.6 * k})`;
      seamAnims.forEach((a) => (a.playbackRate = 1 + 14 * Math.pow(1 - t, 2)));
    });
  }

  // ---- ink bloom (open) and dissolve (close) -------------------------------------------------
  function inkLayer(r, pad) {
    const host = div("sm-bloom", ctx.wins, {
      left: r.x - pad + "px",
      top: r.y - pad + "px",
      width: r.w + pad * 2 + "px",
      height: r.h + pad * 2 + "px",
    });
    const s = svg("svg", { width: r.w + pad * 2, height: r.h + pad * 2 }, host);
    const cid = "sm-c" + ++uid;
    const cp = svg("clipPath", { id: cid }, s);
    svg("rect", { x: pad, y: pad, width: r.w, height: r.h }, cp);
    return { host, s, clip: `url(#${cid})` };
  }

  function rings(parent, cx, cy, n, cols) {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(
        svg("circle", {
          cx,
          cy,
          r: 1,
          fill: "none",
          stroke: cols[i % cols.length],
          "stroke-width": i % 2 ? 3 : 16,
          "stroke-opacity": 0,
        }, parent),
      );
    }
    return out;
  }

  async function onOpen(win) {
    decorate(win);
    const r = win.rect;
    const pad = 240;
    const cx = pad + r.w / 2;
    const cy = pad + r.h / 2;
    const R = Math.hypot(r.w, r.h) / 2 + 40;
    ripple(r.x + r.w / 2, r.y + r.h / 2, { size: Math.max(r.w, r.h) * 1.5, dur: 1800, stagger: 140, alpha: 0.7 });

    const L = inkLayer(r, pad);
    const f = bleed("0.007", 46, 0.6);
    const fill = svg("g", { "clip-path": L.clip }, L.s);
    const fg = svg("g", { filter: f.url }, fill);
    const body = svg("circle", { cx, cy, r: 1, fill: INK }, fg);
    const inner = rings(fg, cx, cy, 6, [INK2, "#3a3c44"]);
    const outerF = bleed("0.01", 30, 1.2);
    const og = svg("g", { filter: outerF.url }, L.s);
    const outer = rings(og, cx, cy, 4, [INK, VERM]);

    const el = win.el;
    const parts = [el.querySelector(".content"), el.querySelector(".titlebar")];
    el.style.clipPath = `circle(0px at ${r.w / 2}px ${r.h / 2}px)`;
    parts.forEach((p) => (p.style.opacity = 0));

    await tween(700, (t) => {
      const a = E.out(clamp(t / 0.72));
      body.setAttribute("r", R * a);
      inner.forEach((c, i) => {
        const k = 0.18 + i * 0.14;
        c.setAttribute("r", Math.max(1, R * a * k));
        c.setAttribute("stroke-opacity", 0.9 * (1 - clamp((t - 0.4) / 0.4)));
      });
      outer.forEach((c, i) => {
        const ti = clamp((t - i * 0.07) / 0.93);
        c.setAttribute("r", Math.max(1, R * (0.5 + i * 0.12) * E.out(ti) + 40 * ti));
        c.setAttribute("stroke-opacity", (i % 2 ? 0.55 : 0.28) * Math.sin(ti * Math.PI));
      });
      f.disp.setAttribute("scale", 46 * (1 - 0.7 * t));
      const tc = E.out(clamp((t - 0.12) / 0.6));
      el.style.clipPath = `circle(${R * 1.1 * tc}px at ${r.w / 2}px ${r.h / 2}px)`;
      const tr = E.inOut(clamp((t - 0.38) / 0.62));
      parts.forEach((p) => {
        p.style.opacity = tr;
        p.style.filter = tr < 1 ? `blur(${(1 - tr) * 9}px)` : "";
      });
      fill.setAttribute("opacity", 1 - E.inOut(clamp((t - 0.42) / 0.58)));
    });
    el.style.clipPath = "";
    parts.forEach((p) => {
      p.style.opacity = "";
      p.style.filter = "";
    });
    L.host.remove();
    f.kill();
    outerF.kill();
  }

  async function onClose(win) {
    const r = win.rect;
    const pad = 280;
    const cx = pad + r.w / 2;
    const cy = pad + r.h / 2;
    const L = inkLayer(r, pad);
    const f = bleed("0.006", 0, 0, { x: "-30%", y: "-30%", width: "160%", height: "160%" });
    const g = svg("g", { filter: f.url, opacity: 0 }, L.s);
    const slab = svg("rect", { x: pad, y: pad, width: r.w, height: r.h, fill: INK }, g);
    // the window's ink separates into suminagashi rings as it lets go
    const rg = svg("g", { "clip-path": L.clip, opacity: 0 }, g);
    const R = Math.hypot(r.w, r.h) / 2;
    for (let i = 0; i < 9; i++) {
      svg("circle", {
        cx,
        cy,
        r: R * (0.12 + i * 0.11),
        fill: "none",
        stroke: i === 4 ? VERM : i % 2 ? PAPER : INK2,
        "stroke-width": i % 2 ? 7 : 26,
        "stroke-opacity": i === 4 ? 0.7 : i % 2 ? 0.55 : 1,
      }, rg);
    }
    const el = win.el;
    const parts = [el.querySelector(".content"), el.querySelector(".titlebar")];
    let hidden = false;
    const done = tween(680, (t) => {
      const a = E.out(clamp(t / 0.3));
      g.setAttribute("opacity", a);
      parts.forEach((p) => (p.style.filter = `blur(${a * 7}px)`));
      if (!hidden && t > 0.3) {
        hidden = true;
        el.style.opacity = 0;
        ripple(r.x + r.w / 2, r.y + r.h / 2, { size: Math.max(r.w, r.h) * 1.7, dur: 2200, stagger: 180, alpha: 0.8 });
      }
      const b = clamp((t - 0.22) / 0.78);
      // the solid ink lets go first, leaving the marbled rings floating on the paper, then they diffuse
      slab.setAttribute("opacity", 1 - E.out(clamp((b - 0.1) / 0.5)));
      rg.setAttribute("opacity", E.out(clamp(b / 0.2)) * (1 - E.inOut(clamp((b - 0.5) / 0.5))));
      rg.setAttribute("transform", `translate(${cx} ${cy}) scale(${1 + b * 0.35}) translate(${-cx} ${-cy})`);
      f.disp.setAttribute("scale", 170 * E.in(b) + 30 * b);
      f.turb.setAttribute("baseFrequency", (0.006 + 0.008 * b).toFixed(4));
      f.gb.setAttribute("stdDeviation", 22 * b * b);
    });
    await done;
    L.host.remove();
    f.kill();
    if (win.sm) {
      win.sm.wet.kill();
      win.sm.dry.kill();
    }
  }

  async function onMove(win, from, to, place) {
    decorate(win);
    const lerp = (a, b, k) => Math.round(a + (b - a) * k);
    // the seam follows the left window's right edge while gliding
    const seam = ctx && ctx.seam;
    const follow = seam && seam.style.display === "block" && to.x === 0 && from.w < ctx.W && to.w < ctx.W;
    if (follow) seamBump();
    const ex = from.w > to.w ? from.x + from.w : to.x + to.w;
    ripple(to.x === 0 ? ex : to.x, ctx.H / 2, { size: 700, n: 2, dur: 1600, alpha: 0.6 });
    const glide = tween(580, (t) => {
      const k = E.glide(t);
      const r = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), w: lerp(from.w, to.w, k), h: lerp(from.h, to.h, k) };
      place(win, r);
      if (follow) seam.style.left = r.x + r.w + "px";
    });
    await Promise.all([glide, rimRipple(win, 620, 16)]);
    place(win, to);
  }

  function onFocus(win) {
    decorate(win);
    glint(win);
    rimRipple(win, 300, 7);
  }

  function seamHook(s) {
    if (!s.visible) return;
    if (!seamWrap) buildSeam(s.seam, s.h);
    if (s.changing) seamBump();
  }

  // ---- HUD: a drop falls, unfurls a paper blot with a brushed clock --------------------------
  function brushPath(w, h, seed) {
    const j = (k) => ((Math.sin(seed * 12.9 + k * 78.2) * 43758.5) % 1) * 3;
    return `M2,${h * 0.55 + j(1)} C${w * 0.2},${h * 0.1 + j(2)} ${w * 0.6},${h * 0.2 + j(3)} ${w - 4},${h * 0.35 + j(4)}
      L${w},${h * 0.6} C${w * 0.7},${h * 0.95 + j(5)} ${w * 0.3},${h * 0.85 + j(6)} 6,${h * 0.95} Z`;
  }

  function label(parent, text, cls, i, accent) {
    const l = div("sm-label " + cls, parent);
    const s = svg("svg", { class: "sw", viewBox: "0 0 200 30", preserveAspectRatio: "none" }, l);
    svg("path", { d: brushPath(200, 30, i + 1), fill: accent ? VERM : INK, "fill-opacity": accent ? 0.16 : 0.1, filter: "url(#sm-brush)" }, s);
    const t = document.createElement("span");
    t.textContent = text;
    l.appendChild(t);
    return l;
  }

  async function hudShow(hud, data) {
    const tok = ++hudToken;
    hud.innerHTML = "";
    const root = div("sm-hud", hud);
    const X = 960;
    const SW = 1120;
    const SH = 450;
    const SX = X - SW / 2;
    const SY = 30;
    const sheet = div("sm-sheet", root, { left: SX + "px", top: SY + "px", width: SW + "px", height: SH + "px" });
    const s = svg("svg", { width: SW, height: SH, class: "bg" }, sheet);
    const mid = "sm-m" + ++uid;
    const m = svg("mask", { id: mid, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: SW, height: SH }, s);
    const mf = bleed("0.012", 40, 3);
    const mc = svg("circle", { cx: SW / 2, cy: 60, r: 1, fill: "#fff", filter: mf.url }, m);
    const pf = bleed("0.009", 34, 0.8);
    const body = svg("g", { mask: `url(#${mid})` }, s);
    svg("rect", { x: 34, y: 30, width: SW - 68, height: SH - 66, rx: 70, fill: "#000", "fill-opacity": 0.28, filter: pf.url, transform: "translate(4 10)" }, body);
    svg("rect", { x: 30, y: 24, width: SW - 60, height: SH - 66, rx: 60, fill: PAPER, filter: pf.url }, body);
    // clock: outline drawn like a brush, then the ink floods in behind a feathered wipe
    const bid = "sm-b" + ++uid;
    const bm = svg("mask", { id: bid, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: SW, height: SH }, s);
    const lg = svg("linearGradient", { id: bid + "g" }, s);
    svg("stop", { offset: "0", "stop-color": "#fff" }, lg);
    svg("stop", { offset: ".86", "stop-color": "#fff" }, lg);
    svg("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": 0 }, lg);
    const wipe = svg("rect", { x: -900, y: 0, width: 900, height: SH, fill: `url(#${bid}g)` }, bm);
    const clockG = svg("g", { filter: "url(#sm-rough)" }, body);
    const fillT = svg("text", { x: 96, y: 262, class: "sm-clock", fill: INK, mask: `url(#${bid})` }, clockG);
    fillT.textContent = data.time;
    const strokeT = svg("text", { x: 96, y: 262, class: "sm-clock", fill: "none", stroke: INK, "stroke-width": 2.4, "stroke-dasharray": 1400, "stroke-dashoffset": 1400 }, clockG);
    strokeT.textContent = data.time;
    const day = new Date().getDate();
    const seal = svg("g", { transform: "translate(668 92) rotate(-4)", opacity: 0 }, body);
    svg("rect", { x: -30, y: -30, width: 60, height: 60, rx: 5, fill: VERM, filter: "url(#sm-rough)" }, seal);
    const st = svg("text", { x: 0, y: 11, "text-anchor": "middle", class: "sm-seal" }, seal);
    st.textContent = String(day).padStart(2, "0");
    const dateT = svg("text", { x: 104, y: 318, class: "sm-date", opacity: 0 }, body);
    dateT.textContent = data.date;

    // HTML labels (tray + notes)
    const notes = div("sm-notes", sheet);
    data.notes.forEach((n, i) => label(notes, n, "note", i, i === 0));
    const tray = div("sm-tray", sheet);
    data.tray.forEach((n, i) => label(tray, n, "tray", i + 5, false));
    const labels = [...notes.children, ...tray.children];
    labels.forEach((l) => (l.style.clipPath = "inset(0 100% 0 0)"));

    // the drop
    const drop = div("sm-drop", root, { left: X - 9 + "px", top: "-40px" });
    await tween(170, (t) => {
      const y = 122 * t * t;
      const sx = t < 0.9 ? 0.7 + 0.2 * t : 0.9 + 7 * (t - 0.9);
      const sy = t < 0.9 ? 1.3 - 0.15 * t : 1.15 - 6.5 * (t - 0.9);
      drop.style.transform = `translateY(${y}px) scale(${sx},${sy})`;
    });
    if (tok !== hudToken) return;
    drop.remove();
    ripple(X, SY + 60, { size: 900, n: 3, dur: 1300, stagger: 90, alpha: 0.9, layer: root });

    // labels brush in one after another
    tween(150 + labels.length * 35 + 280, (t) => {
      const ms = t * (150 + labels.length * 35 + 280);
      labels.forEach((l, i) => {
        const k = E.out(clamp((ms - 150 - i * 35) / 280));
        l.style.clipPath = k >= 1 ? "" : `inset(-4px ${(1 - k) * 100}% -4px 0)`;
      });
    });
    await tween(460, (t) => {
      if (tok !== hudToken) return;
      mc.setAttribute("r", 900 * E.out(t));
      mf.disp.setAttribute("scale", 40 * (1 - t * 0.5));
      const ts = clamp((t - 0.12) / 0.7);
      strokeT.setAttribute("stroke-dashoffset", 1400 * (1 - E.inOut(ts)));
      wipe.setAttribute("x", -900 + 960 * E.inOut(clamp((t - 0.3) / 0.7)));
      dateT.setAttribute("opacity", E.out(clamp((t - 0.5) / 0.5)));
      const ss = clamp((t - 0.7) / 0.3);
      seal.setAttribute("opacity", ss > 0 ? 1 : 0);
      seal.setAttribute("transform", `translate(668 92) rotate(-4) scale(${1 + 0.5 * (1 - E.out(ss))})`);
    });
    if (tok === hudToken) strokeT.setAttribute("stroke-opacity", 0.5);
  }

  async function hudHide(hud) {
    const tok = ++hudToken;
    const root = hud.querySelector(".sm-hud");
    if (!root) return;
    const f = bleed("0.01", 0, 0, { x: "-20%", y: "-20%", width: "140%", height: "140%" });
    root.style.filter = f.url;
    await tween(360, (t) => {
      const e = E.in(t);
      f.disp.setAttribute("scale", 120 * t);
      f.gb.setAttribute("stdDeviation", 14 * e);
      root.style.opacity = 1 - E.out(t) * 0.98;
    });
    f.kill();
    if (tok === hudToken) hud.innerHTML = "";
  }

  // ---- wiring -------------------------------------------------------------------------------
  function wallpaper(wall) {
    wall.classList.add("sm-wall");
    wall.style.backgroundImage = `radial-gradient(ellipse at 28% 18%, rgba(255,253,246,.55), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(160,145,118,.16), transparent 60%), url(${paperTexture()})`;
    div("sm-light", wall);
    ripples = div("sm-ripples", wall);
    const ds = svg("svg", { width: 0, height: 0, class: "sm-defs" }, wall);
    defs = svg("defs", {}, ds);
    // shared static filters
    const rough = svg("filter", { id: "sm-rough", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
    svg("feTurbulence", { type: "fractalNoise", baseFrequency: "0.08 0.03", numOctaves: 2, seed: 3, result: "n" }, rough);
    svg("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 3.2, xChannelSelector: "R", yChannelSelector: "G" }, rough);
    const brush = svg("filter", { id: "sm-brush", x: "-5%", y: "-20%", width: "110%", height: "140%" }, defs);
    svg("feTurbulence", { type: "fractalNoise", baseFrequency: "0.02 0.4", numOctaves: 2, seed: 9, result: "n" }, brush);
    svg("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: 6, xChannelSelector: "R", yChannelSelector: "G" }, brush);
    // ambient: a slow ripple now and then, as if a leaf touched the water
    const amb = () => ripple(200 + Math.random() * 1520, 150 + Math.random() * 780, { size: 380 + Math.random() * 300, n: 3, dur: 7000, stagger: 900, alpha: 0.35 });
    setTimeout(amb, 400);
    setInterval(amb, 7000);
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach(decorate);
  }

  window.CONCEPT = {
    gap: GAP,
    wallpaper,
    ready,
    onOpen,
    onClose,
    onMove,
    onFocus,
    seam: seamHook,
    hudShow,
    hudHide,
  };
})();
