/* ============================================================
   scroll-contract-lab.js — direct scroll beside scroll that
   "smooths" by chasing the reader's requested position.

   The panes are shuffled and the answer is withheld. One wheel
   or trackpad gesture drives both at once, so this is a simultaneous
   feeling comparison rather than a sequential memory test. A marker
   shows the requested position; when one viewport trails it, the
   silent failure becomes visible and measurable.

   Layout jump: both panes, the readout, and the controls have fixed
   or reserved heights. Revealing the answer replaces text in place.

   Reduced motion: the lag is the lesson's casualty. Removing it would
   make the two panes identical, so it remains available, never loops,
   and moves only after a wheel gesture or an explicit demo press.

   Usage:
     <div data-scroll-contract-lab data-title="One gesture, two contracts"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function injectStyles() {
    if (document.getElementById('scroll-contract-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'scroll-contract-lab-styles';
    s.textContent = `
    .sc { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .sc { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .sc-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; border-bottom: 1px solid var(--rule);
               background: var(--paper); color: var(--ink-soft); font: 600 0.76rem/1.35 var(--sans); }
    .sc-panes { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--rule);
                touch-action: pan-x; overscroll-behavior: contain; }
    .sc-panes:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .sc-pane { position: relative; background: var(--paper); padding: 0.8rem; }
    .sc-label { display: flex; justify-content: space-between; margin-bottom: 0.55rem;
                font: 600 0.68rem/1.3 var(--sans); color: var(--ink-soft); }
    .sc-label em { font-style: normal; color: var(--ink-faint); }
    .sc-window { position: relative; height: 15rem; overflow: hidden; border: 1px solid var(--rule);
                 border-radius: 8px; background: var(--paper-sunk); }
    .sc-page { position: absolute; inset: 0 0 auto; height: 52rem; will-change: transform; }
    .sc-section { height: 13rem; padding: 1.1rem; border-bottom: 1px solid var(--rule);
                  display: grid; align-content: space-between; background: var(--paper); }
    .sc-section:nth-child(even) { background: color-mix(in srgb, var(--accent-soft) 30%, var(--paper)); }
    .sc-num { font: 600 0.58rem/1.3 var(--sans); letter-spacing: 0.11em; text-transform: uppercase;
              color: var(--accent); }
    .sc-section strong { font: 600 clamp(1.2rem, 3vw, 2rem)/1.05 var(--sans); letter-spacing: -0.035em; color: var(--ink); }
    .sc-line { position: absolute; right: 0.45rem; top: 0.55rem; bottom: 0.55rem; width: 3px;
               border-radius: 2px; background: var(--rule); }
    .sc-line i { position: absolute; left: -3px; width: 9px; height: 9px; margin-top: -4px;
                 border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 2px var(--paper); }
    .sc-read { min-height: 4.9rem; margin: 0; padding: 0.82rem 1rem; border-top: 1px solid var(--rule);
               background: var(--paper); color: var(--ink-soft); font: 400 0.8rem/1.5 var(--sans); }
    .sc-read b { color: var(--ink); font-weight: 600; }
    .sc-read .bad { color: var(--bad); font-weight: 600; }
    .sc-foot { display: flex; gap: 0.45rem; align-items: center; flex-wrap: wrap;
               padding: 0.9rem 1rem; border-top: 1px solid var(--rule); background: var(--paper-sunk); }
    .sc-foot .sc-hint { margin-left: auto; color: var(--ink-faint); font: 500 0.7rem/1.35 var(--sans); }
    @media (max-width: 620px) {
      /* Keep the panes simultaneous even on a phone. Stacking would turn a
         feeling comparison into a memory test. */
      .sc-window { height: 11rem; }
      .sc-pane { padding: 0.65rem; }
      .sc-section { padding: 0.7rem; }
      .sc-section strong { font-size: clamp(0.9rem, 4.5vw, 1.2rem); }
      .sc-read { min-height: 6.8rem; }
      .sc-foot .sc-hint { width: 100%; margin-left: 0; }
    }
    @media (max-width: 410px) { .sc-read { min-height: 8.4rem; } }
    @media print { .sc-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'sc' + (++uid);
    const title = root.dataset.title || 'One gesture, two contracts';
    const order = Math.random() < .5 ? ['direct', 'lag'] : ['lag', 'direct'];
    const labels = ['A', 'B'];
    let target = 0, lagPos = 0, raf = 0, demoTimer = 0, revealed = false, maxLag = 0;
    const MAX = 592;

    root.classList.add('sc');
    root.innerHTML = `
      <div class="sc-head"><span>${title}</span><span>wheel or trackpad over either pane</span></div>
      <div class="sc-panes" data-panes tabindex="0" aria-label="Two scroll responses driven together">
        ${order.map((kind, i) => `<div class="sc-pane" data-kind="${kind}">
          <div class="sc-label"><span>Pane ${labels[i]}</span><em data-name>answer hidden</em></div>
          <div class="sc-window"><div class="sc-page" data-page>
            <section class="sc-section"><span class="sc-num">01</span><strong>Begin where<br>you are.</strong></section>
            <section class="sc-section"><span class="sc-num">02</span><strong>Keep the<br>contract.</strong></section>
            <section class="sc-section"><span class="sc-num">03</span><strong>Let input<br>lead.</strong></section>
            <section class="sc-section"><span class="sc-num">04</span><strong>Then get<br>out of it.</strong></section>
          </div><span class="sc-line"><i data-marker></i></span></div>
        </div>`).join('')}
      </div>
      <p class="sc-read" data-read aria-live="polite">Both panes receive the same distance. One treats it as a command; one treats it as a destination to catch later. Move, then stop abruptly. Which one still feels attached to your hand?</p>
      <div class="sc-foot"><button class="btn primary" type="button" data-demo>Wheel it for me</button><button class="btn" type="button" data-reveal>Which is which?</button><button class="btn" type="button" data-reset>Back to top</button><span class="sc-hint">the dot is where your input asked to be</span></div>`;

    const panes = root.querySelector('[data-panes]');
    const read = root.querySelector('[data-read]');
    const demo = root.querySelector('[data-demo]');

    function labelFor(kind) { return labels[order.indexOf(kind)]; }

    function paint() {
      root.querySelectorAll('.sc-pane').forEach((pane) => {
        const kind = pane.dataset.kind;
        const pos = kind === 'direct' ? target : lagPos;
        pane.querySelector('[data-page]').style.transform = `translateY(${-pos}px)`;
        pane.querySelector('[data-marker]').style.top = `${(target / MAX) * 100}%`;
      });
      maxLag = Math.max(maxLag, Math.abs(target - lagPos));
      if (revealed) {
        const lagLetter = labelFor('lag');
        read.innerHTML = `<b>Pane ${lagLetter} is the smoothed one.</b> Its viewport trails the position your input requested by as much as ${Math.round(maxLag)}px. <span class="bad">That delay is scroll-jacking even when the easing is beautiful:</span> the site has rewritten a command as a suggestion.`;
      }
    }

    function chase() {
      lagPos += (target - lagPos) * .085;
      if (Math.abs(target - lagPos) < .25) lagPos = target;
      paint();
      if (lagPos !== target) raf = requestAnimationFrame(chase);
      else raf = 0;
    }

    function moveBy(delta) {
      target = clamp(target + delta, 0, MAX);
      paint();
      if (!raf) raf = requestAnimationFrame(chase);
    }

    panes.addEventListener('wheel', (e) => {
      /* Consume the gesture only while the instrument can move. At either
         boundary, give the wheel straight back to the document; a lab about
         the native contract must not become a scroll trap itself. */
      const next = clamp(target + e.deltaY, 0, MAX);
      if (next === target && ((target === 0 && e.deltaY < 0) || (target === MAX && e.deltaY > 0))) return;
      e.preventDefault();
      clearInterval(demoTimer); demoTimer = 0; demo.textContent = 'Wheel it for me';
      moveBy(e.deltaY);
    }, { passive: false });

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-demo]')) {
        if (demoTimer) { clearInterval(demoTimer); demoTimer = 0; demo.textContent = 'Wheel it for me'; return; }
        if (target > MAX - 12) { target = 0; lagPos = 0; maxLag = 0; paint(); }
        let steps = 0; demo.textContent = 'Stop';
        moveBy(110);
        demoTimer = setInterval(() => {
          moveBy(110); steps += 1;
          if (steps >= 4 || target >= MAX) { clearInterval(demoTimer); demoTimer = 0; demo.textContent = 'Wheel it for me'; }
        }, 230);
      } else if (e.target.closest('[data-reveal]')) {
        revealed = true;
        root.querySelectorAll('.sc-pane').forEach((pane, i) => {
          pane.querySelector('[data-name]').textContent = pane.dataset.kind === 'direct' ? 'direct · 1:1' : 'smoothed · catching up';
        });
        paint();
      } else if (e.target.closest('[data-reset]')) {
        clearInterval(demoTimer); demoTimer = 0; cancelAnimationFrame(raf); raf = 0;
        target = 0; lagPos = 0; maxLag = 0; demo.textContent = 'Wheel it for me'; paint();
      }
    });
    paint();
    return id;
  }

  function init() { injectStyles(); document.querySelectorAll('[data-scroll-contract-lab]').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
