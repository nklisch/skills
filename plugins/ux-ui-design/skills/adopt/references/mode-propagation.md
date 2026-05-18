# Mode propagation

How mirror vs reimagine modes change the context `adopt` passes to
delegated skills. No new flags on the delegated skills — context is
passed conversationally / in the invocation prompt.

## The mode contract

Every delegation includes three pieces of context:

1. **Mode** — `mirror` or `reimagine`
2. **Existing-state references** — file paths to existing implementation
3. **Audit findings** — which findings from the adoption report apply
   to this delegation

The delegated skill uses these to do the right thing without needing
explicit flag plumbing.

## Delegating to `palette`

### Mirror mode

```
You're being invoked by /ux-ui-design:adopt in MIRROR mode. The
project's existing design values have been scanned and are listed
below. Your job: produce a single tokens.css that captures the current
design system faithfully, plus a single palette.html and typography.html
preview to confirm with the user.

Scanned color tokens:
- Existing CSS variables in src/styles/globals.css:
  --color-primary: #3B82F6
  --color-text: #0F172A
  ...
- Hardcoded hex values found in source (consolidate to tokens):
  #3B82F6 (14 sites) — likely --color-accent
  #0F172A (8 sites) — likely --color-text-primary
  ...

Scanned typography:
- System font stack in use (no custom face loaded)
- Font sizes used: 12px, 14px, 16px, 20px, 24px (5 distinct values)

Scanned spacing:
- Ad-hoc values; common values: 4, 8, 12, 16, 20, 24, 32, 48px

Audit findings to address:
- F-101 (hardcoded primary color) — consolidate
- F-103 (radius drift 4/6px) — pick one, document
- F-302 (no focus styles) — add --color-focus token

Skip Phase 2 (aesthetic poles) and Phase 3 (three options) — go
directly to writing tokens.css from the scanned values. Confirm with
the user before locking. Generate palette.html showing the captured
state.
```

### Reimagine mode

```
You're being invoked by /ux-ui-design:adopt in REIMAGINE mode. The
project has existing visual choices documented below for context, but
the user wants a fresh design direction. Run your standard workflow
(3 palette options, 2 typography options) — existing choices are one
input among several, not the default.

Existing visual context (for reference, not constraint):
- Currently uses cool blue (#3B82F6) on neutral grays
- System font stack
- Tone: utilitarian SaaS

Audit findings that should inform the new palette:
- F-302 (no focus styles) — new palette must include focus token
- F-401 (contrast failures) — new palette must pass WCAG AA from
  the start

Run Phase 2 (aesthetic poles), pitch three genuinely different
directions. The user has signaled appetite for a new direction; don't
default toward "cleaned-up version of what exists."
```

## Delegating to `components`

### Mirror mode

```
You're being invoked by /ux-ui-design:adopt in MIRROR mode. Existing
component implementations have been inventoried below. Your job:
produce components.css that captures the current primitives
faithfully, unifying duplicates per the audit findings.

Inventoried components (mirror these in components.css):
- Button — three implementations to unify:
  - src/components/Button.tsx (default; 8px radius, semibold)
  - src/components/PrimaryButton.tsx (4px radius, bold)
  - src/pages/Checkout.tsx:147 (inline-styled, 6px radius)
  Decision: use the most-common shape (8px / semibold) as default;
  generate .btn, .btn-primary, .btn-secondary, .btn-ghost.
- Input — single implementation at src/components/Input.tsx
- Modal — two implementations to unify (Modal.tsx, Dialog.tsx)
- Card — pattern repeated inline; no shared component

Skip Phase 2 starter-set picking — components are determined by the
inventory. Skip Phase 3 unique-component identification — flag any
project-unique candidates in the inventory comment but don't force
new components.

Audit findings to address:
- F-201 (button divergence) — unify per Decision above
- F-202 (modal divergence) — unify Modal/Dialog
- F-301, F-302 (a11y gaps on form/buttons) — components.css must
  include labels, focus styles per accessibility spec
```

### Reimagine mode

