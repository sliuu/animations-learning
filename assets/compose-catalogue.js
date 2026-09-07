/* ============================================================
   compose-catalogue.js — the parts list for Reference 06.

   Data only. No DOM, no behaviour. `compose-lab.js` is the
   engine; this file is everything it knows about.

   Reference 05 (the printable pattern catalogue and glossary)
   will read the same objects and the same word table, rendering
   its tables from this array rather than repeating them in
   prose. That is the whole reason the data lives apart from the
   engine: two sheets, one source, so neither can describe a
   pattern the other has never heard of.

   A word declares what it writes, never how it is applied. It
   returns plain CSS declarations plus, separately, any transform
   *functions* it contributes — keyed by slot, so two words that
   both touch `transform` compose into one declaration instead of
   the second silently winning. Words that want the same slot are
   mutually exclusive and the picker says so.

   A word may also write the *resting* rule, via `rest` and
   `restFns`. The button did not need this: its rest state is the
   plain button and every word describes a departure from it. The
   drawer inverted that — a panel that slides in has to say where
   it slides in *from*, and that is a declaration on the closed
   state, not on the open one. So `slide` writes both ends, which
   is also how the CSS is actually written.

   Colour: nothing here writes a hex. `darken` and `lighten` are
   `filter: brightness()` rather than a mixed background exactly
   so a button stays legible in both themes without this file
   knowing either palette. `tint` reaches for --accent-hover,
   which lesson.css has already chosen per theme.
   ============================================================ */

