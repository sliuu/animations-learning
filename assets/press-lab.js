/* ============================================================
   press-lab.js — one button, two kinds of hand.

   The same button, wired the same way, under two input devices.
   The reader flips the device and the way the hover rule is
   written, and watches the pointer events themselves arrive in
   a log beside the stage.

   The point of the lab is that on a touch device `pointerleave`
   simply never comes, so an ungated `:hover` latches on at the
   tap and stays on — and that `:active` is fine either way,
   because a finger can press even though it cannot hover.

   What is real and what is simulated:
     mouse mode — real `:hover`, real `:active`. The JS only
       watches and logs; the CSS does the work.
     touch mode — a Mac cannot stop hovering, so this mode
       disables the real pseudo-classes and drives `.faux-hover`
       and `.pressed` from pointerdown/pointerup instead, which
       is exactly the sequence a phone delivers. The hover look
       itself is a single rule with two entry points, so the two
       modes cannot drift apart.
     the gate — `@media (hover: hover)` cannot be toggled at
       runtime, so "gated" is expressed by never adding
       `.faux-hover`. That is behaviourally what the media query
       does on a coarse device.

   Usage:
     <div data-press-lab data-title="One button, two kinds of hand"></div>
   ============================================================ */

(() => {
  let uid = 0;

  // The release is deliberately NOT a knob. It stays put at a value the
  // lesson argues for, so that dragging the press-down slider past it is
  // something the reader can feel rather than read.
  const RELEASE = 180;

  const STYLES = `
    .pl { margin: 1.75rem 0; border: 1px solid var(--rule); border-radius: 8px;
      background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .pl { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .pl-head { display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
    .pl-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .pl-seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
      border: 1px solid var(--rule); border-radius: 6px;
      overflow: hidden; background: var(--paper); }
    .pl-seg button { font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.01em; text-transform: none; padding: 0.4rem 0.5rem; text-align: center;
      border: 0; border-right: 1px solid var(--rule); background: transparent;
      color: var(--ink-soft); cursor: pointer; }
    .pl-seg button:last-child { border-right: 0; }
    .pl-seg button[aria-pressed="true"] { background: var(--accent); color: #fff; }
    .pl-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

    .pl-body { display: grid; gap: 0; background: var(--paper); }
    @media (min-width: 820px) { .pl-body { grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); } }

    /* ---- the stage ---- */
    .pl-stage { --hd: 140ms; --depth: 0.96; --down: 80ms; --up: 180ms;
      --ease: cubic-bezier(0.23, 1, 0.32, 1);
      position: relative; min-height: 290px; padding: 1rem;
      display: grid; grid-template-rows: 1fr auto; justify-items: center; gap: 0.8rem;
      border-right: 1px solid var(--rule); }
    @media (max-width: 819px) { .pl-stage { border-right: 0; border-bottom: 1px solid var(--rule); } }
    .pl-stage.touch, .pl-stage.touch .pl-btn { cursor: default; }

    .pl-card { align-self: center; width: min(290px, 100%);
      border: 1px solid var(--rule); border-radius: 9px; background: var(--paper);
      padding: 0.95rem 1rem; display: grid; gap: 0.65rem; justify-items: start; }
    .pl-card b { font-family: var(--sans); font-size: 0.85rem; color: var(--ink); }
    .pl-card span { font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint); }

    .pl-btn { font-family: var(--sans); font-size: 0.8rem; font-weight: 600;
      border: 1px solid transparent; border-radius: 7px; padding: 0.5rem 0.9rem;
      background: var(--accent); color: #fff; cursor: pointer;
      transform: scale(1);
      box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 14%, transparent);
      transition: transform var(--up) var(--ease),
                  background-color var(--hd) ease,
                  box-shadow var(--hd) ease; }

    /* One hover look, two entry points — a real :hover with a mouse, a
       class with a finger. They cannot drift because it is one rule. */
    .pl-stage.mouse .pl-btn:hover,
    .pl-btn.faux-hover {
      background: color-mix(in srgb, var(--accent) 82%, #ffffff);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--ink) 22%, transparent); }

    /* Same idea for the press. Note the transition is re-declared, not
       just overridden — going down and coming back up are different. */
    .pl-stage.mouse .pl-btn:active,
    .pl-btn.pressed {
      transform: scale(var(--depth));
      transition: transform var(--down) var(--ease),
                  background-color var(--hd) ease,
                  box-shadow var(--hd) ease; }

    .pl-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

    .pl-hint { align-self: end; justify-self: stretch; font-family: var(--sans);
      font-size: 0.67rem; color: var(--ink-faint); text-align: center; line-height: 1.5;
      border: 1px dashed transparent; border-radius: 6px; padding: 0.45rem 0.6rem; }
    .pl-stage.touch .pl-hint { border-color: var(--rule); color: var(--ink-soft); }

    /* ---- readout ---- */
    .pl-panel { padding: 0.85rem; display: grid; gap: 0.6rem; align-content: start; }
    .pl-chips { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .pl-chip { font-family: var(--mono); font-size: 0.67rem; padding: 0.25rem 0.5rem;
      border-radius: 5px; border: 1px solid var(--rule);
      color: var(--ink-faint); background: var(--paper-sunk); white-space: nowrap; }
    .pl-chip.on { border-color: var(--accent); background: var(--accent); color: #fff; }
    .pl-chip.stuck { border-color: var(--bad); background: var(--bad); color: var(--paper); }

    .pl-verdict { font-family: var(--sans); font-size: 0.7rem; line-height: 1.45;
      border: 1px dashed var(--rule); border-radius: 6px; padding: 0.4rem 0.55rem;
      color: var(--ink-soft); }
    .pl-verdict.bad { border-color: var(--bad); color: var(--bad); }
    .pl-verdict.good { border-color: var(--good); color: var(--good); }

    .pl-log { font-family: var(--mono); font-size: 0.65rem; line-height: 1.6;
      border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-sunk);
      padding: 0.45rem 0.6rem; min-height: 7.4em;
      display: grid; align-content: start; color: var(--ink-faint); }
    .pl-log div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pl-log div:first-child { color: var(--ink); }
    .pl-log b { font-weight: 600; color: inherit; }
    .pl-log i { font-style: normal; color: var(--bad); }

    .pl-css { padding: 0.75rem 0.85rem; border-top: 1px solid var(--rule);
      background: var(--paper); }
    .pl-css pre { margin: 0.3rem 0 0; padding: 0.6rem 0.75rem; overflow-x: auto;
      border: 1px solid var(--rule); border-radius: 6px; background: var(--paper-sunk);
      font-family: var(--mono); font-size: 0.68rem; line-height: 1.55;
      color: var(--ink-soft); white-space: pre; }
    .pl-css .control-label { display: block; }

    .pl-foot { padding: 0.8rem 0.85rem; border-top: 1px solid var(--rule);
      background: var(--paper-sunk); display: grid; gap: 0.8rem; }
    @media (min-width: 620px) { .pl-foot { grid-template-columns: 1fr 1fr; gap: 0.8rem 1.6rem; } }

    /* The release is shown but not draggable. Make that legible rather than
       leaving the reader tugging at a slider that will not move. */
    .pl-foot input[disabled] { opacity: 0.45; cursor: not-allowed; }

    @media print { .pl-actions, .pl-foot .control { display: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('pl-styles')) return;
    const el = document.createElement('style');
    el.id = 'pl-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const id = 'pl-' + ++uid;
    const title = root.dataset.title || 'One button, two kinds of hand';

    const state = { input: 'mouse', gate: 'bare', hd: 140, depth: 96, down: 80 };

    root.id = id;
    root.className = 'pl';
    root.innerHTML = `
      <div class="pl-head">
        <span>${title}</span>
        <div class="pl-actions">
          <button class="btn primary" type="button" data-act="tap">Tap it for me</button>
          <button class="btn" type="button" data-act="reset">Reset</button>
        </div>
      </div>

      <div class="pl-body">
        <div class="pl-stage mouse" data-stage>
          <div class="pl-card">
            <b>Untitled draft</b>
            <span>Edited 4 minutes ago</span>
            <button class="pl-btn" type="button" data-btn>Add to project</button>
          </div>
          <p class="pl-hint" data-hint></p>
        </div>

        <div class="pl-panel">
          <div class="pl-chips">
            <span class="pl-chip" data-chip-hover>:hover</span>
            <span class="pl-chip" data-chip-active>:active</span>
          </div>
          <div class="pl-verdict" data-v-hover></div>
          <div class="pl-verdict" data-v-press></div>
          <div class="pl-log" data-log></div>
        </div>
      </div>

      <div class="pl-css">
        <span class="control-label"><span>the CSS you shipped</span></span>
        <pre data-css></pre>
      </div>

      <div class="pl-foot">
        <div class="control">
          <span class="control-label"><span>the hand on the other end</span></span>
          <div class="pl-seg" data-seg="input">
            <button type="button" data-val="mouse">mouse</button>
            <button type="button" data-val="touch">touch (simulated)</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>how the hover rule is written</span></span>
          <div class="pl-seg" data-seg="gate">
            <button type="button" data-val="bare">:hover</button>
            <button type="button" data-val="gated">gated</button>
          </div>
        </div>
        <div class="control">
          <span class="control-label"><span>hover duration</span>
            <span class="control-value" data-out-hd></span></span>
          <input type="range" min="0" max="400" step="10" data-k="hd">
        </div>
        <div class="control">
          <span class="control-label"><span>press depth</span>
            <span class="control-value" data-out-depth></span></span>
          <input type="range" min="88" max="100" step="1" data-k="depth">
        </div>
        <div class="control">
          <span class="control-label"><span>press-down duration</span>
            <span class="control-value" data-out-down></span></span>
          <input type="range" min="0" max="400" step="10" data-k="down">
        </div>
        <div class="control">
          <span class="control-label"><span>release duration</span>
            <span class="control-value">${RELEASE}ms · fixed</span></span>
          <input type="range" min="0" max="400" step="10" value="${RELEASE}" disabled>
        </div>
      </div>
    `;

    const el = (s) => root.querySelector(s);
    const stage = el('[data-stage]');
    const btn = el('[data-btn]');
    const logEl = el('[data-log]');

    /* ---- pointer bookkeeping ---- */
    let hovering = false;     // is the hover look currently on
    let pressing = false;
    let hoverSince = 0;       // when a touch-mode hover latched on
    let ticker = null;
    const lines = [];
    let lastInput = state.input;

    function log(ev, effect, bad) {
      const tag = bad ? 'i' : 'span';
      lines.unshift(`<div><b>${ev}</b> <${tag}>${effect}</${tag}></div>`);
      if (lines.length > 7) lines.pop();
      logEl.innerHTML = lines.join('');
    }

    function clearLog() {
      lines.length = 0;
      logEl.innerHTML = '<div>waiting for a pointer event…</div>';
    }

    function hoverAllowed() {
      // With a mouse the CSS :hover does it. With a finger, an ungated rule
      // latches at the tap; a gated one never applies at all.
      return state.gate === 'bare';
    }

    function setHover(on, why, bad) {
      if (on === hovering) return;
      hovering = on;
      if (state.input === 'touch') btn.classList.toggle('faux-hover', on);
      hoverSince = on ? performance.now() : 0;
      if (why) log(why[0], why[1], bad);
      paintState();
    }

    function setPress(on, why) {
      pressing = on;
      if (state.input === 'touch') btn.classList.toggle('pressed', on);
      if (why) log(why[0], why[1]);
      paintState();
    }

    /* ---- the real events ---- */
    btn.addEventListener('pointerenter', () => {
      if (state.input !== 'mouse') return;          // a finger never enters
      setHover(true, ['pointerenter', '→ :hover on']);
    });

    btn.addEventListener('pointerleave', () => {
      if (state.input !== 'mouse') return;
      setPress(false);
      setHover(false, ['pointerleave', '→ :hover off']);
    });

    btn.addEventListener('pointerdown', () => {
      setPress(true, ['pointerdown', '→ :active on']);
      if (state.input === 'touch' && hoverAllowed()) {
        setHover(true, ['(no pointerenter)', '→ :hover latches anyway'], true);
      }
    });

    btn.addEventListener('pointerup', () => {
      setPress(false, ['pointerup', '→ :active off']);
      if (state.input === 'touch' && hovering) {
        log('(no pointerleave)', '→ :hover stays on', true);
      }
    });

    btn.addEventListener('click', (e) => e.preventDefault());

    // Tapping anywhere else is the only thing that clears a stuck hover on a
    // phone. It is worth discovering rather than being told.
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-btn]')) return;
      if (state.input === 'touch' && hovering) {
        setHover(false, ['tap elsewhere', '→ :hover finally cleared']);
      }
    });

    /* ---- the scripted tap, so the reader can just watch ---- */
    function scriptedTap() {
      state.input = 'touch';
      reset();
      paint();
      setTimeout(() => {
        setPress(true, ['pointerdown', '→ :active on']);
        if (hoverAllowed()) setHover(true, ['(no pointerenter)', '→ :hover latches anyway'], true);
        setTimeout(() => {
          setPress(false, ['pointerup', '→ :active off']);
          if (hovering) log('(no pointerleave)', '→ :hover stays on', true);
        }, 150);
      }, 320);
    }

    function reset() {
      btn.classList.remove('faux-hover', 'pressed');
      hovering = false; pressing = false; hoverSince = 0;
      clearLog();
      paintState();
    }

    /* ---- painting ---- */
    function paintState() {
      // Only "stuck" once the finger is off. While it is down, the hover being
      // on is not yet the problem — the problem is that letting go won't clear it.
      const stuck = state.input === 'touch' && hovering && !pressing;
      const h = el('[data-chip-hover]');
      h.classList.toggle('on', hovering && !stuck);
      h.classList.toggle('stuck', stuck);
      h.textContent = stuck
        ? ':hover — ' + ((performance.now() - hoverSince) / 1000).toFixed(1) + 's and counting'
        : ':hover';

      const a = el('[data-chip-active]');
      a.classList.toggle('on', pressing);

      el('[data-v-hover]').className = 'pl-verdict ' + hoverVerdict()[1];
      el('[data-v-hover]').innerHTML = hoverVerdict()[0];

      if (stuck && !ticker) ticker = setInterval(paintState, 200);
      if (!stuck && ticker) { clearInterval(ticker); ticker = null; }
    }

    function hoverVerdict() {
      if (state.input === 'mouse') {
        return state.gate === 'bare'
          ? ['A mouse enters and leaves, so the rule turns itself off. Nothing here is wrong yet.', '']
          : ['<code>hover: hover</code> matches a mouse, so this is identical to the ungated version. The gate is free.', 'good'];
      }
      if (state.gate === 'gated') {
        return ['The hover rule never applies. <code>:active</code> still does — a finger cannot hover, but it can absolutely press.', 'good'];
      }
      if (hovering && pressing) {
        return ['The hover latched on at <code>pointerdown</code>, with no <code>pointerenter</code> to ask for it. Now let go.', ''];
      }
      return hovering
        ? ['Stuck. The finger is gone and the button is still lit. Nothing but a tap somewhere else will clear it.', 'bad']
        : ['Tap the button, then watch this line and the log.', ''];
    }

    function pressVerdict() {
      const d = state.down, s = state.depth;
      if (s >= 99) return ['<code>scale(' + (s / 100).toFixed(2) + ')</code> is under a pixel of travel on a button this size. Nobody will see it.', ''];
      if (s <= 90) return ['<code>scale(' + (s / 100).toFixed(2) + ')</code> reads as the button shrinking away from you, not as a press.', ''];
      if (d > 100) return [d + 'ms down is past the 0.1s direct-manipulation limit. The button follows your finger instead of answering it.', 'bad'];
      return [d + 'ms down, ' + RELEASE + 'ms back up. Under 0.1s going in, so it reads as the button reacting to you.', 'good'];
    }

    function cssText() {
      const dep = (state.depth / 100).toFixed(2);
      const hoverRule = `.btn:hover { background: var(--accent-700); }`;
      const gated = state.gate === 'gated'
        ? `@media (hover: hover) {\n  ${hoverRule}\n}`
        : hoverRule;
      return `.btn {\n  transition: transform ${RELEASE}ms var(--ease-out),\n              background-color ${state.hd}ms ease;\n}\n\n${gated}\n\n/* not gated — a finger can press */\n.btn:active {\n  transform: scale(${dep});\n  transition: transform ${state.down}ms var(--ease-out);\n}`;
    }

    function paint() {
      stage.classList.toggle('mouse', state.input === 'mouse');
      stage.classList.toggle('touch', state.input === 'touch');
      stage.style.setProperty('--hd', state.hd + 'ms');
      stage.style.setProperty('--depth', (state.depth / 100).toFixed(2));
      stage.style.setProperty('--down', state.down + 'ms');
      stage.style.setProperty('--up', RELEASE + 'ms');

      // Switching device has to drop whatever the old one was holding —
      // but only then. Dragging a slider must not silently clear a stuck hover.
      if (state.input !== lastInput) { lastInput = state.input; reset(); }

      root.querySelectorAll('[data-seg]').forEach((seg) => {
        const k = seg.dataset.seg;
        seg.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', String(state[k] === b.dataset.val));
        });
      });

      el('[data-out-hd]').textContent = state.hd + 'ms';
      el('[data-out-depth]').textContent = 'scale(' + (state.depth / 100).toFixed(2) + ')';
      el('[data-out-down]').textContent = state.down + 'ms';

      el('[data-hint]').textContent = state.input === 'mouse'
        ? 'Hover it. Press and hold it. Drag off it while still held.'
        : 'somewhere else — tap in here to clear a stuck hover';

      const pv = pressVerdict();
      el('[data-v-press]').className = 'pl-verdict ' + pv[1];
      el('[data-v-press]').innerHTML = pv[0];

      el('[data-css]').textContent = cssText();
      paintState();
    }

    /* ---- wiring ---- */
    root.addEventListener('click', (e) => {
      const seg = e.target.closest('[data-seg] button');
      if (seg) {
        state[seg.parentElement.dataset.seg] = seg.dataset.val;
        reset();
        paint();
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'tap') scriptedTap();
      if (act.dataset.act === 'reset') { reset(); paint(); }
    });

    root.querySelectorAll('input[type="range"]:not([disabled])').forEach((input) => {
      input.value = state[input.dataset.k];
      input.addEventListener('input', () => {
        state[input.dataset.k] = Number(input.value);
        paint();
      });
    });

    clearLog();
    paint();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-press-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
