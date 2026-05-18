# Scan detectors

The six audit detectors `adopt` runs during Phase 2. Each detector has a
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

## What detectors deliberately don't catch

Performance, business-logic correctness, security, dead code,
type errors, unit-test coverage. Those are other skills' jobs
(`repo-eval`, `simplify`, etc.). `adopt` stays in the UI/UX-design
lane.

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
