# Migration Rules

## Semantic mapping

| Source meaning | Destination |
|---|---|
| Active epic, initiative, feature, task, change, proposal | `.work/active/` |
| Deferred idea | `.work/backlog/` |
| Outcome-specific plan or design | Corresponding work-item body |
| Current or intended project direction | Focused `docs/` foundation |
| Fetched evidence or grounded synthesis | `.research/` |
| Completed outcome worth retaining | Completion stub or release summary |
| Session or resume state | Fold durable discoveries into work, then remove |
| Generated navigation or cache | Rebuild knowledge index, then remove |
| Workflow hooks, binaries, managed rules | Remove after target validation |
| Duplicate or historical foundations | Consolidate current truth, then remove |

## Known source hints

Treat these only as discovery hints; inspect actual content before mapping:

- agile-workflow: `.work/active/{epics,features,stories}`, stage frontmatter,
  `work-view`, managed rules, hooks, gates, and release directories;
- GSD: `.planning/`, phase plans, state and progress files;
- OpenSpec: `openspec/changes`, proposals, specs, and archived changes;
- generic agent plans: `.claude/plans`, `.codex`, task files, TODO ledgers,
  roadmaps, resume state, and session summaries.

Flatten source stage or folder taxonomies into meaning. Do not preserve stage
narration.

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
ambiguity, or integration risk. Put its reason in `## Sequencing` and mark the
item `blocked`. Leave independent items edge-free and `active`. If a legacy edge
has no recoverable reason, recommend removing it and ask once about the
ambiguous edge set. Never fabricate a reason to satisfy validation.

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
  to justify its maintenance cost.

No proposal becomes binding without user confirmation.

## Cleanup safety

Before removal, maintain a disposition table containing source path, target
path or redundancy evidence, Git/recovery class, inbound references, and
validation result. Resolve exact targets; do not use broad globs or unresolved
environment variables for deletion.

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
- no old workflow hooks, binaries, managed rules, or indexes remain;
- no meaningful decision lives only in removed state;
- no completed item remains active;
- all references resolve;
- running setup again yields no material diff.
