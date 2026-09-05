/* ============================================================
   stagger-lab.js — the shape of a group entrance.

   A row of items enters with a per-item delay. Underneath, a
   timeline shows each item's occupancy in time, so overlap stops
   being an abstraction: when the bars overlap the entrance reads
   as one gesture, and when they don't it reads as a queue.

   The two readouts are the whole lesson:
     total   = duration + (n - 1) * step
     overlap = step / duration

   Usage:
     <div data-stagger-lab data-title="Find the band"></div>

   Optional:
     data-count / data-duration / data-step / data-travel
     data-order — forward | reverse | center | random
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'cubic-bezier(0.23, 1, 0.32, 1)', label: 'ease-out-strong' },
    { id: 'ease-out', label: 'ease-out' },
    { id: 'cubic-bezier(0.215, 0.61, 0.355, 1)', label: 'power2.out' },
    { id: 'linear', label: 'linear' },
    { id: 'ease-in', label: 'ease-in (wrong, on purpose)' },
  ];

  const ORDERS = [
    { id: 'forward', label: 'forward — DOM order' },
    { id: 'reverse', label: 'reverse — last first' },
    { id: 'center', label: 'from centre out' },
    { id: 'edges', label: 'from edges in' },
    { id: 'random', label: 'random' },
  ];

  const STYLES = `
    .sl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .sl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .sl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .sl-stage {
      display: flex; flex-wrap: wrap; align-items: flex-end;
      gap: 6px; padding: 1.4rem 0.85rem; min-height: 104px;
      background: var(--paper);
      border-bottom: 1px solid var(--rule);
    }
    .sl-item {
      flex: none; width: 26px; border-radius: 5px;
      background: var(--accent);
      color: var(--paper);
      font-family: var(--sans); font-size: 9px; font-weight: 700;
      display: grid; place-items: end center; padding-bottom: 3px;
    }
    /* ---- timeline ---- */
    .sl-tl {
      position: relative; padding: 0.7rem 0.85rem 0.8rem;
      border-bottom: 1px solid var(--rule);
    }
    .sl-tl-title {
      font-family: var(--sans); font-size: 0.66rem; font-weight: 600;
      letter-spacing: 0.09em; text-transform: uppercase;
      color: var(--ink-faint); margin-bottom: 0.45rem;
      display: flex; justify-content: space-between; gap: 1rem;
    }
    .sl-tl-title span:last-child { letter-spacing: 0; text-transform: none;
      font-family: var(--mono); font-size: 0.7rem; }
    .sl-tl-body { position: relative; }
    .sl-tlrow { position: relative; height: 6px; margin-bottom: 2px; }
    .sl-tlbar {
      position: absolute; top: 0; height: 6px; border-radius: 3px;
      background: color-mix(in srgb, var(--accent) 62%, transparent);
    }
    .sl-play {
      position: absolute; top: -2px; bottom: -2px; left: 0; width: 1px;
      background: var(--ink); opacity: 0.55;
    }
    .sl-foot { padding: 0.85rem; display: grid; gap: 0.9rem; }
    @media (min-width: 760px) {
      .sl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.9rem 1.6rem; }
    }
    .sl-verdict {
      grid-column: 1 / -1;
      font-family: var(--sans); font-size: 0.78rem; line-height: 1.5;
      color: var(--ink-soft);
      border-top: 1px dotted var(--rule); padding-top: 0.7rem; margin: 0;
    }
    .sl-verdict b { color: var(--ink); }
    .sl-verdict b.warn { color: var(--bad); }
    @media print { .sl-foot .control input, .sl-foot .control select { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('sl-styles')) return;
    const el = document.createElement('style');
    el.id = 'sl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function control(label, inner) {
    return `<div class="control">
      <span class="control-label"><span>${label}</span>
        <span class="control-value" data-out></span></span>
      ${inner}</div>`;
  }

  function build(root) {
    const id = 'sl-' + ++uid;
    const state = {
      count: parseInt(root.dataset.count || '8', 10),
      duration: parseInt(root.dataset.duration || '420', 10),
      step: parseInt(root.dataset.step || '70', 10),
      travel: parseInt(root.dataset.travel || '20', 10),
      order: root.dataset.order || 'forward',
      ease: EASES[0].id,
    };
    const title = root.dataset.title || 'Stagger lab';

    root.id = id;
    root.className = 'sl';
    root.innerHTML = `
      <div class="sl-head">
        <span>${title}</span>
        <button class="btn primary" type="button" data-play>Replay</button>
      </div>
      <div class="sl-stage" data-stage></div>
      <div class="sl-tl">
        <div class="sl-tl-title">
          <span>Timeline — when each item is moving</span>
          <span data-total>—</span>
        </div>
        <div class="sl-tl-body" data-tl></div>
      </div>
      <div class="sl-foot">
        ${control('items', '<input type="range" min="2" max="20" step="1" data-k="count">')}
        ${control('duration each', '<input type="range" min="80" max="1000" step="20" data-k="duration">')}
        ${control('stagger step', '<input type="range" min="0" max="260" step="5" data-k="step">')}
        ${control('travel', '<input type="range" min="0" max="60" step="2" data-k="travel">')}
        <div class="control">
          <span class="control-label"><span>order</span></span>
          <select data-k="order">${ORDERS.map(
            (o) => `<option value="${o.id}">${o.label}</option>`
          ).join('')}</select>
        </div>
        <div class="control">
          <span class="control-label"><span>easing</span></span>
          <select data-k="ease">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`
          ).join('')}</select>
        </div>
        <p class="sl-verdict" data-verdict></p>
      </div>`;

    const stage = root.querySelector('[data-stage]');
    const tl = root.querySelector('[data-tl]');
    const totalOut = root.querySelector('[data-total]');
    const verdict = root.querySelector('[data-verdict]');
    const inputs = [...root.querySelectorAll('[data-k]')];

    // Randomised order is regenerated per replay, so the shuffle is honest
    // rather than a fixed sequence you learn the shape of.
    let shuffle = [];
    let anims = [];

    function orderIndex(i, n) {
      switch (state.order) {
        case 'reverse': return n - 1 - i;
        case 'center': return Math.round(Math.abs(i - (n - 1) / 2));
        case 'edges': return Math.round((n - 1) / 2 - Math.abs(i - (n - 1) / 2));
        case 'random': return shuffle[i];
        default: return i;
      }
    }

    function maxIndex(n) {
      let m = 0;
      for (let i = 0; i < n; i++) m = Math.max(m, orderIndex(i, n));
      return m;
    }

    function buildItems() {
      stage.innerHTML = '';
      // Varied heights so the group reads as content, not as a progress bar.
      const heights = [46, 62, 38, 70, 52, 44, 66, 40];
      for (let i = 0; i < state.count; i++) {
        const d = document.createElement('div');
        d.className = 'sl-item';
        d.style.height = heights[i % heights.length] + 'px';
        d.textContent = i + 1;
        stage.appendChild(d);
      }
    }

    function drawTimeline(total) {
      tl.innerHTML = '';
      const n = state.count;
      for (let i = 0; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'sl-tlrow';
        const bar = document.createElement('div');
        bar.className = 'sl-tlbar';
        const delay = orderIndex(i, n) * state.step;
        bar.style.left = (delay / total) * 100 + '%';
        bar.style.width = Math.max((state.duration / total) * 100, 1.5) + '%';
        row.appendChild(bar);
        tl.appendChild(row);
      }
      const head = document.createElement('div');
      head.className = 'sl-play';
      tl.appendChild(head);
      return head;
    }

    function play() {
      anims.forEach((a) => a.cancel());
      anims = [];
      const n = state.count;
      if (state.order === 'random') {
        shuffle = [...Array(n).keys()];
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
        }
      }

      const total = state.duration + maxIndex(n) * state.step;
      const playhead = drawTimeline(total);

      [...stage.children].forEach((el, i) => {
        anims.push(
          el.animate(
            [
              { opacity: 0, transform: `translateY(${state.travel}px)` },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: state.duration,
              delay: orderIndex(i, n) * state.step,
              easing: state.ease,
              fill: 'both',
            }
          )
        );
      });
      anims.push(
        playhead.animate(
          [{ transform: 'translateX(0)' }, { transform: `translateX(${tl.clientWidth}px)` }],
          { duration: total, easing: 'linear', fill: 'forwards' }
        )
      );

      report(total);
    }

    function report(total) {
      totalOut.textContent = total + 'ms total';
      const ratio = state.step / state.duration;
      let label, why;
      if (state.step === 0) {
        label = 'simultaneous';
        why = 'Everything lands on the same frame. No reading order, and the page reads as a single flash rather than an arrival.';
      } else if (ratio <= 0.35) {
        label = 'one gesture';
        why = 'Each item starts well before the one ahead of it finishes. The bars overlap heavily, so the eye reads a single wave with direction — this is the band you want.';
      } else if (ratio <= 0.8) {
        label = 'a wave';
        why = 'Still coherent, but the individual items are becoming visible as separate events. Fine for a hero; too much for UI.';
      } else {
        label = 'a queue';
        why = 'The bars barely touch: each item finishes before the next begins, so this reads as a list being dealt out. This is the machine-gun mistake.';
      }
      const slow = total > 1000;
      verdict.innerHTML =
        `<b${ratio > 0.8 ? ' class="warn"' : ''}>${label}</b> · ` +
        `overlap ratio ${ratio.toFixed(2)} (step ÷ duration) · ` +
        `total <b${slow ? ' class="warn"' : ''}>${total}ms</b>` +
        (slow ? ' — past a second, the last item is late enough to feel like a bug.' : '') +
        `<br>${why}`;
    }

    inputs.forEach((input) => {
      const key = input.dataset.k;
      if (input.type === 'range') input.value = state[key];
      else input.value = state[key];
      const out = input.parentElement.querySelector('[data-out]');
      const sync = () => {
        if (out) out.textContent = input.type === 'range'
          ? state[key] + (key === 'travel' ? 'px' : key === 'count' ? '' : 'ms')
          : '';
      };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseInt(input.value, 10) : input.value;
        sync();
        if (key === 'count') buildItems();
        play();
      });
    });

    root.querySelector('[data-play]').addEventListener('click', play);

    buildItems();
    // First run when it scrolls into view — an entrance you didn't see start
    // teaches nothing.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { play(); io.disconnect(); }
      }),
      { threshold: 0.35 }
    );
    io.observe(root);
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-stagger-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
