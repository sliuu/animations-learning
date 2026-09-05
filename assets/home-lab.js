/* ============================================================
   home-lab.js — where does this thing live when it's closed?

   Why this exists: lesson D002 argues that you never choose an
   animation, you choose an origin, and the motion is the
   consequence. A lab that offered "slide / fade / scale" as the
   knob would contradict the lesson in its own interface. So the
   only knob here is a *place* — past the left edge, inside its
   button, nowhere at all — and the transform is derived from
   that place and the element's resting rectangle. She never
   picks a transform. She picks a home and watches one fall out.

   The verdict line is the silent-failure rule applied to a
   design failure: an account menu that flies in from the far
   edge of the screen looks completely correct in a still frame.
   Every one of the twenty-four combinations therefore says out
   loud what it now claims about the element.

   Not every wrong-looking answer is wrong. Several homes are
   marked "defensible" rather than graded, because they are what
   real products ship for real reasons — a bottom-sheet confirm
   on a phone, a nav that grows from its own hamburger. A lab
   with one right answer per element would teach a rule; this
   one is trying to teach a question.

   Reduced motion: the content here *is* motion, so removing it
   leaves an empty app frame rather than a calmer one — the 0009
   distinction between decoration and information, applied
   honestly. Nothing autoplays, nothing loops, and every frame
   is the result of a press. That is the accommodation.

   Usage:
     <div data-home-lab data-title="Pick a home"></div>
   ============================================================ */

