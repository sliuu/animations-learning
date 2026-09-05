#!/usr/bin/env python3
"""Bundle the lessons into one self-contained HTML file for phone reading.

Everything ships inline — stylesheet, components, all four documents — so the
result works with no server, no network and no sibling files. Re-run after
writing a lesson; it picks up new files from lessons/ automatically.

    python3 tools/build-course.py
"""

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'course.html'
BUILT = '2026-09-05'

# What is written next, in the order it is currently planned. Shown faded in
# the contents so the shape of the whole course is visible from lesson one —
# and so a lesson that keeps getting deferred is visibly getting deferred.
# Not a commitment: reorder freely, and drop anything that stops earning a slot.
# Split by track, because the two tracks are read separately: a designer who
# starts at D001 should see the design road ahead under the design lessons, not
# buried after three engineering rows they were never going to read.
PLANNED_ENG = [
    ('14', 'Reading a Performance recording',
     'Not a lesson so much as a session: open DevTools on a page you pick and read the flame '
     'chart together until the green bars mean something.',
     'needs a page from you'),
    ('15', 'The reverse-engineering drill',
     'Take a real site. Name every effect with the right vocabulary, measure the timings, '
     'rebuild one from scratch. This is the mission, run as an exam.',
     'the point of all of it'),
]

# Part 2 of the design track is the families in depth, part 3 is judgment. Build
# order is deliberately not numeric — D004 is the smallest object that exercises
# the whole vocabulary, and D008 is the biggest gap against the mission's own
# north star, so both come before the ones numbered between them.
PLANNED_DES = [
    ('D09', 'Loading, waiting, and optimism',
     'Perceived performance as a design material. Skeleton against spinner against progress, and '
     'the trick of animating before the response arrives.',
     'next in this track'),
    ('D10', 'Navigation and page transitions',
     'The where-am-I problem. Menu overlays, shared elements, and continuity as orientation.',
     'queued · may fold into 0011 instead'),
    ('D11', 'The motion budget',
     'Expensive against busy, and answering “should this animate?” with a principled no.',
     'queued'),
    ('D12', 'The critique drill',
     'Name the flaw, name the fix, name the principle. Ten before-and-afters, verdict hidden '
     'until you commit.',
     'queued'),
    ('D13', 'Motion in a design system',
     'Tokens and handoff: what belongs in a Figma spec, and what only ever exists in code.',
     'queued'),
]

# The design track's endpoint artifact, listed with the sheets rather than the
# lessons because that is what it is — the thing you keep open while designing.
PLANNED_REF = [
    ('Ref5', 'The pattern catalogue &amp; glossary',
     'Every pattern with its family and its one-line promise, then the three vocabularies: '
     'nouns, verbs, adjectives. Printable.',
     'the design track ships this'),
]

PLANNED = PLANNED_ENG + PLANNED_DES + PLANNED_REF

ASSETS = ['easing-lab.js', 'cost-lab.js', 'stagger-lab.js', 'scroll-lab.js', 'exit-lab.js',
          'tool-lab.js', 'origin-lab.js', 'spring-lab.js', 'motion-pref-lab.js', 'press-lab.js', 'clock-lab.js',
          'appear-lab.js', 'interrupt-lab.js', 'reveal-lab.js', 'wipe-lab.js',
          'pattern-lab.js', 'home-lab.js', 'return-lab.js', 'channel-lab.js', 'rank-lab.js',
          'flip-lab.js', 'vt-lab.js', 'state-lab.js', 'hold-lab.js', 'grab-lab.js', 'drag-lab.js', 'deck-lab.js', 'autoplay-lab.js',
          'timeline-lab.js', 'scroll-contract-lab.js', 'split-lab.js', 'text-arrival-lab.js',
          'playground.js', 'quiz.js']


def read(p):
    return (ROOT / p).read_text()


def body_of(path):
    """Everything between <div class="page"> and the trailing scripts."""
    text = read(path)
    start = text.index('<div class="page">')
    cut = text.find('<script src=')
    return text[start:cut if cut != -1 else len(text)].rstrip()


