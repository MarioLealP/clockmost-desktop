// EF chat — app surface ported 1:1 from components/ds-chat-v2.html (order 02).
//   EF.chat({ servers, channels, msgs, user }) -> el
//   el.enter() (entrance)  el.selectChannel(i) / el.toggleReaction(i) (same as clicking the row/chip)
//   el.leave() (exit fade in place)  el.destroy() (stops the diamond pulse rAF loop, drops listeners)
// Motion unchanged from the page: entrances fade-slide a short way home (SETTLE), small print
// fades in after, the active channel pill fades in place (SNAP), exits never move (rule 15).
(() => {
  "use strict";
  const EF = (window.EF = window.EF || {});
  const S = EF.SLOW; // same value the page computed for itself

  /* the page's current data = defaults for opts */
  const DEFAULT_SERVERS = [
    { code: "CM", on: true },
    { code: "FL", notif: true },
    { code: "PK" },
    { sep: true },
    { code: "+", dashed: true },
  ];
  const DEFAULT_CHANNELS = [
    { cat: "INFORMATION" },
    { name: "welcome", unread: true, dot: true },
    { name: "infra-alerts" },
    { name: "announcements" },
    { cat: "PROJECTS" },
    { name: "felt-dev", on: true, notif: true, ncnt: "3" },
    { name: "poe2-rag" },
    { name: "packages", unread: true, dot: true },
    { cat: "OFF TOPIC" },
    { name: "music-share" },
    { name: "off-topic" },
    { cat: "VOICE" },
    { name: "General", voice: true, lv: 2 },
  ];
  const DEFAULT_MSGS = [
    { day: "OCTOBER 11, 2026" },
    { who: "muse", av: "MU", cls: "mu", ts: "12:02",
      txt: "the rig calibration landed - numbers are in the shared folder, offsets look clean" },
    { who: "orin", av: "OR", cls: "or", ts: "12:05",
      txt: "tang unlock tested from the laptop, works on LAN - keeping the key on the wire for now",
      rx: [{ em: "\u{1F511}", cnt: 2 }] },
    { who: "benylin", av: "BE", cls: "be", ts: "12:11",
      txt: "nice. folding the app-card into the drawer tonight, then the panel spacing pass" },
    { newdiv: true },
    { who: "muse", av: "MU", cls: "mu", ts: "12:31",
      reply: { who: "benylin", txt: "nice. folding the app-card into the drawer tonight..." },
      txt: "can you look at the mockups when you get a minute? the left column felt cramped",
      rx: [{ em: "\u{1F440}", cnt: 2, mine: true }] },
    { who: "orin", av: "OR", cls: "or", ts: "12:33",
      txt: "the yellow reads better on the active channel row than the grey did" },
  ];
  const DEFAULT_USER = { av: "BE", name: "benylin", st: "in # felt-dev · 42ms" };

  function chat(opts = {}) {
    const servers = opts.servers && opts.servers.length ? opts.servers : DEFAULT_SERVERS;
    const channels = opts.channels && opts.channels.length ? opts.channels : DEFAULT_CHANNELS;
    const msgs = opts.msgs && opts.msgs.length ? opts.msgs : DEFAULT_MSGS;
    const user = opts.user || DEFAULT_USER;
    const $ = (sel) => el.querySelector(sel);
    const $$ = (sel) => [...el.querySelectorAll(sel)];

    /* ---- markup (the page's body, ids dropped -> queries scoped to the root) ---- */
    const hashSVG = '<svg viewBox="0 0 24 24"><path d="M9 5l-1.5 14M16 5l-1.5 14M5 9.5h14M4.5 14.5h14"/></svg>';
    const serverHTML = servers
      .map((s) => (s.sep
        ? '<div class="sep"></div>'
        : '<div class="tw' + (s.on ? " on" : "") + '"><div class="tile' + (s.dashed ? " dashed" : "") + '">'
          + EF.esc(s.code) + '</div>'
          + (s.notif ? '<span class="badge notif"><i class="ring"></i><i></i></span>' : "") + '</div>'))
      .join("");
    const chHTML = channels
      .map((c) => {
        if (c.cat) return '<div class="cat"><svg viewBox="0 0 24 24"><path d="M7 9l5 6 5-6"/></svg>'
          + EF.esc(c.cat) + '<i class="hr"></i></div>';
        const icon = c.voice
          ? '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>'
          : hashSVG;
        let tail = "";
        if (c.notif) tail += '<span class="men"><span class="notif"><i class="ring"></i><i></i></span>'
          + '<b class="ncnt">' + EF.esc(c.ncnt) + '</b></span>';
        if (c.dot) tail += '<span class="dot"></span>';
        if (c.lv) tail += '<span class="lv">' + "<i></i>".repeat(c.lv) + "</span>";
        return '<div class="ch' + (c.unread ? " unread" : "") + (c.on ? " on" : "") + '">'
          + icon + EF.esc(c.name) + tail + '</div>';
      })
      .join("");
    const msgsHTML = msgs
      .map((m) => {
        if (m.day) return '<div class="daydiv"><i class="hr"></i><span class="lbl">' + EF.esc(m.day)
          + '</span><i class="hr"></i></div>';
        if (m.newdiv) return '<div class="newdiv"><i class="ln"></i><span class="lbl">NEW</span></div>';
        let body = "";
        if (m.reply) body += '<div class="replyref"><i class="bar"></i><span class="rt"><b>'
          + EF.esc(m.reply.who) + '</b> ' + EF.esc(m.reply.txt) + '</span></div>';
        body += '<div class="head"><span class="who ' + EF.esc(m.cls) + '">' + EF.esc(m.who)
          + '</span><span class="ts">' + EF.esc(m.ts) + '</span></div>';
        body += '<div class="txt">' + EF.esc(m.txt) + '</div>';
        if (m.rx && m.rx.length) body += '<div class="rx">' + m.rx
          .map((r) => '<span class="chip' + (r.mine ? " mine" : "") + '"><span class="em">' + EF.esc(r.em)
            + '</span><i class="cnt">' + EF.esc(r.cnt) + '</i></span>')
          .join("") + '</div>';
        return '<div class="msg"><div class="av ' + EF.esc(m.cls) + '">' + EF.esc(m.av)
          + '</div><div class="body">' + body + '</div></div>';
      })
      .join("");

    const el = EF.D("ef-chat");
    el.innerHTML =
      '<div class="top"><div class="title">// DISCORD <span>/ CLOCKMOST</span></div><div class="wctl">'
      + '<button type="button" class="wb" title="Minimize"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>'
      + '<button type="button" class="wb" title="Maximize"><svg viewBox="0 0 24 24"><path d="M7.5 7.5h9v9h-9z"/></svg></button>'
      + '<button type="button" class="wb" title="Close"><svg viewBox="0 0 24 24"><path d="M7 7l4 4M13 13l4 4M17 7l-4 4M11 13l-4 4"/></svg></button>'
      + '</div></div>'
      + '<div class="app">'
      + '<div class="rail">' + serverHTML + '</div>'
      + '<div class="side">'
      + '<div class="shead"><div class="tx"><div class="nm">CLOCKMOST</div>'
      + '<div class="sm"><i class="bc"></i><span class="micro2">SRV.002 · 12 CH</span></div></div>'
      + '<svg viewBox="0 0 24 24"><path d="M6 10l6 5 6-5"/></svg></div>'
      + '<div class="chs">' + chHTML + '</div>'
      + '<div class="user"><div class="av">' + EF.esc(user.av) + '</div>'
      + '<div class="tx"><div class="nm">' + EF.esc(user.name) + '</div>'
      + '<div class="st">' + EF.esc(user.st) + '</div></div>'
      + '<div class="btns">'
      + '<button type="button" class="ubtn" title="Mute"><svg viewBox="0 0 24 24"><rect x="9" y="4" width="6" height="11" rx="3"/><path d="M6 12a6 6 0 0 0 12 0M12 18v3"/></svg></button>'
      + '<button type="button" class="ubtn" title="Deafen"><svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0 1 16 0"/><rect x="4" y="13" width="4" height="7" rx="2"/><rect x="16" y="13" width="4" height="7" rx="2"/></svg></button>'
      + '<button type="button" class="ubtn" title="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1"/></svg></button>'
      + '</div></div>'
      + '</div>'
      + '<div class="main">'
      + '<div class="chead">'
      + '<svg class="hash" viewBox="0 0 24 24"><path d="M9 5l-1.5 14M16 5l-1.5 14M5 9.5h14M4.5 14.5h14"/></svg>'
      + '<span class="nm">felt-dev</span>'
      + '<div class="topic">the felt rig: calibration, render pipeline, and what broke today</div>'
      + '<div class="tools">'
      + '<div class="pat"><svg viewBox="0 0 24 24"><path d="M7.5 7.5l4 4M13 13l4 4M16.5 7.5l-4 4M11 13l-4 4"/></svg></div>'
      + '<div class="search">SEARCH<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg></div>'
      + '</div></div>'
      + '<div class="msgs">' + msgsHTML + '</div>'
      + '<div class="composer"><div class="cbox">'
      + '<div class="plus"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></div>'
      + '<div class="ph">Message # felt-dev</div>'
      + '<div class="icons">'
      + '<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M4 12h16M12 8v12M8 8c-2 0-3-4 0-4s2 4 4 4 3-4 4-4"/></svg>'
      + '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2M9 13h6"/></svg>'
      + '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M8.5 14.5c1.5 1.5 5.5 1.5 7 0"/></svg>'
      + '</div></div></div>'
      + '</div>'
      + '</div>';

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

    function playIn() {
      enterAt($(".title"), -12, 0, 0);
      enterAt($(".wctl"), 12, 0, 30);
      enterAt($(".shead"), -10, 0, 60);
      enterAt($(".chead"), 0, -10, 60);
      enterAt($(".user"), 0, 10, 80);
      $$(".rail .tile").forEach((elm, i) => enterAt(elm, 0, 12, 60 + i * 40));
      $$(".chs .ch").forEach((elm, i) => enterAt(elm, -12, 0, 90 + i * 30));
      $$(".chs .cat").forEach((elm, i) => detail(elm, 300 + i * 80));
      $$(".msgs .msg").forEach((elm, i) => enterAt(elm, 0, 12, 120 + i * 60));
      enterAt($(".composer"), 0, 14, 200);
      detail($(".daydiv"), 320);
      detail($(".newdiv"), 380);
      detail($(".rx"), 420);
      detail($(".replyref"), 440);
      detail($(".ts"), 460);
    }

    /* ---- channel switching: active pill fades in place, nothing moves (rule 15) ---- */
    const offs = [];
    function onChannelClick(c) {
      const prev = $(".ch.on");
      if (prev === c) return;
      if (prev) prev.classList.remove("on");
      c.classList.add("on");
      c.style.opacity = "0.6";
      tween(180, SNAP, (v) => { c.style.opacity = String(0.6 + 0.4 * v); });
      const t = [...c.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      const name = t ? t.textContent.trim() : "";
      $(".chead .nm").textContent = name;
      $(".cbox .ph").textContent = "Message # " + name;
      $(".user .st").textContent = "in # " + name + " · 42ms";
    }
    const chRows = $$(".chs .ch");
    for (const c of chRows) {
      const fn = () => onChannelClick(c);
      c.addEventListener("click", fn);
      offs.push(() => c.removeEventListener("click", fn));
    }

    /* reactions toggle (mine) */
    function onChipClick(ch) {
      const on = ch.classList.toggle("mine");
      const n = ch.querySelector(".cnt");
      n.textContent = String(Math.max(0, +n.textContent + (on ? 1 : -1)));
    }
    const chips = $$(".chip");
    for (const ch of chips) {
      const fn = () => onChipClick(ch);
      ch.addEventListener("click", fn);
      offs.push(() => ch.removeEventListener("click", fn));
    }

    /* rule 7: the notify diamond's outline blinks outward (refs/notify-diamond-a/b) */
    const rings = $$(".notif .ring");
    let alive = true;
    (function pulse(t) {
      if (!alive) return;
      const p = (t % 1600) / 1600;
      for (const r of rings) {
        r.style.transform = "rotate(45deg) scale(" + (1 + 1.15 * p).toFixed(3) + ")";
        r.style.opacity = String(0.8 * (1 - p));
      }
      requestAnimationFrame(pulse);
    })(0);

    /* ---- public API ---- */
    el.enter = playIn;
    el.selectChannel = (i) => { const c = chRows[i]; if (c) c.click(); };
    el.toggleReaction = (i) => { const c = chips[i]; if (c) c.click(); };
    el.leave = () => leaveAt(el); // exit fade in place (rule 15)
    el.destroy = () => {
      alive = false;
      for (const off of offs) off();
    };
    return el;
  }

  EF.chat = chat;
})();
