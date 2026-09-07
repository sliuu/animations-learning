/* ============================================================
   critique-lab.js — the critique drill.

   Ten specimens, each one a real animation with a real flaw. You
   watch it, name how it feels and name the fix, and only then does
   the lab show you the corrected version — side by side with the
   original, both replayable in the same instant, because a claim
   about how something feels cannot be argued from memory.

   The verdict is hidden until you commit. That is the whole point:
   a critique you form after seeing the answer is not a critique.

   Mounts on [data-critique-lab]. Honours data-title.
   ============================================================ */

(() => {
  let uid = 0;

  /* Each case carries its own markup and two stylesheets — the specimen as
     shipped, and the same specimen fixed. A specimen sits at its settled state
     until "Run it" is pressed — an empty pane is not a specimen, and the entrance
     is what replays. The hidden starting state comes from the keyframe's `from`
     plus fill-mode `both`, not from the base rules.

     `&` at the head of a rule is the stage's own id, so a case's CSS is scoped
     without a parser: `& .row` becomes `#cq-1-before .row` and `&.is-run .row`
     becomes the running state. It has to be `&` and not `%` — `%` appears in half
     the values here, and substituting it turned `inset: 0 0 0 42%` into garbage
     the parser silently dropped. */
  const CASES = [
    {
      id: 'stagger',
      title: 'A list arriving',
      brief: 'Six rows load in. Watch the last one.',
      html: `<div class="rows">
               <div class="row"><b>Ada Okafor</b><span>2m</span></div>
               <div class="row"><b>Bo Lindqvist</b><span>11m</span></div>
               <div class="row"><b>Chidi Amaechi</b><span>26m</span></div>
               <div class="row"><b>Dae-jung Park</b><span>1h</span></div>
               <div class="row"><b>Elif Demir</b><span>3h</span></div>
               <div class="row"><b>Farida Haddad</b><span>5h</span></div>
             </div>`,
      css: `
        & .rows { display: grid; gap: 5px; }
        & .row { display: flex; justify-content: space-between; align-items: center;
                 padding: 6px 11px; border-radius: 7px; background: var(--paper-sunk);
                 border: 1px solid var(--rule); font-size: 12px; }
        & .row span { color: var(--ink-faint); font-variant-numeric: tabular-nums; }`,
      before: {
        note: 'each row waits 140ms longer than the one above it, and takes 480ms to arrive',
        css: `
          &.is-run .row { animation: cq-rise 480ms var(--ease-out-strong) both;
                          animation-delay: calc(var(--i) * 140ms); }`,
      },
      after: {
        note: 'the offset is 35ms and the move is 260ms, so the group lands as a group',
        css: `
          &.is-run .row { animation: cq-rise 260ms var(--ease-out-strong) both;
                          animation-delay: calc(var(--i) * 35ms); }`,
      },
      adjective: { answer: 4, options: ['busy', 'janky', 'twitchy', 'disorienting', 'sluggish', 'gratuitous'] },
      fix: {
        answer: 2,
        options: [
          'Fade the rows in all at once instead',
          'Cut the offset so the group reads as one',
          'Reverse the order so the last is first',
          'Move the rows further before they land',
        ],
      },
      principle: 'A stagger is a group arriving, not a queue being served. If the last item is still coming when the reader has finished reading the first, the offset is a delay, not a rhythm.',
      why: 'Six rows at 140ms apart is 700ms of offset before the last one even starts, and it still has 480ms to travel — so the list is not finished for nearly 1.2 seconds. The reader is already reading row one. Shortening the <em>animation</em> would not fix it; the offset is what is long.',
      aside: 'Lesson 0003 argues the same thing with the numbers: total stagger time, not per-item delay, is the figure to hold.',
    },

    {
      id: 'modal',
      title: 'A dialog opening',
      brief: 'A destructive confirmation. Watch it arrive.',
      html: `<div class="scrim"></div>
             <div class="dialog">
               <b>Delete “Q3 forecast”?</b>
               <p>This cannot be undone.</p>
               <div class="acts"><span class="btn">Cancel</span><span class="btn pri">Delete</span></div>
             </div>`,
      css: `
        & { display: grid; place-items: center; }
        & .scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
        & .dialog { position: relative; width: min(220px, 78%); padding: 13px 14px;
                    border-radius: 10px; background: var(--paper); border: 1px solid var(--rule);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.25); font-size: 12px; }
        & .dialog p { margin: 4px 0 10px; color: var(--ink-soft); font-size: 11px; }
        & .acts { display: flex; gap: 6px; justify-content: flex-end; }
        & .btn { padding: 4px 9px; border-radius: 5px; border: 1px solid var(--rule); font-size: 11px; }
        & .btn.pri { background: var(--bad); color: var(--paper); border-color: transparent; }`,
      before: {
        note: 'scales up from nothing at the centre of the screen over 620ms, easing in and out',
        css: `
          &.is-run .scrim { animation: cq-fade 620ms cubic-bezier(0.77, 0, 0.175, 1) both; }
          &.is-run .dialog { animation: cq-balloon 620ms cubic-bezier(0.77, 0, 0.175, 1) both; }`,
      },
      after: {
        note: 'starts at 96% and 6px low, and lands in 200ms',
        css: `
          &.is-run .scrim { animation: cq-fade 200ms var(--ease-out-strong) both; }
          &.is-run .dialog { animation: cq-settle 200ms var(--ease-out-strong) both; }`,
      },
      adjective: { answer: 3, options: ['snappy', 'janky', 'floaty', 'busy', 'laggy', 'twitchy'] },
      fix: {
        answer: 4,
        options: [
          'Ease it in rather than in and out',
          'Give the dialog a drop shadow on entry',
          'Slide it down from the top of the frame',
          'Start it near its size and land it fast',
        ],
      },
      principle: 'An entrance lands. Scaling from zero over half a second is a thing being conjured; starting near full size and arriving quickly is a thing that was already there and has now been shown.',
      why: 'Two faults compound. The curve is symmetric, so the dialog accelerates <em>into</em> its resting place instead of decelerating onto it — nothing in the physical world does that. And scaling from 0 makes the size change the whole event, which is 620ms of a box growing when the reader has already decided to read it.',
      aside: 'Lesson 0001 is the argument for the curve; lesson 0007 is the argument for where a scale grows from.',
    },

    {
      id: 'toast',
      title: 'A toast arriving',
      brief: 'A save confirmation, bottom right. Watch where it comes from.',
      html: `<div class="app">
               <div class="line w70"></div><div class="line w95"></div>
               <div class="line w55"></div><div class="line w80"></div>
             </div>
             <div class="toast">Saved to Drafts</div>`,
      css: `
        & .app { display: grid; gap: 8px; padding: 4px 2px; }
        & .line { height: 9px; border-radius: 5px; background: var(--paper-sunk);
                  border: 1px solid var(--rule); }
        & .w95 { width: 95%; } & .w80 { width: 80%; } & .w70 { width: 70%; } & .w55 { width: 55%; }
        & .toast { position: absolute; right: 10px; bottom: 10px; padding: 7px 11px;
                   border-radius: 7px; background: var(--ink); color: var(--paper);
                   font-size: 11px; font-weight: 600; }`,
      before: {
        note: 'flies in from the far left, crossing the whole frame, over 500ms',
        css: `
          &.is-run .toast { animation: cq-crossing 500ms var(--ease-out-strong) both; }`,
      },
      after: {
        note: 'rises 12px from the edge it is already sitting against, over 220ms',
        css: `
          &.is-run .toast { animation: cq-nudge 220ms var(--ease-out-strong) both; }`,
      },
      adjective: { answer: 5, options: ['sluggish', 'mushy', 'busy', 'twitchy', 'disorienting', 'snappy'] },
      fix: {
        answer: 1,
        options: [
          'Bring it in from the edge it rests on',
          'Fade it in with no movement at all',
          'Make the crossing faster than 500ms',
          'Put the toast at the top of the frame',
        ],
      },
      principle: 'A thing comes from where it lives. The path an element travels is a claim about where it was a moment ago, and a toast that lives in the bottom-right corner was never on the left.',
      why: 'The distance is the tell. Crossing the frame drags the reader\'s eye away from what they were reading and then abandons it in a corner, and it does that for a message they did not ask for. Speeding the crossing up keeps the fault and makes it harder to follow.',
      aside: 'Lesson D002 is the whole argument: you do not choose an animation, you choose where the thing came from, and the motion is the consequence.',
    },

    {
      id: 'refresh',
      title: 'A table refreshing',
      brief: 'Live data, polled. One number just changed. Watch what moves.',
      html: `<div class="rows">
               <div class="row"><b>EUR/USD</b><span data-v>1.0840</span></div>
               <div class="row"><b>GBP/USD</b><span data-v>1.2715</span></div>
               <div class="row"><b>USD/JPY</b><span data-v class="hit">151.22</span></div>
               <div class="row"><b>AUD/USD</b><span data-v>0.6598</span></div>
               <div class="row"><b>USD/CHF</b><span data-v>0.8804</span></div>
             </div>`,
      css: `
        & .rows { display: grid; gap: 5px; }
        & .row { display: flex; justify-content: space-between; align-items: center;
                 padding: 8px 11px; border-radius: 7px; background: var(--paper-sunk);
                 border: 1px solid var(--rule); font-size: 12px; }
        & .row span { font-variant-numeric: tabular-nums; color: var(--ink-soft); }`,
      before: {
        note: 'every row flashes and lifts on each poll, whether or not its number moved',
        css: `
          &.is-run .row { animation: cq-flash 420ms var(--ease-out-strong) both; }`,
      },
      after: {
        note: 'only the row whose number changed is marked, and it is marked in colour, not motion',
        css: `
          &.is-run .row:has(.hit) { animation: cq-mark 900ms ease-out both; }`,
      },
      adjective: { answer: 1, options: ['busy', 'floaty', 'mushy', 'sluggish', 'unanchored', 'laggy'] },
      fix: {
        answer: 3,
        options: [
          'Shorten the flash so it interrupts less',
          'Stagger the rows so they do not collide',
          'Animate the row that changed, and no other',
          'Fade the whole table out and back in',
        ],
      },
      principle: 'Motion is a claim that something happened. Making the claim about all five rows when it is true of one is not a louder signal, it is no signal — a highlight only exists as a difference.',
      why: 'This is the failure that looks like polish. The animation is short, smooth, correctly eased and applied consistently — and it destroys the only piece of information the screen had to give. Shortening it keeps the defect and makes it flicker.',
      aside: 'This is the case D011 is built around, if you have read it: budget is not spending less, it is spending it all on the thing that happened.',
    },

    {
      id: 'press',
      title: 'A button being pressed',
      brief: 'Press-down and release, played for you. Watch the feedback.',
      html: `<button class="cta" type="button">Add to cart</button>`,
      css: `
        & { display: grid; place-items: center; }
        & .cta { font: 600 13px/1 var(--sans); padding: 11px 20px; border-radius: 8px;
                 border: 1px solid transparent; background: var(--accent); color: var(--paper);
                 cursor: pointer; }`,
      before: {
        note: 'the press scales the button over 320ms, easing in and out both ways',
        css: `
          &.is-run .cta { animation: cq-press-slow 900ms cubic-bezier(0.77, 0, 0.175, 1) both; }`,
      },
      after: {
        note: 'the press is 70ms down and 130ms back — the down half is almost instant',
        css: `
          &.is-run .cta { animation: cq-press-fast 900ms linear both; }`,
      },
      adjective: { answer: 2, options: ['twitchy', 'mushy', 'busy', 'janky', 'disorienting', 'floaty'] },
      fix: {
        answer: 4,
        options: [
          'Add a shadow so the press reads deeper',
          'Scale it further down so it is visible',
          'Use a spring so the release overshoots',
          'Make the down state arrive almost at once',
        ],
      },
      principle: 'Feedback under the finger is not an animation, it is a response. Anything the reader is physically doing has to be acknowledged inside about 100ms, or the control feels like it is deciding whether to obey.',
      why: 'The release can be slower and often should be — that is the button recovering, and the finger has already gone. It is the <em>down</em> half that must be immediate. A symmetric curve spends the same time on both, which puts the lag on the half that cannot afford it.',
      aside: 'Lesson 0010 puts a number on it and lesson 0001 explains why the two halves want different curves.',
    },

    {
      id: 'hover',
      title: 'A list on hover',
      brief: 'Three cards. The pointer crosses all three, played for you.',
      html: `<div class="cards">
               <div class="card" style="--i:0"><b>Atlas</b><span>Design system</span></div>
               <div class="card" style="--i:1"><b>Bellows</b><span>Marketing site</span></div>
               <div class="card" style="--i:2"><b>Cinder</b><span>Internal tools</span></div>
             </div>`,
      css: `
        & { display: grid; align-content: center; }
        & .cards { display: grid; gap: 7px; }
        & .card { display: flex; justify-content: space-between; align-items: baseline;
                  padding: 10px 12px; border-radius: 8px; background: var(--paper);
                  border: 1px solid var(--rule); font-size: 12px; }
        & .card span { color: var(--ink-faint); font-size: 11px; }`,
      before: {
        note: 'each hover lifts the card 6px over 420ms and overshoots on the way',
        css: `
          &.is-run .card { animation: cq-hover-big 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
                           animation-delay: calc(var(--i) * 300ms); }`,
      },
      after: {
        note: 'each hover lifts the card 2px over 110ms and stops there',
        css: `
          &.is-run .card { animation: cq-hover-small 110ms var(--ease-out-strong) both;
                           animation-delay: calc(var(--i) * 300ms); }`,
      },
      adjective: { answer: 3, options: ['sluggish', 'floaty', 'twitchy', 'mushy', 'gratuitous', 'laggy'] },
      fix: {
        answer: 2,
        options: [
          'Only lift the card the pointer settles on',
          'Cut the lift and the time, and drop the bounce',
          'Delay the lift until the pointer has rested',
          'Lift the whole list rather than one card',
        ],
      },
      principle: 'Hover is the cheapest state and it is passed through by accident constantly. Anything that plays every time the pointer crosses a row has to be small enough and short enough to survive being played by mistake.',
      why: 'The bounce is what makes it twitchy rather than merely slow. An overshoot is a claim of weight and momentum, and it is being made three times in a second by a pointer that was on its way somewhere else. A delay before the lift would fix the accidental triggers but make the intentional ones feel broken.',
      aside: 'Lesson 0010 separates hover from press for exactly this reason: one is a guess about intent, the other is a fact.',
    },

    {
      id: 'spinner',
      title: 'A panel loading',
      brief: 'A filter is applied and the results come back. Watch the spinner.',
      html: `<div class="panel">
               <div class="spin"></div>
               <div class="content"><div class="line w90"></div><div class="line w70"></div>
                 <div class="line w85"></div></div>
             </div>`,
      css: `
        & { display: grid; align-content: center; }
        & .panel { position: relative; padding: 0 8%; }
        & .spin { position: absolute; left: 50%; top: 50%; margin: -11px 0 0 -11px;
                  width: 22px; height: 22px; border-radius: 50%;
                  border: 2px solid var(--rule); border-top-color: var(--accent); opacity: 0; }
        & .content { display: grid; gap: 9px; }
        & .line { height: 10px; border-radius: 5px; background: var(--paper-sunk);
                  border: 1px solid var(--rule); }
        & .w90 { width: 90%; } & .w85 { width: 85%; } & .w70 { width: 70%; }`,
      before: {
        note: 'the response takes 120ms, and the spinner is shown for every millisecond of it',
        css: `
          &.is-run .spin { animation: cq-spin 600ms linear infinite, cq-blink 120ms steps(1) both; }
          &.is-run .content { animation: cq-fade 160ms ease-out 120ms both; }`,
      },
      after: {
        note: 'the spinner is held back 300ms, so a 120ms response never shows one at all',
        css: `
          &.is-run .content { animation: cq-fade 160ms ease-out 120ms both; }`,
      },
      adjective: { answer: 6, options: ['sluggish', 'laggy', 'floaty', 'mushy', 'busy', 'gratuitous'] },
      fix: {
        answer: 1,
        options: [
          'Hold the spinner back by about 300ms',
          'Fade the spinner out instead of cutting it',
          'Show a skeleton in place of the spinner',
          'Keep the spinner up for a 400ms minimum',
        ],
      },
      principle: 'Do not animate a wait that is not one. A spinner that appears and vanishes inside a fifth of a second reports a problem the reader did not have, and the flicker is the only thing they will remember.',
      why: 'The two common repairs point opposite ways and only one is right. Holding the spinner back means fast responses never show one; holding it up for a minimum means slow responses do not flicker, but it makes <em>every</em> fast response artificially slow. Delay first; add the minimum only for the cases that survive it.',
      aside: 'Lesson D009 is the full set of waiting strategies and where each one earns its place.',
    },

    {
      id: 'accordion',
      title: 'An accordion opening',
      brief: 'One section of a FAQ. Count what changes.',
      html: `<div class="acc">
               <div class="acc-head"><b>Shipping &amp; returns</b><span class="chev"></span></div>
               <div class="acc-body"><p>Orders ship within two business days. Returns are
                 accepted for 30 days from delivery, unworn and in the original packaging.</p></div>
             </div>`,
      css: `
        & { display: grid; align-content: center; }
        & .acc { border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
                 background: var(--paper); }
        & .acc-head { display: flex; justify-content: space-between; align-items: center;
                      padding: 11px 13px; font-size: 12px; }
        & .chev { width: 7px; height: 7px; border-right: 1.5px solid var(--ink-soft);
                  border-bottom: 1.5px solid var(--ink-soft); transform: rotate(45deg);
                  margin-bottom: 3px; }
        & .acc-body { display: grid; grid-template-rows: 0fr; }
        & .acc-body p { overflow: hidden; margin: 0; padding: 0 13px; font-size: 11px;
                        line-height: 1.5; color: var(--ink-soft); }`,
      before: {
        note: 'the height, the chevron, the text opacity and the background all change over 520ms',
        css: `
          &.is-run .acc { animation: cq-tint 520ms cubic-bezier(0.77, 0, 0.175, 1) both; }
          &.is-run .acc-body { animation: cq-open 520ms cubic-bezier(0.77, 0, 0.175, 1) both; }
          &.is-run .acc-body p { animation: cq-fade 520ms ease-in-out 260ms both; padding-block: 0 12px; }
          &.is-run .chev { animation: cq-chev-far 520ms cubic-bezier(0.77, 0, 0.175, 1) both; }`,
      },
      after: {
        note: 'the height opens over 220ms and the chevron turns with it — nothing else moves',
        css: `
          &.is-run .acc-body { animation: cq-open 220ms var(--ease-out-strong) both; }
          &.is-run .acc-body p { padding-block: 0 12px; }
          &.is-run .chev { animation: cq-chev-near 220ms var(--ease-out-strong) both; }`,
      },
      adjective: { answer: 4, options: ['floaty', 'twitchy', 'unanchored', 'busy', 'laggy', 'snappy'] },
      fix: {
        answer: 3,
        options: [
          'Run the four changes one after another',
          'Speed all four up to about 220ms each',
          'Open the height and turn the chevron, only',
          'Fade the text in before the height opens',
        ],
      },
      principle: 'Four simultaneous changes are four claims, and only one of them is true: the section opened. Every additional property is a thing the reader has to rule out before they can read the answer they came for.',
      why: 'Speeding all four up is the tempting repair and it is the wrong one — busy is a failure of quantity, not of pace, so a fast four-part animation is a fast mess. Sequencing them is worse still: it makes a 520ms animation longer while keeping every part of it.',
      aside: 'Lesson 0002 is the argument for which property to reach for; D011 is the argument for how many.',
    },

    {
      id: 'menu',
      title: 'A menu opening',
      brief: 'The hamburger is pressed for you. Watch where the panel comes from.',
      html: `<div class="mini">
               <div class="bar"><b>Ledger</b><span class="ham"></span></div>
               <div class="body"><div class="line w85"></div><div class="line w60"></div>
                 <div class="line w75"></div></div>
               <div class="sheet"><span>Home</span><span>Reports</span><span>Settings</span></div>
             </div>`,
      css: `
        & .mini { position: relative; height: 100%; border: 1px solid var(--rule);
                  border-radius: 8px; overflow: hidden; background: var(--paper); }
        & .bar { display: flex; justify-content: space-between; align-items: center;
                 padding: 9px 11px; border-bottom: 1px solid var(--rule); font-size: 12px; }
        & .ham { width: 13px; height: 9px; border-top: 1.5px solid var(--ink-soft);
                 border-bottom: 1.5px solid var(--ink-soft); position: relative; }
        & .ham::after { content: ''; position: absolute; inset: 3.5px 0 auto 0; height: 1.5px;
                        background: var(--ink-soft); }
        & .body { display: grid; gap: 8px; padding: 11px; }
        & .line { height: 9px; border-radius: 5px; background: var(--paper-sunk);
                  border: 1px solid var(--rule); }
        & .w85 { width: 85%; } & .w75 { width: 75%; } & .w60 { width: 60%; }
        & .sheet { position: absolute; inset: 39px 0 0 48%; display: grid; align-content: start;
                   gap: 9px; padding: 13px; background: var(--paper-sunk);
                   border-left: 1px solid var(--rule); font-size: 12px; }`,
      before: {
        note: 'the panel fades up in place over 380ms, arriving from nowhere in particular',
        css: `
          &.is-run .sheet { animation: cq-fade 380ms ease-in-out both; }`,
      },
      after: {
        note: 'the panel slides in from the right edge over 260ms, the way it will leave',
        css: `
          &.is-run .sheet { animation: cq-slide-right 260ms var(--ease-drawer) both; }`,
      },
      adjective: { answer: 5, options: ['busy', 'sluggish', 'twitchy', 'mushy', 'unanchored', 'janky'] },
      fix: {
        answer: 2,
        options: [
          'Dim the page behind it as the panel opens',
          'Slide it in from the edge it will leave by',
          'Scale it up from the hamburger it came from',
          'Fade it faster so the arrival reads as one',
        ],
      },
      principle: 'A panel that fades in has no off-screen home, so it has no way back. The direction it enters from is the promise about where it went when it closes, and a fade makes no promise at all.',
      why: 'The reader is not confused about <em>what</em> appeared — the list of links is obvious. They are confused about where the page they were reading has gone and how to get back to it. A panel that came from the right edge is understood to still be there, just off-screen, and swiping or pressing towards that edge will return it.',
      aside: 'Lesson D010 makes this the whole basis of navigation: continuity is orientation. D002 is where the off-screen home is introduced.',
    },

    {
      id: 'decoration',
      title: 'A hero, at rest',
      brief: 'Nobody has interacted with this page. Watch it anyway.',
      html: `<div class="hero">
               <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
               <b>Ship it on Friday</b>
               <p>Planning software for teams that would rather be building.</p>
             </div>`,
      css: `
        & .hero { position: relative; height: 100%; display: grid; align-content: center;
                  gap: 5px; padding: 0 16px; overflow: hidden; }
        & .hero b { font: 600 17px/1.2 var(--sans); position: relative; }
        & .hero p { margin: 0; font-size: 11.5px; color: var(--ink-soft); position: relative; }
        & .blob { position: absolute; border-radius: 50%; background: var(--accent-soft);
                  border: 1px solid var(--rule); }
        & .b1 { width: 62px; height: 62px; right: 8%; top: 8%; }
        & .b2 { width: 34px; height: 34px; right: 26%; bottom: 12%; }
        & .b3 { width: 20px; height: 20px; right: 5%; bottom: 22%; }`,
      before: {
        note: 'three shapes drift and pulse forever, and nothing on the page has changed',
        css: `
          &.is-run .b1 { animation: cq-drift 5200ms ease-in-out infinite; }
          &.is-run .b2 { animation: cq-drift 3900ms ease-in-out infinite reverse; }
          &.is-run .b3 { animation: cq-drift 6400ms ease-in-out infinite; }`,
      },
      after: {
        note: 'the shapes hold still, and the page is over as soon as it has been read',
        css: ``,
      },
      adjective: { answer: 6, options: ['busy', 'floaty', 'twitchy', 'unanchored', 'disorienting', 'gratuitous'] },
      fix: {
        answer: 4,
        options: [
          'Slow the drift until it is barely visible',
          'Tie the drift to the pointer position',
          'Play the drift once and then let it rest',
          'Take it out — nothing is being reported',
        ],
      },
      principle: 'Motion with no referent is noise wearing the costume of craft. Before anything else, an animation has to answer what changed — and "the page is still open" is not a change.',
      why: 'This is the only case in the drill where the fix is deletion, and it is the hardest one to argue in a room, because the loop is genuinely pretty and somebody made it. The argument that works is not taste, it is competition: this is the one thing on the page that moves, so it wins the reader\'s attention outright, and it spends that attention on a decoration.',
      aside: 'The permanent-motion case also fails the reduced-motion test outright — see lesson 0009 — because there is no reduced version of it that still does its job.',
    },
  ];

  const KEYFRAMES = `
    @keyframes cq-rise { from { opacity: 0; transform: translateY(10px); }
                         to { opacity: 1; transform: none; } }
    @keyframes cq-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cq-balloon { from { opacity: 0; transform: scale(0); }
                            to { opacity: 1; transform: scale(1); } }
    @keyframes cq-settle { from { opacity: 0; transform: scale(0.96) translateY(6px); }
                           to { opacity: 1; transform: none; } }
    @keyframes cq-crossing { from { opacity: 0; transform: translateX(-330px); }
                             to { opacity: 1; transform: none; } }
    @keyframes cq-nudge { from { opacity: 0; transform: translateY(12px); }
                          to { opacity: 1; transform: none; } }
    @keyframes cq-flash { 0% { transform: none; background: var(--paper-sunk); }
                          40% { transform: translateY(-4px); background: var(--accent-soft); }
                          100% { transform: none; background: var(--paper-sunk); } }
    @keyframes cq-mark { 0%, 55% { background: var(--accent-soft); border-color: var(--accent); }
                         100% { background: var(--paper-sunk); border-color: var(--rule); } }
    @keyframes cq-press-slow { 0%, 22% { transform: none; }
                               50% { transform: scale(0.94); }
                               78%, 100% { transform: none; } }
    @keyframes cq-press-fast { 0%, 30% { transform: none; }
                               37.8% { transform: scale(0.94); }
                               52.2%, 100% { transform: none; } }
    @keyframes cq-hover-big { 0% { transform: none; box-shadow: 0 0 0 rgba(0,0,0,0); }
                              50% { transform: translateY(-6px); box-shadow: 0 8px 18px rgba(0,0,0,0.18); }
                              100% { transform: none; box-shadow: 0 0 0 rgba(0,0,0,0); } }
    @keyframes cq-hover-small { 0% { transform: none; }
                                50% { transform: translateY(-2px); }
                                100% { transform: none; } }
    @keyframes cq-spin { to { transform: rotate(360deg); } }
    @keyframes cq-blink { 0% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes cq-open { from { grid-template-rows: 0fr; } to { grid-template-rows: 1fr; } }
    @keyframes cq-tint { 0% { background: var(--paper); } 50% { background: var(--accent-soft); }
                         100% { background: var(--paper); } }
    @keyframes cq-chev-far { from { transform: rotate(45deg); } to { transform: rotate(225deg); } }
    @keyframes cq-chev-near { from { transform: rotate(45deg); } to { transform: rotate(-135deg); } }
    @keyframes cq-slide-right { from { opacity: 1; transform: translateX(100%); }
                                to { opacity: 1; transform: none; } }
    @keyframes cq-drift { 0% { transform: none; }
                          50% { transform: translate(-9px, -13px) scale(1.09); }
                          100% { transform: none; } }
  `;

  function injectStyles() {
    if (document.getElementById('critique-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'critique-lab-styles';
    s.textContent = `
    .cq { margin: 2.4rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper); overflow: hidden; }
    @media (min-width: 1000px) { .cq { width: calc(100% + 13rem); margin-left: -6.5rem; } }

    .cq-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
               padding: 0.6rem 1rem; border-bottom: 1px solid var(--rule);
               font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
               letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-faint); }
    .cq-prog { font-family: var(--mono); letter-spacing: 0; text-transform: none;
               white-space: nowrap; }

    .cq-body { padding: 1rem; }
    .cq-brief { font-family: var(--sans); font-size: 0.85rem; color: var(--ink-soft);
                margin: 0 0 0.85rem; }
    .cq-brief b { color: var(--ink); }

    .cq-panes { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .cq-pane { margin: 0; min-width: 0; }
    .cq-cap { display: flex; align-items: baseline; justify-content: space-between; gap: 0.6rem;
              font-family: var(--sans); font-size: 0.68rem; font-weight: 600;
              letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-faint);
              margin: 0 0 0.4rem; }
    /* Every specimen shares one height so paging between cases never moves the
       page, and it is sized by the tallest one — six rows plus a stagger. The
       line-height is set here rather than inherited: the page's serif 1.65 makes
       a UI specimen read like prose, and it was pushing case one out of frame. */
    .cq-stage { position: relative; height: 236px; padding: 12px; overflow: hidden;
                border: 1px solid var(--rule); border-radius: 8px; background: var(--paper-sunk);
                font-family: var(--sans); line-height: 1.35; color: var(--ink); }
    /* The locked pane is the same box at the same height, so committing an answer
       reveals a fix rather than pushing the page around. */
    .cq-lock { position: absolute; inset: 0; display: grid; place-items: center;
               padding: 0 1.4rem; text-align: center; background: var(--paper-sunk);
               font-family: var(--sans); font-size: 0.78rem; color: var(--ink-soft); }
    /* The class sets display, so it outranks the UA rule for [hidden] and the
       cover stays up after a commit unless this says otherwise. */
    .cq-lock[hidden] { display: none; }
    .cq-note { display: block; margin: 0.45rem 0 0; font-family: var(--sans);
               font-size: 0.74rem; line-height: 1.45; color: var(--ink-faint); }
    /* Reserved per measured band: the note under each pane is one to three lines
       depending on the case and the width. */
    .cq-notewrap { min-height: 2.2rem; }

    .cq-runrow { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;
                 margin-top: 0.9rem; }
    .cq-btn { font-family: var(--sans); font-size: 0.78rem; font-weight: 600;
              padding: 0.42rem 0.8rem; border-radius: 6px; border: 1px solid var(--rule);
              background: var(--paper); color: var(--ink); cursor: pointer;
              transition: border-color 130ms var(--ease-out-strong); }
    .cq-btn:hover:not([disabled]) { border-color: var(--ink-soft); }
    .cq-btn[disabled] { opacity: 0.45; cursor: default; }
    .cq-btn.pri { background: var(--accent); color: var(--paper); border-color: transparent; }
    .cq-btn.pri:hover:not([disabled]) { background: var(--accent-hover); }
    .cq-hint { font-family: var(--sans); font-size: 0.74rem; color: var(--ink-faint); }

    .cq-ask { padding: 0.95rem 1rem; border-top: 1px solid var(--rule);
              background: var(--paper-sunk); }
    .cq-row { display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap;
              margin-bottom: 0.6rem; }
    .cq-q { font-family: var(--sans); font-size: 0.78rem; font-weight: 600; color: var(--ink-soft);
            min-width: 8.4rem; }
    .cq-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; flex: 1; min-width: 0; }
    .cq-chip { font-family: var(--sans); font-size: 0.78rem; text-align: left;
               padding: 0.34rem 0.66rem; border-radius: 6px; border: 1px solid var(--rule);
               background: var(--paper); color: var(--ink); cursor: pointer;
               transition: border-color 130ms var(--ease-out-strong),
                           background-color 130ms var(--ease-out-strong); }
    .cq-chip:hover:not([disabled]) { border-color: var(--ink-soft); }
    .cq-chip[aria-pressed="true"] { background: var(--accent); color: var(--paper);
                                    border-color: transparent; }
    .cq-chip[disabled] { cursor: default; }
    .cq-chip[data-mark="right"] { border-color: var(--good); }
    .cq-chip[aria-pressed="true"][data-mark="right"] { background: var(--good); }
    .cq-chip[aria-pressed="true"][data-mark="wrong"] { background: var(--bad); }

    .cq-verdictwrap { display: flex; align-items: center; padding: 0 1rem;
                      border-top: 1px solid var(--rule); }
    .cq-verdict { margin: 0.95rem 0; font-size: 0.95rem; line-height: 1.55; }
    .cq-verdict b { font-weight: 700; }
    .cq-verdict em { font-style: italic; }
    .cq-princ { display: block; margin-top: 0.5rem; padding-left: 0.75rem;
                border-left: 2px solid var(--accent); color: var(--ink-soft); }
    .cq-aside { display: block; margin-top: 0.5rem; font-family: var(--sans);
                font-size: 0.76rem; color: var(--ink-faint); }

    .cq-code { border-top: 1px solid var(--rule); }
    .cq-code summary { padding: 0.55rem 1rem; cursor: pointer; font-family: var(--sans);
                       font-size: 0.74rem; font-weight: 600; letter-spacing: 0.06em;
                       text-transform: uppercase; color: var(--ink-faint); }
    .cq-code pre { margin: 0; padding: 0 1rem 1rem; overflow-x: auto;
                   font-family: var(--mono); font-size: 0.72rem; line-height: 1.55;
                   color: var(--ink-soft); }
    .cq-code pre b { color: var(--ink); font-weight: 400; }

    /* Above the verdict, deliberately. The verdict's height varies by a couple of
       lines from case to case, and these are the buttons she presses ten times —
       anything that moves them between presses is a layout jump on the control. */
    .cq-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem;
               padding: 0.6rem 1rem; border-top: 1px solid var(--rule); }

    @media (max-width: 760px) {
      .cq-panes { grid-template-columns: minmax(0, 1fr); }
      .cq-q { min-width: 100%; }
    }
    @media (max-width: 620px) { .cq-notewrap { min-height: 3.3rem; } }
    @media (max-width: 430px) { .cq-notewrap { min-height: 4.4rem; } }
    @media print { .cq-runrow, .cq-foot, .cq-ask { display: none; } }

    ${KEYFRAMES}
    `;
    document.head.appendChild(s);
  }

  /* The drill is about judging motion, so a lab that refuses to move is a lab
     that cannot be used. The stance is not to suppress it but to never start it:
     nothing here plays on load, on scroll, or on a knob turn — only on a press of
     a button labelled "Run it", which is a reader asking for that specific motion.
     What reduced motion does change is the one place the lab would otherwise play
     something unasked (the auto-run when a fix is revealed), and every specimen
     carries a written description of what it does, so the whole drill can be
     completed and every verdict read without a frame of animation. */
  const reduced = () => window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(root) {
    injectStyles();
    const n = ++uid;
    const title = root.dataset.title || 'Name the flaw, name the fix';

    let i = 0;                       // which case
    const picked = [];               // per case: {adj, fix, committed}
    CASES.forEach(() => picked.push({ adj: null, fix: null, committed: false }));

    root.className = 'cq';
    root.innerHTML = `
      <div class="cq-head"><span>${title}</span><span class="cq-prog" data-prog></span></div>
      <div class="cq-body">
        <p class="cq-brief" data-brief></p>
        <div class="cq-panes">
          <figure class="cq-pane">
            <figcaption class="cq-cap"><span>As shipped</span></figcaption>
            <div class="cq-stage" id="cq-${n}-before" data-stage="before"></div>
            <div class="cq-notewrap"><span class="cq-note" data-note="before"></span></div>
          </figure>
          <figure class="cq-pane">
            <figcaption class="cq-cap"><span>The fix</span></figcaption>
            <div class="cq-stage" id="cq-${n}-after" data-stage="after">
              <div class="cq-lock" data-lock>Hidden until you commit to an answer.</div>
            </div>
            <div class="cq-notewrap"><span class="cq-note" data-note="after"></span></div>
          </figure>
        </div>
        <div class="cq-runrow">
          <button type="button" class="cq-btn pri" data-run>Run it</button>
          <span class="cq-hint" data-hint></span>
        </div>
      </div>
      <div class="cq-ask">
        <div class="cq-row"><span class="cq-q">How does it feel?</span>
          <div class="cq-chips" data-chips="adj"></div></div>
        <div class="cq-row"><span class="cq-q">What would you change?</span>
          <div class="cq-chips" data-chips="fix"></div></div>
        <button type="button" class="cq-btn pri" data-commit disabled>Commit</button>
      </div>
      <div class="cq-foot">
        <button type="button" class="cq-btn" data-prev>&larr; Previous</button>
        <button type="button" class="cq-btn" data-next>Next case &rarr;</button>
      </div>
      <div class="cq-verdictwrap"><p class="cq-verdict" data-verdict></p></div>
      <details class="cq-code"><summary>The CSS behind it</summary><pre data-code></pre></details>`;

    const el = (s) => root.querySelector(s);
    const stageBefore = el('[data-stage="before"]');
    const stageAfter = el('[data-stage="after"]');
    const lock = el('[data-lock]');
    const caseStyle = document.createElement('style');
    document.head.appendChild(caseStyle);

    function scoped(css, variant) {
      return css.replace(/&/g, `#cq-${n}-${variant}`);
    }

    function render() {
      const c = CASES[i];
      const p = picked[i];

      caseStyle.textContent =
        scoped(c.css, 'before') + scoped(c.before.css, 'before') +
        scoped(c.css, 'after') + scoped(c.after.css, 'after');

      el('[data-brief]').innerHTML = `<b>${c.title}.</b> ${c.brief}`;
      stageBefore.className = 'cq-stage';
      stageBefore.innerHTML = c.html;
      stageAfter.className = 'cq-stage';
      stageAfter.innerHTML = c.html;
      stageAfter.appendChild(lock);
      indexRows(stageBefore); indexRows(stageAfter);

      el('[data-note="before"]').textContent = c.before.note;
      el('[data-note="after"]').textContent = p.committed ? c.after.note : '';
      lock.hidden = p.committed;

      chips('adj', c.adjective, p);
      chips('fix', c.fix, p);

      el('[data-prog]').textContent =
        `Case ${i + 1} of ${CASES.length} · ${scored()} named`;
      el('[data-prev]').disabled = i === 0;
      el('[data-next]').disabled = i === CASES.length - 1;
      el('[data-commit]').disabled = p.committed || p.adj === null || p.fix === null;
      el('[data-commit]').textContent = p.committed ? 'Committed' : 'Commit';
      el('[data-run]').textContent = p.committed ? 'Run both' : 'Run it';
      el('[data-hint]').textContent = p.committed
        ? 'Both play in the same instant — that is the only honest way to compare a feeling.'
        : (reduced()
            ? 'Motion reduced: nothing plays unless you press. Each pane is described underneath.'
            : 'Watch it as many times as you like before you answer.');

      verdict();
      code();
    }

    /* Several specimens stagger off --i, and setting it in markup would put a
       style attribute in the code disclosure that has nothing to teach. */
    function indexRows(stage) {
      stage.querySelectorAll('.row').forEach((r, k) => r.style.setProperty('--i', k));
    }

    function chips(kind, spec, p) {
      const box = el(`[data-chips="${kind}"]`);
      box.innerHTML = spec.options.map((label, k) => {
        const on = p[kind] === k + 1;
        let mark = '';
        if (p.committed) {
          if (k + 1 === spec.answer) mark = ' data-mark="right"';
          else if (on) mark = ' data-mark="wrong"';
        }
        return `<button type="button" class="cq-chip" data-k="${k + 1}"` +
               ` aria-pressed="${on}"${p.committed ? ' disabled' : ''}${mark}>${label}</button>`;
      }).join('');
    }

    function scored() {
      return picked.filter((p, k) =>
        p.committed && p.adj === CASES[k].adjective.answer && p.fix === CASES[k].fix.answer).length;
    }

    function verdict() {
      const c = CASES[i], p = picked[i], v = el('[data-verdict]');
      if (!p.committed) {
        v.innerHTML = `<span style="color:var(--ink-faint)">Name both, then commit. ` +
          `The fix stays covered until you do &mdash; a critique you form after seeing the ` +
          `answer is not a critique.</span>`;
        return;
      }
      const adjRight = p.adj === c.adjective.answer;
      const fixRight = p.fix === c.fix.answer;
      const word = c.adjective.options[c.adjective.answer - 1];
      const head = adjRight && fixRight
        ? `<b>Both.</b> It is <em>${word}</em>, and that is the change to ask for.`
        : adjRight
          ? `<b>The word, not the fix.</b> It is <em>${word}</em> &mdash; but the change to ask ` +
            `for is &ldquo;${c.fix.options[c.fix.answer - 1].toLowerCase()}&rdquo;.`
          : fixRight
            ? `<b>The fix, not the word.</b> The change is right. The word for the feeling is ` +
              `<em>${word}</em>.`
            : `<b>Neither, this time.</b> It is <em>${word}</em>, and the change to ask for is ` +
              `&ldquo;${c.fix.options[c.fix.answer - 1].toLowerCase()}&rdquo;.`;
      v.innerHTML = `${head} ${c.why}` +
        `<span class="cq-princ">${c.principle}</span>` +
        `<span class="cq-aside">${c.aside}</span>`;
    }

    function code() {
      const c = CASES[i], p = picked[i];
      const trim = (s) => s.replace(/&/g, '').replace(/^\n/, '').replace(/\s+$/, '')
        .split('\n').map((l) => l.replace(/^ {10}/, '')).join('\n');
      el('[data-code]').innerHTML = p.committed
        ? `/* as shipped */\n${esc(trim(c.before.css))}\n\n<b>/* the fix */\n` +
          `${esc(trim(c.after.css) || '/* nothing — the animation is removed */')}</b>`
        : `/* as shipped */\n${esc(trim(c.before.css))}\n\n/* the fix is here once you commit */`;
    }

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

    function play(which) {
      const stage = which === 'before' ? stageBefore : stageAfter;
      stage.classList.remove('is-run');
      void stage.offsetWidth;            // restart the animations from zero
      stage.classList.add('is-run');
    }

    function run() {
      play('before');
      if (picked[i].committed) play('after');
    }

    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.cq-chip');
      if (chip && !chip.disabled) {
        const kind = chip.parentElement.dataset.chips;
        picked[i][kind] = Number(chip.dataset.k);
        chips(kind, kind === 'adj' ? CASES[i].adjective : CASES[i].fix, picked[i]);
        el('[data-commit]').disabled = picked[i].adj === null || picked[i].fix === null;
        return;
      }
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.dataset.run !== undefined) { run(); return; }
      if (btn.dataset.commit !== undefined) {
        picked[i].committed = true;
        render();
        // The reveal answers the question that was just asked, so it plays itself —
        // except for a reader who has asked for less motion, who gets the button.
        if (!reduced()) run();
        return;
      }
      if (btn.dataset.prev !== undefined && i > 0) { i--; render(); return; }
      if (btn.dataset.next !== undefined && i < CASES.length - 1) { i++; render(); }
    });

    render();
  }

  const boot = () => document.querySelectorAll('[data-critique-lab]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
