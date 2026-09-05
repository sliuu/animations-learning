# CLAUDE.md

A personal, self-paced course on web animation and design engineering, written *for*
Stephanie and *by* Claude. There is no app here. The deliverable is the teaching.

**Read `MISSION.md` and `NOTES.md` before writing anything.** `NOTES.md` is the important
one: it holds every teaching preference she has stated, the authoring rules earned from
lessons that didn't land, the lesson ledger, and the open questions. It is the accumulated
memory of this project and it is kept current — when a lesson teaches you something about
how to teach, that goes in `NOTES.md` before the session ends.

`NOTES.md` and `learning-records/` are **deliberately untracked** — they are candid working
notes, and the repo is public. They exist on Stephanie's machine only, so a fresh clone will
not have them and they have no backup but the working copy. Do not commit them, and do not
quote them into a tracked file.

## Layout

```
MISSION.md        why this exists, what success looks like, what's out of scope
NOTES.md          teaching preferences, authoring rules, ledger, questions (untracked)
RESOURCES.md      annotated external reading, grouped by topic, with known gaps called out
lessons/          NNNN-slug.html — the course, in order
reference/        printable sheets: judgment, numbers, the map, the workbench
assets/           lesson.css + one self-registering *-lab.js per interactive lab
tools/            build-course.py — bundles everything into dist/course.html
learning-records/ session records (untracked)
dist/course.html  the single-file bundle: the whole course, offline, in one file
site/index.html   the same bytes again — the deploy root (generated, gitignored)
```

## Hard constraints

- **Self-contained HTML.** One file, double-click to open, works offline. **No CDN
  dependencies in lessons, ever** — GSAP and Motion are taught conceptually for this reason.
- **Every lesson has a knob to turn.** Reading is not the point. A lesson without live
  editable values that produce instant visual feedback is not finished.
- **Clarity outranks the 10–15 minute guideline.** Longer is fine if longer is clearer.
- Level: moderate on design/CSS/Tailwind, weakest on React. Don't explain what a CSS
  property *is*; do explain why one property over another.

## Authoring rules

These are in `NOTES.md` with the full reasoning and the lesson that produced each one. The
short forms, because they are the ones violated most often:

- **Get to the knob fast** — ~250 words maximum before the first interactive element.
- **A comparison table is consolidation, never introduction.** She must have felt both
  things before being asked to compare them.
- **A demo that needs narration is a broken demo.** If the prose has to say what she just
  saw, fix the demo.
