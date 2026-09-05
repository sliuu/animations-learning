/* ============================================================
   clock-lab.js — two buttons, two clocks.

   Why this exists: lesson 0010's timing argument used to be a
   single slider on a single button. To compare 80ms against
   400ms you dragged the slider and pressed again — which asks
   the reader to hold a *feeling* in memory across ten seconds
   and an act of fiddling. Feelings do not survive that.

   So: two real buttons, side by side, differing in exactly one
   number, both pressed by the reader's own hand seconds apart.
   Which side is which is randomised and hidden until they ask,
   so the first read is honest rather than confirmed.

   Three comparisons, one slider:
     speed   — A presses in 80ms, B in whatever you set.
     release — A is 80 down / 180 up, B is symmetric at your number.
     origin  — the same number, in two roles: A spends it
               answering the hand, B spends it on a panel the
               system brings in. This is "who moved first" made
               pressable rather than asserted.

   Everything here is real CSS on a real :active. The JS sets
   custom properties and gets out of the way.

   Usage:
     <div data-clock-lab data-title="Two buttons, two clocks"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const A_DOWN = 80;      // the value the lesson argues for
  const A_UP = 180;

  const MODES = {
    speed: {
      label: 'press-down on',
      min: 0, max: 400, step: 20, start: 400,
      blurb: 'Press A. Press B. Press A again. One of them is answering you and one of them is thinking about it.',
    },
    release: {
      label: 'both durations on', symmetric: true,
      min: 40, max: 400, step: 20, start: 80,
      blurb: 'One side goes down fast and comes back slowly. The other uses a single number for both directions. Press each a few times — the difference is entirely in the release.',
    },
    origin: {
      label: 'the number both sides spend', shared: true,
      min: 80, max: 600, step: 20, start: 300,
      blurb: 'Both sides spend the same number of milliseconds. One spends it on the button under your finger, the other on a panel it brings in for you. Press each several times before revealing which.',
    },
  };

  const STYLES = `
    .ck { margin: 1.75rem 0; border: 1px solid var(--rule); border-radius: 8px;
      background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .ck { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .ck-head { display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
    .ck-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .ck-body { display: grid; gap: 1rem; padding: 1rem 0.85rem 1.15rem; }
    @media (min-width: 780px) {
      .ck-body { grid-template-columns: minmax(0, 1fr) 15.5rem; align-items: start; }
    }

    .ck-stage { display: grid; gap: 0.75rem; }
    .ck-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    /* Each pane owns its own stacking context so the panel in "origin" mode
       can be absolutely placed without ever pushing the button around. A
       press demo that moves its own furniture is measuring the wrong thing. */
    .ck-pane {
      position: relative; overflow: hidden;
      display: grid; gap: 0.6rem; justify-items: center; align-content: start;
      /* The bottom band is reserved for .ck-panel, which is absolutely placed.
         Without it the panel slides up over the note that explains the mode. */
      min-height: 9.5rem; padding: 0.85rem 0.85rem 3.3rem;
      border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
    }
    .ck-tag {
      font-family: var(--mono); font-size: 0.72rem; font-weight: 600;
      color: var(--ink-faint); letter-spacing: 0.08em;
    }
    .ck-pane.lit .ck-tag { color: var(--accent); }

    .ck-btn {
      font-family: var(--sans); font-size: 0.82rem; font-weight: 600;
      color: var(--paper); background: var(--accent);
      border: 0; border-radius: 7px; padding: 0.7rem 1.1rem;
      cursor: pointer; touch-action: manipulation;
      transform: scale(1);
      transition: transform var(--up) var(--ease-out-strong);
    }
    .ck-btn:active {
      transform: scale(var(--depth));
      transition: transform var(--down) var(--ease-out-strong);
    }
    .ck-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }

    .ck-note { font-family: var(--sans); font-size: 0.7rem; color: var(--ink-faint);
      text-align: center; min-height: 1.1rem; }
    .ck-num { font-family: var(--mono); color: var(--accent); }

    /* the system's move, for "origin" mode */
    .ck-panel {
      position: absolute; left: 0.85rem; right: 0.85rem; bottom: 0.85rem;
      padding: 0.55rem 0.7rem; border-radius: 6px;
      background: var(--ink); color: var(--paper);
      font-family: var(--sans); font-size: 0.72rem;
      transform: translateY(140%);
      transition: transform var(--sys) var(--ease-out-strong);
    }
    .ck-panel.up { transform: translateY(0); }

    .ck-hint { font-family: var(--sans); font-size: 0.75rem; line-height: 1.5;
      color: var(--ink-soft); border-left: 2px solid var(--rule); padding-left: 0.7rem; }

    .ck-verdict { font-family: var(--sans); font-size: 0.72rem; line-height: 1.5;
      border: 1px solid var(--rule); border-left-width: 3px; border-radius: 5px;
      padding: 0.55rem 0.7rem; color: var(--ink-soft); background: var(--paper); }
    .ck-verdict.good { border-left-color: var(--good); color: var(--good); }
    .ck-verdict.bad { border-left-color: var(--bad); color: var(--bad); }

    .ck-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      border: 1px solid var(--rule); border-radius: 6px; overflow: hidden;
      background: var(--paper); }
    .ck-seg button { font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      padding: 0.4rem 0.3rem; border: 0; border-right: 1px solid var(--rule);
      background: transparent; color: var(--ink-soft); cursor: pointer; }
    .ck-seg button:last-child { border-right: 0; }
    .ck-seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }
    .ck-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

    .ck-side { display: grid; gap: 0.85rem; }
    .ck-code { font-family: var(--mono); font-size: 0.68rem; line-height: 1.55;
      white-space: pre-wrap; margin: 0; padding: 0.6rem 0.7rem;
      background: var(--code-bg); border-radius: 5px; color: var(--ink-soft); }
    .ck-code.hidden { color: var(--ink-faint); font-style: italic; font-family: var(--sans); }

    @media print { .ck-side, .ck-actions { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      /* The press itself is the safest motion on the page — 0009's own
         reasoning — so it stays. The panel travels, so it stops travelling. */
      .ck-panel { transition-duration: 0.01ms; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('clock-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'clock-lab-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'ck' + (++uid);
    const title = root.dataset.title || 'Two buttons, two clocks';

    const state = { mode: 'speed', v: MODES.speed.start, shown: false, swap: Math.random() < 0.5 };

    root.classList.add('ck');
    root.innerHTML = `
      <div class="ck-head">
        <span>${title}</span>
        <div class="ck-actions">
          <button class="btn primary" type="button" data-act="reveal">Which is which?</button>
          <button class="btn" type="button" data-act="reshuffle">Shuffle sides</button>
        </div>
      </div>
      <div class="ck-body">
        <div class="ck-stage">
          <div class="ck-pair">
            <div class="ck-pane" data-pane="0">
              <span class="ck-tag">A</span>
              <button class="ck-btn" type="button" data-press="0">Add to project</button>
              <p class="ck-note" data-note="0"></p>
              <div class="ck-panel" data-panel="0">Added to <b>Q3 launch</b></div>
            </div>
            <div class="ck-pane" data-pane="1">
              <span class="ck-tag">B</span>
              <button class="ck-btn" type="button" data-press="1">Add to project</button>
              <p class="ck-note" data-note="1"></p>
              <div class="ck-panel" data-panel="1">Added to <b>Q3 launch</b></div>
            </div>
          </div>
          <p class="ck-hint" data-hint></p>
          <div class="ck-verdict" data-verdict></div>
        </div>
        <div class="ck-side">
          <div class="control">
            <span class="control-label"><span>what's being compared</span></span>
            <div class="ck-seg" data-seg="mode">
              <button type="button" data-val="speed">speed</button>
              <button type="button" data-val="release">release</button>
              <button type="button" data-val="origin">who moved first</button>
            </div>
          </div>
          <label class="control">
            <span class="control-label"><span data-slider-label></span>
              <span class="control-value" data-out-v></span></span>
            <input type="range" data-k="v">
          </label>
          <div class="control">
            <span class="control-label"><span>the CSS behind it</span></span>
            <pre class="ck-code" data-code></pre>
          </div>
        </div>
      </div>
    `;

    const el = (s) => root.querySelector(s);
    const panes = [el('[data-pane="0"]'), el('[data-pane="1"]')];
    const slider = el('input[data-k="v"]');

    /* Which pane holds the argued-for value. Randomised so the reader's first
       press is not steered by knowing which side is supposed to win. */
    function sideOf(which) {
      const i = which === 'good' ? 0 : 1;
      return panes[state.swap ? 1 - i : i];
    }
    function roleOf(idx) {
      const good = state.swap ? 1 : 0;
      return idx === good ? 'good' : 'test';
    }

    /* The sides are shuffled, so every sentence that names a side has to ask
       which letter it landed on. Hardcoding "B is too slow" is wrong half the
       time — and wrong in the way that quietly teaches the opposite lesson. */
    const LETTER = ['A', 'B'];
    function testLetter() { return LETTER[state.swap ? 0 : 1]; }
    function goodLetter() { return LETTER[state.swap ? 1 : 0]; }

    /* ---- per-mode timing, expressed as custom properties ---- */
    function applyTiming() {
      const m = state.mode;
      [0, 1].forEach((idx) => {
        const pane = panes[idx];
        const good = roleOf(idx) === 'good';
        let down = A_DOWN, up = A_UP, sys = 0, depth = 0.96;

        if (m === 'speed') {
          down = good ? A_DOWN : state.v;
        } else if (m === 'release') {
          if (good) { down = A_DOWN; up = A_UP; } else { down = state.v; up = state.v; }
        } else {
          // origin: the same number, spent on two different things.
          if (good) { down = A_DOWN; up = A_UP; sys = state.v; }
          else { down = state.v; up = A_UP; sys = 0; }
        }
        pane.style.setProperty('--down', down + 'ms');
        pane.style.setProperty('--up', up + 'ms');
        pane.style.setProperty('--sys', (sys || 1) + 'ms');
        pane.style.setProperty('--depth', depth);
      });
    }

    /* ---- pressing ---- */
    root.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-press]');
      if (!b) return;
      const idx = Number(b.dataset.press);
      panes[idx].classList.add('lit');
    });

    root.addEventListener('pointerup', (e) => {
      const b = e.target.closest('[data-press]');
      if (!b) return;
      const idx = Number(b.dataset.press);
      if (state.mode !== 'origin') return;
      // Only the side spending its milliseconds on the system's own move
      // brings the panel in. The other side spent them under the finger.
      if (roleOf(idx) !== 'good') return;
      const panel = root.querySelector(`[data-panel="${idx}"]`);
      panel.classList.add('up');
      clearTimeout(panel._t);
      panel._t = setTimeout(() => panel.classList.remove('up'), 1400);
    });

    /* ---- painting ---- */
    function noteFor(idx) {
      if (!state.shown) return '';
      const m = state.mode, good = roleOf(idx) === 'good';
      if (m === 'speed') return good ? A_DOWN + 'ms down' : state.v + 'ms down';
      if (m === 'release') return good ? A_DOWN + ' / ' + A_UP + 'ms' : state.v + ' / ' + state.v + 'ms';
      return good ? state.v + 'ms on the panel' : state.v + 'ms on the press';
    }

    function verdict() {
      const m = state.mode, v = state.v, T = testLetter(), G = goodLetter();
      if (m === 'speed') {
        if (v <= 100) return ['Both are inside the 0.1s direct-manipulation limit, so both feel attached to you. Push ' + T + ' further out to find where that stops being true.', ''];
        if (v <= 180) return [T + ' is past 0.1s. It still looks fine — the difference is not in how it looks, it is in whether the button feels like yours.', 'bad'];
        return [T + ' is well past the limit. Same curve, same 4%, and the button now reads as a machine complying rather than a surface yielding.', 'bad'];
      }
      if (m === 'release') {
        if (v <= 100) return [T + ' is symmetric and fast. Going down that quickly is right; coming back up that quickly reads as a switch flipping rather than a surface relaxing.', 'bad'];
        if (v >= 200) return [T + ' is symmetric and slow, so it fails on the way in as well — press feedback is the one thing that can never wait.', 'bad'];
        return [T + ' at ' + v + 'ms both ways is the version most people ship. It is not wrong so much as dead: nothing distinguishes your action from the button recovering from it.', 'bad'];
      }
      if (v <= 140) return ['At ' + v + 'ms both sides are fine. The distinction only shows up once the number is big enough to be felt.', ''];
      return ['Both sides spend exactly ' + v + 'ms. ' + G + ' spends it on a panel it decided to bring in, and reads as normal. ' + T + ' spends it under your finger, and reads as broken. The number was never the problem.', 'good'];
    }

    function codeText() {
      if (!state.shown) return 'Press both a few times first.\nThen ask which is which.';
      const T = testLetter(), G = goodLetter(), m = state.mode;
      if (m === 'origin') {
        return `/* ${G} — the system's move */\n.panel { transition: transform ${state.v}ms; }\n.btn:active { transition: transform ${A_DOWN}ms; }\n\n/* ${T} — the same number, under a finger */\n.btn:active { transition: transform ${state.v}ms; }`;
      }
      const bUp = m === 'speed' ? A_UP : state.v;
      return `/* ${G} */\n.btn { transition: transform ${A_UP}ms; }\n.btn:active { transition: transform ${A_DOWN}ms; }\n\n/* ${T} */\n.btn { transition: transform ${bUp}ms; }\n.btn:active { transition: transform ${state.v}ms; }`;
    }

    function paint() {
      const m = MODES[state.mode];
      slider.min = m.min; slider.max = m.max; slider.step = m.step;
      slider.value = state.v;

      el('[data-slider-label]').textContent = m.shared ? m.label : m.label + ' ' + testLetter();
      el('[data-out-v]').textContent = state.v + 'ms';
      el('[data-hint]').textContent = m.blurb;

      [0, 1].forEach((i) => { el(`[data-note="${i}"]`).textContent = noteFor(i); });

      const vd = verdict();
      el('[data-verdict]').className = 'ck-verdict ' + vd[1];
      el('[data-verdict]').textContent = vd[0];

      const code = el('[data-code]');
      code.textContent = codeText();
      code.classList.toggle('hidden', !state.shown);

      root.querySelectorAll('[data-seg] button').forEach((b) => {
        b.setAttribute('aria-pressed', String(state.mode === b.dataset.val));
      });

      applyTiming();
    }

    /* ---- wiring ---- */
    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-seg] button');
      if (seg) {
        state.mode = seg.dataset.val;
        state.v = MODES[state.mode].start;
        state.shown = false;
        state.swap = Math.random() < 0.5;
        panes.forEach((p) => p.classList.remove('lit'));
        root.querySelectorAll('.ck-panel').forEach((p) => p.classList.remove('up'));
        paint();
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'reveal') state.shown = true;
      if (act.dataset.act === 'reshuffle') { state.swap = Math.random() < 0.5; state.shown = false; }
      paint();
    });

    slider.addEventListener('input', () => {
      state.v = Number(slider.value);
      paint();
    });

    paint();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-clock-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
