# Convention Options

Propose one grounded agreement for confirmation. This reference owns values, defaults,
and recommendations. Declined or deferred choices stay absent or unmanaged; refresh
preserves confirmed settings and presents only meaningful differences.

## Contents

- Core settings
- Optional configurations
- Conditional and standing choices

## Core settings

### Completed-item retention

`completed_items`: `summarize` keeps a temporary outcome stub per completed item to ease
release drafting; `discard` removes completed items after verification and relies on Git
history — both postures support release. Recommend `summarize` when stubs ease drafting,
`discard` when Git history suffices.

### Review weight

`review_weight`: `none`, `light`, `standard`, `thorough`, or `maximum`. Recommend
`standard` unless consequence, uncertainty, or operating evidence warrants another.
[Review](../../work/references/review.md) owns pass budgets, convergence, and scope;
weight controls depth, not design-review eligibility or batch size. Missing means
`standard`; setup does not introduce additional review rounds.

### Simplification posture

`simplification_posture`: `hygiene`, `balanced`, or `structural`. Recommend `balanced` for
most projects. It controls how proactively design, implementation, and review pursue
behavior-preserving reduction; `review_weight` separately controls review depth and
repetition. Every posture retains baseline hygiene and preserves measured performance
constraints while avoiding obvious plausible performance regressions; missing field
resolves to `balanced`.

### Autonomy

`autonomy`: `adaptive`, `collaborative`, or `autonomous`. Recommend `adaptive` unless the
repository has clear operating reasons otherwise. Explicit request language overrides the
default; autonomy never expands scope, quality obligations, permissions, or safety
boundaries; missing field resolves to `adaptive`.

### Documentation conventions

Confirm where foundations live (root `docs/` by default), how they are named,
and which scope owns each kind of truth. Use existing documents where available,
otherwise the smallest useful set; names such as `SPEC.md` or `ARCHITECTURE.md`
are examples, not a required bundle. Follow
[foundation authoring](../../work/references/foundation-authoring.md) for document
shape, engineering coverage and representation. A software bootstrap must settle
or explicitly defer consequential engineering choices, not just product concepts.
Use an existing diagram format when clearer; do not add tooling for compliance.

### Overbuilding calibration

