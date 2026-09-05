/* ============================================================
   return-lab.js — three drawers that arrive identically and
   leave three different ways.

   Why this exists: lesson D002's second claim is that the exit
   is a statement about where the thing went, and that claim is
   about how something *feels*, not about a number. "Sequential
   A/B cannot teach a feeling" — so all three exits play at the
   same moment, from one press, side by side. Watching them one
   after another would let memory do the comparing, and memory
   is exactly the faculty being argued about.

   The entrances are deliberately identical. Only the exit
   varies, so there is nothing else for the difference to be
   attributed to.

   Reduced motion: as in home-lab, the content here is motion.
   Nothing autoplays and nothing loops; the whole lab is inert
   until pressed, and it is one press rather than three.

   Usage:
     <div data-return-lab data-title="Three ways to close it"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const PANES = [
    {
      id: 'back',
      label: 'returns the way it came',
      note: 'It is still over there. Opening it again picks the same thing back up.',
      v: 'good',
    },
    {
      id: 'fade',
      label: 'fades where it stands',
      note: 'It stopped existing. Opening it again has to make a new one.',
      v: 'ok',
    },
    {
      id: 'through',
      label: 'leaves out the far side',
      note: 'It passed through. It now lives on a side of the screen it never came from.',
      v: 'bad',
    },
  ];

  function injectStyles() {
    if (document.getElementById('return-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'return-lab-styles';
    s.textContent = `
    .rt { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .rt { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .rt-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    /* Always three across. Wrapping to two rows would put one pane below the
       fold on a phone and quietly turn the simultaneous comparison back into a
       sequential one, which is the whole thing this lab exists to avoid. */
    .rt-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
               gap: 0.7rem; padding: 1.1rem; }
    @media (min-width: 700px) { .rt-grid { gap: 1.1rem; padding: 1.3rem; } }

    .rt-cell { display: grid; gap: 0.5rem; align-content: start; }
    .rt-cap { font: 600 0.72rem/1.35 var(--sans); color: var(--ink); }

    .rt-frame { position: relative; height: 172px; overflow: hidden;
                border: 1px solid var(--rule); border-radius: 9px; background: var(--paper);
                font: 400 0.66rem/1.3 var(--sans); }
    .rt-chrome { display: flex; align-items: center; gap: 0.4rem;
                 padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--rule);
                 color: var(--ink-soft); }
    .rt-body { padding: 0.55rem 0.5rem; display: grid; gap: 0.35rem; align-content: start; }
    .rt-row { height: 0.42rem; border-radius: 3px; background: var(--paper-sunk); }
    .rt-row:nth-child(2) { width: 74%; }
    .rt-row:nth-child(3) { width: 88%; }

    .rt-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 66%;
                 border-left: 1px solid var(--rule); background: var(--paper);
                 box-shadow: -8px 0 24px rgba(20, 18, 16, 0.14);
                 padding: 0.55rem; display: grid; gap: 0.35rem; align-content: start;
                 /* Parked off-frame at rest so the cell reads as the app, not as a
                    drawer someone left open. */
                 transform: translateX(101%); }
    .rt-lbl { font-weight: 600; color: var(--ink); }
    .rt-item { height: 0.4rem; border-radius: 3px; background: var(--paper-sunk); }

    .rt-note { font: 400 0.76rem/1.45 var(--sans); color: var(--ink-soft);
               /* Reserved: the three notes are two and three lines long, and a
                  ragged bottom edge would read as one pane being different. */
               min-height: 4.4rem; }
    .rt-note b { display: block; font: 600 0.66rem/1.6 var(--sans);
                 text-transform: uppercase; letter-spacing: 0.06em; }
    .rt-note[data-v="good"] b { color: var(--good); }
    .rt-note[data-v="ok"] b { color: var(--ink-faint); }
    .rt-note[data-v="bad"] b { color: var(--bad); }

    .rt-foot { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;
               padding: 0 1.1rem 1.1rem; }
    .rt-hint { font: 400 0.78rem/1.4 var(--sans); color: var(--ink-faint); }

    @media print { .rt-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'rt' + (++uid);
    const title = root.dataset.title || 'Three ways to close it';

    root.classList.add('rt');
    root.innerHTML = `
      <div class="rt-head"><span>${title}</span></div>
      <div class="rt-grid">
        ${PANES.map((p) => `
          <div class="rt-cell">
            <span class="rt-cap">${p.label}</span>
            <div class="rt-frame">
              <div class="rt-chrome">&#9776;<span>Projects</span></div>
              <div class="rt-body"><div class="rt-row"></div><div class="rt-row"></div><div class="rt-row"></div></div>
              <div class="rt-drawer" data-drawer="${p.id}">
                <span class="rt-lbl">Filters</span>
                <div class="rt-item"></div>
                <div class="rt-item" style="width:76%"></div>
                <div class="rt-item" style="width:88%"></div>
              </div>
            </div>
            <p class="rt-note" data-v="${p.v}"><b>${p.label}</b>${p.note}</p>
          </div>`).join('')}
      </div>
      <div class="rt-foot">
        <button class="btn primary" type="button" data-play>Open all three, then close them</button>
        <span class="rt-hint">Same entrance in all three. Only the way out differs.</span>
      </div>
    `;

    const btn = root.querySelector('[data-play]');
    const drawers = PANES.map((p) => ({ p, el: root.querySelector(`[data-drawer="${p.id}"]`) }));

    function play() {
      btn.disabled = true;

      drawers.forEach(({ el }) => {
        el.style.transition = 'none';
        el.style.transform = 'translateX(101%)';
        el.style.opacity = '1';
      });
      void root.offsetWidth;

      /* One entrance, three times, to the frame. */
      drawers.forEach(({ el }) => {
        el.style.transition = 'transform 300ms var(--ease-out-strong)';
        el.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        drawers.forEach(({ p, el }) => {
          if (p.id === 'back') {
            el.style.transition = 'transform 230ms cubic-bezier(0.4, 0, 1, 1)';
            el.style.transform = 'translateX(101%)';
          } else if (p.id === 'fade') {
            el.style.transition = 'opacity 230ms ease-in';
            el.style.opacity = '0';
          } else {
            /* Far enough to clear the left edge: the drawer's own width plus the
               strip of app showing beside it. */
            el.style.transition = 'transform 260ms cubic-bezier(0.4, 0, 1, 1)';
            el.style.transform = `translateX(-${Math.round(el.offsetLeft + el.offsetWidth)}px)`;
          }
        });
        setTimeout(() => {
          drawers.forEach(({ el }) => {
            el.style.transition = 'none';
            el.style.transform = 'translateX(101%)';
            el.style.opacity = '1';
          });
          btn.disabled = false;
        }, 700);
      }, 300 + 900);
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-play]')) play();
    });

    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-return-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
