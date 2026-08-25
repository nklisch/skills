---
id: feature-ux-ui-concierge
kind: feature
status: active
tags: [skill, plugin, refactor]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-24
updated: 2026-08-24
---
# ux-ui-design plugin: concierge restructure

## Brief
Rebuild the ux-ui-design plugin from seven artifact-typed, pipeline-prescriptive
skills (`palette`, `components`, `motion`, `screens`, `flows`, `adopt`,
`ux-ui-principles`) into one adaptive concierge skill backed by the existing
reference library. The concierge interviews the user — what they want out of
the UI, what it is for, how it will be used — and adapts its artifact shape to
the project, product, and user instead of mandating a fixed pipeline.

## Settled direction (from ideation 2026-08-24)
- **Structure:** one concierge skill + on-demand references. All current
  generator knowledge (37 aesthetic poles, UX laws, token vocabulary, CSS
  templates, chrome patterns, cross-discipline transfers, flow topology,
  adoption scanning) survives as reference files the skill loads when needed.
- **Interview-first:** collects goals, purpose, audience, usage, and the
  user's own instincts before generating anything. Goes deep like `ideate`.
- **No fixed modes or breakdowns:** asks the user how they want to slice the
  work — one comprehensive interactive mockup, piece-by-piece, additive,
  journeys, or something else — and adapts.
- **Screenshot offer:** can offer to capture or ingest screenshots of an
  existing UI (any product, not just HTML) to target or extract a visual
  system.
- **Standardization by showcasing:** offers tokens, typography, and component
  systems as showcased options, never as mandatory pipeline stages.
- **Style range:** offers to research new styles and jam directions together;
  generated options must have real range shaped to the product, not four
  near-identical flavors.
- **Old machinery:** the REQUIRED/OPTIONAL/SKIP decision matrix survives as
  advisory reference prose; tier-ordering rules, the AGENTS.md auto-installer,
  and pipeline-order enforcement are dropped.
- **Optional foundation extraction:** when the project has foundation docs,
  offer to record settled design choices as foundation-shaped statements.
- Skill name must not collide with workbench's `design` skill (leaning
  `ux-ui`).
- Plugin restructure → major version bump per repo convention.

## Acceptance criteria
- `plugins/ux-ui-design/skills/` contains one concierge skill directory with
  portable frontmatter (repo skill-style contract) and a references library;
  the seven old skill directories are gone.
- The skill's workflow is interview-driven and adaptive: no mandated pipeline,
  no fixed modes, no fixed option counts, no auto-installer.
- Mockups remain throwaway single-file HTML in `.mockups/` when mocks are the
  chosen medium; the tech rule and storage convention survive as convention,
  not mandate.
- README and plugin docs updated to describe the concierge shape; stale
  references to the old seven-skill pipeline removed.
- Workbench validator passes; plugin version bumped major.

## Design

**Primary lens:** refactor/cleanup (skill-content restructure). Simplification
posture: balanced. Designed by fresh-context GLM 5.3 agent, 2026-08-24.

### Chosen approach

- **One skill, `ux-ui`** at `plugins/ux-ui-design/skills/ux-ui/`
  (`/ux-ui-design:ux-ui`, `$ux-ui`). Plugin keeps its name — renaming would
  break installs and catalogs for no benefit. New `agents/openai.yaml` with
  `allow_implicit_invocation: true` (plugin has none today).
- **Description carries the union of the seven old trigger sets** (screens,
  flows, palette/tokens, components, motion, audit/adopt, screenshots, style
  exploration) so implicit routing doesn't regress — the top risk.
