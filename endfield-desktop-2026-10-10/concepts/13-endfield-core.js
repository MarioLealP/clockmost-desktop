// 13 · Endfield core (general reset): same one-space camera + static topo floor as 12, but the
// GENERAL language is rebuilt - rule 15 exits fade/cut in place (no slide, no mosaic-out, no camera
// move on exit), tighter entries, 7-layer window chrome (X icon, dotted edges, microtext, accent),
// plus system overlays: location toast (T), reward reveal (R), app drawer (D). No per-app motion yet.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 14;
  const OFF = 8; // back-plate offset (down-right)
  const PERS = 1700;
  const COLS = 5;
  const ROWS = 7;
  // per-type accent (nod to rule 16, no custom motion yet): thin underbar + label per window kind
  const ACCENT = { firefox: "#FF7A1A", discord: "#00FFA2", kitty: "#9BE86E" };
  const ACCENT_NAME = { firefox: "BRW", discord: "COM", kitty: "TRM" };
  let ctx = null;
  let ov = null;
  let wp = null; // world print layer (in the camera's world)
  let dimEl = null; // flat dim under the world print
  let winCount = 0;
  let topoURL = "";
  let grainURL = "";
  let hudCrystal = null;
  let sysLayer = null; // system overlays: toast / reward / drawer (above world, below HUD)
  let toastState = null;
  let rewardOpen = false;
  let drawerOpen = false;
  const hudO = {};
  const seamO = {};
  const camO = {};
  const sysO = {};

  // ---- easing + tween engine (rAF clocked by performance.now(), timer fallback for headless) ----
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let lo = 0;
      let hi = 1;
      let u = t;
      for (let i = 0; i < 24; i++) {
        u = (lo + hi) / 2;
        if (sx(u) < t) lo = u;
        else hi = u;
      }
      return sy(u);
    };
  }
  const SNAP = bez(1, 0, 0.7, 1);
  const SETTLE = bez(0.16, 1, 0.3, 1);
  const SOFT = bez(0.4, 0, 0.2, 1); // slow fades for small elements
  const LIN = (t) => t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const P = (e, start, dur, ease = LIN) => ease(clamp((e - start) / dur));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const f4 = (v) => (Math.abs(v) < 1e-5 ? 0 : +v.toFixed(4));

  function tick(f) {
    let done = false;
    const g = () => {
      if (done) return;
      done = true;
      f();
    };
    requestAnimationFrame(g);
    setTimeout(g, 24);
  }
  // ?slow=N stretches every tween N x (review aid for headless mid-motion captures)
  const SLOW = Math.max(1, +new URLSearchParams(location.search).get("slow") || 1);
  // fn(elapsedMs) runs once synchronously at 0, then every frame until ms; alive() lets a newer tween take over
  function tween(ms, fn, alive) {
    return new Promise((res) => {
      const t0 = performance.now();
      fn(0);
      const step = () => {
        if (alive && !alive()) return res(false);
        const e = Math.min(ms, (performance.now() - t0) / SLOW);
        fn(e);
        if (e < ms) tick(step);
        else res(true);
      };
      tick(step);
    });
  }
  function claim(o, k) {
    o[k] = (o[k] || 0) + 1;
    const v = o[k];
    return () => o[k] === v;
  }
  function D(cls, parent, html) {
    const e = document.createElement("div");
    e.className = cls;
    if (html) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  const INK = [240, 240, 242];
  const INK3 = [108, 111, 118];
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;
  const clear = (els, props) => els.forEach((el) => el && props.forEach((p) => (el.style[p] = "")));

  // ---- noise ----
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function noise2(seed) {
    const h = (x, y) => {
      const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const sm = (t) => t * t * (3 - 2 * t);
    const n = (x, y) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = sm(x - ix);
      const fy = sm(y - iy);
      const a = h(ix, iy);
      const b = h(ix + 1, iy);
      const c = h(ix, iy + 1);
      const d = h(ix + 1, iy + 1);
      return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    };
    return (x, y, oct = 4) => {
      let v = 0;
      let amp = 0.5;
      let f = 1;
      for (let i = 0; i < oct; i++) {
        v += amp * n(x * f + i * 17.3, y * f - i * 9.1);
        f *= 2.03;
        amp *= 0.5;
      }
      return v;
    };
  }
  const MS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]], [[3, 0]], [[0, 2]], [[3, 2], [0, 1]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];
  // marching squares over a sampled field; cb(x1,y1,x2,y2,level,gx,gy)
  function contours(w, h, cell, field, step, cb) {
    const gw = Math.ceil(w / cell) + 1;
    const gh = Math.ceil(h / cell) + 1;
    const v = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) v[j * gw + i] = field(i * cell, j * cell);
    const pt = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let j = 0; j < gh - 1; j++)
      for (let i = 0; i < gw - 1; i++) {
        const a = v[j * gw + i];
        const b = v[j * gw + i + 1];
        const c = v[(j + 1) * gw + i + 1];
        const d = v[(j + 1) * gw + i];
        const lo = Math.min(a, b, c, d);
        const hi = Math.max(a, b, c, d);
        const x0 = i * cell;
        const y0 = j * cell;
        const gx = (b - a + c - d) / 2;
        const gy = (d - a + c - b) / 2;
        for (let k = Math.ceil(lo / step); k * step <= hi; k++) {
          const L = k * step;
          const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
          const segs = MS[idx];
          if (!segs.length) continue;
          pt[0] = x0 + (cell * (L - a)) / (b - a || 1e-9);
          pt[1] = y0;
          pt[2] = x0 + cell;
          pt[3] = y0 + (cell * (L - b)) / (c - b || 1e-9);
          pt[4] = x0 + (cell * (L - d)) / (c - d || 1e-9);
          pt[5] = y0 + cell;
          pt[6] = x0;
          pt[7] = y0 + (cell * (L - a)) / (d - a || 1e-9);
          for (const [e1, e2] of segs) cb(pt[e1 * 2], pt[e1 * 2 + 1], pt[e2 * 2], pt[e2 * 2 + 1], k, gx, gy);
        }
      }
  }
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // ---- rule 8: the black floor with reflective contour lines (rendered once) ----
  function floorCanvas() {
    const c = canvas(SW, SH);
    const g = c.getContext("2d");
    g.fillStyle = "#060607";
    g.fillRect(0, 0, SW, SH);
    let gr = g.createRadialGradient(1260, 300, 40, 1260, 300, 1250);
    gr.addColorStop(0, "rgba(46,47,51,0.55)");
    gr.addColorStop(0.45, "rgba(24,25,27,0.4)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, SW, SH);
    const N = noise2(7);
    const field = (sx, sy) => {
      const d = 1500 / (sy + 760); // mild floor perspective: far = top
      const wx = (sx - 960) * d;
      const wy = 1500 * d * 1.25;
      let f = N(wx / 820 + 3.1, wy / 560, 4);
      f += 0.32 * Math.exp(-(((wx + 120) / 380) ** 2) - ((wy - 1650) / 260) ** 2);
      f += 0.22 * Math.exp(-(((wx - 760) / 300) ** 2) - ((wy - 2550) / 300) ** 2);
      return f;
    };
    const B = 14;
    const glow = Array.from({ length: B }, () => new Path2D());
    const Lx = 0.55;
    const Ly = -0.83;
    contours(SW, SH, 4, field, 0.034, (x1, y1, x2, y2, k, gx, gy) => {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const gl = Math.hypot(gx, gy) || 1;
      const orient = Math.abs((gx / gl) * Lx + (gy / gl) * Ly);
      const pool = Math.exp(-(((mx - 1260) / 880) ** 2) - ((my - 320) / 560) ** 2);
      const depth = 0.45 + 0.55 * (my / SH);
      const a = clamp((0.05 + 0.62 * pool * (0.25 + 0.75 * orient * orient) + 0.06 * orient) * depth);
      const b = Math.min(B - 1, Math.floor(a * B));
      glow[b].moveTo(x1, y1);
      glow[b].lineTo(x2, y2);
    });
    g.lineCap = "round";
    g.filter = "blur(3px)";
    g.lineWidth = 4;
    glow.forEach((p, i) => {
      g.strokeStyle = `rgba(225,228,236,${((i + 0.5) / B) * 0.35})`;
      g.stroke(p);
    });
    g.filter = "none";
    g.lineWidth = 1.15;
    glow.forEach((p, i) => {
      g.strokeStyle = `rgba(236,238,244,${((i + 0.5) / B) * 0.95})`;
      g.stroke(p);
    });
    // specular glints where the light pool catches a peak
    [
      [1180, 260, 120, 26, 0.32],
      [690, 610, 70, 15, 0.16],
    ].forEach(([x, y, rx, ry, a]) => {
      g.save();
      g.translate(x, y);
      g.scale(1, ry / rx);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      r.addColorStop(0, `rgba(240,242,248,${a})`);
      r.addColorStop(1, "rgba(240,242,248,0)");
      g.fillStyle = r;
      g.fillRect(-rx, -rx, rx * 2, rx * 2);
      g.restore();
    });
    gr = g.createRadialGradient(960, 540, 420, 960, 540, 1180);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(1, "rgba(0,0,0,0.6)");
    g.fillStyle = gr;
    g.fillRect(0, 0, SW, SH);
    return c;
  }
  // faint topographic texture for the yellow active blocks (data URL, CSS var --topo)
  function topoTexture(color = "rgba(90,84,0,0.3)", seed = 23, w = 260, h = 180) {
    const c = canvas(w, h);
    const g = c.getContext("2d");
    const N = noise2(seed);
    const p = new Path2D();
    const k = w / 260;
    contours(w, h, 3, (x, y) => N(x / (120 * k), y / (90 * k), 3) + 0.25 * Math.exp(-(((x - w * 0.58) / (60 * k)) ** 2) - ((y - h / 2) / (50 * k)) ** 2), 0.045, (x1, y1, x2, y2) => {
      p.moveTo(x1, y1);
      p.lineTo(x2, y2);
    });
    g.strokeStyle = color;
    g.lineWidth = 1.1;
    g.stroke(p);
    return c.toDataURL();
  }
  function grainTexture(a) {
    const c = canvas(220, 220);
    const g = c.getContext("2d");
    const d = g.createImageData(220, 220);
    const r = rng(99);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = r() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = a;
    }
    g.putImageData(d, 0, 0);
    return c.toDataURL();
  }

  // ---- rule 5: faceted amber crystals with glowing glyphs, heavy grain (rendered once) ----
  const GLYPHS = [
    [[0, 0, 0.72, 0.17], [0, 0, 0.18, 1], [0, 0.83, 1, 0.17], [0.52, 0.42, 0.48, 0.17], [0.82, 0.42, 0.18, 0.58]],
    [[0.2, 0, 0.6, 0.15], [0, 0.15, 0.2, 0.3], [0.8, 0.15, 0.2, 0.3], [0.22, 0.44, 0.56, 0.13], [0, 0.57, 0.2, 0.3], [0.8, 0.57, 0.2, 0.3], [0.2, 0.86, 0.6, 0.14]],
    [[0, 0, 1, 0.16], [0.42, 0.16, 0.16, 0.48], [0, 0.64, 0.46, 0.16], [0.54, 0.64, 0.46, 0.16], [0.12, 0.8, 0.16, 0.2], [0.72, 0.8, 0.16, 0.2]],
    [[0, 0.1, 0.16, 0.8], [0.16, 0, 0.5, 0.16], [0.5, 0.16, 0.16, 0.34], [0.16, 0.5, 0.84, 0.16], [0.84, 0.66, 0.16, 0.34]],
  ];
  function rot3(v, ax, ay, az) {
    let [x, y, z] = v;
    let c = Math.cos(ax);
    let s = Math.sin(ax);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ay);
    s = Math.sin(ay);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(az);
    s = Math.sin(az);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  }
  function drawCrystal(g, cx, cy, r, seed, glyph, dim = 1) {
    const R = rng(seed);
    const n = 10 + Math.floor(R() * 4);
    const step = (Math.PI * 2) / n;
    const ring = (y, rad, off) => Array.from({ length: n }, (_, i) => {
      const a = i * step + off + (R() - 0.5) * 0.18;
      const rr = rad * (0.86 + R() * 0.28);
      return [Math.cos(a) * rr, y + (R() - 0.5) * 0.08, Math.sin(a) * rr];
    });
    const top = [(R() - 0.5) * 0.2, -1.2, (R() - 0.5) * 0.2];
    const bot = [(R() - 0.5) * 0.2, 1.1, (R() - 0.5) * 0.2];
    const r1 = ring(-0.62, 0.62, 0);
    const r2 = ring(-0.08, 1, step / 2);
    const r3 = ring(0.5, 0.84, 0);
    const r4 = ring(0.84, 0.42, step / 2);
    const faces = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      faces.push([top, r1[i], r1[j]]);
      faces.push([r1[i], r1[j], r2[i]], [r2[i], r2[j], r1[j]]);
      faces.push([r2[i], r2[j], r3[j]], [r3[i], r3[j], r2[i]]);
      faces.push([r3[i], r3[j], r4[i]], [r4[i], r4[j], r3[j]]);
      faces.push([r4[i], r4[j], bot]);
    }
    const ax = 0.35 + R() * 0.5;
    const ay = R() * 6.28;
    const az = (R() - 0.5) * 0.9;
    const T = new Map();
    const tv = (v) => {
      if (!T.has(v)) T.set(v, rot3(v, ax, ay, az));
      return T.get(v);
    };
    const proj = (v) => {
      const k = 4 / (4 + v[2]);
      return [cx + v[0] * r * k, cy + v[1] * r * k];
    };
    const L = (() => {
      const l = [-0.45, -0.75, -0.5];
      const m = Math.hypot(...l);
      return l.map((x) => x / m);
    })();
    const fs = faces.map((f) => {
      const [a, b, c] = f.map(tv);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const cen = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      if (nn[0] * cen[0] + nn[1] * cen[1] + nn[2] * cen[2] < 0) nn = nn.map((x) => -x);
      const m = Math.hypot(...nn) || 1;
      nn = nn.map((x) => x / m);
      return { pts: [a, b, c].map(proj), z: cen[2], nn };
    });
    fs.sort((p, q) => q.z - p.z);
    const poly = (pts) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
    };
    // ambient amber pool under / around it
    const am = g.createRadialGradient(cx, cy + r * 0.2, r * 0.1, cx, cy + r * 0.2, r * 1.9);
    am.addColorStop(0, `rgba(255,170,30,${0.22 * dim})`);
    am.addColorStop(1, "rgba(255,170,30,0)");
    g.fillStyle = am;
    g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    // back faces: the amber interior seen through the stone
    for (const f of fs)
      if (f.nn[2] > 0) {
        const d = clamp(-(f.nn[0] * L[0] + f.nn[1] * L[1] + f.nn[2] * L[2]) * 0.5 + 0.5);
        poly(f.pts);
        g.fillStyle = `hsla(${36 + d * 8},95%,${(10 + d * 22) * dim}%,0.95)`;
        g.fill();
      }
    // inner glow + glyph
    const ig = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.95);
    ig.addColorStop(0, `rgba(255,214,60,${0.55 * dim})`);
    ig.addColorStop(1, "rgba(255,170,20,0)");
    g.fillStyle = ig;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
    const glyphDraw = (alpha, blur) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(az * 0.6);
      g.transform(1, 0, Math.sin(ay) * 0.25, 1, 0, 0);
      const gs = r * 0.74;
      g.translate(-gs / 2, -gs / 2);
      g.shadowColor = "rgba(255,236,60,1)";
      g.shadowBlur = blur;
      g.fillStyle = `rgba(255,${246 + 9 * dim},${120 + 80 * dim},${alpha})`;
      for (const [x, y, w, h] of GLYPHS[glyph % GLYPHS.length]) g.fillRect(x * gs, y * gs, w * gs, h * gs);
      g.restore();
    };
    glyphDraw(0.9 * dim + 0.1, r * 0.35);
    // front faces: translucent amber, lambert + specular, faint ridge edges
    for (const f of fs)
      if (f.nn[2] <= 0) {
        const d = clamp(-(f.nn[0] * L[0] + f.nn[1] * L[1] + f.nn[2] * L[2]));
        const sp = Math.pow(d, 7);
        poly(f.pts);
        g.fillStyle = `hsla(${38 + d * 12},${96 - sp * 30}%,${(8 + d * 58 + sp * 30) * dim}%,${0.4 + d * 0.25 + sp * 0.3})`;
        g.fill();
        g.strokeStyle = `hsla(50,100%,${(60 + d * 30) * dim}%,${0.05 + sp * 0.5})`;
        g.lineWidth = 0.8;
        g.stroke();
      }
    // the glyph glows through the front facets
    g.globalCompositeOperation = "lighter";
    glyphDraw(0.45 * dim, r * 0.5);
    g.globalCompositeOperation = "source-over";
  }
  function crystalCanvas(w, h, items, grain = 44) {
    const c = canvas(w, h);
    const g = c.getContext("2d");
    for (const it of items) drawCrystal(g, it[0], it[1], it[2], it[3], it[4], it[5] ?? 1);
    // heavy film grain, baked in once
    const d = g.getImageData(0, 0, w, h);
    const R = rng(5);
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3] < 4) continue;
      const n = (R() - 0.5) * grain * 2;
      d.data[i] = clamp(d.data[i] + n, 0, 255);
      d.data[i + 1] = clamp(d.data[i + 1] + n, 0, 255);
      d.data[i + 2] = clamp(d.data[i + 2] + n * 0.7, 0, 255);
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  // ---- rule 2: the camera. One world transform on #wins, #seam, the overlay and the world print ----
  const C = { fx: 960, fy: 540, rx: 0, ry: 0, s: 1, ty: 0, bs: 0, brx: 0, bry: 0, px: 960, py: 540 };
  function frame(o = {}) {
    const st = ctx ? ctx.state : null;
    const hud = o.hud ?? (st ? st.hud : false);
    const full = o.full ?? !!(st && st.full);
    if (hud) return { fx: 760, fy: 620, rx: 1.4, ry: -2.2, s: 0.955, ty: -4 };
    if (full) return { fx: 960, fy: 540, rx: 0, ry: 0, s: 1, ty: 0 };
    const f = o.win || (st && st.focused);
    const n = st ? st.list.length : 0;
    if (!f || !f.rect) return { fx: 960, fy: 540, rx: 0.3, ry: 0, s: 0.935, ty: -8 };
    const r = f.rect;
    const fx = r.x + r.w / 2;
    return { fx, fy: 540, rx: 0.3, ry: n === 2 ? (fx < 960 ? 1 : -1) * 1.1 : 0, s: 0.935, ty: -8 };
  }
  function world() {
    let t = `translate(960px,${f4(540 + C.ty)}px) scale(${f4(C.s + C.bs)}) translate(-960px,-540px) translate(${f4(C.fx)}px,${f4(C.fy)}px) rotateX(${f4(C.rx)}deg) rotateY(${f4(C.ry)}deg) translate(${f4(-C.fx)}px,${f4(-C.fy)}px)`;
    if (Math.abs(C.brx) > 1e-4 || Math.abs(C.bry) > 1e-4)
      t += ` translate(${f4(C.px)}px,${f4(C.py)}px) rotateX(${f4(C.brx)}deg) rotateY(${f4(C.bry)}deg) translate(${f4(-C.px)}px,${f4(-C.py)}px)`;
    return t;
  }
  function apply() {
    if (!ctx) return;
    const t = world();
    ctx.wins.style.transform = t;
    ov.style.transform = t;
    const sl = parseFloat(ctx.seam.style.left) || 0;
    ctx.seam.style.transformOrigin = `${-sl}px 0`;
    ctx.seam.style.transform = t;
    // world print floats a little in front of the windows: parallax under rotation
    const z = 70;
    wp.style.transform = `${t} translate(960px,540px) translateZ(${z}px) scale(${f4((PERS - z) / PERS)}) translate(-960px,-540px)`;
  }
  function cam(to, o = {}) {
    if (!ctx) return Promise.resolve();
    const alive = claim(camO, "k");
    const dur = o.dur ?? 1050;
    const from = { ...C };
    const piv = o.pivot || { x: to.fx, y: to.fy };
    return tween(
      dur,
      (e) => {
        const p = P(e, 0, dur, SETTLE);
        const b = Math.sin(Math.PI * P(e, 0, dur, SETTLE));
        for (const k of ["fx", "fy", "rx", "ry", "s", "ty"]) C[k] = lerp(from[k], to[k], p);
        C.bs = lerp(from.bs, 0, p) + (o.bs ?? -0.012) * b;
        C.brx = lerp(from.brx, 0, p) + (o.brx ?? 0) * b;
        C.bry = lerp(from.bry, 0, p) + (o.bry ?? 0) * b;
        C.px = lerp(from.px, piv.x, P(e, 0, 200, SETTLE));
        C.py = lerp(from.py, piv.y, P(e, 0, 200, SETTLE));
        apply();
      },
      alive,
    );
  }
  const center = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

  // ---- window structure (13: 7 layers): back-plate · edge · face · dot-edge · title-micro
  // · rail+diamond+brackets · X close + accent underbar ----
  // rule 18: the close X is four thick square-cut arms that do NOT meet (empty centre).
  const X_SVG = `<svg viewBox="0 0 20 20" width="14" height="14"><g stroke="currentColor" stroke-width="3.4" stroke-linecap="butt"><path d="M3.5 3.5 L8.2 8.2"/><path d="M11.8 11.8 L16.5 16.5"/><path d="M16.5 3.5 L11.8 8.2"/><path d="M8.2 11.8 L3.5 16.5"/></g></svg>`;
  function build(el) {
    if (el._ef) return el._ef;
    const tb = el.querySelector(".titlebar");
    const ct = el.querySelector(".content");
    const title = tb.querySelector(".title");
    const kind = [...el.classList].find((c) => ACCENT[c]) || "kitty";
    const back = D("ef-back");
    const surf = D("ef-surf");
    D("ef-edge", surf);
    const face = D("ef-face", surf);
    face.append(tb, ct);
    D("ef-dots", surf); // rule 20: soft dotted gradient finishing the bottom edge
    const rail = D("ef-frail", surf);
    const brk = [D("ef-brk tl", surf), D("ef-brk br", surf)];
    const accent = D("ef-accent", surf);
    accent.style.background = ACCENT[kind];
    el.prepend(back, surf);
    const dia = document.createElement("span");
    dia.className = "ef-dia";
    dia.innerHTML = "<i></i>";
    tb.insertBefore(dia, title);
    const tele = document.createElement("span");
    tele.className = "ef-tele";
    tb.appendChild(tele);
    // rule 6 micro-layer: barcode + tiny code between telemetry and close
    const mic = document.createElement("span");
    mic.className = "ef-mic";
    mic.innerHTML = `<i class="bc"></i><em>CM·${ACCENT_NAME[kind]}·${String(winCount + 1).padStart(2, "0")}</em>`;
    tb.appendChild(mic);
    const x = document.createElement("span");
    x.className = "ef-x";
    x.innerHTML = X_SVG;
    x.title = "Close (mock)";
    tb.appendChild(x);
    const n = ++winCount;
    el._ef = { back, surf, face, tb, ct, title, dia, fill: dia.firstChild, tele, rail, brk, n, mic, x, accent, kind };
    return el._ef;
  }
  function tele(win, w, h) {
    const f = build(win.el);
    const r = win.rect || { w: 0, h: 0 };
    f.tele.innerHTML = `WIN-${String(f.n).padStart(2, "0")} <s></s> ${Math.round(w ?? r.w)}×${Math.round(h ?? r.h)} <s></s> WS-02 <b>▸▸▸</b>`;
  }

  // ---- wallpaper: static floor + grain + corner crystals + small print (outside the camera) ----
  function micro(lines) {
    return lines.map(esc).join("<br>");
  }
  function wallpaper(wallEl) {
    const screen = wallEl.parentNode;
    topoURL = topoTexture();
    grainURL = grainTexture(255);
    screen.style.setProperty("--topo", `url(${topoURL})`);
    screen.style.setProperty("--grain", `url(${grainURL})`);
    screen.style.setProperty("--topoL", `url(${topoTexture("rgba(232,234,240,0.34)", 41, 1340, 320)})`);
    screen.style.perspective = `${PERS}px`;
    ov = D("ef-ov");
    dimEl = D("e2-dim");
    wp = D("e2-wp");
    const hudEl = screen.querySelector("#hud");
    screen.insertBefore(ov, hudEl);
    screen.insertBefore(dimEl, hudEl);
    screen.insertBefore(wp, hudEl);
    sysLayer = D("e13-sys");
    screen.insertBefore(sysLayer, hudEl);
    const fl = floorCanvas();
    fl.className = "e2-floor";
    const cr1 = crystalCanvas(560, 300, [
      [150, 170, 70, 11, 1, 0.9],
      [300, 205, 52, 4, 0, 0.8],
      [70, 250, 40, 8, 2, 0.6],
    ]);
    cr1.className = "e2-wcr bl";
    const cr2 = crystalCanvas(360, 220, [
      [230, 90, 48, 31, 3, 0.75],
      [110, 150, 34, 17, 1, 0.55],
    ]);
    cr2.className = "e2-wcr tr";
    wallEl.append(fl);
    D("e2-wgrain", wallEl);
    wallEl.append(cr1, cr2);
    D(
      "e2-wprint",
      wallEl,
      `<div class="wm">CLOCKMOST</div><div class="rl"></div><div class="lb t">SIDE DISPLAY <s></s> 1920×1080 <s></s> EF-13 / CORE</div>
      <div class="bc"></div><div class="hb"></div><div class="lb b">NODE CLOCKMOST.COM <s></s> TANG OK <s></s> VAULT OK <s></s> SEC.62</div>
      <div class="rr"></div><div class="lb r">▸▸▸ SNAP 1,0,.7,1 <s></s> SETTLE .16,1,.3,1</div><div class="bc r"></div>`,
    );
    // structure windows the moment the harness creates them (before first paint)
    new MutationObserver((ms) => {
      for (const m of ms)
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement) || !n.classList.contains("win") || n.dataset.ghost) continue;
          build(n);
          if (ctx) n.dataset.efNew = "1";
        }
    }).observe(screen.querySelector("#wins"), { childList: true });
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach((w) => tele(w));
    ["wins", "seam"].forEach((k) => (c[k].style.transformOrigin = "0 0"));
    ov.style.transformOrigin = wp.style.transformOrigin = "0 0";
    Object.assign(C, frame());
    apply();
    // system demo hint (mockup area): T toast · R reward · D drawer
    if (sysLayer && !sysLayer.querySelector(".e13-hint")) {
      const h = D("e13-hint", sysLayer, `<span>T <b>TOAST</b></span><span>R <b>REWARD</b></span><span>D <b>DRAWER</b></span><em>EF-13 CORE · EXITS FADE IN PLACE</em>`);
      h.style.opacity = "1";
    }
    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "t") showToast();
      else if (k === "r") toggleReward();
      else if (k === "d") toggleDrawer();
    });
  }

  // ---- OPEN (13, rules 3+4): tighter than 12 - stack appears at once ~36px low, fades + slides
  // home in ~620ms; smalls (rail, tele, micro, X, brackets) fade slowly after ----
  async function onOpen(win) {
    const el = win.el;
    const f = build(el);
    tele(win);
    const alive = claim(f, "gk");
    claim(f, "fq");
    const c = center(win.rect);
    cam(frame({ win }), { pivot: c, bry: (c.x < 960 ? 1 : -1) * 1.6, bs: -0.014, dur: 950 });
    const ok = await tween(
      980,
      (e) => {
        const p = P(e, 0, 620, SETTLE);
        el.style.opacity = lerp(0.14, 1, P(e, 0, 500, SETTLE));
        el.style.transform = `translateY(${(1 - p) * 36}px)`;
        const pb = P(e, 0, 700, SETTLE);
        f.back.style.transform = `translate(${(1 - pb) * -10}px, ${(1 - pb) * 16}px)`;
        const pc = P(e, 50, 620, SETTLE);
        f.ct.style.transform = `translateY(${(1 - pc) * 12}px)`;
        f.ct.style.opacity = lerp(0.25, 1, P(e, 50, 520));
        const s = P(e, 380, 600, SOFT);
        f.tele.style.opacity = s;
        f.mic.style.opacity = s;
        f.rail.style.opacity = s;
        f.fill.style.opacity = s;
        f.x.style.opacity = s;
        f.brk.forEach((b) => (b.style.opacity = s));
        f.title.style.opacity = lerp(0.2, 1, P(e, 260, 600, SOFT));
        f.title.style.color = mix(INK3, INK, P(e, 260, 520));
      },
      alive,
    );
    if (ok) clear([el, f.back, f.ct, f.tele, f.mic, f.rail, f.fill, f.x, f.title, ...f.brk], ["opacity", "transform", "color"]);
    delete el.dataset.efNew;
  }

  // ---- CLOSE (13, rule 15): exits never move - smalls fade first, whole window fades in place.
  // No slide, no scale, no camera move. ----
  async function onClose(win) {
    const el = win.el;
    const f = build(el);
    const alive = claim(f, "gk");
    claim(f, "fq");
    const seam = ctx && ctx.seam;
    if (seam) {
      claim(seamO, "k");
      const o0 = parseFloat(seam.style.opacity || "1");
      tween(140, (e) => (seam.style.opacity = o0 * (1 - P(e, 0, 140))));
    }
    await tween(
      260,
      (e) => {
        const s = 1 - P(e, 0, 110);
        f.tele.style.opacity = f.mic.style.opacity = f.rail.style.opacity = f.fill.style.opacity = f.x.style.opacity = s;
        f.brk.forEach((b) => (b.style.opacity = s));
        f.ct.style.opacity = 1 - P(e, 30, 140, SNAP);
        el.style.opacity = 1 - P(e, 60, 200, SNAP);
      },
      alive,
    );
    el.style.visibility = "hidden";
    clear([el, f.ct, f.tele, f.mic, f.rail, f.fill, f.x, ...f.brk], ["opacity", "transform"]);
  }

  // ---- SNAP / RATIO: plates move on a 40 ms stagger; the camera swings around the moving boundary ----
  async function onMove(win, from, to, place) {
    place(win, to);
    const f = build(win.el);
    const st = ctx && ctx.state;
    const opening = st && st.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    const alive = claim(f, "gk");
    if (ctx) {
      claim(seamO, "k");
      ctx.seam.style.opacity = "0";
    }
    measure(win, from, to);
    if (st && st.list.length === 2 && win === st.list[0] && !opening) {
      const bx = to.x + to.w + GAP / 2;
      const dir = to.w > from.w ? 1 : -1;
      Promise.resolve().then(() => cam(frame(), { pivot: { x: bx, y: 540 }, bry: dir * 2.2, brx: 0.6, bs: -0.016, dur: 1100 }));
    }
    const DUR = 470;
    const dl = [0, 40, 80, 120];
    const at = (i, e) => {
      const p = P(e, dl[i], DUR, SETTLE);
      return { x: lerp(from.x, to.x, p), w: lerp(from.w, to.w, p) };
    };
    const run = tween(
      DUR + dl[3],
      (e) => {
        const b = at(0, e);
        const s = at(1, e);
        const t = at(2, e);
        const c = at(3, e);
        Object.assign(f.back.style, { left: b.x - to.x + OFF + "px", width: b.w - OFF + "px", right: "auto" });
        Object.assign(f.surf.style, { left: s.x - to.x + "px", width: s.w - OFF + "px", right: "auto" });
        f.tb.style.width = t.w - OFF - 2 + "px";
        f.tb.style.transform = `translateX(${t.x - s.x}px)`;
        f.ct.style.width = c.w - OFF - 2 + "px";
        f.ct.style.transform = `translateX(${c.x - s.x}px)`;
        tele(win, s.w, to.h);
      },
      alive,
    ).then((ok) => {
      if (!ok) return;
      clear([f.back, f.surf], ["left", "width", "right"]);
      clear([f.tb, f.ct], ["width", "transform"]);
      tele(win);
    });
    if (opening) await Promise.race([run, sleep(270)]);
    else await run;
  }

  // the measuring rail along the top edge: travels with the boundary, readout + chevrons, then wipes away
  function measure(win, from, to) {
    if (!ctx || !ov) return;
    const st = ctx.state;
    if (st.list.length === 2 && win !== st.list[0]) return;
    const leftEdge = from.x !== to.x;
    const two = st.list.length === 2;
    const pad = two && !leftEdge ? GAP / 2 : 0;
    const b0 = (leftEdge ? from.x : from.x + from.w) + pad;
    const b1 = (leftEdge ? to.x : to.x + to.w) + pad;
    if (Math.abs(b1 - b0) < 2) return;
    const dir = b1 > b0 ? 1 : -1;
    const ratio = two ? `${st.ratio[0]} : ${st.ratio[1]}` : "FULL";
    const chev = dir > 0 ? "›››" : "‹‹‹";
    const m = D(
      "ef-meas",
      ov,
      `<div class="mt"></div><div class="ms"></div><div class="mk k0"></div><div class="mk k1"></div>
      <div class="ml${dir < 0 ? " rev" : ""}"><i>${chev}</i><b>${ratio}</b><em></em></div>`,
    );
    const [mt, ms, k0, k1, ml] = m.children;
    const em = ml.querySelector("em");
    tween(1240, (e) => {
      const p = P(e, 40, 470, SETTLE);
      const bx = lerp(b0, b1, p);
      const w = P(e, 820, 280, SNAP);
      const a = lerp(b0, b1, w);
      mt.style.opacity = P(e, 0, 120) * (1 - P(e, 900, 200)) * 0.9;
      ms.style.transform = `translateX(${Math.min(a, bx)}px) scaleX(${Math.abs(bx - a)})`;
      ms.style.opacity = 1 - P(e, 1080, 60);
      k0.style.transform = `translateX(${b0}px)`;
      k0.style.opacity = P(e, 0, 80) * (1 - P(e, 820, 140));
      k1.style.transform = `translateX(${bx}px)`;
      k1.style.opacity = P(e, 0, 80) * (1 - P(e, 1020, 160));
      const lo = P(e, 70, 120) * (1 - P(e, 780, 180));
      ml.style.opacity = lo;
      ml.style.transform = `translateX(${clamp(bx, 110, SW - 110)}px) translateX(-50%) translateY(${(1 - P(e, 70, 240, SETTLE)) * -10}px)`;
      em.textContent = `Δ${dir > 0 ? "+" : "−"}${Math.round(Math.abs(bx - b0))}`;
    }).then(() => m.remove());
  }

  // ---- FOCUS: the camera turns to the new focal window; rail / diamond / brackets follow, quiet ----
  function onFocus(win, prev) {
    if (prev && prev.el && prev.el._ef && prev.el.isConnected) focusOut(prev.el._ef);
    const f = build(win.el);
    if (win.el.dataset.efNew) return; // onOpen choreographs the newcomer
    if (ctx && !ctx.state.full && !ctx.state.hud && win.rect) {
      const c = center(win.rect);
      cam(frame({ win }), { pivot: c, bry: (c.x < 960 ? 1 : -1) * 1.8, bs: -0.016, dur: 1100 });
    }
    const alive = claim(f, "fq");
    tween(
      760,
      (e) => {
        f.rail.style.clipPath = `inset(0 0 ${(1 - P(e, 40, 300, SNAP)) * 100}% 0)`;
        f.fill.style.transform = `scale(${P(e, 80, 160, SNAP)})`;
        const s = P(e, 160, 600, SOFT);
        f.brk.forEach((b) => (b.style.opacity = s));
        if (f.mic) f.mic.style.opacity = s;
        if (f.x) f.x.style.opacity = s;
        f.title.style.color = mix(INK3, INK, P(e, 60, 300));
      },
      alive,
    ).then((ok) => ok && clear([f.rail, f.fill, f.title, f.mic, f.x, ...f.brk], ["clipPath", "transform", "color", "opacity"]));
  }
  function focusOut(f) {
    const alive = claim(f, "fq");
    tween(
      360,
      (e) => {
        f.rail.style.clipPath = `inset(0 0 ${P(e, 0, 200, SNAP) * 100}% 0)`;
        f.fill.style.transform = `scale(${1 - P(e, 0, 140, SNAP)})`;
        f.brk.forEach((b) => (b.style.opacity = 1 - P(e, 0, 300, SOFT)));
        f.title.style.color = mix(INK, INK3, P(e, 40, 260));
      },
      alive,
    ).then((ok) => ok && clear([f.rail, f.fill, f.title, ...f.brk], ["clipPath", "transform", "color", "opacity"]));
  }

  // ---- FULLSCREEN (rule 1): a 5 x 7 tile mosaic; tiles cut over to the new content in random order ----
  function tileRect(i) {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const w = SW / COLS;
    const h = SH / ROWS;
    return { x: c * w, y: r * h, w, h };
  }
  function shuffle(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // q in [0,1]: how much of tile i is cut over; dir picks the cut's slide direction
  function tilePart(i, q, dir) {
    const t = tileRect(i);
    const b = 0.6;
    if (q <= 0) return "";
    let { x, y, w, h } = t;
    if (dir === 0) w *= q;
    else if (dir === 1) (x += w * (1 - q)), (w *= q);
    else if (dir === 2) h *= q;
    else (y += h * (1 - q)), (h *= q);
    x -= b;
    y -= b;
    w += 2 * b;
    h += 2 * b;
    return `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}Z`;
  }
  async function mosaic(target, reveal, name) {
    // reveal: target shows only the cut tiles (in); else target shows only the uncut tiles (out)
    const order = shuffle(COLS * ROWS);
    const dirs = order.map(() => Math.floor(Math.random() * 4));
    const ST = 27;
    const TD = 120;
    const grid = D("e2-mz", ov);
    const fsx = D("e2-fsx", ov, stackMarkup(`${reveal ? "EXPAND" : "RESTORE"} · ${name}`, reveal ? "-FULLSCREEN-" : "-SPLIT-"));
    const sp = stackParts(fsx);
    const cells = order.map((_, i) => {
      const t = tileRect(i);
      const c = D("c", grid, `<i>${String(i + 1).padStart(2, "0")}</i>`);
      Object.assign(c.style, { left: t.x + "px", top: t.y + "px", width: t.w + "px", height: t.h + "px" });
      return c;
    });
    const at = new Array(COLS * ROWS);
    order.forEach((tile, k) => (at[tile] = 90 + k * ST));
    const total = 90 + (COLS * ROWS - 1) * ST + TD + 420;
    target.style.clipPath = reveal ? "path('M0 0Z')" : "";
    await tween(total, (e) => {
      grid.style.opacity = P(e, 0, 90) * (1 - P(e, total - 380, 380, SOFT));
      if (e < total - 470) stackIn(sp, e, 0, 460);
      else stackOut(sp, e, total - 470);
      let path = "";
      for (let i = 0; i < COLS * ROWS; i++) {
        const q = P(e, at[i], TD, SNAP);
        if (reveal) path += tilePart(i, q, dirs[i]);
        else if (q < 1) path += tilePart(i, 1 - q, dirs[i] ^ 1);
        const fl = P(e, at[i], 40) * (1 - P(e, at[i] + 70, 300, SETTLE));
        const c = cells[i];
        c.style.opacity = 0.5 + 0.5 * fl;
        c.style.borderColor = fl > 0.02 ? `rgba(255,250,0,${(0.25 + 0.75 * fl).toFixed(3)})` : "";
        c.style.backgroundColor = fl > 0.02 ? `rgba(255,250,0,${(0.07 * fl).toFixed(3)})` : "";
      }
      target.style.clipPath = `path('${path || "M0 0Z"}')`;
    });
    grid.remove();
    fsx.remove();
    target.style.clipPath = "";
  }
  async function onFullscreen(win, on, from, to, place, others) {
    const f = build(win.el);
    claim(f, "gk");
    if (on) {
      // ENTER keeps the rule-1 mosaic: still copy underneath, tiles cut over, camera pushes in.
      const under = win.el.cloneNode(true);
      under.dataset.ghost = "1";
      under.style.pointerEvents = "none";
      ctx.wins.insertBefore(under, ctx.wins.firstChild);
      win.el.style.zIndex = "3";
      place(win, to);
      tele(win);
      cam(frame({ full: true }), { pivot: center(from), bry: (center(from).x < 960 ? 1 : -1) * 1.4, bs: -0.01, dur: 1300 });
      await mosaic(win.el, true, win.kind.toUpperCase());
      under.remove();
      others.forEach((o) => (o.el.style.visibility = "hidden"));
    } else {
      // EXIT (rule 15): no mosaic in reverse, no camera move. Others cut back instantly under
      // cover, fullscreen fades out in place, split fades in in place. Quick and quiet.
      const alive = claim(f, "gk");
      place(win, to);
      tele(win);
      win.el.style.zIndex = "";
      others.forEach((o) => (o.el.style.visibility = ""));
      // snap the camera home with no tween (covered by the fade)
      Object.assign(C, frame({ full: false, win }));
      apply();
      await tween(
        220,
        (e) => {
          const p = P(e, 0, 220, SNAP);
          win.el.style.opacity = 0.35 + 0.65 * p;
          others.forEach((o) => (o.el.style.opacity = p));
        },
        alive,
      );
      clear([win.el, ...others.map((o) => o.el)], ["opacity"]);
    }
  }

  // ---- SEAM: steel hairline + data strip + ticks; a yellow segment runs along it on change ----
  function buildSeam(el) {
    if (el.querySelector(".ef-seam")) return;
    let tk = "";
    for (let y = 60; y < SH - 40; y += 60) tk += `<i class="${y % 300 === 0 ? "maj" : ""}" style="top:${y}px"></i>`;
    el.innerHTML = `<div class="ef-seam"><div class="sm-hair"></div><div class="sm-strip a"></div><div class="sm-strip b"></div>
      <div class="sm-ticks">${tk}</div><div class="sm-run"></div><div class="sm-read"><span></span></div></div>`;
  }
  function seamHook(s) {
    const el = s.seam;
    buildSeam(el);
    apply();
    if (!s.visible) return;
    if (!s.changing) {
      if (!seamO.run) el.style.opacity = "1";
      return;
    }
    const alive = claim(seamO, "k");
    const r = ctx ? ctx.state.ratio : [1, 1];
    const run = el.querySelector(".sm-run");
    const read = el.querySelector(".sm-read");
    read.firstChild.textContent = `${r[0]} : ${r[1]}`;
    const o0 = parseFloat(el.style.opacity || "0");
    seamO.run = true;
    tween(
      1260,
      (e) => {
        el.style.opacity = lerp(o0, 1, P(e, 140, 220));
        const y = lerp(-160, SH + 20, P(e, 180, 760, SETTLE));
        run.style.transform = `translateY(${y}px)`;
        run.style.opacity = 1 - P(e, 820, 160);
        read.style.opacity = P(e, 260, 140) * (1 - P(e, 1000, 240));
        read.style.transform = `translate(-50%, -50%) translateY(${(1 - P(e, 260, 300, SETTLE)) * 12}px)`;
      },
      alive,
    ).then((ok) => {
      if (alive()) seamO.run = false;
      if (ok) el.style.opacity = "1";
    });
  }


  // ---- rule 10: deep layer stacks. Bottom -> top: topo lines, texture squares, white stripe, yellow banner,
  // line-art logo, the colour stripe (the view's one tri-band) with its label, red strip + ring, blue strip ----
  const LOGO = `<svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="#f4f4f6" stroke-width="7" stroke-linejoin="miter">
    <path d="M100 12 L170 44 L188 112 L148 172 L74 186 L22 140 L16 66 Z"/>
    <path d="M100 12 L100 58 M170 44 L134 72 M188 112 L146 110 M148 172 L124 140 M74 186 L84 146 M22 140 L60 122 M16 66 L58 78" stroke-width="4"/>
    <path d="M100 58 L134 72 L146 110 L124 140 L84 146 L60 122 L58 78 Z" stroke-width="4"/>
    <path d="M100 58 L146 110 M58 78 L124 140 M134 72 L84 146" stroke-width="3"/>
    <path d="M106 64 L88 104 L104 104 L92 140 L126 94 L108 94 L118 64 Z" fill="#f4f4f6" stroke="none"/></svg>`;
  const RING = `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="40" fill="#f4f4f6"/>
    <path d="M50 22 A28 28 0 1 1 24 62" fill="none" stroke="#e8381f" stroke-width="12"/><path d="M14 52 L24 70 L38 56 Z" fill="#e8381f"/></svg>`;
  function texSquares() {
    const bin = Array.from({ length: 6 }, (_, i) => Array.from({ length: 8 }, (_, j) => ((i * 7 + j * 3) % 5 < 2 ? 1 : 0)).join(" ")).join("<br>");
    return `<i class="sq dots"></i><i class="sq hat"></i><i class="sq bin">${bin}</i><i class="sq dots b"></i>
      <i class="sq brk"></i><i class="sq chev">‹‹</i><i class="sq hat b"></i><i class="sq bin b">${bin}</i>`;
  }
  function stackMarkup(red, label) {
    return `<div class="ls">
      <div class="l topo"></div>
      <div class="l tex">${texSquares()}</div>
      <div class="l white"><i></i><i></i></div>
      <div class="l banner"><span class="sm">DEVICE TYPE // CM-DSK<br>LAYER STACK 09</span><b class="sm">▾</b><b class="sm d">▾</b></div>
      <div class="l logo">${LOGO}</div>
      <div class="l tri"><i class="lab">${esc(label)}</i></div>
      <div class="l red"><span class="tx">//.${esc(red)}</span><span class="ring">${RING}</span></div>
      <div class="l blue"></div>
    </div>`;
  }
  // per-layer entry: [delay, dx, dy] - every layer appears at once, offset + faint, then fades/slides home
  const LS_IN = { topo: [0, 0, 34], tex: [60, 0, 26], white: [110, -44, 0], banner: [30, 0, -56], logo: [190, 0, 26], tri: [250, 52, 0], red: [310, -48, 0], blue: [370, 44, 0] };
  function stackParts(root) {
    const ls = root.querySelector(".ls");
    if (!ls) return [];
    return [...ls.children].map((el) => ({ el, k: LS_IN[el.classList[1]] || [0, 0, 0], ring: el.querySelector(".ring") }));
  }
  function stackIn(parts, e, base = 0, dur = 640) {
    parts.forEach(({ el, k, ring }) => {
      const p = P(e, base + k[0], dur, SETTLE);
      el.style.opacity = lerp(0.1, 1, p);
      el.style.transform = `translate(${(1 - p) * k[1]}px, ${(1 - p) * k[2]}px)`;
      if (ring) ring.style.transform = `rotate(${(1 - P(e, base + k[0], dur + 300, SETTLE)) * -300}deg)`;
    });
  }
  function stackOut(parts, e, base = 0) {
    const n = parts.length;
    parts.forEach(({ el, k }, i) => {
      const p = P(e, base + (n - 1 - i) * 18, 200, SNAP);
      el.style.opacity = 1 - p;
      el.style.transform = `translate(${p * k[1] * 0.6}px, ${p * k[2] * 0.6}px)`;
    });
  }
  // rule 11: crimson timer tag
  const tt = (t) => `<span class="tt sm"><svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="8" r="6.4" fill="none" stroke="#fff" stroke-width="2"/><path d="M8 4.2 V8.4 H11" fill="none" stroke="#fff" stroke-width="2"/></svg>${esc(t)}</span>`;

  // ---- HUD (rules 7 + 9): flat camera-plane controls in #hud; world print (floor "02", angled clock
  // plate, crystals) in the world layer, moving with the camera ----
  const ICON = {
    win: `<svg viewBox="0 0 40 30" width="40" height="30"><rect x="2" y="2" width="36" height="26" fill="none" stroke="currentColor" stroke-width="3.2"/><rect x="2" y="2" width="36" height="7" fill="currentColor"/><rect x="9" y="14" width="5" height="5" fill="currentColor"/></svg>`,
    ws: `<svg viewBox="0 0 40 40" width="46" height="46"><rect x="3" y="5" width="15" height="30" fill="currentColor"/><rect x="22" y="5" width="15" height="13" fill="currentColor"/><rect x="22" y="22" width="15" height="13" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
    apps: `<svg viewBox="0 0 40 40" width="36" height="36">${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${3 + c * 13}" y="${3 + r * 13}" width="8" height="8" fill="currentColor" ${r === 1 && c === 1 ? 'transform="rotate(45 20 20)"' : ""}/>`).join("")).join("")}</svg>`,
    q: `<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12.6 12.6 L17 17" stroke="currentColor" stroke-width="2.6"/></svg>`,
  };
  const nd = (cls = "") => `<span class="nd ${cls}"><b></b></span>`;
  function hudMarkup(data) {
    const st = ctx ? ctx.state : { list: [], ratio: [1, 1] };
    const notes = data.notes.slice(0, 3).map((n, i) => {
      const at = n.indexOf(":");
      const src = at > 0 ? n.slice(0, at) : "System";
      const txt = at > 0 ? n.slice(at + 1).trim() : n;
      return `<div class="pl note">${i === 0 ? nd("live") : nd("still")}<div class="nb"><div class="src">${esc(src.toUpperCase())}<span class="sm">NTF-0${i + 1}</span>${tt(["2m", "1h", "6h"][i])}</div><div class="tx">${esc(txt)}</div></div></div>`;
    });
    const tray = data.tray
      .map((t, i) => `<button class="tb-btn"><span class="ef-dia${i < 2 || i === 3 ? " on" : ""}"><i></i></span>${esc(t.toUpperCase())}</button>`)
      .join("");
    const tot = st.ratio[0] + st.ratio[1];
    const map = st.list
      .map((w, i) => `<i class="${w === st.focused ? "on" : ""}" style="flex:${st.list.length === 2 ? st.ratio[i] / tot : 1}"><em>${esc(w.kind.toUpperCase())}</em></i>`)
      .join("");
    const flat = `<div class="e2h">
      <div class="e2h-band pl"><div class="hat"></div>
        <div class="sm bl">◂ Q <s></s> PREV</div><div class="sm br">NEXT <s></s> E ▸</div>
        <div class="sm bc">HUD // CAMERA PLANE <s></s> TAB 3 / 5</div></div>
      <div class="e2h-tabs">
        <div class="tab key pl" style="left:${960 - 300}px">${ICON.q}</div>
        <div class="tab ico pl" style="left:${960 - 165}px">${ICON.win}${nd("live")}</div>
        <div class="tab act pl" style="left:960px"><div class="topo"></div>${ICON.ws}<b>WS-02</b>${nd("live")}</div>
        <div class="tab ico pl" style="left:${960 + 165}px">${ICON.apps}</div>
        <div class="tab key pl" style="left:${960 + 300}px"><span>E</span></div>
      </div>
      <div class="e2h-col">
        <div class="pl search"><span class="chev">›››</span><span class="ph">SEARCH <s></s> APPS · FILES · COMMANDS</span><span class="caret"></span></div>
        <div class="sm hd">NOTIFICATIONS <s></s> ${data.notes.length} <span>CLEAR ALL ✕</span></div>
        ${notes.join("")}
        <div class="sm hd">TRAY <s></s> ${data.tray.length} ACTIVE <span class="nx">BACKUP IN ${tt("3h")}</span></div>
        <div class="pl tray">${tray}</div>
      </div></div>`;
    const world = `<div class="e2w">
      ${stackMarkup("WORKSPACE 02 · SYNC", "-CLOCKMOST-")}
      <div class="floor"><div class="xs"><i></i><i></i></div><div class="num">02</div>
        <div class="arc a1"></div><div class="arc a2"></div>
        <div class="fp sm f1">WORKSPACE <s></s> 02 / 04 <s></s> CLOCKMOST</div>
        <div class="fp bcode sm f2"></div><div class="fp sm f3">${st.list.length} WINDOWS <s></s> ${st.ratio[0]} : ${st.ratio[1]} <s></s> ▸▸▸</div></div>
      <div class="clockp pl">
        <div class="lab sm"><span class="ef-dia on"><i></i></span>SYS.TIME <s></s> LOCAL<span class="r">UTC+01 · ${new Date().getFullYear()}</span></div>
        <div class="time"><span class="echo">${esc(data.time)}</span><span class="dg">${esc(data.time)}</span></div>
        <div class="date"><span>${esc(data.date.replace(",", "").toUpperCase())}</span><span class="strip sm"></span><span class="ix sm">CM-DSK</span></div>
        <div class="map sm"><span>LAYOUT</span><div class="mm">${map}</div></div>
        <div class="brk tl sm"></div><div class="brk br sm"></div></div>
      <div class="crp pl"><div class="cv"></div>
        <div class="wm sm">CLOCKMOST</div><div class="rl sm"></div><div class="lbx sm">SPECIMEN <s></s> CM-α <s></s> AMBER LATTICE</div>
        <div class="hb sm"></div><div class="bc sm"></div></div>
    </div>`;
    return { flat, world };
  }
  function hudParts(hudEl) {
    const root = hudEl.querySelector(".e2h");
    const wr = wp.querySelector(".e2w");
    if (!root || !wr) return null;
    return {
      root,
      wr,
      band: root.querySelector(".e2h-band"),
      tabs: [...root.querySelectorAll(".tab")],
      act: root.querySelector(".tab.act"),
      col: [...root.querySelectorAll(".e2h-col > .pl")],
      floor: wr.querySelector(".floor"),
      clockp: wr.querySelector(".clockp"),
      crp: wr.querySelector(".crp"),
      stack: stackParts(wr),
      echo: wr.querySelector(".echo"),
      smalls: [...root.querySelectorAll(".sm, .nd"), ...wr.querySelectorAll(".sm")],
    };
  }
  async function hudShow(hudEl, data) {
    const alive = claim(hudO, "g");
    const m = hudMarkup(data);
    hudEl.innerHTML = m.flat;
    wp.innerHTML = m.world;
    if (!hudCrystal)
      hudCrystal = crystalCanvas(420, 400, [
        [215, 190, 112, 3, 0],
        [92, 300, 62, 41, 1, 0.85],
        [338, 312, 58, 77, 2, 0.8],
        [330, 92, 40, 12, 3, 0.65],
      ]);
    wp.querySelector(".crp .cv").appendChild(hudCrystal);
    const h = hudParts(hudEl);
    cam(frame({ hud: true }), { pivot: { x: 760, y: 640 }, bry: -1.8, brx: 1.4, bs: -0.016, dur: 1200 });
    const smalls = h.smalls;
    await tween(
      1500,
      (e) => {
        dimEl.style.opacity = P(e, 0, 420, SETTLE);
        // camera plane: everything appears at once, short offset, low opacity -> fade + slide home
        const pb = P(e, 0, 600, SETTLE);
        h.band.style.opacity = lerp(0.15, 1, pb);
        h.band.style.transform = `translateY(${(1 - pb) * -30}px)`;
        h.tabs.forEach((t, i) => {
          const p = P(e, 30 + Math.abs(i - 2) * 40, 600, SETTLE);
          t.style.opacity = lerp(0.12, 1, p);
          t.style.transform = `translate(-50%, ${(1 - p) * (t === h.act ? -48 : -26)}px)`;
        });
        h.col.forEach((c, i) => {
          const p = P(e, 80 + i * 55, 620, SETTLE);
          c.style.opacity = lerp(0.12, 1, p);
          c.style.transform = `translateY(${(1 - p) * -40}px)`;
        });
        // world print: lands in the world (slides along its own plane)
        const pf = P(e, 60, 900, SETTLE);
        h.floor.style.opacity = lerp(0.1, 1, pf);
        h.floor.style.setProperty("--in", `${(1 - pf) * 60}px`);
        const pc = P(e, 40, 700, SETTLE);
        h.clockp.style.opacity = lerp(0.12, 1, pc);
        h.clockp.style.setProperty("--in", `${(1 - pc) * -52}px`);
        const pr = P(e, 120, 700, SETTLE);
        h.crp.style.opacity = lerp(0.12, 1, pr);
        h.crp.style.setProperty("--in", `${(1 - pr) * -52}px`);
        stackIn(h.stack, e, 0, 680);
        const g = P(e, 300, 500, SETTLE);
        h.echo.style.transform = `translateX(${lerp(26, 3, g)}px) scaleX(1.01)`;
        h.echo.style.opacity = 0.2 * P(e, 300, 160);
        // rule 4: microtext, brackets, barcodes, diamonds - slow fade after the plates land
        smalls.forEach((s, i) => (s.style.opacity = P(e, 520 + (i % 6) * 50, 760, SOFT)));
      },
      alive,
    );
    if (alive()) smalls.forEach((s) => (s.style.opacity = ""));
  }
  async function hudHide(hudEl) {
    const alive = claim(hudO, "g");
    const h = hudParts(hudEl);
    if (!h) return;
    // rule 15: no motion on exit - everything fades in place, then the camera cuts home.
    const ok = await tween(
      300,
      (e) => {
        h.smalls.forEach((s) => (s.style.opacity = 1 - P(e, 0, 110)));
        const q = (d) => P(e, d, 180, SNAP);
        h.col.forEach((c, i) => (c.style.opacity = 1 - q((h.col.length - 1 - i) * 20)));
        h.tabs.forEach((t) => (t.style.opacity = 1 - q(80)));
        h.band.style.opacity = 1 - q(100);
        const pw = q(30);
        h.floor.style.opacity = h.clockp.style.opacity = h.crp.style.opacity = 1 - pw;
        h.stack.forEach(({ el }, i) => (el.style.opacity = 1 - P(e, 20 + (h.stack.length - 1 - i) * 14, 170, SNAP)));
        h.root.style.opacity = 1 - P(e, 40, 240, SNAP);
        h.wr.style.opacity = 1 - P(e, 40, 240, SNAP);
        dimEl.style.opacity = 1 - P(e, 80, 220, SETTLE);
      },
      alive,
    );
    if (ok && alive()) {
      hudEl.innerHTML = "";
      wp.innerHTML = "";
      dimEl.style.opacity = 0;
      h.root && (h.root.style.opacity = "");
      // camera cuts home with no tween (exit never moves)
      Object.assign(C, frame({ hud: false }));
      apply();
    }
  }

  // ================= SYSTEM OVERLAYS (rules 12/13/14) - toast (T), reward (R), drawer (D) ================
  // All three live in sysLayer (above world, below HUD) and all three EXITS fade in place (rule 15).
  function sysAlive(k) { return claim(sysO, k); }
  function ratioText() {
    if (!ctx) return "1 : 1";
    const r = ctx.state.ratio;
    const n = ctx.state.list.length;
    return n === 2 ? `${r[0]} : ${r[1]}` : "FULL";
  }
  // ---- rule 14: location toast. Dark band, topo inside, ruler ticks bottom, 3 lines.
  // ENTER: band wipes L->R with feathered right edge, content fade-slides; EXIT: plain fade. ----
  const TOASTS = [
    ["Workspace 02", "Gaming", "3 windows · 1:2 split · Depth 0.1254±0.0054"],
    ["Workspace 01", "Work", "2 windows · 1:1 split · Depth 0.0841±0.0032"],
    ["Workspace 03", "Music", "1 window · FULL · Depth 0.2012±0.0061"],
    ["VPN · Frankfurt", "Network", "tun0 up · 42ms · UID 6349456094"],
  ];
  let toastIdx = 0;
  async function showToast(preset) {
    if (!sysLayer || !ctx) return;
    if (toastState) { toastState.dead = true; toastState.el.remove(); toastState = null; }
    const t = preset || TOASTS[toastIdx++ % TOASTS.length];
    const el = D("e13-toast", sysLayer,
      `<div class="band"><div class="topo"></div><div class="ticks">${Array.from({ length: 16 }, (_, i) => `<i>${(i + 1) * 10}</i>`).join("")}</div></div>
       <div class="tx"><div class="t1">${esc(t[0])}</div><div class="t2">${esc(t[1])}</div><div class="t3">${esc(t[2])}</div></div>
       <div class="micro sm">LOC · ${esc(ratioText())} <s></s> CM-DSK <s></s> ▸▸▸</div>`);
    const band = el.querySelector(".band");
    const tx = el.querySelector(".tx");
    const microEl = el.querySelector(".micro");
    const st = (toastState = { el, dead: false });
    const alive = sysAlive("toast");
    // enter: 520ms wipe + content fade-slide
    await tween(560, (e) => {
      if (st.dead) return;
      const w = P(e, 0, 420, SETTLE);
      band.style.setProperty("--w", `${w * 100}%`);
      band.style.opacity = lerp(0.2, 1, P(e, 0, 200));
      const p = P(e, 120, 420, SETTLE);
      tx.style.opacity = p;
      tx.style.transform = `translateX(${(1 - p) * 26}px)`;
      microEl.style.opacity = P(e, 320, 500, SOFT);
    }, alive);
    if (st.dead || !alive()) return;
    await tween(2100, (e) => {
      if (st.dead) return;
      // hold still (static hold - the Endfield way)
      void e;
    }, alive);
    if (st.dead || !alive()) return;
    // exit: static fade, nothing moves
    await tween(280, (e) => {
      if (st.dead) return;
      el.style.opacity = 1 - P(e, 0, 280, SNAP);
    }, alive);
    if (!st.dead) { el.remove(); if (toastState === st) toastState = null; }
  }
  // ---- rule 12: reward reveal. Blur+darken 1 frame, hairline wipes centre->edges with header,
  // header travels up, cards deal L->R with scale-pop, exit on click = gone in 1-2 frames. ----
  const REWARDS = [
    ["Screenshot saved", "shot-0214.png · 2.1 MB", "#00FFA2"],
    ["Download done", "cachyos-iso · 1.8 GB", "#FFFA00"],
    ["Backup OK", "03:25 · 412 files", "#FF7A1A"],
  ];
  async function toggleReward(preset) {
    if (!sysLayer) return;
    const old = sysLayer.querySelector(".e13-reward");
    if (old) { old.remove(); rewardOpen = false; dimEl.style.opacity = 0; return; }
    rewardOpen = true;
    const el = D("e13-reward", sysLayer,
      `<div class="blur"></div><div class="rule"><span class="head">◆ Rewards Acquired</span></div>
       <div class="edge l"></div><div class="edge r"></div><div class="ring"></div><div class="tri"></div>
       <div class="cards">${REWARDS.map((r, i) => `<div class="card" style="--rc:${r[2]}"><div class="rar"></div><div class="t1">${esc(preset && i === 0 ? preset[0] : r[0])}</div><div class="t2">${esc(preset && i === 0 ? preset[1] : r[1])}</div><div class="num">0${i + 1}</div><div class="bc"></div></div>`).join("")}</div>
       <button class="confirm">Confirm</button>
       <div class="micro sm">CLICK ANYWHERE TO DISMISS <s></s> INSTANT CUT <s></s> NO EXIT MOTION</div>`);
    const alive = sysAlive("reward");
    dimEl.style.opacity = 1;
    const rule = el.querySelector(".rule");
    const cards = [...el.querySelectorAll(".card")];
    el.addEventListener("mousedown", () => { el.remove(); rewardOpen = false; dimEl.style.opacity = 0; });
    await tween(1250, (e) => {
      // t0: blur is already on (1 frame). hairline wipes centre->edges ~0.1s:
      const w = P(e, 60, 220, SNAP);
      rule.style.setProperty("--w", `${w * 100}%`);
      rule.style.opacity = P(e, 0, 120);
      // ~0.5s hold, then rule+header travel up together (SETTLE):
      const up = P(e, 480, 420, SETTLE);
      rule.style.transform = `translateY(${-up * 430}px)`;
      el.querySelectorAll(".edge").forEach((x) => (x.style.opacity = P(e, 480, 300)));
      el.querySelector(".ring").style.opacity = P(e, 520, 400) * 0.5;
      el.querySelector(".tri").style.opacity = P(e, 560, 300);
      // cards deal L->R ~0.1s apart, scale-pop in place (no slide):
      cards.forEach((c, i) => {
        const q = P(e, 700 + i * 100, 220, SNAP);
        const pop = q < 0.7 ? lerp(0.82, 1.06, q / 0.7) : lerp(1.06, 1, (q - 0.7) / 0.3);
        c.style.opacity = q;
        c.style.transform = `scale(${pop.toFixed(3)})`;
      });
      el.querySelector(".confirm").style.opacity = P(e, 1050, 200);
      el.querySelector(".micro").style.opacity = P(e, 1050, 400, SOFT);
    }, alive);
    // hold still until clicked (no auto-dismiss - Mario clicks to cut it)
  }
  // ---- rule 13: app drawer (backpack). Solid light top -> frosted glass, darker bottom bar.
  // ENTER: panel wipes L->R, slots ride the wipe; secondary layer fades after. EXIT: fade in place. ----
  const APPS = [
    ["Firefox", "3", "#FF7A1A"], ["Discord", "5", "#00FFA2"], ["Spotify", "1", "#9BE86E"],
    ["Kitty", "2", "#4A4E56"], ["Steam", "·", "#00FFA2"], ["Files", "·", "#FFFA00"],
    ["Code", "4", "#FF1AAC"], ["KeePass", "·", "#4A4E56"], ["Gimp", "·", "#FF7A1A"],
    ["VLC", "·", "#FFFA00"], ["Docs", "·", "#4A4E56"], ["Mail", "9", "#D91E36"],
  ];
  async function toggleDrawer() {
    if (!sysLayer) return;
    const old = sysLayer.querySelector(".e13-drawer");
    if (old) {
      const alive = sysAlive("drawer");
      await tween(240, (e) => (old.style.opacity = 1 - P(e, 0, 240, SNAP)), alive);
      old.remove(); drawerOpen = false; return;
    }
    drawerOpen = true;
    const el = D("e13-drawer", sysLayer,
      `<div class="panel"><div class="head"><span class="tile">▦</span><span class="ti">Applications</span><span class="bc"></span><span class="cap sm">Capacity 13/40</span><span class="ex">${X_SVG}</span></div>
       <div class="filters"><span class="on">All</span><span>Net</span><span>Media</span><span>Sys</span><span>Doc</span><span>Dev</span></div>
       <div class="grid">${APPS.map((a) => `<div class="slot" style="--rc:${a[2]}"><span class="glyph">${esc(a[0][0])}</span><span class="nm">${esc(a[0])}</span><span class="n">${esc(a[1])}</span><i class="bar"></i></div>`).join("")}</div>
       <div class="foot"><span class="sort">Default ▾ | DESC</span><span class="stash">Quick Stash ⤓</span><span class="mini">▽</span><span class="mini">◈</span></div>
       <div class="micro sm">D TO CLOSE <s></s> EXIT FADES IN PLACE</div></div>`);
    el.querySelector(".ex").addEventListener("mousedown", (ev) => { ev.stopPropagation(); toggleDrawer(); });
    const alive = sysAlive("drawer");
    const panel = el.querySelector(".panel");
    const slots = [...el.querySelectorAll(".slot")];
    const second = [...el.querySelectorAll(".cap,.filters,.foot,.micro")];
    await tween(760, (e) => {
      // panel reveals L->R (clip wipe); slots ride inside it (no separate motion)
      const w = P(e, 0, 480, SETTLE);
      panel.style.setProperty("--w", `${w * 100}%`);
      panel.style.opacity = lerp(0.25, 1, P(e, 0, 240));
      slots.forEach((s) => (s.style.opacity = P(e, 60, 420)));
      second.forEach((s, i) => (s.style.opacity = P(e, 480 + (i % 4) * 40, 260, SOFT)));
    }, alive);
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, onFullscreen, seam: seamHook, hudShow, hudHide };
})();
