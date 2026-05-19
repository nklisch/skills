# Cross-discipline transfers

Twelve transfers from non-software disciplines (architecture, music, film,
choreography, gardening, ceremony) that earn their keep when designing UI. Not a
generator — a *vocabulary* the design agent can pull from when generating screen
options, flow transitions, or composition decisions.

Each entry: the source discipline, the transferable principle in tight prose, the
concrete UI hook(s), which skill is most affected.

This file auto-loads with `ux-ui-principles`. The full research that produced these
is in `plugins/ux-ui-design/docs/proposals/research/historical.md` and
`cultural-motion.md` for the lineages that originated this list.

---

## 1. Christopher Alexander — *A Pattern Language* + Quality Without a Name

**Source:** Architecture / urban design. *A Pattern Language* (1977, with Ishikawa &
Silverstein), *The Timeless Way of Building* (1979), *The Nature of Order* (2002-04).

**Transferable principle:** Design as composition of named, contextual patterns.
Alexander's book documents 253 patterns, each of the form: "a problem that occurs
over and over again ... and the core of the solution." The "Quality Without a Name"
(alive, whole, comfortable, free, exact, egoless, eternal) emerges from coherent
pattern composition. Software pattern languages (GoF, Hillside) are a direct
descendant.

**UI hook:**
- Publish a per-project named-pattern document alongside the palette ("Settings as
  Drawer," "Hub with Spokes," "Inline Empty State"). Each generated screen mock
  cites the patterns it uses.
- Acts as a design-system glossary written in plain English — readable by
  designers, engineers, and PMs equally.

**Affects:** screens, flows, ux-ui-principles (the pattern-language doc is a
sibling artifact).

---

## 2. Tadao Ando — Light, concrete, procession

**Source:** Architecture (Pritzker 1995). Church of the Light (Ibaraki, 1989);
Azuma House (1976); Modern Art Museum of Fort Worth (2002).

**Transferable principle:** Three materials only — concrete, glass, light. Space
revealed through *procession*: you walk a turn, then a wall, then the room opens.
The Church of the Light places a single cruciform aperture in a 38cm concrete wall;
you don't see the cross until you've made the procession.

**UI hook:**
- Palette: concrete-gray ramp `#E8E8E6 → #1A1A1A`; one warm cast of light `#FFE9B8`.
- Components: blank "wall" panels; navigation by *procession* (you don't see Z
  until you've passed Y) — pairs well with `flows`' sequential topology and
  sharpens the "what reveals when" question.
- Screens (pole): "Aperture" — full-bleed dim screen with one bright cut-out
  region.
- Motion: long fade-in (1.2s, ambient channel) on entry; light "moves" across the
  page over the session.

**Affects:** palette (the Ando token preset), screens (Aperture pole), flows
(procession sequencing), motion (designed slow reveal).

---

## 3. Sou Fujimoto — Relational architecture, transparency

**Source:** Architecture. *Primitive Future*; House N (Tokyo, 2008); Serpentine
Pavilion (2013).

**Transferable principle:** Nested transparency — boxes inside boxes inside boxes,
each membrane visible. Blurs inside/outside, public/private. Architecture as
*interface design*: the wall is a filter, not a barrier.

**UI hook:**
- Components: nested modal-within-modal-within-modal where each parent stays
  visible at reduced opacity; no full-screen takeovers.
- Screens: "Nested Frame" — content panels at 3 zoom levels visible simultaneously.
- Flows: drill-in shows the path *as cumulative frames*, not a stack you lose
  context to.

**Affects:** components (modal stack pattern), screens (nested-frame pole), flows
(drill-in choreography).

---

## 4. Brian Eno — Generative music, Oblique Strategies

**Source:** Music. *Ambient 1: Music for Airports* (1978); Oblique Strategies deck
with Peter Schmidt (1975); *Discreet Music* (1975).

**Transferable principle:** Compose *processes*, not artifacts. State a few rules;
let the system run. Constraints as creative liberation ("Honor thy error as a hidden
intention." "Use an old idea." "What wouldn't you do?").

**UI hook:**
- A static UI can encode a *generative palette* — per-session randomized accent
  within a constrained range; per-load reshuffled hero composition from a fixed
  grammar; "oblique" empty-state copy drawn from a card deck. The screen feels alive
  without being animated.
- Strategies component: dismissable prompt cards that reframe the user's task
  ("What's the simpler version of what you're about to do?").

**Affects:** palette (generative variants), components (Strategies component),
screens (live-feel without animation).

---

## 5. Walter Murch — Rule of Six

**Source:** Film editing. *Apocalypse Now*, *The Conversation*, *The English
Patient*; book *In the Blink of an Eye* (1995, 2nd ed 2001).

**Transferable principle:** Rank every cut by six criteria:
1. **Emotion** (51%) — does it serve the emotional moment?
2. **Story** (23%) — does it advance the narrative?
3. **Rhythm** (10%) — does it feel right rhythmically?
4. **Eye trace** (7%) — does the eye know where to look?
5. **Two-dimensional planarity** (5%) — does it respect the frame composition?
6. **Three-dimensional continuity** (4%) — does it respect physical space?

Sacrifice upward only: violate continuity (the lowest) before violating emotion
(the highest).

**UI hook:**
- A *transition checklist* for screen-to-screen mocks in `flows`. Each transition
  is annotated with its Murch rank: does this transition preserve the user's
  emotional state, then narrative thread, then visual focus point, between screens?
- Particularly strong for `flows`' hybrid topology where cross-jumps can break
  rhythm or eye-trace.

**Affects:** flows (transition annotations), screens (option-to-option
choreography), motion (which curves carry emotion vs efficiency).

---

## 6. Roger Deakins — Motivated light cinematography

**Source:** Cinematography. *1917*, *Blade Runner 2049*, *No Country for Old Men*,
*Skyfall*.

**Transferable principle:** Every light in frame must be *motivated by a source you
can see or infer*. A lantern lights the lantern-holder. No ambient fill from
nowhere.

**UI hook:**
- Shadows and highlights on a screen must point to a coherent in-frame "source"
  (icon-lit-from-above, modal-lit-from-its-CTA). One source per screen, max two.
- Color temperature warms or cools per route — billing pages cooler, success
  pages warmer — and is *motivated* by an in-page element (a sun, a candle icon, a
  glowing badge).
- Pole: "Single Source" — one luminous element; everything else falls into
  shadow.

**Affects:** palette (single-source color tokens), screens (Single Source pole),
components (shadow direction discipline).

---

## 7. Ikebana — Heaven-Man-Earth (shin / soe / hikae)

**Source:** Japanese floral arrangement (Ikenobō tradition, 15th c.; Sogetsu
modernization 1927). Three-element asymmetric triangle with size ratio 1 : 2/3 : 1/2
at fixed angles (shin ~15°, soe ~45°, hikae ~75°).

**Transferable principle:** A *three-element rule* for any composition — one
dominant, one supporting at ~2/3 weight, one accent at ~1/2 weight, never collinear.
Lays an exact angular discipline over the otherwise-vague "rule of thirds."

**UI hook:**
- Hero composition: 1 large element (heaven) + 1 medium element at 2/3 size
  (man) + 1 small accent (earth). Never aligned in a row; never the same weight.
- Maps to hero + sub-hero + accent CTA in marketing pages, or to KPI + secondary
  + tertiary in dashboard tiles.
- Pole: "Three-Branch" — exactly three elements per region, always asymmetric.

**Affects:** screens (Three-Branch pole, hero composition), components (card
internal hierarchy).

---

## 8. Japanese garden — Shakkei (借景, "borrowed scenery")

**Source:** Garden design (Heian period onward; codified in the 17th-c. Chinese
*Yuanye*). Composes a *background* (distant mountain, neighbor's roofline) into
the foreground through framing devices. Four layers: foreground, middle ground,
framing device, borrowed background.

**Transferable principle:** Compose the background into the foreground composition.
Every garden views something beyond itself.

**UI hook:**
- Screens "borrow" the OS chrome or browser background as composed scenery —
  a carefully chosen viewport-bleed gradient that *matches* the user's likely
  backdrop (dark-mode-aware, system-accent-aware).
- "Framing device" component — a window cut-out, an arch — deliberately reveals
  content behind/under the current screen at the edges (the previous step, the
  next preview).
- Flows: each screen frames a glimpse of the *next* — no surprise transitions.

**Affects:** screens (shakkei framing), flows (preview-of-next pattern), palette
(OS-chrome-aware viewport gradients).

---

## 9. Tea ceremony / wabi-cha — Preparation as content

**Source:** Chanoyu (Sen no Rikyū, 16th c.). The *preparation* — folding the
cloth, warming the bowl, arranging the tools — *is* the experience. The drinking is
punctuation.

**Transferable principle:** Slowness and visible craft are the point. The wait
isn't a problem to minimize; it's a quality to honor.

**UI hook:**
- "Preparation screens" replace zero-state — the wait/setup for an action is
  rendered as a deliberate, attended choreography (a 4-step explicit sequence), not
  a spinner.
- Onboarding becomes ceremonial: each step has a fixed minimum dwell (no
  skip-to-end) and shows the tools being arranged.
- Distinct from "playful" — this is *slow*, not jubilant. Pairs with Calm Tech
  and *Ma*.

**Affects:** flows (preparation-as-onboarding), motion (`--hold-beat` is the
ceremonial pause).

---

## 10. Laban Movement Analysis — Effort taxonomy

**Source:** Dance notation. Rudolf von Laban (1920s-50s); modern LMA practice.

**Transferable principle:** Movement decomposes into four factors with poles:
- **Time** — quick / sustained
- **Weight** — strong / light
- **Space** — direct / indirect
- **Flow** — bound / free

The first three combine into eight named **efforts**: Float, Punch, Glide, Slash,
Dab, Wring, Flick, Press.

**UI hook:**
- A *motion taxonomy* for the `motion` skill — every animation declares its
  Laban effort. A "Dab" toast is quick + light + direct. A "Press" modal-confirm
  is sustained + strong + direct. Replaces vague easings with named character.

**Affects:** motion (the named-attitude tier maps loosely to Laban efforts).

---

## 11. Music — Vertical rhythm + modular scale + counterpoint

**Source:** Western music theory + Robert Bringhurst's *Elements of Typographic
Style* + Tim Brown's *Modular Scale* tool.

**Transferable principle:**
- **Modular scale** — type sized in a geometric scale (1.125 minor second; 1.25
  major third; 1.5 perfect fifth; 1.618 golden ratio).
- **Vertical rhythm** — leading set as a *baseline grid* every element lands on.
- **Counterpoint** — two independent visual "voices" (e.g., marginalia column +
  body column) moving on the same baseline.

**UI hook:**
- Type-scale tokens picked from a *named scale* per project mood:
  - Tight dense UI: minor second (1.125) or minor third (1.2)
  - Editorial: perfect fourth (1.333) or perfect fifth (1.5)
  - Display marketing: golden ratio (1.618)
- Strict 4px or 8px baseline rhythm — every spacing token is a baseline multiple.
- Counterpoint two-column primitive: left and right voices share baselines but
  differ in size and weight (annotation alongside body).

**Affects:** palette (type-scale ratios), components (counterpoint two-column
primitive), screens (baseline-aligned layouts).

---

## 12. Information design canon — Tufte, Bertin, Vignelli, Müller-Brockmann

**Source:** Multiple. Tufte, *The Visual Display of Quantitative Information* (1983);
Bertin, *Sémiologie graphique* (1967); Vignelli, *The Vignelli Canon* (2010, free
PDF); Müller-Brockmann, *Grid Systems in Graphic Design* (1981); Otl Aicher's
Munich Olympics 1972 pictogram system; Otto Neurath's Isotype.

**Transferable principle:** The grounding canon for charts, grids, identity,
typography. Distilled rules:

- **Tufte:** maximize data-ink ratio. Strip chartjunk. Use small multiples. Use
  sparklines. Use layering and separation. Watch lie factor.
- **Bertin:** seven retinal variables — position, size, shape, value, color hue,
  orientation, texture. Pick the variable that matches the data type (position for
  quantitative; hue for nominal; value for ordinal).
- **Vignelli:** restrict the type system. Two faces is plenty; one with weights
  is often better. Choose a grid and obey it.
- **Müller-Brockmann:** "The grid is an aid, not a guarantee." Pick a column
  system before any pixel-pushing.
- **Aicher:** a pictogram system is a *system*. Define the construction grid,
  line weight, stroke termination, corner radius — apply uniformly.
- **Neurath / Isotype:** for population/count visualizations, repeat unit-icons
  rather than scaling one icon (scaling distorts area perception).

**UI hook:**
- Charts kit (in `components`): kill 3D, kill gradients on bars, kill heavy
  gridlines; comparison views = small multiples by default.
- Bertin-variable token tier in `palette/references/token-vocabulary.md`
  (categorical / sequential / diverging color ramps).
- Vignelli discipline: max 2 typefaces per product.
- Aicher rule: don't mix two icon sets (one outlined, one filled) inside one
  product.
- Isotype rule: pictogram-repeat for counts, not pictogram-scale.

**Affects:** palette (visual variables tier), components (charts kit, icon system
discipline), screens (data-viz components).

---

## How these get used

Cross-discipline transfers are *vocabulary*. The design agent reaches for one when
the screen-design problem matches the transfer:

- A flow that needs a moment of reveal? Tadao Ando's procession.
- A dashboard with a too-fast feel? Wabi-cha preparation as content.
- A modal stack that loses context? Sou Fujimoto's nested transparency.
- A chart that's lying? Tufte's lie factor + Bertin's variable matching.
- A toast that needs a name beyond "fast"? Laban's Dab effort.
- A typography system that feels random? Music's modular scale.

The agent doesn't apply all twelve to every design. It picks the transfer that
maps cleanly to the question in front of it, applies the principle, names the
source in the design rationale.

## What this file is NOT

- Not a generator. The transfers don't have output formats; they shape decisions
  the generator skills make.
- Not exhaustive. Dozens more transfers exist; the twelve above are the ones the
  research said most consistently produce useful UI moves.
- Not a substitute for the source disciplines. Read Bringhurst. Watch Murch. Walk
  through Ando's Church of the Light if you can. The summaries here are abridgements,
  not replacements.
