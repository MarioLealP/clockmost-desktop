// 3 · Drafting table (blueprint): windows are drafted, dimensioned, inked and erased.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 32;
  const NS = "http://www.w3.org/2000/svg";
  let ctx = null;
  let ov = null;
  let fx = null;
  let hudGen = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  // rAF in a real browser; headless virtual time starves rAF, so screenshots tick on timers there
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
  function setLine(l, x1, y1, x2, y2) {
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
  }
  function fade(el, ms, delay = 0) {
    const o0 = parseFloat(getComputedStyle(el).opacity) || 1;
    setTimeout(() => tween(ms, (t) => (el.style.opacity = o0 * (1 - eOut(t)))).then(() => el.remove()), delay);
  }
  function frac(w) {
    if (w >= SW - 1) return "FULL";
    const s = Math.round((w / (SW - GAP)) * 6);
    const g = gcd(s, 6) || 1;
    return `${s / g}/${6 / g}`;
  }
  function liveRatio(a, b) {
    if (b <= 0) return "—";
    if (Math.abs(a - b) < 6) return "1:1";
    return a < b ? `1:${(b / a).toFixed(2)}` : `${(a / b).toFixed(2)}:1`;
  }
  function ensureTag(win) {
    let t = win.el.querySelector(".dr-dim-tag");
    if (!t) {
      t = document.createElement("span");
      t.className = "dr-dim-tag";
      win.el.querySelector(".titlebar").appendChild(t);
    }
    if (win.rect) t.textContent = `${Math.round(win.rect.w)} × ${win.rect.h}`;
    return t;
  }

  // a dimension line: arrows both ends, extension ticks, boxed label at the midpoint
  function mkDim(parent) {
    const g = S("g", { class: "dr-dim" }, parent);
    const ln = S("line", { "marker-start": "url(#dr-arr)", "marker-end": "url(#dr-arr)" }, g);
    const e1 = S("line", {}, g);
    const e2 = S("line", {}, g);
    const lab = S("g", { class: "lab" }, g);
    const rect = S("rect", { height: 22 }, lab);
    const txt = S("text", {}, lab);
    let last = "";
    return {
      g,
      set(x1, y1, x2, y2, text, op) {
        g.style.opacity = op;
        if (op <= 0) return;
        setLine(ln, x1, y1, x2, y2);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const nx = -(y2 - y1) / len;
        const ny = (x2 - x1) / len;
        setLine(e1, x1 - nx * 12, y1 - ny * 12, x1 + nx * 12, y1 + ny * 12);
        setLine(e2, x2 - nx * 12, y2 - ny * 12, x2 + nx * 12, y2 + ny * 12);
        if (text !== last) {
          txt.textContent = text;
          rect.setAttribute("width", text.length * 8 + 18);
          last = text;
        }
        const w = text.length * 8 + 18;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        rect.setAttribute("x", mx - w / 2);
        rect.setAttribute("y", my - 11);
        txt.setAttribute("x", mx);
        txt.setAttribute("y", my + 1);
        lab.style.opacity = len > w + 30 ? 1 : 0;
      },
    };
  }

  function buildOverlay(screen) {
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "dr-ov", viewBox: `0 0 ${SW} ${SH}` });
    ov.innerHTML = `<defs>
      <marker id="dr-arr" viewBox="0 0 14 8" refX="13.5" refY="4" markerWidth="14" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
        <path d="M0 0 L14 4 L0 8 L3 4 z" fill="#a9e2ff"/></marker>
      <pattern id="dr-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="9" stroke="#a9e2ff" stroke-width="1.3" stroke-opacity=".55"/></pattern>
    </defs>`;
    fx = document.createElement("div");
    fx.className = "dr-fx";
    screen.insertBefore(ov, hud);
    screen.insertBefore(fx, hud);
  }

  function buildSeam(seam) {
    if (seam.querySelector(".dr-seam")) return;
    let tk = "";
    for (let y = 36, i = 0; y < SH - 30; y += 24, i++) {
      const maj = i % 5 === 0;
      tk += `M${GAP / 2 - (maj ? 6 : 3)} ${y}h${maj ? 12 : 6}`;
    }
    seam.innerHTML = `<svg class="dr-seam" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">
      <line class="sm-ln" x1="${GAP / 2}" y1="14" x2="${GAP / 2}" y2="${SH - 14}" pathLength="1"/>
      <path class="sm-tk" d="${tk}"/>
      <path class="sm-ar" d="M${GAP / 2} 6 l-4 13 h8 z M${GAP / 2} ${SH - 6} l-4 -13 h8 z"/>
    </svg><div class="dr-seam-lab"><span>1:1</span></div>`;
  }
  function reinkSeam(seam) {
    const ln = seam.querySelector(".sm-ln");
    if (!ln) return;
    tween(420, (t) => {
      const p = eOut(t);
      ln.style.strokeDasharray = p >= 1 ? "none" : `0 ${(1 - p) / 2} ${p} 1`;
    });
  }

  function erasePass(target, r, ms, host, onT) {
    // a soft skewed eraser band sweeping left→right; `target` is clipped behind it
    const k = r.h * Math.tan((12 * Math.PI) / 180);
    const BW = Math.min(260, Math.max(140, r.w * 0.22));
    const box = D("dr-erase-box", host);
    Object.assign(box.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
    const band = D("dr-eraser", box);
    Object.assign(band.style, { width: BW + "px", height: r.h + "px" });
    let lastCrumb = 0;
    return tween(ms, (t) => {
      const e = eInOut(t);
      const c = lerp(-k / 2 - BW / 2, r.w + k / 2 + BW / 2, e);
      band.style.transform = `translateX(${c - BW / 2}px) skewX(-12deg)`;
      const top = Math.min(r.w, c + k / 2);
      const bot = Math.min(r.w, c - k / 2);
      target.style.clipPath = `polygon(${top}px 0px, ${r.w}px 0px, ${r.w}px ${r.h}px, ${bot}px ${r.h}px)`;
      if (onT) onT(t, e);
      if (t - lastCrumb > 0.035 && t > 0.05 && t < 0.9) {
        lastCrumb = t;
        for (let i = 0; i < 2; i++) {
          const yr = Math.random() * r.h;
          const x = r.x + c + k / 2 - (yr / r.h) * k;
          const cr = D("dr-crumb", host);
          cr.style.transform = `translate(${x}px, ${r.y + yr}px)`;
          cr.animate(
            [
              { transform: `translate(${x}px, ${r.y + yr}px) rotate(0deg)`, opacity: 0.75 },
              { transform: `translate(${x - 30 - Math.random() * 50}px, ${r.y + yr + 18 + Math.random() * 40}px) rotate(${Math.random() * 180}deg)`, opacity: 0 },
            ],
            { duration: 520 + Math.random() * 300, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" },
          ).finished.then(() => cr.remove());
        }
      }
    }).then(() => {
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }).finished.then(() => box.remove());
    });
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    wallEl.innerHTML = `<svg class="dr-marks" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">
      <g class="dr-drift">
        <line class="mk cl" x1="80" y1="1010" x2="1180" y2="90"/>
        <g><circle class="mk dt dr-spin" cx="1390" cy="390" r="270"/></g>
        <line class="mk cl" x1="1060" y1="390" x2="1720" y2="390"/>
        <line class="mk cl" x1="1390" y1="80" x2="1390" y2="700"/>
        <path class="mk" d="M1390 390 L1580 200"/>
        <text class="mk-t" x="1530" y="270">R 270</text>
        <circle class="mk" cx="430" cy="690" r="60"/>
        <line class="mk" x1="350" y1="690" x2="510" y2="690"/><line class="mk" x1="430" y1="610" x2="430" y2="770"/>
        <text class="mk-t" x="500" y="630">Ø 120</text>
        <line class="mk" x1="240" y1="880" x2="720" y2="880"/>
        <line class="mk" x1="240" y1="866" x2="240" y2="894"/><line class="mk" x1="720" y1="866" x2="720" y2="894"/>
        <text class="mk-t" x="462" y="870">480</text>
        <path class="mk" d="M1500 860 A120 120 0 0 0 1415 775"/>
        <line class="mk" x1="1380" y1="860" x2="1660" y2="860"/><line class="mk" x1="1380" y1="860" x2="1560" y2="680"/>
        <text class="mk-t" x="1520" y="815">45°</text>
      </g></svg><div class="dr-walltag">CLOCKMOST · DESKTOP · SHEET 1</div>`;
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach(ensureTag);
  }

  async function onOpen(win) {
    ensureTag(win);
    const el = win.el;
    const r = { ...win.rect };
    const I = 22;
    const O = 64;
    el.classList.add("dr-drawing");
    el.style.opacity = "0";
    el.style.transformOrigin = "50% 50%";
    const c0 = { x: r.x + I, y: r.y + I, w: r.w - 2 * I, h: r.h - 2 * I };
    const g = S("g", {}, ov);
    const hatch = S("rect", { height: 34, fill: "url(#dr-hatch)" }, g);
    const lines = [0, 1, 2, 3].map(() => S("line", { class: "dr-con" }, g));
    const tips = [0, 1, 2, 3].map(() => S("circle", { r: 2.8, class: "dr-tip" }, g));
    const dW = mkDim(g);
    const dH = mkDim(g);
    const flash = S("text", { class: "dr-flash" }, g);
    flash.textContent = `${r.w} × ${r.h}`;
    const sides = (q) => [
      [q.x, q.y, q.x + q.w, q.y],
      [q.x + q.w, q.y, q.x + q.w, q.y + q.h],
      [q.x + q.w, q.y + q.h, q.x, q.y + q.h],
      [q.x, q.y + q.h, q.x, q.y],
    ];
    await tween(720, (t) => {
      const se = eInOut(seg(t, 0.58, 1));
      const cur = { x: lerp(c0.x, r.x, se), y: lerp(c0.y, r.y, se), w: lerp(c0.w, r.w, se), h: lerp(c0.h, r.h, se) };
      const ext = O * (1 - eOut(seg(t, 0.46, 0.62)));
      const lineOp = 0.95 * (1 - seg(t, 0.8, 1));
      sides(cur).forEach(([x1, y1, x2, y2], i) => {
        const p = eOut(seg(t, i * 0.065, i * 0.065 + 0.28));
        const len = Math.hypot(x2 - x1, y2 - y1);
        const dx = (x2 - x1) / len;
        const dy = (y2 - y1) / len;
        const head = Math.min(-O + p * (len + 2 * O), len + ext);
        const tail = -ext;
        const ln = lines[i];
        ln.style.opacity = p > 0 && head > tail ? lineOp : 0;
        setLine(ln, x1 + dx * tail, y1 + dy * tail, x1 + dx * head, y1 + dy * head);
        tips[i].setAttribute("cx", x1 + dx * head);
        tips[i].setAttribute("cy", y1 + dy * head);
        tips[i].style.opacity = p > 0 && p < 1 ? 1 : 0;
      });
      // dimensions grow out from the centre, label flashes, then everything recedes
      const dp = eOut(seg(t, 0.24, 0.46));
      const dOp = seg(t, 0.24, 0.3) * (1 - seg(t, 0.74, 0.9));
      const cx = cur.x + cur.w / 2;
      const cy = cur.y + cur.h / 2;
      const hy = cur.y + 92;
      const vx = cur.x + 64;
      dW.set(cx - (dp * cur.w) / 2 + 12 * dp, hy, cx + (dp * cur.w) / 2 - 12 * dp, hy, `W ${r.w}`, dOp);
      dH.set(vx, cy - (dp * cur.h) / 2 + 12 * dp, vx, cy + (dp * cur.h) / 2 - 12 * dp, `H ${r.h}`, dOp);
      const f = seg(t, 0.32, 0.36);
      flash.setAttribute("x", cx);
      flash.setAttribute("y", cy);
      flash.style.opacity = f * (1 - 0.25 * seg(t, 0.36, 0.5)) * (1 - seg(t, 0.72, 0.88));
      flash.style.letterSpacing = `${0.06 + 0.12 * (1 - f)}em`;
      // ink in: top→bottom wipe with a hatched leading band, then the sheet settles to scale
      const ie = eInOut(seg(t, 0.42, 0.88));
      if (t >= 0.42) {
        el.style.opacity = String(0.55 + 0.45 * ie);
        el.style.clipPath = `inset(0 0 ${(1 - ie) * 100}% 0)`;
      }
      el.style.transform = `scale(${cur.w / r.w}, ${cur.h / r.h})`;
      hatch.setAttribute("x", cur.x);
      hatch.setAttribute("width", cur.w);
      hatch.setAttribute("y", cur.y + ie * cur.h - 34);
      hatch.style.opacity = ie > 0 && ie < 1 ? 0.9 : 0;
    });
    el.style.opacity = el.style.clipPath = el.style.transform = el.style.transformOrigin = "";
    el.classList.remove("dr-drawing");
    g.remove();
  }

  async function onClose(win) {
    const el = win.el;
    const r = { ...win.rect };
    const seam = ctx.seam;
    seam.style.transition = "opacity .3s";
    seam.style.opacity = "0";
    // ghost construction lines left behind by the eraser
    const gh = S("g", { class: "dr-ghost" }, ov);
    const O = 30;
    const q = { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4 };
    [
      [q.x - O, q.y, q.x + q.w + O, q.y],
      [q.x - O, q.y + q.h, q.x + q.w + O, q.y + q.h],
      [q.x, q.y - O, q.x, q.y + q.h + O],
      [q.x + q.w, q.y - O, q.x + q.w, q.y + q.h + O],
      [q.x + q.w / 2 - 40, q.y + q.h / 2, q.x + q.w / 2 + 40, q.y + q.h / 2],
      [q.x + q.w / 2, q.y + q.h / 2 - 40, q.x + q.w / 2, q.y + q.h / 2 + 40],
    ].forEach((a) => setLine(S("line", {}, gh), ...a));
    const gt = S("text", { x: q.x + q.w / 2, y: q.y + q.h / 2 + 64 }, gh);
    gt.textContent = `${r.w} × ${r.h}`;
    gh.style.opacity = 0;
    await erasePass(el, r, 560, fx, (t, e) => {
      gh.style.opacity = 0.5 * clamp(e * 1.6);
    });
    el.style.visibility = "hidden";
    fade(gh, 1100, 150);
  }

  async function onMove(win, from, to, place) {
    place(win, to);
    ensureTag(win);
    const el = win.el;
    const tag = el.querySelector(".dr-dim-tag");
    const st = ctx && ctx.state;
    const two = st && st.list.length === 2;
    const opening = st && st.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    const isLeft = two && to.x === 0;
    const seam = ctx && ctx.seam;
    const g = S("g", { class: "dr-snap" }, ov);
    const d = mkDim(g);
    const movedL = from.x !== to.x;
    const movedR = from.x + from.w !== to.x + to.w;
    const eL = movedL ? S("line", { class: "dr-ext" }, g) : null;
    const eR = movedR ? S("line", { class: "dr-ext" }, g) : null;
    let lab = null;
    if (isLeft && seam) {
      buildSeam(seam);
      Object.assign(seam.style, { display: "block", width: GAP + "px", transition: "opacity .25s", opacity: "1" });
      seam.classList.add("dr-chg");
      lab = seam.querySelector(".dr-seam-lab span");
    }
    const fr = frac(to.w);
    const y = SH / 2;
    const run = tween(540, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e);
      const w = lerp(from.w, to.w, e);
      el.style.left = x + "px";
      el.style.width = w + "px";
      tag.textContent = `${Math.round(w)} × ${to.h}`;
      const op = seg(t, 0, 0.18);
      d.set(x + 14, y, x + w - 14, y, `${fr} · ${Math.round(w)}`, op);
      if (eL) setLine(eL, x + 1, 40, x + 1, SH - 40);
      if (eR) setLine(eR, x + w - 1, 40, x + w - 1, SH - 40);
      g.style.opacity = op;
      if (lab) {
        seam.style.left = x + w + "px";
        lab.textContent = liveRatio(w, SW - GAP - w);
      }
    }).then(() => {
      place(win, to);
      ensureTag(win);
      fade(g, 600, 260);
    });
    // when a neighbour is about to be drafted, hand over early so the drawing overlaps the glide
    if (opening) await Promise.race([run, ctx.sleep(330)]);
    else await run;
  }

  function onFocus(win) {
    if (!win.el.querySelector(".dr-dim-tag") || win.el.classList.contains("dr-drawing") || !ov) return;
    const r = win.rect;
    const x = r.x + 1;
    const y = r.y + 1;
    const x2 = r.x + r.w - 1;
    const y2 = r.y + r.h - 1;
    const g = S("g", { class: "dr-trace" }, ov);
    const ps = [S("path", { d: `M${x} ${y}H${x2}V${y2}`, pathLength: 1 }, g), S("path", { d: `M${x} ${y}V${y2}H${x2}`, pathLength: 1 }, g)];
    tween(260, (t) => {
      const e = eOut(t);
      ps.forEach((p) => (p.style.strokeDasharray = `${e} 1`));
    }).then(() => fade(g, 220));
  }

  function seamHook(s) {
    const el = s.seam;
    buildSeam(el);
    if (!s.visible) return;
    el.style.transition = "opacity .3s";
    el.style.opacity = "1";
    const r = ctx ? ctx.state.ratio : [1, 1];
    el.querySelector(".dr-seam-lab span").textContent = `${r[0]}:${r[1]}`;
    if (s.changing) {
      el.classList.add("dr-chg");
      reinkSeam(el);
    } else {
      setTimeout(() => el.classList.remove("dr-chg"), 380);
    }
  }

  // ---- HUD: a drafting title block + sheet frame ----
  const SYM = [
    (cx, cy) => `<circle class="sym" cx="${cx}" cy="${cy}" r="10"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#a9e2ff"/>`,
    (cx, cy) => `<path class="sym" d="M${cx} ${cy - 11} L${cx + 11} ${cy + 8} H${cx - 11} Z"/>`,
    (cx, cy) => `<rect class="sym" x="${cx - 9}" y="${cy - 9}" width="18" height="18"/><path class="sym" d="M${cx - 9} ${cy + 9} L${cx + 9} ${cy - 9}"/>`,
    (cx, cy) => `<path class="sym" d="M${cx - 12} ${cy - 2} A17 17 0 0 1 ${cx + 12} ${cy - 2} M${cx - 7} ${cy + 3} A10 10 0 0 1 ${cx + 7} ${cy + 3}"/><circle cx="${cx}" cy="${cy + 8}" r="2.2" fill="#a9e2ff"/>`,
    (cx, cy) => `<path class="sym" d="M${cx - 10} ${cy - 4} h5 l6 -6 v20 l-6 -6 h-5 z M${cx + 5} ${cy - 5} q4 5 0 10"/>`,
  ];
  function titleBlock(data) {
    const W2 = 640;
    const n = ctx ? ctx.state.list.length : 2;
    let L = "";
    let i = 0;
    const ln = (x1, y1, x2, y2, cls = "") => {
      L += `<line class="ln ${cls}" pathLength="1" style="--d:${60 + i++ * 16}ms" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    };
    // outer border (heavy), then cell rules
    ln(0, 0, W2, 0, "hv");
    ln(W2, 0, W2, 340, "hv");
    ln(W2, 340, 0, 340, "hv");
    ln(0, 340, 0, 0, "hv");
    ln(0, 140, W2, 140);
    ln(0, 226, W2, 226);
    ln(0, 310, W2, 310);
    ln(340, 0, 340, 140);
    ln(340, 46, W2, 46);
    ln(340, 92, W2, 92);
    ln(490, 92, 490, 140);
    ln(96, 140, 96, 310);
    for (let k = 1; k < 5; k++) ln(96 + k * 108.8, 140, 96 + k * 108.8, 226);
    ln(96, 254, W2, 254);
    ln(96, 282, W2, 282);
    ln(136, 226, 136, 310);
    ln(270, 226, 270, 310);
    ln(440, 310, 440, 340);
    let T = "";
    let j = 0;
    const tx = (x, y, cls, s, extra = "") => {
      T += `<text class="tx ${cls}" style="--d:${200 + j++ * 18}ms" x="${x}" y="${y}" ${extra}>${esc(s)}</text>`;
    };
    tx(14, 22, "lab", "TIME");
    tx(352, 18, "lab", "DATE");
    tx(352, 39, "val", data.date);
    tx(352, 64, "lab", "SHEET");
    tx(352, 85, "val", `1 OF 2 · ${n} ${n === 1 ? "VIEW" : "VIEWS"}`);
    tx(352, 110, "lab", "SCALE");
    tx(352, 131, "val", "1 : 1");
    tx(502, 110, "lab", "UNITS");
    tx(502, 131, "val", "PX");
    tx(14, 162, "lab", "LEGEND");
    tx(14, 178, "lab", "(TRAY)");
    data.tray.slice(0, 5).forEach((t, k) => {
      const cx = 96 + k * 108.8 + 54.4;
      T += `<g class="tx" style="--d:${260 + k * 40}ms">${SYM[k % SYM.length](cx, 176)}</g>`;
      tx(cx, 214, "sm", t);
    });
    tx(14, 248, "lab", "REVISIONS");
    data.notes.slice(0, 3).forEach((note, k) => {
      const yb = 226 + k * 28 + 19;
      const at = note.indexOf(":");
      const src = at > 0 ? note.slice(0, at) : "Note";
      const dsc = at > 0 ? note.slice(at + 1).trim() : note;
      tx(116, yb, "rv", String.fromCharCode(65 + k));
      tx(146, yb, "src", src);
      tx(282, yb, "dsc", dsc);
    });
    tx(14, 330, "lab", "CLOCKMOST · DESKTOP ARRANGEMENT");
    tx(452, 330, "lab", "DWG CM-DSK-01");
    return `<svg width="640" height="340" viewBox="0 0 640 340">
      <defs><pattern id="dr-tbgrid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0V12H0" fill="none" stroke="rgba(140,200,255,.05)"/></pattern></defs>
      <rect class="tb-bg" width="640" height="340"/><rect class="tb-grid" width="640" height="340"/>
      ${L}${T}
      <text class="time" x="12" y="124">${esc(data.time)}</text>
    </svg>`;
  }
  function sheetFrame() {
    let t = "";
    for (let x = 240; x < SW; x += 240) t += `<line class="fr" pathLength="1" x1="${x}" y1="6" x2="${x}" y2="14"/><line class="fr" pathLength="1" x1="${x}" y1="${SH - 6}" x2="${x}" y2="${SH - 14}"/>`;
    for (let y = 270; y < SH; y += 270) t += `<line class="fr" pathLength="1" x1="6" y1="${y}" x2="14" y2="${y}"/><line class="fr" pathLength="1" x1="${SW - 6}" y1="${y}" x2="${SW - 14}" y2="${y}"/>`;
    return `<svg class="frame" viewBox="0 0 ${SW} ${SH}"><rect class="fr" pathLength="1" x="6" y="6" width="${SW - 12}" height="${SH - 12}"/>${t}</svg>`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    hudEl.innerHTML = `<div class="dr-hud">${sheetFrame()}<div class="dr-tb">${titleBlock(data)}</div></div>`;
    const root = hudEl.firstElementChild;
    root.getBoundingClientRect();
    tick(() => gen === hudGen && root.classList.add("in"));
    await new Promise((r) => setTimeout(r, 620));
  }
  async function hudHide(hudEl) {
    const gen = ++hudGen;
    const root = hudEl.querySelector(".dr-hud");
    if (!root) return;
    root.classList.add("out");
    const tb = root.querySelector(".dr-tb");
    const r = { x: SW - 30 - 640, y: SH - 30 - 340, w: 640, h: 340 };
    tb.style.transition = "none";
    await erasePass(tb, r, 340, root);
    if (gen === hudGen) hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
