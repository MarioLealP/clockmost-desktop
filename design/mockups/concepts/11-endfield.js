// 11 · Endfield (layered): every window / HUD panel is a stack of plates that slide over one another on
// staggered timings and lock into one clean stack at rest. Exits run the plates in reverse, faster.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 14;
  const OFF = 8; // back-plate offset (down-right)
  let ctx = null;
  let ov = null;
  let winCount = 0;
  const hudO = {};
  const seamO = {};

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
  const LIN = (t) => t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const P = (e, start, dur, ease = LIN) => ease(clamp((e - start) / dur));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  // fn(elapsedMs) runs once synchronously at 0, then every frame until ms; alive() lets a newer tween take over
  function tween(ms, fn, alive) {
    return new Promise((res) => {
      const t0 = performance.now();
      fn(0);
      const step = () => {
        if (alive && !alive()) return res(false);
        const e = Math.min(ms, performance.now() - t0);
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
  const clear = (els, props) => els.forEach((el) => props.forEach((p) => (el.style[p] = "")));

  // ---- window structure: back-plate · surface (edge + face{titlebar, content}) · rail · brackets ----
  function build(el) {
    if (el._ef) return el._ef;
    const tb = el.querySelector(".titlebar");
    const ct = el.querySelector(".content");
    const title = tb.querySelector(".title");
    const back = D("ef-back");
    const surf = D("ef-surf");
    D("ef-edge", surf);
    const face = D("ef-face", surf);
    face.append(tb, ct);
    const rail = D("ef-frail", surf);
    const brk = [D("ef-brk tl", surf), D("ef-brk br", surf)];
    const orail = D("ef-orail");
    const odia = D("ef-odia");
    const wedge = D("ef-wedge");
    el.prepend(back, surf);
    el.append(orail, odia, wedge);
    const dia = document.createElement("span");
    dia.className = "ef-dia";
    dia.innerHTML = "<i></i>";
    tb.insertBefore(dia, title);
    const tele = document.createElement("span");
    tele.className = "ef-tele";
    tb.appendChild(tele);
    const n = ++winCount;
    el._ef = { back, surf, face, tb, ct, title, dia, fill: dia.firstChild, tele, rail, brk, orail, odia, wedge, n };
    return el._ef;
  }
  function tele(win, w, h) {
    const f = build(win.el);
    const r = win.rect || { w: 0, h: 0 };
    f.tele.innerHTML = `WIN-${String(f.n).padStart(2, "0")} · ${Math.round(w ?? r.w)}×${Math.round(h ?? r.h)} · <b>▸▸▸</b>`;
  }
  function setBrk(f, k, out = 18) {
    // k: 0 = off (pushed out, 1.25x), 1 = locked on the corners
    const d = (1 - k) * out;
    const s = 1 + 0.25 * (1 - k);
    f.brk[0].style.opacity = f.brk[1].style.opacity = k;
    f.brk[0].style.transform = `translate(${-d}px, ${-d}px) scale(${s})`;
    f.brk[1].style.transform = `translate(${d}px, ${d}px) scale(${s})`;
  }

  // ---- wallpaper ----
  function micro(lines) {
    return lines.map(esc).join("<br>");
  }
  function wallpaper(wallEl) {
    const screen = wallEl.parentNode;
    ov = D("ef-ov");
    screen.insertBefore(ov, screen.querySelector("#hud"));
    let ticks = "";
    for (let x = 120; x < SW; x += 120) ticks += `<i style="left:${x}px"></i>`;
    wallEl.innerHTML = `<div class="ef-wdots"></div>
      <div class="ef-gl h" style="top:132px"></div><div class="ef-gl h" style="top:948px"></div>
      <div class="ef-gl v" style="left:212px"></div><div class="ef-gl v" style="left:1708px"></div>
      <div class="ef-wticks">${ticks}</div>
      <div class="ef-wbrk tl"></div><div class="ef-wbrk br"></div>
      <div class="ef-wmark"><span class="ef-wd"></span>CLOCKMOST<em>// DESKTOP · SIDE DISPLAY</em></div>
      <div class="ef-micro" style="left:232px;top:150px">${micro(["SYS.ARR // 1920×1080 · 60HZ", "GRID 120 · CUT 16 · RAIL 3", "LAYER STACK · 4 PLATES", "STATUS: NOMINAL"])}</div>
      <div class="ef-micro" style="right:232px;top:150px;text-align:right">${micro(["NODE CLOCKMOST.COM", "LINK 192.168.10.110", "TANG ▪ OK · VAULT ▪ OK", "SEC.62 // FROZEN"])}</div>
      <div class="ef-micro" style="left:232px;bottom:150px">${micro(["▸▸▸ SNAP 1,0,.7,1", "▸▸▸ SETTLE .16,1,.3,1", "T 120 / 280 / 600"])}</div>
      <div class="ef-wcode">EF-11 · LYR</div>`;
    // structure windows the moment the harness creates them (before first paint)
    new MutationObserver((ms) => {
      for (const m of ms)
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement) || !n.classList.contains("win")) continue;
          build(n);
          if (ctx) n.dataset.efNew = "1";
        }
    }).observe(screen.querySelector("#wins"), { childList: true });
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach((w) => tele(w));
  }

  // ---- OPEN: rail draws → back-plate slides in → surface wipes over it → title → content → brackets ----
  async function onOpen(win) {
    const el = win.el;
    const f = build(el);
    tele(win);
    const sw = win.rect.w - OFF;
    const alive = claim(f, "gk");
    claim(f, "fq");
    f.orail.style.transformOrigin = "0 50%";
    const ok = await tween(
      660,
      (e) => {
        // 1 · yellow rail across the top edge (SNAP, 120 ms)
        const a = SNAP(P(e, 0, 130));
        const railOp = 1 - P(e, 440, 140);
        f.orail.style.opacity = railOp;
        f.orail.style.transform = `scaleX(${a})`;
        f.odia.style.opacity = railOp * (a > 0 ? 1 : 0);
        f.odia.style.transform = `translateX(${a * sw}px) rotate(45deg)`;
        // 2 · back-plate slides in from the left (SETTLE)
        const b = P(e, 50, 320, SETTLE);
        f.back.style.transform = `translateX(${(1 - b) * -96}px)`;
        f.back.style.opacity = P(e, 50, 90);
        // 3 · surface slides over it with a wipe from the left, 60 ms later
        const s = P(e, 115, 320, SETTLE);
        const sx = (1 - s) * -44;
        f.surf.style.transform = `translateX(${sx}px)`;
        f.surf.style.clipPath = `inset(-3px ${(1 - s) * (sw + 6) - 3}px -3px -3px)`;
        f.wedge.style.transform = `translateX(${sx + s * sw}px)`;
        f.wedge.style.opacity = s > 0 && s < 1 ? clamp(s * 6) * (1 - P(s, 0.75, 0.25)) : 0;
        // 4 · title band wipes in, diamond fills, title text wipes
        const t = P(e, 200, 290, SETTLE);
        f.tb.style.transform = `translateX(${(1 - t) * -30}px)`;
        f.tb.style.clipPath = `inset(0 ${(1 - t) * 100}% 0 0)`;
        const tt = P(e, 260, 280, SETTLE);
        f.title.style.clipPath = `inset(0 ${(1 - tt) * 100}% 0 0)`;
        f.fill.style.transform = `scale(${P(e, 380, 120, SNAP)})`;
        f.tele.style.opacity = P(e, 400, 180);
        f.tele.style.transform = `translateX(${(1 - P(e, 400, 240, SETTLE)) * 14}px)`;
        // 5 · content fades / rises in, trailing the surface
        const c = P(e, 290, 330, SETTLE);
        f.ct.style.opacity = P(e, 290, 200);
        f.ct.style.transform = `translate(${(1 - c) * -22}px, ${(1 - c) * 8}px)`;
        // 6 · focus rail drops down the left edge, brackets snap onto the corners
        f.rail.style.clipPath = `inset(0 0 ${(1 - P(e, 400, 240, SNAP)) * 100}% 0)`;
        setBrk(f, P(e, 520, 130, SNAP));
        f.title.style.color = mix(INK3, INK, P(e, 300, 200));
      },
      alive,
    );
    if (ok) {
      clear([f.orail, f.odia, f.back, f.surf, f.wedge, f.tb, f.title, f.fill, f.tele, f.ct, f.rail, ...f.brk], ["opacity", "transform", "clipPath", "color", "transformOrigin"]);
    }
    delete el.dataset.efNew;
  }

  // ---- CLOSE: content cuts → title retracts left → surface wipes off right → back-plate collapses into the rail → diamond ----
  async function onClose(win) {
    const el = win.el;
    const f = build(el);
    const sw = win.rect.w - OFF;
    const alive = claim(f, "gk");
    claim(f, "fq");
    const seam = ctx && ctx.seam;
    if (seam) {
      claim(seamO, "k");
      const o0 = parseFloat(seam.style.opacity || "1");
      tween(140, (e) => (seam.style.opacity = o0 * (1 - P(e, 0, 140))));
    }
    f.back.style.transformOrigin = "50% 0";
    f.orail.style.transformOrigin = "50% 50%";
    await tween(
      420,
      (e) => {
        const k = P(e, 0, 90, SNAP);
        setBrk(f, 1 - k, 14);
        f.rail.style.clipPath = `inset(0 0 ${P(e, 0, 120, SNAP) * 100}% 0)`;
        const c = P(e, 0, 110, SNAP);
        f.ct.style.opacity = 1 - c;
        f.ct.style.transform = `translateX(${c * 16}px)`;
        const t = P(e, 50, 140, SNAP);
        f.tb.style.transform = `translateX(${-t * 30}px)`;
        f.tb.style.clipPath = `inset(0 ${t * 100}% 0 0)`;
        const s = P(e, 110, 170, SNAP);
        const sx = s * 46;
        f.surf.style.transform = `translateX(${sx}px)`;
        f.surf.style.clipPath = `inset(-3px -3px -3px ${s * (sw + 6) - 3}px)`;
        f.wedge.style.transform = `translateX(${sx + s * sw}px)`;
        f.wedge.style.opacity = s > 0 && s < 1 ? 1 : 0;
        // back-plate lingers ~60 ms, then collapses up into the yellow rail
        const q = P(e, 230, 100, SNAP);
        f.back.style.transform = `translateY(${-q * OFF}px) scaleY(${Math.max(0.004, 1 - q)})`;
        f.back.style.opacity = 1 - P(e, 320, 20);
        f.orail.style.opacity = P(e, 260, 50) * (1 - P(e, 400, 20));
        const z = P(e, 320, 80, SNAP);
        f.orail.style.transform = `scaleX(${1 - z})`;
        f.odia.style.opacity = P(e, 330, 20) * (1 - P(e, 395, 25));
        f.odia.style.transform = `translateX(${sw / 2}px) rotate(45deg) scale(${1 - P(e, 390, 30)})`;
      },
      alive,
    );
    el.style.visibility = "hidden";
  }

  // ---- SNAP / RATIO: plates move on a 40 ms stagger (back-plate leads, content trails) ----
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
    // when a neighbour is about to open, hand over early so its layers overlap the slide
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

  // ---- FOCUS: rail slides down the new window's left edge, diamond fills, brackets snap on ----
  function onFocus(win, prev) {
    if (prev && prev.el && prev.el._ef && prev.el.isConnected) focusOut(prev.el._ef);
    const f = build(win.el);
    if (win.el.dataset.efNew) return; // onOpen choreographs the newcomer
    const alive = claim(f, "fq");
    tween(
      300,
      (e) => {
        f.rail.style.clipPath = `inset(0 0 ${(1 - P(e, 20, 240, SNAP)) * 100}% 0)`;
        f.fill.style.transform = `scale(${P(e, 60, 140, SNAP)})`;
        setBrk(f, P(e, 160, 130, SNAP));
        f.title.style.color = mix(INK3, INK, P(e, 40, 200));
      },
      alive,
    ).then((ok) => ok && clear([f.rail, f.fill, f.title, ...f.brk], ["clipPath", "transform", "color", "opacity"]));
  }
  function focusOut(f) {
    const alive = claim(f, "fq");
    tween(
      220,
      (e) => {
        f.rail.style.clipPath = `inset(0 0 ${P(e, 0, 180, SNAP) * 100}% 0)`;
        f.fill.style.transform = `scale(${1 - P(e, 0, 120, SNAP)})`;
        setBrk(f, 1 - P(e, 0, 110, SNAP), 12);
        f.title.style.color = mix(INK, INK3, P(e, 40, 180));
      },
      alive,
    ).then((ok) => ok && clear([f.rail, f.fill, f.title, ...f.brk], ["clipPath", "transform", "color", "opacity"]));
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

  // ---- HUD: layered panels slide in from the right, each over the previous ----
  function hudMarkup(data) {
    const d = new Date();
    const notes = data.notes.slice(0, 3).map((n, i) => {
      const at = n.indexOf(":");
      const src = at > 0 ? n.slice(0, at) : "System";
      const txt = at > 0 ? n.slice(at + 1).trim() : n;
      return card(
        "note",
        `<span class="sq"></span><div class="nb"><div class="src">${esc(src.toUpperCase())}<span>NTF-0${i + 1}</span></div><div class="tx">${esc(txt)}</div></div>`,
      );
    });
    const tray = data.tray
      .map((t, i) => `<span class="ti"><span class="ef-dia${i < 2 || i === 3 ? " on" : ""}"><i></i></span>${esc(t.toUpperCase())}</span>`)
      .join("");
    return `<div class="efh">
      <div class="efh-dim"></div>
      <div class="efh-plate"><div class="efh-dots"></div><div class="efh-prail"></div>
        <div class="ef-micro efh-pm">${micro(["HUD // OVERLAY · L2", `STACK ${data.notes.length + 3} PANELS`, "INPUT: H · ESC · EDGE"])}</div></div>
      <div class="efh-stack">
        ${card(
          "clock",
          `<div class="lab"><span class="ef-dia on"><i></i></span>SYS.TIME <span class="sl">//</span> LOCAL<span class="r">UTC+01 · ${d.getFullYear()}</span></div>
          <div class="time"><span class="echo">${esc(data.time)}</span><span class="dg">${esc(data.time)}</span></div>
          <div class="date"><span>${esc(data.date.replace(",", "").toUpperCase())}</span><span class="strip"></span><span class="ix">CM-DSK</span></div>`,
          `<div class="tri"></div>`,
        )}
        ${card("tray", `<div class="lab">TRAY <span class="sl">//</span> ${data.tray.length} ACTIVE</div><div class="tr">${tray}</div>`)}
        ${notes.join("")}
        ${card("search", `<span class="chev">›››</span><span class="ph">SEARCH <span class="sl">//</span> APPS · FILES · COMMANDS</span><span class="caret"></span>`)}
      </div></div>`;
  }
  function card(kind, inner, pre = "") {
    return `<div class="efh-card ${kind}"><div class="bk"></div><div class="fc"><div class="in">${inner}</div>${pre}</div></div>`;
  }
  function hudParts(hudEl) {
    const root = hudEl.querySelector(".efh");
    if (!root) return null;
    const cards = [...root.querySelectorAll(".efh-card")].map((c) => ({ bk: c.children[0], fc: c.children[1], inn: c.children[1].firstElementChild }));
    return {
      root,
      dim: root.querySelector(".efh-dim"),
      plate: root.querySelector(".efh-plate"),
      cards,
      tri: root.querySelector(".tri"),
      echo: root.querySelector(".echo"),
    };
  }
  function shift(p) {
    if (!ctx) return;
    const v = p ? `translateX(${-2 * p}px)` : "";
    ctx.wins.style.transform = v;
    ctx.seam.style.transform = v;
  }
  async function hudShow(hudEl, data) {
    const alive = claim(hudO, "g");
    hudEl.innerHTML = hudMarkup(data);
    const h = hudParts(hudEl);
    const n = h.cards.length;
    await tween(
      300 + 60 + (n - 1) * 55 + 360,
      (e) => {
        const p = P(e, 0, 380, SETTLE);
        h.plate.style.transform = `translateX(${(1 - p) * 620}px)`;
        h.dim.style.opacity = P(e, 0, 300);
        shift(p);
        h.cards.forEach((c, i) => {
          const s = 70 + i * 55;
          const b = P(e, s, 300, SETTLE);
          c.bk.style.transform = `translateX(${(1 - b) * 170}px)`;
          c.bk.style.opacity = P(e, s, 80);
          const q = P(e, s + 50, 300, SETTLE);
          c.fc.style.transform = `translateX(${(1 - q) * 230}px)`;
          c.fc.style.clipPath = `inset(0 0 0 ${(1 - q) * 100}%)`;
          const ci = P(e, s + 120, 260, SETTLE);
          c.inn.style.opacity = P(e, s + 120, 160);
          c.inn.style.transform = `translateX(${(1 - ci) * 26}px)`;
        });
        h.tri.style.transform = `scaleX(${P(e, 300, 220, SNAP)})`;
        const g = P(e, 220, 420, SETTLE);
        h.echo.style.transform = `translateX(${lerp(26, 3, g)}px) scaleX(1.01)`;
        h.echo.style.opacity = 0.18 * P(e, 220, 120);
      },
      alive,
    );
  }
  async function hudHide(hudEl) {
    const alive = claim(hudO, "g");
    const h = hudParts(hudEl);
    if (!h) return;
    const n = h.cards.length;
    const ST = 28;
    const ps = n * ST + 30;
    const ok = await tween(
      ps + 200,
      (e) => {
        h.cards.forEach((c, i) => {
          const s = (n - 1 - i) * ST; // last in, first out
          c.inn.style.opacity = 1 - P(e, s, 60);
          const q = P(e, s, 150, SNAP);
          c.fc.style.transform = `translateX(${q * 240}px)`;
          c.fc.style.clipPath = `inset(0 0 0 ${q * 100}%)`;
          const b = P(e, s + 35, 150, SNAP);
          c.bk.style.transform = `translateX(${b * 190}px)`;
          c.bk.style.opacity = 1 - P(e, s + 150, 35);
        });
        const p = P(e, ps, 200, SNAP);
        h.plate.style.transform = `translateX(${p * 620}px)`;
        h.dim.style.opacity = 1 - P(e, ps - 60, 240);
        shift(1 - p);
      },
      alive,
    );
    if (ok && alive()) {
      hudEl.innerHTML = "";
      shift(0);
    }
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
