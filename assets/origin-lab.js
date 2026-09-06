/* ============================================================
   origin-lab.js — transform-origin, made visible.

   Two identical menus opening from the same button in the same
   corner. The left one scales from the corner nearest the button.
   The right one scales from its own centre, which is the browser
   default and therefore what almost everything ships with.

   The ring drawn on each panel marks its transform-origin — the
   one point that does not move while the panel scales. Watch the
   ring, not the panel. On the left it stays welded to the button.
   On the right it sits in the middle of nowhere and the whole
   panel drifts into place around it.

   Usage:
     <div data-origin-lab data-title="Open them from each corner"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong', css: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { id: 'out', label: 'ease-out, standard', css: 'cubic-bezier(0, 0, 0.2, 1)' },
    { id: 'in-out', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    { id: 'linear', label: 'linear', css: 'linear' },
  ];

  // Four corners. `origin` is the panel corner that touches the button —
  // which is exactly the corner the panel should grow out of.
  const CORNERS = {
    tl: { label: 'top left',     origin: 'top left',     ox: 0,   oy: 0 },
    tr: { label: 'top right',    origin: 'top right',    ox: 100, oy: 0 },
    bl: { label: 'bottom left',  origin: 'bottom left',  ox: 0,   oy: 100 },
    br: { label: 'bottom right', origin: 'bottom right', ox: 100, oy: 100 },
  };
  const ORDER = ['tl', 'tr', 'br', 'bl'];

  const PANEL_W = 152;
  const PANEL_H = 104;
  const PAD = 12;
  const TRIGGER_H = 26;
  const GAP = 8;

  const STYLES = `
    .ol {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .ol { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .ol-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .ol-actions { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

    .ol-body { display: grid; gap: 0.85rem; padding: 0.9rem 0.85rem; background: var(--paper); }
    @media (min-width: 680px) { .ol-body { grid-template-columns: 1fr 1fr; } }
    .ol-cell { min-width: 0; }
    .ol-celltitle {
      font-family: var(--sans); font-size: 0.68rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--ink-faint); margin-bottom: 0.4rem;
    }
    .ol-celltitle em { font-style: normal; color: var(--accent); }
    .ol-celltitle b { font-weight: 600; color: var(--bad); }

    .ol-stage {
      position: relative; height: 190px; border-radius: 6px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
      overflow: hidden;
    }
    .ol-trigger {
      position: absolute; z-index: 2;
      height: ${TRIGGER_H}px; padding: 0 0.7rem;
      border: 1px solid var(--rule); border-radius: 5px;
      background: var(--paper); color: var(--ink);
      font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      cursor: pointer;
    }
    .ol-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .ol-panel {
      position: absolute; z-index: 1;
      width: ${PANEL_W}px; height: ${PANEL_H}px;
      padding: 0.5rem; border-radius: 8px;
      background: var(--paper); border: 1px solid var(--rule);
      box-shadow: 0 8px 22px rgba(0,0,0,.14);
      opacity: 0;
      transform: scale(var(--s, 0.85)) rotate(var(--r, 0deg));
      pointer-events: none;
    }
    .ol-panel.open { opacity: 1; transform: none; }
    .ol-row {
      height: 21px; border-radius: 4px; margin-bottom: 4px;
      background: color-mix(in srgb, var(--ink) 8%, transparent);
      display: flex; align-items: center; padding: 0 0.45rem;
      font-family: var(--sans); font-size: 0.68rem; color: var(--ink-soft);
    }
    .ol-row:first-child { background: color-mix(in srgb, var(--accent) 18%, transparent); }

    /* The ring marks the transform-origin: the one point that stays put. */
    .ol-ring {
      position: absolute; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px;
      border-radius: 50%; border: 2px solid var(--accent);
      background: color-mix(in srgb, var(--accent) 22%, transparent);
      pointer-events: none;
    }
    .ol-ring::after {
      content: ''; position: absolute; inset: 4px;
      border-radius: 50%; background: var(--accent);
    }

    .ol-status {
      margin-top: 0.4rem; font-family: var(--mono); font-size: 0.68rem;
      color: var(--ink-faint); min-height: 2.4em; line-height: 1.5;
    }
    .ol-status b { font-weight: 600; }
    .ol-status b.yes { color: var(--good); }
    .ol-status b.no { color: var(--bad); }

    .ol-foot { padding: 0.85rem; border-top: 1px solid var(--rule); display: grid; gap: 0.85rem; }
    @media (min-width: 760px) {
      .ol-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    /* corner picker — spatial, because the thing being picked is a position */
    .ol-picker { display: grid; gap: 0.4rem; }
    .ol-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
      width: 132px; padding: 4px; border: 1px solid var(--rule); border-radius: 6px;
      background: var(--paper);
    }
    .ol-grid button {
      height: 26px; border: 1px solid transparent; border-radius: 4px;
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      font-family: var(--sans); font-size: 0.62rem; color: var(--ink-faint);
      cursor: pointer;
    }
    .ol-grid button[aria-pressed="true"] {
      background: var(--accent); color: var(--paper); border-color: var(--accent);
    }
    .ol-drift { grid-column: 1 / -1; margin: 0;
      border-top: 1px dotted var(--rule); padding-top: 0.7rem;
      font-family: var(--sans); font-size: 0.78rem; line-height: 1.5; color: var(--ink-soft); }
    .ol-drift b { color: var(--ink); }
    @media print { .ol-actions, .ol-foot .control, .ol-picker { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('ol-styles')) return;
    const el = document.createElement('style');
    el.id = 'ol-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'ol-' + ++uid;
    const title = root.dataset.title || 'Open it from each corner';

    const state = { corner: 'tr', scale: 0.85, dur: 260, ease: 'out-strong', rotate: 'no' };
    let cycling = null;
    const timers = [];

    const panelMarkup = `
      <span class="ol-ring" data-ring></span>
      <div class="ol-row">Duplicate</div>
      <div class="ol-row">Share</div>
      <div class="ol-row">Delete</div>`;

    root.id = id;
    root.className = 'ol';
    root.innerHTML = `
      <div class="ol-head">
        <span>${title}</span>
        <div class="ol-actions">
          <button class="btn primary" type="button" data-open>Open both</button>
          <button class="btn" type="button" data-cycle>Tour the corners</button>
        </div>
      </div>
      <div class="ol-body">
        <div class="ol-cell">
          <div class="ol-celltitle">origin <em>follows the trigger</em></div>
          <div class="ol-stage" data-stage="a">
            <button class="ol-trigger" data-trigger="a" type="button">Menu</button>
            <div class="ol-panel" data-panel="a">${panelMarkup}</div>
          </div>
          <div class="ol-status" data-status="a"></div>
        </div>
        <div class="ol-cell">
          <div class="ol-celltitle">origin <b>left at the default</b></div>
          <div class="ol-stage" data-stage="b">
            <button class="ol-trigger" data-trigger="b" type="button">Menu</button>
            <div class="ol-panel" data-panel="b">${panelMarkup}</div>
          </div>
          <div class="ol-status" data-status="b"></div>
        </div>
      </div>
      <div class="ol-foot">
        <div class="ol-picker">
          <span class="control-label"><span>trigger corner</span></span>
          <div class="ol-grid">
            <button type="button" data-corner="tl">↖</button>
            <button type="button" data-corner="tr">↗</button>
            <button type="button" data-corner="bl">↙</button>
            <button type="button" data-corner="br">↘</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>scale from</span>
            <span class="control-value" data-out-scale></span></span>
          <input type="range" min="0" max="0.98" step="0.01" data-k="scale">
        </div>
        <div class="control">
          <span class="control-label"><span>duration</span>
            <span class="control-value" data-out-dur></span></span>
          <input type="range" min="80" max="1200" step="20" data-k="dur">
        </div>
        <div class="control">
          <span class="control-label"><span>easing</span></span>
          <select data-k="ease">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
        <div class="control">
          <span class="control-label"><span>add a rotation</span></span>
          <select data-k="rotate">
            <option value="no">no — scale only</option>
            <option value="yes">yes — scale + 8° tilt</option>
          </select>
        </div>
        <p class="ol-drift" data-drift></p>
      </div>
    `;

    const el = (sel) => root.querySelector(sel);
    const panels = { a: el('[data-panel="a"]'), b: el('[data-panel="b"]') };
    const triggers = { a: el('[data-trigger="a"]'), b: el('[data-trigger="b"]') };
    const rings = { a: panels.a.querySelector('[data-ring]'), b: panels.b.querySelector('[data-ring]') };
    const statuses = { a: el('[data-status="a"]'), b: el('[data-status="b"]') };
    const drift = el('[data-drift]');

    function easeCss() {
      return (EASES.find((e) => e.id === state.ease) || EASES[0]).css;
    }

    // Places the trigger in its corner and the panel immediately inward of it,
    // so the panel corner nearest the button is always the one being tested.
    function layout() {
      const c = CORNERS[state.corner];
      const top = c.oy === 0;
      const left = c.ox === 0;

      ['a', 'b'].forEach((k) => {
        const t = triggers[k], p = panels[k];
        t.style.cssText += '';
        t.style.top = top ? PAD + 'px' : '';
        t.style.bottom = top ? '' : PAD + 'px';
        t.style.left = left ? PAD + 'px' : '';
        t.style.right = left ? '' : PAD + 'px';

        const inward = PAD + TRIGGER_H + GAP;
        p.style.top = top ? inward + 'px' : '';
        p.style.bottom = top ? '' : inward + 'px';
        p.style.left = left ? PAD + 'px' : '';
        p.style.right = left ? '' : PAD + 'px';

        // Lane A tracks the trigger. Lane B is the untouched default.
        const origin = k === 'a' ? c.origin : 'center center';
        p.style.transformOrigin = origin;

        const rx = k === 'a' ? c.ox : 50;
        const ry = k === 'a' ? c.oy : 50;
        rings[k].style.left = rx + '%';
        rings[k].style.top = ry + '%';
      });

      report();
    }

    function applyMotion() {
      const d = state.dur, e = easeCss();
      ['a', 'b'].forEach((k) => {
        const p = panels[k];
        p.style.setProperty('--s', state.scale);
        p.style.setProperty('--r', state.rotate === 'yes' ? '8deg' : '0deg');
        p.style.transition = `transform ${d}ms ${e}, opacity ${d}ms ${e}`;
      });
    }

    function report() {
      const c = CORNERS[state.corner];
      const s = state.scale;

      // How far the anchored corner starts from where it belongs. With the
      // origin at that corner it is zero, by definition. With the origin at
      // the centre, the corner is pulled inward by half the shrinkage.
      const dx = (1 - s) * PANEL_W / 2;
      const dy = (1 - s) * PANEL_H / 2;
      const dist = Math.round(Math.hypot(dx, dy));

      statuses.a.innerHTML =
        `transform-origin: ${c.origin}<br><b class="yes">anchored corner moves 0px</b>`;
      statuses.b.innerHTML =
        `transform-origin: center center<br><b class="no">anchored corner moves ${dist}px</b>`;

      drift.innerHTML = s >= 0.98
        ? `At <b>scale ${s.toFixed(2)}</b> there is nothing to see — a panel that barely scales
           has no origin problem. Drag it down and the two lanes separate.`
        : `At <b>scale ${s.toFixed(2)}</b>, the corner touching the button starts
           <b>${dist}px</b> away from where it ends up — on the right-hand lane only. That
           travel is the whole tell: the panel reads as sliding into position near the button
           rather than coming out of it.` +
          (s < 0.6 ? ` <b>And below about 0.8 the text inside is illegible on the way in</b> —
           scale from 0.85–0.95, never from 0.` : '');
    }

    function open() {
      applyMotion();
      panels.a.classList.remove('open');
      panels.b.classList.remove('open');
      void panels.a.offsetWidth;
      requestAnimationFrame(() => {
        panels.a.classList.add('open');
        panels.b.classList.add('open');
      });
    }

    function close() {
      panels.a.classList.remove('open');
      panels.b.classList.remove('open');
    }

    function stopCycle() {
      if (cycling) { clearInterval(cycling); cycling = null; }
      timers.forEach(clearTimeout); timers.length = 0;
      root.querySelector('[data-cycle]').textContent = 'Tour the corners';
    }

    // Self-driving: the reader should be free to watch the rings rather than
    // aim a mouse at four different buttons.
    function cycle() {
      if (cycling) { stopCycle(); return; }
      root.querySelector('[data-cycle]').textContent = 'Stop tour';
      let i = ORDER.indexOf(state.corner);
      const beat = () => {
        setCorner(ORDER[i % ORDER.length]);
        i += 1;
        open();
        timers.push(setTimeout(close, Math.max(state.dur + 700, 1100)));
      };
      beat();
      cycling = setInterval(beat, Math.max(state.dur + 1400, 1900));
    }

    function setCorner(c) {
      state.corner = c;
      root.querySelectorAll('[data-corner]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.corner === c));
      });
      close();
      layout();
      applyMotion();
    }

    root.querySelectorAll('[data-corner]').forEach((b) => {
      b.addEventListener('click', () => { stopCycle(); setCorner(b.dataset.corner); });
    });
    root.querySelector('[data-open]').addEventListener('click', () => { stopCycle(); open(); });
    root.querySelector('[data-cycle]').addEventListener('click', cycle);
    ['a', 'b'].forEach((k) => {
      triggers[k].addEventListener('click', () => {
        stopCycle();
        if (panels.a.classList.contains('open')) close(); else open();
      });
    });

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      const out = root.querySelector(`[data-out-${key}]`);
      const sync = () => {
        if (!out) return;
        out.textContent = key === 'dur' ? state[key] + 'ms' : Number(state[key]).toFixed(2);
      };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseFloat(input.value) : input.value;
        sync();
        applyMotion();
        report();
      });
    });

    setCorner(state.corner);
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-origin-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