(() => {
  /* --- the value presets ---------------------------------------------
     Named, because a design-track control does not hand out raw
     cubic-bezier coefficients (the D008 rule). The code panel is where
     an exact curve gets typed; these are the words for it. */

  const DURATIONS = [
    { id: 'instant', label: 'instant', ms: 60 },
    { id: 'fast',    label: 'fast',    ms: 120 },
    { id: 'medium',  label: 'medium',  ms: 220 },
    { id: 'slow',    label: 'slow',    ms: 400 },
    { id: 'languid', label: 'languid', ms: 700 },
  ];

  const CURVES = [
    { id: 'linear',   label: 'linear',   css: 'linear' },
    { id: 'ease-out', label: 'ease-out', css: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { id: 'ease-in',  label: 'ease-in',  css: 'cubic-bezier(0.55, 0, 1, 0.45)' },
    { id: 'in-out',   label: 'ease-in-out', css: 'cubic-bezier(0.77, 0, 0.175, 1)' },
    { id: 'overshoot', label: 'overshoot', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  ];

  /* --- cost tiers ------------------------------------------------------
     0002's pipeline, used here as a readout and never as a scolding.
     The page reports the tier; it does not have an opinion about it. */
  const TIER = { compositor: 0, paint: 1, layout: 2 };

  /* --- the words -------------------------------------------------------
     `slot` is the transform channel a word claims, or null. Two words
     holding the same slot cannot both be on.

     emit(v) -> { decls, fns } where fns is keyed by slot. */

  const WORDS = [
    {
      id: 'lift', verb: 'lift', gloss: 'rises toward you',
      cost: 'compositor', slot: 'translate',
      knobs: { amount: { label: 'by', min: 1, max: 12, step: 1, def: 2, unit: 'px' } },
      emit: (v) => ({ fns: { translate: `translateY(-${v.amount}px)` } }),
    },
    {
      id: 'sink', verb: 'sink', gloss: 'presses down away from you',
      cost: 'compositor', slot: 'translate',
      knobs: { amount: { label: 'by', min: 1, max: 12, step: 1, def: 1, unit: 'px' } },
      emit: (v) => ({ fns: { translate: `translateY(${v.amount}px)` } }),
    },
    {
      id: 'grow', verb: 'grow', gloss: 'gets bigger in place',
      cost: 'compositor', slot: 'scale',
      knobs: { amount: { label: 'by', min: 1, max: 20, step: 1, def: 4, unit: '%' } },
      emit: (v) => ({ fns: { scale: `scale(${(1 + v.amount / 100).toFixed(3)})` } }),
    },
    {
      id: 'shrink', verb: 'shrink', gloss: 'gets smaller in place',
      cost: 'compositor', slot: 'scale',
      knobs: { amount: { label: 'by', min: 1, max: 20, step: 1, def: 3, unit: '%' } },
      emit: (v) => ({ fns: { scale: `scale(${(1 - v.amount / 100).toFixed(3)})` } }),
    },
    {
      id: 'fade', verb: 'fade', gloss: 'loses opacity',
      cost: 'compositor', slot: 'opacity',
      knobs: { amount: { label: 'to', min: 10, max: 95, step: 5, def: 70, unit: '%' } },
      emit: (v) => ({ decls: { opacity: `${(v.amount / 100).toFixed(2)}` } }),
    },
    {
      id: 'darken', verb: 'darken', gloss: 'the fill goes darker',
      cost: 'paint', slot: 'filter',
      knobs: { amount: { label: 'by', min: 2, max: 40, step: 2, def: 12, unit: '%' } },
      emit: (v) => ({ decls: { filter: `brightness(${(1 - v.amount / 100).toFixed(2)})` } }),
    },
    {
      id: 'lighten', verb: 'lighten', gloss: 'the fill goes lighter',
      cost: 'paint', slot: 'filter',
      knobs: { amount: { label: 'by', min: 2, max: 40, step: 2, def: 14, unit: '%' } },
      emit: (v) => ({ decls: { filter: `brightness(${(1 + v.amount / 100).toFixed(2)})` } }),
    },
    {
      id: 'shadow', verb: 'shadow', gloss: 'elevation under it',
      cost: 'paint', slot: 'shadow',
      knobs: { amount: { label: 'elevation', min: 0, max: 24, step: 2, def: 10, unit: 'px' } },
      emit: (v) => ({
        decls: {
          'box-shadow': v.amount === 0
            ? 'none'
            : `0 ${Math.round(v.amount / 2.5)}px ${v.amount}px rgba(0, 0, 0, 0.24)`,
        },
      }),
    },
    {
      id: 'tint', verb: 'tint', gloss: 'the fill shifts colour',
      cost: 'paint', slot: 'bg',
      knobs: {},
      emit: () => ({ decls: { 'background-color': 'var(--accent-hover)' } }),
    },
    {
      id: 'ring', verb: 'ring', gloss: 'an outline appears',
      cost: 'paint', slot: 'ring',
      knobs: { amount: { label: 'offset', min: 0, max: 8, step: 1, def: 3, unit: 'px' } },
      emit: (v) => ({
        decls: { outline: '3px solid var(--accent)', 'outline-offset': `${v.amount}px` },
      }),
    },

    /* --- words that write both ends ------------------------------------
       These belong to things that live off screen. The knob is on the
       *resting* value, because that is the interesting number: how far away
       it waits, how invisible it is before it arrives. */
    {
      id: 'slide', verb: 'slide', gloss: 'comes in from the edge',
      cost: 'compositor', slot: 'translate',
      knobs: { from: { label: 'from', min: 10, max: 100, step: 5, def: 100, unit: '%' } },
      emit: (v) => ({
        fns: { translate: 'translateX(0)' },
        restFns: { translate: `translateX(${v.from}%)` },
      }),
    },
    {
      id: 'fade-in', verb: 'fade in', gloss: 'arrives from transparent',
      cost: 'compositor', slot: 'opacity',
      knobs: { from: { label: 'from', min: 0, max: 80, step: 5, def: 0, unit: '%' } },
      emit: (v) => ({
        decls: { opacity: '1' },
        rest: { opacity: `${(v.from / 100).toFixed(2)}` },
      }),
    },
    {
      id: 'swell', verb: 'scale up', gloss: 'grows into place',
      cost: 'compositor', slot: 'scale',
      knobs: { from: { label: 'from', min: 80, max: 99, step: 1, def: 96, unit: '%' } },
      emit: (v) => ({
        fns: { scale: 'scale(1)' },
        restFns: { scale: `scale(${(v.from / 100).toFixed(2)})` },
      }),
    },
    {
      id: 'dim', verb: 'dim', gloss: 'the page behind darkens',
      cost: 'compositor', slot: 'opacity',
      knobs: { amount: { label: 'to', min: 10, max: 100, step: 5, def: 100, unit: '%' } },
      emit: (v) => ({
        decls: { opacity: `${(v.amount / 100).toFixed(2)}` },
        rest: { opacity: '0' },
      }),
    },
  ];

  /* --- the objects -----------------------------------------------------
     One for now. A scene is markup plus base CSS; `targets` names the
     elements a word may be attached to, which is the whole of "which
     thing moves" as an act rather than a claim.

     Selectors are written twice on purpose: `real` is the pseudo-class a
     shipped button actually uses, `mirror` is a class the stage can add
     so the moment can be replayed without a hand on the pointer. The
     code panel prints `real` only — the mirror is scaffolding and does
     not belong in the receipt. */

  const BUTTON = {
    id: 'button',
    noun: 'Button',
    family: 'ui',
    promise: 'a control that answers the hand',
    lesson: { id: 'D004', title: 'The button', href: 'D004-the-button.html' },

    /* `{}` is where the moment's pseudo-class goes, and it is a pair of
       characters a selector cannot otherwise contain. The pseudo always lands
       on the button even when the word is attached to the label — the label
       has no hover state of its own, and pretending it does would generate CSS
       that silently never matches. */
    targets: [
      { id: 'button', label: 'the button', tpl: '.save{}' },
      { id: 'label', label: 'the label', tpl: '.save{} > span' },
    ],

    /* The last moment on every object is the resting rule. It holds no words —
       rest is where the words are *absent* — and what it owns is the timing on
       the way back. In CSS that is exactly one declaration block, the one
       without the pseudo-class, and giving it its own row is the only way the
       page can show that going and coming back are two different numbers. */
    moments: [
      { id: 'hover', label: 'Hover', real: ':hover', mirror: '.is-hover',
        blurb: 'the pointer is over it, nothing has been committed' },
      { id: 'press', label: 'Press', real: ':active', mirror: '.is-press',
        blurb: 'the finger is down and the button has not let go' },
      { id: 'focus', label: 'Focus', real: ':focus-visible', mirror: '.is-focus',
        blurb: 'the keyboard is here' },
      { id: 'return', label: 'Return', rest: true, real: '', mirror: '',
        defaults: { duration: 'fast', curve: 'ease-out' },
        blurb: 'the pointer has left and it is on its way back' },
    ],

    /* The scene is a plausible fragment, not a page: enough context that a
       shadow has something to sit on and a tint has something to be tinted
       against. `line-height` is set explicitly because the sheet's serif 1.65
       makes every UI specimen read like prose (the D012 note). */
    html: `
      <div class="card">
        <p class="cap">Billing</p>
        <div class="field">ada@okafor.studio</div>
        <div class="row">
          <button type="button" class="save"><span>Save changes</span></button>
          <button type="button" class="ghost">Cancel</button>
        </div>
      </div>`,

    css: `
      .card { border: 1px solid var(--rule); border-radius: 9px; background: var(--paper);
              padding: 0.9rem; display: grid; gap: 0.5rem; font-family: var(--sans);
              line-height: 1.35; }
      .cap { font: 600 0.6rem/1.4 var(--sans); text-transform: uppercase;
             letter-spacing: 0.09em; color: var(--ink-faint); margin: 0; }
      .field { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-sunk);
               padding: 0.4rem 0.55rem; font-size: 0.78rem; color: var(--ink-soft); }
      .row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; }
      .save { border: 1px solid var(--accent); border-radius: 7px; background: var(--accent);
              color: var(--paper); font: 600 0.8rem/1.2 var(--sans);
              padding: 0.5rem 0.85rem; cursor: pointer; outline: none;
              display: inline-flex; align-items: center; }
      .ghost { border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
               color: var(--ink-soft); font: 500 0.78rem/1.2 var(--sans);
               padding: 0.5rem 0.75rem; cursor: pointer; }`,

    /* Which words are offered where. Not a restriction on what is possible —
       every word would apply — but a moment that offers ten words is a menu,
       and a moment that offers five is a decision. */
    offers: {
      hover: ['lift', 'grow', 'lighten', 'tint', 'shadow', 'fade'],
      press: ['sink', 'shrink', 'darken', 'shadow', 'fade'],
      focus: ['ring', 'lift', 'grow', 'tint', 'shadow'],
      return: [],
    },

    /* What a fresh page starts with. Something has to be on screen moving
       before she touches anything — an empty bench is not an instrument. */
    seed: {
      hover: [{ word: 'lift', target: 'button', values: { amount: 2 } },
              { word: 'shadow', target: 'button', values: { amount: 10 } }],
      press: [{ word: 'sink', target: 'button', values: { amount: 1 } },
              { word: 'darken', target: 'button', values: { amount: 12 } }],
      focus: [{ word: 'ring', target: 'button', values: { amount: 3 } }],
    },

    defaults: { duration: 'fast', curve: 'ease-out' },
  };

  /* --- the drawer -------------------------------------------------------
     The object that made the resting rule earn its own row. A button's rest
     state is the button; a drawer's rest state is a panel that is not on
     screen, and everything interesting about it is written there — how far
     off it waits, how invisible. Opening and closing are two different
     numbers on two different rules, which is the whole of Lesson 0005 said
     as a layout rather than as an argument. */

  const DRAWER = {
    id: 'drawer',
    noun: 'Drawer',
    family: 'ui',
    promise: 'a surface that comes from somewhere and goes back there',
    lesson: { id: 'D002', title: 'Where things live when they are off screen',
              href: 'D002-where-things-live.html' },

    /* The class lands on the container, not on the panel, because one flag has
       to move two elements — the panel and the scrim — and that is how the
       markup would really be written. */
    targets: [
      { id: 'panel', label: 'the panel', tpl: '.app{} .panel' },
      { id: 'scrim', label: 'the scrim', tpl: '.app{} .scrim' },
    ],

    moments: [
      { id: 'open', label: 'Open', real: '.is-open', mirror: '.is-open',
        defaults: { duration: 'medium', curve: 'ease-out' },
        blurb: 'it is arriving, and the page behind is going quiet' },
      { id: 'close', label: 'Close', rest: true, real: '', mirror: '',
        defaults: { duration: 'fast', curve: 'ease-in' },
        blurb: 'it is leaving. Nothing is declared here — only how long it takes' },
    ],

    /* Clicking inside the stage really opens it: the trigger, the scrim and
       Apply all toggle the class, so the drawer can be driven by hand and run
       the printed transitions rather than the scrubbed copy of them. */
    toggle: { host: '.app', cls: 'is-open', on: '.open, .apply, .scrim' },

    html: `
      <div class="app">
        <div class="topbar"><span class="brand">Inbox</span>
          <button type="button" class="open">Filters</button></div>
        <div class="lines"><span></span><span></span><span></span></div>
        <div class="scrim"></div>
        <aside class="panel">
          <p class="ptitle">Filters</p>
          <div class="opt">Unread</div>
          <div class="opt">Has attachment</div>
          <button type="button" class="apply">Apply</button>
        </aside>
      </div>`,

    /* Fixed height, because the stage is one of two being compared and a scene
       that resizes moves the other one. The panel is *not* parked off screen
       here — that is the `slide` word's job, and taking the word away should
       leave a drawer that is simply there, not a broken one. */
    css: `
      .app { position: relative; height: 176px; overflow: hidden; border-radius: 9px;
             border: 1px solid var(--rule); background: var(--paper);
             font-family: var(--sans); line-height: 1.35; }
      .topbar { display: flex; align-items: center; justify-content: space-between;
                gap: 0.5rem; padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--rule); }
      .brand { font: 600 0.74rem/1.2 var(--sans); color: var(--ink); }
      .open { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
              color: var(--ink-soft); font: 500 0.7rem/1.2 var(--sans);
              padding: 0.28rem 0.5rem; cursor: pointer; }
      .lines { padding: 0.6rem; display: grid; gap: 0.5rem; }
      .lines span { display: block; height: 0.5rem; border-radius: 999px; background: var(--rule); }
      .lines span:nth-child(2) { width: 78%; }
      .lines span:nth-child(3) { width: 56%; }
      .scrim { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5);
               opacity: 0; pointer-events: none; }
      .app.is-open .scrim { pointer-events: auto; }
      .panel { position: absolute; top: 0; right: 0; bottom: 0; width: 62%;
               background: var(--paper-sunk); border-left: 1px solid var(--rule);
               padding: 0.6rem; display: grid; gap: 0.4rem; align-content: start; }
      .ptitle { font: 600 0.6rem/1.4 var(--sans); text-transform: uppercase;
                letter-spacing: 0.09em; color: var(--ink-faint); margin: 0; }
      .opt { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
             padding: 0.32rem 0.45rem; font-size: 0.72rem; color: var(--ink-soft); }
      .apply { margin-top: 0.15rem; justify-self: start; border: 1px solid var(--accent);
               border-radius: 7px; background: var(--accent); color: var(--paper);
               font: 600 0.74rem/1.2 var(--sans); padding: 0.34rem 0.6rem; cursor: pointer; }`,

    offers: {
      open: ['slide', 'fade-in', 'swell', 'dim', 'shadow'],
      close: [],
    },

    /* Which element a word lands on when it is switched on. Without this,
       `dim` would attach to the panel — the first target — and quietly do the
       wrong thing to the right property. */
    wordTarget: { dim: 'scrim' },

    seed: {
      open: [{ word: 'slide', target: 'panel', values: { from: 100 } },
             { word: 'dim', target: 'scrim', values: { amount: 100 } }],
    },

    defaults: { duration: 'medium', curve: 'ease-out' },
  };

  window.COMPOSE_CATALOGUE = {
    durations: DURATIONS,
    curves: CURVES,
    tier: TIER,
    words: WORDS,
    wordsById: Object.fromEntries(WORDS.map((w) => [w.id, w])),
    objects: [BUTTON, DRAWER],
    families: [
      { id: 'ui', label: 'Product UI' },
      { id: 'hand', label: 'Direct manipulation' },
      { id: 'page', label: 'Expressive page' },
    ],
  };
})();
