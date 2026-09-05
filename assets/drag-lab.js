/* ============================================================
   drag-lab.js — a reorderable list with each of the five
   moments switchable off.

   Why this exists: the drag itself is not the design. Tracking
   the hand exactly is the definition of the interaction, not an
   achievement (grab-lab.js is where that gets felt). Everything
   a designer actually decides happens at the edges: the moment
   of pickup, the two things shown during the move, and the two
   possible endings.

   So the knobs are the five moments — lift, ghost, gap, settle,
   snap-back — and switching one off never breaks the reorder.
   The list always ends up correctly ordered. Only the sentence
   the interaction was saying goes missing, which is the same
   shape as D004's lab and for the same reason: a missing
   promise is invisible in a mockup and obvious under a finger.

   Each off state has a named casualty, and the verdict line
   says it out loud on every release, because "nothing told you"
   is a silent failure by definition.

   Layout jump: the list reserves one extra row slot at all
   times, so opening a gap while the origin is still marked can
   never resize the container. Rows are absolutely positioned
   and moved by transform only.

   The floating item is the row itself rather than a clone —
   which is both simpler and truer: in a good drag there is one
   object, and it is the one you picked up.

   Reduced motion: settle and snap-back *are* the lesson here,
   the way the tiles are the lesson in channel-lab.js, so they
   stay. Nothing autoplays, nothing loops, and every animation
   in here is the direct consequence of the user letting go of
   something they chose to pick up.

   Usage:
     <div data-drag-lab data-title="Five moments"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const GAP_PX = 7;

  const MOMENTS = [
    { id: 'lift',  name: 'Lift',
      off: 'Pickup — nothing changed, so you cannot tell the drag has started.' },
    { id: 'ghost', name: 'Ghost',
      off: 'During — the list closed up behind it. Home is gone.' },
    { id: 'gap',   name: 'Gap',
      off: 'During — the list is rigid, so where it lands is a guess until you let go.' },
    { id: 'settle', name: 'Settle',
      off: 'Accepted — it teleported. Nothing joins where it was to where it is.' },
    { id: 'snap',  name: 'Snap-back',
      off: 'Rejected — it vanished from your hand. You cannot see that you got out.' },
  ];

  const ITEMS = ['Onboarding email', 'Trial reminder', 'Feature digest',
                 'Renewal notice', 'Win-back offer'];

  function injectStyles() {
    if (document.getElementById('drag-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'drag-lab-styles';
    s.textContent = `
    .dg { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .dg { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .dg-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .dg-board { padding: 1.2rem 1.1rem; background: var(--paper); }
    .dg-list { position: relative; max-width: 26rem; margin: 0 auto;
               touch-action: none; }

    .dg-row { position: absolute; left: 0; right: 0; top: 0; height: 2.7rem;
              display: flex; align-items: center; gap: 0.6rem; padding: 0 0.7rem;
              border: 1px solid var(--rule); border-radius: 8px; background: var(--paper);
              font: 500 0.83rem/1.2 var(--sans); color: var(--ink);
              box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: grab;
              -webkit-user-select: none; user-select: none;
              transition: transform 200ms var(--ease-out-strong); }
    .dg-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .dg-grip { flex: none; width: 0.7rem; color: var(--ink-faint); font-size: 0.9rem;
               line-height: 1; letter-spacing: 0.08em; }
    .dg-n { margin-left: auto; font: 500 0.68rem/1.3 var(--mono); color: var(--ink-faint); }

    /* The dragged row is the floating object. No transition while the hand
       owns it — that is the whole argument of the previous lab. */
    .dg-row.is-drag { transition: none; z-index: 3; cursor: grabbing; }
    .dg-row.is-drag.has-lift { box-shadow: 0 10px 24px rgba(0,0,0,0.20);
                               border-color: var(--ink-faint); }
    .dg-row.is-settling { transition: transform 240ms var(--ease-out-strong),
                          box-shadow 240ms linear; }
    /* Switching settle or snap-back off has to mean *no* interpolation, which
       means beating the resting 200ms transition every row otherwise carries. */
    .dg-row.is-instant { transition: none; }

    .dg-ghost { position: absolute; left: 0; right: 0; top: 0; height: 2.7rem;
                display: none; align-items: center; padding: 0 0.7rem;
                border: 1px dashed var(--ink-faint); border-radius: 8px;
                background: transparent; color: var(--ink-faint);
                font: 500 0.83rem/1.2 var(--sans); opacity: 0.75;
                transition: transform 200ms var(--ease-out-strong); }
    .dg-ghost.on { display: flex; }

    .dg-read { max-width: 26rem; margin: 0 auto; padding-top: 0.9rem;
               min-height: 3.4rem; font: 400 0.82rem/1.5 var(--sans); color: var(--ink-soft); }
    .dg-read b { color: var(--ink); font-weight: 600; }
    .dg-read .no { color: var(--bad); font-weight: 600; }
    .dg-read .yes { color: var(--good); font-weight: 600; }
    .dg-hint { font: 400 0.72rem/1.5 var(--sans); color: var(--ink-faint); }

    .dg-code { max-width: 26rem; margin: 0.6rem auto 0; }
    .dg-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .dg-code pre { margin: 0.5rem 0 0; padding: 0.7rem 0.8rem; border-radius: 6px;
                   background: var(--code-bg); font: 400 0.72rem/1.6 var(--mono);
                   color: var(--ink-soft); overflow-x: auto; white-space: pre; }

    .dg-foot { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;
               padding: 0.9rem 1.1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); font-family: var(--sans); }
    .dg-cap { font: 600 0.72rem/1.3 var(--sans); color: var(--ink-soft); }
    .dg-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .dg-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-faint);
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.6rem; }
    .dg-seg button:hover { border-color: var(--ink-faint); }
    .dg-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .dg-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media print { .dg-foot { display: none; } }
    `;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'dg' + (++uid);
    const title = root.dataset.title || 'Five moments';
    const on = { lift: true, ghost: true, gap: true, settle: true, snap: true };

    let order = ITEMS.slice();
    let step = 50, busy = false;
    let drag = null;   /* { label, el, from, target, offX, offY } */

    root.classList.add('dg');
    root.innerHTML = `
      <div class="dg-head"><span>${title}</span><span>drag a row — or focus one and press ↑ ↓</span></div>
      <div class="dg-board">
        <div class="dg-list" data-list>
          ${ITEMS.map((t) => `
            <div class="dg-row" data-row="${t}" tabindex="0" role="button"
                 aria-label="${t}, reorder with arrow keys">
              <span class="dg-grip" aria-hidden="true">⣿</span><span>${t}</span>
              <span class="dg-n" data-n></span>
            </div>`).join('')}
          <div class="dg-ghost" data-ghost aria-hidden="true"></div>
        </div>
        <div class="dg-read" data-read aria-live="polite">
          Drag a row somewhere. Then drag one off the list entirely.
          <div class="dg-hint">Switching a moment off never breaks the reorder — the order always
            comes out right. Only what the interaction said goes missing.</div>
        </div>
        <details class="dg-code">
          <summary>The CSS behind it</summary>
          <pre>.row            { transition: transform 200ms; }
