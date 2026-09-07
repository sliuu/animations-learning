/* ============================================================
   nav-lab.js — the same navigation, four models, at once.

   The claim this lab has to carry is that a page transition is
   not decoration on a navigation: it is a *sentence about the
   relationship between two screens*, and the reader reads it
   whether or not you wrote it on purpose. A cut says nothing. A
   cross-fade says "different thing, no particular place". A push
   says "sideways, same level". A shared element says "you went
   into this specific thing."

   All four run off one button because the difference between
   them is entirely a difference in feeling, and a sequential A/B
   cannot teach a feeling — by the time the fourth plays she is
   remembering the first rather than comparing with it.

   The second knob is the one that matters most in practice.
   Back is the navigation people actually get wrong: it is the
   same code path run again, so it plays the same motion, and the
   reader is told they went deeper when they went back. Set
   "Back behaviour" to *repeats forward* and every frame lies in
   the same direction at once. That failure is silent in a still
   frame — a screenshot of a correct back and a broken back are
   the same image — so the captions say what just happened, in
   --bad, per the rule 0009 and D001 both earned.

   Reduced motion: every model falls back to a cut. That is not
   laziness dressed as an accommodation, and it is the lesson's
   own argument — if the transition was the only thing telling
   the reader where they landed, the design already failed for
   everyone who arrives by deep link, by back button, or with
   this setting on. The persistent chrome and the destination
   have to carry it. The verdict says exactly that rather than
   letting the panes sit there doing nothing.

   Usage:
     <div data-nav-lab data-title="One navigation, four models"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const DUR = 420;
  // How long the destination is held before all four frames cut back to where
  // they started. Long enough to read four screens at once; short enough that
  // pressing the button again is never a wait. The return is a cut on purpose:
  // an animated return would be a fifth transition on screen, and she would be
  // judging that one instead of the four the lab is about.
  const HOLD = 1400;
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  const MODELS = [
    {
      id: 'cut', name: 'Cut',
      fwd: 'Says nothing. The reader works out where they are by reading.',
      back: 'Says nothing on the way back either — consistent, at least.',
    },
    {
      id: 'fade', name: 'Cross-fade',
      fwd: 'Says <b>a different thing, in no particular place</b>. Calm, and spatially mute.',
      back: 'The same dissolve. Back and forward are not distinguishable.',
    },
    {
      id: 'push', name: 'Push',
      fwd: 'Says <b>you moved forward</b>. The old screen is still over there, to the left.',
      back: 'Says <b>you came back</b>. The screen you left slides in from where you left it.',
    },
    {
      id: 'shared', name: 'Shared element',
      fwd: 'Says <b>you went into this one</b>. The thing you touched is the thing you are now in.',
      back: 'Says <b>you put it back</b>. The detail returns to the row it came from.',
    },
  ];

  const ROWS = [
    ['Lamp', 'Delivered'],
    ['Rug', 'Delivered'],
    ['Kettle', 'Ordered · 2 days'],
  ];
  // The tapped row is the last one on purpose. With the target at the top the
  // shared element travels about six pixels, the claim it is making is invisible,
  // and the frame teaches nothing — the distance is the argument.
  const TARGET = ROWS.length - 1;

  function injectStyles() {
    if (document.getElementById('nav-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'nav-lab-styles';
    s.textContent = `
    .nv-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .nv-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .nv-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .nv-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .nv-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 1px; background: var(--rule); }
    .nv-cell { display: flex; flex-direction: column; padding: 1rem 0.85rem 0.9rem;
               background: var(--paper); }
    .nv-name { margin: 0 0 0.6rem; font: 600 0.66rem/1.3 var(--sans);
               letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }

    /* The frame is a product, not a phone: a persistent chrome bar and a stage
       the views move inside. The chrome never animates in this lab — that is
       the next lab's argument, and letting it move here would answer that
       question before she has been asked it. */
    .nv-frame { border: 1px solid var(--rule); border-radius: 7px; overflow: hidden;
                background: var(--paper); }
    .nv-chrome { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.55rem;
                 border-bottom: 1px solid var(--rule); background: var(--paper-sunk);
                 font: 600 0.66rem/1.2 var(--sans); color: var(--ink-soft); }
    .nv-dot { width: 0.42rem; height: 0.42rem; border-radius: 50%; background: var(--rule); }

    .nv-stage { position: relative; height: 9.5rem; overflow: hidden; }
    .nv-view { position: absolute; inset: 0; padding: 0.5rem;
               background: var(--paper); }
    /* visibility, never display: both views must keep their layout boxes so the
       shared-element FLIP can measure the row and the header in the same frame. */
    .nv-view[data-off="1"] { visibility: hidden; opacity: 0; }

    .nv-row { display: flex; align-items: center; gap: 0.45rem; padding: 0.3rem 0.25rem;
              border-radius: 5px; }
    .nv-row + .nv-row { margin-top: 0.18rem; }
    .nv-row.is-target { background: var(--paper-sunk); }
    .nv-thumb { flex: none; width: 1.5rem; height: 1.5rem; border-radius: 4px;
                background: var(--accent); }
    .nv-lines { display: grid; gap: 0.2rem; min-width: 0; }
    .nv-t { font: 600 0.64rem/1.2 var(--sans); color: var(--ink); white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis; }
    .nv-s { font: 500 0.58rem/1.2 var(--sans); color: var(--ink-faint); white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis; }

    /* display:block matters: this is a span in a block parent, so without it the
       box is inline, measures 0x0, and the FLIP scale below comes out Infinity.
       transform-origin is top-left because that is the corner the measured
       delta is expressed from. */
    .nv-hero { display: block; width: 2.6rem; height: 2.6rem; border-radius: 6px;
               background: var(--accent); transform-origin: top left; }
    .nv-detail-body { display: grid; gap: 0.32rem; margin-top: 0.45rem; }
    .nv-bar { height: 0.42rem; border-radius: 3px; background: var(--paper-sunk); }
    .nv-bar.w1 { width: 72%; } .nv-bar.w2 { width: 90%; } .nv-bar.w3 { width: 54%; }

    /* Reserved, per measured band. The claim rewrites on every knob turn and the
       longest string is four lines longer than the shortest, so without this the
       whole page below the lab moves each time she presses a button. The bands
       are the ones the *column count* creates, not the ones the card creates:
       at 999 the lab stops being full-bleed while the board is still four
       columns wide, which is the narrowest the text ever gets. */
    .nv-claim { margin: 0.55rem 0 0; min-height: 4.1rem;
                font: 400 0.7rem/1.45 var(--sans); color: var(--ink-soft); }
    .nv-claim b { color: var(--ink); font-weight: 600; }
    .nv-claim.is-bad { color: var(--bad); }
    .nv-claim.is-bad b { color: var(--bad); }

    .nv-readwrap { display: flex; align-items: center; min-height: 5.4rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .nv-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .nv-read b { color: var(--ink); font-weight: 600; }

    .nv-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .nv-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .nv-cap { min-width: 6.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .nv-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .nv-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .nv-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .nv-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .nv-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 7.05rem; }

    @media (max-width: 999px) {
      .nv-readwrap { min-height: 6.45rem; }
      .nv-board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .nv-claim { min-height: 3.1rem; }
    }
    @media (max-width: 700px) {
      .nv-readwrap { min-height: 8.4rem; }
      .nv-ctl { align-items: flex-start; }
      .nv-cap { min-width: 100%; }
      .nv-actions { margin-left: 0; }
      .nv-state { display: none; }
    }
    @media (max-width: 490px) { .nv-claim { min-height: 4.1rem; } }
    @media (max-width: 460px) {
      .nv-board { grid-template-columns: minmax(0, 1fr); }
      .nv-claim { min-height: 2.1rem; }
      .nv-readwrap { min-height: 11.3rem; }
    }
    @media (max-width: 365px) { .nv-claim { min-height: 3.1rem; } }
    @media print { .nv-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="nv-ctl"><span class="nv-cap">${caption}</span>
            <div class="nv-seg" data-role="${role}">${buttons}</div></div>`;
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('nv-lab');

    let dir = 'fwd';        // fwd = list → detail, back = detail → list
    let backMode = 'mirror'; // mirror | repeat

    const cells = MODELS.map(m => `
      <section class="nv-cell">
        <h3 class="nv-name">${m.name}</h3>
        <div class="nv-frame" data-model="${m.id}">
          <div class="nv-chrome"><span class="nv-dot"></span><span>Orders</span></div>
          <div class="nv-stage">
            <div class="nv-view nv-list">
              ${ROWS.map((r, i) => `
                <div class="nv-row${i === TARGET ? ' is-target' : ''}">
                  <span class="nv-thumb"${i === TARGET ? ' data-thumb' : ''}></span>
                  <span class="nv-lines"><span class="nv-t">${r[0]}</span><span class="nv-s">${r[1]}</span></span>
                </div>`).join('')}
            </div>
            <div class="nv-view nv-detail" data-off="1">
              <span class="nv-hero" data-hero></span>
              <div class="nv-detail-body">
                <span class="nv-t">${ROWS[TARGET][0]}</span>
                <span class="nv-bar w2"></span><span class="nv-bar w1"></span><span class="nv-bar w3"></span>
              </div>
            </div>
          </div>
        </div>
        <p class="nv-claim" data-claim="${m.id}"></p>
      </section>`).join('');

    root.innerHTML = `
      <div class="nv-head">
        <strong>${root.dataset.title || 'One navigation, four models'}</strong>
        <span class="nv-state" data-state>on the list</span>
      </div>
      <div class="nv-board">${cells}</div>
      <div class="nv-readwrap"><p class="nv-read" data-read aria-live="polite"></p></div>
      <div class="nv-foot">
        ${seg('dir', 'Direction', [['fwd', 'forward · open Kettle'], ['back', 'back · to the list']], 'fwd')}
        ${seg('backmode', 'Back behaviour', [['mirror', 'mirrors forward'], ['repeat', 'repeats forward']], 'mirror')}
        <div class="nv-actions">
          <button class="btn primary" type="button" data-play>Navigate all four</button>
        </div>
      </div>`;

    const frames = [...root.querySelectorAll('.nv-frame')].map(f => ({
      el: f,
      model: f.dataset.model,
      list: f.querySelector('.nv-list'),
      detail: f.querySelector('.nv-detail'),
      thumb: f.querySelector('[data-thumb]'),
      hero: f.querySelector('[data-hero]'),
      body: f.querySelector('.nv-detail-body'),
    }));

    // Both views always keep a layout box; only their paint state changes. rest()
    // is the no-animation truth, and every transition ends by calling it.
    function rest(f, view) {
      [f.list, f.detail].forEach((v) => {
        v.getAnimations().forEach(a => a.cancel());
        v.style.transform = '';
        v.style.opacity = '';
      });
      f.hero.getAnimations().forEach(a => a.cancel());
      f.hero.style.transform = '';
      f.body.getAnimations().forEach(a => a.cancel());
      f.body.style.opacity = '';
      f.list.dataset.off = view === 'list' ? '0' : '1';
      f.detail.dataset.off = view === 'detail' ? '0' : '1';
    }

    frames.forEach(f => rest(f, 'list'));

    function run(f, forward) {
      const from = forward ? f.list : f.detail;
      const to = forward ? f.detail : f.list;
      rest(f, forward ? 'list' : 'detail');
      from.dataset.off = '0';
      to.dataset.off = '0';

      const done = () => rest(f, forward ? 'detail' : 'list');
      if (reduced()) { done(); return; }

      const t = { duration: DUR, easing: EASE, fill: 'both' };

      if (f.model === 'cut') { done(); return; }

      if (f.model === 'fade') {
        from.animate([{ opacity: 1 }, { opacity: 0 }], t);
        to.animate([{ opacity: 0 }, { opacity: 1 }], t).finished.then(done, () => {});
        return;
      }

      if (f.model === 'push') {
        // "repeats forward" is the failure: back is asked to play the forward
        // motion, so the new screen still enters from the right and the reader
        // is told they went deeper again.
        const asForward = forward || backMode === 'repeat';
        const inFrom = asForward ? '100%' : '-100%';
        const outTo = asForward ? '-32%' : '32%';
        from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${outTo})` }], t);
        to.animate([{ transform: `translateX(${inFrom})` }, { transform: 'translateX(0)' }], t)
          .finished.then(done, () => {});
        return;
      }

      // Shared element: measure both boxes in the same frame, then move the
      // destination's own hero from where the source sat. No clone — the thing
      // the reader followed has to be the actual element that stays.
      const a = f.thumb.getBoundingClientRect();
      const b = f.hero.getBoundingClientRect();
      const scale = a.width / b.width;
      const near = { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${scale})` };
      const far = { transform: 'translate(0px, 0px) scale(1)' };
      const asForward = forward || backMode === 'repeat';

      if (forward) {
        f.list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR * 0.4, easing: 'linear', fill: 'both' });
        f.hero.animate([near, far], t);
        f.body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR, easing: EASE, fill: 'both' })
          .finished.then(done, () => {});
      } else if (asForward) {
        // The same forward motion again: the hero flies *out* to the row it is
        // supposedly returning to, but the list is what is arriving, so the
        // object appears to leave rather than to be put back.
        f.list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR, easing: EASE, fill: 'both' });
        f.hero.animate([near, far], t);
        f.detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR, easing: EASE, fill: 'both' })
          .finished.then(done, () => {});
      } else {
        f.list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DUR, easing: EASE, fill: 'both' });
        f.hero.animate([far, near], t);
        f.detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR * 0.8, easing: EASE, fill: 'both' })
          .finished.then(done, () => {});
      }
    }

    function claims() {
      const forward = dir === 'fwd';
      const lying = !forward && backMode === 'repeat';
      MODELS.forEach((m) => {
        const el = root.querySelector(`[data-claim="${m.id}"]`);
        const directional = m.id === 'push' || m.id === 'shared';
        if (lying && directional) {
          el.classList.add('is-bad');
          el.innerHTML = m.id === 'push'
            ? 'Back plays forward: the list enters from the right, so the reader is told they went <b>deeper</b> on the way out.'
            : 'Back plays forward: the object flies away from its row instead of settling into it. It reads as <b>losing</b> the thing.';
        } else {
          el.classList.remove('is-bad');
          el.innerHTML = forward ? m.fwd : m.back;
        }
      });
    }

    function verdict() {
      const read = root.querySelector('[data-read]');
      if (reduced()) {
        read.innerHTML = 'Your reduced-motion setting turns all four into a cut, which is the ' +
          'accommodation and also the test: <b>everything the transition was telling the reader ' +
          'has just gone</b>. Whatever is left — the bar across the top, the title, a back ' +
          'affordance — is what actually has to answer &ldquo;where am I?&rdquo;.';
        return;
      }
      if (dir === 'back' && backMode === 'repeat') {
        read.innerHTML = 'Back is running the forward motion. <b>Two of the four now say the ' +
          'wrong thing</b> and the other two say nothing, which is why this is so easy to ship: ' +
          'the cut and the cross-fade were never going to catch it for you.';
        return;
      }
      read.innerHTML = dir === 'fwd'
        ? 'Four transitions, four different sentences about the same navigation. Only the last ' +
          'two claim a <b>direction</b> or an <b>object</b>; the first two decline to say anything, ' +
          'which is a choice and sometimes the right one.'
        : 'Going back, the two directional models undo themselves and the two mute ones look ' +
          'exactly as they did going forward. <b>Reversibility is the whole difference</b> — and ' +
          'it is the half that only exists if someone designed it.';
    }

    // A run in progress is abandoned rather than queued: pressing play again, or
    // turning a knob mid-run, has to answer with the new setting immediately.
    let playId = 0;
    let returnTimer = 0;

    function play() {
      const forward = dir === 'fwd';
      const mine = ++playId;
      const state = root.querySelector('[data-state]');
      frames.forEach(f => run(f, forward));
      state.textContent =
        reduced() ? 'motion reduced · cut' : (forward ? 'list → detail' : 'detail → list');
      claims();
      verdict();
      // Then put all four back where they started. Without this the lab ended
      // stuck on the destination, so a second press had nothing to travel from
      // and the four models could only be compared once.
      clearTimeout(returnTimer);
      returnTimer = setTimeout(() => {
        if (mine !== playId) return;
        frames.forEach(f => rest(f, forward ? 'list' : 'detail'));
        state.textContent = forward ? 'back on the list' : 'back on the detail';
      }, DUR + HOLD);
    }

    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          apply(btn.dataset.value);
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          play();
        }));
    }
    knob('dir', (v) => { dir = v; });
    // Back behaviour only means anything on a back navigation, so turning it
    // switches direction too. A knob that quietly did nothing until she also
    // pressed the other one would be a knob that did nothing when turned.
    knob('backmode', (v) => {
      backMode = v;
      dir = 'back';
      root.querySelectorAll('[data-role="dir"] button')
          .forEach(b => b.setAttribute('aria-pressed', b.dataset.value === 'back'));
    });

    root.querySelector('[data-play]').addEventListener('click', play);

    claims();
    verdict();
  }

  document.querySelectorAll('[data-nav-lab]').forEach(mount);
})();