(() => {
  let uid = 0;

  /* Each element has a fixed resting rectangle — that is what it *is*.
     The home is where it comes from to get there, and where it goes back to. */
  const ELEMENTS = [
    { id: 'nav',    label: 'Navigation panel', conv: 'left',   scrim: true  },
    { id: 'menu',   label: 'Account menu',     conv: 'source', scrim: false },
    { id: 'toast',  label: 'Toast',            conv: 'bottom', scrim: false },
    { id: 'dialog', label: 'Confirm dialog',   conv: 'none',   scrim: true  },
  ];

  const HOMES = [
    { id: 'left',   label: 'past the left edge' },
    { id: 'right',  label: 'past the right edge' },
    { id: 'top',    label: 'above the top edge' },
    { id: 'bottom', label: 'below the bottom edge' },
    { id: 'source', label: 'inside its button' },
    { id: 'none',   label: "nowhere — it's conjured" },
  ];

  const TAGS = {
    good: 'the convention',
    ok: 'defensible',
    bad: 'says the wrong thing',
  };

  /* The whole lesson, twenty-four lines long. Written per combination rather
     than generated, because the interesting part of each one is *why* — and
     "wrong" for a toast is wrong in a different way than it is for a dialog. */
  const VERDICTS = {
    nav: {
      left:   ['good', 'Lives past the left edge, behind the button that opens it. Put away, not destroyed.'],
      right:  ['bad',  'Crosses the whole screen from the far side. Nothing over on the right ever suggested a nav.'],
      top:    ['bad',  'Drops from above onto a shape that rests along the left. It arrives sideways to itself.'],
      bottom: ['bad',  'Rises from the bottom, which is where sheets live. It borrows a sheet’s meaning and keeps a panel’s shape.'],
      source: ['ok',   'Grows out of the ☰. Honest, and common on small screens — but a full-height panel growing from a 20px button is a lot of scale.'],
      none:   ['bad',  'Conjured in place. Closing it now means nothing, because there is nowhere for it to have gone.'],
    },
    menu: {
      source: ['good', 'Grows out of the avatar. The menu and the button read as one object.'],
      right:  ['ok',   'Slides in from the edge it already sits near. Reads as a panel rather than as part of the button.'],
      top:    ['bad',  'Falls from above, past the button it belongs to, and stops below it. The link to the avatar is gone.'],
      left:   ['bad',  'Travels the full width of the window to land beside a button on the opposite side.'],
      bottom: ['bad',  'Comes up from the bottom to rest at the top. It crosses everything to get somewhere it could have started.'],
      none:   ['ok',   'Fades up in place. Safe, and says nothing at all about what opened it.'],
    },
    toast: {
      bottom: ['good', 'Slides up through the edge it sits on, and drops back through it. Arrives and dies in the same place.'],
      right:  ['good', 'Slides in from the near edge. The other conventional choice, and equally defensible.'],
      source: ['ok',   'Grows out of Save. Ties the message to the action — but a toast usually outlives the moment that button was on screen.'],
      top:    ['bad',  'Falls from the top to rest at the bottom, crossing all the content it is not about.'],
      left:   ['bad',  'Enters from the far edge and stops short of the near one. It is travelling away from its own home.'],
      none:   ['bad',  'Materialises in the corner. A message with no address — nothing says where it came from or where it went.'],
    },
    dialog: {
      none:   ['good', 'Conjured. A confirm dialog isn’t stored anywhere; it was made for this moment, and the scrim says so.'],
      source: ['ok',   'Grows out of Delete. Ties the question tightly to the button — right for a small inline confirm, heavy for a full dialog.'],
      bottom: ['ok',   'Rises from the bottom. That makes it a sheet, not a dialog: the right call on a phone, a borrowed one on a desktop.'],
      top:    ['bad',  'Drops from above like a system alert. Reads as something done to you rather than something you asked for.'],
      left:   ['bad',  'Slides in from the left and stops in the middle. Neither a drawer nor a dialog.'],
      right:  ['bad',  'Slides in from the right and stops in the middle. It looks like a panel that failed to dock.'],
    },
  };

  function injectStyles() {
    if (document.getElementById('home-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'home-lab-styles';
    s.textContent = `
    .hm { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .hm { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .hm-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }

    .hm-wrap { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.1rem; padding: 1.1rem; }
    @media (min-width: 760px) { .hm-wrap { grid-template-columns: minmax(0, 1fr) 16.5rem; } }

    /* ---- the app frame ---- */
    .hm-frame { position: relative; width: 100%; max-width: 340px; height: 358px;
                margin: 0 auto; overflow: hidden; border-radius: 11px;
                border: 1px solid var(--rule); background: var(--paper);
                font: 400 0.72rem/1.3 var(--sans); }
    /* .hm-chrome and .hm-body stay statically positioned on purpose: the trigger
       buttons' offsetLeft/offsetTop are read against .hm-frame to place the
       transform-origin for the "inside its button" home. */
    .hm-chrome { display: flex; align-items: center; gap: 0.6rem;
                 padding: 0.55rem 0.7rem; border-bottom: 1px solid var(--rule); }
    .hm-ttl { flex: 1; font-weight: 600; color: var(--ink); }
    .hm-trig { border: 1px solid transparent; border-radius: 6px; background: none;
               color: var(--ink-soft); font: inherit; cursor: default; padding: 0.15rem 0.35rem; }
    .hm-trig.hi { border-color: var(--accent); color: var(--accent);
                  box-shadow: 0 0 0 3px var(--accent-soft); }
    .hm-av { width: 1.5rem; height: 1.5rem; border-radius: 50%; padding: 0;
             background: var(--accent-soft); }
    .hm-av.hi { background: var(--accent-soft); }

    .hm-body { padding: 0.8rem 0.7rem; display: grid; gap: 0.5rem; align-content: start; }
    .hm-row { height: 0.55rem; border-radius: 3px; background: var(--paper-sunk); }
    .hm-row:nth-child(2) { width: 72%; }
    .hm-row:nth-child(3) { width: 86%; }
    .hm-row:nth-child(4) { width: 64%; }
    .hm-row:nth-child(5) { width: 82%; }
    .hm-row:nth-child(6) { width: 70%; }
    .hm-row:nth-child(7) { width: 90%; }
    .hm-acts { display: flex; gap: 0.45rem; margin-top: 0.7rem; }
    .hm-btn { border-color: var(--rule); padding: 0.28rem 0.6rem; background: var(--paper); }
    .hm-del { color: var(--bad); }

    .hm-scrim { position: absolute; inset: 0; background: rgba(20, 18, 16, 0.34);
                opacity: 0; display: none; }
    .hm-scrim.live { display: block; }

    .hm-el { position: absolute; border: 1px solid var(--rule);
             border-radius: 8px; background: var(--paper);
             box-shadow: 0 8px 26px rgba(20, 18, 16, 0.16); }
    /* Written as :not() rather than .hm-el{display:none} so it outranks the
       per-element display: grid / flex rules below, which have equal
       specificity and come later. */
    .hm-el:not(.live):not(.measuring) { display: none; }
    .hm-el.measuring { visibility: hidden; }

    .hm-nav { top: 0; left: 0; bottom: 0; width: 62%; border-radius: 0 8px 8px 0;
              padding: 0.7rem; display: grid; gap: 0.45rem; align-content: start; }
    .hm-menu { top: 2.55rem; right: 0.5rem; width: 54%; padding: 0.4rem; display: grid; gap: 0.3rem; }
    .hm-toast { right: 0.6rem; bottom: 0.6rem; width: 64%; padding: 0.5rem 0.6rem;
                display: flex; align-items: center; gap: 0.45rem; }
    .hm-dialog { left: 9%; right: 9%; top: 30%; padding: 0.8rem; display: grid; gap: 0.55rem; }

    .hm-lbl { font-weight: 600; color: var(--ink); }
    .hm-item { height: 0.5rem; border-radius: 3px; background: var(--paper-sunk); }
    .hm-dot { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--good); flex: none; }
    .hm-dlg-acts { display: flex; gap: 0.4rem; justify-content: flex-end; }
    .hm-dlg-acts span { border: 1px solid var(--rule); border-radius: 5px;
                        padding: 0.2rem 0.5rem; font-size: 0.68rem; }

    /* ---- verdict ---- */
    .hm-verdict { max-width: 34rem; margin: 0.9rem auto 0; text-align: center;
                  font: 400 0.82rem/1.45 var(--sans); color: var(--ink-soft);
                  /* Reserved so switching between a one-line and a three-line
                     verdict doesn't shift the frame above it. */
                  min-height: 4.2rem; }
    .hm-tag { display: inline-block; margin-right: 0.4rem; padding: 0.08rem 0.4rem;
              border-radius: 4px; font: 600 0.68rem/1.5 var(--sans);
              text-transform: uppercase; letter-spacing: 0.06em; }
    .hm-tag[data-v="good"] { color: var(--good); background: color-mix(in srgb, var(--good) 12%, transparent); }
    .hm-tag[data-v="ok"]   { color: var(--ink-soft); background: var(--paper-sunk); }
    .hm-tag[data-v="bad"]  { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, transparent); }

    /* ---- controls ---- */
    .hm-side { display: grid; gap: 0.9rem; align-content: start;
               font-family: var(--sans); font-size: 0.8rem; }
    .hm-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .hm-seg.col { flex-direction: column; }
    .hm-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft); text-align: left;
                     font: 500 0.76rem/1.3 var(--sans); padding: 0.34rem 0.55rem; }
    .hm-seg button:hover { border-color: var(--ink-faint); }
    .hm-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); }
    .hm-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .hm-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .hm-code { border-top: 1px solid var(--rule); padding-top: 0.7rem; }
    .hm-code summary { cursor: pointer; font: 500 0.75rem/1.4 var(--sans); color: var(--ink-soft); }
    .hm-code pre { margin: 0.5rem 0 0; padding: 0.6rem; border-radius: 6px;
                   background: var(--code-bg); overflow-x: auto;
                   font: 400 0.7rem/1.55 var(--mono); color: var(--ink); }

    @media print { .hm-side, .hm-actions { display: none; } }
    `;
    document.head.appendChild(s);
  }

  const INNER = {
    nav: '<span class="hm-lbl">Projects</span><div class="hm-item"></div><div class="hm-item" style="width:78%"></div><div class="hm-item" style="width:88%"></div><div class="hm-item" style="width:66%"></div>',
    menu: '<div class="hm-item"></div><div class="hm-item" style="width:74%"></div><div class="hm-item" style="width:84%"></div>',
    toast: '<span class="hm-dot"></span><span>Changes saved</span>',
    dialog: '<span class="hm-lbl">Delete project?</span><div class="hm-item"></div><div class="hm-dlg-acts"><span>Cancel</span><span style="color:var(--bad)">Delete</span></div>',
  };

  function build(root) {
    const id = 'hm' + (++uid);
    const title = root.dataset.title || 'Pick a home, get a motion';
    const state = { el: 'nav', home: 'left', busy: false };

    root.classList.add('hm');
    root.innerHTML = `
      <div class="hm-head"><span>${title}</span></div>
      <div class="hm-wrap">
        <div>
          <div class="hm-frame" data-frame>
            <div class="hm-chrome">
              <button class="hm-trig" type="button" tabindex="-1" aria-hidden="true" data-trig="nav">&#9776;</button>
              <span class="hm-ttl">Projects</span>
              <button class="hm-trig hm-btn" type="button" tabindex="-1" aria-hidden="true" data-trig="toast">Save</button>
              <button class="hm-trig hm-av" type="button" tabindex="-1" aria-hidden="true" data-trig="menu"></button>
            </div>
            <div class="hm-body">
              <div class="hm-row"></div><div class="hm-row"></div>
              <div class="hm-row"></div><div class="hm-row"></div>
              <div class="hm-row"></div><div class="hm-row"></div>
              <div class="hm-row"></div>
              <div class="hm-acts">
                <button class="hm-trig hm-btn hm-del" type="button" tabindex="-1" aria-hidden="true" data-trig="dialog">Delete</button>
              </div>
            </div>
            <div class="hm-scrim" data-scrim></div>
            ${ELEMENTS.map((e) => `<div class="hm-el hm-${e.id}" data-el="${e.id}">${INNER[e.id]}</div>`).join('')}
          </div>
          <p class="hm-verdict" aria-live="polite"><span class="hm-tag" data-tag></span><span data-vtext></span></p>
        </div>
        <div class="hm-side">
          <div class="control">
            <span class="control-label">Element</span>
            <div class="hm-seg" data-group="el" role="group" aria-label="Element">
              ${ELEMENTS.map((e) => `<button type="button" data-v="${e.id}">${e.label}</button>`).join('')}
            </div>
          </div>
          <div class="control">
            <span class="control-label">Where does it live when it's closed?</span>
            <div class="hm-seg col" data-group="home" role="group" aria-label="Home">
              ${HOMES.map((h) => `<button type="button" data-v="${h.id}">${h.label}</button>`).join('')}
            </div>
          </div>
          <div class="hm-actions">
            <button class="btn primary" type="button" data-play>Open and close it</button>
            <button class="btn" type="button" data-conv>Conventional home</button>
          </div>
          <details class="hm-code">
            <summary>The CSS behind it</summary>
            <pre data-code></pre>
          </details>
        </div>
      </div>
    `;

    const frame = root.querySelector('[data-frame]');
    const scrim = root.querySelector('[data-scrim]');
    const tag = root.querySelector('[data-tag]');
    const vtext = root.querySelector('[data-vtext]');
    const code = root.querySelector('[data-code]');
    const playBtn = root.querySelector('[data-play]');

    const elOf = (k) => frame.querySelector(`[data-el="${k}"]`);
    const trigOf = (k) => frame.querySelector(`[data-trig="${k}"]`);

    /* Geometry, measured rather than assumed: the away-transform is derived from
       the element's real resting rectangle inside the real frame, so changing a
       resting position in CSS can never leave the motion behind. */
    function away(k, home) {
      const el = elOf(k);
      const wasLive = el.classList.contains('live');
      if (!wasLive) el.classList.add('measuring');
      const fw = frame.clientWidth, fh = frame.clientHeight;
      const l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
      let out;
      if (home === 'left')        out = { tf: `translateX(${-Math.round(l + w)}px)`, op: '1', or: '' };
      else if (home === 'right')  out = { tf: `translateX(${Math.round(fw - l)}px)`, op: '1', or: '' };
      else if (home === 'top')    out = { tf: `translateY(${-Math.round(t + h)}px)`, op: '1', or: '' };
      else if (home === 'bottom') out = { tf: `translateY(${Math.round(fh - t)}px)`, op: '1', or: '' };
      else if (home === 'source') {
        const tr = trigOf(k);
        const ox = Math.round(tr.offsetLeft + tr.offsetWidth / 2 - l);
        const oy = Math.round(tr.offsetTop + tr.offsetHeight / 2 - t);
        out = { tf: 'scale(0.12)', op: '0', or: `${ox}px ${oy}px` };
      } else out = { tf: 'scale(0.92)', op: '0', or: '50% 50%' };
      if (!wasLive) el.classList.remove('measuring');
      return out;
    }

    function paint() {
      root.querySelectorAll('[data-group="el"] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.el)));
      root.querySelectorAll('[data-group="home"] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.v === state.home)));

      ELEMENTS.forEach((e) => trigOf(e.id).classList.toggle('hi', e.id === state.el));

      const [v, text] = VERDICTS[state.el][state.home];
      tag.dataset.v = v;
      tag.textContent = TAGS[v];
      vtext.textContent = text;

      const a = away(state.el, state.home);
      const name = ELEMENTS.find((e) => e.id === state.el).label;
      const home = HOMES.find((h) => h.id === state.home).label;
      const lines = [`/* ${name} — ${home} */`, '.el {'];
      if (a.or) lines.push(`  transform-origin: ${a.or};`);
      lines.push(`  transform: ${a.tf};`);
      if (a.op === '0') lines.push('  opacity: 0;');
      lines.push('}');
      code.textContent = lines.join('\n');
    }

    function play() {
      if (state.busy) return;
      state.busy = true;
      playBtn.disabled = true;

      const el = elOf(state.el);
      const wantScrim = ELEMENTS.find((e) => e.id === state.el).scrim;
      const a = away(state.el, state.home);

      el.classList.add('live');
      el.style.transition = 'none';
      el.style.transformOrigin = a.or || '50% 50%';
      el.style.transform = a.tf;
      el.style.opacity = a.op;
      if (wantScrim) {
        scrim.classList.add('live');
        scrim.style.transition = 'none';
        scrim.style.opacity = '0';
      }
      void frame.offsetWidth;

      el.style.transition = 'transform 280ms var(--ease-out-strong), opacity 220ms ease-out';
      el.style.transform = 'none';
      el.style.opacity = '1';
      if (wantScrim) { scrim.style.transition = 'opacity 280ms ease-out'; scrim.style.opacity = '1'; }

      setTimeout(() => {
        /* Back to the same home it came from. That the round trip is symmetrical
           is not a convenience here, it is the claim the next lab interrogates. */
        el.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 1, 1), opacity 160ms ease-in';
        el.style.transform = a.tf;
        el.style.opacity = a.op;
        if (wantScrim) { scrim.style.transition = 'opacity 190ms ease-in'; scrim.style.opacity = '0'; }
        setTimeout(() => {
          el.classList.remove('live');
          el.style.transition = 'none';
          scrim.classList.remove('live');
          state.busy = false;
          playBtn.disabled = false;
        }, 250);
      }, 1180);
    }

    root.addEventListener('click', (e) => {
      const seg = e.target.closest('.hm-seg button');
      if (seg) {
        const group = seg.closest('[data-group]').dataset.group;
        if (state.busy) return;
        state[group] = seg.dataset.v;
        paint();
        return;
      }
      if (e.target.closest('[data-conv]')) {
        if (state.busy) return;
        state.home = ELEMENTS.find((x) => x.id === state.el).conv;
        paint();
        return;
      }
      if (e.target.closest('[data-play]')) play();
    });

    paint();
    return id;
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-home-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