- **SKILL.md (~280-300 lines), workbench ideate/scan tone.** Adaptivity is
  expressed as a situation → move routing table + fixed question shapes, never
  as "be adaptive" mush. Sections: what this is; ground before asking ("ask
  only for what the repository cannot answer"); interview (purpose/goals,
  audience/usage, aesthetic instincts with the poles pitch, existing-UI
  references — 2-4 batched questions, stop when the next answer wouldn't
  change what gets made); shape the work (breakdown question with
  recommendation: comprehensive mockup / piece-by-piece / additive / journeys
  / standardize-first / research-first); make (ranged options, every option
  articulably different in one sentence, no fixed count; 3-round soft cap);
  existing UI (audit + mirror/reimagine/diegetic stances, "whose default?"
  mirror-mock); optional branches (screenshot ingest, standardization
  showcase — "offered, never staged", style research/mashups); settle (record
  + gated foundation-extraction offer only when foundation docs exist, in the
  doc's own voice/altitude, never a new doc); reference map.
- **23 references, flat** under `skills/ux-ui/references/`: 20 survive (2
  renamed for filename collisions: components-showcase-template.md,
  motion-showcase-template.md), 3 new (conventions.md ~140 lines merging
  ux-ui-principles minus dropped machinery; style-research.md ~100;
  screenshot-ingest.md ~120), 2 dropped (agent-instructions-installer.md,
  mode-propagation.md — stance definitions rescued into scan-detectors.md).
  Motion SKILL.md hard rules fold into motion-tokens.md; curated pole pitch
  becomes a preamble in aesthetic-poles.md; ToCs added to >100-line files;
  mechanical citation fixes (dead skill names → "the ux-ui skill").
- **Old machinery dropped everywhere:** tier-ordering, AGENTS.md installer,
  pipeline enforcement, invocation-mode flags. Decision matrix survives only
  as advisory prose in conventions.md.
- **Plugin-level:** README rewrite (+ migration note, fix stale npm install
  line to bridge-only), delete docs/evaluations/* and docs/proposals/
  enhancement synthesis, keep docs/proposals/research/* (cited as provenance
  by surviving references), update descriptions in all three manifests + both
  marketplace catalogs, rewrite root docs/ux-ui-design-guide.md, repoint
  agile-workflow {scope,epic-design,feature-design,ideate} invocations to the
  concierge (compatibility fix, permitted in maintenance mode), bump
  ux-ui-design major (0.5.0 → 1.0.0) and agile-workflow patch.

### Alternatives

Rejected: seven skills + concierge on top (item settles one skill);
`concierge`/`studio`/`design-ui` names (no trigger value / collision);
per-branch reference subdirs; separate interview.md question-bank reference
(questions are core concrete moves, belong in SKILL.md); keeping
mode-propagation.md (delegation plumbing between dead skills); splitting
aesthetic-poles.md/shared-chrome-css.md to meet the 200-line cap (catalogs,
ToC suffices — known pre-existing deviation); breakdown CLI flags
(conversation replaces flags).

### Implementation units

1. Reference library migration (git mv, renames, drops, citation fixes, ToCs,
   folds) — verify by dead-name grep before deleting old skill dirs.
2. Concierge SKILL.md + conventions.md + agents/openai.yaml; delete the seven
   old skill directories.
3. New references style-research.md + screenshot-ingest.md.
4. Plugin-level + cross-plugin reconciliation (README, docs, manifests,
   catalogs, root guide, agile-workflow repointing).
5. Validation, commit feature changes, then bump-version.sh ux-ui-design
   major + agile-workflow patch.

### Verification

quick_validate.py on the skill dir; style-contract greps (no harness-specific
terms); repo-wide dead-name greps (ux-ui-principles, /ux-ui-design:palette et
al., installer/mode-propagation names) zero outside git history/CHANGELOG/
.work; dropped-machinery grep (ux-ui-design:installed marker, tier ordering)
absent; line budgets (SKILL.md <300/<500, new refs <200); jq on both
catalogs; validate-workbench.py; rebuild .knowledge/index.json; trigger-
coverage review of the new description against the seven old ones.

### Risks and recovery

1. Trigger regression (one description replacing seven) — mitigated by the
   enumerated trigger union + verification; recovery is a one-file edit.
2. Adaptive vagueness — mitigated by routing table, fixed question shapes,
   named-reference pointers; reviewer checks "concrete move per situation".
3. Missed dead-name citations (agile-workflow, root guide) — unit 4 owns the
   list; unit 5 greps repo-wide.
4. Renamed showcase templates breaking links — old names in the grep set.
5. Bump script refusing dirty plugin dir — commit before bump.
6. Users lose old determinism — intentional, major-version-signaled, README
   migration note; `.mockups/` layout and tech rule unchanged.
7. SKILL.md line overrun — budgeted sections; detail moves to references.

## Design revision (2026-08-24, post-review + user redirection)

Independent review (Sol, standard weight) returned 4 material findings; the
user redirected twice mid-implementation. Reconciliation:

- **Reference library shrinks 20 → 9 files (~4,700 → ~1,400 lines).** Review
  finding: 13 files over the 200-line cap. User: "too much going on in the
  references." Consolidation: conventions.md, visual-languages.md (condensed
  family map from aesthetic-poles + cultural guardrail), design-tokens.md
  (color/type/spacing/component/motion vocabularies + squint check),
  mock-css.md (tokens/components/motion CSS + chrome, condensed),
  showcase-pages.md (preview/showcase/comparison-index patterns),
  journeys.md (topologies + chrome), existing-ui.md (stances + detectors +
  report + whose-default + refusals), capture.md, design-judgment.md
  (condensed UX laws + select cross-discipline transfers).
  style-research.md folds into the SKILL.md research branch;
  screenshot-ingest.md becomes capture.md; open-cross-platform.md folds into
  conventions.md.
- **No pitch rules, no named styles (user).** The visual-language catalog is
  agent-internal blending vocabulary. The interview explains what visual
  languages are and how they work in plain novice-friendly prose; the agent
  blends directions from the user's answers and explains its approach in
  simple language. Users are assumed design-novices; style names are never
  surfaced as a menu.
- **Screenshots are of the agent's own mockups (user).** Mocks are whatever
  medium the agent can produce; after producing, the agent captures
  screenshots of its mockups for self-review and as the durable visual
  record. Ingesting screenshots of existing UIs (any product) to extract a
  visual system is a secondary branch.
- **Agile-workflow callers get semantic rewrites, not repointing** (review):
  offer the concierge, let it negotiate artifact shape, record mock paths
  only when mocks are chosen.
- **Verification gains** (review): Codex prompt-inventory check, knowledge
  index build + `--check`, stale tier/pipeline-language grep.
- **Three-round cap is a diagnostic, never a hard stop** (review).

Behavior disposition for old SKILL.md-only content: keep (squint check,
refusals paragraph, refinement/approval guarantees on locked artifacts,
contrast checks, whose-default mirror-mock, re-sync); drop deliberately
(Lottie/AHAP artifact rule — conflicts with the throwaway single-file mock
convention; shipped motion artifacts are implementation-scope);
generalize (pitch question → plain-language visual conversation; fixed
option counts → ranged options).
