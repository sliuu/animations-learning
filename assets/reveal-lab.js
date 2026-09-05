/* ============================================================
   reveal-lab.js — the window moves, or the content moves.

   The claim is that these are two different effects that get
   called by the same name, and the difference is legible in a
   single frame: a masked reveal never renders type at partial
   opacity, and a fade-up renders almost nothing else. That is a
   claim about how a thing *looks while it is happening*, which
   sequential A/B cannot teach — so both panes are on screen and
   one press drives both.

   Neither side is a straw man. The right pane is the ordinary
   fade-and-rise entrance this course has recommended since 0001,
   built correctly, with the same duration and the same easing.
   It is not doing anything wrong. It is doing something else.

   The verdicts are measured, not written: while both panes run,
   a rAF loop samples the computed opacity of the *headline* in
   each pane and the pixels it has been displaced. So the badges
   stay honest at every duration and on every window shape,
   including the two shapes the right pane cannot express at all.

   Reduced motion: this lab's content is the motion, so removing
   it leaves an empty page rather than a calmer one. The
   accommodation is that nothing autoplays, nothing loops, and
   every frame on screen is the result of a press.

   Usage:
     <div data-reveal-lab data-title="Reveal it, two ways"></div>
   ============================================================ */

(() => {
  let uid = 0;

  /* Each window is a pair of same-type basic shapes, because a shape only
     interpolates against its own kind — inset to inset, circle to circle,
     polygon to polygon with a matching vertex count. Cross a type boundary and
     the browser swaps at 50% with no animation at all.

     `content` is the honest content-moving equivalent of the same window, and
     it is deliberately null for the two shapes that have none: there is no way
     to move a block of type so that it arrives from its own centre line, or
     from a hole in the middle of itself. */
  const WINDOWS = {
    left: {
      label: 'wipe from the left',
      from: 'inset(0 100% 0 0)', to: 'inset(0 0 0 0)',
      content: 'translateX(-16px)',
      shift: 'translateX(-14px)',
    },
    bottom: {
      label: 'wipe up from the bottom',
      from: 'inset(100% 0 0 0)', to: 'inset(0 0 0 0)',
      content: 'translateY(16px)',
      shift: 'translateY(14px)',
    },
    centre: {
      label: 'open from the centre line',
      from: 'inset(0 50% 0 50%)', to: 'inset(0 0 0 0)',
      content: null,
      shift: 'scaleX(0.96)',
    },
    diagonal: {
      label: 'diagonal edge, left to right',
      from: 'polygon(0% 0%, 0% 0%, -32% 100%, -32% 100%)',
      to: 'polygon(0% 0%, 132% 0%, 100% 100%, -32% 100%)',
      content: null,
      shift: 'translateX(-14px)',
    },
    iris: {
      label: 'iris out from the middle',
      from: 'circle(0% at 50% 52%)', to: 'circle(76% at 50% 52%)',
      content: null,
      shift: 'scale(0.97)',
    },
  };

  const ORDER = ['left', 'bottom', 'centre', 'diagonal', 'iris'];

  function injectStyles() {
    if (document.getElementById('reveal-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'reveal-lab-styles';
    s.textContent = `
    .rv { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .rv { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .rv-head { padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .rv-body { display: grid; gap: 1.2rem; padding: 1.3rem 1.1rem; align-items: start;
               grid-template-columns: minmax(0, 1fr); background: var(--paper); }
    @media (min-width: 820px) { .rv-body { grid-template-columns: minmax(0, 1fr) 12.5rem; } }

    .rv-panes { display: grid; gap: 0.5rem 1rem; grid-template-columns: minmax(0, 1fr); }
    .rv-pane { display: grid; gap: 0.5rem; grid-template-rows: auto auto 1fr;
               min-width: 0; }

    /* Side by side, the two panes dissolve into one six-cell grid and each part
       is pinned to its own row, so the two stages start on the same line
       whatever the labels above them do. The right label grows to "opacity
       only — no equivalent" on the three shapes it cannot express, and with two
       separate grids that change alone would drop its stage below the left
       one — mid-comparison, on exactly the shapes the comparison is about. */
    @media (min-width: 560px) {
      .rv-panes { grid-template-columns: 1fr 1fr; }
      .rv-pane { display: contents; }
      .rv-name { grid-row: 1; align-self: end; }
      .rv-stage { grid-row: 2; }
      .rv-read { grid-row: 3; }
    }
    .rv-name { font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft);
               text-transform: uppercase; letter-spacing: 0.08em; }
    .rv-name span { display: block; text-transform: none; letter-spacing: 0;
                    font: 400 0.72rem/1.5 var(--mono); color: var(--ink-faint); }

    /* Fixed height, and the hero never leaves flow: the thing being taught is
       an edge crossing type, so a stage that resizes under it would be showing
       a layout jump instead. */
    .rv-stage { position: relative; height: 11.5rem; overflow: hidden;
                border: 1px solid var(--rule); border-radius: 9px;
                background: var(--paper-sunk); }

    .rv-clip, .rv-fade { position: absolute; inset: 0; }
    .rv-shift, .rv-fade { display: grid; align-content: center; gap: 0.3rem;
                          height: 100%; padding: 0 1rem; }

    .rv-eyebrow { font: 600 0.58rem/1.6 var(--sans); text-transform: uppercase;
                  letter-spacing: 0.12em; color: var(--accent); }
    .rv-h { font: 620 1.42rem/1.12 var(--sans); color: var(--ink); letter-spacing: -0.015em; }
    .rv-sub { font: 400 0.78rem/1.45 var(--sans); color: var(--ink-soft); }
    .rv-cta { justify-self: start; margin-top: 0.45rem; border-radius: 7px;
              background: var(--accent); color: var(--paper);
              font: 600 0.72rem/1 var(--sans); padding: 0.5rem 0.75rem; }

    /* One keyframe pair each, fed by custom properties, so the shape and the
       duration are data rather than eight hand-written animations. */
    @keyframes rv-window { from { clip-path: var(--from); } to { clip-path: var(--to); } }
    @keyframes rv-shift  { from { transform: var(--shift); } to { transform: none; } }
    @keyframes rv-fade   { from { opacity: 0; transform: var(--content); }
                           to   { opacity: 1; transform: none; } }

    .rv-clip.run { animation: rv-window var(--ms) var(--ease-out-strong) both; }
    .rv-shift.run { animation: rv-shift var(--ms) var(--ease-out-strong) both; }
    .rv-fade.run { animation: rv-fade var(--ms) var(--ease-out-strong) both; }

    .rv-read { display: grid; gap: 0.15rem; padding: 0.55rem 0.65rem;
               border: 1px solid var(--rule); border-radius: 7px;
               background: var(--paper-sunk); font-family: var(--sans);
               /* Reserved: the readout fills in after a press and must not
                  push the stage above it. */
               min-height: 5.4rem; align-content: start; }
    .rv-badge { font: 600 0.62rem/1.5 var(--sans); text-transform: uppercase;
                letter-spacing: 0.07em; color: var(--ink-faint); }
    .rv-badge.held { color: var(--good); }
    .rv-badge.dim  { color: var(--bad); }
    .rv-fact { font: 400 0.74rem/1.5 var(--sans); color: var(--ink-soft); }
    .rv-fact b { font: 600 0.74rem/1.5 var(--mono); color: var(--ink); }

    .rv-side { display: grid; gap: 0.7rem; align-content: start; min-width: 0;
               font-family: var(--sans); }
    .rv-cap { font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft);
              text-transform: uppercase; letter-spacing: 0.07em; }
    .rv-seg { display: grid; gap: 0.28rem; }
    .rv-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft); text-align: left;
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.4rem 0.6rem; }
    .rv-seg button:hover { border-color: var(--ink-faint); }
    .rv-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .rv-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .rv-row { display: grid; gap: 0.3rem; }
    .rv-row label { font: 500 0.72rem/1.3 var(--sans); color: var(--ink-soft);
                    display: flex; justify-content: space-between; gap: 0.5rem; }
    .rv-row label b { font: 600 0.72rem/1.3 var(--mono); color: var(--ink); }
    .rv-row input[type="range"] { width: 100%; }
    .rv-check { display: flex; gap: 0.45rem; align-items: flex-start;
                font: 500 0.74rem/1.35 var(--sans); color: var(--ink-soft); cursor: pointer; }
    .rv-check input { margin-top: 0.15rem; }

    .rv-out { border-top: 1px solid var(--rule); padding: 0.85rem 1.1rem 1rem;
              background: var(--paper-sunk); }
    .rv-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .rv-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); overflow-x: auto; max-width: 46rem;
                   font: 400 0.72rem/1.6 var(--mono); color: var(--ink); }
    .rv-code b { font-weight: 400; background: var(--accent-soft); border-radius: 3px;
                 padding: 0 0.15em; }
    .rv-code i { font-style: normal; opacity: 0.6; }

    @media print { .rv-side, .rv-actions { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const HERO = `
    <span class="rv-eyebrow">Now in beta</span>
    <span class="rv-h" data-measure>Every element<br>arrives with intent</span>
    <span class="rv-sub">Ship motion you can defend in a review.</span>
    <span class="rv-cta">Get started</span>`;

  function build(root) {
    const id = 'rv' + (++uid);
    const title = root.dataset.title || 'Reveal it, two ways';
    const state = { win: 'left', ms: 520, shift: false, busy: false, guard: 0 };

    root.classList.add('rv');
    root.innerHTML = `
      <div class="rv-head">${title}</div>
      <div class="rv-body">
        <div class="rv-panes">
          <div class="rv-pane">
            <span class="rv-name">The window moves<span data-prop-a>clip-path</span></span>
            <div class="rv-stage">
              <div class="rv-clip" data-clip><div class="rv-shift" data-shift>${HERO}</div></div>
            </div>
            <div class="rv-read" aria-live="polite">
              <span class="rv-badge" data-badge-a>press reveal</span>
              <span class="rv-fact" data-fact-a>Nothing measured yet.</span>
            </div>
          </div>
          <div class="rv-pane">
            <span class="rv-name">The content moves<span data-prop-b>opacity + transform</span></span>
            <div class="rv-stage">
              <div class="rv-fade" data-fade>${HERO}</div>
            </div>
            <div class="rv-read" aria-live="polite">
              <span class="rv-badge" data-badge-b>press reveal</span>
              <span class="rv-fact" data-fact-b>Nothing measured yet.</span>
            </div>
          </div>
        </div>

        <div class="rv-side">
          <span class="rv-cap">The window</span>
          <div class="rv-seg" data-seg role="group" aria-label="Window shape">
            ${ORDER.map((k) => `<button type="button" data-v="${k}">${WINDOWS[k].label}</button>`).join('')}
          </div>
          <div class="rv-row">
            <label for="${id}-ms">duration <b data-ms>520ms</b></label>
            <input id="${id}-ms" type="range" min="160" max="1200" step="20" value="520" data-range>
          </div>
          <label class="rv-check">
            <input type="checkbox" data-shift-toggle>
            <span>Move the content inside the window too</span>
          </label>
          <div class="rv-actions"><button class="btn primary" type="button" data-play>Reveal both</button></div>
        </div>
      </div>
      <div class="rv-out">
        <details class="rv-code">
          <summary>The CSS behind both panes</summary>
          <pre data-code></pre>
        </details>
      </div>
    `;

    const clip = root.querySelector('[data-clip]');
    const shift = root.querySelector('[data-shift]');
    const fade = root.querySelector('[data-fade]');
    const headA = clip.querySelector('[data-measure]');
    const headB = fade.querySelector('[data-measure]');
    const stageA = clip.parentElement;
    const stageB = fade.parentElement;
    const codeEl = root.querySelector('[data-code]');
    const msEl = root.querySelector('[data-ms]');
    const propA = root.querySelector('[data-prop-a]');
    const propB = root.querySelector('[data-prop-b]');

    /* What the headline is *rendering* at, which is not what it computes to.
       Opacity is not inherited: put opacity on a wrapper and the type inside
       still computes to 1 while being painted at 0.4. So walk the chain up to
       the stage and multiply. Measuring the headline alone was the first
       version of this lab, and it reported that a fade-up never dimmed
       anything — the readout has to model what the eye is doing. */
    function effectiveOpacity(el, stop) {
      let o = 1;
      for (let n = el; n && n !== stop; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity) || 0;
      }
      return o;
    }

    /* How far a transform has pushed the headline, in whole pixels — summed up
       the same chain, because the transform is on a wrapper too. Reading the
       matrix rather than the declaration is the point: it is what the pane is
       actually doing at this instant, not what the stylesheet asked for. */
    function displacement(el, stop) {
      let x = 0, y = 0;
      for (let n = el; n && n !== stop; n = n.parentElement) {
        const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
        x += m.m41; y += m.m42;
      }
      return Math.round(Math.hypot(x, y));
    }

    function paint() {
      root.querySelectorAll('.rv-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.win)));
      const w = WINDOWS[state.win];
      msEl.textContent = state.ms + 'ms';
      propA.textContent = state.shift ? 'clip-path + transform' : 'clip-path';
      propB.textContent = w.content ? 'opacity + transform' : 'opacity only — no equivalent';

      codeEl.innerHTML =
        '<i>/* left pane — the window is the only thing that changes */</i>\n' +
        '@keyframes reveal {\n' +
        `  from { <b>clip-path: ${w.from}</b>; }\n` +
        `  to   { <b>clip-path: ${w.to}</b>; }\n` +
        '}\n' +
        `.hero { animation: reveal ${state.ms}ms var(--ease-out-strong) both; }\n` +
        (state.shift
          ? `.hero > * { animation: rise ${state.ms}ms var(--ease-out-strong) both; }\n` +
            `<i>/* rise: from { transform: ${w.shift} } to { transform: none }  */</i>\n`
          : '') +
        '\n<i>/* right pane — the element is the only thing that changes */</i>\n' +
        '@keyframes fade-in {\n' +
        `  from { opacity: 0; transform: ${w.content || 'translateY(16px)'}; }\n` +
        '  to   { opacity: 1; transform: none; }\n' +
        '}\n' +
        `.hero { animation: fade-in ${state.ms}ms var(--ease-out-strong) both; }` +
        (w.content ? '' :
          '\n\n<i>/* There is no content-moving version of this window. A block of\n' +
          '   type cannot arrive from its own centre line, so the right pane\n' +
          '   falls back to the nearest thing anyone would ship: a fade. */</i>');
    }

    function reset() {
      [clip, shift, fade].forEach((el) => el.classList.remove('run'));
    }

    function play() {
      if (state.busy) return;
      const w = WINDOWS[state.win];
      reset();

      clip.style.setProperty('--from', w.from);
      clip.style.setProperty('--to', w.to);
      clip.style.setProperty('--ms', state.ms + 'ms');
      shift.style.setProperty('--shift', w.shift);
      shift.style.setProperty('--ms', state.ms + 'ms');
      fade.style.setProperty('--content', w.content || 'translateY(16px)');
      fade.style.setProperty('--ms', state.ms + 'ms');

      /* Remove, reflow, add. Safe here because nothing in the base rules
         declares a transition on clip-path, opacity or transform — the reset
         teleports rather than starting a reverse transition. */
      void clip.offsetWidth;
      clip.classList.add('run');
      if (state.shift) shift.classList.add('run');
      fade.classList.add('run');

      state.busy = true;
      /* rAF does not fire in a background tab, so the sampler below can stall
         indefinitely if she switches away mid-reveal. This is the backstop that
         keeps the controls from latching. */
      clearTimeout(state.guard);
      state.guard = setTimeout(() => { state.busy = false; }, state.ms + 1200);
      measure();
    }

    /* The verdicts are sampled, never written. Every frame of the flight, read
       what each headline is actually rendering: its opacity, and how far it has
       been moved. Then report the worst of it. */
    function measure() {
      const t0 = performance.now();
      let minA = 1, minB = 1, moveA = 0, moveB = 0, dimA = 0, dimB = 0, last = t0;

      const tick = (now) => {
        const dt = now - last; last = now;
        const oa = effectiveOpacity(headA, stageA);
        const ob = effectiveOpacity(headB, stageB);
        minA = Math.min(minA, oa); minB = Math.min(minB, ob);
        if (oa < 0.9) dimA += dt;
        if (ob < 0.9) dimB += dt;
        moveA = Math.max(moveA, displacement(headA, stageA));
        moveB = Math.max(moveB, displacement(headB, stageB));

        if (now - t0 < state.ms + 90) { requestAnimationFrame(tick); return; }
        report(minA, dimA, moveA, minB, dimB, moveB);
        clearTimeout(state.guard);
        state.busy = false;
      };
      requestAnimationFrame(tick);
    }

    function report(minA, dimA, moveA, minB, dimB, moveB) {
      const badgeA = root.querySelector('[data-badge-a]');
      const badgeB = root.querySelector('[data-badge-b]');
      const factA = root.querySelector('[data-fact-a]');
      const factB = root.querySelector('[data-fact-b]');

      const heldA = minA > 0.98;
      badgeA.className = 'rv-badge ' + (heldA ? 'held' : 'dim');
      badgeA.textContent = heldA ? 'type never dimmed' : 'type dimmed';
      factA.innerHTML = heldA
        ? `Faintest the headline ever got: <b>${minA.toFixed(2)}</b>. Fully painted the whole ` +
          `way — you were seeing less of it, never less <em>of</em> it. Moved <b>${moveA}px</b>.`
        : `Faintest: <b>${minA.toFixed(2)}</b>, for <b>${Math.round(dimA)}ms</b>. ` +
          `Moved <b>${moveA}px</b>.`;

      const heldB = minB > 0.98;
      badgeB.className = 'rv-badge ' + (heldB ? 'held' : 'dim');
      badgeB.textContent = heldB ? 'type never dimmed' : 'type dimmed';
      factB.innerHTML = heldB
        ? `Faintest the headline ever got: <b>${minB.toFixed(2)}</b>. Moved <b>${moveB}px</b>.`
        : `Faintest the headline ever got: <b>${minB.toFixed(2)}</b>, and it was under 90% for ` +
          `<b>${Math.round(dimB)}ms</b> of the ${state.ms}ms. Moved <b>${moveB}px</b>.`;
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.rv-seg button');
      if (seg) {
        if (state.busy) return;
        state.win = seg.dataset.v;
        reset();
        paint();
        return;
      }
      if (e.target.closest('[data-play]')) play();
    });

    root.querySelector('[data-range]').addEventListener('input', (e) => {
      state.ms = +e.target.value;
      paint();
    });
    root.querySelector('[data-shift-toggle]').addEventListener('change', (e) => {
      state.shift = e.target.checked;
      reset();
      paint();
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-reveal-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
