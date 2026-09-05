/* ============================================================
   vt-lab.js — the same morph, hand-rolled and handed over.

   A grid of tiles; clicking one opens it as a detail view. The
   DOM change is a full re-render either way — the interesting
   part is what the browser does with the two states.

   Three modes, in order of how much you are asking for:
     1. plain swap             — nothing, a hard cut
     2. startViewTransition    — the browser cross-fades the stage
     3. + view-transition-name — the clicked tile MORPHS into the
                                 hero while everything else fades

   Two things worth knowing about how this is wired:

   - The lab gives its own stage a view-transition-name and then
     kills the animation on the `root` group. Without that, every
     press would cross-fade the entire lesson page, because a view
     transition captures the whole document. The page still freezes
     for the duration — that part cannot be opted out of, and the
     lesson says so.

   - The duplicate-name switch is real. Two elements with the same
     view-transition-name at capture time is an error, and the
     browser throws the whole transition away. Nothing is simulated.

   Usage:
     <div data-vt-lab data-title="One tile, opened three ways"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const SUPPORTED = typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function';

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong', css: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { id: 'out', label: 'ease-out, standard', css: 'cubic-bezier(0, 0, 0.2, 1)' },
    { id: 'in-out', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    { id: 'linear', label: 'linear', css: 'linear' },
  ];

  const TILES = [
    { n: 1, t: 'Harbour, 6am', s: 'Long exposure · 30s', h: 202 },
    { n: 2, t: 'Substation', s: 'Hand-held · 1/60', h: 22 },
    { n: 3, t: 'Sixth floor', s: 'Tripod · 1/8', h: 152 },
    { n: 4, t: 'The overpass', s: 'Hand-held · 1/250', h: 268 },
    { n: 5, t: 'Loading bay', s: 'Long exposure · 15s', h: 44 },
    { n: 6, t: 'Back stair', s: 'Hand-held · 1/30', h: 338 },
  ];

  const STYLES = `
    .vt {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .vt { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .vt-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .vt-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .vt-body { display: grid; gap: 0; background: var(--paper); }
    @media (min-width: 860px) { .vt-body { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); } }

    .vt-stagewrap { padding: 1rem 0.85rem; }
    .vt-stage { min-height: 236px; }
    .vt-grid { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .vt-tile {
      border-radius: 6px; overflow: hidden; cursor: pointer;
      border: 1px solid var(--rule); background: var(--paper);
      text-align: left; padding: 0; color: inherit; font: inherit;
      display: block; width: 100%;
    }
    .vt-tile:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    /* Six visibly different tiles, because the whole question this lab asks is
       "which one became the panel?" — six shades of the same brown cannot
       answer it. Distinct hues, one saturation and lightness, so they still
       read as a set. */
    .vt-swatch {
      height: 62px;
      background: linear-gradient(150deg,
        hsl(var(--h) 30% 46%), hsl(calc(var(--h) - 14) 34% 29%));
    }
    .vt-cap {
      padding: 0.32rem 0.42rem;
      font-family: var(--sans); font-size: 0.66rem; line-height: 1.3; color: var(--ink-soft);
    }
    .vt-cap b { display: block; font-weight: 600; color: var(--ink);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* the detail view */
    .vt-detail { display: grid; gap: 0.6rem; }
    .vt-hero { border-radius: 8px; overflow: hidden; border: 1px solid var(--rule); }
    .vt-hero .vt-swatch { height: 132px; }
    .vt-hero .vt-cap { padding: 0.5rem 0.6rem; font-size: 0.78rem; }
    .vt-meta {
      font-family: var(--sans); font-size: 0.74rem; line-height: 1.5; color: var(--ink-soft);
      margin: 0;
    }

    .vt-hint {
      margin: 0.85rem 0 0; font-family: var(--sans); font-size: 0.74rem;
      line-height: 1.5; color: var(--ink-faint);
    }

    /* ---- readout ---- */
    .vt-panel {
      border-top: 1px solid var(--rule); padding: 1rem 0.85rem;
      display: grid; gap: 0.7rem; align-content: start;
    }
    @media (min-width: 860px) { .vt-panel { border-top: 0; border-left: 1px solid var(--rule); } }
    .vt-log {
      font-family: var(--mono); font-size: 0.72rem; line-height: 1.7;
      background: var(--code-bg); border: 1px solid var(--rule); border-radius: 6px;
      padding: 0.5rem 0.6rem; min-height: 7.4em; color: var(--ink-soft);
    }
    .vt-log b { color: var(--ink); font-weight: 600; }
    .vt-log i { font-style: normal; color: var(--bad); }
    .vt-log u { text-decoration: none; color: var(--good); }
    .vt-say {
      font-family: var(--sans); font-size: 0.78rem; line-height: 1.5; color: var(--ink-soft);
      margin: 0; min-height: 4.5em;
    }
    .vt-say b { color: var(--ink); }
    .vt-say b.no { color: var(--bad); }
    .vt-say b.yes { color: var(--good); }

    .vt-css {
      border-top: 1px solid var(--rule); background: var(--code-bg); padding: 0.8rem 0.85rem;
    }
    .vt-csstitle {
      font-family: var(--sans); font-size: 0.68rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint);
      margin-bottom: 0.45rem;
    }
    .vt-css pre {
      margin: 0; overflow-x: auto;
      font-family: var(--mono); font-size: 0.74rem; line-height: 1.65; color: var(--ink-soft);
    }
    .vt-css i { font-style: normal; color: var(--ink); }
    .vt-css s { color: var(--bad); }

    .vt-unsupported {
      margin: 0; padding: 0.7rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      background: color-mix(in srgb, var(--bad) 10%, transparent);
      font-family: var(--sans); font-size: 0.76rem; line-height: 1.5; color: var(--ink);
    }

    .vt-foot { padding: 0.85rem; border-top: 1px solid var(--rule); display: grid; gap: 0.85rem; }
    @media (min-width: 760px) {
      .vt-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    .vt-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; background: var(--paper); }
    .vt-seg button { font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      padding: 0.4rem 0.4rem; text-align: center;
      border: 0; border-right: 1px solid var(--rule); background: transparent;
      color: var(--ink-soft); cursor: pointer; }
    .vt-seg button:last-child { border-right: 0; }
    .vt-seg button[aria-pressed="true"] { background: var(--accent); color: #fffef9; }
    .vt-seg button[disabled] { opacity: 0.45; cursor: not-allowed; }
    .vt-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .vt-foot input[disabled] { opacity: 0.45; cursor: not-allowed; }

    @media print { .vt-actions, .vt-foot { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('vt-styles')) return;
    const el = document.createElement('style');
    el.id = 'vt-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const n = ++uid;
    const id = 'vt-' + n;
    const title = root.dataset.title || 'One tile, opened three ways';

    // Names have to be unique across the whole document, so they carry the
    // instance number even though there is only ever one of these on a page.
    const NAME_STAGE = `vtstage${n}`;
    const NAME_HERO = `vthero${n}`;

    const state = { tech: 'name', dupes: 'unique', dur: 420, ease: 'out-strong' };
    let open = null;             // which tile is showing as detail, or null
    let lastOpened = null;       // so the grid knows which tile owns the name on the way back
    let lines = [];

    root.id = id;
    root.className = 'vt';
    root.innerHTML = `
      ${SUPPORTED ? '' : `<p class="vt-unsupported"><b>This browser has no
        <code>document.startViewTransition</code>.</b> The tiles still work — they just cut.
        Same-document view transitions reached every engine in October 2025; if you are on
        something older, the fallback you are looking at right now is the whole story.</p>`}
      <div class="vt-head">
        <span>${title}</span>
        <div class="vt-actions">
          <button class="btn primary" type="button" data-open>Open the third one</button>
          <button class="btn" type="button" data-back>Back to the grid</button>
        </div>
      </div>

      <div class="vt-body">
        <div class="vt-stagewrap">
          <div class="vt-stage" data-stage></div>
          <p class="vt-hint">Click any tile. The whole lesson page freezes for the duration —
            that is not the lab misbehaving, that is what a view transition is.</p>
        </div>
        <div class="vt-panel">
          <div class="vt-log" data-log></div>
          <p class="vt-say" data-say></p>
        </div>
      </div>

      <div class="vt-css">
        <div class="vt-csstitle">what is running</div>
        <pre data-code></pre>
      </div>

      <div class="vt-foot">
        <div class="control">
          <span class="control-label"><span>how the swap is made</span></span>
          <div class="vt-seg" data-seg="tech">
            <button type="button" data-val="none">plain swap</button>
            <button type="button" data-val="vt">startViewTransition</button>
            <button type="button" data-val="name">+ a shared name</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>the names on the elements</span></span>
          <div class="vt-seg" data-seg="dupes">
            <button type="button" data-val="unique">unique</button>
            <button type="button" data-val="dupe">all six the same</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>duration</span>
            <span class="control-value" data-out-dur></span></span>
          <input type="range" min="0" max="1200" step="20" data-k="dur">
        </div>
        <div class="control">
          <span class="control-label"><span>easing</span></span>
          <select data-k="ease">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
      </div>
    `;

    const el = (sel) => root.querySelector(sel);
    const stage = el('[data-stage]');
    const logEl = el('[data-log]');
    const sayEl = el('[data-say]');
    const codeEl = el('[data-code]');

    const easeCss = () => (EASES.find((e) => e.id === state.ease) || EASES[0]).css;

    // The lab's own stylesheet for the pseudo-element tree. Rewritten on every
    // knob change, because ::view-transition-* cannot be reached from inline
    // styles — the pseudo tree hangs off the document, not off any element.
    const sheet = document.createElement('style');
    sheet.id = id + '-vt';
    document.head.appendChild(sheet);

    function paintSheet() {
      sheet.textContent = `
        /* Kill the page-wide cross-fade. Without this, pressing a tile
           dissolves the whole lesson. */
        ::view-transition-old(root),
        ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }

        ::view-transition-group(${NAME_STAGE}),
        ::view-transition-group(${NAME_HERO}) {
          animation-duration: ${state.dur}ms;
          animation-timing-function: ${easeCss()};
        }
        ::view-transition-old(${NAME_STAGE}),
        ::view-transition-new(${NAME_STAGE}),
        ::view-transition-old(${NAME_HERO}),
        ::view-transition-new(${NAME_HERO}) {
          animation-duration: ${state.dur}ms;
          animation-timing-function: ${easeCss()};
        }`;
    }

    function log(what, bad) {
      const tag = bad === true ? 'i' : (bad === 'good' ? 'u' : 'span');
      lines.unshift(`<div><${tag}>${what}</${tag}></div>`);
      if (lines.length > 6) lines.pop();
      logEl.innerHTML = lines.join('');
    }

    function render() {
      const named = state.tech === 'name';
      if (open === null) {
        stage.innerHTML = `<div class="vt-grid">${TILES.map((t) => `
          <button class="vt-tile" type="button" data-n="${t.n}" style="--h:${t.h}">
            <div class="vt-swatch"></div>
            <div class="vt-cap"><b>${t.t}</b>${t.s}</div>
          </button>`).join('')}</div>`;
      } else {
        const t = TILES.find((x) => x.n === open);
        stage.innerHTML = `<div class="vt-detail">
          <div class="vt-hero">
            <div class="vt-swatch" style="--h:${t.h}"></div>
            <div class="vt-cap"><b>${t.t}</b>${t.s}</div>
          </div>
          <p class="vt-meta">Shot ${t.s.toLowerCase()}. The tile you pressed and this panel are
            two different elements in two different layouts — nothing was moved.</p>
        </div>`;
      }

      // The stage is always its own group, so the cross-fade stays inside
      // the lab instead of taking the page with it.
      stage.style.viewTransitionName = NAME_STAGE;

      if (!named) return;
      if (open === null) {
        // Duplicating the name is a real error, not a simulation: the browser
        // finds two elements claiming one name and abandons the transition.
        const tiles = [...stage.querySelectorAll('.vt-tile')];
        if (state.dupes === 'dupe') {
          tiles.forEach((b) => { b.style.viewTransitionName = NAME_HERO; });
        } else if (lastOpened) {
          const src = tiles.find((b) => Number(b.dataset.n) === lastOpened);
          if (src) src.style.viewTransitionName = NAME_HERO;
        }
      } else {
        stage.querySelector('.vt-hero').style.viewTransitionName = NAME_HERO;
      }
    }

    function go(mutate) {
      paintSheet();

      if (!SUPPORTED || state.tech === 'none') {
        mutate();
        render();
        log('DOM replaced — no transition');
        sayEl.innerHTML = SUPPORTED
          ? `<b class="no">A hard cut.</b> Correct, instant, and it tells you nothing about
             which tile you pressed or where it went.`
          : `<b>No support here</b>, so every mode is a hard cut. That is the fallback, and it
             is the reason a view transition needs no feature detection to be safe.`;
        return;
      }

      log('document.startViewTransition(...)');
      const t = document.startViewTransition(() => { mutate(); render(); });

      t.ready.then(() => {
        log('ready — snapshots taken, animating', 'good');
      }).catch((err) => {
        log('ready rejected: ' + (err && err.name ? err.name : 'error'), true);
      });

      t.finished.then(() => log('finished'));

      if (state.tech === 'name' && state.dupes === 'dupe') {
        sayEl.innerHTML = `<b class="no">Six elements, one name.</b> A
          <code>view-transition-name</code> has to be unique in the document at capture time.
          It is not, so the browser throws the entire transition away and falls back to the cut —
          including the parts that were fine.`;
      } else if (state.tech === 'name') {
        sayEl.innerHTML = `<b class="yes">The tile morphs.</b> Both states gave the same name to
          different elements, so the browser treats them as one thing that moved and resized, and
          animates between the two rects. This is FLIP, done for you, on a pair of screenshots.`;
      } else {
        sayEl.innerHTML = `<b>Everything cross-fades.</b> The browser has an old snapshot and a
          new one and no reason to think anything in them is related — so it dissolves one into
          the other. Readable, but it does not say the tile <em>became</em> the panel.`;
      }
    }

    function paintCode() {
      if (!SUPPORTED || state.tech === 'none') {
        codeEl.innerHTML = `<i>open</i> = n;
render();   <i>// and that is all — the browser cuts</i>`;
        return;
      }

      // Order matters here and the panel has to show it honestly: the source
      // element is named BEFORE the call, the destination inside it.
      const before = state.tech === 'name'
        ? (state.dupes === 'dupe'
          ? `<s>tiles.forEach(t =&gt; t.style.viewTransitionName = 'hero');  // all six</s>\n\n`
          : `tile.style.viewTransitionName = <i>'hero'</i>;   <i>// BEFORE the call, or there is</i>
                                          <i>// nothing to morph from</i>\n\n`)
        : '';
      const inside = state.tech === 'name'
        ? `\n  hero.style.viewTransitionName = <i>'hero'</i>;   <i>// the panel claims it</i>`
        : '';
      const css = state.tech === 'name'
        ? `\n\n<i>/* and in CSS */</i>
::view-transition-group(hero) {
  animation-duration: <i>${state.dur}ms</i>;
  animation-timing-function: <i>${easeCss()}</i>;
}`
        : `\n\n<i>/* and in CSS — nothing inside the stage is named, so the</i>
<i>   stage is one snapshot and it simply cross-fades */</i>
::view-transition-old(stage),
::view-transition-new(stage) {
  animation-duration: <i>${state.dur}ms</i>;
  animation-timing-function: <i>${easeCss()}</i>;
}`;

      codeEl.innerHTML = before +
`document.startViewTransition(() =&gt; {
  <i>open</i> = n;
  render();          <i>// the same render as the plain swap</i>${inside}
});` + css;
    }

    function paint() {
      root.querySelectorAll('[data-seg]').forEach((seg) => {
        const k = seg.dataset.seg;
        seg.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', String(state[k] === b.dataset.val));
          if (k === 'tech') b.disabled = !SUPPORTED && b.dataset.val !== 'none';
          // Duplicating a name only means anything once names are in play.
          if (k === 'dupes') b.disabled = state.tech !== 'name' || !SUPPORTED;
        });
      });
      el('[data-out-dur]').textContent = state.dur + 'ms';
      paintCode();
      paintSheet();
    }

    // The name has to be on the source tile BEFORE the snapshot is taken.
    // Set it inside the callback and the old state has no element by that name,
    // so the browser has nothing to morph FROM — the panel just fades in and the
    // whole point is lost. This is the easiest way to get a view transition
    // that runs, reports success, and still looks like a cross-fade.
    function nameSource(n2) {
      if (state.tech !== 'name' || state.dupes !== 'unique') return;
      stage.querySelectorAll('.vt-tile').forEach((b) => {
        b.style.viewTransitionName = Number(b.dataset.n) === n2 ? NAME_HERO : '';
      });
    }

    function openTile(n2) {
      nameSource(n2);
      go(() => { open = n2; lastOpened = n2; });
    }

    stage.addEventListener('click', (e) => {
      const b = e.target.closest('.vt-tile');
      if (!b) return;
      openTile(Number(b.dataset.n));
    });

    el('[data-open]').addEventListener('click', () => { if (open === null) openTile(3); });
    el('[data-back]').addEventListener('click', () => { if (open !== null) go(() => { open = null; }); });

    root.querySelectorAll('[data-seg]').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        state[seg.dataset.seg] = b.dataset.val;
        lines = [];
        logEl.innerHTML = '';
        paint();
        render();
      });
    });

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseInt(input.value, 10) : input.value;
        paint();
      });
    });

    if (!SUPPORTED) state.tech = 'none';
    paint();
    render();
    logEl.innerHTML = '<div>waiting for a press…</div>';
    sayEl.innerHTML = 'Open a tile, then come back. Then switch the mode and do it again.';
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-vt-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
