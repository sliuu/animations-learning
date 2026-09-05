/* ============================================================
   channel-lab.js — motion against the static channels, head to
   head.

   Why this exists: "motion is the loudest hierarchy channel you
   have" is the kind of claim that is either demonstrated or
   waved at, and waving at it is how design writing usually
   handles it. So this is a controlled experiment. Four tiles,
   each promoted by exactly one channel — size, weight, colour,
   and nothing at all — and the motion can be handed to any of
   them. Hand it to the plain tile, the one that loses every
   static comparison on the screen, and see what happens anyway.

   The motion is deliberately modest: a nine-pixel lift and a
   settle, the sort of thing that would pass a design review
   without comment. A bounce or a flash would win the argument
   by cheating, and "the break is never a straw man" applies to
   an argument for something exactly as hard as it applies to an
   argument against.

   Implemented with a keyframe animation rather than a class
   toggle on a transition, because an animation restarts cleanly
   from the remove-reflow-add idiom and a transition does not —
   the class removal starts a *reverse* transition instead of
   teleporting, and re-adding it cancels that at zero progress.
   That bug shipped once in pattern-lab.js already.

   Reduced motion: the content here is motion, so removing it
   leaves four static tiles and no lesson. Nothing autoplays,
   nothing loops, and the tile is still at rest until pressed.

   Usage:
     <div data-channel-lab data-title="Which channel wins?"></div>
   ============================================================ */

(() => {
  let uid = 0;

  /* Ranked by static prominence, strongest first. The order is the answer to
     "what does this screen say is important" before motion is involved. */
  const TILES = [
    { id: 'size',   chip: 'larger',   label: 'Revenue',  value: '$48,290', rank: 1 },
    { id: 'colour', chip: 'coloured', label: 'Signups',  value: '318',     rank: 2 },
    { id: 'weight', chip: 'heavier',  label: 'Sessions', value: '2,481',   rank: 3 },
    { id: 'plain',  chip: 'plain',    label: 'Churn',    value: '1.2%',    rank: 4 },
  ];

  const NAMES = { size: 'Revenue', colour: 'Signups', weight: 'Sessions', plain: 'Churn' };

  function injectStyles() {
    if (document.getElementById('channel-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'channel-lab-styles';
    s.textContent = `
    .cn { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .cn { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .cn-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .cn-board { padding: 1.4rem 1.1rem 1.1rem; background: var(--paper); }
    .cn-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.6rem; max-width: 46rem; margin: 0 auto; }
    @media (min-width: 700px) { .cn-tiles { gap: 1rem; } }

    .cn-tile { display: grid; gap: 0.15rem; align-content: start; justify-items: start;
               padding: 0.7rem 0.75rem; border: 1px solid var(--rule); border-radius: 9px;
               background: var(--paper); font-family: var(--sans);
               /* Equal heights regardless of the size channel, so the tile promoted
                  by font-size is not also promoted by being a taller box. */
               min-height: 6.2rem; }
    .cn-chip { font: 600 0.58rem/1.6 var(--sans); text-transform: uppercase;
               letter-spacing: 0.09em; color: var(--ink-faint); }
    .cn-lbl { font-size: 0.7rem; color: var(--ink-soft); }
    .cn-val { margin-top: auto; font-size: 1.05rem; font-weight: 500; color: var(--ink-soft);
              font-variant-numeric: tabular-nums; }

    /* One channel per tile, and only one. */
    .cn-tile[data-id="size"]   .cn-val { font-size: 1.7rem; }
    .cn-tile[data-id="weight"] .cn-val { font-weight: 750; color: var(--ink); }
    .cn-tile[data-id="colour"] .cn-val { color: var(--accent); }

    @keyframes cn-lift {
      0%   { transform: none; }
      42%  { transform: translateY(-9px); }
      100% { transform: none; }
    }
    .cn-tile.moving { animation: cn-lift 620ms var(--ease-in-out-strong); }

    .cn-read { max-width: 46rem; margin: 1.1rem auto 0; display: grid; gap: 0.25rem;
               font: 400 0.82rem/1.5 var(--sans); color: var(--ink-soft); }
    .cn-read b { color: var(--ink); font-weight: 600; }
    .cn-read i { font-style: normal; color: var(--accent); font-weight: 600; }

    .cn-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 1rem 1.1rem; border-top: 1px solid var(--rule);
               font-family: var(--sans); font-size: 0.8rem; }
    .cn-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .cn-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .cn-seg button:hover { border-color: var(--ink-faint); }
    .cn-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .cn-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .cn-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }

    @media print { .cn-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'cn' + (++uid);
    const title = root.dataset.title || 'Which channel wins?';
    const state = { moving: 'plain', busy: false };

    const staticOrder = [...TILES].sort((a, b) => a.rank - b.rank).map((t) => t.label);

    root.classList.add('cn');
    root.innerHTML = `
      <div class="cn-head"><span>${title}</span></div>
      <div class="cn-board">
        <div class="cn-tiles">
          ${TILES.map((t) => `
            <div class="cn-tile" data-id="${t.id}">
              <span class="cn-chip">${t.chip}</span>
              <span class="cn-lbl">${t.label}</span>
              <span class="cn-val">${t.value}</span>
            </div>`).join('')}
        </div>
        <div class="cn-read" aria-live="polite">
          <span><b>Static rank:</b> ${staticOrder.join(' &rarr; ')}</span>
          <span data-moving></span>
        </div>
      </div>
      <div class="cn-foot">
        <span class="cn-cap">Give the motion to</span>
        <div class="cn-seg" data-seg role="group" aria-label="Which tile moves">
          ${TILES.map((t) => `<button type="button" data-v="${t.id}">${NAMES[t.id]}</button>`).join('')}
          <button type="button" data-v="none">nobody</button>
        </div>
        <button class="btn primary" type="button" data-play>Play</button>
      </div>
    `;

    const movingLine = root.querySelector('[data-moving]');
    const playBtn = root.querySelector('[data-play]');

    function paint() {
      root.querySelectorAll('.cn-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.moving)));
      if (state.moving === 'none') {
        movingLine.innerHTML = '<b>Moving:</b> nothing. The tiles rank by size, weight and colour alone.';
      } else {
        const t = TILES.find((x) => x.id === state.moving);
        movingLine.innerHTML = `<b>Moving:</b> <i>${t.label}</i> — ranked ${t.rank} of 4 by every channel that isn't motion.`;
      }
      playBtn.disabled = state.moving === 'none';
    }

    function play() {
      if (state.busy || state.moving === 'none') return;
      state.busy = true;
      playBtn.disabled = true;
      const tile = root.querySelector(`.cn-tile[data-id="${state.moving}"]`);
      tile.classList.remove('moving');
      void tile.offsetWidth;          /* an animation restarts cleanly from this; a transition does not */
      tile.classList.add('moving');
      setTimeout(() => {
        tile.classList.remove('moving');
        state.busy = false;
        playBtn.disabled = false;
      }, 660);
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.cn-seg button');
      if (seg) {
        if (state.busy) return;
        state.moving = seg.dataset.v;
        paint();
        return;
      }
      if (e.target.closest('[data-play]')) play();
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-channel-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
