/* ============================================================
   grab-lab.js — two chips in one field. One tracks the pointer
   exactly; the other has a transition left on it.

   Why this exists: "the dragged thing must track the hand 1:1"
   is the founding rule of direct manipulation and it is
   impossible to argue in prose, because the failure is about
   forty milliseconds long. It has to be under a finger.

   Both chips are live at the same time, deliberately. A slider
   that moves one chip between exact and lagged would be a
   sequential A/B, and a sequential A/B cannot teach a feeling —
   she has to be able to grab one, grab the other, and grab the
   first one again inside two seconds. That is what makes the
   difference legible instead of remembered.

   Sides are shuffled on load and unlabelled until she asks,
   because the label is the answer. The reveal button is the
   only thing that names them, so nothing in the lesson prose
   may say "the left one".

   The ring drawn at the true pointer position is the audible
   verdict: the lagged chip visibly trails its own finger, so
   the failure is not only felt but seen. Without it this is a
   demo that needs narration.

   The lag is implemented as a CSS transition on transform,
   which is not a strawman — it is the actual bug. It is what
   you get by adding a drag handler to a component that already
   had a hover transition on it.

   Reduced motion: everything here is the user's own hand, at
   the user's own pace, and nothing autoplays or loops. The
   lagged chip's transition is the subject of the lesson rather
   than an embellishment on it, so it stays; removing it would
   leave two identical chips and no lesson.

   Usage:
     <div data-grab-lab data-title="Grab both"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const LAGS = [60, 120, 220];

  function injectStyles() {
    if (document.getElementById('grab-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'grab-lab-styles';
    s.textContent = `
    .gb { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .gb { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .gb-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .gb-field { position: relative; height: 15rem; background: var(--paper);
                touch-action: none; overflow: hidden; cursor: grab;
                background-image: radial-gradient(var(--rule) 1px, transparent 1px);
                background-size: 1.5rem 1.5rem; }
    .gb-field.is-dragging { cursor: grabbing; }

    .gb-chip { position: absolute; top: 0; left: 0; width: 6.4rem; height: 3.2rem;
               display: grid; place-content: center; gap: 0.1rem; text-align: center;
               border: 1px solid var(--rule); border-radius: 10px; background: var(--paper);
               box-shadow: 0 1px 3px rgba(0,0,0,0.10);
               font: 600 0.9rem/1.2 var(--sans); color: var(--ink);
               -webkit-user-select: none; user-select: none; }
    .gb-chip small { font: 500 0.6rem/1.4 var(--sans); letter-spacing: 0.08em;
                     text-transform: uppercase; color: var(--ink-faint); }
    .gb-chip.is-held { box-shadow: 0 8px 20px rgba(0,0,0,0.18); border-color: var(--ink-faint); }

    /* The bug, faithfully: a transition left on the property the drag writes. */
    .gb-chip.is-lagged { transition: transform var(--gb-lag, 120ms) ease-out; }

    .gb-ring { position: absolute; top: 0; left: 0; width: 0.85rem; height: 0.85rem;
               margin: -0.425rem 0 0 -0.425rem; border-radius: 50%;
               border: 2px solid var(--accent); opacity: 0; pointer-events: none; }
    .gb-field.is-dragging .gb-ring { opacity: 1; }

    .gb-read { padding: 0.85rem 1.1rem; border-top: 1px solid var(--rule);
               background: var(--paper); min-height: 3.1rem;
               font: 400 0.83rem/1.5 var(--sans); color: var(--ink-soft); }
    .gb-read b { color: var(--ink); font-weight: 600; }

    .gb-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 0.9rem 1.1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); font-family: var(--sans); }
    .gb-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .gb-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .gb-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .gb-seg button:hover { border-color: var(--ink-faint); }
    .gb-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .gb-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media print { .gb-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'gb' + (++uid);
    const title = root.dataset.title || 'Grab both';
    /* Shuffled, so the answer is not on the screen until she asks for it. */
    const laggedIsRight = Math.random() < 0.5;
    let lag = 120, revealed = false, held = null, offX = 0, offY = 0;

    root.classList.add('gb');
    root.innerHTML = `
      <div class="gb-head"><span>${title}</span><span>drag one, then the other</span></div>
      <div class="gb-field" data-field>
        <div class="gb-chip" data-chip="A"><span>A</span><small data-tag>&nbsp;</small></div>
        <div class="gb-chip" data-chip="B"><span>B</span><small data-tag>&nbsp;</small></div>
        <div class="gb-ring" data-ring aria-hidden="true"></div>
      </div>
      <p class="gb-read" data-read aria-live="polite">Both chips move with the pointer. One of them
        has a transition on it. Drag each in turn — quick changes of direction are where it
        shows.</p>
      <div class="gb-foot">
        <span class="gb-cap">The transition is</span>
        <div class="gb-seg" data-seg role="group" aria-label="Transition duration">
          ${LAGS.map((v) => `<button type="button" data-v="${v}">${v} ms</button>`).join('')}
        </div>
        <button class="btn primary" type="button" data-reveal>Which one is it?</button>
      </div>
    `;

    const field = root.querySelector('[data-field]');
    const ring = root.querySelector('[data-ring]');
    const read = root.querySelector('[data-read]');
    const chips = { A: root.querySelector('[data-chip="A"]'), B: root.querySelector('[data-chip="B"]') };
    const laggedKey = laggedIsRight ? 'B' : 'A';
    chips[laggedKey].classList.add('is-lagged');

    const pos = { A: { x: 0, y: 0 }, B: { x: 0, y: 0 } };

    function layout() {
      const r = field.getBoundingClientRect();
      const cw = chips.A.offsetWidth, ch = chips.A.offsetHeight;
      pos.A = { x: r.width * 0.28 - cw / 2, y: r.height / 2 - ch / 2 };
      pos.B = { x: r.width * 0.72 - cw / 2, y: r.height / 2 - ch / 2 };
      /* A and B are placed left and right by name, but which name carries the
         transition was decided by the coin flip above. */
      if (laggedIsRight) { /* B is on the right and is the lagged one */ }
      draw('A'); draw('B');
    }

    function draw(k) {
      chips[k].style.transform = `translate(${pos[k].x}px, ${pos[k].y}px)`;
    }

    function paint() {
      root.style.setProperty('--gb-lag', lag + 'ms');
      root.querySelectorAll('.gb-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(Number(b.dataset.v) === lag)));
    }

    function reveal() {
      revealed = true;
      Object.keys(chips).forEach((k) => {
        chips[k].querySelector('[data-tag]').textContent =
          k === laggedKey ? `${lag}ms` : 'exact';
      });
      read.innerHTML = `<b>${laggedKey}</b> has <code>transition: transform ${lag}ms</code> on it.
        <b>${laggedKey === 'A' ? 'B' : 'A'}</b> writes the transform and nothing else. Keep dragging
        with the answer showing — the ring is where your pointer actually is.`;
    }

    field.addEventListener('pointerdown', (e) => {
      const chip = e.target.closest('.gb-chip');
      if (!chip) return;
      held = chip.dataset.chip;
      const r = field.getBoundingClientRect();
      offX = (e.clientX - r.left) - pos[held].x;
      offY = (e.clientY - r.top) - pos[held].y;
      field.setPointerCapture(e.pointerId);
      field.classList.add('is-dragging');
      chip.classList.add('is-held');
      move(e);
    });

    function move(e) {
      const r = field.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      ring.style.transform = `translate(${px}px, ${py}px)`;
      if (!held) return;
      const cw = chips[held].offsetWidth, ch = chips[held].offsetHeight;
      pos[held].x = Math.max(0, Math.min(r.width - cw, px - offX));
      pos[held].y = Math.max(0, Math.min(r.height - ch, py - offY));
      draw(held);
    }

    field.addEventListener('pointermove', move);
    field.addEventListener('pointerup', () => {
      if (held) chips[held].classList.remove('is-held');
      held = null;
      field.classList.remove('is-dragging');
    });
    field.addEventListener('pointercancel', () => {
      if (held) chips[held].classList.remove('is-held');
      held = null;
      field.classList.remove('is-dragging');
    });

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.gb-seg button');
      if (seg) { lag = Number(seg.dataset.v); paint(); if (revealed) reveal(); return; }
      if (e.target.closest('[data-reveal]')) reveal();
    });

    paint();
    /* Synchronously, not in a rAF: the rows are laid out entirely by transform,
       so until this runs they are all stacked at slot zero. Row height is a fixed
       rem value, so nothing here depends on fonts having arrived. */
    layout();
    window.addEventListener('load', layout);
    window.addEventListener('resize', layout);
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-grab-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
