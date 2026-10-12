// EF app card — the drawer slot atom. Rule 22: own design, 9 layers.
// Reuse: EF.appCard({ name, code, icon, color, numeral, state }) -> HTMLElement.
// The drawer builds its grid by mapping apps -> EF.appCard. Requires core.js.
(() => {
  "use strict";
  const EF = (window.EF = window.EF || {});
  if (typeof EF.D !== "function") throw new Error("app-card needs core.js");

  // shared topo motif for every slot (rendered once)
  let motifURL = null;
  function motif() {
    if (!motifURL) motifURL = EF.topoTexture("rgba(205,209,220,0.55)", 511, 136, 136);
    return motifURL;
  }

  // rule 18: X with an empty centre (default glyph)
  const GLYPH_X = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="square">
    <path d="M12 12 L26 26 M38 38 L52 52 M52 12 L38 26 M26 38 L12 52"/></svg>`;

  /**
   * Create one drawer slot.
   * @param {object} p
   *   name    string  — app name (kept on el._props; drawer may use in tooltips/labels)
   *   code    string  — micro label on the tile, e.g. "FX-01"
   *   icon    string  — SVG markup for the app glyph (default: rule-18 X)
   *   color   string  — category / rarity colour (CSS colour) -> wash + underbar
   *   numeral number|string — badge count, drawn big and white (open windows etc.)
   *   state   string  — "rest" | "running" | "selected" | "empty" (default "rest")
   * @returns {HTMLElement} .setState(state) flips live; ._props holds the inputs
   */
  function appCard(p = {}) {
    const el = EF.D("ef-card");
    const props = {
      name: p.name || "",
      code: p.code || "",
      icon: p.icon || "",
      color: p.color || "#ff7a1a",
      numeral: p.numeral ?? 0,
      state: p.state || "rest",
    };
    el._props = props;
    el.style.setProperty("--rc", props.color);
    el.style.setProperty("--topo", `url(${motif()})`);
    el.title = props.name;

    // 1 steel bed · 2 gradient base · 3 category wash · 4 topo motif
    EF.D("ly l-bed", el);
    EF.D("ly l-base", el);
    EF.D("ly l-wash", el);
    EF.D("ly l-motif", el);
    // 5 dotted edge (rule 20) · 6 hatch + brackets
    EF.D("ly l-dots", el);
    EF.D("ly l-hatch", el);
    EF.D("brk tl", el);
    EF.D("brk br", el);
    // 7 icon · 8 numeral · 9 micro + underbar
    EF.D("ly l-icon", el, props.icon || GLYPH_X);
    EF.D("l-num", el, String(props.numeral));
    EF.D("l-micro", el, EF.esc(props.code));
    EF.D("l-bar", el);
    EF.D("run-dia", el);

    el.setState = (s) => {
      const k = s || props.state;
      el.classList.remove("is-rest", "is-running", "is-selected", "is-empty");
      el.classList.add(`is-${k}`);
      return el;
    };
    el.setState(props.state);
    return el;
  }

  /**
   * Build a grid of slots from an app list — what the drawer will call.
   * @param {Array<object>} apps  each entry is appCard's p; missing entries / padWith
   *   become empty slots so the grid stays square.
   * @param {object} opts  { cols, padWith }  padWith defaults to empty slots.
   * @returns {HTMLElement[]} the card elements (also linked: parent is the grid).
   */
  function appGrid(apps, opts = {}) {
    const cols = opts.cols || 5;
    const list = apps.slice();
    const total = Math.ceil(list.length / cols) * cols;
    while (list.length < total) list.push({ state: "empty", color: "#33363c", numeral: 0, code: "" });
    const grid = EF.D("ef-grid");
    grid.style.setProperty("--cols", String(cols));
    const cards = list.map((a) => {
      const card = appCard(a);
      grid.appendChild(card);
      return card;
    });
    cards.grid = grid;
    return cards;
  }

  EF.appCard = appCard;
  EF.appGrid = appGrid;
  EF.appCard.GLYPH_X = GLYPH_X;
})();
