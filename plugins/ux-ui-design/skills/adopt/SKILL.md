---
name: adopt
description: >
  ALWAYS invoke this skill when the user asks to adopt mockup-first design in an existing project,
  audit UI inconsistencies, mirror current screens into mocks, redesign an app, or sync drifted
  mockups. Inventories UI surfaces and design-system fragments, audits gaps, then orchestrates
  palette, components, screens, and flows in MIRROR or REIMAGINE mode. Produces
  .mockups/adoption-report.md with inventory, findings, and decisions.
---

# Adopt

The existing-project on-ramp for mockup-first design. Most projects don't
start with this plugin — they arrive with UI code already in place. `adopt`
is the skill that brings such a project into the convention: it scans
what exists, audits the design quality, and orchestrates the full
pipeline (`palette` → `components` → `screens` → `flows`) to produce
mockups in one of two modes.

The three modes correspond to the actual choice users face when adopting
mockup-first onto an existing project:

- **Mirror** — capture what exists, faithfully, as the reference. Audit
  findings become remediation proposals shown side-by-side.
- **Reimagine** — redesign. Existing code informs constraints (data
  shape, audience, copy voice) but the visual direction is open. Audit
  findings inform the redesign brief.
- **Diegetic prototype** — propose a future, not mirror the present.
  Bruce Sterling lineage: the mock comes with fake-OS chrome, fake
  timestamps, fake-handset frames, so it situates itself in a *world*
  the product could plausibly live in. Use for "what if this product
  existed in 2031" / strategy / spec-fiction passes, not for adopting an
  existing codebase into the convention.

Audit always runs (except for pure diegetic-prototype passes that are
strategy-mode and explicitly opt out of audit). The findings inform
whichever mode the user picks.

## When to invoke

User triggers:
- "adopt this project into mockup-first design"
- "bootstrap design system for our existing app"
- "audit our UI for inconsistencies"
- "mock our current screens"
- "redesign our app"
- "what screens do we have"
- "design sync — mocks have drifted from code"

Agent-driven triggers:
- An `epic-design` or `scope` pass starts on a project that has existing
  UI code but no `.mockups/` artifacts yet.
- A `feature-design` pass on a feature touching screens that have never
  been mocked, and the parent epic didn't run `adopt` first.
- A `repo-eval` pass surfaces "no design-system artifacts present despite
  substantial UI code."

## Distinction from sibling skills

| Skill | Greenfield use | Adoption use |
|---|---|---|
| `palette` | Generate fresh tokens.css | Called by `adopt` in mirror mode with existing colors as constraints, or in reimagine mode with fresh exploration |
| `components` | Generate fresh components.css | Called by `adopt` after palette; mirror captures current components, reimagine designs new |
| `screens` | 4-option exploration of one screen | Called by `adopt` per surface; mirror → 1 faithful option + remediation options, reimagine → standard 4-option |
| `flows` | Multi-page journey design | Called by `adopt` per flow; mode-aware just like screens |
| `adopt` | **n/a** | **Orchestrator + auditor for existing projects.** Don't use on greenfield — go directly to palette/components/screens/flows. |

## Workflow

### Phase 1: Ground and confirm scan boundary

Confirm `ux-ui-principles` is loaded; install the project agent-instructions
block if the marker is missing (`AGENTS.md` first, `CLAUDE.md` only as a
compatibility target).

Check whether `.mockups/adoption-report.md` already exists:
- **Absent** → first-run adoption.
- **Present** → re-sync mode. Read the prior report; ask whether to
  refresh inventory, refresh audit, or both. Re-sync preserves prior
  user decisions where they still hold.

Confirm scan boundary via `structured question tool`:

```
Q: What's the scan boundary?
- Whole repo (Recommended) — covers everything; scan is fast on most projects
- A specific directory — narrow to one part of the app (provide path)
- Current branch's changes only — scan files modified on this branch vs main
```

### Phase 2: Scan and audit

Scan the codebase to produce a structured inventory + audit findings.
This phase is heavy reading — prefer spawning a sub-agent (Explore or
general-purpose) for parallel exploration if the repo is large.

**Inventory targets:**
- **UI surfaces** — pages, routes, top-level components, layouts. Group
  by feature/area when the project's structure makes that natural.
- **Flow candidates** — sequences of pages tied together by navigation
  (sign-up, checkout, settings, onboarding wizards).
- **Design-system fragments** — token-like values (CSS variables, color
  palettes, spacing scales), component libraries (button.tsx, input.tsx,
  card.tsx), shared layout primitives.
