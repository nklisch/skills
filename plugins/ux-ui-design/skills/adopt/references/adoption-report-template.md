# adoption-report.md template

The single source of truth across the `adopt` skill — Phase 2 writes it,
Phases 3-6 update it, Phase 7 finalizes it, re-sync mode reads it.

Lives at `.mockups/adoption-report.md` (committed to the repo). The
report is markdown so reviewers can read it without tooling and so
agile-workflow's `scope` can read findings from it.

## Full template

```markdown
# Adoption Report

**Generated:** 2026-05-15
**Scan boundary:** Whole repo
**Mode chosen:** _(filled in Phase 3 — "Mirror" / "Reimagine" / "Diegetic prototype")_
**Stack detected:** _(e.g., "React + Vite, CSS modules, React Router v6")_

## Inventory

### UI surfaces

| ID | Surface | File(s) | Mock status |
|---|---|---|---|
| S-001 | Landing page | `src/pages/Landing.tsx` | _(Phase 5 decision)_ |
| S-002 | Login | `src/pages/Login.tsx` | _(filled later)_ |
| S-003 | Dashboard | `src/pages/Dashboard.tsx` | |
| S-004 | Settings — Account | `src/pages/settings/Account.tsx` | |
| S-005 | Settings — Notifications | `src/pages/settings/Notifications.tsx` | |
| S-006 | Settings — Billing | `src/pages/settings/Billing.tsx` | |
| ... | | | |

`Mock status` values: `mocked → <path>`, `deferred`, `skipped`,
`pending` (not yet decided).

### Flow candidates

Multi-page journeys identified by route grouping and navigation
links between pages.

| ID | Flow | Topology hint | Pages | Mock status |
|---|---|---|---|---|
| F-001 | Sign-up | Sequential | Landing → Sign-up form → Verify → Onboarding | pending |
| F-002 | Settings | Hub-and-spoke | Account / Notifications / Billing / Team | pending |
| F-003 | Checkout | Hybrid | Cart → Shipping → Payment → Review | pending |

### Design-system fragments

| Element | State | Where it lives |
|---|---|---|
| Color tokens | Partial — 8 CSS variables in `globals.css`, 14+ hardcoded hexes scattered | `src/styles/globals.css`, various |
| Typography | Implicit — system stack, no defined scale | n/a |
| Spacing | Ad-hoc — no scale | n/a |
| Components | 3 button variants, 2 modal implementations, 1 input pattern | `src/components/` |

## Findings

_(Filled by Phase 2 via scan-detectors. F-NNN ids stay stable across
re-syncs. Sorted by severity within each detector group.)_

### Design-system fragmentation

#### F-101 · important · hardcoded primary color
Hex `#3B82F6` used in 14 places; should be `--color-accent`.
- `src/components/Button.tsx:23`
- `src/components/Link.tsx:11`
- ... 12 more

**Remediation:** Add `--color-accent: #3B82F6` to tokens.css.

### Component duplication

#### F-201 · important · button divergence
Three button implementations:
- `src/components/Button.tsx` — rounded 8px, semibold
- `src/components/PrimaryButton.tsx` — rounded 4px, bold
- `src/pages/Checkout.tsx:147` — inline-styled, rounded 6px

**Remediation:** Unify under `.btn` from components.css; migrate
13 call sites.

### Accessibility gaps

#### F-301 · blocker · unlabeled form inputs
Five form inputs missing labels:
- `src/pages/Login.tsx:42` — email input
- `src/pages/Login.tsx:51` — password input
- `src/pages/Signup.tsx:38` — email input
- `src/pages/settings/Account.tsx:67` — display name
- `src/pages/settings/Account.tsx:74` — bio

**Remediation:** Add `<label for="...">` to each.

#### F-302 · blocker · suppressed focus styles
`outline: none` applied to all buttons in `globals.css:104` with no
replacement focus style.

**Remediation:** Add `:focus-visible` ring per components.css template.

### Layout drift

_(...etc per detector...)_

### Copy / voice inconsistency

_(...)_

### Empty / error / loading state gaps

_(...)_

### Motion drift (Detector 7)

#### F-701 · important · inline cubic-bezier sprawl
`cubic-bezier(0.4, 0, 0.2, 1)` inline in 18 component files; should be
`var(--motion-standard)` from motion.css.

**Sites:**
- `src/components/Modal.tsx:34`
- `src/components/Toast.tsx:21`
- ... 16 more

**Remediation:** Lift to `--motion-standard` in motion.css. Replace
inline cubic-bezier with `var(--motion-standard)`.

#### F-702 · blocker · Doherty violation on modal entry
Modal entry transition is 600ms and blocks user input — exceeds Doherty
300ms ceiling.

**Site:** `src/components/Modal.tsx:42`

**Remediation:** Shorten to 240ms (`--dur-quick`) for the input-gating
entry, optionally add a 360ms ambient settle that does NOT block input.

#### F-703 · blocker · missing prefers-reduced-motion
No `@media (prefers-reduced-motion: reduce)` block anywhere in source CSS,
despite extensive transition/animation usage. Accessibility floor.

