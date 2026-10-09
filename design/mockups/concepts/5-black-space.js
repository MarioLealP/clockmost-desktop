// 5 · Black-Space Survey (concept: GPT) — the apps are ordinary surfaces; the gaps briefly
// reveal themselves as a deep, measurable space. Every effect is transitional: at rest there is
// only a 10 px trench and a faint rim on the focused window.
(() => {
  "use strict";
  const GAP = 10;
  const X0 = 150,
    IW = 1620,
    IH = 300; // the HUD incision (screen px)
  let ctx = null;
  let focusCount = 0;
  let hudGen = 0;
  let hudOpen = false;
  let query = "";
  let tickTimer = 0;

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerpRect = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
  const setRect = (el, r) => Object.assign(el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // next frame: rAF, with a timer fallback (headless virtual time hands out very few rAFs)
  function nextFrame(cb) {
    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      cb();
    };
    requestAnimationFrame(go);
    setTimeout(go, 34);
  }
  function tween(ms, fn, alive = () => true) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = () => {
        const now = performance.now(); // rAF timestamps can lag performance.now (headless virtual time)
        if (!alive()) return res(false);
        const t = Math.min(1, (now - t0) / ms);
        fn(t);
        if (t < 1) nextFrame(step);
        else res(true);
      };
      nextFrame(step);
    });
  }
  function mk(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  const seamEl = () => document.getElementById("seam");
  const winsEl = () => document.getElementById("wins");

  // ---- window frame: a rim plus a travelling light ------------------------------------------
  function deco(win) {
    if (win._bs) return;
    win._bs = true;
    mk("div", "bs-rim", win.el);
    win.sweep = mk("div", "bs-sweep", win.el);
  }
  function sweep(win, ms = 1150) {
    if (!win.sweep) return;
    const el = win.sweep;
    const tok = (el._tok = (el._tok || 0) + 1);
    tween(
      ms,
      (t) => {
        el.style.backgroundPosition = `${100 - 100 * ease(t)}% 0`;
        el.style.opacity = String(Math.min(clamp(t / 0.12), clamp((1 - t) / 0.18)));
      },
      () => el._tok === tok,
    );
  }

  // ---- the trench ------------------------------------------------------------------------------
  function prepSeam() {
    const s = seamEl();
    if (s._bs) return s;
    s._bs = true;
    s.classList.add("bs-trench");
    mk("div", "bs-wall l", s);
    mk("div", "bs-wall r", s);
    const ticks = mk("div", "bs-ticks", s);
    // sparse depth ticks: long on the walls near the midpoint, shorter (deeper) further away
    for (let y = 27; y < 1080; y += 54) {
      const d = Math.abs(y - 540) / 540;
      const len = Math.round(lerp(4, 2, d));
      const major = (y - 27) % 216 === 0;
      for (const side of ["l", "r"]) {
        const i = mk("i", side, ticks);
        i.style.top = y + "px";
        i.style.width = (major ? len + 1 : len) + "px";
        i.style.opacity = String(lerp(1, 0.35, d));
      }
      if (major) {
        const c = mk("i", "c", ticks);
        c.style.top = y + "px";
      }
    }
    s._drop = mk("div", "bs-drop", s);
    s._glow = mk("div", "bs-glow", s);
    return s;
  }
  function trackSeam() {
    const L = ctx?.state.list;
    if (!L || L.length !== 2) return;
    const s = prepSeam();
    const a = L[0].el;
    s.style.display = "block";
    s.style.left = parseFloat(a.style.left) + parseFloat(a.style.width) + "px";
    s.style.width = GAP + "px";
  }
  function sideLight() {
    const s = seamEl();
    const L = ctx?.state.list || [];
    s.classList.toggle("lf", L.length === 2 && ctx.state.focused === L[0]);
    s.classList.toggle("rf", L.length === 2 && ctx.state.focused === L[1]);
  }
  function dropLight() {
    const s = prepSeam();
    // a single light sinks into the trench: it narrows, shortens and blurs as it goes deeper
    tween(1300, (t) => {
      const e = out(t);
      s._drop.style.opacity = String(Math.min(clamp(t / 0.1), 1 - e));
      s._drop.style.transform = `scale(${lerp(1, 0.3, e)}, ${lerp(1.2, 0.04, e)})`;
      s._drop.style.filter = `blur(${lerp(0, 1.5, e)}px)`;
      s._glow.style.opacity = String(Math.min(clamp(t / 0.12), 1 - out(t)));
    });
  }
  function ticksOn() {
    clearTimeout(tickTimer);
    prepSeam().classList.add("ticks");
  }

  // ---- slit (open / close) ---------------------------------------------------------------------
  function slit(r) {
    const s = mk("div", "bs-slit", winsEl());
    setRect(s, r);
    // perspective lines into the void + a few depth marks: preserveAspectRatio none, so the
    // depth unfolds as the rectangle opens
    let marks = "";
    for (let k = 1; k <= 4; k++) {
      const f = k / 5;
      const ix = 7 * f,
        iy = 9 * f;
      marks += `<rect x="${ix}" y="${iy}" width="${100 - 2 * ix}" height="${100 - 2 * iy}" fill="none" stroke="rgba(170,185,220,${0.16 - k * 0.03})" vector-effect="non-scaling-stroke"/>`;
    }
    s.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${marks}
      <rect x="7" y="9" width="86" height="82" fill="none" stroke="rgba(180,195,230,.22)" vector-effect="non-scaling-stroke"/>
      <path d="M0 0L7 9M100 0L93 9M0 100L7 91M100 100L93 91" stroke="rgba(190,205,240,.3)" vector-effect="non-scaling-stroke"/></svg>`;
    return s;
  }
  function pin(x, y) {
    const p = mk("div", "bs-pin", winsEl());
    Object.assign(p.style, { left: x + "px", top: y + "px" });
    tween(520, (t) => {
      p.style.opacity = String(1 - t * t);
      p.style.transform = `scaleX(${lerp(1, 0.05, t * t)})`;
    }).then(() => p.remove());
  }

  // ---- socket (snap) ---------------------------------------------------------------------------
  function socket(r) {
    const s = mk("div", "bs-socket", winsEl(), `<b></b><b></b><b></b><b></b><span>${Math.round(r.w)} × ${Math.round(r.h)}</span>`);
    setRect(s, r);
    return s;
  }

  // ---- HUD incision ----------------------------------------------------------------------------
  const ICONS = {
    Discord:
      '<path d="M8 9c3-1.5 11-1.5 14 0l2 10c-2 2-4 2.5-5 2.5l-1-2h-6l-1 2c-1 0-3-.5-5-2.5z"/><circle cx="12" cy="15" r="1.3"/><circle cx="18" cy="15" r="1.3"/>',
    Steam: '<circle cx="15" cy="15" r="10"/><circle cx="19" cy="12" r="3"/><path d="M5.5 18l7 3"/><circle cx="12" cy="20" r="2"/>',
    KeePassXC: '<circle cx="10" cy="15" r="5"/><path d="M15 15h11M22 15v4M25 15v3"/>',
    "Wi-Fi": '<path d="M4 12c6-6 16-6 22 0M8 16c4-4 10-4 14 0M12 20c2-2 4-2 6 0"/><circle cx="15" cy="24" r="1"/>',
    Volume: '<path d="M5 12h4l6-5v16l-6-5H5z"/><path d="M19 11c2 2 2 6 0 8M22 8c4 4 4 10 0 14"/>',
  };
  function contourPts(kind, p) {
    // opening contour in screen px, from the left lip, along the far bottom edge, to the right lip
    const X1 = X0 + IW;
    if (kind === "open") {
      const cx = X0 + IW / 2;
      const hw = (IW / 2) * p.w;
      return [
        [cx - hw, 0],
        [cx - hw, p.h],
        [cx + hw, p.h],
        [cx + hw, 0],
      ];
    }
    // zipper: closed to the left of xz, a slanted run of Z px, open to the right
    const Z = 260,
      xz = p.xz;
    const pts = [];
    const a = clamp(xz, X0, X1),
      b = clamp(xz + Z, X0, X1);
    const yAt = (x) => IH * clamp((x - xz) / Z);
    pts.push([a, yAt(a) > 0 ? 0 : 0], [a, yAt(a)], [b, yAt(b)], [X1, yAt(X1)], [X1, 0]);
    return pts;
  }
  function drawOpening(h, pts) {
    const poly = pts.map(([x, y]) => `${x - X0}px ${y}px`).join(",");
    h.inc.style.clipPath = `polygon(${X0 - X0}px 0px, ${poly}, ${IW}px 0px)`;
    const d = pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)).join("");
    const deep = Math.max(...pts.map((p) => p[1]));
    const k = clamp(deep / 40);
    h.edge.innerHTML = `
      <g transform="translate(0,12)"><path d="${d}" fill="none" stroke="rgba(0,0,0,${0.32 * k})" stroke-width="30" stroke-linejoin="round"/></g>
      <g transform="translate(0,4)"><path d="${d}" fill="none" stroke="rgba(0,0,0,${0.55 * k})" stroke-width="9" stroke-linejoin="round"/></g>
      <g transform="translate(0,1.6)"><path d="${d}" fill="none" stroke="#24252b" stroke-width="3" stroke-linejoin="round"/></g>
      <path d="${d}" fill="none" stroke="rgba(222,230,248,${0.55 * k})" stroke-width="1.1" stroke-linejoin="round"/>`;
  }
  function buildHud(hud, data) {
    hud.innerHTML = "";
    const inc = mk("div", "bs-inc", hud);
    setRect(inc, { x: X0, y: 0, w: IW, h: IH });
    let ruler = "";
    for (let x = 60; x < IW - 60; x += 40)
      ruler += `<path d="M${x} ${IH - 2}L${36 + (x - 36) * (1548 / 1548)} ${IH - 2 - (x % 200 === 60 ? 9 : 5)}" stroke="rgba(190,205,240,.22)"/>`;
    let depth = "";
    for (let k = 1; k < 6; k++)
      depth += `<path d="M${k * 6} ${k * 47}H${k * 6 + 8}" stroke="rgba(190,205,240,.25)"/><path d="M${IW - k * 6} ${k * 47}H${IW - k * 6 - 8}" stroke="rgba(190,205,240,.25)"/>`;
    inc.innerHTML = `<svg viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bsFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050506"/><stop offset=".7" stop-color="#0b0c0f"/><stop offset="1" stop-color="#040405"/></linearGradient>
        <radialGradient id="bsBloom" cx=".5" cy=".38" r=".35"><stop offset="0" stop-color="#151720"/><stop offset="1" stop-color="#151720" stop-opacity="0"/></radialGradient>
        <linearGradient id="bsBot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1d1e24"/><stop offset="1" stop-color="#030304"/></linearGradient>
        <linearGradient id="bsL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#16171c"/><stop offset="1" stop-color="#020203"/></linearGradient>
        <linearGradient id="bsR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#16171c"/><stop offset="1" stop-color="#020203"/></linearGradient>
      </defs>
      <rect x="36" y="0" width="${IW - 72}" height="${IH - 32}" fill="url(#bsFar)"/>
      <rect x="36" y="0" width="${IW - 72}" height="${IH - 32}" fill="url(#bsBloom)"/>
      <path d="M0 0H36V${IH - 32}L0 ${IH}Z" fill="url(#bsL)"/>
      <path d="M${IW} 0H${IW - 36}V${IH - 32}L${IW} ${IH}Z" fill="url(#bsR)"/>
      <path d="M0 ${IH}L36 ${IH - 32}H${IW - 36}L${IW} ${IH}Z" fill="url(#bsBot)"/>
      <path d="M36 0V${IH - 32}H${IW - 36}V0" fill="none" stroke="rgba(0,0,0,.9)" stroke-width="2"/>
      ${ruler}${depth}
    </svg>
    <div class="bs-far">
      <div class="bs-niches">${data.tray
        .map((t) => {
          const key = Object.keys(ICONS).find((k) => t.startsWith(k)) || "Volume";
          return `<div class="bs-niche"><div class="n"><svg viewBox="0 0 30 30">${ICONS[key]}</svg></div><div class="lb">${t}</div></div>`;
        })
        .join("")}</div>
      <div class="bs-clock"><div class="t">${data.time}</div><div class="d">${data.date}</div></div>
      <div class="bs-notes">${data.notes
        .map((n, i) => {
          const s = 1 - i * 0.085;
          const st = `transform:translateX(${i * 22}px) scale(${s});opacity:${1 - i * 0.26};filter:blur(${i * 0.25}px);border-left-color:rgba(208,218,242,${0.7 - i * 0.22})`;
          return `<div class="bs-note" style="${st}"><span class="dm">−${i}</span><span>${n}</span></div>`;
        })
        .join("")}</div>
      <div class="bs-search"><div class="ph">type to survey</div><div class="ln"></div></div>
    </div>`;
    const svgNS = "http://www.w3.org/2000/svg";
    const edge = document.createElementNS(svgNS, "svg");
    edge.setAttribute("class", "bs-edge");
    edge.setAttribute("viewBox", "0 0 1920 420");
    hud.appendChild(edge);
    const q = mk("div", "bs-q", hud, '<span class="txt"></span><span class="car"></span>');
    const res = mk("div", "bs-res", hud);
    return { inc, edge, q, res };
  }
  let H = null;
  const APPS = ["Firefox", "Discord", "kitty", "KeePassXC", "Steam", "System Settings", "Files", "Krita", "Spectacle", "OBS Studio"];
  function typeKey(ch) {
    if (!H) return;
    const first = !query;
    query = ch === "\b" ? query.slice(0, -1) : query + ch;
    H.q.querySelector(".txt").textContent = query;
    if (first && query) {
      // the search line leaves the far wall and comes forward to the screen plane
      H.inc.querySelector(".bs-search").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
      H.q.animate(
        [
          {
            opacity: 0.5,
            transform: "translateY(-6px) scale(.86)",
            filter: "brightness(.4)",
            boxShadow: "inset 0 0 0 1px rgba(210,220,245,.1), 0 0 0 rgba(0,0,0,0)",
          },
          {
            opacity: 1,
            transform: "translateY(88px) scale(1)",
            filter: "brightness(1)",
            boxShadow: "inset 0 0 0 1px rgba(210,220,245,.22), 0 30px 70px rgba(0,0,0,.8)",
          },
        ],
        { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
      );
      H.res.style.transform = "translateY(88px)";
    }
    if (!query) {
      H.q.animate(
        [
          { opacity: 1, transform: "translateY(88px)" },
          { opacity: 0, transform: "translateY(-6px) scale(.86)" },
        ],
        { duration: 300, easing: "ease-in", fill: "forwards" },
      );
      H.inc.querySelector(".bs-search").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "forwards" });
    }
    const hits = query ? APPS.filter((a) => a.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];
    H.res.innerHTML = hits.map((h) => `<div>${h}</div>`).join("");
    [...H.res.children].forEach((c, i) => setTimeout(() => c.classList.add("on"), 40 + i * 45));
  }
  addEventListener(
    "keydown",
    (e) => {
      if (!hudOpen || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Backspace" && query) typeKey("\b");
      else if (e.key.length === 1 && /[\w .+-]/.test(e.key) && !(e.key.toLowerCase() === "h" && !query)) typeKey(e.key);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );

  // ---- wallpaper: near-black backing with faint grain and survey marks -------------------------
  function wallpaper(wall) {
    const c = mk("canvas", "", wall);
    c.width = 1920;
    c.height = 1080;
    const g = c.getContext("2d");
    const img = g.createImageData(1920, 1080);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < img.data.length; i += 4) {
      const y = (i / 4 / 1920) | 0;
      const v = 7 + rnd() * 5 + (y / 1080) * -2;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v + 2;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const vg = g.createRadialGradient(960, 480, 100, 960, 540, 1150);
    vg.addColorStop(0, "rgba(30,33,44,.35)");
    vg.addColorStop(1, "rgba(0,0,0,.6)");
    g.fillStyle = vg;
    g.fillRect(0, 0, 1920, 1080);
    g.strokeStyle = "rgba(170,185,220,.07)";
    g.lineWidth = 1;
    for (let x = 160; x < 1920; x += 320)
      for (let y = 135; y < 1080; y += 270) {
        g.beginPath();
        g.moveTo(x - 7, y + 0.5);
        g.lineTo(x + 8, y + 0.5);
        g.moveTo(x + 0.5, y - 7);
        g.lineTo(x + 0.5, y + 8);
        g.stroke();
      }
  }

  window.CONCEPT = {
    gap: GAP,
    wallpaper,
    ready(c) {
      ctx = c;
      c.state.list.forEach(deco);
      prepSeam();
      sideLight();
    },
    async onOpen(win) {
      deco(win);
      const r = win.rect;
      const st = win.el.style;
      st.opacity = "0";
      const cx = r.x + r.w / 2,
        cy = r.y + r.h / 2;
      const s = slit({ x: cx, y: cy - 3, w: 0, h: 6 });
      // 1: a dark slit draws itself across the intended bounds
      await tween(260, (t) => {
        const e = out(t);
        setRect(s, { x: cx - (r.w / 2) * e, y: cy - 3, w: r.w * e, h: 6 });
      });
      // 2: it opens to the full rectangle — a recess into black
      await tween(400, (t) => {
        const e = ease(t);
        setRect(s, { x: r.x, y: lerp(cy - 3, r.y, e), w: r.w, h: lerp(6, r.h, e) });
      });
      // 3: the app rises out of the recess to the screen plane; depth survives only at the frame
      await tween(420, (t) => {
        const e = out(t);
        st.opacity = String(e);
        st.transform = `scale(${lerp(0.955, 1, e)})`;
        st.filter = `brightness(${lerp(0.2, 1, e)})`;
        s.style.opacity = String(1 - e);
      });
      st.transform = st.filter = st.opacity = "";
      s.remove();
      sweep(win);
    },
    async onClose(win) {
      const r = win.rect;
      const st = win.el.style;
      const se = seamEl();
      se.style.opacity = "0";
      const s = slit(r);
      s.style.opacity = "0";
      s.style.background = "transparent";
      // 1: the app darkens and its edges fall away into a recess
      await tween(320, (t) => {
        const e = ease(t);
        st.filter = `brightness(${lerp(1, 0.18, e)})`;
        st.transform = `scale(${lerp(1, 0.975, e)})`;
        s.style.opacity = String(e);
      });
      st.opacity = "0";
      s.style.background = "#000";
      const cx = r.x + r.w / 2,
        cy = r.y + r.h / 2;
      // 2: it narrows to a dark opening…
      await tween(320, (t) => {
        const e = ease(t);
        setRect(s, { x: r.x, y: lerp(r.y, cy - 3, e), w: r.w, h: lerp(r.h, 6, e) });
      });
      // 3: …which seals shut from both ends
      await tween(240, (t) => {
        const e = ease(t);
        setRect(s, { x: lerp(r.x, cx, e), y: cy - 3, w: r.w * (1 - e), h: 6 });
      });
      s.remove();
      pin(cx, cy);
    },
    async onMove(win, from, to, place) {
      deco(win);
      if (ctx.state.list.length === 2) ticksOn();
      const sock = socket(to);
      // the destination reveals a recessed socket
      await tween(200, (t) => (sock.style.opacity = String(out(t))));
      win.el.classList.add("bs-lift");
      await tween(540, (t) => {
        setRect(win.el, lerpRect(from, to, ease(t)));
        trackSeam();
      });
      place(win, to);
      trackSeam();
      win.el.classList.remove("bs-lift");
      // seated flush: a rim highlight runs round the fit, the socket closes up
      sweep(win, 700);
      tween(420, (t) => (sock.style.opacity = String(1 - t * t))).then(() => sock.remove());
      await wait(120);
    },
    onFocus(win) {
      if (!win._bs || !ctx) return; // a fresh window: onOpen plays its own light
      sweep(win);
      sideLight();
      focusCount++;
      if (focusCount % 2 === 1 && ctx.state.list.length === 2) dropLight(); // occasional, not constant
    },
    seam(s) {
      if (!s.visible) return;
      prepSeam();
      s.seam.style.opacity = "1";
      if (ctx) sideLight();
      if (!s.changing) {
        clearTimeout(tickTimer);
        tickTimer = setTimeout(() => s.seam.classList.remove("ticks"), 380);
      }
    },
    async hudShow(hud, data) {
      const gen = ++hudGen;
      const alive = () => gen === hudGen;
      query = "";
      H = buildHud(hud, data);
      hudOpen = true;
      drawOpening(H, contourPts("open", { w: 0, h: 0 }));
      // far-wall contents surface one by one, from the depth toward legibility
      const parts = [
        [H.inc.querySelector(".bs-clock"), 380],
        [H.inc.querySelector(".bs-niches"), 520],
        [H.inc.querySelector(".bs-notes"), 640],
        [H.inc.querySelector(".bs-search"), 780],
      ];
      const T = 1300;
      // a shallow cut first runs along the edge, then the image lifts off its backing
      const ok = await tween(
        T,
        (t) => {
          const ms = t * T;
          const w = out(clamp(ms / 300));
          const h = Math.min(IH, IH * ease(clamp((ms - 80) / 720)) + 6 * w);
          drawOpening(H, contourPts("open", { w, h }));
          for (const [el, d] of parts) {
            const p = out(clamp((ms - d) / 480));
            el.style.opacity = String(p);
            el.style.transform = `scale(${lerp(0.93, 1, p)})`;
            el.style.filter = `brightness(${lerp(0.25, 1, p)})`;
          }
        },
        alive,
      );
      if (ok) parts.forEach(([el]) => (el.style.filter = "none"));
    },
    async hudHide(hud) {
      const gen = ++hudGen;
      const alive = () => gen === hudGen;
      hudOpen = false;
      const h = H;
      if (!h) return;
      if (query)
        h.q.animate(
          [
            { opacity: 1, transform: "translateY(88px)" },
            { opacity: 0, transform: "translateY(0) scale(.86)" },
          ],
          { duration: 220, fill: "forwards" },
        );
      h.res.innerHTML = "";
      query = "";
      // closes from one end like a zipper — no zipper graphic, just the seam of the cut travelling
      const ok = await tween(560, (t) => drawOpening(h, contourPts("zip", { xz: lerp(X0 - 260, X0 + IW, ease(t)) })), alive);
      if (ok && alive()) {
        hud.innerHTML = "";
        H = null;
      }
    },
  };
})();
