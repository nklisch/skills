---
name: setup
description: Destructively consolidate, initialize, migrate, adopt, or refresh Workbench in any repository, removing superseded workflow files after verified conversion. Use when a user asks to set up Workbench, replace agile-workflow or another planning system, reconcile project conventions, clean up overlapping workflow files, or normalize an existing repository into one canonical .work/ state. Always inventory first, align conventions with the user, validate migrated truth, and leave one clean final state.
---

# Setup Workbench

Transform the repository from any starting state into one clean Workbench state.
Detection changes the mapping, never the final outcome.

## Establish the boundary

Read [references/canonical-layout.md](references/canonical-layout.md) and
[references/migration-rules.md](references/migration-rules.md) completely before
writing.

Inspect Git state, agent instructions, workflow configuration, work ledgers,
plans, research, generated indexes, foundation documents, CI, package scripts,
release practices, and repeated repository behavior. Classify unknown systems
by meaning instead of requiring a named adapter.

Classify any `.research/` substrate by owner. An `owner: workbench`
declaration (or the canonical two-tier layout) is Workbench-owned; a
declaration naming another research system (for example
`owner: agentic-research`) or a foreign tier layout is foreign-owned;
artifacts with no discernible conventions are unknown. Report foreign or
unknown research substrates separately from competing `.work` owners, and
require explicit user approval before any representation change to them —
never silently initialize a second schema alongside a foreign tree or flatten
it.

If another agent is actively editing an overlapping substrate, stop and
coordinate. Preserve unrelated dirty-worktree changes.

Resolve this plugin's scripts from the package associated with the loaded
skill, not from the project. If discovery is necessary, locate the package
containing both Workbench's manifest and this skill, verify its identity, and
stop rather than guessing when multiple candidates remain.

## Sync an existing Workbench repository

When the repository already declares `owner: workbench`, treat setup as an
upgrade and sync pass rather than a fresh adoption. Compare the repository's
conventions, foundations, and substrate against this plugin's current contract:
missing `CONVENTIONS.md` fields, always-asked conventions the repository never
settled because an older Workbench version did not ask them, missing canonical
markers, and superseded layout. Do not re-ask choices the repository has
already settled; ask only newly required or conflicting ones. Reconcile drift
in place and validate as usual — a repeat run still produces no material
change.

## Align conventions

Always conduct a user-confirmed conventions alignment, including for new or
already-conformant repositories.

Derive candidates from:

- explicit existing rules;
- consistent repository practice;
- conflicts that need one resolution;
- repository evidence suggesting a beneficial new convention;
- binding privacy and security requirements.

Ask one consequential decision at a time. For every recommendation, explain the
evidence, risk or friction, proposed rule, practical cost, and why it is the
recommended choice. Do not present a generic checklist. Do not write rejected
proposals or repeat them during the run.

Proactively consider two defaults: park useful findings outside the current
scope instead of silently expanding it, and test behavior at stable interfaces
instead of coupling tests to implementation details. Testing conventions should
focus effort on meaningful behaviors, contracts, boundaries, risks, and
regressions—not every line or branch—and require tests to justify their
maintenance cost. Recommend a repository-specific form when observed work would
benefit, but make no new repository convention binding without the user's
answer.

Always ask how completed items should be retained. Recommend
`completed_items: summarize` when the repository prepares release summaries;
otherwise recommend `discard`. Record only the user's confirmed choice.

Always ask for the repository's default `review_weight`: `none`, `light`,
`standard`, `thorough`, or `maximum`. Recommend `standard` for most projects;
recommend another weight only from concrete consequence, uncertainty,
regulatory, safety, or operating evidence. Explain that the weight governs both
implementation-shaping design review and completed implementation review, while
explicit user direction may override it for one request. Existing Workbench
projects without the field retain the backward-compatible `standard` default.

Always ask for the repository's default `autonomy`: `adaptive`,
`collaborative`, or `autonomous`. Recommend `adaptive` unless the repository has
clear operating reasons for a different default. Explain that explicit request
language overrides the default and that autonomy never expands scope, quality
obligations, permissions, or safety boundaries. Existing Workbench projects
without the field retain the backward-compatible `adaptive` default.

