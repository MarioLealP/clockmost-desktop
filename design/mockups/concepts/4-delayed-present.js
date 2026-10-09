// 4 · The Delayed Present (GPT concept)
// The desktop has a tiny memory: windows leave exact traces of where they were,
// and those traces reconcile with reality almost at once. Thin lines, hollow
// afterimages, monochrome + one accent. Every effect is transitional.
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const W = 1920, H = 1080, INSET = 6, BEAT = 120;
  const EASE = { out: "cubic-bezier(.2,.8,.2,1)", sharp: "cubic-bezier(.4,0,.2,1)", mech: "cubic-bezier(.3,1.35,.5,1)" };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const done = (a) => a.finished.catch(() => {});

  // ---- tiny tween engine ---------------------------------------------------------------------
  // WAAPI-shaped (keyframes + {duration, delay, easing, fill}), but clocked by performance.now()
  // and driven by rAF with a timer fallback, so it also runs where the document timeline is
  // frozen (headless virtual-time screenshots). Later tweens win on the same property.
  function bez(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
    const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      let t = x;
      for (let i = 0; i < 6; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-4 || !d) break; t -= e / d; }
      if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-3) { let lo = 0, hi = 1; t = x; for (let i = 0; i < 24; i++) { X(t) < x ? (lo = t) : (hi = t); t = (lo + hi) / 2; } }
      return Y(t);
    };
  }
  const easeCache = {};
  function easeFn(e) {
    if (!e || e === "linear") return (x) => x;
    if (easeCache[e]) return easeCache[e];
    const m = e.match(/cubic-bezier\(([^)]+)\)/);
    const f = m ? bez(...m[1].split(",").map(Number)) : e === "ease-in-out" ? bez(0.42, 0, 0.58, 1) : bez(0.25, 0.1, 0.25, 1);
    return (easeCache[e] = f);
  }
  const NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
  function lerp(a, b, t) {
    a = String(a); b = String(b);
    const na = a.match(NUM) || [], nb = b.match(NUM) || [];
    if (na.length !== nb.length || a.replace(NUM, "#") !== b.replace(NUM, "#")) return t < 0.5 ? a : b;
    let i = 0;
    return a.replace(NUM, () => { const v = +na[i] + (+nb[i] - +na[i]) * t; i++; return String(Math.round(v * 1000) / 1000); });
  }
  const live = [];
  let pending = false;
  function A(el, kf, o = {}) {
    let resolve;
    const finished = new Promise((r) => (resolve = r));
    if (!el) { resolve(); return { finished }; }
    const n = kf.length;
    const frames = kf.map((k, i) => ({ ...k, offset: k.offset ?? (n === 1 ? 1 : i / (n - 1)) }));
    const props = [...new Set(frames.flatMap((k) => Object.keys(k).filter((p) => p !== "offset" && p !== "easing")))];
    const tw = { el, frames, props, t0: performance.now() + (o.delay || 0), dur: Math.max(o.duration || 0, 1), ease: easeFn(o.easing), fill: o.fill || "none", resolve, prev: {} };
    props.forEach((p) => (tw.prev[p] = el.style[p]));
    live.push(tw);
    tick();
    return { finished };
  }
  function sample(tw, x) {
    const out = {};
    for (const p of tw.props) {
      const ks = tw.frames.filter((k) => p in k);
      if (x <= ks[0].offset) { out[p] = ks[0][p]; continue; }
      let i = 0;
      while (i < ks.length - 1 && x > ks[i + 1].offset) i++;
      if (i >= ks.length - 1) { out[p] = ks[ks.length - 1][p]; continue; }
      const a = ks[i], b = ks[i + 1], span = b.offset - a.offset || 1;
      out[p] = lerp(a[p], b[p], easeFn(a.easing)((x - a.offset) / span));
    }
    return out;
  }
  function tick() {
    const now = performance.now();
    for (let i = 0; i < live.length; i++) {
      const tw = live[i];
      const raw = (now - tw.t0) / tw.dur;
      if (raw < 0) { if (tw.fill === "both" || tw.fill === "backwards") Object.assign(tw.el.style, sample(tw, 0)); continue; }
      if (raw >= 1) {
        if (tw.fill === "both" || tw.fill === "forwards") Object.assign(tw.el.style, sample(tw, 1));
        else tw.props.forEach((p) => (tw.el.style[p] = tw.prev[p]));
        tw.done = true;
        continue;
      }
      Object.assign(tw.el.style, sample(tw, tw.ease(raw)));
    }
    for (let i = live.length - 1; i >= 0; i--) if (live[i].done) { const tw = live.splice(i, 1)[0]; tw.resolve(); }
    if (live.length && !pending) {
      pending = true;
      let fired = false;
      const go = () => { if (fired) return; fired = true; pending = false; tick(); };
      requestAnimationFrame(go);
      setTimeout(go, 34);
    }
  }
  const stopOn = (el) => { for (let i = live.length - 1; i >= 0; i--) if (live[i].el === el || el.contains(live[i].el)) live.splice(i, 1); };

  let fx, svg, seamX = null, seamGhostAt = -1e9, closingAt = -1e9, hudGen = 0;

  // ---- fx layer: one SVG for lines, a div layer for frames -------------------------------
  function layer() {
    if (fx) return fx;
    fx = document.createElement("div");
    fx.id = "dp-fx";
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    fx.appendChild(svg);
    const screen = document.getElementById("screen");
    screen.insertBefore(fx, document.getElementById("seam"));
    return fx;
  }
  function sv(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    (parent || (layer(), svg)).appendChild(el);
    return el;
  }
  // a line whose dash can draw in (from its start) and erase (from its start)
  function seg(x1, y1, x2, y2, attrs, parent) {
    const L = Math.max(Math.hypot(x2 - x1, y2 - y1), 0.01);
    const el = sv("line", { x1, y1, x2, y2, "stroke-dasharray": `${L} ${L}`, ...attrs }, parent);
    el._L = L;
    return el;
  }
  const drawIn = (l, dur, delay = 0) =>
    A(l, [{ strokeDashoffset: l._L }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: EASE.out, fill: "both" });
  const eraseOut = (l, dur, delay = 0) =>
    A(l, [{ strokeDashoffset: 0 }, { strokeDashoffset: -l._L }], { duration: dur, delay, easing: EASE.sharp, fill: "forwards" });
  const inset = (r, d = INSET) => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

  // hollow afterimage: 4 corner pieces (corner -> side midpoints); after `hold`
  // each corner erodes outward, TL TR BR BL in sequence, leaving the midpoints last.
  function hollow(r, { hold = 150, opacity = 0.7, color = "#e6e6e9", stagger = 55, erase = 150 } = {}) {
    const g = sv("g", { opacity, stroke: color, "stroke-width": 1, fill: "none" });
    const { x, y, w, h } = r, mx = x + w / 2, my = y + h / 2;
    const C = [[x, y, x], [x + w, y, x + w], [x + w, y + h, x + w], [x, y + h, x]];
    const pieces = C.map(([cx, cy]) => [seg(cx, cy, mx, cy, {}, g), seg(cx, cy, cx, my, {}, g)]);
    (async () => {
      await sleep(hold);
      pieces.forEach((p, i) => p.forEach((l) => eraseOut(l, erase, i * stagger)));
      await sleep(3 * stagger + erase + 20);
      g.remove();
    })();
    return g;
  }

  // corresponding-corner trajectories: draw from old corner to new corner, mark the
  // arrival with a small accent tick, then erase themselves toward the destination.
  function trajectories(from, to, delay = 40) {
    const a = inset(from), b = inset(to);
    const ca = [[a.x, a.y], [a.x + a.w, a.y], [a.x + a.w, a.y + a.h], [a.x, a.y + a.h]];
    const cb = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
    const g = sv("g", { fill: "none", "stroke-width": 1 });
    const dirs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    ca.forEach(([x1, y1], i) => {
      const [x2, y2] = cb[i];
      if (Math.hypot(x2 - x1, y2 - y1) < 4) return;
      const l = seg(x1, y1, x2, y2, { stroke: "var(--dp-acc)", opacity: 0.9 }, g);
      drawIn(l, 300, delay);
      // the drawing head: a 2px point running ahead of the line, exactly on the corner path
      const hd = sv("circle", { cx: x1, cy: y1, r: 2.5, fill: "var(--dp-acc)", stroke: "none" }, g);
      A(hd, [{ transform: "translate(0px, 0px)", opacity: 1 }, { transform: `translate(${x2 - x1}px, ${y2 - y1}px)`, opacity: 1, offset: 0.9 }, { transform: `translate(${x2 - x1}px, ${y2 - y1}px)`, opacity: 0 }], { duration: 330, delay, easing: EASE.out, fill: "both" });
      eraseOut(l, 220, delay + 340);
      // origin dot (exact old position) + arrival tick (exact new corner)
      const o = sv("circle", { cx: x1, cy: y1, r: 2, fill: "#e6e6e9", stroke: "none" }, g);
      A(o, [{ opacity: 0.8 }, { opacity: 0.8, offset: 0.6 }, { opacity: 0 }], { duration: 480, delay, fill: "both" });
      const [dx, dy] = dirs[i];
      const t = sv("polyline", { points: `${x2 + dx * 12},${y2} ${x2},${y2} ${x2},${y2 + dy * 12}`, stroke: "var(--dp-acc)", "stroke-width": 2 }, g);
      A(t, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 420, delay: delay + 260, fill: "both" });
    });
    setTimeout(() => g.remove(), delay + 760);
  }

  // the historical seam: dissolves from both screen edges toward the centre
  function ghostSeam(x) {
    const now = performance.now();
    if (now - seamGhostAt < 400) return;
    seamGhostAt = now;
    const g = sv("g", { stroke: "#d9d9dd", "stroke-width": 1, opacity: 0.55 });
    const top = seg(x, 0, x, H / 2, {}, g), bot = seg(x, H, x, H / 2, {}, g);
    [top, bot].forEach((l) => eraseOut(l, 340, 90));
    const mark = sv("line", { x1: x - 5, y1: H / 2, x2: x + 5, y2: H / 2, stroke: "var(--dp-acc)", "stroke-width": 1 }, g);
    A(mark, [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 520, delay: 60, fill: "both" });
    setTimeout(() => g.remove(), 620);
  }

  // ---- app skins ----------------------------------------------------------------------------
  function hhmm(minsAgo) {
    const d = new Date(Date.now() - minsAgo * 60000);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function decorate(win) {
    const el = win.el;
    if (el.dataset.dp) return;
    el.dataset.dp = "1";
    el.insertAdjacentHTML("beforeend", '<i class="dp-acc"></i>');
    el.querySelector(".titlebar").insertAdjacentHTML("afterbegin", '<i class="dp-ind"></i>');
    if (win.kind === "firefox") {
      el.querySelectorAll(".tab").forEach((t) => {
        t.insertAdjacentHTML("beforeend", '<i class="dp-ul"></i>');
        t.addEventListener("mousedown", () => switchTab(el, t));
      });
    } else if (win.kind === "discord") {
      const m = el.querySelectorAll(".chat .msg");
      if (m[2]) m[2].insertAdjacentHTML("afterend", `<div class="dp-cut"><i></i><span>last read ${hhmm(14)}</span></div>`);
    } else if (win.kind === "kitty") {
      const kt = el.querySelector(".kt");
      const parts = kt.textContent.split("\n");
      const last = parts.pop();
      kt.textContent = parts.join("\n") + "\n";
      const p = document.createElement("span");
      p.className = "dp-prompt";
      p.textContent = last;
      kt.appendChild(p);
    }
  }
  // Firefox: the previous tab keeps a restrained underline for a moment, then it
  // dissolves from both ends; the new underline arrives one beat late.
  function switchTab(el, t) {
    const prev = el.querySelector(".tab.on");
    if (!prev || prev === t) return;
    prev.classList.remove("on");
    t.classList.add("on");
    const pu = prev.querySelector(".dp-ul"), nu = t.querySelector(".dp-ul");
    A(pu, 
      [
        { opacity: 1, background: "var(--dp-acc)", clipPath: "inset(0% 0% 0% 0%)" },
        { opacity: 0.8, background: "var(--dp-acc)", clipPath: "inset(0% 0% 0% 0%)", offset: 0.3 },
        { opacity: 0.6, background: "var(--dp-acc)", clipPath: "inset(0% 50% 0% 50%)" },
      ],
      { duration: 520, easing: EASE.sharp },
    );
    A(nu, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 160, delay: BEAT, easing: EASE.mech, fill: "backwards" });
  }
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "t") return;
    const ff = document.querySelector(".win.firefox");
    if (!ff) return;
    const tabs = [...ff.querySelectorAll(".tab")];
    const i = tabs.findIndex((t) => t.classList.contains("on"));
    switchTab(ff, tabs[(i + 1) % tabs.length]);
  });
  // the focus accent arrives one beat late, like a mechanical indicator catching up;
  // the old window keeps a fading trace of it. Input focus itself is immediate.
  function lateAccent(el) {
    A(el.querySelector(".dp-acc"), [{ transform: "scaleX(0)", opacity: 0 }, { transform: "scaleX(.35)", opacity: 1, offset: 0.25 }, { transform: "scaleX(1)", opacity: 1 }], { duration: 180, delay: BEAT, easing: EASE.mech, fill: "backwards" });
    A(el.querySelector(".dp-ind"), [{ backgroundColor: "transparent", borderColor: "#5a5a60" }, { backgroundColor: "transparent", borderColor: "#5a5a60" }], { duration: BEAT });
    A(el.querySelector(".dp-prompt"), [{ borderColor: "transparent" }, { borderColor: "transparent" }], { duration: BEAT });
  }
  function accentTrace(el) {
    A(el.querySelector(".dp-acc"), [{ opacity: 0.55 }, { opacity: 0 }], { duration: 260, easing: "linear" });
  }

  // ---- wallpaper: near-flat with a faint reference grid ---------------------------------------
  function wallpaper(wall) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    const g = c.getContext("2d");
    g.fillStyle = "#101012";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.022)";
    for (let x = 0; x <= W; x += 120) g.fillRect(x, 0, 1, H);
    for (let y = 0; y <= H; y += 120) g.fillRect(0, y, W, 1);
    g.fillStyle = "rgba(255,255,255,.08)";
    for (let x = 0; x <= W; x += 240)
      for (let y = 0; y <= H; y += 240) { g.fillRect(x - 4, y, 9, 1); g.fillRect(x, y - 4, 1, 9); }
    g.fillStyle = "rgba(239,122,60,.35)";
    g.fillRect(W - 120 - 4, H - 120, 9, 1); g.fillRect(W - 120, H - 120 - 4, 1, 9);
    wall.appendChild(c);
  }

  // ---- HUD ---------------------------------------------------------------------------------------
  function hudHTML(d) {
    const notes = d.notes.map((n, i) => {
      const k = n.indexOf(": ");
      const src = k > 0 ? n.slice(0, k) : "—", txt = k > 0 ? n.slice(k + 2) : n;
      const at = (txt.match(/\b\d\d:\d\d\b/) || [])[0] || hhmm([1, 16, 47][i] ?? 60);
      return `<div class="dp-row${i === 0 ? " new" : ""}"><span class="t">${at}</span><span class="s">${src}</span><span class="x">${txt}</span></div>`;
    }).join("");
    const tray = d.tray.map((t) => {
      const v = t.match(/(\d+)%/);
      const meter = v ? `<b class="dp-meter"><b style="width:${v[1]}%"></b></b>` : "";
      return `<span class="c">${t.replace(/\s*\d+%/, "")}${meter}${v ? `<em>${v[1]}</em>` : ""}</span>`;
    }).join("");
    return `<div class="dp-hud"><div class="dp-scrim"></div><div class="dp-col">
      <div class="dp-clockwrap"><div class="dp-echo">${d.time}</div><div class="dp-echo">${d.time}</div><div class="dp-clock">${d.time}</div></div>
      <div class="dp-date">${d.date}</div>
      <div class="dp-ledger">${notes}</div>
      <div class="dp-tray">${tray}</div>
      <div class="dp-search"><i class="dp-caret"></i><b class="dp-sline"></b></div>
    </div></div>`;
  }
  async function hudShow(el, d) {
    const gen = ++hudGen;
    el.innerHTML = hudHTML(d);
    const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
    A(q(".dp-scrim"), [{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "linear", fill: "both" });
    // clock is simply there; two pale temporal copies arrive behind it and converge
    qa(".dp-echo").forEach((e, i) => {
      const off = -(i + 1) * 38, op = i ? 0.14 : 0.28;
      A(e, 
        [
          { opacity: 0, transform: `translateX(${off}px)` },
          { opacity: op, transform: `translateX(${off}px)`, offset: 0.2, easing: "cubic-bezier(.5,0,.2,1)" },
          { opacity: op * 0.6, transform: "translateX(0)", offset: 0.85 },
          { opacity: 0, transform: "translateX(0)" },
        ],
        { duration: 460 + i * 80, delay: i * 50, fill: "both" },
      );
    });
    A(q(".dp-date"), [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 240, fill: "both" });
    const rows = [...qa(".dp-row"), q(".dp-tray")];
    rows.forEach((r, i) => {
      const t0 = 320 + i * 60;
      // a hairline rule draws first, then the entry is written onto it
      const rule = document.createElement("i");
      rule.className = "rule";
      r.appendChild(rule);
      A(rule, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 240, delay: t0, easing: EASE.out, fill: "both" });
      [...r.children].filter((c) => c !== rule).forEach((c, j) =>
        A(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: t0 + 90 + Math.min(j, 2) * 30, fill: "both" }));
    });
    const tS = 320 + rows.length * 60 + 60;
    A(q(".dp-sline"), [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 280, delay: tS, easing: EASE.out, fill: "both" });
    A(q(".dp-caret"), [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: tS + 300, fill: "both" });
    await sleep(tS + 320);
    if (gen === hudGen) q(".dp-caret")?.classList.add("blink");
  }
  async function hudHide(el) {
    const gen = ++hudGen;
    const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
    if (!q(".dp-clock")) { el.innerHTML = ""; return; }
    // the hierarchy reverses: controls go first
    qa(".dp-search, .dp-tray, .dp-ledger, .dp-date").forEach((c, i) =>
      A(c, [{ opacity: 1 }, { opacity: 0 }], { duration: 90, delay: i * 12, fill: "forwards" }));
    await sleep(140);
    if (gen !== hudGen) return;
    // then the clock leaves two increasingly incomplete echoes
    const clock = q(".dp-clock");
    A(clock, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "linear", fill: "forwards" });
    const wrap = q(".dp-clockwrap");
    qa(".dp-echo").forEach((e) => e.remove());
    [0, 1].forEach((i) => {
      const e = document.createElement("div");
      e.className = "dp-echo out o" + (i + 1);
      e.textContent = clock.textContent;
      wrap.appendChild(e);
      const x0 = i * 30, x1 = (i + 1) * 30;
      A(e, 
        [
          { opacity: 0, transform: `translateX(${x0}px)` },
          { opacity: i ? 0.2 : 0.36, transform: `translateX(${x0}px)`, offset: 0.12 },
          { opacity: 0, transform: `translateX(${x1}px)` },
        ],
        { duration: 300, delay: 40 + i * 90, easing: EASE.out, fill: "both" },
      );
    });
    A(q(".dp-scrim"), [{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 60, easing: "linear", fill: "forwards" });
    await sleep(460);
    if (gen === hudGen) el.innerHTML = "";
  }

  // ---- concept hooks ---------------------------------------------------------------------------
  window.CONCEPT = {
    gap: 2,
    wallpaper,
    ready(ctx) {
      layer();
      ctx.state.list.forEach(decorate);
    },
    async onOpen(win) {
      decorate(win);
      lateAccent(win.el); // focus fired before decoration; play the late accent now
      // the window is already there; its frame shows an earlier, slightly smaller
      // state that catches up to the real bounds
      const r = win.rect, s = 0.94;
      const f = document.createElement("div");
      f.className = "dp-pre";
      Object.assign(f.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
      layer().appendChild(f);
      const a = A(f, 
        [
          { transform: `scale(${s})`, opacity: 0.9 },
          { transform: "scale(1)", opacity: 0.7, offset: 0.7 },
          { transform: "scale(1)", opacity: 0 },
        ],
        { duration: 300, easing: EASE.out },
      );
      await done(a);
      f.remove();
    },
    async onClose(win) {
      closingAt = performance.now();
      hollow(win.rect.w > 0 ? inset(win.rect, 1) : win.rect, { hold: 150, opacity: 0.75 });
      await done(A(win.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 70, easing: "linear", fill: "forwards" }));
      await sleep(110); // the void holds the hollow frame for a moment before the neighbour moves in
    },
    async onMove(win, from, to, place) {
      const seam = document.getElementById("seam");
      if (seamX != null) { ghostSeam(seamX); seam.style.opacity = "0"; }
      const closing = performance.now() - closingAt < 700;
      if (!closing) hollow(inset(from), { hold: 230, opacity: 0.5, erase: 160 });
      trajectories(from, to, closing ? 20 : 50);
      place(win, to);
      const px = (r) => ({ left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
      await done(A(win.el, [px(from), px(to)], { duration: 260, easing: EASE.out }));
    },
    onFocus(win, prev) {
      if (prev && prev.el.isConnected) accentTrace(prev.el);
      if (win.el.dataset.dp) lateAccent(win.el);
    },
    seam(s) {
      if (!s.visible) {
        if (seamX != null && s.changing) ghostSeam(seamX);
        seamX = null;
        return;
      }
      const x = s.x + s.w / 2;
      if (seamX != null && s.changing && Math.abs(seamX - x) > 1) ghostSeam(seamX);
      if (s.seam.style.opacity === "0") {
        s.seam.style.opacity = "";
        A(s.seam, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "linear" });
      }
      seamX = x;
    },
    hudShow,
    hudHide,
  };
})();
