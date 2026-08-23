---
name: setup
description: >
  Destructively consolidate, initialize, migrate, adopt, or refresh Workbench in any repository,
  removing superseded workflow files after verified conversion. Use only when the user explicitly
  invokes setup or states that they want to initialize, adopt, migrate, upgrade, refresh, or
  reconcile Workbench. Never infer authorization from repository state, detected drift, another
  skill, or a setup recommendation. Always inventory first, align conventions with the user,
  validate migrated truth, and leave one clean final state.
---

# Setup Workbench

Transform the repository from any starting state into one clean Workbench state.
Detection changes the mapping, never the final outcome.

Proceed only when the user explicitly invokes setup or states in the active
request that they want to initialize, adopt, migrate, upgrade, refresh, or
reconcile Workbench. This requirement applies whether or not the repository
already declares `owner: workbench`. Repository ownership, detected drift,
missing fields, an available newer version, a generic implementation request,
the plugin's presence, or another skill's recommendation is not authorization.
Another skill may offer setup, but wait until the user accepts that offer before
invoking it. Do not carry an unaccepted offer forward as implied consent.

## Establish the boundary

Read [references/canonical-layout.md](references/canonical-layout.md),
[references/project-patterns.md](references/project-patterns.md),
[references/managed-instructions.md](references/managed-instructions.md),
[references/migration-rules.md](references/migration-rules.md), and
[references/version-compatibility.md](references/version-compatibility.md)
completely before writing. Resolve the loaded plugin version through the
verified package manifest. If it is older than a valid stamped project version,
stop and ask the user to update Workbench before this setup can safely continue.
A missing or older project stamp is upgrade input, not another authorization
prompt, because the user already invoked setup.

Inspect Git state, agent instructions, workflow configuration, work ledgers,
plans, research, generated indexes, foundation documents, CI, package scripts,
release practices, formatter and linter configuration, project pattern catalogs,
and repeated coding and structural behavior. Find legacy refactor-convention,
pattern, and harness-specific rule catalogs. Classify unknown systems by meaning
instead of requiring a named adapter.

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
settled because an older Workbench version did not ask them, malformed item
hierarchy, inconsistent readiness, unexplained sequencing, missing canonical
markers, and superseded layout. Normalize facts that repository evidence can
recover without invention. For legacy ordering edges without a recoverable
reason, recommend removal and ask once about the ambiguous edge set. Do not
grandfather invalid structure or fabricate item meaning. Do not re-ask choices
the repository already settled. Reconcile drift in place and validate as usual.
A repeat run still produces no material change.

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
recommended choice. Do not present a generic checklist. Do not ask about coding,
structural, or pattern preferences without concrete repository evidence or an
explicit existing user preference. Group related proposals when one decision
settles them. Inspection is mandatory; questions are conditional. Do not write
rejected proposals or repeat them during the run.

Classify confirmed engineering guidance before proposing its destination:

- mechanical formatting and lint rules belong in tool configuration;
- concise coding and agent operating rules belong in `AGENTS.md`;
- settled module ownership, import direction, and structural constraints belong
  in the applicable architecture foundation;
- engineering decision rules belong in `docs/PRINCIPLES.md` or the repository's
  confirmed equivalent;
- detailed recurring implementation shapes belong in the canonical
  `.agents/skills/patterns/` project catalog.

Do not turn a convention violation into a refactor proposal unless correction
has a concrete payoff such as clearer ownership, less duplication, easier
navigation, or lower coordination cost. In a greenfield repository, leave
unproven coding and structural preferences unset. Always create the portable
pattern index stub from
[references/project-patterns.md](references/project-patterns.md); an empty index
is a destination for future evidence, not a claim that patterns already exist.

Proactively offer root `CLAUDE.md` as a relative symlink with target `AGENTS.md`,
including when it is absent. Treat a correct link as a no-op and reconcile
divergent content before replacement. When `CLAUDE.md` exists after setup,
maintain the Claude pattern symlink specified by
[references/project-patterns.md](references/project-patterns.md).

Proactively consider two defaults: park useful findings outside the current
scope instead of silently expanding it, and test behavior at stable interfaces
instead of coupling tests to implementation details. Testing conventions should
focus effort on meaningful behaviors, contracts, boundaries, risks, and
regressions—not every line or branch—and require tests to justify their
maintenance cost. Recommend a repository-specific form when observed work would
benefit, but make no new repository convention binding without the user's
answer.

Always ask how completed items should be retained before release. Recommend `summarize`
when temporary stubs ease drafting; recommend `discard` when Git history is sufficient.
Both postures support release. Record only the user's confirmed choice.

Always ask for the repository's default `review_weight`: `none`, `light`,
`standard`, `thorough`, or `maximum`. Recommend `standard` for most projects;
recommend another weight only from concrete consequence, uncertainty,
regulatory, safety, or operating evidence. Explain that the weight governs both
implementation-shaping design review and completed implementation review, while
explicit user direction may override it for one request. Existing Workbench
projects without the field retain the backward-compatible `standard` default.