- **Tech stack signals** — framework (React, Vue, Svelte, vanilla),
  styling approach (CSS modules, Tailwind, styled-components, plain
  CSS), routing.

**Audit detectors** (see `references/scan-detectors.md` for full
heuristics and example findings):
- **Design-system fragmentation** — hardcoded colors instead of tokens,
  mixed spacing values, inconsistent radii
- **Component duplication** — multiple implementations of the same
  primitive (3+ "button" variants, 2+ "modal" implementations)
- **Accessibility gaps** — missing labels, missing focus styles, sub-AA
  contrast heuristic, missing ARIA on interactive elements, missing alt
  text
- **Layout drift** — mixed grid systems, ad-hoc breakpoints,
  inconsistent container widths
- **Copy/voice inconsistency** — same action labeled differently across
  surfaces ("Save" / "Save changes" / "Update")
- **Empty/error/loading state gaps** — surfaces with only happy-path UI

Each finding gets `file:line` citations, severity (`blocker` /
`important` / `nit`), and a one-line remediation.

**Write `.mockups/adoption-report.md`** using the template in
`references/adoption-report-template.md`. The report is the single
source of truth across this skill — every subsequent phase reads from
and writes to it.

### Phase 3: Pick mode

This is the user's "first question." Use `structured question tool`:

```
Q: How should we approach this adoption?
- Mirror — capture current UI faithfully; audit findings become side-by-side remediation proposals
- Reimagine — redesign; existing code informs constraints but the visual direction is open
- Diegetic prototype — propose a future the product could live in (fake OS chrome, fake timestamps); spec-fiction mode, not adoption-of-existing
```

Frame the trade-off explicitly:

- **Mirror** is the right call when the existing UI is roughly working
  but needs documentation and consistency cleanup. The mocks become
  the alignment artifact for ongoing work; audit findings get fixed
  incrementally.
- **Reimagine** is the right call when the project is ready for a
  visual overhaul, when the existing UI is a prototype that needs to
  be replaced, or when leadership has explicitly green-lit a redesign.
- **Diegetic prototype** is the right call when the project wants to
  *propose* a future (a "what if" / vision document / spec-fiction
  artifact) rather than mirror the present. Each mock comes with
  diegetic chrome (fake OS bar, fake handset frame, fake timestamps,
  in-frame "evidence" components like a fake push-notification stack)
  so it situates itself in a world. Bruce Sterling's design-fiction
  lineage. Audit can run optionally — it informs the proposed future
  rather than the current state.

Record the choice in the adoption report.

### Phase 4: Design-system gap-fill

Check what exists in `.mockups/design-system/`:

| State | Action |
|---|---|
| Neither `tokens.css` nor `components.css` nor `motion.css` exist | Delegate to `palette` → `components` → `motion`, mode-aware |
| `tokens.css` exists but `components.css` doesn't | Delegate to `components`, then `motion`, mode-aware |
| `tokens.css` + `components.css` exist but `motion.css` doesn't, AND the audit found motion drift (Detector 7) | Delegate to `motion`, mode-aware |
| All three exist | Skip (or offer refinement if the scan surfaced gaps) |

**Mode propagation to palette:**
- **Mirror:** pass the scanned color/type/spacing values as starting
  point. `palette` generates a single option that captures current
  design system; user confirms or lightly refines.
- **Reimagine:** standard `palette` workflow (3 palette options, 2
  typography options). Existing values surface as one input but not
  the default.
- **Diegetic prototype:** standard `palette` workflow but framed as
  "what palette would this product use in 2031 / under the strategy / etc.";
  audit findings inform constraints (data viz needs, accessibility floor)
  but not the visual direction.

**Mode propagation to components:**
- **Mirror:** pass the scanned component inventory. `components`
  generates `components.css` that captures the current primitives;
  duplicates get unified per audit findings.
- **Reimagine:** standard `components` workflow (Phase 2 picks
  starter set, Phase 3 identifies project-unique components from the
  scanned inventory).
- **Diegetic prototype:** standard workflow; the project-unique
  components reflect the proposed future, not the current state.

**Mode propagation to motion:**
- **Mirror:** pass the scanned motion drift (inline cubic-bezier values,
  hardcoded durations, animations exceeding Doherty 300ms input-gating
  budget, missing reduced-motion). `motion` generates a single attitude
  + curve set that captures the current de-facto language; the audit
  findings become motion.css refinements.
