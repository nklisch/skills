# Mode propagation

How `adopt`'s three modes (mirror / reimagine / diegetic-prototype) change
the context passed to delegated skills. No new flags on the delegated
skills — context is passed conversationally / in the invocation prompt.

## The mode contract

Every delegation includes three pieces of context:

1. **Mode** — `mirror`, `reimagine`, or `diegetic-prototype`
2. **Existing-state references** — file paths to existing implementation
   (omitted or treated as backdrop in `diegetic-prototype` mode)
3. **Audit findings** — which findings from the adoption report apply
   to this delegation (informs constraints in all three modes)

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

### Diegetic-prototype mode

```
You're being invoked by /ux-ui-design:adopt in DIEGETIC-PROTOTYPE mode.
This is a spec-fiction pass — the project is proposing a future, not
mirroring the present. Existing visual context is BACKDROP only.

Backdrop (for tone, not constraint):
- Currently uses cool blue (#3B82F6) on neutral grays
- System font stack

Proposed future framing (the user's vision):
- "What would this product feel like if it were calm-tech and built for
  attention reclamation, three years from now?"

Audit findings that should inform the new palette:
- F-302 (no focus styles) — new palette must include focus token
- F-401 (contrast failures) — new palette must pass WCAG AA from the start

Run Phase 2 (aesthetic poles), pitch palette options that match the
PROPOSED FUTURE framing. Do not anchor to the existing blue. Add
diegetic-chrome considerations: the mocks will ship with fake-OS
chrome, so the palette should look right alongside a translucent fake
status bar.
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

### Diegetic-prototype mode (components)

```
You're being invoked by /ux-ui-design:adopt in DIEGETIC-PROTOTYPE mode.

The product is proposing a future; the components reflect what THAT
product needs, not what the current product has. Existing component
inventory is backdrop.

Existing context (backdrop):
- The current product has: buttons, inputs, modals, cards, lists,
  basic data tables

Proposed future framing:
- "Calm-tech daily-digest product for attention reclamation"
- Key project-unique components to imagine: a "digest card" (one day's
  summary), an "outside widget" (local sunrise + native species in
  bloom), an "end-of-session" sentinel

Run Phase 2 with the proposed-future filter — pick a component starter
set that supports digest-style UI, not feed-style. Add the project-unique
components above.

Audit findings still apply: accessibility floor non-negotiable.
```

## Delegating to `motion`

### Mirror mode

```
You're being invoked by /ux-ui-design:adopt in MIRROR mode. The project's
existing motion patterns have been scanned and are listed below. Your job:
produce a single motion.css that captures the current de-facto motion
language faithfully, plus a single motion.html showcase to confirm with
the user.

Scanned inline cubic-bezier values (lift to named tokens):
- `cubic-bezier(0.4, 0, 0.2, 1)` (used 18 sites — likely --motion-standard)
- `cubic-bezier(0.0, 0, 0.2, 1)` (used 6 sites — likely --motion-productive)
- `ease-out` shorthand (used 4 sites — also --motion-productive equivalent)

Scanned hardcoded durations:
- 200ms (most common; map to --dur-quick at 200ms)
- 150ms (5 sites; map to --dur-instant)
- 400ms (3 sites — Doherty-edge; map to --dur-quick at 240ms WITH
  finding F-701 flagging the 400ms instances)

Scanned attitude signal:
- Most transitions are utilitarian fades and slides; no overshoot or
  spring patterns
- ⇒ Attitude pick: productive + standard

Scanned reduced-motion handling:
- F-703 (blocker): NO `prefers-reduced-motion` block found anywhere in
  source CSS

Scanned drift findings (from Detector 7):
- F-701 (important): three 400ms transitions on modal entries that gate
  input — exceed Doherty 300ms budget
- F-702 (important): `transition: width 350ms` in Accordion.tsx — layout
  thrash, not transform-only
- F-703 (blocker): missing prefers-reduced-motion globally
- F-704 (nit): infinite-loop animation on skeleton-placeholder; no
  return-to-rest

Skip Phase 2 (attitude pitching) — the attitude is locked by the scan
(productive + standard). Skip Phase 3 (curve language) options — emit the
two used curves + one spare (--motion-emphasized) for future use.

Emit motion.css that:
- Captures the de-facto curves as named tokens
- Sets --dur-instant 150ms, --dur-quick 240ms (the 200ms common case
  rounds up so it composes with Doherty), --dur-ambient 600ms
- Includes the prefers-reduced-motion fallback block (the blocker fix
  for F-703)
- Documents the Doherty-violation findings (F-701) in the header comment
  as "needs follow-up" rather than silently fixing — the user needs to
  agree the modal-entry durations come down

