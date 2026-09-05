/* ============================================================
   easing-lab.js — race several easings against each other.

   Every track gets the SAME duration, so the only variable is the
   curve. That's the point: it isolates easing from speed, which is
   the confusion that makes people reach for longer durations when
   what they actually needed was a different curve.

   Each row shows the curve plotted, with a playhead tracing it in
   real time: horizontal = time elapsed, vertical = progress made.

   Usage:
     <div data-easing-lab
          data-duration="600"
          data-eases="linear | ease-in | ease-out | cubic-bezier(0.23, 1, 0.32, 1)"></div>

   Optional:
     data-min / data-max  — duration slider bounds (default 80 / 1200)
     data-autoplay="loop" — re-race every 2s until interacted with
     data-labels          — override labels, "|"-separated, same order
   ============================================================ */

(() => {
  // Spec values for the CSS keywords. Source: MDN <easing-function>.
  const KEYWORDS = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
  };

  const STYLES = `
    .el {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    .el-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .el-body { padding: 1rem 0.95rem 0.4rem; }
    /* Wider than the prose measure — longer tracks make the curves easier
       to read against each other. */
    @media (min-width: 1000px) {
      .el { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .el-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.3rem;
      padding: 0.55rem 0;
      border-bottom: 1px dotted var(--rule);
    }
    .el-row:last-child { border-bottom: 0; }
    @media (min-width: 700px) {
      .el-row {
        grid-template-columns: 13ch 52px minmax(0, 1fr);
        align-items: center;
        gap: 0.85rem;
      }
    }
    .el-label {
      font-family: var(--mono); font-size: 0.72rem;
      color: var(--ink-soft); line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .el-label b { color: var(--ink); font-weight: 600; }
    .el-graph { position: relative; width: 52px; height: 52px; flex: none; }
    .el-graph svg { display: block; width: 52px; height: 52px; overflow: visible; }
    .el-ph-x { position: absolute; inset: 0; width: 52px; height: 52px; }
    .el-ph-y { position: absolute; top: 0; left: 0; width: 52px; height: 52px; }
    .el-ph {
      position: absolute; left: -3px; bottom: -3px;
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent);
    }
    .el-track {
      position: relative; height: 26px;
      border-radius: 13px;
      background: color-mix(in srgb, var(--ink) 6%, transparent);
      min-width: 0;
    }
    .el-dot {
      position: absolute; top: 3px; left: 3px;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--accent);
    }
    .el-foot {
      padding: 0.7rem 0.95rem 0.85rem;
      border-top: 1px solid var(--rule);
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    }
    .el-foot .controls { flex: 1 1 220px; }
    @media print {
      .el-foot, .el-ph { display: none; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('el-styles')) return;
    const el = document.createElement('style');
    el.id = 'el-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function controlPoints(ease) {
    const key = ease.trim();
    if (KEYWORDS[key]) return KEYWORDS[key];
    const m = key.match(/cubic-bezier\(([^)]+)\)/);
    if (m) {
      const nums = m[1].split(',').map((n) => parseFloat(n.trim()));
      if (nums.length === 4 && nums.every((n) => !Number.isNaN(n))) return nums;
    }
    return null; // steps(), linear(), spring-ish — no plot, still animates
  }

  function curveSvg(cp) {
    const S = 52;
    // y is inverted in SVG space: progress 0 sits at the bottom.
    const px = (x) => (x * S).toFixed(2);
    const py = (y) => ((1 - y) * S).toFixed(2);
    const grid = `<path d="M0 ${S} L${S} ${S} M0 ${S} L0 0"
        stroke="var(--rule)" stroke-width="1" fill="none"/>`;
    if (!cp) {
      return `<svg viewBox="0 0 ${S} ${S}" aria-hidden="true">${grid}
        <text x="${S / 2}" y="${S / 2 + 4}" text-anchor="middle"
          font-size="9" fill="var(--ink-faint)">n/a</text></svg>`;
    }
    const [x1, y1, x2, y2] = cp;
    const d = `M0 ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${px(1)} ${py(1)}`;
    return `<svg viewBox="0 0 ${S} ${S}" aria-hidden="true">
      ${grid}
      <path d="M0 ${S} L${S} 0" stroke="var(--rule)" stroke-width="1"
        stroke-dasharray="2 3" fill="none"/>
      <path d="${d}" stroke="var(--accent)" stroke-width="1.75"
        fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function build(root) {
    const duration = parseInt(root.dataset.duration || '600', 10);
    const eases = (root.dataset.eases || 'linear | ease-in | ease-out')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const labels = root.dataset.labels
      ? root.dataset.labels.split('|').map((s) => s.trim())
      : null;
    const min = parseInt(root.dataset.min || '80', 10);
    const max = parseInt(root.dataset.max || '1200', 10);
    const title = root.dataset.title || 'Same duration, different curve';

    root.className = 'el';
    root.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'el-head';
    head.innerHTML = `<span>${title}</span>`;
    const raceBtn = document.createElement('button');
    raceBtn.className = 'btn primary';
    raceBtn.type = 'button';
    raceBtn.textContent = 'Race';
    head.appendChild(raceBtn);

    const body = document.createElement('div');
    body.className = 'el-body';

    const rows = eases.map((ease, i) => {
      const cp = controlPoints(ease);
      const row = document.createElement('div');
      row.className = 'el-row';

      const label = document.createElement('div');
      label.className = 'el-label';
      label.innerHTML = labels ? `<b>${labels[i]}</b>` : ease;

      const graph = document.createElement('div');
      graph.className = 'el-graph';
      graph.innerHTML = curveSvg(cp);
      const phX = document.createElement('div');
      phX.className = 'el-ph-x';
      const phY = document.createElement('div');
      phY.className = 'el-ph-y';
      const ph = document.createElement('div');
      ph.className = 'el-ph';
      phY.appendChild(ph);
      phX.appendChild(phY);
      graph.appendChild(phX);

      const track = document.createElement('div');
      track.className = 'el-track';
      const dot = document.createElement('div');
      dot.className = 'el-dot';
      track.appendChild(dot);

      row.append(label, graph, track);
      body.appendChild(row);
      return { ease, dot, track, phX, phY };
    });

    const foot = document.createElement('div');
    foot.className = 'el-foot';
    foot.innerHTML = `
      <div class="controls">
        <div class="control">
          <span class="control-label">
            <span>duration</span>
            <span class="control-value" data-dur-out>${duration}ms</span>
          </span>
          <input type="range" min="${min}" max="${max}" step="10"
            value="${duration}" data-dur aria-label="Animation duration">
        </div>
      </div>`;

    root.append(head, body, foot);

    const durInput = foot.querySelector('[data-dur]');
    const durOut = foot.querySelector('[data-dur-out]');
    let current = duration;
    let animations = [];
    let interacted = false;

    function race() {
      animations.forEach((a) => a.cancel());
      animations = [];
      rows.forEach(({ ease, dot, track, phX, phY }) => {
        const travel = Math.max(track.clientWidth - 26, 0);
        const opts = { duration: current, fill: 'forwards' };
        animations.push(
          dot.animate(
            [{ transform: 'translateX(0px)' }, { transform: `translateX(${travel}px)` }],
            { ...opts, easing: ease }
          ),
          // playhead: X is time (always linear), Y is progress (eased).
          phX.animate(
            [{ transform: 'translateX(0px)' }, { transform: 'translateX(52px)' }],
            { ...opts, easing: 'linear' }
          ),
          phY.animate(
            [{ transform: 'translateY(0px)' }, { transform: 'translateY(-52px)' }],
            { ...opts, easing: ease }
          )
        );
      });
    }

    function reset() {
      animations.forEach((a) => a.cancel());
      animations = [];
    }

    raceBtn.addEventListener('click', () => {
      interacted = true;
      reset();
      requestAnimationFrame(race);
    });
    durInput.addEventListener('input', () => {
      interacted = true;
      current = parseInt(durInput.value, 10);
      durOut.textContent = current + 'ms';
      reset();
      requestAnimationFrame(race);
    });

    if (root.dataset.autoplay === 'loop') {
      const loop = setInterval(() => {
        if (interacted) return clearInterval(loop);
        reset();
        requestAnimationFrame(race);
      }, Math.max(current + 900, 1600));
      // First pass shortly after the component scrolls into view.
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !interacted) {
            race();
            io.disconnect();
          }
        });
      }, { threshold: 0.4 });
      io.observe(root);
    }
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-easing-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
