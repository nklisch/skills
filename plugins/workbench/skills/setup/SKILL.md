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
verified package manifest. If it differs from the project stamp, explain the
direction of the difference and recommend updating Workbench first when the
loaded plugin is older. The difference is advisory rather than blocking: because
the user explicitly invoked setup, continue reconciliation with the loaded
plugin unless an actual substrate incompatibility is encountered. A missing or
older project stamp is upgrade input, not another authorization prompt.

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
missing `CONVENTIONS.md` fields, choices an older Workbench version never
surfaced so the repository never settled them, malformed item
hierarchy, inconsistent readiness, unexplained sequencing, missing canonical
markers, and superseded layout. Normalize facts that repository evidence can
recover without invention. For legacy ordering edges without a recoverable
reason, recommend removal and ask once about the ambiguous edge set. Do not
grandfather invalid structure or fabricate item meaning. Present the current
working agreement as settled context and surface only meaningful differences
for decision; do not re-ask choices the repository already settled. Reconcile
drift in place and validate as usual. A repeat run still produces no material
change.

## Align conventions

For adoption or changed conventions, propose one repository-grounded working
agreement for confirmation rather than a sequence of individual questions.
On refresh, retain the current agreement. No changed choice means no new approval.

Compose the agreement from
[convention-options.md](references/convention-options.md): the core settings
every alignment settles — completed-item retention, review weight,
simplification posture, autonomy, documentation conventions including
engineering-foundation coverage and representation for a software bootstrap,
the overbuilding calibration, and `docs/PRINCIPLES.md` — plus every optional
configuration as an explicit opt-in, decline, or defer choice:
`execution_posture`, `commit_posture`, `release_gates`, prose preferences for
review boundaries and optional design review, Workbench recognition of a
user-owned roadmap, and the `CLAUDE.md` compatibility projection — and
the conditional choices whose condition holds. Ground each recommendation in
repository evidence and state its practical cost; when evidence does not
distinguish, use the catalog's defaults. Offer these choices even when the
repository supplies no reason to recommend one; a declined or deferred choice
remains absent or unmanaged.

Present the proposed agreement as one compact decision the user may accept
together or adjust item by item. Keep optional choices visible on adoption,
including proposed decline or defer choices. Nothing binds without confirmation.
On refresh, present only meaningful differences and their consequences. Existing
settings and the option catalog remain available without repeating the full list.
A missing optional field alone is not an unresolved decision. Do not reopen a
settled choice unless the user asks or changed evidence warrants a proposal.

Reserve individual questions for consequential unresolved choices, such as an
unknown research owner or an engineering decision repository evidence cannot
settle. Existing ownership and confirmed settings stay settled. Calibration and
research rigor may join the agreement when their recommendation is understandable
without another conversation. Explain the evidence, practical cost, and meaningful
trade-off for proposed changes. Group related proposals when one decision settles them. For a greenfield bootstrap without coherent project
direction, defer calibration confirmation to the immediate ideate
continuation. In a greenfield repository, leave unproven coding and
structural preferences unset.

Use repository evidence as an open-ended discovery lens for convention
candidates beyond the catalog. It is not a gate on whether optional
Workbench configurations are visible, and it is not limited to the categories
Workbench already defines. Draw candidates from explicit existing rules,
consistent repository practice, conflicts that need one resolution, unique
repository evidence suggesting a beneficial convention, and binding privacy
and security requirements. Route each confirmed rule to its narrowest
authority:

- mechanical formatting and lint rules → tool configuration;
- concise cross-agent coding and operating invariants needed before skill
  routing → `AGENTS.md`; conditional workflow mechanics → their owning
  skills and references;
- settled module ownership, import direction, and structural constraints →
  the applicable architecture foundation;
- engineering decision rules → `docs/PRINCIPLES.md` or the repository's
  confirmed equivalent;
- detailed recurring implementation shapes → the canonical
  `.agents/skills/patterns/` project catalog;
- a Workbench delivery rule with no narrower home → prose in
  `.work/CONVENTIONS.md`; documentation layout and naming → conventions
  project guidance, or `AGENTS.md` when they must bind every agent;
- research provider ownership, evidence, verification rigor, and privacy
  rules → `.research/CONVENTIONS.md`.

The frontmatter schema remains closed; do not invent configuration keys or
force a rule into an unrelated Workbench category. Reconcile a candidate that
overlaps an existing field with that field rather than creating competing
prose. Do not invent coding, structural, or pattern preferences when neither
repository evidence nor an explicit user preference supports them. Do not
write rejected proposals or repeat them during the run. Do not turn a
convention violation into a refactor proposal unless correction has a
concrete payoff such as clearer ownership, less duplication, easier
navigation, or lower coordination cost.

Always create the portable pattern index stub from
[references/project-patterns.md](references/project-patterns.md); an empty
index is a destination for future evidence, not a claim that patterns already
exist. When `CLAUDE.md` exists after setup, maintain the Claude pattern
symlink specified there.

## Convert semantically

Inventory every source artifact and assign exactly one disposition: retain in
place, consolidate, move, or remove. For every source root that may be converted
or removed, apply the recursive leaf census and per-artifact disposition rules
from [migration-rules.md](references/migration-rules.md#cleanup-safety); a
directory-level entry never accounts for nested content. Map active outcomes
into `.work/active/`, deferred ideas into `.work/backlog/`, grounded evidence
into `.research/`, and current or intended project truth into focused foundation
documents.

Apply the authority classification from convention alignment to each legacy
refactor-convention and pattern artifact. Create or reconcile the canonical
portable `SKILL.md` stub and preserve focused pattern references without
duplicating rule bodies in the index.
Offer to preserve reusable project scanning guidance as portable
`.agents/skills/scan-<name>/` lenses when it has a clear evidence contract, and
write them only after explicit user confirmation. Remove generated wrappers,
reports, and workflow-specific orchestration only after useful content and
inbound references are reconciled. Replace Claude
compatibility mirrors with the confirmed relative
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

When `.research/` exists or conversion creates research artifacts, first align
its provider owner with the user. For `owner: workbench-research`, reconcile the
bundled schema and also rebuild and validate `.knowledge/index.json`. For an
alternate owner, preserve its substrate, use only its declared maintenance
tools and conventions, and do not run Workbench Research's linter, builder, or
handoff. An existing ownerless substrate requires an ownership decision rather
than silent adoption. Before rebuilding, inspect the intended
documentation roots and any existing `.knowledge/index-exclusions.txt`.
Repository-local companion checkouts, generated documentation, and other
irrelevant trees may be excluded when indexing them would make discovery
nondeterministic or noisy. Choose from repository evidence rather than directory
names, persist recurring repository-relative path prefixes, and do not use
exclusions to hide errors in documentation the project intends to index.

Reconcile source and target inventories. Confirm the planned removal set matches
leaf-level dispositions before cleanup. Confirm relationships resolve, completed
items are absent from active work, foundation assertions remain true, and
confirmed conventions landed in their authoritative files. Verify each retained
content block at its destination; matching file or item counts alone is
insufficient.

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

After cleanup, reconcile the pre-cleanup leaf census, surviving source paths,
and tracked deletions against the authorized removal set. Stop on any unexpected
removal or survivor.

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
provisional-spec choice, principles decisions, and calibration context into
ideation. For a greenfield repository, wait until project type, audience,
deployment, and consequence are understandable before offering the initial
calibration; then let ideation carry it as one of the decisions for explicit
confirmation. Direct `ideate` to read the
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
