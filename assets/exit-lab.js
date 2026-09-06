/* ============================================================
   exit-lab.js — enter/exit asymmetry, felt side by side.

   Two identical panels, one toggle. The left panel uses whatever
   enter/exit settings you choose. The right panel is the naive
   version: its exit is an exact mirror of its entrance, which is
   what you get by default from a single `transition` declaration.

   Open them, then close them, and watch the right one linger.
   That lingering is the thing this lesson is about.

   Usage:
     <div data-exit-lab data-title="Close them both"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong (entrances)', css: 'cubic-bezier(0.23, 1, 0.32, 1)', kind: 'out' },
    { id: 'out', label: 'ease-out, standard', css: 'cubic-bezier(0, 0, 0.2, 1)', kind: 'out' },
    { id: 'out-soft', label: 'ease-out, soft', css: 'cubic-bezier(0.33, 1, 0.68, 1)', kind: 'out' },
    { id: 'in', label: 'ease-in (exits)', css: 'cubic-bezier(0.4, 0, 1, 1)', kind: 'in' },
    { id: 'in-strong', label: 'ease-in, strong', css: 'cubic-bezier(0.55, 0, 1, 0.45)', kind: 'in' },
    { id: 'in-out', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)', kind: 'inout' },
    { id: 'linear', label: 'linear', css: 'linear', kind: 'linear' },
  ];

  // from = the offscreen/hidden state. Entrances run from -> none.
  const MOTIONS = {
    slide: { label: 'slide up + fade', from: 'translateY(16px)', away: 'translateY(-16px)' },
    drop:  { label: 'slide down + fade', from: 'translateY(-16px)', away: 'translateY(16px)' },
    scale: { label: 'scale + fade', from: 'scale(0.94)', away: 'scale(1.04)' },
    fade:  { label: 'fade only', from: 'none', away: 'none' },
  };

  const STYLES = `
    .xl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .xl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .xl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .xl-actions { display: flex; align-items: center; gap: 0.5rem; }
    .xl-body {
      display: grid; gap: 0.85rem; padding: 0.9rem 0.85rem;
      background: var(--paper);
    }
    @media (min-width: 640px) { .xl-body { grid-template-columns: 1fr 1fr; } }
    .xl-cell { min-width: 0; }
    .xl-celltitle {
      font-family: var(--sans); font-size: 0.68rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--ink-faint); margin-bottom: 0.4rem;
    }
    .xl-celltitle em { font-style: normal; color: var(--accent); }
    .xl-stage {
      height: 132px; border-radius: 6px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
      display: grid; place-items: center; padding: 0.7rem;
    }
    .xl-panel {
      width: 100%; max-width: 230px; padding: 0.75rem 0.85rem;
      border-radius: 8px; background: var(--accent); color: var(--paper);
      font-family: var(--sans); font-size: 0.8rem; line-height: 1.45;
      box-shadow: 0 6px 18px rgba(0,0,0,.16);
      opacity: 0;
    }
    .xl-panel strong { display: block; font-size: 0.85rem; margin-bottom: 0.1rem; }
    .xl-panel[hidden] { display: none; }
    /* The visible lifecycle. Naming the state is half the lesson. */
    .xl-state {
      margin-top: 0.4rem; font-family: var(--mono); font-size: 0.7rem;
      color: var(--ink-faint);
    }
    .xl-state b { color: var(--ink); font-weight: 600; }
    .xl-state b.leaving { color: var(--bad); }
    .xl-state b.entering { color: var(--good); }
    .xl-foot {
      padding: 0.85rem; border-top: 1px solid var(--rule);
      display: grid; gap: 0.85rem;
    }
    @media (min-width: 760px) {
      .xl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    /* proportional duration bars */
    .xl-bars { grid-column: 1 / -1; display: grid; gap: 0.3rem; }
    .xl-bar { display: flex; align-items: center; gap: 0.5rem; }
    .xl-bar span:first-child {
      width: 4.2rem; flex: none; text-align: right;
      font-family: var(--sans); font-size: 0.68rem; color: var(--ink-faint);
    }
    .xl-bar i {
      display: block; height: 9px; border-radius: 2px; background: var(--accent);
      transition: width 160ms linear;
    }
    .xl-bar i.exit { background: var(--good); }
    .xl-bar em {
      font-style: normal; font-family: var(--mono); font-size: 0.68rem;
      color: var(--ink-soft);
    }
    .xl-note {
      grid-column: 1 / -1; margin: 0;
      border-top: 1px dotted var(--rule); padding-top: 0.7rem;
      font-family: var(--sans); font-size: 0.78rem; line-height: 1.5;
      color: var(--ink-soft);
    }
    .xl-note b { color: var(--ink); }
    @media print { .xl-foot, .xl-actions { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('xl-styles')) return;
    const el = document.createElement('style');
    el.id = 'xl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'xl-' + ++uid;
    const title = root.dataset.title || 'Open them, then close them';

    const state = {
      enter: 320,
      exit: 180,
      enterEase: 'out-strong',
      exitEase: 'in',
      motion: 'slide',
      direction: 'reverse',
    };

    root.id = id;
    root.className = 'xl';
    root.innerHTML = `
      <div class="xl-head">
        <span>${title}</span>
        <div class="xl-actions">
          <button class="btn primary" type="button" data-toggle>Open both</button>
          <button class="btn" type="button" data-cycle>Auto-cycle</button>
        </div>
      </div>
      <div class="xl-body">
        <div class="xl-cell">
          <div class="xl-celltitle">tuned · <em>your exit setting</em></div>
          <div class="xl-stage">
            <div class="xl-panel" data-panel-a hidden>
              <strong>Saved</strong>Changes written to your draft.
            </div>
          </div>
          <div class="xl-state">state <b data-state-a>closed</b></div>
        </div>
        <div class="xl-cell">
          <div class="xl-celltitle">naive · exit mirrors entrance</div>
          <div class="xl-stage">
            <div class="xl-panel" data-panel-b hidden>
              <strong>Saved</strong>Changes written to your draft.
            </div>
          </div>
          <div class="xl-state">state <b data-state-b>closed</b></div>
        </div>
      </div>
      <div class="xl-foot">
        <div class="control">
          <span class="control-label"><span>enter duration</span>
            <span class="control-value" data-out-enter></span></span>
          <input type="range" min="80" max="900" step="20" data-k="enter">
        </div>
        <div class="control">
          <span class="control-label"><span>exit duration</span>
            <span class="control-value" data-out-exit></span></span>
          <input type="range" min="0" max="900" step="20" data-k="exit">
        </div>
        <div class="control">
          <span class="control-label"><span>enter easing</span></span>
          <select data-k="enterEase">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
        <div class="control">
          <span class="control-label"><span>exit easing</span></span>
          <select data-k="exitEase">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
        <div class="control">
          <span class="control-label"><span>motion</span></span>
          <select data-k="motion">${Object.entries(MOTIONS).map(
            ([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}</select>
        </div>
        <div class="control">
          <span class="control-label"><span>exit direction</span></span>
          <select data-k="direction">
            <option value="reverse">reverse — back the way it came</option>
            <option value="continue">continue — keeps going outward</option>
          </select>
        </div>
        <div class="xl-bars">
          <div class="xl-bar"><span>enter</span><i data-bar-enter></i><em data-lab-enter></em></div>
          <div class="xl-bar"><span>exit</span><i class="exit" data-bar-exit></i><em data-lab-exit></em></div>
        </div>
        <p class="xl-note" data-note></p>
      </div>`;

    const panelA = root.querySelector('[data-panel-a]');
    const panelB = root.querySelector('[data-panel-b]');
    const stateA = root.querySelector('[data-state-a]');
    const stateB = root.querySelector('[data-state-b]');
    const toggleBtn = root.querySelector('[data-toggle]');
    const cycleBtn = root.querySelector('[data-cycle]');
    const note = root.querySelector('[data-note]');
    const barEnter = root.querySelector('[data-bar-enter]');
    const barExit = root.querySelector('[data-bar-exit]');
    const labEnter = root.querySelector('[data-lab-enter]');
    const labExit = root.querySelector('[data-lab-exit]');

    const ease = (id) => (EASES.find((e) => e.id === id) || EASES[0]);
    let open = false;
    let timers = [];
    let cycling = null;

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function setState(el, text, cls) {
      el.textContent = text;
      el.className = cls || '';
    }

    // dur/curve differ per panel: B always mirrors its own entrance.
    function show(panel, label, dur, curve, fromT) {
      panel.hidden = false;
      panel.style.transition = 'none';
      panel.style.opacity = '0';
      panel.style.transform = fromT;
      void panel.offsetWidth; // flush, so the browser has a start value to animate from
      panel.style.transition = `opacity ${dur}ms ${curve}, transform ${dur}ms ${curve}`;
      panel.style.opacity = '1';
      panel.style.transform = 'none';
      setState(label, 'entering', 'entering');
      timers.push(setTimeout(() => setState(label, 'open'), dur));
    }

    function hide(panel, label, dur, curve, awayT) {
      panel.style.transition = `opacity ${dur}ms ${curve}, transform ${dur}ms ${curve}`;
      panel.style.opacity = '0';
      panel.style.transform = awayT;
      setState(label, 'leaving', 'leaving');
      // The panel must outlive the state change — this timeout is the whole
      // engineering problem of exit animations, in one line.
      timers.push(setTimeout(() => {
        panel.hidden = true;
        setState(label, 'closed');
      }, dur));
    }

    function currentTransforms() {
      const m = MOTIONS[state.motion];
      return {
        from: m.from,
        away: state.direction === 'continue' ? m.away : m.from,
      };
    }

    function doOpen() {
      clearTimers();
      const t = currentTransforms();
      const ec = ease(state.enterEase).css;
      show(panelA, stateA, state.enter, ec, t.from);
      show(panelB, stateB, state.enter, ec, t.from);
      open = true;
      toggleBtn.textContent = 'Close both';
    }

    function doClose() {
      clearTimers();
      const t = currentTransforms();
      // A: your chosen exit. B: an exact mirror of the entrance.
      hide(panelA, stateA, state.exit, ease(state.exitEase).css, t.away);
      hide(panelB, stateB, state.enter, ease(state.enterEase).css, t.from);
      open = false;
      toggleBtn.textContent = 'Open both';
    }

    toggleBtn.addEventListener('click', () => (open ? doClose() : doOpen()));

    cycleBtn.addEventListener('click', () => {
      if (cycling) {
        clearInterval(cycling);
        cycling = null;
        cycleBtn.textContent = 'Auto-cycle';
        return;
      }
      cycleBtn.textContent = 'Stop';
      const beat = () => (open ? doClose() : doOpen());
      beat();
      cycling = setInterval(beat, Math.max(state.enter, state.exit) + 900);
    });

    function report() {
      const ratio = state.enter > 0 ? state.exit / state.enter : 0;
      const maxMs = Math.max(state.enter, state.exit, 1);
      barEnter.style.width = (state.enter / maxMs) * 100 + '%';
      barExit.style.width = (state.exit / maxMs) * 100 + '%';
      labEnter.textContent = state.enter + 'ms';
      labExit.textContent = state.exit + 'ms';

      const pct = Math.round(ratio * 100);
      let verdict;
      if (state.exit === 0) {
        verdict = '<b>Instant.</b> No exit animation at all. This is a legitimate choice and ' +
          'often the right one — nobody has ever complained that a dismissed thing left too fast.';
      } else if (state.exit < 90) {
        verdict = `<b>${pct}% of the entrance.</b> Below about 90ms this stops reading as ` +
          'motion and starts reading as a cut. Still fine for a dismissal.';
      } else if (ratio > 1.1) {
        verdict = `<b>${pct}% of the entrance — the exit is slower than the arrival.</b> ` +
          'This is the version that feels broken. The reader has already decided; every ' +
          'millisecond here is pure latency on a choice they already made.';
      } else if (ratio > 0.85) {
        verdict = `<b>${pct}% — symmetric.</b> This is what a single <code>transition</code> ` +
          'declaration gives you for free, and it is why so much UI feels slightly sticky. ' +
          'Compare the two panels: they are identical right now.';
      } else if (ratio >= 0.45) {
        verdict = `<b>${pct}% — this is the range to live in.</b> The exit is quick enough to ` +
          'feel like a response and slow enough to show where the thing went.';
      } else {
        verdict = `<b>${pct}% — very fast.</b> Nothing wrong with it; at this ratio you are ` +
          'close to just cutting, which for a dismissal is defensible.';
      }

      const xk = ease(state.exitEase).kind;
      if (xk === 'out') {
        verdict += ' <b>But your exit uses an ease-out curve</b>, which decelerates at the ' +
          'end — so it crawls the last few pixels on the way out. Exits want ease-<em>in</em>: ' +
          'slow start, accelerating away.';
      }
      note.innerHTML = verdict;
    }

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      const out = root.querySelector(`[data-out-${key}]`);
      const sync = () => { if (out) out.textContent = state[key] + 'ms'; };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseInt(input.value, 10) : input.value;
        sync();
        report();
      });
    });

    report();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-exit-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