Establish or reconcile the project's `## Overbuilding calibration` per
[canonical-layout.md](canonical-layout.md#overbuilding-calibration). On an adoption with
enough existing project context, explain the evidence, contrast likely overbuilding with
justified complexity, and ask the user to confirm the starting guidance; for a greenfield
bootstrap without coherent project direction, defer that confirmation to the immediate
ideate continuation. An existing section is current project truth; offer a replacement
only when evidence or the request shows it missing or stale, and confirm before writing
it.

### Principles

Include in the agreement whether to establish or extend `docs/PRINCIPLES.md`, presenting
the tiers in [principle-candidates.md](principle-candidates.md): principles derived from
repository evidence; the three core invariants Workbench always recommends — contract
truth ownership, compatibility is earned, leave it simpler; and, when bootstrapping or
when no principles document exists, the optional code-design candidates, each its own
adopt, adapt, or reject decision rather than a checklist. Record only confirmed
principles. On refresh, briefly offer the broader product-shaped reliability candidate
when an existing principle only says to fail fast; never rewrite an existing principle
without confirmation.

## Optional configurations

### Review boundaries and design-review preference

Offer prose preferences under [review boundaries](../../work/references/review-boundaries.md):
adaptive shared implementation reviews and independently optional design review.
Reuse standing alignment; declining creates no mandatory design review or new fields.

### Execution posture

`execution_posture`: `inline-first`, `inline`, `adaptive`, or `orchestrated`.
Recommend the unset `inline-first` default: inline delivery with one external
standard implementation review. Use `inline` for no delegation, `adaptive` for
agent-selected role splits, or `orchestrated` for dedicated roles. See
[execution posture](../../work/references/execution-posture.md) for review placement,
per-request role overrides and plan-only topology requests. Prose can record
mixed-role exceptions; leave an accepted fallback absent rather than stamping it.

Inline-first starts at **0.25.0**. When the loaded release is 0.25.0 or newer and
the prior `workbench_version` is older, missing, or invalid, explain the changed
fallback and offer to keep, replace, or rework adaptive/orchestrated choices.
Their presence alone does not establish intent. Keep them until a change is
confirmed. A prior stamp at or beyond 0.25.0 means this upgrade was considered;
do not repeat the offer absent new direction. Successful setup records its loaded
version as usual; unfinished alignment must not advance that stamp.

### Commit posture

`commit_posture`: `adaptive`, `feature`, `checkpoint`, `batch`, or `preserve`. Inspect
commit size and message patterns, merge policy, branch ownership, concurrent-agent
practice, and explicit Git rules; recommend one when evidence warrants, leaving the
adaptive default unrecorded otherwise. Legacy per-item commits are process
machinery, not a project preference. Explicit user direction overrides the project
posture; [Git posture](../../work/references/git-posture.md) owns preservation
and consolidation rules.

### Evidence depth

`evidence_depth`: `lean`, `standard`, or `deep`. Recommend `standard`; use another
only with consequence, operating, or audience evidence. Missing means `standard`.
[Verification](../../work/references/verification.md) owns its breadth and safeguards;
review passes, simplification reach, and research rigor remain separate settings.

### Project validator

`validator_command`: an optional non-empty argument list, such as
`[python3, scripts/validate-work.py]`. It replaces bundled ledger checks when the
usual validator entry point runs. Missing means bundled checks; `--builtin`
lets wrappers reuse them. See [validation policy](../../work/references/validation.md).
Offer this when an existing project script or deliberate policy difference earns
it; preserve confirmed overrides on refresh. Do not generate a custom validator
by default or adopt one simply to suppress a failure.

### Release gates

Absent or empty `release_gates` means Workbench adds no gates. When the user is
interested, an existing gate list is being converted, or repository evidence identifies a
consequential release expectation that recurring checks do not cover, recommend a
project-shaped set rather than a universal default. Starting shapes: libraries from
compatibility, public-contract tests, and documentation; deployed applications from
security, migrations/data, recovery/operations, and critical journeys; CLIs from
install/upgrade, cross-platform behavior, and error recovery; skill/plugin repositories
from trigger behavior, contract drift, channel parity, and metadata integrity; regulated
or high-consequence systems from their actual privacy, compliance, safety, or audit
obligations. Present only relevant candidates with evidence, expected value, and
practical cost; the user adopts, adapts, adds, or rejects each one. Evidence justifies a
recommendation — never silent adoption — and never limits the user to bundled lenses.

Record confirmed names as a simple unique kebab-case list. Default each custom or narrowed
gate to one concise `### <gate-name>` stance under `## Release gates` in the conventions
body: what matters and what would materially violate release readiness, not a scanner
procedure. When a lens is reused beyond release or needs enough method that conventions
would become a manual, offer a project-local `.agents/skills/scan-<gate-name>/SKILL.md`,
created only after explicit confirmation, never generated automatically; bundled scan
references are suggestions, not a closed registry. On refresh, preserve
confirmed names and prose; never add, drop, or rewrite a gate without confirmation.

### Roadmap recognition

Offer Workbench recognition of `docs/ROADMAP.md`, explaining the optional convention from
[foundation truth](../../work/references/foundation-truth.md#optional-roadmap): a user-owned
planning document whose structure, metadata, and narrative stay flexible; a small, dense
set of `.work/backlog/` links is the recommended standard when it fits, not a requirement;
`.work/` remains the operational record. Never create or adopt it without explicit
approval; record `roadmap: true` only when approved, and leave an existing roadmap
unmanaged rather than migrated or rewritten — project size or an existing roadmap-like
file never implies consent.

### CLAUDE.md projection

Recommend root `CLAUDE.md` as a relative symlink to `AGENTS.md` when Claude Code
is used. Workbench has no session hook: without the projection or an existing
equivalent, that host needs an explicit read of `AGENTS.md`. Offer the projection
even when absent, but preserve opt-in; a correct link is a no-op, and divergent
content needs reconciliation before replacement. When `CLAUDE.md` exists after
setup, maintain the pattern symlink in [project-patterns.md](project-patterns.md).

## Conditional and standing choices

When the repository has or expects durable research, retain confirmed provider ownership
or ask about an unknown owner. For `workbench-research`, include `verification_rigor` in
the agreement: `adaptive`, `floor`, `standard`, or `full`. Recommend `adaptive` unless
consequence, regulatory exposure, recurring semantic drift, or explicit assurance needs
justify a fixed level. Keep existing confirmed rigor on refresh. Rigor controls semantic
verification independently from source count, breadth, and fan-out; preserve an alternate
provider's schema and mechanics.

For a greenfield bootstrap, offer an explicit opt-in to the optional provisional
`docs/spec/` convention using [the provisional-spec
contract](../../work/references/provisional-specs.md): temporary contracts and interfaces
may guide design before code exists, are not foundation truth, and are deleted as their
described scope is delivered. A decline or defer creates no directory or convention;
record an accepted convention in the body of `.work/CONVENTIONS.md` — never a frontmatter
field, registry, or validator. Recommend it only when initial contract design or parallel
bootstrap implementation would benefit, never as an ongoing alternative in an established
repository. On refresh, reconcile an already selected convention and surviving specs
without introducing it anew; surface unclassified `docs/spec/` documents for disposition.

Recommend parking out-of-scope findings and testing meaningful behavior at stable interfaces.
Tests must earn their upkeep by protecting contracts, risks, and regressions, not every line or branch.
Adapt these defaults to observed work, and confirm before making them binding.
