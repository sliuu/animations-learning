/* ============================================================
   compose-lab.js — the engine for Reference 06, The Composer.

   Three panels. Pick words, watch the code assemble, watch the
   result. It holds no opinion: there is no verdict, no adjective
   and no threshold anywhere in this file. The readout is numbers.
   If you want to know whether 400ms is too slow for a press, the
   answer this page gives you is the 120ms version running next
   to it.

   The question it exists to answer is hers, asked three ways:
   how does it look when things change, when I tune the numbers,
   when I remove the fade and add it back? Every decision below
   falls out of that, and the enemy is memory — a 120ms press is
   over before you look up.

   So: TWO STAGES, ALWAYS. The lower one is the current
   composition. The upper one is the composition *one edit ago*.
   Remove the fade and the faded version keeps running next to
   the unfaded one; nudge the duration and the old duration holds
   above. No pinning and no setup — the comparison is a side
   effect of editing. "Hold this" pins a reference when one needs
   to survive a run of edits.

   Two mechanisms, one source. The code panel prints CSS
   transitions, because that is what someone would ship. The
   stage runs the same declarations through the Web Animations
   API, because a transition cannot be scrubbed and "what does
   the middle look like" is half the question. Both are generated
   from the same emit() output, so they can differ in mechanism
   and never in content.

   var() cannot be handed to WAAPI, so emitted values are
   resolved against :root first — and a resolved copy goes stale
   the moment the theme flips, so this watches data-theme and
   re-renders. Same arrangement as spring-lab and cost-lab.

   Reduced motion: this is a bench for looking at motion, and a
   reader who has asked for less of it still needs the bench to
   work. So nothing here ever plays on its own — no autoplay on
   load, no loop unless it is switched on — and everything runs
   from an explicit press. What the preference removes is the
   unasked-for movement, which on this page is all of it.

   Mounts on [data-compose-lab]. Honours data-title.
   ============================================================ */