Generate motion.html with each curve, plus a section showing the F-701
remediation side-by-side (current 400ms vs proposed 240ms).
```

### Reimagine mode

```
You're being invoked by /ux-ui-design:adopt in REIMAGINE mode for motion.
The project has existing motion patterns documented below for context,
but the user wants a fresh kinetic direction.

Existing motion context (for reference, not constraint):
- Current de-facto language: cubic-bezier(0.4, 0, 0.2, 1) standard +
  cubic-bezier(0.0, 0, 0.2, 1) decel; 200/350ms durations; no spring,
  no overshoot
- Tone: utilitarian / productive

Audit findings that inform the redesign:
- F-701 — Doherty-violation: new motion system MUST enforce the 300ms
  input-gating ceiling
- F-703 — accessibility blocker: new motion.css MUST ship with
  prefers-reduced-motion handling

Run Phase 2 (attitude pitching) as normal. The user has signaled appetite
for a new kinetic direction; don't default to "cleaned-up productive."
Pitch attitude options that genuinely vary (calm vs expressive vs
restrained) — the existing utilitarian feel is one possibility, not the
default.

Phase 5 (springs) is in scope only if the user signals gesture-driven UI.
Phase 7 (hold-beat) is in scope only if Calm/Cinematic attitude lands.
```

### Diegetic-prototype mode (motion)

```
You're being invoked by /ux-ui-design:adopt in DIEGETIC-PROTOTYPE mode
for motion. The product is proposing a future kinetic feel.

Existing motion patterns: utilitarian fades; no overshoot; no
prefers-reduced-motion.

Proposed future framing:
- "Calm-tech kinetic voice — peripheral motion for ambient state,
  long --hold-beat between segments, no demands on attention."

Run Phase 2 with the calm attitude pre-pinned. Use --dur-ambient liberally
for background motion (peripheral indicator, gradient drifts) and reserve
--dur-quick for state changes only. Enable hold-beat (Phase 7) and skip
springs (Phase 5) and Disney principles (Phase 6) — calm-tech rejects
playful overshoot and squash-and-stretch.

Reduced-motion floor is non-negotiable.
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

### Diegetic-prototype mode (screens)

```
You're being invoked by /ux-ui-design:adopt in DIEGETIC-PROTOTYPE mode for
surface S-002 (Login page).

The mock is part of a spec-fiction pass — propose a future, don't mirror
the present. Existing implementation is backdrop:
- Currently a centered card with email + password fields and SSO buttons
- Audience: existing customers and trial signups

Proposed future framing:
- "What would login feel like for a calm-tech daily-digest product? The
  user is coming back to their own work, not joining a feed. Removing
  the social trappings is part of the design."

Run standard 4-option workflow with two adjustments:

1. Each option ships with **diegetic chrome** — fake OS bar at top
   (`<header class="diegetic-os-bar">`), fake handset frame (CSS
   `.diegetic-handset { border-radius: 36px; box-shadow: ...; }`), fake
   timestamp ("9:47 · 2031-04-15"). The chrome situates the mock in a
   world.

2. Include in-frame "evidence" components — fake push-notification stack
   showing one calm notification ("Your morning digest is ready"), fake
   spec-sheet sidebar describing the product's stated philosophy. These
   make the mock self-contained as a strategy artifact.

Audit findings still apply: every option labels inputs, passes WCAG AA.
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

### Diegetic-prototype mode (flows)

```
You're being invoked by /ux-ui-design:adopt in DIEGETIC-PROTOTYPE mode for
flow F-002 (Settings).

Existing journey: hub-and-spoke (4 peer routes with sidebar nav). This is
backdrop, not constraint.

Proposed future framing:
- "Settings as preparation — chanoyu / tea-ceremony lineage. The user
  comes to settings deliberately, performs a small set of considered
  adjustments, and leaves. Not feed-like; not fast."

Run standard workflow. Phase 2.5 topology selection should reconsider:
sequential ceremonial-onboarding might fit better than hub-and-spoke for
the proposed future.

Each page ships with diegetic chrome (fake OS bar, fake handset frame).
Cross-page consistency is the craft demand — the chrome must be
byte-identical across pages.

Audit findings still apply.
```

## What stays the same across modes

- File paths: `.mockups/screens/<surface-id>/...`,
  `.mockups/flows/<flow-id>/...`, `.mockups/design-system/...`
- Tech stack: vanilla HTML/CSS/JS, single-file mocks
- Linking: every mock links tokens.css, components.css, and motion.css
  (when they exist)
- The adoption report is the cross-skill source of truth
- The "Whose Default?" mirror pass (Phase 6.5 in adopt) runs after every
  surface mock regardless of mode — Design Justice's lens applies to
  proposed futures too, not just current-state captures
