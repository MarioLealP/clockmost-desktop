// EF phonograph — app surface ported 1:1 from components/ds-spotify-v2.html (order 01).
//   EF.phonograph({ albums, tracks, feat }) -> el
//   el.enter() (entrance)  el.swapTo(i) (album swap)  el.leave() (exit fade in place)
//   el.destroy() (stops the visualizer + ambient rAF loops, drops listeners)
// Motion unchanged from the page: entrances fade-slide a short way home (SETTLE), small print
// fades in after, exits never move (SNAP fade in place). ?slow=N slows everything (EF.SLOW).
(() => {
  "use strict";
  const EF = (window.EF = window.EF || {});
  const S = EF.SLOW; // same value the page computed for itself
  // artwork resolved against this script, so any page in any folder can mount the app
  const ART = new URL("../assets/ds-topo-card.svg", document.currentScript.src).href;

  /* the page's current data = defaults for opts */
  const DEFAULT_ALBUMS = [
    { title: "Glassy Sky", artist: "SAPPHIRE", code: "SR-1415", hue: 0, len: "04:20",
      lyr: ["Oh please don't let me go", "Let me open up your sky", "Feel the wind take its time"] },
    { title: "Watashi Dake Yuu", artist: "SAPPHIRE", code: "SR-0912", hue: 48, len: "03:22",
      lyr: ["Ride the last train home", "City lights blur into snow", "Nothing waits, nothing goes"] },
    { title: "Train Back Home", artist: "MAGIC: THE GATHERING", code: "MT-3350", hue: 150, len: "03:35",
      lyr: ["Count the stations one by one", "Every window holds a sun", "Home is where the rails all run"] },
    { title: "Guitar, Loneliness", artist: "SAPPHIRE", code: "SR-0721", hue: -70, len: "03:49",
      lyr: ["Six strings and a quiet room", "Dust in light, a slow perfume", "Plays the shape of leaving soon"] },
    { title: "Seishun Complex", artist: "SAPPHIRE", code: "SR-1103", hue: 220, len: "03:21",
      lyr: ["Summer on a power line", "Your voice under the bass line", "Complex, tangled, yours and mine"] },
  ];
  const DEFAULT_TRACKS = [
    { n: "01", title: "Glassy Sky", artist: "SAPPHIRE", len: "4:20", added: "2026-10-09", on: true },
    { n: "02", title: "Re:Zero Medley: Styx Helix / Paradisus", artist: "SAPPHIRE", len: "3:34", added: "2026-10-08" },
    { n: "03", title: "Train Back Home", artist: "MAGIC: THE GATHERING", len: "3:35", added: "2026-09-30" },
    { n: "04", title: "Watashi Dake Yuu", artist: "SAPPHIRE", len: "3:22", added: "2026-09-27" },
    { n: "05", title: "Guitar, Loneliness", artist: "SAPPHIRE", len: "3:49", added: "2026-09-21" },
    { n: "06", title: "Seishun Complex", artist: "SAPPHIRE", len: "3:21", added: "2026-09-18" },
    { n: "07", title: "Last Stardust", artist: "SAPPHIRE", len: "3:55", added: "2026-09-12" },
    { n: "08", title: "Two Knocks", artist: "AESEAS", len: "3:31", added: "2026-09-05" },
  ];

  function phonograph(opts = {}) {
    const albums = opts.albums && opts.albums.length ? opts.albums : DEFAULT_ALBUMS;
    const tracks = opts.tracks && opts.tracks.length ? opts.tracks : DEFAULT_TRACKS;
    const $ = (sel) => el.querySelector(sel);
    const $$ = (sel) => [...el.querySelectorAll(sel)];
    const wrap = (i) => ((i % albums.length) + albums.length) % albums.length;
    const at = (i) => albums[wrap(i)];

    /* ---- markup (the page's body, ids dropped -> queries scoped to the root) ---- */
    const rowsHTML = tracks
      .map((t) => '<div data-added="' + EF.esc(t.added) + '" class="row' + (t.on ? " on" : "") + '">'
        + '<i class="rn">' + EF.esc(t.n) + '</i><div class="rt">' + EF.esc(t.title) + '</div>'
        + '<div class="ra">' + EF.esc(t.artist) + '</div><div class="rd">' + EF.esc(t.added) + '</div>'
        + '<div class="rl">' + EF.esc(t.len) + '</div></div>')
      .join("");
    const stripHTML = ["Liked Songs", "Sapphire", "Chill Room", "Vinyl"]
      .map((p) => '<div class="pl"><div class="pc"><img src="' + ART + '" alt=""></div><div class="pn">' + p + '</div></div>')
      .join("");

    const el = EF.D("ef-phonograph");
    el.innerHTML =
      '<div class="bg-dot"></div><div class="bg-rings"></div>'
      + '<div class="top"><div class="title">PHONOGRAPH <span>MKV-I</span></div><div class="search"><b>›››</b> SEARCH</div>'
      + '<div class="wctl">'
      + '<button type="button" class="wb" title="Minimize"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>'
      + '<button type="button" class="wb" title="Maximize"><svg viewBox="0 0 24 24"><path d="M7.5 7.5h9v9h-9z"/></svg></button>'
      + '<button type="button" class="wb" title="Close"><svg viewBox="0 0 24 24"><path d="M7 7l4 4M13 13l4 4M17 7l-4 4M11 13l-4 4"/></svg></button>'
      + '</div></div>'
      + '<div class="main">'
      + '<div class="col">'
      + '<div class="lblrow"><span class="lbl">PREVIOUS</span><i class="hr"></i><span class="micro2">QUEUE.02</span></div>'
      + '<div class="mini m-prev" data-idx="1"></div>'
      + '<div class="feat"><div class="fslot"><div class="fcard">'
      + '<img class="topo" src="' + ART + '" alt="">'
      + '<div class="dots"></div><div class="grain"></div><div class="barcode"></div>'
      + '<div class="mcode">SR-1415 · 33 RPM · SIDE A</div>'
      + '</div></div><div class="fext">'
      + '<div class="tri"><div class="tri-in">'
      + '<svg viewBox="0 0 360 280" fill="none" stroke="rgba(241,241,244,.30)" stroke-width="1.5">'
      + '<path d="M14 84 L74 132 L14 180 Z"/><path d="M88 64 L162 132 L88 200 Z"/>'
      + '<path d="M158 44 L246 132 L158 220 Z"/><path d="M228 24 L330 132 L228 240 Z"/>'
      + '</svg></div></div>'
      + '<div class="ft">Glassy Sky</div><div class="fa">SAPPHIRE</div><div class="frule"></div>'
      + '<div class="flyr"><div class="cur">Oh please don&#39;t let me go</div><div>Let me open up your sky</div><div>Feel the wind take its time</div></div>'
      + '<div class="fbot"><span class="triband"><i></i><i></i><i></i></span><span class="barcode2"></span>'
      + '<span class="micro2">LP-02 · A3 · 00.101</span></div>'
      + '</div></div>'
      + '<div class="lblrow"><span class="lbl">UP NEXT</span><i class="hr"></i><span class="micro2">2 TRACKS</span></div>'
      + '<div class="mini m-next1" data-idx="2"></div>'
      + '<div class="mini small m-next2" data-idx="3"></div>'
      + '</div>'
      + '<div class="list"><div class="pmark"><i class="bk tl"></i><i class="bk br"></i><div class="ruler"></div>'
      + '<div class="mb"></div><div class="mc">RL-08 · 08 TRACKS · 32:27</div></div>'
      + '<div class="strip">' + stripHTML + '</div>'
      + '<label class="sort">SORT BY'
      + '<span class="pill-sel"><select><option>Default</option><option>Title</option><option>Artist</option><option>Length</option><option>Date added</option></select><b>▾</b></span>'
      + '</label>' + rowsHTML + '</div>'
      + '</div>'
      + '<div class="bar"><canvas class="viz"></canvas>'
      + '<div class="timer"><span class="pause"><i></i><i></i></span><span>00:08 / 02:02</span></div>'
      + '<div class="titles"><div class="t">Oh please don&#39;t let me go</div></div>'
      + '<div class="ctrls">'
      + '<svg viewBox="0 0 24 24"><path d="M3 6h3l9 12h3M3 18h3l9-12h3M15 6h6M18 3l3 3-3 3M18 15l3 3-3 3"/></svg>'
      + '<svg class="fill" viewBox="0 0 24 24"><path d="M6 5h2v14H6zM19 5 9 12l10 7z"/></svg>'
      + '<svg class="fill big" viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'
      + '<svg class="fill" viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM5 5l10 7-10 7z"/></svg>'
      + '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5"/></svg>'
      + '</div>'
      + '<div class="vol">'
      + '<svg class="device" viewBox="0 0 24 24" aria-label="Devices"><rect x="3" y="4" width="13" height="10" rx="1"/><path d="M7 20h5M9.5 14v6"/><rect x="18" y="8" width="4" height="10" rx="1"/></svg>'
      + '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>'
      + '<input type="range" min="0" max="100" value="70" aria-label="Volume">'
      + '</div>'
      + '<div class="micro">42ms UID: 6349456094</div>'
      + '</div>'
      + '<div class="bg-hatch"></div>';

    /* ---- element handles (root-scoped, no ids) ---- */
    const fcard = $(".fcard");
    const fext = $(".fext");
    const topo = fcard.querySelector(".topo");
    const ftitle = fext.querySelector(".ft");
    const fartist = fext.querySelector(".fa");
    const fmcode = fcard.querySelector(".mcode");
    const frule = fext.querySelector(".frule");
    const flyr = fext.querySelector(".flyr");
    const ftri = fext.querySelector(".tri");
    const fbot = fext.querySelector(".fbot");
    const fbarcode = fcard.querySelector(".barcode");
    const mPrev = $(".mini.m-prev");
    const mNext1 = $(".mini.m-next1");
    const mNext2 = $(".mini.m-next2");
    const timeEl = $(".timer > span:last-child");
    const triIn = ftri.querySelector(".tri-in");

    /* ---- motion helpers: thin adapter over EF.tween (same curves, same SLOW) ----
       the page's wait(ms, fn) = setTimeout(ms * S) has no EF equivalent -> kept local */
    const wait = (ms, fn) => setTimeout(fn, ms * S);
    const tween = (dur, ease, step) => EF.tween(dur, (e) => step(ease(e / dur), e / dur));
    // SNAP = cubic-bezier(1, 0, 0.7, 1), SETTLE = cubic-bezier(0.16, 1, 0.3, 1)
    const SNAP = EF.SNAP, SETTLE = EF.SETTLE;

    // rule 3: main layers appear at once near their spot, then fade-slide the short way home
    function enterAt(elm, dx, dy, delay) {
      elm.style.opacity = "0";
      elm.style.transform = "translate(" + dx + "px, " + dy + "px)";
      wait(delay, () => tween(280, SETTLE, (v) => {
        elm.style.opacity = String(0.25 + 0.75 * v);
        elm.style.transform = "translate(" + dx * (1 - v) + "px, " + dy * (1 - v) + "px)";
      }));
    }
    // rule 4: small print fades in slowly after the main layers land
    function detail(elm, delay) {
      elm.style.opacity = "0";
      wait(delay, () => tween(600, SETTLE, (v) => { elm.style.opacity = String(v); }));
    }
    // rule 15: exits never move - fade out in place
    function leaveAt(elm) {
      tween(120, SNAP, (v) => { elm.style.opacity = String(1 - v); });
    }

    let feat = 0;
    function miniHTML(a) {
      return '<div class="mc"><img src="' + ART + '" alt="" style="filter:hue-rotate(' + a.hue + 'deg) saturate(.6)"></div>'
        + '<div class="tx"><div class="mt">' + EF.esc(a.title) + '</div><div class="ms">' + EF.esc(a.artist) + '</div>'
        + '<div class="mc2">' + EF.esc(a.code + " · " + a.len) + '</div></div><div class="badge"></div>';
    }
    function render() {
      const a = at(feat);
      topo.style.filter = "hue-rotate(" + a.hue + "deg) saturate(.6)";
      ftitle.textContent = a.title;
      fartist.textContent = a.artist;
      fmcode.textContent = a.code + " · 33 RPM · SIDE A";
      flyr.innerHTML = a.lyr.map((l, i) => '<div' + (i === 0 ? ' class="cur"' : '') + '>' + EF.esc(l) + '</div>').join("");
      for (const pair of [[mPrev, feat - 1], [mNext1, feat + 1], [mNext2, feat + 2]]) {
        const elm = pair[0];
        elm.dataset.idx = String(wrap(pair[1]));
        elm.innerHTML = miniHTML(at(pair[1]));
      }
    }

    const FINE = [fbarcode, fmcode, ftri, fbot];

    function playIn() {
      enterAt(fcard, 0, 22, 0);
      [ftitle, fartist, frule, flyr].forEach((elm, i) => enterAt(elm, 0, 14, 40 + i * 35));
      [mPrev, mNext1, mNext2].forEach((elm, i) => enterAt(elm, -14, 0, 80 + i * 45));
      $$(".lblrow").forEach((elm, i) => detail(elm, 300 + i * 80));
      FINE.forEach((elm, i) => detail(elm, 280 + i * 70));
    }

    function swapTo(idx) {
      idx = wrap(idx);
      if (idx === feat) return;
      const out = [topo, ftitle, fartist, frule, flyr, ...FINE];
      out.forEach(leaveAt);
      wait(130, () => {
        feat = idx;
        render();
        tween(90, SNAP, (v) => { topo.style.opacity = String(v); }); // the art cuts in place
        [ftitle, fartist, frule, flyr].forEach((elm, i) => enterAt(elm, 0, 12, 30 + i * 35));
        FINE.forEach((elm, i) => detail(elm, 200 + i * 60));
        [mPrev, mNext1, mNext2].forEach((elm, i) => enterAt(elm, -10, 0, 50 + i * 40));
      });
    }

    /* ---- boot: render + the two raw rAF loops (visualizer, ambient glow) ---- */
    render();

    const canvas = $(".viz"), g = canvas.getContext("2d");
    const BARS = 72;
    function size() {
      const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener("resize", size);

    /* soft white-purple bars, low contrast, glow via shadowBlur */
    function drawViz(t) {
      const w = canvas.clientWidth, h = canvas.clientHeight, gap = w / BARS, bw = gap * 0.42;
      g.clearRect(0, 0, w, h);
      g.shadowColor = "rgba(190,170,255,.35)"; g.shadowBlur = 8;
      g.fillStyle = "rgba(214,204,255,.22)";
      for (let i = 0; i < BARS; i++) {
        const a = 0.5 + 0.5 * Math.sin(t * 0.0016 + i * 0.37);
        const b = 0.5 + 0.5 * Math.sin(t * 0.0009 * (1 + i % 5) + i * 1.9);
        const v = 0.18 + 0.82 * (a * 0.6 + b * 0.4);
        const bh = v * h;
        g.fillRect(i * gap + (gap - bw) / 2, h - bh, bw, bh);
      }
    }

    /* timer: runs 00:08 -> 02:02 in real time (slowed by SLOW) */
    const TOTAL = 122, START = 8, t0 = performance.now();
    const pad = (n) => String(n).padStart(2, "0");
    let alive = true;
    function frame(now) {
      if (!alive) return;
      // the factory may run before the root is mounted (clientWidth 0) -> (re)size once it has one
      const dpr = devicePixelRatio || 1;
      if (canvas.width !== canvas.clientWidth * dpr || canvas.height !== canvas.clientHeight * dpr) size();
      const elapsed = Math.min(TOTAL, START + (now - t0) / 1000 / S);
      const s = Math.floor(elapsed);
      timeEl.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60) + " / 02:02";
      drawViz((now - t0) / S);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* ambient glow on the motif (raw rAF timestamps, as on the page) */
    function amb(t) {
      if (!alive) return;
      triIn.style.opacity = String(0.82 + 0.18 * Math.sin(t * 0.0007));
      requestAnimationFrame(amb);
    }
    amb(0);

    /* ---- interaction: minis click, arrow keys while connected ---- */
    $$(".mini").forEach((elm) => elm.addEventListener("click", () => swapTo(+elm.dataset.idx)));
    function onKey(e) {
      if (!el.isConnected) return;
      if (e.key === "ArrowLeft") swapTo(feat - 1);
      if (e.key === "ArrowRight") swapTo(feat + 1);
    }
    addEventListener("keydown", onKey);

    /* ---- public API ---- */
    el.enter = playIn;
    el.swapTo = swapTo;
    el.leave = () => leaveAt(el); // exit fade in place (rule 15)
    el.destroy = () => {
      alive = false;
      removeEventListener("keydown", onKey);
      removeEventListener("resize", size);
    };

    const start = +opts.feat;
    if (start >= 0 && start < albums.length && start !== feat) { feat = start; render(); }
    return el;
  }

  EF.phonograph = phonograph;
})();
