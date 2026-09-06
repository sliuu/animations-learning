/* ============================================================
   text-arrival-lab.js — mask or fade: uncovering or arriving?

   The same two lines of type, side by side, one revealed by a
   mask and one by a fade-up. Both play from one button, because
   the claim is about how they *feel* and a feeling cannot be
   taught by playing one and then the other. "Hold at 50% time"
   freezes both on the same clock position, which is where the difference is
   plainest: the mask has whole letters and a cropped window;
   the fade-up has dim, low, complete letters.

   Housed in the standard lab card (head / board / verdict /
   controls foot) to match the labs either side of it. It used
   to borrow `.stage-head` with no `.stage` around it, so it had
   a head bar's padding and rule and no card to belong to.

   Usage:
     <div data-text-arrival-lab data-title="Same words, different promise"></div>
   ============================================================ */

(function () {
  'use strict';
  let uid = 0;

  const CURVES = {
    out: {
      label: 'settle · ease-out', short: 'ease-out', css: 'var(--ease-out-strong)',
      read: 'moves early, then spends the ending settling',
    },
    inout: {
      label: 'glide · ease-in-out', short: 'ease-in-out', css: 'var(--ease-in-out-strong)',
      read: 'holds back, crosses the middle, then settles',
    },
    in: {
      label: 'withhold · ease-in', short: 'ease-in', css: 'cubic-bezier(0.55, 0, 1, 0.45)',
      read: 'withholds most of the change for the ending',
    },
    linear: {
      label: 'constant · linear', short: 'linear', css: 'linear',
      read: 'spends the change at a constant rate',
    },
  };

  function injectStyles() {
    if (document.getElementById('text-arrival-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'text-arrival-lab-styles';
    s.textContent = `
    .ta-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .ta-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .ta-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    /* The right-hand slot is a state readout, not a subtitle. It used to repeat
       the lesson's own data-title back at itself two inches away from it. */
    .ta-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .ta-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .ta-pane { display: flex; flex-direction: column; min-height: 13.5rem;
               padding: 1.2rem 1.1rem 1.3rem; background: var(--paper); }
    .ta-pane h3 { margin: 0 0 0.9rem; font: 600 0.66rem/1.3 var(--sans);
                  letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }
    /* margin:auto 0 centres the type in the pane. Top-aligned, the two-line
       headline left a hand's width of dead space under it at every width. */
    .ta-copy { margin: auto 0; font: 600 clamp(1.3rem, 2.5vw, 2.15rem)/1.08 var(--sans);
               letter-spacing: -0.03em; }
    .ta-line { display: block; overflow: hidden; }
    .ta-line > span { display: block; }
    .ta-playing .ta-line > span { animation: ta-fade var(--ta-duration) var(--ta-curve) both;
                                  animation-delay: var(--delay); }
    .ta-playing .ta-line.mask > span { animation-name: ta-mask; }
    @keyframes ta-fade { from { opacity: 0; transform: translateY(var(--ta-distance)); } to { opacity: 1; transform: none; } }
    @keyframes ta-mask { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }

    /* Reserve-and-centre, same as the other verdict boxes: min-height measured
       at each width from the longest verdict, text centred inside it. */
    .ta-readwrap { display: flex; align-items: center; min-height: 5.25rem;
                   padding: 0.8rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .ta-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .ta-read b { color: var(--ink); font-weight: 600; }

    .ta-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk); }
    .ta-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .ta-cap { min-width: 6.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .ta-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .ta-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .ta-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .ta-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .ta-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 7.05rem; }

    /* Four bands, each measured against the longest verdict the knobs and the
       hold can produce at that width. Between 701 and 999 the card is no longer
       full-bleed but the board is still two columns, so only the verdict
       rewraps; below 701 the board stacks and it rewraps again. */
    @media (max-width: 999px) { .ta-readwrap { min-height: 5.4rem; } }
    @media (max-width: 700px) {
      .ta-board { grid-template-columns: minmax(0, 1fr); }
      .ta-pane { min-height: 11rem; padding: 1.1rem 0.95rem; }
      .ta-readwrap { min-height: 7.7rem; }
      .ta-state { display: none; }
      .ta-ctl { align-items: flex-start; }
      .ta-cap { min-width: 100%; }
      .ta-actions { margin-left: 0; }
    }
    @media (max-width: 460px) { .ta-readwrap { min-height: 10.1rem; } }
    @media (max-width: 360px) { .ta-readwrap { min-height: 11.25rem; } }
    @media print { .ta-foot { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      /* 0009's stance. The words are the content and they stay; the travel and
         the wipe are decoration on top of them, so both are removed rather than
         shortened — there is no small version of "uncovering" that is honest. */
      .ta-playing .ta-line > span, .ta-playing .ta-line.mask > span {
        animation: none; opacity: 1; transform: none; clip-path: none;
      }
    }
    `;
    document.head.appendChild(s);
  }

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([value, label]) =>
      `<button type="button" data-value="${value}" aria-pressed="${value === chosen}">${label}</button>`).join('');
    return `<div class="ta-ctl"><span class="ta-cap">${caption}</span>
            <div class="ta-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('ta-lab');

    let duration = 580, curve = 'out', stagger = 90, distance = 16;

    root.innerHTML = `
      <div class="ta-head">
        <strong>${root.dataset.title || 'Two ways for text to arrive'}</strong>
        <span class="ta-state" data-state>idle</span>
      </div>
      <div class="ta-board">
        <section class="ta-pane">
          <h3>Mask reveal · uncovering</h3>
          <div class="ta-copy" data-mask>
            <span class="ta-line mask"><span data-line="0">Design can make</span></span>
            <span class="ta-line mask"><span data-line="1">the order visible.</span></span>
          </div>
        </section>
        <section class="ta-pane">
          <h3>Fade-up · arriving</h3>
          <div class="ta-copy" data-fade>
            <span class="ta-line"><span data-line="0">Design can make</span></span>
            <span class="ta-line"><span data-line="1">the order visible.</span></span>
          </div>
        </section>
      </div>
      <div class="ta-readwrap">
        <p class="ta-read" data-verdict aria-live="polite">Press <b>Play both</b> and watch the two
          promises at the same time, then hold them halfway.</p>
      </div>
      <div class="ta-foot">
        ${seg('duration', 'Line duration', [['280', 'brisk · 280ms'], ['580', 'deliberate · 580ms'], ['1000', 'theatrical · 1000ms']], '580')}
        ${seg('curve', 'Curve', [['out', CURVES.out.label], ['inout', CURVES.inout.label], ['in', CURVES.in.label], ['linear', CURVES.linear.label]], 'out')}
        ${seg('stagger', 'Line delay', [['0', 'together'], ['90', 'cadence · 90ms'], ['180', 'countable · 180ms']], '90')}
        ${seg('distance', 'Fade-up travel', [['8', 'subtle · 8px'], ['16', 'clear · 16px'], ['28', 'large · 28px']], '16')}
        <div class="ta-actions">
          <button class="btn primary" type="button" data-play>Play both</button>
          <button class="btn" type="button" data-hold>Hold at 50% time</button>
        </div>
      </div>`;

    const state = root.querySelector('[data-state]');
    const verdict = root.querySelector('[data-verdict]');
    const lines = root.querySelectorAll('.ta-line');

    function applySettings() {
      root.style.setProperty('--ta-duration', duration + 'ms');
      root.style.setProperty('--ta-curve', CURVES[curve].css);
      root.style.setProperty('--ta-distance', distance + 'px');
      lines.forEach((line) => {
        const copy = line.querySelector('span');
        copy.style.setProperty('--delay', Number(copy.dataset.line) * stagger + 'ms');
      });
    }

    function play() {
      applySettings();
      root.classList.remove('ta-playing');
      void root.offsetWidth;
      root.classList.add('ta-playing');
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        state.textContent = 'motion reduced';
        verdict.innerHTML = 'Your reduced-motion setting keeps the words present and removes both ' +
          'scheduled effects. The timing controls remain available, but this accommodation ' +
          'deliberately does not play them.';
        return;
      }
      state.textContent = `playing · ${duration}ms · ${CURVES[curve].short}`;
      verdict.innerHTML = `Each line takes <b>${duration}ms</b>; ${CURVES[curve].short} ` +
        `${CURVES[curve].read}. The second line follows <b>${stagger}ms</b> later. The mask ` +
        `keeps its type still; the fade-up travels <b>${distance}px</b>.`;
    }

    root.querySelector('[data-play]').addEventListener('click', play);

    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach((button) =>
        button.addEventListener('click', () => {
          apply(button.dataset.value);
          root.querySelectorAll(`[data-role="${role}"] button`)
            .forEach((candidate) => candidate.setAttribute('aria-pressed', candidate === button));
          play();
        }));
    }
    knob('duration', (value) => { duration = Number(value); });
    knob('curve', (value) => { curve = value; });
    knob('stagger', (value) => { stagger = Number(value); });
    knob('distance', (value) => { distance = Number(value); });

    root.querySelector('[data-hold]').addEventListener('click', () => {
      /* Always create a fresh set, then pause each line halfway through its own
         clock. That holds duration still while exposing what the curve has done
         with the first half of the available time. */
      applySettings();
      root.classList.remove('ta-playing');
      void root.offsetWidth;
      root.classList.add('ta-playing');
      void root.offsetWidth;

      const animations = [];
      lines.forEach((line) => line.querySelector('span').getAnimations()
        .forEach((animation) => animations.push(animation)));
      animations.forEach((animation) => {
        const delay = Number(animation.effect.getTiming().delay) || 0;
        animation.currentTime = delay + duration / 2;
        animation.pause();
      });

      if (!animations.length) {
        state.textContent = 'motion reduced';
        verdict.innerHTML = 'Your reduced-motion setting keeps the words present and removes both ' +
          'scheduled effects, so there is no halfway state to hold.';
        return;
      }

      /* The percentage is measured, not tabulated. The fade line interpolates
         opacity 0 → 1, so its computed opacity at the held moment *is* the
         curve's progress through its own change — read it off the paused
         element rather than asserting a number per curve. */
      const fadeLine = root.querySelector('[data-fade] .ta-line > span');
      const spent = Math.round(Number(getComputedStyle(fadeLine).opacity) * 100);

      state.textContent = `held · 50% time · ${CURVES[curve].short}`;
      verdict.innerHTML = `Half the clock has passed and <b>${CURVES[curve].short}</b> has spent ` +
        `<b>${spent}%</b> of its change. That gap between half the time and ${spent}% of the ` +
        'distance is the whole of what a curve is. The mask shows the progress as a cropped ' +
        'window; the fade-up shows it as dimness and distance.';
    });

    applySettings();
  }

  document.querySelectorAll('[data-text-arrival-lab]').forEach(mount);
})();
