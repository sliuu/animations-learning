/* ============================================================
   state-lab.js — a button as a state machine, with each state
   switchable off.

   Why this exists: D004 argues that a button is not one
   animation but a sequence of promises, and that the states
   nobody argues about in review are the ones that carry the
   feedback loop. An essay can assert that. The only way to
   *feel* it is to remove one promise and press the button
   anyway.

   So the knob is design-level, as a D lesson requires: not a
   duration, not a curve — which states have been designed at
   all. Turn press off and click. Nothing pushes back. That
   half-second of doubt is the whole lesson and it cannot be
   written down.

   The failure is silent by construction — a missing state looks
   exactly like a state that has not happened yet — so per the
   authoring rule there is a verdict panel that names, in words,
   what each state said or failed to say.

   Layout jump: the label changes across rest / pending /
   success, so the button carries a min-width wide enough for
   the longest of them and the verdict rows carry a min-height.
   Nothing in here reflows.

   Reduced motion: state feedback is information, not
   decoration — a user who has asked for less motion still needs
   to know the click landed. So the states all remain and only
   their *transitions* collapse to near-instant, and the pending
   spinner stops spinning and says the word instead. This is the
   distinction 0009 draws: cut the movement, never the message.

   Usage:
     <div data-state-lab data-title="Five promises, five switches"></div>
   ============================================================ */

