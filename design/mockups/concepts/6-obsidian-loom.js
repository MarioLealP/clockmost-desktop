(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 24;
  const NS = "http://www.w3.org/2000/svg";
  let ctx = null;
  let ov = null;
  let hudGen = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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

  function wallpaper(wallEl) {
    const parent = wallEl.parentNode;
    ov = S("svg", { class: "loom-ov", viewBox: `0 0 ${SW} ${SH}` });
    const hudNode = parent.querySelector("#hud");
    parent.insertBefore(ov, hudNode);

    wallEl.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="warp" width="12" height="1080" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="1080" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
          <line x1="6" y1="0" x2="6" y2="1080" stroke="rgba(255,255,255,0.01)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#05080c"/>
      <rect width="100%" height="100%" fill="url(#warp)"/>
    </svg>`;
  }

  function ready(c) {
    ctx = c;
  }

  async function onOpen(win) {
    const { x, y, w, h } = win.rect;
    win.el.style.opacity = "0";
    win.el.classList.add("weaving");

    const g = S("g", {}, ov);
    const countX = 20;
    const countY = 12;
    const warp = [];
    const weft = [];
    for (let i = 0; i <= countX; i++) warp.push(S("line", { class: "th-warp" }, g));
    for (let i = 0; i <= countY; i++) weft.push(S("line", { class: "th-weft" }, g));
    const weaveRect = S("rect", { class: "th-surface", x, y, width: w, height: h }, g);

    await tween(600, (t) => {
      const p1 = Math.min(1, t * 2.5);
      const e1 = eOut(p1);
      const p2 = Math.max(0, (t - 0.3) / 0.7);
      const e2 = eInOut(p2);

      for (let i = 0; i <= countX; i++) {
        const tx = x + (i / countX) * w;
        const startY = i % 2 === 0 ? 0 : SH;
        const endY = i % 2 === 0 ? y + h : y;
        const curY = startY + (endY - startY) * e1;
        const finalY1 = lerp(startY, y, e2);
        const finalY2 = lerp(curY, y + h, e2);
        warp[i].setAttribute("x1", tx);
        warp[i].setAttribute("x2", tx);
        warp[i].setAttribute("y1", finalY1);
        warp[i].setAttribute("y2", finalY2);
        warp[i].style.opacity = String(1 - e2);
      }
      for (let i = 0; i <= countY; i++) {
        const ty = y + (i / countY) * h;
        const startX = i % 2 === 0 ? 0 : SW;
        const endX = i % 2 === 0 ? x + w : x;
        const curX = startX + (endX - startX) * e1;
        const finalX1 = lerp(startX, x, e2);
        const finalX2 = lerp(curX, x + w, e2);
        weft[i].setAttribute("x1", finalX1);
        weft[i].setAttribute("x2", finalX2);
        weft[i].setAttribute("y1", ty);
        weft[i].setAttribute("y2", ty);
        weft[i].style.opacity = String(1 - e2);
      }
      weaveRect.style.opacity = String(e2 * 0.8);
      win.el.style.opacity = String(e2);
      win.el.style.filter = `brightness(${1 + (1 - e2) * 2}) blur(${(1 - e2) * 3}px)`;
    });

    win.el.classList.remove("weaving");
    win.el.style.opacity = "";
    win.el.style.filter = "";
    g.remove();
  }

  async function onClose(win) {
    const { x, y, w, h } = win.rect;
    win.el.style.visibility = "hidden";

    const g = S("g", {}, ov);
    const cx = x + w / 2;
    const cy = y + h / 2;

    const threads = [];
    const count = 20;
    for (let i = 0; i < count; i++) {
      threads.push({
        el: S("line", { class: "th-snap" }, g),
        isWarp: i % 2 === 0,
        isFirstHalf: i % 4 < 2,
        ratio: Math.random(),
      });
    }

    const flash = S("circle", { cx, cy, r: 0, class: "th-flash" }, g);

    await tween(400, (t) => {
      const e = eOut(t);
      const ei = eInOut(t);

      flash.setAttribute("r", String(e * Math.max(w, h)));
      flash.style.opacity = String(1 - e);

      threads.forEach((th) => {
        if (th.isWarp) {
          const tx = x + w * th.ratio;
          const brokenTip = lerp(cy, th.isFirstHalf ? 0 : SH, ei);
          th.el.setAttribute("x1", tx);
          th.el.setAttribute("x2", tx);
          th.el.setAttribute("y1", th.isFirstHalf ? 0 : SH);
          th.el.setAttribute("y2", brokenTip);
        } else {
          const ty = y + h * th.ratio;
          const brokenTip = lerp(cx, th.isFirstHalf ? 0 : SW, ei);
          th.el.setAttribute("x1", th.isFirstHalf ? 0 : SW);
          th.el.setAttribute("x2", brokenTip);
          th.el.setAttribute("y1", ty);
          th.el.setAttribute("y2", ty);
        }
        th.el.style.opacity = String(1 - ei);
      });
    });
    g.remove();
  }

  async function onMove(win, from, to, place) {
    place(win, to);
    const el = win.el;
    const isResizing = from.w !== to.w || from.h !== to.h;

    const g = S("g", {}, ov);
    const splitLine = S("line", { class: "th-split" }, g);
    
    let splitX = to.x > 0 ? to.x - GAP / 2 : to.x + to.w + GAP / 2;
    if (!isResizing) {
      splitX = from.x + from.w / 2 < SW / 2 ? to.x + to.w + GAP / 2 : to.x - GAP / 2;
    }

    function twang(t) {
      if (t === 0 || t === 1) return t;
      const c4 = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    await tween(700, (t) => {
      const p1 = Math.min(1, t / 0.2);
      const p2 = Math.max(0, (t - 0.2) / 0.8);

      splitLine.setAttribute("x1", splitX);
      splitLine.setAttribute("x2", splitX);
      splitLine.setAttribute("y1", 0);
      splitLine.setAttribute("y2", String(SH * eOut(p1)));
      splitLine.style.opacity = String((1 - p2) * 0.8);

      const e = t < 0.2 ? 0 : twang(p2);
      el.style.left = lerp(from.x, to.x, e) + "px";
      el.style.top = lerp(from.y, to.y, e) + "px";
      el.style.width = lerp(from.w, to.w, e) + "px";
      el.style.height = lerp(from.h, to.h, e) + "px";
    });

    place(win, to);
    g.remove();
  }

  function onFocus(win) {
    if (win.el.classList.contains("weaving") || !ov) return;
    const { x, y, w, h } = win.rect;
    const g = S("g", {}, ov);
    const border = S("rect", { x, y, width: w, height: h, class: "lm-focus-flash" }, g);

    tween(250, (t) => {
      const e = eOut(t);
      border.style.strokeWidth = String(2 + (1 - e) * 6);
      border.style.opacity = String(1 - e);
    }).then(() => g.remove());
  }

  function updateSeam(seamEl, tension) {
    const b1 = seamEl.querySelector(".b1");
    const b2 = seamEl.querySelector(".b2");
    if (!b1) return;
    const freq = lerp(40, 80, tension);
    const amp = lerp(6, 2, tension);

    let d1 = "";
    let d2 = "";
    for (let y = 0; y <= SH; y += 5) {
      const x1 = GAP / 2 + Math.sin((y / freq) * Math.PI * 2) * amp;
      const x2 = GAP / 2 + Math.sin((y / freq + 0.5) * Math.PI * 2) * amp;
      d1 += (y === 0 ? "M" : "L") + `${x1.toFixed(1)} ${y} `;
      d2 += (y === 0 ? "M" : "L") + `${x2.toFixed(1)} ${y} `;
    }
    b1.setAttribute("d", d1);
    b2.setAttribute("d", d2);
  }

  function buildSeam(seamEl) {
    if (seamEl.querySelector(".lm-seam")) return;
    seamEl.innerHTML = `<svg class="lm-seam" width="${GAP}" height="${SH}" viewBox="0 0 ${GAP} ${SH}">
      <path class="braid b1" d=""/>
      <path class="braid b2" d=""/>
      <line class="core" x1="${GAP / 2}" y1="0" x2="${GAP / 2}" y2="${SH}"/>
    </svg>`;
    updateSeam(seamEl, 0);
  }

  function seamHook(s) {
    const el = s.seam;
    buildSeam(el);
    if (!s.visible) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    const core = el.querySelector(".core");

    if (s.changing) {
      el.classList.add("lm-chg");
      updateSeam(el, 1);
      core.style.opacity = "1";
    } else {
      el.classList.remove("lm-chg");
      tween(400, (t) => {
        updateSeam(el, 1 - eOut(t));
        core.style.opacity = String(1 - eOut(t));
      });
    }
  }

  function hudLayout(data) {
    const W2 = 1000;
    const H2 = 440;
    let L = "";

    L += `<text class="lm-time" x="40" y="140">${esc(data.time)}</text>`;
    L += `<text class="lm-date" x="40" y="180">${esc(data.date)}</text>`;

    L += `<rect class="lm-search-box" x="40" y="240" width="400" height="40"/>`;
    L += `<text class="lm-search-text" x="55" y="266">SEARCH SYSTEM...</text>`;

    L += `<text class="lm-section" x="500" y="60">TRAY</text>`;
    data.tray.slice(0, 5).forEach((t, i) => {
      L += `<circle class="lm-hole glowing" cx="520" cy="${90 + i * 36}" r="6"/>`;
      L += `<text class="lm-tray-item" x="540" y="${95 + i * 36}">${esc(t)}</text>`;
    });

    L += `<text class="lm-section" x="720" y="60">NOTIFICATIONS</text>`;
    data.notes.slice(0, 4).forEach((note, i) => {
      L += `<circle class="lm-hole glowing" cx="740" cy="${90 + i * 50}" r="6"/>`;
      L += `<line class="lm-thread" x1="740" y1="${90 + i * 50}" x2="755" y2="${90 + i * 50}"/>`;

      const at = note.indexOf(":");
      const src = at > 0 ? note.slice(0, at) : "SYS";
      const dsc = at > 0 ? note.slice(at + 1).trim() : note;
      L += `<text class="lm-note-src" x="765" y="${88 + i * 50}">${esc(src)}</text>`;
      L += `<text class="lm-note-dsc" x="765" y="${106 + i * 50}">${esc(dsc)}</text>`;
    });

    L += `<line class="lm-thread-dec" x1="0" y1="200" x2="${W2}" y2="200"/>`;
    L += `<line class="lm-thread-dec" x1="460" y1="0" x2="460" y2="${H2}"/>`;
    L += `<line class="lm-thread-dec" x1="680" y1="0" x2="680" y2="${H2}"/>`;

    return `<svg width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}">
      <defs>
        <pattern id="punch" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="2" fill="rgba(255,255,255,0.03)"/>
        </pattern>
      </defs>
      <path class="lm-slate-bg" d="M0 0 h${W2} v${H2 - 40} l-40 40 h-${W2 - 80} l-40 -40 Z"/>
      <rect x="0" y="0" width="${W2}" height="${H2}" fill="url(#punch)" pointer-events="none"/>
      ${L}
    </svg>`;
  }

  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    const W2 = 1000;
    const H2 = 440;
    const cx = SW / 2 - W2 / 2;
    hudEl.innerHTML = `<div class="lm-hud"><div class="lm-slate" style="left:${cx}px; top:-${H2}px; width:${W2}px; height:${H2}px;">${hudLayout(data)}</div></div>`;
    const slate = hudEl.querySelector(".lm-slate");

    await tween(500, (t) => {
      if (gen !== hudGen) return;
      const e = eOut(t);
      slate.style.top = `${-H2 + H2 * e}px`;
    });
  }

  async function hudHide(hudEl) {
    const gen = ++hudGen;
    const slate = hudEl.querySelector(".lm-slate");
    if (!slate) return;
    const H2 = 440;

    await tween(350, (t) => {
      if (gen !== hudGen) return;
      const e = eOut(t);
      slate.style.top = `${-H2 * e}px`;
    });
    if (gen === hudGen) hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
