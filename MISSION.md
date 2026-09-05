# Mission: Web Animation & Design Engineering

## Why

Stephanie wants to be the person who can look at a site like
[claude.com/claude-for-chrome](https://claude.com/claude-for-chrome) — where every element
arrives with intent — name exactly what it's doing, rebuild it, and know *why* those choices
are the right ones. The end state is craft: shipping interfaces whose motion feels
deliberate rather than decorated, and being able to defend every timing decision in a design
review.

## Success looks like

- Open any beautiful site, name the effects out loud with correct vocabulary, and reproduce
  the core of one in under 30 minutes.
- Build a landing page where the hero, sections, and cards orchestrate in on load and on
  scroll — and it feels expensive, not busy.
- Add motion to product UI (modals, drawers, toasts, tabs, press states) that makes the app
  feel *faster*, not slower.
- Answer "should this animate?" with a principled no, out loud, and say why.
- Look at someone else's animation and diagnose it: name the flaw, name the fix, name the
  principle the fix comes from.

## Constraints

- **10–15 minute sessions.** Every lesson must be completable in one sitting.
- **Self-contained HTML lessons.** No build step, no install. Double-click to open.
- **Starting point:** moderate design, CSS, and Tailwind. React is the weakest area — not a
  non-starter, but JS/React concepts need building up rather than assuming.
- Learn-by-changing: every lesson needs a knob to turn, not just a paragraph to read.

## Out of scope

- Canvas, WebGL, Three.js, shaders.
- SVG illustration authoring (animating existing SVG is in scope; drawing it is not).
- Full GSAP mastery. We name it, learn what it's for, and borrow its ideas — a deep dive
  only happens if a real project demands it.
- Backend, deployment, build tooling.

## Note on toolchains

The two north stars use *different* stacks, and that's deliberate:

| Reference | Actual stack |
| --- | --- |
| claude.com/claude-for-chrome | Webflow + GSAP (ScrollTrigger, SplitText, Flip) + Lottie + Lenis |
| Emil Kowalski (Sonner, Vaul) | React + CSS transitions + Motion (ex-Framer Motion) |

The **principles are identical across both**. Tools come last. We learn CSS first because it
is the substrate under every one of these libraries, then earn our way into JS-driven motion
where CSS genuinely can't reach.
