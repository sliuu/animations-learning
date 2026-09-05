/* ============================================================
   flip-lab.js — FLIP, taken apart one letter at a time.

   A grid of cards that reorders. The DOM change is the same in
   every mode; what differs is whether anything animates and how.

   The two teaching devices:

   1. "Step through it" holds each of the four phases for a beat
      with the numbers on screen, so the reader watches the cards
      jump to the new layout, snap back to the old one, and then
      travel to where they already are.

   2. The style-flush toggle is a real switch on a real line of
      code. Turned off, FLIP does nothing at all — no error, no
      warning, just a jump — which is exactly how it fails in
      production and why it is worth seeing once on purpose.

   Everything here is real. The rects come from
   getBoundingClientRect(); the animation is a plain CSS
   transition on transform. Nothing is faked or pre-computed.

   Usage:
     <div data-flip-lab data-title="Watch it move, or watch it teleport"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong', css: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { id: 'out', label: 'ease-out, standard', css: 'cubic-bezier(0, 0, 0.2, 1)' },
    { id: 'in-out', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    { id: 'linear', label: 'linear', css: 'linear' },
  ];

  const COUNT = 10;
  const HOLD = 1150;   // how long each phase is held during the walkthrough

  const STYLES = `
    .fl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .fl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .fl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .fl-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .fl-body { display: grid; gap: 0; background: var(--paper); }
    @media (min-width: 860px) { .fl-body { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); } }

    /* ---- the grid being reordered ---- */
    .fl-stage { padding: 1rem 0.85rem; min-height: 214px; }
    .fl-grid {
      display: grid; gap: 8px;
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    @media (max-width: 520px) { .fl-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .fl-card {
      height: 58px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--mono); font-size: 0.85rem; font-weight: 600;
      color: #fffef9;
      background: color-mix(in srgb, var(--accent) calc(28% + var(--i) * 6%), #6b6357);
      will-change: transform;
    }
    .fl-card[hidden] { display: none; }
    /* The tracked card is the one whose numbers are on the right. */
    .fl-card.tracked { outline: 2px solid var(--ink); outline-offset: 2px; }

    .fl-hint {
      margin: 0.85rem 0 0; font-family: var(--sans); font-size: 0.74rem;
      line-height: 1.5; color: var(--ink-faint);
    }

    /* ---- the readout ---- */
    .fl-panel {
      border-top: 1px solid var(--rule); padding: 1rem 0.85rem;
      display: grid; gap: 0.55rem; align-content: start;
    }
    @media (min-width: 860px) { .fl-panel { border-top: 0; border-left: 1px solid var(--rule); } }

    .fl-step {
      border: 1px solid var(--rule); border-radius: 6px; padding: 0.5rem 0.6rem;
      background: var(--paper-sunk); transition: background-color 180ms ease, border-color 180ms ease;
    }
    .fl-step.live { border-color: var(--accent); background: var(--accent-soft); }
    .fl-step.done { opacity: 0.55; }
    .fl-letter {
      font-family: var(--sans); font-size: 0.66rem; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint);
      display: flex; justify-content: space-between; gap: 0.5rem;
    }
    .fl-step.live .fl-letter { color: var(--accent); }
    .fl-num {
      font-family: var(--mono); font-size: 0.78rem; color: var(--ink);
      margin-top: 0.2rem; font-variant-numeric: tabular-nums;
    }
    .fl-say {
      font-family: var(--sans); font-size: 0.73rem; line-height: 1.45;
      color: var(--ink-soft); margin-top: 0.3rem;
    }

    .fl-verdict {
      font-family: var(--sans); font-size: 0.76rem; line-height: 1.5;
      border-top: 1px dotted var(--rule); padding-top: 0.6rem; color: var(--ink-soft);
      min-height: 3.6em;
    }
    .fl-verdict b { color: var(--ink); }
    .fl-verdict b.no { color: var(--bad); }
    .fl-verdict b.yes { color: var(--good); }

    /* ---- the code, full width so it never squeezes the grid ---- */
    .fl-code {
      border-top: 1px solid var(--rule); background: var(--code-bg);
      padding: 0.8rem 0.85rem;
    }
    .fl-code .fl-codetitle {
      font-family: var(--sans); font-size: 0.68rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint);
      margin-bottom: 0.45rem;
    }
    .fl-code pre {
      margin: 0; overflow-x: auto;
      font-family: var(--mono); font-size: 0.74rem; line-height: 1.65; color: var(--ink-soft);
    }
    .fl-code i { font-style: normal; color: var(--ink); }
    .fl-code u { text-decoration: none; color: var(--good); font-weight: 600; }
    .fl-code s { color: var(--bad); }

    .fl-foot { padding: 0.85rem; border-top: 1px solid var(--rule); display: grid; gap: 0.85rem; }
    @media (min-width: 760px) {
      .fl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    .fl-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      border: 1px solid var(--rule); border-radius: 6px;
      overflow: hidden; background: var(--paper); }
    .fl-seg button { font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      padding: 0.4rem 0.5rem; text-align: center;
      border: 0; border-right: 1px solid var(--rule); background: transparent;
      color: var(--ink-soft); cursor: pointer; }
    .fl-seg button:last-child { border-right: 0; }
    .fl-seg button[aria-pressed="true"] { background: var(--accent); color: #fffef9; }
    .fl-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .fl-foot input[disabled] { opacity: 0.45; cursor: not-allowed; }
    .fl-foot .fl-seg button[disabled] { opacity: 0.45; cursor: not-allowed; }

    @media print { .fl-actions, .fl-foot { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('fl-styles')) return;
    const el = document.createElement('style');
    el.id = 'fl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'fl-' + ++uid;
    const title = root.dataset.title || 'Watch it move, or watch it teleport';

    const state = { tech: 'flip', flush: 'forced', dur: 420, ease: 'out-strong' };
    let filtered = false;
    let walking = null;          // timer chain for the step-through
    const timers = [];

    root.id = id;
    root.className = 'fl';
    root.innerHTML = `
      <div class="fl-head">
        <span>${title}</span>
        <div class="fl-actions">
          <button class="btn primary" type="button" data-shuffle>Shuffle</button>
          <button class="btn" type="button" data-filter>Filter to evens</button>
          <button class="btn" type="button" data-walk>Step through it</button>
        </div>
      </div>

      <div class="fl-body">
        <div class="fl-stage">
          <div class="fl-grid" data-grid>
            ${Array.from({ length: COUNT }, (_, i) =>
              `<div class="fl-card" style="--i:${i}" data-n="${i + 1}">${i + 1}</div>`).join('')}
          </div>
          <p class="fl-hint" data-hint></p>
        </div>

        <div class="fl-panel">
          <div class="fl-step" data-step="F">
            <div class="fl-letter"><span>First</span><span>measure</span></div>
            <div class="fl-num" data-num="F">—</div>
            <div class="fl-say">Where card <b data-track>1</b> is right now, before anything changes.</div>
          </div>
          <div class="fl-step" data-step="L">
            <div class="fl-letter"><span>Last</span><span>measure again</span></div>
            <div class="fl-num" data-num="L">—</div>
            <div class="fl-say">The DOM has changed and the browser has already laid it out. It is
              done moving. This is the jump you are trying to avoid.</div>
          </div>
          <div class="fl-step" data-step="I">
            <div class="fl-letter"><span>Invert</span><span>lie about it</span></div>
            <div class="fl-num" data-num="I">—</div>
            <div class="fl-say">One transform puts it back where it was. The layout is still the
              new one — only the pixels disagree.</div>
          </div>
          <div class="fl-step" data-step="P">
            <div class="fl-letter"><span>Play</span><span>stop lying</span></div>
            <div class="fl-num" data-num="P">—</div>
            <div class="fl-say">Take the transform off with a transition. The card travels to
              where it already is.</div>
          </div>
          <p class="fl-verdict" data-verdict></p>
        </div>
      </div>

      <div class="fl-code">
        <div class="fl-codetitle">the code that is running</div>
        <pre data-code></pre>
      </div>

      <div class="fl-foot">
        <div class="control">
          <span class="control-label"><span>how the reorder is done</span></span>
          <div class="fl-seg" data-seg="tech">
            <button type="button" data-val="none">just change the DOM</button>
            <button type="button" data-val="flip">FLIP</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>the style flush between Invert and Play</span></span>
          <div class="fl-seg" data-seg="flush">
            <button type="button" data-val="forced">forced</button>
            <button type="button" data-val="skipped">skipped</button>
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
    const grid = el('[data-grid]');
    const hint = el('[data-hint]');
    const verdict = el('[data-verdict]');
    const codeEl = el('[data-code]');
    const cards = [...grid.children];

    // Card 1 is the one whose numbers are reported. Clicking any card moves
    // the tracking, because the interesting card is whichever one you happen
    // to be watching.
    let tracked = cards[0];
    tracked.classList.add('tracked');

    const easeCss = () => (EASES.find((e) => e.id === state.ease) || EASES[0]).css;
    const visible = () => cards.filter((c) => !c.hidden);
    const px = (n) => Math.round(n);

    function clearTimers() {
      while (timers.length) clearTimeout(timers.pop());
      walking = null;
    }

    function setNum(letter, text) { el(`[data-num="${letter}"]`).textContent = text; }
    function phase(letter) {
      root.querySelectorAll('.fl-step').forEach((s) => {
        const k = s.dataset.step;
        s.classList.toggle('live', k === letter);
        s.classList.toggle('done', letter !== null && 'FLIP'.indexOf(k) < 'FLIP'.indexOf(letter));
      });
    }
    function clearNums() {
      ['F', 'L', 'I', 'P'].forEach((k) => setNum(k, '—'));
      phase(null);
    }

    // ---- the technique itself -------------------------------------------
    // `mutate` runs the DOM change and, in FLIP mode, wraps it in the four
    // steps. `slow` splits the same four steps across four held beats.
    function mutate(fn, slow) {
      clearTimers();

      if (state.tech === 'none') {
        cards.forEach((c) => { c.style.transition = 'none'; c.style.transform = ''; });
        fn();
        clearNums();
        verdict.innerHTML = `The DOM changed and the browser laid it out. Correct, instant, and
          <b class="no">unreadable</b> — nothing on screen tells you which card went where.`;
        return;
      }

      // FIRST. getBoundingClientRect reports the box as painted, so a card
      // that is still mid-flight from the last shuffle measures where it
      // visually is, not where its layout says it should be. That is what
      // makes an interrupted FLIP pick up cleanly.
      const first = new Map();
      visible().forEach((c) => first.set(c, c.getBoundingClientRect()));
      const f = first.get(tracked);
      setNum('F', f ? `x ${px(f.left)}  y ${px(f.top)}` : 'not on screen');

      // Drop any leftover transform before measuring LAST, or the old lie
      // gets baked into the new measurement.
      cards.forEach((c) => { c.style.transition = 'none'; c.style.transform = ''; });

      const run2 = () => {
        fn();

        // LAST.
        const moved = [];
        const inverts = new Map();
        visible().forEach((c) => {
          const a = first.get(c);
          if (!a) return;
          const b = c.getBoundingClientRect();
          const dx = a.left - b.left;
          const dy = a.top - b.top;
          if (!dx && !dy) return;
          inverts.set(c, [dx, dy]);
          moved.push(c);
        });

        const lb = tracked.hidden ? null : tracked.getBoundingClientRect();
        setNum('L', lb ? `x ${px(lb.left)}  y ${px(lb.top)}` : 'hidden by the filter');
        const inv = inverts.get(tracked);
        setNum('I', inv ? `translate(${px(inv[0])}px, ${px(inv[1])}px)` : 'nothing to undo');

        const run3 = () => {
          // INVERT.
          moved.forEach((c) => {
            const [dx, dy] = inverts.get(c);
            c.style.transition = 'none';
            c.style.transform = `translate(${dx}px, ${dy}px)`;
          });

          const run4 = () => {
            // The single most load-bearing line in the technique. Reading a
            // layout property forces the browser to resolve styles now, so it
            // sees the inverted position as a real frame. Skip it and the two
            // writes collapse into one, the transform never existed as far as
            // the browser is concerned, and there is nothing to transition.
            if (state.flush === 'forced') void grid.offsetWidth;

            // PLAY.
            setNum('P', `transform: none  ·  ${state.dur}ms`);
            moved.forEach((c) => {
              c.style.transition = `transform ${state.dur}ms ${easeCss()}`;
              c.style.transform = '';
            });

            if (state.flush === 'skipped') {
              verdict.innerHTML = `<b class="no">Nothing animated.</b> The invert and the play
                landed in the same frame, so the browser never saw the old position — it only
                ever computed one transform, <code>none</code>, which is what was already there.
                No error, no warning. This is how FLIP fails in production.`;
            } else if (!moved.length) {
              verdict.innerHTML = `Nothing moved, so there was nothing to invert. FLIP costs you
                two measurements and then gets out of the way.`;
            } else {
              verdict.innerHTML = `<b class="yes">${moved.length} cards travelled.</b> Layout ran
                <b>once</b>, at Last. Every frame after that is a <code>transform</code> — the
                composite tier, the cheap end of lesson 0002's pipeline.`;
            }
            phase(slow ? 'P' : null);
            if (!slow) hintFor();
          };

          if (slow) { phase('I'); timers.push(setTimeout(run4, HOLD)); } else { run4(); }
        };

        if (slow) { phase('L'); timers.push(setTimeout(run3, HOLD)); } else { run3(); }
      };

      if (slow) { phase('F'); timers.push(setTimeout(run2, HOLD)); } else { run2(); }
    }

    // ---- the mutations ---------------------------------------------------
    // Shuffle every card, hidden ones included. A hidden card takes up no
    // grid cell but its DOM position still decides where its visible
    // neighbours land — so keeping them in the deck is what makes
    // unfiltering spread the survivors back out instead of doing nothing.
    function shuffleDom() {
      const order = cards.slice();
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach((c) => grid.appendChild(c));
    }

    function toggleFilter() {
      filtered = !filtered;
      cards.forEach((c) => { c.hidden = filtered && Number(c.dataset.n) % 2 !== 0; });
      el('[data-filter]').textContent = filtered ? 'Show them all' : 'Filter to evens';
    }

    function hintFor() {
      const body = state.tech === 'none'
        ? 'Shuffle a few times and try to follow one card. You cannot.'
        : (state.flush === 'skipped'
          ? 'One line is commented out below. Everything else is identical.'
          : 'Shuffle again before it finishes — the cards pick up from where they visually are, '
            + 'not from where the grid put them.');
      hint.innerHTML = body + ' <span style="opacity:.75">Click any card to follow its numbers.</span>';
    }

    // ---- the code readout ------------------------------------------------
    function paintCode() {
      const flushLine = state.flush === 'forced'
        ? `  <u>void el.offsetWidth;</u>                    <i>// force a style flush</i>`
        : `  <s>// void el.offsetWidth;</s>                <i>// ← the skipped line</i>`;

      if (state.tech === 'none') {
        codeEl.innerHTML =
`<i>reorder</i>(grid);   <i>// that is the whole thing</i>

<i>// The browser lays the new order out on the next frame.
// Nothing is wrong with this code. It is just unreadable.</i>`;
        return;
      }
      codeEl.innerHTML =
`<i>const</i> first = <i>new</i> Map();
els.forEach(el =&gt; first.set(el, el.getBoundingClientRect()));   <i>// FIRST</i>

reorder(grid);                                                 <i>// the DOM change</i>

els.forEach(el =&gt; {
  <i>const</i> a = first.get(el), b = el.getBoundingClientRect();     <i>// LAST</i>
  el.style.transition = <i>'none'</i>;
  el.style.transform = \`translate(\${a.left - b.left}px, \${a.top - b.top}px)\`;   <i>// INVERT</i>
});

${flushLine}

els.forEach(el =&gt; {
  el.style.transition = \`transform ${state.dur}ms ${easeCss()}\`;
  el.style.transform = <i>''</i>;                                      <i>// PLAY</i>
});`;
    }

    // ---- wiring ----------------------------------------------------------
    function paint() {
      root.querySelectorAll('[data-seg]').forEach((seg) => {
        const k = seg.dataset.seg;
        seg.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', String(state[k] === b.dataset.val));
          // The flush only exists inside FLIP. Greying it out says so
          // without a sentence of explanation.
          if (k === 'flush') b.disabled = state.tech !== 'flip';
        });
      });
      el('[data-out-dur]').textContent = state.dur + 'ms';
      el('[data-walk]').disabled = state.tech !== 'flip';
      paintCode();
      hintFor();
    }

    el('[data-shuffle]').addEventListener('click', () => mutate(shuffleDom, false));
    el('[data-filter]').addEventListener('click', () => mutate(toggleFilter, false));
    el('[data-walk]').addEventListener('click', () => {
      clearNums();
      verdict.textContent = '';
      mutate(shuffleDom, true);
    });

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.fl-card');
      if (!card || card === tracked) return;
      tracked.classList.remove('tracked');
      tracked = card;
      tracked.classList.add('tracked');
      el('[data-track]').textContent = card.dataset.n;
      clearNums();
    });

    root.querySelectorAll('[data-seg]').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        state[seg.dataset.seg] = b.dataset.val;
        clearTimers();
        clearNums();
        verdict.textContent = '';
        paint();
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

    paint();
    verdict.innerHTML = `Hit <b>Shuffle</b>. Then set the reorder to
      <b>just change the DOM</b> and hit it again.`;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-flip-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
