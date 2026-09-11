/* ============================================================
   panel-lab.js — the same drawer, authored twice.

   Left pane: the transition model. You name a property, a
   duration and a curve, and the element carries them.

   Right pane: the state model — variants and a trigger, which
   is how Framer and every tool like it says the same thing.
   You draw the shut state, you draw the open state, you say
   what fires it, and the tool works out the animation from the
   difference.

   Both drawers do exactly the same thing on screen, which is
   the setup, not the point. The point is the reveal: press
   "what did it fill in?" and each side lists the decisions
   nobody made out loud. The left has two. The right has five.

   That asymmetry is the whole lesson in one control. Neither
   model is wrong and neither is lying; a tool that infers an
   animation from two states has simply moved the line between
   what you decide and what it decides, and the grey rows are
   the far side of that line.

   The spring is a real spring: springLinear() integrates the
   mass-spring-damper and samples it into a linear() easing,
   which is what a motion engine hands the browser too. So the
   numbers in the panel are the numbers on the stage, and 0008
   still describes what you are looking at.

   The panel is a stand-in for a properties panel, not a
   screenshot of one — Framer's UI moves, and the model under
   it is what this lab is about.

   Reduced motion: nothing animates, and the readout says the
   honest thing rather than letting the stage pretend it played.
   That absence is also one of the five rows.

   Usage:
     <div data-panel-lab data-title="The same drawer, said twice"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  const EASE_MS = 240;
  const EASE_CURVE = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const SPRING = { stiffness: 300, damping: 30, mass: 1 };

  // A real mass-spring-damper, integrated and then sampled into a linear()
  // easing. This is the same move a motion engine makes when it hands a
  // spring to the browser: physics up front, a sampled curve on the wire.
  function springLinear({ stiffness, damping, mass }) {
    const dt = 1 / 240;
    let x = 1, v = 0, t = 0;
    const samples = [];
    while (t < 4) {
      const a = (-stiffness * x - damping * v) / mass;
      v += a * dt;
      x += v * dt;
      t += dt;
      if (Math.round(t / dt) % 4 === 0) samples.push(1 - x);
      if (Math.abs(x) < 0.001 && Math.abs(v) < 0.001) break;
    }
    samples.push(1);
    const ms = Math.round(t * 1000);
    return { css: `linear(${samples.map(n => n.toFixed(4)).join(',')})`, ms };
  }

  const SPRING_EASE = springLinear(SPRING);

  const ORIGINS = {
    right: {
      label: 'the right edge',
      css: 'transform: translateX(100%)',
      variant: 'x: 100%',
      says: 'it lives off the right edge',
    },
    below: {
      label: 'below',
      css: 'transform: translateY(100%)',
      variant: 'y: 100%',
      says: 'it lives under the bottom of the screen',
    },
    place: {
      label: 'in place',
      css: 'opacity: 0; transform: scale(0.94)',
      variant: 'opacity: 0, scale: 0.94',
      says: 'it has no home anywhere — it just appears',
    },
  };

  function injectStyles() {
    if (document.getElementById('panel-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'panel-lab-styles';
    s.textContent = `
    .pn-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .pn-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .pn-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .pn-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    /* Two columns, at every width. The claim is that both models produce the
       same motion, and a claim about sameness that has to be scrolled between
       is not a comparison — it is a memory test. */
    .pn-board { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--rule); }
    .pn-pane { background: var(--paper); padding: 0.9rem 1rem 1rem; min-width: 0; }

    /* The two panes are a comparison, so their five bands have to start on the
       same line — a spec block that runs one line longer on the left pushes
       "CSS decided" out of step with "the tool decided" and the reader has to
       re-find the pairing. Subgrid hands both panes the board's own rows, so
       every band is as tall as the taller of the two. Guarded because without
       it the panes simply stack their own way, which is the current behaviour
       and not broken, only less aligned. */
    @supports (grid-template-rows: subgrid) {
      .pn-board { grid-template-rows: repeat(5, auto); }
      .pn-pane { display: grid; grid-row: span 5; grid-template-rows: subgrid; }
    }
    .pn-pname { margin: 0 0 0.15rem; font: 600 0.66rem/1.3 var(--sans); letter-spacing: 0.12em;
                text-transform: uppercase; color: var(--ink-faint); }
    .pn-psub { margin: 0 0 0.7rem; font: 400 0.7rem/1.4 var(--sans); color: var(--ink-soft);
               min-height: 2rem; }

    /* ----- the stage ----- */
    .pn-screen { position: relative; overflow: hidden; height: 10.5rem;
                 border: 1px solid var(--rule); border-radius: 8px; background: var(--paper-sunk); }
    .pn-bar { display: flex; align-items: center; gap: 0.4rem;
              padding: 0.4rem 0.55rem; background: var(--paper);
              border-bottom: 1px solid var(--rule);
              font: 600 0.68rem/1.2 var(--sans); color: var(--ink-soft); }
    .pn-dot { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--rule); }
    .pn-body { display: grid; gap: 0.3rem; padding: 0.55rem; }
    .pn-line { height: 0.4rem; border-radius: 3px; background: var(--paper); }
    .pn-line.a { width: 76%; } .pn-line.b { width: 54%; } .pn-line.c { width: 66%; }

    .pn-panel { position: absolute; background: var(--paper); border: 1px solid var(--rule);
                padding: 0.55rem 0.6rem;
                transition: transform var(--pn-dur) var(--pn-ease),
                            opacity var(--pn-dur) var(--pn-ease); }
    .pn-ptitle { margin: 0 0 0.4rem; font: 600 0.68rem/1.3 var(--sans); color: var(--ink); }
    .pn-panel span { display: block; height: 0.36rem; margin-top: 0.34rem; border-radius: 3px;
                     background: var(--paper-sunk); }

    /* One panel, three homes. The closed state is a rule per origin rather
       than an inline style, so the knob changes a state and not a number. */
    .pn-screen[data-origin="right"] .pn-panel { inset: 1.9rem 0 0 auto; width: 62%;
                                                border-width: 0 0 0 1px; transform: translateX(100%); }
    .pn-screen[data-origin="below"] .pn-panel { inset: auto 0 0 0; height: 62%;
                                                border-width: 1px 0 0; transform: translateY(100%); }
    .pn-screen[data-origin="place"] .pn-panel { left: 12%; right: 12%; top: 3.1rem;
                                                border-radius: 8px; opacity: 0;
                                                transform: scale(0.94); }
    .pn-screen[data-open="1"] .pn-panel { transform: none; opacity: 1; }

    /* ----- the authored spec ----- */
    .pn-spec { margin-top: 0.7rem; border: 1px solid var(--rule); border-radius: 7px;
               background: var(--paper-sunk); padding: 0.55rem 0.6rem;
               font: 500 0.7rem/1.55 var(--mono); color: var(--ink);
               min-height: 7.4rem; overflow-x: auto; }
    .pn-spec b { color: var(--accent); font-weight: 600; }
    .pn-spec i { color: var(--ink-faint); font-style: normal; }

    .pn-fill { margin-top: 0.5rem; display: grid; gap: 0.3rem; min-height: 8.6rem;
               align-content: start; }
    .pn-fname { font: 600 0.64rem/1.3 var(--sans); letter-spacing: 0.1em;
                text-transform: uppercase; color: var(--ink-faint); }
    .pn-frow { display: grid; grid-template-columns: minmax(0, 8rem) minmax(0, 1fr);
               gap: 0.5rem; padding: 0.28rem 0.45rem; border: 1px dashed var(--rule);
               border-radius: 6px; font: 400 0.68rem/1.4 var(--sans); color: var(--ink-faint); }
    .pn-frow b { color: var(--ink-soft); font-weight: 600; }
    .pn-hint { font: 400 0.7rem/1.45 var(--sans); color: var(--ink-faint); }

    .pn-readwrap { display: flex; align-items: center; min-height: 6.2rem;
                   padding: 0.85rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .pn-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .pn-read b { color: var(--ink); font-weight: 600; }
    .pn-read code { font: 500 0.76rem/1.3 var(--mono); color: var(--ink); }

    .pn-foot { display: grid; gap: 0.55rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .pn-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .pn-cap { min-width: 10.5rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .pn-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .pn-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.32rem 0.56rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.73rem/1.3 var(--sans); }
    .pn-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .pn-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .pn-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 11.15rem; }

    /* Reduced motion: the panels change state without travelling, and the
       readout names the absence. 0009 is why — a lab that ignored the
       setting would contradict the course it belongs to. */
    @media (prefers-reduced-motion: reduce) {
      .pn-panel { transition: none; }
    }

    @media (max-width: 900px) {
      .pn-pane { padding: 0.7rem 0.7rem 0.8rem; }
      .pn-spec { font-size: 0.64rem; min-height: 8.2rem; }
      .pn-frow { grid-template-columns: minmax(0, 1fr); gap: 0.1rem; }
      .pn-fill { min-height: 12rem; }
    }
    @media (max-width: 700px) {
      .pn-ctl { align-items: flex-start; }
      .pn-cap { min-width: 100%; }
      .pn-actions { margin-left: 0; }
      .pn-state { display: none; }
      .pn-psub { min-height: 3.4rem; font-size: 0.66rem; }
      .pn-readwrap { min-height: 8.6rem; }
    }
    @media (max-width: 480px) { .pn-readwrap { min-height: 11rem; } }
    @media print { .pn-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="pn-ctl"><span class="pn-cap">${caption}</span>
            <div class="pn-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function screen(side) {
    return `<div class="pn-screen" data-screen="${side}" data-origin="right" data-open="0">
        <div class="pn-bar"><span class="pn-dot"></span>Library</div>
        <div class="pn-body">
          <div class="pn-line a"></div><div class="pn-line b"></div>
          <div class="pn-line c"></div><div class="pn-line b"></div>
        </div>
        <aside class="pn-panel">
          <h4 class="pn-ptitle">Details</h4>
          <span></span><span></span><span></span>
        </aside>
      </div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('pn-lab');

    let origin = 'right';
    let motion = 'ease';
    let revealed = false;
    let open = false;

    root.innerHTML = `
      <div class="pn-head">
        <strong>${root.dataset.title || 'The same drawer, said twice'}</strong>
        <span class="pn-state" data-state>&mdash;</span>
      </div>
      <div class="pn-board">
        <section class="pn-pane">
          <h3 class="pn-pname">The transition model</h3>
          <p class="pn-psub">You name the property, the length and the shape of the move, and the
            element carries them.</p>
          ${screen('css')}
          <div class="pn-spec" data-spec-css></div>
          <div class="pn-fill" data-fill-css></div>
        </section>
        <section class="pn-pane">
          <h3 class="pn-pname">The state model</h3>
          <p class="pn-psub">You draw both states and say what fires it. The tool works the
            animation out from the difference.</p>
          ${screen('state')}
          <div class="pn-spec" data-spec-state></div>
          <div class="pn-fill" data-fill-state></div>
        </section>
      </div>
      <div class="pn-readwrap"><p class="pn-read" data-read aria-live="polite"></p></div>
      <div class="pn-foot">
        ${seg('origin', 'Where it comes from', [['right', 'the right edge'], ['below', 'below'],
              ['place', 'in place']], 'right')}
        ${seg('motion', 'How it moves', [['ease', 'Ease'], ['spring', 'Spring']], 'ease')}
        ${seg('reveal', 'What did it fill in?', [['0', 'hidden'], ['1', 'show me']], '0')}
        <div class="pn-actions">
          <button class="btn primary" type="button" data-toggle>Open both</button>
        </div>
      </div>`;

    const screens = [...root.querySelectorAll('[data-screen]')];
    const toggleBtn = root.querySelector('[data-toggle]');

    function apply() {
      const dur = motion === 'spring' ? SPRING_EASE.ms : EASE_MS;
      const ease = motion === 'spring' ? SPRING_EASE.css : EASE_CURVE;
      screens.forEach((s) => {
        s.dataset.origin = origin;
        s.dataset.open = open ? '1' : '0';
        s.style.setProperty('--pn-dur', dur + 'ms');
        s.style.setProperty('--pn-ease', ease);
      });
    }

    function specs() {
      const o = ORIGINS[origin];
      const timing = motion === 'spring'
        ? `<b>${SPRING_EASE.ms}ms</b> <i>(sampled from the spring)</i>`
        : `<b>${EASE_MS}ms</b> ${EASE_CURVE.replace('cubic-bezier', '')}`;

      root.querySelector('[data-spec-css]').innerHTML =
        `.details {<br>&nbsp;&nbsp;${o.css};<br>` +
        `&nbsp;&nbsp;transition: ${origin === 'place' ? 'opacity, transform' : 'transform'} ${timing};<br>}<br>` +
        `.details<b>.open</b> { ${origin === 'place' ? 'opacity: 1; transform: none' : 'transform: none'}; }`;

      root.querySelector('[data-spec-state]').innerHTML =
        `Variant <b>Shut</b> &nbsp;&rarr;&nbsp; ${o.variant}<br>` +
        `Variant <b>Open</b> &nbsp;&rarr;&nbsp; ${origin === 'place' ? 'opacity: 1, scale: 1' : 'x: 0, y: 0'}<br>` +
        `Trigger &nbsp;&nbsp;&nbsp;&nbsp;&rarr;&nbsp; Click &rarr; <b>Open</b><br>` +
        `Transition &rarr;&nbsp; <b>${motion === 'spring' ? 'Spring' : 'Ease'}</b>` +
        (motion === 'spring'
          ? ` <i>stiffness ${SPRING.stiffness} · damping ${SPRING.damping} · mass ${SPRING.mass}</i>`
          : ` <i>the panel&rsquo;s default</i>`);
    }

    // The rows nobody said out loud. Two on the left, five on the right —
    // and they are decisions in both places, not omissions in one.
    function fills() {
      const cssRows = [
        ['interrupted', 'reverses from wherever it is, because the browser owns the value'],
        ['reduced motion', 'nothing, unless you write the media query yourself'],
      ];
      const stateRows = [
        ['duration', motion === 'spring'
          ? `${SPRING_EASE.ms}ms, and you never typed it — it falls out of the physics`
          : `${EASE_MS}ms, chosen by the panel, not by you`],
        ['the curve', motion === 'spring'
          ? 'the shape of a spring at those three numbers'
          : 'an ease-out of the tool&rsquo;s choosing'],
        ['delay', '0 — and whether children follow or move as one'],
        ['interrupted', 'from where it is, because the engine is tracking the value'],
        ['reduced motion', 'whatever this panel does about it, which you have not been asked'],
      ];
      const render = (name, rows) => revealed
        ? `<span class="pn-fname">${name} decided</span>` + rows.map(([k, v]) =>
            `<span class="pn-frow"><b>${k}</b><span>${v}</span></span>`).join('')
        : `<span class="pn-fname">${name} decided</span>
           <span class="pn-hint">${rows.length} things you did not say out loud. Guess which,
           then press <b>show me</b>.</span>`;

      root.querySelector('[data-fill-css]').innerHTML = render('CSS', cssRows);
      root.querySelector('[data-fill-state]').innerHTML = render('The tool', stateRows);
    }

    function report(note) {
      apply();
      specs();
      fills();

      const o = ORIGINS[origin];
      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${o.label} · ${motion === 'spring' ? `spring ${SPRING_EASE.ms}ms` : `ease ${EASE_MS}ms`}` +
        (revealed ? ' · defaults shown' : '');

      const read = root.querySelector('[data-read]');
      if (reduced()) {
        read.innerHTML = `You have motion turned off, so both panels change state without
          travelling, and every timing on this screen is inert. Note where that decision sits in
          each model: on the left it is a media query you have to write. <b>On the right it is a row
          you were never shown</b> &mdash; which is the answer you need before shipping in any tool
          that fills things in for you.`;
      } else if (note === 'origin') {
        read.innerHTML = `Both panels now say ${o.says}. On the left you edited a declaration; on the
          right you edited <b>the shut state</b>. Same motion, and only one of those is a sentence a
          designer says out loud in a review &mdash; which is the real argument for the state model,
          and it has nothing to do with saving keystrokes.`;
      } else if (revealed) {
        read.innerHTML = `Two rows on the left, five on the right. Neither model is wrong and neither
          is hiding anything: <b>the tool has moved the line between what you decide and what it
          decides</b>, and the dashed rows are the far side of that line. The job in a new tool is to
          find that line on purpose, before it finds you in a review.`;
      } else if (motion === 'spring') {
        read.innerHTML = `The right-hand panel asked for <code>stiffness ${SPRING.stiffness}</code>,
          <code>damping ${SPRING.damping}</code>, <code>mass ${SPRING.mass}</code> &mdash; and no
          duration, because a spring does not have one until it stops.
          <b>${SPRING_EASE.ms}ms is the answer, not the input.</b> The left-hand side had to be told
          that number to move at all.`;
      } else {
        read.innerHTML = `Three declarations on the left, two states and a trigger on the right, and
          the same drawer either way. <b>The right-hand side never asked you for a duration</b> and
          it moved anyway &mdash; so something chose one. Press <b>show me</b> and find out what else
          it chose while it was there.`;
      }
    }

    function setOpen(next) {
      open = next;
      toggleBtn.textContent = open ? 'Close both' : 'Open both';
      apply();
    }

    function knob(role, fn) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          fn(btn.dataset.value);
        }));
    }

    // Every knob replays, and replays from shut — a change to where the panel
    // lives is only visible while it is travelling, so a knob that left both
    // panels sitting open would be a knob that did nothing the instant it
    // was turned.
    function replay() {
      setOpen(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    }

    knob('origin', (v) => { origin = v; report('origin'); replay(); });
    knob('motion', (v) => { motion = v; report(null); replay(); });
    knob('reveal', (v) => { revealed = v === '1'; report(null); });
    toggleBtn.addEventListener('click', () => setOpen(!open));

    setOpen(false);
    report(null);
  }

  document.querySelectorAll('[data-panel-lab]').forEach(mount);
})();
