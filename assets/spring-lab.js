/* ============================================================
   spring-lab.js — a spring and a tween, asked to do the same job.

   Top lane is a real spring, integrated frame by frame from
   stiffness, damping and mass. Bottom lane is what you have been
   writing for seven lessons: a duration and a cubic-bezier.

   Press Move and they look similar. Press "Interrupt mid-flight"
   and they stop looking similar, because the spring carries its
   velocity across the change of target and the tween cannot —
   it has to start again from a standstill.

   The graph plots position over time for both. Overshoot, settle
   and the tween's dead stop are all visible in it.

   Usage:
     <div data-spring-lab data-title="Same move, two models of time"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong', p: [0.23, 1, 0.32, 1] },
    { id: 'out', label: 'ease-out, standard', p: [0, 0, 0.2, 1] },
    { id: 'in-out', label: 'ease-in-out', p: [0.65, 0, 0.35, 1] },
    { id: 'linear', label: 'linear', p: [0, 0, 1, 1] },
  ];

  const PRESETS = {
    gentle:  { label: 'gentle',  stiffness: 130, damping: 18, mass: 1 },
    snappy:  { label: 'snappy',  stiffness: 420, damping: 30, mass: 1 },
    bouncy:  { label: 'bouncy',  stiffness: 320, damping: 12, mass: 1 },
    nobounce:{ label: 'no bounce', stiffness: 220, damping: 30, mass: 1 },
    heavy:   { label: 'heavy',   stiffness: 180, damping: 24, mass: 2.4 },
  };

  /* ---- cubic-bezier, so the tween lane is exact rather than sampled ---- */
  function bezier(p1x, p1y, p2x, p2y) {
    if (p1x === p1y && p2x === p2y) return (t) => t;      // linear
    const A = (a, b) => 1 - 3 * b + 3 * a;
    const B = (a, b) => 3 * b - 6 * a;
    const C = (a) => 3 * a;
    const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
    const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {                        // Newton-Raphson
        const d = slope(t, p1x, p2x);
        if (Math.abs(d) < 1e-6) break;
        t -= (calc(t, p1x, p2x) - x) / d;
      }
      t = Math.max(0, Math.min(1, t));
      return calc(t, p1y, p2y);
    };
  }

  /* ---- the spring itself ----
     Semi-implicit Euler. Two lines of physics, and every property of a
     spring people write blog posts about falls out of them. */
  function step(x, v, target, k, c, m, dt) {
    const a = (-k * (x - target) - c * v) / m;
    const nv = v + a * dt;
    return [x + nv * dt, nv];
  }

  const SETTLED_X = 0.002;
  const SETTLED_V = 0.02;

  // Simulate offline to answer the question a spring refuses to be asked:
  // how long does this take? The answer is derived, never declared.
  function simulate(k, c, m) {
    const dt = 1 / 240;
    let x = 0, v = 0, t = 0, peak = 0;
    const trace = [];
    while (t < 12) {
      [x, v] = step(x, v, 1, k, c, m, dt);
      t += dt;
      trace.push([t * 1000, x]);
      if (x > peak) peak = x;
      if (Math.abs(x - 1) < SETTLED_X && Math.abs(v) < SETTLED_V) break;
    }
    return { ms: Math.round(t * 1000), overshoot: Math.max(0, peak - 1), trace };
  }

  // A spring expressed as CSS. `linear()` takes an arbitrary list of output
  // values, so you can hand the browser the shape of a spring even though
  // CSS has no spring of its own.
  function toLinear(sim, stops = 22) {
    const out = [];
    for (let i = 0; i <= stops; i++) {
      const want = (i / stops) * sim.ms;
      let val = 1;
      for (let j = 0; j < sim.trace.length; j++) {
        if (sim.trace[j][0] >= want) { val = sim.trace[j][1]; break; }
      }
      out.push(i === 0 ? 0 : i === stops ? 1 : Math.round(val * 1000) / 1000);
    }
    return out.join(', ');
  }

  const STYLES = `
    .sl2 {
      margin: 1.75rem 0; border: 1px solid var(--rule); border-radius: 8px;
      background: var(--paper-sunk); overflow: hidden;
    }
    @media (min-width: 1000px) { .sl2 { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .sl2-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .sl2-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .sl2-body { padding: 0.9rem 0.85rem; background: var(--paper); display: grid; gap: 0.75rem; }

    .sl2-lane { display: grid; gap: 0.3rem; }
    .sl2-lanetop {
      display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem;
      font-family: var(--sans); font-size: 0.68rem;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint);
    }
    .sl2-lanetop b { color: var(--ink); font-weight: 600; }
    .sl2-lanetop em {
      font-style: normal; font-family: var(--mono); font-size: 0.68rem;
      letter-spacing: 0; text-transform: none; color: var(--ink-soft);
    }
    .sl2-track {
      position: relative; height: 40px; border-radius: 6px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
    }
    .sl2-track::after {
      content: ''; position: absolute; top: 0; bottom: 0; right: 13px;
      border-right: 1px dashed color-mix(in srgb, var(--ink) 22%, transparent);
    }
    .sl2-dot {
      position: absolute; top: 50%; left: 8px; margin-top: -11px;
      width: 22px; height: 22px; border-radius: 50%; background: var(--accent);
      will-change: transform;
    }
    .sl2-dot.tween { background: color-mix(in srgb, var(--ink) 45%, transparent); }

    .sl2-graph { position: relative; }
    .sl2-graph canvas { display: block; width: 100%; height: 128px; }
    .sl2-key {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.2rem;
      font-family: var(--sans); font-size: 0.68rem; color: var(--ink-faint);
    }
    .sl2-key i { display: inline-block; width: 14px; height: 3px; border-radius: 2px;
      margin-right: 0.3rem; vertical-align: middle; }

    .sl2-read {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
      gap: 0.5rem; padding: 0.7rem 0.85rem;
      border-top: 1px solid var(--rule); background: var(--paper-sunk);
    }
    .sl2-stat { display: grid; gap: 0.1rem; }
    .sl2-stat span {
      font-family: var(--sans); font-size: 0.62rem; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--ink-faint);
    }
    .sl2-stat b { font-family: var(--mono); font-size: 0.9rem; font-weight: 600; color: var(--ink); }
    .sl2-stat b.good { color: var(--good); }
    .sl2-stat b.bad { color: var(--bad); }

    .sl2-foot { padding: 0.85rem; border-top: 1px solid var(--rule); display: grid; gap: 0.85rem; }
    @media (min-width: 760px) {
      .sl2-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    .sl2-presets { grid-column: 1 / -1; display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .sl2-presets .btn { font-size: 0.7rem; padding: 0.22rem 0.55rem; }
    .sl2-css { grid-column: 1 / -1; }
    .sl2-css pre {
      margin: 0.35rem 0 0; padding: 0.6rem 0.7rem; overflow-x: auto;
      border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
      font-family: var(--mono); font-size: 0.68rem; line-height: 1.5; color: var(--ink-soft);
    }
    .sl2-css .control-label { display: block; }
    @media print { .sl2-actions, .sl2-foot .control, .sl2-presets { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('sl2-styles')) return;
    const el = document.createElement('style');
    el.id = 'sl2-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'sl2-' + ++uid;
    const title = root.dataset.title || 'Same move, two models of time';

    const state = {
      stiffness: 180, damping: 20, mass: 1,
      dur: 420, ease: 'out-strong',
    };

    root.id = id;
    root.className = 'sl2';
    root.innerHTML = `
      <div class="sl2-head">
        <span>${title}</span>
        <div class="sl2-actions">
          <button class="btn primary" type="button" data-act="move">Move</button>
          <button class="btn" type="button" data-act="interrupt">Interrupt mid-flight</button>
          <button class="btn" type="button" data-act="reset">Reset</button>
        </div>
      </div>
      <div class="sl2-body">
        <div class="sl2-lane">
          <div class="sl2-lanetop"><b>spring</b><em data-desc-spring></em></div>
          <div class="sl2-track"><div class="sl2-dot spring" data-dot="s"></div></div>
        </div>
        <div class="sl2-lane">
          <div class="sl2-lanetop"><b>tween</b><em data-desc-tween></em></div>
          <div class="sl2-track"><div class="sl2-dot tween" data-dot="t"></div></div>
        </div>
        <div class="sl2-graph">
          <canvas data-graph></canvas>
          <div class="sl2-key">
            <span><i style="background:var(--accent)"></i>spring</span>
            <span><i style="background:color-mix(in srgb, var(--ink) 45%, transparent)"></i>tween</span>
            <span>dashed = target</span>
          </div>
        </div>
      </div>
      <div class="sl2-read">
        <div class="sl2-stat"><span>damping ratio</span><b data-stat-zeta>—</b></div>
        <div class="sl2-stat"><span>behaviour</span><b data-stat-kind>—</b></div>
        <div class="sl2-stat"><span>overshoot</span><b data-stat-over>—</b></div>
        <div class="sl2-stat"><span>settles in</span><b data-stat-settle>—</b></div>
        <div class="sl2-stat"><span>velocity carried</span><b data-stat-vel>—</b></div>
      </div>
      <div class="sl2-foot">
        <div class="sl2-presets">
          ${Object.entries(PRESETS).map(([k, p]) =>
            `<button class="btn" type="button" data-preset="${k}">${p.label}</button>`).join('')}
        </div>
        <div class="control">
          <span class="control-label"><span>stiffness</span>
            <span class="control-value" data-out-stiffness></span></span>
          <input type="range" min="40" max="500" step="10" data-k="stiffness">
        </div>
        <div class="control">
          <span class="control-label"><span>damping</span>
            <span class="control-value" data-out-damping></span></span>
          <input type="range" min="4" max="60" step="1" data-k="damping">
        </div>
        <div class="control">
          <span class="control-label"><span>mass</span>
            <span class="control-value" data-out-mass></span></span>
          <input type="range" min="0.4" max="3" step="0.1" data-k="mass">
        </div>
        <div class="control">
          <span class="control-label"><span>tween duration</span>
            <span class="control-value" data-out-dur></span></span>
          <input type="range" min="120" max="1200" step="20" data-k="dur">
        </div>
        <div class="control">
          <span class="control-label"><span>tween easing</span></span>
          <select data-k="ease">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
        <div class="sl2-css">
          <span class="control-label"><span>this spring, as CSS you can paste</span></span>
          <pre data-css></pre>
        </div>
      </div>
    `;

    const el = (s) => root.querySelector(s);
    const dotS = el('[data-dot="s"]');
    const dotT = el('[data-dot="t"]');
    const canvas = el('[data-graph]');
    const ctx = canvas.getContext('2d');

    let colors = {};
    function readColors() {
      const cs = getComputedStyle(root);
      colors = {
        accent: cs.getPropertyValue('--accent').trim() || '#9a3412',
        ink: cs.getPropertyValue('--ink').trim() || '#16150f',
        faint: cs.getPropertyValue('--ink-faint').trim() || '#8a8778',
        rule: cs.getPropertyValue('--rule').trim() || '#ddd',
      };
    }
    readColors();
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => { readColors(); draw(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }

    /* ---- runtime ---- */
    let travel = 0;
    let target = 0;
    let sx = 0, sv = 0;            // spring position / velocity
    let tFrom = 0, tTo = 0, tEl = 0, tRunning = false;
    let raf = null, last = 0, elapsed = 0;
    let trace = [];                // [t, springX, tweenX]
    let windowMs = 1400;
    let easeFn = bezier(...EASES[0].p);

    function measure() {
      const track = root.querySelector('.sl2-track');
      travel = Math.max(0, track.clientWidth - 22 - 16);
      const w = canvas.clientWidth || 600;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(128 * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      place();
      draw();
    }

    function place() {
      dotS.style.transform = `translateX(${sx * travel}px)`;
      const p = tRunning ? tFrom + (tTo - tFrom) * easeFn(Math.min(tEl / state.dur, 1)) : tTo;
      dotT.style.transform = `translateX(${p * travel}px)`;
    }

    function draw() {
      const w = canvas.clientWidth || 600, h = 128;
      ctx.clearRect(0, 0, w, h);

      // y maps position -0.2 … 1.35 so overshoot has somewhere to go
      const lo = -0.2, hi = 1.35;
      const Y = (v) => h - ((v - lo) / (hi - lo)) * h;
      const X = (t) => (t / windowMs) * w;

      ctx.strokeStyle = colors.rule;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = colors.faint;
      ctx.beginPath(); ctx.moveTo(0, Y(1)); ctx.lineTo(w, Y(1)); ctx.stroke();
      ctx.setLineDash([]);

      if (trace.length < 2) return;
      const line = (idx, color, width) => {
        ctx.strokeStyle = color; ctx.lineWidth = width;
        ctx.beginPath();
        for (let i = 0; i < trace.length; i++) {
          const px = X(trace[i][0]), py = Y(trace[i][idx]);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      line(2, colors.faint, 1.5);
      line(1, colors.accent, 2);
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      elapsed += dt * 1000;

      [sx, sv] = step(sx, sv, target, state.stiffness, state.damping, state.mass, dt);
      if (tRunning) {
        tEl += dt * 1000;
        if (tEl >= state.dur) { tEl = state.dur; tRunning = false; }
      }
      trace.push([elapsed, sx, tRunning || tEl > 0
        ? tFrom + (tTo - tFrom) * easeFn(Math.min(tEl / state.dur, 1))
        : tTo]);
      if (elapsed > windowMs) windowMs = elapsed * 1.05;

      place();
      draw();

      const settled = Math.abs(sx - target) < SETTLED_X && Math.abs(sv) < SETTLED_V;
      if (settled && !tRunning) {
        sx = target; sv = 0; place(); draw(); raf = null; return;
      }
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function move(newTarget, keepTrace) {
      target = newTarget;
      tFrom = tRunning || tEl > 0
        ? tFrom + (tTo - tFrom) * easeFn(Math.min(tEl / state.dur, 1))
        : tTo;
      tTo = newTarget;
      tEl = 0;
      tRunning = true;
      if (!keepTrace) { trace = []; elapsed = 0; windowMs = Math.max(sim.ms, state.dur) * 1.25; }
      start();
    }

    /* ---- readouts ---- */
    let sim = simulate(state.stiffness, state.damping, state.mass);

    function report() {
      sim = simulate(state.stiffness, state.damping, state.mass);
      const z = state.damping / (2 * Math.sqrt(state.stiffness * state.mass));
      const kind = z < 0.98 ? 'underdamped' : z <= 1.02 ? 'critical' : 'overdamped';

      el('[data-stat-zeta]').textContent = z.toFixed(2);
      const kindEl = el('[data-stat-kind]');
      kindEl.textContent = kind;
      kindEl.className = kind === 'underdamped' ? '' : kind === 'critical' ? 'good' : 'bad';
      el('[data-stat-over]').textContent =
        sim.overshoot < 0.001 ? 'none' : (sim.overshoot * 100).toFixed(0) + '%';
      el('[data-stat-settle]').textContent = sim.ms + 'ms';

      el('[data-desc-spring]').textContent =
        `stiffness ${state.stiffness} · damping ${state.damping} · mass ${state.mass}`;
      el('[data-desc-tween]').textContent =
        `${state.dur}ms · ${(EASES.find((e) => e.id === state.ease) || EASES[0]).label}`;

      el('[data-css]').textContent =
        `transition-duration: ${sim.ms}ms;\ntransition-timing-function: linear(\n  ${toLinear(sim)}\n);`;
    }

    /* ---- actions ---- */
    const actions = {
      move() {
        el('[data-stat-vel]').textContent = '—';
        el('[data-stat-vel]').className = '';
        move(target > 0.5 ? 0 : 1, false);
      },
      interrupt() {
        // Send it out, then reverse the target while it is still travelling.
        move(1, false);
        setTimeout(() => {
          const keptS = Math.abs(sv);
          move(0, true);
          const velEl = el('[data-stat-vel]');
          velEl.textContent = keptS.toFixed(2) + ' vs none';
          velEl.className = 'good';
        }, Math.max(state.dur * 0.35, 140));
      },
      reset() {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        sx = 0; sv = 0; target = 0; tFrom = 0; tTo = 0; tEl = 0; tRunning = false;
        trace = []; elapsed = 0;
        el('[data-stat-vel]').textContent = '—';
        el('[data-stat-vel]').className = '';
        place(); draw();
      },
    };

    root.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => (actions[b.dataset.act] || actions.reset)());
    });

    root.querySelectorAll('[data-preset]').forEach((b) => {
      b.addEventListener('click', () => {
        Object.assign(state, PRESETS[b.dataset.preset]);
        root.querySelectorAll('[data-k]').forEach((i) => {
          if (i.dataset.k in PRESETS[b.dataset.preset]) {
            i.value = state[i.dataset.k];
            i.dispatchEvent(new Event('input', { bubbles: false }));
          }
        });
        report();
        actions.move();
      });
    });

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      const out = root.querySelector(`[data-out-${key}]`);
      const sync = () => {
        if (!out) return;
        out.textContent = key === 'dur' ? state[key] + 'ms' : String(state[key]);
      };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseFloat(input.value) : input.value;
        if (key === 'ease') easeFn = bezier(...(EASES.find((e) => e.id === state.ease) || EASES[0]).p);
        sync();
        report();
      });
    });

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt); rt = setTimeout(measure, 150);
    });

    report();
    measure();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-spring-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