```
You're being invoked by /ux-ui-design:adopt in REIMAGINE mode. The
project has existing component patterns documented below for context,
but the user wants fresh primitives. Run your standard workflow
(Phase 2 starter set, Phase 3 project-unique components) — existing
patterns inform what's needed (e.g., the project HAS modals, so
include them) but not how they should look.

Existing component context (for what's needed, not how):
- The project uses: buttons, inputs, modals, cards, lists
- Project-unique candidates: account-row (repeated 4 times in account
  listings), metric-tile (repeated 6 times in dashboard)

Audit findings that should inform the redesign:
- F-301, F-302 — accessibility floor (labels, focus rings) is
  non-negotiable in the new design
- F-501 (copy voice drift on save actions) — components.css comments
  should pin the voice (one save verb per context)
```

## Delegating to `screens`

### Mirror mode

```
You're being invoked by /ux-ui-design:adopt in MIRROR mode for surface
S-002 (Login page). Generate ONE option (option-1.html) that faithfully
captures the current implementation.

Existing implementation:
- File: src/pages/Login.tsx
- Layout: centered card on white background, email + password fields,
  primary CTA "Sign in", "Forgot password?" link, optional SSO buttons
- Styles: inherits tokens.css and components.css from this adoption
  pass

Use component classes (.btn, .input, .field). Inline styles only for
the page-level layout (centering, max-width). Embed audit findings as
HTML comments inside the option for the user to see in context:

<!-- F-301: email input missing <label> in current implementation.
     Mirror captures the current state; see option-2-remediation.html
     for the proposed fix. -->

Also generate option-2-remediation.html: the same layout but with the
audit findings addressed (labels added, focus styles correct,
unified button styles). The index.html should be a 2-cell
side-by-side (current state vs proposed state) so reviewers can see
what changes.

Skip Phase 2.5 (aesthetic territory) — the aesthetic is locked by
mirror mode.
```

### Reimagine mode

```
You're being invoked by /ux-ui-design:adopt in REIMAGINE mode for
surface S-002 (Login page). Run your standard 4-option workflow.

Existing implementation context (constraint, not default):
- File: src/pages/Login.tsx
- Data the page handles: email, password, optional SSO (Google,
  GitHub), remember-me, forgot-password link
- Audience: existing customers and trial signups
- Domain copy: see the file for current strings; treat as starting
  point, refine in mocks

Audit findings to inform the redesign:
- F-301 — every option must label form inputs
- F-401 — every option must pass WCAG AA contrast

Run Phase 2.5 (aesthetic territory) as normal. Pitch four genuinely
different directions; existing centered-card shape is one possible
direction, not the default.
```

## Delegating to `flows`

### Mirror mode

```
You're being invoked by /ux-ui-design:adopt in MIRROR mode for flow
F-002 (Settings).

Detect topology from existing routing/nav code, don't ask the user:
- src/routes.tsx shows /settings/account, /settings/notifications,
  /settings/billing, /settings/team as peer routes
- src/components/SettingsNav.tsx renders a persistent sidebar nav
- No "next" buttons in any settings page

Topology: hub-and-spoke. Use .flow-nav chrome (or .nav-bar if
components.css defines it).

Generate one page per peer route, mirroring the current
implementation. Use component classes. Embed audit findings as HTML
comments inline. The index.html should be the hub-and-spoke variant
(peer grid grouped if natural sub-sections exist).

For each page with high-severity findings, also generate a
*-remediation.html sibling showing the proposed fix.
```

### Reimagine mode

```
You're being invoked by /ux-ui-design:adopt in REIMAGINE mode for
flow F-002 (Settings).

Existing journey shape: hub-and-spoke (4 peer routes with sidebar
nav). Use that as input but don't lock the topology — Phase 2.5
should still ask whether the redesign keeps hub-and-spoke or
restructures (e.g., to a single long page with anchors, or to a
wizard for first-time setup).

Run standard workflow. Existing audit findings inform the redesign
brief: every page must label inputs, pass AA contrast, use the new
component primitives consistently.
```

## What stays the same across modes

- File paths: `.mockups/screens/<surface-id>/...`,
  `.mockups/flows/<flow-id>/...`, `.mockups/design-system/...`
- Tech stack: vanilla HTML/CSS/JS, single-file mocks
- Linking: every mock links tokens.css and components.css
- The adoption report is the cross-skill source of truth
