/* ============================================================
   repeat-lab.js — the same duration, on something seen once and
   on something seen all day.

   The first lab is about how many things move at once. This one
   is about the multiplier everybody forgets: an animation's real
   cost is its length times how often it plays, and those two
   numbers are never discussed in the same meeting. A duration is
   agreed on while looking at a hero, and then applied to a
   control the reader touches forty times before lunch.

   Both panes run the same duration at the same time, on purpose.
   The claim is about a feeling — that 600ms is generous in one
   place and a queue in the other — and a feeling cannot be
   taught by showing one thing and then the other.

   The arithmetic is not a lookup table: the seconds come from
   the duration the animation is actually using and the frequency
   the reader picked, so the number on screen is the number being
   spent.

   Reduced motion: neither frame animates, and the verdict says
   so plainly rather than pretending. That reader's bill is zero,
   which is a real and slightly awkward point — the tax only
   exists for people who are being shown the motion, and the
   interaction still has to make sense without it.

   Usage:
     <div data-repeat-lab data-title="The same 600ms, twice"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const CYCLES = 6;       // how many opens the demo actually plays
  const DWELL = 200;      // pause between them, so it reads as use rather than a loop

  function injectStyles() {
    if (document.getElementById('repeat-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'repeat-lab-styles';
    s.textContent = `
    .rp-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .rp-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .rp-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .rp-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .rp-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .rp-cell { display: flex; flex-direction: column; padding: 1rem 1rem 1.1rem;
               background: var(--paper); }
    .rp-name { margin: 0 0 0.65rem; font: 600 0.66rem/1.3 var(--sans); letter-spacing: 0.12em;
               text-transform: uppercase; color: var(--ink-faint); }
    .rp-name em { font-style: normal; color: var(--accent); }

    /* The frame is a fixed size and the drawer is drawn over it. Nothing here
       reflows, so the six repeats cannot move the page under her while she is
       trying to feel how long they take. */
    .rp-frame { position: relative; overflow: hidden; height: 9.4rem;
                border: 1px solid var(--rule); border-radius: 7px; background: var(--paper); }
    .rp-bar { display: flex; align-items: center; justify-content: space-between;
              padding: 0.4rem 0.55rem; background: var(--paper-sunk);
              border-bottom: 1px solid var(--rule); }
    .rp-btitle { font: 600 0.7rem/1.2 var(--sans); color: var(--ink); }
    .rp-chip { border-radius: 4px; padding: 0.12rem 0.4rem; background: var(--rule);
               font: 600 0.58rem/1.3 var(--sans); color: var(--ink-soft); }

    .rp-body { padding: 0.6rem; }
    .rp-card { border: 1px solid var(--rule); border-radius: 6px; padding: 0.55rem 0.6rem 0.65rem;
               background: var(--paper); }
    /* display:block on both: these are spans in a block parent, and an inline
       box ignores height — it would paint as nothing at all. */
    .rp-h { display: block; height: 0.5rem; width: 58%; border-radius: 3px;
            background: var(--accent-soft); }
    .rp-l { display: block; height: 0.38rem; margin-top: 0.34rem; border-radius: 3px;
            background: var(--paper-sunk); }
    .rp-l.a { width: 92%; } .rp-l.b { width: 74%; } .rp-l.c { width: 84%; }

    .rp-rows { display: grid; gap: 0.34rem; padding: 0.6rem; }
    .rp-row { display: flex; align-items: center; gap: 0.45rem; padding: 0.3rem 0.4rem;
              border: 1px solid var(--rule); border-radius: 5px;
              font: 400 0.66rem/1.3 var(--sans); color: var(--ink-soft); }
    .rp-row[data-live="1"] { border-color: var(--accent); color: var(--ink); }
    .rp-rdot { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--rule); flex: none; }
    .rp-row[data-live="1"] .rp-rdot { background: var(--accent); }

    .rp-drawer { position: absolute; inset: 0 0 0 auto; width: 66%; padding: 0.6rem;
                 background: var(--paper); border-left: 1px solid var(--rule);
                 box-shadow: -8px 0 20px -14px rgba(0,0,0,0.5); }
    .rp-dtitle { margin: 0 0 0.5rem; font: 600 0.66rem/1.3 var(--sans); color: var(--ink); }

    /* Reserved per measured band: the note under each pane names the frequency,
       so it rewrites on every turn of that knob. Measured wrap widths are 390
       and 320 for the note, 547, 450, 395 and 340 for the verdict; each band
       starts a few px above the width where the extra line appeared. */
    .rp-note { margin: 0.6rem 0 0; min-height: 3.3rem;
               font: 400 0.7rem/1.45 var(--sans); color: var(--ink-soft); }
    .rp-note b { color: var(--ink); font-weight: 600; }

    .rp-readwrap { display: flex; align-items: center; min-height: 5.5rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .rp-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .rp-read b { color: var(--ink); font-weight: 600; }

    .rp-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .rp-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .rp-cap { min-width: 8.2rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .rp-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .rp-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .rp-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .rp-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .rp-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 8.85rem; }
    .rp-actions .btn[disabled] { opacity: 0.5; cursor: default; }

    @media (max-width: 999px) { .rp-readwrap { min-height: 6.7rem; } .rp-note { min-height: 4.3rem; } }
    @media (max-width: 700px) {
      .rp-board { grid-template-columns: minmax(0, 1fr); }
      .rp-note { min-height: 2.3rem; }
      .rp-ctl { align-items: flex-start; }
      .rp-cap { min-width: 100%; }
      .rp-actions { margin-left: 0; }
      .rp-state { display: none; }
    }
    @media (max-width: 549px) { .rp-note { min-height: 3.3rem; } .rp-readwrap { min-height: 7.9rem; } }
    @media (max-width: 455px) { .rp-readwrap { min-height: 9.1rem; } }
    @media (max-width: 400px) { .rp-readwrap { min-height: 10.3rem; } }
    @media (max-width: 395px) { .rp-note { min-height: 4.3rem; } }
    @media (max-width: 345px) { .rp-readwrap { min-height: 11.5rem; } }
    @media (max-width: 325px) { .rp-note { min-height: 5.3rem; } }
    @media print { .rp-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="rp-ctl"><span class="rp-cap">${caption}</span>
            <div class="rp-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('rp-lab');

    let dur = 600;
    let freq = 40;
    let runId = 0;

    root.innerHTML = `
      <div class="rp-head">
        <strong>${root.dataset.title || 'The same duration, twice'}</strong>
        <span class="rp-state" data-state>&mdash;</span>
      </div>
      <div class="rp-board">
        <section class="rp-cell">
          <h3 class="rp-name">Seen <em>once</em> &middot; the page arriving</h3>
          <div class="rp-frame">
            <div class="rp-bar"><span class="rp-btitle">Reports</span><span class="rp-chip">new</span></div>
            <div class="rp-body">
              <div class="rp-card" data-hero>
                <span class="rp-h"></span>
                <span class="rp-l a"></span><span class="rp-l b"></span><span class="rp-l c"></span>
              </div>
            </div>
          </div>
          <p class="rp-note" data-note-once></p>
        </section>
        <section class="rp-cell">
          <h3 class="rp-name">Seen <em>all day</em> &middot; the panel you open</h3>
          <div class="rp-frame">
            <div class="rp-bar"><span class="rp-btitle">Reports</span><span class="rp-chip" data-count>0 of ${CYCLES}</span></div>
            <div class="rp-rows">
              <span class="rp-row"><span class="rp-rdot"></span>Invoice 4471</span>
              <span class="rp-row" data-live="1"><span class="rp-rdot"></span>Invoice 4472</span>
              <span class="rp-row"><span class="rp-rdot"></span>Invoice 4473</span>
            </div>
            <aside class="rp-drawer" data-drawer hidden>
              <h4 class="rp-dtitle">Invoice 4472</h4>
              <span class="rp-l a"></span><span class="rp-l b"></span><span class="rp-l c"></span>
            </aside>
          </div>
          <p class="rp-note" data-note-many></p>
        </section>
      </div>
      <div class="rp-readwrap"><p class="rp-read" data-read aria-live="polite"></p></div>
      <div class="rp-foot">
        ${seg('dur', 'How long it takes', [['140', '140ms'], ['320', '320ms'], ['600', '600ms']], '600')}
        ${seg('freq', 'How often you open it', [['8', '8&times; a day'], ['40', '40&times; a day'], ['200', '200&times; a day']], '40')}
        <div class="rp-actions"><button class="btn primary" type="button" data-play>Use it six times</button></div>
      </div>`;

    const hero = root.querySelector('[data-hero]');
    const drawer = root.querySelector('[data-drawer]');
    const counter = root.querySelector('[data-count]');
    const playBtn = root.querySelector('[data-play]');

    // `hidden` rather than display:none in a stylesheet, so the drawer is out of
    // the accessibility tree between opens as well as out of sight.
    drawer.hidden = true;

    function playHero() {
      if (reduced()) return;
      hero.getAnimations().forEach(a => a.cancel());
      hero.animate([{ opacity: 0, transform: 'translateY(0.6rem)' }, { opacity: 1, transform: 'none' }],
        { duration: dur, easing: EASE });
    }

    function openDrawer() {
      drawer.hidden = false;
      if (reduced()) return Promise.resolve();
      drawer.getAnimations().forEach(a => a.cancel());
      return drawer.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }],
        { duration: dur, easing: EASE }).finished.catch(() => {});
    }

    function closeDrawer() {
      if (reduced()) { drawer.hidden = true; return Promise.resolve(); }
      drawer.getAnimations().forEach(a => a.cancel());
      return drawer.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }],
        { duration: dur, easing: EASE }).finished.then(() => { drawer.hidden = true; }, () => {});
    }

    const wait = ms => new Promise(r => setTimeout(r, ms));

    // A run in progress is abandoned rather than queued or ignored: turning a
    // knob half way through six repeats has to answer immediately with the new
    // setting, not finish arguing the old one first.
    async function run() {
      const mine = ++runId;
      playBtn.disabled = true;
      drawer.hidden = true;
      counter.textContent = `0 of ${CYCLES}`;
      playHero();
      for (let i = 0; i < CYCLES; i += 1) {
        await openDrawer();
        if (mine !== runId) return;
        counter.textContent = `${i + 1} of ${CYCLES}`;
        await wait(DWELL);
        if (mine !== runId) return;
        await closeDrawer();
        if (mine !== runId) return;
        await wait(DWELL);
        if (mine !== runId) return;
      }
      playBtn.disabled = false;
    }

    function secs(ms) {
      const v = ms / 1000;
      return v >= 60 ? `${Math.round(v / 6) / 10} minutes` : `${Math.round(v * 10) / 10} seconds`;
    }

    function report() {
      // One open and one close per use, both at the duration in the knob — the
      // bill is arithmetic on the number the animation is actually running at.
      const perUse = dur * 2;
      const daily = perUse * freq;

      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${dur}ms · ${freq} opens + ${freq} closes = ${secs(daily)} a day`;

      root.querySelector('[data-note-once]').innerHTML = dur <= 140
        ? `One arrival, <b>${dur}ms</b>. At this length the page is simply there — no arrival was ` +
          `staged, and nothing was gained by the saving, because there was only ever one of these.`
        : `One arrival, <b>${dur}ms</b>, costing <b>${secs(dur)}</b> of the reader's day in total. ` +
          `This is the cheapest place in the product to be generous, and the one people argue ` +
          `hardest about.`;

      root.querySelector('[data-note-many]').innerHTML =
        `The same <b>${dur}ms</b>, ${freq} times over, plus ${freq} closes: ` +
        `<b>${secs(daily)} a day</b> spent waiting for this panel. Nothing about the animation ` +
        `changed &mdash; only how often you meet it.`;

      const read = root.querySelector('[data-read]');
      if (reduced()) {
        read.innerHTML = `<b>Your bill is zero</b>, because you have motion turned off and neither ` +
          `frame is animating. Worth sitting with: the tax only exists for the readers who are ` +
          `shown the motion, and the panel still opens, still lands where it should, and is still ` +
          `perfectly usable without it. If an interaction only makes sense once the animation ` +
          `plays, it was never the animation that was the problem.`;
      } else if (daily <= 3000) {
        read.innerHTML = `<b>${secs(daily)} a day</b> on the right, ${secs(dur)} on the left. Cheap ` +
          `enough that nobody will ever raise it &mdash; which is the correct outcome for a control ` +
          `touched all day. Notice what the same setting did to the arrival on the left: it took it ` +
          `away, in the one place where a little length would have cost almost nothing.`;
      } else if (daily <= 12000) {
        read.innerHTML = `<b>${secs(daily)} a day</b> on the right against ${secs(dur)} on the left, ` +
          `from one setting. This is the band where it depends: defensible if the motion tells the ` +
          `reader something every single time, and a slow interface if it is only pleasant.`;
      } else {
        read.innerHTML = `<b>${secs(daily)} a day</b> on the right &mdash; against ${secs(dur)} on ` +
          `the left, for the identical animation. The hero is a first impression and you will pay ` +
          `for it once. The panel is a queue you join ${freq} times before going home. Same taste, ` +
          `same easing, same defence in the review; ${Math.round(daily / dur)}&times; the bill.`;
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
    // Both knobs re-run the whole thing. The duration knob obviously has to —
    // and so does the frequency one, because "40 times a day" is a number until
    // you have sat through six of them, and the point of the lab is the sitting.
    knob('dur', (v) => { dur = +v; report(); run(); });
    knob('freq', (v) => { freq = +v; report(); run(); });
    playBtn.addEventListener('click', run);

    report();
  }

  document.querySelectorAll('[data-repeat-lab]').forEach(mount);
})();
