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
    ('D10', 'Navigation and page transitions',
     'The where-am-I problem. Menu overlays, shared elements, and continuity as orientation.',
     'next in this track · may fold into 0011 instead'),
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
          'wait-lab.js', 'optimistic-lab.js',
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

theme_fix = f""":root {{ color-scheme: light; }}
@media (prefers-color-scheme: dark) {{ :root {{ color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  color-scheme: dark;
{dark_tokens}
}}
:root[data-theme="light"] {{ color-scheme: light; }}
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


def toc_group(label, count, rows):
    # <details>, not a scripted accordion: it collapses with no JS, it is
    # keyboard- and screen-reader-correct for free, and find-in-page opens it.
    # Shut by default so the three tracks are all visible at once — the first
    # thing this page has to answer is what kinds of thing are in here.
    return f"""      <details class="toc-group">
        <summary class="toc-sum">
          <span class="toc-caret" aria-hidden="true"></span>
          <span class="toc-sum-body">
            <span class="toc-sum-title">{label}</span>
            <span class="toc-sum-count">{count}</span>
          </span>
        </summary>
        <div class="toc-list">
{rows}
        </div>
      </details>"""


def section(rows):
    return chr(10).join(r for r in rows if r)


eng_docs = [d for d in docs[:lesson_count] if d['track'] == 'eng']
des_docs = [d for d in docs[:lesson_count] if d['track'] == 'design']
ref_docs = docs[lesson_count:]

# Each track carries its own road ahead directly under its own shipped lessons.
# The design track is meant to be readable from D001 with none of the numbered
# lessons behind it, so its unwritten rows have to be findable without scrolling
# through an engineering backlog first.
def count(shipped, planned, noun):
    tail = f' \u00b7 {planned} planned' if planned else ''
    return f'{shipped} {noun}{tail}'


# Design first. It is the track with no prerequisites — a designer can open D001
# having read none of the numbered lessons — so it is the one that should be
# reachable without scrolling past somebody else's backlog.
toc_rows = section([
    toc_group('The design track', count(len(des_docs), len(PLANNED_DES), 'lessons'), section([
        section(toc_entry(d) for d in des_docs),
        toc_break('Still to write'),
        section(toc_ghost(*x) for x in PLANNED_DES),
    ])) if des_docs else '',

    toc_group('The engineering track', count(len(eng_docs), len(PLANNED_ENG), 'lessons'), section([
        section(toc_entry(d) for d in eng_docs),
        toc_break('Still to write'),
        section(toc_ghost(*x) for x in PLANNED_ENG),
    ])),

    toc_group('Reference sheets', count(len(ref_docs), len(PLANNED_REF), 'sheets'), section([
        section(toc_entry(d) for d in ref_docs),
        section(toc_ghost(*x) for x in PLANNED_REF),
    ])),
])

contents = f"""<div class="page">
  <header class="masthead cover">
    <p class="eyebrow">Interactive course · {lesson_count} lessons · {len(docs) - lesson_count} references · {len(PLANNED)} more planned</p>
    <h1>Defensible&nbsp;Motion</h1>
  </header>

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
  flex: none; order: 1;
  display: grid; place-items: center;
  padding: 0 0.7rem 0 0.95rem;
  font-family: var(--sans); font-size: 0.68rem; font-weight: 700;
  letter-spacing: 0.11em; text-transform: uppercase; white-space: nowrap;
  color: var(--ink-faint); text-decoration: none; border: 0;
  border-right: 1px solid var(--rule);
}
.rail-home:hover { background: var(--paper-sunk); color: var(--accent); }
/* The theme control is the last thing in the rail's DOM so that it can pin to
   the bottom of the left column. In the top bar `order` brings it back to the
   far right, past the scrolling chips. */
.rail-foot {
  order: 3; flex: none; margin-left: auto;
  display: flex; align-items: center;
  padding: 0 0.6rem; border-left: 1px solid var(--rule);
}
.rail-btn {
  flex: none; display: grid; place-items: center; cursor: pointer;
  width: 1.85rem; height: 1.85rem; padding: 0;
  border: 0; border-radius: 7px;
  background: none; color: var(--ink-faint);
  transition: color 140ms var(--ease-out-strong);
}
.rail-btn:hover { color: var(--ink); }
.rail-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Sun and moon are drawn, not set in a glyph: U+2600 and U+263E render as
   colour emoji on some platforms, as tofu on others, and neither would take
   currentColor. The icon shows the theme you would GET, which is the thing a
   reader is deciding about. */