Always ask for the repository's documentation conventions, including in a
greenfield repository with no documents yet. Cover where durable foundation
documents live (root `docs/` by default), how they are named — one consolidated
`SPEC.md`, several focused documents such as `ARCHITECTURE.md` or
`JOURNEYS.md`, or a scoped directory like `docs/spec/` — and where contract
truth lives. Derive the recommendation from existing documents when present;
otherwise recommend the smallest set that fits the project's shape. Present
names as examples that should fit the project, never as a fixed required list.

Always ask whether to establish or extend `docs/PRINCIPLES.md`. Read
[references/principle-candidates.md](references/principle-candidates.md) and
present three tiers: principles derived from repository evidence; the two core
invariants Workbench always recommends — contract truth ownership and
compatibility is earned; and, when bootstrapping a project or when no
principles document exists, the optional code-design candidates, each offered
as its own adopt, adapt, or reject decision rather than as a checklist. Record
only confirmed principles.

Write confirmed rules to the narrowest authority:

- repository-wide agent invariants → `AGENTS.md`;
- Workbench commands and lifecycle → `.work/CONVENTIONS.md`;
- documentation layout and naming conventions → `.work/CONVENTIONS.md`
  project guidance, or `AGENTS.md` when they must bind every agent;
- engineering or product principles → `docs/PRINCIPLES.md`;
- research evidence and privacy rules → `.research/CONVENTIONS.md`.

## Convert semantically

Inventory every source artifact and assign exactly one disposition: retain in
place, consolidate, move, or remove. Map active outcomes into `.work/active/`,
deferred ideas into `.work/backlog/`, grounded evidence into `.research/`, and
current or intended project truth into focused foundation documents.

Fold durable discoveries out of session and resume files, then remove those
files. Consolidate duplicate foundations instead of retaining competing
versions. Never preserve historical workflow narration merely to document the
migration.

Find inbound links, scripts, CI paths, instructions, and configuration that
refer to each source slated for removal. Rewrite or remove those references
before deleting the source. Report any competing workflow plugin installed
outside the repository with its exact identifiable scope; do not claim a clean
single-system state while that competing installation still injects behavior.

## Validate before cleanup

Run the plugin validator:

```bash
python3 <workbench-plugin-root>/scripts/validate-workbench.py <project-root>
```

When `.research/` exists or conversion creates research artifacts, also rebuild
and validate `.knowledge/index.json`.

Reconcile source and target inventories. Confirm relationships resolve,
completed items are absent from active work, foundation assertions remain true,
and confirmed conventions landed in their authoritative files. Verify each
retained content block at its destination; matching file or item counts alone
is insufficient.

Confirm every canonical `.work/` and `.research/` state directory contains
`.gitkeep` so an empty state survives a fresh clone. When
`.knowledge/index.json` exists or is being created, confirm it is tracked rather
than excluded by ignore rules, then rebuild it and run the builder with
`--check`.

## Remove superseded artifacts

After target validation, remove migrated source files, superseded workflow
directories, hooks, binaries, configuration, managed instruction sections,
duplicate foundations, obsolete generated indexes, and empty source
directories.

Do not create migration archives, compatibility copies, `.bak` files, or legacy
folders. Classify every removal target as tracked and clean, tracked and
modified, untracked, or ignored. A clean tracked file is recoverable from Git.
Before removing modified, untracked, ignored, or otherwise unrecoverable
content, require either a user-created pre-state commit or the user's explicit
confirmation of the exact removal list. Never delete an ambiguous user-authored
file until its content is classified and either migrated or proven redundant.

Remove project-scoped competing workflow plugins, hooks, and managed rules once
their content is converted and validated. For user- or machine-scoped plugin
installs, report the exact installation that the user must uninstall; do not
silently mutate external scope.

Re-run validation after cleanup. A second setup run must produce no material
change.

## Reply to the user

Reply in the current conversation with:

- conventions adopted, rejected, and reconciled;
- artifacts consolidated, moved, and removed;
- validation and project-check results;
- unresolved ambiguity or external setup;
- final idempotency result.