def meta_of(path):
    text = read(path)
    def grab(pattern, default=''):
        m = re.search(pattern, text, re.S)
        return ' '.join(m.group(1).split()) if m else default
    return {
        'title': grab(r'<title>(.*?)</title>'),
        'eyebrow': grab(r'<p class="eyebrow">(.*?)</p>'),
        'dek': grab(r'<p class="dek">(.*?)</p>'),
        'skill': grab(r'<span>Skill: (.*?)</span>'),
    }


# ---- documents -------------------------------------------------------------
# Two tracks. The engineering lessons are numbered 0001-, the design lessons D001-,
# and 'D' sorts after the digits so the glob already puts them in the right order.
lesson_paths = sorted(p for p in (ROOT / 'lessons').glob('*.html'))


def validate_quizzes(paths):
    """Reject answer keys quiz.js can never select (its indices are 1-based)."""
    errors = []
    question = re.compile(
        r'<div data-q data-answer="(\d+)">(.*?)<p data-explain>', re.S)
    for path in paths:
        for number, match in enumerate(question.finditer(path.read_text()), start=1):
            answer = int(match.group(1))
            option_count = len(re.findall(r'<button data-opt>', match.group(2)))
            if not 1 <= answer <= option_count:
                errors.append(
                    f'{path.relative_to(ROOT)} question {number}: '
                    f'data-answer={answer}, but there are {option_count} options')
    if errors:
        raise SystemExit('Invalid quiz answer keys:\n' + '\n'.join(errors))


validate_quizzes(lesson_paths)
eng_paths = [p for p in lesson_paths if not p.name.startswith('D')]
des_paths = [p for p in lesson_paths if p.name.startswith('D')]

docs = []
for i, p in enumerate(eng_paths, start=1):
    docs.append({'id': f'lesson-{i}', 'num': f'{i:02d}', 'track': 'eng',
                 'path': p.relative_to(ROOT), 'meta': meta_of(p.relative_to(ROOT))})
for i, p in enumerate(des_paths, start=1):
    docs.append({'id': f'design-{i}', 'num': f'D{i:02d}', 'track': 'design',
                 'path': p.relative_to(ROOT), 'meta': meta_of(p.relative_to(ROOT))})
lesson_count = len(docs)

# Reference sheets, in filename order. easing-and-timing.html predates the
# numbered naming, so it sorts last alphabetically — pin it first by hand.
ref_paths = sorted((p for p in (ROOT / 'reference').glob('*.html')),
                   key=lambda p: (p.name != 'easing-and-timing.html', p.name))
for i, p in enumerate(ref_paths, start=1):
    docs.append({'id': 'reference' if i == 1 else f'reference-{i}',
                 'num': 'Ref' if i == 1 else f'Ref{i}',
                 'path': p.relative_to(ROOT),
                 'meta': meta_of(p.relative_to(ROOT))})

# Map every on-disk href onto its in-bundle anchor.
routes = {}
for d in docs[:lesson_count]:
    name = d['path'].name
    routes[name] = '#' + d['id']
    routes['../lessons/' + name] = '#' + d['id']
for d in docs[lesson_count:]:
    name = d['path'].name
    routes[name] = '#' + d['id']
    routes['../reference/' + name] = '#' + d['id']
    routes['../reference/' + name + '#'] = '#' + d['id']


def rewrite(markup):
    for href, anchor in routes.items():
        markup = markup.replace(f'href="{href}"', f'href="{anchor}"')
    # These two live in the repo as Markdown and aren't part of the bundle.
    markup = re.sub(r'<a href="\.\./(MISSION|RESOURCES)\.md">([^<]*)</a>',
                    r'<span class="nav-off">\2 — in the repo</span>', markup)
    # Leaving the bundle should open a new tab, not lose the reader's place.
    markup = markup.replace('<a href="http', '<a target="_blank" rel="noopener" href="http')
    return markup