Always ask for the repository's default `simplification_posture`: `hygiene`,
`balanced`, or `structural`. Recommend `balanced` for most projects. Explain
that it controls how proactively design, implementation, and review pursue
behavior-preserving reduction, while `review_weight` separately controls review
depth and repetition. Every posture retains baseline hygiene and preserves
measured performance constraints while avoiding obvious plausible performance
regressions. Existing Workbench projects without the field retain the
backward-compatible `balanced` default.

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
truth lives. State the foundation-altitude baseline from
[references/canonical-layout.md](references/canonical-layout.md#foundation-document-contract):
foundations are high-level repository or sub-project guidance and Workbench
items are the work record. Derive the recommendation from existing documents
when present; otherwise recommend the smallest set that fits the project's
shape. Present names as examples that should fit the project, never as a fixed
required list.

When repository evidence suggests a larger project would benefit from
longer-horizon organization, setup may offer `docs/ROADMAP.md`; never add or
adopt it without explicit user approval. Explain the optional roadmap convention
from the canonical-layout reference before asking: it is a small,
information-dense ordering of agreed goals, every entry maps to one
`.work/backlog/` item for details, and it never tracks active work. Record
`roadmap: true` only when approved. Project size or an existing roadmap-like file
does not itself imply consent. Without approval, record no roadmap convention
and classify discovered content under ordinary migration rules.

Always ask whether to establish or extend `docs/PRINCIPLES.md`. Read
[references/principle-candidates.md](references/principle-candidates.md) and
present three tiers: principles derived from repository evidence; the three core
invariants Workbench always recommends — contract truth ownership,
compatibility is earned, and leave it simpler; and, when bootstrapping a
project or when no principles document exists, the optional code-design
candidates, each offered as its own adopt, adapt, or reject decision rather than
as a checklist. Record
only confirmed principles.

Write confirmed rules to the narrowest authority:

- repository-wide agent invariants → `AGENTS.md`;
- Workbench commands and lifecycle → `.work/CONVENTIONS.md`;
- documentation layout and naming conventions → `.work/CONVENTIONS.md`
  project guidance, or `AGENTS.md` when they must bind every agent;
- engineering or product principles → `docs/PRINCIPLES.md`;
- recurring implementation patterns → `.agents/skills/patterns/`;
- research evidence and privacy rules → `.research/CONVENTIONS.md`.

## Convert semantically

Inventory every source artifact and assign exactly one disposition: retain in
place, consolidate, move, or remove. Map active outcomes into `.work/active/`,
deferred ideas into `.work/backlog/`, grounded evidence into `.research/`, and
current or intended project truth into focused foundation documents.

Apply the authority classification from convention alignment to each legacy
refactor-convention and pattern artifact. Create or reconcile the canonical
portable `SKILL.md` stub and preserve focused pattern references without
duplicating rule bodies in the index.
Remove generated wrappers, digests, and
workflow-specific scans after useful content and inbound references are
reconciled. Replace Claude compatibility mirrors with the confirmed relative
symlinks only after conflict-safe consolidation. Setup validates the catalog's
structure and semantic disposition; it does not audit every retained pattern
against the code.

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

After the target substrate is semantically complete, stage the loaded plugin
version as `workbench_version` in conventions immediately before validation.
Remember the prior stamp; if validation or cleanup fails, restore that prior
stamp (or remove the staged field when it was absent) before stopping so an
unfinished reconciliation cannot claim compatibility.

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
`.gitkeep` so an empty state survives a fresh clone. Validate the canonical
pattern `SKILL.md` and its referenced files even when the index remains empty.
When
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

Re-run validation after cleanup. Keep the new version stamp only after all
reconciliation and cleanup checks pass. A second setup run must produce no
material change.

## Continue a greenfield bootstrap through ideation

Treat the repository as greenfield when setup has initialized its working
agreement but repository evidence does not yet establish a coherent product or
project direction in code or foundation documents. After setup validates that
bootstrap, route directly into [`ideate`](../ideate/SKILL.md) in the same
engagement rather than ending with an invitation to invoke another skill.

Pass the confirmed documentation location, naming, contract-truth ownership,
and principles decisions into ideation. Direct `ideate` to read the
[foundation document contract](references/canonical-layout.md#foundation-document-contract)
and [principle candidates](references/principle-candidates.md) from setup; these
are the shared format and decision sources, not prose to duplicate in the
ideation skill. Ideation then clarifies the project and offers the smallest
useful foundation-document handoff under its no-write rule. It writes those
foundations only after the user explicitly selects that handoff.

Do not take this route for an existing project whose code or foundations already
establish its direction, or for an upgrade of an adopted Workbench repository.

## Reply to the user

For a non-greenfield setup or an upgrade, reply in the current conversation
with:

- conventions adopted, rejected, and reconciled;
- artifacts consolidated, moved, and removed;
- validation and project-check results;
- unresolved ambiguity or external setup;
- final idempotency result.

For a greenfield bootstrap, give that setup summary as the opening context for
the immediate `ideate` continuation rather than treating setup as the end of the
request.
