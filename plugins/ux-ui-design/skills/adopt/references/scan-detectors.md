# Scan detectors

The seven audit detectors `adopt` runs during Phase 2. Each detector has a
detection heuristic, a severity rule, and a remediation pattern. Findings
go into the `adoption-report.md` Findings section.

Detectors are heuristic — they surface candidates. The user adjudicates
in subsequent phases. False positives are expected.

## Severity scale

| Severity | Meaning | Examples |
|---|---|---|
| `blocker` | Production-impacting; breaks accessibility or core flows | Missing labels on form inputs; un-keyboard-navigable interactive elements; contrast failing AA on body text |
| `important` | Erodes design quality or consistency at scale | Three button implementations; hardcoded brand color in 12+ places; missing focus styles |
| `nit` | Polish-level; not urgent | Inconsistent radius (4px vs 6px); slight spacing drift |

## Detector 1: Design-system fragmentation

**Detection.** Search for hardcoded design values where tokens should be:
- Hex colors / `rgb(...)` / `hsl(...)` in component files (instead of
  `var(--color-*)` or design-token references)
- Spacing values (`padding: 12px`, `margin: 8px`) using raw numbers
  instead of a scale
- Border radii (`border-radius: 4px`) without a token

Cluster by file and by value. A single hex used in 12 places is one
finding (the value); three different "primary" hex values across the
codebase is three findings (each value, plus a synthesis finding noting
the disagreement).

**Severity rule.**
- `important` if 5+ occurrences of an ad-hoc value in shared/primitive
  files
- `nit` if <5 occurrences or in feature-specific files
- `blocker` only when the disagreement crosses critical brand surfaces

**Remediation pattern.**
- "Consolidate to `--color-*` token in tokens.css; replace inline
  hex with var() reference in N files (list)"
- "Add `--space-N` to spacing scale; replace ad-hoc padding values"

## Detector 2: Component duplication

**Detection.** Identify multiple implementations of the same primitive:
- Buttons: more than one component with "button" in its name or
  similar HTML/CSS shape (rounded box, text, click handler)
- Inputs: form-field-shaped components with diverging style
- Modals/dialogs: backdrop + panel patterns repeated
- Cards: bordered/shadowed container patterns repeated

Use file-name patterns (`button*`, `Button*`, `*-button*`) AND
structural patterns (similar JSX/template shapes with diverging style).

**Severity rule.**
- `important` if 3+ implementations of the same primitive exist
- `nit` if exactly 2 implementations
- `blocker` if the duplications appear on the same screen (creates
  visible inconsistency the user can see in one viewport)

**Remediation pattern.**
- "Unify N button implementations into a single `Button` component
  using `.btn` classes from components.css; usage sites: ..."
- "The `Modal` and `Dialog` components diverge by 3px padding and
  border-radius. Unify under one component."

## Detector 3: Accessibility gaps

**Detection.** Pattern-match against common a11y issues:
- `<input>` / `<select>` / `<textarea>` without an associated
  `<label>` (no `htmlFor` / `for`, no `aria-label`, no
  `aria-labelledby`)
- Interactive elements (`<div onClick>`, `<span onClick>`) instead
  of `<button>` / `<a>`
- `<img>` without `alt` attribute
- CSS rules with `outline: none` or `outline: 0` without a custom
  focus style nearby
- Color combinations with contrast below WCAG AA — apply a coarse
  heuristic by computing relative luminance for any literal hex pair
  used as fg/bg in the same selector

**Severity rule.**
- `blocker` for missing labels on form inputs, contrast failures on
  body text, `outline: none` without replacement, `<div>` used as a
  button
- `important` for missing `alt`, missing focus styles on interactive
  elements
- `nit` for borderline contrast (passes AA but fails AAA)

**Remediation pattern.**
- "Add `<label for="email">` (or `aria-label`) to `email` input in
  `LoginForm.tsx:42`"