# ---- theme tokens ----------------------------------------------------------
# lesson.css only handles the un-stamped prefers-color-scheme case. A host that
# offers an explicit light/dark choice stamps data-theme on :root instead, so
# mirror the same token sets into both stamped states — without editing their
# stylesheet, which still has to stand alone for a single lesson opened direct.
css = read('assets/lesson.css')
light_tokens = re.search(r':root \{\n(.*?)\n\}', css, re.S).group(1)
dark_tokens = re.search(
    r'@media \(prefers-color-scheme: dark\) \{\n  :root \{\n(.*?)\n  \}', css, re.S).group(1)
dark_tokens = re.sub(r'^    ', '  ', dark_tokens, flags=re.M)

theme_fix = f""":root[data-theme="dark"] {{
{dark_tokens}
}}
@media (prefers-color-scheme: dark) {{
  :root[data-theme="light"] {{
{light_tokens}
  }}
}}"""

# ---- contents --------------------------------------------------------------
def toc_entry(d):
    m = d['meta']
    # Values come straight out of HTML, so they are already escaped.
    title = m['title'].split('—', 1)[-1].strip() if '—' in m['title'] else m['title']
    duration = ''
    if '·' in m['eyebrow']:
        duration = m['eyebrow'].split('·', 1)[1].strip()
    tail = ' · '.join(x for x in (duration, m['skill']) if x)
    return f"""      <a class="toc-item" href="#{d['id']}">
        <span class="toc-num">{d['num']}</span>
        <span class="toc-body">
          <span class="toc-title">{title}</span>
          <span class="toc-dek">{m['dek']}</span>
          <span class="toc-meta">{tail}</span>
        </span>
      </a>"""


def toc_ghost(num, title, dek, note):
    return f"""      <div class="toc-item toc-ghost" aria-disabled="true">
        <span class="toc-num">{num}</span>
        <span class="toc-body">
          <span class="toc-title">{title}</span>
          <span class="toc-dek">{dek}</span>
          <span class="toc-meta">not written yet · {note}</span>
        </span>
      </div>"""


def toc_break(label):
    return f'      <div class="toc-break"><span>{label}</span></div>'


def section(rows):
    return chr(10).join(r for r in rows if r)


eng_docs = [d for d in docs[:lesson_count] if d['track'] == 'eng']
des_docs = [d for d in docs[:lesson_count] if d['track'] == 'design']
ref_docs = docs[lesson_count:]

# Each track carries its own road ahead directly under its own shipped lessons.
# The design track is meant to be readable from D001 with none of the numbered
# lessons behind it, so its unwritten rows have to be findable without scrolling
# through an engineering backlog first.
toc_rows = section([
    section(toc_entry(d) for d in eng_docs),
    toc_break('Still to write \u00b7 engineering track'),
    section(toc_ghost(*x) for x in PLANNED_ENG),

    toc_break('The design track') if des_docs else '',
    section(toc_entry(d) for d in des_docs),
    toc_break('Still to write \u00b7 design track'),
    section(toc_ghost(*x) for x in PLANNED_DES),

    toc_break('Reference sheets'),
    section(toc_entry(d) for d in ref_docs),
    section(toc_ghost(*x) for x in PLANNED_REF),
])

contents = f"""<div class="page">
  <header class="masthead cover">
    <p class="eyebrow">Interactive course · {lesson_count} lessons · {len(docs) - lesson_count} references · {len(PLANNED)} more planned</p>
    <h1>Defensible&nbsp;Motion</h1>
    <p class="dek">Name what a well-made site is doing, rebuild it, and defend every timing
      decision out loud.</p>
  </header>

  <p class="lead">Every number in these lessons is a knob. Drag it, retype it, break it — the
  reading is the smaller half.</p>

  <nav class="toc">
{toc_rows}
  </nav>

  <p class="sidenote-static">The faded rows are the road ahead, not a promise — the order moves
  when a lesson turns out to depend on one further down. Say so if you want something pulled
  forward. Bundled from the working files on {BUILT}. Editing the CSS in a
  playground affects only this page, and nothing you change here is saved back to the
  repo.</p>
</div>"""

