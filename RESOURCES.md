# Web Animation Resources

## A concrete performance recording exercise

- [Image Reveal — CSS](https://scroll-driven-animations.style/demos/image-reveal/css/) — a small, readable scroll-driven reveal. Record two or three passes in DevTools Performance and inspect one long frame.

## Knowledge

### First principles — when and why to animate

- [Emil Kowalski — "Great animations"](https://emilkowal.ski/ui/great-animations)
  The single best short statement of what separates good motion from bad: natural, fast,
  purposeful, performant, interruptible, accessible, coherent. **Use for:** the seven-point
  quality rubric; anything about defending a timing choice.
- [Emil Kowalski — "You don't need animations"](https://emilkowal.ski/ui/you-dont-need-animations)
  The counterweight. Frequency-of-use as the deciding factor; "sometimes the best animation
  is no animation." **Use for:** the should-this-animate gate, keyboard-initiated actions,
  the Raycast argument.
- Local skill: `~/.claude/skills/emil-design-eng/SKILL.md`
  A dense encoding of Kowalski's philosophy already on this machine — the decision framework,
  duration tables, custom easing curves, component principles, performance rules, review
  checklist. **Use for:** the authoritative reference on almost any craft question. Ask me to
  pull from it.
- Local skill: `~/.claude/skills/animation-vocabulary/SKILL.md`
  Reverse-lookup glossary: describe an effect vaguely, get its exact name. **Use for:**
  naming what you see on a site you're reverse-engineering.

### Mechanics — how it actually works

- [Josh W. Comeau — An Interactive Guide to CSS Transitions](https://www.joshwcomeau.com/animation/css-transitions/)
  The best interactive explainer on transitions anywhere. Property cost hierarchy, timing
  functions, hardware acceleration, `will-change`. "Animation is like salt: too much of it
  spoils the dish." **Use for:** transitions 101 and the performance mental model.
- [Josh W. Comeau — An Interactive Guide to CSS Keyframe Animations](https://www.joshwcomeau.com/animation/keyframe-animations/)
  Companion piece on `@keyframes`, fill modes, and multi-step animation. **Use for:** when
  you need more than a two-state transition.
- [Josh W. Comeau — Animation articles index](https://www.joshwcomeau.com/animation/)
  Everything else he's written on motion. **Use for:** browsing when stuck.
- [MDN — `<easing-function>`](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)
  Normative spec reference for `cubic-bezier`, `linear()`, `steps()`. **Use for:** settling
  arguments about what's actually valid CSS.
- [easings.net](https://easings.net/) — Easing function cheat sheet with visual curves.
  **Use for:** picking a named curve instead of inventing one.
- [GSAP — Easing docs & visualizer](https://gsap.com/docs/v3/Eases/)
  Interactive ease visualizer. Also the source for the `power1`=Quad, `power2`=Cubic,
  `power3`=Quart, `power4`=Quint naming. **Use for:** translating GSAP eases you find on
  real sites into CSS `cubic-bezier`.

### Cost — what the browser actually does per frame

- [web.dev — "Animations guide"](https://web.dev/articles/animations-guide)
  The canonical property-to-pipeline-stage reference, from the people who build the
  rendering engine. **Use for:** settling which stage a property triggers; the
  compositor-thread argument.
- [MDN — Animation performance and frame rate](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
  Layers, rasterisation, and why compositing is cheap. **Use for:** the level under
  the property table.
- [MDN — `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
  Unusually blunt about not using it. **Use for:** the argument against blanket promotion.
- [Chrome DevTools — Performance panel](https://developer.chrome.com/docs/devtools/performance/)
  **Use for:** the verification drill in lesson 0002 — purple is Layout, green is Paint.
- [MDN — `interpolate-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size)
  The eventual fix for animating `height: auto`. **Use for:** checking whether the
  `grid-template-rows: 0fr → 1fr` workaround is still needed. Support was still narrow
  as of 2026-09-01.

### Orchestration — groups, sequence, timelines

- [GSAP — Staggers](https://gsap.com/resources/getting-started/Staggers/)
  The clearest statement of the stagger model anywhere, even if you're writing CSS:
  `each` vs `amount`, `from: "center"`, grid-aware staggering. **Use for:** vocabulary
  when reading someone else's source; deciding how a stagger should scale with count.
- [Motion — `stagger()`](https://motion.dev/docs/stagger)
  The same model in the React-flavoured stack. **Use for:** when the lessons reach Motion.
- [MDN — `animation-fill-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode)
  **Use for:** the `animation-delay` flash-of-final-state bug from lesson 0003.
- [MDN — `transition-delay`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-delay)
  **Use for:** the `calc(var(--i) * step)` stagger pattern.

### Scroll — triggers, scrollports, and scroll-driven CSS

- [MDN — Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
  The root / `rootMargin` / `threshold` model, with the diagram that makes the sign rule
  obvious. **Use for:** anything about *when* a reveal fires.
- [scroll-driven-animations.style](https://scroll-driven-animations.style/)
  Bramus Van Damme's gallery of runnable scroll-driven CSS demos. **Use for:** seeing what
  the technique is actually good at before deciding to use it.
- [Chrome — Scroll-driven animations guide](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
  The narrative version of the same material. Its scroll-progress/view-progress distinction is
  the next technical choice after D007 has already decided that an effect deserves a scrub: does
  the whole scrollport or one element crossing it supply the 0–100% range? **Use for:** the first
  read-through; translating a design decision into native CSS.
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)
  and [`animation-timeline`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline),
  [`animation-range`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range).
  **Use for:** the reference pages, and the compatibility tables — check these rather than
  trusting a version number written in a lesson. (caniuse blocks scripted fetches, so these
  are the tables the lessons cite.)
- [GSAP — ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
  The library vocabulary behind the patterns D007 names: boolean scrub binds progress 1:1;
  numeric scrub deliberately adds catch-up; pin holds one element while the document advances;
  container animations map vertical travel onto a horizontal stage. **Use for:** reading a real
  expressive site's source after the design decision has already been made.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
  **Use for:** the remove-travel-keep-fade treatment from 0004, pending its own lesson.

### Text — splitting, line metrics, and kinetic type

- [GSAP — SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)
  Split by lines, words, or characters; the docs also call out accessible labels, re-splitting after
  font/width changes, masking, and the reason to split only as finely as the design needs. **Use for:**
  the implementation vocabulary after D008 has chosen the reading unit.
- [Motion — splitText](https://motion.dev/docs/split-text)
  A runtime splitter with accessible original text and a warning that line boundaries depend on font
  metrics. **Use for:** the React-flavoured route once the CSS decision is already made.
- [Motion — text animation](https://motion.dev/docs/text-animation)
  Patterns for character, word and line animation, including why a typewriter treatment can feel
  robotic. **Use for:** comparing a deliberate hero-word entrance with ordinary reading.

### Exits — leaving, unmounting, and discrete properties

- [Chrome — Four new CSS features for smooth entry and exit animations](https://developer.chrome.com/blog/entry-exit-animations)
  The clearest write-up of `@starting-style`, `transition-behavior: allow-discrete` and
  `overlay`, with runnable examples. **Use for:** doing exits in CSS with no JavaScript.
- [MDN — `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
  **Use for:** giving a newly-displayed element something to animate *from*.
- [MDN — `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)
  and [`overlay`](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay).
  **Use for:** keeping an element alive through its own exit. Check the compat tables here
  rather than trusting version numbers written in a lesson.
- [MDN — Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
  Open/close behaviour, focus handling and light-dismiss for free, animatable with the two
  features above. **Use for:** menus, tooltips and dialogs before reaching for a library.
- [Motion — `AnimatePresence`](https://motion.dev/docs/react-animate-presence)
  The React answer to the same problem: hold the element in the tree until the exit finishes.
  **Use for:** when the lessons reach React. The API looks like magic; it is delayed removal.

### Tools — choosing between CSS, WAAPI, Motion and GSAP

- [MDN — Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
  and [`Element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
  The playback controls that neither transitions nor keyframes have: `pause()`, `reverse()`,
  `currentTime`, and the `finished` promise. **Use for:** anything that needs a playhead;
  also the cheapest way to see that WAAPI is just keyframes-plus-options in JS.
- [GSAP — Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)
  Choreography as a first-class object: labels, relative offsets, reverse the whole sequence.
  **Use for:** deciding whether a sequence has enough structure to justify the dependency.
- [Motion — layout animations](https://motion.dev/docs/react-layout-animations)
  FLIP, done for you, when an element moves because the layout changed. **Use for:** the
  clearest short argument for why Motion earns its place in React.
- [Motion — React quick start](https://motion.dev/docs/react-quick-start)
  **Use for:** when the lessons reach JSX. Not before.

### Anchoring — origins, popovers, and placement

- [MDN — `transform-origin`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin)
  Keywords, percentages, lengths, and the third value for 3D. **Use for:** the value syntax when
  the trigger isn't at a corner and you need `24px 0` rather than a keyword.
- [MDN — `transform-box`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box)
  Why `transform-origin: center` misbehaves in SVG until you set `fill-box`. **Use for:** the
  afternoon you would otherwise lose to it.
- [MDN — CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
  and [`position-area`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-area)
  Where the *placement* half of the popover problem is heading, declaratively. **Use for:**
  checking support before hand-rolling flip logic; the compat tables here, not a version number
  in a lesson.
- [MDN — `getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
  **Use for:** the measure-then-aim snippet in 0007, and any FLIP work later.

### Springs — physics as a model of time

- [Josh W. Comeau — A Friendly Introduction to Spring Physics](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)
  The best interactive treatment of stiffness / damping / mass anywhere. **Use for:** when the
  sliders still feel arbitrary; building intuition before tuning anything real.
- [Motion — spring](https://motion.dev/docs/spring) and
  [react-transitions](https://motion.dev/docs/react-transitions)
  `visualDuration` and `bounce` — the perception-first parameterisation that is much easier to
  tune than stiffness/damping. **Use for:** actually shipping a spring; also the per-property
  transition syntax behind spring-the-transform / tween-the-opacity.
  The docs don't state the conversion, so: **ζ = 1 − bounce, clamped to [0.05, 1]**. Read out of
  `motion-dom`'s own source — `spring/find.mjs` (`let dampingRatio = 1 - bounce`) and
  `spring/index.mjs` (the `visualDuration` branch, which pins mass to 1). Consequences: `bounce`
  cannot express overdamped, and it's linear in ζ rather than in visible overshoot, so
  `bounce: 0.25` is a 2.8% overshoot and `bounce: 0.5` is 16.3%. Note the docs page says the
  default bounce is 0.25 while `defaults.mjs` says 0.3.
- [MDN — `linear()`](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear)
  and [Chrome's write-up](https://developer.chrome.com/docs/css-ui/css-linear-easing-function)
  How a sampled spring gets into CSS at all. **Use for:** the honest limits — it's a baked
  curve, so overshoot survives and velocity continuity does not.
- [Jake Archibald — linear() easing generator](https://linear-easing-generator.netlify.app/)
  Same job as lesson 0008's output box, with point reduction. **Use for:** producing a short
  `linear()` you'd actually paste into production CSS.

### Reduced motion — deciding what to take away

- [Val Head — Designing Safer Web Animation For Motion Sensitivity](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/)
  Where the risk ordering in lesson 0009 comes from — large area, parallax, zoom, spin,
  oscillation, distance, speed. Written from talking to affected people, not from theory.
  **Use for:** settling any "is this one actually a problem?" argument.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
  The two values and their exact semantics. **Use for:** remembering that `no-preference` is a
  real value you can build the opt-in idiom on.
- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
  Covers the `<video>` / `<picture>` swap, which lesson 0009 names but doesn't teach.
  **Use for:** autoplaying media, GIFs, and hero video.
- [WCAG 2.3.3 — Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
  The essential-motion exception in the standard's own words. **Use for:** defending a spinner,
  a progress bar, or anything else you're keeping.
- [Motion — `useReducedMotion()`](https://motion.dev/docs/react-use-reduced-motion) and
  [`gsap.matchMedia()`](https://gsap.com/docs/v3/GSAP/gsap.matchMedia())
  The JS side, which the CSS media query never reaches. `gsap.matchMedia()` also reverts a
  timeline cleanly when the query stops matching. **Use for:** anything not written in CSS.
- [Chrome DevTools — emulate CSS media features](https://developer.chrome.com/docs/devtools/rendering/apply-effects)
  Rendering panel → *Emulate CSS media feature prefers-reduced-motion*. **Use for:** the habit
  that catches stranded-invisible elements in ten seconds.
- [Tailwind — `motion-safe:` / `motion-reduce:`](https://tailwindcss.com/docs/hover-focus-and-other-states)
  **Use for:** the utility-class version; prefer `motion-safe:`, which fails in the safe
  direction when you forget it.

### Input — hover, press, and the device on the other end

- [Nielsen — Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
  The source of the 0.1s number lesson 0010 is built on: *"0.1 second: Limit for users feeling
  that they are directly manipulating objects in the UI."* From 1993, about hardware that no
  longer exists, which is why it still holds — the limits are properties of people.
  **Use for:** defending a press duration to anyone who thinks 250ms is fine.
- [CSS-Tricks — Solving Sticky Hover States with `@media (hover: hover)`](https://css-tricks.com/solving-sticky-hover-states-with-media-hover-hover/)
  The sticky-hover problem written up with the browser-behaviour detail.
  **Use for:** explaining to someone else why their card stays lit on a phone.
- [MDN — `hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover),
  [`any-hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-hover),
  [`pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)
  Primary-input vs any-input, precisely. **Use for:** deciding which of the four features you
  actually mean; the answer for motion is nearly always plain `hover: hover`.
- [MDN — `:active`](https://developer.mozilla.org/en-US/docs/Web/CSS/:active) and
  [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
  **Use for:** the keyboard half — `:active` fires on Enter/Space for a real `<button>`, and
  `:focus-visible` is why `outline: none` was always the wrong reflex.
- [MDN — Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) and
  [`setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
  **Use for:** the moment a press has to survive the pointer leaving the element — drag handles,
  sliders, hold-to-delete. `setPointerCapture` is the piece people miss.
- [Emil Kowalski — Great animations](https://emilkowal.ski/ui/great-animations)
  The interruptibility section is the relevant one here: a hover animation that can't reverse
  mid-flight fights the cursor. **Use for:** why hover transitions must be interruptible.
- [W3C — Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/)
  The spec behind all four interaction features. **Use for:** settling an argument about what a
  device is *supposed* to report; note that what devices actually report is a separate question.

### Layout animation — FLIP and View Transitions

- [Paul Lewis — "FLIP your animations"](https://aerotwist.com/blog/flip-your-animations/)
  The original, from 2015, and still the clearest statement of the idea: invert the change you
  just made, then remove the inversion. **Use for:** the mental model, and the reminder that
  FLIP was invented to move layout work off the animating frames, not to be clever.
- [CSS-Tricks — Animating Layouts with the FLIP Technique](https://css-tricks.com/animating-layouts-with-the-flip-technique/)
  The long-form implementation write-up: multiple elements, interruption, and the
  inverse-scale-the-children problem. **Use for:** when you have to hand-roll FLIP over a real
  list rather than a demo grid.
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
  `startViewTransition()`, `view-transition-name`, the `::view-transition-*` pseudo tree, and
  the compat tables. **Use for:** the reference, and for checking support rather than trusting a
  version number in a lesson. As of 2026-09-03: same-document is Baseline Newly available
  (Chrome 111, Safari 18, Firefox 144); cross-document `@view-transition { navigation: auto }`
  is Chrome 126 / Safari 18.2 and **not in Firefox**.
- [Chrome — Same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)
  The narrative version, with the pseudo-element tree drawn out and the `skipTransition()` /
  `ready` / `finished` promise lifecycle. **Use for:** the first read-through, and for
  customising individual groups.
- [GSAP — Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/)
  `Flip.getState()` / `Flip.from()`, with the child inverse-scaling, absolute-positioning and
  enter/leave cases handled. **Use for:** when a hand-rolled FLIP starts needing all three.
- [Motion — layout animations](https://motion.dev/docs/react-layout-animations)
  `layout` as a prop: the same technique, made declarative, plus `layoutId` for the
  one-element-becomes-another case. **Use for:** the React answer, and for seeing what shape
  the API takes when someone hides FLIP entirely.

### Courses (paid — optional, not required by any lesson)

- [animations.dev — "Animations on the Web", Emil Kowalski](https://animations.dev/)
  4 modules, 50+ interactive exercises. Spends real time on easing, timing and taste before
  asking you to write code. The closest thing to a canonical version of this mission.
  **Use for:** if you want a structured second pass with video.
- [Emil Kowalski — "Building an animation course"](https://emilkowal.ski/ui/building-an-animation-course)
  Free. His writeup of how he built it — useful signal on what he thinks matters most.

### Reverse-engineering targets

- [claude.com/claude-for-chrome](https://claude.com/claude-for-chrome)
  The origin of this mission. Webflow + GSAP. Measured 2026-07-29: all entrance eases are
  `power2.out`/`power3.out`/`expo.out`, `stagger: 0.075`, travel distances 10–24px,
  UI durations 0.2–0.45s. **Use for:** proof that the principles hold in production.

### In the wild — the sites D007, D008 and D010 send you to

These are linked from the lessons themselves, in the margin, each with a question attached. They
are listed here so the set survives a lesson being rewritten. Every one is a single concrete page
with a specific thing on it — a gallery or a tag archive is not an example, it is a place examples
might be. All checked 2026-09-05; the point of each is a pattern, not a layout, so a redesign
changes the exercise rather than ending it.

- [Apple — AirPods Pro](https://www.apple.com/airpods-pro/)
  Scrubbed product sequences and pinned sections, and the markup says so — `sticky` and `parallax`
  both appear in the shipped HTML. **Use for:** D007's first question. Stop anywhere and ask
  whether the frame you landed on is a finished picture.
- [Stripe](https://stripe.com)
  The restraint case. Nothing pinned for long, short travel, roughly one idea per screen-height.
  **Use for:** D007's *distance is duration* — the pacing number to have in your head before
  someone proposes a three-screen section.
- [Firewatch](https://www.firewatchgame.com/)
  Layered illustrated parallax, a decade old and still legible. **Use for:** D007's *deep* — name
  the planes nearest to farthest, then notice how little each one travels.
- [scroll-driven-animations.style](https://scroll-driven-animations.style/)
  Also listed under Scroll above. **Use for:** D007's native contract, from the side that keeps
  it — drag the scrollbar and watch every demo track your hand exactly.
- [Bramus — image-reveal demo](https://scroll-driven-animations.style/demos/image-reveal/css/)
  One page, no library: `view-timeline` and a `clip-path`, nothing else. **Use for:** D007's native
  contract from the side that keeps it. Drag the scrollbar in jerks and watch the reveal track your
  hand exactly, because nothing is chasing anything.
- [Dennis Snellenberg — portfolio](https://www.dennissnellenberg.com/)
  A beautiful site that replaces the browser's scroll with its own — Locomotive Scroll plus GSAP's
  ScrollTrigger, both in the shipped page. **Use for:** D007's native contract from the side that
  gives it away. Press `End`, drag the scrollbar, flick hard and let go.
- [Apple — MacBook Pro](https://www.apple.com/macbook-pro/)
  **Use for:** D008's split granularity. Name the unit the headline uses, then name the unit the
  body copy uses. They differ, and the page is a long argument for why.
- [Codrops — On-Scroll Typography Animations, Set 1](https://tympanus.net/Development/OnScrollTypographyAnimations/)
  Fifteen numbered type effects on one page, most louder than anything you would ship, which is what
  makes them useful. **Use for:** D008's mask-or-fade question, asked fifteen times in a row —
  effects 1 and 9 answer it differently.
- [GSAP — SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
  Linked as documentation, not as a dependency; the course ships no libraries. It is the most honest
  published account of split text going wrong — `autoSplit`, `onSplit`, and a long accessibility
  section. **Use for:** D008's *keep the reading intact*. Run the demo, then try to select and copy
  the split headline.
- [HTTP 203 playlist demo](https://http203-playlist.netlify.app/)
  A small video app built to demonstrate view transitions, and the shipped CSS names its parts:
  `site-header`, `header-text`, `embed-container`, `related-videos`. **Use for:** D010's shared
  element. Click a video and watch the thumbnail become the player, then press back and watch it go
  home — and separately, notice that the top bar never blinks.
- [Chrome — paginated view transitions (MPA)](https://view-transitions.chrome.dev/pagination/mpa/)
  A real cross-document navigation, not a single-page imitation. Its `mpa.css` branches on
  `:active-view-transition-type(forwards | backwards | reload)`. **Use for:** D010's *back is not
  forward*. Click through, then use the browser back button, then reload mid-sequence: three
  navigations, three answers.
- [Chrome — stack navigator (MPA)](https://view-transitions.chrome.dev/stack-navigator/mpa/)
  A messages app whose transitions assert depth; `shared/styles.css` names `page` and `works` and
  keyframes `slide-in` / `shrink` / `grow`. **Use for:** D010's cold-entry test. Go two levels
  deep, copy the URL, open it in a new tab, and ask whether the screen still says where you are.

## Wisdom (Communities)

- [r/web_design](https://reddit.com/r/web_design) and [r/Frontend](https://reddit.com/r/Frontend)
  General critique. **Use for:** posting a built page for feedback.
- [Emil Kowalski on X (@emilkowalski)](https://x.com/emilkowalski)
  Posts animation breakdowns regularly. **Use for:** a steady drip of examples to study; the
  replies are often where the craft discussion happens.
- [CodePen](https://codepen.io/) — search an effect name, read other people's implementations.
  **Use for:** seeing five ways to do the thing you just built.
- [GSAP forums](https://gsap.com/community/) — unusually high-signal, staff answer in depth.
  **Use for:** scroll-driven and timeline questions once we get there.

*Community preference not yet stated — ask before leaning on this section.*

## Gaps

- No resource yet on **shadcn/Radix/Base UI animation data-attributes** specifically. Needed
  before the product-UI polish lessons — and now doubly so: 0007's ask-teacher block explicitly
  invites the question about how Radix exposes the computed transform-origin as a custom
  property. Fill this before she asks.
- ~~Nothing yet on View Transitions API~~ **closed by 0011 (2026-09-03).** Remaining hole in
  that section: no good source on **cross-document view transitions in practice** — the MDN and
  Chrome pages cover the API, but nothing found yet on what a real multi-page site has to
  restructure to use it, or on what the Firefox gap costs you. Find one before a routing lesson.
- No first-hand source on **iOS Safari's `:active` behaviour on tap** (the `<body ontouchstart="">`
  folk fix). 0010 states it as historical and tells her to test on hardware rather than trust it.
  Find a citable source, or verify on a device, before it appears anywhere as a flat claim.
