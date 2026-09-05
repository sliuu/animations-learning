(function () {
  'use strict';
  let uid = 0;

  function injectStyles() {
    if (document.getElementById('split-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'split-lab-styles';
    style.textContent = `
      .sp-lab { color: var(--ink); }
      .sp-controls { display:flex; flex-wrap:wrap; gap:12px; align-items:end; margin:0 0 16px; }
      .sp-control { display:grid; gap:5px; }
      .sp-label { font:600 11px/1.2 var(--sans); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); }
      .sp-seg { display:flex; flex-wrap:wrap; gap:4px; }
      .sp-seg button { border:1px solid var(--rule); background:var(--paper); color:var(--ink-soft); border-radius:999px; padding:7px 10px; font:600 12px var(--sans); cursor:pointer; }
      .sp-seg button[aria-pressed="true"] { background:var(--ink); color:var(--paper); border-color:var(--ink); }
      .sp-actions { margin-left:auto; display:flex; gap:6px; }
      .sp-board { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }
      .sp-pane { border:1px solid var(--rule); border-radius:12px; padding:18px; background:var(--paper-sunk); min-height:250px; display:flex; flex-direction:column; }
      .sp-pane h3 { margin:0 0 10px; font:600 12px var(--sans); text-transform:uppercase; letter-spacing:.08em; color:var(--ink-soft); }
      .sp-copy { margin:auto 0; font:600 clamp(1.35rem,3vw,2.7rem)/1.05 var(--sans); letter-spacing:-.035em; }
      .sp-copy.body { font:400 clamp(1rem,1.6vw,1.25rem)/1.35 var(--serif); letter-spacing:0; }
      .sp-unit { display:inline-block; opacity:1; transform:none; clip-path:inset(0 0 0 0); }
      .sp-unit.word { white-space:nowrap; }
      .sp-unit.line { display:block; }
      .sp-copy.body .sp-unit.char { display:inline; }
      .sp-space { display:inline; white-space:pre; }
      .sp-playing .sp-unit { animation:sp-arrive 520ms var(--ease-out-strong) both; animation-delay:calc(var(--i) * var(--step)); }
      .sp-playing.sp-mask .sp-unit { animation-name:sp-mask; }
      @keyframes sp-arrive { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
      @keyframes sp-mask { from { clip-path:inset(0 0 100% 0); } to { clip-path:inset(0 0 0 0); } }
      .sp-read { min-height:3.1em; margin:14px 0 0; padding-top:10px; border-top:1px solid var(--rule); font:13px/1.45 var(--sans); color:var(--ink-soft); }
      .sp-status { min-height:1.4em; margin:12px 0 0; font:600 12px var(--sans); color:var(--accent); }
      @media (min-width:1000px) { .sp-lab { width:calc(100% + 13rem); margin-left:-6.5rem; } }
      @media (max-width:700px) { .sp-controls { display:block; } .sp-control { margin:0 0 10px; } .sp-actions { margin-top:10px; margin-left:0; } .sp-pane { min-height:220px; padding:14px; } }
      @media print { .sp-controls, .sp-status { display:none; } }
      @media (prefers-reduced-motion: reduce) {
        /* Keep the split and its hierarchy, remove travel and scheduled motion. */
        .sp-playing .sp-unit, .sp-playing.sp-mask .sp-unit { animation:none; opacity:1; transform:none; clip-path:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function units(text, mode) {
    if (mode === 'whole') return [{ text, cls: 'whole' }];
    if (mode === 'lines') return text.split('|').map(t => ({ text: t.trim(), cls: 'line' }));
    if (mode === 'words') return text.trim().split(/\s+/).map(t => ({ text: t, cls: 'word' }));
    return Array.from(text.replace(/\|/g, ' ')).map(ch => ({ text: ch, cls: 'char' }));
  }
  function renderCopy(el, text, mode) {
    el.innerHTML = '';
    units(text, mode).forEach((u, i) => {
      const span = document.createElement('span'); span.className = 'sp-unit ' + u.cls; span.style.setProperty('--i', i); span.setAttribute('aria-hidden', 'true'); span.textContent = u.text; el.appendChild(span);
      if (mode === 'words' || mode === 'chars') el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.sp-unit').length;
  }
  function mount(root) {
    injectStyles();
    const id = ++uid;
    root.classList.add('sp-lab');
    root.innerHTML = `<div class="stage-head"><strong>${root.dataset.title || 'Split the text'}</strong><span>Choose the unit the reader should wait for.</span></div>
      <div class="sp-controls">
        <div class="sp-control"><span class="sp-label">Split by</span><div class="sp-seg" data-role="mode"><button data-value="whole" aria-pressed="false">whole</button><button data-value="lines" aria-pressed="true">lines</button><button data-value="words" aria-pressed="false">words</button><button data-value="chars" aria-pressed="false">characters</button></div></div>
        <div class="sp-control"><span class="sp-label">Per-unit delay</span><div class="sp-seg" data-role="step"><button data-value="0" aria-pressed="true">together</button><button data-value="35" aria-pressed="false">quick</button><button data-value="80" aria-pressed="false">countable</button></div></div>
        <div class="sp-control"><span class="sp-label">Arrival</span><div class="sp-seg" data-role="style"><button data-value="fade" aria-pressed="true">fade-up</button><button data-value="mask" aria-pressed="false">mask</button></div></div>
        <div class="sp-actions"><button class="btn primary" data-role="play">Play both</button></div>
      </div>
      <div class="sp-board"><section class="sp-pane"><h3>Hero word · KINETIC</h3><div class="sp-copy" data-role="hero"></div><p class="sp-read" data-role="hero-read"></p></section><section class="sp-pane"><h3>Body copy</h3><div class="sp-copy body" data-role="body"></div><p class="sp-read" data-role="body-read"></p></section></div>
      <p class="sp-status" data-role="status" aria-live="polite"></p>`;
    const mode = root.querySelector('[data-role="mode"]'); let current = 'lines'; let step = 0; let style = 'fade';
    const hero = root.querySelector('[data-role="hero"]'), body = root.querySelector('[data-role="body"]');
    hero.setAttribute('aria-label', 'KINETIC'); body.setAttribute('aria-label', 'Motion can guide attention, but reading still has to feel like reading.');
    function update() {
      const h = renderCopy(hero, 'KINETIC', current), b = renderCopy(body, 'Motion can guide attention, but reading still has to feel like reading.', current);
      root.querySelector('[data-role="hero-read"]').textContent = `${h} ${current === 'chars' ? 'character beats' : current === 'whole' ? 'unit' : current + ' beats'} · ${step}ms apart`;
      root.querySelector('[data-role="body-read"]').textContent = `${b} ${current === 'chars' ? 'character beats' : current === 'whole' ? 'unit' : current + ' beats'} · ${step * Math.max(0, b - 1)}ms from first to last`;
      root.querySelector('[data-role="status"]').textContent = current === 'chars' ? `The hero has ${h} small beats; the paragraph has ${b}. At ${step}ms, body copy asks the reader to wait ${step * Math.max(0, b - 1)}ms for one sentence.` : current === 'lines' ? 'Lines keep the paragraph readable while still giving the entrance a shape.' : current === 'words' ? 'Words can work for a short headline; the paragraph is already starting to feel metronomic.' : 'One unit arrives as one thought: a useful baseline.';
    }
    root.querySelectorAll('[data-role="mode"] button').forEach(btn => btn.addEventListener('click', () => { current = btn.dataset.value; mode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === btn)); update(); }));
    root.querySelectorAll('[data-role="step"] button').forEach(btn => btn.addEventListener('click', () => { step = Number(btn.dataset.value); root.querySelectorAll('[data-role="step"] button').forEach(b => b.setAttribute('aria-pressed', b === btn)); update(); }));
    root.querySelectorAll('[data-role="style"] button').forEach(btn => btn.addEventListener('click', () => { style = btn.dataset.value; root.querySelectorAll('[data-role="style"] button').forEach(b => b.setAttribute('aria-pressed', b === btn)); }));
    root.querySelector('[data-role="play"]').addEventListener('click', () => { root.classList.remove('sp-playing'); void root.offsetWidth; root.style.setProperty('--step', step + 'ms'); root.classList.toggle('sp-mask', style === 'mask'); root.classList.add('sp-playing'); root.querySelector('[data-role="status"]').textContent = `${style === 'mask' ? 'Mask: uncovering' : 'Fade-up: arriving'} · both examples started together.`; });
    update();
  }
  document.querySelectorAll('[data-split-lab]').forEach(mount);
})();
