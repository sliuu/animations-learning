/* ============================================================
   wait-lab.js — one request, four waiting treatments, running
   at the same time, under a latency knob.

   Why this exists: "use a skeleton, not a spinner" is the kind
   of rule that gets repeated until it stops being true. It is
   true at 800ms and false at 150ms, and the only way to know
   that is to watch the same wait at both lengths. The knob is
   the duration, and the duration is what reorders the answers.

   All four panes run off one button and one clock, because a
   sequential A/B cannot teach a feeling: the flicker at 150ms
   is only legible next to a pane that did not flicker.

   The failure at 150ms is silent — a spinner that appears and
   vanishes inside a sixth of a second does not announce itself
   as a design mistake, it just reads as the page glitching. So
   the verdict line names what happened, per lesson 0009's rule
   about making a silent failure audible.

   The progress bar here is honest because the lab knows the
   answer in advance. Almost nothing in a real product does.
   That is said in the verdict rather than hidden, because a
   demo that quietly cheats teaches the wrong lesson.

   Reduced motion: the spinner's rotation and the skeleton's
   shimmer are unrequested loops, which is exactly what that
   setting is asking to be rid of — so both stop, and the
   spinner falls back to its caption, which is what was
   carrying the information anyway. The progress bar keeps
   moving. It is not an embellishment on the state, it *is*
   the state, drawn: freezing it would remove information
   rather than decoration.

   Usage:
     <div data-wait-lab data-title="One request, four waits"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const SPEEDS = [
    { ms: 150, label: '0.15s' },
    { ms: 800, label: '0.8s' },
    { ms: 3000, label: '3s' },
    { ms: 8000, label: '8s' },
  ];

  const VERDICTS = {
    150: 'Both the spinner and the skeleton were on screen for about a sixth of a second. That is '
       + 'a flicker, and a flicker reads as the page glitching rather than as feedback. The pane '
       + 'that did nothing is the only one that felt instant.',
    800: 'Long enough that doing nothing now reads as a dead click — you pressed it and the page '
       + 'ignored you. The skeleton is ahead of the spinner here: it says <b>working</b> and also '
       + 'says <b>what is coming</b>, so the arrival fills a shape you were already looking at.',
    3000: 'The spinner has stopped saying <b>working</b> and started saying <b>possibly stuck</b>: '
        + 'it looked identical at half a second and at three, so it offers no evidence it is still '
        + 'alive. The bar is the only pane making a claim you can check.',
    8000: 'Nothing about the spinner changed between second two and second eight. At this length '
        + 'an indeterminate indicator is not feedback, it is wallpaper — and the skeleton has the '
        + 'same problem, because it also never moves toward anything. Only the bar survives.',
  };

  function injectStyles() {
    if (document.getElementById('wait-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'wait-lab-styles';
    s.textContent = `
    .wt { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .wt { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .wt-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }
    .wt-clock { font: 500 0.78rem/1.3 var(--mono); color: var(--ink-faint);
                font-variant-numeric: tabular-nums; }

    /* minmax(0, 1fr), not 1fr: the arrived card's second line is nowrap-with-
       ellipsis, and a plain 1fr track is floored at its content's min-content
       width, so the full untruncated sentence pushed the board 37px past the
       lab between 641px and 999px — the one band where the board is still two
       columns and the lab is not full-bleed. Letting the track go to zero is
       what hands the ellipsis its job back. */
    .wt-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .wt-pane { background: var(--paper); padding: 0.85rem 1rem 1rem; }
    .wt-name { margin: 0 0 0.6rem; font: 600 0.64rem/1.3 var(--sans);
               letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }

    /* Fixed slot height in all three states, so the only thing that changes
       between empty, waiting and arrived is what is inside it. A pane that
       grew when the content landed would be teaching layout jump by accident. */
    .wt-slot { height: 5rem; display: flex; align-items: center; }

    .wt-empty { font: 400 0.8rem/1.4 var(--sans); color: var(--ink-faint); }

    .wt-card { display: flex; align-items: center; gap: 0.7rem; width: 100%; }
    .wt-av { flex: none; width: 2.4rem; height: 2.4rem; border-radius: 50%;
             background: var(--accent-soft, var(--rule)); }
    .wt-rows { min-width: 0; }
    .wt-rows b { display: block; font: 600 0.86rem/1.35 var(--sans); color: var(--ink); }
    .wt-rows span { display: block; font: 400 0.8rem/1.4 var(--sans); color: var(--ink-soft);
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wt-rows small { display: block; font: 400 0.7rem/1.5 var(--sans); color: var(--ink-faint); }

    /* The skeleton is the card's own geometry with the content taken out —
       same circle, same three rows, same gaps. That is the whole claim it
       makes, so it has to be built from the card rather than beside it. */
    .wt-bone { background: var(--rule); border-radius: 4px; }
    .wt-bone.circ { border-radius: 50%; }
    .wt-sk .wt-av { background: var(--rule); }
    .wt-sk .wt-bone.r1 { width: 7rem; height: 0.72rem; margin-bottom: 0.4rem; }
    .wt-sk .wt-bone.r2 { width: 11.5rem; height: 0.62rem; margin-bottom: 0.4rem; }
    .wt-sk .wt-bone.r3 { width: 4rem; height: 0.55rem; }
    .wt-shim .wt-bone, .wt-shim .wt-av {
      background-image: linear-gradient(90deg, var(--rule) 0%, var(--paper-sunk) 50%, var(--rule) 100%);
      background-size: 220% 100%;
      animation: wt-shim 1.5s linear infinite;
    }
    @keyframes wt-shim { from { background-position: 120% 0; } to { background-position: -120% 0; } }

    .wt-spinwrap { display: flex; align-items: center; gap: 0.7rem; }
    .wt-spin { flex: none; width: 1.5rem; height: 1.5rem; border-radius: 50%;
               border: 2px solid var(--rule); border-top-color: var(--ink-faint);
               animation: wt-turn 900ms linear infinite; }
    @keyframes wt-turn { to { transform: rotate(360deg); } }
    .wt-cap { font: 400 0.8rem/1.4 var(--sans); color: var(--ink-soft); }

    /* display:block on all three — these are spans, and an inline box drops
       height, so the track paints as nothing at all and the pane silently
       loses the only indicator it has. */
    .wt-barwrap { display: block; width: 100%; }
    .wt-track { display: block; height: 0.45rem; border-radius: 999px;
                background: var(--rule); overflow: hidden; }
    .wt-fill { display: block; height: 100%; width: 0; border-radius: 999px;
               background: var(--ink-faint); }
    .wt-fill.is-running { width: 100%; transition: width var(--wt-dur, 800ms) linear; }
    .wt-pct { display: block; margin-top: 0.45rem; font: 400 0.72rem/1.4 var(--mono);
              color: var(--ink-faint); font-variant-numeric: tabular-nums; }

    /* min-height is the tallest verdict this box ever holds, measured at each
       width, not a round number that looked about right. The verdicts are one
       to three lines depending on latency, and the box sits directly under the
       panes: an unreserved line means the whole board hops 20px the moment she
       turns the knob, which is the one thing the lab is arguing against. */
    /* The reservation lives on the wrapper and the text is centred inside it,
       so the spare lines read as room around the verdict rather than as a hole
       under it on the widths where the verdict runs short. */
    .wt-readwrap { display: flex; align-items: center; min-height: 5.6rem;
                  padding: 0.85rem 1.1rem; border-top: 1px solid var(--rule);
                  background: var(--paper); }
    .wt-read { margin: 0; font: 400 0.83rem/1.5 var(--sans); color: var(--ink-soft); }
    .wt-read b { color: var(--ink); font-weight: 600; }

    .wt-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 0.9rem 1.1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); font-family: var(--sans); }
    .wt-cap-l { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .wt-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .wt-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .wt-seg button:hover { border-color: var(--ink-faint); }
    .wt-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .wt-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media (max-width: 640px) {
      .wt-board { grid-template-columns: 1fr; }
      .wt-slot { height: 4.6rem; }
      .wt-readwrap { min-height: 8.1rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      /* Two unrequested loops go: the spinner's rotation and the skeleton's
         sweep. Both are decoration on a state that is already legible — the
         caption says "Loading", the bones say "not real yet". The progress
         bar keeps its transition, because there the movement is not a
         decoration on the information, it is the information. */
      .wt-spin { animation: none; }
      .wt-shim .wt-bone, .wt-shim .wt-av { animation: none; background-image: none; }
    }

    @media print { .wt-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const CARD = `
    <div class="wt-card">
      <span class="wt-av"></span>
      <span class="wt-rows">
        <b>Marta Ruiz</b>
        <span>Moved the pricing page to the new grid</span>
        <small>2 minutes ago</small>
      </span>
    </div>`;

  const SKELETON = `
    <div class="wt-card wt-sk wt-shim">
      <span class="wt-av"></span>
      <span class="wt-rows">
        <span class="wt-bone r1"></span>
        <span class="wt-bone r2"></span>
        <span class="wt-bone r3"></span>
      </span>
    </div>`;

  const EMPTY = '<span class="wt-empty">Nothing yet.</span>';

  function build(root) {
    const id = 'wt' + (++uid);
    const title = root.dataset.title || 'One request, four waits';
    let ms = 800;
    let run = 0;          /* generation token, so a restart cancels the old timers */
    let timer = null, ticker = null;

    root.classList.add('wt');
    root.innerHTML = `
      <div class="wt-head">
        <span>${title}</span>
        <span class="wt-clock" data-clock>0.00s</span>
      </div>
      <div class="wt-board">
        <section class="wt-pane">
          <p class="wt-name">Nothing</p>
          <div class="wt-slot" data-slot="none">${EMPTY}</div>
        </section>
        <section class="wt-pane">
          <p class="wt-name">Spinner</p>
          <div class="wt-slot" data-slot="spin">${EMPTY}</div>
        </section>
        <section class="wt-pane">
          <p class="wt-name">Skeleton</p>
          <div class="wt-slot" data-slot="skel">${EMPTY}</div>
        </section>
        <section class="wt-pane">
          <p class="wt-name">Progress</p>
          <div class="wt-slot" data-slot="bar">${EMPTY}</div>
        </section>
      </div>
      <div class="wt-readwrap">
        <p class="wt-read" data-read aria-live="polite">Four panes, one request. Press <b>Load all
        four</b> and watch them at the same time — then change the latency and watch which pane
        stops being the right answer.</p></div>
      <div class="wt-foot">
        <button class="btn primary" type="button" data-go>Load all four</button>
        <span class="wt-cap-l">The response takes</span>
        <div class="wt-seg" data-seg role="group" aria-label="Response latency">
          ${SPEEDS.map((s) => `<button type="button" data-v="${s.ms}">${s.label}</button>`).join('')}
        </div>
      </div>
    `;

    const slots = {
      none: root.querySelector('[data-slot="none"]'),
      spin: root.querySelector('[data-slot="spin"]'),
      skel: root.querySelector('[data-slot="skel"]'),
      bar: root.querySelector('[data-slot="bar"]'),
    };
    const read = root.querySelector('[data-read]');
    const clock = root.querySelector('[data-clock]');

    function paintSeg() {
      root.querySelectorAll('.wt-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(Number(b.dataset.v) === ms)));
    }

    function reset() {
      run += 1;
      if (timer) { clearTimeout(timer); timer = null; }
      if (ticker) { clearInterval(ticker); ticker = null; }
      Object.values(slots).forEach((el) => { el.innerHTML = EMPTY; });
      clock.textContent = '0.00s';
    }

    function start() {
      reset();
      const mine = run;
      const began = performance.now();
      const seconds = (SPEEDS.find((s) => s.ms === ms) || { label: ms + 'ms' }).label;

      /* The "Nothing" pane is the control and it genuinely does nothing —
         it keeps its empty state for the whole wait. That silence is the
         point, so the clock above it is what makes the silence measurable. */
      slots.spin.innerHTML =
        '<span class="wt-spinwrap"><span class="wt-spin"></span>'
        + '<span class="wt-cap">Loading…</span></span>';
      slots.skel.innerHTML = SKELETON;
      slots.bar.innerHTML =
        '<span class="wt-barwrap"><span class="wt-track"><span class="wt-fill" data-fill></span>'
        + '</span><small class="wt-pct" data-pct>0%</small></span>';

      const fill = slots.bar.querySelector('[data-fill]');
      const pct = slots.bar.querySelector('[data-pct]');
      root.style.setProperty('--wt-dur', ms + 'ms');
      /* Next frame, so the 0-width start state is painted before the
         transition to 100% is asked for. */
      requestAnimationFrame(() => { if (mine === run) fill.classList.add('is-running'); });

      read.innerHTML = `Running at <b>${seconds}</b>. Watch all four at once — and watch how long
        the pane marked <b>Nothing</b> stays empty.`;

      ticker = setInterval(() => {
        if (mine !== run) return;
        const t = performance.now() - began;
        clock.textContent = (Math.min(t, ms) / 1000).toFixed(2) + 's';
        if (pct) pct.textContent = Math.min(100, Math.round((t / ms) * 100)) + '%';
      }, 50);

      timer = setTimeout(() => {
        if (mine !== run) return;
        clearInterval(ticker); ticker = null;
        clock.textContent = (ms / 1000).toFixed(2) + 's';
        Object.values(slots).forEach((el) => { el.innerHTML = CARD; });
        read.innerHTML = `<b>${seconds}.</b> ${VERDICTS[ms]}`;
      }, ms);
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-go]')) { start(); return; }
      const seg = e.target.closest('.wt-seg button');
      /* Changing the latency runs it again on the spot. A knob that only
         altered what the *next* press would do would be a preference pane. */
      if (seg) { ms = Number(seg.dataset.v); paintSeg(); start(); }
    });

    paintSeg();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-wait-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