**Remediation:** Add reduced-motion fallback block to motion.css (or
globals.css if motion.css isn't yet locked). Roughly 35% of users
benefit from reduced motion at some point.

#### F-704 · important · layout-property animation
`transition: width 350ms` on accordion expand — layout-thrashing, not
compositor-cheap.

**Site:** `src/components/Accordion.tsx:67`

**Remediation:** Replace with `transition: transform 240ms var(--motion-standard)`
using scaleY for the expand. Add `transform-origin: top`.

## Decisions

_(Filled by Phases 3-5)_

- **Mode:** Mirror — preserve current visual direction; remediate audit findings incrementally
- **Surfaces selected for this pass:**
  - S-002 Login
  - S-003 Dashboard
  - S-004 Settings — Account
  - F-002 Settings flow (hub-and-spoke)
- **Surfaces deferred:**
  - S-001 Landing (defer — being rewritten by marketing)
  - S-005, S-006 Settings sub-pages (covered by F-002 flow mock)
- **Surfaces skipped:**
  - (none this pass)

## Generated mockups

_(Filled by Phase 6 as each delegated skill returns)_

| Reference | Path | Mode | Audit findings addressed |
|---|---|---|---|
| Design system | `.mockups/design-system/tokens.css` | mirror | F-101, F-102 |
| Design system | `.mockups/design-system/components.css` | mirror | F-201, F-202, F-301, F-302 |
| Design system | `.mockups/design-system/motion.css` | mirror | F-701, F-703 (F-702, F-704 flagged for follow-up) |
| S-002 | `.mockups/screens/login/option-1.html` | mirror | F-301 |
| S-002 (remediation) | `.mockups/screens/login/option-2-remediation.html` | mirror | F-301, F-401 |
| S-002 (RTL mirror) | `.mockups/screens/login/option-1-rtl.html` | mirror | (Whose Default? — RTL persona) |
| F-002 | `.mockups/flows/settings/index.html` | mirror | F-201 |

## Whose Default? mirror-mocks (Phase 6.5)

_(Design Justice pass — Costanza-Chock 2020. Filled by Phase 6.5 as
mirror-mocks are generated for non-default personas.)_

For each surface mocked in Phase 6, at least one mirror mock for a
non-default persona. Findings name *who the existing UI excludes*, not
just "inconsistencies."

| Surface | Non-default persona | Mirror path | Finding(s) surfaced |
|---|---|---|---|
| S-002 Login | RTL script (Arabic) | `.mockups/screens/login/option-1-rtl.html` | Cart icon's "shipping" link still expects LTR reading; should mirror |
| S-002 Login | Screen-reader-only (transcript) | `.mockups/screens/login/option-1-sr-transcript.md` | "Sign in" button has no accessible name; reads as "button" |
| S-003 Dashboard | Low-bandwidth (no images loaded) | `.mockups/screens/dashboard/option-1-lowbw.html` | Empty-state for charts is "..." not informative |

Surfaces explicitly opted-out of the Whose Default? pass:
- (none this pass)

## Refusals (Phase 6.6, optional)

_(Filled only if the product has an explicit refusal-as-design position.
Lives at `.mockups/refusals.md` if generated.)_

- Linked: `.mockups/refusals.md` _(or "skipped — refusal-as-design isn't
  part of this product's identity")_

## Remediation queue

_(Filled by Phase 7 — findings that didn't get mocked-out)_

Findings not addressed in this adoption pass. Each is a candidate for
scoping as a substrate item or addressing in a future re-sync:

- **Blockers (do soon):**
  - F-302 suppressed focus styles — global change; needs its own item
- **Important (queue up):**
  - F-202 modal divergence — needs unify-and-migrate refactor
  - F-501 copy inconsistency on save actions — needs voice doc pass
- **Nits (when convenient):**
  - F-103 radius drift (4px vs 6px in two component files)

## Suggested next steps

1. **Scope blocker remediations as substrate items** — run
   `/agile-workflow:scope` on this report to formalize F-302 and any
   other blockers.
2. **Re-sync in 2-4 weeks** — re-run `/ux-ui-design:adopt` to refresh
   the inventory and audit; track whether findings get addressed over
   time.
3. **Pick deferred surfaces next pass** — S-001, S-005, S-006 are
   queued.
```

## Section ordering rules

1. **Inventory first** — readers want the map before the issues.
2. **Findings second** — grouped by detector, sorted by severity within
   each group.
3. **Decisions third** — chronological record of what the user picked.
4. **Generated mockups fourth** — the artifact links, traceable to
   findings.
5. **Remediation queue last** — the open-loop list for future work.

## Stable IDs

- `S-NNN` — surfaces (single screens / pages)
- `F-NNN` — finding ids (NOT to be confused with flow ids; finding ids
  start at F-101 by convention to leave the F-001..F-099 range for
  flow candidates)
- `F-001`..`F-099` — flow candidates
- `F-100`..`F-199` — design-system fragmentation findings
- `F-200`..`F-299` — component duplication findings
- `F-300`..`F-399` — accessibility-gap findings
- `F-400`..`F-499` — layout-drift findings
- `F-500`..`F-599` — copy/voice-inconsistency findings
- `F-600`..`F-699` — empty/error/loading-state findings
- `F-700`..`F-799` — motion-drift findings (Detector 7)

IDs stay stable across re-syncs. When a finding is resolved, mark it
RESOLVED in the next report rather than deleting — preserves history.

## Re-sync rules

When re-running `adopt` on a project with an existing report:

1. Read the prior report's Decisions section — preserve mode choice,
   preserve `skipped` decisions
2. Inventory: surfaces and flows that disappear get marked `REMOVED`
   (don't delete); new ones get new IDs
3. Findings: re-run detectors; findings that no longer fire get marked
   RESOLVED; new findings get new IDs; persistent findings keep their
   original ID
4. Update the Generated date; preserve the chosen mode unless the user
   explicitly switches
