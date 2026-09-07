/* ============================================================
   spec-lab.js — the handoff, and the three kinds of thing a
   static spec cannot carry.

   A motion spec is a good artifact. Duration, easing, distance,
   property, the reduced-motion rule: all of that survives being
   written down, and writing it down is most of the job. What
   this lab is for is the remainder — the fields where the spec
   is silent, or worse, confidently wrong.

   Three specimens, deliberately three *different* kinds of
   silence rather than three examples of one:

     1. The drawer — silent about STATE. A frame cannot draw
        "and if she changes her mind at 40%", because there is
        no 40% in a spec. Both panes run the same numbers; the
        right one is the naive build of exactly what was
        written, and it snaps.
     2. The list — silent about DATA. The stagger is correct,
        the spec is correct, and at 40 rows the screen is wrong,
        because the spec was measured against a mock with five.
     3. The header — the spec has a Duration field and the
        field is meaningless, because the clock is the
        scrollbar. This is the dangerous one: not a gap but a
        filled-in number that everyone downstream believes.

   The spec card is generated from the same data that drives the
   demo, so it cannot drift from what is on screen — which is
   the one property a real spec never has.

   Reduced motion: the demos hold still and the card gains its
   honest verdict. Note that the reduced-motion row is marked
   `spec` in all three: it is a design decision, it belongs in
   the handoff, and 0009 is the lesson that argues why.

   Usage:
     <div data-spec-lab data-title="What the spec can say"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const DRAWER_MS = 320;
  const ITEM_MS = 200;
  const STAGGER_MS = 60;

  // rows: [field, value, source, reason]
  //   source 'spec'  — writes down cleanly, hand it over
  //   source 'code'  — only exists once something runs
  //   source 'wrong' — the field is filled in and means nothing
  const SPECS = {
    drawer: {
      name: 'The settings drawer',
      lead: 'Two builds of one spec. Both slide 320ms ease-out from the right edge, because that ' +
            'is what the handoff said. Open them and change your mind half way.',
      rows: [
        ['Property', 'transform: translateX', 'spec'],
        ['Distance', '100%, from the right edge', 'spec'],
        ['Duration', '320ms', 'spec'],
        ['Easing', 'ease-out, standard', 'spec'],
        ['Reduced motion', 'no slide; appears in place', 'spec'],
        ['Interruption', 'reverse from wherever it is', 'code',
         'A frame cannot draw &ldquo;and if she changes her mind at 40%&rdquo;, because a spec has no 40%.'],
        ['What starts it', 'the row, Escape, the scrim', 'code',
         'Which events open and close it is behaviour, not appearance &mdash; and it is where the keyboard work lives.'],
      ],
    },
    list: {
      name: 'The results list',
      lead: 'The spec is correct: each row fades up over 200ms, 60ms apart. It was written against ' +
            'a mock with five rows. Production has as many rows as the query returns.',
      rows: [
        ['Property', 'opacity + transform: translateY', 'spec'],
        ['Distance', '8px up', 'spec'],
        ['Duration', '200ms per row', 'spec'],
        ['Stagger', '60ms between rows, ease-out', 'spec'],
        ['Reduced motion', 'all rows at once, no rise', 'spec'],
        ['How many rows', 'whatever the query returned', 'code',
         'The one number that sets the total is the one number a design file never has.'],
        ['The cap', 'stop staggering after row 8', 'code',
         'Every real stagger needs a ceiling, and the ceiling is invented at build time by whoever notices.'],
      ],
    },
    header: {
      name: 'The header, on scroll',
      lead: 'The header condenses as the page moves. Scrub it &mdash; forwards, then backwards, ' +
            'then stop in the middle and leave it there.',
      rows: [
        ['Property', 'height + opacity + scale', 'spec'],
        ['Distance', '5rem tall down to 2.6rem', 'spec'],
        ['Range', 'over the first 180px of scroll', 'spec'],
        ['Reduced motion', 'condense instantly at 90px', 'spec'],
        ['Duration', '300ms', 'wrong',
         'There is no duration here. The clock is the scrollbar, and the reader owns it.'],
        ['Easing', 'ease-out', 'wrong',
         'A curve reshapes time, and there is no time here to reshape. The scroll wheel says otherwise.'],
        ['Where it lands', 'anywhere between the two, held', 'code',
         'A timed animation has two designed states. This one has every state in between.'],
      ],
    },
  };

  function injectStyles() {
    if (document.getElementById('spec-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'spec-lab-styles';
    s.textContent = `
    .hd-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .hd-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .hd-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .hd-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    /* Reserved to the tallest specimen per band, because switching specimens
       must not move the controls out from under her finger. The three sheets
       are deliberately seven rows each so most of the difference is already
       gone; what is left is the header's longer reasons. Measured maxima:
       407px above 1100, 449px from 1100 down, 720px once the panes stack. */
    .hd-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 21rem);
                gap: 1px; background: var(--rule); min-height: 26.4rem; }
    .hd-pane { background: var(--paper); padding: 0.9rem 1rem 1rem; min-width: 0; }
    .hd-pname { margin: 0 0 0.55rem; font: 600 0.66rem/1.3 var(--sans); letter-spacing: 0.12em;
                text-transform: uppercase; color: var(--ink-faint); }
    /* Reserved per specimen: the lead rewrites on every switch and the two
       panes must not step up and down as it does. */
    .hd-lead { margin: 0 0 0.7rem; min-height: 3.9rem;
               font: 400 0.72rem/1.5 var(--sans); color: var(--ink-soft); }

    /* ----- shared stage furniture ----- */
    .hd-frames { display: grid; gap: 0.55rem; grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
    .hd-frames.one { grid-template-columns: minmax(0, 1fr); }
    .hd-fwrap { min-width: 0; }
    .hd-flabel { display: block; min-height: 1.75rem; margin: 0 0 0.3rem;
                 font: 600 0.62rem/1.3 var(--sans);
                 letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
    .hd-flabel em { font-style: normal; color: var(--accent); }
    .hd-flabel em.bad { color: var(--bad); }
    .hd-frame { position: relative; overflow: hidden; height: 12.5rem;
                border: 1px solid var(--rule); border-radius: 7px; background: var(--paper); }

    .hd-bar { display: flex; align-items: center; justify-content: space-between;
              padding: 0.4rem 0.55rem; background: var(--paper-sunk);
              border-bottom: 1px solid var(--rule); }
    .hd-btitle { font: 600 0.68rem/1.2 var(--sans); color: var(--ink); }
    .hd-chip { border-radius: 4px; padding: 0.1rem 0.36rem; background: var(--rule);
               font: 600 0.56rem/1.35 var(--sans); color: var(--ink-soft); }
    .hd-rows { display: grid; gap: 0.3rem; padding: 0.5rem; }
    .hd-row { height: 1.2rem; border: 1px solid var(--rule); border-radius: 5px;
              background: var(--paper); }

    .hd-drawer { position: absolute; inset: 0 0 0 auto; width: 62%; padding: 0.6rem;
                 background: var(--paper); border-left: 1px solid var(--rule);
                 box-shadow: -8px 0 20px -14px rgba(0,0,0,0.5);
                 transform: translateX(100%); }
    .hd-dtitle { margin: 0 0 0.45rem; font: 600 0.66rem/1.3 var(--sans); color: var(--ink); }
    .hd-drawer span { display: block; height: 0.34rem; margin-top: 0.34rem; border-radius: 3px;
                      background: var(--paper-sunk); }
    /* Only the left frame transitions. The right one is animated with explicit
       keyframes, which is the faithful build of a spec that says nothing about
       being interrupted: every close starts from fully open. */
    .hd-drawer.built { transition: transform ${DRAWER_MS}ms ${EASE}; }
    .hd-drawer.built[data-on="1"] { transform: none; }

    .hd-grid { display: grid; gap: 0.26rem; padding: 0.5rem;
               grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .hd-cell { height: 0.95rem; border-radius: 4px; background: var(--accent-soft);
               border: 1px solid var(--rule); opacity: 0; transform: translateY(8px); }
    .hd-clock { position: absolute; right: 0.45rem; bottom: 0.45rem; border-radius: 5px;
                padding: 0.12rem 0.4rem; background: var(--paper-sunk); border: 1px solid var(--rule);
                font: 600 0.62rem/1.4 var(--mono); color: var(--ink-soft); }

    .hd-hbar { position: absolute; inset: 0 0 auto 0; display: flex; align-items: center;
               justify-content: space-between; padding: 0 0.6rem; overflow: hidden;
               background: var(--paper-sunk); border-bottom: 1px solid var(--rule); }
    .hd-hname { font: 600 1.05rem/1 var(--sans); color: var(--ink); transform-origin: left center; }
    .hd-hsub { font: 400 0.62rem/1.3 var(--sans); color: var(--ink-faint); }
    .hd-page { position: absolute; inset: auto 0 0 0; top: 0; padding: 0.5rem;
               display: grid; gap: 0.3rem; align-content: start; }
    .hd-page span { display: block; height: 0.36rem; border-radius: 3px; background: var(--paper-sunk); }

    .hd-scrub { display: flex; align-items: center; gap: 0.55rem; margin-top: 0.6rem; }
    .hd-scrub span { font: 600 0.66rem/1.3 var(--sans); color: var(--ink-soft); flex: none; }
    .hd-scrub input[type=range] { flex: 1; min-width: 0; accent-color: var(--accent); height: 1rem; }
    .hd-scrub output { font: 600 0.68rem/1.3 var(--mono); color: var(--ink); flex: none;
                       min-width: 3.4rem; text-align: right; }

    /* ----- the card ----- */
    .hd-card { display: grid; gap: 0.3rem; }
    .hd-crow { border: 1px solid var(--rule); border-radius: 6px; padding: 0.36rem 0.5rem;
               background: var(--paper); }
    .hd-crow[data-src="code"] { background: var(--paper-sunk); border-style: dashed; }
    .hd-crow[data-src="wrong"] { border-color: var(--bad); }
    .hd-ctop { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
    /* Flex, not inline, so a field name never breaks around the badge: as an
       item it moves under the badge whole rather than leaving "What" stranded
       beside CODE DECIDES and "starts it" on the line below. */
    .hd-cfield { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3rem;
                 font: 600 0.66rem/1.3 var(--sans); color: var(--ink); }
    .hd-cfield .hd-badge { margin-right: 0; }
    .hd-cval { font: 500 0.66rem/1.35 var(--mono); color: var(--ink-soft); text-align: right; }
    .hd-badge { display: inline-block; border-radius: 4px; padding: 0.02rem 0.3rem; margin-right: 0.3rem;
                font: 600 0.54rem/1.5 var(--sans); letter-spacing: 0.07em; text-transform: uppercase;
                background: var(--accent); color: var(--paper); vertical-align: 0.08rem; }
    .hd-crow[data-src="code"] .hd-badge { background: var(--rule); color: var(--ink-soft); }
    .hd-crow[data-src="wrong"] .hd-badge { background: var(--bad); color: var(--paper); }
    .hd-why { display: block; margin-top: 0.24rem; font: 400 0.64rem/1.45 var(--sans);
              color: var(--ink-faint); }
    .hd-crow[data-src="wrong"] .hd-why { color: var(--ink-soft); }

    .hd-readwrap { display: flex; align-items: center; min-height: 6.6rem;
                   padding: 0.85rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .hd-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .hd-read b { color: var(--ink); font-weight: 600; }

    .hd-foot { display: grid; gap: 0.55rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .hd-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .hd-ctl[hidden] { display: none; }
    .hd-cap { min-width: 8.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .hd-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .hd-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.32rem 0.56rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.73rem/1.3 var(--sans); }
    .hd-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .hd-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .hd-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 9.05rem; }
    .hd-actions[hidden] { display: none; }
    .hd-actions .btn[disabled] { opacity: 0.5; cursor: default; }

    @media (max-width: 1099px) {
      .hd-board { grid-template-columns: minmax(0,1fr) minmax(0,18rem); min-height: 29.8rem; }
      /* Measured: the list's lead wraps to three lines from 1050px down, and
         the reserve has to hold the tallest of the three, not the current one. */
      .hd-lead { min-height: 4.5rem; }
    }
    /* 901-1099px is the one band where the board is still two columns and the
       left one is narrow enough that "nothing about state" wraps to a third
       line. Reserved there only: reserving it at every width would leave 11px
       of blank above both frames everywhere else, and the frames have to line
       up with each other, not merely be tall enough. */
    @media (min-width: 901px) and (max-width: 1099px) {
      .hd-flabel { min-height: 2.5rem; }
    }
    @media (max-width: 900px) { .hd-board { grid-template-columns: minmax(0, 1fr); min-height: 46.3rem; } }
    /* The two drawer frames stay side by side at every width. Stacking them
       would halve this lab's stage height budget and, more importantly, the
       claim is that one of them snaps and the other does not — which is a
       comparison, and a comparison you scroll between is not one. The frames
       get shorter instead. */
    @media (max-width: 700px) {
      .hd-frame { height: 10.5rem; }
      .hd-ctl { align-items: flex-start; }
      .hd-cap { min-width: 100%; }
      .hd-actions { margin-left: 0; }
      .hd-state { display: none; }
      .hd-lead { min-height: 5.3rem; }
      .hd-readwrap { min-height: 9rem; }
    }
    @media (max-width: 470px) {
      .hd-frame { height: 9rem; }
      .hd-lead { min-height: 6.8rem; }
      .hd-readwrap { min-height: 9.8rem; }
    }
    @media (max-width: 380px) { .hd-readwrap { min-height: 11.6rem; } }
    @media print { .hd-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(role, caption, opts, chosen, hidden) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="hd-ctl" data-ctl="${role}"${hidden ? ' hidden' : ''}>
              <span class="hd-cap">${caption}</span>
              <div class="hd-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('hd-lab');

    let which = 'drawer';
    let count = 5;
    let runId = 0;

    root.innerHTML = `
      <div class="hd-head">
        <strong>${root.dataset.title || 'What the spec can say'}</strong>
        <span class="hd-state" data-state>&mdash;</span>
      </div>
      <div class="hd-board">
        <section class="hd-pane">
          <h3 class="hd-pname">The animation</h3>
          <p class="hd-lead" data-lead></p>
          <div data-stage></div>
        </section>
        <section class="hd-pane">
          <h3 class="hd-pname">The spec someone hands over</h3>
          <div class="hd-card" data-card></div>
        </section>
      </div>
      <div class="hd-readwrap"><p class="hd-read" data-read aria-live="polite"></p></div>
      <div class="hd-foot">
        ${seg('which', 'The animation', [['drawer', 'a drawer'], ['list', 'a list'], ['header', 'a header on scroll']], 'drawer')}
        ${seg('count', 'rows the query returned', [['5', '5'], ['12', '12'], ['40', '40']], '5', true)}
        <div class="hd-actions" data-actions>
          <button class="btn primary" type="button" data-play>Run it</button>
        </div>
      </div>`;

    const stage = root.querySelector('[data-stage]');
    const playBtn = root.querySelector('[data-play]');
    const actions = root.querySelector('[data-actions]');
    const countCtl = root.querySelector('[data-ctl="count"]');
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // ---------- stage builders ----------
    function buildDrawer() {
      stage.innerHTML = `
        <div class="hd-frames">
          ${['built', 'spec'].map((k) => `
            <div class="hd-fwrap">
              <span class="hd-flabel">${k === 'built'
                ? 'as <em>built</em> &middot; interruptible'
                : 'as <em class="bad">specified</em> &middot; nothing about state'}</span>
              <div class="hd-frame">
                <div class="hd-bar"><span class="hd-btitle">Settings</span>
                  <span class="hd-chip">${DRAWER_MS}ms</span></div>
                <div class="hd-rows"><div class="hd-row"></div><div class="hd-row"></div>
                  <div class="hd-row"></div><div class="hd-row"></div>
                  <div class="hd-row"></div><div class="hd-row"></div></div>
                <aside class="hd-drawer ${k}" data-d="${k}">
                  <h4 class="hd-dtitle">Billing history</h4>
                  <span></span><span></span><span></span>
                </aside>
              </div>
            </div>`).join('')}
        </div>`;
    }

    function buildList() {
      stage.innerHTML = `
        <div class="hd-frames one">
          <div class="hd-fwrap">
            <span class="hd-flabel">exactly <em>as specified</em> &middot; ${ITEM_MS}ms, ${STAGGER_MS}ms apart</span>
            <div class="hd-frame">
              <div class="hd-bar"><span class="hd-btitle">Results</span>
                <span class="hd-chip" data-n>${count} rows</span></div>
              <div class="hd-grid" data-grid></div>
              <span class="hd-clock" data-clock>0.00s</span>
            </div>
          </div>
        </div>`;
      const grid = stage.querySelector('[data-grid]');
      grid.innerHTML = Array.from({ length: count }, () => '<span class="hd-cell"></span>').join('');
    }

    function buildHeader() {
      stage.innerHTML = `
        <div class="hd-frames one">
          <div class="hd-fwrap">
            <span class="hd-flabel">driven by <em class="bad">the scrollbar</em>, not by a clock</span>
            <div class="hd-frame">
              <div class="hd-page" data-page style="padding-top:5.6rem">
                ${'<span></span>'.repeat(9)}
              </div>
              <div class="hd-hbar" data-hbar style="height:5rem">
                <span class="hd-hname" data-hname>Quarterly</span>
                <span class="hd-hsub" data-hsub>18 reports</span>
              </div>
            </div>
            <div class="hd-scrub">
              <span>scroll</span>
              <input type="range" min="0" max="180" step="1" value="0" data-scrub
                     aria-label="Scroll position in pixels">
              <output data-out>0px</output>
            </div>
          </div>
        </div>`;
      const scrub = stage.querySelector('[data-scrub]');
      scrub.addEventListener('input', paintHeader);
      paintHeader();
    }

    function paintHeader() {
      const scrub = stage.querySelector('[data-scrub]');
      if (!scrub) return;
      const px = +scrub.value;
      // Reduced motion: the spec's own rule, honoured — one instant condense
      // at 90px rather than a continuous ride. It is in the card as `spec`
      // because it is a design decision, not an implementation detail.
      const t = reduced() ? (px >= 90 ? 1 : 0) : px / 180;
      const h = 5 - 2.4 * t;
      const hbar = stage.querySelector('[data-hbar]');
      hbar.style.height = h + 'rem';
      stage.querySelector('[data-page]').style.paddingTop = (h + 0.6) + 'rem';
      stage.querySelector('[data-hname]').style.transform = `scale(${(1 - 0.38 * t).toFixed(3)})`;
      stage.querySelector('[data-hsub]').style.opacity = (1 - t).toFixed(3);
      stage.querySelector('[data-out]').textContent = px + 'px';
      report(`held at ${Math.round(t * 100)}%`);
    }

    // ---------- runners ----------
    async function runDrawer() {
      const mine = ++runId;
      playBtn.disabled = true;
      const built = stage.querySelector('[data-d="built"]');
      const spec = stage.querySelector('[data-d="spec"]');

      built.dataset.on = '0';
      spec.getAnimations().forEach(a => a.cancel());
      spec.style.transform = 'translateX(100%)';
      await wait(140); if (mine !== runId) return;

      if (reduced()) {
        built.dataset.on = '1';
        spec.style.transform = 'none';
        await wait(700); if (mine !== runId) return;
        built.dataset.on = '0';
        spec.style.transform = 'translateX(100%)';
        playBtn.disabled = false;
        return;
      }

      built.dataset.on = '1';
      const a = spec.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }],
        { duration: DRAWER_MS, easing: EASE, fill: 'forwards' });

      // Change of mind at 45% of the way in — the moment the handoff had no
      // field for. The left pane reverses from where it is; the right one
      // cancels its opening keyframe, which snaps it to fully open, and only
      // then plays the close it was given.
      await wait(DRAWER_MS * 0.45); if (mine !== runId) return;
      built.dataset.on = '0';
      a.cancel();
      spec.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }],
        { duration: DRAWER_MS, easing: EASE, fill: 'forwards' });

      await wait(DRAWER_MS + 500); if (mine !== runId) return;
      playBtn.disabled = false;
    }

    async function runList() {
      const mine = ++runId;
      playBtn.disabled = true;
      const cells = [...stage.querySelectorAll('.hd-cell')];
      const clock = stage.querySelector('[data-clock]');
      const total = reduced() ? ITEM_MS : (count - 1) * STAGGER_MS + ITEM_MS;

      cells.forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.style.opacity = '0'; });
      await wait(120); if (mine !== runId) return;

      const t0 = performance.now();
      cells.forEach((c, i) => {
        // Reduced motion: no rise and no stagger — the rows are simply there,
        // which is the spec's own row for it. The clock still runs so the
        // point about row count survives with motion turned off.
        if (reduced()) { c.style.opacity = '1'; c.style.transform = 'none'; return; }
        c.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: ITEM_MS, delay: i * STAGGER_MS, easing: EASE, fill: 'forwards' });
      });

      const tick = () => {
        if (mine !== runId) return;
        const el = Math.min(performance.now() - t0, total);
        clock.textContent = (el / 1000).toFixed(2) + 's';
        if (el < total) requestAnimationFrame(tick);
        else { playBtn.disabled = false; report(); }
      };
      requestAnimationFrame(tick);
    }

    function run() {
      if (which === 'drawer') return runDrawer();
      if (which === 'list') return runList();
      return undefined;
    }

    // ---------- card + verdict ----------
    function renderCard() {
      const spec = SPECS[which];
      root.querySelector('[data-lead]').innerHTML = spec.lead;
      root.querySelector('[data-card]').innerHTML = spec.rows.map(([field, value, src, why]) => {
        const badge = src === 'spec' ? 'spec' : src === 'code' ? 'code decides' : 'says nothing';
        const val = which === 'list' && field === 'How many rows' ? `${count}, today` : value;
        return `<div class="hd-crow" data-src="${src}">
          <span class="hd-ctop"><span class="hd-cfield"><span class="hd-badge">${badge}</span>${field}</span>
          <span class="hd-cval">${val}</span></span>
          ${why ? `<span class="hd-why">${why}</span>` : ''}
        </div>`;
      }).join('');
    }

    function report(extra) {
      const read = root.querySelector('[data-read]');
      const specCount = SPECS[which].rows.filter(r => r[2] === 'spec').length;
      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${SPECS[which].name} · ${specCount} of ${SPECS[which].rows.length} fields survive the handoff` +
        (extra ? ` · ${extra}` : '');

      if (which === 'drawer') {
        read.innerHTML = reduced()
          ? `With motion reduced neither drawer slides, so the two builds are identical &mdash; which
             is worth noticing. <b>The bug the spec allowed is invisible to you and not to everyone
             else</b>, and that asymmetry is the reason interruption has to be written down as a
             sentence even though it cannot be drawn as a frame.`
          : `Same duration, same curve, same distance &mdash; and the right one <b>snaps back to fully
             open before it closes</b>, because the only thing it was told was where the drawer starts
             and where it ends. <b>Interruption is not a missing detail, it is a missing category</b>:
             a spec describes two states and a reader can be in any of the ones between them.`;
      } else if (which === 'list') {
        const total = reduced() ? ITEM_MS : (count - 1) * STAGGER_MS + ITEM_MS;
        read.innerHTML = count <= 5
          ? `<b>${(total / 1000).toFixed(2)}s</b> for ${count} rows, which is what the spec was signed
             off against. Nothing is wrong here, and nothing will be wrong until the query returns more.
             <b>Turn the row count up.</b>`
          : `<b>${(total / 1000).toFixed(2)}s</b> before the last row exists, from a spec whose every
             number is correct. Nobody wrote down anything wrong; the mock had five rows and production
             has ${count}. <b>A stagger is not a duration, it is a duration multiplied by a number the
             design file never contained</b> &mdash; which is why the fix, a cap after row eight, is a
             decision that has to be made and is usually made by whoever is building it at the time.`;
      } else {
        read.innerHTML = reduced()
          ? `Your reduced-motion setting is honoured here: the header condenses in one step at 90px
             rather than riding the scroll. <b>That row is marked spec, not code</b> &mdash; what
             happens for a reader who asked for less motion is a design decision, and leaving it out
             of the handoff is how it ends up being made by nobody.`
          : `Park it half way and look at it. <b>That state has to be a finished-looking header</b>, and
             it is not in the spec, because the spec has two frames and this has a continuum.
             Worse, two of its fields are filled in and mean nothing: <b>there is no duration and no
             easing when the clock is the scrollbar</b>. A wrong number is more expensive than a blank
             &mdash; a blank gets a question, and a number gets built.`;
      }
    }

    function switchTo(v) {
      which = v;
      runId += 1;
      countCtl.hidden = v !== 'list';
      actions.hidden = v === 'header';
      playBtn.disabled = false;
      if (v === 'drawer') buildDrawer();
      else if (v === 'list') buildList();
      else buildHeader();
      renderCard();
      report();
      run();
    }

    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          apply(btn.dataset.value);
        }));
    }
    knob('which', switchTo);
    // The row count rebuilds and replays rather than waiting to be pressed: the
    // claim is about how long 40 rows takes, and reading "2.54s" is not the same
    // as sitting through it.
    knob('count', (v) => { count = +v; buildList(); renderCard(); report(); runList(); });
    playBtn.addEventListener('click', run);

    switchTo('drawer');
  }

  document.querySelectorAll('[data-spec-lab]').forEach(mount);
})();
