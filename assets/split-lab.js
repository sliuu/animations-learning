/* ============================================================
   split-lab.js — the unit, the order, and the time it takes.

   Two pieces of copy — a hero word and a sentence of body text —
   split four ways, with the stagger and the order it runs in as
   the other two knobs. The claim is that the unit is a hierarchy
   decision, not a preset: whichever unit you split by is the
   thing the reader is being asked to wait for, and a paragraph
   has far more of them than a headline does. The order knob is
   the second half of that claim — which unit gets beat zero is a
   ranking, and it costs nothing to change.

   Deliberately NOT here: duration, curve, and mask versus
   fade-up. All three belong to text-arrival-lab, where the two
   panes differ so both can be judged at once. A toggle between
   two feelings in one pane is a sequential A/B, and the course
   does not accept those for feeling-claims.

   Usage:
     <div data-split-lab data-title="Split the text"></div>
   ============================================================ */

(function () {
  'use strict';
  let uid = 0;

  const HERO = 'KINETIC';
  const BODY = 'Motion can guide attention, but reading still has to feel like reading.';

  const DURATION = 520;
  const STEPWORD = { 0: 'together', 35: 'quick', 80: 'countable' };
  const DIRWORD = { first: 'first → last', last: 'last → first', centre: 'centre out' };

  function injectStyles() {
    if (document.getElementById('split-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'split-lab-styles';
    style.textContent = `
    .sp-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .sp-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .sp-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    /* The recipe, not a restatement of the title: the knobs read back as one
       phrase, which is the sentence she should be able to say out loud. */
    .sp-recipe { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); text-align: right; }

    /* gap:1px over the rule colour draws the divider, so the panes stay flush
       with the card's edges instead of floating inside it. */
    .sp-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .sp-pane { display: flex; flex-direction: column; min-height: 15.5rem;
               padding: 1.2rem 1.1rem 1rem; background: var(--paper); }
    .sp-pane h3 { margin: 0 0 0.9rem; font: 600 0.66rem/1.3 var(--sans);
                  letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }
    .sp-copy { margin: auto 0; font: 600 clamp(1.35rem, 3vw, 2.7rem)/1.05 var(--sans);
               letter-spacing: -0.035em; }
    .sp-copy.body { font: 400 clamp(1rem, 1.6vw, 1.25rem)/1.35 var(--serif); letter-spacing: 0; }
    .sp-unit { display: inline-block; opacity: 1; transform: none; }
    .sp-unit.word { white-space: nowrap; }
    .sp-unit.line { display: block; }
    /* Characters animate independently, but the *word* stays the browser's
       wrapping unit — this wrapper is what the lesson's last section is talking
       about. Without it a narrow window breaks lines mid-word and the lab
       teaches a wrapping bug instead of kinetic type. */
    .sp-charword { display: inline-block; white-space: nowrap; }
    /* One fixed duration and curve here on purpose: this lab is about how many
       beats there are and which one is first, and a second timing variable
       would let her change the answer without noticing she had. */
    .sp-playing .sp-unit { animation: sp-arrive 520ms var(--ease-out-strong) both;
                           animation-delay: calc(var(--i) * var(--step)); }
    @keyframes sp-arrive { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

    /* The count is arithmetic and sits with the thing it counts; the sentence
       about what the arithmetic means lives once, in the verdict below. */
    .sp-count { margin: 0.9rem 0 0; padding-top: 0.6rem; border-top: 1px solid var(--rule);
                font: 500 0.72rem/1.4 var(--mono); font-variant-numeric: tabular-nums;
                color: var(--ink-faint); }

    /* Reserve-and-centre: min-height is the tallest verdict this box holds at
       each width, measured, and the text is centred in it so a short verdict
       reads as room rather than as a hole. */
    .sp-readwrap { display: flex; align-items: center; min-height: 5.4rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .sp-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .sp-read b { color: var(--ink); font-weight: 600; }

    .sp-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .sp-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .sp-cap { min-width: 6.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .sp-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .sp-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .sp-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .sp-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .sp-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 7.05rem; }

    /* Four bands, all measured against the longest verdict the knobs can produce
       at that width — not guessed. Below 1000 the card stops being full-bleed but
       the board is still two columns, so only the verdict rewraps. */
    @media (max-width: 999px) { .sp-readwrap { min-height: 6.45rem; } }
    @media (max-width: 700px) {
      .sp-board { grid-template-columns: minmax(0, 1fr); }
      .sp-pane { min-height: 13rem; padding: 1.1rem 0.95rem 0.9rem; }
      .sp-readwrap { min-height: 8.9rem; }
      .sp-ctl { align-items: flex-start; }
      .sp-cap { min-width: 100%; }
      .sp-actions { margin-left: 0; }
      .sp-recipe { display: none; }
    }
    @media (max-width: 460px) { .sp-readwrap { min-height: 12.45rem; } }
    @media (max-width: 360px) { .sp-readwrap { min-height: 13.65rem; } }
    @media print { .sp-foot { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      /* 0009's stance, and the one this lesson argues for in prose: a stagger is
         exactly the "many small moving parts" the setting asks to be spared, and
         there is no honest short version of a letter-by-letter reveal. So the
         whole schedule goes and every unit is simply present. The sentence — the
         only thing here that was ever content — is untouched. */
      .sp-playing .sp-unit { animation: none; opacity: 1; transform: none; }
    }
    `;
    document.head.appendChild(style);
  }

  /* Lines are measured, not marked up.

     This used to split on a literal "|" that neither string contained, so
     "lines" produced one unit and was indistinguishable from "the whole thing"
     — the one mode the lesson opens by recommending. A rendered line is a fact
     about the font and the available width, so the only honest way to find one
     is to lay the words out and read their line boxes back. It also makes the
     lab demonstrate the claim the last section of the lesson makes: resize it
     and the split changes, because the lines did. */
  function measureLines(el, text) {
    el.innerHTML = '';
    const probes = text.trim().split(/\s+/).map((w, i, all) => {
      const span = document.createElement('span');
      span.textContent = w;
      el.appendChild(span);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
      return span;
    });
    const rows = [];
    probes.forEach((span) => {
      // getClientRects()[0] is the first line box the span occupies, which is
      // what decides which rendered line the word belongs to.
      const rect = span.getClientRects()[0];
      const top = rect ? Math.round(rect.top) : 0;
      const last = rows[rows.length - 1];
      if (last && Math.abs(last.top - top) < 4) last.words.push(span.textContent);
      else rows.push({ top, words: [span.textContent] });
    });
    return rows.map(r => r.words.join(' '));
  }

  function units(el, text, mode) {
    if (mode === 'whole') return [{ text, cls: 'whole' }];
    if (mode === 'lines') return measureLines(el, text).map(t => ({ text: t, cls: 'line' }));
    if (mode === 'words') return text.trim().split(/\s+/).map(t => ({ text: t, cls: 'word' }));
    return Array.from(text).map(ch => ({ text: ch, cls: 'char' }));
  }

  // The direction knob does not reorder the DOM — it reorders the *schedule*.
  // Which unit gets beat 0 is the whole decision, and nothing else changes.
  function beat(i, n, dir) {
    if (dir === 'last') return n - 1 - i;
    if (dir === 'centre') return Math.abs(i - (n - 1) / 2);
    return i;
  }

  function unit(text, cls, i, n, dir) {
    const span = document.createElement('span');
    span.className = 'sp-unit ' + cls;
    span.style.setProperty('--i', beat(i, n, dir));
    span.setAttribute('aria-hidden', 'true');
    span.textContent = text;
    return span;
  }

  function renderCopy(el, text, mode, dir) {
    if (mode === 'chars') {
      // Built word by word so the spaces between words are the original spaces
      // between wrappers, never a synthetic space after every character.
      const words = text.trim().split(/\s+/);
      const total = Array.from(text.replace(/\s+/g, '')).length;
      el.innerHTML = '';
      let i = 0;
      words.forEach((word, w) => {
        const wrap = document.createElement('span');
        wrap.className = 'sp-charword';
        Array.from(word).forEach((ch) => { wrap.appendChild(unit(ch, 'char', i, total, dir)); i += 1; });
        el.appendChild(wrap);
        if (w < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      return total;
    }

    const list = units(el, text, mode);
    el.innerHTML = '';
    list.forEach((u, i) => {
      el.appendChild(unit(u.text, u.cls, i, list.length, dir));
      if (mode === 'words' && i < list.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return list.length;
  }

  // "1 lines beats" was on screen for as long as the lab has existed. The unit
  // name is data, so it gets a singular and a plural rather than a suffix.
  const UNIT = {
    whole: ['unit', 'units'],
    lines: ['line', 'lines'],
    words: ['word', 'words'],
    chars: ['character', 'characters'],
  };
  const noun = (mode, n) => UNIT[mode][n === 1 ? 0 : 1];

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="sp-ctl"><span class="sp-cap">${caption}</span>
            <div class="sp-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('sp-lab');

    let mode = 'lines', step = 0, dir = 'first';

    root.innerHTML = `
      <div class="sp-head">
        <strong>${root.dataset.title || 'Split the text'}</strong>
        <span class="sp-recipe" data-recipe></span>
      </div>
      <div class="sp-board">
        <section class="sp-pane">
          <h3>Hero word</h3>
          <div class="sp-copy" data-role="hero"></div>
          <p class="sp-count" data-role="hero-read"></p>
        </section>
        <section class="sp-pane">
          <h3>Body copy</h3>
          <div class="sp-copy body" data-role="body"></div>
          <p class="sp-count" data-role="body-read"></p>
        </section>
      </div>
      <div class="sp-readwrap">
        <p class="sp-read" data-role="status" aria-live="polite"></p>
      </div>
      <div class="sp-foot">
        ${seg('mode', 'Split by', [['whole', 'the whole thing'], ['lines', 'lines'], ['words', 'words'], ['chars', 'characters']], 'lines')}
        ${seg('step', 'Per-unit delay', [['0', 'together'], ['35', 'quick'], ['80', 'countable']], '0')}
        ${seg('dir', 'Order', [['first', 'first → last'], ['last', 'last → first'], ['centre', 'centre out']], 'first')}
        <div class="sp-actions">
          <button class="btn primary" type="button" data-role="play">Play both</button>
        </div>
      </div>`;

    const hero = root.querySelector('[data-role="hero"]');
    const body = root.querySelector('[data-role="body"]');
    hero.setAttribute('aria-label', HERO);
    body.setAttribute('aria-label', BODY);

    function update() {
      const h = renderCopy(hero, HERO, mode, dir);
      const b = renderCopy(body, BODY, mode, dir);
      const total = step * Math.max(0, b - 1);

      root.style.setProperty('--step', step + 'ms');

      root.querySelector('[data-recipe]').textContent =
        `${mode === 'whole' ? 'unsplit' : mode} · ${STEPWORD[step]} · ${DIRWORD[dir]}`;
      root.querySelector('[data-role="hero-read"]').textContent =
        `${h} ${noun(mode, h)} · ${step}ms apart`;
      root.querySelector('[data-role="body-read"]').textContent =
        `${b} ${noun(mode, b)} · ${total}ms first to last`;

      // The order clause is only worth a sentence when the order is a choice:
      // with everything on beat zero there is no first unit to have ranked.
      // Stagger multiplies and duration does not — that is the whole arithmetic
      // lesson of this knob, and it is worth stating in the modes where the
      // number is small enough not to be alarming on its own.
      const pace = (step === 0 || mode === 'chars') ? '' :
        ` A ${step}ms gap looks like nothing once; across ${b} ${noun(mode, b)} it pushes the last start to <b>${total}ms</b>.`;

      const rank = step === 0 ? '' :
        dir === 'first' ? ' Reading order is the default ranking, and usually the honest one.'
        : dir === 'last' ? ' Backwards ranks the <b>end</b> of the phrase first &mdash; a claim about the phrase, so mean it.'
        : ' Centre-out ranks the middle first: a thing unfolding rather than a thing read. It suits a hero word and fights a sentence.';

      root.querySelector('[data-role="status"]').innerHTML = (
        mode === 'chars'
          ? `The hero is <b>${h} beats</b>; the sentence is <b>${b}</b> &mdash; <b>${total + DURATION}ms</b> before one sentence has finished arriving. The reader is waiting on letters, and letters are not the idea.`
          : mode === 'lines'
            ? 'Lines keep the paragraph readable while still giving the entrance a shape: the reader waits for <b>the next idea</b>, which is a thing worth waiting for.'
            : mode === 'words'
              ? `Words can carry a short headline. In the paragraph they are <b>${b} beats</b> for one sentence, and it is already starting to feel metronomic.`
              : 'One unit arrives as one thought. This is the baseline every split has to beat.') + pace + rank;
    }

    /* Re-split on resize, because a rendered line is not a durable unit. This is
       the section "Keep the reading intact" made testable: drag the window
       narrower and watch the line count go up on its own. Width only — a height
       change cannot move a line break, and reacting to one would loop. */
    if (window.ResizeObserver) {
      const board = root.querySelector('.sp-board');
      let lastWidth = 0;
      new ResizeObserver((entries) => {
        const w = Math.round(entries[0].contentRect.width);
        if (w === lastWidth) return;
        lastWidth = w;
        if (mode === 'lines') update();
      }).observe(board);
    }

    function play() {
      root.classList.remove('sp-playing');
      void root.offsetWidth;
      root.classList.add('sp-playing');
      // Under reduced motion nothing moves, and a play button that visibly does
      // nothing is the silent failure the course keeps warning about. Say what
      // happened instead of leaving her to wonder whether it is broken.
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.querySelector('[data-role="status"]').innerHTML =
          'Your reduced-motion setting keeps every unit present and removes the schedule entirely. ' +
          'The counters above still price the split you chose; this accommodation deliberately ' +
          'does not play it.';
      }
    }

    // Every knob replays. Two of the three — the delay and the order — change
    // nothing that is visible in a still frame, so a knob that only updated the
    // counters would be a knob that did nothing when turned.
    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          apply(btn.dataset.value);
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          update();
          play();
        }));
    }
    knob('mode', (v) => { mode = v; });
    knob('step', (v) => { step = Number(v); });
    knob('dir', (v) => { dir = v; });

    root.querySelector('[data-role="play"]').addEventListener('click', play);

    update();
  }

  document.querySelectorAll('[data-split-lab]').forEach(mount);
})();