# ---- shell -----------------------------------------------------------------
def chip(d):
    return (f'      <a class="chip" href="#{d["id"]}" data-chip="{d["id"]}">'
            f'<b>{d["num"]}</b><span>{d["meta"]["title"].split("—", 1)[-1].strip()}</span></a>')


def chip_group(label):
    # Invisible in the horizontal bar, a section heading in the left column.
    return f'      <span class="chip-group">{label}</span>'


chips = '\n'.join([
    chip_group('Engineering'),
    *[chip(d) for d in eng_docs],
    *([chip_group('Design')] + [chip(d) for d in des_docs] if des_docs else []),
    chip_group('Reference'),
    *[chip(d) for d in ref_docs],
])

shell_css = """
/* ---------- bundle chrome ---------- */
/* Only additive: everything below styles navigation that doesn't exist in the
   single-file lessons. Prose styling stays entirely lesson.css's job. */
.rail {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: stretch; gap: 0;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--rule);
}
.rail-home {
  flex: none;
  display: grid; place-items: center;
  padding: 0 0.7rem 0 0.95rem;
  font-family: var(--sans); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--ink-faint); text-decoration: none; border: 0;
  border-right: 1px solid var(--rule);
}
.rail-home:hover { background: var(--paper-sunk); color: var(--accent); }
.rail-scroll {
  display: flex; gap: 0; overflow-x: auto; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.rail-scroll::-webkit-scrollbar { display: none; }
.chip {
  flex: none;
  display: flex; align-items: baseline; gap: 0.4rem;
  padding: 0.75rem 0.85rem;
  font-family: var(--sans); font-size: 0.78rem;
  color: var(--ink-soft); text-decoration: none; border: 0;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 140ms var(--ease-out-strong),
              border-color 140ms var(--ease-out-strong);
}
.chip b {
  font-family: var(--mono); font-size: 0.7rem; font-weight: 600;
  color: var(--ink-faint);
}
.chip:hover { background: var(--paper-sunk); }
/* Grey, not accent. The accent is the course's link colour and its emphasis
   colour; spending it on "you are here" made the nav shout over the prose. */
.chip[aria-current="true"] {
  color: var(--ink); background: var(--paper-sunk);
  border-bottom-color: var(--ink-faint);
}
.chip[aria-current="true"] b { color: var(--ink-soft); }
.rail-inner { display: contents; }
.rail-top { display: contents; }
.rail-toggle { display: none; }
.chip:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.chip-group { display: none; }

/* ---------- the rail as a left column ---------- */
/* The breakpoint is 1180px rather than 1000px because the column has to stay
   wide enough for a full-bleed lab: .page is 68ch plus 3rem of padding, and a
   full-bleed lab adds 13rem on top of that — about 830px of content before the
   rail takes its 16.5rem. Narrower than that and the rail stays a top bar,
   which is exactly what it was before. */
@media (min-width: 1180px) {
  .shell {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
    align-items: stretch;
  }
  .shell[data-rail="collapsed"] { grid-template-columns: 3.6rem minmax(0, 1fr); }
  .rail {
    display: block;
    /* Full height of the page, so the column reads as a piece of furniture the
       document sits next to rather than a block that runs out. */
    align-self: stretch;
    /* Sticky, so the contents list follows you down a long lesson. An embedding
       that sizes its frame to full content height never scrolls, and there this
       just parks at the top of its column — which is fine, because .doc-end
       carries navigation at the end of every document and nothing depends on
       the rail staying reachable. */
    border-bottom: 0; border-right: 1px solid var(--rule);
    background: var(--paper-sunk); backdrop-filter: none;
  }
  /* The rail element is full height; its contents stick to the top of it, so
     the list follows you down a long lesson. See the note above for what
     happens where the frame itself never scrolls. */
  .rail-inner {
    display: block; position: sticky; top: 0;
    max-height: 100vh; overflow-y: auto; scrollbar-width: thin;
    padding-bottom: 2rem;
  }
  .rail-top {
    display: flex; align-items: stretch; justify-content: space-between;
    border-bottom: 1px solid var(--rule);
  }
  .rail-home {
    display: flex; align-items: center; place-items: initial;
    padding: 1.5rem 0.6rem 0.85rem 1.15rem;
    border-right: 0; border-bottom: 0;
  }
  .rail-toggle {
    display: block; flex: none; cursor: pointer;
    margin: 1.15rem 0.7rem 0.5rem 0;
    width: 1.7rem; height: 1.7rem; padding: 0;
    border: 1px solid var(--rule); border-radius: 6px;
    background: var(--paper); color: var(--ink-faint);
    font: 600 0.8rem/1 var(--sans);
  }
  .rail-toggle::before { content: "‹‹"; }
  .rail-toggle:hover { color: var(--ink); border-color: var(--ink-faint); }
  .rail-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .rail-scroll { display: block; overflow: visible; padding: 0.55rem 0 0; }
  .chip {
    display: grid; grid-template-columns: 2.6rem minmax(0, 1fr);
    gap: 0.5rem; align-items: baseline;
    padding: 0.42rem 1.1rem 0.42rem 0.95rem;
    border-bottom: 0; border-left: 2px solid transparent;
    white-space: normal; line-height: 1.3;
    font-size: 0.86rem;
  }
  .chip[aria-current="true"] {
    border-bottom-color: transparent; border-left-color: var(--ink-faint);
    background: var(--paper); color: var(--ink);
  }
  .chip b { text-align: right; font-size: 0.76rem; }
  .chip-group {
    display: block;
    padding: 1.15rem 1.1rem 0.3rem 0.95rem;
    font: 700 0.64rem/1.4 var(--sans);
    letter-spacing: 0.13em; text-transform: uppercase;
    color: var(--ink-faint);
  }
  .chip-group:first-child { padding-top: 0.4rem; }

  /* Collapsed: the numbers alone. Still a full index — every document is one
     click away — but 3.6rem wide, which is what gives a margin sidenote its
     room back on a 1400px screen. */
  .shell[data-rail="collapsed"] .rail-home,
  .shell[data-rail="collapsed"] .chip span,
  .shell[data-rail="collapsed"] .chip-group { display: none; }
  .shell[data-rail="collapsed"] .rail-top { justify-content: center; }
  .shell[data-rail="collapsed"] .rail-toggle { margin: 1.15rem 0 0.5rem; }
  .shell[data-rail="collapsed"] .rail-toggle::before { content: "››"; }
  .shell[data-rail="collapsed"] .chip {
    grid-template-columns: minmax(0, 1fr); gap: 0;
    padding: 0.42rem 0.2rem; justify-items: center;
  }
  .shell[data-rail="collapsed"] .chip b { text-align: center; }

  /* The column, not the window, is what decides whether a margin sidenote fits
     — and with a collapsible rail the column changes width without the window
     moving. lesson.css queries this container. */
  .docs { min-width: 0; container-type: inline-size; }
}
@media (max-width: 1179.98px) {
  /* Below the two-column breakpoint the rail is the old horizontal bar, and the
     collapse state must not leak into it. */
  .docs { container-type: inline-size; }
}

.doc[hidden] { display: none; }
.doc .page { padding-top: 2.5rem; }

/* ---------- contents ---------- */
.cover { border-bottom: 1px solid var(--rule); }
.cover h1 { font-size: 2.8rem; }
.toc { display: grid; gap: 0; margin: 2rem 0 3rem; border-top: 1px solid var(--rule); }
.toc-item {
  display: grid; grid-template-columns: 3.2rem minmax(0, 1fr);
  gap: 0.4rem; align-items: start;
  padding: 1.15rem 0.5rem 1.15rem 0;
  border: 0; border-bottom: 1px solid var(--rule);
  text-decoration: none; color: var(--ink);
  transition: background-color 160ms var(--ease-out-strong);
}
.toc-item:hover { background: var(--paper-sunk); }
.toc-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.toc-num {
  font-family: var(--mono); font-size: 0.8rem; font-weight: 600;
  color: var(--accent); padding-top: 0.35rem;
  font-variant-numeric: tabular-nums;
}
.toc-body { display: grid; gap: 0.25rem; }
.toc-title { font-size: 1.24rem; line-height: 1.25; }
.toc-dek {
  font-family: var(--sans); font-size: 0.84rem; line-height: 1.5;
  color: var(--ink-soft);
}
.toc-meta {
  font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint);
  letter-spacing: 0.01em;
}
.sidenote-static {
  font-family: var(--sans); font-size: 0.76rem; line-height: 1.5;
  color: var(--ink-faint);
  border-top: 1px solid var(--rule); padding-top: 0.7rem;
}
.nav-off { color: var(--ink-faint); }

/* ---------- the road ahead ---------- */
/* Faded rather than hidden: seeing what is left is the point, and a row that
   keeps sitting here is a visible reminder that it keeps being deferred. */
.toc-break {
  display: grid; grid-template-columns: 3.2rem minmax(0, 1fr); gap: 0.4rem;
  padding: 1.5rem 0.5rem 0.55rem 0;
  border-bottom: 1px solid var(--rule);
}
.toc-break span {
  grid-column: 2;
  font-family: var(--sans); font-size: 0.66rem; font-weight: 600;
  letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink-faint);
}
.toc-ghost {
  opacity: 0.55;
  border-bottom-style: dashed;
  cursor: default;
}
.toc-ghost:hover { background: transparent; }
.toc-ghost .toc-num { color: var(--ink-faint); }
.toc-ghost .toc-title { color: var(--ink-soft); }
.toc-ghost .toc-meta { font-style: italic; }

/* ---------- end-of-document navigation ---------- */
/* The rail is sticky, but sticky needs a scrolling frame, and it never engages
   where the page is sized to its own full height — printing, or any embedding
   that does the same. The reader at the bottom of lesson 0009 would have nothing
   to click. This bar is the answer: static, always at the end, works anywhere. */
.doc .page { padding-bottom: 3rem; }
.doc-end {
  max-width: 68ch;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem;
  /* No font-family here on purpose: the 68ch above has to resolve in the same
     serif .page measures in, or the bar sits wider than the prose it follows.
     The sans lives on .de-btn instead. */
}
.doc-end > :first-child { margin-right: auto; }
.de-btn {
  display: inline-flex; align-items: center;
  font-family: var(--sans);
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--rule); border-radius: 999px;
  background: var(--paper);
  font-size: 0.8rem; line-height: 1;
  color: var(--ink-soft); text-decoration: none;
  transition: color 140ms var(--ease-out-strong),
              border-color 140ms var(--ease-out-strong),
              background-color 140ms var(--ease-out-strong);
}
.de-btn:hover { background: var(--paper-sunk); color: var(--accent); border-color: var(--accent); }
.de-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.de-home {
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.11em; text-transform: uppercase;
}
.de-next { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.de-spacer { margin-right: auto; }

@media print { .doc-end { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .chip, .toc-item, .de-btn { transition-duration: 0.01ms; }
}
"""

