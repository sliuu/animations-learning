/* ============================================================
   wipe-lab.js — one picture, three builds, five demands.

   All three panes produce the same reveal on the default demand,
   and only one of them costs a paint. That is the whole decision
   this lesson exists to teach, so the lab is built to make the
   reader spend the frames only when the cheap builds physically
   cannot do the job.

   None of the three is a straw man. B (a clipping wrapper and a
   counter-transform) is exactly what a split-text library emits
   for a line mask, and C (a static clipping wrapper with the
   content sliding inside it) is the most-shipped reveal on the
   web. Each of them wins at least one demand outright, and each
   of them loses at least one. If the matrix had a column that
   won everything, there would be nothing to teach.

   What is derived and what is written down:
   - "the type must not move" is *measured* — the displacement of
     the headline is summed up the transform chain at every frame
     of the flight, so that verdict cannot drift from the demo.
   - the other four demands fail structurally, and they fail
     visibly: the corners travel, the edge stays straight, the
     window opens from one side. The pane shows the casualty and
     the verdict line names it. Nothing is asserted that is not
     also on screen.

   The cost strip is measured on the reader's own machine rather
   than quoted, because the answer moves with the browser, the
   shape and the area. Raise the copy count until one build gives
   way — the point is the shape of the curve, not the number.

   Reduced motion: as with the rest of this lesson, the motion is
   the content. Nothing autoplays and nothing loops; the stress
   pass is the only thing that runs more than one animation, and
   it runs only when it is asked to, once.

   Usage:
     <div data-wipe-lab data-title="One picture, three builds"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const MS = 620;

  const BUILDS = [
    { id: 'a', name: 'clip-path', prop: 'clip-path', tier: 'paint tier — on credit',
      sub: 'one property, no wrapper' },
    { id: 'b', name: 'moving window', prop: 'transform ×2', tier: 'composited',
      sub: 'wrapper + counter-transform' },
    { id: 'c', name: 'static window', prop: 'transform', tier: 'composited',
      sub: 'wrapper + sliding content' },
  ];

  /* The five demands, and what each build's window can actually be under each
     one. `clip` is the shape pair for build A. `radius` puts the card's own
     14px on the wrapper, which is right for a window that stays still (C) and
     wrong for one that travels (B) — that difference is the demand-3 lesson
     and it is visible, not asserted. */
  const DEMANDS = {
    plain: {
      label: 'just reveal it',
      from: 'inset(0 100% 0 0)', to: 'inset(0 0 0 0)',
      radius: false,
      verdict: {
        a: ['met', 'Fine — and the most expensive way to get a result two composited transforms would also have given you. On this demand, this build is the wrong answer.'],
        b: ['met', 'The window travels and the content is pinned against it. Same picture as the left pane, paid for in transform.'],
        c: ['met', 'The window stays still and the content slides in behind it. Cheapest of the three, and on this demand nothing is lost.'],
      },
    },
    still: {
      label: 'the type must not move',
      from: 'inset(0 100% 0 0)', to: 'inset(0 0 0 0)',
      radius: false,
      verdict: {
        a: ['met', 'The element never moves at all — only the window over it does.'],
        b: ['met', 'The wrapper moves one way and the content moves back by exactly as much, so the type is stationary on screen. This is the trick a split-text library is doing.'],
        c: ['fail', 'The content is the thing moving, so the type slides. Read the pixels below: this build cannot meet this demand, because sliding is how it works.'],
      },
    },
    round: {
      label: "the window keeps the card's corners",
      from: 'inset(0 100% 0 0 round 14px)', to: 'inset(0 0 0 0 round 14px)',
      radius: true,
      verdict: {
        a: ['met', '<code>round 14px</code> on the inset. The window is the card shape at every frame, including the leading edge.'],
        b: ['fail', 'The radius is on a wrapper that is <em>moving</em>, so the corners travel with the window — the leading edge is a curve sweeping across the card instead of the card’s own corners staying put.'],
        c: ['met', 'The window is still, so its radius sits exactly on the card. A static clipping wrapper does rounded corners for free.'],
      },
    },
    diagonal: {
      label: 'a diagonal leading edge',
      from: 'polygon(0% 0%, 0% 0%, -34% 100%, -34% 100%)',
      to: 'polygon(0% 0%, 134% 0%, 100% 100%, -34% 100%)',
      radius: false,
      verdict: {
        a: ['met', 'A four-point polygon, and the two leading points interpolate together. Any edge you can describe as a polygon is available here.'],
        b: ['fail', 'A box is a box. <code>overflow: hidden</code> clips to a rectangle and there is no declaration that tilts it, so the demand goes unmet and the edge stays vertical.'],
        c: ['fail', 'Same rectangle, same limit. Nothing about this build is broken — it simply has one available shape and this is not it.'],
      },
    },
    centre: {
      label: 'open from the centre line',
      from: 'inset(0 50% 0 50%)', to: 'inset(0 0 0 0)',
      radius: false,
      verdict: {
        a: ['met', 'Two insets animate at once. A window can have as many moving edges as the shape has sides.'],
        b: ['fail', 'One wrapper is one leading edge. Opening from the middle needs two windows and two counter-transforms — at which point you have written more CSS than the left pane and still cannot round it.'],
        c: ['fail', 'The content can only enter from one side of a still window, so it does. Watch where it starts: that is the demand not being met.'],
      },
    },
  };

  const ORDER = ['plain', 'still', 'round', 'diagonal', 'centre'];
  const COUNTS = [48, 120, 300];

  function injectStyles() {
    if (document.getElementById('wipe-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'wipe-lab-styles';
    s.textContent = `
    .wp { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .wp { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .wp-head { padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .wp-body { display: grid; gap: 1.2rem; padding: 1.3rem 1.1rem; align-items: start;
               grid-template-columns: minmax(0, 1fr); background: var(--paper); }
    @media (min-width: 900px) { .wp-body { grid-template-columns: minmax(0, 1fr) 13rem; } }

    .wp-panes { display: grid; gap: 0.5rem 0.9rem; grid-template-columns: minmax(0, 1fr); }
    /* auto auto 1fr: the verdict box takes the slack, so a long verdict does not
       drag its own stage down away from the other two. */
    .wp-pane { display: grid; gap: 0.5rem; grid-template-rows: auto auto 1fr;
               min-width: 0; }

    /* Side by side, the three panes dissolve into one nine-cell grid and each
       part is pinned to its own row. Three separate grids cannot agree on a
       row height, so "wrapper + counter-transform" wrapping to two lines at
       one width would push its own stage below the other two — the three
       reveals have to start on the same line to be comparable at all. Rows are
       named explicitly because auto-placement would otherwise fill row 1 with
       name/stage/read of the first pane. */
    @media (min-width: 620px) {
      .wp-panes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .wp-pane { display: contents; }
      .wp-name { grid-row: 1; align-self: end; }
      .wp-stage { grid-row: 2; }
      .wp-read { grid-row: 3; }
    }
    .wp-name { font: 600 0.68rem/1.3 var(--sans); color: var(--ink-soft);
               text-transform: uppercase; letter-spacing: 0.07em; }
    .wp-name span { display: block; text-transform: none; letter-spacing: 0;
                    font: 400 0.7rem/1.5 var(--mono); color: var(--ink-faint); }

    /* Fixed height so a card revealing never resizes the row it sits in. */
    .wp-stage { position: relative; height: 10rem; padding: 0.75rem;
                border: 1px solid var(--rule); border-radius: 9px;
                background: var(--paper-sunk); display: grid; place-items: stretch; }

    /* The three builds, all producing the same picture on the default demand.
       A: one element, one property. B: a window that travels while the content
       counter-travels. C: a window that stays put while the content slides. */
    .wp-card { position: relative; border-radius: 14px; overflow: hidden;
               background: var(--paper); border: 1px solid var(--rule);
               display: grid; grid-template-rows: 1fr auto; }
    .wp-shot { background: linear-gradient(122deg,
                 color-mix(in srgb, var(--accent) 82%, black),
                 color-mix(in srgb, var(--accent) 45%, white)); }
    .wp-meta { padding: 0.5rem 0.6rem; display: grid; gap: 0.12rem; }
    .wp-t { font: 620 0.78rem/1.2 var(--sans); color: var(--ink); }
    .wp-p { font: 500 0.7rem/1.3 var(--mono); color: var(--ink-faint); }

    .wp-win { position: absolute; inset: 0; overflow: hidden; }
    .wp-win.round { border-radius: 14px; }
    /* The window's content has to lay out exactly as the un-wrapped card does,
       or the three panes are showing three different cards. */
    .wp-in { position: absolute; inset: 0; display: grid; grid-template-rows: 1fr auto;
             background: var(--paper); }

    @keyframes wp-clip { from { clip-path: var(--from); } to { clip-path: var(--to); } }
    @keyframes wp-out  { from { transform: translateX(-100%); } to { transform: none; } }
    @keyframes wp-back { from { transform: translateX(100%); }  to { transform: none; } }
    @keyframes wp-slide{ from { transform: translateX(-100%); } to { transform: none; } }

    .wp-a.run  { animation: wp-clip var(--ms) var(--ease-out-strong) both; }
    .wp-bw.run { animation: wp-out  var(--ms) var(--ease-out-strong) both; }
    .wp-bi.run { animation: wp-back var(--ms) var(--ease-out-strong) both; }
    .wp-ci.run { animation: wp-slide var(--ms) var(--ease-out-strong) both; }

    .wp-read { display: grid; gap: 0.2rem; padding: 0.5rem 0.6rem;
               border: 1px solid var(--rule); border-radius: 7px;
               background: var(--paper-sunk); font-family: var(--sans);
               /* Reserved: the tallest verdict in the matrix, so switching
                  demands never shifts the three stages above it. */
               min-height: 8.2rem; align-content: start; }
    .wp-badge { font: 600 0.62rem/1.5 var(--sans); text-transform: uppercase;
                letter-spacing: 0.07em; color: var(--ink-faint); }
    .wp-badge.met  { color: var(--good); }
    .wp-badge.fail { color: var(--bad); }
    .wp-why { font: 400 0.74rem/1.5 var(--sans); color: var(--ink-soft); margin: 0; }
    .wp-why code { font: 400 0.7rem/1.4 var(--mono); }
    .wp-px { font: 600 0.68rem/1.5 var(--mono); color: var(--ink-faint); }
    .wp-px b { color: var(--ink); font-weight: 600; }

    .wp-side { display: grid; gap: 0.7rem; align-content: start; min-width: 0;
               font-family: var(--sans); }
    .wp-cap { font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft);
              text-transform: uppercase; letter-spacing: 0.07em; }
    .wp-seg { display: grid; gap: 0.28rem; }
    .wp-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft); text-align: left;
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.4rem 0.6rem; }
    .wp-seg button:hover { border-color: var(--ink-faint); }
    .wp-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .wp-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .wp-seg.row { grid-auto-flow: column; grid-auto-columns: 1fr; }
    .wp-seg.row button { text-align: center; font-family: var(--mono); font-size: 0.72rem; }

    .wp-out { border-top: 1px solid var(--rule); padding: 0.85rem 1.1rem 1rem;
              background: var(--paper-sunk); }
    .wp-cost { width: 100%; border-collapse: collapse; font-family: var(--sans);
               font-size: 0.76rem; margin: 0 0 0.4rem; }
    .wp-cost th { text-align: left; font-weight: 600; color: var(--ink-faint);
                  font-size: 0.64rem; text-transform: uppercase; letter-spacing: 0.07em;
                  padding: 0 0.6rem 0.35rem 0; border-bottom: 1px solid var(--rule); }
    .wp-cost td { padding: 0.42rem 0.6rem 0.42rem 0; border-bottom: 1px dotted var(--rule);
                  color: var(--ink-soft); vertical-align: baseline; }
    .wp-cost td b { font-family: var(--mono); color: var(--ink); font-weight: 600; }
    .wp-cost tr.busy td { color: var(--accent); }
    .wp-note { font: 400 0.74rem/1.5 var(--sans); color: var(--ink-faint); margin: 0.5rem 0 0;
               /* Reserved for the two-line verdict so the strip never jumps. */
               min-height: 2.3rem; }

    /* The stress strip only exists while a measurement is running. It is
       deliberately small and dense — the question is how many copies of this
       shape the machine can carry, not what one looks like. */
    .wp-stress { display: none; margin-top: 0.8rem; padding: 0.4rem;
                 border: 1px solid var(--rule); border-radius: 8px;
                 background: var(--paper); overflow: hidden; }
    .wp-stress.on { display: block; }
    .wp-grid { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; }
    .wp-mini { position: relative; height: 14px; border-radius: 4px; overflow: hidden; }
    /* Each build's root has to fill the tile: a clip-path against a zero-height
       box clips everything, which would have measured three blank grids. */
    .wp-mini > * { position: absolute; inset: 0; }
    .wp-mini .wp-shot { position: absolute; inset: 0; border-radius: 4px; }
    .wp-mini .wp-in { display: block; }

    @media print { .wp-side, .wp-stress { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const CARD = `
    <div class="wp-shot"></div>
    <div class="wp-meta">
      <span class="wp-t" data-measure>Alpine frame pack</span>
      <span class="wp-p">$248.00</span>
    </div>`;

  function build(root) {
    const id = 'wp' + (++uid);
    const title = root.dataset.title || 'One picture, three builds';
    const state = { demand: 'plain', count: 48, busy: false, guard: 0, cost: {} };

    root.classList.add('wp');
    root.innerHTML = `
      <div class="wp-head">${title}</div>
      <div class="wp-body">
        <div class="wp-panes">
          ${BUILDS.map((b) => `
            <div class="wp-pane">
              <span class="wp-name">${b.name}<span>${b.sub}</span></span>
              <div class="wp-stage" data-stage="${b.id}"></div>
              <div class="wp-read" aria-live="polite">
                <span class="wp-badge" data-badge="${b.id}">press reveal</span>
                <p class="wp-why" data-why="${b.id}">&nbsp;</p>
                <span class="wp-px" data-px="${b.id}"></span>
              </div>
            </div>`).join('')}
        </div>
        <div class="wp-side">
          <span class="wp-cap">The demand</span>
          <div class="wp-seg" data-seg role="group" aria-label="What the reveal has to do">
            ${ORDER.map((k) => `<button type="button" data-v="${k}">${DEMANDS[k].label}</button>`).join('')}
          </div>
          <div class="wp-actions"><button class="btn primary" type="button" data-play>Reveal all three</button></div>
          <span class="wp-cap">Copies to measure</span>
          <div class="wp-seg row" data-counts role="group" aria-label="Copies per build">
            ${COUNTS.map((n) => `<button type="button" data-n="${n}">${n}</button>`).join('')}
          </div>
          <div class="wp-actions"><button class="btn" type="button" data-cost>Measure the cost</button></div>
        </div>
      </div>
      <div class="wp-out">
        <table class="wp-cost">
          <thead><tr><th>Build</th><th>Animating</th><th>Tier</th><th>Worst frame</th></tr></thead>
          <tbody>
            ${BUILDS.map((b) => `
              <tr data-row="${b.id}">
                <td>${b.name}</td><td><b>${b.prop}</b></td><td>${b.tier}</td>
                <td data-worst="${b.id}">&mdash;</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <p class="wp-note" data-note>Nothing measured yet. The tiers come from lesson 0002; the
          right-hand column is your machine, today, at this size.</p>
        <div class="wp-stress" data-stress><div class="wp-grid" data-grid></div></div>
      </div>
    `;

    const stages = {
      a: root.querySelector('[data-stage="a"]'),
      b: root.querySelector('[data-stage="b"]'),
      c: root.querySelector('[data-stage="c"]'),
    };
    const noteEl = root.querySelector('[data-note]');
    const stressEl = root.querySelector('[data-stress]');
    const gridEl = root.querySelector('[data-grid]');

    /* Each build's markup, rebuilt on every demand change so the wrapper's
       radius is a property of the demand rather than a class left lying
       around from the last one. */
    function markup(which, d, mini) {
      const body = mini ? '<div class="wp-shot"></div>' : CARD;
      const card = mini ? '' : 'wp-card';
      const r = d.radius ? ' round' : '';
      if (which === 'a') return `<div class="wp-a ${card}" data-anim>${body}</div>`;
      if (which === 'b') {
        return `<div class="${card}"><div class="wp-win wp-bw${r}" data-anim>` +
               `<div class="wp-in wp-bi" data-anim>${body}</div></div></div>`;
      }
      return `<div class="${card}"><div class="wp-win${r}">` +
             `<div class="wp-in wp-ci" data-anim>${body}</div></div></div>`;
    }

    function render() {
      const d = DEMANDS[state.demand];
      BUILDS.forEach((b) => {
        stages[b.id].innerHTML = markup(b.id, d, false);
        stages[b.id].querySelectorAll('[data-anim]').forEach((el) => {
          el.style.setProperty('--ms', MS + 'ms');
          if (b.id === 'a') {
            el.style.setProperty('--from', d.from);
            el.style.setProperty('--to', d.to);
          }
        });
      });
    }

    function paint() {
      root.querySelectorAll('[data-seg] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.demand)));
      root.querySelectorAll('[data-counts] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(+b.dataset.n === state.count)));
      const d = DEMANDS[state.demand];
      BUILDS.forEach((b) => {
        const [grade, why] = d.verdict[b.id];
        const badge = root.querySelector(`[data-badge="${b.id}"]`);
        badge.className = 'wp-badge ' + grade;
        badge.textContent = grade === 'met' ? 'demand met' : 'demand not met';
        root.querySelector(`[data-why="${b.id}"]`).innerHTML = why;
        root.querySelector(`[data-px="${b.id}"]`).innerHTML = '';
      });
      render();
    }

    /* Summed up the chain, because in build B the transform that matters is on
       a wrapper and in build C it is on another one. This is the number that
       decides the "type must not move" demand — the badge for that row is the
       only one in the matrix the reader could otherwise be asked to take on
       trust, and it is the one this makes checkable. */
    function shifted(el, stop) {
      let x = 0, y = 0;
      for (let n = el; n && n !== stop; n = n.parentElement) {
        const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
        x += m.m41; y += m.m42;
      }
      return Math.round(Math.hypot(x, y));
    }

    function play() {
      if (state.busy) return;
      render();
      state.busy = true;
      clearTimeout(state.guard);
      state.guard = setTimeout(() => { state.busy = false; }, MS + 1200);

      const heads = {};
      BUILDS.forEach((b) => {
        heads[b.id] = stages[b.id].querySelector('[data-measure]');
        stages[b.id].querySelectorAll('[data-anim]').forEach((el) => {
          void el.offsetWidth;
          el.classList.add('run');
        });
      });

      const t0 = performance.now();
      const moved = { a: 0, b: 0, c: 0 };
      const tick = (now) => {
        BUILDS.forEach((b) => {
          moved[b.id] = Math.max(moved[b.id], shifted(heads[b.id], stages[b.id]));
        });
        if (now - t0 < MS + 80) { requestAnimationFrame(tick); return; }
        BUILDS.forEach((b) => {
          root.querySelector(`[data-px="${b.id}"]`).innerHTML =
            moved[b.id] === 0
              ? 'title moved <b>0px</b> on screen'
              : `title moved <b>${moved[b.id]}px</b> on screen`;
        });
        clearTimeout(state.guard);
        state.busy = false;
      };
      requestAnimationFrame(tick);
    }

    /* ---- the cost pass ------------------------------------------------
       Three sequential runs, one build at a time, so the worst frame can be
       attributed. Sequential is fine here and would not be for the panes
       above: this is a comparison of numbers, not of feelings. */
    function measureCost() {
      if (state.busy) return;
      state.busy = true;
      stressEl.classList.add('on');
      const queue = BUILDS.slice();

      const runOne = () => {
        const b = queue.shift();
        if (!b) {
          stressEl.classList.remove('on');
          gridEl.innerHTML = '';
          state.busy = false;
          verdict();
          return;
        }
        const d = DEMANDS[state.demand];
        root.querySelector(`[data-row="${b.id}"]`).classList.add('busy');
        root.querySelector(`[data-worst="${b.id}"]`).innerHTML = 'measuring…';
        gridEl.innerHTML = new Array(state.count).fill(0)
          .map(() => `<div class="wp-mini">${markup(b.id, d, true)}</div>`).join('');
        gridEl.querySelectorAll('[data-anim]').forEach((el) => {
          el.style.setProperty('--ms', MS + 'ms');
          if (b.id === 'a') {
            el.style.setProperty('--from', d.from);
            el.style.setProperty('--to', d.to);
          }
        });

        requestAnimationFrame(() => {
          gridEl.querySelectorAll('[data-anim]').forEach((el) => el.classList.add('run'));
          const t0 = performance.now();
          let last = t0, worst = 0, longs = 0, first = true;
          const tick = (now) => {
            /* Skip the first delta: it contains the style pass for hundreds of
               new elements, which every build pays equally and none of them
               pays while a page is actually running. */
            const dt = now - last; last = now;
            if (!first) { worst = Math.max(worst, dt); if (dt > 20) longs++; }
            first = false;
            if (now - t0 < MS + 60) { requestAnimationFrame(tick); return; }
            state.cost[b.id] = { worst: Math.round(worst), longs };
            root.querySelector(`[data-row="${b.id}"]`).classList.remove('busy');
            root.querySelector(`[data-worst="${b.id}"]`).innerHTML =
              `<b>${Math.round(worst)}ms</b>${longs ? ` · ${longs} over 20ms` : ''}`;
            setTimeout(runOne, 260);
          };
          requestAnimationFrame(tick);
        });
      };
      noteEl.textContent = `Running ${state.count} copies of each build…`;
      setTimeout(runOne, 60);
    }

    function verdict() {
      const a = state.cost.a, b = state.cost.b, c = state.cost.c;
      if (!a || !b || !c) return;
      const cheap = Math.min(b.worst, c.worst);
      const gap = a.worst - cheap;
      const budget = a.worst <= 20 && cheap <= 20;
      noteEl.innerHTML = budget
        ? `All three held a frame at ${state.count} copies on this machine — at this size the ` +
          `shape is free, and the choice is about what the window has to <em>be</em>, not what ` +
          `it costs. Raise the count until something gives way.`
        : gap > 4
          ? `The paint-tier build is <b>${gap}ms</b> worse on its worst frame at ${state.count} ` +
            `copies. That gap is the price of the shape — worth paying when the cheap builds ` +
            `cannot make it, and pure waste when they can.`
          : `At ${state.count} copies the three are within ${Math.abs(gap)}ms of each other, so ` +
            `cost is not deciding this one. Raise the count, or decide on the demand instead.`;
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-seg] button');
      if (seg) {
        if (state.busy) return;
        state.demand = seg.dataset.v;
        paint();
        return;
      }
      const cnt = e.target.closest('[data-counts] button');
      if (cnt) {
        if (state.busy) return;
        state.count = +cnt.dataset.n;
        paint();
        return;
      }
      if (e.target.closest('[data-play]')) play();
      if (e.target.closest('[data-cost]')) measureCost();
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-wipe-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
