/* ============================================================
   token-lab.js — one token set, five components, and what a
   token's *name* is for.

   The fan-out is the easy half: change one value, watch five
   things restyle at once. Every design system demo shows that,
   and it is true, and it is not the interesting part.

   The interesting part is the naming knob. Both modes hold the
   identical numbers and produce the identical motion — switching
   between them changes nothing on the stage, on purpose. What it
   changes is whether the set can survive being edited:

     - Named for its value, `duration-120` is a number with a
       nickname. Retune it to 200ms and the name is now a lie
       that no compiler will ever catch, and the rail says so.
     - Named for its role, `motion-state` describes the job.
       Retuning it is a retune. Nothing goes stale.

   Same argument from the other end: the "which token?" prompt
   under the rail asks where a brand-new component should get its
   duration. Under role names the rail answers it. Under value
   names there is nothing to answer with but a guess or a copy
   from whatever was nearby — which is the mechanism by which a
   token set quietly becomes a list of numbers again.

   The detach switch is the casualty. Hardcode the modal and it
   keeps its 320ms forever; retune the overlay token afterwards
   and four components move while one does not. That is drift,
   with the drifted element on screen rather than described.

   Reduced motion: the stage does not animate, and the verdict
   says the honest thing — the reduced-motion decision is itself
   a token-level decision, and a system's actual job here is to
   have one place that makes it rather than five.

   Usage:
     <div data-token-lab data-title="One set, five components"></div>
   ============================================================ */

