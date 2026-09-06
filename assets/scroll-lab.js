/* ============================================================
   scroll-lab.js — trigger versus scrub, felt in a real scroller.

   A miniature scrollport you can scroll with cards inside it. The
   same reveal runs two fundamentally different ways:

     trigger — scroll position STARTS a time-based animation, which
               then plays out on its own clock. Reveals want this.
     scrub   — the animation's progress IS the scroll position, so
               scrolling back un-reveals and stopping halfway leaves
               it halfway. Progress bars want this; reveals don't.

   The dashed line marks where the trigger actually fires, which is
   what rootMargin moves.

   Usage:
     <div data-scroll-lab data-title="Scroll it"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const STYLES = `
    .scl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .scl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .scl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .scl-count { font-family: var(--mono); letter-spacing: 0; text-transform: none; }
    .scl-main { position: relative; background: var(--paper); }
    .scl-view {
      height: 320px; overflow-y: auto; overscroll-behavior: contain;
      padding: 0 1rem;
      scrollbar-width: thin;
    }
    .scl-spacer {
      display: grid; place-items: center; height: 150px;
      font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint);
    }
    .scl-card {
      height: 84px; margin: 12px 0; border-radius: 9px;
      background: var(--accent); color: var(--paper);
      display: grid; place-items: center;
      font-family: var(--sans); font-size: 0.8rem; font-weight: 600;
    }
    .scl-card.hidden-until-seen { opacity: 0; }
    /* The line where the observer actually fires. Moving it is the whole
       point of rootMargin. */
    .scl-fire {
      position: absolute; left: 0; right: 0; height: 0;
      border-top: 1px dashed var(--accent);
      pointer-events: none; opacity: 0.75;
    }
    .scl-fire span {
      position: absolute; right: 6px; top: 3px;
      font-family: var(--sans); font-size: 0.62rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent);
      background: var(--paper); padding: 0 4px;
    }
    .scl-modes { display: flex; gap: 0; border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
    .scl-modes button {
      appearance: none; border: 0; cursor: pointer;
      padding: 0.32rem 0.7rem; background: var(--paper); color: var(--ink-soft);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.04em; text-transform: none;
    }
    .scl-modes button + button { border-left: 1px solid var(--rule); }
    .scl-modes button[aria-pressed="true"] { background: var(--accent); color: var(--paper); }
    .scl-drive { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 0.85rem 0; }
    .scl-banner {
      margin: 0.6rem 0.85rem 0; padding: 0.5rem 0.7rem; border-radius: 5px;
      font-family: var(--sans); font-size: 0.76rem; line-height: 1.45;
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      color: var(--ink-soft);
      opacity: 0; transition: opacity 180ms linear;
    }
    .scl-banner.show { opacity: 1; }
    .scl-banner.good { background: color-mix(in srgb, var(--good) 16%, transparent); color: var(--ink); }
    .scl-banner.bad { background: color-mix(in srgb, var(--bad) 16%, transparent); color: var(--ink); }
    .scl-banner b { color: var(--ink); }
    .scl-foot {
      padding: 0.85rem; border-top: 1px solid var(--rule);
      display: grid; gap: 0.85rem;
    }
    @media (min-width: 760px) {
      .scl-modes { display: flex; gap: 0; border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
    .scl-modes button {
      appearance: none; border: 0; cursor: pointer;
      padding: 0.32rem 0.7rem; background: var(--paper); color: var(--ink-soft);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.04em; text-transform: none;
    }
    .scl-modes button + button { border-left: 1px solid var(--rule); }
    .scl-modes button[aria-pressed="true"] { background: var(--accent); color: var(--paper); }
    .scl-drive { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 0.85rem 0; }
    .scl-banner {
      margin: 0.6rem 0.85rem 0; padding: 0.5rem 0.7rem; border-radius: 5px;
      font-family: var(--sans); font-size: 0.76rem; line-height: 1.45;
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      color: var(--ink-soft);
      opacity: 0; transition: opacity 180ms linear;
    }
    .scl-banner.show { opacity: 1; }
    .scl-banner.good { background: color-mix(in srgb, var(--good) 16%, transparent); color: var(--ink); }
    .scl-banner.bad { background: color-mix(in srgb, var(--bad) 16%, transparent); color: var(--ink); }
    .scl-banner b { color: var(--ink); }
    .scl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    .scl-note {
      grid-column: 1 / -1; margin: 0;
      border-top: 1px dotted var(--rule); padding-top: 0.7rem;
      font-family: var(--sans); font-size: 0.78rem; line-height: 1.5;
      color: var(--ink-soft);
    }
    .scl-note b { color: var(--ink); }
    @media print { .scl-foot { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('scl-styles')) return;
    const el = document.createElement('style');
    el.id = 'scl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'scl-' + ++uid;
    const state = {
      mode: root.dataset.mode || 'trigger',
      fire: parseInt(root.dataset.fire || '-15', 10), // rootMargin bottom, %
      repeat: 'once',
      step: 60,
      duration: 450,
      travel: 24,
    };
    const count = parseInt(root.dataset.count || '6', 10);
    const title = root.dataset.title || 'Trigger vs scrub';

    root.id = id;
    root.className = 'scl';
    root.innerHTML = `
      <div class="scl-head">
        <div class="scl-modes" role="group" aria-label="Mode">
          <button type="button" data-mode="trigger" aria-pressed="true">trigger</button>
          <button type="button" data-mode="scrub" aria-pressed="false">scrub</button>
        </div>
        <span class="scl-count"><span data-seen>0</span>/${count} revealed</span>
      </div>
      <div class="scl-drive">
        <button class="btn primary" type="button" data-drive>Scroll it for me</button>
        <button class="btn" type="button" data-half>Stop halfway</button>
      </div>
      <div class="scl-banner" data-banner>&nbsp;</div>
      <div class="scl-main">
        <div class="scl-view" data-view>
          <div class="scl-spacer">↓ scroll this panel ↓</div>
          ${Array.from({ length: count },
            (_, i) => `<div class="scl-card" data-card data-i="${i}">card ${i + 1}</div>`).join('')}
          <div class="scl-spacer">end</div>
        </div>
        <div class="scl-fire" data-fire><span>fires here</span></div>
      </div>
      <div class="scl-foot">
        <div class="control">
          <span class="control-label"><span>re-trigger</span></span>
          <select data-k="repeat">
            <option value="once">once — stays revealed</option>
            <option value="every">every time — re-hides on exit</option>
          </select>
        </div>
        <div class="control">
          <span class="control-label"><span>fire point (rootMargin bottom)</span>
            <span class="control-value" data-out-fire></span></span>
          <input type="range" min="-45" max="0" step="1" data-k="fire">
        </div>
        <div class="control">
          <span class="control-label"><span>stagger step</span>
            <span class="control-value" data-out-step></span></span>
          <input type="range" min="0" max="200" step="10" data-k="step">
        </div>
        <div class="control">
          <span class="control-label"><span>duration</span>
            <span class="control-value" data-out-duration></span></span>
          <input type="range" min="120" max="900" step="30" data-k="duration">
        </div>
        <div class="control">
          <span class="control-label"><span>travel</span>
            <span class="control-value" data-out-travel></span></span>
          <input type="range" min="0" max="60" step="2" data-k="travel">
        </div>
        <p class="scl-note" data-note></p>
      </div>`;

    const view = root.querySelector('[data-view]');
    const cards = [...root.querySelectorAll('[data-card]')];
    const fireLine = root.querySelector('[data-fire]');
    const seenOut = root.querySelector('[data-seen]');
    const note = root.querySelector('[data-note]');
    let observer = null;
    let scrubbing = null;
    const banner = root.querySelector('[data-banner]');
    const driveBtn = root.querySelector('[data-drive]');
    const halfBtn = root.querySelector('[data-half]');
    const modeBtns = [...root.querySelectorAll('[data-mode]')];
    let driveRaf = null;

    function setSeen() {
      seenOut.textContent = cards.filter((c) => c.dataset.shown === '1').length;
    }

    function reset() {
      if (observer) { observer.disconnect(); observer = null; }
      if (scrubbing) { view.removeEventListener('scroll', scrubbing); scrubbing = null; }
      cards.forEach((c) => {
        c.dataset.shown = '0';
        c.style.transition = 'none';
        c.style.opacity = '0';
        c.style.transform = `translateY(${state.travel}px)`;
      });
      setSeen();
      // Position the dashed line where the observer's root edge now sits.
      fireLine.style.top = `calc(100% + ${state.fire}%)`;
    }

    function show(card, delay) {
      card.dataset.shown = '1';
      card.style.transition =
        `opacity ${state.duration}ms var(--ease-out-strong) ${delay}ms, ` +
        `transform ${state.duration}ms var(--ease-out-strong) ${delay}ms`;
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      setSeen();
    }

    function hide(card) {
      card.dataset.shown = '0';
      card.style.transition =
        `opacity ${state.duration / 2}ms var(--ease-out-strong), ` +
        `transform ${state.duration / 2}ms var(--ease-out-strong)`;
      card.style.opacity = '0';
      card.style.transform = `translateY(${state.travel}px)`;
      setSeen();
    }

    function startTrigger() {
      observer = new IntersectionObserver(
        (entries) => {
          // Stagger by position *within this batch*, not by global index —
          // otherwise card 12 waits twelve steps for no reason.
          let batch = 0;
          entries.forEach((e) => {
            if (e.isIntersecting) {
              if (e.target.dataset.shown === '1') return;
              show(e.target, batch * state.step);
              batch += 1;
              if (state.repeat === 'once') observer.unobserve(e.target);
            } else if (state.repeat === 'every') {
              hide(e.target);
            }
          });
        },
        { root: view, rootMargin: `0px 0px ${state.fire}% 0px`, threshold: 0 }
      );
      cards.forEach((c) => observer.observe(c));
    }

    function startScrub() {
      const apply = () => {
        const box = view.getBoundingClientRect();
        const edge = box.bottom + (box.height * state.fire) / 100;
        const span = box.height * 0.4; // how much scrolling completes the reveal
        cards.forEach((c) => {
          const top = c.getBoundingClientRect().top;
          const p = Math.min(Math.max((edge - top) / span, 0), 1);
          c.style.transition = 'none';
          c.style.opacity = String(p);
          c.style.transform = `translateY(${(1 - p) * state.travel}px)`;
          c.dataset.shown = p > 0.95 ? '1' : '0';
        });
        setSeen();
      };
      let queued = false;
      scrubbing = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; apply(); });
      };
      view.addEventListener('scroll', scrubbing, { passive: true });
      apply();
    }

    function say(text, tone) {
      banner.innerHTML = text;
      banner.className = 'scl-banner show' + (tone ? ' ' + tone : '');
    }
    function clearSay() { banner.className = 'scl-banner'; }

    // Drive the scroller so attention is free for the cards.
    function drive(toFrac, ms, done) {
      if (driveRaf) cancelAnimationFrame(driveRaf);
      const max = view.scrollHeight - view.clientHeight;
      const from = view.scrollTop;
      const to = max * toFrac;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / ms, 1);
        view.scrollTop = from + (to - from) * p;
        if (p < 1) { driveRaf = requestAnimationFrame(step); }
        else { driveRaf = null; if (done) done(); }
      };
      driveRaf = requestAnimationFrame(step);
    }

    driveBtn.addEventListener('click', () => {
      clearSay();
      view.scrollTop = 0;
      reset();
      if (state.mode === 'scrub') startScrub(); else startTrigger();
      setTimeout(() => drive(1, 4200), 250);
    });

    // The whole lesson in one button.
    halfBtn.addEventListener('click', () => {
      clearSay();
      view.scrollTop = 0;
      reset();
      if (state.mode === 'scrub') startScrub(); else startTrigger();
      setTimeout(() => drive(0.45, 1900, () => {
        setTimeout(() => {
          if (state.mode === 'scrub') {
            say('<b>Stopped.</b> Look at the cards near the bottom edge — they are frozen ' +
                'part-way faded, and they will stay that way until someone scrolls again. ' +
                'Their legibility now depends on where the reader happened to stop.', 'bad');
          } else {
            say('<b>Stopped.</b> The cards that had started finished anyway, at full opacity — ' +
                'because scroll only <em>started</em> them and they ran on their own clock. ' +
                'This is what a reveal wants.', 'good');
          }
        }, 420);
      }), 250);
    });

    modeBtns.forEach((b) => b.addEventListener('click', () => {
      state.mode = b.dataset.mode;
      modeBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      clearSay();
      view.scrollTop = 0;
      restart();
    }));

    function restart() {
      reset();
      if (state.mode === 'scrub') startScrub();
      else startTrigger();
      describe();
    }

    function describe() {
      if (state.mode === 'scrub') {
        note.innerHTML =
          '<b>Scrub.</b> Progress is bound to scroll position, so scrolling up un-reveals ' +
          'and stopping mid-scroll leaves a card at half opacity. Correct for progress ' +
          'bars and parallax; wrong for reveals, because the content\'s legibility now ' +
          'depends on exactly where someone stopped. Stagger and duration do nothing here — ' +
          'there is no clock to space out.';
      } else if (state.repeat === 'every') {
        note.innerHTML =
          '<b>Trigger, re-firing.</b> Scroll a card out and back and it replays. Almost ' +
          'always wrong: the second viewing answers no question, and on a page someone ' +
          'scrolls up and down it turns into flicker. Reveal once, then leave it alone.';
      } else {
        note.innerHTML =
          '<b>Trigger, once.</b> Scroll position starts a normal time-based animation that ' +
          'then plays on its own clock — so it always completes, at the duration and easing ' +
          'you chose, regardless of how fast the reader scrolls. This is what a reveal wants.';
      }
    }

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      const out = root.querySelector(`[data-out-${key}]`);
      const sync = () => {
        if (!out) return;
        out.textContent = key === 'fire' ? state.fire + '%'
          : key === 'travel' ? state.travel + 'px'
          : state[key] + 'ms';
      };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseInt(input.value, 10) : input.value;
        sync();
        restart();
      });
    });

    restart();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-scroll-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
