# Migration Rules

## Contents

- Semantic mapping
- Known source hints
- Convention reconciliation
- Cleanup safety
- Idempotency


## Semantic mapping

| Source meaning | Destination |
|---|---|
| Active epic, initiative, feature, task, change, proposal | `.work/active/` |
| Deferred idea | `.work/backlog/` |
| Outcome-specific plan or design | Corresponding work-item body |
| Current or intended project direction | Focused `docs/` foundation |
| Mechanical formatting or lint rule | Formatter or linter configuration |
| Concise coding or agent operating rule | Canonical `AGENTS.md` |
| Settled structural or engineering decision | Architecture or principle foundation |
| Proven recurring implementation shape | `.agents/skills/patterns/` |
| Fetched evidence or grounded synthesis | `.research/` |
| Completed outcome worth retaining | Completion stub or release summary |
| Session or resume state | Fold durable discoveries into work, then remove |
| Generated navigation or cache | Rebuild knowledge index, then remove |
| Workflow hooks, binaries, managed rules | Remove after target validation |
| Duplicate or historical foundations | Consolidate current truth, then remove |

## Known source hints

Treat these only as discovery hints; inspect actual content before mapping:

- agile-workflow: `.work/active/{epics,features,stories}`, stage frontmatter,
  `work-view`, managed rules, hooks, gates, release directories,
  `.agents/skills/{refactor-conventions,patterns}/`, compatibility mirrors under
  `.claude/skills/{refactor-conventions,patterns}/`, generated
  `.agents/rules/patterns.md`, mixed-content `.claude/rules/patterns.md`, and
  user-facing pattern extraction or refactor-convention skills and commands;
- GSD: `.planning/`, phase plans, state and progress files;
- OpenSpec: `openspec/changes`, proposals, specs, and archived changes;
- generic agent plans: `.claude/plans`, `.codex`, task files, TODO ledgers,
  roadmaps, resume state, and session summaries.

An agile-workflow `gates_for_release` list is evidence that the project values a
release boundary, not a schema to copy mechanically. For each existing gate,
separate work already owned during delivery from the release expectation that
still matters across the completed bundle. Map that expectation to a concise
`release_gates` lens name and, when the name is not self-explanatory through a
bundled or project scan lens, a matching `### <gate-name>` section under
`## Release gates` in conventions. Preserve real project-specific blocking
expectations; drop stage machinery, binding metadata, scanner topology, and
finding-routing policy that Workbench does not use. Present the proposed names
and definitions for confirmation before writing anything.

Flatten source stage or folder taxonomies into meaning. Do not preserve stage
narration.

A discovered roadmap has no automatic special status. If the user explicitly
approves Workbench recognition, preserve `docs/ROADMAP.md` in its user-chosen
form; do not normalize its structure, remove metadata or discourse, or convert
its entries automatically. Offer to create `.work/backlog/` items only for
concrete outcomes the user wants Workbench to track. Otherwise leave the roadmap
unmanaged and map only the useful material the user chooses through the table
above.

Normalize each active item to Workbench's optional-depth hierarchy:

- use a feature as the default delivery and integrated review unit;
- keep an epic only when at least two independently meaningful feature outcomes
  can be named;
- use a story for a narrow independently verifiable slice;
- keep epics top-level, features top-level or under epics, and stories top-level
  or under features.

Demote or reparent an item when its meaning makes the correction clear. Ask when
several corrections would change the intended outcome. Do not invent child
outcomes to preserve an epic label.

Treat source dependencies as candidate queue order, not automatic Workbench
edges. Keep an edge only when evidence shows that serial work reduces rework,
ambiguity, or integration risk, and mark the item `blocked`. Leave independent
items edge-free and `active`. Preserve useful non-obvious ordering context in
ordinary item prose, but do not require or manufacture a dedicated explanation
section.

## Convention reconciliation

Inventory candidate rules with their source paths and observed behavior. Surface
conflicts rather than choosing silently. Recommend a consolidated rule when
evidence supports one, including the cost of adoption.

Examples of evidence-based proposals:

- CI consistently runs checks absent from local instructions → propose making
  them authoritative completion checks;
- real external consumers exist → propose compatibility obligations;
- data migrations recur → propose approval, backup, and rollback evidence;
- UI journeys dominate regressions → propose browser-based journey checks;
- foundation docs repeatedly drift → propose repository-specific affected-doc
  or review evidence beyond Workbench's baseline completion reconciliation;
- useful adjacent findings recur → propose an explicit park-with-evidence rule;
- implementation-coupled tests churn → propose behavior-focused checks at
  stable interfaces where each test protects enough meaningful behavior or risk
  to justify its maintenance cost;
- established feature squashes, checkpoint commits, integration batches, or a
  preserve-history policy → propose the matching `commit_posture`, accounting
  for merge policy and whether agents share branches;
- an established preference for one main runner or dedicated delivery roles →
  propose the matching `execution_posture`, treating item size as a routing hint
  rather than a threshold;
