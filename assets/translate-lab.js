/* ============================================================
   translate-lab.js — which control builds this?

   Six specimens that a designer would recognise from any site
   built in the last three years. For each one: watch it, name
   the control that would build it in Framer, then reveal.

   The drill is the point. Every one of these is buildable, and
   five of the six are one control on the Effects panel — which
   is the honest version of "the tool can't do X". It can do
   almost all of it. What it asks of you is that you know which
   noun you are looking at before you go looking for a control,
   because the panel is organised by trigger, not by feeling.

   The sixth has no home on a canvas: a toast that fires when a
   save fails is triggered by application state, and a canvas
   has clicks, hovers, viewport positions and page loads. That
   is the boundary, and it is a boundary of triggers, not of
   motion — which is why the fix is an override and not a
   different curve.

   The two scroll specimens share one real overflow scroller,
   because the difference between them is what the scroll
   position is wired to: a continuous mapping in one, a state
   flip past a threshold in the other. Read as prose that is a
   distinction; watched side by side in the same scroller it is
   obvious, and "Scroll it for me" means her attention is on the
   motion rather than on her own trackpad.

   Reduced motion: specimens hold their end state and the stage
   says so. Guessing which control builds a thing does not
   require watching it travel, so the drill survives intact —
   which is the test of whether a lab's reduced-motion stance is
   honest or is a shrug (0009).

   Usage:
     <div data-translate-lab data-title="Which control builds this?"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  // The five canvas controls plus the escape hatch. The same six options
  // appear under every specimen: an option list that narrowed per question
  // would be answering it.
  const CONTROLS = [
    ['appear',  'Appear'],
    ['stagger', 'Appear + Stagger'],
    ['xform',   'Scroll Transform'],
    ['svar',    'Scroll Variant'],
    ['hover',   'Variants + hover'],
    ['code',    'Code override'],
  ];

  const SPECIMENS = [
    {
      id: 'hero',
      name: 'The headline on arrival',
      ask: 'It lifts and fades in once, just after the page settles.',
      answer: 'appear',
      control: 'Appear',
      why: 'The trigger is the page load, and Appear is the effect that fires on it: you set the ' +
           'From state — offset down, opacity nought — and Framer plays it forward once.',
      lesson: 'The direction is the argument, not the fade: see D002, on where the thing came from.',
      scroll: false,
    },
    {
      id: 'parallax',
      name: 'The layer that lags',
      ask: 'The photograph drifts more slowly than the words in front of it, the whole way down.',
      answer: 'xform',
      control: 'Scroll Transform',
      why: 'Nothing here is triggered, it is <b>mapped</b>: scroll position drives a value ' +
           'continuously, From one offset To another. If you find yourself asking when it fires, ' +
           'you have the wrong noun.',
      lesson: 'Scroll-linked, not scroll-triggered — the distinction D008 spends its first half on.',
      scroll: true,
    },
    {
      id: 'nav',
      name: 'The bar that hardens',
      ask: 'Transparent over the hero; once you are past it, it has a background and a hairline.',
      answer: 'svar',
      control: 'Scroll Variant',
      why: 'Two states and a threshold, not a mapping. Same scroller as the layer above it, and ' +
           'a completely different control, because this one <b>flips</b> where that one tracks.',
      lesson: 'Also D008 — and the reason the bar needs a duration is D003, on what makes a change ' +
              'read as a change rather than as a glitch.',
      scroll: true,
    },
    {
      id: 'card',
      name: 'The card under the pointer',
      ask: 'It lifts a little and its shadow deepens while you are on it.',
      answer: 'hover',
      control: 'Variants + hover',
      why: 'A variant for the resting state, a variant for the hovered one, and Mouse Enter / ' +
           'Mouse Leave between them. Framer animates the difference; the same pair of variants ' +
           'is what a Link Style carries.',
      lesson: 'The lift is a promise that a click will do something: D004, on states as a language.',
      scroll: false,
    },
    {
      id: 'list',
      name: 'The results, arriving',
      ask: 'Six rows land one after another rather than all at once.',
      answer: 'stagger',
      control: 'Appear + Stagger',
      why: 'Stagger is a property of the Appear transition, not a separate effect, and it applies ' +
           'down a Collection List the same way it applies to six layers you drew by hand.',
      lesson: 'Why the delay is small and constant is D005, on rhythm; why the list is a list at ' +
              'all is D009.',
      scroll: false,
    },
    {
      id: 'toast',
      name: 'The save that failed',
      ask: 'A message slides in — but only when the save does not go through.',
      answer: 'code',
      control: 'Code override or Code component',
      why: 'Every control above is triggered by something the canvas can see: a load, a pointer, ' +
           'a scroll position. <b>Nothing on the canvas can see a request fail.</b> The motion is ' +
           'the easiest part; the trigger is the part that has no home here.',
      lesson: 'This is the seam the whole lesson is about — and past it you are in Motion for ' +
              'React, which is the same vocabulary with a keyboard.',
      scroll: false,
    },
  ];

  function injectStyles() {
    if (document.getElementById('translate-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'translate-lab-styles';
    s.textContent = `
    .fr-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .fr-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .fr-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .fr-score { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .fr-ask { padding: 0.85rem 1rem 0; background: var(--paper); font-family: var(--sans); }
    .fr-num { font: 600 0.64rem/1.3 var(--sans); letter-spacing: 0.12em; text-transform: uppercase;
              color: var(--ink-faint); }
    .fr-name { margin: 0.15rem 0 0.2rem; font: 600 1rem/1.3 var(--sans); color: var(--ink); }
    .fr-brief { margin: 0 0 0.75rem; font: 400 0.85rem/1.5 var(--sans); color: var(--ink-soft);
                min-height: 2.6rem; }

    /* ----- the stage ----- */
    .fr-stagewrap { padding: 0 1rem 0.9rem; background: var(--paper); }
    .fr-stage { position: relative; height: 13rem; overflow: hidden;
                border: 1px solid var(--rule); border-radius: 8px; background: var(--paper-sunk); }
    .fr-scroller { height: 100%; overflow-y: auto; overscroll-behavior: contain;
                   scrollbar-width: thin; }
    .fr-tall { position: relative; height: 46rem; }

    .fr-hero { position: absolute; inset: 0; display: grid; align-content: center; gap: 0.45rem;
               padding: 0 1.6rem; }
    .fr-h1 { height: 0.85rem; width: 62%; border-radius: 4px; background: var(--ink-faint);
             opacity: 0; transform: translateY(1.1rem);
             transition: opacity 420ms var(--ease-out-strong), transform 420ms var(--ease-out-strong); }
    .fr-h2 { height: 0.5rem; width: 44%; border-radius: 4px; background: var(--rule);
             opacity: 0; transform: translateY(1.1rem);
             transition: opacity 420ms 90ms var(--ease-out-strong),
                         transform 420ms 90ms var(--ease-out-strong); }
    .fr-stage[data-play="1"] .fr-h1, .fr-stage[data-play="1"] .fr-h2 { opacity: 1; transform: none; }

    /* parallax + nav share this scroller */
    .fr-back { position: absolute; inset: -4rem 0 auto 0; height: 22rem;
               background: linear-gradient(160deg, var(--accent-soft), var(--paper-sunk) 70%);
               will-change: transform; }
    .fr-front { position: relative; padding: 5rem 1.4rem 0; display: grid; gap: 0.4rem; }
    .fr-front span { height: 0.5rem; border-radius: 4px; background: var(--ink-faint); opacity: 0.75; }
    .fr-front span:nth-child(2n) { width: 58%; }
    .fr-copy { padding: 6rem 1.4rem 2rem; display: grid; gap: 0.42rem; }
    .fr-copy span { height: 0.42rem; border-radius: 4px; background: var(--rule); }
    .fr-copy span:nth-child(3n) { width: 64%; }
    .fr-nav { position: sticky; top: 0; z-index: 2; display: flex; align-items: center;
              gap: 0.4rem; height: 2rem; padding: 0 0.7rem;
              font: 600 0.68rem/1 var(--sans); color: var(--ink-faint);
              background: transparent; border-bottom: 1px solid transparent;
              transition: background-color 240ms var(--ease-out-strong),
                          border-color 240ms var(--ease-out-strong), color 240ms linear; }
    .fr-nav[data-stuck="1"] { background: var(--paper); border-bottom-color: var(--rule);
                              color: var(--ink); }

    .fr-cards { position: absolute; inset: 0; display: flex; align-items: center;
                justify-content: center; gap: 0.7rem; padding: 0 1.2rem; }
    .fr-card { flex: 0 1 8.5rem; height: 6.4rem; border: 1px solid var(--rule); border-radius: 8px;
               background: var(--paper); padding: 0.55rem;
               display: grid; align-content: start; gap: 0.32rem;
               transition: transform 200ms var(--ease-out-strong), box-shadow 200ms linear; }
    .fr-card span { height: 0.38rem; border-radius: 3px; background: var(--paper-sunk); }
    .fr-card span:first-child { background: var(--rule); width: 70%; height: 0.5rem; }
    .fr-stage[data-play="1"] .fr-card.mid { transform: translateY(-0.55rem);
                                            box-shadow: 0 10px 22px -12px var(--ink); }

    .fr-rows { position: absolute; inset: 0; display: grid; align-content: center; gap: 0.42rem;
               padding: 0 1.6rem; }
    .fr-row { height: 1.35rem; border: 1px solid var(--rule); border-radius: 6px;
              background: var(--paper); opacity: 0; transform: translateY(0.6rem);
              transition: opacity 300ms var(--ease-out-strong), transform 300ms var(--ease-out-strong); }
    .fr-stage[data-play="1"] .fr-row { opacity: 1; transform: none; }
    .fr-row:nth-child(1) { transition-delay: 0ms; }
    .fr-row:nth-child(2) { transition-delay: 55ms; }
    .fr-row:nth-child(3) { transition-delay: 110ms; }
    .fr-row:nth-child(4) { transition-delay: 165ms; }
    .fr-row:nth-child(5) { transition-delay: 220ms; }
    .fr-row:nth-child(6) { transition-delay: 275ms; }

    .fr-app { position: absolute; inset: 0; display: grid; place-items: center; }
    .fr-fake { border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
               padding: 0.7rem 0.9rem; font: 500 0.74rem/1.4 var(--sans); color: var(--ink-faint); }
    .fr-toast { position: absolute; right: 0.8rem; bottom: 0.8rem; max-width: 68%;
                border: 1px solid var(--bad); border-radius: 7px; background: var(--paper);
                padding: 0.5rem 0.7rem; font: 500 0.74rem/1.35 var(--sans); color: var(--ink);
                opacity: 0; transform: translateY(0.7rem);
                transition: opacity 240ms var(--ease-out-strong),
                            transform 240ms var(--ease-out-strong); }
    .fr-stage[data-play="1"] .fr-toast { opacity: 1; transform: none; }

    /* ----- the guess ----- */
    .fr-guess { padding: 0.85rem 1rem; border-top: 1px solid var(--rule); background: var(--paper-sunk);
                font-family: var(--sans); }
    .fr-cap { display: block; margin-bottom: 0.5rem; font: 600 0.7rem/1.3 var(--sans);
              color: var(--ink-soft); }
    .fr-opts { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .fr-opts button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.6rem;
                      background: var(--paper); color: var(--ink-soft); cursor: pointer;
                      font: 500 0.75rem/1.3 var(--sans); }
    .fr-opts button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                           color: var(--paper); }
    .fr-opts button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .fr-opts button[disabled] { cursor: default; }
    .fr-opts button[data-mark="right"] { border-color: var(--good); background: var(--good);
                                         color: var(--paper); }
    .fr-opts button[data-mark="wrong"] { border-color: var(--bad); background: var(--bad);
                                         color: var(--paper); }

    .fr-verdictwrap { min-height: 7.4rem; padding: 0.85rem 1rem; border-top: 1px solid var(--rule);
                      background: var(--paper); }
    .fr-verdict { margin: 0; font: 400 0.82rem/1.55 var(--sans); color: var(--ink-soft); }
    .fr-verdict b { color: var(--ink); font-weight: 600; }
    .fr-verdict .fr-tag { display: inline-block; margin-right: 0.45rem; padding: 0.05rem 0.4rem;
                          border-radius: 4px; font: 600 0.7rem/1.5 var(--sans);
                          background: var(--accent-soft); color: var(--ink); }
    .fr-note { display: block; margin-top: 0.4rem; font: 400 0.76rem/1.5 var(--sans);
               color: var(--ink-faint); }

    .fr-foot { display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center;
               padding: 0.85rem 1rem 1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); }
    .fr-foot .fr-spacer { flex: 1 1 1rem; }

    @media (prefers-reduced-motion: reduce) {
      .fr-h1, .fr-h2, .fr-row, .fr-card, .fr-toast, .fr-nav { transition: none; }
      .fr-back { transform: none !important; }
    }
    @media (max-width: 700px) {
      .fr-stage { height: 11rem; }
      .fr-brief { min-height: 4rem; }
      .fr-verdictwrap { min-height: 11.5rem; }
      .fr-score { display: none; }
    }
    @media (max-width: 480px) { .fr-verdictwrap { min-height: 14rem; } }
    @media print { .fr-guess, .fr-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rows = (cls, n) =>
    `<div class="${cls}">${Array.from({ length: n }, () => '<span></span>').join('')}</div>`;

  function stageMarkup(spec) {
    if (spec.id === 'hero') {
      return `<div class="fr-hero"><i class="fr-h1"></i><i class="fr-h2"></i></div>`;
    }
    if (spec.scroll) {
      return `<div class="fr-scroller" data-scroller>
        <div class="fr-nav" data-nav data-stuck="0">Atelier</div>
        <div class="fr-tall">
          <div class="fr-back" data-back></div>
          ${rows('fr-front', 3)}
          ${rows('fr-copy', 9)}
        </div>
      </div>`;
    }
    if (spec.id === 'card') {
      return `<div class="fr-cards">${['', 'mid', ''].map(c =>
        `<div class="fr-card ${c}"><span></span><span></span><span></span></div>`).join('')}</div>`;
    }
    if (spec.id === 'list') {
      return `<div class="fr-rows">${Array.from({ length: 6 },
        () => '<div class="fr-row"></div>').join('')}</div>`;
    }
    return `<div class="fr-app"><span class="fr-fake">Saving&hellip;</span></div>
            <div class="fr-toast">Could not save &mdash; retrying</div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('fr-lab');

    let i = 0;
    let picked = null;
    let runId = 0;
    const answers = new Array(SPECIMENS.length).fill(null);

    root.innerHTML = `
      <div class="fr-head">
        <strong>${root.dataset.title || 'Which control builds this?'}</strong>
        <span class="fr-score" data-score></span>
      </div>
      <div class="fr-ask">
        <span class="fr-num" data-num></span>
        <h3 class="fr-name" data-name></h3>
        <p class="fr-brief" data-brief></p>
      </div>
      <div class="fr-stagewrap"><div class="fr-stage" data-stage data-play="0"></div></div>
      <div class="fr-guess">
        <span class="fr-cap">In Framer, which control builds this?</span>
        <div class="fr-opts" data-opts>${CONTROLS.map(([v, label]) =>
          `<button type="button" data-value="${v}" aria-pressed="false">${label}</button>`).join('')}</div>
      </div>
      <div class="fr-verdictwrap"><p class="fr-verdict" data-verdict aria-live="polite"></p></div>
      <div class="fr-foot">
        <button class="btn primary" type="button" data-playbtn>Play it</button>
        <button class="btn" type="button" data-check disabled>Check</button>
        <span class="fr-spacer"></span>
        <button class="btn" type="button" data-prev>&larr; Back</button>
        <button class="btn" type="button" data-next>Next specimen &rarr;</button>
      </div>`;

    const stage = root.querySelector('[data-stage]');
    const optsBox = root.querySelector('[data-opts]');
    const verdict = root.querySelector('[data-verdict]');
    const checkBtn = root.querySelector('[data-check]');
    // Not [data-play] — the stage carries that as its own state attribute and sits
    // earlier in the DOM, so the button has its own name.
    const playBtn = root.querySelector('[data-playbtn]');

    // ----- the scroll specimens -----
    // One scroller, driven either by the reader or by the button. The parallax
    // layer is wired continuously; the bar flips past a threshold. Both read
    // the same scrollTop, which is the entire distinction on screen at once.
    function wireScroller() {
      const sc = stage.querySelector('[data-scroller]');
      if (!sc) return;
      const back = stage.querySelector('[data-back]');
      const nav = stage.querySelector('[data-nav]');
      const onScroll = () => {
        const y = sc.scrollTop;
        if (back) back.style.transform = `translateY(${(y * 0.42).toFixed(1)}px)`;
        if (nav) nav.dataset.stuck = y > 60 ? '1' : '0';
      };
      sc.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    function autoScroll(token) {
      const sc = stage.querySelector('[data-scroller]');
      if (!sc) return;
      if (reduced()) { sc.scrollTop = 220; return; }
      sc.scrollTop = 0;
      const start = performance.now();
      const step = (now) => {
        if (token !== runId || !sc.isConnected) return;
        const t = Math.min(1, (now - start) / 2600);
        sc.scrollTop = 300 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function play() {
      const token = ++runId;
      const spec = SPECIMENS[i];
      if (spec.scroll) { autoScroll(token); return; }
      stage.dataset.play = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (token === runId) stage.dataset.play = '1';
      }));
    }

    function score() {
      const done = answers.filter(a => a !== null).length;
      const right = answers.filter((a, n) => a === SPECIMENS[n].answer).length;
      root.querySelector('[data-score]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${i + 1} of ${SPECIMENS.length}` + (done ? ` · ${right}/${done} named` : '');
    }

    function render() {
      const spec = SPECIMENS[i];
      runId += 1;
      picked = answers[i];

      root.querySelector('[data-num]').textContent = `Specimen ${i + 1}`;
      root.querySelector('[data-name]').textContent = spec.name;
      root.querySelector('[data-brief]').textContent = spec.ask;

      stage.dataset.play = '0';
      stage.innerHTML = stageMarkup(spec);
      wireScroller();

      const settled = answers[i] !== null;
      optsBox.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', String(settled ? b.dataset.value === answers[i]
                                                      : b.dataset.value === picked));
        b.disabled = settled;
        if (settled) {
          if (b.dataset.value === spec.answer) b.dataset.mark = 'right';
          else if (b.dataset.value === answers[i]) b.dataset.mark = 'wrong';
          else delete b.dataset.mark;
        } else {
          delete b.dataset.mark;
        }
      });
      checkBtn.disabled = settled || !picked;
      playBtn.textContent = spec.scroll ? 'Scroll it for me' : 'Play it';

      if (settled) reveal();
      else verdict.innerHTML = reduced()
        ? `Motion is off in your system settings, so this specimen holds its end state rather than
           playing. <b>Name the control anyway</b> — the question is which trigger this is, and a
           trigger does not need to travel to be identified.`
        : `Watch it, then name the control. <b>Guess before you check</b>: a wrong guess you
           committed to is worth more than a right one you never risked, because it tells you which
           two nouns you are still merging.`;

      score();
      // The specimen plays itself on arrival. A drill that opened on a still
      // frame would be asking her to press a button before the lab has said
      // anything, and the first thing she should see is the motion.
      requestAnimationFrame(() => { if (root.isConnected) play(); });
    }

    function reveal() {
      const spec = SPECIMENS[i];
      const got = answers[i];
      const right = got === spec.answer;
      const label = (CONTROLS.find(c => c[0] === got) || ['', '—'])[1];
      verdict.innerHTML =
        `<span class="fr-tag">${spec.control}</span>` +
        (right
          ? `<b>Named it.</b> ${spec.why}`
          : `You said <b>${label}</b>. ${spec.why}`) +
        `<span class="fr-note">${spec.lesson}</span>`;
    }

    optsBox.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        picked = btn.dataset.value;
        optsBox.querySelectorAll('button').forEach(b =>
          b.setAttribute('aria-pressed', String(b === btn)));
        checkBtn.disabled = false;
      }));

    checkBtn.addEventListener('click', () => {
      if (!picked || answers[i] !== null) return;
      answers[i] = picked;
      render();
    });

    playBtn.addEventListener('click', play);
    root.querySelector('[data-prev]').addEventListener('click', () => {
      i = (i - 1 + SPECIMENS.length) % SPECIMENS.length; render();
    });
    root.querySelector('[data-next]').addEventListener('click', () => {
      i = (i + 1) % SPECIMENS.length; render();
    });

    render();
  }

  document.querySelectorAll('[data-translate-lab]').forEach(mount);
})();