- **Reimagine:** standard `motion` workflow (Phase 2 picks attitude,
  Phase 3 named curves, etc.). Existing inline values are one input;
  Doherty-coupling and reduced-motion are non-negotiable in the new
  design.
- **Diegetic prototype:** standard workflow; the attitude reflects the
  proposed future (a "what would a calm-tech version of this product
  feel like" pass).

See `references/mode-propagation.md` for the exact context to pass
each delegated skill.

### Phase 5: Pick surfaces to mock

Present the inventory from Phase 2 and ask which surfaces to mock now.
Use a multi-select `structured question tool`:

```
Q: Which surfaces should we mock now? (multi-select)
- Landing / marketing page
- Sign-in / sign-up flow
- Dashboard
- Settings area
- (etc — one option per inventoried surface)
- All inventoried surfaces
- High-severity audit findings only
```

Don't force every surface to be mocked in one pass. Adoption can run
incrementally — the user picks the top priority surfaces; the rest
stay on the inventory list in the adoption report for future passes.

Record the selection in the adoption report (chosen / deferred /
explicitly skipped). Surfaces marked "explicitly skipped" don't surface
again in re-sync mode.

### Phase 6: Generate per surface

For each selected surface, delegate to `screens` (single-screen
surfaces) or `flows` (multi-page journeys) with mode context.

**Mode propagation to screens:**
- **Mirror:**
  - Invoke `screens` with `--count 1` and tell it: "Mirror mode.
    Existing implementation at `<path>`. Read that file, produce ONE
    option that faithfully captures the current layout, typography,
    and content. Use components.css classes. Audit findings to address
    as HTML comments inline: `<finding-list>`."
  - For each `blocker` or `important` finding on the surface, generate
    `option-2-remediation.html` showing the proposed fix side-by-side
    in the 2x2 index.
- **Reimagine:**
  - Invoke `screens` standard 4-option workflow. Pass existing
    implementation as constraint context (data shape, audience, copy
    voice), pass audit findings as inputs to the redesign brief.

**Mode propagation to flows:**
- **Mirror:** invoke `flows`; instruct it to determine topology from
  existing routing/navigation code (not from heuristics), then capture
  each page faithfully. Audit findings as inline comments. The
  topology is detected, not asked.
- **Reimagine:** standard `flows` workflow with topology selection.
  Existing journey is one input among several.

See `references/mode-propagation.md` for the full delegation
templates.

### Phase 6.5: "Whose Default?" mirror-mocks (Design Justice pass)

Sasha Costanza-Chock's *Design Justice* (MIT Press 2020) frames a question
Western mocks chronically skip: **whose default persona is this design
serving?** The pipeline's mocks default toward an able-bodied, high-bandwidth,
LTR-script, dominant-language user. That default ships unless the design
process actively challenges it.

For each surface mocked in Phase 6, generate at least ONE mirror-mock for a
non-default persona. Pick the personas from the scanned project context —
not all four for every surface, but at least one per surface, picked to
challenge the most-likely default:

- **Low-bandwidth / poor-connection mirror.** The same surface rendered as
  if every image is unloaded, every web font is fallback, every fetch is
  pending. Reveals whether the design degrades gracefully.
- **Screen-reader-only mirror.** A transcript of what VoiceOver / NVDA /
  TalkBack reads for the surface, in order. Reveals semantic-tree quality.
- **RTL-script mirror.** The surface mirrored for RTL languages (Arabic,
  Hebrew). Reveals layout assumptions that don't generalize.
- **Non-Latin / non-English mirror.** The surface with content in a
  long-glyph language (German compounds, Hindi) or non-Latin script
  (Chinese, Cyrillic). Reveals text-overflow assumptions.

The mirror lives at `.mockups/screens/<surface-id>/option-N-rtl.html` (etc.)
and joins the index alongside the canonical option. Each carries a header
comment:

```html
<!--
  "Whose Default?" mirror — RTL script (Arabic).
  Tests whether the option-2 design generalizes when reading direction
  flips. Bug surfaced: the cart icon's "shipping address" link still
  expects LTR reading order; should mirror to RTL.
-->
```

Findings from the mirror pass become a "Whose Default?" section in
`.mockups/adoption-report.md`. The audit lens explicitly names *who the
existing UI excludes*, not just "inconsistencies."

Skip Phase 6.5 only when the user explicitly opts out (e.g., "this is a
proof-of-concept; we'll do persona mocks at v1") AND records the opt-out
in the adoption report.

### Phase 6.6: Refusals footer (optional)

For products that have an explicit "things this product deliberately does
NOT do" position (refusal-as-design lineage: Light Phone, Freewrite,
write-only journals, one-button apps), generate `.mockups/refusals.md`
listing what the product refuses to add, with reasons.

```markdown
# Refusals

What this product deliberately does not do, and why.

## No infinite scroll
The product is meant to be finished, not browsed-without-end. The end-of-feed
sentinel is the design.

## No notifications
Notifications are interruption. Users come back when they choose to.

## No social-reciprocity baits
No "people you may know"; no "10 friends saved this"; no "they're online now."
The product is about the user's own work, not their relationship to others.

## No infinite undo
Editing is a commitment. Past edits are recoverable from history; past
versions don't auto-reappear.
```

Surface this as a section in the index.html for the landing page (a footer
strip linking to `refusals.md`), so the position is visible to anyone
reviewing the design.

Skip when refusal isn't part of the product's identity. Most products
don't need this artifact; the few that do really do.

### Phase 7: Wrap and record

Update `.mockups/adoption-report.md`:
- Mark each mocked surface with its mockup path AND its "Whose Default?"
  mirror paths (from Phase 6.5)
- Mark deferred surfaces explicitly (don't lose them)
- Promote each remaining `blocker` / `important` finding to a
  "Remediation queue" section with concrete next steps
- If Phase 6.6 produced `refusals.md`, link it from the report

If `agile-workflow` is in use, **suggest** (don't auto-create) scoping
the top remediations as substrate items:

```
The adoption report has 4 blocker findings. Want to scope them as
substrate items? (run /agile-workflow:scope on .mockups/adoption-report.md)
```

Preserve the loose coupling — let the user decide whether substrate
items make sense.

`git add .mockups/adoption-report.md .mockups/design-system/
.mockups/screens/ .mockups/flows/`. Add `.mockups/refusals.md` if it
exists. Tell the user adoption is recorded.

## Re-sync mode

When `.mockups/adoption-report.md` already exists at invocation:

1. Read the prior report; note prior mode, prior surface decisions,
   prior remediation queue
2. Ask via `structured question tool`:
   ```
   Q: What kind of re-sync?
   - Refresh inventory + audit only — produce a new findings list, don't regenerate mocks
   - Re-sync specific surfaces — pick from the inventory; regenerate mocks for those
   - Full re-adopt — re-run all phases as if first-run
   ```
3. Carry forward prior decisions where they still apply (mode choice,
   skipped surfaces). Surface drifts (new surfaces, surfaces whose
   implementation has changed substantially) get flagged explicitly.

Re-sync is the recurring use case — projects evolve; mocks drift; the
adoption report is the alignment artifact that keeps them in step.

## Anti-patterns

- **Don't run this on a greenfield project.** Go straight to `palette`
  / `components` / `screens` / `flows`. `adopt` is the existing-project
  on-ramp; on a fresh project it's strictly slower than the direct path.
- **Don't auto-create substrate items.** The plugin maintains loose
  coupling with `agile-workflow`. Suggest scoping the remediation
  queue; let the user decide.
- **Don't try to mock everything in one pass.** Adoption is
  incremental — pick top priorities, leave the rest in the inventory
  for future re-syncs. Mocking 30 surfaces in one session produces
  surface-level capture without depth on any of them.
- **Don't bypass `palette` and `components`.** Phase 4 is non-optional.
  Without tokens.css and components.css, the per-surface mocks drift
  from each other and the consistency the plugin promises evaporates.
- **Mirror mode is faithful, not slavish.** When the existing UI has
  a clear bug or accessibility gap, mirror mode captures it AND
  generates a remediation option. Don't reproduce broken UX without
  flagging it.
- **Reimagine mode isn't permission to ignore reality.** Existing data
  shape, audience, and domain copy are still constraints. The
  reimagine is visual + structural, not "design as if the product
  doesn't exist."
- **Audit findings are claims, not gospel.** Heuristic detectors find
  candidates; the user adjudicates. False positives in the adoption
  report are normal — let the user dismiss them.

## Reference files

- `references/scan-detectors.md` — the seven audit detectors (six visual
  +  motion drift), severity rules, example findings + remediation
  patterns
- `references/adoption-report-template.md` — the `adoption-report.md`
  structure and required sections, including the "Whose Default?" section
- `references/mode-propagation.md` — exact context passed to delegated
  skills under mirror / reimagine / diegetic-prototype modes
