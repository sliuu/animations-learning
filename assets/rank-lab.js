/* ============================================================
   rank-lab.js — one card, one knob: which element moves.

   Everything about the motion is fixed. Same 420ms, same
   easing, same ten-pixel rise, same fade. The class is
   identical for all seven targets. The only thing that changes
   between one press and the next is *which element gets it* —
   which is the entire point, because if the outcome differs and
   the motion doesn't, the difference cannot be attributed to
   anything but rank.

   The two ends of the control matter as much as the middle.
   "Nothing" is the most common correct answer in shipped work
   and needs to be reachable without feeling like a null option.
   "Everything" is where the channel saturates — and because a
   real designer would stagger it rather than fire all six at
   once, this staggers, which surfaces the more interesting
   result: the stagger promotes whatever happens to be first in
   the DOM, and here that is the word "Revenue".

   Keyframe animation, not a class toggle on a transition — an
   animation restarts cleanly from remove-reflow-add and a
   transition does not.

   Reduced motion: the lesson is the motion, so it is not
   suppressed, but it never runs unpressed and it never loops.

   Usage:
     <div data-rank-lab data-title="What does this promote?"></div>
   ============================================================ */

(() => {
  let uid = 0;

  /* DOM order, which is also stagger order when "everything" is chosen. */
  const PARTS = ['label', 'value', 'delta', 'chart', 'action', 'export'];

  const NAMES = {
    nothing: 'nothing',
    label: 'the label',
    value: 'the number',
    delta: 'the change',
    chart: 'the chart',
    action: 'View report',
    export: 'Export CSV',
    everything: 'everything',
  };

  /* Hand-written, because "wrong" is a different shape for each one. Three of
     the seven are defensible rather than correct, and saying so is the lesson —
     a lab with one right answer teaches a rule, this one is teaching a
     question. */
  const VERDICTS = {
    nothing: ['fine', 'The card ranks by size, weight and colour alone. This is the most common correct answer in shipped work, and it is never the wrong one by default.'],
    label: ['wrong', 'The word <em>Revenue</em> now outranks the revenue. You have promoted a label above the thing it labels.'],
    value: ['agrees', 'The number is what the card is for, and now the motion says so too. Layout and motion are making the same claim.'],
    delta: ['choice', 'Promotes the change over the value — right for a card someone checks every morning, wrong for one they see once.'],
    chart: ['choice', 'Promotes the trend over the figure. The chart is the argument for the number, so leading with it is a real editorial position.'],
    action: ['choice', 'Promotes the action over the information. Correct if the card exists to send you somewhere, wrong if it exists to be read.'],
    export: ['wrong', 'The least important control on the card is now the most important thing on it. Nobody decided that; it happened because the motion was attached to the last thing built.'],
    everything: ['wrong', 'Six things move, so motion has stopped ranking anything — except the first one, which is promoted purely by being first in the file. Here that is the word <em>Revenue</em>.'],
  };

  /* What the chosen element's tag looks like once the class lands on it. The CSS
     above the line never changes; this is the only thing a choice edits, and
     seeing that is half the lesson. */
  const MARKUP = {
    nothing:    '&lt;!-- no element carries it --&gt;',
    label:      '&lt;span class="label <b>anim</b>"&gt;Revenue&lt;/span&gt;',
    value:      '&lt;span class="value <b>anim</b>"&gt;$48,290&lt;/span&gt;',
    delta:      '&lt;span class="delta <b>anim</b>"&gt;&#9650; 12.4%&lt;/span&gt;',
    chart:      '&lt;div class="chart <b>anim</b>"&gt;&lt;svg&gt;&hellip;&lt;/svg&gt;&lt;/div&gt;',
    action:     '&lt;button class="action <b>anim</b>"&gt;View report&lt;/button&gt;',
    export:     '&lt;span class="export <b>anim</b>"&gt;Export CSV&lt;/span&gt;',
    everything: '&lt;!-- all six, staggered 55ms apart --&gt;',
  };

  const TAGS = { agrees: 'agrees with the card', choice: 'an editorial choice', fine: 'no claim made', wrong: 'says the wrong thing' };

  function injectStyles() {
    if (document.getElementById('rank-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'rank-lab-styles';
    s.textContent = `
    .rk { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .rk { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .rk-head { padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .rk-body { display: grid; gap: 1.2rem; padding: 1.3rem 1.1rem; align-items: start;
               grid-template-columns: minmax(0, 1fr); background: var(--paper); }
    @media (min-width: 780px) { .rk-body { grid-template-columns: minmax(0, 1fr) 13rem; } }

    .rk-stage { display: grid; place-items: center; min-height: 17rem;
                border: 1px solid var(--rule); border-radius: 9px;
                background: var(--paper-sunk); padding: 1.2rem; }

    .rk-card { width: min(100%, 22rem); display: grid; gap: 0.35rem;
               padding: 1.1rem 1.15rem 1rem; border: 1px solid var(--rule);
               border-radius: 11px; background: var(--paper);
               box-shadow: 0 1px 2px rgba(0,0,0,0.04); font-family: var(--sans); }

    .rk-label { font: 600 0.62rem/1.6 var(--sans); text-transform: uppercase;
                letter-spacing: 0.1em; color: var(--ink-faint); }
    .rk-value { font-size: 2rem; font-weight: 620; color: var(--ink); line-height: 1.1;
                font-variant-numeric: tabular-nums; }
    .rk-delta { font-size: 0.78rem; font-weight: 550; color: var(--good); }
    .rk-chart { margin: 0.5rem 0 0.7rem; }
    .rk-chart svg { display: block; width: 100%; height: 46px; }
    .rk-row { display: flex; align-items: center; gap: 0.8rem; }
    .rk-action { border: 0; border-radius: 7px; background: var(--accent); color: var(--paper);
                 font: 600 0.78rem/1 var(--sans); padding: 0.55rem 0.85rem; cursor: default; }
    .rk-export { font: 500 0.76rem/1 var(--sans); color: var(--ink-faint);
                 text-decoration: underline; text-underline-offset: 3px; }

    @keyframes rk-rise {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: none; }
    }
    /* One class, one timing, seven possible targets. Nothing else varies. */
    .rk-card .anim { animation: rk-rise 420ms var(--ease-out-strong) both;
                     animation-delay: calc(var(--i, 0) * 55ms); }

    .rk-side { display: grid; gap: 0.7rem; align-content: start; min-width: 0;
               font-family: var(--sans); font-size: 0.8rem; }
    .rk-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft);
              text-transform: uppercase; letter-spacing: 0.07em; }
    .rk-seg { display: grid; gap: 0.28rem; }
    .rk-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft); text-align: left;
                     font: 500 0.78rem/1.3 var(--sans); padding: 0.4rem 0.6rem; }
    .rk-seg button:hover { border-color: var(--ink-faint); }
    .rk-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .rk-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .rk-out { border-top: 1px solid var(--rule); padding: 0.9rem 1.1rem 1rem;
              font-family: var(--sans); background: var(--paper-sunk);
              /* Reserved so a longer verdict never shifts the card above it. */
              min-height: 7rem; }
    .rk-tag { display: inline-block; border-radius: 999px; padding: 0.16rem 0.55rem;
              font: 600 0.64rem/1.5 var(--sans); text-transform: uppercase;
              letter-spacing: 0.07em; border: 1px solid var(--rule); color: var(--ink-soft); }
    .rk-tag.agrees { color: var(--good); border-color: color-mix(in srgb, var(--good) 45%, transparent); }
    .rk-tag.wrong  { color: var(--bad);  border-color: color-mix(in srgb, var(--bad) 45%, transparent); }
    .rk-tag.choice { color: var(--accent); border-color: var(--accent-soft); }
    .rk-say { margin: 0.45rem 0 0; font: 400 0.86rem/1.55 var(--sans); color: var(--ink);
              max-width: 46rem; }
    .rk-say em { font-style: italic; }

    .rk-code { margin-top: 0.7rem; }
    .rk-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .rk-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); overflow-x: auto; max-width: 46rem;
                   font: 400 0.72rem/1.6 var(--mono); color: var(--ink); }
    .rk-code b { font-weight: 400; background: var(--accent-soft); border-radius: 3px;
                 padding: 0 0.15em; }

    @media print { .rk-side, .rk-actions { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const SPARK = `<svg viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="0,36 50,30 100,33 150,22 200,25 250,12 300,8"
      fill="none" stroke="var(--accent)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="0,46 0,36 50,30 100,33 150,22 200,25 250,12 300,8 300,46"
      fill="var(--accent-soft)" stroke="none" opacity="0.45"/>
  </svg>`;

  function build(root) {
    const id = 'rk' + (++uid);
    const title = root.dataset.title || 'What does this promote?';
    const state = { pick: 'export', busy: false };

    root.classList.add('rk');
    root.innerHTML = `
      <div class="rk-head">${title}</div>
      <div class="rk-body">
        <div class="rk-stage">
          <div class="rk-card">
            <span class="rk-label" data-p="label">Revenue</span>
            <span class="rk-value" data-p="value">$48,290</span>
            <span class="rk-delta" data-p="delta">&#9650; 12.4% vs last month</span>
            <div class="rk-chart" data-p="chart">${SPARK}</div>
            <div class="rk-row">
              <button class="rk-action" type="button" data-p="action" tabindex="-1">View report</button>
              <span class="rk-export" data-p="export">Export CSV</span>
            </div>
          </div>
        </div>
        <div class="rk-side">
          <span class="rk-cap">What moves</span>
          <div class="rk-seg" data-seg role="group" aria-label="Which element moves">
            ${Object.keys(NAMES).map((k) =>
              `<button type="button" data-v="${k}">${NAMES[k]}</button>`).join('')}
          </div>
          <div class="rk-actions"><button class="btn primary" type="button" data-play>Play</button></div>
        </div>
      </div>
      <div class="rk-out" aria-live="polite">
        <span class="rk-tag" data-tag></span>
        <p class="rk-say" data-say></p>
        <details class="rk-code">
          <summary>The CSS behind it</summary>
          <pre data-code></pre>
        </details>
      </div>
    `;

    const card = root.querySelector('.rk-card');
    const tagEl = root.querySelector('[data-tag]');
    const codeEl = root.querySelector('[data-code]');
    const sayEl = root.querySelector('[data-say]');

    function paint() {
      root.querySelectorAll('.rk-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.pick)));
      const [grade, text] = VERDICTS[state.pick];
      tagEl.className = 'rk-tag ' + grade;
      tagEl.textContent = TAGS[grade];
      sayEl.innerHTML = text;
      codeEl.innerHTML =
        '<span style="opacity:.6">/* identical for all eight choices */</span>\n' +
        '@keyframes rise {\n' +
        '  from { opacity: 0; transform: translateY(10px); }\n' +
        '  to   { opacity: 1; transform: none; }\n' +
        '}\n' +
        '.anim { animation: rise 420ms var(--ease-out-strong) both; }\n\n' +
        '<span style="opacity:.6">&lt;!-- the only thing your choice edits --&gt;</span>\n' +
        MARKUP[state.pick];
    }

    function clear() {
      card.querySelectorAll('[data-p]').forEach((el) => {
        el.classList.remove('anim');
        el.style.removeProperty('--i');
      });
    }

    function play() {
      if (state.busy) return;
      clear();
      const targets = state.pick === 'nothing' ? []
        : state.pick === 'everything' ? PARTS
        : [state.pick];
      if (!targets.length) return;      /* verdict already says the card stays still */
      state.busy = true;
      targets.forEach((p, i) => {
        const el = card.querySelector(`[data-p="${p}"]`);
        el.style.setProperty('--i', i);
        void el.offsetWidth;
        el.classList.add('anim');
      });
      setTimeout(() => { clear(); state.busy = false; }, 460 + targets.length * 55);
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.rk-seg button');
      if (seg) {
        if (state.busy) return;
        state.pick = seg.dataset.v;
        clear();
        paint();
        return;
      }
      if (e.target.closest('[data-play]')) play();
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-rank-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
