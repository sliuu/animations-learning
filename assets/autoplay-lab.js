/* ============================================================
   autoplay-lab.js — the autoplay argument, with a casualty.

   Why this exists: "autoplaying carousels are bad" is repeated
   often enough that it has stopped meaning anything, and a
   designer who can only repeat it loses the argument to the
   stakeholder who wants three messages in one hero slot. So
   this lab does not assert it. It puts a sentence on the slide
   that takes longer to read than the interval allows, and lets
   the deck take it away mid-clause. The casualty is on screen
   and it is the reader's own attention.

   Two knobs are the two mitigations that are actually argued
   about in reviews: pausing while the pointer is on it, and
   what happens after the reader takes control. The second is
   the vicious one — a deck that resumes after you swipe back
   to re-read will take the sentence away from you a second
   time, and the counter says how many times it has.

   The counter is the on-screen verdict for a failure that is
   otherwise silent: "it advanced while you were reading" is
   invisible if you were, in fact, reading.

   Reduced motion: this lab does not autostart under
   prefers-reduced-motion. An unrequested loop is the exact
   thing that setting exists to stop, and a lab that ignored it
   in order to argue about ignoring it would be arguing against
   itself. The Start button is still there, so the lesson is
   reachable by choice.

   Usage:
     <div data-autoplay-lab data-title="Read the slide"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const INTERVALS = [3000, 5000, 8000];

  const SLIDES = [
    { t: 'Ship on Thursday',
      b: 'The migration lands Thursday morning, which means the export job has to be re-pointed at the new bucket before Wednesday night, and anyone with a saved report will need to re-save it once.' },
    { t: 'Pricing changes',
      b: 'Seat pricing moves to a flat band on the first of the month, existing annual contracts keep their current rate until renewal, and the usage line on the invoice becomes a single figure rather than four.' },
    { t: 'Office move',
      b: 'The third floor is packed by the eighteenth, desks are assigned by team rather than alphabetically this time, and anything left in a pedestal after Friday goes into storage for a month and then goes.' },
  ];

  function injectStyles() {
    if (document.getElementById('autoplay-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'autoplay-lab-styles';
    s.textContent = `
    .ap { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .ap { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .ap-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .ap-board { padding: 1.3rem 1.1rem 1.1rem; background: var(--paper); }
    .ap-hero { max-width: 32rem; margin: 0 auto; border: 1px solid var(--rule);
               border-radius: 10px; background: var(--paper-sunk); overflow: hidden; }
    .ap-timer { height: 3px; background: var(--rule); }
    .ap-timer i { display: block; height: 100%; width: 0%; background: var(--accent); }
    .ap-slide { padding: 1.1rem 1.2rem 1.2rem; display: grid; gap: 0.4rem;
                /* Fixed so the three slides, at three lengths, never resize the hero. */
                min-height: 8.6rem; align-content: start; }
    .ap-slide h4 { margin: 0; font: 600 1.05rem/1.3 var(--sans); color: var(--ink); }
    .ap-slide p { margin: 0; font: 400 0.86rem/1.55 var(--serif); color: var(--ink-soft); }

    .ap-dots { display: flex; gap: 6px; justify-content: center; padding: 0 0 0.85rem; }
    .ap-dots button { width: 8px; height: 8px; padding: 0; border-radius: 50%; cursor: pointer;
                      border: 1px solid var(--rule); background: var(--rule); }
    .ap-dots button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); }
    .ap-dots button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

    /* Reserved at the tallest verdict, per width band: the counter line grows as it
       accumulates and must not shove the controls down while she is reading. */
    .ap-read { max-width: 32rem; margin: 0.7rem auto 0; min-height: 3.9rem;
               font: 400 0.82rem/1.5 var(--sans); color: var(--ink-soft); }
    @media (min-width: 700px) { .ap-read { min-height: 3.1rem; } }
    .ap-read b { color: var(--ink); font-weight: 600; }
    .ap-read .no { color: var(--bad); font-weight: 600; }
    .ap-read .yes { color: var(--good); font-weight: 600; }

    .ap-foot { display: grid; gap: 0.6rem; padding: 0.9rem 1.1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .ap-ctl { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
    .ap-cap { min-width: 7.6rem; font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .ap-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .ap-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .ap-seg button:hover { border-color: var(--ink-faint); }
    .ap-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .ap-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media print { .ap-foot, .ap-dots { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'ap' + (++uid);
    const title = root.dataset.title || 'Read the slide';
    const reduced = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const st = { ms: 5000, hover: true, resume: true, running: false, taken: false };
    let i = 0, stolen = 0, hovering = false, t0 = 0, raf = 0;

    root.classList.add('ap');
    root.innerHTML = `
      <div class="ap-head"><span>${title}</span><span>then try to finish the sentence</span></div>
      <div class="ap-board">
        <div class="ap-hero" data-hero>
          <div class="ap-timer"><i data-t></i></div>
          <div class="ap-slide"><h4 data-st></h4><p data-sb></p></div>
          <div class="ap-dots" data-dots role="group" aria-label="Slide"></div>
        </div>
        <p class="ap-read" data-read aria-live="polite"></p>
      </div>
      <div class="ap-foot">
        <div class="ap-ctl"><span class="ap-cap">It advances every</span>
          <div class="ap-seg" data-seg="ms" role="group" aria-label="Interval">
            ${INTERVALS.map((m) => `<button type="button" data-v="${m}">${m / 1000}s</button>`).join('')}
          </div></div>
        <div class="ap-ctl"><span class="ap-cap">Pointer on it</span>
          <div class="ap-seg" data-seg="hover" role="group" aria-label="On hover">
            <button type="button" data-v="yes">pauses it</button>
            <button type="button" data-v="no">changes nothing</button>
          </div></div>
        <div class="ap-ctl"><span class="ap-cap">After you touch it</span>
          <div class="ap-seg" data-seg="resume" role="group" aria-label="After interaction">
            <button type="button" data-v="yes">it carries on</button>
            <button type="button" data-v="no">it stops for good</button>
          </div>
          <button class="btn primary" type="button" data-run></button>
        </div>
      </div>
    `;

    const hero = root.querySelector('[data-hero]');
    const bar = root.querySelector('[data-t]');
    const hTitle = root.querySelector('[data-st]');
    const hBody = root.querySelector('[data-sb]');
    const dots = root.querySelector('[data-dots]');
    const read = root.querySelector('[data-read]');
    const runBtn = root.querySelector('[data-run]');

    dots.innerHTML = SLIDES.map((_, n) =>
      `<button type="button" data-i="${n}" aria-label="Slide ${n + 1}"></button>`).join('');

    function slide() {
      hTitle.textContent = SLIDES[i].t;
      hBody.textContent = SLIDES[i].b;
      dots.querySelectorAll('button').forEach((b, n) =>
        b.setAttribute('aria-pressed', String(n === i)));
    }

    function verdict(extra) {
      let s;
      if (!st.running) {
        s = st.taken && !st.resume
          ? '<b>Stopped.</b> <span class="yes">You took control and it gave it up.</span> The deck is now a deck, and you can read at your own speed.'
          : reduced
          ? '<b>Not running.</b> This lab does not autostart when your system asks for reduced motion — that setting exists to stop exactly this.'
          : '<b>Paused.</b>';
      } else if (stolen === 0) {
        s = `<b>Running.</b> Every ${st.ms / 1000} seconds it advances, whether or not you are mid-sentence.`;
      } else {
        s = `<b>It has taken the slide away from you ${stolen} time${stolen === 1 ? '' : 's'}.</b>`;
        if (stolen >= 2 && st.resume && st.taken) {
          s += ' <span class="no">And you already told it you wanted this one</span> — you swiped back, and it overruled you.';
        } else if (!st.hover) {
          s += ' Your pointer was on it and it advanced anyway.';
        }
      }
      read.innerHTML = (extra ? extra + ' ' : '') + s;
    }

    function paint() {
      root.querySelectorAll('.ap-seg').forEach((seg) => {
        const k = seg.dataset.seg;
        const cur = k === 'ms' ? String(st.ms) : (st[k] ? 'yes' : 'no');
        seg.querySelectorAll('button').forEach((b) =>
          b.setAttribute('aria-pressed', String(b.dataset.v === cur)));
      });
      runBtn.textContent = st.running ? 'Stop it' : 'Start it';
    }

    function tick(now) {
      if (!st.running) return;
      if (hovering && st.hover) t0 = now;           /* held, not rewound */
      const p = Math.min(1, (now - t0) / st.ms);
      bar.style.width = (p * 100).toFixed(1) + '%';
      if (p >= 1) {
        i = (i + 1) % SLIDES.length;
        stolen++;
        slide();
        t0 = now;
        verdict();
      }
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (st.running) return;
      st.running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
      paint(); verdict();
    }

    function stop() {
      st.running = false;
      cancelAnimationFrame(raf);
      bar.style.width = '0%';
      paint(); verdict();
    }

    /* Any deliberate move by the reader — a dot, a keyboard focus — is the
       interaction the "after you touch it" knob is about. */
    function taken(n) {
      i = n;
      st.taken = true;
      slide();
      if (st.resume) {
        t0 = performance.now();
        verdict('<b>You picked a slide.</b>');
      } else {
        stop();
      }
    }

    hero.addEventListener('pointerenter', () => { hovering = true; });
    hero.addEventListener('pointerleave', () => { hovering = false; t0 = performance.now(); });

    root.addEventListener('click', (e) => {
      const d = e.target.closest('.ap-dots button');
      if (d) { taken(Number(d.dataset.i)); return; }
      const b = e.target.closest('.ap-seg button');
      if (b) {
        const k = b.closest('.ap-seg').dataset.seg;
        if (k === 'ms') st.ms = Number(b.dataset.v);
        else st[k] = b.dataset.v === 'yes';
        t0 = performance.now();
        paint(); verdict();
        return;
      }
      if (e.target.closest('[data-run]')) {
        if (st.running) stop();
        else { stolen = 0; st.taken = false; start(); }
      }
    });

    slide();
    paint();
    verdict();
    if (!reduced) start();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-autoplay-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