.theme-icon {
  display: block; width: 14px; height: 14px; border-radius: 50%;
  transition: box-shadow 200ms var(--ease-out-strong),
              width 200ms var(--ease-out-strong),
              height 200ms var(--ease-out-strong);
}
.theme-toggle[data-icon="dark"] .theme-icon {
  box-shadow: inset -4px -1.5px 0 0 currentColor;
}
.theme-toggle[data-icon="light"] .theme-icon {
  width: 8px; height: 8px; background: currentColor;
  box-shadow: 0 -5.5px 0 -2.6px currentColor,  0 5.5px 0 -2.6px currentColor,
              -5.5px 0 0 -2.6px currentColor,  5.5px 0 0 -2.6px currentColor,
              3.9px 3.9px 0 -2.6px currentColor, -3.9px -3.9px 0 -2.6px currentColor,
              3.9px -3.9px 0 -2.6px currentColor, -3.9px 3.9px 0 -2.6px currentColor;
}

/* One caret, drawn rather than set in a glyph: U+2039 renders at a different
   weight in every fallback font and would not take currentColor. Open and shut
   are the same mark at two rotations, so the change reads as the caret turning
   to point the way the panel will travel — not as two icons swapping. */
.rail-icon {
  display: block; width: 8px; height: 8px;
  border-left: 1.6px solid currentColor;
  border-bottom: 1.6px solid currentColor;
  /* translate runs in the caret's own rotated frame, so this 1.4px nudge
     optically centres the apex in both directions without a second rule. */
  transform: rotate(45deg) translate(1px, -1px);
  transition: transform 320ms var(--ease-drawer);
}
.shell[data-rail="collapsed"] .rail-icon {
  transform: rotate(225deg) translate(1px, -1px);
}