.row.is-drag    { transition: none; }   /* the hand owns it */
.row.is-settling{ transition: transform 240ms; }

/* Every position in this list is a translateY.
   Nothing here animates top, height or margin —
   the gap opening is four rows changing one
   transform each. */</pre>
        </details>
      </div>
      <div class="dg-foot">
        <span class="dg-cap">Moments</span>
        <div class="dg-seg" data-seg role="group" aria-label="Which moments are designed">
          ${MOMENTS.map((m) => `<button type="button" data-v="${m.id}">${m.name}</button>`).join('')}
        </div>
        <button class="btn" type="button" data-demo="out">Drop one outside for me</button>
        <button class="btn primary" type="button" data-demo="move">Reorder one for me</button>
      </div>
    `;

    const list = root.querySelector('[data-list]');
    const ghost = root.querySelector('[data-ghost]');
    const read = root.querySelector('[data-read]');
    const rows = {};
    ITEMS.forEach((t) => { rows[t] = root.querySelector(`[data-row="${t}"]`); });

    function say(html) {
      read.innerHTML = html + '<div class="dg-hint">Switching a moment off never breaks the '
        + 'reorder — the order always comes out right. Only what the interaction said goes '
        + 'missing.</div>';
    }

    function measure() {
      step = rows[ITEMS[0]].offsetHeight + GAP_PX;
      list.style.height = ((ITEMS.length + 1) * step - GAP_PX) + 'px';
      place();
    }

    /* Where every row sits right now. With a drag in progress the dragged row is
       excluded — it is under the finger — and the remaining rows are arranged
       according to which of ghost and gap are switched on. */
    function place() {
      if (!drag) {
        order.forEach((t, i) => {
          rows[t].querySelector('[data-n]').textContent = i + 1;
          rows[t].style.transform = `translateY(${i * step}px)`;
        });
        ghost.classList.remove('on');
        return;
      }
      const { from, target, label } = drag;
      /* The slots that are actually free. With the ghost on, slot `from` stays
         occupied by the outline for the whole drag — which is the entire reason
         the list keeps one slot in reserve, and the reason opening a gap can
         never resize it. */
      const avail = [];
      for (let i = 0; i <= ITEMS.length; i++) if (!(on.ghost && i === from)) avail.push(i);
      const others = order.filter((t) => t !== label);
      const seq = [];
      for (let k = 0; k < others.length; k++) {
        if (on.gap && k === target) seq.push(null);   /* the landing slot */
        seq.push(others[k]);
      }
      if (on.gap && target >= others.length) seq.push(null);
      seq.forEach((t, i) => {
        if (t) rows[t].style.transform = `translateY(${avail[i] * step}px)`;
      });
      if (on.ghost) {
        ghost.classList.add('on');
        ghost.textContent = label;
        ghost.style.transform = `translateY(${from * step}px)`;
      } else {
        ghost.classList.remove('on');
      }
    }

    function paint() {
      root.querySelectorAll('.dg-seg button').forEach((b) =>
        b.setAttribute('aria-pressed', String(!!on[b.dataset.v])));
    }

    function start(label, px, py) {
      if (busy || drag) return;
      const from = order.indexOf(label);
      const el = rows[label];
      drag = { label, el, from, target: from, offX: px, offY: py - from * step };
      el.classList.add('is-drag');
      el.classList.remove('is-settling');
      if (on.lift) el.classList.add('has-lift');
      say('Holding it.');
      moveTo(px, py);
    }

    function moveTo(px, py) {
      if (!drag) return;
      const top = py - drag.offY;
      drag.el.style.transform =
        `translate(${(px - drag.offX) * 0.35}px, ${top}px)` + (on.lift ? ' scale(1.02)' : '');
      const t = Math.max(0, Math.min(ITEMS.length - 1, Math.round(top / step)));
      if (t !== drag.target) { drag.target = t; place(); }
    }

    function end(inside) {
      if (!drag) return;
      const { label, el, from, target } = drag;
      const accepted = inside && target !== from;
      const dest = accepted ? target : (inside ? from : from);
      const animate = accepted ? on.settle : on.snap;

      if (accepted) { order.splice(from, 1); order.splice(target, 0, label); }
      drag = null;
      busy = true;

      el.classList.remove('is-drag', 'has-lift');
      el.classList.add(animate ? 'is-settling' : 'is-instant');
      /* The reflow commits the drag transform as the value the settle leaves
         from. Without it the class change and the new transform land in one
         style recalculation and there is nothing to interpolate. */
      void el.offsetWidth;
      el.style.transform = `translateY(${(accepted ? target : dest) * step}px)`;
      place();
      setTimeout(() => {
        el.classList.remove('is-settling', 'is-instant');
        busy = false;
      }, animate ? 260 : 20);

      if (!inside) {
        say(on.snap
          ? `Dropped outside the list. <span class="yes">Snapped back</span> to ${from + 1} — you can see you got out.`
          : `Dropped outside the list. It <span class="no">reappeared at ${from + 1}</span> with nothing in between. Did it move? Did it delete?`);
      } else if (!accepted) {
        say(`Let go where it started. Nothing changed, and nothing needed to.`);
      } else {
        say(on.settle
          ? `Moved to <b>${target + 1}</b>. <span class="yes">Settled</span> into the slot it had been showing you.`
          : `Moved to <b>${target + 1}</b> — and <span class="no">teleported</span> there. Nothing connects where it was to where it is.`);
      }
    }

    /* --- pointer -------------------------------------------------------- */
    function local(e) {
      const r = list.getBoundingClientRect();
      return { px: e.clientX - r.left, py: e.clientY - r.top, r };
    }

    list.addEventListener('pointerdown', (e) => {
      const row = e.target.closest('.dg-row');
      if (!row || busy) return;
      e.preventDefault();
      list.setPointerCapture(e.pointerId);
      const { px, py } = local(e);
      start(row.dataset.row, px, py);
    });
    list.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const { px, py } = local(e);
      moveTo(px, py);
    });
    function release(e) {
      if (!drag) return;
      const r = list.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right
                  && e.clientY >= r.top && e.clientY <= r.bottom;
      end(inside);
    }
    list.addEventListener('pointerup', release);
    list.addEventListener('pointercancel', (e) => { if (drag) end(true); });

    /* --- keyboard ------------------------------------------------------- */
    /* A drag is not an interaction everyone can perform, so the same reorder
       has to exist without one. This is the non-drag path the lesson argues
       for, and it is eleven lines. */
    list.addEventListener('keydown', (e) => {
      const row = e.target.closest('.dg-row');
      if (!row || busy || drag) return;
      const dir = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
      if (!dir) return;
      e.preventDefault();
      const i = order.indexOf(row.dataset.row);
      const j = Math.max(0, Math.min(order.length - 1, i + dir));
      if (i === j) return;
      order.splice(i, 1); order.splice(j, 0, row.dataset.row);
      place();
      say(`<b>${row.dataset.row}</b> moved to <b>${j + 1}</b>, with no drag involved.`);
    });

    /* --- do it for me --------------------------------------------------- */
    function demo(kind) {
      if (busy || drag) return;
      const label = order[kind === 'move' ? 3 : 1];
      const from = order.indexOf(label);
      const startY = from * step + step / 2;
      const endY = kind === 'move' ? (from - 2) * step + step / 2
                                   : (ITEMS.length + 1) * step + 46;
      const endX = 0;
      start(label, 0, startY);
      const t0 = performance.now(), dur = 750;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        moveTo(endX * e, startY + (endY - startY) * e);
        if (k < 1) requestAnimationFrame(tick);
        else setTimeout(() => end(kind === 'move'), 160);
      };
      requestAnimationFrame(tick);
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.dg-seg button');
      if (seg) {
        if (busy || drag) return;
        on[seg.dataset.v] = !on[seg.dataset.v];
        paint();
        const m = MOMENTS.find((x) => x.id === seg.dataset.v);
        say(on[seg.dataset.v]
          ? `<b>${m.name}</b> is designed again.`
          : `<b>${m.name}</b> switched off. <span class="no">${m.off}</span>`);
        return;
      }
      const d = e.target.closest('[data-demo]');
      if (d) demo(d.dataset.demo);
    });

    paint();
    /* Synchronously, not in a rAF: the rows are laid out entirely by transform,
       so until this runs they are all stacked at slot zero. Row height is a fixed
       rem value, so nothing here depends on fonts having arrived. */
    measure();
    window.addEventListener('load', measure);
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-drag-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
