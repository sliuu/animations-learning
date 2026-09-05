/* ============================================================
   deck-lab.js — one deck, and the four things a designer picks
   for it: the indicator, the peek, the snap, and — the knob
   that actually decides the first one — how many items there
   are.

   Why this exists: "dots stop working past about seven items"
   is a claim that sounds like taste until you are looking at
   forty of them. So the item count is a knob, and the deck
   really does render forty dots. That is the break-it switch
   and it is not a straw man — forty dots is what ships, on real
   sites, because the component was chosen when the content had
   four items in it and nobody revisited the choice when it grew.

   Peek off is the quieter failure and the more common one: the
   cards fit the window exactly, the deck looks like a poster,
   and nothing on screen says it scrolls. With the indicator
   also set to none, the deck becomes genuinely undiscoverable
   while remaining perfectly functional, which is the sharpest
   version of the affordance argument.

   The drag obeys D005: the strip is under the finger, so it has
   no transition while held, and the transition belongs to the
   release. Past the ends it rubber-bands rather than stopping
   dead, because a hard stop reads as broken and resistance
   reads as an edge.

   Layout jump: the indicator row is a fixed height whatever is
   in it (forty dots, a counter, a bar, or nothing), the card
   height is fixed, and the verdict line has a min-height. The
   count knob rebuilds the cards but never resizes the deck.

   Reduced motion: nothing here autoplays or loops, and every
   movement is either the user's own hand or the direct
   consequence of them letting go. The snap is the subject of
   one of the knobs, so removing it would remove the lesson.

   Usage:
     <div data-deck-lab data-title="One deck, four decisions"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const GAP = 12, PEEK = 56;
  const COUNTS = [4, 12, 40];
  const INDS = [
    ['dots', 'dots'], ['counter', 'a counter'], ['bar', 'a bar'], ['none', 'nothing'],
  ];

  const TITLES = ['Kickoff', 'Discovery', 'Wireframes', 'Type study', 'Colour', 'Motion pass',
                  'Handoff', 'QA', 'Launch', 'Retro'];

  function injectStyles() {
    if (document.getElementById('deck-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'deck-lab-styles';
    s.textContent = `
    .dk { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .dk { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .dk-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .dk-board { padding: 1.3rem 1.1rem 1.1rem; background: var(--paper); }
    .dk-window { position: relative; overflow: hidden; max-width: 34rem; margin: 0 auto;
                 touch-action: pan-y; cursor: grab; }
    .dk-window.is-drag { cursor: grabbing; }
    .dk-track { display: flex; gap: ${GAP}px; will-change: transform; }
    .dk-track.is-settling { transition: transform 340ms var(--ease-out-strong); }

    .dk-card { flex: none; height: 9.5rem; border-radius: 10px; border: 1px solid var(--rule);
               background: var(--paper-sunk); padding: 0.85rem 0.95rem;
               display: grid; align-content: space-between;
               font-family: var(--sans); -webkit-user-select: none; user-select: none; }
    .dk-card .n { font: 600 0.58rem/1.6 var(--sans); text-transform: uppercase;
                  letter-spacing: 0.1em; color: var(--ink-faint); }
    .dk-card .t { font: 600 1.05rem/1.25 var(--sans); color: var(--ink); }
    .dk-card .m { font: 400 0.72rem/1.5 var(--sans); color: var(--ink-faint); }

    /* Fixed height whatever the indicator is, so forty dots and no dots at all
       occupy the same room. */
    .dk-ind { display: flex; align-items: center; justify-content: center;
              height: 2.3rem; margin-top: 0.5rem; overflow: hidden; }
    .dk-dots { display: flex; gap: 5px; align-items: center; }
    .dk-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rule);
              flex: none; transition: background-color 160ms linear; }
    .dk-dot.on { background: var(--accent); }
    .dk-count { font: 500 0.8rem/1.3 var(--mono); color: var(--ink-soft);
                font-variant-numeric: tabular-nums; }
    .dk-bar { width: 11rem; height: 4px; border-radius: 2px; background: var(--rule);
              overflow: hidden; }
    .dk-bar i { display: block; height: 100%; background: var(--accent);
                transition: width 160ms linear; }

    /* Reserved at the tallest verdict the knobs can produce, per width band, so
       changing a knob never shoves the controls below it. */
    .dk-read { max-width: 34rem; margin: 0.5rem auto 0; min-height: 7rem;
               font: 400 0.82rem/1.5 var(--sans); color: var(--ink-soft); }
    @media (min-width: 520px) { .dk-read { min-height: 6.3rem; } }
    @media (min-width: 700px) { .dk-read { min-height: 5.1rem; } }
    .dk-read b { color: var(--ink); font-weight: 600; }
    .dk-read .no { color: var(--bad); font-weight: 600; }
    .dk-read .yes { color: var(--good); font-weight: 600; }

    .dk-foot { display: grid; gap: 0.6rem; padding: 0.9rem 1.1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .dk-ctl { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
    .dk-cap { min-width: 6.6rem; font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .dk-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .dk-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .dk-seg button:hover { border-color: var(--ink-faint); }
    .dk-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .dk-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media print { .dk-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'dk' + (++uid);
    const title = root.dataset.title || 'One deck, four decisions';
    const st = { count: 12, ind: 'dots', peek: true, snap: true };

    let step = 300, cardW = 260, index = 0, x = 0;
    let holding = false, startX = 0, startT = 0, lastX = 0, lastT = 0, vel = 0, raf = 0;

    root.classList.add('dk');
    root.innerHTML = `
      <div class="dk-head"><span>${title}</span><span>drag the strip, or flick it</span></div>
      <div class="dk-board">
        <div class="dk-window" data-win><div class="dk-track" data-track></div></div>
        <div class="dk-ind" data-ind></div>
        <p class="dk-read" data-read aria-live="polite"></p>
      </div>
      <div class="dk-foot">
        <div class="dk-ctl"><span class="dk-cap">How many</span>
          <div class="dk-seg" data-seg="count" role="group" aria-label="Item count">
            ${COUNTS.map((c) => `<button type="button" data-v="${c}">${c} items</button>`).join('')}
          </div></div>
        <div class="dk-ctl"><span class="dk-cap">Indicator</span>
          <div class="dk-seg" data-seg="ind" role="group" aria-label="Indicator">
            ${INDS.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}
          </div></div>
        <div class="dk-ctl"><span class="dk-cap">Next card</span>
          <div class="dk-seg" data-seg="peek" role="group" aria-label="Peek">
            <button type="button" data-v="yes">peeks</button>
            <button type="button" data-v="no">is hidden</button>
          </div>
          <span class="dk-cap">On release</span>
          <div class="dk-seg" data-seg="snap" role="group" aria-label="Snap or free">
            <button type="button" data-v="yes">it snaps</button>
            <button type="button" data-v="no">it drifts</button>
          </div>
          <button class="btn primary" type="button" data-flick>Flick it for me</button>
        </div>
      </div>
    `;

    const win = root.querySelector('[data-win]');
    const track = root.querySelector('[data-track]');
    const indEl = root.querySelector('[data-ind]');
    const read = root.querySelector('[data-read]');

    /* --- the verdict, which is a function of every knob at once ---------- */
    const IND_SAYS = {
      dots: (n) => n <= 4
        ? `<b>${n} dots.</b> You take them in without counting: you know where you are and how much is left. <span class="yes">Both promises kept.</span>`
        : n <= 12
        ? `<b>${n} dots.</b> Countable if you stop and count, which nobody does mid-swipe. Position has gone approximate.`
        : `<b>${n} dots.</b> <span class="no">Nobody counts forty of anything.</span> It says <em>there are many</em> and nothing else — and it says it in the place you look for <em>where am I</em>.`,
      counter: (n) => `<b>A counter.</b> Exact position and exact length at any size — ${n} items or four hundred. What it can't give you is proportion at a glance.`,
      bar: (n) => `<b>A bar.</b> Proportion at a glance, and it survives ${n} items. It never says there are ${n}, so "one more swipe or nine" stays open.`,
      none: () => `<b>No indicator.</b> Nothing claims how much is left.`,
    };

    function verdict(extra) {
      let s = IND_SAYS[st.ind](st.count);
      if (st.ind === 'none') {
        s += st.peek
          ? ' The peek carries it alone: it says <em>more</em>, not <em>how much more</em>.'
          : ' <span class="no">And nothing says this scrolls at all.</span> The deck is fully functional and completely invisible.';
      } else if (!st.peek) {
        s += ' With the next card hidden, the indicator is the only thing saying there is one.';
      }
      read.innerHTML = (extra ? extra + ' ' : '') + s;
    }

    /* --- geometry -------------------------------------------------------- */
    function measure() {
      const w = win.clientWidth || 480;
      cardW = st.peek ? Math.max(140, w - PEEK) : w;
      step = cardW + GAP;
      track.querySelectorAll('.dk-card').forEach((c) => { c.style.width = cardW + 'px'; });
      index = Math.min(index, st.count - 1);
      x = -index * step;
      apply(false);
    }

    function minX() { return -(st.count - 1) * step; }

    function apply(animate) {
      track.classList.toggle('is-settling', !!animate);
      track.style.transform = `translateX(${x}px)`;
      paintInd();
    }

    function cards() {
      track.innerHTML = Array.from({ length: st.count }, (_, i) => `
        <div class="dk-card" style="width:${cardW}px">
          <span class="n">${String(i + 1).padStart(2, '0')} of ${st.count}</span>
          <span class="t">${TITLES[i % TITLES.length]}</span>
          <span class="m">Session ${i + 1}</span>
        </div>`).join('');
    }

    function buildInd() {
      if (st.ind === 'dots') {
        indEl.innerHTML = `<div class="dk-dots">${
          Array.from({ length: st.count }, () => '<span class="dk-dot"></span>').join('')}</div>`;
      } else if (st.ind === 'counter') {
        indEl.innerHTML = '<span class="dk-count" data-c></span>';
      } else if (st.ind === 'bar') {
        indEl.innerHTML = '<span class="dk-bar"><i data-b></i></span>';
      } else {
        indEl.innerHTML = '';
      }
      paintInd();
    }

    function paintInd() {
      const live = Math.max(0, Math.min(st.count - 1, Math.round(-x / step)));
      if (st.ind === 'dots') {
        indEl.querySelectorAll('.dk-dot').forEach((d, i) => d.classList.toggle('on', i === live));
      } else if (st.ind === 'counter') {
        indEl.querySelector('[data-c]').textContent = `${live + 1} / ${st.count}`;
      } else if (st.ind === 'bar') {
        indEl.querySelector('[data-b]').style.width =
          (((live + 1) / st.count) * 100).toFixed(1) + '%';
      }
      index = live;
    }

    function paint() {
      root.querySelectorAll('.dk-seg').forEach((seg) => {
        const k = seg.dataset.seg;
        const cur = k === 'count' ? String(st.count)
                  : k === 'ind' ? st.ind
                  : (st[k] ? 'yes' : 'no');
        seg.querySelectorAll('button').forEach((b) =>
          b.setAttribute('aria-pressed', String(b.dataset.v === cur)));
      });
    }

    /* --- the hand -------------------------------------------------------- */
    function down(e) {
      cancelAnimationFrame(raf);
      holding = true;
      startX = e.clientX; startT = x;
      lastX = e.clientX; lastT = performance.now(); vel = 0;
      win.setPointerCapture(e.pointerId);
      win.classList.add('is-drag');
      track.classList.remove('is-settling');   /* the hand owns it — no transition */
    }

    function move(e) {
      if (!holding) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      vel = (e.clientX - lastX) / dt;
      lastX = e.clientX; lastT = now;
      let nx = startT + (e.clientX - startX);
      /* Rubber-band past the ends: resistance reads as an edge, a hard stop
         reads as a bug. */
      if (nx > 0) nx *= 0.35;
      else if (nx < minX()) nx = minX() + (nx - minX()) * 0.35;
      x = nx;
      apply(false);
    }

    function up() {
      if (!holding) return;
      holding = false;
      win.classList.remove('is-drag');
      if (st.snap) {
        let t = Math.round(-x / step);
        if (Math.abs(vel) > 0.35) t = index + (vel < 0 ? 1 : -1);
        t = Math.max(0, Math.min(st.count - 1, t));
        x = -t * step;
        apply(true);
        verdict(`<b>Snapped to ${t + 1}.</b> One flick, one card, edges aligned.`);
      } else {
        drift();
      }
    }

    /* Free scroll: momentum, no snapping, stops wherever it stops. */
    function drift() {
      let v = vel * 16;
      const tick = () => {
        v *= 0.94;
        x += v;
        if (x > 0) { x = 0; v = 0; }
        if (x < minX()) { x = minX(); v = 0; }
        apply(false);
        if (Math.abs(v) > 0.4) raf = requestAnimationFrame(tick);
        else {
          const frac = Math.abs((-x / step) % 1);
          verdict(frac > 0.12 && frac < 0.88
            ? `<b>Drifted between ${index + 1} and ${index + 2}</b>, <span class="no">both cut.</span>`
            : `<b>Drifted, and happened to land clean.</b> It won't next time.`);
        }
      };
      raf = requestAnimationFrame(tick);
    }

    win.addEventListener('pointerdown', down);
    win.addEventListener('pointermove', move);
    win.addEventListener('pointerup', up);
    win.addEventListener('pointercancel', up);

    function flick() {
      if (holding) return;
      cancelAnimationFrame(raf);
      const target = Math.min(st.count - 1, index + 1);
      if (st.snap) {
        x = -target * step;
        apply(true);
        verdict(`<b>Snapped to ${target + 1}.</b> One flick, one card, edges aligned.`);
      } else {
        vel = -0.9;
        drift();
      }
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('.dk-seg button');
      if (b) {
        const k = b.closest('.dk-seg').dataset.seg;
        if (k === 'count') { st.count = Number(b.dataset.v); index = 0; x = 0; cards(); buildInd(); measure(); }
        else if (k === 'ind') { st.ind = b.dataset.v; buildInd(); }
        else { st[k] = b.dataset.v === 'yes'; measure(); }
        paint(); verdict();
        return;
      }
      if (e.target.closest('[data-flick]')) flick();
    });

    cards();
    buildInd();
    paint();
    /* Synchronous, not in a rAF: the cards are sized from the window width and
       are 0-wide until this runs. */
    measure();
    verdict();
    window.addEventListener('load', measure);
    window.addEventListener('resize', measure);
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-deck-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