.rail-scroll {
  order: 2; flex: 1 1 auto; min-width: 0;
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
/* No collapsing below the two-column breakpoint — there is nothing to collapse
   into. The theme control stays; it is useful at every width. */
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
    /* The panel slides. Animating a grid track is a layout animation and the
       course spends lesson 0002 arguing against exactly that — so this is a
       deliberate exception, and worth naming: it is chrome rather than content,
       it runs once per click rather than continuously, and only one <article>
       is ever un-hidden, so the reflow is a single document wide. A transform
       would be cheaper but would not push the prose over, and the prose moving
       is the whole point of a rail that takes room rather than covering it. */
    transition: grid-template-columns 320ms var(--ease-drawer);
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
  /* A column: masthead, the list taking whatever is left, the theme control
     pinned to the floor. The list is the only part that scrolls, so the title
     and the control stay reachable from anywhere in a long index. */
  .rail-inner {
    display: flex; flex-direction: column; position: sticky; top: 0;
    height: 100vh; overflow: hidden;
  }
  .rail-top {
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.45rem; padding: 1.1rem 0.55rem 0.9rem 0.95rem;
    border-bottom: 1px solid var(--rule);
  }
  .rail-home {
    display: block; place-items: initial;
    padding: 0; border-right: 0; border-bottom: 0;
    font-family: var(--serif); font-size: 1.05rem; font-weight: 600;
    letter-spacing: 0; text-transform: none; color: var(--ink);
    order: 0; max-width: 11rem; overflow: hidden;
    transition: max-width 320ms var(--ease-drawer),
                opacity 180ms var(--ease-out-strong);
  }
  .rail-home:hover { background: none; color: var(--accent); }
  .rail-toggle { display: grid; order: 1; }
  .rail-scroll {
    order: 0; flex: 1 1 auto; min-height: 0;
    display: block; overflow-y: auto; overflow-x: hidden;
    scrollbar-width: thin; padding: 0.55rem 0 1.5rem;
  }
  /* overflow-x is what makes the slide work: nothing is switched off on
     collapse, the labels keep their layout and simply travel out past the edge
     of a narrower column. The reveal is one continuous movement of the whole
     list rather than text popping in when the animation lands. */
  .rail-foot {
    order: 0; flex: none; margin-left: 0;
    justify-content: center; padding: 0.6rem;
    border-left: 0; border-top: 1px solid var(--rule);
  }
  .chip {
    display: grid; grid-template-columns: 2.6rem minmax(0, 1fr);
    gap: 0.5rem; align-items: baseline;
    padding: 0.42rem 1.1rem 0.42rem 0.95rem;
    border-bottom: 0; border-left: 2px solid transparent;
    white-space: normal; line-height: 1.3;
    font-size: 0.86rem;
    transition: padding-left 320ms var(--ease-drawer),
                color 140ms var(--ease-out-strong),
                border-color 140ms var(--ease-out-strong);
  }
  .chip span, .chip-group {
    transition: opacity 200ms var(--ease-out-strong);
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
     room back on a 1400px screen. The labels are faded, never display:none,
     so that opening the rail slides them in from behind the edge; and every
     row keeps its height, so the list does not jump vertically either way. */
  .shell[data-rail="collapsed"] .rail-home { max-width: 0; opacity: 0; }
  .shell[data-rail="collapsed"] .chip span,
  .shell[data-rail="collapsed"] .chip-group { opacity: 0; }
  .shell[data-rail="collapsed"] .chip span { white-space: nowrap; }
  /* gap: 0 matters — the zero-width title is still a flex item, so the row's
     gap would otherwise shove the lone caret 3.6px off the rail's centre line
     and out of column with the numbers below it. */
  .shell[data-rail="collapsed"] .rail-top {
    justify-content: center; gap: 0;
    padding-left: 0.5rem; padding-right: 0.5rem;
  }
  /* Centred, not right-aligned: 2px border + 0.375rem + half of the 2.6rem
     number column lands on 1.8rem, the middle of the 3.6rem rail. Right-align
     would also stagger "01" against "D01", which reads as a ragged edge. */
  .shell[data-rail="collapsed"] .chip { padding-left: 0.375rem; padding-right: 0; }
  .shell[data-rail="collapsed"] .chip b { text-align: center; }
  /* A thin scrollbar costs ~11px, which out of 3.6rem is enough to clip the
     numbers it exists to help you read. Collapsed, the list scrolls bare. */
  .shell[data-rail="collapsed"] .rail-scroll { scrollbar-width: none; }

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

/* The stance 0009 demands, stated for the chrome as well as the labs: the rail
   slide is a 300ms relayout of the entire visible document, which is the single
   largest-area movement anywhere on the page. It is also the one piece of motion
   here that carries no information — the destination is the whole point of the
   control, and arriving instantly loses nothing. So it goes, completely, rather
   than being shortened. The theme change was never animated for the same reason:
   a whole page cross-fading its background is worse than a page that has simply
   changed. */
@media (prefers-reduced-motion: reduce) {
  .shell, .rail-home, .chip, .chip span, .chip-group,
  .rail-icon, .theme-icon {
    transition: none;
  }
}

.doc[hidden] { display: none; }
.doc .page { padding-top: 2.5rem; }

/* ---------- contents ---------- */
.cover { border-bottom: 1px solid var(--rule); }
.cover h1 { font-size: 2.8rem; }
/* No border-top: the cover already closes on a rule, and with the dek gone the
   two lines sat an empty 2rem apart with nothing between them. */
.toc { display: grid; gap: 0; margin: 1.7rem 0 2rem; }

/* ---------- the three tracks, shut ---------- */
.toc-group { border-bottom: 1px solid var(--rule); }
.toc-sum {
  display: grid; grid-template-columns: 3.2rem minmax(0, 1fr);
  gap: 0.4rem; align-items: center;
  padding: 1.3rem 0.5rem 1.3rem 0;
  cursor: pointer; list-style: none;
  transition: background-color 160ms var(--ease-out-strong);
}
/* Both are needed: `list-style` covers the standards marker, the pseudo covers
   the older WebKit triangle, and either one left in place would sit beside the
   caret this row draws for itself. */
.toc-sum::-webkit-details-marker { display: none; }
.toc-sum:hover { background: var(--paper-sunk); }
.toc-sum:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
/* The rule under the summary only exists while the group is open, where it
   separates the heading from its own lessons. Shut, the group's own bottom
   border is already doing that job and a second line would double up. */
.toc-group[open] > .toc-sum { border-bottom: 1px solid var(--rule); }
.toc-list > :last-child { border-bottom: 0; }

/* Same drawn caret as the rail's, at the two rotations a disclosure wants:
   right when shut, down when open. Rotating rather than swapping glyphs keeps
   it one mark turning to point where the content will appear. */
.toc-caret {
  justify-self: start; margin-left: 0.15rem;
  display: block; width: 8px; height: 8px;
  border-left: 1.7px solid var(--accent);
  border-bottom: 1.7px solid var(--accent);
  transform: rotate(225deg) translate(1px, -1px);
  transition: transform 260ms var(--ease-out-strong);
}
.toc-group[open] > .toc-sum .toc-caret {
  transform: rotate(315deg) translate(1px, -1px);
}

.toc-sum-body { display: grid; gap: 0.25rem; }
.toc-sum-title { font-size: 1.34rem; line-height: 1.2; }
.toc-sum-count {
  font-family: var(--sans); font-size: 0.72rem; color: var(--ink-faint);
  letter-spacing: 0.01em;
}

/* Print gets everything. A collapsed group on paper is a group that does not
   exist, and the contents page is the one sheet worth printing whole. */
@media print {
  .toc-caret { display: none; }
  .toc-sum { padding-bottom: 0.4rem; }
}
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
/* No rule of its own: the contents list already closes on one, and with three
   collapsed groups the two lines sat close enough to read as a mistake. */
.sidenote-static {
  font-family: var(--sans); font-size: 0.76rem; line-height: 1.5;
  color: var(--ink-faint);
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
  /* The caret loses its turn, not its two positions — which way it points is
     the state, and the state stays. Only the travel between them goes. */
  .chip, .toc-item, .toc-sum, .toc-caret, .de-btn { transition-duration: 0.01ms; }
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

  // ---- theme ----------------------------------------------------------
  // The <head> script has already stamped an explicit choice, if there was one.
  // Until the reader makes one, nothing is stamped and the OS setting rules —
  // including if it changes while the page is open, which is why the icon is
  // repainted on the media query rather than only on click.
  const THEME_KEY = 'defensible-motion:theme';
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');

  function effectiveTheme() {
    const stamped = document.documentElement.dataset.theme;
    if (stamped === 'dark' || stamped === 'light') return stamped;
    return darkQuery.matches ? 'dark' : 'light';
  }

  function paintThemeToggle() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    themeToggle.dataset.icon = next;
    themeToggle.setAttribute('aria-label', 'Switch to the ' + next + ' theme');
  }

  themeToggle.addEventListener('click', () => {
    document.documentElement.dataset.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
    paintThemeToggle();
    try { localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme); }
    catch (e) { /* no-op */ }
  });
  darkQuery.addEventListener('change', paintThemeToggle);
  paintThemeToggle();

  const RAIL_KEY = 'defensible-motion:rail';
  const shell = document.querySelector('.shell');
  const railToggle = document.querySelector('[data-rail-toggle]');

  function setRail(state) {
    shell.dataset.rail = state;
    const open = state !== 'collapsed';
    railToggle.setAttribute('aria-expanded', String(open));
    railToggle.setAttribute('aria-label', open ? 'Collapse contents' : 'Open contents');
    try { localStorage.setItem(RAIL_KEY, state); } catch (e) { /* no-op */ }
  }

  let rail = 'open';
  try { rail = localStorage.getItem(RAIL_KEY) || 'open'; } catch (e) { /* no-op */ }
  setRail(rail);
  railToggle.addEventListener('click',
    () => setRail(shell.dataset.rail === 'collapsed' ? 'open' : 'collapsed'));

  /* CSS cannot force a <details> open, and a shut group prints as a group that
     is not there. Open them all for the print, put them back afterwards. */
  let printed = [];
  window.addEventListener('beforeprint', () => {
    printed = [...document.querySelectorAll('.toc-group:not([open])')];
    printed.forEach((d) => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printed.forEach((d) => { d.open = false; });
    printed = [];
  });

  let start = location.hash.slice(1);
  if (!ids.includes(start)) {
    try { start = localStorage.getItem(KEY) || 'contents'; } catch (e) { start = 'contents'; }
  }
  show(start, false);
})();
"""

# Runs in <head>, before the first paint, so a reader who chose dark never sees
# a white page flash first. It only reads storage — the toggle's own logic lives
# in shell_js with the rest of the chrome.
theme_init = """(() => {
  try {
    const t = localStorage.getItem('defensible-motion:theme');
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
  } catch (e) { /* private mode throws on read; fall through to the OS setting */ }
})();"""

parts = [
    # A real document, not a fragment. Without a doctype the browser renders in
    # quirks mode, which changes the box model out from under every lesson.
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="description" content="A self-paced course on web animation '
    'and design engineering: 21 lessons, each with something to turn.">',
    '<title>Defensible Motion</title>',
    '<style>\n' + css + '\n' + theme_fix + '\n' + shell_css + '</style>',
    '<script>' + theme_init + '</script>',
    '</head>',
    '<body>',
    '<div class="shell">',
    '<nav class="rail">',
    '  <div class="rail-inner">',
    '    <div class="rail-top">',
    '      <a class="rail-home" href="#contents">Defensible Motion</a>',
    '      <button class="rail-btn rail-toggle" type="button" data-rail-toggle'
    ' aria-expanded="true" aria-label="Collapse contents">'
    '<span class="rail-icon"></span></button>',
    '    </div>',
    '    <div class="rail-scroll">',
    chips,
    '    </div>',
    '    <div class="rail-foot">',
    '      <button class="rail-btn theme-toggle" type="button" data-theme-toggle'
    ' aria-label="Switch theme"><span class="theme-icon"></span></button>',
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
parts.append('</body>')
parts.append('</html>')

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