shell_js = """
(() => {
  const KEY = 'defensible-motion:last';
  const docs = [...document.querySelectorAll('.doc')];
  const chips = [...document.querySelectorAll('[data-chip]')];
  const ids = docs.map((d) => d.id);

  function show(id, push) {
    if (!ids.includes(id)) id = 'contents';
    docs.forEach((d) => { d.hidden = d.id !== id; });
    chips.forEach((c) => c.setAttribute('aria-current', String(c.dataset.chip === id)));
    if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    window.scrollTo(0, 0);
    // Storage throws outright in some embedded contexts, so never let a
    // failed write stop navigation.
    try { localStorage.setItem(KEY, id); } catch (e) { /* no-op */ }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!ids.includes(id)) return;
    e.preventDefault();
    show(id, true);
  });

  // In-page anchors (a sheet's own index) are not document ids. Letting them
  // fall through to show() would silently kick the reader back to Contents.
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (!ids.includes(id)) return;
    show(id, false);
  });

  const RAIL_KEY = 'defensible-motion:rail';
  const shell = document.querySelector('.shell');
  const railToggle = document.querySelector('[data-rail-toggle]');

  function setRail(state) {
    shell.dataset.rail = state;
    const open = state !== 'collapsed';
    railToggle.setAttribute('aria-expanded', String(open));
    railToggle.setAttribute('aria-label', open ? 'Collapse contents' : 'Expand contents');
    try { localStorage.setItem(RAIL_KEY, state); } catch (e) { /* no-op */ }
  }

  let rail = 'open';
  try { rail = localStorage.getItem(RAIL_KEY) || 'open'; } catch (e) { /* no-op */ }
  setRail(rail);
  railToggle.addEventListener('click',
    () => setRail(shell.dataset.rail === 'collapsed' ? 'open' : 'collapsed'));

  let start = location.hash.slice(1);
  if (!ids.includes(start)) {
    try { start = localStorage.getItem(KEY) || 'contents'; } catch (e) { start = 'contents'; }
  }
  show(start, false);
})();
"""