(() => {
  'use strict';
  let uid = 0;

  // Design-level easing choices. The bezier is the implementation; the
  // three words are what a system actually offers a designer.
  const EASES = {
    gentle:   { curve: 'cubic-bezier(0.33, 1, 0.68, 1)',  mint: 'ease-cubic-033-1-068-1' },
    standard: { curve: 'cubic-bezier(0.16, 1, 0.3, 1)',   mint: 'ease-cubic-016-1-03-1' },
    sharp:    { curve: 'cubic-bezier(0.4, 0, 0.2, 1)',    mint: 'ease-cubic-04-0-02-1' },
  };

  function injectStyles() {
    if (document.getElementById('token-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'token-lab-styles';
    s.textContent = `
    .tk-lab { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
              background: var(--paper-sunk); overflow: hidden; color: var(--ink); }
    @media (min-width: 1000px) { .tk-lab { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .tk-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .tk-state { font: 500 0.74rem/1.35 var(--mono); color: var(--ink-faint); }

    .tk-board { display: grid; grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
                gap: 1px; background: var(--rule); }
    .tk-pane { background: var(--paper); padding: 0.9rem 1rem 1rem; min-width: 0; }
    .tk-pname { margin: 0 0 0.7rem; font: 600 0.66rem/1.3 var(--sans); letter-spacing: 0.12em;
                text-transform: uppercase; color: var(--ink-faint); }

    /* ----- the rail ----- */
    .tk-rail { display: grid; gap: 0.4rem; }
    .tk-tok { border: 1px solid var(--rule); border-radius: 7px; padding: 0.5rem 0.6rem;
              background: var(--paper); }
    /* Lit while the token it belongs to is the one being changed, so the
       fan-out is legible in both directions: which components moved, and
       which token moved them. */
    .tk-tok[data-lit="1"] { border-color: var(--accent); }
    .tk-tname { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
    .tk-tname code { font: 500 0.72rem/1.3 var(--mono); color: var(--ink); word-break: break-all; }
    .tk-tval { font: 600 0.72rem/1.3 var(--mono); color: var(--accent); flex: none; }
    .tk-tuse { display: block; margin-top: 0.22rem; font: 400 0.64rem/1.4 var(--sans);
               color: var(--ink-faint); }
    /* Reserved: the stale line appears and disappears as she retunes under
       value naming, and the rail must not shuffle under her while it does. */
    .tk-stale { display: block; min-height: 1.1rem; margin-top: 0.2rem;
                font: 500 0.64rem/1.4 var(--sans); color: var(--bad); }

    .tk-ask { margin-top: 0.75rem; border: 1px dashed var(--rule); border-radius: 7px;
              padding: 0.55rem 0.6rem; min-height: 7.2rem;
              font: 400 0.7rem/1.5 var(--sans); color: var(--ink-soft); }
    .tk-ask b { color: var(--ink); font-weight: 600; }
    .tk-ask code { font: 500 0.68rem/1.3 var(--mono); color: var(--ink); }
    .tk-ask .tk-q { display: block; margin-bottom: 0.3rem; font-weight: 600; color: var(--ink); }

    /* ----- the screen ----- */
    /* Fixed height, everything overlaid rather than inserted: five components
       animate in here and not one of them may reflow the page underneath. */
    .tk-screen { position: relative; overflow: hidden; height: 23rem;
                 border: 1px solid var(--rule); border-radius: 8px; background: var(--paper); }
    .tk-bar { display: flex; align-items: center; justify-content: space-between;
              padding: 0.45rem 0.6rem; background: var(--paper-sunk);
              border-bottom: 1px solid var(--rule); }
    .tk-btitle { font: 600 0.72rem/1.2 var(--sans); color: var(--ink); }
    .tk-save { border: 1px solid var(--accent); border-radius: 6px; padding: 0.22rem 0.6rem;
               background: var(--accent); color: var(--paper);
               font: 600 0.68rem/1.3 var(--sans);
               transition: transform var(--tk-state) var(--tk-ease); }
    .tk-save[data-press="1"] { transform: scale(0.9); }

    .tk-rows { display: grid; gap: 0.35rem; padding: 0.6rem; }
    .tk-row { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
              padding: 0.34rem 0.5rem; font: 400 0.68rem/1.3 var(--sans); color: var(--ink-soft); }
    .tk-open { overflow: hidden; height: 0;
               transition: height var(--tk-enter) var(--tk-ease); }
    .tk-row[data-open="1"] .tk-open { height: 2.9rem; }
    .tk-open span { display: block; height: 0.36rem; margin-top: 0.4rem; border-radius: 3px;
                    background: var(--paper-sunk); }
    .tk-open span.a { width: 88%; } .tk-open span.b { width: 66%; }

    .tk-toast { position: absolute; left: 0.6rem; right: 0.6rem; bottom: 0.6rem;
                border: 1px solid var(--rule); border-radius: 7px; background: var(--paper-sunk);
                padding: 0.42rem 0.6rem; font: 500 0.68rem/1.3 var(--sans); color: var(--ink);
                opacity: 0; transform: translateY(140%);
                transition: transform var(--tk-enter) var(--tk-ease),
                            opacity var(--tk-enter) var(--tk-ease); }
    .tk-toast[data-on="1"] { opacity: 1; transform: none; }

    .tk-drawer { position: absolute; inset: 0 0 0 auto; width: 58%; padding: 0.65rem;
                 background: var(--paper); border-left: 1px solid var(--rule);
                 box-shadow: -8px 0 20px -14px rgba(0,0,0,0.5);
                 transform: translateX(100%);
                 transition: transform var(--tk-overlay) var(--tk-ease); }
    .tk-drawer[data-on="1"] { transform: none; }
    .tk-dtitle { margin: 0 0 0.45rem; font: 600 0.68rem/1.3 var(--sans); color: var(--ink); }
    .tk-drawer span { display: block; height: 0.36rem; margin-top: 0.36rem; border-radius: 3px;
                      background: var(--paper-sunk); }

    .tk-scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.4);
                opacity: 0; pointer-events: none;
                transition: opacity var(--tk-overlay) var(--tk-ease); }
    .tk-scrim[data-on="1"] { opacity: 1; }
    .tk-modal { position: absolute; left: 50%; top: 50%; width: 62%;
                border: 1px solid var(--rule); border-radius: 9px; background: var(--paper);
                padding: 0.7rem 0.8rem;
                opacity: 0; transform: translate(-50%, -46%) scale(0.94);
                transition: transform var(--tk-overlay) var(--tk-ease),
                            opacity var(--tk-overlay) var(--tk-ease); }
    .tk-modal[data-on="1"] { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    .tk-mtitle { margin: 0 0 0.3rem; font: 600 0.72rem/1.3 var(--sans); color: var(--ink); }
    .tk-mtext { margin: 0; font: 400 0.68rem/1.45 var(--sans); color: var(--ink-soft); }
    /* The hardcoded one wears a mark, so "which of these is detached" is never
       a memory question mid-demo. */
    .tk-pin { position: absolute; right: 0.45rem; top: 0.45rem; border-radius: 4px;
              padding: 0.06rem 0.32rem; background: var(--bad); color: var(--paper);
              font: 600 0.55rem/1.4 var(--sans); letter-spacing: 0.06em; text-transform: uppercase; }
    .tk-modal:not([data-pinned="1"]) .tk-pin { display: none; }

    /* Reduced motion: nothing here transitions, and the readout says so rather
       than the stage quietly pretending it played. 0009 is the lesson that
       earned this, so a lab that ignored it would contradict the course. */
    @media (prefers-reduced-motion: reduce) {
      .tk-save, .tk-open, .tk-toast, .tk-drawer, .tk-scrim, .tk-modal { transition: none; }
    }

    .tk-readwrap { display: flex; align-items: center; min-height: 6.6rem;
                   padding: 0.85rem 1rem; border-top: 1px solid var(--rule); background: var(--paper); }
    .tk-read { margin: 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .tk-read b { color: var(--ink); font-weight: 600; }
    .tk-read code { font: 500 0.76rem/1.3 var(--mono); color: var(--ink); }

    .tk-foot { display: grid; gap: 0.55rem; padding: 0.9rem 1rem 1rem;
               border-top: 1px solid var(--rule); background: var(--paper-sunk);
               font-family: var(--sans); }
    .tk-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .tk-cap { min-width: 9.6rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .tk-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .tk-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.32rem 0.56rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.73rem/1.3 var(--sans); }
    .tk-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent);
                                          color: var(--paper); }
    .tk-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .tk-rule { height: 1px; background: var(--rule); margin: 0.15rem 0 0.25rem; }
    .tk-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 10.25rem; }
    .tk-actions .btn[disabled] { opacity: 0.5; cursor: default; }

    @media (max-width: 1099px) { .tk-board { grid-template-columns: minmax(0, 17rem) minmax(0, 1fr); } }
    @media (max-width: 860px) {
      .tk-board { grid-template-columns: minmax(0, 1fr); }
      .tk-ask { min-height: 5.6rem; }
    }
    @media (max-width: 700px) {
      .tk-ctl { align-items: flex-start; }
      .tk-cap { min-width: 100%; }
      .tk-actions { margin-left: 0; }
      .tk-state { display: none; }
      .tk-readwrap { min-height: 8.4rem; }
    }
    @media (max-width: 480px) { .tk-readwrap { min-height: 10.2rem; } .tk-ask { min-height: 7.2rem; } }
    @media (max-width: 380px) { .tk-readwrap { min-height: 12rem; } }
    @media print { .tk-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seg(role, caption, opts, chosen) {
    const buttons = opts.map(([v, label]) =>
      `<button type="button" data-value="${v}" aria-pressed="${v === chosen}">${label}</button>`).join('');
    return `<div class="tk-ctl"><span class="tk-cap">${caption}</span>
            <div class="tk-seg" data-role="${role}">${buttons}</div></div>`;
  }

  function mount(root) {
    injectStyles();
    uid += 1;
    root.classList.add('tk-lab');

    // Minted names are the value-mode names, frozen at the values the set
    // shipped with. That freezing is the whole point: the value moves, the
    // name cannot, and nothing anywhere reports the mismatch.
    const TOKENS = [
      { key: 'state',   role: 'motion-state',   mint: 'duration-120', value: 120,
        used: 'the Save button&rsquo;s press' },
      { key: 'enter',   role: 'motion-enter',   mint: 'duration-240', value: 240,
        used: 'the toast, the expanding row' },
      { key: 'overlay', role: 'motion-overlay', mint: 'duration-320', value: 320,
        used: 'the drawer, the modal' },
    ];
    const byKey = Object.fromEntries(TOKENS.map(t => [t.key, t]));

    let naming = 'role';
    let easeKey = 'standard';
    // The curve's failure under value naming is not staleness — a minted curve
    // name is derived from the curve, so it is never wrong. It is that the name
    // moves: switch the curve and every reference to the old name is dangling.
    // That only becomes true once she has actually switched, so the flag waits.
    const EASE_SHIPPED = easeKey;
    let detached = false;
    let runId = 0;

    root.innerHTML = `
      <div class="tk-head">
        <strong>${root.dataset.title || 'One set, five components'}</strong>
        <span class="tk-state" data-state>&mdash;</span>
      </div>
      <div class="tk-board">
        <section class="tk-pane">
          <h3 class="tk-pname">The set</h3>
          <div class="tk-rail" data-rail></div>
          <div class="tk-ask" data-ask></div>
        </section>
        <section class="tk-pane">
          <h3 class="tk-pname">The screen it dresses</h3>
          <div class="tk-screen" data-screen>
            <div class="tk-bar">
              <span class="tk-btitle">Settings</span>
              <button class="tk-save" type="button" data-save tabindex="-1" aria-hidden="true">Save</button>
            </div>
            <div class="tk-rows">
              <div class="tk-row">Notifications</div>
              <div class="tk-row" data-row>Billing
                <div class="tk-open"><span class="a"></span><span class="b"></span></div>
              </div>
              <div class="tk-row">Privacy</div>
              <div class="tk-row">Members</div>
              <div class="tk-row">Integrations</div>
              <div class="tk-row">Danger zone</div>
            </div>
            <div class="tk-toast" data-toast>Settings saved</div>
            <aside class="tk-drawer" data-drawer>
              <h4 class="tk-dtitle">Billing history</h4>
              <span></span><span></span><span></span>
            </aside>
            <div class="tk-scrim" data-scrim></div>
            <div class="tk-modal" data-modal>
              <span class="tk-pin">hardcoded</span>
              <h4 class="tk-mtitle">Cancel plan?</h4>
              <p class="tk-mtext">This ends access at the close of the billing period.</p>
            </div>
          </div>
        </section>
      </div>
      <div class="tk-readwrap"><p class="tk-read" data-read aria-live="polite"></p></div>
      <div class="tk-foot">
        ${seg('naming', 'Name the tokens', [['role', 'by role'], ['value', 'by value']], 'role')}
        <div class="tk-rule"></div>
        ${seg('state', 'state duration', [['80', '80ms'], ['120', '120ms'], ['200', '200ms']], '120')}
        ${seg('enter', 'enter duration', [['160', '160ms'], ['240', '240ms'], ['400', '400ms']], '240')}
        ${seg('overlay', 'overlay duration', [['240', '240ms'], ['320', '320ms'], ['500', '500ms']], '320')}
        ${seg('ease', 'the easing token', [['gentle', 'gentle'], ['standard', 'standard'], ['sharp', 'sharp']], 'standard')}
        <div class="tk-rule"></div>
        ${seg('detach', 'the modal', [['0', 'reads the token'], ['1', 'hardcoded at 320ms']], '0')}
        <div class="tk-actions"><button class="btn primary" type="button" data-play>Run the screen</button></div>
      </div>`;

    const screen = root.querySelector('[data-screen]');
    const save = root.querySelector('[data-save]');
    const row = root.querySelector('[data-row]');
    const toast = root.querySelector('[data-toast]');
    const drawer = root.querySelector('[data-drawer]');
    const scrim = root.querySelector('[data-scrim]');
    const modal = root.querySelector('[data-modal]');
    const playBtn = root.querySelector('[data-play]');
    const railEl = root.querySelector('[data-rail]');

    // The tokens live on the screen element as real custom properties, and
    // every component reads them from the stylesheet. Nothing here reaches
    // into a component to set a duration — that is what makes the fan-out a
    // demonstration rather than a simulation of one.
    function applyTokens() {
      screen.style.setProperty('--tk-state', byKey.state.value + 'ms');
      screen.style.setProperty('--tk-enter', byKey.enter.value + 'ms');
      screen.style.setProperty('--tk-overlay', byKey.overlay.value + 'ms');
      screen.style.setProperty('--tk-ease', EASES[easeKey].curve);

      // Detaching is one line and looks harmless, which is exactly how it
      // gets into a codebase: a local override that stops listening.
      if (detached) {
        modal.style.setProperty('--tk-overlay', '320ms');
        modal.dataset.pinned = '1';
      } else {
        modal.style.removeProperty('--tk-overlay');
        delete modal.dataset.pinned;
      }
    }

    const staleTokens = () => TOKENS.filter(t => t.value !== +t.mint.split('-')[1]);

    function renderRail(lit) {
      railEl.innerHTML = TOKENS.map((t) => {
        const name = naming === 'role' ? t.role : t.mint;
        const minted = +t.mint.split('-')[1];
        const stale = naming === 'value' && t.value !== minted;
        return `<div class="tk-tok" data-lit="${lit === t.key ? 1 : 0}">
          <span class="tk-tname"><code>--${name}</code><span class="tk-tval">${t.value}ms</span></span>
          <span class="tk-tuse">used by ${t.used}</span>
          <span class="tk-stale">${stale ? `the name says ${minted}ms` : ''}</span>
        </div>`;
      }).join('') + (() => {
        const name = naming === 'role' ? 'ease-enter' : EASES[easeKey].mint;
        return `<div class="tk-tok" data-lit="${lit === 'ease' ? 1 : 0}">
          <span class="tk-tname"><code>--${name}</code><span class="tk-tval">${easeKey}</span></span>
          <span class="tk-tuse">used by all five</span>
          <span class="tk-stale">${naming === 'value' && easeKey !== EASE_SHIPPED
            ? `the set shipped as --${EASES[EASE_SHIPPED].mint}` : ''}</span>
        </div>`;
      })();
    }

    function renderAsk() {
      const el = root.querySelector('[data-ask]');
      if (naming === 'role') {
        el.innerHTML = `<span class="tk-q">You are adding a tooltip. Which token?</span>
          <code>--motion-enter</code> &mdash; a tooltip arrives in place, so it takes the arriving
          duration, and you did not have to know what any of these numbers are to say so.
          <b>The rail answered the question.</b>`;
      } else {
        el.innerHTML = `<span class="tk-q">You are adding a tooltip. Which token?</span>
          Nothing here can tell you. <code>--duration-240</code> is a fact about a number, not about
          where it belongs, so the only moves available are to guess or to copy whatever the
          nearest component used. <b>That copy is how a set turns back into a pile of numbers.</b>`;
      }
    }

    const wait = ms => new Promise(r => setTimeout(r, ms));

    function reset() {
      save.dataset.press = '0';
      delete row.dataset.open;
      toast.dataset.on = '0';
      drawer.dataset.on = '0';
      scrim.dataset.on = '0';
      modal.dataset.on = '0';
    }

    // One pass through the screen, paced off the token values themselves, so
    // the sequence gets slower or tighter exactly as the set does.
    async function run() {
      const mine = ++runId;
      const step = reduced() ? 260 : 1;   // reduced motion has nothing to wait for
      const s = byKey.state.value, e = byKey.enter.value, o = byKey.overlay.value;
      playBtn.disabled = true;
      reset();
      await wait(120); if (mine !== runId) return;

      save.dataset.press = '1';
      await wait(reduced() ? step : s); if (mine !== runId) return;
      save.dataset.press = '0';
      await wait(reduced() ? step : s + 60); if (mine !== runId) return;

      row.dataset.open = '1';
      await wait(reduced() ? step : e * 0.6); if (mine !== runId) return;
      toast.dataset.on = '1';
      await wait(reduced() ? step : e + 420); if (mine !== runId) return;

      toast.dataset.on = '0';
      drawer.dataset.on = '1';
      await wait(reduced() ? step : o + 380); if (mine !== runId) return;

      scrim.dataset.on = '1';
      modal.dataset.on = '1';
      await wait(reduced() ? step : (detached ? 320 : o) + 700); if (mine !== runId) return;

      modal.dataset.on = '0';
      scrim.dataset.on = '0';
      drawer.dataset.on = '0';
      delete row.dataset.open;
      await wait(reduced() ? step : Math.max(o, e) + 120); if (mine !== runId) return;
      playBtn.disabled = false;
    }

    function report(lit) {
      applyTokens();
      renderRail(lit);
      renderAsk();

      const stale = staleTokens();
      const staleNames = stale.map(t => `--${t.mint}`).join(' and ');

      root.querySelector('[data-state]').textContent =
        (reduced() ? 'motion reduced · ' : '') +
        `${byKey.state.value}/${byKey.enter.value}/${byKey.overlay.value}ms · ${easeKey}` +
        (detached ? ' · modal detached' : '');

      const read = root.querySelector('[data-read]');
      if (reduced()) {
        read.innerHTML = `You have motion turned off, so nothing on this screen is animating and the
          durations are inert. Sit with what that implies for the set: <b>reduced motion is itself a
          token-level decision</b>. A system that handles it properly has one place that says what
          happens when a reader asks for less &mdash; the same one place these durations live &mdash;
          rather than five components each remembering separately.`;
      } else if (detached) {
        read.innerHTML = `The modal is <b>hardcoded at 320ms</b> and no longer listening. Turn the
          overlay token now: the drawer moves, the modal does not, and the two things that were
          designed to feel like the same layer stop matching. <b>Nothing broke, which is the
          problem</b> &mdash; a detached component keeps working perfectly while the system stops
          being able to change it.`;
      } else if (naming === 'value' && stale.length) {
        read.innerHTML = `${stale.length === 1 ? 'A token is' : 'Tokens are'} now
          ${stale.length === 1 ? 'a lie' : 'lies'}: <code>${staleNames}</code>
          ${stale.length === 1 ? 'holds' : 'hold'} a different number than
          ${stale.length === 1 ? 'its' : 'their'} name claims. <b>Nothing will ever report this</b>
          &mdash; not the build, not the linter, not the review &mdash; and every engineer who reads
          the name instead of the value from here on is reading last quarter&rsquo;s decision.
          Switch to role naming and retune again: the same edit costs nothing.`;
      } else if (naming === 'value') {
        read.innerHTML = `Same numbers, same motion, different labels &mdash; switching the naming
          knob changed nothing on the screen, on purpose. <b>Now retune something.</b> A name minted
          from a value can only stay true for as long as nobody edits it, and editing it is the
          entire reason the set exists.`;
      } else {
        read.innerHTML = `Three durations and one curve dress all five components. <b>Turn any one of
          them and watch how much of the screen answers</b> &mdash; that fan-out is what you are
          actually buying, and it is why the argument about 240 versus 400 is worth having once,
          here, instead of in every component review for the next year.`;
      }
    }

    function knob(role, apply) {
      root.querySelectorAll(`[data-role="${role}"] button`).forEach(btn =>
        btn.addEventListener('click', () => {
          root.querySelectorAll(`[data-role="${role}"] button`)
              .forEach(b => b.setAttribute('aria-pressed', b === btn));
          apply(btn.dataset.value);
        }));
    }

    // Every knob replays. A duration you only read is a number; the lab is the
    // sitting through it, and a retune that left the screen still would be a
    // knob that did nothing the instant it was turned.
    knob('naming', (v) => { naming = v; report(null); });
    knob('state', (v) => { byKey.state.value = +v; report('state'); run(); });
    knob('enter', (v) => { byKey.enter.value = +v; report('enter'); run(); });
    knob('overlay', (v) => { byKey.overlay.value = +v; report('overlay'); run(); });
    knob('ease', (v) => { easeKey = v; report('ease'); run(); });
    knob('detach', (v) => { detached = v === '1'; report('overlay'); run(); });
    playBtn.addEventListener('click', run);

    reset();
    report(null);
  }

  document.querySelectorAll('[data-token-lab]').forEach(mount);
})();