- "Replace `<div onClick>` with `<button>` in `Card.tsx:18`; restore
  any reset styling via `.btn-ghost` class"
- "Add visible focus style: `:focus-visible { outline: 2px solid
  var(--color-accent); }` to button reset in `globals.css:104`"

## Detector 4: Layout drift

**Detection.** Look for inconsistent layout primitives:
- Mixed grid systems (some pages use CSS Grid, others use Flexbox for
  the same shape, others use absolute positioning)
- Ad-hoc breakpoints — `@media (max-width: 768px)` in one file,
  `@media (max-width: 760px)` in another, `@media (max-width: 800px)`
  in a third
- Inconsistent container widths — main content limited to `1200px`
  on some pages, `1140px` on others, no limit on others
- Inconsistent header / footer heights across pages

**Severity rule.**
- `important` if the project has 3+ distinct breakpoint sets
- `important` if container widths vary by more than 5% across major
  pages
- `nit` for minor padding-around-container drift

**Remediation pattern.**
- "Standardize breakpoints to `--break-sm: 640px, --break-md: 768px,
  --break-lg: 1024px`; replace ad-hoc values"
- "Define `--max-content-width: 1200px` in tokens.css; apply to all
  page containers"

## Detector 5: Copy / voice inconsistency

**Detection.** Find action labels for the same conceptual action that
diverge in wording:
- Save actions: scan for buttons/links labeled "Save", "Save changes",
  "Update", "Apply", "Submit" within the same domain area
- Destructive actions: "Delete" vs "Remove" vs "Discard"
- Confirmation: "OK" vs "Confirm" vs "Yes" vs "Got it"
- Cancel: "Cancel" vs "Back" vs "Close" vs "Nevermind"

Group by file location to identify which contexts use which variant.

**Severity rule.**
- `important` if the divergence appears on adjacent surfaces (likely
  to confuse the same user in one session)
- `nit` for divergence across unrelated areas

**Remediation pattern.**
- "Pick one save verb per context. Forms with reversible changes →
  'Save'; settings panels → 'Save changes'; commands → 'Apply'.
  Document in components.css comments. Sites: ..."

## Detector 6: Empty / error / loading state gaps

**Detection.** Find list/feed/search components and surfaces that
appear to render data, and check whether each has explicit handling
for:
- Empty state (no data to show)
- Error state (fetch failed)
- Loading state (fetch in progress)

Heuristics: presence of `.map(...)` over an array prop, presence of
`useQuery` / `useSWR` / similar data hooks, absence of conditional
branches handling `loading` / `error` / `empty` flags.

**Severity rule.**
- `important` for missing empty state on user-facing lists (users WILL
  hit empty state on first use)
- `important` for missing error state on data-fetching components
- `nit` for missing skeleton/loader (a brief flash before content is
  tolerable)

**Remediation pattern.**
- "Add `.empty-state` component to `MessagesList.tsx` for zero-message
  case; copy: 'No messages yet — start a conversation'"
- "Add error branch to `Dashboard.tsx` rendering `.alert--danger` on
  query failure"

## Detector 7: Motion drift

**Detection.** Pattern-match against motion-system inconsistencies and
accessibility omissions:

- **Inline cubic-bezier values** — `cubic-bezier(0.4, 0, 0.2, 1)` appearing
  in component or page CSS instead of a `var(--motion-*)` token. Cluster
  by exact value; multiple sites using the same coefficients are one
  finding, sites with diverging coefficients are multiple.
- **Hardcoded transition durations** — `transition: ... 200ms ...` /
  `animation-duration: 350ms` in source, not referencing a `var(--dur-*)`
  token. Group by value (`200ms` everywhere is one finding; mixed
  `180ms / 200ms / 220ms` is a drift finding).
- **Doherty-violation candidates** — animations whose declared duration
  exceeds 300ms AND that block user interaction (modal entry transitions,
  route-change transitions, primary CTA confirmations). Pattern-match for
  `duration > 300ms` paired with `pointer-events: none` mid-transition,
  or for known-blocking animation patterns.
- **Missing `prefers-reduced-motion`** — files containing
  `animation`, `transition`, or `@keyframes` rules but no
  `@media (prefers-reduced-motion: reduce)` block anywhere in the
  stylesheet OR in a shared global stylesheet. Strong heuristic; flag
  even when uncertain.
- **Infinite-loop animations on non-progress elements** —
  `animation-iteration-count: infinite` on elements that aren't progress
  indicators, peripheral indicators, or ambient backgrounds. Pixar's
  return-to-rest violation; suggests skeleton-breathe or icon-pulse that
  drowns out actual content arrival.
- **Layout-property animations** — animations on `width`, `height`,
  `top`, `left`, `margin`, `padding`. Outside the 60fps performance
  envelope; should be `transform` / `opacity` / `filter`.

Cluster findings by *kind* (six sub-detectors above) and by *severity
profile* — e.g., "12 sites animating `width` in transition" is one
finding with 12 citations.

**Severity rule.**
- `blocker` for missing `prefers-reduced-motion` (accessibility floor) or
  Doherty-violation animations that gate input.
- `important` for inline cubic-bezier values in 5+ places, layout-property
  animations in heavily-trafficked components, infinite-loop animations on
  non-progress elements.
- `nit` for hardcoded durations within a tight cluster (e.g., 180/200/220
  variants), one-off layout-property animation in a low-traffic component.

**Remediation pattern.**
- "Lift `cubic-bezier(0.4, 0, 0.2, 1)` to `--motion-standard` token in
  motion.css; replace inline values in N files."
- "Add `@media (prefers-reduced-motion: reduce)` block to
  globals.css with fallback rules (set --dur-quick to --dur-instant; strip
  ambient loops)."
- "Replace `transition: width 400ms` in Accordion.tsx with
  `transition: transform 240ms var(--motion-standard)` + use scaleY for
  the open/close. Width animation is layout-thrashing; transform is
  compositor-only."
- "Modal entry currently 600ms and blocks input — exceeds Doherty 300ms
  ceiling. Either: shorten to 240ms (`--dur-quick`), or split into
  240ms enter + 360ms ambient settle that doesn't block input."

**Mockup-side remediation:** when generating mocks for a surface with
motion findings, include an `option-N-motion-fix.html` showing the same
layout with token-driven motion replacing the drifted values. The mock
becomes documentation of the proposed motion-system contract.

**When motion.css doesn't exist yet:** the motion drift findings drive
the case for delegating to the `motion` skill (Phase 4 of adopt). Pass
the inline-cubic-bezier values, the hardcoded durations, the missing
reduced-motion finding as context to `motion` so it can produce a
mirror-mode motion.css that captures the de-facto language and addresses
the accessibility gap.

## What detectors deliberately don't catch

Performance, business-logic correctness, security, dead code,
type errors, unit-test coverage. Those are other skills' jobs
(`repo-eval`, `simplify`, etc.). `adopt` stays in the UI/UX-design
lane — but motion drift IS in that lane, because motion is part of the
design system, even when it's been implemented as inline cubic-beziers
across 30 components.

## Finding shape in the report

Each finding renders as a markdown entry:

```markdown
### F-007 · important · design-system fragmentation
Hex `#3B82F6` used as primary blue in 14 places; should be `--color-accent`.

**Sites:**
- `src/components/Button.tsx:23`
- `src/components/Link.tsx:11`
- `src/pages/Dashboard.tsx:47`
- ... 11 more

**Remediation:** Add `--color-accent: #3B82F6` to tokens.css. Replace
inline hex with `var(--color-accent)` in listed files.

**Mockup remediation:** When mocking these surfaces in mirror mode,
generate option-2 that uses `--color-accent` to show the consolidated
state.
```

The `F-NNN` ids stay stable across re-syncs so users can refer to them
in conversation and substrate items.
