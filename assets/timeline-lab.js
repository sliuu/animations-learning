/* ============================================================
   timeline-lab.js — one scroll story, four design decisions.

   The lab turns the proposed vocabulary into a controlled
   experiment: the content can be an entrance or an explanation;
   scroll can trigger it or scrub it; each beat can get half, one,
   or two viewport-heights; the visual can stay pinned or leave;
   and the scene can be flat or layered with parallax.

   "Stop halfway" is load-bearing. A scrubbed entrance otherwise
   looks fine when someone scrolls cleanly through it; the stopped
   frame makes the half-readable casualty visible. The explanation
   remains meaningful at the same halfway point.

   Layout jump: the scrollport, scene, copy, verdict and controls all
   reserve their tallest state. Knobs change the scrollable distance,
   never the lab's outer height.

   Reduced motion: the lesson is specifically about motion as a
   scroll contract, so removing it would remove the evidence. Nothing
   autoplays or loops; every frame is produced by the reader or by the
   explicit "Scroll it for me" button. If the OS requests reduction,
   travel and parallax are removed while opacity and the instrumented
   progress remain, so the argument stays inspectable without the
   large spatial movement.

   Usage:
     <div data-timeline-lab data-title="One story, four decisions"></div>
   ============================================================ */

(() => {
  let uid = 0;
  const DISTANCES = { rushed: 170, composed: 320, spacious: 560 };
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));

  function injectStyles() {
    if (document.getElementById('timeline-lab-styles')) return;
    const s = document.createElement('style');
    s.id = 'timeline-lab-styles';
    s.textContent = `
    .tl { margin: 2rem 0; border: 1px solid var(--rule); border-radius: 10px;
          background: var(--paper-sunk); overflow: hidden; }
    @media (min-width: 1000px) { .tl { width: calc(100% + 13rem); margin-left: -6.5rem; } }
    .tl-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
               min-height: 2.75rem; padding: 0.65rem 1rem; background: var(--paper);
               border-bottom: 1px solid var(--rule); font: 600 0.76rem/1.35 var(--sans);
               color: var(--ink-soft); }
    .tl-head [data-meter] { font-family: var(--mono); font-variant-numeric: tabular-nums;
                            color: var(--ink-faint); }
    .tl-scroll { position: relative; height: 27rem; overflow-y: auto; overscroll-behavior: contain;
                 background: var(--paper); scrollbar-gutter: stable; }
    .tl-scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    .tl-space { position: relative; min-height: 64rem; }
    .tl-stick { position: sticky; top: 0; height: 27rem; overflow: hidden; }
    .tl-scene { position: absolute; inset: 0; display: grid; grid-template-columns: 1.12fr 0.88fr;
                align-items: stretch; min-height: 27rem; }
    .tl-art { position: relative; overflow: hidden; border-right: 1px solid var(--rule);
              background: linear-gradient(145deg, color-mix(in srgb, var(--accent-soft) 45%, var(--paper)), var(--paper)); }
    .tl-copy { position: relative; display: grid; place-items: center; padding: 2rem 1.4rem;
               background: var(--paper); }
    .tl-copy-card { position: absolute; width: calc(100% - 2.8rem); max-width: 18rem;
                    opacity: 0; transform: translateY(10px); transition: opacity 180ms linear,
                    transform 360ms var(--ease-out-strong); pointer-events: none; }
    .tl-copy-card.on { opacity: 1; transform: translateY(0); }
    .tl-kicker { display: block; margin-bottom: 0.55rem; font: 600 0.62rem/1.3 var(--sans);
                 letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
    .tl-copy-card strong { display: block; margin-bottom: 0.45rem; font: 600 1.05rem/1.25 var(--sans);
                           color: var(--ink); }
    .tl-copy-card p { margin: 0; font: 400 0.8rem/1.55 var(--sans); color: var(--ink-soft); }
    .tl-progress { position: absolute; left: 1rem; right: 1rem; bottom: 0.8rem; height: 3px;
                   border-radius: 2px; background: var(--rule); overflow: hidden; }
    .tl-progress i { display: block; width: 100%; height: 100%; background: var(--accent);
                     transform: scaleX(0); transform-origin: left; }

    .tl-layer { position: absolute; border-radius: 999px; pointer-events: none; will-change: transform; }
    .tl-back { width: 17rem; height: 17rem; left: -4rem; top: 2rem;
               background: color-mix(in srgb, var(--accent-soft) 58%, transparent); }
    .tl-mid { width: 9rem; height: 9rem; right: 8%; bottom: 8%; border: 1px solid var(--rule);
              background: color-mix(in srgb, var(--paper) 74%, transparent); }
    .tl-front { width: 4rem; height: 4rem; right: 12%; top: 12%;
                background: color-mix(in srgb, var(--accent) 14%, var(--paper)); }

    .tl-entrance { position: absolute; inset: 0; display: grid; align-content: center;
                   padding: 2.2rem; z-index: 2; }
    .tl-line { overflow: hidden; margin: -0.05em 0; font: 650 clamp(2rem, 5vw, 4rem)/0.98 var(--sans);
               letter-spacing: -0.055em; color: var(--ink); }
    .tl-line span { display: block; opacity: 0; transform: translateY(105%);
                    clip-path: inset(0 0 100% 0); transition: opacity 420ms linear,
                    transform 520ms var(--ease-out-strong), clip-path 520ms var(--ease-out-strong); }
    .tl.is-scrub .tl-line span { transition: none; }

    .tl-process { position: absolute; inset: 0; z-index: 2; }
    .tl-node { position: absolute; width: 4.6rem; height: 4.6rem; border-radius: 50%;
               display: grid; place-items: center; border: 1px solid var(--rule); background: var(--paper);
               box-shadow: 0 8px 22px rgba(0,0,0,.05); font: 600 0.65rem/1.2 var(--sans);
               color: var(--ink-soft); transition: transform 520ms var(--ease-out-strong), opacity 260ms linear; }
    .tl-node.n1 { left: 12%; top: 18%; }
    .tl-node.n2 { right: 10%; top: 38%; }
    .tl-node.n3 { left: 25%; bottom: 12%; }
    .tl-wire { position: absolute; left: 24%; top: 48%; width: 52%; height: 1px;
               background: var(--accent); transform-origin: left; transform: rotate(12deg) scaleX(0);
               opacity: 0; transition: transform 520ms var(--ease-in-out-strong), opacity 180ms linear; }
    .tl-result { position: absolute; left: 50%; top: 50%; width: 9rem; height: 9rem;
                 margin: -4.5rem; border-radius: 50%; display: grid; place-items: center;
                 text-align: center; background: var(--ink); color: var(--paper);
                 font: 600 0.82rem/1.25 var(--sans); opacity: 0; transform: scale(.82);
                 transition: transform 520ms var(--ease-out-strong), opacity 240ms linear; }
    .tl.is-scrub .tl-node, .tl.is-scrub .tl-wire, .tl.is-scrub .tl-result { transition: none; }

    .tl-read { min-height: 5.7rem; margin: 0; padding: 0.8rem 1rem; border-top: 1px solid var(--rule);
               background: var(--paper); font: 400 0.8rem/1.5 var(--sans); color: var(--ink-soft); }
    .tl-read b { color: var(--ink); font-weight: 600; }
    .tl-read .good { color: var(--good); font-weight: 600; }
    .tl-read .bad { color: var(--bad); font-weight: 600; }
    .tl-foot { display: grid; gap: 0.62rem; padding: 0.9rem 1rem 1rem; border-top: 1px solid var(--rule);
               background: var(--paper-sunk); font-family: var(--sans); }
    .tl-ctl { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .tl-cap { min-width: 6.4rem; font: 600 0.7rem/1.3 var(--sans); color: var(--ink-soft); }
    .tl-seg { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .tl-seg button { border: 1px solid var(--rule); border-radius: 6px; padding: 0.34rem 0.58rem;
                     background: var(--paper); color: var(--ink-soft); cursor: pointer;
                     font: 500 0.74rem/1.3 var(--sans); }
    .tl-seg button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: var(--paper); }
    .tl-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .tl-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; margin-left: 7.05rem; }

    @media (max-width: 700px) {
      .tl-scroll, .tl-stick { height: 31rem; }
      .tl-scene { min-height: 31rem; grid-template-columns: 1fr; grid-template-rows: 18rem 13rem; }
      .tl-art { border-right: 0; border-bottom: 1px solid var(--rule); }
      .tl-copy { padding: 1.3rem; }
      .tl-copy-card { max-width: none; width: calc(100% - 2.6rem); }
      .tl-entrance { padding: 1.6rem; }
      .tl-read { min-height: 7.8rem; }
      .tl-actions { margin-left: 0; }
    }
    @media (max-width: 520px) { .tl-read { min-height: 9rem; } }
    @media (max-width: 390px) { .tl-read { min-height: 10rem; } }
    @media (prefers-reduced-motion: reduce) {
      .tl-line span, .tl-node, .tl-wire, .tl-result, .tl-copy-card { transition-duration: 100ms !important; }
    }
    @media print { .tl-foot { display: none; } .tl-scroll { overflow: hidden; } }
    `;
    document.head.appendChild(s);
  }

  function seg(key, label, values) {
    return `<div class="tl-ctl"><span class="tl-cap">${label}</span><div class="tl-seg" data-seg="${key}" role="group" aria-label="${label}">${values.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  }

  function build(root) {
    const id = 'tl' + (++uid);
    const title = root.dataset.title || 'One story, four decisions';
    const st = { story: 'entrance', driver: 'trigger', distance: 'composed', pin: true, depth: false };
    let raf = 0, autoFrom = 0, autoTo = 0, autoStart = 0, lastBeat = -1;

    root.classList.add('tl');
    root.innerHTML = `
      <div class="tl-head"><span>${title}</span><span data-meter>beat 0 of 3 · 0%</span></div>
      <div class="tl-scroll" data-scroll tabindex="0" aria-label="Scrollable three-beat story">
        <div class="tl-space" data-space>
          <div class="tl-stick">
            <div class="tl-scene">
              <div class="tl-art" data-art>
                <i class="tl-layer tl-back"></i><i class="tl-layer tl-mid"></i><i class="tl-layer tl-front"></i>
                <div class="tl-entrance" data-entrance aria-label="Make the page remember">
                  <div class="tl-line"><span>Make</span></div>
                  <div class="tl-line"><span>the page</span></div>
                  <div class="tl-line"><span>remember.</span></div>
                </div>
                <div class="tl-process" data-process hidden aria-label="Signals become structure, then meaning">
                  <span class="tl-node n1">signal</span><span class="tl-node n2">signal</span><span class="tl-node n3">signal</span>
                  <i class="tl-wire"></i><span class="tl-result">a pattern<br>you can name</span>
                </div>
              </div>
              <div class="tl-copy" data-copy></div>
              <span class="tl-progress"><i data-progress></i></span>
            </div>
          </div>
        </div>
      </div>
      <p class="tl-read" data-read aria-live="polite"></p>
      <div class="tl-foot">
        ${seg('story', 'The content is', [['entrance','an entrance'],['explanation','an explanation']])}
        ${seg('driver', 'Scroll', [['trigger','starts each beat'],['scrub','owns every frame']])}
        ${seg('distance', 'Room per beat', [['rushed','half a screen'],['composed','one screen'],['spacious','two screens']])}
        ${seg('pin', 'The visual', [['yes','stays pinned'],['no','travels away']])}
        ${seg('depth', 'The layers', [['no','share one plane'],['yes','move at different rates']])}
        <div class="tl-actions"><button class="btn primary" type="button" data-auto>Scroll it for me</button><button class="btn" type="button" data-half>Stop halfway</button><button class="btn" type="button" data-reset>Back to top</button></div>
      </div>`;

    const scroll = root.querySelector('[data-scroll]');
    const space = root.querySelector('[data-space]');
    const art = root.querySelector('[data-art]');
    const entrance = root.querySelector('[data-entrance]');
    const process = root.querySelector('[data-process]');
    const copy = root.querySelector('[data-copy]');
    const meter = root.querySelector('[data-meter]');
    const progress = root.querySelector('[data-progress]');
    const read = root.querySelector('[data-read]');
    const autoBtn = root.querySelector('[data-auto]');

    const COPY = {
      entrance: [
        ['Beat 01', 'One line enters', 'This is an arrival. Once the threshold is crossed, the line only needs enough time to finish.'],
        ['Beat 02', 'The phrase builds', 'The second line belongs to the first. Scroll chooses when it begins, not which frame it may occupy.'],
        ['Beat 03', 'The thought lands', 'At rest, the whole headline is readable. The movement has finished its job.'],
      ],
      explanation: [
        ['Beat 01', 'Signals are separate', 'The first position names the raw pieces. Nothing has been concluded yet.'],
        ['Beat 02', 'Structure appears', 'The middle frame is the point: it shows separate things becoming related.'],
        ['Beat 03', 'Meaning resolves', 'The last position names the pattern the earlier positions explained.'],
      ],
    };

    function buildCopy() {
      copy.innerHTML = COPY[st.story].map(([k, h, p]) => `<div class="tl-copy-card"><span class="tl-kicker">${k}</span><strong>${h}</strong><p>${p}</p></div>`).join('');
    }

    function qFor(p, i) {
      return st.driver === 'scrub' ? clamp(p - i) : (p >= i + 0.16 ? 1 : 0);
    }

    function verdict(p) {
      let msg;
      if (st.story === 'entrance' && st.driver === 'scrub') {
        msg = `<b>Scrubbed entrance.</b> Stop between beats and the page holds a headline half-made. <span class="bad">Reading is now conditional on more scrolling.</span>`;
      } else if (st.story === 'entrance') {
        msg = `<b>Triggered entrance.</b> Scroll starts each line; time finishes it. Stop scrolling and the words still become readable. <span class="good">The contract fits the content.</span>`;
      } else if (st.driver === 'scrub') {
        msg = `<b>Scrubbed explanation.</b> Every position shows a valid stage, and reversing the scroll reverses cause and effect. <span class="good">The middle frames carry meaning.</span>`;
      } else {
        msg = `<b>Triggered explanation.</b> Once a threshold fires, the assembly runs ahead on its own. <span class="bad">The reader no longer owns the explanation's pace.</span>`;
      }
      const d = st.distance === 'rushed'
        ? ' Half a screen per beat makes the three ideas pass in less than two screens.'
        : st.distance === 'spacious'
        ? ' Two screens per beat makes one small idea ask for six screens of attention.'
        : ' One screen per beat gives each idea a deliberate turn without trapping the reader.';
      const pin = !st.pin && p > 0.8 ? ' <span class="bad">The visual has already left while its later copy is still talking about it.</span>' : '';
      const depth = st.depth ? ' Different layer speeds make a claim of depth; keep them only if the scene actually has foreground and background.' : '';
      read.innerHTML = msg + d + pin + depth;
    }

    function paintControls() {
      root.querySelectorAll('.tl-seg').forEach((g) => {
        const k = g.dataset.seg;
        const cur = k === 'pin' || k === 'depth' ? (st[k] ? 'yes' : 'no') : st[k];
        g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === cur)));
      });
    }

    function update() {
      const dist = DISTANCES[st.distance];
      const max = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
      const p = clamp(scroll.scrollTop / dist, 0, 3);
      const overall = clamp(scroll.scrollTop / max);
      const beat = Math.min(2, Math.max(0, Math.floor(Math.min(p, 2.999))));
      root.classList.toggle('is-scrub', st.driver === 'scrub');

      meter.textContent = `beat ${Math.min(3, Math.floor(p) + (p > 0.02 ? 1 : 0))} of 3 · ${Math.round(overall * 100)}%`;
      progress.style.transform = `scaleX(${overall})`;
      copy.querySelectorAll('.tl-copy-card').forEach((c, i) => c.classList.toggle('on', i === beat));

      const lines = entrance.querySelectorAll('span');
      lines.forEach((line, i) => {
        const q = qFor(p, i);
        line.style.opacity = String(q);
        line.style.transform = `translateY(${(1 - q) * 105}%)`;
        line.style.clipPath = `inset(0 0 ${(1 - q) * 100}% 0)`;
      });

      const nodes = process.querySelectorAll('.tl-node');
      const q0 = qFor(p, 0), q1 = qFor(p, 1), q2 = qFor(p, 2);
      const starts = [[-36,-28],[42,-6],[-18,34]];
      nodes.forEach((n, i) => {
        n.style.opacity = String(q0);
        n.style.transform = `translate(${(1-q0)*starts[i][0]}px, ${(1-q0)*starts[i][1]}px)`;
      });
      const wire = process.querySelector('.tl-wire');
      wire.style.opacity = String(q1);
      wire.style.transform = `rotate(12deg) scaleX(${q1})`;
      const result = process.querySelector('.tl-result');
      result.style.opacity = String(q2);
      result.style.transform = `scale(${0.82 + q2 * 0.18})`;

      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const leave = !st.pin && !reduce ? Math.min(scroll.scrollTop * 0.72, scroll.clientHeight * 1.12) : 0;
      art.style.transform = `translateY(${-leave}px)`;
      art.style.opacity = String(clamp(1 - leave / (scroll.clientHeight * .9)));
      const drift = st.depth && !reduce ? (overall - .5) : 0;
      root.querySelector('.tl-back').style.transform = `translateY(${drift * 34}px)`;
      root.querySelector('.tl-mid').style.transform = `translateY(${drift * -58}px)`;
      root.querySelector('.tl-front').style.transform = `translateY(${drift * 92}px)`;

      if (lastBeat !== beat) lastBeat = beat;
      verdict(p);
    }

    function resetPosition() {
      cancelAnimationFrame(raf); raf = 0; autoBtn.textContent = 'Scroll it for me';
      scroll.scrollTop = 0; lastBeat = -1; update();
    }

    function rebuild(reset = true) {
      const dist = DISTANCES[st.distance];
      space.style.height = `${scroll.clientHeight + dist * 3}px`;
      entrance.hidden = st.story !== 'entrance';
      process.hidden = st.story !== 'explanation';
      buildCopy(); paintControls();
      if (reset) resetPosition(); else update();
    }

    function autoTick(now) {
      const t = clamp((now - autoStart) / Math.max(1600, (autoTo - autoFrom) * 2.2));
      const eased = 1 - Math.pow(1 - t, 3);
      scroll.scrollTop = autoFrom + (autoTo - autoFrom) * eased;
      if (t < 1) raf = requestAnimationFrame(autoTick);
      else { raf = 0; autoBtn.textContent = 'Scroll it for me'; }
    }

    function auto() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; autoBtn.textContent = 'Scroll it for me'; return; }
      autoFrom = scroll.scrollTop;
      autoTo = scroll.scrollHeight - scroll.clientHeight;
      if (autoFrom > autoTo - 8) autoFrom = scroll.scrollTop = 0;
      autoStart = performance.now(); autoBtn.textContent = 'Stop scrolling';
      raf = requestAnimationFrame(autoTick);
    }

    scroll.addEventListener('scroll', update, { passive: true });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.tl-seg button');
      if (b) {
        const k = b.closest('.tl-seg').dataset.seg;
        st[k] = k === 'pin' || k === 'depth' ? b.dataset.v === 'yes' : b.dataset.v;
        rebuild(k !== 'pin' && k !== 'depth');
        return;
      }
      if (e.target.closest('[data-auto]')) auto();
      else if (e.target.closest('[data-half]')) {
        cancelAnimationFrame(raf); raf = 0; autoBtn.textContent = 'Scroll it for me';
        scroll.scrollTop = DISTANCES[st.distance] * .5; update();
      } else if (e.target.closest('[data-reset]')) resetPosition();
    });
    window.addEventListener('resize', () => rebuild(false));
    rebuild();
    return id;
  }

  function init() { injectStyles(); document.querySelectorAll('[data-timeline-lab]').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
