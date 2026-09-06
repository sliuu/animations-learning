/* ============================================================
   motion-pref-lab.js — the same interface under three policies.

   Four kinds of motion live in one stage, deliberately chosen to
   pull in different directions:

     ambient band  — large-area background drift. Decoration.
     hero card     — slides up and fades. Says "this is new."
     spinner       — infinite rotation. IS the message: "working."
     toast         — slides in from the right. Says "this arrived."

   The reader flips a simulated `prefers-reduced-motion` and then
   picks a policy. The point of the lab is that the famous
   copy-pasted global reset gets the ambient band right and the
   spinner catastrophically wrong, and that "reduce" is a
   statement about displacement, not about duration.

   Usage:
     <div data-motion-pref-lab data-title="One interface, three policies"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const POLICIES = {
    ignore: {
      label: 'ignore it',
      css: () => `/* No @media rule anywhere in the stylesheet.\n   The preference is expressed, received, and dropped. */`,
    },
    nuke: {
      label: 'the global reset',
      css: () => `@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}`,
    },
    tune: {
      label: 'per kind of motion',
      css: (s) => `@media (prefers-reduced-motion: reduce) {\n  /* 1. Informational — keep the timing, drop the travel. */\n  .hero-card, .toast { --travel: 0px; }\n\n  /* 2. Ambient — nothing is lost by removing it. */\n  .parallax-band { animation: none; }\n\n  /* 3. Status — the motion IS the message. Leave it alone. */\n}\n\n/* unchanged in both modes: ${s.dur}ms, ease-out */`,
    },
  };

  // What each policy does to each of the four, in the lab's own words.
  const VERDICTS = {
    ignore: {
      band:  ['large-area drift, continuously', 'bad'],
      hero:  [(s) => `travels ${s.travel}px`, (s) => (s.travel > 40 ? 'bad' : 'warn')],
      spin:  ['spins — small, contained, and it is the message', 'good'],
      toast: [(s) => `travels ${Math.round(s.travel * 1.6)}px`,
              (s) => (s.travel * 1.6 > 40 ? 'bad' : 'warn')],
    },
    nuke: {
      band:  ['stopped', 'good'],
      hero:  ['jump cut — appears with no transition', 'warn'],
      spin:  ['frozen — no longer indicates anything', 'bad'],
      toast: ['jump cut — appears with no transition', 'warn'],
    },
    tune: {
      band:  ['removed', 'good'],
      hero:  [(s) => `fades in place, 0px travel, ${s.dur}ms`, 'good'],
      spin:  ['untouched', 'good'],
      toast: [(s) => `fades in place, 0px travel, ${s.dur}ms`, 'good'],
    },
  };

  const FULL = {
    band:  ['runs', ''],
    hero:  [(s) => `slides ${s.travel}px and fades`, ''],
    spin:  ['spins', ''],
    toast: [(s) => `slides ${Math.round(s.travel * 1.6)}px and fades`, ''],
  };

  const ROWS = [
    ['band',  'ambient band',  'decoration'],
    ['hero',  'hero card',     'informational'],
    ['spin',  'sync spinner',  'status'],
    ['toast', 'toast',         'informational'],
  ];

  const STYLES = `
    .mpl { margin: 1.75rem 0; border: 1px solid var(--rule); border-radius: 8px;
      background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .mpl { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .mpl-head { display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
    .mpl-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .mpl-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      border: 1px solid var(--rule); border-radius: 6px;
      overflow: hidden; background: var(--paper); }
    .mpl-seg button { font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.01em; text-transform: none; padding: 0.4rem 0.5rem; text-align: center;
      border: 0; border-right: 1px solid var(--rule); background: transparent;
      color: var(--ink-soft); cursor: pointer; }
    .mpl-seg button:last-child { border-right: 0; }
    .mpl-seg button[aria-pressed="true"] { background: var(--accent); color: var(--paper); }
    .mpl-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .mpl-seg.off { opacity: 0.4; pointer-events: none; }

    .mpl-body { display: grid; gap: 0; background: var(--paper); }
    @media (min-width: 820px) { .mpl-body { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); } }

    /* ---- the stage ---- */
    .mpl-stage { --travel: 24px; --dur: 380ms; --ease: cubic-bezier(0.23, 1, 0.32, 1);
      position: relative; overflow: hidden; min-height: 268px;
      padding: 1rem 1rem 1.1rem;
      display: grid; grid-template-rows: auto auto 1fr; gap: 0.85rem;
      border-right: 1px solid var(--rule); }
    @media (max-width: 819px) { .mpl-stage { border-right: 0; border-bottom: 1px solid var(--rule); } }

    .mpl-band { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
    .mpl-band i { position: absolute; top: -30%; left: -70%; width: 240%; height: 160%;
      background: repeating-linear-gradient(104deg,
        transparent 0px,
        color-mix(in srgb, var(--accent) 12%, transparent) 46px,
        transparent 104px);
      animation: mpl-drift 2.6s ease-in-out infinite alternate; will-change: transform; }
    @keyframes mpl-drift {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to   { transform: translate3d(11%, -5%, 0) scale(1.14); }
    }
    .mpl-stage.calm .mpl-band i { animation: none; opacity: 0.3; }

    .mpl-stage > *:not(.mpl-band) { position: relative; z-index: 1; }

    .mpl-hero { border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
      padding: 0.7rem 0.8rem; display: grid; gap: 0.2rem;
      opacity: 0; transform: translateY(var(--travel));
      transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease); }
    .mpl-hero b { font-family: var(--sans); font-size: 0.85rem; color: var(--ink); }
    .mpl-hero span { font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint); }

    .mpl-status { display: flex; align-items: center; gap: 0.5rem;
      font-family: var(--sans); font-size: 0.75rem; color: var(--ink-soft); }
    .mpl-spin { width: 17px; height: 17px; border-radius: 50%; flex: none;
      border: 2px solid color-mix(in srgb, var(--ink) 16%, transparent);
      border-top-color: var(--accent);
      animation: mpl-spin 780ms linear infinite; }
    @keyframes mpl-spin { to { transform: rotate(360deg); } }

    .mpl-toast { align-self: end; justify-self: start; border-radius: 7px;
      background: color-mix(in srgb, var(--ink) 88%, transparent); color: var(--paper);
      font-family: var(--sans); font-size: 0.76rem; padding: 0.45rem 0.75rem;
      opacity: 0; transform: translateX(calc(var(--travel) * 1.6));
      transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
      transition-delay: 240ms; }

    .mpl-stage.playing .mpl-hero,
    .mpl-stage.playing .mpl-toast { opacity: 1; transform: none; }

    /* The actual, verbatim, widely copy-pasted reset. Not a simulation of it. */
    .mpl-stage.nuke *, .mpl-stage.nuke *::before, .mpl-stage.nuke *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    /* ---- readout ---- */
    .mpl-panel { padding: 0.85rem; display: grid; gap: 0.7rem; align-content: start; }
    .mpl-table { width: 100%; border-collapse: collapse; font-family: var(--sans); font-size: 0.72rem; }
    .mpl-table th { text-align: left; font-size: 0.62rem; letter-spacing: 0.09em;
      text-transform: uppercase; color: var(--ink-faint); font-weight: 600;
      padding: 0 0.4rem 0.3rem 0; border-bottom: 1px solid var(--rule); }
    .mpl-table td { padding: 0.34rem 0.4rem 0.34rem 0; border-bottom: 1px solid var(--rule);
      vertical-align: baseline; color: var(--ink-soft); }
    .mpl-table td:first-child { color: var(--ink); font-weight: 600; white-space: nowrap; }
    .mpl-table td.kind { color: var(--ink-faint); font-size: 0.66rem;
      letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
    .mpl-table td.v-good { color: var(--good); }
    .mpl-table td.v-bad { color: var(--bad); font-weight: 600; }
    .mpl-table td.v-warn { color: var(--ink); }

    .mpl-os { font-family: var(--sans); font-size: 0.68rem; color: var(--ink-faint);
      border: 1px dashed var(--rule); border-radius: 6px; padding: 0.4rem 0.55rem; }
    .mpl-os b { font-family: var(--mono); color: var(--ink); }

    .mpl-css pre { margin: 0.3rem 0 0; padding: 0.6rem 0.7rem; overflow-x: auto;
      border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-sunk);
      font-family: var(--mono); font-size: 0.67rem; line-height: 1.5; color: var(--ink-soft);
      white-space: pre; }
    .mpl-css .control-label { display: block; }

    .mpl-foot { padding: 0.8rem 0.85rem; border-top: 1px solid var(--rule);
      background: var(--paper-sunk); display: grid; gap: 0.8rem; }
    @media (min-width: 620px) { .mpl-foot { grid-template-columns: 1fr 1fr; gap: 0.8rem 1.6rem; } }

    @media print { .mpl-actions, .mpl-foot .control { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('mpl-styles')) return;
    const el = document.createElement('style');
    el.id = 'mpl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'mpl-' + ++uid;
    const title = root.dataset.title || 'One interface, three policies';

    const state = { pref: 'reduce', policy: 'nuke', travel: 24, dur: 380 };

    root.id = id;
    root.className = 'mpl';
    root.innerHTML = `
      <div class="mpl-head">
        <span>${title}</span>
        <div class="mpl-actions">
          <button class="btn primary" type="button" data-act="play">Play the sequence</button>
          <button class="btn" type="button" data-act="loop">Loop it</button>
        </div>
      </div>

      <div class="mpl-body">
        <div class="mpl-stage" data-stage>
          <div class="mpl-band"><i></i></div>
          <div class="mpl-hero">
            <b>3 files added to Shared</b>
            <span>Uploaded a moment ago by Priya</span>
          </div>
          <div class="mpl-status"><span class="mpl-spin"></span><span>Syncing 3 files…</span></div>
          <div class="mpl-toast">Draft saved</div>
        </div>

        <div class="mpl-panel">
          <table class="mpl-table">
            <thead>
              <tr><th>element</th><th>kind</th><th>what it does now</th></tr>
            </thead>
            <tbody data-rows></tbody>
          </table>
          <div class="mpl-os" data-os></div>
          <div class="mpl-css">
            <span class="control-label"><span>the CSS this policy is</span></span>
            <pre data-css></pre>
          </div>
        </div>
      </div>

      <div class="mpl-foot">
        <div class="control">
          <span class="control-label"><span>the user's preference</span></span>
          <div class="mpl-seg" data-seg="pref">
            <button type="button" data-val="none">no-preference</button>
            <button type="button" data-val="reduce">reduce</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>your policy when it says reduce</span></span>
          <div class="mpl-seg" data-seg="policy">
            ${Object.entries(POLICIES).map(([k, p]) =>
              `<button type="button" data-val="${k}">${p.label}</button>`).join('')}
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>travel distance</span>
            <span class="control-value" data-out-travel></span></span>
          <input type="range" min="0" max="80" step="2" data-k="travel">
        </div>
        <div class="control">
          <span class="control-label"><span>duration</span>
            <span class="control-value" data-out-dur></span></span>
          <input type="range" min="80" max="900" step="20" data-k="dur">
        </div>
      </div>
    `;

    const el = (s) => root.querySelector(s);
    const stage = el('[data-stage]');
    const rowsEl = el('[data-rows]');
    const cssEl = el('[data-css]');
    const osEl = el('[data-os]');

    /* ---- the real system preference, reported live ---- */
    const mq = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    function paintOS() {
      if (!mq) { osEl.textContent = 'This browser cannot report the preference.'; return; }
      osEl.innerHTML = mq.matches
        ? `Your system is really asking for <b>reduce</b> right now. The toggle above only drives this lab.`
        : `Your system currently says <b>no-preference</b>. The toggle above simulates the other answer.`;
    }
    paintOS();
    if (mq && mq.addEventListener) mq.addEventListener('change', paintOS);

    /* ---- play ---- */
    let looping = false;
    let timer = null;

    function play() {
      stage.classList.remove('playing');
      void stage.offsetWidth;                     // commit the reset before re-adding
      stage.classList.add('playing');
    }

    function stopLoop() {
      looping = false;
      clearInterval(timer);
      timer = null;
      el('[data-act="loop"]').textContent = 'Loop it';
      el('[data-act="loop"]').classList.remove('primary');
    }

    function toggleLoop() {
      if (looping) { stopLoop(); return; }
      looping = true;
      el('[data-act="loop"]').textContent = 'Stop looping';
      el('[data-act="loop"]').classList.add('primary');
      play();
      timer = setInterval(play, Math.max(1400, state.dur + 1100));
    }

    /* ---- paint ---- */
    function effective() {
      // Which policy is actually in force. With no-preference, none of them are.
      return state.pref === 'reduce' ? state.policy : null;
    }

    function paintRows() {
      const p = effective();
      const map = p ? VERDICTS[p] : FULL;
      rowsEl.innerHTML = ROWS.map(([key, name, kind]) => {
        const [text, verdict] = map[key];
        const t = typeof text === 'function' ? text(state) : text;
        const v = typeof verdict === 'function' ? verdict(state) : verdict;
        return `<tr><td>${name}</td><td class="kind">${kind}</td>` +
               `<td class="${v ? 'v-' + v : ''}">${t}</td></tr>`;
      }).join('');
    }

    function paint() {
      const p = effective();

      stage.style.setProperty('--travel', (p === 'tune' ? 0 : state.travel) + 'px');
      stage.style.setProperty('--dur', state.dur + 'ms');
      stage.classList.toggle('nuke', p === 'nuke');
      stage.classList.toggle('calm', p === 'tune');

      root.querySelectorAll('[data-seg]').forEach((seg) => {
        const k = seg.dataset.seg;
        seg.classList.toggle('off', k === 'policy' && state.pref !== 'reduce');
        seg.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', String(state[k] === b.dataset.val));
        });
      });

      el('[data-out-travel]').textContent = state.travel + 'px';
      el('[data-out-dur]').textContent = state.dur + 'ms';

      cssEl.textContent = p ? POLICIES[p].css(state)
        : '/* The preference is no-preference.\n   Everything below the media query is dormant. */';

      paintRows();
      if (looping) { clearInterval(timer); timer = setInterval(play, Math.max(1400, state.dur + 1100)); }
    }

    /* ---- wiring ---- */
    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-seg] button');
      if (seg) {
        state[seg.parentElement.dataset.seg] = seg.dataset.val;
        paint();
        play();
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'play') { stopLoop(); play(); }
      if (act.dataset.act === 'loop') toggleLoop();
    });

    root.querySelectorAll('input[type="range"]').forEach((input) => {
      input.value = state[input.dataset.k];
      input.addEventListener('input', () => {
        state[input.dataset.k] = Number(input.value);
        paint();
      });
      input.addEventListener('change', play);
    });

    paint();

    /* Play once now, so the stage is never sitting at opacity 0 waiting for
       something. In the bundled course this lab's document is display:none at
       load, and transitions don't run on a hidden subtree — so this first play
       lands the stage on its end state rather than animating, which is exactly
       what we want as a floor.

       Then replay whenever the lab actually comes into view, which is the
       entrance the reader is meant to see. Re-arm when it leaves. If
       IntersectionObserver never fires, the floor above is what shows. */
    play();

    if ('IntersectionObserver' in window) {
      let armed = false;
      new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.boundingClientRect.height > 0) {
            if (armed) { armed = false; play(); }
          } else {
            armed = true;
          }
        }
      }, { threshold: 0 }).observe(root);
    }
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-motion-pref-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
