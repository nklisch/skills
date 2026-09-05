# Convention Options

Decision catalog setup composes into one repository-grounded recommended working agreement.
The skill owns the presentation flow: one compact decision accepted together or adjusted
item by item, individual questions reserved for consequential unresolved choices. This
reference owns what each choice controls, its values, defaults, and recommendation
guidance. Nothing binds until the user confirms it; a declined or deferred optional choice
stays absent or unmanaged, and evidence never silently adopts a choice. Refresh keeps
confirmed settings and presents meaningful differences, not the full option list again.

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
`standard` for most projects; another weight only from concrete consequence, uncertainty,
regulatory, safety, or operating evidence. `standard` gives each implementation-shaping
design and each completed integrated implementation boundary exactly one distinct pass;
execution posture determines whether it is inline or fresh-context. Corrections are
verified and self-reviewed, not sent through another distinct pass. `thorough` converges
when no unresolved blocking finding remains; `maximum` when no unresolved material finding
remains. A project may state a review-count preference in prose, but Workbench does not
enforce it; explicit user direction may bound, extend, or stop one review — report
remaining findings for disposition. The weight governs design and implementation review;
existing substrates without the field keep the backward-compatible `standard` default.

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

Include in the agreement — greenfield repositories with no documents yet included — where
durable foundations live (root `docs/` by default), how they are named — one consolidated
`SPEC.md`, focused documents such as `ARCHITECTURE.md` or `JOURNEYS.md`, or a scoped
directory like `docs/spec/` — and where contract truth lives, stating the
foundation-altitude baseline from
[the foundation document contract](canonical-layout.md#foundation-document-contract).
Derive the recommendation from existing documents; otherwise the smallest set that fits
the project's shape. Names are examples that should fit the project, never a fixed
required list.

For every software-project bootstrap, include engineering-foundation coverage per [the
coverage contract](canonical-layout.md#engineering-foundation-coverage): resolve what
repository evidence already settles, ask about consequential human-owned choices, and
leave genuinely undecided choices explicit rather than guessing. Combine with
`ARCHITECTURE.md` for a small cohesive project, or use a focused name such as
`ENGINEERING.md` for a distinct audience or depth — require coverage, not a filename or
universal section list.

Also include the representation convention: prefer a repository tree, ownership table,
dependency graph, deployment topology, or pipeline diagram when clearer than paragraphs.
Markdown with Mermaid is the portable default; PlantUML, Structurizr, or Draw.io is valid
when the project maintains it. Non-Markdown diagram sources need a discoverable Markdown
foundation explaining their meaning and linking the authority — never a new toolchain
merely for compliance.

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

### Execution posture

`execution_posture`: `inline`, `adaptive`, or `orchestrated` — see
[execution-posture.md](../../work/references/execution-posture.md). Controls agent
topology rather than autonomy or review rigor; explicit user direction overrides it, and
formal design and configured review depth still apply under `inline`. Adaptive weighs
each role's value against handoff cost — quick implementation and focused review often
benefit from the current context — with no inline mandate. Recommend `adaptive` for most
projects, `inline` when the project values one continuous main-agent context,
`orchestrated` when dedicated role agents routinely earn their handoff cost. Declined or
deferred stays absent and resolves to `adaptive`; concise prose may record a preferred
mixed role assignment without another enum value.

### Commit posture

`commit_posture`: `adaptive`, `feature`, `checkpoint`, `batch`, or `preserve`. Inspect
commit size and message patterns, merge policy, branch ownership, concurrent-agent
practice, and explicit Git rules; recommend one when evidence warrants, leaving the
adaptive default unrecorded otherwise. Legacy per-item commits are process
machinery, not a project preference. Explicit user direction overrides the project
posture, ledger transitions never require their own commits, and squashing is advisory
and safe only for clearly owned history.

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
[canonical-layout.md](canonical-layout.md#optional-roadmap-convention): a user-owned
planning document whose structure, metadata, and narrative stay flexible; a small, dense
set of `.work/backlog/` links is the recommended standard when it fits, not a requirement;
`.work/` remains the operational record. Never create or adopt it without explicit
approval; record `roadmap: true` only when approved, and leave an existing roadmap
unmanaged rather than migrated or rewritten — project size or an existing roadmap-like
file never implies consent.

### CLAUDE.md projection

Proactively offer root `CLAUDE.md` as a relative symlink with target `AGENTS.md`,
including when it is absent; treat a correct link as a no-op and reconcile divergent
content before replacement. When `CLAUDE.md` exists after setup, maintain the Claude
pattern symlink specified in [project-patterns.md](project-patterns.md).

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

Consider two standing defaults while composing the recommendation: park useful findings
outside the current scope instead of silently expanding it, and test behavior at stable
interfaces instead of implementation details. Testing conventions should focus effort on
meaningful behaviors, contracts, boundaries, risks, and regressions — not every line or
branch — and justify their maintenance cost; recommend a repository-specific form when
observed work would benefit, but make no new convention binding without the user's answer.
