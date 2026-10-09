// 2 · Origami desk — windows are sheets of paper on a desk.
// open: a folded packet slides in, unfolds (quarters -> half -> full), content is printed.
// close: the sheet folds to a quarter, creases into a paper plane and flies off.
// snap: slide with a slight lift, land with a paper tap. HUD: a stamped receipt from a slot.
(() => {
  const GAP = 16;
  const EASE = "cubic-bezier(.45,.05,.25,1)";
  const OUT = "cubic-bezier(.2,.8,.2,1)";
  const sh = (o1, o2, ins) => `0 ${o1[0]}px ${o1[1]}px rgba(20,10,0,${o1[2]}), 0 ${o2[0]}px ${o2[1]}px rgba(10,5,0,${o2[2]}), inset 0 0 0 4000px rgba(70,45,15,${ins})`;
  const S_FLAT = sh([1, 1, 0.35], [3, 8, 0.25], 0.045);
  const S_FOCUS = sh([2, 3, 0.3], [18, 40, 0.6], 0);
  const S_LIFT = sh([4, 6, 0.25], [34, 60, 0.55], 0);
  const S_TAP = sh([0, 1, 0.6], [1, 3, 0.45], 0);
  let ctx = null;
  let hudAnims = [];

  // ---- tiny rAF tween engine (WAAPI-like keyframes), clocked by performance.now() ---------------
  // (headless virtual time does not advance CSS/Web Animations; this keeps screenshots honest)
  const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  function bez(a, b, c, d) {
    const X = (t) => 3 * a * (1 - t) ** 2 * t + 3 * c * (1 - t) * t * t + t ** 3;
    const Y = (t) => 3 * b * (1 - t) ** 2 * t + 3 * d * (1 - t) * t * t + t ** 3;
    return (x) => { let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; X(m) < x ? (lo = m) : (hi = m); } return Y((lo + hi) / 2); };
  }
  const easeCache = {};
  function ease(e) {
    if (!e || e === "linear") return (x) => x;
    if (easeCache[e]) return easeCache[e];
    const m = e.match(/cubic-bezier\(([^)]+)\)/);
    const f = m ? bez(...m[1].split(",").map(Number)) : e === "ease-in" ? bez(0.42, 0, 1, 1) : e === "ease-out" ? bez(0, 0, 0.58, 1) : bez(0.25, 0.1, 0.25, 1);
    return (easeCache[e] = f);
  }
  function lerpStr(a, b, t) {
    const na = String(a).match(NUM) || [], nb = String(b).match(NUM) || [];
    if (na.length !== nb.length) return t < 0.5 ? a : b;
    let i = 0;
    return String(b).replace(NUM, () => { const v = +na[i] + (+nb[i] - +na[i]) * t; i++; return +v.toFixed(4); });
  }
  const active = new Set();
  let raf = 0;
  function tick() {
    const now = performance.now();
    active.forEach((tw) => tw.step(now));
    raf = active.size ? requestAnimationFrame(tick) : 0;
  }
  function tween(el, kfs, o) {
    const n = kfs.length, offs = kfs.map((k) => k.offset);
    offs[0] = offs[0] ?? 0;
    offs[n - 1] = offs[n - 1] ?? 1;
    for (let i = 1; i < n - 1; i++) if (offs[i] == null) { let j = i; while (offs[j] == null) j++; for (let k = i; k < j; k++) offs[k] = offs[i - 1] + ((offs[j] - offs[i - 1]) * (k - i + 1)) / (j - i + 1); }
    const props = {};
    kfs.forEach((k, i) => Object.keys(k).forEach((p) => { if (p !== "offset" && p !== "easing") (props[p] = props[p] || []).push({ o: offs[i], v: k[p], e: ease(k.easing) }); }));
    const delay = o.delay || 0, duration = o.duration || 0, fill = o.fill || "none", gEase = ease(o.easing);
    const orig = {};
    Object.keys(props).forEach((p) => (orig[p] = el.style[p]));
    const apply = (prog) => {
      const g = gEase(Math.min(1, Math.max(0, prog)));
      for (const p in props) {
        const L = props[p];
        let v;
        if (g <= L[0].o) v = L[0].v;
        else if (g >= L[L.length - 1].o) v = L[L.length - 1].v;
        else for (let i = 0; i < L.length - 1; i++) if (g >= L[i].o && g <= L[i + 1].o) { const span = L[i + 1].o - L[i].o || 1; v = lerpStr(L[i].v, L[i + 1].v, L[i].e((g - L[i].o) / span)); break; }
        el.style[p] = v;
      }
    };
    const restore = () => { for (const p in orig) el.style[p] = orig[p]; };
    let resolve;
    const tw = {
      t0: performance.now(),
      finished: new Promise((r) => (resolve = r)),
      effect: { getTiming: () => ({ delay, duration }) },
      step(now) {
        const t = now - tw.t0 - delay;
        if (t < 0) { if (fill === "both" || fill === "backwards") apply(0); return; }
        if (t >= duration) { if (fill === "both" || fill === "forwards") apply(1); else restore(); active.delete(tw); resolve(); return; }
        apply(t / duration);
      },
      cancel() { if (active.delete(tw)) { if (fill === "none") restore(); resolve(); } },
      commitStyles() {},
    };
    active.add(tw);
    tw.step(tw.t0);
    if (!raf) raf = requestAnimationFrame(tick);
    return tw;
  }

  const anim = (el, kf, o) => tween(el, kf, { fill: "both", ...o });
  // wait on timers, not Animation.finished: timers are what headless virtual time advances
  const done = (...a) => {
    const ms = Math.max(0, ...a.map((x) => { const t = x.effect.getTiming(); return (t.delay || 0) + t.duration; }));
    return new Promise((r) => setTimeout(r, ms + 16));
  };
  const div = (cls, css, parent) => {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    if (css) Object.assign(d.style, css);
    if (parent) parent.appendChild(d);
    return d;
  };
  const px = (n) => n + "px";

  // ---- fold rig: the sheet split into four panels on two hinges --------------------------------
  // L (left half: LT + LB) and R (right half, hinged on its left edge: RT + RB).
  // LB / RB are hinged on their top edge. Folded state = R over L, bottoms up: a quarter packet.
  function makeRig(win, withContent) {
    const { x, y, w, h } = win.rect;
    const lw = Math.floor(w / 2), rw = w - lw, th = Math.floor(h / 2), bh = h - th;
    const rig = div("o-rig", { left: px(x), top: px(y), width: px(w), height: px(h) }, ctx.wins);
    const sheet = div("o-sheet", null, rig);
    const L = div("o-half", { left: 0, top: 0, width: px(lw), height: px(h) }, sheet);
    const R = div("o-half", { left: px(lw), top: 0, width: px(rw), height: px(h), transformOrigin: "0 50%" }, sheet);
    const face = (parent, fx, fy, fw, fh, ox, oy, origin) => {
      const f = div("o-face", { left: px(fx), top: px(fy), width: px(fw), height: px(fh), transformOrigin: origin || "50% 50%" }, parent);
      if (withContent) {
        const c = win.el.cloneNode(true);
        c.classList.remove("focused");
        Object.assign(c.style, { left: px(-ox), top: px(-oy), width: px(w), height: px(h), visibility: "visible" });
        f.appendChild(c);
        f.clone = c;
      }
      f.shade = div("o-shade", null, f);
      return f;
    };
    const LT = face(L, 0, 0, lw, th, 0, 0);
    const LB = face(L, 0, th, lw, bh, 0, th, "50% 0");
    const RT = face(R, 0, 0, rw, th, lw, 0);
    const RB = face(R, 0, th, rw, bh, lw, th, "50% 0");
    return { rig, sheet, L, R, LT, LB, RT, RB, lw, rw, th, bh, w, h, x, y };
  }

  // ---- wallpaper: dark walnut desk, warm lamp light ---------------------------------------
  function wallpaper(wall) {
    const c = document.createElement("canvas");
    c.width = 1920;
    c.height = 1080;
    const g = c.getContext("2d");
    g.fillStyle = "#3b2618";
    g.fillRect(0, 0, 1920, 1080);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // planks
    for (let p = 0; p < 6; p++) {
      const y0 = p * 180;
      g.fillStyle = `hsl(${22 + rnd() * 6}, ${38 + rnd() * 10}%, ${14 + rnd() * 5}%)`;
      g.fillRect(0, y0, 1920, 180);
      for (let i = 0; i < 70; i++) {
        const yy = y0 + rnd() * 180, a = 0.04 + rnd() * 0.09, f = 0.002 + rnd() * 0.004, ph = rnd() * 6, amp = 2 + rnd() * 9;
        g.strokeStyle = rnd() < 0.7 ? `rgba(15,7,2,${a})` : `rgba(200,140,80,${a * 0.6})`;
        g.lineWidth = 0.6 + rnd() * 2.2;
        g.beginPath();
        for (let xx = 0; xx <= 1920; xx += 24) {
          const yv = yy + Math.sin(xx * f + ph) * amp + Math.sin(xx * f * 3.7 + ph * 2) * amp * 0.25;
          xx ? g.lineTo(xx, yv) : g.moveTo(xx, yv);
        }
        g.stroke();
      }
      g.fillStyle = "rgba(8,4,1,.55)";
      g.fillRect(0, y0, 1920, 2);
    }
    const lamp = g.createRadialGradient(560, 120, 40, 700, 300, 1500);
    lamp.addColorStop(0, "rgba(255,190,120,.16)");
    lamp.addColorStop(0.5, "rgba(0,0,0,0)");
    lamp.addColorStop(1, "rgba(0,0,0,.5)");
    g.fillStyle = lamp;
    g.fillRect(0, 0, 1920, 1080);
    wall.appendChild(c);
  }

  // ---- open: packet slides in, unfolds, then gets printed --------------------------------
  async function onOpen(win) {
    win.el.style.visibility = "hidden";
    const r = makeRig(win, false);
    const { rig, R, LB, RB, lw, th } = r;
    rig.style.transformOrigin = `${lw / 2}px ${th / 2}px`;
    const gnd = div("o-ground", { left: px(r.x + 10), top: px(r.y + 18), width: px(lw - 20), height: px(th - 20) }, ctx.wins);
    // slide in from below with a little spin
    const dy = ctx.H - r.y + 120;
    // folded state inline too, so the very first frame is already a packet
    rig.style.transform = `translate(-140px, ${dy}px) rotate(14deg)`;
    R.style.transform = "rotateY(-180deg)";
    LB.style.transform = "rotateX(180deg)";
    RB.style.transform = "rotateX(-180deg)";
    const slide = anim(rig, [
      { transform: `translate(-140px, ${dy}px) rotate(14deg)`, easing: OUT },
      { transform: "translate(0px, 0px) rotate(0deg)" },
    ], { duration: 230 });
    anim(gnd, [{ transform: `translate(-140px, ${dy}px) rotate(14deg)`, easing: OUT, opacity: 1 }, { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 }], { duration: 230 });
    const fb = { transform: "rotateX(-180deg)" }, ff = { transform: "rotateX(0deg)" };
    const unB = [
      anim(LB, [{ transform: "rotateX(180deg)", easing: EASE }, { transform: "rotateX(0deg)" }], { duration: 210, delay: 200 }),
      anim(RB, [{ ...fb, easing: EASE }, ff], { duration: 210, delay: 200 }),
      anim(LB.shade, [{ opacity: 0.5 }, { opacity: 0 }], { duration: 210, delay: 200 }),
      anim(RB.shade, [{ opacity: 0.5 }, { opacity: 0 }], { duration: 210, delay: 200 }),
    ];
    anim(gnd, [{ height: px(th - 20) }, { height: px(r.h - 30) }], { duration: 210, delay: 200, composite: "replace" });
    const unR = [
      anim(R, [{ transform: "rotateY(-180deg)", easing: EASE }, { transform: "rotateY(0deg)" }], { duration: 230, delay: 380 }),
      anim(r.RT.shade, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 230, delay: 380 }),
      anim(RB.shade, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 230, delay: 380 }),
      anim(gnd, [{ width: px(lw - 20), opacity: 1 }, { width: px(r.w - 30), opacity: 0 }], { duration: 230, delay: 380 }),
    ];
    await done(slide, ...unB, ...unR);
    // print: swap the blank rig for the real sheet and run the print head down it
    win.el.style.visibility = "";
    rig.remove();
    gnd.remove();
    const head = div("o-head", { top: 0 }, win.el);
    const content = win.el.querySelector(".content"), title = win.el.querySelector(".titlebar");
    const D = 260;
    const pr = [
      anim(content, [{ clipPath: "inset(0 0 100% 0)", opacity: 0.6, easing: "cubic-bezier(.3,.1,.4,1)" }, { clipPath: "inset(0 0 0% 0)", opacity: 1 }], { duration: D, fill: "none" }),
      anim(head, [{ transform: "translateY(30px)", opacity: 1, easing: "cubic-bezier(.3,.1,.4,1)" }, { offset: 0.9, opacity: 1 }, { transform: `translateY(${win.rect.h}px)`, opacity: 0 }], { duration: D }),
      anim(title, [{ opacity: 0, transform: "scale(1.04)", filter: "blur(1px)" }, { offset: 0.35, opacity: 1, transform: "scale(1)", filter: "blur(0)" }, { opacity: 1 }], { duration: D, fill: "none" }),
      anim(win.el, [{ boxShadow: S_TAP, transform: "translateY(0px)" }, { boxShadow: S_FOCUS, transform: "translateY(-3px)" }], { duration: D, fill: "none" }),
    ];
    await done(...pr);
    head.remove();
  }

  // ---- close: fold to a quarter, crease into a plane, fly off --------------------------------
  async function onClose(win) {
    const r = makeRig(win, true);
    const { rig, R, LB, RB, lw, th } = r;
    win.el.style.visibility = "hidden";
    if (ctx) ctx.seam.style.opacity = 0;
    const gnd = div("o-ground", { left: px(r.x + 15), top: px(r.y + 20), width: px(r.w - 30), height: px(r.h - 30), opacity: 0.8 }, ctx.wins);
    const f1 = [
      anim(R, [{ transform: "rotateY(0deg)", easing: EASE }, { transform: "rotateY(-180deg)" }], { duration: 190 }),
      anim(r.RT.shade, [{ opacity: 0 }, { opacity: 0.5 }], { duration: 190 }),
      anim(RB.shade, [{ opacity: 0 }, { opacity: 0.5 }], { duration: 190 }),
      anim(gnd, [{ width: px(r.w - 30) }, { width: px(lw - 20) }], { duration: 190 }),
    ];
    const f2 = [
      anim(LB, [{ transform: "rotateX(0deg)", easing: EASE }, { transform: "rotateX(180deg)" }], { duration: 180, delay: 170 }),
      anim(RB, [{ transform: "rotateX(0deg)", easing: EASE }, { transform: "rotateX(-180deg)" }], { duration: 180, delay: 170 }),
      anim(LB.shade, [{ opacity: 0 }, { opacity: 0.45 }], { duration: 180, delay: 170 }),
      anim(gnd, [{ height: px(r.h - 30) }, { height: px(th - 20) }], { duration: 180, delay: 170, composite: "replace" }),
    ];
    // the printed side turns away at the half-way point of each fold (back of the paper is blank)
    const hideAt = (faces, ms) => setTimeout(() => faces.forEach((f) => f.clone && (f.clone.style.visibility = "hidden")), ms);
    hideAt([r.RT, RB], 95);
    hideAt([LB], 170 + 90);
    await done(...f1, ...f2);
    // the quarter packet becomes a plane
    const pw = div("o-plane-wrap", { left: px(r.x), top: px(r.y), width: px(lw), height: px(th) }, ctx.wins);
    const plane = div("o-plane", null, pw);
    rig.remove();
    gnd.remove();
    const crease = [
      anim(plane, [
        { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%)", easing: EASE },
        { clipPath: "polygon(0 6%, 100% 47%, 100% 53%, 0 94%, 22% 50%)" },
      ], { duration: 130 }),
      anim(pw, [
        { transform: "scale(1,1)", easing: EASE },
        { transform: "scale(.62,.36)" },
      ], { duration: 130 }),
    ];
    await done(...crease);
    // flight: tiny anticipation back, then a curved climb off the top-right
    const sx = 0.62, sy = 0.36;
    const fx = ctx.W - r.x + 300, fy = -(r.y + th + 260);
    const fly = anim(pw, [
      { transform: `translate(0px, 0px) rotate(0deg) scale(${sx},${sy})`, easing: "cubic-bezier(.4,0,.6,1)" },
      { offset: 0.18, transform: `translate(-30px, 18px) rotate(6deg) scale(${sx},${sy})`, easing: "cubic-bezier(.5,0,.9,.6)" },
      { offset: 0.55, transform: `translate(${fx * 0.32}px, ${fy * 0.12}px) rotate(-8deg) scale(${sx * 0.8},${sy * 0.8})` },
      { transform: `translate(${fx}px, ${fy}px) rotate(-32deg) scale(${sx * 0.45},${sy * 0.45})` },
    ], { duration: 340 });
    await done(fly);
    pw.remove();
  }

  // ---- snap: slide with lift, land with a paper tap ------------------------------------------
  function onMove(win, from, to, place) {
    if (ctx) ctx.seam.style.opacity = 0;
    place(win, to);
    const f = win.el.classList.contains("focused");
    const base = f ? "translateY(-3px)" : "translateY(0px)";
    const rest = f ? S_FOCUS : S_FLAT;
    const a = anim(win.el, [
      { left: px(from.x), width: px(from.w), transform: `${base} rotate(0deg)`, boxShadow: rest, easing: "cubic-bezier(.5,0,.2,1)" },
      { offset: 0.2, transform: "translateY(-8px) rotate(-.25deg)", boxShadow: S_LIFT },
      { offset: 0.78, left: px(to.x), width: px(to.w), transform: "translateY(-8px) rotate(0deg)", boxShadow: S_LIFT, easing: "cubic-bezier(.6,0,1,1)" },
      { offset: 0.88, transform: "translateY(1.5px) rotate(0deg)", boxShadow: S_TAP, easing: "cubic-bezier(.2,.8,.3,1)" },
      { left: px(to.x), width: px(to.w), transform: `${base} rotate(0deg)`, boxShadow: rest },
    ], { duration: 560, fill: "none" });
    return done(a);
  }

  // ---- focus: the focused sheet lifts; the other lies down with a little tap ------------------
  function onFocus(win, prev) {
    anim(win.el, [
      { transform: "translateY(0px)", boxShadow: S_FLAT },
      { offset: 0.6, transform: "translateY(-5px)", boxShadow: S_LIFT },
      { transform: "translateY(-3px)", boxShadow: S_FOCUS },
    ], { duration: 280, easing: "cubic-bezier(.3,.7,.2,1)", fill: "none" });
    if (prev && prev.el.isConnected) {
      anim(prev.el, [
        { transform: "translateY(-3px)", boxShadow: S_FOCUS },
        { offset: 0.7, transform: "translateY(1px)", boxShadow: S_TAP },
        { transform: "translateY(0px)", boxShadow: S_FLAT },
      ], { duration: 240, easing: "cubic-bezier(.5,0,.5,1)", fill: "none" });
    }
    tintSeam();
  }
  function tintSeam() {
    if (!ctx) return;
    const i = ctx.state.list.indexOf(ctx.state.focused);
    ctx.seam.dataset.f = i;
  }

  // ---- seam: two deckled paper edges with the desk showing through a torn line ----------------
  let seamBuilt = 0;
  function deckle(h, base, amp, seed) {
    let s = seed;
    const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    const pts = [];
    let d = base;
    for (let y = 0; y <= h; y += 3 + rnd() * 4) {
      d += (rnd() - 0.5) * amp;
      d = Math.max(base - amp, Math.min(base + amp, d)) + (rnd() < 0.08 ? (rnd() - 0.5) * amp * 1.6 : 0);
      pts.push([d, y]);
    }
    pts.push([base, h]);
    return pts;
  }
  function seam(s) {
    const el = s.seam;
    if (!s.visible) { el.innerHTML = ""; seamBuilt = 0; return; }
    if (s.changing) { el.style.opacity = 0; return; }
    tintSeam();
    if (seamBuilt !== s.h) {
      const g = s.w;
      const L = deckle(s.h, 6, 3.2, 11), R = deckle(s.h, g - 9, 4, 29);
      const lp = `M-2,0 ${L.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} L-2,${s.h} Z`;
      const rp = `M${g + 2},0 ${R.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} L${g + 2},${s.h} Z`;
      const lf = `M${L.map(([x, y]) => `${(x - 0.8).toFixed(1)},${y.toFixed(1)}`).join(" L")}`;
      const rf = `M${R.map(([x, y]) => `${(x + 0.8).toFixed(1)},${y.toFixed(1)}`).join(" L")}`;
      el.innerHTML = `<svg width="${g}" height="${s.h}" viewBox="0 0 ${g} ${s.h}"><path class="dl" d="${lp}"/><path class="fib" d="${lf}"/><path class="dr" d="${rp}"/><path class="fib" d="${rf}"/></svg>`;
      seamBuilt = s.h;
    }
    el.style.opacity = 1;
    anim(el, [{ clipPath: "inset(0 0 100% 0)", easing: "cubic-bezier(.3,.6,.3,1)" }, { clipPath: "inset(0 0 0% 0)" }], { duration: 320, fill: "none" });
  }

  // ---- HUD: receipt fed from a slot at the top edge; stamps hit; tickets slide out ----------
  async function hudShow(h, d) {
    hudAnims.forEach((a) => a.cancel());
    hudAnims = [];
    h.innerHTML = "";
    const dim = div("o-dim", null, h);
    const slot = div("o-slot", null, h);
    const wrap = div("o-rwrap", null, h);
    const rc = div("o-receipt", null, wrap);
    rc.innerHTML = `<div class="hdr">CLOCKMOST · DESK</div><div class="rule"></div>
      <div class="o-time"><span class="o-stamp">${d.time}</span></div>
      <div class="o-date"><span class="o-stamp">${d.date}</span></div>
      <div class="rule"></div><div class="lbl">TRAY</div>
      <div class="o-tray">${d.tray.map((t) => `<span class="o-stamp">${t}</span>`).join("")}</div>
      <div class="rule"></div><div class="o-foot">— ${d.notes.length} TICKETS —</div>`;
    const tk = div("o-tickets", null, h);
    tk.innerHTML = d.notes.map((n) => {
      const [who, ...rest] = n.split(":");
      return `<div class="o-ticket"><b>${who.trim()}</b>${rest.join(":").trim()}</div>`;
    }).join("");
    const A = (el, kf, o) => { const a = anim(el, kf, o); hudAnims.push(a); return a; };
    A(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    A(slot, [{ transform: "translateY(-16px)", easing: OUT }, { transform: "translateY(0px)" }], { duration: 140 });
    // feed: stepped like a printer, then a soft settle
    const feed = A(wrap, [
      { transform: "translateY(-104%)", easing: "cubic-bezier(.3,.6,.4,1)" },
      { offset: 0.82, transform: "translateY(1.5%)" },
      { transform: "translateY(0px)" },
    ], { duration: 460, delay: 80 });
    const stamps = [...rc.querySelectorAll(".o-stamp")];
    stamps.forEach((s, i) => {
      const rot = getComputedStyle(s).transform;
      const base = rot === "none" ? "" : rot;
      A(s, [
        { transform: `${base} scale(1.7)`, opacity: 0, easing: "cubic-bezier(.5,0,.8,.4)" },
        { offset: 0.7, transform: `${base} scale(.96)`, opacity: 1 },
        { transform: `${base} scale(1)`, opacity: 1 },
      ], { duration: 170, delay: 300 + Math.min(i, 2) * 70 + Math.max(0, i - 2) * 45 });
    });
    [...tk.children].forEach((t, i) => {
      const rot = [-2.5, 1.5, -1][i % 3];
      A(t, [
        { transform: `translateX(-260px) rotate(${rot - 6}deg)`, opacity: 0, easing: OUT },
        { offset: 0.3, opacity: 1 },
        { transform: `translateX(0px) rotate(${rot}deg)`, opacity: 1 },
      ], { duration: 360, delay: 460 + i * 90 });
    });
    await done(feed);
  }
  async function hudHide(h) {
    const wrap = h.querySelector(".o-rwrap");
    if (!wrap) return;
    hudAnims.forEach((a) => { try { a.commitStyles(); } catch (e) {} a.cancel(); });
    hudAnims = [];
    const ps = [
      anim(wrap, [
        { transform: "translateY(0px)", easing: "cubic-bezier(.5,0,.7,.4)" },
        { offset: 0.2, transform: "translateY(10px)", easing: "cubic-bezier(.6,0,.9,.5)" },
        { transform: "translateY(-108%)" },
      ], { duration: 340 }),
      anim(h.querySelector(".o-dim"), [{ opacity: 1 }, { opacity: 0 }], { duration: 320 }),
      anim(h.querySelector(".o-slot"), [{ transform: "translateY(0px)" }, { transform: "translateY(-16px)" }], { duration: 160, delay: 220 }),
      ...[...h.querySelectorAll(".o-ticket")].map((t, i) => {
        const tr = t.style.transform || "none";
        return anim(t, [
          { transform: tr, opacity: 1, easing: "cubic-bezier(.4,0,.9,.5)" },
          { offset: 0.15, transform: `${tr} translate(4px, -6px)` },
          { transform: `${tr} translate(${40 + i * 30}px, 260px) rotate(${i % 2 ? 22 : -18}deg)`, opacity: 0 },
        ], { duration: 320, delay: i * 30 });
      }),
    ];
    await done(...ps);
    h.innerHTML = "";
  }

  window.CONCEPT = {
    gap: GAP,
    wallpaper,
    ready(c) { ctx = c; tintSeam(); },
    onOpen,
    onClose,
    onMove,
    onFocus,
    seam,
    hudShow,
    hudHide,
  };
})();
