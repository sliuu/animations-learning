/* ============================================================
   appear-lab.js — four ways to invent a "before".

   A transition interpolates between two computed values. A row
   that has just been appended has exactly one: its first
   computed style is also its final style. So the plain-transition
   mode here is not a broken demo — it is the faithful, verbatim,
   entirely reasonable-looking code that everybody writes first,
   and it does nothing at all.

   That failure is silent, so the lab instruments it: after every
   insert it reads row.getAnimations() and prints how many
   transitions or animations the browser actually created. "0"
   is the whole argument. The other three modes each manufacture
   the missing first value a different way and print the count
   that proves they did.

   Rows are APPENDED, never prepended: a new row at the top would
   shove every existing row down with no animation, and the reader
   would be looking at a layout jump instead of an entrance. The
   list also reserves its full four-row height up front so the
   frame never grows.

   Changing the mechanism clears the list on purpose. Switching
   the mode on a live list re-applies the animation property to
   rows that arrived under a different mechanism, which would put
   motion on screen that nobody pressed for.

   Reduced motion: the entrance IS the content here, so it is not
   suppressed — but nothing autoplays, nothing loops, and every
   frame on this stage is the result of a press. That is the
   accommodation, and it is the same stance as pattern-lab.

   Usage:
     <div data-appear-lab data-title="Append a row, four ways"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const ROWS = [
    ['Deploy finished', 'web &middot; production'],
    ['3 files changed', 'reviewed by Priya'],
    ['Build queued', 'waiting on a runner'],
    ['Invite accepted', 'sam joined the workspace'],
  ];

  const C = '<span class="ap-c">';

  const MODES = {
    none: {
      label: 'transition only',
      grade: 'nothing',
      say: 'The row&rsquo;s first computed style <em>was</em> its final style, so the transition never had a pair of values to interpolate between. It did not fail. It was never eligible to start &mdash; no error, no warning, nothing in the console.',
      code:
`.row {
  opacity: 1;
  transform: none;
  transition: opacity 380ms var(--ease-out-strong),
              transform 380ms var(--ease-out-strong);
}

` + C + '/* the entire script */</span>\nlist.append(row);',
    },
    start: {
      label: '@starting-style',
      grade: 'ran',
      say: '<code>@starting-style</code> supplies a before that exists only during the row&rsquo;s <em>first</em> style update, and is unreachable afterwards. The transition had two values, so it ran &mdash; and the rows already on screen were untouched, because only the new one has a first style update.',
      code:
`.row {
  opacity: 1;
  transform: none;
  transition: opacity 380ms var(--ease-out-strong),
              transform 380ms var(--ease-out-strong);
}

` + C + '/* read once, on the first style update, then gone */</span>\n' +
`<b>@starting-style {
  .row { opacity: 0; transform: translateY(8px); }
}</b>

list.append(row);`,
    },
    anim: {
      label: 'keyframe animation',
      grade: 'ran',
      say: 'A keyframe animation carries its own before in the <code>from</code> block. It never asks the browser what the element looked like a moment ago &mdash; which is exactly why it works on something that did not exist a moment ago.',
      code:
`<b>@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
}</b>
.row { animation: rise 380ms var(--ease-out-strong) both; }

` + C + '/* the entire script, again */</span>\nlist.append(row);',
    },
    flush: {
      label: 'force a frame (JS)',
      grade: 'ran',
      say: 'The row was appended already holding the start values, and reading <code>offsetWidth</code> forced the browser to resolve styles <em>now</em> &mdash; which makes that state a real computed value rather than one that gets collapsed away. Then the class comes off and the transition has its pair.',
      code:
`.row {
  opacity: 1;
  transform: none;
  transition: opacity 380ms var(--ease-out-strong),
              transform 380ms var(--ease-out-strong);
}
.row.pre { opacity: 0; transform: translateY(8px); }

row.classList.add('pre');
list.append(row);
<b>void row.offsetWidth;</b>   ` + C + '/* commit it as a real frame */</span>\n' +
`row.classList.remove('pre');`,
    },
  };

  const TAGS = {
    ran: 'the entrance ran',
    nothing: 'nothing ran',
  };

  function injectStyles() {
    if (document.getElementById('appear-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'appear-lab-styles';
    s.textContent = `
    .ap { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .ap { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .ap-head { padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper);
               display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .ap-warn { font-weight: 500; color: var(--bad); }

    .ap-body { display: grid; gap: 1.2rem; padding: 1.3rem 1.1rem; align-items: start;
               grid-template-columns: minmax(0, 1fr); background: var(--paper); }
    @media (min-width: 780px) { .ap-body { grid-template-columns: minmax(0, 1fr) 13rem; } }

    .ap-stage { display: grid; place-items: center; border: 1px solid var(--rule);
                border-radius: 9px; background: var(--paper-sunk); padding: 1.2rem; }

    .ap-frame { width: min(100%, 23rem); border: 1px solid var(--rule); border-radius: 11px;
                background: var(--paper); box-shadow: 0 1px 2px rgba(0,0,0,0.04);
                font-family: var(--sans); overflow: hidden; }
    .ap-bar { padding: 0.55rem 0.85rem; border-bottom: 1px solid var(--rule);
              font: 600 0.62rem/1.6 var(--sans); text-transform: uppercase;
              letter-spacing: 0.1em; color: var(--ink-faint); }

    /* Full height reserved up front. Four rows plus three gaps, so the frame
       is the same size empty as it is full and nothing below it ever moves. */
    .ap-list { position: relative; padding: 0.6rem;
               display: grid; gap: 0.45rem; align-content: start;
               grid-auto-rows: 3.2rem; min-height: calc(4 * 3.2rem + 3 * 0.45rem + 1.2rem); }

    .ap-empty { position: absolute; inset: 0; display: grid; place-items: center;
                font: 400 0.78rem/1.4 var(--sans); color: var(--ink-faint);
                pointer-events: none; }
    .ap-list.has-rows .ap-empty { opacity: 0; }

    .ap-row { display: grid; align-content: center; gap: 0.1rem;
              padding: 0 0.7rem; border: 1px solid var(--rule); border-radius: 8px;
              background: var(--paper-sunk); }
    .ap-t { font: 600 0.82rem/1.35 var(--sans); color: var(--ink); }
    .ap-s { font: 400 0.72rem/1.35 var(--sans); color: var(--ink-faint); }

    /* ---- the four mechanisms. Identical values in all four: 380ms,
       ease-out-strong, 8px of travel, opacity 0 to 1. The only thing that
       differs is where the "0" is allowed to live. ---- */

    .ap-list[data-mode="none"] .ap-row,
    .ap-list[data-mode="start"] .ap-row,
    .ap-list[data-mode="flush"] .ap-row {
      transition: opacity 380ms var(--ease-out-strong),
                  transform 380ms var(--ease-out-strong);
    }

    @starting-style {
      .ap-list[data-mode="start"] .ap-row { opacity: 0; transform: translateY(8px); }
    }

    @keyframes ap-rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
    .ap-list[data-mode="anim"] .ap-row {
      animation: ap-rise 380ms var(--ease-out-strong) both;
    }

    .ap-list[data-mode="flush"] .ap-row.ap-pre { opacity: 0; transform: translateY(8px); }

    .ap-side { display: grid; gap: 0.7rem; align-content: start; min-width: 0;
               font-family: var(--sans); font-size: 0.8rem; }
    .ap-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft);
              text-transform: uppercase; letter-spacing: 0.07em; }
    .ap-seg { display: grid; gap: 0.28rem; }
    .ap-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft); text-align: left;
                     font: 500 0.78rem/1.3 var(--sans); padding: 0.4rem 0.6rem; }
    .ap-seg button:hover { border-color: var(--ink-faint); }
    .ap-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .ap-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .ap-actions { display: grid; gap: 0.35rem; }
    .ap-actions .btn[disabled] { opacity: 0.45; cursor: default; }

    .ap-out { border-top: 1px solid var(--rule); padding: 0.9rem 1.1rem 1rem;
              font-family: var(--sans); background: var(--paper-sunk);
              /* Reserved, so a longer verdict never shifts the stage above it. */
              min-height: 8.5rem; }
    .ap-tag { display: inline-block; border-radius: 999px; padding: 0.16rem 0.55rem;
              font: 600 0.64rem/1.5 var(--sans); text-transform: uppercase;
              letter-spacing: 0.07em; border: 1px solid var(--rule); color: var(--ink-soft); }
    .ap-tag.ran { color: var(--good); border-color: color-mix(in srgb, var(--good) 45%, transparent); }
    .ap-tag.nothing { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, transparent); }
    .ap-count { font: 400 0.74rem/1.5 var(--mono); color: var(--ink-soft);
                margin-left: 0.55rem; }
    .ap-count b { font-weight: 600; color: var(--ink); }
    .ap-say { margin: 0.45rem 0 0; font: 400 0.86rem/1.55 var(--sans); color: var(--ink);
              max-width: 46rem; }

    .ap-code { margin-top: 0.7rem; }
    .ap-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .ap-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); overflow-x: auto; max-width: 46rem;
                   font: 400 0.72rem/1.6 var(--mono); color: var(--ink); white-space: pre; }
    .ap-code b { font-weight: 400; background: var(--accent-soft); border-radius: 3px;
                 padding: 0 0.15em; }
    .ap-c { color: var(--ink-faint); }

    @media print { .ap-side, .ap-actions { display: none; } }
    `;
    document.head.appendChild(s);
  }

  /* Two frames, because a transition is not created until the style update
     that follows the change. Reading at rAF time would report zero for every
     mode and turn the instrument into a liar. */
  function afterTwoFrames(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function classify(el) {
    const all = el.getAnimations();
    let anims = 0;
    let trans = 0;
    all.forEach((a) => {
      const isTrans = typeof CSSTransition !== 'undefined'
        ? a instanceof CSSTransition
        : a.constructor.name === 'CSSTransition';
      if (isTrans) trans += 1; else anims += 1;
    });
    return { anims, trans, total: all.length };
  }

  function build(root) {
    const id = 'ap' + (++uid);
    const title = root.dataset.title || 'Append a row, four ways';
    const state = { mode: 'none', next: 0, busy: false };

    root.classList.add('ap');
    root.innerHTML = `
      <div class="ap-head">
        <span>${title}</span>
        <span class="ap-warn" data-warn hidden>This browser has no <code>@starting-style</code> &mdash; that mode will behave like the first one.</span>
      </div>
      <div class="ap-body">
        <div class="ap-stage">
          <div class="ap-frame">
            <div class="ap-bar">Activity</div>
            <div class="ap-list" data-list data-mode="none">
              <div class="ap-empty" data-empty>nothing here yet</div>
            </div>
          </div>
        </div>
        <div class="ap-side">
          <span class="ap-cap">How the row arrives</span>
          <div class="ap-seg" data-seg role="group" aria-label="Entrance mechanism">
            ${Object.keys(MODES).map((k) =>
              `<button type="button" data-v="${k}">${MODES[k].label}</button>`).join('')}
          </div>
          <div class="ap-actions">
            <button class="btn primary" type="button" data-add>Add a row</button>
            <button class="btn" type="button" data-all>Add all four for me</button>
            <button class="btn" type="button" data-reset>Clear</button>
          </div>
        </div>
      </div>
      <div class="ap-out" aria-live="polite">
        <span class="ap-tag" data-tag></span><span class="ap-count" data-count></span>
        <p class="ap-say" data-say></p>
        <details class="ap-code">
          <summary>The code behind it</summary>
          <pre data-code></pre>
        </details>
      </div>
    `;

    const list = root.querySelector('[data-list]');
    const empty = root.querySelector('[data-empty]');
    const tagEl = root.querySelector('[data-tag]');
    const countEl = root.querySelector('[data-count]');
    const sayEl = root.querySelector('[data-say]');
    const codeEl = root.querySelector('[data-code]');
    const addBtn = root.querySelector('[data-add]');
    const allBtn = root.querySelector('[data-all]');

    if (typeof CSSStartingStyleRule === 'undefined') {
      root.querySelector('[data-warn]').hidden = false;
    }

    function paint() {
      root.querySelectorAll('.ap-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.mode)));
      const m = MODES[state.mode];
      tagEl.className = 'ap-tag';
      tagEl.textContent = 'press Add a row';
      countEl.textContent = '';
      sayEl.innerHTML = m.say;
      codeEl.innerHTML = m.code;
      const full = state.next >= ROWS.length;
      addBtn.disabled = full;
      allBtn.disabled = state.next > 0;
      addBtn.textContent = full ? 'List is full' : 'Add a row';
    }

    function report(row) {
      const m = MODES[state.mode];
      const { anims, trans } = classify(row);
      tagEl.className = 'ap-tag ' + (anims + trans ? 'ran' : 'nothing');
      tagEl.textContent = anims + trans ? TAGS.ran : TAGS.nothing;
      const bits = [];
      if (trans) bits.push(`<b>${trans}</b> transition${trans === 1 ? '' : 's'}`);
      if (anims) bits.push(`<b>${anims}</b> animation${anims === 1 ? '' : 's'}`);
      countEl.innerHTML = 'getAnimations() &rarr; ' + (bits.length ? bits.join(' + ') : '<b>0</b>');
      sayEl.innerHTML = m.say;
    }

    function addRow() {
      if (state.next >= ROWS.length) return;
      const [t, s] = ROWS[state.next++];
      const row = document.createElement('div');
      row.className = 'ap-row';
      row.innerHTML = `<span class="ap-t">${t}</span><span class="ap-s">${s}</span>`;

      if (state.mode === 'flush') {
        /* The start values have to be on the element before it is in the
           document, and the read has to happen before they come off. */
        row.classList.add('ap-pre');
        list.appendChild(row);
        void row.offsetWidth;
        row.classList.remove('ap-pre');
      } else {
        list.appendChild(row);
      }

      list.classList.add('has-rows');
      afterTwoFrames(() => report(row));
      const full = state.next >= ROWS.length;
      addBtn.disabled = full;
      addBtn.textContent = full ? 'List is full' : 'Add a row';
      allBtn.disabled = true;
    }

    function reset() {
      list.querySelectorAll('.ap-row').forEach((r) => r.remove());
      list.classList.remove('has-rows');
      state.next = 0;
      paint();
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.ap-seg button');
      if (seg) {
        if (state.busy) return;
        state.mode = seg.dataset.v;
        list.dataset.mode = state.mode;
        reset();
        return;
      }
      if (state.busy) return;
      if (e.target.closest('[data-add]')) { addRow(); return; }
      if (e.target.closest('[data-reset]')) { reset(); return; }
      if (e.target.closest('[data-all]')) {
        reset();
        state.busy = true;
        let i = 0;
        const tick = () => {
          addRow();
          i += 1;
          if (i < ROWS.length) setTimeout(tick, 260);
          else state.busy = false;
        };
        tick();
      }
    });

    void empty;
    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-appear-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
