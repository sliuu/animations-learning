/* ============================================================
   continuity-lab.js — orientation is what did not move.

   The first lab is about the motion between two screens. This
   one is about the parts that refuse to take part in it, which
   is the half designers underrate: a reader knows where they are
   because the bar across the top is the same bar it was a second
   ago, not because something slid.

   Two frames, one navigation, always simultaneous — the left one
   is nailed to "everything swaps" so there is a control on
   screen at all times. A slider moved between two states is not
   a comparison; that rule broke lesson 0010 once already.

   The verdict is measured, not asserted: the persistent share is
   read off getBoundingClientRect on the elements that actually
   held still, so the number changes when the layout does and
   cannot drift out of date the way a hardcoded table would.

   Reduced motion: the frames swap instantly and *the lab still
   works*, which is the point worth the whole section. Persistent
   chrome is not an animation. It survives the setting, the deep
   link and the hard refresh, because it is a fact about the
   layout rather than a fact about the transition — so it is the
   only orientation you can actually count on.

   Usage:
     <div data-continuity-lab data-title="What stays put"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const DUR = 320;
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  const TABS = [
    { id: 'inbox', label: 'Inbox', title: 'Inbox', rows: ['w2', 'w1', 'w3', 'w2'] },
    { id: 'search', label: 'Search', title: 'Search', rows: ['w1', 'w3', 'w1'] },
    { id: 'settings', label: 'Settings', title: 'Settings', rows: ['w3', 'w2', 'w1', 'w1', 'w3'] },
  ];

  const KEEPS = {
    none: { cap: 'nothing', parts: [] },
    nav: { cap: 'the tab bar', parts: ['nav'] },
    both: { cap: 'the tab bar and the header', parts: ['head', 'nav'] },
  };

  function injectStyles() {
    if (document.getElementById('continuity-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'continuity-lab-styles';
    s.textContent = `
    .ct-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .ct-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .ct-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .ct-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .ct-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .ct-cell { display: flex; flex-direction: column; padding: 1rem 1rem 1.1rem;
               background: var(--paper); }
    .ct-name { margin: 0 0 0.65rem; font: 600 0.66rem/1.3 var(--sans);
               letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }
    .ct-name em { font-style: normal; color: var(--accent); }

    .ct-frame { border: 1px solid var(--rule); border-radius: 7px; overflow: hidden;
                background: var(--paper); }
    .ct-fhead { display: flex; align-items: center; justify-content: space-between;
                padding: 0.45rem 0.6rem; background: var(--paper-sunk);
                border-bottom: 1px solid var(--rule); }
    .ct-ftitle { font: 600 0.72rem/1.2 var(--sans); color: var(--ink); }
    .ct-avatar { width: 1rem; height: 1rem; border-radius: 50%; background: var(--rule); }

    .ct-nav { position: relative; display: grid; grid-template-columns: repeat(3, 1fr);
              border-bottom: 1px solid var(--rule); }
    .ct-tab { padding: 0.35rem 0.2rem; text-align: center; z-index: 1;
              font: 600 0.62rem/1.2 var(--sans); color: var(--ink-faint); }
    .ct-tab[data-on="1"] { color: var(--paper); }
    .ct-pill { position: absolute; top: 0.16rem; bottom: 0.16rem; left: 0.16rem;
               width: calc((100% - 0.32rem) / 3); border-radius: 5px; background: var(--accent); }

    .ct-body { display: grid; gap: 0.34rem; padding: 0.6rem; min-height: 5.6rem;
               align-content: start; }
    .ct-bar { height: 0.45rem; border-radius: 3px; background: var(--paper-sunk); }
    .ct-bar.w1 { width: 62%; } .ct-bar.w2 { width: 88%; } .ct-bar.w3 { width: 44%; }

    /* Reserved, per measured band — same reason as nav-lab's claim: the note
       rewrites on every knob turn, and an unreserved note moves the rest of the
       page while she is trying to compare two frames. */
    .ct-note { margin: 0.6rem 0 0; min-height: 3.1rem;
               font: 400 0.7rem/1.45 var(--sans); color: var(--ink-soft); }
    .ct-note b { color: var(--ink); font-weight: 600; }

    .ct-readwrap { display: flex; align-items: center; min-height: 5.4rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .ct-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .ct-read b { color: var(--ink); font-weight: 600; }

    .ct-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .ct-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .ct-cap { min-width: 6.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .ct-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .ct-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .ct-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .ct-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .ct-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 7.05rem; }

    @media (max-width: 999px) { .ct-readwrap { min-height: 6.45rem; } .ct-note { min-height: 4.1rem; } }
    @media (max-width: 700px) {
      .ct-board { grid-template-columns: minmax(0, 1fr); }
      .ct-note { min-height: 2.1rem; }
      .ct-readwrap { min-height: 8.4rem; }
      .ct-ctl { align-items: flex-start; }
      .ct-cap { min-width: 100%; }
      .ct-actions { margin-left: 0; }
      .ct-state { display: none; }
    }
    @media (max-width: 510px) { .ct-note { min-height: 3.1rem; } }
    @media (max-width: 460px) { .ct-readwrap { min-height: 11.3rem; } }
    /* Measured, not guessed: the note under the right frame goes to three lines
       at 359px and the heading wraps at 331px, and each does it in only one or
       two of the three settings — so each band starts just above the width where
       the wrap was measured, and the reserved height is uniform across settings. */
    @media (max-width: 360px) { .ct-note { min-height: 4.1rem; } }
    @media (max-width: 360px) { .ct-readwrap { min-height: 12.5rem; } }
    @media (max-width: 335px) { .ct-name { min-height: 2.6em; } }
    @media print { .ct-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frameHTML() {
    return `
      <div class="ct-frame">
        <div class="ct-fhead" data-part="head">
          <span class="ct-ftitle" data-ftitle>Inbox</span><span class="ct-avatar"></span>
        </div>
        <div class="ct-nav" data-part="nav">
          <span class="ct-pill" data-pill></span>
          ${TABS.map((t, i) => `<span class="ct-tab" data-tab="${t.id}" data-on="${i === 0 ? 1 : 0}">${t.label}</span>`).join('')}
        </div>
        <div class="ct-body" data-part="body"></div>
      </div>`;
  }

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="ct-ctl"><span class="ct-cap">${caption}</span>
            <div class="ct-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('ct-lab');

    let keep = 'nav';
    let at = 0;

    root.innerHTML = `
      <div class="ct-head">
        <strong>${root.dataset.title || 'What stays put'}</strong>
        <span class="ct-state" data-state>&mdash;</span>
      </div>
      <div class="ct-board">
        <section class="ct-cell">
          <h3 class="ct-name">Everything swaps</h3>
          ${frameHTML()}
          <p class="ct-note">The whole screen is replaced, header and tabs included. Nothing on
             screen is evidence that this is the same app it was a moment ago.</p>
        </section>
        <section class="ct-cell">
          <h3 class="ct-name">Kept: <em data-keepname>the tab bar</em></h3>
          ${frameHTML()}
          <p class="ct-note" data-note></p>
        </section>
      </div>
      <div class="ct-readwrap"><p class="ct-read" data-read aria-live="polite"></p></div>
      <div class="ct-foot">
        ${seg('keep', 'What stays put', [['none', 'nothing'], ['nav', 'the tab bar'], ['both', 'the tab bar + header']], 'nav')}
        ${seg('go', 'Go to', TABS.map(t => [t.id, t.label]), 'inbox')}
        <div class="ct-actions"><button class="btn primary" type="button" data-play>Navigate both</button></div>
      </div>`;

    const panes = [...root.querySelectorAll('.ct-frame')].map((f, i) => ({
      el: f, control: i === 0,
      head: f.querySelector('[data-part="head"]'),
      nav: f.querySelector('[data-part="nav"]'),
      body: f.querySelector('[data-part="body"]'),
      title: f.querySelector('[data-ftitle]'),
      pill: f.querySelector('[data-pill]'),
      tabs: [...f.querySelectorAll('[data-tab]')],
    }));

    function fill(p, i) {
      const t = TABS[i];
      p.title.textContent = t.title;
      p.body.innerHTML = t.rows.map(w => `<span class="ct-bar ${w}"></span>`).join('');
      p.tabs.forEach((el, n) => el.dataset.on = n === i ? '1' : '0');
      p.pill.style.transform = `translateX(${i * 100}%)`;
    }

    panes.forEach(p => fill(p, 0));

    function navigate(next) {
      const kept = panes.map(p => p.control ? [] : KEEPS[keep].parts);
      panes.forEach((p, n) => {
        const held = kept[n];
        const moving = ['head', 'nav', 'body'].filter(x => !held.includes(x))
          .map(x => x === 'head' ? p.head : x === 'nav' ? p.nav : p.body);

        // The pill only slides when the bar it lives in is one of the things
        // that stayed. If the bar was replaced, the pill was replaced with it,
        // and it has no previous position to travel from.
        const slide = held.includes('nav');
        const before = slide ? at : next;

        if (reduced()) { fill(p, next); return; }

        moving.forEach(el => {
          el.getAnimations().forEach(a => a.cancel());
          el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR * 0.45, easing: 'linear' });
        });
        if (slide) {
          p.pill.getAnimations().forEach(a => a.cancel());
          p.pill.animate(
            [{ transform: `translateX(${before * 100}%)` }, { transform: `translateX(${next * 100}%)` }],
            { duration: DUR * 1.3, easing: EASE });
        }
        setTimeout(() => {
          fill(p, next);
          moving.forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }],
            { duration: DUR * 0.55, easing: EASE }));
        }, DUR * 0.45);
      });
      at = next;
      report();
    }

    // Measured, not tabulated: the share of the frame that held still is read
    // off the boxes themselves, so a layout change cannot leave a stale number
    // sitting in the verdict.
    function share() {
      const p = panes[1];
      const total = p.el.getBoundingClientRect().height;
      if (!total) return 0;
      const parts = KEEPS[keep].parts.map(x => x === 'head' ? p.head : p.nav);
      const held = parts.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
      return Math.round((held / total) * 100);
    }

    function report() {
      const pct = share();
      root.querySelector('[data-keepname]').textContent = KEEPS[keep].cap;
      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') + `${pct}% held`;

      const note = root.querySelector('[data-note]');
      note.innerHTML = keep === 'none'
        ? 'Identical to the control, because <b>nothing</b> is being kept. This is the default you get for free, and it is the one that leaves the reader nothing to hold on to.'
        : keep === 'nav'
          ? 'The tab bar is the same bar. The highlight <b>travels</b> to the new tab instead of reappearing on it, which is the part that reads as one place rather than two.'
          : 'The header and the bar both persist, so only the content is new. The reader never leaves the app; they change what it is showing.';

      const read = root.querySelector('[data-read]');
      if (keep === 'none') {
        read.innerHTML = '<b>0% of the frame held still.</b> Both panes are now the same design, ' +
          'and neither one answers &ldquo;am I still in the same app?&rdquo; &mdash; the reader has ' +
          'to re-read the screen to find out. Every transition you could add on top of this is ' +
          'decorating a question you have not answered.';
      } else if (reduced()) {
        read.innerHTML = `<b>${pct}% of the right-hand frame held still</b>, with your ` +
          'reduced-motion setting on and nothing animating at all. That is the argument: ' +
          'persistence is a fact about the <b>layout</b>, not about the transition, so it is the ' +
          'only orientation that survives a hard refresh, a deep link, or a reader who turned ' +
          'motion off.';
      } else {
        read.innerHTML = `<b>${pct}% of the right-hand frame held still.</b> The left one ` +
          'rebuilt itself from scratch. Both took the same time and ran the same fade &mdash; ' +
          'the difference in how settled the right one feels is bought entirely by <b>what did ' +
          'not take part</b>.';
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
    // Changing what persists navigates on the spot. Holding still is only
    // visible against something moving, so this knob has to bring its own
    // movement with it rather than waiting to be paired with the other one.
    knob('keep', (v) => {
      keep = v;
      const next = (at + 1) % TABS.length;
      root.querySelectorAll('[data-role="go"] button')
          .forEach(b => b.setAttribute('aria-pressed', b.dataset.value === TABS[next].id));
      navigate(next);
    });
    // Pressing the tab you are already on re-runs the navigation rather than
    // quietly sending you somewhere else. Re-selecting a tab is a real thing an
    // app does, the fade plays, and the pill correctly does not move.
    knob('go', (v) => { navigate(TABS.findIndex(t => t.id === v)); });

    root.querySelector('[data-play]').addEventListener('click', () => {
      const next = (at + 1) % TABS.length;
      root.querySelectorAll('[data-role="go"] button')
          .forEach(b => b.setAttribute('aria-pressed', b.dataset.value === TABS[next].id));
      navigate(next);
    });

    report();
  }

  document.querySelectorAll('[data-continuity-lab]').forEach(mount);
})();
