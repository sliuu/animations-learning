/* ============================================================
   cost-lab.js — the rendering pipeline, felt rather than read.

   Two lanes of identical elements animate side by side. The top
   lane animates a property you choose; the bottom lane is the
   control and only ever animates transform + opacity. A frame
   counter watches the main thread.

   The point is not the fps number — machines differ. The point is
   that one lane has a breaking point and the other does not, and
   that "Jam main thread" freezes one lane while the other keeps
   gliding, because compositing happens on a different thread.

   Usage:
     <div data-cost-lab data-title="Pay per frame" data-count="400"></div>

   Optional:
     data-count — starting element count (default 400)
     data-max   — slider ceiling (default 1500)
   ============================================================ */

(() => {
  let uid = 0;

  // from/to are raw declarations; they become a two-keyframe animation.
  const PROPS = [
    { id: 'margin-left', label: 'margin-left', tier: 'layout',
      from: 'margin-left: 0px;', to: 'margin-left: 18px;' },
    { id: 'width', label: 'width', tier: 'layout',
      from: 'width: 12px;', to: 'width: 30px;' },
    { id: 'padding-left', label: 'padding-left', tier: 'layout',
      from: 'padding-left: 0px;', to: 'padding-left: 18px;' },
    { id: 'box-shadow', label: 'box-shadow', tier: 'paint',
      from: 'box-shadow: 0 0 0 rgba(0,0,0,0);',
      to: 'box-shadow: 0 4px 12px rgba(0,0,0,0.5);' },
    { id: 'background-color', label: 'background-color', tier: 'paint',
      from: 'background-color: var(--accent);',
      to: 'background-color: var(--good);' },
    { id: 'border-radius', label: 'border-radius', tier: 'paint',
      from: 'border-radius: 2px;', to: 'border-radius: 50%;' },
    { id: 'filter', label: 'filter: blur()', tier: 'credit',
      from: 'filter: blur(0px);', to: 'filter: blur(3px);' },
    { id: 'transform', label: 'transform + opacity', tier: 'free',
      from: 'transform: translateX(0); opacity: 1;',
      to: 'transform: translateX(18px); opacity: 0.45;' },
  ];

  const TIERS = {
    layout: {
      stages: ['Style', 'Layout', 'Paint', 'Composite'],
      note: 'Geometry moved, so the browser re-runs the whole pipeline — for this element and every sibling whose position depends on it.',
    },
    paint: {
      stages: ['Style', 'Paint', 'Composite'],
      note: 'Nothing moved, so layout is skipped — but every affected pixel is decided again, every frame.',
    },
    credit: {
      stages: ['Style', 'Paint', 'Composite'],
      note: 'GPU-accelerated, but not free: blur cost scales with radius and with the area being blurred.',
    },
    free: {
      stages: ['Style', 'Composite'],
      note: 'Composite only. Both lanes are now running the same thing — this is your baseline.',
    },
  };

  const STYLES = `
    .cl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .cl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .cl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .cl-actions { display: flex; align-items: center; gap: 0.7rem; }
    .cl-readout {
      font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0;
      text-transform: none; color: var(--ink-soft);
      display: flex; gap: 0.7rem;
    }
    .cl-readout b { font-weight: 600; color: var(--good); }
    .cl-readout b.warn { color: var(--accent); }
    .cl-readout b.bad { color: var(--bad); }
    .cl-body { padding: 0.6rem 0.85rem 0.2rem; }
    .cl-row { padding: 0.5rem 0; border-bottom: 1px dotted var(--rule); }
    .cl-row:last-child { border-bottom: 0; }
    .cl-rowhead {
      display: flex; align-items: baseline; gap: 0.55rem;
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-faint);
      margin-bottom: 0.35rem;
    }
    .cl-rowhead b {
      font-family: var(--mono); font-size: 0.74rem;
      color: var(--ink); font-weight: 600;
    }
    .cl-lane {
      display: flex; flex-wrap: wrap; align-content: flex-start;
      gap: 3px; height: 62px; overflow: hidden;
      padding: 3px; border-radius: 5px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
    }
    .cl-dot {
      flex: none; width: 12px; height: 12px; border-radius: 2px;
      background: var(--accent);
    }
    .cl.is-paused .cl-dot { animation-play-state: paused !important; }
    .cl-foot {
      padding: 0.75rem 0.85rem 0.9rem;
      border-top: 1px solid var(--rule);
      display: grid; gap: 0.8rem;
    }
    @media (min-width: 700px) {
      .cl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); align-items: start; }
    }
    .cl-stages { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.45rem; }
    .cl-chip {
      font-family: var(--sans); font-size: 0.66rem; font-weight: 600;
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0.2rem 0.45rem; border-radius: 4px;
      border: 1px solid var(--rule); color: var(--ink-faint);
    }
    .cl-chip.on {
      border-color: var(--accent); color: var(--paper);
      background: var(--accent);
    }
    .cl-note {
      font-family: var(--sans); font-size: 0.75rem; line-height: 1.5;
      color: var(--ink-soft); margin: 0;
    }
    /* --- the freeze banner. Height is always reserved so nothing shifts. --- */
    .cl-banner {
      height: 1.5rem; display: flex; align-items: center; justify-content: center;
      margin: 0 0 0.4rem; border-radius: 4px;
      font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      opacity: 0; transition: opacity 140ms linear;
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      color: var(--ink-soft);
    }
    .cl-banner.show { opacity: 1; }
    .cl-banner.hot { background: var(--bad); color: #fff; }

    /* --- main thread vs compositor, side by side --- */
    .cl-vitals {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.4rem;
      padding: 0.5rem 0 0.15rem;
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-faint);
    }
    .cl-vital { display: flex; align-items: center; gap: 0.4rem; }
    .cl-vital b {
      font-family: var(--mono); font-size: 0.78rem; font-weight: 600;
      color: var(--ink); font-variant-numeric: tabular-nums;
      min-width: 3.4ch; text-align: right;
    }
    .cl-spin {
      width: 13px; height: 13px; border-radius: 3px;
      background: var(--good);
      animation: cl-spin 1.1s linear infinite;
    }
    .cl.is-paused .cl-spin { animation-play-state: paused; }
    @keyframes cl-spin { to { transform: rotate(360deg); } }

    /* --- the frame strip: one bar per frame. This is what "smooth" looks like. --- */
    .cl-strip {
      display: block; width: 100%; height: 46px;
      margin-top: 0.15rem; border-radius: 4px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
    }
    .cl-striplabel {
      display: flex; justify-content: space-between;
      font-family: var(--sans); font-size: 0.64rem; color: var(--ink-faint);
      margin-top: 0.25rem;
    }
    .cl-hint {
      font-family: var(--sans); font-size: 0.72rem; line-height: 1.45;
      color: var(--bad); margin: 0.4rem 0 0;
    }
    .cl-hint[hidden] { display: none; }
    @media print { .cl-foot, .cl-actions, .cl-strip, .cl-vitals { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('cl-styles')) return;
    const el = document.createElement('style');
    el.id = 'cl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'cl-' + ++uid;
    const startCount = parseInt(root.dataset.count || '400', 10);
    const maxCount = parseInt(root.dataset.max || '1500', 10);
    const title = root.dataset.title || 'Pay per frame';

    root.id = id;
    root.className = 'cl';
    root.innerHTML = `
      <div class="cl-head">
        <span>${title}</span>
        <div class="cl-actions">
          <span class="cl-readout">
            <span><b data-fps>--</b> fps</span>
            <span>worst frame <b data-worst>--</b></span>
          </span>
          <button class="btn" type="button" data-jam>Jam main thread</button>
        </div>
      </div>
      <div class="cl-body">
        <div class="cl-banner" data-banner>&nbsp;</div>
        <div class="cl-row">
          <div class="cl-rowhead">animating <b data-propname>margin-left</b></div>
          <div class="cl-lane" data-lane-a></div>
        </div>
        <div class="cl-row">
          <div class="cl-rowhead">control · <b>transform + opacity</b></div>
          <div class="cl-lane" data-lane-b></div>
        </div>
        <div class="cl-row">
          <div class="cl-vitals">
            <span class="cl-vital">main thread alive for <b data-heart>0</b> frames</span>
            <span class="cl-vital"><span class="cl-spin"></span> compositor (CSS transform)</span>
          </div>
          <canvas class="cl-strip" data-strip></canvas>
          <div class="cl-striplabel">
            <span>← older frames · each bar is one frame · taller = slower</span>
            <span>dotted line = 16.7ms budget</span>
          </div>
        </div>
      </div>
      <div class="cl-foot">
        <div class="controls">
          <div class="control">
            <span class="control-label"><span>property</span></span>
            <select data-prop>${PROPS.map(
              (p) => `<option value="${p.id}">${p.label}</option>`
            ).join('')}</select>
          </div>
          <div class="control">
            <span class="control-label">
              <span>elements per lane</span>
              <span class="control-value" data-count-out>${startCount}</span>
            </span>
            <input type="range" min="20" max="${maxCount}" step="20"
              value="${startCount}" data-count aria-label="Elements per lane">
          </div>
          <div class="control">
            <span class="control-label">
              <span>how long to block the main thread</span>
              <span class="control-value" data-jamms-out>900ms</span>
            </span>
            <input type="range" min="300" max="2500" step="100" value="900"
              data-jamms aria-label="Jam duration">
          </div>
        </div>
        <div>
          <div class="cl-stages" data-stages></div>
          <p class="cl-note" data-note></p>
          <p class="cl-hint" data-hint hidden></p>
        </div>
      </div>`;

    const laneA = root.querySelector('[data-lane-a]');
    const laneB = root.querySelector('[data-lane-b]');
    const propSel = root.querySelector('[data-prop]');
    const countIn = root.querySelector('[data-count]');
    const countOut = root.querySelector('[data-count-out]');
    const propName = root.querySelector('[data-propname]');
    const stagesEl = root.querySelector('[data-stages]');
    const noteEl = root.querySelector('[data-note]');
    const fpsOut = root.querySelector('[data-fps]');
    const worstOut = root.querySelector('[data-worst]');
    const jamBtn = root.querySelector('[data-jam]');
    const banner = root.querySelector('[data-banner]');
    const heartOut = root.querySelector('[data-heart]');
    const strip = root.querySelector('[data-strip]');
    const hintEl = root.querySelector('[data-hint]');
    const jamMsIn = root.querySelector('[data-jamms]');
    const jamMsOut = root.querySelector('[data-jamms-out]');

    const sheet = document.createElement('style');
    sheet.id = id + '-anim';
    document.head.appendChild(sheet);

    function fill(lane, n) {
      const have = lane.childElementCount;
      if (have === n) return;
      if (have > n) {
        while (lane.childElementCount > n) lane.lastElementChild.remove();
        return;
      }
      const frag = document.createDocumentFragment();
      for (let i = have; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'cl-dot';
        frag.appendChild(d);
      }
      lane.appendChild(frag);
    }

    function applyProp() {
      const p = PROPS.find((x) => x.id === propSel.value) || PROPS[0];
      const tier = TIERS[p.tier];

      sheet.textContent = `
        #${id} [data-lane-a] .cl-dot {
          animation: ${id}-a 1.1s ease-in-out infinite alternate;
        }
        @keyframes ${id}-a { from { ${p.from} } to { ${p.to} } }
        #${id} [data-lane-b] .cl-dot {
          animation: ${id}-b 1.1s ease-in-out infinite alternate;
        }
        @keyframes ${id}-b {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(18px); opacity: 0.45; }
        }`;

      propName.textContent = p.label;
      stagesEl.innerHTML = ['Style', 'Layout', 'Paint', 'Composite']
        .map((s) => `<span class="cl-chip${tier.stages.includes(s) ? ' on' : ''}">${s}</span>`)
        .join('');
      noteEl.textContent = tier.note;
      if (hintEl) {
        const bothFree = p.tier === 'free';
        hintEl.hidden = !bothFree;
        hintEl.textContent = bothFree
          ? 'Heads up: both lanes are composited right now, so “Jam main thread” will freeze '
            + 'neither of them. That is the point — but to see the contrast, switch to margin-left.'
          : '';
      }
      resetMeter();
    }

    // ----- frame meter -----
    // Counts rAF callbacks, which is exactly the thing that stops when the
    // main thread is busy — the same thread your animation is stuck behind
    // unless it is composited.
    let frames = 0;
    let windowStart = performance.now();
    let lastFrame = performance.now();
    let worst = 0;
    let raf = null;
    let heart = 0;

    // One entry per frame. The strip draws these, which is the whole point:
    // "smooth" is a shape you can see, not a number you have to trust.
    const BUDGET = 1000 / 60;
    const HIST = 150;
    const hist = [];

    let colors = readColors();
    function readColors() {
      const cs = getComputedStyle(root);
      const pick = (n, f) => (cs.getPropertyValue(n) || '').trim() || f;
      return {
        good: pick('--good', '#3f6212'),
        warn: pick('--accent', '#9a3412'),
        bad: pick('--bad', '#9f1239'),
        rule: pick('--ink-faint', '#8a8778'),
      };
    }
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onScheme = () => { colors = readColors(); drawStrip(); };
      if (mq.addEventListener) mq.addEventListener('change', onScheme);
    }

    function sizeStrip() {
      const dpr = window.devicePixelRatio || 1;
      const w = strip.clientWidth || 600;
      const h = strip.clientHeight || 46;
      strip.width = Math.round(w * dpr);
      strip.height = Math.round(h * dpr);
      const ctx = strip.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawStrip();
    }

    function drawStrip() {
      const ctx = strip.getContext('2d');
      if (!ctx) return;
      const w = strip.clientWidth || 600;
      const h = strip.clientHeight || 46;
      ctx.clearRect(0, 0, w, h);

      // A frame at exactly budget draws a quarter-height bar, so a dropped
      // frame has somewhere to grow into.
      const unit = h / 4 / BUDGET;
      const barW = w / HIST;

      // budget line
      const by = h - BUDGET * unit;
      ctx.save();
      ctx.strokeStyle = colors.rule;
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(w, by);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < hist.length; i++) {
        const gap = hist[i];
        const bh = Math.min(gap * unit, h);
        const x = w - (hist.length - i) * barW;
        ctx.fillStyle =
          gap > BUDGET * 2.5 ? colors.bad : gap > BUDGET * 1.4 ? colors.warn : colors.good;
        ctx.fillRect(x, h - bh, Math.max(barW - 1, 1), bh);
      }
    }

    function resetMeter() {
      frames = 0;
      worst = 0;
      heart = 0;
      hist.length = 0;
      windowStart = performance.now();
      lastFrame = windowStart;
      worstOut.textContent = '--';
      worstOut.className = '';
      if (heartOut) heartOut.textContent = '0';
      drawStrip();
    }

    function tick(now) {
      const gap = now - lastFrame;
      lastFrame = now;
      hist.push(gap);
      if (hist.length > HIST) hist.shift();
      heart++;
      heartOut.textContent = heart;
      drawStrip();
      if (gap > worst) {
        worst = gap;
        worstOut.textContent = Math.round(worst) + 'ms';
        worstOut.className = worst > 60 ? 'bad' : worst > 25 ? 'warn' : '';
      }
      frames++;
      if (now - windowStart >= 500) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        fpsOut.textContent = fps;
        fpsOut.className = fps >= 55 ? '' : fps >= 30 ? 'warn' : 'bad';
        frames = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (raf) return;
      root.classList.remove('is-paused');
      resetMeter();
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      root.classList.add('is-paused');
      fpsOut.textContent = '--';
      fpsOut.className = '';
    }

    // ----- wiring -----
    propSel.addEventListener('change', applyProp);
    countIn.addEventListener('input', () => {
      const n = parseInt(countIn.value, 10);
      countOut.textContent = n;
      fill(laneA, n);
      fill(laneB, n);
      resetMeter();
    });
    jamMsIn.addEventListener('input', () => {
      jamMsOut.textContent = jamMsIn.value + 'ms';
    });

    let jamming = false;
    function say(text, hot) {
      banner.textContent = text;
      banner.classList.add('show');
      banner.classList.toggle('hot', !!hot);
    }

    jamBtn.addEventListener('click', () => {
      if (jamming) return;
      jamming = true;
      jamBtn.disabled = true;
      resetMeter();

      // Count down first. The old version blocked synchronously inside the
      // click handler, so the freeze was over before anyone looked up.
      let n = 3;
      say('watch both lanes — blocking in ' + n);

      const step = () => {
        n -= 1;
        if (n > 0) {
          say('watch both lanes — blocking in ' + n);
          setTimeout(step, 800);
          return;
        }
        say('MAIN THREAD BLOCKED', true);
        // Two rAFs guarantees the banner is actually on screen before we
        // stop the thread that would have painted it.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const ms = parseInt(jamMsIn.value, 10);
          // Deliberate synchronous block. This is what a heavy re-render, a
          // big JSON parse or a hydration pass does to your page.
          const end = performance.now() + ms;
          while (performance.now() < end) { /* burn */ }
          say('unblocked — one bar on the strip is ' + ms + 'ms wide');
          jamming = false;
          jamBtn.disabled = false;
          setTimeout(() => banner.classList.remove('show'), 2600);
        }));
      };
      setTimeout(step, 800);
    });

    fill(laneA, startCount);
    fill(laneB, startCount);
    applyProp();
    sizeStrip();
    if (window.ResizeObserver) new ResizeObserver(sizeStrip).observe(strip);

    // Only run while visible — this lane is intentionally expensive.
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.15 }
    ).observe(root);
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-cost-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
