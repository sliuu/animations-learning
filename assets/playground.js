/* ============================================================
   playground.js — live-editable CSS with instant preview.

   Each playground renders its markup inside an iframe, so demo CSS is
   fully isolated: @keyframes, bare tag selectors and `*` rules can't
   leak into the lesson page. Editing the textarea swaps the iframe's
   <style> text only — no reload, no flicker.

   Usage:
     <div class="pg" data-pg data-pg-title="Try it" data-pg-height="180">
       <script type="text/plain" data-pg-html>
         <div class="box">hello</div>
       </script>
       <textarea data-pg-css">
   .box { transition: transform 200ms ease-out; }
       </textarea>
     </div>

   Buttons "Replay" and "Reset" are added automatically. Replay
   re-mounts the markup, so entrance animations play again.
   ============================================================ */

(() => {
  const STYLES = `
    .pg {
      margin: 1.75rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      overflow: hidden;
      background: var(--paper-sunk);
    }
    .pg-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.85rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .pg-actions { display: flex; gap: 0.4rem; }
    .pg-grid { display: grid; grid-template-columns: 1fr; }
    @media (min-width: 820px) {
      .pg-grid.split { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
      .pg-grid.split .pg-code { border-right: 1px solid var(--rule); border-bottom: 0; }
    }
    /* Break out of the prose measure: code needs more room than text does,
       otherwise declarations wrap mid-value and become unreadable. */
    @media (min-width: 1000px) {
      .pg { width: calc(100% + 13rem); margin-left: -6.5rem; }
    }
    .pg-code { border-bottom: 1px solid var(--rule); position: relative; min-width: 0; }
    .pg-code textarea {
      display: block; width: 100%; border: 0; outline: none; resize: vertical;
      background: var(--code-bg); color: var(--ink);
      font-family: var(--mono); font-size: 0.76rem; line-height: 1.65;
      padding: 0.9rem 1rem; tab-size: 2;
      min-height: 100px;
    }
    .pg-code textarea:focus { box-shadow: inset 2px 0 0 var(--accent); }
    .pg-hint {
      font-family: var(--sans); font-size: 0.68rem; color: var(--ink-faint);
      padding: 0.3rem 1rem 0.5rem; background: var(--code-bg);
      border-top: 1px dotted var(--rule);
    }
    .pg-stage {
      min-width: 0; background: var(--paper);
      display: grid; place-items: center;
    }
    .pg-stage iframe { display: block; width: 100%; border: 0; }
    .pg-err {
      font-family: var(--mono); font-size: 0.72rem; color: var(--bad);
      padding: 0.4rem 1rem; border-top: 1px solid var(--rule);
    }
    @media print {
      .pg-code textarea { height: auto !important; overflow: visible; }
      .pg-actions { display: none; }
    }
  `;

  // Base CSS handed to every iframe. Gives demos a neutral canvas so lessons
  // only write the CSS that is actually being taught.
  //
  // An iframe is its own document, so it inherits none of the page's custom
  // properties — they have to be carried across. They are read off the host
  // root rather than restated here, which is the only way the playground and
  // the lesson around it can stay the same colour: lesson.css is the palette,
  // and this is a copy of whichever half of it is currently in force.
  const CARRIED = ['--ink', '--paper', '--accent', '--accent-hover', '--accent-soft',
                   '--rule', '--good', '--bad',
                   '--ease-out-strong', '--ease-in-out-strong', '--ease-drawer'];

  function baseCss() {
    const cs = getComputedStyle(document.documentElement);
    const tokens = CARRIED
      .map((n) => `      ${n}: ${cs.getPropertyValue(n).trim()};`)
      .join('\n');
    return `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    :root {
${tokens}
    }
    body {
      display: grid; place-items: center;
      font-family: ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
      color: var(--ink); background: var(--paper);
      overflow: hidden;
    }
    .box {
      width: 84px; height: 84px; border-radius: 12px;
      background: var(--accent); color: var(--paper);
      display: grid; place-items: center;
      font-weight: 600; font-size: 12px;
    }
  `;
  }

  function injectStyles() {
    if (document.getElementById('pg-styles')) return;
    const el = document.createElement('style');
    el.id = 'pg-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function dedent(text) {
    const lines = text.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indents = lines
      .filter((l) => l.trim())
      .map((l) => l.match(/^[ \t]*/)[0].length);
    const cut = indents.length ? Math.min(...indents) : 0;
    return lines.map((l) => l.slice(cut)).join('\n');
  }

  function build(root) {
    const htmlNode = root.querySelector('[data-pg-html]');
    const textarea = root.querySelector('[data-pg-css]');
    if (!textarea) return;

    const markup = htmlNode ? dedent(htmlNode.textContent) : '<div class="box">box</div>';
    const originalCss = dedent(textarea.value);
    const height = root.dataset.pgHeight || '180';
    const title = root.dataset.pgTitle || 'Live — edit the CSS';
    const hint = root.dataset.pgHint || '';
    const split = root.dataset.pgStacked === undefined;

    textarea.value = originalCss;
    textarea.setAttribute('spellcheck', 'false');
    textarea.setAttribute('aria-label', 'Editable CSS for this demo');

    // ----- chrome -----
    root.classList.add('pg');
    root.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'pg-head';
    head.innerHTML = `<span>${title}</span>`;
    const actions = document.createElement('div');
    actions.className = 'pg-actions';
    const replayBtn = document.createElement('button');
    replayBtn.className = 'btn';
    replayBtn.type = 'button';
    replayBtn.textContent = 'Replay';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    actions.append(replayBtn, resetBtn);
    head.appendChild(actions);

    const grid = document.createElement('div');
    grid.className = 'pg-grid' + (split ? ' split' : '');

    const codeWrap = document.createElement('div');
    codeWrap.className = 'pg-code';
    codeWrap.appendChild(textarea);
    if (hint) {
      const h = document.createElement('div');
      h.className = 'pg-hint';
      h.textContent = hint;
      codeWrap.appendChild(h);
    }

    const stage = document.createElement('div');
    stage.className = 'pg-stage';
    const frame = document.createElement('iframe');
    frame.setAttribute('title', title);
    frame.setAttribute('scrolling', 'no');
    frame.style.height = height + 'px';
    stage.appendChild(frame);

    grid.append(codeWrap, stage);
    root.append(head, grid);

    // Size the editor to its content. Measured rather than computed from the
    // line count, because soft-wrapped lines occupy more rows than they have
    // newlines — that's what was clipping longer snippets.
    function fitEditor() {
      textarea.style.height = 'auto';
      const fitted = Math.max(110, Math.min(textarea.scrollHeight + 4, 460));
      textarea.style.height = fitted + 'px';
    }
    requestAnimationFrame(fitEditor);

    // Refit when the column width changes (wrapping changes with it). Guarded
    // on width so resizing the textarea can't feed back into itself.
    let lastWidth = 0;
    new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (Math.abs(w - lastWidth) < 1) return;
      lastWidth = w;
      fitEditor();
    }).observe(codeWrap);

    // ----- iframe wiring -----
    // The iframe stays on about:blank for its whole life; we mutate its
    // document directly rather than document.write()-ing into it, because
    // write()+close() can re-fire the frame's load event and recurse.
    let styleEl = null;
    let mountToken = 0;

    function mount() {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) {
        // about:blank isn't parsed yet on this tick — try again next frame.
        requestAnimationFrame(mount);
        return;
      }
      const token = ++mountToken;

      doc.head.textContent = '';
      doc.body.textContent = '';
      doc.body.className = '';

      const base = doc.createElement('style');
      base.textContent = baseCss();
      doc.head.appendChild(base);

      styleEl = doc.createElement('style');
      styleEl.textContent = textarea.value;
      doc.head.appendChild(styleEl);

      doc.body.innerHTML = markup;

      // Demos declare their end state under `.mounted`, which lands one
      // frame after paint. That gap is what gives a transition something
      // to interpolate from instead of snapping to the final value.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token === mountToken && frame.contentDocument === doc) {
            doc.body.classList.add('mounted');
          }
        });
      });
    }

    mount();

    // The carried palette is a copy, so it goes stale the moment the reader
    // switches theme. Re-mounting is the honest fix: the demo is rebuilt in
    // the new colours rather than left sitting in the old ones.
    new MutationObserver(() => mount()).observe(document.documentElement,
      { attributes: true, attributeFilter: ['data-theme'] });

    function apply() {
      if (styleEl) styleEl.textContent = textarea.value;
    }

    textarea.addEventListener('input', () => {
      apply();
      fitEditor();
    });

    // Tab inserts two spaces instead of leaving the field.
    textarea.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey) return;
      e.preventDefault();
      const { selectionStart: s, selectionEnd: t, value } = textarea;
      textarea.value = value.slice(0, s) + '  ' + value.slice(t);
      textarea.selectionStart = textarea.selectionEnd = s + 2;
      apply();
    });

    replayBtn.addEventListener('click', mount);
    resetBtn.addEventListener('click', () => {
      textarea.value = originalCss;
      mount();
    });
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-pg]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
