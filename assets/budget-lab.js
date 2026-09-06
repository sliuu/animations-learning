/* ============================================================
   budget-lab.js — one refresh, and how much of the screen
   reacts to it.

   The lesson's question is "should this animate?", and the
   honest answer depends on two things that are usually decided
   by different people: how much actually changed, and how much
   you chose to move. This lab puts both on the same stage so the
   pairing is the knob.

   There is deliberately no setting that is right for both
   events. Animating five panels is correct when five panels
   changed and a lie when one did — so the reader cannot come
   away with "less is better", which is the wrong lesson and the
   easy one to teach by accident. The rule is match the motion to
   the size of the event.

   The three counts in the verdict are measured off the state,
   not written down: what moved, how much of it changed, and how
   much changed without moving. The last one is the failure
   nobody looks for, because a screen that quietly updates itself
   looks fine in every screenshot ever taken of it.

   Reduced motion: nothing animates, and the changed figures keep
   a static accent flag instead. That is the whole argument of
   the lesson in one accommodation — if motion was the only thing
   reporting the change, the reader who turned motion off is not
   being told, and something that is not motion has to carry it.

   Usage:
     <div data-budget-lab data-title="One refresh, eight places it could show"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const DUR = 380;
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  // Eight animatable units. `data` marks the ones that carry a figure — the
  // chrome three never change their content, which is why moving them is
  // always noise no matter how large the event was.
  const UNITS = ['title', 'dot', 'kpi1', 'kpi2', 'kpi3', 'chart', 'list', 'cta'];
  const DATA_UNITS = ['kpi1', 'kpi2', 'kpi3', 'chart', 'list'];

  const BUDGETS = {
    none: { cap: 'nothing', units: [] },
    one: { cap: 'one thing', units: ['kpi1'] },
    data: { cap: 'the data', units: DATA_UNITS },
    all: { cap: 'everything', units: UNITS },
  };

  const EVENTS = {
    one: { cap: 'one figure changed', units: ['kpi1'] },
    all: { cap: 'the whole page reloaded', units: DATA_UNITS },
  };

  const KPIS = [
    { id: 'kpi1', label: 'Revenue', prefix: '$', base: 24180, step: 900 },
    { id: 'kpi2', label: 'Signups', prefix: '', base: 1204, step: 60 },
    { id: 'kpi3', label: 'Refunds', prefix: '', base: 38, step: 9 },
  ];

  const ROWS = ['Invoice 4471 paid', 'New signup · Ridley', 'Refund issued · 2210'];

  function injectStyles() {
    if (document.getElementById('budget-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'budget-lab-styles';
    s.textContent = `
    .bd-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .bd-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .bd-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .bd-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .bd-board { padding: 1.1rem 1rem 1rem; background: var(--paper); }

    .bd-app { border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
              background: var(--paper); }
    .bd-topbar { display: flex; align-items: center; justify-content: space-between;
                 gap: 0.6rem; padding: 0.5rem 0.7rem; background: var(--paper-sunk);
                 border-bottom: 1px solid var(--rule); }
    .bd-title { font: 600 0.76rem/1.2 var(--sans); color: var(--ink); }
    .bd-right { display: flex; align-items: center; gap: 0.5rem; }
    .bd-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--good); }
    .bd-cta { border-radius: 5px; padding: 0.2rem 0.5rem; background: var(--accent-soft);
              font: 600 0.64rem/1.3 var(--sans); color: var(--ink); }

    .bd-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
               gap: 1px; background: var(--rule); border-bottom: 1px solid var(--rule); }
    .bd-kpi { padding: 0.6rem 0.7rem 0.65rem; background: var(--paper); }
    .bd-klabel { display: block; font: 600 0.6rem/1.3 var(--sans); letter-spacing: 0.1em;
                 text-transform: uppercase; color: var(--ink-faint); }
    /* Tabular figures, because the value is the thing being watched and a
       proportional 1 makes the number jitter on every refresh — which would be
       a second, uninvited animation inside a lab about counting them. */
    .bd-kval { display: block; margin-top: 0.15rem; font: 600 1.05rem/1.25 var(--sans);
               font-variant-numeric: tabular-nums; color: var(--ink); }
    .bd-kval[data-flag="1"] { color: var(--accent); }

    .bd-lower { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .bd-panel { padding: 0.6rem 0.7rem 0.7rem; background: var(--paper); }
    .bd-ptitle { margin: 0 0 0.5rem; font: 600 0.6rem/1.3 var(--sans); letter-spacing: 0.1em;
                 text-transform: uppercase; color: var(--ink-faint); }

    .bd-chart { display: flex; align-items: flex-end; gap: 0.28rem; height: 3.4rem; }
    .bd-bar { flex: 1; border-radius: 2px 2px 0 0; background: var(--accent-soft);
              transform-origin: bottom; }

    .bd-rows { display: grid; gap: 0.36rem; }
    .bd-row { display: flex; align-items: center; gap: 0.4rem;
              font: 400 0.68rem/1.3 var(--sans); color: var(--ink-soft); }
    .bd-rdot { width: 0.35rem; height: 0.35rem; border-radius: 50%; background: var(--rule);
               flex: none; }
    .bd-rtime { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--ink-faint);
                font-size: 0.64rem; }

    /* Outline, not border or shadow: it is drawn outside the box and takes no
       space, so switching the budget cannot reflow the dashboard underneath it. */
    [data-unit][data-inbudget="1"] { outline: 1px dashed var(--accent);
                                     outline-offset: 3px; border-radius: 3px; }

    .bd-legend { margin: 0.85rem 0 0; font: 400 0.68rem/1.4 var(--sans); color: var(--ink-faint); }

    /* Reserved per measured band: the verdict rewrites on every knob turn and
       runs one to five lines, so the box holds the tallest wording at each
       width. Each band starts a few px above the width where the extra line
       was measured — 547, 435, 360 and 320. */
    .bd-readwrap { display: flex; align-items: center; min-height: 4.3rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule);
                   background: var(--paper); }
    .bd-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .bd-read b { color: var(--ink); font-weight: 600; }

    .bd-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .bd-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .bd-cap { min-width: 8.2rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .bd-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .bd-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .bd-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .bd-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .bd-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 8.85rem; }

    @media (max-width: 999px) { .bd-readwrap { min-height: 5.5rem; } }
    @media (max-width: 700px) {
      .bd-ctl { align-items: flex-start; }
      .bd-cap { min-width: 100%; }
      .bd-actions { margin-left: 0; }
      .bd-state { display: none; }
    }
    @media (max-width: 560px) { .bd-lower { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 549px) { .bd-readwrap { min-height: 6.7rem; } }
    @media (max-width: 440px) { .bd-readwrap { min-height: 7.9rem; } }
    @media (max-width: 430px) { .bd-kpis { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 365px) { .bd-readwrap { min-height: 9.1rem; } }
    @media (max-width: 325px) { .bd-readwrap { min-height: 10.3rem; } }
    @media print { .bd-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="bd-ctl"><span class="bd-cap">${caption}</span>
            <div class="bd-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('bd-lab');

    let budget = 'one';
    let event = 'one';

    const vals = {};
    KPIS.forEach(k => vals[k.id] = k.base);
    let bars = [42, 58, 35, 71, 49, 63, 80];
    let times = [2, 9, 24];

    root.innerHTML = `
      <div class="bd-head">
        <strong>${root.dataset.title || 'One refresh, eight places it could show'}</strong>
        <span class="bd-state" data-state>&mdash;</span>
      </div>
      <div class="bd-board">
        <div class="bd-app">
          <div class="bd-topbar">
            <span class="bd-title" data-unit="title">Overview</span>
            <span class="bd-right">
              <span class="bd-dot" data-unit="dot"></span>
              <span class="bd-cta" data-unit="cta">Export</span>
            </span>
          </div>
          <div class="bd-kpis">
            ${KPIS.map(k => `
              <div class="bd-kpi">
                <span class="bd-klabel">${k.label}</span>
                <span class="bd-kval" data-unit="${k.id}" data-val="${k.id}">&mdash;</span>
              </div>`).join('')}
          </div>
          <div class="bd-lower">
            <section class="bd-panel">
              <h4 class="bd-ptitle">This week</h4>
              <div class="bd-chart" data-unit="chart">
                ${bars.map(() => '<span class="bd-bar"></span>').join('')}
              </div>
            </section>
            <section class="bd-panel">
              <h4 class="bd-ptitle">Activity</h4>
              <div class="bd-rows" data-unit="list">
                ${ROWS.map(r => `<span class="bd-row"><span class="bd-rdot"></span>${r}
                   <span class="bd-rtime" data-time>&mdash;</span></span>`).join('')}
              </div>
            </section>
          </div>
        </div>
        <p class="bd-legend">Dashed outline = in the motion budget. Everything else updates
          without moving.</p>
      </div>
      <div class="bd-readwrap"><p class="bd-read" data-read aria-live="polite"></p></div>
      <div class="bd-foot">
        ${seg('event', 'What happened', [['one', 'one figure changed'], ['all', 'the whole page reloaded']], 'one')}
        ${seg('budget', 'What is allowed to move', [['none', 'nothing'], ['one', 'one thing'], ['data', 'the data'], ['all', 'everything']], 'one')}
        <div class="bd-actions"><button class="btn primary" type="button" data-play>Refresh the data</button></div>
      </div>`;

    const el = {};
    UNITS.forEach(u => el[u] = root.querySelector(`[data-unit="${u}"]`));
    const barEls = [...root.querySelectorAll('.bd-bar')];
    const timeEls = [...root.querySelectorAll('[data-time]')];

    function paint() {
      KPIS.forEach(k => {
        const v = vals[k.id];
        root.querySelector(`[data-val="${k.id}"]`).textContent =
          k.prefix + v.toLocaleString('en-US');
      });
      barEls.forEach((b, i) => b.style.height = bars[i] + '%');
      timeEls.forEach((t, i) => t.textContent = times[i] + 'm');
    }

    // Each unit's motion is the one that suits the thing it is: a figure rolls
    // up, bars grow from their base, rows arrive in sequence. The chrome three
    // get flourishes, which is the point — a flourish is what you buy with the
    // budget after the reporting is done.
    function play(unit, prevBars) {
      const node = el[unit];
      if (!node) return;
      if (unit === 'chart') {
        barEls.forEach((b, i) => {
          const from = prevBars[i] / bars[i];
          b.getAnimations().forEach(a => a.cancel());
          b.animate([{ transform: `scaleY(${from})` }, { transform: 'scaleY(1)' }],
            { duration: DUR + 120, easing: EASE });
        });
        return;
      }
      if (unit === 'list') {
        [...node.children].forEach((r, i) => {
          r.getAnimations().forEach(a => a.cancel());
          r.animate([{ opacity: 0, transform: 'translateY(0.3rem)' }, { opacity: 1, transform: 'none' }],
            { duration: DUR, delay: i * 70, easing: EASE, fill: 'backwards' });
        });
        return;
      }
      node.getAnimations().forEach(a => a.cancel());
      if (unit === 'dot') {
        node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.9)', opacity: 0.5 },
                      { transform: 'scale(1)' }], { duration: DUR + 220, easing: 'ease-out' });
      } else if (unit === 'cta') {
        node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' },
                      { transform: 'scale(1)' }], { duration: DUR + 120, easing: EASE });
      } else {
        node.animate([{ opacity: 0, transform: 'translateY(0.35rem)' },
                      { opacity: 1, transform: 'none' }], { duration: DUR, easing: EASE });
      }
    }

    function refresh() {
      const prevBars = bars.slice();
      const changed = EVENTS[event].units;

      if (changed.includes('kpi1')) vals.kpi1 += Math.round(Math.random() * KPIS[0].step) + 120;
      if (changed.includes('kpi2')) vals.kpi2 += Math.round(Math.random() * KPIS[1].step) + 8;
      if (changed.includes('kpi3')) vals.kpi3 += Math.round(Math.random() * KPIS[2].step) - 3;
      if (changed.includes('chart')) bars = bars.map(() => 28 + Math.round(Math.random() * 58));
      if (changed.includes('list')) times = times.map(t => Math.max(1, t - 1 - Math.round(Math.random() * 2)));

      paint();

      // Reduced motion: the flag is the substitute channel, and it is only here
      // because it has to be. If the change was only ever reported by movement,
      // then with movement off the reader is simply not told — so the figure
      // that changed keeps a static accent until the next refresh.
      KPIS.forEach(k => {
        const v = root.querySelector(`[data-val="${k.id}"]`);
        v.dataset.flag = (reduced() && changed.includes(k.id)) ? '1' : '0';
      });

      if (!reduced()) BUDGETS[budget].units.forEach(u => play(u, prevBars));
      report();
    }

    // The three numbers are counted off the two settings rather than written
    // down per combination, so a new unit or a new budget cannot leave a stale
    // verdict behind claiming to have counted something.
    function counts() {
      const moving = BUDGETS[budget].units;
      const changed = EVENTS[event].units;
      const signal = moving.filter(u => changed.includes(u));
      const noise = moving.filter(u => !changed.includes(u));
      const silent = changed.filter(u => !moving.includes(u));
      return { moving, signal, noise, silent };
    }

    function report() {
      const c = counts();
      root.querySelectorAll('[data-unit]').forEach(n =>
        n.dataset.inbudget = BUDGETS[budget].units.includes(n.dataset.unit) ? '1' : '0');

      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${c.moving.length} moving · ${c.signal.length} signal · ${c.noise.length} noise`;

      const read = root.querySelector('[data-read]');
      const n = c.moving.length, s = c.signal.length, x = c.noise.length, q = c.silent.length;

      if (reduced()) {
        read.innerHTML = `<b>Nothing moved, because you have asked for less motion.</b> ` +
          `${q + s} figure${q + s === 1 ? '' : 's'} changed and the changed ones are flagged in ` +
          `colour instead. A budget of ${n} buys you nothing here &mdash; which is the test: if ` +
          `the motion was the only thing reporting the change, this reader was never told.`;
      } else if (n === 0) {
        read.innerHTML = `<b>Nothing moved, and ${q} thing${q === 1 ? '' : 's'} changed.</b> ` +
          `The screen updated behind the reader's back. This is the cheapest option and it is ` +
          `sometimes right &mdash; but only when the reader caused the change themselves and is ` +
          `already looking at it.`;
      } else if (q > 0 && x === 0) {
        read.innerHTML = `<b>${n} moved, and ${q} more changed without moving.</b> The motion is ` +
          `under-reporting: it points at one thing when ${s + q} were updated, so the reader ` +
          `trusts the highlight and misses the rest.`;
      } else if (x === 0) {
        read.innerHTML = `<b>${n} of 8 moved, and every one of them changed.</b> Nothing was ` +
          `competing with the news. This is what a budget is for &mdash; not spending less, but ` +
          `spending it all on the thing that happened.`;
      } else {
        read.innerHTML = `<b>${n} moved; ${s} of them changed.</b> The other ${x} claimed the ` +
          `reader's attention to report nothing, so the one thing that <i>is</i> new has to be ` +
          `found among ${n} things that all look new. That is <b>busy</b>: not too much motion, ` +
          `too many claims.`;
      }
    }

    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          apply(btn.dataset.value);
        }));
    }
    // Both knobs refresh on the spot. A budget you cannot see spent is a
    // preference pane, and the whole claim here is about what the screen looks
    // like in the second after something happens.
    knob('event', (v) => { event = v; refresh(); });
    knob('budget', (v) => { budget = v; refresh(); });
    root.querySelector('[data-play]').addEventListener('click', refresh);

    paint();
    report();
  }

  document.querySelectorAll('[data-budget-lab]').forEach(mount);
})();
