/* ============================================================
   tool-lab.js — the same effect, built three ways.

   Three lanes. Identical motion: a dot slides right and fades in.
   Lane 1 is a CSS transition. Lane 2 is a CSS keyframe animation.
   Lane 3 is the Web Animations API, `el.animate()`.

   Then five buttons ask each lane to do something. Play is easy —
   all three look the same. It is the other four that separate them,
   and that difference is the entire basis for choosing a tool.

   Usage:
     <div data-tool-lab data-title="Ask all three to do the same thing"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const EASES = [
    { id: 'out-strong', label: 'ease-out, strong', css: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { id: 'out', label: 'ease-out, standard', css: 'cubic-bezier(0, 0, 0.2, 1)' },
    { id: 'in-out', label: 'ease-in-out', css: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    { id: 'linear', label: 'linear', css: 'linear' },
  ];

  const STYLES = `
    .tl {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    @media (min-width: 1000px) {
      .tl { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .tl-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .tl-actions { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .tl-body { padding: 0.9rem 0.85rem; background: var(--paper); display: grid; gap: 0.9rem; }

    .tl-lane { display: grid; gap: 0.35rem; }
    .tl-lanetop {
      display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem;
      font-family: var(--sans); font-size: 0.68rem;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint);
    }
    .tl-lanetop b { color: var(--ink); font-weight: 600; }
    .tl-lanetop code {
      font-family: var(--mono); font-size: 0.68rem; text-transform: none;
      letter-spacing: 0; color: var(--ink-soft);
    }
    .tl-track {
      position: relative; height: 44px; border-radius: 6px;
      background: color-mix(in srgb, var(--ink) 4%, transparent);
      overflow: hidden;
    }
    .tl-dot {
      position: absolute; top: 50%; left: 8px; margin-top: -13px;
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--accent); opacity: 0.22;
      will-change: transform, opacity;
    }
    /* Lane 1 — a transition, and nothing else. Declared here, on the
       resting rule, so it governs the trip in both directions. */
    .tl-dot.t-css { transform: translateX(0); }
    .tl-dot.t-css.on { transform: translateX(var(--end, 0px)); opacity: 1; }

    .tl-status {
      font-family: var(--mono); font-size: 0.68rem; color: var(--ink-faint);
      min-height: 1.1em;
    }
    .tl-status b { font-weight: 600; }
    .tl-status b.yes { color: var(--good); }
    .tl-status b.no { color: var(--bad); }
    .tl-status b.part { color: var(--warn, var(--accent)); }

    .tl-foot {
      padding: 0.85rem; border-top: 1px solid var(--rule);
      display: grid; gap: 0.85rem;
    }
    @media (min-width: 760px) {
      .tl-foot { grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0.85rem 1.6rem; }
    }
    .tl-matrix { grid-column: 1 / -1; overflow-x: auto; }
    .tl-matrix table { width: 100%; border-collapse: collapse; font-family: var(--sans); }
    .tl-matrix th, .tl-matrix td {
      padding: 0.32rem 0.5rem; text-align: left; font-size: 0.74rem;
      border-bottom: 1px solid var(--rule); white-space: nowrap;
    }
    .tl-matrix th { color: var(--ink-faint); font-weight: 600; }
    .tl-matrix td:first-child { color: var(--ink-soft); }
    .tl-matrix tr[data-row].lit td { background: color-mix(in srgb, var(--accent) 10%, transparent); }
    .tl-matrix tr[data-row].lit td:first-child { color: var(--ink); font-weight: 600; }
    .tl-y { color: var(--good); font-weight: 600; }
    .tl-n { color: var(--bad); font-weight: 600; }
    .tl-p { color: var(--accent); font-weight: 600; }
    @media print { .tl-actions, .tl-foot .control { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('tl-styles')) return;
    const el = document.createElement('style');
    el.id = 'tl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  // Reads how far along a lane actually is, in percent, by looking at the
  // computed transform. This is the only honest way to ask a CSS transition
  // "where are you right now" — it has no playhead to interrogate.
  function progressOf(dot, end) {
    if (!end) return 0;
    const t = getComputedStyle(dot).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix.*\((.+)\)/);
    if (!m) return 0;
    const parts = m[1].split(',').map(parseFloat);
    const x = parts.length === 6 ? parts[4] : parts[12];
    return Math.round(Math.max(0, Math.min(1, x / end)) * 100);
  }

  function build(root) {
    const id = 'tl-' + ++uid;
    const title = root.dataset.title || 'Ask all three to do the same thing';

    const state = { dur: 1200, ease: 'out-strong' };
    let end = 0;
    let waapi = null;          // the Animation object from el.animate()
    const timers = [];

    root.id = id;
    root.className = 'tl';
    root.innerHTML = `
      <div class="tl-head">
        <span>${title}</span>
        <div class="tl-actions">
          <button class="btn primary" type="button" data-act="play">Play</button>
          <button class="btn" type="button" data-act="interrupt">Interrupt at 40%</button>
          <button class="btn" type="button" data-act="pause">Pause at 40%</button>
          <button class="btn" type="button" data-act="seek">Seek to 40%</button>
          <button class="btn" type="button" data-act="reset">Reset</button>
        </div>
      </div>
      <div class="tl-body">
        <div class="tl-lane">
          <div class="tl-lanetop"><b>1 · CSS transition</b><code>transition: transform 1.2s</code></div>
          <div class="tl-track"><div class="tl-dot t-css" data-dot="css"></div></div>
          <div class="tl-status" data-status="css">at rest</div>
        </div>
        <div class="tl-lane">
          <div class="tl-lanetop"><b>2 · CSS keyframes</b><code>animation: run 1.2s</code></div>
          <div class="tl-track"><div class="tl-dot t-kf" data-dot="kf"></div></div>
          <div class="tl-status" data-status="kf">at rest</div>
        </div>
        <div class="tl-lane">
          <div class="tl-lanetop"><b>3 · Web Animations API</b><code>el.animate([...], {...})</code></div>
          <div class="tl-track"><div class="tl-dot t-wa" data-dot="wa"></div></div>
          <div class="tl-status" data-status="wa">at rest</div>
        </div>
      </div>
      <div class="tl-foot">
        <div class="control">
          <span class="control-label"><span>duration</span>
            <span class="control-value" data-out-dur></span></span>
          <input type="range" min="400" max="2400" step="100" data-k="dur">
        </div>
        <div class="control">
          <span class="control-label"><span>easing</span></span>
          <select data-k="ease">${EASES.map(
            (e) => `<option value="${e.id}">${e.label}</option>`).join('')}</select>
        </div>
        <div class="tl-matrix">
          <table>
            <thead><tr>
              <th>Can it…</th><th>transition</th><th>keyframes</th><th>WAAPI</th>
            </tr></thead>
            <tbody>
              <tr data-row="play"><td>run the thing</td>
                <td class="tl-y">yes</td><td class="tl-y">yes</td><td class="tl-y">yes</td></tr>
              <tr data-row="interrupt"><td>redirect mid-flight, from where it is</td>
                <td class="tl-y">yes</td><td class="tl-n">no — snaps</td><td class="tl-y">yes</td></tr>
              <tr data-row="pause"><td>pause</td>
                <td class="tl-n">no</td><td class="tl-y">yes</td><td class="tl-y">yes</td></tr>
              <tr data-row="seek"><td>seek to an arbitrary point</td>
                <td class="tl-n">no</td><td class="tl-p">hack</td><td class="tl-y">yes</td></tr>
              <tr data-row="steps"><td>hold 3+ steps in one declaration</td>
                <td class="tl-n">no</td><td class="tl-y">yes</td><td class="tl-y">yes</td></tr>
              <tr data-row="nojs"><td>work with JavaScript switched off</td>
                <td class="tl-y">yes</td><td class="tl-y">yes</td><td class="tl-n">no</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const dots = {
      css: root.querySelector('[data-dot="css"]'),
      kf: root.querySelector('[data-dot="kf"]'),
      wa: root.querySelector('[data-dot="wa"]'),
    };
    const statuses = {
      css: root.querySelector('[data-status="css"]'),
      kf: root.querySelector('[data-status="kf"]'),
      wa: root.querySelector('[data-status="wa"]'),
    };

    function say(lane, text, tone) {
      const cls = tone ? ` class="${tone}"` : '';
      statuses[lane].innerHTML = tone ? `<b${cls}>${text}</b>` : text;
    }

    function easeCss() {
      return (EASES.find((e) => e.id === state.ease) || EASES[0]).css;
    }

    // The keyframes lane needs a real @keyframes rule, and it has to know the
    // travel distance. Rewriting one stylesheet beats one rule per width.
    let kfStyle = document.getElementById(id + '-kf');
    if (!kfStyle) {
      kfStyle = document.createElement('style');
      kfStyle.id = id + '-kf';
      document.head.appendChild(kfStyle);
    }

    function measure() {
      const track = root.querySelector('.tl-track');
      end = Math.max(0, track.clientWidth - 26 - 16);
      root.style.setProperty('--end', end + 'px');
      kfStyle.textContent = `
        @keyframes ${id}-run {
          from { transform: translateX(0); opacity: 0.22; }
          to   { transform: translateX(${end}px); opacity: 1; }
        }`;
    }

    function clearTimers() { timers.forEach(clearTimeout); timers.length = 0; }

    function reset(quiet) {
      clearTimers();
      if (waapi) { waapi.cancel(); waapi = null; }
      dots.css.style.transition = 'none';
      dots.css.classList.remove('on');
      // Force the removal to land before transitions are switched back on,
      // or the next Play has nothing to transition from.
      void dots.css.offsetWidth;
      dots.css.style.transition = '';
      dots.kf.style.animation = 'none';
      dots.kf.style.animationPlayState = '';
      dots.kf.style.opacity = '';
      dots.kf.style.transform = '';
      dots.wa.style.transform = '';
      dots.wa.style.opacity = '';
      if (!quiet) { say('css', 'at rest'); say('kf', 'at rest'); say('wa', 'at rest'); }
    }

    function play() {
      reset(true);
      const d = state.dur, e = easeCss();

      dots.css.style.transition =
        `transform ${d}ms ${e}, opacity ${d}ms ${e}`;
      requestAnimationFrame(() => dots.css.classList.add('on'));

      dots.kf.style.animation = `${id}-run ${d}ms ${e} forwards`;

      waapi = dots.wa.animate(
        [{ transform: 'translateX(0px)', opacity: 0.22 },
         { transform: `translateX(${end}px)`, opacity: 1 }],
        { duration: d, easing: e, fill: 'both' }
      );

      say('css', 'running'); say('kf', 'running'); say('wa', 'running');
    }

    function atForty(fn) {
      play();
      timers.push(setTimeout(fn, state.dur * 0.4));
    }

    const actions = {
      play,

      interrupt() {
        atForty(() => {
          const p = progressOf(dots.css, end);

          // A transition has no playhead, but it does have a current computed
          // value — and removing the class transitions away from exactly that.
          dots.css.classList.remove('on');
          say('css', `✓ eased back from ${p}%`, 'yes');

          // A keyframe animation owns the property outright. Take the
          // animation away and the element is wherever the base rule says,
          // instantly. There is no from-here.
          dots.kf.style.animation = 'none';
          say('kf', '✗ snapped to 0 — no from-here', 'no');

          if (waapi) {
            waapi.reverse();
            say('wa', `✓ reverse() from ${p}%`, 'yes');
          }
        });
      },

      pause() {
        atForty(() => {
          say('css', '✗ no pause — it kept going', 'no');
          dots.kf.style.animationPlayState = 'paused';
          say('kf', '✓ animation-play-state: paused', 'yes');
          if (waapi) { waapi.pause(); say('wa', '✓ pause()', 'yes'); }
        });
      },

      seek() {
        reset(true);
        const d = state.dur, e = easeCss();

        say('css', '✗ no playhead to seek', 'no');

        // The trick: start it paused, with a negative delay equal to the
        // point you want. It works. It is also the clearest possible sign
        // you have outgrown declarative CSS.
        dots.kf.style.animation =
          `${id}-run ${d}ms ${e} ${-d * 0.4}ms forwards`;
        dots.kf.style.animationPlayState = 'paused';
        say('kf', '△ negative animation-delay, paused', 'part');

        waapi = dots.wa.animate(
          [{ transform: 'translateX(0px)', opacity: 0.22 },
           { transform: `translateX(${end}px)`, opacity: 1 }],
          { duration: d, easing: e, fill: 'both' }
        );
        waapi.pause();
        waapi.currentTime = d * 0.4;
        say('wa', '✓ currentTime = 0.4 × duration', 'yes');
      },

      reset() { reset(); },
    };

    root.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        root.querySelectorAll('[data-row]').forEach((tr) => {
          tr.classList.toggle('lit', tr.dataset.row === act);
        });
        (actions[act] || actions.reset)();
      });
    });

    root.querySelectorAll('[data-k]').forEach((input) => {
      const key = input.dataset.k;
      input.value = state[key];
      const out = root.querySelector(`[data-out-${key}]`);
      const sync = () => { if (out) out.textContent = state[key] + 'ms'; };
      sync();
      input.addEventListener('input', () => {
        state[key] = input.type === 'range' ? parseInt(input.value, 10) : input.value;
        sync();
        reset();
      });
    });

    measure();
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { measure(); reset(); }, 150);
    });
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-tool-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
