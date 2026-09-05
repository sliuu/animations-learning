(function () {
  'use strict';
  let uid = 0;
  function injectStyles() {
    if (document.getElementById('text-arrival-lab-styles')) return;
    const s = document.createElement('style'); s.id = 'text-arrival-lab-styles'; s.textContent = `
      .ta-lab { color:var(--ink); }
      .ta-actions { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
      .ta-board { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .ta-pane { border:1px solid var(--rule); border-radius:12px; padding:18px; min-height:210px; background:var(--paper-sunk); }
      .ta-pane h3 { margin:0 0 12px; font:600 12px var(--sans); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-soft); }
      .ta-copy { font:600 clamp(1.3rem,2.5vw,2.15rem)/1.08 var(--sans); letter-spacing:-.03em; }
      .ta-line { display:block; overflow:hidden; }
      .ta-line > span { display:block; }
      .ta-playing .ta-line > span { animation:ta-fade 580ms var(--ease-out-strong) both; animation-delay:calc(var(--i) * 90ms); }
      .ta-playing .ta-line.mask > span { animation-name:ta-mask; }
      @keyframes ta-fade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
      @keyframes ta-mask { from { clip-path:inset(0 0 100% 0); } to { clip-path:inset(0 0 0 0); } }
      .ta-verdict { min-height:2.8em; margin:14px 0 0; padding-top:10px; border-top:1px solid var(--rule); font:13px/1.45 var(--sans); color:var(--ink-soft); }
      @media (min-width:1000px) { .ta-lab { width:calc(100% + 13rem); margin-left:-6.5rem; } }
      @media (max-width:700px) { .ta-pane { padding:14px; min-height:180px; } }
      @media print { .ta-actions { display:none; } }
      @media (prefers-reduced-motion: reduce) { /* Preserve the words, remove the large-area travel. */ .ta-playing .ta-line > span, .ta-playing .ta-line.mask > span { animation:none; opacity:1; transform:none; clip-path:none; } }
    `; document.head.appendChild(s);
  }
  function mount(root) {
    injectStyles(); uid += 1; root.classList.add('ta-lab');
    root.innerHTML = `<div class="stage-head"><strong>${root.dataset.title || 'Two ways for text to arrive'}</strong><span>Same words. Different promise.</span></div><div class="ta-actions"><button class="btn primary" data-play>Play both</button><button class="btn" data-stop>Stop halfway</button></div><div class="ta-board"><section class="ta-pane"><h3>Mask reveal · uncovering</h3><div class="ta-copy" data-mask><span class="ta-line mask"><span>Design can make</span></span><span class="ta-line mask"><span>the order visible.</span></span></div></section><section class="ta-pane"><h3>Fade-up · arriving</h3><div class="ta-copy" data-fade><span class="ta-line"><span>Design can make</span></span><span class="ta-line"><span>the order visible.</span></span></div></section></div><p class="ta-verdict" data-verdict aria-live="polite">Press Play both, then watch the two promises at the same time.</p>`;
    const lines = root.querySelectorAll('.ta-line');
    root.querySelector('[data-play]').addEventListener('click', () => { root.classList.remove('ta-playing'); void root.offsetWidth; root.classList.add('ta-playing'); root.querySelector('[data-verdict]').textContent = 'Mask keeps the type still and changes the window. Fade-up changes the type itself: it is dimmer and lower while it arrives.'; });
    root.querySelector('[data-stop]').addEventListener('click', () => { lines.forEach(l => l.querySelector('span').getAnimations().forEach(a => { a.pause(); a.currentTime = 300; })); root.querySelector('[data-verdict]').textContent = 'Paused halfway: the mask reads as a window opening; the fade-up reads as words entering the room.'; });
  }
  document.querySelectorAll('[data-text-arrival-lab]').forEach(mount);
})();