(() => {
  let uid = 0;

  /* Order is chronological, which is also roughly the order of importance:
     the earliest promise is the one whose absence hurts most. */
  const STATES = [
    { id: 'hover',   name: 'Hover',
      on:  'says <i>this is pressable</i> — and which one you are about to press.',
      off: 'says nothing. It is a rectangle with a word in it until you click.' },
    { id: 'focus',   name: 'Focus',
      on:  'says <i>the keyboard is here</i>, and exactly where.',
      off: 'says nothing. Tab through the form and you are lost immediately.' },
    { id: 'press',   name: 'Press',
      on:  'says <i>heard you</i> — and says it before the server has any opinion.',
      off: 'says nothing. This is the gap people fill with a second click.' },
    { id: 'pending', name: 'Pending',
      on:  'says <i>working</i> — and <i>stop pressing me</i>, at once.',
      off: 'says nothing for 900&nbsp;ms. The screen is the one from before the click.' },
    { id: 'success', name: 'Success',
      on:  'says <i>done</i>, and keeps saying it long enough to be read.',
      off: 'says nothing. It goes quietly back to how it looked before.' },
  ];

  function injectStyles() {
    if (document.getElementById('state-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'state-lab-styles';
    s.textContent = `
    .sm { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .sm { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .sm-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .sm-body { display: grid; gap: 1.2rem; padding: 1.3rem 1.1rem; background: var(--paper); }
    /* Two columns only above the full-bleed breakpoint: between 780 and 1000 the
       verdict column is narrow enough that the same line wraps to three lines when a
       state is switched off and two when it isn't, which resizes the card under her. */
    @media (min-width: 1000px) { .sm-body { grid-template-columns: 17rem 1fr; align-items: start; } }

    /* --- the specimen -------------------------------------------------- */
    .sm-form { border: 1px solid var(--rule); border-radius: 9px; padding: 0.95rem;
               background: var(--paper-sunk); font-family: var(--sans);
               display: grid; gap: 0.55rem; }
    .sm-flabel { font: 600 0.6rem/1.4 var(--sans); text-transform: uppercase;
                 letter-spacing: 0.09em; color: var(--ink-faint); }
    .sm-field { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
                padding: 0.42rem 0.55rem; font: 400 0.78rem/1.4 var(--sans);
                color: var(--ink-soft); }
    .sm-row { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.25rem; }

    .sm-btn { position: relative; min-width: 8.6rem; border: 1px solid var(--accent);
              border-radius: 7px; background: var(--accent); color: var(--paper);
              font: 600 0.82rem/1.2 var(--sans); padding: 0.52rem 0.9rem; cursor: pointer;
              display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
              transition: transform 110ms var(--ease-out-strong),
                          background-color 140ms linear, box-shadow 140ms linear,
                          filter 140ms linear; }
    .sm-cancel { border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
                 color: var(--ink-soft); font: 500 0.8rem/1.2 var(--sans);
                 padding: 0.52rem 0.8rem; cursor: pointer; }
    .sm-btn:focus-visible, .sm-cancel:focus-visible { outline: none; }

    /* Each treatment is gated on its own switch, so "designed" and "not designed"
       are the same button with fewer rules — not two different buttons. */
    /* The .is-* mirrors let a state be shown on demand. Every treatment is listed
       once, against both the real pseudo-class and its mirror, so what the demo
       shows you is the same rule the real button runs. */
    .sm[data-hover="on"] .sm-btn:hover:not(:disabled):not(.is-busy),
    .sm[data-hover="on"] .sm-btn.is-hover {
      filter: brightness(1.16); box-shadow: 0 5px 14px rgba(0,0,0,0.22);
      transform: translateY(-2px); }
    .sm[data-focus="on"] .sm-btn:focus-visible,
    .sm[data-focus="on"] .sm-btn.is-focus {
      outline: 3px solid var(--accent); outline-offset: 3px; }
    .sm[data-focus="on"] .sm-cancel:focus-visible {
      outline: 3px solid var(--accent); outline-offset: 3px; }
    .sm[data-press="on"] .sm-btn:active:not(:disabled):not(.is-busy),
    .sm[data-press="on"] .sm-btn.is-press {
      transform: scale(0.92) translateY(1px); filter: brightness(0.82); box-shadow: none; }

    .sm[data-pending="on"] .sm-btn.is-pending { filter: saturate(0.5) brightness(0.95);
                                                cursor: default; }
    .sm[data-pending="on"] .sm-btn.is-pending .sm-spin { display: inline-block; }
    .sm[data-success="on"] .sm-btn.is-success { background: var(--good); border-color: var(--good); }

    .sm-spin { display: none; width: 0.72rem; height: 0.72rem; border-radius: 50%;
               border: 2px solid rgba(255,255,255,0.4); border-top-color: var(--paper);
               animation: sm-spin 620ms linear infinite; }
    @keyframes sm-spin { to { transform: rotate(360deg); } }

    .sm-note { font: 400 0.72rem/1.45 var(--sans); color: var(--ink-faint); margin: 0.15rem 0 0; }

    /* --- the verdict --------------------------------------------------- */
    .sm-read { display: grid; gap: 0.3rem; align-content: start; }
    .sm-line { display: grid; grid-template-columns: 4.6rem 1fr; gap: 0.6rem;
               min-height: 3.3rem; align-items: baseline;
               padding: 0.34rem 0.5rem; border-radius: 6px;
               font: 400 0.79rem/1.45 var(--sans); color: var(--ink-faint);
               border: 1px solid transparent; }
    .sm-line b { font: 600 0.72rem/1.5 var(--sans); text-transform: uppercase;
                 letter-spacing: 0.07em; }
    .sm-line i { font-style: italic; color: inherit; }
    .sm-line[data-on="true"] { color: var(--ink-soft); }
    .sm-line[data-on="true"] b { color: var(--ink); }
    .sm-line[data-on="false"] b { color: var(--bad); }
    .sm-line.is-now { border-color: var(--rule); background: var(--paper-sunk); }

    .sm-code { grid-column: 1 / -1; margin-top: 0.2rem; }
    .sm-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .sm-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); font: 400 0.72rem/1.6 var(--mono);
                   color: var(--ink-soft); overflow-x: auto; white-space: pre; }

    .sm-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 0.9rem 1.1rem; border-top: 1px solid var(--rule);
               font-family: var(--sans); font-size: 0.8rem; background: var(--paper-sunk); }
    .sm-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .sm-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .sm-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-faint);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .sm-seg button:hover { border-color: var(--ink-faint); }
    .sm-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .sm-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .sm-btn { transition-duration: 1ms; }
      .sm[data-press="on"] .sm-btn:active:not(:disabled):not(.is-busy),
      .sm[data-press="on"] .sm-btn.is-press { transform: none; filter: brightness(0.78); }
      .sm-spin { animation: none; border-top-color: rgba(255,255,255,0.4); }
    }
    @media print { .sm-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'sm' + (++uid);
    const title = root.dataset.title || 'Five promises, five switches';
    const on = { hover: true, focus: true, press: true, pending: true, success: true };
    let busy = false;
    const timers = [];

    root.classList.add('sm');
    root.innerHTML = `
      <div class="sm-head"><span>${title}</span><span>click a state to see it &mdash; click again to remove it</span></div>
      <div class="sm-body">
        <div class="sm-form">
          <span class="sm-flabel">Project settings</span>
          <div class="sm-field">Quarterly report</div>
          <div class="sm-field">Visible to the team</div>
          <div class="sm-row">
            <button class="sm-btn" type="button" data-btn>
              <span class="sm-spin" aria-hidden="true"></span><span data-label>Save changes</span>
            </button>
            <button class="sm-cancel" type="button">Cancel</button>
          </div>
          <p class="sm-note">Each switch below plays its own state on this button. You can also hover it, tab into it, and hold the mouse down yourself.</p>
        </div>
        <div class="sm-read" aria-live="polite">
          ${STATES.map((s) => `
            <div class="sm-line" data-line="${s.id}" data-on="true">
              <b>${s.name}</b><span data-text></span>
            </div>`).join('')}
        </div>
        <details class="sm-code">
          <summary>The CSS behind it</summary>
          <pre data-code></pre>
        </details>
      </div>
      <div class="sm-foot">
        <span class="sm-cap">Designed states</span>
        <div class="sm-seg" data-seg role="group" aria-label="Which states are designed">
          ${STATES.map((s) => `<button type="button" data-v="${s.id}">${s.name}</button>`).join('')}
        </div>
        <button class="btn primary" type="button" data-run>Run the whole thing</button>
      </div>
    `;

    const btn = root.querySelector('[data-btn]');
    const label = root.querySelector('[data-label]');
    const runBtn = root.querySelector('[data-run]');
    const codeEl = root.querySelector('[data-code]');

    /* The receipt, not the argument: every switched-on state is four lines or
       fewer, and the absent ones are listed as absences so the cost of the
       whole system is legible at once. */
    const CSS = {
      hover:   '.btn:hover        { filter: brightness(1.16);\n                    transform: translateY(-2px); }',
      focus:   '.btn:focus-visible{ outline: 3px solid var(--accent);\n                    outline-offset: 3px; }',
      press:   '.btn:active       { transform: scale(0.92);\n                    filter: brightness(0.82); }',
      pending: '.btn[data-s=pending] { filter: saturate(0.5); }\n.btn[data-s=pending] .spinner { display: block; }',
      success: '.btn[data-s=success] { background: var(--good); }',
    };

    function paint() {
      STATES.forEach((s) => {
        root.dataset[s.id] = on[s.id] ? 'on' : 'off';
        const line = root.querySelector(`[data-line="${s.id}"]`);
        line.dataset.on = String(on[s.id]);
        line.querySelector('[data-text]').innerHTML = on[s.id] ? s.on : s.off;
      });
      root.querySelectorAll('.sm-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(!!on[b.dataset.v])));

      const has = STATES.filter((s) => on[s.id]);
      const lacks = STATES.filter((s) => !on[s.id]);
      codeEl.textContent =
        '.btn { transition: transform 110ms var(--ease-out-strong),\n'
        + '                   background-color 140ms linear; }\n\n'
        + (has.map((s) => CSS[s.id]).join('\n\n') || '/* nothing but the resting style */')
        + (lacks.length ? '\n\n/* not designed: ' + lacks.map((s) => s.id).join(', ') + ' */' : '');
    }

    function now(which) {
      root.querySelectorAll('.sm-line').forEach((l) =>
        l.classList.toggle('is-now', l.dataset.line === which));
    }

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function reset() {
      timers.splice(0).forEach(clearTimeout);
      btn.classList.remove('is-press', 'is-pending', 'is-success', 'is-busy',
                           'is-hover', 'is-focus');
      btn.blur();
      label.textContent = 'Save changes';
      now(null);
      busy = false;
      runBtn.disabled = false;
    }

    /* The sequence a real save goes through. Press is included even when its
       treatment is switched off — the *event* always happens, only the promise
       is missing, which is precisely the thing being demonstrated. */
    function sequence(fromPress) {
      busy = true;
      runBtn.disabled = true;
      const t0 = fromPress ? 0 : 520;
      if (!fromPress) { now('hover'); }
      at(t0, () => { now('press'); btn.classList.add('is-press'); });
      at(t0 + 150, () => {
        btn.classList.remove('is-press');
        btn.classList.add('is-pending', 'is-busy');
        if (on.pending) label.textContent = 'Saving';
        now('pending');
      });
      at(t0 + 1050, () => {
        btn.classList.remove('is-pending');
        btn.classList.add('is-success');
        label.textContent = on.success ? 'Saved' : 'Save changes';
        now('success');
      });
      at(t0 + 2250, reset);
    }

    btn.addEventListener('click', () => { if (!busy) sequence(true); });

    /* Switching a state is a knob, and a knob has to do something the instant it is
       turned. Hover and focus otherwise change nothing until the pointer or the tab
       key happens to be in the right place, which is how this lab shipped and why
       it read as broken: the click was silent both ways. So every toggle plays the
       state it just changed. Turned on, you see the treatment; turned off, you watch
       the same moment go by with nothing in it — which is the lesson. */
    const PREVIEW = {
      hover:   { cls: 'is-hover', ms: 1200 },
      focus:   { cls: 'is-focus', ms: 1500 },
      press:   { cls: 'is-press', ms: 520 },
      pending: { cls: 'is-pending is-busy', ms: 1300, label: 'Saving' },
      success: { cls: 'is-success', ms: 1300, label: 'Saved' },
    };

    function preview(which) {
      const p = PREVIEW[which];
      busy = true;
      runBtn.disabled = true;
      now(which);
      btn.classList.add(...p.cls.split(' '));
      if (p.label && on[which]) label.textContent = p.label;
      at(p.ms, reset);
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.sm-seg button');
      if (seg) {
        reset();
        on[seg.dataset.v] = !on[seg.dataset.v];
        paint();
        preview(seg.dataset.v);
        return;
      }
      if (e.target.closest('[data-run]') && !busy) { btn.focus(); sequence(false); }
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-state-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
