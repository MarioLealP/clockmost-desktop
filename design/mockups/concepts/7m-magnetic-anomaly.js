// 7m · Magnetic Anomaly (Muse): pitch-black ferrofluid + Rosensweig spikes -> dark mirror windows.
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
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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
  // deterministic pseudo-random per index so motion is smooth, never jittery
  const rnd = (i, s) => {
    const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  function buildOverlay(screen) {
    if (ov) return;
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "mg-ov", viewBox: `0 0 ${SW} ${SH}` });
    ov.innerHTML = `<defs>
      <filter id="mg-goo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="b"/>
        <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -11" result="g"/>
        <feComposite in="SourceGraphic" in2="g" operator="atop"/>
      </filter>
      <filter id="mg-soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <linearGradient id="mg-mirror" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0b0e15"/><stop offset=".32" stop-color="#202b40"/>
        <stop offset=".52" stop-color="#0a0d14"/><stop offset=".78" stop-color="#161e2e"/>
        <stop offset="1" stop-color="#07080d"/>
      </linearGradient>
      <linearGradient id="mg-spike" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#05070b"/><stop offset=".55" stop-color="#1a2334"/>
        <stop offset=".86" stop-color="#9fb4d0"/><stop offset="1" stop-color="#f2f7ff"/>
      </linearGradient>
      <linearGradient id="mg-sheen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="mg-bead" cx=".35" cy=".28" r=".9">
        <stop offset="0" stop-color="#eef5ff"/><stop offset=".22" stop-color="#93a9c6"/>
        <stop offset=".55" stop-color="#1b2434"/><stop offset="1" stop-color="#04050a"/>
      </radialGradient>
    </defs>`;
    fx = document.createElement("div");
    fx.className = "mg-fx";
    screen.insertBefore(ov, hud);
    screen.insertBefore(fx, hud);
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    // faint magnetic field-line texture: two off-screen poles, dipole loops
    let loops = "";
    const poles = [{ x: 240, y: 1180 }, { x: 1680, y: -120 }];
    for (let i = 0; i < 16; i++) {
      const k = (i - 7.5) / 7.5;
      const bow = 180 + Math.abs(k) * 420;
      const x1 = poles[0].x + k * 260, y1 = poles[0].y;
      const x2 = poles[1].x + k * 260, y2 = poles[1].y;
      const cx = 960 + k * 700;
      loops += `<path class="fl${i % 3 === 0 ? " st" : ""}" d="M${x1} ${y1} C ${cx - bow} 760, ${cx - bow} 320, ${x2} ${y2}"/>`;
    }
    let filings = "";
    for (let i = 0; i < 90; i++) {
      const x = (i * 379.7) % SW, y = (i * 613.3) % SH;
      const a = ((i * 37) % 180) - 90;
      filings += `<line x1="${x - 5}" y1="${y}" x2="${x + 5}" y2="${y}" transform="rotate(${a} ${x} ${y})"/>`;
    }
    wallEl.innerHTML = `<svg class="mg-wall" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">` +
      `<g class="mg-drift"><g class="mg-loops">${loops}</g><g class="mg-filings">${filings}</g></g>` +
      `<circle cx="960" cy="540" r="620" class="mg-vig"/>` +
      `</svg><div class="mg-walltag">FERROFLUID FIELD · 7M</div>`;
  }

  function ready(c) { ctx = c; }

  // hex-ish grid of spike bases inside rect r
  function spikeGrid(r, nx, ny, seed) {
    const pts = [];
    const mx = 46, my = 52;
    const iw = Math.max(60, r.w - mx * 2), ih = Math.max(60, r.h - my * 2);
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const ox = (iy % 2) * 0.5;
        pts.push({
          x: r.x + mx + ((ix + ox) / nx) * iw,
          y: r.y + my + (iy / Math.max(1, ny - 1)) * ih,
          s: rnd(ix * 31 + iy * 57, seed),
          s2: rnd(ix * 11 + iy * 91, seed + 7),
        });
      }
    }
    return pts;
  }
  function spikePath(bx, by, w, h) {
    // glossy cone: curved sides meeting in a sharp tip
    if (h <= 0.5) return `M${bx - w / 2} ${by} Q${bx} ${by - 2} ${bx + w / 2} ${by} Z`;
    return `M${bx - w / 2} ${by} Q${bx - w * 0.18} ${by - h * 0.62} ${bx} ${by - h} ` +
      `Q${bx + w * 0.18} ${by - h * 0.62} ${bx + w / 2} ${by} Q${bx} ${by + w * 0.22} ${bx - w / 2} ${by} Z`;
  }

  // ---- OPEN: puddle erupts into Rosensweig spikes, flattens to a dark mirror ----
  async function onOpen(win) {
    const el = win.el;
    const r = { ...win.rect };
    el.classList.add("mg-forming");
    el.style.opacity = "0";
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = S("g", { class: "mg-open" }, ov);
    const goo = S("g", { filter: "url(#mg-goo)" }, g);
    const blobs = [];
    for (let i = 0; i < 8; i++) {
      const c = S("circle", { fill: "#0b0e15" }, goo);
      blobs.push({ el: c, a: (i / 8) * Math.PI * 2 + rnd(i, 3) * 0.8, d: 20 + rnd(i, 5) * 120, q: 0.5 + rnd(i, 9) * 0.9 });
    }
    const bases = spikeGrid(r, 7, 5, 21);
    const spikes = bases.map((b) => ({ b, p: S("path", { fill: "url(#mg-spike)" }, g) }));
    const mirror = S("rect", { fill: "url(#mg-mirror)", rx: 8 }, g);
    const sheen = S("rect", { fill: "url(#mg-sheen)" }, g);
    const edge = S("rect", { fill: "none", class: "mg-medge" }, g);
    await tween(640, (t) => {
      // puddle: blobs swell + merge
      const p1 = eOut(seg(t, 0, 0.4));
      blobs.forEach((bl) => {
        const rr = lerp(8, 46 + bl.q * 74, p1);
        const dd = lerp(0, bl.d, eOut(seg(t, 0.02, 0.42)));
        bl.el.setAttribute("cx", cx + Math.cos(bl.a) * dd * (r.w / 700));
        bl.el.setAttribute("cy", cy + Math.sin(bl.a) * dd * 0.55);
        bl.el.setAttribute("r", rr);
        bl.el.style.opacity = String(1 - seg(t, 0.62, 0.95));
      });
      // spikes: rise out of pool, then get ironed flat into the mirror
      const env = Math.sin(Math.PI * seg(t, 0.2, 0.8));
      const flat = seg(t, 0.62, 0.92);
      spikes.forEach(({ b, p }, i) => {
        const wob = 0.72 + 0.28 * Math.sin(i * 1.7 + t * 5);
        const h = Math.max(0, env * (34 + b.s * 86) * wob * (1 - flat) * clamp(r.h / 620, 0.5, 1.2));
        p.setAttribute("d", spikePath(b.x, b.y, 26 + b.s2 * 14, h));
        p.style.opacity = String(h > 0.6 ? 0.95 : 0);
      });
      // mirror surface settles
      const m = eInOut(seg(t, 0.52, 0.92));
      const ix = lerp(54, 0, m), iy = lerp(40, 0, m);
      mirror.setAttribute("x", r.x + ix); mirror.setAttribute("y", r.y + iy);
      mirror.setAttribute("width", Math.max(1, r.w - ix * 2)); mirror.setAttribute("height", Math.max(1, r.h - iy * 2));
      mirror.style.opacity = String(seg(t, 0.52, 0.66));
      edge.setAttribute("x", r.x + ix); edge.setAttribute("y", r.y + iy);
      edge.setAttribute("width", Math.max(1, r.w - ix * 2)); edge.setAttribute("height", Math.max(1, r.h - iy * 2));
      edge.style.opacity = String(seg(t, 0.55, 0.7));
      const sx = lerp(r.x - 160, r.x + r.w + 160, seg(t, 0.6, 0.95));
      sheen.setAttribute("x", sx - 70); sheen.setAttribute("y", r.y);
      sheen.setAttribute("width", 140); sheen.setAttribute("height", r.h);
      sheen.style.opacity = String(0.5 * Math.sin(Math.PI * seg(t, 0.6, 0.95)));
      // window inks in as the mirror
      const wi = eOut(seg(t, 0.62, 1));
      el.style.opacity = String(wi);
      el.style.transform = `scale(${0.965 + 0.035 * wi})`;
      el.style.transformOrigin = "50% 50%";
      el.style.clipPath = wi >= 1 ? "" : `inset(${(1 - wi) * 7}% ${(1 - wi) * 4}% 0 0)`;
    });
    el.style.opacity = el.style.transform = el.style.clipPath = el.style.transformOrigin = "";
    el.classList.remove("mg-forming");
    g.remove();
  }

  // ---- CLOSE: field cuts, beads drain into the nearest edge ----
  async function onClose(win) {
    const el = win.el;
    const r = { ...win.rect };
    const dL = r.x, dR = SW - (r.x + r.w), dT = r.y, dB = SH - (r.y + r.h);
    const m = Math.min(dL, dR, dT, dB);
    let edge = "right", tx = SW + 60, ty = r.y + r.h / 2, org = "100% 50%";
    if (m === dL) { edge = "left"; tx = -60; ty = r.y + r.h / 2; org = "0% 50%"; }
    else if (m === dT) { edge = "top"; tx = r.x + r.w / 2; ty = -60; org = "50% 0%"; }
    else if (m === dB) { edge = "bottom"; tx = r.x + r.w / 2; ty = SH + 60; org = "50% 100%"; }
    const g = S("g", { class: "mg-close" }, ov);
    const goo = S("g", { filter: "url(#mg-goo)" }, g);
    const beads = [];
    for (let i = 0; i < 44; i++) {
      const c = S("circle", { fill: "url(#mg-bead)" }, goo);
      const sxx = r.x + 20 + rnd(i, 41) * Math.max(40, r.w - 40);
      const syy = r.y + 30 + rnd(i, 43) * Math.max(40, r.h - 60);
      beads.push({
        el: c, sx: sxx, sy: syy,
        jx: (rnd(i, 47) - 0.5) * (edge === "left" || edge === "right" ? 90 : r.w * 0.3),
        jy: (rnd(i, 49) - 0.5) * (edge === "top" || edge === "bottom" ? 90 : 220),
        d: rnd(i, 53) * 0.38, q: 4 + rnd(i, 57) * 12,
      });
    }
    const skin = S("rect", { x: r.x, y: r.y, width: r.w, height: r.h, fill: "url(#mg-mirror)", rx: 8 }, g);
    el.style.transformOrigin = org;
    await tween(560, (t) => {
      // field-cut shiver: skin ripples then releases
      const sh = Math.sin(t * 40) * 3 * (1 - seg(t, 0, 0.3));
      skin.setAttribute("x", r.x + sh);
      skin.style.opacity = String(0.85 * (1 - seg(t, 0.3, 0.85)));
      const wo = eIn(seg(t, 0.18, 1));
      el.style.opacity = String(1 - wo);
      el.style.transform = `scale(${1 - 0.08 * wo})`;
      el.style.filter = `saturate(${1 - 0.5 * seg(t, 0, 0.5)}) brightness(${1 - 0.25 * wo})`;
      beads.forEach((b) => {
        const pt = seg(t, b.d * 0.6, 1);
        const p = eIn(pt);
        const ex = edge === "left" || edge === "right" ? lerp(b.sx, tx, p) : lerp(b.sx, tx, p * 0.55) + b.jx * (1 - p);
        const ey = edge === "top" || edge === "bottom" ? lerp(b.sy, ty, p) : lerp(b.sy, ty + b.jy, p * 0.35) + b.jy * (1 - p) * 0.3;
        // stretch along travel, then collapse into the edge
        const stretch = 1 + 1.6 * Math.sin(Math.PI * clamp(p * 1.15));
        const rr = b.q * (1 - 0.75 * seg(pt, 0.75, 1));
        b.el.setAttribute("cx", ex); b.el.setAttribute("cy", ey);
        b.el.setAttribute("r", Math.max(0.1, rr));
        b.el.style.opacity = String(pt <= 0 ? 0 : 1 - seg(pt, 0.82, 1));
        b.el.setAttribute("transform", `rotate(${(b.sx > ex ? 90 : 0)}) ${ex} ${ey} scale(1 ${stretch > 1 ? 1 / stretch + 0.6 : 1})`);
      });
    });
    el.style.visibility = "hidden";
    el.style.opacity = el.style.transform = el.style.filter = el.style.transformOrigin = "";
    g.remove();
  }

  // ---- SNAP: edge spikes preview the new split, window re-solidifies there ----
  async function onMove(win, from, to, place) {
    place(win, to);
    const el = win.el;
    const g = S("g", { class: "mg-snap" }, ov);
    const bx = to.x === 0 ? to.x + to.w : to.x;
    const guide = S("line", { class: "mg-guide" }, g);
    guide.setAttribute("x1", bx); guide.setAttribute("y1", 0);
    guide.setAttribute("x2", bx); guide.setAttribute("y2", SH);
    const N = 36, teeth = [];
    for (let i = 0; i < N; i++) {
      const y = 30 + (i / (N - 1)) * (SH - 60);
      const left = i % 2 === 0;
      teeth.push({ y, left, p: S("path", { class: "mg-tooth" }, g), s: rnd(i, 71) });
    }
    const skin = S("rect", { fill: "url(#mg-mirror)" }, g);
    const sheen = S("rect", { fill: "url(#mg-sheen)" }, g);
    if (ctx && ctx.seam) { ctx.seam.style.opacity = "0"; }
    await tween(560, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e), w = lerp(from.w, to.w, e);
      el.style.left = x + "px";
      el.style.width = w + "px";
      // preview teeth bristle then lock into a solid seam line
      const env = Math.sin(Math.PI * clamp(t, 0, 1));
      const lock = seg(t, 0.7, 1);
      guide.style.opacity = String(0.25 + 0.65 * env + 0.35 * lock);
      teeth.forEach(({ y, left, p, s }) => {
        const h = (7 + s * 15) * env * (1 - lock * 0.55) + 3;
        const dir = left ? -1 : 1;
        p.setAttribute("d", `M${bx} ${y - 9} L${bx + dir * h} ${y} L${bx} ${y + 9} Z`);
        p.style.opacity = String(0.35 + 0.6 * env);
      });
      // liquid trailing edge + sheen sweep as it re-solidifies
      skin.setAttribute("x", x); skin.setAttribute("y", to.y);
      skin.setAttribute("width", Math.max(1, w)); skin.setAttribute("height", to.h);
      skin.style.opacity = String(0.5 * (1 - lock) * env + 0.12 * lock);
      const sx = lerp(x - 120, x + w + 120, seg(t, 0.25, 0.9));
      sheen.setAttribute("x", sx - 60); sheen.setAttribute("y", to.y);
      sheen.setAttribute("width", 120); sheen.setAttribute("height", to.h);
      sheen.style.opacity = String(0.4 * Math.sin(Math.PI * seg(t, 0.25, 0.9)));
    });
    place(win, to);
    el.style.left = el.style.width = "";
    g.remove();
  }

  // ---- FOCUS: border bristles, then calms to a liquid-metal sheen ----
  function onFocus(win) {
    if (!ov || !win.rect) return;
    const r = { ...win.rect };
    const g = S("g", { class: "mg-focus" }, ov);
    const spikes = [];
    const per = (x1, y1, x2, y2, n, nx, ny) => {
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n;
        spikes.push({ x: lerp(x1, x2, f), y: lerp(y1, y2, f), nx, ny, s: rnd(i + n * 3, 83), p: S("path", { fill: "url(#mg-spike)" }, g) });
      }
    };
    const nT = Math.max(8, Math.round(r.w / 64));
    per(r.x + 10, r.y, r.x + r.w - 10, r.y, nT, 0, -1);
    per(r.x + 10, r.y + r.h, r.x + r.w - 10, r.y + r.h, nT, 0, 1);
    per(r.x, r.y + 10, r.x, r.y + r.h - 10, 8, -1, 0);
    per(r.x + r.w, r.y + 10, r.x + r.w, r.y + r.h - 10, 8, 1, 0);
    tween(260, (t) => {
      const env = t < 0.45 ? eOut(t / 0.45) : 1 - eOut((t - 0.45) / 0.55);
      spikes.forEach(({ x, y, nx, ny, s, p }) => {
        const h = env * (5 + s * 11);
        const w = 9 + s * 5;
        const tx = x + nx * h, ty = y + ny * h;
        const px = -ny, py = nx;
        p.setAttribute("d", `M${x - px * w / 2} ${y - py * w / 2} Q${x} ${y} L${tx} ${ty} L${x} ${y} Q${x} ${y} ${x + px * w / 2} ${y + py * w / 2} Z`);
        p.style.opacity = String(h > 0.7 ? 0.9 * (1 - t * 0.4) : 0);
      });
    }).then(() => g.remove());
  }

  // ---- SEAM: interlocking fluid zipper, calm at rest, bristling on change ----
  let seamAmp = 4, seamTween = null;
  function seamTeeth(svg, amp) {
    let dl = "", dr = "";
    const n = 34;
    for (let i = 0; i < n; i++) {
      const y = 26 + (i / (n - 1)) * (SH - 52);
      const wob = Math.sin(i * 1.3) * 1.5;
      const h = amp + (i % 2) * amp * 0.35;
      if (i % 2 === 0) { dl += `M0 ${y - 10} L${GAP / 2 - 2 + h * 0.4 + wob} ${y} L0 ${y + 10} Z `; }
      else { dr += `M${GAP} ${y - 10} L${GAP / 2 + 2 - h * 0.4 + wob} ${y} L${GAP} ${y + 10} Z `; }
    }
    return { dl, dr };
  }
  function paintSeam(seam) {
    const l = seam.querySelector(".mg-zl"), r2 = seam.querySelector(".mg-zr");
    if (!l) return;
    const { dl, dr } = seamTeeth(0, seamAmp);
    l.setAttribute("d", dl); r2.setAttribute("d", dr);
  }
  function seamHook(s) {
    const el = s.seam;
    if (!el.querySelector(".mg-seam")) {
      el.innerHTML = `<svg class="mg-seam" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">` +
        `<line class="mg-seamline" x1="${GAP / 2}" y1="10" x2="${GAP / 2}" y2="${SH - 10}"/>` +
        `<path class="mg-zl"/><path class="mg-zr"/></svg>`;
    }
    Object.assign(el.style, { display: "block", width: GAP + "px", transition: "none", opacity: "1" });
    el.classList.toggle("mg-hot", !!s.changing);
    if (!s.visible) { el.style.opacity = "0"; return; }
    const target = s.changing ? 13 : 4;
    if (seamTween) { seamTween.dead = true; }
    const tw = seamTween = { dead: false };
    const from = seamAmp;
    tween(s.changing ? 420 : 500, (t) => {
      if (tw.dead) return;
      seamAmp = lerp(from, target, eInOut(t));
      paintSeam(el);
      el.querySelector(".mg-seam").style.opacity = String(s.changing ? 0.6 + 0.4 * Math.sin(Math.PI * t) : 0.55);
    });
    paintSeam(el);
  }

  // ---- HUD: droplet rises from bottom-left, splits into geometric shards ----
  function shardHTML(data) {
    const tray = data.tray.slice(0, 5).map((t, i) =>
      `<div class="mg-row"><span class="mg-dot d${i}"></span><span>${esc(t)}</span></div>`).join("");
    const notes = data.notes.slice(0, 3).map((n) => {
      const at = n.indexOf(":");
      const a = at > 0 ? n.slice(0, at) : "Note", b = at > 0 ? n.slice(at + 1).trim() : n;
      return `<div class="mg-note"><b>${esc(a)}</b><span>${esc(b)}</span></div>`;
    }).join("");
    return `<div class="mg-shard mg-s-clock"><div class="mg-k">LOCAL TIME</div>` +
      `<div class="mg-bigtime">${esc(data.time)}</div><div class="mg-bigdate">${esc(data.date)}</div></div>` +
      `<div class="mg-shard mg-s-tray"><div class="mg-k">FIELD · TRAY</div>${tray}</div>` +
      `<div class="mg-shard mg-s-notes"><div class="mg-k">SIGNALS</div>${notes}</div>` +
      `<div class="mg-shard mg-s-search"><span class="mg-caret">▸</span><span class="mg-q">Search the field…</span>` +
      `<span class="mg-freq"><i></i><i></i><i></i><i></i><i></i></span></div>`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    hudEl.innerHTML = `<div class="mg-hud"><svg class="mg-hdrop" viewBox="0 0 ${SW} ${SH}">` +
      `<g filter="url(#mg-goo)"><circle class="mg-hd1" cx="190" cy="${SH - 150}" r="60" fill="#0b0e15"/>` +
      `<circle class="mg-hd2" cx="190" cy="${SH - 150}" r="40" fill="#0b0e15"/></g>` +
      `<circle class="mg-hglint" cx="170" cy="${SH - 175}" r="9" fill="#dfe9f7"/></svg>` +
      `<div class="mg-shards">${shardHTML(data)}</div></div>`;
    const drop = hudEl.querySelector(".mg-hdrop");
    const d1 = hudEl.querySelector(".mg-hd1"), d2 = hudEl.querySelector(".mg-hd2");
    const glint = hudEl.querySelector(".mg-hglint");
    const shards = [...hudEl.querySelectorAll(".mg-shard")];
    const OX = 190, OY = SH - 150;
    const ends = [
      { x: 120, y: SH - 420 }, { x: 470, y: SH - 470 },
      { x: 120, y: SH - 700 }, { x: 120, y: SH - 190 },
    ];
    await tween(560, (t) => {
      if (gen !== hudGen) return;
      // droplet swells out of the corner, then thins as shards break off
      const grow = eOut(seg(t, 0, 0.42));
      const split = eInOut(seg(t, 0.38, 1));
      const r1 = lerp(14, 150, grow) * (1 - 0.55 * split);
      d1.setAttribute("r", r1);
      d1.setAttribute("cy", OY - 60 * grow + 30 * split);
      d1.style.opacity = String(1 - seg(t, 0.75, 1));
      d2.setAttribute("r", Math.max(0.1, r1 * 0.55 * (1 - split * 0.7)));
      d2.setAttribute("cx", OX + 60 * split);
      d2.setAttribute("cy", OY - 110 * grow);
      d2.style.opacity = String(1 - seg(t, 0.6, 1));
      glint.setAttribute("r", lerp(3, 11, grow) * (1 - split));
      glint.style.opacity = String((0.9 * grow) * (1 - split));
      drop.style.opacity = String(1 - seg(t, 0.8, 1));
      shards.forEach((sh, i) => {
        const st = eOut(seg(t, 0.38 + i * 0.09, 0.92));
        const sx = lerp(OX, ends[i].x, st), sy = lerp(OY, ends[i].y, st);
        sh.style.opacity = String(st);
        sh.style.transform = `translate(${sx - ends[i].x}px, ${sy - ends[i].y}px) scale(${0.7 + 0.3 * st})`;
        sh.style.filter = `brightness(${0.6 + 0.4 * st})`;
      });
    });
    if (gen === hudGen) {
      drop.remove();
      shards.forEach((sh) => { sh.style.opacity = sh.style.transform = sh.style.filter = ""; });
    }
  }
  async function hudHide(hudEl) {
    const gen = ++hudGen;
    const shards = [...hudEl.querySelectorAll(".mg-shard")];
    const wrap = hudEl.querySelector(".mg-hud");
    if (!wrap || !shards.length) { hudEl.innerHTML = ""; return; }
    let drop = hudEl.querySelector(".mg-hdrop");
    if (!drop) {
      hudEl.querySelector(".mg-shards").insertAdjacentHTML("beforebegin",
        `<svg class="mg-hdrop" viewBox="0 0 ${SW} ${SH}"><circle class="mg-hd1" cx="190" cy="${SH - 150}" r="10" fill="#0b0e15"/></svg>`);
      drop = hudEl.querySelector(".mg-hdrop");
    }
    const d1 = hudEl.querySelector(".mg-hd1");
    await tween(340, (t) => {
      if (gen !== hudGen) return;
      const m = eInOut(t);
      shards.forEach((sh, i) => {
        const dl = i * 0.04;
        const p = seg(t, dl, 1);
        sh.style.opacity = String(1 - p);
        sh.style.transform = `translateY(${m * 46}px) scale(${1 - 0.3 * p}, ${1 - 0.55 * p})`;
        sh.style.filter = `blur(${(m * 3).toFixed(1)}px) brightness(${1 - 0.4 * m})`;
      });
      if (d1) {
        d1.setAttribute("r", 20 + m * 70);
        d1.style.opacity = String(0.7 * Math.sin(Math.PI * clamp(t * 1.2)));
      }
    });
    if (gen === hudGen) hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
