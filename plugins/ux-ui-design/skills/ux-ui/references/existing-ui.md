# Existing UI — stances, audit, and reports

Working on a product that already has UI: code, screenshots, or a shipped
product the user names. The audit informs; the user picks a stance; the
work follows the stance.

## Contents

- The three stances
- The audit
- The seven detectors
- The report
- Whose-default mirror-mocks
- Refusals

---

## The three stances

- **Mirror** — capture what exists, faithfully, as the reference. Findings
  become remediation proposals shown side-by-side with the mirror.
- **Reimagine** — redesign. Existing UI informs constraints (data shape,
  audience, copy voice) but the visual direction is open. Findings inform
  the redesign brief.
- **Diegetic prototype** — propose a future, not mirror the present. The
  mock comes with fake-OS chrome, fake timestamps, fake-handset frames,
  situating itself in a world the product could plausibly live in. For
  "what if this product existed in 2031" strategy passes; the audit is
  optional here.

The audit runs the same way regardless; only what the findings *mean*
changes. Re-sync passes (mockups drifted from code) read the prior report
and ask whether to refresh inventory, audit, or both — preserving prior
decisions that still hold.

## The audit

Inventory first, then findings. Inventory targets: UI surfaces (pages,
routes, top-level components) grouped by feature area; flow candidates
(navigation-linked sequences); design-system fragments (token-like values,
component implementations, layout primitives); tech-stack signals
(framework, styling approach). Large repo → use a sub-agent for the read.

## The seven detectors

Heuristic — they surface candidates; the user adjudicates. False positives
are expected. Severity: `blocker` (breaks accessibility or core flows),
`important` (erodes quality at scale), `nit` (polish).

1. **Design-system fragmentation** — hardcoded colors/spacing/radii where
   tokens should be; the same value spelled five ways.
2. **Component duplication** — 3+ button implementations, 2+ modals, the
   same primitive rebuilt per feature.
3. **Accessibility gaps** — missing labels, missing focus styles,
   sub-AA contrast, missing ARIA on interactive elements, missing alt text.
4. **Layout drift** — mixed grid systems, ad-hoc breakpoints, inconsistent
   container widths.
5. **Copy / voice inconsistency** — the same action labeled differently
   across surfaces; tone shifts mid-flow.
6. **Empty / error / loading state gaps** — screens that only exist in
   their happy resting state.
7. **Motion drift** — inline cubic-beziers, hardcoded durations, missing
   reduced-motion handling, layout-thrashing animations.

Detectors deliberately don't catch: taste disagreements, stack choices,
naming conventions, or anything a linter owns.

## The report

Written to `.mockups/adoption-report.md` — markdown, committed, readable
without tooling. Sections: scan boundary and date; the chosen stance;
surface inventory (id, surface, source path, mocking decision); findings
(stable `F-NNN` ids, severity, detector, evidence, remediation pattern);
per-surface decisions; whose-default mirror-mocks; refusals; and a wrap-up
of un-mocked findings with a suggested re-sync timeframe.

## Whose-default mirror-mocks

When mirroring or reimagining an existing surface, offer one mock per
surface that challenges the likely default: right-to-left layout, a
screen-reader transcript view, a low-bandwidth rendering, or a non-Latin
script expansion. Pick the one that best stresses this product's
assumptions. The point: the "default user" the current UI assumes is a
choice, and seeing the surface through another default exposes what the
choice costs.

## Refusals

For products whose identity is partly what they *refuse* (no infinite
scroll, no notifications, no dark patterns), offer `.mockups/refusals.md`:
what the product intentionally lacks, with one-line reasons. Optional, and
only when the refusal is load-bearing identity — not a list of features
nobody built yet.
