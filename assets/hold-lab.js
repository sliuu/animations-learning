/* ============================================================
   hold-lab.js — hold-to-confirm, the boss level of button
   states.

   Why this exists: every state in state-lab.js is momentary —
   the button decides what to say and says it. Hold-to-confirm
   is the first control in this course where the user is *inside*
   the state, steering it, and can change their mind halfway.
   That makes it the smallest complete piece of direct
   manipulation there is: progress is scrubbed 1:1 by the finger,
   and all the design work is in what happens on release.

   The knobs are design decisions, not tuning: how long you make
   someone commit for, whether you show them the commitment, and
   whether letting go undoes it. Setting the indicator to "none"
   is the break-it switch — the interaction still works
   perfectly and becomes unusable, which is a better argument for
   progress feedback than a paragraph is.

   No straw man in the punitive setting either: 2.5 s is a real
   number that ships, and it is meant to be felt rather than
   sneered at.

   Layout jump: label text changes on confirm, so the button has
   a min-width sized for the longest string, and the verdict line
   is always present and always one line tall.

   Reduced motion: the fill is not an animation — it is the
   user's own finger, rendered — so it stays. What goes is the
   eased snap-back (it becomes an instant return) and the confirm
   flash. Removing the fill would remove the affordance, and 0009
   is about cutting movement, not cutting information.

   Usage:
     <div data-hold-lab data-title="Hold to confirm"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const TIMES = [
    { v: 450,  label: '450 ms',  word: 'brisk' },
    { v: 1100, label: '1100 ms', word: 'considered' },
    { v: 2500, label: '2500 ms', word: 'punitive' },
  ];

  function injectStyles() {
    if (document.getElementById('hold-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'hold-lab-styles';
    s.textContent = `
    .hl { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .hl { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .hl-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .hl-stage { display: grid; justify-items: center; gap: 0.9rem;
                padding: 1.8rem 1.1rem 1.5rem; background: var(--paper); }

    .hl-btn { position: relative; isolation: isolate; overflow: hidden;
              min-width: 12.5rem; border: 1px solid var(--bad); border-radius: 8px;
              background: var(--paper); color: var(--bad);
              font: 600 0.86rem/1.2 var(--sans); padding: 0.62rem 1.1rem;
              cursor: pointer; touch-action: none; -webkit-user-select: none;
              user-select: none; display: inline-flex; align-items: center;
              justify-content: center; gap: 0.5rem; }
    .hl-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* The fill is the finger, drawn. Width is set from script every frame. */
    .hl-fill { position: absolute; inset: 0 auto 0 0; width: 0;
               background: var(--bad); opacity: 0.16; z-index: -1; }
    .hl[data-ind="none"] .hl-fill { display: none; }

    .hl-ring { width: 0.95rem; height: 0.95rem; border-radius: 50%;
               background: conic-gradient(var(--bad) 0turn, transparent 0turn);
               box-shadow: inset 0 0 0 1px var(--rule); flex: none; }
    .hl[data-ind="fill"] .hl-ring, .hl[data-ind="none"] .hl-ring { display: none; }

    .hl-btn.is-done { background: var(--bad); border-color: var(--bad); color: var(--paper); }
    .hl-btn.is-done .hl-fill { display: none; }

    .hl-verdict { min-height: 1.4rem; font: 400 0.83rem/1.4 var(--sans);
                  color: var(--ink-soft); text-align: center; }
    .hl-verdict b { color: var(--ink); font-weight: 600; }
    .hl-verdict .no { color: var(--bad); font-weight: 600; }
    .hl-verdict .yes { color: var(--good); font-weight: 600; }

    .hl-code { max-width: 34rem; width: 100%; }
    .hl-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .hl-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); font: 400 0.72rem/1.6 var(--mono);
                   color: var(--ink-soft); overflow-x: auto; white-space: pre; }

    .hl-foot { display: grid; gap: 0.7rem; padding: 0.95rem 1.1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .hl-ctl { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
    .hl-cap { min-width: 7.4rem; font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .hl-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .hl-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .hl-seg button:hover { border-color: var(--ink-faint); }
    .hl-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .hl-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media print { .hl-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'hl' + (++uid);
    const title = root.dataset.title || 'Hold to confirm';
    const state = { time: 1100, ind: 'fill', release: 'snap' };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let p = 0;              /* 0..1, the scrub value */
    let held = false, raf = 0, last = 0, done = false, auto = null;

    root.classList.add('hl');
    root.innerHTML = `
      <div class="hl-head"><span>${title}</span><span>press and hold — mouse, touch or space</span></div>
      <div class="hl-stage">
        <button class="hl-btn" type="button" data-btn>
          <span class="hl-fill" data-fill></span>
          <span class="hl-ring" data-ring aria-hidden="true"></span>
          <span data-label>Hold to delete project</span>
        </button>
        <p class="hl-verdict" data-verdict aria-live="polite">Nothing has happened yet.</p>
        <details class="hl-code">
          <summary>The CSS behind it</summary>
          <pre>/* There is barely any. The fill is one absolutely
   positioned box whose width is written every frame
   from the elapsed hold — no transition, no keyframes,
   because it is the finger, not an animation. */

.fill { position: absolute; inset: 0 auto 0 0;
        width: 0; background: var(--bad);
        opacity: 0.16; }

/* Only the snap-back is animated, and it runs shorter
   than the hold that earned it: a return is a
   dismissal, not a rewind. */</pre>
        </details>
      </div>
      <div class="hl-foot">
        <div class="hl-ctl">
          <span class="hl-cap">Commitment</span>
          <div class="hl-seg" data-seg="time" role="group" aria-label="Hold duration">
            ${TIMES.map((t) => `<button type="button" data-v="${t.v}">${t.label} &middot; ${t.word}</button>`).join('')}
          </div>
        </div>
        <div class="hl-ctl">
          <span class="hl-cap">Progress shown as</span>
          <div class="hl-seg" data-seg="ind" role="group" aria-label="Progress indicator">
            <button type="button" data-v="fill">a fill</button>
            <button type="button" data-v="ring">a ring</button>
            <button type="button" data-v="none">nothing</button>
          </div>
        </div>
        <div class="hl-ctl">
          <span class="hl-cap">Let go early and</span>
          <div class="hl-seg" data-seg="release" role="group" aria-label="Behaviour on early release">
            <button type="button" data-v="snap">it snaps back</button>
            <button type="button" data-v="keep">it keeps the progress</button>
          </div>
          <button class="btn" type="button" data-demo="half">Let go halfway for me</button>
          <button class="btn primary" type="button" data-demo="full">Hold it for me</button>
        </div>
      </div>
    `;

    const btn = root.querySelector('[data-btn]');
    const fill = root.querySelector('[data-fill]');
    const ring = root.querySelector('[data-ring]');
    const label = root.querySelector('[data-label]');
    const verdict = root.querySelector('[data-verdict]');

    function draw() {
      fill.style.width = (p * 100).toFixed(2) + '%';
      ring.style.background =
        `conic-gradient(var(--bad) ${p.toFixed(3)}turn, transparent ${p.toFixed(3)}turn)`;
    }

    function say(html) { verdict.innerHTML = html; }

    function paint() {
      root.dataset.ind = state.ind;
      root.querySelectorAll('.hl-seg').forEach((seg) => {
        const key = seg.dataset.seg;
        seg.querySelectorAll('button').forEach((b) =>
          b.setAttribute('aria-pressed', String(String(state[key]) === b.dataset.v)));
      });
    }

    function finish() {
      done = true; held = false; p = 1; draw();
      btn.classList.add('is-done');
      label.textContent = 'Project deleted';
      say(`Held the full <b>${state.time}&nbsp;ms</b>. <span class="yes">Deleted.</span>`);
      setTimeout(() => {
        done = false; p = 0; draw();
        btn.classList.remove('is-done');
        label.textContent = 'Hold to delete project';
      }, 1500);
    }

    /* Early release. "snap" retreats faster than the hold filled — a return is
       not a reversal, it is a dismissal, and it should not cost the user the
       time they already spent. "keep" is the plausible-looking wrong answer. */
    function release() {
      if (!held) return;
      held = false;
      cancelAnimationFrame(raf);
      const pct = Math.round(p * 100);
      if (state.release === 'keep') {
        say(`Let go at <b>${pct}%</b>. The progress stayed. <span class="no">Nothing happened</span> — and nothing says so.`);
        return;
      }
      say(`Let go at <b>${pct}%</b>. Snapped back. <span class="no">Nothing happened.</span>`);
      if (reduced.matches) { p = 0; draw(); return; }
      const from = p, t0 = performance.now(), dur = 190;
      const back = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        p = from * (1 - k * k);
        draw();
        if (k < 1) raf = requestAnimationFrame(back);
      };
      raf = requestAnimationFrame(back);
    }

    function tick(t) {
      const dt = t - last; last = t;
      p = Math.min(1, p + dt / state.time);
      draw();
      if (p >= 1) { finish(); return; }
      if (held) raf = requestAnimationFrame(tick);
    }

    function press() {
      if (done || held) return;
      held = true;
      if (state.release === 'snap' || p >= 1) p = 0;
      cancelAnimationFrame(raf);
      last = performance.now();
      say('Holding&hellip;');
      raf = requestAnimationFrame(tick);
    }

    btn.addEventListener('pointerdown', (e) => { btn.setPointerCapture(e.pointerId); press(); });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) press(); }
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') release();
    });

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.hl-seg button');
      if (seg) {
        state[seg.closest('.hl-seg').dataset.seg] =
          seg.closest('.hl-seg').dataset.seg === 'time' ? Number(seg.dataset.v) : seg.dataset.v;
        paint();
        return;
      }
      const demo = e.target.closest('[data-demo]');
      if (demo) {
        clearTimeout(auto);
        press();
        if (demo.dataset.demo === 'half') auto = setTimeout(release, state.time * 0.5);
      }
    });

    paint();
    draw();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-hold-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
