# Design judgment — the laws that change mocks

Condensed judgment layer: the research findings that actually change mock
decisions, plus a few transfers from other disciplines. Pull from this
whenever a design choice needs a reason deeper than taste. Each entry is
compressed to what it says and what a mock should *do* with it.

## Contents

- The laws that change mocks
- The Gestalt set
- Choice and attention
- Cross-discipline transfers worth keeping

---

## The laws that change mocks

**Hick.** Decision time grows with the number of *ungrouped* choices. The
cost is in the choice, not the count — a flat 12-item list often beats a
3-deep nested tree. Mock-time: menus with >7 leaf options get 2–4 visible
groups or progressive disclosure; expose 1 default action + 1–2 alternates,
bury the rest.

**Fitts.** Target time scales with distance over size; screen edges are
infinitely "wide." Mock-time: primary actions ≥44px; cluster related
controls; destructive actions far from defaults; hit areas exceed visible
bounds.

**Cowan (not Miller).** Working memory is ~4±1 chunks — Miller's "7±2" was
rhetorical, never a menu rule. Design to *chunking*, not a magic number:
comparison tables ≤4 columns, form sections 3–5 fields, option splashes
3–4 choices.

**Jakob.** Users expect your product to work like the ones they already
know. Innovate on substance, conform on chrome: logo top-left links home,
search has a magnifier, underlined text is a link. Novel controls need a
familiar fallback path.

**Tesler.** Complexity is conserved — every "simple" surface moved the
complexity somewhere. Mock-time: for each clean surface, name where the
complexity went (defaults? an Advanced affordance? the user's head?). When
a mock feels suspiciously clean, find the hidden hard problem.

**Doherty.** Sub-400ms response feels responsive and compounds engagement;
above ~2s users disengage. Feedback budgets: ≤100ms direct change; ≤400ms
subtle motion; 400ms–1s needs a spinner/skeleton; >1s needs progress +
cancel. Mock loading states alongside loaded states — never just the happy
resting view.

**Peak-End.** Experiences are judged by their emotional peak and their
ending. Spend pixels on the peak (receipt page, first save) and the close
(confirmation, thank-you), not the middle of the wizard. Fix the peak
*pain*, not the average pain.

**Zeigarnik.** Unfinished tasks are remembered. Show open loops ("3 of 5
complete", draft indicators) and reward closing them — but never
manufacture phantom incomplete tasks; that's a dark pattern.

**Aesthetic-usability + 50ms.** Visual quality is judged in 50ms and buys
forgiveness for *minor* friction — not broken flows. First-render quality
(type, whitespace, color) is high-leverage; spend on the above-the-fold
experience.

**Norman's gulfs.** Every action crosses two gaps: execution (can the user
see what's possible?) and evaluation (can the user see what happened?).
Every interactive element needs a signifier and a result. Mock the "after"
state, not just the "before."

**Signifiers.** Flat design's sin is stripping the cues that say "clickable."
Every interactive element gets a shadow, underline, hover state, or cursor
change. Flat aesthetics lean harder on color, weight, and motion to signal
interactivity.

**Calm technology.** Smallest possible attention: notifications peripheral
by default, central only when actionable; ambient state beats modal popups;
failure states stay useful (cached, degraded), never blank. Audit every
modal, badge, and toast: informing or interrupting?

## The Gestalt set

Proximity groups. Similarity groups. Continuity guides the eye. Closure
completes shapes. Figure/ground separates foreground from background.
Common region (a shared box) is the strongest grouping signal. Symmetry
reads as one object. Common fate (things moving together) reads as related.
Most "this layout feels wrong" diagnoses are one of these being violated.

## Choice and attention

**Choice overload (Iyengar).** 24 jams attracted more looks; 6 jams sold
10× more. Decision surfaces (pricing, onboarding picks) get 3–4 options,
not 12. Browsing surfaces can be long.

**Bertin.** For data: position encodes best, then size, then value
(lightness); hue is for categories, not quantities. Don't encode magnitude
in color families.

## Cross-discipline transfers worth keeping

- **Alexander (pattern language):** a design system is a language of
  reusable patterns with names, not a pile of components. If you can't
  name it, you can't reuse it.
- **Ando (procession):** approach matters — the sequence of reveals before
  the destination is designable. Onboarding is a procession.
- **Murch (Rule of Six):** a cut (or screen, or element) is justified when
  it serves emotion first, story second, rhythm third — technical
  continuity last. Remove anything serving none.
- **Deakins (motivated light):** every visual element needs a source, a
  reason to be there. Unmotivated decoration reads as noise.
- **Ikebana (three elements):** a composition needs a hero, a support, and
  a filler — three roles, not thirty. Screens with no clear hero read as
  cluttered even when sparse.
- **Shakkei (borrowed scenery):** frame what already exists (OS chrome,
  content, the terminal) instead of competing with it.
- **Tea ceremony (preparation as content):** the steps before the main
  action build its meaning — a designed pause can make an action feel
  earned. See `--hold-beat` in `design-tokens.md`.
- **Laban (effort taxonomy):** motion has weight (strong/light), time
  (sustained/sudden), and space (direct/indirect). A motion language picks
  a position on these, not just a curve.
- **Music (modular scale):** sizes derived from a ratio (type, spacing)
  harmonize the way musical intervals do; arbitrary values dissonate.
- **Tufte (data-ink):** every mark should carry information; erase
  non-data ink until the information suffers — then stop.