- a repository-specific practice with no Workbench category — such as generated
  file regeneration or changelog discipline — → propose it in its narrowest
  authoritative home, not as a new frontmatter field.

No proposal becomes binding without user confirmation. A legacy workflow rule
that commits every item transition is process machinery, not evidence that the
project prefers checkpoint granularity; infer commit posture from repository Git
practice and explicit policy instead. Setup always offers Workbench's optional
configurations regardless of repository evidence. Inspect coding, structural,
and pattern sources on every setup run to discover unique, repository-specific
convention candidates — including candidates outside Workbench's named
configuration — but do not manufacture ungrounded preferences. Create the
canonical empty pattern index when no reusable pattern truth exists; do not
manufacture pattern references to populate it.

For legacy refactor-convention and pattern artifacts, classify each useful rule
before removal:

- mechanical rules → formatter or linter configuration;
- concise operating rules → `AGENTS.md`;
- structural ownership and import constraints → architecture foundations;
- engineering decision rules → principle foundations;
- proven recurring implementation shapes → `.agents/skills/patterns/`.

The pattern catalog keeps one portable `SKILL.md` navigation index and focused
references. When `.agents` and `.claude` copies diverge, preserve user-authored
content, surface the conflict, and consolidate the confirmed result into the
`.agents` catalog. Split mixed rule files by meaning before removal. Default a
short release expectation to inline conventions; preserve detailed reusable
evidence-based scanning guidance as a project-local
`.agents/skills/scan-<name>/` lens only after explicit user confirmation. Remove
generated wrappers, rule digests,
reports, extraction commands, and workflow-specific scanner orchestration after
useful content and inbound references move. When root `CLAUDE.md`
exists after reconciliation, replace the Claude pattern mirror with a relative
`.claude/skills/patterns` symlink to `../../.agents/skills/patterns`.

Proactively offer root `CLAUDE.md` as a relative symlink with target `AGENTS.md`,
even when `CLAUDE.md` is absent. Treat a correct symlink as
conformant. Inspect symlinks themselves rather than following them for removal.
Classify regular files and directories, broken links, wrong-target links, and
divergent mirrors. Consolidate useful content first, then apply the normal
tracked, modified, untracked, ignored, and exact-confirmation rules before
replacement. Do not create a new pattern from generic advice or audit every
retained pattern against the code during setup.

## Cleanup safety

Before converting or removing a source root, recursively census every contained
leaf artifact, including tracked, untracked, ignored, and symlink entries;
inventory a symlink itself rather than traversing its target. Keep the census
as ephemeral setup state rather than a committed migration manifest or report.
A shallow directory walk is not an inventory of nested content. Refresh the
census immediately before cleanup so an artifact that entered the source root
during the run receives a disposition rather than disappearing with the tree.

Key the disposition table by leaf artifact. Every entry contains the source
path, target path or redundancy evidence, Git/recovery class, inbound
references, and validation result. A directory-level disposition never accounts
for its contents. Resolve exact targets; do not use broad globs or unresolved
environment variables for deletion.

Before cleanup, derive the authorized removal set from the leaf dispositions. A
source path belongs to this set exactly when its artifact must no longer exist at
that path after cleanup: removed outright, moved elsewhere, or consolidated
away. A leaf converted or consolidated in place remains in the census but not in
the removal set; verify its converted content at its destination instead of
expecting it to disappear. Confirm that planned cleanup touches no source path
outside the authorized set.

Do not recursively remove a source tree until every contained artifact has an
explicit disposition and retained content is verified at its destination. Never
suppress the evidence of what was removed, even then; the per-file record of a
recursive removal is the last cheap accounting check. Empty directories may be
removed afterward.

After cleanup, compare the pre-cleanup census with surviving source paths and
compare tracked deletions with the authorized removal set. Stop on any unexpected
removal or survivor. Git history cannot recover an untracked artifact omitted
from the census, so this reconciliation supplements rather than replaces the
recursive pre-cleanup accounting.

Clean tracked content is recoverable from Git. Preserve unrelated changes.
Require a pre-state commit or exact-list confirmation before removing modified,
untracked, ignored, unversioned, or otherwise unrecoverable content. Verify
retained content block by block at its destination, and rewrite every inbound
reference before removal. If content cannot be classified safely, stop with the
specific ambiguity rather than leaving two active workflow systems.

Remove repository-scoped competing workflow plugins after conversion. Report
user- or machine-scoped competing installations precisely so the user can
uninstall them; setup does not silently mutate external scope.

## Idempotency

After conversion:

- one system owns `.work/`;
- conventions carry the exact loaded Workbench version;
- no old workflow hooks, binaries, managed rules, or indexes remain;
- no meaningful decision lives only in removed state;
- the canonical pattern catalog has one valid portable index, resolved
  references, and no competing generated wrapper or mirror;
- no completed item remains active;
- all references resolve;
- running setup again yields no material diff.
