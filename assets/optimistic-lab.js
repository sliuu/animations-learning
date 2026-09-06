/* ============================================================
   optimistic-lab.js — the same save, twice, side by side: one
   pane waits for the server, the other assumes it worked.

   Why this exists: optimism is usually sold on the happy path,
   where it is obviously free. The design work is entirely on
   the unhappy path, so the lab has a switch that makes the
   request fail — and the argument is carried by the failure
   with the casualty on screen, not by a paragraph promising
   that rollback is hard.

   Both panes are driven by one button, because the interesting
   comparison is not "how long did each take" but "what was on
   screen at the same instant". Run them apart and the memory
   does the work instead of the eyes.

   The pending dot is the defensible middle: the row is there
   immediately, but it is marked as not-yet-confirmed. Plenty
   of products skip it and show the row as settled. The lesson
   argues about that trade; the lab shows the honest version so
   the failure case is a fair fight rather than a straw man.

   Reduced motion: the row still appears and, on failure, still
   leaves — that is state, and removing it would remove the
   lesson. What goes is the travel and the toast's slide. The
   rollback is meant to be noticed either way, so it keeps a
   colour change when it can no longer have a movement.

   Usage:
     <div data-optimistic-lab data-title="Save it twice"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const SPEEDS = [
    { ms: 400, label: '0.4s' },
    { ms: 2000, label: '2s' },
  ];

  function injectStyles() {
    if (document.getElementById('optimistic-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'optimistic-lab-styles';
    s.textContent = `
    .op { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) {
      .op { width: calc(100% + 13rem); margin-left: -6.5rem; }
      /* Full-bleed, the verdicts fit in one line fewer. */
      .op-readwrap { min-height: 5.6rem; }
    }

    .op-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .op-board { display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
                background: var(--rule); }
    .op-pane { position: relative; background: var(--paper); padding: 0.85rem 1rem 1rem; }
    .op-name { margin: 0 0 0.7rem; font: 600 0.64rem/1.3 var(--sans);
               letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }

    /* Three rows of space, always. The list is the thing under test, so it is
       not allowed to change the height of the pane it sits in. */
    .op-list { list-style: none; margin: 0; padding: 0; height: 6.6rem;
               display: flex; flex-direction: column; gap: 0.3rem; }
    /* flex: none — a column flex item still shrinks, and three rows in a
       three-row list came out 7px shorter than two, so the rows changed size
       depending on how many there were. The row's height is part of what the
       lab is showing; it does not get to depend on the outcome. */
    .op-row { display: flex; align-items: center; gap: 0.55rem; flex: none; height: 2rem;
              padding: 0 0.6rem; border: 1px solid var(--rule); border-radius: 7px;
              background: var(--paper-sunk);
              font: 500 0.82rem/1.3 var(--sans); color: var(--ink); }
    .op-dot { flex: none; width: 0.5rem; height: 0.5rem; border-radius: 50%;
              background: var(--ink-faint); }

    /* Optimistic and not yet confirmed: present, usable, and visibly
       provisional. A hollow dot rather than a spinner, because a spinner in
       the row would put the wait back on screen and undo the point. */
    .op-row.is-pending { color: var(--ink-soft); border-style: dashed; }
    .op-row.is-pending .op-dot { background: none; box-shadow: inset 0 0 0 1.5px var(--ink-faint); }

    .op-row.is-new { animation: op-in 260ms var(--ease-out-strong) both; }
    @keyframes op-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
    .op-row.is-out { animation: op-out 300ms var(--ease-in-out-strong) both; }
    @keyframes op-out { from { opacity: 1; } to { opacity: 0; transform: translateX(1.4rem); } }
    .op-row.is-out { border-color: var(--bad); color: var(--bad); }

    /* Two lines' worth: the rollback message is longer than the success one,
       and an unreserved second line moved the pane the moment she chose the
       failure path. */
    .op-status { display: flex; align-items: center; gap: 0.5rem;
                 min-height: 2.9rem; margin: 0.7rem 0 0; padding-top: 0.6rem;
                 border-top: 1px dotted var(--rule);
                 font: 400 0.8rem/1.4 var(--sans); color: var(--ink-soft); }
    .op-status.is-bad { color: var(--bad); }
    .op-status.is-good { color: var(--good); }
    .op-spin { flex: none; width: 0.9rem; height: 0.9rem; border-radius: 50%;
               border: 2px solid var(--rule); border-top-color: var(--ink-faint);
               animation: op-turn 900ms linear infinite; }
    @keyframes op-turn { to { transform: rotate(360deg); } }

    /* Reserved to the tallest verdict at this width — see the same note in
       wait-lab.js. The failure verdict is a line longer than the success one,
       so without this the pane jumps exactly when she flips to "fails". */
    /* The reservation lives on the wrapper and the text is centred inside it,
       so the spare lines read as room around the verdict rather than as a hole
       under it on the widths where the verdict runs short. */
    .op-readwrap { display: flex; align-items: center; min-height: 6.9rem;
                  padding: 0.85rem 1.1rem; border-top: 1px solid var(--rule);
                  background: var(--paper); }
    .op-read { margin: 0; font: 400 0.83rem/1.5 var(--sans); color: var(--ink-soft); }
    .op-read b { color: var(--ink); font-weight: 600; }

    .op-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 0.9rem 1.1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); font-family: var(--sans); }
    .op-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .op-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .op-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .op-seg button:hover { border-color: var(--ink-faint); }
    .op-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .op-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media (max-width: 640px) {
      .op-board { grid-template-columns: 1fr; }
      .op-readwrap { min-height: 9.4rem; }
    }

    @media (prefers-reduced-motion: reduce) {
      /* The row arriving and the row being taken back are both state changes,
         so they stay. Only the travel goes — and the rollback keeps its red,
         which is now the whole of how it announces itself. */
      .op-row.is-new { animation: none; }
      .op-row.is-out { animation: op-fade 300ms linear both; }
      @keyframes op-fade { to { opacity: 0; } }
    }

    @media print { .op-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const BASE = `
    <li class="op-row"><span class="op-dot"></span>Q3 launch checklist</li>
    <li class="op-row"><span class="op-dot"></span>Pricing page teardown</li>`;

  const NEW_ITEM = 'Motion audit — nav';

  function build(root) {
    const id = 'op' + (++uid);
    const title = root.dataset.title || 'Save it twice';
    let ms = 400;
    let ok = true;
    let run = 0;
    const timers = [];

    root.classList.add('op');
    root.innerHTML = `
      <div class="op-head"><span>${title}</span><span>one button, both panes</span></div>
      <div class="op-board">
        <section class="op-pane">
          <p class="op-name">Waits for the server</p>
          <ul class="op-list" data-list="wait">${BASE}</ul>
          <p class="op-status" data-status="wait">Press <b>Save to both</b>.</p>
        </section>
        <section class="op-pane">
          <p class="op-name">Assumes it worked</p>
          <ul class="op-list" data-list="opt">${BASE}</ul>
          <p class="op-status" data-status="opt">Press <b>Save to both</b>.</p>
        </section>
      </div>
      <div class="op-readwrap">
        <p class="op-read" data-read aria-live="polite">Both panes save the same thing at the same
        moment. Run it once with the request succeeding, then set it to <b>fails</b> and run it
        again — the second one is where the design work is.</p></div>
      <div class="op-foot">
        <button class="btn primary" type="button" data-go>Save to both</button>
        <span class="op-cap">The server takes</span>
        <div class="op-seg" data-seg="ms" role="group" aria-label="Server latency">
          ${SPEEDS.map((s) => `<button type="button" data-v="${s.ms}">${s.label}</button>`).join('')}
        </div>
        <span class="op-cap">and the request</span>
        <div class="op-seg" data-seg="ok" role="group" aria-label="Request outcome">
          <button type="button" data-v="1">succeeds</button>
          <button type="button" data-v="0">fails</button>
        </div>
      </div>
    `;

    const lists = {
      wait: root.querySelector('[data-list="wait"]'),
      opt: root.querySelector('[data-list="opt"]'),
    };
    const status = {
      wait: root.querySelector('[data-status="wait"]'),
      opt: root.querySelector('[data-status="opt"]'),
    };
    const read = root.querySelector('[data-read]');

    function paintSeg() {
      root.querySelectorAll('[data-seg="ms"] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(Number(b.dataset.v) === ms)));
      root.querySelectorAll('[data-seg="ok"] button').forEach((b) =>
        b.setAttribute('aria-pressed', String((b.dataset.v === '1') === ok)));
    }

    function say(which, text, tone) {
      status[which].innerHTML = text;
      status[which].className = 'op-status' + (tone ? ' is-' + tone : '');
    }

    function reset() {
      run += 1;
      while (timers.length) clearTimeout(timers.pop());
      Object.values(lists).forEach((el) => { el.innerHTML = BASE; });
      say('wait', 'Press <b>Save to both</b>.');
      say('opt', 'Press <b>Save to both</b>.');
    }

    function row(cls) {
      const li = document.createElement('li');
      li.className = 'op-row ' + cls;
      li.innerHTML = `<span class="op-dot"></span>${NEW_ITEM}`;
      return li;
    }

    function start() {
      reset();
      const mine = run;
      const seconds = (ms / 1000).toFixed(1).replace(/\.0$/, '');

      say('wait', '<span class="op-spin"></span> Saving…');

      /* The optimistic pane commits before it has any right to. The dashed
         border and hollow dot are the only admission that it might be wrong. */
      lists.opt.appendChild(row('is-pending is-new'));
      say('opt', 'Saved.', 'good');

      timers.push(setTimeout(() => {
        if (mine !== run) return;
        const pending = lists.opt.querySelector('.is-pending');

        if (ok) {
          lists.wait.appendChild(row('is-new'));
          say('wait', 'Saved.', 'good');
          pending.classList.remove('is-pending');
          say('opt', 'Confirmed.', 'good');
          read.innerHTML = `Both rows are there. The right-hand pane put it on screen
            <b>${seconds}s</b> earlier and was never wrong — that is the whole case for optimism,
            and on the happy path it is a strong one. Now set the request to <b>fails</b>.`;
          return;
        }

        say('wait', 'Couldn’t save. Nothing was added.', 'bad');
        pending.classList.remove('is-pending');
        pending.classList.add('is-out');
        say('opt', 'Couldn’t save. The row has been taken back.', 'bad');
        timers.push(setTimeout(() => { if (mine === run) pending.remove(); }, 300));
        read.innerHTML = `The left pane cost you <b>${seconds}s</b> and then told you the truth:
          nothing was added, and nothing ever looked like it had been. The right pane showed you a
          row you did not get and then removed it — <b>the interface changed twice for one
          action</b>, and the second change is the one you have to design, name and make
          impossible to miss.`;
      }, ms));
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-go]')) { start(); return; }
      /* Both knobs re-run on the spot: the thing they change is only ever
         visible during a run, so a knob that waited for the next press would
         give no feedback at all at the moment it was turned. */
      const msBtn = e.target.closest('[data-seg="ms"] button');
      if (msBtn) { ms = Number(msBtn.dataset.v); paintSeg(); start(); return; }
      const okBtn = e.target.closest('[data-seg="ok"] button');
      if (okBtn) { ok = okBtn.dataset.v === '1'; paintSeg(); start(); }
    });

    paintSeg();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-optimistic-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