- **A knob has to do something the instant it is turned.** If the thing it switches is only
  visible under hover, focus or a held pointer, the lab demonstrates it on the spot — it does not
  wait for her to be holding the right thing. (D004's state switches were silent both ways.)
- **Let the demo drive itself** — give it a "do it for me" button so her attention is free
  for the thing being taught.
- **Check demos for layout jump**, not just for the animation being taught. Anything that
  reveals an element reveals it out of flow, or reserves its space.
- **Define sensory jargon before using it** — "chugging", "hitching", "smoothness".
- **A demo can carry the argument by breaking something**, faithfully, with the casualty
  on screen. No straw men.
- **When a failure is silent, the demo has to make it audible** — put a verdict line on
  screen naming what just happened.
- **Sequential A/B cannot teach a feeling.** If the claim is about how something *feels*,
  both things must be simultaneously reachable. A slider moved between the two halves of a
  comparison is not a comparison. (This is what broke lesson 0010 and how it was fixed.)
- **Blind first, reveal second** where a number is being argued for. And once sides are
  shuffled, *every sentence that names a side must ask which one it landed on* — hardcoded
  letters are wrong half the time.
- Each lesson reopens the previous lesson's core claim in its first minute.
- **A lesson may correct an earlier reference sheet, out loud** — name the sheet, say why,
  then edit the sheet. Never patch one silently.
- **A reference sheet is not a lesson summary.** Anything needing an argument to be
  believed stays in the lesson.

## Two tracks

`lessons/0001–0011` are the **engineering track**: here is a mechanism, here is how to tune
it. `lessons/D0NN` are the **design track**, added because the course had drifted
engineering-heavy *and* product-UI-heavy — it covers patterns and vocabulary in the language
designers use with each other, across three families: product UI, expressive page (scroll
systems, kinetic type, hero sequences), and direct manipulation (drag, swipe, decks).
Different rules apply to a `D` lesson: the knob is design-level (which element moves, which
edge it comes from) never a cubic-bezier coefficient; code is a collapsed "the CSS behind it"
disclosure rather than the body of the argument; and each opens with a **"Say it out loud"**
vocabulary box, because building a shared vocabulary is an explicit goal of the track, not a
side effect.

**The design track assumes no prior reading.** A designer can start at `D001` having read
none of `0001-0011`, and every claim still lands. This is a hard rule, and it has a specific
shape: an engineering reference is a **side note**, never a load-bearing sentence. Make the
point in full first, in design language; then name the lesson that argues it, set aside as an
aside for the reader who has that background. Never write a sentence whose meaning depends on
a callback — "why 0008 felt like it was solving a problem you didn't have" reads as a recall
to one reader and as a locked door to the other. The side notes are what ties the two tracks
together, so use them generously; they just never carry the argument.
See **The design track** in `NOTES.md` for the three families, the noun/verb/adjective
vocabulary system, the proposed lessons and the reasoning. Every authoring rule above still
applies to both tracks.

## Lesson file conventions

No `<html>`/`<head>`/`<body>` wrapper — the files start at `<meta charset>`. Structure:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NNNN — Title</title>
<link rel="stylesheet" href="../assets/lesson.css">
<div class="page">
  <header class="masthead">
    <p class="eyebrow">Lesson NNNN · N minutes</p>
    <h1>…</h1><p class="dek">…</p>
    <div class="meta"><span>Skill: …</span><span><a href="…">← Lesson NNNN-1</a></span></div>
  </header>
  <p class="lead">…</p>
  …
  <nav class="footer-nav"><h2>Course</h2><div class="nav-links">…</div></nav>
</div>
<script src="../assets/x-lab.js"></script>
```

`nav-links` **opens with the forward link** (`Lesson NNNN+1 — Title →`), then the previous
lessons in descending order, then the reference sheets, Mission, Resources, and finally the
faint `Next:` tease. The forward link kept getting dropped from 0008 onward and she noticed —
don't drop it.

Shared classes from `lesson.css`: `.page .masthead .eyebrow .dek .meta .lead .callout
.sidenote .stage .stage-head .stage-body .stage-foot .controls .control .control-label
.control-value .btn .btn.primary .wide .ask-teacher .footer-nav .nav-links`. Tokens:
`--ink --ink-soft --ink-faint --paper --paper-sunk --rule --accent --accent-soft --good
--bad --code-bg --ease-out-strong --ease-in-out-strong --ease-drawer --serif --sans --mono`.
Serif body, sans for controls and labels — that is the house style; match `press-lab.js`.

## Lab conventions (`assets/*-lab.js`)

Self-registering IIFE. `let uid = 0`. `injectStyles()` guarded by
`document.getElementById('x-lab-styles')`. Mounts on a `data-x-lab` attribute, honours a
`data-title` override. Prefixed class namespace (`.ck-`, `.pl-`). Segmented controls are
`.xx-seg` buttons with `aria-pressed`. Full-bleed at width:

```css
@media (min-width: 1000px) { width: calc(100% + 13rem); margin-left: -6.5rem; }
@media print { .xx-side, .xx-actions { display: none; } }
```

Take a deliberate `prefers-reduced-motion` stance in every lab and *comment why* — 0009 is
the lesson that earned this, so a lab that ignores it contradicts the course.

## Build and deploy

```bash
cp dist/course.html dist/.course.prev.html   # keep the last build to diff against
python3 tools/build-course.py                # → dist/course.html + site/index.html
diff dist/.course.prev.html dist/course.html | grep '^<'   # every removed line must be yours
```

New labs must be added to `ASSETS` in `tools/build-course.py` or they silently won't ship.
Bundle document ids are `contents`, `lesson-1`…`lesson-13`, `design-1`…`design-8`,
`reference`, `reference-2`…`-4`. Bump `BUILT` when shipping.

The course is a static site: **https://defensible-motion-design.stxphanie.com**, deployed
from `main` by Vercel. `vercel.json` runs the builder and serves `site/`, so **`git push` is
the whole publish step** — there is nothing to upload by hand. Both `dist/` and `site/` are
gitignored; they are generated wholesale from `lessons/`, `assets/` and `reference/`, and the
`diff` above is the safety check that a build only changed what you meant it to.

One CSS trap worth keeping, learned the hard way:

- **`ch` resolves against the element's own font.** A `max-width: 68ch` on an element that
  sets `font-family: var(--sans)` comes out wider than `.page`'s 68ch in the inherited serif.
  This is also why sidenotes position off `.page`'s right edge in rem and not in `ch`.

`.doc-end` — the static navigation bar at the end of every document — stays. The rail is
`position: sticky` and works in a browser, but the bar is what a reader at the bottom of a
long lesson actually reaches, and it is the only navigation that survives printing.

## Testing labs

Headless Chrome, with `--dump-dom` and a probe IIFE that waits for `load`:

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CH" --headless --disable-gpu --virtual-time-budget=2000 \
      --window-size=1200,900 --screenshot=out.png "file://$PWD/page.html"
```

Gotchas: `--virtual-time-budget` advances `setTimeout` but **freezes the animation clock**,
so it cannot drive view transitions; `--user-data-dir` on a fresh path makes headless hang;
macOS has no `timeout`. Verify pane heights are equal (no layout jump) and
`scrollWidth === clientWidth` (no overflow) as a matter of course, not just the effect
being taught.

## Working style

Verify, don't assume — measure with a probe rather than eyeballing a screenshot. When she
says a lesson didn't land, treat it as a demo problem before treating it as a prose problem;
that has been the right call every time so far. Ask which half is confusing before rewriting,
and don't widen the fix past what she scoped.
