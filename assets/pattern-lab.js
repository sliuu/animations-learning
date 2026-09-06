/* ============================================================
   pattern-lab.js — the catalogue. Twelve patterns you already
   recognise, each one named, each one breakable.

   Why this exists: lesson D001 is the vocabulary lesson, and a
   vocabulary lesson has an obvious failure mode — a table of
   words. "A comparison table is consolidation, never
   introduction" applies to principles as hard as it applies to
   numbers, so nothing here is a table. Every pattern is on
   screen, plays on demand, and has a switch that breaks the
   convention it depends on. You feel twelve things behaving
   correctly and three of them behaving wrongly before any of it
   is argued for in prose.

   The break is never a straw man: the broken version is a real
   thing real products ship. A modal that slides up from the
   bottom edge, a popover that grows from its own middle, a deck
   with no snap. They are all defensible in isolation, and all
   wrong for the reason the lesson gives.

   Reduced motion: this lab's *content* is motion, so taking it
   away would leave an empty page rather than a calmer one — the
   0009 distinction between decoration and information, applied
   honestly. Nothing here autoplays, nothing loops, and every
   frame is the result of a press. That is the accommodation.

   Usage:
     <div data-pattern-lab data-title="The catalogue"></div>
   ============================================================ */

(() => {
  let uid = 0;

  const FAMILIES = {
    ui: 'product ui',
    page: 'expressive page',
    hand: 'direct manipulation',
  };

  /* ---------- tiny tween helper ---------- */
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  /* Patterns marked `rest` settle in their finished state rather than snapping
     back to nothing — a hero with everything at opacity 0 reads as a broken
     cell, not as a hero waiting to be played.

     Which means a replay has to put them back to the start first, and removing
     .on is not enough to do that. The children carry an unconditional
     `transition`, so dropping the class *starts a reverse transition* rather
     than teleporting; re-adding it one statement later cancels that at roughly
     zero progress, and the press produces no visible motion at all. Killing
     transitions for the length of the reset is what turns the reset back into a
     jump. Two reflows: one to commit the reset while transitions are off, one
     to commit their return before .on changes anything. */
  function replay(stage, ms, done) {
    stage.classList.add('resetting');
    stage.classList.remove('on');
    void stage.offsetWidth;
    stage.classList.remove('resetting');
    void stage.offsetWidth;
    stage.classList.add('on');
    setTimeout(done, ms);
  }

  function tween(ms, ease, fn, done) {
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / ms);
      fn(ease(p), p);
      if (p < 1) requestAnimationFrame(step);
      else if (done) done();
    })(t0);
  }

  /* ============================================================
     The patterns.
       stage   — the scene's markup
       play    — runs it; receives (stage, broken, done)
       promise — what the correct version tells the user
       breaks  — what the broken version tells them instead
     ============================================================ */

  const PATTERNS = [

    /* ---------------- product ui ---------------- */
    {
      id: 'modal', family: 'ui', name: 'Modal', verbs: ['anchor', 'fade'],
      promise: 'Stop, and deal with this. It is new, so it has no edge to come from — it grows in place, in the middle, over a backdrop that dims what you were doing.',
      breaks: 'Sliding up from the bottom borrows a sheet’s meaning: it claims the dialog was parked just below the screen. It was not. Nothing was there.',
      stage: `
        <div class="pt-fill pt-doc"><i></i><i></i><i></i><i></i></div>
        <div class="pt-backdrop"></div>
        <div class="pt-dialog"><b>Delete project?</b><span>This cannot be undone.</span></div>`,
      play(s, broken, done) {
        s.classList.add('on');
        setTimeout(() => { s.classList.remove('on'); done(); }, 1700);
      },
    },
    {
      id: 'drawer', family: 'ui', name: 'Drawer', verbs: ['slide'],
      promise: 'It was always there, just off the side. It comes in from the edge it lives on and goes back to the same edge, so you always know where it went.',
      breaks: 'Fading in place gives it no home. It did not come from anywhere, so when it leaves you have no idea where it went or how to get it back.',
      stage: `
        <div class="pt-fill pt-doc"><i></i><i></i><i></i><i></i></div>
        <div class="pt-drawer"><b>Filters</b><i></i><i></i><i></i></div>`,
      play(s, broken, done) {
        s.classList.add('on');
        setTimeout(() => { s.classList.remove('on'); done(); }, 1700);
      },
    },
    {
      id: 'toast', family: 'ui', name: 'Toast', verbs: ['slide', 'peek'],
      promise: 'Something happened, you do not have to care. It arrives from the corner it will die in, stays out of the way, and leaves the way it came.',
      breaks: 'Centre screen is where you put things people must read. A toast that lands there is shouting a message it is about to throw away.',
      stage: `
        <div class="pt-fill pt-doc"><i></i><i></i><i></i><i></i></div>
        <div class="pt-toast">Saved to drafts</div>`,
      play(s, broken, done) {
        s.classList.add('on');
        setTimeout(() => { s.classList.remove('on'); done(); }, 1700);
      },
    },
    {
      id: 'popover', family: 'ui', name: 'Popover', verbs: ['anchor'],
      promise: 'This belongs to that button. It grows out of the control you pressed, so the connection between the thing you clicked and the thing that appeared never has to be explained.',
      breaks: 'Growing from its own centre cuts the thread. The panel is in the right place and still feels unrelated to the press that summoned it.',
      stage: `
        <div class="pt-fill pt-doc pt-doc-low"><i></i><i></i><i></i></div>
        <div class="pt-trigger">Share &#9662;</div>
        <div class="pt-pop"><i></i><i></i><i></i></div>`,
      play(s, broken, done) {
        s.classList.add('on');
        setTimeout(() => { s.classList.remove('on'); done(); }, 1700);
      },
    },

    /* ---------------- expressive page ---------------- */
    {
      id: 'hero', family: 'page', name: 'Hero sequence', verbs: ['stagger'],
      promise: 'Read me in this order. Offsetting the starts by a few frames turns four elements into one sentence with a beginning and an end.',
      breaks: 'All at once is not faster, it is flatter. Four things arriving together are four things competing, and the eye picks the winner rather than being led.',
      stage: `
        <div class="pt-hero">
          <span class="pt-eyebrow" style="--i:0">NEW</span>
          <b style="--i:1">Motion with intent</b>
          <b class="pt-h2" style="--i:2">not motion with easing</b>
          <span class="pt-cta" style="--i:3">Get started</span>
        </div>`,
      rest: true,
      play(s, broken, done) { replay(s, 1900, done); },
    },
    {
      id: 'lines', family: 'page', name: 'Line reveal', verbs: ['mask', 'split', 'stagger'],
      promise: 'Text that arrives as text. Each line is split off and wiped up from behind a mask, so it reads like a page turning rather than a page assembling.',
      breaks: 'Splitting body copy per character is the classic overreach. A hundred and nineteen things now animate where five would have done, and you cannot read a word of it while it happens.',
      stage: `
        <div class="pt-lines">
          <span class="pt-lw" style="--i:0"><span class="pt-li">A pattern you can name is</span></span>
          <span class="pt-lw" style="--i:1"><span class="pt-li">a pattern you can argue</span></span>
          <span class="pt-lw" style="--i:2"><span class="pt-li">about, and a pattern you</span></span>
          <span class="pt-lw" style="--i:3"><span class="pt-li">can argue about is one</span></span>
          <span class="pt-lw" style="--i:4"><span class="pt-li">you can choose to keep.</span></span>
        </div>
        <div class="pt-chars"></div>`,
      init(s) {
        const src = 'A pattern you can name is a pattern you can argue about, and a pattern you can argue about is one you can choose to keep.';
        const box = s.querySelector('.pt-chars');
        let i = 0;
        /* Split per character, but keep each word in an inline-block so the
           paragraph still wraps at its spaces. A per-character split that forgets
           this produces one unbreakable line running off the side of the page —
           which is a real failure mode of real split-text code, not an artifact
           of this demo. */
        box.innerHTML = src.split(' ').map((w) =>
          `<span class="pt-cw">${[...w].map((c) => `<span style="--i:${i++}">${c}</span>`).join('')}</span>`
        ).join(' ');
      },
      rest: true,
      play(s, broken, done) { replay(s, 2100, done); },
    },
    {
      id: 'pin', family: 'page', name: 'Pinned section', verbs: ['pin', 'scrub'],
      promise: 'One thing holds still while everything else moves past it. Pinning is how a page says "this is still the same chapter" without a heading that repeats.',
      breaks: 'Unpinned, the label leaves with the first card and the reader loses the thread. Six cards later there is nothing on screen saying what they are cards of.',
      stage: `
        <div class="pt-scroll">
          <div class="pt-pinned">Section 2 &mdash; Craft</div>
          <div class="pt-cards"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>`,
      play(s, broken, done) {
        const sc = s.querySelector('.pt-scroll');
        const max = sc.scrollHeight - sc.clientHeight;
        tween(1500, easeInOut, (p) => { sc.scrollTop = max * p; }, () => {
          setTimeout(() => tween(600, easeInOut, (p) => { sc.scrollTop = max * (1 - p); }, done), 500);
        });
      },
    },
    {
      id: 'parallax', family: 'page', name: 'Parallax', verbs: ['parallax', 'scrub'],
      promise: 'Depth, for free. Layers that move at different rates read as layers at different distances, which is the only cue a flat screen has for space.',
      breaks: 'One rate for every layer is a photograph of a diorama. All the elements are there and none of them are behind each other.',
      stage: `
        <div class="pt-px">
          <div class="pt-layer pt-sky" data-r="0.2"></div>
          <div class="pt-layer pt-hill" data-r="0.5"></div>
          <div class="pt-layer pt-card" data-r="1">Craft</div>
        </div>`,
      play(s, broken, done) {
        const layers = [...s.querySelectorAll('.pt-layer')];
        const set = (p) => layers.forEach((l) => {
          const r = broken ? 1 : Number(l.dataset.r);
          l.style.transform = `translateY(${-p * 46 * r}px)`;
        });
        tween(1400, easeInOut, set, () => {
          setTimeout(() => tween(600, easeInOut, (p) => set(1 - p), done), 450);
        });
      },
    },

    /* ---------------- direct manipulation ---------------- */
    {
      id: 'reorder', family: 'hand', name: 'Drag to reorder', verbs: ['lift', 'gap', 'settle'],
      promise: 'Four moments, in order: the row lifts toward you, a gap opens where it will land, it travels, it settles. Take any one away and the list stops feeling like objects.',
      breaks: 'With no lift and no gap the row teleports. Nothing was picked up, nothing made room, and you have to re-read the list to find out what you just did.',
      stage: `
        <div class="pt-list">
          <div class="pt-row" data-row="0">Draft the brief</div>
          <div class="pt-row" data-row="1">Pick a reference</div>
          <div class="pt-row" data-row="2">Storyboard it</div>
          <div class="pt-row" data-row="3">Ship</div>
        </div>`,
      play(s, broken, done) {
        const rows = [...s.querySelectorAll('.pt-row')];
        const H = 27;
        const reset = () => rows.forEach((r) => {
          r.classList.remove('lift', 'move');
          r.style.transform = '';
        });
        reset();
        if (broken) {
          rows[0].style.transition = 'none';
          rows[1].style.transition = 'none';
          rows[2].style.transition = 'none';
          rows[0].style.transform = `translateY(${H * 2}px)`;
          rows[1].style.transform = `translateY(${-H}px)`;
          rows[2].style.transform = `translateY(${-H}px)`;
          setTimeout(() => {
            rows.forEach((r) => { r.style.transition = ''; });
            reset(); done();
          }, 1500);
          return;
        }
        rows[0].classList.add('lift');
        setTimeout(() => {
          rows[0].classList.add('move');
          rows[0].style.transform = `translateY(${H * 2}px)`;
          rows[1].style.transform = `translateY(${-H}px)`;
          rows[2].style.transform = `translateY(${-H}px)`;
        }, 260);
        setTimeout(() => rows[0].classList.remove('lift'), 700);
        setTimeout(() => { reset(); done(); }, 1700);
      },
    },
    {
      id: 'deck', family: 'hand', name: 'Deck', verbs: ['snap', 'peek'],
      promise: 'Cards you page through. The sliver of the next card is the affordance — it says there is more this way — and the snap means you never end up parked between two of them.',
      breaks: 'Without snap the same flick leaves you halfway between two cards, looking at neither. Without peek there is nothing on screen saying another card exists.',
      stage: `
        <div class="pt-deck">
          <div class="pt-slide">01</div><div class="pt-slide">02</div>
          <div class="pt-slide">03</div><div class="pt-slide">04</div>
        </div>
        <div class="pt-dots"><i class="on"></i><i></i><i></i><i></i></div>`,
      play(s, broken, done) {
        const deck = s.querySelector('.pt-deck');
        const slide = deck.querySelector('.pt-slide');
        const step = slide.getBoundingClientRect().width + 8;
        /* The same flick either way. Snap decides where it lands. */
        deck.scrollBy({ left: step * 0.78, behavior: 'smooth' });
        setTimeout(() => {
          const i = Math.round(deck.scrollLeft / step);
          s.querySelectorAll('.pt-dots i').forEach((d, n) => d.classList.toggle('on', n === i));
        }, 500);
        setTimeout(() => {
          deck.scrollTo({ left: 0, behavior: 'smooth' });
          s.querySelectorAll('.pt-dots i').forEach((d, n) => d.classList.toggle('on', n === 0));
          done();
        }, 1500);
      },
    },
    {
      id: 'swipe', family: 'hand', name: 'Swipe to dismiss', verbs: ['fling', 'snap-back', 'rubber-band'],
      promise: 'The card is under your finger, one to one. Let go short of the threshold and it snaps back — which is the whole promise: you can start this gesture and change your mind.',
      breaks: 'A fixed slide on any movement takes the decision away. There is no threshold, so there is no changing your mind, and a brush past the screen deletes a message.',
      stage: `
        <div class="pt-behind">Archive</div>
        <div class="pt-card2"><b>Marcus Chen</b><span>Re: the timing on the hero&hellip;</span></div>`,
      play(s, broken, done) {
        const card = s.querySelector('.pt-card2');
        const w = s.getBoundingClientRect().width;
        const d = w * 0.3;                    /* a third of the way: short of the threshold */
        card.style.transition = 'none';
        tween(340, easeOut, (p) => { card.style.transform = `translateX(${-d * p}px)`; }, () => {
          card.style.transition = '';
          if (broken) {
            card.classList.add('gone');       /* no threshold: any drag dismisses */
            setTimeout(() => {
              card.classList.remove('gone');
              card.style.transition = 'none';
              card.style.transform = '';
              requestAnimationFrame(() => { card.style.transition = ''; done(); });
            }, 1300);
          } else {
            card.style.transform = '';        /* snap-back */
            setTimeout(done, 900);
          }
        });
      },
      drag: true,
    },
    {
      id: 'pull', family: 'hand', name: 'Pull to refresh', verbs: ['rubber-band', 'settle'],
      promise: 'Resistance is information. The further you pull the harder it gets, which tells your hand there is an end to this without a message telling your eyes.',
      breaks: 'One to one until it hits a wall. The gesture goes from free to impossible in a single frame, and the only way to learn the limit is to slam into it.',
      stage: `
        <div class="pt-spin">&#8635;</div>
        <div class="pt-sheet"><i></i><i></i><i></i><i></i></div>`,
      play(s, broken, done) {
        const sheet = s.querySelector('.pt-sheet');
        const spin = s.querySelector('.pt-spin');
        const MAX = 46;
        const map = (d) => (broken ? Math.min(d, MAX) : MAX * (1 - Math.exp(-d / MAX)));
        const go = (p) => {
          const y = map(150 * p);
          sheet.style.transform = `translateY(${y}px)`;
          spin.style.opacity = Math.min(1, y / MAX);
          spin.style.transform = `rotate(${y * 6}deg)`;
        };
        sheet.style.transition = 'none';
        tween(900, easeOut, go, () => {
          sheet.style.transition = '';
          sheet.style.transform = '';
          spin.style.opacity = '';
          setTimeout(done, 700);
        });
      },
    },
  ];

  /* ============================================================ */

  const STYLES = `
    .pt { margin: 1.75rem 0; border: 1px solid var(--rule); border-radius: 8px;
      background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .pt { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .pt-head { display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
    .pt-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }

    .pt-bar { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
      padding: 0.7rem 0.85rem; border-bottom: 1px solid var(--rule); }
    .pt-seg { display: flex; border: 1px solid var(--rule); border-radius: 6px;
      overflow: hidden; background: var(--paper); }
    .pt-seg button { font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
      padding: 0.4rem 0.7rem; border: 0; border-right: 1px solid var(--rule);
      background: transparent; color: var(--ink-soft); cursor: pointer; }
    .pt-seg button:last-child { border-right: 0; }
    .pt-seg button[aria-pressed="true"] { background: var(--accent); color: var(--paper); }
    .pt-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .pt-count { font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint);
      margin-left: auto; }

    .pt-grid { display: grid; gap: 0.75rem; padding: 0.85rem;
      grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); }

    .pt-cell { display: grid; grid-template-rows: auto 1fr auto;
      border: 1px solid var(--rule); border-radius: 7px; background: var(--paper);
      overflow: hidden; }
    .pt-cell[hidden] { display: none; }

    /* ---- the scene ---- */
    .pt-stage { position: relative; height: 134px; overflow: hidden;
      background: var(--paper-sunk); border-bottom: 1px solid var(--rule);
      contain: paint; }
    .pt-fill { position: absolute; inset: 0; }
    .pt-doc { padding: 0.8rem 0.9rem; display: grid; align-content: start; gap: 0.42rem; }
    .pt-doc i { display: block; height: 6px; border-radius: 3px;
      background: color-mix(in srgb, var(--ink) 11%, transparent); }
    .pt-doc i:nth-child(2) { width: 78%; }
    .pt-doc i:nth-child(4) { width: 54%; }
    .pt-doc-low { padding-top: 3.4rem; }

    /* modal */
    .pt-backdrop { position: absolute; inset: 0; opacity: 0;
      background: color-mix(in srgb, var(--ink) 42%, transparent);
      transition: opacity 170ms var(--ease-out-strong); }
    .pt-stage.on .pt-backdrop { opacity: 1; }
    .pt-dialog { position: absolute; left: 50%; top: 50%; width: 74%;
      display: grid; gap: 0.2rem; padding: 0.7rem 0.75rem;
      background: var(--paper); border-radius: 7px;
      box-shadow: 0 8px 24px -6px color-mix(in srgb, var(--ink) 40%, transparent);
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-soft);
      transform: translate(-50%, -50%) scale(0.9); opacity: 0;
      transition: transform 230ms var(--ease-out-strong), opacity 150ms linear; }
    .pt-dialog b { font-size: 0.76rem; color: var(--ink); }
    .pt-stage.on .pt-dialog { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    .pt-cell.broken .pt-dialog { transform: translate(-50%, 320%) scale(1); opacity: 1; }
    .pt-cell.broken .pt-stage.on .pt-dialog { transform: translate(-50%, -50%) scale(1); }

    /* drawer */
    .pt-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 56%;
      display: grid; align-content: start; gap: 0.45rem; padding: 0.75rem 0.7rem;
      background: var(--paper); border-left: 1px solid var(--rule);
      box-shadow: -8px 0 20px -10px color-mix(in srgb, var(--ink) 40%, transparent);
      font-family: var(--sans); font-size: 0.72rem; color: var(--ink);
      transform: translateX(100%);
      transition: transform 280ms var(--ease-drawer), opacity 200ms linear; }
    .pt-drawer i { display: block; height: 6px; border-radius: 3px;
      background: color-mix(in srgb, var(--ink) 11%, transparent); }
    .pt-stage.on .pt-drawer { transform: translateX(0); }
    .pt-cell.broken .pt-drawer { transform: none; opacity: 0; }
    .pt-cell.broken .pt-stage.on .pt-drawer { opacity: 1; }

    /* toast */
    .pt-toast { position: absolute; right: 0.6rem; bottom: 0.6rem;
      padding: 0.45rem 0.7rem; border-radius: 6px;
      background: var(--ink); color: var(--paper);
      font-family: var(--sans); font-size: 0.7rem;
      transform: translateY(180%); opacity: 0;
      transition: transform 240ms var(--ease-out-strong), opacity 160ms linear; }
    .pt-stage.on .pt-toast { transform: translateY(0); opacity: 1; }
    .pt-cell.broken .pt-toast { right: 50%; bottom: 50%;
      transform: translate(50%, 50%) scale(0.9); }
    .pt-cell.broken .pt-stage.on .pt-toast { transform: translate(50%, 50%) scale(1); opacity: 1; }

    /* popover */
    .pt-trigger { position: absolute; left: 0.7rem; top: 0.7rem;
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      padding: 0.35rem 0.6rem; border: 1px solid var(--rule); border-radius: 6px;
      background: var(--paper); color: var(--ink-soft); }
    .pt-pop { position: absolute; left: 0.7rem; top: 2.6rem; width: 62%;
      display: grid; gap: 0.42rem; padding: 0.6rem;
      background: var(--paper); border: 1px solid var(--rule); border-radius: 7px;
      box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--ink) 35%, transparent);
      transform-origin: 12% 0; transform: scale(0.8); opacity: 0;
      transition: transform 200ms var(--ease-out-strong), opacity 140ms linear; }
    .pt-pop i { display: block; height: 6px; border-radius: 3px;
      background: color-mix(in srgb, var(--ink) 11%, transparent); }
    .pt-pop i:nth-child(2) { width: 70%; }
    .pt-stage.on .pt-pop { transform: scale(1); opacity: 1; }
    .pt-cell.broken .pt-pop { transform-origin: 50% 50%; }

    /* Applied only for the two reflows inside replay(), so that clearing the
       finished state is a jump rather than a 380ms reverse animation. */
    .pt-stage.resetting, .pt-stage.resetting * { transition: none !important; }

    /* hero */
    .pt-hero { position: absolute; inset: 0; display: grid; align-content: center;
      justify-items: start; gap: 0.3rem; padding: 0 1rem;
      font-family: var(--sans); }
    .pt-hero > * { opacity: 0; transform: translateY(9px);
      transition: opacity 380ms var(--ease-out-strong), transform 380ms var(--ease-out-strong);
      transition-delay: calc(var(--i) * 80ms); }
    .pt-stage.on .pt-hero > * { opacity: 1; transform: none; }
    .pt-cell.broken .pt-hero > * { transition-delay: 0ms; }
    .pt-eyebrow { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em;
      color: var(--accent); }
    .pt-hero b { font-size: 0.95rem; font-weight: 650; color: var(--ink); }
    .pt-hero .pt-h2 { color: var(--ink-faint); }
    .pt-cta { margin-top: 0.25rem; font-size: 0.68rem; font-weight: 600;
      padding: 0.35rem 0.65rem; border-radius: 999px;
      background: var(--accent); color: var(--paper); }

    /* line reveal */
    .pt-lines, .pt-chars { position: absolute; inset: 0;
      display: grid; align-content: center; padding: 0 1rem;
      font-family: var(--serif); font-size: 0.86rem; line-height: 1.18; color: var(--ink); }
    .pt-chars { display: block; align-content: center; padding-top: 1.9rem; }
    .pt-lw { display: block; overflow: hidden; }
    .pt-li { display: block; transform: translateY(112%);
      transition: transform 520ms var(--ease-out-strong);
      transition-delay: calc(var(--i) * 95ms); }
    .pt-stage.on .pt-li { transform: none; }
    .pt-chars { visibility: hidden; }
    .pt-chars .pt-cw { display: inline-block; }
    .pt-chars .pt-cw > span { opacity: 0; transition: opacity 240ms linear;
      transition-delay: calc(var(--i) * 14ms); }
    .pt-stage.on .pt-chars .pt-cw > span { opacity: 1; }
    .pt-cell.broken .pt-lines { visibility: hidden; }
    .pt-cell.broken .pt-chars { visibility: visible; }

    /* pinned */
    .pt-scroll { position: absolute; inset: 0; overflow: hidden auto;
      scrollbar-width: none; }
    .pt-scroll::-webkit-scrollbar { display: none; }
    .pt-pinned { position: sticky; top: 0; z-index: 2;
      padding: 0.4rem 0.7rem; background: var(--paper-sunk);
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
    .pt-cell.broken .pt-pinned { position: static; }
    .pt-cards { display: grid; gap: 0.4rem; padding: 0.5rem 0.7rem; }
    .pt-cards i { display: block; height: 34px; border-radius: 5px;
      background: color-mix(in srgb, var(--ink) 9%, transparent); }

    /* parallax */
    .pt-px { position: absolute; inset: 0; overflow: hidden; }
    .pt-layer { position: absolute; left: 0; right: 0; will-change: transform; }
    .pt-sky { top: 0; height: 74px;
      background: linear-gradient(var(--accent-soft), transparent); }
    .pt-hill { top: 52px; height: 60px; border-radius: 50% 50% 0 0;
      background: color-mix(in srgb, var(--accent) 26%, var(--paper-sunk)); }
    .pt-card { top: 78px; margin: 0 auto; width: 62%; left: 19%; right: 19%;
      padding: 0.5rem; border-radius: 6px; text-align: center;
      background: var(--paper); border: 1px solid var(--rule);
      box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--ink) 40%, transparent);
      font-family: var(--sans); font-size: 0.72rem; font-weight: 650; color: var(--ink); }

    /* reorder */
    .pt-list { position: absolute; inset: 0; padding: 0.6rem 0.7rem;
      display: grid; align-content: start; gap: 4px; }
    .pt-row { height: 23px; display: flex; align-items: center; padding: 0 0.55rem;
      border: 1px solid var(--rule); border-radius: 5px; background: var(--paper);
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-soft);
      transition: transform 340ms cubic-bezier(0.34, 1.24, 0.64, 1),
                  box-shadow 150ms var(--ease-out-strong),
                  scale 150ms var(--ease-out-strong); }
    .pt-row.lift { scale: 1.035; z-index: 3; color: var(--ink);
      box-shadow: 0 7px 16px -6px color-mix(in srgb, var(--ink) 45%, transparent); }

    /* deck */
    .pt-deck { position: absolute; left: 0; right: 0; top: 0.7rem;
      display: flex; gap: 8px; padding: 0 0.7rem;
      overflow-x: auto; scrollbar-width: none;
      scroll-snap-type: x mandatory; }
    .pt-deck::-webkit-scrollbar { display: none; }
    .pt-slide { flex: 0 0 76%; height: 76px; scroll-snap-align: center;
      display: grid; place-items: center; border-radius: 7px;
      background: color-mix(in srgb, var(--accent) 12%, var(--paper));
      border: 1px solid var(--rule);
      font-family: var(--mono); font-size: 0.9rem; color: var(--accent); }
    .pt-dots { position: absolute; left: 0; right: 0; bottom: 0.8rem;
      display: flex; justify-content: center; gap: 5px; }
    .pt-dots i { width: 5px; height: 5px; border-radius: 50%;
      background: color-mix(in srgb, var(--ink) 20%, transparent);
      transition: background-color 200ms var(--ease-out-strong); }
    .pt-dots i.on { background: var(--accent); }
    .pt-cell.broken .pt-slide { flex-basis: calc(100% - 1.4rem); }
    .pt-cell.broken .pt-deck { scroll-snap-type: none; }
    .pt-cell.broken .pt-dots { visibility: hidden; }

    /* swipe */
    .pt-behind { position: absolute; inset: 0.7rem; border-radius: 6px;
      display: flex; align-items: center; justify-content: flex-end;
      padding-right: 0.8rem; background: var(--bad); color: var(--paper);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600; }
    .pt-card2 { position: absolute; inset: 0.7rem; border-radius: 6px;
      display: grid; align-content: center; gap: 0.15rem; padding: 0 0.8rem;
      background: var(--paper); border: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-faint);
      touch-action: pan-y; cursor: grab;
      transition: transform 260ms var(--ease-out-strong); }
    .pt-card2 b { font-size: 0.76rem; color: var(--ink); }
    .pt-card2.gone { transform: translateX(-110%); transition-duration: 400ms; }
    .pt-card2.grabbing { cursor: grabbing; transition: none; }

    /* pull to refresh */
    .pt-spin { position: absolute; left: 0; right: 0; top: 0.5rem; text-align: center;
      font-size: 0.9rem; color: var(--accent); opacity: 0; }
    .pt-sheet { position: absolute; inset: 0; padding: 0.7rem;
      display: grid; align-content: start; gap: 0.42rem;
      background: var(--paper); border-top: 1px solid var(--rule);
      transition: transform 420ms cubic-bezier(0.34, 1.2, 0.64, 1); }
    .pt-sheet i { display: block; height: 7px; border-radius: 3px;
      background: color-mix(in srgb, var(--ink) 11%, transparent); }
    .pt-sheet i:nth-child(2) { width: 72%; }
    .pt-sheet i:nth-child(4) { width: 48%; }

    /* ---- the label under each scene ---- */
    .pt-meta { padding: 0.6rem 0.7rem 0.5rem; display: grid; gap: 0.3rem;
      align-content: start; }
    .pt-name { font-family: var(--sans); font-size: 0.85rem;
      font-weight: 650; color: var(--ink); line-height: 1.2; }
    .pt-fam { font-family: var(--sans); font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-faint); }
    .pt-cell.broken .pt-fam { color: var(--bad); }
    .pt-promise { font-family: var(--sans); font-size: 0.73rem; line-height: 1.45;
      color: var(--ink-soft); margin: 0; }
    .pt-cell.broken .pt-promise { color: var(--bad); }
    .pt-verbs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .pt-verb { font-family: var(--mono); font-size: 0.62rem; color: var(--ink-soft);
      background: var(--code-bg); border: 1px solid var(--rule);
      border-radius: 999px; padding: 0.1rem 0.42rem; }

    .pt-foot { display: flex; align-items: center; gap: 0.6rem;
      padding: 0.5rem 0.7rem 0.65rem; border-top: 1px dotted var(--rule); }
    .pt-brk { display: flex; align-items: center; gap: 0.35rem; margin-left: auto;
      font-family: var(--sans); font-size: 0.7rem; color: var(--ink-soft);
      cursor: pointer; user-select: none; }
    .pt-brk input { accent-color: var(--bad); }

    @media print {
      .pt-foot, .pt-bar, .pt-actions { display: none; }
      .pt-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (prefers-reduced-motion: reduce) {
      /* Nothing here autoplays and nothing loops — every frame is the result of
         a press. The motion *is* the content, so removing it would leave an empty
         page rather than a calmer one. 0009's own distinction, applied honestly. */
      .pt-stage { scroll-behavior: auto; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('pattern-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'pattern-lab-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function build(root) {
    const id = 'pt' + (++uid);
    const title = root.dataset.title || 'The catalogue';
    const state = { family: 'all' };

    root.classList.add('pt');
    root.innerHTML = `
      <div class="pt-head">
        <span>${title}</span>
        <div class="pt-actions">
          <button class="btn" type="button" data-act="break">Break them all</button>
          <button class="btn" type="button" data-act="fix">Restore all</button>
        </div>
      </div>
      <div class="pt-bar">
        <div class="pt-seg" data-seg role="group" aria-label="Family">
          <button type="button" data-fam="all">all twelve</button>
          <button type="button" data-fam="ui">product ui</button>
          <button type="button" data-fam="page">expressive page</button>
          <button type="button" data-fam="hand">direct manipulation</button>
        </div>
        <span class="pt-count" data-count></span>
      </div>
      <div class="pt-grid" data-grid></div>
    `;

    const grid = root.querySelector('[data-grid]');
    grid.innerHTML = PATTERNS.map((p) => `
      <div class="pt-cell" data-cell="${p.id}" data-fam="${p.family}">
        <div class="pt-stage" data-stage></div>
        <div class="pt-meta">
          <span class="pt-fam">${FAMILIES[p.family]}</span>
          <span class="pt-name">${p.name}</span>
          <p class="pt-promise" data-promise></p>
          <div class="pt-verbs">${p.verbs.map((v) => `<span class="pt-verb">${v}</span>`).join('')}</div>
        </div>
        <div class="pt-foot">
          <button class="btn primary" type="button" data-play>Play</button>
          <label class="pt-brk"><input type="checkbox" data-break> break it</label>
        </div>
      </div>
    `).join('');

    /* Fill each scene and paint its label. */
    PATTERNS.forEach((p) => {
      const cell = grid.querySelector(`[data-cell="${p.id}"]`);
      const stage = cell.querySelector('[data-stage]');
      stage.innerHTML = p.stage;
      if (p.init) p.init(stage);
      if (p.rest) stage.classList.add('on');
      paintCell(p, cell);
      if (p.drag) wireSwipe(p, cell, stage);
    });

    function paintCell(p, cell) {
      const broken = cell.classList.contains('broken');
      cell.querySelector('[data-promise]').textContent = broken ? p.breaks : p.promise;
      cell.querySelector('[data-break]').checked = broken;
    }

    function paintBar() {
      root.querySelectorAll('[data-seg] button').forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.fam === state.family)));
      let shown = 0;
      PATTERNS.forEach((p) => {
        const cell = grid.querySelector(`[data-cell="${p.id}"]`);
        const on = state.family === 'all' || p.family === state.family;
        cell.hidden = !on;
        if (on) shown++;
      });
      /* Count only what she can see — "4 on screen · 12 broken" reads as a bug. */
      const brk = [...grid.querySelectorAll('.pt-cell.broken')].filter((c) => !c.hidden).length;
      root.querySelector('[data-count]').textContent =
        `${shown} on screen${brk ? ` · ${brk} broken` : ''}`;
    }

    /* Real drag on the swipe card, so the one pattern that is *about* the hand
       can actually be done with the hand. Play is still there for the rest. */
    function wireSwipe(p, cell, stage) {
      const card = stage.querySelector('.pt-card2');
      let x0 = null, dx = 0, t0 = 0;
      card.addEventListener('pointerdown', (e) => {
        x0 = e.clientX; t0 = performance.now(); dx = 0;
        card.classList.add('grabbing');
        card.setPointerCapture(e.pointerId);
      });
      card.addEventListener('pointermove', (e) => {
        if (x0 === null) return;
        dx = Math.min(0, e.clientX - x0);
        card.style.transform = `translateX(${dx}px)`;
      });
      card.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const broken = cell.classList.contains('broken');
        const w = stage.getBoundingClientRect().width;
        const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
        card.classList.remove('grabbing');
        card.style.transition = '';
        x0 = null;
        const past = Math.abs(dx) > w * 0.45 || v > 0.6;
        if (broken ? Math.abs(dx) > 4 : past) {
          card.classList.add('gone');
          setTimeout(() => {
            card.classList.remove('gone');
            card.style.transition = 'none';
            card.style.transform = '';
            requestAnimationFrame(() => { card.style.transition = ''; });
          }, 1100);
        } else {
          card.style.transform = '';       /* snap-back */
        }
      });
    }

    root.addEventListener('click', (e) => {
      const fam = e.target.closest('[data-fam][type="button"]');
      if (fam) { state.family = fam.dataset.fam; paintBar(); return; }

      const act = e.target.closest('[data-act]');
      if (act) {
        const on = act.dataset.act === 'break';
        PATTERNS.forEach((p) => {
          const cell = grid.querySelector(`[data-cell="${p.id}"]`);
          cell.classList.toggle('broken', on);
          cell.querySelector('[data-stage]').classList.toggle('on', !!p.rest);
          paintCell(p, cell);
        });
        paintBar();
        return;
      }

      const play = e.target.closest('[data-play]');
      if (!play) return;
      const cell = play.closest('.pt-cell');
      const p = PATTERNS.find((q) => q.id === cell.dataset.cell);
      const stage = cell.querySelector('[data-stage]');
      if (play.disabled) return;
      play.disabled = true;
      p.play(stage, cell.classList.contains('broken'), () => { play.disabled = false; });
    });

    root.addEventListener('change', (e) => {
      const box = e.target.closest('[data-break]');
      if (!box) return;
      const cell = box.closest('.pt-cell');
      const p = PATTERNS.find((q) => q.id === cell.dataset.cell);
      cell.classList.toggle('broken', box.checked);
      /* Reset the scene so the next press starts from the new convention. */
      const stage = cell.querySelector('[data-stage]');
      stage.classList.toggle('on', !!p.rest);
      paintCell(p, cell);
      paintBar();
    });

    paintBar();
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-pattern-lab]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
