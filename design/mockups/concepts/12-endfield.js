// 12 · Endfield (layered) — realization of design/briefs/11-endfield.md (brief untouched).
// Every element is a stack of plates on staggered timings: they shear apart mid-motion and
// lock aligned at rest; exits run the layers in reverse, faster than entries.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 10;
  const NS = "http://www.w3.org/2000/svg";
  const YEL = "#FFFA00";
  let ctx = null;
  let ov = null;
  let hudGen = 0;
  let seq = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
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
  function L(cls, win) {
    const e = document.createElement("div");
    e.className = cls;
    win.el.appendChild(e);
    return e;
  }

  function buildOverlay(screen) {
    if (ov) return;
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "ed-ov", viewBox: `0 0 ${SW} ${SH}` });
    screen.insertBefore(ov, hud);
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    wallEl.innerHTML = `<svg class="ed-wall" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">` +
      `<g class="ed-guides">` +
      `<line x1="0" y1="140" x2="${SW}" y2="140"/><line x1="0" y1="${SH - 140}" x2="${SW}" y2="${SH - 140}"/>` +
      `<line x1="180" y1="0" x2="180" y2="${SH}"/><line x1="${SW - 180}" y1="0" x2="${SW - 180}" y2="${SH}"/>` +
      `<path d="M150 106 L210 106 M180 76 L180 136 M${SW - 210} 106 L${SW - 150} 106 M${SW - 180} 76 L${SW - 180} 136"/>` +
      `</g></svg><div class="ed-dots"></div>` +
      `<div class="ed-micro m1">TLM // DECK-08 · NOMINAL<br>PWR 98.2% · O2 20.9 · LOOP Δ+0.3</div>` +
      `<div class="ed-micro m2">ORIGINUM FLOW 12.4/s<br>GRID 44-B · SYNC LOCK</div>` +
      `<div class="ed-micro m3">31.2°N · LOG 0447<br>SURVEY COMPLETE</div>`;
  }

  // ---- window plate stack: back-plate -> surface -> title band -> content ----
  function ensureLayers(win) {
    if (win._l) {
      if (win.rect) win._l.tele.textContent = teleText(win);
      return win._l;
    }
    win._id = ++seq;
    const back = L("ed-back", win);
    const surf = L("ed-surf", win);
    const trail = L("ed-trail", win);
    const frail = L("ed-frail", win);
    const bkTL = L("ed-bk tl", win);
    const bkBR = L("ed-bk br", win);
    const bar = win.el.querySelector(".titlebar");
    const dia = document.createElement("span");
    dia.className = "ed-dia";
    bar.insertBefore(dia, bar.firstChild);
    const tele = document.createElement("span");
    tele.className = "ed-tele";
    tele.textContent = teleText(win);
    bar.appendChild(tele);
    win._l = { back, surf, trail, frail, bkTL, bkBR, dia, tele, title: bar.querySelector(".title"), content: win.el.querySelector(".content") };
    restLayers(win);
    return win._l;
  }
  function teleText(win) {
    const id = String(win._id || 0).padStart(2, "0");
    const w = win.rect ? Math.round(win.rect.w) : 0;
    const h = win.rect ? Math.round(win.rect.h) : 0;
    return `WIN-${id} · ${w}×${h} · ▸▸▸`;
  }
  // resting state: plates locked aligned; focused window shows its left rail
  function restLayers(win) {
    const l = win._l;
    l.back.style.cssText = "";
    l.surf.style.cssText = "";
    l.trail.style.cssText = "";
    l.title.style.cssText = "";
    l.content.style.cssText = "";
    l.dia.style.cssText = "";
    l.frail.style.cssText = win.el.classList.contains("focused") ? "transform:scaleY(1);opacity:1" : "";
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach(ensureLayers);
  }

  // ---- OPEN (~600 ms): rail draws -> back-plate slides -> surface wipes -> title -> content -> brackets ----
  async function onOpen(win) {
    const l = ensureLayers(win);
    const el = win.el;
    el.classList.add("ed-drawing");
    await tween(600, (t) => {
      const rail = seg(t, 0, 0.2);
      l.trail.style.opacity = String(rail * (1 - seg(t, 0.85, 1)));
      l.trail.style.transform = `scaleX(${eOut(rail).toFixed(3)})`;
      const p2 = eOut(seg(t, 0.1, 0.57));
      l.back.style.opacity = String(p2);
      l.back.style.transform = `translate(${lerp(-80, 8, p2).toFixed(1)}px, 8px)`;
      const p3 = seg(t, 0.2, 0.67);
      l.surf.style.clipPath = p3 >= 1 ? "" : `inset(0 ${(100 - p3 * 100).toFixed(1)}% 0 0)`;
      const p4 = seg(t, 0.5, 0.8);
      l.title.style.opacity = String(p4);
      l.title.style.transform = p4 >= 1 ? "" : `translateX(${((1 - eOut(p4)) * -10).toFixed(1)}px)`;
      l.dia.style.transform = `rotate(45deg) scale(${(eOut(p4) || 0.001).toFixed(3)})`;
      const p5 = seg(t, 0.6, 0.9);
      l.content.style.opacity = String(p5);
      l.content.style.transform = p5 >= 1 ? "" : `translateY(${((1 - eOut(p5)) * 8).toFixed(1)}px)`;
      const p6 = eOut(seg(t, 0.78, 1));
      const bk = `scale(${(1.25 - 0.25 * p6).toFixed(3)})`;
      l.bkTL.style.transform = bk;
      l.bkBR.style.transform = bk;
      l.bkTL.style.opacity = String(p6);
      l.bkBR.style.opacity = String(p6);
    });
    el.classList.remove("ed-drawing");
    restLayers(win);
  }

  // ---- CLOSE (~340 ms): content cuts -> title retracts -> surface wipes right -> back collapses to rail -> diamond ----
  async function onClose(win) {
    const l = ensureLayers(win);
    const el = win.el;
    el.classList.add("ed-drawing");
    await tween(340, (t) => {
      l.content.style.opacity = String(1 - seg(t, 0, 0.24));
      const rt = seg(t, 0.12, 0.47);
      l.title.style.opacity = String(1 - rt);
      l.title.style.transform = `translateX(${(-22 * eInOut(rt)).toFixed(1)}px)`;
      l.dia.style.opacity = String(1 - rt);
      const sw = seg(t, 0.3, 0.65);
      l.surf.style.clipPath = `inset(0 0 0 ${(sw * 100).toFixed(1)}%)`;
      l.surf.style.opacity = String(1 - seg(t, 0.6, 0.72));
      const bk = seg(t, 0.62, 0.88);
      l.back.style.opacity = String(1 - bk);
      l.back.style.transform = `translate(8px, 8px) scaleY(${(1 - 0.9 * bk).toFixed(3)})`;
      l.trail.style.opacity = String(seg(t, 0.62, 0.7) * (1 - seg(t, 0.86, 1)));
      const nub = seg(t, 0.86, 1);
      l.trail.style.transform = `scaleX(${(Math.max(0.02, 1 - nub)).toFixed(3)})`;
      l.frail.style.opacity = "0";
      l.bkTL.style.opacity = "0";
      l.bkBR.style.opacity = "0";
    });
    el.style.visibility = "hidden";
    el.classList.remove("ed-drawing");
  }

  // ---- SNAP: plates shear with ~40 ms stagger; measuring rail + readout + chevrons ride the top edge ----
  async function onMove(win, from, to, place) {
    place(win, to);
    const l = ensureLayers(win);
    const el = win.el;
    l.tele.textContent = teleText(win);
    const dir = Math.sign(to.x - from.x) || Math.sign(to.w - from.w) || 1;
    const g = S("g", { class: "ed-snap" }, ov);
    const rail = S("line", { class: "ed-mrail" }, g);
    const lab = S("g", { class: "ed-mlab" }, g);
    const lr = S("rect", { height: 26 }, lab);
    const lt = S("text", {}, lab);
    const ratio = ctx ? ctx.state.ratio : [1, 1];
    const txt = `${ratio[0]} : ${ratio[1]}`;
    lt.textContent = txt;
    lr.setAttribute("width", txt.length * 9.5 + 22);
    const chevs = [-1, 0, 1].map((k) => S("path", {
      d: dir >= 0 ? `M${k * 20} 0 l10 8 l-10 8` : `M${k * 20} 0 l-10 8 l10 8`,
      class: "ed-chev",
    }, g));
    const run = tween(480, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e);
      const w = lerp(from.w, to.w, e);
      el.style.left = `${x.toFixed(1)}px`;
      el.style.width = `${w.toFixed(1)}px`;
      // back-plate leads, content trails -> the stack shears, then re-locks
      const lead = eInOut(seg(t, 0, 0.8));
      const trail = seg(t, 0.2, 1);
      l.back.style.transform = `translate(${(8 + dir * 12 * (1 - lead)).toFixed(1)}px, 8px)`;
      l.content.style.transform = `translateX(${(-dir * 9 * (1 - trail)).toFixed(1)}px)`;
      const op = seg(t, 0.08, 0.22) * (1 - seg(t, 0.78, 1));
      g.style.opacity = String(op);
      rail.setAttribute("x1", (x + 8).toFixed(1));
      rail.setAttribute("y1", to.y + 1);
      rail.setAttribute("x2", (x + w - 8).toFixed(1));
      rail.setAttribute("y2", to.y + 1);
      const lw = txt.length * 9.5 + 22;
      const mx = x + w / 2;
      const my = to.y - 30;
      lr.setAttribute("x", (mx - lw / 2).toFixed(1));
      lr.setAttribute("y", my - 13);
      lt.setAttribute("x", mx.toFixed(1));
      lt.setAttribute("y", (my + 1).toFixed(1));
      chevs.forEach((c, i) => {
        c.setAttribute("transform", `translate(${(mx + dir * (44 + i * 22)).toFixed(1)} ${my})`);
        c.style.opacity = String(op * (0.4 + 0.6 * ((t * 2 + i * 0.25) % 1)));
      });
      const seamEl = ctx && ctx.seam;
      if (seamEl && ctx.state.list.length === 2 && to.x === 0) seamEl.style.left = `${x + w}px`;
    }).then(() => {
      place(win, to);
      restLayers(win);
      l.tele.textContent = teleText(win);
      tween(220, (k) => (g.style.opacity = String(1 - k))).then(() => g.remove());
    });
    // when a neighbour is about to open, hand over early so the rail overlaps the drop
    const opening = ctx && ctx.state.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    if (opening) await Promise.race([run, ctx.sleep(300)]);
    else await run;
  }

  // ---- FOCUS (~240 ms): rail draws down the new left edge; old rail retracts upward. Quiet. ----
  function onFocus(win, prev) {
    if (prev && prev._l && prev !== win) {
      const pl = prev._l;
      tween(220, (t) => {
        const p = seg(t, 0, 1);
        pl.frail.style.transformOrigin = "bottom";
        pl.frail.style.transform = `scaleY(${(1 - p).toFixed(3)})`;
        pl.frail.style.opacity = String(1 - p * 0.4);
      }).then(() => {
        if (!prev.el.classList.contains("focused")) pl.frail.style.cssText = "";
      });
    }
    if (!win._l) return;
    const l = win._l;
    tween(240, (t) => {
      const p = eOut(seg(t, 0, 1));
      l.frail.style.transformOrigin = "top";
      l.frail.style.transform = `scaleY(${p.toFixed(3)})`;
      l.frail.style.opacity = "1";
    }).then(() => restLayers(win));
  }

  // ---- SEAM: steel hairline + barcode data-strip; a yellow segment runs it on change ----
  function seamHook(s) {
    const el = s.seam;
    if (!el.querySelector(".ed-seam")) {
      let bars = "";
      for (let x = 3, i = 0; x < GAP - 3; i++) {
        const w = 1 + rnd(i, 501) * 2.4;
        bars += `<rect x="${x.toFixed(1)}" y="14" width="${w.toFixed(1)}" height="${SH - 28}" class="${i % 3 ? "b1" : "b2"}"/>`;
        x += w + 1 + rnd(i, 503) * 3;
      }
      let ticks = "";
      for (let y = 40; y < SH; y += 44) ticks += `<line x1="1" y1="${y}" x2="${GAP - 1}" y2="${y}" class="tk"/>`;
      el.innerHTML = `<svg class="ed-seam" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">` +
        `<line class="hair" x1="${GAP / 2}" y1="0" x2="${GAP / 2}" y2="${SH}"/>${bars}${ticks}` +
        `<line class="runner" x1="${GAP / 2}" y1="-80" x2="${GAP / 2}" y2="80"/></svg>` +
        `<div class="ed-smratio"><span>1 : 1</span></div>`;
    }
    Object.assign(el.style, { display: "block", width: `${GAP}px`, transition: "opacity .3s" });
    if (!s.visible) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    const ratio = ctx ? ctx.state.ratio : [1, 1];
    el.querySelector(".ed-smratio span").textContent = `${ratio[0]} : ${ratio[1]}`;
    if (!s.changing) return;
    const runner = el.querySelector(".runner");
    const tag = el.querySelector(".ed-smratio");
    tween(320, (t) => {
      const y = lerp(-100, SH + 100, eInOut(t));
      runner.setAttribute("y1", y - 70);
      runner.setAttribute("y2", (y + 70).toFixed(1));
      runner.style.opacity = String(Math.sin(Math.PI * t));
      tag.style.opacity = String(seg(t, 0.15, 0.35) * (1 - seg(t, 0.65, 0.95)));
    }).then(() => {
      runner.style.opacity = "0";
      tag.style.opacity = "0";
    });
  }

  // ---- HUD: layered panels from the right — plate, clock card (+ the ONE tri-band), tray, notifs, search ----
  function hudRoot(data) {
    const tray = data.tray.slice(0, 5).map((t, i) =>
      `<div class="sl trow" style="--d:${360 + i * 50}ms"><span class="td${i === 0 ? " on" : ""}"></span>${esc(t).toUpperCase()}</div>`).join("");
    const notes = data.notes.slice(0, 3).map((n, i) => {
      const at = n.indexOf(":");
      const a = at > 0 ? n.slice(0, at) : "SYS";
      const b = at > 0 ? n.slice(at + 1).trim() : n;
      return `<div class="sl ncard" style="--d:${480 + i * 70}ms"><span class="nsrc">${esc(a).toUpperCase()}</span>${esc(b)}</div>`;
    }).join("");
    return `<div class="ed-hud"><div class="h-dim"></div><div class="h-stack">` +
      `<div class="sl h-plate" style="--d:0ms"></div>` +
      `<div class="sl h-clock" style="--d:120ms"><div class="triband"></div>` +
      `<div class="ck-g" data-t="${esc(data.time)}">${esc(data.time)}</div>` +
      `<div class="ck-date">${esc(data.date).toUpperCase()}</div></div>` +
      `<div class="sl h-tray" style="--d:260ms"><div class="hsec">TRAY</div>${tray}</div>` +
      `<div class="h-notes">${notes}</div>` +
      `<div class="sl h-search" style="--d:620ms"><span class="chev">›</span>SEARCH ENDFIELD</div>` +
      `</div></div>`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    hudEl.innerHTML = hudRoot(data);
    const root = hudEl.firstElementChild;
    if (ctx && ctx.wins) {
      ctx.wins.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
      ctx.wins.style.transform = "translate(-2px,-1px)";
    }
    root.getBoundingClientRect();
    tick(() => { if (gen === hudGen) root.classList.add("in"); });
    await new Promise((r) => setTimeout(r, 680));
  }
  async function hudHide(hudEl) {
    ++hudGen;
    const root = hudEl.querySelector(".ed-hud");
    if (ctx && ctx.wins) {
      ctx.wins.style.transition = "transform .3s cubic-bezier(1,0,.7,1)";
      ctx.wins.style.transform = "";
    }
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