parts = [
    '<title>Defensible Motion</title>',
    '<style>\n' + css + '\n' + theme_fix + '\n' + shell_css + '</style>',
    '<div class="shell">',
    '<nav class="rail">',
    '  <div class="rail-inner">',
    '    <div class="rail-top">',
    '      <a class="rail-home" href="#contents">Contents</a>',
    '      <button class="rail-toggle" type="button" data-rail-toggle'
    ' aria-expanded="true" aria-label="Collapse contents"></button>',
    '    </div>',
    '    <div class="rail-scroll">',
    chips,
    '    </div>',
    '  </div>',
    '</nav>',
    '<main class="docs">',
    '<article class="doc" id="contents">' + contents + '</article>',
]
def short_title(d):
    return d['meta']['title'].split('—', 1)[-1].strip()


def doc_end(i):
    """Prev / Contents / Next, at the end of every document."""
    prev_d = docs[i - 1] if i > 0 else None
    next_d = docs[i + 1] if i + 1 < len(docs) else None
    row = [f'<a class="de-btn" href="#{prev_d["id"]}">← {short_title(prev_d)}</a>'
           if prev_d else '<span class="de-spacer"></span>',
           '<a class="de-btn de-home" href="#contents">↑ Contents</a>']
    if next_d:
        row.append(f'<a class="de-btn de-next" href="#{next_d["id"]}">{short_title(next_d)} →</a>')
    return '<nav class="doc-end" aria-label="Course navigation">' + ''.join(row) + '</nav>'


for i, d in enumerate(docs):
    parts.append(f'<article class="doc" id="{d["id"]}" hidden>')
    parts.append(rewrite(body_of(d['path'])))
    parts.append(doc_end(i))
    parts.append('</article>')

parts.append('</main>')
parts.append('</div>')

for a in ASSETS:
    # A literal </script> anywhere in the source would end the tag early.
    parts.append('<script>\n' + read('assets/' + a).replace('</script', r'<\/script') + '\n</script>')
parts.append('<script>' + shell_js + '</script>')

OUT.parent.mkdir(exist_ok=True)
OUT.write_text('\n'.join(parts) + '\n')
print(f'wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size // 1024} KB, {len(docs)} documents)')

# The same bytes again as site/index.html, which is the whole static site: one file,
# no build step, no dependencies. dist/ is not deployable as-is because it also holds
# .course.prev.html, the copy the diff check runs against.
SITE = ROOT / 'site'
SITE.mkdir(exist_ok=True)
(SITE / 'index.html').write_text(OUT.read_text())
print(f'wrote site/index.html          (deploy this directory)')
