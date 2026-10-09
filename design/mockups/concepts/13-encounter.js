// 13 · Wild Encounter (JRPG battle): every window is a monster jumping out of tall grass.
// They slash in with screen-shake and a filled HP bar, dissolve into EXP and gil, dash with
// afterimages, get target-locked on focus, queue in a turn ticker, and H opens the battle menu.
(() => {
  "use strict";
  const SW = 1920;
  const SH = 1080;
  const GAP = 24;
  const NS = "http://www.w3.org/2000/svg";
  let ctx = null;
  let ov = null;
  let fx = null;
  let hudGen = 0;
  let seamTok = 0;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eOutBack = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rnd = (i, s) => {
    const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const LV = { firefox: 14, discord: 9, kitty: 21 };
  const NAME = { firefox: "Firefox", discord: "Discord", kitty: "Kitty" };

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

  function buildOverlay(screen) {
    if (ov) return;
    const hud = screen.querySelector("#hud");
    ov = S("svg", { class: "jr-ov", viewBox: `0 0 ${SW} ${SH}` });
    ov.innerHTML = `<defs>
      <linearGradient id="jr-slash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity=".95"/>
        <stop offset="1" stop-color="#cfe4ff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="jr-spark" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#ffe97a" stop-opacity=".9"/>
        <stop offset="1" stop-color="#ffe97a" stop-opacity="0"/>
      </radialGradient>
    </defs>`;
    fx = document.createElement("div");
    fx.className = "jr-fx";
    screen.insertBefore(ov, hud);
    screen.insertBefore(fx, hud);
  }

  function wallpaper(wallEl) {
    buildOverlay(wallEl.parentNode);
    let stars = "";
    for (let i = 0; i < 70; i++) {
      stars += `<circle cx="${(rnd(i, 601) * SW).toFixed(0)}" cy="${(rnd(i, 603) * 620).toFixed(0)}" ` +
        `r="${(0.8 + rnd(i, 605) * 1.6).toFixed(1)}" class="${i % 3 ? "s1" : "s2"}" style="--d:${(rnd(i, 607) * 5).toFixed(1)}s"/>`;
    }
    wallEl.innerHTML = `<svg class="jr-wall" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="xMidYMax slice">` +
      `<g class="jr-stars">${stars}</g>` +
      `<circle class="jr-moon" cx="1560" cy="190" r="86"/><circle class="jr-mglow" cx="1560" cy="190" r="150"/>` +
      `<g class="jr-cloud c1"><ellipse cx="420" cy="240" rx="180" ry="34"/><ellipse cx="560" cy="220" rx="140" ry="28"/></g>` +
      `<g class="jr-cloud c2"><ellipse cx="1150" cy="330" rx="220" ry="36"/><ellipse cx="1300" cy="310" rx="150" ry="28"/></g>` +
      `<path class="jr-far" d="M0 720 L220 560 L430 700 L700 540 L950 710 L1230 570 L1500 710 L1720 600 L1920 700 L1920 1080 L0 1080 Z"/>` +
      `<path class="jr-near" d="M0 850 L260 760 L520 860 L820 770 L1100 870 L1400 780 L1700 870 L1920 810 L1920 1080 L0 1080 Z"/>` +
      `<path class="jr-castle" d="M880 770 v-70 h24 v-40 h18 v-24 h10 v24 h18 v40 h24 v70 Z M876 770 h102 M895 770 v14 M965 770 v14"/>` +
      `</svg><div class="jr-walltag">WILD AREA · ROUTE 13 · TALL GRASS</div>`;
  }

  // per-window battle chrome: HP bar, select cursor, level tag
  function ensureChrome(win) {
    if (win._j) return win._j;
    const hp = document.createElement("div");
    hp.className = "hp";
    hp.innerHTML = `<span>HP</span><div class="hptrack"><i></i></div>`;
    win.el.insertBefore(hp, win.el.firstChild);
    const bar = win.el.querySelector(".titlebar");
    const cur = document.createElement("span");
    cur.className = "jr-cursor";
    cur.textContent = "▸";
    bar.insertBefore(cur, bar.firstChild);
    const lv = document.createElement("span");
    lv.className = "jr-lv";
    lv.textContent = `Lv.${LV[win.kind] || 5}`;
    bar.appendChild(lv);
    win._j = { fill: hp.querySelector("i") };
    return win._j;
  }

  function ready(c) {
    ctx = c;
    c.state.list.forEach((w) => {
      const j = ensureChrome(w);
      j.fill.style.width = "100%";
    });
  }

  // ---- OPEN: ENCOUNTER — flash, shake, triple slash, alert bubble, HP fills ----
  async function onOpen(win) {
    const j = ensureChrome(win);
    const el = win.el;
    const r = { ...win.rect };
    el.classList.add("jr-spawning");
    el.style.opacity = "0";
    j.fill.style.width = "0%";
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = S("g", { class: "jr-open" }, ov);
    const flash = S("rect", { x: 0, y: 0, width: SW, height: SH, class: "jr-flash" }, g);
    const slashes = [0.3, 0.5, 0.7].map((f) =>
      S("rect", { x: r.x - 60, y: r.y + r.h * f - 9, width: r.w + 120, height: 18, fill: "url(#jr-slash)", transform: `rotate(-16 ${cx} ${(r.y + r.h * f).toFixed(0)})` }, g));
    const spark = S("circle", { cx, cy, r: 10, fill: "url(#jr-spark)" }, g);
    const bub = S("g", { class: "jr-alert" }, g);
    S("circle", { cx: r.x + r.w - 40, cy: r.y - 44, r: 22, class: "jr-bub" }, bub);
    const excl = S("text", { x: r.x + r.w - 40, y: r.y - 36, class: "jr-excl" }, bub);
    excl.textContent = "!";
    await tween(620, (t) => {
      flash.style.opacity = String(0.85 * (1 - seg(t, 0, 0.14)));
      const pop = eOutBack(seg(t, 0.12, 0.62));
      const sh = Math.sin(t * 55) * 12 * (1 - seg(t, 0.3, 0.62));
      el.style.opacity = String(seg(t, 0.12, 0.2));
      el.style.transform = `translateX(${sh.toFixed(1)}px) scale(${clamp(pop, 0.6, 1.12).toFixed(3)})`;
      el.style.transformOrigin = "50% 60%";
      slashes.forEach((s, i) => {
        const p = seg(t, 0.18 + i * 0.07, 0.5 + i * 0.07);
        s.style.opacity = String(Math.sin(Math.PI * clamp(p)));
      });
      const sp = seg(t, 0.3, 0.62);
      spark.setAttribute("r", (10 + sp * 130).toFixed(0));
      spark.style.opacity = String(0.9 * (1 - sp));
      const bp = seg(t, 0.05, 0.3);
      bub.style.opacity = String(bp * (1 - seg(t, 0.42, 0.6)));
      bub.setAttribute("transform", `translate(${cx} ${cy - 60}) scale(${(eOutBack(clamp(bp * 1.2)) || 0.01).toFixed(2)}) translate(${-cx} ${-(cy - 60)})`);
      j.fill.style.width = `${(eOut(seg(t, 0.45, 0.95)) * 100).toFixed(0)}%`;
      g.style.opacity = String(1 - seg(t, 0.9, 1));
    });
    el.style.opacity = el.style.transform = el.style.transformOrigin = "";
    el.classList.remove("jr-spawning");
    g.remove();
  }

  // ---- CLOSE: DEFEATED — HP drains, white-out flicker, dissolves into EXP + gil ----
  async function onClose(win) {
    const j = ensureChrome(win);
    const el = win.el;
    const r = { ...win.rect };
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = S("g", { class: "jr-close" }, ov);
    const exp = S("text", { x: cx, y: cy - 20, class: "jr-exp" }, g);
    exp.textContent = `+${120 + Math.round(r.w / 24)} EXP`;
    const gil = S("text", { x: cx, y: cy + 14, class: "jr-gil" }, g);
    gil.textContent = `+${20 + Math.round(r.h / 48)} GIL`;
    j.fill.style.transition = "width .18s linear";
    j.fill.style.width = "0%";
    await tween(520, (t) => {
      const flick = t < 0.35 ? (((t * 11) % 1 < 0.5) ? 2.6 : 1) : 1;
      const out = seg(t, 0.35, 1);
      el.style.filter = `brightness(${flick.toFixed(1)})`;
      el.style.opacity = String(1 - out);
      el.style.transform = `translateY(${(-34 * eInOut(out)).toFixed(1)}px)`;
      const fp = seg(t, 0.45, 1);
      [exp, gil].forEach((tx, i) => {
        tx.setAttribute("y", cy + (i ? 14 : -20) - fp * 90);
        tx.style.opacity = String(fp * (1 - seg(t, 0.8, 1)) + (1 - fp) * 0);
        if (fp === 0) tx.style.opacity = "0";
      });
      exp.style.opacity = String(seg(t, 0.45, 0.55) * (1 - seg(t, 0.82, 1)));
      gil.style.opacity = String(seg(t, 0.52, 0.62) * (1 - seg(t, 0.86, 1)));
    });
    el.style.visibility = "hidden";
    el.style.opacity = el.style.transform = el.style.filter = "";
    j.fill.style.transition = "";
    g.remove();
  }

  // ---- SNAP: DASH — afterimage ghost, dust kicked up, little hop ----
  async function onMove(win, from, to, place) {
    place(win, to);
    ensureChrome(win);
    const el = win.el;
    const g = S("g", { class: "jr-snap" }, ov);
    const ghost = S("rect", { x: from.x, y: from.y, width: from.w, height: from.h, class: "jr-ghost" }, g);
    const dust = [];
    for (let i = 0; i < 6; i++) {
      dust.push({
        e: S("circle", { r: (3 + rnd(i, 611) * 4).toFixed(1), class: "jr-dust" }, g),
        x: from.x + rnd(i, 613) * from.w,
        d: 30 + rnd(i, 617) * 90,
      });
    }
    const run = tween(460, (t) => {
      const e = eInOut(t);
      const x = lerp(from.x, to.x, e);
      const w = lerp(from.w, to.w, e);
      el.style.left = `${x.toFixed(1)}px`;
      el.style.width = `${w.toFixed(1)}px`;
      el.style.transform = `translateY(${(-16 * Math.sin(Math.PI * t)).toFixed(1)}px)`;
      ghost.style.opacity = String(0.5 * (1 - t));
      dust.forEach((du, i) => {
        const p = seg(t, i * 0.06, 0.7 + i * 0.04);
        du.e.setAttribute("cx", (du.x - Math.sign(to.x - from.x || 1) * du.d * p).toFixed(1));
        du.e.setAttribute("cy", (to.y + to.h - 14 - p * 46).toFixed(1));
        du.e.style.opacity = String(0.8 * (1 - p));
      });
    }).then(() => {
      place(win, to);
      el.style.left = el.style.width = el.style.transform = "";
      tween(240, (k) => (g.style.opacity = String(1 - k))).then(() => g.remove());
    });
    // when a neighbour is about to burst in, hand over early so the dash overlaps the slash
    const opening = ctx && ctx.state.list.some((w) => w !== win && w.el.style.visibility === "hidden");
    if (opening) await Promise.race([run, ctx.sleep(280)]);
    else await run;
  }

  // ---- FOCUS: TARGETED — a lock ping ripples out of the chosen window ----
  function onFocus(win) {
    if (!ov || !win.rect) return;
    const r = { ...win.rect };
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = S("g", { class: "jr-focus" }, ov);
    const ring = S("circle", { cx, cy, r: 20, class: "jr-ping" }, g);
    const tick1 = S("path", { d: `M${cx - 44} ${cy}h22 M${cx + 22} ${cy}h22 M${cx} ${cy - 44}v22 M${cx} ${cy + 22}v22`, class: "jr-cross" }, g);
    tween(320, (t) => {
      ring.setAttribute("r", (20 + eOut(t) * 130).toFixed(0));
      ring.style.opacity = String(0.85 * (1 - t));
      tick1.style.opacity = String(Math.sin(Math.PI * clamp(t * 1.15)));
    }).then(() => g.remove());
  }

  // ---- SEAM: TURN TICKER — party order pips; they swap and flash on change ----
  function seamHook(s) {
    const el = s.seam;
    if (!el.querySelector(".jr-ticker")) {
      el.innerHTML = `<div class="jr-ticker"><div class="pip p0">◆</div>` +
        `<div class="tlabel"><span>TURN</span></div><div class="pip p1">◆</div></div>`;
    }
    Object.assign(el.style, { display: "block", width: `${GAP}px`, transition: "opacity .3s" });
    if (!s.visible) {
      el.style.opacity = "0";
      return;
    }
    el.style.opacity = "1";
    const tag = el.querySelector(".tlabel span");
    if (!s.changing) return;
    const my = ++seamTok;
    el.classList.add("hot");
    tag.textContent = "SWITCH!";
    el.querySelector(".p0").textContent = "◇";
    setTimeout(() => {
      if (my !== seamTok) return;
      el.classList.remove("hot");
      tag.textContent = "TURN";
      el.querySelector(".p0").textContent = "◆";
    }, 480);
  }

  // ---- HUD: BATTLE MENU — typewriter encounter text, commands, party status ----
  function fullText(data, kind) {
    return `Wild ${NAME[kind] || kind.toUpperCase()} appeared!  ${data.notes[0] || "It eyes your cursor..."}`;
  }
  async function hudShow(hudEl, data) {
    const gen = ++hudGen;
    const kind = ctx && ctx.state.focused ? ctx.state.focused.kind : "firefox";
    const text = fullText(data, kind);
    const party = data.tray.slice(0, 4).map((t, i) =>
      `<div class="prow"><span class="pnm">${esc(t).toUpperCase().slice(0, 10)}</span>` +
      `<span class="bar hp"><i style="width:${(45 + rnd(i, 619) * 50).toFixed(0)}%"></i></span>` +
      `<span class="bar mp"><i style="width:${(30 + rnd(i, 621) * 60).toFixed(0)}%"></i></span></div>`).join("");
    hudEl.innerHTML = `<div class="jr-hud"><div class="jr-status"><div class="phead">PARTY</div>${party}</div>` +
      `<div class="jr-msg"><span class="typed"></span><span class="caret">▼</span></div>` +
      `<div class="jr-cmd"><div class="crow on"><span>▸</span>FIGHT</div><div class="crow"><span></span>MAGIC</div>` +
      `<div class="crow"><span></span>ITEM</div><div class="crow"><span></span>RUN</div></div></div>`;
    const root = hudEl.querySelector(".jr-hud");
    const typed = hudEl.querySelector(".typed");
    root.getBoundingClientRect();
    tick(() => { if (gen === hudGen) root.classList.add("in"); });
    await tween(Math.max(420, text.length * 14), (t) => {
      if (gen !== hudGen) return;
      typed.textContent = text.slice(0, Math.floor(eInOut(t) * text.length));
    });
    if (gen === hudGen) typed.textContent = text;
  }
  async function hudHide(hudEl) {
    ++hudGen;
    const root = hudEl.querySelector(".jr-hud");
    if (!root) {
      hudEl.innerHTML = "";
      return;
    }
    root.classList.add("out");
    await new Promise((r) => setTimeout(r, 260));
    hudEl.innerHTML = "";
  }

  window.CONCEPT = { gap: GAP, wallpaper, ready, onOpen, onClose, onMove, onFocus, seam: seamHook, hudShow, hudHide };
})();
