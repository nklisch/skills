# Managed Workbench Instructions

Maintain one marked Workbench section in the canonical root `AGENTS.md`:

```markdown
<!-- workbench:start -->
## Workbench

This repository is Workbench-owned (`.work/CONVENTIONS.md`). Before stateful
Workbench work, compare its `workbench_version` with the loaded plugin. On a
mismatch, recommend the appropriate update and setup reconciliation, but
continue unless an actual schema or capability incompatibility is encountered.
Route concrete Workbench workflows through its skills, use
`deliver` for one named implementation-ready feature or story, and prefer
ideate before design when early exploration of substantial or cross-cutting work
could materially improve what gets designed, unless the user requests direct
design or execution. Unrelated requests stay outside Workbench. Track active
outcomes in `.work/active/` and deferred context in `.work/backlog/`. Consult
`.knowledge/index.json` when present. Use features as the normal delivery unit;
reserve epics for multiple feature outcomes and stories for narrow slices.
Preserve `epic → feature → story` when items nest. Ask the human about
consequential requirements according to the effective autonomy posture. Designs
and reviews must not invent requirements or expand the user's original scope;
apply foundation truth and the rational needs of the actual project type, flag
overbuilding, and park useful adjacent findings instead. During implementation,
follow confirmed coding and structural rules from their owning sources and read
relevant `.agents/skills/patterns/` references when the canonical index contains
them.

Durable state is limited to work items, foundation documents, project pattern
catalogs, user-confirmed project scan-lens skills, research attestations and
briefs, mockups, generated indexes,
completion stubs, release summaries, and repository conventions; write these
whenever a workflow names them. Work items are the work record. Keep foundations
at repository or sub-project altitude: high-level purpose, boundaries,
principles, architecture, observable behavior, and guarantees—not item ids or
status, delivery-unit numbering, implementation plans, qualification mechanics,
receipt paths, or evidence history. `docs/ROADMAP.md` is the sole optional
exception: setup may offer it when useful, but create or adopt it only after
explicit user approval and record `roadmap: true`. Keep it small and dense;
every entry links one `.work/backlog/` item for details, and it never tracks
active work. Do not infer approval from project size or repository files.
Everything else—questions,
proposals, recommendations, explanations, progress summaries, and completion
reports—belongs in your reply, not in a new file or a no-op record.

Keep human-facing documents and designs clean and self-contained. Do not expose
agent work history, review-correction notes, or revision narration. Agent-facing
documents may retain process prose only when it adds material value.

Frame human-facing documents from real-world and business meaning before
technical representation. Define load-bearing data, domain, and interface
concepts before using them. When provider terms matter, map the provider term to
the project concept and a generic real-world term at the object level before
field details. Do not define ordinary terms the intended audience can safely
know.

Keep independent items parallel by default. Add `blocked_by` only when serial
work reduces rework, ambiguity, or integration risk; explain non-obvious order
in ordinary item prose only when useful. During a user-authorized large work
boundary, retain concrete
pattern candidates in the active parent and create a pattern/refactor/cleanup
feature only at an explicit evidence-led maintenance boundary, never on a fixed
cadence.

For concrete Workbench workflows, test behavior at stable interfaces, verify
the full requested boundary, reconcile affected foundation truth and project
patterns, rebuild the knowledge index when indexed documentation changes, apply
the configured review weight and simplification posture to substantive Workbench
design and implementation, use exactly one independent pass per eligible design
and completed integrated implementation boundary at `standard` (then correct,
verify, and self-review without re-reviewing that target), reserve multi-pass convergence for
`thorough` and `maximum` until only nits remain, capped at the work-kickoff or
convention-specified `review_maximum_passes` (default three), follow the effective commit posture without making
ledger transitions into required commits or rewriting shared history for an
advisory squash, and remove or summarize completed items immediately.
A successful release removes every completed outcome file under either
completion posture and preserves the canonical `.gitkeep` files. Preserve
behavior and measured performance constraints during simplification,
avoid obvious plausible performance regressions, and do not turn ordinary work
into speculative optimization. Do not apply the review weight to every review,
audit, planning discussion, explanation, or loose request in the repository.
<!-- workbench:end -->
```

Add confirmed repository-specific invariants outside or within this section as
appropriate. Do not duplicate them across agent-specific files.
