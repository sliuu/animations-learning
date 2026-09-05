/* ============================================================
   interrupt-lab.js — the same entrance, interrupted, two ways.

   The claim this lab exists to settle is a claim about a *feeling*
   ("it turned around" vs "it snapped forward"), and sequential A/B
   cannot teach a feeling — so both panels are on screen at once and
   one press drives both. The reader never has to remember what the
   other one did.

   Neither side is a straw man. Panel A is the ordinary, correct,
   widely-shipped way to write an entrance and an exit with keyframe
   animations, including the JS bookkeeping that keeps the element
   mounted for the length of its exit. It is not doing anything wrong.
   It just cannot know where the entrance had got to.

   The difference is small in a still frame and large in the hand, so
   the lab measures it: computed opacity at the instant the close is
   issued, and again two frames later. The badge is derived from that
   delta rather than hardcoded, which means it stays honest at every
   slider position — drag the interrupt past the end of the entrance
   and both panels correctly report that they held, because by then
   there was nothing left to interrupt.

   Reduced motion: suppressing the motion here would make the two
   panels identical and delete the lesson, so it is not suppressed.
   Nothing autoplays, nothing loops, every frame follows a press.

   Usage:
     <div data-interrupt-lab data-title="Open it, then change your mind"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const IN_MS = 420;
  const OUT_MS = 320;

  function injectStyles() {
    if (document.getElementById('interrupt-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'interrupt-lab-styles';
    s.textContent = `
    .iv { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .iv { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .iv-head { padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .iv-body { padding: 1.3rem 1.1rem; background: var(--paper); }
    .iv-panes { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
    @media (min-width: 640px) { .iv-panes { grid-template-columns: 1fr 1fr; } }

    .iv-pane { display: grid; gap: 0.55rem; align-content: start; min-width: 0; }
    .iv-name { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft);
               text-transform: uppercase; letter-spacing: 0.07em; }
    .iv-name span { display: block; text-transform: none; letter-spacing: 0;
                    font: 400 0.74rem/1.4 var(--mono); color: var(--ink-faint); }

    /* Fixed height and an absolutely positioned panel: the panel appearing
       must not resize the stage, or the reader is watching a layout jump
       instead of an entrance. */
    .iv-stage { position: relative; height: 9.5rem; border: 1px solid var(--rule);
                border-radius: 9px; background: var(--paper-sunk); overflow: hidden; }

    .iv-panel { position: absolute; left: 0.8rem; right: 0.8rem; bottom: 0.8rem;
                padding: 0.8rem 0.9rem; border-radius: 9px;
                background: var(--accent); color: var(--paper);
                font-family: var(--sans); box-shadow: 0 6px 18px rgba(0,0,0,0.16);
                display: none; opacity: 0; transform: translateY(10px); }
    .iv-panel b { display: block; font: 650 0.85rem/1.35 var(--sans); }
    .iv-panel i { font: 400 0.74rem/1.4 var(--sans); font-style: normal; opacity: 0.85; }

    /* ---- A: keyframe animations. The element is mounted by script and
       unmounted by script when the exit animation ends. ---- */
    .iv-panel.is-mounted { display: block; }
    @keyframes iv-in  { from { opacity: 0; transform: translateY(10px); }
                        to   { opacity: 1; transform: none; } }
    @keyframes iv-out { from { opacity: 1; transform: none; }
                        to   { opacity: 0; transform: translateY(10px); } }
    .iv-a.is-open  { animation: iv-in ${IN_MS}ms var(--ease-out-strong) both; }
    .iv-a.is-close { animation: iv-out ${OUT_MS}ms cubic-bezier(0.4, 0, 1, 1) both; }

    /* ---- B: transitions. The base rule is the closed state, so the
       transition declared there is the exit; the open rule's is the
       entrance; @starting-style is the only reason the entrance has a
       value to start from at all. ---- */
    .iv-b {
      transition: opacity ${OUT_MS}ms cubic-bezier(0.4, 0, 1, 1),
                  transform ${OUT_MS}ms cubic-bezier(0.4, 0, 1, 1),
                  display ${OUT_MS}ms allow-discrete;
    }
    .iv-panel.iv-b.is-open {
      display: block; opacity: 1; transform: none;
      transition: opacity ${IN_MS}ms var(--ease-out-strong),
                  transform ${IN_MS}ms var(--ease-out-strong),
                  display ${IN_MS}ms allow-discrete;
    }
    @starting-style {
      .iv-panel.iv-b.is-open { opacity: 0; transform: translateY(10px); }
    }

    .iv-read { border: 1px solid var(--rule); border-radius: 8px; background: var(--paper);
               padding: 0.6rem 0.7rem; min-height: 5.4rem; }
    .iv-tag { display: inline-block; border-radius: 999px; padding: 0.16rem 0.55rem;
              font: 600 0.64rem/1.5 var(--sans); text-transform: uppercase;
              letter-spacing: 0.07em; border: 1px solid var(--rule); color: var(--ink-faint); }
    .iv-tag.jumped { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, transparent); }
    .iv-tag.held   { color: var(--good); border-color: color-mix(in srgb, var(--good) 45%, transparent); }
    .iv-nums { margin: 0.4rem 0 0; font: 400 0.74rem/1.6 var(--mono); color: var(--ink-soft); }
    .iv-nums b { color: var(--ink); font-weight: 600; }
    .iv-said { margin: 0.3rem 0 0; font: 400 0.8rem/1.5 var(--sans); color: var(--ink); }

    .iv-controls { display: grid; gap: 0.8rem; margin-top: 1.15rem;
                   padding-top: 1rem; border-top: 1px solid var(--rule);
                   font-family: var(--sans); }
    @media (min-width: 640px) { .iv-controls { grid-template-columns: minmax(0, 1fr) auto;
                                               align-items: end; gap: 1.2rem; } }
    .iv-slider label { display: flex; justify-content: space-between; align-items: baseline;
                       gap: 0.75rem; font: 600 0.8rem/1.4 var(--sans); color: var(--ink-soft);
                       margin-bottom: 0.3rem; }
    .iv-slider output { font: 400 0.76rem/1 var(--mono); color: var(--accent); }
    .iv-slider input { width: 100%; }
    .iv-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .iv-note { margin: 0.9rem 0 0; font: 400 0.82rem/1.55 var(--sans); color: var(--ink-soft);
               min-height: 2.5rem; }
    .iv-note b { color: var(--ink); font-weight: 650; }

    .iv-code { border-top: 1px solid var(--rule); padding: 0.85rem 1.1rem 1rem;
               background: var(--paper-sunk); }
    .iv-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .iv-cols { display: grid; gap: 0.8rem; margin-top: 0.6rem;
               grid-template-columns: minmax(0, 1fr); }
    @media (min-width: 780px) { .iv-cols { grid-template-columns: 1fr 1fr; } }
    .iv-code pre { margin: 0.3rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); overflow-x: auto;
                   font: 400 0.71rem/1.6 var(--mono); color: var(--ink); white-space: pre; }
    .iv-code h4 { margin: 0; font: 600 0.72rem/1.4 var(--sans); color: var(--ink-soft); }
    .iv-code i { color: var(--ink-faint); font-style: normal; }
    .iv-code b { font-weight: 400; background: var(--accent-soft); border-radius: 3px;
                 padding: 0 0.15em; }

    @media print { .iv-controls, .iv-btns { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const CODE_A =
`<i>/* the entrance and the exit, as keyframes */</i>
@keyframes in  { from { opacity: 0; transform: translateY(10px); } }
@keyframes out { <b>from { opacity: 1; transform: none; }</b>
                 to   { opacity: 0; transform: translateY(10px); } }

.panel.is-open  { animation: in  ${IN_MS}ms var(--ease-out-strong) both; }
.panel.is-close { animation: out ${OUT_MS}ms ease-in both; }

<i>// and the bookkeeping, because CSS is not keeping it mounted</i>
function open()  { p.classList.add('is-mounted', 'is-open'); }
function close() {
  p.classList.remove('is-open');
  p.classList.add('is-close');
  p.addEventListener('animationend', () =&gt;
    p.classList.remove('is-close', 'is-mounted'), { once: true });
}`;

  const CODE_B =
`<i>/* closed state — and so, the exit */</i>
.panel {
  display: none; opacity: 0; transform: translateY(10px);
  transition: opacity ${OUT_MS}ms ease-in, transform ${OUT_MS}ms ease-in,
              display ${OUT_MS}ms allow-discrete;
}
<i>/* open state — and so, the entrance */</i>
.panel.is-open {
  display: block; opacity: 1; transform: none;
  transition: opacity ${IN_MS}ms var(--ease-out-strong),
              transform ${IN_MS}ms var(--ease-out-strong),
              display ${IN_MS}ms allow-discrete;
}
<b>@starting-style { .panel.is-open { opacity: 0; transform: translateY(10px); } }</b>

<i>// all of it</i>
function open()  { p.classList.add('is-open'); }
function close() { p.classList.remove('is-open'); }`;

  /* Both readings are taken in the same tick as the class change: getComputedStyle
     forces the style resolve, so what comes back is each mechanism's value at its
     own t = 0. Sampling a frame later instead would let the entrance keep running
     in the gap before the reversal is created, and the number would then be
     measuring elapsed time rather than measuring the jump. */
  function readPair(a, b) {
    return [parseFloat(getComputedStyle(a).opacity), parseFloat(getComputedStyle(b).opacity)];
  }

  function build(root) {
    const id = 'iv' + (++uid);
    const title = root.dataset.title || 'Open it, then change your mind';
    const state = { delay: 100, timer: null, endA: null };

    root.classList.add('iv');
    root.innerHTML = `
      <div class="iv-head">${title}</div>
      <div class="iv-body">
        <div class="iv-panes">
          <div class="iv-pane">
            <span class="iv-name">A &mdash; keyframe animation<span>@keyframes in / @keyframes out</span></span>
            <div class="iv-stage">
              <div class="iv-panel iv-a" data-a><b>Message sent</b><i>to the #design channel</i></div>
            </div>
            <div class="iv-read" aria-live="polite">
              <span class="iv-tag" data-tag-a>not run yet</span>
              <p class="iv-nums" data-nums-a>&mdash;</p>
              <p class="iv-said" data-said-a></p>
            </div>
          </div>
          <div class="iv-pane">
            <span class="iv-name">B &mdash; transition<span>@starting-style + two rules</span></span>
            <div class="iv-stage">
              <div class="iv-panel iv-b" data-b><b>Message sent</b><i>to the #design channel</i></div>
            </div>
            <div class="iv-read" aria-live="polite">
              <span class="iv-tag" data-tag-b>not run yet</span>
              <p class="iv-nums" data-nums-b>&mdash;</p>
              <p class="iv-said" data-said-b></p>
            </div>
          </div>
        </div>

        <div class="iv-controls">
          <div class="iv-slider">
            <label for="${id}-d">Change your mind after
              <output data-out>100ms</output></label>
            <input id="${id}-d" type="range" min="20" max="600" step="20" value="100" data-delay>
          </div>
          <div class="iv-btns">
            <button class="btn primary" type="button" data-go>Open both, then close</button>
            <button class="btn" type="button" data-open>Open both</button>
            <button class="btn" type="button" data-close>Close both</button>
          </div>
        </div>

        <p class="iv-note" data-note>Both panels use the same 420ms entrance, the same curve and the
          same 320ms exit. The only difference is which mechanism draws them.</p>
      </div>
      <details class="iv-code">
        <summary>Both, in full</summary>
        <div class="iv-cols">
          <div><h4>A &mdash; keyframe animation</h4><pre>${CODE_A}</pre></div>
          <div><h4>B &mdash; transition</h4><pre>${CODE_B}</pre></div>
        </div>
      </details>
    `;

    const pa = root.querySelector('[data-a]');
    const pb = root.querySelector('[data-b]');
    const out = root.querySelector('[data-out]');
    const note = root.querySelector('[data-note]');

    function openBoth() {
      clearTimeout(state.timer);
      if (state.endA) { pa.removeEventListener('animationend', state.endA); state.endA = null; }
      pa.classList.remove('is-close');
      pa.classList.add('is-mounted', 'is-open');
      pb.classList.add('is-open');
    }

    function closeBoth() {
      /* A: swap the running entrance for an exit, and keep the element in the
         document until that exit has finished. This is the bookkeeping the
         transition side gets from allow-discrete for free. */
      pa.classList.remove('is-open');
      pa.classList.add('is-close');
      state.endA = () => { pa.classList.remove('is-close', 'is-mounted'); state.endA = null; };
      pa.addEventListener('animationend', state.endA, { once: true });
      /* B: one class off. display flips itself at the end. */
      pb.classList.remove('is-open');
    }

    function show(which, before, after) {
      const tag = root.querySelector(`[data-tag-${which}]`);
      const nums = root.querySelector(`[data-nums-${which}]`);
      const said = root.querySelector(`[data-said-${which}]`);
      const jumped = after - before > 0.05;
      tag.className = 'iv-tag ' + (jumped ? 'jumped' : 'held');
      tag.textContent = jumped ? 'jumped forward' : 'turned around';
      nums.innerHTML = `opacity at the interrupt <b>${before.toFixed(2)}</b>`
        + ` &rarr; where the exit starts <b>${after.toFixed(2)}</b>`;
      said.textContent = jumped
        ? 'The exit began at its own from-keyframe, not where the entrance had got to.'
        : 'The exit began from the value on screen.';
    }

    function run() {
      openBoth();
      clearTimeout(state.timer);
      state.timer = setTimeout(() => {
        const [ba, bb] = readPair(pa, pb);
        closeBoth();
        const [aa, ab] = readPair(pa, pb);
        show('a', ba, aa);
        show('b', bb, ab);
        note.innerHTML = ba > 0.985
            ? 'The entrance had <b>already finished</b> before you changed your mind, so there was '
              + 'nothing left to interrupt and both panels agree. Drag the interrupt below 420ms.'
            : 'Same numbers, same curves, same 420ms. <b>A restarted; B continued.</b> That is the '
              + 'whole difference between a keyframe animation and a transition, and it only shows '
              + 'up when someone changes their mind mid-flight.';
      }, state.delay);
    }

    root.querySelector('[data-delay]').addEventListener('input', (e) => {
      state.delay = +e.target.value;
      out.textContent = state.delay + 'ms';
    });
    root.querySelector('[data-go]').addEventListener('click', run);
    root.querySelector('[data-open]').addEventListener('click', openBoth);
    root.querySelector('[data-close]').addEventListener('click', () => {
      const [ba, bb] = readPair(pa, pb);
      closeBoth();
      const [aa, ab] = readPair(pa, pb);
      show('a', ba, aa);
      show('b', bb, ab);
    });

    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-interrupt-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
