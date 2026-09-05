/* ============================================================
   quiz.js — retrieval practice with immediate feedback.

   Retrieval, not recognition: the questions ask you to *produce* a
   judgement, and every option is written to the same length so
   formatting never leaks the answer. Feedback lands on click, and
   the explanation stays visible so a wrong answer teaches something.

   Usage:
     <div data-quiz data-quiz-title="Retrieval check">
       <div data-q data-answer="2">
         <p class="qz-stem">Which curve for a dropdown opening?</p>
         <button data-opt>Ease in, so it builds</button>
         <button data-opt>Ease out, so it lands</button>
         <p data-explain>Entrances use ease-out …</p>
       </div>
     </div>

   data-answer is 1-indexed against the order of [data-opt].
   ============================================================ */

(() => {
  const STYLES = `
    .qz {
      margin: 2rem 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--paper-sunk);
      overflow: hidden;
    }
    .qz-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.55rem 0.9rem;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
    }
    .qz-score { font-family: var(--mono); letter-spacing: 0; text-transform: none; }
    .qz-q { padding: 1.1rem 0.95rem; border-bottom: 1px dotted var(--rule); }
    .qz-q:last-child { border-bottom: 0; }
    .qz-stem {
      font-family: var(--sans); font-size: 0.92rem; font-weight: 600;
      line-height: 1.45; margin: 0 0 0.8rem;
    }
    .qz-num { color: var(--ink-faint); font-weight: 400; margin-right: 0.4rem; }
    .qz-opts { display: grid; gap: 0.4rem; }
    .qz-opt {
      display: block; width: 100%; text-align: left;
      font-family: var(--sans); font-size: 0.85rem; line-height: 1.4;
      color: var(--ink); background: var(--paper);
      border: 1px solid var(--rule); border-radius: 6px;
      padding: 0.6rem 0.8rem; cursor: pointer;
      transition: transform 130ms var(--ease-out-strong),
                  border-color 130ms var(--ease-out-strong),
                  background-color 130ms var(--ease-out-strong);
    }
    @media (hover: hover) and (pointer: fine) {
      .qz-opt:not([disabled]):hover { border-color: var(--ink-soft); }
    }
    .qz-opt:not([disabled]):active { transform: scale(0.985); }
    .qz-opt:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .qz-opt[disabled] { cursor: default; }
    .qz-opt.is-right {
      border-color: var(--good);
      background: color-mix(in srgb, var(--good) 11%, var(--paper));
      font-weight: 600;
    }
    .qz-opt.is-wrong {
      border-color: var(--bad);
      background: color-mix(in srgb, var(--bad) 9%, var(--paper));
      text-decoration: line-through;
      text-decoration-color: color-mix(in srgb, var(--bad) 55%, transparent);
    }
    .qz-opt.is-dim { opacity: 0.5; }
    .qz-explain {
      font-family: var(--sans); font-size: 0.82rem; line-height: 1.55;
      color: var(--ink-soft);
      margin: 0.7rem 0 0; padding-left: 0.8rem;
      border-left: 2px solid var(--accent);
      /* Enters rather than snapping in — 180ms, ease-out, small travel. */
      transition: opacity 180ms var(--ease-out-strong),
                  transform 180ms var(--ease-out-strong);
    }
    .qz-explain[hidden] { display: none; }
    .qz-explain.is-entering { opacity: 0; transform: translateY(-4px); }
    .qz-done {
      font-family: var(--sans); font-size: 0.83rem;
      padding: 0.8rem 0.95rem; border-top: 1px solid var(--rule);
      color: var(--ink-soft);
    }
    .qz-done[hidden] { display: none; }
    @media (prefers-reduced-motion: reduce) {
      .qz-explain { transition-duration: 0.01ms; }
    }
    @media print {
      .qz-explain { display: block !important; }
      .qz-opt[disabled] { opacity: 1; }
    }
  `;

  function injectStyles() {
    if (document.getElementById('qz-styles')) return;
    const el = document.createElement('style');
    el.id = 'qz-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }

  function build(root) {
    const questions = [...root.querySelectorAll('[data-q]')];
    if (!questions.length) return;

    const title = root.dataset.quizTitle || 'Retrieval check';
    root.classList.add('qz');

    const head = document.createElement('div');
    head.className = 'qz-head';
    head.innerHTML = `<span>${title}</span>
      <span class="qz-score" data-score>0 / ${questions.length}</span>`;
    root.prepend(head);

    const done = document.createElement('div');
    done.className = 'qz-done';
    done.hidden = true;
    root.append(done);

    const scoreOut = head.querySelector('[data-score]');
    let correct = 0;
    let answered = 0;

    questions.forEach((q, qi) => {
      q.classList.add('qz-q');
      const answer = parseInt(q.dataset.answer, 10);
      const stem = q.querySelector('.qz-stem');
      if (stem && !stem.querySelector('.qz-num')) {
        stem.insertAdjacentHTML('afterbegin', `<span class="qz-num">${qi + 1}.</span>`);
      }

      const opts = [...q.querySelectorAll('[data-opt]')];
      const explain = q.querySelector('[data-explain]');
      if (explain) {
        explain.classList.add('qz-explain', 'is-entering');
        explain.hidden = true;
      }

      // Wrap options in a grid container for consistent spacing.
      if (opts.length) {
        const wrap = document.createElement('div');
        wrap.className = 'qz-opts';
        opts[0].before(wrap);
        opts.forEach((o) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'qz-opt';
          btn.innerHTML = o.innerHTML;
          wrap.appendChild(btn);
          o.remove();
        });
      }

      const buttons = [...q.querySelectorAll('.qz-opt')];

      buttons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          if (buttons.some((b) => b.disabled)) return;
          const isRight = i + 1 === answer;
          answered += 1;
          if (isRight) correct += 1;
          scoreOut.textContent = `${correct} / ${questions.length}`;

          buttons.forEach((b, bi) => {
            b.disabled = true;
            if (bi + 1 === answer) b.classList.add('is-right');
            else if (bi === i) b.classList.add('is-wrong');
            else b.classList.add('is-dim');
          });

          if (explain) {
            explain.hidden = false;
            requestAnimationFrame(() => explain.classList.remove('is-entering'));
          }

          if (answered === questions.length) {
            done.hidden = false;
            done.textContent =
              correct === questions.length
                ? 'All correct. Come back to this in two days and answer them again from memory — that second pass is where it sticks.'
                : `${correct} of ${questions.length}. Reread the explanations above, then close the page and come back tomorrow — retrying cold is worth more than rereading now.`;
          }
        });
      });
    });
  }

  function init() {
    injectStyles();
    document.querySelectorAll('[data-quiz]').forEach(build);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