(() => {
  let uid = 0;
  const C = window.COMPOSE_CATALOGUE;

  /* --- small helpers --------------------------------------------------- */

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  /* Transform functions are emitted in a fixed order so that the same set of
     words always produces the same string — a receipt that reshuffles itself
     is not a receipt. */
  const SLOT_ORDER = ['translate', 'rotate', 'scale'];

  /* What each animated property looks like at rest. WAAPI needs an explicit
     first keyframe; a transition would have inferred it. background-color is
     the exception and gets read off the element, because its rest value is
     whatever the scene's own CSS said. */
  const REST = {
    transform: 'none',
    opacity: '1',
    filter: 'none',
    'box-shadow': 'none',
    outline: '3px solid transparent',
    'outline-offset': '0px',
  };

  function resolveVars(str, root) {
    return String(str).replace(/var\((--[a-z-]+)\)/g, (m, name) =>
      getComputedStyle(root).getPropertyValue(name).trim() || m);
  }

  /* ============================================================
     EMISSION — state in, declarations out.
     ============================================================ */

  /* One target's declarations at one end, from every chip on it, merged.
     Transform functions land in slots and are joined; everything else is a
     plain declaration. Two words cannot hold the same slot, so nothing here
     can silently overwrite anything.

     `end` is 'moment' or 'rest'. A word that lives off screen writes both:
     where it waits and where it arrives. Most words write only the moment,
     and their rest value is inferred from REST below. */
  function mergeDecls(chips, end) {
    const decls = {};
    const fns = {};
    chips.forEach((chip) => {
      const word = C.wordsById[chip.word];
      if (!word) return;
      const out = word.emit(chip.values || {}) || {};
      Object.assign(decls, (end === 'rest' ? out.rest : out.decls) || {});
      Object.assign(fns, (end === 'rest' ? out.restFns : out.fns) || {});
    });
    const parts = SLOT_ORDER.filter((s) => fns[s]).map((s) => fns[s]);
    if (parts.length) decls.transform = parts.join(' ');
    return decls;
  }
  const declsFor = (chips) => mergeDecls(chips, 'moment');
  const restDeclsFor = (chips) => mergeDecls(chips, 'rest');

  /* The moment whose rule is the resting one. Every object declares exactly
     one; it holds no words and owns the timing on the way back. */
  const restMomentOf = (obj) =>
    obj.moments.find((m) => m.rest) || obj.moments[obj.moments.length - 1];

  /* Everything the current state produces, per moment, per target. The engine
     works from this and so does the code panel — one pass, two readers. */
  function build(obj, state) {
    const moments = [];
    obj.moments.forEach((m) => {
      const groups = [];
      obj.targets.forEach((t) => {
        const chips = (state.chips[m.id] || []).filter((c) => c.target === t.id);
        if (!chips.length) return;
        groups.push({ target: t, decls: declsFor(chips), rest: restDeclsFor(chips), chips });
      });
      if (groups.length) moments.push({ moment: m, groups });
    });
    return moments;
  }

  /* Every property any moment touches, which is what the transition line on
     the resting rule has to name. */
  function propsUsed(built) {
    const set = new Set();
    built.forEach((b) => b.groups.forEach((g) => {
      Object.keys(g.decls).forEach((p) => set.add(p));
      Object.keys(g.rest).forEach((p) => set.add(p));
    }));
    return [...set];
  }

  /* Everything the words want written on the resting rule, per target. */
  function restFor(built) {
    const byTarget = new Map();
    built.forEach((b) => b.groups.forEach((g) => {
      if (!Object.keys(g.rest).length) return;
      const cur = byTarget.get(g.target.id) || {};
      byTarget.set(g.target.id, Object.assign(cur, g.rest));
    }));
    return byTarget;
  }

  /* --- the code panel's text ------------------------------------------
     Printed with the real pseudo-classes, never the mirror classes: the
     mirrors are scaffolding this page needs to replay a moment without a
     hand on the pointer, and they do not belong in the receipt. */
  function toCSS(obj, state, built) {
    const rest = restMomentOf(obj);
    const rt = state.timing[rest.id];
    const lines = [];

    const props = propsUsed(built);
    if (props.length) {
      const restDecls = restFor(built);
      const hosts = new Set();
      built.forEach((b) => b.groups.forEach((g) => hosts.add(g.target.id)));
      obj.targets.filter((t) => hosts.has(t.id)).forEach((t) => {
        const own = new Set();
        built.forEach((b) => b.groups.filter((g) => g.target.id === t.id)
          .forEach((g) => {
            Object.keys(g.decls).forEach((p) => own.add(p));
            Object.keys(g.rest).forEach((p) => own.add(p));
          }));
        if (!own.size) return;
        /* Three longhands, not the shorthand. The shorthand's value contains the
           curve, the curve contains commas, and the property list is separated by
           commas too — so the shorthand cannot be split back apart to make one
           editable duration and one editable curve. Longhands give each value
           exactly one home, and they are what a person reads more easily anyway.

           The transition on *this* rule is the one that governs leaving the
           moment, which is why the resting rule is a row in the moment picker
           and not an implementation detail. */
        lines.push({ moment: rest.id, end: 'rest', tid: t.id, sel: t.tpl.replace('{}', ''), decls: {
          ...(restDecls.get(t.id) || {}),
          'transition-property': [...own].join(', '),
          'transition-duration': `${rt.dur.ms}ms`,
          'transition-timing-function': rt.curve.css,
        } });
      });
    }

    /* A moment prints its own timing only when it differs from the return.
       Same timing both ways is one line of CSS and should read as one; a
       drawer that opens slower than it closes should show exactly where that
       second number lives. */
    built.forEach((b) => {
      const mt = state.timing[b.moment.id];
      const same = mt.dur.ms === rt.dur.ms && mt.curve.css === rt.curve.css;
      b.groups.forEach((g) => {
        lines.push({
          moment: b.moment.id,
          end: 'moment',
          tid: g.target.id,
          sel: g.target.tpl.replace('{}', b.moment.real),
          decls: same ? g.decls : {
            ...g.decls,
            'transition-duration': `${mt.dur.ms}ms`,
            'transition-timing-function': mt.curve.css,
          },
        });
      });
    });
    return lines;
  }

  /* The applied stylesheet: same declarations, scoped to one stage, plus the
     mirror classes so a moment can be shown on demand. */
  function toScopedCSS(obj, state, built, scope) {
    const rest = restMomentOf(obj);
    const rt = state.timing[rest.id];
    const restDecls = restFor(built);
    const out = [];

    const hosts = new Map();
    built.forEach((b) => b.groups.forEach((g) => {
      if (!hosts.has(g.target.id)) hosts.set(g.target.id, { t: g.target, props: new Set() });
      Object.keys(g.decls).forEach((p) => hosts.get(g.target.id).props.add(p));
      Object.keys(g.rest).forEach((p) => hosts.get(g.target.id).props.add(p));
    }));
    hosts.forEach(({ t, props }, tid) => {
      const rd = restDecls.get(tid);
      const body = rd ? `${Object.entries(rd).map(([p, v]) => `${p}: ${v};`).join(' ')} ` : '';
      out.push(`${scope} ${t.tpl.replace('{}', '')} { ${body}transition-property: ${[...props].join(', ')};`
             + ` transition-duration: ${rt.dur.ms}ms; transition-timing-function: ${rt.curve.css}; }`);
    });

    built.forEach((b) => {
      const mt = state.timing[b.moment.id];
      const extra = (mt.dur.ms === rt.dur.ms && mt.curve.css === rt.curve.css) ? ''
        : ` transition-duration: ${mt.dur.ms}ms; transition-timing-function: ${mt.curve.css};`;
      b.groups.forEach((g) => {
        const body = Object.entries(g.decls).map(([p, v]) => `${p}: ${v};`).join(' ');
        out.push(`${scope} ${g.target.tpl.replace('{}', b.moment.real)} { ${body}${extra} }`);
        /* The drawer's real selector *is* a class, so the mirror is the same
           rule twice. Only emit it when it differs. */
        if (b.moment.mirror && b.moment.mirror !== b.moment.real) {
          out.push(`${scope} ${g.target.tpl.replace('{}', b.moment.mirror)} { ${body}${extra} }`);
        }
      });
    });
    return out.join('\n');
  }

  /* --- the self-check ---------------------------------------------------
     Generated CSS fails silently: an invalid declaration is dropped by the
     parser with no error, and the layout stays plausible. That has now cost
     this course real time three times, so the tool reports on itself. This is
     not a judgment about the composition — only about whether it parsed. */
  function invalidDecls(built, state) {
    const bad = [];
    if (!window.CSS || !CSS.supports) return bad;
    Object.values(state.timing).forEach((t) => {
      if (!CSS.supports('transition-timing-function', t.curve.css)) {
        bad.push(`timing function \`${t.curve.css}\``);
      }
      if (!(t.dur.ms >= 0)) bad.push('duration');
    });
    built.forEach((b) => b.groups.forEach((g) => {
      Object.entries(g.decls).forEach(([p, v]) => {
        if (!CSS.supports(p, v)) bad.push(`\`${p}: ${v}\``);
      });
    }));
    return bad;
  }

  /* ============================================================
     STYLES
     ============================================================ */

  function injectStyles() {
    if (document.getElementById('compose-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'compose-lab-styles';
    s.textContent = `
    .cp { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .cp { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .cp-head { display: flex; align-items: center; justify-content: space-between;
               gap: 1rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--rule);
               font: 600 0.78rem/1.3 var(--sans); letter-spacing: 0.02em;
               color: var(--ink-soft); background: var(--paper); }
    /* The sentence rewrites itself on every edit and wraps at narrow widths,
       which moved everything below it by 14.6px at 400px. Clamped to two lines
       and reserved at two lines, so it can grow and shrink without the page
       noticing. The full composition is in panel 1 regardless. */
    .cp-head .cp-sentence { font-weight: 400; color: var(--ink-faint);
                            font-size: 0.74rem; line-height: 1.4; text-align: right;
                            height: 2.8em; overflow: hidden; display: -webkit-box;
                            -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .cp-head > span:first-child { flex: none; }
    .cp-sentence b { color: var(--ink); font-weight: 600; }
    .cp-sentence i { color: var(--accent); font-style: normal; }

    .cp-body { display: grid; gap: 1px; background: var(--rule); }
    @media (min-width: 1180px) {
      .cp-body { grid-template-columns: 13rem minmax(16rem, 1fr) minmax(17rem, 1.05fr); }
    }
    .cp-pane { background: var(--paper); padding: 0.9rem 0.95rem; min-width: 0; }
    .cp-pane > h4 { font: 600 0.6rem/1.4 var(--sans); text-transform: uppercase;
                    letter-spacing: 0.09em; color: var(--ink-faint);
                    margin: 0 0 0.6rem; }

    /* --- panel 1: the words ------------------------------------------- */
    .cp-seg { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.75rem; }
    .cp-seg button { border: 1px solid var(--rule); border-radius: 6px; cursor: pointer;
                     background: var(--paper); color: var(--ink-soft);
                     font: 500 0.72rem/1.2 var(--sans); padding: 0.3rem 0.5rem; }
    .cp-seg button:hover { border-color: var(--ink-faint); }
    .cp-seg button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                          color: var(--paper); font-weight: 600; }
    .cp-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    /* The object picker sits above the moments and reads as a different kind
       of choice, so it gets the outline treatment rather than the fill. */
    .cp-objects button[aria-pressed="true"] { background: transparent; color: var(--ink);
      border-color: var(--accent); box-shadow: inset 0 -2px 0 var(--accent); }
    .cp-restnote { font: 400 0.72rem/1.5 var(--sans); color: var(--ink-soft);
      border: 1px dashed var(--rule); border-radius: 7px; padding: 0.6rem 0.7rem; margin: 0; }
    /* Two lines' worth, always. A one-line blurb next to a two-line one made
       this pane 17px shorter, and this pane is the tallest of the three, so
       the whole lab and everything under it moved every time she changed
       moment. */
    .cp-blurb { min-height: 2.1rem; font: 400 0.71rem/1.45 var(--sans); color: var(--ink-faint);
                margin: -0.35rem 0 0.7rem; }

    /* Fixed window, same reasoning as the code panel: a chip that gains two
       knob rows when it is switched on would otherwise change this panel's
       height, and below 1180 the panes are stacked — so turning a word on
       moved the stages 186px down the page, which is where she is looking. A
       palette does not get to move the thing it is editing. */
    /* grid-auto-rows: max-content, not the default 'auto'. Each card is
       'overflow: hidden', which makes its automatic minimum size zero, so in a
       fixed-height grid the rows are allowed to shrink — and a word with both
       a target select and a slider had its slider cut in half rather than
       overflowing into the scroll this panel already has. */
    .cp-words { display: grid; grid-auto-rows: max-content; gap: 0.35rem;
                align-content: start; height: 18.5rem; overflow-y: auto;
                padding-right: 0.15rem; }
    .cp-word { border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
               overflow: hidden; }
    .cp-word.is-on { border-color: var(--accent); background: var(--accent-soft); }
    .cp-word.is-blocked { opacity: 0.45; }
    .cp-wtop { display: flex; align-items: center; gap: 0.45rem; width: 100%;
               border: 0; background: none; cursor: pointer; text-align: left;
               padding: 0.4rem 0.5rem; font: 500 0.76rem/1.3 var(--sans); color: var(--ink); }
    .cp-word.is-blocked .cp-wtop { cursor: not-allowed; }
    .cp-wtop:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .cp-mark { flex: none; width: 0.85rem; height: 0.85rem; border-radius: 4px;
               border: 1px solid var(--rule); display: grid; place-items: center;
               font-size: 0.6rem; color: var(--paper); background: var(--paper-sunk); }
    .cp-word.is-on .cp-mark { background: var(--accent); border-color: var(--accent); }
    .cp-wgloss { color: var(--ink-faint); font-size: 0.68rem; font-weight: 400;
                 margin-left: auto; text-align: right; }
    .cp-word.is-on .cp-wgloss { color: var(--ink-soft); }

    .cp-knobs { display: grid; gap: 0.3rem; padding: 0 0.5rem 0.45rem 1.8rem; }
    .cp-knob { display: flex; align-items: center; gap: 0.4rem;
               font: 400 0.68rem/1.3 var(--sans); color: var(--ink-soft); }
    .cp-knob input[type=range] { flex: 1; min-width: 0; accent-color: var(--accent); height: 1rem; }
    .cp-knob output { font-family: var(--mono); font-size: 0.66rem; color: var(--ink);
                      min-width: 2.7rem; text-align: right; font-variant-numeric: tabular-nums; }
    .cp-tsel { border: 1px solid var(--rule); border-radius: 5px; background: var(--paper);
               color: var(--ink-soft); font: 400 0.66rem/1.2 var(--sans); padding: 0.15rem 0.2rem; }

    .cp-vals { margin-top: 0.9rem; border-top: 1px solid var(--rule); padding-top: 0.7rem; }
    .cp-vlab { font: 400 0.68rem/1.3 var(--sans); color: var(--ink-faint); margin: 0 0 0.3rem; }
    .cp-vals .cp-seg { margin-bottom: 0.6rem; }
    .cp-vals .cp-seg:last-child { margin-bottom: 0; }

    /* --- panel 2: the code -------------------------------------------- */
    .cp-code { background: var(--code-bg); border: 1px solid var(--rule); border-radius: 7px;
               padding: 0.7rem 0.75rem; font: 400 0.72rem/1.7 var(--mono);
               color: var(--ink-soft); white-space: pre-wrap; overflow-wrap: anywhere;
               height: 17rem; overflow-y: auto; }
    /* Side by side, the code takes whatever height the other two panes have
       already forced the row to be — an object with four rules had 340px of
       code in a 272px box sitting next to 400px of empty pane. 'flex-basis: 0'
       and not 'auto' is the whole trick: with 'auto' the code's own length
       becomes the pane's intrinsic height, so a long composition grows the
       lab and a short one shrinks it again, and the page below it moves every
       time a word is switched on. At zero basis it only ever fills space that
       something else decided on. */
    @media (min-width: 1180px) {
      .cp-codepane { display: flex; flex-direction: column; }
      .cp-code { flex: 1 1 0; height: auto; min-height: 17rem; }
    }
    /* Every moment's rule is printed, because the receipt is for the whole
       button — but the one being edited is the one lit. */
    /* Rules for the moments she is not looking at recede, but they stay on
       screen — the receipt is for the whole button, not for one moment.
       The recession is mostly the accent bar, and only slightly the fade:
       the code is already --ink-soft, and opacity multiplies against it, so
       a 0.42 dim measured 1.96:1 on the light theme — dimmer than anything
       else on the sheet and no longer readable code. Every rule reserves the
       bar's width so lighting one moves nothing. */
    .cp-rule { display: block; opacity: 0.85; border-left: 2px solid transparent;
               padding-left: 0.5rem; margin-left: -0.1rem; }
    .cp-rule.is-live { opacity: 1; border-left-color: var(--accent); }
    .cp-code .k { color: var(--ink); }
    .cp-code .s { color: var(--accent); }
    .cp-code .c { color: var(--ink-faint); }
    .cp-v { color: var(--ink); background: var(--paper-sunk); border-radius: 3px;
            padding: 0 0.18rem; margin: 0 -0.02rem; cursor: text;
            border-bottom: 1px dashed var(--ink-faint); }
    .cp-v:hover { background: var(--accent-soft); }
    .cp-v:focus { outline: 2px solid var(--accent); outline-offset: 1px; background: var(--paper); }
    .cp-v.is-bad { border-bottom-color: var(--bad); color: var(--bad); }

    .cp-check { font: 400 0.69rem/1.45 var(--sans); margin: 0.55rem 0 0;
                color: var(--ink-faint); min-height: 2.1rem; }
    .cp-check.is-bad { color: var(--bad); }

    /* --- panel 3: the result ------------------------------------------ */
    .cp-stages { display: grid; gap: 0.5rem; }
    .cp-stage { border: 1px solid var(--rule); border-radius: 8px; background: var(--paper-sunk);
                padding: 0.55rem 0.6rem 0.65rem; }
    .cp-stage.is-now { border-color: var(--accent); }
    .cp-slab { display: flex; align-items: baseline; justify-content: space-between;
               gap: 0.5rem; font: 600 0.6rem/1.4 var(--sans); text-transform: uppercase;
               letter-spacing: 0.08em; color: var(--ink-faint); margin-bottom: 0.4rem; }
    .cp-slab em { font: 400 0.66rem/1.4 var(--sans); text-transform: none;
                  letter-spacing: 0; color: var(--ink-soft); min-width: 0;
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cp-slab > span { flex: none; }
    .cp-stage.is-now .cp-slab { color: var(--accent); }
    .cp-scene { display: grid; min-width: 0; }
    .cp-stage { min-width: 0; }

    .cp-play { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem;
               margin-top: 0.7rem; }
    .cp-btn { border: 1px solid var(--rule); border-radius: 6px; background: var(--paper);
              color: var(--ink-soft); font: 500 0.72rem/1.2 var(--sans);
              padding: 0.32rem 0.55rem; cursor: pointer; }
    .cp-btn:hover { border-color: var(--ink-faint); }
    .cp-btn.primary { background: var(--accent); border-color: var(--accent);
                      color: var(--paper); font-weight: 600; }
    .cp-btn[aria-pressed="true"] { background: var(--accent); border-color: var(--accent);
                                   color: var(--paper); font-weight: 600; }
    .cp-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .cp-scrub { display: flex; align-items: center; gap: 0.45rem; margin-top: 0.5rem;
                font: 400 0.68rem/1.3 var(--sans); color: var(--ink-faint); }
    .cp-scrub input { flex: 1; min-width: 0; accent-color: var(--accent); }
    .cp-scrub output { font-family: var(--mono); font-size: 0.66rem; color: var(--ink);
                       min-width: 3.6rem; text-align: right; font-variant-numeric: tabular-nums; }

    .cp-read { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.7rem;
               border-top: 1px solid var(--rule); padding-top: 0.6rem; }
    .cp-cell { border: 1px solid var(--rule); border-radius: 6px; padding: 0.25rem 0.45rem;
               background: var(--paper-sunk); font: 400 0.66rem/1.35 var(--sans);
               color: var(--ink-faint); }
    .cp-cell b { display: block; font: 600 0.8rem/1.2 var(--mono); color: var(--ink);
                 font-variant-numeric: tabular-nums; }

    .cp-foot { padding: 0.6rem 1rem; border-top: 1px solid var(--rule); background: var(--paper);
               font: 400 0.7rem/1.5 var(--sans); color: var(--ink-faint); }

    @media print {
      .cp-pane:first-child, .cp-play, .cp-scrub, .cp-read, .cp-stages { display: none; }
      .cp-body { grid-template-columns: 1fr; }
    }`;
    document.head.appendChild(s);
  }

  /* ============================================================
     MOUNT
     ============================================================ */

  function mount(root) {
    const n = ++uid;
    const id = `cp-${n}`;
    let obj = C.objects[0];
    let restId = restMomentOf(obj).id;
    /* Which moment the resting rule is a return *from*. Tracked rather than
       declared, because on a button it is genuinely whichever one she was just
       looking at, and on a drawer there is only one it could be. */
    let lastReal = obj.moments.find((m) => !m.rest).id;

    const durOf = (pid) => C.durations.find((d) => d.id === pid);
    const curveOf = (cid) => C.curves.find((c) => c.id === cid);

    /* Timing is per moment, not per composition. One number for both
       directions cannot say that a drawer opens in 220ms and closes in 120ms,
       and that is not a detail of a drawer — it is most of one. */
    const freshTiming = () => {
      const t = {};
      obj.moments.forEach((m) => {
        const d = (m.defaults && m.defaults.duration) || obj.defaults.duration;
        const c = (m.defaults && m.defaults.curve) || obj.defaults.curve;
        t[m.id] = {
          dur: { preset: d, ms: durOf(d).ms },
          curve: { preset: c, css: curveOf(c).css },
        };
      });
      return t;
    };

    const freshState = () => ({
      moment: obj.moments[0].id,
      chips: clone(obj.seed),
      timing: freshTiming(),
    });

    let state = freshState();
    /* The timing of whatever the current moment is — every readout, every
       segmented control and the code panel's editable values go through it. */
    const T = (s) => s.timing[s.moment];
    /* "Before" is the composition one edit ago. Not a snapshot she has to
       remember to take — the comparison has to be free or it will not happen
       at the moment it is needed. */
    let before = clone(state);
    let beforeLabel = 'the same, so far';
    let held = false;          // "hold this" pins `before` across many edits
    let loop = false;
    let rate = 1;
    let scrubbing = false;
    let anims = [];

    /* prefers-reduced-motion, deliberately: this lab is *about* motion, so
       refusing to play would delete the thing she came for. What it removes is
       the motion she did not ask for — every edit auto-previews itself, which
       means one drag of a slider fires a dozen replays. Under the preference
       an edit only updates the code and the stages; Play, Loop and the
       scrubber still run in full, because pressing them is the request. */
    const lessMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const autoPlay = () => { if (!lessMotion.matches) play(); else stop(); };

    root.className = 'cp';
    root.id = id;
    root.innerHTML = `
      <div class="cp-head">
        <span>${esc(root.dataset.title || 'The composer')}</span>
        <span class="cp-sentence" data-sentence></span>
      </div>
      <div class="cp-body">
        <div class="cp-pane">
          <h4>1 · The words</h4>
          <div class="cp-seg cp-objects" data-objects role="group" aria-label="Object"></div>
          <div class="cp-seg" data-moments role="group" aria-label="Moment"></div>
          <p class="cp-blurb" data-blurb></p>
          <div class="cp-words" data-words></div>
          <div class="cp-vals">
            <p class="cp-vlab">duration</p>
            <div class="cp-seg" data-durs></div>
            <p class="cp-vlab">curve</p>
            <div class="cp-seg" data-curves></div>
          </div>
        </div>

        <div class="cp-pane cp-codepane">
          <h4>2 · The code</h4>
          <div class="cp-code" data-code></div>
          <p class="cp-check" data-check></p>
        </div>

        <div class="cp-pane">
          <h4>3 · The result</h4>
          <div class="cp-stages">
            <div class="cp-stage" data-stage="a">
              <div class="cp-slab"><span>Before</span><em data-beforelab></em></div>
              <div class="cp-scene" data-scene="a"></div>
            </div>
            <div class="cp-stage is-now" data-stage="b">
              <div class="cp-slab"><span>Now</span><em data-nowlab></em></div>
              <div class="cp-scene" data-scene="b"></div>
            </div>
          </div>
          <div class="cp-play">
            <button class="cp-btn primary" data-act="play">Play it</button>
            <button class="cp-btn" data-act="loop" aria-pressed="false">Loop</button>
            <button class="cp-btn" data-act="rate" aria-pressed="false">0.25&times;</button>
            <button class="cp-btn" data-act="hold" aria-pressed="false">Hold this</button>
          </div>
          <div class="cp-scrub">
            <span>scrub</span>
            <input type="range" min="0" max="1000" value="1000" step="1" data-scrub
                   aria-label="Scrub both stages">
            <output data-time></output>
          </div>
          <div class="cp-read" data-read></div>
        </div>
      </div>
      <div class="cp-foot" data-foot></div>`;

    /* Each stage gets its own scoped stylesheet and its own copy of the
       scene. Two live specimens, never a picture of one. */
    const styleA = document.createElement('style');
    const styleB = document.createElement('style');
    document.head.append(styleA, styleB);

    const sceneA = root.querySelector('[data-scene="a"]');
    const sceneB = root.querySelector('[data-scene="b"]');
    const baseStyle = document.createElement('style');
    document.head.appendChild(baseStyle);
    const scopeSceneCSS = (css) => css.replace(/(^|\})\s*([^{}]+)\{/g,
      (m, close, sel) => `${close} ${sel.split(',').map((s) => `#${id} .cp-scene ${s.trim()}`).join(', ')} {`);
    baseStyle.textContent = scopeSceneCSS(obj.css);

    sceneA.innerHTML = obj.html;
    sceneB.innerHTML = obj.html;
    sceneA.dataset.k = 'a';
    sceneB.dataset.k = 'b';

    const el = {
      objects: root.querySelector('[data-objects]'),
      moments: root.querySelector('[data-moments]'),
      blurb: root.querySelector('[data-blurb]'),
      words: root.querySelector('[data-words]'),
      durs: root.querySelector('[data-durs]'),
      curves: root.querySelector('[data-curves]'),
      code: root.querySelector('[data-code]'),
      check: root.querySelector('[data-check]'),
      read: root.querySelector('[data-read]'),
      sentence: root.querySelector('[data-sentence]'),
      beforeLab: root.querySelector('[data-beforelab]'),
      nowLab: root.querySelector('[data-nowlab]'),
      scrub: root.querySelector('[data-scrub]'),
      time: root.querySelector('[data-time]'),
      foot: root.querySelector('[data-foot]'),
    };

    /* --- edits ---------------------------------------------------------
       Every mutation goes through here, so "before" is captured exactly
       once per edit and can never drift out of step with what is on screen. */
    function edit(label, fn) {
      if (!held) {
        before = clone(state);
        beforeLabel = label;
      }
      fn();
      render();
      autoPlay();
    }

    const chipsAt = (m) => (state.chips[m] = state.chips[m] || []);
    const findChip = (m, w) => chipsAt(m).find((c) => c.word === w);

    function toggleWord(wid) {
      const m = state.moment;
      const word = C.wordsById[wid];
      const existing = findChip(m, wid);
      if (existing) {
        edit(`with ${word.verb}`, () => {
          state.chips[m] = chipsAt(m).filter((c) => c.word !== wid);
        });
      } else {
        if (blockedBy(wid)) return;
        const values = {};
        Object.entries(word.knobs || {}).forEach(([k, cfg]) => { values[k] = cfg.def; });
        edit(`without ${word.verb}`, () => {
          const tid = (obj.wordTarget && obj.wordTarget[wid]) || obj.targets[0].id;
          chipsAt(m).push({ word: wid, target: tid, values });
        });
      }
    }

    /* A slot can only be claimed once. Two words fighting over `transform`'s
       translate channel is the one collision the emitter cannot resolve, so
       the picker refuses it in words instead of resolving it silently. */
    function blockedBy(wid) {
      const word = C.wordsById[wid];
      if (!word.slot) return null;
      const clash = chipsAt(state.moment).find((c) => {
        const w = C.wordsById[c.word];
        return w && w.id !== wid && w.slot === word.slot;
      });
      return clash ? C.wordsById[clash.word] : null;
    }

    /* --- rendering ------------------------------------------------------ */

    function renderObjects() {
      if (C.objects.length < 2) { el.objects.remove(); return; }
      el.objects.innerHTML = C.objects.map((o) =>
        `<button type="button" data-o="${o.id}" aria-pressed="${o.id === obj.id}">${esc(o.noun)}</button>`).join('');
    }

    /* Switching object is a reset, not an edit: nothing about a button's
       composition means anything on a drawer, so there is no state to carry
       across and no honest Before to compare against. */
    function setObject(oid) {
      const next = C.objects.find((o) => o.id === oid);
      if (!next || next === obj) return;
      stop();
      obj = next;
      restId = restMomentOf(obj).id;
      lastReal = obj.moments.find((m) => !m.rest).id;
      baseStyle.textContent = scopeSceneCSS(obj.css);
      sceneA.innerHTML = obj.html;
      sceneB.innerHTML = obj.html;
      state = freshState();
      before = clone(state);
      beforeLabel = 'the same thing';
      held = false;
      const holdBtn = root.querySelector('[data-act="hold"]');
      if (holdBtn) { holdBtn.setAttribute('aria-pressed', 'false'); holdBtn.textContent = 'Hold this'; }
      render();
      autoPlay();
    }

    function renderMoments() {
      el.moments.innerHTML = obj.moments.map((m) =>
        `<button type="button" data-m="${m.id}" aria-pressed="${m.id === state.moment}">${esc(m.label)}</button>`).join('');
      const m = obj.moments.find((x) => x.id === state.moment);
      el.blurb.textContent = m.blurb;
    }

    function renderWords() {
      const m = state.moment;
      /* The resting moment takes no words on purpose. What comes back is
         whatever went out; the only thing it owns is how long that takes. */
      if (m === restId) {
        el.words.innerHTML = `<p class="cp-restnote">No words here — this is the way back. It
          reverses whatever the other moments did, so the only thing it owns is the duration and
          curve below, and those are a separate pair from the ones it left on.</p>`;
        return;
      }
      el.words.innerHTML = (obj.offers[m] || []).map((wid) => {
        const w = C.wordsById[wid];
        const chip = findChip(m, wid);
        const blocked = !chip && blockedBy(wid);
        const knobs = chip ? Object.entries(w.knobs || {}).map(([k, cfg]) => `
          <div class="cp-knob">
            <span style="min-width:3.1rem">${esc(cfg.label)}</span>
            <input type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}"
                   value="${chip.values[k]}" data-w="${wid}" data-k="${k}"
                   aria-label="${esc(w.verb)} ${esc(cfg.label)}">
            <output>${chip.values[k]}${esc(cfg.unit)}</output>
          </div>`).join('') : '';
        const targetSel = chip && obj.targets.length > 1 ? `
          <div class="cp-knob">
            <span style="min-width:3.1rem">on</span>
            <select class="cp-tsel" data-t="${wid}" aria-label="${esc(w.verb)} target">
              ${obj.targets.map((t) => `<option value="${t.id}"${t.id === chip.target ? ' selected' : ''}>${esc(t.label)}</option>`).join('')}
            </select>
          </div>` : '';
        return `<div class="cp-word${chip ? ' is-on' : ''}${blocked ? ' is-blocked' : ''}">
            <button type="button" class="cp-wtop" data-word="${wid}"
                    aria-pressed="${!!chip}"${blocked ? ` title="${esc(blocked.verb)} already has that channel"` : ''}>
              <span class="cp-mark" aria-hidden="true">${chip ? '&check;' : ''}</span>
              <span>${esc(w.verb)}</span>
              <span class="cp-wgloss">${blocked ? `${esc(blocked.verb)} has it` : esc(w.gloss)}</span>
            </button>
            ${chip ? `<div class="cp-knobs">${targetSel}${knobs}</div>` : ''}
          </div>`;
      }).join('');
    }

    function renderValues() {
      const t = T(state);
      el.durs.innerHTML = C.durations.map((d) =>
        `<button type="button" data-dur="${d.id}" aria-pressed="${d.id === t.dur.preset}">${esc(d.label)}</button>`).join('');
      el.curves.innerHTML = C.curves.map((c) =>
        `<button type="button" data-curve="${c.id}" aria-pressed="${c.id === t.curve.preset}">${esc(c.label)}</button>`).join('');
    }

    /* The code is generated, and every value in it is editable in place and
       bound back to the same state the chips write. Typing an exact
       cubic-bezier() here is the point: the chips are the named, coarse path
       and this is the precise one. */
    function renderCode() {
      const built = build(obj, state);
      const rules = toCSS(obj, state, built);
      if (!rules.length) {
        el.code.innerHTML = `<span class="c">/* no words yet — turn one on */</span>`;
        return;
      }
      /* Each timing value is bound to the moment whose rule it is printed in,
         so typing 120ms into the closing rule does not also change the open. */
      const tSpan = (kind, mid, text) =>
        `<span class="cp-v" contenteditable="true" data-bind="${kind}:${mid}" spellcheck="false">${esc(text)}</span>`;

      el.code.innerHTML = rules.map((r) => {
        const body = Object.entries(r.decls).map(([p, v]) => {
          if (p === 'transition-duration') return `  <span class="k">${p}</span>: ${tSpan('dur', r.moment, v)};`;
          if (p === 'transition-timing-function') return `  <span class="k">${p}</span>: ${tSpan('curve', r.moment, v)};`;
          const chip = findChipForDecl(built, r, p);
          const val = chip ? valueSpan(chip, p, v) : esc(v);
          return `  <span class="k">${esc(p)}</span>: ${val};`;
        }).join('\n');
        const live = r.moment === state.moment || r.moment === restId;
        return `<span class="cp-rule${live ? ' is-live' : ''}" data-rm="${r.moment}">`
             + `<span class="s">${esc(r.sel)}</span> {\n${body}\n}\n</span>`;
      }).join('\n');
    }

    /* Which chip produced a declaration, so its number can be edited from
       inside the code as well as from its slider. One value, two editors.

       The end matters. A word that parks something off screen writes its
       interesting number on the *resting* rule — `translateX(100%)` is the
       knob, and the `0` on the open rule is a constant. Offering the constant
       as the editable one and the real value as fixed text is exactly
       backwards, so the search asks which end it is looking at, and then asks
       whether the knob actually moves that number. */
    function findChipForDecl(built, line, prop) {
      const end = line.end || 'moment';
      for (const b of built) {
        if (end === 'moment' && b.moment.id !== line.moment) continue;
        for (const g of b.groups) {
          if (g.target.id !== line.tid) continue;
          for (const c of g.chips) {
            const w = C.wordsById[c.word];
            if (knobMoves(w, c.values || {}, end, prop)) {
              return { chip: c, word: w, moment: end === 'rest' ? line.moment : b.moment.id, end };
            }
          }
        }
      }
      return null;
    }

    /* Does this word's first knob change this property at this end? Asked by
       emitting twice rather than by describing it in the catalogue, so a new
       word gets the right answer without declaring anything extra. */
    function knobMoves(word, values, end, prop) {
      const keys = Object.keys(word.knobs || {});
      if (!keys.length) return false;
      const at = (v) => {
        const out = word.emit(v) || {};
        const decls = { ...((end === 'rest' ? out.rest : out.decls) || {}) };
        const fns = (end === 'rest' ? out.restFns : out.fns) || {};
        const parts = SLOT_ORDER.filter((sl) => fns[sl]).map((sl) => fns[sl]);
        if (parts.length) decls.transform = parts.join(' ');
        return decls[prop];
      };
      const cfg = word.knobs[keys[0]];
      const bumped = { ...values, [keys[0]]: Number(values[keys[0]]) + (cfg.step || 1) };
      const a = at(values);
      return a !== undefined && a !== at(bumped);
    }

    function valueSpan({ chip, word, moment, end }, prop, v) {
      const keys = Object.keys(word.knobs || {});
      if (!keys.length) return esc(v);
      const k = keys[0];
      /* A chip lives on the moment it was switched on at, never on the resting
         one — so a value edited from inside the resting rule is bound back to
         the moment that put it there. */
      const home = end === 'rest' ? chipHome(chip) : moment;
      const bind = `chip:${home}:${chip.word}:${k}`;
      return `<span class="cp-v" contenteditable="true" data-bind="${bind}" spellcheck="false">${esc(v)}</span>`;
    }

    const chipHome = (chip) => Object.keys(state.chips)
      .find((m) => (state.chips[m] || []).includes(chip)) || state.moment;

    function renderReadout() {
      const built = build(obj, state);
      const props = propsUsed(built);
      const movers = new Set();
      let worst = 'compositor';
      built.forEach((b) => b.groups.forEach((g) => {
        movers.add(`${b.moment.id}:${g.target.id}`);
        g.chips.forEach((c) => {
          const w = C.wordsById[c.word];
          if (w && C.tier[w.cost] > C.tier[worst]) worst = w.cost;
        });
      }));
      const cells = [
        ['duration', `${T(state).dur.ms}ms`],
        ['properties', String(props.length)],
        ['moments used', String(built.length)],
        ['tier', props.length ? worst : '—'],
      ];
      el.read.innerHTML = cells.map(([k, v]) =>
        `<div class="cp-cell"><b>${esc(v)}</b>${esc(k)}</div>`).join('');

      const bad = invalidDecls(built, state);
      el.check.className = `cp-check${bad.length ? ' is-bad' : ''}`;
      el.check.innerHTML = bad.length
        ? `The browser dropped ${bad.length === 1 ? 'this' : 'these'}: ${bad.map(esc).join(', ')}. The stage is running the last thing that parsed.`
        : 'Everything above parsed. Click any value to type your own.';
    }

    function renderSentence() {
      const m = obj.moments.find((x) => x.id === state.moment);
      const chips = chipsAt(state.moment);
      const byTarget = {};
      chips.forEach((c) => { (byTarget[c.target] = byTarget[c.target] || []).push(C.wordsById[c.word].verb); });
      const clauses = Object.entries(byTarget).map(([t, verbs]) => {
        const tl = obj.targets.find((x) => x.id === t).label;
        return `${tl} <i>${verbs.map(esc).join('</i> and <i>')}</i>`;
      });
      el.sentence.innerHTML = clauses.length
        ? `<b>${esc(obj.noun)}</b> · at <b>${esc(m.label.toLowerCase())}</b> · ${clauses.join(', ')} · <b>${T(state).dur.ms}ms</b>`
        : state.moment === restId
          ? `<b>${esc(obj.noun)}</b> · <b>${esc(m.label.toLowerCase())}</b> · back the way it came · <b>${T(state).dur.ms}ms</b>`
          : `<b>${esc(obj.noun)}</b> · at <b>${esc(m.label.toLowerCase())}</b> · nothing happens`;
    }

    function shortDesc(s) {
      const spec = playSpec(s);
      const chips = (s.chips[spec.momentId] || []).map((c) => C.wordsById[c.word].verb);
      const back = spec.reverse ? ' back' : '';
      return `${chips.length ? chips.join(' + ') : 'nothing'}${back} · ${spec.timing.dur.ms}ms`;
    }

    function applyStyles() {
      const builtNow = build(obj, state);
      const builtBefore = build(obj, before);
      styleB.textContent = toScopedCSS(obj, state, builtNow, `#${id} [data-scene="b"]`);
      styleA.textContent = toScopedCSS(obj, before, builtBefore, `#${id} [data-scene="a"]`);
      el.beforeLab.textContent = shortDesc(before);
      el.nowLab.textContent = shortDesc(state);
      el.foot.textContent = held
        ? 'Held. The upper stage stays put until you release it.'
        : `Upper stage is one edit back — ${beforeLabel}.`;
    }

    function render() {
      renderObjects();
      renderMoments();
      renderWords();
      renderValues();
      renderCode();
      renderReadout();
      renderSentence();
      applyStyles();
    }

    /* --- playback -------------------------------------------------------
       WAAPI rather than the transitions the code panel prints, because a
       transition cannot be scrubbed and "what does the middle look like" is
       half of what she asked for. Same declarations, from the same emit(). */
    /* What the stage should actually play for a given composition. The
       resting moment holds no words of its own — it is the return trip, so it
       replays the last real moment backwards, on its own timing. That is not a
       trick: it is what the resting rule does in the CSS too. */
    function playSpec(s) {
      const reverse = s.moment === restId;
      const momentId = reverse ? lastReal : s.moment;
      return { momentId, reverse, timing: s.timing[s.moment] };
    }

    function framesFor(o, s, spec, scene) {
      const built = build(o, s).filter((b) => b.moment.id === spec.momentId);
      const out = [];
      built.forEach((b) => b.groups.forEach((g) => {
        const node = scene.querySelector(g.target.tpl.replace('{}', ''));
        if (!node) return;
        const from = {}; const to = {};
        Object.entries(g.decls).forEach(([p, v]) => {
          const key = camel(p);
          /* A word that wrote the resting rule already said where it starts.
             Only fall back to REST or the computed value when it didn't. */
          const restV = g.rest[p];
          from[key] = restV !== undefined ? resolveVars(restV, document.documentElement)
            : p === 'background-color'
              ? getComputedStyle(node).backgroundColor
              : (REST[p] !== undefined ? REST[p] : getComputedStyle(node)[key]);
          to[key] = resolveVars(v, document.documentElement);
        });
        out.push(spec.reverse ? { node, from: to, to: from } : { node, from, to });
      }));
      return out;
    }

    function stop() {
      anims.forEach((a) => a.cancel());
      anims = [];
    }

    function play(fromScrub) {
      stop();
      const specN = playSpec(state);
      const specB = playSpec(before);
      const dur = Math.max(1, specN.timing.dur.ms);
      const durB = Math.max(1, specB.timing.dur.ms);
      const span = Math.max(dur, durB);
      const pairs = [
        ...framesFor(obj, before, specB, sceneA).map((f) => ({ ...f, d: durB, e: specB.timing.curve.css })),
        ...framesFor(obj, state, specN, sceneB).map((f) => ({ ...f, d: dur, e: specN.timing.curve.css })),
      ];
      anims = pairs.map(({ node, from, to, d, e }) => {
        const a = node.animate([from, to], {
          duration: d, easing: CSS.supports('transition-timing-function', e) ? e : 'linear',
          fill: 'both',
        });
        a.playbackRate = rate;
        return a;
      });
      if (fromScrub) {
        anims.forEach((a) => a.pause());
        return span;
      }
      el.scrub.value = 1000;
      el.time.textContent = `${span}ms`;
      if (loop) {
        anims.forEach((a) => { a.onfinish = null; });
        clearTimeout(play._t);
        play._t = setTimeout(() => { if (loop) play(); }, (span / rate) + 700);
      }
      return span;
    }

    /* Absolute time, not a fraction of each stage's own duration. Scrubbing by
       fraction would make a 400ms and a 120ms version look identical all the
       way down, which hides the one difference the comparison exists to show. */
    function scrubTo(pct) {
      const span = Math.max(playSpec(state).timing.dur.ms, playSpec(before).timing.dur.ms);
      const t = (pct / 1000) * span;
      if (!anims.length) play(true);
      anims.forEach((a) => { a.pause(); a.currentTime = Math.min(t, a.effect.getTiming().duration); });
      el.time.textContent = `${Math.round(t)}ms / ${span}ms`;
    }

    /* --- events --------------------------------------------------------- */

    root.addEventListener('click', (e) => {
      const o = e.target.closest('[data-o]');
      if (o) { setObject(o.dataset.o); return; }

      const m = e.target.closest('[data-m]');
      if (m) {
        state.moment = m.dataset.m;
        /* Before follows the moment. It is a comparison of two compositions,
           not of two moments — leaving it behind would show a difference she
           did not make. */
        before.moment = state.moment;
        if (state.moment !== restId) lastReal = state.moment;
        render(); autoPlay();
        const rule = el.code.querySelector(`[data-rm="${state.moment}"]`);
        if (rule) el.code.scrollTop = Math.max(0, rule.offsetTop - el.code.offsetTop - 8);
        return;
      }

      const w = e.target.closest('[data-word]');
      if (w) { toggleWord(w.dataset.word); return; }

      const d = e.target.closest('[data-dur]');
      if (d) {
        const p = durOf(d.dataset.dur);
        edit(`${T(state).dur.ms}ms`, () => { T(state).dur = { preset: p.id, ms: p.ms }; });
        return;
      }
      const c = e.target.closest('[data-curve]');
      if (c) {
        const p = curveOf(c.dataset.curve);
        const was = curveOf(T(state).curve.preset);
        edit(was ? was.label : 'a custom curve',
          () => { T(state).curve = { preset: p.id, css: p.css }; });
        return;
      }

      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'play') { scrubbing = false; play(); }
      if (act.dataset.act === 'loop') {
        loop = !loop; act.setAttribute('aria-pressed', String(loop));
        if (loop) play(); else clearTimeout(play._t);
      }
      if (act.dataset.act === 'rate') {
        rate = rate === 1 ? 0.25 : 1;
        act.setAttribute('aria-pressed', String(rate !== 1));
        act.textContent = rate === 1 ? '0.25×' : '1×';
        play();
      }
      if (act.dataset.act === 'hold') {
        held = !held; act.setAttribute('aria-pressed', String(held));
        act.textContent = held ? 'Release' : 'Hold this';
        applyStyles();
      }
    });

    root.addEventListener('input', (e) => {
      const r = e.target.closest('[data-w]');
      if (r) {
        const { w: wid, k } = r.dataset;
        const chip = findChip(state.moment, wid);
        if (!chip) return;
        const label = `${C.wordsById[wid].verb} ${chip.values[k]}${C.wordsById[wid].knobs[k].unit}`;
        edit(label, () => { chip.values[k] = Number(r.value); });
        return;
      }
      const sc = e.target.closest('[data-scrub]');
      if (sc) { scrubbing = true; loop = false; scrubTo(Number(sc.value)); }
    });

    root.addEventListener('change', (e) => {
      const t = e.target.closest('[data-t]');
      if (!t) return;
      const chip = findChip(state.moment, t.dataset.t);
      if (!chip) return;
      const wasOn = obj.targets.find((x) => x.id === chip.target).label;
      edit(`on ${wasOn}`, () => { chip.target = t.value; });
    });

    /* Typing in the code. Enter commits, Escape reverts, blur commits — the
       three things a text field is expected to do. */
    el.code.addEventListener('keydown', (e) => {
      if (!e.target.closest('.cp-v')) return;
      if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); renderCode(); }
    });

    el.code.addEventListener('focusout', (e) => {
      const v = e.target.closest('.cp-v');
      if (!v) return;
      const raw = v.textContent.trim();
      const bind = v.dataset.bind;

      if (bind && bind.startsWith('dur:')) {
        const mid = bind.slice(4);
        const ms = parseFloat(raw);
        if (!(ms >= 0) || !state.timing[mid]) { v.classList.add('is-bad'); return; }
        edit(`${state.timing[mid].dur.ms}ms`,
          () => { state.timing[mid].dur = { preset: 'custom', ms: Math.round(ms) }; });
        return;
      }
      if (bind && bind.startsWith('curve:')) {
        const mid = bind.slice(6);
        if (!CSS.supports('transition-timing-function', raw) || !state.timing[mid]) {
          v.classList.add('is-bad'); return;
        }
        edit('a different curve',
          () => { state.timing[mid].curve = { preset: 'custom', css: raw }; });
        return;
      }
      if (bind && bind.startsWith('chip:')) {
        const [, moment, wid, key] = bind.split(':');
        const chip = (state.chips[moment] || []).find((c) => c.word === wid);
        const num = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
        if (!chip || Number.isNaN(num)) { v.classList.add('is-bad'); return; }
        const cfg = C.wordsById[wid].knobs[key];
        /* A typed value is allowed past the slider's range — the slider is a
           convenience, not the domain. It is clamped only to what the property
           can mean. */
        const next = cfg.unit === '%' ? Math.max(0, num) : num;
        edit(`${C.wordsById[wid].verb} ${chip.values[key]}${cfg.unit}`,
          () => { chip.values[key] = next; });
      }
    });

    /* Direct interaction wins. If she puts a pointer on a stage she is running
       the real CSS transitions, so the scrubbed WAAPI state has to get out of
       the way rather than sit on top of it holding a paused frame. */
    [sceneA, sceneB].forEach((s) => s.addEventListener('pointerenter', () => {
      if (anims.length) { stop(); el.scrub.value = 1000; el.time.textContent = ''; }
    }));

    /* Some objects have no pseudo-class to hold. A drawer is open or it is
       not, so the stage needs a real switch — and clicking it runs the actual
       CSS transitions, which is the point of having one. */
    [sceneA, sceneB].forEach((s) => s.addEventListener('click', (e) => {
      if (!obj.toggle) return;
      if (!e.target.closest(obj.toggle.on)) return;
      const host = s.querySelector(obj.toggle.host);
      if (!host) return;
      stop();
      el.scrub.value = 1000;
      el.time.textContent = '';
      host.classList.toggle(obj.toggle.cls);
    }));

    /* A resolved var() copy goes stale the moment the theme flips. */
    const obs = new MutationObserver(() => { if (anims.length) play(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    render();
    el.time.textContent = `${Math.max(playSpec(state).timing.dur.ms, playSpec(before).timing.dur.ms)}ms`;
  }

  function init() {
    if (!window.COMPOSE_CATALOGUE) return;
    injectStyles();
    document.querySelectorAll('[data-compose-lab]').forEach(mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
